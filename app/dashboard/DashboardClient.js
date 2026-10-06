"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const roleNames = {
  SUPER_ADMIN:"Super Admin", ADMIN:"Admin", HOD:"HOD", FACULTY:"Faculty", STUDENT:"Student",
  PARENT:"Parent", ACCOUNTANT:"Accountant", EXAM_OFFICER:"Examination Officer", LIBRARIAN:"Librarian", HR_STAFF:"HR/Staff"
};

const menus = {
  STUDENT:["Dashboard","My Profile","Attendance","Timetable","Results","Leave","Examination","Hall Ticket"],
  FACULTY:["Dashboard","My Profile","Subjects","Timetable","Attendance","Workload","Leave","Examination"],
  HOD:["Dashboard","Department","Faculty","Subjects","Approvals","Attendance Reports","Examination","Timetable"],
  PARENT:["Dashboard","Student Profile","Attendance","Results","Fees","Leave","Examination"],
  ADMIN:["Dashboard","Students","Faculty","HOD","Academic Management","Subjects","Timetable","Attendance","Documents","Reports","Exports","Leave","Examination","Hall Ticket"],
  SUPER_ADMIN:["Dashboard","Institutes","Admins","Students","Faculty","Academics","Attendance","Documents","Examination","Reports","Exports","Settings"],
  ACCOUNTANT:["Dashboard","Students","Fees","Payments","Reports"],
  EXAM_OFFICER:["Dashboard","Examinations","Schedules","Hall Tickets","Results","Reports"],
  LIBRARIAN:["Dashboard","Students","Books","Issue/Return","Fines","Reports"],
  HR_STAFF:["Dashboard","Staff","Attendance","Leave","Payroll","Reports"]
};

export default function DashboardClient({ user }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const role = user.role;
  const adminLinks = {
    Students:"/admin/students", Faculty:"/admin/faculty", HOD:"/admin/hod",
    Departments:"/admin/core?module=departments", Department:"/admin/core?module=departments", Programs:"/admin/core?module=programs",
    Academics:"/admin/academics", Semesters:"/admin/core?module=semesters",
    Divisions:"/admin/core?module=divisions", Subjects:"/admin/subjects", Approvals:"/leave",
    "Academic Management":"/admin/academics", Timetable:"/admin/timetable", Workload:"/admin/faculty",
    Attendance:"/admin/attendance", Documents:"/admin/documents", Exports:"/admin/exports", "Attendance Reports":"/admin/attendance/reports",
    Reports:"/admin/attendance/reports", Institutes:"/admin/institute",
    Settings:"/admin/institute", "Leave":"/leave", Examination:"/admin/examination",
    "Hall Ticket":"/hall-ticket", Fees:"/admin/fees", Payments:"/admin/fees", Results:"/admin/results", "Examinations":"/admin/examination", "Schedules":"/admin/examination", "Hall Tickets":"/hall-ticket", "Books":"/admin/library", "Issue/Return":"/admin/library", Fines:"/admin/library", Staff:"/admin/hr", Payroll:"/admin/hr"
  };
  const portalLinks = {
    "My Profile":"/portal?module=profile", "Student Profile":"/portal?module=profile",
    Profile:"/portal?module=profile", Attendance:"/portal?module=attendance",
    Timetable:"/portal?module=timetable", Results:"/portal?module=results",
    Examination:"/portal?module=examination", "Hall Ticket":"/hall-ticket",
    Subjects:"/portal?module=subjects", Leave:"/leave"
  };
  const coreLinks = ["ADMIN","SUPER_ADMIN","HOD"].includes(role)
    ? adminLinks
    : role === "HR_STAFF"
      ? { ...portalLinks, Staff:"/admin/hr", Payroll:"/admin/hr", Attendance:"/admin/attendance/reports", Leave:"/leave" }
      : { ...portalLinks, Faculty:"/admin/faculty", HOD:"/admin/hod" };
  const displayRole = roleNames[role] || role;
  const items = menus[role] || menus.STUDENT;
  const displayName = user.username || user.email || "User";

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Unable to load dashboard.");
        return d;
      })
      .then(d => active && setData(d))
      .catch(e => active && setError(e.message))
      .finally(() => {});
    return () => { active = false; };
  }, []);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const cards = data?.stats?.cards || [];
  return <main className="dash">
    <aside>
      <div className="sideBrand"><span className="brandMark">N</span><b>NOBLE ERP</b></div>
      <div className="rolePill">{displayRole} Portal</div>
      <div className="sideNav">
        {items.map((x,i)=><button className={i===0?"selected":""} key={x} onClick={() => coreLinks[x] ? router.push(coreLinks[x]) : router.push("/dashboard")}>
          <span>{["⌂","◉","▣","◫","✓","▤","◈","▥"][i%8]}</span>{x}
        </button>)}
      </div>
      <button className="logout" onClick={logout} disabled={busy}>↪ {busy ? "Signing out…" : "Sign out"}</button>
    </aside>
    <section className="content">
      <header>
        <div><div className="eyebrow">NOBLE GROUP OF INSTITUTES</div><h1>Good morning, {displayName}</h1><p>Here’s your {displayRole.toLowerCase()} workspace overview.</p></div>
        <div className="avatar">{displayName.slice(0,1).toUpperCase()}</div>
      </header>

      {error && <div className="error" style={{marginBottom:18}}>{error}</div>}

      <div className="statGrid">
        {(cards.length ? cards : [
          {label:"LOADING",value:"…",detail:"Fetching live ERP data"},
          {label:"LOADING",value:"…",detail:"Fetching live ERP data"},
          {label:"LOADING",value:"…",detail:"Fetching live ERP data"},
          {label:"STATUS",value:"Online",detail:"Secure session active"}
        ]).map((x,i)=><div key={i}><small>{x.label}</small><b>{x.value}</b><span>{x.detail}</span></div>)}
      </div>

      <div className="panelGrid">
        <div className="panel">
          <div className="panelTitle"><b>ERP Overview</b><span>{data ? "Live database" : "Loading…"}</span></div>
          <div className="emptyState">
            <strong>{data ? "Your dashboard is live." : "Loading your dashboard…"}</strong>
            <p>{data ? "The figures above are loaded from Noble ERP’s database for your role. Use the navigation to manage records and workflows." : "Please wait while the latest academic and workflow data is loaded."}</p>
          </div>
        </div>
        <div className="panel">
          <div className="panelTitle"><b>Quick actions</b><span>{data?.stats?.pendingActions ?? 0} pending</span></div>
          <div className="quick">
            {items.slice(1,5).map(x=><button key={x} onClick={()=>coreLinks[x] ? router.push(coreLinks[x]) : router.push("/dashboard")}>{x}<span>→</span></button>)}
          </div>
        </div>
      </div>

      <div className="panel" style={{marginTop:18}}>
        <div className="panelTitle"><b>Recent Notices</b><span>Published updates</span></div>
        {data?.notices?.length ? <div className="quick">{data.notices.map(n=><button key={n.id} onClick={()=>alert(n.title)}>{n.title}<span>→</span></button>)}</div> : <div className="emptyState"><strong>No published notices</strong><p>Notices published by administration will appear here.</p></div>}
      </div>
    </section>
  </main>;
}
