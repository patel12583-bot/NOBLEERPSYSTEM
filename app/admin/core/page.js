"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ModuleHeader from "@/components/ModuleHeader";

const configs={
 departments:{title:"Departments",fields:[["code","Department Code","text"],["name","Department Name","text"],["hodId","HOD Faculty ID","text"],["description","Description","text"],["status","Status","text"]]},
 programs:{title:"Course Management",fields:[["code","Course Code","text"],["name","Course Name","text"],["departmentId","Department","text"],["durationYears","Duration (Years)","number"],["totalSemesters","Total Semesters","number"],["fees","Fees","number"],["description","Description","text"],["status","Status","text"]]},
 academicYears:{title:"Academic Years",fields:[["name","Academic Year","text"],["startDate","Start Date","date"],["endDate","End Date","date"],["active","Active","checkbox"]]},
 semesters:{title:"Semesters",fields:[["number","Semester Number","number"],["name","Semester Name","text"],["academicYearId","Academic Year ID","text"]]},
 divisions:{title:"Divisions",fields:[["name","Division Name","text"],["capacity","Capacity","number"],["programId","Program ID","text"],["semesterId","Semester ID","text"]]},
 rooms:{title:"Rooms / Labs",fields:[["code","Room Code","text"],["name","Room Name","text"],["capacity","Capacity","number"],["type","Type","text"]]},
 subjects:{title:"Subject Management",fields:[["name","Subject Name","text"],["code","Subject Code","text"],["departmentId","Department","text"],["programId","Course","text"],["semesterId","Semester","text"],["credits","Credits","number"],["facultyId","Faculty","text"],["status","Status","text"]]},
 books:{title:"Library Books",fields:[["isbn","ISBN","text"],["title","Book Title","text"],["author","Author","text"],["category","Category","text"],["quantity","Quantity","number"],["available","Available","number"]]},
 notices:{title:"Notices",fields:[["title","Title","text"],["content","Content","text"],["audience","Audience","text"],["published","Published","checkbox"]]}
};

