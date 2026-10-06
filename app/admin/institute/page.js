"use client";

import ModuleHeader from "@/components/ModuleHeader";


import { useEffect, useState } from "react";

const initial = {
  name: "Noble Group of Institutes",
  address: "DABHOI KARIAN ROAD, MOTAHABIPURA, DABHOI, DIST. VADODARA, GUJARAT",
  phone1: "92654 63335",
  phone2: "92654 15454",
  email: "",
  logoUrl: ""
};

export default function InstituteSetup() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/institute").then(async r => {
      if (r.status === 401) { window.location.href = "/login"; return; }
      const data = await r.json();
      if (data.institute) setForm({...initial, ...data.institute});
      setLoading(false);
    }).catch(() => { setError("Unable to load institute details."); setLoading(false); });
  }, []);

  function change(key, value) {
    setForm(prev => ({...prev, [key]: value}));
    setMessage("");
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMessage(""); setError("");
    try {
      const r = await fetch("/api/institute", {
        method: "PUT",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(form)
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Save failed."); return; }
      setForm({...initial, ...data.institute});
      setMessage("Institute details saved successfully.");
    } catch {
      setError("Unable to save institute details.");
    } finally { setSaving(false); }
  }

  if (loading) return <main className="content" style={{padding:"40px"}}>Loading institute setup…</main>;

  return <main className="content" style={{padding:"40px",maxWidth:"1000px"}}>
    <div className="eyebrow">SUPER ADMIN • SETTINGS</div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:"12px"}}><button type="button" className="back" onClick={()=>{if(window.history.length>1)window.history.back();else window.location.href="/dashboard"}}>← Back to Dashboard</button></div>
    <ModuleHeader eyebrow="SUPER ADMIN • INSTITUTE" title="Institute Setup" description="Manage the official Noble Group of Institutes information used across the ERP." />
    <p>Manage the official Noble Group of Institutes information used across the ERP.</p>
    <form onSubmit={save} style={{marginTop:"28px",display:"grid",gap:"18px"}}>
      <label>Institute Name<input value={form.name} onChange={e=>change("name",e.target.value)} /></label>
      <label>Address<textarea rows="3" value={form.address} onChange={e=>change("address",e.target.value)} /></label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"18px"}}>
        <label>Phone 1<input value={form.phone1} onChange={e=>change("phone1",e.target.value)} /></label>
        <label>Phone 2<input value={form.phone2} onChange={e=>change("phone2",e.target.value)} /></label>
      </div>
      <label>Email<input type="email" value={form.email} onChange={e=>change("email",e.target.value)} placeholder="Official institute email" /></label>
      <label>Logo URL<input value={form.logoUrl} onChange={e=>change("logoUrl",e.target.value)} placeholder="Logo will be uploaded here later" /></label>
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
      <button className="primary" disabled={saving}>{saving ? "Saving…" : "Save Institute Details →"}</button>
    </form>
  </main>;
}
