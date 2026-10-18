"use client";

import { useCallback, useEffect, useState } from "react";

const emptyForm = { id: "", title: "", description: "", category: "GENERAL", audience: "ALL", publishDate: "", expiryDate: "", attachmentUrl: "", status: "DRAFT" };
const categories = ["GENERAL", "ACADEMIC", "EXAM", "ADMISSION", "FEES", "EVENT", "HOLIDAY", "URGENT"];

function dateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notices", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load notices.");
      setNotices(Array.isArray(data.notices) ? data.notices : []);
      setError("");
    } catch (e) { setError(e.message || "Could not load notices."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function chooseAttachment(file) {
    if (!file) return;
    if (file.size > 900 * 1024) {
      setError("Please choose an attachment smaller than 900 KB. You can also paste an existing HTTPS file link.");
      return;
    }
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"];
    if (!allowed.includes(file.type)) {
      setError("Supported attachments: PDF, PNG, JPG, WEBP or TXT.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setField("attachmentUrl", String(reader.result || "")); setError(""); };
    reader.onerror = () => setError("Could not read the selected attachment.");
    reader.readAsDataURL(file);
  }

  function editNotice(n) {
    setForm({
      id: n.id, title: n.title || "", description: n.content || n.description || "",
      category: n.category || "GENERAL", audience: n.audience || "ALL",
      publishDate: dateInput(n.publishDate || n.scheduledAt || n.publishedAt || n.createdAt),
      expiryDate: dateInput(n.expiryDate), attachmentUrl: n.attachmentUrl || "",
      status: n.status || (n.published ? "PUBLISHED" : "DRAFT")
    });
    setMessage(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const payload = {
        ...form,
        publishDate: form.publishDate || new Date().toISOString(),
        expiryDate: form.expiryDate || null
      };
      const res = await fetch("/api/admin/notices", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save notice.");
      setMessage(form.id ? "Notice updated successfully." : "Notice created successfully.");
      setForm(emptyForm);
      await load();
    } catch (e) { setError(e.message || "Could not save notice."); }
    finally { setSaving(false); }
  }

  async function removeNotice(n) {
    if (!window.confirm('Delete notice "' + n.title + '"? This cannot be undone.')) return;
    setError(""); setMessage("");
    try {
      const res = await fetch("/api/admin/notices?id=" + encodeURIComponent(n.id), { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete notice.");
      setMessage("Notice deleted.");
      if (form.id === n.id) setForm(emptyForm);
      await load();
    } catch (e) { setError(e.message || "Could not delete notice."); }
  }

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 18px 48px", color: "#172554" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 22 }}>
        <div><p style={{ margin: 0, color: "#2563eb", fontWeight: 800, letterSpacing: 2, fontSize: 12 }}>NOBLE ERP · COMMUNICATIONS</p><h1 style={{ margin: "8px 0", fontSize: 30 }}>Notice Management</h1><p style={{ margin: 0, color: "#64748b" }}>Create, schedule, publish and manage institute announcements.</p></div>
        <button type="button" onClick={() => { setForm(emptyForm); setError(""); setMessage(""); }} style={buttonStyle("#0f172a")}>＋ New notice</button>
      </div>

      {message && <p role="status" style={noticeStyle("#ecfdf5", "#047857")}>{message}</p>}
      {error && <p role="alert" style={noticeStyle("#fff1f2", "#be123c")}>{error}</p>}

      <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #dbeafe", borderRadius: 18, padding: 22, boxShadow: "0 10px 30px rgba(15,23,42,.06)", marginBottom: 26 }}>
        <h2 style={{ margin: "0 0 18px", fontSize: 20 }}>{form.id ? "Edit notice" : "Create notice"}</h2>
        <div style={gridStyle}>
          <label style={labelStyle}>Notice title *<input required maxLength={180} value={form.title} onChange={e => setField("title", e.target.value)} style={inputStyle} placeholder="e.g. Semester examination timetable" /></label>
          <label style={labelStyle}>Category<select value={form.category} onChange={e => setField("category", e.target.value)} style={inputStyle}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
          <label style={labelStyle}>Audience<select value={form.audience} onChange={e => setField("audience", e.target.value)} style={inputStyle}><option value="ALL">Everyone (public + portals)</option><option value="PUBLIC">Public website</option><option value="STUDENT">Students</option><option value="FACULTY">Faculty</option><option value="ADMIN">Admins</option><option value="HOD">HOD</option></select></label>
          <label style={labelStyle}>Status<select value={form.status} onChange={e => setField("status", e.target.value)} style={inputStyle}><option value="DRAFT">Draft (not visible)</option><option value="PUBLISHED">Publish now / at publish date</option><option value="SCHEDULED">Scheduled</option></select></label>
          <label style={labelStyle}>Publish date & time *<input type="datetime-local" required value={form.publishDate} onChange={e => setField("publishDate", e.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Expiry date & time<input type="datetime-local" value={form.expiryDate} onChange={e => setField("expiryDate", e.target.value)} style={inputStyle} /></label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Description *<textarea required maxLength={10000} rows={4} value={form.description} onChange={e => setField("description", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} placeholder="Write the full notice details…" /></label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Attachment file (PDF or image, max 900 KB)<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" onChange={e => chooseAttachment(e.target.files?.[0])} style={{ ...inputStyle, padding: 10 }} /><span style={{ color: "#64748b", fontSize: 12 }}>Or paste a direct HTTPS file URL below. Existing attachment stays when editing unless changed.</span></label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Attachment URL / uploaded file<input value={form.attachmentUrl} onChange={e => setField("attachmentUrl", e.target.value)} style={inputStyle} placeholder="https://… or select a supported small file above" /></label>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          <button disabled={saving} type="submit" style={buttonStyle("#2563eb")}>{saving ? "Saving…" : form.id ? "Save changes" : form.status === "DRAFT" ? "Save draft" : form.status === "SCHEDULED" ? "Schedule notice" : "Publish notice"}</button>
          <button type="button" onClick={() => { setForm(emptyForm); setError(""); }} style={buttonStyle("#e2e8f0", "#1e293b")}>Clear form</button>
        </div>
      </form>

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><h2 style={{ margin: 0, fontSize: 20 }}>All notices <span style={{ color: "#64748b", fontSize: 14 }}>({notices.length})</span></h2><button type="button" onClick={load} style={buttonStyle("#eff6ff", "#1d4ed8")}>↻ Refresh</button></div>
        {loading ? <p style={{ padding: 20, color: "#64748b" }}>Loading notices…</p> : notices.length === 0 ? <p style={{ padding: 24, color: "#64748b" }}>No notices yet. Create your first notice above.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}><thead><tr style={{ background: "#f8fafc", textAlign: "left" }}>{["Notice", "Category / Audience", "Publish date", "Expiry date", "Status", "Actions"].map(x => <th key={x} style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>{x}</th>)}</tr></thead><tbody>{notices.map(n => <tr key={n.id} style={{ borderTop: "1px solid #e2e8f0" }}><td style={{ padding: 14, maxWidth: 300 }}><strong>{n.title}</strong><p style={{ margin: "5px 0 0", fontSize: 12, color: "#64748b", whiteSpace: "pre-wrap" }}>{(n.content || n.description || "").slice(0, 140)}</p>{n.attachmentUrl && <a href={n.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 6, color: "#2563eb", fontSize: 12 }}>View attachment ↗</a>}</td><td style={{ padding: 14, fontSize: 13 }}>{n.category || "GENERAL"}<br /><span style={{ color: "#64748b" }}>{n.audience || "ALL"}</span></td><td style={{ padding: 14, fontSize: 13 }}>{formatDate(n.publishDate || n.scheduledAt || n.publishedAt)}</td><td style={{ padding: 14, fontSize: 13 }}>{formatDate(n.expiryDate)}</td><td style={{ padding: 14 }}><span style={badgeStyle(n.status)}>{n.status || (n.published ? "PUBLISHED" : "DRAFT")}</span></td><td style={{ padding: 14, whiteSpace: "nowrap" }}><button type="button" onClick={() => editNotice(n)} style={smallButton}>Edit</button> <button type="button" onClick={() => removeNotice(n)} style={{ ...smallButton, color: "#be123c" }}>Delete</button></td></tr>)}</tbody></table></div>}
      </section>
    </main>
  );
}

const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 };
const labelStyle = { display: "flex", flexDirection: "column", gap: 7, fontSize: 13, fontWeight: 700, color: "#334155" };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", font: "inherit", fontWeight: 400 };
const buttonStyle = (background, color = "#fff") => ({ border: 0, borderRadius: 10, padding: "11px 15px", background, color, fontWeight: 750, cursor: "pointer" });
const smallButton = { border: "1px solid #cbd5e1", borderRadius: 8, background: "#fff", padding: "7px 9px", cursor: "pointer", fontWeight: 700 };
const noticeStyle = (background, color) => ({ padding: 12, borderRadius: 10, background, color, fontWeight: 650 });
const badgeStyle = status => ({ display: "inline-block", padding: "5px 8px", borderRadius: 99, fontSize: 11, fontWeight: 800, background: status === "PUBLISHED" ? "#dcfce7" : status === "SCHEDULED" ? "#fef3c7" : "#e2e8f0", color: status === "PUBLISHED" ? "#166534" : status === "SCHEDULED" ? "#92400e" : "#334155" });
