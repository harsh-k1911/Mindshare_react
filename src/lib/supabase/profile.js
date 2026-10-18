const columns = 'id,name,department,year,skills,bio';

export function profileFields(values) {
  const name = String(values.name || '').trim();
  const bio = String(values.bio || '').trim();
  if (!name || name.length > 80) throw new Error('Your name must contain 1–80 characters.');
  if (bio.length > 1000) throw new Error('Keep your bio within 1,000 characters.');
  const department = String(values.department || '').trim();
  const year = String(values.year || '').trim();
  const skills = [...new Set(String(values.skills || '').split(',').map(value => value.trim()).filter(Boolean))];
  if (department.length > 100 || year.length > 40) throw new Error('Please shorten your department or year.');
  if (skills.length > 20 || skills.some(value => value.length > 60)) throw new Error('Add up to 20 skills, with at most 60 characters each.');
  // Explicit fields prevent form data from changing identity or privileges.
  return { name, department, year, skills, bio };
}
export async function loadProfile(client, userId) {
  if (!userId) throw new Error('Please sign in to view your profile.');
  const { data, error } = await client.from('ms_profiles').select(columns).eq('id', userId).single();
  if (error) throw error;
  return data;
}
export async function saveProfile(client, userId, values) {
  if (!userId) throw new Error('Please sign in to save your profile.');
  const fields = profileFields(values);
  const { data, error } = await client.from('ms_profiles').update(fields).eq('id', userId).select(columns).single();
  if (error) throw error;
  return data;
}
