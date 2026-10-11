"use client";
import { usePathname, useRouter } from "next/navigation";

function getSafeBackPath(pathname){
 if(!pathname||pathname==="/")return "/dashboard";
 const parts=pathname.split("/").filter(Boolean);
 if(parts.length<=1)return "/dashboard";
 return "/"+parts.slice(0,-1).join("/");
}

export default function GlobalBack(){
  const pathname=usePathname();
  const router=useRouter();
  const hidden=["/","/login","/register","/setup"].includes(pathname);
  if(hidden) return null;
  return <button className="globalBack" type="button" onClick={()=>window.history.length>1?router.back():router.push(getSafeBackPath(pathname))} aria-label="Go back">← <span>Back</span></button>;
}
