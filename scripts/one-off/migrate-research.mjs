// One-off migration, run once on 2026-11-23 to build content/ from research/.
// Kept for audit only: it shows exactly how every derived field was decided.
// DO NOT re-run after content/ has been edited by hand: it overwrites content files.
// Usage (only on a clean slate): node scripts/one-off/migrate-research.mjs --force

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

if (!process.argv.includes('--force')) {
  console.error('Refusing to run without --force. This overwrites content/*.json.');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const write = (p, data) => writeFileSync(join(root, p), JSON.stringify(data, null, 2) + '\n');

const UPDATED = '2026-11-23';
const finds = read('research/gta6-finds.json');
const connDoc = read('research/rockstar-connections.json');

// ---------------------------------------------------------------- sources
// Article and wiki sources are keyed by outlet (hostname). Creator text keeps the author.
const HOSTS = {
  'beebom.com': ['beebom', 'Beebom'],
  'bloody-disgusting.com': ['bloody-disgusting', 'Bloody Disgusting'],
  'culturedvultures.com': ['cultured-vultures', 'Cultured Vultures'],
  'dexerto.com': ['dexerto', 'Dexerto'],
  'dexterdaily.com': ['dexter-daily', 'Dexter Daily'],
  'fandomwire.com': ['fandomwire', 'FandomWire'],
  'gtaviceguides.com': ['gta-vice-guides', 'GTA Vice Guides'],
  'gamerant.com': ['gamerant', 'GameRant'],
  'gamespot.com': ['gamespot', 'GameSpot'],
  'gamesradar.com': ['gamesradar', 'GamesRadar+'],
  'gulfnews.com': ['gulf-news', 'Gulf News'],
  'hotcars.com': ['hotcars', 'HotCars'],
  'in.ign.com': ['ign', 'IGN'],
  'complex.com': ['complex', 'Complex'],
  'thegamer.com': ['thegamer', 'TheGamer'],
  'kotaku.com': ['kotaku', 'Kotaku'],
  'comicbook.com': ['comicbook', 'ComicBook.com'],
  'mobalytics.gg': ['mobalytics', 'Mobalytics'],
  'polygon.com': ['polygon', 'Polygon'],
  'prodigygamers.com': ['prodigy-gamers', 'Prodigy Gamers'],
  'gamingbible.com': ['gamingbible', 'GamingBible'],
  'soapcentral.com': ['soap-central', 'Soap Central'],
  'sportskeeda.com': ['sportskeeda', 'Sportskeeda'],
  'outputlag.com': ['outputlag', 'OutputLag'],
  'thebiglead.com': ['the-big-lead', 'The Big Lead'],
  'tech.yahoo.com': ['yahoo-tech', 'Yahoo Tech'],
  'hypefresh.com': ['hypefresh', 'HypeFresh'],
  'gta6tuto.com': ['gta6tuto', 'gta6tuto'],
  'gta6info.com': ['gta6info', 'GTA6Info wiki'],
  'gta6wiki.eu': ['gta6wiki-eu', 'gta6wiki.eu'],
  'vicecitydb.org': ['vice-city-db', 'Vice City DB'],
};
const WIKI_IDS = new Set(['gta6info', 'gta6wiki-eu', 'vice-city-db']);
const slug = (s) => s.toLowerCase().replace(/['’.+]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Channel and account URLs come from research/gta6-sources.md where listed.
const YT_URLS = {
  'Robbin Rams': 'https://www.youtube.com/@RobbinRams',
  Postmode: 'https://www.youtube.com/@postmodeorg',
  xGarbett: 'https://www.youtube.com/@xGarbett',
  ZoneX: 'https://www.youtube.com/@ZoneXbez',
  'GTA Series Videos': 'https://www.youtube.com/@GTASeriesVideos',
  Techzamazing: 'https://www.youtube.com/@Techzamazing',
  MrDalekJD: 'https://www.youtube.com/@MrDalekJD',
  TheGamingRevolution: 'https://www.youtube.com/@TheGamingRevo',
  LunarGaming: 'https://www.youtube.com/@xLunarGaming',
  'Arekkz Gaming': 'https://www.youtube.com/@ArekkzGaming',
  Lootward: 'https://www.youtube.com/@Lootward',
  'Gamer Guides': 'https://www.youtube.com/@GamerGuidesYT',
  GosuNoob: 'https://www.youtube.com/@Gosunoob',
  'Perfect Score': 'https://www.youtube.com/@PerfectScore',
};

const registry = new Map();
const add = (entry) => {
  if (registry.has(entry.id)) return registry.get(entry.id);
  registry.set(entry.id, entry);
  return entry;
};

function sourceIdFor(s) {
  if (s.type === 'youtube') {
    const id = 'yt-' + slug(s.creator);
    add({ id, name: s.creator, handle: null, platform: 'youtube', role: 'creator', url: YT_URLS[s.creator] ?? null, status: 'active', notes: YT_URLS[s.creator] ? 'Channel URL verified in research/gta6-sources.md.' : 'Channel URL not recorded in research; see the video URLs on the finds that cite it.' });
    return id;
  }
  if (s.type === 'x') {
    const handle = new URL(s.url).pathname.split('/')[1];
    const id = 'x-' + handle.toLowerCase().replace(/_/g, '-').replace(/-$/, '');
    add({ id, name: '@' + handle, handle: '@' + handle, platform: 'x', role: 'community', url: `https://x.com/${handle}`, status: 'active', notes: null });
    return id;
  }
  if (s.type === 'reddit') {
    const user = s.creator.replace(/^u\//, '');
    const id = 'reddit-u-' + slug(user);
    add({ id, name: s.creator, handle: s.creator, platform: 'reddit', role: 'community', url: `https://www.reddit.com/user/${user}`, status: 'active', notes: null });
    return id;
  }
  const host = new URL(s.url).hostname.replace(/^www\./, '');
  const hit = HOSTS[host];
  if (!hit) throw new Error('Unmapped host ' + host);
  const [id, name] = hit;
  add({ id, name, handle: null, platform: 'web', role: WIKI_IDS.has(id) ? 'wiki' : 'press', url: host === 'in.ign.com' ? 'https://www.ign.com' : `https://${host}`, status: id === 'gta6tuto' ? 'caution' : 'active', notes: null });
  return id;
}

// ---------------------------------------------------------------- per-find editorial decisions
const MATURE = new Set(['sex-robot-warehouse', 'rideshare-app-logo']);

// Only where the find text (or a sourced mechanic it depends on) names the chapter.
const CHAPTER = {
  'crabshack-vf5-giant-crab': 'Chapter 1',
  'day-release-party-door': 'Chapter 1',
  'paul-walker-eclipse': 'Chapter 1',
  'conspiracist-trailer-bunker': 'Chapter 1',
  'little-sam-houser-cameo': 'Chapter 3',
  'pegassi-infernus-96': 'Chapter 3',
  'gauntlet-hellfire-hamlet': 'Chapter 3',
};
const CHAPTER_NOTES = {
  'gauntlet-hellfire-hamlet': 'chapter_gate is derived: the find sits on Randy\'s wish list, which research/gta6-mechanics.md section 5 (HotCars) places in Chapter 3.',
  'conspiracist-trailer-bunker': 'chapter_gate comes from one guide saying the Chapter 1 mission \'Building a Life\' is required.',
};

const FIRST_FINDER = {
  'belville-simulation-house': { handle: 'Jared', platform: 'discord', url: null },
  'immortal-sniper-npc': { handle: 'u/seepa-man', platform: 'reddit', url: 'https://www.reddit.com/r/GTA6unmoderated/comments/1y0p8sz/creepy_encounter_in_free_roam/' },
  'leonidan-supremacy-monument': { handle: 'u/akspree', platform: 'reddit', url: 'https://www.reddit.com/r/GTA6/comments/1y02wt7/i_may_have_found_gta_6s_version_of_mount_chiliad/' },
  'mount-chiliad-bar-chatter': { handle: 'u/Tr1angleChoke', platform: 'reddit', url: 'https://www.reddit.com/r/GTA6/comments/1y02b4y/crazy_npc_easter_egg_dialog_in_gta_6/' },
  'tony-the-parrot': { handle: '@ProfessorMikeX', platform: 'x', url: 'https://x.com/ProfessorMikeX/status/2123032338422714528' },
};

const REGION_IDS = {
  'tallest-tower-easter-egg': ['vice-dale-county', 'bluegrass'],
  'ufo-abduction-port-gellhorn': ['port-gellhorn', 'kelly-county'],
  'alien-rescue-south-point-airfield': ['south-point-airfield', 'hamlet'],
  'skunk-ape-bigfoot': ['grassrivers', 'cottonmouth-lake', 'sunrise-rv-park'],
  'cool-dog-jet-ski': ['leonida-keys', 'gambit-bay'],
  'belville-simulation-house': ['belville', 'leonard-county'],
  'dexter-trinity-apartments': ['washington-island', 'penmarch-isle', 'vice-beach'],
  'dexter-kill-room-key-lento': ['south-key-lento'],
  'paul-walker-eclipse': ['vespucci-island'],
  'snake-in-the-boot': ['vespucci-island'],
  'deep-roots-memorial-wall': ['hamlet'],
  'golden-ak-palmer-fishing': ['bobcat-key', 'watson-bay'],
  'crabshack-vf5-giant-crab': ['pelican-valley', 'gullet-marsh'],
  'hellspawn-satan-boss': ['port-gellhorn'],
  'ghost-ship-cursed-knife': ['little-hardin-island'],
  'marbelle-hotel-silent-hill': ['crosstown'],
  'hyde-island-hunt': ['hyde-island'],
  'backrooms-excavation-trip': ['lummox-county', 'millport', 'lake-tallaloko'],
  'presidents-bunkers': ['downtown', 'little-cuba', 'waning-sands', 'mariana-county'],
  'immortal-sniper-npc': ['key-lento'],
  'sex-robot-warehouse': ['decor-district'],
  'tiny-arthur-chihuahua': ['waning-sands', 'leonard-county'],
  'arthur-morgan-hat': ['port-gellhorn'],
  'michaels-boat-los-santos-gps': ['key-lento'],
  'fabien-larouche-body-copy': ['leonida-keys'],
  'liberty-city-mob-memoir': ['key-lento'],
  'new-austin-western-novel': ['millport'],
  'mount-chiliad-bar-chatter': ['leonida-keys'],
  'leonidan-supremacy-monument': ['manifest-canyon', 'port-gellhorn'],
  'valentina-cameo': ['vice-city'],
  'macca-and-friends-cartoon': ['leonida-keys'],
  'ocean-view-hotel-vintage-pack': ['ocean-beach'],
  'tenebrae-lux-puzzle-game': ['leonida-keys'],
  'mount-kalaga-meteorite': ['mount-kalaga'],
  'kraken-statue': ['catalan-key', 'gloriana-key'],
  'merman': ['gambit-bay', 'cottonmouth-lake'],
  'sos-castaway-island': ['leonida-bay'],
  'port-gellhorn-missing-persons': ['port-gellhorn'],
  'capri-pentagram-ritual': ['capri'],
  'super-mario-question-block': ['moreau', 'lummox-county'],
  'collateral-hitman': ['vice-beach'],
  'three-sheets-talking-parrots': ['key-lento'],
  'jimmy-the-drunk-sailor': ['key-lento'],
  'lawsuit-burning-driver': ['vice-city'],
  'pet-cemetery-grayson': ['grayson'],
  'spongebob-pineapple-bus-stop': ['bluegrass'],
  'crashed-glider-turnt-nipper': ['bobcat-bight', 'mariana-county'],
  'conspiracist-trailer-bunker': ['mariana-county'],
  'pelican-valley-cabin-guns': ['pelican-valley'],
  'kingfishers-shack-w22': ['grassrivers'],
  'mount-kalaga-tower-shed': ['mount-kalaga', 'lummox-county'],
  'tallaloko-amphitheater-bell-tower': ['lummox-county', 'lake-tallaloko'],
  'pegassi-infernus-96': ['crosstown', 'ambrosia'],
  'grotti-cheetah-95': ['vice-city'],
  'gauntlet-hellfire-hamlet': ['hamlet'],
  'keys-stilt-house-basketball': ['leonida-keys'],
  'roadside-ghost-woman': ['emerald-springs', 'lummox-county'],
  'hamlet-impound-assman-plate': ['hamlet'],
  'rx-men-comic': ['key-lento'],
  'skeeters-bar-south-park': ['hamlet'],
};

// Find to Rockstar connection links. Only where research/ supports the match.
const LINKS = {
  'tallest-tower-easter-egg': ['vice-city-easter-egg'],
  'ufo-abduction-port-gellhorn': ['ufo-gta-vi', 'ufo-gta-v', 'ufo-san-andreas', 'ufo-rdr2'],
  'alien-rescue-south-point-airfield': ['ufo-gta-vi'],
  'skunk-ape-bigfoot': ['skunk-ape', 'bigfoot-san-andreas', 'bigfoot-gta-v', 'sasquatch-undead-nightmare'],
  'cool-dog-jet-ski': ['jet-ski-dog'],
  'dexter-trinity-apartments': ['dexter-apartment'],
  'paul-walker-eclipse': ['paul-walker-eclipse'],
  'deep-roots-memorial-wall': ['chris-edwards-memorial'],
  'marbelle-hotel-silent-hill': ['ghosts-gta-vi'],
  'roadside-ghost-woman': ['ghosts-gta-vi', 'ghost-mount-gordo'],
  'arthur-morgan-hat': ['arthur-morgan-hat'],
  'michaels-boat-los-santos-gps': ['marquis-boat'],
  'fabien-larouche-body-copy': ['liberty-city-memoir'],
  'wade-true-crime-podcast': ['gta6-gta5-aftermath-podcast'],
  'eddie-low-podcast': ['eddie-low'],
  'liberty-city-mob-memoir': ['liberty-city-memoir', 'liberty-city-three-times'],
  'old-gta-city-sports-cards': ['trading-card-sets', 'liberty-city-three-times'],
  'mount-chiliad-bar-chatter': ['chiliad-gta6-callback', 'mount-chiliad-mystery'],
  'stefan-haggard-chiliad-notice': ['mount-chiliad-mystery'],
  'leonidan-supremacy-monument': ['mount-chiliad-mystery'],
  'tony-the-parrot': ['ken-rosenberg'],
  'macca-and-friends-cartoon': ['weazel'],
  'little-sam-houser-cameo': ['little-sam'],
  'ocean-view-hotel-vintage-pack': ['ocean-view-hotel', 'vercetti-revolvers', 'vice-city-three-times'],
  'vice-city-style-opening-credits': ['ocean-view-hotel', 'vice-city-three-times'],
  'tenebrae-lux-puzzle-game': ['tenebrae-lux'],
  'pegassi-infernus-96': ['infernus-cheetah'],
  'grotti-cheetah-95': ['infernus-cheetah'],
  'qr-code-seized-pages': ['firewatch-qr-mysteries'],
  'mount-kalaga-tower-shed': ['firewatch-qr-mysteries'],
};

const CLIP_PLATFORMS = new Set(['youtube', 'x', 'reddit', 'tiktok']);

const outFinds = finds.map((f) => {
  const sources = f.sources.map((s) => ({ source_id: sourceIdFor(s), ...s }));
  const clipSrc = sources.find((s) => s.embeddable && CLIP_PLATFORMS.has(s.type));
  // The Mapping Discord invite is dropped from notes: the server reportedly shared leaks (decision S5).
  const notes = [f.notes?.replace(' (discord.gg/gta-mapping)', ''), CHAPTER_NOTES[f.id]].filter(Boolean).join(' ') || null;
  return {
    id: f.id,
    slug: f.id,
    title: f.title,
    status: f.verification === 'rumor' ? 'draft' : 'published',
    category: f.category,
    verification: f.verification,
    spoiler: f.spoiler,
    mature: MATURE.has(f.id),
    chapter_gate: CHAPTER[f.id] ?? null,
    area: f.region,
    region_ids: REGION_IDS[f.id] ?? [],
    location_description: f.location_description,
    pin: null,
    summary: f.summary,
    crossover_games: f.crossover_games,
    related_connections: LINKS[f.id] ?? [],
    first_finder: FIRST_FINDER[f.id] ?? null,
    clip: clipSrc ? { platform: clipSrc.type, url: clipSrc.url, creator: clipSrc.creator, source_id: clipSrc.source_id } : null,
    sources,
    notes,
    updated_at: UPDATED,
  };
});

// ---------------------------------------------------------------- connections
const reverse = {};
for (const [fid, cids] of Object.entries(LINKS)) for (const cid of cids) (reverse[cid] ??= []).push(fid);
const outConnections = {
  generated: connDoc.generated,
  updated_at: UPDATED,
  confidence_notes: connDoc.confidence_notes,
  items: connDoc.items.map((c) => ({
    id: c.id,
    slug: c.id,
    title: c.title,
    type: c.type,
    confidence: c.confidence,
    games: c.games,
    summary: c.summary,
    related_finds: reverse[c.id] ?? [],
    sources: c.sources,
    updated_at: UPDATED,
  })),
};

write('content/finds.json', outFinds);
write('content/connections.json', outConnections);
// Registry entries from research/gta6-sources.md and the launch-week lead list (public X posts).
// Merged over the find-derived entries: static url, role, status and notes win when present.
const S = (id, name, handle, platform, role, url, status, notes) => ({ id, name, handle, platform, role, url, status, notes });
const STATIC = [
  S('rockstar-newswire', 'Rockstar Newswire', null, 'web', 'official', 'https://www.rockstargames.com/newswire', 'active', 'Ground truth for patches and confirmations. JS-rendered; fetchers see only the title.'),
  S('rockstar-gta-vi-site', 'GTA VI official site', null, 'web', 'official', 'https://www.rockstargames.com/VI', 'active', 'Official region pages (Only in Leonida), media and downloads, including the official Leonida map.'),
  S('x-rockstargames', '@RockstarGames', '@RockstarGames', 'x', 'official', 'https://x.com/RockstarGames', 'active', 'Listed by gta6everything.com.'),
  S('x-rockstarsupport', '@RockstarSupport', '@RockstarSupport', 'x', 'official', 'https://x.com/RockstarSupport', 'active', 'Bug and patch status. Listed, not verified.'),
  S('rockstar-discord', 'Rockstar Discord (grand-theft-auto-vi channel)', null, 'discord', 'official', null, 'active', 'Official community hub per a Sportskeeda search snippet. No public invite URL recorded.'),
  S('kotaku', 'Kotaku', null, 'web', 'press', 'https://kotaku.com', 'active', 'Launch live blog; credits Reddit and X finders by handle.'),
  S('gamerant', 'GameRant', null, 'web', 'press', 'https://gamerant.com', 'active', 'Fast step-by-step guides; rarely credits finders.'),
  S('gamingbible', 'GamingBible', null, 'web', 'press', 'https://www.gamingbible.com', 'active', 'Links original Reddit threads.'),
  S('thegamer', 'TheGamer', null, 'web', 'press', 'https://www.thegamer.com', 'active', 'Links original Reddit threads.'),
  S('hotcars', 'HotCars', null, 'web', 'press', 'https://www.hotcars.com', 'active', 'Round-ups that credit creators.'),
  S('dexerto', 'Dexerto', null, 'web', 'press', 'https://www.dexerto.com', 'active', 'Breaks many finds; has a GTA 6 wiki section. Not fetchable by the research agent (DNS failure).'),
  S('rockstarintel', 'RockstarINTEL', null, 'web', 'press', 'https://rockstarintel.com', 'active', 'Independent Rockstar news outlet, states no affiliation. X: https://x.com/RockstarINTEL'),
  S('gta6info', 'GTA6Info wiki', null, 'web', 'wiki', 'https://gta6info.com/wiki/', 'active', 'Best single aggregator; marks single-source claims. No content licence stated. An aggregator, not an independent confirmation.'),
  S('gta6wiki-eu', 'gta6wiki.eu', null, 'web', 'wiki', 'https://gta6wiki.eu/easter-eggs/', 'active', 'No open licence; takedowns to contact@gta6wiki.eu.'),
  S('vice-city-db', 'Vice City DB', null, 'web', 'wiki', 'https://vicecitydb.org', 'active', 'Secrets pages with numbered confirmations and access-dated sources. Corrections: info@vicecitydb.org.'),
  S('gtabase', 'GTABase', null, 'web', 'wiki', 'https://www.gtabase.com/gta-6/', 'active', 'Map, vehicles, gangs, wanted level and Criminal Profile guides. Proprietary map data: do not scrape.'),
  S('gta-wiki', 'GTA Wiki (community)', null, 'web', 'wiki', 'https://gta.wiki', 'active', 'Linked from the mapping community; X @GTAWikiOfficial credits finders.'),
  S('gta-maplib', 'GTA Maplib', null, 'web', 'map', 'https://map.gtadb.org', 'active', 'Map database linked from State of Leonida. Not fetched.'),
  S('powerpyx', 'PowerPyx', null, 'web', 'wiki', 'https://www.powerpyx.com', 'active', 'Trophy guide; cited for mechanics.'),
  S('outputlag', 'OutputLag', null, 'web', 'press', 'https://outputlag.com/guides/gta-6-unique-weapons-locations/', 'active', 'Unique and gold weapon tracker.'),
  S('gta-vi-mapping-discord', 'GTA VI Mapping Project (Discord)', null, 'discord', 'map', null, 'caution', 'Mapping effort since 2022; member Jared found the Belville house. The server vanished on 11 Nov 2026 and reportedly shared leaks (research/legal-fan-site.md 4.1). Do not link its invite.'),
  S('state-of-leonida', 'State of Leonida map', null, 'web', 'map', 'https://map.stateofleonida.net/', 'active', 'Mapping community interactive map. No licence: never scrape its markers.'),
  S('ign-official-guide', 'IGN official GTA 6 guide (MapGenie)', null, 'web', 'map', 'https://www.ign.com/wikis/gta-6', 'active', 'Official Rockstar-partnered guide launched 20 Nov 2026. Proprietary; assume no reuse. Not fetched.'),
  S('game-checklists', 'Game Checklists', null, 'web', 'map', null, 'active', 'Collectible maps drawn on the official Leonida map. Their pins are their work: cross-reference only, never copy pins wholesale. Seen via the @Sksj002 repost; original URL not recorded.'),
  S('x-sksj002', '@Sksj002 (Marvel Mania)', '@Sksj002', 'x', 'community', 'https://x.com/Sksj002/status/2124675198209364423', 'active', 'Reposted the 12 Game Checklists maps on 2026-11-23. Not the original author.'),
  S('reddit-r-gta6', 'r/GTA6', null, 'reddit', 'community', 'https://www.reddit.com/r/GTA6/', 'active', 'Origin of many finds. Blocked to the research fetcher; use RSS or the official API.'),
  S('reddit-r-gta', 'r/GTA', null, 'reddit', 'community', 'https://www.reddit.com/r/GTA/', 'active', 'Launch-week detail clips.'),
  S('reddit-r-gta6unmoderated', 'r/GTA6unmoderated', null, 'reddit', 'community', 'https://www.reddit.com/r/GTA6unmoderated/', 'active', 'Raw clips.'),
  S('x-gtawikiofficial', '@GTAWikiOfficial', '@GTAWikiOfficial', 'x', 'community', 'https://x.com/GTAWikiOfficial', 'active', 'Credited Jared from the GTA VI Mapping server for Belville.'),
  S('x-gameroll', '@GameRoll_', '@GameRoll_', 'x', 'community', 'https://x.com/GameRoll_', 'active', 'Amplified Belville.'),
  S('x-sirjosephwindsr', '@SirJosephWindsr', '@SirJosephWindsr', 'x', 'community', 'https://x.com/SirJosephWindsr', 'active', 'Fat Jason weight clip (via Kotaku).'),
  S('x-biofalkner', '@biofalkner', '@biofalkner', 'x', 'community', 'https://x.com/biofalkner', 'active', 'World events happening without the player (via Kotaku).'),
  S('x-sickducking', '@sickducking', '@sickducking', 'x', 'community', 'https://x.com/sickducking', 'active', 'Snapmatic doomscrolling (via Kotaku).'),
  S('x-gtasixinfo', '@GTASixInfo', '@GTASixInfo', 'x', 'community', 'https://x.com/GTASixInfo', 'active', "Collector's Box map labels. Post not fetched."),
  S('x-gtasix', '@gtasix_', '@gtasix_', 'x', 'community', 'https://x.com/gtasix_', 'active', 'GTA 6 news aggregator.'),
  S('x-tggonyt', 'TGG', '@TGGonYT', 'x', 'creator', 'https://x.com/TGGonYT', 'active', 'Pre-launch analysis; interviewed Rob Nelson. Listed by gta6everything.com, not individually verified.'),
  S('x-ghillieyt', 'GhillieMaster', '@GhillieYT', 'x', 'creator', 'https://x.com/GhillieYT', 'active', 'Listed by gta6everything.com, not individually verified.'),
  S('x-tylariousyt', 'Tylarious', '@TylariousYT', 'x', 'creator', 'https://x.com/TylariousYT', 'active', 'Listed by gta6everything.com, not individually verified.'),
  S('x-badgergoodger', 'Badger Goodger', '@BadgerGoodger', 'x', 'creator', 'https://x.com/BadgerGoodger', 'active', 'Listed by gta6everything.com, not individually verified.'),
  S('x-mrbossftw', 'MrBossFTW', '@MrBossFTW', 'x', 'creator', 'https://x.com/MrBossFTW', 'active', 'Listed by gta6everything.com, not individually verified.'),
  S('x-broughy1322', 'Broughy1322', '@Broughy1322', 'x', 'creator', 'https://x.com/Broughy1322', 'active', 'Listed by gta6everything.com, not individually verified.'),
  S('x-darkviperau', 'DarkViperAU', '@DarkViperAU', 'x', 'creator', 'https://x.com/DarkViperAU', 'active', 'Listed by gta6everything.com, not individually verified.'),
  S('x-gtaseries', '@GTASeries', '@GTASeries', 'x', 'creator', 'https://x.com/GTASeries', 'active', 'X account of the GTA Series Videos YouTube channel.'),
  S('gta6tuto', 'gta6tuto', null, 'web', 'press', 'https://gta6tuto.com', 'caution', 'SEO fan domain (research/gta6-sources.md section 8): a lead only, never the sole source.'),
  S('x-poulpylibre', '@PoulpyLibre', '@PoulpyLibre', 'x', 'community', null, 'blocked', 'Posts about a leaked-build PC port. Never link, embed or cite (piracy).'),
  S('yt-jokemen-fc', 'Jokemen FC', null, 'youtube', 'creator', 'https://www.youtube.com/@jokemenfc6356', 'active', 'Credited by HotCars as an early finder of the Paul Walker Eclipse.'),
  S('instagram-battlefieldbosh', 'BattleFieldBosh', 'BattleFieldBosh', 'instagram', 'creator', null, 'active', 'Credited by HotCars as an early finder of the Paul Walker Eclipse. Profile URL not recorded.'),
];
for (const e of STATIC) {
  const prev = registry.get(e.id);
  registry.set(e.id, prev ? { ...prev, url: e.url ?? prev.url, role: e.role, status: e.status, notes: e.notes ?? prev.notes } : e);
}
for (const [name, url] of Object.entries(YT_URLS)) {
  const id = 'yt-' + slug(name);
  if (!registry.has(id)) registry.set(id, { id, name, handle: null, platform: 'youtube', role: 'creator', url, status: 'active', notes: 'Channel URL verified in research/gta6-sources.md.' });
}
const outSources = [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
write('content/sources.json', outSources);

// ---------------------------------------------------------------- regions
// From research/gta6-world.md sections 3 to 5 and the official map labels in
// a public X post (MAPX). Places named only in finds carry
// evidence_finds instead of a direct URL: their sources are those finds' sources.
const WIKI = { url: 'https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI', title: 'Grand Theft Auto VI (Wikipedia)' };
const LEON = { url: 'https://gta6info.com/wiki/Leonida', title: 'Leonida (GTA6Info wiki)' };
const VCW = { url: 'https://gta6info.com/wiki/Vice_City', title: 'Vice City (GTA6Info wiki), fetched 2026-11-23' };
const RSL = { url: 'https://www.rockstargames.com/VI/only-in-leonida/vice-city', title: 'Only in Leonida (Rockstar Games), names the six regions, fetched 2026-11-23' };
const GANGS = { url: 'https://www.gtabase.com/gta-6/gangs/', title: 'GTA 6 gangs (GTABase)' };
const MAPX = { url: 'https://x.com/Sksj002/status/2124675198209364423', title: 'Official Leonida map labels, visible under the Game Checklists maps reposted by @Sksj002' };
const R = (id, name, type, parent, sources, extra = {}) => ({ id, name, type, parent, vibe: [], vibe_note: null, real_world_analogue: null, sources, research_ref: 'research/gta6-world.md', notes: null, ...extra });
const W3 = 'research/gta6-world.md section 3';
const W4 = 'research/gta6-world.md section 4';
const BM = 'sources: official map labels in a public X post';
const REGIONS = [
  R('leonida', 'Leonida', 'state', null, [WIKI, LEON], { real_world_analogue: 'Florida', research_ref: W3 }),
  ...[['vice-dale-county', 'Vice-Dale County'], ['mariana-county', 'Mariana County'], ['kelly-county', 'Kelly County'], ['leonard-county', 'Leonard County'], ['lummox-county', 'Lummox County']]
    .map(([id, name]) => R(id, name, 'county', 'leonida', [WIKI, LEON, MAPX], { research_ref: W3, notes: 'One of the five counties shown on the in-game and official map. GTA6Info gives no region-to-county mapping.' })),
  R('vice-city', 'Vice City', 'region', 'vice-dale-county', [VCW, RSL, LEON, MAPX, GANGS], { vibe: ['urban', 'coastal', 'rich', 'poor'], vibe_note: 'The big city: neon, beaches, wealth and poverty side by side.', real_world_analogue: 'Miami', research_ref: W3, notes: 'County comes from GTABase listing Southside, Vice City in Vice-Dale County. GTA6Info names no county for Vice City.' }),
  R('leonida-keys', 'Leonida Keys', 'region', 'leonida', [WIKI, RSL], { vibe: ['coastal'], vibe_note: 'Island chain in the south, where Jason starts out working for local drug runners (official pre-launch bio).', real_world_analogue: 'Florida Keys', research_ref: W3 }),
  R('grassrivers', 'Grassrivers', 'region', 'leonida', [LEON, RSL, MAPX], { vibe: ['swamp', 'dangerous'], vibe_note: 'Swamps and wetlands with alligators, dangerous wildlife and the Kingfishers gang; Skunk Ape sightings.', real_world_analogue: 'Everglades', research_ref: 'research/gta6-world.md sections 3 and 5' }),
  R('port-gellhorn', 'Port Gellhorn', 'region', 'kelly-county', [LEON, RSL, MAPX], { vibe: ['run-down'], vibe_note: 'Run-down Gulf Coast town: shuttered motels, closed attractions, empty strip malls (fan guide wording). Horror events on the north side at night.', real_world_analogue: 'Florida Gulf Coast town', research_ref: 'research/gta6-world.md sections 3 and 5', notes: 'County comes from the area text of find ufo-abduction-port-gellhorn (Kelly County). GTA6Info gives no county.' }),
  R('ambrosia', 'Ambrosia', 'region', 'leonida', [LEON, RSL, GANGS, MAPX], { vibe: ['rural', 'industrial', 'gang-territory'], vibe_note: 'Farmland and the sugar industry; an industrial sugar town and Final Chapter MC biker territory.', research_ref: 'research/gta6-world.md sections 3 and 5', notes: 'Conflict: GTABase (fetched 2026-11-23) gives Final Chapter MC territory as "Ambrosia County, Leonida" and one fan site lists Ambrosia as a county, but Wikipedia, GTA6Info and the official map show only five counties without Ambrosia. A Lake Okeechobee sugar-country analogue is a research inference, not sourced, so real_world_analogue is null.' }),
  R('mount-kalaga', 'Mount Kalaga National Park', 'region', 'lummox-county', [LEON, RSL], { vibe: ['wilderness', 'dangerous'], vibe_note: 'Forests, lakes and hills; hunting and legendary animals; "you may end up the prey".', research_ref: 'research/gta6-world.md sections 3 and 5', notes: 'Florida has no mountains, so this is invented terrain (research inference). Dawson Dam, Hillside Campsite and a fire tower are here.' }),

  R('downtown', 'Downtown', 'district', 'vice-city', [], { research_ref: W4, notes: 'Research calls the name Rockstar-confirmed from trailers, but the official Vice City page fetched 2026-11-23 names no districts.' }),
  R('vice-beach', 'Vice Beach', 'district', 'vice-city', [MAPX], { research_ref: W4, notes: 'Its own label on the official map, with its own police department (Vice Beach PD per GTABase). Treated by research as part of Vice City.' }),
  R('ocean-beach', 'Ocean Beach', 'district', 'vice-city', [VCW], { research_ref: W4, notes: 'Pastel art deco hotels. Home of the Ocean View Hotel.' }),
  R('little-cuba', 'Little Cuba', 'district', 'vice-city', [VCW], { research_ref: W4, notes: 'Research says it is modelled on Little Havana; that claim was not checked on the cited page, so real_world_analogue is null.' }),
  R('stockyard', 'Stockyard', 'district', 'vice-city', [VCW], { research_ref: W4, notes: 'Home of Stock 305 and Electric Fang Tattoo.' }),
  R('washington-beach', 'Washington Beach', 'district', 'vice-city', [VCW], { research_ref: W4 }),
  R('vc-port', 'VC Port', 'district', 'vice-city', [VCW], { research_ref: W4, notes: 'Rockstar pre-launch copy calls it "the cruise ship capital of the world" (research quote, page not recorded).' }),
  R('vcia', 'Vice City International Airport', 'place', 'vice-city', [MAPX], { research_ref: BM }),
  R('crosstown', 'Crosstown', 'district', 'vice-city', [], { research_ref: W4 }),
  R('decor-district', 'Decor District', 'district', 'vice-city', [], { research_ref: W4 }),
  R('washington-island', 'Washington Island', 'district', 'vice-city', [], { research_ref: W4 }),
  R('vespucci-island', 'Vespucci Island', 'district', 'vice-city', [], { research_ref: W4, notes: 'Villa garages, Vespucci Mansion, Neptune Circle. Research reads it as wealthy from where rare cars spawn (inference, so no vibe tag).' }),
  R('penmarch-isle', 'Penmarch Isle', 'district', 'vice-city', [], { research_ref: W4 }),
  R('southside', 'Southside', 'district', 'vice-city', [GANGS], { vibe: ['gang-territory'], vibe_note: 'PTT Youngin$ street gang territory.', research_ref: 'research/gta6-world.md sections 4 and 5' }),

  R('key-lento', 'Key Lento', 'island', 'leonida-keys', [MAPX], { research_ref: W3, notes: "Jason's house, Three Sheets Liquor and a radio tower." }),
  R('south-key-lento', 'South Key Lento', 'place', 'leonida-keys', [], { research_ref: W3 }),
  R('gambit-bay', 'Gambit Bay', 'water', 'leonida-keys', [], { research_ref: W3 }),
  R('bobcat-key', 'Bobcat Key', 'island', 'leonida-keys', [], { research_ref: W3 }),
  R('catalan-key', 'Catalan Key', 'island', 'leonida-keys', [], { research_ref: W3 }),
  R('gloriana-key', 'Gloriana Key', 'island', 'leonida-keys', [], { research_ref: W3 }),
  R('mile-zero-air-station', 'Mile Zero Air Station', 'place', 'leonida-keys', [MAPX, WIKI], { notes: 'Detail comes from the Leonida Keys row of research/gta6-world.md, sourced to Wikipedia, rockstargames.com and GamingBible together; which of them carries the military detail was not recorded.', vibe: ['military', 'dangerous'], vibe_note: 'Military base west of Key Lento with tanks, jets and heavy helicopters; military response.', research_ref: 'research/gta6-world.md sections 3 and 5' }),

  R('cottonmouth-lake', 'Cottonmouth Lake', 'water', 'grassrivers', [], { research_ref: W3 }),
  R('pelican-valley', 'Pelican Valley', 'place', 'grassrivers', [], { research_ref: W3, notes: 'ComicBook.com places Pelican Valley near the Mariana County border.' }),
  R('gullet-marsh', 'Gullet Marsh', 'place', 'grassrivers', [], { research_ref: W3 }),
  R('watson-bay', 'Watson Bay', 'water', 'grassrivers', [MAPX], { research_ref: W3, notes: 'Paradise Garage.' }),
  R('sunrise-rv-park', 'Sunrise RV Park', 'place', 'grassrivers', [], { research_ref: W3 }),

  R('manifest-canyon', 'Manifest Canyon', 'place', 'port-gellhorn', [], { research_ref: W3, notes: 'North of Port Gellhorn; research lists it with Port Gellhorn.' }),
  R('bonanza', 'Bonanza', 'place', 'mount-kalaga', [MAPX], { research_ref: W3, notes: 'Research lists Bonanza (a shed with a secret) under Mount Kalaga.' }),
  R('lake-tallaloko', 'Lake Tallaloko', 'water', 'lummox-county', [], { research_ref: W3 }),

  R('hamlet', 'Hamlet', 'town', 'leonida', [MAPX], { vibe: ['gang-territory'], vibe_note: 'The M7 gang\'s town; the M7 junkyard is "not the safest location".', research_ref: 'research/gta6-world.md sections 3 and 5', notes: 'County unresolved: a fan wiki says Vice-Dale County, other guides say Mariana County. Boone Speedway, police impound, Skeeter\'s bar.' }),
  R('millport', 'Millport', 'town', 'leonida', [], { research_ref: W3, notes: "Jacob's Tavern." }),
  R('waning-sands', 'Waning Sands', 'town', 'leonard-county', [MAPX], { research_ref: W3, notes: 'Frontier Adventure Golf.' }),
  R('belville', 'Belville', 'town', 'leonard-county', [MAPX], { research_ref: W3 }),
  R('grayson', 'Grayson', 'town', 'leonida', [MAPX], { research_ref: W3 }),
  R('moreau', 'Moreau', 'town', 'lummox-county', [], { research_ref: W3, notes: 'Lawton Co. Paper Mill ruins.' }),
  R('capri', 'Capri', 'town', 'leonida', [MAPX], { research_ref: W3 }),
  R('emerald-springs', 'Emerald Springs', 'town', 'lummox-county', [], { research_ref: W3 }),
  R('bluegrass', 'Bluegrass', 'town', 'vice-dale-county', [], { research_ref: W3, notes: 'Research places it in South Vice-Dale County near the tallest radio tower; one video places the tower in Bluegrass.' }),
  R('hilport', 'Hilport', 'town', 'leonida', [MAPX], { research_ref: BM }),
  R('southwind', 'Southwind', 'town', 'leonida', [MAPX], { research_ref: BM }),
  R('draper-island', 'Draper Island', 'island', 'leonida', [MAPX], { research_ref: BM }),
  R('little-hardin-island', 'Little Hardin Island', 'island', 'leonida', [], { research_ref: W3, notes: 'St. Lucia Lighthouse.' }),
  R('hyde-island', 'Hyde Island', 'island', 'leonida', [], { vibe: ['dangerous'], vibe_note: 'Hunter event (the Hyde Island manhunt).', research_ref: 'research/gta6-world.md sections 3 and 5' }),
  R('south-point-airfield', 'South Point Airfield', 'place', 'leonida', [], { research_ref: 'research/gta6-finds.json', notes: 'South of Hamlet per guides; ComicBook.com places the alien facility in Pelican Valley instead.' }),
  R('bobcat-bight', 'Bobcat Bight', 'place', 'mariana-county', [], { research_ref: 'research/gta6-finds.json', notes: 'Coast off North Mariana County.' }),
  R('leonida-bay', 'Leonida Bay', 'water', 'leonida', [], { research_ref: 'research/gta6-finds.json', notes: 'Off Mariana County, west of Watson Bay. May be the same water as the Gulf of Leonida map label; not confirmed.' }),
  R('gulf-of-leonida', 'Gulf of Leonida', 'water', 'leonida', [MAPX], { research_ref: BM }),
];
const evidence = {};
for (const f of outFinds) for (const rid of f.region_ids) (evidence[rid] ??= []).push(f.id);
write('content/regions.json', REGIONS.map((r) => ({ ...r, evidence_finds: evidence[r.id] ?? [], updated_at: UPDATED })));
console.log(`finds ${outFinds.length}, connections ${outConnections.items.length}, sources ${outSources.length}`);
