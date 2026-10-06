"use client";

import ModuleHeader from "@/components/ModuleHeader";

import {useState} from "react";
const reports=[
 ["students","Student Master"],["attendance","Attendance"],["fees","Fees & Payments"],
 ["results","Results"],["library","Library Issue/Return"],["payroll","Payroll"]
];
export default function ExportsPage(){
 const [busy,setBusy]=useState("");
 async function download(type,format){
  setBusy(type+format);
  try{
   const r=await fetch("/api/export?type="+encodeURIComponent(type)+"&format="+format);
   if(!r.ok){const d=await r.json();throw new Error(d.error||"Export failed.");}
   const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");
   a.href=url;a.download="noble-erp-"+type+"."+format;a.click();URL.revokeObjectURL(url);
  }catch(e){alert(e.message)}finally{setBusy("")}
 }
 return <main className="content" style={{padding:32,maxWidth:1100}}>
  <ModuleHeader eyebrow="NOBLE ERP • REPORTS" title="Exports & Reports" description="Download live ERP records as Excel workbooks or PDF reports." />
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginTop:24}}>
   {reports.map(([id,name])=><div className="panel" key={id} style={{padding:22}}><b>{name}</b><p style={{opacity:.7}}>Current live records</p><button onClick={()=>download(id,"xlsx")} disabled={!!busy}>{busy===id+"xlsx"?"Preparing…":"Download XLSX"}</button>{" "}<button className="primary" onClick={()=>download(id,"pdf")} disabled={!!busy}>{busy===id+"pdf"?"Preparing…":"Download PDF"}</button></div>)}
  </div>
  <div className="panel" style={{marginTop:22,padding:22}}><b>Documents</b><p>Upload and manage student PDF, Word, Excel and image documents.</p><a href="/admin/documents"><button className="primary">Open Document Manager →</button></a></div>
 </main>
}