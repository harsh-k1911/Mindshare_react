import { useEffect, useRef, useState } from 'react';
import { Modal } from './Forms';
import Icon from '../components/Icon';
import useSharedVotes from './useSharedVotes';
import SharedComments from './SharedComments';
import { getSupabaseClient } from '../lib/supabase/client';
import { fetchIdea, fetchIdeas, publishIdea } from '../lib/supabase/ideas';
import { fetchBookmarks, fetchSavedIdeas, setIdeaBookmark } from '../lib/supabase/bookmarks';

function Editor({userId, idea, onClose, onSaved}) {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try { onSaved(await publishIdea(getSupabaseClient(),userId,values,idea?.id)); }
    catch (failure) { setError(failure.message || 'Could not save your idea. Your draft is still here.'); }
    finally { setBusy(false); }
  }
  return <Modal title={idea ? 'Edit your idea' : 'Share an idea'} onClose={() => {if (!busy) onClose();}}><p className="muted">Published ideas are visible to signed-in community members.</p><form className="shared-idea-form" onSubmit={submit}><fieldset disabled={busy}>
    <label>Title<input name="title" required maxLength={120} defaultValue={idea?.title || ''}/></label>
    <label>Your idea<textarea name="description" required maxLength={5000} rows={7} defaultValue={idea?.description || ''}/></label>
    <label>Tags<input name="tags" placeholder="e.g. Startup, Design" defaultValue={idea?.tags.join(', ') || ''}/><small>Up to 5 tags, separated by commas.</small></label>
    <label>Stage<select name="stage" defaultValue={idea?.stage || 'Exploring'}><option>Exploring</option><option>Building</option><option>Launched</option></select></label>
    </fieldset>{error && <p className="error-message" role="alert">{error}</p>}<button className="button primary" disabled={busy}>{busy ? 'Saving…' : idea ? 'Save changes' : 'Publish idea'}</button></form></Modal>;
}
export default function SharedIdeas({userId,query,ideaId,compose,onComposeHandled,savedOnly=false}) {
  const [ideas,setIdeas] = useState(null);
  const requestVersion = useRef(0);
  const [bookmarks,setBookmarks] = useState([]);
  const [bookmarkBusy,setBookmarkBusy] = useState(false);
  const bookmarkLock = useRef(false);
  const [bookmarkError,setBookmarkError] = useState('');
  const [error,setError] = useState('');
  const [attempt,setAttempt] = useState(0);
  const [editor,setEditor] = useState(null);
  const [message,setMessage] = useState('');
  useEffect(() => {
    let active = true;
    const version = ++requestVersion.current;
    const client=getSupabaseClient();
    const feed=savedOnly ? fetchSavedIdeas(client,userId) : ideaId ? fetchIdea(client,ideaId) : fetchIdeas(client);
    Promise.all([feed,fetchBookmarks(client,userId)]).then(([data,saved]) => {
      if(active && version === requestVersion.current) {setIdeas(data);setBookmarks(saved);}
    }).catch(failure => {if(active && version === requestVersion.current) setError(`Ideas could not be loaded. ${failure.message || 'Please try again.'}`);});
    return () => {active=false;};
  },[attempt,userId,savedOnly,ideaId]);
  async function toggleBookmark(idea) {
    if(bookmarkLock.current) return;
    bookmarkLock.current=true;setBookmarkBusy(true);setBookmarkError('');
    try {
      const saved=!bookmarks.includes(idea.id);
      await setIdeaBookmark(getSupabaseClient(),userId,idea.id,saved);
      setBookmarks(current=>saved ? [...new Set([...current,idea.id])] : current.filter(id=>id!==idea.id));
      if(savedOnly && !saved) setIdeas(current=>current.filter(item=>item.id!==idea.id));
    } catch {
      setBookmarkError('Could not confirm your saved ideas. Refresh ideas before trying again.');
    } finally {bookmarkLock.current=false;setBookmarkBusy(false);}
  }
  const voting = useSharedVotes((ideas || []).map(idea => idea.id),userId);
  const open = compose || editor !== null;
  const close = () => {setEditor(null);onComposeHandled();};
  const shown = (ideas || []).filter(idea => ideaId ? idea.id === ideaId : `${idea.title} ${idea.description} ${idea.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <section><div className="page-heading"><span className="eyebrow">CAMPUS COMMUNITY</span><div><h1>{savedOnly ? 'Saved ideas' : 'Ideas & conversations'}</h1><button className="button primary" onClick={() => {setMessage('');setEditor({});}}>Share an idea</button></div><p>{savedOnly ? 'Your private collection of shared ideas. Event and opportunity bookmarks will be connected in a later step.' : 'Ideas published by your community. Share something you would like to build.'}</p></div>
    <div className="feed-toolbar"><span className="muted">{savedOnly ? 'Saved to your account · newest posts first' : ideaId ? 'Shared idea' : 'Latest 100 shared ideas · newest first'}</span><button className="button secondary" disabled={bookmarkBusy} onClick={() => {setError('');setBookmarkError('');setIdeas(null);setAttempt(value => value+1);}}>Refresh ideas</button></div>
    {bookmarkError && <p className="error-message" role="alert">{bookmarkError}</p>}
    {voting.error && <div className="error-message" role="alert">{voting.error} <button className="text-button" onClick={voting.refresh} disabled={voting.busy}>Refresh votes</button></div>}
    {message && <p className="account-success" role="status">{message}</p>}
    {error ? <p className="error-message" role="alert">{error}</p> : ideas === null ? <p role="status">Loading community ideas…</p> : !shown.length ? <div className="empty-panel"><h2>{ideaId ? 'Idea not found.' : query ? 'No ideas match your search.' : savedOnly ? 'No saved ideas yet.' : 'Be the first to share an idea.'}</h2><p>{ideaId ? 'Return to the idea feed to explore recent posts.' : savedOnly ? 'Save an idea from the Ideas page to find it here.' : 'Your published ideas will appear here for other members.'}</p></div> : <div className="ideas-grid">{shown.map(idea => <article className="panel shared-idea" key={idea.id}><div className="section-heading"><span>{idea.author?.name || 'Community member'}</span><span className="status">{idea.stage}</span></div><h2>{idea.title}</h2><p className="shared-idea-body">{idea.description}</p><div className="chips">{idea.tags.map(tag=><span className="chip" key={tag}>{tag}</span>)}</div><div className="shared-vote-controls" aria-label={`Votes for ${idea.title}`}><button className="button secondary small-button" disabled={voting.loading || voting.busy || !!voting.error} aria-label={`Upvote ${idea.title}`} aria-pressed={voting.votes[idea.id]?.own === 1} onClick={() => voting.vote(idea.id,1)}><Icon name="up" size={18}/>Upvote</button><span aria-live="polite">{voting.loading ? 'Loading votes…' : voting.error ? 'Votes unavailable' : `${voting.votes[idea.id]?.score || 0} score`}</span><button className="button secondary small-button" disabled={voting.loading || voting.busy || !!voting.error} aria-label={`Downvote ${idea.title}`} aria-pressed={voting.votes[idea.id]?.own === -1} onClick={() => voting.vote(idea.id,-1)}><Icon name="down" size={18}/>Downvote</button></div><div className="shared-idea-footer"><button className="text-button" aria-label={`${bookmarks.includes(idea.id) ? 'Unsave' : 'Save'} ${idea.title}`} aria-pressed={bookmarks.includes(idea.id)} disabled={bookmarkBusy || !!bookmarkError} onClick={()=>toggleBookmark(idea)}><Icon name="bookmark" size={16}/>{bookmarks.includes(idea.id) ? 'Saved' : 'Save idea'}</button><time dateTime={idea.created_at}>{new Date(idea.created_at).toLocaleDateString()}</time>{idea.author_id === userId && <button className="text-button" onClick={() => {setMessage('');setEditor(idea);}}>Edit idea</button>}</div><SharedComments ideaId={idea.id} userId={userId}/></article>)}</div>}
    {open && <Editor userId={userId} idea={editor?.id ? editor : null} onClose={close} onSaved={saved => {requestVersion.current += 1; setIdeas(current => [...(savedOnly && !bookmarks.includes(saved.id) ? [] : [saved]),...(current || []).filter(idea => idea.id!==saved.id)].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,savedOnly ? undefined : 100));setError('');setMessage(editor?.id ? 'Your changes are saved.' : 'Your idea is published.');close();}}/>}
  </section>;
}
