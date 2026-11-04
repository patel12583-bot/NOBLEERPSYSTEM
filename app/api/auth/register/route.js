import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Public registration is disabled. Only an authorised administrator can access this system." },
    { status: 403 }
  );
}
