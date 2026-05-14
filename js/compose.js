// ---------- Reusable email composer ----------
// Usage:
//   Compose.open({
//     accountId, bondId, renewalId, pipelineId,   // any/all optional - drive variable substitution and mapping of saved sent email
//     to, cc, bcc, subject, body,                  // optional explicit defaults
//     templateId,                                  // optional starting template
//   });
//
// Template variables (interpolated as {{key}} in subject and body):
//   account_name, account_id, contact_name, contact_first, contact_email,
//   bond_number, bond_type, bond_amount, obligee, project,
//   effective, expires, days_until_expires,
//   pipeline_obligee, pipeline_amount,
//   producer_name, agency_name, agency_phone, agency_email, today
window.Compose = (() => {

  function firstName(full) {
    if (!full) return '';
    return String(full).trim().split(/\s+/)[0];
  }

  function daysUntil(dateStr) {
    if (!dateStr) return '';
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  }

  function buildContext(opts) {
    const settings = DB.settings();
    const ctx = {
      producer_name: 'Casey Vanderbeck',
      agency_name:   settings.agency.name,
      agency_phone:  settings.agency.phone,
      agency_email:  settings.agency.email,
      today:         new Date().toISOString().slice(0,10),
    };

    let account, bond, renewal, pipeline;
    if (opts.renewalId) {
      renewal = DB.renewals().find(r => r.id === opts.renewalId);
      if (renewal) opts.bondId = opts.bondId || renewal.bondId;
    }
    if (opts.bondId)    bond     = DB.findBond(opts.bondId);
    if (bond)           opts.accountId = opts.accountId || bond.accountId;
    if (opts.accountId) account  = DB.findAccount(opts.accountId);
    if (opts.pipelineId) pipeline = DB.pipeline().find(p => p.id === opts.pipelineId);
    if (pipeline && !account) account = DB.findAccount(pipeline.accountId);

    if (account) {
      const primary = (account.contacts || []).find(c => c.primary) || (account.contacts || [])[0] || {};
      Object.assign(ctx, {
        account_name:  account.name,
        account_id:    account.id,
        contact_name:  primary.name  || account.contact || '',
        contact_first: firstName(primary.name || account.contact || ''),
        contact_email: primary.email || account.email   || '',
        contact_phone: primary.phone || account.phone   || '',
      });
    }
    if (bond) {
      Object.assign(ctx, {
        bond_number: bond.number,
        bond_type:   bond.type,
        bond_amount: U.usd(bond.amount),
        obligee:     bond.obligee,
        project:     bond.project,
        effective:   U.date(bond.effective),
        expires:     U.date(bond.expires),
        days_until_expires: daysUntil(bond.expires),
      });
    }
    if (pipeline) {
      Object.assign(ctx, {
        pipeline_obligee: pipeline.obligee,
        pipeline_amount:  U.usd(pipeline.amount),
        project:          ctx.project || pipeline.notes,
        bond_type:        ctx.bond_type || pipeline.bondType,
      });
    }
    return { ctx, account, bond, renewal, pipeline };
  }

  function interpolate(str, ctx) {
    if (!str) return '';
    return String(str).replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const v = ctx[key];
      return (v === undefined || v === null) ? `{{${key}}}` : v;
    });
  }

  let _state = null; // current compose state

  function open(opts = {}) {
    const { ctx, account, bond, renewal, pipeline } = buildContext(opts);
    const defaultTo = opts.to || ctx.contact_email || '';
    _state = { opts, ctx, account, bond, renewal, pipeline,
               to: defaultTo, cc: opts.cc || '', bcc: opts.bcc || '',
               subject: opts.subject || '', body: opts.body || '',
               templateId: opts.templateId || '' };

    if (_state.templateId) applyTemplate(_state.templateId, true);
    renderModal();
  }

  function applyTemplate(templateId, silent) {
    const t = DB.templates().find(x => x.id === templateId);
    if (!t) return;
    _state.templateId = templateId;
    _state.subject = interpolate(t.subject, _state.ctx);
    _state.body   = interpolate(t.body,    _state.ctx);
    if (!silent) {
      const s = document.getElementById('cm-subject'); if (s) s.value = _state.subject;
      const b = document.getElementById('cm-body');    if (b) b.value = _state.body;
      U.toast(`Applied template: ${t.name}`);
    }
  }

  function renderModal() {
    const templates = DB.templates();
    const ctxKeys = Object.keys(_state.ctx).sort();
    const contextChips = ctxKeys.map(k => `<button type="button" class="kbd hover:bg-slate-200" onclick="Compose._insertVar('${k}')">{{${k}}}</button>`).join(' ');

    const linkChips = [
      _state.account && `<span class="badge badge-blue">Account: ${U.esc(_state.account.name)}</span>`,
      _state.bond    && `<span class="badge badge-violet">Bond: ${_state.bond.number}</span>`,
      _state.renewal && `<span class="badge badge-amber">Renewal workflow</span>`,
      _state.pipeline&& `<span class="badge badge-slate">Pipeline opp</span>`,
    ].filter(Boolean).join(' ');

    const body = `
      ${linkChips ? `<div class="mb-3 flex flex-wrap gap-1">${linkChips}</div>` : ''}

      <div class="grid grid-cols-1 gap-3">
        <div class="grid grid-cols-2 gap-3">
          <div><div class="field-label">To</div><input id="cm-to" class="field-input" value="${U.esc(_state.to)}"></div>
          <div><div class="field-label">Template</div>
            <select id="cm-tpl" class="field-select" onchange="Compose.applyTemplate(this.value)">
              <option value="">— None —</option>
              ${templates.map(t => `<option value="${t.id}" ${t.id===_state.templateId?'selected':''}>${U.esc(t.name)}</option>`).join('')}
            </select></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><div class="field-label">Cc</div><input id="cm-cc" class="field-input" value="${U.esc(_state.cc)}"></div>
          <div><div class="field-label">Bcc</div><input id="cm-bcc" class="field-input" value="${U.esc(_state.bcc)}"></div>
        </div>
        <div>
          <div class="field-label">Subject</div>
          <input id="cm-subject" class="field-input" value="${U.esc(_state.subject)}">
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <div class="field-label !mb-0">Body</div>
            <div class="text-xs text-slate-400">Variables auto-substitute on Send / Apply Template</div>
          </div>
          <textarea id="cm-body" class="field-textarea font-sans" rows="12">${U.esc(_state.body)}</textarea>
        </div>
        <div class="text-xs text-slate-500">
          <div class="font-medium text-slate-600 mb-1">Available variables (click to insert):</div>
          <div class="flex flex-wrap gap-1">${contextChips}</div>
        </div>
      </div>
    `;
    const footer = `
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-secondary" onclick="Compose.preview()">Preview</button>
      <button class="btn-secondary" onclick="Compose.saveDraft()">Save Draft</button>
      <button class="btn-primary"   onclick="Compose.send()">Send</button>
    `;
    const m = U.modal({ title: 'Compose Email', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  }

  function _collect() {
    _state.to      = document.getElementById('cm-to').value;
    _state.cc      = document.getElementById('cm-cc').value;
    _state.bcc     = document.getElementById('cm-bcc').value;
    _state.subject = document.getElementById('cm-subject').value;
    _state.body    = document.getElementById('cm-body').value;
  }

  function _insertVar(key) {
    const ta = document.getElementById('cm-body');
    if (!ta) return;
    const insert = `{{${key}}}`;
    const start = ta.selectionStart, end = ta.selectionEnd;
    ta.value = ta.value.slice(0, start) + insert + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + insert.length;
    ta.focus();
  }

  function preview() {
    _collect();
    const subj = interpolate(_state.subject, _state.ctx);
    const body = interpolate(_state.body,    _state.ctx);
    const view = `
      <div class="bg-slate-50 rounded-lg p-4 text-sm">
        <div class="mb-3"><b>From:</b> ${U.esc(DB.settings().email.address || DB.settings().agency.email)}</div>
        <div class="mb-1"><b>To:</b> ${U.esc(_state.to)}</div>
        ${_state.cc?`<div class="mb-1"><b>Cc:</b> ${U.esc(_state.cc)}</div>`:''}
        ${_state.bcc?`<div class="mb-1"><b>Bcc:</b> ${U.esc(_state.bcc)}</div>`:''}
        <div class="mb-3"><b>Subject:</b> ${U.esc(subj)}</div>
        <div class="bg-white rounded p-3 whitespace-pre-line border border-slate-200">${U.esc(body)}</div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Back to Compose</button>`;
    const m = U.modal({ title: 'Email Preview', body: view, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', () => { m.close(); renderModal(); });
  }

  function send() {
    _collect();
    if (!_state.to.trim()) { U.toast('To address is required', 'warn'); return; }
    if (!_state.subject.trim()) { U.toast('Subject is required', 'warn'); return; }

    const subj = interpolate(_state.subject, _state.ctx);
    const body = interpolate(_state.body,    _state.ctx);

    const id = U.uid('E');
    DB.emails().push({
      id,
      folder: 'sent',
      from:   DB.settings().email.address || DB.settings().agency.email,
      to:     _state.to,
      cc:     _state.cc || null,
      bcc:    _state.bcc || null,
      subject: subj,
      preview: body.slice(0, 180),
      body,
      date:   new Date().toISOString(),
      accountId: _state.account?.id || null,
      bondId:    _state.bond?.id    || null,
      read:   true,
    });

    // If wired to a renewal, log it as a follow-up note too.
    if (_state.renewal) {
      _state.renewal.notes = _state.renewal.notes || [];
      _state.renewal.notes.push({
        date: new Date().toISOString().slice(0,10),
        author: 'Casey V.',
        text: `Sent email "${subj}" to ${_state.to}.`,
      });
      _state.renewal.contactedDate = new Date().toISOString().slice(0,10);
      if (_state.renewal.status === 'upcoming') _state.renewal.status = 'outreach';
    }

    DB.save();
    U.closeModals();
    U.toast('Email sent (simulated) — saved to Sent folder');
    // Re-render current view if it has a render()
    const cur = Object.values(Views).find(v => v.__active);
    if (cur && cur.render) cur.render();
  }

  function saveDraft() {
    _collect();
    DB.emails().push({
      id: U.uid('E'),
      folder: 'drafts',
      from:    DB.settings().email.address || DB.settings().agency.email,
      to:      _state.to,
      cc:      _state.cc || null,
      bcc:     _state.bcc || null,
      subject: _state.subject,
      preview: _state.body.slice(0, 180),
      body:    _state.body,
      date:    new Date().toISOString(),
      accountId: _state.account?.id || null,
      bondId:    _state.bond?.id    || null,
      read:    true,
    });
    DB.save();
    U.closeModals();
    U.toast('Draft saved');
  }

  return { open, applyTemplate, _insertVar, preview, send, saveDraft, interpolate };
})();
