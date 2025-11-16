import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/**
 * POST /api/blockchain/claim-prize
 *
 * Claim prize from a betting game (winners only)
 */
export async function POST(request: NextRequest) {
    try {
        console.log('[Next.js API] Claiming prize...');

        // Get request body
        const body = await request.json();
        const { gameId } = body;

        // Validate input
        if (gameId === undefined) {
            return NextResponse.json(
                { success: false, error: 'Game ID is required' },
                { status: 400 }
            );
        }

        // Get auth token from cookies or headers
        const authToken = request.cookies.get('authToken')?.value ||
                         request.headers.get('authorization')?.replace('Bearer ', '');

        if (!authToken) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        console.log('[Next.js API] Auth token found, calling backend API...');

        // Call backend API - backend will read private key from temp/{userId}.key
        const response = await fetch(`${BACKEND_API_URL}/blockchain/betting/claim-prize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ gameId })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Next.js API] Backend API error:', result);
            return NextResponse.json(result, { status: response.status });
        }

        console.log('[Next.js API] ✅ Prize claimed successfully');
        return NextResponse.json(result);

    } catch (error) {
        console.error('[Next.js API] Error claiming prize:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
