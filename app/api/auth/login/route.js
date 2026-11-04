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

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { username: normalizedIdentifier },
          { email: normalizedIdentifier }
        ]
      }
    });

    if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "This portal is restricted to authorised administrators." }, { status: 403 });
    }

    await createSession(user.id);
    return NextResponse.json({
      ok: true,
      user: { username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "UNKNOWN";
    console.error("Login error:", {
      name: error?.name,
      code,
      message: error?.message,
      meta: error?.meta
    });

    if (code === "P2021" || code === "P2022") {
      return NextResponse.json({
        error: "The database tables are not ready yet. The administrator database setup needs to be completed.",
        code: "DATABASE_SCHEMA_NOT_READY"
      }, { status: 503 });
    }

    if (["P1001", "P1002", "P1017", "P2024"].includes(code) || error?.name === "PrismaClientInitializationError") {
      return NextResponse.json({
        error: "The database is not reachable right now. Please check the Production DATABASE_URL setting in Vercel.",
        code: "DATABASE_CONNECTION_ERROR"
      }, { status: 503 });
    }

    return NextResponse.json({
      error: "The login service encountered a server error. Please check the Vercel Function Logs.",
      code: "LOGIN_SERVICE_ERROR"
    }, { status: 500 });
  }
}
