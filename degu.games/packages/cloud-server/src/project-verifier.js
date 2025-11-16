/**
 * Project Verification Handler
 *
 * Verifies that games are using approved/registered projects
 * to prevent code tampering and cheating.
 */

const logger = require('./logger');
const fetch = require('node-fetch');
const crypto = require('crypto');

class ProjectVerifier {
    constructor() {
        // Cache verified projects to reduce API calls
        // { projectId: { hash, metadata, verified, cachedAt } }
        this.verifiedProjects = new Map();

        // { roomId: projectId }
        this.roomProjects = new Map();

        // Configuration
        this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
        this.serverToken = process.env.CLOUD_SERVER_TOKEN || 'cloud_server_token_here';
        this.verificationEnabled = process.env.VERIFY_PROJECTS !== 'false';
        this.cacheEnabled = process.env.CACHE_PROJECT_METADATA !== 'false';
        this.cacheTTL = parseInt(process.env.PROJECT_CACHE_TTL || '3600000'); // 1 hour default

        logger.info('[ProjectVerifier] Initialized');
        logger.info(`[ProjectVerifier] Verification enabled: ${this.verificationEnabled}`);
        logger.info(`[ProjectVerifier] Cache enabled: ${this.cacheEnabled}`);
    }

    /**
     * Verify project with backend API
     * @param {string} roomId - Room ID
     * @param {string} projectId - Scratch project ID
     * @param {string} projectHash - SHA-256 hash of project
     * @returns {Promise<{verified: boolean, metadata: object}>}
     */
    async verifyProject(roomId, projectId, projectHash) {
        logger.info(`[ProjectVerifier] Room ${roomId}: Verifying project ${projectId}`);

        // Skip verification if disabled
        if (!this.verificationEnabled) {
            logger.warn(`[ProjectVerifier] Verification disabled, allowing project ${projectId}`);
            return { verified: true, metadata: {} };
        }

        // Check cache first
        if (this.cacheEnabled && this.verifiedProjects.has(projectId)) {
            const cached = this.verifiedProjects.get(projectId);
            const age = Date.now() - cached.cachedAt;

            if (age < this.cacheTTL) {
                logger.info(`[ProjectVerifier] Using cached data for project ${projectId} (age: ${Math.floor(age / 1000)}s)`);

                // Verify hash matches
                if (cached.hash !== projectHash) {
                    logger.error(`[ProjectVerifier] Hash mismatch for project ${projectId}!`);
                    logger.error(`[ProjectVerifier] Expected: ${cached.hash}`);
                    logger.error(`[ProjectVerifier] Received: ${projectHash}`);
                    return { verified: false, metadata: null, error: 'Hash mismatch - project has been modified' };
                }

                this.roomProjects.set(roomId, projectId);
                return { verified: cached.verified, metadata: cached.metadata };
            } else {
                logger.debug(`[ProjectVerifier] Cache expired for project ${projectId}, refetching`);
                this.verifiedProjects.delete(projectId);
            }
        }

        // Call backend API to verify
        try {
            const url = `${this.apiUrl}/game/verify-project/${projectId}`;

            logger.debug(`[ProjectVerifier] Calling API: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.serverToken}`,
                    'Content-Type': 'application/json',
                    'X-Cloud-Server': 'true',
                    'X-Project-Hash': projectHash
                },
                timeout: 10000
            });

            const responseText = await response.text();

            if (!response.ok) {
                logger.error(`[ProjectVerifier] API error: ${response.status} - ${responseText}`);

                // If API is down, decide based on configuration
                if (response.status >= 500) {
                    const allowOnError = process.env.ALLOW_UNVERIFIED_ON_API_ERROR === 'true';
                    if (allowOnError) {
                        logger.warn(`[ProjectVerifier] API down, allowing unverified project (ALLOW_UNVERIFIED_ON_API_ERROR=true)`);
                        return { verified: true, metadata: {}, warning: 'Verification API unavailable' };
                    }
                }

                return {
                    verified: false,
                    metadata: null,
                    error: `API returned ${response.status}: ${responseText}`
                };
            }

            const result = JSON.parse(responseText);

            if (!result.success) {
                logger.error(`[ProjectVerifier] Verification failed: ${result.error || 'Unknown error'}`);
                return { verified: false, metadata: null, error: result.error };
            }

            const projectData = result.data;

            // Verify hash matches
            if (projectData.projectHash !== projectHash) {
                logger.error(`[ProjectVerifier] Hash mismatch for project ${projectId}!`);
                logger.error(`[ProjectVerifier] Backend hash: ${projectData.projectHash}`);
                logger.error(`[ProjectVerifier] Provided hash: ${projectHash}`);
                return {
                    verified: false,
                    metadata: null,
                    error: 'Hash mismatch - project has been modified'
                };
            }

            // Check approval status
            const approvalStatus = projectData.approvalStatus || projectData.approval_status;
            const isApproved = approvalStatus === 'approved';

