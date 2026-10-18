import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "FACULTY") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const faculty = await prisma.faculty.findUnique({ where: { userId: user.id }, include: { department: true } });
  if (!faculty) return NextResponse.json({ error: "Faculty profile is not linked to this account." }, { status: 404 });
  const rows = await prisma.timetable.findMany({
    where: { facultyId: faculty.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: { division: { include: { program: true, semester: true } }, subject: true, faculty: true, room: true }
  });
  return NextResponse.json({ faculty, rows });
}