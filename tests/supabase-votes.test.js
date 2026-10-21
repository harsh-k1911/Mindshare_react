import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeVotes,fetchVotes,writeVote} from '../src/lib/supabase/votes.js';
function fake(pages=[{data:[],error:null}]) {
 const calls=[];let page=0;const q={};
 for(const method of ['select','in','order','range','delete','eq','upsert']) q[method]=(...args)=>{calls.push([method,...args]);return q;};
 q.then=(resolve,reject)=>Promise.resolve(pages[Math.min(page++,pages.length-1)]).then(resolve,reject);
 return {calls,from(table){calls.push(['from',table]);return q;}};
}
test('scores combine both directions while selecting only this member’s vote',()=>{
 assert.deepEqual(summarizeVotes([{idea_id:'a',user_id:'me',value:-1},{idea_id:'a',user_id:'other',value:1},{idea_id:'b',user_id:'other',value:1}],'me'),{a:{score:0,own:-1},b:{score:1,own:0}});
});
test('vote totals paginate beyond the response cap',async()=>{
 const rows=Array.from({length:1000},(_,i)=>({idea_id:'a',user_id:String(i),value:1}));
 const db=fake([{data:rows},{data:[{idea_id:'a',user_id:'me',value:-1}]}]);
 assert.deepEqual(await fetchVotes(db,['a'],'me'),{a:{score:999,own:-1}});
 assert.deepEqual(db.calls.filter(c=>c[0]==='range'),[['range',0,999],['range',1000,1999]]);
});
test('empty feeds do not query and partial failed totals are never returned',async()=>{
 const db=fake(); assert.deepEqual(await fetchVotes(db,[],'me'),{});assert.equal(db.calls.length,0);
 const error=new Error('offline');await assert.rejects(fetchVotes(fake([{error}]),['a'],'me'),error);
});
test('switching votes upserts the unique user/idea pair, removing scopes both IDs',async()=>{
 const db=fake();await writeVote(db,'me','a',1);await writeVote(db,'me','a',-1);await writeVote(db,'me','a',0);
 assert.deepEqual(db.calls.filter(c=>c[0]==='upsert'),[
 ['upsert',{idea_id:'a',user_id:'me',value:1},{onConflict:'idea_id,user_id'}],
 ['upsert',{idea_id:'a',user_id:'me',value:-1},{onConflict:'idea_id,user_id'}]]);
 assert.deepEqual(db.calls.filter(c=>c[0]==='eq'),[['eq','idea_id','a'],['eq','user_id','me']]);
});
test('signed-out and invalid writes never query; database failures are surfaced',async()=>{
 const db=fake();await assert.rejects(writeVote(db,null,'a',1));await assert.rejects(writeVote(db,'me','a',2));assert.equal(db.calls.length,0);
 const error=new Error('permission denied');await assert.rejects(writeVote(fake([{error}]),'me','a',1),error);
});
