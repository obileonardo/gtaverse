# Home hero

The home hero has three background modes, switched by three circles at the top right: **trailer**, **key art** and **line art**. They rotate on their own in that order; the active circle's ring is the timer. Choosing a circle jumps to that mode and stops the rotation; choosing the same circle again starts it again. The A24 stack of featured finds (desktop) and the Apple TV slides (phone) sit over whichever mode is showing.

Code: `src/components/home/Hero.astro` (markup and styles), `hero-stage.ts` (modes, loading, rotation, sound), `hero-peek.ts` (the clip frame on the find list), `line-art.ts` (the line art renderer; checked by `scripts/test/line-art.test.ts`).

## The modes

| Mode | What shows | How long | Source |
|---|---|---|---|
| Trailer | A 10.1 s loop cut from Rockstar's official Launch Trailer (its opening run in the Keys: the marina from the air, a boat being polished, the boatyard, a phone call, a seaplane on the water), muted and looping. A round sound toggle (bottom right) appears while it plays; sound is fetched only when turned on and is the cover-art music. | One loop (10.1 s) | `GTAVI_Launch_Trailer.mp4` (the character reel from `GTAVI_Videos.zip` is the fallback) |
| Key art | One official wallpaper per visit, with a slow push in; the next one on the next visit. | 8 s | `GTAVI_Artwork_Wallpapers.zip` |
| Line art | Our own wireframe drawings, white hairlines on the night navy with one pink accent: the Leonida coastline, a coupe on a palm street, a pistol and a pump shotgun of our own design over a floor grid, a person walking a dog (both walk, in step). One drawing per visit, in that order; each outline draws on as one continuous pen stroke (`--ease-standard`, a single edge `--ease-out`) and everything is down by 3.75 s, while the camera drifts slowly (linear). | 10 s | Drawn by code (`line-art.ts`); the coastline is traced by code from the official map |

When a mode is chosen, key art and line art keep moving to their next image or shot every 8 or 10 s; the trailer keeps looping.

## Loading rules

- The poster (the loop's first frame, AVIF or WebP, responsive) is in the HTML and paints first. The video is `preload="none"` and gets its sources only after the page has loaded and while the hero is on screen; AV1 WebM first, H.264 MP4 as the fallback. Phones (767 px and narrower) get a 720 x 1280 crop of the loop, framed shot by shot, and portrait posters and wallpapers.
- `prefers-reduced-motion`: poster only, no rotation, no push in; the circles still switch modes and the line art shows its finished drawing.
- Save-Data, 2G and 3G connections: poster only (the rotation still runs).
- The video, sound, line art and the timer pause when the tab is hidden or the hero scrolls out of view.
- Key art images load one ahead; the line art module (about 7 KB compressed) and the coastline (about 3 KB compressed) load while the mode before it plays.
- Without the built media (CI, a fresh clone) the hero shows the line art alone, with no circles.

## The peek frame

Hovering a line of the A24 stack shows that find's clip thumbnail (the YouTube thumbnail of the creator's own post, `ytThumb()`) in a small tilted frame just past the end of the line, over the lines above and below. Moving to another line moves the frame there and swaps the picture; leaving the list hides it; clicking opens the find. Keyboard focus places it without movement. On touch screens the first tap shows the frame and the second tap opens the find; on the phone's slides the frame appears above the title. Spoiler and mature finds, and Shorts, never show a thumbnail: the frame shows the sunrise glow instead. The YouTube clip is no longer the hero background.

## Building the media

The media is Rockstar's copyright: it is never committed. `public/media/` and `.cache/` are git-ignored, and CI's asset guard blocks media files and `public/media/`. Like the map tiles, a deploy must build it first; `pnpm run deploy` does, in this order:

```
pnpm install
pnpm map:fetch       # the official map, for the coastline (docs/MAP.md)
pnpm media:fetch     # download both zips and the Launch Trailer into .cache/media/, check size, type and SHA-256, extract the zips
pnpm media:build     # encode the trailer loop, posters, sound and key art, trace the coastline into public/media/hero/
pnpm build
```

