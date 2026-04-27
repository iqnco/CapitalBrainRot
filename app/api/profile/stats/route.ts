import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(req: NextRequest) {
  const { userId, correct, total } = await req.json();
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const db = admin();

  const { data, error: selErr } = await db
    .from('profiles')
    .select('total_correct, total_answered, sessions')
    .eq('id', userId)
    .single();

  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

  const { error: updErr } = await db.from('profiles').update({
    total_correct:  (data.total_correct  ?? 0) + correct,
    total_answered: (data.total_answered ?? 0) + total,
    sessions:       (data.sessions       ?? 0) + 1,
  }).eq('id', userId);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
