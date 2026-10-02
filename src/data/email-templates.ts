/**
 * Template showcase on the home page.
 * Drop a screenshot named `<id>.png|jpg|webp` into src/assets/templates/ and it
 * replaces the built-in HTML mockup automatically (portrait ~ 600×900 works best).
 * Order here = order in the carousel.
 */
export interface EmailTemplateCard {
  id: string;
  name: string;
  category: 'Automation' | 'Campaign' | 'Web push';
  /** Mockup styling until a real screenshot is added. */
  mock: { headline: string; cta: string; tone: 'mint' | 'sand' | 'ink' | 'rose' | 'sky' | 'violet'; layout: 'hero' | 'grid' | 'product' | 'code'; code?: string };
}

export const emailTemplates: EmailTemplateCard[] = [
  { id: 'abandoned-cart', name: 'Abandoned cart', category: 'Automation', mock: { headline: 'You left something behind', cta: 'Return to cart', tone: 'mint', layout: 'product' } },
  { id: 'welcome', name: 'Welcome + discount', category: 'Automation', mock: { headline: 'Welcome! Here’s 10% off', cta: 'Shop now', tone: 'sand', layout: 'code' } },
  { id: 'black-friday', name: 'Black Friday', category: 'Campaign', mock: { headline: 'Black Friday: up to 50% off', cta: 'Shop the sale', tone: 'ink', layout: 'hero' } },
  { id: 'back-to-school', name: 'Back to school', category: 'Campaign', mock: { headline: 'Back to school deals', cta: 'Shop now', tone: 'sky', layout: 'grid' } },
  { id: 'new-arrivals', name: 'New arrivals', category: 'Campaign', mock: { headline: 'Just landed: new season', cta: 'Discover', tone: 'rose', layout: 'grid' } },
  { id: 'women-day', name: 'Women’s Day', category: 'Campaign', mock: { headline: 'Celebrate Women’s Day', cta: 'Shop now', tone: 'mint', layout: 'grid' } },
  { id: 'valentines', name: 'Valentine’s Day', category: 'Campaign', mock: { headline: 'Gifts they’ll love', cta: 'Find a gift', tone: 'rose', layout: 'hero' } },
  { id: 'halloween', name: 'Halloween', category: 'Campaign', mock: { headline: 'Spooky deals this Halloween', cta: 'Shop now', tone: 'ink', layout: 'grid' } },
  { id: 'christmas', name: 'Christmas', category: 'Campaign', mock: { headline: 'Santa’s here!', cta: 'Shop now', tone: 'rose', layout: 'hero' } },
  { id: 'thanksgiving', name: 'Thanksgiving', category: 'Campaign', mock: { headline: 'Give thanks with great deals', cta: 'Shop now', tone: 'sand', layout: 'grid' } },
  { id: 'weekend-sale', name: 'Weekend Sale', category: 'Campaign', mock: { headline: 'Weekend Sale: Up to 50% off', cta: 'Shop now', tone: 'violet', layout: 'hero' } },
  { id: 'newsletter', name: 'Newsletter', category: 'Campaign', mock: { headline: 'Stay in the loop', cta: 'Subscribe', tone: 'mint', layout: 'grid' } },
];
