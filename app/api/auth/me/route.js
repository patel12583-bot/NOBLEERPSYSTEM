import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    const profile = await prisma.memberProfile.findUnique({
      where: { userId: user.id },
      select: { name: true, memberCode: true, approvalStatus: true, mobile: true }
    });
    return NextResponse.json({ authenticated: true, user: {
      id: user.id, username: user.username, email: user.email, role: user.role,
      name: profile?.name || user.username, memberCode: profile?.memberCode || null,
      approvalStatus: profile?.approvalStatus || "ACTIVE", mobile: profile?.mobile || null
    } });
  } catch (error) {
    console.error("Session profile error:", error?.code || error?.message);
    return NextResponse.json({ error: "Unable to load your session." }, { status: 503 });
  }
}
