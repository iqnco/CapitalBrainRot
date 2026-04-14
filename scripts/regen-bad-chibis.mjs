/**
 * Regenerates the 5 chibi sprites that had generation artifacts.
 * Deletes the bad files first so the skip-check doesn't apply.
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
  'EXACTLY ONE CHARACTER in the entire image — a single chibi soldier standing upright, centered.',
  'Chibi proportions: large head taking up roughly 50% of total body height, small body, big expressive eyes.',
  'Full body standing upright, centered in frame, fills most of the image.',
  'Pixel grid art style: flat bold pixel colors, crisp hard pixel edges, blocky pixel shading, limited palette of ~32 colors, zero gradients, zero anti-aliasing.',
  'Pure solid white background — no shadow, no ground, no floor, nothing else in frame.',
  'NO text, NO labels, NO UI chrome, NO color palette panels, NO sprite editor interface, NO thumbnails, NO multiple sprites, NO sprite sheets.',
  'Just the single character sprite on a white background. Nothing else.',
].join(' ');

const OPERATORS = [
  {
    id: 'ela',
    prompt: `${STYLE} Rainbow Six Siege operator ELA: single Polish GROM female soldier, dark hair with undercut shaved sides, black tactical outfit with dark teal shoulder accents, asymmetric armored vest, knee pads, combat boots. Holding a Scorpion EVO 3 SMG. Slim athletic build, rebellious expression. ONE character only.`,
  },
  {
    id: 'valkyrie',
    prompt: `${STYLE} Rainbow Six Siege operator VALKYRIE: single Black female US Navy SEAL, short natural dark hair, dark grey tactical vest over long-sleeve shirt, knee pads, utility belt with small camera canisters clipped to it. Holding an MP5K submachine gun. Confident stance, athletic build. ONE character only.`,
  },
  {
    id: 'hibana',
    prompt: `${STYLE} Rainbow Six Siege operator HIBANA: single Japanese female SAT soldier, long straight black hair, dark tactical suit with bright orange and gold geometric shoulder accents, armored chest vest. Holding a Type-89 assault rifle. Slender build, determined expression. ONE character only.`,
  },
  {
    id: 'thermite',
    prompt: `${STYLE} Rainbow Six Siege operator THERMITE: single Black male FBI SWAT soldier, dark navy blue tactical uniform, chest rig vest with orange-colored breaching charge canisters attached, helmet with visor up, utility pouches on belt. Holding a 556XI assault rifle. Athletic build, focused expression. ONE character only.`,
  },
  {
    id: 'rook',
    prompt: `${STYLE} Rainbow Six Siege operator ROOK: single French GIGN male soldier, dark navy tactical uniform, distinctive chest rig loaded with extra armor plates (his signature extra-armor backpack visible), beret on head. Holding an MP5 submachine gun. Average athletic build, calm reliable look. ONE character only, pure white background.`,
  },
];

async function generateSprite(op) {
  const outPath = path.join(OUT_DIR, `${op.id}.png`);

  // Force delete the bad file
  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
    console.log(`🗑  Deleted old ${op.id}.png`);
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

for (const op of OPERATORS) {
  await generateSprite(op);
  // Small delay to avoid rate limits
  await new Promise(r => setTimeout(r, 1000));
}

console.log('\nDone. Review the new sprites before wiring into quiz/page.tsx');
