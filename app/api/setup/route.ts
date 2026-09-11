import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

const OWNER_EMAIL = 'birhanukinfu@bereket.local';

export async function POST(request: Request) {
  const { token, password } = await request.json() as { token?: string; password?: string };
  const expected = process.env.ACCOUNT_SETUP_TOKEN;
  if (!token || !expected || token.length !== expected.length || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return Response.json({ error: 'Invalid or expired setup link.' }, { status: 403 });
  if (!password || password.length < 10) return Response.json({ error: 'Password must be at least 10 characters.' }, { status: 400 });
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (listError) return Response.json({ error: 'Account setup is temporarily unavailable.' }, { status: 500 });
  const user = users.users.find(candidate => candidate.email === OWNER_EMAIL);
  if (!user) return Response.json({ error: 'Owner account not found.' }, { status: 404 });
  if (user.app_metadata.password_set) return Response.json({ error: 'This setup link has already been used.' }, { status: 409 });
  const { error } = await admin.auth.admin.updateUserById(user.id, { password, app_metadata: { ...user.app_metadata, password_set: true } });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
