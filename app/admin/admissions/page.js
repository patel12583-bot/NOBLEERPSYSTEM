import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

async function getOverview() {
  try {
    const [students, documents, recent, courses] = await Promise.all([
      prisma.student.count(),
      prisma.document.count(),
      prisma.student.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: { id: true, studentId: true, name: true, mobile: true, admissionDate: true, createdAt: true, program: { select: { name: true, code: true } } }
      }),
      prisma.program.count({ where: { status: "ACTIVE" } })
    ]);
    return { students, documents, recent, courses, connected: true };
  } catch (error) {
    console.error("Admission dashboard database error:", error);
    return { students: 0, documents: 0, recent: [], courses: 0, connected: false };
  }
}

export default async function AdmissionDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) redirect("/login");

  const data = await getOverview();
  const cards = [
    { label: "Total Admissions", value: data.students, hint: "Student records", icon: "♟", tone: "blue" },
    { label: "Documents Stored", value: data.documents, hint: "Uploaded files", icon: "▤", tone: "violet" },
    { label: "Active Courses", value: data.courses, hint: "Configured programmes", icon: "▦", tone: "green" },
    { label: "Database", value: data.connected ? "Connected" : "Unavailable", hint: data.connected ? "Records are accessible" : "Check Neon DATABASE_URL and schema", icon: "◉", tone: data.connected ? "green" : "amber" }
  ];

  return (
    <AdminShell active="Dashboard">
      <div className="moduleHeader">
        <div><div className="eyebrow">NOBLE GROUP OF INSTITUTES</div><h1>Admission Dashboard</h1><p>Manage admissions, student records and document services from one place.</p></div>
        <Link className="primary" href="/admin/students">＋ New Admission</Link>
      </div>

      {!data.connected && <div className="error" role="status" style={{ margin: "18px 0" }}>Database is currently unavailable. The dashboard is ready, but live records will appear after the Neon database connection is restored.</div>}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(205px,1fr))", gap: 16, margin: "24px 0" }}>
        {cards.map(card => <article key={card.label} style={{ background: "#fff", border: "1px solid #e4eaf2", borderRadius: 16, padding: 22, boxShadow: "0 8px 24px rgba(18,35,59,.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>{card.label}</span><span style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: "#edf4ff", color: "#1769d5", fontSize: 20 }}>{card.icon}</span></div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#12233b", marginTop: 14 }}>{card.value}</div>
          <div style={{ color: "#7b8798", fontSize: 12, marginTop: 5 }}>{card.hint}</div>
        </article>)}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 24 }}>
        <Link href="/admin/students" style={{ textDecoration: "none", color: "inherit", background: "#fff", border: "1px solid #e4eaf2", borderRadius: 16, padding: 22 }}>
          <div style={{ color: "#1769d5", fontSize: 24 }}>＋</div><h2 style={{ fontSize: 18, margin: "10px 0 6px" }}>Create New Admission</h2><p style={{ color: "#718096", fontSize: 13, margin: 0 }}>Enter student, parent, contact and academic details.</p>
        </Link>
        <Link href="/admin/documents" style={{ textDecoration: "none", color: "inherit", background: "#fff", border: "1px solid #e4eaf2", borderRadius: 16, padding: 22 }}>
          <div style={{ color: "#1769d5", fontSize: 24 }}>▤</div><h2 style={{ fontSize: 18, margin: "10px 0 6px" }}>Student Documents</h2><p style={{ color: "#718096", fontSize: 13, margin: 0 }}>Upload, review and manage student document files.</p>
        </Link>
        <Link href="/admin/academics" style={{ textDecoration: "none", color: "inherit", background: "#fff", border: "1px solid #e4eaf2", borderRadius: 16, padding: 22 }}>
          <div style={{ color: "#1769d5", fontSize: 24 }}>▦</div><h2 style={{ fontSize: 18, margin: "10px 0 6px" }}>Courses & Categories</h2><p style={{ color: "#718096", fontSize: 13, margin: 0 }}>Configure courses and academic options.</p>
        </Link>
      </section>

      <section style={{ background: "#fff", border: "1px solid #e4eaf2", borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div><h2 style={{ margin: 0, fontSize: 18 }}>Recent Admissions</h2><p style={{ color: "#718096", fontSize: 12, margin: "5px 0 0" }}>Latest student records added to the system</p></div>
          <Link href="/admin/students" style={{ color: "#1769d5", fontWeight: 700, fontSize: 13 }}>View all →</Link>
        </div>
        {data.recent.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}><thead><tr style={{ color: "#718096", textAlign: "left" }}>{["Admission ID","Student","Course","Mobile","Created"].map(x => <th key={x} style={{ padding: "12px 10px", borderBottom: "1px solid #e8edf3" }}>{x}</th>)}</tr></thead><tbody>{data.recent.map(student => <tr key={student.id}><td style={{ padding: "13px 10px", borderBottom: "1px solid #eef2f6", fontWeight: 700 }}>{student.admissionNo || student.studentId}</td><td style={{ padding: "13px 10px", borderBottom: "1px solid #eef2f6" }}>{student.name}</td><td style={{ padding: "13px 10px", borderBottom: "1px solid #eef2f6" }}>{student.program?.code || student.program?.name || "—"}</td><td style={{ padding: "13px 10px", borderBottom: "1px solid #eef2f6" }}>{student.mobile || "—"}</td><td style={{ padding: "13px 10px", borderBottom: "1px solid #eef2f6" }}>{new Date(student.createdAt).toLocaleDateString("en-IN")}</td></tr>)}</tbody></table></div> : <div style={{ padding: "26px 12px", color: "#718096", textAlign: "center" }}>{data.connected ? "No admissions yet. Create the first student admission to get started." : "Recent admission records will load when the database reconnects."}</div>}
      </section>
    </AdminShell>
  );
}
