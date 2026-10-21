const PAGE_SIZE = 1000;
export function summarizeVotes(rows, userId) {
  const result = {};
  for (const row of rows) {
    const summary = result[row.idea_id] ||= {score:0, own:0};
    summary.score += row.value;
    if (row.user_id === userId) summary.own = row.value;
  }
  return result;
}
export async function fetchVotes(client, ideaIds, userId) {
  if (!ideaIds.length) return {};
  const rows = [];
  // Page through votes so database response limits cannot silently truncate scores.
  for (let offset=0; ; offset+=PAGE_SIZE) {
    const {data,error} = await client.from('ms_votes').select('idea_id,user_id,value')
      .in('idea_id',ideaIds).order('idea_id').order('user_id').range(offset,offset+PAGE_SIZE-1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return summarizeVotes(rows,userId);
  }
}
export async function writeVote(client, userId, ideaId, value) {
  if (!userId || !ideaId) throw new Error('Sign in and select an idea before voting.');
  if (![0,1,-1].includes(value)) throw new Error('Invalid vote.');
  const table = client.from('ms_votes');
  const query = value === 0 ? table.delete().eq('idea_id',ideaId).eq('user_id',userId)
    : table.upsert({idea_id:ideaId,user_id:userId,value},{onConflict:'idea_id,user_id'});
  const {error} = await query;
  if (error) throw error;
}
