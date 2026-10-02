/**
 * FAQ content. `homeFaq` also feeds the FAQPage JSON-LD on the home page;
 * `faqGroups` is the full /faq/ page. Answers are plain text (no HTML) so they
 * can be reused verbatim in structured data.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export const homeFaq: FaqItem[] = [
  {
    question: 'What does Uppush do?',
    answer:
      'Uppush is an AI marketing app for Shopify that grows your sales across email and web push. Automated flows recover abandoned browses, carts and checkouts and bring customers back; AI helps you write, design and translate campaigns; popups grow your subscriber list — all from one app.',
  },
  {
    question: 'Is Uppush really free?',
    answer:
      'Yes. The Free plan has unlimited subscribers, 100 emails and 500 web push a month, popups and four automations (welcome, abandoned cart, back in stock, price drop). Upgrade to Pro for $12.99 a month when you need email campaigns and the advanced automations.',
  },
  {
    question: 'How is it cheaper than Klaviyo or Omnisend?',
    answer:
      'Most email tools charge by the size of your contact list. Uppush charges for the messages you actually send, from $1.50 per 1,000 emails and $0.30 per 1,000 web push, with unlimited contacts. For a typical store sending a few campaigns a month that is a fraction of a list-based plan.',
  },
  {
    question: 'Do I need to code anything?',
    answer:
      'No. Install from the Shopify App Store and enable the Uppush app embed in your theme editor. Popups, web push and cart tracking start working without touching your theme code.',
  },
  {
    question: 'Will it slow down my store?',
    answer:
      'No. The storefront script loads after your page has finished loading and follows Shopify’s theme app extension guidelines, so it does not block rendering.',
  },
];

export const faqGroups: { title: string; items: FaqItem[] }[] = [
  {
    title: 'Getting started',
    items: [
      homeFaq[0],
      homeFaq[3],
      {
        question: 'Can I send both web push and email?',
        answer:
          'Yes. Every automation can send web push, email or both, and you can run campaigns on either channel. Web push reaches shoppers instantly without an email address; email carries the full product story and discount.',
      },
      {
        question: 'I changed my theme. Does Uppush still work?',
        answer:
          'Yes — enable the Uppush app embed in your new theme. All your settings, subscribers and automations stay exactly as they were.',
      },
      homeFaq[4],
    ],
  },
  {
    title: 'Automations',
    items: [
      {
        question: 'What automations are included?',
        answer:
          'Nine: welcome series, abandoned cart, abandoned checkout, browse abandonment, back in stock, price drop, product release, shipping updates and customer winback. Welcome, abandoned cart, back in stock and price drop are on the Free plan.',
      },
      {
        question: 'What is the difference between abandoned cart and abandoned checkout?',
        answer:
          'Abandoned cart starts when a subscriber adds products to the cart but never begins checkout; it needs them to have subscribed through an Uppush popup. Abandoned checkout starts when Shopify records a checkout that has been idle for 10 minutes. The email flow uses Shopify’s checkout data, so it works even for shoppers who never subscribed to your popup; the web push flow still needs a push subscriber.',
      },
      {
        question: 'Can I add a discount to an automation?',
        answer:
          'Yes. Set a discount per automation or per email: a fixed code, a unique single-use code per subscriber, or a Shopify discount. Discount links in emails apply the code for the shopper automatically when the theme extension is enabled.',
      },
    ],
  },
  {
    title: 'Email deliverability',
    items: [
      {
        question: 'Why should I verify my domain?',
        answer:
          'Emails sent from your own verified domain are more trusted by Gmail, Outlook and Yahoo, so more of them land in the inbox. Until you verify, Uppush sends from a shared domain. Verification is a few DNS records and is available on every plan.',
      },
      {
        question: 'What is domain warm-up?',
        answer:
          'A new sending domain has no reputation yet. Warm-up starts with small daily volumes and increases them over several weeks, so mailbox providers learn to trust you. Uppush can run the warm-up for you and you can pause or resume it any time.',
      },
      {
        question: 'Can Uppush send SMS?',
        answer:
          'Not yet. Uppush sends email and web push today. Popups can already collect phone numbers, so your list is ready when SMS arrives.',
      },
    ],
  },
  {
    title: 'Subscribers & data',
    items: [
      {
        question: 'Can I bring my subscribers from another app?',
        answer:
          'Uppush syncs your Shopify store automatically — customers, products and orders, including historical data — so contacts collected by another app that live in Shopify are already there. Web push subscriptions can’t be moved between apps, but they re-sync: turn off your previous push tool, enable the Uppush app embed, and subscribers are picked up again as they come back to your store.',
      },
      {
        question: 'Is there a limit on subscribers?',
        answer: 'No. Every plan includes unlimited subscribers; you only pay for the messages you send.',
      },
    ],
  },
];
