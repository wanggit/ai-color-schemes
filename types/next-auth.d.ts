import NextAuth, { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin: boolean;
      isMember: boolean;
      usageCount: number;
      isDisabled: boolean;
      memberExpireDate?: Date | null;
    };
  }

  interface User {
    isAdmin: boolean;
    isMember: boolean;
    usageCount: number;
    isDisabled: boolean;
    memberExpireDate?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    isMember: boolean;
    usageCount: number;
    isDisabled: boolean;
    memberExpireDate?: Date | null;
  }
} 