function CoreAdminContent(){
 const params=useSearchParams();
 const module=params.get("module")||"departments";
 const cfg=configs[module]||configs.departments;
 const [rows,setRows]=useState([]),[form,setForm]=useState({}),[editing,setEditing]=useState(null),[viewing,setViewing]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[query,setQuery]=useState(""),[faculty,setFaculty]=useState([]),[departments,setDepartments]=useState([]),[programs,setPrograms]=useState([]),[semesters,setSemesters]=useState([]);
 async function load(){setLoading(true);try{const r=await fetch("/api/admin/core?module="+module);const d=await r.json();if(r.ok){setRows(d.rows||[]);if(module==="departments")setFaculty(d.faculty||[]);if(module==="programs"||module==="subjects")setDepartments(d.departments||[]);if(module==="subjects"){setPrograms(d.programs||[]);setSemesters(d.semesters||[]);setFaculty(d.faculty||[])}}else setError(d.error||"Unable to load.")}catch(e){setError("Unable to load records. Please retry.")}finally{setLoading(false)}}
 useEffect(()=>{setForm({});setEditing(null);setViewing(null);load()},[module]);
 const filtered=useMemo(()=>rows.filter(row=>JSON.stringify(row).toLowerCase().includes(query.toLowerCase())),[rows,query]);
 function edit(row){setEditing(row.id);setForm({...row,facultyId:row.facultySubjects?.[0]?.facultyId||""})}
 function change(k,v){setForm(x=>({...x,[k]:v}))}
 async function save(e){e.preventDefault();setSaving(true);setError("");try{const r=await fetch("/api/admin/core",{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({module,id:editing,data:form})});const d=await r.json();if(!r.ok)throw new Error(d.error);setForm({});setEditing(null);await load()}catch(e){setError(e.message)}finally{setSaving(false)}}
 async function remove(id){if(!confirm("Delete this record?"))return;const r=await fetch("/api/admin/core",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({module,id})});const d=await r.json();if(!r.ok)setError(d.error);else load()}
 return <main className="content" style={{padding:"32px",maxWidth:"1250px"}}>
  <ModuleHeader eyebrow={"NOBLE ERP • MANAGEMENT"} title={cfg.title} description="Create, edit, search and manage live database records from one modern workspace." />
  <form onSubmit={save} style={{margin:"24px 0",padding:"20px",border:"1px solid #ddd",borderRadius:"18px",display:"grid",gap:"14px"}}>
   <b>{editing?"Edit record":"Add new record"}</b>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:"14px"}}>
    {cfg.fields.map(([key,label,type])=><label key={key} style={{display:"grid",gap:6}}>{label}{module==="departments"&&key==="hodId"?<select value={form[key]??""} onChange={e=>change(key,e.target.value)}><option value="">No HOD assigned</option>{faculty.map(f=><option key={f.id} value={f.id}>{f.name} — {f.facultyId}</option>)}</select>:(module==="programs"||module==="subjects")&&key==="departmentId"?<select required value={form[key]??""} onChange={e=>{change(key,e.target.value);if(module==="subjects")change("programId","")}}><option value="">Select department</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}</select>:module==="subjects"&&key==="programId"?<select required value={form[key]??""} onChange={e=>change(key,e.target.value)}><option value="">Select course</option>{programs.filter(p=>!form.departmentId||p.departmentId===form.departmentId).map(p=><option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}</select>:module==="subjects"&&key==="semesterId"?<select required value={form[key]??""} onChange={e=>change(key,e.target.value)}><option value="">Select semester</option>{semesters.filter(s=>{const p=programs.find(x=>x.id===form.programId);return !p||s.number<=p.totalSemesters}).map(s=><option key={s.id} value={s.id}>{s.name||("Semester "+s.number)}</option>)}</select>:module==="subjects"&&key==="facultyId"?<select value={form[key]??""} onChange={e=>change(key,e.target.value)}><option value="">No faculty assigned</option>{faculty.filter(f=>!form.departmentId||!f.departmentId||f.departmentId===form.departmentId).map(f=><option key={f.id} value={f.id}>{f.name} — {f.facultyId}</option>)}</select>:(module==="departments"||module==="programs"||module==="subjects")&&key==="status"?<select value={form[key]??"ACTIVE"} onChange={e=>change(key,e.target.value)}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select>:type==="checkbox"?<input type="checkbox" checked={Boolean(form[key])} onChange={e=>change(key,e.target.checked)}/>:<input type={type} value={form[key]??""} onChange={e=>change(key,e.target.value)} required={!["capacity","credits","type","isbn","author","category","available","hodId","description","fees","facultyId"].includes(key)}/>}</label>)}
   </div>
   {error&&<div className="error">{error}</div>}
   <div><button className="primary" disabled={saving}>{saving?"Saving…":editing?"Update Record →":"Add Record →"}</button>{editing&&<button type="button" className="back" onClick={()=>{setEditing(null);setForm({})}}>Cancel</button>}</div>
  </form>
  {viewing&&<div className="panel" style={{marginBottom:20,padding:20}}><div className="panelTitle"><b>View {cfg.title.replace(/s$/,"")} Details</b><button type="button" onClick={()=>setViewing(null)}>Close</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14}}>{cfg.fields.map(([key,label])=><div key={key}><small style={{color:"#64748b"}}>{label}</small><div style={{fontWeight:600,overflowWrap:"anywhere"}}>{key==="facultyId"?(viewing.facultySubjects?.map(fs=>fs.faculty?.name).filter(Boolean).join(", ")||"Unassigned"):key==="departmentId"?(viewing.department?.name||departments.find(d=>d.id===viewing.departmentId)?.name||viewing.departmentId||"—"):key==="programId"?(viewing.program?.name||programs.find(p=>p.id===viewing.programId)?.name||viewing.programId||"—"):key==="semesterId"?(viewing.semester?.name||("Semester "+(viewing.semester?.number||""))):key==="fees"?(viewing.fees==null?"—":Number(viewing.fees).toLocaleString("en-IN",{style:"currency",currency:"INR"})):key==="hodId"?(viewing.hod?.name||"Unassigned"):String(viewing[key]??"—")}</div></div>)}</div></div>}
  <div className="panel"><div className="panelTitle"><b>Records</b><input placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)} /></div>
   {loading?<p>Loading…</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{cfg.fields.map(x=><th key={x[0]} style={{textAlign:"left",padding:"10px"}}>{x[1]}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map(row=><tr key={row.id}>{cfg.fields.map(([key])=><td key={key} style={{padding:"10px",borderTop:"1px solid #eee"}}>{key==="hodId"?(row.hod?.name||"Unassigned"):key==="facultyId"?(row.facultySubjects?.map(fs=>fs.faculty?.name).filter(Boolean).join(", ")||"Unassigned"):key==="departmentId"?(row.department?.name||departments.find(d=>d.id===row.departmentId)?.name||row.departmentId||""):key==="programId"?(row.program?.name||programs.find(p=>p.id===row.programId)?.name||row.programId||""):key==="semesterId"?(row.semester?.name||("Semester "+(row.semester?.number||""))):key==="fees"?(row.fees==null?"—":Number(row.fees).toLocaleString("en-IN",{style:"currency",currency:"INR"})):String(row[key]??"")}</td>)}<td style={{padding:"10px",borderTop:"1px solid #eee"}}><button onClick={()=>setViewing(row)}>View</button>{" "}<button onClick={()=>edit(row)}>Edit</button>{" "}<button onClick={()=>remove(row.id)}>Delete</button></td></tr>)}</tbody></table></div>}
  </div>
 </main>
}


export default function CoreAdminPage(){
 return <Suspense fallback={<main className="content" style={{padding:"32px"}}><p>Loading management module…</p></main>}><CoreAdminContent/></Suspense>;
}
