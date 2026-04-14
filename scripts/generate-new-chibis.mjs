/**
 * Generates pixel-art chibi sprites for new operators using DALL-E 3.
 * Run once — saves PNGs to public/chibis/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const apiKey = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
if (!apiKey) { console.error('No OPENAI_API_KEY in .env.local'); process.exit(1); }

const OUT_DIR = path.join(__dirname, '..', 'public', 'chibis');

const STYLE = [
  'Retro 16-bit SNES-era pixel art sprite.',
  'Chibi proportions: large head taking up roughly 50% of total body height, small body, big expressive eyes.',
  'Full body standing upright, centered in frame, fills most of the image.',
  'Pixel grid art style: flat bold pixel colors, crisp hard pixel edges, blocky pixel shading, limited palette of ~32 colors, zero gradients, zero anti-aliasing.',
  'Plain solid white background — no shadow, no ground, nothing else in frame.',
  'No text, no UI overlays, no labels.',
  'Same consistent retro game sprite style as all other characters in this set.',
].join(' ');

const OPERATORS = [
  {
    id: 'sledge',
    prompt: `${STYLE} Rainbow Six Siege operator SLEDGE: large muscular British SAS soldier, red beret, thick brown beard, dark olive-green military tactical outfit with chest plate armor and utility pouches, knee pads, combat boots. Holding a large heavy sledgehammer (his signature breaching tool) in both hands. Stocky powerful build.`,
  },
  {
    id: 'jager',
    prompt: `${STYLE} Rainbow Six Siege operator JÄGER: lean German GSG9 mechanic-soldier, wearing a dark grey/black tactical flight suit with orange shoulder patches, military helmet with distinctive yellow-tinted aviator goggles pushed up on forehead, chest rig. Holding a G36C assault rifle. Has a slightly smug expression. Slim athletic build.`,
  },
  {
    id: 'valkyrie',
    prompt: `${STYLE} Rainbow Six Siege operator VALKYRIE: Black female US Navy SEAL operator, short natural dark hair, dark grey/black tactical vest over long-sleeve shirt, knee pads, utility belt with small cameras clipped to it. Holding an MP5K submachine gun. Confident stance, athletic build.`,
  },
  {
    id: 'hibana',
    prompt: `${STYLE} Rainbow Six Siege operator HIBANA: Japanese female SAT operator, long straight black hair, dark tactical suit with bright orange and gold geometric accents on shoulders and chest, armored vest with kanji patch. Holding a Type-89 assault rifle. Slender build, determined expression.`,
  },
  {
    id: 'ela',
    prompt: `${STYLE} Rainbow Six Siege operator ELA: Polish GROM female operator, dark hair with shaved undercut on sides, dark tactical outfit in black and dark teal/grey, asymmetric armored vest, knee pads, combat boots. Holding a Scorpion EVO 3 SMG. Slim athletic build, slightly rebellious look.`,
  },
  {
    id: 'thermite',
    prompt: `${STYLE} Rainbow Six Siege operator THERMITE: Black male FBI SWAT operator, dark navy blue tactical uniform, chest rig vest with orange-marked breaching charge canisters strapped to it, helmet with visor up, utility pouches. Holding a 556XI assault rifle. Athletic build, focused expression.`,
  },
  {
    id: 'kapkan',
    prompt: `${STYLE} Rainbow Six Siege operator KAPKAN: Large Russian FSB operator, full dark grey balaclava covering face, heavy olive-drab military jacket with fur-lined collar, chest pouches and EDD mines on belt, dark pants and heavy boots. Holding a 9x19VSN submachine gun. Bear-like stocky powerful build.`,
  },
  {
    id: 'rook',
    prompt: `${STYLE} Rainbow Six Siege operator ROOK: French GIGN operator, dark navy/black tactical uniform, distinctive chest rig loaded with extra armor plates (his signature backpack of armor), beret or helmet, calm expression. Holding an MP5 submachine gun. Average athletic build, reliable steady demeanor.`,
  },
];

async function generateSprite(op) {
  const outPath = path.join(OUT_DIR, `${op.id}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`⏭  ${op.id}.png already exists — skipping`);
    return;
  }

  console.log(`🎨 Generating ${op.id}...`);

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: op.prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error(`  ✗ ${op.id} failed:`, err.error?.message ?? err);
    return;
  }

  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) { console.error(`  ✗ ${op.id}: no image data`); return; }

  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
  console.log(`  ✓ saved ${op.id}.png`);
}

// Generate one at a time to avoid rate limits
for (const op of OPERATORS) {
  await generateSprite(op);
}

console.log('\nDone. Add new operator IDs to OPERATOR_META and OPERATOR_IDS in quiz/page.tsx');
