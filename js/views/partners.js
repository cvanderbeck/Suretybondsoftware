// ---------- Bond Company Partners ----------
// Sureties the agency is appointed with. Track appetite, contact, portal,
// per-surety rate options + commission options, forms with expiration
// tracking (auto-tasks generated when forms expire), and which principals
// have active bond programs with each surety.
window.Views = window.Views || {};

Views.partners = {
  _currentId: null,
  _tab: 'overview',
  FORM_CATEGORIES: ['Bond Form','POA','Rate Sheet','Producer Agreement','Appetite Guide','Application','Endorsement','Other'],
  EXPIRING_SOON_DAYS: 30,

  render() {
    // Sync expired-form tasks first so anything overdue is on the board.
    this._syncFormExpirationTasks();
    const list = DB.partners();
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Bond Company Partners</h1>
          <p class="section-sub">Sureties your agency is appointed with. Rates, forms, active programs, and who's placed where.</p>
        </div>
        <button class="btn-primary" onclick="Views.partners.openForm()">+ Add Partner</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${list.map(p => this._partnerCard(p)).join('')}
      </div>
    `;
  },

  _partnerCard(p) {
    const bonds = DB.bonds().filter(b => b.partnerId === p.id && b.status === 'Active');
    const totalBonds = DB.bonds().filter(b => b.partnerId === p.id).length;
    const premium = bonds.reduce((s,b)=>s+(b.premium||0),0);
    const commission = bonds.reduce((s,b)=>s+(b.premium||0)*(b.commissionRate||0)/100,0);
    const principals = new Set(bonds.map(b => b.accountId));
    const formCounts = this._formCounts(p);

    return `
      <div class="card p-5 cursor-pointer hover:shadow-md transition" onclick="Views.partners.open('${p.id}')">
        <div class="flex items-start justify-between mb-2">
          <div>
            <div class="text-base font-semibold text-ink-700">${U.esc(p.name)}</div>
            <div class="text-xs text-ink-300">AM Best: <b>${U.esc(p.rating||'—')}</b></div>
          </div>
          ${p.active ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-slate">Inactive</span>'}
        </div>
        <div class="text-xs text-ink-400 mb-3 line-clamp-2">${U.esc(p.appetite||'')}</div>

        <div class="grid grid-cols-3 gap-2 text-center border-t border-cream-100 pt-3">
          <div><div class="text-[10px] text-ink-300 uppercase tracking-wider">Principals</div><div class="font-semibold">${principals.size}</div></div>
          <div><div class="text-[10px] text-ink-300 uppercase tracking-wider">Active Bonds</div><div class="font-semibold">${bonds.length}</div></div>
          <div><div class="text-[10px] text-ink-300 uppercase tracking-wider">Commission</div><div class="font-semibold text-emerald-700">${U.usd(commission)}</div></div>
        </div>

        <div class="mt-3 pt-3 border-t border-cream-100 flex items-center justify-between text-[11px]">
          <div class="flex items-center gap-2">
            <span class="text-ink-400">${(p.rateOptions||[]).length} rates · ${(p.commissionOptions||[]).length} comm</span>
          </div>
          <div class="flex items-center gap-1">
            ${formCounts.expired ? `<span class="badge badge-rose">🚨 ${formCounts.expired} expired</span>` : ''}
            ${formCounts.expiring ? `<span class="badge badge-amber">⚠ ${formCounts.expiring} expiring</span>` : ''}
            ${!formCounts.expired && !formCounts.expiring ? `<span class="text-emerald-700">✓ Forms current</span>` : ''}
          </div>
        </div>
      </div>`;
  },

  _formCounts(p) {
    const forms = p.forms || [];
    let expired = 0, expiring = 0, current = 0;
    forms.forEach(f => {
      const s = this._formStatus(f);
      if (s === 'expired') expired++;
      else if (s === 'expiring') expiring++;
      else current++;
    });
    return { expired, expiring, current, total: forms.length };
  },

  _formStatus(f) {
    if (!f.expiresDate) return 'current';
    const now = new Date();
    const exp = new Date(f.expiresDate);
    const days = Math.ceil((exp - now) / 86400000);
    if (days < 0) return 'expired';
    if (days <= this.EXPIRING_SOON_DAYS) return 'expiring';
    return 'current';
  },

  _daysUntilExpiry(f) {
    if (!f.expiresDate) return null;
    return Math.ceil((new Date(f.expiresDate) - new Date()) / 86400000);
  },

  // ------------------- DETAIL MODAL -------------------
  open(id) {
    this._currentId = id;
    this._tab = 'overview';
    this._renderDetail();
  },

  _setTab(k) {
    U.closeModals();
    this._tab = k;
    this._renderDetail();
  },

  _renderDetail() {
    const p = DB.findPartner(this._currentId);
    if (!p) return;
    const bonds = DB.bonds().filter(b => b.partnerId === p.id);
    const activeBonds = bonds.filter(b => b.status === 'Active');
    const principals = [...new Set(activeBonds.map(b => b.accountId))];
    const formCount = (p.forms||[]).length;
    const formCounts = this._formCounts(p);
    const rateCount = (p.rateOptions||[]).length;

    const TABS = [
      ['overview',    'Overview',    ''],
      ['principals',  'Principals',  principals.length || ''],
      ['bonds',       'Bonds',       bonds.length || ''],
      ['forms',       'Forms',       formCount ? `${formCount}${formCounts.expired?` · ${formCounts.expired}🚨`:formCounts.expiring?` · ${formCounts.expiring}⚠`:''}` : ''],
      ['rates',       'Rates & Commissions', rateCount || ''],
      ['contact',     'Contact',     ''],
    ];

    const headerHTML = `
      <div class="flex items-start justify-between -mt-2 mb-3">
        <div>
          <div class="flex items-center gap-2">
            <div class="text-lg font-semibold">${U.esc(p.name)}</div>
            ${p.active ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-slate">Inactive</span>'}
            ${p.rating ? `<span class="badge badge-slate">AM Best ${U.esc(p.rating)}</span>` : ''}
          </div>
          <div class="text-sm text-ink-300 mt-0.5">${U.esc(p.appetite||'')}</div>
        </div>
        <div class="text-right text-xs">
          ${p.portalUrl ? `<a class="text-brand-600 hover:underline" href="${U.esc(p.portalUrl)}" target="_blank" rel="noopener">Portal ↗</a>` : ''}
        </div>
      </div>
      <div class="border-b border-cream-200 -mx-6 px-6 flex flex-wrap gap-1">
        ${TABS.map(([key,label,count]) => `
          <button class="px-3 py-2 text-sm border-b-2 -mb-px transition
              ${this._tab===key
                ? 'border-brand-500 text-brand-700 font-semibold'
                : 'border-transparent text-ink-400 hover:text-ink-700 hover:border-cream-300'}"
              onclick="Views.partners._setTab('${key}')">
            ${U.esc(label)}${count!==''?` <span class="ml-1 text-xs text-ink-300">${count}</span>`:''}
          </button>`).join('')}
      </div>
    `;

    const body = headerHTML + '<div class="pt-4">' + this._renderTab(p, { bonds, activeBonds, principals }) + '</div>';
    const footer = `
      <button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary text-rose-600" onclick="Views.partners.deletePartner('${p.id}')">Delete</button>
      <button class="btn-secondary" onclick="Views.partners.openForm('${p.id}')">Edit Details</button>
      <button class="btn-primary" onclick="U.closeModals(); App.go('calculator'); setTimeout(()=>{Views.calculator._selected.partnerId='${p.id}'; Views.calculator._tab='calc'; Views.calculator.render();}, 60);">Quote a Bond →</button>
    `;
    const m = U.modal({ title: 'Bond Company Partner', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _renderTab(p, ctx) {
    switch (this._tab) {
      case 'overview':   return this._tabOverview(p, ctx);
      case 'principals': return this._tabPrincipals(p, ctx);
      case 'bonds':      return this._tabBonds(p, ctx);
      case 'forms':      return this._tabForms(p);
      case 'rates':      return this._tabRates(p);
      case 'contact':    return this._tabContact(p);
      default:           return this._tabOverview(p, ctx);
    }
  },

  // ------------------- OVERVIEW TAB -------------------
  _tabOverview(p, { bonds, activeBonds, principals }) {
    const premium = activeBonds.reduce((s,b)=>s+(b.premium||0),0);
    const commission = activeBonds.reduce((s,b)=>s+(b.premium||0)*(b.commissionRate||0)/100,0);
    const inForce = activeBonds.reduce((s,b)=>s+(b.amount||0),0);
    const formCounts = this._formCounts(p);
    const expiredForms  = (p.forms||[]).filter(f => this._formStatus(f) === 'expired');
    const expiringForms = (p.forms||[]).filter(f => this._formStatus(f) === 'expiring');

    // Top principals by exposure
    const byAcct = {};
    activeBonds.forEach(b => { byAcct[b.accountId] = (byAcct[b.accountId] || 0) + (b.amount || 0); });
    const topAccts = Object.entries(byAcct).sort((a,b) => b[1]-a[1]).slice(0, 5);

    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="stat-card !p-3"><div class="stat-label">Principals</div><div class="stat-value text-lg">${principals.length}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Active Bonds</div><div class="stat-value text-lg">${activeBonds.length}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">In-Force</div><div class="stat-value text-lg">${U.usd(inForce)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Commission YTD</div><div class="stat-value text-lg text-emerald-700">${U.usd(commission)}</div></div>
      </div>

      ${expiredForms.length || expiringForms.length ? `
        <div class="card mb-4 ${expiredForms.length ? 'border-rose-300 bg-rose-50/40' : 'border-amber-300 bg-amber-50/40'}">
          <div class="p-4">
            <div class="flex items-start gap-3">
              <div class="text-2xl">${expiredForms.length ? '🚨' : '⚠️'}</div>
              <div class="flex-1">
                <div class="font-semibold ${expiredForms.length ? 'text-rose-800' : 'text-amber-800'}">
                  ${expiredForms.length ? `${expiredForms.length} form${expiredForms.length===1?'':'s'} expired` : `${expiringForms.length} form${expiringForms.length===1?'':'s'} expiring within ${this.EXPIRING_SOON_DAYS} days`}
                </div>
                <div class="text-xs mt-1 ${expiredForms.length ? 'text-rose-700' : 'text-amber-700'}">
                  ${expiredForms.concat(expiringForms).map(f => U.esc(f.name)).slice(0, 3).join(' · ')}${(expiredForms.length+expiringForms.length)>3?' · …':''}
                </div>
                <button class="btn-secondary mt-2 text-xs" onclick="Views.partners._setTab('forms')">Go to Forms →</button>
              </div>
            </div>
          </div>
        </div>` : ''}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Top Principals by Exposure</div>
            <button class="btn-ghost text-xs" onclick="Views.partners._setTab('principals')">All →</button></div>
          <table class="tbl">
            <thead><tr><th>Principal</th><th class="text-right">Bonds</th><th class="text-right">Exposure</th></tr></thead>
            <tbody>
              ${topAccts.length ? topAccts.map(([acctId, exp]) => {
                const a = DB.findAccount(acctId);
                const n = activeBonds.filter(b => b.accountId === acctId).length;
                return `<tr class="cursor-pointer" onclick="U.closeModals(); Views.accounts.open('${acctId}')">
                  <td class="font-medium">${U.esc(a ? a.name : acctId)}</td>
                  <td class="text-right">${n}</td>
                  <td class="text-right">${U.usd(exp)}</td>
                </tr>`;
              }).join('') : '<tr><td colspan="3" class="text-center text-ink-300 py-6">No active bonds with this surety yet.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Forms Health</div>
            <button class="btn-ghost text-xs" onclick="Views.partners._setTab('forms')">Manage →</button></div>
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div class="text-2xl font-display font-semibold text-emerald-700">${formCounts.current}</div>
                <div class="text-[10px] text-emerald-800 uppercase tracking-wider">Current</div>
              </div>
              <div class="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div class="text-2xl font-display font-semibold text-amber-700">${formCounts.expiring}</div>
                <div class="text-[10px] text-amber-800 uppercase tracking-wider">Expiring</div>
              </div>
              <div class="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <div class="text-2xl font-display font-semibold text-rose-700">${formCounts.expired}</div>
                <div class="text-[10px] text-rose-800 uppercase tracking-wider">Expired</div>
              </div>
            </div>
            <div class="text-xs text-ink-400 italic">Tasks are auto-created for expired and soon-to-expire forms. Check the Tasks view.</div>
          </div>
        </div>
      </div>
    `;
  },

  // ------------------- PRINCIPALS TAB -------------------
  _tabPrincipals(p, { bonds, activeBonds }) {
    // Group by account
    const byAcct = {};
    bonds.forEach(b => {
      (byAcct[b.accountId] = byAcct[b.accountId] || []).push(b);
    });
    const rows = Object.entries(byAcct).map(([acctId, list]) => {
      const a = DB.findAccount(acctId) || {};
      const active = list.filter(b => b.status === 'Active');
      const inForce = active.reduce((s,b) => s+(b.amount||0), 0);
      const commission = active.reduce((s,b) => s+(b.premium||0)*(b.commissionRate||0)/100, 0);
      const oldest = list.slice().sort((x,y) => (x.effective||'').localeCompare(y.effective||''))[0];
      return { acctId, a, list, active, inForce, commission, oldest };
    }).sort((a,b) => b.inForce - a.inForce);

    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-400">${rows.length} principal${rows.length===1?'':'s'} placed with ${U.esc(p.name)}. Only accounts with an <b>Active bond</b> count as an active bond program.</div>
      </div>
      <div class="card">
        <table class="tbl">
          <thead><tr>
            <th>Principal</th><th>Status</th><th class="text-right">Active Bonds</th>
            <th class="text-right">In-Force</th><th class="text-right">Commission</th>
            <th>Since</th>
          </tr></thead>
          <tbody>
            ${rows.length ? rows.map(r => `
              <tr class="cursor-pointer" onclick="U.closeModals(); Views.accounts.open('${r.acctId}')">
                <td>
                  <div class="font-medium">${U.esc(r.a.name || r.acctId)}</div>
                  <div class="text-xs text-ink-300">${U.esc(r.a.city||'')}${r.a.state?', '+U.esc(r.a.state):''}</div>
                </td>
                <td>${r.active.length > 0
                  ? `<span class="badge badge-green">Active Program</span>`
                  : `<span class="badge badge-slate">No Active Bonds</span>`}</td>
                <td class="text-right font-medium">${r.active.length}</td>
                <td class="text-right">${U.usd(r.inForce)}</td>
                <td class="text-right text-emerald-700">${U.usd(r.commission)}</td>
                <td class="text-xs">${U.date(r.oldest?.effective)}</td>
              </tr>
            `).join('') : '<tr><td colspan="6" class="text-center text-ink-300 py-8">No principals placed with this surety yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  // ------------------- BONDS TAB -------------------
  _tabBonds(p, { bonds }) {
    return `
      <div class="text-sm text-ink-400 mb-3">Every bond written with ${U.esc(p.name)}.</div>
      <div class="card">
        <table class="tbl">
          <thead><tr>
            <th>Bond #</th><th>Principal</th><th>Type</th><th>Obligee</th>
            <th class="text-right">Amount</th><th class="text-right">Premium</th>
            <th>Status</th><th>Expires</th>
          </tr></thead>
          <tbody>
            ${bonds.length ? bonds.map(b => {
              const a = DB.findAccount(b.accountId) || {};
              return `<tr class="cursor-pointer" onclick="U.closeModals(); Views.bonds.open('${b.id}')">
                <td class="font-mono text-sm">${U.esc(b.number||b.id)}</td>
                <td>${U.esc(a.name||'')}</td>
                <td class="text-xs">${U.esc(b.type||'')}</td>
                <td class="text-xs max-w-[14rem] truncate">${U.esc(b.obligee||'')}</td>
                <td class="text-right">${U.usd(b.amount||0)}</td>
                <td class="text-right">${U.usd(b.premium||0)}</td>
                <td>${U.statusBadge ? U.statusBadge(b.status) : `<span class="badge badge-slate">${b.status}</span>`}</td>
                <td class="text-xs">${U.date(b.expires)}</td>
              </tr>`;
            }).join('') : '<tr><td colspan="8" class="text-center text-ink-300 py-8">No bonds with this surety yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  // ------------------- FORMS TAB -------------------
  _tabForms(p) {
    const forms = p.forms || [];
    const byCat = {};
    forms.forEach(f => { (byCat[f.category||'Other'] = byCat[f.category||'Other'] || []).push(f); });
    const cats = Object.keys(byCat).sort();

    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-400">
          Bond forms, POAs, rate sheets, producer agreements, and other documents from ${U.esc(p.name)}.
          <br><span class="text-xs text-ink-300 italic">Tasks are auto-created when a form is within ${this.EXPIRING_SOON_DAYS} days of expiration or already expired.</span>
        </div>
        <button class="btn-primary" onclick="Views.partners._addForm('${p.id}')">+ Add Form</button>
      </div>

      ${cats.length ? cats.map(cat => `
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">${U.esc(cat)}</div>
            <span class="text-xs text-ink-300">${byCat[cat].length} form${byCat[cat].length===1?'':'s'}</span>
          </div>
          <table class="tbl">
            <thead><tr>
              <th>Form</th><th>Version</th><th>Effective</th><th>Expires</th>
              <th>Status</th><th class="text-right"></th>
            </tr></thead>
            <tbody>
              ${byCat[cat].map(f => {
                const status = this._formStatus(f);
                const days = this._daysUntilExpiry(f);
                const statusChip = status === 'expired'
                  ? `<span class="badge badge-rose">🚨 Expired${days!==null?` ${Math.abs(days)}d ago`:''}</span>`
                  : status === 'expiring'
                    ? `<span class="badge badge-amber">⚠ Expires in ${days}d</span>`
                    : `<span class="badge badge-green">✓ Current${days!==null?` — ${days}d`:''}</span>`;
                return `<tr class="${status==='expired'?'bg-rose-50/30':status==='expiring'?'bg-amber-50/30':''}">
                  <td>
                    <div class="font-medium">${U.esc(f.name)}</div>
                    <div class="text-xs text-ink-300">${U.fileSize(f.size||0)}${f.notes?` · <span class="italic">${U.esc(f.notes)}</span>`:''}</div>
                  </td>
                  <td class="text-xs font-mono">${U.esc(f.version||'—')}</td>
                  <td class="text-xs">${U.date(f.effectiveDate)}</td>
                  <td class="text-xs">${f.expiresDate ? U.date(f.expiresDate) : '<span class="text-ink-300">no expiry</span>'}</td>
                  <td>${statusChip}</td>
                  <td class="text-right whitespace-nowrap">
                    ${f.dataUrl ? `<a class="btn-ghost text-xs" href="${f.dataUrl}" download="${U.esc(f.name)}">↓ Download</a>` : ''}
                    <button class="btn-ghost text-xs" onclick="Views.partners._editForm('${p.id}', '${f.id}')">Edit</button>
                    <button class="btn-ghost text-xs text-rose-600" onclick="Views.partners._deleteForm('${p.id}', '${f.id}')">✕</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('') : `<div class="card p-8 text-center text-ink-300 italic">No forms on file. Click <b>+ Add Form</b> to attach the first one.</div>`}
    `;
  },

  _addForm(partnerId) { this._editForm(partnerId, null); },

  _editForm(partnerId, formId) {
    const p = DB.findPartner(partnerId); if (!p) return;
    p.forms = p.forms || [];
    const f = formId ? p.forms.find(x => x.id === formId) : {
      id: U.uid('FRM'), name: '', category: 'Bond Form', version: '',
      effectiveDate: new Date().toISOString().slice(0,10),
      expiresDate: '', size: 0, type: '', dataUrl: null, notes: '',
    };
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Form Name</div>
          <input id="frm-name" class="field-input" value="${U.esc(f.name)}" placeholder="e.g. Performance & Payment Bond Form"></div>
        <div><div class="field-label">Category</div>
          <select id="frm-cat" class="field-select">
            ${this.FORM_CATEGORIES.map(c => `<option ${c===f.category?'selected':''}>${U.esc(c)}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Version / Revision</div>
          <input id="frm-ver" class="field-input" value="${U.esc(f.version||'')}" placeholder="e.g. v2026.1"></div>
        <div><div class="field-label">Effective Date</div>
          <input id="frm-eff" type="date" class="field-input" value="${U.esc(f.effectiveDate||'')}"></div>
        <div><div class="field-label">Expires Date <span class="text-ink-300 font-normal normal-case tracking-normal">(blank = no expiry)</span></div>
          <input id="frm-exp" type="date" class="field-input" value="${U.esc(f.expiresDate||'')}"></div>
        <div class="col-span-2"><div class="field-label">Attach File</div>
          <input id="frm-file" type="file" class="field-input">
          ${f.dataUrl ? `<div class="text-xs text-ink-400 mt-1">Current: <a class="text-brand-600 hover:underline" href="${f.dataUrl}" download="${U.esc(f.name)}">${U.esc(f.name)}</a> (${U.fileSize(f.size||0)})</div>` : ''}
        </div>
        <div class="col-span-2"><div class="field-label">Notes</div>
          <textarea id="frm-notes" class="field-textarea" rows="2">${U.esc(f.notes||'')}</textarea></div>
      </div>
      <div class="text-xs text-ink-300 mt-3 italic">Tasks auto-generate when a form is within ${this.EXPIRING_SOON_DAYS} days of expiration or already expired.</div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.partners._saveForm('${partnerId}', '${f.id}', ${formId?'true':'false'})">Save</button>`;
    const m = U.modal({ title: formId ? 'Edit Form' : 'Add Form', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  async _saveForm(partnerId, formId, isExisting) {
    const p = DB.findPartner(partnerId); if (!p) return;
    p.forms = p.forms || [];
    const f = isExisting ? p.forms.find(x => x.id === formId) : { id: formId };
    f.name = document.getElementById('frm-name').value || 'Untitled Form';
    f.category = document.getElementById('frm-cat').value;
    f.version = document.getElementById('frm-ver').value;
    f.effectiveDate = document.getElementById('frm-eff').value || null;
    f.expiresDate = document.getElementById('frm-exp').value || null;
    f.notes = document.getElementById('frm-notes').value;
    const fileInput = document.getElementById('frm-file');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      if (file.size > 5 * 1024 * 1024) { U.toast('File exceeds 5 MB limit', 'warn'); return; }
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej;
        r.readAsDataURL(file);
      });
      f.name = f.name || file.name;
      f.dataUrl = dataUrl;
      f.size = file.size;
      f.type = file.type || 'application/octet-stream';
      f.uploaded = new Date().toISOString();
    }
    if (!isExisting) p.forms.push(f);
    DB.save();
    U.closeModals();
    U.toast(isExisting ? 'Form updated' : 'Form added');
    // Re-check tasks now that a form's dates may have changed.
    this._syncFormExpirationTasks();
    this._renderDetail();
  },

  _deleteForm(partnerId, formId) {
    if (!confirm('Delete this form? Any auto-generated task will remain.')) return;
    const p = DB.findPartner(partnerId); if (!p || !p.forms) return;
    p.forms = p.forms.filter(f => f.id !== formId);
    DB.save();
    U.toast('Form deleted', 'info');
    this._renderDetail();
  },

  // ------------------- RATES & COMMISSIONS TAB -------------------
  _tabRates(p) {
    const rates = p.rateOptions || [];
    const comms = p.commissionOptions || [];
    return `
      <div class="text-sm text-ink-400 mb-3">Rate cards and commission tiers used in the Premium Calculator.
        <button class="btn-ghost text-xs" onclick="U.closeModals(); App.go('calculator'); setTimeout(()=>Views.calculator.openManageRates(), 60);">Edit rates & commissions →</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Rate Options (${rates.length})</div></div>
          ${rates.length ? `<div class="p-3 space-y-2">
            ${rates.map(r => `
              <div class="border border-cream-200 rounded-lg p-3">
                <div class="font-medium text-sm">${U.esc(r.name)}</div>
                <div class="text-xs text-ink-400 mt-0.5">
                  <span class="badge badge-slate text-[10px]">${U.esc(r.type)}</span>
                  ${r.type==='per-thousand' ? `<span class="ml-1">$${(+r.rate).toFixed(2)}/thousand</span>` : ''}
                  ${r.type==='flat' ? `<span class="ml-1">${U.usd(r.rate)}</span>` : ''}
                  ${r.type==='slide' ? `<span class="ml-1">${(r.slide||[]).length} tier${(r.slide||[]).length===1?'':'s'}</span>` : ''}
                  ${r.minPremium ? `<span class="ml-2">min ${U.usd(r.minPremium)}</span>` : ''}
                </div>
                ${r.notes ? `<div class="text-xs text-ink-300 mt-1 italic">${U.esc(r.notes)}</div>` : ''}
                ${r.type==='slide' && r.slide ? `
                  <div class="mt-2 text-[11px] font-mono text-ink-500">
                    ${r.slide.map((t,i) => {
                      const prev = i > 0 ? r.slide[i-1].upTo : 0;
                      return t.upTo==null
                        ? `over ${U.usd(prev)}: $${(+t.rate).toFixed(2)}/K`
                        : `${prev>0?U.usd(prev)+'–':'up to '}${U.usd(t.upTo)}: $${(+t.rate).toFixed(2)}/K`;
                    }).join(' · ')}
                  </div>` : ''}
              </div>
            `).join('')}
          </div>` : '<div class="p-4 text-sm text-ink-300 italic">No rate options yet.</div>'}
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Commission Options (${comms.length})</div></div>
          ${comms.length ? `<div class="p-3 space-y-2">
            ${comms.map(c => `
              <div class="border border-cream-200 rounded-lg p-3">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm">${U.esc(c.name)}</div>
                    <div class="text-xs text-ink-400">${c.rate}% commission on premium</div>
                  </div>
                  <div class="text-2xl font-display font-semibold text-brand-700">${c.rate}%</div>
                </div>
                ${c.notes ? `<div class="text-xs text-ink-300 mt-1 italic">${U.esc(c.notes)}</div>` : ''}
              </div>
            `).join('')}
          </div>` : '<div class="p-4 text-sm text-ink-300 italic">No commission options yet.</div>'}
        </div>
      </div>
    `;
  },

  // ------------------- CONTACT TAB -------------------
  _tabContact(p) {
    return `
      <div class="card">
        <div class="p-4 space-y-3 text-sm">
          <div class="grid grid-cols-2 gap-3">
            <div><div class="field-label">Contact Name</div>${U.esc(p.contactName||'—')}</div>
            <div><div class="field-label">Rating</div>${U.esc(p.rating||'—')}</div>
            <div><div class="field-label">Email</div><a class="text-brand-600 hover:underline" href="mailto:${U.esc(p.email)}">${U.esc(p.email||'—')}</a></div>
            <div><div class="field-label">Phone</div>${U.esc(p.phone||'—')}</div>
            <div class="col-span-2"><div class="field-label">Portal URL</div>
              ${p.portalUrl ? `<a class="text-brand-600 hover:underline" href="${U.esc(p.portalUrl)}" target="_blank" rel="noopener">${U.esc(p.portalUrl)} ↗</a>` : '—'}</div>
            <div class="col-span-2"><div class="field-label">Appetite</div>${U.esc(p.appetite||'—')}</div>
          </div>
        </div>
      </div>
    `;
  },

  // ------------------- EDIT / SAVE PARTNER -------------------
  openForm(id) {
    const p = id ? DB.findPartner(id) : { id: U.uid('P'), active: true, commissionRate: 25 };
    const body = `
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2"><div class="field-label">Partner Name</div><input id="pf-name" class="field-input" value="${U.esc(p.name||'')}"></div>
        <div><div class="field-label">AM Best Rating</div><input id="pf-rating" class="field-input" value="${U.esc(p.rating||'A')}"></div>
        <div><div class="field-label">Default Commission %</div><input id="pf-comm" type="number" step="0.5" class="field-input" value="${p.commissionRate}"></div>
        <div class="col-span-2"><div class="field-label">Appetite</div><input id="pf-app" class="field-input" value="${U.esc(p.appetite||'')}"></div>
        <div><div class="field-label">Contact Name</div><input id="pf-contact" class="field-input" value="${U.esc(p.contactName||'')}"></div>
        <div><div class="field-label">Contact Email</div><input id="pf-email" class="field-input" value="${U.esc(p.email||'')}"></div>
        <div><div class="field-label">Contact Phone</div><input id="pf-phone" class="field-input" value="${U.esc(p.phone||'')}"></div>
        <div><div class="field-label">Portal URL</div><input id="pf-portal" class="field-input" value="${U.esc(p.portalUrl||'')}"></div>
        <div class="col-span-2 flex items-center gap-2"><input id="pf-active" type="checkbox" class="chk" ${p.active?'checked':''}><label for="pf-active" class="text-sm">Active</label></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.partners.save('${p.id}')">Save</button>`;
    const m = U.modal({ title: id ? 'Edit Partner' : 'New Partner', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  save(id) {
    let p = DB.findPartner(id);
    const isNew = !p;
    if (isNew) { p = { id, forms: [], rateOptions: [], commissionOptions: [] }; DB.partners().push(p); }
    p.name   = document.getElementById('pf-name').value;
    p.rating = document.getElementById('pf-rating').value;
    p.commissionRate = +document.getElementById('pf-comm').value;
    p.appetite     = document.getElementById('pf-app').value;
    p.contactName  = document.getElementById('pf-contact').value;
    p.email        = document.getElementById('pf-email').value;
    p.phone        = document.getElementById('pf-phone').value;
    p.portalUrl    = document.getElementById('pf-portal').value;
    p.active       = document.getElementById('pf-active').checked;
    DB.save();
    U.closeModals();
    U.toast(isNew ? 'Partner added' : 'Partner updated');
    if (!isNew && this._currentId === id) this._renderDetail();
    else this.render();
  },

  deletePartner(id) {
    if (!confirm('Delete this partner? Existing bonds keep their partner ID reference but the partner card is gone.')) return;
    const arr = DB.partners();
    const i = arr.findIndex(x => x.id === id);
    if (i >= 0) arr.splice(i, 1);
    DB.save();
    U.closeModals();
    U.toast('Partner deleted', 'info');
    this.render();
  },

  // ------------------- FORM EXPIRATION TASK SYNC -------------------
  // Scan every partner's forms; ensure an admin task exists for each form
  // that's expired or expiring within EXPIRING_SOON_DAYS. Uses a stable
  // task source key so tasks don't duplicate on re-scan.
  _syncFormExpirationTasks() {
    if (!DB.adminTasks) return;
    const tasks = DB.adminTasks();
    let added = 0;
    DB.partners().forEach(p => {
      (p.forms || []).forEach(f => {
        const status = this._formStatus(f);
        if (status === 'current') return;
        const sourceKey = `form-expiry:${p.id}:${f.id}`;
        if (tasks.some(t => t.source === sourceKey && !t.completed)) return;
        const days = this._daysUntilExpiry(f);
        const text = status === 'expired'
          ? `Renew ${U.esc(f.name)} from ${U.esc(p.name)} — EXPIRED ${Math.abs(days)}d ago`
          : `Renew ${U.esc(f.name)} from ${U.esc(p.name)} — expires in ${days}d`;
        tasks.push({
          id: U.uid('AT'),
          text,
          dueDate: f.expiresDate || new Date().toISOString().slice(0,10),
          assignee: 'U-1',
          completed: false,
          priority: status === 'expired' ? 1 : 2,
          type: 'task',
          source: sourceKey,
          createdDate: new Date().toISOString().slice(0,10),
        });
        added++;
      });
    });
    if (added) DB.save();
  },
};
