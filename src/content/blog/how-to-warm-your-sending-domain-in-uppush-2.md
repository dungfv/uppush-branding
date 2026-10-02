---
title: "How to warm your sending domain in Uppush"
description: "Understand the concept of email warm-up and how to perform it using Uppush’s features. When you change your email marketing platform or domain, your email server will also change. It’s crucial to note that your new…"
pubDate: 2026-04-13
author: "Uppush team"
categories: ["business","email-essentials","email-marketing","guides","marketing"]
tags: ["domains","email automation","email marketing","marketing"]
cover:
  src: "../../assets/uploads/posts/how-to-warm-your-sending-domain-in-uppush-2/image-blog.webp"
  alt: "How to warm your sending domain in Uppush"
wpId: 23077
---
_Understand the concept of email warm-up and how to perform it using Uppush’s features._

When you change your email marketing platform or domain, your email server will also change. It’s crucial to note that your new server can only send a small number of emails in one go. To ensure email deliverability, gradually increase sending volumes over time.

The _**warm-up**_ process helps build up your sender’s reputation, improving deliverability.

## **About Email Warm-up**

Although the warm-up plan will work for most, many factors can influence the process. For example, if ISPs’ scripts determine that the generated traffic’s quality is below their expectations, some emails might get blocked or sent to junk folders.

If you’re migrating from one service provider to another, expect a few bumps in your metrics. Large ISPs like Gmail, Yahoo, and Microsoft may need more time to adjust their metrics. These ISPs update their records based on current and previous interactions with your mail or domain.

> It’s essential to remember that skipping the warm-up process can result in emails not being delivered.

Warm-up Plan Benefits

-   Warming up your email reputation allows you to monitor and improve your email marketing.
-   Establishing a solid reputation during the warm-up phase simplifies matters and allows you to focus on growing your business instead of troubleshooting issue.
-   ISPs evaluate your sending behavior, content, and recipient engagement during warm-up to see how well you manage the health of your lists and how willing you are to send relevant information to responsive users.
-   Reassessing your content during warm-up can help you identify which emails generate the most (or least) engagement and discover why.
-   Excluding disengaged subscribers from your campaigns leads to a higher ROI and prevents wasted costs.

## Keep in Mind

-   Always obtain permission before sending emails to people. Opt-ins are a must.
-   Your reputation can suffer if people don’t want your emails. So, make sure your subscribers are interested in your content.
-   ISPs trust their users’ metrics and don’t give special treatment to any brand.
-   Your signed domain’s reputation can follow you, and Gmail uses both domain and IP reputations to determine your sender score.
-   Follow the warm-up process to ensure a good sender reputation.
-   Don’t assume that long-time subscribers are engaged with your content. Recently opted-in subscribers are the ones most interested in your content!

## Before You Begin

```
If you have more than 5,000 subscribers and have recently added a dedicated sender domain, or if the sender domain doesn't match the sender's email, you must follow our warm-up process to ensure your emails reach your subscribers' inboxes.
```

-   Please note that the split will be applied once a day. This means that if you send another campaign on the same day, the email will be sent from the shared domain.
-   If you opted into the warm-up process for a new dedicated domain, you won’t be able to use Campaign Booster and A/B testing until the domain is fully warmed up.
-   We strongly advise against opting out of the warm-up process, as it could damage your sender’s reputation. This can lead to poor delivery rates and lower sales metrics.
-   Once you begin the warm-up, the progress will be shown on the Sender domain page.

## How to Start the Warm-up?

To begin the warm-up process, you first need to select a custom sending domain for your campaigns. You can do this by going to Store Settings → Domains → Active Domains → Choose the custom domain you want to use for sending.

In Uppush, the correct workflow is:

1.  Go to Settings → Verify Domain to complete domain authentication.
2.  Once verification is finished, go to Settings → Email Sender to select your sending domain and start the warm-up process.

