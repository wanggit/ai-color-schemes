/*
  Warnings:

  - A unique constraint covering the columns `[userId,hex]` on the table `AiColor` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AiColor_hex_key";

-- CreateIndex
CREATE INDEX "AiColor_hex_idx" ON "AiColor"("hex");

-- CreateIndex
CREATE UNIQUE INDEX "AiColor_userId_hex_key" ON "AiColor"("userId", "hex");
