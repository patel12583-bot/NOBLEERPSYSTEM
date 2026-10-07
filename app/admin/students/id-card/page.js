"use client";
import {useEffect,useState} from "react";

export default function StudentIdCard(){
 const [student,setStudent]=useState(null),[error,setError]=useState("");
 useEffect(()=>{
  const id=new URLSearchParams(window.location.search).get("studentId");
  if(!id)return setError("Student ID is missing.");
  fetch("/api/admin/students",{cache:"no-store"}).then(async r=>{
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"Unable to load student.");
   const row=(d.students||[]).find(x=>x.id===id);
   if(!row)throw new Error("Student record not found.");
   setStudent(row);
  }).catch(e=>setError(e.message));
 },[]);
 if(error)return <main className="content" style={{padding:40}}><div className="error">{error}</div><button onClick={()=>window.history.back()}>← Back</button></main>;
 if(!student)return <main className="content" style={{padding:40}}>Loading ID card…</main>;
 return <main className="content idCardPage" style={{padding:32}}>
  <div className="idCardActions"><button onClick={()=>window.history.back()}>← Back</button><button className="primary" onClick={()=>window.print()}>Print / Save PDF</button></div>
  <section className="studentIdCard">
   <div className="idCardTop"><div><div className="eyebrow">NOBLE GROUP OF INSTITUTES</div><h1>STUDENT IDENTITY CARD</h1><p>Official ERP Student Identification</p></div><div className="idBadge">STUDENT</div></div>
   <div className="idCardBody">
    <div className="idPhoto">{student.photoUrl?<img src={student.photoUrl} alt={student.name}/>:<span>{student.name?.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</span>}</div>
    <div className="idDetails">
      <div><small>Student ID</small><strong>{student.studentId}</strong></div>
      <div><small>Full Name</small><strong>{student.name}</strong></div>
      <div><small>Enrollment No.</small><strong>{student.enrollmentNo||"—"}</strong></div>
      <div><small>Admission No.</small><strong>{student.admissionNo||"—"}</strong></div>
      <div><small>Program</small><strong>{student.program?.name||"—"}</strong></div>
      <div><small>Semester</small><strong>{student.semester?.name||"—"}</strong></div>
      <div><small>Division</small><strong>{student.division?.name||"—"}</strong></div>
      <div><small>Department</small><strong>{student.department?.name||"—"}</strong></div>
    </div>
   </div>
   <div className="idCardFooter"><span>Valid while student status is ACTIVE</span><span>ERP • Student Services</span></div>
  </section>
 </main>
}
