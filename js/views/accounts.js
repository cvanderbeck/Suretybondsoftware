window.Views = window.Views || {};
Views.accounts = {
  render() {
    const accts = DB.accounts();
    const bonds = DB.bonds();
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
          <thead><tr><th>Account</th><th>Type</th><th>Contact</th><th>Location</th><th class="text-right">Active Bonds</th><th class="text-right">In-Force</th><th>Credit</th><th></th></tr></thead>
          <tbody id="acct-tbody">${this.rows(accts)}</tbody>
        </table>
      </div>
    `;
  },

  rows(list) {
    const bonds = DB.bonds();
    return list.map(a => {
      const ab = bonds.filter(b => b.accountId === a.id && b.status === 'Active');
      const total = ab.reduce((s,b)=>s+b.amount,0);
      const creditColor = a.credit >= 740 ? 'text-emerald-600' : a.credit >= 680 ? 'text-amber-600' : 'text-rose-600';
      return `
        <tr class="cursor-pointer" onclick="Views.accounts.open('${a.id}')">
          <td><div class="font-medium text-slate-800">${U.esc(a.name)}</div><div class="text-xs text-slate-500">${a.id}</div></td>
          <td>${U.esc(a.type)}</td>
          <td><div>${U.esc(a.contact)}</div><div class="text-xs text-slate-500">${U.esc(a.email)}</div></td>
          <td>${U.esc(a.city)}, ${U.esc(a.state)}</td>
          <td class="text-right">${ab.length}</td>
          <td class="text-right">${U.usd(total)}</td>
          <td class="${creditColor} font-medium">${a.credit}</td>
          <td class="text-right"><button class="btn-ghost" onclick="event.stopPropagation(); Views.accounts.openForm('${a.id}')">Edit</button></td>
        </tr>`;
    }).join('') || `<tr><td colspan="8" class="text-center text-slate-400 py-12">No accounts match.</td></tr>`;
  },

  filter() {
    const q = document.getElementById('acct-search').value.toLowerCase();
    const list = DB.accounts().filter(a => (a.name + a.contact + a.email + a.city).toLowerCase().includes(q));
    document.getElementById('acct-tbody').innerHTML = this.rows(list);
  },

  open(id) {
    const a = DB.findAccount(id);
    if (!a) return;
    const bonds = DB.bonds().filter(b => b.accountId === id);
    const docs  = DB.docs().filter(d => d.accountId === id);
    const emails= DB.emails().filter(e => e.accountId === id);
    const body = `
      <div class="grid grid-cols-3 gap-6 mb-4">
        <div class="col-span-2">
          <div class="text-lg font-semibold text-slate-900">${U.esc(a.name)}</div>
          <div class="text-sm text-slate-500">${U.esc(a.type)} · ${a.id}</div>
          <div class="mt-3 text-sm space-y-1">
            <div><b>Contact:</b> ${U.esc(a.contact)}</div>
            <div><b>Email:</b> <a class="text-brand-600" href="mailto:${a.email}">${U.esc(a.email)}</a></div>
            <div><b>Phone:</b> ${U.esc(a.phone)}</div>
            <div><b>Location:</b> ${U.esc(a.city)}, ${U.esc(a.state)}</div>
            <div><b>Tax ID:</b> ${U.esc(a.taxId)}</div>
            <div><b>Credit Score:</b> ${a.credit}</div>
          </div>
        </div>
        <div class="text-sm">
          <div class="field-label">Notes</div>
          <div class="bg-slate-50 p-3 rounded-lg text-slate-700">${U.esc(a.notes || '—')}</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Bonds (${bonds.length})</div></div>
          <div class="p-3 max-h-64 overflow-y-auto">
            ${bonds.map(b => `
              <div class="flex justify-between p-2 hover:bg-slate-50 rounded cursor-pointer" onclick="U.closeModals(); Views.bonds.open('${b.id}')">
                <div><div class="text-sm font-medium">${b.number}</div><div class="text-xs text-slate-500">${U.esc(b.obligee)}</div></div>
                <div class="text-right"><div class="text-sm">${U.usd(b.amount)}</div>${U.statusBadge(b.status)}</div>
              </div>`).join('') || '<div class="text-xs text-slate-400 p-3">No bonds.</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Documents (${docs.length})</div></div>
          <div class="p-3 max-h-64 overflow-y-auto">
            ${docs.map(d => `<div class="text-sm p-2 hover:bg-slate-50 rounded"><div class="font-medium truncate">${U.esc(d.name)}</div><div class="text-xs text-slate-500">${d.category} · ${U.fileSize(d.size)} · ${U.date(d.uploaded)}</div></div>`).join('') || '<div class="text-xs text-slate-400 p-3">No documents.</div>'}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Mapped Emails (${emails.length})</div></div>
          <div class="p-3 max-h-64 overflow-y-auto">
            ${emails.map(e => `<div class="text-sm p-2 hover:bg-slate-50 rounded"><div class="font-medium truncate">${U.esc(e.subject)}</div><div class="text-xs text-slate-500 truncate">${U.esc(e.from)} · ${U.datetime(e.date)}</div></div>`).join('') || '<div class="text-xs text-slate-400 p-3">No mapped emails.</div>'}
          </div>
        </div>
      </div>
    `;
    const footer = `
      <button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary" onclick="U.closeModals(); Views.accounts.openForm('${id}')">Edit</button>
      <button class="btn-primary"   onclick="U.closeModals(); App.openNewBond('${id}')">New Bond</button>
    `;
    const m = U.modal({ title: 'Account Detail', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  openForm(id) {
    const a = id ? DB.findAccount(id) : { id: U.uid('A'), type: 'Contractor', credit: 700 };
    const body = `
      <div class="grid grid-cols-2 gap-4">
        <div><div class="field-label">Account Name</div><input id="f-name" class="field-input" value="${U.esc(a.name||'')}"></div>
        <div><div class="field-label">Type</div>
          <select id="f-type" class="field-select">
            ${['Contractor','Commercial','Court','Probate','Notary','Other'].map(t=>`<option ${t===a.type?'selected':''}>${t}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Primary Contact</div><input id="f-contact" class="field-input" value="${U.esc(a.contact||'')}"></div>
        <div><div class="field-label">Email</div><input id="f-email" type="email" class="field-input" value="${U.esc(a.email||'')}"></div>
        <div><div class="field-label">Phone</div><input id="f-phone" class="field-input" value="${U.esc(a.phone||'')}"></div>
        <div><div class="field-label">Tax ID / EIN</div><input id="f-tax" class="field-input" value="${U.esc(a.taxId||'')}"></div>
        <div><div class="field-label">City</div><input id="f-city" class="field-input" value="${U.esc(a.city||'')}"></div>
        <div><div class="field-label">State</div><input id="f-state" class="field-input" value="${U.esc(a.state||'')}"></div>
        <div><div class="field-label">Credit Score</div><input id="f-credit" type="number" class="field-input" value="${a.credit||700}"></div>
      </div>
      <div class="mt-3"><div class="field-label">Notes</div><textarea id="f-notes" class="field-textarea" rows="3">${U.esc(a.notes||'')}</textarea></div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.accounts.save('${a.id}')">Save</button>`;
    const m = U.modal({ title: id ? 'Edit Account' : 'New Account', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  save(id) {
    let a = DB.findAccount(id);
    const isNew = !a;
    if (isNew) { a = { id }; DB.accounts().push(a); }
    a.name = document.getElementById('f-name').value;
    a.type = document.getElementById('f-type').value;
    a.contact = document.getElementById('f-contact').value;
    a.email = document.getElementById('f-email').value;
    a.phone = document.getElementById('f-phone').value;
    a.taxId = document.getElementById('f-tax').value;
    a.city  = document.getElementById('f-city').value;
    a.state = document.getElementById('f-state').value;
    a.credit = +document.getElementById('f-credit').value;
    a.notes = document.getElementById('f-notes').value;
    DB.save();
    U.closeModals();
    U.toast(isNew ? 'Account created' : 'Account updated');
    this.render();
  }
};
