import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    { data: profile },
    { data: links },
    { data: referrals },
    { data: socials },
    { data: products },
    { data: mediaEmbeds },
    { data: faqs },
    { data: highlights },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("links").select("*").eq("user_id", user.id).order("position"),
    supabase
      .from("referrals")
      .select("*")
      .eq("user_id", user.id)
      .order("position"),
    supabase
      .from("social_links")
      .select("*")
      .eq("user_id", user.id)
      .order("position"),
    supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("position"),
    supabase
      .from("media_embeds")
      .select("*")
      .eq("user_id", user.id)
      .order("position"),
    supabase
      .from("profile_faqs")
      .select("*")
      .eq("user_id", user.id)
      .order("position"),
    supabase
      .from("profile_highlights")
      .select("*")
      .eq("user_id", user.id)
      .order("position"),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
    },
    profile,
    links: links ?? [],
    referrals: referrals ?? [],
    socials: socials ?? [],
    products: products ?? [],
    media_embeds: mediaEmbeds ?? [],
    faqs: faqs ?? [],
    highlights: highlights ?? [],
  };

  const username = profile?.username || "cueful-account";
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${username}-cueful-export.json"`,
      "Cache-Control": "no-store",
    },
  });
}
