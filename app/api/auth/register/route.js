import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const mobile = String(body.mobile || "").replace(/[^0-9+]/g, "").slice(0, 16);
    const password = String(body.password || "");
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter your full name and a valid email address." }, { status: 400 });
    if (password.length < 8 || password.length > 128) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username: email }] }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const memberCode = "RCC-" + randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const result = await prisma.$transaction(async tx => {
      const user = await tx.user.create({ data: { username: email, email, passwordHash, role: "MEMBER", status: "ACTIVE" } });
      const profile = await tx.memberProfile.create({ data: { userId: user.id, memberCode, name, mobile: mobile || null } });
      return { profile };
    });
    return NextResponse.json({ ok: true, memberCode: result.profile.memberCode, message: "Your member account is ready. You can now sign in." }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const code = typeof error?.code === "string" ? error.code : "UNKNOWN";
    console.error("Royal Club registration error:", { code, message: error?.message });
    if (code === "P2021" || code === "P2022") return NextResponse.json({ error: "Member registration database setup is not complete yet. Please contact the administrator." }, { status: 503 });
    return NextResponse.json({ error: "Unable to create your account right now." }, { status: 500 });
  }
}
