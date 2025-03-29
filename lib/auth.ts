// auth.ts
import NextAuth, { Session } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { adminDB } from "@/lib/firebaseAdmin";

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization:
        "https://accounts.spotify.com/authorize?scope=playlist-modify-private playlist-modify-public user-read-email user-read-private",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      if (profile) {
        token.name = (profile.name || profile.display_name) as string;
        token.email = profile.email;
        token.id = profile.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name;
        (session as any).accessToken = token.accessToken;
        (session as any).provider = token.provider;
        (session.user as any).id = token.id;
      }

      if (token.id && typeof token.id === 'string') { // Added type check here
        const userRef = adminDB.collection("users").doc(token.id);
        const updatedTime = Date.now();
        const readableUpdatedTime = new Date(updatedTime).toLocaleString();
        await userRef.set(
          {
            name: token.name,
            email: token.email,
            accessToken: token.accessToken,
            provider: token.provider,
            lastUpdatedEpoch: updatedTime,
            lastUpdated: readableUpdatedTime,
          },
          { merge: true }
        );
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
});