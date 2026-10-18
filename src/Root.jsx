import { useEffect, useState } from 'react';
import App from './App';
import Account from './features/Account';
import { getSupabaseClient, supabaseConfig } from './lib/supabase/client';

export default function Root() {
  const [accountPage,setAccountPage] = useState(() => location.hash.startsWith('#/account') || new URLSearchParams(location.search).has('code'));
  const [session,setSession] = useState(null);
  const [loading,setLoading] = useState(supabaseConfig.status === 'ready');
  const [sessionError,setSessionError] = useState('');
  const [recovery,setRecovery] = useState(() => new URLSearchParams(location.search).get('flow') === 'recovery');
  useEffect(() => {
    if (accountPage) document.title = 'Your account · MindShare';
  },[accountPage]);
  useEffect(() => {
    const onHash = () => setAccountPage(location.hash.startsWith('#/account'));
    addEventListener('hashchange',onHash);
    return () => removeEventListener('hashchange',onHash);
  },[]);
  useEffect(() => {
    if (supabaseConfig.status !== 'ready') return;
    let active = true;
    let authEventReceived = false;
    const client = getSupabaseClient();
    const {data:{subscription}} = client.auth.onAuthStateChange((event,next) => {
      if (!active) return;
      authEventReceived = true;
      setSession(next); setLoading(false);
      if (next) setSessionError('');
      if (event === 'PASSWORD_RECOVERY') { setRecovery(true); setAccountPage(true); }
    });
    client.auth.getSession().then(({data,error}) => {
      if (!active) return;
      if (!authEventReceived) setSession(data.session);
      if (error) setSessionError(error.message);
      setLoading(false);
    }).catch(() => {if(active){setSessionError('Could not restore your session. Please reload and try again.');setLoading(false);}});
    return () => {active=false;subscription.unsubscribe();};
  },[]);
  function recovered() {
    setRecovery(false);
    const url = new URL(location.href); url.searchParams.delete('flow'); url.searchParams.delete('code');
    history.replaceState(null,'',url);
  }
  return accountPage ? <Account session={session} loading={loading} sessionError={sessionError} recovery={recovery} onRecovered={recovered}/> : <App accountSession={session}/>;
}
