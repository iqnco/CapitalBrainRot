import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Maps operator IDs to their source render images in /public/chibis/
const OPERATOR_FILES: Record<string, { file: string; mime: string }> = {
  ash:         { file: 'ashop.webp',       mime: 'image/webp' },
  doc:         { file: 'docop.webp',       mime: 'image/webp' },
  blitz:       { file: 'blitzop.webp',     mime: 'image/webp' },
  caveira:     { file: 'caveiraop.webp',   mime: 'image/webp' },
  tachanka:    { file: 'tachankaop.jpg',   mime: 'image/jpeg' },
  mozzie:      { file: 'mozzieop.webp',    mime: 'image/webp' },
  deimos:      { file: 'deimosop.webp',    mime: 'image/webp' },
  dokkaebi:    { file: 'dokkabeiop.webp',  mime: 'image/webp' },
  thunderbird: { file: 'thunderbird.webp', mime: 'image/webp' },
  warden:      { file: 'wardenop.webp',    mime: 'image/webp' },
};

// Consistent pixel-art conversion prompt applied to every operator.
// The goal: identical art style across all 10 characters, character details preserved.
const PIXEL_ART_PROMPT =
  'Convert this Rainbow Six Siege operator into a retro 16-bit pixel art sprite. ' +
  'STRICT RULES — follow all of them exactly: ' +
  '(1) Preserve EVERYTHING about the character: face, hair, skin tone, outfit, colors, gear, weapons, pose, accessories — nothing about the character changes. ' +
  '(2) Only change the rendering style to 16-bit SNES-era pixel art: flat bold pixel colors, crisp hard pixel-grid edges, blocky pixel shading, limited palette of ~32 colors, no gradients, no anti-aliasing. ' +
  '(3) Chibi-ish proportions: large head (~50% of total height), small body, exaggerated big eyes, cute but instantly recognizable as the same operator. ' +
  '(4) Full-body sprite, character centered, standing upright, fills most of the frame. ' +
  '(5) Fully transparent background — no white box, no shadow, no ground plane, nothing behind the character. ' +
  '(6) No text, no UI, no labels of any kind. ' +
  'Every operator processed through this prompt must share the exact same pixel art style, color depth, and sprite resolution so they all look like they belong to the same game.';

const CACHE_DIR = path.join(process.cwd(), 'public', 'chibis');

export async function POST(req: NextRequest) {
  const { operator } = (await req.json()) as { operator: string };

  const entry = OPERATOR_FILES[operator];
  if (!entry) {
    return NextResponse.json({ error: `Unknown operator: ${operator}` }, { status: 400 });
  }

  // Return cached chibi if it already exists
  const cachePath = path.join(CACHE_DIR, `${operator}.png`);
  if (fs.existsSync(cachePath)) {
    const cached = fs.readFileSync(cachePath).toString('base64');
    return NextResponse.json({ url: `data:image/png;base64,${cached}` });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
  }

  const imagePath = path.join(process.cwd(), 'public', 'ops', entry.file);

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBlob = new Blob([imageBuffer], { type: entry.mime });

    const formData = new FormData();
    formData.append('image', imageBlob, entry.file);
    formData.append('prompt', PIXEL_ART_PROMPT);
    formData.append('model', 'gpt-image-1');
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    formData.append('background', 'transparent');

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('OpenAI image edit error:', err);
      return NextResponse.json({ error: err.error?.message ?? 'OpenAI error' }, { status: 500 });
    }

    const data = await res.json();
    const imageData = data.data?.[0];

    if (!imageData) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 });
    }

    // gpt-image-1 edits always returns b64_json — save to disk and return
    if (imageData.b64_json) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cachePath, Buffer.from(imageData.b64_json, 'base64'));
      return NextResponse.json({ url: `data:image/png;base64,${imageData.b64_json}` });
    }
    // Fallback: URL-based response (DALL-E 3 style) — can't cache a temp URL
    if (imageData.url) {
      return NextResponse.json({ url: imageData.url });
    }

    return NextResponse.json({ error: 'No image data in response' }, { status: 500 });
  } catch (err) {
    console.error('generate-chibi error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
