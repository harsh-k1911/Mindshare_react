const columns = 'id,idea_id,author_id,parent_id,body,created_at,author:ms_profiles!ms_comments_author_id_fkey(name)';
export async function fetchComments(client, ideaId) {
  const rows=[];
  for(let offset=0; ; offset+=1000) {
    const {data,error}=await client.from('ms_comments').select(columns).eq('idea_id',ideaId)
      .order('created_at').order('id').range(offset,offset+999);
    if(error) throw error;
    rows.push(...data);
    if(data.length<1000) return rows;
  }
}
export async function postComment(client,{id,ideaId,userId,parentId=null,body}) {
  const text=String(body || '').trim();
  if(!userId || !ideaId || !id) throw new Error('Sign in and choose an idea before commenting.');
  if(!text || text.length>2000) throw new Error('Write a comment of 1–2,000 characters.');
  const {data,error}=await client.from('ms_comments').insert({id,idea_id:ideaId,author_id:userId,parent_id:parentId,body:text}).select(columns).single();
  if(error?.code==='23505') {
    // Retry of an uncertain network result: retrieve this draft instead of posting twice.
    const existing=await client.from('ms_comments').select(columns).eq('id',id).eq('idea_id',ideaId).eq('author_id',userId).single();
    if(existing.error) throw existing.error;
    return existing.data;
  }
  if(error) throw error;
  return data;
}
export function commentThreads(rows) {
  const replies=new Map();
  for(const row of rows) if(row.parent_id) {
    if(!replies.has(row.parent_id)) replies.set(row.parent_id,[]);
    replies.get(row.parent_id).push(row);
  }
  return rows.filter(row=>!row.parent_id).map(row=>({...row,replies:replies.get(row.id)||[]}));
}
