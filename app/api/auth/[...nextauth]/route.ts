import NextAuth, { NextAuthOptions, SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient, MembershipType } from "@prisma/client";
import { Adapter } from "next-auth/adapters";

const prisma = new PrismaClient();

// 管理员邮箱
const ADMIN_EMAIL = "wanggyxfmail@gmail.com";

// 获取适合当前环境的认证提供商配置
function getAuthProviders() {
  // 开发环境配置（使用邮箱密码登录代替Google登录）
  if (process.env.NODE_ENV === "development") {
    return [
      CredentialsProvider({
        name: "Email",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email) {
            return null;
          }

          // 在开发环境中，我们通过邮箱从数据库查找用户
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          // 如果找不到用户，则登录失败
          if (!user) {
            return null;
          }

          // 开发环境简化验证（任意密码均可登录），返回从数据库查询到的完整用户信息
          return user;
        }
      }),
      // 保留Facebook和Twitter登录
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID as string,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
        allowDangerousEmailAccountLinking: true,
        httpOptions: {
          timeout: 10000,
        },
      }),
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID as string,
        clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
        version: "2.0",
        allowDangerousEmailAccountLinking: true,
        httpOptions: {
          timeout: 10000,
        },
      }),
    ];
  }

  // 生产环境配置（使用所有社交登录）
  return [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 15000, // 生产环境使用15秒超时
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 10000,
      },
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
      version: "2.0",
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 10000,
      },
    }),
  ];
}

export const authOptions: NextAuthOptions = {
  adapter: process.env.NODE_ENV === "development" ? undefined : PrismaAdapter(prisma) as Adapter,
  providers: getAuthProviders(),
  callbacks: {
    async signIn({ user, account, profile, email, credentials }: any) {
      // 开发环境使用Credentials登录时不需要检查数据库
      if (process.env.NODE_ENV === "development" && credentials) {
        return true;
      }

      // 处理登录错误，添加重试逻辑
      try {
        // 检查用户是否有邮箱
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (dbUser) {
            // 用户已存在，更新用户信息
            if (dbUser.isDisabled) {
              // 如果用户被禁用，拒绝登录
              return false;
            }

            // 更新用户信息
            await prisma.user.update({
              where: { email: user.email },
              data: {
                name: user.name,
                image: user.image,
              }
            });
          } else {
            // 用户不存在，创建新用户
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                isAdmin: user.email === ADMIN_EMAIL, // 如果是管理员邮箱，设置为管理员
                isDisabled: false,
                membershipType: MembershipType.FREE,
                monthlyUsageCount: 0,
                credits: 30, // 新用户注册时，赠送30个Credits
                lastUsageResetAt: new Date(),
              }
            });
          }
        }

        return true;
      } catch (error) {
        console.error("Login process error:", error);
        // 即使出错也返回true，让用户体验更好
        // 我们已经做了最大努力处理登录，如果有数据库错误，后续可以修复
        return true;
      }
    },
    async session({ session, token, user }) {
      // 在database策略下，user参数包含数据库中的用户信息
      // 在jwt策略下，token参数包含JWT中的用户信息
      if (process.env.NODE_ENV === "development") {
        // 开发环境使用JWT策略，从token获取信息
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.isAdmin = token.isAdmin as boolean;
          session.user.isDisabled = token.isDisabled as boolean;
          session.user.membershipType = token.membershipType as MembershipType;
          session.user.membershipExpiresAt = token.membershipExpiresAt as Date;
          session.user.credits = token.credits as number;
        }
      } else {
        // 生产环境使用database策略，从user参数获取信息
        if (user && session.user) {
          session.user.id = user.id;
          session.user.isAdmin = user.isAdmin;
          session.user.isDisabled = user.isDisabled;
          session.user.membershipType = user.membershipType;
          session.user.membershipExpiresAt = user.membershipExpiresAt;
          session.user.credits = user.credits;
        } else if (session.user?.email) {
          // 如果user参数为空，尝试从数据库查询用户信息
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: {
                id: true,
                isAdmin: true,
                isDisabled: true,
                membershipType: true,
                membershipExpiresAt: true,
                credits: true
              }
            });
            if (dbUser) {
              session.user.id = dbUser.id;
              session.user.isAdmin = dbUser.isAdmin;
              session.user.isDisabled = dbUser.isDisabled;
              session.user.membershipType = dbUser.membershipType;
              session.user.membershipExpiresAt = dbUser.membershipExpiresAt;
              session.user.credits = dbUser.credits;
            }
          } catch (error) {
            console.error("Error fetching user data in session callback:", error);
          }
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      // 首次登录时，user对象是可用的（来自Provider的返回）
      // 我们将user的自定义字段添加到token中，以便持久化
      if (user) {
        const u = user as any; // 强制转换以访问自定义字段
        token.id = u.id;
        token.isAdmin = u.isAdmin;
        token.isDisabled = u.isDisabled;
        token.membershipType = u.membershipType;
        token.membershipExpiresAt = u.membershipExpiresAt;
        token.credits = u.credits;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: (process.env.NODE_ENV === "development" ? "jwt" : "database") as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 