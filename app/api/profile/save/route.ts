import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey) {
    return NextResponse.json({ error: 'SERVER_MISSING_KEY: SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 });
  }

  const admin = createClient(supabaseUrl!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { id, username, favorite_operator, country } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

  const { error } = await admin.from('profiles').upsert(
    { id, username, favorite_operator, country },
    { onConflict: 'id' },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
