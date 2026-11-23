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
  'arrow-left': { line: '<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>' },
  'chevron-left': { line: '<path d="m14.5 6-6 6 6 6"/>' },
  'chevron-down': { line: '<path d="m6 9.5 6 6 6-6"/>' },
  share: { line: '<path d="M12 14.5V3.75M8 7.25l4-3.5 4 3.5"/><path d="M8.5 10.25H6.75v9.5h10.5v-9.5H15.5"/>' },
  info: { line: '<circle cx="12" cy="12" r="8.25"/><path d="M12 11v5.25"/><path d="M12 7.9v.1"/>' },
  link: { line: '<path d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1.2 1.2"/><path d="M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1.2-1.2"/>' },
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
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof icons;
