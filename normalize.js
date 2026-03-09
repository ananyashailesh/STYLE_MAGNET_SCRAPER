import Fuse from 'fuse.js';
import nearestColor from 'nearest-color';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const colorNameList = require('color-name-list');

// ─── VALID VALUES ────────────────────────────────────────────────────────────

export const VALID_COLORS = [
  'Black', 'White', 'Grey', 'Navy', 'Blue', 'Green', 'Red', 'Pink',
  'Purple', 'Yellow', 'Orange', 'Brown', 'Beige', 'Ivory', 'Gold',
  'Silver', 'Multi',
];

export const VALID_SIZES = [
  'XXSmall', 'XSmall', 'Small', 'Small/Medium', 'Medium', 'Large',
  'Large/XLarge', 'XLarge', 'XXLarge', '3XL', '4XL', 'One Size',
  'P (XSmall)',
  // Numeric sizes
  '0', '00', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '18', '20', '22', '24',
  '26', '27', '28', '29', '30', '31', '32', '33', '34', '36', '38', '40',
  // Half sizes
  '4.5', '5.5', '6.5', '7.5', '8.5', '9.5', '10.5', '11.5', '12.5',
  // Petite numeric
  '29P', '30P', '31P', '32P',
];

export const VALID_MATERIALS = [
  'Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Nylon', 'Rayon',
  'Spandex', 'Cashmere', 'Leather', 'Suede', 'Denim', 'Velvet',
  'Satin', 'Chiffon', 'Lace', 'Tweed', 'Fleece', 'Modal', 'Tencel',
  'Viscose', 'Acrylic', 'Hemp', 'Bamboo',
];

// ─── SYNONYM DICTIONARIES ────────────────────────────────────────────────────

