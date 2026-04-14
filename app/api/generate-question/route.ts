import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Question, QuestionType } from '@/lib/types';

const client = new Anthropic({
  apiKey: process.env.anthropic,
});

const FORMAT: Record<QuestionType, string> = {
  'multiple-choice': `{
  "type": "multiple-choice",
  "question": "The question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Option A is correct because... [teach the concept]"
}`,
  'type-answer': `{
  "type": "type-answer",
  "question": "The question text?",
  "correctAnswer": "exact correct answer",
  "acceptableAnswers": ["exact correct answer", "acceptable variant"],
  "explanation": "The correct answer is X because... [teach the concept]"
}`,
  'fill-blank': `{
  "type": "fill-blank",
  "sentence": "The ___ principle states that...",
  "correctAnswer": "single word or short phrase",
  "explanation": "The blank is filled with X because... [teach the concept]"
}`,
  'match-pairs': `{
  "type": "match-pairs",
  "instruction": "Match each term with its correct definition",
  "pairs": [
    {"left": "Term 1", "right": "Definition 1"},
    {"left": "Term 2", "right": "Definition 2"},
    {"left": "Term 3", "right": "Definition 3"},
    {"left": "Term 4", "right": "Definition 4"}
  ],
  "explanation": "These concepts are connected because... [teach the relationships]"
}`,
};

export async function POST(req: NextRequest) {
  const { content, questionType, previousQuestions, subject } =
    (await req.json()) as {
      content: string;
      questionType: QuestionType;
      previousQuestions: string[];
      subject: string;
    };

  const truncated = content.slice(0, 28_000);

  const avoidText =
    previousQuestions.length > 0
      ? `\n\nDO NOT repeat questions about these topics (already asked):\n${previousQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join('\n')}`
      : '';

  const system = `You are an expert educator creating a quiz question for: "${subject}".

Generate exactly ONE ${questionType.replace('-', ' ')} question from the study material below.

RULES:
- Question must be answerable from the provided material only
- Make it genuinely challenging — test understanding, not just recall
- All wrong options (MC) must be plausible — no obvious fillers
- For fill-blank: the blank must replace a meaningful key term or concept
- For match-pairs: use exactly 4 pairs from distinct parts of the material
- For type-answer: include realistic answer variants (abbreviations, alternate phrasing)
- Explanation rules:
  • If the answer is a straightforward definition or direct factual recall, one brief confirming sentence is enough (e.g. "X is defined as Y.")
  • If it's a conceptual, applied, or easily-confused question where wrong options are plausible, explain the reasoning in 1–2 sentences starting with "This is because…" or similar
  • Never just repeat the question and answer back — add something useful${avoidText}

Return ONLY valid JSON, no markdown, no extra text:
${FORMAT[questionType]}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages: [
        {
          role: 'user',
          content: `Study material:\n\n${truncated}\n\nGenerate one ${questionType.replace('-', ' ')} question.`,
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      return NextResponse.json(
        { error: 'Model returned invalid JSON' },
        { status: 500 }
      );
    }

    const question: Question = JSON.parse(match[0]);
    return NextResponse.json(question);
  } catch (err) {
    console.error('generate-question error:', err);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}
