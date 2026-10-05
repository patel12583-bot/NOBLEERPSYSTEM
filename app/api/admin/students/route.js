import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

async function guard(){
  const user=await getSessionUser();
  if(!user || !["SUPER_ADMIN","ADMIN","HOD"].includes(user.role)) return null;
  return user;
}

function cleanStudent(data){
  const out={};
  const fields=["studentId","enrollmentNo","admissionNo","name","email","mobile","gender","address","photoUrl","departmentId","programId","semesterId","divisionId","academicYearId","status"];
  for(const k of fields) if(data[k]!==undefined && data[k]!=="" ) out[k]=data[k];
  if(data.dob) out.dob=new Date(data.dob);
  return out;
}

function password(){
  return crypto.randomBytes(5).toString("base64url").slice(0,10)+"Aa1!";
}

async function createStudent(data){
  const clean=cleanStudent(data);
  if(!clean.name) throw new Error("Student name is required.");
  if(!clean.studentId) clean.studentId="NGI"+Date.now().toString().slice(-7);
  const exists=await prisma.student.findUnique({where:{studentId:clean.studentId}});
  if(exists) throw new Error("Student ID already exists: "+clean.studentId);
  const tempPassword=password();
  const user=await prisma.user.create({
    data:{
      username:clean.studentId,
      email:clean.email||null,
      passwordHash:await bcrypt.hash(tempPassword,12),
      role:"STUDENT",
      status:"ACTIVE"
    }
  });
  try{
    const student=await prisma.student.create({data:{...clean,userId:user.id}});
    return {student,credentials:{username:clean.studentId,password:tempPassword}};
  }catch(e){
    await prisma.user.delete({where:{id:user.id}}).catch(()=>{});
    throw e;
  }
}

export async function GET(){
  const user=await guard();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const students=await prisma.student.findMany({
    orderBy:{createdAt:"desc"},
    include:{
      department:{select:{name:true,code:true}},
      program:{select:{name:true,code:true}},
      semester:{select:{name:true,number:true}},
      division:{select:{name:true}},
      academicYear:{select:{name:true}},
      user:{select:{username:true,status:true}}
    }
  });
  return NextResponse.json({students});
}

export async function POST(request){
  const user=await guard();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await request.json();
  try{
    if(body.action==="bulk"){
      const items=Array.isArray(body.students)?body.students:[];
      if(!items.length) return NextResponse.json({error:"No students supplied."},{status:400});
      const created=[],failed=[];
      for(const item of items){
        try{ created.push(await createStudent(item)); }
        catch(e){ failed.push({studentId:item.studentId||"",name:item.name||"",error:e.message}); }
      }
      return NextResponse.json({created,failed});
    }
    const result=await createStudent(body.data||body);
    return NextResponse.json(result,{status:201});
  }catch(e){
    console.error(e);
    return NextResponse.json({error:e.message||"Unable to create student."},{status:400});
  }
}

export async function PUT(request){
  const user=await guard();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await request.json();
  if(!body.id) return NextResponse.json({error:"Student ID is required."},{status:400});
  try{
    const current=await prisma.student.findUnique({where:{id:body.id}});
    if(!current) return NextResponse.json({error:"Student not found."},{status:404});
    const data=cleanStudent(body.data||{});
    delete data.studentId;
    const student=await prisma.student.update({where:{id:body.id},data});
    if(body.data?.email!==undefined && current.userId){
      await prisma.user.update({where:{id:current.userId},data:{email:body.data.email||null}});
    }
    return NextResponse.json({student});
  }catch(e){
    return NextResponse.json({error:"Unable to update student. Check values."},{status:400});
  }
}

export async function DELETE(request){
  const user=await guard();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {id}=await request.json();
  if(!id) return NextResponse.json({error:"Student ID is required."},{status:400});
  try{
    const student=await prisma.student.findUnique({where:{id}});
    if(!student) return NextResponse.json({error:"Student not found."},{status:404});
    await prisma.student.update({where:{id},data:{status:"INACTIVE"}});
    if(student.userId) await prisma.user.update({where:{id:student.userId},data:{status:"INACTIVE"}});
    return NextResponse.json({ok:true});
  }catch(e){
    return NextResponse.json({error:"Unable to deactivate student."},{status:400});
  }
}