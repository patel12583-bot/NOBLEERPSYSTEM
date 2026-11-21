import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const writers = ["SUPER_ADMIN", "ADMIN", "TREASURER"];
const types = ["CONTRIBUTION", "INCOME", "EXPENSE", "ADJUSTMENT"];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const entries = await prisma.financeEntry.findMany({ orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }], take: 500 });
    const approved = entries.filter(e => e.status === "APPROVED");
    const income = approved.filter(e => e.type !== "EXPENSE").reduce((s,e) => s + Number(e.amount),0);
    const expenses = approved.filter(e => e.type === "EXPENSE").reduce((s,e) => s + Number(e.amount),0);
    return NextResponse.json({
      entries: entries.map(e => ({ ...e, amount: Number(e.amount) })),
      summary: { totalIncome: income, totalExpenses: expenses, balance: income-expenses },
      canWrite: writers.includes(user.role)
    });
  } catch (error) {
    console.error("Finance ledger error:", error?.code || error?.message);
    return NextResponse.json({ error: "Finance ledger is not ready. Apply the DCA Cricket Club database migration first." }, { status: 503 });
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!writers.includes(user.role)) return NextResponse.json({ error: "You do not have permission to add finance entries." }, { status: 403 });
  try {
    const body = await request.json();
    const type = String(body.type || ""), category = String(body.category || "").trim().slice(0,80);
    const description = String(body.description || "").trim().slice(0,500);
    const amount = Number(body.amount), occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    if (!types.includes(type) || !category || !description || !Number.isFinite(amount) || amount <= 0 || amount > 100000000 || Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: "Enter a valid type, category, description, amount and date." }, { status: 400 });
    }
    const entry = await prisma.financeEntry.create({ data: {
      type, category, description, amount: amount.toFixed(2), occurredAt,
      reference: String(body.reference || "").trim().slice(0,100) || null, createdById: user.id
    }});
    await prisma.auditLog.create({ data: { userId:user.id, action:"FINANCE_ENTRY_CREATED", module:"ROYAL_FINANCE", recordId:entry.id, metadata:JSON.stringify({type,amount,category}) }});
    return NextResponse.json({ ok:true, entry:{...entry,amount:Number(entry.amount)} },{status:201});
  } catch(error) {
    console.error("Finance entry create error:",error?.code||error?.message);
    return NextResponse.json({error:"Unable to save this finance entry."},{status:500});
  }
}
