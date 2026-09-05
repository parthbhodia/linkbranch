import { NextResponse } from "next/server";
import { BRAND_URL } from "@/lib/brand";
import { GEOCODE_RESULT_LIMIT, isSearchableQuery, parseNominatimResults } from "@/lib/geocode";

// Nominatim's usage policy asks for an identifying User-Agent and light use.
// Routing the lookup through here, rather than calling it from the browser,
// lets us send that header and lets Next cache repeated queries for a day, so
// two people searching the same street cost Nominatim one request.
const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const CACHE_SECONDS = 86_400;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!isSearchableQuery(query)) {
    return NextResponse.json(
      { error: "Type a street, area or place name to search for." },
      { status: 400 },
    );
  }

  const upstream = new URL(NOMINATIM_SEARCH);
  upstream.searchParams.set("format", "jsonv2");
  upstream.searchParams.set("q", query);
  upstream.searchParams.set("limit", String(GEOCODE_RESULT_LIMIT));

  let payload: unknown;
  try {
    const response = await fetch(upstream, {
      headers: {
        "User-Agent": `Cueful/1.0 (+${BRAND_URL})`,
        Accept: "application/json",
      },
      next: { revalidate: CACHE_SECONDS },
    });
    if (!response.ok) throw new Error(`nominatim ${response.status}`);
    payload = await response.json();
  } catch {
    return NextResponse.json(
      { error: "Address search is unavailable right now. Paste a Google Maps link or drop the pin by hand." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { results: parseNominatimResults(payload) },
    { headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` } },
  );
}
