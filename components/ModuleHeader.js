"use client";

import { useRouter } from "next/navigation";

export default function ModuleHeader({eyebrow="NOBLE ERP",title,description,actions=[]}) {
  const router = useRouter();
  return (
    <section className="moduleHero">
      <div className="moduleHeroTop">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <div className="moduleHeroActions">
          <button type="button" className="back" onClick={()=>window.history.length>1?router.back():router.push("/dashboard")}>← Back</button>
          {actions.map((a,i)=><button key={i} type="button" className={a.primary?"primary":""} onClick={a.onClick}>{a.label}</button>)}
        </div>
      </div>
    </section>
  );
}
