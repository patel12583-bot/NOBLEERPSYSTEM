import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const notices = await prisma.notice.findMany({
      where: {
        published: true,
        audience: { in: ["ALL", "EVERYONE", "PUBLIC"] },
        AND: [
          { OR: [{ expiryDate: null }, { expiryDate: { gte: now } }] },
          { OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] }
        ]
      },
      orderBy: { publishedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        publishedAt: true,
        attachmentUrl: true
      }
    });
    return NextResponse.json(
      { notices },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Public notices API error:", error);
    return NextResponse.json({ notices: [] }, { status: 200 });
  }
}
