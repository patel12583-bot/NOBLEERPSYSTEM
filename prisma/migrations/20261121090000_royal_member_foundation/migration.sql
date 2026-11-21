-- Royal Cricket Club member foundation.
-- Additive-only migration: preserves all existing Noble tables and records.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TREASURER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SCORER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MEMBER';

CREATE TABLE IF NOT EXISTS "MemberProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "memberCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mobile" TEXT,
  "jerseyNumber" INTEGER,
  "battingStyle" TEXT,
  "bowlingStyle" TEXT,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MemberProfile_userId_key" ON "MemberProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "MemberProfile_memberCode_key" ON "MemberProfile"("memberCode");
CREATE INDEX IF NOT EXISTS "MemberProfile_name_idx" ON "MemberProfile"("name");
CREATE INDEX IF NOT EXISTS "MemberProfile_mobile_idx" ON "MemberProfile"("mobile");
DO $$ BEGIN
  ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
