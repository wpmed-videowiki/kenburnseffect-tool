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
      },
      clientId: process.env.MEDIAWIKI_CONSUMER_KEY,
      clientSecret: process.env.MEDIAWIKI_CONSUMER_SECRET,
      name: "Commons",
      id: "wikimedia",
    }),
    WikimediaProvider({
      token: "https://nccommons.org/w/rest.php/oauth2/access_token",
      userinfo: "https://nccommons.org/w/rest.php/oauth2/resource/profile",
      authorization: {
        url: "https://nccommons.org/w/rest.php/oauth2/authorize",
      },
      client: {
        client_id: process.env.NCCOMMONS_CONSUMER_KEY,
        client_secret: process.env.NCCOMMONS_CONSUMER_SECRET,
      },
      accessTokenUrl: "https://nccommons.org/w/rest.php/oauth2/access_token",
      requestTokenUrl: "https://nccommons.org/w/rest.php/oauth2/request_token",
      clientId: process.env.NCCOMMONS_CONSUMER_KEY,
      clientSecret: process.env.NCCOMMONS_CONSUMER_KEY,
      name: "NC Commons",
      id: "nccommons",
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token = Object.assign({}, token, {
          access_token: account.access_token,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (session) {
        session = Object.assign({}, session, {
          provider: token.provider,
          providerName:
            token.provider === "nccommons" ? "NC Commons" : "Wikimedia Commons",
          providerAccountId: token.providerAccountId,
        });
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
