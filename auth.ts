import 'server-only';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createHash } from 'node:crypto';
import { verifyPassword } from './lib/password';
import { getClient } from './db';
function credentialVersion() {
  return createHash('sha256')
    .update(process.env.ADMIN_PASSWORD_HASH ?? '')
    .digest('hex');
}
export const { handlers, auth } = NextAuth({
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      name: 'Organizer',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const hash = process.env.ADMIN_PASSWORD_HASH;
        if (
          !email ||
          !hash ||
          typeof credentials.email !== 'string' ||
          typeof credentials.password !== 'string'
        )
          return null;
        // Shared across serverless instances: at most 10 attempts per minute.
        const bucket = Math.floor(Date.now() / 60_000);
        const result = await getClient().query({
          text: 'INSERT INTO login_attempts (id,bucket,attempts) VALUES (1,$1,1) ON CONFLICT(id) DO UPDATE SET bucket=excluded.bucket, attempts=CASE WHEN login_attempts.bucket=excluded.bucket THEN login_attempts.attempts+1 ELSE 1 END RETURNING attempts',
          values: [bucket],
        });
        if (Number(result.rows[0].attempts) > 10) return null;
        const valid = await verifyPassword(credentials.password, hash);
        if (!valid || credentials.email.trim().toLowerCase() !== email)
          return null;
        return { id: `admin:${email}`, email, name: 'Organizer' };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.credentialVersion = credentialVersion();
      if (
        token.credentialVersion !== credentialVersion() ||
        token.email !== process.env.ADMIN_EMAIL?.trim().toLowerCase()
      )
        return null;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
