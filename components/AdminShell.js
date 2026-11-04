"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const items = [
  ["Dashboard", "/dashboard", "⌂", "Overview"],
  ["Institute Profile", "/admin/institute", "▤", "Administration"],
  ["Admissions", "/admin/students", "♟", "Admissions"],
  ["Faculty", "/admin/faculty", "♣", "Administration"],
  ["Courses & Academics", "/admin/academics", "▦", "Setup"],
  ["Attendance", "/admin/attendance", "▣", "Legacy Records"],
  ["Examination", "/admin/examination", "✎", "Legacy Records"],
  ["Fees & Finance", "/admin/fees", "₹", "Legacy Records"],
  ["Results", "/admin/results", "✓", "Legacy Records"],
  ["Documents", "/admin/documents", "▧", "Documents"],
  ["HR & Payroll", "/admin/hr", "♙", "Legacy Records"],
  ["Users & Roles", "/admin/users", "♧", "Administration"],
  ["Reports", "/admin/reports", "▥", "Reports"],
  ["Settings", "/admin/settings", "⚙", "Administration"],
];

export default function AdminShell({ children, active = "Dashboard" }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = items.filter(([label]) => !q || label.toLowerCase().includes(q));
    return visible.reduce((acc, item) => {
      const group = item[3];
      (acc[group] ||= []).push(item);
      return acc;
    }, {});
  }, [query]);
  const pageTitle = items.find(([, path]) => pathname === path || (path !== "/dashboard" && pathname.startsWith(path + "/")))?.[0] || active;
  const navigate = (path) => {
    setMobileOpen(false);
    router.push(path);
  };

  return (
    <div className={`erpShell ${collapsed ? "erpCollapsed" : ""} ${mobileOpen ? "erpMobileOpen" : ""}`}>
      <button className="erpMobileShade" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      <aside className="erpSidebar">
        <div className="erpBrand">
          <img className="erpBrandLogo" src="/noble-institutes-logo.svg" alt="Noble Group of Institutes logo" />
          <div className="erpBrandText"><b>NOBLE ADMISSION</b><small>Group of Institutes</small></div>
          <button className="erpCollapse" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? "»" : "«"}</button>
        </div>
        <div className="erpSidebarLabel">ADMISSION WORKSPACE</div>
        <label className="erpSearch"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a section..." aria-label="Find a section" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}</label>
        <nav className="erpNav" aria-label="Admission management sections">
          {Object.entries(groups).map(([group, links]) => (
            <div className="erpNavGroup" key={group}>
              {!collapsed && <div className="erpNavHeading">{group}</div>}
              {links.map(([label, path, icon]) => {
                const selected = pathname === path || (path !== "/dashboard" && pathname.startsWith(path + "/")) || (label === active && pathname === path);
                return <button key={path} className={`erpNavItem ${selected ? "active" : ""}`} onClick={() => navigate(path)} title={collapsed ? label : undefined} aria-current={selected ? "page" : undefined}><span className="erpNavIcon">{icon}</span><span className="erpNavLabel">{label}</span>{selected && <span className="erpNavActive" />}</button>;
              })}
            </div>
          ))}
          {Object.keys(groups).length === 0 && <p className="erpNoResults">No sections match “{query}”.</p>}
        </nav>
        <div className="erpSideFoot"><span className="onlineDot" /><span className="erpFootText">Admission workspace</span><small className="erpFootVersion">NOBLE</small></div>
      </aside>
      <section className="erpMain">
        <header className="erpTopbar">
          <div className="erpTopLeft">
            <button className="erpMenuToggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation">☰</button>
            <div className="erpBreadcrumb"><span>Noble Admission</span><b> / </b><strong>{pageTitle}</strong></div>
          </div>
          <div className="erpTopRight"><span className="erpAcademicYear">ADMISSION WORKSPACE</span><div className="erpTopAvatar" aria-hidden="true">N</div></div>
        </header>
        <main className="erpPage">{children}</main>
        <footer className="erpFooter"><span>Noble Group of Institutes</span><span>Admission &amp; Document Management</span></footer>
      </section>
    </div>
  );
}
