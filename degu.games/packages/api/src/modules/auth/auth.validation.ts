/**
 * Authentication Request Validation Schemas
 *
 * Uses Zod for type-safe input validation to prevent malicious or malformed data
 */

import { z } from 'zod';

// Ethereum address validation regex
const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;

// Email validation (more permissive than strict RFC 5322)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Login Request Schema
 * Validates all fields in the login request
 */
export const loginRequestSchema = z.object({
    // Required fields
    idToken: z.string()
        .min(1, 'Authentication token is required')
        .max(10000, 'Authentication token is too long'),

    privyUserId: z.string()
        .min(1, 'Privy user ID is required')
        .max(500, 'Privy user ID is too long'),

    authProvider: z.enum(['google', 'twitter', 'discord', 'email', 'wallet'], {
        errorMap: () => ({ message: 'Invalid authentication provider' })
    }),

    // Optional fields with validation
    walletAddress: z.string()
        .regex(ethereumAddressRegex, 'Invalid Ethereum address format')
        .optional()
        .nullable(),

    email: z.string()
        .regex(emailRegex, 'Invalid email format')
        .max(255, 'Email is too long')
        .optional()
        .nullable(),

    name: z.string()
        .min(1, 'Name cannot be empty if provided')
        .max(255, 'Name is too long')
        .optional()
        .nullable(),

    profileImage: z.string()
        .url('Invalid profile image URL')
        .max(2000, 'Profile image URL is too long')
        .optional()
        .nullable(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * Validate request body and return typed data
 * Throws ZodError if validation fails
 */
export function validateLoginRequest(data: unknown): LoginRequest {
    return loginRequestSchema.parse(data);
}
