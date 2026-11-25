// The click-to-load clip (same behaviour as src/components/Clip.astro): the creator's thumbnail first, the player
// only when tapped (youtube-nocookie, or the X or Reddit post embed, which then grows the frame to the post's height),
// spoiler and mature clips behind a reveal. An X or Reddit photo post shows its photo with a link to the post; any
// other clip opens the creator's post. A find with no clip shows the sunrise glow with its type in display caps.
import { useEffect, useRef, useState } from 'react';
import { embedForTheme, postEmbedOrigins, postHeight } from '../../lib/clip';
import { Icon } from './ui';
import { platformLabel, type MapFind } from './types';
import { isUnlocked, type ChapterSetting } from '../../lib/chapter';

export function ClipPlayer({ find, variant, chapter = 'none' }: { find: MapFind; variant: 'drawer' | 'sheet'; chapter?: ChapterSetting }) {
  // A spoiler clip opens by itself once the visitor's chapter setting reaches its chapter (src/lib/chapter.ts).
  const hidden = find.mature || (find.spoiler && !isUnlocked(find.chapterGate, chapter));
  const [revealed, setRevealed] = useState(!hidden);
  const [playing, setPlaying] = useState(false);
  const [postH, setPostH] = useState<number | null>(null);
  const player = useRef<HTMLIFrameElement>(null);
  useEffect(() => { setRevealed(!hidden); setPlaying(false); setPostH(null); }, [find.slug, hidden]);

  const clip = find.clip;
  const embed = clip?.embed ?? null;
  const isPost = !!embed && !clip?.yt;
  // A post embed reports its height; the frame follows it (until then it keeps its 16:9 box).
  useEffect(() => {
    if (!playing || !isPost) return;
    const onMessage = (e: MessageEvent) => {
      if (!postEmbedOrigins.includes(e.origin) || e.source !== player.current?.contentWindow) return;
      const h = postHeight(e.data);
      if (h) setPostH(h);
    };
    addEventListener('message', onMessage);
    return () => removeEventListener('message', onMessage);
  }, [playing, isPost]);

  const theme = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  const reason = find.spoiler ? 'spoiler' : 'mature';
  return (
    <figure className={`clip-frame clip-frame--${variant}`} style={postH ? { aspectRatio: 'auto', height: Math.ceil(postH) } : undefined}>
      {playing && embed ? (
        <iframe
          ref={player}
          className="clip-frame__player"
          src={isPost ? embedForTheme(embed, theme) : embed}
          title={`Clip: ${find.title}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <>
          <div className="clip-frame__art" aria-hidden="true">
            {revealed && clip?.thumb ? <img src={clip.thumb} alt="" loading="lazy" decoding="async" /> : <span className="clip-frame__glow"><span className="clip-frame__kind">{find.categoryLabel}</span></span>}
          </div>
          {!revealed ? (
            <button type="button" className="clip-frame__reveal btn btn--glass btn--m" onClick={() => setRevealed(true)}>
              <Icon name="clip" size={20} />
              <span className="btn__label">{find.spoiler ? 'Reveal spoiler clip' : 'Show mature clip'}</span>
            </button>
          ) : embed ? (
            <button type="button" className="clip-frame__play" onClick={() => setPlaying(true)} aria-label={`Play clip: ${find.title}`}>
              <span className="clip-frame__playdisc"><Icon name="play" size={28} /></span>
            </button>
          ) : clip ? (
            <a className="clip-frame__reveal btn btn--glass btn--m" href={clip.url} target="_blank" rel="noopener">
              <span className="btn__label">{clip.photo ? 'View on' : 'Watch on'} {platformLabel(clip.platform)}</span>
              <Icon name="arrow-up-right" size={20} />
            </a>
          ) : null}
        </>
      )}
      {hidden && !revealed && <figcaption className="sr-only">This clip is hidden because it is marked {reason}.</figcaption>}
    </figure>
  );
}
