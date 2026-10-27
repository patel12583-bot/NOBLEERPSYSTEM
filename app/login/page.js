"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
    if (!standalone) return;
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

  return <main className="loginShell nobleBlueLogin">
    <section className="nobleBlueLoginCard">
      <div className="nobleBlueIllustration">
        <img src="/noble-student-login.svg" alt="Student using a laptop" />
        <div className="nobleBlueIllustrationCaption"><span>LEARN. GROW. ACHIEVE.</span><strong>Noble Group of Institutes</strong></div>
      </div>
      <div className="nobleBlueFormPanel">
        <div className="nobleBlueFormHeading"><h1>Sign In</h1><p>Unlock your world.</p></div>
        <form onSubmit={submit}>
          <label>Email / User ID<input value={id} onChange={e => setId(e.target.value)} placeholder="Enter your email or user ID" autoComplete="username" required /></label>
          <label>Password
            <span className="nobleBluePasswordField">
              <input type={showPassword ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
              <button className="nobleBluePasswordToggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? "Hide" : "Show"}</button>
            </span>
          </label>
          {error && <div className="error">{error}</div>}
          <button className="nobleBlueSignIn" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
        <button className="nobleBlueCreateAccount" type="button" onClick={() => router.push("/register")}>Create an account</button>
        <button className="nobleBlueBack" type="button" onClick={() => router.push("/")}>← Back to Noble ERP</button>
        <p className="nobleBlueCopyright">© 2026 Noble Group of Institutes</p>
      </div>
    </section>
  </main>;;
}

export default function Login() {
  return <Suspense fallback={<main className="loginShell"><div className="loginCard">Loading…</div></main>}><LoginForm /></Suspense>;
}
