"use client";
import {useSearchParams,useRouter} from "next/navigation";
import {Suspense,useState} from "react";

function LoginForm(){
 const params=useSearchParams(), router=useRouter();
 const initial=params.get("role")||"Student"; const [role,setRole]=useState(initial); const [id,setId]=useState(""); const [pass,setPass]=useState(""); const [error,setError]=useState("");
 function submit(e){e.preventDefault(); if(!id||!pass){setError("Enter your ID and password.");return} router.push("/dashboard?role="+encodeURIComponent(role)+"&id="+encodeURIComponent(id));}
 return <main className="loginShell"><div className="loginCard">
  <div className="loginBrand"><span className="brandMark">N</span><div><b>NOBLE</b><small>GROUP OF INSTITUTES</small></div></div>
  <div className="loginTitle"><div className="eyebrow">SECURE PORTAL</div><h1>Welcome back.</h1><p>Sign in to your Noble ERP workspace.</p></div>
  <form onSubmit={submit}>
   <label>Portal role<select value={role} onChange={e=>setRole(e.target.value)}>{["Student","Faculty","HOD","Parent","Admin","Super Admin"].map(x=><option key={x}>{x}</option>)}</select></label>
   <label>User ID / Email<input value={id} onChange={e=>setId(e.target.value)} placeholder="Enter your ID or email"/></label>
   <label>Password<input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Enter password"/></label>
   {error&&<div className="error">{error}</div>}
   <button className="primary full">Sign in <span>→</span></button>
  </form>
  <button className="back" onClick={()=>router.push("/")}>← Back to Noble ERP</button>
 </div></main>
}
export default function Login(){return <Suspense fallback={<main className="loginShell"><div className="loginCard">Loading…</div></main>}><LoginForm/></Suspense>}