import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admins = ["ADMIN", "SUPER_ADMIN"];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    const members = await prisma.memberProfile.findMany({
      orderBy: [{ approvalStatus: "asc" }, { joinedAt: "desc" }],
      select: {
        id: true, memberCode: true, name: true, mobile: true, jerseyNumber: true,
        battingStyle: true, bowlingStyle: true, joinedAt: true, approvalStatus: true,
        user: { select: { email: true, status: true, role: true } }
      }
    });
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Member directory error:", error?.code || error?.message);
    return NextResponse.json({ error: "Member directory is not ready yet. Apply the club database migration first." }, { status: 503 });
  }
}

export async function PATCH(request) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!admins.includes(actor.role)) return NextResponse.json({ error: "Only club Admins can review member applications." }, { status: 403 });
  try {
    const body = await request.json();
    const memberId = String(body.memberId || "");
    const approvalStatus = String(body.approvalStatus || "");
    if (!memberId || !["ACTIVE", "REJECTED", "SUSPENDED", "PENDING"].includes(approvalStatus)) {
      return NextResponse.json({ error: "Choose a valid member and approval status." }, { status: 400 });
    }
    const member = await prisma.memberProfile.update({
      where: { id: memberId },
      data: { approvalStatus },
      select: { id: true, name: true, memberCode: true, approvalStatus: true, userId: true }
    });
    await prisma.auditLog.create({
      data: { userId: actor.id, action: "MEMBER_STATUS_CHANGED", module: "ROYAL_MEMBERS", recordId: member.id, metadata: JSON.stringify({ approvalStatus, memberCode: member.memberCode }) }
    });
    return NextResponse.json({ ok: true, member });
  } catch (error) {
    console.error("Member approval error:", error?.code || error?.message);
    return NextResponse.json({ error: "Unable to update this membership right now." }, { status: 500 });
  }
}
