import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set on this deployment' });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await admin.from('profiles').upsert(
    { id: '00000000-0000-0000-0000-000000000001', username: '__test__', favorite_operator: 'tralalero', country: 'UY' },
    { onConflict: 'id' },
  );

  await admin.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000001');

  return NextResponse.json({
    keyLoaded: true,
    keyPrefix: key.slice(0, 30) + '...',
    upsertError: error?.message ?? null,
  });
}
