import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 4 * 1024 * 1024;
const MIME = {
  pdf: "application/pdf", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
  gif: "image/gif", zip: "application/zip"
};
const safeFile = (name) => String(name || "").replace(/[^a-zA-Z0-9._ -]/g, "").slice(0, 180);
function parseDataUrl(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_BYTES) return null;
  return { mime: match[1].toLowerCase(), bytes };
}
function validFile(name, dataUrl) {
  const ext = String(name || "").split(".").pop().toLowerCase();
  const parsed = parseDataUrl(dataUrl);
  if (!parsed || !MIME[ext] || MIME[ext] !== parsed.mime) return null;
  return { ...parsed, ext };
}
export async function GET() {
  const user = await getSessionUser();
  if (!user || !["ADMIN", "SUPER_ADMIN", "HOD", "FACULTY"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let subjectWhere = { status: "ACTIVE" };
  let programWhere = { status: "ACTIVE" };
  let semesterWhere = {};
  let materialWhere = {};

  // Faculty can only browse materials for subjects assigned to them (and their own uploads).
  if (user.role === "FACULTY") {
    const faculty = await prisma.faculty.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile is not linked to this account." }, { status: 404 });
    }
    const assigned = await prisma.facultySubject.findMany({
      where: { facultyId: faculty.id },
      select: { subjectId: true }
    });
    const subjectIds = [...new Set(assigned.map((item) => item.subjectId))];
    subjectWhere = { status: "ACTIVE", id: { in: subjectIds } };
    materialWhere = {
      OR: [
        { facultyId: faculty.id },
        { subjectId: { in: subjectIds } }
      ]
    };
  }

  // HOD access is limited to the HOD's own department.
  if (user.role === "HOD") {
    const faculty = await prisma.faculty.findUnique({
      where: { userId: user.id },
      select: { departmentId: true }
    });
    if (!faculty?.departmentId) {
      return NextResponse.json({ error: "HOD account is not linked to a department." }, { status: 403 });
    }
    const departmentId = faculty.departmentId;
    subjectWhere = { status: "ACTIVE", departmentId };
    programWhere = { status: "ACTIVE", departmentId };
    semesterWhere = { subjects: { some: { departmentId } } };
    materialWhere = { subject: { departmentId } };
  }

  const [subjects, programs, semesters, materials] = await Promise.all([
    prisma.subject.findMany({ where: subjectWhere, orderBy: { name: "asc" } }),
    prisma.program.findMany({ where: programWhere, orderBy: { name: "asc" } }),
    prisma.semester.findMany({ where: semesterWhere, orderBy: { number: "asc" } }),
    prisma.studyMaterial.findMany({
      where: materialWhere,
      include: { subject: true, program: true, semester: true, faculty: true },
      orderBy: { uploadedAt: "desc" }
    })
  ]);
  return NextResponse.json({ subjects, programs, semesters, materials });
}
export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !["ADMIN", "SUPER_ADMIN", "HOD", "FACULTY"].includes(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const title = String(body.title || "").trim();
  const subjectId = String(body.subjectId || "");
  const programId = String(body.programId || "");
  const semesterId = String(body.semesterId || "");
  const fileName = safeFile(body.fileName);
  const file = validFile(fileName, body.fileData);
  if (!title || !subjectId || !programId || !semesterId || !file) return NextResponse.json({ error: "Title, subject, course, semester and a supported file are required. Maximum file size is 4 MB." }, { status: 400 });
  const [subject, program, semester] = await Promise.all([
    prisma.subject.findUnique({ where: { id: subjectId } }),
    prisma.program.findUnique({ where: { id: programId } }),
    prisma.semester.findUnique({ where: { id: semesterId } })
  ]);
  if (!subject || !program || !semester) return NextResponse.json({ error: "Selected subject, course or semester was not found." }, { status: 404 });
  if (subject.programId && subject.programId !== programId) return NextResponse.json({ error: "Subject does not belong to the selected course." }, { status: 400 });
  if (subject.semesterId && subject.semesterId !== semesterId) return NextResponse.json({ error: "Subject does not belong to the selected semester." }, { status: 400 });
  let facultyId = null;
  if (user.role === "FACULTY") {
    const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
    if (!faculty) return NextResponse.json({ error: "Faculty profile is not linked to this account." }, { status: 404 });
    facultyId = faculty.id;
    const assigned = await prisma.facultySubject.findFirst({ where: { facultyId, subjectId } });
    if (!assigned) return NextResponse.json({ error: "You can upload materials only for subjects assigned to you." }, { status: 403 });
  }
  const material = await prisma.studyMaterial.create({ data: {
    title, description: body.description ? String(body.description).slice(0, 3000) : null,
    fileName, fileType: file.mime, fileUrl: body.fileData, facultyId, subjectId, programId, semesterId
  }, include: { subject: true, program: true, semester: true } });
  return NextResponse.json({ material }, { status: 201 });
}
