import type { BlogSource } from "@/lib/blog/posts";

export const post: BlogSource = {
  slug: "qr-code-one-tap-iphone",
  title: "Put your QR code one tap away on an iPhone or Android",
  subtitle:
    "Back Tap, a Shortcut, a home screen icon and a Wallet pass: four ways to reach your code without hunting for it.",
  description:
    "How to open your link-in-bio QR code instantly on a phone using iPhone Back Tap, the Shortcuts app, a home screen icon, or Apple Wallet, so you can show it to someone in a second.",
  published: "2026-09-06",
  hero: {
    src: "/blog/how-to-add-link-in-instagram-bio/share-qr.webp",
    alt: "A QR code on a phone screen with the page address underneath",
    caption: "The code is only useful if you can get to it before the moment passes.",
  },
  tags: ["QR code", "iPhone", "Getting started"],
  cta: {
    href: "/digital-business-card",
    label: "Set up your card",
    blurb:
      "A free page, a code that fills the screen, and a count of how many people actually scanned it.",
  },
  body: `
Someone asks for your details. You have about five seconds before they reach for a pen or give up. Anything that involves unlocking, finding an app, and tapping through it has already lost.

This is how to get your code onto the screen in one gesture, on either kind of phone. None of it costs anything and none of it needs an app you do not already have.

## The screen your code lives on

On Cueful, [cueful.bio/card](/card) is a full-screen version of your code. Two things make it different from a code in a dialog:

- It **holds the screen awake**, so the phone does not dim to black halfway through someone's scan.
- It is **fixed black on white**, whatever colours your page uses. A code tinted to match a brand is the usual reason a scan fails.

Everything below is a way of reaching that screen faster.

:::note
Whichever route you use, Cueful counts the scan. A QR scan normally arrives with no referrer, which is why most link tools cannot tell you it happened at all. Your dashboard shows scans as their own number.
:::

## iPhone: double-tap the back of the phone

This is the fastest one, and almost nobody knows it exists. Two taps on the back of the phone, and the code is up.

First, make a Shortcut:

1. Open the **Shortcuts** app and tap **+**.
2. Search for **Open URLs** and add it.
3. Paste \`https://cueful.bio/card\`.
4. Name it "My code" and save.

Then bind it to the back of the phone:

1. **Settings › Accessibility › Touch**.
2. Scroll to the bottom: **Back Tap**.
3. Choose **Double Tap**, and pick your "My code" shortcut.

Now double-tap the back of your phone. It works from the lock screen on most models, and through a case.

## iPhone: the Action button, or the Control Centre

If your phone has the Action button (iPhone 15 Pro and later), **Settings › Action Button**, swipe to **Shortcut**, and choose the same one. A long press then opens your code.

On iOS 18 and later you can also add a Shortcut to Control Centre, or replace one of the two lock screen buttons with it. **Customise** the lock screen, tap the button you want to change, and pick your shortcut.

## Android: a home screen icon

Android does not need the Shortcuts app for this.

1. Open \`cueful.bio/card\` in Chrome.
2. Tap the three dots, then **Add to Home screen**.
3. Name it "My code".

You now have what looks like an app icon that opens straight to your code. If you installed Cueful as an app, the same icon is already there: the installed app opens on the card screen by design, and long-pressing it gives you **Show my card** and **People you met**.

## Both: Apple Wallet

On an iPhone, add your card to Apple Wallet from the card screen. This is worth doing even if you set up Back Tap, for one reason: **Wallet forces the screen to maximum brightness** for a barcode pass. A web page cannot do that. In bright sunlight, at a market or outside a venue, it is the difference between a scan and a shrug.

It also syncs to Apple Watch, which means you can hold out your wrist.

## Which one to use

- **Give someone your details across a table.** Back Tap or the Action button.
- **Outdoors, or in bright light.** Wallet.
- **On a counter all day.** Neither. Print a table tent and leave it there.
- **Android.** Home screen icon.

## The part people get wrong

Two things break scans more than anything else, and both are about the code itself rather than how you reach it:

- **Low contrast.** A code in your brand colours on a coloured background often will not scan. Keep it dark on light.
- **No quiet border.** The white margin around a code is part of the code. Cropping it tight looks neater and scans worse.

Cueful's card screen and printed assets both keep those right by default, which is why the code there is black and white even when your page is not.

---

Set one of these up now, before you need it. The whole point is that the moment someone asks, you are not the person saying "hold on, let me find it".
`,
};
