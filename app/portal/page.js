"use client";

import { useEffect, useState } from "react";
import ModuleHeader from "@/components/ModuleHeader";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const labels={profile:"My Profile",attendance:"Attendance",timetable:"Timetable",results:"Results",examination:"Examination",subjects:"My Subjects",fees:"Fees & Payments"};
const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function PortalView(){
  const params=useSearchParams();
  const module=params.get("module")||"profile";
  const [data,setData]=useState(null),[error,setError]=useState("");

  useEffect(()=>{setData(null);setError("");fetch("/api/portal?module="+encodeURIComponent(module),{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d}).then(setData).catch(e=>setError(e.message));},[module]);

  const title=labels[module]||"Portal";
  return <main className="content" style={{padding:"32px",maxWidth:"1400px"}}>
    <ModuleHeader eyebrow="NOBLE ERP • PERSONAL PORTAL" title={title} description="Live information from your Noble ERP account, presented in a clean personal workspace." />
    {error&&<div className="error">{error}</div>}
    {!data&&!error&&<div className="panel"><p>Loading live data…</p></div>}

    {data&&module==="profile"&&<div className="panel" style={{padding:24}}><h2>Profile</h2><pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{JSON.stringify(data.profile,null,2).replace(/[{}"]/g,"")}</pre></div>}

    {data&&module==="attendance"&&<div className="panel"><div className="panelTitle"><b>Attendance</b><span>Live records</span></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Subject</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th>Percentage</th></tr></thead><tbody>{data.rows?.map((r,i)=><tr key={i}><td>{r.subject?.code} — {r.subject?.name}</td><td>{r.present||0}</td><td>{r.absent||0}</td><td>{r.late||0}</td><td>{r.total}</td><td>{r.total?Math.round((r.present||0)/r.total*100):0}%</td></tr>)}</tbody></table></div></div>}

    {data&&module==="timetable"&&<div className="panel"><div className="panelTitle"><b>Timetable</b></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Faculty</th><th>Room</th></tr></thead><tbody>{data.rows?.map(r=><tr key={r.id}><td>{days[r.dayOfWeek]||r.dayOfWeek}</td><td>{r.startTime} – {r.endTime}</td><td>{r.subject?.code} — {r.subject?.name}</td><td>{r.faculty?.name}</td><td>{r.room?.code||"—"}</td></tr>)}</tbody></table></div></div>}

    {data&&module==="subjects"&&<div className="panel"><div className="panelTitle"><b>My Subjects</b></div><div className="quick">{data.rows?.map(r=><div key={r.id} className="panel"><b>{r.code} — {r.name}</b><span>{r.type||"Subject"} • {r.credits??"—"} credits</span></div>)}</div></div>}

    {data&&module==="results"&&<div className="panel"><div className="panelTitle"><b>Results</b></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Status</th></tr></thead><tbody>{data.rows?.map(r=><tr key={r.id}><td>{r.exam?.name}</td><td>{r.subject?.code} — {r.subject?.name}</td><td>{r.marks??"—"}</td><td>{r.grade||"—"}</td><td>{r.status}</td></tr>)}</tbody></table></div></div>}

    {data&&module==="fees"&&<div className="panel"><div className="panelTitle"><b>Fees & Payments</b><span>Live ledger</span></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Student</th><th>Fee</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>{data.rows?.map(r=><tr key={r.id}><td>{r.student?.name||"My Account"}</td><td>{r.feeStructure?.name}</td><td>₹{Number(r.amountDue)}</td><td>₹{Number(r.amountPaid)}</td><td>₹{Number(r.amountDue)-Number(r.amountPaid)}</td><td>{r.status}</td></tr>)}</tbody></table></div></div>}

    {data&&module==="examination"&&<div className="panel"><div className="panelTitle"><b>Exam Schedule</b></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Exam</th><th>Subject</th><th>Date</th><th>Time</th><th>Room</th></tr></thead><tbody>{data.rows?.map(r=><tr key={r.id}><td>{r.exam?.name}</td><td>{r.subject?.code} — {r.subject?.name}</td><td>{new Date(r.date).toLocaleDateString("en-IN")}</td><td>{r.startTime} – {r.endTime}</td><td>{r.room?.code||"—"}</td></tr>)}</tbody></table></div></div>}
  </main>;
}

export default function PortalPage(){return <Suspense fallback={<main className="content" style={{padding:32}}>Loading…</main>}><PortalView/></Suspense>}
