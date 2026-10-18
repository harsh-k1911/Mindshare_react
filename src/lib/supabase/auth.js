export function accountRedirect(location, recovery = false) {
  const url = new URL(location.pathname, location.origin);
  if (recovery) url.searchParams.set('flow', 'recovery');
  url.hash = '/account';
  return url.href;
}
export function validateAccountForm(mode, values) {
  if (mode === 'signup' && !values.name?.trim()) return 'Please enter your name.';
  if (mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email?.trim() || '')) return 'Please enter a valid email address.';
  if (mode !== 'forgot' && !values.password) return 'Please enter your password.';
  if (['signup', 'reset'].includes(mode) && values.password.length < 8) return 'Use a password with at least 8 characters.';
  if (['signup', 'reset'].includes(mode) && values.password !== values.confirm) return 'The passwords do not match.';
  return null;
}
export async function submitAccountAction(client, mode, values, location) {
  const email = values.email?.trim();
  let result;
  if (mode === 'signup') result = await client.auth.signUp({email,password:values.password,options:{data:{name:values.name.trim()},emailRedirectTo:accountRedirect(location)}});
  else if (mode === 'forgot') result = await client.auth.resetPasswordForEmail(email,{redirectTo:accountRedirect(location,true)});
  else if (mode === 'reset') result = await client.auth.updateUser({password:values.password});
  else result = await client.auth.signInWithPassword({email,password:values.password});
  if (result.error) throw result.error;
  return result.data;
}

export function accountErrorMessage(error) {
  if (error?.code === 'over_email_send_rate_limit' || /email rate limit exceeded/i.test(error?.message || '')) {
    return 'Email sending is temporarily limited. Check your inbox and spam folder for an earlier confirmation email. If none arrived, wait before trying again. Repeated attempts will not bypass the limit.';
  }
  return error?.message || 'We couldn’t complete that request. Please try again.';
}
