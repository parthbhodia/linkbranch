import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function deviceType(userAgent: string) {
  const value = userAgent.toLowerCase();
  if (/bot|crawler|spider/.test(value)) return "bot";
  if (/ipad|tablet/.test(value)) return "tablet";
  if (/mobile|iphone|android/.test(value)) return "mobile";
  return "desktop";
}

export async function POST(request: NextRequest) {
  let body: { profileId?: unknown; referrer?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const profileId =
    typeof body.profileId === "string" ? body.profileId.toLowerCase() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(profileId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const countryHeader = request.headers.get("x-vercel-ip-country")?.toUpperCase();
  const countryCode = countryHeader?.match(/^[A-Z]{2}$/)?.[0] ?? null;
  const referrer =
    typeof body.referrer === "string" && body.referrer.length <= 2048
      ? body.referrer
      : null;
  const supabase = await createClient();
  const { error } = await supabase.from("profile_views").insert({
    profile_id: profileId,
    referrer,
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
