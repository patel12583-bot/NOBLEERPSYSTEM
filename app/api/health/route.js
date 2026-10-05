import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;
    return NextResponse.json({
      ok: true,
      database: "connected",
      tables: Number(tables[0]?.count ?? 0),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { ok: false, database: "unavailable", message: "Database connection or schema setup failed." },
      { status: 503 }
    );
  }
}
