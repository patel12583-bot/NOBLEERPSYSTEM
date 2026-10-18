"use client";
import { useEffect, useMemo, useState } from "react";
const days = ["","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
export default function FacultyTimetablePage() {
  const [data, setData] = useState({ rows: [], faculty: null });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    fetch("/api/faculty/timetable").then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load timetable");
      setData(body);
    }).catch(e => setError(e.message));
  }, []);
  const rows = useMemo(() => data.rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [data.rows, query]);
  const profile = data.faculty;
  return <main className="content" style={{padding:24,maxWidth:1400,margin:"0 auto"}}>
    <header style={{marginBottom:24}}>
      <p style={{color:"#2563eb",fontWeight:700,letterSpacing:1,fontSize:12}}>NOBLE ERP • FACULTY PORTAL</p>
      <h1 style={{fontSize:30,fontWeight:800,margin:"6px 0"}}>My Timetable</h1>
      <p style={{color:"#64748b"}}>Your weekly class schedule, sorted by day and start time.</p>
      {profile && <p style={{fontWeight:600}}>Faculty: {profile.name} {profile.facultyId ? "• " + profile.facultyId : ""}</p>}
    </header>
    {error && <div role="alert" style={{padding:14,background:"#fef2f2",color:"#991b1b",borderRadius:12,marginBottom:16}}>{error}</div>}
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
      <div style={{padding:18,border:"1px solid #dbeafe",borderRadius:16}}><div style={{color:"#64748b"}}>Weekly Classes</div><strong style={{fontSize:28}}>{data.rows.length}</strong></div>
      <div style={{padding:18,border:"1px solid #dbeafe",borderRadius:16}}><div style={{color:"#64748b"}}>Days Scheduled</div><strong style={{fontSize:28}}>{new Set(data.rows.map(x=>x.dayOfWeek)).size}</strong></div>
      <div style={{padding:18,border:"1px solid #dbeafe",borderRadius:16}}><div style={{color:"#64748b"}}>Subjects</div><strong style={{fontSize:28}}>{new Set(data.rows.map(x=>x.subjectId)).size}</strong></div>
    </section>
    <section style={{border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",background:"#fff"}}>
      <div style={{padding:16,display:"flex",gap:12,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
        <h2 style={{fontSize:18,fontWeight:750}}>Weekly Schedule</h2>
        <input aria-label="Search timetable" placeholder="Search subject, day, room…" value={query} onChange={e=>setQuery(e.target.value)} style={{padding:"10px 12px",border:"1px solid #cbd5e1",borderRadius:10,minWidth:220}}/>
      </div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:760}}>
        <thead><tr>{["Day","Time","Course / Semester / Division","Subject","Faculty","Room"].map(label=><th key={label} style={{textAlign:"left",padding:12,background:"#eff6ff",color:"#1e3a8a",fontSize:13}}>{label}</th>)}</tr></thead>
        <tbody>{rows.map(row=><tr key={row.id}>{[
          days[row.dayOfWeek] || "—",
          row.startTime+" – "+row.endTime,
          (row.division?.program?.name || row.division?.program?.code || "—")+" / Sem "+(row.division?.semester?.number ?? "—")+" / "+(row.division?.name || "—"),
          (row.subject?.code ? row.subject.code+" — " : "")+(row.subject?.name || "—"),
          row.faculty?.name || "—",
          row.room?.code || row.room?.name || "—"
        ].map((value,index)=><td key={index} style={{padding:12,borderTop:"1px solid #e2e8f0",color:"#334155",fontSize:14}}>{value}</td>)}</tr>)}
        {!rows.length && <tr><td colSpan={6} style={{padding:28,textAlign:"center",color:"#64748b"}}>{error ? "Timetable could not be loaded." : data.rows.length ? "No timetable entries match your search." : "No timetable has been assigned to your account yet."}</td></tr>}</tbody>
      </table></div>
    </section>
  </main>;
}