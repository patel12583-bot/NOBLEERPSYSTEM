"use client";
import {useSearchParams,useRouter} from "next/navigation";
import {Suspense} from "react";
const menus={
 Student:["Dashboard","My Profile","Attendance","Timetable","Results","Leave","Examination","Hall Ticket"],
 Faculty:["Dashboard","My Profile","Subjects","Timetable","Attendance","Workload","Leave","Examination"],
 HOD:["Dashboard","Department","Faculty","Subjects","Approvals","Attendance Reports","Examination","Timetable"],
 Parent:["Dashboard","Student Profile","Attendance","Results","Fees","Leave","Examination"],
 Admin:["Dashboard","Students","Faculty","HOD","Academic Management","Subjects","Timetable","Attendance","Reports","Leave","Examination","Hall Ticket"],
 "Super Admin":["Dashboard","Institutes","Admins","Students","Faculty","Academics","Attendance","Examination","Reports","Settings"]
};
function Dash(){
 const p=useSearchParams(),router=useRouter(),role=p.get("role")||"Student",id=p.get("id")||"User"; const items=menus[role]||menus.Student;
 return <main className="dash"><aside><div className="sideBrand"><span className="brandMark">N</span><b>NOBLE ERP</b></div><div className="rolePill">{role} Portal</div><div className="sideNav">{items.map((x,i)=><button className={i===0?"selected":""} key={x}><span>{["⌂","◉","▣","◫","✓","▤","◈","▥"][i%8]}</span>{x}</button>)}</div><button className="logout" onClick={()=>router.push("/")}>↪ Sign out</button></aside>
 <section className="content"><header><div><div className="eyebrow">NOBLE GROUP OF INSTITUTES</div><h1>Good morning, {id}</h1><p>Here’s your {role.toLowerCase()} workspace overview.</p></div><div className="avatar">{id.slice(0,1).toUpperCase()}</div></header>
 <div className="statGrid"><div><small>ATTENDANCE</small><b>92.4%</b><span>↑ 2.1% this month</span></div><div><small>ACTIVE SUBJECTS</small><b>06</b><span>Current semester</span></div><div><small>PENDING ACTIONS</small><b>03</b><span>Needs your attention</span></div><div><small>ACADEMIC STATUS</small><b>Active</b><span>2026–27</span></div></div>
 <div className="panelGrid"><div className="panel"><div className="panelTitle"><b>Today</b><span>Monday, 5 October 2026</span></div><div className="emptyState"><strong>Your workspace is ready.</strong><p>Core modules are connected through this central ERP dashboard. Data, permissions and workflows will be managed from your role.</p></div></div><div className="panel"><div className="panelTitle"><b>Quick actions</b></div><div className="quick">{items.slice(1,5).map(x=><button key={x}>{x}<span>→</span></button>)}</div></div></div>
 </section></main>
}
export default function Dashboard(){return <Suspense fallback={<div className="loading">Loading dashboard…</div>}><Dash/></Suspense>}