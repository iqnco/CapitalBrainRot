import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { MISSIONS } from '@/lib/missions';
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
  const { missionId, mapId, total, chapters } = (await req.json()) as {
    missionId: string;
    mapId?: string;
    total?: number;
    chapters?: string[];
  };

  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  let folder: string;
  let subjectName = mission.name;

  if (mission.maps) {
    if (!mapId) return NextResponse.json({ error: 'mapId required' }, { status: 400 });
    const map = mission.maps.find((m) => m.id === mapId);
    if (!map) return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    folder = path.join(process.cwd(), 'content', 'missions', map.contentFolder);
    subjectName = `${mission.name} — ${map.name}`;
  } else {
    return NextResponse.json({ error: 'No maps configured' }, { status: 400 });
  }

  const bankPath = path.join(folder, 'questions.json');
  if (!fs.existsSync(bankPath)) {
    return NextResponse.json({ error: 'questions.json not found' }, { status: 404 });
  }

  const raw: BankQuestion[] = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
  if (raw.length === 0) {
    return NextResponse.json({ error: 'Question bank is empty' }, { status: 400 });
  }

  const selectedChapters = chapters ?? ['ALL'];
  const isAll = selectedChapters.includes('ALL') || selectedChapters.length === 0;

  // Filter by chapter if specific ones were requested
  const pool = isAll
    ? raw
    : raw.filter((q) => q.chapter && selectedChapters.includes(q.chapter));

  if (pool.length === 0) {
    return NextResponse.json(
      { error: `No questions found for chapters: ${selectedChapters.join(', ')}` },
      { status: 400 }
    );
  }

  const count  = total ?? 10;
  const picked = shuffle(pool).slice(0, count);

  const questions: MultipleChoiceQuestion[] = picked.map((q) => {
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

  // Build subject label
  const chapterLabel = isAll ? '' : ` — ${selectedChapters.join(' + ')}`;
  const subject = `${subjectName}${chapterLabel}`;

  return NextResponse.json({ questions, subject });
}
