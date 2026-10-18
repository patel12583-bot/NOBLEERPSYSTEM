"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const roleNames = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", HOD: "HOD", FACULTY: "Faculty",
  STUDENT: "Student", PARENT: "Parent", ACCOUNTANT: "Accountant",
  EXAM_OFFICER: "Examination Officer", LIBRARIAN: "Librarian", HR_STAFF: "HR / Staff",
};
const menus = {
  STUDENT: ["Dashboard", "My Profile", "Attendance", "Results", "Fees", "Timetable", "Assignments", "Study Materials", "Notices", "Events", "Change Password"],
  FACULTY: ["Dashboard", "My Profile", "Subjects", "Timetable", "Attendance", "Workload", "Leave", "Examination"],
  HOD: ["Dashboard", "Department", "Faculty", "Subjects", "Approvals", "Attendance Reports", "Examination", "Timetable"],
  PARENT: ["Dashboard", "Student Profile", "Attendance", "Results", "Fees", "Leave", "Examination"],
  ADMIN: ["Dashboard", "Students", "Faculty", "Departments", "Courses", "Subjects", "Attendance", "Exams", "Results", "Fees", "Timetable", "Assignments", "Study Materials", "Notices", "Events", "Gallery", "Reports", "Settings", "HOD", "Academic Management", "Documents", "Exports", "Leave", "Examination", "Hall Ticket"],
  SUPER_ADMIN: ["Dashboard", "Institutes", "Admins", "Students", "Faculty", "Departments", "Courses", "Subjects", "Attendance", "Exams", "Results", "Fees", "Timetable", "Assignments", "Study Materials", "Notices", "Events", "Gallery", "Reports", "Settings", "Academics", "Documents", "Exports", "Examination"],
  ACCOUNTANT: ["Dashboard", "Students", "Fees", "Payments", "Reports"],
  EXAM_OFFICER: ["Dashboard", "Examinations", "Schedules", "Hall Tickets", "Results", "Reports"],
  LIBRARIAN: ["Dashboard", "Students", "Books", "Issue/Return", "Fines", "Reports"],
  HR_STAFF: ["Dashboard", "Staff", "Attendance", "Leave", "Payroll", "Reports"],
};
const icons = {
  Dashboard: "⌂", Institutes: "▦", Admins: "♙", Students: "♟", Faculty: "◈", HOD: "◇",
  Academics: "⌘", "Academic Management": "⌘", Departments: "▤", Department: "▤",
  Programs: "▤", Semesters: "◫", Divisions: "◫", Subjects: "◈", Timetable: "◷",
  Attendance: "✓", Documents: "▧", Reports: "▥", Exports: "⇩", Settings: "⚙",
  Leave: "◒", Examination: "◉", Examinations: "◉", "Hall Ticket": "▣", "Hall Tickets": "▣",
  Fees: "₹", Payments: "↔", Results: "★", Books: "▤", "Issue/Return": "↕",
  Fines: "₹", Courses: "▤", Exams: "◉", Assignments: "✎", "Study Materials": "▧", Notices: "◉", Events: "◷", Gallery: "▧", Staff: "♙", Payroll: "▰", Profile: "♙", "My Profile": "♙",
  "Student Profile": "♙", Workload: "▥", Approvals: "✓", "Attendance Reports": "▥",
  Schedules: "◷", "Change Password": "⚿",
};
const adminLinks = {
  Students: "/admin/students", Faculty: "/admin/faculty", HOD: "/admin/hod",
  Departments: "/admin/core?module=departments", Courses: "/admin/academics", Department: "/admin/core?module=departments",
  Programs: "/admin/core?module=programs", Academics: "/admin/academics",
  Semesters: "/admin/core?module=semesters", Divisions: "/admin/core?module=divisions",
  Subjects: "/admin/subjects", Exams: "/admin/examination", Notices: "/admin/notices", Events: "/admin/events", Gallery: "/admin/gallery", "Study Materials": "/admin/documents", Assignments: "/admin/documents", Approvals: "/leave", "Academic Management": "/admin/academics",
  Timetable: "/admin/timetable", Workload: "/admin/faculty", Attendance: "/admin/attendance",
  Documents: "/admin/documents", Exports: "/admin/exports",
  "Attendance Reports": "/admin/attendance/reports", Reports: "/admin/reports",
  Institutes: "/admin/institute", Settings: "/admin/settings", Leave: "/leave",
  Examination: "/admin/examination", "Hall Ticket": "/hall-ticket", Fees: "/admin/fees",
  Payments: "/admin/fees", Results: "/admin/results", Examinations: "/admin/examination",
  Schedules: "/admin/examination", "Hall Tickets": "/hall-ticket", Books: "/admin/library",
  "Issue/Return": "/admin/library", Fines: "/admin/library", Staff: "/admin/hr",
  Payroll: "/admin/hr", Admins: "/admin/users",
};
const roleLinks = {
  STUDENT: { "My Profile": "/portal?module=profile", Attendance: "/portal?module=attendance", Results: "/portal?module=results", Fees: "/portal?module=fees", Timetable: "/portal?module=timetable", Assignments: "/student/assignments", "Study Materials": "/student/study-materials", Notices: "/portal?module=notices", Events: "/events", "Change Password": "/change-password" },
  FACULTY: { "My Profile": "/portal?module=profile", Subjects: "/portal?module=subjects", Timetable: "/portal?module=timetable", Attendance: "/admin/attendance", Workload: "/admin/faculty", Leave: "/leave", Examination: "/portal?module=examination" },
  HOD: { Department: "/admin/core?module=departments", Faculty: "/admin/faculty", Subjects: "/admin/subjects", Approvals: "/leave", "Attendance Reports": "/admin/attendance/reports", Examination: "/admin/examination", Timetable: "/admin/timetable", Attendance: "/admin/attendance" },
  PARENT: { "Student Profile": "/portal?module=profile", Attendance: "/portal?module=attendance", Results: "/portal?module=results", Fees: "/portal?module=fees", Leave: "/leave", Examination: "/portal?module=examination" },
  ADMIN: adminLinks, SUPER_ADMIN: adminLinks,
  ACCOUNTANT: { Students: "/admin/students", Fees: "/admin/fees", Payments: "/admin/fees", Reports: "/admin/exports" },
  EXAM_OFFICER: { Examinations: "/admin/examination", Schedules: "/admin/examination", "Hall Tickets": "/hall-ticket", Results: "/admin/results", Reports: "/admin/exports" },
  LIBRARIAN: { Students: "/admin/students", Books: "/admin/library", "Issue/Return": "/admin/library", Fines: "/admin/library", Reports: "/admin/exports" },
  HR_STAFF: { Staff: "/admin/hr", Attendance: "/admin/attendance/reports", Leave: "/leave", Payroll: "/admin/hr", Reports: "/admin/exports" },
};
const portalLinks = {
  "My Profile": "/portal?module=profile", "Student Profile": "/portal?module=profile",
  Profile: "/portal?module=profile", Attendance: "/portal?module=attendance",
  Timetable: "/portal?module=timetable", Results: "/portal?module=results",
  Examination: "/portal?module=examination", "Hall Ticket": "/hall-ticket",
  Subjects: "/portal?module=subjects", Leave: "/leave", Fees: "/portal?module=fees",
};

