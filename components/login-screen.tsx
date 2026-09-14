'use client';

import { FormEvent, useState } from 'react';
import { LockKeyhole, Wheat } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const { error: authError } = await createClient().auth.signInWithPassword({ email: 'birhanukinfu@bereket.local', password });
    setBusy(false);
    if (authError) { setError('የይለፍ ቃሉ ትክክል አይደለም። / Incorrect password.'); return; }
    onSignedIn();
  }
  return <main className="login-page" dir="ltr"><section className="login-brand"><div className="login-brand-mark"><Wheat /></div><p>ብርሃኑ · BIRHANU</p><h1>የንግድዎ ሙሉ ሁኔታ፣<br />በአንድ የተረጋጋ ቦታ።</h1><span>Farm · Beverage · Finance · Inventory</span></section><section className="login-form-wrap"><form onSubmit={submit} className="login-form"><div className="login-lock"><LockKeyhole /></div><small>ደህንነቱ የተጠበቀ መግቢያ</small><h2>እንኳን ደህና መጡ</h2><p>Welcome back, Birhanu</p><label><span>Username / የተጠቃሚ ስም</span><input value="birhanukinfu" readOnly /></label><label><span>Password / የይለፍ ቃል</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" /></label>{error?<div className="login-error">{error}</div>:null}<button disabled={busy}>{busy?'እየገባ…':'ግባ / Sign in'}</button><em>የገንዘብ መረጃዎ በደህንነት ተጠብቋል።</em></form></section></main>;
}
