const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  bulb: 'M9 18h6 M10 22h4 M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2',
  trophy: 'M8 3h8v7a4 4 0 0 1-8 0z M8 5H4v3a4 4 0 0 0 4 4 M16 5h4v3a4 4 0 0 1-4 4 M12 14v6 M7 21h10',
  briefcase: 'M8 6V3h8v3 M3 7h18v14H3z M3 12a23 23 0 0 0 18 0 M10 13h4',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  plus: 'M12 5v14 M5 12h14',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  chevron: 'M9 5l7 7-7 7',
  up: 'M6 14l6-6 6 6',
  down: 'M6 10l6 6 6-6',
  comment: 'M21 11a9 9 0 0 1-9 9H4l-3 2 2-7a9 9 0 1 1 18-4z',
  calendar: 'M4 5h16v16H4z M8 2v6 M16 2v6 M4 11h16',
  pin: 'M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0z M14 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4',
  clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 6v6l4 2',
  check: 'M5 12l4 4L19 6',
  close: 'M6 6l12 12 M6 18 18 6',
  settings: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
  moon: 'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10',
  sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2',
  external: 'M14 3h7v7 M21 3 10 14 M10 3H3v18h18v-7',
  leaf: 'M20 3C9 2 2 7 5 15s17 4 15-12Z M4 21 15 9'
};
export default function Icon({
  name,
  size = 20,
  ...props
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.bulb} /></svg>;
}
