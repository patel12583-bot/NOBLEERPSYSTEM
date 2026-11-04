"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      if (!["ADMIN", "SUPER_ADMIN"].includes(data.user?.role)) {
        throw new Error("This system is restricted to authorised administrators.");
      }
      router.replace("/admin/admissions");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginShell">
      <div className="loginCard">
        <div className="loginBrand">
          <img src="/noble-logo.png" alt="Noble Group of Institutes" style={{ width: 64, height: 64, objectFit: "contain" }} />
          <div><b>NOBLE</b><small>GROUP OF INSTITUTES</small></div>
        </div>
        <div className="loginTitle">
          <div className="eyebrow">ADMINISTRATOR ACCESS</div>
          <h1>Noble Admission</h1>
          <p>Admission and document management workspace</p>
        </div>
        <form onSubmit={submit}>
          <label>Admin username or email
            <input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Enter admin username or email" autoComplete="username" required />
          </label>
          <label>Password
            <span className="noblePasswordField">
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" required />
              <button className="noblePasswordToggle" type="button" onClick={() => setShowPassword(value => !value)}>{showPassword ? "Hide" : "Show"}</button>
            </span>
          </label>
          {error && <div className="error" role="alert">{error}</div>}
          <button className="primary full" disabled={loading}>{loading ? "Signing in…" : "Sign in as Admin →"}</button>
        </form>
        <p className="loginCopyright">Secure access for Noble Group of Institutes administrators.</p>
      </div>
    </main>
  );
}
