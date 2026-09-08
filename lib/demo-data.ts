import type { TimelineEntry } from "@/lib/timeline";
import type { CreatorProfile } from "@/lib/types";

export const demoProfile: CreatorProfile = {
  username: "avery-makes",
  initials: "AM",
  displayName: "Avery",
  greeting: "Hey, I’m",
  headline: "I make useful",
  headlineAccent: "things.",
  eyebrow: "Designer · Developer · Tinkerer",
  bio: "A hand-picked trail of projects, field notes, and tools from my corner of the internet.",
  socials: [
    { platform: "GitHub", url: "https://github.com" },
    { platform: "LinkedIn", url: "https://www.linkedin.com" },
    { platform: "X / Twitter", url: "https://x.com" },
  ],
  links: [
    {
      id: "project",
      index: "01",
      title: "Latest side-project",
      subtitle: "An open-source experiment for calmer developer workflows.",
      url: "https://github.com",
      tags: ["project", "portfolio", "developer", "open source", "tools"],
      visits: 142,
      color: "#c9ef69",
    },
    {
      id: "notes",
      index: "02",
      title: "Architecture field notes",
      subtitle: "Practical observations on building systems that hold up.",
      url: "https://github.com",
      tags: ["writing", "architecture", "engineering", "guide"],
      visits: 89,
      color: "#ffb4d0",
    },
    {
      id: "stack",
      index: "03",
      title: "The creator stack",
      subtitle: "A living shortlist of apps, resources, and tiny discoveries.",
      url: "https://github.com",
      tags: ["resources", "creator", "tools", "newsletter"],
      visits: 314,
      color: "#9ed6ff",
    },
  ],
  referrals: [
    {
      id: "lyft",
      provider: "Lyft",
      perk: "$15 off your first ride",
      code: "LYFTFREE15",
      url: "https://www.lyft.com",
      tags: ["ride", "travel", "transport", "coupon"],
      color: "#e8347d",
    },
    {
      id: "uber",
      provider: "Uber",
      perk: "Free delivery on 3 orders",
      code: "UBERPERK2026",
      url: "https://www.uber.com",
      tags: ["food", "delivery", "ride", "coupon"],
      color: "#20221f",
    },
    {
      id: "chase",
      provider: "Chase Sapphire",
      perk: "60,000 bonus points offer",
      code: null,
      url: "https://www.chase.com",
      tags: ["card", "finance", "points", "travel"],
      color: "#3659d9",
    },
  ],
};

/**
 * The student example, shown at /demo/student.
 *
 * The creator demo above sells the link rack and the referral rail. A student
 * arriving from search or from the blog needs to see something else entirely,
 * and until this existed there was nowhere on the site showing it.
 *
 * What is on it follows what early-career recruiters say they read: education
 * and experience with dates, a small number of projects framed as problem →
 * role → result, skills phrased the way job descriptions phrase them, and the
 * CV itself attached for the upload box on an application form.
 *
 * Note what is deliberately absent: referral codes. A page someone hands to a
 * recruiter should not be trying to sell them a rideshare discount.
 */
export const studentDemoProfile: CreatorProfile = {
  username: "jordan-builds",
  initials: "JA",
  displayName: "Jordan",
  greeting: "Hi, I’m",
  headline: "Final-year CS, and I’m",
  headlineAccent: "looking for a grad role.",
  eyebrow: "Computer Science · Final year · Graduating 2027",
  // Phrased the way job adverts phrase them, which is what makes them useful.
  tags: ["TypeScript", "Python", "React", "PostgreSQL", "Distributed systems"],
  bio: "Backend-leaning, happiest near a database. Below: what I have built, where I have worked, and my CV.",
  socials: [
    { platform: "GitHub", url: "https://github.com" },
    { platform: "LinkedIn", url: "https://www.linkedin.com" },
  ],
  links: [
    {
      id: "clash",
      index: "01",
      title: "Timetable clash finder",
      // Problem, role, result -- the framing recruiters ask for, in one line.
      subtitle:
        "Enrolment let you pick clashing modules and told you in October. Built the checker; about 300 students used it this year.",
      url: "https://github.com",
      tags: ["project", "typescript", "postgres", "student"],
      visits: 0,
      color: "#c9ef69",
      featured: true,
    },
    {
      id: "writeup",
      index: "02",
      title: "How the clash finder works",
      subtitle:
        "The scheduling problem, the two approaches I tried, and why the slower one shipped.",
      url: "https://github.com",
      tags: ["writing", "engineering", "case study"],
      visits: 0,
      color: "#9ed6ff",
    },
    {
      id: "code",
      index: "03",
      title: "Everything else on GitHub",
      subtitle: "Coursework, half-finished experiments, and the odd useful thing.",
      url: "https://github.com",
      tags: ["code", "github", "portfolio"],
      visits: 0,
      color: "#ffb4d0",
    },
  ],
  // A page you hand to a recruiter is not the place for referral codes.
  referrals: [],
};

/**
 * Experience above education here, which is what the page does for everyone.
 * Worth knowing: a student with no experience entries at all sees education
 * first anyway, because an empty section is not rendered.
 */
export const studentDemoTimeline: TimelineEntry[] = [
  {
    id: 1,
    kind: "experience",
    title: "Software Engineering Intern",
    organisation: "Northgate Labs",
    location: "Leeds",
    started_on: "2025-06",
    ended_on: "2025-09",
    is_current: false,
    description:
      "Rebuilt the booking form and cut drop-off by a third. In production by week six.",
  },
  {
    id: 2,
    kind: "experience",
    title: "Peer tutor, second-year algorithms",
    organisation: "Meridian University",
    location: "Leeds",
    started_on: "2024-10",
    ended_on: null,
    is_current: true,
    description: "Weekly sessions for around twenty students.",
  },
  {
    id: 3,
    kind: "education",
    title: "BSc Computer Science",
    organisation: "Meridian University",
    location: "Leeds",
    started_on: "2023-09",
    ended_on: null,
    is_current: true,
    description: "Distributed systems, compilers, HCI. On track for a first.",
  },
];

/** What the download on the demo page is labelled. */
export const STUDENT_DEMO_RESUME = "jordan-avery-cv.pdf";
