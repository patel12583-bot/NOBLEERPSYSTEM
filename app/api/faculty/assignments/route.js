import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const fileIsValid = (value) => !value || (typeof value === "string" && /^data:[^;]+;base64,[A-Za-z0-9+/=]+$/.test(value) && Buffer.byteLength(value.split(",")[1] || "", "base64") <= MAX_FILE_BYTES);

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "FACULTY") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
  if (!faculty) return NextResponse.json({ error: "Faculty profile is not linked to this account." }, { status: 404 });
  const facultySubjects = await prisma.facultySubject.findMany({ where: { facultyId: faculty.id }, include: { subject: true } });
  const semesters = await prisma.semester.findMany({ orderBy: { number: "asc" } });
  const assignments = await prisma.assignment.findMany({
    where: { facultyId: faculty.id },
    include: { subject: true, semester: true, submissions: { include: { student: true }, orderBy: { submittedAt: "desc" } } },
    orderBy: { dueDate: "asc" }
  });
  return NextResponse.json({ assignments, subjects: facultySubjects.map((item) => item.subject), semesters });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !["FACULTY", "ADMIN", "SUPER_ADMIN", "HOD"].includes(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const title = String(body.title || "").trim();
  const subjectId = String(body.subjectId || "");
  const semesterId = String(body.semesterId || "");
  const dueDate = new Date(body.dueDate);
  if (!title || !subjectId || !semesterId || !body.dueDate || Number.isNaN(dueDate.getTime())) return NextResponse.json({ error: "Title, subject, semester and valid due date are required." }, { status: 400 });
  if (!fileIsValid(body.fileUrl)) return NextResponse.json({ error: "Attachment must be a base64 data URL no larger than 4 MB." }, { status: 400 });
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
  if (!subject || !semester) return NextResponse.json({ error: "Selected subject or semester was not found." }, { status: 404 });
  let facultyId = body.facultyId;
  if (user.role === "FACULTY") {
    const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
    if (!faculty) return NextResponse.json({ error: "Faculty profile is not linked to this account." }, { status: 404 });
    facultyId = faculty.id;
    const assigned = await prisma.facultySubject.findFirst({ where: { facultyId: faculty.id, subjectId } });
    if (!assigned) return NextResponse.json({ error: "You can create assignments only for subjects assigned to you." }, { status: 403 });
  }
  if (!facultyId) return NextResponse.json({ error: "Faculty is required." }, { status: 400 });
  const assignment = await prisma.assignment.create({ data: {
    title, description: body.description ? String(body.description).slice(0, 5000) : null,
    fileName: body.fileName ? String(body.fileName).slice(0, 255) : null,
    fileUrl: body.fileUrl || null, dueDate, facultyId, subjectId, semesterId
  }, include: { subject: true, semester: true } });
  return NextResponse.json({ assignment }, { status: 201 });
}
