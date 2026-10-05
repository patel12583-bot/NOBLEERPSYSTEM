import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getSessionUser} from "@/lib/auth";
export const runtime="nodejs"; export const dynamic="force-dynamic";
async function guard(){const u=await getSessionUser();return u&&["SUPER_ADMIN","ADMIN","HOD","EXAM_OFFICER"].includes(u.role)?u:null}
function overlap(a,b,c,d){return a<c&&c<b||c<a&&b<d||a===c}
export async function GET(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const [exams,years,subjects,rooms]=await Promise.all([
  prisma.exam.findMany({orderBy:{createdAt:"desc"},include:{academicYear:true,schedules:{orderBy:{date:"asc"},include:{subject:true,room:true}}}}),
  prisma.academicYear.findMany({orderBy:{name:"desc"}}),
  prisma.subject.findMany({orderBy:{name:"asc"}}),
  prisma.room.findMany({orderBy:{code:"asc"}})
 ]);
 return NextResponse.json({exams,years,subjects,rooms});
}
export async function POST(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const b=await req.json(); if(!b.name||!b.examType)return NextResponse.json({error:"Exam name and type are required."},{status:400});
  const row=await prisma.exam.create({data:{name:String(b.name).trim(),examType:String(b.examType),academicYearId:b.academicYearId||null,startDate:b.startDate?new Date(b.startDate):null,endDate:b.endDate?new Date(b.endDate):null,status:b.status||"DRAFT"}});
  return NextResponse.json({exam:row},{status:201});
 }catch(e){return NextResponse.json({error:"Unable to create exam."},{status:400})}
}
export async function PUT(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{
  const b=await req.json(); if(!b.id)return NextResponse.json({error:"Exam id required."},{status:400});
  if(b.action==="schedule"){
   if(!b.subjectId||!b.date||!b.startTime||!b.endTime)return NextResponse.json({error:"Subject, date and time are required."},{status:400});
   if(b.startTime>=b.endTime)return NextResponse.json({error:"End time must be after start time."},{status:400});
   const date=new Date(b.date+"T00:00:00");
   const [existing,subject]=await Promise.all([
    prisma.examSchedule.findMany({where:{date,OR:[{roomId:b.roomId||undefined},{subjectId:b.subjectId}]}}),
    prisma.subject.findUnique({where:{id:b.subjectId}})
   ]);
   const clash=existing.find(x=>overlap(b.startTime,b.endTime,x.startTime,x.endTime));
   if(clash)return NextResponse.json({error:"Exam schedule clash detected for this subject or room."},{status:409});
   const row=await prisma.examSchedule.upsert({where:{examId_subjectId:{examId:b.examId,subjectId:b.subjectId}},update:{date,startTime:b.startTime,endTime:b.endTime,roomId:b.roomId||null},create:{examId:b.examId,subjectId:b.subjectId,date,startTime:b.startTime,endTime:b.endTime,roomId:b.roomId||null}});
   return NextResponse.json({schedule:row});
  }
  const row=await prisma.exam.update({where:{id:b.id},data:{name:b.name,examType:b.examType,academicYearId:b.academicYearId||null,startDate:b.startDate?new Date(b.startDate):null,endDate:b.endDate?new Date(b.endDate):null,status:b.status||"DRAFT"}});
  return NextResponse.json({exam:row});
 }catch(e){return NextResponse.json({error:"Unable to update exam or schedule."},{status:400})}
}
export async function DELETE(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 try{const b=await req.json();if(b.scheduleId)await prisma.examSchedule.delete({where:{id:b.scheduleId}});else await prisma.exam.delete({where:{id:b.id}});return NextResponse.json({ok:true})}
 catch(e){return NextResponse.json({error:"Unable to delete record."},{status:400})}
}