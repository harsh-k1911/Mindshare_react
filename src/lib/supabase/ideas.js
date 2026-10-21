export const ideaColumns = 'id,author_id,title,description,tags,stage,created_at,author:ms_profiles!ms_ideas_author_id_fkey(name)';
export function ideaFields(values) {
  const title = String(values.title || '').trim();
  const description = String(values.description || '').trim();
  const stage = values.stage || 'Exploring';
  const tags = [...new Set(String(values.tags || '').split(',').map(tag => tag.trim()).filter(Boolean))];
  if (!title || title.length > 120) throw new Error('Add a title of 1–120 characters.');
  if (!description || description.length > 5000) throw new Error('Add a description of 1–5,000 characters.');
  if (!['Exploring', 'Building', 'Launched'].includes(stage)) throw new Error('Choose a valid stage.');
  if (tags.length > 5 || tags.some(tag => tag.length > 30)) throw new Error('Use up to 5 tags, each no longer than 30 characters.');
  return {title, description, tags, stage};
}
export async function fetchIdeas(client) {
  const {data,error} = await client.from('ms_ideas').select(ideaColumns).order('created_at',{ascending:false}).limit(100);
  if (error) throw error;
  return data;
}
export async function publishIdea(client,userId,values,ideaId) {
  if (!userId) throw new Error('Sign in to publish an idea.');
  const fields = ideaFields(values);
  const table = client.from('ms_ideas');
  const query = ideaId ? table.update(fields).eq('id',ideaId).eq('author_id',userId) : table.insert({...fields,author_id:userId});
  const {data,error} = await query.select(ideaColumns).single();
  if (error) throw error;
  return data;
}

export async function fetchIdea(client,id) {
  const {data,error}=await client.from('ms_ideas').select(ideaColumns).eq('id',id).maybeSingle();
  if(error) throw error;
  return data ? [data] : [];
}