            if (!isApproved) {
                logger.warn(`[ProjectVerifier] Project ${projectId} not approved (status: ${approvalStatus})`);

                const requireApproval = process.env.REQUIRE_PROJECT_APPROVAL !== 'false';
                if (requireApproval) {
                    return {
                        verified: false,
                        metadata: projectData.metadata,
                        error: `Project not approved (status: ${approvalStatus})`
                    };
                } else {
                    logger.warn(`[ProjectVerifier] Allowing unapproved project (REQUIRE_PROJECT_APPROVAL=false)`);
                }
            }

            // Cache the result
            if (this.cacheEnabled) {
                this.verifiedProjects.set(projectId, {
                    hash: projectData.projectHash,
                    metadata: projectData.metadata || {},
                    verified: isApproved,
                    cachedAt: Date.now()
                });
            }

            // Associate room with project
            this.roomProjects.set(roomId, projectId);

            logger.info(`[ProjectVerifier] ✅ Project ${projectId} verified successfully`);
            logger.info(`[ProjectVerifier] Game mode: ${projectData.metadata?.gameMode || 'single'}`);
            logger.info(`[ProjectVerifier] Max rounds: ${projectData.metadata?.maxRounds || 1}`);

            return {
                verified: true,
                metadata: projectData.metadata || {}
            };

        } catch (error) {
            logger.error(`[ProjectVerifier] Error verifying project: ${error.message}`);
            logger.error(`[ProjectVerifier] Stack: ${error.stack}`);

            // Decide whether to allow on error
            const allowOnError = process.env.ALLOW_UNVERIFIED_ON_API_ERROR === 'true';
            if (allowOnError) {
                logger.warn(`[ProjectVerifier] Allowing unverified project due to error (ALLOW_UNVERIFIED_ON_API_ERROR=true)`);
                return { verified: true, metadata: {}, warning: error.message };
            }

            return {
                verified: false,
                metadata: null,
                error: `Verification error: ${error.message}`
            };
        }
    }

    /**
     * Check if a room is using a verified project
     * @param {string} roomId - Room ID
     * @returns {boolean}
     */
    isProjectVerified(roomId) {
        const projectId = this.roomProjects.get(roomId);
        if (!projectId) {
            return false;
        }

        const cached = this.verifiedProjects.get(projectId);
        return cached ? cached.verified : false;
    }

    /**
     * Get project metadata for a room
     * @param {string} roomId - Room ID
     * @returns {object|null}
     */
    getProjectMetadata(roomId) {
        const projectId = this.roomProjects.get(roomId);
        if (!projectId) {
            logger.warn(`[ProjectVerifier] No project associated with room ${roomId}`);
            return null;
        }

        const cached = this.verifiedProjects.get(projectId);
        if (!cached) {
            logger.warn(`[ProjectVerifier] No cached data for project ${projectId}`);
            return null;
        }

        return cached.metadata;
    }

    /**
     * Get project ID for a room
     * @param {string} roomId - Room ID
     * @returns {string|null}
     */
    getProjectId(roomId) {
        return this.roomProjects.get(roomId) || null;
    }

    /**
     * Remove room association (on room close)
     * @param {string} roomId - Room ID
     */
    removeRoom(roomId) {
        this.roomProjects.delete(roomId);
        logger.debug(`[ProjectVerifier] Removed room ${roomId}`);
    }

    /**
     * Clear cache for a specific project
     * @param {string} projectId - Project ID
     */
    clearCache(projectId) {
        this.verifiedProjects.delete(projectId);
        logger.info(`[ProjectVerifier] Cleared cache for project ${projectId}`);
    }

    /**
     * Clear all cache
     */
    clearAllCache() {
        this.verifiedProjects.clear();
        logger.info(`[ProjectVerifier] Cleared all project cache`);
    }

    /**
     * Get cache statistics
     * @returns {object}
     */
    getCacheStats() {
        return {
            cachedProjects: this.verifiedProjects.size,
            activeRooms: this.roomProjects.size,
            cacheEnabled: this.cacheEnabled,
            verificationEnabled: this.verificationEnabled
        };
    }

    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [projectId, data] of this.verifiedProjects.entries()) {
            const age = now - data.cachedAt;
            if (age > this.cacheTTL) {
                this.verifiedProjects.delete(projectId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`[ProjectVerifier] Cleaned up ${cleaned} expired cache entries`);
        }
    }

    /**
     * Generate SHA-256 hash of project data
     * @param {object} projectData - Project data to hash
     * @returns {string} - Hex hash
     */
    static hashProject(projectData) {
        const jsonString = JSON.stringify(projectData);
        return crypto.createHash('sha256').update(jsonString).digest('hex');
    }
}

// Create singleton instance
const projectVerifier = new ProjectVerifier();

// Cleanup interval (every 30 minutes)
setInterval(() => {
    projectVerifier.cleanupCache();
}, 30 * 60 * 1000);

module.exports = projectVerifier;
