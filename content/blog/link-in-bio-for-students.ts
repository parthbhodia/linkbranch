import type { BlogSource } from "@/lib/blog/posts";

export const post: BlogSource = {
  slug: "link-in-bio-for-students",
  title: "A link in bio for students: what to put on it before you graduate",
  subtitle:
    "Education, experience and one link you can hand to a recruiter at a careers fair, without emailing a PDF nobody opens.",
  description:
    "How a student can set up a free link-in-bio page with education, experience and projects on it, share it by QR at a careers fair, and collect the recruiter's details back.",
  published: "2026-09-08",
  hero: {
    src: "/blog/how-to-add-link-in-instagram-bio/profile-phone.webp",
    alt: "A profile page open on a phone, with links listed under the name and bio",
    caption: "One address that holds everything, and stays right after you update it.",
  },
  tags: ["Students", "Getting started", "Careers"],
  cta: {
    href: "/auth?mode=signup&utm_source=blog&utm_medium=post",
    label: "Make your page",
    blurb:
      "Free, no ads, and your education and experience laid out under your name.",
  },
  body: `
A CV is a file. It gets attached to an email, downloaded once, and read for about six seconds. If you send it in February and win a prize in March, the version sitting in someone's downloads folder still ends at February.

A page does not have that problem. It has one address, it is current whenever someone opens it, and you can hand it over in a second without either of you typing an email address.

This is what to put on one, in the order that matters. There is a [worked example here](/demo/student) if you would rather see one than read about it.

## Start with the purpose, not the design

Setup asks what the page is for before it asks anything else. Pick **Student** and it lays out the two sections a student page needs — education and experience — instead of the link list a creator gets.

That ordering matters more than it sounds. A recruiter scanning your page is looking for where you studied and what you have done. If those are three scrolls down under a row of social icons, you have made them work for the one thing they came for.

## Education and experience, with dates

This is the part a normal link-in-bio tool cannot do, and the reason a student would otherwise need LinkedIn or a PDF.

Each entry takes a title, an organisation, and a start and end month. Anything still running is marked current and sorts to the top of its section, above everything finished, whatever the dates say.

- **Experience first, education under it.** Once you have done anything at all, what you have done is more interesting than where you are enrolled.
- **Months, not days.** A CV does not print the day you started, and neither does this.
- **One line of description each**, if it needs one. What you actually did, not what the team did.

:::note
Write the description for someone who has never heard of the place. "Summer intern, Acme" tells a reader nothing. "Rebuilt the booking form; cut drop-off by a third" tells them what you are like to work with.
:::

## Then the links, and only the ones that hold up

Three or four, not twelve. Each one should survive being clicked by a stranger who owes you nothing:

- The project you would actually want looked at
- GitHub, Behance, a portfolio — whichever is real
- Your CV, which you can attach to the page directly as a PDF or Word file
- One social, if it is one you would show an employer

Leave off anything that is empty, half-finished, or three years old. A dead link on a page you handed over is worse than one fewer link.

## The careers fair problem

Here is where a page beats a file outright.

You are standing in front of someone with a lanyard and a queue behind you. You have perhaps twenty seconds. The options are: spell out an email address over background noise, take a business card you will lose, or hand over paper that goes in a tote bag with forty others.

Or you show them a code.

![A QR code filling a phone screen with the page address underneath](/blog/how-to-add-link-in-instagram-bio/share-qr.webp "The code screen holds the display awake and stays black-on-white so it scans first time.")

[cueful.bio/card](/card) is a full-screen version of your code. Two details that decide whether it works in a busy hall:

- It **holds the screen awake**, so the phone does not dim halfway through their scan.
- It stays **black on white** whatever colours your page uses. A code tinted to match a design is the usual reason a scan fails.

They scan, your page opens on their phone, and they have your education, your experience and your links before the conversation has finished.

## Get their details, not just give yours

The half everybody forgets. You have given them your page; you still have nothing.

Turn on the exchange and your page carries a short form so the person you just met can send their details back. They land in your inbox with a note field — where you met, what you talked about, what they said to follow up on.

Turn on **event mode** before you walk in and name it after the fair. Everyone who scans your code that day is filed under that name, so the next morning you are looking at "Autumn Careers Fair — 11 people" rather than eleven strangers with no context.

:::note
Do this on the day. The single most useful thing you can write is the sentence you would otherwise forget by Thursday: "wants a portfolio link", "hiring for a summer role in March", "went to the same department".
:::

## What to put the link on

One address, everywhere the old ones were:

- The header of your actual CV, next to your email
- Your email signature
- Your Instagram or LinkedIn bio
- The chat box in an online careers event, where nobody can hand over paper at all

## What this is not

It is not a CV builder. It will not check your CV against a job description or rewrite your bullet points, and it does not try to. It is the page you hand over — the thing that is current, scannable, and yours — with the real document attached to it.

And it is free. No plan gating, no ads on your page, and the address is yours.

## Setting it up

Twenty minutes, once:

1. Claim your username.
2. Pick **Student** when setup asks what the page is for.
3. Add your two or three most recent experiences, then your course.
4. Add three links, no more.
5. Open [/card](/card) once so you know where it is before you need it.

Then update it when something changes, which is the entire point — the link you handed out in October still shows what you did in March.
`,
};
