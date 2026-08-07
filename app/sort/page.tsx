import { redirect } from "next/navigation";
import type { DashboardConnection } from "@/components/connections-inbox";
import { SortSession } from "@/components/sort-session";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Sort | Cueful",
  description: "Work through the people you met.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function SortPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  let query = supabase
    .from("connections")
    .select(
      "id,name,email,phone,company,job_title,note,event_tag,status,source,met_at,connected_at",
    )
    .eq("profile_id", user.id)
    // Only the untriaged stack. Re-sorting people you already decided on is
    // how a 90-second job becomes a chore nobody repeats.
    .eq("status", "new")
    .order("met_at", { ascending: false })
    .limit(500);

  // An absent param sorts everything; ?event= (empty) means the untagged pile.
  if (typeof event === "string") {
    query = query.eq("event_tag", event);
  }

  const { data: connections } = await query;

  return (
    <SortSession
      profileId={user.id}
      queue={(connections ?? []) as DashboardConnection[]}
      eventTag={event ?? null}
    />
  );
}
