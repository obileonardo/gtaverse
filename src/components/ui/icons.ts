// The Vice Files icon set: original line glyphs drawn for this site in a GTA style (simple shapes, one stroke weight,
// round ends). Never copied from Rockstar files. Each icon is SVG markup for a 24 x 24 box, drawn with
// stroke="currentColor". `solid` is the filled form used for the current item (Peacock and Apple Sports menus).
// Add new icons here only; render them with <Icon name="..." /> (src/components/ui/Icon.astro).

export type IconDef = { line: string; solid?: string };

export const icons = {
  menu: { line: '<path d="M4 9.25h16M4 14.75h16"/>' },
  close: { line: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>' },
  home: {
    line: '<path d="M4 10.4 12 4l8 6.4V20h-5.2v-5.6H9.2V20H4z"/>',
    solid: '<path d="M4 10.4 12 4l8 6.4V20h-5.2v-5.6H9.2V20H4z" fill="currentColor"/>',
  },
  map: {
    line: '<path d="M9 4.5 3.75 6.5v13L9 17.5l6 2 5.25-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>',
    solid: '<path d="M9 4.5 3.75 6.5v13L9 17.5zM15 6.5l5.25-2v13L15 19.5z" fill="currentColor"/><path d="M9 4.5 3.75 6.5v13L9 17.5l6 2 5.25-2v-13L15 6.5z"/>',
  },
  finds: {
    line: '<circle cx="10.75" cy="10.75" r="6.25"/><path d="m15.4 15.4 4.6 4.6"/><path d="M10.75 7.75v6M7.75 10.75h6"/>',
    solid: '<circle cx="10.75" cy="10.75" r="6.25" fill="currentColor"/><path d="m15.4 15.4 4.6 4.6"/><path d="M10.75 7.75v6M7.75 10.75h6" style="stroke:var(--icon-cut)"/>',
  },
  explainers: {
    line: '<path d="M12 6.6C10 5.1 7 4.6 4 5.1v13.2c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5.1c-3-.5-6 0-8 1.5z"/><path d="M12 6.6v13.2"/>',
    solid: '<path d="M12 6.6C10 5.1 7 4.6 4 5.1v13.2c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5.1c-3-.5-6 0-8 1.5z" fill="currentColor"/><path d="M12 6.6v13.2" style="stroke:var(--icon-cut)"/>',
  },
  lore: {
    line: '<circle cx="6" cy="7" r="2.25"/><circle cx="18" cy="7" r="2.25"/><circle cx="12" cy="17.5" r="2.25"/><path d="M8.25 7h7.5M7.1 9l3.8 6.5M16.9 9l-3.8 6.5"/>',
    solid: '<circle cx="6" cy="7" r="2.25" fill="currentColor"/><circle cx="18" cy="7" r="2.25" fill="currentColor"/><circle cx="12" cy="17.5" r="2.25" fill="currentColor"/><path d="M8.25 7h7.5M7.1 9l3.8 6.5M16.9 9l-3.8 6.5"/>',
  },
  pin: {
    line: '<path d="M12 20.5s-6.25-5.9-6.25-10.6a6.25 6.25 0 0 1 12.5 0c0 4.7-6.25 10.6-6.25 10.6z"/><circle cx="12" cy="9.9" r="2.1"/>',
    solid: '<path d="M12 20.5s-6.25-5.9-6.25-10.6a6.25 6.25 0 0 1 12.5 0c0 4.7-6.25 10.6-6.25 10.6z" fill="currentColor"/><circle cx="12" cy="9.9" r="2.1" style="fill:var(--icon-cut);stroke:none"/>',
  },
  play: { line: '<path d="M8 5.6v12.8a.6.6 0 0 0 .9.5l10.3-6.4a.6.6 0 0 0 0-1L8.9 5.1a.6.6 0 0 0-.9.5z" fill="currentColor" stroke="none"/>' },
  sun: { line: '<circle cx="12" cy="12" r="3.75"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>' },
  moon: { line: '<path d="M19.5 14.6A7.75 7.75 0 0 1 9.4 4.5a7.75 7.75 0 1 0 10.1 10.1z"/>' },
  'arrow-right': { line: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>' },
  'arrow-down': { line: '<path d="M12 3.5v17M6.5 15l5.5 5.5 5.5-5.5"/>' },
  'arrow-up-right': { line: '<path d="M7 17 17 7M8.5 7H17v8.5"/>' },
  'chevron-right': { line: '<path d="m9.5 6 6 6-6 6"/>' },
  check: { line: '<path d="m5.5 12.5 4.2 4.2 8.8-9.4"/>' },
  question: { line: '<path d="M9.2 9.3a2.9 2.9 0 1 1 4.1 2.6c-.8.4-1.3 1.1-1.3 2v.6"/><path d="M12 17.6v.1"/>' },
  cross: { line: '<path d="M7 7l10 10M17 7 7 17"/>' },
  dot: { line: '<circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/>' },
  // Map controls and find drawer
  filter: { line: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>' },
  layers: { line: '<path d="M12 4.5 3.75 8.75 12 13l8.25-4.25z"/><path d="m3.75 12.75 8.25 4.25 8.25-4.25"/>' },
  plus: { line: '<path d="M12 5v14M5 12h14"/>' },
  minus: { line: '<path d="M5 12h14"/>' },
  share: { line: '<path d="M12 3.75v11M8.25 7.5 12 3.75l3.75 3.75"/><path d="M8.75 10.5H6.75v9.75h10.5V10.5h-2"/>' },
  link: { line: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.25 1.25"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.25-1.25"/>' },
  search: { line: '<circle cx="10.75" cy="10.75" r="6.25"/><path d="m15.4 15.4 4.6 4.6"/>' },
  grid: {
    line: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.5"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.5"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.5"/>',
    solid: '<rect x="4.5" y="4.5" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="13.5" y="4.5" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="4.5" y="13.5" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="13.5" y="13.5" width="6" height="6" rx="1.5" fill="currentColor"/>',
  },
  'chevron-down': { line: '<path d="m6 9.5 6 6 6-6"/>' },
  hand: { line: '<path d="M9 12V5.75a1.5 1.5 0 0 1 3 0v4.5"/><path d="M12 10.25a1.5 1.5 0 0 1 3 0v1"/><path d="M15 11.25a1.5 1.5 0 0 1 3 0v3.5a5.75 5.75 0 0 1-5.75 5.75h-.5a5.5 5.5 0 0 1-4.4-2.2l-2.1-2.8a1.5 1.5 0 0 1 2.35-1.85L9 15"/>' },
  clip: { line: '<rect x="3.75" y="5.75" width="16.5" height="12.5" rx="2.5"/><path d="m10.25 9.5 4.25 2.5-4.25 2.5z"/>' },
  article: { line: '<path d="M6 3.75h8.5l3.5 3.5v13H6z"/><path d="M14.25 3.75v3.75H18M9 11.5h6M9 15h6"/>' },
  chat: { line: '<path d="M6.5 4.5h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10.5L6.5 20v-3.5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"/>' },
  // Find categories (content/categories.json), mapped in src/lib/media.ts categoryIcon()
  egg: { line: '<path d="M12 3.75c-3.6 0-6.25 5.2-6.25 9.3a6.25 6.25 0 0 0 12.5 0c0-4.1-2.65-9.3-6.25-9.3z"/><path d="m6.1 12.6 2.3-1.5 2.4 1.5 2.4-1.5 2.4 1.5 2.3-1.5"/>' },
  person: { line: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.9 3.6-6 7-6s6.2 2.1 7 6"/>' },
  keyhole: { line: '<circle cx="12" cy="12" r="8.25"/><circle cx="12" cy="10.25" r="2"/><path d="m11.1 12.1-.85 4.15h3.5l-.85-4.15"/>' },
  globe: { line: '<circle cx="12" cy="12" r="8.25"/><path d="M3.75 12h16.5M12 3.75c2.3 2.3 3.4 5 3.4 8.25s-1.1 5.95-3.4 8.25c-2.3-2.3-3.4-5-3.4-8.25S9.7 6.05 12 3.75z"/>' },
  car: { line: '<path d="M3.75 15.75v-2.8c0-.6.4-1.1 1-1.25l2.1-.5 2.2-3c.4-.5 1-.8 1.6-.8h3.7c.7 0 1.3.3 1.7.9l1.9 2.9 1.8.45c.6.15 1 .7 1 1.3v2.8"/><circle cx="7.5" cy="16" r="1.75"/><circle cx="16.5" cy="16" r="1.75"/><path d="M9.25 16h5.5M6.85 11.2h10.4"/>' },
  candle: { line: '<path d="M12 3.5c1.6 1.9 2.4 3.3 2.4 4.5a2.4 2.4 0 0 1-4.8 0c0-1.2.8-2.6 2.4-4.5z"/><path d="M9.25 13h5.5v7.5h-5.5zM6.75 20.5h10.5"/>' },
  crosshair: { line: '<circle cx="12" cy="12" r="6.5"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>' },
  gem: { line: '<path d="M7.5 5h9L20 9.5l-8 10-8-10z"/><path d="M4 9.5h16M9.5 5 8 9.5l4 10 4-10L14.5 5"/>' },
  flag: { line: '<path d="M6 20.5v-16M6 5h11l-2.5 4L17 13H6"/>' },
  bolt: { line: '<path d="M13.5 3.5 6.5 13h5l-1 7.5 7-9.5h-5z"/>' },
  ghost: { line: '<path d="M6 20v-9.5a6 6 0 0 1 12 0V20l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><circle cx="10" cy="10.5" r=".9" fill="currentColor" stroke="none"/><circle cx="14" cy="10.5" r=".9" fill="currentColor" stroke="none"/>' },

  'arrow-left': { line: '<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>' },
  'chevron-left': { line: '<path d="m14.5 6-6 6 6 6"/>' },
  info: { line: '<circle cx="12" cy="12" r="8.25"/><path d="M12 11v5.25"/><path d="M12 7.9v.1"/>' },
  film: { line: '<rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2"/><path d="M7.75 5.25v13.5M16.25 5.25v13.5M3.75 9.75h4M3.75 14.25h4M16.25 9.75h4M16.25 14.25h4"/>' },
  alert: { line: '<path d="M10.6 4.6 3.3 17.4A1.6 1.6 0 0 0 4.7 19.8h14.6a1.6 1.6 0 0 0 1.4-2.4L13.4 4.6a1.6 1.6 0 0 0-2.8 0z"/><path d="M12 9.5v4"/><path d="M12 16.6v.1"/>' },
  // Wanted star in the GTA HUD manner: a fat five point star with soft corners. Line = hollow, solid = filled.
  star: {
    line: '<path d="m12 3.6 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>',
    solid: '<path d="m12 3.6 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" fill="currentColor"/>',
  },
  'star-flash': { line: '<path d="m12 3.6 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z" stroke-dasharray="2.6 2.2"/>' },
  flame: {
    line: '<path d="M12 20.5c-3.6 0-6.25-2.5-6.25-5.9 0-3.1 2.2-5 3.6-7.1.5 1.6 1.4 2.6 2.4 3 .2-2.8 1.3-5.2 3.4-7 .3 3 1.6 4.6 2.6 6.2.7 1.2 1.1 2.4 1.1 3.9 0 3.6-2.9 6.9-6.85 6.9z"/>',
    solid: '<path d="M12 20.5c-3.6 0-6.25-2.5-6.25-5.9 0-3.1 2.2-5 3.6-7.1.5 1.6 1.4 2.6 2.4 3 .2-2.8 1.3-5.2 3.4-7 .3 3 1.6 4.6 2.6 6.2.7 1.2 1.1 2.4 1.1 3.9 0 3.6-2.9 6.9-6.85 6.9z" fill="currentColor"/>',
  },
  radio: { line: '<circle cx="12" cy="12" r="1.75" fill="currentColor"/><path d="M8.3 8.3a5.2 5.2 0 0 0 0 7.4M15.7 8.3a5.2 5.2 0 0 1 0 7.4M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>' },
  // Home hero modes and the trailer's sound toggle
  image: { line: '<rect x="3.75" y="5.25" width="16.5" height="13.5" rx="2"/><path d="m3.75 16.25 4.6-4.6a1.2 1.2 0 0 1 1.7 0l5.2 5.2M13.5 14.5l1.6-1.6a1.2 1.2 0 0 1 1.7 0l3.45 3.45"/><circle cx="15.5" cy="9.25" r="1.5"/>' },
  wire: { line: '<path d="M12 3.75 4.25 8v8L12 20.25 19.75 16V8z"/><path d="M4.25 8 12 12.25 19.75 8M12 12.25v8"/>' },
  sound: { line: '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/>' },
  'sound-off': { line: '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z"/><path d="m15.75 9.75 4.5 4.5M20.25 9.75l-4.5 4.5"/>' },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof icons;