const COLOR_SYNONYMS = {
  // Blues
  navy: 'Blue', cobalt: 'Blue', teal: 'Blue', aquamarine: 'Blue',
  'sky blue': 'Blue', denim: 'Blue', indigo: 'Blue', cerulean: 'Blue',
  'royal blue': 'Blue', sapphire: 'Blue', 'baby blue': 'Blue',
  turquoise: 'Blue', periwinkle: 'Blue', 'powder blue': 'Blue',
  'ice blue': 'Blue', 'french blue': 'Blue', 'collegiate royal': 'Blue',
  'pure teal': 'Blue',

  // Greens
  olive: 'Green', sage: 'Green', mint: 'Green', emerald: 'Green',
  'forest green': 'Green', hunter: 'Green', moss: 'Green', jade: 'Green',
  chartreuse: 'Green', lime: 'Green', avocado: 'Green', pistachio: 'Green',
  fern: 'Green', basil: 'Green', 'pure sage': 'Green', 'wonder sage': 'Green',

  // Reds
  burgundy: 'Red', crimson: 'Red', scarlet: 'Red', wine: 'Red',
  maroon: 'Red', cherry: 'Red', ruby: 'Red', garnet: 'Red',
  cranberry: 'Red', tomato: 'Red', 'cherry red': 'Red', 'silt red': 'Red',
  'burgundy crush': 'Red', 'burgundy ash': 'Red',

  // Pinks
  coral: 'Pink', blush: 'Pink', rose: 'Pink', mauve: 'Pink',
  fuchsia: 'Pink', 'hot pink': 'Pink', salmon: 'Pink', peach: 'Pink',
  watermelon: 'Pink', magenta: 'Pink', carnation: 'Pink',
  'dusty rose': 'Pink', 'rose gold': 'Pink', primrose: 'Pink',
  'pink clay': 'Pink', 'pink spark': 'Pink', 'melon creme': 'Pink',

  // Purples
  lavender: 'Purple', lilac: 'Purple', violet: 'Purple', amethyst: 'Purple',
  plum: 'Purple', orchid: 'Purple', wisteria: 'Purple', eggplant: 'Purple',
  grape: 'Purple', 'ice purple': 'Purple', 'real lilac': 'Purple',

  // Yellows
  mustard: 'Yellow', lemon: 'Yellow', butter: 'Yellow', canary: 'Yellow',
  saffron: 'Yellow', honey: 'Yellow', sunflower: 'Yellow', ochre: 'Yellow',
  amber: 'Yellow', marigold: 'Yellow',

  // Oranges
  rust: 'Orange', terracotta: 'Orange', 'burnt orange': 'Orange',
  pumpkin: 'Orange', papaya: 'Orange', apricot: 'Orange',
  tangerine: 'Orange', sienna: 'Orange', copper: 'Orange',

  // Browns
  tan: 'Brown', camel: 'Brown', chocolate: 'Brown', espresso: 'Brown',
  cognac: 'Brown', chestnut: 'Brown', walnut: 'Brown', mahogany: 'Brown',
  hazel: 'Brown', toffee: 'Brown', caramel: 'Brown', mocha: 'Brown',
  'dark brown': 'Brown', coco: 'Brown', mink: 'Brown', miele: 'Brown',
  'spiced pecan': 'Brown', whiskey: 'Brown', choc: 'Brown',

  // Beiges
  taupe: 'Beige', sand: 'Beige', champagne: 'Beige', latte: 'Beige',
  nude: 'Beige', khaki: 'Beige', wheat: 'Beige', oat: 'Beige',
  stone: 'Beige', parchment: 'Beige', biscuit: 'Beige',
  'light khaki': 'Beige', 'arid stone': 'Beige', 'natural jute': 'Beige',
  'parchment cream': 'Beige', 'sand pink': 'Beige',

  // Ivories
  cream: 'Ivory', 'off-white': 'Ivory', ecru: 'Ivory', pearl: 'Ivory',
  'off white': 'Ivory', vanilla: 'Ivory', alabaster: 'Ivory',
  'antique white': 'Ivory', 'modern ivory': 'Ivory', 'warm white': 'Ivory',
  'footwear white': 'Ivory', 'crew white': 'Ivory',

  // Greys
  charcoal: 'Grey', slate: 'Grey', ash: 'Grey', pewter: 'Grey',
  gunmetal: 'Grey', 'dark grey': 'Grey', 'light grey': 'Grey',
  'heather grey': 'Grey', cement: 'Grey', fog: 'Grey', dove: 'Grey',
  'grey two': 'Grey', 'grey one': 'Grey', calcium: 'Grey',
  'basalt grey': 'Grey', 'basalt gray': 'Grey',

  // Blacks
  jet: 'Black', ebony: 'Black', onyx: 'Black', noir: 'Black',
  'black silver': 'Black', 'black solar flare': 'Black',
  'black luxe': 'Black', 'black venice': 'Black', 'core black': 'Black',
  'utility black': 'Black',

  // Whites
  'white natural': 'White', 'white hi shine': 'White', 'pure white': 'White',
  'bright white': 'White', 'chalk pearl': 'White',

  // Golds
  bronze: 'Gold', brass: 'Gold', '14k gold': 'Gold', 'gold metallic': 'Gold',

  // Silvers
  platinum: 'Silver', chrome: 'Silver', 'pure silver': 'Silver',
  alumina: 'Silver',

  // Multi-color dominant
  'black & ivory': 'Black', 'cream & black': 'Ivory',
  'black & brown leopard': 'Brown', 'green & white stripe': 'Green',
  'cow print': 'Brown', leopard: 'Brown', zebra: 'Black',
  'animal print': 'Brown', floral: 'White',
};

