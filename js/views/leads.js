window.Views = window.Views || {};

Views.leads = {
  LEAD_SOURCES: ['Referral','Website','Surety Partner','Networking','Trade Show','Cold Outreach','Other'],

  // Lifecycle status drives the kanban grouping AND chip filtering.
  // The `stage` strings themselves are user-editable like pipeline stages.
  TERMINAL_LOST: 'Lost / No Fit',
  TERMINAL_WON:  'Onboarded',

  get STAGES() { return DB.leadStages(); },

  _statusFilter: 'open',   // open | all | won | lost

  // ---------- Render ----------
  render() {
    const stages = this.STAGES;
    const leads = DB.leads();

    const counts = {
      open:  leads.filter(l => l.status === 'open').length,
      won:   leads.filter(l => l.status === 'won').length,
      lost:  leads.filter(l => l.status === 'lost').length,
      all:   leads.length,
    };
    const totalPremium = leads.filter(l => l.status === 'open').reduce((s,l) => s + (l.estimatedAnnualPremium||0), 0);

    let visible = leads;
    if (this._statusFilter !== 'all') {
      visible = leads.filter(l => l.status === this._statusFilter);
    }

    // Group by stage (within visible)
    const byStage = {};
    stages.forEach(s => byStage[s] = visible.filter(l => l.stage === s));

    const totalByStage = {};
    stages.forEach(s => totalByStage[s] = byStage[s].reduce((sum, l) => sum + (l.estimatedAnnualPremium||0), 0));

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Leads</h1>
          <p class="section-sub">Prospective principals — your sales funnel from inquiry to onboarded account.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.leads.manageStages()">⚙ Manage Stages</button>
          <button class="btn-secondary" onclick="Views.leads.exportCSV()">Export CSV</button>
          <button class="btn-primary" onclick="Views.leads.newLead()">+ New Lead</button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4 mb-5">
        <div class="stat-card !p-3"><div class="stat-label">Open Leads</div><div class="stat-value text-lg">${counts.open}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Est. Annual Premium</div><div class="stat-value text-lg">${U.usd(totalPremium)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Onboarded</div><div class="stat-value text-lg">${counts.won}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Lost / No Fit</div><div class="stat-value text-lg">${counts.lost}</div></div>
      </div>

      <div class="flex items-center gap-2 mb-4 flex-wrap">
        ${this._chip('open',  'Open',          counts.open,  'bg-emerald-100 text-emerald-800')}
        ${this._chip('won',   'Onboarded',     counts.won,   'bg-blue-100 text-blue-800')}
        ${this._chip('lost',  'Lost',          counts.lost,  'bg-rose-100 text-rose-800')}
        ${this._chip('all',   'All',           counts.all,   'bg-cream-200 text-ink-500')}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-${Math.min(stages.length, 8)} gap-3">
        ${stages.map(stage => {
          const list = byStage[stage] || [];
          return `
            <div class="kanban-col" data-stage="${U.esc(stage)}"
                 ondragover="event.preventDefault(); this.classList.add('drop-target');"
                 ondragleave="this.classList.remove('drop-target');"
                 ondrop="Views.leads.onDrop(event, this.dataset.stage)">
              <div class="kanban-col-header">
                <div class="text-xs font-semibold text-slate-700 uppercase truncate">${U.esc(stage)}</div>
                <div class="text-xs text-slate-500 whitespace-nowrap">${list.length} · ${U.usd(totalByStage[stage])}</div>
              </div>
              ${list.map(l => this.card(l)).join('')}
            </div>`;
        }).join('')}
      </div>
    `;
  },

  _chip(key, label, count, badgeColor) {
    const active = this._statusFilter === key;
    return `
      <button onclick="Views.leads._setStatusFilter('${key}')"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition
          ${active ? 'bg-ink-800 text-cream-50 border-ink-800' : 'bg-white text-ink-500 border-cream-300 hover:bg-cream-50'}">
        ${label} <span class="ml-1 ${active ? 'opacity-80' : badgeColor + ' px-1.5 py-0 rounded-full'}">${count}</span>
      </button>`;
  },
  _setStatusFilter(v) { this._statusFilter = v; this.render(); },

  // ---------- Kanban card ----------
  card(l) {
    const probColor = l.probability >= 70 ? 'text-emerald-600' : l.probability >= 40 ? 'text-amber-600' : 'text-slate-500';
    const sourceBadge = l.leadSource ? `<span class="badge badge-slate text-[10px]">${U.esc(l.leadSource)}</span>` : '';
    const due = l.nextFollowUp ? `Follow-up ${U.date(l.nextFollowUp)}` : '';
    const activityCount = (l.activity || []).length;
    return `
      <div class="kanban-card" draggable="true" data-id="${l.id}"
        ondragstart="event.dataTransfer.setData('text/plain','${l.id}'); this.classList.add('dragging')"
        ondragend="this.classList.remove('dragging')"
        onclick="Views.leads.open('${l.id}')">
        <div class="flex items-center justify-between mb-1">
          <div class="text-sm font-semibold text-slate-800 truncate">${U.esc(l.companyName)}</div>
          <span class="text-xs ${probColor} font-medium">${l.probability}%</span>
        </div>
        <div class="text-xs text-slate-600 mb-1">${U.esc(l.contactName || '')} ${l.contactTitle ? '· ' + U.esc(l.contactTitle) : ''}</div>
        <div class="text-xs text-slate-500 mb-1">${l.estimatedAnnualPremium ? 'Est. premium ' + U.usd(l.estimatedAnnualPremium) : ''}</div>
        <div class="flex items-center gap-1 mt-1 flex-wrap">${sourceBadge}</div>
        <div class="flex items-center justify-between mt-2">
          <div class="text-xs text-slate-400 flex items-center gap-2">
            ${due ? `<span>${due}</span>` : ''}
            ${activityCount ? `<span title="${activityCount} activity entries">📎 ${activityCount}</span>` : ''}
          </div>
          <button class="text-xs text-brand-600 hover:underline" onclick="event.stopPropagation(); Compose.open({ leadId: '${l.id}' })">✉ Email</button>
        </div>
      </div>`;
  },

  // ---------- Drag/drop ----------
  onDrop(ev, stage) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/plain');
    const l = DB.findLead(id);
    if (!l) return;
    const prevStage = l.stage;
    l.stage = stage;
    if (stage === this.TERMINAL_WON)  { l.status = 'won';  l.probability = 100; }
    else if (stage === this.TERMINAL_LOST) { l.status = 'lost'; l.probability = 0; }
    else                              { l.status = 'open'; }
    if (prevStage !== stage) {
      l.activity = l.activity || [];
      l.activity.push({
        id: U.uid('LA'),
        date: new Date().toISOString(),
        author: 'Casey V.',
        type: 'stage_change',
        text: `Moved from "${prevStage}" → "${stage}".`,
      });
    }
    DB.save();
    U.toast(`Moved to ${stage}`);
    this.render();
  },

  // ---------- Detail modal ----------
  // ---------- Tabbed Lead detail modal ----------
  _currentId: null,
  _tab: 'details',

  open(id) {
    if (!DB.findLead(id)) return;
    this._currentId = id;
    this._tab = 'details';
    this._renderDetail();
  },

  _setTab(key) {
    this._captureActiveTab();
    this._tab = key;
    U.closeModals();
    this._renderDetail();
  },

  _renderDetail() {
    const id = this._currentId;
    const l  = DB.findLead(id);
    if (!l) return;

    const statusBadge =
      l.status === 'won'  ? '<span class="badge badge-blue">Onboarded</span>' :
      l.status === 'lost' ? '<span class="badge badge-rose">Lost / No Fit</span>' :
                            '<span class="badge badge-green">Open</span>';
    const convertedHint = l.convertedAccountId
      ? `<a class="text-brand-600 underline ml-2 text-xs cursor-pointer" onclick="U.closeModals(); Views.accounts.open('${l.convertedAccountId}')">→ open account</a>`
      : '';
    const taskCount = (l.tasks || []).filter(t => !t.completed).length;
    const activityCount = (l.activity || []).length;
    const intakeCount = (window.DB && DB.intakes) ? DB.intakes().filter(f => f.leadId === l.id).length : 0;

    const TABS = [
      ['details',  'Details',             ''],
      ['sourcing', 'Sourcing & Interest', ''],
      ['pipeline', 'Pipeline',            ''],
      ['tasks',    'Tasks',               taskCount || ''],
      ['intake',   'Intake Forms',        intakeCount || ''],
      ['activity', 'Activity',            activityCount || ''],
    ];

    const headerHTML = `
      <div class="flex items-start justify-between -mt-2 mb-3">
        <div>
          <div class="flex items-center gap-2">
            <div class="text-lg font-semibold">${U.esc(l.companyName)}</div>
            ${statusBadge}
            ${convertedHint}
          </div>
          <div class="text-sm text-ink-300 mt-0.5">${U.esc(l.industry||'')}${l.city?` · ${U.esc(l.city)}, ${U.esc(l.state||'')}`:''}${l.contactName?` · ${U.esc(l.contactName)}`:''}</div>
        </div>
        <div class="text-right text-xs text-ink-300">
          <div>Lead Owner</div>
          <input id="ld-owner" class="field-input w-28 text-right" value="${U.esc(l.owner||'')}">
        </div>
      </div>
      <div class="border-b border-cream-200 -mx-6 px-6 flex flex-wrap gap-1">
        ${TABS.map(([key, label, count]) => `
          <button class="px-3 py-2 text-sm border-b-2 -mb-px transition
              ${this._tab===key
                ? 'border-brand-500 text-brand-700 font-semibold'
                : 'border-transparent text-ink-400 hover:text-ink-700 hover:border-cream-300'}"
              onclick="Views.leads._setTab('${key}')">
            ${U.esc(label)}${count!==''?` <span class="ml-1 text-xs text-ink-300">${count}</span>`:''}
          </button>`).join('')}
      </div>
    `;

    const convertBtn = l.status === 'open' && !l.convertedAccountId
      ? `<button class="btn-secondary" onclick="Views.leads.convertToAccount('${id}')">Convert to Account</button>`
      : '';
    const lostBtn = l.status === 'open'
      ? `<button class="btn-secondary text-rose-600" onclick="Views.leads.markLost('${id}')">Mark Lost</button>`
      : '';

    const body = headerHTML + '<div class="pt-4">' + this._renderTab(l) + '</div>';
    const footer = `
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-secondary text-rose-600" onclick="Views.leads.deleteLead('${id}')">Delete</button>
      <button class="btn-secondary" onclick="Compose.open({ leadId: '${id}' })">✉ Email Lead</button>
      <button class="btn-secondary" onclick="Views.templates.openApplyPicker({ kind:'lead', id:'${id}', reopen: () => Views.leads.open('${id}') })">▶ Apply Template</button>
      ${lostBtn}
      ${convertBtn}
      <button class="btn-primary" onclick="Views.leads.save('${id}')">Save</button>
    `;
    const m = U.modal({ title: 'Lead', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _renderTab(l) {
    switch (this._tab) {
      case 'details':  return this._tabDetails(l);
      case 'sourcing': return this._tabSourcing(l);
      case 'pipeline': return this._tabPipeline(l);
      case 'tasks':    return Views.templates.renderTasksCard('lead', l.id, l);
      case 'intake':   return Intake.panel('lead', l);
      case 'activity': return this._tabActivity(l);
      default:         return this._tabDetails(l);
    }
  },

  _tabDetails(l) {
    return `
      <div class="card mb-4">
        <div class="card-header"><div class="card-title">Lead Details</div></div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <div><div class="field-label">Company Name</div><input id="ld-company" class="field-input" value="${U.esc(l.companyName||'')}"></div>
          <div><div class="field-label">DBA</div><input id="ld-dba" class="field-input" value="${U.esc(l.dba||'')}"></div>
          <div><div class="field-label">Primary Contact</div><input id="ld-cname" class="field-input" value="${U.esc(l.contactName||'')}"></div>
          <div><div class="field-label">Title</div><input id="ld-ctitle" class="field-input" value="${U.esc(l.contactTitle||'')}"></div>
          <div><div class="field-label">Email</div><input id="ld-email" class="field-input" value="${U.esc(l.email||'')}"></div>
          <div><div class="field-label">Phone</div><input id="ld-phone" class="field-input" value="${U.esc(l.phone||'')}"></div>
          <div><div class="field-label">City</div><input id="ld-city" class="field-input" value="${U.esc(l.city||'')}"></div>
          <div><div class="field-label">State</div><input id="ld-state" class="field-input" value="${U.esc(l.state||'')}"></div>
          <div><div class="field-label">Industry</div><input id="ld-industry" class="field-input" value="${U.esc(l.industry||'')}"></div>
          <div><div class="field-label">NAICS</div><input id="ld-naics" class="field-input" value="${U.esc(l.naics||'')}"></div>
          <div><div class="field-label">Est. Annual Premium</div><input id="ld-prem" type="number" class="field-input" value="${l.estimatedAnnualPremium||''}" placeholder="$"></div>
          <div><div class="field-label">Est. Annual Revenue</div><input id="ld-rev" type="number" class="field-input" value="${l.estimatedRevenue||''}" placeholder="$"></div>
          <div><div class="field-label">Years in Business</div><input id="ld-yrs" type="number" class="field-input" value="${l.yearsInBusiness||''}"></div>
          <div></div>
        </div>
      </div>
    `;
  },

  _tabSourcing(l) {
    return `
      <div class="card mb-4">
        <div class="card-header"><div class="card-title">Sourcing &amp; Interest</div></div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <div><div class="field-label">Lead Source</div>
            <select id="ld-source" class="field-select">
              <option value="">—</option>
              ${this.LEAD_SOURCES.map(s => `<option ${s===l.leadSource?'selected':''}>${U.esc(s)}</option>`).join('')}
            </select></div>
          <div><div class="field-label">Referred By</div>
            <input id="ld-ref" class="field-input" value="${U.esc(l.referredBy||'')}"></div>
          <div class="col-span-2"><div class="field-label">Bond Types of Interest</div>
            <div id="ld-types" class="grid grid-cols-3 gap-1">
              ${BondTypes.TYPES.map(t => `
                <label class="text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-cream-50">
                  <input type="checkbox" class="chk" value="${U.esc(t)}" ${(l.bondTypes||[]).includes(t)?'checked':''}>
                  ${U.esc(t)}
                </label>`).join('')}
            </div></div>
        </div>
      </div>
    `;
  },

  _tabPipeline(l) {
    const stages = this.STAGES;
    return `
      <div class="card mb-4">
        <div class="card-header"><div class="card-title">Pipeline</div></div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <div><div class="field-label">Stage</div>
            <select id="ld-stage" class="field-select">
              ${stages.map(s => `<option ${s===l.stage?'selected':''}>${U.esc(s)}</option>`).join('')}
            </select></div>
          <div><div class="field-label">Probability</div>
            <input id="ld-prob" type="range" min="0" max="100" value="${l.probability||0}" class="w-full"
              oninput="document.getElementById('ld-prob-val').textContent=this.value+'%'">
            <div class="text-xs text-ink-300" id="ld-prob-val">${l.probability||0}%</div>
          </div>
          <div><div class="field-label">Last Touch</div>
            <input id="ld-last" type="date" class="field-input" value="${U.esc(l.lastTouch||'')}"></div>
          <div><div class="field-label">Next Follow-up</div>
            <input id="ld-next" type="date" class="field-input" value="${U.esc(l.nextFollowUp||'')}"></div>
          <div class="col-span-2"><div class="field-label">Notes</div>
            <textarea id="ld-notes" class="field-textarea" rows="2">${U.esc(l.notes||'')}</textarea></div>
        </div>
      </div>
    `;
  },

  _tabActivity(l) {
    const activity = (l.activity || []).slice().sort((x,y) => new Date(y.date) - new Date(x.date));
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Activity Log</div>
          <span class="text-xs text-ink-300">${activity.length} entr${activity.length===1?'y':'ies'}</span>
        </div>
        <div class="p-4 space-y-3">
          ${activity.length ? activity.map(n => this._activityRow(n)).join('')
            : '<div class="text-sm text-ink-300">No activity yet. Send an email or log a note below.</div>'}
          <div class="pt-3 border-t border-cream-100">
            <div class="field-label">Log a note, call, or other touchpoint</div>
            <div class="flex gap-2">
              <select id="ld-newtype" class="field-select w-40">
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
              <textarea id="ld-newtext" class="field-textarea" rows="2" placeholder="What happened? e.g. Called Tony to schedule next check-in."></textarea>
            </div>
            <div class="flex justify-end mt-2">
              <button class="btn-primary" onclick="Views.leads._logActivity('${l.id}')">Log Entry</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _captureActiveTab() {
    const id = this._currentId;
    const l  = id ? DB.findLead(id) : null;
    if (!l) return;
    const get = (k) => document.getElementById(k);
    const val = (k) => { const e = get(k); return e ? e.value : null; };
    const num = (k) => { const v = val(k); return v == null || v === '' ? null : +v; };
    if (get('ld-owner'))   l.owner        = val('ld-owner');
    if (get('ld-company')) l.companyName  = val('ld-company');
    if (get('ld-dba'))     l.dba          = val('ld-dba');
    if (get('ld-cname'))   l.contactName  = val('ld-cname');
    if (get('ld-ctitle'))  l.contactTitle = val('ld-ctitle');
    if (get('ld-email'))   l.email        = val('ld-email');
    if (get('ld-phone'))   l.phone        = val('ld-phone');
    if (get('ld-city'))    l.city         = val('ld-city');
    if (get('ld-state'))   l.state        = val('ld-state');
    if (get('ld-industry'))l.industry     = val('ld-industry');
    if (get('ld-naics'))   l.naics        = val('ld-naics');
    if (get('ld-prem'))    l.estimatedAnnualPremium = num('ld-prem');
    if (get('ld-rev'))     l.estimatedRevenue       = num('ld-rev');
    if (get('ld-yrs'))     l.yearsInBusiness        = num('ld-yrs');
    if (get('ld-source'))  l.leadSource   = val('ld-source') || null;
    if (get('ld-ref'))     l.referredBy   = val('ld-ref');
    if (get('ld-types'))   l.bondTypes    = Array.from(document.querySelectorAll('#ld-types input[type=checkbox]:checked')).map(i => i.value);
    if (get('ld-stage')) {
      const prevStage = l.stage;
      l.stage = val('ld-stage');
      l.probability = num('ld-prob');
      l.lastTouch    = val('ld-last') || null;
      l.nextFollowUp = val('ld-next') || null;
      if (get('ld-notes')) l.notes = val('ld-notes');
      if (l.stage === this.TERMINAL_WON)       { l.status = 'won'; l.probability = 100; }
      else if (l.stage === this.TERMINAL_LOST) { l.status = 'lost'; l.probability = 0; }
      else                                      { l.status = 'open'; }
      if (prevStage !== l.stage) {
        l.activity = l.activity || [];
        l.activity.push({
          id: U.uid('LA'),
          date: new Date().toISOString(),
          author: 'Casey V.',
          type: 'stage_change',
          text: `Moved from "${prevStage}" → "${l.stage}".`,
        });
      }
    }
    DB.save();
  },

  _activityRow(n) {
    const ICONS = { email: '✉', call: '📞', meeting: '👥', note: '📝', stage_change: '↪', other: '•' };
    const colors = { email: 'border-blue-300', call: 'border-emerald-300', meeting: 'border-violet-300', note: 'border-slate-300', stage_change: 'border-cream-300', other: 'border-slate-300' };
    const icon = ICONS[n.type] || '•';
    const color = colors[n.type] || 'border-slate-300';
    return `
      <div class="border-l-2 ${color} pl-3 py-1">
        <div class="text-xs text-ink-300 flex items-center gap-2">
          <span>${icon}</span>
          <span>${U.datetime(n.date)}</span>
          <span>· ${U.esc(n.author||'')}</span>
          ${n.subject?`<span class="font-medium text-ink-500">· ${U.esc(n.subject)}</span>`:''}
        </div>
        <div class="text-sm text-ink-500 whitespace-pre-line mt-0.5">${U.esc(n.text||'')}</div>
      </div>`;
  },

  _logActivity(id) {
    const l = DB.findLead(id);
    const type = document.getElementById('ld-newtype').value;
    const text = document.getElementById('ld-newtext').value.trim();
    if (!text) { U.toast('Enter a note', 'warn'); return; }
    l.activity = l.activity || [];
    l.activity.push({
      id: U.uid('LA'),
      date: new Date().toISOString(),
      author: 'Casey V.',
      type, text,
    });
    l.lastTouch = new Date().toISOString().slice(0,10);
    DB.save();
    U.toast('Activity logged');
    this.open(id);
  },

  // ---------- Save / status actions ----------
  save(id) {
    this._currentId = id;
    this._captureActiveTab();
    U.closeModals();
    U.toast('Lead updated');
    this.render();
  },

  markLost(id) {
    const l = DB.findLead(id);
    l.status = 'lost';
    l.stage = this.TERMINAL_LOST;
    l.probability = 0;
    l.activity = l.activity || [];
    l.activity.push({ id: U.uid('LA'), date: new Date().toISOString(), author: 'Casey V.', type: 'stage_change', text: 'Marked Lost / No Fit.' });
    DB.save();
    U.closeModals();
    U.toast('Lead marked Lost', 'info');
    this.render();
  },

  deleteLead(id) {
    if (!confirm('Delete this lead?')) return;
    DB.state.leads = DB.leads().filter(l => l.id !== id);
    DB.save();
    U.closeModals();
    U.toast('Lead deleted', 'info');
    this.render();
  },

  // ---------- Convert to Account ----------
  convertToAccount(id) {
    const l = DB.findLead(id);
    if (!l) return;
    if (l.convertedAccountId) { U.toast('Already converted', 'info'); return; }

    const body = `
      <div class="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3 py-2 rounded mb-4">
        Review the new account details before creating. The lead will move to <b>Onboarded</b> and link to the new account.
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Account Name</div>
          <input id="cv-name" class="field-input" value="${U.esc(l.companyName)}"></div>
        <div><div class="field-label">DBA</div>
          <input id="cv-dba" class="field-input" value="${U.esc(l.dba||'')}"></div>
        <div><div class="field-label">Type</div>
          <select id="cv-type" class="field-select">
            ${['Contractor','Commercial','Court','Probate','Notary','Other'].map(t => `<option>${t}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Primary Contact</div>
          <input id="cv-contact" class="field-input" value="${U.esc(l.contactName||'')}"></div>
        <div><div class="field-label">Email</div>
          <input id="cv-email" class="field-input" value="${U.esc(l.email||'')}"></div>
        <div><div class="field-label">Phone</div>
          <input id="cv-phone" class="field-input" value="${U.esc(l.phone||'')}"></div>
        <div><div class="field-label">City</div>
          <input id="cv-city" class="field-input" value="${U.esc(l.city||'')}"></div>
        <div><div class="field-label">State</div>
          <input id="cv-state" class="field-input" value="${U.esc(l.state||'')}"></div>
        <div><div class="field-label">Credit (estimate)</div>
          <input id="cv-credit" type="number" class="field-input" value="720"></div>
        <div></div>
        <div class="col-span-2"><div class="field-label">Notes</div>
          <textarea id="cv-notes" class="field-textarea" rows="2">Converted from lead ${l.id}. ${U.esc(l.notes||'')}</textarea></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.leads._commitConvert('${id}')">Create Account</button>`;
    const m = U.modal({ title: 'Convert Lead → Account', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _commitConvert(leadId) {
    const l = DB.findLead(leadId); if (!l) return;
    const newId = U.uid('A');
    const account = {
      id: newId,
      name:    document.getElementById('cv-name').value,
      dba:     document.getElementById('cv-dba').value,
      type:    document.getElementById('cv-type').value,
      contact: document.getElementById('cv-contact').value,
      email:   document.getElementById('cv-email').value,
      phone:   document.getElementById('cv-phone').value,
      city:    document.getElementById('cv-city').value,
      state:   document.getElementById('cv-state').value,
      credit:  +document.getElementById('cv-credit').value || 700,
      notes:   document.getElementById('cv-notes').value,
      taxId: '', address: '', zip: '',
      company: {
        legalName: l.companyName, entityType: '', stateOfFormation: l.state||'', founded: '',
        naics: l.naics||'', website: '',
        grossRevenue: l.estimatedRevenue || 0, employees: 0,
        singleLimit: 0, aggregateLimit: 0,
      },
      contacts: [
        { id: U.uid('C'), name: l.contactName||'', title: l.contactTitle||'', email: l.email||'', phone: l.phone||'', primary: true },
      ],
      indemnitors: [],
      renewals: { financialsLast: null, financialsInterval: 365, wipLast: null, wipInterval: 90 },
    };
    DB.accounts().push(account);
    l.convertedAccountId = newId;
    l.stage = this.TERMINAL_WON;
    l.status = 'won';
    l.probability = 100;
    l.activity = l.activity || [];
    l.activity.push({
      id: U.uid('LA'),
      date: new Date().toISOString(),
      author: 'Casey V.',
      type: 'stage_change',
      text: `Converted to account ${newId}.`,
    });
    DB.save();

    // Auto-provision cloud folders for the new account
    if (window.Files && Files.provisionAccount) Files.provisionAccount(account);

    U.closeModals();
    U.toast(`Account created — ${account.name}`);
    App.go('accounts');
    setTimeout(() => Views.accounts.open(newId), 60);
  },

  // ---------- New lead ----------
  newLead() {
    const body = `
      <div class="mb-4 flex items-center justify-between gap-3 p-3 rounded-lg bg-cream-100 border border-cream-200">
        <div class="text-xs text-ink-400">Have an intake form, application, or questionnaire? Upload it to auto-fill the fields below.</div>
        <button class="btn-secondary" onclick="Views.leads._uploadForm()">⤴ Upload Form</button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Company Name</div><input id="nl-company" class="field-input"></div>
        <div><div class="field-label">Primary Contact</div><input id="nl-contact" class="field-input"></div>
        <div><div class="field-label">Title</div><input id="nl-title" class="field-input"></div>
        <div><div class="field-label">Email</div><input id="nl-email" type="email" class="field-input"></div>
        <div><div class="field-label">Phone</div><input id="nl-phone" class="field-input"></div>
        <div><div class="field-label">City</div><input id="nl-city" class="field-input"></div>
        <div><div class="field-label">State</div><input id="nl-state" class="field-input"></div>
        <div><div class="field-label">Lead Source</div>
          <select id="nl-source" class="field-select">${this.LEAD_SOURCES.map(s=>`<option>${s}</option>`).join('')}</select></div>
        <div><div class="field-label">Referred By</div><input id="nl-ref" class="field-input"></div>
        <div><div class="field-label">Est. Annual Premium</div><input id="nl-prem" type="number" class="field-input"></div>
        <div><div class="field-label">Industry</div><input id="nl-industry" class="field-input"></div>
        <div class="col-span-2"><div class="field-label">Notes</div><textarea id="nl-notes" class="field-textarea" rows="2"></textarea></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.leads._createLead()">Create Lead</button>`;
    const m = U.modal({ title: 'New Lead', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _uploadForm() {
    if (!window.FormParse) { U.toast('Form parser unavailable', 'warn'); return; }
    FormParse.uploadAndFill({
      companyName:  'nl-company',
      contactName:  'nl-contact',
      contactTitle: 'nl-title',
      email:        'nl-email',
      phone:        'nl-phone',
      city:         'nl-city',
      state:        'nl-state',
      industry:     'nl-industry',
      leadSource:   'nl-source',
      notes:        'nl-notes',
    });
  },

  _createLead() {
    const l = {
      id: U.uid('L'),
      companyName: document.getElementById('nl-company').value || 'New Lead',
      contactName: document.getElementById('nl-contact').value,
      contactTitle: document.getElementById('nl-title').value,
      email:       document.getElementById('nl-email').value,
      phone:       document.getElementById('nl-phone').value,
      city:        document.getElementById('nl-city').value,
      state:       document.getElementById('nl-state').value,
      industry:    document.getElementById('nl-industry').value,
      leadSource:  document.getElementById('nl-source').value,
      referredBy:  document.getElementById('nl-ref').value,
      estimatedAnnualPremium: +document.getElementById('nl-prem').value || null,
      notes:       document.getElementById('nl-notes').value,
      bondTypes: [],
      stage: this.STAGES[0],
      probability: 20,
      status: 'open',
      owner: 'CV', producer: 'CV',
      createdDate: new Date().toISOString().slice(0,10),
      lastTouch:   new Date().toISOString().slice(0,10),
      nextFollowUp: null,
      activity: [{
        id: U.uid('LA'), date: new Date().toISOString(),
        author: 'Casey V.', type: 'note',
        text: 'Lead created.',
      }],
      convertedAccountId: null,
    };
    DB.leads().push(l);
    DB.save();
    U.closeModals();
    U.toast('Lead created');
    this.render();
  },

  // ---------- Manage stages (same pattern as pipeline) ----------
  manageStages() {
    const stages = this.STAGES;
    const counts = {};
    stages.forEach(s => counts[s] = DB.leads().filter(l => l.stage === s).length);
    const body = `
      <p class="text-sm text-ink-400 mb-3">Add, rename, reorder, or remove lead pipeline stages. Stages with leads can't be deleted — move them first.</p>
      <div class="space-y-2" id="ls-list">
        ${stages.map((s, i) => `
          <div class="flex items-center gap-2 p-2 border border-cream-200 rounded-lg" data-idx="${i}">
            <div class="text-ink-300 w-6 text-center">⋮⋮</div>
            <input class="field-input flex-1" data-name value="${U.esc(s)}">
            <span class="text-xs text-ink-300 w-20 text-right">${counts[s]} lead${counts[s]===1?'':'s'}</span>
            <button class="btn-ghost" title="Move up" onclick="Views.leads._moveStage(${i}, -1)">↑</button>
            <button class="btn-ghost" title="Move down" onclick="Views.leads._moveStage(${i}, 1)">↓</button>
            <button class="btn-ghost text-rose-600" title="Delete" onclick="Views.leads._deleteStage(${i})" ${counts[s]?'disabled':''}>✕</button>
          </div>
        `).join('')}
      </div>
      <div class="divider"></div>
      <div class="flex gap-2">
        <input id="ls-new" class="field-input flex-1" placeholder="New stage name…">
        <button class="btn-primary" onclick="Views.leads._addStage()">Add Stage</button>
      </div>
      <div class="mt-3 text-right">
        <button class="btn-ghost" onclick="Views.leads._resetStages()">Reset to defaults</button>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Close</button><button class="btn-primary" onclick="Views.leads._saveStageNames()">Save Names</button>`;
    const m = U.modal({ title: 'Manage Lead Pipeline Stages', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _saveStageNames() {
    const inputs = document.querySelectorAll('#ls-list [data-name]');
    const stages = DB.leadStages();
    const renames = {};
    inputs.forEach((inp, i) => {
      const v = inp.value.trim();
      if (v && stages[i] !== v) { renames[stages[i]] = v; stages[i] = v; }
    });
    if (Object.keys(renames).length) {
      DB.leads().forEach(l => { if (renames[l.stage]) l.stage = renames[l.stage]; });
    }
    DB.save();
    U.closeModals();
    U.toast('Stages saved');
    this.render();
  },
  _addStage() {
    const v = document.getElementById('ls-new').value.trim();
    if (!v) return;
    if (DB.leadStages().includes(v)) { U.toast('Stage already exists', 'warn'); return; }
    DB.leadStages().push(v);
    DB.save();
    this.manageStages();
  },
  _moveStage(idx, delta) {
    const s = DB.leadStages();
    const j = idx + delta;
    if (j < 0 || j >= s.length) return;
    [s[idx], s[j]] = [s[j], s[idx]];
    DB.save();
    this.manageStages();
  },
  _deleteStage(idx) {
    const s = DB.leadStages();
    const stage = s[idx];
    const inUse = DB.leads().some(l => l.stage === stage);
    if (inUse) { U.toast('Move leads out of this stage first', 'warn'); return; }
    if (s.length <= 1) { U.toast('At least one stage is required', 'warn'); return; }
    s.splice(idx, 1);
    DB.save();
    this.manageStages();
  },
  _resetStages() {
    if (!confirm('Reset stages to the defaults? Any custom stages will be removed (leads in them will move to the first default stage).')) return;
    const defaults = ['New Lead','Contacted','Qualified','Application Sent','Submitted to Surety','Approved','Onboarded','Lost / No Fit'];
    DB.leads().forEach(l => { if (!defaults.includes(l.stage)) l.stage = defaults[0]; });
    DB.state.leadStages = defaults.slice();
    DB.save();
    U.closeModals();
    U.toast('Stages reset to defaults');
    this.render();
  },

  exportCSV() {
    const rows = [['Company','Contact','Email','Phone','City','State','Source','Referred By','Bond Types','Est. Premium','Stage','Probability','Status','Owner','Last Touch','Next Follow-up','Activity Count','Notes']];
    DB.leads().forEach(l => {
      rows.push([
        l.companyName, l.contactName||'', l.email||'', l.phone||'', l.city||'', l.state||'',
        l.leadSource||'', l.referredBy||'', (l.bondTypes||[]).join('; '),
        l.estimatedAnnualPremium||'',
        l.stage, l.probability + '%', l.status, l.owner||'',
        l.lastTouch||'', l.nextFollowUp||'',
        (l.activity||[]).length,
        (l.notes||'').replace(/\n/g,' '),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='leads.csv'; a.click();
    U.toast('Leads exported');
  },
};
