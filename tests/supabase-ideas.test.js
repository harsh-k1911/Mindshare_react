import test from 'node:test';
import assert from 'node:assert/strict';
import {ideaFields,fetchIdeas,publishIdea} from '../src/lib/supabase/ideas.js';
const values={title:' Campus garden ',description:' Build it together ',tags:'Green, Green, Design',stage:'Building'};
function client(result={data:[],error:null}) {
 const calls=[];
 const query={};
 for(const method of ['select','order','limit','insert','update','eq']) query[method]=(...args)=>{calls.push([method,...args]);return query;};
 query.single=async()=>result;
 query.then=(resolve,reject)=>Promise.resolve(result).then(resolve,reject);
 return {calls,from(table){calls.push(['from',table]);return query;}};
}
test('idea fields are normalized and identity cannot come from the form',()=>{
 assert.deepEqual(ideaFields({...values,author_id:'someone-else',id:'forged'}),{title:'Campus garden',description:'Build it together',tags:['Green','Design'],stage:'Building'});
});
test('invalid or oversized content is rejected before any request',async()=>{
 for(const invalid of [{title:' '},{description:'x'.repeat(5001)},{stage:'Admin'},{tags:'1,2,3,4,5,6'}]) {
  const db=client();await assert.rejects(publishIdea(db,'me',{...values,...invalid}));assert.equal(db.calls.length,0);
 }
});
test('create uses signed-in author and edit constrains both post and owner',async()=>{
 const db=client({data:{id:'post'},error:null});
 await publishIdea(db,'me',values);
 assert.equal(db.calls.find(c=>c[0]==='insert')[1].author_id,'me');
 await publishIdea(db,'me',values,'post');
 assert.ok(db.calls.some(c=>c[0]==='eq'&&c[1]==='author_id'&&c[2]==='me'));
 assert.ok(db.calls.some(c=>c[0]==='eq'&&c[1]==='id'&&c[2]==='post'));
 assert.equal(db.calls.find(c=>c[0]==='update')[1].author_id,undefined);
});
test('database failures propagate and signed-out writes never run',async()=>{
 const failure=new Error('permission denied');const db=client({error:failure});
 await assert.rejects(fetchIdeas(db),failure);
 await assert.rejects(publishIdea(db,'me',values),failure);
 const signedOut=client();await assert.rejects(publishIdea(signedOut,null,values),/Sign in/);assert.equal(signedOut.calls.length,0);
});

test('feed explicitly joins the author relationship instead of ambiguous profile relationships',async()=>{
 const db=client(); await fetchIdeas(db);
 assert.match(db.calls.find(call=>call[0]==='select')[1], /ms_profiles!ms_ideas_author_id_fkey/);
});
