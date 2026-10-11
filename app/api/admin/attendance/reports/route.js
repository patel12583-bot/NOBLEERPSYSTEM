import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
export const runtime="nodejs"; export const dynamic="force-dynamic";
async function guard(){const u=await getSessionUser();return u&&["SUPER_ADMIN","ADMIN","HOD","FACULTY"].includes(u.role)?u:null}
const INSTITUTE="NOBLE GROUP OF INSTITUTION";
const TRUST="(Managed By Shree Noble Education Trust)";
const ADDRESS="DABHOI KARJAN ROAD, MOTAHABIPURA, TA. DABHOI, DIST. VADODARA  MO. +91 94276 97085";
const AFFILIATION="(Affiliated By Shree Govind Guru University, Godhra)";
const PRESIDENT="President : A. A. Madhavani";
function safePdfText(v){return String(v??"").replace(/[—–]/g,"-").replace(/[^\x09\x0A\x0D\x20-\xFF]/g,"?").toLocaleUpperCase("en-US")}
async function makeAttendancePdf(rows,summary,from,to){
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const pw=595.28,left=22;let page=doc.addPage([pw,841.89]),y=665;
 const drawHeader=async()=>{const blue=rgb(.04,.18,.36);let logo=null;
  for(const [file,type] of [["noble-logo.png","png"],["noble-logo.jpg","jpg"],["noble-logo.jpeg","jpg"]]){try{const bytes=await readFile(join(process.cwd(),"public",file));logo=type==="png"?await doc.embedPng(bytes):await doc.embedJpg(bytes);break}catch{}}
  if(logo){const scale=Math.min(48/logo.width,48/logo.height),w=logo.width*scale,h=logo.height*scale;page.drawImage(logo,{x:22+(48-w)/2,y:774+(48-h)/2,width:w,height:h})}
  const lines=[[INSTITUTE,12.5,bold,812],[TRUST,7,bold,797],[ADDRESS,6,font,784],[AFFILIATION,7,bold,771]];
  for(const [txt,size,f,yy] of lines){const t=safePdfText(txt),w=f.widthOfTextAtSize(t,size);page.drawText(t,{x:Math.max(12,(pw-w)/2+12),y:yy,size,font:f,color:blue})}
  page.drawLine({start:{x:22,y:758},end:{x:573,y:758},thickness:1.1,color:rgb(.12,.38,.72)});
  const pres=safePdfText(PRESIDENT),prw=bold.widthOfTextAtSize(pres,7);page.drawText(pres,{x:(pw-prw)/2,y:746,size:7,font:bold,color:blue});
  page.drawLine({start:{x:22,y:738},end:{x:573,y:738},thickness:1.1,color:rgb(.12,.38,.72)});
  page.drawText("ATTENDANCE REPORT",{x:left,y:718,size:10,font:bold,color:rgb(.06,.10,.15)});
  page.drawText(safePdfText("REPORT GENERATED: "+new Date().toLocaleString("en-IN")),{x:left,y:705,size:6.5,font,color:rgb(.25,.33,.42)});
 };
 await drawHeader();page.drawText(safePdfText("PERIOD: "+from+" TO "+to),{x:left,y:y,size:7,font,color:rgb(.25,.33,.42)});y-=24;
 const stats=[["STUDENTS",summary.students||0],["MARKED",summary.marked||0],["PRESENT",summary.present||0],["ABSENT",summary.absent||0],["LATE",summary.late||0],["DEFAULTERS <75%",summary.defaulters||0]];
 const sw=87,gap=5;let sx=left;
 for(const [k,v] of stats){page.drawRectangle({x:sx,y:y-2,width:sw,height:31,borderColor:rgb(.82,.87,.92),borderWidth:.6,color:rgb(.97,.99,1)});page.drawText(k,{x:sx+4,y:y+15,size:5.3,font:bold,color:rgb(.25,.39,.55)});page.drawText(String(v),{x:sx+4,y:y+4,size:9,font:bold,color:rgb(.05,.18,.32)});sx+=sw+gap}y-=45;
 const keys=["STUDENT ID","NAME","DIVISION","TOTAL","PRESENT","ABSENT","LATE","ATTENDANCE %","STATUS"],widths=[55,105,58,35,43,40,32,62,75],tableWidth=widths.reduce((x,v)=>x+v,0);
 const head=()=>{let x=left;page.drawRectangle({x:left,y:y-4,width:tableWidth,height:20,color:rgb(.08,.38,.72)});keys.forEach((k,i)=>{page.drawText(k,{x:x+2,y:y+3,size:5.1,font:bold,color:rgb(1,1,1)});x+=widths[i]});y-=23};head();
 for(const r of rows){if(y<42){page=doc.addPage([pw,841.89]);y=700;await drawHeader();head()}
  const vals=[r.studentId,r.name,r.division,r.total,r.present,r.absent,r.late,r.percentage+"%",r.defaulter?"DEFAULTER":"REGULAR"];let x=left;
  vals.forEach((v,i)=>{page.drawRectangle({x,y:y-4,width:widths[i],height:19,borderColor:rgb(.84,.88,.92),borderWidth:.5,color:rgb(1,1,1)});page.drawText(safePdfText(v).slice(0,Math.max(5,Math.floor(widths[i]/3.5))),{x:x+2,y:y+2,size:5.1,font,color:r.defaulter&&i===8?rgb(.72,.08,.18):rgb(.15,.23,.32)});x+=widths[i]});y-=19
 }
 if(!rows.length)page.drawText("NO ATTENDANCE RECORDS FOUND.",{x:left,y:y-10,size:8,font,color:rgb(.35,.4,.46)});
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