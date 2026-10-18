import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const mobile = String(body.mobile || "").trim();
    const password = String(body.password || "");

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 6 and 128 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: email }] },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const studentId = "NOBLE-" + Date.now().toString(36).toUpperCase();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { username: email, email, passwordHash, role: "STUDENT" },
      });
      const student = await tx.student.create({
        data: { studentId, name, email, mobile: mobile || null, userId: user.id },
      });
      return { user, student };
    });

    return NextResponse.json({
      success: true,
      studentId: result.student.studentId,
      email: result.user.email,
    });
  } catch (error) {
    // Unique indexes are the final guard against two simultaneous registrations
    // using the same email/username. Report that conflict clearly instead of 500.
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    console.error("REGISTER_ERROR", error);
    return NextResponse.json(
      { error: "Unable to create account right now." },
      { status: 500 }
    );
  }
}
