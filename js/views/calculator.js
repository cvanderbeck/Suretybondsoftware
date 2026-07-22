// ---------- Premium Calculator ----------
// Pick a principal, a bond/opportunity to associate, a surety, one of that
// surety's rate options, and one of their commission options. Compute the
// premium (with slide tiers when applicable) and our commission dollars.
window.Views = window.Views || {};

Views.calculator = {
  _selected: {
    accountId: '', associationId: '', associationKind: '',
    partnerId: '', rateOptionId: '', commissionOptionId: '',
    bondType: 'Payment & Performance', amount: 500000,
    effectiveDate: new Date().toISOString().slice(0,10),
    obligee: '', notes: '',
  },
  _lastResult: null,

  render() {
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Premium Calculator</h1>
          <p class="section-sub">Pick a surety, rate option, and commission to project premium and our earn.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.calculator.openManageRates()">⚙ Manage Rates & Commissions</button>
        </div>
      </div>

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
    this._bindInputs();
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
    return `
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="stat-card !p-4">
          <div class="stat-label">Estimated Premium</div>
          <div class="stat-value">${U.usd(r.premium)}</div>
          <div class="text-[11px] text-ink-300 mt-0.5">Effective rate ${r.effectiveRate.toFixed(2)}%</div>
        </div>
        <div class="stat-card !p-4">
          <div class="stat-label">Our Commission (${r.commissionPct}%)</div>
          <div class="stat-value text-emerald-700">${U.usd(r.commission)}</div>
          <div class="text-[11px] text-ink-300 mt-0.5">${U.esc(r.commissionOption ? r.commissionOption.name : 'No commission selected')}</div>
        </div>
        <div class="stat-card !p-4">
          <div class="stat-label">Surety Net</div>
          <div class="stat-value">${U.usd(partnerNet)}</div>
          <div class="text-[11px] text-ink-300 mt-0.5">Premium − commission</div>
        </div>
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
