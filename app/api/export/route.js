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
async function makePdf(rows,title){
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 let page=doc.addPage([842,595]),y=555;
 const draw=(text,x,size=8,f=font)=>{page.drawText(String(text).slice(0,100),{x,y,size,font:f,color:rgb(0,0,0)});}
 draw("NOBLE GROUP OF INSTITUTES",30,18,bold);y-=20;draw(title,30,12,bold);y-=14;draw("Generated: "+new Date().toLocaleString("en-IN"),30,8);y-=18;
 const keys=Object.keys(rows[0]||{});draw(keys.join(" | "),30,7,bold);y-=15;
 for(const row of rows){
  if(y<30){page=doc.addPage([842,595]);y=555;draw("NOBLE GROUP OF INSTITUTES",30,13,bold);y-=18;draw(title,30,10,bold);y-=16;draw(keys.join(" | "),30,7,bold);y-=15;}
  draw(keys.map(k=>csvSafe(row[k])).join(" | "),30,6);y-=11;
 }
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