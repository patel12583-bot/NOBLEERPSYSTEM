"use client";
import {useEffect,useMemo,useState} from "react";

const fmt=d=>d?new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
const inputDate=d=>d?new Date(d).toISOString().slice(0,10):"";
const badge=s=>s==="APPROVED"?"ok":s==="REJECTED"?"bad":s==="CANCELLED"?"muted":"pending";

export default function LeavePage(){
  const [me,setMe]=useState(null),[data,setData]=useState({studentLeaves:[],facultyLeaves:[]}),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
  const [fromDate,setFrom]=useState(""),[toDate,setTo]=useState(""),[reason,setReason]=useState(""),[filter,setFilter]=useState("ALL"),[msg,setMsg]=useState("");
  const admin=me&&["SUPER_ADMIN","ADMIN","HOD"].includes(me.role);
  async function load(){
    setLoading(true); const r=await fetch("/api/auth/me"); const m=await r.json(); setMe(m.user);
    const lr=await fetch("/api/admin/leave"+(filter!=="ALL"?"?status="+filter:"")); const d=await lr.json(); setData(d); setLoading(false);
  }
  useEffect(()=>{load()},[filter]);
  async function apply(e){
    e.preventDefault(); setSaving(true); setMsg("");
    const r=await fetch("/api/admin/leave",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fromDate,toDate,reason})});
    const d=await r.json(); setMsg(r.ok?"Leave application submitted successfully.":d.error||"Unable to submit."); setSaving(false);
    if(r.ok){setFrom("");setTo("");setReason("");load();}
  }
  async function action(id,type,action){
    const r=await fetch("/api/admin/leave",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,type,action})});
    if(!r.ok){const d=await r.json();alert(d.error||"Update failed");return;} load();
  }
  const rows=useMemo(()=>[
    ...data.studentLeaves.map(x=>({...x,type:"STUDENT",person:x.student?.name||"Student",code:x.student?.studentId||"",dept:x.student?.department?.name||"—"})),
    ...data.facultyLeaves.map(x=>({...x,type:"FACULTY",person:x.faculty?.name||"Faculty",code:x.faculty?.facultyId||"",dept:x.faculty?.department?.name||"—"}))
  ],[data]);
  return <main className="dash"><section className="content" style={{width:"100%"}}>
    <header><div><div className="eyebrow">NOBLE GROUP OF INSTITUTES</div><h1>Leave Management</h1><p>{admin?"Review and approve student & faculty leave requests.":"Apply for leave and track your requests."}</p></div><div className="avatar">{(me?.username||"U").slice(0,1).toUpperCase()}</div></header>
    {!admin&&<form className="panel" onSubmit={apply} style={{padding:24,marginBottom:20}}><div className="panelTitle"><b>Apply for Leave</b><span>New request</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:14}}><label>From<input type="date" value={fromDate} onChange={e=>setFrom(e.target.value)} required/></label><label>To<input type="date" value={toDate} onChange={e=>setTo(e.target.value)} required/></label></div><label>Reason<textarea value={reason} onChange={e=>setReason(e.target.value)} rows={4} placeholder="Enter reason..." required/></label><button className="primaryBtn" disabled={saving}>{saving?"Submitting…":"Submit Leave Application"}</button>{msg&&<p>{msg}</p>}</form>}
    <div className="panel" style={{padding:20}}><div className="panelTitle"><b>{admin?"Leave Requests":"My Leave History"}</b><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">All Status</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="CANCELLED">Cancelled</option></select></div>
    {loading?<p>Loading…</p>:rows.length===0?<div className="emptyState"><strong>No leave records</strong><p>There are no matching leave requests.</p></div>:<div style={{overflowX:"auto"}}><table><thead><tr><th>Person</th><th>Type</th><th>Department</th><th>From</th><th>To</th><th>Reason</th><th>Status</th>{admin&&<th>Action</th>}{!admin&&<th>Action</th>}</tr></thead><tbody>{rows.map(x=><tr key={x.type+x.id}><td><b>{x.person}</b><br/><small>{x.code}</small></td><td>{x.type}</td><td>{x.dept}</td><td>{fmt(x.fromDate)}</td><td>{fmt(x.toDate)}</td><td>{x.reason}</td><td><span className={"status "+badge(x.status)}>{x.status}</span></td><td>{admin&&x.status==="PENDING"&&<><button onClick={()=>action(x.id,x.type,"approve")}>Approve</button> <button onClick={()=>action(x.id,x.type,"reject")}>Reject</button></>}{!admin&&x.status==="PENDING"&&<button onClick={()=>action(x.id,x.type,"cancel")}>Cancel</button>}</td></tr>)}</tbody></table></div>}</div>
  </section></main>
}