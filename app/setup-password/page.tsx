'use client';
/* oxlint-disable next/no-html-link-for-pages */

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Wheat } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SetupPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setReady(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (password.length < 10) { setError('Password must be at least 10 characters.'); return; }
    if (password !== confirm) { setError('The passwords do not match.'); return; }
    setBusy(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    setDone(true);
  }
  return <main className="setup-page"><div className="setup-card"><div className="setup-brand"><Wheat/></div>{done?<><CheckCircle2 className="setup-success"/><h1>Password created</h1><p>የይለፍ ቃልዎ በትክክል ተቀምጧል።</p><a href="/">Open Bereket dashboard</a></>:<><KeyRound className="setup-key"/><small>ONE-TIME ACCOUNT SETUP</small><h1>Create your password</h1><p>Username: <strong>birhanukinfu</strong></p>{ready?<form onSubmit={submit}><label><span>New password</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={10} required autoComplete="new-password"/></label><label><span>Confirm password</span><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={10} required autoComplete="new-password"/></label>{error?<div className="login-error">{error}</div>:null}<button disabled={busy}>{busy?'Saving…':'Save password'}</button></form>:<div className="setup-wait">Verifying your secure setup link…</div>}</>}</div></main>;
}
