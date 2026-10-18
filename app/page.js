"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const navItems = [
  ["Home", "#home"], ["About College", "#about"], ["Vision & Mission", "#vision"],
  ["Principal Message", "#principal"], ["Departments", "#departments"], ["Courses", "#courses"],
  ["Faculty", "#faculty"], ["Admission", "#admission"], ["Facilities", "#facilities"],
  ["Placement", "#placement"], ["Events", "#events"], ["News & Announcements", "#news"],
  ["Notices", "#notices"], ["Gallery", "#gallery"], ["Downloads", "#downloads"], ["Contact Us", "#contact"]
];

const courses = [
  { code: "BBA", name: "Bachelor of Business Administration", group: "Management" },
  { code: "BCA", name: "Bachelor of Computer Applications", group: "Computer Applications" },
  { code: "BRS", name: "Bachelor of Rural Studies", group: "Rural Studies" },
  { code: "BSW", name: "Bachelor of Social Work", group: "Social Work" },
  { code: "MSW", name: "Master of Social Work", group: "Social Work" },
  { code: "DIPLOMA", name: "Diploma Programmes", group: "Diploma" }
];

const facilities = [
  ["📚", "Learning resources", "A supportive learning environment for study, projects and independent learning."],
  ["💻", "Computer learning", "Technology-enabled learning for practical and application-based study."],
  ["🧑‍🏫", "Faculty guidance", "Academic guidance to support students through their learning journey."],
  ["🎭", "Campus activities", "Opportunities to participate, collaborate and build confidence beyond the classroom."]
];

const stats = [
  ["6", "Course groups listed"], ["10", "ERP portal roles"], ["1", "Connected campus platform"], ["360°", "Student journey support"]
];

const roles = [
  { name: "Student", icon: "🎓", desc: "Student Portal" },
  { name: "Faculty", icon: "👨‍🏫", desc: "Faculty Portal" },
  { name: "HOD", icon: "🏛️", desc: "Department Portal" },
  { name: "Parent", icon: "👨‍👩‍👧", desc: "Parent Portal" },
  { name: "Admin", icon: "⚙️", desc: "Administration" },
  { name: "Super Admin", icon: "🛡️", desc: "Full System Access" },
  { name: "Accountant", icon: "💳", desc: "Fees & Finance" },
  { name: "Examination Officer", icon: "📝", desc: "Examination Portal" },
  { name: "Librarian", icon: "📚", desc: "Library Portal" },
  { name: "HR/Staff", icon: "👥", desc: "HR & Staff Portal" }
];

