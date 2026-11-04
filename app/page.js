"use client";

import Link from "next/link";

const capabilities = [
  { no: "01", icon: "✦", title: "Admission management", desc: "Create, update and find student admission records from one organised workspace." },
  { no: "02", icon: "▤", title: "Course-wise document rules", desc: "Set required and optional documents for BBA, BCA, BRS, BSW, MSW and Diploma courses." },
  { no: "03", icon: "◉", title: "Document verification", desc: "Review uploaded files, track pending items and manage verified or rejected documents." },
  { no: "04", icon: "↗", title: "WhatsApp document sharing", desc: "Prepare student document sharing through the authorised WhatsApp workflow." },
];

export default function Home() {
  return (
    <main className="naHome">
      <div className="naHomeTopline"><span>SHREE NOBLE EDUCATION TRUST</span><span>ADMISSION • RECORDS • DOCUMENTS</span></div>
      <header className="naHomeHeader">
        <Link href="/" className="naHomeBrand">
          <img src="/noble-institutes-logo.svg" alt="Noble Group of Institutes" />
          <span><b>NOBLE GROUP OF INSTITUTES</b><small>ADMISSION MANAGEMENT SYSTEM</small></span>
        </Link>
        <nav><a href="#features">Features</a><a href="#process">How it works</a><a href="#courses">Courses</a></nav>
        <Link className="naHomeLogin" href="/login">Admin Login <span>↗</span></Link>
      </header>

      <section className="naHomeHero">
        <div className="naHomeHeroCopy">
          <div className="naHomeEyebrow"><i /> A SMARTER WAY TO MANAGE ADMISSIONS</div>
          <h1>Every admission.<br /><em>One organised place.</em></h1>
          <p>Manage student admission details, course-wise document requirements and verification from one secure administrator workspace.</p>
          <div className="naHomeActions"><Link className="naHomePrimary" href="/login">Access Admin Workspace <span>↗</span></Link><a className="naHomeSecondary" href="#features">Explore the system</a></div>
          <div className="naHomeTrust"><span><i>✓</i> Admin-controlled access</span><span><i>✓</i> Student-wise records</span><span><i>✓</i> Document tracking</span></div>
        </div>
        <div className="naHomeVisual" aria-label="Admission management dashboard illustration">
          <div className="naHomeVisualTop"><span><i /> ADMISSION OVERVIEW</span><b>●●●</b></div>
          <div className="naHomeVisualTitle">Admission workspace <small>Manage your institute records</small></div>
          <div className="naHomeMiniStats"><div><small>ADMISSIONS</small><b>Records</b><span>Student profiles</span></div><div><small>DOCUMENTS</small><b>Checklist</b><span>Pending & verified</span></div></div>
          <div className="naHomeProgress"><div><span>Document verification</span><b>Track status</b></div><i><span /></i><small>Required documents · Course rules · Review</small></div>
          <div className="naHomeVisualFoot"><span>✦</span> NOBLE GROUP OF INSTITUTES <small>ADMIN PORTAL</small></div>
        </div>
        <div className="naHomeDecor naHomeDecorOne" /><div className="naHomeDecor naHomeDecorTwo" />
      </section>

      <section className="naHomeStrip"><div><b>ONE WORKSPACE</b><span>Admissions and student records</span></div><div><b>COURSE-BASED</b><span>Document requirement lists</span></div><div><b>ADMIN CONTROL</b><span>Private, role-restricted access</span></div></section>

      <section className="naHomeSection" id="features">
        <div className="naHomeSectionHead"><div><div className="naHomeEyebrow">BUILT AROUND YOUR WORKFLOW</div><h2>Less paperwork chaos.<br /><em>More clarity.</em></h2></div><p>Keep admission information and supporting documents together, so your team can quickly understand what has been received, what is pending and what needs attention.</p></div>
        <div className="naHomeFeatureGrid">{capabilities.map(item => <article key={item.no}><div className="naHomeFeatureTop"><span>{item.icon}</span><small>{item.no}</small></div><h3>{item.title}</h3><p>{item.desc}</p><b>ADMIN WORKSPACE ↗</b></article>)}</div>
      </section>

      <section className="naHomeCourseSection" id="courses"><div><div className="naHomeEyebrow">COURSE-WISE DOCUMENT SETUP</div><h2>One checklist for<br /><em>every programme.</em></h2><p>Configure document requirements by course and admission category, then review each student's submission against the relevant checklist.</p><Link href="/login" className="naHomeTextLink">Manage course requirements ↗</Link></div><div className="naHomeCourseList">{["BBA","BCA","BRS","BSW","MSW","DIPLOMA"].map((course,i)=><div key={course}><span>0{i+1}</span><b>{course}</b><small>Course document rules</small><i>↗</i></div>)}</div></section>

      <section className="naHomeProcess" id="process"><div className="naHomeEyebrow">A CLEAR ADMISSION FLOW</div><h2>From admission entry<br /><em>to document ready.</em></h2><div className="naHomeSteps"><div><span>01</span><b>Create admission</b><p>Enter student, parent, contact and academic details.</p></div><div><span>02</span><b>Collect documents</b><p>Follow the course-wise required document checklist.</p></div><div><span>03</span><b>Verify & share</b><p>Review files, update status and share documents when requested.</p></div></div></section>

      <section className="naHomeCTA"><div><div className="naHomeEyebrow">NOBLE ADMISSION MANAGEMENT</div><h2>Ready to manage admissions<br />with more confidence?</h2><p>Sign in to the authorised administrator workspace.</p></div><Link href="/login" className="naHomePrimary">Go to Admin Login <span>↗</span></Link></section>

      <footer className="naHomeFooter"><Link href="/" className="naHomeBrand"><img src="/noble-institutes-logo.svg" alt="" /><span><b>NOBLE GROUP OF INSTITUTES</b><small>ADMISSION MANAGEMENT SYSTEM</small></span></Link><span>© 2026 Noble Group of Institutes. All rights reserved.</span><Link href="/login">Administrator access ↗</Link></footer>
    </main>
  );
}
