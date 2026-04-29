import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { MultipleChoiceQuestion } from '@/lib/types';

const VALID = new Set(['ps1', 'ps2', 'ps3', 'mock-exam']);
const LABELS: Record<string, string> = {
  'ps1':       'Problem Set 1',
  'ps2':       'Problem Set 2',
  'ps3':       'Problem Set 3',
  'mock-exam': 'Mock Exam',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseMarkdown(md: string): MultipleChoiceQuestion[] {
  const results: MultipleChoiceQuestion[] = [];
  const blocks = md.split(/^## Question \d+/m).slice(1);

  for (const block of blocks) {
    // Question text: everything before the first "A." option line
    const optStart = block.search(/^A\./m);
    if (optStart === -1) continue;
    const questionText = block.slice(0, optStart).trim();
    if (!questionText) continue;

    // Parse A–D options
    const optMatches = [...block.matchAll(/^([A-D])\.\s+(.+)$/gm)];
    if (optMatches.length < 2) continue;
    const optMap: Record<string, string> = {};
    const options: string[] = [];
    for (const m of optMatches) {
      optMap[m[1]] = m[2].trim();
      options.push(m[2].trim());
    }

    // Correct letter
    const correctMatch = block.match(/\*\*Correct:\s*([A-D])/);
    if (!correctMatch) continue;
    const correctLetter = correctMatch[1];
    const correctText = optMap[correctLetter];
    if (!correctText) continue;

    // Explanation — handles both "**Correct: X — expl**" and "**Correct: X** — expl"
    let explanation = '';
    const insideMatch = block.match(/\*\*Correct:\s*[A-D]\s*[—–]\s*(.+?)\*\*/);
    if (insideMatch) {
      explanation = insideMatch[1].trim();
    } else {
      const outsideMatch = block.match(/\*\*Correct:\s*[A-D]\*\*\s*[—–]\s*(.+)/);
      if (outsideMatch) explanation = outsideMatch[1].trim();
    }

    const shuffled = shuffle(options);
    results.push({
      type: 'multiple-choice',
      question: questionText,
      options: shuffled,
      correctIndex: shuffled.indexOf(correctText),
      explanation,
    });
  }

  return results;
}

export async function POST(req: NextRequest) {
  const { missionId, full } = (await req.json()) as { missionId: string; full?: boolean };

  if (!VALID.has(missionId)) {
    return NextResponse.json({ error: 'Invalid mission' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'content', 'roman-ruins', missionId, 'questions.md');
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Questions not found' }, { status: 404 });
  }

  const md = fs.readFileSync(filePath, 'utf-8');
  const all = parseMarkdown(md);

  if (all.length === 0) {
    return NextResponse.json({ error: 'No questions parsed from file' }, { status: 400 });
  }

  const questions = full ? shuffle(all) : shuffle(all).slice(0, 10);
  const subject = `🏛 Roman Ruins — ${LABELS[missionId]}`;

  return NextResponse.json({ questions, subject });
}
