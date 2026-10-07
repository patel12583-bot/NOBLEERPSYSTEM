"use client";

import ModuleHeader from "@/components/ModuleHeader";


import { useEffect, useMemo, useState } from "react";

const empty={studentId:"",enrollmentNo:"",admissionNo:"",name:"",email:"",mobile:"",dob:"",gender:"",address:"",departmentId:"",programId:"",semesterId:"",divisionId:"",academicYearId:"",status:"ACTIVE"};

export default function StudentsPage(){
 const [rows,setRows]=useState([]),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[options,setOptions]=useState({departments:[],programs:[],semesters:[],divisions:[],academicYears:[]}),[query,setQuery]=useState(""),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[credentials,setCredentials]=useState(null),[bulk,setBulk]=useState(null),[bulkBusy,setBulkBusy]=useState(false);

 async function load(){
  setLoading(true); setError("");
  try{
   const s=await fetch("/api/admin/students"); const sd=await s.json(); if(!s.ok) throw new Error(sd.error);
   setRows(sd.students||[]);
   const keys=["departments","programs","semesters","divisions","academicYears"];
   const results=await Promise.all(keys.map(k=>fetch("/api/admin/core?module="+k).then(r=>r.json())));
   setOptions(Object.fromEntries(keys.map((k,i)=>[k,results[i].rows||[]])));
  }catch(e){setError(e.message)} finally{setLoading(false)}
 }
 useEffect(()=>{load()},[]);

 const filtered=useMemo(()=>rows.filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase())),[rows,query]);
 const set=(k,v)=>setForm(x=>({...x,[k]:v}));

 async function save(e){
  e.preventDefault(); setSaving(true); setError(""); setCredentials(null);
  try{
   const r=await fetch("/api/admin/students",{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?{id:editing,data:form}:{data:form})});
   const d=await r.json(); if(!r.ok) throw new Error(d.error);
   if(d.credentials) setCredentials(d.credentials);
   setForm(empty);setEditing(null);await load();
  }catch(e){setError(e.message)}finally{setSaving(false)}
 }
 async function deactivate(id){
  if(!confirm("Deactivate this student account?"))return;
  const r=await fetch("/api/admin/students",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
  const d=await r.json(); if(!r.ok)setError(d.error); else load();
 }
 function edit(r){
  setEditing(r.id);
  setForm({studentId:r.studentId,enrollmentNo:r.enrollmentNo||"",admissionNo:r.admissionNo||"",name:r.name,email:r.email||"",mobile:r.mobile||"",dob:r.dob?r.dob.slice(0,10):"",gender:r.gender||"",address:r.address||"",departmentId:r.departmentId||"",programId:r.programId||"",semesterId:r.semesterId||"",divisionId:r.divisionId||"",academicYearId:r.academicYearId||"",status:r.status});
  window.scrollTo({top:0,behavior:"smooth"});
 }
 function csvParse(text){
  const rows=[]; let row=[], cell="", quoted=false;
  for(let i=0;i<text.length;i++){
   const ch=text[i], next=text[i+1];
   if(ch === '"'){ if(quoted && next === '"'){cell+='"';i++;} else quoted=!quoted; }
   else if(ch === "," && !quoted){row.push(cell.trim());cell="";}
   else if((ch === "\n" || ch === "\r") && !quoted){if(ch==="\r"&&next==="\n")i++;row.push(cell.trim());cell="";if(row.some(Boolean)){rows.push(row);row=[];}}
   else cell+=ch;
  }
  if(cell.length||row.length){row.push(cell.trim());rows.push(row);}
  if(rows.length<2)return [];
  const headers=rows[0].map(x=>x.trim());
  return rows.slice(1).map(vals=>Object.fromEntries(headers.map((h,i)=>[h,vals[i]||""])));
 }
 function downloadTemplate(){
  const headers="studentId,name,enrollmentNo,admissionNo,email,mobile,dob,gender,address,departmentId,programId,semesterId,divisionId,academicYearId,status";
  const blob=new Blob([headers+"\n,Example Student,,,,,,,,,,,,,,ACTIVE\n"],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="noble-student-import-template.csv";a.click();URL.revokeObjectURL(a.href);
 }
 async function bulkUpload(e){
  const file=e.target.files?.[0]; if(!file)return;
  setBulkBusy(true);setError("");
  try{
   if(!file.name.toLowerCase().endsWith(".csv")) throw new Error("Please upload CSV for bulk import. Excel/XLSX support will be added in the next import upgrade.");
   const students=csvParse(await file.text());
   const r=await fetch("/api/admin/students",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"bulk",students})});
   const d=await r.json();if(!r.ok)throw new Error(d.error);
   setBulk(d);await load();
  }catch(e){setError(e.message)}finally{setBulkBusy(false);e.target.value=""}
 }
 return <main className="content" style={{padding:"32px",maxWidth:"1400px"}}>
  <ModuleHeader eyebrow="NOBLE ERP • STUDENT MANAGEMENT" title="Student Management" description="Real student records, academic mapping and database-backed login accounts." />
  {error&&<div className="error" style={{margin:"18px 0"}}>{error}</div>}
  {credentials&&<div className="panel" style={{margin:"18px 0"}}><b>Student account created successfully.</b><p>Username: <strong>{credentials.username}</strong> &nbsp; Password: <strong>{credentials.password}</strong></p><small>Save these credentials now. The password is shown only at creation time.</small></div>}
  {bulk&&<div className="panel" style={{margin:"18px 0"}}><b>Bulk import complete: {bulk.created.length} created, {bulk.failed.length} failed.</b>{bulk.created.length>0&&<details><summary>View generated login credentials</summary><pre style={{whiteSpace:"pre-wrap"}}>{bulk.created.map(x=>x.credentials.username+" / "+x.credentials.password).join("\n")}</pre></details>}{bulk.failed.length>0&&<details><summary>View failed rows</summary><pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(bulk.failed,null,2)}</pre></details>}</div>}
  <form onSubmit={save} style={{margin:"24px 0",padding:"22px",border:"1px solid #ddd",borderRadius:"18px",display:"grid",gap:"14px"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><b>{editing?"Edit Student":"Add Student"}</b>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(empty)}}>Cancel</button>}</div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"14px"}}>
    {[["studentId","Student ID","text"],["enrollmentNo","Enrollment No.","text"],["admissionNo","Admission No.","text"],["name","Full Name","text"],["email","Email","email"],["mobile","Mobile","text"],["dob","Date of Birth","date"],["gender","Gender","text"]].map(([k,l,t])=><label key={k}>{l}<input value={form[k]} type={t} onChange={e=>set(k,e.target.value)} required={k==="name"}/></label>)}
    <label>Department<select value={form.departmentId} onChange={e=>set("departmentId",e.target.value)}><option value="">Select</option>{options.departments.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select></label>
    <label>Program<select value={form.programId} onChange={e=>set("programId",e.target.value)}><option value="">Select</option>{options.programs.map(x=><option key={x.id} value={x.id}>{x.code} — {x.name}</option>)}</select></label>
    <label>Semester<select value={form.semesterId} onChange={e=>set("semesterId",e.target.value)}><option value="">Select</option>{options.semesters.map(x=><option key={x.id} value={x.id}>{x.name} ({x.number})</option>)}</select></label>
    <label>Division<select value={form.divisionId} onChange={e=>set("divisionId",e.target.value)}><option value="">Select</option>{options.divisions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label>Academic Year<select value={form.academicYearId} onChange={e=>set("academicYearId",e.target.value)}><option value="">Select</option>{options.academicYears.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <label>Status<select value={form.status} onChange={e=>set("status",e.target.value)}><option>ACTIVE</option><option>INACTIVE</option><option>GRADUATED</option><option>TRANSFERRED</option><option>CANCELLED</option></select></label>
   </div>
   <label>Address<textarea value={form.address} onChange={e=>set("address",e.target.value)} /></label>
   <button className="primary" disabled={saving}>{saving?"Saving…":editing?"Update Student →":"Create Student + Account →"}</button>
  </form>
  <div className="panel" style={{marginBottom:"22px"}}><div className="panelTitle"><b>Bulk Student Import</b><div><button type="button" onClick={downloadTemplate}>Download Template</button>{" "}<input type="file" accept=".csv" onChange={bulkUpload} disabled={bulkBusy}/></div></div><p>CSV headers: <code>studentId,name,enrollmentNo,admissionNo,email,mobile,dob,gender,address,departmentId,programId,semesterId,divisionId,academicYearId,status</code></p><small>Student ID may be blank; one will be generated automatically. Each imported student gets a real login account. CSV values containing commas should be quoted.</small></div>
  <div className="panel"><div className="panelTitle"><b>Students ({filtered.length})</b><input placeholder="Search students…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
   {loading?<p>Loading…</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Student ID","Name","Program","Semester","Division","Department","Account","Status","Actions"].map(x=><th key={x} style={{textAlign:"left",padding:"10px"}}>{x}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.id}>{<><td style={{padding:"10px"}}>{r.studentId}</td><td style={{padding:"10px"}}>{r.name}</td><td style={{padding:"10px"}}>{r.program?.name||"—"}</td><td style={{padding:"10px"}}>{r.semester?.name||"—"}</td><td style={{padding:"10px"}}>{r.division?.name||"—"}</td><td style={{padding:"10px"}}>{r.department?.name||"—"}</td><td style={{padding:"10px"}}>{r.user?.status||"—"}</td><td style={{padding:"10px"}}>{r.status}</td><td style={{padding:"10px",whiteSpace:"nowrap"}}><button onClick={()=>edit(r)}>Edit</button>{" "}<button onClick={()=>window.open("/admin/students/id-card?studentId="+encodeURIComponent(r.id),"_blank")}>ID Card</button>{" "}<button onClick={()=>deactivate(r.id)}>Deactivate</button></td></>}</tr>)}</tbody></table></div>}
  </div>
 </main>
}