import ModuleHeader from "@/components/ModuleHeader";
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const links = [
  ["Institute Setup","Official institute name, address, phone, email and branding.","/admin/institute"],
  ["User & Role Management","Manage staff roles, parent accounts and demo credentials.","/admin/users"],
  ["Academic Structure","Departments, programs, academic years, semesters, divisions and subjects.","/admin/academics"],
  ["Documents","Student document upload and management.","/admin/documents"],
  ["Exports & Reports","Download live ERP data as Excel or PDF.","/admin/exports"],
];

export default function SettingsPage(){
  const router=useRouter();
  const [status,setStatus]=useState("Checking ERP services…");
  useEffect(()=>{
    fetch("/api/dashboard",{cache:"no-store"})
      .then(r=>setStatus(r.ok?"ERP services are online and the database session is responding.":"ERP service check returned an error."))
      .catch(()=>setStatus("ERP service check could not be completed."));
  },[]);
  return <main className="content" style={{padding:"32px",maxWidth:"1250px"}}>
    <ModuleHeader eyebrow="NOBLE ERP • SYSTEM SETTINGS" title="System Settings" description="Central administration for institute configuration, users, academics and reporting." />
    <div className="panel" style={{margin:"20px 0",padding:"18px"}}>
      <b>System status</b><p style={{marginBottom:0}}>{status}</p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"16px"}}>
      {links.map(([title,desc,href])=><button key={href} type="button" className="panel" onClick={()=>router.push(href)} style={{textAlign:"left",padding:"22px",cursor:"pointer",border:"1px solid #dbe4f0"}}>
        <span className="eyebrow">CONFIGURATION</span><h3 style={{margin:"8px 0"}}>{title}</h3><p style={{margin:0,opacity:.72}}>{desc}</p><strong style={{display:"block",marginTop:"16px"}}>Open →</strong>
      </button>)}
    </div>
    <div className="panel" style={{marginTop:"20px",padding:"22px"}}>
      <b>Quick system links</b>
      <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginTop:"14px"}}>
        <button onClick={()=>router.push("/admin/core?module=rooms")}>Rooms / Labs</button>
        <button onClick={()=>router.push("/admin/core?module=notices")}>Notices</button>
        <button onClick={()=>router.push("/admin/hr")}>HR & Payroll</button>
        <button onClick={()=>router.push("/admin/library")}>Library</button>
      </div>
    </div>
  </main>;
}
