import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
export const runtime="nodejs"; export const dynamic="force-dynamic";
async function guard(){const u=await getSessionUser();return u&&["SUPER_ADMIN","ADMIN","HOD","FACULTY"].includes(u.role)?u:null}
const INSTITUTE="NOBLE INSTITUTE OF SOCIAL WORK";
const TRUST="(Managed By Shree Noble Education Trust)";
const ADDRESS="Dabhai - Karjan Road Motahabipura, Ta. Dabhoi, Dist. Vadodara  Mo. +91 94276 97085";
const AFFILIATION="(Affiliated By Shree Govind Guru University, Godhra)";
const PRESIDENT="President : A. A. Madhavani";
function safePdfText(v){return String(v??"").replace(/[—–]/g,"-").replace(/[^\x09\x0A\x0D\x20-\xFF]/g,"?")}
async function makeAttendancePdf(rows,summary,from,to){
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 let page=doc.addPage([842,595]),y=390;
 const drawHeader=async()=>{const blue=rgb(.04,.18,.36);
  try{const bytes=await readFile(join(process.cwd(),"public","noble-logo.jpg"));const logo=await doc.embedJpg(bytes),scale=Math.min(68/logo.width,68/logo.height),w=logo.width*scale,h=logo.height*scale;page.drawImage(logo,{x:30+(68-w)/2,y:501+(68-h)/2,width:w,height:h})}catch(e){page.drawCircle({x:56,y:536,size:22,color:rgb(1,.82,.05),borderColor:blue,borderWidth:1.5});page.drawText("N",{x:51,y:531,size:12,font:bold,color:rgb(.72,.08,.18)})}
  const lines=[[INSTITUTE,15,bold,554],[TRUST,8,bold,539],[ADDRESS,6.4,font,524],[AFFILIATION,7.5,bold,510]];
  for(const [txt,size,f,yy] of lines){const t=safePdfText(txt),w=f.widthOfTextAtSize(t,size);page.drawText(t,{x:(842-w)/2+18,y:yy,size,font:f,color:blue})}
  page.drawLine({start:{x:28,y:500},end:{x:814,y:500},thickness:1.2,color:rgb(.12,.38,.72)});
  const pres=safePdfText(PRESIDENT),pw=bold.widthOfTextAtSize(pres,8);page.drawText(pres,{x:(842-pw)/2,y:485,size:8,font:bold,color:blue});
  page.drawLine({start:{x:28,y:475},end:{x:814,y:475},thickness:1.2,color:rgb(.12,.38,.72)});
  page.drawText("Noble ERP - ATTENDANCE REPORT",{x:28,y:452,size:12,font:bold,color:rgb(.06,.10,.15)});
  page.drawText("Report Generated: "+new Date().toLocaleString("en-IN"),{x:28,y:436,size:7.5,font,color:rgb(.25,.33,.42)})};
 await drawHeader();page.drawText(safePdfText("Period: "+from+" to "+to),{x:28,y:y,size:8,font,color:rgb(.25,.33,.42)});y-=24;
 const stats=[["Students",summary.students||0],["Marked",summary.marked||0],["Present",summary.present||0],["Absent",summary.absent||0],["Late",summary.late||0],["Defaulters <75%",summary.defaulters||0]];
 let sx=28;for(const [k,v] of stats){page.drawRectangle({x:sx,y:y-2,width:120,height:32,borderColor:rgb(.82,.87,.92),borderWidth:.6,color:rgb(.97,.99,1)});page.drawText(k,{x:sx+7,y:y+14,size:6.5,font:bold,color:rgb(.25,.39,.55)});page.drawText(String(v),{x:sx+7,y:y+3,size:10,font:bold,color:rgb(.05,.18,.32)});sx+=128}y-=48;
 const keys=["Student ID","Name","Division","Total","Present","Absent","Late","Attendance %","Status"],widths=[72,125,75,42,48,48,42,65,72];
 const head=()=>{let x=28;page.drawRectangle({x:28,y:y-4,width:589,height:22,color:rgb(.08,.38,.72)});keys.forEach((k,i)=>{page.drawText(k,{x:x+3,y:y+4,size:6.2,font:bold,color:rgb(1,1,1)});x+=widths[i]});y-=26};head();
 for(const r of rows){if(y<55){page=doc.addPage([842,595]);y=390;await drawHeader();head()}const vals=[r.studentId,r.name,r.division,r.total,r.present,r.absent,r.late,r.percentage+"%",r.defaulter?"DEFAULTER":"REGULAR"];let x=28;vals.forEach((v,i)=>{page.drawRectangle({x,y:y-5,width:widths[i],height:22,borderColor:rgb(.84,.88,.92),borderWidth:.5,color:rgb(1,1,1)});page.drawText(safePdfText(v).slice(0,22),{x:x+3,y:y+3,size:6.2,font,color:r.defaulter&&i===8?rgb(.72,.08,.18):rgb(.15,.23,.32)});x+=widths[i]});y-=22}
 return doc.save();
}
export async function GET(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const faculty=["FACULTY","HOD"].includes(u.role)?await prisma.faculty.findUnique({where:{userId:u.id},include:{subjects:true}}):null; const deptId=u.role==="HOD"?faculty?.departmentId:null; const allowedSubjectIds=faculty?.subjects.map(x=>x.subjectId)||[];
 const q=new URL(req.url).searchParams,from=q.get("from"),to=q.get("to"),divisionId=q.get("divisionId"),subjectId=q.get("subjectId"),semesterNumber=q.get("semesterId"),format=q.get("format");
 const start=from?new Date(from):new Date(new Date().getFullYear(),0,1),end=to?new Date(to+"T23:59:59.999"):new Date();
 const subjectFilter=u.role==="FACULTY"?{subjectId:subjectId?(allowedSubjectIds.includes(subjectId)?subjectId:"__none__"):{in:allowedSubjectIds.length?allowedSubjectIds:["__none__"]}}:subjectId?{subjectId}:{};
 const records=await prisma.attendance.findMany({where:{date:{gte:start,lte:end},...subjectFilter,...(deptId?{student:{departmentId:deptId}}:{})},include:{student:true,subject:true}});
 const students=await prisma.student.findMany({where:{status:"ACTIVE",...(divisionId?{divisionId}:{}),...(semesterNumber?{semester:{number:Number(semesterNumber)}}:{}),...(deptId?{departmentId:deptId}:{})},orderBy:{name:"asc"},include:{division:true}});
 const map=new Map(students.map(s=>[s.id,{id:s.id,name:s.name,studentId:s.studentId,division:s.division?.name||"—",present:0,absent:0,late:0,total:0,percentage:0}]));
 for(const r of records){const x=map.get(r.studentId);if(!x)continue;x.total++;if(r.status==="PRESENT")x.present++;if(r.status==="ABSENT")x.absent++;if(r.status==="LATE")x.late++}
 const rows=[...map.values()].map(x=>({...x,percentage:x.total?Math.round((x.present+x.late*.5)/x.total*10000)/100:0})).map(x=>({...x,defaulter:x.total>0&&x.percentage<75}));
 const summary={students:rows.length,marked:records.length,present:records.filter(x=>x.status==="PRESENT").length,absent:records.filter(x=>x.status==="ABSENT").length,late:records.filter(x=>x.status==="LATE").length,defaulters:rows.filter(x=>x.defaulter).length};
 if(format==="pdf"){const out=await makeAttendancePdf(rows,summary,from||start.toISOString().slice(0,10),to||end.toISOString().slice(0,10));return new Response(out,{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=attendance-report.pdf"}})}
 const [divisions,subjects]=await Promise.all([prisma.division.findMany({where:deptId?{program:{departmentId:deptId}}:{},orderBy:{name:"asc"},include:{program:true,semester:true}}),prisma.subject.findMany({where:u.role==="FACULTY"?{id:{in:allowedSubjectIds.length?allowedSubjectIds:["__none__"]}}:deptId?{departmentId:deptId}:{},orderBy:{name:"asc"}})]);
 return NextResponse.json({rows,summary,divisions,subjects,from:from||start.toISOString().slice(0,10),to:to||end.toISOString().slice(0,10)});
}