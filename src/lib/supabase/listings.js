export const listingColumns='id,kind,title,description,owner_name,tags,event_date,deadline,format,eligibility,registration_url,role,commitment,duration,slots,closed,created_by,created_at';
const formats=['On campus','Online','Hybrid'];
function date(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed=new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10)===value;
}
export function safeRegistrationUrl(value) {
  if(!value) return null;
  try {const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password ? url.href : null;} catch {return null;}
}
export function listingFields(values,kind) {
  if(!['hackathon','opportunity'].includes(kind)) throw new Error('Choose a valid listing type.');
  const text=key=>String(values[key] || '').trim();
  const title=text('title'),description=text('description'),owner_name=text('owner_name');
  if(!title || title.length>120) throw new Error('Title must contain 1–120 characters.');
  if(!description || description.length>5000) throw new Error('Description must contain 1–5,000 characters.');
  if(!owner_name || owner_name.length>120) throw new Error('Add an organizer or project owner, up to 120 characters.');
  const tags=[...new Set(text('tags').split(',').map(tag=>tag.trim()).filter(Boolean))];
  if(tags.length>8 || tags.some(tag=>tag.length>40)) throw new Error('Use up to 8 tags of 40 characters each.');
  const fields={title,description,owner_name,tags};
  if(kind==='hackathon') {
    const event_date=text('event_date'),deadline=text('deadline');
    if(!date(event_date) || !date(deadline) || deadline>event_date) throw new Error('Choose valid dates with the deadline on or before the event.');
    if(!formats.includes(values.format)) throw new Error('Choose an event format.');
    const raw=text('registration_url'),registration_url=safeRegistrationUrl(raw);
    if(raw && !registration_url) throw new Error('Use a valid HTTPS registration link without embedded credentials.');
    if(text('eligibility').length>1000) throw new Error('Keep eligibility within 1,000 characters.');
    return {...fields,event_date,deadline,format:values.format,eligibility:text('eligibility'),registration_url};
  }
  const role=text('role'),commitment=text('commitment'),duration=text('duration'),slots=Number(values.slots);
  if(!role || role.length>120 || !commitment || commitment.length>200 || duration.length>120) throw new Error('Add a role and time commitment within the field limits.');
  if(!Number.isInteger(slots) || slots<1 || slots>100) throw new Error('Choose between 1 and 100 openings.');
  return {...fields,role,commitment,duration,slots};
}
export async function checkAdmin(client) {
  const {data,error}=await client.rpc('ms_is_admin');
  if(error) throw error;
  return data===true;
}
export async function fetchListings(client,{kind,id}={}) {
  const rows=[];
  for(let offset=0; ; offset+=1000) {
    let query=client.from('ms_listings').select(listingColumns);
    if(kind) query=query.eq('kind',kind);
    if(id) query=query.eq('id',id);
    const {data,error}=await query.order('created_at',{ascending:false}).order('id').range(offset,offset+999);
    if(error) throw error;
    rows.push(...data);
    if(data.length<1000) return rows;
  }
}
export async function saveListing(client,{userId,id,kind,values,editing=false}) {
  if(!userId || !id) throw new Error('Sign in before managing listings.');
  const fields=listingFields(values,kind);
  const table=client.from('ms_listings');
  const query=editing ? table.update(fields).eq('id',id).eq('kind',kind) : table.insert({...fields,id,kind,created_by:userId});
  const result=await query.select(listingColumns).single();
  if(!editing && result.error?.code==='23505') {
    const existing=await client.from('ms_listings').select(listingColumns).eq('id',id).eq('created_by',userId).single();
    if(existing.error) throw existing.error;
    return existing.data;
  }
  if(result.error) throw result.error;
  return result.data;
}
export async function setListingClosed(client,id,closed) {
  if(!id || typeof closed!=='boolean') throw new Error('Choose a listing and valid status.');
  const {data,error}=await client.from('ms_listings').update({closed}).eq('id',id).select(listingColumns).single();
  if(error) throw error;
  return data;
}
