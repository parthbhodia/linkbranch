import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service | Cueful",
  description:
    "The plain-language terms for using Cueful: your account, your content, acceptable use, and how the service can change or end.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Terms navigation">
        <Link href="/">cueful.</Link>
        <div className={styles.navLinks}>
          <Link href="/privacy">Privacy</Link>
          <Link href="/">Back home</Link>
        </div>
      </nav>
      <article className={styles.article}>
        <p className={styles.eyebrow}>TERMS / PLAIN LANGUAGE</p>
        <h1>Your page, your words. A few rules keep it that way.</h1>
        <p className={styles.updated}>
          Product terms overview · Updated July 31, 2026
        </p>

        <section>
          <h2>What Cueful provides</h2>
          <p>
            Cueful hosts a link-in-bio profile at a username you choose, along
            with the editing tools and activity insights that go with it. Using
            the service means agreeing to the terms on this page. The{" "}
            <Link href="/privacy">privacy overview</Link> explains what data
            Cueful handles and why.
          </p>
        </section>

        <section>
          <h2>Your account</h2>
          <p>
            Keep account details accurate and keep sign-in credentials to
            yourself. Activity under an account is the account holder’s
            responsibility. Cueful is not built for children, and an account
            should not be created by anyone under 13.
          </p>
        </section>

        <section>
          <h2>Your content stays yours</h2>
          <p>
            Profile text, images, links, offers, and everything else saved to a
            Cueful page belong to the creator who added them. Hosting a page
            requires permission to store, reproduce, and display that content
            for the purpose of running the service and showing the profile to
            visitors — nothing more. That permission ends when the content is
            deleted, aside from backup copies that age out on their own.
          </p>
          <p>
            Publishing content means having the rights to it. Uploading someone
            else’s work without permission is the creator’s liability, not
            Cueful’s.
          </p>
        </section>

        <section id="acceptable-use">
          <h2>Acceptable use</h2>
          <p>A Cueful page may not be used to:</p>
          <ul>
            <li>
              Break the law, or link to destinations that distribute malware,
              phishing pages, or stolen data.
            </li>
            <li>
              Impersonate another person, brand, or organisation, or misstate an
              affiliation.
            </li>
            <li>
              Publish sexual content involving minors, targeted harassment, or
              incitement to violence.
            </li>
            <li>
              Run spam, deceptive commerce, or undisclosed paid promotion where
              disclosure is required.
            </li>
            <li>
              Scrape, overload, probe, or otherwise interfere with the service
              or other creators’ pages.
            </li>
          </ul>
        </section>

        <section>
          <h2>Usernames</h2>
          <p>
            Usernames are assigned on a first-come basis and are not sold or
            transferred. A username may be reclaimed if it impersonates someone,
            infringes a trademark, or is squatted on an unused account.
          </p>
        </section>

        <section>
          <h2>Third-party destinations</h2>
          <p>
            Profiles link out to services Cueful does not control or endorse.
            Once a visitor follows one of those links, that destination’s own
            terms and privacy practices take over.
          </p>
        </section>

        <section>
          <h2>Changes, downtime, and ending an account</h2>
          <p>
            Cueful is offered free and as-is. Features can change and the
            service can be unavailable, so a profile should not be treated as
            the only copy of anything important — account data can be exported
            from the dashboard at any time.
          </p>
          <p>
            An account can be closed by its owner whenever they like. Cueful may
            suspend or remove an account that breaks the acceptable-use rules
            above, or that creates legal risk for the service or its other
            creators. Where circumstances allow, notice comes first.
          </p>
        </section>

        <section>
          <h2>Liability</h2>
          <p>
            To the extent the law allows, Cueful is not liable for lost profits,
            lost audience, lost data, or other indirect damages arising from use
            of the service. Nothing here removes rights that cannot be waived
            under applicable consumer law.
          </p>
        </section>

        <section>
          <h2>Updates to these terms</h2>
          <p>
            These terms will change as the product does. Material changes will
            be reflected in the date above, and continued use after an update
            means the updated terms apply.
          </p>
        </section>

        <section>
          <h2>Before production legal review</h2>
          <p>
            This page is a plain-language product overview, not a completed
            agreement. Qualified counsel should review and expand it — including
            governing law, dispute resolution, a copyright-notice process, and a
            contact address for legal notices — before Cueful operates at scale.
          </p>
        </section>
      </article>
    </main>
  );
}
