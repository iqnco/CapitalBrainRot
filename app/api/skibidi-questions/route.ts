import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { MultipleChoiceQuestion } from '@/lib/types';

interface BankQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  chapter?: string;
}

// Questions per chapter tag for the 25-question Skibidi Toilet Bowl
const DISTRIBUTION: Record<string, number> = {
  CH1:  4,
  CH2:  3,
  CH3:  3,
  CH4:  3,
  CH12: 4,
  CH13: 4,
  CH17: 4,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toMCQ(q: BankQuestion): MultipleChoiceQuestion {
  const correct  = q.options[q.correctIndex];
  const shuffled = shuffle(q.options);
  return {
    type: 'multiple-choice',
    question: q.question,
    options: shuffled,
    correctIndex: shuffled.indexOf(correct),
    explanation: q.explanation,
    chapter: q.chapter,
  };
}

export async function GET() {
  const cwd = process.cwd();

  // Load both question banks and merge
  const mainPath    = path.join(cwd, 'content', 'questions.json');
  const obFinalPath = path.join(cwd, 'content', 'missions', 'ob-final', 'questions.json');

  const bank: BankQuestion[] = [];
  if (fs.existsSync(mainPath))    bank.push(...JSON.parse(fs.readFileSync(mainPath, 'utf-8')));
  if (fs.existsSync(obFinalPath)) bank.push(...JSON.parse(fs.readFileSync(obFinalPath, 'utf-8')));

  if (bank.length === 0) {
    return NextResponse.json({ error: 'No questions found' }, { status: 404 });
  }

  // Group by chapter tag
  const byChapter: Record<string, BankQuestion[]> = {};
  for (const q of bank) {
    const tag = q.chapter ?? 'UNKNOWN';
    if (!byChapter[tag]) byChapter[tag] = [];
    byChapter[tag].push(q);
  }

  // Sample from each chapter according to DISTRIBUTION, shuffle each group
  const picked: MultipleChoiceQuestion[] = [];
  for (const [tag, count] of Object.entries(DISTRIBUTION)) {
    const pool = byChapter[tag] ?? [];
    const sampled = shuffle(pool).slice(0, count);
    // Shuffle within each sampled group for internal question order
    shuffle(sampled).forEach(q => picked.push(toMCQ(q)));
  }

  // Shuffle the full 25-question set
  const questions = shuffle(picked);

  return NextResponse.json({
    questions,
    subject: '🚽 Skibidi Toilet Bowl — All Chapters',
    bossId:  'mrskib',
  });
}
