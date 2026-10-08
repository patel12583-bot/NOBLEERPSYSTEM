"use client";

import ModuleHeader from "@/components/ModuleHeader";

import {useEffect,useState} from "react";

export default function DocumentsPage(){
 const [students,setStudents]=useState([]),[docs,setDocs]=useState([]),[studentId,setStudentId]=useState(""),[file,setFile]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[err,setErr]=useState("");
 async function load(){
  const [s,d]=await Promise.all([fetch("/api/admin/students"),fetch("/api/admin/documents")]);
  const sj=await s.json(),dj=await d.json();
  if(s.ok)setStudents(sj.students||[]); else setErr(sj.error||"Unable to load students.");
  if(d.ok)setDocs(dj.documents||[]); else setErr(dj.error||"Unable to load documents.");
 }
 useEffect(()=>{load()},[]);
 async function upload(e){
  e.preventDefault();setBusy(true);setErr("");setMsg("");
  try{
   const fd=new FormData();fd.append("studentId",studentId);fd.append("file",file);
   const r=await fetch("/api/admin/documents",{method:"POST",body:fd});const d=await r.json();
   if(!r.ok)throw new Error(d.error);setMsg("File uploaded successfully.");setFile(null);e.target.reset();await load();
  }catch(x){setErr(x.message)}finally{setBusy(false)}
 }
 async function remove(id){
  if(!confirm("Delete this document record?"))return;
  const r=await fetch("/api/admin/documents",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
  const d=await r.json();if(!r.ok)setErr(d.error);else load();
 }
 return <main className="content" style={{padding:32,maxWidth:1350}}>
  <ModuleHeader eyebrow="NOBLE ERP • DOCUMENTS" title="Student Documents" description="Upload, view and manage official student documents from one secure workspace." />
  {err&&<div className="error" style={{margin:"16px 0"}}>{err}</div>}{msg&&<div className="panel" style={{margin:"16px 0"}}>{msg}</div>}
  <form className="panel" onSubmit={upload} style={{padding:22,margin:"20px 0"}}>
   <b>Upload Document</b><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14,marginTop:14}}>
    <label>Student<select value={studentId} onChange={e=>setStudentId(e.target.value)} required><option value="">Select student</option>{students.map(s=><option key={s.id} value={s.id}>{s.studentId} — {s.name}</option>)}</select></label>
    <label>File<input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" onChange={e=>setFile(e.target.files?.[0]||null)} required/></label>
   </div><small>Maximum 10 MB. Vercel Blob is preferred; small files can use the ERP database fallback when Blob is not configured.</small><br/><button className="primary" disabled={busy||!file}>{busy?"Uploading…":"Upload File →"}</button>
  </form>
  <div className="panel"><b>Uploaded Documents ({docs.length})</b><div style={{overflowX:"auto",marginTop:12}}><table><thead><tr><th>Student</th><th>File</th><th>Type</th><th>Uploaded</th><th>Actions</th></tr></thead><tbody>{docs.map(d=><tr key={d.id}><td>{d.student?.studentId} — {d.student?.name}</td><td>{d.name}</td><td>{d.type}</td><td>{new Date(d.createdAt).toLocaleString()}</td><td><a href={d.url} target="_blank" rel="noreferrer">View / Download</a>{" "}<button onClick={()=>remove(d.id)}>Delete</button></td></tr>)}</tbody></table></div></div>
 </main>
}