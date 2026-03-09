import { createClient } from '@supabase/supabase-js';
import {
  normalizeColorAsync,
  normalizeSizeAsync,
  normalizeFitDetailsAsync,
} from './normalize.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upsert a batch of products into the 'cleaned_products' table.
 * Uses product_page_url as the upsert key (onConflict).
 * 
 * @param {Array} products - Array of product objects with cleaned_products schema
 * @returns {Object} - { upsertedCount, needsReviewCount }
 */
export async function upsertProducts(products) {
  if (products.length === 0) return { upsertedCount: 0, needsReviewCount: 0 };

  const { data, error } = await supabase
    .from('cleaned_products')
    .upsert(products, {
      onConflict: 'product_page_url',
      ignoreDuplicates: false, // Update existing records
    });

  if (error) {
    throw new Error(`Supabase upsert error: ${error.message}`);
  }

  return { upsertedCount: products.length, data };
}

/**
 * Insert rows into the 'needs_review' table for values that couldn't
 * be normalized.
 * 
 * Schema:
 *   id         bigserial PRIMARY KEY
 *   created_at timestamptz DEFAULT now()
 *   field_name text
 *   raw_value  text
 *   prod_name  text
 *   brand      text
 */
export async function insertNeedsReview(rows) {
  if (rows.length === 0) return { insertedCount: 0 };

  const { data, error } = await supabase
    .from('needs_review')
    .insert(rows);

  if (error) {
    throw new Error(`Supabase needs_review insert error: ${error.message}`);
  }

  return { insertedCount: rows.length, data };
}

/**
 * Reprocess all rows in needs_review table.
 * For each row, re-run the appropriate normalize function.
 * If normalization succeeds, update cleaned_products and delete from needs_review.
 * If it still fails, leave in needs_review.
 */
export async function reprocessNeedsReview() {
  console.log('🔄 Starting needs_review reprocessing...');

  // Fetch all rows from needs_review
  const { data: reviewRows, error: fetchError } = await supabase
    .from('needs_review')
    .select('*');

  if (fetchError) {
    throw new Error(`Failed to fetch needs_review rows: ${fetchError.message}`);
  }

  if (!reviewRows || reviewRows.length === 0) {
    console.log('📭 No rows in needs_review to reprocess');
    return { total: 0, resolved: 0, pending: 0 };
  }

  console.log(`📋 Found ${reviewRows.length} rows to reprocess`);

  let resolved = 0;
  let pending = 0;
  const toDelete = [];

  for (const row of reviewRows) {
    const { id, field_name, raw_value, prod_name, brand } = row;
    let normalizedValue = null;

    // Re-run appropriate normalize function (async with LLM fallback)
    try {
      switch (field_name) {
        case 'color':
          normalizedValue = await normalizeColorAsync(raw_value);
          break;
        case 'size':
          normalizedValue = await normalizeSizeAsync(raw_value);
          break;
        case 'fit_details':
          normalizedValue = await normalizeFitDetailsAsync(raw_value);
          break;
        default:
          console.warn(`Unknown field_name: ${field_name}`);
          pending++;
          continue;
      }
    } catch (err) {
      console.warn(`Error normalizing ${field_name}: ${err.message}`);
      pending++;
      continue;
    }

    if (normalizedValue) {
      // Update cleaned_products table
      const updateColumn = field_name === 'fit_details' ? 'fit_details' : field_name;
      
      // For size, we need to handle array update differently
      if (field_name === 'size') {
        // Get current product to append to size_availability
        const { data: currentProduct } = await supabase
          .from('cleaned_products')
          .select('size_availability')
          .eq('product_name', prod_name)
          .eq('brand_name', brand)
          .single();

        const currentSizes = currentProduct?.size_availability || [];
        if (!currentSizes.includes(normalizedValue)) {
          const newSizes = [...currentSizes, normalizedValue];
          
          const { error: updateError } = await supabase
            .from('cleaned_products')
            .update({ size_availability: newSizes })
            .eq('product_name', prod_name)
            .eq('brand_name', brand);

          if (updateError) {
            console.warn(`Failed to update size for ${prod_name}: ${updateError.message}`);
            pending++;
            continue;
          }
        }
      } else {
        // For color, update the column directly
        const { error: updateError } = await supabase
          .from('cleaned_products')
          .update({ [updateColumn]: normalizedValue })
          .eq('product_name', prod_name)
          .eq('brand_name', brand);

        if (updateError) {
          console.warn(`Failed to update ${field_name} for ${prod_name}: ${updateError.message}`);
          pending++;
          continue;
        }
      }

      // Mark for deletion from needs_review
      toDelete.push(id);
      resolved++;
    } else {
      pending++;
    }
  }

  // Delete resolved rows from needs_review
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('needs_review')
      .delete()
      .in('id', toDelete);

    if (deleteError) {
      console.warn(`Failed to delete resolved rows: ${deleteError.message}`);
    }
  }

  console.log(`🔄 Reprocessed ${reviewRows.length} rows | ✅ Resolved: ${resolved} | ⏳ Still pending: ${pending}`);
  
  return { total: reviewRows.length, resolved, pending };
}

