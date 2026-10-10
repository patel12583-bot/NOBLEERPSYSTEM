import{NextResponse}from"next/server";import{readFile}from"node:fs/promises";import{join}from"node:path";import{prisma}from"@/lib/prisma";import{getSessionUser}from"@/lib/auth";import{PDFDocument,StandardFonts,rgb}from"pdf-lib";
export const runtime="nodejs";export const dynamic="force-dynamic";
const staffRoles=["SUPER_ADMIN","ADMIN","HOD","EXAM_OFFICER"];
const INSTITUTE="NOBLE INSTITUTE OF SOCIAL WORK";
const TRUST="(Managed By Shree Noble Education Trust)";
const ADDRESS="Dabhai - Karjan Road Motahabipura, Ta. Dabhoi, Dist. Vadodara  Mo. +91 94276 97085";
const AFFILIATION="(Affiliated By Shree Govind Guru University, Godhra)";
const PRESIDENT="President : A. A. Madhavani";
function safePdfText(v){return String(v??"").replace(/[—–]/g,"-").replace(/[^\x09\x0A\x0D\x20-\xFF]/g,"?")}
async function ticketData(studentId){
 const s=await prisma.student.findUnique({where:{id:studentId},include:{department:true,program:true,semester:true,division:true}});
 if(!s) return null;
 const subjects=await prisma.subject.findMany({where:{semesterId:s.semesterId},orderBy:{name:"asc"}});
 const schedules=await prisma.examSchedule.findMany({where:{subjectId:{in:subjects.map(x=>x.id)},exam:{status:{not:"CANCELLED"}}},include:{exam:true,subject:true,room:true},orderBy:{date:"asc"}});
 return {student:s,schedules};
}
async function drawCenteredHeader(p,doc,font,bold,pageWidth,pageHeight,title){
 const blue=rgb(.04,.18,.36);
 const logoBox={x:30,y:pageHeight-93,w:68,h:68};
 try{
  const logoBytes=await readFile(join(process.cwd(),"public","noble-logo.jpg"));
  const logo=await doc.embedJpg(logoBytes);
  const scale=Math.min(logoBox.w/logo.width,logoBox.h/logo.height),w=logo.width*scale,h=logo.height*scale;
  p.drawImage(logo,{x:logoBox.x+(logoBox.w-w)/2,y:logoBox.y+(logoBox.h-h)/2,width:w,height:h});
 }catch(e){
  p.drawCircle({x:64,y:pageHeight-58,size:27,color:rgb(1,.82,.05),borderColor:blue,borderWidth:1.5});
  p.drawText("N",{x:59,y:pageHeight-63,size:13,font:bold,color:rgb(.78,.03,.18)});
 }
 const centerX=pageWidth/2+22;
 const lines=[[INSTITUTE,15,bold,pageHeight-31],[TRUST,8,bold,pageHeight-47],[ADDRESS,7,font,pageHeight-62],[AFFILIATION,8,bold,pageHeight-77]];
 for(const [txt,size,f,y] of lines){
  const safe=safePdfText(txt),w=f.widthOfTextAtSize(safe,size);
  p.drawText(safe,{x:centerX-w/2,y,size,font:f,color:blue});
 }
 p.drawLine({start:{x:28,y:pageHeight-91},end:{x:pageWidth-28,y:pageHeight-91},thickness:1.2,color:rgb(.12,.38,.72)});
 const pres=safePdfText(PRESIDENT),pw=bold.widthOfTextAtSize(pres,8);
 p.drawText(pres,{x:(pageWidth-pw)/2,y:pageHeight-106,size:8,font:bold,color:blue});
 p.drawLine({start:{x:28,y:pageHeight-116},end:{x:pageWidth-28,y:pageHeight-116},thickness:1.2,color:rgb(.12,.38,.72)});
 const heading=safePdfText(title),hw=bold.widthOfTextAtSize(heading,12);
 p.drawText(heading,{x:(pageWidth-hw)/2,y:pageHeight-137,size:12,font:bold,color:blue});
}
async function bulkPdf(tickets){
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 for(const d of tickets){
  const p=doc.addPage([595,842]);await drawCenteredHeader(p,doc,font,bold,595,842,"EXAMINATION HALL TICKET");
  const margin=30,boxW=535;
  let y=842-158;
  const rect=(x,top,w,h,fill=rgb(1,1,1))=>p.drawRectangle({x,y:top-h,width:w,height:h,borderColor:rgb(.72,.79,.88),borderWidth:.8,color:fill});
  const txt=(s,x,yy,size=9,f=font,color=rgb(.08,.15,.25))=>p.drawText(safePdfText(s).slice(0,110),{x,y:yy,size,font:f,color});
  // Student information panel
  rect(margin,y+16,boxW,67,rgb(.97,.98,1));
  txt("STUDENT DETAILS",margin+12,y,9,bold,rgb(.05,.22,.48));
  txt("Student Name",margin+12,y-18,7,bold,rgb(.35,.4,.48));txt(d.student.name,margin+12,y-32,10,bold);
  txt("Student ID",margin+280,y-18,7,bold,rgb(.35,.4,.48));txt(d.student.studentId||"-",margin+280,y-32,10,bold);
  y-=78;
  rect(margin,y+10,boxW,45,rgb(.99,.99,1));
  txt("PROGRAM",margin+12,y,7,bold,rgb(.35,.4,.48));txt(d.student.program?.name||"-",margin+12,y-18,9,bold);
  txt("SEMESTER",margin+205,y,7,bold,rgb(.35,.4,.48));txt(d.student.semester?.name||"-",margin+205,y-18,9,bold);
  txt("DIVISION",margin+385,y,7,bold,rgb(.35,.4,.48));txt(d.student.division?.name||"-",margin+385,y-18,9,bold);
  y-=64;
  txt("EXAMINATION TIMETABLE",margin,y,10,bold,rgb(.05,.22,.48));y-=18;
  const widths=[88,185,78,95,89],heads=["EXAM","SUBJECT","DATE","TIME","ROOM"];
  let x=margin;
  p.drawRectangle({x:margin,y:y-5,width:boxW,height:23,color:rgb(.08,.28,.55)});
  heads.forEach((h,i)=>{txt(h,x+5,y+3,7,bold,rgb(1,1,1));x+=widths[i]});y-=28;
  if(!d.schedules.length){
   rect(margin,y+2,boxW,34,rgb(.98,.99,1));txt("No exam schedules have been published.",margin+10,y-18,9,font,rgb(.35,.4,.48));y-=38;
  }
  for(const s of d.schedules){
   if(y<55){txt("Some exam rows could not fit on this page. Please contact the Examination Office.",margin,42,7,font,rgb(.45,.25,.2));break}
   rect(margin,y+3,boxW,25,Math.round(y/25)%2===0?rgb(1,1,1):rgb(.97,.98,.995));
   const vals=[s.exam?.name||"Exam",(s.subject?.code?s.subject.code+" - ":"")+(s.subject?.name||"-"),new Date(s.date).toLocaleDateString("en-IN"),(s.startTime||"-")+" - "+(s.endTime||"-"),s.room?.code||"-"];
   x=margin;vals.forEach((v,i)=>{txt(v,x+5,y-12,7.3,font,rgb(.08,.15,.25));x+=widths[i]});
   y-=25;
  }
  p.drawLine({start:{x:margin,y:44},end:{x:595-30,y:44},thickness:.5,color:rgb(.82,.85,.89)});
  p.drawText("Generated by Noble ERP",{x:margin,y:30,size:7,font,color:rgb(.45,.5,.56)});
 }
 return doc.save();
}
async function singlePdf(d){
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const p=doc.addPage([842,595]);await drawCenteredHeader(p,doc,font,bold,842,595,"EXAMINATION HALL TICKET");
 const margin=30,boxW=782;
 const txt=(s,x,y,size=9,f=font,color=rgb(.08,.15,.25))=>p.drawText(safePdfText(s).slice(0,110),{x,y,size,font:f,color});
 const rect=(x,top,w,h,fill=rgb(1,1,1))=>p.drawRectangle({x,y:top-h,width:w,height:h,borderColor:rgb(.72,.79,.88),borderWidth:.8,color:fill});
 let y=595-154;
 rect(margin,y+13,boxW,62,rgb(.97,.98,1));
 txt("STUDENT DETAILS",margin+12,y,9,bold,rgb(.05,.22,.48));
 txt("Student Name",margin+12,y-17,7,bold,rgb(.35,.4,.48));txt(d.student.name,margin+12,y-31,10,bold);
 txt("Student ID",margin+405,y-17,7,bold,rgb(.35,.4,.48));txt(d.student.studentId||"-",margin+405,y-31,10,bold);
 y-=72;
 rect(margin,y+8,boxW,42,rgb(.99,.99,1));
 txt("PROGRAM",margin+12,y,7,bold,rgb(.35,.4,.48));txt(d.student.program?.name||"-",margin+12,y-17,9,bold);
 txt("SEMESTER",margin+285,y,7,bold,rgb(.35,.4,.48));txt(d.student.semester?.name||"-",margin+285,y-17,9,bold);
 txt("DIVISION",margin+535,y,7,bold,rgb(.35,.4,.48));txt(d.student.division?.name||"-",margin+535,y-17,9,bold);
 y-=61;
 txt("EXAMINATION TIMETABLE",margin,y,10,bold,rgb(.05,.22,.48));y-=18;
 const widths=[125,255,105,155,142],heads=["EXAM","SUBJECT","DATE","TIME","ROOM"];
 let x=margin;p.drawRectangle({x:margin,y:y-5,width:boxW,height:23,color:rgb(.08,.28,.55)});
 heads.forEach((h,i)=>{txt(h,x+6,y+3,7,bold,rgb(1,1,1));x+=widths[i]});y-=28;
 if(!d.schedules.length){rect(margin,y+3,boxW,32,rgb(.98,.99,1));txt("No exam schedules have been published.",margin+10,y-17,9,font,rgb(.35,.4,.48));y-=35}
 for(const s of d.schedules){
  if(y<48){txt("Additional exam schedules are not shown on this page. Contact the Examination Office.",margin,38,7,font,rgb(.45,.25,.2));break}
  rect(margin,y+3,boxW,25,Math.round(y/25)%2===0?rgb(1,1,1):rgb(.97,.98,.995));
  const vals=[s.exam?.name||"Exam",(s.subject?.code?s.subject.code+" - ":"")+(s.subject?.name||"-"),new Date(s.date).toLocaleDateString("en-IN"),(s.startTime||"-")+" - "+(s.endTime||"-"),s.room?.code||"-"];
  x=margin;vals.forEach((v,i)=>{txt(v,x+6,y-12,8,font,rgb(.08,.15,.25));x+=widths[i]});y-=25;
 }
 p.drawLine({start:{x:margin,y:31},end:{x:842-30,y:31},thickness:.5,color:rgb(.82,.85,.89)});
 p.drawText("Generated by Noble ERP",{x:margin,y:18,size:7,font,color:rgb(.45,.5,.56)});
 return doc.save();
}
export async function GET(req){
 const u=await getSessionUser();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const q=new URL(req.url).searchParams,staff=staffRoles.includes(u.role);
 if(u.role==="STUDENT"){const s=await prisma.student.findUnique({where:{userId:u.id}});if(!s)return NextResponse.json({error:"Student profile not found."},{status:404});const d=await ticketData(s.id);if(q.get("format")==="pdf"){const out=await singlePdf(d);return new Response(out,{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=noble-erp-hall-ticket.pdf","Cache-Control":"no-store"}})}return NextResponse.json(d);}
 if(!staff)return NextResponse.json({error:"You are not allowed to view another student's hall ticket."},{status:403});
 if(q.get("bulk")==="1"){const students=await prisma.student.findMany({where:{status:"ACTIVE"},orderBy:{name:"asc"},select:{id:true}});const tickets=(await Promise.all(students.map(s=>ticketData(s.id)))).filter(Boolean);const out=await bulkPdf(tickets);return new Response(out,{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=noble-erp-hall-tickets.pdf"}});}
 const studentId=q.get("studentId");
 if(!studentId){const students=await prisma.student.findMany({where:{status:"ACTIVE"},orderBy:{name:"asc"},select:{id:true,studentId:true,name:true,program:{select:{name:true}},semester:{select:{name:true}},division:{select:{name:true}}}});return NextResponse.json({students});}
 const d=await ticketData(studentId);if(!d)return NextResponse.json({error:"Student not found."},{status:404});if(q.get("format")==="pdf"){const out=await singlePdf(d);return new Response(out,{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=noble-erp-hall-ticket.pdf"}})}return NextResponse.json(d);
}