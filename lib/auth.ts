import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getDb } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        const sql = getDb();
        // Upsert user on Google sign-in
        const rows = (await sql`
          SELECT id FROM users WHERE email = ${user.email.toLowerCase()} LIMIT 1
        `) as Record<string, unknown>[];

        if (rows.length === 0) {
          const id = crypto.randomUUID();
          await sql`
            INSERT INTO users (id, email, display_name, avatar_url)
            VALUES (${id}, ${user.email.toLowerCase()}, ${user.name || ''}, ${user.image || null})
          `;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
};
