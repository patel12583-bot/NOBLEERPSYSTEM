import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const writers = ["SUPER_ADMIN", "ADMIN", "TREASURER"];

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!writers.includes(user.role)) return NextResponse.json({ error: "Only authorised finance staff can review entries." }, { status: 403 });
  try {
    const { id } = await params;
    const status = String((await request.json()).status || "");
    if (!["APPROVED","REJECTED","VOID"].includes(status)) return NextResponse.json({error:"Invalid finance status."},{status:400});
    const current = await prisma.financeEntry.findUnique({where:{id}});
    if (!current) return NextResponse.json({error:"Finance entry not found."},{status:404});
    if (["VOID","REJECTED"].includes(current.status)) return NextResponse.json({error:"This entry is already closed."},{status:409});
    const entry = await prisma.financeEntry.update({where:{id},data:{
      status, approvedById:status==="APPROVED"?user.id:null, approvedAt:status==="APPROVED"?new Date():null
    }});
    await prisma.auditLog.create({data:{userId:user.id,action:"FINANCE_ENTRY_STATUS_CHANGED",module:"ROYAL_FINANCE",recordId:id,metadata:JSON.stringify({from:current.status,to:status})}});
    return NextResponse.json({ok:true,entry:{...entry,amount:Number(entry.amount)}});
  } catch(error) {
    console.error("Finance approval error:",error?.code||error?.message);
    return NextResponse.json({error:"Unable to update finance entry."},{status:500});
  }
}
