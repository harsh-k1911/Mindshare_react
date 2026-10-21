import { ideaColumns } from './ideas.js';

export async function fetchBookmarks(client,userId) {
  if (!userId) throw new Error('Sign in to load saved ideas.');
  const rows=[];
  for(let offset=0; ; offset+=1000) {
    const {data,error}=await client.from('ms_bookmarks').select('idea_id')
      .eq('user_id',userId).not('idea_id','is',null).order('id').range(offset,offset+999);
    if(error) throw error;
    rows.push(...data);
    if(data.length<1000) return rows.map(row=>row.idea_id);
  }
}
export async function fetchSavedIdeas(client,userId) {
  if (!userId) throw new Error('Sign in to load saved ideas.');
  const ideas=[];
  for(let offset=0; ; offset+=1000) {
    const {data,error}=await client.from('ms_bookmarks')
      .select(`idea:ms_ideas!ms_bookmarks_idea_id_fkey(${ideaColumns})`)
      .eq('user_id',userId).not('idea_id','is',null).order('id').range(offset,offset+999);
    if(error) throw error;
    ideas.push(...data.map(row=>row.idea).filter(Boolean));
    if(data.length<1000) return ideas.sort((a,b)=>b.created_at.localeCompare(a.created_at));
  }
}
export async function setIdeaBookmark(client,userId,ideaId,saved) {
  if(!userId || !ideaId) throw new Error('Sign in and choose an idea to save.');
  const table=client.from('ms_bookmarks');
  // Conflict-ignore only needs INSERT permission, leaving identity columns protected.
  const query=saved ? table.upsert({user_id:userId,idea_id:ideaId},{onConflict:'user_id,idea_id',ignoreDuplicates:true})
    : table.delete().eq('user_id',userId).eq('idea_id',ideaId);
  const {error}=await query;
  if(error) throw error;
}
