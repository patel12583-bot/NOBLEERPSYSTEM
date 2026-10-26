"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState(params.get("role") || "Student");
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  return <main className="loginShell nobleAuthShell nobleEducationAuth">
    <section className="nobleAuthWelcome" aria-label="Noble education portal">
      <img className="nobleAuthBrand" src="/noble-institutes-logo.svg" alt="Noble Group of Institutes" />
      <div className="nobleAuthWelcomeCopy"><span className="nobleAuthEyebrow">LEARN · GROW · ACHIEVE</span><h2>Welcome Back to Noble! <span>✦</span></h2><p>Your learning journey continues here. Sign in to access your academic world.</p></div>
      <div className="nobleEducationIllustration" aria-hidden="true">
        <div className="nobleEduWindow"><i></i><i></i><i></i><i></i><b>✦</b></div>
        <div className="nobleEduBooks"><span></span><span></span><span></span><span></span></div>
        <div className="nobleEduDesk"></div>
        <div className="nobleEduPlant"><i></i><i></i><i></i><b></b></div>
        <div className="nobleEduCap"><span>✦</span></div>
        <div className="nobleEduBook"><b>N</b><span>NOBLE</span></div>
      </div>
      <div className="nobleAuthBenefits"><span>✦ Student Portal</span><span>✦ Academics &amp; Results</span><span>✦ Campus Resources</span></div>
    </section>
    <div className="loginCard nobleAuthCard">
      <div className="nobleAuthMusicReplacement" aria-hidden="true"><svg viewBox="0 0 64 64" role="img"><path d="M10 25 32 8 54 25V51H10Z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"/><path d="M23 51V34H41V51M17 28H47" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/><path d="M32 4 35 11 43 12 37 17 39 25 32 21 25 25 27 17 21 12 29 11Z" fill="#ffe9a7" stroke="currentColor" strokeWidth="1.5"/></svg></div>
      <div className="loginTitle"><div className="eyebrow">NOBLE GROUP OF INSTITUTES</div><h1>Welcome Back!</h1><p>Please login to continue</p></div>
      <form onSubmit={submit}>
        <label>Portal role<select value={role} onChange={e => setRole(e.target.value)}>
          {["Student","Faculty","HOD","Parent","Admin","Super Admin","Accountant","Examination Officer","Librarian","HR/Staff"].map(x => <option key={x}>{x}</option>)}
        </select></label>
        <label>User ID / Email<input value={id} onChange={e => setId(e.target.value)} placeholder="Enter your ID or email" autoComplete="username" required /></label>
        <label>Password
          <span className="noblePasswordField">
            <input type={showPassword ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter password" autoComplete="current-password" required />
            <button className="noblePasswordToggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? "Hide" : "Show"}</button>
          </span>
        </label>
        {error && <div className="error">{error}</div>}
        <button className="primary full" disabled={loading}>{loading ? "Signing in…" : <>↪ &nbsp; Login</>}</button>
      </form>
      <div className="authLinks"><button className="back" onClick={() => router.push("/register")}>Don’t have an account? <b>Sign Up</b></button><button className="back" onClick={() => router.push("/")}>← Back to Noble ERP</button></div>
      <p className="loginCopyright">© 2026 Noble Group of Institutes. All rights reserved.</p>
    </div>
  </main>;
}

export default function Login() {
  return <Suspense fallback={<main className="loginShell"><div className="loginCard">Loading…</div></main>}><LoginForm /></Suspense>;
}
