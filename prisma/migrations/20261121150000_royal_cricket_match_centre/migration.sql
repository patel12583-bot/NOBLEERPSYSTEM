-- Royal Cricket Club match centre, scoring and tournament foundation. Additive only.
CREATE TYPE "MatchState" AS ENUM ('SCHEDULED','LIVE','COMPLETED','ABANDONED');
CREATE TABLE "Tournament" (
"id" TEXT NOT NULL,"name" TEXT NOT NULL,"season" TEXT,"format" TEXT NOT NULL DEFAULT 'T20',
"startDate" TIMESTAMP(3),"endDate" TIMESTAMP(3),"status" TEXT NOT NULL DEFAULT 'UPCOMING',
"createdById" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Match" (
"id" TEXT NOT NULL,"title" TEXT NOT NULL,"teamA" TEXT NOT NULL,"teamB" TEXT NOT NULL,"venue" TEXT,
"format" TEXT NOT NULL DEFAULT 'T20',"overs" INTEGER NOT NULL DEFAULT 20,"scheduledAt" TIMESTAMP(3) NOT NULL,
"status" "MatchState" NOT NULL DEFAULT 'SCHEDULED',"tossWinner" TEXT,"tossDecision" TEXT,"result" TEXT,
"playerOfMatch" TEXT,"shareToken" TEXT NOT NULL,"tournamentId" TEXT,"createdById" TEXT NOT NULL,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "Match_pkey" PRIMARY KEY ("id"));
CREATE TABLE "MatchBall" (
"id" TEXT NOT NULL,"matchId" TEXT NOT NULL,"innings" INTEGER NOT NULL,"sequence" INTEGER NOT NULL,
"overNumber" INTEGER NOT NULL,"ballInOver" INTEGER NOT NULL,"batter" TEXT NOT NULL,"nonStriker" TEXT NOT NULL,
"bowler" TEXT NOT NULL,"runsBat" INTEGER NOT NULL DEFAULT 0,"extrasType" TEXT,"extrasRuns" INTEGER NOT NULL DEFAULT 0,
"wicket" BOOLEAN NOT NULL DEFAULT false,"dismissalType" TEXT,"dismissedBatter" TEXT,"fielder" TEXT,
"legalBall" BOOLEAN NOT NULL DEFAULT true,"note" TEXT,"createdById" TEXT NOT NULL,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "MatchBall_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "Match_shareToken_key" ON "Match"("shareToken");
CREATE INDEX "Match_status_scheduledAt_idx" ON "Match"("status","scheduledAt");
CREATE INDEX "Match_tournamentId_scheduledAt_idx" ON "Match"("tournamentId","scheduledAt");
CREATE UNIQUE INDEX "MatchBall_matchId_innings_sequence_key" ON "MatchBall"("matchId","innings","sequence");
CREATE INDEX "MatchBall_matchId_innings_sequence_idx" ON "MatchBall"("matchId","innings","sequence");
CREATE INDEX "MatchBall_batter_idx" ON "MatchBall"("batter");
CREATE INDEX "MatchBall_bowler_idx" ON "MatchBall"("bowler");
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MatchBall" ADD CONSTRAINT "MatchBall_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchBall" ADD CONSTRAINT "MatchBall_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
