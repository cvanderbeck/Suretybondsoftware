window.Views = window.Views || {};

Views.tasks = {
  __rendered: false,
  // Two independent filters now:
  _filterStatus:   'open',          // open | completed | all
  _filterRange:    'all_open',      // see RANGES below
  _filterAssignee: '',
  _filterKind:     '',
  _filterPriority: '',              // '' | '1' | '2' | '3' | '4'
  _search:         '',

  // -------- Date range helpers --------
  _ranges() {
    const t  = new Date(); t.setHours(0,0,0,0);
    const tomorrow = new Date(t);  tomorrow.setDate(t.getDate() + 1);
    const dayAfterTomorrow = new Date(t); dayAfterTomorrow.setDate(t.getDate() + 2);
    // "This week" — today through next Sunday (end of week)
    const dow = t.getDay(); // 0 Sun .. 6 Sat
    const endOfWeek = new Date(t); endOfWeek.setDate(t.getDate() + (6 - dow)); endOfWeek.setHours(23,59,59,999);
    // Next 7 days rolling window
    const sevenDays = new Date(t); sevenDays.setDate(t.getDate() + 7); sevenDays.setHours(23,59,59,999);
    // Next week (the calendar week after this one)
    const nextWeekStart = new Date(endOfWeek); nextWeekStart.setDate(endOfWeek.getDate() + 1); nextWeekStart.setHours(0,0,0,0);
    const nextWeekEnd = new Date(nextWeekStart); nextWeekEnd.setDate(nextWeekStart.getDate() + 6); nextWeekEnd.setHours(23,59,59,999);
    // This month
    const startOfMonth = new Date(t.getFullYear(), t.getMonth(), 1);
    const endOfMonth   = new Date(t.getFullYear(), t.getMonth() + 1, 0, 23, 59, 59, 999);
    // Next month
    const startOfNextMonth = new Date(t.getFullYear(), t.getMonth() + 1, 1);
    const endOfNextMonth   = new Date(t.getFullYear(), t.getMonth() + 2, 0, 23, 59, 59, 999);

    return { today: t, tomorrow, dayAfterTomorrow, endOfWeek, sevenDays, nextWeekStart, nextWeekEnd, startOfMonth, endOfMonth, startOfNextMonth, endOfNextMonth };
  },

  _inRange(taskDue, key, r) {
    if (key === 'no_date')   return !taskDue;
    if (!taskDue) return false;
    const d = new Date(taskDue);
    if (key === 'overdue')   return d < r.today;
    if (key === 'today')     return d >= r.today && d < r.tomorrow;
    if (key === 'tomorrow')  return d >= r.tomorrow && d < r.dayAfterTomorrow;
    if (key === 'week7')     return d >= r.today && d <= r.sevenDays;
    if (key === 'this_week') return d >= r.today && d <= r.endOfWeek;
    if (key === 'next_week') return d >= r.nextWeekStart && d <= r.nextWeekEnd;
    if (key === 'this_month')return d >= r.startOfMonth && d <= r.endOfMonth;
    if (key === 'next_month')return d >= r.startOfNextMonth && d <= r.endOfNextMonth;
    return true;
  },

  // -------- Main render --------
  render() {
    this.__rendered = true;
    const all = Tasks.all();
    const r   = this._ranges();
    const open = all.filter(t => !t.task.completed);
    const completed = all.filter(t => t.task.completed);

    const buckets = {
      overdue:     open.filter(t => this._inRange(t.task.dueDate, 'overdue', r)).length,
      today:       open.filter(t => this._inRange(t.task.dueDate, 'today', r)).length,
      tomorrow:    open.filter(t => this._inRange(t.task.dueDate, 'tomorrow', r)).length,
      week7:       open.filter(t => this._inRange(t.task.dueDate, 'week7', r)).length,
      next_week:   open.filter(t => this._inRange(t.task.dueDate, 'next_week', r)).length,
      this_month:  open.filter(t => this._inRange(t.task.dueDate, 'this_month', r)).length,
      next_month:  open.filter(t => this._inRange(t.task.dueDate, 'next_month', r)).length,
      no_date:     open.filter(t => !t.task.dueDate).length,
    };
    const unassigned = open.filter(t => !t.task.assignee).length;
    const p1count = open.filter(t => Tasks.normalizePriority(t.task.priority) === 1).length;

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
        ${this._stat('Open',       open.length,        '')}
        ${this._stat('Overdue',    buckets.overdue,    buckets.overdue ? 'text-rose-700' : '')}
        ${this._stat('Due Today',  buckets.today,      '')}
        ${this._stat('P1 — Urgent', p1count,           p1count ? 'text-rose-600' : '')}
        ${this._stat('Unassigned', unassigned,         unassigned ? 'text-amber-700' : '')}
        ${this._stat('Completed',  completed.length,   '')}
      </div>

      <div class="mb-3 flex items-center gap-2 text-xs text-ink-400">
        <span class="uppercase tracking-wider">Show:</span>
        ${this._statusBtn('open',     'Open')}
        ${this._statusBtn('completed','Completed')}
        ${this._statusBtn('all',      'All')}
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-4">
        ${this._rangeChip('all_open',  'All',           open.length)}
        ${this._rangeChip('overdue',   'Overdue',       buckets.overdue,    'text-rose-700')}
        ${this._rangeChip('today',     'Today',         buckets.today)}
        ${this._rangeChip('tomorrow',  'Tomorrow',      buckets.tomorrow)}
        ${this._rangeChip('week7',     'Next 7 Days',   buckets.week7)}
        ${this._rangeChip('next_week', 'Next Week',     buckets.next_week)}
        ${this._rangeChip('this_month','This Month',    buckets.this_month)}
        ${this._rangeChip('next_month','Next Month',    buckets.next_month)}
        ${this._rangeChip('no_date',   'No Due Date',   buckets.no_date)}
        <div class="flex-1"></div>
        <select class="field-select w-40" onchange="Views.tasks._filterPriority = this.value; Views.tasks.render();">
          <option value="">All priorities</option>
          <option value="1" ${this._filterPriority==='1'?'selected':''}>P1 — Urgent</option>
          <option value="2" ${this._filterPriority==='2'?'selected':''}>P2 — High</option>
          <option value="3" ${this._filterPriority==='3'?'selected':''}>P3 — Medium</option>
          <option value="4" ${this._filterPriority==='4'?'selected':''}>P4 — None</option>
        </select>
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

      <div id="tasks-list">${this._renderList(all, true)}</div>
    `;
  },

  _stat(label, n, tone) {
    return `<div class="stat-card !p-3"><div class="stat-label">${label}</div><div class="stat-value text-lg ${tone || ''}">${n}</div></div>`;
  },

  _statusBtn(key, label) {
    const active = this._filterStatus === key;
    return `<button onclick="Views.tasks._filterStatus = '${key}'; Views.tasks.render();"
      class="px-2.5 py-1 rounded text-xs font-medium border transition
        ${active ? 'bg-ink-700 text-cream-50 border-ink-700' : 'bg-white text-ink-500 border-cream-300 hover:bg-cream-50'}">
      ${label}
    </button>`;
  },

  _rangeChip(key, label, count, tone) {
    const active = this._filterRange === key;
    return `<button onclick="Views.tasks._filterRange = '${key}'; Views.tasks.render();"
      class="px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1.5
        ${active ? 'bg-ink-800 text-cream-50 border-ink-800' : 'bg-white text-ink-500 border-cream-300 hover:bg-cream-50'}">
      ${label}
      <span class="${active ? 'opacity-70' : (tone || 'text-ink-300')} text-[10px] font-semibold">${count}</span>
    </button>`;
  },

  _renderList(allParam, returnHtml) {
    const r = this._ranges();
    let list = allParam || Tasks.all();

    // Status (open / completed / all)
    if (this._filterStatus === 'open')           list = list.filter(t => !t.task.completed);
    else if (this._filterStatus === 'completed') list = list.filter(t =>  t.task.completed);

    // Date range — anything other than "all_open" filters by bucket
    if (this._filterRange !== 'all_open') {
      list = list.filter(t => this._inRange(t.task.dueDate, this._filterRange, r));
    }

    if (this._filterAssignee === '__none__')   list = list.filter(t => !t.task.assignee);
    else if (this._filterAssignee)              list = list.filter(t => t.task.assignee === this._filterAssignee);

    if (this._filterKind) list = list.filter(t => t.kind === this._filterKind);

    if (this._filterPriority) {
      list = list.filter(t => String(Tasks.normalizePriority(t.task.priority)) === this._filterPriority);
    }

    if (this._search) {
      const q = this._search.toLowerCase();
      list = list.filter(t => (t.task.text + ' ' + t.parentLabel).toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (a.task.completed !== b.task.completed) return a.task.completed ? 1 : -1;
      // Priority — lower P# wins (P1 first)
      const pa = Tasks.normalizePriority(a.task.priority);
      const pb = Tasks.normalizePriority(b.task.priority);
      if (pa !== pb) return pa - pb;
      const ad = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Infinity;
      const bd = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Infinity;
      return ad - bd;
    });

    const html = list.length
      ? `<div class="card">
          <table class="tbl">
            <thead><tr>
              <th></th><th class="w-8"></th><th>Task</th><th>Attached To</th>
              <th>Assignee</th><th>Due</th><th></th>
            </tr></thead>
            <tbody>${list.map(row => this._row(row, r.today)).join('')}</tbody>
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
        <td>${Tasks.priorityFlag(task.priority, `Tasks.cyclePriority('${kind}','${parentId || ''}','${task.id}')`)}</td>
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
        <div class="grid grid-cols-3 gap-3">
          <div><div class="field-label">Due Date</div>
            <input id="te-due" type="date" class="field-input" value="${U.esc(t.dueDate || '')}"></div>
          <div><div class="field-label">Priority</div>
            ${Tasks.prioritySelect('te-priority', t.priority || 4)}</div>
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
      priority: +document.getElementById('te-priority').value || 4,
      assignee: document.getElementById('te-assignee').value || '',
    });
    U.closeModals();
    U.toast('Task updated');
    this.render();
  },
};
