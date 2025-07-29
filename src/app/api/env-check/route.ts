import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    // NextAuth
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    
    // Twitter OAuth
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ? 'SET' : 'NOT SET',
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'NOT SET',
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    POSTGRES_URL: process.env.POSTGRES_URL ? 'SET' : 'NOT SET',
    
    // Google Books
    GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY ? 'SET' : 'NOT SET',
    
    // Environment info
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    VERCEL: process.env.VERCEL ? 'SET' : 'NOT SET',
    VERCEL_URL: process.env.VERCEL_URL ? 'SET' : 'NOT SET',
  };

  return NextResponse.json(envVars, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}