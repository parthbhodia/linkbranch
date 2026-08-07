export type SeoPageTheme = "acid" | "ink" | "rose" | "sky";

export type SeoPageConfig = {
  path: string;
  locale?: "en" | "es" | "it";
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  lead: string;
  theme: SeoPageTheme;
  proof: Array<{ value: string; label: string }>;
  preview: {
    category: string;
    initials: string;
    handle: string;
    headline: string;
    accent: string;
    bio: string;
    links: string[];
    referral?: { provider: string; offer: string; code: string };
  };
  sections: Array<{
    heading: string;
    body: string;
    bullets: string[];
  }>;
  steps: Array<{ title: string; body: string }>;
  comparison?: {
    heading: string;
    intro: string;
    columns: [string, string, string];
    rows: Array<[string, string, string]>;
  };
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ href: string; label: string }>;
  primaryCta: string;
  primaryHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  sourceLinks?: Array<{ label: string; href: string }>;
  placeholderTestimonials?: Array<{
    quote: string;
    persona: string;
    context: string;
  }>;
};

const startFresh = "/auth?mode=signup&utm_source=seo&utm_medium=landing";
const importLinktree = "/#import";

export const seoPages: SeoPageConfig[] = [
  {
    path: "/digital-business-card",
    metaTitle: "Free Digital Business Card—With a Contact Inbox | Cueful",
    metaDescription:
      "A free digital business card people can save to their phone, plus a two-way exchange so you keep their details too. Tag the event, add a note, sort the pile, export to CSV.",
    eyebrow: "DIGITAL BUSINESS CARD",
    title: "The card is the easy half.",
    lead:
      "Tapping a phone hands over your details and leaves you with nothing. Cueful gives people a card they can save, asks for theirs back, and files every contact under the event you met at—so tomorrow morning you still know who they were.",
    theme: "ink",
    proof: [
      { value: "$0", label: "no card to buy" },
      { value: "2-way", label: "you get their details too" },
      { value: "CSV", label: "export to your CRM" },
    ],
    preview: {
      category: "SALES / NETWORKING",
      initials: "RM",
      handle: "@rae-mercer",
      headline: "Let’s pick this up",
      accent: "on Monday.",
      bio: "Enterprise AE. Save my card, send me yours, and I’ll follow up with context.",
      links: ["Save my contact", "Book 20 minutes", "See customer stories"],
    },
    sections: [
      {
        heading: "Why NFC cards lose the plot",
        body:
          "A paper card was never valuable because it carried a phone number. It was valuable because you could write on the back of it, and because the stack in your jacket pocket was a to-do list. Tapping a phone deletes both of those and leaves an unsorted row in your contacts app.",
        bullets: [
          "One-way by design: they get your details, you get nothing back",
          "No context—no event, no date, no note about what you actually discussed",
          "Everything lands in one flat contacts list with no way to sort it",
          "Hardware you have to buy, carry, and remember you own",
        ],
      },
      {
        heading: "A card that goes both ways",
        body:
          "Your Cueful page has a Save my contact button that drops a proper vCard into any phone—iPhone or Android, no app, no hardware. Next to it sits the half every NFC card is missing: a short form so they can send their details back to you.",
        bullets: [
          "Save my contact writes name, title, company, phone, email, and links",
          "Send me yours captures their name, email, phone, and company",
          "A notes field for the thing you’ll want to remember tomorrow",
          "Works from your existing QR code, printed or on screen",
        ],
      },
      {
        heading: "The morning after is the actual product",
        body:
          "Turn on event mode before you walk in and every contact you collect that day is stamped with where you met. Your dashboard groups them by event instead of dumping them into one list, so the pile stays readable.",
        bullets: [
          "Event mode tags every capture automatically",
          "Sort each person into Meet 1:1, Keep warm, or Archive",
          "Edit notes inline while the conversation is still fresh",
          "Export the lot to CSV for Salesforce, HubSpot, or a spreadsheet",
        ],
      },
      {
        heading: "Your data stays yours",
        body:
          "Cueful does not sell contact data or scan history. Everything you collect can be exported or deleted from your account settings at any time, and the card itself costs nothing.",
        bullets: [
          "No subscription and no hardware to buy",
          "Full account export and delete built in",
          "Turn the exchange form off whenever you want",
        ],
      },
    ],
    steps: [
      {
        title: "Fill in your card",
        body: "Add your title, company, phone, and contact email in settings. That is what a saved contact will contain.",
      },
      {
        title: "Turn on event mode",
        body: "Name where you are—“SaaStr, Tuesday mixer”—before you walk in.",
      },
      {
        title: "Show your QR",
        body: "They scan, save your contact, and send theirs back in the same breath.",
      },
      {
        title: "Sort the pile",
        body: "Next morning, work through the event group: meet, warm, or archive. Export when you are done.",
      },
    ],
    comparison: {
      heading: "Cueful next to an NFC card",
      intro:
        "NFC cards solve distribution, which was never the hard part. This is where the two differ.",
      columns: ["What you need", "Cueful", "NFC card or tag"],
      rows: [
        ["Share your details", "QR or link, no hardware", "Tap, if their phone cooperates"],
        ["Save to their phone", "vCard download", "vCard download"],
        ["Get their details back", "Built-in exchange form", "Usually not included"],
        ["Know where you met", "Automatic event tagging", "Not captured"],
        ["Notes on the conversation", "Per-contact notes field", "Whatever you retype later"],
        ["Get it into a CRM", "CSV export", "Varies, often a paid tier"],
        ["Cost", "Free", "Card purchase, often plus a subscription"],
      ],
    },
    faqs: [
      {
        question: "Do I need to buy an NFC card to use this?",
        answer:
          "No. Cueful works from a QR code or a link, which any phone camera can read without an app. If you already own an NFC card, point it at your Cueful URL and it will work the same way.",
      },
      {
        question: "Will the contact save properly on an iPhone?",
        answer:
          "Yes. Save my contact serves a standard vCard file, which both iOS and Android Contacts import directly. Nobody has to install anything.",
      },
      {
        question: "How do I get their details, not just give mine?",
        answer:
          "Your page includes a short form so the person you just met can send their name, email, phone, and company straight back to you, along with a note about what you discussed. It lands in your dashboard, tagged with the event.",
      },
      {
        question: "Can I get my contacts into Salesforce or HubSpot?",
        answer:
          "Export everyone to CSV from the dashboard and import that file into your CRM. Direct integrations are not available yet.",
      },
      {
        question: "Is this really free?",
        answer:
          "Yes. The card, the exchange form, event tagging, notes, and CSV export are all free to use.",
      },
    ],
    related: [
      { href: "/free-link-in-bio", label: "Free link-in-bio page" },
      {
        href: "/templates/portfolio-link-page-for-freelancers",
        label: "Portfolio page for freelancers",
      },
      { href: "/best-link-in-bio-tools", label: "Compare link-in-bio tools" },
    ],
    primaryCta: "Create your card",
    primaryHref: startFresh,
    secondaryCta: "See a live example",
    secondaryHref: "/demo",
  },
  {
    path: "/free-linktree-alternative",
    metaTitle: "Free Linktree Alternative—No Ads or Branding | Cueful",
    metaDescription:
      "Import your Linktree into a free, ad-free link-in-bio page with no forced branding, referral cards, lifetime analytics, and downloadable QR codes.",
    eyebrow: "FREE LINKTREE ALTERNATIVE",
    title: "The genuinely free Linktree alternative.",
    lead:
      "Move your links without rebuilding from scratch. Cueful imports a public Linktree, removes the platform badge, and gives referral offers the attention they deserve.",
    theme: "acid",
    proof: [
      { value: "$0", label: "to publish" },
      { value: "0", label: "visitor ads" },
      { value: "<60s", label: "import flow" },
    ],
    preview: {
      category: "CREATOR / IMPORTED",
      initials: "AC",
      handle: "@alex-curates",
      headline: "Everything worth",
      accent: "opening.",
      bio: "Projects, useful tools, and referral offers—kept current.",
      links: ["Newest project", "Creator field notes", "Tools I use weekly"],
      referral: {
        provider: "NOTION",
        offer: "A cleaner workspace for your next project",
        code: "ALEX20",
      },
    },
    sections: [
      {
        heading: "A switch, not a restart",
        body:
          "Paste your public Linktree URL and Cueful brings over the profile details and usable destination links it can read. You choose a design before account creation, so the imported page already feels concrete.",
        bullets: [
          "Public Linktree URL import",
          "Design selection before signup",
          "Editable profile and links after import",
        ],
      },
      {
        heading: "Free should look finished",
        body:
          "Cueful public profiles ship without visitor ads or a forced Cueful badge. The free editor includes three designed templates, profile links, social profiles, referral cards, and a share kit.",
        bullets: [
          "No forced platform branding",
          "No credit card to publish",
          "QR downloads in SVG and PNG",
        ],
      },
      {
        heading: "Signals beyond a click count",
        body:
          "The dashboard tracks lifetime page views, outbound clicks, click-through rate, referral opens, coupon-code copies, referrers, devices, and countries.",
        bullets: [
          "Lifetime views and clicks",
          "Referral offer and code-copy activity",
          "Top referrer, device, and country",
        ],
      },
    ],
    steps: [
      {
        title: "Paste your Linktree",
        body: "Use the public linktr.ee address already in your social bio.",
      },
      {
        title: "Choose the page",
        body: "Preview Field Notes, After Dark, or Soft Studio with your imported content.",
      },
      {
        title: "Claim and publish",
        body: "Create the account, confirm the username, make any edits, and publish.",
      },
    ],
    comparison: {
      heading: "What Cueful includes today",
      intro:
        "This is a product checklist, not a vague promise. Upcoming features are intentionally excluded.",
      columns: ["Capability", "Cueful free", "Why it matters"],
      rows: [
        ["Forced platform badge", "No", "Your profile stays yours"],
        ["Visitor ads", "None", "Attention stays on your links"],
        ["Lifetime analytics", "Included", "Views, clicks, CTR, sources, devices"],
        ["Referral cards", "Included", "Offers and codes are first-class content"],
        ["QR export", "SVG + PNG", "Useful online and in print"],
        ["Linktree import", "Included", "Move without retyping every link"],
      ],
    },
    faqs: [
      {
        question: "Is Cueful really a free Linktree alternative?",
        answer:
          "Yes. You can create and publish a Cueful profile without entering a credit card. Public pages do not display visitor ads or forced Cueful branding.",
      },
      {
        question: "What does the Linktree importer copy?",
        answer:
          "Cueful reads a public Linktree page and imports the profile name, bio, usable destination links, and recognizable social links when available. You can review everything before publishing.",
      },
      {
        question: "Will my old Linktree change?",
        answer:
          "No. Importing is read-only and does not edit or delete the original page. You decide when to replace the link in your social bio.",
      },
    ],
    related: [
      { href: "/cueful-vs-linktree", label: "Cueful vs Linktree" },
      { href: "/free-link-in-bio", label: "Free link-in-bio tool" },
      { href: "/best-link-in-bio-tools", label: "Best link-in-bio tools" },
      {
        href: "/templates/referral-links-for-creators",
        label: "Referral links template",
      },
    ],
    primaryCta: "Import your Linktree",
    primaryHref: importLinktree,
    secondaryCta: "Start with a blank page",
    secondaryHref: `${startFresh}&utm_campaign=free-linktree-alternative`,
    sourceLinks: [
      {
        label: "Review Linktree’s current plan details",
        href: "https://linktr.ee/s/pricing",
      },
    ],
    placeholderTestimonials: [
      {
        quote:
          "The import preview makes switching feel like a small edit instead of a weekend project.",
        persona: "Illustrative creator",
        context: "SAMPLE COPY · NOT A CUSTOMER ENDORSEMENT",
      },
      {
        quote:
          "I can see the referral code, the reason to use it, and the next step without hunting.",
        persona: "Illustrative visitor",
        context: "SAMPLE COPY · NOT A CUSTOMER ENDORSEMENT",
      },
      {
        quote:
          "The page looks finished before I have to think about upgrades or visitor ads.",
        persona: "Illustrative independent maker",
        context: "SAMPLE COPY · NOT A CUSTOMER ENDORSEMENT",
      },
    ],
  },
  {
    path: "/free-link-in-bio",
    metaTitle: "Create a Free Bio Link Page | Cueful",
    metaDescription:
      "Create a free bio link page with customizable layouts, referral cards, QR downloads, and lifetime audience analytics—without visitor ads.",
    eyebrow: "FREE BIO LINK PAGE",
    title: "Build your free bio link page.",
    lead:
      "Turn scattered links, recommendations, and referral codes into one focused page you can publish and share from any social profile.",
    theme: "rose",
    proof: [
      { value: "1", label: "memorable URL" },
      { value: "3", label: "starting designs" },
      { value: "∞", label: "lifetime signals" },
    ],
    preview: {
      category: "MAKER / WEEKLY",
      initials: "MM",
      handle: "@maya-makes",
      headline: "Tiny ideas become",
      accent: "bright things.",
      bio: "Sketchbook tours, cheerful downloads, and the tools behind the work.",
      links: ["This week’s studio note", "Download the color guide", "Watch the process"],
    },
    sections: [
      {
        heading: "Made for the in-app browser",
        body:
          "Most visitors arrive from Instagram, TikTok, or YouTube on a phone. Cueful keeps the hierarchy clear, tap targets large, and the page useful before loading anything heavy.",
        bullets: [
          "Responsive profile layouts",
          "Readable contrast and labelled controls",
          "No visitor ad detours",
        ],
      },
      {
        heading: "Links with a reason to click",
        body:
          "Add a title, supporting line, image, and featured treatment so visitors understand what waits on the other side. Referral offers get dedicated code-copy actions instead of pretending to be ordinary links.",
        bullets: [
          "Featured and standard links",
          "Optional thumbnails",
          "Referral offers with copyable codes",
        ],
      },
      {
        heading: "Share it beyond your bio",
        body:
          "Every published profile includes a Share Kit for a direct URL, customizable QR code, square social graphic, and print-ready poster.",
        bullets: [
          "Native sharing and link copy",
          "QR-only SVG and PNG",
          "Square post and portrait poster exports",
        ],
      },
    ],
    steps: [
      { title: "Choose a design", body: "Start editorial, dark, or image-forward." },
      { title: "Add your essentials", body: "Write the profile and order the links that matter now." },
      { title: "Publish and measure", body: "Share one URL and learn what people actually open." },
    ],
    comparison: {
      heading: "A focused free toolkit",
      intro:
        "Cueful starts with the things a creator needs to publish and learn—not a marketplace of distracting widgets.",
      columns: ["Included", "Status", "Best use"],
      rows: [
        ["Profile and social links", "Live", "Introduce yourself clearly"],
        ["Link and referral cards", "Live", "Guide clicks and code copies"],
        ["Audience analytics", "Live", "Understand traffic and intent"],
        ["Share Kit and QR", "Live", "Move between social, web, and print"],
        ["Custom domain workflow", "In development", "Use your own address"],
      ],
    },
    faqs: [
      {
        question: "What is a link-in-bio page?",
        answer:
          "It is a mobile-friendly landing page reached from the single website field in a social profile. It lets one bio URL lead to several destinations.",
      },
      {
        question: "Can I use Cueful on Instagram and TikTok?",
        answer:
          "Yes. Publish the Cueful page, copy its URL, and place that address in the website field offered by the social platform.",
      },
      {
        question: "Does Cueful put ads on my profile?",
        answer:
          "No. Cueful does not insert visitor ads into published creator profiles.",
      },
    ],
    related: [
      { href: "/link-in-bio-for-instagram", label: "Instagram setup guide" },
      { href: "/link-in-bio-for-tiktok", label: "TikTok setup guide" },
      { href: "/link-in-bio-tools", label: "Compare link-in-bio tools" },
    ],
    primaryCta: "Create your free page",
    primaryHref: `${startFresh}&utm_campaign=free-link-in-bio`,
    secondaryCta: "Import a Linktree",
    secondaryHref: importLinktree,
  },
  {
    path: "/best-link-in-bio-tools",
    metaTitle: "4 Best Link-in-Bio Tools for Creators in 2026",
    metaDescription:
      "Compare four leading link-in-bio tools and find the best option for referrals, selling, customization, analytics, or an all-purpose creator page.",
    eyebrow: "BUYER’S GUIDE / JULY 2026",
    title: "Four strong link-in-bio tools, each best at a different job.",
    lead:
      "Our practical shortlist compares Cueful, Linktree, Beacons, and Carrd by the creator outcome each serves best—not by affiliate commission or widget count.",
    theme: "sky",
    proof: [
      { value: "4", label: "tools reviewed" },
      { value: "5", label: "decision criteria" },
      { value: "0", label: "affiliate rankings" },
    ],
    preview: {
      category: "SHORTLIST / DECISION",
      initials: "04",
      handle: "A practical shortlist",
      headline: "Choose for the",
      accent: "actual job.",
      bio: "A focused page, creator storefront, flexible one-pager, or established ecosystem.",
      links: ["Cueful · focused referrals", "Linktree · broad ecosystem", "Beacons · creator business"],
    },
    sections: [
      {
        heading: "Choose Cueful for focus",
        body:
          "Cueful is strongest when you want a fast, ad-free creator page with no forced platform badge, referral cards, QR exports, and lifetime audience signals. It deliberately has fewer commerce widgets today.",
        bullets: [
          "Best for referral and coupon curators",
          "No forced badge on free public profiles",
          "Linktree importer reduces switching work",
        ],
      },
      {
        heading: "Choose Linktree for breadth",
        body:
          "Linktree has the widest established ecosystem in this shortlist, including embeds, shops, digital products, and social tools. Its official pricing page separates essential analytics from more comprehensive paid analytics.",
        bullets: [
          "Best for an established all-purpose ecosystem",
          "Unlimited links and essential analytics on Free",
          "Many monetization and embed options",
        ],
      },
      {
        heading: "Choose Beacons or Carrd for a different shape",
        body:
          "Beacons combines link-in-bio, store, media kit, email, and creator-business tools. Carrd is a flexible one-page site builder: excellent for custom composition, but less opinionated about link-in-bio analytics and referrals.",
        bullets: [
          "Beacons: creator storefront and business suite",
          "Carrd: custom one-page design freedom",
          "Expect different setup and pricing tradeoffs",
        ],
      },
    ],
    steps: [
      { title: "Name the primary job", body: "Clicks, referrals, sales, email capture, or visual portfolio." },
      { title: "Test the mobile page", body: "Open the real example inside Instagram or TikTok’s browser." },
      { title: "Check the ongoing cost", body: "Compare the exact features you need—not the longest checklist." },
    ],
    comparison: {
      heading: "Fast shortlist",
      intro:
        "Plan details change. This table describes the platform’s clearest current fit; use the official links below before buying.",
      columns: ["Tool", "Best fit", "Important tradeoff"],
      rows: [
        ["Cueful", "Focused profiles, referrals, clean analytics", "Smaller embed and commerce set today"],
        ["Linktree", "Broad link-in-bio ecosystem", "Advanced customization and analytics span paid plans"],
        ["Beacons", "Store, media kit, email, creator business", "Free and Creator store sales carry a published fee"],
        ["Carrd", "Highly custom one-page sites", "More manual setup for link-in-bio workflows"],
      ],
    },
    faqs: [
      {
        question: "What is the best free link-in-bio tool?",
        answer:
          "For a clean profile with referrals and no forced badge, Cueful is the focused option. Linktree is stronger for ecosystem breadth, Beacons for selling, and Carrd for custom one-page design.",
      },
      {
        question: "Should I pay for a link-in-bio tool?",
        answer:
          "Pay when a specific feature produces measurable value—for example, commerce, custom-domain support, advanced design, or an integration. Do not upgrade only because a comparison chart is long.",
      },
      {
        question: "How was this list ranked?",
        answer:
          "It is organized by use case rather than commission or overall score. Cueful is included transparently as the product publishing this guide.",
      },
    ],
    related: [
      { href: "/free-linktree-alternative", label: "Free Linktree alternative" },
      { href: "/cueful-vs-beacons", label: "Cueful vs Beacons" },
      { href: "/cueful-vs-carrd", label: "Cueful vs Carrd" },
    ],
    primaryCta: "Try Cueful free",
    primaryHref: `${startFresh}&utm_campaign=best-link-in-bio-tools`,
    secondaryCta: "Compare the workflow",
    secondaryHref: "/link-in-bio-tools",
    sourceLinks: [
      { label: "Linktree pricing", href: "https://linktr.ee/s/pricing" },
      { label: "Beacons pricing", href: "https://shop.beacons.ai/i/pricing" },
      { label: "Carrd plans", href: "https://carrd.co/docs/pro/plans" },
    ],
  },
  {
    path: "/link-in-bio-tools",
    metaTitle: "How to Compare Link-in-Bio Tools: 7 Useful Criteria",
    metaDescription:
      "Evaluate any link-in-bio tool using seven practical criteria: focus, speed, branding, analytics, portability, sharing, and total cost.",
    eyebrow: "LINK-IN-BIO EVALUATION GUIDE",
    title: "How to compare link-in-bio tools before you commit.",
    lead:
      "The best tool helps a visitor decide what to open next. Use this framework to evaluate the public page, the editor, and the price you will still be paying a year from now.",
    theme: "ink",
    proof: [
      { value: "3", label: "surfaces to test" },
      { value: "7", label: "useful criteria" },
      { value: "1", label: "primary action" },
    ],
    preview: {
      category: "EVALUATION / MOBILE",
      initials: "UX",
      handle: "Visitor first",
      headline: "Less choice.",
      accent: "More direction.",
      bio: "Test the public page before falling in love with the editor.",
      links: ["Can I identify the creator?", "Do I know what to click?", "Does it load without a fight?"],
    },
    sections: [
      {
        heading: "Start with the public page",
        body:
          "Open a real profile on a mid-range phone inside an in-app browser. Check loading, text contrast, tap targets, unexpected ads, and whether the most important action appears without scrolling through noise.",
        bullets: [
          "Mobile load and visual stability",
          "Clear hierarchy and accessible controls",
          "No surprise visitor detours",
        ],
      },
      {
        heading: "Then test the editor",
        body:
          "A good builder makes common changes obvious: reorder links, feature one item, update the intro, preview the result, publish, and undo mistakes. A large component catalog does not guarantee a clear workflow.",
        bullets: [
          "Fast edit-to-preview feedback",
          "Explicit save and publish states",
          "Useful templates rather than decorative variants",
        ],
      },
      {
        heading: "Finally, inspect the data",
        body:
          "Raw click totals are rarely enough. Look for views, CTR, top destinations, referral sources, devices, countries, and conversion-adjacent actions such as code copies.",
        bullets: [
          "Lifetime versus limited history",
          "Page-level and item-level signals",
          "Data export and ownership expectations",
        ],
      },
    ],
    steps: [
      { title: "Build the same five-link page", body: "Use identical content on each shortlisted platform." },
      { title: "Ask three people to use it", body: "Watch where they hesitate; do not explain the interface." },
      { title: "Price the needed plan", body: "Include branding removal, analytics history, domains, and exports." },
    ],
    comparison: {
      heading: "Seven questions worth asking",
      intro: "Score each platform from one to five using the same real profile.",
      columns: ["Criterion", "Question", "Cueful approach"],
      rows: [
        ["Focus", "Is the next action obvious?", "Links, featured items, referral cards"],
        ["Speed", "Does mobile feel immediate?", "Lightweight profile layouts"],
        ["Brand", "Who owns the visual identity?", "No forced public badge"],
        ["Insight", "Can I understand intent?", "Views, CTR, referrers, devices, code copies"],
        ["Portability", "Can I move without retyping?", "Public Linktree import"],
        ["Sharing", "Can I use it offline?", "Custom QR SVG and PNG"],
        ["Cost", "What becomes paid later?", "Current free features stated plainly"],
      ],
    },
    faqs: [
      {
        question: "How many links should a link-in-bio page contain?",
        answer:
          "There is no universal limit, but the page should make the most important action obvious. Archive stale links and group related destinations instead of treating unlimited links as a target.",
      },
      {
        question: "Are more embeds always better?",
        answer:
          "No. Embeds can add context, but they also add weight and competing actions. Prefer a lightweight preview unless the embedded interaction is central to the page.",
      },
      {
        question: "What analytics matter most?",
        answer:
          "Start with views, outbound clicks, CTR, top destinations, referrers, devices, and countries. Referral creators should also track offer opens and code copies.",
      },
    ],
    related: [
      { href: "/best-link-in-bio-tools", label: "Best tools by use case" },
      { href: "/free-link-in-bio", label: "Create a free page" },
      { href: "/what-does-link-in-bio-mean", label: "Link in bio meaning" },
    ],
    primaryCta: "Build the test page",
    primaryHref: `${startFresh}&utm_campaign=link-in-bio-tools`,
  },
  {
    path: "/link-in-bio-for-instagram",
    metaTitle: "How to Add a Link to Your Instagram Bio | Cueful",
    metaDescription:
      "Create one mobile-friendly page for your Instagram bio, add the URL to your profile, and measure which links and offers people open.",
    eyebrow: "INSTAGRAM GUIDE",
    title: "Turn one Instagram bio link into a clear next step.",
    lead:
      "Build the destination first, then place its URL in Instagram’s profile links. Keep the first screen recognizable, focused, and easy to tap.",
    theme: "rose",
    proof: [
      { value: "1", label: "profile destination" },
      { value: "3", label: "first-screen priorities" },
      { value: "100%", label: "mobile-first" },
    ],
    preview: {
      category: "INSTAGRAM / CREATOR",
      initials: "NK",
      handle: "@nora-kitchen",
      headline: "Cook this",
      accent: "tonight.",
      bio: "The current recipe, pantry guide, and tools used in the reel.",
      links: ["Recipe from today’s reel", "Free pantry checklist", "My everyday cookware"],
      referral: { provider: "PANTRY", offer: "Save 15% on the spice set", code: "NORA15" },
    },
    sections: [
      {
        heading: "Match the promise in the post",
        body:
          "If a Reel says “recipe in bio,” the destination should visibly name that recipe. Update or feature the promised item instead of sending visitors into a generic archive.",
        bullets: [
          "Repeat the language used in the post",
          "Feature the timely destination",
          "Keep evergreen links below it",
        ],
      },
      {
        heading: "Design for Instagram’s browser",
        body:
          "Visitors may arrive inside Instagram rather than Safari or Chrome. Use readable type, strong contrast, generous tap targets, and lightweight images.",
        bullets: [
          "Test on iOS and Android",
          "Avoid autoplay and heavy widget stacks",
          "Keep copy concise above the fold",
        ],
      },
      {
        heading: "Learn which content travels",
        body:
          "Use referrer and link-level activity to compare destinations. Coupon-code copies are especially useful when the purchase happens later or on another device.",
        bullets: [
          "Track page views and CTR",
          "Compare featured-link opens",
          "Measure referral opens and code copies",
        ],
      },
    ],
    steps: [
      { title: "Publish your Cueful", body: "Create or import the profile and copy its public URL." },
      { title: "Open Instagram profile settings", body: "Use Instagram’s current profile-link controls to add the website." },
      { title: "Test from a second account", body: "Open the profile link and complete the intended action on mobile." },
    ],
    faqs: [
      {
        question: "Where should I put my Cueful URL on Instagram?",
        answer:
          "Add it through Instagram’s profile editing controls for links or websites. Instagram changes labels over time, so follow the current in-app wording.",
      },
      {
        question: "What should be first on an Instagram link page?",
        answer:
          "The item promised by your newest high-priority post or campaign should be first or featured. Keep stable destinations below it.",
      },
      {
        question: "Can I track Instagram visitors?",
        answer:
          "Cueful records available referrer information plus page views, clicks, devices, countries, referral opens, and code copies. Some in-app browsers may limit referrer detail.",
      },
    ],
    related: [
      { href: "/link-in-bio-for-tiktok", label: "TikTok setup guide" },
      { href: "/free-link-in-bio", label: "Free link-in-bio tool" },
      {
        href: "/templates/portfolio-link-page-for-freelancers",
        label: "Freelancer portfolio template",
      },
    ],
    primaryCta: "Create your Instagram link",
    primaryHref: `${startFresh}&utm_campaign=instagram-link-in-bio`,
  },
  {
    path: "/link-in-bio-for-tiktok",
    metaTitle: "How to Add a Link to Your TikTok Bio | Cueful",
    metaDescription:
      "Build a fast link page for TikTok, add it using the link options available to your account, and track visits, clicks, and referral-code copies.",
    eyebrow: "TIKTOK GUIDE",
    title: "Give TikTok curiosity somewhere useful to land.",
    lead:
      "The video creates momentum. Your bio destination should preserve it with recognizable language, one featured action, and fast mobile loading.",
    theme: "ink",
    proof: [
      { value: "1", label: "featured action" },
      { value: "0", label: "autoplay detours" },
      { value: "3", label: "signals to watch" },
    ],
    preview: {
      category: "TIKTOK / MUSIC",
      initials: "LO",
      handle: "@lena-onloop",
      headline: "Hear the full",
      accent: "version.",
      bio: "New release, live dates, stems, and the gear behind the sound.",
      links: ["Stream the new single", "Watch the full session", "Upcoming live dates"],
    },
    sections: [
      {
        heading: "Continue the exact story",
        body:
          "Use the same title, visual cue, or phrase from the video on the destination. Visitors should know within seconds that the link is connected to what they just watched.",
        bullets: [
          "Feature the current release or resource",
          "Use short, specific link labels",
          "Move older campaigns down or deactivate them",
        ],
      },
      {
        heading: "Account options can differ",
        body:
          "TikTok’s available website-link controls can vary by account type, region, and product changes. Build the page now, then use the link field currently offered in your profile settings.",
        bullets: [
          "Check the current in-app profile controls",
          "Avoid instructions tied to an old menu label",
          "Test the finished route from the public profile",
        ],
      },
      {
        heading: "Separate attention from action",
        body:
          "A high-view video does not guarantee outbound intent. Compare Cueful page views with link opens and code copies to see which videos produce useful action.",
        bullets: [
          "Watch page views after each post",
          "Measure outbound click-through rate",
          "Use codes when attribution crosses devices",
        ],
      },
    ],
    steps: [
      { title: "Create the mobile destination", body: "Use a Cueful template and feature one timely action." },
      { title: "Add the URL when available", body: "Place it in the website or link control offered by TikTok." },
      { title: "Review the signals", body: "Compare visits, CTR, top links, and code copies after publishing." },
    ],
    faqs: [
      {
        question: "Why can’t I add a website to my TikTok bio?",
        answer:
          "Website-link availability can vary by account type, region, and TikTok product changes. Check the current profile settings and TikTok’s official help for your account.",
      },
      {
        question: "Should my TikTok page contain every link?",
        answer:
          "It can, but the first screen should prioritize what your current videos promise. A maintained page usually converts better than an undifferentiated archive.",
      },
      {
        question: "Can I use the same Cueful for TikTok and Instagram?",
        answer:
          "Yes. Use one profile across platforms, or adjust featured links around a campaign. Referrer information can help distinguish traffic when the source is available.",
      },
    ],
    related: [
      { href: "/link-in-bio-for-instagram", label: "Instagram setup guide" },
      {
        href: "/templates/link-in-bio-for-musicians",
        label: "Musician link-in-bio template",
      },
      { href: "/what-does-link-in-bio-mean", label: "What “link in bio” means" },
    ],
    primaryCta: "Build your TikTok page",
    primaryHref: `${startFresh}&utm_campaign=tiktok-link-in-bio`,
  },
  {
    path: "/what-does-link-in-bio-mean",
    metaTitle: "What Does “Link in Bio” Mean? A Simple Guide",
    metaDescription:
      "“Link in bio” means the clickable website address in a social profile. Learn where to find it, why creators use it, and how to create your own.",
    eyebrow: "PLAIN-ENGLISH GUIDE",
    title: "“Link in bio” means: open the creator’s profile, then tap their website.",
    lead:
      "Social captions often cannot hold every useful destination. The profile link acts as a small front door to the current video, product, article, signup, or collection.",
    theme: "sky",
    proof: [
      { value: "BIO", label: "the profile description" },
      { value: "LINK", label: "the clickable address" },
      { value: "PAGE", label: "the destination it opens" },
    ],
    preview: {
      category: "TERM / EXPLAINED",
      initials: "?",
      handle: "Find the profile",
      headline: "Tap the website.",
      accent: "That’s it.",
      bio: "The destination may be one page containing several current links.",
      links: ["The mentioned resource", "Newest work", "Contact or subscribe"],
    },
    sections: [
      {
        heading: "Where is the bio?",
        body:
          "A bio is the short description near the top of a person or brand’s social profile. Platforms usually place profile links close to that description, though the exact labels and layout change.",
        bullets: [
          "Open the account’s main profile",
          "Look below or near the description",
          "Tap the displayed website or link",
        ],
      },
      {
        heading: "Why not paste the link in the caption?",
        body:
          "Some platforms limit clickable links in ordinary captions. A stable profile URL lets the creator update the destinations behind it without editing every old post.",
        bullets: [
          "One memorable address",
          "Destinations can change over time",
          "Useful across several social platforms",
        ],
      },
      {
        heading: "What should the destination contain?",
        body:
          "The page should make the promised resource easy to recognize. It may also include evergreen work, social profiles, contact options, or clearly disclosed referral offers.",
        bullets: [
          "The item mentioned in the post",
          "A few maintained evergreen destinations",
          "Clear labels instead of mystery buttons",
        ],
      },
    ],
    steps: [
      { title: "Open the creator’s profile", body: "Tap the account name or profile image." },
      { title: "Find the website field", body: "Look near the bio for a clickable URL or link label." },
      { title: "Open the destination", body: "Choose the item that matches the post you came from." },
    ],
    faqs: [
      {
        question: "Is “link in bio” the same as Linktree?",
        answer:
          "No. “Link in bio” describes the location and behavior. Linktree is one product used to build the destination; Cueful and other tools can serve the same purpose.",
      },
      {
        question: "Is it safe to click a link in bio?",
        answer:
          "Treat it like any website link. Check the displayed domain, be cautious with unexpected login or payment requests, and leave if the destination does not match the creator’s promise.",
      },
      {
        question: "Can I make my own link-in-bio page?",
        answer:
          "Yes. Cueful lets you create one free, or import an existing public Linktree and edit it before publishing.",
      },
    ],
    related: [
      { href: "/free-link-in-bio", label: "Create a free page" },
      { href: "/link-in-bio-for-instagram", label: "Add one to Instagram" },
      { href: "/link-in-bio-for-tiktok", label: "Add one to TikTok" },
    ],
    primaryCta: "Make your own link in bio",
    primaryHref: `${startFresh}&utm_campaign=link-in-bio-meaning`,
  },
  {
    path: "/templates/link-in-bio-for-musicians",
    metaTitle: "Link-in-Bio Template for Musicians | Cueful",
    metaDescription:
      "Musician link-in-bio template with Spotify embeds, live dates, merch, and tour links—fans listen without leaving your page.",
    eyebrow: "TEMPLATE / MUSICIANS",
    title: "Let the newest release lead.",
    lead:
      "A musician’s link page should answer the fan’s immediate question—where can I hear this?—with an inline Spotify or Apple Music player, then offer live dates, videos, merch, and the archive.",
    theme: "ink",
    proof: [
      { value: "01", label: "embedded player" },
      { value: "02", label: "watch or attend" },
      { value: "03", label: "merch & catalogue" },
    ],
    preview: {
      category: "MUSICIAN / AFTER DARK",
      initials: "LO",
      handle: "@lena-onloop",
      headline: "New single:",
      accent: "Glass Houses.",
      bio: "Independent electronic songwriter. New York / everywhere after midnight.",
      links: [
        "▶ Spotify player · Glass Houses",
        "Watch the live-room video",
        "Fall shows + tickets",
        "Browse the archive",
      ],
      referral: { provider: "GEAR", offer: "The compact interface used on the record", code: "LOOP10" },
    },
    sections: [
      {
        heading: "Release mode with embeds",
        body:
          "Paste your Spotify, Apple Music, SoundCloud, or Bandcamp URL. Cueful detects it and renders an inline player—same idea as Linktree Music and Sociials smart embeds—so fans preview before they leave for tickets or merch.",
        bullets: [
          "Spotify / Apple Music / SoundCloud players",
          "Release title above the fold",
          "Video and live dates immediately after",
        ],
      },
      {
        heading: "Between releases",
        body:
          "Shift the page toward the live show, mailing list, catalogue, or process content. Keep the evergreen streaming embed active while you rotate featured links.",
        bullets: [
          "Feature the current tour or session",
          "Keep the streaming embed live",
          "Deactivate expired ticket offers",
        ],
      },
      {
        heading: "Measure fan intent",
        body:
          "Views tell you the page was reached. Link opens and media opens separate streaming interest from tickets, videos, and gear.",
        bullets: [
          "Compare streaming and ticket clicks",
          "See top countries and devices",
          "Track disclosed gear-code copies",
        ],
      },
    ],
    steps: [
      { title: "Choose After Dark", body: "Start with the high-contrast template built for release artwork." },
      {
        title: "Add a music embed",
        body: "Use the Spotify or Apple Music template, paste your track or album URL, and keep layout on Full player.",
      },
      { title: "Share everywhere", body: "Use the same URL in social bios, posters, and the downloadable QR." },
    ],
    faqs: [
      {
        question: "Should a musician use one link for every streaming service?",
        answer:
          "Lead with one embedded player (usually Spotify or Apple Music), then add secondary service links if needed. Avoid a wall of identical “Listen on…” buttons without a player.",
      },
      {
        question: "Can I add ticket links and merch?",
        answer:
          "Yes. Add them as standard or featured links under the embed. Use specific labels such as the city, date, product, or collection.",
      },
      {
        question: "Does Cueful host music files?",
        answer:
          "No audio files are uploaded to Cueful. Cueful embeds official players from Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, and more—so fans listen on your page without you hosting audio.",
      },
    ],
    related: [
      { href: "/templates/spotify-embed-link-in-bio", label: "Spotify embed template" },
      { href: "/templates/link-in-bio-for-podcasters", label: "Podcaster template" },
      { href: "/free-link-in-bio", label: "Free link-in-bio tool" },
    ],
    primaryCta: "Use the musician template",
    primaryHref: "/templates?template=after-dark&utm_source=seo&utm_campaign=musician-template",
  },
  {
    path: "/templates/spotify-embed-link-in-bio",
    metaTitle: "Spotify Embed Link-in-Bio Template | Cueful",
    metaDescription:
      "Add a Spotify music player to your link in bio. Paste a track, album, or playlist URL and Cueful embeds it inline—Linktree-style, no autoplay.",
    eyebrow: "TEMPLATE / SPOTIFY EMBED",
    title: "Put the player on the page.",
    lead:
      "Fans shouldn’t bounce to Spotify just to decide if they care. Paste a Spotify URL, Cueful turns it into an inline player, then route them to tickets, merch, or your newsletter.",
    theme: "ink",
    proof: [
      { value: "Paste", label: "Spotify URL" },
      { value: "Play", label: "inline preview" },
      { value: "Click", label: "tickets & merch" },
    ],
    preview: {
      category: "MUSIC / SPOTIFY",
      initials: "NS",
      handle: "@nova-sounds",
      headline: "Now playing:",
      accent: "Midnight Signal.",
      bio: "Indie electronic. Stream the single, then grab tour dates.",
      links: ["Spotify player", "Tour tickets", "Merch drop", "Mailing list"],
    },
    sections: [
      {
        heading: "How Cueful Spotify embeds work",
        body:
          "Add a music embed from Shop & Media, or paste a Spotify link in Links. Cueful detects open.spotify.com URLs and renders the official Spotify embed player—lazy-loaded, no autoplay.",
        bullets: [
          "Tracks, albums, playlists, and artists",
          "Full player or compact card layout",
          "Open on Spotify still one tap away",
        ],
      },
      {
        heading: "Pair with Apple Music and YouTube",
        body:
          "The same music templates support Apple Music, SoundCloud, Bandcamp, Audiomack, and YouTube—so you can lead with Spotify and still cover every fan’s app.",
        bullets: [
          "Music templates for each major service",
          "Live player preview while editing",
          "Works on the After Dark musician layout",
        ],
      },
    ],
    steps: [
      {
        title: "Open Shop & Media",
        body: "In the dashboard, choose the Spotify music template under Music and media embeds.",
      },
      {
        title: "Paste your Spotify URL",
        body: "Copy a track, album, or playlist link from Spotify and drop it into the URL field.",
      },
      {
        title: "Publish and share",
        body: "Keep Full player on, publish your page, and put cueful.bio/you in every bio.",
      },
    ],
    faqs: [
      {
        question: "Is this like Linktree’s Spotify preview?",
        answer:
          "Yes in spirit: paste a Spotify URL and visitors get an on-page player. Cueful uses Spotify’s official embed rather than a separate audio snippet host.",
      },
      {
        question: "Does the player autoplay?",
        answer: "No. Players load lazily and wait for the visitor to press play.",
      },
      {
        question: "Can I also embed Apple Music?",
        answer: "Yes. Use the Apple Music template in the same Music and media section.",
      },
    ],
    related: [
      { href: "/cueful-vs-linktree", label: "Cueful vs Linktree" },
      { href: "/templates/link-in-bio-for-musicians", label: "Musician template" },
      { href: "/templates/link-in-bio-for-podcasters", label: "Podcaster template" },
    ],
    primaryCta: "Add a Spotify embed",
    primaryHref: "/templates?template=after-dark&utm_source=seo&utm_campaign=spotify-embed",
  },
  {
    path: "/templates/link-in-bio-for-podcasters",
    metaTitle: "Link-in-Bio Template for Podcasters | Cueful",
    metaDescription:
      "Podcaster link-in-bio template with Spotify and YouTube embeds, episode CTAs, guest links, and newsletter signup—built for show notes in one URL.",
    eyebrow: "TEMPLATE / PODCASTERS",
    title: "One link for every episode.",
    lead:
      "Put the latest episode player on your bio page, then stack guest links, transcripts, sponsorships, and the subscribe CTA underneath—without a separate show-notes site.",
    theme: "sky",
    proof: [
      { value: "01", label: "episode player" },
      { value: "02", label: "guest & notes" },
      { value: "03", label: "subscribe" },
    ],
    preview: {
      category: "PODCAST / FIELD NOTES",
      initials: "HQ",
      handle: "@house-queue",
      headline: "This week:",
      accent: "Shipping under pressure.",
      bio: "Operator stories, one tight episode at a time.",
      links: ["▶ Latest episode", "Guest’s toolkit", "Transcript", "Subscribe"],
    },
    sections: [
      {
        heading: "Lead with the episode",
        body:
          "Embed the Spotify episode or YouTube version so visitors can start listening immediately. Keep the title specific—episode number and hook—not just “Latest episode.”",
        bullets: [
          "Spotify episode or YouTube embed",
          "Clear episode title and guest name",
          "Subscribe link as a secondary CTA",
        ],
      },
      {
        heading: "Show notes without the clutter",
        body:
          "Use featured links for the guest’s site, tools mentioned, and transcript. Hide expired sponsorships instead of deleting history.",
        bullets: [
          "Guest link + disclosed affiliate tools",
          "Transcript or newsletter capture",
          "Archive older episodes as compact cards",
        ],
      },
    ],
    steps: [
      { title: "Pick Field Notes or After Dark", body: "Field Notes for interview shows; After Dark for high-energy formats." },
      { title: "Embed the episode", body: "Use the Spotify or YouTube music/media template and paste the episode URL." },
      { title: "Add support links", body: "Guest, tools, merch, and subscribe—then publish one bio URL everywhere." },
    ],
    faqs: [
      {
        question: "Can I embed Spotify podcasts?",
        answer:
          "Yes. Paste a Spotify episode or show URL into Music and media embeds (or as a link) and Cueful renders the Spotify player.",
      },
      {
        question: "What about YouTube versions of episodes?",
        answer:
          "Add a YouTube embed beside or below the audio player if you publish video episodes.",
      },
    ],
    related: [
      { href: "/templates/spotify-embed-link-in-bio", label: "Spotify embed template" },
      { href: "/templates/link-in-bio-for-musicians", label: "Musician template" },
      { href: "/free-link-in-bio", label: "Free link-in-bio tool" },
    ],
    primaryCta: "Use the podcast template",
    primaryHref: "/templates?template=field-notes&utm_source=seo&utm_campaign=podcaster-template",
  },
  {
    path: "/templates/referral-links-for-creators",
    metaTitle: "Referral Links Page Template for Creators | Cueful",
    metaDescription:
      "Organize referral offers into clear cards with coupon-copy actions, disclosures, expiry context, and analytics for opens and code copies.",
    eyebrow: "TEMPLATE / REFERRAL CREATORS",
    title: "Make every recommendation legible.",
    lead:
      "Referral links should explain the product, the actual benefit, and the code before asking for a click. Cueful keeps offers separate from ordinary work.",
    theme: "acid",
    proof: [
      { value: "OPEN", label: "offer interest" },
      { value: "COPY", label: "code intent" },
      { value: "CTR", label: "page performance" },
    ],
    preview: {
      category: "REFERRAL CURATOR / FIELD NOTES",
      initials: "DD",
      handle: "@dani-deals",
      headline: "I test it before",
      accent: "I share it.",
      bio: "A short, maintained list of tools and offers I actually use.",
      links: ["How I evaluate a referral", "My creator setup", "Monthly field notes"],
      referral: { provider: "DESCRIPT", offer: "Save on your first creator plan", code: "DANI20" },
    },
    sections: [
      {
        heading: "Separate trust from promotion",
        body:
          "Use the profile and ordinary links to show your work and evaluation method. Put commercial offers into dedicated referral cards so visitors can distinguish editorial context from the promotion.",
        bullets: [
          "Name the provider plainly",
          "Describe the real benefit",
          "Disclose the referral relationship",
        ],
      },
      {
        heading: "Make the code usable",
        body:
          "A visible copy action reduces memory work and creates a useful intent signal even when checkout happens later. Keep codes current and remove expired offers.",
        bullets: [
          "One-tap code copying",
          "Direct offer destination",
          "Clear expiry notes in the offer text",
        ],
      },
      {
        heading: "Measure more than traffic",
        body:
          "Compare offer opens with code copies to see where visitors show stronger intent. Use top referrers, countries, and devices to understand the context behind that activity.",
        bullets: [
          "Referral opens by offer",
          "Coupon-code copy counts",
          "Page views and outbound CTR",
        ],
      },
    ],
    steps: [
      { title: "Add your credibility", body: "Explain what you test and why people should trust the shortlist." },
      { title: "Create focused offer cards", body: "Use provider, benefit, destination, code, and honest context." },
      { title: "Review every month", body: "Archive expired offers and use the activity data to reorder the page." },
    ],
    comparison: {
      heading: "A useful referral card",
      intro: "Every offer should answer these questions without requiring a click.",
      columns: ["Field", "Example", "Purpose"],
      rows: [
        ["Provider", "Descript", "Makes the destination recognizable"],
        ["Benefit", "Save on your first creator plan", "States the visitor value"],
        ["Code", "DANI20", "Makes the discount usable"],
        ["Context", "Used for weekly video captions", "Adds first-hand relevance"],
        ["Disclosure", "I may earn a commission", "Protects audience trust"],
      ],
    },
    faqs: [
      {
        question: "Does Cueful automatically apply referral codes?",
        answer:
          "No. Cueful provides a copy action and opens the offer destination. Whether a provider applies a code automatically depends on that provider’s URL and checkout.",
      },
      {
        question: "Can I see who purchased?",
        answer:
          "Cueful tracks page activity, offer opens, and code copies—not the provider’s completed checkout. Use the referral program’s reporting for confirmed conversions.",
      },
      {
        question: "Should I disclose affiliate relationships?",
        answer:
          "Yes. Follow the laws and platform rules that apply to you, and make the relationship clear enough for a visitor to understand before acting.",
      },
    ],
    related: [
      { href: "/cueful-vs-linktree", label: "Cueful vs Linktree" },
      { href: "/free-linktree-alternative", label: "Import a Linktree" },
      { href: "/link-in-bio-tools", label: "Compare link-in-bio tools" },
    ],
    primaryCta: "Build a referral page",
    primaryHref: "/templates?template=field-notes&utm_source=seo&utm_campaign=referral-template",
  },
  {
    path: "/templates/link-in-bio-shop",
    metaTitle: "Link-in-Bio Shop Template | Cueful",
    metaDescription:
      "Sell from your bio with a mini shop: product cards, external checkout, featured drops, and clear CTAs—no payment processing on Cueful.",
    eyebrow: "TEMPLATE / SHOP",
    title: "A mini shop inside your bio link.",
    lead:
      "Put your current drop on the page as product cards. Visitors see price, badge, and a buy button that opens your existing Shopify, Gumroad, or Stripe checkout—Cueful never takes payment.",
    theme: "rose",
    proof: [
      { value: "Shop", label: "product cards" },
      { value: "Buy", label: "external checkout" },
      { value: "Track", label: "product opens" },
    ],
    preview: {
      category: "SHOP / SOFT STUDIO",
      initials: "LS",
      handle: "@lea-shop",
      headline: "Handmade goods with a",
      accent: "soft finish.",
      bio: "New kiln drops, restock alerts, and the story behind each piece.",
      links: ["Ceramic mug · $48", "One-off vase · $120", "Restock alerts", "Studio visit"],
    },
    sections: [
      {
        heading: "Lead with the drop",
        body:
          "Use Cueful’s mini shop for the products you want people to buy this week. Feature one hero item, keep prices honest, and send checkout to the store you already run.",
        bullets: [
          "Product name, price, and short description",
          "Badge for New, Sale, or Limited",
          "CTA that opens your existing checkout",
        ],
      },
      {
        heading: "Keep trust next to commerce",
        body:
          "Pair the shop with restock alerts, studio booking, or brand story links. The Shop tab holds products; Links keeps support destinations from competing with the grid.",
        bullets: [
          "Shop tab for products",
          "Links for newsletter and visits",
          "Disclosed packaging or tool referrals if you share them",
        ],
      },
      {
        heading: "Measure what sells interest",
        body:
          "Product opens show which cards earn attention before checkout. Compare them with link opens to see whether visitors browse, buy, or bounce to the mailing list.",
        bullets: [
          "Product open events per item",
          "Featured vs standard performance",
          "Device and country context for drops",
        ],
      },
    ],
    steps: [
      {
        title: "Choose Soft Studio",
        body: "Start with the image-forward template that suits product photography and handmade brands.",
      },
      {
        title: "Add shop products",
        body: "In Shop & Media, add each product with price, badge, image, and destination URL to your checkout.",
      },
      {
        title: "Publish one bio URL",
        body: "Share cueful.bio/you everywhere. Visitors open the Shop tab to browse without leaving your hub first.",
      },
    ],
    faqs: [
      {
        question: "Does Cueful process payments?",
        answer:
          "No. Cueful shows product cards and sends buyers to your Shopify, Gumroad, Stripe Payment Link, or other checkout. You keep your existing payment stack.",
      },
      {
        question: "Can I feature a limited drop?",
        answer:
          "Yes. Mark a product as featured, add a Limited or New badge, and deactivate it when the drop sells out.",
      },
      {
        question: "Is this the same as a full storefront?",
        answer:
          "It is a bio-native mini shop for the products you want to push now—not a replacement for inventory, shipping, or tax tools in your main store.",
      },
    ],
    related: [
      { href: "/cueful-vs-linktree", label: "Cueful vs Linktree" },
      { href: "/templates/link-in-bio-for-musicians", label: "Musician template" },
      { href: "/free-link-in-bio", label: "Free link-in-bio tool" },
    ],
    primaryCta: "Use the shop template",
    primaryHref: "/templates?template=soft-studio&utm_source=seo&utm_campaign=shop-template",
  },
  {
    path: "/templates/portfolio-link-page-for-freelancers",
    metaTitle: "Portfolio Link Page Template for Freelancers | Cueful",
    metaDescription:
      "A focused freelancer portfolio link page with selected work, services, process notes, contact routes, and mobile analytics.",
    eyebrow: "TEMPLATE / FREELANCERS",
    title: "A small portfolio with a clear way to hire you.",
    lead:
      "A bio link is not the complete case-study archive. It is the mobile front door: selected proof, a concise point of view, and the next step for a potential client.",
    theme: "sky",
    proof: [
      { value: "03", label: "selected projects" },
      { value: "01", label: "clear service" },
      { value: "01", label: "contact route" },
    ],
    preview: {
      category: "FREELANCER / SOFT STUDIO",
      initials: "SB",
      handle: "@sam-builds",
      headline: "I design calmer",
      accent: "products.",
      bio: "Independent product designer for complex tools and early-stage teams.",
      links: ["Selected product work", "How I run a two-week sprint", "Availability + contact"],
    },
    sections: [
      {
        heading: "Lead with the service",
        body:
          "Use the headline to say what you make, who it helps, or how the work feels. A potential client should not need to decode a clever title before understanding the offer.",
        bullets: [
          "Specific role or service",
          "Recognizable audience or problem",
          "Short supporting point of view",
        ],
      },
      {
        heading: "Curate proof for a phone",
        body:
          "Feature a few projects with descriptive titles and supporting lines. Link to deeper case studies elsewhere instead of compressing the entire portfolio into identical buttons.",
        bullets: [
          "Two or three representative projects",
          "One process or expertise artifact",
          "Optional thumbnails for recognition",
        ],
      },
      {
        heading: "Make contact unambiguous",
        body:
          "End the decision path with availability, email, booking, or an inquiry page. Name the action and set expectations about the kind of work you accept.",
        bullets: [
          "Visible availability context",
          "Direct contact destination",
          "No mystery labels such as “Let’s connect”",
        ],
      },
    ],
    steps: [
      { title: "Choose Soft Studio", body: "Start with the calm, image-forward portfolio direction." },
      { title: "Select three proof points", body: "Use work that represents the projects you want next." },
      { title: "Add the hiring route", body: "Make availability and contact visible without scrolling through an archive." },
    ],
    faqs: [
      {
        question: "Can a link-in-bio page replace a full portfolio?",
        answer:
          "For some freelancers, yes. For detailed case studies, use it as a focused front door that links to the deeper portfolio or individual project pages.",
      },
      {
        question: "How many projects should I feature?",
        answer:
          "Start with two or three that represent the work you want to be hired for. Quality and relevance matter more than showing every project.",
      },
      {
        question: "Can I track potential client interest?",
        answer:
          "Cueful tracks page views, project-link opens, CTR, referrers, devices, and countries. It does not identify individual visitors.",
      },
    ],
    related: [
      { href: "/link-in-bio-for-instagram", label: "Instagram link guide" },
      { href: "/free-link-in-bio", label: "Free creator page" },
      {
        href: "/templates/referral-links-for-creators",
        label: "Referral creator template",
      },
    ],
    primaryCta: "Use the portfolio template",
    primaryHref: "/templates?template=soft-studio&utm_source=seo&utm_campaign=freelancer-template",
  },
  {
    path: "/cueful-vs-linktree",
    metaTitle: "Cueful vs Linktree: Referral, Music & Shop Templates | Cueful",
    metaDescription:
      "Compare Cueful and Linktree on referral cards, Spotify music embeds, and shop product cards—what’s free, what takes a fee, and which template fits.",
    eyebrow: "CUEFUL VS LINKTREE / TEMPLATES",
    title: "Three bio jobs. Two different approaches.",
    lead:
      "Linktree popularized the link list. Cueful ships opinionated templates for the three jobs creators actually run from a bio: referral cards, music embeds, and shop cards—without visitor ads or a forced badge.",
    theme: "acid",
    proof: [
      { value: "Cards", label: "referral offers" },
      { value: "Play", label: "music embeds" },
      { value: "Shop", label: "product cards" },
    ],
    preview: {
      category: "COMPARE / TEMPLATES",
      initials: "VS",
      handle: "@cueful-vs-linktree",
      headline: "Same bio job,",
      accent: "clearer blocks.",
      bio: "Referral codes, Spotify players, and product cards—side by side with Linktree.",
      links: ["Referral cards", "Music embeds", "Shop cards", "Import Linktree"],
      referral: { provider: "CUEFUL", offer: "Free forever templates", code: "START" },
    },
    sections: [
      {
        heading: "Referral cards vs a plain affiliate link",
        body:
          "Linktree can list an affiliate URL like any other button. Cueful’s referral template treats the offer as its own block: provider, benefit, one-tap code copy, and separate open vs copy analytics. That matches how discount audiences actually decide.",
        bullets: [
          "Cueful: dedicated referral cards with copy actions",
          "Linktree: affiliate destinations as standard links or shop/affiliate tools on eligible plans",
          "Cueful tracks referral opens and code copies for free",
        ],
      },
      {
        heading: "Music embeds vs Music Links",
        body:
          "Linktree’s Music Links can surface streaming services and Spotify-style previews. Cueful’s musician and Spotify templates paste an official Spotify, Apple Music, SoundCloud, or YouTube URL and render an inline player on the page—lazy-loaded, no autoplay—then stack tour and merch underneath.",
        bullets: [
          "Cueful: official embed players on free profiles",
          "Linktree: Music Links and audio previews in its music toolkit",
          "Cueful pairs Listen & watch with tour, merch, and mailing-list CTAs",
        ],
      },
      {
        heading: "Shop cards vs Linktree Shops",
        body:
          "Linktree Shops can sell digital products inside Linktree and may charge a seller fee on free and mid-tier plans (commonly cited at 12% free / 9% Starter–Pro / 0% Premium—confirm on Linktree’s pricing). Cueful’s shop template shows product cards with price and image, then sends buyers to your existing Shopify, Gumroad, or Stripe checkout. Cueful never processes payment and never takes a sale cut.",
        bullets: [
          "Cueful: mini shop cards → your checkout (keep 100%)",
          "Linktree: built-in shops with plan-based seller fees on platform sales",
          "Cueful Soft Studio template is built for product photography and drops",
        ],
      },
    ],
    steps: [
      {
        title: "Pick the job",
        body: "Referral curator, musician release, or product drop—open the matching Cueful template.",
      },
      {
        title: "Import if you already use Linktree",
        body: "Paste your public Linktree URL, then upgrade blank buttons into referral, music, or shop blocks.",
      },
      {
        title: "Publish cueful.bio/you",
        body: "Swap the Instagram or TikTok bio link. No card required to keep the page live.",
      },
    ],
    comparison: {
      heading: "Cueful templates vs Linktree",
      intro:
        "Feature notes reflect Cueful’s free product and publicly described Linktree capabilities as of July 2026. Always confirm Linktree plan limits on linktr.ee/s/pricing.",
      columns: ["Job", "Cueful", "Linktree"],
      rows: [
        ["Referral / coupon codes", "Dedicated cards + code copy analytics", "Usually a link; affiliate tools vary by plan/eligibility"],
        ["Music on the page", "Spotify/Apple/SoundCloud/YouTube embeds free", "Music Links / Spotify previews in music toolkit"],
        ["Selling products", "Cards → external checkout, 0% Cueful fee", "Shops with seller fees on many plans"],
        ["Forced branding / ads", "No forced badge, no visitor ads", "Branding and limits tighten on free tier"],
        ["Analytics depth", "Lifetime views, opens, code copies", "History and depth expand on paid plans"],
        ["Moving over", "Public Linktree import", "Export/rebuild depends on your workflow"],
        ["Price to publish", "$0 forever for core templates", "Free tier available; advanced features paid"],
      ],
    },
    faqs: [
      {
        question: "Is Cueful just a free Linktree clone?",
        answer:
          "No. Cueful is narrower on purpose: referral cards, music embeds, shop cards, clean analytics, and an importer for people leaving Linktree—without selling a full creator-business suite.",
      },
      {
        question: "Can I keep my Linktree until I switch?",
        answer:
          "Yes. Import into Cueful, review the page, then change the bio URL when ready. Your old Linktree is unchanged until you edit it.",
      },
      {
        question: "Does Cueful take a cut of shop sales?",
        answer:
          "No. Product cards open your existing checkout. Payment processors may still charge their normal fees; Cueful does not add a seller fee.",
      },
      {
        question: "Where do I see the Cueful templates?",
        answer:
          "Start from the homepage Features strip, or open /templates/referral-links-for-creators, /templates/spotify-embed-link-in-bio, and /templates/link-in-bio-shop.",
      },
    ],
    related: [
      { href: "/templates/referral-links-for-creators", label: "Referral template" },
      { href: "/templates/spotify-embed-link-in-bio", label: "Spotify embed template" },
      { href: "/templates/link-in-bio-shop", label: "Shop template" },
      { href: "/free-linktree-alternative", label: "Import from Linktree" },
    ],
    primaryCta: "Compare live templates",
    primaryHref: "/#features",
    secondaryCta: "Import your Linktree",
    secondaryHref: importLinktree,
    sourceLinks: [
      { label: "Linktree pricing", href: "https://linktr.ee/s/pricing" },
      { label: "Cueful free Linktree alternative", href: "/free-linktree-alternative" },
    ],
  },
  {
    path: "/cueful-vs-beacons",
    metaTitle: "Cueful vs Beacons: Which Creator Link Page Fits?",
    metaDescription:
      "Compare Cueful and Beacons for link-in-bio pages, referral offers, storefronts, email, analytics, branding, and setup complexity.",
    eyebrow: "CUEFUL VS BEACONS / JULY 2026",
    title: "A focused link page or a creator business suite?",
    lead:
      "Cueful and Beacons overlap at the bio link, then move in different directions. Cueful emphasizes focused links, referrals, and clean analytics; Beacons bundles store, email, media-kit, and creator-business tools.",
    theme: "acid",
    proof: [
      { value: "CUEFUL", label: "focused page" },
      { value: "BEACONS", label: "business suite" },
      { value: "YOU", label: "choose the job" },
    ],
    preview: {
      category: "DECISION / USE CASE",
      initials: "VS",
      handle: "Focus or suite",
      headline: "Pay for the",
      accent: "job you need.",
      bio: "A referral-first page and analytics—or an integrated store, email, and media kit.",
      links: ["Compare public page", "Compare monetization", "Compare ongoing cost"],
    },
    sections: [
      {
        heading: "Cueful’s clearest fit",
        body:
          "Choose Cueful when the public page itself is the product you need: links, social profiles, referral offers, code-copy actions, QR exports, and lifetime audience analytics without a forced badge.",
        bullets: [
          "Referral-first content model",
          "No forced public branding",
          "Public Linktree import",
        ],
      },
      {
        heading: "Beacons’ clearest fit",
        body:
          "Choose Beacons when you want an integrated creator-business suite. Its official pricing describes a link-in-bio builder, media kit, digital-product store, affiliate marketplace, email marketing, and Instagram auto-DM tools.",
        bullets: [
          "Built-in digital-product selling",
          "Media kit and brand-deal workflows",
          "Email and creator-business tools",
        ],
      },
      {
        heading: "The practical decision",
        body:
          "If you already have commerce and email tools, a lighter profile may be easier to maintain. If you want one vendor to replace several systems, Beacons’ broader surface can be the advantage.",
        bullets: [
          "Inventory your current creator stack",
          "Compare transaction and subscription costs",
          "Test the actual mobile visitor experience",
        ],
      },
    ],
    steps: [
      { title: "List the must-have actions", body: "Links, referrals, sales, email, media kit, or auto-DM." },
      { title: "Build the public page", body: "Compare speed, hierarchy, branding, and editing effort." },
      { title: "Price your real workflow", body: "Include published transaction fees and paid-plan requirements." },
    ],
    comparison: {
      heading: "Use-case comparison",
      intro: "This table reflects the products’ published capabilities in July 2026.",
      columns: ["Need", "Cueful", "Beacons"],
      rows: [
        ["Focused link-in-bio", "Core product", "Included in broader suite"],
        ["Referral code-copy tracking", "Built in", "Affiliate/store tooling differs"],
        ["Digital-product storefront", "Not currently built in", "Built in"],
        ["Media kit and email", "Not currently built in", "Built in"],
        ["Free public branding", "No forced badge", "Logo removal listed on higher plan"],
        ["Switching from Linktree", "Public URL import", "Build or import options may vary"],
      ],
    },
    faqs: [
      {
        question: "Is Cueful better than Beacons?",
        answer:
          "Cueful is the better fit for a focused, referral-aware profile without forced branding. Beacons is stronger when you want integrated store, email, media-kit, and creator-business tools.",
      },
      {
        question: "Does Beacons have a free plan?",
        answer:
          "Yes. Beacons’ official pricing lists a free plan. Store fees, logo removal, domains, and other capabilities vary by plan, so review the current details before choosing.",
      },
      {
        question: "Can I try Cueful without a credit card?",
        answer:
          "Yes. Cueful account creation and public profile publishing do not require a credit card.",
      },
    ],
    related: [
      { href: "/best-link-in-bio-tools", label: "Best tools by use case" },
      { href: "/cueful-vs-carrd", label: "Cueful vs Carrd" },
      { href: "/free-linktree-alternative", label: "Import from Linktree" },
    ],
    primaryCta: "Try the focused option",
    primaryHref: `${startFresh}&utm_campaign=cueful-vs-beacons`,
    sourceLinks: [
      { label: "Beacons official pricing", href: "https://shop.beacons.ai/i/pricing" },
    ],
  },
  {
    path: "/cueful-vs-carrd",
    metaTitle: "Cueful vs Carrd: Link-in-Bio Tool or One-Page Site?",
    metaDescription:
      "Compare Cueful and Carrd for fast link pages, custom one-page sites, analytics, referrals, design freedom, domains, and setup effort.",
    eyebrow: "CUEFUL VS CARRD / JULY 2026",
    title: "An opinionated creator profile or a blanker canvas?",
    lead:
      "Cueful is a link-in-bio workflow with referrals and analytics already modeled. Carrd is a flexible one-page site builder that rewards more hands-on composition.",
    theme: "rose",
    proof: [
      { value: "CUEFUL", label: "guided workflow" },
      { value: "CARRD", label: "design freedom" },
      { value: "MOBILE", label: "test both" },
    ],
    preview: {
      category: "DECISION / WORKFLOW",
      initials: "VS",
      handle: "Guided or custom",
      headline: "Choose the",
      accent: "editing model.",
      bio: "Start from a creator content system—or compose a one-page site element by element.",
      links: ["Compare setup", "Compare design", "Compare analytics"],
    },
    sections: [
      {
        heading: "Cueful starts with creator content",
        body:
          "Profiles, social links, featured items, referral cards, code copies, and audience signals have dedicated controls. The templates constrain the page enough to keep it legible.",
        bullets: [
          "Faster link-in-bio setup",
          "Referral-specific interactions",
          "Built-in profile activity dashboard",
        ],
      },
      {
        heading: "Carrd starts with composition",
        body:
          "Carrd is useful when you want a custom one-page layout, landing page, or compact site. Its official plans add higher-quality media, premium templates, unbranded URLs, forms, widgets, and custom-domain features at different tiers.",
        bullets: [
          "Greater layout freedom",
          "Useful beyond link-in-bio pages",
          "More manual decisions and integrations",
        ],
      },
      {
        heading: "The practical decision",
        body:
          "Choose Cueful if you want the common creator workflow already assembled. Choose Carrd if layout control is central and you are comfortable building the interaction and analytics stack.",
        bullets: [
          "Count the integrations you would add",
          "Compare editing time after launch",
          "Test the result inside social browsers",
        ],
      },
    ],
    steps: [
      { title: "Sketch the actual page", body: "Identify profile, links, proof, offer, and contact needs." },
      { title: "Build one mobile version", body: "Use the same content to compare speed and hierarchy." },
      { title: "Review maintenance", body: "Decide who will update layout, analytics, and integrations." },
    ],
    comparison: {
      heading: "Workflow comparison",
      intro: "Neither approach is universally better; the editing model is the real difference.",
      columns: ["Need", "Cueful", "Carrd"],
      rows: [
        ["Fast creator profile", "Purpose-built", "Built manually from a template"],
        ["Referral cards and code copies", "Built in", "Custom elements/integrations needed"],
        ["Audience analytics", "Built in", "External analytics setup"],
        ["Layout freedom", "Three guided systems today", "Highly flexible"],
        ["No platform badge", "Default on public profiles", "Available through published Pro plans"],
        ["Broader one-page websites", "Creator profile focus", "Core strength"],
      ],
    },
    faqs: [
      {
        question: "Is Carrd a link-in-bio tool?",
        answer:
          "Carrd is a general one-page site builder that can be used for a link-in-bio page. Cueful is designed specifically around creator profiles, links, referrals, and their analytics.",
      },
      {
        question: "Which is easier to set up?",
        answer:
          "Cueful is typically faster for the standard creator-profile workflow. Carrd gives more control, which also means more layout and integration decisions.",
      },
      {
        question: "Can Cueful replace a portfolio site?",
        answer:
          "It can serve as a compact public portfolio or the front door to deeper case studies. Carrd may fit better when you need a more custom single-page presentation.",
      },
    ],
    related: [
      {
        href: "/templates/portfolio-link-page-for-freelancers",
        label: "Freelancer portfolio template",
      },
      { href: "/cueful-vs-beacons", label: "Cueful vs Beacons" },
      { href: "/link-in-bio-tools", label: "Comparison framework" },
    ],
    primaryCta: "Try the guided workflow",
    primaryHref: `${startFresh}&utm_campaign=cueful-vs-carrd`,
    sourceLinks: [
      { label: "Carrd official plan documentation", href: "https://carrd.co/docs/pro/plans" },
    ],
  },
  {
    path: "/it/cosa-significa-link-in-bio",
    locale: "it",
    metaTitle: "Cosa significa “link in bio”? Guida semplice",
    metaDescription:
      "“Link in bio” indica il collegamento cliccabile nel profilo social. Scopri dove trovarlo, perché viene usato e come crearne uno.",
    eyebrow: "GUIDA IN ITALIANO",
    title: "“Link in bio” significa: apri il profilo e tocca il sito indicato.",
    lead:
      "Il link nel profilo porta alla risorsa citata nel post oppure a una piccola pagina con contenuti, prodotti, contatti e altri collegamenti utili.",
    theme: "sky",
    proof: [
      { value: "BIO", label: "la descrizione del profilo" },
      { value: "LINK", label: "l’indirizzo cliccabile" },
      { value: "PAGINA", label: "la destinazione" },
    ],
    preview: {
      category: "TERMINE / SPIEGATO",
      initials: "?",
      handle: "Apri il profilo",
      headline: "Tocca il sito.",
      accent: "Tutto qui.",
      bio: "La pagina raccoglie la risorsa promessa e pochi collegamenti aggiornati.",
      links: ["La risorsa citata", "Il lavoro più recente", "Contatti"],
    },
    sections: [
      {
        heading: "Dove si trova la bio?",
        body:
          "La bio è la breve descrizione visibile nella parte alta di un profilo social. Il sito o il pulsante dei link si trova normalmente vicino a quella descrizione.",
        bullets: ["Apri il profilo principale", "Cerca l’indirizzo vicino alla bio", "Tocca il collegamento"],
      },
      {
        heading: "Perché i creator lo usano?",
        body:
          "Un unico indirizzo rimane stabile mentre le destinazioni cambiano. Il creator può mettere in evidenza un nuovo video, un prodotto, un articolo o un modulo senza modificare i vecchi post.",
        bullets: ["Un indirizzo facile da ricordare", "Contenuti aggiornabili", "Utilizzabile su più piattaforme"],
      },
      {
        heading: "Come riconoscere una buona pagina",
        body:
          "La risorsa promessa deve essere facile da trovare. Titoli chiari, pochi passaggi e nessuna pubblicità inattesa rendono l’esperienza più affidabile.",
        bullets: ["Titoli specifici", "Pulsanti leggibili", "Dominio e destinazione riconoscibili"],
      },
    ],
    steps: [
      { title: "Apri il profilo", body: "Tocca il nome o l’immagine dell’account." },
      { title: "Trova il sito", body: "Cerca il collegamento cliccabile vicino alla descrizione." },
      { title: "Scegli la risorsa", body: "Apri la voce che corrisponde al post di partenza." },
    ],
    faqs: [
      {
        question: "“Link in bio” significa Linktree?",
        answer:
          "No. È un’espressione generale. Linktree, Cueful e altri strumenti possono creare la pagina collegata dalla bio.",
      },
      {
        question: "È sicuro aprire un link in bio?",
        answer:
          "Controlla il dominio e verifica che la pagina corrisponda a ciò che il creator ha promesso. Evita richieste inattese di accesso o pagamento.",
      },
      {
        question: "Posso creare gratis il mio link in bio?",
        answer:
          "Sì. Con Cueful puoi creare e pubblicare gratuitamente una pagina oppure importare un Linktree pubblico.",
      },
    ],
    related: [
      { href: "/what-does-link-in-bio-mean", label: "English guide" },
      { href: "/es/que-significa-link-en-bio", label: "Guía en español" },
      { href: "/free-link-in-bio", label: "Crea una pagina gratuita" },
    ],
    primaryCta: "Crea il tuo link in bio",
    primaryHref: `${startFresh}&utm_campaign=italian-link-in-bio-meaning`,
  },
  {
    path: "/es/que-significa-link-en-bio",
    locale: "es",
    metaTitle: "¿Qué significa “link en bio”? Guía sencilla",
    metaDescription:
      "“Link en bio” es el enlace disponible en un perfil social. Aprende dónde encontrarlo, para qué sirve y cómo crear el tuyo.",
    eyebrow: "GUÍA EN ESPAÑOL",
    title: "“Link en bio” significa: abre el perfil y toca el sitio enlazado.",
    lead:
      "Ese enlace lleva al recurso mencionado en una publicación o a una página breve con contenido, productos, contacto y destinos importantes.",
    theme: "rose",
    proof: [
      { value: "BIO", label: "la descripción del perfil" },
      { value: "LINK", label: "la dirección disponible" },
      { value: "PÁGINA", label: "el destino que se abre" },
    ],
    preview: {
      category: "TÉRMINO / EXPLICADO",
      initials: "?",
      handle: "Abre el perfil",
      headline: "Toca el sitio.",
      accent: "Eso es todo.",
      bio: "La página reúne el recurso prometido y unos pocos enlaces actualizados.",
      links: ["El recurso mencionado", "El trabajo más reciente", "Contacto"],
    },
    sections: [
      {
        heading: "¿Dónde está la bio?",
        body:
          "La bio es la descripción corta situada en la parte superior de un perfil social. La dirección web o el botón de enlaces suele aparecer cerca de esa descripción.",
        bullets: ["Abre el perfil principal", "Busca el sitio cerca de la bio", "Toca el enlace"],
      },
      {
        heading: "¿Por qué se utiliza?",
        body:
          "Una dirección estable permite cambiar los destinos sin editar publicaciones antiguas. El creador puede destacar un video, producto, artículo, formulario o campaña nueva.",
        bullets: ["Una dirección fácil de compartir", "Destinos que se pueden actualizar", "Funciona en varias plataformas"],
      },
      {
        heading: "Cómo reconocer una página útil",
        body:
          "El recurso prometido debe ser fácil de identificar. Los títulos específicos, los controles legibles y la ausencia de anuncios inesperados reducen la fricción.",
        bullets: ["Nombres claros", "Botones grandes", "Destino y dominio reconocibles"],
      },
    ],
    steps: [
      { title: "Abre el perfil", body: "Toca el nombre o la imagen de la cuenta." },
      { title: "Encuentra el sitio", body: "Busca la dirección disponible junto a la descripción." },
      { title: "Elige el recurso", body: "Abre el elemento que corresponde a la publicación original." },
    ],
    faqs: [
      {
        question: "¿“Link en bio” significa Linktree?",
        answer:
          "No. Es una expresión general. Linktree, Cueful y otras herramientas pueden crear la página enlazada desde la bio.",
      },
      {
        question: "¿Es seguro abrir un link en bio?",
        answer:
          "Comprueba el dominio y confirma que el destino coincide con lo prometido por el creador. Desconfía de solicitudes inesperadas de acceso o pago.",
      },
      {
        question: "¿Puedo crear mi link en bio gratis?",
        answer:
          "Sí. Cueful permite crear y publicar una página gratis o importar un Linktree público.",
      },
    ],
    related: [
      { href: "/what-does-link-in-bio-mean", label: "Guide in English" },
      { href: "/it/cosa-significa-link-in-bio", label: "Guida in italiano" },
      { href: "/free-link-in-bio", label: "Crear una página gratuita" },
    ],
    primaryCta: "Crea tu link en bio",
    primaryHref: `${startFresh}&utm_campaign=spanish-link-in-bio-meaning`,
  },
];

export const seoPageByPath = new Map(seoPages.map((page) => [page.path, page]));