- `content/hero-media.json` is the only committed piece: the two zips and the Launch Trailer (URL, size, SHA-256), `trailer.use` (`launch`, or `reel` for the fallback), the launch cut's in and out points, its shots and why they were chosen, the reel's clips, the crop focus of every shot, clip and wallpaper, the sound section and the credits. Change the selection there, then run `pnpm media:build` again.
- `media:fetch` fails if Rockstar changes a download (size or hash), so the selection is checked again before anything ships. The Launch Trailer (782 MB) is only read by ffmpeg as data; `file` must report it as `video/mp4`.

### Choosing the launch cut

The cut must show no logo, no title card, no overlaid text and no story beat; scenic or establishing shots come first. The Launch Trailer is fast cut (no shot is longer than 8.2 s), so the loop is a run of consecutive shots: 5.033 to 15.167 s, from the cut after the WELCOME TO THE KEYS sign to the cut before the ROCKSTAR GAMES PRESENTS card. The loop restarts on a shot change (seaplane to marina), so the restart looks like one more of the trailer's own cuts; no crossfade is needed, and one would have to borrow frames from the sign or the title card. The only readable words are in-world signs on the marina roof in the first 1.9 s; the phone crop leaves them out. `media:build` checks that the shots run back to back inside the chosen range and trims by frame number. The trailer is letterboxed (3840 x 1920 picture inside 3840 x 2160); `active` crops the bars off first. The trailer's own audio is not used: it is a continuous music bed that may carry dialogue, and the sound toggle plays a separate file that does not stay in step with the picture.
- `media:build` skips the encode when `content/hero-media.json`, the script and every output are unchanged since the last run (`--force` rebuilds), so repeat deploys from the same machine take seconds.
- `media:build` needs an ffmpeg with libx264 and libsvtav1 (or libvpx-vp9). The dev dependency `ffmpeg-static` provides one; its binary is downloaded on the first `media:build`, not on every install, so CI stays fast. `FFMPEG_BIN` points at another ffmpeg. A full `media:build` takes about 8 minutes on an M-series Mac with this build (most of it the AV1 encode); an unchanged rerun takes under a second.
- `media:coast` (part of `media:build`) reads the cached map by numbers only, at a quarter of its size: every pixel inside the printed frame is classed by colour as sea (the map's saturated cyan), land (the greens and greys of the ground) or unsure (print: labels, roads, grid lines, light shallows); unsure pixels take the class of the nearest sure pixel; a morphological close and open remove rivers, lettering, bridges and specks; only water that reaches the frame counts as sea, so lakes fill in; the main island and the islands of at least 0.4% of its area (at most 12) are kept. Each island's outer edge is traced as one closed loop, smoothed with a Gaussian and simplified to about 640 points in all. Nobody looks at the map to do this (docs/MAP.md, decision OS7); the result was checked by its numbers and by rendering our own outline. `MAP_IMAGE` overrides the map path; `--preview` prints a text picture of the cleaned land mask.

Output of 2026-11-24:

| File | Size |
|---|---|
| `trailer-1920x1080.webm` (AV1) / `.mp4` (H.264, CRF 23), 10.1 s from the Launch Trailer | 1,519 KB / 3,508 KB |
| `trailer-720x1280.webm` / `.mp4` (CRF 24) | 631 KB / 1,401 KB |
| `poster-1920.avif` / `poster-portrait-720.avif` | 73 KB / 23 KB |
| `sound.m4a` (24 s, AAC 96 kbps, fetched on demand) | 289 KB |
| Key art at 1920, AVIF | 85 to 122 KB each |
| `coast.json` (10 outlines, 610 points) | 8.6 KB, 2.7 KB compressed |

## Credit

The hero shows "Trailer: Rockstar Games" under the circles while the trailer shows (`trailer.credit` in `content/hero-media.json`), "Art: Rockstar Games" while the key art shows, and the line art's own credit while it shows ("Line art: The Vice Files", plus "Coastline from the official map, Rockstar Games" on a second line for the coastline). The caption keeps 24px clear of the island and its sub bar: it sits beside the circles from 1680px wide, where its longest line fits, and right aligned under them below that, as on the phone. The coastline and sidearms drawings keep their lines below the island, the intro and the caption: `line-art.ts` moves (and if needed scales) them into the band the hero sets with `--line-top` and `--line-bottom` on the canvas.
