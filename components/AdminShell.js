"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const items = [
  ["Dashboard", "/dashboard", "⌂", "Overview"],
  ["Institute", "/admin/institute", "▤", "Administration"],
  ["Students", "/admin/students", "♟", "People"],
  ["Faculty", "/admin/faculty", "♣", "People"],
  ["Academics", "/admin/academics", "▦", "Academics"],
  ["Attendance", "/admin/attendance", "▣", "Academics"],
  ["Attendance Reports", "/admin/attendance/reports", "▥", "Academics"],
  ["Examination", "/admin/examination", "✎", "Academics"],
  ["Fees & Finance", "/admin/fees", "₹", "Finance"],
  ["Results", "/admin/results", "✓", "Academics"],
  ["Library", "/admin/library", "▥", "Campus"],
  ["Documents", "/admin/documents", "▧", "Campus"],
  ["HR & Payroll", "/admin/hr", "♙", "Administration"],
  ["Users & Roles", "/admin/users", "♧", "Administration"],
  ["Exports & Reports", "/admin/exports", "⇩", "Reports"],
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
          <div className="erpLogo">N</div>
          <div className="erpBrandText"><b>NOBLE ERP</b><small>noble group of Institution</small></div>
          <button className="erpCollapse" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? "»" : "«"}</button>
        </div>
        <div className="erpSidebarLabel">WORKSPACE</div>
        <label className="erpSearch"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a module..." aria-label="Find a module" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}</label>
        <nav className="erpNav" aria-label="ERP modules">
          {Object.entries(groups).map(([group, links]) => (
            <div className="erpNavGroup" key={group}>
              {!collapsed && <div className="erpNavHeading">{group}</div>}
              {links.map(([label, path, icon]) => {
                const selected = pathname === path || (path !== "/dashboard" && pathname.startsWith(path + "/")) || (label === active && pathname === path);
                return <button key={path} className={`erpNavItem ${selected ? "active" : ""}`} onClick={() => navigate(path)} title={collapsed ? label : undefined} aria-current={selected ? "page" : undefined}><span className="erpNavIcon">{icon}</span><span className="erpNavLabel">{label}</span>{selected && <span className="erpNavActive" />}</button>;
              })}
            </div>
          ))}
          {Object.keys(groups).length === 0 && <p className="erpNoResults">No modules match “{query}”.</p>}
        </nav>
        <div className="erpSideFoot"><span className="onlineDot" /><span className="erpFootText">Workspace ready</span><small className="erpFootVersion">NOBLE ERP</small></div>
      </aside>
      <section className="erpMain">
        <header className="erpTopbar">
          <div className="erpTopLeft">
            <button className="erpMenuToggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation">☰</button>
            <div className="erpBreadcrumb"><span>Workspace</span><b> / </b><strong>{pageTitle}</strong></div>
          </div>
          <div className="erpTopRight"><span className="erpAcademicYear">ACADEMIC WORKSPACE</span><div className="erpTopAvatar" aria-hidden="true">N</div></div>
        </header>
        <main className="erpPage">{children}</main>
        <footer className="erpFooter"><span>noble group of Institution</span><span>University Management System</span></footer>
      </section>
    </div>
  );
}
