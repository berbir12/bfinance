import { createClient } from '@supabase/supabase-js';
import { createHash, timingSafeEqual } from 'node:crypto';

const OWNER_EMAIL = 'birhanukinfu@bereket.local';

export async function POST(request: Request) {
  const { token, password } = await request.json() as { token?: string; password?: string };
  if (!password || password.length < 10) return Response.json({ error: 'Password must be at least 10 characters.' }, { status: 400 });
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (listError) return Response.json({ error: 'Account setup is temporarily unavailable.' }, { status: 500 });
  const user = users.users.find(candidate => candidate.email === OWNER_EMAIL);
  if (!user) return Response.json({ error: 'Owner account not found.' }, { status: 404 });

  const existingAppMetadata: Record<string, unknown> = user.app_metadata;
  const expectedSetupToken = process.env.ACCOUNT_SETUP_TOKEN;
  const resetTokenHash = typeof existingAppMetadata.password_reset_token_hash === 'string' ? existingAppMetadata.password_reset_token_hash : '';
  const suppliedHash = token ? createHash('sha256').update(token).digest('hex') : '';
  const validInitialSetup = !existingAppMetadata.password_set && Boolean(token && expectedSetupToken) && token!.length === expectedSetupToken!.length && timingSafeEqual(Buffer.from(token!), Buffer.from(expectedSetupToken!));
  const validPasswordReset = Boolean(resetTokenHash && suppliedHash) && suppliedHash.length === resetTokenHash.length && timingSafeEqual(Buffer.from(suppliedHash), Buffer.from(resetTokenHash));
  if (!validInitialSetup && !validPasswordReset) return Response.json({ error: 'Invalid or expired password link.' }, { status: 403 });

  const appMetadata: Record<string, unknown> = { ...existingAppMetadata, password_set: true };
  delete appMetadata.password_reset_token_hash;
  const { error } = await admin.auth.admin.updateUserById(user.id, { password, app_metadata: appMetadata });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
