/**
 * Share destinations for one link.
 *
 * Every entry is a plain public URL a browser can open, so nothing here needs
 * an SDK or an app id. That is also why Messenger and Snapchat are absent:
 * both hand off through an endpoint that requires a registered app id, and a
 * button that opens a broken page is worse than one that is not there.
 */
export type ShareTargetId =
  | "x"
  | "facebook"
  | "whatsapp"
  | "linkedin"
  | "email";

export type ShareTarget = {
  id: ShareTargetId;
  label: string;
  href: string;
};

/**
 * What a shared message says: the title, then the link. Somewhere without a
 * title (a bare URL) it is just the URL, so WhatsApp does not send a message
 * that starts with a dash.
 */
export function shareMessage(title: string, url: string) {
  const clean = title.trim();
  return clean ? `${clean} — ${url}` : url;
}

/**
 * The address as it reads on the sheet. `https://www.gofundme.com/f/help` is
 * mostly noise at this size, and the sheet's job is to say which page is being
 * shared, not to be a copyable source of truth (that is Copy link's job).
 */
export function shortenShareUrl(url: string, max = 34) {
  const bare = url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
  return bare.length > max ? `${bare.slice(0, max)}…` : bare;
}

export function linkShareTargets({
  url,
  title,
}: {
  url: string;
  title: string;
}): ShareTarget[] {
  const target = encodeURIComponent(url);
  const message = encodeURIComponent(shareMessage(title, url));
  const subject = encodeURIComponent(title.trim() || url);

  return [
    {
      id: "x",
      label: "X",
      // The link goes as its own parameter so X can still build a card for it
      // when the title is empty.
      href: `https://twitter.com/intent/tweet?url=${target}&text=${encodeURIComponent(title.trim())}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${target}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${message}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${target}`,
    },
    {
      id: "email",
      label: "Email",
      href: `mailto:?subject=${subject}&body=${message}`,
    },
  ];
}
