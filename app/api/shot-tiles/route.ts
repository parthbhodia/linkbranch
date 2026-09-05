import { NextResponse } from "next/server";

// TEMPORARY: relays a small block of OpenStreetMap tiles as base64 JSON so the
// blog screenshots, taken from a network-restricted sandbox, can show a real
// map. Removed again by the commit that adds the blog; never in production.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const z = Number(url.searchParams.get("z"));
  const x1 = Number(url.searchParams.get("x1"));
  const x2 = Number(url.searchParams.get("x2"));
  const y1 = Number(url.searchParams.get("y1"));
  const y2 = Number(url.searchParams.get("y2"));
  if (![z, x1, x2, y1, y2].every(Number.isInteger) || (x2 - x1 + 1) * (y2 - y1 + 1) > 40) {
    return NextResponse.json({ error: "bad range" }, { status: 400 });
  }
  const tiles: Record<string, string> = {};
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      const res = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
        headers: { "User-Agent": "Cueful/1.0 (+https://cueful.bio; one-off screenshot relay)" },
      });
      if (!res.ok) continue;
      tiles[`${z}/${x}/${y}`] = Buffer.from(await res.arrayBuffer()).toString("base64");
    }
  }
  return NextResponse.json({ tiles }, { headers: { "Cache-Control": "no-store" } });
}
