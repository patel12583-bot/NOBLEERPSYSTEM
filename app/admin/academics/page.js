import ModuleHeader from "@/components/ModuleHeader";
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const tabs=[
 {key:"departments",label:"Departments",fields:[["code","Code"],["name","Department Name"]]},
 {key:"programs",label:"Programs",fields:[["code","Code"],["name","Program Name"],["durationYears","Duration (Years)"],["departmentId","Department"]]},
 {key:"academicYears",label:"Academic Years",fields:[["name","Academic Year"],["startDate","Start Date"],["endDate","End Date"],["active","Active"]]},
 {key:"semesters",label:"Semesters",fields:[["number","Semester No."],["name","Semester Name"],["academicYearId","Academic Year"]]},
 {key:"divisions",label:"Divisions",fields:[["name","Division Name"],["capacity","Capacity"],["programId","Program"],["semesterId","Semester"]]},
 {key:"subjects",label:"Subjects",fields:[["code","Code"],["name","Subject Name"],["credits","Credits"],["type","Type"],["departmentId","Department"],["programId","Program"],["semesterId","Semester"]]}
];

const blank={};
function AcademicPage(){
 const router=useRouter();
 const [tab,setTab]=useState("departments"),[data,setData]=useState({}),[form,setForm]=useState({}),[editing,setEditing]=useState(null),[q,setQ]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const cfg=tabs.find(x=>x.key===tab)||tabs[0];
 async function load(key){
  const r=await fetch("/api/admin/core?module="+key,{cache:"no-store"});
  const d=await r.json();
  if(r.ok)setData(x=>({...x,[key]:d.rows||[]})); else setError(d.error||"Unable to load "+key);
 }
 useEffect(()=>{tabs.forEach(x=>load(x.key));},[]);
 useEffect(()=>{setForm({});setEditing(null);setError("");},[tab]);
 const rows=useMemo(()=>((data[tab]||[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))),[data,tab,q]);
 const list=(key)=>data[key]||[];
 const label=(key,id)=>{
  const r=list(key).find(x=>x.id===id); return r ? (r.name||r.code||r.title||id) : "—";
 };
 function valueFor(k){
  if(k==="active") return Boolean(form[k]);
  return form[k]??"";
 }
 function input(k,labelText){
  if(k==="departmentId") return <select value={valueFor(k)} onChange={e=>setForm({...form,[k]:e.target.value})} required><option value="">Select Department</option>{list("departments").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  if(k==="programId") return <select value={valueFor(k)} onChange={e=>setForm({...form,[k]:e.target.value})} required><option value="">Select Program</option>{list("programs").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  if(k==="semesterId") return <select value={valueFor(k)} onChange={e=>setForm({...form,[k]:e.target.value})} required><option value="">Select Semester</option>{list("semesters").map(x=><option key={x.id} value={x.id}>{x.number} — {x.name}</option>)}</select>;
  if(k==="academicYearId") return <select value={valueFor(k)} onChange={e=>setForm({...form,[k]:e.target.value})} required><option value="">Select Academic Year</option>{list("academicYears").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  if(k==="active") return <input type="checkbox" checked={Boolean(form[k])} onChange={e=>setForm({...form,[k]:e.target.checked})}/>;
  const type=["startDate","endDate"].includes(k)?"date":["durationYears","number","capacity","credits"].includes(k)?"number":"text";
  return <input type={type} value={valueFor(k)} onChange={e=>setForm({...form,[k]:e.target.value})} required={["code","name","number","durationYears"].includes(k)}/>;
 }
 async function save(e){
  e.preventDefault();setBusy(true);setError("");
  try{
   const r=await fetch("/api/admin/core",{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({module:tab,id:editing,data:form})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Save failed");
   setForm({});setEditing(null);await load(tab);
  }catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function remove(id){
  if(!confirm("Delete this record? Linked records may prevent deletion."))return;
  const r=await fetch("/api/admin/core",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({module:tab,id})});
  const d=await r.json();if(!r.ok)setError(d.error||"Delete failed");else load(tab);
 }
 function edit(r){const x={...r};["startDate","endDate"].forEach(k=>{if(x[k])x[k]=new Date(x[k]).toISOString().slice(0,10)});setForm(x);setEditing(r.id);window.scrollTo({top:0,behavior:"smooth"});}
 return <main className="content" style={{padding:"30px",maxWidth:"1400px"}}>
  <ModuleHeader eyebrow="NOBLE ERP • ACADEMIC MANAGEMENT" title="Academic Management" description="Build the academic structure once and reuse it across students, timetable, attendance and examinations." />
  <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"24px 0"}}>{tabs.map(t=><button key={t.key} className={tab===t.key?"primary":"back"} onClick={()=>setTab(t.key)}>{t.label}</button>)}</div>
  <form onSubmit={save} style={{padding:22,border:"1px solid #ddd",borderRadius:18,display:"grid",gap:16,marginBottom:24}}>
   <b>{editing?"Edit ":"Add "}{cfg.label}</b>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14}}>
    {cfg.fields.map(([k,l])=><label key={k}>{l}{input(k,l)}</label>)}
   </div>
   {error&&<div className="error">{error}</div>}
   <div><button className="primary" disabled={busy}>{busy?"Saving…":editing?"Update →":"Create →"}</button>{editing&&<button type="button" className="back" onClick={()=>{setEditing(null);setForm({})}}>Cancel</button>}</div>
  </form>
  <div className="panel"><div className="panelTitle"><b>{cfg.label}</b><input placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)}/></div>
   <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{cfg.fields.map(([k,l])=><th key={k} style={{textAlign:"left",padding:10}}>{l}</th>)}<th>Actions</th></tr></thead>
   <tbody>{rows.map(r=><tr key={r.id}>{cfg.fields.map(([k])=><td key={k} style={{padding:10,borderTop:"1px solid #eee"}}>{k==="departmentId"?label("departments",r[k]):k==="programId"?label("programs",r[k]):k==="semesterId"?label("semesters",r[k]):k==="academicYearId"?label("academicYears",r[k]):k==="active"?(r[k]?"Active":"Inactive"):String(r[k]??"")}</td>)}<td style={{padding:10,borderTop:"1px solid #eee"}}><button onClick={()=>edit(r)}>Edit</button>{" "}<button onClick={()=>remove(r.id)}>Delete</button></td></tr>)}</tbody></table></div>
  </div>
  <button className="back" style={{marginTop:18}} onClick={()=>router.push("/dashboard")}>← Back to Dashboard</button>
 </main>
}
export default AcademicPage;
