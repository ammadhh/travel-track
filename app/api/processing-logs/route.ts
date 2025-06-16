import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/google-auth';
import { getUserByGoogleId, getEmailProcessingLogsByUserId } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = verifyJWT(authToken) as any;
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user from database
    const user = await getUserByGoogleId(decoded.googleId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get processing logs for user
    const logs = await getEmailProcessingLogsByUserId(user.id);

    return NextResponse.json({
      success: true,
      logs: logs,
      total: logs.length
    });

  } catch (error: any) {
    console.error('Error fetching processing logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch processing logs',
      details: error.message 
    }, { status: 500 });
  }
}