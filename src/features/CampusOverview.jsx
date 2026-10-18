import { useState } from 'react';
import Icon from '../components/Icon';
import { EventCard, IdeaCard, OpportunityCard } from '../components/CommunityCards';
import { isClosed } from '../lib/store';
import studentDoodle from '../assets/student-doodle.png';

export default function CampusOverview({ state, dispatch, onCompose }) {
  const [order, setOrder] = useState('Latest');
  const ideas = [...state.ideas].sort((a, b) => order === 'Popular' ? b.upvotes - a.upvotes : b.createdAt.localeCompare(a.createdAt));
  const events = state.events.filter(event => !isClosed(event)).sort((a,b) => a.deadline.localeCompare(b.deadline));
  const opportunities = state.opportunities.filter(item => !item.closed);
  return <>
    <div className="welcome"><div><span className="eyebrow">YOUR CAMPUS COMMUNITY</span><h1>Around campus</h1><p>Catch up on ideas, upcoming events, and projects looking for help.</p></div><button className="button primary" onClick={onCompose}><Icon name="plus" size={18}/>Share an idea</button></div>
    <section className="student-welcome"><div><span className="eyebrow">THERE’S SOMETHING TO GET INVOLVED IN</span><h2>Find your people.<br/>Build your next thing.</h2><p>Meet classmates taking on a challenge,<br/>or bring a new idea to the table.</p><a className="button primary" href="#/hackathons">Explore hackathons <Icon name="arrow" size={18}/></a></div><img src={studentDoodle} alt="A student working on a laptop, with a backpack beside them"/></section>
    <div className="quick-links"><a href="#/ideas"><span className="quick-icon green"><Icon name="bulb"/></span><div><strong>Ideas & discussions</strong><span>Share a fresh perspective</span></div><Icon name="arrow" size={18}/></a><a href="#/hackathons"><span className="quick-icon lilac"><Icon name="trophy"/></span><div><strong>Hackathons</strong><span>Find your next challenge</span></div><Icon name="arrow" size={18}/></a><a href="#/opportunities"><span className="quick-icon sand"><Icon name="briefcase"/></span><div><strong>Open opportunities</strong><span>Put your skills to work</span></div><Icon name="arrow" size={18}/></a></div>
    <div className="section-heading"><h2>Upcoming hackathons</h2><a href="#/hackathons">View all <Icon name="arrow" size={17}/></a></div>
    {events.length ? <div className="card-grid events-grid">{events.slice(0,3).map(event => <EventCard key={event.id} event={event} state={state} dispatch={dispatch}/>)}</div> : <p className="empty-panel">No upcoming events yet.</p>}
    <div className="section-heading"><h2>Ideas from the community</h2><div className="overview-sort"><label className="sr-only" htmlFor="overview-sort">Sort community ideas</label><select id="overview-sort" value={order} onChange={event => setOrder(event.target.value)}><option>Latest</option><option>Popular</option></select><a href="#/ideas">View all <Icon name="arrow" size={17}/></a></div></div>
    <div className="ideas-grid">{ideas.slice(0,4).map(idea => <IdeaCard key={idea.id} idea={idea} state={state} dispatch={dispatch}/>)}</div>
    <div className="section-heading"><h2>Looking for collaborators</h2><a href="#/opportunities">View all <Icon name="arrow" size={17}/></a></div>
    <div className="card-grid">{opportunities.slice(0,3).map(item => <OpportunityCard key={item.id} item={item} state={state} dispatch={dispatch}/>)}</div>
  </>;
}
