import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const u = await getSessionUser();
  return u && ["SUPER_ADMIN","ADMIN","HR_STAFF"].includes(u.role) ? u : null;
}

function monthKey(v) {
  if (!/^\d{4}-\d{2}$/.test(v || "")) throw new Error("Month must be YYYY-MM.");
  return v;
}

export async function GET() {
  const u = await guard();
  if (!u) return NextResponse.json({error:"Unauthorized"}, {status:401});
  const staff = await prisma.faculty.findMany({
    where:{status:"ACTIVE"},
    orderBy:{name:"asc"},
    include:{department:{select:{id:true,code:true,name:true}}}
  });
  const logs = await prisma.auditLog.findMany({
    where:{module:"PAYROLL"},
    orderBy:{createdAt:"desc"},
    take:300
  });
  const payroll = logs.map(x => {
    try { return {...JSON.parse(x.metadata || "{}"), auditId:x.id, createdAt:x.createdAt}; }
    catch { return {auditId:x.id, createdAt:x.createdAt}; }
  });
  return NextResponse.json({staff,payroll});
}

export async function POST(req) {
  const u = await guard();
  if (!u) return NextResponse.json({error:"Unauthorized"}, {status:401});
  try {
    const b = await req.json();
    if (!b.facultyId) throw new Error("Staff member is required.");
    const month = monthKey(b.month);
    const f = await prisma.faculty.findUnique({where:{id:b.facultyId},include:{department:true}});
    if (!f) throw new Error("Staff member not found.");
    const basic = Number(b.basic||0), allowances = Number(b.allowances||0), deductions = Number(b.deductions||0);
    if (![basic,allowances,deductions].every(Number.isFinite) || basic < 0 || allowances < 0 || deductions < 0) throw new Error("Invalid salary values.");
    const net = Math.max(0,basic+allowances-deductions);
    const record = {
      facultyId:f.id, facultyIdCode:f.facultyId, name:f.name, month, basic, allowances, deductions, net,
      status:"PROCESSED", department:f.department?.name || "", processedBy:u.username || u.email || u.id
    };
    const existing = await prisma.auditLog.findFirst({where:{module:"PAYROLL",action:"PAYROLL_PROCESSED",recordId:f.id,metadata:{contains:'"month":"'+month+'"'}}});
    if (existing) return NextResponse.json({error:"Payroll for this staff member and month already exists."},{status:409});
    const row = await prisma.auditLog.create({data:{userId:u.id,action:"PAYROLL_PROCESSED",module:"PAYROLL",recordId:f.id,metadata:JSON.stringify(record)}});
    return NextResponse.json({ok:true,payroll:{...record,auditId:row.id,createdAt:row.createdAt}},{status:201});
  } catch(e) {
    return NextResponse.json({error:e.message || "Unable to process payroll."},{status:400});
  }
}

export async function DELETE(req) {
  const u = await guard();
  if (!u || !["SUPER_ADMIN","ADMIN"].includes(u.role)) return NextResponse.json({error:"Only Admin/Super Admin can remove payroll records."},{status:403});
  const {id} = await req.json();
  await prisma.auditLog.delete({where:{id}});
  return NextResponse.json({ok:true});
}
