import Link from "next/link";

export const dynamic = "force-dynamic";

async function getEvents() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && "https://" + process.env.VERCEL_URL || "http://localhost:3000";
    const response = await fetch(base + "/api/public/events", { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.events) ? data.events : [];
  } catch { return []; }
}
const categoryNames = { COLLEGE_EVENT: "College Event", SEMINAR: "Seminar", WORKSHOP: "Workshop", CULTURAL: "Cultural Event", SPORTS: "Sports Event" };
export default async function EventsPage() {
  const events = await getEvents();
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(145deg,#eff6ff 0%,#f8fafc 45%,#eef2ff 100%)", padding: "42px 18px 64px", color: "#172554" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 750 }}>← Noble Group of Institutions</Link>
        <header style={{ margin: "26px 0 30px" }}>
          <span style={{ display: "inline-block", background: "#dbeafe", color: "#1d4ed8", borderRadius: 99, padding: "7px 12px", fontWeight: 800, fontSize: 12, letterSpacing: 1 }}>CAMPUS LIFE</span>
          <h1 style={{ fontSize: "clamp(32px,5vw,48px)", margin: "14px 0 8px", letterSpacing: "-1px" }}>Events & Activities</h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 680, lineHeight: 1.7 }}>Explore upcoming college events, seminars, workshops, cultural programmes and sports activities at Noble Group of Institutions.</p>
        </header>
        {events.length === 0 ? <section style={{ background: "#fff", border: "1px solid #dbeafe", borderRadius: 20, padding: "38px 22px", textAlign: "center", boxShadow: "0 12px 36px rgba(30,64,175,.06)" }}><div style={{ fontSize: 38 }}>✦</div><h2 style={{ margin: "12px 0 6px" }}>Upcoming events will appear here</h2><p style={{ color: "#64748b", margin: 0 }}>The institute has not published any upcoming events yet. Please check again soon.</p></section> :
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 22 }}>
          {events.map(event => <article key={event.id} style={{ background: "#fff", border: "1px solid #dbeafe", borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 36px rgba(30,64,175,.07)" }}>
            {event.imageUrl ? <img src={event.imageUrl} alt={event.title} style={{ width: "100%", height: 205, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", color: "#fff", fontSize: 46 }}>✦</div>}
            <div style={{ padding: 20 }}>
              <span style={{ display: "inline-block", borderRadius: 99, background: "#eef2ff", color: "#4338ca", padding: "6px 10px", fontSize: 11, fontWeight: 800 }}>{categoryNames[event.category] || event.category}</span>
              <h2 style={{ margin: "12px 0 8px", fontSize: 22 }}>{event.title}</h2>
              {event.description && <p style={{ color: "#64748b", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{event.description}</p>}
              <div style={{ display: "grid", gap: 8, marginTop: 16, color: "#334155", fontSize: 14 }}>
                <span>📅 {new Date(event.eventDate).toLocaleDateString("en-IN", { dateStyle: "long" })}</span>
                {event.eventTime && <span>◷ {event.eventTime}</span>}
                {event.venue && <span>⌖ {event.venue}</span>}
              </div>
            </div>
          </article>)}
        </section>}
      </div>
    </main>
  );
}
