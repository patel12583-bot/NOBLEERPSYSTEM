import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  try {
    const expectedCode = process.env.ADMIN_SIGNUP_SECRET;
    if (!expectedCode) {
      return NextResponse.json({ error: "Admin registration is not configured yet. Ask the system owner to set ADMIN_SIGNUP_SECRET in Vercel." }, { status: 503 });
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const setupCode = String(body.setupCode || "");
    const password = String(body.password || "");

    if (!email || !setupCode || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 10 || password.length > 128) {
      return NextResponse.json({ error: "Password must be between 10 and 128 characters." }, { status: 400 });
    }
    if (!safeEqual(setupCode, expectedCode)) {
      return NextResponse.json({ error: "The admin setup code is incorrect." }, { status: 403 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: email }] },
      select: { id: true }
    });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Please sign in instead." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username: email,
        email,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE"
      },
      select: { id: true, username: true, email: true, role: true }
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error("Admin registration error:", error);
    return NextResponse.json({ error: "Unable to create the admin account right now." }, { status: 500 });
  }
}
