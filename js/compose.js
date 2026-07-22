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

    let account, bond, renewal, pipeline, lead;
    if (opts.renewalId) {
      renewal = DB.renewals().find(r => r.id === opts.renewalId);
      if (renewal) opts.bondId = opts.bondId || renewal.bondId;
    }
    if (opts.bondId)    bond     = DB.findBond(opts.bondId);
    if (bond)           opts.accountId = opts.accountId || bond.accountId;
    if (opts.accountId) account  = DB.findAccount(opts.accountId);
    if (opts.pipelineId) pipeline = DB.pipeline().find(p => p.id === opts.pipelineId);
    if (pipeline && !account) account = DB.findAccount(pipeline.accountId);
    if (opts.leadId) lead = DB.findLead && DB.findLead(opts.leadId);

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
    if (lead) {
      Object.assign(ctx, {
        lead_company:  lead.companyName,
        lead_contact:  lead.contactName,
        contact_name:  ctx.contact_name  || lead.contactName  || '',
        contact_first: ctx.contact_first || firstName(lead.contactName || ''),
        contact_email: ctx.contact_email || lead.email || '',
        contact_phone: ctx.contact_phone || lead.phone || '',
      });
    }
    return { ctx, account, bond, renewal, pipeline, lead };
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
    const { ctx, account, bond, renewal, pipeline, lead } = buildContext(opts);
    const defaultTo = opts.to || ctx.contact_email || (lead && lead.email) || '';
    _state = { opts, ctx, account, bond, renewal, pipeline, lead,
               to: defaultTo, cc: opts.cc || '', bcc: opts.bcc || '',
               subject: opts.subject || '', body: opts.body || '',
               templateId: opts.templateId || '',
               attachPC: false, pcQuote: null };

    _refreshPCState();
    if (_state.templateId) applyTemplate(_state.templateId, true);
    renderModal();
  }

  // Look up whether there's a saved Premium Calculator (PC) to attach for the
  // current bond context, and default the checkbox on when the active
  // template is the "Report Bond to Surety" template.
  function _refreshPCState() {
    _state.pcQuote = null;
    const b = _state.bond;
    if (b && window.DB && DB.quotes) {
      // Prefer a confirmed PC on this bond; fall back to most-recent PC on it,
      // then to the account's most-recent PC.
      const all = DB.quotes();
      const onBond = all.filter(q => q.associationKind === 'bond' && q.associationId === b.id);
      const confirmed = onBond.find(q => q.status === 'confirmed');
      _state.pcQuote = confirmed
        || onBond.slice().sort((x,y) => (y.savedAt||'').localeCompare(x.savedAt||''))[0]
        || all.filter(q => q.accountId === b.accountId).slice().sort((x,y) => (y.savedAt||'').localeCompare(x.savedAt||''))[0]
        || null;
    }
    if (_state.pcQuote) {
      const t = _state.templateId ? DB.templates().find(x => x.id === _state.templateId) : null;
      const isReportTpl = _state.templateId === 'T-bond-report-surety' || (t && t.category === 'Bond Reporting');
      _state.attachPC = isReportTpl;
    }
  }

  function applyTemplate(templateId, silent) {
    const t = DB.templates().find(x => x.id === templateId);
    if (!t) return;
    _state.templateId = templateId;
    _state.subject = interpolate(t.subject, _state.ctx);
    _state.body   = interpolate(t.body,    _state.ctx);
    // Re-evaluate PC-attach default based on newly picked template.
    _refreshPCState();
    if (!silent) {
      const s = document.getElementById('cm-subject'); if (s) s.value = _state.subject;
      const b = document.getElementById('cm-body');    if (b) b.value = _state.body;
      const pcSection = document.getElementById('cm-pc-section');
      if (pcSection) pcSection.outerHTML = _renderPCSection();
      U.toast(`Applied template: ${t.name}`);
    }
  }

  function _renderPCSection() {
    const q = _state.pcQuote;
    if (!q) return `<div id="cm-pc-section" class="hidden"></div>`;
    const b = _state.bond;
    const label = `${q.partnerName} · ${q.rateOptionName} · ${U.usd(q.premium||0)} premium · ${U.usd(q.commission||0)} commission (${q.status})`;
    const t = _state.templateId ? DB.templates().find(x => x.id === _state.templateId) : null;
    const isReportTpl = _state.templateId === 'T-bond-report-surety' || (t && t.category === 'Bond Reporting');
    return `
      <div id="cm-pc-section" class="p-3 rounded-lg bg-cream-100 border border-cream-200 flex items-start gap-3">
        <div class="mt-0.5">
          <input id="cm-attach-pc" type="checkbox" class="chk" ${_state.attachPC?'checked':''}
            onchange="Compose._togglePCAttach(this.checked)">
        </div>
        <div class="flex-1">
          <label for="cm-attach-pc" class="text-sm font-medium text-ink-700 cursor-pointer">
            📎 Attach Premium Calculator (PC) as PDF
          </label>
          <div class="text-xs text-ink-400 mt-0.5">${U.esc(label)}</div>
          ${isReportTpl ? '<div class="text-[11px] text-brand-700 mt-1">Auto-attached for the Report to Surety template.</div>' : ''}
        </div>
      </div>`;
  }

  function _togglePCAttach(v) { _state.attachPC = !!v; }

  function renderModal() {
    const templates = DB.templates();
    const ctxKeys = Object.keys(_state.ctx).sort();
    const contextChips = ctxKeys.map(k => `<button type="button" class="kbd hover:bg-slate-200" onclick="Compose._insertVar('${k}')">{{${k}}}</button>`).join(' ');

    const linkChips = [
      _state.lead    && `<span class="badge badge-green">Lead: ${U.esc(_state.lead.companyName)}</span>`,
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
        ${_renderPCSection()}
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

    // Attach the Premium Calculator PDF if requested (and available).
    const attachments = [];
    if (_state.attachPC && _state.pcQuote) {
      const pdfAtt = _buildPCPdfAttachment(_state.pcQuote);
      if (pdfAtt) attachments.push(pdfAtt);
    }

    const id = U.uid('E');
    const sentEmail = {
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
      accountId:  _state.account?.id  || null,
      bondId:     _state.bond?.id     || null,
      pipelineId: _state.pipeline?.id || null,
      renewalId:  _state.renewal?.id  || null,
      leadId:     _state.lead?.id     || null,
      attachments,
      read:   true,
    };
    DB.emails().push(sentEmail);

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

    // If wired to a pipeline opportunity, log it in the activity timeline.
    if (_state.pipeline) {
      _state.pipeline.activity = _state.pipeline.activity || [];
      _state.pipeline.activity.push({
        id: U.uid('AC'),
        date: new Date().toISOString(),
        author: 'Casey V.',
        type:   'email',
        subject: subj,
        text:    `Sent to ${_state.to}: ${body.slice(0, 240)}${body.length>240?'…':''}`,
        emailId: id,
      });
    }

    // If wired to a lead, log it on the lead activity timeline.
    if (_state.lead) {
      _state.lead.activity = _state.lead.activity || [];
      _state.lead.activity.push({
        id: U.uid('LA'),
        date: new Date().toISOString(),
        author: 'Casey V.',
        type:   'email',
        subject: subj,
        text:    `Sent to ${_state.to}: ${body.slice(0, 240)}${body.length>240?'…':''}`,
        emailId: id,
      });
      _state.lead.lastTouch = new Date().toISOString().slice(0,10);
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

  function _buildPCPdfAttachment(q) {
    if (!window.PDF || !PDF.premiumQuote) return null;
    try {
      const account = q.accountId ? DB.findAccount(q.accountId) : null;
      const doc = PDF.premiumQuote({
        bondType: q.bondType,
        amount:   q.amount,
        principal: account ? account.name : (q.principalName || ''),
        obligee:  q.obligee || '',
        effective: q.effectiveDate || '',
        options: [{
          partner: q.partnerName,
          baseRate: q.effectiveRate,
          adjRate:  q.effectiveRate,
          premium:  q.premium,
          commissionRate: q.commissionRate,
          commission: q.commission,
        }],
      });
      const dataUrl = doc.output('datauristring');
      const size = Math.round((dataUrl.length * 3) / 4);
      return {
        id: U.uid('EA'),
        name: `PC_${(q.partnerName||'quote').replace(/\s+/g,'_')}_${(q.savedAt||'').slice(0,10)}.pdf`,
        size,
        type: 'application/pdf',
        dataUrl,
        sourceQuoteId: q.id,
        uploaded: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('Could not build PC PDF', err);
      return null;
    }
  }

  return { open, applyTemplate, _insertVar, _togglePCAttach, preview, send, saveDraft, interpolate };
})();
