window.Views = window.Views || {};
Views.documents = {
  _section: 'folders',   // 'folders' | 'files' | 'template'
  _expanded: null,       // Set of expanded paths

  render() {
    if (!this._expanded) {
      // Start with top-level + 01_Accounts open
      this._expanded = new Set();
      const root = DB.settings().storage?.rootPath || 'BondVault Files';
      this._expanded.add(root);
      this._expanded.add(root + '/01_Accounts');
    }

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Documents</h1>
          <p class="section-sub">Cloud-synced files organized by account, bond, and surety partner.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-primary" onclick="Views.documents.upload()">+ Upload</button>
        </div>
      </div>

      ${this._cloudPanel()}

      <div class="border-b border-cream-200 mb-5 flex gap-1 mt-6">
        ${this._tabBtn('folders',  'Folder Explorer')}
        ${this._tabBtn('files',    'All Files (' + DB.docs().length + ')')}
        ${this._tabBtn('template', 'Folder Template')}
      </div>

      <div id="docs-body">${this._renderSection()}</div>
    `;
  },

  _tabBtn(key, label) {
    const active = this._section === key;
    return `<button onclick="Views.documents._setSection('${key}')" class="px-3 py-2 text-sm border-b-2 -mb-px transition
        ${active ? 'border-brand-500 text-brand-700 font-semibold' : 'border-transparent text-ink-400 hover:text-ink-700'}">${label}</button>`;
  },
  _setSection(s) { this._section = s; document.getElementById('docs-body').innerHTML = this._renderSection(); },

  _renderSection() {
    if (this._section === 'files')    return this._renderFiles();
    if (this._section === 'template') return this._renderTemplate();
    return this._renderFolders();
  },

  // ---------- Cloud connection panel ----------
  _cloudPanel() {
    const st = DB.settings().storage;
    const connected = st && st.connected;

    if (connected) {
      const isOD = st.provider === 'onedrive';
      const accent = isOD ? 'bg-blue-100 text-blue-700'  : 'bg-indigo-100 text-indigo-700';
      const name   = isOD ? 'Microsoft OneDrive / SharePoint' : 'Dropbox';
      const icon   = isOD ? this._onedriveIcon() : this._dropboxIcon();

      return `
        <div class="card">
          <div class="p-5 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-lg ${accent} flex items-center justify-center">${icon}</div>
              <div>
                <div class="text-sm text-ink-300">Cloud File Storage</div>
                <div class="font-semibold text-ink-700">${name} <span class="badge badge-green ml-1">Connected</span></div>
                <div class="text-xs text-ink-300 mt-1">
                  ${st.account ? `Account: ${U.esc(st.account)} · ` : ''}
                  Root: <span class="font-mono">${U.esc(st.rootPath)}</span>
                  ${st.lastSync ? ` · Last sync ${U.datetime(st.lastSync)}` : ''}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs text-ink-400 flex items-center gap-2">
                <input type="checkbox" class="chk" ${st.autoProvision?'checked':''} onchange="Views.documents._toggleAuto(this.checked)">
                Auto-provision folders on account/bond create
              </label>
              <button class="btn-secondary" onclick="Views.documents.testSync()">Test Sync</button>
              <button class="btn-secondary text-rose-600" onclick="Views.documents.disconnect()">Disconnect</button>
            </div>
          </div>
        </div>`;
    }

    return `
      <div class="card">
        <div class="p-5">
          <div class="text-sm font-semibold text-ink-700 mb-1">Connect a cloud file storage provider</div>
          <div class="text-xs text-ink-300 mb-4">BondVault organizes documents into a numbered folder structure under your provider so docs travel with the account and bond.</div>
          <div class="grid grid-cols-2 gap-3">
            <button class="text-left p-4 rounded-lg border border-cream-300 hover:border-brand-400 hover:bg-cream-50 transition flex items-center gap-3"
                    onclick="Views.documents.connect('onedrive')">
              <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">${this._onedriveIcon()}</div>
              <div>
                <div class="font-semibold text-ink-700">Microsoft OneDrive / SharePoint</div>
                <div class="text-xs text-ink-300">Graph API · Files.ReadWrite.All · matches your M365 tenant</div>
              </div>
            </button>
            <button class="text-left p-4 rounded-lg border border-cream-300 hover:border-brand-400 hover:bg-cream-50 transition flex items-center gap-3"
                    onclick="Views.documents.connect('dropbox')">
              <div class="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">${this._dropboxIcon()}</div>
              <div>
                <div class="font-semibold text-ink-700">Dropbox</div>
                <div class="text-xs text-ink-300">App folder · files.content.write · works on any device</div>
              </div>
            </button>
          </div>
        </div>
      </div>`;
  },

  _onedriveIcon() {
    return `<svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor"><path d="M6.7 11.4a4.5 4.5 0 0 1 8.7-1.4 4 4 0 0 1 4.6 4 4 4 0 0 1-4 4H7a4 4 0 0 1-.3-7.99c0-.2 0-.4 0-.61z"/></svg>`;
  },
  _dropboxIcon() {
    return `<svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor"><path d="M6 3l6 4-6 4-6-4 6-4zm12 0l6 4-6 4-6-4 6-4zM0 13l6 4 6-4-6-4-6 4zm12 0l6-4 6 4-6 4-6-4zm-3 9l6-4 6 4-6 4-6-4z"/></svg>`;
  },

  connect(provider) {
    const labels = {
      onedrive: { name: 'Microsoft OneDrive / SharePoint', scope: 'Files.ReadWrite.All openid profile', placeholder: 'producers@vanderbeck-surety.example', siteHint: 'SharePoint Site (optional)' },
      dropbox:  { name: 'Dropbox',                          scope: 'files.content.write files.content.read', placeholder: 'your.team@example.com',           siteHint: 'Team Folder (optional)' },
    };
    const meta = labels[provider];
    const body = `
      <p class="text-sm text-ink-400 mb-3">You'll be redirected to <b>${meta.name}</b> to authorize BondVault. This demo simulates that flow.</p>
      <div class="bg-cream-100 border border-cream-200 rounded-lg p-3 text-xs space-y-1">
        <div><b>Scopes:</b> <span class="font-mono">${meta.scope}</span></div>
        <div><b>Redirect URI:</b> <span class="font-mono">https://app.bondvault.example/oauth/${provider}/callback</span></div>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <div><div class="field-label">Account / Mailbox</div>
          <input id="cs-account" class="field-input" value="${meta.placeholder}"></div>
        <div><div class="field-label">${meta.siteHint}</div>
          <input id="cs-site" class="field-input" value="${provider==='onedrive'?'Vanderbeck Surety — BondVault':''}"></div>
        <div class="col-span-2"><div class="field-label">Root Folder</div>
          <input id="cs-root" class="field-input font-mono" value="BondVault Files"></div>
        <div class="col-span-2"><label class="flex items-center gap-2 text-sm"><input type="checkbox" id="cs-auto" class="chk" checked>Auto-provision folder template when accounts and bonds are created</label></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.documents._completeConnect('${provider}')">Authorize</button>`;
    const m = U.modal({ title: `Connect to ${meta.name}`, body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  _completeConnect(provider) {
    const s = DB.settings();
    s.storage = s.storage || {};
    s.storage.provider = provider;
    s.storage.connected = true;
    s.storage.account = document.getElementById('cs-account').value;
    s.storage.siteName = document.getElementById('cs-site').value;
    s.storage.rootPath = document.getElementById('cs-root').value || 'BondVault Files';
    s.storage.autoProvision = document.getElementById('cs-auto').checked;
    s.storage.lastSync = new Date().toISOString();
    DB.save();
    U.closeModals();
    U.toast(`Connected to ${provider === 'onedrive' ? 'OneDrive' : 'Dropbox'}`);
    // Provision the folder skeleton across all existing accounts and bonds.
    Files.buildTree();
    this.render();
  },

  disconnect() {
    DB.settings().storage.connected = false;
    DB.settings().storage.provider  = null;
    DB.save();
    U.toast('Disconnected', 'info');
    this.render();
  },

  testSync() {
    DB.settings().storage.lastSync = new Date().toISOString();
    DB.save();
    U.toast('Sync OK — provider reachable');
    this.render();
  },

  _toggleAuto(v) {
    DB.settings().storage.autoProvision = v;
    DB.save();
    U.toast(v ? 'Auto-provision enabled' : 'Auto-provision disabled', 'info');
  },

  // ---------- Folder Explorer ----------
  _renderFolders() {
    const tree = Files.buildTree();
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Folder Explorer</div>
          <div class="flex items-center gap-2 text-xs text-ink-300">
            <button class="btn-ghost" onclick="Views.documents._expandAll(true)">Expand all</button>
            <button class="btn-ghost" onclick="Views.documents._expandAll(false)">Collapse all</button>
          </div>
        </div>
        <div class="p-3 font-sans text-sm">
          ${this._renderNode(tree, 0)}
        </div>
      </div>
    `;
  },

  _expandAll(open) {
    const tree = Files.buildTree();
    if (!open) { this._expanded = new Set([tree.path]); }
    else {
      const all = new Set();
      const walk = (n) => { all.add(n.path); n.children.forEach(walk); };
      walk(tree);
      this._expanded = all;
    }
    document.getElementById('docs-body').innerHTML = this._renderSection();
  },

  _toggle(path) {
    if (this._expanded.has(path)) this._expanded.delete(path);
    else                          this._expanded.add(path);
    document.getElementById('docs-body').innerHTML = this._renderSection();
  },

  _renderNode(node, depth) {
    const isOpen = this._expanded.has(node.path);
    const indent = depth * 18;
    const total  = Files.fileCount(node);
    const hasChildren = node.children.length > 0 || node.files.length > 0;

    const safeId = node.path.replace(/[^a-zA-Z0-9]/g, '_');
    const escPath = node.path.replace(/'/g, "\\'");

    const row = `
      <div class="flex items-center gap-1 py-1 px-2 rounded hover:bg-cream-50 cursor-pointer"
           style="padding-left:${indent}px"
           onclick="Views.documents._toggle('${escPath}')">
        <span class="w-4 text-ink-300 text-xs">${hasChildren ? (isOpen ? '▼' : '▶') : '·'}</span>
        <span class="text-base">${depth === 0 ? '☁️' : (isOpen ? '📂' : '📁')}</span>
        <span class="font-medium text-ink-700">${U.esc(node.name)}</span>
        ${total ? `<span class="ml-2 text-xs text-ink-300">${total} file${total===1?'':'s'}</span>` : ''}
      </div>`;

    let inner = '';
    if (isOpen) {
      inner += node.children.map(c => this._renderNode(c, depth + 1)).join('');
      // Files in this folder
      inner += node.files.map(d => `
        <div class="flex items-center gap-1 py-1 px-2 rounded hover:bg-cream-50"
             style="padding-left:${(depth+1)*18}px">
          <span class="w-4"></span>
          <span class="text-base">📄</span>
          <span class="text-ink-700 truncate flex-1">${U.esc(d.name)}</span>
          <span class="text-xs text-ink-300">${U.fileSize(d.size)} · ${U.date(d.uploaded)}</span>
          <button class="btn-ghost text-xs" onclick="event.stopPropagation(); Views.documents.preview('${d.id}')">View</button>
        </div>`).join('');
    }
    return row + inner;
  },

  // ---------- All Files (flat list) ----------
  _renderFiles() {
    const docs = DB.docs();
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">All Files</div>
          <div class="flex items-center gap-2">
            <select id="df-cat" class="field-select w-44" onchange="Views.documents._filterFiles()">
              <option value="">All categories</option>
              ${Object.keys(DB.settings().fileTemplate.categoryRouting).map(c=>`<option>${c}</option>`).join('')}
            </select>
            <input id="df-q" placeholder="Search…" class="field-input w-64" oninput="Views.documents._filterFiles()">
          </div>
        </div>
        <table class="tbl">
          <thead><tr><th>File</th><th>Category</th><th>Resolved Path</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
          <tbody id="docs-tbody">${this._fileRows(docs)}</tbody>
        </table>
      </div>
    `;
  },

  _fileRows(list) {
    if (!list.length) return `<tr><td colspan="6" class="text-center text-ink-300 py-10">No files.</td></tr>`;
    return list.map(d => `
      <tr>
        <td><div class="font-medium text-ink-700">${U.esc(d.name)}</div></td>
        <td><span class="badge badge-slate">${U.esc(d.category)}</span></td>
        <td class="font-mono text-xs text-ink-400 truncate max-w-[28rem]">${U.esc(Files.resolvePath(d))}</td>
        <td>${U.fileSize(d.size)}</td>
        <td>${U.date(d.uploaded)}</td>
        <td class="text-right">
          <button class="btn-ghost" onclick="Views.documents.preview('${d.id}')">View</button>
          <button class="btn-ghost text-rose-600" onclick="Views.documents.remove('${d.id}')">Delete</button>
        </td>
      </tr>`).join('');
  },

  _filterFiles() {
    const c = document.getElementById('df-cat').value;
    const q = document.getElementById('df-q').value.toLowerCase();
    let list = DB.docs();
    if (c) list = list.filter(d => d.category === c);
    if (q) list = list.filter(d => d.name.toLowerCase().includes(q));
    document.getElementById('docs-tbody').innerHTML = this._fileRows(list);
  },

  // ---------- Folder Template viewer ----------
  _renderTemplate() {
    const t = DB.settings().fileTemplate;
    return `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">Top Level (under root)</div></div>
          <div class="p-4 font-mono text-sm space-y-1">
            ${t.toplevel.map(n => `<div>📁 ${U.esc(n)}</div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Per-Account Folder Tree</div></div>
          <div class="p-4 font-mono text-sm space-y-1">
            <div class="text-ink-400">└ [Account Name] — [A-XXXX]/</div>
            ${t.account.map(n => `<div class="pl-4">📁 ${U.esc(n)}</div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Per-Bond Folder Tree</div></div>
          <div class="p-4 font-mono text-sm space-y-1">
            <div class="text-ink-400">└ 07_Bonds/[Bond #] — [Project]/</div>
            ${t.bond.map(n => `<div class="pl-4">📁 ${U.esc(n)}</div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Per-Opportunity Folder Tree</div></div>
          <div class="p-4 font-mono text-sm space-y-1">
            <div class="text-ink-400">└ 08_Opportunities/[Year] — [Obligee]/</div>
            ${(t.opportunity||[]).map(n => `<div class="pl-4">📁 ${U.esc(n)}</div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Per-Renewal Folder Tree</div></div>
          <div class="p-4 font-mono text-sm space-y-1">
            <div class="text-ink-400">└ 09_Renewals/[Bond #] — [Year] renewal/</div>
            ${(t.renewal||[]).map(n => `<div class="pl-4">📁 ${U.esc(n)}</div>`).join('')}
          </div>
        </div>

        <div class="card lg:col-span-3">
          <div class="card-header">
            <div class="card-title">Category → Folder Routing</div>
            <span class="text-xs text-ink-300">When a file is uploaded with one of these categories, it lands in the matching folder.</span>
          </div>
          <table class="tbl">
            <thead><tr><th>Category</th><th>Routed To</th><th>Scope</th></tr></thead>
            <tbody>
              ${Object.entries(t.categoryRouting).map(([cat, path]) => {
                const scope = path.includes('{bondFolder}')    ? 'Bond' :
                              path.includes('{oppFolder}')     ? 'Opportunity' :
                              path.includes('{renewalFolder}') ? 'Renewal' :
                              path.includes('{partnerName}')   ? 'Surety' :
                              path.startsWith('03_Templates') || path.startsWith('04_Agency Admin') ? 'Top-level' :
                              'Account';
                return `<tr>
                  <td class="font-medium">${U.esc(cat)}</td>
                  <td class="font-mono text-xs text-ink-400">${U.esc(path)}</td>
                  <td><span class="badge badge-slate">${scope}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="card lg:col-span-3">
          <div class="card-header"><div class="card-title">Provisioning</div></div>
          <div class="p-4 text-sm text-ink-400 space-y-2">
            <p>BondVault provisions the folder skeleton when a new account or bond is created (provided <b>Auto-provision</b> is on and a provider is connected). You can also reprovision an existing account from its file menu.</p>
            <div class="flex items-center gap-2">
              <button class="btn-secondary" onclick="Views.documents.reprovisionAll()">Reprovision Folders for All Accounts &amp; Bonds</button>
              <span class="text-xs text-ink-300">${DB.accounts().length} accounts · ${DB.bonds().length} bonds</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  reprovisionAll() {
    if (!DB.settings().storage?.connected) { U.toast('Connect a provider first', 'warn'); return; }
    Files.buildTree();      // virtual provisioning
    DB.settings().storage.lastSync = new Date().toISOString();
    DB.save();
    U.toast(`Provisioned folders for ${DB.accounts().length} accounts and ${DB.bonds().length} bonds`);
  },

  // ---------- Upload (modal) ----------
  upload() {
    const fi = document.createElement('input');
    fi.type = 'file'; fi.multiple = true;
    fi.addEventListener('change', e => this._handleFiles(e.target.files));
    fi.click();
  },

  _handleFiles(files) {
    if (!files || !files.length) return;
    const list = Array.from(files);
    const accts   = DB.accounts();
    const bonds   = DB.bonds();
    const cats    = Object.keys(DB.settings().fileTemplate.categoryRouting);
    const body = `
      <div class="mb-3 text-sm text-ink-400">Attaching ${list.length} file${list.length>1?'s':''}:</div>
      <ul class="text-xs bg-cream-50 p-3 rounded-lg mb-4 max-h-32 overflow-y-auto">
        ${list.map(f => `<li>• ${U.esc(f.name)} <span class="text-ink-300">(${U.fileSize(f.size)})</span></li>`).join('')}
      </ul>
      <div class="grid grid-cols-2 gap-3">
        <div><div class="field-label">Account</div>
          <select id="up-acct" class="field-select"><option value="">— None —</option>${accts.map(a=>`<option value="${a.id}">${U.esc(a.name)}</option>`).join('')}</select></div>
        <div><div class="field-label">Bond (optional)</div>
          <select id="up-bond" class="field-select"><option value="">— None —</option>${bonds.map(b=>`<option value="${b.id}">${b.number}</option>`).join('')}</select></div>
        <div><div class="field-label">Category</div>
          <select id="up-cat" class="field-select">${cats.map(c=>`<option>${U.esc(c)}</option>`).join('')}</select></div>
      </div>
      <div class="bg-cream-50 border border-cream-200 rounded p-2 mt-3 text-xs text-ink-400 font-mono" id="up-preview">Path preview will appear here</div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.documents._commitUpload()">Upload</button>`;
    const m = U.modal({ title: 'Upload Documents', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
    this._pending = list;
    ['up-acct','up-bond','up-cat'].forEach(id => document.getElementById(id).addEventListener('change', () => this._previewUploadPath()));
    this._previewUploadPath();
  },

  _previewUploadPath() {
    const ghost = {
      accountId: document.getElementById('up-acct').value || null,
      bondId:    document.getElementById('up-bond').value || null,
      category:  document.getElementById('up-cat').value,
    };
    document.getElementById('up-preview').textContent = '→ ' + Files.resolvePath(ghost);
  },

  _commitUpload() {
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
    const path = Files.resolvePath(d);
    const body = `
      <div class="text-center py-10 bg-cream-50 rounded-lg mb-4">
        <div class="text-5xl mb-3">📄</div>
        <div class="font-medium">${U.esc(d.name)}</div>
        <div class="text-xs text-ink-300 mt-1">${U.fileSize(d.size)} · ${U.esc(d.category)}</div>
        <div class="text-xs text-ink-300 mt-2 italic">Preview is simulated in this demo</div>
      </div>
      <div class="font-mono text-xs bg-cream-100 border border-cream-200 rounded p-2 mb-2 break-all">${U.esc(path)}</div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div><div class="field-label">Uploaded</div>${U.date(d.uploaded)}</div>
        <div><div class="field-label">Provider</div>${U.esc(DB.settings().storage?.provider==='onedrive' ? 'OneDrive' : DB.settings().storage?.provider==='dropbox' ? 'Dropbox' : '—')}</div>
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
  },
};
