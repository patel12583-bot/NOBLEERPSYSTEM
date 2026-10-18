import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const fileIsValid = (value) => !value || (typeof value === "string" && /^data:[^;]+;base64,[A-Za-z0-9+/=]+$/.test(value) && Buffer.byteLength(value.split(",")[1] || "", "base64") <= MAX_FILE_BYTES);

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const student = await prisma.student.findUnique({ where: { userId: user.id }, include: { semester: true, program: true } });
  if (!student) return NextResponse.json({ error: "Student profile is not linked to this account." }, { status: 404 });
  if (!student.semesterId) return NextResponse.json({ student, assignments: [] });
  const assignments = await prisma.assignment.findMany({
    where: { semesterId: student.semesterId, subject: { OR: [{ programId: null }, { programId: student.programId }] } },
    include: { subject: true, semester: true, faculty: true, submissions: { where: { studentId: student.id } } },
    orderBy: { dueDate: "asc" }
  });
  return NextResponse.json({ student, assignments: assignments.map(({ submissions, ...a }) => ({ ...a, submission: submissions[0] || null })) });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || user.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const student = await prisma.student.findUnique({ where: { userId: user.id } });
  if (!student) return NextResponse.json({ error: "Student profile is not linked to this account." }, { status: 404 });
  const body = await request.json();
  const assignmentId = String(body.assignmentId || "");
  if (!assignmentId) return NextResponse.json({ error: "Assignment is required." }, { status: 400 });
  if (!fileIsValid(body.fileUrl) || !body.fileUrl) return NextResponse.json({ error: "Upload a valid file no larger than 4 MB." }, { status: 400 });
  const assignment = await prisma.assignment.findFirst({ where: { id: assignmentId, semesterId: student.semesterId, subject: { OR: [{ programId: null }, { programId: student.programId }] } } });
  if (!assignment) return NextResponse.json({ error: "Assignment not found for your semester." }, { status: 404 });
  const submittedAt = new Date();
  const status = submittedAt > assignment.dueDate ? "LATE" : "SUBMITTED";
  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    create: { assignmentId, studentId: student.id, fileName: String(body.fileName || "submission").slice(0, 255), fileUrl: body.fileUrl, note: body.note ? String(body.note).slice(0, 2000) : null, submittedAt, status },
    update: { fileName: String(body.fileName || "submission").slice(0, 255), fileUrl: body.fileUrl, note: body.note ? String(body.note).slice(0, 2000) : null, submittedAt, status }
  });
  return NextResponse.json({ submission }, { status: 201 });
}
