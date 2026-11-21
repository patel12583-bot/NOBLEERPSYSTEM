import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || "").trim();
    const normalized = identifier.toLowerCase();
    const password = String(body.password || "");
    if (!identifier || !password) return NextResponse.json({ error: "Enter your email/member ID and password." }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { username: normalized }, { email: normalized }] } });
    if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Incorrect login details. Please try again." }, { status: 401 });
    }
    const clubRoles = ["SUPER_ADMIN", "ADMIN", "TREASURER", "SCORER", "MEMBER"];
    if (!clubRoles.includes(user.role)) return NextResponse.json({ error: "This account does not have Royal Cricket Club access." }, { status: 403 });

    await createSession(user.id);
    const profile = await prisma.memberProfile.findUnique({ where: { userId: user.id }, select: { name: true, memberCode: true } }).catch(() => null);
    return NextResponse.json({ ok: true, user: { username: user.username, email: user.email, role: user.role, name: profile?.name || user.username, memberCode: profile?.memberCode || null } });
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "UNKNOWN";
    console.error("Royal Club login error:", { name: error?.name, code, message: error?.message });
    if (["P1001", "P1002", "P1017", "P2024"].includes(code) || error?.name === "PrismaClientInitializationError") return NextResponse.json({ error: "Database connection failed. Check the Production DATABASE_URL in Vercel." }, { status: 503 });
    if (code === "P2021" || code === "P2022") return NextResponse.json({ error: "Royal Cricket Club database setup is not complete yet. Please contact the club administrator." }, { status: 503 });
    return NextResponse.json({ error: "Login service is temporarily unavailable." }, { status: 500 });
  }
}
