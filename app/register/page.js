"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function Register(){
  const router=useRouter();
  const [form,setForm]=useState({name:"",email:"",mobile:"",password:"",confirm:""});
  const [error,setError]=useState(""); const [success,setSuccess]=useState(null); const [loading,setLoading]=useState(false);
  function change(e){setForm({...form,[e.target.name]:e.target.value});}
  async function submit(e){
    e.preventDefault(); setError(""); setSuccess(null);
    if(form.password!==form.confirm){setError("Passwords do not match.");return;}
    setLoading(true);
    try{
      const res=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json();
      if(!res.ok){setError(data.error||"Unable to create account.");return;}
      setSuccess(data);
    }catch{setError("Unable to connect to the server. Please try again.");}
    finally{setLoading(false);}
  }
  return <main className="loginShell"><div className="loginCard">
    <div className="loginBrand"><span className="brandMark">N</span><div><b>NOBLE</b><small>GROUP OF INSTITUTES</small></div></div>
    <div className="loginTitle"><div className="eyebrow">NEW STUDENT ACCOUNT</div><h1>Create account.</h1><p>Register for access to the Noble ERP student portal.</p></div>
    {success ? <div>
      <div className="successBox"><strong>Account created successfully.</strong><p>Your Student ID is <b>{success.studentId}</b>. You can sign in using your email or Student ID.</p></div>
      <button className="primary full" onClick={()=>router.push("/login?role=Student")}>Go to Student Login <span>→</span></button>
    </div> : <form onSubmit={submit}>
      <label>Full name<input name="name" value={form.name} onChange={change} placeholder="Enter your full name" autoComplete="name" required/></label>
      <label>Email address<input name="email" type="email" value={form.email} onChange={change} placeholder="name@example.com" autoComplete="email" required/></label>
      <label>Mobile number<input name="mobile" value={form.mobile} onChange={change} placeholder="Enter mobile number" autoComplete="tel"/></label>
      <label>Password<input name="password" type="password" value={form.password} onChange={change} placeholder="Minimum 6 characters" autoComplete="new-password" required/></label>
      <label>Confirm password<input name="confirm" type="password" value={form.confirm} onChange={change} placeholder="Re-enter password" autoComplete="new-password" required/></label>
      {error&&<div className="error">{error}</div>}
      <button className="primary full" disabled={loading}>{loading?"Creating account…":<>Create account <span>→</span></>}</button>
    </form>}
    {!success&&<button className="back" onClick={()=>router.push("/login?role=Student")}>← Already have an account? Sign in</button>}
    {success&&<button className="back" onClick={()=>router.push("/")}>← Back to Noble ERP</button>}
  </div></main>;
}
