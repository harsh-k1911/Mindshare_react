import { useEffect, useId, useRef, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { commentThreads, fetchComments, postComment } from '../lib/supabase/comments';

function Discussion({ideaId,userId}) {
  const [rows,setRows]=useState(null);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  const [reply,setReply]=useState(null);
  const [body,setBody]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const draft=useRef(crypto.randomUUID());
  const lock=useRef(false);
  const version=useRef(0);
  const inputId=useId();
  useEffect(()=>{
    const request=++version.current;
    fetchComments(getSupabaseClient(),ideaId).then(data=>{if(request===version.current) setRows(data);})
      .catch(failure=>{if(request===version.current) setError(`Comments could not be loaded. ${failure.message || 'Please try again.'}`);});
    return ()=>{version.current+=1;};
  },[ideaId,revision]);
  async function submit(event) {
    event.preventDefault();
    if(lock.current) return;
    lock.current=true;setBusy(true);setError('');setMessage('');
    try {
      const saved=await postComment(getSupabaseClient(),{id:draft.current,ideaId,userId,parentId:reply?.id || null,body});
      version.current+=1;
      setRows(current=>[...(current || []).filter(row=>row.id!==saved.id),saved]);
      setBody('');setReply(null);draft.current=crypto.randomUUID();setMessage('Comment posted.');
      setRevision(value=>value+1);
    } catch(failure) {setError(failure.message || 'Could not confirm your comment. Your draft is still here; retry to check it.');}
    finally {lock.current=false;setBusy(false);}
  }
  function chooseReply(comment) {
    setReply(comment);draft.current=crypto.randomUUID();setMessage('');
    document.getElementById(inputId)?.focus();
  }
  const renderBody=row=><><strong>{row.author?.name || 'Community member'}</strong><time dateTime={row.created_at}>{new Date(row.created_at).toLocaleDateString()}</time><p>{row.body}</p></>;
  return <div className="shared-discussion"><div className="section-heading"><h3>Discussion</h3><button className="text-button" disabled={busy} onClick={()=>{setError('');setRevision(value=>value+1);}}>Refresh comments</button></div>
    {error && <p role="alert" className="error-message">{error}</p>}
    {rows===null ? <p role="status">{error ? 'Comments unavailable.' : 'Loading comments…'}</p> : !rows.length ? <p className="muted">Start the conversation.</p> : <div>{commentThreads(rows).map(row=><article className="shared-comment" key={row.id}>{renderBody(row)}<button className="text-button" disabled={busy} onClick={()=>chooseReply(row)}>Reply to {row.author?.name || 'member'}</button>{row.replies.map(child=><div className="shared-reply" key={child.id}>{renderBody(child)}</div>)}</article>)}</div>}
    <form onSubmit={submit}><label htmlFor={inputId}>{reply ? `Replying to ${reply.author?.name || 'member'}` : 'Add a comment'}</label>{reply && <button type="button" className="text-button" disabled={busy} onClick={()=>chooseReply(null)}>Cancel reply</button>}
      <textarea id={inputId} value={body} onChange={event=>{setBody(event.target.value);draft.current=crypto.randomUUID();setMessage('');}} disabled={busy} required maxLength={2000} rows={3}/>
      <button className="button primary small-button" disabled={busy || !body.trim()}>{busy ? 'Posting…' : reply ? 'Post reply' : 'Post comment'}</button>
      {message && <p role="status" className="account-success">{message}</p>}
    </form></div>;
}
export default function SharedComments({ideaId,userId}) {
  const [expanded,setExpanded]=useState(false);
  const [opened,setOpened]=useState(false);
  const region=useId();
  return <div className="shared-comments"><button className="text-button" aria-expanded={expanded} aria-controls={region} onClick={()=>{setOpened(true);setExpanded(value=>!value);}}>{expanded ? 'Hide discussion' : 'Comments & replies'}</button><div id={region} hidden={!expanded}>{opened && <Discussion key={`${ideaId}:${userId}`} ideaId={ideaId} userId={userId}/>}</div></div>;
}
