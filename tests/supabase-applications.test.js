import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchApplications,applyToOpportunity,withdrawApplication,reviewApplication} from '../src/lib/supabase/applications.js';
function fake(results=[{data:[],error:null}]) {
 const calls=[];let index=0;const q={};
 for(const method of ['select','eq','order','range','insert','update','delete','single']) q[method]=(...args)=>{calls.push([method,...args]);return q;};
 q.then=(resolve,reject)=>Promise.resolve(results[Math.min(index++,results.length-1)]).then(resolve,reject);
 return {calls,from(table){calls.push(['from',table]);return q;}};
}
const draft={id:'draft',listingId:'opportunity',userId:'student',message:' I can help. '};
test('student reads are scoped to their own opportunity requests',async()=>{
 const db=fake();await fetchApplications(db,draft);
 assert.deepEqual(db.calls.filter(c=>c[0]==='eq'),[['eq','listing_id','opportunity'],['eq','user_id','student']]);
 assert.match(db.calls.find(c=>c[0]==='select')[1],/ms_applications_user_id_fkey/);
 assert.doesNotMatch(db.calls.find(c=>c[0]==='select')[1],/email/);
});
test('review reads paginate and remain scoped to one listing',async()=>{
 const db=fake([{data:Array(1000).fill({})},{data:[{}]}]);
 assert.equal((await fetchApplications(db,{...draft,review:true})).length,1001);
 assert.deepEqual(db.calls.filter(c=>c[0]==='range'),[['range',0,999],['range',1000,1999]]);
 assert.deepEqual(db.calls.filter(c=>c[0]==='eq'),[['eq','listing_id','opportunity'],['eq','listing_id','opportunity']]);
});
test('applications start pending and cannot inject identity or review fields',async()=>{
 const db=fake([{data:{id:'draft'}}]);await applyToOpportunity(db,{...draft,status:'Accepted',created_at:'fake'});
 assert.deepEqual(db.calls.find(c=>c[0]==='insert'),['insert',{id:'draft',listing_id:'opportunity',user_id:'student',message:'I can help.',status:'Pending'}]);
});
test('invalid message or identity never writes',async()=>{
 const db=fake();for(const change of [{message:' '},{message:'x'.repeat(2001)},{userId:null},{id:null},{listingId:null}]) await assert.rejects(applyToOpportunity(db,{...draft,...change}));
 assert.equal(db.calls.length,0);
});
test('uncertain create retries retrieve only the same draft and owner',async()=>{
 const row={id:'draft',status:'Pending'};const db=fake([{error:{code:'23505'}},{data:row}]);
 assert.deepEqual(await applyToOpportunity(db,draft),row);
 assert.deepEqual(db.calls.filter(c=>c[0]==='eq'),[['eq','id','draft'],['eq','listing_id','opportunity'],['eq','user_id','student']]);
});
test('a different existing application is not reported as the submitted draft',async()=>{
 await assert.rejects(applyToOpportunity(fake([{error:{code:'23505'}},{error:{code:'PGRST116'}}]),draft),/Refresh applications/);
});
test('withdrawal filters draft, listing, and session owner',async()=>{
 const db=fake();await withdrawApplication(db,draft);
 assert.deepEqual(db.calls.filter(c=>c[0]==='eq'),[['eq','id','draft'],['eq','listing_id','opportunity'],['eq','user_id','student']]);
});
test('review updates status only and detects intervening changes',async()=>{
 const db=fake([{data:{status:'Accepted'}}]);await reviewApplication(db,{...draft,status:'Accepted',previousStatus:'Pending'});
 assert.deepEqual(db.calls.find(c=>c[0]==='update'),['update',{status:'Accepted'}]);
 assert.deepEqual(db.calls.filter(c=>c[0]==='eq'),[['eq','id','draft'],['eq','listing_id','opportunity'],['eq','status','Pending']]);
 assert.ok(db.calls.some(c=>c[0]==='single'));
 await assert.rejects(reviewApplication(db,{...draft,status:'unknown',previousStatus:'Pending'}));
});
test('denials and stale review responses propagate instead of reporting success',async()=>{
 const error=new Error('permission denied');
 await assert.rejects(fetchApplications(fake([{error}]),draft),error);
 await assert.rejects(applyToOpportunity(fake([{error}]),draft),error);
 await assert.rejects(withdrawApplication(fake([{error}]),draft),error);
 await assert.rejects(reviewApplication(fake([{error}]),{...draft,status:'Accepted',previousStatus:'Pending'}),error);
});
