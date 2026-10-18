import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const student = await prisma.student.findUnique({ where: { userId: user.id }, include: { division: true, program: true, semester: true, department: true } });
  if (!student) return NextResponse.json({ error: "Student profile is not linked to this account." }, { status: 404 });
  const rows = student.divisionId ? await prisma.timetable.findMany({
    where: { divisionId: student.divisionId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: { division: { include: { program: true, semester: true } }, subject: true, faculty: true, room: true }
  }) : [];
  return NextResponse.json({ student, rows });
}