CREATE TABLE "MatchPlayer" (
"id" TEXT NOT NULL,"matchId" TEXT NOT NULL,"teamName" TEXT NOT NULL,"playerName" TEXT NOT NULL,
"role" TEXT NOT NULL DEFAULT 'PLAYER',"battingOrder" INTEGER,"isCaptain" BOOLEAN NOT NULL DEFAULT false,
"isWicketkeeper" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "MatchPlayer_matchId_teamName_playerName_key" ON "MatchPlayer"("matchId","teamName","playerName");
CREATE INDEX "MatchPlayer_matchId_teamName_battingOrder_idx" ON "MatchPlayer"("matchId","teamName","battingOrder");
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
