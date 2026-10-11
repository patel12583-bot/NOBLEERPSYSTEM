"use client";
import {useState} from "react";
import Link from "next/link";

const roles=[
  {name:"Student",icon:"🎓",desc:"Attendance, timetable, results, leave & hall ticket"},
  {name:"Faculty",icon:"👨‍🏫",desc:"Classes, attendance, workload & academic records"},
  {name:"HOD",icon:"🏛️",desc:"Department approvals, reports & faculty control"},
  {name:"Parent",icon:"👨‍👩‍👧",desc:"Attendance, results, fees & leave updates"},
  {name:"Admin",icon:"⚙️",desc:"Students, faculty, academics, exams & reports"},
  {name:"Super Admin",icon:"🛡️",desc:"Complete institution-wide administration"}
];

export default function Home(){
  const [role,setRole]=useState("Student");
  return <main className="shell">
    <nav className="nav">
      <div className="brand"><span className="brandMark">N</span><div><b>NOBLE</b><small>GROUP OF INSTITUTES</small></div></div>
      <span className="status"><i/> ERP SYSTEM</span>
    </nav>
    <section className="hero heroImageOnly" aria-label="Noble campus background" />
    <section id="roles" className="roles">
      <div className="sectionHead"><div><div className="eyebrow">YOUR PORTAL</div><h2>Choose your workspace</h2></div><p>Select a role to enter the right dashboard.</p></div>
      <div className="roleGrid">{roles.map(r=><button key={r.name} className={"role "+(role===r.name?"active":"")} onClick={()=>setRole(r.name)}><span className="roleIcon">{r.icon}</span><strong>{r.name}</strong><small>{r.desc}</small><span className="arrow">↗</span></button>)}</div>
    </section>
    <footer><span>© {new Date().getFullYear()} Noble Group of Institutes</span><span>Noble ERP • Built for modern campus operations</span></footer>
  </main>
}