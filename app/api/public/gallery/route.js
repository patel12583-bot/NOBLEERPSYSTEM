import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const albums = await prisma.galleryAlbum.findMany({
      where: { published: true },
      include: { images: { orderBy: { createdAt: "asc" }, select: { id: true, url: true, caption: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return NextResponse.json({ albums });
  } catch (error) {
    console.error("Public gallery GET:", error);
    return NextResponse.json({ error: "Unable to load gallery." }, { status: 500 });
  }
}
