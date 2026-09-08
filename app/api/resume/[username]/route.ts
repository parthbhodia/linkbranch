import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DOCUMENTS_BUCKET } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Long enough to open and read the file, short enough that a link copied out
// of the address bar and pasted somewhere public stops working.
const SIGNED_URL_SECONDS = 60 * 10;

/**
 * Redirects to a freshly signed URL for the profile's résumé.
 *
 * The indirection is the point. The bucket is private, so the object has no
 * public address, and this route mints a short-lived one per request. A link
 * on the page would otherwise be a permanent, crawlable URL to a document
 * carrying someone's phone number and often their home address.
 *
 * Signing needs the service role, so it happens here rather than in the page:
 * the anon client cannot read another person's object, which is exactly the
 * policy we want to keep.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const handle = username.toLowerCase();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_path,is_published")
    .eq("username", handle)
    .eq("is_published", true)
    .maybeSingle();

  if (!profile?.resume_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await createAdminClient()
    .storage.from(DOCUMENTS_BUCKET)
    .createSignedUrl(profile.resume_path, SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) {
    // A missing object rather than a missing row: the profile still points at
    // a file that has been deleted from the bucket underneath it.
    console.error("Résumé signing failed", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl, {
    headers: {
      // The signed URL expires, so nothing about this response may be reused.
      "Cache-Control": "no-store",
    },
  });
}
