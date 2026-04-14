/**
 * One-time build script: tags every question in questions.json with its chapter.
 * Run once → questions.json gets a "chapter" field on every entry → no runtime AI needed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Read API key from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKey = envContent.match(/ANTHROPIC_API_KEY=(.+)/)?.[1]?.trim();
if (!apiKey) { console.error('No ANTHROPIC_API_KEY in .env.local'); process.exit(1); }

const BANK_PATH = path.join(__dirname, '..', 'content', 'missions', 'ob-final', 'questions.json');
const questions = JSON.parse(fs.readFileSync(BANK_PATH, 'utf-8'));

const CHAPTERS = `CH2  = Diversity in Organizations
CH9  = Foundations of Group Behavior
CH10 = Understanding Work Teams
CH12 = Leadership
CH13 = Power and Politics
CH14 = Conflict and Negotiation
CH16 = Organizational Culture`;

const client = new Anthropic({ apiKey });

async function tagBatch(batch, startIndex) {
  const numbered = batch
    .map((q, i) => `${startIndex + i + 1}. ${q.question}`)
    .join('\n');

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Classify each Organizational Behavior exam question into exactly one chapter.

Chapters:
${CHAPTERS}

Return ONLY a JSON array of chapter IDs in the same order, e.g. ["CH10","CH12","CH9",...].
No explanation, no markdown — raw JSON array only.

Questions:
${numbered}`,
    }],
  });

  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`Bad response for batch starting at ${startIndex}: ${raw}`);
  return JSON.parse(match[0]);
}

const BATCH_SIZE = 40;
const allTags = [];

for (let i = 0; i < questions.length; i += BATCH_SIZE) {
  const batch = questions.slice(i, i + BATCH_SIZE);
  console.log(`Tagging questions ${i + 1}–${i + batch.length}...`);
  const tags = await tagBatch(batch, i);
  if (tags.length !== batch.length) {
    console.warn(`  ⚠ got ${tags.length} tags for ${batch.length} questions — filling remainder with CH2`);
    while (tags.length < batch.length) tags.push('CH2');
  }
  allTags.push(...tags);
}

const tagged = questions.map((q, i) => ({ ...q, chapter: allTags[i] ?? 'CH2' }));

// Show distribution
const dist = {};
tagged.forEach(q => { dist[q.chapter] = (dist[q.chapter] ?? 0) + 1; });
console.log('\nChapter distribution:');
Object.entries(dist).sort().forEach(([ch, n]) => console.log(`  ${ch}: ${n} questions`));

fs.writeFileSync(BANK_PATH, JSON.stringify(tagged, null, 2));
console.log(`\n✓ Tagged ${tagged.length} questions → questions.json updated`);
