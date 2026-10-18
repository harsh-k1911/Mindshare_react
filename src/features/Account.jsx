import { useState } from 'react';
import Icon from '../components/Icon';
import AccountProfile from './AccountProfile';
import studentDoodle from '../assets/student-doodle.png';
import { getSupabaseClient, supabaseConfig } from '../lib/supabase/client';
import { accountErrorMessage, submitAccountAction, validateAccountForm } from '../lib/supabase/auth';

export default function Account({ session, loading, sessionError, recovery, onRecovered }) {
  const [choice,setChoice] = useState('signin');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const mode = recovery ? 'reset' : choice;
  const configured = supabaseConfig.status === 'ready';
  const changeMode = next => { setChoice(next); setError(''); setMessage(''); };
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const invalid = validateAccountForm(mode,values);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await submitAccountAction(getSupabaseClient(),mode,values,window.location);
      form.reset();
      if (mode === 'signup' && !data?.session) setMessage('Check your email for a confirmation link. Then return here to sign in.');
      if (mode === 'forgot') setMessage('If this email can receive a reset link, one has been sent. Check your inbox and spam folder.');
      if (mode === 'reset') { onRecovered(); setMessage('Password updated.'); }
    } catch (failure) { setError(accountErrorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError(''); setMessage('');
    try {
      const {error:failure} = await getSupabaseClient().auth.signOut({scope:'local'});
      if (failure) throw failure;
      onRecovered(); setChoice('signin'); setMessage('You’re signed out on this device.');
    } catch (failure) { setError(failure.message || 'Sign-out failed. Please try again.'); }
    finally { setBusy(false); }
  }
  const title = {signin:'Welcome back.',signup:'Join your campus community.',forgot:'Forgot your password?',reset:'Choose a new password.'}[mode];
  return <div className="account-page"><a className="brand" href="#/overview"><span className="brand-mark"><Icon name="leaf" size={25}/></span>mindshare<span className="brand-dot">.</span></a><div className="account-layout"><section className="account-intro"><span className="eyebrow">YOUR CAMPUS, A LITTLE MORE CONNECTED</span><h1>A place for your<br/>next chapter.</h1><p>Share ideas, find your teammates, and get involved in something worth building.</p><img src={studentDoodle} alt="A student working on a laptop"/></section><section className="account-panel" aria-labelledby="account-title">
    {!configured ? <><h2 id="account-title">Account setup is unavailable</h2><p role="alert">{supabaseConfig.message}</p><a href="#/overview" className="button secondary">Return to local preview</a></> : loading ? <><h2 id="account-title">Checking your session…</h2><p role="status">Please wait a moment.</p></> : session && !recovery ? <><span className="eyebrow">SIGNED IN</span><h2 id="account-title">Your account.</h2><p className="account-email">{session.user.email}</p><AccountProfile key={session.user.id} userId={session.user.id}/><div className="account-next"><h3>Your account is ready.</h3><p>Community data is being connected next. The local preview is still separate from your account; its sample posts and activity are not uploaded.</p></div><a className="button primary" href="#/overview">Explore the local preview <Icon name="arrow" size={17}/></a><button className="button secondary" disabled={busy} onClick={signOut}>{busy ? 'Signing out…' : 'Sign out'}</button></> : <><h2 id="account-title">{title}</h2><p className="muted">{mode === 'signin' ? 'Sign in to your MindShare account.' : mode === 'signup' ? 'Create an account with your email address.' : mode === 'forgot' ? 'We’ll email you a link to reset your password.' : 'Use a password you haven’t used elsewhere.'}</p>
    {mode === 'reset' && !session ? <><p role="alert">This reset link is invalid or has expired. Request a new link.</p><button className="button secondary" onClick={() => {onRecovered();changeMode('forgot');}}>Request a new link</button></> : <form key={mode} onSubmit={submit} aria-busy={busy}>
      {mode === 'signup' && <label>Your name<input name="name" autoComplete="name" required maxLength={80}/></label>}
      {mode !== 'reset' && <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>}
      {mode !== 'forgot' && <label>Password<input name="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={mode === 'signin' ? undefined : 8}/></label>}
      {['signup','reset'].includes(mode) && <><label>Confirm password<input name="confirm" type="password" autoComplete="new-password" required minLength={8}/></label><p className="fine-print">At least 8 characters. Your password is handled by Supabase Auth.</p></>}
      <button className="button primary" disabled={busy} type="submit">{busy ? 'Please wait…' : {signin:'Sign in',signup:'Create account',forgot:'Send reset link',reset:'Update password'}[mode]}<Icon name="arrow" size={17}/></button>
    </form>}
    {mode === 'signin' && <button className="text-button" onClick={() => changeMode('forgot')} disabled={busy}>Forgot your password?</button>}
    {!recovery && <p className="account-switch">{mode === 'signin' ? 'New to MindShare?' : 'Already have an account?'} <button className="text-button" disabled={busy} onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>}
    <a className="back-link" href="#/overview">← Back to local preview</a></>}
    {(error || sessionError) && <p className="error-message" role="alert">{error || sessionError}</p>}{message && <p className="account-success" role="status">{message}</p>}
  </section></div></div>;
}
