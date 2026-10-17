import Icon from './Icon';
import { dateLabel, initials, isClosed } from '../lib/store';
export function Avatar({
  name,
  small = false
}) {
  return <span className={`avatar ${small ? 'small' : ''}`} title={name}>{initials(name)}</span>;
}
export function Tags({
  items
}) {
  return <div className="tags">{items.map(tag => <span key={tag}>{tag}</span>)}</div>;
}
export function SaveButton({
  itemKey,
  state,
  dispatch
}) {
  return <button className={`icon-button ${state.saved.includes(itemKey) ? 'is-saved' : ''}`} aria-label={state.saved.includes(itemKey) ? 'Remove bookmark' : 'Bookmark'} aria-pressed={state.saved.includes(itemKey)} onClick={() => dispatch({
    type: 'save',
    id: itemKey
  })}><Icon name="bookmark" size={18} /></button>;
}
export function IdeaCard({
  idea,
  state,
  dispatch
}) {
  return <article className="idea-card"><div className="card-top"><div className="author"><Avatar name={idea.author} />
<div><strong>{idea.author}</strong>
<span>{idea.owned ? 'Your idea' : 'Community member'}</span></div></div>
<SaveButton itemKey={`ideas/${idea.id}`} state={state} dispatch={dispatch} /></div>
<a className="card-title" href={`#/ideas/${idea.id}`}>{idea.title}</a>
<p className="clamp">{idea.description}</p>
<Tags items={idea.tags} />
<footer><div className="vote-group"><button aria-label={`Upvote ${idea.title}`} aria-pressed={state.votes[idea.id] === 'up'} onClick={() => dispatch({
          type: 'vote',
          id: idea.id,
          payload: 'up'
        })}><Icon name="up" size={17} />{idea.upvotes}</button>
<button aria-label={`Downvote ${idea.title}`} aria-pressed={state.votes[idea.id] === 'down'} onClick={() => dispatch({
          type: 'vote',
          id: idea.id,
          payload: 'down'
        })}><Icon name="down" size={17} />
<span>{idea.downvotes}</span></button></div>
<a className="comment-link" href={`#/ideas/${idea.id}`}><Icon name="comment" size={16} />{idea.comments.reduce((n, c) => n + 1 + c.replies.length, 0)}<span className="sr-only"> comments</span></a>
<span className="stage"><i />{idea.stage || 'Exploring'}</span></footer></article>;
}
export function EventCard({
  event,
  state,
  dispatch
}) {
  const joined = state.joined.includes(event.id);
  return <article className="event-card"><a href={`#/hackathons/${event.id}`} className={`event-art ${event.theme || 'forest'}`} aria-label={`View ${event.title}`}><div className="art-grid" />
<span className="art-kicker">{event.organizer}</span>
<div className="art-symbol" aria-hidden="true">{event.theme === 'peach' ? '✳' : event.theme === 'lime' ? '↗' : '< / >'}</div>
<span className="art-bottom">{event.format}<Icon name="arrow" /></span></a>
<div className="event-body"><div className="card-top"><span className={`status ${isClosed(event) ? 'neutral' : ''}`}>{isClosed(event) ? 'Closed' : joined ? 'You’re participating' : 'Open for participation'}</span>
<SaveButton itemKey={`hackathons/${event.id}`} state={state} dispatch={dispatch} /></div>
<a href={`#/hackathons/${event.id}`} className="card-title">{event.title}</a>
<div className="meta-line"><Icon name="calendar" size={16} />{dateLabel(event.date)}<span>·</span>{event.format}</div>
<footer><div className="people-stack">{event.participants.slice(0, 3).map(name => <Avatar key={name} name={name} small />)}<span>{event.participants.length + Number(joined)} participating</span></div>
<a className="icon-link" href={`#/hackathons/${event.id}`} aria-label={`Explore ${event.title}`}><Icon name="arrow" size={18} /></a></footer></div></article>;
}
export function OpportunityCard({
  item,
  state,
  dispatch
}) {
  const applied = state.applications.some(a => a.opportunityId === item.id);
  return <article className="opportunity-card"><div className="card-top"><span className="opportunity-icon"><Icon name="briefcase" /></span>
<SaveButton itemKey={`opportunities/${item.id}`} state={state} dispatch={dispatch} /></div>
<span className="eyebrow">{item.role}</span>
<a className="card-title" href={`#/opportunities/${item.id}`}>{item.title}</a>
<p className="clamp">{item.description}</p>
<Tags items={item.tags} />
<div className="meta-line"><Icon name="clock" size={15} />{item.commitment}</div>
<footer><span>{item.closed ? 'Closed' : applied ? 'Request sent' : `${item.slots} open roles`}</span>
<a href={`#/opportunities/${item.id}`}>View opportunity <Icon name="arrow" size={16} /></a></footer></article>;
}
