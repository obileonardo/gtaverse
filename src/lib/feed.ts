// New finds, newest first, from each find's added_at (the day it entered the guide). Feeds /rss.xml and the
// "New this week" row. Finds added the same day keep content order.
import { finds, type Find } from './content';

export const byNewest: Find[] = finds
  .map((f, i) => ({ f, i }))
  .sort((a, b) => (b.f.added_at ?? '').localeCompare(a.f.added_at ?? '') || a.i - b.i)
  .map(({ f }) => f);

const DAY = 86_400_000;

/** Finds added in the seven days up to `today` (the build date: the site is static, so this is as of the last build). */
export const addedThisWeek = (today = new Date()) => {
  const from = new Date(today.getTime() - 7 * DAY).toISOString().slice(0, 10);
  return byNewest.filter((f) => (f.added_at ?? '') > from);
};

/** Story spoilers and mature finds keep their summary out of feeds and previews; the page holds it behind its gate. */
export const safeSummary = (f: Find) =>
  f.spoiler ? 'Story spoiler: open the find to read it.' : f.mature ? 'Mature content: open the find to read it.' : f.summary;
