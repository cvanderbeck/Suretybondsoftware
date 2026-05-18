window.Views = window.Views || {};

Views.forms = {
  _section: 'all',       // 'all' | 'pending' | 'duplicates'
  _filterType: '',
  _filterStatus: '',

  render() {
    const all = DB.intakes();
    const counts = {
      total:      all.length,
      sent:       all.filter(f => f.status === 'sent').length,
      pending:    all.filter(f => f.status === 'submitted').length,
      imported:   all.filter(f => f.status === 'imported').length,
    };
    const dupes = (window.Duplicates ? Duplicates.detect() : []);

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Forms</h1>
          <p class="section-sub">Send online intake forms to leads and accounts — submissions auto-populate the file, and new emails create new accounts automatically.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-primary" onclick="Views.forms.openSendNew()">+ Send New Form</button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4 mb-5">
        <div class="stat-card !p-3"><div class="stat-label">Total Forms</div><div class="stat-value text-lg">${counts.total}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Sent (Awaiting)</div><div class="stat-value text-lg">${counts.sent}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Pending Import</div><div class="stat-value text-lg ${counts.pending?'text-amber-700':''}">${counts.pending}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Possible Duplicates</div><div class="stat-value text-lg ${dupes.length?'text-rose-700':''}">${dupes.length}</div></div>
      </div>

      <div class="border-b border-cream-200 mb-5 flex gap-1">
        ${this._tabBtn('all',        'All Forms ('+counts.total+')')}
        ${this._tabBtn('pending',    'Pending Import ('+counts.pending+')')}
        ${this._tabBtn('duplicates', 'Duplicate Accounts ('+dupes.length+')')}
      </div>

      <div id="forms-body">${this._renderSection()}</div>
    `;
  },

  _tabBtn(key, label) {
    const active = this._section === key;
    return `<button onclick="Views.forms._setSection('${key}')" class="px-3 py-2 text-sm border-b-2 -mb-px transition
      ${active ? 'border-brand-500 text-brand-700 font-semibold' : 'border-transparent text-ink-400 hover:text-ink-700'}">${label}</button>`;
  },
  _setSection(s) { this._section = s; document.getElementById('forms-body').innerHTML = this._renderSection(); },

  _renderSection() {
    if (this._section === 'pending')    return this._renderPending();
    if (this._section === 'duplicates') return this._renderDuplicates();
    return this._renderAll();
  },

  // ---------- All Forms ----------
  _renderAll() {
    let list = DB.intakes();
    if (this._filterType)   list = list.filter(f => f.type === this._filterType);
    if (this._filterStatus) list = list.filter(f => f.status === this._filterStatus);
    list = list.slice().sort((a,b) => (b.sentDate || '').localeCompare(a.sentDate || ''));

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">All Intake Forms</div>
          <div class="flex items-center gap-2">
            <select class="field-select w-44" onchange="Views.forms._setFilter('type', this.value)">
              <option value="">All types</option>
              <option value="cq"  ${this._filterType==='cq' ?'selected':''}>Contractor Questionnaire</option>
              <option value="pfs" ${this._filterType==='pfs'?'selected':''}>Personal Financial Statement</option>
              <option value="wip" ${this._filterType==='wip'?'selected':''}>WIP Schedule</option>
            </select>
            <select class="field-select w-44" onchange="Views.forms._setFilter('status', this.value)">
              <option value="">All statuses</option>
              <option value="sent"        ${this._filterStatus==='sent'       ?'selected':''}>Sent</option>
              <option value="in_progress" ${this._filterStatus==='in_progress'?'selected':''}>In Progress</option>
              <option value="submitted"   ${this._filterStatus==='submitted'  ?'selected':''}>Submitted</option>
              <option value="imported"    ${this._filterStatus==='imported'   ?'selected':''}>Imported</option>
            </select>
          </div>
        </div>
        <table class="tbl">
          <thead><tr>
            <th>Form</th><th>Recipient</th><th>Linked To</th><th>Status</th>
            <th>Sent</th><th>Submitted</th><th>Imported</th><th></th>
          </tr></thead>
          <tbody>
            ${list.length ? list.map(f => this._row(f)).join('')
              : `<tr><td colspan="8" class="text-center text-ink-300 py-10">No forms match.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  },

  _row(f) {
    const lead = f.leadId ? DB.findLead(f.leadId) : null;
    const acct = f.accountId ? DB.findAccount(f.accountId) : null;
    const linkedHtml = acct
      ? `<span class="badge badge-blue cursor-pointer" onclick="event.stopPropagation(); App.go('accounts'); setTimeout(()=>Views.accounts.open('${acct.id}'), 50);">${U.esc(acct.name)}</span>`
      : lead
        ? `<span class="badge badge-green cursor-pointer" onclick="event.stopPropagation(); App.go('leads'); setTimeout(()=>Views.leads.open('${lead.id}'), 50);">${U.esc(lead.companyName)}</span>`
        : '<span class="text-xs text-ink-300">—</span>';
    return `
      <tr>
        <td><div class="font-medium">${U.esc(Intake.typeLabel(f.type))}</div></td>
        <td>${U.esc(f.contactName||'—')}<br/><span class="text-xs text-ink-300">${U.esc(f.contactEmail||'')}</span></td>
        <td>${linkedHtml}</td>
        <td>${this._statusBadge(f.status)}</td>
        <td>${U.date(f.sentDate)}</td>
        <td>${U.date(f.submittedDate)}</td>
        <td>${U.date(f.importedDate)}</td>
        <td class="text-right whitespace-nowrap">
          <button class="btn-ghost" onclick="Intake._showLinkById('${f.id}')">Copy Link</button>
          <button class="btn-ghost" onclick="window.open(Intake.url(DB.findIntake('${f.id}')), '_blank')">Open</button>
          ${f.status==='submitted' ? `<button class="btn-ghost text-emerald-700" onclick="Intake.importNow('${f.id}'); Views.forms.render();">Import</button>`:''}
          ${f.status!=='imported' ? `<button class="btn-ghost text-rose-600" onclick="Views.forms._delete('${f.id}')">Delete</button>`:''}
        </td>
      </tr>`;
  },

  _setFilter(field, v) {
    if (field === 'type')   this._filterType = v;
    if (field === 'status') this._filterStatus = v;
    document.getElementById('forms-body').innerHTML = this._renderSection();
  },

  _statusBadge(s) {
    const m = {
      sent:        ['badge-blue',   'Sent'],
      in_progress: ['badge-amber',  'In Progress'],
      submitted:   ['badge-violet', 'Submitted'],
      imported:    ['badge-green',  'Imported'],
    }[s] || ['badge-slate', s];
    return `<span class="badge ${m[0]}">${m[1]}</span>`;
  },

  _delete(id) {
    if (!confirm('Delete this intake form record?')) return;
    DB.state.intakeForms = DB.intakes().filter(f => f.id !== id);
    DB.save();
    U.toast('Form deleted', 'info');
    this.render();
  },

  // ---------- Pending Import ----------
  _renderPending() {
    const list = DB.intakes().filter(f => f.status === 'submitted');
    if (!list.length) return '<div class="card p-8 text-center text-ink-300">No submitted forms waiting to be imported.</div>';
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Pending Import</div>
          <button class="btn-secondary" onclick="Views.forms._importAll()">Import All</button>
        </div>
        <div class="p-3 space-y-3">
          ${list.map(f => {
            const matches = this._pendingMatches(f);
            return `
              <div class="border border-cream-300 rounded-lg p-4">
                <div class="flex items-start justify-between">
                  <div>
                    <div class="font-semibold text-ink-700">${U.esc(Intake.typeLabel(f.type))}</div>
                    <div class="text-xs text-ink-300 mt-0.5">From ${U.esc(f.contactName||'—')} &lt;${U.esc(f.contactEmail||'')}&gt;</div>
                    <div class="text-xs text-ink-300">Submitted ${U.date(f.submittedDate)}${f.sentDate?` · Sent ${U.date(f.sentDate)}`:''}</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="btn-secondary" onclick="window.open(Intake.url(DB.findIntake('${f.id}')), '_blank')">View Submission</button>
                    <button class="btn-primary" onclick="Intake.importNow('${f.id}'); Views.forms.render();">Import →</button>
                  </div>
                </div>
                ${matches.length ? `
                  <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs">
                    <div class="font-semibold text-amber-800 mb-1">⚠ Will likely match existing account on import:</div>
                    ${matches.map(m => `<div class="text-amber-800">→ ${U.esc(m.name)} (${m.id})</div>`).join('')}
                  </div>` :
                  this._isLikelyNewAccount(f) ? `
                  <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    💡 Email <b>${U.esc(f.contactEmail||'')}</b> doesn't match any existing account — a <b>new account will be created</b> on import.
                  </div>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>`;
  },

  _isLikelyNewAccount(f) {
    if (f.accountId) return false;
    const email = (f.contactEmail || '').toLowerCase().trim();
    if (!email) return false;
    return !DB.accounts().some(a =>
      (a.email || '').toLowerCase() === email ||
      (a.contacts || []).some(c => (c.email || '').toLowerCase() === email)
    );
  },

  _pendingMatches(f) {
    if (f.accountId) return [];
    const email = (f.contactEmail || '').toLowerCase().trim();
    if (!email) return [];
    return DB.accounts().filter(a =>
      (a.email || '').toLowerCase() === email ||
      (a.contacts || []).some(c => (c.email || '').toLowerCase() === email)
    );
  },

  _importAll() {
    const list = DB.intakes().filter(f => f.status === 'submitted');
    let n = 0;
    list.forEach(f => { Intake.importNow(f.id, { silent: true, skipDuplicateCheck: true }); n++; });
    U.toast(`Imported ${n} form${n!==1?'s':''}`);
    this.render();
  },

  // ---------- Duplicate Accounts ----------
  _renderDuplicates() {
    const groups = window.Duplicates ? Duplicates.detect() : [];
    if (!groups.length) return '<div class="card p-8 text-center text-emerald-700">No duplicate accounts detected. ✓</div>';
    return `
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">Possible Duplicate Accounts</div>
          <span class="text-xs text-ink-300">${groups.length} group${groups.length!==1?'s':''} detected — review and merge</span>
        </div>
        <div class="p-3 text-xs text-ink-400">
          Accounts are flagged when they share an email address, EIN, phone, or have a near-identical normalized name. Review each group and pick a primary account — the others will be merged into it (all bonds, contacts, indemnitors, docs, pipeline, etc. move over; the secondary record is deleted).
        </div>
      </div>
      <div class="space-y-4">
        ${groups.map((g, i) => this._dupGroupCard(g, i)).join('')}
      </div>
    `;
  },

  _dupGroupCard(g, idx) {
    const accounts = g.accounts;
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Group ${idx+1} — ${accounts.length} accounts</div>
          <div class="text-xs text-ink-300">${g.reasons.map(r => U.esc(r)).join(' · ')}</div>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-${Math.min(accounts.length, 4)} gap-3 mb-3">
            ${accounts.map((a, i) => this._dupAccountCard(a, accounts, i)).join('')}
          </div>
          <div class="text-xs text-ink-300 italic">Click "Make Primary" on the account you want to keep, then "Merge Others In →".</div>
        </div>
      </div>`;
  },

  _dupAccountCard(a, group, idx) {
    const bonds = DB.bonds().filter(b => b.accountId === a.id);
    const open = bonds.filter(b => b.status === 'Active' || b.status === 'Pending UW').length;
    const contacts = (a.contacts || []).length;
    const indemnitors = (a.indemnitors || []).length;
    const isPrimary = this._primaryByGroup && this._primaryByGroup[group.map(x => x.id).sort().join(',')] === a.id;
    const groupKey = group.map(x => x.id).sort().join(',');
    return `
      <div class="border ${isPrimary?'border-brand-500 bg-brand-50/30':'border-cream-300'} rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold text-ink-700 truncate">${U.esc(a.name)}</div>
          ${isPrimary ? '<span class="badge badge-green">Primary</span>' : ''}
        </div>
        <div class="text-xs text-ink-300 truncate">${a.id} · ${U.esc(a.type||'')}</div>
        <div class="mt-2 text-xs space-y-0.5">
          <div><b>Email:</b> ${U.esc(a.email||'—')}</div>
          <div><b>Phone:</b> ${U.esc(a.phone||'—')}</div>
          <div><b>EIN:</b> ${U.esc(a.taxId||'—')}</div>
          <div><b>City:</b> ${U.esc(a.city||'')}${a.city && a.state?', ':''}${U.esc(a.state||'')}</div>
        </div>
        <div class="mt-2 grid grid-cols-3 gap-1 text-[11px] text-ink-300">
          <div><b class="text-ink-500">${open}</b> open bonds</div>
          <div><b class="text-ink-500">${contacts}</b> contacts</div>
          <div><b class="text-ink-500">${indemnitors}</b> indem.</div>
        </div>
        <div class="mt-2 flex gap-1 flex-wrap">
          <button class="btn-ghost" onclick="App.go('accounts'); setTimeout(()=>Views.accounts.open('${a.id}'), 50);">View</button>
          ${isPrimary
            ? `<button class="btn-primary" onclick="Views.forms._mergeGroup('${groupKey}')">Merge Others In →</button>`
            : `<button class="btn-secondary" onclick="Views.forms._setPrimary('${groupKey}','${a.id}')">Make Primary</button>`}
        </div>
      </div>`;
  },

  _setPrimary(groupKey, accountId) {
    this._primaryByGroup = this._primaryByGroup || {};
    this._primaryByGroup[groupKey] = accountId;
    document.getElementById('forms-body').innerHTML = this._renderSection();
  },

  _mergeGroup(groupKey) {
    const primaryId = (this._primaryByGroup || {})[groupKey];
    if (!primaryId) { U.toast('Pick a primary first', 'warn'); return; }
    const others = groupKey.split(',').filter(id => id !== primaryId);
    if (!confirm(`Merge ${others.length} duplicate account${others.length===1?'':'s'} into ${DB.findAccount(primaryId)?.name}?\n\nAll bonds, contacts, indemnitors, docs, pipeline opportunities, and renewals from the duplicates will move to the primary. The duplicates will be deleted. This cannot be undone.`)) return;
    others.forEach(secId => Duplicates.merge(primaryId, secId));
    U.toast(`Merged ${others.length} account${others.length===1?'':'s'}`);
    this._primaryByGroup = {};
    this.render();
  },

  // ---------- Quick prompt right after intake import ----------
  promptMerge(account, candidates) {
    if (!account || !candidates || !candidates.length) return;
    const body = `
      <p class="text-sm text-ink-400 mb-3">After importing, BondVault noticed <b>${candidates.length}</b> existing account${candidates.length===1?'':'s'} that look like potential duplicates of <b>${U.esc(account.name)}</b>:</p>
      <div class="grid grid-cols-${Math.min(candidates.length+1, 3)} gap-3">
        <div class="border border-brand-500 bg-brand-50/30 rounded-lg p-3">
          <div class="badge badge-green mb-2">Just Imported</div>
          <div class="font-semibold">${U.esc(account.name)}</div>
          <div class="text-xs text-ink-300">${account.id}</div>
          <div class="text-xs mt-2">${U.esc(account.email||'')}</div>
          <div class="text-xs">${U.esc(account.phone||'')}</div>
          <div class="text-xs">EIN: ${U.esc(account.taxId||'—')}</div>
        </div>
        ${candidates.map(c => `
          <div class="border border-cream-300 rounded-lg p-3">
            <div class="badge badge-slate mb-2">Existing</div>
            <div class="font-semibold">${U.esc(c.name)}</div>
            <div class="text-xs text-ink-300">${c.id}</div>
            <div class="text-xs mt-2">${U.esc(c.email||'')}</div>
            <div class="text-xs">${U.esc(c.phone||'')}</div>
            <div class="text-xs">EIN: ${U.esc(c.taxId||'—')}</div>
            <button class="btn-secondary text-xs mt-2 w-full" onclick="Views.forms._mergeOne('${c.id}', '${account.id}')">Merge new into ${U.esc(c.name)} →</button>
          </div>`).join('')}
      </div>
      <div class="text-xs text-ink-300 italic mt-3">"Merge new into existing" keeps the existing account and folds in any new data from this import.</div>
    `;
    const footer = `<button class="btn-ghost" data-close>Keep both for now</button>
      <button class="btn-secondary" onclick="U.closeModals(); App.go('forms'); setTimeout(()=>Views.forms._setSection('duplicates'), 50);">Review in Forms tab</button>`;
    const m = U.modal({ title: 'Possible Duplicate Detected', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _mergeOne(primaryId, secondaryId) {
    Duplicates.merge(primaryId, secondaryId);
    U.closeModals();
    U.toast('Accounts merged');
    if (location.hash.includes('forms')) this.render();
  },

  // ---------- Send New Form ----------
  openSendNew() {
    const body = `
      <p class="text-sm text-ink-400 mb-3">Pick a form, choose who it's going to, and BondVault will generate a tokenized link the recipient can fill in online.</p>
      <div class="grid grid-cols-3 gap-3 mb-4">
        ${[
          ['cq',  'Contractor Questionnaire'],
          ['pfs', 'Personal Financial Statement'],
          ['wip', 'WIP Schedule'],
        ].map(([t,label]) => `
          <label class="border border-cream-300 rounded-lg p-3 cursor-pointer hover:bg-cream-50">
            <input type="radio" name="sf-type" value="${t}" class="chk" ${t==='cq'?'checked':''}>
            <span class="ml-2 font-medium">${U.esc(label)}</span>
          </label>`).join('')}
      </div>

      <div class="divider"></div>
      <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Recipient</div>

      <div class="grid grid-cols-3 gap-3 mb-3">
        ${[
          ['existing-lead', 'Existing Lead'],
          ['existing-acct', 'Existing Account'],
          ['new-email',     'New Email Address'],
        ].map(([k,label]) => `
          <label class="border border-cream-300 rounded-lg p-3 cursor-pointer hover:bg-cream-50">
            <input type="radio" name="sf-rec" value="${k}" class="chk" ${k==='existing-lead'?'checked':''} onchange="Views.forms._toggleRecipient()">
            <span class="ml-2 font-medium">${U.esc(label)}</span>
          </label>`).join('')}
      </div>

      <div id="sf-recipient-pane">
        ${this._recipientPaneFor('existing-lead')}
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.forms._sendNew()">Send Form</button>`;
    const m = U.modal({ title: 'Send New Intake Form', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _toggleRecipient() {
    const v = document.querySelector('input[name="sf-rec"]:checked').value;
    document.getElementById('sf-recipient-pane').innerHTML = this._recipientPaneFor(v);
  },

  _recipientPaneFor(kind) {
    if (kind === 'existing-lead') {
      const openLeads = DB.leads().filter(l => l.status === 'open');
      return `
        <div><div class="field-label">Lead</div>
          <select id="sf-lead" class="field-select">
            ${openLeads.map(l => `<option value="${l.id}">${U.esc(l.companyName)} — ${U.esc(l.contactName||'')} &lt;${U.esc(l.email||'')}&gt;</option>`).join('') || '<option value="">No open leads</option>'}
          </select></div>`;
    }
    if (kind === 'existing-acct') {
      return `
        <div><div class="field-label">Account</div>
          <select id="sf-acct" class="field-select">
            ${DB.accounts().map(a => `<option value="${a.id}">${U.esc(a.name)} — ${U.esc(a.contact||'')} &lt;${U.esc(a.email||'')}&gt;</option>`).join('')}
          </select></div>`;
    }
    // new-email
    return `
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Contact Name</div><input id="sf-name" class="field-input" placeholder="Jane Smith"></div>
        <div><div class="field-label">Email</div><input id="sf-email" class="field-input" placeholder="jane@example.com"></div>
      </div>
      <div class="mt-2 text-xs text-ink-300 italic">No lead or account will be linked yet. When the form is submitted, a new account will be created automatically.</div>
    `;
  },

  _sendNew() {
    const type = document.querySelector('input[name="sf-type"]:checked')?.value || 'cq';
    const kind = document.querySelector('input[name="sf-rec"]:checked')?.value || 'existing-lead';

    const ctx = { };
    if (kind === 'existing-lead') {
      const id = document.getElementById('sf-lead')?.value;
      const lead = id ? DB.findLead(id) : null;
      if (!lead) { U.toast('Pick a lead', 'warn'); return; }
      ctx.leadId = lead.id;
      ctx.contactName = lead.contactName || '';
      ctx.contactEmail = lead.email || '';
    } else if (kind === 'existing-acct') {
      const id = document.getElementById('sf-acct')?.value;
      const a = id ? DB.findAccount(id) : null;
      if (!a) { U.toast('Pick an account', 'warn'); return; }
      const primary = (a.contacts || []).find(c => c.primary) || (a.contacts || [])[0] || {};
      ctx.accountId = a.id;
      ctx.contactName = primary.name || a.contact || '';
      ctx.contactEmail = primary.email || a.email || '';
    } else {
      ctx.contactName  = document.getElementById('sf-name')?.value || '';
      ctx.contactEmail = document.getElementById('sf-email')?.value || '';
      if (!ctx.contactEmail) { U.toast('Enter an email', 'warn'); return; }
    }

    U.closeModals();
    Intake.send(type, ctx);
    this.render();
  },
};
