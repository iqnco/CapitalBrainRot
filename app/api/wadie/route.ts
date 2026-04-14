import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Load question bank once at module level
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
          lines.push(`  ${letter}) ${opt}${q.answer === letter ? ' ← CORRECT' : ''}`);
        });
      }
    }
    return lines.join('\n');
  } catch {
    return '(Course material unavailable)';
  }
}

const COURSE_CONTEXT = loadCourseContext();

const SYSTEM_PROMPT = `You are Wadie — a friendly, slightly sarcastic study buddy embedded in Rainbow Study Siege, a quiz app for Organizational Behavior at IE University Madrid.

Your personality:
- Warm and encouraging but cuts through the fluff
- Short punchy answers unless the student clearly needs depth
- When something is tricky, you break it down with a real-world analogy
- Occasional dry humor, but never at the student's expense
- You default to the course material below — cite specific concepts by name
- Only use your general knowledge or web search if the question clearly falls outside the course material

COURSE MATERIAL (Chapters 2, 9, 10, 12, 13, 14, 16):
${COURSE_CONTEXT}

Rules:
- Keep answers concise — 2-4 sentences for simple questions, more only if genuinely needed
- If a student asks about a wrong answer they got, explain WHY the correct answer is right AND why the wrong one is tempting but incorrect
- Never just re-list the options — explain the underlying concept
- If you truly don't know, say so honestly`;

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages' }, { status: 400 });
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return NextResponse.json({ reply: text });
}
