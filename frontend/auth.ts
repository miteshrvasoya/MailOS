import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

console.log("Google Client ID: ", process.env.GOOGLE_CLIENT_ID)
console.log("Google Client Secret: ", process.env.GOOGLE_CLIENT_SECRET)

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid profile email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar.events',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[NextAuth] signIn callback started for:", user.email);
      console.log("[NextAuth] Account Scopes: ", account?.scope);
      console.log("[NextAuth] Refresh Token Present: ", !!account?.refresh_token);

      // Store user in backend database
      try {
        const isProd = process.env.NODE_ENV === 'production';
        const defaultBackend = isProd ? 'https://mailos.onrender.com/api/v1' : 'http://localhost:8000/api/v1';
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || defaultBackend;
        
        console.log(`[NextAuth] Upserting user to backend: ${backendUrl}/users/upsert`);

        const response = await fetch(`${backendUrl}/users/upsert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            full_name: user.name,
            access_token: account?.access_token,
            refresh_token: account?.refresh_token,
            expires_at: account?.expires_at,
            scopes: account?.scope,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error('[NextAuth] Failed to store user in backend. Status:', response.status, 'Body:', text);
          // Still allow sign in even if backend storage fails
        } else {
          console.log("[NextAuth] Successfully upserted user to backend");
        }
      } catch (error) {
        console.error('[NextAuth] Error calling users/upsert backend:', error);
      }

      return true;
    },
    async jwt({ token, user }) {
      console.log(`[NextAuth] jwt callback executing. backendId present? ${!!token.backendId}`);
      
      // If we already have the backendId, we are good.
      if (token.backendId) {
        return token;
      }

      // If we don't have the backendId, we MUST fetch it.
      // `user` is only passed on the exact moment of login, but `token.email` is always present.
      const lookupEmail = user?.email || token.email;

      if (lookupEmail) {
        console.log(`[NextAuth] Missing backendId for ${lookupEmail}. Fetching from database...`);
        try {
          const isProd = process.env.NODE_ENV === 'production';
          const defaultBackend = isProd ? 'https://mailos.onrender.com/api/v1' : 'http://localhost:8000/api/v1';
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || defaultBackend;
          
          console.log(`[NextAuth] Calling ${backendUrl}/users/by-email/${lookupEmail}`);
          const res = await fetch(`${backendUrl}/users/by-email/${lookupEmail}`, { cache: 'no-store' });
          
          if (res.ok) {
            const userData = await res.json();
            token.backendId = userData.id;
            console.log(`[NextAuth] Successfully attached backendId to JWT token: ${userData.id}`);
          } else {
            const txt = await res.text();
            console.error(`[NextAuth] users/by-email failed with status ${res.status}. Body: ${txt}`);
          }
        } catch (error) {
          console.error("[NextAuth] Network error fetching user data for JWT:", error);
        }
      } else {
        console.warn("[NextAuth] No email available to fetch backendId");
      }
      return token;
    },
    async session({ session, token }) {
      // console.log(`[NextAuth] session callback executing. Available backendId: ${token?.backendId}`);
      if (token && token.backendId) {
        session.user.id = token.backendId as string;
      }
      return session;
    },
  },
});
