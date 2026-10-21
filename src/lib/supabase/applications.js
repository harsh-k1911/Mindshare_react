const columns='id,listing_id,user_id,message,status,created_at,profile:ms_profiles!ms_applications_user_id_fkey(name,department,year,skills)';
export async function fetchApplications(client,{listingId,userId,review=false}) {
  if(!listingId || !userId) throw new Error('Sign in and choose an opportunity.');
  const rows=[];
  for(let offset=0; ; offset+=1000) {
    let query=client.from('ms_applications').select(columns).eq('listing_id',listingId);
    // RLS independently restricts review reads to administrators.
    if(!review) query=query.eq('user_id',userId);
    const {data,error}=await query.order('created_at').order('id').range(offset,offset+999);
    if(error) throw error;
    rows.push(...data);
    if(data.length<1000) return rows;
  }
}
export async function applyToOpportunity(client,{id,listingId,userId,message}) {
  const text=String(message || '').trim();
  if(!id || !listingId || !userId) throw new Error('Sign in and choose an opportunity.');
  if(!text || text.length>2000) throw new Error('Write a message of 1–2,000 characters.');
  const {data,error}=await client.from('ms_applications').insert({id,listing_id:listingId,user_id:userId,message:text,status:'Pending'}).select(columns).single();
  if(error?.code==='23505') {
    const existing=await client.from('ms_applications').select(columns).eq('id',id).eq('listing_id',listingId).eq('user_id',userId).single();
    if(existing.error) throw new Error('An application may already exist. Refresh applications before trying again.');
    return existing.data;
  }
  if(error) throw error;
  return data;
}
export async function withdrawApplication(client,{id,listingId,userId}) {
  if(!id || !listingId || !userId) throw new Error('Choose your application.');
  const {error}=await client.from('ms_applications').delete().eq('id',id).eq('listing_id',listingId).eq('user_id',userId);
  if(error) throw error;
}
export async function reviewApplication(client,{id,listingId,status,previousStatus}) {
  const statuses=['Pending','Accepted','Declined'];
  if(!id || !listingId || !statuses.includes(status) || !statuses.includes(previousStatus)) throw new Error('Choose a valid review status.');
  // Detect another administrator's intervening decision rather than silently overwriting it.
  const {data,error}=await client.from('ms_applications').update({status}).eq('id',id).eq('listing_id',listingId).eq('status',previousStatus).select(columns).single();
  if(error) throw error;
  return data;
}
