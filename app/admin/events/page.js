"use client";

import { useCallback, useEffect, useState } from "react";

const emptyForm = { id: "", title: "", description: "", category: "COLLEGE_EVENT", eventDate: "", eventTime: "", venue: "", imageUrl: "", status: "DRAFT" };
const categories = [
  ["COLLEGE_EVENT", "College Event"], ["SEMINAR", "Seminar"], ["WORKSHOP", "Workshop"],
  ["CULTURAL", "Cultural Event"], ["SPORTS", "Sports Event"]
];
function dateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function showDate(value) {
  return value ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";
}
export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/events", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load events.");
      setEvents(Array.isArray(data.events) ? data.events : []);
      setError("");
    } catch (e) { setError(e.message || "Could not load events."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  function chooseImage(file) {
    if (!file) return;
    if (file.size > 900 * 1024) {
      setError("Choose an image under 900 KB, or use a direct image URL.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setError("Supported image formats: PNG, JPG, WEBP or GIF.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setField("imageUrl", String(reader.result || "")); setError(""); };
    reader.onerror = () => setError("Could not read this image.");
    reader.readAsDataURL(file);
  }
  function editEvent(event) {
    setForm({
      id: event.id, title: event.title || "", description: event.description || "",
      category: event.category || "COLLEGE_EVENT", eventDate: dateInput(event.eventDate),
      eventTime: event.eventTime || "", venue: event.venue || "",
      imageUrl: event.imageUrl || "", status: event.status || "DRAFT"
    });
    setError(""); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/events", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, eventDate: form.eventDate ? new Date(form.eventDate + "T12:00:00").toISOString() : "" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save event.");
      setMessage(form.id ? "Event updated successfully." : "Event created successfully.");
      setForm(emptyForm);
      await load();
    } catch (e) { setError(e.message || "Could not save event."); }
    finally { setSaving(false); }
  }
  async function deleteEvent(event) {
    if (!window.confirm('Delete "' + event.title + '"? This cannot be undone.')) return;
    setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/events?id=" + encodeURIComponent(event.id), { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete event.");
      setMessage("Event deleted.");
      if (form.id === event.id) setForm(emptyForm);
      await load();
    } catch (e) { setError(e.message || "Could not delete event."); }
  }
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 18px 48px", color: "#172554" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 22 }}>
        <div><p style={{ margin: 0, color: "#2563eb", fontWeight: 800, letterSpacing: 2, fontSize: 12 }}>NOBLE ERP · CAMPUS LIFE</p><h1 style={{ margin: "8px 0", fontSize: 30 }}>Events Management</h1><p style={{ margin: 0, color: "#64748b" }}>Create and manage college events, seminars, workshops, cultural and sports activities.</p></div>
        <button type="button" onClick={() => { setForm(emptyForm); setError(""); setMessage(""); }} style={buttonStyle("#0f172a")}>＋ New event</button>
      </div>
      {message && <p role="status" style={noticeStyle("#ecfdf5", "#047857")}>{message}</p>}
      {error && <p role="alert" style={noticeStyle("#fff1f2", "#be123c")}>{error}</p>}
      <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #dbeafe", borderRadius: 18, padding: 22, boxShadow: "0 10px 30px rgba(15,23,42,.06)", marginBottom: 26 }}>
        <h2 style={{ margin: "0 0 18px", fontSize: 20 }}>{form.id ? "Edit event" : "Create event"}</h2>
        <div style={gridStyle}>
          <label style={labelStyle}>Event title *<input required maxLength={180} value={form.title} onChange={e => setField("title", e.target.value)} style={inputStyle} placeholder="e.g. Annual Cultural Festival" /></label>
          <label style={labelStyle}>Event category *<select value={form.category} onChange={e => setField("category", e.target.value)} style={inputStyle}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label style={labelStyle}>Date *<input type="date" required value={form.eventDate} onChange={e => setField("eventDate", e.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Time<input type="time" value={form.eventTime} onChange={e => setField("eventTime", e.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Venue<input maxLength={250} value={form.venue} onChange={e => setField("venue", e.target.value)} style={inputStyle} placeholder="Auditorium / Sports ground…" /></label>
          <label style={labelStyle}>Status<select value={form.status} onChange={e => setField("status", e.target.value)} style={inputStyle}><option value="DRAFT">Draft (hidden from public)</option><option value="PUBLISHED">Published</option><option value="CANCELLED">Cancelled</option></select></label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Description<textarea rows={4} maxLength={10000} value={form.description} onChange={e => setField("description", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} placeholder="Event details, participation instructions…" /></label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Event image (PNG/JPG/WEBP/GIF, max 900 KB)<input type="file" accept=".png,.jpg,.jpeg,.webp,.gif" onChange={e => chooseImage(e.target.files?.[0])} style={{ ...inputStyle, padding: 10 }} /><span style={{ fontSize: 12, color: "#64748b" }}>Or paste a direct image URL below. Existing image remains while editing unless replaced.</span></label>
          <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>Image URL / selected image<input value={form.imageUrl} onChange={e => setField("imageUrl", e.target.value)} style={inputStyle} placeholder="https://… or choose a small image above" /></label>
        </div>
        {form.imageUrl && <div style={{ marginTop: 14 }}><img src={form.imageUrl} alt="Event preview" style={{ width: 180, height: 110, objectFit: "cover", borderRadius: 12, border: "1px solid #e2e8f0" }} /></div>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}><button disabled={saving} type="submit" style={buttonStyle("#2563eb")}>{saving ? "Saving…" : form.id ? "Save changes" : form.status === "PUBLISHED" ? "Publish event" : "Save event"}</button><button type="button" onClick={() => { setForm(emptyForm); setError(""); }} style={buttonStyle("#e2e8f0", "#1e293b")}>Clear form</button></div>
      </form>
      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><h2 style={{ margin: 0, fontSize: 20 }}>All events <span style={{ color: "#64748b", fontSize: 14 }}>({events.length})</span></h2><button type="button" onClick={load} style={buttonStyle("#eff6ff", "#1d4ed8")}>↻ Refresh</button></div>
        {loading ? <p style={{ padding: 20, color: "#64748b" }}>Loading events…</p> : events.length === 0 ? <p style={{ padding: 24, color: "#64748b" }}>No events yet. Create your first event above.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}><thead><tr style={{ background: "#f8fafc", textAlign: "left" }}>{["Event", "Category", "Date / Time", "Venue", "Status", "Actions"].map(x => <th key={x} style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>{x}</th>)}</tr></thead><tbody>{events.map(event => <tr key={event.id} style={{ borderTop: "1px solid #e2e8f0" }}><td style={{ padding: 14, maxWidth: 300 }}>{event.imageUrl && <img src={event.imageUrl} alt="" style={{ width: 74, height: 48, objectFit: "cover", borderRadius: 8, marginBottom: 6 }} />}<br /><strong>{event.title}</strong><p style={{ margin: "4px 0", color: "#64748b", fontSize: 12 }}>{(event.description || "").slice(0, 100)}</p></td><td style={{ padding: 14, fontSize: 13 }}>{(categories.find(([value]) => value === event.category) || [event.category, event.category])[1]}</td><td style={{ padding: 14, fontSize: 13 }}>{showDate(event.eventDate)}<br />{event.eventTime || "Time TBA"}</td><td style={{ padding: 14, fontSize: 13 }}>{event.venue || "—"}</td><td style={{ padding: 14 }}><span style={badgeStyle(event.status)}>{event.status}</span></td><td style={{ padding: 14, whiteSpace: "nowrap" }}><button type="button" onClick={() => editEvent(event)} style={smallButton}>Edit</button> <button type="button" onClick={() => deleteEvent(event)} style={{ ...smallButton, color: "#be123c" }}>Delete</button></td></tr>)}</tbody></table></div>}
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
const badgeStyle = status => ({ display: "inline-block", padding: "5px 8px", borderRadius: 99, fontSize: 11, fontWeight: 800, background: status === "PUBLISHED" ? "#dcfce7" : status === "CANCELLED" ? "#fee2e2" : "#e2e8f0", color: status === "PUBLISHED" ? "#166534" : status === "CANCELLED" ? "#991b1b" : "#334155" });
