import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Fix for production HTTPS
if (process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL_INTERNAL = process.env.NEXTAUTH_URL;
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };