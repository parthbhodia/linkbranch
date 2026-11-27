import { NextResponse, type NextRequest } from "next/server";
import { parseShareSource } from "@/lib/share-source";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

function deviceType(userAgent: string) {
  const value = userAgent.toLowerCase();
  if (/bot|crawler|spider/.test(value)) return "bot";
  if (/ipad|tablet/.test(value)) return "tablet";
  if (/mobile|iphone|android/.test(value)) return "mobile";
  return "desktop";
}

export async function POST(request: NextRequest) {
  let body: { profileId?: unknown; referrer?: unknown; source?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isUuid(body.profileId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const profileId = body.profileId.toLowerCase();

  const countryHeader = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  const countryCode = countryHeader?.match(/^[A-Z]{2}$/)?.[0] ?? null;
  const referrer =
    typeof body.referrer === "string" && body.referrer.length <= 2048
      ? body.referrer
      : null;
  // Unrecognised values become null rather than an error: the tag is on a
  // printed sticker somewhere, and a typo in it should still record the visit.
  const source = parseShareSource(body.source);
  const supabase = await createClient();
  const { error } = await supabase.from("profile_views").insert({
    profile_id: profileId,
    referrer,
    source,
    country_code: countryCode,
    device_type: deviceType(request.headers.get("user-agent") ?? ""),
  });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
