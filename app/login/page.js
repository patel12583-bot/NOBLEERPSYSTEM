"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Unable to sign in."); return; }
      router.replace("/dashboard"); router.refresh();
    } catch { setError("Unable to connect. Please check your internet and try again."); }
    finally { setLoading(false); }
  }
  return <main className="rcAuthPage"><div className="rcAuthCard"><Link href="/" className="rcAuthBrand"><span className="rcBrandMark"><img src="/dca-cricket-logo.webp" alt="DCA Cricket Club logo" /></span><span><b>DCA CRICKET CLUB</b><small>ONE TEAM. ONE CONNECTED HOME.</small></span></Link><div className="rcEyebrow">MEMBER & ADMIN ACCESS</div><h1>Welcome back.</h1><p className="rcAuthIntro">Sign in to your club workspace and stay connected with your team.</p><form onSubmit={submit} className="rcAuthForm"><label>Email or Member ID<input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Enter your email or member ID" autoComplete="username" required /></label><label>Password<span className="rcPasswordWrap"><input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required/><button type="button" onClick={()=>setShow(!show)}>{show?"Hide":"Show"}</button></span></label>{error&&<div className="rcFormError" role="alert">{error}</div>}<button className="rcPrimary rcAuthSubmit" disabled={loading}>{loading?"Signing in…":"Sign in to club →"}</button></form><div className="rcAuthFoot">New to DCA Cricket Club? <Link href="/register">Create member account</Link></div><Link href="/" className="rcBackHome">← Back to home</Link></div></main>;
}
