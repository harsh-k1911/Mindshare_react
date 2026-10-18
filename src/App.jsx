import { useEffect, useReducer, useState } from 'react';
import Icon from './components/Icon';
import { Avatar, EventCard, IdeaCard, OpportunityCard } from './components/CommunityCards';
import { ApplicationForm, IdeaForm, ListingForm, ProfileForm } from './features/Forms';
import Detail from './features/Detail';
import SharedIdeas from './features/SharedIdeas';
import CampusOverview from './features/CampusOverview';
import { categories, dateLabel, isClosed, readState, reducer, STORAGE_KEY } from './lib/store';
const navigation = [['overview', 'grid', 'Overview'], ['ideas', 'bulb', 'Ideas'], ['hackathons', 'trophy', 'Hackathons'], ['opportunities', 'briefcase', 'Opportunities'], ['saved', 'bookmark', 'Saved'], ['activity', 'activity', 'My activity']];
const copy = {
  ideas: ['Ideas & conversations', 'Share an idea, ask a question, or help someone think it through.'],
  hackathons: ['Hackathons & competitions', 'Discover an event. Find your people. Build something together.'],
  opportunities: ['Campus opportunities', 'Find campus projects that could use a person just like you.'],
  saved: ['Saved for later', 'Your bookmarked ideas, events, and opportunities, all in one place.'],
  activity: ['Your activity', 'Keep up with your ideas, participation, and collaboration requests.'],
  admin: ['Manage campus listings', 'Publish campus listings and review collaboration requests.']
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
export default function App({ accountSession }) {
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
  const composeIdea = () => {
    if (accountSession) { location.hash = '/ideas'; setModal({type:'shared-idea'}); }
    else setModal({type:'idea'});
  };
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
<aside className="sidebar">
  <a className="brand" href="#/overview"><span className="brand-mark"><Icon name="leaf" size={25}/></span>mindshare<span className="brand-dot">.</span></a>
  <div className="campus-label"><span className="campus-icon"><Icon name="users" size={18}/></span><div><strong>Your campus</strong><span>Ideas, events & people</span></div></div>
  <span className="nav-label">EXPLORE</span>
  <nav aria-label="Main navigation">{navigation.map(([key, icon, label]) => <a key={key} href={`#/${key}`} className={page === key ? 'nav-item active' : 'nav-item'} aria-current={page === key ? 'page' : undefined}><Icon name={icon} size={19}/>{label}{key === 'saved' && state.saved.length > 0 && <span className="nav-count">{state.saved.length}</span>}</a>)}</nav>
  <div className="sidebar-bottom"><button className="button primary sidebar-compose" onClick={composeIdea}><Icon name="plus" size={18}/>Share an idea</button><button className="profile-button" onClick={() => setModal({type:'profile'})}><Avatar name={state.profile.name}/><span><strong>{state.profile.name}</strong><small>{state.profile.department || 'Edit your profile'}</small></span><Icon name="settings" size={17}/></button></div>
</aside>
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
<main id="main" tabIndex={-1} className="main-content"><div className="workspace-notice"><span className="live-dot" />{page === 'ideas' && accountSession ? 'Shared ideas' : 'Local workspace'} <span className="notice-divider">/</span> {page === 'ideas' && accountSession ? 'Saved to your community' : 'Sample listings · saved on this browser'}<a className="account-access" href="#/account">{accountSession ? "My account" : "Sign in"}</a><a href="#/admin">Admin preview <Icon name="arrow" size={13} /></a></div>{storageError && <p role="alert" className="error-message">Browser storage is unavailable. Changes will last only for this session.</p>}{page === 'ideas' && accountSession ? <SharedIdeas key={accountSession.user.id} userId={accountSession.user.id} query={query} ideaId={id} compose={modal?.type === 'shared-idea'} onComposeHandled={() => setModal(null)}/> : id && ['ideas', 'hackathons', 'opportunities'].includes(page) ? <Detail key={route} kind={page} item={(page === 'ideas' ? state.ideas : page === 'hackathons' ? state.events : state.opportunities).find(x => x.id === id)} {...cardProps} setModal={setModal} notify={notify} /> : !knownPage ? <Empty title="This page wandered off." text="Head back to your campus overview." action={<a className="button primary" href="#/overview">Back to overview</a>} /> : page === 'overview' && !query ? <CampusOverview state={state} dispatch={dispatch} onCompose={composeIdea}/> : <>{page !== 'overview' && <div className="page-heading"><span className="eyebrow">{page === 'admin' ? 'LOCAL ADMIN PREVIEW' : 'CAMPUS COMMUNITY'}</span>
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
<p>Ideas, events, and people from your campus.</p>
<span>Share something worth starting.</span></footer></div>{modal?.type === 'idea' && <IdeaForm {...cardProps} idea={modal.idea} onClose={() => setModal(null)} notify={notify} />}{modal?.type === 'profile' && <ProfileForm {...cardProps} onClose={() => setModal(null)} notify={notify} />}{modal?.type === 'apply' && <ApplicationForm {...cardProps} item={modal.item} onClose={() => setModal(null)} notify={notify} />}{modal?.type === 'listing' && <ListingForm dispatch={dispatch} onClose={() => setModal(null)} notify={notify} />}{toast && <div className="toast" role="status"><Icon name="check" size={18} />{toast}</div>}</div>;
}
