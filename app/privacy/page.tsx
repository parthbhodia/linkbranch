import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy and Analytics Overview | Cueful",
  description:
    "How Cueful uses account data, essential storage, optional Google analytics, and privacy-friendly Vercel Web Analytics.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Privacy navigation">
        <Link href="/">cueful.</Link>
        <div className={styles.navLinks}>
          <Link href="/terms">Terms</Link>
          <Link href="/">Back home</Link>
        </div>
      </nav>
      <article className={styles.article}>
        <p className={styles.eyebrow}>PRIVACY / PLAIN LANGUAGE</p>
        <h1>Your page is public. Your choices still matter.</h1>
        <p className={styles.updated}>
          Product privacy overview · Updated July 28, 2026
        </p>

        <section>
          <h2>What Cueful needs to operate</h2>
          <p>
            Cueful processes account details and the profile content you choose
            to save or publish. Authentication and security storage are
            essential to signing in, protecting an account, and keeping a
            session active.
          </p>
        </section>

        <section id="analytics">
          <h2>Analytics</h2>
          <p>
            Cueful uses its own first-party activity records to show creators
            page views, outbound actions, and aggregated audience signals. It
            does not load Google Analytics or Google Tag Manager.
          </p>
          <p>
            Vercel Web Analytics remains enabled. Vercel describes this service
            as cookie-free, anonymous, and limited to aggregated traffic
            measurement. Cueful does not enable advertising storage or
            personalized advertising.
          </p>
          <p>
            Sign-in uses essential session storage so Cueful can protect an
            account and keep its owner signed in. Creator referral attribution
            is stored locally in the browser for up to seven days.
          </p>
        </section>

        <section>
          <h2>Published profiles and audience signals</h2>
          <p>
            A published Cueful profile is available on the public web. Profile
            owners may see aggregated activity such as page views, outbound
            clicks, referral opens, code-copy actions, referrers, device
            categories, and approximate country information.
          </p>
        </section>

        <section>
          <h2>Third-party destinations</h2>
          <p>
            Creator profiles can link to websites and services Cueful does not
            control. Opening one of those links makes that destination’s own
            privacy practices apply.
          </p>
        </section>

        <section>
          <h2>Before production legal review</h2>
          <p>
            This page is a plain-language product overview and should be
            reviewed and expanded by qualified counsel before Cueful processes
            production customer data at scale.
          </p>
        </section>
      </article>
    </main>
  );
}
