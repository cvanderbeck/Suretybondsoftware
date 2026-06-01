window.Views = window.Views || {};
Views.bonds = {
  render() {
    const bonds = DB.bonds();
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Bonds</h1>
          <p class="section-sub">${bonds.length} bonds — issued, pending, and expired.</p>
        </div>
        <div class="flex items-center gap-2">
          <select id="bf-status" class="field-select w-40" onchange="Views.bonds.filter()">
            <option value="">All status</option>
            <option>Active</option><option>Pending UW</option><option>Expired</option><option>Cancelled</option>
          </select>
          <select id="bf-type" class="field-select w-56" onchange="Views.bonds.filter()">
            <option value="">All types</option>
            ${BondTypes.TYPES.map(t=>`<option>${U.esc(t)}</option>`).join('')}
          </select>
          <input id="bf-q" placeholder="Search bonds…" class="field-input w-56" oninput="Views.bonds.filter()">
          <button class="btn-secondary" onclick="Views.bonds.exportAll()">Export PDF</button>
          <button class="btn-primary" onclick="App.openNewBond()">+ New Bond</button>
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="tbl">
          <thead><tr>
            <th>Bond #</th><th>QBO Inv #</th><th>Type</th><th>Principal</th><th>Obligee</th>
            <th class="text-right">Amount</th><th class="text-right">Premium</th>
            <th>Surety</th><th>Status</th><th title="Reported / Approved / Sent">Tracking</th>
            <th class="min-w-[140px]">% Complete</th>
            <th>Effective</th><th>Expires</th><th></th>
          </tr></thead>
          <tbody id="bonds-tbody">${this.rows(bonds)}</tbody>
        </table>
      </div>
    `;
  },

  trackingDots(b) {
    const dot = (label, date) => date
      ? `<span title="${label}: ${U.date(date)}" class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>`
      : `<span title="${label}: not yet" class="inline-block w-2.5 h-2.5 rounded-full bg-slate-300"></span>`;
    return `<div class="flex items-center gap-1">
      ${dot('Reported to bond co.', b.reportedToBondCo)}
      ${dot('Approved by obligee',   b.obligeeApproved)}
      ${dot('Sent to principal',     b.sentToPrincipal)}
    </div>`;
  },

  rows(list) {
    if (!list.length) return `<tr><td colspan="14" class="text-center text-slate-400 py-12">No bonds match.</td></tr>`;
    return list.map(b => {
      const a = DB.findAccount(b.accountId) || {};
      const p = DB.findPartner(b.partnerId) || {};
      return `
        <tr class="cursor-pointer" onclick="Views.bonds.open('${b.id}')">
          <td class="font-medium text-brand-700">${b.number}</td>
          <td class="font-mono text-xs">${U.esc(b.qboInvoiceNumber||'') || '<span class="text-slate-300">—</span>'}</td>
          <td>${U.esc(b.type)}</td>
          <td>${U.esc(a.name||'')}</td>
          <td class="max-w-[14rem] truncate">${U.esc(b.obligee||'')}</td>
          <td class="text-right">${U.usd(b.amount)}</td>
          <td class="text-right">${U.usd(b.premium)}</td>
          <td>${U.esc(p.name||'')}</td>
          <td>${U.statusBadge(b.status)}</td>
          <td>${this.trackingDots(b)}</td>
          <td>${WIP.inlineBar(b, { compact: true })}</td>
          <td>${U.date(b.effective)}</td>
          <td>${U.date(b.expires)}</td>
          <td class="text-right">
            <button class="btn-ghost" title="Issue PDF" onclick="event.stopPropagation(); Views.bonds.exportOne('${b.id}')">📄</button>
          </td>
        </tr>`;
    }).join('');
  },

  filter() {
    const s = document.getElementById('bf-status').value;
    const t = document.getElementById('bf-type').value;
    const q = document.getElementById('bf-q').value.toLowerCase();
    let list = DB.bonds();
    if (s) list = list.filter(b => b.status === s);
    if (t) list = list.filter(b => b.type === t);
    if (q) list = list.filter(b => {
      const a = DB.findAccount(b.accountId) || {};
      return (b.number+a.name+b.obligee+b.project).toLowerCase().includes(q);
    });
    document.getElementById('bonds-tbody').innerHTML = this.rows(list);
  },

  open(id) {
    const b = DB.findBond(id); if (!b) return;
    const a = DB.findAccount(b.accountId) || {};
    const p = DB.findPartner(b.partnerId) || {};
    const commission = (b.premium||0) * (b.commissionRate||0) / 100;
    const docs = DB.docs().filter(d => d.bondId === id);
    const emails = DB.emails().filter(e => e.bondId === id);
    const invs = DB.invoices().filter(i => i.bondId === id);

    const body = `
      <div class="grid grid-cols-3 gap-6 mb-4">
        <div class="col-span-2">
          <div class="flex items-center gap-3">
            <div class="text-lg font-semibold text-slate-900">${b.number}</div>
            ${U.statusBadge(b.status)}
          </div>
          <div class="text-sm text-slate-500">${U.esc(b.type)} Bond · Issued ${U.date(b.effective)} · Expires ${U.date(b.expires)}</div>
          <div class="mt-3 text-sm space-y-1">
            <div><b>Principal:</b> <a class="text-brand-600" onclick="U.closeModals(); Views.accounts.open('${a.id}')">${U.esc(a.name||'')}</a></div>
            <div><b>Obligee:</b> ${U.esc(b.obligee||'')}</div>
            <div><b>Project / Description:</b> ${U.esc(b.project||'')}</div>
            <div><b>Surety Partner:</b> ${U.esc(p.name||'')} (${p.rating||''})</div>
          </div>
        </div>
        <div class="space-y-3">
          <div class="bg-slate-50 p-3 rounded-lg">
            <div class="text-xs text-slate-500">Bond Amount</div>
            <div class="text-xl font-semibold">${U.usd(b.amount)}</div>
          </div>
          <div class="bg-slate-50 p-3 rounded-lg">
            <div class="text-xs text-slate-500">Annual Premium</div>
            <div class="text-xl font-semibold">${U.usd(b.premium)} <span class="text-xs text-slate-500">@ ${b.rate}%</span></div>
          </div>
          <div class="bg-emerald-50 p-3 rounded-lg">
            <div class="text-xs text-emerald-700">Agency Commission (${b.commissionRate}%)</div>
            <div class="text-xl font-semibold text-emerald-700">${U.usd(commission)}</div>
          </div>
        </div>
      </div>

      ${this._typeSpecificCard(b)}

      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">Bond Tracking</div>
          <div class="text-xs text-slate-500">Mark milestones as they happen — click "Today" to stamp the current date.</div>
        </div>
        <div class="p-4 grid grid-cols-3 gap-4">
          ${this._trackingTile('Reported to Bond Co.', 'reportedToBondCo', b)}
          ${this._trackingTile('Approved by Principal/Obligee', 'obligeeApproved', b)}
          ${this._trackingTile('Sent Out to Principal', 'sentToPrincipal', b)}
        </div>
      </div>

      ${this._wipCard(b)}

      <div class="card mb-4">
        <div class="card-header"><div class="card-title">QuickBooks</div></div>
        <div class="p-4 flex items-end gap-3">
          <div class="flex-1 max-w-xs">
            <div class="field-label">QuickBooks Invoice #</div>
            <input id="bd-qbo" class="field-input font-mono" value="${U.esc(b.qboInvoiceNumber||'')}" placeholder="e.g. 1047">
          </div>
          <button class="btn-secondary" onclick="Views.bonds._saveQbo('${id}')">Save Invoice #</button>
          <div class="text-xs text-slate-500 ml-auto">Reference for matching to QuickBooks Online.</div>
        </div>
      </div>

      ${Views.templates.renderTasksCard('bond', b.id, b)}

      <div class="grid grid-cols-3 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Documents (${docs.length})</div>
            <button class="btn-ghost" onclick="App.go('documents')">All →</button></div>
          <div class="p-3 max-h-48 overflow-y-auto">
            ${docs.map(d => `<div class="text-sm p-2 hover:bg-slate-50 rounded"><div class="font-medium truncate">${U.esc(d.name)}</div><div class="text-xs text-slate-500">${d.category} · ${U.fileSize(d.size)}</div></div>`).join('') || '<div class="text-xs text-slate-400 p-3">No documents.</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Mapped Emails (${emails.length})</div></div>
          <div class="p-3 max-h-48 overflow-y-auto">
            ${emails.map(e => `<div class="text-sm p-2 hover:bg-slate-50 rounded"><div class="font-medium truncate">${U.esc(e.subject)}</div><div class="text-xs text-slate-500 truncate">${U.esc(e.from)}</div></div>`).join('') || '<div class="text-xs text-slate-400 p-3">No emails mapped.</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Invoices (${invs.length})</div></div>
          <div class="p-3 max-h-48 overflow-y-auto">
            ${invs.map(i => `<div class="text-sm p-2 hover:bg-slate-50 rounded flex justify-between"><div><div class="font-medium">${i.id}</div><div class="text-xs text-slate-500">${U.date(i.date)}</div></div><div class="text-right">${U.usd(i.amount)}<br/>${U.statusBadge(i.status)}</div></div>`).join('') || '<div class="text-xs text-slate-400 p-3">No invoices.</div>'}
          </div>
        </div>
      </div>
    `;
    const footer = `
      <button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary" onclick="Views.bonds.openForm('${id}')">Edit</button>
      <button class="btn-secondary" onclick="Compose.open({ bondId: '${id}' })">✉ Email Principal</button>
      <button class="btn-secondary" onclick="Views.templates.openApplyPicker({ kind:'bond', id:'${id}', reopen: () => Views.bonds.open('${id}') })">▶ Apply Template</button>
      <button class="btn-secondary" onclick="Views.bonds.exportOne('${id}')">Export Bond PDF</button>
      <button class="btn-primary" onclick="Views.bonds.createInvoice('${id}')">Create Invoice</button>
    `;
    const m = U.modal({ title: 'Bond Details', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  openForm(id) {
    const b = id ? DB.findBond(id) : { id: U.uid('B'), type: 'Performance', status: 'Pending UW', commissionRate: 25, rate: 1.5 };
    const accts = DB.accounts();
    const parts = DB.partners();
    const body = `
      <div class="grid grid-cols-2 gap-4">
        <div><div class="field-label">Bond Number</div><input id="bf-num" class="field-input" value="${U.esc(b.number||('SF-'+new Date().getFullYear()+'-'+String(DB.bonds().length+200).padStart(5,'0')))}"></div>
        <div><div class="field-label">Type</div>
          <select id="bf-type" class="field-select" onchange="Views.bonds._reRenderTypeFields()">
            ${BondTypes.TYPES.map(t=>`<option ${t===BondTypes.normalize(b.type)?'selected':''}>${U.esc(t)}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Principal (Account)</div>
          <select id="bf-acct" class="field-select">${accts.map(a=>`<option value="${a.id}" ${a.id===b.accountId?'selected':''}>${U.esc(a.name)}</option>`).join('')}</select></div>
        <div><div class="field-label">Surety Partner</div>
          <select id="bf-partner" class="field-select">${parts.map(p=>`<option value="${p.id}" ${p.id===b.partnerId?'selected':''}>${U.esc(p.name)}</option>`).join('')}</select></div>
        <div class="col-span-2"><div class="field-label">Obligee</div><input id="bf-ob" class="field-input" value="${U.esc(b.obligee||'')}"></div>
        <div class="col-span-2"><div class="field-label">Project / Description</div><input id="bf-proj" class="field-input" value="${U.esc(b.project||'')}"></div>
        <div><div class="field-label">Bond Amount</div><input id="bf-amt" type="number" class="field-input" value="${b.amount||0}" oninput="Views.bonds.recalc()"></div>
        <div><div class="field-label">Rate %</div><input id="bf-rate" type="number" step="0.1" class="field-input" value="${b.rate||1.5}" oninput="Views.bonds.recalc()"></div>
        <div><div class="field-label">Premium</div><input id="bf-prem" type="number" class="field-input" value="${b.premium||0}"></div>
        <div><div class="field-label">Commission %</div><input id="bf-comm" type="number" step="0.5" class="field-input" value="${b.commissionRate||25}"></div>
        <div><div class="field-label">Effective</div><input id="bf-eff" type="date" class="field-input" value="${b.effective||''}"></div>
        <div><div class="field-label">Expires</div><input id="bf-exp" type="date" class="field-input" value="${b.expires||''}"></div>
        <div><div class="field-label">Status</div>
          <select id="bf-status-sel" class="field-select">${['Pending UW','Active','Expired','Cancelled'].map(s=>`<option ${s===b.status?'selected':''}>${s}</option>`).join('')}</select></div>
        <div><div class="field-label">QuickBooks Invoice #</div>
          <input id="bf-qbo" class="field-input font-mono" value="${U.esc(b.qboInvoiceNumber||'')}" placeholder="optional"></div>
      </div>

      <div class="divider"></div>
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider">${U.esc(BondTypes.normalize(b.type) || 'Bond')} — Type-Specific Details</div>
        <span class="text-[11px] text-ink-300 italic">${U.esc(BondTypes.blurbFor(b.type) || '')}</span>
      </div>
      <div id="bf-typefields">${BondTypes.renderFields(BondTypes.normalize(b.type), b)}</div>

      <div class="divider"></div>
      <div class="text-xs font-semibold text-slate-500 uppercase mb-2">Bond Tracking</div>
      <div class="grid grid-cols-3 gap-3">
        <div><div class="field-label">Reported to Bond Co.</div>
          <input id="bf-rep" type="date" class="field-input" value="${U.esc(b.reportedToBondCo||'')}"></div>
        <div><div class="field-label">Approved by Principal/Obligee</div>
          <input id="bf-app" type="date" class="field-input" value="${U.esc(b.obligeeApproved||'')}"></div>
        <div><div class="field-label">Sent Out to Principal</div>
          <input id="bf-sent" type="date" class="field-input" value="${U.esc(b.sentToPrincipal||'')}"></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.bonds.save('${b.id}')">Save</button>`;
    const m = U.modal({ title: id ? 'Edit Bond' : 'New Bond', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _reRenderTypeFields() {
    const newType = document.getElementById('bf-type').value;
    const wrap = document.getElementById('bf-typefields');
    if (wrap) wrap.innerHTML = BondTypes.renderFields(newType, { typeSpecific: {} });
  },

  _typeSpecificCard(b) {
    const schema = BondTypes.schemaFor(b.type);
    const ts = b.typeSpecific || {};
    if (!schema) return '';
    const filled = schema.fields.filter(f => {
      const v = ts[f.key];
      if (Array.isArray(v)) return v.length;
      return v !== undefined && v !== null && v !== '';
    });
    if (!filled.length) return `
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">${U.esc(BondTypes.normalize(b.type))} Details</div>
          <button class="btn-ghost" onclick="Views.bonds.openForm('${b.id}')">Add details</button>
        </div>
        <div class="p-4 text-sm text-ink-300">No type-specific details yet. Click <b>Edit</b> to fill in fields specific to ${U.esc(BondTypes.normalize(b.type))} bonds.</div>
      </div>`;

    return `
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">${U.esc(BondTypes.normalize(b.type))} Details</div>
          <span class="text-xs text-ink-300 italic">${U.esc(BondTypes.blurbFor(b.type))}</span>
        </div>
        <div class="p-4 grid grid-cols-3 gap-3 text-sm">
          ${filled.map(f => {
            const v = ts[f.key];
            let display = '';
            if (f.type === 'checkbox') display = v ? 'Yes' : 'No';
            else if (f.type === 'multiselect') display = (v||[]).join(', ');
            else if (f.type === 'money') display = U.usd(+v);
            else if (f.type === 'date') display = U.date(v);
            else display = String(v);
            return `<div><div class="field-label">${U.esc(f.label)}</div><div class="font-medium">${U.esc(display)}</div></div>`;
          }).join('')}
        </div>
      </div>`;
  },

  recalc() {
    const amt = +document.getElementById('bf-amt').value || 0;
    const rate = +document.getElementById('bf-rate').value || 0;
    document.getElementById('bf-prem').value = Math.round(amt * rate / 100);
  },

  _wipCard(b) {
    const w   = b.wip;
    const pct = WIP.percent(b);
    const t   = WIP.tone(pct);
    const applicable = WIP.applicable(b);

    if (!w || w.percentComplete == null) {
      return `
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">Work in Progress</div>
            <span class="text-xs text-ink-300">${applicable ? 'Track % complete to refine aggregate-limit exposure' : 'Not typically tracked for this bond type'}</span>
          </div>
          <div class="p-4 flex items-center justify-between">
            <div class="text-sm text-ink-300">No WIP data yet for this bond.</div>
            <button class="btn-secondary" onclick="Views.accounts.editWip('${b.accountId}','${b.id}')">+ Add WIP</button>
          </div>
        </div>`;
    }

    const earned = WIP.earned(b);
    const ou     = WIP.overUnder(b);
    const back   = WIP.backlog(b);
    const totalEst = (w.costToDate||0) + (w.estCostToComplete||0);
    return `
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">Work in Progress</div>
          <div class="text-xs text-ink-300">As of ${U.date(w.asOfDate)}</div>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-display font-semibold ${t.text}">${pct}%</span>
              <span class="text-ink-300">complete</span>
            </div>
            <div class="text-xs text-ink-300">Backlog (uncompleted): <b class="text-ink-700">${U.usd(back)}</b></div>
          </div>
          <div class="progress mb-4"><div class="${t.bar}" style="width:${pct}%"></div></div>

          <div class="grid grid-cols-4 gap-3 text-sm">
            <div><div class="field-label">Contract Amount</div><div class="font-semibold">${U.usd(w.contractAmount || b.amount)}</div></div>
            <div><div class="field-label">Est. Profit %</div><div class="font-semibold">${w.estProfitPercent||0}%</div></div>
            <div><div class="field-label">Total Est. Cost</div><div class="font-semibold">${U.usd(totalEst)}</div></div>
            <div><div class="field-label">Cost to Date</div><div class="font-semibold">${U.usd(w.costToDate||0)}</div></div>
            <div><div class="field-label">Est. Cost to Complete</div><div class="font-semibold">${U.usd(w.estCostToComplete||0)}</div></div>
            <div><div class="field-label">Earned Revenue</div><div class="font-semibold">${U.usd(earned||0)}</div></div>
            <div><div class="field-label">Billed to Date</div><div class="font-semibold">${U.usd(w.billedToDate||0)}</div></div>
            <div><div class="field-label">Over / Under Billing</div>
              <div class="font-semibold ${ou >= 0 ? 'text-emerald-700' : 'text-amber-700'}">${ou >= 0 ? '+' : ''}${U.usd(ou)}</div></div>
          </div>

          ${(w.history||[]).length ? `
            <div class="divider"></div>
            <div class="text-xs font-semibold text-ink-400 uppercase mb-2">Update History (${w.history.length})</div>
            <div class="space-y-1 text-sm max-h-32 overflow-y-auto">
              ${w.history.slice().reverse().slice(0,5).map(h => `
                <div class="border-l-2 border-cream-300 pl-3 py-1">
                  <div class="text-xs text-ink-300">${U.date(h.date)} · ${h.percent}% · cost ${U.usd(h.costToDate)} · billed ${U.usd(h.billedToDate)}</div>
                  ${h.note?`<div class="text-sm">${U.esc(h.note)}</div>`:''}
                </div>`).join('')}
            </div>` : ''}

          <div class="mt-3 flex justify-end">
            <button class="btn-primary" onclick="Views.accounts.editWip('${b.accountId}','${b.id}')">Update WIP</button>
          </div>
        </div>
      </div>`;
  },

  _trackingTile(label, key, b) {
    const date = b[key];
    const stamped = !!date;
    return `
      <div class="border rounded-lg p-3 ${stamped ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium">${label}</div>
          <span class="badge ${stamped ? 'badge-green' : 'badge-slate'}">${stamped ? 'Done' : 'Not yet'}</span>
        </div>
        <div class="mt-2 flex items-center gap-2">
          <input type="date" class="field-input text-sm" value="${U.esc(date||'')}"
            onchange="Views.bonds._setTrack('${b.id}', '${key}', this.value)">
          <button class="btn-secondary text-xs" onclick="Views.bonds._setTrack('${b.id}', '${key}', new Date().toISOString().slice(0,10))">Today</button>
          ${stamped ? `<button class="btn-ghost text-xs text-rose-600" onclick="Views.bonds._setTrack('${b.id}', '${key}', '')">Clear</button>` : ''}
        </div>
      </div>`;
  },

  _setTrack(id, key, value) {
    const b = DB.findBond(id); if (!b) return;
    b[key] = value || null;
    DB.save();
    U.toast(value ? 'Updated' : 'Cleared', 'info');
    this.open(id);
  },

  _saveQbo(id) {
    const b = DB.findBond(id); if (!b) return;
    b.qboInvoiceNumber = document.getElementById('bd-qbo').value || '';
    DB.save();
    U.toast('QBO invoice # saved');
  },

  save(id) {
    let b = DB.findBond(id);
    const isNew = !b;
    if (isNew) { b = { id }; DB.bonds().push(b); }
    b.number = document.getElementById('bf-num').value;
    b.type   = document.getElementById('bf-type').value;
    b.accountId = document.getElementById('bf-acct').value;
    b.partnerId = document.getElementById('bf-partner').value;
    b.obligee   = document.getElementById('bf-ob').value;
    b.project   = document.getElementById('bf-proj').value;
    b.amount  = +document.getElementById('bf-amt').value;
    b.rate    = +document.getElementById('bf-rate').value;
    b.premium = +document.getElementById('bf-prem').value;
    b.commissionRate = +document.getElementById('bf-comm').value;
    b.effective = document.getElementById('bf-eff').value;
    b.expires   = document.getElementById('bf-exp').value;
    b.status    = document.getElementById('bf-status-sel').value;
    b.qboInvoiceNumber = document.getElementById('bf-qbo').value || '';
    b.reportedToBondCo = document.getElementById('bf-rep').value  || null;
    b.obligeeApproved  = document.getElementById('bf-app').value  || null;
    b.sentToPrincipal  = document.getElementById('bf-sent').value || null;
    b.typeSpecific     = BondTypes.readFields(b.type);
    DB.save();
    U.closeModals();
    U.toast(isNew ? 'Bond created' : 'Bond updated');
    if (isNew) Files.provisionBond(b);
    this.render();
  },

  exportOne(id) {
    const b = DB.findBond(id); if (!b) return;
    const doc = PDF.bondCertificate(b);
    doc.save(`${b.number}.pdf`);
    U.toast(`Exported ${b.number}.pdf`);
  },

  exportAll() {
    const doc = PDF.bondReport(DB.bonds());
    doc.save('Bonds_Report.pdf');
    U.toast('Bonds report exported');
  },

  createInvoice(bondId) {
    const b = DB.findBond(bondId); if (!b) return;
    const invId = 'INV-' + (1000 + DB.invoices().length + 1);
    DB.invoices().push({
      id: invId, bondId, accountId: b.accountId,
      date: new Date().toISOString().slice(0,10),
      dueDate: new Date(Date.now()+30*24*60*60*1000).toISOString().slice(0,10),
      amount: b.premium, status: 'Draft', qboId: null,
    });
    DB.save();
    U.closeModals();
    U.toast(`Invoice ${invId} created (Draft)`);
    App.go('invoicing');
  }
};
