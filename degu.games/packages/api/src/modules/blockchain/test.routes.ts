import { Router } from "express";
import { TestController } from "./test.controller";

const router = Router();

// Faucet endpoints
router.post("/claim-tokens", TestController.claimTokens);
router.get("/can-claim/:address", TestController.canClaim);
router.get("/last-claim/:address", TestController.getLastClaim);

// Token info
router.get("/token-info", TestController.getTokenInfo);
router.get("/balance/:address", TestController.getBalance);

// ERC20 standard operations
router.post("/transfer", TestController.transfer);
router.post("/approve", TestController.approve);
router.get("/allowance/:owner/:spender", TestController.getAllowance);
router.post("/burn", TestController.burn);

// Utility
router.post("/address-from-key", TestController.getAddressFromKey);

export default router;
