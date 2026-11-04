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
    const normalizedIdentifier = identifier.toLowerCase();
    const password = String(body.password || "");
    if (!identifier || !password) {
      return NextResponse.json({ error: "Admin username/email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { username: normalizedIdentifier },
          { email: normalizedIdentifier }
        ]
      }
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role) || user.status !== "ACTIVE" || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({
      ok: true,
      user: { username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Unable to sign in right now. Check database connectivity." }, { status: 500 });
  }
}
