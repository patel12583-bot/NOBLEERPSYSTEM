"use client";

import Link from "next/link";

const roles = [
  { name: "Student", icon: "🎓", desc: "Student Portal" },
  { name: "Faculty", icon: "👨‍🏫", desc: "Faculty Portal" },
  { name: "HOD", icon: "🏛️", desc: "Department Portal" },
  { name: "Parent", icon: "👨‍👩‍👧", desc: "Parent Portal" },
  { name: "Admin", icon: "⚙️", desc: "Administration" },
  { name: "Super Admin", icon: "🛡️", desc: "Full System Access" },
  { name: "Accountant", icon: "💳", desc: "Fees & Finance" },
  { name: "Examination Officer", icon: "📝", desc: "Examination Portal" },
  { name: "Librarian", icon: "📚", desc: "Library Portal" },
  { name: "HR/Staff", icon: "👥", desc: "HR & Staff Portal" }
];

export default function Home() {
  return (
    <main className="shell homepageImageOnly">
      <nav className="nav">
        <div className="brand"><span className="brandMark">N</span><div><b>NOBLE</b><small>GROUP OF INSTITUTES</small></div></div>
      </nav>
      <section className="hero heroImageOnly" aria-label="Noble campus background" />
      <section className="homepagePortalPanel" aria-label="Choose your login portal">
        <div className="homepagePortalHeading">
          <span>YOUR PORTAL</span>
          <strong>Choose your login</strong>
        </div>
        <div className="homepagePortalGrid">
          {roles.map((role) => (
            <Link className="homepagePortalCard" href={"/login?role=" + encodeURIComponent(role.name)} key={role.name}>
              <span className="homepagePortalIcon" aria-hidden="true">{role.icon}</span>
              <span className="homepagePortalText"><strong>{role.name}</strong><small>{role.desc}</small></span>
              <span className="homepagePortalArrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
