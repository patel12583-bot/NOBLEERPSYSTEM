CREATE TABLE "ClubAttendance" (
"id" TEXT NOT NULL,"userId" TEXT NOT NULL,"date" TIMESTAMP(3) NOT NULL,"status" TEXT NOT NULL DEFAULT 'PRESENT',
"note" TEXT,"markedById" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "ClubAttendance_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "ClubAttendance_userId_date_key" ON "ClubAttendance"("userId","date");
CREATE INDEX "ClubAttendance_date_status_idx" ON "ClubAttendance"("date","status");
ALTER TABLE "ClubAttendance" ADD CONSTRAINT "ClubAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubAttendance" ADD CONSTRAINT "ClubAttendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "ClubNotice" (
"id" TEXT NOT NULL,"title" TEXT NOT NULL,"content" TEXT NOT NULL,"audience" TEXT NOT NULL DEFAULT 'ALL',
"published" BOOLEAN NOT NULL DEFAULT false,"publishedAt" TIMESTAMP(3),"authorId" TEXT NOT NULL,
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
CONSTRAINT "ClubNotice_pkey" PRIMARY KEY ("id"));
CREATE INDEX "ClubNotice_published_publishedAt_idx" ON "ClubNotice"("published","publishedAt");
ALTER TABLE "ClubNotice" ADD CONSTRAINT "ClubNotice_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