const SIZE_SYNONYMS = {
  xs: 'XSmall', 'x-small': 'XSmall', 'extra small': 'XSmall',
  'extra-small': 'XSmall', xsmall: 'XSmall',
  s: 'Small', sm: 'Small',
  m: 'Medium', med: 'Medium',
  l: 'Large', lg: 'Large',
  xl: 'XLarge', 'x-large': 'XLarge', 'extra large': 'XLarge',
  xxl: 'XXLarge', '2xl': 'XXLarge', 'xx-large': 'XXLarge', xxlarge: 'XXLarge',
  xxs: 'XXSmall', '2xs': 'XXSmall', 'xx-small': 'XXSmall',
  xxxl: '3XL', '3xl': '3XL',
  xxxxl: '4XL', '4xl': '4XL',
  xxxxs: 'XXSmall',
  's/m': 'Small/Medium', 'sm/md': 'Small/Medium',
  'l/xl': 'Large/XLarge', 'lg/xl': 'Large/XLarge',
  'm/l': 'Large',
  'xs/s': 'XSmall',
  os: 'One Size', 'o/s': 'One Size', 'one-size': 'One Size', onesize: 'One Size',
  p: 'P (XSmall)', petite: 'P (XSmall)',
  'us xs': 'XSmall', 'us s': 'Small', 'us m': 'Medium',
  'us l': 'Large', 'us xl': 'XLarge', 'us xxs': 'XXSmall',
  '0 / xs': 'XSmall', '1 / s': 'Small', '2 / m': 'Medium',
  '3 / l': 'Large', '4 / xl': 'XLarge', '15/xl': 'XLarge',
};

// ─── MATERIAL SUFFIX & PREFIX LISTS ──────────────────────────────────────────

const MATERIAL_SUFFIXES = [
  'suede', 'nubuck', 'leather', 'nappa', 'satin', 'velvet', 'canvas',
  'rubber', 'vinyl', 'vynalite', 'vinylite', 'patent', 'combo', 'ruboff',
  'luxe', 'venice', 'capretto', 'solar flare', 'hi shine', 'oiled leather',
  'jute', 'tweed', 'clay', 'tint', 'metallic', 'glitter', 'shine', 'matte',
  'glossy', 'washed', 'heather', 'fp exclusive', 'exclusive', 'print',
  'stripe', 'plaid', 'check',
];

const QUALIFIER_PREFIXES = [
  'light', 'dark', 'deep', 'bright', 'pale', 'dusty', 'warm', 'cool',
  'soft', 'rich', 'muted', 'washed', 'pure', 'basalt', 'arid', 'modern',
  'classic', 'natural',
];

// ─── FUSE.JS INSTANCES ───────────────────────────────────────────────────────

const colorFuse = new Fuse(VALID_COLORS, {
  threshold: 0.35,
  includeScore: true,
});

const sizeFuse = new Fuse(VALID_SIZES, {
  threshold: 0.3,
  includeScore: true,
});

const materialFuse = new Fuse(VALID_MATERIALS, {
  threshold: 0.4,
  includeScore: true,
});

// ─── NEAREST COLOR SETUP ─────────────────────────────────────────────────────

// Map valid colors to hex values
const colorHexMap = {
  Black: '#000000',
  White: '#FFFFFF',
  Grey: '#808080',
  Navy: '#000080',
  Blue: '#0000FF',
  Green: '#008000',
  Red: '#FF0000',
  Pink: '#FFC0CB',
  Purple: '#800080',
  Yellow: '#FFFF00',
  Orange: '#FFA500',
  Brown: '#8B4513',
  Beige: '#F5F5DC',
  Ivory: '#FFFFF0',
  Gold: '#FFD700',
  Silver: '#C0C0C0',
  Multi: '#FFFFFF', // fallback
};

const nearestColorFinder = nearestColor.from(colorHexMap);

// Build a lookup from color names to hex
const colorNameToHex = {};
for (const color of colorNameList) {
  colorNameToHex[color.name.toLowerCase()] = color.hex;
}

// ─── STEP 1: GARBAGE DETECTION ───────────────────────────────────────────────

