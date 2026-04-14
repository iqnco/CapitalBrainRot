/**
 * Run once to pre-generate all operator chibis and cache them to public/chibis/.
 * Usage: node scripts/generate-all-chibis.mjs
 * Requires the dev server to be running on localhost:3000.
 */

const OPERATORS = [
  'ash', 'doc', 'blitz', 'caveira', 'tachanka',
  'mozzie', 'deimos', 'dokkaebi', 'thunderbird', 'warden',
];

for (const op of OPERATORS) {
  process.stdout.write(`Generating ${op}... `);
  try {
    const res = await fetch('http://localhost:3000/api/generate-chibi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: op }),
    });
    const data = await res.json();
    if (data.url) {
      console.log('✓ cached');
    } else {
      console.log(`✗ error: ${data.error}`);
    }
  } catch (err) {
    console.log(`✗ failed: ${err.message}`);
  }
}

console.log('\nDone. Chibis saved to public/chibis/');
