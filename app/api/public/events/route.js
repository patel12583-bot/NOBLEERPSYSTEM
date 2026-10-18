import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const events = await prisma.collegeEvent.findMany({
      where: { status: "PUBLISHED", eventDate: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      orderBy: [{ eventDate: "asc" }],
      take: 30,
      select: { id: true, title: true, description: true, category: true, eventDate: true, eventTime: true, venue: true, imageUrl: true, status: true }
    });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Public events GET error:", error);
    return NextResponse.json({ error: "Unable to load events." }, { status: 500 });
  }
}