/**
 * Map raw Apify item to cleaned_products schema and insert/upsert.
 * Also handles needs_review insertion for failed normalizations.
 * 
 * @param {Array} rawItems - Array of raw items from Apify
 * @param {Function} normalizeColorFn - Color normalization function
 * @param {Function} normalizeSizesArrayFn - Sizes array normalization function
 * @returns {Object} - { upsertedCount, needsReviewCount }
 */
export async function processAndUpsertProducts(rawItems, normalizeColorFn, normalizeSizesArrayFn) {
  const cleanedProducts = [];
  const needsReviewRows = [];

  for (const raw of rawItems) {
    // Extract product_page_url (required, upsert key)
    const productPageUrl = raw.url || raw.productUrl;
    if (!productPageUrl) {
      console.warn('Skipping item without URL:', raw.name || 'unknown');
      continue;
    }

    // Extract and normalize fields
    const productName = raw.name || raw.title || null;
    const brandName = extractBrand(raw.brand);
    const retailer = raw.retailer || raw.source || null;
    const originalPrice = parsePrice(raw.originalPrice);
    const salePrice = parsePrice(raw.salePrice || raw.price);
    const productImageUrl = raw.imageUrl || raw.image || null;
    const productDescription = raw.description || null;

    // Normalize color
    const rawColor = raw.color || raw.additionalProperties?.color || null;
    const normalizedColor = normalizeColorFn(rawColor);
    
    if (normalizedColor === null && rawColor) {
      needsReviewRows.push({
        field_name: 'color',
        raw_value: String(rawColor),
        prod_name: productName,
        brand: brandName,
      });
    }

    // Normalize sizes
    const rawSizes = raw.sizes || raw.additionalProperties?.variants?.map(v => v.size) || [];
    const { normalized: normalizedSizes, unmatched: unmatchedSizes } = normalizeSizesArrayFn(rawSizes);

    for (const unmatchedSize of unmatchedSizes) {
      needsReviewRows.push({
        field_name: 'size',
        raw_value: unmatchedSize,
        prod_name: productName,
        brand: brandName,
      });
    }

    // size_availability: store as text[] or null if empty
    const sizeAvailability = normalizedSizes.length > 0 ? normalizedSizes : null;

    cleanedProducts.push({
      product_page_url: productPageUrl,
      product_name: productName,
      brand_name: brandName,
      retailer,
      original_price: originalPrice,
      sale_price: salePrice,
      product_image_url: productImageUrl,
      product_description: productDescription,
      color: normalizedColor,
      size_availability: sizeAvailability,
    });
  }

  // Batch upsert products
  let totalUpserted = 0;
  const BATCH_SIZE = 500;

  for (let i = 0; i < cleanedProducts.length; i += BATCH_SIZE) {
    const batch = cleanedProducts.slice(i, i + BATCH_SIZE);
    await upsertProducts(batch);
    totalUpserted += batch.length;
  }

  // Insert needs_review rows
  let totalNeedsReview = 0;
  for (let i = 0; i < needsReviewRows.length; i += BATCH_SIZE) {
    const batch = needsReviewRows.slice(i, i + BATCH_SIZE);
    await insertNeedsReview(batch);
    totalNeedsReview += batch.length;
  }

  console.log(`✅ Upserted: ${totalUpserted} products | ⚠️ Sent to needs_review: ${totalNeedsReview} rows`);

  return { upsertedCount: totalUpserted, needsReviewCount: totalNeedsReview };
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Extract brand name from various formats.
 */
function extractBrand(brand) {
  if (!brand) return null;
  if (typeof brand === 'string') {
    // Clean up "Shop All XYZ" patterns
    return brand.replace(/^Shop All\s*/i, '');
  }
  if (typeof brand === 'object') {
    return brand.name || brand.slogan || null;
  }
  return null;
}

/**
 * Parse price from various formats.
 */
function parsePrice(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  // Strip currency symbols and commas
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export default supabase;
