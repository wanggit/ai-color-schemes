import { MembershipType } from "@prisma/client";
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
      isDisabled: boolean;
      membershipType: MembershipType;
      membershipExpiresAt?: Date | null;
      credits: number;
    };
  }

  interface User {
    isAdmin: boolean;
    isDisabled: boolean;
    membershipType: MembershipType;
    membershipExpiresAt?: Date | null;
    credits: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    isDisabled: boolean;
    membershipType: MembershipType;
    membershipExpiresAt?: Date | null;
    credits: number;
  }
} 