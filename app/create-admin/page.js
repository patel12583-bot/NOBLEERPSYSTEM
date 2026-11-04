"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, setupCode: code, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to create the admin account.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="loginShell">
    <div className="loginCampusShade" aria-hidden="true" />
    <aside className="nrsAuthShowcase nrsSetupShowcase">
      <div className="nrsAuthLogo"><img src="/noble-institutes-logo.svg" alt="Noble Group of Institutes" /></div>
      <div className="nrsAuthGlass"><div className="nrsCap">🎓</div><div><strong>NRS</strong><b>Noble Admission System</b><span>Smart. Secure. Unified.</span></div></div>
      <div className="nrsAuthCaption">AUTHORISED ADMINISTRATOR SETUP</div>
    </aside>
    <div className="loginCard loginCampusCard">
      <div className="naLoginBrand"><img src="/noble-institutes-logo.svg" alt="Noble Group of Institutes" /><span><b>NOBLE GROUP OF INSTITUTES</b><small>ADMISSION & DOCUMENT MANAGEMENT</small></span></div>
      <div className="loginTitle">
        <div className="naLoginEyebrow">AUTHORISED ADMIN SETUP</div>
        <h1>Create admin account.</h1>
        <p>Register an authorised administrator for the Noble admission system.</p>
      </div>
      <form onSubmit={submit}>
        <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required maxLength={190} /></label>
        <label>Admin setup code<input value={code} onChange={event => setCode(event.target.value)} placeholder="Enter the private setup code" autoComplete="off" required /></label>
        <label>Password<span className="noblePasswordField"><input type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 10 characters" autoComplete="new-password" required minLength={10} /><button className="noblePasswordToggle" type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? "Hide" : "Show"}</button></span></label>
        <label>Confirm password<input type="password" value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="Re-enter your password" autoComplete="new-password" required minLength={10} /></label>
        {error && <div className="error" role="alert">{error}</div>}
        <button className="primary full" disabled={loading}>{loading ? "Creating account…" : "Create Admin Account"}</button>
      </form>
      <div className="authLinks"><button className="back" type="button" onClick={() => router.push("/login")}>← Back to Login</button></div>
      <p className="loginCopyright">Admin registration is protected by a private setup code.</p>
    </div>
  </main>;
}
