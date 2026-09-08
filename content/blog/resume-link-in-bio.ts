import type { BlogSource } from "@/lib/blog/posts";

export const post: BlogSource = {
  slug: "resume-link-in-bio",
  title: "Your résumé on a link in bio: what goes on the page, what goes in the file",
  subtitle:
    "A recruiter reads your page in ten seconds and opens the file only if those ten seconds worked. The two are doing different jobs.",
  description:
    "How to split your CV between a link-in-bio page and the file itself: education and experience on the page, the full document attached, and what to think about before you upload it.",
  published: "2026-09-08",
  hero: {
    src: "/blog/how-to-add-link-in-instagram-bio/profile-phone.webp",
    alt: "A profile page open on a phone, with the name and bio at the top and content listed underneath",
    caption: "The ten-second layer. The file sits underneath it, for whoever wants the detail.",
  },
  tags: ["Careers", "Students", "Privacy"],
  cta: {
    href: "/auth?mode=signup&utm_source=blog&utm_medium=post",
    label: "Make your page",
    blurb: "Free, no ads, with your background on the page and your CV attached to it.",
  },
  body: `
Someone asks for your CV. You send a PDF. It lands in an inbox, gets opened once on a phone where it renders at about six-point type, and gets a few seconds of attention before anyone decides whether to keep reading.

None of that is the file's fault. A CV is a detailed document, and detailed documents are bad at first impressions. The problem is that the file is being asked to do two jobs — to be *scanned* and to be *read* — and it is only good at one of them.

Splitting those two jobs is what a page is for.

## Two layers, two different questions

Your page is the ten-second layer. Your name, what you are doing now, where you studied, a few links. Someone standing in front of you, or holding a phone in a queue, gets the shape of you without downloading anything.

Your CV is the ten-minute layer. Every module, every date, the bullet points, the referees. It hangs off the page for the person who has already decided they want it.

The mistake is making the page a worse copy of the CV, or asking the CV to do the page's job. They are not competing for the same reader. One of them earns the other one a reader.

## What goes on the page

Education and experience, each entry with a title, an organisation, and a start and end month. Deliberately close to a line on a CV, and deliberately shorter.

A few things behave the way a CV does without being asked:

- **Anything marked current sorts to the top of its section**, above everything finished, whatever the dates say. What you are doing now is the answer to the question people are actually asking, so it goes where they are looking.
- **Most recent first** after that, which is the order every CV on earth uses.
- **Months, not days.** A CV never prints the day you started, so the editor never asks for one.
- **A half-filled entry is not published.** A row with a title but no organisation is dropped when you save, rather than going live as a fragment.

One line of description each, where it needs one — written for someone who has never heard of the place.

:::note
"Summer intern, Acme" is a job title, not information. "Rebuilt the booking form; cut drop-off by a third" is the sentence that makes someone open the file.
:::

## What goes in the file

Everything else. The page is a summary and should stay one. If you find yourself pasting your bullet points into the description fields, that is the CV asking to be uploaded instead.

Attach it from your dashboard: **PDF or Word (.docx), up to 10 MB.** It shows on your page as a download.

Not \`.doc\`, \`.pages\` or \`.odt\` — legacy or single-vendor formats, and every type accepted is one more kind of file the storage handed to anyone who asks.

## The part worth stopping on

Your CV is not like the rest of your page.

Your links are public by design — you picked each one to be seen. A CV is a document you wrote for a specific audience, and it almost always carries your phone number and often your home address. Putting it behind a public link is a different decision from putting your Instagram behind one, and it deserves to be made deliberately rather than by accident.

Two things are true about how it is stored here, and both matter:

- **The file has no public address.** It sits in a private bucket. The download on your page is a signed link, minted fresh for each request and valid for ten minutes — long enough to open and read, short enough that a URL copied out of an address bar and pasted somewhere public stops working.
- **Anyone who can see your page can still open it.** The signing protects against the link leaking onward. It does not make the file private. If your page is public, your CV is public.

So: consider taking your home address off it before uploading, and leaving the phone number on if you want to be called. Or leave the file off entirely and put a **Get in touch** link where it would have been. Both are reasonable choices. Uploading without having thought about it is the one to avoid.

Taking it down later actually takes it down — the file is deleted from storage, not just unlinked from your page. Same when you replace one: the old file goes with it.

## Keeping the two in sync

This is where the split earns itself.

The page is the layer you can fix in thirty seconds from your phone. Finished the internship, started the job, graduated — change the entry, and every link you have ever handed out is current again. That is the entire argument for a page over a file.

The file is the layer that goes stale, and there is no trick that avoids it. So the honest rule is: keep the page accurate always, and re-upload the document when something changes enough to matter. Someone reading a CV six weeks out of date, on a page that correctly says where you are now, has lost very little. If the page were wrong too, they would have no way of knowing.

## What this is not

It is not a CV builder. It will not check your CV against a job description, score it, rewrite your bullet points, or tell you what an applicant tracking system will make of it. It does not try to, and a worse version of that here would not help you.

It is the page you hand over, with the real document attached to it.

## Setting it up

1. Open your dashboard and fill in **Background** — experience first, then education.
2. Mark anything ongoing as current, so it sorts where it belongs.
3. Attach your CV, once you have decided what is on it.
4. Open your own page and read it as a stranger would, in the ten seconds you would actually get.

If those ten seconds work, the file gets opened. That is the whole design.
`,
};
