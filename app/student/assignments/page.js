"use client";
import { useEffect, useState } from "react";
function readFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("Choose a file to submit."));
    if (file.size > 4 * 1024 * 1024) return reject(new Error("Files must be 4 MB or smaller."));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected file."));
    reader.readAsDataURL(file);
  });
}
export default function StudentAssignmentsPage() {
  const [data, setData] = useState({ assignments: [] });
  const [files, setFiles] = useState({});
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  async function load() {
    const response = await fetch("/api/student/assignments");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load assignments.");
    setData(body);
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  async function submit(assignmentId) {
    setError(""); setNotice(""); setBusyId(assignmentId);
    try {
      const file = files[assignmentId];
      const fileUrl = await readFile(file);
      const response = await fetch("/api/student/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignmentId, fileUrl, fileName: file.name, note: notes[assignmentId] || "" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not submit assignment.");
      setNotice("Assignment submitted successfully."); await load();
    } catch (e) { setError(e.message); } finally { setBusyId(""); }
  }
  return <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
    <header><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Student workspace</p><h1 className="mt-1 text-3xl font-bold text-slate-900">My Assignments</h1><p className="mt-2 text-slate-600">View instructions, download files and submit your work before the deadline.</p></header>
    {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}{notice&&<p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{notice}</p>}
    {data.assignments.length===0?<div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No assignments available for your semester yet.</div>:<div className="space-y-4">{data.assignments.map(a=>{const late=new Date(a.dueDate)<new Date();return <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-900">{a.title}</h2><p className="mt-1 text-sm text-slate-600">{a.subject?.code} · {a.subject?.name} · {a.semester?.name}</p><p className="mt-1 text-sm text-slate-600">Faculty: {a.faculty?.name||"Faculty"} · Due: {new Date(a.dueDate).toLocaleString()}</p></div><span className={"rounded-full px-3 py-1 text-sm font-semibold "+(a.submission?.status==="SUBMITTED"?"bg-emerald-50 text-emerald-700":a.submission?.status==="LATE"?"bg-amber-50 text-amber-700":late?"bg-red-50 text-red-700":"bg-indigo-50 text-indigo-700")}>{a.submission?.status || (late?"Overdue":"Pending")}</span></div>
      {a.description&&<p className="mt-4 whitespace-pre-wrap text-slate-700">{a.description}</p>}
      {a.fileUrl&&<p className="mt-4"><a download={a.fileName||"assignment"} href={a.fileUrl} className="inline-flex rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50">Download assignment file</a></p>}
      {a.submission&&<div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-800">Last submitted: {new Date(a.submission.submittedAt).toLocaleString()}</p><p className="mt-1 text-slate-600">{a.submission.fileName}</p>{a.submission.note&&<p className="mt-1 text-slate-600">Note: {a.submission.note}</p>}</div>}
      <div className="mt-4 grid gap-3 border-t pt-4"><label className="text-sm font-medium text-slate-700">Your file (max 4 MB)<input type="file" onChange={e=>setFiles({...files,[a.id]:e.target.files?.[0]||null})} className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label><label className="text-sm font-medium text-slate-700">Note (optional)<textarea value={notes[a.id]||""} onChange={e=>setNotes({...notes,[a.id]:e.target.value})} maxLength={2000} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label><button onClick={()=>submit(a.id)} disabled={busyId===a.id} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{busyId===a.id?"Submitting…":a.submission?"Update submission":"Submit assignment"}</button></div>
    </article>})}</div>}
  </main>;
}
