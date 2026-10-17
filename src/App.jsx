import { useEffect, useReducer, useState } from 'react';
import Icon from './components/Icon';
import { Avatar, EventCard, IdeaCard, OpportunityCard } from './components/CommunityCards';
import { ApplicationForm, IdeaForm, ListingForm, ProfileForm } from './features/Forms';
import Detail from './features/Detail';
import { categories, dateLabel, isClosed, readState, reducer, STORAGE_KEY } from './lib/store';
const navigation = [['overview', 'grid', 'Overview'], ['ideas', 'bulb', 'Ideas'], ['hackathons', 'trophy', 'Hackathons'], ['opportunities', 'briefcase', 'Opportunities'], ['saved', 'bookmark', 'Saved'], ['activity', 'activity', 'My activity']];
const copy = {
  ideas: ['A little spark. A bigger possibility.', 'Share what’s on your mind. Find the people who see its potential.'],
  hackathons: ['Find your next challenge.', 'Discover an event. Find your people. Build something together.'],
  opportunities: ['Your skills. Something meaningful.', 'Find campus projects that could use a person just like you.'],
  saved: ['Good finds, kept close.', 'Your bookmarked ideas, events, and opportunities, all in one place.'],
  activity: ['Your corner of the community.', 'Keep up with your ideas, participation, and collaboration requests.'],
  admin: ['Make room for what’s next.', 'Publish campus listings and review collaboration requests.']
};
function SectionHeading({
  eyebrow,
  title,
  href,
  label = 'View all'
}) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{href && <a href={href}>{label}<Icon name="arrow" size={17} /></a>}</div>;
}
function Empty({
  title = 'Nothing here just yet.',
  text = 'Try a different search or filter.',
  action
}) {
  return <div className="empty-panel"><span className="empty-icon"><Icon name="leaf" size={30} /></span>
<h2>{title}</h2>
<p>{text}</p>{action}</div>;
}
export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, readState);
  const [route, setRoute] = useState(() => location.hash.slice(2) || 'overview');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('Trending');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [page, id] = route.split('/');
  const knownPage = navigation.some(([key]) => key === page) || page === 'admin';
  useEffect(() => {
    const onHash = () => {
      setRoute(location.hash.slice(2) || 'overview');
      setQuery('');
      setCategory('All');
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);
  useEffect(() => {
    document.title = `${navigation.find(([key]) => key === page)?.[2] || (page === 'admin' ? 'Admin' : 'Page')} · MindShare`;
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  const notify = text => setToast(text);
  const cardProps = {
    state,
    dispatch
  };
  const matches = item => `${item.title} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase().includes(query.toLowerCase().trim());
  const ideas = state.ideas.filter(matches).filter(i => category === 'All' || i.tags.includes(category)).sort((a, b) => sort === 'Newest' ? b.createdAt.localeCompare(a.createdAt) : b.upvotes - a.upvotes);
  const events = state.events.filter(matches).filter(e => category === 'All' || (category === 'Open' ? !isClosed(e) : e.format === category));
  const opportunities = state.opportunities.filter(matches).filter(o => category === 'All' || (category === 'Open' ? !o.closed : o.tags.includes(category)));
  const allSaved = [...state.ideas.map(item => ({
    kind: 'ideas',
    item
  })), ...state.events.map(item => ({
    kind: 'hackathons',
    item
  })), ...state.opportunities.map(item => ({
    kind: 'opportunities',
    item
  }))].filter(({
    kind,
    item
  }) => state.saved.includes(`${kind}/${item.id}`) && matches(item));
  const renderCard = ({
    kind,
    item
  }) => kind === 'ideas' ? <IdeaCard key={item.id} idea={item} {...cardProps} /> : kind === 'hackathons' ? <EventCard key={item.id} event={item} {...cardProps} /> : <OpportunityCard key={item.id} item={item} {...cardProps} />;
  const filteredCount = page === 'ideas' ? ideas.length : page === 'hackathons' ? events.length : opportunities.length;
  return <div className="workspace"><a className="skip-link" href="#main" onClick={e => {
      e.preventDefault();
      document.getElementById("main").focus();
    }}>Skip to content</a>
<aside className="sidebar"><a className="brand" href="#/overview"><span className="brand-mark"><Icon name="leaf" size={25} /></span>mindshare<span className="brand-dot">.</span></a>
<div className="campus-label"><span className="campus-icon"><Icon name="users" size={18} /></span>
<div><strong>Your campus collective</strong>
<span>A little more connected</span></div></div>
<span className="nav-label">DISCOVER & CONNECT</span>
<nav aria-label="Main navigation">{navigation.map(([key, icon, label]) => <a key={key} href={`#/${key}`} className={page === key ? 'nav-item active' : 'nav-item'} aria-current={page === key ? 'page' : undefined}><Icon name={icon} size={19} />{label}{key === 'saved' && state.saved.length > 0 && <span className="nav-count">{state.saved.length}</span>}</a>)}</nav>
<div className="sidebar-bottom"><div className="sidebar-note"><span className="little-star">✳</span>
<h3>Good things start<br />with a “what if?”</h3>
<p>Your next idea could find<br />its people here.</p>
<button className="text-button" onClick={() => setModal({
            type: 'idea'
          })}>Share a spark <Icon name="arrow" size={16} /></button></div>
<button className="profile-button" onClick={() => setModal({
          type: 'profile'
        })}><Avatar name={state.profile.name} />
<span><strong>{state.profile.name}</strong>
<small>{state.profile.department || 'Make yourself at home'}</small></span>
<Icon name="settings" size={17} /></button></div></aside>
<div className="main-shell"><header className="topbar"><div className="breadcrumb">Your campus <Icon name="chevron" size={13} />
<strong>{navigation.find(([key]) => key === page)?.[2] || 'Admin workspace'}</strong></div>
<div className="topbar-actions"><label className="search-box"><Icon name="search" size={17} />
<input aria-label="Search current section" placeholder={page === 'overview' ? 'Search ideas, events, opportunities…' : `Search ${page}…`} value={query} onChange={e => setQuery(e.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><Icon name="close" size={15} /></button>}</label>
<button className="icon-button theme-button" aria-label={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} mode`} onClick={() => dispatch({
            type: 'theme'
          })}><Icon name={state.theme === 'light' ? 'moon' : 'sun'} size={19} /></button>
<button className="header-avatar" onClick={() => setModal({
            type: 'profile'
          })} aria-label="Edit profile"><Avatar name={state.profile.name} /></button></div></header>
<main id="main" tabIndex={-1} className="main-content"><div className="workspace-notice"><span className="live-dot" />Local workspace <span className="notice-divider">/</span> Sample listings · saved on this browser<a href="#/admin">Admin preview <Icon name="arrow" size={13} /></a></div>{storageError && <p role="alert" className="error-message">Browser storage is unavailable. Changes will last only for this session.</p>}{id && ['ideas', 'hackathons', 'opportunities'].includes(page) ? <Detail key={route} kind={page} item={(page === 'ideas' ? state.ideas : page === 'hackathons' ? state.events : state.opportunities).find(x => x.id === id)} {...cardProps} setModal={setModal} notify={notify} /> : !knownPage ? <Empty title="This page wandered off." text="Head back to your campus overview." action={<a className="button primary" href="#/overview">Back to overview</a>} /> : page === 'overview' && !query ? <><div className="welcome"><div><span className="eyebrow">A SPACE FOR YOUR NEXT CHAPTER</span>
<h1>Big things start <span>right here.</span></h1>
<p>A good idea. The right people. A little courage to begin.</p></div>
<button className="button primary" onClick={() => setModal({
              type: 'idea'
            })}><Icon name="plus" size={18} />Share an idea</button></div><section className="hero-banner"><div className="hero-copy"><span className="hero-label"><i /> YOUR CAMPUS. YOUR POSSIBILITIES.</span>
<h2>Find your people.<br />Build your <em>next thing.</em></h2>
<p>Ideas worth exploring, challenges worth taking,<br className="desktop-break" /> and people who make it all a little more possible.</p>
<a href="#/hackathons" className="button lime">Explore hackathons <Icon name="arrow" size={18} /></a></div>
<div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" />
<div className="orbit orbit-two" />
<div className="hero-spark">✳</div>
<div className="floating-note note-one"><span className="note-icon"><Icon name="bulb" size={22} /></span>
<div>A little spark.<strong>A whole lot of possibility.</strong></div></div>
<div className="floating-note note-two"><div className="tiny-avatars"><span>RK</span>
<span>AM</span>
<span>YOU</span></div>
<strong>Better, together.</strong>
<span>Your next team is closer than you think.</span></div>
<div className="scribble">good things grow here ↗</div>
<span className="art-plus plus-one">+</span>
<span className="art-plus plus-two">+</span></div></section><div className="quick-links"><a href="#/ideas"><span className="quick-icon green"><Icon name="bulb" /></span>
<div><strong>Ideas with potential</strong>
<span>Give a thought room to grow</span></div>
<Icon name="arrow" size={18} /></a>
<a href="#/hackathons"><span className="quick-icon lilac"><Icon name="trophy" /></span>
<div><strong>A challenge awaits</strong>
<span>Find your next hackathon</span></div>
<Icon name="arrow" size={18} /></a>
<a href="#/opportunities"><span className="quick-icon sand"><Icon name="briefcase" /></span>
<div><strong>Make your skills matter</strong>
<span>Join something in the making</span></div>
<Icon name="arrow" size={18} /></a></div><SectionHeading eyebrow="GET OUT THERE" title="Your next “let’s do this.”" href="#/hackathons" label="All hackathons" /><div className="card-grid events-grid">{state.events.filter(e => !isClosed(e)).slice(0, 3).map(event => <EventCard key={event.id} event={event} {...cardProps} />)}</div><div className="overview-lower"><section><SectionHeading eyebrow="FROM THE COMMUNITY" title="A few fresh perspectives." href="#/ideas" />
<div className="ideas-grid">{[...state.ideas].sort((a, b) => b.upvotes - a.upvotes).slice(0, 2).map(idea => <IdeaCard key={idea.id} idea={idea} {...cardProps} />)}</div></section>
<aside className="growth-panel"><span className="eyebrow">A PLACE TO CONTRIBUTE</span>
<Icon name="leaf" size={42} />
<h2>You don’t have to<br />start from scratch.</h2>
<p>Someone on campus is already building something that could use your skills.</p>
<a href="#/opportunities" className="text-button">Find an opportunity <Icon name="arrow" size={17} /></a></aside></div></> : <>{page !== 'overview' && <div className="page-heading"><span className="eyebrow">{page === 'admin' ? 'LOCAL ADMIN PREVIEW' : 'YOUR CAMPUS COLLECTIVE'}</span>
<div><h1>{copy[page]?.[0]}</h1>{page === 'ideas' && <button className="button primary" onClick={() => setModal({
                type: 'idea'
              })}><Icon name="plus" size={18} />Share an idea</button>}{page === 'admin' && <button className="button primary" onClick={() => setModal({
                type: 'listing'
              })}><Icon name="plus" size={18} />Create listing</button>}</div>
<p>{copy[page]?.[1]}</p></div>}{page === 'overview' && <><SectionHeading title={`Results for “${query}”`} /><div className="card-grid">{[...ideas.map(item => ({
                kind: 'ideas',
                item
              })), ...events.map(item => ({
                kind: 'hackathons',
                item
              })), ...opportunities.map(item => ({
                kind: 'opportunities',
                item
              }))].map(renderCard)}</div>{ideas.length + events.length + opportunities.length === 0 && <Empty />}</>}{['ideas', 'hackathons', 'opportunities'].includes(page) && <><div className="feed-toolbar"><div className="chips" aria-label="Filter by topic">{(page === 'ideas' ? categories : page === 'hackathons' ? ['All', 'Open', 'On campus', 'Online', 'Hybrid'] : ['All', 'Open', 'React', 'Python', 'Design']).map(tag => <button className={`chip ${category === tag ? 'active' : ''}`} aria-pressed={category === tag} key={tag} onClick={() => setCategory(tag)}>{tag}</button>)}</div>{page === 'ideas' && <label className="sort-label">Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option>Trending</option>
<option>Newest</option></select></label>}</div><div className="results-count">{filteredCount} {page === 'ideas' ? 'ideas to explore' : page === 'hackathons' ? 'events to discover' : 'ways to contribute'}</div><div className={`card-grid ${page === 'ideas' ? 'ideas-grid' : ''}`}>{page === 'ideas' ? ideas.map(idea => <IdeaCard key={idea.id} idea={idea} {...cardProps} />) : page === 'hackathons' ? events.map(event => <EventCard key={event.id} event={event} {...cardProps} />) : opportunities.map(item => <OpportunityCard key={item.id} item={item} {...cardProps} />)}</div>{filteredCount === 0 && <Empty />}</>}{page === 'saved' && (allSaved.length ? <div className="card-grid">{allSaved.map(renderCard)}</div> : <Empty title={query ? 'No saved posts match your search.' : 'Keep a little inspiration for later.'} text="Use the bookmark on any idea, hackathon, or opportunity to find it here." action={<a href="#/ideas" className="button primary">Explore ideas <Icon name="arrow" size={16} /></a>} />)}{page === 'activity' && <><div className="activity-profile panel"><Avatar name={state.profile.name} />
<div><h2>{state.profile.name}</h2>
<p>{[state.profile.department, state.profile.year].filter(Boolean).join(' · ') || 'Add your name, skills, and a little about yourself.'}</p></div>
<button className="button secondary" onClick={() => setModal({
                type: 'profile'
              })}>Edit profile</button></div><SectionHeading title="Your participation" /><div className="card-grid">{state.events.filter(e => state.joined.includes(e.id) && matches(e)).map(event => <EventCard key={event.id} event={event} {...cardProps} />)}</div>{!state.joined.length && <Empty title="Your next challenge is waiting." text="Join a campus participant list to see it here." />}<SectionHeading title="Collaboration requests" />{state.applications.length ? <div className="panel request-list">{state.applications.map(a => <div className="request-row" key={a.id}><div><a href={`#/opportunities/${a.opportunityId}`}>{state.opportunities.find(o => o.id === a.opportunityId)?.title}</a>
<p>{a.message}</p></div>
<span className="status">{a.status}</span>
<button className="text-button" onClick={() => dispatch({
                  type: 'withdraw',
                  id: a.id
                })}>Withdraw</button></div>)}</div> : <Empty title="Nothing sent yet." text="Find a project that interests you and introduce yourself." />}<SectionHeading title="Ideas you’ve shared" /><div className="ideas-grid">{state.ideas.filter(i => i.owned && matches(i)).map(idea => <IdeaCard key={idea.id} idea={idea} {...cardProps} />)}</div>{!state.ideas.some(i => i.owned) && <Empty title="What’s on your mind?" text="Your ideas will appear here after you publish them." />}</>}{page === 'admin' && <><p className="admin-notice">This is a local workflow preview. Publishing and reviews affect this browser only. Protected admin access will be enabled with the backend connection.</p><SectionHeading title="Manage listings" /><div className="panel listing-table">{[...state.events.map(item => ({
                item,
                collection: 'events'
              })), ...state.opportunities.map(item => ({
                item,
                collection: 'opportunities'
              }))].filter(({
                item
              }) => matches(item)).map(({
                item,
                collection
              }) => <div className="listing-row" key={item.id}><span className="listing-icon"><Icon name={collection === 'events' ? 'trophy' : 'briefcase'} /></span>
<div><a href={`#/${collection === 'events' ? 'hackathons' : 'opportunities'}/${item.id}`}>{item.title}</a>
<span>{collection === 'events' ? `Event · ${dateLabel(item.date)}` : `Opportunity · ${item.role}`}</span></div>
<span className={`status ${item.closed ? 'neutral' : ''}`}>{item.closed ? 'Closed' : 'Open'}</span>
<button className="button secondary small-button" onClick={() => dispatch({
                  type: 'close',
                  id: item.id,
                  payload: collection
                })}>{item.closed ? 'Reopen' : 'Close listing'}</button></div>)}</div><SectionHeading title="Review requests" />{state.applications.length ? <div className="panel request-list">{state.applications.map(a => <div className="request-row" key={a.id}><div><strong>{a.name}</strong>
<p>{state.opportunities.find(o => o.id === a.opportunityId)?.title}</p>
<p>{a.message}</p></div>
<span className="status">{a.status}</span>{a.status === 'Pending' && <div className="row-actions"><button className="button secondary small-button" onClick={() => dispatch({
                    type: 'review',
                    id: a.id,
                    payload: 'Declined'
                  })}>Decline</button>
<button className="button primary small-button" onClick={() => dispatch({
                    type: 'review',
                    id: a.id,
                    payload: 'Accepted'
                  })}>Accept</button></div>}</div>)}</div> : <Empty title="All caught up." text="New collaboration requests will appear here." />}</>}</>}</main>
<footer className="site-footer"><span>mindshare<span className="brand-dot">.</span></span>
<p>A little more connected. A lot more possible.</p>
<span>Made for the in-between ideas.</span></footer></div>{modal?.type === 'idea' && <IdeaForm {...cardProps} idea={modal.idea} onClose={() => setModal(null)} notify={notify} />}{modal?.type === 'profile' && <ProfileForm {...cardProps} onClose={() => setModal(null)} notify={notify} />}{modal?.type === 'apply' && <ApplicationForm {...cardProps} item={modal.item} onClose={() => setModal(null)} notify={notify} />}{modal?.type === 'listing' && <ListingForm dispatch={dispatch} onClose={() => setModal(null)} notify={notify} />}{toast && <div className="toast" role="status"><Icon name="check" size={18} />{toast}</div>}</div>;
}
