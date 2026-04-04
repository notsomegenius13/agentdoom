import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getDb } from '@/lib/db';

const USERNAME_RETRY_LIMIT = 8;

function toUsernameBase(email: string): string {
  const localPart = email.split('@')[0] || 'user';
  const normalized = localPart
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 12);
  return normalized || 'user';
}

function buildUsername(email: string): string {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 4);
  return `user_${toUsernameBase(email)}_${suffix}`;
}

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
          const email = user.email.toLowerCase();
          for (let attempt = 0; attempt < USERNAME_RETRY_LIMIT; attempt++) {
            const username = buildUsername(email);
            const inserted = (await sql`
              INSERT INTO users (id, email, username, display_name, avatar_url)
              VALUES (${id}, ${email}, ${username}, ${user.name || ''}, ${user.image || null})
              ON CONFLICT DO NOTHING
              RETURNING id
            `) as Record<string, unknown>[];
            if (inserted.length > 0) break;
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        // Check if this user has been granted waitlist access
        try {
          const sql = getDb();
          const email = (user.email || '').toLowerCase();
          const adminEmails = new Set(
            (process.env.ADMIN_EMAILS || '')
              .split(',')
              .map((e) => e.trim().toLowerCase())
              .filter(Boolean),
          );
          if (adminEmails.has(email)) {
            token.isAdmin = true;
            token.grantedAccess = true;
          } else {
            const rows = (await sql`
              SELECT id FROM waitlist WHERE email = ${email} AND granted_at IS NOT NULL LIMIT 1
            `) as Record<string, unknown>[];
            token.grantedAccess = rows.length > 0;
            token.isAdmin = false;
          }
        } catch {
          // DB unavailable — don't block sign-in
          token.grantedAccess = false;
          token.isAdmin = false;
        }
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
