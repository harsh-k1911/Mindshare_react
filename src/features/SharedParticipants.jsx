import { useEffect, useId, useRef, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { fetchParticipants, participationOpen, setParticipation } from '../lib/supabase/participants';

function ParticipantList({listing,userId}) {
  const [result,setResult]=useState(null);
  const [revision,setRevision]=useState(0);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [writeError,setWriteError]=useState('');
  const request=useRef(0);
  const lock=useRef(false);
  useEffect(()=>{
    const version=++request.current;
    fetchParticipants(getSupabaseClient(),listing.id).then(rows=>{
      if(version===request.current) setResult({revision,rows,error:''});
    }).catch(failure=>{
      if(version===request.current) setResult({revision,rows:[],error:`Participants could not be loaded. ${failure.message || 'Please try again.'}`});
    });
    return ()=>{request.current+=1;};
  },[listing.id,revision]);
  const current=result?.revision===revision ? result : null;
  const joined=current?.rows.some(row=>row.user_id===userId) || false;
  const open=participationOpen(listing);
  async function toggle() {
    if(lock.current || !current || current.error) return;
    lock.current=true;setBusy(true);setWriteError('');setMessage('');
    try {
      await setParticipation(getSupabaseClient(),userId,listing.id,!joined);
      setMessage(joined ? 'You left the campus participant list.' : 'You joined the campus participant list. Complete official registration separately.');
    } catch(failure) {
      setWriteError(`Could not confirm the change. ${failure.message || 'Please try again.'} The participant list is being refreshed.`);
    } finally {
      setRevision(value=>value+1);lock.current=false;setBusy(false);
    }
  }
  return <section className="shared-participants"><div className="section-heading"><h3>Campus participants</h3><button className="text-button" disabled={busy} onClick={()=>{setWriteError('');setMessage('');setRevision(value=>value+1);}}>Refresh participants</button></div>
    <p className="muted">Joining shows your name, department, year and skills to signed-in members. This does not register you with the event organizer.</p>
    {writeError && <p className="error-message" role="alert">{writeError}</p>}
    {!current ? <p role="status">Loading participants…</p> : current.error ? <p className="error-message" role="alert">{current.error}</p> : <><p>{current.rows.length} {current.rows.length===1 ? 'campus participant' : 'campus participants'}</p>
      {current.rows.length ? <ul className="participant-list">{current.rows.map(row=><li key={row.user_id}><strong>{row.profile?.name || 'Community member'}{row.user_id===userId ? ' (you)' : ''}</strong><span>{[row.profile?.department,row.profile?.year].filter(Boolean).join(' · ')}</span>{!!row.profile?.skills?.length && <span>{row.profile.skills.join(', ')}</span>}</li>)}</ul> : <p className="muted">Be the first to join from your campus.</p>}
      <button className="button secondary" disabled={busy || (!joined && !open)} onClick={toggle}>{busy ? 'Saving…' : joined ? 'Leave participant list' : open ? 'Join participant list' : 'Joining closed'}</button>
      {!open && <p className="muted">This listing is closed or its joining deadline has passed. Existing participants can still leave.</p>}
    </>}
    {message && <p className="account-success" role="status">{message}</p>}
  </section>;
}
export default function SharedParticipants({listing,userId}) {
  const [expanded,setExpanded]=useState(false);
  const [opened,setOpened]=useState(false);
  const region=useId();
  return <div className="participation-section"><button className="text-button" aria-expanded={expanded} aria-controls={region} onClick={()=>{setExpanded(value=>!value);setOpened(true);}}>{expanded ? 'Hide participants' : 'See campus participants / join'}</button><div hidden={!expanded} id={region}>{opened && <ParticipantList key={`${listing.id}:${userId}`} listing={listing} userId={userId}/>}</div></div>;
}
