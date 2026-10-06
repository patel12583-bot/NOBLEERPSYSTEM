import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = globalThis.__noblePrisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.__noblePrisma = prisma;

export async function POST(req){
  try{
    const body=await req.json();
    const name=String(body.name||"").trim();
    const email=String(body.email||"").trim().toLowerCase();
    const mobile=String(body.mobile||"").trim();
    const password=String(body.password||"");
    if(!name || !email || !password) return NextResponse.json({error:"Name, email and password are required."},{status:400});
    if(password.length<6) return NextResponse.json({error:"Password must be at least 6 characters."},{status:400});
    const existing=await prisma.user.findFirst({where:{OR:[{email},{username:email}]}});
    if(existing) return NextResponse.json({error:"An account with this email already exists."},{status:409});

    const passwordHash=await bcrypt.hash(password,12);
    const studentId="NOBLE-"+Date.now().toString(36).toUpperCase();
    const result=await prisma.$transaction(async tx=>{
      const user=await tx.user.create({data:{username:email,email,passwordHash,role:"STUDENT"}});
      const student=await tx.student.create({data:{studentId,name,email,mobile:user.email?mobile:null,userId:user.id}});
      return {user,student};
    });
    return NextResponse.json({success:true,studentId:result.student.studentId,email:result.user.email});
  }catch(e){
    console.error("REGISTER_ERROR",e);
    return NextResponse.json({error:"Unable to create account right now."},{status:500});
  }
}
