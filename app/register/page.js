"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const change = e => setForm(v => ({ ...v, [e.target.name]: e.target.value }));
  async function submit(e) {
    e.preventDefault(); setError(""); setSuccess("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, email: form.email, mobile: form.mobile, password: form.password }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Registration failed."); return; }
      setSuccess(data.memberCode);
    } catch { setError("Unable to connect. Please try again."); }
    finally { setLoading(false); }
  }
  return <main className="rcAuthPage"><div className="rcAuthCard rcRegisterCard"><Link href="/" className="rcAuthBrand"><span className="rcBrandMark"><img src="/dca-cricket-logo.webp" alt="DCA Cricket Club logo" /></span><span><b>DCA CRICKET CLUB</b><small>MEMBER REGISTRATION</small></span></Link>{success ? <><div className="rcEyebrow">ACCOUNT CREATED</div><h1>You're on the team.</h1><p className="rcAuthIntro">Your member ID is shown below. Keep it safe for future sign-ins.</p><div className="rcMemberCode">{success}</div><button className="rcPrimary rcAuthSubmit" onClick={()=>router.push("/login")}>Go to login →</button></> : <><div className="rcEyebrow">JOIN THE CLUB</div><h1>Create your account.</h1><p className="rcAuthIntro">Register as a DCA Cricket Club member. Your account will be ready to sign in.</p><form onSubmit={submit} className="rcAuthForm"><label>Full name<input name="name" value={form.name} onChange={change} placeholder="Your full name" autoComplete="name" minLength={2} required /></label><label>Email address<input name="email" type="email" value={form.email} onChange={change} placeholder="you@example.com" autoComplete="email" required /></label><label>Mobile number<input name="mobile" value={form.mobile} onChange={change} placeholder="Your WhatsApp/mobile number" autoComplete="tel" /></label><label>Password<input name="password" type="password" value={form.password} onChange={change} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required /></label><label>Confirm password<input name="confirm" type="password" value={form.confirm} onChange={change} placeholder="Enter password again" autoComplete="new-password" minLength={8} required /></label>{error&&<div className="rcFormError" role="alert">{error}</div>}<button className="rcPrimary rcAuthSubmit" disabled={loading}>{loading?"Creating account…":"Create member account →"}</button></form><div className="rcAuthFoot">Already registered? <Link href="/login">Sign in</Link></div></>}<Link href="/" className="rcBackHome">← Back to home</Link></div></main>;
}
