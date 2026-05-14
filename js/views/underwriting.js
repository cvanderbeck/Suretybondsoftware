window.Views = window.Views || {};
Views.underwriting = {
  STEPS: ['Intake','Document Collection','Surety Submission','Decision','Issuance'],

  render() {
    const list = DB.uw();
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Underwriting Workflows</h1>
          <p class="section-sub">Track bond files through intake, documentation, surety submission, and issuance.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-primary" onclick="Views.underwriting.startNew()">+ Start UW File</button>
        </div>
      </div>

      <div class="space-y-4">
        ${list.map(uw => Views.underwriting.workflowCard(uw)).join('') || '<div class="card p-12 text-center text-slate-400">No active underwriting files.</div>'}
      </div>
    `;
  },

  workflowCard(uw) {
    const b = DB.findBond(uw.bondId) || {};
    const a = DB.findAccount(b.accountId) || {};
    const p = DB.findPartner(uw.partnerId) || {};
    const stepIdx = uw.step;
    const stepsHTML = this.STEPS.map((s, i) => {
      const state = i < stepIdx ? 'done' : i === stepIdx ? 'current' : 'todo';
      const dot = state === 'done' ? 'bg-emerald-500' : state === 'current' ? 'bg-brand-500 ring-4 ring-brand-100' : 'bg-slate-300';
      const txt = state === 'todo' ? 'text-slate-400' : 'text-slate-700';
      return `
        <div class="flex-1 flex items-center">
          <div class="flex flex-col items-center">
            <div class="w-3 h-3 rounded-full ${dot}"></div>
            <div class="text-xs ${txt} mt-2 text-center px-1">${s}</div>
          </div>
          ${i < Views.underwriting.STEPS.length-1 ? `<div class="flex-1 h-0.5 ${i<stepIdx?'bg-emerald-400':'bg-slate-200'} mt-[-22px]"></div>`:''}
        </div>`;
    }).join('');

    const done = uw.requirements.filter(r => r.status === 'received').length;
    const total = uw.requirements.length;
    const pct = Math.round(done/total*100);

    return `
      <div class="card">
        <div class="p-5">
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="flex items-center gap-2">
                <div class="text-base font-semibold text-slate-900">${U.esc(a.name||'')}</div>
                <span class="badge badge-blue">${U.esc(b.type||'')} · ${b.number||''}</span>
              </div>
              <div class="text-sm text-slate-500 mt-1">${U.esc(b.obligee||'')} · ${U.usd(b.amount)} · Surety: ${U.esc(p.name||'')}</div>
              <div class="text-xs text-slate-500 mt-1">Assigned: ${U.esc(uw.assignedTo||'')}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-500">Requirements</div>
              <div class="text-lg font-semibold">${done}/${total}</div>
              <div class="progress mt-1 w-32"><div style="width:${pct}%"></div></div>
            </div>
          </div>

          <div class="flex items-center gap-1 mb-4 px-4">${stepsHTML}</div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase mb-2">Document Checklist</div>
              <div class="space-y-1">
                ${uw.requirements.map((r,i) => `
                  <label class="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" class="chk" ${r.status==='received'?'checked':''} onchange="Views.underwriting.toggle('${uw.id}', ${i})">
                    <span class="text-sm ${r.status==='received'?'line-through text-slate-400':''}">${U.esc(r.name)}</span>
                    ${U.statusBadge(r.status)}
                  </label>`).join('')}
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase mb-2">UW Notes</div>
              <textarea class="field-textarea" rows="5" oninput="Views.underwriting.saveNotes('${uw.id}', this.value)">${U.esc(uw.notes||'')}</textarea>
              <div class="flex items-center gap-2 mt-3">
                <button class="btn-secondary" onclick="Views.underwriting.advance('${uw.id}', -1)">← Back</button>
                <button class="btn-primary"   onclick="Views.underwriting.advance('${uw.id}', 1)">Next Step →</button>
                <button class="btn-ghost"     onclick="Views.underwriting.submitToSurety('${uw.id}')">Submit to Surety</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  toggle(id, idx) {
    const uw = DB.uw().find(u => u.id === id);
    const r = uw.requirements[idx];
    r.status = r.status === 'received' ? 'pending' : 'received';
    DB.save();
    this.render();
  },

  saveNotes(id, val) {
    const uw = DB.uw().find(u => u.id === id);
    uw.notes = val;
    DB.save();
  },

  advance(id, delta) {
    const uw = DB.uw().find(u => u.id === id);
    uw.step = Math.max(0, Math.min(this.STEPS.length-1, uw.step + delta));
    if (uw.step === this.STEPS.length-1) {
      const b = DB.findBond(uw.bondId); if (b) b.status = 'Active';
    }
    DB.save();
    U.toast(`Moved to: ${this.STEPS[uw.step]}`);
    this.render();
  },

  submitToSurety(id) {
    const uw = DB.uw().find(u => u.id === id);
    const p = DB.findPartner(uw.partnerId) || {};
    U.toast(`Submission package sent to ${p.name || 'surety'}`);
    if (uw.step < 2) { uw.step = 2; DB.save(); this.render(); }
  },

  startNew() {
    const bonds = DB.bonds().filter(b => b.status === 'Pending UW' && !DB.uw().some(u => u.bondId === b.id));
    if (!bonds.length) { U.toast('No pending-UW bonds without a workflow', 'info'); return; }
    const body = `
      <div><div class="field-label">Choose bond to underwrite</div>
        <select id="uw-bond" class="field-select">
          ${bonds.map(b => { const a=DB.findAccount(b.accountId)||{}; return `<option value="${b.id}">${b.number} — ${U.esc(a.name)} (${U.usd(b.amount)})</option>`; }).join('')}
        </select></div>
      <div class="mt-3"><div class="field-label">Assigned to</div><input id="uw-asg" class="field-input" value="Casey V."></div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.underwriting.createNew()">Start</button>`;
    const m = U.modal({ title: 'New Underwriting File', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  createNew() {
    const bondId = document.getElementById('uw-bond').value;
    const b = DB.findBond(bondId);
    DB.uw().push({
      id: U.uid('UW'),
      bondId, step: 0,
      partnerId: b.partnerId,
      assignedTo: document.getElementById('uw-asg').value,
      notes: '',
      requirements: [
        { name: 'Financial statements (CPA)', status: 'pending' },
        { name: 'Personal financial statements', status: 'pending' },
        { name: 'Work-in-progress schedule', status: 'pending' },
        { name: 'Indemnity agreement (GIA)', status: 'pending' },
      ],
    });
    DB.save();
    U.closeModals();
    U.toast('Underwriting file started');
    this.render();
  }
};
