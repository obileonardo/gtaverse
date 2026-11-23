# GTA 6 sources to monitor (credit list and update pipeline)

Research date: 2026-11-23. "Verified" means this agent confirmed the URL resolves (YouTube channels via the oEmbed API on a video, pages via fetch). Handles from secondary lists are marked "listed by".

## 1. Official (ground truth)

| Source | URL | Why |
|---|---|---|
| Rockstar Newswire | https://www.rockstargames.com/newswire | Patch notes, official confirmations. Page is JS-rendered; the fetcher saw only its title |
| GTA VI site | https://www.rockstargames.com/VI | Official region pages ("Only in Leonida"), art, design reference. Verified |
| Rockstar Games on X | https://x.com/RockstarGames | Announcements (listed by gta6everything.com) |
| Rockstar Support on X | https://x.com/RockstarSupport | Bug and patch status (listed; unverified) |
| Rockstar Discord "grand-theft-auto-vi" channel | via Discord partnership (Feb 2025, 127k members then) | Official community hub (search snippet, Sportskeeda) |

## 2. Press that covers finds daily (fetchability noted for our pipeline)

| Outlet | Why | Fetchable by our agent |
|---|---|---|
| Kotaku https://kotaku.com | Ran the launch live blog and "18 coolest details" list, credits Reddit/X finders by handle | Yes (intermittent DNS) |
| GameRant https://gamerant.com | Fastest step-by-step guides (Jake Fillery, Waseem Muhammad); rarely credits finders | Yes |
| GamingBible https://www.gamingbible.com | Links original Reddit threads | Yes |
| TheGamer https://www.thegamer.com | Links original Reddit threads | Yes |
| ComicBook.com, HotCars, Complex, HypeFresh | Round-ups; HotCars credits creators | Yes |
| Dexerto https://www.dexerto.com | Breaks many finds; has a GTA 6 wiki section | No (DNS failure) |
| Polygon, GameSpot, IGN, Destructoid, VGC | Major outlets; IGN hosts the official guide | Blocked or 403 to the fetcher |
| Yahoo Tech live blog | Running launch updates | 403 |
| RockstarINTEL https://rockstarintel.com , X https://x.com/RockstarINTEL | Independent Rockstar news outlet (states no affiliation) | 429 rate-limited |

## 3. Wikis and databases

| Source | URL | Notes |
|---|---|---|
| GTA6Info wiki | https://gta6info.com/wiki/ | Best single aggregator: Easter Eggs page (73 entries with source links), 77 mechanics pages, "Community Discoveries" category. Marks single-source claims. No content licence stated; written by its forum community |
| gta6wiki.eu | https://gta6wiki.eu/easter-eggs/ | 72 Easter eggs, updated 2026-11-23. No open licence; takedowns to contact@gta6wiki.eu |
| Vice City DB | https://vicecitydb.org | Secrets pages with numbered confirmations and access-dated sources. Corrections: info@vicecitydb.org. No licence stated |
| GTABase | https://www.gtabase.com/gta-6/ | Map, vehicles, gangs, wanted and Criminal Profile guides. User-suggested pins credit the contributor |
| GTA Wiki (community) | https://gta.wiki | Linked from the mapping community; X @GTAWikiOfficial credits finders |
| GTA Maplib | https://map.gtadb.org | Map database linked from State of Leonida (not fetched) |
| PowerPyx | https://www.powerpyx.com | Trophy guide; cited for mechanics |
| OutputLag | https://outputlag.com/guides/gta-6-unique-weapons-locations/ | Unique and gold weapon tracker |

## 4. Community mapping

| Source | URL | Notes |
|---|---|---|
| GTA VI Mapping Discord | https://discord.gg/gta-mapping | The mapping project since 2022; member "Jared" found the Belville house. Best partner for coordinates |
| State of Leonida map | https://map.stateofleonida.net/ | Mapping community's interactive map |
| IGN official guide (MapGenie) | https://www.ign.com/wikis/gta-6 (not fetched) | Official Rockstar-partnered guide, launched 20 Nov 2026 |

## 5. Reddit

| Subreddit | Why |
|---|---|
| r/GTA6 https://www.reddit.com/r/GTA6/ | Origin of many finds (u/akspree monument, u/Tr1angleChoke Chiliad chatter) |
| r/GTA https://www.reddit.com/r/GTA/ | Launch-week detail clips (u/CobraMGMT, u/xSpiritOfFire, u/Isunova, u/KavaKavoo) |
| r/GTA6unmoderated https://www.reddit.com/r/GTA6unmoderated/ | Raw clips (u/seepa-man immortal sniper NPC) |

Reddit is blocked to our fetcher; monitor through RSS (`/new/.rss`) or the official API under Reddit's terms. Reddit posts can be embedded.

