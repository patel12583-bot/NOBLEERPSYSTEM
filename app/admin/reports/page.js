"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import ModuleHeader from "@/components/ModuleHeader";

const reportTypes = [
  ["students", "Student Report"],
  ["faculty", "Faculty Report"],
  ["attendance", "Attendance Report"],
  ["results", "Result Report"],
  ["fees", "Fees Report"],
  ["pendingFees", "Pending Fees Report"],
  ["departments", "Department Report"],
  ["courses", "Course Report"],
];
const emptyData = { title: "Student Report", columns: [], rows: [], departments: [], programs: [], summary: { records: 0 } };
const dateValue = () => new Date().toISOString().slice(0, 10);

export default function ReportsPage() {
  const [type, setType] = useState("students");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  const load = useCallback(async () => {
    if (from && to && from > to) {
      setError("Start date must be on or before the end date.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ type, from, to, departmentId, programId, status });
      const response = await fetch("/api/admin/reports?" + params.toString(), { cache: "no-store" });
      const raw = await response.text();
      let result = {};
      try { result = raw ? JSON.parse(raw) : {}; } catch { throw new Error("Reports service returned an invalid response."); }
      if (!response.ok) throw new Error(result.error || "Unable to generate report.");
      setData(result);
      setGenerated(true);
    } catch (e) {
      setError(e.message || "Unable to generate report.");
    } finally {
      setLoading(false);
    }
  }, [type, from, to, departmentId, programId, status]);

  useEffect(() => { load(); }, [load]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return data.rows || [];
    return (data.rows || []).filter(row => row.some(value => String(value ?? "").toLocaleLowerCase().includes(term)));
  }, [data.rows, search]);

  function exportCsv() {
    const escape = value => {
      const text = String(value ?? "");
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const csv = [data.columns || [], ...filteredRows].map(row => row.map(escape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "noble-erp-" + type + "-report-" + dateValue() + ".csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function exportPdf() {
    window.print();
  }

  return (
    <AdminShell active="Reports">
      <main className="nobleReportsPage">
        <div className="noPrint">
          <ModuleHeader eyebrow="NOBLE ERP • REPORTS" title="Reports & Analytics" description="Generate live academic, attendance and finance reports. Search, filter, print or export records." />
          {error && <div className="error" role="alert" style={{ marginTop: 16 }}>{error}</div>}
          <section className="panel" style={{ marginTop: 22, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 14 }}>
              <label>Report type
                <select value={type} onChange={e => { setType(e.target.value); setSearch(""); }} style={{ width: "100%", marginTop: 6 }}>
                  {reportTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
              <label>From date
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: "100%", marginTop: 6 }} />
              </label>
              <label>To date
                <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: "100%", marginTop: 6 }} />
              </label>
              <label>Department
                <select value={departmentId} onChange={e => { setDepartmentId(e.target.value); setProgramId(""); }} style={{ width: "100%", marginTop: 6 }} disabled={data.departments?.length === 1}>
                  <option value="">All departments</option>
                  {(data.departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>
              <label>Course
                <select value={programId} onChange={e => setProgramId(e.target.value)} style={{ width: "100%", marginTop: 6 }}>
                  <option value="">All courses</option>
                  {(data.programs || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label>Status
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: "100%", marginTop: 6 }}>
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PASS">Pass</option>
                  <option value="FAIL">Fail</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </label>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 18 }}>
              <button className="primary" onClick={load} disabled={loading}>{loading ? "Generating…" : "Generate report"}</button>
              <button onClick={exportCsv} disabled={!generated || loading}>Export Excel (CSV)</button>
              <button onClick={exportPdf} disabled={!generated || loading}>Export PDF / Print</button>
              <span style={{ opacity: .68, fontSize: 13 }}>CSV opens in Microsoft Excel.</span>
            </div>
          </section>
          <section className="statGrid" style={{ marginTop: 18 }}>
            <div><small>REPORT TYPE</small><b style={{ fontSize: 17 }}>{reportTypes.find(x => x[0] === type)?.[1]}</b></div>
            <div><small>RECORDS MATCHED</small><b>{filteredRows.length}</b></div>
            <div><small>DATE RANGE</small><b style={{ fontSize: 15 }}>{from || "Any"} – {to || "Any"}</b></div>
          </section>
          <div style={{ marginTop: 18, maxWidth: 440 }}>
            <label>Search report records
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, course, status…" style={{ width: "100%", marginTop: 6 }} />
            </label>
          </div>
        </div>

        <section className="panel reportPrintArea" style={{ marginTop: 20, padding: 18, overflowX: "auto" }}>
          <div className="reportPrintHeader">
            <h1 style={{ margin: 0 }}>NOBLE GROUP OF INSTITUTIONS</h1>
            <h2 style={{ margin: "8px 0" }}>{data.title || "ERP Report"}</h2>
            <p style={{ margin: "4px 0 14px" }}>Generated: {data.summary?.generatedAt ? new Date(data.summary.generatedAt).toLocaleString("en-IN") : "—"} | Records: {filteredRows.length}</p>
          </div>
          {!generated && loading ? <p>Generating report from live ERP data…</p> : null}
          {generated && !filteredRows.length ? <p>No records match the selected filters.</p> : null}
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead><tr>{(data.columns || []).map((column, index) => <th key={column + index} style={{ textAlign: "left", padding: "10px 8px", borderBottom: "2px solid #d5dfec", background: "#f3f7fc", fontSize: 12 }}>{column}</th>)}</tr></thead>
            <tbody>{filteredRows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: "9px 8px", borderBottom: "1px solid #e5eaf1", fontSize: 12, verticalAlign: "top" }}>{cell === null || cell === undefined ? "—" : String(cell)}</td>)}</tr>)}</tbody>
          </table>
          <div className="reportPrintFooter">Noble ERP • Confidential institutional report</div>
        </section>

        <style jsx global>{`
          .reportPrintHeader { display: none; }
          .reportPrintFooter { display: none; }
          @media print {
            @page { size: A4 landscape; margin: 12mm; }
            body { background: #fff !important; }
            .noPrint, aside, nav, header, .nobleSidebar, .nobleTopbar, button { display: none !important; }
            .nobleReportsPage { padding: 0 !important; margin: 0 !important; }
            .reportPrintArea { border: 0 !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; }
            .reportPrintHeader, .reportPrintFooter { display: block !important; }
            .reportPrintHeader { text-align: center; margin-bottom: 18px; }
            .reportPrintHeader h1 { font-size: 18px; }
            .reportPrintHeader h2 { font-size: 14px; }
            .reportPrintHeader p { font-size: 9px; }
            table { min-width: 0 !important; width: 100% !important; font-size: 9px !important; }
            th, td { font-size: 8px !important; padding: 5px 4px !important; overflow-wrap: anywhere; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; }
            .reportPrintFooter { margin-top: 18px; text-align: center; font-size: 8px; color: #555; }
          }
        `}</style>
      </main>
    </AdminShell>
  );
}
