/**
 * Third attempt at ela, valkyrie, hibana — explicit anti-artifact prompts.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const apiKey = envContent.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
if (!apiKey) { console.error('No OPENAI_API_KEY'); process.exit(1); }

const OUT_DIR = path.join(__dirname, '..', 'public', 'chibis');

const OPERATORS = [
  {
    id: 'ela',
    prompt: `A single 16-bit SNES pixel art chibi character sprite of Rainbow Six Siege operator ELA. Only one character in the image. Female Polish GROM soldier, dark undercut hair, black and dark teal tactical gear, asymmetric armored vest, Scorpion EVO SMG. Chibi style with large head, small body. Isolated on a flat pure white background. No grid lines, no border, no second character, no color swatches, no UI elements, no sprite sheet. Just one chibi soldier on white.`,
  },
  {
    id: 'valkyrie',
    prompt: `A single 16-bit SNES pixel art chibi character sprite of Rainbow Six Siege operator VALKYRIE. Only one character in the image. Black female Navy SEAL, short natural hair, dark grey tactical vest, camera canisters on belt, MP5K submachine gun. Chibi style with large head, small body. Isolated on a flat pure white background. No color palette, no swatches, no sidebar, no UI, no extra sprites. Just one chibi soldier centered on white.`,
  },
  {
    id: 'hibana',
    prompt: `A single 16-bit SNES pixel art chibi character sprite of Rainbow Six Siege operator HIBANA. Only one character in the image. Japanese female SAT soldier, long straight black hair, dark tactical suit with orange and gold geometric accents on shoulders, armored chest, Type-89 rifle. Chibi style with large head, small body. Isolated on a flat pure white background. No pixel grid overlay, no ground line, no floor tile, no second character. Just one chibi soldier floating on white.`,
  },
];

async function generateSprite(op) {
  const outPath = path.join(OUT_DIR, `${op.id}.png`);
  if (fs.existsSync(outPath)) { fs.unlinkSync(outPath); console.log(`🗑  Deleted ${op.id}.png`); }

  console.log(`🎨 Generating ${op.id}...`);

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
  await new Promise(r => setTimeout(r, 1000));
}
console.log('\nDone.');
