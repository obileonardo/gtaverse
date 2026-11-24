// Prefilled GitHub issue links built from the repository's own templates (.github/ISSUE_TEMPLATE/*), so the
// form people see on GitHub is the template, with the find already named. Plain links: they work without
// JavaScript, and nothing is sent to us. GitHub uses `body` in place of the template text, so the template's
// own text is carried in the body with the find filled in.
import correctionTemplate from '../../.github/ISSUE_TEMPLATE/correction.md?raw';
import newFindTemplate from '../../.github/ISSUE_TEMPLATE/new-find.md?raw';
import { site, absolute } from './site';

const stripFrontmatter = (t: string) => t.replace(/^---\n[\s\S]*?\n---\n+/, '');
const templateTitle = (t: string) => t.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] ?? '';

const issueUrl = (file: string, title: string, body?: string) => {
  const q = new URLSearchParams({ template: file, title });
  if (body !== undefined) q.set('body', body);
  return `${site.repo}/issues/new?${q.toString()}`;
};

/** "Suggest a correction" for a find, or for the site in general when no find is given. */
export const correctionLink = (find?: { slug: string; title: string }) => {
  if (!find) return issueUrl('correction.md', templateTitle(correctionTemplate));
  const body = stripFrontmatter(correctionTemplate).replace(
    /(## What is wrong\?\n)/,
    `$1Find: ${find.slug} (${absolute(`/finds/${find.slug}`)})\n`,
  );
  return issueUrl('correction.md', `${templateTitle(correctionTemplate)}${find.slug}`, body);
};

/** "Submit a find": the New find template as it is. */
export const submitFindLink = () => issueUrl('new-find.md', templateTitle(newFindTemplate));

/** "Request a takedown" on GitHub (public); email is the private route. */
export const takedownIssueLink = () => `${site.repo}/issues/new?template=takedown-request.md`;

/** Public list of correction issues (open and closed): the corrections log. */
export const correctionsLogLink = () => `${site.repo}/issues?q=${encodeURIComponent('is:issue label:correction')}`;
