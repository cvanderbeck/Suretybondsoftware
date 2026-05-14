window.Views = window.Views || {};
Views.email = {
  render() {
    const e = DB.settings().email;
    const emails = DB.emails();
    const unmapped = emails.filter(x => !x.accountId);
    const totalUnread = emails.filter(x => !x.read).length;

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Email Integration</h1>
          <p class="section-sub">Connect Microsoft 365 or Google Workspace. Inbound mail is auto-mapped to accounts and bonds by sender, subject, and bond number patterns.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.email.refresh()">Refresh Inbox</button>
          <button class="btn-primary"   onclick="Views.email.openRules()">Mapping Rules</button>
        </div>
      </div>

      <div class="card mb-6">
        <div class="p-5 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">✉</div>
            <div>
              <div class="text-sm text-slate-500">Email Provider</div>
              <div class="font-semibold">${e.connected ? `${U.esc(e.provider)} · ${U.esc(e.address)} <span class="badge badge-green ml-1">Connected</span>` : `<span class="badge badge-rose">Not connected</span>`}</div>
              <div class="text-xs text-slate-500 mt-1">${e.connected ? `Last sync: ${U.datetime(e.lastSync)}` : 'Connect to start receiving mail'}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${e.connected
              ? `<button class="btn-secondary" onclick="Views.email.testSync()">Test Sync</button>
                 <button class="btn-secondary text-rose-600" onclick="Views.email.disconnect()">Disconnect</button>`
              : `<button class="btn-primary" onclick="Views.email.connect()">Connect Mailbox</button>`}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="stat-card"><div class="stat-label">Inbox</div><div class="stat-value">${emails.length}</div></div>
        <div class="stat-card"><div class="stat-label">Unread</div><div class="stat-value">${totalUnread}</div></div>
        <div class="stat-card"><div class="stat-label">Unmapped</div><div class="stat-value">${unmapped.length}</div><div class="text-xs text-slate-400 mt-1">Needing manual assignment</div></div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Inbox</div></div>
        <table class="tbl">
          <thead><tr><th></th><th>From</th><th>Subject</th><th>Mapped Account</th><th>Mapped Bond</th><th>Date</th><th></th></tr></thead>
          <tbody>
            ${emails.map(em => {
              const a = em.accountId ? DB.findAccount(em.accountId) : null;
              const b = em.bondId    ? DB.findBond(em.bondId)       : null;
              return `<tr class="${!em.read?'bg-blue-50/30':''}">
                <td><span class="w-2 h-2 inline-block rounded-full ${em.read?'bg-transparent':'bg-blue-500'}"></span></td>
                <td><div class="text-sm">${U.esc(em.from)}</div></td>
                <td>
                  <div class="font-medium text-slate-800 cursor-pointer" onclick="Views.email.openMessage('${em.id}')">${U.esc(em.subject)}</div>
                  <div class="text-xs text-slate-500 truncate max-w-[28rem]">${U.esc(em.preview)}</div>
                </td>
                <td>${a ? `<span class="badge badge-blue cursor-pointer" onclick="App.go('accounts');">${U.esc(a.name)}</span>` : '<span class="text-xs text-slate-400">— unmapped —</span>'}</td>
                <td>${b ? `<span class="badge badge-violet cursor-pointer" onclick="Views.bonds.open('${b.id}')">${b.number}</span>` : '<span class="text-xs text-slate-400">—</span>'}</td>
                <td class="whitespace-nowrap">${U.datetime(em.date)}</td>
                <td class="text-right">
                  <button class="btn-ghost" onclick="Views.email.openMapping('${em.id}')">Map</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  connect() {
    const body = `
      <p class="text-sm text-slate-600 mb-3">Choose a provider. BondVault uses OAuth2 to read &amp; send mail and creates a hidden <code>BondVault/</code> label for outbound copies. (Demo simulates the flow.)</p>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <label class="border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50 flex items-center gap-3">
          <input type="radio" name="prov" value="Microsoft 365" checked class="chk">
          <div>
            <div class="font-medium">Microsoft 365</div>
            <div class="text-xs text-slate-500">Graph API — Mail.ReadWrite</div>
          </div>
        </label>
        <label class="border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50 flex items-center gap-3">
          <input type="radio" name="prov" value="Google Workspace" class="chk">
          <div>
            <div class="font-medium">Google Workspace</div>
            <div class="text-xs text-slate-500">Gmail API — gmail.modify</div>
          </div>
        </label>
      </div>
      <div><div class="field-label">Mailbox</div><input id="em-addr" class="field-input" value="producers@vanderbeck-surety.example"></div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.email.completeConnect()">Authorize</button>`;
    const m = U.modal({ title: 'Connect Mailbox', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  completeConnect() {
    const s = DB.settings().email;
    s.connected = true;
    s.provider = document.querySelector('input[name="prov"]:checked').value;
    s.address  = document.getElementById('em-addr').value;
    s.lastSync = new Date().toISOString();
    DB.save();
    U.closeModals();
    U.toast('Mailbox connected');
    this.render();
  },

  disconnect() {
    DB.settings().email.connected = false;
    DB.save();
    U.toast('Mailbox disconnected', 'info');
    this.render();
  },

  refresh() {
    DB.settings().email.lastSync = new Date().toISOString();
    DB.save();
    U.toast('Inbox refreshed');
    // Auto-map unmapped emails by simple sender-domain rule
    let mapped = 0;
    DB.emails().forEach(em => {
      if (!em.accountId) {
        const domain = (em.from.split('@')[1]||'').toLowerCase();
        const acct = DB.accounts().find(a => (a.email||'').toLowerCase().endsWith('@'+domain));
        if (acct) { em.accountId = acct.id; mapped++; }
      }
    });
    if (mapped) { DB.save(); U.toast(`${mapped} email${mapped>1?'s':''} auto-mapped to accounts`); }
    this.render();
  },

  testSync() { U.toast('Connection healthy — IMAP/Graph reachable'); },

  openMessage(id) {
    const em = DB.emails().find(e => e.id === id);
    if (!em) return;
    em.read = true; DB.save();
    const a = em.accountId ? DB.findAccount(em.accountId) : null;
    const b = em.bondId ? DB.findBond(em.bondId) : null;
    const body = `
      <div class="border-b border-slate-200 pb-3 mb-3">
        <div class="text-base font-semibold">${U.esc(em.subject)}</div>
        <div class="text-sm text-slate-600">From <b>${U.esc(em.from)}</b> · ${U.datetime(em.date)}</div>
        <div class="mt-2 flex flex-wrap gap-2">
          ${a ? `<span class="badge badge-blue">Account: ${U.esc(a.name)}</span>`: ''}
          ${b ? `<span class="badge badge-violet">Bond: ${b.number}</span>`: ''}
        </div>
      </div>
      <div class="text-sm text-slate-700 whitespace-pre-line">${U.esc(em.preview)}\n\n…(message body)…</div>
    `;
    const footer = `<button class="btn-ghost" data-close>Close</button>
      <button class="btn-secondary" onclick="Views.email.openMapping('${id}')">Edit Mapping</button>
      <button class="btn-primary" onclick="U.toast('Reply window opened (demo)')">Reply</button>`;
    const m = U.modal({ title: 'Message', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    this.render();
  },

  openMapping(id) {
    const em = DB.emails().find(e => e.id === id);
    if (!em) return;
    const accts = DB.accounts();
    const bonds = DB.bonds();
    const body = `
      <div class="mb-3 text-sm">From <b>${U.esc(em.from)}</b> — <i>${U.esc(em.subject)}</i></div>
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Map to Account</div>
          <select id="map-acct" class="field-select">
            <option value="">— None —</option>
            ${accts.map(a => `<option value="${a.id}" ${em.accountId===a.id?'selected':''}>${U.esc(a.name)}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Map to Bond</div>
          <select id="map-bond" class="field-select">
            <option value="">— None —</option>
            ${bonds.map(b => `<option value="${b.id}" ${em.bondId===b.id?'selected':''}>${b.number}</option>`).join('')}
          </select></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.email.saveMapping('${id}')">Save Mapping</button>`;
    const m = U.modal({ title: 'Email Mapping', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  saveMapping(id) {
    const em = DB.emails().find(e => e.id === id);
    em.accountId = document.getElementById('map-acct').value || null;
    em.bondId    = document.getElementById('map-bond').value || null;
    DB.save();
    U.closeModals();
    U.toast('Mapping saved');
    this.render();
  },

  openRules() {
    const body = `
      <p class="text-sm text-slate-600 mb-3">Rules are evaluated top-down on each inbound message. The first match wins.</p>
      <div class="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
        <table class="tbl">
          <thead><tr><th>Priority</th><th>If</th><th>Then map to</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Subject contains bond # (regex <code>SF-\\d{4}-\\d{5}</code>)</td><td>That bond + its account</td></tr>
            <tr><td>2</td><td>Sender domain matches account email domain</td><td>Matching account</td></tr>
            <tr><td>3</td><td>Sender = known surety partner</td><td>Most recent bond w/ that partner</td></tr>
            <tr><td>4</td><td>Subject contains obligee name (fuzzy)</td><td>Matching bond</td></tr>
            <tr><td>5</td><td>Default</td><td>Inbox (unmapped)</td></tr>
          </tbody>
        </table>
      </div>
    `;
    const footer = `<button class="btn-primary" data-close>Done</button>`;
    const m = U.modal({ title: 'Inbound Mapping Rules', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  }
};
