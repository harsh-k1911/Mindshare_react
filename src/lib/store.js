import { initialIdeas } from '../data/ideas.js';
export const STORAGE_KEY = 'mindshare.workspace.v1';
export const categories = ['All', 'AI', 'Startup', 'Tech', 'Health', 'Education', 'Environment', 'Design', 'Finance'];
export const uid = () => crypto.randomUUID();
export const initialState = {
  profile: {
    name: 'Your profile',
    department: '',
    year: '',
    skills: '',
    bio: ''
  },
  ideas: initialIdeas.map(idea => ({
    ...idea,
    id: String(idea.id),
    stage: 'Exploring',
    owned: false
  })),
  events: [{
    id: 'buildweek',
    title: 'Campus Build Week',
    organizer: 'The Builders Club',
    description: 'One weekend. A small team. Something that matters. Bring an everyday campus problem and turn it into a working prototype with fellow students.',
    date: '2026-11-14',
    deadline: '2026-11-10',
    format: 'On campus',
    tags: ['Web development', 'Open innovation'],
    eligibility: 'Open to students from every year and department. Teams of 2–4.',
    url: '',
    closed: false,
    sample: true,
    theme: 'forest',
    participants: ['Riya Sharma', 'Arjun Mehta', 'Meera Joshi', 'Kabir Anand']
  }, {
    id: 'designathon',
    title: 'Design for a better everyday',
    organizer: 'Design Collective',
    description: 'Reimagine a daily student experience. Research a real problem, explore solutions, and present a thoughtful prototype. No coding required.',
    date: '2026-11-21',
    deadline: '2026-11-17',
    format: 'Online',
    tags: ['UI / UX', 'Design'],
    eligibility: 'All students welcome. Individuals or teams of up to 3.',
    url: '',
    closed: false,
    sample: true,
    theme: 'peach',
    participants: ['Simran Kaur', 'Dhruv Malhotra']
  }, {
    id: 'greenhack',
    title: 'Small steps. Greener campus.',
    organizer: 'Sustainability Cell',
    description: 'Build practical solutions for waste, energy, or transport on campus. Work across disciplines and pitch your idea to the campus community.',
    date: '2026-12-05',
    deadline: '2026-11-29',
    format: 'On campus',
    tags: ['Sustainability', 'Hardware'],
    eligibility: 'Teams of 2–5 students. All disciplines welcome.',
    url: '',
    closed: false,
    sample: true,
    theme: 'lime',
    participants: ['Ishita Verma', 'Neha Bansal', 'Farhan Ali']
  }],
  opportunities: [{
    id: 'campus-map',
    title: 'Help build an accessible campus map',
    author: 'Riya Sharma',
    role: 'Frontend developer',
    description: 'We are mapping accessible routes, ramps, and study spaces. Help turn our research into a friendly mobile-first web experience.',
    tags: ['React', 'Maps', 'Accessibility'],
    commitment: '4–6 hours / week',
    duration: '6 weeks',
    slots: 2,
    closed: false,
    sample: true
  }, {
    id: 'research',
    title: 'Make campus energy data useful',
    author: 'Faculty research group',
    role: 'Research collaborator',
    description: 'Explore anonymized energy-use data and help communicate patterns through clear visualizations. A good fit for someone curious about data and sustainability.',
    tags: ['Python', 'Data visualization'],
    commitment: '3–5 hours / week',
    duration: '8 weeks',
    slots: 3,
    closed: false,
    sample: true
  }, {
    id: 'student-zine',
    title: 'A little publication. A lot of campus stories.',
    author: 'Student Editorial Collective',
    role: 'Designer & storyteller',
    description: 'Join the team creating an independent student publication. Help with layouts, illustrations, interviews, and stories from around campus.',
    tags: ['Figma', 'Writing', 'Design'],
    commitment: '2–3 hours / week',
    duration: '4 weeks',
    slots: 2,
    closed: false,
    sample: true
  }],
  saved: [],
  votes: {},
  joined: [],
  applications: [],
  theme: 'light'
};
export function reducer(state, action) {
  const {
    type,
    id,
    payload
  } = action;
  switch (type) {
    case 'edit-idea':
      return {
        ...state,
        ideas: state.ideas.map(idea => idea.id === id && idea.owned ? {
          ...idea,
          ...payload
        } : idea)
      };
    case 'delete-idea':
      return {
        ...state,
        ideas: state.ideas.filter(idea => !(idea.id === id && idea.owned)),
        saved: state.ideas.some(idea => idea.id === id && idea.owned) ? state.saved.filter(key => key !== `ideas/${id}`) : state.saved
      };
    case 'profile':
      return {
        ...state,
        profile: payload
      };
    case 'theme':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light'
      };
    case 'save':
      return {
        ...state,
        saved: state.saved.includes(id) ? state.saved.filter(x => x !== id) : [...state.saved, id]
      };
    case 'vote':
      {
        const old = state.votes[id] || null;
        const next = old === payload ? null : payload;
        return {
          ...state,
          votes: {
            ...state.votes,
            [id]: next
          },
          ideas: state.ideas.map(idea => idea.id !== id ? idea : {
            ...idea,
            upvotes: Math.max(0, idea.upvotes - (old === 'up' ? 1 : 0) + (next === 'up' ? 1 : 0)),
            downvotes: Math.max(0, idea.downvotes - (old === 'down' ? 1 : 0) + (next === 'down' ? 1 : 0))
          })
        };
      }
    case 'idea':
      return {
        ...state,
        ideas: [{
          ...payload,
          owned: true,
          comments: [],
          upvotes: 0,
          downvotes: 0
        }, ...state.ideas]
      };
    case 'comment':
      return {
        ...state,
        ideas: state.ideas.map(idea => idea.id !== id ? idea : {
          ...idea,
          comments: [...idea.comments, payload]
        })
      };
    case 'reply':
      return {
        ...state,
        ideas: state.ideas.map(idea => idea.id !== id ? idea : {
          ...idea,
          comments: idea.comments.map(c => c.id !== payload.commentId ? c : {
            ...c,
            replies: [...c.replies, payload.reply]
          })
        })
      };
    case 'join':
      return {
        ...state,
        joined: state.joined.includes(id) ? state.joined.filter(x => x !== id) : [...state.joined, id]
      };
    case 'apply':
      return state.applications.some(a => a.opportunityId === payload.opportunityId) ? state : {
        ...state,
        applications: [...state.applications, payload]
      };
    case 'withdraw':
      return {
        ...state,
        applications: state.applications.filter(a => a.id !== id)
      };
    case 'review':
      return {
        ...state,
        applications: state.applications.map(a => a.id === id ? {
          ...a,
          status: payload
        } : a)
      };
    case 'listing':
      return {
        ...state,
        [payload.collection]: [payload.item, ...state[payload.collection]]
      };
    case 'close':
      return {
        ...state,
        [payload]: state[payload].map(item => item.id === id ? {
          ...item,
          closed: !item.closed
        } : item)
      };
    default:
      return state;
  }
}
export function readState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && ['ideas', 'events', 'opportunities', 'saved', 'joined', 'applications'].every(k => Array.isArray(stored[k])) && stored.profile && stored.votes) return {
      ...initialState,
      ...stored
    };
  } catch {/* An unavailable or invalid browser store must not prevent startup. */}
  return initialState;
}
export const initials = name => name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
export const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short'
});
export const isClosed = event => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return event.closed || event.deadline < today;
};
