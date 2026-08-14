-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT,
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "bannerUrl" TEXT;

-- Backfill: existing rows in the dev database were assigned a generated
-- username via a one-off script before this constraint was enforced.
-- On a fresh database there are no rows to backfill, so this column can
-- go straight to NOT NULL.
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
