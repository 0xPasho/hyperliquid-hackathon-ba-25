import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            console.log('[Auth Middleware] No authorization header');
            res.status(401).json({
                success: false,
                error: "No authorization header provided",
            });
            return;
        }

        const token = authHeader.replace("Bearer ", "");

        if (!token) {
            console.log('[Auth Middleware] No token in header');
            res.status(401).json({
                success: false,
                error: "No token provided",
            });
            return;
        }

        console.log('[Auth Middleware] Verifying token:', token.substring(0, 20) + '...');
        const decoded = verifyToken(token);
        console.log('[Auth Middleware] Token verified successfully for user:', decoded.userId);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('[Auth Middleware] Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
        res.status(403).json({
            success: false,
            error: "Invalid or expired token",
        });
    }
}

export function optionalAuthMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        console.log('[Optional Auth Middleware] Processing request');
        console.log('  - Auth header present:', !!authHeader);

        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            console.log('  - Token:', token.substring(0, 20) + '...');
            if (token) {
                const decoded = verifyToken(token);
                console.log('  - Decoded userId:', decoded.userId);
                req.user = decoded;
            }
        }
        next();
    } catch (error) {
        console.log('[Optional Auth Middleware] Error:', error instanceof Error ? error.message : 'Unknown error');
        // Continue without auth if token is invalid
        next();
    }
}
