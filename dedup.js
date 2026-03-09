import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
);

const { data, error } = await supabase
  .from('raw_scraped_products')
  .select('id, product_url')
  .order('id', { ascending: true });

if (error) { console.error(error); process.exit(1); }
console.log('Total rows:', data.length);

const seen = new Map();
const dupeIds = [];
for (const row of data) {
  const key = row.product_url || String(row.id);
  if (seen.has(key)) {
    dupeIds.push(row.id);
  } else {
    seen.set(key, row.id);
  }
}
console.log('Duplicates to remove:', dupeIds.length);

if (dupeIds.length === 0) {
  console.log('No duplicates found.');
  process.exit(0);
}

for (let i = 0; i < dupeIds.length; i += 500) {
  const batch = dupeIds.slice(i, i + 500);
  const { error: delErr } = await supabase
    .from('raw_scraped_products')
    .delete()
    .in('id', batch);
  if (delErr) { console.error('Delete error:', delErr); process.exit(1); }
}

console.log('Deleted', dupeIds.length, 'duplicate rows. Remaining:', data.length - dupeIds.length);
