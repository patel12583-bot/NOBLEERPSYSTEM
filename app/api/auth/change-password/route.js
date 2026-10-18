import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try {
    const body = await request.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    if (!currentPassword || !newPassword) return NextResponse.json({ error: "Current and new passwords are required." }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: "New password must contain at least 8 characters." }, { status: 400 });
    if (newPassword === currentPassword) return NextResponse.json({ error: "Choose a new password different from your current password." }, { status: 400 });
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return NextResponse.json({ ok: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Unable to change password right now." }, { status: 500 });
  }
}
