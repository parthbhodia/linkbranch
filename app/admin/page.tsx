import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { adminAllowlistCount, isAdminEmail } from "@/lib/admin-access";
import { buildActivationFunnel, worstStage, type FunnelAccount } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { summariseViews, type ViewRow } from "@/lib/views-summary";

export const metadata = {
  title: "Admin | Cueful",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Enough for a long time, and a bound so this page cannot become the slowest
// thing in the app by accident.
const ROW_LIMIT = 5000;

function tally<T extends Record<string, unknown>>(
  rows: T[] | null,
  key: keyof T,
): Map<string, number> {
  const counts = new Map<string, number>();
  (rows ?? []).forEach((row) => {
    const id = String(row[key]);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  return counts;
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

// Outside the component: react-hooks/purity treats Date.now() in a component
// body as impure, and this page is force-dynamic so "now" is genuinely the
// request time either way.
function countCreatedWithinDays(rows: { created_at: string }[], days: number) {
  const cutoff = Date.now() - days * 86_400_000;
  return rows.filter((row) => new Date(row.created_at).getTime() > cutoff).length;
}

function since(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default async function AdminPage() {
  // The gate. Read the session with the ordinary server client, which verifies
  // the JWT with Supabase -- never trust an email from a cookie or a header.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // 404 rather than 403 for a signed-in non-admin: a forbidden page confirms
  // the route exists and is worth attacking. Also covers ADMIN_EMAILS being
  // unset, which admits nobody by design.
  if (!isAdminEmail(user.email)) {
    // The 404 is deliberately indistinguishable from a missing route, which
    // also makes it impossible to tell "ADMIN_EMAILS is unset" from "your
    // address is not the one in it" -- the two ways this realistically fails.
    // Runtime logs are private to the project, so the answer goes there rather
    // than on screen.
    console.warn(
      `[admin] refused ${user.email ?? "(no email on session)"}; ` +
        `ADMIN_EMAILS has ${adminAllowlistCount()} address(es)`,
    );
    notFound();
  }

  // Service role from here on. RLS scopes profiles to published-or-own and
  // hides other people's views and clicks entirely, so the ordinary client
  // cannot see the accounts that dropped out -- which are the whole point.
  const admin = createAdminClient();

  const [
    { data: profiles },
    { data: links },
    { data: views },
    { data: clicks },
    { data: drafts },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id,username,display_name,created_at,bio,avatar_path,onboarding_completed,is_published,is_discoverable",
      )
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT),
    admin.from("links").select("user_id").eq("is_active", true).limit(50000),
    admin
      .from("profile_views")
      // referrer and occurred_at are for the traffic summary; the funnel only
      // needs profile_id and device_type.
      .select("profile_id,device_type,country_code,referrer,occurred_at")
      .limit(100000),
    admin.from("click_events").select("profile_id").limit(100000),
    admin.from("claim_drafts").select("first_viewed_at,claimed_at,expires_at").limit(ROW_LIMIT),
  ]);

  const accounts = (profiles ?? []) as (FunnelAccount & {
    username: string;
    display_name: string;
    is_published: boolean;
    is_discoverable: boolean;
  })[];

  const activeLinkCounts = tally(links, "user_id");
  const humanViewCounts = tally(
    (views ?? []).filter((row) => row.device_type !== "bot"),
    "profile_id",
  );
  const clickCounts = tally(clicks, "profile_id");

  const traffic = summariseViews((views ?? []) as ViewRow[]);
  // The summary counts by profile id; the table wants handles.
  const handleById = new Map(accounts.map((a) => [a.id, a.username]));

  const stages = buildActivationFunnel({
    accounts,
    activeLinkCounts,
    humanViewCounts,
    clickCounts,
  });
  const worst = worstStage(stages);

  const draftRows = drafts ?? [];
  const draftsOpened = draftRows.filter((d) => d.first_viewed_at !== null).length;
  const draftsClaimed = draftRows.filter((d) => d.claimed_at !== null).length;

  const newThisWeek = countCreatedWithinDays(accounts, 7);

  const stalled = accounts
    .filter((a) => !a.onboarding_completed)
    .slice(0, 25);

  const widest = Math.max(...stages.map((stage) => stage.people), 1);

  return (
    <main className="admin-page">
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">CUEFUL ADMIN</p>
          <h1>{accounts.length} accounts</h1>
          <p className="admin-sub">
            {newThisWeek} in the last 7 days ·{" "}
            {accounts.filter((a) => a.onboarding_completed).length} finished setup
          </p>
        </div>
        <Link href="/dashboard">Back to dashboard</Link>
      </header>

      <section className="admin-card">
        <div className="admin-card__top">
          <h2>Activation funnel</h2>
          {worst ? (
            <p>
              Biggest drop: <b>{worst.label}</b> — {pct(worst.pctLostHere ?? 0)} lost
            </p>
          ) : null}
        </div>

        {/* Cumulative, so every row is a subset of the one above it and the
            bars can only ever shrink. See lib/funnel.ts. */}
        <ol className="admin-funnel">
          {stages.map((stage) => (
            <li key={stage.label}>
              <div className="admin-funnel__label">
                <b>{stage.label}</b>
                <small>{stage.detail}</small>
              </div>
              <div className="admin-funnel__bar" aria-hidden="true">
                <span style={{ width: `${(stage.people / widest) * 100}%` }} />
              </div>
              <div className="admin-funnel__figures">
                <b>{stage.people}</b>
                <small>{pct(stage.pctOfSignups)}</small>
                {stage.lostHere > 0 ? (
                  <em>−{stage.lostHere}</em>
                ) : (
                  <em className="is-flat">—</em>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="admin-card">
        <div className="admin-card__top">
          <h2>Views</h2>
          <p>
            {traffic.bots} of {traffic.total} filtered as bots (
            {pct(traffic.botPct)})
          </p>
        </div>

        <dl className="admin-stats">
          <div>
            <dt>Human views</dt>
            <dd>{traffic.human}</dd>
          </div>
          <div>
            <dt>Last 7 days</dt>
            <dd>
              {traffic.last7}
              <small>
                {traffic.trendPct === null
                  ? "no prior week"
                  : `${traffic.trendPct >= 0 ? "+" : ""}${pct(traffic.trendPct)} vs prior 7`}
              </small>
            </dd>
          </div>
          <div>
            <dt>Profiles seen</dt>
            <dd>{traffic.topProfiles.length >= 10 ? "10+" : traffic.topProfiles.length}</dd>
          </div>
        </dl>

        {traffic.human === 0 ? (
          <p className="admin-empty">No human views recorded yet.</p>
        ) : (
          <div className="admin-split">
            <div>
              {/* An empty referrer is the only signal we have that someone
                  scanned a code rather than followed a link -- GA4 files both
                  as Direct and cannot tell them apart. */}
              <h3 className="admin-subhead">Where they came from</h3>
              <ul className="admin-bars">
                {traffic.referrers.map((row) => (
                  <li key={row.label}>
                    <span>{row.label}</span>
                    <div className="admin-bars__bar" aria-hidden="true">
                      <span style={{ width: `${row.pct}%` }} />
                    </div>
                    <b>{row.count}</b>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="admin-subhead">Device</h3>
              <ul className="admin-bars">
                {traffic.devices.map((row) => (
                  <li key={row.label}>
                    <span>{row.label}</span>
                    <div className="admin-bars__bar" aria-hidden="true">
                      <span style={{ width: `${row.pct}%` }} />
                    </div>
                    <b>{row.count}</b>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {traffic.topProfiles.length > 0 && (
          <>
            <h3 className="admin-subhead">Most viewed pages</h3>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Handle</th>
                    <th>Human views</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {traffic.topProfiles.map((row) => (
                    <tr key={row.profileId}>
                      <td>
                        {handleById.has(row.profileId)
                          ? `@${handleById.get(row.profileId)}`
                          : "(deleted)"}
                      </td>
                      <td>{row.count}</td>
                      <td>{pct((row.count / traffic.human) * 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <div className="admin-split">
        <section className="admin-card">
          <h2>Outreach drafts</h2>
          {draftRows.length === 0 ? (
            <p className="admin-empty">No claim drafts yet.</p>
          ) : (
            <dl className="admin-stats">
              <div>
                <dt>Created</dt>
                <dd>{draftRows.length}</dd>
              </div>
              <div>
                <dt>Opened</dt>
                <dd>
                  {draftsOpened}
                  <small>{pct((draftsOpened / draftRows.length) * 100)}</small>
                </dd>
              </div>
              <div>
                <dt>Claimed</dt>
                <dd>
                  {draftsClaimed}
                  <small>
                    {draftsOpened === 0
                      ? "—"
                      : `${pct((draftsClaimed / draftsOpened) * 100)} of opened`}
                  </small>
                </dd>
              </div>
            </dl>
          )}
        </section>

        <section className="admin-card">
          <h2>Directory exposure</h2>
          {/* is_discoverable defaults to true, so this is everyone who has not
              opted out, which is what /discover now says it lists. */}
          <dl className="admin-stats">
            <div>
              <dt>Published</dt>
              <dd>{accounts.filter((a) => a.is_published).length}</dd>
            </div>
            <div>
              <dt>Discoverable</dt>
              <dd>{accounts.filter((a) => a.is_discoverable).length}</dd>
            </div>
            <div>
              <dt>In sitemap</dt>
              <dd>{stages[4]?.people ?? 0}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="admin-card">
        <div className="admin-card__top">
          <h2>Stalled accounts</h2>
          <p>{accounts.length - stages[3].people} never finished setup</p>
        </div>
        {stalled.length === 0 ? (
          <p className="admin-empty">Everyone finished setup.</p>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Handle</th>
                  <th>Joined</th>
                  <th>Bio</th>
                  <th>Avatar</th>
                  <th>Links</th>
                </tr>
              </thead>
              <tbody>
                {stalled.map((account) => (
                  <tr key={account.id}>
                    <td>@{account.username}</td>
                    <td>{since(account.created_at)}</td>
                    <td>{account.bio.trim() ? "yes" : "—"}</td>
                    <td>{account.avatar_path ? "yes" : "—"}</td>
                    <td>{activeLinkCounts.get(account.id) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
