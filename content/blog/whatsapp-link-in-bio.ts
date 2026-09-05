import type { BlogSource } from "@/lib/blog/posts";

export const post: BlogSource = {
  slug: "whatsapp-link-in-bio",
  title: "How to put a WhatsApp link in your bio (with the message already typed)",
  subtitle:
    "The wa.me format, the three number mistakes that open an empty chat, and how to turn a product card into an order.",
  description:
    "How to build a WhatsApp click-to-chat link with a prefilled message, format the number so it actually opens your chat, and use it in an Instagram bio or a shop page.",
  published: "2026-09-05",
  hero: {
    src: "/blog/whatsapp-link-in-bio/order-button.webp",
    alt: "Product cards on a Cueful page, each with an Order on WhatsApp button",
    caption: "Each card opens a chat with the item already named.",
  },
  tags: ["WhatsApp", "Small business", "Link in bio"],
  cta: {
    href: "/templates/link-in-bio-shop",
    label: "Build a shop page with WhatsApp orders",
    blurb:
      "Cards with prices, a button that opens the chat with the item named, and a count of who tapped.",
  },
  body: `
For a lot of small businesses the "buy button" is a WhatsApp message. No checkout, no cart. Someone asks if you have the thing, you say yes and name a price, they come in or you deliver.

A link can do the first half of that for you. Tapped, it opens WhatsApp with your number already selected and a message already typed. The visitor only has to press send. This is the format, the traps, and a way to build the link without thinking about any of it.

## The link format

WhatsApp calls this "click to chat". The link looks like this:

\`\`\`
https://wa.me/919876543210?text=Hi%21%20I%27d%20like%20to%20order%3A%20Best%20seller
\`\`\`

Two parts:

- **The number**, right after wa.me/, in international format with digits only. Country code first, then the number. No plus sign, no spaces, no dashes, no brackets, and no leading zeros.
- **The message**, after ?text=, URL-encoded. A space becomes %20, an apostrophe %27, a colon %3A, a new line %0A. Everything else stays as it is.

Some numbers, before and after:

- +91 98765 43210 in India becomes 919876543210
- 0044 7700 900123 in the UK becomes 447700900123
- (555) 123-4567 in the US becomes 15551234567

Leave the message off and the link still works: it opens an empty chat with you.

## The three mistakes that break it

Each of these produces a link that looks fine and opens a chat with nobody, or an error saying the number is invalid.

1. **A leading zero.** The zero you dial before a local number is a trunk prefix, not part of the number. Drop it. 09876543210 is wrong; 919876543210 is right.
2. **No country code.** WhatsApp needs it even if all your customers are in the same city.
3. **Spaces or a plus inside the number.** They are fine on a business card and fatal in a link.

Test the link on a phone that is not yours before you put it anywhere.

## What to put in the message

The message is not a greeting. It is the thing that tells you what the person wants before you have said hello.

- **Name the item.** "Hi! I'd like to order: Chocolate cake" tells you which card they tapped. "Hi" tells you nothing.
- **One line.** They can add the rest.
- **Leave the price out.** Prices change; a link with an old price in it starts an argument.
- **Do not ask for personal details in it.** Ask in the chat, once they have said what they want.

If you sell more than one thing, give each thing its own link with its own message. That is what turns a message into an order rather than a conversation.

## Where the link goes

- Your Instagram bio. Only the first link shows on your profile, which is why most businesses put a page there and the WhatsApp buttons on the page. ([How to add the link to Instagram.](/blog/how-to-add-link-in-instagram-bio))
- The website field on your Google Business Profile and your Facebook page.
- A QR code by the till or on the shop board.

Not in a caption. Links in captions are never tappable on Instagram.

The WhatsApp Business app can also make you a short link with a default message, under Business tools. That is the same idea with one message for everything. The wa.me form is worth knowing because you can make as many as you like, one per product, and change the message whenever you want.

## Doing it on Cueful without encoding anything

On a Cueful page, every product card has a button. Next to the card's link field there is a **Take orders on WhatsApp** helper. It asks for your number, suggests a message with the item's name in it, and writes the link for you. The button on the card becomes "Order on WhatsApp".

![The Take orders on WhatsApp dialog, with a number field and a prefilled message](/blog/whatsapp-link-in-bio/whatsapp-dialog.webp "Number, message, done. The encoding is handled for you.")

Your number is remembered, so the second and third items take a few seconds each. Editing an existing link later opens the same dialog with the number and message filled in.

![Product cards on a Cueful page, each with an Order on WhatsApp button](/blog/whatsapp-link-in-bio/order-button.webp "Three cards, three messages, one number.")

Cueful counts every tap on those buttons. WhatsApp itself will never tell you where a chat came from, which is why the item name in the message matters: it is the only tracking the chat has.

## A worked example

A small bakery has three cards: a birthday cake, a box of six, and custom orders. Each has its own message.

Someone finds the page from an Instagram post at nine in the evening, taps **Order on WhatsApp** under the box of six, and the chat opens with "Hi! I'd like to order: Box of six" already typed. They press send. The baker answers in the morning with the price and a pickup time.

No form, no account, no checkout. Just the conversation the bakery was going to have anyway, started by the customer at the exact moment they wanted something.

## Test it before you post it

Open the link on a phone with WhatsApp installed and check three things: it opens WhatsApp, the chat is with your number, and the message is the one you wrote. Then try it in a desktop browser, where it should offer WhatsApp Web. If the first phone you try shows an empty chat or an invalid number, go back to the three mistakes above. It will be one of them.
`,
};
