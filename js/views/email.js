window.Views = window.Views || {};
Views.email = {
  _section: 'mail',   // 'mail' | 'templates'
  _folder: 'inbox',   // inbox | sent | drafts | unmapped

  render() {
    const e = DB.settings().email;

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Email</h1>
          <p class="section-sub">Connect your mailbox, send templated messages tied to accounts/bonds/renewals, and manage reusable templates.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.email.refresh()">Refresh Inbox</button>
          <button class="btn-primary"   onclick="Compose.open({})">+ Compose</button>
        </div>
      </div>

      <div class="border-b border-slate-200 mb-5 flex gap-1">
        ${this._tabBtn('mail',      'Mail')}
        <button onclick="App.go('templates')" class="px-3 py-2 text-sm text-ink-400 hover:text-ink-700 border-b-2 border-transparent">Templates (${DB.templates().length}) →</button>
        ${this._tabBtn('rules',     'Mapping Rules')}
      </div>

      <div id="email-body">${this._renderSection()}</div>
    `;
  },

  _tabBtn(key, label) {
    const active = this._section === key;
    return `<button onclick="Views.email._setSection('${key}')" class="px-3 py-2 text-sm border-b-2 -mb-px transition
        ${active ? 'border-brand-500 text-brand-700 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'}">${label}</button>`;
  },
  _setSection(s) { this._section = s; document.getElementById('email-body').innerHTML = this._renderSection(); },

  _renderSection() {
    if (this._section === 'templates') return this._renderTemplates();
    if (this._section === 'rules')     return this._renderRules();
    return this._renderMail();
  },

  // ---------- Mail (inbox / sent / drafts) ----------
  _renderMail() {
    const e = DB.settings().email;
    const all = DB.emails();
    const counts = {
      inbox: all.filter(x => (x.folder||'inbox')==='inbox').length,
      sent:  all.filter(x => x.folder==='sent').length,
      drafts:all.filter(x => x.folder==='drafts').length,
      unmapped: all.filter(x => (x.folder||'inbox')==='inbox' && !x.accountId).length,
    };
    const list = all.filter(x => {
      const f = x.folder || 'inbox';
      if (this._folder === 'inbox') return f === 'inbox';
      if (this._folder === 'sent')  return f === 'sent';
      if (this._folder === 'drafts')return f === 'drafts';
      if (this._folder === 'unmapped') return f === 'inbox' && !x.accountId;
      return true;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));

    const folderBtn = (key, label, c) => `
      <button onclick="Views.email._setFolder('${key}')"
        class="px-3 py-1.5 rounded-full text-xs font-medium border transition
          ${this._folder===key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}">
        ${label} <span class="ml-1 opacity-70">${c}</span>
      </button>`;

    return `
      <div class="card mb-5">
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

      <div class="flex items-center gap-2 mb-4 flex-wrap">
        ${folderBtn('inbox',   'Inbox',     counts.inbox)}
        ${folderBtn('sent',    'Sent',      counts.sent)}
        ${folderBtn('drafts',  'Drafts',    counts.drafts)}
        ${folderBtn('unmapped','Unmapped',  counts.unmapped)}
      </div>

      <div class="card">
        <table class="tbl">
          <thead><tr>
            <th></th>
            <th>${this._folder==='sent'||this._folder==='drafts' ? 'To' : 'From'}</th>
            <th>Subject</th><th>Mapped Account</th><th>Mapped Bond</th><th>Date</th><th></th>
          </tr></thead>
          <tbody>
            ${list.length ? list.map(em => this._mailRow(em)).join('')
              : '<tr><td colspan="7" class="text-center text-slate-400 py-12">No messages.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  _mailRow(em) {
    const folder = em.folder || 'inbox';
    const addr = folder === 'sent' || folder === 'drafts' ? (em.to || '') : em.from;
    const a = em.accountId ? DB.findAccount(em.accountId) : null;
    const b = em.bondId    ? DB.findBond(em.bondId)       : null;
    const bgClass = (!em.read && folder === 'inbox') ? 'bg-blue-50/30' : '';
    return `<tr class="${bgClass}">
      <td><span class="w-2 h-2 inline-block rounded-full ${(!em.read && folder==='inbox')?'bg-blue-500':'bg-transparent'}"></span></td>
      <td><div class="text-sm">${U.esc(addr)}</div></td>
      <td>
        <div class="font-medium text-slate-800 cursor-pointer" onclick="Views.email.openMessage('${em.id}')">${U.esc(em.subject)}</div>
        <div class="text-xs text-slate-500 truncate max-w-[28rem]">${U.esc(em.preview)}</div>
      </td>
      <td>${a ? `<span class="badge badge-blue cursor-pointer" onclick="App.go('accounts');">${U.esc(a.name)}</span>` : '<span class="text-xs text-slate-400">— unmapped —</span>'}</td>
      <td>${b ? `<span class="badge badge-violet cursor-pointer" onclick="Views.bonds.open('${b.id}')">${b.number}</span>` : '<span class="text-xs text-slate-400">—</span>'}${(em.opportunityIds && em.opportunityIds.length) ? `<span class="badge badge-amber ml-1" title="Attached to ${em.opportunityIds.length} opportunit${em.opportunityIds.length===1?'y':'ies'}">📌 ${em.opportunityIds.length}</span>` : ''}</td>
      <td class="whitespace-nowrap">${U.datetime(em.date)}</td>
      <td class="text-right">
        ${folder==='inbox' ? `<button class="btn-ghost" onclick="Views.email.openMapping('${em.id}')">Map</button>
                              <button class="btn-ghost" onclick="Views.email.replyTo('${em.id}')">Reply</button>` : ''}
        ${folder==='drafts' ? `<button class="btn-ghost" onclick="Views.email.openDraft('${em.id}')">Edit</button>` : ''}
      </td>
    </tr>`;
  },

  _setFolder(f) { this._folder = f; document.getElementById('email-body').innerHTML = this._renderSection(); },

  refresh() {
    DB.settings().email.lastSync = new Date().toISOString();
    DB.save();
    U.toast('Inbox refreshed');
    let mapped = 0;
    DB.emails().forEach(em => {
      if ((em.folder||'inbox')!=='inbox' || em.accountId) return;
      const domain = (em.from.split('@')[1]||'').toLowerCase();
      const acct = DB.accounts().find(a => (a.email||'').toLowerCase().endsWith('@'+domain));
      if (acct) { em.accountId = acct.id; mapped++; }
    });
    if (mapped) { DB.save(); U.toast(`${mapped} email${mapped>1?'s':''} auto-mapped to accounts`); }
    this.render();
  },

  connect() {
    const body = `
      <p class="text-sm text-slate-600 mb-3">Choose a provider. BondVault uses OAuth2 to read &amp; send mail and creates a hidden <code>BondVault/</code> label for outbound copies. (Demo simulates the flow.)</p>
      <div class="grid grid-cols-2 gap-3 mb-3">
        <label class="border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50 flex items-center gap-3">
          <input type="radio" name="prov" value="Microsoft 365" checked class="chk">
          <div><div class="font-medium">Microsoft 365</div><div class="text-xs text-slate-500">Graph API — Mail.ReadWrite</div></div>
        </label>
        <label class="border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50 flex items-center gap-3">
          <input type="radio" name="prov" value="Google Workspace" class="chk">
          <div><div class="font-medium">Google Workspace</div><div class="text-xs text-slate-500">Gmail API — gmail.modify</div></div>
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
    DB.save(); U.closeModals(); U.toast('Mailbox connected');
    this.render();
  },

  disconnect() {
    DB.settings().email.connected = false;
    DB.save(); U.toast('Mailbox disconnected', 'info'); this.render();
  },

  testSync() { U.toast('Connection healthy — IMAP/Graph reachable'); },

  openMessage(id) {
    const em = DB.emails().find(e => e.id === id);
    if (!em) return;
    if ((em.folder||'inbox') === 'inbox') { em.read = true; DB.save(); }
    const a = em.accountId ? DB.findAccount(em.accountId) : null;
    const b = em.bondId ? DB.findBond(em.bondId) : null;
    const folder = em.folder || 'inbox';
    const addrLine = folder==='sent'||folder==='drafts'
      ? `To <b>${U.esc(em.to||'')}</b>` : `From <b>${U.esc(em.from)}</b>`;
    const atts = em.attachments || [];
    const attachmentsHTML = `
      <div class="mt-4 pt-3 border-t border-cream-200">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Attachments (${atts.length})</div>
          <button class="btn-ghost" onclick="Views.email._addAttachment('${id}')">+ Add Attachment</button>
        </div>
        ${atts.length ? `
          <ul class="card p-2 space-y-1">
            ${atts.map((f, i) => `
              <li class="flex items-center justify-between text-sm px-2 py-1 hover:bg-cream-50 rounded">
                <a class="flex items-center gap-2 text-brand-700 hover:underline" href="${f.dataUrl || '#'}" download="${U.esc(f.name)}">
                  <span>📎</span><span class="font-medium">${U.esc(f.name)}</span>
                  <span class="text-xs text-ink-300">${U.fileSize(f.size)}</span>
                </a>
                <button class="btn-ghost text-rose-600 text-xs" onclick="Views.email._removeAttachment('${id}', ${i})">Remove</button>
              </li>`).join('')}
          </ul>` : `<div class="text-xs text-ink-300 italic">No attachments. Add one to auto-fill a new opportunity from it.</div>`}
      </div>`;
    const body = `
      <div class="border-b border-slate-200 pb-3 mb-3">
        <div class="text-base font-semibold">${U.esc(em.subject)}</div>
        <div class="text-sm text-slate-600">${addrLine} · ${U.datetime(em.date)}</div>
        <div class="mt-2 flex flex-wrap gap-2">
          ${a ? `<span class="badge badge-blue">Account: ${U.esc(a.name)}</span>`: ''}
          ${b ? `<span class="badge badge-violet">Bond: ${b.number}</span>`: ''}
          <span class="badge ${folder==='sent'?'badge-green':folder==='drafts'?'badge-amber':'badge-slate'}">${folder}</span>
          ${(em.opportunityIds && em.opportunityIds.length) ? `<span class="badge badge-amber">📌 ${em.opportunityIds.length} opportunit${em.opportunityIds.length===1?'y':'ies'}</span>` : ''}
        </div>
      </div>
      <div class="text-sm text-slate-700 whitespace-pre-line">${U.esc(em.body || em.preview)}${em.body?'':'\n\n…(message body)…'}</div>
      ${attachmentsHTML}
    `;
    // Decide where an "Add Task" attaches to: bond if mapped, else account, else admin.
    const taskKind   = b ? 'bond' : (a ? 'account' : 'admin');
    const taskParent = b ? b.id : (a ? a.id : '');
    const taskLabel  = b ? `Bond ${b.number}` : (a ? a.name : 'Admin');
    const taskBtn    = `<button class="btn-secondary" onclick="Tasks.openQuickAdd({ kind: '${taskKind}', parentId: '${taskParent}', defaultText: ${JSON.stringify('Follow up on: ' + (em.subject||'')).replace(/"/g,'&quot;')}, defaultAssignee: 'U-1', allowKindPicker: false })" title="Add a task on ${U.esc(taskLabel)}">+ Add Task</button>`;
    const leadBtn    = `<button class="btn-secondary" onclick="Views.email._convertToLead('${id}')">+ New Lead</button>`;
    const oppBtn     = `<button class="btn-secondary" onclick="Views.email._convertToOpportunity('${id}')">+ New Opportunity</button>`;

    const footer = `<button class="btn-ghost" data-close>Close</button>
      ${folder==='inbox' ? `
        ${taskBtn}
        ${a ? oppBtn : leadBtn}
        <button class="btn-secondary" onclick="Views.email.openMapping('${id}')">Edit Mapping</button>
        <button class="btn-primary" onclick="Views.email.replyTo('${id}')">Reply</button>` :
        folder==='drafts' ? `<button class="btn-primary" onclick="Views.email.openDraft('${id}')">Edit Draft</button>` :
        taskBtn}`;
    const m = U.modal({ title: 'Message', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    this.render();
  },

  // ---- Convert an inbound email into a new Lead, pre-filling
  //      company / contact / email / source / notes from the message
  _convertToLead(id) {
    const em = DB.emails().find(e => e.id === id);
    if (!em) return;
    const fromEmail = em.from || '';
    const domain    = (fromEmail.split('@')[1] || '').toLowerCase();
    const companyGuess = domain
      ? domain.replace(/\.(com|net|org|io|co|us|biz|info|example)$/i, '').replace(/[-_.]/g,' ').replace(/\b\w/g, c => c.toUpperCase())
      : '';
    U.closeModals();
    App.go('leads');
    setTimeout(() => {
      Views.leads.newLead();
      setTimeout(() => {
        const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
        set('nl-company', companyGuess);
        set('nl-email',   fromEmail);
        set('nl-source',  'Cold Outreach');
        const notes = `Inbound email — "${em.subject || ''}"\n\n${(em.preview || '').slice(0, 400)}`;
        const notesEl = document.getElementById('nl-notes');
        if (notesEl) notesEl.value = notes;
      }, 50);
    }, 100);
  },

  // ---- Convert an inbound email into a new pipeline Opportunity.
  // Tracks the source email so the create handler can attach it back,
  // and parses any PDF/text attachment via FormParse to pre-fill the form.
  _pendingEmailLink: null,

  _convertToOpportunity(id) {
    const em = DB.emails().find(e => e.id === id);
    if (!em) return;
    this._pendingEmailLink = id;
    U.closeModals();
    App.go('pipeline');
    setTimeout(() => {
      Views.pipeline.addModal();
      // Clear the pending link if the user closes the modal without saving
      const root = document.getElementById('modal-root');
      const obs = new MutationObserver(() => {
        if (!root.querySelector('.modal-backdrop')) {
          this._pendingEmailLink = null;
          obs.disconnect();
        }
      });
      obs.observe(root, { childList: true });
      setTimeout(() => {
        const acctSel = document.getElementById('op-acct');
        if (acctSel && em.accountId) acctSel.value = em.accountId;
        const notesEl = document.getElementById('op-notes');
        if (notesEl) notesEl.value = `From email "${em.subject || ''}" (${em.from})\n\n${(em.preview || '').slice(0, 400)}`;
        this._autoFillFromAttachments(em);
      }, 50);
    }, 100);
  },

  async _autoFillFromAttachments(em) {
    const atts = (em.attachments || []).filter(f => {
      const n = (f.name||'').toLowerCase();
      return n.endsWith('.pdf') || n.endsWith('.txt') || n.endsWith('.csv') ||
             (f.type && (f.type === 'application/pdf' || f.type.startsWith('text/')));
    });
    if (!atts.length || !window.FormParse) return;
    for (const f of atts) {
      try {
        const blob = await (await fetch(f.dataUrl)).blob();
        await FormParse.fillFromBlob(blob, f.name, {
          bondType: 'op-type',
          amount:   'op-amt',
          obligee:  'op-ob',
          dueDate:  'op-due',
        }, { silent: true });
      } catch (err) {
        console.warn('Could not parse attachment', f.name, err);
      }
    }
  },

  _addAttachment(emailId) {
    const em = DB.emails().find(e => e.id === emailId);
    if (!em) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async () => {
      const files = Array.from(input.files || []);
      input.remove();
      if (!files.length) return;
      em.attachments = em.attachments || [];
      for (const f of files) {
        // Cap each attachment to keep localStorage manageable in this preview
        if (f.size > 5 * 1024 * 1024) {
          U.toast(`${f.name} exceeds 5 MB limit — skipped`, 'warn');
          continue;
        }
        const dataUrl = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = reject;
          r.readAsDataURL(f);
        });
        em.attachments.push({
          id: U.uid('EA'),
          name: f.name,
          size: f.size,
          type: f.type || 'application/octet-stream',
          dataUrl,
          uploaded: new Date().toISOString(),
        });
      }
      DB.save();
      U.toast(`${files.length} file${files.length===1?'':'s'} attached`);
      this.openMessage(emailId);
    });
    input.click();
  },

  _removeAttachment(emailId, idx) {
    const em = DB.emails().find(e => e.id === emailId);
    if (!em || !em.attachments) return;
    em.attachments.splice(idx, 1);
    DB.save();
    this.openMessage(emailId);
  },

  // Consumed by Views.pipeline.create() after a new opportunity is pushed.
  _consumePendingEmailLink(newOpportunityId) {
    const id = this._pendingEmailLink;
    if (!id) return false;
    this._pendingEmailLink = null;
    const em = DB.emails().find(e => e.id === id);
    if (!em) return false;
    em.opportunityIds = em.opportunityIds || [];
    if (!em.opportunityIds.includes(newOpportunityId)) {
      em.opportunityIds.push(newOpportunityId);
    }
    return true;
  },

  replyTo(id) {
    const em = DB.emails().find(e => e.id === id);
    if (!em) return;
    U.closeModals();
    Compose.open({
      accountId: em.accountId,
      bondId:    em.bondId,
      to: em.from,
      subject: em.subject.startsWith('Re:') ? em.subject : 'Re: ' + em.subject,
      body: `\n\n---\nOn ${U.datetime(em.date)}, ${em.from} wrote:\n> ${(em.preview||'').replace(/\n/g,'\n> ')}\n`,
    });
  },

  openDraft(id) {
    const em = DB.emails().find(e => e.id === id);
    if (!em) return;
    DB.state.emails = DB.emails().filter(x => x.id !== id); // re-open as fresh compose
    DB.save();
    Compose.open({
      accountId: em.accountId, bondId: em.bondId,
      to: em.to, cc: em.cc, bcc: em.bcc,
      subject: em.subject, body: em.body || em.preview,
    });
  },

  openMapping(id) {
    const em = DB.emails().find(e => e.id === id); if (!em) return;
    const accts = DB.accounts(), bonds = DB.bonds(), opps = DB.pipeline();
    const selectedOpps = new Set(em.opportunityIds || []);
    const oppRow = (p) => {
      const acct = DB.findAccount(p.accountId) || {};
      const meta = Views.pipeline.resultMeta(p.bidResult || 'pending');
      const isLost = meta && p.bidResult && p.bidResult !== 'pending';
      return `
        <label class="flex items-center gap-3 px-3 py-2 border-b border-cream-100 last:border-0 hover:bg-cream-50 cursor-pointer">
          <input type="checkbox" class="chk" data-map-opp value="${p.id}" data-acct="${p.accountId}" ${selectedOpps.has(p.id)?'checked':''}>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">${U.esc(acct.name||'—')} · ${U.esc(p.bondType)} · ${U.usd(p.amount)}</div>
            <div class="text-xs text-ink-300 truncate">${U.esc(p.obligee||'')}${p.dueDate?` · Due ${U.date(p.dueDate)}`:''} · ${U.esc(p.stage)}${isLost?` · <span class="text-rose-600">${U.esc(meta.label)}</span>`:''}</div>
          </div>
        </label>`;
    };
    const body = `
      <div class="mb-3 text-sm">From <b>${U.esc(em.from)}</b> — <i>${U.esc(em.subject)}</i></div>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div><div class="field-label">Map to Account</div>
          <select id="map-acct" class="field-select" onchange="Views.email._filterOppList()">
            <option value="">— None —</option>
            ${accts.map(a => `<option value="${a.id}" ${em.accountId===a.id?'selected':''}>${U.esc(a.name)}</option>`).join('')}
          </select></div>
        <div><div class="field-label">Map to Bond</div>
          <select id="map-bond" class="field-select">
            <option value="">— None —</option>
            ${bonds.map(b => `<option value="${b.id}" ${em.bondId===b.id?'selected':''}>${b.number}</option>`).join('')}
          </select></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Attach to Opportunities</div>
          <label class="flex items-center gap-2 text-xs text-ink-400">
            <input id="map-opp-allaccts" type="checkbox" class="chk" onchange="Views.email._filterOppList()">
            Show opportunities from all accounts
          </label>
        </div>
        <div class="p-2 text-xs text-ink-400 px-3">Use when one email covers multiple bond requests sent to a single carrier.</div>
        <input id="map-opp-search" class="field-input mx-3 my-2" placeholder="Search obligee, bond type, or stage…"
          oninput="Views.email._filterOppList()" style="width: calc(100% - 1.5rem);">
        <div id="map-opp-list" class="max-h-72 overflow-y-auto border-t border-cream-100">
          ${opps.map(oppRow).join('') || '<div class="p-6 text-center text-sm text-ink-300">No opportunities yet.</div>'}
        </div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.email.saveMapping('${id}')">Save Mapping</button>`;
    const m = U.modal({ title: 'Email Mapping', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    // Default-filter the list by the email's mapped account, if any.
    setTimeout(() => this._filterOppList(), 0);
  },

  _filterOppList() {
    const acctSel = document.getElementById('map-acct');
    const allAcct = document.getElementById('map-opp-allaccts');
    const search  = document.getElementById('map-opp-search');
    if (!acctSel) return;
    const wantAcct = !allAcct?.checked && acctSel.value ? acctSel.value : null;
    const q = (search?.value || '').toLowerCase().trim();
    document.querySelectorAll('#map-opp-list label').forEach(lbl => {
      const cb = lbl.querySelector('[data-map-opp]');
      const acctOk = !wantAcct || cb.dataset.acct === wantAcct;
      const matches = !q || lbl.textContent.toLowerCase().includes(q);
      lbl.style.display = (acctOk && matches) ? '' : 'none';
    });
  },

  saveMapping(id) {
    const em = DB.emails().find(e => e.id === id);
    em.accountId = document.getElementById('map-acct').value || null;
    em.bondId    = document.getElementById('map-bond').value || null;
    em.opportunityIds = Array.from(document.querySelectorAll('[data-map-opp]:checked')).map(cb => cb.value);
    DB.save(); U.closeModals(); U.toast('Mapping saved'); this.render();
  },

  // ---------- Templates ----------
  _renderTemplates() {
    const list = DB.templates();
    const byCat = {};
    list.forEach(t => { (byCat[t.category||'General'] = byCat[t.category||'General']||[]).push(t); });

    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-slate-500">Reusable email templates. Variables like <code>{{contact_first}}</code> are substituted automatically when sending.</div>
        <button class="btn-primary" onclick="Views.email.editTemplate()">+ New Template</button>
      </div>

      ${Object.entries(byCat).map(([cat, items]) => `
        <div class="mb-5">
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">${U.esc(cat)}</div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            ${items.map(t => `
              <div class="card">
                <div class="p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="font-semibold text-slate-900">${U.esc(t.name)}</div>
                      <div class="text-xs text-slate-500 mt-1">Subject: <span class="font-mono">${U.esc(t.subject)}</span></div>
                    </div>
                    <span class="badge badge-slate">${U.esc(t.category || 'General')}</span>
                  </div>
                  <div class="text-xs text-slate-600 mt-2 line-clamp-3 whitespace-pre-line">${U.esc((t.body||'').slice(0, 240))}${(t.body||'').length>240?'…':''}</div>
                  <div class="flex justify-end mt-3 gap-1">
                    <button class="btn-ghost" onclick="Compose.open({ templateId: '${t.id}' })">Use</button>
                    <button class="btn-ghost" onclick="Views.email.editTemplate('${t.id}')">Edit</button>
                    <button class="btn-ghost text-rose-600" onclick="Views.email.deleteTemplate('${t.id}')">Delete</button>
                  </div>
                </div>
              </div>`).join('')}
          </div>
        </div>`).join('') ||
        '<div class="card p-8 text-center text-slate-400 text-sm">No templates yet.</div>'}
    `;
  },

  editTemplate(id) {
    const t = id ? DB.templates().find(x => x.id === id) : { id: U.uid('T'), category: 'General', subject: '', body: '' };
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Template Name</div>
          <input id="tpl-name" class="field-input" value="${U.esc(t.name||'')}" placeholder="e.g. Renewal — Confirm Release"></div>
        <div><div class="field-label">Category</div>
          <select id="tpl-cat" class="field-select">
            ${['Renewal','Pipeline','Bond','Underwriting','Billing','General','Other'].map(c => `<option ${c===(t.category||'General')?'selected':''}>${c}</option>`).join('')}
          </select></div>
        <div></div>
        <div class="col-span-2"><div class="field-label">Subject</div>
          <input id="tpl-subject" class="field-input font-mono text-sm" value="${U.esc(t.subject||'')}" placeholder="{{bond_type}} bond — renewal in {{days_until_expires}} days"></div>
        <div class="col-span-2"><div class="field-label">Body</div>
          <textarea id="tpl-body" class="field-textarea font-sans" rows="14" placeholder="Hi {{contact_first}},&#10;&#10;…">${U.esc(t.body||'')}</textarea></div>
      </div>
      <div class="mt-3 text-xs text-slate-500">
        <div class="font-medium text-slate-600 mb-1">Available variables:</div>
        <div class="flex flex-wrap gap-1">
          ${['account_name','contact_name','contact_first','contact_email','bond_number','bond_type','bond_amount','obligee','project','effective','expires','days_until_expires','producer_name','agency_name','agency_phone','agency_email','today'].map(k => `<span class="kbd">{{${k}}}</span>`).join(' ')}
        </div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.email.saveTemplate('${t.id}')">Save</button>`;
    const m = U.modal({ title: id ? 'Edit Template' : 'New Template', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  saveTemplate(id) {
    let t = DB.templates().find(x => x.id === id);
    const isNew = !t;
    if (isNew) { t = { id }; DB.templates().push(t); }
    t.name     = document.getElementById('tpl-name').value;
    t.category = document.getElementById('tpl-cat').value;
    t.subject  = document.getElementById('tpl-subject').value;
    t.body     = document.getElementById('tpl-body').value;
    DB.save(); U.closeModals(); U.toast(isNew ? 'Template created' : 'Template updated');
    this.render();
  },

  deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;
    DB.state.emailTemplates = DB.templates().filter(t => t.id !== id);
    DB.save(); U.toast('Template deleted', 'info'); this.render();
  },

  // ---------- Mapping rules ----------
  _renderRules() {
    return `
      <p class="text-sm text-slate-600 mb-3">Rules are evaluated top-down on each inbound message. The first match wins.</p>
      <div class="card overflow-hidden">
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
  },

  // Back-compat — old Inbox 'Rules' button
  openRules() { this._section = 'rules'; this.render(); },
};
