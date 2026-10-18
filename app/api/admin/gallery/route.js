import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const MAX_IMAGE_LENGTH = 1_300_000;
function fail(message, status = 400) { return NextResponse.json({ error: message }, { status }); }
function validImage(value) {
  const url = String(value || "").trim();
  if (!url || url.length > MAX_IMAGE_LENGTH) throw new Error("Each image must be under 900 KB or use a direct image URL.");
  if (!/^https?:\/\//i.test(url) && !/^data:image\/(png|jpeg|webp|gif);base64,/i.test(url)) throw new Error("Use a direct HTTP/HTTPS image URL or a PNG/JPG/WEBP/GIF image.");
  return url;
}
async function admin() {
  const user = await getSessionUser();
  if (!user) return { error: fail("Unauthorized", 401) };
  if (!ADMIN_ROLES.includes(user.role)) return { error: fail("Forbidden", 403) };
  return { user };
}
export async function GET() {
  const auth = await admin(); if (auth.error) return auth.error;
  try {
    const albums = await prisma.galleryAlbum.findMany({ include: { images: { orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" }, take: 200 });
    return NextResponse.json({ albums });
  } catch (error) { console.error("Gallery admin GET:", error); return fail("Unable to load gallery albums.", 500); }
}
export async function POST(request) {
  const auth = await admin(); if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const action = String(body.action || "album").toLowerCase();
    if (action === "image") {
      const albumId = String(body.albumId || "").trim();
      const images = Array.isArray(body.images) ? body.images : [body.image];
      if (!albumId || !images.length || images.length > 20) return fail("Choose an album and upload 1–20 images at a time.");
      const album = await prisma.galleryAlbum.findUnique({ where: { id: albumId }, select: { id: true } });
      if (!album) return fail("Album not found.", 404);
      const data = images.map(item => ({ albumId, url: validImage(typeof item === "string" ? item : item.url), caption: typeof item === "string" ? null : String(item.caption || "").trim().slice(0, 250) || null }));
      const created = await prisma.galleryImage.createMany({ data });
      const first = data[0]?.url;
      if (first) await prisma.galleryAlbum.update({ where: { id: albumId }, data: { coverUrl: first } }).catch(() => {});
      return NextResponse.json({ success: true, count: created.count }, { status: 201 });
    }
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const coverUrl = body.coverUrl ? validImage(body.coverUrl) : null;
    const published = Boolean(body.published);
    if (!title || title.length > 180) return fail("Album title is required (maximum 180 characters).");
    if (description.length > 3000) return fail("Description must be under 3,000 characters.");
    const id = String(body.id || "").trim();
    const album = id
      ? await prisma.galleryAlbum.update({ where: { id }, data: { title, description: description || null, coverUrl, published } })
      : await prisma.galleryAlbum.create({ data: { title, description: description || null, coverUrl, published } });
    await prisma.auditLog.create({ data: { userId: auth.user.id, action: id ? "UPDATE_GALLERY_ALBUM" : "CREATE_GALLERY_ALBUM", module: "GALLERY", recordId: album.id, metadata: JSON.stringify({ title, published }) } }).catch(() => {});
    return NextResponse.json({ success: true, album }, { status: id ? 200 : 201 });
  } catch (error) {
    if (error.code === "P2025") return fail("Album not found.", 404);
    return fail(error.message || "Unable to save gallery album.");
  }
}
export async function DELETE(request) {
  const auth = await admin(); if (auth.error) return auth.error;
  const params = new URL(request.url).searchParams;
  const imageId = params.get("imageId");
  const albumId = params.get("albumId");
  try {
    if (imageId) {
      const image = await prisma.galleryImage.delete({ where: { id: imageId } });
      const next = await prisma.galleryImage.findFirst({ where: { albumId: image.albumId }, orderBy: { createdAt: "asc" } });
      await prisma.galleryAlbum.update({ where: { id: image.albumId }, data: { coverUrl: next?.url || null } }).catch(() => {});
      return NextResponse.json({ success: true });
    }
    if (albumId) {
      await prisma.galleryAlbum.delete({ where: { id: albumId } });
      await prisma.auditLog.create({ data: { userId: auth.user.id, action: "DELETE_GALLERY_ALBUM", module: "GALLERY", recordId: albumId } }).catch(() => {});
      return NextResponse.json({ success: true });
    }
    return fail("Image ID or album ID is required.");
  } catch (error) {
    if (error.code === "P2025") return fail("Gallery item not found.", 404);
    console.error("Gallery DELETE:", error);
    return fail("Unable to delete gallery item.", 500);
  }
}
