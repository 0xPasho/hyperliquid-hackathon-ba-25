/**
 * Rate Limiting Middleware
 *
 * Protects endpoints from abuse by limiting the number of requests per IP address.
 * Particularly important for authentication endpoints to prevent brute force attacks.
 */

import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for authentication endpoints
 * Allows 5 login attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        error: "Too many authentication attempts from this IP, please try again after 15 minutes",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip rate limiting for successful requests
    skipSuccessfulRequests: false,
    // Skip rate limiting for failed requests
    skipFailedRequests: false,
});

/**
 * General API rate limiter
 * Allows 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: "Too many requests from this IP, please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive operations (e.g., wallet operations, money transfers)
 * Allows 10 requests per 5 minutes per IP
 */
export const sensitiveOperationRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        success: false,
        error: "Too many requests for this operation, please try again after 5 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
