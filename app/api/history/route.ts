import { NextResponse } from "next/server";
import { getHistory } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const history = await getHistory("agent");
    return NextResponse.json({ history });
  } catch (cause) {
    console.error("History route failed", cause);
    return NextResponse.json(
      { error: "Unable to load call history." },
      { status: 500 }
    );
  }
}
