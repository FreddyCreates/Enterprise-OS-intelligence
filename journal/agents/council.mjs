#!/usr/bin/env node
/**
 * COUNCIL — the journal's seven build-time agents, run in council order.
 *
 *   SCRIBA   ─ index the canon              (LUMEN depends on the index)
 *   LUMEN    ─ illuminate connections        (reads SCRIBA's index)
 *   CUSTOS   ─ guard integrity              (fail-closed; halts on failure)
 *   MAGISTER ─ teach the operator           (advisory; never fails the build)
 *   FABRICOR ─ build derivative artefacts   (.txt · OG cards · JSON API)
 *   NUNTIUS  ─ emit discovery surfaces      (RSS · Atom · sitemap · robots)
 *   ARBITER  ─ judge the build              (manifest of everything; powers /audit/)
 *
 * Order is intentional:
 *   - SCRIBA writes the index that LUMEN needs.
 *   - CUSTOS gates before any derivative is produced (no point producing
 *     OG cards or feeds for a corpus that failed integrity).
 *   - MAGISTER reports while the operator is watching.
 *   - FABRICOR and NUNTIUS produce the public surface.
 *   - ARBITER runs last so it can hash every artefact that already exists.
 *
 * Doctrine:
 *   • Every agent reads only sanitiser-verified content from
 *     journal/src/content/papers (synced by scripts/sync-papers.mjs).
 *   • Every agent's output is deterministic given the same input.
 *   • CUSTOS is the gate. If CUSTOS fails, the council exits non-zero and
 *     the build pipeline halts before any derivative is created.
 *   • MAGISTER suggests; it never modifies. The lexicon stays human-curated.
 *   • FABRICOR re-projects; it never authors.
 *   • NUNTIUS announces; it never measures.
 *   • ARBITER reports; it does not gate (CUSTOS already did).
 *
 * Usage:
 *   npm run agents          (from journal/)
 *   node agents/council.mjs (directly)
 */

import { c } from './_common.mjs';
import scriba   from './scriba.mjs';
import lumen    from './lumen.mjs';
import custos   from './custos.mjs';
import magister from './magister.mjs';
import fabricor from './fabricor.mjs';
import nuntius  from './nuntius.mjs';
import arbiter  from './arbiter.mjs';

console.log('');
console.log(c.bold(c.gold('  THE COUNCIL — building the journal\'s metadata layer')));
console.log(c.dim('  ════════════════════════════════════════════════════════════'));

async function main() {
  let custosOk = true;

  try { scriba();          } catch (e) { fail('SCRIBA', e); }
  try { lumen();           } catch (e) { fail('LUMEN', e); }
  try { const r = await custos();   if (!r.ok) custosOk = false; } catch (e) { fail('CUSTOS', e); }

  // CUSTOS halts the council BEFORE any derivative artefact is produced.
  // No point shipping OG cards, feeds, or manifests of a drifted corpus.
  if (!custosOk) {
    console.log(c.dim('  ════════════════════════════════════════════════════════════'));
    console.log(c.red(c.bold('  ✗ CUSTOS reported failures — see custos-report.json. Build halted.')));
    console.log('');
    process.exit(1);
  }

  try { await magister(); } catch (e) { fail('MAGISTER', e); }
  try { await fabricor(); } catch (e) { fail('FABRICOR', e); }
  try { nuntius();        } catch (e) { fail('NUNTIUS', e); }
  try { arbiter();        } catch (e) { fail('ARBITER', e); }

  console.log(c.dim('  ════════════════════════════════════════════════════════════'));
  console.log(c.green(c.bold('  ✓ council complete — index · graph · manifest · feeds · cards · API ready.')));
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
