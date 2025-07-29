import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { type NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { accounts, sessions, verificationTokens } from '@/server/db/auth-schema';

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'database',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // If signing in with Twitter, extract the username (handle)
        if (account?.provider === 'twitter' && profile) {
          // OAuth 2.0 structure
          const twitterProfile = profile as { 
            data?: { username?: string };
            username?: string;
          };
          const twitterHandle = twitterProfile.data?.username || twitterProfile.username;
          
          if (twitterHandle) {
            const twitterProfileUrl = `https://twitter.com/${twitterHandle}`;
            
            // Update user with Twitter data
            if (user.id) {
              try {
                await db.update(users)
                  .set({
                    twitterHandle,
                    twitterProfileUrl,
                    username: twitterHandle, // Also set username field for compatibility
                  })
                  .where(eq(users.id, user.id));
              } catch (error) {
                console.error('Failed to update user Twitter data:', error);
                // Don't block sign in if this fails
              }
            }
          }
      }
      return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        // Still allow sign in even if our custom logic fails
        return true;
      }
    },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
};