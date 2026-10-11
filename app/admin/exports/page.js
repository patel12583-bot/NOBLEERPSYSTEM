"use client";

import ModuleHeader from "@/components/ModuleHeader";
import AdminShell from "@/components/AdminShell";

import {useState} from "react";
async function responseError(r,fallback){const t=await r.text();if(!t)return fallback;try{const j=JSON.parse(t);return j.error||fallback}catch{return t.slice(0,240)||fallback}}
const reports=[
 ["students","Student Master"],["attendance","Attendance"],["fees","Fees & Payments"],
 ["results","Results"],["library","Library Issue/Return"],["payroll","Payroll"]
];
export default function ExportsPage(){
 const [busy,setBusy]=useState(""); const [error,setError]=useState("");
 async function download(type,format){
  setBusy(type+format);
  try{
   const r=await fetch("/api/export?type="+encodeURIComponent(type)+"&format="+format);
   if(!r.ok)throw new Error(await responseError(r,"Export failed. Server returned an empty or invalid response."));
   const blob=await r.blob();
   const expected=format==="pdf"?"application/pdf":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
   if(!blob.size)throw new Error("The server returned an empty export file. Please retry.");
   if(blob.type && !blob.type.toLowerCase().includes(expected))throw new Error("The server returned an unexpected file type ("+blob.type+"). Please retry or contact the administrator.");
   const url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download="noble-erp-"+type+"."+format;document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(e){setError(e.message||"Export failed.")}finally{setBusy("")}
 }
 return <AdminShell active="Reports"><main>
  <ModuleHeader eyebrow="NOBLE ERP • REPORTS" title="Exports & Reports" description="Download live ERP records as Excel workbooks or PDF reports." />
  <div>{error&&<div className="error" style={{marginTop:18}} role="alert">{error}</div>}<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginTop:24}}>
   {reports.map(([id,name])=><div className="panel" key={id} style={{padding:22}}><b>{name}</b><p style={{opacity:.7}}>Current live records</p><button onClick={()=>download(id,"xlsx")} disabled={!!busy}>{busy===id+"xlsx"?"Preparing…":"Download XLSX"}</button>{" "}<button className="primary" onClick={()=>download(id,"pdf")} disabled={!!busy}>{busy===id+"pdf"?"Preparing…":"Download PDF"}</button></div>)}
  </div></div>
  <div className="panel" style={{marginTop:22,padding:22}}><b>Documents</b><p>Upload and manage student PDF, Word, Excel and image documents.</p><a href="/admin/documents"><button className="primary">Open Document Manager →</button></a></div>
 </main></AdminShell>}
