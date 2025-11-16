/**
 * API Client for Scratch Project Backend
 */

const API_BASE_URL = process.env.API_URL; //"https://api.degu.games/api/v1"; //process.env.API_URL || "http://localhost:3000/api/v1";

class APIClient {
    /**
     * Create a new project
     * @param {Object} options - Project options
     * @param {string} options.title - Project title
     * @param {Object} options.projectData - Scratch project JSON
     * @returns {Promise<Object>} Created project
     */
    static async createProject({
        title = "Untitled",
        projectData = null,
    } = {}) {
        // Get auth token from localStorage if available
        const authToken =
            typeof localStorage !== "undefined"
                ? localStorage.getItem("authToken")
                : null;

        const headers = {
            "Content-Type": "application/json",
        };

        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                title,
                ...(projectData && { projectData }),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                "[APIClient] Create project failed:",
                response.status,
                errorText
            );
            throw new Error(
                `Failed to create project: ${response.statusText} - ${errorText}`
            );
        }

        const result = await response.json();
        console.log("[APIClient] Project created successfully:", result.data);
        return result.data;
    }

    /**
     * Get a project by ID
     * @param {string} projectId - Project ID
     * @returns {Promise<Object>} Project data
     */
    static async getProject(projectId) {
        // Get auth token from auth-manager if available
        const authToken =
            typeof localStorage !== "undefined"
                ? localStorage.getItem("authToken")
                : null;

        const headers = {
            "Content-Type": "application/json",
        };

        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            headers,
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Project not found");
            }
            throw new Error(`Failed to fetch project: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data;
    }

    /**
     * Update a project
     * @param {string} projectId - Project ID
     * @param {Object} updates - Updates to apply
     * @param {string} updates.title - New title
     * @param {Object} updates.projectData - New project data
     * @returns {Promise<Object>} Updated project
     */
    static async updateProject(projectId, { title, projectData }) {
        // Get auth token from localStorage if available
        const authToken =
            typeof localStorage !== "undefined"
                ? localStorage.getItem("authToken")
                : null;

        const headers = {
            "Content-Type": "application/json",
        };

        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({
                ...(title && { title }),
                ...(projectData && { projectData }),
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update project: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data;
    }

    /**
     * Delete a project
     * @param {string} projectId - Project ID
     * @returns {Promise<void>}
     */
    static async deleteProject(projectId) {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Failed to delete project: ${response.statusText}`);
        }
    }

    /**
     * List all projects
     * @returns {Promise<Array>} List of projects
     */
    static async listProjects() {
        const response = await fetch(`${API_BASE_URL}/projects`);

        if (!response.ok) {
            throw new Error(`Failed to list projects: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data;
    }
}

export default APIClient;