export default function DashboardClient({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [standaloneApp, setStandaloneApp] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setStandaloneApp(Boolean(isStandalone));
  }, []);
  const role = user.role;
  const displayRole = roleNames[role] || role;
  const items = menus[role] || menus.STUDENT;
  const coreLinks = roleLinks[role] || {};
  const displayName = user.username || user.email || "User";
  const filtered = useMemo(() => items.filter(x => x.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const cards = data?.stats?.cards || [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    fetch("/api/dashboard", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const raw = await response.text();
        let parsed = {};
        try { parsed = raw ? JSON.parse(raw) : {}; }
        catch { throw new Error("Dashboard service returned an invalid response."); }
        if (!response.ok) throw new Error(parsed.error || "Unable to load dashboard.");
        return parsed;
      })
      .then(result => { if (active) setData(result); })
      .catch(err => { if (active && err.name !== "AbortError") setError(err.message || "Unable to load dashboard."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, []);

  async function logout() {
    try {
      setBusy(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setBusy(false);
      setError("Unable to sign out. Please try again.");
    }
  }

  function go(label) {
    setError("");
    if (label === "Dashboard") { router.push("/dashboard"); setMobileOpen(false); return; }
    const target = coreLinks[label] || portalLinks[label];
    if (target) { router.push(target); setMobileOpen(false); }
    else setError(`${label} is not configured for the ${displayRole} role yet.`);
  }

  return (
    <main className={`nobleDashboard role-${String(role).toLowerCase()} ${collapsed ? "navCollapsed" : ""} ${mobileOpen ? "mobileNavOpen" : ""}`}>
      <button className="nobleMobileShade" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
      <aside className="nobleSidebar">
        <div className="nobleSideTop">
          <div className="nobleBrandMark" aria-hidden="true">N</div>
          <div className="nobleBrandText"><b>NOBLE ERP</b><small>noble group of Institution</small></div>
          <button className="nobleCollapse" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? "→" : "←"}</button>
        </div>
        <div className="nobleRolePill"><i /><span>{displayRole} Portal</span><em>SECURE</em></div>
        <label className="nobleMenuSearch"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search menu..." aria-label="Search menu" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}</label>
        <nav className="nobleSideNav" aria-label="Role modules">
          {filtered.map((label, index) => {
            const selected = pathname === "/dashboard" && label === "Dashboard";
            return <button className={selected ? "selected" : ""} key={label} onClick={() => go(label)} title={collapsed ? label : undefined} aria-current={selected ? "page" : undefined}><span className="nobleNavIcon">{icons[label] || "•"}</span><span className="nobleNavLabel">{label}</span><span className="nobleNavArrow">›</span></button>;
          })}
          {!filtered.length && <p className="nobleNoMatch">No modules match “{query}”.</p>}
        </nav>
        <div className="nobleSideFoot">
          <div className="nobleUserMini"><span className="nobleUserAvatar">{displayName.slice(0, 1).toUpperCase()}</span><span className="nobleUserText"><b>{displayName}</b><small>{displayRole}</small></span></div>
          <button className="nobleLogout" onClick={logout} disabled={busy}><span>↪</span><span className="nobleNavLabel">{busy ? "Signing out…" : role === "STUDENT" ? "Logout" : "Sign out"}</span></button>
        </div>
      </aside>

      <section className="nobleMain">
        <header className="nobleTopbar">
          <div className="nobleTopLeft"><button className="nobleMobileToggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">☰</button><div className="nobleBreadcrumb">Workspace <span>/</span> <b>Dashboard</b></div></div>
          <div className="nobleTopRight"><span className="nobleAcademicTag">ACADEMIC WORKSPACE</span><span className="nobleTopAvatar">{displayName.slice(0, 1).toUpperCase()}</span></div>
        </header>

        <div className="nobleContent">
          <section className="nobleWelcome">
            <div className="nobleWelcomeCopy"><span className="nobleEyebrow">noble group of Institution <i>•</i> ERP</span><h1>{greeting}, <em>{displayName}</em></h1><p>Welcome back to your {displayRole.toLowerCase()} workspace. Here’s your institute at a glance.</p><div className="nobleWelcomeMeta"><span><i /> Secure session active</span><span>Role-based workspace</span></div></div>
            <div className="nobleWelcomeArt" aria-hidden="true"><div className="nobleArtRing ringOne" /><div className="nobleArtRing ringTwo" /><div className="nobleArtMonogram">N</div><span className="nobleArtDot dotOne" /><span className="nobleArtDot dotTwo" /><span className="nobleArtDot dotThree" /></div>
            <div className="nobleWelcomeActions"><button className="nobleRefresh" onClick={() => window.location.reload()} title="Refresh dashboard" aria-label="Refresh dashboard">↻</button><span className="nobleWelcomeAvatar">{displayName.slice(0, 1).toUpperCase()}</span></div>
          </section>

          {standaloneApp && role === "STUDENT" && <section className="nobleStudentAppHome" aria-label="Student app home">
            <header className="nobleStudentAppHeader">
              <div className="nobleStudentAppBrand"><span className="nobleStudentAppMenu">☰</span><div className="nobleStudentAppWordmark"><b>NOBLE</b><small>GROUP OF INSTITUTIONS</small></div></div>
              <button className="nobleStudentBell" onClick={() => router.push("/portal?module=notifications")} aria-label="Notifications">♧<i /></button>
            </header>
            <section className="nobleStudentIdentity">
              <span className="nobleStudentAvatar">{displayName.slice(0,1).toUpperCase()}</span>
              <div><b>{displayName}</b><small>Student Portal</small></div>
              <span className="nobleStudentStatus">Active</span>
            </section>
            <div className="nobleStudentTiles">
              {[
                ["Academic Calendar","▦","/portal?module=timetable","blue"],
                ["Time Table","◷","/portal?module=timetable","purple"],
                ["Attendance","✓","/portal?module=attendance","teal"],
                ["Transport","♧","/portal?module=transport","coral"],
                ["Exam Schedule","▤","/portal?module=examination","violet"],
                ["Results","▧","/portal?module=results","red"],
                ["Fees","₹","/portal?module=fees","orange"],
                ["Feedback","☏","/portal?module=feedback","slate"],
                ["Notifications","♧","/portal?module=notifications","sky"],
                ["Hostel Leave / Gate Pass","⌂","/leave","plum"],
                ["Grievance Registration","▤","/portal?module=grievance","pink"],
                ["Mess Pass","♧","/portal?module=mess","mint"],
              ].map(([label,icon,target,tone]) => <button key={label} className={`nobleStudentTile tone-${tone}`} onClick={() => router.push(target)}><span className="nobleStudentTileIcon">{icon}</span><b>{label}</b></button>)}
            </div>
            <footer className="nobleStudentAppVersion">NOBLE ERP • Student App</footer>
          </section>}
          {error && <div className="nobleError" role="alert"><span>{error}</span><button onClick={() => window.location.reload()}>Retry</button></div>}
          {loading && !data && <div className="nobleLoading"><span className="nobleSpinner" /> Loading your live ERP workspace…</div>}

          <section className="nobleStats" aria-label="Dashboard statistics">
            {(cards.length ? cards : [
              { label: "WORKSPACE", value: "Online", detail: "Secure ERP session active" },
              { label: "DATABASE", value: "Live", detail: "Connected dashboard session" },
              { label: "ACCESS", value: "Active", detail: `${displayRole} permissions` },
              { label: "SYSTEM STATUS", value: "Ready", detail: "Core workspace available" },
            ]).slice(0, role === "ADMIN" || role === "SUPER_ADMIN" ? 8 : role === "STUDENT" ? 6 : 4).map((card, index) => <article className="nobleStatCard" key={card.label || index}><div className={`nobleStatIcon statIcon${index + 1}`}>{["↗", "♙", "▦", "✓"][index]}</div><small>{card.label}</small><strong>{card.value}</strong><span>{card.detail}</span><i className="nobleStatOrb" /></article>)}
          </section>

          <section className="nobleCommand">
            <div className="nobleSectionHead"><div><span className="nobleEyebrow">ROLE COMMAND CENTRE</span><h2>{displayRole} workspace</h2><p>Your modules, records and daily actions — all in one place.</p></div><span className="nobleLiveBadge"><i /> Live dashboard</span></div>
            <div className="nobleModuleGrid">{items.slice(1).map(label => <button className="nobleModuleCard" key={label} onClick={() => go(label)}><span className="nobleModuleIcon">{icons[label] || "•"}</span><span className="nobleModuleText"><b>{label}</b><small>Open module</small></span><span className="nobleModuleArrow">↗</span></button>)}</div>
          </section>

          <section className="nobleBottomGrid">
            <article className="nobleInfoPanel"><div className="noblePanelHead"><div><span className="nobleEyebrow">GET THINGS DONE</span><h3>Quick actions</h3></div><span className="noblePanelCount">{data?.stats?.pendingActions ?? 0} pending</span></div><div className="nobleQuickList">{items.slice(1, 5).map(label => <button key={label} onClick={() => go(label)}><span className="nobleQuickIcon">{icons[label] || "•"}</span><b>{label}</b><span className="nobleQuickArrow">→</span></button>)}</div></article>
            <article className="nobleInfoPanel"><div className="noblePanelHead"><div><span className="nobleEyebrow">INSTITUTE BULLETIN</span><h3>Recent notices</h3></div><span className="noblePanelCount">Latest updates</span></div>{data?.notices?.length ? <div className="nobleNoticeList">{data.notices.slice(0, 5).map(notice => <div className="nobleNotice" key={notice.id}><span className="nobleNoticeDot">•</span><div><b>{notice.title}</b><p>{notice.content || "Published by administration"}{notice.category ? " · " + notice.category : ""}</p>{notice.publishedAt && <small>{new Date(notice.publishedAt).toLocaleDateString("en-IN")}</small>}{notice.attachmentUrl && <p><a href={notice.attachmentUrl} target="_blank" rel="noreferrer">View attachment ↗</a></p>}</div></div>)}</div> : <div className="nobleEmptyNotice"><span>✦</span><b>No published notices yet</b><p>New institute announcements will appear here when published.</p></div>}</article>
          </section>
          <section className="nobleBottomGrid" style={{ marginTop: 20 }}>
            <article className="nobleInfoPanel">
              <div className="noblePanelHead"><div><span className="nobleEyebrow">CAMPUS LIFE</span><h3>Upcoming events</h3></div><span className="noblePanelCount">Latest updates</span></div>
              {data?.events?.length ? <div className="nobleNoticeList">{data.events.slice(0, 5).map(event => <div className="nobleNotice" key={event.id}><span className="nobleNoticeDot">✦</span><div><b>{event.title}</b><p>{event.description || event.category || "College event"}{event.venue ? " · " + event.venue : ""}</p><small>{new Date(event.eventDate).toLocaleDateString("en-IN")}{event.eventTime ? " · " + event.eventTime : ""}</small>{event.imageUrl && <p><a href={event.imageUrl} target="_blank" rel="noreferrer">View event image ↗</a></p>}</div></div>)}</div> : <div className="nobleEmptyNotice"><span>✦</span><b>No upcoming events published</b><p>Published campus events will appear here.</p></div>}
              <a href="/events" style={{ display: "inline-block", marginTop: 12, color: "#2563eb", fontWeight: 700 }}>View public events ↗</a>
            </article>
          </section>
          <footer className="nobleDashboardFooter"><span>© {new Date().getFullYear()} noble group of Institution</span><span>University Management System <i>•</i> Secure role-based access</span></footer>
        </div>
      </section>
      {standaloneApp && role === "STUDENT" && <nav className="nobleStudentBottomNav" aria-label="Student app navigation">
        <button className={pathname === "/dashboard" ? "active" : ""} onClick={() => router.push("/dashboard")}><span>⌂</span><small>Home</small></button>
        <button onClick={() => router.push("/portal?module=timetable")}><span>▦</span><small>Academics</small></button>
        <button onClick={() => router.push("/portal?module=attendance")}><span>✓</span><small>Attendance</small></button>
        <button onClick={() => router.push("/portal?module=notifications")}><span>♧</span><small>Notices</small></button>
        <button onClick={() => router.push("/portal?module=profile")}><span>♙</span><small>Profile</small></button>
      </nav>}
    </main>
  );
}
