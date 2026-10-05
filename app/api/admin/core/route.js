import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowed = {
  departments: { model: "department", fields: ["code","name"] },
  programs: { model: "program", fields: ["code","name","durationYears","departmentId"] },
  academicYears: { model: "academicYear", fields: ["name","startDate","endDate","active"] },
  semesters: { model: "semester", fields: ["number","name","academicYearId"] },
  divisions: { model: "division", fields: ["name","capacity","programId","semesterId"] },
  rooms: { model: "room", fields: ["code","name","capacity","type"] },
  subjects: { model: "subject", fields: ["code","name","credits","type","departmentId","programId","semesterId"] },
  books: { model: "book", fields: ["isbn","title","author","category","quantity","available"] },
  notices: { model: "notice", fields: ["title","content","audience","published"] }
};

async function guard() {
  const user = await getSessionUser();
  if (!user || !["SUPER_ADMIN","ADMIN","HOD"].includes(user.role)) return null;
  return user;
}

function clean(data, fields) {
  const out = {};
  for (const key of fields) if (data[key] !== undefined) out[key] = data[key];
  if (out.durationYears !== undefined) out.durationYears = Number(out.durationYears);
  if (out.number !== undefined) out.number = Number(out.number);
  if (out.capacity !== undefined) out.capacity = out.capacity === "" ? null : Number(out.capacity);
  if (out.credits !== undefined) out.credits = out.credits === "" ? null : Number(out.credits);
  if (out.quantity !== undefined) out.quantity = Number(out.quantity);
  if (out.available !== undefined) out.available = Number(out.available);
  if (out.active !== undefined) out.active = Boolean(out.active);
  if (out.published !== undefined) out.published = Boolean(out.published);
  if (out.startDate) out.startDate = new Date(out.startDate);
  if (out.endDate) out.endDate = new Date(out.endDate);
  return out;
}

export async function GET(request) {
  const user = await guard();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const key = new URL(request.url).searchParams.get("module");
  const cfg = allowed[key];
  if (!cfg) return NextResponse.json({error:"Invalid module"},{status:400});
  const rows = await prisma[cfg.model].findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ rows });
}

export async function POST(request) {
  const user = await guard();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await request.json();
  const cfg = allowed[body.module];
  if (!cfg) return NextResponse.json({error:"Invalid module"},{status:400});
  try {
    const row = await prisma[cfg.model].create({ data: clean(body.data || {}, cfg.fields) });
    return NextResponse.json({ row }, {status:201});
  } catch (e) {
    console.error(e);
    return NextResponse.json({error:"Unable to save. Check required fields or duplicate values."},{status:400});
  }
}

export async function PUT(request) {
  const user = await guard();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await request.json();
  const cfg = allowed[body.module];
  if (!cfg || !body.id) return NextResponse.json({error:"Invalid request"},{status:400});
  try {
    const row = await prisma[cfg.model].update({where:{id:body.id},data:clean(body.data||{},cfg.fields)});
    return NextResponse.json({row});
  } catch (e) {
    console.error(e);
    return NextResponse.json({error:"Unable to update record."},{status:400});
  }
}

export async function DELETE(request) {
  const user = await guard();
  if (!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body = await request.json();
  const cfg = allowed[body.module];
  if (!cfg || !body.id) return NextResponse.json({error:"Invalid request"},{status:400});
  try {
    await prisma[cfg.model].delete({where:{id:body.id}});
    return NextResponse.json({ok:true});
  } catch (e) {
    console.error(e);
    return NextResponse.json({error:"Record cannot be deleted because it is being used by another ERP record."},{status:409});
  }
}
