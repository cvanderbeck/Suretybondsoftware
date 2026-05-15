// ---------- Work-In-Progress (WIP) helpers ----------
// A bond's `wip` is optional. When present:
//   { contractAmount, percentComplete, costToDate, estCostToComplete,
//     billedToDate, estProfitPercent, asOfDate, notes, history: [...] }
//
// Bonds without WIP fall back to "100% open exposure" against the
// aggregate (i.e. the full bond amount). License/Notary/Bid types
// don't typically carry WIP.

window.WIP = (() => {

  // Bond types where WIP tracking is meaningful (contract bonds).
  const APPLICABLE = ['Performance', 'Payment', 'Customs'];

  function applicable(bond) {
    return APPLICABLE.includes(bond.type);
  }

  function ensure(bond) {
    bond.wip = bond.wip || null;
    return bond.wip;
  }

  // % complete (0–100). Returns null if no WIP record.
  function percent(bond) {
    if (!bond.wip || bond.wip.percentComplete == null) return null;
    return Math.max(0, Math.min(100, bond.wip.percentComplete));
  }

  // Backlog = uncompleted exposure, used for aggregate-limit math.
  function backlog(bond) {
    const pct = percent(bond);
    const base = (bond.wip && bond.wip.contractAmount) || bond.amount || 0;
    if (pct == null) return base;
    return Math.round(base * (100 - pct) / 100);
  }

  // Earned revenue = contract * %complete
  function earned(bond) {
    const pct = percent(bond);
    if (pct == null || !bond.wip) return null;
    const c = bond.wip.contractAmount || bond.amount || 0;
    return Math.round(c * pct / 100);
  }

  // Over/under billing: (billed) - (earned). +ve = overbilled, -ve = underbilled
  function overUnder(bond) {
    const e = earned(bond);
    if (e == null) return null;
    return Math.round((bond.wip.billedToDate || 0) - e);
  }

  function tone(pct) {
    if (pct == null) return { bar: 'bg-slate-300', text: 'text-ink-300' };
    if (pct >= 95)   return { bar: 'bg-emerald-500', text: 'text-emerald-700' };
    if (pct >= 50)   return { bar: 'bg-brand-500',   text: 'text-brand-700'   };
    return                   { bar: 'bg-amber-500',  text: 'text-amber-700'   };
  }

  // Render a small inline % bar suitable for tables.
  function inlineBar(bond, opts={}) {
    const pct = percent(bond);
    if (pct == null) {
      return applicable(bond)
        ? `<span class="text-xs text-ink-300">Not tracked</span>`
        : `<span class="text-xs text-ink-300">—</span>`;
    }
    const t = tone(pct);
    return `
      <div class="${opts.compact ? 'min-w-[120px]' : ''}">
        <div class="flex items-center justify-between text-xs">
          <span class="${t.text} font-medium">${pct}% complete</span>
          ${opts.showBacklog ? `<span class="text-ink-300">${U.usd(backlog(bond))} backlog</span>` : ''}
        </div>
        <div class="progress mt-1"><div class="${t.bar}" style="width:${pct}%"></div></div>
      </div>`;
  }

  // Snapshot history helper — pushes the current state to history.
  function snapshot(bond, note) {
    if (!bond.wip) return;
    bond.wip.history = bond.wip.history || [];
    bond.wip.history.push({
      date: new Date().toISOString().slice(0,10),
      percent: bond.wip.percentComplete,
      costToDate: bond.wip.costToDate,
      billedToDate: bond.wip.billedToDate,
      note: note || '',
    });
  }

  // Aggregate WIP rollup for an account: totals across all WIP'd bonds.
  function rollup(accountId, statuses=['Active','Pending UW']) {
    const list = DB.bonds().filter(b => b.accountId === accountId && statuses.includes(b.status));
    const tracked = list.filter(b => b.wip && b.wip.percentComplete != null);
    const totalContract = tracked.reduce((s,b) => s + (b.wip.contractAmount || b.amount || 0), 0);
    const totalEarned   = tracked.reduce((s,b) => s + (earned(b) || 0), 0);
    const totalBilled   = tracked.reduce((s,b) => s + ((b.wip && b.wip.billedToDate) || 0), 0);
    const totalCost     = tracked.reduce((s,b) => s + ((b.wip && b.wip.costToDate) || 0), 0);
    const totalETC      = tracked.reduce((s,b) => s + ((b.wip && b.wip.estCostToComplete) || 0), 0);
    const totalBacklog  = tracked.reduce((s,b) => s + backlog(b), 0);
    const overUnderTot  = totalBilled - totalEarned;
    const avgPct = totalContract ? Math.round(totalEarned / totalContract * 100) : null;
    return {
      bonds: list, tracked, untrackedContract: list.filter(b => applicable(b) && (!b.wip || b.wip.percentComplete == null)),
      totalContract, totalEarned, totalBilled, totalCost, totalETC, totalBacklog, overUnderTot, avgPct,
    };
  }

  return { APPLICABLE, applicable, ensure, percent, backlog, earned, overUnder, tone, inlineBar, snapshot, rollup };
})();
