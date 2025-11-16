import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

/**
 * POST /api/blockchain/claim
 *
 * Claim free DEGU tokens from faucet
 */
export async function POST(request: NextRequest) {
    try {
        console.log('[Next.js API] Claiming free tokens...');

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
        const response = await fetch(`${BACKEND_API_URL}/blockchain/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Next.js API] Backend API error:', result);
            return NextResponse.json(result, { status: response.status });
        }

        console.log('[Next.js API] ✅ Tokens claimed successfully');
        return NextResponse.json(result);

    } catch (error) {
        console.error('[Next.js API] Error claiming tokens:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
