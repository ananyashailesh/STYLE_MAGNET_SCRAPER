import 'dotenv/config';
import { ApifyClient } from 'apify-client';
import {
  normalizeColor,
  normalizeSizesArray,
  normalizeFitDetails,
} from './normalize.js';
import { upsertProducts, insertNeedsReview } from './supabase.js';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const APIFY_TOKEN = process.env.APIFY_TOKEN;
let APIFY_DATASET_ID = process.env.APIFY_DATASET_ID;

// If scrape.js just ran and updated .env, re-read it
if (!APIFY_DATASET_ID || APIFY_DATASET_ID === 'your_dataset_id_here') {
  const { config } = await import('dotenv');
  config({ override: true });
  APIFY_DATASET_ID = process.env.APIFY_DATASET_ID;
}

if (!APIFY_DATASET_ID || APIFY_DATASET_ID === 'your_dataset_id_here') {
  throw new Error('Missing APIFY_DATASET_ID — run "node scrape.js" first or set it in .env');
}

// ─── FETCH FROM APIFY ────────────────────────────────────────────────────────

async function fetchApifyDataset() {
  const client = new ApifyClient({ token: APIFY_TOKEN });
  const dataset = client.dataset(APIFY_DATASET_ID);
  const { items } = await dataset.listItems();
  console.log(`Fetched ${items.length} products from Apify dataset ${APIFY_DATASET_ID}`);
  return items;
}

// ─── MAP APIFY RAW → FLAT PRODUCT ────────────────────────────────────────────

function mapApifyItem(raw) {
  const ap = raw.additionalProperties || {};
  const offers = raw.offers || {};

  // Brand: can be object { slogan, name } or string
  let brand = null;
  if (typeof raw.brand === 'string') {
    brand = raw.brand;
  } else if (raw.brand && typeof raw.brand === 'object') {
    brand = raw.brand.name || raw.brand.slogan || null;
  }
  // Clean up brand from "Shop All XYZ" patterns
  if (brand && brand.startsWith('Shop All ')) {
    brand = brand.replace('Shop All ', '');
  }

  // Color: from additionalProperties.color or extraProperties
  const color = ap.color
    || (ap.extraProperties || []).find(e => e.name === 'color')?.value
    || raw.color
    || null;

  // Sizes: from additionalProperties.variants[].size
  const sizes = (ap.variants || [])
    .filter(v => v.size)
    .map(v => v.size);

  // Materials: from extraProperties or description
  const materialsEp = (ap.extraProperties || []).find(
    e => /material|fabric|composition|content/i.test(e.name),
  );
  const materials = materialsEp?.value || raw.materials || null;

  // Care: from extraProperties
  const careEp = (ap.extraProperties || []).find(
    e => /care/i.test(e.name),
  );
  const careInstructions = careEp?.value || raw.careInstructions || null;

  // Price
  const originalPrice = raw.originalPrice || offers.price || null;
  const salePrice = raw.salePrice || offers.salePrice || null;

  // Retailer
  const retailer = raw.retailer || raw.source || null;

  return {
    name: raw.name || null,
    brand,
    originalPrice,
    salePrice,
    color,
    description: raw.description || null,
    materials,
    careInstructions,
    sizes,
    imageUrl: raw.image || raw.imageUrl || null,
    productUrl: raw.url || null,
    retailer,
  };
}

// ─── PROCESS PRODUCTS ────────────────────────────────────────────────────────

function processProducts(rawProducts) {
  const normalizedProducts = [];
  const reviewRows = [];

  for (const apifyItem of rawProducts) {
    const raw = mapApifyItem(apifyItem);

    // Skip items without a URL (required for upsert key)
    const productPageUrl = raw.productUrl;
    if (!productPageUrl) {
      console.warn('Skipping item without URL:', raw.name || 'unknown');
      continue;
    }

    // Normalize color
    const color = normalizeColor(raw.color);
    if (color === null && raw.color) {
      reviewRows.push({
        field_name: 'color',
        raw_value: String(raw.color),
        prod_name: raw.name || null,
        brand: raw.brand || null,
      });
    }

    // Normalize sizes
    const { normalized: sizes, unmatched: unmatchedSizes } =
      normalizeSizesArray(raw.sizes);
    for (const unmatchedSize of unmatchedSizes) {
      reviewRows.push({
        field_name: 'size',
        raw_value: unmatchedSize,
        prod_name: raw.name || null,
        brand: raw.brand || null,
      });
    }

    // Normalize fit_details from materials (used internally, not stored)
    const fitDetails = normalizeFitDetails(raw.materials);
    if (fitDetails === null && raw.materials) {
      reviewRows.push({
        field_name: 'fit_details',
        raw_value: String(raw.materials),
        prod_name: raw.name || null,
        brand: raw.brand || null,
      });
    }

    // Parse prices
    const originalPrice = parsePrice(raw.originalPrice);
    const salePrice = parsePrice(raw.salePrice);

    // Map to cleaned_products schema
    normalizedProducts.push({
      product_page_url: productPageUrl,           // UNIQUE upsert key
      product_name: raw.name || null,
      brand_name: raw.brand || null,
      retailer: raw.retailer || null,
      original_price: originalPrice,
      sale_price: salePrice,
      product_image_url: raw.imageUrl || null,
      product_description: raw.description || null,
      color,
      size_availability: sizes.length > 0 ? sizes : null, // text[] or null
    });
  }

  return { normalizedProducts, reviewRows };
}

function parsePrice(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  // Strip currency symbols and commas
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ─── BATCH HELPER ────────────────────────────────────────────────────────────

async function batchProcess(items, batchSize, fn) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await fn(batch);
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting product sync...');

  // 1. Fetch raw data from Apify
  const rawProducts = await fetchApifyDataset();

  // 2. Normalize
  const { normalizedProducts, reviewRows } = processProducts(rawProducts);

  console.log(`📦 Normalized ${normalizedProducts.length} products`);

  // 3. Upsert to Supabase in batches of 500
  await batchProcess(normalizedProducts, 500, async (batch) => {
    await upsertProducts(batch);
  });

  // 4. Insert needs_review rows
  if (reviewRows.length > 0) {
    await batchProcess(reviewRows, 500, async (batch) => {
      await insertNeedsReview(batch);
    });
  }

  // Log final summary
  console.log(`✅ Upserted: ${normalizedProducts.length} products | ⚠️ Sent to needs_review: ${reviewRows.length} rows`);
  console.log('🏁 Sync complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
