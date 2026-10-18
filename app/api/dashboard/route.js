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
      }),
      events: await prisma.collegeEvent.findMany({
        where: { status: "PUBLISHED", eventDate: { gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000) } },
        orderBy: { eventDate: "asc" },
        take: 5,
        select: { id: true, title: true, description: true, category: true, eventDate: true, eventTime: true, venue: true, imageUrl: true, status: true }
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
      const [todayClasses, pendingAssignments] = await Promise.all([
        prisma.timetable.count({ where: { facultyId: faculty?.id || "__none__", dayOfWeek: today.getDay() } }),
        prisma.assignment.count({ where: { facultyId: faculty?.id || "__none__", submissions: { some: {} } } })
      ]);
      const subjects = subjectIds.length;
      base.stats = {
        cards: [
          { label: "ASSIGNED SUBJECTS", value: subjects, detail: "Subjects linked to your faculty account" },
          { label: "TOTAL STUDENTS", value: 0, detail: "Students in your assigned subject cohorts" },
          { label: "TODAY'S CLASSES", value: todayClasses, detail: "Your scheduled classes today" },
          { label: "PENDING ASSIGNMENTS", value: pendingAssignments, detail: "Assignments with submissions to review" }
        ],
        pendingActions: pendingAssignments
      };
      return NextResponse.json(base);
    }

    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: user.id }, include: { semester: true, program: true } });
      if (!student) return NextResponse.json({ ...base, stats: { cards: [
        { label: "ATTENDANCE %", value: "—", detail: "Student profile not linked" },
        { label: "CURRENT SEMESTER", value: "—", detail: "Contact administration" },
        { label: "PENDING FEES", value: "—", detail: "Student profile unavailable" },
        { label: "UPCOMING EXAM", value: "—", detail: "Student profile unavailable" },
        { label: "ASSIGNMENTS", value: "—", detail: "Student profile unavailable" },
        { label: "LATEST NOTICES", value: base.notices.length, detail: "Published notices" }
      ] } });
      const [groups, fees, exam, assignments] = await Promise.all([
        prisma.attendance.groupBy({ by: ["status"], where: { studentId: student.id }, _count: { _all: true } }),
        prisma.studentFee.aggregate({ where: { studentId: student.id }, _sum: { amountDue: true, amountPaid: true } }),
        student.semesterId ? prisma.examSchedule.findFirst({ where: { date: { gte: new Date() }, subject: { semesterId: student.semesterId } }, include: { exam: true, subject: true }, orderBy: { date: "asc" } }) : null,
        student.semesterId ? prisma.assignment.count({ where: { semesterId: student.semesterId, subject: { OR: [{ programId: null }, { programId: student.programId }] }, submissions: { none: { studentId: student.id } } } }) : 0
      ]);
      const present = groups.find(x => x.status === "PRESENT")?._count._all || 0;
      const late = groups.find(x => x.status === "LATE")?._count._all || 0;
      const total = groups.reduce((sum, x) => sum + x._count._all, 0);
      const balance = Math.max(0, Number(fees._sum.amountDue || 0) - Number(fees._sum.amountPaid || 0));
      base.student = { name: student.name, studentId: student.studentId, currentSemester: student.semester?.name || "Not assigned", course: student.program?.name || "Not assigned" };
      base.stats = { cards: [
        { label: "ATTENDANCE %", value: total ? Math.round((present + late * 0.5) / total * 100) + "%" : "—", detail: total ? present + " present of " + total + " marked classes" : "No attendance recorded" },
        { label: "CURRENT SEMESTER", value: student.semester?.name || "Not assigned", detail: student.program?.name || "Current programme" },
        { label: "PENDING FEES", value: "₹" + balance.toLocaleString("en-IN", { maximumFractionDigits: 2 }), detail: balance > 0 ? "Outstanding fee balance" : "No outstanding fee balance" },
        { label: "UPCOMING EXAM", value: exam ? new Date(exam.date).toLocaleDateString("en-IN") : "—", detail: exam ? exam.exam.name + " • " + exam.subject.name : "No upcoming exam" },
        { label: "ASSIGNMENTS", value: assignments, detail: "Assignments not yet submitted" },
        { label: "LATEST NOTICES", value: base.notices.length, detail: "Published notices for students" }
      ], pendingActions: balance > 0 ? 1 : 0 };
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
