"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [required, setRequired] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/setup").then(r => r.json()).then(data => {
      setRequired(data.setupRequired);
      if (!data.setupRequired) router.replace("/login");
    }).catch(() => setError("Unable to check setup status."));
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Setup failed.");
      router.push("/login?role=Super%20Admin");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  if (required === null) return <main className="loginShell"><div className="loginCard">Checking first-time setup…</div></main>;

  return <main className="loginShell"><div className="loginCard">
    <div className="loginBrand"><span className="brandMark">N</span><div><b>NOBLE</b><small>GROUP OF INSTITUTES</small></div></div>
    <div className="loginTitle"><div className="eyebrow">FIRST-TIME SETUP</div><h1>Create Super Admin.</h1><p>This screen is available only while the ERP has no users.</p></div>
    <form onSubmit={submit}>
      <label>Super Admin username<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="e.g. superadmin" autoComplete="username" /></label>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="email" /></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" /></label>
      <label>Confirm password<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" /></label>
      {error && <div className="error">{error}</div>}
      <button className="primary full" disabled={loading}>{loading ? "Creating…" : <>Create Super Admin <span>→</span></>}</button>
    </form>
  </div></main>;
}
