window.Views = window.Views || {};

Views.tasks = {
  __rendered: false,
  _filterStatus:   'open',      // open | overdue | week | completed | all
  _filterAssignee: '',
  _filterKind:     '',
  _search:         '',

  render() {
    this.__rendered = true;
    const all = Tasks.all();
    const today = new Date(); today.setHours(0,0,0,0);
    const inDays = (d, n) => { const x = new Date(today); x.setDate(x.getDate() + n); return d <= x; };

    const counts = {
      all:       all.length,
      open:      all.filter(t => !t.task.completed).length,
      overdue:   all.filter(t => !t.task.completed && t.task.dueDate && new Date(t.task.dueDate) < today).length,
      today:     all.filter(t => !t.task.completed && t.task.dueDate === today.toISOString().slice(0,10)).length,
      week:      all.filter(t => !t.task.completed && t.task.dueDate && inDays(new Date(t.task.dueDate), 7)).length,
      completed: all.filter(t =>  t.task.completed).length,
      unassigned: all.filter(t => !t.task.completed && !t.task.assignee).length,
    };

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Tasks</h1>
          <p class="section-sub">Every open and completed task across leads, accounts, bonds, opportunities, renewals, and admin work.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-primary" onclick="Tasks.openQuickAdd({ reopen: () => Views.tasks.render() })">+ New Task</button>
        </div>
      </div>

      <div class="grid grid-cols-6 gap-3 mb-5">
        ${this._stat('Open',       counts.open,      '')}
        ${this._stat('Overdue',    counts.overdue,   counts.overdue ? 'text-rose-700' : '')}
        ${this._stat('Due Today',  counts.today,     '')}
        ${this._stat('Due ≤ 7 days', counts.week,    '')}
        ${this._stat('Unassigned', counts.unassigned, counts.unassigned ? 'text-amber-700' : '')}
        ${this._stat('Completed',  counts.completed, '')}
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-4">
        ${this._chip('all',       'All',         counts.all)}
        ${this._chip('open',      'Open',        counts.open)}
        ${this._chip('overdue',   'Overdue',     counts.overdue)}
        ${this._chip('week',      'Due ≤ 7 days', counts.week)}
        ${this._chip('completed', 'Completed',   counts.completed)}
        <div class="flex-1"></div>
        <select class="field-select w-44" onchange="Views.tasks._filterAssignee = this.value; Views.tasks.render();">
          <option value="">All assignees</option>
          <option value="__none__" ${this._filterAssignee==='__none__'?'selected':''}>Unassigned</option>
          ${DB.users().map(u => `<option value="${u.id}" ${u.id===this._filterAssignee?'selected':''}>${U.esc(u.name)}</option>`).join('')}
        </select>
        <select class="field-select w-44" onchange="Views.tasks._filterKind = this.value; Views.tasks.render();">
          <option value="">All entities</option>
          <option value="admin"       ${this._filterKind==='admin'?'selected':''}>Admin only</option>
          <option value="lead"        ${this._filterKind==='lead'?'selected':''}>Leads</option>
          <option value="account"     ${this._filterKind==='account'?'selected':''}>Accounts</option>
          <option value="bond"        ${this._filterKind==='bond'?'selected':''}>Bonds</option>
          <option value="opportunity" ${this._filterKind==='opportunity'?'selected':''}>Opportunities</option>
          <option value="renewal"     ${this._filterKind==='renewal'?'selected':''}>Renewals</option>
        </select>
        <input class="field-input w-56" placeholder="Search…" value="${U.esc(this._search)}"
               oninput="Views.tasks._search = this.value; Views.tasks._renderList();">
      </div>

      <div id="tasks-list">${this._renderList(all, today, true)}</div>
    `;
  },

  _stat(label, n, tone) {
    return `<div class="stat-card !p-3"><div class="stat-label">${label}</div><div class="stat-value text-lg ${tone || ''}">${n}</div></div>`;
  },

  _chip(key, label, count) {
    const active = this._filterStatus === key;
    return `<button onclick="Views.tasks._filterStatus = '${key}'; Views.tasks.render();"
      class="px-3 py-1.5 rounded-full text-xs font-medium border transition
        ${active ? 'bg-ink-800 text-cream-50 border-ink-800' : 'bg-white text-ink-500 border-cream-300 hover:bg-cream-50'}">
      ${label} <span class="ml-1 opacity-70">${count}</span>
    </button>`;
  },

  _renderList(allParam, todayParam, returnHtml) {
    const today = todayParam || (() => { const t = new Date(); t.setHours(0,0,0,0); return t; })();
    let list = allParam || Tasks.all();
    if (this._filterStatus === 'open')      list = list.filter(t => !t.task.completed);
    else if (this._filterStatus === 'overdue')  list = list.filter(t => !t.task.completed && t.task.dueDate && new Date(t.task.dueDate) < today);
    else if (this._filterStatus === 'week')     list = list.filter(t => !t.task.completed && t.task.dueDate && new Date(t.task.dueDate) <= new Date(today.getTime() + 7*86400000));
    else if (this._filterStatus === 'completed') list = list.filter(t =>  t.task.completed);
    // 'all' = no filter

    if (this._filterAssignee === '__none__') list = list.filter(t => !t.task.assignee);
    else if (this._filterAssignee)           list = list.filter(t => t.task.assignee === this._filterAssignee);

    if (this._filterKind) list = list.filter(t => t.kind === this._filterKind);

    if (this._search) {
      const q = this._search.toLowerCase();
      list = list.filter(t => (t.task.text + ' ' + t.parentLabel).toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (a.task.completed !== b.task.completed) return a.task.completed ? 1 : -1;
      const ad = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Infinity;
      const bd = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Infinity;
      return ad - bd;
    });

    const html = list.length
      ? `<div class="card">
          <table class="tbl">
            <thead><tr><th></th><th>Task</th><th>Attached To</th><th>Assignee</th><th>Due</th><th></th></tr></thead>
            <tbody>${list.map(r => this._row(r, today)).join('')}</tbody>
          </table>
        </div>`
      : `<div class="card p-8 text-center text-ink-300">No tasks match.</div>`;

    if (returnHtml) return html;
    document.getElementById('tasks-list').innerHTML = html;
  },

  _row(r, today) {
    const { kind, parentId, parent, parentLabel, task } = r;
    const overdue = !task.completed && task.dueDate && new Date(task.dueDate) < today;
    const due = task.dueDate
      ? `<span class="${overdue ? 'text-rose-700 font-medium' : 'text-ink-500'}">${overdue ? 'Overdue · ' : ''}${U.date(task.dueDate)}</span>`
      : '<span class="text-ink-300 text-xs">No due date</span>';
    const parentLink = kind === 'admin'
      ? '<span class="text-xs text-ink-300">General admin</span>'
      : `<button class="text-brand-600 hover:underline text-sm text-left" onclick="Views.tasks._openParent('${kind}', '${parentId}')">${U.esc(parentLabel)}</button>`;
    return `
      <tr class="${task.completed ? 'opacity-60' : ''}">
        <td class="w-8"><input type="checkbox" class="chk" ${task.completed?'checked':''}
            onchange="Tasks.toggle('${kind}','${parentId || ''}','${task.id}'); Views.tasks._renderList();"></td>
        <td>
          <div class="${task.completed ? 'line-through text-ink-300' : 'text-ink-700'}">${U.esc(task.text)}</div>
          ${task.source ? `<div class="text-xs text-ink-300 mt-0.5">from ${U.esc(task.source.replace(/^automation:|^checklist:/, ''))}</div>` : ''}
        </td>
        <td>
          <div class="flex items-center gap-2">${Tasks.kindBadge(kind)} ${parentLink}</div>
        </td>
        <td>${Tasks.assigneeChip(task.assignee)}</td>
        <td>${due}</td>
        <td class="text-right whitespace-nowrap">
          <button class="btn-ghost" onclick="Views.tasks._edit('${kind}', '${parentId || ''}', '${task.id}')">Edit</button>
          <button class="btn-ghost text-rose-600" onclick="Tasks.remove('${kind}','${parentId || ''}','${task.id}'); Views.tasks.render();">✕</button>
        </td>
      </tr>`;
  },

  _openParent(kind, parentId) {
    if (kind === 'lead')             App.go('leads'),     setTimeout(() => Views.leads.open(parentId), 50);
    else if (kind === 'account')     App.go('accounts'),  setTimeout(() => Views.accounts.open(parentId), 50);
    else if (kind === 'bond')        App.go('bonds'),     setTimeout(() => Views.bonds.open(parentId), 50);
    else if (kind === 'opportunity') App.go('pipeline'),  setTimeout(() => Views.pipeline.open(parentId), 50);
    else if (kind === 'renewal')     App.go('renewals'),  setTimeout(() => Views.renewals.open(parentId), 50);
  },

  _edit(kind, parentId, taskId) {
    const t = Tasks.findTask(kind, parentId, taskId);
    if (!t) return;
    const body = `
      <div class="grid grid-cols-1 gap-3">
        <div><div class="field-label">Task</div>
          <input id="te-text" class="field-input" value="${U.esc(t.text || '')}"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><div class="field-label">Due Date</div>
            <input id="te-due" type="date" class="field-input" value="${U.esc(t.dueDate || '')}"></div>
          <div><div class="field-label">Assign To</div>
            ${Tasks.assigneeSelect('te-assignee', t.assignee || '')}</div>
        </div>
      </div>
    `;
    const footer = `
      <button class="btn-ghost" data-close>Cancel</button>
      <button class="btn-primary" onclick="Views.tasks._saveEdit('${kind}','${parentId || ''}','${taskId}')">Save</button>
    `;
    const m = U.modal({ title: 'Edit Task', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _saveEdit(kind, parentId, taskId) {
    Tasks.update(kind, parentId, taskId, {
      text:     document.getElementById('te-text').value.trim(),
      dueDate:  document.getElementById('te-due').value || null,
      assignee: document.getElementById('te-assignee').value || '',
    });
    U.closeModals();
    U.toast('Task updated');
    this.render();
  },
};
