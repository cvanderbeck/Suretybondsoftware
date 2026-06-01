window.Views = window.Views || {};

Views.templates = {
  _section: 'email',   // 'email' | 'automations' | 'todos'

  TRIGGERS: [
    { key: 'lead.created',         label: 'When a new lead is created',         badge: 'badge-green'  },
    { key: 'account.created',      label: 'When a new account is created',      badge: 'badge-blue'   },
    { key: 'opportunity.created',  label: 'When a new opportunity is created',  badge: 'badge-violet' },
    { key: 'bond.created',         label: 'When a bond is created / issued',    badge: 'badge-violet' },
    { key: 'renewal.window-open',  label: 'When a bond enters the renewal window', badge: 'badge-amber' },
  ],

  APPLIES_TO: [
    { key: 'account',     label: 'Account'    },
    { key: 'bond',        label: 'Bond'       },
    { key: 'lead',        label: 'Lead'       },
    { key: 'renewal',     label: 'Renewal'    },
    { key: 'opportunity', label: 'Opportunity (Pipeline)' },
    { key: 'standalone',  label: 'Standalone / General' },
  ],

  // Which automation trigger maps to which entity kind.
  TRIGGER_FOR: {
    lead:        'lead.created',
    account:     'account.created',
    opportunity: 'opportunity.created',
    bond:        'bond.created',
    renewal:     'renewal.window-open',
  },

  STEP_TYPES: [
    { key: 'email', label: 'Send Email (from template)' },
    { key: 'task',  label: 'Create Task' },
    { key: 'note',  label: 'Log Note' },
    { key: 'stage-change', label: 'Change Stage' },
  ],

  triggerMeta(key) { return this.TRIGGERS.find(t => t.key === key) || null; },
  appliesMeta(key) { return this.APPLIES_TO.find(t => t.key === key) || null; },

  // ---------- Render shell ----------
  render() {
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Templates</h1>
          <p class="section-sub">Reusable email templates, automation sequences, and to-do checklists.</p>
        </div>
      </div>

      <div class="border-b border-cream-200 mb-5 flex gap-1">
        ${this._tabBtn('email',       'Email Templates (' + DB.templates().length + ')')}
        ${this._tabBtn('automations', 'Automations (' + DB.automations().length + ')')}
        ${this._tabBtn('todos',       'To-Do Lists (' + DB.todoTemplates().length + ')')}
      </div>

      <div id="tpl-body">${this._renderSection()}</div>
    `;
  },

  _tabBtn(key, label) {
    const active = this._section === key;
    return `<button onclick="Views.templates._setSection('${key}')" class="px-3 py-2 text-sm border-b-2 -mb-px transition
        ${active ? 'border-brand-500 text-brand-700 font-semibold' : 'border-transparent text-ink-400 hover:text-ink-700'}">${label}</button>`;
  },
  _setSection(s) { this._section = s; document.getElementById('tpl-body').innerHTML = this._renderSection(); },

  _renderSection() {
    if (this._section === 'automations') return this._renderAutomations();
    if (this._section === 'todos')       return this._renderTodos();
    return this._renderEmails();
  },

  // =========================================================
  // EMAIL TEMPLATES
  // =========================================================
  _renderEmails() {
    const list = DB.templates();
    const byCat = {};
    list.forEach(t => { (byCat[t.category||'General'] = byCat[t.category||'General']||[]).push(t); });

    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-300">Reusable email templates. Variables like <code>{{contact_first}}</code> are substituted automatically when sending.</div>
        <button class="btn-primary" onclick="Views.templates.editEmail()">+ New Email Template</button>
      </div>

      ${Object.entries(byCat).map(([cat, items]) => `
        <div class="mb-5">
          <div class="text-xs font-semibold text-ink-300 uppercase tracking-wider mb-2">${U.esc(cat)}</div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            ${items.map(t => `
              <div class="card">
                <div class="p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="font-semibold text-ink-700">${U.esc(t.name)}</div>
                      <div class="text-xs text-ink-300 mt-1">Subject: <span class="font-mono">${U.esc(t.subject)}</span></div>
                    </div>
                    <span class="badge badge-slate">${U.esc(t.category || 'General')}</span>
                  </div>
                  <div class="text-xs text-ink-400 mt-2 line-clamp-3 whitespace-pre-line">${U.esc((t.body||'').slice(0, 240))}${(t.body||'').length>240?'…':''}</div>
                  <div class="flex justify-end mt-3 gap-1">
                    <button class="btn-ghost" onclick="Compose.open({ templateId: '${t.id}' })">Use</button>
                    <button class="btn-ghost" onclick="Views.templates.editEmail('${t.id}')">Edit</button>
                    <button class="btn-ghost text-rose-600" onclick="Views.templates.deleteEmail('${t.id}')">Delete</button>
                  </div>
                </div>
              </div>`).join('')}
          </div>
        </div>`).join('') ||
        '<div class="card p-8 text-center text-ink-300 text-sm">No templates yet. Click + New Email Template to add one.</div>'}
    `;
  },

  editEmail(id) {
    const t = id ? DB.templates().find(x => x.id === id) : { id: U.uid('T'), category: 'General', subject: '', body: '' };
    const body = `
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2"><div class="field-label">Template Name</div>
          <input id="tpl-name" class="field-input" value="${U.esc(t.name||'')}" placeholder="e.g. Renewal — Confirm Release"></div>
        <div><div class="field-label">Category</div>
          <select id="tpl-cat" class="field-select">
            ${['Lead','Renewal','Pipeline','Bond','Underwriting','Billing','General','Other'].map(c => `<option ${c===(t.category||'General')?'selected':''}>${c}</option>`).join('')}
          </select></div>
        <div></div>
        <div class="col-span-2"><div class="field-label">Subject</div>
          <input id="tpl-subject" class="field-input font-mono text-sm" value="${U.esc(t.subject||'')}" placeholder="{{bond_type}} bond — renewal in {{days_until_expires}} days"></div>
        <div class="col-span-2"><div class="field-label">Body</div>
          <textarea id="tpl-body" class="field-textarea font-sans" rows="14" placeholder="Hi {{contact_first}},&#10;&#10;…">${U.esc(t.body||'')}</textarea></div>
      </div>
      <div class="mt-3 text-xs text-ink-300">
        <div class="font-medium text-ink-500 mb-1">Available variables:</div>
        <div class="flex flex-wrap gap-1">
          ${['account_name','contact_name','contact_first','contact_email','lead_company','lead_contact','bond_number','bond_type','bond_amount','obligee','project','effective','expires','days_until_expires','producer_name','agency_name','agency_phone','agency_email','today'].map(k => `<span class="kbd">{{${k}}}</span>`).join(' ')}
        </div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.templates.saveEmail('${t.id}')">Save</button>`;
    const m = U.modal({ title: id ? 'Edit Email Template' : 'New Email Template', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  saveEmail(id) {
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

  deleteEmail(id) {
    if (!confirm('Delete this email template?')) return;
    DB.state.emailTemplates = DB.templates().filter(t => t.id !== id);
    DB.save(); U.toast('Template deleted', 'info'); this.render();
  },

  // =========================================================
  // AUTOMATION TEMPLATES
  // =========================================================
  _renderAutomations() {
    const list = DB.automations();
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-300">Multi-step sequences that fire on a trigger — e.g. "When a new lead is created, send intro email, schedule call, follow up in 3 days."</div>
        <button class="btn-primary" onclick="Views.templates.editAutomation()">+ New Automation</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${list.length ? list.map(a => this._automationCard(a)).join('')
          : '<div class="card p-8 text-center text-ink-300 text-sm col-span-2">No automation templates yet.</div>'}
      </div>
    `;
  },

  _automationCard(a) {
    const trig = this.triggerMeta(a.trigger);
    return `
      <div class="card">
        <div class="p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-semibold text-ink-700">${U.esc(a.name)}</div>
              <div class="text-xs text-ink-300 mt-0.5">${U.esc(a.description || '')}</div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs flex items-center gap-1 cursor-pointer">
                <input type="checkbox" class="chk" ${a.enabled?'checked':''} onchange="Views.templates._toggleAutomation('${a.id}', this.checked)">
                ${a.enabled ? '<span class="text-emerald-700 font-medium">Enabled</span>' : '<span class="text-ink-300">Disabled</span>'}
              </label>
            </div>
          </div>

          <div class="my-2">
            <span class="badge ${trig?trig.badge:'badge-slate'}">${U.esc(trig ? trig.label : a.trigger)}</span>
          </div>

          <div class="mt-3 text-xs text-ink-400">
            <div class="font-medium text-ink-500 uppercase tracking-wider mb-1">${a.steps.length} step${a.steps.length===1?'':'s'}</div>
            <ol class="space-y-1 max-h-44 overflow-y-auto">
              ${a.steps.map((s, i) => this._stepLine(s, i)).join('')}
            </ol>
          </div>

          <div class="flex justify-end mt-3 gap-1">
            <button class="btn-ghost" onclick="Views.templates._simulateRun('${a.id}')">Simulate</button>
            <button class="btn-ghost" onclick="Views.templates.editAutomation('${a.id}')">Edit</button>
            <button class="btn-ghost text-rose-600" onclick="Views.templates.deleteAutomation('${a.id}')">Delete</button>
          </div>
        </div>
      </div>`;
  },

  _stepLine(s, i) {
    const ICONS = { email: '✉', task: '✓', note: '📝', 'stage-change': '↪' };
    let label = s.text || s.description || '';
    if (s.type === 'email') {
      const t = DB.templates().find(x => x.id === s.templateId);
      label = (s.description || '') + (t ? ` — “${t.name}”` : '');
    }
    return `<li class="flex items-start gap-2 py-0.5">
      <span class="text-ink-300 w-10 shrink-0">Day ${s.offsetDays || 0}</span>
      <span class="text-ink-300 w-4">${ICONS[s.type] || '•'}</span>
      <span class="flex-1">${U.esc(label || '(no detail)')}</span>
    </li>`;
  },

  _toggleAutomation(id, v) {
    const a = DB.automations().find(x => x.id === id);
    if (!a) return;
    a.enabled = v;
    DB.save();
    U.toast(v ? 'Automation enabled' : 'Automation disabled', 'info');
  },

  _simulateRun(id) {
    const a = DB.automations().find(x => x.id === id);
    if (!a) return;
    const trig = this.triggerMeta(a.trigger);
    const lines = a.steps.map((s, i) => {
      let when = `Day ${s.offsetDays || 0}`;
      let what = '';
      if (s.type === 'email') {
        const t = DB.templates().find(x => x.id === s.templateId);
        what = `Send email — ${t ? `“${t.name}”` : '(template missing)'}`;
      } else if (s.type === 'task') {
        what = `Create task: ${s.text || '(no text)'}`;
      } else if (s.type === 'note') {
        what = `Log note: ${s.text || ''}`;
      } else if (s.type === 'stage-change') {
        what = `Change stage to: ${s.text || ''}`;
      }
      return `<li class="py-1 flex items-start gap-2">
        <span class="text-ink-300 w-10 shrink-0">${when}</span>
        <span class="text-ink-500">${U.esc(what)}</span>
      </li>`;
    }).join('');
    const body = `
      <p class="text-sm text-ink-400 mb-2"><b>${U.esc(a.name)}</b> would fire on <b>${U.esc(trig ? trig.label : a.trigger)}</b>:</p>
      <ol class="text-sm">${lines}</ol>
      <p class="text-xs text-ink-300 mt-3 italic">Demo: actions are logged but not actually queued to the calendar/inbox.</p>
    `;
    const footer = `<button class="btn-primary" data-close>Close</button>`;
    const m = U.modal({ title: 'Automation Simulation', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  deleteAutomation(id) {
    if (!confirm('Delete this automation template?')) return;
    DB.state.automationTemplates = DB.automations().filter(a => a.id !== id);
    DB.save(); U.toast('Automation deleted', 'info'); this.render();
  },

  // ---------- Automation edit modal ----------
  editAutomation(id) {
    const a = id ? DB.automations().find(x => x.id === id) : {
      id: U.uid('A'), name: '', description: '', trigger: 'lead.created', enabled: true, steps: [],
    };
    this._editAutomationDraft = JSON.parse(JSON.stringify(a)); // deep copy for live editing
    this._renderAutomationEditor();
  },

  _renderAutomationEditor() {
    const a = this._editAutomationDraft;
    const templates = DB.templates();
    const stepRows = a.steps.map((s, i) => `
      <div class="grid grid-cols-12 gap-2 items-end p-2 border border-cream-200 rounded mb-2" data-step="${i}">
        <div class="col-span-1">
          <div class="field-label">Day</div>
          <input type="number" class="field-input" value="${s.offsetDays||0}" oninput="Views.templates._updateStep(${i}, 'offsetDays', +this.value || 0)">
        </div>
        <div class="col-span-2">
          <div class="field-label">Type</div>
          <select class="field-select" onchange="Views.templates._updateStep(${i}, 'type', this.value); Views.templates._renderAutomationEditor();">
            ${this.STEP_TYPES.map(t => `<option value="${t.key}" ${t.key===s.type?'selected':''}>${U.esc(t.label)}</option>`).join('')}
          </select>
        </div>
        ${s.type === 'email' ? `
          <div class="col-span-8">
            <div class="field-label">Email Template</div>
            <select class="field-select" onchange="Views.templates._updateStep(${i}, 'templateId', this.value)">
              <option value="">— Select —</option>
              ${templates.map(t => `<option value="${t.id}" ${t.id===s.templateId?'selected':''}>${U.esc(t.name)}</option>`).join('')}
            </select>
          </div>
        ` : `
          <div class="col-span-8">
            <div class="field-label">${s.type === 'task' ? 'Task Text' : s.type === 'note' ? 'Note Text' : 'New Stage'}</div>
            <input class="field-input" value="${U.esc(s.text||'')}" oninput="Views.templates._updateStep(${i}, 'text', this.value)">
          </div>
        `}
        <div class="col-span-1 flex gap-1 justify-end">
          <button class="btn-ghost" onclick="Views.templates._moveStep(${i}, -1)" title="Move up">↑</button>
          <button class="btn-ghost" onclick="Views.templates._moveStep(${i}, 1)" title="Move down">↓</button>
          <button class="btn-ghost text-rose-600" onclick="Views.templates._deleteStep(${i})">✕</button>
        </div>
      </div>
    `).join('') || '<div class="text-sm text-ink-300 p-3">No steps yet. Add one below.</div>';

    const body = `
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="col-span-2"><div class="field-label">Name</div>
          <input id="am-name" class="field-input" value="${U.esc(a.name||'')}" placeholder="e.g. New Lead Welcome Sequence"></div>
        <div class="col-span-2"><div class="field-label">Description</div>
          <textarea id="am-desc" class="field-textarea" rows="2">${U.esc(a.description||'')}</textarea></div>
        <div><div class="field-label">Trigger</div>
          <select id="am-trigger" class="field-select">
            ${this.TRIGGERS.map(t => `<option value="${t.key}" ${t.key===a.trigger?'selected':''}>${U.esc(t.label)}</option>`).join('')}
          </select></div>
        <div class="flex items-end"><label class="text-sm flex items-center gap-2">
          <input id="am-enabled" type="checkbox" class="chk" ${a.enabled?'checked':''}>
          Enabled (fires automatically when trigger occurs)
        </label></div>
      </div>

      <div class="divider"></div>
      <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Steps</div>
      <div id="am-steps">${stepRows}</div>
      <div class="mt-2">
        <button class="btn-secondary" onclick="Views.templates._addStep()">+ Add Step</button>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.templates._saveAutomation()">Save Automation</button>`;
    const m = U.modal({ title: a.name ? 'Edit Automation' : 'New Automation', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _updateStep(idx, key, val) {
    const a = this._editAutomationDraft;
    a.steps[idx] = a.steps[idx] || {};
    a.steps[idx][key] = val;
    // When type changes, clear opposite fields so we don't leak data
    if (key === 'type') {
      if (val === 'email') { delete a.steps[idx].text; }
      else                 { delete a.steps[idx].templateId; }
    }
  },

  _addStep() {
    this._editAutomationDraft.steps.push({ offsetDays: 0, type: 'task', text: '' });
    this._renderAutomationEditor();
  },

  _moveStep(idx, delta) {
    const s = this._editAutomationDraft.steps;
    const j = idx + delta;
    if (j < 0 || j >= s.length) return;
    [s[idx], s[j]] = [s[j], s[idx]];
    this._renderAutomationEditor();
  },

  _deleteStep(idx) {
    this._editAutomationDraft.steps.splice(idx, 1);
    this._renderAutomationEditor();
  },

  _saveAutomation() {
    const draft = this._editAutomationDraft;
    draft.name        = document.getElementById('am-name').value.trim() || 'Untitled Automation';
    draft.description = document.getElementById('am-desc').value;
    draft.trigger     = document.getElementById('am-trigger').value;
    draft.enabled     = document.getElementById('am-enabled').checked;

    // Persist into DB (replace or append)
    const list = DB.automations();
    const idx = list.findIndex(a => a.id === draft.id);
    if (idx >= 0) list[idx] = draft;
    else          list.push(draft);
    DB.save();

    this._editAutomationDraft = null;
    U.closeModals();
    U.toast('Automation saved');
    this.render();
  },

  // =========================================================
  // TO-DO LIST TEMPLATES
  // =========================================================
  _renderTodos() {
    const list = DB.todoTemplates();
    return `
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm text-ink-300">Reusable checklists you can apply to a lead, account, bond, or renewal. Stays consistent across producers.</div>
        <button class="btn-primary" onclick="Views.templates.editTodo()">+ New Checklist</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${list.length ? list.map(t => this._todoCard(t)).join('')
          : '<div class="card p-8 text-center text-ink-300 text-sm col-span-2">No checklist templates yet.</div>'}
      </div>
    `;
  },

  _todoCard(t) {
    const meta = this.appliesMeta(t.appliesTo);
    const itemsPreview = (t.items || []).slice(0, 5);
    const moreCount = (t.items || []).length - itemsPreview.length;
    return `
      <div class="card">
        <div class="p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="font-semibold text-ink-700">${U.esc(t.name)}</div>
              <div class="text-xs text-ink-300 mt-0.5">${U.esc(t.description || '')}</div>
            </div>
            <span class="badge badge-slate">Applies to: ${U.esc(meta ? meta.label : t.appliesTo)}</span>
          </div>
          <div class="text-xs text-ink-400 mt-3">
            <div class="font-medium text-ink-500 uppercase tracking-wider mb-1">${(t.items||[]).length} item${(t.items||[]).length===1?'':'s'}</div>
            <ul class="space-y-1">
              ${itemsPreview.map(it => `
                <li class="flex items-start gap-2">
                  <span class="text-ink-300 mt-0.5">☐</span>
                  <span class="flex-1">${U.esc(it.text)}</span>
                  ${it.offsetDays != null ? `<span class="text-ink-300">+${it.offsetDays}d</span>` : ''}
                </li>`).join('')}
              ${moreCount > 0 ? `<li class="text-ink-300 italic">+ ${moreCount} more…</li>` : ''}
            </ul>
          </div>
          <div class="flex justify-end mt-3 gap-1">
            <button class="btn-ghost" onclick="Views.templates._previewTodo('${t.id}')">Preview</button>
            <button class="btn-ghost" onclick="Views.templates.editTodo('${t.id}')">Edit</button>
            <button class="btn-ghost text-rose-600" onclick="Views.templates.deleteTodo('${t.id}')">Delete</button>
          </div>
        </div>
      </div>`;
  },

  _previewTodo(id) {
    const t = DB.todoTemplates().find(x => x.id === id);
    if (!t) return;
    const meta = this.appliesMeta(t.appliesTo);
    const body = `
      <div class="mb-3 text-sm text-ink-400">${U.esc(t.description||'')}</div>
      <div class="text-xs text-ink-300 mb-3">Applies to: <b>${U.esc(meta ? meta.label : t.appliesTo)}</b> · ${(t.items||[]).length} item${(t.items||[]).length===1?'':'s'}</div>
      <ul class="space-y-1 text-sm">
        ${(t.items || []).map((it, i) => `
          <li class="flex items-start gap-2 p-1.5 rounded hover:bg-cream-50">
            <input type="checkbox" class="chk mt-0.5">
            <span class="flex-1">${U.esc(it.text)}</span>
            ${it.offsetDays != null ? `<span class="text-xs text-ink-300 self-center">+${it.offsetDays}d</span>` : ''}
          </li>`).join('')}
      </ul>
    `;
    const footer = `<button class="btn-primary" data-close>Close</button>`;
    const m = U.modal({ title: `Preview — ${t.name}`, body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  deleteTodo(id) {
    if (!confirm('Delete this checklist?')) return;
    DB.state.todoTemplates = DB.todoTemplates().filter(t => t.id !== id);
    DB.save(); U.toast('Checklist deleted', 'info'); this.render();
  },

  // ---------- To-do edit modal ----------
  editTodo(id) {
    const t = id ? DB.todoTemplates().find(x => x.id === id) : {
      id: U.uid('TD'), name: '', description: '', appliesTo: 'account', items: [],
    };
    this._editTodoDraft = JSON.parse(JSON.stringify(t));
    this._renderTodoEditor();
  },

  _renderTodoEditor() {
    const t = this._editTodoDraft;
    const itemRows = (t.items || []).map((it, i) => `
      <div class="grid grid-cols-12 gap-2 items-end p-2 border border-cream-200 rounded mb-2">
        <div class="col-span-10">
          <div class="field-label">Item ${i+1}</div>
          <input class="field-input" value="${U.esc(it.text||'')}" oninput="Views.templates._updateTodoItem(${i}, 'text', this.value)">
        </div>
        <div class="col-span-1">
          <div class="field-label">Offset (d)</div>
          <input type="number" class="field-input" value="${it.offsetDays != null ? it.offsetDays : ''}" placeholder="—" oninput="Views.templates._updateTodoItem(${i}, 'offsetDays', this.value === '' ? null : +this.value)">
        </div>
        <div class="col-span-1 flex gap-1 justify-end">
          <button class="btn-ghost" onclick="Views.templates._moveTodoItem(${i}, -1)" title="Move up">↑</button>
          <button class="btn-ghost" onclick="Views.templates._moveTodoItem(${i}, 1)" title="Move down">↓</button>
          <button class="btn-ghost text-rose-600" onclick="Views.templates._deleteTodoItem(${i})">✕</button>
        </div>
      </div>
    `).join('') || '<div class="text-sm text-ink-300 p-3">No items yet. Add one below.</div>';

    const body = `
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="col-span-2"><div class="field-label">Checklist Name</div>
          <input id="td-name" class="field-input" value="${U.esc(t.name||'')}" placeholder="e.g. New Account Onboarding"></div>
        <div class="col-span-2"><div class="field-label">Description</div>
          <textarea id="td-desc" class="field-textarea" rows="2">${U.esc(t.description||'')}</textarea></div>
        <div><div class="field-label">Applies To</div>
          <select id="td-applies" class="field-select">
            ${this.APPLIES_TO.map(a => `<option value="${a.key}" ${a.key===t.appliesTo?'selected':''}>${U.esc(a.label)}</option>`).join('')}
          </select></div>
      </div>

      <div class="divider"></div>
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Items</div>
        <span class="text-xs text-ink-300">Offset is days from when the checklist is started (leave blank for no due date)</span>
      </div>
      <div id="td-items">${itemRows}</div>
      <div class="mt-2 flex gap-2">
        <input id="td-quick" class="field-input flex-1" placeholder="Quick-add an item and press Enter…"
          onkeydown="if (event.key==='Enter') { event.preventDefault(); Views.templates._quickAddItem(this.value); this.value=''; }">
        <button class="btn-secondary" onclick="Views.templates._addTodoItem()">+ Add Item</button>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.templates._saveTodo()">Save Checklist</button>`;
    const m = U.modal({ title: t.name ? 'Edit Checklist' : 'New Checklist', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _updateTodoItem(idx, key, val) {
    const t = this._editTodoDraft;
    t.items[idx] = t.items[idx] || {};
    t.items[idx][key] = val;
  },

  _addTodoItem() {
    this._editTodoDraft.items.push({ text: '' });
    this._renderTodoEditor();
  },

  _quickAddItem(text) {
    if (!text || !text.trim()) return;
    this._editTodoDraft.items.push({ text: text.trim() });
    this._renderTodoEditor();
  },

  _moveTodoItem(idx, delta) {
    const items = this._editTodoDraft.items;
    const j = idx + delta;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    this._renderTodoEditor();
  },

  _deleteTodoItem(idx) {
    this._editTodoDraft.items.splice(idx, 1);
    this._renderTodoEditor();
  },

  _saveTodo() {
    const draft = this._editTodoDraft;
    draft.name        = document.getElementById('td-name').value.trim() || 'Untitled Checklist';
    draft.description = document.getElementById('td-desc').value;
    draft.appliesTo   = document.getElementById('td-applies').value;

    const list = DB.todoTemplates();
    const idx = list.findIndex(t => t.id === draft.id);
    if (idx >= 0) list[idx] = draft;
    else          list.push(draft);
    DB.save();
    this._editTodoDraft = null;
    U.closeModals();
    U.toast('Checklist saved');
    this.render();
  },

  // =========================================================
  // APPLY TEMPLATES TO A RECORD (lead / opp / account / renewal / bond)
  // =========================================================
  _lookupEntity(kind, id) {
    if (kind === 'lead')        return DB.findLead(id);
    if (kind === 'account')     return DB.findAccount(id);
    if (kind === 'bond')        return DB.findBond(id);
    if (kind === 'opportunity') return DB.pipeline().find(p => p.id === id);
    if (kind === 'renewal')     return DB.renewals().find(r => r.id === id);
    return null;
  },

  openApplyPicker(ctx) {
    const { kind } = ctx;
    const entity = this._lookupEntity(kind, ctx.id);
    if (!entity) return;
    this._applyCtx = ctx;

    const trigger = this.TRIGGER_FOR[kind];
    const automations = DB.automations().filter(a => a.trigger === trigger);
    const checklists  = DB.todoTemplates().filter(t => t.appliesTo === kind || t.appliesTo === 'standalone');
    const trigMeta = this.triggerMeta(trigger);

    const body = `
      <p class="text-sm text-ink-400 mb-3">Pick an automation sequence or to-do checklist to apply to <b>${U.esc(this._entityLabel(kind, entity))}</b>. Steps become tasks scheduled by their offset days.</p>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Automations</div>
            <span class="badge ${trigMeta?trigMeta.badge:'badge-slate'} text-[10px]">${U.esc(trigMeta ? trigMeta.label : trigger)}</span>
          </div>
          <div class="space-y-2 max-h-[420px] overflow-y-auto">
            ${automations.length ? automations.map(a => `
              <div class="border ${a.enabled?'border-cream-300':'border-cream-200 opacity-70'} rounded-lg p-3 hover:bg-cream-50 cursor-pointer"
                   onclick="Views.templates._applyAutomation('${a.id}')">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-ink-700 text-sm">${U.esc(a.name)}</div>
                  ${a.enabled?'<span class="badge badge-green text-[10px]">Enabled</span>':'<span class="badge badge-slate text-[10px]">Disabled</span>'}
                </div>
                <div class="text-xs text-ink-300 mt-1">${U.esc(a.description || '')}</div>
                <div class="text-xs text-ink-400 mt-2">${a.steps.length} step${a.steps.length===1?'':'s'}</div>
              </div>
            `).join('') : `<div class="text-sm text-ink-300 p-3 italic">No automations with this trigger. <button class="text-brand-600 underline" onclick="Views.templates._jumpTo('automations')">Create one →</button></div>`}
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider">Checklists</div>
            <span class="badge badge-slate text-[10px]">For ${U.esc(this.appliesMeta(kind)?.label || kind)}</span>
          </div>
          <div class="space-y-2 max-h-[420px] overflow-y-auto">
            ${checklists.length ? checklists.map(t => `
              <div class="border border-cream-300 rounded-lg p-3 hover:bg-cream-50 cursor-pointer"
                   onclick="Views.templates._applyChecklist('${t.id}')">
                <div class="flex items-center justify-between">
                  <div class="font-semibold text-ink-700 text-sm">${U.esc(t.name)}</div>
                  <span class="badge badge-slate text-[10px]">${(t.items||[]).length} items</span>
                </div>
                <div class="text-xs text-ink-300 mt-1">${U.esc(t.description || '')}</div>
              </div>
            `).join('') : `<div class="text-sm text-ink-300 p-3 italic">No checklists for this entity. <button class="text-brand-600 underline" onclick="Views.templates._jumpTo('todos')">Create one →</button></div>`}
          </div>
        </div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button>`;
    const m = U.modal({ title: 'Apply Template', body, footer, size: 'lg' });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _entityLabel(kind, e) {
    if (!e) return kind;
    if (kind === 'lead')        return e.companyName;
    if (kind === 'account')     return e.name;
    if (kind === 'bond')        return e.number;
    if (kind === 'opportunity') return (DB.findAccount(e.accountId)?.name || '') + ' — ' + (e.obligee || e.bondType);
    if (kind === 'renewal')     return (DB.findBond(e.bondId)?.number || '') + ' renewal';
    return '';
  },

  _addDays(n) {
    const d = new Date(); d.setDate(d.getDate() + (n || 0));
    return d.toISOString().slice(0,10);
  },

  _applyAutomation(autoId) {
    const ctx = this._applyCtx;
    if (!ctx) return;
    const entity = this._lookupEntity(ctx.kind, ctx.id);
    const a = DB.automations().find(x => x.id === autoId);
    if (!entity || !a) return;

    if (entity.activity) {
      entity.activity.push({
        id: U.uid('AC'),
        date: new Date().toISOString(),
        author: 'Casey V.',
        type: 'automation',
        subject: `Applied automation: ${a.name}`,
        text: `${a.steps.length} step(s) scheduled below.`,
      });
    }

    entity.tasks = entity.tasks || [];
    a.steps.forEach(s => {
      let text;
      if (s.type === 'email') {
        const tpl = DB.templates().find(t => t.id === s.templateId);
        text = `Send email — ${tpl ? tpl.name : '(template missing)'}`;
      } else if (s.type === 'note') {
        text = `Log note: ${s.text || ''}`;
      } else if (s.type === 'stage-change') {
        text = `Change stage to: ${s.text || ''}`;
      } else {
        text = s.text || '(task)';
      }
      entity.tasks.push({
        id: U.uid('TK'),
        text,
        dueDate: this._addDays(s.offsetDays || 0),
        completed: false,
        type: s.type,
        source: `automation:${a.id}`,
      });
    });

    DB.save();
    U.closeModals();
    U.toast(`Applied automation: ${a.name}`);
    this._applyCtx = null;
    if (ctx.reopen) ctx.reopen();
  },

  _applyChecklist(todoId) {
    const ctx = this._applyCtx;
    if (!ctx) return;
    const entity = this._lookupEntity(ctx.kind, ctx.id);
    const t = DB.todoTemplates().find(x => x.id === todoId);
    if (!entity || !t) return;

    entity.tasks = entity.tasks || [];
    (t.items || []).forEach(it => {
      entity.tasks.push({
        id: U.uid('TK'),
        text: it.text,
        dueDate: it.offsetDays != null ? this._addDays(it.offsetDays) : null,
        completed: false,
        type: 'task',
        source: `checklist:${t.id}`,
      });
    });

    if (entity.activity) {
      entity.activity.push({
        id: U.uid('AC'),
        date: new Date().toISOString(),
        author: 'Casey V.',
        type: 'note',
        text: `Applied checklist: ${t.name} (${(t.items||[]).length} items added to tasks).`,
      });
    }

    DB.save();
    U.closeModals();
    U.toast(`Applied checklist: ${t.name}`);
    this._applyCtx = null;
    if (ctx.reopen) ctx.reopen();
  },

  // Renders a Tasks card any detail modal can embed.
  renderTasksCard(kind, id, entity) {
    const tasks = entity.tasks || [];
    const headerExtra = `
      <div class="flex items-center gap-2">
        <button class="btn-secondary" onclick="Tasks.openQuickAdd({ kind: '${kind}', parentId: '${id}', allowKindPicker: false, reopen: () => Views.templates._reopenEntity('${kind}', '${id}') })">+ Add Task</button>
        <button class="btn-secondary" onclick="Views.templates.openApplyPicker({ kind:'${kind}', id:'${id}', reopen: () => Views.templates._reopenEntity('${kind}', '${id}') })">▶ Apply Template</button>
      </div>`;

    if (!tasks.length) {
      return `
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title">Tasks</div>
            ${headerExtra}
          </div>
          <div class="p-4 text-sm text-ink-300">No tasks yet. Click <b>+ Add Task</b> or apply an automation / checklist to populate this list.</div>
        </div>`;
    }

    const today = new Date(); today.setHours(0,0,0,0);
    const sorted = tasks.slice().sort((x,y) => {
      if (x.completed !== y.completed) return x.completed ? 1 : -1;
      if (!x.dueDate && !y.dueDate) return 0;
      if (!x.dueDate) return 1;
      if (!y.dueDate) return -1;
      return new Date(x.dueDate) - new Date(y.dueDate);
    });

    const open = sorted.filter(t => !t.completed);
    const done = sorted.filter(t =>  t.completed);
    const overdue = open.filter(t => t.dueDate && new Date(t.dueDate) < today).length;

    const ICON = { email: '✉', task: '✓', note: '📝', 'stage-change': '↪' };

    const row = (t) => {
      const due = t.dueDate ? new Date(t.dueDate) : null;
      const overdueRow = !t.completed && due && due < today;
      const dueLabel = due
        ? `<span class="text-xs ${overdueRow ? 'text-rose-700 font-medium' : 'text-ink-300'}">${overdueRow ? 'Overdue · ' : 'Due '}${U.date(t.dueDate)}</span>`
        : '<span class="text-xs text-ink-300">No due date</span>';
      const sourceLabel = t.source ? this._sourceLabel(t.source) : '';
      const assigneeChip = window.Tasks ? Tasks.assigneeChip(t.assignee) : '';
      return `
        <li class="flex items-start gap-2 p-2 rounded hover:bg-cream-50">
          <input type="checkbox" class="chk mt-0.5" ${t.completed?'checked':''}
                 onchange="Views.templates._toggleTask('${kind}','${id}','${t.id}')">
          <div class="flex-1 min-w-0">
            <div class="text-sm ${t.completed?'line-through text-ink-300':'text-ink-700'}">
              <span class="mr-1 text-ink-300">${ICON[t.type]||'•'}</span>${U.esc(t.text)}
            </div>
            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
              ${dueLabel}
              ${sourceLabel ? '<span class="text-xs text-ink-300">·</span>' + sourceLabel : ''}
              ${assigneeChip ? '<span class="text-xs text-ink-300">·</span>' + assigneeChip : ''}
            </div>
          </div>
          <button class="btn-ghost text-xs" title="Edit"   onclick="Views.tasks && Views.tasks._edit('${kind}','${id}','${t.id}')">✎</button>
          <button class="btn-ghost text-xs text-rose-600" title="Delete" onclick="Views.templates._deleteTask('${kind}','${id}','${t.id}')">✕</button>
        </li>`;
    };

    return `
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">Tasks <span class="text-xs text-ink-300 ml-2">${open.length} open · ${done.length} done${overdue?` · <span class="text-rose-700">${overdue} overdue</span>`:''}</span></div>
          ${headerExtra}
        </div>
        <div class="p-3">
          <ul>${open.length ? open.map(row).join('') : '<li class="text-sm text-ink-300 p-2">All tasks complete 🎉</li>'}</ul>
          ${done.length ? `
            <details class="mt-3">
              <summary class="text-xs text-ink-400 cursor-pointer hover:text-ink-700">Completed (${done.length})</summary>
              <ul class="mt-2">${done.map(row).join('')}</ul>
            </details>` : ''}
        </div>
      </div>`;
  },

  _sourceLabel(src) {
    if (src.startsWith('automation:')) {
      const id = src.slice('automation:'.length);
      const a = DB.automations().find(x => x.id === id);
      return `<span class="text-xs text-ink-300">from ${a ? U.esc(a.name) : 'automation'}</span>`;
    }
    if (src.startsWith('checklist:')) {
      const id = src.slice('checklist:'.length);
      const t = DB.todoTemplates().find(x => x.id === id);
      return `<span class="text-xs text-ink-300">from ${t ? U.esc(t.name) : 'checklist'}</span>`;
    }
    return '';
  },

  _toggleTask(kind, id, taskId) {
    const e = this._lookupEntity(kind, id);
    const t = (e?.tasks || []).find(x => x.id === taskId);
    if (!t) return;
    t.completed = !t.completed;
    t.completedDate = t.completed ? new Date().toISOString().slice(0,10) : null;
    DB.save();
    this._reopenEntity(kind, id);
  },

  _deleteTask(kind, id, taskId) {
    const e = this._lookupEntity(kind, id);
    if (!e || !e.tasks) return;
    e.tasks = e.tasks.filter(t => t.id !== taskId);
    DB.save();
    this._reopenEntity(kind, id);
  },

  _reopenEntity(kind, id) {
    U.closeModals();
    if (kind === 'lead')             Views.leads.open(id);
    else if (kind === 'opportunity') Views.pipeline.open(id);
    else if (kind === 'account')     Views.accounts.open(id);
    else if (kind === 'renewal')     Views.renewals.open(id);
    else if (kind === 'bond')        Views.bonds.open(id);
  },

  _jumpTo(section) {
    U.closeModals();
    App.go('templates');
    setTimeout(() => this._setSection(section), 50);
  },
};
