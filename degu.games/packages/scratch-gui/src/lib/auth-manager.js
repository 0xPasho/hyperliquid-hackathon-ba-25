/**
 * Authentication Manager for Scratch GUI
 * Handles cross-domain session sync with the main web app
 * Simplified for room-based betting architecture
 */

class AuthManager {
    constructor() {
        this.API_URL = process.env.API_URL || "http://localhost:3000/api/v1";
        this.apiBaseUrl = this.API_URL; // Alias for backward compatibility
        this.WEB_APP_URL = process.env.NODE_ENV === "production"
            ? "https://degu.games"
            : "http://localhost:3001";
        this.COOKIE_DOMAIN = process.env.NODE_ENV === "production"
            ? ".degu.games" // Shared across all subdomains
            : "localhost"; // Shared across all localhost ports
        this.token = null;
        this.user = null;
        this.walletAddress = null;
        this.listeners = [];
        this.initialized = false;
        this.initPromise = null;

        // Set up postMessage listener IMMEDIATELY
        window.addEventListener("message", this.handlePostMessage.bind(this));
        console.log("[AuthManager] PostMessage listener set up");
    }

    /**
     * Get cookie value by name
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    }

    /**
     * Set cookie with domain support for subdomain sharing
     */
    setCookie(name, value, days = 365) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = `expires=${date.toUTCString()}`;

        document.cookie = `${name}=${value}; ${expires}; path=/; domain=${this.COOKIE_DOMAIN}; SameSite=Lax`;