For a detailed guide on how to verify your domain in Uppush, you can refer to the documentation [_here_](https://docs.uppush.io/settings/verify-domain/) _._

Once you have verified your domain and assigned it as a domain in use for campaigns and automation, you will see a notification to select your preferred warmup strategy. There, you can select to warm up your domain automatically. We will gradually increase the percentage of emails sent from your own domain. This will help inbox providers such as Google or Yahoo recognize you as a trusted sender and allow your emails to go through.

You will also see information about the ongoing warm-up plan during the Review step of your Campaigns.

## How Does it Work?

Imagine you want to gradually transition to a new dedicated domain for your email campaigns.

To determine whether you are eligible for the warm-up process, our system will split your audience based on specific calculations, which, in this case, is a recent subscription.

<table class="has-fixed-layout"><tbody><tr><td><strong>Day</strong></td><td><strong>Campaign</strong></td><td><strong>Volume per campaign</strong></td></tr><tr><td>Day 1</td><td>Campaign 1</td><td>500</td></tr><tr><td>Day 2</td><td>Campaign 2</td><td>1000</td></tr><tr><td>Day 3</td><td>Campaign 3</td><td>2000</td></tr><tr><td>Day 4</td><td>Campaign 4</td><td>4000</td></tr><tr><td>Day 5</td><td>Campaign 5</td><td>8000</td></tr><tr><td>Day 6</td><td>Campaign 6</td><td>12000</td></tr><tr><td>Day 7</td><td>Campaign 7</td><td>18000</td></tr><tr><td>Day 8</td><td>Campaign 8</td><td>25000</td></tr><tr><td>Day 9</td><td>Campaign 9</td><td>35000</td></tr><tr><td>Day 10</td><td>Campaign 10</td><td>50000</td></tr><tr><td>Day 11</td><td>Campaign 11</td><td>65000</td></tr><tr><td>Day 12</td><td>Campaign 12</td><td>80000</td></tr></tbody></table>

The process is automatic and involves sending campaigns to a mix of recipients, with a small portion receiving emails via the new domain and the majority receiving them via the shared domain. With each subsequent campaign, we will gradually increase the number of recipients who receive emails via the dedicated domain until all recipients receive campaigns exclusively through this domain.

For example, you plan to send the campaign to 10,000 recipients in the first campaign. However, only 500 recipients will receive the campaign via the new domain, while the remaining 9,500 will receive it via the shared domain.

In the second campaign, we will send the campaign to 5,000 recipients, with 1,000 receiving it via the new domain and the remaining 4,000 via the shared domain. This process continues until all recipients receive campaigns exclusively through the dedicated domain.

This use case can be helpful for you if you want to establish a brand identity or improve email deliverability by using a dedicated domain. By gradually transitioning to the new domain, you can ensure that your emails are delivered successfully without negatively impacting your email campaigns or brand reputation.

## Warm-up End

The warm-up period will end when the last three campaigns are sent from a dedicated domain or after one month, whichever comes first. After this period, you will be removed from the warm-up process and will be able to send to different audiences.

## Monitor your performance

These tools in Uppush will help you track your performance while warming up your sending domain:

-   Review flow analytics Regularly check the analytics of your automated flows, including open rates, unsubscribe rates, and spam complaint rates. This helps you understand how subscribers are engaging with your emails during the warm-up phase.
-   Monitor campaigns through the trends report Use the trends report to observe changes in key engagement metrics over time. Pay close attention to spikes in “marked as spam” or hard bounce rates, and review any campaigns that may have caused these issues. Consistently monitoring these indicators will help you maintain strong deliverability and protect your sender reputation throughout the warm-up process.

## FAQ

### Why do I need to follow the warm-up process?

The warmup process is crucial for users with over 5,000 subscribers or those who recently added a dedicated sender domain. It ensures your emails reach subscribers’ inboxes and helps maintain a positive sender reputation.

#### What happens if I send multiple campaigns in a day during the warm-up process?

If you send multiple campaigns in a day, the split will only apply once, and the subsequent campaigns will be sent from the shared domain.

#### Can I use Campaign Booster and A/B testing during the warm-up process?

It’s not possible to use Campaign Booster and A/B testing until your dedicated domain is fully warmed up.

#### Is opting out of the warm-up process recommended?

Opting out is strongly discouraged as it could harm your sender’s reputation, resulting in poor delivery rates and lower sales metrics.
