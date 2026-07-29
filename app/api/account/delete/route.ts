import { NextResponse } from "next/server";
import { PUBLIC_ASSET_BUCKET } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

async function removeStorageFolder(userId: string) {
  try {
    const admin = createAdminClient();
    const folders = ["profile", "seo", "products", "highlights", "links", "branding", "wallpapers"];
    for (const folder of folders) {
      const prefix = `${userId}/${folder}`;
      const { data } = await admin.storage.from(PUBLIC_ASSET_BUCKET).list(prefix, {
        limit: 100,
      });
      if (!data?.length) continue;
      const paths = data
        .filter((item) => Boolean(item.name))
        .map((item) => `${prefix}/${item.name}`);
      if (paths.length) {
        await admin.storage.from(PUBLIC_ASSET_BUCKET).remove(paths);
      }
    }
  } catch {
    // Storage cleanup is best-effort; auth/user delete still proceeds.
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let confirmation = "";
  try {
    const body = (await request.json()) as { confirmation?: string };
    confirmation = body.confirmation?.trim() ?? "";
  } catch {
    return NextResponse.json(
      { error: "Send { confirmation: \"DELETE\" } to continue." },
      { status: 400 },
    );
  }

  if (confirmation !== "DELETE") {
    return NextResponse.json(
      { error: "Type DELETE to confirm permanent account deletion." },
      { status: 400 },
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error:
          "Account deletion is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 503 },
    );
  }

  await removeStorageFolder(user.id);

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete this account.",
      },
      { status: 500 },
    );
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
