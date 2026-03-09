import 'dotenv/config';
import { ApifyClient } from 'apify-client';
import fs from 'fs';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const APIFY_TOKEN = process.env.APIFY_TOKEN;
if (!APIFY_TOKEN) {
  throw new Error('Missing APIFY_TOKEN environment variable');
}

const client = new ApifyClient({ token: APIFY_TOKEN });

// ─── RETAILER START URLs ─────────────────────────────────────────────────────

const START_URLS = [
  // Anthropologie — Clothing
  { url: 'https://www.anthropologie.com/clothes?attributionProductType=Dresses,Jackets+%26+Coats,Jeans,Pants,Jumpsuits+%26+Rompers,Tops,Sweatshirts,Sweaters,Shorts,Skirts,Socks+%26+Tights&brand=AGOLDE,AFRM,ASTR+The+Label,Avec+Les+Filles,Bardot,BLANKNYC,By+Anthropologie,Citizens+of+Humanity,DIARRABLU,Essentiel+Antwerp,Derek+Lam+10+Crosby,English+Factory,Farm+Rio,Good+American,Maeve,PAIGE,Theory,Pilcro,Reformation,Ronny+Kobo,SIMONMILLER,SER.O.YA,Helsi,Levi\'s&sort=tile.product.newestColorDate&order=Descending' },

  // Anthropologie — Shoes
  { url: 'https://www.anthropologie.com/shop-all-shoes?sort=tile.product.newestColorDate&order=Descending&brand=ASICS,Birkenstock,Circus+NY+by+Sam+Edelman,Dr.+Martens,Frye,UGG,Jeffrey+Campbell,Reformation,Sam+Edelman,Teva,SIMONMILLER,Schutz,New+Balance,Farm+Rio' },

  // Anthropologie — Accessories
  { url: 'https://www.anthropologie.com/accessories?attributionProductType=Belts,Earrings,Eyewear,Bracelets,Bags,Necklaces,Socks+%26+Tights,Rings,Scarves,Hats&sort=tile.product.newestColorDate&order=Descending' },

  // Shopbop — Clothing
  { url: 'https://www.shopbop.com/clothing/br/v=1/13266.htm?md=brandCodeToBrandName-PHLII_3.1+Phillip+Lim&md=brandCodeToBrandName-ALCCC_A.L.C.&md=brandCodeToBrandName-AWAKE_A.W.A.K.E.+MODE&md=brandCodeToBrandName-ACNDB_Acne+Studios&md=brandCodeToBrandName-ADDAS_adidas&md=brandCodeToBrandName-AFRMM_AFRM&md=brandCodeToBrandName-AGOLE_AGOLDE&md=brandCodeToBrandName-AKNVA_AKNVAS&md=brandCodeToBrandName-ALXIS_ALEXIS&md=brandCodeToBrandName-ALICE_alice+%2B+olivia&md=brandCodeToBrandName-ALOHA_ALOHAS&md=brandCodeToBrandName-ANDRI_Andrea+Iyamah&md=brandCodeToBrandName-ANINE_ANINE+BING&md=brandCodeToBrandName-ASTRR_ASTR+the+Label&md=brandCodeToBrandName-AFILL_Avec+Les+Filles&md=brandCodeToBrandName-BLANK_BLANKNYC&md=brandCodeToBrandName-CINQA_Cinq+à+Sept&md=brandCodeToBrandName-CITIZ_Citizens+of+Humanity&md=brandCodeToBrandName-CULTG_Cult+Gaia&md=brandCodeToBrandName-DIARR_DIARRABLU&md=brandCodeToBrandName-EFACT_English+Factory&md=brandCodeToBrandName-ESSEN_ESSENTIEL+ANTWERP&md=brandCodeToBrandName-FARMR_FARM+Rio&md=brandCodeToBrandName-FNOEL_Fe+Noel&md=brandCodeToBrandName-FREEP_Free+People&md=brandCodeToBrandName-GANNI_GANNI&md=brandCodeToBrandName-GAMER_Good+American&md=brandCodeToBrandName-HALFB_HALFBOY&md=brandCodeToBrandName-HOMME_HOMMEGIRLS&md=brandCodeToBrandName-JCQUE_Jacquemus&md=brandCodeToBrandName-JLSAN_Jil+Sander&md=brandCodeToBrandName-JANDE_JW+Anderson&md=brandCodeToBrandName-KITRI_KITRI&md=brandCodeToBrandName-LIONE_Lioness&md=brandCodeToBrandName-MADEW_Madewell&md=brandCodeToBrandName-MJADB_Marc+Jacobs&md=brandCodeToBrandName-MARQU_Marques\'Almeida&md=brandCodeToBrandName-NIKEE_Nike&md=brandCodeToBrandName-PDENI_PAIGE&md=brandCodeToBrandName-RTHIR_R13&md=brandCodeToBrandName-RACHC_Rachel+Comey&md=brandCodeToBrandName-REDON_RE%2FDONE&md=brandCodeToBrandName-RMINK_Rebecca+Minkoff&md=brandCodeToBrandName-REFOR_Reformation&md=brandCodeToBrandName-RONNY_Ronny+Kobo&md=brandCodeToBrandName-SAMIM_Sami+Miro+Vintage&md=brandCodeToBrandName-SIMIL_SIMONMILLER&md=brandCodeToBrandName-STAUD_STAUD&md=brandCodeToBrandName-SGOYA_Stine+Goya&md=brandCodeToBrandName-THEOR_Theory&md=brandCodeToBrandName-TIBDB_Tibi&md=brandCodeToBrandName-ULLAJ_Ulla+Johnson&md=brandCodeToBrandName-VBEAR_Veronica+Beard&md=brandCodeToBrandName-VBEAC_Veronica+Beard+Jean&md=brandCodeToBrandName-WARDR_WARDROBE.NYC&md=brandCodeToBrandName-ZSUPP_Z+Supply&md=brandCodeToBrandName-ZIMME_Zimmermann&my-designers=1' },

  // Shopbop — Shoes
  { url: 'https://www.shopbop.com/shoes/br/v=1/13438.htm?md=brandCodeToBrandName-PHLII_3.1+Phillip+Lim&md=brandCodeToBrandName-AWAKE_A.W.A.K.E.+MODE&md=brandCodeToBrandName-ASICS_ACICS&md=brandCodeToBrandName-ACNDB_Acne+Studios&md=brandCodeToBrandName-ADDAS_adidas&md=brandCodeToBrandName-AEYDE_AEYDE&md=brandCodeToBrandName-ALXIS_ALEXIS&md=brandCodeToBrandName-ALOHA_ALOHAS&md=brandCodeToBrandName-ANINE_ANINE+BING&md=brandCodeToBrandName-AQUDB_Aquazzura&md=brandCodeToBrandName-ASICS_Asics&md=brandCodeToBrandName-BIRKE_Birkenstock&md=brandCodeToBrandName-CINQA_Cinq+à+Sept&md=brandCodeToBrandName-CULTG_Cult+Gaia&md=brandCodeToBrandName-DRMAR_Dr.+Martens&md=brandCodeToBrandName-FARMR_FARM+Rio&md=brandCodeToBrandName-FREEP_Free+People&md=brandCodeToBrandName-GANNI_GANNI&md=brandCodeToBrandName-JLSAN_Jil+Sander&md=brandCodeToBrandName-JANDE_JW+Anderson&md=brandCodeToBrandName-LARRO_Larroudé&md=brandCodeToBrandName-MADEW_Madewell&md=brandCodeToBrandName-MJADB_Marc+Jacobs&md=brandCodeToBrandName-NWBAL_New+Balance&md=brandCodeToBrandName-NIKEE_Nike&md=brandCodeToBrandName-RTHIR_R13&md=brandCodeToBrandName-RACHC_Rachel+Comey&md=brandCodeToBrandName-REFOR_Reformation&md=brandCodeToBrandName-SAMED_Sam+Edelman&md=brandCodeToBrandName-SCHUT_Schutz&md=brandCodeToBrandName-SIMIL_SIMONMILLER&md=brandCodeToBrandName-SOREL_Sorel&md=brandCodeToBrandName-STAUD_STAUD&md=brandCodeToBrandName-STUAR_Stuart+Weitzman&md=brandCodeToBrandName-TOBIA_Tony+Bianco&md=brandCodeToBrandName-TORYB_Tory+Burch&md=brandCodeToBrandName-ULLAJ_Ulla+Johnson&md=brandCodeToBrandName-VBEAR_Veronica+Beard&md=brandCodeToBrandName-ZIMME_Zimmermann&my-designers=1' },

  // Shopbop — Accessories
  { url: 'https://www.shopbop.com/jewelry-accessories/br/v=1/13539.htm?md=brandCodeToBrandName-ALCCC_A.L.C.&md=brandCodeToBrandName-ACNDB_Acne+Studios&md=brandCodeToBrandName-ANINE_ANINE+BING&md=brandCodeToBrandName-CHLSN_Chloé&md=brandCodeToBrandName-CULTG_Cult+Gaia&md=brandCodeToBrandName-DMRSN_DEMARSON&md=brandCodeToBrandName-DVNOT_Dries+Van+Noten&md=brandCodeToBrandName-GANNI_GANNI&md=brandCodeToBrandName-GAMER_Good+American&md=brandCodeToBrandName-HOMME_HOMMEGIRLS&md=brandCodeToBrandName-JCQUE_Jacquemus&md=brandCodeToBrandName-JLSAN_Jil+Sander&md=brandCodeToBrandName-JANDE_JW+Anderson&md=brandCodeToBrandName-KJLAN_Kenneth+Jay+Lane&md=brandCodeToBrandName-KREWE_Krewe&md=brandCodeToBrandName-LELES_Lele+Sadoughi&md=brandCodeToBrandName-LIZIE_Lizzie+Fortunato&md=brandCodeToBrandName-MADEW_Madewell&md=brandCodeToBrandName-MJADB_Marc+Jacobs&md=brandCodeToBrandName-NIKEE_Nike&md=brandCodeToBrandName-RTHIR_R13&md=brandCodeToBrandName-RACHC_Rachel+Comey&md=brandCodeToBrandName-RONNY_Ronny+Kobo&md=brandCodeToBrandName-SIMIL_SIMONMILLER&md=brandCodeToBrandName-STAUD_STAUD&md=brandCodeToBrandName-TIBDB_Tibi&md=brandCodeToBrandName-TORYB_Tory+Burch&md=brandCodeToBrandName-ULLAJ_Ulla+Johnson&md=brandCodeToBrandName-WARDR_WARDROBE.NYC&md=brandCodeToBrandName-ZIMME_Zimmermann&my-designers=1' },

  // Revolve — Clothing
  { url: 'https://www.revolve.com/clothing/br/3699fc/?navsrc=main&sortBy=newest&designer=A.L.C.&designer=adidas by Stella McCartney&designer=AFRM&designer=AGOLDE&designer=AKNVAS&designer=Alexis&designer=Alice %2B Olivia&designer=ALLSAINTS&designer=Andrea Iyamah&designer=ANINE BING&designer=ASTR the Label&designer=BLANKNYC&designer=Cinq a Sept&designer=Citizens of Humanity&designer=Cult Gaia&designer=Free People&designer=Ganni&designer=Good American&designer=LIONESS&designer=PAIGE&designer=PH5&designer=Ronny Kobo&designer=SAMI MIRO VINTAGE&designer=SIMONMILLER&designer=Theory&designer=Zimmermann&filters=designer' },

  // Revolve — Shoes
  { url: 'https://www.revolve.com/shoes/br/3f40a9/?navsrc=main&designer=adidas Originals&designer=Alexander Wang&designer=Asics&designer=Camper&designer=Cult Gaia&designer=Dr. Martens&designer=Jeffrey Campbell&designer=Miista&designer=New Balance&designer=Nike&designer=RAYE&designer=Sam Edelman&designer=Schutz&designer=Stuart Weitzman&designer=Tony Bianco&designer=UGG&designer=Zimmermann&filters=designer' },

  // Free People — Shoes
  { url: 'https://www.freepeople.com/shoes/?brand=Vagabond+Shoemakers,New+Balance,Miista,Dr.+Martens,Camper,Jeffrey+Campbell,G.H.+Bass,Hunter,Birkenstock,E8+by+Miista&sort=tile.product.newestColorDate&order=Descending' },

  // Neiman Marcus — Accessories
  { url: 'https://www.neimanmarcus.com/c/jewelry-accessories-all-jewelry-accessories-cat84890760?designer=Cult+Gaia|DEMARSON|JW+Anderson|Jacquemus|KREWE|Kenneth+Jay+Lane|Lele+Sadoughi|Linda+Farrow|Lizzie+Fortunato|Mignonne+Gavigan&navpath=cat000000_cat4870731&page=1&sortBy=NEWEST_FIRST' },

  // Neiman Marcus — Clothing
  { url: 'https://www.neimanmarcus.com/c/womens-clothing-cat58290731?designer=A.L.C.|Alice+%2B+Olivia|Cult+Gaia|Essentiel+Antwerp|Ganni|JW+Anderson|Jacquemus|PAIGE|PH5|Thom+Browne|Veronica+Beard|Zimmermann&navpath=cat000000_cat000001&page=1&sortBy=NEWEST_FIRST' },
];

