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

function dateToSeed(dateStr: string): number {
  return dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function seededRand(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000;
  return x - Math.floor(x);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seededRand(seed, i) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET() {
  const bankPath = path.join(process.cwd(), 'content', 'missions', 'ob-final', 'questions.json');
  if (!fs.existsSync(bankPath)) {
    return NextResponse.json({ error: 'Question bank not found' }, { status: 404 });
  }

  const raw: BankQuestion[] = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const seed  = dateToSeed(today);
  const picked = seededShuffle(raw, seed).slice(0, 10);

  const questions: MultipleChoiceQuestion[] = picked.map(q => {
    const correct  = q.options[q.correctIndex];
    const shuffled = seededShuffle(q.options, seed + q.question.length);
    return {
      type: 'multiple-choice',
      question: q.question,
      options: shuffled,
      correctIndex: shuffled.indexOf(correct),
      explanation: q.explanation,
      chapter: q.chapter,
    };
  });

  return NextResponse.json({ questions, date: today });
}
