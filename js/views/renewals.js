window.Views = window.Views || {};

Views.renewals = {
  WINDOW_DEFAULT: 90,    // days ahead to surface renewals
  STATUSES: ['upcoming', 'outreach', 'awaiting_response', 'decided', 'closed'],
  STATUS_LABEL: {
    'upcoming':          'Upcoming',
    'outreach':          'Outreach Started',
    'awaiting_response': 'Awaiting Response',
    'decided':           'Decision Made',
    'closed':            'Closed',
  },
  STATUS_BADGE: {
    'upcoming':          'badge-slate',
    'outreach':          'badge-blue',
    'awaiting_response': 'badge-amber',
    'decided':           'badge-violet',
    'closed':            'badge-green',
  },
  DECISIONS: ['renew', 'release', 'reduce', 'increase', 'cancel'],
  DECISION_LABEL: {
    'renew':    'Renew (same terms)',
    'release':  'Released — no longer needed',
    'reduce':   'Reduce bond amount',
    'increase': 'Increase bond amount',
    'cancel':   'Cancel — not renewing',
  },
  DECISION_BADGE: {
    'renew':    'badge-green',
    'release':  'badge-slate',
    'reduce':   'badge-amber',
    'increase': 'badge-violet',
    'cancel':   'badge-rose',
  },

  _windowDays: null,
  _statusFilter: 'all',

  // ---------- Helpers ----------
  daysUntil(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  },

  // Make sure every bond expiring inside the window has a renewal row.
  syncRenewalsForWindow() {
    const win = this._windowDays || this.WINDOW_DEFAULT;
    const rens = DB.renewals();
    let added = 0;
    DB.bonds().forEach(b => {
      if (b.status !== 'Active') return;
      const d = this.daysUntil(b.expires);
      if (d === null) return;
      if (d > win || d < -30) return;
      if (!rens.some(r => r.bondId === b.id)) {
        rens.push({
          id: U.uid('R'),
          bondId: b.id,
          status: 'upcoming',
          decision: null, newAmount: null,
          contactedDate: null, nextFollowUp: null,
          assignedTo: 'Casey V.',
          notes: [],
        });
        added++;
      }
    });
    if (added) DB.save();
    return added;
  },

  rowsFor(window) {
    return DB.renewals().map(r => {
      const b = DB.findBond(r.bondId) || {};
      return {
        renewal: r,
        bond: b,
        account: DB.findAccount(b.accountId) || {},
        partner: DB.findPartner(b.partnerId) || {},
        daysToExpiry: this.daysUntil(b.expires),
      };
    }).filter(r => r.daysToExpiry !== null && r.daysToExpiry <= window && r.daysToExpiry >= -30);
  },

  // ---------- Render ----------
  render() {
    if (this._windowDays === null) this._windowDays = this.WINDOW_DEFAULT;
    this.syncRenewalsForWindow();

    const win = this._windowDays;
    let rows = this.rowsFor(win).sort((a,b) => a.daysToExpiry - b.daysToExpiry);
    if (this._statusFilter !== 'all') rows = rows.filter(r => r.renewal.status === this._statusFilter);

    const counts = {};
    this.STATUSES.forEach(s => counts[s] = 0);
    this.rowsFor(win).forEach(r => { counts[r.renewal.status] = (counts[r.renewal.status]||0) + 1; });

    const totalPremium = rows.reduce((s,r) => s + (r.bond.premium||0), 0);
    const overdue = rows.filter(r => r.daysToExpiry < 0).length;
    const urgent  = rows.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30).length;

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Bond Renewals</h1>
          <p class="section-sub">Follow-up workflow for upcoming expirations — confirm if the bond is still needed, released, or needs a reduction / increase.</p>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-slate-500">Window:</label>
          <select id="rn-window" class="field-select w-32" onchange="Views.renewals.setWindow(this.value)">
            ${[30,60,90,120,180].map(d => `<option value="${d}" ${d==win?'selected':''}>${d} days</option>`).join('')}
          </select>
          <select id="rn-status" class="field-select w-44" onchange="Views.renewals.setStatusFilter(this.value)">
            <option value="all">All statuses</option>
            ${Views.renewals.STATUSES.map(s => `<option value="${s}" ${this._statusFilter===s?'selected':''}>${Views.renewals.STATUS_LABEL[s]}</option>`).join('')}
          </select>
          <button class="btn-secondary" onclick="Views.renewals.exportCSV()">Export CSV</button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4 mb-5">
        <div class="stat-card"><div class="stat-label">In Window (${win}d)</div><div class="stat-value">${this.rowsFor(win).length}</div></div>
        <div class="stat-card"><div class="stat-label">≤ 30 days</div><div class="stat-value text-amber-600">${urgent}</div></div>
        <div class="stat-card"><div class="stat-label">Overdue</div><div class="stat-value text-rose-600">${overdue}</div></div>
        <div class="stat-card"><div class="stat-label">Premium at Risk</div><div class="stat-value">${U.usd(totalPremium)}</div></div>
      </div>

      <div class="flex items-center gap-2 mb-4 flex-wrap">
        ${this._chip('all', this.rowsFor(win).length, 'All', 'badge-slate')}
        ${this.STATUSES.map(s => this._chip(s, counts[s]||0, this.STATUS_LABEL[s], this.STATUS_BADGE[s])).join('')}
      </div>

      <div class="card">
        <table class="tbl">
          <thead><tr>
            <th>Bond</th><th>Principal</th><th>Type</th><th>Obligee</th>
            <th class="text-right">Amount</th><th>Expires</th>
            <th>Status</th><th>Decision</th><th>Next Follow-up</th><th></th>
          </tr></thead>
          <tbody>
            ${rows.length ? rows.map(r => this.row(r)).join('')
              : '<tr><td colspan="10" class="text-center text-slate-400 py-12">No renewals match.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  _chip(key, count, label, badgeClass) {
    const active = (key === 'all' && this._statusFilter === 'all') || this._statusFilter === key;
    return `
      <button onclick="Views.renewals.setStatusFilter('${key}')"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition
          ${active ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}">
        ${label} <span class="ml-1 opacity-70">${count}</span>
      </button>`;
  },

  row(r) {
    const days = r.daysToExpiry;
    const dayBadge = days < 0
      ? `<span class="badge badge-rose">Overdue ${Math.abs(days)}d</span>`
      : days <= 30
        ? `<span class="badge badge-amber">${days}d</span>`
        : `<span class="badge badge-slate">${days}d</span>`;
    const statusBadge = `<span class="badge ${this.STATUS_BADGE[r.renewal.status]}">${this.STATUS_LABEL[r.renewal.status]}</span>`;
    const decisionBadge = r.renewal.decision
      ? `<span class="badge ${this.DECISION_BADGE[r.renewal.decision]}">${this.DECISION_LABEL[r.renewal.decision]}${r.renewal.newAmount?` · ${U.usd(r.renewal.newAmount)}`:''}</span>`
      : '<span class="text-xs text-slate-400">—</span>';
    const followUp = r.renewal.nextFollowUp
      ? (this.daysUntil(r.renewal.nextFollowUp) < 0
          ? `<span class="text-rose-600 font-medium">${U.date(r.renewal.nextFollowUp)}</span>`
          : U.date(r.renewal.nextFollowUp))
      : '<span class="text-xs text-slate-400">—</span>';
    return `
      <tr class="cursor-pointer" onclick="Views.renewals.open('${r.renewal.id}')">
        <td class="font-medium text-brand-700">${r.bond.number}</td>
        <td>${U.esc(r.account.name||'')}</td>
        <td>${U.esc(r.bond.type)}</td>
        <td class="max-w-[14rem] truncate">${U.esc(r.bond.obligee||'')}</td>
        <td class="text-right">${U.usd(r.bond.amount)}</td>
        <td>${U.date(r.bond.expires)} ${dayBadge}</td>
        <td>${statusBadge}</td>
        <td>${decisionBadge}</td>
        <td>${followUp}</td>
        <td class="text-right whitespace-nowrap">
          <button class="btn-ghost" onclick="event.stopPropagation(); Compose.open({ renewalId: '${r.renewal.id}', templateId: 'T-renewal' })">✉ Email</button>
          <button class="btn-ghost" onclick="event.stopPropagation(); Views.renewals.quickFollowUp('${r.renewal.id}')">Log FU</button>
        </td>
      </tr>`;
  },

  setWindow(v) { this._windowDays = +v; this.render(); },
  setStatusFilter(v) { this._statusFilter = v; this.render(); },

  // ---------- Detail modal ----------
  open(renewalId) {
    const r = DB.renewals().find(x => x.id === renewalId);
    if (!r) return;
    const b = DB.findBond(r.bondId) || {};
    const a = DB.findAccount(b.accountId) || {};
    const p = DB.findPartner(b.partnerId) || {};
    const days = this.daysUntil(b.expires);
    const STEPS = this.STATUSES;
    const stepIdx = Math.max(0, STEPS.indexOf(r.status));
    const stepsHTML = STEPS.map((s, i) => {
      const state = i < stepIdx ? 'done' : i === stepIdx ? 'current' : 'todo';
      const dot = state === 'done' ? 'bg-emerald-500' : state === 'current' ? 'bg-brand-500 ring-4 ring-brand-100' : 'bg-slate-300';
      const txt = state === 'todo' ? 'text-slate-400' : 'text-slate-700';
      return `
        <div class="flex-1 flex items-center">
          <div class="flex flex-col items-center">
            <div class="w-3 h-3 rounded-full ${dot}"></div>
            <div class="text-[11px] ${txt} mt-2 text-center px-1">${this.STATUS_LABEL[s]}</div>
          </div>
          ${i < STEPS.length-1 ? `<div class="flex-1 h-0.5 ${i<stepIdx?'bg-emerald-400':'bg-slate-200'} mt-[-22px]"></div>`:''}
        </div>`;
    }).join('');

    const body = `
      <div class="flex items-start justify-between -mt-2 mb-3">
        <div>
          <div class="flex items-center gap-2">
            <div class="text-lg font-semibold">${b.number} · ${U.esc(b.type)}</div>
            <span class="badge ${this.STATUS_BADGE[r.status]}">${this.STATUS_LABEL[r.status]}</span>
            ${r.decision ? `<span class="badge ${this.DECISION_BADGE[r.decision]}">${this.DECISION_LABEL[r.decision]}</span>` : ''}
          </div>
          <div class="text-sm text-slate-500 mt-0.5">
            ${U.esc(a.name||'')} · ${U.esc(b.obligee||'')} · ${U.usd(b.amount)} · Surety: ${U.esc(p.name||'')}
          </div>
          <div class="text-xs text-slate-500 mt-0.5">
            Expires <b>${U.date(b.expires)}</b> · ${days < 0 ? `Overdue by ${Math.abs(days)}d` : `${days} days remaining`}
          </div>
        </div>
        <div class="text-right">
          <button class="btn-ghost" onclick="U.closeModals(); Views.bonds.open('${b.id}')">Open Bond →</button>
          <button class="btn-ghost" onclick="U.closeModals(); Views.accounts.open('${a.id}')">Open Account →</button>
        </div>
      </div>

      <div class="flex items-center gap-1 mb-5 px-2">${stepsHTML}</div>

      <div class="grid grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Workflow</div></div>
          <div class="p-4 space-y-3 text-sm">
            <div>
              <div class="field-label">Status</div>
              <select id="rn-st" class="field-select" onchange="Views.renewals.changeStatus('${r.id}', this.value)">
                ${STEPS.map(s => `<option value="${s}" ${s===r.status?'selected':''}>${this.STATUS_LABEL[s]}</option>`).join('')}
              </select>
            </div>
            <div>
              <div class="field-label">Last Contact</div>
              <input id="rn-cd" type="date" class="field-input" value="${U.esc(r.contactedDate||'')}" onchange="Views.renewals.setField('${r.id}','contactedDate', this.value)">
            </div>
            <div>
              <div class="field-label">Next Follow-up</div>
              <input id="rn-fu" type="date" class="field-input" value="${U.esc(r.nextFollowUp||'')}" onchange="Views.renewals.setField('${r.id}','nextFollowUp', this.value)">
            </div>
            <div>
              <div class="field-label">Assigned To</div>
              <input id="rn-as" class="field-input" value="${U.esc(r.assignedTo||'')}" onchange="Views.renewals.setField('${r.id}','assignedTo', this.value)">
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Decision</div></div>
          <div class="p-4 space-y-3 text-sm">
            <div>
              <div class="field-label">Outcome</div>
              <select id="rn-dec" class="field-select" onchange="Views.renewals.changeDecision('${r.id}', this.value)">
                <option value="">— No decision yet —</option>
                ${this.DECISIONS.map(d => `<option value="${d}" ${d===r.decision?'selected':''}>${this.DECISION_LABEL[d]}</option>`).join('')}
              </select>
            </div>
            <div id="rn-amt-wrap" class="${(r.decision==='reduce'||r.decision==='increase')?'':'hidden'}">
              <div class="field-label">New Bond Amount</div>
              <input id="rn-amt" type="number" class="field-input" value="${r.newAmount||''}" onchange="Views.renewals.setField('${r.id}','newAmount', +this.value || null)">
              <div class="text-xs text-slate-500 mt-1">Current: ${U.usd(b.amount)} → New: <b id="rn-amt-pv">${r.newAmount?U.usd(r.newAmount):'—'}</b></div>
            </div>
            <div class="pt-2 grid grid-cols-2 gap-2">
              <button class="btn-secondary" onclick="Views.renewals.applyDecision('${r.id}')">Apply Decision to Bond</button>
              <button class="btn-primary"   onclick="Views.renewals.markClosed('${r.id}')">Mark Closed</button>
            </div>
          </div>
        </div>

        <div class="col-span-2">${Views.templates.renderTasksCard('renewal', r.id, r)}</div>

        <div class="card col-span-2">
          <div class="card-header"><div class="card-title">Follow-up Activity</div>
            <span class="text-xs text-slate-500">${(r.notes||[]).length} entr${(r.notes||[]).length===1?'y':'ies'}</span></div>
          <div class="p-4 space-y-3">
            ${(r.notes||[]).slice().reverse().map(n => `
              <div class="border-l-2 border-brand-300 pl-3 py-1">
                <div class="text-xs text-slate-500">${U.date(n.date)} · ${U.esc(n.author||'')}</div>
                <div class="text-sm text-slate-700 whitespace-pre-line">${U.esc(n.text)}</div>
              </div>`).join('') || '<div class="text-sm text-slate-400">No follow-ups logged yet.</div>'}

            <div class="pt-3 border-t border-slate-100">
              <div class="field-label">Add Follow-up Note</div>
              <textarea id="rn-note" class="field-textarea" rows="2" placeholder="e.g. Spoke with PM — bond required for warranty period, 2-year renewal."></textarea>
              <div class="flex justify-end mt-2">
                <button class="btn-primary" onclick="Views.renewals.addNote('${r.id}')">Log Follow-up</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const footer = `
      <button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary text-rose-600" onclick="Views.renewals.deleteRenewal('${r.id}')">Delete</button>
      <button class="btn-secondary" onclick="Views.templates.openApplyPicker({ kind:'renewal', id:'${r.id}', reopen: () => Views.renewals.open('${r.id}') })">▶ Apply Template</button>
      <button class="btn-secondary" onclick="Compose.open({ renewalId: '${r.id}' })">Email Principal</button>
      <button class="btn-primary"   onclick="Compose.open({ renewalId: '${r.id}', templateId: 'T-renewal' })">Send Renewal Follow-up</button>
    `;
    const m = U.modal({ title: 'Renewal Workflow', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  // ---------- Actions ----------
  setField(id, key, value) {
    const r = DB.renewals().find(x => x.id === id);
    if (!r) return;
    r[key] = value || null;
    DB.save();
  },

  changeStatus(id, v) {
    const r = DB.renewals().find(x => x.id === id);
    r.status = v;
    DB.save();
    U.toast(`Status: ${this.STATUS_LABEL[v]}`);
  },

  changeDecision(id, v) {
    const r = DB.renewals().find(x => x.id === id);
    r.decision = v || null;
    if (r.decision && r.status !== 'closed') r.status = 'decided';
    DB.save();
    // toggle amount field visibility
    const wrap = document.getElementById('rn-amt-wrap');
    if (wrap) wrap.classList.toggle('hidden', !(v === 'reduce' || v === 'increase'));
    U.toast(v ? `Decision: ${this.DECISION_LABEL[v]}` : 'Decision cleared');
  },

  addNote(id) {
    const txt = document.getElementById('rn-note').value.trim();
    if (!txt) { U.toast('Enter a note first', 'warn'); return; }
    const r = DB.renewals().find(x => x.id === id);
    r.notes = r.notes || [];
    r.notes.push({ date: new Date().toISOString().slice(0,10), author: 'Casey V.', text: txt });
    r.contactedDate = new Date().toISOString().slice(0,10);
    if (r.status === 'upcoming') r.status = 'outreach';
    DB.save();
    U.toast('Follow-up logged');
    this.open(id);
  },

  quickFollowUp(id) {
    const r = DB.renewals().find(x => x.id === id);
    const body = `
      <p class="text-sm text-slate-600 mb-2">Quick log for <b>${(DB.findBond(r.bondId)||{}).number||''}</b>:</p>
      <textarea id="qfu" class="field-textarea" rows="3" placeholder="Spoke with… / Emailed… / Received response…"></textarea>
      <div class="mt-3"><div class="field-label">Next Follow-up</div>
        <input id="qfu-next" type="date" class="field-input"></div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.renewals.commitQuick('${id}')">Save</button>`;
    const m = U.modal({ title: 'Log Follow-up', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  commitQuick(id) {
    const text = document.getElementById('qfu').value.trim();
    const next = document.getElementById('qfu-next').value || null;
    if (!text) { U.toast('Note text required', 'warn'); return; }
    const r = DB.renewals().find(x => x.id === id);
    r.notes = r.notes || [];
    r.notes.push({ date: new Date().toISOString().slice(0,10), author: 'Casey V.', text });
    r.contactedDate = new Date().toISOString().slice(0,10);
    r.nextFollowUp = next;
    if (r.status === 'upcoming') r.status = 'outreach';
    DB.save();
    U.closeModals();
    U.toast('Follow-up saved');
    this.render();
  },

  applyDecision(id) {
    const r = DB.renewals().find(x => x.id === id);
    if (!r.decision) { U.toast('Pick a decision first', 'warn'); return; }
    const b = DB.findBond(r.bondId);
    if (!b) return;

    switch (r.decision) {
      case 'renew':
        // Roll forward 1 year
        const newExp = new Date(b.expires); newExp.setFullYear(newExp.getFullYear()+1);
        b.expires = newExp.toISOString().slice(0,10);
        U.toast(`Bond renewed — new expiration ${U.date(b.expires)}`);
        break;
      case 'release':
        b.status = 'Cancelled';
        U.toast(`Bond ${b.number} marked Cancelled (released)`);
        break;
      case 'cancel':
        b.status = 'Cancelled';
        U.toast(`Bond ${b.number} cancelled — not renewing`);
        break;
      case 'reduce':
      case 'increase':
        if (r.newAmount) {
          b.amount = r.newAmount;
          b.premium = Math.round(b.amount * (b.rate||1.5) / 100);
          U.toast(`Bond updated to ${U.usd(b.amount)} · premium ${U.usd(b.premium)}`);
        } else {
          U.toast('Enter new amount first', 'warn');
          return;
        }
        break;
    }
    r.status = 'closed';
    DB.save();
    this.open(id);
    this.render();
  },

  markClosed(id) {
    const r = DB.renewals().find(x => x.id === id);
    r.status = 'closed';
    DB.save();
    U.closeModals();
    U.toast('Renewal closed');
    this.render();
  },

  deleteRenewal(id) {
    if (!confirm('Delete this renewal record? The bond will not be affected.')) return;
    DB.state.renewals = DB.renewals().filter(r => r.id !== id);
    DB.save();
    U.closeModals();
    U.toast('Renewal deleted', 'info');
    this.render();
  },

  exportCSV() {
    const rows = [['Bond #','Principal','Type','Obligee','Amount','Expires','Days','Status','Decision','New Amount','Last Contact','Next Follow-up','Assigned','Notes Count']];
    this.rowsFor(this._windowDays || this.WINDOW_DEFAULT).forEach(r => {
      rows.push([
        r.bond.number, r.account.name||'', r.bond.type, r.bond.obligee||'',
        r.bond.amount, r.bond.expires, r.daysToExpiry,
        this.STATUS_LABEL[r.renewal.status],
        r.renewal.decision ? this.DECISION_LABEL[r.renewal.decision] : '',
        r.renewal.newAmount || '',
        r.renewal.contactedDate || '',
        r.renewal.nextFollowUp || '',
        r.renewal.assignedTo || '',
        (r.renewal.notes||[]).length,
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='renewals.csv'; a.click();
    U.toast('Renewals exported');
  },
};
