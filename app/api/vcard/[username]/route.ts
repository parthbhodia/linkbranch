import { NextResponse } from "next/server";
import { publicProfileUrl } from "@/lib/brand";
import { publicAssetUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { buildVCard, vCardFilename } from "@/lib/vcard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const handle = username.toLowerCase().replace(/\.vcf$/, "");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id,username,display_name,bio,job_title,company,contact_email,contact_phone,avatar_path,show_save_contact,is_published",
    )
    .eq("username", handle)
    .eq("is_published", true)
    .maybeSingle();

  if (!profile || !profile.show_save_contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: socials } = await supabase
    .from("social_links")
    .select("url,position")
    .eq("user_id", profile.id)
    .order("position");

  const card = buildVCard({
    displayName: profile.display_name,
    username: profile.username,
    jobTitle: profile.job_title,
    company: profile.company,
    email: profile.contact_email,
    phone: profile.contact_phone,
    bio: profile.bio,
    profileUrl: publicProfileUrl(profile.username),
    avatarUrl: publicAssetUrl(profile.avatar_path),
    socialUrls: (socials ?? []).map((item) => item.url),
  });

  return new NextResponse(card, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vCardFilename(
        profile.display_name,
        profile.username,
      )}"`,
      // The card changes whenever the profile does, and it is handed out in
      // exactly the moment it needs to be correct.
      "Cache-Control": "no-store",
    },
  });
}
