import dotenv from "dotenv";

// Load environment variables before importing anything else
dotenv.config();

import { createServer } from "http";
import createApp from "./app";
import Database from "./modules/config/database";
import { lobbyWebSocket } from "./lib/lobby.websocket";

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
    try {
        // Initialize database connection
        const database = Database.getInstance();
        await database.connect();

        // Create Express app
        const app = createApp();

        // Create HTTP server
        const httpServer = createServer(app);

        // Initialize WebSocket server
        lobbyWebSocket.initialize(httpServer);

        // Start server
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🔌 WebSocket server ready at ws://localhost:${PORT}/socket.io/lobby/`);
        });

        // Handle graceful shutdown
        process.on("SIGTERM", async () => {
            console.log("SIGTERM received, shutting down gracefully...");
            await database.disconnect();
            httpServer.close();
            process.exit(0);
        });

        process.on("SIGINT", async () => {
            console.log("SIGINT received, shutting down gracefully...");
            await database.disconnect();
            httpServer.close();
            process.exit(0);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

export { startServer };
