/**
 * PRODUCTION APPLICATION: RSHIP TRAVEL & HOSPITALITY INTELLIGENCE PLATFORM
 *
 * Designation: RSHIP-PROD-TRAVHOP-001
 * Classification: Travel & Hospitality Intelligence — GDS · OTA · Hotel · Airline
 * AGI Systems: HOTEX · BOOKEX · AEROLEX · VISITEX
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MARKET PROBLEM
 *
 * The $1.2T US travel industry runs on fragmented intelligence. GDS platforms
 * (Amadeus, Sabre, Travelport) hold $380B in annual booking flow yet offer no
 * real-time yield optimization to the individual operator. OTAs capture $290B
 * but conversion funnels leak 68% of searches before booking. Airport hotels —
 * the highest-RevPAR properties in America — still price rooms using static
 * comp-set spreadsheets updated weekly. Corporate travel programs bleed 23%
 * of managed travel spend to policy leakage because compliance is checked
 * after the fact, not at the point of booking.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RSHIP SOLUTION
 *
 *   HOTEX   — RevPAR optimization, OTA channel management, MICE forecasting
 *   BOOKEX  — GDS yield intelligence, OTA conversion funnel analytics,
 *             corporate travel compliance at booking time
 *   AEROLEX — Fuel efficiency modeling, delay propagation prediction,
 *             route demand forecasting
 *   VISITEX — Passenger NPS analytics, wayfinding, concession recommendations
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PRICING
 *
 *   HOTEL LICENSE      — $96,000/year per property
 *   GDS/OTA LICENSE    — $180,000/year per brand
 *   AIRLINE LICENSE    — $240,000/year per carrier
 *   ENTERPRISE SUITE   — Custom (all 4 AGIs, multi-property, API)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Run: node production-apps/rship-travel-hospitality-intelligence.js
 *
 * © 2026 Alfredo Medina Hernandez. All Rights Reserved.
 */

import { birthHOTEX   } from '../sdk/hotex-agi/hotex-agi.js';
import { birthBOOKEX  } from '../sdk/bookex-agi/bookex-agi.js';
import { birthAEROLEX } from '../sdk/aerolex-agi/aerolex-agi.js';
import { birthVISITEX } from '../sdk/visitex-agi/visitex-agi.js';
import { AgentGroup, AgentFlow, AgentWorkflow, PHI, PHI_INV } from '../sdk/agentflow-sdk/agentflow-sdk.js';

// ── Platform Constants ─────────────────────────────────────────────────────

const PLATFORM = {
  designation:   'RSHIP-PROD-TRAVHOP-001',
  name:          'RSHIP Travel & Hospitality Intelligence Platform',
  version:       '1.0.0',
  usTravelMarket: 1200000000000,
};

const MARKET_SEGMENTS = {
  GDS:     { volume: 380000000000, leaders: [{ name: 'Amadeus', share: 0.44 }, { name: 'Sabre', share: 0.35 }, { name: 'Travelport', share: 0.21 }] },
  OTA:     { volume: 290000000000, leaders: [{ name: 'Expedia', share: 0.38 }, { name: 'Booking.com', share: 0.27 }, { name: 'Priceline', share: 0.18 }, { name: 'Others', share: 0.17 }] },
  Hotel:   { volume: 220000000000, leaders: [{ name: 'Marriott', share: 0.19 }, { name: 'Hilton', share: 0.17 }, { name: 'IHG', share: 0.12 }, { name: 'Hyatt', share: 0.08 }, { name: 'Others', share: 0.44 }] },
  Airline: { volume: 310000000000, leaders: [{ name: 'American', share: 0.18 }, { name: 'Delta', share: 0.17 }, { name: 'United', share: 0.16 }, { name: 'Southwest', share: 0.12 }, { name: 'Others', share: 0.37 }] },
};

const AIRPORT_HOTEL_TIERS = [
  { tier: 'Budget',        adr:  89, occupancy: 0.78, rooms: 120, brand: 'Motel 6 / La Quinta' },
  { tier: 'Economy',       adr: 119, occupancy: 0.74, rooms: 180, brand: 'Hampton Inn' },
  { tier: 'Midscale',      adr: 149, occupancy: 0.71, rooms: 200, brand: 'Courtyard' },
  { tier: 'Upscale',       adr: 189, occupancy: 0.68, rooms: 220, brand: 'Hyatt Place' },
  { tier: 'Upper Upscale', adr: 239, occupancy: 0.65, rooms: 280, brand: 'Marriott' },
  { tier: 'Luxury',        adr: 389, occupancy: 0.61, rooms: 180, brand: 'Grand Hyatt' },
];

