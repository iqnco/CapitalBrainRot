import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CHAPTERS } from '@/lib/chapters';
import { MultipleChoiceQuestion } from '@/lib/types';

interface BankQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  chapter?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  const { chapterId, ranked, full } = (await req.json()) as { chapterId?: string; ranked?: boolean; full?: boolean };

  const cwd = process.cwd();
  const mainPath   = path.join(cwd, 'content', 'questions.json');
  const obFinalPath = path.join(cwd, 'content', 'missions', 'ob-final', 'questions.json');

  if (!fs.existsSync(mainPath)) {
    return NextResponse.json({ error: 'Question bank not found' }, { status: 404 });
  }

  const raw: BankQuestion[] = [
    ...JSON.parse(fs.readFileSync(mainPath, 'utf-8')),
    ...(fs.existsSync(obFinalPath) ? JSON.parse(fs.readFileSync(obFinalPath, 'utf-8')) : []),
  ];

  let pool: BankQuestion[];
  let subject: string;

  if (ranked) {
    pool = raw;
    subject = '🏆 Ranked Mode';
  } else {
    const chapter = CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });

    const tags = new Set(chapter.questionChapters);
    pool = raw.filter(q => !q.chapter || tags.has(q.chapter));
    if (pool.length === 0) pool = raw; // fallback to all
    subject = `CH${chapter.number}: ${chapter.name} — ${chapter.topic}`;
  }

  const picked = full ? shuffle(pool) : shuffle(pool).slice(0, 10);
  const questions: MultipleChoiceQuestion[] = picked.map(q => {
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
  });

  return NextResponse.json({ questions, subject });
}
