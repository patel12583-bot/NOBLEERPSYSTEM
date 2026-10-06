import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pct(present, total) {
  return total ? Math.round((present / total) * 100) : null;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const base = {
      role: user.role,
      stats: {},
      notices: await prisma.notice.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: { id: true, title: true, audience: true, publishedAt: true }
      })
    };

    if (["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      const [students, faculty, departments, subjects, pendingLeaves, exams] = await Promise.all([
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.faculty.count({ where: { status: "ACTIVE" } }),
        prisma.department.count(),
        prisma.subject.count(),
        prisma.leave.count({ where: { status: "PENDING" } }),
        prisma.exam.count({ where: { status: { not: "COMPLETED" } } })
      ]);
      base.stats = {
        cards: [
          { label: "ACTIVE STUDENTS", value: students, detail: "Currently enrolled" },
          { label: "ACTIVE FACULTY", value: faculty, detail: "Teaching staff" },
          { label: "DEPARTMENTS", value: departments, detail: "Academic departments" },
          { label: "ACTIVE SUBJECTS", value: subjects, detail: "Configured subjects" }
        ],
        pendingActions: pendingLeaves,
        examCount: exams
      };
      return NextResponse.json(base);
    }

    if (user.role === "HOD") {
      const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
      const departmentId = faculty?.departmentId;
      const [students, staff, subjects, pendingLeaves] = await Promise.all([
        prisma.student.count({ where: { status: "ACTIVE", departmentId: departmentId || "__none__" } }),
        prisma.faculty.count({ where: { status: "ACTIVE", departmentId: departmentId || "__none__" } }),
        prisma.subject.count({ where: { departmentId: departmentId || "__none__" } }),
        prisma.leave.count({ where: { status: "PENDING", student: { departmentId: departmentId || "__none__" } } })
      ]);
      base.stats = {
        cards: [
          { label: "DEPARTMENT STUDENTS", value: students, detail: "Active students" },
          { label: "FACULTY", value: staff, detail: "Active faculty" },
          { label: "SUBJECTS", value: subjects, detail: "Department subjects" },
          { label: "PENDING ACTIONS", value: pendingLeaves, detail: "Leave requests" }
        ],
        pendingActions: pendingLeaves
      };
      return NextResponse.json(base);
    }

    if (user.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: user.id },
        include: { subjects: true }
      });
      const subjectIds = faculty?.subjects.map(x => x.subjectId) || [];
      const [subjects, todayClasses, pendingLeaves] = await Promise.all([
        prisma.subject.count({ where: { id: { in: subjectIds.length ? subjectIds : ["__none__"] } } }),
        prisma.timetable.count({ where: { facultyId: faculty?.id || "__none__", dayOfWeek: today.getDay() } }),
        prisma.facultyLeave.count({ where: { facultyId: faculty?.id || "__none__", status: "PENDING" } })
      ]);
      base.stats = {
        cards: [
          { label: "MY SUBJECTS", value: subjects, detail: "Assigned subjects" },
          { label: "TODAY'S CLASSES", value: todayClasses, detail: "Timetable slots" },
          { label: "LEAVE REQUESTS", value: pendingLeaves, detail: "My pending requests" },
          { label: "STATUS", value: "Active", detail: "Faculty account" }
        ],
        pendingActions: pendingLeaves
      };
      return NextResponse.json(base);
    }

    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: user.id },
        include: { subjects: false }
      });
      const records = student
        ? await prisma.attendance.findMany({ where: { studentId: student.id }, select: { status: true } })
        : [];
      const present = records.filter(x => x.status === "PRESENT").length;
      const total = records.length;
      const [subjects, leaves, exams] = student
        ? await Promise.all([
            prisma.subject.count({ where: { semesterId: student.semesterId || "__none__" } }),
            prisma.leave.count({ where: { studentId: student.id, status: "PENDING" } }),
            prisma.examSchedule.count({ where: { subjectId: { in: await prisma.subject.findMany({ where: { semesterId: student.semesterId || "__none__" }, select: { id: true } }).then(x => x.map(s => s.id)) } } })
          ])
        : [0, 0, 0];
      base.stats = {
        cards: [
          { label: "ATTENDANCE", value: pct(present, total) === null ? "—" : pct(present, total) + "%", detail: total ? present + " of " + total + " classes" : "No attendance recorded" },
          { label: "ACTIVE SUBJECTS", value: subjects, detail: "Current semester" },
          { label: "PENDING LEAVE", value: leaves, detail: "Leave applications" },
          { label: "EXAM SCHEDULES", value: exams, detail: "Published schedules" }
        ],
        pendingActions: leaves
      };
      return NextResponse.json(base);
    }

    if (user.role === "PARENT") {
      const parent = await prisma.parent.findUnique({ where: { userId: user.id }, include: { students: true } });
      const studentIds = parent?.students.map(x => x.id) || [];
      const records = studentIds.length ? await prisma.attendance.findMany({ where: { studentId: { in: studentIds } }, select: { status: true } }) : [];
      const present = records.filter(x => x.status === "PRESENT").length;
      const pending = studentIds.length ? await prisma.leave.count({ where: { studentId: { in: studentIds }, status: "PENDING" } }) : 0;
      base.stats = {
        cards: [
          { label: "CHILDREN", value: studentIds.length, detail: "Linked student accounts" },
          { label: "ATTENDANCE", value: pct(present, records.length) === null ? "—" : pct(present, records.length) + "%", detail: "Combined attendance" },
          { label: "PENDING LEAVE", value: pending, detail: "Leave applications" },
          { label: "PORTAL", value: "Active", detail: "Parent account" }
        ],
        pendingActions: pending
      };
      return NextResponse.json(base);
    }

    base.stats = {
      cards: [
        { label: "ACCOUNT", value: "Active", detail: user.role.replaceAll("_", " ") },
        { label: "TODAY", value: today.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), detail: "ERP workspace" },
        { label: "PENDING ACTIONS", value: 0, detail: "No pending actions" },
        { label: "STATUS", value: "Online", detail: "Database session active" }
      ],
      pendingActions: 0
    };
    return NextResponse.json(base);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Unable to load dashboard data." }, { status: 500 });
  }
}
