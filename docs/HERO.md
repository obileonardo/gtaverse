# Home hero

The home hero has three background modes, switched by three circles at the top right: **trailer**, **key art** and **line art**. They rotate on their own in that order; the active circle's ring is the timer. Choosing a circle jumps to that mode and stops the rotation; choosing the same circle again starts it again. The A24 stack of featured finds (desktop) and the Apple TV slides (phone) sit over whichever mode is showing.

Code: `src/components/home/Hero.astro` (markup and styles), `hero-stage.ts` (modes, loading, rotation, sound), `hero-peek.ts` (the clip frame on the find list), `line-art.ts` (the line art renderer).

## The modes

| Mode | What shows | How long | Source |
|---|---|---|---|
| Trailer | A 9 s reel cut from Rockstar's eight official character clips, muted and looping. A round sound toggle (bottom right) appears while it plays; sound is fetched only when turned on. | One loop (9 s) | `GTAVI_Videos.zip` |
| Key art | One official wallpaper per visit, with a slow push in; the next one on the next visit. | 8 s | `GTAVI_Artwork_Wallpapers.zip` |
| Line art | Our own wireframe drawings, white hairlines on the night navy with one pink accent: the Leonida coastline, a coupe on a palm street, a person walking a dog. One shot per visit; lines draw on while the camera drifts. | 10 s | Drawn by code (`line-art.ts`); the coastline is traced by code from the official map |

When a mode is chosen, key art and line art keep moving to their next image or shot every 8 or 10 s; the trailer keeps looping.

## Loading rules

- The poster (the reel's first frame, AVIF or WebP, responsive) is in the HTML and paints first. The video is `preload="none"` and gets its sources only after the page has loaded and while the hero is on screen; AV1 WebM first, H.264 MP4 as the fallback. Phones (767 px and narrower) get a 720 x 1280 crop of the reel and portrait posters and wallpapers.
- `prefers-reduced-motion`: poster only, no rotation, no push in; the circles still switch modes and the line art shows its finished drawing.
- Save-Data, 2G and 3G connections: poster only (the rotation still runs).
- The video, sound, line art and the timer pause when the tab is hidden or the hero scrolls out of view.
- Key art images load one ahead; the line art module (about 4 KB compressed) and the coastline (about 3 KB) load while the mode before it plays.
- Without the built media (CI, a fresh clone) the hero shows the line art alone, with no circles.

## The peek frame

Hovering a line of the A24 stack shows that find's clip thumbnail (the YouTube thumbnail of the creator's own post, `ytThumb()`) in a small tilted frame just past the end of the line, over the lines above and below. Moving to another line moves the frame there and swaps the picture; leaving the list hides it; clicking opens the find. Keyboard focus places it without movement. On touch screens the first tap shows the frame and the second tap opens the find; on the phone's slides the frame appears above the title. Spoiler and mature finds, and Shorts, never show a thumbnail: the frame shows the sunrise glow instead. The YouTube clip is no longer the hero background.

## Building the media

The media is Rockstar's copyright: it is never committed. `public/media/` and `.cache/` are git-ignored, and CI's asset guard blocks media files and `public/media/`. Like the map tiles, a deploy must build it first; `pnpm run deploy` does, in this order:

```
pnpm install
pnpm map:fetch       # the official map, for the coastline (docs/MAP.md)
pnpm media:fetch     # download both zips into .cache/media/, check size and SHA-256, extract
pnpm media:build     # encode the reel, posters, sound and key art, trace the coastline into public/media/hero/
pnpm build
```

- `content/hero-media.json` is the only committed piece: the two zips (URL, size, SHA-256), the clip order and in and out points, the crop focus of every clip and wallpaper, the sound section and the credit. Change the selection there, then run `pnpm media:build` again.
- `media:fetch` fails if Rockstar changes a zip (size or hash), so the selection is checked again before anything ships.
- `media:build` skips the encode when `content/hero-media.json`, the script and every output are unchanged since the last run (`--force` rebuilds), so repeat deploys from the same machine take seconds.
- `media:build` needs an ffmpeg with libx264 and libsvtav1 (or libvpx-vp9). The dev dependency `ffmpeg-static` provides one; its binary is downloaded on the first `media:build`, not on every install, so CI stays fast. `FFMPEG_BIN` points at another ffmpeg. The AV1 encode takes about 10 minutes on an M-series Mac with this build.
- `media:coast` (part of `media:build`) reads the cached map by numbers only: every pixel inside the printed frame is classed as water (the map's cyan) or land by its colour, the mask is cleaned, outlines are traced and simplified to about 450 points. Nobody looks at the map to do this (docs/MAP.md, decision OS7). `MAP_IMAGE` overrides the map path.

Output of 2026-11-24:

| File | Size |
|---|---|
| `trailer-1920x1080.webm` (AV1) / `.mp4` (H.264, CRF 31) | 2,345 KB / 3,439 KB |
| `trailer-720x1280.webm` / `.mp4` (CRF 32) | 1,174 KB / 1,437 KB |
| `poster-1920.avif` / `poster-portrait-720.avif` | 44 KB / 19 KB |
| `sound.m4a` (24 s, AAC 96 kbps, fetched on demand) | 289 KB |
| Key art at 1920, AVIF | 85 to 122 KB each |
| `coast.json` | 6.7 KB |

## Credit

The hero shows "Trailer and art: Rockstar Games" under the circles while the trailer or key art shows, and the line art's own credit while it shows ("Line art: The Vice Files", plus "Coastline from the official map, Rockstar Games" for the coastline).
