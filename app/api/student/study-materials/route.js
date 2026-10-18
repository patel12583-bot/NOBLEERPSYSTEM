import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const student = await prisma.student.findUnique({ where: { userId: user.id }, include: { program: true, semester: true } });
  if (!student) return NextResponse.json({ error: "Student profile is not linked to this account." }, { status: 404 });
  if (!student.programId || !student.semesterId) return NextResponse.json({ student, materials: [] });
  const materials = await prisma.studyMaterial.findMany({
    where: { programId: student.programId, semesterId: student.semesterId },
    include: { subject: true, program: true, semester: true, faculty: true },
    orderBy: { uploadedAt: "desc" }
  });
  return NextResponse.json({ student, materials });
}
