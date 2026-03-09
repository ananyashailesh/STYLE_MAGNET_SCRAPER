import 'dotenv/config';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const dataset = client.dataset(process.env.APIFY_DATASET_ID);

const { items } = await dataset.listItems({ limit: 100 });

console.log(`Total items sampled: ${items.length}\n`);

// Analyze a few items from different retailers
const byDomain = {};
for (const item of items) {
  const domain = new URL(item.url).hostname;
  if (!byDomain[domain]) byDomain[domain] = [];
  byDomain[domain].push(item);
}

for (const [domain, domItems] of Object.entries(byDomain)) {
  const sample = domItems[0];
  console.log(`\n=== ${domain} (${domItems.length} items) ===`);
  console.log('name:', sample.name);
  console.log('brand type:', typeof sample.brand, '-> ', JSON.stringify(sample.brand)?.slice(0, 100));
  console.log('offers:', JSON.stringify(sample.offers)?.slice(0, 100));

  const ap = sample.additionalProperties || {};
  console.log('ap.color:', ap.color);

  const sizes = (ap.variants || []).filter(v => v.size).map(v => v.size);
  console.log('sizes from variants:', sizes.slice(0, 5));

  const epNames = (ap.extraProperties || []).map(e => e.name);
  console.log('extraProperty names:', epNames);

  // Show all extraProperties
  for (const ep of (ap.extraProperties || [])) {
    console.log(`  extra "${ep.name}": ${String(ep.value).slice(0, 120)}`);
  }

  console.log('image:', String(sample.image || '').slice(0, 80));
  console.log('description:', String(sample.description || '').slice(0, 100));
}
