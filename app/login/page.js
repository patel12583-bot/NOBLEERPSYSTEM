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
        router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="loginShell">
    <div className="loginCampusShade" aria-hidden="true" />
    <aside className="nrsAuthShowcase">
      <div className="nrsAuthLogo"><img src="/noble-institutes-logo.svg" alt="Noble Group of Institutes" /></div>
      <div className="nrsAuthGlass"><div className="nrsCap">🎓</div><div><strong>NRS</strong><b>Noble Admission System</b><span>Smart. Secure. Unified.</span></div></div>
      <div className="nrsAuthCaption">ADMISSIONS • DOCUMENTS • INSTITUTE</div>
    </aside>
    <div className="loginCard loginCampusCard">
      <div className="naLoginBrand"><img src="/noble-institutes-logo.svg" alt="Noble Group of Institutes" /><span><b>NOBLE GROUP OF INSTITUTES</b><small>ADMISSION & DOCUMENT MANAGEMENT</small></span></div><div className="loginTitle"><div className="naLoginEyebrow">SECURE ADMINISTRATOR ACCESS</div><h1>Welcome back.</h1><p>Sign in to manage admissions and student documents.</p></div>
      <form onSubmit={submit}>
        
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
      <div className="authLinks"><button className="back" onClick={() => router.push("/")}>← Back to Noble website</button></div>
      <p className="loginCopyright">© 2026 Noble Group of Institutes. All rights reserved.</p>
    </div>
  </main>;
}

export default function Login() {
  return <Suspense fallback={<main className="loginShell"><div className="loginCard">Loading…</div></main>}><LoginForm /></Suspense>;
}
