import { Router } from "express";
import roomController from "./room.controller";
import roomCommentController from "./room-comment.controller";
import { authMiddleware, optionalAuthMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Prepare blockchain game (before payment)
router.post("/prepare", roomController.prepareBlockchainGame.bind(roomController));

// Create a new room
router.post("/", roomController.createRoom.bind(roomController));

// Get all active rooms (global lobby)
router.get("/active", roomController.getActiveRooms.bind(roomController));

// Get room by blockchain game ID
router.get("/blockchain/:gameId", roomController.getRoomByBlockchainGameId.bind(roomController));

// Get rooms for a specific project
router.get("/project/:projectId", roomController.getRoomsByProject.bind(roomController));

// Get project statistics (total volume and total players)
router.get("/project/:projectId/stats", roomController.getProjectStats.bind(roomController));

// Get a specific room
router.get("/:id", roomController.getRoom.bind(roomController));

// Update a room
router.put("/:id", roomController.updateRoom.bind(roomController));

// Delete a room
router.delete("/:id", roomController.deleteRoom.bind(roomController));

// Join a room
router.post("/:id/join", roomController.joinRoom.bind(roomController));

// Pay entry fee for a room (creates escrow for creator, joins for players)
router.post("/:id/pay", authMiddleware, roomController.payRoomEntry.bind(roomController));

// Cancel a room (host only, when alone)
router.post("/:id/cancel", roomController.cancelRoom.bind(roomController));

// Leave a room
router.post("/:id/leave", roomController.leaveRoom.bind(roomController));

// Toggle ready status
router.post("/:id/ready", roomController.toggleReady.bind(roomController));

// Start a game
router.post("/:id/start", roomController.startGame.bind(roomController));

// Complete a game
router.post("/:id/complete", roomController.completeGame.bind(roomController));

// Room Comments
router.post("/:roomId/comments", optionalAuthMiddleware, roomCommentController.createComment.bind(roomCommentController));
router.get("/:roomId/comments", roomCommentController.getRoomComments.bind(roomCommentController));
router.put("/:roomId/comments/:commentId", optionalAuthMiddleware, roomCommentController.updateComment.bind(roomCommentController));
router.delete("/:roomId/comments/:commentId", optionalAuthMiddleware, roomCommentController.deleteComment.bind(roomCommentController));

export default router;
