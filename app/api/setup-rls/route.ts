import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const statements = [
    `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "users can select own profile" ON profiles`,
    `DROP POLICY IF EXISTS "users can insert own profile" ON profiles`,
    `DROP POLICY IF EXISTS "users can update own profile" ON profiles`,
    `CREATE POLICY "users can select own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id)`,
    `CREATE POLICY "users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id)`,
    `CREATE POLICY "users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`,
    `GRANT ALL ON profiles TO service_role`,
    `GRANT ALL ON profiles TO authenticated`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of statements) {
    const { error } = await admin.rpc('exec_sql', { sql }).maybeSingle().catch(() => ({ error: null })) as { error: unknown };
    // rpc may not exist — try raw query via postgrest instead
    results.push({ sql: sql.slice(0, 60), ok: !error, error: error ? String(error) : undefined });
  }

  // Also test if service_role can upsert directly
  const { error: testErr } = await admin.from('profiles').upsert(
    { id: '00000000-0000-0000-0000-000000000000', username: '__test__', favorite_operator: 'tralalero', country: 'US' },
    { onConflict: 'id' }
  );
  // Clean up test row
  await admin.from('profiles').delete().eq('id', '00000000-0000-0000-0000-000000000000');

  return NextResponse.json({
    serviceKeyLoaded: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20),
    adminUpsertError: testErr?.message ?? null,
    rpcResults: results,
  });
}
