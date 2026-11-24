// The click-to-load clip (same behaviour as src/components/Clip.astro): the creator's thumbnail first, the
// youtube-nocookie player only when tapped, spoiler and mature clips behind a reveal. Clips on other platforms
// open the creator's post. A find with no clip shows the sunrise glow with its type in display caps.
import { useEffect, useState } from 'react';
import { ytThumb, ytEmbed } from '../../lib/clip';
import { Icon } from './ui';
import { platformLabel, type MapFind } from './types';
import { isUnlocked, type ChapterSetting } from '../../lib/chapter';

export function ClipPlayer({ find, variant, chapter = 'none' }: { find: MapFind; variant: 'drawer' | 'sheet'; chapter?: ChapterSetting }) {
  // A spoiler clip opens by itself once the visitor's chapter setting reaches its chapter (src/lib/chapter.ts).
  const hidden = find.mature || (find.spoiler && !isUnlocked(find.chapterGate, chapter));
  const [revealed, setRevealed] = useState(!hidden);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setRevealed(!hidden); setPlaying(false); }, [find.slug, hidden]);

  const yt = find.clip?.yt ?? null;
  const reason = find.spoiler ? 'spoiler' : 'mature';
  return (
    <figure className={`clip-frame clip-frame--${variant}`}>
      {playing && yt ? (
        <iframe
          className="clip-frame__player"
          src={ytEmbed(yt)}
          title={`Clip: ${find.title}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <div className="clip-frame__art" aria-hidden="true">
            {revealed && yt ? <img src={ytThumb(yt)} alt="" loading="lazy" decoding="async" /> : <span className="clip-frame__glow"><span className="clip-frame__kind">{find.categoryLabel}</span></span>}
          </div>
          {!revealed ? (
            <button type="button" className="clip-frame__reveal btn btn--glass btn--m" onClick={() => setRevealed(true)}>
              <Icon name="clip" size={20} />
              <span className="btn__label">{find.spoiler ? 'Reveal spoiler clip' : 'Show mature clip'}</span>
            </button>
          ) : yt ? (
            <button type="button" className="clip-frame__play" onClick={() => setPlaying(true)} aria-label={`Play clip: ${find.title}`}>
              <span className="clip-frame__playdisc"><Icon name="play" size={28} /></span>
            </button>
          ) : find.clip ? (
            <a className="clip-frame__reveal btn btn--glass btn--m" href={find.clip.url} target="_blank" rel="noopener">
              <span className="btn__label">Watch on {platformLabel(find.clip.platform)}</span>
              <Icon name="arrow-up-right" size={20} />
            </a>
          ) : null}
        </>
      )}
      {hidden && !revealed && <figcaption className="sr-only">This clip is hidden because it is marked {reason}.</figcaption>}
    </figure>
  );
}
