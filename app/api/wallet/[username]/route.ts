import { NextResponse } from "next/server";
import { publicProfileUrl } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { resolveProfileTheme } from "@/lib/theme-config";
import {
  buildWalletPass,
  readWalletConfig,
  walletPassFilename,
} from "@/lib/wallet-pass";

// Signing needs Node crypto, so this cannot run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const config = readWalletConfig();

  // No Apple credentials configured -- the normal state locally and on
  // previews. 404 rather than 500: nothing is broken, the feature is simply
  // not turned on here, and the /card button is hidden to match.
  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { username } = await params;
  const handle = username.toLowerCase().replace(/\.pkpass$/, "");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id,username,display_name,bio,job_title,company,contact_email,contact_phone,theme_config,template,show_save_contact,is_published",
    )
    .eq("username", handle)
    .eq("is_published", true)
    .maybeSingle();

  // Same gate as the vCard route: show_save_contact is the switch for "hand my
  // details out", and it governs every format we hand them out in.
  if (!profile || !profile.show_save_contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const theme = resolveProfileTheme(profile.theme_config, profile.template);

  let pass: Buffer;
  try {
    pass = await buildWalletPass(
      {
        profileId: profile.id,
        displayName: profile.display_name,
        username: profile.username,
        jobTitle: profile.job_title,
        company: profile.company,
        email: profile.contact_email,
        phone: profile.contact_phone,
        bio: profile.bio,
        profileUrl: publicProfileUrl(profile.username),
        backgroundColor: theme.colors.background,
        foregroundColor: theme.colors.text,
      },
      config,
    );
  } catch (error) {
    // A malformed certificate throws here rather than at boot, and the message
    // names which of the four inputs Apple rejected -- worth keeping in the
    // server log, worth never showing a visitor.
    console.error("Wallet pass generation failed", error);
    return NextResponse.json({ error: "Could not build pass" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(pass), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${walletPassFilename(
        profile.username,
      )}"`,
      // The pass is a snapshot taken at download time, so it must at least be
      // correct at the moment it is handed over.
      "Cache-Control": "no-store",
    },
  });
}
