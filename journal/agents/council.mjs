#!/usr/bin/env node
/**
 * COUNCIL — the journal's four build-time agents, run in council order.
 *
 *   SCRIBA   ─ index the canon (must run first; LUMEN depends on the index)
 *   LUMEN    ─ illuminate connections (reads SCRIBA's index)
 *   CUSTOS   ─ guard integrity (fail-closed; non-zero exit fails the build)
 *   MAGISTER ─ teach the operator (advisory; never fails the build)
 *
 * Doctrine:
 *   • Every agent reads only sanitiser-verified content from
 *     journal/src/content/papers (synced by scripts/sync-papers.mjs).
 *   • Every agent's output is deterministic given the same input.
 *   • CUSTOS is the gate. If CUSTOS fails, the council exits non-zero and
 *     the build pipeline halts before astro renders anything.
 *   • MAGISTER suggests; it never modifies. The lexicon stays human-curated.
 *
 * Usage:
 *   npm run agents          (from journal/)
 *   node agents/council.mjs (directly)
 *
 * Output: journal/src/data/{search-index,paper-graph,custos-report,magister-report}.json
 */

import { c } from './_common.mjs';
import scriba   from './scriba.mjs';
import lumen    from './lumen.mjs';
import custos   from './custos.mjs';
import magister from './magister.mjs';

console.log('');
console.log(c.bold(c.gold('  THE COUNCIL — building the journal\'s metadata layer')));
console.log(c.dim('  ════════════════════════════════════════════════════════════'));

async function main() {
  let custosOk = true;

  try { scriba();          } catch (e) { fail('SCRIBA', e); }
  try { lumen();           } catch (e) { fail('LUMEN', e); }
  try { const r = await custos();   if (!r.ok) custosOk = false; } catch (e) { fail('CUSTOS', e); }
  try { await magister();           } catch (e) { fail('MAGISTER', e); }

  console.log(c.dim('  ════════════════════════════════════════════════════════════'));
  if (!custosOk) {
    console.log(c.red(c.bold('  ✗ CUSTOS reported failures — see custos-report.json. Build halted.')));
    console.log('');
    process.exit(1);
  }
  console.log(c.green(c.bold('  ✓ council complete — search index + paper graph + reports ready.')));
  console.log('');
}

function fail(name, e) {
  console.error(c.red(`✗ ${name} crashed: ${e.stack || e.message}`));
  process.exit(2);
}

main().catch((e) => {
  console.error(c.red(`✗ council error: ${e.stack || e.message}`));
  process.exit(2);
});
