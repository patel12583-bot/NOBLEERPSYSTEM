"use client";

import { usePathname, useRouter } from "next/navigation";

function getSafeBackPath(pathname){
 if(!pathname||pathname==="/")return "/dashboard";
 const parts=pathname.split("/").filter(Boolean);
 if(parts.length<=1)return "/dashboard";
 return "/"+parts.slice(0,-1).join("/");
}

export default function ModuleHeader({eyebrow="NOBLE ERP",title,description,actions=[]}) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <section className="moduleHero">
      <div className="moduleHeroTop">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <div className="moduleHeroActions">
          <button type="button" className="back" onClick={()=>window.history.length>1?router.back():router.push(getSafeBackPath(pathname))}>← Back</button>
          {actions.map((a,i)=><button key={i} type="button" className={a.primary?"primary":""} onClick={a.onClick}>{a.label}</button>)}
        </div>
      </div>
    </section>
  );
}