function isGarbageColor(value) {
  if (!value) return true;
  const v = String(value).trim();

  // Pure numeric IDs (5+ digits)
  if (/^\d{5,}$/.test(v)) return true;
  // 3-digit codes
  if (/^\d{3}$/.test(v)) return true;
  // Hex color codes
  if (/^#?[0-9a-f]{6}$/i.test(v)) return true;
  // iPhone references
  if (/^iphone/i.test(v)) return true;
  // Stock/availability messages
  if (/only\s+\d+\s+left/i.test(v)) return true;
  if (/sold\s*out/i.test(v)) return true;
  // US dash placeholder
  if (/^US\s*--$/i.test(v)) return true;

  return false;
}

function isGarbageSize(value) {
  if (!value) return true;
  const v = String(value).trim();

  // iPhone references
  if (/^iphone/i.test(v)) return true;
  // Sold out
  if (/sold\s*out/i.test(v)) return true;
  // Only X left
  if (/only\s+\d+\s+left/i.test(v)) return true;
  // Pure dashes
  if (/^[-–]+$/.test(v)) return true;
  // US dash placeholder
  if (/^US\s*--$/i.test(v)) return true;

  return false;
}

function isGarbageFitDetails(value) {
  if (!value) return true;
  const v = String(value).trim();

  // Values starting with numbers
  if (/^\d/.test(v)) return true;
  // Only X left
  if (/only\s+\d+\s+left/i.test(v)) return true;
  // Sold out
  if (/sold\s*out/i.test(v)) return true;

  return false;
}

// ─── STEP 2: EXACT MATCH ─────────────────────────────────────────────────────

function exactMatch(value, validList) {
  if (!value) return null;
  const lower = String(value).trim().toLowerCase();
  for (const valid of validList) {
    if (valid.toLowerCase() === lower) {
      return valid;
    }
  }
  return null;
}

// ─── STEP 3: PRE-PROCESSING ──────────────────────────────────────────────────

function preprocessColor(value) {
  if (!value) return null;
  let v = String(value).trim();

  // a) Split on comma or & → take first segment only
  v = v.split(/[,&]/)[0].trim();

  // b) Strip material suffixes (whole word, case-insensitive)
  for (const suffix of MATERIAL_SUFFIXES) {
    const regex = new RegExp(`\\b${suffix}\\b`, 'gi');
    v = v.replace(regex, '').trim();
  }

  // c) Strip qualifier prefixes
  for (const prefix of QUALIFIER_PREFIXES) {
    const regex = new RegExp(`^${prefix}\\s+`, 'gi');
    v = v.replace(regex, '').trim();
  }

  // d) Strip leading/trailing non-alpha characters
  v = v.replace(/^[^a-zA-Z]+/, '').replace(/[^a-zA-Z]+$/, '').trim();

  // e) Return null if nothing remains
  return v.length > 0 ? v : null;
}

function preprocessSize(value) {
  if (!value) return null;
  const v = String(value).trim();

  // 1. Pure garbage: dash only or empty
  if (/^[-–\s]*$/.test(v) || v === '') return null;

  // 2. "US 6", "US XS" etc → strip "US " prefix
  const usMatch = v.match(/^US\s+(.+)$/i);
  if (usMatch) return usMatch[1].trim();

  // 3. "W 6", "W 8.5" → strip "W " prefix
  const wMatch = v.match(/^W\s+(\d+(?:\.\d+)?)$/i);
  if (wMatch) return wMatch[1];

  // 4. "EU 36" → return the number
  const euMatch = v.match(/^EU\s+(\d+(?:\.\d+)?)$/i);
  if (euMatch) return euMatch[1];

  // 5. "US6 / EU36" → extract US number
  const usEuMatch = v.match(/^US\s*(\d+(?:\.\d+)?)\s*\/\s*EU\s*\d+/i);
  if (usEuMatch) return usEuMatch[1];

  // 6. "EU36 / US6" → extract US number
  const euUsMatch = v.match(/^EU\s*\d+(?:\.\d+)?\s*\/\s*US\s*(\d+(?:\.\d+)?)/i);
  if (euUsMatch) return euUsMatch[1];

  // 7. "6 W / 4.5 M", "10.5W / 9M" → return women's (left) number
  const womenLeftMatch = v.match(/^(\d+(?:\.\d+)?)\s*W\s*\/\s*\d+(?:\.\d+)?\s*M$/i);
  if (womenLeftMatch) return womenLeftMatch[1];

  // 8. "M 4.5 / W 6", "M 10.5/ W 12" → return women's (right) number
  const womenRightMatch = v.match(/^M\s*\d+(?:\.\d+)?\s*\/?\s*W\s*(\d+(?:\.\d+)?)$/i);
  if (womenRightMatch) return womenRightMatch[1];

  // 9. "4 / W 5", "4.5/W 6" → return men's (left) number
  const menLeftMatch = v.match(/^(\d+(?:\.\d+)?)\s*\/\s*W\s*\d+(?:\.\d+)?$/i);
  if (menLeftMatch) return menLeftMatch[1];

  // 10. "6 / EU 37", "7-7.5 / EU 38" → return left side, for ranges take first
  const leftEuMatch = v.match(/^(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)\s*\/\s*EU\s*\d+/i);
  if (leftEuMatch) {
    const leftPart = leftEuMatch[1];
    // For ranges "7-7.5" take "7"
    const rangeParts = leftPart.split('-');
    return rangeParts[0];
  }

  // 11. "6 / M 4.5" → return left (women's) number
  const leftMenMatch = v.match(/^(\d+(?:\.\d+)?)\s*\/\s*M\s*\d+(?:\.\d+)?$/i);
  if (leftMenMatch) return leftMenMatch[1];

  // 12. "US 6-8", "US 2-4" → return smaller number
  const usRangeMatch = v.match(/^US\s*(\d+)-(\d+)$/i);
  if (usRangeMatch) {
    const num1 = parseInt(usRangeMatch[1], 10);
    const num2 = parseInt(usRangeMatch[2], 10);
    return String(Math.min(num1, num2));
  }

  // 13. "US 27/S", "US 25/XS" → return alpha part (S, XS)
  const usNumAlphaMatch = v.match(/^US\s*\d+\s*\/\s*([A-Za-z]+)$/i);
  if (usNumAlphaMatch) return usNumAlphaMatch[1].toUpperCase();

  // 14. "US 00-0", "US 00,0" → return first number
  const usDoubleMatch = v.match(/^US\s*(00|0+)[-,]\s*\d+$/i);
  if (usDoubleMatch) return usDoubleMatch[1];

  // 15. "29P", "30P" → return as-is (valid petite numeric)
  const petiteMatch = v.match(/^(\d+P)$/i);
  if (petiteMatch) return petiteMatch[1];

  return v;
}

// ─── STEP 4: SYNONYM DICTIONARY ──────────────────────────────────────────────

function synonymLookup(value, synonymDict) {
  if (!value) return null;
  const lower = String(value).trim().toLowerCase();
  return synonymDict[lower] || null;
}

// ─── STEP 5: FUZZY MATCH ─────────────────────────────────────────────────────

function fuzzyMatch(value, fuseInstance, threshold) {
  if (!value) return null;
  const results = fuseInstance.search(String(value).trim());
  if (results.length > 0 && results[0].score < threshold) {
    return results[0].item;
  }
  return null;
}

// ─── STEP 6: RGB NEAREST COLOR ───────────────────────────────────────────────

function rgbNearestColor(value) {
  if (!value) return null;
  const lower = String(value).trim().toLowerCase();

  // Try to find hex from color-name-list
  const hex = colorNameToHex[lower];
  if (!hex) return null;

  const result = nearestColorFinder(hex);
  return result ? result.name : null;
}

// ─── STEP 7: FREE LLM FALLBACK ───────────────────────────────────────────────

async function llmFallback(value, fieldType, validList) {
  if (!value || !process.env.OPENROUTER_API_KEY) return null;

  let prompt;
  const listStr = validList.join(', ');

  switch (fieldType) {
    case 'color':
      prompt = `Map this fashion color to exactly one of: [${listStr}]. Raw value: '${value}'. Return ONLY the color name or the word null.`;
      break;
    case 'size':
      prompt = `Map this fashion size to exactly one of: [${listStr}]. Raw value: '${value}'. Return ONLY the size name or the word null.`;
      break;
    case 'material':
      prompt = `Map this fabric description to exactly one of: [${listStr}]. Raw value: '${value}'. Hints: denim→Cotton, fleece→Polyester, terry→Cotton, jersey→Polyester, satin→Polyester, lace→Nylon, canvas→Cotton, suiting→Wool, woven straw→Linen. Return ONLY the material name or the word null.`;
      break;
    default:
      return null;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://github.com/scrape-clean-automate',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        max_tokens: 20,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer || answer.toLowerCase() === 'null') return null;

    // Validate response exists in valid list
    const match = validList.find(
      (v) => v.toLowerCase() === answer.toLowerCase()
    );
    return match || null;
  } catch {
    return null;
  }
}

// ─── MAIN NORMALIZATION FUNCTIONS ────────────────────────────────────────────

/**
 * Normalize a color value through the 8-step pipeline (async with LLM fallback).
 * Returns the normalized color string or null.
 */
async function _normalizeColorAsync(value) {
  // Step 1: Garbage Detection
  if (isGarbageColor(value)) return null;

  const raw = String(value).trim();

  // Step 2: Exact Match
  const exact = exactMatch(raw, VALID_COLORS);
  if (exact) return exact;

  // Step 3: Pre-processing
  const preprocessed = preprocessColor(raw);
  if (!preprocessed) return null;

  // Re-check exact match after preprocessing
  const exactAfterPreprocess = exactMatch(preprocessed, VALID_COLORS);
  if (exactAfterPreprocess) return exactAfterPreprocess;

  // Step 4: Synonym Dictionary
  const synonym = synonymLookup(preprocessed, COLOR_SYNONYMS);
  if (synonym) return synonym;

  // Also try original value in synonyms
  const synonymOriginal = synonymLookup(raw, COLOR_SYNONYMS);
  if (synonymOriginal) return synonymOriginal;

  // Step 5: Fuzzy Match
  const fuzzy = fuzzyMatch(preprocessed, colorFuse, 0.35);
  if (fuzzy) return fuzzy;

  // Step 6: RGB Nearest Color
  const rgbNearest = rgbNearestColor(preprocessed);
  if (rgbNearest) return rgbNearest;

  // Step 7: LLM Fallback
  const llmResult = await llmFallback(raw, 'color', VALID_COLORS);
  if (llmResult) return llmResult;

  // Step 8: Return null (needs_review)
  return null;
}

/**
 * Normalize a color (sync version, skips LLM step).
 */
function _normalizeColorSync(value) {
  // Step 1: Garbage Detection
  if (isGarbageColor(value)) return null;

  const raw = String(value).trim();

  // Step 2: Exact Match
  const exact = exactMatch(raw, VALID_COLORS);
  if (exact) return exact;

  // Step 3: Pre-processing
  const preprocessed = preprocessColor(raw);
  if (!preprocessed) return null;

  // Re-check exact match after preprocessing
  const exactAfterPreprocess = exactMatch(preprocessed, VALID_COLORS);
  if (exactAfterPreprocess) return exactAfterPreprocess;

  // Step 4: Synonym Dictionary
  const synonym = synonymLookup(preprocessed, COLOR_SYNONYMS);
  if (synonym) return synonym;

  const synonymOriginal = synonymLookup(raw, COLOR_SYNONYMS);
  if (synonymOriginal) return synonymOriginal;

  // Step 5: Fuzzy Match
  const fuzzy = fuzzyMatch(preprocessed, colorFuse, 0.35);
  if (fuzzy) return fuzzy;

  // Step 6: RGB Nearest Color
  const rgbNearest = rgbNearestColor(preprocessed);
  if (rgbNearest) return rgbNearest;

  // Skip Step 7 (LLM) in sync version
  // Step 8: Return null
  return null;
}

/**
 * Normalize a size value through the 8-step pipeline (async with LLM fallback).
 * Returns the normalized size string or null.
 */
async function _normalizeSizeAsync(value) {
  // Step 1: Garbage Detection
  if (isGarbageSize(value)) return null;

  const raw = String(value).trim();

  // Step 2: Exact Match
  const exact = exactMatch(raw, VALID_SIZES);
  if (exact) return exact;

  // Step 3: Pre-processing
  const preprocessed = preprocessSize(raw);
  if (!preprocessed) return null;

  // Re-check exact match after preprocessing
  const exactAfterPreprocess = exactMatch(preprocessed, VALID_SIZES);
  if (exactAfterPreprocess) return exactAfterPreprocess;

  // Step 4: Synonym Dictionary
  const synonym = synonymLookup(preprocessed, SIZE_SYNONYMS);
  if (synonym) return synonym;

  // Also try original value
  const synonymOriginal = synonymLookup(raw, SIZE_SYNONYMS);
  if (synonymOriginal) return synonymOriginal;

  // Step 5: Fuzzy Match
  const fuzzy = fuzzyMatch(preprocessed, sizeFuse, 0.3);
  if (fuzzy) return fuzzy;

  // Step 6: Skip (RGB only for colors)

  // Step 7: LLM Fallback
  const llmResult = await llmFallback(raw, 'size', VALID_SIZES);
  if (llmResult) return llmResult;

  // Step 8: Return null
  return null;
}

/**
 * Normalize a size (sync version, skips LLM step).
 */
function _normalizeSizeSync(value) {
  // Step 1: Garbage Detection
  if (isGarbageSize(value)) return null;

  const raw = String(value).trim();

  // Step 2: Exact Match
  const exact = exactMatch(raw, VALID_SIZES);
  if (exact) return exact;

  // Step 3: Pre-processing
  const preprocessed = preprocessSize(raw);
  if (!preprocessed) return null;

  // Re-check exact match after preprocessing
  const exactAfterPreprocess = exactMatch(preprocessed, VALID_SIZES);
  if (exactAfterPreprocess) return exactAfterPreprocess;

  // Step 4: Synonym Dictionary
  const synonym = synonymLookup(preprocessed, SIZE_SYNONYMS);
  if (synonym) return synonym;

  const synonymOriginal = synonymLookup(raw, SIZE_SYNONYMS);
  if (synonymOriginal) return synonymOriginal;

  // Step 5: Fuzzy Match
  const fuzzy = fuzzyMatch(preprocessed, sizeFuse, 0.3);
  if (fuzzy) return fuzzy;

  // Skip Steps 6 & 7
  // Step 8: Return null
  return null;
}

/**
 * Normalize an array of size values (async with LLM fallback).
 * Returns { normalized: string[], unmatched: string[] }
 */
async function _normalizeSizesArrayAsync(sizes) {
  if (!Array.isArray(sizes) || sizes.length === 0) {
    return { normalized: [], unmatched: [] };
  }

  const normalized = [];
  const unmatched = [];

  for (const size of sizes) {
    const result = await _normalizeSizeAsync(size);
    if (result) {
      // Avoid duplicates
      if (!normalized.includes(result)) {
        normalized.push(result);
      }
    } else if (size && String(size).trim()) {
      unmatched.push(String(size).trim());
    }
  }

  return { normalized, unmatched };
}

/**
 * Normalize an array of size values (sync version).
 */
function _normalizeSizesArraySync(sizes) {
  if (!Array.isArray(sizes) || sizes.length === 0) {
    return { normalized: [], unmatched: [] };
  }

  const normalized = [];
  const unmatched = [];

  for (const size of sizes) {
    const result = _normalizeSizeSync(size);
    if (result) {
      if (!normalized.includes(result)) {
        normalized.push(result);
      }
    } else if (size && String(size).trim()) {
      unmatched.push(String(size).trim());
    }
  }

  return { normalized, unmatched };
}

/**
 * Normalize fit_details (materials/fabric) through 8-step pipeline (async).
 * Returns the normalized material string or null.
 */
async function _normalizeFitDetailsAsync(value) {
  // Step 1: Garbage Detection
  if (isGarbageFitDetails(value)) return null;

  const raw = String(value).trim();

  // Step 2: Exact Match
  const exact = exactMatch(raw, VALID_MATERIALS);
  if (exact) return exact;

  // Step 3: Pre-processing (minimal for materials)
  let preprocessed = raw;
  // Extract first material mentioned if comma-separated
  preprocessed = preprocessed.split(/[,;]/)[0].trim();
  // Remove percentage numbers (e.g., "100% Cotton" → "Cotton")
  preprocessed = preprocessed.replace(/\d+%\s*/g, '').trim();

  if (!preprocessed) return null;

  // Re-check exact match
  const exactAfterPreprocess = exactMatch(preprocessed, VALID_MATERIALS);
  if (exactAfterPreprocess) return exactAfterPreprocess;

  // Step 4: Synonym Dictionary (materials don't have extensive synonyms)
  // Common material mappings
  const materialSynonyms = {
    denim: 'Cotton',
    fleece: 'Polyester',
    terry: 'Cotton',
    jersey: 'Polyester',
    'satin': 'Polyester',
    'lace': 'Nylon',
    'canvas': 'Cotton',
    'suiting': 'Wool',
    'woven straw': 'Linen',
    'elastane': 'Spandex',
    'lycra': 'Spandex',
  };
  const synonym = synonymLookup(preprocessed, materialSynonyms);
  if (synonym) return synonym;

  // Step 5: Fuzzy Match
  const fuzzy = fuzzyMatch(preprocessed, materialFuse, 0.4);
  if (fuzzy) return fuzzy;

  // Step 6: Skip (RGB for colors only)

  // Step 7: LLM Fallback
  const llmResult = await llmFallback(raw, 'material', VALID_MATERIALS);
  if (llmResult) return llmResult;

  // Step 8: Return null
  return null;
}

/**
 * Normalize fit_details (sync version, skips LLM step).
 */
function _normalizeFitDetailsSync(value) {
  // Step 1: Garbage Detection
  if (isGarbageFitDetails(value)) return null;

  const raw = String(value).trim();

  // Step 2: Exact Match
  const exact = exactMatch(raw, VALID_MATERIALS);
  if (exact) return exact;

  // Step 3: Pre-processing
  let preprocessed = raw;
  preprocessed = preprocessed.split(/[,;]/)[0].trim();
  preprocessed = preprocessed.replace(/\d+%\s*/g, '').trim();

  if (!preprocessed) return null;

  const exactAfterPreprocess = exactMatch(preprocessed, VALID_MATERIALS);
  if (exactAfterPreprocess) return exactAfterPreprocess;

  // Step 4: Synonym Dictionary
  const materialSynonyms = {
    denim: 'Cotton',
    fleece: 'Polyester',
    terry: 'Cotton',
    jersey: 'Polyester',
    'satin': 'Polyester',
    'lace': 'Nylon',
    'canvas': 'Cotton',
    'suiting': 'Wool',
    'woven straw': 'Linen',
    'elastane': 'Spandex',
    'lycra': 'Spandex',
  };
  const synonym = synonymLookup(preprocessed, materialSynonyms);
  if (synonym) return synonym;

  // Step 5: Fuzzy Match
  const fuzzy = fuzzyMatch(preprocessed, materialFuse, 0.4);
  if (fuzzy) return fuzzy;

  // Skip Steps 6 & 7
  // Step 8: Return null
  return null;
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

// Primary exports: sync versions (faster, no LLM)
// These are what index.js expects
export {
  _normalizeColorSync as normalizeColor,
  _normalizeSizeSync as normalizeSize,
  _normalizeSizesArraySync as normalizeSizesArray,
  _normalizeFitDetailsSync as normalizeFitDetails,
};

// Async exports: include LLM fallback (Step 7)
// Use these when you want maximum normalization coverage
export {
  _normalizeColorAsync as normalizeColorAsync,
  _normalizeSizeAsync as normalizeSizeAsync,
  _normalizeSizesArrayAsync as normalizeSizesArrayAsync,
  _normalizeFitDetailsAsync as normalizeFitDetailsAsync,
};
