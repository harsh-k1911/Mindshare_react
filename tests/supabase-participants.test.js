import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchParticipants,participationOpen,setParticipation} from '../src/lib/supabase/participants.js';
function fake(results=[{data:[],error:null}]) {
 const calls=[];let index=0;const q={};
 for(const method of ['select','eq','order','range','upsert','delete']) q[method]=(...args)=>{calls.push([method,...args]);return q;};
 q.then=(resolve,reject)=>Promise.resolve(results[Math.min(index++,results.length-1)]).then(resolve,reject);
 return {calls,from(table){calls.push(['from',table]);return q;}};
}
test('joining includes the deadline day but excludes closed, expired, or non-event listings',()=>{
 const event={kind:'hackathon',closed:false,deadline:'2026-10-22'};
 assert.equal(participationOpen(event,'2026-10-22'),true);
 for(const listing of [{...event,closed:true},{...event,deadline:'2026-10-21'},{...event,kind:'opportunity'},{...event,deadline:null}]) assert.equal(participationOpen(listing,'2026-10-22'),false);
});
test('join is duplicate-safe and never updates protected identity columns',async()=>{
 const db=fake();await setParticipation(db,'student','event',true);
 assert.deepEqual(db.calls.find(c=>c[0]==='upsert'),['upsert',{listing_id:'event',user_id:'student'},{onConflict:'listing_id,user_id',ignoreDuplicates:true}]);
});
test('leaving is scoped to the student and event',async()=>{
 const db=fake();await setParticipation(db,'student','event',false);
 assert.deepEqual(db.calls.filter(c=>c[0]==='eq'),[['eq','listing_id','event'],['eq','user_id','student']]);
});
test('participant reads use an explicit profile join without email and paginate',async()=>{
 const db=fake([{data:Array.from({length:1000},(_,user_id)=>({user_id}))},{data:[{user_id:'last'}]}]);
 assert.equal((await fetchParticipants(db,'event')).length,1001);
 const columns=db.calls.find(c=>c[0]==='select')[1];
 assert.match(columns,/ms_participants_user_id_fkey/);assert.doesNotMatch(columns,/email/);
 assert.deepEqual(db.calls.filter(c=>c[0]==='range'),[['range',0,999],['range',1000,1999]]);
});
test('missing identity and invalid actions never query',async()=>{
 const db=fake();await assert.rejects(setParticipation(db,null,'event',true));await assert.rejects(setParticipation(db,'student','event','yes'));assert.equal(db.calls.length,0);
});
test('read and write errors are surfaced rather than reporting success',async()=>{
 const error=new Error('event closed');await assert.rejects(setParticipation(fake([{error}]),'student','event',true),error);
 await assert.rejects(fetchParticipants(fake([{error}]),'event'),error);
});
