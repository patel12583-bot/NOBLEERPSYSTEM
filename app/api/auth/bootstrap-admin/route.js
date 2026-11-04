import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretMatches(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const expectedSecret = process.env.NRS_ADMIN_BOOTSTRAP_SECRET;

    if (!secretMatches(body.setupSecret, expectedSecret)) {
      return NextResponse.json({ error: "Invalid or missing private setup code." }, { status: 403 });
    }

    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || password.length < 8) {
      return NextResponse.json({ error: "Enter an Admin User ID and a password with at least 8 characters." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await prisma.user.findUnique({ where: { username } });

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" }
        })
      : await prisma.user.create({
          data: { username, passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" }
        });

    return NextResponse.json({
      ok: true,
      message: "Admin account created or reset. Remove NRS_ADMIN_BOOTSTRAP_SECRET from Vercel now.",
      username: user.username
    });
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "UNKNOWN";
    console.error("Admin bootstrap error:", { name: error?.name, code, message: error?.message, meta: error?.meta });

    if (["P1001", "P1002", "P1017", "P2024"].includes(code) || error?.name === "PrismaClientInitializationError") {
      return NextResponse.json({ error: "Database connection failed. Check the Production DATABASE_URL in Vercel.", code: "DATABASE_CONNECTION_ERROR" }, { status: 503 });
    }
    if (code === "P2021" || code === "P2022") {
      return NextResponse.json({ error: "Database tables are missing. The Neon database schema must be synchronized before creating the Admin.", code: "DATABASE_SCHEMA_NOT_READY" }, { status: 503 });
    }
    return NextResponse.json({ error: "Admin setup failed. Check the Vercel Function Logs.", code: "ADMIN_SETUP_ERROR" }, { status: 500 });
  }
}
