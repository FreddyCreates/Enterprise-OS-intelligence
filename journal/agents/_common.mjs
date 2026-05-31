/**
 * _common.mjs — utilities shared by the journal's four operator-agents.
 *
 * SCRIBA · LUMEN · CUSTOS · MAGISTER all import from here.
 *
 * No I/O policy beyond fs read/write. No network. No telemetry.
 * Every agent's output is deterministic and re-runnable from the sanitised
 * corpus in /papers.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const JOURNAL = path.resolve(__dirname, '..');
export const ROOT    = path.resolve(JOURNAL, '..');
export const PAPERS_SYNCED = path.join(JOURNAL, 'src', 'content', 'papers');
export const DATA    = path.join(JOURNAL, 'src', 'data');

fs.mkdirSync(DATA, { recursive: true });

// ── ANSI colours ─────────────────────────────────────────────────────────────
export const c = {
  reset:  '\x1b[0m',
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue:   (s) => `\x1b[34m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  gold:   (s) => `\x1b[38;5;178m${s}\x1b[0m`,
};

// ── Paper loader (reads synced markdown with frontmatter) ────────────────────
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

export function loadPapers() {
  const files = fs.readdirSync(PAPERS_SYNCED)
    .filter((f) => f.endsWith('.md'))
    .sort();

  return files.map((f) => {
    const full = fs.readFileSync(path.join(PAPERS_SYNCED, f), 'utf8');
    const m = full.match(FRONTMATTER_RE);
    if (!m) {
      throw new Error(`[council] paper has no frontmatter: ${f}`);
    }
    const fm = parseYamlish(m[1]);
    return {
      ...fm,
      filename: f,
      body: m[2],
    };
  });
}

// Minimal YAML-ish parser — only the shapes our sync-papers.mjs emits.
function parseYamlish(src) {
  const out = {};
  for (const line of src.split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let v = m[2];

    if (v === 'null')  v = null;
    else if (v === 'true')  v = true;
    else if (v === 'false') v = false;
    else if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
    else if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).trim();
      v = v === '' ? [] : v.split(',').map((x) => JSON.parse(x.trim()));
    } else if (v.startsWith('"')) {
      try { v = JSON.parse(v); } catch { /* keep as string */ }
    }
    out[key] = v;
  }
  return out;
}

// ── Text normalisation for TF-IDF ────────────────────────────────────────────

// English stopwords — pruned to keep recall on academic text.
const STOPWORDS = new Set([
  'a','an','and','are','as','at','be','because','been','before','being','but',
  'by','can','could','did','do','does','doing','from','had','has','have','having',
  'he','her','here','hers','him','himself','his','how','i','if','in','into','is',
  'it','its','itself','just','let','me','more','most','my','myself','no','nor',
  'not','now','of','off','on','once','only','or','other','our','ours','ourselves',
  'out','over','own','said','same','she','should','so','some','such','than','that',
  'the','their','theirs','them','themselves','then','there','these','they','this',
  'those','through','to','too','until','up','very','was','we','were','what','when',
  'where','which','while','who','whom','why','will','with','would','you','your',
  'yours','yourself','yourselves','also','any','about','above','below','again',
  'further','during','between','each','few','both','these','those','one','two',
  'three','first','second','third','many','much','still','yet',
]);

// Tokenize: lowercase, split on non-letter, drop short tokens & stopwords.
// Keeps mathematical greek letters that show up in academic text.
export function tokenize(text) {
  const stripped = text
    // Strip code fences and inline code.
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    // Strip markdown image/link wrappers but keep text.
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Strip residual markdown punctuation.
    .replace(/[#*_~>|]/g, ' ');

  const toks = [];
  for (const raw of stripped.split(/[^A-Za-zΑ-Ωα-ωÀ-ÿ]+/)) {
    if (!raw) continue;
    const t = raw.toLowerCase();
    if (t.length < 3) continue;
    if (STOPWORDS.has(t)) continue;
    toks.push(t);
  }
  return toks;
}

// Term-frequency map for a single document.
export function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

// Cosine similarity between two sparse Maps (term → number).
export function cosine(a, b) {
  // Iterate over the smaller side.
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [k, v] of small) {
    const w = big.get(k);
    if (w !== undefined) dot += v * w;
  }
  if (dot === 0) return 0;
  let an = 0, bn = 0;
  for (const v of a.values()) an += v * v;
  for (const v of b.values()) bn += v * v;
  return dot / Math.sqrt(an * bn);
}

// ── Pretty output ────────────────────────────────────────────────────────────

export function bannerStart(name, latin, role) {
  console.log('');
  console.log(c.gold(`  ${name}`) + c.dim(`  ${latin}`));
  console.log(c.dim(`  ${role}`));
  console.log(c.dim('  ' + '─'.repeat(58)));
}

export function bannerEnd(name, lines) {
  for (const l of lines) console.log('  ' + l);
  console.log('');
}

export function writeJson(file, data) {
  const dest = path.join(DATA, file);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf8');
  return dest;
}
