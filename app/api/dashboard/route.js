import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pct(present, total) {
  return total ? Math.round((present / total) * 100) : null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const base = {
      role: user.role,
      stats: {},
      notices: await prisma.notice.findMany({
        where: {
          published: true,
          audience: { in: ["ALL", "EVERYONE", "PUBLIC", user.role, user.role.replaceAll("_", " "), user.role.toLowerCase()] },
          AND: [
            { OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] },
            { OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }] }
          ]
        },
        orderBy: { publishedAt: "desc" },
        take: 5,
        select: { id: true, title: true, content: true, category: true, audience: true, publishedAt: true, attachmentUrl: true }
      })
    };

    if (["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const [students, faculty, departments, courses, subjects, pendingLeaves, pendingFees, attendanceToday, upcomingExams, publishedNotices] = await Promise.all([
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.faculty.count({ where: { status: "ACTIVE" } }),
        prisma.department.count(),
        prisma.program.count(),
        prisma.subject.count(),
        prisma.leave.count({ where: { status: "PENDING" } }),
        prisma.studentFee.count({ where: { status: "PENDING" } }),
        prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow } } }),
        prisma.examSchedule.count({ where: { date: { gte: new Date() } } }),
        prisma.notice.count({ where: { published: true, AND: [{ OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] }, { OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }] }] } })
      ]);
      base.stats = {
        cards: [
          { label: "TOTAL STUDENTS", value: students, detail: "Active enrolled students" },
          { label: "TOTAL FACULTY", value: faculty, detail: "Active teaching staff" },
          { label: "TOTAL DEPARTMENTS", value: departments, detail: "Academic departments" },
          { label: "TOTAL COURSES", value: courses, detail: "Configured programs" },
          { label: "PENDING FEES", value: pendingFees, detail: "Student fee records awaiting payment" },
          { label: "TODAY'S ATTENDANCE", value: attendanceToday, detail: "Attendance records for today" },
          { label: "UPCOMING EXAMS", value: upcomingExams, detail: "Future exam schedule entries" },
          { label: "LATEST NOTICES", value: publishedNotices, detail: "Currently published notices" }
        ],
        pendingActions: pendingLeaves + pendingFees,
        examCount: upcomingExams,
        subjectCount: subjects
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
      const [todayClasses, pendingLeaves] = await Promise.all([
        prisma.timetable.count({ where: { facultyId: faculty?.id || "__none__", dayOfWeek: today.getDay() } }),
        prisma.facultyLeave.count({ where: { facultyId: faculty?.id || "__none__", status: "PENDING" } })
      ]);
      const subjects = subjectIds.length;
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
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      const [attendanceGroups, subjects, leaves, exams] = student
        ? await Promise.all([
            prisma.attendance.groupBy({ by: ["status"], where: { studentId: student.id }, _count: { _all: true } }),
            prisma.subject.count({ where: { semesterId: student.semesterId || "__none__" } }),
            prisma.leave.count({ where: { studentId: student.id, status: "PENDING" } }),
            prisma.examSchedule.count({ where: { subject: { semesterId: student.semesterId || "__none__" } } })
          ])
        : [[], 0, 0, 0];
      const present = attendanceGroups.find(x => x.status === "PRESENT")?._count._all || 0;
      const total = attendanceGroups.reduce((sum, x) => sum + x._count._all, 0);
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
      const [attendanceGroups, pending] = studentIds.length
        ? await Promise.all([
            prisma.attendance.groupBy({ by: ["status"], where: { studentId: { in: studentIds } }, _count: { _all: true } }),
            prisma.leave.count({ where: { studentId: { in: studentIds }, status: "PENDING" } })
          ])
        : [[], 0];
      const present = attendanceGroups.find(x => x.status === "PRESENT")?._count._all || 0;
      const totalAttendance = attendanceGroups.reduce((sum, x) => sum + x._count._all, 0);
      base.stats = {
        cards: [
          { label: "CHILDREN", value: studentIds.length, detail: "Linked student accounts" },
          { label: "ATTENDANCE", value: pct(present, totalAttendance) === null ? "—" : pct(present, totalAttendance) + "%", detail: "Combined attendance" },
          { label: "PENDING LEAVE", value: pending, detail: "Leave applications" },
          { label: "PORTAL", value: "Active", detail: "Parent account" }
        ],
        pendingActions: pending
      };
      return NextResponse.json(base);
    }

    if (user.role === "ACCOUNTANT") {
      const [pendingFees, overdueFees, paymentsToday] = await Promise.all([
        prisma.studentFee.count({ where: { status: "PENDING" } }),
        prisma.studentFee.count({ where: { status: "PENDING", feeStructure: { dueDate: { lt: new Date() } } } }),
        prisma.payment.count({ where: { paidAt: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } } })
      ]);
      base.stats = {
        cards: [
          { label: "PENDING FEE ACCOUNTS", value: pendingFees, detail: "Student fee records awaiting payment" },
          { label: "OVERDUE FEE ACCOUNTS", value: overdueFees, detail: "Past-due fee records" },
          { label: "PAYMENTS TODAY", value: paymentsToday, detail: "Receipts recorded today" },
          { label: "FINANCE PORTAL", value: "Active", detail: "Accountant workspace" }
        ],
        pendingActions: pendingFees
      };
      return NextResponse.json(base);
    }

    if (user.role === "EXAM_OFFICER") {
      const [draftExams, activeExams, upcomingSchedules] = await Promise.all([
        prisma.exam.count({ where: { status: "DRAFT" } }),
        prisma.exam.count({ where: { status: { not: "COMPLETED" } } }),
        prisma.examSchedule.count({ where: { date: { gte: new Date() } } })
      ]);
      base.stats = {
        cards: [
          { label: "DRAFT EXAMS", value: draftExams, detail: "Exams awaiting publication" },
          { label: "ACTIVE EXAMS", value: activeExams, detail: "Not marked completed" },
          { label: "UPCOMING SCHEDULES", value: upcomingSchedules, detail: "Future exam timetable entries" },
          { label: "EXAM PORTAL", value: "Active", detail: "Examination workspace" }
        ],
        pendingActions: draftExams
      };
      return NextResponse.json(base);
    }

    if (user.role === "LIBRARIAN") {
      const [books, activeIssues, overdueIssues] = await Promise.all([
        prisma.book.count(),
        prisma.bookIssue.count({ where: { returnDate: null } }),
        prisma.bookIssue.count({ where: { returnDate: null, dueDate: { lt: new Date() } } })
      ]);
      base.stats = {
        cards: [
          { label: "BOOK TITLES", value: books, detail: "Catalogued titles" },
          { label: "ACTIVE ISSUES", value: activeIssues, detail: "Books not yet returned" },
          { label: "OVERDUE ISSUES", value: overdueIssues, detail: "Unreturned books past due date" },
          { label: "LIBRARY PORTAL", value: "Active", detail: "Library workspace" }
        ],
        pendingActions: overdueIssues
      };
      return NextResponse.json(base);
    }

    if (user.role === "HR_STAFF") {
      const [activeFaculty, pendingFacultyLeaves, facultyAttendanceToday] = await Promise.all([
        prisma.faculty.count({ where: { status: "ACTIVE" } }),
        prisma.facultyLeave.count({ where: { status: "PENDING" } }),
        prisma.facultyAttendance.count({ where: { date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } } })
      ]);
      base.stats = {
        cards: [
          { label: "ACTIVE FACULTY", value: activeFaculty, detail: "Faculty records marked active" },
          { label: "PENDING LEAVES", value: pendingFacultyLeaves, detail: "Faculty leave requests awaiting review" },
          { label: "ATTENDANCE TODAY", value: facultyAttendanceToday, detail: "Faculty attendance records" },
          { label: "HR PORTAL", value: "Active", detail: "Human resources workspace" }
        ],
        pendingActions: pendingFacultyLeaves
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
