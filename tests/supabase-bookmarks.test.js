import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchBookmarks,fetchSavedIdeas,setIdeaBookmark} from '../src/lib/supabase/bookmarks.js';
import {fetchIdea} from '../src/lib/supabase/ideas.js';
function fake(results=[{data:[],error:null}]) {
 const calls=[];let i=0;const query={};
 for(const method of ['select','eq','not','order','range','upsert','delete','maybeSingle']) query[method]=(...args)=>{calls.push([method,...args]);return query;};
 query.then=(resolve,reject)=>Promise.resolve(results[Math.min(i++,results.length-1)]).then(resolve,reject);
 return {calls,from(table){calls.push(['from',table]);return query;}};
}
test('bookmarks are scoped to their owner and exclude listing bookmarks',async()=>{
 const db=fake([{data:[{idea_id:'a'}]}]);assert.deepEqual(await fetchBookmarks(db,'me'),['a']);
 assert.ok(db.calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]==='me'));
 assert.ok(db.calls.some(c=>c[0]==='not'&&c[1]==='idea_id'&&c[2]==='is'&&c[3]===null));
});
test('saved posts use explicit joins and include old posts independent of latest feed',async()=>{
 const old={id:'old',created_at:'2020'},recent={id:'new',created_at:'2026'};
 const db=fake([{data:[{idea:old},{idea:null},{idea:recent}]}]);
 assert.deepEqual(await fetchSavedIdeas(db,'me'),[recent,old]);
 assert.match(db.calls.find(c=>c[0]==='select')[1],/ms_bookmarks_idea_id_fkey/);
 assert.match(db.calls.find(c=>c[0]==='select')[1],/ms_ideas_author_id_fkey/);
});
test('saved IDs paginate past the database response limit',async()=>{
 const db=fake([{data:Array.from({length:1000},(_,i)=>({idea_id:String(i)}))},{data:[{idea_id:'last'}]}]);
 assert.equal((await fetchBookmarks(db,'me')).length,1001);
 assert.deepEqual(db.calls.filter(c=>c[0]==='range'),[['range',0,999],['range',1000,1999]]);
});
test('save ignores duplicate inserts and unsave targets only this account and idea',async()=>{
 const db=fake();await setIdeaBookmark(db,'me','a',true);await setIdeaBookmark(db,'me','a',false);
 assert.deepEqual(db.calls.find(c=>c[0]==='upsert'),['upsert',{user_id:'me',idea_id:'a'},{onConflict:'user_id,idea_id',ignoreDuplicates:true}]);
 assert.deepEqual(db.calls.filter(c=>c[0]==='eq'),[['eq','user_id','me'],['eq','idea_id','a']]);
});
test('invalid identity and server errors never report success',async()=>{
 const db=fake();await assert.rejects(setIdeaBookmark(db,null,'a',true));await assert.rejects(fetchSavedIdeas(db,null));assert.equal(db.calls.length,0);
 const error=new Error('denied');await assert.rejects(setIdeaBookmark(fake([{error}]),'me','a',true),error);
 await assert.rejects(fetchBookmarks(fake([{error}]),'me'),error);
});
test('direct idea routes fetch the specified ID, even outside the latest feed',async()=>{
 const db=fake([{data:{id:'old'}}]);assert.deepEqual(await fetchIdea(db,'old'),[{id:'old'}]);
 assert.deepEqual(db.calls.filter(c=>c[0]==='eq'),[['eq','id','old']]);
 assert.deepEqual(await fetchIdea(fake([{data:null}]),'missing'),[]);
});
