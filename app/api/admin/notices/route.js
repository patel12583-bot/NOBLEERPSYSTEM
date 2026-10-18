import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const MAX_ATTACHMENT_CHARS = 1_300_000;

function responseError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseNotice(body) {
  const title = String(body.title || "").trim();
  const content = String(body.content || body.description || "").trim();
  const category = String(body.category || "GENERAL").trim().slice(0, 60);
  const audience = String(body.audience || "ALL").trim().toUpperCase();
  const publishDate = body.publishDate ? new Date(body.publishDate) : new Date();
  const expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
  const attachmentUrl = String(body.attachmentUrl || "").trim();
  const status = String(body.status || "DRAFT").toUpperCase();

  if (!title || title.length > 180) throw new Error("Notice title is required and must be under 180 characters.");
  if (!content || content.length > 10000) throw new Error("Description is required and must be under 10,000 characters.");
  if (!["DRAFT", "PUBLISHED", "SCHEDULED"].includes(status)) throw new Error("Choose Draft, Published, or Scheduled status.");
  if (Number.isNaN(publishDate.getTime())) throw new Error("Enter a valid publish date.");
  if (expiryDate && Number.isNaN(expiryDate.getTime())) throw new Error("Enter a valid expiry date.");
  if (expiryDate && expiryDate < publishDate) throw new Error("Expiry date must be after the publish date.");
  if (attachmentUrl.length > MAX_ATTACHMENT_CHARS) throw new Error("Attachment is too large. Use a file under 900 KB or provide a file URL.");
  if (attachmentUrl && !/^https?:\/\//i.test(attachmentUrl) && !/^data:(application\/pdf|image\/(png|jpeg|webp)|text\/plain);base64,/i.test(attachmentUrl)) {
    throw new Error("Attachment must be a valid HTTPS/HTTP link or PDF/image data URL.");
  }
  const published = status !== "DRAFT";
  return {
    title, content, category, audience,
    scheduledAt: status === "DRAFT" ? publishDate : (status === "SCHEDULED" || publishDate > new Date() ? publishDate : null),
    published,
    publishedAt: published && publishDate <= new Date() ? publishDate : null,
    expiryDate,
    attachmentUrl: attachmentUrl || null
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return responseError("Unauthorized", 401);
  if (!ADMIN_ROLES.includes(user.role)) return responseError("Forbidden", 403);
  try {
    const notices = await prisma.notice.findMany({ orderBy: [{ createdAt: "desc" }], take: 250 });
    const now = new Date();
    return NextResponse.json({
      notices: notices.map((n) => ({
        ...n,
        status: !n.published ? "DRAFT" : n.scheduledAt && n.scheduledAt > now ? "SCHEDULED" : "PUBLISHED",
        publishDate: n.scheduledAt || n.publishedAt || n.createdAt,
        description: n.content
      }))
    });
  } catch (error) {
    console.error("Admin notices GET error:", error);
    return responseError("Unable to load notices.", 500);
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return responseError("Unauthorized", 401);
  if (!ADMIN_ROLES.includes(user.role)) return responseError("Forbidden", 403);
  try {
    const body = await request.json();
    const data = parseNotice(body);
    const notice = await prisma.notice.create({ data });
    await prisma.auditLog.create({ data: { userId: user.id, action: "CREATE_NOTICE", module: "NOTICES", recordId: notice.id, metadata: JSON.stringify({ title: notice.title, status: body.status || "DRAFT" }) } }).catch(() => {});
    return NextResponse.json({ success: true, notice }, { status: 201 });
  } catch (error) {
    return responseError(error.message || "Unable to create notice.", 400);
  }
}

export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return responseError("Unauthorized", 401);
  if (!ADMIN_ROLES.includes(user.role)) return responseError("Forbidden", 403);
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) return responseError("Notice ID is required.");
    const data = parseNotice(body);
    const notice = await prisma.notice.update({ where: { id }, data });
    await prisma.auditLog.create({ data: { userId: user.id, action: "UPDATE_NOTICE", module: "NOTICES", recordId: notice.id, metadata: JSON.stringify({ title: notice.title, status: body.status || "DRAFT" }) } }).catch(() => {});
    return NextResponse.json({ success: true, notice });
  } catch (error) {
    if (error.code === "P2025") return responseError("Notice not found.", 404);
    return responseError(error.message || "Unable to update notice.", 400);
  }
}

export async function DELETE(request) {
  const user = await getSessionUser();
  if (!user) return responseError("Unauthorized", 401);
  if (!ADMIN_ROLES.includes(user.role)) return responseError("Forbidden", 403);
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return responseError("Notice ID is required.");
    await prisma.notice.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "DELETE_NOTICE", module: "NOTICES", recordId: id } }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === "P2025") return responseError("Notice not found.", 404);
    console.error("Admin notice DELETE error:", error);
    return responseError("Unable to delete notice.", 500);
  }
}
