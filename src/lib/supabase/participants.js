export function participationOpen(listing, today=new Date().toISOString().slice(0,10)) {
  return listing.kind==='hackathon' && !listing.closed && !!listing.deadline && listing.deadline>=today;
}
export async function fetchParticipants(client,listingId) {
  if(!listingId) throw new Error('Choose a hackathon.');
  const rows=[];
  for(let offset=0; ; offset+=1000) {
    const {data,error}=await client.from('ms_participants')
      .select('listing_id,user_id,created_at,profile:ms_profiles!ms_participants_user_id_fkey(name,department,year,skills)')
      .eq('listing_id',listingId).order('created_at').order('user_id').range(offset,offset+999);
    if(error) throw error;
    rows.push(...data);
    if(data.length<1000) return rows;
  }
}
export async function setParticipation(client,userId,listingId,joined) {
  if(!userId || !listingId || typeof joined!=='boolean') throw new Error('Sign in and choose a hackathon.');
  const table=client.from('ms_participants');
  const query=joined ? table.upsert({listing_id:listingId,user_id:userId},{onConflict:'listing_id,user_id',ignoreDuplicates:true})
    : table.delete().eq('listing_id',listingId).eq('user_id',userId);
  const {error}=await query;
  if(error) throw error;
}
