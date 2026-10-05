"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState(params.get("role") || "Student");
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return <main className="loginShell"><div className="loginCard">
    <div className="loginBrand"><span className="brandMark">N</span><div><b>NOBLE</b><small>GROUP OF INSTITUTES</small></div></div>
    <div className="loginTitle"><div className="eyebrow">SECURE PORTAL</div><h1>Welcome back.</h1><p>Sign in to your Noble ERP workspace.</p></div>
    <form onSubmit={submit}>
      <label>Portal role<select value={role} onChange={e => setRole(e.target.value)}>
        {["Student","Faculty","HOD","Parent","Admin","Super Admin"].map(x => <option key={x}>{x}</option>)}
      </select></label>
      <label>User ID / Email<input value={id} onChange={e => setId(e.target.value)} placeholder="Enter your ID or email" autoComplete="username" /></label>
      <label>Password<input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter password" autoComplete="current-password" /></label>
      {error && <div className="error">{error}</div>}
      <button className="primary full" disabled={loading}>{loading ? "Signing in…" : <>Sign in <span>→</span></>}</button>
    </form>
    <button className="back" onClick={() => router.push("/")}>← Back to Noble ERP</button>
  </div></main>;
}

export default function Login() {
  return <Suspense fallback={<main className="loginShell"><div className="loginCard">Loading…</div></main>}><LoginForm /></Suspense>;
}
