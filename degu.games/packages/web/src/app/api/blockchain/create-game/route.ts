import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// CORS headers for cross-origin requests from Scratch GUI
const scratchGuiUrl = process.env.NEXT_PUBLIC_SCRATCH_GUI_URL || 'http://localhost:8601';
const corsHeaders = {
    'Access-Control-Allow-Origin': scratchGuiUrl,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
};

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/blockchain/create-game
 *
 * Creates a betting game by:
 * 1. Reading private key from session cookie (set by main web app)
 * 2. Calling backend API with the private key
 * 3. Returning the result
 */
export async function POST(request: NextRequest) {
    try {
        console.log('[Next.js API] Creating betting game...');

        // Get request body
        const body = await request.json();
        const { tokenAddress, betAmount, minPlayers, maxPlayers } = body;

        // Validate input
        if (!tokenAddress || !betAmount || !minPlayers || !maxPlayers) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Get auth token from cookies or headers
        const authToken = request.cookies.get('authToken')?.value ||
                         request.headers.get('authorization')?.replace('Bearer ', '');

        if (!authToken) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401, headers: corsHeaders }
            );
        }

        console.log('[Next.js API] Auth token found, calling backend API...');

        // Call backend API - backend will read private key from temp/{userId}.key
        const response = await fetch(`${BACKEND_API_URL}/blockchain/betting/create-game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                tokenAddress,
                betAmount,
                minPlayers,
                maxPlayers
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Next.js API] Backend API error:', result);
            return NextResponse.json(result, { status: response.status, headers: corsHeaders });
        }

        console.log('[Next.js API] ✅ Game created successfully');
        return NextResponse.json(result, { headers: corsHeaders });

    } catch (error) {
        console.error('[Next.js API] Error creating game:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500, headers: corsHeaders }
        );
    }
}
