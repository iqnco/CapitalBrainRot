#!/usr/bin/env node
/**
 * Generates multiple-choice question banks for all missions.
 *
 * ob-final:   reads PNG screenshots per section → 3 MC questions each
 * ob-midterm: reads PDF → generates MC questions per text chunk
 *
 * Run: node scripts/generate-banks.mjs [--final] [--midterm]
 *      (no flags = run both)
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content', 'missions');

// Read API key from .env.local
const envPath = path.join(ROOT, '.env.local');
const envRaw = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envRaw.match(/ANTHROPIC_API_KEY=(.+)/);
if (!apiKeyMatch) { console.error('ANTHROPIC_API_KEY not found in .env.local'); process.exit(1); }
const client = new Anthropic({ apiKey: apiKeyMatch[1].trim() });

const QUESTIONS_PER_CHUNK   = 4;   // ob-midterm: per PDF chunk
const CHUNK_SIZE             = 6000; // chars per chunk for PDF text

// ─── helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadBase64(imgPath) {
  const buf = fs.readFileSync(imgPath);
  return buf.toString('base64');
}

async function callClaude(systemPrompt, userContent) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });
  const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
  // extract JSON array
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) {
    console.warn('  ⚠ Could not parse JSON from response. Raw:', raw.slice(0, 200));
    return [];
  }
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    console.warn('  ⚠ JSON parse failed:', e.message);
    return [];
  }
}

const MC_SYSTEM = () => `You are a transcription tool. These images contain multiple-choice questions.

Your job is to extract every question exactly as written — question text, all options, correct answer, and any explanation shown.

RULES:
- Transcribe word for word — do not rephrase, improve, or invent anything
- Extract every question visible in the images
- correctIndex is 0-based index of the correct option in the options array
- If no explanation is shown on the slide, use an empty string for explanation

Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "question": "Exact question text from slide?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctIndex": 0,
    "explanation": "Exact explanation from slide, or empty string if none shown."
  }
]`;

// ─── ob-final (PNG screenshots) ───────────────────────────────────────────────

async function generateFinal() {
  const bankPath = path.join(CONTENT, 'ob-final', 'questions.json');
  const sections = [];

  // Walk CH*/section/ structure
  const chapters = fs.readdirSync(path.join(CONTENT, 'ob-final'))
    .filter(n => n.startsWith('CH'))
    .sort();

  for (const ch of chapters) {
    const chPath = path.join(CONTENT, 'ob-final', ch);
    if (!fs.statSync(chPath).isDirectory()) continue;
    const subsections = fs.readdirSync(chPath).sort();
    for (const sec of subsections) {
      const secPath = path.join(chPath, sec);
      if (!fs.statSync(secPath).isDirectory()) continue;
      const pngs = fs.readdirSync(secPath)
        .filter(f => f.toLowerCase().endsWith('.png'))
        .sort()
        .map(f => path.join(secPath, f));
      if (pngs.length > 0) sections.push({ label: `${ch}/${sec}`, pngs });
    }
  }

  console.log(`\n📚 ob-final: ${sections.length} sections, extracting all content...`);

  const allQuestions = [];

  for (let i = 0; i < sections.length; i++) {
    const { label, pngs } = sections[i];
    console.log(`  [${i + 1}/${sections.length}] ${label} (${pngs.length} images)...`);

    // Build vision content: all images in section
    const userContent = [
      ...pngs.map(p => ({
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: loadBase64(p) },
      })),
      {
        type: 'text',
        text: `These are screenshots of section ${label}. Transcribe every multiple-choice question visible in the images, word for word.`,
      },
    ];

    const system = MC_SYSTEM();
    const questions = await callClaude(system, userContent);
    console.log(`     ✓ got ${questions.length} questions`);
    allQuestions.push(...questions);

    // Rate-limit: brief pause between calls
    if (i < sections.length - 1) await sleep(800);
  }

  fs.writeFileSync(bankPath, JSON.stringify(allQuestions, null, 2));
  console.log(`\n✅ ob-final done — ${allQuestions.length} questions written to questions.json\n`);
}

// ─── ob-midterm (PDF) ─────────────────────────────────────────────────────────

async function generateMidterm() {
  const bankPath = path.join(CONTENT, 'ob-midterm', 'questions.json');
  const pdfPath  = path.join(CONTENT, 'ob-midterm', 'ContentOnTheMidterm.pdf');

  if (!fs.existsSync(pdfPath)) {
    console.error('❌ ob-midterm PDF not found at', pdfPath);
    return;
  }

  console.log('\n📚 ob-midterm: parsing PDF...');
  let text;
  try {
    const { default: pdfParse } = await import('pdf-parse');
    const buf = fs.readFileSync(pdfPath);
    const data = await pdfParse(buf);
    text = data.text;
    console.log(`  PDF parsed: ${text.length} chars`);
  } catch (e) {
    console.error('  ❌ PDF parse failed:', e.message);
    return;
  }

  // Chunk the text
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  console.log(`  ${chunks.length} chunks × ${QUESTIONS_PER_CHUNK} questions = ~${chunks.length * QUESTIONS_PER_CHUNK} questions`);

  const allQuestions = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`  [${i + 1}/${chunks.length}] chunk...`);
    const system = MC_SYSTEM('Organizational Behavior — Midterm', QUESTIONS_PER_CHUNK);
    const userContent = [
      {
        type: 'text',
        text: `Study material excerpt:\n\n${chunks[i]}\n\nGenerate ${QUESTIONS_PER_CHUNK} multiple-choice questions from this content.`,
      },
    ];
    const questions = await callClaude(system, userContent);
    console.log(`     ✓ got ${questions.length} questions`);
    allQuestions.push(...questions);
    if (i < chunks.length - 1) await sleep(800);
  }

  fs.writeFileSync(bankPath, JSON.stringify(allQuestions, null, 2));
  console.log(`\n✅ ob-midterm done — ${allQuestions.length} questions written to questions.json\n`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const doFinal   = args.length === 0 || args.includes('--final');
const doMidterm = args.length === 0 || args.includes('--midterm');

if (doFinal)   await generateFinal();
if (doMidterm) await generateMidterm();

console.log('🎯 All done.');