// ─── ACTOR CONFIG (matching your screenshot) ─────────────────────────────────

const ACTOR_ID = 'apify/e-commerce-scraping-tool';

function buildActorInput(startUrls) {
  return {
    scrapeMode: 'AUTO',
    additionalProperties: true,
    listingUrls: startUrls.map((u) => ({ url: u.url })),
  };
}

// ─── RUN A SINGLE SCRAPE ─────────────────────────────────────────────────────

async function runScrape(urls, label) {
  const input = buildActorInput(urls);

  console.log(`\n🚀 Starting scrape: ${label} (${urls.length} URLs)`);
  console.log('   Calling actor:', ACTOR_ID);

  const run = await client.actor(ACTOR_ID).call(input, {
    memory: 1024,       // 1 GB — matches your screenshot
    timeout: 300,       // 300 seconds — matches your screenshot
    maxItems: undefined,
  });

  console.log(`   Run ID: ${run.id}`);
  console.log(`   Status: ${run.status}`);
  console.log(`   Dataset ID: ${run.defaultDatasetId}`);

  if (run.status !== 'SUCCEEDED') {
    console.error(`   ⚠️  Run did not succeed. Status: ${run.status}`);
    return null;
  }

  // Fetch results count
  const dataset = client.dataset(run.defaultDatasetId);
  const { items } = await dataset.listItems({ limit: 0 });
  console.log(`   ✅ Scrape complete — dataset has items ready`);

  return run.defaultDatasetId;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('APIFY E-COMMERCE SCRAPER — Automated Run');
  console.log('='.repeat(60));
  console.log(`URLs to scrape: ${START_URLS.length}`);
  console.log(`Actor: ${ACTOR_ID}`);
  console.log(`Memory: 1024 MB | Timeout: 300s | Max cost: $4.00`);
  console.log('='.repeat(60));

  // Run all URLs in a single actor call
  const datasetId = await runScrape(START_URLS, 'All Retailers');

  if (!datasetId) {
    console.error('\n❌ Scrape failed. No dataset produced.');
    process.exit(1);
  }

  // Save the dataset ID to .env for the normalize pipeline
  const envPath = new URL('.env', import.meta.url).pathname;
  let envContent = fs.readFileSync(envPath, 'utf-8');
  envContent = envContent.replace(
    /APIFY_DATASET_ID=.*/,
    `APIFY_DATASET_ID=${datasetId}`,
  );
  fs.writeFileSync(envPath, envContent);

  console.log('\n' + '='.repeat(60));
  console.log(`✅ SCRAPE COMPLETE`);
  console.log(`   Dataset ID: ${datasetId}`);
  console.log(`   Saved to .env as APIFY_DATASET_ID`);
  console.log('');
  console.log('   Next step: run "node index.js" to normalize & sync to Supabase');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
