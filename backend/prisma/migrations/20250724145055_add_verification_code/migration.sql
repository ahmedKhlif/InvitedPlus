-- AlterTable
ALTER TABLE "users" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "users" ADD COLUMN "verificationCodeExpires" DATETIME;
