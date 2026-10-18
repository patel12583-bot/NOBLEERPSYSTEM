"use client";
import { useCallback, useEffect, useState } from "react";

const blank = { id: "", title: "", description: "", coverUrl: "", published: false };
const field = { display: "flex", flexDirection: "column", gap: 7, fontSize: 13, fontWeight: 700, color: "#334155" };
const input = { width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", font: "inherit", fontWeight: 400 };
const btn = (background = "#1d4ed8") => ({ border: 0, borderRadius: 10, padding: "10px 14px", background, color: "#fff", fontWeight: 750, cursor: "pointer" });
export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState([]);
  const [form, setForm] = useState(blank);
  const [files, setFiles] = useState([]);
  const [uploadAlbum, setUploadAlbum] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/gallery", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to load gallery.");
      setAlbums(d.albums || []);
      setUploadAlbum(current => current || d.albums?.[0]?.id || "");
      setError("");
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const setValue = (key, value) => setForm(old => ({ ...old, [key]: value }));
  async function saveAlbum(e) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/admin/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to save album.");
      setMessage(form.id ? "Album updated." : "Album created.");
      setForm(blank); await load(); if (!uploadAlbum) setUploadAlbum(d.album.id);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function edit(album) { setForm({ id: album.id, title: album.title, description: album.description || "", coverUrl: album.coverUrl || "", published: album.published }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function removeAlbum(album) {
    if (!window.confirm("Delete album “" + album.title + "” and all its images?")) return;
    setError(""); setMessage("");
    try { const r = await fetch("/api/admin/gallery?albumId=" + encodeURIComponent(album.id), { method: "DELETE" }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Delete failed."); setMessage("Album deleted."); await load(); }
    catch (e) { setError(e.message); }
  }
  async function uploadImages(e) {
    e.preventDefault(); if (!uploadAlbum || !files.length) { setError("Choose an album and at least one image."); return; }
    if (files.length > 20) { setError("Upload up to 20 images at a time."); return; }\n    if (files.reduce((total, file) => total + file.size, 0) > 3 * 1024 * 1024) { setError("Selected images total more than 3 MB. Please upload fewer images at a time."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const images = await Promise.all(files.map(file => new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) return reject(new Error(file.name + " is not an image."));
        if (file.size > 900 * 1024) return reject(new Error(file.name + " is over 900 KB. Choose smaller images."));
        const reader = new FileReader(); reader.onload = () => resolve({ url: reader.result, caption: file.name.replace(/\.[^.]+$/, "").slice(0, 250) }); reader.onerror = () => reject(new Error("Could not read " + file.name)); reader.readAsDataURL(file);
      })));
      const r = await fetch("/api/admin/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "image", albumId: uploadAlbum, images }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Image upload failed.");
      setMessage(d.count + " image(s) uploaded."); setFiles([]); e.target.reset(); await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function removeImage(image) {
    if (!window.confirm("Delete this image?")) return;
    try { const r = await fetch("/api/admin/gallery?imageId=" + encodeURIComponent(image.id), { method: "DELETE" }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Delete failed."); setMessage("Image deleted."); await load(); }
    catch (e) { setError(e.message); }
  }
  return <main style={{ minHeight: "100vh", background: "#f1f5f9", padding: "30px 16px 60px", color: "#0f172a" }}>
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <a href="/dashboard" style={{ color: "#1d4ed8", fontWeight: 750, textDecoration: "none" }}>← Dashboard</a>
      <header style={{ margin: "20px 0 24px" }}><span style={{ color: "#4f46e5", fontWeight: 800, letterSpacing: 1, fontSize: 12 }}>CAMPUS LIFE / MEDIA</span><h1 style={{ fontSize: "clamp(30px,4vw,42px)", margin: "8px 0" }}>Gallery Management</h1><p style={{ color: "#64748b", margin: 0 }}>Create albums, upload multiple photos, manage images and publish albums to the public website.</p></header>
      {message && <p style={{ padding: 12, borderRadius: 10, background: "#dcfce7", color: "#166534" }}>{message}</p>}
      {error && <p style={{ padding: 12, borderRadius: 10, background: "#fee2e2", color: "#991b1b" }}>{error}</p>}
      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 22, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>{form.id ? "Edit album" : "Create gallery album"}</h2>
        <form onSubmit={saveAlbum} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 15 }}>
          <label style={field}>Album title *<input required maxLength={180} value={form.title} onChange={e => setValue("title", e.target.value)} style={input} placeholder="Annual Function 2026" /></label>
          <label style={field}>Cover image URL (optional)<input value={form.coverUrl} onChange={e => setValue("coverUrl", e.target.value)} style={input} placeholder="https://.../cover.jpg" /></label>
          <label style={{ ...field, gridColumn: "1 / -1" }}>Description<textarea value={form.description} onChange={e => setValue("description", e.target.value)} maxLength={3000} rows={3} style={input} placeholder="Describe this album..." /></label>
          <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, fontWeight: 700 }}><input type="checkbox" checked={form.published} onChange={e => setValue("published", e.target.checked)} /> Publish on public website</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><button disabled={busy} style={btn()}>{busy ? "Saving…" : form.id ? "Save album" : "Create album"}</button><button type="button" onClick={() => setForm(blank)} style={{ ...btn("#e2e8f0"), color: "#334155" }}>Clear</button></div>
        </form>
      </section>
      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 22, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Upload multiple images</h2>
        <form onSubmit={uploadImages} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 15, alignItems: "end" }}>
          <label style={field}>Choose album<select value={uploadAlbum} onChange={e => setUploadAlbum(e.target.value)} style={input}><option value="">Select album</option>{albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
          <label style={field}>Select images (up to 20)<input type="file" accept="image/*" multiple onChange={e => setFiles(Array.from(e.target.files || []))} style={input} /></label>
          <div><p style={{ color: "#64748b", fontSize: 12, marginTop: 0 }}>Each image must be under 900 KB. For larger images, use an image-host URL.</p><button disabled={busy || !uploadAlbum || !files.length} style={btn()}>{busy ? "Uploading…" : "Upload " + files.length + " image(s)"}</button></div>
        </form>
      </section>
      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 22 }}>
        <h2 style={{ marginTop: 0 }}>Albums & images</h2>
        {loading ? <p>Loading gallery…</p> : !albums.length ? <p style={{ color: "#64748b" }}>No albums yet. Create your first album above.</p> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {albums.map(album => <article key={album.id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
            {(album.coverUrl || album.images[0]?.url) && <img src={album.coverUrl || album.images[0]?.url} alt="" style={{ width: "100%", height: 155, objectFit: "cover", background: "#e2e8f0" }} />}
            <div style={{ padding: 15 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}><h3 style={{ margin: "0 0 7px" }}>{album.title}</h3><span style={{ fontSize: 11, fontWeight: 800, color: album.published ? "#166534" : "#64748b" }}>{album.published ? "PUBLISHED" : "DRAFT"}</span></div><p style={{ color: "#64748b", fontSize: 13 }}>{album.description || "No description"} · {album.images.length} image(s)</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}><button onClick={() => edit(album)} style={{ ...btn("#e2e8f0"), color: "#334155" }}>Edit album</button><button onClick={() => removeAlbum(album)} style={btn("#be123c")}>Delete album</button></div>
              {album.images.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7 }}>{album.images.map(image => <div key={image.id} style={{ position: "relative" }}><img src={image.url} alt={image.caption || ""} style={{ width: "100%", height: 82, objectFit: "cover", borderRadius: 8 }} /><button title="Delete image" onClick={() => removeImage(image)} style={{ position: "absolute", top: 4, right: 4, border: 0, borderRadius: 6, background: "#fff", color: "#be123c", fontWeight: 900, cursor: "pointer" }}>×</button></div>)}</div>}
            </div>
          </article>)}
        </div>}
      </section>
    </div>
  </main>;
}
