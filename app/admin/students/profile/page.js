"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import ModuleHeader from "@/components/ModuleHeader";

function ProfileContent() {
  const params = useSearchParams();
  const studentId = params.get("studentId");
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!studentId) { setError("Student ID is missing."); setLoading(false); return; }
    fetch("/api/admin/students/profile?studentId=" + encodeURIComponent(studentId), { cache: "no-store" })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Unable to load profile."); setStudent(d.student); })
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [studentId]);
  const money = v => "₹" + Number(v || 0).toLocaleString("en-IN");
  const date = v => v ? new Date(v).toLocaleDateString("en-IN") : "—";
  const section = (title, content) => <section className="panel" style={{ padding: 20, margin: "18px 0" }}><h2 style={{ marginTop: 0 }}>{title}</h2>{content}</section>;
  return <AdminShell active="Students"><main className="content" style={{ padding: 30, maxWidth: 1300 }}>
    <ModuleHeader eyebrow="NOBLE ERP • STUDENT RECORD" title="Student Profile" description="Personal details and linked academic records from the ERP database." />
    {loading && <p>Loading student profile…</p>}{error && <div className="error">{error}</div>}
    {student && <>
      <section className="panel" style={{ padding: 22, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        {student.photoUrl ? <img src={student.photoUrl} alt="Student profile" style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 20 }} /> : <div style={{ width: 92, height: 92, borderRadius: 20, display: "grid", placeItems: "center", background: "#e8efff", fontSize: 30 }}>👤</div>}
        <div style={{ flex: 1 }}><h2 style={{ margin: "0 0 6px" }}>{student.name}</h2><div>{student.studentId} · {student.status}</div><div>{student.program?.name || "Course not assigned"} · {student.semester?.name || "Semester not assigned"}</div></div>
        <button className="back" onClick={() => window.location.href = "/admin/students"}>← Student List</button>
      </section>
      {section("Personal Information", <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>{[["First Name",student.firstName],["Last Name",student.lastName],["Name as on Aadhaar",student.aadhaarName],["Enrollment Number",student.enrollmentNo],["Admission Number",student.admissionNo],["Date of Birth",date(student.dob)],["Gender",student.gender],["Mobile",student.mobile],["Email",student.email],["Address",student.address],["City",student.city],["State",student.state],["Pincode",student.pincode],["Admission Date",date(student.admissionDate)]].map(([k,v])=><div key={k}><small style={{opacity:.7}}>{k}</small><div>{v || "—"}</div></div>)}</div>)}
      {section("Course Information", <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>{[["Department",student.department?.name],["Course",student.program?.name],["Semester",student.semester?.name],["Division",student.division?.name],["Academic Year",student.academicYear?.name]].map(([k,v])=><div key={k}><small style={{opacity:.7}}>{k}</small><div>{v || "—"}</div></div>)}</div>)}
      {section("Attendance", student.attendance?.length ? <div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th align="left">Date</th><th align="left">Subject</th><th align="left">Period</th><th align="left">Status</th></tr></thead><tbody>{student.attendance.map(a=><tr key={a.id}><td>{date(a.date)}</td><td>{a.subject?.name}</td><td>{a.period}</td><td>{a.status}</td></tr>)}</tbody></table></div> : <p>No attendance records found.</p>)}
      {section("Results", student.results?.length ? <div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th align="left">Exam</th><th align="left">Subject</th><th align="left">Marks</th><th align="left">Grade</th><th align="left">Status</th></tr></thead><tbody>{student.results.map(r=><tr key={r.id}><td>{r.exam?.name}</td><td>{r.subject?.name}</td><td>{r.marks ?? "—"}</td><td>{r.grade || "—"}</td><td>{r.status}</td></tr>)}</tbody></table></div> : <p>No result records found.</p>)}
      {section("Fees", student.studentFees?.length ? <div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th align="left">Fee</th><th align="left">Due</th><th align="left">Paid</th><th align="left">Balance</th><th align="left">Status</th></tr></thead><tbody>{student.studentFees.map(f=><tr key={f.id}><td>{f.feeStructure?.name}</td><td>{money(f.amountDue)}</td><td>{money(f.amountPaid)}</td><td>{money(Number(f.amountDue)-Number(f.amountPaid))}</td><td>{f.status}</td></tr>)}</tbody></table></div> : <p>No fee records found.</p>)}
      {section("Timetable", student.division?.timetables?.length ? <div style={{overflowX:"auto"}}><table style={{width:"100%"}}><thead><tr><th align="left">Day</th><th align="left">Time</th><th align="left">Subject</th><th align="left">Faculty</th><th align="left">Room</th></tr></thead><tbody>{student.division.timetables.map(t=><tr key={t.id}><td>{["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][t.dayOfWeek] || t.dayOfWeek}</td><td>{t.startTime}–{t.endTime}</td><td>{t.subject?.name}</td><td>{t.faculty?.name}</td><td>{t.room?.name || "—"}</td></tr>)}</tbody></table></div> : <p>No timetable entries found for the student's division.</p>)}
      {section("Assignments & Study Materials", <p>The current database schema has no dedicated Assignment or Study Material models. No records are fabricated here; these sections can be connected when those modules have persistent data models.</p>)}
    </>}
  </main></AdminShell>;
}
export default function StudentProfilePage() { return <Suspense fallback={<main className="content" style={{padding:30}}>Loading student profile…</main>}><ProfileContent /></Suspense>; }
