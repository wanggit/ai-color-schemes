/*
  Warnings:

  - You are about to drop the column `isMember` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `memberExpireDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `usageCount` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paypalSubscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('FREE', 'MONTHLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isMember",
DROP COLUMN "memberExpireDate",
DROP COLUMN "usageCount",
ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastUsageResetAt" TIMESTAMP(3),
ADD COLUMN     "membershipExpiresAt" TIMESTAMP(3),
ADD COLUMN     "membershipType" "MembershipType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "monthlyUsageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paypalSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "purchaseType" TEXT NOT NULL,
    "membershipType" "MembershipType",
    "creditsPurchased" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_paypalSubscriptionId_key" ON "User"("paypalSubscriptionId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
