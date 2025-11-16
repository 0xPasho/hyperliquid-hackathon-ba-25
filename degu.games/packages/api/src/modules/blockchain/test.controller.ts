import { Request, Response } from "express";
import blockchainService from "./blockchain.service";

/**
 * Test Controller for ERC20 Contract Interactions
 *
 * All endpoints require privateKey in request body or query
 */
export class TestController {
  /**
   * POST /api/v1/test/claim-tokens
   * Claim 1000 free DEGU tokens
   *
   * Body: { privateKey: string }
   */
  public static claimTokens = async (req: Request, res: Response) => {
    try {
      const { privateKey } = req.body;

      if (!privateKey) {
        return res.status(400).json({
          success: false,
          error: "privateKey is required in request body"
        });
      }

      const address = blockchainService.getAddressFromPrivateKey(privateKey);
      const result = await blockchainService.claimFreeTokens(privateKey);

      return res.status(200).json({
        address,
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /api/v1/test/can-claim/:address
   * Check if address can claim tokens
   */
  public static canClaim = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: "address parameter is required"
        });
      }

      const result = await blockchainService.canClaimTokens(address);

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /api/v1/test/balance/:address
   * Get token balance
   */
  public static getBalance = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: "address parameter is required"
        });
      }

      const result = await blockchainService.getBalance(address);

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /api/v1/test/token-info
   * Get token contract information
   */
  public static getTokenInfo = async (_: Request, res: Response) => {
    try {
      const result = await blockchainService.getTokenInfo();

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * POST /api/v1/test/transfer
   * Transfer tokens to another address
   *
   * Body: { privateKey: string, to: string, amount: string }
   */
  public static transfer = async (req: Request, res: Response) => {
    try {
      const { privateKey, to, amount } = req.body;

      if (!privateKey || !to || !amount) {
        return res.status(400).json({
          success: false,
          error: "privateKey, to, and amount are required"
        });
      }

      const from = blockchainService.getAddressFromPrivateKey(privateKey);
      const result = await blockchainService.transfer(privateKey, to, amount);

      return res.status(200).json({
        from,
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * POST /api/v1/test/approve
   * Approve spender to spend tokens
   *
   * Body: { privateKey: string, spender: string, amount: string }
   */
  public static approve = async (req: Request, res: Response) => {
    try {
      const { privateKey, spender, amount } = req.body;

      if (!privateKey || !spender || !amount) {
        return res.status(400).json({
          success: false,
          error: "privateKey, spender, and amount are required"
        });
      }

      const owner = blockchainService.getAddressFromPrivateKey(privateKey);
      const result = await blockchainService.approve(privateKey, spender, amount);

      return res.status(200).json({
        owner,
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /api/v1/test/allowance/:owner/:spender
   * Get allowance amount
   */
  public static getAllowance = async (req: Request, res: Response) => {
    try {
      const { owner, spender } = req.params;

      if (!owner || !spender) {
        return res.status(400).json({
          success: false,
          error: "owner and spender parameters are required"
        });
      }

      const result = await blockchainService.getAllowance(owner, spender);

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * POST /api/v1/test/burn
   * Burn tokens (reduce supply)
   *
   * Body: { privateKey: string, amount: string }
   */
  public static burn = async (req: Request, res: Response) => {
    try {
      const { privateKey, amount } = req.body;

      if (!privateKey || !amount) {
        return res.status(400).json({
          success: false,
          error: "privateKey and amount are required"
        });
      }

      const address = blockchainService.getAddressFromPrivateKey(privateKey);
      const result = await blockchainService.burn(privateKey, amount);

      return res.status(200).json({
        address,
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * GET /api/v1/test/last-claim/:address
   * Get last claim timestamp
   */
  public static getLastClaim = async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          error: "address parameter is required"
        });
      }

      const result = await blockchainService.getLastClaim(address);

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  /**
   * POST /api/v1/test/address-from-key
   * Get wallet address from private key (utility)
   *
   * Body: { privateKey: string }
   */
  public static getAddressFromKey = async (req: Request, res: Response) => {
    try {
      const { privateKey } = req.body;

      if (!privateKey) {
        return res.status(400).json({
          success: false,
          error: "privateKey is required"
        });
      }

      const address = blockchainService.getAddressFromPrivateKey(privateKey);

      return res.status(200).json({
        success: true,
        address
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
}
