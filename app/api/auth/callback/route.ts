import { NextRequest, NextResponse } from 'next/server';
import { getTokens, getUserInfo, generateJWT } from '@/lib/google-auth';
import { createUser, getUserByGoogleId } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/auth?error=access_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/auth?error=no_code', request.url));
    }

    // Exchange code for tokens
    const tokens = await getTokens(code);
    
    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/auth?error=no_access_token', request.url));
    }

    // Get user info
    const userInfo = await getUserInfo(tokens.access_token);
    
    if (!userInfo.id || !userInfo.email) {
      return NextResponse.redirect(new URL('/auth?error=invalid_user_info', request.url));
    }

    // Check if user exists or create new user
    let user = await getUserByGoogleId(userInfo.id);
    
    if (!user) {
      await createUser({
        google_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      });
      user = await getUserByGoogleId(userInfo.id);
    } else {
      // Update tokens for existing user
      await createUser({
        google_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      });
    }

    // Generate JWT
    const jwtToken = generateJWT({
      userId: user.id,
      email: user.email,
      googleId: user.google_id
    });

    // Redirect to dashboard with token
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/auth?error=callback_failed', request.url));
  }
}