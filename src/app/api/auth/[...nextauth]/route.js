import NextAuth from "next-auth";
import WikimediaProvider from "next-auth/providers/wikimedia";
export const authOptions = {
  providers: [
    WikimediaProvider({
      token: "https://commons.wikimedia.org/w/rest.php/oauth2/access_token",
      userinfo:
        "https://commons.wikimedia.org/w/rest.php/oauth2/resource/profile",
      authorization: {
        url: "https://commons.wikimedia.org/w/rest.php/oauth2/authorize",
        params: { scope: "" },
      },
      clientId: process.env.MEDIAWIKI_CONSUMER_KEY,
      clientSecret: process.env.MEDIAWIKI_CONSUMER_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      console.log('jwt', {token, account})
      if (account) {
        token = Object.assign({}, token, {
          access_token: account.access_token,
        });
      }
      return token;
    },
    async session({ session, token }) {
      console.log('session', {session, token})
      if (session) {
        session = Object.assign({}, session, {
          access_token: token.access_token,
        });
        console.log(session);
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
