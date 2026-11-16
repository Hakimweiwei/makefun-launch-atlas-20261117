const DAY = 86_400_000;
const clip = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const categoryMultiple = (name) => {
  const c = (name || '').toLowerCase();
  if (/dex|derivative|perp|options/.test(c)) return 1.2;
  if (/lending|credit|cdp/.test(c)) return 0.85;
  if (/yield|farm|staking|restak/.test(c)) return 0.6;
  if (/bridge|wrapped|cex/.test(c)) return 0.45;
  return 0.75;
};

function farmPlan(p, recorded) {
  const chain = p.chains?.[0] || 'the chain verified in its official documentation';
  const category = (p.category || '').toLowerCase();
  let action = 'the smallest reversible core-product action';
  if (/lending|credit|cdp/.test(category)) action = 'a small unleveraged supply position, with no borrowing';
  else if (/dex/.test(category)) action = 'one small spot swap, without leverage or illiquid pools';
  else if (/yield|farm/.test(category)) action = 'a small single-asset position, after checking lock-up and withdrawal terms';
  else if (/deriv|perp|options/.test(category)) action = 'the product testnet or paper-trading flow; avoid a leveraged mainnet trade';
  return [
    `Research ${p.name} for 20 minutes at $0: verify official documentation, product domains and current token status. The snapshot ${recorded ? 'records a token' : 'records no token'}; it does not establish eligibility or a future launch.`,
    `On ${chain}, first simulate ${action} if the official product supports it. Allow 15 minutes and $0 principal for simulation; do not connect a wallet until the domain and contract are verified.`,
    `If suitable after simulation, cap the experimental principal at $25 and total network fees at $3. These are user-set budget ceilings, not quoted costs. If fees or minimums exceed either cap, skip ${p.name}.`,
    `Review one genuinely useful product interaction weekly for three weeks, 10 minutes each. Do not manufacture volume or use multiple wallets; stop if the product has no useful action within your budget.`,
    `Test withdrawal after the first interaction, revoke unused approvals and record principal, fees and time. No points or token rewards are assumed; locked deposits, contract failure and fees can make the experiment a loss.`,
  ];
}

export function buildBoard(snapshot) {
  const asOf = Date.parse(snapshot.as_of + 'T00:00:00Z');
  if (!Number.isFinite(asOf) || !Array.isArray(snapshot.protocols)) throw new Error('Invalid snapshot date/protocols');
  const watch = new Set(snapshot.watchlist || []);
  const seen = new Set();
  const rows = snapshot.protocols.map((p) => {
    if (seen.has(p.slug) || !(p.tvl_usd > 0)) throw new Error('Duplicate slug or invalid TVL');
    seen.add(p.slug);
    const listed = p.listed_at ? Date.parse(p.listed_at + 'T00:00:00Z') : NaN;
    const ageDays = Number.isFinite(listed) ? Math.max(0, Math.floor((asOf - listed) / DAY)) : null;
    const growth = Number.isFinite(p.change_7d) ? p.change_7d : null;
    const multiple = categoryMultiple(p.category);
    const growthFactor = 1 + clip(growth ?? 0, -50, 50) / 100;
    const maturityFactor = ageDays === null ? 0.9 : 0.75 + 0.5 * clip(ageDays / 730, 0, 1);
    const value = Math.round(clip(p.tvl_usd * multiple * growthFactor * maturityFactor, 1, 1e14));
    const recorded = p.gecko_id != null || p.symbol != null;
    const relatedProduct = /bridge|liquid staking|liquid restaking|restaked btc|cex/i.test(p.category || '')
      || /\bwrapped\b|\bstaked\b|\bstaking\b/i.test(p.name)
      || /^(binance|coinbase|bybit|kraken|bitget|okx|bitfinex|gemini)\b/i.test(p.name)
      || /\s[vV]?\d+(?:\.\d+)*$/.test(p.name);
    return {...p, category:p.category || 'Unclassified', chains:p.chains || [], token_recorded:recorded,
      watchlist:watch.has(p.slug), research_candidate:watch.has(p.slug)||(!recorded&&!relatedProduct),
      related_product:relatedProduct, age_days:ageDays, growth_7d:growth,
      implied_value_usd:value, low_usd:Math.max(1,Math.round(value*0.5)), high_usd:Math.round(value*1.5),
      factors:{category_multiple:multiple,growth_factor:growthFactor,maturity_factor:maturityFactor},
      evidence:ageDays === null || growth === null ? 'Incomplete inputs' : 'Snapshot inputs present',
      farm_steps:farmPlan(p,recorded)};
  });
  rows.sort((a,b) => b.implied_value_usd-a.implied_value_usd || a.slug.localeCompare(b.slug,'en'));
  rows.forEach((r,i) => r.rank=i+1);
  if ([...watch].some(s => !seen.has(s))) throw new Error('Watchlist names an absent protocol');
  return rows;
}
