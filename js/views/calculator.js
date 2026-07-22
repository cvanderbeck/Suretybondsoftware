// ---------- Premium Calculator ----------
// Pick a principal, a bond/opportunity to associate, a surety, one of that
// surety's rate options, and one of their commission options. Compute the
// premium (with slide tiers when applicable) and our commission dollars.
window.Views = window.Views || {};

Views.calculator = {
  _tab: 'calc',
  _selected: {
    accountId: '', associationId: '', associationKind: '',
    partnerId: '', rateOptionId: '', commissionOptionId: '',
    bondType: 'Payment & Performance', amount: 500000,
    effectiveDate: new Date().toISOString().slice(0,10),
    obligee: '', notes: '',
  },
  _lastResult: null,
  _editingQuoteId: null,

  render() {
    const quoteCount = DB.quotes().length;
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Premium Calculator</h1>
          <p class="section-sub">Pick a surety, rate option, and commission to project premium and our earn.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.calculator.openManageRates()">⚙ Manage Rates &amp; Commissions</button>
        </div>
      </div>

      <div class="border-b border-cream-200 -mx-6 px-6 flex flex-wrap gap-1 mb-5">
        ${this._tabBtn('calc',   'Calculator')}
        ${this._tabBtn('quotes', 'Saved PCs', quoteCount)}
      </div>

      <div id="cl-view">${this._tab==='calc' ? this._renderCalc() : this._renderQuotesView()}</div>
    `;
    if (this._tab === 'calc') this._bindInputs();
  },

  _tabBtn(key, label, count) {
    const active = this._tab === key;
    return `
      <button class="px-3 py-2 text-sm border-b-2 -mb-px transition
          ${active ? 'border-brand-500 text-brand-700 font-semibold'
                   : 'border-transparent text-ink-400 hover:text-ink-700 hover:border-cream-300'}"
          onclick="Views.calculator._setTab('${key}')">
        ${U.esc(label)}${count!==undefined?` <span class="ml-1 text-xs text-ink-300">${count}</span>`:''}
      </button>`;
  },

  _setTab(k) { this._tab = k; this.render(); },

  _renderCalc() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div class="card lg:col-span-2">
          <div class="card-header"><div class="card-title">Inputs</div></div>
          <div class="p-5 space-y-3" id="cl-inputs">${this._renderInputs()}</div>
        </div>

        <div class="lg:col-span-3">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Estimated Premium</div>
              <span class="text-xs text-ink-300">Rates are illustrative — final is subject to underwriting.</span>
            </div>
            <div id="cl-result" class="p-5">${this._renderResult()}</div>
          </div>
        </div>
      </div>
    `;
  },

  // ------------------- INPUT PANEL -------------------
  _renderInputs() {
    const s = this._selected;
    const accts = DB.accounts();
    const partners = DB.partners().filter(p => p.active !== false);
    const p = s.partnerId ? DB.findPartner(s.partnerId) : null;
    const rateOptions = (p && p.rateOptions) || [];
    const commissionOptions = (p && p.commissionOptions) || [];

    // Associations: bonds + pipeline opps for the chosen account
    let associations = [];
    if (s.accountId) {
      DB.bonds().filter(b => b.accountId === s.accountId).forEach(b => associations.push({
        id: 'bond:' + b.id, kind: 'bond',
        label: `Bond ${b.number} — ${b.type} — ${U.usd(b.amount)}`,
        bondType: b.type, amount: b.amount, obligee: b.obligee || '',
      }));
      DB.pipeline().filter(o => o.accountId === s.accountId).forEach(o => associations.push({
        id: 'opp:' + o.id, kind: 'opportunity',
        label: `Opp ${o.id} — ${o.bondType} — ${U.usd(o.amount)} · ${o.stage}`,
        bondType: o.bondType, amount: o.amount, obligee: o.obligee || '',
      }));
    }

    return `
      <div><div class="field-label">Principal</div>
        <select id="cl-account" class="field-select" onchange="Views.calculator._onAccountChange(this.value)">
          <option value="">— Select a principal —</option>
          ${accts.map(a => `<option value="${a.id}" ${a.id===s.accountId?'selected':''}>${U.esc(a.name)}</option>`).join('')}
        </select></div>

      <div><div class="field-label">Associate With <span class="text-ink-300 font-normal normal-case tracking-normal">(optional)</span></div>
        <select id="cl-assoc" class="field-select" onchange="Views.calculator._onAssocChange(this.value)" ${associations.length?'':'disabled'}>
          <option value="">${associations.length ? '— None (new estimate) —' : (s.accountId ? 'No bonds or opportunities' : 'Pick a principal first')}</option>
          ${associations.map(a => `<option value="${a.id}" ${a.id===s.associationId?'selected':''}>${U.esc(a.label)}</option>`).join('')}
        </select>
      </div>

      <div class="divider"></div>

      <div><div class="field-label">Surety Company</div>
        <select id="cl-partner" class="field-select" onchange="Views.calculator._onPartnerChange(this.value)">
          <option value="">— Select a surety —</option>
          ${partners.map(x => `<option value="${x.id}" ${x.id===s.partnerId?'selected':''}>${U.esc(x.name)}${x.rating?` (${U.esc(x.rating)})`:''}</option>`).join('')}
        </select></div>

      <div><div class="field-label">Rate Option</div>
        <select id="cl-rate" class="field-select" onchange="Views.calculator._onRateChange(this.value)" ${rateOptions.length?'':'disabled'}>
          <option value="">${p ? (rateOptions.length ? '— Select rate option —' : 'No rate options on this surety') : 'Pick a surety first'}</option>
          ${rateOptions.map(r => `<option value="${r.id}" ${r.id===s.rateOptionId?'selected':''}>${U.esc(r.name)}</option>`).join('')}
        </select>
        ${rateOptions.length ? `<div class="text-[11px] text-ink-300 mt-1">Rates are stored per surety — click <b>Manage Rates &amp; Commissions</b> to edit.</div>` : ''}
      </div>

      <div><div class="field-label">Commission Rate</div>
        <select id="cl-commission" class="field-select" onchange="Views.calculator._onCommissionChange(this.value)" ${commissionOptions.length?'':'disabled'}>
          <option value="">${p ? (commissionOptions.length ? '— Select commission —' : 'No commission options') : 'Pick a surety first'}</option>
          ${commissionOptions.map(c => `<option value="${c.id}" ${c.id===s.commissionOptionId?'selected':''}>${U.esc(c.name)} (${c.rate}%)</option>`).join('')}
        </select></div>

      <div class="divider"></div>

      <div><div class="field-label">Bond Type</div>
        <select id="cl-type" class="field-select" onchange="Views.calculator._set('bondType', this.value)">
          ${(window.BondTypes && BondTypes.TYPES ? BondTypes.TYPES : ['Bid','Payment & Performance','Subdivision/Site Improvement','License/Permit','Probate'])
            .map(t => `<option ${t===s.bondType?'selected':''}>${U.esc(t)}</option>`).join('')}
        </select></div>

      <div><div class="field-label">Bond Amount</div>
        <input id="cl-amt" type="number" class="field-input" value="${s.amount}"
          oninput="Views.calculator._set('amount', +this.value || 0)"></div>

      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Effective Date</div>
          <input id="cl-eff" type="date" class="field-input" value="${U.esc(s.effectiveDate)}"
            oninput="Views.calculator._set('effectiveDate', this.value, true)"></div>
        <div><div class="field-label">Obligee (opt.)</div>
          <input id="cl-obligee" class="field-input" value="${U.esc(s.obligee)}"
            oninput="Views.calculator._set('obligee', this.value, true)"></div>
      </div>

      <div><div class="field-label">Notes (opt.)</div>
        <textarea id="cl-notes" class="field-textarea" rows="2"
          oninput="Views.calculator._set('notes', this.value, true)">${U.esc(s.notes)}</textarea></div>

      <button class="btn-primary w-full mt-2" onclick="Views.calculator.exportQuote()" ${s.partnerId&&s.rateOptionId?'':'disabled'}>
        Export Quote PDF
      </button>
    `;
  },

  // Wire calculation whenever anything changes.
  _bindInputs() { this._recalc(); },

  _set(field, value, skipRerender) {
    this._selected[field] = value;
    if (!skipRerender) {
      document.getElementById('cl-inputs').innerHTML = this._renderInputs();
    }
    this._recalc();
  },

  _onAccountChange(id) {
    this._selected.accountId = id;
    this._selected.associationId = '';
    this._selected.associationKind = '';
    document.getElementById('cl-inputs').innerHTML = this._renderInputs();
    this._recalc();
  },

  _onAssocChange(id) {
    this._selected.associationId = id;
    this._selected.associationKind = '';
    if (id) {
      const [kind, entityId] = id.split(':');
      this._selected.associationKind = kind;
      const entity = kind === 'bond'
        ? DB.findBond(entityId)
        : DB.pipeline().find(o => o.id === entityId);
      if (entity) {
        this._selected.bondType = entity.type || entity.bondType || this._selected.bondType;
        this._selected.amount   = entity.amount || this._selected.amount;
        this._selected.obligee  = entity.obligee || this._selected.obligee;
        if (kind === 'bond' && entity.partnerId) this._selected.partnerId = entity.partnerId;
      }
    }
    document.getElementById('cl-inputs').innerHTML = this._renderInputs();
    this._recalc();
  },

  _onPartnerChange(id) {
    this._selected.partnerId = id;
    // Reset rate + commission — different surety, different menu.
    this._selected.rateOptionId = '';
    this._selected.commissionOptionId = '';
    const p = DB.findPartner(id);
    // Pre-select the surety's first commission option if only one exists
    if (p && p.commissionOptions && p.commissionOptions.length === 1) {
      this._selected.commissionOptionId = p.commissionOptions[0].id;
    }
    document.getElementById('cl-inputs').innerHTML = this._renderInputs();
    this._recalc();
  },

  _onRateChange(id) {
    this._selected.rateOptionId = id;
    this._recalc();
  },

  _onCommissionChange(id) {
    this._selected.commissionOptionId = id;
    this._recalc();
  },

  // ------------------- CALCULATION -------------------
  _computePremium(rateOption, amount) {
    if (!rateOption || !amount) return { premium: 0, breakdown: [], effectiveRate: 0 };
    const breakdown = [];
    let premium = 0;

    switch (rateOption.type) {
      case 'flat': {
        premium = +rateOption.rate || 0;
        breakdown.push({ label: `Flat ${U.usd(premium)}`, amount: premium });
        break;
      }
      case 'per-thousand': {
        const rate = +rateOption.rate || 0;
        premium = amount / 1000 * rate;
        breakdown.push({
          label: `${U.usd(amount)} × $${rate.toFixed(2)}/thousand`,
          amount: premium,
        });
        break;
      }
      case 'slide': {
        const tiers = rateOption.slide || [];
        let remaining = amount;
        let prevUpTo = 0;
        for (const t of tiers) {
          const cap = t.upTo == null ? Infinity : t.upTo;
          const tierSize = Math.min(remaining, cap - prevUpTo);
          if (tierSize <= 0) break;
          const cost = tierSize / 1000 * (+t.rate || 0);
          breakdown.push({
            label: `${U.usd(tierSize)} at $${(+t.rate).toFixed(2)}/thousand${t.upTo==null?' (over '+U.usd(prevUpTo)+')':' (up to '+U.usd(cap)+')'}`,
            amount: cost,
          });
          premium += cost;
          remaining -= tierSize;
          prevUpTo = cap;
          if (remaining <= 0) break;
        }
        break;
      }
      default: premium = 0;
    }

    // Enforce minimum premium
    if (rateOption.minPremium && premium < rateOption.minPremium) {
      breakdown.push({
        label: `Minimum premium adjustment (${U.usd(rateOption.minPremium)})`,
        amount: rateOption.minPremium - premium,
        isMin: true,
      });
      premium = rateOption.minPremium;
    }

    const effectiveRate = amount > 0 ? (premium / amount * 100) : 0;
    return { premium: Math.round(premium * 100) / 100, breakdown, effectiveRate };
  },

  _recalc() {
    const s = this._selected;
    const partner = s.partnerId ? DB.findPartner(s.partnerId) : null;
    const rateOption = partner && s.rateOptionId
      ? (partner.rateOptions || []).find(r => r.id === s.rateOptionId)
      : null;
    const commissionOption = partner && s.commissionOptionId
      ? (partner.commissionOptions || []).find(c => c.id === s.commissionOptionId)
      : null;

    const { premium, breakdown, effectiveRate } = this._computePremium(rateOption, s.amount);
    const commissionPct = commissionOption ? (+commissionOption.rate || 0) : 0;
    const commission = Math.round(premium * commissionPct) / 100;

    this._lastResult = { partner, rateOption, commissionOption, premium, breakdown, effectiveRate, commission, commissionPct };
    const el = document.getElementById('cl-result');
    if (el) el.innerHTML = this._renderResult();
  },

  _renderResult() {
    const r = this._lastResult;
    const s = this._selected;
    if (!r || !r.partner || !r.rateOption) {
      return `
        <div class="text-center py-12 text-ink-300 text-sm italic">
          Select a principal, surety, rate option, and commission to see the estimated premium.
        </div>`;
    }
    const account = s.accountId ? DB.findAccount(s.accountId) : null;
    const partnerNet = r.premium - r.commission;
    const status = this._impliedStatus(); // 'potential' | 'confirmed'
    const isPotential = status === 'potential';
    const isBid = /bid/i.test(s.bondType || '');
    const bidBanner = isBid ? `
      <div class="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
        <div class="text-2xl">💡</div>
        <div class="text-sm text-amber-800">
          <div class="font-semibold">Bid Bond — potential income only</div>
          <div class="text-xs mt-0.5">Bid bonds don't generate premium themselves. The numbers below show what you'd earn <b>if the principal wins the job</b> and issues the follow-on payment &amp; performance bond.</div>
        </div>
      </div>` : '';
    const potentialBanner = !isBid && isPotential ? `
      <div class="mb-4 p-3 rounded-lg bg-cream-100 border border-cream-300 flex items-start gap-3">
        <div class="text-lg">📄</div>
        <div class="text-sm text-ink-500">
          <div class="font-medium">Potential income — quote only</div>
          <div class="text-xs mt-0.5">These numbers become confirmed when the associated bond moves to <b>issued / approved</b>.</div>
        </div>
      </div>` : '';
    return `
      ${bidBanner}${potentialBanner}
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="stat-card !p-4">
          <div class="stat-label">${isPotential ? 'Potential Premium' : 'Estimated Premium'}</div>
          <div class="stat-value ${isPotential ? 'text-ink-500' : ''}">${U.usd(r.premium)}</div>
          <div class="text-[11px] text-ink-300 mt-0.5">Effective rate ${r.effectiveRate.toFixed(2)}%</div>
        </div>
        <div class="stat-card !p-4">
          <div class="stat-label">${isPotential ? 'Potential Commission' : 'Our Commission'} (${r.commissionPct}%)</div>
          <div class="stat-value ${isPotential ? 'text-amber-700' : 'text-emerald-700'}">${U.usd(r.commission)}</div>
          <div class="text-[11px] text-ink-300 mt-0.5">
            ${U.esc(r.commissionOption ? r.commissionOption.name : 'No commission selected')}
            ${isBid ? ' · if awarded' : (isPotential ? ' · pending issue' : '')}
          </div>
        </div>
        <div class="stat-card !p-4">
          <div class="stat-label">Surety Net</div>
          <div class="stat-value">${U.usd(partnerNet)}</div>
          <div class="text-[11px] text-ink-300 mt-0.5">Premium − commission</div>
        </div>
      </div>

      <div class="mb-4 flex items-center justify-end gap-2">
        <button class="btn-secondary" onclick="Views.calculator._resetSelection()">Clear</button>
        <button class="btn-primary" onclick="Views.calculator.saveQuote()">
          ${this._editingQuoteId ? '💾 Update PC' : '💾 Save PC'}
        </button>
      </div>

      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">Rate Breakdown</div>
          <span class="text-xs text-ink-300">${U.esc(r.rateOption.name)}${r.rateOption.type==='slide'?' — slide tiers':r.rateOption.type==='flat'?' — flat':' — per thousand'}</span>
        </div>
        <div class="p-4 space-y-2 text-sm">
          ${r.breakdown.map(b => `
            <div class="flex items-center justify-between border-b border-cream-100 pb-2 last:border-0 last:pb-0 ${b.isMin?'text-amber-700':''}">
              <div>${U.esc(b.label)}</div>
              <div class="font-medium">${U.usd(b.amount)}</div>
            </div>
          `).join('')}
          <div class="flex items-center justify-between pt-2 border-t border-cream-200 font-semibold">
            <div>Total Premium</div>
            <div>${U.usd(r.premium)}</div>
          </div>
        </div>
        ${r.rateOption.notes ? `<div class="px-4 pb-4 text-xs text-ink-400 italic">${U.esc(r.rateOption.notes)}</div>` : ''}
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Quote Summary</div></div>
        <div class="p-4 grid grid-cols-2 gap-3 text-sm">
          <div><div class="field-label">Principal</div>${U.esc(account ? account.name : '—')}</div>
          <div><div class="field-label">Surety</div>${U.esc(r.partner.name)}${r.partner.rating?` <span class="text-xs text-ink-300">${U.esc(r.partner.rating)}</span>`:''}</div>
          <div><div class="field-label">Bond Type</div>${U.esc(s.bondType)}</div>
          <div><div class="field-label">Bond Amount</div>${U.usd(s.amount)}</div>
          <div><div class="field-label">Effective</div>${U.date(s.effectiveDate)}</div>
          <div><div class="field-label">Obligee</div>${U.esc(s.obligee||'—')}</div>
          ${s.associationId ? `
            <div class="col-span-2"><div class="field-label">Associated ${s.associationKind}</div>
              ${U.esc((DB.bonds().find(b=>b.id===s.associationId.split(':')[1])||DB.pipeline().find(o=>o.id===s.associationId.split(':')[1])||{}).id||s.associationId)}
            </div>` : ''}
          ${s.notes ? `<div class="col-span-2"><div class="field-label">Notes</div>${U.esc(s.notes)}</div>` : ''}
        </div>
      </div>
    `;
  },

  // ------------------- MANAGE RATES MODAL -------------------
  openManageRates() {
    this._manageSelected = this._manageSelected || (DB.partners()[0] || {}).id || '';
    const partners = DB.partners();
    const body = `
      <div class="flex gap-4 h-[70vh]">
        <div class="w-56 border-r border-cream-200 pr-3 overflow-y-auto">
          <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Sureties</div>
          ${partners.map(p => `
            <button class="w-full text-left px-3 py-2 rounded-lg mb-1 text-sm ${p.id===this._manageSelected?'bg-brand-50 text-brand-800 font-semibold':'hover:bg-cream-50'}"
              onclick="Views.calculator._manageSelected='${p.id}'; Views.calculator._renderManageBody()">
              <div>${U.esc(p.name)}</div>
              <div class="text-[10px] text-ink-300">${(p.rateOptions||[]).length} rate · ${(p.commissionOptions||[]).length} commission</div>
            </button>
          `).join('')}
        </div>
        <div class="flex-1 overflow-y-auto" id="mgr-body">${this._renderManageBody(true)}</div>
      </div>
    `;
    const footer = `<button class="btn-primary" data-close>Close</button>`;
    const m = U.modal({ title: 'Manage Rates & Commissions', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', () => { m.close(); this.render(); });
  },

  _renderManageBody(returnHtml) {
    const p = DB.findPartner(this._manageSelected);
    if (!p) return returnHtml ? '<div class="text-sm text-ink-300 p-4">Select a surety on the left.</div>' : void 0;
    const rateOptions = p.rateOptions || [];
    const commissionOptions = p.commissionOptions || [];

    const html = `
      <div class="pl-3">
        <div class="mb-2">
          <div class="text-lg font-display font-semibold">${U.esc(p.name)}</div>
          <div class="text-xs text-ink-400">${U.esc(p.rating || '')} · ${U.esc(p.appetite || '')}</div>
        </div>

        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">Rate Options</div>
            <button class="btn-secondary text-xs" onclick="Views.calculator._editRateOption('${p.id}', null)">+ Add Rate Option</button>
          </div>
          <div class="p-3 space-y-2">
            ${rateOptions.length ? rateOptions.map(r => `
              <div class="border border-cream-200 rounded-lg p-3 hover:bg-cream-50">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="font-medium">${U.esc(r.name)}</div>
                    <div class="text-xs text-ink-400 mt-0.5">
                      <span class="badge badge-slate text-[10px]">${U.esc(r.type)}</span>
                      ${r.type==='per-thousand' ? `<span class="ml-1">$${(+r.rate).toFixed(2)}/thousand</span>` : ''}
                      ${r.type==='flat' ? `<span class="ml-1">${U.usd(r.rate)}</span>` : ''}
                      ${r.type==='slide' ? `<span class="ml-1">${(r.slide||[]).length} tier${(r.slide||[]).length===1?'':'s'}</span>` : ''}
                      ${r.minPremium ? `<span class="ml-2">min ${U.usd(r.minPremium)}</span>` : ''}
                    </div>
                    ${r.notes ? `<div class="text-xs text-ink-300 mt-1 italic">${U.esc(r.notes)}</div>` : ''}
                    ${r.type==='slide' ? `
                      <div class="mt-2 text-xs text-ink-500 font-mono">
                        ${(r.slide||[]).map(t => `${t.upTo==null?'over '+U.usd(rateOptions.length?(r.slide[r.slide.indexOf(t)-1]||{upTo:0}).upTo||0:0):'up to '+U.usd(t.upTo)}: $${(+t.rate).toFixed(2)}/K`).join(' · ')}
                      </div>` : ''}
                  </div>
                  <div class="flex gap-1 ml-2">
                    <button class="btn-ghost text-xs" onclick="Views.calculator._editRateOption('${p.id}', '${r.id}')">Edit</button>
                    <button class="btn-ghost text-xs text-rose-600" onclick="Views.calculator._deleteRateOption('${p.id}', '${r.id}')">✕</button>
                  </div>
                </div>
              </div>
            `).join('') : '<div class="text-sm text-ink-300 italic py-4 text-center">No rate options yet. Click <b>+ Add Rate Option</b> to add one.</div>'}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Commission Options</div>
            <button class="btn-secondary text-xs" onclick="Views.calculator._editCommissionOption('${p.id}', null)">+ Add Commission</button>
          </div>
          <div class="p-3 space-y-2">
            ${commissionOptions.length ? commissionOptions.map(c => `
              <div class="border border-cream-200 rounded-lg p-3 hover:bg-cream-50 flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-medium">${U.esc(c.name)}</div>
                  <div class="text-xs text-ink-400">${c.rate}% commission on premium</div>
                  ${c.notes ? `<div class="text-xs text-ink-300 mt-1 italic">${U.esc(c.notes)}</div>` : ''}
                </div>
                <div class="flex gap-1">
                  <button class="btn-ghost text-xs" onclick="Views.calculator._editCommissionOption('${p.id}', '${c.id}')">Edit</button>
                  <button class="btn-ghost text-xs text-rose-600" onclick="Views.calculator._deleteCommissionOption('${p.id}', '${c.id}')">✕</button>
                </div>
              </div>
            `).join('') : '<div class="text-sm text-ink-300 italic py-4 text-center">No commission options yet.</div>'}
          </div>
        </div>
      </div>
    `;
    if (returnHtml) return html;
    const el = document.getElementById('mgr-body');
    if (el) el.innerHTML = html;
    // Also refresh sidebar counts by re-rendering the whole modal
    U.closeModals();
    this.openManageRates();
  },

  _editRateOption(partnerId, rateId) {
    const p = DB.findPartner(partnerId); if (!p) return;
    p.rateOptions = p.rateOptions || [];
    const r = rateId ? p.rateOptions.find(x => x.id === rateId) : {
      id: U.uid('R'), name: '', type: 'per-thousand', rate: 20, minPremium: 0, notes: '', slide: [],
    };
    const isSlide = r.type === 'slide';
    const slideHtml = (r.slide || []).map((t, i) => `
      <div class="grid grid-cols-3 gap-2 items-center" data-tier="${i}">
        <input class="field-input" type="number" data-tk="upTo" value="${t.upTo ?? ''}" placeholder="Up to (blank = no cap)">
        <input class="field-input" type="number" step="0.01" data-tk="rate" value="${t.rate}" placeholder="Rate $/thousand">
        <button class="btn-ghost text-rose-600" onclick="this.parentElement.remove()">Remove tier</button>
      </div>
    `).join('');

    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Rate Option Name</div>
          <input id="ro-name" class="field-input" value="${U.esc(r.name)}" placeholder="e.g. $25/thousand slide"></div>
        <div><div class="field-label">Type</div>
          <select id="ro-type" class="field-select" onchange="Views.calculator._toggleSlideEditor(this.value)">
            <option value="per-thousand" ${r.type==='per-thousand'?'selected':''}>Per Thousand (flat rate)</option>
            <option value="slide"        ${r.type==='slide'?'selected':''}>Slide (tiered by bond amount)</option>
            <option value="flat"         ${r.type==='flat'?'selected':''}>Flat Fee</option>
          </select></div>
        <div><div class="field-label">Rate <span class="text-ink-300 font-normal normal-case tracking-normal">($/thousand or flat $)</span></div>
          <input id="ro-rate" type="number" step="0.01" class="field-input" value="${r.rate}"></div>
        <div><div class="field-label">Minimum Premium ($)</div>
          <input id="ro-min" type="number" class="field-input" value="${r.minPremium || 0}"></div>
      </div>

      <div id="ro-slide-editor" class="mt-3 ${isSlide?'':'hidden'}">
        <div class="field-label flex items-center justify-between">
          <span>Slide Tiers</span>
          <button class="btn-ghost text-xs" onclick="Views.calculator._addSlideTier()">+ Add Tier</button>
        </div>
        <div id="ro-tiers" class="space-y-2">${slideHtml || '<div class="text-xs text-ink-300 italic">No tiers yet. Click <b>+ Add Tier</b>.</div>'}</div>
        <div class="text-xs text-ink-300 italic mt-2">Tiers apply progressively: first tier's rate on the amount up to its cap, next tier's rate on the excess up to its cap, etc. Leave the last tier's "Up to" blank for uncapped.</div>
      </div>

      <div class="mt-3"><div class="field-label">Notes (optional)</div>
        <textarea id="ro-notes" class="field-textarea" rows="2">${U.esc(r.notes || '')}</textarea></div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.calculator._saveRateOption('${partnerId}', '${r.id}', ${rateId?'true':'false'})">Save</button>`;
    const m = U.modal({ title: rateId ? 'Edit Rate Option' : 'New Rate Option', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _toggleSlideEditor(type) {
    document.getElementById('ro-slide-editor').classList.toggle('hidden', type !== 'slide');
  },

  _addSlideTier() {
    const wrap = document.getElementById('ro-tiers');
    if (wrap.querySelector('.italic')) wrap.innerHTML = '';
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="grid grid-cols-3 gap-2 items-center" data-tier="new">
        <input class="field-input" type="number" data-tk="upTo" placeholder="Up to (blank = no cap)">
        <input class="field-input" type="number" step="0.01" data-tk="rate" placeholder="Rate $/thousand">
        <button class="btn-ghost text-rose-600" onclick="this.parentElement.remove()">Remove tier</button>
      </div>`;
    wrap.appendChild(div.firstElementChild);
  },

  _saveRateOption(partnerId, rateId, isExisting) {
    const p = DB.findPartner(partnerId); if (!p) return;
    p.rateOptions = p.rateOptions || [];
    const r = isExisting ? p.rateOptions.find(x => x.id === rateId) : { id: rateId };
    r.name = document.getElementById('ro-name').value || 'Untitled';
    r.type = document.getElementById('ro-type').value;
    r.rate = +document.getElementById('ro-rate').value || 0;
    r.minPremium = +document.getElementById('ro-min').value || 0;
    r.notes = document.getElementById('ro-notes').value;
    if (r.type === 'slide') {
      r.slide = Array.from(document.querySelectorAll('#ro-tiers [data-tier]')).map(row => ({
        upTo: row.querySelector('[data-tk=upTo]').value === '' ? null : +row.querySelector('[data-tk=upTo]').value,
        rate: +row.querySelector('[data-tk=rate]').value || 0,
      }));
    } else {
      r.slide = [];
    }
    if (!isExisting) p.rateOptions.push(r);
    DB.save();
    U.closeModals();
    U.toast(isExisting ? 'Rate option updated' : 'Rate option added');
    this.openManageRates();
  },

  _deleteRateOption(partnerId, rateId) {
    if (!confirm('Delete this rate option?')) return;
    const p = DB.findPartner(partnerId); if (!p || !p.rateOptions) return;
    p.rateOptions = p.rateOptions.filter(r => r.id !== rateId);
    DB.save();
    U.toast('Deleted', 'info');
    this.openManageRates();
  },

  _editCommissionOption(partnerId, cid) {
    const p = DB.findPartner(partnerId); if (!p) return;
    p.commissionOptions = p.commissionOptions || [];
    const c = cid ? p.commissionOptions.find(x => x.id === cid) : {
      id: U.uid('C'), name: '', rate: 25, notes: '',
    };
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Commission Option Name</div>
          <input id="co-name" class="field-input" value="${U.esc(c.name)}" placeholder="e.g. 30% preferred producer"></div>
        <div><div class="field-label">Commission Rate (%)</div>
          <input id="co-rate" type="number" step="0.5" class="field-input" value="${c.rate}"></div>
        <div></div>
        <div class="col-span-2"><div class="field-label">Notes (optional)</div>
          <textarea id="co-notes" class="field-textarea" rows="2">${U.esc(c.notes || '')}</textarea></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.calculator._saveCommissionOption('${partnerId}', '${c.id}', ${cid?'true':'false'})">Save</button>`;
    const m = U.modal({ title: cid ? 'Edit Commission Option' : 'New Commission Option', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _saveCommissionOption(partnerId, cid, isExisting) {
    const p = DB.findPartner(partnerId); if (!p) return;
    p.commissionOptions = p.commissionOptions || [];
    const c = isExisting ? p.commissionOptions.find(x => x.id === cid) : { id: cid };
    c.name = document.getElementById('co-name').value || 'Untitled';
    c.rate = +document.getElementById('co-rate').value || 0;
    c.notes = document.getElementById('co-notes').value;
    if (!isExisting) p.commissionOptions.push(c);
    DB.save();
    U.closeModals();
    U.toast(isExisting ? 'Commission updated' : 'Commission added');
    this.openManageRates();
  },

  _deleteCommissionOption(partnerId, cid) {
    if (!confirm('Delete this commission option?')) return;
    const p = DB.findPartner(partnerId); if (!p || !p.commissionOptions) return;
    p.commissionOptions = p.commissionOptions.filter(c => c.id !== cid);
    DB.save();
    U.toast('Deleted', 'info');
    this.openManageRates();
  },

  // ------------------- STATUS LOGIC -------------------
  // A quote is "confirmed" income only when it's tied to a bond that has been
  // approved / is ready to be issued (Active or Pending UW with tracking dates
  // filled in). Bids are ALWAYS potential regardless of association.
  _impliedStatus() {
    const s = this._selected;
    if (/bid/i.test(s.bondType || '')) return 'potential';
    if (s.associationKind === 'bond' && s.associationId) {
      const bondId = s.associationId.split(':')[1];
      const b = DB.findBond(bondId);
      if (b && (b.status === 'Active' || (b.status === 'Pending UW' && b.reportedToBondCo))) {
        return 'confirmed';
      }
    }
    return 'potential';
  },

  // ------------------- SAVE / TRACK QUOTES -------------------
  saveQuote() {
    const r = this._lastResult;
    const s = this._selected;
    if (!r || !r.partner || !r.rateOption) { U.toast('Fill in the inputs first', 'warn'); return; }
    if (!s.accountId) { U.toast('Pick a principal before saving', 'warn'); return; }

    const now = new Date().toISOString();
    const status = this._impliedStatus();
    const snapshot = {
      partnerId: r.partner.id, partnerName: r.partner.name,
      rateOptionId: r.rateOption.id, rateOptionName: r.rateOption.name, rateType: r.rateOption.type,
      commissionOptionId: r.commissionOption ? r.commissionOption.id : null,
      commissionOptionName: r.commissionOption ? r.commissionOption.name : '',
      commissionRate: r.commissionPct,
      bondType: s.bondType, amount: s.amount,
      obligee: s.obligee, effectiveDate: s.effectiveDate, notes: s.notes,
      accountId: s.accountId,
      associationKind: s.associationKind || null,
      associationId: s.associationId ? s.associationId.split(':')[1] : null,
      premium: r.premium, effectiveRate: r.effectiveRate, commission: r.commission,
      breakdown: r.breakdown,
      status, savedAt: now, savedBy: 'CV',
    };
    let quote;
    if (this._editingQuoteId) {
      quote = DB.findQuote(this._editingQuoteId);
      if (quote) {
        Object.assign(quote, snapshot, { updatedAt: now });
      } else {
        quote = { id: U.uid('Q'), ...snapshot };
        DB.quotes().push(quote);
      }
    } else {
      quote = { id: U.uid('Q'), ...snapshot };
      DB.quotes().push(quote);
    }
    DB.save();
    U.toast(`PC ${this._editingQuoteId ? 'updated' : 'saved'} — ${status === 'potential' ? 'tracked as potential' : 'tracked as confirmed'}`);
    this._editingQuoteId = null;
    this._recalc();
  },

  _resetSelection() {
    this._selected = {
      accountId: '', associationId: '', associationKind: '',
      partnerId: '', rateOptionId: '', commissionOptionId: '',
      bondType: 'Payment & Performance', amount: 500000,
      effectiveDate: new Date().toISOString().slice(0,10),
      obligee: '', notes: '',
    };
    this._editingQuoteId = null;
    this.render();
  },

  // Load a saved quote back into the calculator for viewing / editing
  loadQuote(id) {
    const q = DB.findQuote(id); if (!q) return;
    this._selected = {
      accountId: q.accountId || '',
      associationId: q.associationId ? (q.associationKind + ':' + q.associationId) : '',
      associationKind: q.associationKind || '',
      partnerId: q.partnerId, rateOptionId: q.rateOptionId, commissionOptionId: q.commissionOptionId,
      bondType: q.bondType, amount: q.amount, obligee: q.obligee || '',
      effectiveDate: q.effectiveDate || new Date().toISOString().slice(0,10),
      notes: q.notes || '',
    };
    this._editingQuoteId = id;
    this._tab = 'calc';
    this.render();
  },

  // ------------------- SAVED QUOTES VIEW -------------------
  _renderQuotesView() {
    const all = DB.quotes().slice().sort((a,b) => (b.savedAt||'').localeCompare(a.savedAt||''));
    const potential = all.filter(q => q.status === 'potential');
    const confirmed = all.filter(q => q.status === 'confirmed');
    const sumPremiumP = potential.reduce((s,q) => s+(q.premium||0), 0);
    const sumCommP    = potential.reduce((s,q) => s+(q.commission||0), 0);
    const sumPremiumC = confirmed.reduce((s,q) => s+(q.premium||0), 0);
    const sumCommC    = confirmed.reduce((s,q) => s+(q.commission||0), 0);
    const bidCount = potential.filter(q => /bid/i.test(q.bondType||'')).length;

    return `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div class="stat-card !p-4 border-l-4 border-emerald-500">
          <div class="stat-label text-emerald-800">Confirmed Income (Ready to Issue)</div>
          <div class="stat-value text-emerald-700">${U.usd(sumCommC)}</div>
          <div class="text-[11px] text-ink-400 mt-1">${confirmed.length} quote${confirmed.length===1?'':'s'} · ${U.usd(sumPremiumC)} total premium</div>
        </div>
        <div class="stat-card !p-4 border-l-4 border-amber-500">
          <div class="stat-label text-amber-800">Potential Income (If Awarded/Issued)</div>
          <div class="stat-value text-amber-700">${U.usd(sumCommP)}</div>
          <div class="text-[11px] text-ink-400 mt-1">${potential.length} quote${potential.length===1?'':'s'}${bidCount?' · '+bidCount+' bid bond'+(bidCount===1?'':'s'):''}</div>
        </div>
        <div class="stat-card !p-4">
          <div class="stat-label">Total Quoted Premium</div>
          <div class="stat-value">${U.usd(sumPremiumC + sumPremiumP)}</div>
          <div class="text-[11px] text-ink-400 mt-1">${all.length} quote${all.length===1?'':'s'} total</div>
        </div>
        <div class="stat-card !p-4">
          <div class="stat-label">Avg Commission %</div>
          <div class="stat-value">${all.length ? (all.reduce((s,q)=>s+(q.commissionRate||0),0)/all.length).toFixed(1) : 0}%</div>
          <div class="text-[11px] text-ink-400 mt-1">weighted by quote count</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Saved Premium Calculators</div>
          <div class="text-xs text-ink-300">Click any row to load it back into the calculator.</div>
        </div>
        <table class="tbl">
          <thead><tr>
            <th>Saved</th><th>Principal</th><th>Association</th><th>Surety / Rate</th>
            <th>Bond Type</th><th class="text-right">Amount</th>
            <th class="text-right">Premium</th><th class="text-right">Comm.</th>
            <th>Status</th><th class="text-right"></th>
          </tr></thead>
          <tbody>
            ${all.length ? all.map(q => this._quoteRow(q)).join('')
              : '<tr><td colspan="10" class="text-center text-ink-300 py-8 italic">No saved PCs yet. Build one on the Calculator tab and click <b>💾 Save PC</b>.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  _quoteRow(q) {
    const acct = q.accountId ? DB.findAccount(q.accountId) : null;
    let assocLabel = '—';
    if (q.associationKind === 'bond' && q.associationId) {
      const b = DB.findBond(q.associationId);
      assocLabel = b ? `Bond ${b.number}` : `Bond ${q.associationId}`;
    } else if (q.associationKind === 'opportunity' && q.associationId) {
      assocLabel = `Opp ${q.associationId}`;
    }
    const badge = q.status === 'confirmed'
      ? '<span class="badge badge-green">✓ Confirmed</span>'
      : '<span class="badge badge-amber">Potential</span>';
    const isBid = /bid/i.test(q.bondType||'');
    return `
      <tr class="cursor-pointer hover:bg-cream-50" onclick="Views.calculator.loadQuote('${q.id}')">
        <td class="text-xs text-ink-400 whitespace-nowrap">${U.date((q.savedAt||'').slice(0,10))}</td>
        <td class="font-medium">${U.esc(acct ? acct.name : '—')}</td>
        <td class="text-xs">${U.esc(assocLabel)}</td>
        <td class="text-xs">
          <div>${U.esc(q.partnerName||'')}</div>
          <div class="text-[10px] text-ink-300">${U.esc(q.rateOptionName||'')} · ${q.commissionRate}%</div>
        </td>
        <td class="text-xs">${U.esc(q.bondType||'')}${isBid?' <span class="text-amber-700">·bid</span>':''}</td>
        <td class="text-right">${U.usd(q.amount||0)}</td>
        <td class="text-right">${U.usd(q.premium||0)}</td>
        <td class="text-right ${q.status==='confirmed'?'text-emerald-700 font-medium':'text-amber-700'}">${U.usd(q.commission||0)}</td>
        <td>${badge}</td>
        <td class="text-right whitespace-nowrap">
          ${q.status==='potential'
            ? `<button class="btn-ghost text-xs" onclick="event.stopPropagation(); Views.calculator._promoteQuote('${q.id}')" title="Mark as issued / confirmed income">✓ Confirm</button>`
            : `<button class="btn-ghost text-xs" onclick="event.stopPropagation(); Views.calculator._demoteQuote('${q.id}')" title="Move back to potential">↺ Revert</button>`}
          <button class="btn-ghost text-xs text-rose-600" onclick="event.stopPropagation(); Views.calculator._deleteQuote('${q.id}')">✕</button>
        </td>
      </tr>`;
  },

  _promoteQuote(id) {
    const q = DB.findQuote(id); if (!q) return;
    q.status = 'confirmed';
    q.confirmedAt = new Date().toISOString();
    DB.save();
    U.toast('Marked as confirmed income');
    this.render();
  },

  _demoteQuote(id) {
    const q = DB.findQuote(id); if (!q) return;
    q.status = 'potential';
    q.confirmedAt = null;
    DB.save();
    U.toast('Moved back to potential', 'info');
    this.render();
  },

  _deleteQuote(id) {
    if (!confirm('Delete this saved PC?')) return;
    const arr = DB.quotes();
    const i = arr.findIndex(q => q.id === id);
    if (i >= 0) arr.splice(i, 1);
    DB.save();
    U.toast('Quote deleted', 'info');
    this.render();
  },

  // ------------------- EXPORT -------------------
  exportQuote() {
    const r = this._lastResult;
    if (!r || !r.partner || !r.rateOption) { U.toast('Fill in the inputs first', 'warn'); return; }
    const s = this._selected;
    const account = s.accountId ? DB.findAccount(s.accountId) : null;
    if (!window.PDF || !PDF.premiumQuote) { U.toast('PDF module not available', 'warn'); return; }
    const doc = PDF.premiumQuote({
      bondType: s.bondType,
      amount: s.amount,
      principal: account ? account.name : '',
      obligee: s.obligee,
      effective: s.effectiveDate,
      options: [{
        partner: r.partner.name,
        baseRate: r.effectiveRate,
        adjRate:  r.effectiveRate,
        premium:  r.premium,
        commissionRate: r.commissionPct,
        commission: r.commission,
      }],
    });
    doc.save('Premium_Quote.pdf');
    U.toast('Quote exported');
  },
};