## 6. YouTube channels (all verified via oEmbed on a GTA 6 video, all embeddable)

Ranked by how many distinct finds they covered in this research and by guide quality.

| Channel | URL | Strength |
|---|---|---|
| Robbin Rams | https://www.youtube.com/@RobbinRams | Most prolific: tower egg, ghost ship, Marbelle, Mario block, Michael's boat, Dexter, golden AK, glider |
| Postmode | https://www.youtube.com/@postmodeorg | Precise location-titled guides (lighthouse, Marbelle, Belville, Mario cap, Satan, Tallaloko) |
| xGarbett | https://www.youtube.com/@xGarbett | Early UFO, meteorite and Satan coverage |
| ZoneX | https://www.youtube.com/@ZoneXbez | UFO, dog island, crab outpost, tower |
| GTA Series Videos | https://www.youtube.com/@GTASeriesVideos | Long-standing GTA channel; Skunk Ape, Cool Dog. X: https://x.com/GTASeries |
| Techzamazing | https://www.youtube.com/@Techzamazing | Full walkthroughs (alien facility, Skunk Ape endings) |
| MrDalekJD | https://www.youtube.com/@MrDalekJD | First tower egg video, Satan fight |
| TheGamingRevolution | https://www.youtube.com/@TheGamingRevo | Tower egg, meteorite |
| LunarGaming | https://www.youtube.com/@xLunarGaming | Hellspawn shotgun, President's bunker |
| Arekkz Gaming | https://www.youtube.com/@ArekkzGaming | Stat-boost round-up, bunker |
| Lootward | https://www.youtube.com/@Lootward | Hell, bunker |
| Gamer Guides | https://www.youtube.com/@GamerGuidesYT | Skunk Ape full guide |
| GosuNoob | https://www.youtube.com/@Gosunoob | Safe codes and valuables |
| Perfect Score | https://www.youtube.com/@PerfectScore | Satan walkthrough |
| WhizL, ZacCoxTV, Greenskull, Dan Allen Gaming, Fizhy, Deltia's Gaming, Games from Mars, EKW the gamer, Tristan, Hollow | see `gta6-finds.json` source URLs | One or two finds each |

Pre-launch analysis and news channels (listed by gta6everything.com, not individually verified): TGG https://x.com/TGGonYT (also interviewed Rob Nelson), GhillieMaster https://x.com/GhillieYT, Tylarious https://x.com/TylariousYT, Badger Goodger https://x.com/BadgerGoodger, MrBossFTW https://x.com/MrBossFTW, Broughy1322 https://x.com/Broughy1322, DarkViperAU https://x.com/DarkViperAU.

## 7. X accounts that originated or amplified finds

| Account | Why |
|---|---|
| @GTAWikiOfficial https://x.com/GTAWikiOfficial | Credited "Jared from the GTA VI Mapping server" for Belville |
| @GameRoll_ https://x.com/GameRoll_ | Amplified Belville |
| @ProfessorMikeX | Tony the parrot report |
| @cclipgod | Red Hulk clip (with IShowSpeed) |
| @SirJosephWindsr | "Fat Jason" weight clip |
| @biofalkner | World events happening without the player |
| @sickducking | Snapmatic doomscrolling |
| @SourceVI | Cool Dog and Loosy real-dog link |
| @GTASixInfo | Collector's Box map labels |
| @gtasix_ | GTA 6 news aggregator |

(Handles from Kotaku's fetched list or from search results; individual posts were not fetched because x.com blocks the fetcher.)

## 8. Accounts and sources to treat with caution

- **Dozens of SEO fan domains** (gta6*.com, gtaside, gtavibes, gta6tuto, whengta6, cyberleek.mom and similar) publish fast, often AI-written guides with conflicting codes and locations. Use only as leads.
- **AI image tools** ranking for "GTA 6 loading screen" are marketing, not style documentation.
- **"Leonida" native PC port / leaked Xbox build** posts on X (for example @PoulpyLibre) concern piracy of a leaked build. Do not link or embed.
- **Pre-launch "leaked map" videos** and "map leak" pages on university subdomains (widescope.stanford.edu etc.) are spam.

## 9. Suggested update pipeline

1. Daily: GTA6Info "Recent changes" (https://gta6info.com/wiki/Special:RecentChanges) and gta6wiki.eu for new entries with source links.
2. Daily: RSS of r/GTA6, r/GTA, r/GTA6unmoderated filtered by "found", "secret", "easter egg".
3. Daily: YouTube search for the channels above (YouTube Data API, sorted by date).
4. For each new find: trace to the earliest post (Reddit/X timestamp), record finder handle, confirm with a second independent video, then set `verification`.
5. Weekly: Rockstar Newswire for patches that remove glitches or change locations.
