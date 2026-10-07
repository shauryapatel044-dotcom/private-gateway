import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken, getCurrentAdmin, COOKIE_NAME, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify DATABASE_URL exists in environment
    if (!process.env.DATABASE_URL) {
      console.error('CRITICAL: DATABASE_URL is missing in environment variables!');
      return NextResponse.json(
        {
          error: 'DATABASE_URL environment variable is missing on Netlify',
          details: 'Please add DATABASE_URL in Netlify Site Configuration -> Environment Variables.',
        },
        { status: 500 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();

    let admin = await prisma.admin.findUnique({
      where: { username: cleanUsername },
    });

    // Auto-bootstrap: if database has zero admins, automatically create default admin
    if (!admin) {
      const adminCount = await prisma.admin.count();
      if (adminCount === 0 && cleanUsername === 'admin') {
        const defaultHash = await hashPassword('adminpassword123');
        admin = await prisma.admin.create({
          data: {
            username: 'admin',
            passwordHash: defaultHash,
          },
        });
      }
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const token = generateToken({ id: admin.id, username: admin.username });

    const response = NextResponse.json({
      success: true,
      user: { id: admin.id, username: admin.username },
    });

    // Set cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    const message = error?.message || String(error);
    return NextResponse.json(
      {
        error: 'Internal server error during login',
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: admin });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    path: '/',
    expires: new Date(0),
  });
  return response;
}
