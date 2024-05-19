import NextAuth from "next-auth";
import WikimediaProvider from "next-auth/providers/wikimedia";
import connectDB from "../../lib/connectDB";
import UserModel from "../../../models/User";

const providers = [
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
  WikimediaProvider({
    token: "https://mdwiki.org/w/rest.php/oauth2/access_token",
    userinfo: "https://mdwiki.org/w/rest.php/oauth2/resource/profile",
    authorization: {
      url: "https://mdwiki.org/w/rest.php/oauth2/authorize",
    },
    client: {
      client_id: process.env.MDWIKI_CONSUMER_KEY,
      client_secret: process.env.MDWIKI_CONSUMER_SECRET,
    },
    accessTokenUrl: "https://mdwiki.org/w/rest.php/oauth2/access_token",
    requestTokenUrl: "https://mdwiki.org/w/rest.php/oauth2/request_token",
    clientId: process.env.MDWIKI_CONSUMER_KEY,
    clientSecret: process.env.MDWIKI_CONSUMER_KEY,
    name: "MD Wiki",
    id: "mdwiki",
  }),
];

const handler = async (req, res) => {
  const appUserId = req.cookies.get("app-user-id")?.value;

  return await NextAuth(req, res, {
    providers,
    callbacks: {
      async signIn(data) {
        await connectDB();
        // update user
        try {
          if (appUserId) {
            const provider = data.account.provider;
            let update = {
              [`${provider}Id`]: data.account.providerAccountId,
              [`${provider}Token`]: data.account.access_token,
              [`${provider}RefreshToken`]: data.account.refresh_token,
              [`${provider}Profile`]: data.profile,
            };
            await UserModel.findByIdAndUpdate(appUserId, {
              $set: update,
            });
          }
        } catch (err) {
          console.error(err);
        }
        return true;
      },
      async jwt({ token, account }) {
        const user = await UserModel.findById(appUserId);
        if (account) {
          token = Object.assign({}, token, {
            userId: user._id,
          });
        }
        return token;
      },
      async session({ session, token }) {
        const user = await UserModel.findById(appUserId);
        if (session) {
          session = Object.assign({}, session, {
            user: {
              _id: user._id,
              mdwikiId: user.mdwikiId,
              wikimediaId: user.wikimediaId,
              nccommonsId: user.nccommonsId,
              wikimediaProfile: user.wikimediaProfile,
              mdwikiProfile: user.mdwikiProfile,
              nccommonsProfile: user.nccommonsProfile,
            },
          });
        }
        return session;
      },
    },
  });
};

export { handler as GET, handler as POST };
