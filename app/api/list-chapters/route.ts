import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { MISSIONS } from '@/lib/missions';

export async function POST(req: NextRequest) {
  const { missionId, mapId } = (await req.json()) as { missionId: string; mapId?: string };

  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  if (!mission.maps || !mapId) return NextResponse.json({ chapters: [] });

  const map = mission.maps.find((m) => m.id === mapId);
  if (!map) return NextResponse.json({ error: 'Map not found' }, { status: 404 });

  const folder = path.join(process.cwd(), 'content', 'missions', map.contentFolder);
  if (!fs.existsSync(folder)) return NextResponse.json({ chapters: [] });

  const chapterDirs = fs
    .readdirSync(folder)
    .filter(
      (name) =>
        /^CH\d+$/i.test(name) &&
        fs.statSync(path.join(folder, name)).isDirectory()
    )
    .sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')));

  // Count questions per chapter from the question bank
  const bankPath = path.join(folder, 'questions.json');
  const totalsMap: Record<string, number> = {};
  if (fs.existsSync(bankPath)) {
    const bank: Array<{ chapter?: string }> = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
    bank.forEach((q) => {
      if (q.chapter) totalsMap[q.chapter] = (totalsMap[q.chapter] ?? 0) + 1;
    });
  }

  const chapters = chapterDirs.map((dir) => {
    const id = dir.toUpperCase();
    return { id, number: parseInt(dir.replace(/\D/g, '')), total: totalsMap[id] ?? 0 };
  });

  return NextResponse.json({ chapters });
}
