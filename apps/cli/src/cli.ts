import {
  launchBrowser,
  loginAndNavigate,
  loadConfig,
  selectCard,
  buildHistoryUrl,
  waitForTrips,
  extractTripsFromPage,
  processTrips,
  type Period,
} from '@choochoo/core';

const period = (process.argv[2] as Period | undefined) ?? 'this-month';
const config = loadConfig();
const card = selectCard(config.cards);
const targetUrl = buildHistoryUrl(card.id, period);
console.log(`Period: ${period}, Card: ${card.name}`);

const { page, close } = await launchBrowser({ headless: false });
try {
  await loginAndNavigate(page, config, targetUrl);

  const hasTrips = await waitForTrips(page);
  if (!hasTrips) {
    console.log('No trips found for this period.');
  } else {
    const raw = await extractTripsFromPage(page);
    const { trips, excluded, totalEur } = processTrips(raw);

    console.log(`\n${trips.length} trips (${excluded} zero-cost excluded)`);
    for (const t of trips) {
      console.log(`  ${String(t.num).padStart(2)}  ${t.date.padEnd(28)}  ${t.from} → ${t.to}  €${t.priceEur.toFixed(2)}`);
    }
    console.log(`  Total: €${totalEur.toFixed(2)}\n`);
  }
} finally {
  await close();
}
