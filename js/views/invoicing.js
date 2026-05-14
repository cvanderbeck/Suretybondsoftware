window.Views = window.Views || {};
Views.invoicing = {
  render() {
    const invs = DB.invoices();
    const qbo  = DB.settings().qbo;
    const open = invs.filter(i => i.status === 'Open').reduce((s,i)=>s+i.amount,0);
    const paid = invs.filter(i => i.status === 'Paid').reduce((s,i)=>s+i.amount,0);
    const draft= invs.filter(i => i.status === 'Draft').reduce((s,i)=>s+i.amount,0);

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Invoicing &amp; QuickBooks Online</h1>
          <p class="section-sub">Generate invoices for bond premiums and sync them to QuickBooks Online.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.invoicing.openInvoiceForm()">+ New Invoice</button>
          <button class="btn-primary"   onclick="Views.invoicing.syncAll()">Sync Open Invoices to QBO</button>
        </div>
      </div>

      <div class="card mb-6">
        <div class="p-5 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">QB</div>
            <div>
              <div class="text-sm text-slate-500">QuickBooks Online</div>
              <div class="font-semibold">${qbo.connected ? `${U.esc(qbo.companyName)} <span class="badge badge-green ml-1">Connected</span>` : `<span class="badge badge-rose">Not connected</span>`}</div>
              <div class="text-xs text-slate-500 mt-1">Realm ID: ${qbo.realmId} · Last sync: ${U.datetime(qbo.lastSync)}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${qbo.connected
              ? `<button class="btn-secondary" onclick="Views.invoicing.testSync()">Test Sync</button>
                 <button class="btn-secondary text-rose-600" onclick="Views.invoicing.disconnectQBO()">Disconnect</button>`
              : `<button class="btn-primary" onclick="Views.invoicing.connectQBO()">Connect to QBO</button>`}
          </div>
        </div>
        <div class="px-5 pb-5 grid grid-cols-4 gap-4">
          <div><div class="text-xs text-slate-500">Mapped Income Account</div><div class="text-sm font-medium">4100 · Surety Commissions Earned</div></div>
          <div><div class="text-xs text-slate-500">Mapped A/R Account</div><div class="text-sm font-medium">1200 · Accounts Receivable</div></div>
          <div><div class="text-xs text-slate-500">Default Tax Code</div><div class="text-sm font-medium">NON</div></div>
          <div><div class="text-xs text-slate-500">Default Terms</div><div class="text-sm font-medium">Net 30</div></div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="stat-card"><div class="stat-label">Open Balance</div><div class="stat-value">${U.usd(open)}</div></div>
        <div class="stat-card"><div class="stat-label">Paid (YTD)</div><div class="stat-value">${U.usd(paid)}</div></div>
        <div class="stat-card"><div class="stat-label">Draft</div><div class="stat-value">${U.usd(draft)}</div></div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Invoices</div></div>
        <table class="tbl">
          <thead><tr><th>Invoice</th><th>Account</th><th>Bond</th><th>Date</th><th>Due</th><th class="text-right">Amount</th><th>Status</th><th>QBO</th><th></th></tr></thead>
          <tbody>
            ${invs.map(i => {
              const a = DB.findAccount(i.accountId) || {};
              const b = DB.findBond(i.bondId) || {};
              return `<tr>
                <td class="font-medium">${i.id}</td>
                <td>${U.esc(a.name||'')}</td>
                <td>${b.number||''}</td>
                <td>${U.date(i.date)}</td>
                <td>${U.date(i.dueDate)}</td>
                <td class="text-right">${U.usd(i.amount)}</td>
                <td>${U.statusBadge(i.status)}</td>
                <td>${i.qboId ? `<span class="badge badge-green" title="${i.qboId}">Synced</span>` : `<span class="badge badge-slate">Not synced</span>`}</td>
                <td class="text-right">
                  <button class="btn-ghost" onclick="Views.invoicing.exportPDF('${i.id}')">PDF</button>
                  ${i.status==='Draft' ? `<button class="btn-ghost" onclick="Views.invoicing.markOpen('${i.id}')">Send</button>` : ''}
                  ${!i.qboId ? `<button class="btn-ghost text-emerald-700" onclick="Views.invoicing.syncOne('${i.id}')">→ QBO</button>` : ''}
                  ${i.status==='Open' ? `<button class="btn-ghost text-emerald-700" onclick="Views.invoicing.markPaid('${i.id}')">Mark Paid</button>` : ''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  connectQBO() {
    const body = `
      <p class="text-sm text-slate-600 mb-3">You'll be redirected to Intuit to authorize SureFlow to access your QuickBooks Online company. This demo simulates that flow.</p>
      <div class="bg-slate-50 p-3 rounded-lg text-sm space-y-2">
        <div><b>Scopes:</b> com.intuit.quickbooks.accounting, openid, profile</div>
        <div><b>Redirect URI:</b> https://app.sureflow.example/oauth/qbo/callback</div>
      </div>
      <div class="mt-3"><div class="field-label">Pretend Realm ID</div><input id="qbo-realm" class="field-input" value="9341022938293"></div>
      <div class="mt-3"><div class="field-label">Company Name</div><input id="qbo-co" class="field-input" value="Vanderbeck Surety Agency"></div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.invoicing.completeConnect()">Authorize</button>`;
    const m = U.modal({ title: 'Connect to QuickBooks Online', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  completeConnect() {
    const s = DB.settings().qbo;
    s.connected = true;
    s.realmId = document.getElementById('qbo-realm').value;
    s.companyName = document.getElementById('qbo-co').value;
    s.lastSync = new Date().toISOString();
    DB.save();
    U.closeModals();
    U.toast('QuickBooks Online connected');
    this.render();
  },

  disconnectQBO() {
    DB.settings().qbo.connected = false;
    DB.save();
    U.toast('Disconnected from QBO', 'info');
    this.render();
  },

  testSync() {
    DB.settings().qbo.lastSync = new Date().toISOString();
    DB.save();
    U.toast('Test sync successful — connection healthy');
    this.render();
  },

  syncAll() {
    if (!DB.settings().qbo.connected) { U.toast('Connect QBO first', 'warn'); return; }
    let n = 0;
    DB.invoices().forEach(i => {
      if (!i.qboId && i.status !== 'Draft') {
        i.qboId = 'qbo-' + Math.floor(Math.random()*9000+1000);
        n++;
      }
    });
    DB.settings().qbo.lastSync = new Date().toISOString();
    DB.save();
    U.toast(`Synced ${n} invoice${n!==1?'s':''} to QBO`);
    this.render();
  },

  syncOne(id) {
    if (!DB.settings().qbo.connected) { U.toast('Connect QBO first', 'warn'); return; }
    const i = DB.invoices().find(x => x.id === id);
    if (i.status === 'Draft') { U.toast('Send the invoice first', 'warn'); return; }
    i.qboId = 'qbo-' + Math.floor(Math.random()*9000+1000);
    DB.settings().qbo.lastSync = new Date().toISOString();
    DB.save();
    U.toast(`${id} synced to QBO`);
    this.render();
  },

  markOpen(id) {
    const i = DB.invoices().find(x => x.id === id);
    i.status = 'Open'; DB.save(); U.toast(`${id} sent`); this.render();
  },
  markPaid(id) {
    const i = DB.invoices().find(x => x.id === id);
    i.status = 'Paid'; DB.save(); U.toast(`${id} marked Paid`); this.render();
  },
  exportPDF(id) {
    const i = DB.invoices().find(x => x.id === id);
    const doc = PDF.invoice(i);
    doc.save(`${id}.pdf`);
    U.toast('Invoice exported');
  },

  openInvoiceForm() {
    const bonds = DB.bonds();
    const body = `
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2"><div class="field-label">Bond</div>
          <select id="iv-bond" class="field-select" onchange="Views.invoicing.fillFromBond()">
            ${bonds.map(b => { const a = DB.findAccount(b.accountId)||{}; return `<option value="${b.id}">${b.number} — ${U.esc(a.name)}</option>`; }).join('')}
          </select></div>
        <div><div class="field-label">Date</div><input id="iv-date" type="date" class="field-input" value="${new Date().toISOString().slice(0,10)}"></div>
        <div><div class="field-label">Due Date</div><input id="iv-due" type="date" class="field-input" value="${new Date(Date.now()+30*24*60*60*1000).toISOString().slice(0,10)}"></div>
        <div><div class="field-label">Amount</div><input id="iv-amt" type="number" class="field-input"></div>
        <div><div class="field-label">Status</div>
          <select id="iv-status" class="field-select"><option>Draft</option><option>Open</option></select></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.invoicing.createInvoice()">Create</button>`;
    const m = U.modal({ title: 'New Invoice', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    this.fillFromBond();
  },

  fillFromBond() {
    const id = document.getElementById('iv-bond').value;
    const b = DB.findBond(id);
    if (b) document.getElementById('iv-amt').value = b.premium;
  },

  createInvoice() {
    const bondId = document.getElementById('iv-bond').value;
    const b = DB.findBond(bondId);
    const inv = {
      id: 'INV-' + (1000 + DB.invoices().length + 1),
      bondId, accountId: b.accountId,
      date: document.getElementById('iv-date').value,
      dueDate: document.getElementById('iv-due').value,
      amount: +document.getElementById('iv-amt').value,
      status: document.getElementById('iv-status').value,
      qboId: null,
    };
    DB.invoices().push(inv); DB.save();
    U.closeModals(); U.toast(`Invoice ${inv.id} created`);
    this.render();
  }
};
