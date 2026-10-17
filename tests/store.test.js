import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer } from '../src/lib/store.js';
test('votes switch and undo without drifting totals', () => {
  const id = initialState.ideas[0].id,
    original = initialState.ideas[0];
  let state = reducer(initialState, {
    type: 'vote',
    id,
    payload: 'up'
  });
  assert.equal(state.ideas[0].upvotes, original.upvotes + 1);
  state = reducer(state, {
    type: 'vote',
    id,
    payload: 'down'
  });
  assert.equal(state.ideas[0].upvotes, original.upvotes);
  assert.equal(state.ideas[0].downvotes, original.downvotes + 1);
  state = reducer(state, {
    type: 'vote',
    id,
    payload: 'down'
  });
  assert.equal(state.ideas[0].downvotes, original.downvotes);
  assert.equal(state.votes[id], null);
  assert.equal(initialState.ideas[0], original);
});
test('bookmarks are scoped to their content type', () => {
  let state = reducer(initialState, {
    type: 'save',
    id: 'ideas/1'
  });
  state = reducer(state, {
    type: 'save',
    id: 'hackathons/1'
  });
  state = reducer(state, {
    type: 'save',
    id: 'ideas/1'
  });
  assert.deepEqual(state.saved, ['hackathons/1']);
});
test('duplicate applications cannot be submitted and review preserves message', () => {
  const request = {
    id: 'test',
    opportunityId: 'campus-map',
    message: 'I can help',
    status: 'Pending'
  };
  let state = reducer(initialState, {
    type: 'apply',
    payload: request
  });
  state = reducer(state, {
    type: 'apply',
    payload: {
      ...request,
      id: 'duplicate'
    }
  });
  assert.equal(state.applications.length, 1);
  state = reducer(state, {
    type: 'review',
    id: 'test',
    payload: 'Accepted'
  });
  assert.equal(state.applications[0].status, 'Accepted');
  assert.equal(state.applications[0].message, 'I can help');
  state = reducer(state, {
    type: 'withdraw',
    id: 'test'
  });
  assert.equal(state.applications.length, 0);
});
test('replies are attached only to the selected comment', () => {
  const id = initialState.ideas[0].id;
  const reply = {
    id: 'reply',
    text: 'Thanks',
    author: 'Student'
  };
  const state = reducer(initialState, {
    type: 'reply',
    id,
    payload: {
      commentId: 1,
      reply
    }
  });
  assert.equal(state.ideas[0].comments[0].replies.at(-1), reply);
  assert.equal(initialState.ideas[0].comments[0].replies.length, 1);
});
test('only locally owned ideas can be edited or deleted', () => {
 const sample = initialState.ideas[0];
 let state = reducer(initialState, {type:'edit-idea',id:sample.id,payload:{title:'Not allowed'}});
 assert.equal(state.ideas[0].title, sample.title);
 state = reducer(state,{type:'delete-idea',id:sample.id});
 assert.equal(state.ideas.length, initialState.ideas.length);
 state = reducer(state,{type:'idea',payload:{id:'owned',title:'My idea',tags:[],description:'A useful project'}});
 state = reducer(state,{type:'save',id:'ideas/owned'});
 state = reducer(state,{type:'edit-idea',id:'owned',payload:{title:'Updated'}});
 assert.equal(state.ideas[0].title,'Updated');
 state = reducer(state,{type:'delete-idea',id:'owned'});
 assert.equal(state.ideas.length,initialState.ideas.length);
 assert.equal(state.saved.includes('ideas/owned'),false);
});
test('joining and leaving an event is idempotent across a roundtrip', () => {
 const joined = reducer(initialState,{type:'join',id:'buildweek'});
 const restored = JSON.parse(JSON.stringify(joined));
 assert.deepEqual(restored.joined,['buildweek']);
 assert.deepEqual(reducer(restored,{type:'join',id:'buildweek'}).joined,[]);
});
