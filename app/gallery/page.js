import Link from "next/link";
export const dynamic = "force-dynamic";
async function getAlbums() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000");
    const response = await fetch(base + "/api/public/gallery", { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json(); return Array.isArray(data.albums) ? data.albums : [];
  } catch { return []; }
}
export default async function GalleryPage() {
  const albums = await getAlbums();
  return <main style={{ minHeight: "100vh", background: "linear-gradient(145deg,#eff6ff,#f8fafc 48%,#eef2ff)", padding: "42px 18px 70px", color: "#172554" }}>
    <div style={{ maxWidth: 1180, margin: "0 auto" }}><Link href="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 750 }}>← Noble Group of Institutes</Link>
      <header style={{ margin: "28px 0 32px" }}><span style={{ display: "inline-block", background: "#dbeafe", color: "#1d4ed8", borderRadius: 99, padding: "7px 12px", fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>CAMPUS LIFE</span><h1 style={{ fontSize: "clamp(34px,5vw,52px)", margin: "14px 0 8px", letterSpacing: "-1.5px" }}>Campus Gallery</h1><p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.7, maxWidth: 680 }}>Moments, celebrations and memories from Noble Group of Institutes.</p></header>
      {!albums.length ? <section style={{ padding: 36, border: "1px solid #dbeafe", borderRadius: 20, background: "#fff", color: "#64748b" }}>Gallery photos will appear here when albums are published by the institute.</section> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 24 }}>{albums.map(album => <section key={album.id} style={{ background: "#fff", border: "1px solid #dbeafe", borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 34px rgba(30,64,175,.07)" }}>
        <div style={{ padding: 18 }}><h2 style={{ margin: "0 0 7px", fontSize: 22 }}>{album.title}</h2>{album.description && <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>{album.description}</p>}</div>
        {album.images.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 3 }}>{album.images.map((image, index) => <a href={image.url} target="_blank" rel="noreferrer" key={image.id} aria-label={"Open image " + (image.caption || index + 1)} style={{ display: "block", overflow: "hidden", background: "#e2e8f0", gridColumn: index === 0 && album.images.length % 2 ? "span 2" : "auto" }}><img src={image.url} alt={image.caption || album.title} loading="lazy" style={{ display: "block", width: "100%", height: index === 0 && album.images.length % 2 ? 260 : 180, objectFit: "cover", transition: "transform .25s" }} /></a>)}</div> : album.coverUrl ? <img src={album.coverUrl} alt={album.title} style={{ display: "block", width: "100%", maxHeight: 320, objectFit: "cover" }} /> : <div style={{ padding: 24, color: "#64748b" }}>Photos are being added to this album.</div>}
        <div style={{ padding: "12px 18px", color: "#64748b", fontSize: 12 }}>{album.images.length} photo(s)</div>
      </section>)}</div>}
    </div>
  </main>;
}
