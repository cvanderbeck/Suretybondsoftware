// ---------- Cross-cutting Tasks helper ----------
// Aggregates tasks from every entity (leads, accounts, bonds,
// opportunities, renewals) plus the standalone adminTasks[] list.
// Provides the shared "add task" modal used everywhere (email
// message detail, tasks view, etc.) and the assignee chip
// renderer.

window.Tasks = (() => {

  // Lookups for entity records by (kind, id)
  function _entity(kind, id) {
    if (kind === 'lead')        return DB.findLead(id);
    if (kind === 'account')     return DB.findAccount(id);
    if (kind === 'bond')        return DB.findBond(id);
    if (kind === 'opportunity') return DB.pipeline().find(p => p.id === id);
    if (kind === 'renewal')     return DB.renewals().find(r => r.id === id);
    return null;
  }

  // Human-readable label for a parent entity (used in lists and chips)
  function parentLabel(kind, ent) {
    if (kind === 'admin' || !ent) return 'General Admin';
    if (kind === 'lead')          return ent.companyName || '(Lead)';
    if (kind === 'account')       return ent.name || '(Account)';
    if (kind === 'bond')          {
      const a = DB.findAccount(ent.accountId);
      return `${ent.number || 'Bond'}${a ? ' · ' + a.name : ''}`;
    }
    if (kind === 'opportunity') {
      const a = DB.findAccount(ent.accountId);
      return `${a ? a.name : 'Opportunity'} — ${ent.obligee || ent.bondType || ''}`;
    }
    if (kind === 'renewal') {
      const b = DB.findBond(ent.bondId);
      return `${b ? b.number : 'Renewal'} renewal`;
    }
    return '';
  }

  function kindBadge(kind) {
    const m = {
      lead:        ['badge-green', 'Lead'],
      account:     ['badge-blue',  'Account'],
      bond:        ['badge-violet','Bond'],
      opportunity: ['badge-slate', 'Opportunity'],
      renewal:     ['badge-amber', 'Renewal'],
      admin:       ['badge-slate', 'Admin'],
    }[kind] || ['badge-slate', kind];
    return `<span class="badge ${m[0]}">${m[1]}</span>`;
  }

  // -------- Priority (Todoist-style P1 / P2 / P3 / P4) --------
  // 1 = highest (red), 4 = no priority (gray). Missing or 0 → 4.
  function normalizePriority(p) {
    const n = +p;
    if (!n || n < 1 || n > 4) return 4;
    return n;
  }

  const PRIORITY_META = {
    1: { label: 'P1 — Urgent',   text: 'text-rose-600',    fill: 'text-rose-600'    },
    2: { label: 'P2 — High',     text: 'text-amber-600',   fill: 'text-amber-600'   },
    3: { label: 'P3 — Medium',   text: 'text-blue-600',    fill: 'text-blue-600'    },
    4: { label: 'P4 — None',     text: 'text-ink-300',     fill: 'text-ink-200'     },
  };

  function priorityMeta(p) { return PRIORITY_META[normalizePriority(p)]; }

  // Inline priority flag — clickable to cycle (P1 → P2 → P3 → P4 → P1).
  // `onClick` is a JS expression string used in the inline onclick handler.
  function priorityFlag(p, onClickJs) {
    const lvl = normalizePriority(p);
    const meta = PRIORITY_META[lvl];
    const click = onClickJs ? ` onclick="event.stopPropagation(); ${onClickJs}"` : '';
    return `
      <button type="button" class="inline-flex items-center gap-1 ${meta.text} hover:opacity-80" title="${meta.label}"${click}>
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="${lvl===4?'none':'currentColor'}" stroke="currentColor" stroke-width="${lvl===4?'1.5':'1'}">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 21V4h14l-2 4 2 4H4"/>
        </svg>
        ${lvl<4 ? `<span class="text-[10px] font-semibold">P${lvl}</span>` : ''}
      </button>`;
  }

  function prioritySelect(id, currentLevel) {
    const cur = normalizePriority(currentLevel);
    return `
      <select id="${id}" class="field-select">
        ${[1,2,3,4].map(n => `<option value="${n}" ${n===cur?'selected':''}>${PRIORITY_META[n].label}</option>`).join('')}
      </select>`;
  }

  function cyclePriority(kind, parentId, taskId) {
    const t = findTask(kind, parentId, taskId);
    if (!t) return;
    const cur = normalizePriority(t.priority);
    t.priority = cur === 4 ? 1 : cur + 1;
    DB.save();
    if (window.Views) {
      if (Views.tasks?.__rendered) Views.tasks._renderList();
      Views.templates?._reopenEntity && kind !== 'admin' && Views.templates._reopenEntity(kind, parentId);
    }
  }

  // -------- Aggregate everything into a flat array --------
  function all() {
    const out = [];
    const push = (kind, ent, t) => out.push({
      kind, parentId: ent ? ent.id : null,
      parent: ent, parentLabel: parentLabel(kind, ent),
      task: t,
    });

    DB.leads().forEach(e => (e.tasks || []).forEach(t => push('lead', e, t)));
    DB.accounts().forEach(e => (e.tasks || []).forEach(t => push('account', e, t)));
    DB.bonds().forEach(e => (e.tasks || []).forEach(t => push('bond', e, t)));
    DB.pipeline().forEach(e => (e.tasks || []).forEach(t => push('opportunity', e, t)));
    DB.renewals().forEach(e => (e.tasks || []).forEach(t => push('renewal', e, t)));
    DB.adminTasks().forEach(t => push('admin', null, t));

    return out;
  }

  // -------- Mutators --------
  function addTask({ kind, parentId, text, dueDate, assignee, type, priority }) {
    const t = {
      id: U.uid('TK'),
      text:        text || '',
      dueDate:     dueDate || null,
      assignee:    assignee || '',
      priority:    normalizePriority(priority),
      completed:   false,
      type:        type || 'task',
      source:      '',
      createdDate: new Date().toISOString().slice(0,10),
    };
    if (kind === 'admin') {
      DB.adminTasks().push(t);
    } else {
      const ent = _entity(kind, parentId);
      if (!ent) return null;
      ent.tasks = ent.tasks || [];
      ent.tasks.push(t);
    }
    DB.save();
    return t;
  }

  function toggle(kind, parentId, taskId) {
    const t = findTask(kind, parentId, taskId);
    if (!t) return;
    t.completed = !t.completed;
    t.completedDate = t.completed ? new Date().toISOString().slice(0,10) : null;
    DB.save();
  }

  function update(kind, parentId, taskId, patch) {
    const t = findTask(kind, parentId, taskId);
    if (!t) return;
    Object.assign(t, patch);
    DB.save();
  }

  function remove(kind, parentId, taskId) {
    if (kind === 'admin') {
      DB.state.adminTasks = DB.adminTasks().filter(t => t.id !== taskId);
      DB.save();
      return;
    }
    const ent = _entity(kind, parentId);
    if (!ent || !ent.tasks) return;
    ent.tasks = ent.tasks.filter(t => t.id !== taskId);
    DB.save();
  }

  function findTask(kind, parentId, taskId) {
    if (kind === 'admin') return DB.adminTasks().find(t => t.id === taskId);
    const ent = _entity(kind, parentId);
    return (ent?.tasks || []).find(t => t.id === taskId);
  }

  // -------- Assignee chip --------
  function assigneeChip(userId) {
    if (!userId) return `<span class="text-xs text-ink-300">Unassigned</span>`;
    const u = DB.findUser(userId);
    if (!u) return `<span class="text-xs text-ink-300">Unknown</span>`;
    return `
      <span class="inline-flex items-center gap-1.5">
        <span class="w-5 h-5 rounded-full ${u.color || 'bg-slate-500'} text-white flex items-center justify-center text-[10px] font-semibold">${U.esc(u.initials)}</span>
        <span class="text-xs">${U.esc(u.name)}</span>
      </span>`;
  }

  function assigneeSelect(id, currentUserId) {
    return `
      <select id="${id}" class="field-select">
        <option value="">Unassigned</option>
        ${DB.users().map(u => `<option value="${u.id}" ${u.id===currentUserId?'selected':''}>${U.esc(u.name)} (${U.esc(u.initials)})</option>`).join('')}
      </select>`;
  }

  // -------- Quick add modal --------
  function openQuickAdd(opts = {}) {
    // opts: { kind, parentId, defaultText, defaultDue, defaultAssignee, allowKindPicker, reopen }
    const allowKindPicker = opts.allowKindPicker !== false && !opts.kind;
    const kind = opts.kind || 'admin';

    // Build parent selector if a kind picker is allowed
    const kindOptions = [
      ['admin',       '(General Admin)'],
      ['lead',        'Lead'],
      ['account',     'Account'],
      ['bond',        'Bond'],
      ['opportunity', 'Opportunity'],
      ['renewal',     'Renewal'],
    ];

    const body = `
      <div class="grid grid-cols-1 gap-3">
        <div><div class="field-label">Task</div>
          <input id="tk-text" class="field-input" value="${U.esc(opts.defaultText || '')}" placeholder="What needs to happen?">
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><div class="field-label">Due Date</div>
            <input id="tk-due" type="date" class="field-input" value="${U.esc(opts.defaultDue || '')}">
          </div>
          <div><div class="field-label">Priority</div>
            ${prioritySelect('tk-priority', opts.defaultPriority || 4)}
          </div>
          <div><div class="field-label">Assign To</div>
            ${assigneeSelect('tk-assignee', opts.defaultAssignee || '')}
          </div>
        </div>

        ${allowKindPicker ? `
          <div class="divider"></div>
          <div class="grid grid-cols-2 gap-3">
            <div><div class="field-label">Attach To</div>
              <select id="tk-kind" class="field-select" onchange="Tasks._refreshParentPicker()">
                ${kindOptions.map(([k, label]) => `<option value="${k}" ${k===kind?'selected':''}>${label}</option>`).join('')}
              </select>
            </div>
            <div id="tk-parent-wrap">${_parentPicker(kind)}</div>
          </div>
        ` : `
          <div class="text-xs text-ink-300 italic">
            ${kind === 'admin'
              ? 'This will be a free-standing admin task.'
              : `Attached to ${U.esc(parentLabel(kind, _entity(kind, opts.parentId)))}.`}
          </div>
        `}
      </div>
    `;
    const footer = `
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Tasks._commitAdd(${JSON.stringify(opts).replace(/"/g,'&quot;')})">Add Task</button>
    `;
    const m = U.modal({ title: 'New Task', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  }

  function _parentPicker(kind) {
    if (kind === 'admin') return '<div></div>';
    const label = `<div class="field-label">${kind.charAt(0).toUpperCase() + kind.slice(1)}</div>`;
    const opts = (kind === 'lead')        ? DB.leads().map(l => [l.id, l.companyName])
              : (kind === 'account')     ? DB.accounts().map(a => [a.id, a.name])
              : (kind === 'bond')        ? DB.bonds().map(b => { const a = DB.findAccount(b.accountId); return [b.id, `${b.number} — ${a ? a.name : ''}`]; })
              : (kind === 'opportunity') ? DB.pipeline().map(p => { const a = DB.findAccount(p.accountId); return [p.id, `${a ? a.name : ''} — ${p.obligee || p.bondType || ''}`]; })
              : (kind === 'renewal')     ? DB.renewals().map(r => { const b = DB.findBond(r.bondId); return [r.id, `${b ? b.number : ''} renewal`]; })
              : [];
    return `${label}
      <select id="tk-parent" class="field-select">
        <option value="">— Select —</option>
        ${opts.map(([id, label]) => `<option value="${id}">${U.esc(label)}</option>`).join('')}
      </select>`;
  }

  function _refreshParentPicker() {
    const kindSel = document.getElementById('tk-kind');
    const wrap = document.getElementById('tk-parent-wrap');
    if (!kindSel || !wrap) return;
    wrap.innerHTML = _parentPicker(kindSel.value);
  }

  function _commitAdd(opts) {
    const text = document.getElementById('tk-text').value.trim();
    if (!text) { U.toast('Task text is required', 'warn'); return; }
    const dueDate = document.getElementById('tk-due').value || null;
    const assignee = document.getElementById('tk-assignee').value || '';

    const kindSel = document.getElementById('tk-kind');
    const kind = kindSel ? kindSel.value : (opts.kind || 'admin');
    let parentId = opts.parentId;
    if (kindSel) {
      const ps = document.getElementById('tk-parent');
      parentId = ps ? ps.value : null;
      if (kind !== 'admin' && !parentId) { U.toast('Pick an entity to attach to', 'warn'); return; }
    }

    const priority = +document.getElementById('tk-priority')?.value || 4;
    addTask({ kind, parentId, text, dueDate, assignee, priority });
    U.closeModals();
    U.toast('Task added');
    if (opts.reopen) opts.reopen();
    else if (window.Views?.tasks && window.Views.tasks.__rendered) Views.tasks.render();
  }

  return {
    all, addTask, toggle, update, remove, findTask,
    parentLabel, kindBadge, assigneeChip, assigneeSelect,
    normalizePriority, priorityMeta, priorityFlag, prioritySelect, cyclePriority,
    PRIORITY_META,
    openQuickAdd, _refreshParentPicker, _commitAdd,
  };
})();
