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
      return NextResponse.json({ error: "User ID/email and password are required." }, { status: 400 });
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: normalizedIdentifier },
          { email: normalizedIdentifier }
        ]
      }
    });

    // Student IDs are shown after self-registration, so support them as login identifiers too.
    if (!user) {
      const student = await prisma.student.findUnique({
        where: { studentId: identifier.toUpperCase() },
        include: { user: true }
      });
      user = student?.user || null;
    }

    if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({
      ok: true,
      user: { username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
