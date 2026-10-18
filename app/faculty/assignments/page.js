"use client";
import { useEffect, useState } from "react";

function readFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (file.size > 4 * 1024 * 1024) return reject(new Error("Files must be 4 MB or smaller."));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read selected file."));
    reader.readAsDataURL(file);
  });
}
export default function FacultyAssignmentsPage() {
  const [data, setData] = useState({ assignments: [], subjects: [], semesters: [] });
  const [form, setForm] = useState({ title: "", description: "", subjectId: "", semesterId: "", dueDate: "" });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch("/api/faculty/assignments");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load assignments.");
    setData(body);
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  async function create(e) {
    e.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      const fileUrl = await readFile(file);
      const response = await fetch("/api/faculty/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, fileUrl, fileName: file?.name || "" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not create assignment.");
      setNotice("Assignment created successfully."); setForm({ title: "", description: "", subjectId: "", semesterId: "", dueDate: "" }); setFile(null);
      e.target.reset(); await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
    <header><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Faculty workspace</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Assignment Management</h1><p className="mt-2 text-slate-600">Create coursework, set due dates and review student submissions.</p></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
    {notice && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{notice}</p>}
    <form onSubmit={create} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
      <h2 className="text-xl font-semibold md:col-span-2">Create assignment</h2>
      <label className="text-sm font-medium text-slate-700">Assignment title<input required maxLength={180} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
      <label className="text-sm font-medium text-slate-700">Due date and time<input required type="datetime-local" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
      <label className="text-sm font-medium text-slate-700">Subject<select required value={form.subjectId} onChange={e=>setForm({...form,subjectId:e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 p-3"><option value="">Select subject</option>{data.subjects.map(s=><option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-700">Semester<select required value={form.semesterId} onChange={e=>setForm({...form,semesterId:e.target.value})} className="mt-1 w-full rounded-xl border border-slate-300 p-3"><option value="">Select semester</option>{data.semesters.map(s=><option key={s.id} value={s.id}>{s.name} (Semester {s.number})</option>)}</select></label>
      <label className="text-sm font-medium text-slate-700 md:col-span-2">Instructions / description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} maxLength={5000} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
      <label className="text-sm font-medium text-slate-700 md:col-span-2">Attachment (optional, max 4 MB)<input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label>
      <button disabled={busy} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 md:col-span-2">{busy ? "Saving…" : "Create assignment"}</button>
    </form>
    <section className="space-y-4"><h2 className="text-xl font-semibold text-slate-900">Assignments and submissions</h2>{data.assignments.length===0?<p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No assignments created yet.</p>:data.assignments.map(a=><article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-900">{a.title}</h3><p className="text-sm text-slate-600">{a.subject?.name} · {a.semester?.name} · Due {new Date(a.dueDate).toLocaleString()}</p>{a.description&&<p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{a.description}</p>}</div>{a.fileUrl&&<a className="rounded-lg border px-3 py-2 text-sm font-medium text-indigo-700" download={a.fileName||"assignment"} href={a.fileUrl}>Download attachment</a>}</div>
      <div className="mt-4 border-t pt-4"><p className="mb-3 font-semibold">Submissions ({a.submissions?.length||0})</p>{!a.submissions?.length?<p className="text-sm text-slate-500">No student submissions yet.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Student</th><th className="p-2">Student ID</th><th className="p-2">Submitted</th><th className="p-2">Status</th><th className="p-2">File</th></tr></thead><tbody>{a.submissions.map(s=><tr key={s.id} className="border-b last:border-0"><td className="p-2">{s.student?.name}</td><td className="p-2">{s.student?.studentId}</td><td className="p-2">{new Date(s.submittedAt).toLocaleString()}</td><td className="p-2"><span className={s.status==="LATE"?"text-amber-700":"text-emerald-700"}>{s.status}</span></td><td className="p-2">{s.fileUrl?<a download={s.fileName||"submission"} href={s.fileUrl} className="text-indigo-700 underline">Download</a>:"—"}</td></tr>)}</tbody></table></div>}</div>
    </article>)}</section>
  </main>;
}
