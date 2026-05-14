window.Views = window.Views || {};
Views.pipeline = {
  STAGES: ['Prospect','Quoting','Submitted','Bid Awaiting','Won','Lost'],

  render() {
    const items = DB.pipeline();
    const totalByStage = {};
    this.STAGES.forEach(s => totalByStage[s] = items.filter(i => i.stage === s).reduce((a,b)=>a+b.amount,0));

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Pipeline & Bids</h1>
          <p class="section-sub">Drag opportunities between stages. Bids you are awaiting results on live in <b>Bid Awaiting</b>.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.pipeline.exportCSV()">Export CSV</button>
          <button class="btn-primary" onclick="Views.pipeline.addModal()">+ Add Opportunity</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        ${this.STAGES.map(stage => {
          const list = items.filter(i => i.stage === stage);
          return `
            <div class="kanban-col" data-stage="${stage}" ondragover="event.preventDefault(); this.classList.add('drop-target');" ondragleave="this.classList.remove('drop-target');" ondrop="Views.pipeline.onDrop(event, '${stage}')">
              <div class="kanban-col-header">
                <div class="text-xs font-semibold text-slate-700 uppercase">${stage}</div>
                <div class="text-xs text-slate-500">${list.length} · ${U.usd(totalByStage[stage])}</div>
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
    return `
      <div class="kanban-card" draggable="true" data-id="${it.id}"
        ondragstart="event.dataTransfer.setData('text/plain','${it.id}'); this.classList.add('dragging')"
        ondragend="this.classList.remove('dragging')"
        onclick="Views.pipeline.open('${it.id}')">
        <div class="flex items-center justify-between mb-1">
          <div class="text-sm font-semibold text-slate-800 truncate">${U.esc(a.name || '—')}</div>
          <span class="text-xs ${probColor} font-medium">${it.probability}%</span>
        </div>
        <div class="text-xs text-slate-600 mb-2">${U.esc(it.bondType)} · ${U.usd(it.amount)}</div>
        <div class="text-xs text-slate-500 truncate">${U.esc(it.obligee||'')}</div>
        <div class="flex items-center justify-between mt-1">
          <div class="text-xs text-slate-400">${due}</div>
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
    if (stage === 'Won') it.probability = 100;
    if (stage === 'Lost') it.probability = 0;
    DB.save();
    U.toast(`Moved to ${stage}`);
    this.render();
  },

  open(id) {
    const it = DB.pipeline().find(i => i.id === id);
    if (!it) return;
    const a = DB.findAccount(it.accountId) || {};
    const body = `
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><div class="field-label">Account</div><div class="text-sm font-medium">${U.esc(a.name||'—')}</div></div>
        <div><div class="field-label">Producer</div><div class="text-sm">${U.esc(it.producer||'')}</div></div>
        <div><div class="field-label">Bond Type</div><div class="text-sm">${U.esc(it.bondType)}</div></div>
        <div><div class="field-label">Amount</div><div class="text-sm">${U.usd(it.amount)}</div></div>
        <div><div class="field-label">Obligee</div><div class="text-sm">${U.esc(it.obligee||'')}</div></div>
        <div><div class="field-label">Due / Bid Date</div><div class="text-sm">${U.date(it.dueDate)}</div></div>
      </div>
      <div class="mb-2"><div class="field-label">Stage</div>
        <select class="field-select" id="pl-stage">
          ${Views.pipeline.STAGES.map(s => `<option ${s===it.stage?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="mb-2"><div class="field-label">Probability</div>
        <input id="pl-prob" type="range" min="0" max="100" value="${it.probability}" class="w-full" oninput="document.getElementById('pl-prob-val').textContent=this.value+'%'">
        <div class="text-xs text-slate-500" id="pl-prob-val">${it.probability}%</div>
      </div>
      <div class="mb-2"><div class="field-label">Notes</div>
        <textarea class="field-textarea" id="pl-notes" rows="3">${U.esc(it.notes||'')}</textarea>
      </div>
    `;
    const footer = `
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-secondary" onclick="Compose.open({ pipelineId: '${id}', templateId: 'T-bid-followup' })">✉ Email Follow-up</button>
      <button class="btn-secondary" onclick="Views.pipeline.convertToBond('${id}')">Convert to Bond</button>
      <button class="btn-primary" onclick="Views.pipeline.save('${id}')">Save</button>
    `;
    const m = U.modal({ title: 'Opportunity Details', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  save(id) {
    const it = DB.pipeline().find(i => i.id === id);
    it.stage = document.getElementById('pl-stage').value;
    it.probability = +document.getElementById('pl-prob').value;
    it.notes = document.getElementById('pl-notes').value;
    DB.save();
    U.closeModals();
    U.toast('Opportunity updated');
    this.render();
  },

  convertToBond(id) {
    const it = DB.pipeline().find(i => i.id === id);
    if (!it) return;
    // Create a draft bond
    const newId = U.uid('B');
    const number = 'SF-' + new Date().getFullYear() + '-' + String(DB.bonds().length + 200).padStart(5,'0');
    DB.bonds().push({
      id: newId, number,
      accountId: it.accountId,
      partnerId: DB.partners()[0]?.id,
      type: it.bondType, obligee: it.obligee, project: it.notes || '',
      amount: it.amount, premium: Math.round(it.amount * 0.015), rate: 1.5, commissionRate: 25,
      effective: new Date().toISOString().slice(0,10),
      expires:  new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0,10),
      status: 'Pending UW'
    });
    it.stage = 'Won'; it.probability = 100;
    DB.save();
    U.closeModals();
    U.toast('Converted to bond — review in Bonds');
    App.go('bonds');
  },

  addModal() {
    const accts = DB.accounts();
    const body = `
      <div class="grid grid-cols-2 gap-4">
        <div><div class="field-label">Account</div>
          <select id="op-acct" class="field-select">${accts.map(a => `<option value="${a.id}">${U.esc(a.name)}</option>`).join('')}</select></div>
        <div><div class="field-label">Bond Type</div>
          <select id="op-type" class="field-select">${['Bid','Performance','Payment','License','Court','Probate','Customs'].map(t=>`<option>${t}</option>`).join('')}</select></div>
        <div><div class="field-label">Amount</div><input id="op-amt" type="number" class="field-input" placeholder="500000"></div>
        <div><div class="field-label">Obligee</div><input id="op-ob" class="field-input"></div>
        <div><div class="field-label">Due / Bid Date</div><input id="op-due" type="date" class="field-input"></div>
        <div><div class="field-label">Stage</div>
          <select id="op-stage" class="field-select">${Views.pipeline.STAGES.map(s=>`<option ${s==='Prospect'?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="mt-3"><div class="field-label">Notes</div><textarea id="op-notes" class="field-textarea" rows="3"></textarea></div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.pipeline.create()">Create</button>`;
    const m = U.modal({ title: 'New Opportunity', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  create() {
    DB.pipeline().push({
      id: U.uid('PL'),
      accountId: document.getElementById('op-acct').value,
      bondType: document.getElementById('op-type').value,
      amount: +document.getElementById('op-amt').value || 0,
      obligee: document.getElementById('op-ob').value,
      dueDate: document.getElementById('op-due').value,
      stage:   document.getElementById('op-stage').value,
      notes:   document.getElementById('op-notes').value,
      producer: 'CV',
      probability: 30,
    });
    DB.save();
    U.closeModals();
    U.toast('Opportunity created');
    this.render();
  },

  exportCSV() {
    const rows = [['Stage','Account','Bond Type','Amount','Obligee','Due','Probability','Notes']];
    DB.pipeline().forEach(p => {
      const a = DB.findAccount(p.accountId) || {};
      rows.push([p.stage, a.name||'', p.bondType, p.amount, p.obligee||'', p.dueDate||'', p.probability+'%', (p.notes||'').replace(/\n/g,' ')]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='pipeline.csv'; a.click();
    U.toast('Pipeline exported');
  }
};
