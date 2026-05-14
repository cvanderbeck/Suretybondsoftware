window.Views = window.Views || {};
Views.calculator = {
  // Surety tier base rates per $100 of bond amount (illustrative)
  TIERS: {
    'License & Permit':  [{ name: 'Notary',           rate: 0.5,  min: 50,  max: 25000   },
                          { name: 'Auto Dealer',      rate: 0.7,  min: 200, max: 100000  },
                          { name: 'Freight Broker (BMC-84)', rate: 2.5, min: 1875, max: 75000 },
                          { name: 'Contractor License',rate: 1.0, min: 200, max: 100000  }],
    'Performance / Payment': [{ name: 'Standard',    rate: 1.5,  min: 2500,max: 25000000 },
                              { name: 'Substandard', rate: 3.0,  min: 5000,max: 25000000 }],
    'Bid':         [{ name: 'No-cost (issued w/ final)', rate: 0, min: 0, max: 50000000 }],
    'Court / Probate': [{ name: 'Court Bond',         rate: 1.0, min: 100, max: 5000000 }],
    'Customs':     [{ name: 'Customs (Activity 1)',   rate: 1.5, min: 500, max: 1000000 }],
  },

  render() {
    document.getElementById('view').innerHTML = `
      <div class="mb-6">
        <h1 class="section-title">Premium Calculator</h1>
        <p class="section-sub">Indicative premiums across your surety partners. Adjustments for credit + experience + class.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card lg:col-span-1">
          <div class="card-header"><div class="card-title">Inputs</div></div>
          <div class="p-5 space-y-3">
            <div><div class="field-label">Bond Class</div>
              <select id="cl-class" class="field-select" onchange="Views.calculator.onClassChange(); Views.calculator.recalc()">
                ${Object.keys(Views.calculator.TIERS).map(k => `<option>${k}</option>`).join('')}
              </select></div>
            <div><div class="field-label">Subclass</div>
              <select id="cl-sub" class="field-select" onchange="Views.calculator.recalc()"></select></div>
            <div><div class="field-label">Bond Amount</div>
              <input id="cl-amt" type="number" class="field-input" value="500000" oninput="Views.calculator.recalc()"></div>
            <div><div class="field-label">Effective Date</div>
              <input id="cl-eff" type="date" class="field-input" value="${new Date().toISOString().slice(0,10)}"></div>
            <div class="divider"></div>
            <div><div class="field-label">Principal Credit Score</div>
              <input id="cl-cr" type="number" class="field-input" value="720" oninput="Views.calculator.recalc()"></div>
            <div><div class="field-label">Years in Business</div>
              <input id="cl-yrs" type="number" class="field-input" value="10" oninput="Views.calculator.recalc()"></div>
            <div><div class="field-label">Working Capital</div>
              <input id="cl-wc" type="number" class="field-input" value="500000" oninput="Views.calculator.recalc()"></div>
            <div>
              <label class="flex items-center gap-2 text-sm text-slate-700 mt-2">
                <input type="checkbox" id="cl-indem" class="chk" checked onchange="Views.calculator.recalc()">
                Personal indemnity provided
              </label>
            </div>
            <div class="divider"></div>
            <div><div class="field-label">Principal (optional)</div>
              <input id="cl-prin" class="field-input" placeholder="Account name"></div>
            <div><div class="field-label">Obligee (optional)</div>
              <input id="cl-ob" class="field-input"></div>
            <button class="btn-primary w-full mt-2" onclick="Views.calculator.exportQuote()">Export Quote PDF</button>
          </div>
        </div>

        <div class="card lg:col-span-2">
          <div class="card-header">
            <div class="card-title">Indicative Premium Options</div>
            <span id="cl-summary" class="text-sm text-slate-500"></span>
          </div>
          <div id="cl-results" class="p-5 space-y-3"></div>
          <div class="px-5 pb-5 text-xs text-slate-400">
            * Rates are illustrative. Final premium is subject to underwriting. Adjustments applied: credit (±20%), experience (±10%), working capital floor, no-indemnity surcharge (+25%).
          </div>
        </div>
      </div>
    `;

    this.onClassChange();
    this.recalc();
  },

  onClassChange() {
    const cls = document.getElementById('cl-class').value;
    const subs = this.TIERS[cls];
    document.getElementById('cl-sub').innerHTML = subs.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  },

  computeAdjustment(baseRate) {
    const credit = +document.getElementById('cl-cr').value || 700;
    const yrs    = +document.getElementById('cl-yrs').value || 0;
    const wc     = +document.getElementById('cl-wc').value || 0;
    const indem  = document.getElementById('cl-indem').checked;
    let adj = 1;
    if (credit >= 760) adj *= 0.80;
    else if (credit >= 720) adj *= 0.90;
    else if (credit >= 680) adj *= 1.00;
    else if (credit >= 640) adj *= 1.15;
    else adj *= 1.30;
    if (yrs >= 10) adj *= 0.95;
    else if (yrs < 3) adj *= 1.10;
    if (wc < 100000) adj *= 1.10;
    if (!indem) adj *= 1.25;
    return Math.round(baseRate * adj * 100) / 100;
  },

  recalc() {
    const cls = document.getElementById('cl-class').value;
    const subName = document.getElementById('cl-sub').value;
    const sub = (this.TIERS[cls] || []).find(s => s.name === subName) || { rate: 1.5, min: 0, max: 9999999999 };
    const amt = +document.getElementById('cl-amt').value || 0;

    const partners = DB.partners().filter(p => p.active);
    // Per-partner spread to make it interesting
    const spread = [-0.10, 0, 0.05, 0.10, 0.15, 0.20];

    const baseRate = sub.rate;
    const adjBase  = this.computeAdjustment(baseRate);

    const results = partners.map((p, i) => {
      const partnerRate = Math.round(adjBase * (1 + (spread[i] ?? 0)) * 100) / 100;
      let premium = Math.round(amt * partnerRate / 100);
      premium = Math.max(premium, sub.min || 0);
      if (amt > (sub.max || Infinity)) premium = 0; // out of appetite
      const commission = Math.round(premium * (p.commissionRate || 25) / 100);
      return { partner: p, baseRate, adjRate: partnerRate, premium, commission, outOfAppetite: amt > (sub.max||Infinity) };
    }).sort((a,b) => a.premium - b.premium);

    document.getElementById('cl-summary').textContent =
      `${U.usd(amt)} · ${cls} · base ${baseRate}% → adj ${adjBase}%`;

    document.getElementById('cl-results').innerHTML = results.map((r,idx) => `
      <div class="border ${idx===0?'border-emerald-400 bg-emerald-50/40':'border-slate-200'} rounded-xl p-4 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <div class="font-semibold text-slate-900">${U.esc(r.partner.name)}</div>
            <span class="text-xs text-slate-500">${r.partner.rating}</span>
            ${idx===0?'<span class="badge badge-green">Best price</span>':''}
            ${r.outOfAppetite?'<span class="badge badge-rose">Out of appetite</span>':''}
          </div>
          <div class="text-xs text-slate-500 mt-1">${U.esc(r.partner.appetite)}</div>
          <div class="text-xs text-slate-500 mt-1">Adj. rate: ${r.adjRate}% · Commission ${r.partner.commissionRate}%</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500">Annual Premium</div>
          <div class="text-xl font-semibold text-slate-900">${r.outOfAppetite ? '—' : U.usd(r.premium)}</div>
          <div class="text-xs text-emerald-700 font-medium">Commission: ${U.usd(r.commission)}</div>
        </div>
      </div>
    `).join('');
    // Stash results for export
    Views.calculator._lastResults = { cls, subName, amt, results };
  },

  exportQuote() {
    const r = Views.calculator._lastResults;
    if (!r) return;
    const doc = PDF.premiumQuote({
      bondType: `${r.cls} — ${r.subName}`,
      amount: r.amt,
      principal: document.getElementById('cl-prin').value,
      obligee:   document.getElementById('cl-ob').value,
      effective: document.getElementById('cl-eff').value,
      options: r.results.filter(x => !x.outOfAppetite).map(x => ({
        partner: x.partner.name, baseRate: x.baseRate, adjRate: x.adjRate,
        premium: x.premium, commissionRate: x.partner.commissionRate, commission: x.commission
      }))
    });
    doc.save('Premium_Quote.pdf');
    U.toast('Quote exported');
  }
};
