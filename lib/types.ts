export type QuestionType = 'multiple-choice' | 'type-answer' | 'fill-blank' | 'match-pairs';

export interface MultipleChoiceQuestion {
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  chapter?: string;
}

export interface TypeAnswerQuestion {
  type: 'type-answer';
  question: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  explanation: string;
}

export interface FillBlankQuestion {
  type: 'fill-blank';
  sentence: string; // contains ___ placeholder
  correctAnswer: string;
  explanation: string;
}

export interface MatchPairsQuestion {
  type: 'match-pairs';
  instruction: string;
  pairs: Array<{ left: string; right: string }>;
  explanation: string;
}

export type Question =
  | MultipleChoiceQuestion
  | TypeAnswerQuestion
  | FillBlankQuestion
  | MatchPairsQuestion;

export interface QuizResults {
  subject: string;
  score: number;
  total: number;
  wrongCount: number;
  armor: number;
}

export interface AnswerRecord {
  questionText: string;
  questionType: QuestionType;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
}

// key = chapter id e.g. "CH10", value = array of seen question text keys
export type ChapterSeenMap = Record<string, string[]>;

export interface MatchReport {
  id: string;
  subject: string;
  date: string;
  score: number;
  total: number;
  answers: AnswerRecord[];
}
