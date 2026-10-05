import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const count = await prisma.user.count();
  return NextResponse.json({ setupRequired: count === 0 });
}

export async function POST(request) {
  try {
    const count = await prisma.user.count();
    if (count !== 0) {
      return NextResponse.json({ error: "Initial setup is already completed." }, { status: 409 });
    }

    const body = await request.json();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase() || null;
    const password = String(body.password || "");

    if (!/^[a-zA-Z0-9._-]{4,40}$/.test(username)) {
      return NextResponse.json({ error: "Username must be 4-40 characters and use letters, numbers, dot, underscore or hyphen." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" }
    });

    return NextResponse.json({ ok: true, username: user.username, role: user.role }, { status: 201 });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Unable to complete initial setup." }, { status: 500 });
  }
}
