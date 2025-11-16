/**
 * VM Server Authentication Middleware
 *
 * Verifies requests are from the authorized VM server
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Authenticate VM server
 * Verifies the request is from the VM server using shared secret token
 */
export function authenticateVMServer(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const vmServerToken = process.env.VM_SERVER_TOKEN;

    if (!vmServerToken) {
        logger.error('[VM Auth] VM_SERVER_TOKEN not configured');
        return res.status(500).json({
            success: false,
            error: 'Server configuration error'
        });
    }

    if (!token) {
        logger.warn('[VM Auth] Missing authorization header');
        return res.status(401).json({
            success: false,
            error: 'Authorization header required'
        });
    }

    if (token !== vmServerToken) {
        logger.warn('[VM Auth] Invalid token received');
        return res.status(401).json({
            success: false,
            error: 'Invalid authorization token'
        });
    }

    // Check X-VM-Server header for additional verification
    const vmServerHeader = req.headers['x-vm-server'];
    if (vmServerHeader !== 'true') {
        logger.warn('[VM Auth] Missing X-VM-Server header');
        return res.status(401).json({
            success: false,
            error: 'Invalid request source'
        });
    }

    logger.debug('[VM Auth] VM server authenticated successfully');
    return next();
}
