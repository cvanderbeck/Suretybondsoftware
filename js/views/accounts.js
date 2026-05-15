window.Views = window.Views || {};

Views.accounts = {
  // Open exposure = active + pending UW (commitment to surety).
  OPEN_STATUSES: ['Active', 'Pending UW'],

  // ---------- Aggregate capacity helper ----------
  // `used` is the WIP-adjusted backlog when WIP is tracked, otherwise full
  // bond amount. `usedNominal` keeps the raw sum for comparison.
  capacityFor(accountId) {
    const a = DB.findAccount(accountId);
    const single = a?.company?.singleLimit || 0;
    const agg    = a?.company?.aggregateLimit || 0;
    const open = DB.bonds().filter(b => b.accountId === accountId && this.OPEN_STATUSES.includes(b.status));
    const usedNominal = open.reduce((s,b) => s + (b.amount||0), 0);
    const used = open.reduce((s,b) => s + WIP.backlog(b), 0);
    const credit = Math.max(0, usedNominal - used);
    const remaining = Math.max(0, agg - used);
    const pct = agg ? Math.round(used / agg * 100) : 0;
    const overSingle = open.filter(b => single && b.amount > single);
    const tone =
      pct >= 100 ? { bar: 'bg-rose-500',    text: 'text-rose-700',    badge: 'badge-rose'  } :
      pct >= 85  ? { bar: 'bg-rose-500',    text: 'text-rose-700',    badge: 'badge-rose'  } :
      pct >= 65  ? { bar: 'bg-amber-500',   text: 'text-amber-700',   badge: 'badge-amber' } :
                   { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'badge-green' };
    return { single, aggregate: agg, used, usedNominal, credit, remaining, pct, overSingle, openCount: open.length, openBonds: open, tone };
  },

  capacityBar(accountId, opts = {}) {
    const c = this.capacityFor(accountId);
    if (!c.aggregate) {
      return `<span class="text-xs text-ink-300">No aggregate set</span>`;
    }
    const width = Math.min(100, c.pct);
    const compact = opts.compact;
    return `
      <div class="${compact ? 'min-w-[140px]' : ''}">
        <div class="flex items-center justify-between text-xs">
          <span class="${c.tone.text} font-medium">${c.pct}% used</span>
          <span class="text-ink-300">${U.usd(c.remaining)} avail.</span>
        </div>
        <div class="progress mt-1"><div class="${c.tone.bar}" style="width:${width}%"></div></div>
        ${compact ? '' : `<div class="text-[11px] text-ink-300 mt-1">${U.usd(c.used)} of ${U.usd(c.aggregate)} aggregate · ${c.openCount} open bond${c.openCount===1?'':'s'}</div>`}
      </div>`;
  },

  // ---------- List view ----------
  render() {
    const accts = DB.accounts();
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Accounts</h1>
          <p class="section-sub">${accts.length} principals — contractors, dealers, brokers, and commercial accounts.</p>
        </div>
        <div class="flex items-center gap-2">
          <input id="acct-search" placeholder="Filter accounts…" class="field-input w-64" oninput="Views.accounts.filter()" />
          <button class="btn-primary" onclick="Views.accounts.openForm()">+ New Account</button>
        </div>
      </div>

      <div class="card">
        <table class="tbl">
          <thead><tr>
            <th>Account</th><th>Type</th><th>Primary Contact</th><th>Location</th>
            <th class="text-right">Open Bonds</th><th class="text-right">In-Force</th>
            <th class="min-w-[180px]">Aggregate Capacity</th><th>Credit</th><th>Renewals</th><th></th>
          </tr></thead>
          <tbody id="acct-tbody">${this.rows(accts)}</tbody>
        </table>
      </div>
    `;
  },

  rows(list) {
    return list.map(a => {
      const cap = this.capacityFor(a.id);
      const creditColor = a.credit >= 740 ? 'text-emerald-700' : a.credit >= 680 ? 'text-amber-700' : 'text-rose-700';
      const renewal = this.renewalBadge(a);
      const primary = (a.contacts && a.contacts.find(c => c.primary)) || { name: a.contact || '', email: a.email || '' };
      return `
        <tr class="cursor-pointer" onclick="Views.accounts.open('${a.id}')">
          <td><div class="font-medium text-ink-700">${U.esc(a.name)}</div><div class="text-xs text-ink-300">${a.id}${a.dba?` · DBA ${U.esc(a.dba)}`:''}</div></td>
          <td>${U.esc(a.type)}</td>
          <td><div>${U.esc(primary.name||'')}</div><div class="text-xs text-ink-300">${U.esc(primary.email||'')}</div></td>
          <td>${U.esc(a.city||'')}, ${U.esc(a.state||'')}</td>
          <td class="text-right">${cap.openCount}</td>
          <td class="text-right">${U.usd(cap.used)}</td>
          <td>${this.capacityBar(a.id, { compact: true })}</td>
          <td class="${creditColor} font-medium">${a.credit||'—'}</td>
          <td>${renewal}</td>
          <td class="text-right"><button class="btn-ghost" onclick="event.stopPropagation(); Views.accounts.openForm('${a.id}')">Edit</button></td>
        </tr>`;
    }).join('') || `<tr><td colspan="10" class="text-center text-slate-400 py-12">No accounts match.</td></tr>`;
  },

  filter() {
    const q = document.getElementById('acct-search').value.toLowerCase();
    const list = DB.accounts().filter(a => {
      const blob = `${a.name} ${a.dba||''} ${a.contact||''} ${a.email||''} ${a.city||''} ${a.taxId||''}`;
      return blob.toLowerCase().includes(q);
    });
    document.getElementById('acct-tbody').innerHTML = this.rows(list);
  },

  // ---------- Renewal helpers ----------
  daysUntil(dateStr, interval) {
    if (!dateStr || !interval) return null;
    const next = new Date(dateStr); next.setDate(next.getDate() + interval);
    return Math.ceil((next - new Date()) / 86400000);
  },
  renewalBadge(a) {
    const r = a.renewals || {};
    const fin = this.daysUntil(r.financialsLast, r.financialsInterval);
    const wip = this.daysUntil(r.wipLast, r.wipInterval);
    const worst = [fin, wip].filter(v => v !== null).sort((x,y)=>x-y)[0];
    if (worst === undefined) return '<span class="text-xs text-slate-400">—</span>';
    if (worst < 0)  return `<span class="badge badge-rose">Overdue ${Math.abs(worst)}d</span>`;
    if (worst <= 30) return `<span class="badge badge-amber">Due in ${worst}d</span>`;
    return `<span class="badge badge-green">${worst}d</span>`;
  },

  // ---------- Detail (tabbed modal) ----------
  open(id, initialTab='overview') {
    const a = DB.findAccount(id);
    if (!a) return;
    this._currentId = id;
    this._tab = initialTab;
    this._renderDetail();
  },

  _renderDetail() {
    const id = this._currentId;
    const a  = DB.findAccount(id);
    const bonds = DB.bonds().filter(b => b.accountId === id);
    const docs  = DB.docs().filter(d => d.accountId === id);
    const emails= DB.emails().filter(e => e.accountId === id);
    const pipe  = DB.pipeline().filter(p => p.accountId === id);
    const bondIds = bonds.map(b => b.id);
    const uwFiles = DB.uw().filter(u => bondIds.includes(u.bondId));

    const wipRoll = WIP.rollup(id);
    const TABS = [
      ['overview',   'Overview',  ''],
      ['company',    'Company',   ''],
      ['contacts',   'Contacts',  (a.contacts?.length || 0)],
      ['indemnity',  'Indemnity', (a.indemnitors?.length || 0)],
      ['uw',         'Underwriting', uwFiles.length],
      ['bonds',      'Bonds',     bonds.length],
      ['wip',        'Work in Progress', wipRoll.tracked.length],
      ['pipeline',   'Pipeline / Bids', pipe.length],
      ['documents',  'Documents', docs.length],
      ['emails',     'Emails',    emails.length],
    ];
    const tab = this._tab;

    const headerHTML = `
      <div class="flex items-start justify-between -mt-2 mb-3">
        <div>
          <div class="flex items-center gap-2">
            <div class="text-lg font-semibold text-slate-900">${U.esc(a.name)}</div>
            <span class="badge badge-slate">${U.esc(a.type)}</span>
            ${this.renewalBadge(a)}
          </div>
          <div class="text-sm text-slate-500 mt-0.5">
            ${a.dba?`DBA ${U.esc(a.dba)} · `:''}${a.id} · ${U.esc(a.city||'')}, ${U.esc(a.state||'')}
          </div>
        </div>
        <div class="text-right text-xs text-slate-500 min-w-[180px]">
          <div>Aggregate Capacity</div>
          ${(() => {
            const cap = this.capacityFor(a.id);
            if (!cap.aggregate) return `<div class="text-sm text-slate-400">No aggregate set</div>`;
            return `
              <div class="text-sm font-semibold ${cap.tone.text}">${U.usd(cap.used)} <span class="text-slate-400">of</span> ${U.usd(cap.aggregate)}</div>
              <div class="progress mt-1"><div class="${cap.tone.bar}" style="width:${Math.min(100,cap.pct)}%"></div></div>
              <div class="text-[11px] text-slate-400 mt-0.5">${cap.pct}% used · ${U.usd(cap.remaining)} available</div>`;
          })()}
        </div>
      </div>
      <div class="border-b border-slate-200 -mx-6 px-6 flex flex-wrap gap-1">
        ${TABS.map(([key,label,count]) => `
          <button class="px-3 py-2 text-sm border-b-2 -mb-px transition
              ${tab===key
                ? 'border-brand-500 text-brand-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}"
              onclick="Views.accounts._setTab('${key}')">
            ${label}${count!==''?` <span class="ml-1 text-xs text-slate-400">${count}</span>`:''}
          </button>`).join('')}
      </div>
    `;

    const body = headerHTML + '<div class="pt-4">' + this._renderTab(tab, a, { bonds, docs, emails, pipe, uwFiles }) + '</div>';
    const footer = `
      <button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary" onclick="U.closeModals(); Views.accounts.openForm('${id}')">Edit Account</button>
      <button class="btn-secondary" onclick="Compose.open({ accountId: '${id}' })">✉ Email</button>
      <button class="btn-primary"   onclick="U.closeModals(); App.openNewBond('${id}')">New Bond</button>
    `;
    const m = U.modal({ title: 'Account', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _setTab(key) {
    this._tab = key;
    U.closeModals();
    this._renderDetail();
  },

  _renderTab(tab, a, ctx) {
    switch (tab) {
      case 'overview':  return this._tabOverview(a, ctx);
      case 'company':   return this._tabCompany(a);
      case 'contacts':  return this._tabContacts(a);
      case 'indemnity': return this._tabIndemnity(a);
      case 'uw':        return this._tabUW(a, ctx);
      case 'bonds':     return this._tabBonds(a, ctx);
      case 'wip':       return this._tabWip(a);
      case 'pipeline':  return this._tabPipeline(a, ctx);
      case 'documents': return this._tabDocuments(a, ctx);
      case 'emails':    return this._tabEmails(a, ctx);
      default: return '';
    }
  },

  // ---------- Tab: Overview ----------
  _tabOverview(a, { bonds, pipe, uwFiles }) {
    const activeBonds = bonds.filter(b => b.status === 'Active');
    const inForce = activeBonds.reduce((s,b)=>s+b.amount,0);
    const wipPipeline = pipe.filter(p => !['Won','Lost'].includes(p.stage)).reduce((s,p)=>s+p.amount,0);
    const c = a.company || {};
    const r = a.renewals || {};
    const cap = this.capacityFor(a.id);
    const primary = (a.contacts || []).find(x => x.primary) || {};
    return `
      <div class="grid grid-cols-4 gap-4 mb-5">
        <div class="stat-card !p-3"><div class="stat-label">Active Bonds</div><div class="stat-value text-lg">${activeBonds.length}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">In-Force</div><div class="stat-value text-lg">${U.usd(inForce)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Open Pipeline</div><div class="stat-value text-lg">${U.usd(wipPipeline)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">UW Files</div><div class="stat-value text-lg">${uwFiles.length}</div></div>
      </div>

      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">Aggregate Capacity</div>
          <span class="text-xs text-ink-300">Open exposure adjusted for WIP — backlog ÷ aggregate limit</span>
        </div>
        <div class="p-4 grid grid-cols-5 gap-4">
          <div>
            <div class="field-label">Used (Backlog)</div>
            <div class="text-lg font-semibold ${cap.tone.text}">${U.usd(cap.used)}</div>
            ${cap.credit ? `<div class="text-[11px] text-emerald-700 mt-0.5">−${U.usd(cap.credit)} WIP credit</div>` : ''}
          </div>
          <div>
            <div class="field-label">Open Bonds (Nominal)</div>
            <div class="text-lg font-semibold">${U.usd(cap.usedNominal)}</div>
          </div>
          <div>
            <div class="field-label">Aggregate Limit</div>
            <div class="text-lg font-semibold">${cap.aggregate ? U.usd(cap.aggregate) : '—'}</div>
          </div>
          <div>
            <div class="field-label">Available</div>
            <div class="text-lg font-semibold">${cap.aggregate ? U.usd(cap.remaining) : '—'}</div>
          </div>
          <div>
            <div class="field-label">Single Limit</div>
            <div class="text-lg font-semibold">${cap.single ? U.usd(cap.single) : '—'}</div>
            ${cap.overSingle.length ? `<div class="text-[11px] text-rose-700 mt-0.5">${cap.overSingle.length} bond${cap.overSingle.length===1?'':'s'} above single limit</div>` : ''}
          </div>
        </div>
        <div class="px-4 pb-4">
          ${cap.aggregate ? `
            <div class="progress mt-1"><div class="${cap.tone.bar}" style="width:${Math.min(100,cap.pct)}%"></div></div>
            <div class="flex items-center justify-between text-xs mt-1">
              <span class="${cap.tone.text} font-medium">${cap.pct}% used · ${cap.openCount} open bond${cap.openCount===1?'':'s'}</span>
              <span class="text-ink-300">${U.usd(cap.used)} of ${U.usd(cap.aggregate)}</span>
            </div>
          ` : `<div class="text-sm text-ink-300">No aggregate limit set on this account. Add it in the Company tab to track utilization.</div>`}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Primary Contact</div>
            <button class="btn-ghost" onclick="Views.accounts._setTab('contacts')">Manage →</button></div>
          <div class="p-4 text-sm space-y-1">
            <div class="text-base font-medium">${U.esc(primary.name || a.contact || '—')}</div>
            <div class="text-slate-500">${U.esc(primary.title || '')}</div>
            <div><a class="text-brand-600" href="mailto:${U.esc(primary.email||a.email||'')}">${U.esc(primary.email||a.email||'')}</a></div>
            <div>${U.esc(primary.phone||a.phone||'')}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Renewal Schedule</div>
            <button class="btn-ghost" onclick="Views.accounts._setTab('uw')">Workflow →</button></div>
          <div class="p-4 text-sm space-y-2">
            ${this._renewalRow('Financial statements', r.financialsLast, r.financialsInterval)}
            ${this._renewalRow('Work-in-Progress',     r.wipLast,         r.wipInterval)}
          </div>
        </div>
        <div class="card col-span-2">
          <div class="card-header"><div class="card-title">Company Snapshot</div>
            <button class="btn-ghost" onclick="Views.accounts._setTab('company')">Details →</button></div>
          <div class="p-4 grid grid-cols-4 gap-3 text-sm">
            <div><div class="field-label">Legal Name</div>${U.esc(c.legalName || a.name)}</div>
            <div><div class="field-label">Entity</div>${U.esc(c.entityType||'—')}</div>
            <div><div class="field-label">Founded</div>${U.esc(c.founded||'—')}</div>
            <div><div class="field-label">State of Formation</div>${U.esc(c.stateOfFormation||'—')}</div>
            <div><div class="field-label">Gross Revenue</div>${c.grossRevenue?U.usd(c.grossRevenue):'—'}</div>
            <div><div class="field-label">Employees</div>${c.employees||'—'}</div>
            <div><div class="field-label">Single Limit</div>${c.singleLimit?U.usd(c.singleLimit):'—'}</div>
            <div><div class="field-label">Aggregate Limit</div>${c.aggregateLimit?U.usd(c.aggregateLimit):'—'}</div>
            <div class="col-span-4"><div class="field-label">NAICS</div>${U.esc(c.naics||'—')}</div>
          </div>
        </div>
        <div class="card col-span-2">
          <div class="card-header"><div class="card-title">Notes</div></div>
          <div class="p-4 text-sm whitespace-pre-line">${U.esc(a.notes || '—')}</div>
        </div>
      </div>
    `;
  },

  _renewalRow(label, last, interval) {
    if (!interval) return `
      <div class="flex items-center justify-between">
        <div><div class="font-medium">${label}</div><div class="text-xs text-slate-400">No schedule</div></div>
        <span class="badge badge-slate">—</span>
      </div>`;
    const days = this.daysUntil(last, interval);
    const badge = days < 0 ? `<span class="badge badge-rose">Overdue ${Math.abs(days)}d</span>`
                : days <= 30 ? `<span class="badge badge-amber">Due in ${days}d</span>`
                : `<span class="badge badge-green">${days}d remaining</span>`;
    const nextDate = new Date(last); nextDate.setDate(nextDate.getDate()+interval);
    return `
      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium">${label}</div>
          <div class="text-xs text-slate-500">Last: ${U.date(last)} · Next: ${U.date(nextDate)}</div>
        </div>
        ${badge}
      </div>`;
  },

  // ---------- Tab: Company ----------
  _tabCompany(a) {
    const c = a.company || {};
    const cap = this.capacityFor(a.id);
    return `
      <div class="grid grid-cols-2 gap-6">
        <div class="card">
          <div class="card-header"><div class="card-title">Legal &amp; Formation</div></div>
          <div class="p-4 text-sm grid grid-cols-2 gap-3">
            <div><div class="field-label">Legal Name</div>${U.esc(c.legalName || a.name)}</div>
            <div><div class="field-label">DBA</div>${U.esc(a.dba||'—')}</div>
            <div><div class="field-label">Entity Type</div>${U.esc(c.entityType||'—')}</div>
            <div><div class="field-label">State of Formation</div>${U.esc(c.stateOfFormation||'—')}</div>
            <div><div class="field-label">Founded</div>${U.esc(c.founded||'—')}</div>
            <div><div class="field-label">Tax ID / EIN</div>${U.esc(a.taxId||'—')}</div>
            <div class="col-span-2"><div class="field-label">NAICS</div>${U.esc(c.naics||'—')}</div>
            <div class="col-span-2"><div class="field-label">Website</div>${c.website?`<a class="text-brand-600" href="${U.esc(c.website)}" target="_blank" rel="noopener">${U.esc(c.website)}</a>`:'—'}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Address &amp; Reach</div></div>
          <div class="p-4 text-sm grid grid-cols-2 gap-3">
            <div class="col-span-2"><div class="field-label">Street</div>${U.esc(a.address||'—')}</div>
            <div><div class="field-label">City</div>${U.esc(a.city||'—')}</div>
            <div><div class="field-label">State / ZIP</div>${U.esc(a.state||'—')} ${U.esc(a.zip||'')}</div>
            <div><div class="field-label">Phone</div>${U.esc(a.phone||'—')}</div>
            <div><div class="field-label">Email</div>${U.esc(a.email||'—')}</div>
          </div>
        </div>
        <div class="card col-span-2">
          <div class="card-header">
            <div class="card-title">Financial Profile &amp; Bonding Capacity</div>
            <span class="badge ${cap.tone.badge}">${cap.aggregate ? cap.pct + '% used' : 'No aggregate set'}</span>
          </div>
          <div class="p-4 grid grid-cols-4 gap-3 text-sm">
            <div><div class="field-label">Gross Revenue</div>${c.grossRevenue?U.usd(c.grossRevenue):'—'}</div>
            <div><div class="field-label">Employees</div>${c.employees||'—'}</div>
            <div><div class="field-label">Credit Score</div>${a.credit||'—'}</div>
            <div><div class="field-label">Open Bonds</div>${cap.openCount}</div>

            <div><div class="field-label">Single Bond Limit</div><span class="text-base font-semibold">${cap.single?U.usd(cap.single):'—'}</span></div>
            <div><div class="field-label">Aggregate Limit</div><span class="text-base font-semibold">${cap.aggregate?U.usd(cap.aggregate):'—'}</span></div>
            <div><div class="field-label">Used (Open Exposure)</div><span class="text-base font-semibold ${cap.tone.text}">${U.usd(cap.used)}</span></div>
            <div><div class="field-label">Available</div><span class="text-base font-semibold">${cap.aggregate?U.usd(cap.remaining):'—'}</span></div>
          </div>
          ${cap.aggregate ? `
            <div class="px-4 pb-4">
              <div class="progress"><div class="${cap.tone.bar}" style="width:${Math.min(100,cap.pct)}%"></div></div>
              <div class="text-[11px] text-ink-300 mt-1">${U.usd(cap.used)} of ${U.usd(cap.aggregate)} aggregate · ${cap.openCount} open bond${cap.openCount===1?'':'s'} (Active + Pending UW)</div>
              ${cap.overSingle.length ? `<div class="text-xs text-rose-700 mt-1">⚠ ${cap.overSingle.length} bond${cap.overSingle.length===1?'':'s'} above the single bond limit (${U.usd(cap.single)}): ${cap.overSingle.map(b => b.number).join(', ')}</div>` : ''}
            </div>` : `
            <div class="px-4 pb-4 text-xs text-ink-300">Set the Aggregate Limit (Edit Account) to start tracking utilization.</div>`}
        </div>
      </div>
    `;
  },

  // ---------- Tab: Contacts ----------
  _tabContacts(a) {
    const list = a.contacts || [];
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-slate-500">All contacts for ${U.esc(a.name)}.</div>
        <button class="btn-primary" onclick="Views.accounts.editContact('${a.id}')">+ Add Contact</button>
      </div>
      <div class="card">
        <table class="tbl">
          <thead><tr><th>Name</th><th>Title</th><th>Email</th><th>Phone</th><th>Primary</th><th></th></tr></thead>
          <tbody>
            ${list.length ? list.map(c => `
              <tr>
                <td class="font-medium">${U.esc(c.name)}</td>
                <td>${U.esc(c.title||'')}</td>
                <td><a class="text-brand-600" href="mailto:${U.esc(c.email||'')}">${U.esc(c.email||'')}</a></td>
                <td>${U.esc(c.phone||'')}</td>
                <td>${c.primary ? '<span class="badge badge-green">Primary</span>' : `<button class="btn-ghost text-xs" onclick="Views.accounts.makePrimaryContact('${a.id}','${c.id}')">Make primary</button>`}</td>
                <td class="text-right whitespace-nowrap">
                  <button class="btn-ghost" onclick="Compose.open({ accountId: '${a.id}', to: '${U.esc(c.email||'')}' })">✉ Email</button>
                  <button class="btn-ghost" onclick="Views.accounts.editContact('${a.id}','${c.id}')">Edit</button>
                  <button class="btn-ghost text-rose-600" onclick="Views.accounts.deleteContact('${a.id}','${c.id}')">Delete</button>
                </td>
              </tr>`).join('') : '<tr><td colspan="6" class="text-center text-slate-400 py-8">No contacts.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  editContact(accountId, contactId) {
    const a = DB.findAccount(accountId);
    const c = contactId ? (a.contacts || []).find(x => x.id === contactId) : { id: U.uid('C'), primary: false };
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Name</div><input id="cf-name" class="field-input" value="${U.esc(c.name||'')}"></div>
        <div><div class="field-label">Title</div><input id="cf-title" class="field-input" value="${U.esc(c.title||'')}"></div>
        <div><div class="field-label">Email</div><input id="cf-email" class="field-input" value="${U.esc(c.email||'')}"></div>
        <div><div class="field-label">Phone</div><input id="cf-phone" class="field-input" value="${U.esc(c.phone||'')}"></div>
        <div class="col-span-2"><label class="text-sm flex items-center gap-2"><input id="cf-primary" type="checkbox" class="chk" ${c.primary?'checked':''}>Primary contact</label></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.accounts.saveContact('${accountId}','${c.id}')">Save</button>`;
    const m = U.modal({ title: contactId ? 'Edit Contact' : 'New Contact', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  saveContact(accountId, contactId) {
    const a = DB.findAccount(accountId);
    a.contacts = a.contacts || [];
    let c = a.contacts.find(x => x.id === contactId);
    const isNew = !c;
    if (isNew) { c = { id: contactId }; a.contacts.push(c); }
    c.name  = document.getElementById('cf-name').value;
    c.title = document.getElementById('cf-title').value;
    c.email = document.getElementById('cf-email').value;
    c.phone = document.getElementById('cf-phone').value;
    c.primary = document.getElementById('cf-primary').checked;
    if (c.primary) { a.contacts.forEach(x => { if (x !== c) x.primary = false; }); }
    DB.save();
    U.closeModals();
    U.toast(isNew ? 'Contact added' : 'Contact updated');
    this._tab = 'contacts'; this._renderDetail();
  },

  makePrimaryContact(accountId, contactId) {
    const a = DB.findAccount(accountId);
    (a.contacts||[]).forEach(c => c.primary = c.id === contactId);
    DB.save();
    U.toast('Primary contact updated');
    this._renderDetail();
  },

  deleteContact(accountId, contactId) {
    const a = DB.findAccount(accountId);
    a.contacts = (a.contacts || []).filter(c => c.id !== contactId);
    DB.save();
    U.toast('Contact removed', 'info');
    U.closeModals(); this._renderDetail();
  },

  // ---------- Tab: Indemnity ----------
  _tabIndemnity(a) {
    const list = a.indemnitors || [];
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-slate-500">General Indemnity Agreement (GIA) signers.</div>
        <button class="btn-primary" onclick="Views.accounts.editIndemnitor('${a.id}')">+ Add Indemnitor</button>
      </div>
      <div class="card">
        <table class="tbl">
          <thead><tr><th>Indemnitor</th><th>Type</th><th>SSN / EIN</th><th class="text-right">Net Worth</th><th class="text-right">Liquid</th><th>PFS Date</th><th></th></tr></thead>
          <tbody>
            ${list.length ? list.map(i => `
              <tr>
                <td>
                  <div class="font-medium">${U.esc(i.name)}</div>
                  ${i.spouse?`<div class="text-xs text-slate-500">Spouse: ${U.esc(i.spouse)}</div>`:''}
                </td>
                <td><span class="badge ${i.type==='Personal'?'badge-blue':'badge-violet'}">${U.esc(i.type)}</span></td>
                <td class="font-mono text-xs">${U.esc(i.ssnEin||'')}</td>
                <td class="text-right">${i.netWorth?U.usd(i.netWorth):'—'}</td>
                <td class="text-right">${i.liquid?U.usd(i.liquid):'—'}</td>
                <td>${U.date(i.pfsDate)}</td>
                <td class="text-right">
                  <button class="btn-ghost" onclick="Views.accounts.editIndemnitor('${a.id}','${i.id}')">Edit</button>
                  <button class="btn-ghost text-rose-600" onclick="Views.accounts.deleteIndemnitor('${a.id}','${i.id}')">Delete</button>
                </td>
              </tr>`).join('') : '<tr><td colspan="7" class="text-center text-slate-400 py-8">No indemnitors recorded.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  editIndemnitor(accountId, id) {
    const a = DB.findAccount(accountId);
    const i = id ? (a.indemnitors||[]).find(x => x.id === id) : { id: U.uid('I'), type: 'Personal' };
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Indemnitor Name</div><input id="ix-name" class="field-input" value="${U.esc(i.name||'')}"></div>
        <div><div class="field-label">Type</div>
          <select id="ix-type" class="field-select"><option ${i.type==='Personal'?'selected':''}>Personal</option><option ${i.type==='Corporate'?'selected':''}>Corporate</option></select></div>
        <div><div class="field-label">SSN / EIN</div><input id="ix-id" class="field-input" value="${U.esc(i.ssnEin||'')}"></div>
        <div><div class="field-label">Spouse</div><input id="ix-spouse" class="field-input" value="${U.esc(i.spouse||'')}"></div>
        <div><div class="field-label">PFS Date</div><input id="ix-pfs" type="date" class="field-input" value="${U.esc(i.pfsDate||'')}"></div>
        <div><div class="field-label">Net Worth</div><input id="ix-nw" type="number" class="field-input" value="${i.netWorth||0}"></div>
        <div><div class="field-label">Liquid Assets</div><input id="ix-liq" type="number" class="field-input" value="${i.liquid||0}"></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.accounts.saveIndemnitor('${accountId}','${i.id}')">Save</button>`;
    const m = U.modal({ title: id ? 'Edit Indemnitor' : 'New Indemnitor', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  saveIndemnitor(accountId, id) {
    const a = DB.findAccount(accountId);
    a.indemnitors = a.indemnitors || [];
    let i = a.indemnitors.find(x => x.id === id);
    const isNew = !i;
    if (isNew) { i = { id }; a.indemnitors.push(i); }
    i.name = document.getElementById('ix-name').value;
    i.type = document.getElementById('ix-type').value;
    i.ssnEin = document.getElementById('ix-id').value;
    i.spouse = document.getElementById('ix-spouse').value;
    i.pfsDate = document.getElementById('ix-pfs').value;
    i.netWorth = +document.getElementById('ix-nw').value || 0;
    i.liquid = +document.getElementById('ix-liq').value || 0;
    DB.save();
    U.closeModals();
    U.toast(isNew ? 'Indemnitor added' : 'Indemnitor updated');
    this._tab = 'indemnity'; this._renderDetail();
  },

  deleteIndemnitor(accountId, id) {
    const a = DB.findAccount(accountId);
    a.indemnitors = (a.indemnitors||[]).filter(x => x.id !== id);
    DB.save();
    U.toast('Indemnitor removed', 'info');
    U.closeModals(); this._renderDetail();
  },

  // ---------- Tab: Underwriting ----------
  UW_STEPS: ['Intake','Document Collection','Surety Submission','Decision','Issuance'],

  _tabUW(a, { uwFiles }) {
    const r = a.renewals || {};
    return `
      <div class="card mb-4">
        <div class="card-header"><div class="card-title">Renewal Triggers</div>
          <button class="btn-ghost" onclick="Views.accounts.editRenewals('${a.id}')">Edit</button>
        </div>
        <div class="p-4 grid grid-cols-2 gap-4 text-sm">
          ${this._renewalRow('Financial statements update', r.financialsLast, r.financialsInterval)}
          ${this._renewalRow('Work-in-Progress (WIP) update', r.wipLast, r.wipInterval)}
        </div>
      </div>

      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-slate-500">Bond underwriting workflows for this account.</div>
        <button class="btn-primary" onclick="Views.accounts.startUW('${a.id}')">+ Start UW File</button>
      </div>

      ${uwFiles.length ? uwFiles.map(uw => this._uwCard(a.id, uw)).join('')
        : '<div class="card p-8 text-center text-slate-400 text-sm">No active underwriting files for this account.</div>'}
    `;
  },

  _uwCard(accountId, uw) {
    const b = DB.findBond(uw.bondId) || {};
    const p = DB.findPartner(uw.partnerId) || {};
    const done = uw.requirements.filter(r => r.status === 'received').length;
    const total = uw.requirements.length;
    const pct = Math.round(done/total*100);
    const stepsHTML = this.UW_STEPS.map((s, i) => {
      const state = i < uw.step ? 'done' : i === uw.step ? 'current' : 'todo';
      const dot = state === 'done' ? 'bg-emerald-500' : state === 'current' ? 'bg-brand-500 ring-4 ring-brand-100' : 'bg-slate-300';
      const txt = state === 'todo' ? 'text-slate-400' : 'text-slate-700';
      return `
        <div class="flex-1 flex items-center">
          <div class="flex flex-col items-center">
            <div class="w-3 h-3 rounded-full ${dot}"></div>
            <div class="text-[11px] ${txt} mt-2 text-center px-1">${s}</div>
          </div>
          ${i < this.UW_STEPS.length-1 ? `<div class="flex-1 h-0.5 ${i<uw.step?'bg-emerald-400':'bg-slate-200'} mt-[-22px]"></div>`:''}
        </div>`;
    }).join('');

    return `
      <div class="card mb-3">
        <div class="p-4">
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="text-sm font-semibold">${b.number||''} · ${U.esc(b.type||'')}</div>
              <div class="text-xs text-slate-500">${U.esc(b.obligee||'')} · ${U.usd(b.amount)} · Surety: ${U.esc(p.name||'')}</div>
              <div class="text-xs text-slate-500">Assigned: ${U.esc(uw.assignedTo||'')}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-500">Requirements</div>
              <div class="text-sm font-semibold">${done}/${total}</div>
              <div class="progress mt-1 w-28"><div style="width:${pct}%"></div></div>
            </div>
          </div>
          <div class="flex items-center gap-1 mb-3 px-2">${stepsHTML}</div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase mb-1">Checklist</div>
              ${uw.requirements.map((r,i)=>`
                <label class="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" class="chk" ${r.status==='received'?'checked':''} onchange="Views.accounts.toggleUW('${accountId}','${uw.id}',${i})">
                  <span class="text-sm ${r.status==='received'?'line-through text-slate-400':''}">${U.esc(r.name)}</span>
                </label>`).join('')}
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</div>
              <textarea class="field-textarea text-sm" rows="3" oninput="Views.accounts.uwNotes('${uw.id}', this.value)">${U.esc(uw.notes||'')}</textarea>
              <div class="flex items-center gap-2 mt-2">
                <button class="btn-secondary" onclick="Views.accounts.uwAdvance('${accountId}','${uw.id}',-1)">← Back</button>
                <button class="btn-primary"   onclick="Views.accounts.uwAdvance('${accountId}','${uw.id}', 1)">Next Step →</button>
                <button class="btn-ghost"     onclick="Views.accounts.uwSubmit('${uw.id}')">Submit to Surety</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  editRenewals(accountId) {
    const a = DB.findAccount(accountId);
    const r = a.renewals = a.renewals || {};
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Last Financial Statements</div><input id="rn-fin" type="date" class="field-input" value="${U.esc(r.financialsLast||'')}"></div>
        <div><div class="field-label">Financials Renewal Interval (days)</div><input id="rn-fin-int" type="number" class="field-input" value="${r.financialsInterval||365}"></div>
        <div><div class="field-label">Last WIP Update</div><input id="rn-wip" type="date" class="field-input" value="${U.esc(r.wipLast||'')}"></div>
        <div><div class="field-label">WIP Renewal Interval (days)</div><input id="rn-wip-int" type="number" class="field-input" value="${r.wipInterval||90}"></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.accounts.saveRenewals('${accountId}')">Save</button>`;
    const m = U.modal({ title: 'Renewal Triggers', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  saveRenewals(accountId) {
    const a = DB.findAccount(accountId);
    a.renewals = {
      financialsLast: document.getElementById('rn-fin').value || null,
      financialsInterval: +document.getElementById('rn-fin-int').value || 0,
      wipLast: document.getElementById('rn-wip').value || null,
      wipInterval: +document.getElementById('rn-wip-int').value || 0,
    };
    DB.save();
    U.closeModals();
    U.toast('Renewal schedule updated');
    this._tab = 'uw'; this._renderDetail();
  },

  startUW(accountId) {
    const bonds = DB.bonds().filter(b => b.accountId === accountId && !DB.uw().some(u => u.bondId === b.id));
    if (!bonds.length) { U.toast('No bonds without an UW file', 'info'); return; }
    const body = `
      <div><div class="field-label">Choose bond to underwrite</div>
        <select id="uw-bond" class="field-select">
          ${bonds.map(b => `<option value="${b.id}">${b.number} — ${U.esc(b.type)} (${U.usd(b.amount)})</option>`).join('')}
        </select></div>
      <div class="mt-3"><div class="field-label">Assigned to</div><input id="uw-asg" class="field-input" value="Casey V."></div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.accounts.createUW('${accountId}')">Start</button>`;
    const m = U.modal({ title: 'New Underwriting File', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  createUW(accountId) {
    const bondId = document.getElementById('uw-bond').value;
    const b = DB.findBond(bondId);
    DB.uw().push({
      id: U.uid('UW'),
      bondId, step: 0,
      partnerId: b.partnerId,
      assignedTo: document.getElementById('uw-asg').value,
      notes: '',
      requirements: [
        { name: 'Financial statements (CPA)', status: 'pending' },
        { name: 'Personal financial statements', status: 'pending' },
        { name: 'Work-in-progress schedule', status: 'pending' },
        { name: 'Indemnity agreement (GIA)', status: 'pending' },
        { name: 'Bank line confirmation', status: 'pending' },
      ],
    });
    DB.save();
    U.closeModals();
    U.toast('Underwriting file started');
    this._tab = 'uw'; this._renderDetail();
  },

  toggleUW(accountId, uwId, idx) {
    const uw = DB.uw().find(u => u.id === uwId);
    const r  = uw.requirements[idx];
    r.status = r.status === 'received' ? 'pending' : 'received';
    DB.save();
    this._tab = 'uw'; this._renderDetail();
  },
  uwNotes(uwId, val) {
    const uw = DB.uw().find(u => u.id === uwId);
    uw.notes = val; DB.save();
  },
  uwAdvance(accountId, uwId, delta) {
    const STEPS = this.UW_STEPS;
    const uw = DB.uw().find(u => u.id === uwId);
    uw.step = Math.max(0, Math.min(STEPS.length-1, uw.step + delta));
    if (uw.step === STEPS.length - 1) {
      const b = DB.findBond(uw.bondId); if (b) b.status = 'Active';
    }
    DB.save();
    U.toast(`Moved to: ${STEPS[uw.step]}`);
    this._tab = 'uw'; this._renderDetail();
  },
  uwSubmit(uwId) {
    const uw = DB.uw().find(u => u.id === uwId);
    const p  = DB.findPartner(uw.partnerId) || {};
    U.toast(`Submission package sent to ${p.name || 'surety'}`);
    if (uw.step < 2) { uw.step = 2; DB.save(); this._renderDetail(); }
  },

  // ---------- Tab: Bonds ----------
  _tabBonds(a, { bonds }) {
    const groups = {
      'Active':  bonds.filter(b => b.status === 'Active'),
      'Pending UW': bonds.filter(b => b.status === 'Pending UW'),
      'Expired': bonds.filter(b => b.status === 'Expired'),
      'Cancelled': bonds.filter(b => b.status === 'Cancelled'),
    };
    const groupHTML = (label, list, klass) => list.length ? `
      <div class="card mb-3">
        <div class="card-header"><div class="card-title">${label} (${list.length})</div>
          <button class="btn-ghost" onclick="App.go('bonds')">Bond Portfolio →</button></div>
        <table class="tbl">
          <thead><tr><th>Bond #</th><th>Type</th><th>Obligee</th><th>Project</th><th class="text-right">Amount</th><th class="text-right">Premium</th><th>Effective</th><th>Expires</th><th></th></tr></thead>
          <tbody>
            ${list.map(b => `
              <tr class="cursor-pointer" onclick="U.closeModals(); Views.bonds.open('${b.id}')">
                <td class="font-medium text-brand-700">${b.number}</td>
                <td><span class="badge ${klass}">${U.esc(b.type)}</span></td>
                <td class="max-w-[14rem] truncate">${U.esc(b.obligee||'')}</td>
                <td class="max-w-[14rem] truncate">${U.esc(b.project||'')}</td>
                <td class="text-right">${U.usd(b.amount)}</td>
                <td class="text-right">${U.usd(b.premium)}</td>
                <td>${U.date(b.effective)}</td>
                <td>${U.date(b.expires)}</td>
                <td class="text-right"><button class="btn-ghost" onclick="event.stopPropagation(); Views.bonds.exportOne('${b.id}')">PDF</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '';

    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-slate-500">Bid bonds and issued (approved) bonds appear in their own groups.</div>
        <button class="btn-primary" onclick="U.closeModals(); App.openNewBond('${a.id}')">+ New Bond</button>
      </div>
      ${groupHTML('Active / Approved', groups['Active'], 'badge-green')}
      ${groupHTML('Pending Underwriting', groups['Pending UW'], 'badge-amber')}
      ${groupHTML('Expired', groups['Expired'], 'badge-slate')}
      ${groupHTML('Cancelled', groups['Cancelled'], 'badge-rose')}
      ${bonds.length ? '' : '<div class="card p-8 text-center text-slate-400 text-sm">No bonds yet for this account.</div>'}
    `;
  },

  // ---------- Tab: Work in Progress ----------
  _tabWip(a) {
    const roll = WIP.rollup(a.id);
    const tracked = roll.tracked;
    const untracked = roll.untrackedContract;

    const summary = `
      <div class="grid grid-cols-5 gap-4 mb-4">
        <div class="stat-card !p-3"><div class="stat-label">Tracked Jobs</div><div class="stat-value text-lg">${tracked.length}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Avg % Complete</div><div class="stat-value text-lg">${roll.avgPct == null ? '—' : roll.avgPct + '%'}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Total Contract Value</div><div class="stat-value text-lg">${U.usd(roll.totalContract)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Backlog (Uncompleted)</div><div class="stat-value text-lg">${U.usd(roll.totalBacklog)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Over / Under Billing</div><div class="stat-value text-lg ${roll.overUnderTot >= 0 ? 'text-emerald-700' : 'text-amber-700'}">${roll.overUnderTot >= 0 ? '+' : ''}${U.usd(roll.overUnderTot)}</div></div>
      </div>`;

    const rows = tracked.map(b => {
      const pct = WIP.percent(b);
      const t = WIP.tone(pct);
      const ou = WIP.overUnder(b);
      const e  = WIP.earned(b);
      return `
        <tr class="cursor-pointer" onclick="U.closeModals(); Views.bonds.open('${b.id}')">
          <td class="font-medium text-brand-700">${b.number}</td>
          <td class="max-w-[18rem] truncate">${U.esc(b.project||'')}</td>
          <td>${U.esc(b.obligee||'')}</td>
          <td class="text-right">${U.usd(b.wip.contractAmount || b.amount)}</td>
          <td>
            <div class="flex items-center justify-between text-xs"><span class="${t.text} font-medium">${pct}%</span></div>
            <div class="progress mt-1"><div class="${t.bar}" style="width:${pct}%"></div></div>
          </td>
          <td class="text-right">${U.usd((b.wip.costToDate||0) + (b.wip.estCostToComplete||0))}</td>
          <td class="text-right">${U.usd(b.wip.costToDate||0)}</td>
          <td class="text-right">${U.usd(e||0)}</td>
          <td class="text-right">${U.usd(b.wip.billedToDate||0)}</td>
          <td class="text-right ${ou >= 0 ? 'text-emerald-700' : 'text-amber-700'}">${ou >= 0 ? '+' : ''}${U.usd(ou)}</td>
          <td class="text-right">${U.usd(WIP.backlog(b))}</td>
          <td class="text-right text-xs text-ink-300">${U.date(b.wip.asOfDate)}</td>
          <td class="text-right"><button class="btn-ghost" onclick="event.stopPropagation(); Views.accounts.editWip('${a.id}','${b.id}')">Update</button></td>
        </tr>`;
    }).join('');

    const totalsRow = tracked.length ? `
      <tr class="font-semibold bg-cream-50">
        <td colspan="3" class="text-right">Totals</td>
        <td class="text-right">${U.usd(roll.totalContract)}</td>
        <td></td>
        <td class="text-right">${U.usd(roll.totalCost + roll.totalETC)}</td>
        <td class="text-right">${U.usd(roll.totalCost)}</td>
        <td class="text-right">${U.usd(roll.totalEarned)}</td>
        <td class="text-right">${U.usd(roll.totalBilled)}</td>
        <td class="text-right ${roll.overUnderTot >= 0 ? 'text-emerald-700' : 'text-amber-700'}">${roll.overUnderTot >= 0 ? '+' : ''}${U.usd(roll.overUnderTot)}</td>
        <td class="text-right">${U.usd(roll.totalBacklog)}</td>
        <td colspan="2"></td>
      </tr>` : '';

    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-300">Job-by-job WIP for this account. % complete drives the WIP-adjusted aggregate capacity number.</div>
        ${untracked.length ? `<button class="btn-secondary" onclick="Views.accounts.editWip('${a.id}','${untracked[0].id}')">+ Add WIP for ${untracked[0].number}</button>` : ''}
      </div>

      ${tracked.length ? summary : ''}

      <div class="card overflow-hidden">
        <table class="tbl">
          <thead><tr>
            <th>Bond</th><th>Project</th><th>Obligee</th>
            <th class="text-right">Contract</th>
            <th>% Complete</th>
            <th class="text-right">Total Est. Cost</th>
            <th class="text-right">Cost to Date</th>
            <th class="text-right">Earned</th>
            <th class="text-right">Billed</th>
            <th class="text-right">Over / Under</th>
            <th class="text-right">Backlog</th>
            <th class="text-right">As of</th>
            <th></th>
          </tr></thead>
          <tbody>
            ${tracked.length ? rows + totalsRow : '<tr><td colspan="13" class="text-center text-ink-300 py-8">No WIP records yet for this account.</td></tr>'}
          </tbody>
        </table>
      </div>

      ${untracked.length ? `
        <div class="card mt-4">
          <div class="card-header"><div class="card-title">Contract Bonds Without WIP (${untracked.length})</div></div>
          <div class="p-3">
            ${untracked.map(b => `
              <div class="flex items-center justify-between p-2 hover:bg-cream-50 rounded">
                <div>
                  <div class="text-sm font-medium">${b.number} — ${U.esc(b.type)}</div>
                  <div class="text-xs text-ink-300">${U.esc(b.obligee||'')} · ${U.usd(b.amount)}</div>
                </div>
                <button class="btn-secondary" onclick="Views.accounts.editWip('${a.id}','${b.id}')">Add WIP</button>
              </div>`).join('')}
          </div>
        </div>` : ''}
    `;
  },

  // ---------- WIP edit modal (reusable from accounts AND bonds detail) ----------
  editWip(accountId, bondId) {
    const b = DB.findBond(bondId);
    if (!b) return;
    const w = b.wip || { contractAmount: b.amount, percentComplete: 0, costToDate: 0, estCostToComplete: 0, billedToDate: 0, estProfitPercent: 0, asOfDate: new Date().toISOString().slice(0,10), notes: '', history: [] };
    const body = `
      <div class="text-sm text-ink-400 mb-3"><b>${b.number}</b> · ${U.esc(b.type)} · ${U.esc(b.obligee||'')}</div>
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Contract Amount</div>
          <input id="w-contract" type="number" class="field-input" value="${w.contractAmount||b.amount||0}"></div>
        <div><div class="field-label">As-of Date</div>
          <input id="w-asof" type="date" class="field-input" value="${U.esc(w.asOfDate||'')}"></div>
        <div class="col-span-2">
          <div class="flex items-center justify-between">
            <div class="field-label">% Complete</div>
            <span id="w-pct-val" class="text-sm font-semibold">${w.percentComplete||0}%</span>
          </div>
          <input id="w-pct" type="range" min="0" max="100" step="1" class="w-full" value="${w.percentComplete||0}"
            oninput="document.getElementById('w-pct-val').textContent=this.value+'%'; Views.accounts._wipRecalc()">
        </div>
        <div><div class="field-label">Cost to Date</div>
          <input id="w-cost" type="number" class="field-input" value="${w.costToDate||0}" oninput="Views.accounts._wipRecalc()"></div>
        <div><div class="field-label">Est. Cost to Complete</div>
          <input id="w-etc" type="number" class="field-input" value="${w.estCostToComplete||0}" oninput="Views.accounts._wipRecalc()"></div>
        <div><div class="field-label">Billed to Date</div>
          <input id="w-billed" type="number" class="field-input" value="${w.billedToDate||0}" oninput="Views.accounts._wipRecalc()"></div>
        <div><div class="field-label">Est. Profit %</div>
          <input id="w-profit" type="number" step="0.5" class="field-input" value="${w.estProfitPercent||0}"></div>
        <div class="col-span-2"><div class="field-label">Notes for this update</div>
          <textarea id="w-note" class="field-textarea" rows="2" placeholder="Milestones reached, surprises, schedule notes…"></textarea></div>
      </div>

      <div class="divider"></div>
      <div class="bg-cream-50 rounded-lg p-3 grid grid-cols-3 gap-3 text-sm">
        <div><div class="field-label">Earned Revenue</div><span id="w-earned" class="font-semibold">$0</span></div>
        <div><div class="field-label">Over / Under Billing</div><span id="w-ou" class="font-semibold">$0</span></div>
        <div><div class="field-label">Backlog (Uncompleted)</div><span id="w-backlog" class="font-semibold">$0</span></div>
      </div>

      ${(w.history || []).length ? `
        <div class="divider"></div>
        <div class="text-xs font-semibold text-ink-400 uppercase mb-2">Update History (${w.history.length})</div>
        <div class="max-h-40 overflow-y-auto text-sm space-y-1">
          ${w.history.slice().reverse().map(h => `
            <div class="border-l-2 border-cream-300 pl-3 py-1">
              <div class="text-xs text-ink-300">${U.date(h.date)} · ${h.percent}% · cost ${U.usd(h.costToDate)} · billed ${U.usd(h.billedToDate)}</div>
              ${h.note?`<div class="text-sm">${U.esc(h.note)}</div>`:''}
            </div>`).join('')}
        </div>` : ''}
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.accounts._saveWip('${accountId||''}','${bondId}')">Save Update</button>`;
    const m = U.modal({ title: 'Update Work in Progress', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    setTimeout(() => this._wipRecalc(), 0);
  },

  _wipRecalc() {
    const contract = +document.getElementById('w-contract').value || 0;
    const pct      = +document.getElementById('w-pct').value || 0;
    const billed   = +document.getElementById('w-billed').value || 0;
    const earned   = Math.round(contract * pct / 100);
    const ou       = billed - earned;
    const backlog  = Math.round(contract * (100 - pct) / 100);
    document.getElementById('w-earned').textContent  = U.usd(earned);
    const ouEl = document.getElementById('w-ou');
    ouEl.textContent = (ou >= 0 ? '+' : '') + U.usd(ou);
    ouEl.className = 'font-semibold ' + (ou >= 0 ? 'text-emerald-700' : 'text-amber-700');
    document.getElementById('w-backlog').textContent = U.usd(backlog);
  },

  _saveWip(accountId, bondId) {
    const b = DB.findBond(bondId); if (!b) return;
    b.wip = b.wip || { history: [] };
    b.wip.contractAmount    = +document.getElementById('w-contract').value || 0;
    b.wip.percentComplete   = Math.max(0, Math.min(100, +document.getElementById('w-pct').value || 0));
    b.wip.costToDate        = +document.getElementById('w-cost').value || 0;
    b.wip.estCostToComplete = +document.getElementById('w-etc').value || 0;
    b.wip.billedToDate      = +document.getElementById('w-billed').value || 0;
    b.wip.estProfitPercent  = +document.getElementById('w-profit').value || 0;
    b.wip.asOfDate          = document.getElementById('w-asof').value || new Date().toISOString().slice(0,10);
    const note              = document.getElementById('w-note').value.trim();
    b.wip.history = b.wip.history || [];
    b.wip.history.push({
      date: b.wip.asOfDate,
      percent: b.wip.percentComplete,
      costToDate: b.wip.costToDate,
      billedToDate: b.wip.billedToDate,
      note,
    });
    DB.save();
    U.closeModals();
    U.toast('WIP updated');
    if (accountId) { this._tab = 'wip'; this._currentId = accountId; this._renderDetail(); }
    else if (Views.bonds && document.getElementById('view')) { Views.bonds.open(bondId); }
  },

  // ---------- Tab: Pipeline ----------
  _tabPipeline(a, { pipe }) {
    const isClosed = (p) => p.bidResult && p.bidResult !== 'pending';
    const open   = pipe.filter(p => !isClosed(p));
    const closed = pipe.filter(p =>  isClosed(p));
    const row = (p) => {
      const meta = Views.pipeline.resultMeta(p.bidResult || 'pending');
      const resultBadge = meta && p.bidResult && p.bidResult !== 'pending'
        ? `<span class="badge ${meta.badge}">${U.esc(meta.label)}</span>`
        : '<span class="text-xs text-slate-400">—</span>';
      const actCount = (p.activity || []).length;
      return `
      <tr class="cursor-pointer" onclick="U.closeModals(); App.go('pipeline'); setTimeout(()=>Views.pipeline.open('${p.id}'), 50);">
        <td><span class="badge badge-slate">${U.esc(p.stage)}</span></td>
        <td>${U.esc(p.bondType)}</td>
        <td class="max-w-[14rem] truncate">${U.esc(p.obligee||'')}</td>
        <td class="text-right">${U.usd(p.amount)}</td>
        <td>${U.date(p.dueDate)}</td>
        <td class="text-right">${p.probability}%</td>
        <td>${resultBadge}</td>
        <td class="text-right text-xs text-slate-500">${actCount?`📎 ${actCount}`:''}</td>
      </tr>`;
    };
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-slate-500">Bids awaiting results and other open opportunities — click any row to jump to Pipeline.</div>
        <button class="btn-primary" onclick="U.closeModals(); App.go('pipeline'); setTimeout(()=>Views.pipeline.addModal(), 50);">+ New Opportunity</button>
      </div>
      <div class="card mb-3">
        <div class="card-header"><div class="card-title">Open Opportunities (${open.length})</div>
          <button class="btn-ghost" onclick="U.closeModals(); App.go('pipeline')">Full Pipeline →</button></div>
        <table class="tbl">
          <thead><tr><th>Stage</th><th>Bond Type</th><th>Obligee</th><th class="text-right">Amount</th><th>Due</th><th class="text-right">Prob.</th><th>Bid Result</th><th class="text-right">Activity</th></tr></thead>
          <tbody>${open.length?open.map(row).join(''):'<tr><td colspan="8" class="text-center text-slate-400 py-6">No open opportunities.</td></tr>'}</tbody>
        </table>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Closed (${closed.length})</div></div>
        <table class="tbl">
          <thead><tr><th>Stage</th><th>Bond Type</th><th>Obligee</th><th class="text-right">Amount</th><th>Due</th><th class="text-right">Prob.</th><th>Bid Result</th><th class="text-right">Activity</th></tr></thead>
          <tbody>${closed.length?closed.map(row).join(''):'<tr><td colspan="8" class="text-center text-slate-400 py-6">Nothing closed yet.</td></tr>'}</tbody>
        </table>
      </div>
    `;
  },

  // ---------- Tab: Documents ----------
  _tabDocuments(a, { docs }) {
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-slate-500">Financials, WIPs, GIAs and other docs attached to this account.</div>
        <button class="btn-primary" onclick="U.closeModals(); App.go('documents')">Open Document Center →</button>
      </div>
      <div class="card">
        <table class="tbl">
          <thead><tr><th>File</th><th>Category</th><th>Bond</th><th>Size</th><th>Uploaded</th></tr></thead>
          <tbody>
            ${docs.length ? docs.map(d => {
              const b = d.bondId ? DB.findBond(d.bondId) : null;
              return `<tr>
                <td class="font-medium">${U.esc(d.name)}</td>
                <td><span class="badge badge-slate">${U.esc(d.category)}</span></td>
                <td>${b?b.number:'—'}</td>
                <td>${U.fileSize(d.size)}</td>
                <td>${U.date(d.uploaded)}</td>
              </tr>`;
            }).join('') : '<tr><td colspan="5" class="text-center text-slate-400 py-8">No documents.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  // ---------- Tab: Emails ----------
  _tabEmails(a, { emails }) {
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-slate-500">Emails auto-mapped to this account.</div>
        <button class="btn-primary" onclick="U.closeModals(); App.go('email')">Open Inbox →</button>
      </div>
      <div class="card">
        <table class="tbl">
          <thead><tr><th>From</th><th>Subject</th><th>Mapped Bond</th><th>Date</th></tr></thead>
          <tbody>
            ${emails.length ? emails.map(e => {
              const b = e.bondId ? DB.findBond(e.bondId) : null;
              return `<tr>
                <td>${U.esc(e.from)}</td>
                <td>
                  <div class="font-medium">${U.esc(e.subject)}</div>
                  <div class="text-xs text-slate-500 truncate max-w-[24rem]">${U.esc(e.preview)}</div>
                </td>
                <td>${b?`<span class="badge badge-violet">${b.number}</span>`:'—'}</td>
                <td>${U.datetime(e.date)}</td>
              </tr>`;
            }).join('') : '<tr><td colspan="4" class="text-center text-slate-400 py-8">No mapped emails.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  // ---------- Account create/edit form ----------
  openForm(id) {
    const a = id ? DB.findAccount(id) : {
      id: U.uid('A'), type: 'Contractor', credit: 700,
      company: {}, contacts: [], indemnitors: [], renewals: {},
    };
    const c = a.company || {};
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Account Name</div><input id="f-name" class="field-input" value="${U.esc(a.name||'')}"></div>
        <div><div class="field-label">DBA</div><input id="f-dba" class="field-input" value="${U.esc(a.dba||'')}"></div>
        <div><div class="field-label">Type</div>
          <select id="f-type" class="field-select">
            ${['Contractor','Commercial','Court','Probate','Notary','Other'].map(t=>`<option ${t===a.type?'selected':''}>${t}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Primary Contact (legacy)</div><input id="f-contact" class="field-input" value="${U.esc(a.contact||'')}" placeholder="See Contacts tab"></div>
        <div><div class="field-label">Email</div><input id="f-email" type="email" class="field-input" value="${U.esc(a.email||'')}"></div>
        <div><div class="field-label">Phone</div><input id="f-phone" class="field-input" value="${U.esc(a.phone||'')}"></div>
        <div><div class="field-label">Tax ID / EIN</div><input id="f-tax" class="field-input" value="${U.esc(a.taxId||'')}"></div>
        <div class="col-span-2"><div class="field-label">Street Address</div><input id="f-addr" class="field-input" value="${U.esc(a.address||'')}"></div>
        <div><div class="field-label">City</div><input id="f-city" class="field-input" value="${U.esc(a.city||'')}"></div>
        <div><div class="field-label">State</div><input id="f-state" class="field-input" value="${U.esc(a.state||'')}"></div>
        <div><div class="field-label">ZIP</div><input id="f-zip" class="field-input" value="${U.esc(a.zip||'')}"></div>
        <div><div class="field-label">Credit Score</div><input id="f-credit" type="number" class="field-input" value="${a.credit||700}"></div>
      </div>

      <div class="divider"></div>
      <div class="text-xs font-semibold text-slate-500 uppercase mb-2">Company Info</div>
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Legal Name</div><input id="f-legal" class="field-input" value="${U.esc(c.legalName||'')}"></div>
        <div><div class="field-label">Entity Type</div>
          <select id="f-entity" class="field-select">
            ${['LLC','S-Corp','C-Corp','Partnership','Sole Prop','Other'].map(e=>`<option ${e===c.entityType?'selected':''}>${e}</option>`).join('')}
          </select></div>
        <div><div class="field-label">State of Formation</div><input id="f-form" class="field-input" value="${U.esc(c.stateOfFormation||'')}"></div>
        <div><div class="field-label">Founded (year)</div><input id="f-founded" class="field-input" value="${U.esc(c.founded||'')}"></div>
        <div class="col-span-2"><div class="field-label">NAICS</div><input id="f-naics" class="field-input" value="${U.esc(c.naics||'')}"></div>
        <div class="col-span-2"><div class="field-label">Website</div><input id="f-web" class="field-input" value="${U.esc(c.website||'')}"></div>
        <div><div class="field-label">Gross Revenue</div><input id="f-rev" type="number" class="field-input" value="${c.grossRevenue||0}"></div>
        <div><div class="field-label">Employees</div><input id="f-emp" type="number" class="field-input" value="${c.employees||0}"></div>
        <div><div class="field-label">Single Bond Limit</div><input id="f-single" type="number" class="field-input" value="${c.singleLimit||0}"></div>
        <div><div class="field-label">Aggregate Limit</div><input id="f-agg" type="number" class="field-input" value="${c.aggregateLimit||0}"></div>
      </div>

      <div class="divider"></div>
      <div class="mt-1"><div class="field-label">Notes</div><textarea id="f-notes" class="field-textarea" rows="3">${U.esc(a.notes||'')}</textarea></div>
      <div class="text-xs text-slate-400 mt-2">Contacts, indemnitors, and renewal triggers are managed in their own tabs after saving.</div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.accounts.save('${a.id}')">Save</button>`;
    const m = U.modal({ title: id ? 'Edit Account' : 'New Account', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  save(id) {
    let a = DB.findAccount(id);
    const isNew = !a;
    if (isNew) { a = { id, contacts: [], indemnitors: [], renewals: {} }; DB.accounts().push(a); }
    a.name   = document.getElementById('f-name').value;
    a.dba    = document.getElementById('f-dba').value;
    a.type   = document.getElementById('f-type').value;
    a.contact = document.getElementById('f-contact').value;
    a.email  = document.getElementById('f-email').value;
    a.phone  = document.getElementById('f-phone').value;
    a.taxId  = document.getElementById('f-tax').value;
    a.address = document.getElementById('f-addr').value;
    a.city   = document.getElementById('f-city').value;
    a.state  = document.getElementById('f-state').value;
    a.zip    = document.getElementById('f-zip').value;
    a.credit = +document.getElementById('f-credit').value || 0;
    a.notes  = document.getElementById('f-notes').value;
    a.company = {
      legalName:         document.getElementById('f-legal').value,
      entityType:        document.getElementById('f-entity').value,
      stateOfFormation:  document.getElementById('f-form').value,
      founded:           document.getElementById('f-founded').value,
      naics:             document.getElementById('f-naics').value,
      website:           document.getElementById('f-web').value,
      grossRevenue:      +document.getElementById('f-rev').value || 0,
      employees:         +document.getElementById('f-emp').value || 0,
      singleLimit:       +document.getElementById('f-single').value || 0,
      aggregateLimit:    +document.getElementById('f-agg').value || 0,
    };
    DB.save();
    U.closeModals();
    U.toast(isNew ? 'Account created' : 'Account updated');
    this.render();
  }
};
