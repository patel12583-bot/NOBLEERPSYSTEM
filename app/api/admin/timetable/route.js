import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
export const runtime="nodejs"; export const dynamic="force-dynamic";
async function guard(){const u=await getSessionUser();return u&&["SUPER_ADMIN","ADMIN","HOD"].includes(u.role)?u:null}
export async function GET(){const u=await guard();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const [rows,divisions,subjects,faculty,rooms]=await Promise.all([
  prisma.timetable.findMany({orderBy:[{dayOfWeek:"asc"},{startTime:"asc"}],include:{division:{include:{program:true,semester:true}},subject:true,faculty:true,room:true}}),
  prisma.division.findMany({orderBy:{name:"asc"},include:{program:true,semester:true}}),
  prisma.subject.findMany({orderBy:{name:"asc"}}),
  prisma.faculty.findMany({where:{status:"ACTIVE"},orderBy:{name:"asc"}}),
  prisma.room.findMany({orderBy:{code:"asc"}})
 ]); return NextResponse.json({rows,divisions,subjects,faculty,rooms})}
function overlap(a,b){return a.startTime<b.endTime&&b.startTime<a.endTime}
export async function POST(req){const u=await guard();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});const b=await req.json();try{
 const {dayOfWeek,startTime,endTime,divisionId,subjectId,facultyId,roomId}=b;
 if(!divisionId||!subjectId||!facultyId||!startTime||!endTime)return NextResponse.json({error:"Division, subject, faculty, start and end time are required."},{status:400});
 if(startTime>=endTime)return NextResponse.json({error:"End time must be after start time."},{status:400});
 const [existing,subject,faculty,division]=await Promise.all([
  prisma.timetable.findMany({where:{dayOfWeek:Number(dayOfWeek)},include:{division:true,faculty:true,room:true}}),
  prisma.subject.findUnique({where:{id:subjectId}}),prisma.faculty.findUnique({where:{id:facultyId}}),prisma.division.findUnique({where:{id:divisionId}})
 ]);
 if(!subject||!faculty||!division)return NextResponse.json({error:"Selected academic record was not found."},{status:404});
 if(faculty.departmentId&&subject.departmentId&&faculty.departmentId!==subject.departmentId)return NextResponse.json({error:"Faculty and subject departments do not match."},{status:400});
 const clashes=existing.filter(x=>overlap({startTime,endTime},{startTime:x.startTime,endTime:x.endTime}));
 if(clashes.some(x=>x.divisionId===divisionId))return NextResponse.json({error:"Division timetable clash: this division already has a class at this time."},{status:409});
 if(clashes.some(x=>x.facultyId===facultyId))return NextResponse.json({error:"Faculty timetable clash: this faculty already has a class at this time."},{status:409});
 if(roomId&&clashes.some(x=>x.roomId===roomId))return NextResponse.json({error:"Room timetable clash: this room is already booked at this time."},{status:409});
 const row=await prisma.timetable.create({data:{dayOfWeek:Number(dayOfWeek),startTime,endTime,divisionId,subjectId,facultyId,roomId:roomId||null},include:{division:{include:{program:true,semester:true}},subject:true,faculty:true,room:true}});return NextResponse.json({row},{status:201})
}catch(e){return NextResponse.json({error:e.message||"Unable to create timetable."},{status:400})}}
export async function DELETE(req){const u=await guard();if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});const {id}=await req.json();if(!id)return NextResponse.json({error:"ID required"},{status:400});await prisma.timetable.delete({where:{id}});return NextResponse.json({ok:true})}
