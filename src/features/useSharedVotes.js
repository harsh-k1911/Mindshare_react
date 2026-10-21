import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { fetchVotes, writeVote } from '../lib/supabase/votes';

export default function useSharedVotes(ideaIds, userId) {
  const idsKey = JSON.stringify(ideaIds);
  const [snapshot,setSnapshot] = useState(null);
  const [revision,setRevision] = useState(0);
  const [busy,setBusy] = useState(false);
  const [writeError,setWriteError] = useState('');
  const lock = useRef(false);
  const request = useRef(0);
  useEffect(() => {
    const version = ++request.current;
    const key = `${userId}:${idsKey}:${revision}`;
    fetchVotes(getSupabaseClient(),JSON.parse(idsKey),userId).then(data => {
      if (version===request.current) setSnapshot({key,data,error:''});
    }).catch(() => {
      if (version===request.current) setSnapshot({key,data:{},error:'Votes could not be loaded. Refresh votes to try again.'});
    });
    return () => {request.current += 1;};
  },[idsKey,userId,revision]);
  const current = snapshot?.key === `${userId}:${idsKey}:${revision}` ? snapshot : null;
  async function vote(ideaId, direction) {
    if (lock.current || !current || current.error) return;
    lock.current=true; setBusy(true); setWriteError('');
    const own = current.data[ideaId]?.own || 0;
    try {
      await writeVote(getSupabaseClient(),userId,ideaId,own === direction ? 0 : direction);
    } catch (failure) {
      setWriteError(`We could not confirm your vote. ${failure.message || 'Please try again.'} Refresh votes before trying again.`);
    } finally {
      // Reload after success or failure: a timed-out request may have reached the server.
      setRevision(value=>value+1); setBusy(false); lock.current=false;
    }
  }
  return {votes:current?.data || {},loading:!current,busy,error:writeError || current?.error || '',vote,
    refresh:()=>{setWriteError('');setRevision(value=>value+1);}};
}
