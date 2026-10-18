import test from 'node:test';
import assert from 'node:assert/strict';
import { profileFields, loadProfile, saveProfile } from '../src/lib/supabase/profile.js';

test('profile writes normalize fields and discard identity and privilege inputs', () => {
  assert.deepEqual(profileFields({name:' Harsh ',skills:'React, design, React, ',id:'other-user',admin:true}), {name:'Harsh',department:'',year:'',skills:['React','design'],bio:''});
});
test('profile rejects blank names, excessive bios, and too many skills', () => {
  assert.throws(() => profileFields({name:'  '}), /name/);
  assert.throws(() => profileFields({name:'Harsh',bio:'x'.repeat(1001)}), /bio/);
  assert.throws(() => profileFields({name:'Harsh',skills:Array.from({length:21},(_,i)=>`skill${i}`).join(',')}), /20 skills/);
});
function fakeClient(result) {
  const calls=[];
  const query={select(...args){calls.push(['select',...args]);return this;},eq(...args){calls.push(['eq',...args]);return this;},update(...args){calls.push(['update',...args]);return this;},async single(){return result;}};
  return {calls,from(table){calls.push(['from',table]);return query;}};
}
test('load and save both constrain queries to the signed-in user ID', async () => {
  const client=fakeClient({data:{id:'student'},error:null});
  await loadProfile(client,'student');
  await saveProfile(client,'student',{name:'Student'});
  assert.equal(client.calls.filter(call => call[0]==='eq' && call[1]==='id' && call[2]==='student').length,2);
  assert.deepEqual(client.calls.find(call=>call[0]==='update')[1],{name:'Student',department:'',year:'',skills:[],bio:''});
});
test('failed writes cannot report success, and signed-out calls do not query', async () => {
  const failure=new Error('permission denied');
  await assert.rejects(saveProfile(fakeClient({error:failure}),'student',{name:'Student'}),failure);
  const client=fakeClient({data:null});
  await assert.rejects(loadProfile(client,null),/sign in/);
  await assert.rejects(saveProfile(client,null,{name:'Student'}),/sign in/);
  assert.equal(client.calls.length,0);
});
