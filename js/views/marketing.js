// ---------- Marketing Hub ----------
// Contacts / Campaigns / Lists / Email Blasts / Landing Pages /
// Sequences / Attribution — a HubSpot-style marketing module scoped to
// what a surety agency actually needs.
window.Views = window.Views || {};

Views.marketing = {
  _tab: 'dashboard',

  LIFECYCLE_STAGES: ['subscriber','lead','mql','sql','opportunity','customer','evangelist'],
  LIFECYCLE_LABEL: {
    subscriber: 'Subscriber', lead: 'Lead', mql: 'MQL', sql: 'SQL',
    opportunity: 'Opportunity', customer: 'Customer', evangelist: 'Evangelist',
  },
  LIFECYCLE_BADGE: {
    subscriber: 'badge-slate', lead: 'badge-blue', mql: 'badge-violet',
    sql: 'badge-amber', opportunity: 'badge-amber', customer: 'badge-green',
    evangelist: 'badge-green',
  },
  STATUS_BADGE: {
    active: 'badge-green', complete: 'badge-slate', paused: 'badge-amber',
    draft: 'badge-slate', scheduled: 'badge-blue', sent: 'badge-green',
  },
  SOURCES: ['Cold Outreach','Referral','Website','Newsletter','Paid Social','Paid Search','Event','Direct Mail','Other'],

  // Filter state per tab
  _contactFilters: { search: '', stage: '', source: '', list: '' },
  _campaignFilters: { search: '', status: '' },
  _blastFilters: { status: '' },

  render() {
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Marketing Hub</h1>
          <p class="section-sub">Top-of-funnel — attract, nurture, and attribute revenue.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.marketing.newContact()">+ New Contact</button>
          <button class="btn-primary"   onclick="Views.marketing.newCampaign()">+ New Campaign</button>
        </div>
      </div>

      <div class="border-b border-cream-200 -mx-6 px-6 flex flex-wrap gap-1 mb-5">
        ${this._tabBtn('dashboard',    'Overview')}
        ${this._tabBtn('campaigns',    'Campaigns',   DB.campaigns().length)}
        ${this._tabBtn('contacts',     'Contacts',    DB.marketingContacts().length)}
        ${this._tabBtn('lists',        'Lists',       DB.marketingLists().length)}
        ${this._tabBtn('emails',       'Email Blasts', DB.emailBlasts().length)}
        ${this._tabBtn('pages',        'Landing Pages', DB.landingPages().length)}
        ${this._tabBtn('sequences',    'Sequences',   DB.marketingSequences().length)}
        ${this._tabBtn('attribution',  'Attribution')}
      </div>

      <div id="mk-body">${this._renderTab()}</div>
    `;
    setTimeout(() => this._drawCharts(), 30);
  },

  _tabBtn(key, label, count) {
    const active = this._tab === key;
    return `
      <button class="px-3 py-2 text-sm border-b-2 -mb-px transition
          ${active ? 'border-brand-500 text-brand-700 font-semibold'
                   : 'border-transparent text-ink-400 hover:text-ink-700 hover:border-cream-300'}"
          onclick="Views.marketing._setTab('${key}')">
        ${U.esc(label)}${count!==undefined?` <span class="ml-1 text-xs text-ink-300">${count}</span>`:''}
      </button>`;
  },

  _setTab(k) { this._tab = k; this.render(); },

  _renderTab() {
    switch (this._tab) {
      case 'dashboard':   return this._tabDashboard();
      case 'campaigns':   return this._tabCampaigns();
      case 'contacts':    return this._tabContacts();
      case 'lists':       return this._tabLists();
      case 'emails':      return this._tabEmailBlasts();
      case 'pages':       return this._tabLandingPages();
      case 'sequences':   return this._tabSequences();
      case 'attribution': return this._tabAttribution();
      default:            return this._tabDashboard();
    }
  },

  // -------------------- DASHBOARD --------------------
  _tabDashboard() {
    const contacts = DB.marketingContacts();
    const camps    = DB.campaigns();
    const blasts   = DB.emailBlasts();

    const now = new Date();
    const thisMonth = now.toISOString().slice(0,7);
    const newThisMonth = contacts.filter(c => (c.createdDate||'').slice(0,7) === thisMonth).length;
    const mqls = contacts.filter(c => c.lifecycleStage === 'mql' || c.lifecycleStage === 'sql').length;
    const customers = contacts.filter(c => c.lifecycleStage === 'customer').length;
    const conversion = contacts.length ? Math.round(customers / contacts.length * 100) : 0;

    const pipelineSourced = camps.reduce((s,c) => s + (c.metrics?.wonRevenue || 0), 0);
    const totalSpent = camps.reduce((s,c) => s + (c.spent || c.metrics?.cost || 0), 0);
    const roi = totalSpent ? Math.round((pipelineSourced - totalSpent) / totalSpent * 100) : 0;

    const sentBlasts = blasts.filter(b => b.status === 'sent');
    const totalSent = sentBlasts.reduce((s,b) => s + (b.stats?.sent||0), 0);
    const totalOpens = sentBlasts.reduce((s,b) => s + (b.stats?.opens||0), 0);
    const totalClicks = sentBlasts.reduce((s,b) => s + (b.stats?.clicks||0), 0);
    const avgOpen  = totalSent ? Math.round(totalOpens / totalSent * 100) : 0;
    const avgClick = totalOpens ? Math.round(totalClicks / totalOpens * 100) : 0;

    const topCamps = camps.slice().sort((a,b) => (b.metrics?.wonRevenue||0) - (a.metrics?.wonRevenue||0)).slice(0, 5);

    return `
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <div class="stat-card !p-3"><div class="stat-label">Contacts</div><div class="stat-value text-lg">${contacts.length}</div>
          <div class="stat-delta-up">+${newThisMonth} this mo</div></div>
        <div class="stat-card !p-3"><div class="stat-label">MQL / SQL</div><div class="stat-value text-lg">${mqls}</div>
          <div class="text-[11px] text-ink-300 mt-0.5">${contacts.length?Math.round(mqls/contacts.length*100):0}% of contacts</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Customers</div><div class="stat-value text-lg">${customers}</div>
          <div class="text-[11px] text-ink-300 mt-0.5">${conversion}% conv. rate</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Revenue Sourced</div><div class="stat-value text-lg">${U.usd(pipelineSourced)}</div>
          <div class="stat-delta-up">${roi>=0?`+${roi}% ROI`:`${roi}% ROI`}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Avg Open Rate</div><div class="stat-value text-lg">${avgOpen}%</div>
          <div class="text-[11px] text-ink-300 mt-0.5">${totalSent.toLocaleString()} sent</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Avg Click Rate</div><div class="stat-value text-lg">${avgClick}%</div>
          <div class="text-[11px] text-ink-300 mt-0.5">of opens</div></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div class="card lg:col-span-2">
          <div class="card-header"><div class="card-title">Lifecycle Funnel</div>
            <span class="text-xs text-ink-300">subscriber → customer</span></div>
          <div class="p-4"><canvas id="mk-funnel" height="120"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Traffic Sources</div></div>
          <div class="p-4"><canvas id="mk-sources" height="120"></canvas></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Top Campaigns by Revenue</div>
            <button class="btn-ghost" onclick="Views.marketing._setTab('campaigns')">All →</button></div>
          <table class="tbl">
            <thead><tr><th>Campaign</th><th>Channel</th><th class="text-right">Contacts</th><th class="text-right">Revenue</th><th class="text-right">ROI</th></tr></thead>
            <tbody>
              ${topCamps.map(c => {
                const r = c.metrics?.wonRevenue || 0;
                const cost = c.spent || c.metrics?.cost || 0;
                const roi = cost ? Math.round((r - cost) / cost * 100) : 0;
                return `<tr class="cursor-pointer" onclick="Views.marketing.openCampaign('${c.id}')">
                  <td class="font-medium">${U.esc(c.name)}</td>
                  <td><span class="badge badge-slate">${U.esc(c.channel)}</span></td>
                  <td class="text-right">${c.metrics?.contacts || 0}</td>
                  <td class="text-right">${U.usd(r)}</td>
                  <td class="text-right ${roi>=0?'text-emerald-700':'text-rose-700'}">${roi>=0?'+':''}${roi}%</td>
                </tr>`;
              }).join('') || '<tr><td colspan="5" class="text-center text-ink-300 py-6">No campaigns yet.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Recent Email Performance</div>
            <button class="btn-ghost" onclick="Views.marketing._setTab('emails')">All →</button></div>
          <table class="tbl">
            <thead><tr><th>Blast</th><th class="text-right">Sent</th><th class="text-right">Open %</th><th class="text-right">Click %</th></tr></thead>
            <tbody>
              ${sentBlasts.slice().sort((a,b) => (b.sentDate||'').localeCompare(a.sentDate||'')).slice(0,5).map(b => {
                const openPct = b.stats?.sent ? Math.round(b.stats.opens / b.stats.sent * 100) : 0;
                const clickPct = b.stats?.opens ? Math.round(b.stats.clicks / b.stats.opens * 100) : 0;
                return `<tr class="cursor-pointer" onclick="Views.marketing.openBlast('${b.id}')">
                  <td class="font-medium">${U.esc(b.name)}</td>
                  <td class="text-right">${(b.stats?.sent||0).toLocaleString()}</td>
                  <td class="text-right">${openPct}%</td>
                  <td class="text-right">${clickPct}%</td>
                </tr>`;
              }).join('') || '<tr><td colspan="4" class="text-center text-ink-300 py-6">No email blasts sent yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _drawCharts() {
    if (this._tab !== 'dashboard' && this._tab !== 'attribution') return;
    if (typeof Chart === 'undefined') return;
    const contacts = DB.marketingContacts();

    // Funnel bar
    const funnelEl = document.getElementById('mk-funnel');
    if (funnelEl) {
      const stages = this.LIFECYCLE_STAGES.filter(s => s !== 'evangelist');
      const counts = stages.map(s => contacts.filter(c => c.lifecycleStage === s).length);
      if (funnelEl._chart) funnelEl._chart.destroy();
      funnelEl._chart = new Chart(funnelEl, {
        type: 'bar',
        data: {
          labels: stages.map(s => this.LIFECYCLE_LABEL[s]),
          datasets: [{ data: counts, backgroundColor: '#c1623f', borderRadius: 4 }],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, grid: { color: '#f4e9cf' } }, x: { grid: { display: false } } },
        },
      });
    }

    // Sources donut
    const sourceEl = document.getElementById('mk-sources');
    if (sourceEl) {
      const byS = {};
      contacts.forEach(c => { byS[c.source||'Unknown'] = (byS[c.source||'Unknown'] || 0) + 1; });
      const colors = ['#c1623f','#a14e30','#dfa07b','#bf9d5b','#8c7e69','#615442','#3e3424'];
      if (sourceEl._chart) sourceEl._chart.destroy();
      sourceEl._chart = new Chart(sourceEl, {
        type: 'doughnut',
        data: {
          labels: Object.keys(byS),
          datasets: [{ data: Object.values(byS), backgroundColor: colors, borderWidth: 1, borderColor: '#fdf9f0' }],
        },
        options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } },
      });
    }

    // Attribution donut
    const attrEl = document.getElementById('mk-attr');
    if (attrEl) {
      const camps = DB.campaigns();
      if (attrEl._chart) attrEl._chart.destroy();
      attrEl._chart = new Chart(attrEl, {
        type: 'bar',
        data: {
          labels: camps.map(c => c.name.length > 22 ? c.name.slice(0,20)+'…' : c.name),
          datasets: [
            { label: 'Won Revenue', data: camps.map(c => c.metrics?.wonRevenue||0), backgroundColor: '#c1623f' },
            { label: 'Spent',       data: camps.map(c => c.spent||0),                backgroundColor: '#dfa07b' },
          ],
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { position: 'bottom' } },
          scales: { x: { beginAtZero: true, grid: { color: '#f4e9cf' } }, y: { grid: { display: false } } },
        },
      });
    }
  },

  // -------------------- CAMPAIGNS --------------------
  _tabCampaigns() {
    const f = this._campaignFilters;
    const camps = DB.campaigns().filter(c => {
      if (f.status && c.status !== f.status) return false;
      if (f.search) {
        const q = f.search.toLowerCase();
        if (!(c.name+c.description+c.channel).toLowerCase().includes(q)) return false;
      }
      return true;
    });
    return `
      <div class="flex items-center gap-3 mb-3">
        <input class="field-input flex-1" placeholder="Search campaigns…"
          value="${U.esc(f.search)}"
          oninput="Views.marketing._campaignFilters.search=this.value; document.getElementById('mk-body').innerHTML = Views.marketing._tabCampaigns();">
        <select class="field-select w-44" onchange="Views.marketing._campaignFilters.status=this.value; document.getElementById('mk-body').innerHTML = Views.marketing._tabCampaigns();">
          <option value="">All statuses</option>
          <option value="active"   ${f.status==='active'?'selected':''}>Active</option>
          <option value="scheduled"${f.status==='scheduled'?'selected':''}>Scheduled</option>
          <option value="complete" ${f.status==='complete'?'selected':''}>Complete</option>
          <option value="paused"   ${f.status==='paused'?'selected':''}>Paused</option>
        </select>
      </div>

      <div class="card">
        <table class="tbl">
          <thead><tr>
            <th>Campaign</th><th>Channel</th><th>Status</th><th>Dates</th>
            <th class="text-right">Contacts</th><th class="text-right">MQL/SQL</th>
            <th class="text-right">Spent</th><th class="text-right">Revenue</th><th class="text-right">ROI</th>
          </tr></thead>
          <tbody>
            ${camps.map(c => {
              const m = c.metrics || {};
              const cost = c.spent || m.cost || 0;
              const roi = cost ? Math.round(((m.wonRevenue||0) - cost) / cost * 100) : 0;
              return `<tr class="cursor-pointer" onclick="Views.marketing.openCampaign('${c.id}')">
                <td>
                  <div class="font-medium">${U.esc(c.name)}</div>
                  <div class="text-xs text-ink-300">${U.esc(c.type)}</div>
                </td>
                <td><span class="badge badge-slate">${U.esc(c.channel)}</span></td>
                <td><span class="badge ${this.STATUS_BADGE[c.status]||'badge-slate'}">${U.esc(c.status)}</span></td>
                <td class="text-xs text-ink-400">${U.date(c.startDate)} → ${c.endDate?U.date(c.endDate):'—'}</td>
                <td class="text-right">${m.contacts||0}</td>
                <td class="text-right">${(m.mqls||0)+' / '+(m.sqls||0)}</td>
                <td class="text-right">${U.usd(cost)}</td>
                <td class="text-right font-medium">${U.usd(m.wonRevenue||0)}</td>
                <td class="text-right ${roi>=0?'text-emerald-700':'text-rose-700'}">${roi>=0?'+':''}${roi}%</td>
              </tr>`;
            }).join('') || '<tr><td colspan="9" class="text-center text-ink-300 py-8">No campaigns match.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  openCampaign(id) {
    const c = DB.findCampaign(id); if (!c) return;
    const m = c.metrics || {};
    const cost = c.spent || m.cost || 0;
    const roi = cost ? Math.round(((m.wonRevenue||0) - cost) / cost * 100) : 0;
    const conv = m.contacts ? Math.round((m.wonRevenue||0) / m.contacts) : 0;
    const contacts = DB.marketingContacts().filter(x => x.campaignId === id);
    const body = `
      <div class="flex items-start justify-between mb-4">
        <div>
          <div class="text-xs text-ink-300 uppercase tracking-wider">${U.esc(c.type)} · ${U.esc(c.channel)}</div>
          <div class="text-xl font-display font-semibold">${U.esc(c.name)}</div>
          <div class="text-sm text-ink-400 mt-1">${U.esc(c.description||'')}</div>
        </div>
        <span class="badge ${this.STATUS_BADGE[c.status]||'badge-slate'}">${U.esc(c.status)}</span>
      </div>

      <div class="grid grid-cols-4 gap-3 mb-4">
        <div class="stat-card !p-3"><div class="stat-label">Contacts</div><div class="stat-value text-lg">${m.contacts||0}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">MQL / SQL</div><div class="stat-value text-lg">${(m.mqls||0)+' / '+(m.sqls||0)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Opportunities</div><div class="stat-value text-lg">${m.opportunities||0}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Won Revenue</div><div class="stat-value text-lg">${U.usd(m.wonRevenue||0)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Budget</div><div class="stat-value text-lg">${U.usd(c.budget||0)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Spent</div><div class="stat-value text-lg">${U.usd(cost)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">ROI</div><div class="stat-value text-lg ${roi>=0?'text-emerald-700':'text-rose-700'}">${roi>=0?'+':''}${roi}%</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Rev / Contact</div><div class="stat-value text-lg">${U.usd(conv)}</div></div>
      </div>

      <div class="card mb-4">
        <div class="card-header"><div class="card-title">Attributed Contacts (${contacts.length})</div></div>
        <table class="tbl">
          <thead><tr><th>Name</th><th>Company</th><th>Stage</th><th class="text-right">Score</th><th>Status</th></tr></thead>
          <tbody>
            ${contacts.map(x => `
              <tr class="cursor-pointer" onclick="U.closeModals(); Views.marketing.openContact('${x.id}')">
                <td class="font-medium">${U.esc(x.firstName+' '+x.lastName)}</td>
                <td>${U.esc(x.company||'')}</td>
                <td><span class="badge ${this.LIFECYCLE_BADGE[x.lifecycleStage]}">${this.LIFECYCLE_LABEL[x.lifecycleStage]}</span></td>
                <td class="text-right">${x.score||0}</td>
                <td>${x.accountId?`<a class="text-brand-600" onclick="event.stopPropagation(); U.closeModals(); Views.accounts.open('${x.accountId}')">${x.accountId}</a>`:'—'}</td>
              </tr>`).join('') || '<tr><td colspan="5" class="text-center text-ink-300 py-6">No contacts on this campaign.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary text-rose-600" onclick="Views.marketing.deleteCampaign('${id}')">Delete</button>
      <button class="btn-primary" onclick="Views.marketing.editCampaign('${id}')">Edit</button>`;
    const m2 = U.modal({ title: 'Campaign', body, footer, size: 'lg' });
    m2.el.querySelector('[data-close]').addEventListener('click', m2.close);
  },

  newCampaign() { this.editCampaign(null); },

  editCampaign(id) {
    const c = id ? DB.findCampaign(id) : {
      id: U.uid('MC'), name:'', type:'Outbound Email', channel:'Email', status:'active',
      startDate:new Date().toISOString().slice(0,10), endDate:'', budget:0, spent:0,
      description:'', ownerId:'U-1', tags:[], metrics:{contacts:0,mqls:0,sqls:0,opportunities:0,wonRevenue:0,cost:0,impressions:0,clicks:0},
    };
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Name</div><input id="c-name" class="field-input" value="${U.esc(c.name)}"></div>
        <div><div class="field-label">Type</div>
          <select id="c-type" class="field-select">
            ${['Outbound Email','Inbound','Newsletter','Paid Social','Paid Search','Event','Referral','Direct Mail','Content','Other']
              .map(t => `<option ${t===c.type?'selected':''}>${t}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Channel</div>
          <select id="c-channel" class="field-select">
            ${['Email','Website','LinkedIn','Facebook','Google','Trade Show','Partner','Direct Mail','Other']
              .map(t => `<option ${t===c.channel?'selected':''}>${t}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Status</div>
          <select id="c-status" class="field-select">
            ${['active','scheduled','complete','paused'].map(s=>`<option ${s===c.status?'selected':''}>${s}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Goal</div>
          <select id="c-goal" class="field-select">
            ${['lead-generation','nurture','conversion','brand-awareness','retention']
              .map(g=>`<option ${g===c.goal?'selected':''}>${g}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Start Date</div><input id="c-start" type="date" class="field-input" value="${U.esc(c.startDate||'')}"></div>
        <div><div class="field-label">End Date</div><input id="c-end" type="date" class="field-input" value="${U.esc(c.endDate||'')}"></div>
        <div><div class="field-label">Budget ($)</div><input id="c-budget" type="number" class="field-input" value="${c.budget||0}"></div>
        <div><div class="field-label">Spent ($)</div><input id="c-spent" type="number" class="field-input" value="${c.spent||0}"></div>
        <div class="col-span-2"><div class="field-label">Description</div>
          <textarea id="c-desc" class="field-textarea" rows="3">${U.esc(c.description||'')}</textarea></div>
        <div class="col-span-2"><div class="field-label">Tags (comma separated)</div>
          <input id="c-tags" class="field-input" value="${U.esc((c.tags||[]).join(', '))}"></div>
      </div>`;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.marketing._saveCampaign('${c.id}', ${id?'true':'false'})">Save</button>`;
    const m = U.modal({ title: id?'Edit Campaign':'New Campaign', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _saveCampaign(id, existing) {
    const val = k => document.getElementById(k).value;
    const num = k => +val(k) || 0;
    const c = existing ? DB.findCampaign(id) : { id, metrics: { contacts:0, mqls:0, sqls:0, opportunities:0, wonRevenue:0, cost:0, impressions:0, clicks:0 } };
    c.name = val('c-name'); c.type = val('c-type'); c.channel = val('c-channel');
    c.status = val('c-status'); c.goal = val('c-goal');
    c.startDate = val('c-start'); c.endDate = val('c-end') || null;
    c.budget = num('c-budget'); c.spent = num('c-spent');
    c.description = val('c-desc');
    c.tags = val('c-tags').split(',').map(s => s.trim()).filter(Boolean);
    if (!existing) DB.campaigns().push(c);
    DB.save();
    U.closeModals();
    U.toast(existing?'Campaign updated':'Campaign created');
    this.render();
  },

  deleteCampaign(id) {
    if (!confirm('Delete this campaign? Contacts attributed to it will keep their record but lose the campaign link.')) return;
    const arr = DB.campaigns();
    const i = arr.findIndex(c => c.id === id);
    if (i >= 0) arr.splice(i, 1);
    DB.marketingContacts().forEach(x => { if (x.campaignId === id) x.campaignId = null; });
    DB.save();
    U.closeModals();
    U.toast('Campaign deleted', 'info');
    this.render();
  },

  // -------------------- CONTACTS --------------------
  _tabContacts() {
    const f = this._contactFilters;
    const list = DB.marketingContacts().filter(c => {
      if (f.stage && c.lifecycleStage !== f.stage) return false;
      if (f.source && c.source !== f.source) return false;
      if (f.list) {
        const L = DB.findMarketingList(f.list);
        if (L) {
          const inList = L.type === 'static'
            ? (L.contactIds||[]).includes(c.id)
            : this._matchesFilters(c, L.filters||[]);
          if (!inList) return false;
        }
      }
      if (f.search) {
        const q = f.search.toLowerCase();
        const s = [c.firstName,c.lastName,c.email,c.company,c.title,(c.tags||[]).join(' ')].join(' ').toLowerCase();
        if (!s.includes(q)) return false;
      }
      return true;
    });
    return `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <input class="field-input md:col-span-2" placeholder="Search name, email, company, tag…"
          value="${U.esc(f.search)}"
          oninput="Views.marketing._contactFilters.search=this.value; document.getElementById('mk-body').innerHTML = Views.marketing._tabContacts();">
        <select class="field-select" onchange="Views.marketing._contactFilters.stage=this.value; document.getElementById('mk-body').innerHTML = Views.marketing._tabContacts();">
          <option value="">All stages</option>
          ${this.LIFECYCLE_STAGES.map(s => `<option value="${s}" ${f.stage===s?'selected':''}>${this.LIFECYCLE_LABEL[s]}</option>`).join('')}
        </select>
        <select class="field-select" onchange="Views.marketing._contactFilters.source=this.value; document.getElementById('mk-body').innerHTML = Views.marketing._tabContacts();">
          <option value="">All sources</option>
          ${this.SOURCES.map(s => `<option value="${s}" ${f.source===s?'selected':''}>${U.esc(s)}</option>`).join('')}
        </select>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="text-xs text-ink-400">${list.length} of ${DB.marketingContacts().length} contact${list.length===1?'':'s'}</div>
          <button class="btn-primary" onclick="Views.marketing.newContact()">+ Add Contact</button>
        </div>
        <table class="tbl">
          <thead><tr>
            <th>Name</th><th>Company / Title</th><th>Stage</th><th>Source</th>
            <th class="text-right">Score</th><th>Last Activity</th><th>Status</th>
          </tr></thead>
          <tbody>
            ${list.map(c => `
              <tr class="cursor-pointer" onclick="Views.marketing.openContact('${c.id}')">
                <td>
                  <div class="font-medium">${U.esc(c.firstName+' '+c.lastName)}</div>
                  <div class="text-xs text-ink-300">${U.esc(c.email||'')}</div>
                </td>
                <td>
                  <div>${U.esc(c.company||'')}</div>
                  <div class="text-xs text-ink-300">${U.esc(c.title||'')}</div>
                </td>
                <td><span class="badge ${this.LIFECYCLE_BADGE[c.lifecycleStage]}">${this.LIFECYCLE_LABEL[c.lifecycleStage]}</span></td>
                <td class="text-xs">${U.esc(c.source||'—')}${c.campaignId?`<div class="text-[10px] text-ink-300">${U.esc((DB.findCampaign(c.campaignId)||{}).name||'')}</div>`:''}</td>
                <td class="text-right">
                  <span class="font-medium ${c.score>=60?'text-emerald-700':c.score>=30?'text-amber-700':'text-ink-400'}">${c.score||0}</span>
                </td>
                <td class="text-xs text-ink-400">${U.date(c.lastActivity)}</td>
                <td>${c.accountId?`<a class="text-brand-600 text-xs" onclick="event.stopPropagation(); Views.accounts.open('${c.accountId}')">${c.accountId}</a>`:c.leadId?`<a class="text-brand-600 text-xs" onclick="event.stopPropagation(); Views.leads.open('${c.leadId}')">${c.leadId}</a>`:'<span class="text-xs text-ink-300">—</span>'}</td>
              </tr>`).join('') || '<tr><td colspan="7" class="text-center text-ink-300 py-8">No contacts match.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  _matchesFilters(c, filters) {
    return filters.every(f => {
      const v = c[f.field];
      switch (f.op) {
        case 'equals':    return v == f.value;
        case 'notEquals': return v != f.value;
        case 'gte':       return (+v||0) >= +f.value;
        case 'lte':       return (+v||0) <= +f.value;
        case 'includes':  return Array.isArray(v) ? v.includes(f.value) : (v||'').includes(f.value);
        default: return true;
      }
    });
  },

  openContact(id) {
    const c = DB.findMarketingContact(id); if (!c) return;
    const camp = c.campaignId ? DB.findCampaign(c.campaignId) : null;
    const acts = (c.activity || []).slice().sort((a,b) => (b.date||'').localeCompare(a.date||''));
    const memberships = DB.marketingLists().filter(L => L.type === 'static'
      ? (L.contactIds||[]).includes(c.id)
      : this._matchesFilters(c, L.filters||[]));
    const body = `
      <div class="flex items-start justify-between mb-3">
        <div>
          <div class="text-xs text-ink-300 uppercase tracking-wider">Marketing Contact</div>
          <div class="text-xl font-display font-semibold">${U.esc(c.firstName+' '+c.lastName)}</div>
          <div class="text-sm text-ink-400">${U.esc(c.title||'')}${c.company?` · ${U.esc(c.company)}`:''}</div>
          <div class="text-xs text-ink-400 mt-1"><a href="mailto:${U.esc(c.email)}" class="text-brand-600">${U.esc(c.email)}</a>${c.phone?` · ${U.esc(c.phone)}`:''}</div>
        </div>
        <div class="text-right">
          <span class="badge ${this.LIFECYCLE_BADGE[c.lifecycleStage]}">${this.LIFECYCLE_LABEL[c.lifecycleStage]}</span>
          <div class="text-2xl font-display font-semibold text-ink-700 mt-2">${c.score||0}</div>
          <div class="text-[10px] text-ink-300 uppercase tracking-wider">Score</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="stat-card !p-3"><div class="stat-label">Source</div><div class="text-sm font-medium mt-1">${U.esc(c.source||'—')}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Campaign</div><div class="text-sm font-medium mt-1">${camp?U.esc(camp.name):'—'}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Converted To</div>
          <div class="text-sm font-medium mt-1">${c.accountId?`<a class="text-brand-600" onclick="U.closeModals(); Views.accounts.open('${c.accountId}')">${c.accountId}</a>`:c.leadId?`<a class="text-brand-600" onclick="U.closeModals(); Views.leads.open('${c.leadId}')">${c.leadId}</a>`:'<span class="text-ink-300">Not yet</span>'}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Tags</div></div>
          <div class="p-3 flex flex-wrap gap-1">
            ${(c.tags||[]).map(t => `<span class="badge badge-slate">${U.esc(t)}</span>`).join('') || '<div class="text-xs text-ink-300 italic">No tags</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">List Memberships (${memberships.length})</div></div>
          <div class="p-3 flex flex-wrap gap-1">
            ${memberships.map(L => `<span class="badge badge-blue">${U.esc(L.name)}</span>`).join('') || '<div class="text-xs text-ink-300 italic">Not on any list</div>'}
          </div>
        </div>
      </div>

      ${c.utm && (c.utm.source || c.utm.medium || c.utm.campaign) ? `
        <div class="card mb-4">
          <div class="card-header"><div class="card-title">UTM Parameters</div></div>
          <div class="p-3 grid grid-cols-3 gap-3 text-sm">
            <div><div class="field-label">Source</div>${U.esc(c.utm.source||'—')}</div>
            <div><div class="field-label">Medium</div>${U.esc(c.utm.medium||'—')}</div>
            <div><div class="field-label">Campaign</div>${U.esc(c.utm.campaign||'—')}</div>
          </div>
        </div>` : ''}

      <div class="card">
        <div class="card-header"><div class="card-title">Activity Timeline</div>
          <span class="text-xs text-ink-300">${acts.length} event${acts.length===1?'':'s'}</span></div>
        <div class="p-4 space-y-3 max-h-80 overflow-y-auto">
          ${acts.map(a => {
            const icons = { created:'🆕', email_open:'✉️', email_click:'🔗', form:'📝', meeting:'📞', reply:'💬', converted:'⭐', note:'📌' };
            return `<div class="flex gap-3 border-l-2 border-cream-300 pl-3">
              <div>${icons[a.type]||'•'}</div>
              <div class="flex-1">
                <div class="text-xs text-ink-400">${U.date(a.date)} · ${U.esc(a.type)}</div>
                <div class="text-sm">${U.esc(a.text)}</div>
              </div>
            </div>`;
          }).join('') || '<div class="text-sm text-ink-300 italic">No activity yet.</div>'}
        </div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary text-rose-600" onclick="Views.marketing.deleteContact('${id}')">Delete</button>
      <button class="btn-secondary" onclick="Compose.open({ to: '${U.esc(c.email)}' })">✉ Email</button>
      ${c.accountId ? '' : `<button class="btn-secondary" onclick="Views.marketing._contactToLead('${id}')">Convert to Lead</button>`}
      <button class="btn-primary" onclick="Views.marketing.editContact('${id}')">Edit</button>`;
    const m = U.modal({ title: 'Contact', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  newContact() { this.editContact(null); },

  editContact(id) {
    const c = id ? DB.findMarketingContact(id) : {
      id: U.uid('MK-C'), firstName:'', lastName:'', email:'', phone:'', company:'', title:'',
      source:'Cold Outreach', campaignId:null, lifecycleStage:'lead', leadStatus:'new', score:0,
      tags:[], createdDate:new Date().toISOString().slice(0,10),
      lastActivity:new Date().toISOString().slice(0,10),
      accountId:null, leadId:null, utm:{ source:'', medium:'', campaign:'' }, activity:[],
    };
    const camps = DB.campaigns();
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">First Name</div><input id="mc-first" class="field-input" value="${U.esc(c.firstName)}"></div>
        <div><div class="field-label">Last Name</div><input id="mc-last"  class="field-input" value="${U.esc(c.lastName)}"></div>
        <div><div class="field-label">Email</div><input id="mc-email" class="field-input" value="${U.esc(c.email)}"></div>
        <div><div class="field-label">Phone</div><input id="mc-phone" class="field-input" value="${U.esc(c.phone||'')}"></div>
        <div><div class="field-label">Company</div><input id="mc-company" class="field-input" value="${U.esc(c.company||'')}"></div>
        <div><div class="field-label">Title</div><input id="mc-title" class="field-input" value="${U.esc(c.title||'')}"></div>
        <div><div class="field-label">Lifecycle Stage</div>
          <select id="mc-stage" class="field-select">
            ${this.LIFECYCLE_STAGES.map(s=>`<option value="${s}" ${s===c.lifecycleStage?'selected':''}>${this.LIFECYCLE_LABEL[s]}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Score</div><input id="mc-score" type="number" class="field-input" value="${c.score||0}"></div>
        <div><div class="field-label">Source</div>
          <select id="mc-source" class="field-select">
            ${this.SOURCES.map(s=>`<option value="${s}" ${s===c.source?'selected':''}>${U.esc(s)}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Campaign</div>
          <select id="mc-camp" class="field-select">
            <option value="">— None —</option>
            ${camps.map(x=>`<option value="${x.id}" ${x.id===c.campaignId?'selected':''}>${U.esc(x.name)}</option>`).join('')}
          </select></div>
        <div class="col-span-2"><div class="field-label">Tags (comma separated)</div>
          <input id="mc-tags" class="field-input" value="${U.esc((c.tags||[]).join(', '))}"></div>
        <div><div class="field-label">UTM Source</div><input id="mc-utm-src" class="field-input" value="${U.esc((c.utm||{}).source||'')}"></div>
        <div><div class="field-label">UTM Medium</div><input id="mc-utm-med" class="field-input" value="${U.esc((c.utm||{}).medium||'')}"></div>
        <div class="col-span-2"><div class="field-label">UTM Campaign</div><input id="mc-utm-cmp" class="field-input" value="${U.esc((c.utm||{}).campaign||'')}"></div>
      </div>`;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.marketing._saveContact('${c.id}', ${id?'true':'false'})">Save</button>`;
    const m = U.modal({ title: id?'Edit Contact':'New Contact', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _saveContact(id, existing) {
    const val = k => document.getElementById(k).value;
    const c = existing ? DB.findMarketingContact(id) : { id, activity:[], accountId:null, leadId:null, createdDate:new Date().toISOString().slice(0,10) };
    c.firstName = val('mc-first'); c.lastName = val('mc-last');
    c.email = val('mc-email'); c.phone = val('mc-phone');
    c.company = val('mc-company'); c.title = val('mc-title');
    c.lifecycleStage = val('mc-stage'); c.score = +val('mc-score') || 0;
    c.source = val('mc-source'); c.campaignId = val('mc-camp') || null;
    c.tags = val('mc-tags').split(',').map(s => s.trim()).filter(Boolean);
    c.utm = { source: val('mc-utm-src'), medium: val('mc-utm-med'), campaign: val('mc-utm-cmp') };
    c.lastActivity = new Date().toISOString().slice(0,10);
    if (!existing) {
      c.activity = [{ date: c.createdDate, type: 'created', text: 'Contact created manually.' }];
      DB.marketingContacts().push(c);
    }
    DB.save();
    U.closeModals();
    U.toast(existing?'Contact updated':'Contact created');
    this.render();
  },

  deleteContact(id) {
    if (!confirm('Delete this marketing contact?')) return;
    const arr = DB.marketingContacts();
    const i = arr.findIndex(c => c.id === id);
    if (i >= 0) arr.splice(i, 1);
    DB.save();
    U.closeModals();
    U.toast('Contact deleted', 'info');
    this.render();
  },

  _contactToLead(id) {
    const c = DB.findMarketingContact(id); if (!c) return;
    const lead = {
      id: U.uid('L'),
      companyName: c.company || (c.firstName+' '+c.lastName),
      contactName: c.firstName+' '+c.lastName,
      contactTitle: c.title || '',
      email: c.email, phone: c.phone || '',
      city: '', state: '',
      industry: '', naics: '',
      leadSource: c.source, referredBy: '',
      estimatedAnnualPremium: null,
      notes: `Converted from marketing contact ${c.id}.`,
      bondTypes: [], stage: 'New Lead', probability: 30, status: 'open',
      owner: 'CV', producer: 'CV',
      createdDate: new Date().toISOString().slice(0,10),
      lastTouch:   new Date().toISOString().slice(0,10),
      nextFollowUp: null, activity: [], convertedAccountId: null,
    };
    DB.leads().push(lead);
    c.leadId = lead.id;
    c.lifecycleStage = 'sql';
    c.activity = c.activity || [];
    c.activity.push({ date: new Date().toISOString().slice(0,10), type: 'converted', text: `Converted to lead ${lead.id}.` });
    DB.save();
    U.closeModals();
    U.toast('Contact converted to lead');
    App.go('leads');
    setTimeout(() => Views.leads.open(lead.id), 60);
  },

  // -------------------- LISTS --------------------
  _tabLists() {
    const lists = DB.marketingLists();
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-400">Segments that group contacts for campaigns and email blasts. Static lists are frozen; dynamic lists re-evaluate on every render.</div>
        <button class="btn-primary" onclick="Views.marketing.newList()">+ New List</button>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        ${lists.map(L => {
          const members = L.type === 'static'
            ? (L.contactIds||[]).length
            : DB.marketingContacts().filter(c => this._matchesFilters(c, L.filters||[])).length;
          return `<div class="card cursor-pointer" onclick="Views.marketing.openList('${L.id}')">
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-semibold text-ink-700">${U.esc(L.name)}</div>
                  <div class="text-xs text-ink-400 mt-1">${U.esc(L.description||'')}</div>
                </div>
                <span class="badge ${L.type==='static'?'badge-slate':'badge-blue'}">${L.type}</span>
              </div>
              <div class="flex items-center justify-between mt-3">
                <div class="text-2xl font-display font-semibold text-brand-700">${members}</div>
                <div class="text-xs text-ink-300">${members===1?'contact':'contacts'} · created ${U.date(L.createdDate)}</div>
              </div>
            </div>
          </div>`;
        }).join('') || '<div class="col-span-2 card p-8 text-center text-ink-300">No lists yet.</div>'}
      </div>
    `;
  },

  openList(id) {
    const L = DB.findMarketingList(id); if (!L) return;
    const members = L.type === 'static'
      ? DB.marketingContacts().filter(c => (L.contactIds||[]).includes(c.id))
      : DB.marketingContacts().filter(c => this._matchesFilters(c, L.filters||[]));
    const body = `
      <div class="mb-3">
        <div class="text-xs uppercase tracking-wider text-ink-300">${L.type} list</div>
        <div class="text-xl font-display font-semibold">${U.esc(L.name)}</div>
        <div class="text-sm text-ink-400 mt-1">${U.esc(L.description||'')}</div>
      </div>
      ${L.type === 'dynamic' && (L.filters||[]).length ? `
        <div class="card mb-3">
          <div class="card-header"><div class="card-title">Filters</div></div>
          <div class="p-3 space-y-1 text-sm">
            ${L.filters.map(f => `<div class="text-ink-500"><b>${U.esc(f.field)}</b> ${f.op} <span class="font-mono">${U.esc(f.value)}</span></div>`).join('')}
          </div>
        </div>` : ''}
      <div class="card">
        <div class="card-header"><div class="card-title">Members (${members.length})</div>
          <button class="btn-ghost" onclick="Views.marketing._exportList('${id}')">Export CSV</button></div>
        <table class="tbl">
          <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Stage</th><th class="text-right">Score</th></tr></thead>
          <tbody>
            ${members.map(c => `
              <tr class="cursor-pointer" onclick="U.closeModals(); Views.marketing.openContact('${c.id}')">
                <td class="font-medium">${U.esc(c.firstName+' '+c.lastName)}</td>
                <td class="text-xs">${U.esc(c.email)}</td>
                <td>${U.esc(c.company||'')}</td>
                <td><span class="badge ${this.LIFECYCLE_BADGE[c.lifecycleStage]}">${this.LIFECYCLE_LABEL[c.lifecycleStage]}</span></td>
                <td class="text-right">${c.score||0}</td>
              </tr>`).join('') || '<tr><td colspan="5" class="text-center text-ink-300 py-6">No members.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary text-rose-600" onclick="Views.marketing.deleteList('${id}')">Delete</button>
      <button class="btn-primary" onclick="Views.marketing._blastFromList('${id}')">Send Blast to List</button>`;
    const m = U.modal({ title: 'List', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  newList() {
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Name</div><input id="ml-name" class="field-input"></div>
        <div class="col-span-2"><div class="field-label">Description</div>
          <textarea id="ml-desc" class="field-textarea" rows="2"></textarea></div>
        <div><div class="field-label">Type</div>
          <select id="ml-type" class="field-select">
            <option value="static">Static — you pick members</option>
            <option value="dynamic">Dynamic — filter-based</option>
          </select></div>
      </div>
      <div class="text-xs text-ink-300 mt-3 italic">Dynamic filters can be added after the list is created.</div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.marketing._createList()">Create</button>`;
    const m = U.modal({ title: 'New List', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _createList() {
    const L = {
      id: U.uid('ML'),
      name: document.getElementById('ml-name').value || 'Untitled List',
      description: document.getElementById('ml-desc').value,
      type: document.getElementById('ml-type').value,
      contactIds: [], filters: [],
      createdDate: new Date().toISOString().slice(0,10),
    };
    DB.marketingLists().push(L);
    DB.save();
    U.closeModals();
    U.toast('List created');
    this.render();
  },

  deleteList(id) {
    if (!confirm('Delete this list?')) return;
    const arr = DB.marketingLists();
    const i = arr.findIndex(L => L.id === id);
    if (i >= 0) arr.splice(i, 1);
    DB.save();
    U.closeModals();
    U.toast('List deleted', 'info');
    this.render();
  },

  _exportList(id) {
    const L = DB.findMarketingList(id); if (!L) return;
    const members = L.type === 'static'
      ? DB.marketingContacts().filter(c => (L.contactIds||[]).includes(c.id))
      : DB.marketingContacts().filter(c => this._matchesFilters(c, L.filters||[]));
    const rows = [['First','Last','Email','Company','Title','Phone','Stage','Score','Source','Campaign']];
    members.forEach(c => rows.push([
      c.firstName, c.lastName, c.email, c.company||'', c.title||'', c.phone||'',
      c.lifecycleStage, c.score||0, c.source||'', (DB.findCampaign(c.campaignId)||{}).name||''
    ]));
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${L.name}.csv`; a.click();
    U.toast('Exported');
  },

  _blastFromList(id) {
    this._setTab('emails');
    setTimeout(() => this.newBlast(id), 30);
  },

  // -------------------- EMAIL BLASTS --------------------
  _tabEmailBlasts() {
    const blasts = DB.emailBlasts();
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-400">Bulk email sends. Track opens, clicks, unsubscribes, and bounces per campaign.</div>
        <button class="btn-primary" onclick="Views.marketing.newBlast()">+ New Blast</button>
      </div>
      <div class="card">
        <table class="tbl">
          <thead><tr>
            <th>Blast</th><th>Subject</th><th>List</th><th>Status</th><th>Sent</th>
            <th class="text-right">Sent #</th><th class="text-right">Open %</th>
            <th class="text-right">Click %</th><th class="text-right">Unsub / Bounce</th>
          </tr></thead>
          <tbody>
            ${blasts.map(b => {
              const L = DB.findMarketingList(b.listId);
              const openPct = b.stats?.sent ? Math.round(b.stats.opens / b.stats.sent * 100) : 0;
              const clickPct = b.stats?.opens ? Math.round(b.stats.clicks / b.stats.opens * 100) : 0;
              return `<tr class="cursor-pointer" onclick="Views.marketing.openBlast('${b.id}')">
                <td class="font-medium">${U.esc(b.name)}</td>
                <td class="text-xs">${U.esc(b.subject||'—')}</td>
                <td class="text-xs">${L?U.esc(L.name):'—'}</td>
                <td><span class="badge ${this.STATUS_BADGE[b.status]||'badge-slate'}">${U.esc(b.status)}</span></td>
                <td class="text-xs">${U.date(b.sentDate)}</td>
                <td class="text-right">${(b.stats?.sent||0).toLocaleString()}</td>
                <td class="text-right">${openPct}%</td>
                <td class="text-right">${clickPct}%</td>
                <td class="text-right text-xs">${b.stats?.unsubscribes||0} / ${b.stats?.bounces||0}</td>
              </tr>`;
            }).join('') || '<tr><td colspan="9" class="text-center text-ink-300 py-8">No email blasts yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  openBlast(id) {
    const b = DB.findEmailBlast(id); if (!b) return;
    const L = DB.findMarketingList(b.listId);
    const s = b.stats || {};
    const openPct = s.sent ? Math.round(s.opens / s.sent * 100) : 0;
    const clickPct = s.opens ? Math.round(s.clicks / s.opens * 100) : 0;
    const clickThroughPct = s.sent ? Math.round(s.clicks / s.sent * 100) : 0;
    const bouncePct = s.sent ? Math.round((s.bounces||0) / s.sent * 100) : 0;
    const body = `
      <div class="flex items-start justify-between mb-4">
        <div>
          <div class="text-xs text-ink-300 uppercase tracking-wider">Email Blast</div>
          <div class="text-xl font-display font-semibold">${U.esc(b.name)}</div>
          <div class="text-sm text-ink-400 mt-1">Subject: <span class="font-mono">${U.esc(b.subject||'—')}</span></div>
          <div class="text-xs text-ink-400 mt-1">From ${U.esc(b.fromName||'')} &lt;${U.esc(b.fromEmail||'')}&gt;${L?` · to <b>${U.esc(L.name)}</b>`:''}${b.sentDate?` · sent ${U.date(b.sentDate)}`:''}</div>
        </div>
        <span class="badge ${this.STATUS_BADGE[b.status]||'badge-slate'}">${U.esc(b.status)}</span>
      </div>

      <div class="grid grid-cols-4 gap-3 mb-4">
        <div class="stat-card !p-3"><div class="stat-label">Sent</div><div class="stat-value text-lg">${(s.sent||0).toLocaleString()}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Delivered</div><div class="stat-value text-lg">${(s.delivered||0).toLocaleString()}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Opens</div><div class="stat-value text-lg">${(s.opens||0).toLocaleString()}</div>
          <div class="text-[11px] text-ink-300">${openPct}%</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Clicks</div><div class="stat-value text-lg">${(s.clicks||0).toLocaleString()}</div>
          <div class="text-[11px] text-ink-300">${clickPct}% of opens · ${clickThroughPct}% CTR</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Unsubscribes</div><div class="stat-value text-lg">${s.unsubscribes||0}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Bounces</div><div class="stat-value text-lg">${s.bounces||0}</div>
          <div class="text-[11px] text-ink-300">${bouncePct}%</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Delivery Rate</div><div class="stat-value text-lg">${s.sent?Math.round((s.delivered||0)/s.sent*100):0}%</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Engagement</div><div class="stat-value text-lg">${s.sent?Math.round(((s.opens||0)+(s.clicks||0))/s.sent*100):0}%</div></div>
      </div>

      ${b.preview ? `<div class="card mb-3"><div class="card-header"><div class="card-title">Preview</div></div>
        <div class="p-4 text-sm text-ink-500 whitespace-pre-line">${U.esc(b.preview)}</div></div>` : ''}
    `;
    const footer = `<button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary text-rose-600" onclick="Views.marketing.deleteBlast('${id}')">Delete</button>
      ${b.status !== 'sent' ? `<button class="btn-primary" onclick="Views.marketing._sendBlast('${id}')">Send Now</button>` : ''}`;
    const m = U.modal({ title: 'Email Blast', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  newBlast(preselectListId) {
    const lists = DB.marketingLists();
    const templates = DB.templates ? DB.templates() : [];
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Name (internal)</div><input id="mb-name" class="field-input"></div>
        <div class="col-span-2"><div class="field-label">Subject</div><input id="mb-subject" class="field-input"></div>
        <div><div class="field-label">From Name</div><input id="mb-from-name" class="field-input" value="Casey Vanderbeck"></div>
        <div><div class="field-label">From Email</div><input id="mb-from-email" class="field-input" value="casey@vanderbeck-surety.example"></div>
        <div><div class="field-label">Send to List</div>
          <select id="mb-list" class="field-select">
            <option value="">— Select list —</option>
            ${lists.map(L => `<option value="${L.id}" ${preselectListId===L.id?'selected':''}>${U.esc(L.name)}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Load Template (optional)</div>
          <select id="mb-tpl" class="field-select" onchange="Views.marketing._loadBlastTemplate(this.value)">
            <option value="">—</option>
            ${templates.map(t => `<option value="${t.id}">${U.esc(t.name)}</option>`).join('')}
          </select></div>
        <div class="col-span-2"><div class="field-label">Body Preview</div>
          <textarea id="mb-preview" class="field-textarea" rows="6" placeholder="Hi {{firstName}}, ..."></textarea></div>
      </div>`;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-secondary" onclick="Views.marketing._saveBlast(false)">Save Draft</button>
      <button class="btn-primary" onclick="Views.marketing._saveBlast(true)">Send Now</button>`;
    const m = U.modal({ title: 'New Email Blast', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _loadBlastTemplate(tid) {
    if (!tid) return;
    const t = (DB.templates() || []).find(x => x.id === tid);
    if (!t) return;
    document.getElementById('mb-subject').value = t.subject || '';
    document.getElementById('mb-preview').value = t.body || '';
  },

  _saveBlast(send) {
    const val = k => document.getElementById(k).value;
    const listId = val('mb-list');
    if (send && !listId) { U.toast('Pick a list first', 'warn'); return; }
    const L = listId ? DB.findMarketingList(listId) : null;
    const members = L
      ? (L.type === 'static'
          ? DB.marketingContacts().filter(c => (L.contactIds||[]).includes(c.id))
          : DB.marketingContacts().filter(c => this._matchesFilters(c, L.filters||[])))
      : [];
    const sent = send ? members.length : 0;
    // Simulated engagement — realistic ratios
    const stats = send
      ? { sent, delivered: Math.round(sent * 0.96), opens: Math.round(sent * 0.42), clicks: Math.round(sent * 0.11), unsubscribes: Math.max(0, Math.round(sent * 0.005)), bounces: Math.max(0, sent - Math.round(sent * 0.96)) }
      : { sent: 0, delivered: 0, opens: 0, clicks: 0, unsubscribes: 0, bounces: 0 };
    const b = {
      id: U.uid('MB'),
      name: val('mb-name') || 'Untitled Blast',
      subject: val('mb-subject'),
      fromName: val('mb-from-name'), fromEmail: val('mb-from-email'),
      listId: listId || null,
      status: send ? 'sent' : 'draft',
      sentDate: send ? new Date().toISOString().slice(0,10) : null,
      preview: val('mb-preview'),
      stats,
    };
    DB.emailBlasts().push(b);
    if (send) {
      members.forEach(c => {
        c.activity = c.activity || [];
        c.activity.push({ date: b.sentDate, type: 'email_open', text: `Delivered "${b.name}".` });
        c.lastActivity = b.sentDate;
      });
    }
    DB.save();
    U.closeModals();
    U.toast(send ? `Blast sent to ${sent} contact${sent===1?'':'s'}` : 'Draft saved');
    this.render();
  },

  _sendBlast(id) {
    const b = DB.findEmailBlast(id); if (!b) return;
    const L = b.listId ? DB.findMarketingList(b.listId) : null;
    if (!L) { U.toast('This blast has no list', 'warn'); return; }
    const members = L.type === 'static'
      ? DB.marketingContacts().filter(c => (L.contactIds||[]).includes(c.id))
      : DB.marketingContacts().filter(c => this._matchesFilters(c, L.filters||[]));
    const sent = members.length;
    b.status = 'sent';
    b.sentDate = new Date().toISOString().slice(0,10);
    b.stats = { sent, delivered: Math.round(sent*0.96), opens: Math.round(sent*0.42), clicks: Math.round(sent*0.11), unsubscribes: Math.max(0, Math.round(sent*0.005)), bounces: Math.max(0, sent - Math.round(sent*0.96)) };
    members.forEach(c => {
      c.activity = c.activity || [];
      c.activity.push({ date: b.sentDate, type: 'email_open', text: `Delivered "${b.name}".` });
      c.lastActivity = b.sentDate;
    });
    DB.save();
    U.closeModals();
    U.toast(`Blast sent to ${sent} contact${sent===1?'':'s'}`);
    this.render();
  },

  deleteBlast(id) {
    if (!confirm('Delete this blast? Sent stats will be lost.')) return;
    const arr = DB.emailBlasts();
    const i = arr.findIndex(b => b.id === id);
    if (i >= 0) arr.splice(i, 1);
    DB.save();
    U.closeModals();
    U.toast('Blast deleted', 'info');
    this.render();
  },

  // -------------------- LANDING PAGES --------------------
  _tabLandingPages() {
    const pages = DB.landingPages();
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-400">Standalone pages that capture leads. Each links to an intake form or a downloadable asset.</div>
        <button class="btn-primary" onclick="Views.marketing.newLandingPage()">+ New Landing Page</button>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
        ${pages.map(p => {
          const camp = DB.findCampaign(p.campaignId);
          return `<div class="card">
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-semibold">${U.esc(p.name)}</div>
                  <a class="text-xs text-brand-600 hover:underline" href="${U.esc(p.url)}" target="_blank">${U.esc(p.url)}</a>
                </div>
                <span class="text-xs text-ink-300">${U.date(p.publishedDate)}</span>
              </div>
              <div class="mt-3 grid grid-cols-3 gap-2 text-center">
                <div><div class="text-lg font-display font-semibold text-ink-700">${p.stats?.visits||0}</div>
                  <div class="text-[10px] text-ink-300 uppercase tracking-wider">Visits</div></div>
                <div><div class="text-lg font-display font-semibold text-ink-700">${p.stats?.submissions||0}</div>
                  <div class="text-[10px] text-ink-300 uppercase tracking-wider">Submits</div></div>
                <div><div class="text-lg font-display font-semibold text-emerald-700">${p.stats?.conversionRate||0}%</div>
                  <div class="text-[10px] text-ink-300 uppercase tracking-wider">Conv.</div></div>
              </div>
              ${camp?`<div class="text-[11px] text-ink-300 mt-3">Campaign: ${U.esc(camp.name)}</div>`:''}
              ${p.formType?`<div class="text-[11px] text-ink-300 mt-1">Intake: <span class="font-mono">${U.esc(p.formType)}</span></div>`:''}
              <div class="mt-3 flex gap-1 justify-end">
                <button class="btn-ghost" onclick="Views.marketing.editLandingPage('${p.id}')">Edit</button>
                <button class="btn-ghost text-rose-600" onclick="Views.marketing.deleteLandingPage('${p.id}')">Delete</button>
              </div>
            </div>
          </div>`;
        }).join('') || '<div class="col-span-3 card p-8 text-center text-ink-300">No landing pages yet.</div>'}
      </div>
    `;
  },

  newLandingPage() { this.editLandingPage(null); },

  editLandingPage(id) {
    const p = id ? DB.findLandingPage(id) : {
      id: U.uid('LP'), name:'', slug:'', url:'', formType:'', campaignId:null,
      publishedDate: new Date().toISOString().slice(0,10),
      stats: { visits: 0, submissions: 0, conversionRate: 0 },
    };
    const camps = DB.campaigns();
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Name</div><input id="lp-name" class="field-input" value="${U.esc(p.name)}"></div>
        <div><div class="field-label">Slug</div><input id="lp-slug" class="field-input" value="${U.esc(p.slug)}"></div>
        <div><div class="field-label">Published Date</div><input id="lp-date" type="date" class="field-input" value="${U.esc(p.publishedDate||'')}"></div>
        <div class="col-span-2"><div class="field-label">URL</div><input id="lp-url" class="field-input" value="${U.esc(p.url)}"></div>
        <div><div class="field-label">Intake Form Type</div>
          <select id="lp-form" class="field-select">
            <option value="">— None —</option>
            ${['cq','pfs','wip','contractBRF','commercialBRF','subdivisionApp','bondExpress'].map(f =>
              `<option value="${f}" ${f===p.formType?'selected':''}>${f}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Campaign</div>
          <select id="lp-camp" class="field-select">
            <option value="">— None —</option>
            ${camps.map(c => `<option value="${c.id}" ${c.id===p.campaignId?'selected':''}>${U.esc(c.name)}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Visits</div><input id="lp-visits" type="number" class="field-input" value="${p.stats?.visits||0}"></div>
        <div><div class="field-label">Submissions</div><input id="lp-subs" type="number" class="field-input" value="${p.stats?.submissions||0}"></div>
      </div>`;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.marketing._saveLandingPage('${p.id}', ${id?'true':'false'})">Save</button>`;
    const m = U.modal({ title: id?'Edit Landing Page':'New Landing Page', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _saveLandingPage(id, existing) {
    const val = k => document.getElementById(k).value;
    const num = k => +val(k) || 0;
    const p = existing ? DB.findLandingPage(id) : { id, stats: {} };
    p.name = val('lp-name'); p.slug = val('lp-slug'); p.url = val('lp-url');
    p.publishedDate = val('lp-date'); p.formType = val('lp-form') || null;
    p.campaignId = val('lp-camp') || null;
    const visits = num('lp-visits'), subs = num('lp-subs');
    p.stats = { visits, submissions: subs, conversionRate: visits ? +(subs/visits*100).toFixed(1) : 0 };
    if (!existing) DB.landingPages().push(p);
    DB.save();
    U.closeModals();
    U.toast(existing?'Landing page updated':'Landing page created');
    this.render();
  },

  deleteLandingPage(id) {
    if (!confirm('Delete this landing page?')) return;
    const arr = DB.landingPages();
    const i = arr.findIndex(p => p.id === id);
    if (i >= 0) arr.splice(i, 1);
    DB.save();
    U.toast('Landing page deleted', 'info');
    this.render();
  },

  // -------------------- SEQUENCES --------------------
  _tabSequences() {
    const seqs = DB.marketingSequences();
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-400">Drip sequences that fire automatically on triggers (contact created, MQL upgrade, renewal window).</div>
        <button class="btn-primary" onclick="Views.marketing.newSequence()">+ New Sequence</button>
      </div>
      <div class="space-y-3">
        ${seqs.map(s => `
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">${U.esc(s.name)}</div>
                <div class="text-xs text-ink-300 italic mt-0.5">${U.esc(s.description||'')}</div>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge badge-slate">Trigger: ${U.esc(s.trigger)}</span>
                <span class="badge ${this.STATUS_BADGE[s.status]||'badge-slate'}">${U.esc(s.status)}</span>
              </div>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-4 gap-2 mb-3 text-center">
                <div><div class="text-xl font-display font-semibold">${s.stats?.enrolled||0}</div><div class="text-[10px] text-ink-300 uppercase tracking-wider">Enrolled</div></div>
                <div><div class="text-xl font-display font-semibold text-brand-700">${s.stats?.active||0}</div><div class="text-[10px] text-ink-300 uppercase tracking-wider">In Progress</div></div>
                <div><div class="text-xl font-display font-semibold text-emerald-700">${s.stats?.completed||0}</div><div class="text-[10px] text-ink-300 uppercase tracking-wider">Completed</div></div>
                <div><div class="text-xl font-display font-semibold text-rose-700">${s.stats?.unsubscribed||0}</div><div class="text-[10px] text-ink-300 uppercase tracking-wider">Unsub</div></div>
              </div>
              <div class="flex items-center gap-1 overflow-x-auto pb-1">
                ${(s.steps||[]).map((st, i) => `
                  <div class="flex items-center flex-shrink-0">
                    <div class="px-3 py-2 rounded-lg bg-cream-50 border border-cream-200 min-w-[180px]">
                      <div class="text-[10px] text-ink-300 uppercase tracking-wider">Day ${st.day} · ${st.type}</div>
                      <div class="text-sm font-medium">${U.esc(st.label)}</div>
                    </div>
                    ${i<s.steps.length-1?'<div class="w-4 h-0.5 bg-brand-300 mx-1"></div>':''}
                  </div>
                `).join('')}
              </div>
              <div class="mt-3 flex justify-end gap-1">
                <button class="btn-ghost" onclick="Views.marketing.editSequence('${s.id}')">Edit</button>
                <button class="btn-ghost text-rose-600" onclick="Views.marketing.deleteSequence('${s.id}')">Delete</button>
              </div>
            </div>
          </div>`).join('') || '<div class="card p-8 text-center text-ink-300">No sequences yet.</div>'}
      </div>
    `;
  },

  newSequence() { this.editSequence(null); },

  editSequence(id) {
    const s = id ? DB.findSequence(id) : {
      id: U.uid('MS'), name:'', trigger:'contact-created', status:'active',
      description:'', steps:[], stats:{enrolled:0,active:0,completed:0,unsubscribed:0},
    };
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Name</div><input id="ms-name" class="field-input" value="${U.esc(s.name)}"></div>
        <div class="col-span-2"><div class="field-label">Description</div>
          <textarea id="ms-desc" class="field-textarea" rows="2">${U.esc(s.description||'')}</textarea></div>
        <div><div class="field-label">Trigger</div>
          <select id="ms-trigger" class="field-select">
            ${['contact-created','lifecycle-mql','lifecycle-sql','renewal-90d','manual-enroll','form-submitted']
              .map(t => `<option ${t===s.trigger?'selected':''}>${t}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Status</div>
          <select id="ms-status" class="field-select">
            ${['active','paused','draft'].map(x=>`<option ${x===s.status?'selected':''}>${x}</option>`).join('')}
          </select></div>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Steps</div>
          <button class="btn-secondary" onclick="Views.marketing._addSequenceStep()">+ Add Step</button>
        </div>
        <div id="ms-steps" class="space-y-2">
          ${(s.steps||[]).map((st, i) => this._sequenceStepRow(st, i)).join('') || '<div class="text-xs text-ink-300 italic">No steps yet. Add one to get started.</div>'}
        </div>
      </div>`;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.marketing._saveSequence('${s.id}', ${id?'true':'false'})">Save</button>`;
    const m = U.modal({ title: id?'Edit Sequence':'New Sequence', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _sequenceStepRow(st, i) {
    return `
      <div class="flex items-center gap-2" data-step="${i}">
        <input type="number" class="field-input w-20" data-k="day" value="${st.day||0}" title="Day">
        <select class="field-select w-32" data-k="type">
          ${['email','task','wait','sms'].map(t => `<option ${t===st.type?'selected':''}>${t}</option>`).join('')}
        </select>
        <input class="field-input flex-1" data-k="label" value="${U.esc(st.label||'')}" placeholder="Label / template">
        <button class="btn-ghost text-rose-600" onclick="this.parentElement.remove()">✕</button>
      </div>`;
  },

  _addSequenceStep() {
    const wrap = document.getElementById('ms-steps');
    const div = document.createElement('div');
    div.innerHTML = this._sequenceStepRow({ day: 0, type: 'email', label: '' }, wrap.children.length);
    wrap.appendChild(div.firstElementChild);
  },

  _saveSequence(id, existing) {
    const val = k => document.getElementById(k).value;
    const s = existing ? DB.findSequence(id) : { id, stats:{enrolled:0,active:0,completed:0,unsubscribed:0} };
    s.name = val('ms-name');
    s.description = val('ms-desc');
    s.trigger = val('ms-trigger');
    s.status = val('ms-status');
    s.steps = Array.from(document.querySelectorAll('#ms-steps [data-step]')).map(el => ({
      day: +el.querySelector('[data-k=day]').value || 0,
      type: el.querySelector('[data-k=type]').value,
      label: el.querySelector('[data-k=label]').value,
    })).filter(x => x.label);
    if (!existing) DB.marketingSequences().push(s);
    DB.save();
    U.closeModals();
    U.toast(existing?'Sequence updated':'Sequence created');
    this.render();
  },

  deleteSequence(id) {
    if (!confirm('Delete this sequence?')) return;
    const arr = DB.marketingSequences();
    const i = arr.findIndex(s => s.id === id);
    if (i >= 0) arr.splice(i, 1);
    DB.save();
    U.toast('Sequence deleted', 'info');
    this.render();
  },

  // -------------------- ATTRIBUTION --------------------
  _tabAttribution() {
    const camps = DB.campaigns().slice().sort((a,b) => (b.metrics?.wonRevenue||0) - (a.metrics?.wonRevenue||0));
    const contacts = DB.marketingContacts();
    const bySource = {}, byChannel = {};
    contacts.forEach(c => {
      bySource[c.source||'Unknown']  = (bySource[c.source||'Unknown']  || 0) + 1;
    });
    camps.forEach(c => {
      byChannel[c.channel] = (byChannel[c.channel]||0) + (c.metrics?.wonRevenue||0);
    });
    const totalRev = camps.reduce((s,c) => s + (c.metrics?.wonRevenue||0), 0);
    const totalSpend = camps.reduce((s,c) => s + (c.spent||0), 0);
    return `
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="stat-card !p-3"><div class="stat-label">Total Marketing Revenue</div><div class="stat-value text-lg">${U.usd(totalRev)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Total Marketing Spend</div><div class="stat-value text-lg">${U.usd(totalSpend)}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Blended ROI</div><div class="stat-value text-lg ${totalRev-totalSpend>=0?'text-emerald-700':'text-rose-700'}">${totalSpend?Math.round((totalRev-totalSpend)/totalSpend*100):0}%</div></div>
      </div>

      <div class="card mb-4">
        <div class="card-header"><div class="card-title">Revenue vs Spend by Campaign</div></div>
        <div class="p-4"><canvas id="mk-attr" height="180"></canvas></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Contact Volume by Source</div></div>
          <table class="tbl">
            <thead><tr><th>Source</th><th class="text-right">Contacts</th><th class="text-right">% of Total</th></tr></thead>
            <tbody>
              ${Object.entries(bySource).sort((a,b) => b[1]-a[1]).map(([src,n]) => `
                <tr><td>${U.esc(src)}</td>
                  <td class="text-right">${n}</td>
                  <td class="text-right">${contacts.length?Math.round(n/contacts.length*100):0}%</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Revenue by Channel</div></div>
          <table class="tbl">
            <thead><tr><th>Channel</th><th class="text-right">Revenue</th><th class="text-right">Share</th></tr></thead>
            <tbody>
              ${Object.entries(byChannel).sort((a,b) => b[1]-a[1]).map(([ch,rev]) => `
                <tr><td>${U.esc(ch)}</td>
                  <td class="text-right">${U.usd(rev)}</td>
                  <td class="text-right">${totalRev?Math.round(rev/totalRev*100):0}%</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
};
