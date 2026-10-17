import { useState } from 'react';
import Icon from '../components/Icon';
import { Avatar, Tags, SaveButton } from '../components/CommunityCards';
import { dateLabel, isClosed, uid, initials } from '../lib/store';
export default function Detail({
  kind,
  item,
  state,
  dispatch,
  setModal,
  notify
}) {
  const [replyTo, setReplyTo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!item) return <section className="empty-panel"><Icon name="search" size={36} />
<h2>We couldn’t find that post.</h2>
<p>It may have been removed, or the link may be incomplete.</p>
<a className="button primary" href="#/overview">Back to overview</a></section>;
  const isIdea = kind === 'ideas',
    isEvent = kind === 'hackathons';
  const joined = state.joined.includes(item.id);
  const application = state.applications.find(a => a.opportunityId === item.id);
  const author = state.profile.name === 'Your profile' ? 'You' : state.profile.name;
  const submitComment = (e, commentId) => {
    e.preventDefault();
    const text = new FormData(e.currentTarget).get('message').trim();
    if (!text) return;
    const entry = {
      id: uid(),
      text,
      author,
      avatar: initials(author),
      replies: []
    };
    dispatch(commentId === undefined ? {
      type: 'comment',
      id: item.id,
      payload: entry
    } : {
      type: 'reply',
      id: item.id,
      payload: {
        commentId,
        reply: entry
      }
    });
    e.currentTarget.reset();
    setReplyTo(null);
  };
  return <div className="detail-wrap"><a className="back-link" href={`#/${kind}`}>← Back to {kind}</a>{isEvent && <div className={`detail-art event-art ${item.theme || 'forest'}`}><div className="art-grid" />
<span className="art-kicker">{item.organizer}</span>
<span className="detail-art-word">Build something<br />
<em>worth sharing.</em></span>
<span className="detail-art-symbol" aria-hidden="true">✳</span></div>}<div className="detail-layout"><article className="panel detail-main"><div className="card-top"><span className="eyebrow">{isIdea ? item.stage || 'Exploring' : isEvent ? 'Hackathon & competition' : item.role}</span>
<SaveButton itemKey={`${kind}/${item.id}`} state={state} dispatch={dispatch} /></div>
<h1>{item.title}</h1>
<div className="author"><Avatar name={item.author || item.organizer} />
<div><strong>{item.author || item.organizer}</strong>
<span>{isIdea ? item.createdAt : item.sample ? 'Sample campus listing' : 'Campus listing'}</span></div></div><>{isIdea && item.owned && <div className="owner-actions"><button className="button secondary" onClick={() => setModal({
              type: "idea",
              idea: item
            })}>Edit idea</button>
<button className="text-button" onClick={() => setConfirmDelete(!confirmDelete)}>Delete idea</button>{confirmDelete && <div className="delete-confirm"><p>Delete this idea and its discussion? This cannot be undone.</p>
<button className="button secondary" onClick={() => setConfirmDelete(false)}>Keep idea</button>
<button className="button primary" onClick={() => {
                dispatch({
                  type: "delete-idea",
                  id: item.id
                });
                location.hash = "/ideas";
                notify("Idea deleted.");
              }}>Confirm delete</button></div>}</div>}</><h3>{isIdea ? 'The idea' : isEvent ? 'About the event' : 'What we’re building'}</h3>
<p className="description">{item.description}</p>
<Tags items={item.tags} />{isEvent && <><h3>Who can join?</h3><p className="description">{item.eligibility}</p><h3>People from your campus</h3><div className="participant-list">{[...item.participants, ...(joined ? [author] : [])].map((name, i) => <div className="author" key={`${name}-${i}`}><Avatar name={name} />
<strong>{name}</strong></div>)}</div>{item.participants.length === 0 && !joined && <p className="muted">Be the first to join the campus participant list.</p>}</>}{isIdea && <><div className="detail-votes"><button className="button secondary" aria-pressed={state.votes[item.id] === 'up'} onClick={() => dispatch({
              type: 'vote',
              id: item.id,
              payload: 'up'
            })}><Icon name="up" /> {item.upvotes} Upvotes</button>
<button className="button secondary" aria-label="Downvote" aria-pressed={state.votes[item.id] === 'down'} onClick={() => dispatch({
              type: 'vote',
              id: item.id,
              payload: 'down'
            })}><Icon name="down" /> {item.downvotes}</button></div><section className="discussion"><h2>Keep the conversation growing.</h2>
<form onSubmit={e => submitComment(e)}><label className="sr-only" htmlFor="comment">Add a comment</label>
<textarea id="comment" name="message" rows={3} required maxLength={2000} placeholder="A question, a suggestion, a little encouragement…" />
<button className="button primary">Post comment <Icon name="arrow" size={16} /></button></form>{item.comments.length === 0 && <p className="muted">No comments yet. Start the conversation.</p>}{item.comments.map(c => <div className="discussion-comment" key={c.id}><div className="author"><Avatar name={c.author} />
<strong>{c.author}</strong></div>
<p>{c.text}</p>
<button className="text-button" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>Reply</button>{replyTo === c.id && <form onSubmit={e => submitComment(e, c.id)}><label className="sr-only" htmlFor={`reply-${c.id}`}>Your reply</label>
<input id={`reply-${c.id}`} name="message" required maxLength={2000} placeholder="Write a reply…" />
<button className="button secondary">Send reply</button></form>}{c.replies.map(r => <div className="reply" key={r.id}><strong>{r.author}</strong>
<p>{r.text}</p></div>)}</div>)}</section></>}</article>
<aside className="detail-aside panel"><span className="eyebrow">{isIdea ? 'A spark worth growing' : 'The essentials'}</span>{isIdea ? <><h2>Better with a fresh perspective.</h2><p className="muted">Ask a thoughtful question, share what you know, or help turn this idea into something real.</p><Icon name="leaf" size={64} /></> : isEvent ? <><div className="fact"><Icon name="calendar" />
<div><span>Event date</span>
<strong>{dateLabel(item.date)}, {item.date.slice(0, 4)}</strong></div></div><div className="fact"><Icon name="clock" />
<div><span>Join by</span>
<strong>{dateLabel(item.deadline)}</strong></div></div><div className="fact"><Icon name="pin" />
<div><span>Format</span>
<strong>{item.format}</strong></div></div><button className={`button ${joined ? 'secondary' : 'primary'}`} disabled={!joined && isClosed(item)} onClick={() => {
            dispatch({
              type: 'join',
              id: item.id
            });
            notify(joined ? 'You left the participant list.' : 'You’re on the campus participant list.');
          }}>{joined ? 'Leave participant list' : isClosed(item) ? 'Participation closed' : 'I’m participating'}<Icon name={joined ? 'check' : 'plus'} size={17} /></button><p className="fine-print">Joining here helps you find campus peers. It does not register you with the event organizer.</p>{/^https:\/\//.test(item.url) && <a className="text-button" href={item.url} target="_blank" rel="noreferrer">Official registration <Icon name="external" size={14} /></a>}</> : <><div className="fact"><Icon name="clock" />
<div><span>Time commitment</span>
<strong>{item.commitment}</strong></div></div><div className="fact"><Icon name="calendar" />
<div><span>Duration</span>
<strong>{item.duration}</strong></div></div><div className="fact"><Icon name="users" />
<div><span>Looking for</span>
<strong>{item.slots} collaborators</strong></div></div>{application ? <><span className="status">Request {application.status.toLowerCase()}</span><button className="button secondary" onClick={() => {
              dispatch({
                type: 'withdraw',
                id: application.id
              });
              notify('Request withdrawn.');
            }}>Withdraw request</button></> : <button disabled={item.closed} className="button primary" onClick={() => setModal({
            type: 'apply',
            item
          })}>{item.closed ? 'Opportunity closed' : 'I’m interested'}<Icon name="arrow" size={17} /></button>}<p className="fine-print">Tell the team a little about yourself. You can follow your request in My activity.</p></>}</aside></div></div>;
}
