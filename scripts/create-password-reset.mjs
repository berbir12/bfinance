import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const values = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const separator = line.indexOf('=');
      const value = line.slice(separator + 1).replace(/^"|"$/g, '');
      return [line.slice(0, separator), value];
    }),
);

const admin = createClient(values.SUPABASE_URL, values.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
if (listError) throw listError;
const user = data.users.find(candidate => candidate.email === 'birhanukinfu@bereket.local');
if (!user) throw new Error('birhanukinfu account not found.');

const token = randomBytes(32).toString('base64url');
const passwordResetTokenHash = createHash('sha256').update(token).digest('hex');
const { error } = await admin.auth.admin.updateUserById(user.id, {
  app_metadata: { ...user.app_metadata, password_reset_token_hash: passwordResetTokenHash },
});
if (error) throw error;

console.log(`https://bereket-business-hub.vercel.app/setup-password?token=${token}`);
