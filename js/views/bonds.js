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
          <select id="bf-type" class="field-select w-40" onchange="Views.bonds.filter()">
            <option value="">All types</option>
            ${['Bid','Performance','Payment','License','Court','Probate'].map(t=>`<option>${t}</option>`).join('')}
          </select>
          <input id="bf-q" placeholder="Search bonds…" class="field-input w-56" oninput="Views.bonds.filter()">
          <button class="btn-secondary" onclick="Views.bonds.exportAll()">Export PDF</button>
          <button class="btn-primary" onclick="App.openNewBond()">+ New Bond</button>
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="tbl">
          <thead><tr>
            <th>Bond #</th><th>Type</th><th>Principal</th><th>Obligee</th>
            <th class="text-right">Amount</th><th class="text-right">Premium</th>
            <th>Surety</th><th>Status</th><th>Effective</th><th>Expires</th><th></th>
          </tr></thead>
          <tbody id="bonds-tbody">${this.rows(bonds)}</tbody>
        </table>
      </div>
    `;
  },

  rows(list) {
    if (!list.length) return `<tr><td colspan="11" class="text-center text-slate-400 py-12">No bonds match.</td></tr>`;
    return list.map(b => {
      const a = DB.findAccount(b.accountId) || {};
      const p = DB.findPartner(b.partnerId) || {};
      return `
        <tr class="cursor-pointer" onclick="Views.bonds.open('${b.id}')">
          <td class="font-medium text-brand-700">${b.number}</td>
          <td>${U.esc(b.type)}</td>
          <td>${U.esc(a.name||'')}</td>
          <td class="max-w-[14rem] truncate">${U.esc(b.obligee||'')}</td>
          <td class="text-right">${U.usd(b.amount)}</td>
          <td class="text-right">${U.usd(b.premium)}</td>
          <td>${U.esc(p.name||'')}</td>
          <td>${U.statusBadge(b.status)}</td>
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
          <select id="bf-type" class="field-select">${['Bid','Performance','Payment','License','Court','Probate','Customs'].map(t=>`<option ${t===b.type?'selected':''}>${t}</option>`).join('')}</select></div>
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
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.bonds.save('${b.id}')">Save</button>`;
    const m = U.modal({ title: id ? 'Edit Bond' : 'New Bond', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  recalc() {
    const amt = +document.getElementById('bf-amt').value || 0;
    const rate = +document.getElementById('bf-rate').value || 0;
    document.getElementById('bf-prem').value = Math.round(amt * rate / 100);
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
    DB.save();
    U.closeModals();
    U.toast(isNew ? 'Bond created' : 'Bond updated');
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
