/**
 * 5-star merchant reviews, quoted verbatim from the Shopify App Store listing
 * (https://apps.shopify.com/pushup-notification-marketing/reviews?ratings[]=5).
 * Only real, published reviews. Excerpts are marked with "…"; spelling and wording
 * are left exactly as the merchant wrote them. `using` is the listing's
 * "time using the app" line.
 */
export interface Testimonial {
  quote: string;
  store: string;
  country: string;
  using: string;
}

export const testimonials: Testimonial[] = [
  {
    "quote": "… Multi language shopify stores: look no further! This is probably the only app having build in an auto translation feature Powered by Open AI. Yes you need to check the translations, but still it saves us many hours of work translating a campaign email in 20 other languages. This is now done in just a few minutes. Just AMAZING! …",
    "store": "Barista och Espresso",
    "country": "Sweden",
    "using": "4 months using the app"
  },
  {
    "quote": "… Since installing Uppush, I've seen a dramatic increase in abandoned cart recovery. The app allows me to send targeted notifications to customers who have left items in their carts, reminding them of their forgotten purchases and enticing them to complete the checkout process. This has resulted in a significant boost to my bottom line. But Uppush goes beyond just abandoned cart recovery. I can also use the app to send personalized notifications about new arrivals, sales, and exclusive promotions. This has helped me to re-engage past customers and keep them coming back for more. …",
    "store": "Palkhi Fashion",
    "country": "United States",
    "using": "7 months using the app"
  },
  {
    "quote": "I’ve tested many software programs, including Klaviyo (which costs around $80, if I remember correctly), but only this one meets my expectations. I plan to use it long-term. The price is reasonable, and the service is professional. …",
    "store": "8849 Official Store",
    "country": "China",
    "using": "1 day using the app"
  },
  {
    "quote": "Great app. It has (basically) everything that's needed (pop-up, abandoned page/cart/checkout email automations, and email campaigns). The templates are customizable and you can easily make them look good. For the campaigns you can just use customer segments that you create directly in Shopify. And the pricing is very reasonable and transparent",
    "store": "DEWY Korea",
    "country": "United States",
    "using": "8 days using the app"
  },
  {
    "quote": "It was surprisingly easy and seems to be working well and if I believe the report the $12.99 a month I'm paying for it it just made $89 in sales within the first month of using it …",
    "store": "Vasonoxol",
    "country": "United States",
    "using": "20 days using the app"
  },
  {
    "quote": "This has been a really useful addition to our marketing strategy. Setting up push campaigns is straightforward, and the automated notifications help us stay connected with shoppers even after they leave the store. I especially like the ability to send targeted messages for abandoned carts, promotions, and back-in-stock products. It’s an easy way to bring visitors back and create more opportunities for sales without adding much extra work.",
    "store": "Grainhaus Store",
    "country": "United States",
    "using": "About 1 month using the app"
  },
  {
    "quote": "So far I'm very happy with the app. Customer service is responsive and helpful. The app itself is easily designed for abandoned cart and abandoned checkout recovery, which is the main reason I'm using it. The app uses a flow chart style of organization for recovery, making it very easy to set up.",
    "store": "Plushie Produce",
    "country": "United States",
    "using": "26 days using the app"
  },
  {
    "quote": "Really liking Uppush so far with their beautiful features and a super helpful, responsive support team. Liam from Uppush has been very helpful with onboarding us onto this app. Having looked at many push notification apps on Shopify, this is definitely the best one we have used so far. Load time is much faster than other apps we have tried and it integrates really well with the store. It is also a big plus that they total free, it helps a lot for a small start up business like me. Thank you for offering such a well designed and developed product with a great value! …",
    "store": "Lasanra",
    "country": "Vietnam",
    "using": "8 days using the app"
  },
  {
    "quote": "Its a fantastic app! It’s super easy to set up and has made a noticeable difference in recovering abandoned carts. The automated messages are effective and customizable, which is a huge plus. Highly recommend it to anyone looking to boost their sales effortlessly!",
    "store": "SMOKE SOUQ: Vapes, Eliquids, Shisha & More..",
    "country": "United Arab Emirates",
    "using": "3 months using the app"
  },
  {
    "quote": "Came from a different Push Notification app and it's like night and day. Would definitely recommend to any shopify user - experiences or basic. Fantastic UX/UI and customer support. Brilliant revenue tracking. Can't sing it's praises loud enough.",
    "store": "Amazing Oils",
    "country": "Australia",
    "using": "About 1 month using the app"
  },
  {
    "quote": "We've been using this app to improve our retention marketing efforts, and it's been a great addition to our store. Setting up push notifications and automated campaigns was much easier than expected, and we started seeing engagement from returning visitors fairly quickly.",
    "store": "Deskline Online",
    "country": "United States",
    "using": "About 1 month using the app"
  },
  {
    "quote": "Fantastic Plugin, Even Better Support! Top-tier technical support. When we had questions about configuring multiple domains, the team provided accurate, swift, and patient assistance. They know their product inside out and genuinely care about solving your problems. A reliable partner you can count on!",
    "store": "Zendure France",
    "country": "Germany",
    "using": "About 2 hours using the app"
  }
];
