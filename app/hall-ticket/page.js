"use client";
import{useEffect,useState}from"react";
import ModuleHeader from "@/components/ModuleHeader";
export default function HallTicket(){
 const[d,setD]=useState(null),[studentId,setStudentId]=useState(""),[err,setErr]=useState(""),[loading,setLoading]=useState(false);
 async function load(id=""){setLoading(true);setErr("");try{const r=await fetch("/api/hall-ticket"+(id?"?studentId="+encodeURIComponent(id):""));const x=await r.json();if(!r.ok)throw Error(x.error);setD(x);if(x.student)setStudentId(x.student.id)}catch(e){setErr(e.message)}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 async function bulk(){try{const r=await fetch("/api/hall-ticket?bulk=1");if(!r.ok){const x=await r.json();throw Error(x.error)}const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="noble-erp-hall-tickets.pdf";a.click();URL.revokeObjectURL(url)}catch(e){setErr(e.message)}}
 return <main className="content" style={{padding:32,maxWidth:1100}}>
  <ModuleHeader eyebrow="NOBLE ERP • EXAMINATION" title="Hall Ticket" description="Generate, print or save student examination hall tickets as PDF." actions={[]}/>
  {err&&<div className="error">{err}</div>}
  {d?.students&&<div className="panel" style={{marginBottom:18}}><div className="panelTitle"><b>Select Student</b><button className="primary" onClick={bulk}>Download All Hall Tickets PDF</button></div><select value={studentId} onChange={e=>{setStudentId(e.target.value);if(e.target.value)load(e.target.value)}}><option value="">Select student</option>{d.students.map(s=><option key={s.id} value={s.id}>{s.studentId} — {s.name} • {s.program?.name||"—"} • {s.semester?.name||"—"} • {s.division?.name||"—"}</option>)}</select></div>}
  {loading&&<div className="panel">Loading hall ticket…</div>}
  {d?.student&&<div className="panel" id="hall-ticket" style={{padding:30}}>
   <div style={{textAlign:"center"}}><h2>NOBLE GROUP OF INSTITUTES</h2><h3>EXAMINATION HALL TICKET</h3></div>
   <p><b>Student:</b> {d.student.name} &nbsp; <b>ID:</b> {d.student.studentId}</p>
   <p><b>Program:</b> {d.student.program?.name||"—"} &nbsp; <b>Semester:</b> {d.student.semester?.name||"—"} &nbsp; <b>Division:</b> {d.student.division?.name||"—"}</p>
   <table style={{width:"100%",marginTop:20}}><thead><tr><th>Exam</th><th>Subject</th><th>Date</th><th>Time</th><th>Room</th></tr></thead><tbody>{d.schedules.map(x=><tr key={x.id}><td>{x.exam.name}</td><td>{x.subject.code} — {x.subject.name}</td><td>{new Date(x.date).toLocaleDateString("en-IN")}</td><td>{x.startTime}–{x.endTime}</td><td>{x.room?.code||"—"}</td></tr>)}</tbody></table>
   <button className="primary" style={{marginTop:20}} onClick={()=>window.print()}>Print / Save PDF</button>
  </div>}
 </main>
}