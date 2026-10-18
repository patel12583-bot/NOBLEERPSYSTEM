import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const CATEGORIES = ["COLLEGE_EVENT", "SEMINAR", "WORKSHOP", "CULTURAL", "SPORTS"];
const MAX_IMAGE_LENGTH = 1_300_000;

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
function parseEvent(body) {
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const category = String(body.category || "COLLEGE_EVENT").toUpperCase();
  const eventDate = body.eventDate ? new Date(body.eventDate) : null;
  const eventTime = String(body.eventTime || "").trim();
  const venue = String(body.venue || "").trim();
  const imageUrl = String(body.imageUrl || "").trim();
  const status = String(body.status || "DRAFT").toUpperCase();

  if (!title || title.length > 180) throw new Error("Event title is required (maximum 180 characters).");
  if (description.length > 10000) throw new Error("Description must be under 10,000 characters.");
  if (!CATEGORIES.includes(category)) throw new Error("Choose a valid event category.");
  if (!eventDate || Number.isNaN(eventDate.getTime())) throw new Error("Enter a valid event date.");
  if (eventTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime)) throw new Error("Enter time in HH:MM format.");
  if (venue.length > 250) throw new Error("Venue must be under 250 characters.");
  if (!["DRAFT", "PUBLISHED", "CANCELLED"].includes(status)) throw new Error("Choose Draft, Published, or Cancelled status.");
  if (imageUrl.length > MAX_IMAGE_LENGTH) throw new Error("Image is too large. Use an image under 900 KB or a direct image URL.");
  if (imageUrl && !/^https?:\/\//i.test(imageUrl) && !/^data:image\/(png|jpeg|webp|gif);base64,/i.test(imageUrl)) {
    throw new Error("Image must be a direct HTTP/HTTPS URL or a PNG/JPG/WEBP/GIF image.");
  }
  return { title, description: description || null, category, eventDate, eventTime: eventTime || null, venue: venue || null, imageUrl: imageUrl || null, status };
}
export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Unauthorized", 401);
  if (!ADMIN_ROLES.includes(user.role)) return fail("Forbidden", 403);
  try {
    const events = await prisma.collegeEvent.findMany({ orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }], take: 300 });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Admin events GET error:", error);
    return fail("Unable to load events.", 500);
  }
}
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return fail("Unauthorized", 401);
  if (!ADMIN_ROLES.includes(user.role)) return fail("Forbidden", 403);
  try {
    const body = await request.json();
    const data = parseEvent(body);
    const event = await prisma.collegeEvent.create({ data });
    await prisma.auditLog.create({ data: { userId: user.id, action: "CREATE_EVENT", module: "EVENTS", recordId: event.id, metadata: JSON.stringify({ title: event.title, status: event.status }) } }).catch(() => {});
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    return fail(error.message || "Unable to create event.");
  }
}
export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return fail("Unauthorized", 401);
  if (!ADMIN_ROLES.includes(user.role)) return fail("Forbidden", 403);
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) return fail("Event ID is required.");
    const data = parseEvent(body);
    const event = await prisma.collegeEvent.update({ where: { id }, data });
    await prisma.auditLog.create({ data: { userId: user.id, action: "UPDATE_EVENT", module: "EVENTS", recordId: event.id, metadata: JSON.stringify({ title: event.title, status: event.status }) } }).catch(() => {});
    return NextResponse.json({ success: true, event });
  } catch (error) {
    if (error.code === "P2025") return fail("Event not found.", 404);
    return fail(error.message || "Unable to update event.");
  }
}
export async function DELETE(request) {
  const user = await getSessionUser();
  if (!user) return fail("Unauthorized", 401);
  if (!ADMIN_ROLES.includes(user.role)) return fail("Forbidden", 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("Event ID is required.");
  try {
    await prisma.collegeEvent.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "DELETE_EVENT", module: "EVENTS", recordId: id } }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === "P2025") return fail("Event not found.", 404);
    console.error("Admin event DELETE error:", error);
    return fail("Unable to delete event.", 500);
  }
}
