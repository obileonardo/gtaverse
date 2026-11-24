// Reads component sources at build time, so the props and notes on /design are the code's own words and never drift.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
export const read = (file: string) => readFileSync(join(root, file), 'utf8');

/** The comment block at the top of a component (its `//` lines before the first import or interface). */
export function headerNote(file: string): string {
  const lines = read(file).replace(/^---\n/, '').split('\n');
  let out = '';
  for (const l of lines) {
    const m = l.match(/^\s*\/\/ ?(.*)$/);
    if (!m) break;
    // Hard-wrapped sentences join; indented lines (lists, usage) keep their own line.
    out += /^\s{2,}\S/.test(m[1]) || !m[1].trim() || !out ? `\n${m[1].trim()}` : ` ${m[1].trim()}`;
  }
  return out.trim();
}

/** A declaration from a source file, from its first line to its matching closing brace (`interface Props {...}`). */
export function declaration(file: string, start: RegExp): string {
  const src = read(file);
  const m = start.exec(src);
  if (!m) return '';
  const open = src.indexOf('{', m.index);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) {
      const end = src.indexOf('\n', i);
      return src.slice(m.index, end < 0 ? undefined : end).trim();
    }
  }
  return '';
}

// The "Use" column of the token tables in docs/DESIGN-SYSTEM.md, for tokens whose CSS carries no comment.
const docRows = read('docs/DESIGN-SYSTEM.md').split('\n').filter((l) => l.startsWith('| `--'));
export function docNote(name: string): string {
  const row = docRows.find((l) => l.split('|')[1]?.match(/`(--[\w-]+)`/g)?.some((t) => t === `\`${name}\``));
  if (!row) return '';
  const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
  return cells.length >= 3 ? cells[cells.length - 1].replace(/`/g, '') : '';
}

// Every source file that can use a token (the design system page itself and tokens.css are left out).
const files: { path: string; text: string }[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(astro|ts|tsx|css)$/.test(name)) files.push({ path: relative(root, p), text: readFileSync(p, 'utf8') });
  }
};
walk(join(root, 'src'));
const tokensCss = files.find((f) => f.path === 'src/styles/tokens.css')?.text ?? '';
const sources = files.filter((f) => !f.path.startsWith('src/components/design/') && !f.path.startsWith('src/pages/design/') && f.path !== 'src/styles/tokens.css');

/** The files that read a token with var(--name), or name it in a script (getPropertyValue, token readers). */
export function usage(name: string): string[] {
  const re = new RegExp(`${name.replace(/[-]/g, '\\-')}(?![\\w-])`);
  // A family read by a template (`var(--level-${tone})`, `--spring-${name}`) counts for each of its members.
  const family = name.replace(/[\w]+$/, '');
  const dyn = family.length > 3 ? `${family}\${` : null;
  const viaToken = tokensCss.includes(`var(${name})`) ? ['src/styles/tokens.css'] : []; // read through another token
  return [...sources.filter((f) => re.test(f.text) || (dyn !== null && f.text.includes(dyn))).map((f) => f.path), ...viaToken];
}
