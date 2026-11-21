-- Royal Cricket Club member approval and finance foundation.
-- Additive only: no existing Noble tables or records are dropped.
CREATE TYPE "MemberApprovalStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');
ALTER TABLE "MemberProfile" ADD COLUMN IF NOT EXISTS "approvalStatus" "MemberApprovalStatus" NOT NULL DEFAULT 'PENDING';

CREATE TYPE "FinanceEntryType" AS ENUM ('CONTRIBUTION', 'INCOME', 'EXPENSE', 'ADJUSTMENT');
CREATE TYPE "FinanceEntryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'VOID');

CREATE TABLE IF NOT EXISTS "FinanceEntry" (
  "id" TEXT NOT NULL,
  "type" "FinanceEntryType" NOT NULL,
  "status" "FinanceEntryStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(12,2) NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "reference" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinanceEntry_status_occurredAt_idx" ON "FinanceEntry"("status", "occurredAt");
CREATE INDEX IF NOT EXISTS "FinanceEntry_type_occurredAt_idx" ON "FinanceEntry"("type", "occurredAt");
CREATE INDEX IF NOT EXISTS "FinanceEntry_createdById_createdAt_idx" ON "FinanceEntry"("createdById", "createdAt");
DO $$ BEGIN
  ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
