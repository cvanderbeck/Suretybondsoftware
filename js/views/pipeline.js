window.Views = window.Views || {};
Views.pipeline = {
  get STAGES() { return DB.pipelineStages(); },

  BID_RESULTS: [
    { key: 'pending',       label: 'Pending — awaiting result',       badge: 'badge-slate',  prob: null },
    { key: 'low',           label: 'Apparent Low Bidder',             badge: 'badge-blue',   prob: 90 },
    { key: 'awarded',       label: 'Awarded — we won',                badge: 'badge-green',  prob: 100 },
    { key: 'not_low',       label: 'Not Low — lost on price',         badge: 'badge-rose',   prob: 0 },
    { key: 'no_bid',        label: 'Principal Did Not Bid',           badge: 'badge-amber',  prob: 0 },
    { key: 'withdrawn',     label: 'Bid Withdrawn',                   badge: 'badge-slate',  prob: 0 },
    { key: 'cancelled',     label: 'Project Cancelled by Obligee',    badge: 'badge-slate',  prob: 0 },
  ],

  resultMeta(key) {
    return this.BID_RESULTS.find(r => r.key === key) || null;
  },

  render() {
    const items = DB.pipeline();
    const stages = this.STAGES;
    const totalByStage = {};
    stages.forEach(s => totalByStage[s] = items.filter(i => i.stage === s).reduce((a,b)=>a+b.amount,0));

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Pipeline</h1>
          <p class="section-sub">Drag opportunities through your stages. Click any card for full detail or to convert to a bond.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.pipeline.manageStages()">⚙ Manage Stages</button>
          <button class="btn-secondary" onclick="Views.pipeline.exportCSV()">Export CSV</button>
          <button class="btn-primary" onclick="Views.pipeline.addModal()">+ Add Opportunity</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
        ${stages.map(stage => {
          const list = items.filter(i => i.stage === stage);
          return `
            <div class="kanban-col" data-stage="${U.esc(stage)}"
                 ondragover="event.preventDefault(); this.classList.add('drop-target');"
                 ondragleave="this.classList.remove('drop-target');"
                 ondrop="Views.pipeline.onDrop(event, this.dataset.stage)">
              <div class="kanban-col-header">
                <div class="text-xs font-semibold text-slate-700 uppercase truncate">${U.esc(stage)}</div>
                <div class="text-xs text-slate-500 whitespace-nowrap">${list.length} · ${U.usd(totalByStage[stage])}</div>
              </div>
              ${list.map(it => Views.pipeline.card(it)).join('')}
            </div>`;
        }).join('')}
      </div>
    `;
  },

  card(it) {
    const a = DB.findAccount(it.accountId) || {};
    const due = it.dueDate ? `Due ${U.date(it.dueDate)}` : '';
    const probColor = it.probability >= 70 ? 'text-emerald-600' : it.probability >= 40 ? 'text-amber-600' : 'text-slate-500';
    const resultMeta = this.resultMeta(it.bidResult);
    const resultBadge = resultMeta && it.bidResult !== 'pending'
      ? `<span class="badge ${resultMeta.badge} text-[10px] py-0">${U.esc(resultMeta.label)}</span>`
      : '';
    const activityCount = (it.activity || []).length;
    return `
      <div class="kanban-card" draggable="true" data-id="${it.id}"
        ondragstart="event.dataTransfer.setData('text/plain','${it.id}'); this.classList.add('dragging')"
        ondragend="this.classList.remove('dragging')"
        onclick="Views.pipeline.open('${it.id}')">
        <div class="flex items-center justify-between mb-1">
          <div class="text-sm font-semibold text-slate-800 truncate">${U.esc(a.name || '—')}</div>
          <span class="text-xs ${probColor} font-medium">${it.probability}%</span>
        </div>
        <div class="text-xs text-slate-600 mb-1">${U.esc(BondTypes.normalize(it.bondType))} · ${U.usd(it.amount)}</div>
        <div class="text-xs text-slate-500 truncate">${U.esc(it.obligee||'')}</div>
        ${(() => { const s = BondTypes.fieldSummary(it.bondType, it); return s ? `<div class="text-[11px] text-ink-300 truncate mt-1">${U.esc(s)}</div>` : ''; })()}
        ${resultBadge ? `<div class="mt-2">${resultBadge}</div>` : ''}
        <div class="flex items-center justify-between mt-2">
          <div class="text-xs text-slate-400 flex items-center gap-2">
            ${due ? `<span>${due}</span>` : ''}
            ${activityCount ? `<span title="${activityCount} activity entries">📎 ${activityCount}</span>` : ''}
          </div>
          <button class="text-xs text-brand-600 hover:underline" onclick="event.stopPropagation(); Compose.open({ pipelineId: '${it.id}', templateId: 'T-bid-followup' })">✉ Email</button>
        </div>
      </div>
    `;
  },

  onDrop(ev, stage) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/plain');
    const it = DB.pipeline().find(i => i.id === id);
    if (!it) return;
    it.stage = stage;
    if (stage === 'Awarded - Ready to Issue') it.probability = 100;
    DB.save();
    U.toast(`Moved to ${stage}`);
    this.render();
  },

  open(id) {
    const it = DB.pipeline().find(i => i.id === id);
    if (!it) return;
    const a = DB.findAccount(it.accountId) || {};
    const stages = this.STAGES;
    const accts = DB.accounts();
    const result = it.bidResult || 'pending';
    const resultMeta = this.resultMeta(result);

    const activity = (it.activity || []).slice().sort((x,y) => new Date(y.date) - new Date(x.date));

    const body = `
      <div class="flex items-start justify-between -mt-2 mb-4">
        <div>
          <div class="field-label">Account</div>
          <button class="text-lg font-semibold text-brand-700 hover:underline text-left"
            onclick="U.closeModals(); Views.accounts.open('${a.id}')">
            ${U.esc(a.name||'—')}
          </button>
          <div class="text-xs text-slate-500">${U.esc(a.type||'')}${a.city?` · ${U.esc(a.city)}, ${U.esc(a.state||'')}`:''}</div>
        </div>
        <div class="text-right">
          <span class="badge ${resultMeta ? resultMeta.badge : 'badge-slate'}">${U.esc(resultMeta ? resultMeta.label : 'Pending')}</span>
          <div class="text-xs text-slate-500 mt-1">${(it.activity||[]).length} activity entr${(it.activity||[]).length===1?'y':'ies'}</div>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header"><div class="card-title">Opportunity Details</div></div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <div><div class="field-label">Account (change)</div>
            <select id="pl-acct" class="field-select">
              ${accts.map(x => `<option value="${x.id}" ${x.id===it.accountId?'selected':''}>${U.esc(x.name)}</option>`).join('')}
            </select></div>
          <div><div class="field-label">Producer</div>
            <input id="pl-prod" class="field-input" value="${U.esc(it.producer||'')}"></div>
          <div><div class="field-label">Bond Type</div>
            <select id="pl-type" class="field-select" onchange="Views.pipeline._reRenderTypeFields()">
              ${BondTypes.TYPES.map(t => `<option ${t===BondTypes.normalize(it.bondType)?'selected':''}>${U.esc(t)}</option>`).join('')}
            </select></div>
          <div><div class="field-label">Amount</div>
            <input id="pl-amt" type="number" class="field-input" value="${it.amount||0}"></div>
          <div><div class="field-label">Obligee</div>
            <input id="pl-ob" class="field-input" value="${U.esc(it.obligee||'')}"></div>
          <div><div class="field-label">Due / Bid Date</div>
            <input id="pl-due" type="date" class="field-input" value="${U.esc(it.dueDate||'')}"></div>
          <div><div class="field-label">Stage</div>
            <select id="pl-stage" class="field-select">
              ${stages.map(s => `<option ${s===it.stage?'selected':''}>${U.esc(s)}</option>`).join('')}
            </select></div>
          <div><div class="field-label">Probability</div>
            <input id="pl-prob" type="range" min="0" max="100" value="${it.probability}" class="w-full"
              oninput="document.getElementById('pl-prob-val').textContent=this.value+'%'">
            <div class="text-xs text-slate-500" id="pl-prob-val">${it.probability}%</div>
          </div>
          <div class="col-span-2"><div class="field-label">Notes</div>
            <textarea class="field-textarea" id="pl-notes" rows="2">${U.esc(it.notes||'')}</textarea></div>

          ${this._oppDetailsExtras(it)}
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">${U.esc(BondTypes.normalize(it.bondType) || 'Bond')} — Type-Specific Details</div>
          <span class="text-xs text-ink-300 italic">${U.esc(BondTypes.blurbFor(it.bondType) || '')}</span>
        </div>
        <div class="p-4">
          <div id="pl-typefields">${BondTypes.renderFields(BondTypes.normalize(it.bondType), it)}</div>
        </div>
      </div>

      ${this._deliveryCard(it)}

      <div class="card mb-4">
        <div class="card-header"><div class="card-title">Bid Results</div>
          <span class="text-xs text-slate-500">Track final outcome — "Not Low" and "Principal Did Not Bid" supported.</span>
        </div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <div class="col-span-2"><div class="field-label">Result</div>
            <select id="pl-result" class="field-select" onchange="Views.pipeline._onResultChange()">
              ${this.BID_RESULTS.map(r => `<option value="${r.key}" ${r.key===result?'selected':''}>${U.esc(r.label)}</option>`).join('')}
            </select></div>
          <div><div class="field-label">Bid Open Date</div>
            <input id="pl-biddate" type="date" class="field-input" value="${U.esc(it.bidDate||'')}"></div>
          <div><div class="field-label">Our Bid Amount</div>
            <input id="pl-ouramt" type="number" class="field-input" value="${it.bidOurAmount||''}" placeholder="Our principal's submitted bid"></div>
          <div id="pl-wrap-winamt"><div class="field-label">Winning Bid Amount</div>
            <input id="pl-winamt" type="number" class="field-input" value="${it.bidWinningAmount||''}" placeholder="If known"></div>
          <div id="pl-wrap-place"><div class="field-label">Our Place</div>
            <input id="pl-place" class="field-input" value="${U.esc(it.bidPlace||'')}" placeholder='e.g. "2nd of 5"'></div>
          <div class="col-span-2"><div class="field-label">Winning Bidder</div>
            <input id="pl-winner" class="field-input" value="${U.esc(it.bidWinner||'')}" placeholder="Competitor or alternate that was awarded"></div>
          <div class="col-span-2"><div class="field-label">Result Notes</div>
            <textarea id="pl-resnotes" class="field-textarea" rows="2" placeholder="Why didn't we get it? Did principal decide not to bid?">${U.esc(it.bidResultNotes||'')}</textarea></div>
        </div>
      </div>

      ${Views.templates.renderTasksCard('opportunity', it.id, it)}

      <div class="card">
        <div class="card-header">
          <div class="card-title">Activity Log</div>
          <span class="text-xs text-slate-500">${activity.length} entr${activity.length===1?'y':'ies'}</span>
        </div>
        <div class="p-4 space-y-3">
          ${activity.length ? activity.map(n => Views.pipeline._activityRow(n)).join('')
            : '<div class="text-sm text-slate-400">No activity yet. Send an email or log a note below.</div>'}
          <div class="pt-3 border-t border-slate-100">
            <div class="field-label">Log a note, call, or other touchpoint</div>
            <div class="flex gap-2">
              <select id="pl-newtype" class="field-select w-40">
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="bid_result">Bid Result</option>
                <option value="other">Other</option>
              </select>
              <textarea id="pl-newtext" class="field-textarea" rows="2" placeholder="What happened? e.g. Called PM, no answer — left VM."></textarea>
            </div>
            <div class="flex justify-end mt-2">
              <button class="btn-primary" onclick="Views.pipeline._logActivity('${id}')">Log Entry</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const footer = `
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-secondary text-rose-600" onclick="Views.pipeline.deleteOpp('${id}')">Delete</button>
      <button class="btn-secondary" onclick="Compose.open({ pipelineId: '${id}', templateId: 'T-bid-followup' })">✉ Email</button>
      <button class="btn-secondary" onclick="Views.templates.openApplyPicker({ kind:'opportunity', id:'${id}', reopen: () => Views.pipeline.open('${id}') })">▶ Apply Template</button>
      <button class="btn-secondary" onclick="Views.pipeline.convertToBond('${id}')">Convert to Bond</button>
      <button class="btn-primary" onclick="Views.pipeline.save('${id}')">Save</button>
    `;
    const m = U.modal({ title: 'Opportunity', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    this._onResultChange();
  },

  _activityRow(n) {
    const ICONS = { email: '✉', call: '📞', meeting: '👥', note: '📝', bid_result: '🏷', stage_change: '↪', other: '•' };
    const colors = { email: 'border-blue-300', call: 'border-emerald-300', meeting: 'border-violet-300', note: 'border-slate-300', bid_result: 'border-amber-300', stage_change: 'border-slate-300', other: 'border-slate-300' };
    const icon = ICONS[n.type] || '•';
    const color = colors[n.type] || 'border-slate-300';
    return `
      <div class="border-l-2 ${color} pl-3 py-1">
        <div class="text-xs text-slate-500 flex items-center gap-2">
          <span>${icon}</span>
          <span>${U.datetime(n.date)}</span>
          <span>· ${U.esc(n.author||'')}</span>
          ${n.subject?`<span class="font-medium text-slate-700">· ${U.esc(n.subject)}</span>`:''}
        </div>
        <div class="text-sm text-slate-700 whitespace-pre-line mt-0.5">${U.esc(n.text||'')}</div>
      </div>`;
  },

  _reRenderTypeFields() {
    const newType = document.getElementById('pl-type').value;
    const wrap = document.getElementById('pl-typefields');
    if (wrap) wrap.innerHTML = BondTypes.renderFields(newType, { typeSpecific: {} });
  },

  // ---------- Opportunity Details — issuance fields embedded inline ----------
  _oppDetailsExtras(it) {
    const i = it.issuance || {};
    const formsType = i.bondFormsType || 'aia';
    return `
      <div class="col-span-2"><div class="field-label">Legal Job Description</div>
        <textarea id="pl-legaljob" class="field-textarea" rows="2" placeholder="Full legal name of the project as it should appear on the bond.">${U.esc(i.legalJobDescription||'')}</textarea>
      </div>
      <div class="col-span-2"><div class="field-label">Identifying Numbers</div>
        <input id="pl-idnums" class="field-input font-mono" value="${U.esc(i.identifyingNumbers||'')}" placeholder="Project # / Contract # / RFP # / Bid # / Solicitation #">
      </div>
      <div class="col-span-2">
        <div class="field-label">Bond Forms Required</div>
        <div class="flex gap-4 mt-1">
          <label class="flex items-center gap-2 text-sm">
            <input type="radio" name="pl-bondforms" value="aia" ${formsType==='aia'?'checked':''} onchange="Views.pipeline._onIssuanceChange()">
            AIA Standard Forms (A310 / A312)
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="radio" name="pl-bondforms" value="specific" ${formsType==='specific'?'checked':''} onchange="Views.pipeline._onIssuanceChange()">
            Specific Bond Forms Required
          </label>
        </div>
      </div>
      <div class="col-span-2" id="pl-specific-wrap" style="${formsType==='specific'?'':'display:none'}">
        <div class="field-label">Required Bond Forms</div>
        <textarea id="pl-bondforms-specific" class="field-textarea" rows="2" placeholder="Describe the specific bond form(s) required and where to find them (e.g. 'City of Portland Performance Bond — Form CB-12, attached to RFP'). Attach forms to the Documents library.">${U.esc(i.bondFormsSpecific||'')}</textarea>
      </div>
    `;
  },

  // ---------- Delivery Method card (its own section after type-specific) ----------
  _deliveryCard(it) {
    const i = it.issuance || {};
    const deliveryMode = i.deliveryMethod || 'electronic';
    return `
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">Delivery Method</div>
          <span class="text-xs text-ink-300 italic">How the issued bond reaches the principal</span>
        </div>
        <div class="p-4 grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <div class="flex gap-4 mt-1">
              <label class="flex items-center gap-2 text-sm">
                <input type="radio" name="pl-delivery" value="electronic" ${deliveryMode==='electronic'?'checked':''} onchange="Views.pipeline._onIssuanceChange()">
                Electronic (e-signed)
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="radio" name="pl-delivery" value="fedex" ${deliveryMode==='fedex'?'checked':''} onchange="Views.pipeline._onIssuanceChange()">
                FedEx
              </label>
            </div>
          </div>

          <div class="col-span-2" id="pl-fedex-wrap" style="${deliveryMode==='fedex'?'':'display:none'}">
            <div class="field-label">FedEx Delivery Address</div>
            <textarea id="pl-deliveryaddr" class="field-textarea" rows="3" placeholder="Full mailing address — recipient name, company, street, suite, city, state, ZIP">${U.esc(i.deliveryAddress||'')}</textarea>
          </div>

          <div class="col-span-2" id="pl-electronic-wrap" style="${deliveryMode==='electronic'?'':'display:none'}">
            <div class="text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2">Signer (Authorized Principal Representative)</div>
            <div class="grid grid-cols-3 gap-3">
              <div><div class="field-label">Full Name</div>
                <input id="pl-signer-name" class="field-input" value="${U.esc(i.signerName||'')}"></div>
              <div><div class="field-label">Title</div>
                <input id="pl-signer-title" class="field-input" value="${U.esc(i.signerTitle||'')}"></div>
              <div><div class="field-label">Email</div>
                <input id="pl-signer-email" type="email" class="field-input" value="${U.esc(i.signerEmail||'')}"></div>
            </div>
            <div class="text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2 mt-3">Witness</div>
            <div class="grid grid-cols-2 gap-3">
              <div><div class="field-label">Full Name</div>
                <input id="pl-witness-name" class="field-input" value="${U.esc(i.witnessName||'')}"></div>
              <div><div class="field-label">Email</div>
                <input id="pl-witness-email" type="email" class="field-input" value="${U.esc(i.witnessEmail||'')}"></div>
            </div>
          </div>
        </div>
      </div>`;
  },

  _onIssuanceChange() {
    const forms = document.querySelector('input[name="pl-bondforms"]:checked')?.value || 'aia';
    const delivery = document.querySelector('input[name="pl-delivery"]:checked')?.value || 'electronic';
    const specWrap  = document.getElementById('pl-specific-wrap');
    const fedexWrap = document.getElementById('pl-fedex-wrap');
    const elecWrap  = document.getElementById('pl-electronic-wrap');
    if (specWrap)  specWrap.style.display  = forms === 'specific' ? '' : 'none';
    if (fedexWrap) fedexWrap.style.display = delivery === 'fedex' ? '' : 'none';
    if (elecWrap)  elecWrap.style.display  = delivery === 'electronic' ? '' : 'none';
  },

  _readIssuance() {
    const forms = document.querySelector('input[name="pl-bondforms"]:checked')?.value || 'aia';
    const delivery = document.querySelector('input[name="pl-delivery"]:checked')?.value || 'electronic';
    const get = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    return {
      legalJobDescription: get('pl-legaljob'),
      identifyingNumbers:  get('pl-idnums'),
      bondFormsType:       forms,
      bondFormsSpecific:   forms === 'specific' ? get('pl-bondforms-specific') : '',
      deliveryMethod:      delivery,
      deliveryAddress:     delivery === 'fedex' ? get('pl-deliveryaddr') : '',
      signerName:          delivery === 'electronic' ? get('pl-signer-name')  : '',
      signerTitle:         delivery === 'electronic' ? get('pl-signer-title') : '',
      signerEmail:         delivery === 'electronic' ? get('pl-signer-email') : '',
      witnessName:         delivery === 'electronic' ? get('pl-witness-name')  : '',
      witnessEmail:        delivery === 'electronic' ? get('pl-witness-email') : '',
    };
  },

  _onResultChange() {
    const sel = document.getElementById('pl-result');
    if (!sel) return;
    const key = sel.value;
    // Show/hide winning amount + place based on result type
    const showWin = (key === 'not_low');
    document.getElementById('pl-wrap-winamt').style.display = showWin ? '' : 'none';
    document.getElementById('pl-wrap-place').style.display  = (key === 'not_low' || key === 'low') ? '' : 'none';
  },

  _logActivity(id) {
    const it = DB.pipeline().find(i => i.id === id);
    const type = document.getElementById('pl-newtype').value;
    const text = document.getElementById('pl-newtext').value.trim();
    if (!text) { U.toast('Enter a note', 'warn'); return; }
    it.activity = it.activity || [];
    it.activity.push({
      id: U.uid('AC'),
      date: new Date().toISOString(),
      author: 'Casey V.',
      type, text,
    });
    DB.save();
    U.toast('Activity logged');
    this.open(id);
  },

  save(id) {
    const it = DB.pipeline().find(i => i.id === id);
    const prevResult = it.bidResult || 'pending';

    it.accountId = document.getElementById('pl-acct').value;
    it.bondType  = document.getElementById('pl-type').value;
    it.amount    = +document.getElementById('pl-amt').value || 0;
    it.obligee   = document.getElementById('pl-ob').value;
    it.dueDate   = document.getElementById('pl-due').value || null;
    it.stage     = document.getElementById('pl-stage').value;
    it.producer  = document.getElementById('pl-prod').value;
    it.probability = +document.getElementById('pl-prob').value;
    it.notes     = document.getElementById('pl-notes').value;
    it.typeSpecific = BondTypes.readFields(it.bondType);
    it.issuance     = this._readIssuance();

    // Bid result fields
    const newResult = document.getElementById('pl-result').value;
    it.bidResult        = newResult;
    it.bidDate          = document.getElementById('pl-biddate').value || null;
    it.bidOurAmount     = +document.getElementById('pl-ouramt').value || null;
    it.bidWinningAmount = +document.getElementById('pl-winamt').value || null;
    it.bidPlace         = document.getElementById('pl-place').value || '';
    it.bidWinner        = document.getElementById('pl-winner').value || '';
    it.bidResultNotes   = document.getElementById('pl-resnotes').value || '';

    // If the result changed, auto-adjust probability and log to activity.
    if (newResult !== prevResult) {
      const meta = this.resultMeta(newResult);
      if (meta && meta.prob !== null) it.probability = meta.prob;
      it.activity = it.activity || [];
      it.activity.push({
        id: U.uid('AC'),
        date: new Date().toISOString(),
        author: 'Casey V.',
        type: 'bid_result',
        subject: `Result: ${meta ? meta.label : newResult}`,
        text: it.bidResultNotes || '(no additional notes)',
      });
    }

    DB.save();
    U.closeModals();
    U.toast('Opportunity updated');
    this.render();
  },

  deleteOpp(id) {
    if (!confirm('Delete this opportunity?')) return;
    DB.state.pipeline = DB.pipeline().filter(p => p.id !== id);
    DB.save();
    U.closeModals();
    U.toast('Opportunity deleted', 'info');
    this.render();
  },

  // ---------- Convert to Bond — full approved-details form ----------
  convertToBond(id) {
    const it = DB.pipeline().find(i => i.id === id);
    if (!it) return;
    const a = DB.findAccount(it.accountId) || {};
    const partners = DB.partners();
    const today = new Date();
    const expDefault = new Date(today); expDefault.setFullYear(expDefault.getFullYear()+1);
    const ratePct = (it.bondType === 'Bid') ? 0 : 1.5;
    const premium = (it.bondType === 'Bid') ? 0 : Math.round(it.amount * ratePct/100);

    const proposedNumber = 'SF-' + new Date().getFullYear() + '-' + String(DB.bonds().length + 200).padStart(5,'0');

    const body = `
      <div class="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded mb-4">
        Review and confirm <b>approved bond details</b> before issuing. The bond will be created with the values below.
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Bond Number</div>
          <input id="cv-num" class="field-input" value="${proposedNumber}"></div>
        <div><div class="field-label">Bond Type</div>
          <select id="cv-type" class="field-select">${BondTypes.TYPES.map(t=>`<option ${t===BondTypes.normalize(it.bondType)?'selected':''}>${U.esc(t)}</option>`).join('')}</select></div>

        <div class="col-span-2"><div class="field-label">Principal</div>
          <input class="field-input bg-slate-50" value="${U.esc(a.name||'')}" disabled></div>

        <div><div class="field-label">Surety Partner</div>
          <select id="cv-partner" class="field-select">${partners.map(p=>`<option value="${p.id}">${U.esc(p.name)}</option>`).join('')}</select></div>
        <div><div class="field-label">Status</div>
          <select id="cv-status" class="field-select">${['Pending UW','Active','Expired','Cancelled'].map(s=>`<option ${s==='Active'?'selected':''}>${s}</option>`).join('')}</select></div>

        <div class="col-span-2"><div class="field-label">Obligee</div>
          <input id="cv-ob" class="field-input" value="${U.esc(it.obligee||'')}"></div>
        <div class="col-span-2"><div class="field-label">Project / Description</div>
          <input id="cv-proj" class="field-input" value="${U.esc(it.notes||'')}"></div>

        <div><div class="field-label">Bond Amount</div>
          <input id="cv-amt" type="number" class="field-input" value="${it.amount||0}" oninput="Views.pipeline._cvRecalc()"></div>
        <div><div class="field-label">Rate %</div>
          <input id="cv-rate" type="number" step="0.1" class="field-input" value="${ratePct}" oninput="Views.pipeline._cvRecalc()"></div>
        <div><div class="field-label">Premium</div>
          <input id="cv-prem" type="number" class="field-input" value="${premium}"></div>
        <div><div class="field-label">Commission %</div>
          <input id="cv-comm" type="number" step="0.5" class="field-input" value="25"></div>

        <div><div class="field-label">Effective</div>
          <input id="cv-eff" type="date" class="field-input" value="${today.toISOString().slice(0,10)}"></div>
        <div><div class="field-label">Expires</div>
          <input id="cv-exp" type="date" class="field-input" value="${expDefault.toISOString().slice(0,10)}"></div>

        <div><div class="field-label">QuickBooks Invoice #</div>
          <input id="cv-qbo" class="field-input" placeholder="e.g. 1047 (optional, can add later)"></div>
        <div></div>
      </div>

      <div class="divider"></div>
      <div class="text-xs font-semibold text-slate-500 uppercase mb-2">Bond Tracking</div>
      <div class="grid grid-cols-3 gap-3">
        <div><div class="field-label">Reported to Bond Co.</div>
          <input id="cv-rep" type="date" class="field-input" value=""></div>
        <div><div class="field-label">Approved by Obligee</div>
          <input id="cv-app" type="date" class="field-input" value=""></div>
        <div><div class="field-label">Sent to Principal</div>
          <input id="cv-sent" type="date" class="field-input" value=""></div>
      </div>
    `;
    const footer = `
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.pipeline._commitConvert('${id}')">Create Bond</button>
    `;
    const m = U.modal({ title: 'Convert Opportunity → Approved Bond', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _cvRecalc() {
    const a = +document.getElementById('cv-amt').value || 0;
    const r = +document.getElementById('cv-rate').value || 0;
    document.getElementById('cv-prem').value = Math.round(a * r / 100);
  },

  _commitConvert(opportunityId) {
    const it = DB.pipeline().find(i => i.id === opportunityId);
    if (!it) return;
    const newBond = {
      id: U.uid('B'),
      number:    document.getElementById('cv-num').value,
      type:      document.getElementById('cv-type').value,
      accountId: it.accountId,
      partnerId: document.getElementById('cv-partner').value,
      obligee:   document.getElementById('cv-ob').value,
      project:   document.getElementById('cv-proj').value,
      amount:    +document.getElementById('cv-amt').value || 0,
      rate:      +document.getElementById('cv-rate').value || 0,
      premium:   +document.getElementById('cv-prem').value || 0,
      commissionRate: +document.getElementById('cv-comm').value || 0,
      effective: document.getElementById('cv-eff').value,
      expires:   document.getElementById('cv-exp').value,
      status:    document.getElementById('cv-status').value,
      qboInvoiceNumber: document.getElementById('cv-qbo').value || '',
      reportedToBondCo: document.getElementById('cv-rep').value || null,
      obligeeApproved:  document.getElementById('cv-app').value || null,
      sentToPrincipal:  document.getElementById('cv-sent').value || null,
      // Carry the opportunity's type-specific details into the new bond
      typeSpecific: it.typeSpecific ? JSON.parse(JSON.stringify(it.typeSpecific)) : {},
      issuance:     it.issuance     ? JSON.parse(JSON.stringify(it.issuance))     : {},
    };
    DB.bonds().push(newBond);
    it.stage = 'Awarded - Ready to Issue';
    it.probability = 100;
    it.convertedBondId = newBond.id;
    DB.save();
    U.closeModals();
    U.toast(`Bond ${newBond.number} created`);
    Files.provisionBond(newBond);
    App.go('bonds');
    setTimeout(() => Views.bonds.open(newBond.id), 60);
  },

  // ---------- Stage manager ----------
  manageStages() {
    const stages = this.STAGES;
    const counts = {};
    stages.forEach(s => counts[s] = DB.pipeline().filter(p => p.stage === s).length);

    const body = `
      <p class="text-sm text-slate-600 mb-3">Add, rename, reorder, or remove pipeline stages. Stages with active opportunities can't be deleted — move those cards first.</p>
      <div class="space-y-2" id="ms-list">
        ${stages.map((s, i) => `
          <div class="flex items-center gap-2 p-2 border border-slate-200 rounded-lg" data-idx="${i}">
            <div class="text-slate-400 w-6 text-center">⋮⋮</div>
            <input class="field-input flex-1" data-name value="${U.esc(s)}">
            <span class="text-xs text-slate-500 w-20 text-right">${counts[s]} opp${counts[s]===1?'':'s'}</span>
            <button class="btn-ghost" title="Move up" onclick="Views.pipeline._moveStage(${i}, -1)">↑</button>
            <button class="btn-ghost" title="Move down" onclick="Views.pipeline._moveStage(${i}, 1)">↓</button>
            <button class="btn-ghost text-rose-600" title="Delete" onclick="Views.pipeline._deleteStage(${i})" ${counts[s]?'disabled':''}>✕</button>
          </div>
        `).join('')}
      </div>

      <div class="divider"></div>
      <div class="flex gap-2">
        <input id="ms-new" class="field-input flex-1" placeholder="New stage name…">
        <button class="btn-primary" onclick="Views.pipeline._addStage()">Add Stage</button>
      </div>
      <div class="mt-3 text-right">
        <button class="btn-ghost" onclick="Views.pipeline._resetStages()">Reset to defaults</button>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Close</button><button class="btn-primary" onclick="Views.pipeline._saveStageNames()">Save Names</button>`;
    const m = U.modal({ title: 'Manage Pipeline Stages', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _saveStageNames() {
    const inputs = document.querySelectorAll('#ms-list [data-name]');
    const stages = DB.pipelineStages();
    const old = stages.slice();
    const renames = {};
    inputs.forEach((inp, i) => {
      const v = inp.value.trim();
      if (v && stages[i] !== v) {
        renames[stages[i]] = v;
        stages[i] = v;
      }
    });
    // propagate renames to pipeline opportunities
    if (Object.keys(renames).length) {
      DB.pipeline().forEach(p => { if (renames[p.stage]) p.stage = renames[p.stage]; });
    }
    DB.save();
    U.closeModals();
    U.toast('Stages saved');
    this.render();
  },

  _addStage() {
    const v = document.getElementById('ms-new').value.trim();
    if (!v) return;
    if (DB.pipelineStages().includes(v)) { U.toast('Stage already exists', 'warn'); return; }
    DB.pipelineStages().push(v);
    DB.save();
    this.manageStages(); // reopen
  },

  _moveStage(idx, delta) {
    const s = DB.pipelineStages();
    const j = idx + delta;
    if (j < 0 || j >= s.length) return;
    [s[idx], s[j]] = [s[j], s[idx]];
    DB.save();
    this.manageStages();
  },

  _deleteStage(idx) {
    const s = DB.pipelineStages();
    const stage = s[idx];
    const inUse = DB.pipeline().some(p => p.stage === stage);
    if (inUse) { U.toast('Move opportunities out of this stage first', 'warn'); return; }
    if (s.length <= 1) { U.toast('At least one stage is required', 'warn'); return; }
    s.splice(idx, 1);
    DB.save();
    this.manageStages();
  },

  _resetStages() {
    if (!confirm('Reset stages to the default 7-stage flow? Any custom stages will be removed (opportunities in them will move to the first default stage).')) return;
    const defaults = ['Request Received','Pre-Qualification','Submission in Progress','Submitted to Underwriter','Underwriter Review','Approved – Pending Bid Results','Awarded - Ready to Issue'];
    DB.pipeline().forEach(p => { if (!defaults.includes(p.stage)) p.stage = defaults[0]; });
    DB.state.pipelineStages = defaults.slice();
    DB.save();
    U.closeModals();
    U.toast('Stages reset to defaults');
    this.render();
  },

  // ---------- New opportunity ----------
  addModal() {
    const accts = DB.accounts();
    const stages = this.STAGES;
    const body = `
      <div class="grid grid-cols-2 gap-4">
        <div><div class="field-label">Account</div>
          <select id="op-acct" class="field-select">${accts.map(a => `<option value="${a.id}">${U.esc(a.name)}</option>`).join('')}</select></div>
        <div><div class="field-label">Bond Type</div>
          <select id="op-type" class="field-select">${BondTypes.TYPES.map(t=>`<option>${U.esc(t)}</option>`).join('')}</select></div>
        <div><div class="field-label">Amount</div><input id="op-amt" type="number" class="field-input" placeholder="500000"></div>
        <div><div class="field-label">Obligee</div><input id="op-ob" class="field-input"></div>
        <div><div class="field-label">Due / Bid Date</div><input id="op-due" type="date" class="field-input"></div>
        <div><div class="field-label">Stage</div>
          <select id="op-stage" class="field-select">${stages.map(s=>`<option ${s===stages[0]?'selected':''}>${U.esc(s)}</option>`).join('')}</select></div>
      </div>
      <div class="mt-3"><div class="field-label">Notes</div><textarea id="op-notes" class="field-textarea" rows="3"></textarea></div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.pipeline.create()">Create</button>`;
    const m = U.modal({ title: 'New Request', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  create() {
    DB.pipeline().push({
      id: U.uid('PL'),
      accountId: document.getElementById('op-acct').value,
      bondType:  document.getElementById('op-type').value,
      amount:    +document.getElementById('op-amt').value || 0,
      obligee:   document.getElementById('op-ob').value,
      dueDate:   document.getElementById('op-due').value,
      stage:     document.getElementById('op-stage').value,
      notes:     document.getElementById('op-notes').value,
      producer:  'CV',
      probability: 30,
    });
    DB.save();
    U.closeModals();
    U.toast('Opportunity created');
    this.render();
  },

  exportCSV() {
    const rows = [['Stage','Account','Bond Type','Amount','Obligee','Due','Probability','Bid Result','Bid Date','Our Bid','Winning Bid','Place','Winner','Notes','Activity Count']];
    DB.pipeline().forEach(p => {
      const a = DB.findAccount(p.accountId) || {};
      const meta = this.resultMeta(p.bidResult || 'pending');
      rows.push([
        p.stage, a.name||'', p.bondType, p.amount, p.obligee||'', p.dueDate||'',
        p.probability+'%',
        meta ? meta.label : '', p.bidDate||'', p.bidOurAmount||'', p.bidWinningAmount||'', p.bidPlace||'', p.bidWinner||'',
        (p.notes||'').replace(/\n/g,' '),
        (p.activity||[]).length,
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='pipeline.csv'; a.click();
    U.toast('Pipeline exported');
  }
};
