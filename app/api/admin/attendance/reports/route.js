import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
export const runtime="nodejs"; export const dynamic="force-dynamic";
async function guard(){const u=await getSessionUser();return u&&["SUPER_ADMIN","ADMIN","HOD","FACULTY"].includes(u.role)?u:null}
export async function GET(req){
 const u=await guard(); if(!u)return NextResponse.json({error:"Unauthorized"},{status:401});
 const faculty=["FACULTY","HOD"].includes(u.role)?await prisma.faculty.findUnique({where:{userId:u.id},include:{subjects:true}}):null; const deptId=u.role==="HOD"?faculty?.departmentId:null; const allowedSubjectIds=faculty?.subjects.map(x=>x.subjectId)||[];
 const q=new URL(req.url).searchParams,from=q.get("from"),to=q.get("to"),divisionId=q.get("divisionId"),subjectId=q.get("subjectId");
 const start=from?new Date(from):new Date(new Date().getFullYear(),0,1),end=to?new Date(to+"T23:59:59.999"):new Date();
 const records=await prisma.attendance.findMany({where:{date:{gte:start,lte:end},...(subjectId?{subjectId}:{}),...(u.role==="FACULTY"?{subjectId:{in:allowedSubjectIds.length?allowedSubjectIds:["__none__"]}}:{}),...(deptId?{student:{departmentId:deptId}}:{})},include:{student:true,subject:true}});
 const students=await prisma.student.findMany({where:{status:"ACTIVE",...(divisionId?{divisionId}:{}),...(deptId?{departmentId:deptId}:{})},orderBy:{name:"asc"},include:{division:true}});
 const map=new Map(students.map(s=>[s.id,{id:s.id,name:s.name,studentId:s.studentId,division:s.division?.name||"—",present:0,absent:0,late:0,total:0,percentage:0}]));
 for(const r of records){const x=map.get(r.studentId);if(!x)continue;x.total++;if(r.status==="PRESENT")x.present++;if(r.status==="ABSENT")x.absent++;if(r.status==="LATE")x.late++}
 const rows=[...map.values()].map(x=>({...x,percentage:x.total?Math.round((x.present+x.late*.5)/x.total*10000)/100:0})).map(x=>({...x,defaulter:x.total>0&&x.percentage<75}));
 const summary={students:rows.length,marked:records.length,present:records.filter(x=>x.status==="PRESENT").length,absent:records.filter(x=>x.status==="ABSENT").length,late:records.filter(x=>x.status==="LATE").length,defaulters:rows.filter(x=>x.defaulter).length};
 const [divisions,subjects]=await Promise.all([prisma.division.findMany({where:deptId?{program:{departmentId:deptId}}:{},orderBy:{name:"asc"},include:{program:true,semester:true}}),prisma.subject.findMany({where:u.role==="FACULTY"?{id:{in:allowedSubjectIds.length?allowedSubjectIds:["__none__"]}}:deptId?{departmentId:deptId}:{},orderBy:{name:"asc"}})]);
 return NextResponse.json({rows,summary,divisions,subjects,from:from||start.toISOString().slice(0,10),to:to||end.toISOString().slice(0,10)});
}