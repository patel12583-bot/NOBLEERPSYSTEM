"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState(params.get("role") || "Student");
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
    if (!standalone) return;
    setRole("Student");
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" }).then((res) => {
      if (active && res.ok) { router.replace("/dashboard"); router.refresh(); }
    }).catch(() => {});
    return () => { active = false; };
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!id || !pass) {
      setError("Enter your ID/email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        return;
      }
      const actualRole = data.user.role;
      const roleMap = {
        SUPER_ADMIN: "Super Admin", ADMIN: "Admin", HOD: "HOD", FACULTY: "Faculty",
        STUDENT: "Student", PARENT: "Parent", ACCOUNTANT: "Accountant",
        EXAM_OFFICER: "Examination Officer", LIBRARIAN: "Librarian", HR_STAFF: "HR/Staff"
      };
      router.push("/dashboard?role=" + encodeURIComponent(roleMap[actualRole] || actualRole));
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="loginShell">
    <div className="loginCampusShade" aria-hidden="true" />
    <header className="loginCampusHeader nobleAuthLogoHeader">
      <img className="nobleAuthLogo" src="/noble-institutes-logo.svg" alt="Noble Group of Institutes" />
    </header>
    <aside className="loginCampusFeatures">
      <div><i>♟</i><span><b>Student Management</b><small>Track · Manage · Grow</small></span></div>
      <div><i>♟</i><span><b>Faculty &amp; Staff</b><small>Support · Develop · Empower</small></span></div>
      <div><i>▤</i><span><b>Examination &amp; Results</b><small>Evaluate · Analyze · Excel</small></span></div>
      <div><i>▣</i><span><b>Library &amp; Resources</b><small>Access · Learn · Achieve</small></span></div>
    </aside>
    <div className="loginCard loginCampusCard">
      <div className="loginTitle"><div className="eyebrow">SECURE COLLEGE PORTAL</div><h1>Noble ERP System</h1><p>College Management System</p></div>
      <form onSubmit={submit}>
        <label>Portal role<select value={role} onChange={e => setRole(e.target.value)}>
          {["Student","Faculty","HOD","Parent","Admin","Super Admin","Accountant","Examination Officer","Librarian","HR/Staff"].map(x => <option key={x}>{x}</option>)}
        </select></label>
        <label>User ID / Email<input value={id} onChange={e => setId(e.target.value)} placeholder="Enter your ID or email" autoComplete="username" /></label>
        <label>Password<input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter password" autoComplete="current-password" /></label>
        {error && <div className="error">{error}</div>}
        <button className="primary full" disabled={loading}>{loading ? "Signing in…" : <>↪ &nbsp; Login</>}</button>
      </form>
      <div className="authLinks"><button className="back" onClick={() => router.push("/register")}>Create Account / Sign Up</button><button className="back" onClick={() => router.push("/")}>← Back to Noble ERP</button></div>
      <p className="loginCopyright">© 2026 noble group of Institution. All rights reserved.</p>
    </div>
  </main>;
}

export default function Login() {
  return <Suspense fallback={<main className="loginShell"><div className="loginCard">Loading…</div></main>}><LoginForm /></Suspense>;
}
