import test from 'node:test';
import assert from 'node:assert/strict';
import { accountRedirect, validateAccountForm, submitAccountAction } from '../src/lib/supabase/auth.js';
const location = {origin:'http://127.0.0.1:5173',pathname:'/',search:'?redirect=https://other.example'};
const values = {name:' Student ',email:' student@example.com ',password:' secure password ',confirm:' secure password '};
test('callbacks stay on the app origin and discard incoming query parameters', () => {
  assert.equal(accountRedirect(location),'http://127.0.0.1:5173/#/account');
  assert.equal(accountRedirect(location,true),'http://127.0.0.1:5173/?flow=recovery#/account');
});
test('new passwords require length and matching confirmation, existing passwords do not', () => {
  assert.equal(validateAccountForm('signup',values),null);
  assert.match(validateAccountForm('signup',{...values,confirm:'different'}),/match/);
  assert.match(validateAccountForm('reset',{password:'short',confirm:'short'}),/8/);
  assert.equal(validateAccountForm('signin',{...values,password:'short'}),null);
  assert.equal(validateAccountForm('forgot',{email:values.email}),null);
});
test('signup sends only name metadata and the controlled callback', async () => {
  const client={auth:{signUp:async input=>{assert.deepEqual(input,{email:'student@example.com',password:values.password,options:{data:{name:'Student'},emailRedirectTo:accountRedirect(location)}});return {data:{session:null},error:null};}}};
  assert.deepEqual(await submitAccountAction(client,'signup',values,location),{session:null});
});
test('signin trims email while preserving password characters', async () => {
  const client={auth:{signInWithPassword:async input=>{assert.deepEqual(input,{email:'student@example.com',password:values.password});return {data:{session:'session'},error:null};}}};
  assert.deepEqual(await submitAccountAction(client,'signin',values,location),{session:'session'});
});
test('recovery uses its own callback and updates only the password', async () => {
  const client={auth:{resetPasswordForEmail:async (email,options)=>{assert.equal(email,'student@example.com');assert.equal(options.redirectTo,accountRedirect(location,true));return {data:{},error:null};},updateUser:async input=>{assert.deepEqual(input,{password:values.password});return {data:{},error:null};}}};
  await submitAccountAction(client,'forgot',values,location);
  await submitAccountAction(client,'reset',values,location);
});
test('server failures are surfaced instead of reporting success', async () => {
  const failure=new Error('Invalid credentials');
  await assert.rejects(submitAccountAction({auth:{signInWithPassword:async()=>({error:failure})}},'signin',values,location),failure);
});
