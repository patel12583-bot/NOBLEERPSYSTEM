import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getSessionUser} from "@/lib/auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const STAFF=["SUPER_ADMIN","ADMIN","HOD"];

async function current(){ return await getSessionUser(); }

function validDates(fromDate,toDate){
  if(!fromDate||!toDate) return false;
  return new Date(fromDate+"T00:00:00") <= new Date(toDate+"T23:59:59");
}

export async function GET(req){
  const user=await current();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const q=new URL(req.url).searchParams;
  const status=q.get("status");
  const type=q.get("type")||"ALL";
  const baseStatus=status?{status}:{}; 

  try{
    if(user.role==="STUDENT"){
      const student=await prisma.student.findUnique({where:{userId:user.id}});
      if(!student) return NextResponse.json({studentLeaves:[],facultyLeaves:[],role:user.role});
      const rows=await prisma.leave.findMany({where:{studentId:student.id,...baseStatus},orderBy:{createdAt:"desc"}});
      return NextResponse.json({studentLeaves:rows,facultyLeaves:[],role:user.role});
    }

    if(user.role==="FACULTY"){
      const faculty=await prisma.faculty.findUnique({where:{userId:user.id}});
      if(!faculty) return NextResponse.json({studentLeaves:[],facultyLeaves:[],role:user.role});
      const rows=await prisma.facultyLeave.findMany({where:{facultyId:faculty.id,...baseStatus},orderBy:{createdAt:"desc"}});
      return NextResponse.json({studentLeaves:[],facultyLeaves:rows,role:user.role});
    }

    if(!STAFF.includes(user.role)) return NextResponse.json({error:"Leave access denied."},{status:403});

    let studentWhere={...baseStatus};
    let facultyWhere={...baseStatus};
    if(user.role==="HOD"){
      const departments=await prisma.department.findMany({where:{hodId:{not:null},hod:{userId:user.id}},select:{id:true}});
      const ids=departments.map(d=>d.id);
      studentWhere={...studentWhere,student:{departmentId:{in:ids}}};
      facultyWhere={...facultyWhere,faculty:{departmentId:{in:ids}}};
    }

    const [studentLeaves,facultyLeaves]=await Promise.all([
      type==="FACULTY"?[]:prisma.leave.findMany({where:studentWhere,include:{student:{select:{id:true,studentId:true,name:true,department:{select:{name:true}}}}},orderBy:{createdAt:"desc"}}),
      type==="STUDENT"?[]:prisma.facultyLeave.findMany({where:facultyWhere,include:{faculty:{select:{id:true,facultyId:true,name:true,department:{select:{name:true}}}}},orderBy:{createdAt:"desc"}})
    ]);
    return NextResponse.json({studentLeaves,facultyLeaves,role:user.role});
  }catch(e){
    return NextResponse.json({error:"Unable to load leave records."},{status:500});
  }
}

export async function POST(req){
  const user=await current();
  if(!user||!["STUDENT","FACULTY"].includes(user.role)) return NextResponse.json({error:"Only students and faculty can apply for leave."},{status:403});
  try{
    const b=await req.json();
    if(!validDates(b.fromDate,b.toDate)||!String(b.reason||"").trim()) return NextResponse.json({error:"Valid dates and reason are required."},{status:400});
    const fromDate=new Date(b.fromDate+"T00:00:00"), toDate=new Date(b.toDate+"T00:00:00"), reason=String(b.reason).trim();
    if(user.role==="STUDENT"){
      const student=await prisma.student.findUnique({where:{userId:user.id}});
      if(!student) return NextResponse.json({error:"Student profile not found."},{status:404});
      const row=await prisma.leave.create({data:{studentId:student.id,fromDate,toDate,reason}});
      return NextResponse.json({leave:row},{status:201});
    }
    const faculty=await prisma.faculty.findUnique({where:{userId:user.id}});
    if(!faculty) return NextResponse.json({error:"Faculty profile not found."},{status:404});
    const row=await prisma.facultyLeave.create({data:{facultyId:faculty.id,fromDate,toDate,reason}});
    return NextResponse.json({leave:row},{status:201});
  }catch(e){ return NextResponse.json({error:"Unable to apply for leave."},{status:400}); }
}

export async function PUT(req){
  const user=await current();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  try{
    const b=await req.json();
    const action=b.action;
    const id=b.id;
    if(!id||!action) return NextResponse.json({error:"Leave id and action are required."},{status:400});

    if(action==="approve"||action==="reject"){
      if(!STAFF.includes(user.role)) return NextResponse.json({error:"You cannot approve or reject leave."},{status:403});
      const status=action==="approve"?"APPROVED":"REJECTED";
      if(b.type==="FACULTY") return NextResponse.json({leave:await prisma.facultyLeave.update({where:{id},data:{status}})});
      return NextResponse.json({leave:await prisma.leave.update({where:{id},data:{status}})});
    }

    if(action==="cancel"){
      if(!["STUDENT","FACULTY"].includes(user.role)) return NextResponse.json({error:"You cannot cancel this leave."},{status:403});
      if(user.role==="STUDENT"){
        const student=await prisma.student.findUnique({where:{userId:user.id}});
        const row=await prisma.leave.findFirst({where:{id,studentId:student?.id,status:"PENDING"}});
        if(!row) return NextResponse.json({error:"Only your pending leave can be cancelled."},{status:403});
        return NextResponse.json({leave:await prisma.leave.update({where:{id},data:{status:"CANCELLED"}})});
      }
      const faculty=await prisma.faculty.findUnique({where:{userId:user.id}});
      const row=await prisma.facultyLeave.findFirst({where:{id,facultyId:faculty?.id,status:"PENDING"}});
      if(!row) return NextResponse.json({error:"Only your pending leave can be cancelled."},{status:403});
      return NextResponse.json({leave:await prisma.facultyLeave.update({where:{id},data:{status:"CANCELLED"}})});
    }
    return NextResponse.json({error:"Invalid action."},{status:400});
  }catch(e){ return NextResponse.json({error:"Unable to update leave status."},{status:400}); }
}