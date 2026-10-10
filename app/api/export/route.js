import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime="nodejs";
export const dynamic="force-dynamic";

async function guard(){
 const u=await getSessionUser();
 return u&&["SUPER_ADMIN","ADMIN","HOD","ACCOUNTANT","EXAM_OFFICER","LIBRARIAN","HR_STAFF","FACULTY"].includes(u.role)?u:null;
}
function csvSafe(v){return String(v??"").replace(/\s+/g," ").trim()}
function rowsFor(type,data){
 if(type==="students")return data.map(s=>({StudentID:s.studentId,Name:s.name,Enrollment:s.enrollmentNo||"",Admission:s.admissionNo||"",Department:s.department?.name||"",Program:s.program?.name||"",Semester:s.semester?.name||"",Division:s.division?.name||"",Status:s.status}));
 if(type==="fees")return data.map(x=>({Student:x.student?.name||"",StudentID:x.student?.studentId||"",Fee:x.feeStructure?.name||"",Due:Number(x.amountDue),Paid:Number(x.amountPaid),Balance:Number(x.amountDue)-Number(x.amountPaid),Status:x.status}));
 if(type==="results")return data.map(x=>({Student:x.student?.name||"",StudentID:x.student?.studentId||"",Exam:x.exam?.name||"",Subject:x.subject?.name||"",Marks:x.marks??"",Grade:x.grade||"",Status:x.status}));
 if(type==="library")return data.map(x=>({Book:x.book?.title||"",Student:x.student?.name||"",StudentID:x.student?.studentId||"",IssueDate:x.issueDate?.toISOString?.().slice(0,10)||"",DueDate:x.dueDate?.toISOString?.().slice(0,10)||"",ReturnDate:x.returnDate?.toISOString?.().slice(0,10)||"",Fine:Number(x.fine||0)}));
 if(type==="payroll")return data.map(x=>{let m={};try{m=JSON.parse(x.metadata||"{}")}catch{}return {Staff:m.staffName||"",Month:m.month||"",Basic:m.basic||0,Allowances:m.allowances||0,Deductions:m.deductions||0,Net:m.net||0}});
 return data;
}
async function fetchData(type){
 if(type==="students")return prisma.student.findMany({orderBy:{name:"asc"},include:{department:{select:{name:true}},program:{select:{name:true}},semester:{select:{name:true}},division:{select:{name:true}}}});
 if(type==="fees")return prisma.studentFee.findMany({include:{student:{select:{name:true,studentId:true}},feeStructure:{select:{name:true}},}});
 if(type==="results")return prisma.result.findMany({include:{student:{select:{name:true,studentId:true}},exam:{select:{name:true}},subject:{select:{name:true}}},orderBy:{id:"desc"}});
 if(type==="library")return prisma.bookIssue.findMany({include:{book:{select:{title:true}},student:{select:{name:true,studentId:true}}},orderBy:{issueDate:"desc"}});
 if(type==="payroll")return prisma.auditLog.findMany({where:{module:"PAYROLL"},orderBy:{createdAt:"desc"}});
 if(type==="attendance"){
  const a=await prisma.attendance.findMany({include:{student:{select:{name:true,studentId:true}},subject:{select:{name:true}}},orderBy:{date:"desc"}});
  return a.map(x=>({Student:x.student.name,StudentID:x.student.studentId,Subject:x.subject.name,Date:x.date.toISOString().slice(0,10),Period:x.period,Status:x.status}));
 }
 throw new Error("Unsupported export type.");
}
function filename(type,format){return "noble-erp-"+type+"-"+new Date().toISOString().slice(0,10)+"."+format}
const INSTITUTE="NOBLE INSTITUTE OF SOCIAL WORK";
const TRUST="(Managed By Shree Noble Education Trust)";
const ADDRESS="Dabhai - Karjan Road Motahabipura, Ta. Dabhoi, Dist. Vadodara  Mo. +91 94276 97085";
const AFFILIATION="(Affiliated By Shree Govind Guru University, Godhra)";
const PRESIDENT="President : A. A. Madhavani";
function drawLogo(page,x,y){
 const blue=rgb(.05,.28,.55),red=rgb(.72,.08,.18),green=rgb(.08,.58,.28),yellow=rgb(1,.78,.05);
 page.drawCircle({x:x+24,y:y+24,size:22,color:rgb(1,1,1),borderColor:blue,borderWidth:2});
 page.drawCircle({x:x+24,y:y+24,size:17,color:yellow});
 page.drawEllipse({x:x+24,y:y+18,xScale:11,yScale:7,color:rgb(.95,.95,1),borderColor:blue,borderWidth:1});
 page.drawLine({start:{x:x+13,y:y+18},end:{x:x+35,y:y+18},thickness:1,color:blue});
 page.drawLine({start:{x:x+24,y:y+11},end:{x:x+24,y:y+31},thickness:1,color:blue});
 page.drawLine({start:{x:x+9,y:y+5},end:{x:x+39,y:y+5},thickness:4,color:green});
 page.drawLine({start:{x:x+14,y:y+32},end:{x:x+24,y:y+40},thickness:3,color:red});
 page.drawLine({start:{x:x+24,y:y+40},end:{x:x+34,y:y+32},thickness:3,color:red});
}
function drawHeader(page,title,font,bold){
 drawLogo(page,34,510);
 page.drawText(INSTITUTE,{x:82,y:551,size:16,font:bold,color:rgb(.04,.15,.28)});
 page.drawText(TRUST,{x:82,y:533,size:9,font:bold,color:rgb(.04,.15,.28)});
 page.drawText(ADDRESS,{x:82,y:516,size:7.2,font,color:rgb(.12,.28,.45)});
 page.drawText(AFFILIATION,{x:82,y:499,size:9,font:bold,color:rgb(.04,.15,.28)});
 page.drawLine({start:{x:30,y:490},end:{x:812,y:490},thickness:1.2,color:rgb(.12,.38,.72)});
 page.drawText(PRESIDENT,{x:82,y:474,size:9,font:bold,color:rgb(.04,.15,.28)});
 page.drawLine({start:{x:30,y:465},end:{x:812,y:465},thickness:1.2,color:rgb(.12,.38,.72)});
 page.drawText(title,{x:30,y:445,size:12,font:bold,color:rgb(.06,.10,.15)});
 page.drawText("Report Generated: "+new Date().toLocaleString("en-IN"),{x:30,y:429,size:7.5,font,color:rgb(.25,.33,.42)});
}
function wrapText(value,font,size,maxWidth){
 const words=String(value??"").split(/\s+/),lines=[];let line="";
 for(const word of words){const next=line?line+" "+word:word;if(font.widthOfTextAtSize(next,size)<=maxWidth)line=next;else{if(line)lines.push(line);line=word}}
 if(line)lines.push(line);
 return lines.length?lines:[""];
}
async function makePdf(rows,title){
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const keys=Object.keys(rows[0]||{});
 const pages=[];let page=doc.addPage([842,595]);pages.push(page);let y=400;
 const rawWidths=keys.map(k=>Math.max(55,Math.min(125,bold.widthOfTextAtSize(String(k),6.5)+18)));
 const total=rawWidths.reduce((a,b)=>a+b,0),scale=total>780?780/total:1,widths=rawWidths.map(w=>w*scale);
 function tableHead(){let x=30;page.drawRectangle({x:30,y:y-4,width:Math.max(1,widths.reduce((a,b)=>a+b,0)),height:22,color:rgb(.08,.38,.72)});keys.forEach((k,i)=>{page.drawText(pdfSafe(k).slice(0,24),{x:x+4,y:y+4,size:6.5,font:bold,color:rgb(1,1,1)});x+=widths[i]});y-=27}
 drawHeader(page,title,font,bold);tableHead();
 for(const row of rows){
  const cells=keys.map((k,i)=>wrapText(csvSafe(row[k]),font,6.5,widths[i]-8));
  const h=Math.max(22,...cells.map(lines=>Math.min(4,lines.length)*8+7));
  if(y-h<45){page=doc.addPage([842,595]);pages.push(page);y=400;drawHeader(page,title,font,bold);tableHead()}
  let x=30;keys.forEach((k,i)=>{page.drawRectangle({x,y:y-h+4,width:widths[i],height:h,borderColor:rgb(.82,.86,.9),borderWidth:.5,color:rgb(1,1,1)});cells[i].slice(0,4).forEach((line,j)=>page.drawText(line.slice(0,35),{x:x+4,y:y-8-j*8,size:6.5,font,color:rgb(.15,.22,.3)}));x+=widths[i]});y-=h;
 }
 if(!rows.length){
  page.drawText("No records available for this report.",{x:30,y:y-10,size:10,font,color:rgb(.35,.4,.46)});
 }
 pages.forEach((p,i)=>p.drawText("Page "+(i+1)+" of "+pages.length,{x:750,y:30,size:7,font,color:rgb(.4,.45,.5)}));
 return doc.save();
}
export async function GET(req){
 const u=await guard();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const q=new URL(req.url).searchParams,type=q.get("type")||"students",format=q.get("format")||"xlsx";
  const rows=rowsFor(type,await fetchData(type));
  if(format==="xlsx"){
   const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(rows);
   XLSX.utils.book_append_sheet(wb,ws,"Report");
   const out=XLSX.write(wb,{bookType:"xlsx",type:"buffer"});
   return new Response(out,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":"attachment; filename="+filename(type,"xlsx")}});
  }
  if(format==="pdf"){
   const out=await makePdf(rows,"Noble ERP — "+type.toUpperCase()+" Report");
   return new Response(out,{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename="+filename(type,"pdf")}});
  }
  return NextResponse.json({error:"Format must be xlsx or pdf."},{status:400});
 }catch(e){console.error(e);return NextResponse.json({error:e.message||"Unable to export report."},{status:400})}
}