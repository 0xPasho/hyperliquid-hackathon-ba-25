import { Router } from 'express';
import blockchainController from './blockchain.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Read-only endpoints (no authentication required)
router.get('/token-info', blockchainController.getTokenInfo);
router.get('/balance/:address', blockchainController.getBalance);
router.get('/native-balance/:address', blockchainController.getNativeBalance);
router.get('/can-claim/:address', blockchainController.canClaimTokens);
router.get('/last-claim/:address', blockchainController.getLastClaim);
router.get('/allowance', blockchainController.getAllowance);

// Betting read-only endpoints
router.get('/betting/contract-address', blockchainController.getBettingContractAddress);
router.get('/betting/game/:gameId', blockchainController.getBettingGameDetails);
router.get('/betting/total-games', blockchainController.getTotalBettingGames);
router.get('/betting/has-joined', blockchainController.hasPlayerJoinedGame);

// Write endpoints (require authentication)
router.post('/claim', authMiddleware, blockchainController.claimFreeTokens);
router.post('/transfer', authMiddleware, blockchainController.transfer);
router.post('/approve', authMiddleware, blockchainController.approve);
router.post('/burn', authMiddleware, blockchainController.burn);

// Betting write endpoints (require authentication)
router.post('/betting/create-game', authMiddleware, blockchainController.createBettingGame);
router.post('/betting/join-game', authMiddleware, blockchainController.joinBettingGame);
router.post('/betting/start-game', authMiddleware, blockchainController.startBettingGame);
router.post('/betting/select-winners', authMiddleware, blockchainController.selectWinners);
router.post('/betting/claim-prize', authMiddleware, blockchainController.claimBettingPrize);
router.post('/betting/cancel-game', authMiddleware, blockchainController.cancelBettingGame);

// GameEscrow read-only endpoints (Base testnet)
router.get('/game-escrow/contract-address', blockchainController.getGameEscrowAddress);
router.get('/game-escrow/usdc-address', blockchainController.getUSDCAddress);
router.get('/game-escrow/:gameId', blockchainController.getGameEscrowDetails);
router.get('/game-escrow/player-info', blockchainController.getGameEscrowPlayerInfo);
router.get('/erc20-balance', blockchainController.getERC20Balance);

// GameEscrow write endpoints (Base testnet, require authentication)
router.post('/game-escrow/create', authMiddleware, blockchainController.createGameEscrowGame);
router.post('/game-escrow/join', authMiddleware, blockchainController.joinGameEscrowGame);
router.post('/game-escrow/cancel', authMiddleware, blockchainController.cancelGameEscrowGame);
router.post('/game-escrow/report-result', authMiddleware, blockchainController.reportGameEscrowResult);
router.post('/erc20-approve', authMiddleware, blockchainController.approveERC20);

export default router;