export default function Home() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Public homepage only displays published, currently valid notices returned by the ERP.
    fetch("/api/public/notices")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Notices unavailable")))
      .then((data) => {
        const published = Array.isArray(data.notices) ? data.notices : [];
        setNotices(published.filter((notice) => !["EVENT", "EVENTS"].includes(String(notice.category || "").toUpperCase())).slice(0, 3));
        setEvents(published.filter((notice) => ["EVENT", "EVENTS"].includes(String(notice.category || "").toUpperCase())).slice(0, 3));
      })
      .catch(() => { setNotices([]); setEvents([]); });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isInstalled) return;
    if (!installPrompt) {
      const isAndroid = /Android/i.test(window.navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
      if (isAndroid) window.alert("Install NRS: tap Chrome menu (⋮) → Install app. If shown, choose Add to Home screen.");
      else if (isIOS) window.alert("Install NRS: tap Share → Add to Home Screen → Add.");
      else window.alert("Install NRS: open this page in Chrome or Edge and choose Install app from the address bar or browser menu.");
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <main className="collegeSite" id="home">
      <div className="collegeTopline"><span>SHREE NOBLE EDUCATION TRUST</span><span>Learning • Opportunity • Community</span></div>
      <header className="collegeHeader">
        <a className="collegeBrand" href="#home">
          <img src="/noble-logo.png" alt="Noble Group of Institutes logo" />
          <span><strong>NOBLE GROUP OF INSTITUTES</strong><small>Knowledge · Character · Progress</small></span>
        </a>
        <div className="collegeHeaderActions">
          <button className="collegeInstall" type="button" onClick={handleInstall} disabled={isInstalled}>{isInstalled ? "NRS INSTALLED ✓" : "↓ INSTALL NRS"}</button>
          <Link className="collegeLogin" href="/login">ERP LOGIN ↗</Link>
        </div>
      </header>
      <nav className="collegeNav" aria-label="Main navigation">
        {navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </nav>

      <section className="collegeHero">
        <div className="collegeHeroShade" />
        <div className="collegeHeroContent">
          <span className="collegeEyebrow">WELCOME TO NOBLE GROUP OF INSTITUTES</span>
          <h1>Education that builds<br /><em>possibility.</em></h1>
          <p>A learning community focused on knowledge, practical skills, personal growth and service to society.</p>
          <div className="collegeHeroActions"><a className="collegePrimary" href="#courses">Explore Courses <span>↗</span></a><a className="collegeOutline" href="#about">Discover Noble</a></div>
          <div className="collegeHeroNote">BBA / BCA / BRS / BSW / MSW / DIPLOMA</div>
        </div>
        <div className="collegeHeroBadge"><span>01</span><div><strong>Learn with purpose</strong><small>Build skills for the next step</small></div></div>
      </section>

      <section className="collegeStats" aria-label="Institute highlights">
        {stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </section>

      <section className="collegeSection collegeAbout" id="about">
        <div className="collegeSectionLabel">01 / ABOUT THE INSTITUTE</div>
        <div className="collegeAboutGrid"><div><h2>A place to learn.<br /><em>A community to grow.</em></h2></div><div><p>Noble Group of Institutes brings academic learning and student development together in a campus community. Explore our programme areas, connect with the institute and use the NRS portal for student and staff services.</p><a className="collegeTextLink" href="#contact">Connect with us ↗</a></div></div>
      </section>

      <section className="collegeVision" id="vision">
        <div className="collegeVisionCard"><span>OUR VISION</span><h2>Inspire learning.<br />Enable potential.</h2><p>To encourage a learning culture that helps students grow in knowledge, confidence and responsibility.</p></div>
        <div className="collegeVisionCard collegeVisionDark"><span>OUR MISSION</span><h2>Knowledge into<br />meaningful action.</h2><p>To support academic development, practical skills, ethical values and engagement with the wider community.</p></div>
      </section>

      <section className="collegeSection" id="principal">
        <div className="collegeSectionLabel">02 / A MESSAGE TO OUR STUDENTS</div>
        <div className="collegePrincipal"><div className="collegePrincipalMark">N</div><div><span className="collegeEyebrow">PRINCIPAL'S MESSAGE</span><h2>Every meaningful journey begins with a willingness to learn.</h2><p>At Noble Group of Institutes, we encourage students to approach learning with curiosity, discipline and a commitment to personal growth. Make the most of your classes, ask questions, participate in campus life and build the skills that will guide you beyond college.</p><small>— Noble Group of Institutes</small><p className="collegeSmallNote">The institute can replace this welcome message with the approved Principal's message and portrait.</p></div></div>
      </section>

      <section className="collegeSection collegeSoft" id="departments">
        <div className="collegeSectionLabel">03 / ACADEMIC AREAS</div><div className="collegeSectionHeading"><div><h2>Explore our <em>departments.</em></h2><p>Discover the subject areas represented across our listed programmes.</p></div><a className="collegeTextLink" href="#courses">View programmes ↗</a></div>
        <div className="collegeDepartmentGrid">{courses.map((course, index) => <a className="collegeDepartmentCard" href="#courses" key={course.code}><span>0{index + 1}</span><div><small>ACADEMIC AREA</small><h3>{course.group}</h3><p>{course.name}</p></div><b>↗</b></a>)}</div>
      </section>

      <section className="collegeSection" id="courses">
        <div className="collegeSectionLabel">04 / PROGRAMMES</div><div className="collegeSectionHeading"><div><h2>Find your <em>next step.</em></h2><p>Programme names shown here are based on the institute's listed course groups.</p></div><Link className="collegeTextLink" href="/login?role=Student">Student portal ↗</Link></div>
        <div className="collegeCourseGrid">{courses.map((course) => <article className="collegeCourseCard" key={course.code}><span>{course.code}</span><div><small>{course.group}</small><h3>{course.name}</h3></div><a href="#admission" aria-label={"Admission information for " + course.code}>Explore ↗</a></article>)}</div>
      </section>

      <section className="collegeFaculty" id="faculty"><div><span className="collegeEyebrow">PEOPLE WHO SUPPORT YOUR LEARNING</span><h2>Guidance makes<br /><em>a difference.</em></h2><p>Connect with faculty through your department and the NRS portal for academic updates, attendance and timetable information.</p><Link className="collegePrimary" href="/login?role=Faculty">Faculty portal ↗</Link></div><div className="collegeFacultyVisual"><span>LEARN</span><b>ASK.</b><b>EXPLORE.</b><b>GROW.</b></div></section>

      <section className="collegeAdmission" id="admission"><div><span className="collegeEyebrow">YOUR JOURNEY STARTS HERE</span><h2>Ready to take<br />the next step?</h2><p>Contact the institute for current eligibility, admission dates, documents and programme availability.</p></div><div className="collegeAdmissionActions"><a className="collegePrimary" href="#contact">Enquire about admission ↗</a><Link className="collegeOutlineLight" href="/register">Create student account</Link></div></section>

      <section className="collegeSection" id="facilities"><div className="collegeSectionLabel">05 / CAMPUS LIFE</div><div className="collegeSectionHeading"><div><h2>Space to <em>thrive.</em></h2><p>Learning experiences that extend beyond a single classroom.</p></div></div><div className="collegeFacilityGrid">{facilities.map(([icon, title, description]) => <article key={title}><span>{icon}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>

      <section className="collegeSection collegeSoft" id="placement"><div className="collegeSectionLabel">06 / CAREER READINESS</div><div className="collegePlacement"><div><span className="collegeEyebrow">PREPARE FOR WHAT'S NEXT</span><h2>Skills for the<br /><em>world beyond campus.</em></h2></div><div><p>Build communication, problem-solving and practical skills as you prepare for further study and career opportunities. Contact the institute for current placement support, recruiter information and verified outcomes.</p><a className="collegeTextLink" href="#contact">Ask about placement support ↗</a></div></div></section>

      <section className="collegeSection" id="events"><div className="collegeSectionLabel">07 / CAMPUS CALENDAR</div><div className="collegeSectionHeading"><div><h2>Upcoming <em>events.</em></h2><p>Official event details appear here when published by the institute.</p></div></div>{events.length ? <div className="collegeUpdatesGrid">{events.map((event, i) => <article key={event.id || i}><small>{event.publishedAt ? "POSTED " + new Date(event.publishedAt).toLocaleDateString("en-IN") : "CAMPUS EVENT"}</small><h3>{event.title}</h3><p>{event.description || "See the event details for more information."}</p></article>)}</div> : <div className="collegeEmptyUpdate"><span>✦</span><div><strong>Stay connected with campus life</strong><p>For the latest event dates and announcements, contact the institute or check official notices through the ERP portal.</p></div><Link href="/login">Open ERP portal ↗</Link></div>}</section>

      <section className="collegeSection collegeSoft" id="news"><div className="collegeSectionLabel">08 / INSTITUTE UPDATES</div><div className="collegeSectionHeading"><div><h2>News & <em>announcements.</em></h2><p>Follow verified institute communications and important updates.</p></div></div><div className="collegeNewsBanner"><span>NEWS DESK</span><div><h3>Keep up with Noble.</h3><p>New announcements will be shared through the institute's official communication channels.</p></div><Link href="/login">Check portal updates ↗</Link></div></section>

      <section className="collegeSection" id="notices"><div className="collegeSectionLabel">09 / IMPORTANT INFORMATION</div><div className="collegeSectionHeading"><div><h2>Latest <em>notices.</em></h2><p>Only published notices available from the public notices service are shown here.</p></div><Link className="collegeTextLink" href="/login">Portal login ↗</Link></div>{notices.length ? <div className="collegeNoticeList">{notices.map((notice, i) => <article key={notice.id || i}><span>0{i + 1}</span><div><small>{notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString("en-IN") : "INSTITUTE NOTICE"}</small><h3>{notice.title}</h3></div><b>↗</b></article>)}</div> : <div className="collegeEmptyUpdate"><span>▤</span><div><strong>No public notices to display right now</strong><p>For student-specific notices, exam schedules and internal circulars, sign in to the NRS portal.</p></div><Link href="/login">Open notices portal ↗</Link></div>}</section>

      <section className="collegeSection collegeGallery" id="gallery"><div className="collegeSectionLabel">10 / CAMPUS GALLERY</div><div className="collegeSectionHeading"><div><h2>A glimpse of <em>campus.</em></h2><p>Campus imagery supplied for the institute website.</p></div></div><div className="collegeGalleryImage" role="img" aria-label="Noble Group of Institutes campus"><span>NOBLE GROUP OF INSTITUTES</span></div></section>

      <section className="collegeSection collegeSoft" id="downloads"><div className="collegeSectionLabel">11 / STUDENT RESOURCES</div><div className="collegeSectionHeading"><div><h2>Forms & <em>downloads.</em></h2><p>Access student documents and academic resources through the ERP.</p></div></div><div className="collegeDownloadGrid"><Link href="/login?role=Student"><span>↧</span><div><strong>Student documents</strong><small>Sign in to access available resources</small></div><b>↗</b></Link><Link href="/login?role=Examination Officer"><span>↧</span><div><strong>Examination resources</strong><small>Exam schedules and hall-ticket services</small></div><b>↗</b></Link><Link href="/login?role=Admin"><span>↧</span><div><strong>Institute forms</strong><small>Contact the administration for official forms</small></div><b>↗</b></Link></div></section>

      <section className="collegeContact" id="contact"><div><span className="collegeEyebrow">GET IN TOUCH</span><h2>Let's start<br /><em>a conversation.</em></h2><p>For admissions, programme availability, campus visits or general enquiries, contact the institute.</p></div><div className="collegeContactDetails"><div><small>INSTITUTE</small><strong>Noble Group of Institutes</strong></div><div><small>ADDRESS</small><strong>Dabhoi-Karjan Road, Mota Habipura, Taluka Dabhoi, District Vadodara, Gujarat</strong></div><div><small>PHONE</small><strong>63590 11171 · 94276 97085</strong></div><div><small>AFFILIATION</small><strong>Shree Govind Guru University, Godhra</strong></div><a className="collegePrimary" href="tel:+916359011171">Call the institute ↗</a></div></section>

      <section className="collegePortalSection" id="portals"><div className="collegeSectionLabel">NRS / DIGITAL CAMPUS</div><div className="collegeSectionHeading"><div><h2>Institute portals, <em>one place.</em></h2><p>Choose the portal that matches your role. Access is controlled by your account permissions.</p></div></div><div className="collegePortalGrid">{roles.map((role) => <Link className="collegePortalCard" href={"/login?role=" + encodeURIComponent(role.name)} key={role.name}><span>{role.icon}</span><div><strong>{role.name}</strong><small>{role.desc}</small></div><b>↗</b></Link>)}</div><div className="collegeStudentActions"><Link href="/login?role=Student">Login to Student App ↗</Link><Link href="/register">Create Student Account ＋</Link><button type="button" onClick={handleInstall}>{isInstalled ? "NRS installed ✓" : "Install NRS app ↓"}</button></div></section>

      <footer className="collegeFooter"><a className="collegeBrand" href="#home"><img src="/noble-logo.png" alt="" /><span><strong>NOBLE GROUP OF INSTITUTES</strong><small>Knowledge · Character · Progress</small></span></a><p>© {new Date().getFullYear()} Noble Group of Institutes. All rights reserved.</p><div>{navItems.slice(0, 5).map(([label, href]) => <a key={href} href={href}>{label}</a>)}</div></footer>
    </main>
  );
}
