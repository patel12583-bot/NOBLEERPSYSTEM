import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const permitted = ["SUPER_ADMIN", "ADMIN", "HOD", "ACCOUNTANT", "EXAM_OFFICER", "HR_STAFF"];
const date = value => value ? new Date(value) : null;
const inRange = (field, from, to) => ({ ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) });
const num = value => Number(value || 0);
const money = value => Number(value || 0);
const asDate = value => value ? new Date(value).toISOString().slice(0, 10) : "";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user || !permitted.includes(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = new URL(request.url).searchParams;
  const type = q.get("type") || "students";
  const from = date(q.get("from"));
  const to = q.get("to") ? new Date(q.get("to") + "T23:59:59.999") : null;
  const departmentId = q.get("departmentId") || "";
  const programId = q.get("programId") || "";
  const status = q.get("status") || "";
  const commonStudent = {
    ...(departmentId ? { departmentId } : {}),
    ...(programId ? { programId } : {}),
    ...(status ? { status } : {}),
  };
  const deptScope = user.role === "HOD"
    ? (await prisma.faculty.findUnique({ where: { userId: user.id }, select: { departmentId: true } }))?.departmentId
    : null;
  if (user.role === "HOD" && !deptScope) return NextResponse.json({ error: "Your account has no assigned department." }, { status: 403 });
  const scopedDepartment = deptScope || departmentId;
  const studentWhere = { ...commonStudent, ...(scopedDepartment ? { departmentId: scopedDepartment } : {}) };
  let rows = [];
  let columns = [];
  let title = "";

  if (type === "students") {
    title = "Student Report";
    columns = ["Student ID", "Name", "Email", "Mobile", "Department", "Course", "Semester", "Division", "Status", "Admission Date"];
    const items = await prisma.student.findMany({ where: studentWhere, include: { department: true, program: true, semester: true, division: true }, orderBy: { name: "asc" } });
    rows = items.map(s => [s.studentId, s.name, s.email || "", s.mobile || "", s.department?.name || "", s.program?.name || "", s.semester?.name || "", s.division?.name || "", s.status, asDate(s.admissionDate)]);
  } else if (type === "faculty") {
    title = "Faculty Report";
    columns = ["Faculty ID", "Name", "Email", "Mobile", "Designation", "Department", "Status", "Joining Date"];
    const items = await prisma.faculty.findMany({ where: { ...(scopedDepartment ? { departmentId: scopedDepartment } : {}), ...(status ? { status } : {}), ...(from || to ? { joiningDate: inRange("joiningDate", from, to) } : {}) }, include: { department: true }, orderBy: { name: "asc" } });
    rows = items.map(f => [f.facultyId, f.name, f.email || "", f.mobile || "", f.designation || "", f.department?.name || "", f.status, asDate(f.joiningDate)]);
  } else if (type === "attendance") {
    title = "Attendance Report";
    columns = ["Student ID", "Student", "Department", "Course", "Total Marked", "Present", "Absent", "Late", "Attendance %"];
    const items = await prisma.attendance.findMany({ where: { ...(from || to ? { date: inRange("date", from, to) } : {}), ...(scopedDepartment ? { student: { departmentId: scopedDepartment } } : {}) }, include: { student: { include: { department: true, program: true } } } });
    const map = new Map();
    for (const a of items) {
      const s = a.student;
      if (!s || (programId && s.programId !== programId)) continue;
      if (!map.has(s.id)) map.set(s.id, { id: s.studentId, name: s.name, department: s.department?.name || "", course: s.program?.name || "", total: 0, present: 0, absent: 0, late: 0 });
      const r = map.get(s.id); r.total++;
      if (a.status === "PRESENT") r.present++;
      if (a.status === "ABSENT") r.absent++;
      if (a.status === "LATE") r.late++;
    }
    rows = [...map.values()].map(r => [r.id, r.name, r.department, r.course, r.total, r.present, r.absent, r.late, r.total ? Math.round((r.present + r.late * 0.5) / r.total * 10000) / 100 : 0]);
  } else if (type === "results") {
    title = "Result Report";
    columns = ["Student ID", "Student", "Department", "Course", "Exam", "Subject", "Marks", "Percentage", "Grade", "Result Status"];
    const items = await prisma.result.findMany({ where: { ...(from || to ? { exam: { startDate: inRange("startDate", from, to) } } : {}), ...(scopedDepartment ? { student: { departmentId: scopedDepartment } } : {}) }, include: { student: { include: { department: true, program: true } }, exam: true, subject: true }, orderBy: { student: { name: "asc" } } });
    rows = items.filter(r => !programId || r.student.programId === programId).map(r => [r.student.studentId, r.student.name, r.student.department?.name || "", r.student.program?.name || "", r.exam.name, r.subject.name, r.marks ?? "", r.percentage ?? "", r.grade || "", r.status]);
  } else if (type === "fees" || type === "pendingFees") {
    title = type === "pendingFees" ? "Pending Fees Report" : "Fees Report";
    columns = ["Student ID", "Student", "Department", "Course", "Fee", "Amount Due", "Amount Paid", "Balance", "Status", "Due Date"];
    const items = await prisma.studentFee.findMany({ where: { ...(from || to ? { createdAt: inRange("createdAt", from, to) } : {}), ...(scopedDepartment || programId ? { student: { ...(scopedDepartment ? { departmentId: scopedDepartment } : {}), ...(programId ? { programId } : {}) } } : {}) }, include: { student: { include: { department: true, program: true } }, feeStructure: true }, orderBy: { createdAt: "desc" } });
    rows = items.map(f => { const due = money(f.amountDue), paid = money(f.amountPaid); return [f.student.studentId, f.student.name, f.student.department?.name || "", f.student.program?.name || "", f.feeStructure.name, due, paid, Math.max(0, due - paid), f.status, asDate(f.feeStructure.dueDate)]; });
    if (type === "pendingFees") rows = rows.filter(r => Number(r[7]) > 0);
  } else if (type === "departments") {
    title = "Department Report";
    columns = ["Department Code", "Department", "Status", "Students", "Faculty", "Courses"];
    const items = await prisma.department.findMany({ where: scopedDepartment ? { id: scopedDepartment } : {}, include: { _count: { select: { students: true, faculty: true, programs: true } } }, orderBy: { name: "asc" } });
    rows = items.map(d => [d.code, d.name, d.status, d._count.students, d._count.faculty, d._count.programs]);
  } else if (type === "courses") {
    title = "Course Report";
    columns = ["Course Code", "Course", "Department", "Duration (Years)", "Semesters", "Status", "Students"];
    const items = await prisma.program.findMany({ where: scopedDepartment ? { departmentId: scopedDepartment } : {}, include: { department: true, _count: { select: { students: true } } }, orderBy: { name: "asc" } });
    rows = items.map(p => [p.code, p.name, p.department?.name || "", p.durationYears, p.totalSemesters, p.status, p._count.students]);
  } else {
    return NextResponse.json({ error: "Unsupported report type." }, { status: 400 });
  }

  return NextResponse.json({
    title, columns, rows,
    summary: { records: rows.length, generatedAt: new Date().toISOString() },
    filters: { from: q.get("from") || "", to: q.get("to") || "", departmentId: scopedDepartment || "", programId, status },
  }, { headers: { "Cache-Control": "no-store" } });
}
