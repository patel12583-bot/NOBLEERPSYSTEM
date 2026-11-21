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
  if (!admins.includes(actor.role)) return NextResponse.json({ error: "Only club Admins can manage memberships." }, { status: 403 });
  try {
    const body = await request.json();
    const memberId = String(body.memberId || "");
    const approvalStatus = body.approvalStatus === undefined ? null : String(body.approvalStatus);
    const requestedRole = body.role === undefined ? null : String(body.role);
    if (!memberId || (!approvalStatus && !requestedRole)) return NextResponse.json({ error: "Choose a member and a change to apply." }, { status: 400 });
    if (approvalStatus && !["ACTIVE", "REJECTED", "SUSPENDED", "PENDING"].includes(approvalStatus)) return NextResponse.json({ error: "Invalid membership status." }, { status: 400 });
    if (requestedRole && !["MEMBER", "TREASURER", "SCORER", "ADMIN"].includes(requestedRole)) return NextResponse.json({ error: "Invalid club role." }, { status: 400 });
    if (requestedRole === "ADMIN" && actor.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Only a Super Admin can assign the Admin role." }, { status: 403 });
    const current = await prisma.memberProfile.findUnique({ where: { id: memberId }, select: { id: true, userId: true, memberCode: true, name: true } });
    if (!current) return NextResponse.json({ error: "Member not found." }, { status: 404 });
    if (current.userId === actor.id && requestedRole) return NextResponse.json({ error: "You cannot change your own role." }, { status: 409 });
    const result = await prisma.$transaction(async tx => {
      const member = approvalStatus ? await tx.memberProfile.update({ where: { id: memberId }, data: { approvalStatus }, select: { id: true, name: true, memberCode: true, approvalStatus: true, userId: true } }) : await tx.memberProfile.findUnique({ where: { id: memberId }, select: { id: true, name: true, memberCode: true, approvalStatus: true, userId: true } });
      const user = requestedRole ? await tx.user.update({ where: { id: current.userId }, data: { role: requestedRole }, select: { role: true } }) : await tx.user.findUnique({ where: { id: current.userId }, select: { role: true } });
      return { member, role: user.role };
    });
    await prisma.auditLog.create({
      data: { userId: actor.id, action: "MEMBER_ACCESS_UPDATED", module: "ROYAL_MEMBERS", recordId: current.id, metadata: JSON.stringify({ approvalStatus, role: requestedRole, memberCode: current.memberCode }) }
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Member management error:", error?.code || error?.message);
    return NextResponse.json({ error: "Unable to update this membership right now." }, { status: 500 });
  }
}
