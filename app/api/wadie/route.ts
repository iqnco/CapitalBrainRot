import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

// Load question bank once — compact format to keep system prompt reasonable
function loadCourseContext(): string {
  try {
    const bankPath = path.join(process.cwd(), 'public', 'questions-bank.json');
    const bank: Record<string, Array<{ question: string; options: string[]; answer: string }>> =
      JSON.parse(fs.readFileSync(bankPath, 'utf-8'));

    const lines: string[] = [];
    for (const [chapter, questions] of Object.entries(bank)) {
      lines.push(`\n=== ${chapter} ===`);
      for (const q of questions) {
        lines.push(`Q: ${q.question}`);
        q.options.forEach((opt, i) => {
          const letter = ['A','B','C','D','E'][i];
          lines.push(`  ${letter}) ${opt}${q.answer === letter ? ' ✓' : ''}`);
        });
      }
    }
    return lines.join('\n');
  } catch {
    return '(Course material unavailable)';
  }
}

const COURSE_CONTEXT = loadCourseContext();

const SYSTEM_PROMPT = `You are Wadie — a friendly, slightly sarcastic study buddy for Organizational Behavior at IE University Madrid.

Personality: warm but direct, short punchy answers, real-world analogies for tricky concepts, dry humor (never mean). Default to course material below, only use general knowledge if something clearly isn't covered.

COURSE MATERIAL (Chapters 2, 9, 10, 12, 13, 14, 16):
${COURSE_CONTEXT}

Rules:
- 2-4 sentences unless depth is clearly needed
- For wrong answers: explain WHY the correct answer is right AND why the wrong one is tempting
- Never just re-list options — explain the underlying concept`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { reply: "⚠ Wadie's brain isn't connected — ANTHROPIC_API_KEY is missing from Vercel environment variables." },
      { status: 200 }   // 200 so the UI shows it as a chat message, not a silent crash
    );
  }

  try {
    const { messages } = (await req.json()) as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages' }, { status: 400 });
    }

    // Create client inside handler — safe even if env var was missing at module load time
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply: text });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[wadie] error:', msg);
    return NextResponse.json({ reply: `Error: ${msg}` }, { status: 200 });
  }
}
