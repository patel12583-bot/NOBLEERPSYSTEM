import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const user = await getSessionUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) return null;
  return user;
}

export async function GET() {
  if (!await guard()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const institute = await prisma.institute.findFirst({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ institute });
}

export async function PUT(request) {
  const user = await guard();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const name = String(body.name || "").trim();
  const address = String(body.address || "").trim();
  if (!name || !address) return NextResponse.json({ error: "Institute name and address are required." }, { status: 400 });

  const existing = await prisma.institute.findFirst({ orderBy: { createdAt: "asc" } });
  const data = {
    name,
    address,
    phone1: String(body.phone1 || "").trim() || null,
    phone2: String(body.phone2 || "").trim() || null,
    email: String(body.email || "").trim().toLowerCase() || null,
    logoUrl: String(body.logoUrl || "").trim() || null
  };
  const institute = existing
    ? await prisma.institute.update({ where: { id: existing.id }, data })
    : await prisma.institute.create({ data });
  return NextResponse.json({ institute });
}
