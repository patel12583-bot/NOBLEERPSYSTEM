"use client";
import { usePathname, useRouter } from "next/navigation";

function getSafeBackPath(pathname){
 if(!pathname||pathname==="/"||pathname==="/dashboard"||pathname==="/portal")return "/dashboard";
 const parts=pathname.split("/").filter(Boolean);
 if(parts[0]==="admin"&&parts.length<=2)return "/dashboard";
 if(parts.length<=1)return "/dashboard";
 return "/"+parts.slice(0,-1).join("/");
}

export default function GlobalBack(){
  const pathname=usePathname();
  const router=useRouter();
  const hidden=["/","/login","/register","/setup"].includes(pathname);
  if(hidden) return null;
  return <button className="globalBack" type="button" onClick={()=>router.push(getSafeBackPath(pathname))} aria-label="Go back">← <span>Back</span></button>;
}
