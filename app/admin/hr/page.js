"use client";
import ModuleHeader from "@/components/ModuleHeader";
import {useEffect,useMemo,useState} from "react";

const empty={facultyId:"",month:new Date().toISOString().slice(0,7),basic:"",allowances:"0",deductions:"0"};

export default function HRPage(){
 const [staff,setStaff]=useState([]),[payroll,setPayroll]=useState([]),[form,setForm]=useState(empty),[q,setQ]=useState(""),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
 async function load(){const r=await fetch("/api/admin/hr",{cache:"no-store"});const d=await r.json();if(!r.ok)return setErr(d.error);setStaff(d.staff||[]);setPayroll(d.payroll||[]);}
 useEffect(()=>{load()},[]);
 const filtered=useMemo(()=>staff.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())),[staff,q]);
 const set=(k,v)=>setForm(x=>({...x,[k]:v}));
 async function process(e){e.preventDefault();setBusy(true);setErr("");try{const r=await fetch("/api/admin/hr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw Error(d.error);setForm(empty);await load();}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function remove(id){if(!confirm("Delete this payroll record?"))return;const r=await fetch("/api/admin/hr",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});const d=await r.json();if(!r.ok)setErr(d.error);else load();}
 return <main className="content" style={{padding:"32px",maxWidth:"1400px"}}><ModuleHeader eyebrow="NOBLE ERP • HR & PAYROLL" title="HR & Staff Management" description="Staff directory, salary processing, payroll history and department-wise records." />
  
  {err&&<div className="error" style={{margin:"16px 0"}}>{err}</div>}
  <div className="statGrid" style={{marginTop:22}}>
   <div><small>ACTIVE STAFF</small><b>{staff.length}</b><span>Faculty & staff master records</span></div>
   <div><small>PAYROLL RECORDS</small><b>{payroll.length}</b><span>Processed salary entries</span></div>
   <div><small>THIS MONTH</small><b>{payroll.filter(x=>x.month===form.month).length}</b><span>Processed for selected month</span></div>
   <div><small>STATUS</small><b>LIVE</b><span>Connected to ERP database</span></div>
  </div>
  <div className="panel" style={{marginTop:20}}>
   <div className="panelTitle"><b>Process Monthly Payroll</b><span>Basic + allowances − deductions</span></div>
   <form onSubmit={process} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,padding:18}}>
    <label>Staff<select required value={form.facultyId} onChange={e=>set("facultyId",e.target.value)}><option value="">Select staff</option>{staff.map(x=><option key={x.id} value={x.id}>{x.facultyId} — {x.name}</option>)}</select></label>
    <label>Month<input required type="month" value={form.month} onChange={e=>set("month",e.target.value)}/></label>
    <label>Basic Salary<input required type="number" min="0" step="0.01" value={form.basic} onChange={e=>set("basic",e.target.value)}/></label>
    <label>Allowances<input type="number" min="0" step="0.01" value={form.allowances} onChange={e=>set("allowances",e.target.value)}/></label>
    <label>Deductions<input type="number" min="0" step="0.01" value={form.deductions} onChange={e=>set("deductions",e.target.value)}/></label>
    <div style={{display:"flex",alignItems:"end"}}><button className="primary" disabled={busy}>{busy?"Processing…":"Process Payroll →"}</button></div>
   </form>
  </div>
  <div className="panel" style={{marginTop:20}}>
   <div className="panelTitle"><b>Staff Directory ({filtered.length})</b><input placeholder="Search staff…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr>{["ID","Name","Department","Designation","Email","Status"].map(x=><th key={x} style={{textAlign:"left",padding:10}}>{x}</th>)}</tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td>{x.facultyId}</td><td>{x.name}</td><td>{x.department?.name||"—"}</td><td>{x.designation||"—"}</td><td>{x.email||"—"}</td><td>{x.status}</td></tr>)}</tbody></table></div>
  </div>
  <div className="panel" style={{marginTop:20}}>
   <div className="panelTitle"><b>Payroll History</b><button onClick={()=>window.print()}>Print / Save PDF</button></div>
   <div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr>{["Month","Staff","Department","Basic","Allowances","Deductions","Net","Status","Action"].map(x=><th key={x} style={{textAlign:"left",padding:10}}>{x}</th>)}</tr></thead><tbody>{payroll.map(x=><tr key={x.auditId}><td>{x.month}</td><td>{x.facultyIdCode} — {x.name}</td><td>{x.department||"—"}</td><td>₹{Number(x.basic||0).toLocaleString("en-IN")}</td><td>₹{Number(x.allowances||0).toLocaleString("en-IN")}</td><td>₹{Number(x.deductions||0).toLocaleString("en-IN")}</td><td><b>₹{Number(x.net||0).toLocaleString("en-IN")}</b></td><td>{x.status}</td><td><button onClick={()=>remove(x.auditId)}>Delete</button></td></tr>)}</tbody></table></div>
  </div>
 </main>
}