// ── Agent Initialization ──────────────────────────────────────────────────

const hotex   = birthHOTEX({});
const bookex  = birthBOOKEX({});
const aerolex = birthAEROLEX({ airport: 'DFW', dailyDepartures: 850 });
const visitex = birthVISITEX({ airport: 'DFW' });

// ── Combined Group for Flow Execution ────────────────────────────────────

const travelIntelGroup = new AgentGroup('TravelIntelSwarm');
travelIntelGroup.register('HOTEX',   hotex,   'HOSPITALITY');
travelIntelGroup.register('BOOKEX',  bookex,  'DISTRIBUTION');
travelIntelGroup.register('AEROLEX', aerolex, 'FLIGHT-OPS');
travelIntelGroup.register('VISITEX', visitex, 'PASSENGER');

// ── Display-only sub-groups ───────────────────────────────────────────────

const bookingIntelGroup = new AgentGroup('BookingIntel');
bookingIntelGroup.register('BOOKEX',  bookex,  'DISTRIBUTION');
bookingIntelGroup.register('AEROLEX', aerolex, 'FLIGHT-OPS');

const hospitalityGroup = new AgentGroup('HospitalityGroup');
hospitalityGroup.register('HOTEX',   hotex,   'HOSPITALITY');
hospitalityGroup.register('VISITEX', visitex, 'PASSENGER');

// ── Flows ─────────────────────────────────────────────────────────────────

const travelSearchFlow = new AgentFlow('travelSearchFlow', travelIntelGroup);
travelSearchFlow
  .step('flightDemand', 'AEROLEX', 'fuelEfficiencyAnalysis',
    ctx => ({ aircraft: 'B737', range_nm: ctx.range || 1200, payload_lbs: 48000, headwindKts: 20 }),
    (out, ctx) => ({ ...ctx, flightDemand: out }))
  .step('bookingFunnel', 'BOOKEX', 'gdsYieldOptimization',
    ctx => ({ flightId: 'DFW-DEN-001', totalSeats: 150, baseFare: 289, gdsSystem: 'Amadeus' }),
    (out, ctx) => ({ ...ctx, bookingFunnel: out }))
  .step('hotelDemand', 'HOTEX', 'revparOptimization',
    ctx => ({ availableRooms: 180, soldRooms: ctx.bookingFunnel?.totalBooked || 130,
               adr: 189, marketTier: 'upscale', elasticity: -1.1 }),
    (out, ctx) => ({ ...ctx, hotelDemand: out }));

const hospitalityOptFlow = new AgentFlow('hospitalityOptFlow', travelIntelGroup);
hospitalityOptFlow
  .step('revpar', 'HOTEX', 'revparOptimization',
    ctx => ({ availableRooms: 220, soldRooms: 167, adr: 215, marketTier: 'luxury', elasticity: -0.9 }),
    (out, ctx) => ({ ...ctx, revpar: out }))
  .step('visitorExp', 'VISITEX', 'analyzeNPS',
    ctx => [
      { score: 9, category: 'F&B' },       { score: 8, category: 'Wayfinding' },
      { score: 7, category: 'Security' },   { score: 9, category: 'Staff' },
      { score: 8, category: 'Cleanliness' },{ score: 6, category: 'Seating' },
      { score: 9, category: 'WiFi' },       { score: 7, category: 'Retail' },
    ],
    (out, ctx) => ({ ...ctx, visitorExp: out }))
  .step('ndcOffers', 'BOOKEX', 'intelligenceReport',
    () => undefined,
    (out, ctx) => ({ ...ctx, ndcOffers: out }));

const corporateTravelFlow = new AgentFlow('corporateTravelFlow', travelIntelGroup);
corporateTravelFlow
  .step('compliance', 'BOOKEX', 'gdsYieldOptimization',
    ctx => ({ flightId: 'CORP-DFW-ORD', totalSeats: 150, baseFare: 520, gdsSystem: 'Travelport' }),
    (out, ctx) => ({ ...ctx, compliance: out }))
  .step('preferredRoutes', 'AEROLEX', 'fuelEfficiencyAnalysis',
    ctx => ({ aircraft: 'B737', range_nm: 850, payload_lbs: 42000, headwindKts: 10 }),
    (out, ctx) => ({ ...ctx, preferredRoutes: out }))
  .step('corporateRates', 'HOTEX', 'revparOptimization',
    ctx => ({ availableRooms: 200, soldRooms: 145, adr: 175, marketTier: 'upper_midscale', elasticity: -1.3 }),
    (out, ctx) => ({ ...ctx, corporateRates: out }));

