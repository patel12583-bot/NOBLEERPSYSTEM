"use client";

import { useState } from "react";

export default function AdminBootstrapPage() {
  const [setupSecret, setSetupSecret] = useState("");
  const [username, setUsername] = useState("admin@2026");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/bootstrap-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupSecret, username, password })
      });
      const data = await response.json();
      setMessage(data.message || data.error || "Setup request failed.");
      if (data.ok) {
        setSetupSecret("");
        setPassword("");
      }
    } catch {
      setMessage("Could not reach the setup service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f0e7] px-5 py-12 text-[#30251d]">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#dfd2bf] bg-white/90 p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#98764d]">Noble Group of Institutes</p>
        <h1 className="mt-3 text-2xl font-semibold">Private Admin Setup</h1>
        <p className="mt-2 text-sm leading-6 text-[#74675a]">Create or reset the authorised Admin login. This page works only when the private setup code is configured in Vercel.</p>
        <label className="mt-6 block text-sm font-medium">Private setup code</label>
        <input required type="password" autoComplete="off" value={setupSecret} onChange={e => setSetupSecret(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8c9b5] bg-[#fcfaf6] px-4 py-3 outline-none focus:border-[#98764d]" />
        <label className="mt-4 block text-sm font-medium">Admin User ID</label>
        <input required value={username} onChange={e => setUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8c9b5] bg-[#fcfaf6] px-4 py-3 outline-none focus:border-[#98764d]" />
        <label className="mt-4 block text-sm font-medium">New password (minimum 8 characters)</label>
        <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8c9b5] bg-[#fcfaf6] px-4 py-3 outline-none focus:border-[#98764d]" />
        <button disabled={busy} className="mt-6 w-full rounded-xl bg-[#765637] px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Please wait..." : "Create / Reset Admin"}</button>
        {message && <p role="status" className="mt-4 rounded-xl bg-[#f5f0e7] p-3 text-sm leading-6">{message}</p>}
        <a href="/login" className="mt-5 block text-center text-sm text-[#765637] underline">Back to Admin Login</a>
      </form>
    </main>
  );
}
