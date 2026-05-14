window.Views = window.Views || {};
Views.documents = {
  render() {
    const docs = DB.docs();
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Documents</h1>
          <p class="section-sub">Upload financial statements, GIAs, WIPs, bond forms, and certificates. Drop or click to upload.</p>
        </div>
        <div class="flex items-center gap-2">
          <select id="df-cat" class="field-select w-44" onchange="Views.documents.filter()">
            <option value="">All categories</option>
            ${['Financial','WIP','Indemnity','Bond Form','Bid Document','Certificate','Other'].map(c=>`<option>${c}</option>`).join('')}
          </select>
          <input id="df-q" placeholder="Search…" class="field-input w-64" oninput="Views.documents.filter()">
        </div>
      </div>

      <div id="dropzone" class="dropzone mb-6">
        <div class="text-2xl mb-2">⬆</div>
        <div class="font-medium text-slate-700">Drop files here or <span class="text-brand-600 underline">browse</span></div>
        <div class="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX up to 25MB · attach to an account or a bond</div>
        <input id="file-input" type="file" multiple class="hidden">
      </div>

      <div class="card">
        <table class="tbl">
          <thead><tr><th>File</th><th>Category</th><th>Account</th><th>Bond</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
          <tbody id="docs-tbody">${this.rows(docs)}</tbody>
        </table>
      </div>
    `;
    this.bindDropzone();
  },

  rows(list) {
    if (!list.length) return `<tr><td colspan="7" class="text-center text-slate-400 py-12">No documents yet.</td></tr>`;
    return list.map(d => {
      const a = DB.findAccount(d.accountId) || {};
      const b = d.bondId ? DB.findBond(d.bondId) : null;
      return `
        <tr>
          <td><div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">${(d.name.split('.').pop()||'').slice(0,4).toUpperCase()}</div>
            <div class="font-medium">${U.esc(d.name)}</div>
          </div></td>
          <td><span class="badge badge-slate">${U.esc(d.category)}</span></td>
          <td>${U.esc(a.name||'—')}</td>
          <td>${b?b.number:'—'}</td>
          <td>${U.fileSize(d.size)}</td>
          <td>${U.date(d.uploaded)}</td>
          <td class="text-right">
            <button class="btn-ghost" onclick="Views.documents.preview('${d.id}')">View</button>
            <button class="btn-ghost text-rose-600" onclick="Views.documents.remove('${d.id}')">Delete</button>
          </td>
        </tr>`;
    }).join('');
  },

  filter() {
    const c = document.getElementById('df-cat').value;
    const q = document.getElementById('df-q').value.toLowerCase();
    let list = DB.docs();
    if (c) list = list.filter(d => d.category === c);
    if (q) list = list.filter(d => d.name.toLowerCase().includes(q));
    document.getElementById('docs-tbody').innerHTML = this.rows(list);
  },

  bindDropzone() {
    const dz = document.getElementById('dropzone');
    const fi = document.getElementById('file-input');
    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });
    fi.addEventListener('change', e => this.handleFiles(e.target.files));
  },

  handleFiles(files) {
    if (!files || !files.length) return;
    // Open assignment modal for the batch
    const list = Array.from(files);
    const accts = DB.accounts();
    const bonds = DB.bonds();
    const body = `
      <div class="mb-3 text-sm text-slate-600">Attaching ${list.length} file${list.length>1?'s':''}:</div>
      <ul class="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg mb-4 max-h-32 overflow-y-auto">
        ${list.map(f => `<li>• ${U.esc(f.name)} <span class="text-slate-400">(${U.fileSize(f.size)})</span></li>`).join('')}
      </ul>
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Account</div>
          <select id="up-acct" class="field-select"><option value="">— None —</option>${accts.map(a=>`<option value="${a.id}">${U.esc(a.name)}</option>`).join('')}</select></div>
        <div><div class="field-label">Bond (optional)</div>
          <select id="up-bond" class="field-select"><option value="">— None —</option>${bonds.map(b=>`<option value="${b.id}">${b.number}</option>`).join('')}</select></div>
        <div><div class="field-label">Category</div>
          <select id="up-cat" class="field-select">${['Financial','WIP','Indemnity','Bond Form','Bid Document','Certificate','Other'].map(c=>`<option>${c}</option>`).join('')}</select></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.documents.commitUpload()">Upload</button>`;
    const m = U.modal({ title: 'Upload Documents', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    this._pending = list;
  },

  commitUpload() {
    const list = this._pending || [];
    const accountId = document.getElementById('up-acct').value || null;
    const bondId    = document.getElementById('up-bond').value || null;
    const category  = document.getElementById('up-cat').value;
    list.forEach(f => {
      DB.docs().push({
        id: U.uid('D'),
        name: f.name, size: f.size, type: f.type,
        accountId, bondId, category,
        uploaded: new Date().toISOString().slice(0,10),
      });
    });
    DB.save();
    this._pending = null;
    U.closeModals();
    U.toast(`${list.length} file${list.length>1?'s':''} uploaded`);
    this.render();
  },

  preview(id) {
    const d = DB.docs().find(x => x.id === id);
    if (!d) return;
    const a = DB.findAccount(d.accountId) || {};
    const b = d.bondId ? DB.findBond(d.bondId) : null;
    const body = `
      <div class="text-center py-12 bg-slate-50 rounded-lg mb-4">
        <div class="text-5xl mb-3">📄</div>
        <div class="font-medium">${U.esc(d.name)}</div>
        <div class="text-xs text-slate-500 mt-1">${U.fileSize(d.size)} · ${U.esc(d.category)}</div>
        <div class="text-xs text-slate-400 mt-2">(Preview is simulated in this demo)</div>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div><div class="field-label">Account</div>${U.esc(a.name||'—')}</div>
        <div><div class="field-label">Bond</div>${b?b.number:'—'}</div>
        <div><div class="field-label">Uploaded</div>${U.date(d.uploaded)}</div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Close</button>`;
    const m = U.modal({ title: 'Document Preview', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  remove(id) {
    DB.state.documents = DB.docs().filter(d => d.id !== id);
    DB.save();
    U.toast('Document deleted', 'info');
    this.render();
  }
};