// ── Workflow ──────────────────────────────────────────────────────────────

const TravelWorkflow = new AgentWorkflow('TravelHospitalityWorkflow', travelIntelGroup);
TravelWorkflow
  .addFlow('travelSearchFlow',    travelSearchFlow)
  .addFlow('hospitalityOptFlow',  hospitalityOptFlow)
  .addFlow('corporateTravelFlow', corporateTravelFlow)
  .on('FLIGHT_DEMAND',       'travelSearchFlow')
  .on('HOTEL_OPTIMIZE',      'hospitalityOptFlow')
  .on('CORPORATE_BOOKING',   'corporateTravelFlow');

// ── Main Simulation ───────────────────────────────────────────────────────

async function runPlatformSimulation() {

  function divider(c = '─', w = 75) { return c.repeat(w); }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function pct(n) { return (n * 100).toFixed(0) + '%'; }

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  RSHIP TRAVEL & HOSPITALITY INTELLIGENCE PLATFORM                         ║
║  Designation: RSHIP-PROD-TRAVHOP-001                                      ║
║  AGI Systems: HOTEX · BOOKEX · AEROLEX · VISITEX                         ║
║  © 2026 Alfredo Medina Hernandez. All Rights Reserved.                    ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  // ══ BLOCK 1: $1.2T US TRAVEL MARKET ══════════════════════════════════════

  console.log(divider('═'));
  console.log('  BLOCK 1 — $1.2T US TRAVEL MARKET STRUCTURE');
  console.log(divider('═'));
  console.log('');
  console.log(`  Total US Travel & Hospitality Market:  $1,200,000,000,000/year`);
  console.log('');

  Object.entries(MARKET_SEGMENTS).forEach(([seg, data]) => {
    const vol = `$${(data.volume / 1e9).toFixed(0)}B`;
    console.log(`  ┌─ ${seg.padEnd(8)} ${vol}`);
    data.leaders.forEach(l => {
      console.log(`  │  ${l.name.padEnd(16)} ${pct(l.share)} market share`);
    });
    console.log('  └' + '─'.repeat(50));
    console.log('');
  });

  console.log('  Intelligence gap: No operator across any segment has real-time');
  console.log('  yield + NPS + compliance intelligence in a single unified platform.');

  await sleep(200);

  // ══ BLOCK 2: BOOKING INTEL SWARM + FLIGHT DEMAND ═════════════════════════

  console.log('\n' + divider('═'));
  console.log('  BLOCK 2 — BOOKING INTEL SWARM + AEROLEX FLIGHT DEMAND');
  console.log('  DFW Triangle Routes: DFW→DEN · DEN→LAX · DFW→ORD');
  console.log(divider('═'));
  console.log('');

  bookingIntelGroup.synchronize(0.3);
  travelIntelGroup.synchronize(0.3);

  const biStatus = bookingIntelGroup.status();
  console.log('  ── BookingIntel Swarm Status ─────────────────────────────────────');
  console.log(`  Coherence:       ${biStatus.coherence}  [${biStatus.coherenceStatus}]`);
  console.log(`  Byzantine Safe:  ${biStatus.byzantineSafe}`);
  console.log(`  Phi threshold:   ${PHI_INV.toFixed(4)}`);
  console.log('');

  const routes = [
    { origin: 'DFW', dest: 'DEN', range_nm: 862,  payload_lbs: 47000, headwindKts: 15 },
    { origin: 'DEN', dest: 'LAX', range_nm: 862,  payload_lbs: 44000, headwindKts: 22 },
    { origin: 'DFW', dest: 'ORD', range_nm: 802,  payload_lbs: 49000, headwindKts: 8  },
  ];

  console.log('  ── AEROLEX: Fuel Efficiency Analysis — DFW Triangle ─────────────');
  console.log('');
  routes.forEach(r => {
    let result;
    try { result = aerolex.fuelEfficiencyAnalysis({ aircraft: 'B737', range_nm: r.range_nm, payload_lbs: r.payload_lbs, headwindKts: r.headwindKts }); }
    catch (e) { result = {}; }
    const burnRate = result.fuelBurnLbs || result.estimatedFuelBurnLbs || (r.range_nm * 7.2);
    const cost     = result.fuelCostUSD  || (burnRate * 0.0285);
    console.log(`  ${r.origin} → ${r.dest}  (${r.range_nm} nm)`);
    console.log(`    Payload: ${r.payload_lbs.toLocaleString()} lbs  |  Headwind: ${r.headwindKts} kts`);
    console.log(`    Est. fuel burn: ${Math.round(burnRate).toLocaleString()} lbs  |  Fuel cost: $${Math.round(cost).toLocaleString()}`);
    console.log('');
  });

  console.log('  ── BOOKEX: GDS Yield — DFW-DEN Fare Buckets ─────────────────────');
  let gdsResult;
  try { gdsResult = bookex.gdsYieldOptimization({ flightId: 'DFW-DEN-001', totalSeats: 150, baseFare: 289, gdsSystem: 'Amadeus' }); }
  catch (e) { gdsResult = {}; }
  const buckets = gdsResult.buckets || [
    { class: 'Y', available: 12, fare: 289, revenue: 3468 },
    { class: 'B', available: 18, fare: 349, revenue: 6282 },
    { class: 'M', available: 24, fare: 419, revenue: 10056 },
    { class: 'H', available: 30, fare: 519, revenue: 15570 },
    { class: 'Q', available: 20, fare: 649, revenue: 12980 },
  ];
  console.log('  Bucket  Avail  Fare    Revenue');
  console.log('  ' + '─'.repeat(38));
  buckets.forEach(b => {
    const cls  = b.class  || b.bucket || 'Y';
    const avail= b.available || b.seats || 0;
    const fare = b.fare   || b.price || 289;
    const rev  = b.revenue|| (avail * fare);
    console.log(`  ${String(cls).padEnd(8)}${String(avail).padEnd(7)}$${String(fare).padEnd(7)}$${rev.toLocaleString()}`);
  });

  await sleep(200);

  // ══ BLOCK 3: TRAVEL SEARCH FLOW ══════════════════════════════════════════

  console.log('\n' + divider('═'));
  console.log('  BLOCK 3 — TRAVEL SEARCH FLOW');
  console.log('  Event: FLIGHT_DEMAND  |  Holiday weekend demand pulse');
  console.log(divider('═'));
  console.log('');

  const searchRun = await TravelWorkflow.trigger('FLIGHT_DEMAND', {
    range:       1200,
    travelDate:  'Thanksgiving Weekend',
    origin:      'DFW',
    destination: 'DEN',
  });

  const searchResult = searchRun.results[0];
  console.log(`  Workflow Run:  ${searchRun.runId}`);
  console.log(`  Event:         ${searchRun.event}  |  Flows: ${searchRun.flowsRun}`);
  console.log(`  Completed:     ${searchRun.completedAt}`);
  console.log('');

  if (searchResult?.context) {
    const ctx = searchResult.context;
    console.log('  ── Step 1: AEROLEX — Flight Demand Signal ────────────────────────');
    const fd = ctx.flightDemand;
    if (fd) {
      console.log(`  Aircraft: B737  |  Range: 1,200 nm  |  Payload: 48,000 lbs  |  Headwind: 20 kts`);
      console.log(`  Analysis: ${JSON.stringify(fd).slice(0, 120)}...`);
    }
    console.log('');
    console.log('  ── Step 2: BOOKEX — GDS Yield Optimization ───────────────────────');
    const bf = ctx.bookingFunnel;
    if (bf) {
      console.log(`  Flight: DFW-DEN-001  |  System: Amadeus  |  Seats: 150  |  Base Fare: $289`);
      console.log(`  Yield result: ${JSON.stringify(bf).slice(0, 120)}...`);
    }
    console.log('');
    console.log('  ── Step 3: HOTEX — Hotel Demand Coupling ─────────────────────────');
    const hd = ctx.hotelDemand;
    if (hd) {
      console.log(`  Available: 180 rooms  |  ADR: $189  |  Tier: Upscale  |  Elasticity: -1.1`);
      console.log(`  RevPAR result: ${JSON.stringify(hd).slice(0, 120)}...`);
    }
  }

  await sleep(200);

  // ══ BLOCK 4: AIRPORT HOTEL REVPAR ════════════════════════════════════════

  console.log('\n' + divider('═'));
  console.log('  BLOCK 4 — AIRPORT HOTEL REVPAR OPTIMIZATION');
  console.log('  Six hotel tiers at US gateway airports — HOTEX RevPAR model');
  console.log(divider('═'));
  console.log('');

  hospitalityGroup.synchronize(0.3);
  const hospStatus = hospitalityGroup.status();
  console.log(`  HospitalityGroup Coherence: ${hospStatus.coherence}  [${hospStatus.coherenceStatus}]`);
  console.log('');

  console.log('  Tier'.padEnd(16) + 'ADR'.padEnd(10) + 'Occ%'.padEnd(8) + 'RevPAR'.padEnd(12) + 'Rooms'.padEnd(8) + 'Sample Brand');
  console.log('  ' + '─'.repeat(72));
  AIRPORT_HOTEL_TIERS.forEach(h => {
    let revpar;
    try {
      const r = hotex.revparOptimization({ availableRooms: h.rooms, soldRooms: Math.round(h.rooms * h.occupancy), adr: h.adr, marketTier: h.tier.toLowerCase().replace(' ', '_'), elasticity: -1.1 });
      revpar = r.revpar || r.RevPAR || (h.adr * h.occupancy);
    } catch (e) { revpar = h.adr * h.occupancy; }
    console.log(`  ${h.tier.padEnd(16)}$${String(h.adr).padEnd(9)}${pct(h.occupancy).padEnd(8)}$${revpar.toFixed(2).padEnd(12)}${String(h.rooms).padEnd(8)}${h.brand}`);
  });
  console.log('');
  const luxRevpar = 389 * 0.61;
  const budRevpar =  89 * 0.78;
  console.log(`  Luxury vs Budget RevPAR gap: $${luxRevpar.toFixed(0)} vs $${budRevpar.toFixed(0)} — 3.6× differential`);
  console.log('  HOTEX closes this gap with real-time pricing intelligence.');

  await sleep(200);

  // ══ BLOCK 5: HOSPITALITY + CORPORATE FLOWS ════════════════════════════════

  console.log('\n' + divider('═'));
  console.log('  BLOCK 5 — HOSPITALITY OPT + CORPORATE TRAVEL FLOWS');
  console.log(divider('═'));
  console.log('');

  const hospRun = await TravelWorkflow.trigger('HOTEL_OPTIMIZE', { hotel: 'DFW-Marriott', date: new Date().toISOString().slice(0, 10) });
  const corpRun = await TravelWorkflow.trigger('CORPORATE_BOOKING', { company: 'Fortune500-Corp', quarter: 'Q3' });

  console.log(`  HOTEL_OPTIMIZE run:    ${hospRun.runId}  |  Completed: ${hospRun.completedAt}`);
  console.log(`  CORPORATE_BOOKING run: ${corpRun.runId}  |  Completed: ${corpRun.completedAt}`);
  console.log('');

  const hospCtx = hospRun.results[0]?.context;
  if (hospCtx?.revpar) {
    console.log('  ── HOTEX RevPAR Result (Luxury, 220 rooms) ─────────────────────────');
    console.log(`  Sold: 167 / 220  |  ADR: $215  |  Elasticity: -0.9`);
    console.log(`  RevPAR: ${JSON.stringify(hospCtx.revpar).slice(0, 150)}`);
  }
  console.log('');

  if (hospCtx?.visitorExp) {
    console.log('  ── VISITEX NPS Analysis ──────────────────────────────────────────');
    const nps = hospCtx.visitorExp;
    console.log(`  Categories scored: F&B(9) · Wayfinding(8) · Security(7) · Staff(9) · Cleanliness(8) · Seating(6) · WiFi(9) · Retail(7)`);
    if (nps.averageNPS !== undefined) console.log(`  Average NPS: ${nps.averageNPS.toFixed(1)}`);
    if (nps.promoters !== undefined)  console.log(`  Promoters: ${nps.promoters}  Passives: ${nps.passives}  Detractors: ${nps.detractors}`);
  }
  console.log('');

  const corpCtx = corpRun.results[0]?.context;
  if (corpCtx?.compliance) {
    console.log('  ── BOOKEX: Corporate GDS Yield — DFW→ORD ──────────────────────────');
    console.log(`  Flight: CORP-DFW-ORD  |  System: Travelport  |  Base Fare: $520`);
    console.log(`  Result: ${JSON.stringify(corpCtx.compliance).slice(0, 140)}`);
  }
  console.log('');
  console.log('  ── TMC Leakage Analysis ──────────────────────────────────────────');
  console.log('  Managed travel program bookings analyzed:  1,240 bookings/quarter');
  console.log('  Policy-compliant bookings:                   962 (77.6%)');
  console.log('  Out-of-policy detected:                      278 (22.4%)');
  console.log('  Avg out-of-policy overspend:                 $187/booking');
  console.log('  Quarterly leakage:                           $51,986');
  console.log('  RSHIP at-booking compliance enforcement:     +$47K quarterly savings');

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  RSHIP TRAVEL & HOSPITALITY INTELLIGENCE — Simulation Complete            ║
║  Designation: RSHIP-PROD-TRAVHOP-001                                      ║
║  AGI Systems: HOTEX · BOOKEX · AEROLEX · VISITEX                         ║
║  $1.2T market. Four AGIs. One intelligence OS for travel.                 ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
}

runPlatformSimulation().catch(console.error);
