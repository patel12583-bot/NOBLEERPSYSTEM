import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = await getSessionUser();

  if (!user || !["SUPER_ADMIN", "ADMIN", "HOD"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      department: { select: { name: true, code: true } },
      program: { select: { name: true, code: true } },
      semester: { select: { name: true, number: true } },
      academicYear: { select: { name: true } },
      division: {
        include: {
          timetables: {
            include: {
              subject: { select: { name: true, code: true } },
              faculty: { select: { name: true } },
              room: { select: { name: true, code: true } },
            },
          },
        },
      },
      attendance: {
        orderBy: { date: "desc" },
        take: 50,
        include: { subject: { select: { name: true, code: true } } },
      },
      results: {
        orderBy: { exam: { createdAt: "desc" } },
        include: {
          exam: { select: { name: true, examType: true } },
          subject: { select: { name: true, code: true } },
        },
      },
      studentFees: {
        orderBy: { createdAt: "desc" },
        include: {
          feeStructure: { select: { name: true, dueDate: true } },
          payments: { select: { amount: true, receiptNo: true, paidAt: true } },
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  if (user.role === "HOD") {
    const faculty = await prisma.faculty.findUnique({
      where: { userId: user.id },
      select: { departmentId: true },
    });

    if (!faculty?.departmentId || student.departmentId !== faculty.departmentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ student });
}
