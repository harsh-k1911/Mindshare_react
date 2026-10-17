import { useState } from 'react';
import Icon from '../components/Icon';
import { Avatar, IdeaCard } from '../components/CommunityCards';
import { dateLabel, isClosed } from '../lib/store';
import studentDoodle from '../assets/student-doodle.png';

export default function CampusOverview({ state, dispatch, onCompose }) {
  const [order, setOrder] = useState('Latest');
  const ideas = [...state.ideas].sort((a, b) => order === 'Popular' ? b.upvotes - a.upvotes : b.createdAt.localeCompare(a.createdAt));
  const events = state.events.filter(event => !isClosed(event)).sort((a,b) => a.deadline.localeCompare(b.deadline));
  const opportunities = state.opportunities.filter(item => !item.closed);
  return <>
    <section className="campus-intro">
      <div><span className="eyebrow">THE CAMPUS NOTICEBOARD</span><h1>What’s happening<br/>around campus?</h1><p>Ideas from your classmates. Something to join.<br/>A place to find your next collaborator.</p></div>
      <figure><img src={studentDoodle} alt="A student working on a laptop, with a backpack beside them"/><figcaption>between classes, something begins.</figcaption></figure>
    </section>
    <div className="campus-columns">
      <section className="community-feed" aria-labelledby="feed-title">
        <div className="feed-title-row"><h2 id="feed-title">Campus conversations</h2><div className="feed-order" aria-label="Sort conversations">{['Latest','Popular'].map(value => <button key={value} aria-pressed={order === value} onClick={() => setOrder(value)}>{value}</button>)}</div></div>
        <button className="compose-prompt" onClick={onCompose}><Avatar name={state.profile.name}/><span>Got an idea? Put it out there.</span><span className="compose-plus"><Icon name="plus" size={19}/></span></button>
        <div className="discussion-feed">{ideas.slice(0,6).map(idea => <IdeaCard key={idea.id} idea={idea} state={state} dispatch={dispatch}/>)}</div>
        <a href="#/ideas" className="feed-more">See all ideas <Icon name="arrow" size={16}/></a>
      </section>
      <aside className="campus-rail">
        <section><div className="rail-heading"><h2>Coming up</h2><a href="#/hackathons" aria-label="All hackathons"><Icon name="arrow" size={17}/></a></div><p className="rail-caption">Make a note. Find a teammate.</p>
          {events.length ? events.slice(0,3).map(event => <a className="deadline-row" key={event.id} href={`#/hackathons/${event.id}`}><span className="date-block"><strong>{event.date.slice(8)}</strong><span>{new Date(`${event.date}T12:00:00`).toLocaleDateString('en-IN',{month:'short'})}</span></span><div><h3>{event.title}</h3><p>{event.format} · {event.participants.length + Number(state.joined.includes(event.id))} participating</p><span className="deadline-note">Join by {dateLabel(event.deadline)}</span></div></a>) : <p className="muted">No upcoming events yet.</p>}
        </section>
        <section className="rail-opportunities"><div className="rail-heading"><h2>Looking for a hand</h2><a href="#/opportunities" aria-label="All opportunities"><Icon name="arrow" size={17}/></a></div><p className="rail-caption">Projects with room for you.</p>{opportunities.slice(0,3).map(item => <a className="rail-role" href={`#/opportunities/${item.id}`} key={item.id}><span>{item.role}</span><h3>{item.title}</h3><p>{item.commitment} <span>↗</span></p></a>)}</section>
        <p className="rail-footnote">This is your campus space.<br/>Ask questions. Share early. Be kind.</p>
      </aside>
    </div>
  </>;
}
