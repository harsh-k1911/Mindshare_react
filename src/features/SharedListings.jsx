import { useEffect, useRef, useState } from 'react';
import { Modal } from './Forms';
import SharedParticipants from './SharedParticipants';
import { getSupabaseClient } from '../lib/supabase/client';
import { checkAdmin, fetchListings, safeRegistrationUrl, saveListing, setListingClosed } from '../lib/supabase/listings';

function ListingEditor({listing,userId,defaultKind,onClose,onSaved}) {
  const [kind,setKind]=useState(listing?.kind || defaultKind || 'hackathon');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const draftId=useRef(listing?.id || crypto.randomUUID());
  const lock=useRef(false);
  async function submit(event) {
    event.preventDefault();if(lock.current) return;
    const values=Object.fromEntries(new FormData(event.currentTarget));
    lock.current=true;setBusy(true);setError('');
    try {onSaved(await saveListing(getSupabaseClient(),{id:draftId.current,userId,kind,values,editing:!!listing}));}
    catch(failure) {setError(failure.message || 'Could not confirm this listing. Your draft is still here.');}
    finally {lock.current=false;setBusy(false);}
  }
  return <Modal title={listing ? 'Edit listing' : 'Publish a campus listing'} onClose={()=>{if(!busy) onClose();}}><form className="shared-listing-form" onSubmit={submit} onChange={()=>{if(!listing) draftId.current=crypto.randomUUID();}}><fieldset disabled={busy}>
    {!listing && <label>Listing type<select value={kind} onChange={event=>setKind(event.target.value)}><option value="hackathon">Hackathon or competition</option><option value="opportunity">Opportunity</option></select></label>}
    <label>Title<input name="title" defaultValue={listing?.title} required maxLength={120}/></label>
    <label>Description<textarea name="description" defaultValue={listing?.description} required maxLength={5000} rows={5}/></label>
    <label>Organizer or project owner<input name="owner_name" defaultValue={listing?.owner_name} required maxLength={120}/></label>
    <label>Tags<input name="tags" defaultValue={listing?.tags.join(', ')} placeholder="Separate tags with commas"/></label>
    {kind==='hackathon' ? <><label>Event date<input name="event_date" type="date" required defaultValue={listing?.event_date}/></label><label>Registration deadline<input name="deadline" type="date" required defaultValue={listing?.deadline}/></label><label>Format<select name="format" defaultValue={listing?.format || 'On campus'}><option>On campus</option><option>Online</option><option>Hybrid</option></select></label><label>Eligibility<textarea name="eligibility" maxLength={1000} defaultValue={listing?.eligibility}/></label><label>Official registration link<input name="registration_url" type="url" placeholder="https://" defaultValue={listing?.registration_url || ''}/></label></> : <><label>Role<input name="role" required maxLength={120} defaultValue={listing?.role}/></label><label>Time commitment<input name="commitment" required maxLength={200} defaultValue={listing?.commitment} placeholder="e.g. 4 hours per week"/></label><label>Duration<input name="duration" maxLength={120} defaultValue={listing?.duration}/></label><label>Openings<input name="slots" type="number" required min={1} max={100} defaultValue={listing?.slots || 1}/></label></>}
    </fieldset>{error && <p role="alert" className="error-message">{error}</p>}<button className="button primary" disabled={busy}>{busy ? 'Saving…' : listing ? 'Save changes' : 'Publish listing'}</button></form></Modal>;
}
export default function SharedListings({userId,page,listingId,query}) {
  const kind=page==='hackathons' ? 'hackathon' : page==='opportunities' ? 'opportunity' : undefined;
  const adminPage=page==='admin';
  const [data,setData]=useState(null);
  const [error,setError]=useState('');
  const [writeError,setWriteError]=useState('');
  const [revision,setRevision]=useState(0);
  const [editor,setEditor]=useState(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const request=useRef(0);
  const lock=useRef(false);
  useEffect(()=>{
    const version=++request.current;
    const client=getSupabaseClient();
    Promise.all([fetchListings(client,{kind,id:listingId}),checkAdmin(client)]).then(([listings,isAdmin])=>{
      if(version===request.current) setData({listings,isAdmin});
    }).catch(failure=>{if(version===request.current) setError(`Could not load listings. ${failure.message || 'Please try again.'}`);});
    return ()=>{request.current+=1;};
  },[kind,listingId,revision]);
  function refresh() {setError('');setWriteError('');setData(null);setRevision(value=>value+1);}
  function saved(row) {
    setData(current=>({...current,listings:[row,...current.listings.filter(item=>item.id!==row.id)].sort((a,b)=>b.created_at.localeCompare(a.created_at))}));
    setEditor(null);setMessage('Listing saved to the community.');
  }
  async function toggle(row) {
    if(lock.current) return;
    lock.current=true;setBusy(true);setWriteError('');setMessage('');
    try {
      const updated=await setListingClosed(getSupabaseClient(),row.id,!row.closed);
      setData(current=>({...current,listings:current.listings.map(item=>item.id===row.id ? updated : item)}));
      setMessage(updated.closed ? 'Listing closed.' : 'Listing reopened.');
    } catch(failure) {setWriteError(`Could not confirm the status change. ${failure.message || ''} Refresh listings before retrying.`);}
    finally {lock.current=false;setBusy(false);}
  }
  const shown=(data?.listings || []).filter(row=>(!kind || row.kind===kind) && `${row.title} ${row.description} ${row.owner_name} ${row.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <section><div className="page-heading"><span className="eyebrow">{adminPage ? 'CAMPUS ADMINISTRATION' : 'CAMPUS COMMUNITY'}</span><div><h1>{adminPage ? 'Manage campus listings' : kind==='hackathon' ? 'Hackathons & competitions' : 'Campus opportunities'}</h1>{data?.isAdmin && <button className="button primary" disabled={busy} onClick={()=>{setMessage('');setEditor({});}}>Create listing</button>}</div><p>{adminPage ? 'Publish and maintain listings for your community.' : 'Explore listings shared by campus administrators.'}</p></div>
    <div className="feed-toolbar"><span className="muted">Shared listings · newest first</span><button className="button secondary" disabled={busy} onClick={refresh}>Refresh listings</button></div>
    {error && <p className="error-message" role="alert">{error}</p>}{writeError && <p className="error-message" role="alert">{writeError}</p>}{message && <p className="account-success" role="status">{message}</p>}
    {!data ? !error && <p role="status">Loading listings and permissions…</p> : adminPage && !data.isAdmin ? <div className="empty-panel"><h2>Administrator access required</h2><p>Your account can browse listings. Publishing and managing listings requires an administrator role.</p><a className="button secondary" href="#/hackathons">Browse hackathons</a></div> : !shown.length ? <div className="empty-panel"><h2>{listingId ? 'Listing not found.' : query ? 'No matching listings.' : 'No listings yet.'}</h2><p>{data.isAdmin ? 'Publish a listing to get your community involved.' : 'New campus listings will appear here once an administrator publishes them.'}</p></div> : <div className="card-grid">{shown.map(row=><article className="panel shared-listing" key={row.id}><div className="section-heading"><span>{row.owner_name}</span><span className="status">{row.closed ? 'Closed' : 'Open'}</span></div><h2>{row.title}</h2><p className="shared-listing-body">{row.description}</p><dl>{row.kind==='hackathon' ? <><dt>Event date</dt><dd>{row.event_date}</dd><dt>Deadline</dt><dd>{row.deadline}</dd><dt>Format</dt><dd>{row.format}</dd>{row.eligibility && <><dt>Eligibility</dt><dd>{row.eligibility}</dd></>}</> : <><dt>Role</dt><dd>{row.role}</dd><dt>Commitment</dt><dd>{row.commitment}</dd><dt>Duration</dt><dd>{row.duration || 'Discuss with the owner'}</dd><dt>Openings</dt><dd>{row.slots}</dd></>}</dl><div className="chips">{row.tags.map(tag=><span className="chip" key={tag}>{tag}</span>)}</div>{!row.closed && safeRegistrationUrl(row.registration_url) && <a className="button secondary" href={safeRegistrationUrl(row.registration_url)} target="_blank" rel="noopener noreferrer">Official registration ↗</a>}{row.kind==='hackathon' && <SharedParticipants listing={row} userId={userId}/>}{data.isAdmin && <div className="row-actions"><button className="button secondary" disabled={busy || !!writeError} onClick={()=>setEditor(row)}>Edit listing</button><button className="button secondary" disabled={busy || !!writeError} onClick={()=>toggle(row)}>{busy ? 'Saving…' : row.closed ? 'Reopen' : 'Close listing'}</button></div>}</article>)}</div>}
    {editor && data?.isAdmin && <ListingEditor userId={userId} listing={editor.id ? editor : null} defaultKind={kind} onClose={()=>setEditor(null)} onSaved={saved}/>}
  </section>;
}
