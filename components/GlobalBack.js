"use client";
import { usePathname, useRouter } from "next/navigation";

export default function GlobalBack(){
  const pathname=usePathname();
  const router=useRouter();
  const hidden=["/","/login","/register","/setup"].includes(pathname);
  if(hidden) return null;
  return <button className="globalBack" type="button" onClick={()=>window.history.length>1?router.back():router.push("/dashboard")} aria-label="Go back">← <span>Back</span></button>;
}
