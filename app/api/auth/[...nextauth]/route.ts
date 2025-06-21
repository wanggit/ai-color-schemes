import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 管理员邮箱
const ADMIN_EMAIL = "wanggyxfmail@gmail.com";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
      version: "2.0",
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: any }) {
      // 检查用户是否被禁用
      if (user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        
        // 如果用户存在并且被禁用，拒绝登录
        if (dbUser && dbUser.isDisabled) {
          return false;
        }
        
        // 如果是首次登录且是管理员邮箱，设置为管理员
        if (!dbUser && user.email === ADMIN_EMAIL) {
          await prisma.user.update({
            where: { email: user.email },
            data: { isAdmin: true },
          });
        }
      }
      
      return true;
    },
    async session({ session, user }: { session: any; user: any }) {
      // 添加用户角色和会员状态到会话
      session.user.id = user.id;
      session.user.isAdmin = user.isAdmin;
      session.user.isMember = user.isMember;
      session.user.usageCount = user.usageCount;
      session.user.isDisabled = user.isDisabled;
      session.user.memberExpireDate = user.memberExpireDate;
      
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      // 首次登录时，将数据库中的用户信息添加到JWT
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        token.isMember = user.isMember;
        token.usageCount = user.usageCount;
        token.isDisabled = user.isDisabled;
        token.memberExpireDate = user.memberExpireDate;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 