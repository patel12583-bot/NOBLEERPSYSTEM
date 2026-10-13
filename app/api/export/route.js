import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

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
const INSTITUTE="NOBLE GROUP OF INSTITUTE";
const PROGRAMS="(BBA / BCA / BRS / BSW / MSW / DIPLOMA)";
const TRUST="(Managed By Shree Noble Education Trust)";
const ADDRESS="Dabhoi-Karjan Rd, Mota Habipura, Ta-Dabhoi, Dist-Vadodara Mo. 63590 11171 / 94276 97085";
const AFFILIATION="(Affiliated by Shree Govind Guru University, Godhra)";
const PRESIDENT="President : A. A. Madhavani";
async function embedInstituteLogo(doc){const bytes=await readFile(join(process.cwd(),"public","noble-logo.png"));try{return await doc.embedPng(bytes)}catch{return await doc.embedJpg(bytes)}}
async function drawHeader(page,title,font,bold,doc){
 const blue=rgb(.04,.18,.36),pw=595.28;
 try{const logo=await embedInstituteLogo(doc);const box={x:24,y:765,w:56,h:56};const scale=Math.min(box.w/logo.width,box.h/logo.height),w=logo.width*scale,h=logo.height*scale;page.drawImage(logo,{x:box.x+(box.w-w)/2,y:box.y+(box.h-h)/2,width:w,height:h});}catch(e){console.error("Report PDF logo load failed:",e)}
 const lines=[[INSTITUTE,15,bold,805],[PROGRAMS,9,bold,789],[TRUST,10,font,773],[ADDRESS,7.2,font,757],[AFFILIATION,9,bold,741]];
 for(const [txt,size,f,y] of lines){
  const safe=pdfSafe(txt),w=f.widthOfTextAtSize(safe,size);
  const contentLeft=88,contentRight=573;
  page.drawText(safe,{x:contentLeft+Math.max(0,(contentRight-contentLeft-w)/2),y,size,font:f,color:blue});
 }
 page.drawLine({start:{x:22,y:728},end:{x:573,y:728},thickness:2,color:rgb(.08,.08,.08)});
 page.drawText(pdfSafe(title),{x:24,y:715,size:10,font:bold,color:rgb(.06,.10,.15)});
 page.drawText(pdfSafe("Report Generated: "+new Date().toLocaleString("en-IN")),{x:24,y:702,size:6.5,font,color:rgb(.25,.33,.42)});
}
function pdfSafe(value){return String(value??"").replace(/[—–]/g,"-").replace(/[^\x09\x0A\x0D\x20-\xFF]/g,"?").toLocaleUpperCase("en-US")}
function wrapText(value,font,size,maxWidth){
 const words=String(value??"").split(/\s+/),lines=[];let line="";
 for(const word of words){const next=line?line+" "+word:word;if(font.widthOfTextAtSize(next,size)<=maxWidth)line=next;else{if(line)lines.push(line);line=word}}
 if(line)lines.push(line);
 return lines.length?lines:[""];
}
async function makePdf(rows,title){
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const keys=Object.keys(rows[0]||{}),pw=595.28,left=23,usable=549;
 const rawWidths=keys.map(k=>Math.max(35,Math.min(88,bold.widthOfTextAtSize(String(k),5.7)+12)));
 const total=rawWidths.reduce((a,b)=>a+b,0),scale=total>usable?usable/total:1,widths=rawWidths.map(w=>w*scale);
 let page=doc.addPage([pw,841.89]),y=675;const pages=[page];
 function tableHead(){let x=left;page.drawRectangle({x:left,y:y-4,width:widths.reduce((a,b)=>a+b,0),height:19,color:rgb(.08,.38,.72)});keys.forEach((k,i)=>{page.drawText(pdfSafe(k).slice(0,18),{x:x+3,y:y+3,size:5.7,font:bold,color:rgb(1,1,1)});x+=widths[i]});y-=22}
 await drawHeader(page,title,font,bold,doc);tableHead();
 for(const row of rows){
  const cells=keys.map((k,i)=>wrapText(csvSafe(row[k]),font,5.7,widths[i]-6));
  const h=Math.max(18,...cells.map(lines=>Math.min(4,lines.length)*7+5));
  if(y-h<42){page=doc.addPage([pw,841.89]);pages.push(page);y=675;await drawHeader(page,title,font,bold,doc);tableHead()}
  let x=left;keys.forEach((k,i)=>{page.drawRectangle({x,y:y-h+3,width:widths[i],height:h,borderColor:rgb(.82,.86,.9),borderWidth:.5,color:rgb(1,1,1)});cells[i].slice(0,4).forEach((line,j)=>page.drawText(line.slice(0,28),{x:x+3,y:y-7-j*7,size:5.7,font,color:rgb(.15,.22,.3)}));x+=widths[i]});y-=h;
 }
 if(!rows.length)page.drawText("NO RECORDS AVAILABLE FOR THIS REPORT.",{x:left,y:y-10,size:9,font,color:rgb(.35,.4,.46)});
 pages.forEach((p,i)=>p.drawText("PAGE "+(i+1)+" OF "+pages.length,{x:480,y:24,size:6.5,font,color:rgb(.4,.45,.5)}));
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