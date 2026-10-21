import { useEffect, useId, useRef, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { applyToOpportunity, fetchApplications, reviewApplication, withdrawApplication } from '../lib/supabase/applications';

function Applications({listing,userId,isAdmin}) {
  const [result,setResult]=useState(null);
  const [revision,setRevision]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [message,setMessage]=useState('');
  const draftId=useRef(crypto.randomUUID());
  const request=useRef(0);
  const lock=useRef(false);
  useEffect(()=>{
    const version=++request.current;
    fetchApplications(getSupabaseClient(),{listingId:listing.id,userId,review:isAdmin}).then(rows=>{
      if(version===request.current) setResult({revision,rows});
    }).catch(failure=>{if(version===request.current) setResult({revision,error:failure.message || 'Applications could not be loaded.'});});
    return ()=>{request.current+=1;};
  },[listing.id,userId,isAdmin,revision]);
  const current=result?.revision===revision ? result : null;
  const own=current?.rows?.find(row=>row.user_id===userId);
  async function write(action,success,onSuccess) {
    if(lock.current || !current || current.error) return;
    lock.current=true;setBusy(true);setError('');setNotice('');
    try {await action();onSuccess?.();setNotice(success);}
    catch(failure) {setError(`Could not confirm this change. ${failure.message || 'Please try again.'} Refreshing applications before you retry.`);}
    finally {setRevision(value=>value+1);setBusy(false);lock.current=false;}
  }
  function submit(event) {
    event.preventDefault();
    write(()=>applyToOpportunity(getSupabaseClient(),{id:draftId.current,listingId:listing.id,userId,message}),'Application sent.',()=>{setMessage('');draftId.current=crypto.randomUUID();});
  }
  return <section className="shared-applications"><div className="section-heading"><h3>{isAdmin ? 'Applications' : 'Your application'}</h3><button className="text-button" disabled={busy} onClick={()=>{setError('');setNotice('');setRevision(value=>value+1);}}>Refresh applications</button></div>
    <p className="muted">Your message is visible only to you and campus administrators.</p>
    {error && <p role="alert" className="error-message">{error}</p>}
    {!current ? <p role="status">Loading applications…</p> : current.error ? <p role="alert" className="error-message">{current.error}</p> : <>
      {own ? <div className="application-entry"><h4>Your application · {own.status}</h4><p>{own.message}</p><button className="button secondary" disabled={busy} onClick={()=>write(()=>withdrawApplication(getSupabaseClient(),{id:own.id,listingId:listing.id,userId}),'Application withdrawn.')}>Withdraw application</button></div> : listing.closed ? <p>This opportunity is closed to new applications.</p> : <form onSubmit={submit}><label>How would you like to help?<textarea required maxLength={2000} rows={4} disabled={busy} value={message} onChange={event=>{setMessage(event.target.value);draftId.current=crypto.randomUUID();}} placeholder="Introduce yourself and describe your relevant skills or interests."/></label><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Send application'}</button></form>}
      {isAdmin && <div className="application-review"><h4>Review requests ({current.rows.length})</h4><p className="muted">Accept, decline, or return a request to pending. Openings are informational; accepting a request does not automatically close this listing.</p>{!current.rows.length && <p>No applications yet.</p>}{current.rows.map(row=><article className="application-entry" key={row.id}><strong>{row.profile?.name || 'Community member'}{row.user_id===userId ? ' (you)' : ''}</strong><p className="muted">{[row.profile?.department,row.profile?.year,...(row.profile?.skills || [])].filter(Boolean).join(' · ')}</p><span className="status">{row.status}</span><p>{row.message}</p><div className="row-actions">{['Accepted','Declined','Pending'].map(status=><button key={status} className="button secondary" disabled={busy || row.status===status} onClick={()=>write(()=>reviewApplication(getSupabaseClient(),{id:row.id,listingId:listing.id,status,previousStatus:row.status}),'Review saved.')}>{status==='Accepted' ? 'Accept' : status==='Declined' ? 'Decline' : 'Return to pending'}</button>)}</div></article>)}</div>}
    </>}
    {notice && <p role="status" className="account-success">{notice}</p>}
  </section>;
}
export default function SharedApplications({listing,userId,isAdmin}) {
  const [expanded,setExpanded]=useState(false);
  const [opened,setOpened]=useState(false);
  const region=useId();
  return <div className="participation-section"><button className="text-button" aria-expanded={expanded} aria-controls={region} onClick={()=>{setExpanded(value=>!value);setOpened(true);}}>{expanded ? 'Hide applications' : isAdmin ? 'Apply / review applications' : 'Apply / view your application'}</button><div hidden={!expanded} id={region}>{opened && <Applications key={`${listing.id}:${userId}:${isAdmin}`} listing={listing} userId={userId} isAdmin={isAdmin}/>}</div></div>;
}
