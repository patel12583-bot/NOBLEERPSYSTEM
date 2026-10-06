"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const configs={
 departments:{title:"Departments",fields:[["code","Department Code","text"],["name","Department Name","text"]]},
 programs:{title:"Programs",fields:[["code","Program Code","text"],["name","Program Name","text"],["durationYears","Duration (Years)","number"],["departmentId","Department ID","text"]]},
 academicYears:{title:"Academic Years",fields:[["name","Academic Year","text"],["startDate","Start Date","date"],["endDate","End Date","date"],["active","Active","checkbox"]]},
 semesters:{title:"Semesters",fields:[["number","Semester Number","number"],["name","Semester Name","text"],["academicYearId","Academic Year ID","text"]]},
 divisions:{title:"Divisions",fields:[["name","Division Name","text"],["capacity","Capacity","number"],["programId","Program ID","text"],["semesterId","Semester ID","text"]]},
 rooms:{title:"Rooms / Labs",fields:[["code","Room Code","text"],["name","Room Name","text"],["capacity","Capacity","number"],["type","Type","text"]]},
 subjects:{title:"Subjects",fields:[["code","Subject Code","text"],["name","Subject Name","text"],["credits","Credits","number"],["type","Type","text"],["departmentId","Department ID","text"],["programId","Program ID","text"],["semesterId","Semester ID","text"]]},
 books:{title:"Library Books",fields:[["isbn","ISBN","text"],["title","Book Title","text"],["author","Author","text"],["category","Category","text"],["quantity","Quantity","number"],["available","Available","number"]]},
 notices:{title:"Notices",fields:[["title","Title","text"],["content","Content","text"],["audience","Audience","text"],["published","Published","checkbox"]]}
};

function CoreAdminContent(){
 const params=useSearchParams();
 const module=params.get("module")||"departments";
 const cfg=configs[module]||configs.departments;
 const [rows,setRows]=useState([]),[form,setForm]=useState({}),[editing,setEditing]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[query,setQuery]=useState("");
 async function load(){setLoading(true);const r=await fetch("/api/admin/core?module="+module);const d=await r.json();if(r.ok)setRows(d.rows||[]);else setError(d.error||"Unable to load.");setLoading(false)}
 useEffect(()=>{setForm({});setEditing(null);load()},[module]);
 const filtered=useMemo(()=>rows.filter(row=>JSON.stringify(row).toLowerCase().includes(query.toLowerCase())),[rows,query]);
 function edit(row){setEditing(row.id);setForm({...row})}
 function change(k,v){setForm(x=>({...x,[k]:v}))}
 async function save(e){e.preventDefault();setSaving(true);setError("");try{const r=await fetch("/api/admin/core",{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({module,id:editing,data:form})});const d=await r.json();if(!r.ok)throw new Error(d.error);setForm({});setEditing(null);await load()}catch(e){setError(e.message)}finally{setSaving(false)}}
 async function remove(id){if(!confirm("Delete this record?"))return;const r=await fetch("/api/admin/core",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({module,id})});const d=await r.json();if(!r.ok)setError(d.error);else load()}
 return <main className="content" style={{padding:"32px",maxWidth:"1250px"}}>
  <div className="eyebrow">NOBLE ERP • MANAGEMENT</div><div style={{display:"flex",justifyContent:"flex-end",marginBottom:"12px"}}><button type="button" className="back" onClick={()=>{if(window.history.length>1)window.history.back();else window.location.href="/dashboard"}}>← Back to Dashboard</button></div><h1>{cfg.title}</h1><p>Create, edit, search and manage live database records.</p>
  <form onSubmit={save} style={{margin:"24px 0",padding:"20px",border:"1px solid #ddd",borderRadius:"18px",display:"grid",gap:"14px"}}>
   <b>{editing?"Edit record":"Add new record"}</b>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:"14px"}}>
    {cfg.fields.map(([key,label,type])=><label key={key}>{label}{type==="checkbox"?<input type="checkbox" checked={Boolean(form[key])} onChange={e=>change(key,e.target.checked)}/>:<input type={type} value={form[key]??""} onChange={e=>change(key,e.target.value)} required={!["capacity","credits","type","isbn","author","category","available"].includes(key)}/>}</label>)}
   </div>
   {error&&<div className="error">{error}</div>}
   <div><button className="primary" disabled={saving}>{saving?"Saving…":editing?"Update Record →":"Add Record →"}</button>{editing&&<button type="button" className="back" onClick={()=>{setEditing(null);setForm({})}}>Cancel</button>}</div>
  </form>
  <div className="panel"><div className="panelTitle"><b>Records</b><input placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} /></div>
   {loading?<p>Loading…</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{cfg.fields.map(x=><th key={x[0]} style={{textAlign:"left",padding:"10px"}}>{x[1]}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map(row=><tr key={row.id}>{cfg.fields.map(([key])=><td key={key} style={{padding:"10px",borderTop:"1px solid #eee"}}>{String(row[key]??"")}</td>)}<td style={{padding:"10px",borderTop:"1px solid #eee"}}><button onClick={()=>edit(row)}>Edit</button>{" "}<button onClick={()=>remove(row.id)}>Delete</button></td></tr>)}</tbody></table></div>}
  </div>
 </main>
}


export default function CoreAdminPage(){
 return <Suspense fallback={<main className="content" style={{padding:"32px"}}><p>Loading management module…</p></main>}><CoreAdminContent/></Suspense>;
}
