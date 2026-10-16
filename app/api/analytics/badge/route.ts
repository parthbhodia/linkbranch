import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";

/**
 * A visitor tapped "Make your own with cueful." in the footer of someone's
 * page -- the growth loop, and until now the only click on a public page that
 * nothing counted.
 *
 * It gets a route of its own when every other click inserts straight from the
 * browser, for one reason: this is the one that navigates in the same tab. A
 * fetch started in a click handler is cancelled when the page unloads, so the
 * event has to leave via sendBeacon, and sendBeacon needs somewhere to post.
 *
 * Writes with the ordinary server client, never the service role: the insert
 * policy is what decides whether the row is allowed, including that the profile
 * is published and actually showing the badge.
 */
export async function POST(request: NextRequest) {
  let body: { profileId?: unknown; referrer?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isUuid(body.profileId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const referrer =
    typeof body.referrer === "string" && body.referrer.length <= 2048
      ? body.referrer
      : null;

  const supabase = await createClient();
  const { error } = await supabase.from("click_events").insert({
    profile_id: body.profileId.toLowerCase(),
    event_type: "badge_open",
    referrer,
  });

  // A refusal here is the policy doing its job -- an unpublished page, or the
  // badge switched off -- so it is a 403 rather than a 500. Nothing reads the
  // response: sendBeacon discards it.
  if (error) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
