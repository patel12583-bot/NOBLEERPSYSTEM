import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const MAX=10*1024*1024;
const ALLOWED=new Set([
 "application/pdf",
 "application/msword",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 "application/vnd.ms-excel",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 "image/jpeg","image/png","image/webp"
]);

async function guard(){
 const u=await getSessionUser();
 return u&&["SUPER_ADMIN","ADMIN","HOD","FACULTY","HR_STAFF"].includes(u.role)?u:null;
}

export async function GET(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {searchParams}=new URL(req.url); const studentId=searchParams.get("studentId");
 try{
  const documents=await prisma.document.findMany({
   where:studentId?{studentId}:{},
   include:{student:{select:{studentId:true,name:true}}},
   orderBy:{createdAt:"desc"}
  });
  return NextResponse.json({documents});
 }catch(e){return NextResponse.json({error:"Unable to load documents."},{status:400})}
}

export async function POST(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 
 try{
  const form=await req.formData();
  const file=form.get("file"); const studentId=String(form.get("studentId")||"");
  if(!file||typeof file.arrayBuffer!=="function")return NextResponse.json({error:"File is required."},{status:400});
  if(!studentId)return NextResponse.json({error:"Student is required."},{status:400});
  if(file.size>MAX)return NextResponse.json({error:"Maximum file size is 10 MB."},{status:400});
  if(!ALLOWED.has(file.type))return NextResponse.json({error:"Unsupported file type. Use PDF, DOC/DOCX, XLS/XLSX or JPG/PNG/WEBP."},{status:400});
  const student=await prisma.student.findUnique({where:{id:studentId},select:{id:true}});
  if(!student)return NextResponse.json({error:"Student not found."},{status:404});
  const safe=String(file.name).replace(/[^a-zA-Z0-9._-]/g,"_");
  let url="";
  if(process.env.BLOB_READ_WRITE_TOKEN){
   const blob=await put("noble-erp/students/"+studentId+"/"+Date.now()+"-"+safe,file,{access:"public",addRandomSuffix:false});
   url=blob.url;
  }else{
   if(file.size>4*1024*1024)return NextResponse.json({error:"Vercel Blob is not configured. Small files up to 4 MB can be stored directly; for larger files add BLOB_READ_WRITE_TOKEN in Vercel."},{status:503});
   const bytes=Buffer.from(await file.arrayBuffer());
   url="data:"+file.type+";base64,"+bytes.toString("base64");
  }
  const doc=await prisma.document.create({data:{studentId,name:file.name,type:file.type,url}});
  return NextResponse.json({document:doc},{status:201});
 }catch(e){console.error(e);return NextResponse.json({error:e.message||"Unable to upload file."},{status:400})}
}

export async function DELETE(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const {id}=await req.json(); if(!id)return NextResponse.json({error:"Document ID is required."},{status:400});
  await prisma.document.delete({where:{id}});
  return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:"Unable to delete document."},{status:400})}
}