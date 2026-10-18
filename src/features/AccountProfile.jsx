import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { loadProfile, saveProfile } from '../lib/supabase/profile';

export default function AccountProfile({ userId }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadProfile(getSupabaseClient(), userId).then(data => {
      if (active) setProfile(data);
    }).catch(() => {
      if (active) setError('Your profile could not be loaded. Please try again.');
    });
    return () => { active = false; };
  }, [userId, attempt]);
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true); setSaved(false); setError('');
    try {
      const updated = await saveProfile(getSupabaseClient(), userId, values);
      setProfile(updated); setSaved(true);
    } catch (failure) {
      setError(failure.message || 'Your profile could not be saved. Please try again.');
    } finally { setSaving(false); }
  }
  if (!profile) return <section className="account-profile"><h3>Your campus profile</h3>{error ? <><p role="alert">{error}</p><button className="button secondary" onClick={() => {setError('');setAttempt(value => value + 1);}}>Try again</button></> : <p role="status">Loading your profile…</p>}</section>;
  return <section className="account-profile"><h3>Your campus profile</h3><p className="muted">These details are visible to other signed-in members. Only share what you want your campus community to see.</p><form onSubmit={submit} onChange={() => setSaved(false)} aria-busy={saving}>
    <fieldset disabled={saving}>
      <label>Name<input name="name" autoComplete="name" defaultValue={profile.name} required maxLength={80}/></label>
      <label>Department<input name="department" defaultValue={profile.department} maxLength={100} placeholder="e.g. Computer Science"/></label>
      <label>Year or role<input name="year" defaultValue={profile.year} maxLength={40} placeholder="e.g. 3rd year or Faculty"/></label>
      <label>Skills<input name="skills" defaultValue={profile.skills.join(', ')} placeholder="e.g. React, design, Python"/><span className="muted">Separate skills with commas.</span></label>
      <label>About you<textarea name="bio" defaultValue={profile.bio} maxLength={1000} rows={4}/></label>
    </fieldset>
    <button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
    {error && <p className="error-message" role="alert">{error}</p>}
    {saved && <p className="account-success" role="status">Profile saved to your account.</p>}
  </form></section>;
}
