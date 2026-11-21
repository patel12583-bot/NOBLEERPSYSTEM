import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const members = await prisma.memberProfile.findMany({ orderBy: { joinedAt: "desc" }, select: { id: true, memberCode: true, name: true, mobile: true, jerseyNumber: true, battingStyle: true, bowlingStyle: true, joinedAt: true, user: { select: { email: true, status: true, role: true } } } });
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Member directory error:", error?.code || error?.message);
    return NextResponse.json({ error: "Member directory is not ready yet." }, { status: 503 });
  }
}
