'use client';
/* oxlint-disable next/no-html-link-for-pages */

import { FormEvent, useState } from 'react';
import { CheckCircle2, KeyRound, Wheat } from 'lucide-react';

export default function SetupPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 10) { setError('Password must be at least 10 characters.'); return; }
    if (password !== confirm) { setError('The passwords do not match.'); return; }
    setBusy(true);
    const token = new URLSearchParams(window.location.search).get('token');
    const response = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const result = await response.json() as { error?: string };
    setBusy(false);
    if (!response.ok) { setError(result.error ?? 'Could not set the password.'); return; }
    setDone(true);
  }

  return (
    <main className="setup-page">
      <div className="setup-card">
        <div className="setup-brand"><Wheat /></div>
        {done ? (
          <><CheckCircle2 className="setup-success" /><h1>Password created</h1><p>የይለፍ ቃልዎ በትክክል ተቀምጧል።</p><a href="/">Open Birhanu dashboard</a></>
        ) : (
          <><KeyRound className="setup-key" /><small>ONE-TIME ACCOUNT SETUP</small><h1>Create your password</h1><p>Username: <strong>birhanukinfu</strong></p><form onSubmit={submit}><label><span>New password</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={10} required autoComplete="new-password" /></label><label><span>Confirm password</span><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={10} required autoComplete="new-password" /></label>{error ? <div className="login-error">{error}</div> : null}<button disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button></form></>
        )}
      </div>
    </main>
  );
}
