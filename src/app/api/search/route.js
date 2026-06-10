import { NextResponse } from "next/server";
import { searchPlaces } from "@/lib/google";

// Always run fresh on the server (never cache lead results).
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();
  const max = Math.min(
    parseInt(searchParams.get("max") || "20", 10) || 20,
    60
  );

  if (!query) {
    return NextResponse.json(
      { error: "Please enter a search query." },
      { status: 400 }
    );
  }

  try {
    const results = await searchPlaces(query, max);
    return NextResponse.json({ results, query });
  } catch (err) {
    return NextResponse.json(
      { error: err.message, reason: err.reason || "unknown" },
      { status: err.status || 500 }
    );
  }
}
