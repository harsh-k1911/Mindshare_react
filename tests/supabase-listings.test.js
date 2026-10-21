import test from 'node:test';
import assert from 'node:assert/strict';
import {listingFields,safeRegistrationUrl,checkAdmin,fetchListings,saveListing,setListingClosed} from '../src/lib/supabase/listings.js';
const event={title:' Build night ',description:' Make a project ',owner_name:' Campus club ',tags:'Tech, Tech',event_date:'2026-12-20',deadline:'2026-12-19',format:'Online',registration_url:'https://example.com/register'};
const opportunity={title:'Research assistant',description:'Help a faculty project',owner_name:'Faculty',role:'Developer',commitment:'4 hours/week',slots:'2'};
function fake(results=[{data:[],error:null}]) {
 const calls=[];let index=0;const q={};
 for(const method of ['select','eq','order','range','insert','update','single']) q[method]=(...args)=>{calls.push([method,...args]);return q;};
 q.then=(resolve,reject)=>Promise.resolve(results[Math.min(index++,results.length-1)]).then(resolve,reject);
 return {calls,from(table){calls.push(['from',table]);return q;},rpc(name){calls.push(['rpc',name]);return q;}};
}
test('listing validation normalizes allowed fields and discards identity/role claims',()=>{
 const fields=listingFields({...event,created_by:'other',kind:'opportunity',closed:true,isAdmin:true},'hackathon');
 assert.equal(fields.title,'Build night');assert.deepEqual(fields.tags,['Tech']);
 for(const key of ['created_by','kind','closed','isAdmin']) assert.equal(fields[key],undefined);
 assert.equal(listingFields(opportunity,'opportunity').slots,2);
});
test('invalid dates, deadline order, unsafe URLs and invalid slot counts are rejected',()=>{
 for(const patch of [{event_date:'2026-02-30'},{deadline:'2026-12-21'},{registration_url:'javascript:alert(1)'},{registration_url:'https://user:password@example.com'},{format:'Elsewhere'}]) assert.throws(()=>listingFields({...event,...patch},'hackathon'));
 for(const slots of ['0','101','2.5','']) assert.throws(()=>listingFields({...opportunity,slots},'opportunity'));
 assert.equal(safeRegistrationUrl('http://example.com'),null);
});
test('admin role must be explicitly true and errors do not grant privileges',async()=>{
 assert.equal(await checkAdmin(fake([{data:true}])),true);
 assert.equal(await checkAdmin(fake([{data:false}])),false);
 assert.equal(await checkAdmin(fake([{data:'true'}])),false);
 await assert.rejects(checkAdmin(fake([{error:new Error('offline')}])));
});
test('listing reads filter kind and ID and paginate',async()=>{
 const db=fake([{data:Array.from({length:1000},(_,id)=>({id}))},{data:[]}]);
 assert.equal((await fetchListings(db,{kind:'hackathon',id:'event'})).length,1000);
 assert.ok(db.calls.some(c=>c[0]==='eq'&&c[1]==='kind'&&c[2]==='hackathon'));
 assert.ok(db.calls.some(c=>c[0]==='eq'&&c[1]==='id'&&c[2]==='event'));
 assert.deepEqual(db.calls.filter(c=>c[0]==='range'),[['range',0,999],['range',1000,1999]]);
});
test('create binds author but editing only writes mutable fields',async()=>{
 const db=fake([{data:{id:'event'}}]);
 await saveListing(db,{userId:'admin',id:'event',kind:'hackathon',values:event});
 assert.equal(db.calls.find(c=>c[0]==='insert')[1].created_by,'admin');
 await saveListing(db,{userId:'admin',id:'event',kind:'hackathon',values:event,editing:true});
 const fields=db.calls.find(c=>c[0]==='update')[1];assert.equal(fields.created_by,undefined);assert.equal(fields.kind,undefined);
 assert.ok(db.calls.some(c=>c[0]==='eq'&&c[1]==='id'&&c[2]==='event'));
});
test('retry of uncertain creation fetches the original owner-scoped listing',async()=>{
 const db=fake([{error:{code:'23505'}},{data:{id:'event'}}]);
 assert.equal((await saveListing(db,{userId:'admin',id:'event',kind:'hackathon',values:event})).id,'event');
 assert.ok(db.calls.some(c=>c[0]==='eq'&&c[1]==='created_by'&&c[2]==='admin'));
});
test('closing only writes the boolean status and propagates server denials',async()=>{
 const db=fake([{data:{id:'event',closed:true}}]);await setListingClosed(db,'event',true);
 assert.deepEqual(db.calls.find(c=>c[0]==='update'),['update',{closed:true}]);
 const error=new Error('permission denied');await assert.rejects(setListingClosed(fake([{error}]),'event',false),error);
 await assert.rejects(saveListing(fake([{error}]),{userId:'student',id:'event',kind:'hackathon',values:event}),error);
});
