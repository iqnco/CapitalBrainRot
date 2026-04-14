import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SUPPORTED = new Set(['.txt', '.md', '.pdf', '.docx']);
const MAX_CHARS = 80_000; // ~20k tokens

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

export async function POST(req: NextRequest) {
  const { folderPath } = (await req.json()) as { folderPath: string };

  if (!folderPath?.trim()) {
    return NextResponse.json({ error: 'No folder path provided' }, { status: 400 });
  }

  // Expand ~ to home directory
  const resolved = path.resolve(
    folderPath.trim().replace(/^~/, process.env.HOME ?? '')
  );

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return NextResponse.json(
      { error: `Folder not found: ${resolved}` },
      { status: 400 }
    );
  }

  const files = fs
    .readdirSync(resolved)
    .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(resolved, f));

  if (files.length === 0) {
    return NextResponse.json(
      { error: 'No supported files found (.txt .md .pdf .docx)' },
      { status: 400 }
    );
  }

  let combined = '';
  let loaded = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);
    const text = await readFile(filePath, ext);
    combined += `\n\n=== ${name} ===\n${text}`;
    loaded++;
    if (combined.length >= MAX_CHARS) {
      combined = combined.slice(0, MAX_CHARS);
      break;
    }
  }

  return NextResponse.json({
    content: combined.trim(),
    fileCount: loaded,
    totalFiles: files.length,
  });
}
