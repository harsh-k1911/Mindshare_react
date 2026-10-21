import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchComments,postComment,commentThreads} from '../src/lib/supabase/comments.js';
function fake(results=[{data:[],error:null}]) {
 const calls=[];let index=0;const query={};
 for(const method of ['select','eq','order','range','insert','single']) query[method]=(...args)=>{calls.push([method,...args]);return query;};
 query.then=(resolve,reject)=>Promise.resolve(results[Math.min(index++,results.length-1)]).then(resolve,reject);
 return {calls,from(table){calls.push(['from',table]);return query;}};
}
const draft={id:'draft',ideaId:'idea',userId:'member',parentId:'parent',body:' Hello '};
test('publishing binds reply, idea and author with trimmed text',async()=>{
 const db=fake([{data:{id:'draft'}}]);await postComment(db,draft);
 assert.deepEqual(db.calls.find(call=>call[0]==='insert')[1],{id:'draft',idea_id:'idea',author_id:'member',parent_id:'parent',body:'Hello'});
 assert.match(db.calls.find(call=>call[0]==='select')[1],/ms_comments_author_id_fkey/);
});
test('invalid comments never reach the database',async()=>{
 for(const values of [{body:' '},{body:'a'.repeat(2001)},{userId:null}]) {
  const db=fake();await assert.rejects(postComment(db,{...draft,...values}));assert.equal(db.calls.length,0);
 }
});
test('retrying a saved draft reads its own record instead of inserting twice',async()=>{
 const db=fake([{error:{code:'23505'}},{data:{id:'draft',body:'Hello'}}]);
 assert.equal((await postComment(db,draft)).id,'draft');
 assert.deepEqual(db.calls.filter(call=>call[0]==='eq'),[['eq','id','draft'],['eq','idea_id','idea'],['eq','author_id','member']]);
});
test('server failures are surfaced',async()=>{
 const error=new Error('reply parent invalid');await assert.rejects(postComment(fake([{error}]),draft),error);
 await assert.rejects(fetchComments(fake([{error}]),'idea'),error);
});
test('replies attach only to their parent, independently of input ordering',()=>{
 const threads=commentThreads([{id:'reply',parent_id:'first'},{id:'first',parent_id:null},{id:'second',parent_id:null}]);
 assert.deepEqual(threads.map(row=>[row.id,row.replies.map(reply=>reply.id)]),[['first',['reply']],['second',[]]]);
});
test('discussion reads are scoped and paginate past the default row limit',async()=>{
 const db=fake([{data:Array.from({length:1000},(_,id)=>({id}))},{data:[{id:1000}]}]);
 assert.equal((await fetchComments(db,'idea')).length,1001);
 assert.deepEqual(db.calls.filter(call=>call[0]==='range'),[['range',0,999],['range',1000,1999]]);
 assert.ok(db.calls.filter(call=>call[0]==='eq').every(call=>call[1]==='idea_id'&&call[2]==='idea'));
});
