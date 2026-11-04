"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const items = [
  ["Dashboard", "/admin/admissions", "⌂", "Workspace"],
  ["New Admission", "/admin/students", "+", "Admissions"],
  ["All Admissions", "/admin/students", "♟", "Admissions"],
  ["Course & Academic Setup", "/admin/academics", "▦", "Configuration"],
  ["Student Documents", "/admin/documents", "▧", "Documents"],
  ["Document Requirements", "/admin/documents", "☷", "Documents"],
  ["Reports & Exports", "/admin/reports", "▥", "Reports"],
  ["Institute Settings", "/admin/settings", "⚙", "Configuration"]
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
      (acc[item[3]] ||= []).push(item);
      return acc;
    }, {});
  }, [query]);
  const pageTitle = items.find(([, path]) => pathname === path || (path !== "/admin/admissions" && pathname.startsWith(path + "/")))?.[0] || active;
  const navigate = (path) => { setMobileOpen(false); router.push(path); };

  return (
    <div className={`erpShell ${collapsed ? "erpCollapsed" : ""} ${mobileOpen ? "erpMobileOpen" : ""}`}>
      <button className="erpMobileShade" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      <aside className="erpSidebar">
        <div className="erpBrand">
          <div className="erpBrandText"><b>NOBLE ADMISSION</b><small>ADMISSION & DOCUMENTS</small></div>
          <button className="erpCollapse" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? "»" : "«"}</button>
        </div>
        <div className="erpSidebarLabel">ADMIN WORKSPACE</div>
        <label className="erpSearch"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find an option..." aria-label="Find an option" />{query && <button type="button" onClick={() => setQuery("")}>×</button>}</label>
        <nav className="erpNav" aria-label="Admission management">
          {Object.entries(groups).map(([group, links]) => (
            <div className="erpNavGroup" key={group}>
              {!collapsed && <div className="erpNavHeading">{group}</div>}
              {links.map(([label, path, icon]) => {
                const selected = pathname === path || (path !== "/admin/admissions" && pathname.startsWith(path + "/"));
                return <button key={label} className={`erpNavItem ${selected ? "active" : ""}`} onClick={() => navigate(path)} title={collapsed ? label : undefined} aria-current={selected ? "page" : undefined}><span className="erpNavIcon">{icon}</span><span className="erpNavLabel">{label}</span>{selected && <span className="erpNavActive" />}</button>;
              })}
            </div>
          ))}
          {Object.keys(groups).length === 0 && <p className="erpNoResults">No options match “{query}”.</p>}
        </nav>
        <div className="erpSideFoot"><span className="onlineDot" /><span className="erpFootText">Admin workspace</span><small className="erpFootVersion">NOBLE ADMISSION</small></div>
      </aside>
      <section className="erpMain">
        <header className="erpTopbar">
          <div className="erpTopLeft"><button className="erpMenuToggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation">☰</button><div className="erpBreadcrumb"><span>Admin</span><b> / </b><strong>{pageTitle}</strong></div></div>
          <div className="erpTopRight"><span className="erpAcademicYear">ADMISSION WORKSPACE</span><div className="erpTopAvatar" aria-hidden="true">N</div></div>
        </header>
        <main className="erpPage">{children}</main>
        <footer className="erpFooter"><span>Noble Group of Institutes</span><span>Admission & Document Management</span></footer>
      </section>
    </div>
  );
}
