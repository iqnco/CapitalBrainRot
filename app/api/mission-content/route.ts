import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { MISSIONS } from '@/lib/missions';

const SUPPORTED = new Set(['.txt', '.md', '.pdf', '.docx']);
const MAX_CHARS = 80_000;

async function readFile(filePath: string, ext: string): Promise<string> {
  if (ext === '.pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text as string;
    } catch {
      return `[PDF parse failed: ${path.basename(filePath)}]`;
    }
  }
  if (ext === '.docx') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value as string;
    } catch {
      return `[DOCX parse failed: ${path.basename(filePath)}]`;
    }
  }
  return fs.readFileSync(filePath, 'utf-8');
}

async function readFolder(folderPath: string): Promise<string> {
  const files = fs
    .readdirSync(folderPath)
    .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(folderPath, f));

  let combined = '';
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);
    const text = await readFile(filePath, ext);
    combined += `\n\n=== ${name} ===\n${text}`;
    if (combined.length >= MAX_CHARS) {
      combined = combined.slice(0, MAX_CHARS);
      break;
    }
  }
  return combined.trim();
}

export async function POST(req: NextRequest) {
  const { missionId, mapId } = (await req.json()) as { missionId: string; mapId?: string };

  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission) {
    return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
  }

  let content: string;
  let subjectName = mission.name;

  if (mission.maps) {
    if (!mapId) {
      return NextResponse.json({ error: 'mapId required for this mission' }, { status: 400 });
    }
    const map = mission.maps.find((m) => m.id === mapId);
    if (!map) {
      return NextResponse.json({ error: `Map "${mapId}" not found` }, { status: 404 });
    }

    const folderPath = path.join(process.cwd(), 'content', 'missions', map.contentFolder);
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json({ error: 'Content folder missing' }, { status: 404 });
    }

    content = await readFolder(folderPath);
    subjectName = `${mission.name} — ${map.name}`;

    if (!content) {
      return NextResponse.json(
        { error: `No files found in ${map.name} folder. Drop PDFs into content/missions/${map.contentFolder}/` },
        { status: 400 }
      );
    }
  } else {
    if (!mission.contentFile) {
      return NextResponse.json({ error: 'No content configured for this mission' }, { status: 500 });
    }
    const contentPath = path.join(process.cwd(), 'content', 'missions', mission.contentFile);
    if (!fs.existsSync(contentPath)) {
      return NextResponse.json({ error: 'Content file missing' }, { status: 404 });
    }
    content = fs.readFileSync(contentPath, 'utf-8');
  }

  return NextResponse.json({ content, mission: { ...mission, name: subjectName } });
}
