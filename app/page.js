"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      if (isAndroid) {
        window.alert("Install NRS: tap Chrome menu (⋮) → Install app. If shown, choose Add to Home screen.");
      } else if (isIOS) {
        window.alert("Install NRS: tap Share → Add to Home Screen → Add.");
      } else {
        window.alert("Install NRS: open this page in Chrome or Edge and choose Install app from the address bar or browser menu.");
      }
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <main className="shell homepageImageOnly">
      <nav className="nav">
        <div className="brand"><span className="brandMark" aria-hidden="true">N</span><div><b>NOBLE</b><small>GROUP OF INSTITUTES</small></div></div>
        <div className="homepageNavActions"><button className="homepageInstallButton" type="button" onClick={handleInstall} disabled={isInstalled}>{isInstalled ? "APP INSTALLED ✓" : "⇩ INSTALL APP"}</button><Link className="homepageLoginLink" href="/login">LOGIN <span>↗</span></Link></div>
      </nav>
      <section className="hero heroImageOnly" aria-label="Noble campus background" />
      <section className="homepagePortalPanel" aria-label="Choose your login portal">
        <div className="homepagePortalHeading">
          <span>YOUR PORTAL</span>
          <strong>Choose your login</strong>
        </div>
        <div className="pwaStudentEntry"><Link className="pwaStudentLogin" href="/login?role=Student">Login to Student App <span>↗</span></Link><Link className="pwaStudentRegister" href="/register">Create Student Account <span>＋</span></Link></div>
        <div className="homepagePortalGrid">
          {roles.map((role) => (
            <Link className="homepagePortalCard" href={"/login?role=" + encodeURIComponent(role.name)} key={role.name}>
              <span className="homepagePortalIcon" aria-hidden="true">{role.icon}</span>
              <span className="homepagePortalText"><strong>{role.name}</strong><small>{role.desc}</small></span>
              <span className="homepagePortalArrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
