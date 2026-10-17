import { useEffect, useId, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { categories, uid, initials } from '../lib/store';
export function Modal({
  title,
  onClose,
  children
}) {
  const ref = useRef(null);
  const headingId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} aria-labelledby={headingId} className="modal" onCancel={onClose} onClick={e => {
    if (e.target === e.currentTarget) onClose();
  }}><div className="modal-heading"><h2 id={headingId}>{title}</h2>
<button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></div>{children}</dialog>;
}
export function IdeaForm({
  state,
  dispatch,
  onClose,
  notify,
  idea
}) {
  const [selected, setSelected] = useState(idea?.tags || []);
  return <Modal title={idea ? "Give your idea a little polish." : "Every good thing starts with an idea."} onClose={onClose}><p className="muted">Share the spark. Your community can help it grow.</p>
<form onSubmit={e => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const title = f.get('title').trim(),
        description = f.get('description').trim();
      if (!title || !description) return;
      if (idea) {
        dispatch({
          type: 'edit-idea',
          id: idea.id,
          payload: {
            title,
            description,
            tags: selected.length ? selected : ['Startup'],
            stage: f.get('stage')
          }
        });
        onClose();
        notify('Idea updated.');
        return;
      }
      const id = uid();
      dispatch({
        type: 'idea',
        payload: {
          id,
          title,
          description,
          author: state.profile.name === 'Your profile' ? 'You' : state.profile.name,
          avatar: initials(state.profile.name),
          tags: selected.length ? selected : ['Startup'],
          stage: f.get('stage'),
          createdAt: new Date().toISOString().slice(0, 10)
        }
      });
      onClose();
      location.hash = `/ideas/${id}`;
      notify('Your idea is out in the world.');
    }}><label>Give it a name<input name="title" defaultValue={idea?.title} required maxLength={100} placeholder="A small idea with a big possibility" /></label>
<label>What are you thinking?<textarea name="description" defaultValue={idea?.description} required maxLength={5000} rows={5} placeholder="What problem are you solving? How would it work? What feedback or help would you like?" /></label>
<label>Stage<select name="stage" defaultValue={idea?.stage}><option>Exploring</option>
<option>Building</option>
<option>Launched</option></select></label>
<fieldset><legend>Topics</legend>
<div className="chips">{categories.filter(c => c !== 'All').map(c => <button key={c} type="button" aria-pressed={selected.includes(c)} className={selected.includes(c) ? 'chip active' : 'chip'} onClick={() => setSelected(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}>{c}</button>)}</div></fieldset>
<button className="button primary" type="submit">{idea ? "Save changes" : "Publish idea"} <Icon name="arrow" size={17} /></button></form></Modal>;
}
export function ProfileForm({
  state,
  dispatch,
  onClose,
  notify
}) {
  return <Modal title="A little about you" onClose={onClose}><p className="muted">Help your campus put a person to the ideas.</p>
<form onSubmit={e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.currentTarget));
      if (!data.name.trim()) return;
      dispatch({
        type: 'profile',
        payload: data
      });
      onClose();
      notify('Profile updated.');
    }}><label>Your name<input name="name" required maxLength={60} defaultValue={state.profile.name === 'Your profile' ? '' : state.profile.name} placeholder="Your full name" /></label>
<div className="form-row"><label>Department<input name="department" defaultValue={state.profile.department} placeholder="Computer Science" maxLength={80} /></label>
<label>Year<select name="year" defaultValue={state.profile.year}><option value="">Select year</option>{['First year', 'Second year', 'Third year', 'Fourth year', 'Postgraduate', 'Faculty'].map(y => <option key={y}>{y}</option>)}</select></label></div>
<label>Skills<input name="skills" defaultValue={state.profile.skills} placeholder="React, design, Python…" maxLength={200} /></label>
<label>Bio<textarea rows={3} name="bio" defaultValue={state.profile.bio} placeholder="What are you curious about?" maxLength={500} /></label>
<button className="button primary">Save profile <Icon name="check" size={17} /></button></form></Modal>;
}
export function ApplicationForm({
  item,
  dispatch,
  onClose,
  notify,
  state
}) {
  return <Modal title="Let’s make something together." onClose={onClose}><p className="muted">Send your interest in <strong>{item.title}</strong>.</p>
<form onSubmit={e => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      if (!f.get('message').trim()) return;
      dispatch({
        type: 'apply',
        payload: {
          id: uid(),
          opportunityId: item.id,
          name: state.profile.name === 'Your profile' ? 'You' : state.profile.name,
          message: f.get('message').trim(),
          status: 'Pending',
          createdAt: new Date().toISOString()
        }
      });
      onClose();
      notify('Request sent. Track it in My activity.');
    }}><label>Why would you like to join?<textarea name="message" rows={5} required maxLength={2000} placeholder="Introduce yourself, share relevant skills, and tell the team what excites you." /></label>
<button className="button primary">Send request <Icon name="arrow" size={17} /></button></form></Modal>;
}
export function ListingForm({
  dispatch,
  onClose,
  notify
}) {
  const [kind, setKind] = useState('events');
  return <Modal title="Create a campus listing" onClose={onClose}><form onSubmit={e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.currentTarget));
      if (!f.title.trim() || !f.description.trim()) return;
      if (kind === 'events' && f.deadline > f.date) {
        e.currentTarget.elements.deadline.setCustomValidity('The deadline must be on or before the event date.');
        e.currentTarget.elements.deadline.reportValidity();
        return;
      }
      const item = {
        ...f,
        id: uid(),
        title: f.title.trim(),
        description: f.description.trim(),
        tags: f.tags.split(',').map(x => x.trim()).filter(Boolean),
        closed: false,
        sample: false,
        ...(kind === 'events' ? {
          participants: [],
          theme: 'forest'
        } : {
          slots: Number(f.slots)
        })
      };
      dispatch({
        type: 'listing',
        payload: {
          collection: kind,
          item
        }
      });
      onClose();
      notify('Listing published.');
    }}><label>Listing type<select value={kind} onChange={e => setKind(e.target.value)}><option value="events">Hackathon / competition</option>
<option value="opportunities">Opportunity</option></select></label>
<label>Title<input name="title" required maxLength={120} /></label>
<label>Description<textarea name="description" required rows={4} maxLength={5000} /></label>{kind === 'events' ? <><label>Organizer<input name="organizer" required maxLength={100} /></label><div className="form-row"><label>Event date<input type="date" name="date" required /></label>
<label>Join deadline<input type="date" name="deadline" required onChange={e => e.target.setCustomValidity('')} /></label></div><label>Format<select name="format"><option>On campus</option>
<option>Online</option>
<option>Hybrid</option></select></label><label>Eligibility<input name="eligibility" required maxLength={300} /></label><label>Official registration link (optional)<input type="url" name="url" placeholder="https://…" pattern="https://.*" /></label></> : <><label>Project owner<input name="author" required maxLength={100} /></label><label>Role needed<input name="role" required maxLength={100} /></label><div className="form-row"><label>Time commitment<input name="commitment" required placeholder="4 hours / week" /></label>
<label>Duration<input name="duration" required placeholder="6 weeks" /></label></div><label>Open roles<input type="number" name="slots" required min="1" max="100" defaultValue="1" /></label></>}<label>Tags (comma-separated)<input name="tags" required maxLength={200} placeholder="React, Design, Sustainability" /></label>
<button className="button primary">Publish listing <Icon name="arrow" size={17} /></button></form></Modal>;
}
