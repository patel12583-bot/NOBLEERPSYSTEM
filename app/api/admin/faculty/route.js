import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

async function guard(){
 const u=await getSessionUser();
 if(!u||!["SUPER_ADMIN","ADMIN","HOD"].includes(u.role))return null;
 if(u.role==="HOD"){
  const faculty=await prisma.faculty.findUnique({where:{userId:u.id},select:{departmentId:true}});
  if(!faculty?.departmentId)return null;
  return {...u,departmentId:faculty.departmentId};
 }
 return u;
}
function assertDepartment(u,departmentId){
 if(u.role==="HOD"&&departmentId!==u.departmentId)throw new Error("HOD can manage faculty only within the assigned department.");
}
function pass(){ return crypto.randomBytes(6).toString("base64url").slice(0,10)+"Aa1!"; }
function clean(d){ const o={}; for(const k of ["facultyId","employeeId","name","gender","address","photoUrl","email","mobile","designation","qualification","facultyRole","departmentId","status"]) if(d[k]!==undefined&&d[k]!=="") o[k]=d[k]; if(d.dob)o.dob=new Date(d.dob); if(d.joiningDate)o.joiningDate=new Date(d.joiningDate); return o; }

export async function GET(){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const rows=await prisma.faculty.findMany({where:u.role==="HOD"?{departmentId:u.departmentId}:undefined,orderBy:{createdAt:"desc"},include:{department:{select:{id:true,code:true,name:true}},user:{select:{username:true,email:true,status:true,role:true}},subjects:{include:{subject:{select:{id:true,code:true,name:true}}}}}});
 const departments=await prisma.department.findMany({orderBy:{name:"asc"},select:{id:true,code:true,name:true}});
 const subjects=await prisma.subject.findMany({orderBy:{name:"asc"},select:{id:true,code:true,name:true,departmentId:true}});
 return NextResponse.json({faculty:rows,departments,subjects});
}
export async function POST(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await req.json();
 try{
  if(b.action==="assignSubject"){
   const faculty=await prisma.faculty.findUnique({where:{id:b.facultyId}});
   const subject=await prisma.subject.findUnique({where:{id:b.subjectId}});
   if(!faculty||!subject)return NextResponse.json({error:"Faculty or subject not found."},{status:404});
   if(u.role==="HOD"&&faculty.departmentId!==u.departmentId)return NextResponse.json({error:"You can manage only faculty in your department."},{status:403});
   if(faculty.departmentId&&subject.departmentId&&faculty.departmentId!==subject.departmentId)return NextResponse.json({error:"Faculty and subject departments do not match."},{status:400});
   const row=await prisma.facultySubject.create({data:{facultyId:b.facultyId,subjectId:b.subjectId}});
   return NextResponse.json({row},{status:201});
  }
  const d=clean(b.data||b); if(!d.name)throw new Error("Faculty name is required.");
  if(!d.employeeId)throw new Error("Employee ID is required.");
  if(!d.departmentId)throw new Error("Department is required.");
  assertDepartment(u,d.departmentId);
  if(!d.facultyId)d.facultyId="FAC"+Date.now().toString().slice(-7);
  if(await prisma.faculty.findUnique({where:{facultyId:d.facultyId}}))throw new Error("Faculty ID already exists.");
  if(await prisma.faculty.findFirst({where:{employeeId:d.employeeId}}))throw new Error("Employee ID already exists.");
  const password=b.data?.password?String(b.data.password):pass(); if(password.length<8)throw new Error("Password must be at least 8 characters.");
  const user=await prisma.user.create({data:{username:d.facultyId,email:d.email||null,passwordHash:await bcrypt.hash(password,12),role:"FACULTY",status:"ACTIVE"}});
  try{ const faculty=await prisma.faculty.create({data:{...d,userId:user.id}}); return NextResponse.json({faculty,credentials:{username:d.facultyId,password}},{status:201}); }
  catch(e){await prisma.user.delete({where:{id:user.id}}).catch(()=>{});throw e;}
 }catch(e){return NextResponse.json({error:e.message||"Unable to create faculty."},{status:400});}
}
export async function PUT(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401}); const b=await req.json();
 try{
  if(b.action==="removeSubject"){await prisma.facultySubject.delete({where:{facultyId_subjectId:{facultyId:b.facultyId,subjectId:b.subjectId}}});return NextResponse.json({ok:true});}
  const current=await prisma.faculty.findUnique({where:{id:b.id}}); if(!current)return NextResponse.json({error:"Faculty not found."},{status:404});
  if(u.role==="HOD"&&current.departmentId!==u.departmentId)return NextResponse.json({error:"You can manage only faculty in your department."},{status:403});
  const d=clean(b.data||{}); delete d.facultyId;
  if(d.departmentId)assertDepartment(u,d.departmentId);
  if(d.employeeId&&d.employeeId!==current.employeeId&&await prisma.faculty.findFirst({where:{employeeId:d.employeeId}}))return NextResponse.json({error:"Employee ID already exists."},{status:400});
  if(b.data?.password&&String(b.data.password).length<8)return NextResponse.json({error:"Password must be at least 8 characters."},{status:400});
  const faculty=await prisma.faculty.update({where:{id:b.id},data:d});
  if(current.userId&&(b.data?.email!==undefined||b.data?.password)){
   const userData={}; if(b.data.email!==undefined)userData.email=b.data.email||null;
   if(b.data.password)userData.passwordHash=await bcrypt.hash(String(b.data.password),12);
   await prisma.user.update({where:{id:current.userId},data:userData});
  }
  if(b.data?.status==="INACTIVE"&&current.userId)await prisma.user.update({where:{id:current.userId},data:{status:"INACTIVE"}});
  return NextResponse.json({faculty});
 }catch(e){return NextResponse.json({error:"Unable to update faculty."},{status:400});}
}
export async function DELETE(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401}); const {id}=await req.json();
 const f=await prisma.faculty.findUnique({where:{id}}); if(!f)return NextResponse.json({error:"Faculty not found."},{status:404});
 if(u.role==="HOD"&&f.departmentId!==u.departmentId)return NextResponse.json({error:"You can manage only faculty in your department."},{status:403});
 await prisma.faculty.update({where:{id},data:{status:"INACTIVE"}}); if(f.userId)await prisma.user.update({where:{id:f.userId},data:{status:"INACTIVE"}});
 return NextResponse.json({ok:true});
}