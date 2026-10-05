"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const roleNames = {
  SUPER_ADMIN:"Super Admin", ADMIN:"Admin", HOD:"HOD", FACULTY:"Faculty", STUDENT:"Student",
  PARENT:"Parent", ACCOUNTANT:"Accountant", EXAM_OFFICER:"Examination Officer", LIBRARIAN:"Librarian", HR_STAFF:"HR/Staff"
};

const menus = {
  STUDENT:["Dashboard","My Profile","Attendance","Timetable","Results","Leave","Examination","Hall Ticket"],
  FACULTY:["Dashboard","My Profile","Subjects","Timetable","Attendance","Workload","Leave","Examination"],
  HOD:["Dashboard","Department","Faculty","Subjects","Approvals","Attendance Reports","Examination","Timetable"],
  PARENT:["Dashboard","Student Profile","Attendance","Results","Fees","Leave","Examination"],
  ADMIN:["Dashboard","Students","Faculty","HOD","Academic Management","Subjects","Timetable","Attendance","Reports","Leave","Examination","Hall Ticket"],
  SUPER_ADMIN:["Dashboard","Institutes","Admins","Students","Faculty","Academics","Attendance","Examination","Reports","Settings"],
  ACCOUNTANT:["Dashboard","Students","Fees","Payments","Reports"],
  EXAM_OFFICER:["Dashboard","Examinations","Schedules","Hall Tickets","Results","Reports"],
  LIBRARIAN:["Dashboard","Students","Books","Issue/Return","Fines","Reports"],
  HR_STAFF:["Dashboard","Staff","Attendance","Leave","Payroll","Reports"]
};

export default function DashboardClient({ user }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const role = user.role;
  const coreLinks = { Students:"/admin/students", Faculty:"/admin/faculty", HOD:"/admin/hod", Departments:"/admin/core?module=departments", Programs:"/admin/core?module=programs", Academics:"/admin/core?module=academicYears", Semesters:"/admin/core?module=semesters", Divisions:"/admin/core?module=divisions", Subjects:"/admin/core?module=subjects", "Academic Management":"/admin/academics", "Timetable":"/admin/core?module=rooms", "Institutes":"/admin/institute", "Settings":"/admin/institute", "Rooms/Labs":"/admin/core?module=rooms", Library:"/admin/core?module=books", Notices:"/admin/core?module=notices" };
  const displayRole = roleNames[role] || role;
  const items = menus[role] || menus.STUDENT;
  const displayName = user.username || user.email || "User";

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return <main className="dash"><aside>
    <div className="sideBrand"><span className="brandMark">N</span><b>NOBLE ERP</b></div>
    <div className="rolePill">{displayRole} Portal</div>
    <div className="sideNav">{items.map((x,i)=><button className={i===0?"selected":""} key={x} onClick={() => coreLinks[x] ? router.push(coreLinks[x]) : router.push("/dashboard")}><span>{["⌂","◉","▣","◫","✓","▤","◈","▥"][i%8]}</span>{x}</button>)}</div>
    <button className="logout" onClick={logout} disabled={busy}>↪ {busy ? "Signing out…" : "Sign out"}</button>
  </aside>
  <section className="content"><header><div><div className="eyebrow">NOBLE GROUP OF INSTITUTES</div><h1>Good morning, {displayName}</h1><p>Here’s your {displayRole.toLowerCase()} workspace overview.</p></div><div className="avatar">{displayName.slice(0,1).toUpperCase()}</div></header>
    <div className="statGrid"><div><small>ATTENDANCE</small><b>—</b><span>Live data will appear here</span></div><div><small>ACTIVE SUBJECTS</small><b>—</b><span>From academic setup</span></div><div><small>PENDING ACTIONS</small><b>—</b><span>From your workflows</span></div><div><small>ACADEMIC STATUS</small><b>Active</b><span>2026–27</span></div></div>
    <div className="panelGrid"><div className="panel"><div className="panelTitle"><b>Today</b><span>Live ERP workspace</span></div><div className="emptyState"><strong>Secure dashboard connected.</strong><p>You are signed in through the database-backed ERP session. The next modules will replace these placeholders with live database data.</p></div></div><div className="panel"><div className="panelTitle"><b>Quick actions</b></div><div className="quick">{items.slice(1,5).map(x=><button key={x} onClick={()=>coreLinks[x] ? router.push(coreLinks[x]) : router.push("/dashboard")}>{x}<span>→</span></button>)}</div></div></div>
  </section></main>;
}
