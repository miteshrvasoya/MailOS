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
      console.log("Account Scopes: ", account?.scope);
      console.log("Refresh Token Present: ", !!account?.refresh_token);

      // Store user in backend database
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
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
          console.error('Failed to store user in backend:', await response.text());
          // Still allow sign in even if backend storage fails
        }
      } catch (error) {
        console.error('Error storing user in backend:', error);
        // Still allow sign in even if backend storage fails
      }

      return true;
    },
    async jwt({ token, user }) {
      // 'user' is only defined during the initial sign-in
      if (user && user.email) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
          const res = await fetch(`${backendUrl}/users/by-email/${user.email}`);
          if (res.ok) {
            const userData = await res.json();
            token.backendId = userData.id;
          }
        } catch (error) {
          console.error("Error fetching user data for JWT:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.backendId) {
        session.user.id = token.backendId as string;
      }
      return session;
    },
  },
});
