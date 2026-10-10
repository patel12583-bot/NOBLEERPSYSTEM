import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const module = new URL(request.url).searchParams.get("module") || "profile";

  try {
    if (module === "profile") {
      const profile =
        user.role === "STUDENT" ? await prisma.student.findUnique({ where: { userId: user.id }, include: { department: true, program: true, semester: true, division: true, academicYear: true } }) :
        user.role === "FACULTY" || user.role === "HOD" ? await prisma.faculty.findUnique({ where: { userId: user.id }, include: { department: true, subjects: { include: { subject: true } } } }) :
        user.role === "PARENT" ? await prisma.parent.findUnique({ where: { userId: user.id }, include: { students: { include: { program: true, semester: true, department: true } } } }) :
        user;
      return NextResponse.json({ module, profile });
    }

    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

      if (module === "attendance") {
        const rows = await prisma.attendance.findMany({ where: { studentId: student.id }, include: { subject: true }, orderBy: { date: "desc" } });
        const grouped = Object.values(rows.reduce((a, x) => {
          const k = x.subjectId;
          a[k] ||= { subject: x.subject, present: 0, absent: 0, late: 0, total: 0 };
          a[k].total++;
          a[k][x.status.toLowerCase()]++;
          return a;
        }, {}));
        return NextResponse.json({ module, rows: grouped });
      }

      if (module === "timetable") {
        const rows = await prisma.timetable.findMany({
          where: { divisionId: student.divisionId || "__none__" },
          include: { subject: true, faculty: true, room: true },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
        });
        return NextResponse.json({ module, rows });
      }

      if (module === "results") {
        const rows = await prisma.result.findMany({ where: { studentId: student.id }, include: { subject: true, exam: true }, orderBy: { exam: { startDate: "desc" } } });
        return NextResponse.json({ module, rows });
      }

      if (module === "fees") {
        const rows = await prisma.studentFee.findMany({ where: { studentId: student.id }, include: { feeStructure: true, payments: true }, orderBy: { createdAt: "desc" } });
        return NextResponse.json({ module, rows });
      }

      if (module === "examination") {
        const subjectIds = (await prisma.subject.findMany({ where: { semesterId: student.semesterId || "__none__" }, select: { id: true } })).map(x => x.id);
        const rows = await prisma.examSchedule.findMany({ where: { subjectId: { in: subjectIds.length ? subjectIds : ["__none__"] } }, include: { exam: true, subject: true, room: true }, orderBy: { date: "asc" } });
        return NextResponse.json({ module, rows });
      }
    }

    if (user.role === "FACULTY" || user.role === "HOD") {
      const faculty = await prisma.faculty.findUnique({ where: { userId: user.id }, include: { subjects: { include: { subject: true } }, department: true } });
      if (!faculty) return NextResponse.json({ error: "Faculty profile not found." }, { status: 404 });

      if (module === "subjects") return NextResponse.json({ module, rows: faculty.subjects.map(x => x.subject) });
      if (module === "timetable") {
        const rows = await prisma.timetable.findMany({ where: { facultyId: faculty.id }, include: { subject: true, division: { include: { program: true, semester: true } }, room: true }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
        return NextResponse.json({ module, rows });
      }
      if (module === "attendance") {
        const rows = await prisma.attendance.findMany({ where: { subjectId: { in: faculty.subjects.map(x => x.subjectId) } }, include: { student: true, subject: true }, orderBy: { date: "desc" }, take: 200 });
        return NextResponse.json({ module, rows });
      }
    }

    if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({ where: { userId: user.id }, include: { students: true } });
      const ids = parent?.students.map(x => x.id) || [];
      if (module === "attendance") {
        const rows = await prisma.attendance.findMany({ where: { studentId: { in: ids.length ? ids : ["__none__"] } }, include: { student: true, subject: true }, orderBy: { date: "desc" }, take: 200 });
        return NextResponse.json({ module, rows });
      }
      if (module === "results") {
        const rows = await prisma.result.findMany({ where: { studentId: { in: ids.length ? ids : ["__none__"] } }, include: { student: true, subject: true, exam: true }, orderBy: { id: "desc" } });
        return NextResponse.json({ module, rows });
      }
      if (module === "fees") {
        const rows = await prisma.studentFee.findMany({ where: { studentId: { in: ids.length ? ids : ["__none__"] } }, include: { student: true, feeStructure: true, payments: true }, orderBy: { createdAt: "desc" } });
        return NextResponse.json({ module, rows });
      }
    }

    return NextResponse.json({ module, rows: [] });
  } catch (error) {
    console.error("Portal API error:", error);
    return NextResponse.json({ error: "Unable to load this portal module." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "STUDENT") return NextResponse.json({ error: "Only students can edit their own profile here." }, { status: 403 });

  try {
    const body = await request.json();
    const allowed = ["name", "email", "mobile", "address", "gender"];
    const data = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        const value = typeof body[key] === "string" ? body[key].trim() : "";
        if (value.length > (key === "address" ? 500 : 120)) {
          return NextResponse.json({ error: key + " is too long." }, { status: 400 });
        }
        data[key] = value || null;
      }
    }
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "No editable fields were provided." }, { status: 400 });
    if (data.name !== undefined && !data.name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
    if (data.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(data.email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const profile = await prisma.student.update({
      where: { userId: user.id },
      data,
      include: { department: true, program: true, semester: true, division: true, academicYear: true },
    });
    await prisma.auditLog.create({ data: { userId: user.id, action: "UPDATE_OWN_PROFILE", module: "STUDENT_PROFILE", recordId: profile.id, metadata: JSON.stringify({ fields: Object.keys(data) }) } }).catch(() => {});
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Student profile update error:", error);
    return NextResponse.json({ error: "Unable to update profile. Please try again." }, { status: 500 });
  }
}
