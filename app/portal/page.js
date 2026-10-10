"use client";

import { useEffect, useState } from "react";
import ModuleHeader from "@/components/ModuleHeader";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const userRoleStudent=(profile)=>Boolean(profile&&profile.studentId);
const labels={profile:"My Profile",attendance:"Attendance",timetable:"Timetable",results:"Results",examination:"Examination",subjects:"My Subjects",fees:"Fees & Payments"};
const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function PortalView(){
  const params=useSearchParams();
  const module=params.get("module")||"profile";
  const [data,setData]=useState(null),[error,setError]=useState("");
  const [editing,setEditing]=useState(false),[saving,setSaving]=useState(false),[saveMessage,setSaveMessage]=useState("");
  const [form,setForm]=useState({name:"",email:"",mobile:"",address:"",gender:""});

  useEffect(()=>{setData(null);setError("");fetch("/api/portal?module="+encodeURIComponent(module),{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d}).then(setData).catch(e=>setError(e.message));},[module]);

  const title=labels[module]||"Portal";
  return <main className="content" style={{padding:"32px",maxWidth:"1400px"}}>
    <ModuleHeader eyebrow="NOBLE ERP • PERSONAL PORTAL" title={title} description="Live information from your Noble ERP account, presented in a clean personal workspace." />
    {error&&<div className="error">{error}</div>}
    {!data&&!error&&<div className="panel"><p>Loading live data…</p></div>}

    {data&&module==="profile"&&<div style={{display:"grid",gap:18}}>
      {userRoleStudent(data.profile)&&<section className="studentIdCard" id="student-id-card">
        <div className="studentIdTop"><div className="studentIdLogo">N</div><div><small>noble group of Institution</small><strong>STUDENT IDENTITY CARD</strong><span>STUDENT • ACADEMIC YEAR</span></div><div className="studentIdChip">N</div></div>
        <div className="studentIdBody"><div className="studentIdPhoto">{data.profile?.photoUrl?<img src={data.profile.photoUrl} alt="Student profile"/>:<span>{(data.profile?.name||"S").slice(0,1).toUpperCase()}</span>}</div><div className="studentIdDetails"><h2>{data.profile?.name||"Student Name"}</h2><div className="studentIdNumber">{data.profile?.studentId||"STUDENT ID PENDING"}</div><div className="studentIdRows"><div><small>PROGRAM</small><b>{data.profile?.program?.name||"—"}</b></div><div><small>SEMESTER</small><b>{data.profile?.semester?.name||"—"}</b></div><div><small>DEPARTMENT</small><b>{data.profile?.department?.name||"—"}</b></div><div><small>DIVISION</small><b>{data.profile?.division?.name||"—"}</b></div></div></div></div>
        <div className="studentIdFooter"><span>Valid only with institute records</span><span>{data.profile?.email||"Student Portal"}</span></div>
        <div className="studentIdActions"><button className="primary" onClick={()=>window.print()}>Print / Save ID Card PDF</button><span>Use “Save as PDF” in the print dialog.</span></div>
      </section>}
      <div className="panel" style={{padding:24}}>
        <div className="panelTitle"><div><small className="eyebrow">ACCOUNT PROFILE</small><h2 style={{margin:"6px 0"}}>{data.profile?.name||data.profile?.username||"My Profile"}</h2><span>{data.profile?.studentId||data.profile?.facultyId||data.profile?.username||""}</span></div>
          {userRoleStudent(data.profile)&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="secondary" style={{color:"#1769d5",background:"#f5f9ff",border:"1px solid #dbe8f7",padding:"10px 14px"}} onClick={()=>{setForm({name:data.profile?.name||"",email:data.profile?.email||"",mobile:data.profile?.mobile||"",address:data.profile?.address||"",gender:data.profile?.gender||""});setSaveMessage("");setEditing(v=>!v)}}>{editing?"Cancel":"Edit Profile"}</button></div>}
          <span className="rolePill">LIVE PROFILE</span>
        </div>
        {saveMessage&&<p role="status" style={{color:"#16734b",fontSize:12,marginTop:12}}>{saveMessage}</p>}
        {editing&&userRoleStudent(data.profile)&&<form className="studentProfileForm" onSubmit={async e=>{e.preventDefault();setSaving(true);setSaveMessage("");setError("");try{const response=await fetch("/api/portal?module=profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to save profile.");setData(prev=>({...prev,profile:result.profile}));setEditing(false);setSaveMessage("Profile updated successfully.");}catch(err){setError(err.message||"Unable to save profile.");}finally{setSaving(false)}}}>
          <label>Full name<input required maxLength={120} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></label>
          <label>Email address<input type="email" maxLength={120} value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></label>
          <label>Mobile number<input maxLength={120} value={form.mobile} onChange={e=>setForm(p=>({...p,mobile:e.target.value}))}/></label>
          <label>Gender<input maxLength={120} value={form.gender} onChange={e=>setForm(p=>({...p,gender:e.target.value}))}/></label>
          <label className="studentAddressField">Address<textarea rows={3} maxLength={500} value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))}/></label>
          <div className="studentFormActions"><button className="primary" type="submit" disabled={saving}>{saving?"Saving…":"Save changes"}</button><button type="button" onClick={()=>setEditing(false)}>Cancel</button></div>
        </form>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginTop:20}}>{Object.entries(data.profile||{}).filter(([k,v])=>v!==null&&typeof v!=="object"&&!["passwordHash","id","userId"].includes(k)).map(([k,v])=><div key={k} style={{padding:16,border:"1px solid rgba(20,55,100,.10)",borderRadius:16,background:"#f8fbff"}}><small style={{textTransform:"uppercase",opacity:.6}}>{k.replaceAll("_"," ")}</small><div style={{fontWeight:700,marginTop:5,wordBreak:"break-word"}}>{String(v)}</div></div>)}</div>
      </div>
    </div>}

    {data&&module==="attendance"&&<div className="panel"><div className="panelTitle"><b>Attendance</b><span>Live records</span></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Subject</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th>Percentage</th></tr></thead><tbody>{data.rows?.map((r,i)=><tr key={i}><td>{r.subject?.code} — {r.subject?.name}</td><td>{r.present||0}</td><td>{r.absent||0}</td><td>{r.late||0}</td><td>{r.total}</td><td>{r.total?Math.round((r.present||0)/r.total*100):0}%</td></tr>)}</tbody></table></div></div>}

    {data&&module==="timetable"&&<div className="panel"><div className="panelTitle"><b>Timetable</b></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Faculty</th><th>Room</th></tr></thead><tbody>{data.rows?.map(r=><tr key={r.id}><td>{days[r.dayOfWeek]||r.dayOfWeek}</td><td>{r.startTime} – {r.endTime}</td><td>{r.subject?.code} — {r.subject?.name}</td><td>{r.faculty?.name}</td><td>{r.room?.code||"—"}</td></tr>)}</tbody></table></div></div>}

    {data&&module==="subjects"&&<div className="panel"><div className="panelTitle"><b>My Subjects</b></div><div className="quick">{data.rows?.map(r=><div key={r.id} className="panel"><b>{r.code} — {r.name}</b><span>{r.type||"Subject"} • {r.credits??"—"} credits</span></div>)}</div></div>}

    {data&&module==="results"&&<div className="panel"><div className="panelTitle"><b>Results</b></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Status</th></tr></thead><tbody>{data.rows?.map(r=><tr key={r.id}><td>{r.exam?.name}</td><td>{r.subject?.code} — {r.subject?.name}</td><td>{r.marks??"—"}</td><td>{r.grade||"—"}</td><td>{r.status}</td></tr>)}</tbody></table></div></div>}

    {data&&module==="fees"&&<div className="panel"><div className="panelTitle"><b>Fees & Payments</b><span>Live ledger</span></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Student</th><th>Fee</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>{data.rows?.map(r=><tr key={r.id}><td>{r.student?.name||"My Account"}</td><td>{r.feeStructure?.name}</td><td>₹{Number(r.amountDue)}</td><td>₹{Number(r.amountPaid)}</td><td>₹{Number(r.amountDue)-Number(r.amountPaid)}</td><td>{r.status}</td></tr>)}</tbody></table></div></div>}

    {data&&module==="examination"&&<div className="panel"><div className="panelTitle"><b>Exam Schedule</b></div><div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th>Exam</th><th>Subject</th><th>Date</th><th>Time</th><th>Room</th></tr></thead><tbody>{data.rows?.map(r=><tr key={r.id}><td>{r.exam?.name}</td><td>{r.subject?.code} — {r.subject?.name}</td><td>{new Date(r.date).toLocaleDateString("en-IN")}</td><td>{r.startTime} – {r.endTime}</td><td>{r.room?.code||"—"}</td></tr>)}</tbody></table></div></div>}
  </main>;
}

export default function PortalPage(){return <Suspense fallback={<main className="content" style={{padding:32}}>Loading…</main>}><PortalView/></Suspense>}
