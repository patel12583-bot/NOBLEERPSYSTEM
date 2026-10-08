import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
export const runtime="nodejs"; export const dynamic="force-dynamic";
async function guard(){const u=await getSessionUser();return u&&["SUPER_ADMIN","ADMIN","HOD","FACULTY"].includes(u.role)?u:null}
async function makeAttendancePdf(rows,summary,from,to){
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 let page=doc.addPage([842,595]),y=438;
 const drawHeader=()=>{page.drawCircle({x:56,y:536,size:22,color:rgb(1,1,1),borderColor:rgb(.05,.28,.55),borderWidth:2});page.drawCircle({x:56,y:536,size:17,color:rgb(1,.78,.05)});page.drawText("N",{x:49,y:530,size:12,font:bold,color:rgb(.72,.08,.18)});page.drawText("NOBLE GROUP OF INSTITUTE",{x:82,y:545,size:17,font:bold,color:rgb(.04,.15,.28)});page.drawText("Dabhoi Karjan Road, Motaborsiya, Ta. Dabhoi, Dist. Vadodara",{x:82,y:528,size:9,font,color:rgb(.12,.28,.45)});page.drawLine({start:{x:28,y:507},end:{x:814,y:507},thickness:1.2,color:rgb(.12,.38,.72)});page.drawText("Noble ERP — ATTENDANCE REPORT",{x:28,y:482,size:13,font:bold,color:rgb(.06,.10,.15)});page.drawText("Report Generated: "+new Date().toLocaleString("en-IN"),{x:28,y:464,size:8,font,color:rgb(.25,.33,.42)})};
 drawHeader();page.drawText("Period: "+from+" to "+to,{x:28,y:y,size:8,font,color:rgb(.25,.33,.42)});y-=24;
 const stats=[["Students",summary.students||0],["Marked",summary.marked||0],["Present",summary.present||0],["Absent",summary.absent||0],["Late",summary.late||0],["Defaulters <75%",summary.defaulters||0]];
 let sx=28;for(const [k,v] of stats){page.drawRectangle({x:sx,y:y-2,width:120,height:32,borderColor:rgb(.82,.87,.92),borderWidth:.6,color:rgb(.97,.99,1)});page.drawText(k,{x:sx+7,y:y+14,size:6.5,font:bold,color:rgb(.25,.39,.55)});page.drawText(String(v),{x:sx+7,y:y+3,size:10,font:bold,color:rgb(.05,.18,.32)});sx+=128}y-=48;
 const keys=["Student ID","Name","Division","Total","Present","Absent","Late","Attendance %","Status"],widths=[72,125,75,42,48,48,42,65,72];
 const head=()=>{let x=28;page.drawRectangle({x:28,y:y-4,width:589,height:22,color:rgb(.08,.38,.72)});keys.forEach((k,i)=>{page.drawText(k,{x:x+3,y:y+4,size:6.2,font:bold,color:rgb(1,1,1)});x+=widths[i]});y-=26};head();
 for(const r of rows){if(y<55){page=doc.addPage([842,595]);y=530;drawHeader();head()}const vals=[r.studentId,r.name,r.division,r.total,r.present,r.absent,r.late,r.percentage+"%",r.defaulter?"DEFAULTER":"REGULAR"];let x=28;vals.forEach((v,i)=>{page.drawRectangle({x,y:y-5,width:widths[i],height:22,borderColor:rgb(.84,.88,.92),borderWidth:.5,color:rgb(1,1,1)});page.drawText(String(v??"").slice(0,22),{x:x+3,y:y+3,size:6.2,font,color:r.defaulter&&i===8?rgb(.72,.08,.18):rgb(.15,.23,.32)});x+=widths[i]});y-=22}
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