        console.log(`[AuthManager] Cookie set: ${name} on domain ${this.COOKIE_DOMAIN}`);
    }

    /**
     * Delete cookie
     */
    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${this.COOKIE_DOMAIN}`;
    }

    /**
     * Initialize auth by checking for token in:
     * 1. URL query params (for direct links from web app)
     * 2. Cookies (shared across subdomains)
     * 3. localStorage (fallback)
     * 4. Request from parent (if in iframe)
     */
    async init() {
        if (this.initialized) {
            console.log("[AuthManager] Already initialized, skipping");
            return this;
        }

        if (this.initPromise) {
            console.log("[AuthManager] Initialization in progress, waiting...");
            return this.initPromise;
        }

        this.initPromise = this._doInit();
        const result = await this.initPromise;
        this.initialized = true;
        this.initPromise = null;
        return result;
    }

    async _doInit() {
        console.log("[AuthManager] Initializing...");

        // 1. Check URL for token
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get("token");

        if (tokenFromUrl) {
            console.log("[AuthManager] Token found in URL");
            this.token = tokenFromUrl;
            this.setCookie("authToken", tokenFromUrl);
            localStorage.setItem("authToken", tokenFromUrl);

            // Clean URL (remove token from address bar for security)
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);

            await this.fetchUserDataWithRetry();
            return this;
        }

        // 2. Check cookie for token
        if (!this.token) {
            const cookieToken = this.getCookie("authToken");
            if (cookieToken) {
                console.log("[AuthManager] Token found in cookie");
                this.token = cookieToken;
                localStorage.setItem("authToken", cookieToken);
                await this.fetchUserDataWithRetry();
                return this;
            }
        }

        // 3. Check localStorage for existing session
        if (!this.token) {
            const storedToken = localStorage.getItem("authToken");
            if (storedToken) {
                console.log("[AuthManager] Token found in localStorage");
                this.token = storedToken;
                this.setCookie("authToken", storedToken);
                await this.fetchUserDataWithRetry();
                return this;
            }
        }

        // 4. If no token found, try requesting from parent (if in iframe)
        if (!this.token && window.parent !== window) {
            console.log("[AuthManager] No token found, requesting from parent window");
            this.requestAuthFromParent();
            await this.waitForAuth(3000);
        }

        return this;
    }

    /**
     * Wait for authentication to be set
     */
    async waitForAuth(timeout = 3000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (this.isAuthenticated()) {
                console.log("[AuthManager] Authentication confirmed");
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.warn("[AuthManager] Authentication timeout after", timeout, "ms");
        return false;
    }

    /**
     * Handle PostMessage from parent window or web app
     */
    handlePostMessage(event) {
        console.log("[AuthManager] 📨 Received postMessage:", {
            origin: event.origin,
            type: event.data?.type,
        });

        // Security: Only accept messages from trusted origins
        const trustedOrigins = [this.WEB_APP_URL, window.location.origin];
        if (!trustedOrigins.includes(event.origin)) {
            console.warn("[AuthManager] ❌ Rejected message from untrusted origin:", event.origin);
            return;
        }

        const { type, data } = event.data;

        switch (type) {
            case "AUTH_TOKEN":
                console.log("[AuthManager] ✅ Received AUTH_TOKEN message");
                this.token = data.token;

                localStorage.setItem("authToken", data.token);
                this.setCookie("authToken", data.token);

                if (data.user) {
                    this.user = data.user;
                    this.walletAddress = data.user.walletAddress;
                    console.log("[AuthManager] User data received:", {
                        id: data.user.id,
                        name: data.user.name,
                        walletAddress: data.user.walletAddress,
                    });
                } else {
                    this.fetchUserDataWithRetry().catch((err) => {
                        console.error("[AuthManager] Failed to fetch user data:", err);
                    });
                }

                this.notifyListeners();
                break;

            case "AUTH_LOGOUT":
                console.log("[AuthManager] Received logout via postMessage");
                this.logout();
                break;

            case "REQUEST_AUTH_STATUS":
                event.source.postMessage(
                    {
                        type: "AUTH_STATUS_RESPONSE",
                        data: {
                            isAuthenticated: this.isAuthenticated(),
                            user: this.user,
                            walletAddress: this.walletAddress,
                        },
                    },
                    event.origin
                );
                break;

            case "ROOM_CONTEXT":
                console.log("[AuthManager] ✅ Received ROOM_CONTEXT message", data);
                // Set room context on window object for the blockchain extension to access
                if (typeof window !== 'undefined') {
                    window.roomContext = data;
                    console.log("[AuthManager] Room context set on window:", window.roomContext);
                }
                break;
        }
    }

    /**
     * Request auth token from parent window (if in iframe)
     */
    requestAuthFromParent() {
        window.parent.postMessage(
            {
                type: "REQUEST_AUTH_TOKEN",
                data: {},
            },
            this.WEB_APP_URL
        );
    }

    /**
     * Fetch user data from API using token with retry logic
     */
    async fetchUserDataWithRetry(maxRetries = 3, retryDelay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[AuthManager] Fetching user data (attempt ${attempt}/${maxRetries})`);
                await this.fetchUserData();

                if (this.user) {
                    console.log("[AuthManager] ✅ User data fetch successful");
                    return;
                }
            } catch (error) {
                console.error(`[AuthManager] Fetch attempt ${attempt} failed:`, error);

                if (attempt < maxRetries) {
                    console.log(`[AuthManager] Retrying in ${retryDelay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, retryDelay));
                } else {
                    console.error("[AuthManager] ❌ All fetch attempts failed");
                    throw error;
                }
            }
        }
    }

    /**
     * Fetch user data from API using token
     */
    async fetchUserData() {
        if (!this.token) {
            console.warn("[AuthManager] No token available to fetch user data");
            throw new Error("No token available");
        }

        const url = `${this.API_URL}/auth/me`;
        console.log("[AuthManager] Fetching user data from:", url);

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            console.log("[AuthManager] Response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[AuthManager] Error response body:", errorText);

                if (response.status === 401 || response.status === 403) {
                    console.error("[AuthManager] Token is invalid or forbidden");
                    this.logout();
                    throw new Error("Invalid or forbidden token");
                }
                throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
            }

            const responseData = await response.json();
            const userData = responseData.data || responseData;

            this.user = userData;
            this.walletAddress = userData.walletAddress;

            console.log("[AuthManager] ✅ User data fetched successfully:", {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                walletAddress: this.walletAddress,
            });

            this.notifyListeners();
        } catch (error) {
            console.error("[AuthManager] Error fetching user data:", error);
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }

    /**
     * Get wallet address
     */
    getWalletAddress() {
        return this.walletAddress;
    }

    /**
     * Get auth token
     */
    getToken() {
        return this.token;
    }

    /**
     * Logout user
     */
    logout() {
        console.log("[AuthManager] Logging out");
        this.token = null;
        this.user = null;
        this.walletAddress = null;

        localStorage.removeItem("authToken");
        this.deleteCookie("authToken");

        this.notifyListeners();
    }

    /**
     * Subscribe to auth state changes
     */
    onChange(callback) {
        this.listeners.push(callback);

        callback({
            isAuthenticated: this.isAuthenticated(),
            user: this.user,
            walletAddress: this.walletAddress,
        });

        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify all listeners of auth state changes
     */
    notifyListeners() {
        const state = {
            isAuthenticated: this.isAuthenticated(),
            user: this.user,
            walletAddress: this.walletAddress,
        };

        this.listeners.forEach((callback) => callback(state));
    }

    /**
     * Open web app login in popup
     */
    openLoginPopup() {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            `${this.WEB_APP_URL}/login?redirect=scratch`,
            "Login",
            `width=${width},height=${height},left=${left},top=${top}`
        );

        const messageHandler = (event) => {
            if (event.origin !== this.WEB_APP_URL) return;

            if (event.data.type === "AUTH_SUCCESS") {
                this.token = event.data.data.token;
                localStorage.setItem("authToken", this.token);
                this.fetchUserData();

                if (popup && !popup.closed) {
                    popup.close();
                }

                window.removeEventListener("message", messageHandler);
            }
        };

        window.addEventListener("message", messageHandler);

        const checkClosed = setInterval(() => {
            if (popup && popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener("message", messageHandler);
            }
        }, 500);
    }
}

// Create singleton instance
const authManager = new AuthManager();

// Export for use in other modules
export default authManager;
