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

const RUINS_MISSIONS = ['ps1', 'ps2', 'ps3', 'mock-exam'];

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

function parseMarkdown(md: string): BankQuestion[] {
  const results: BankQuestion[] = [];
  const blocks = md.split(/^## Question \d+/m).slice(1);
  for (const block of blocks) {
    const optStart = block.search(/^A\./m);
    if (optStart === -1) continue;
    const questionText = block.slice(0, optStart).trim();
    if (!questionText) continue;
    const optMatches = [...block.matchAll(/^([A-D])\.\s+(.+)$/gm)];
    if (optMatches.length < 2) continue;
    const optMap: Record<string, string> = {};
    const options: string[] = [];
    for (const m of optMatches) { optMap[m[1]] = m[2].trim(); options.push(m[2].trim()); }
    const correctMatch = block.match(/\*\*Correct:\s*([A-D])/);
    if (!correctMatch) continue;
    const correctText = optMap[correctMatch[1]];
    if (!correctText) continue;
    let explanation = '';
    const inside  = block.match(/\*\*Correct:\s*[A-D]\s*[—–]\s*(.+?)\*\*/);
    const outside = block.match(/\*\*Correct:\s*[A-D]\*\*\s*[—–]\s*(.+)/);
    if (inside) explanation = inside[1].trim();
    else if (outside) explanation = outside[1].trim();
    results.push({ question: questionText, options, correctIndex: options.indexOf(correctText), explanation });
  }
  return results;
}

export async function GET() {
  const cwd  = process.cwd();
  const pool: BankQuestion[] = [];

  // Italia campaign question banks
  const mainPath    = path.join(cwd, 'content', 'questions.json');
  const obFinalPath = path.join(cwd, 'content', 'missions', 'ob-final', 'questions.json');
  if (fs.existsSync(mainPath))    pool.push(...JSON.parse(fs.readFileSync(mainPath, 'utf-8')));
  if (fs.existsSync(obFinalPath)) pool.push(...JSON.parse(fs.readFileSync(obFinalPath, 'utf-8')));

  // Roman Ruins problem sets & mock
  for (const id of RUINS_MISSIONS) {
    const mdPath = path.join(cwd, 'content', 'roman-ruins', id, 'questions.md');
    if (fs.existsSync(mdPath)) {
      pool.push(...parseMarkdown(fs.readFileSync(mdPath, 'utf-8')));
    }
  }

  if (pool.length === 0) {
    return NextResponse.json({ error: 'No questions found' }, { status: 404 });
  }

  const questions = shuffle(pool).slice(0, 15).map(toMCQ);

  return NextResponse.json({
    questions,
    subject: '🚽 Skibidi Toilet Bowl — Everything',
    bossId:  'mrskib',
  });
}
