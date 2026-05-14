window.Views = window.Views || {};
Views.settings = {
  render() {
    const s = DB.settings();
    document.getElementById('view').innerHTML = `
      <div class="mb-6">
        <h1 class="section-title">Settings</h1>
        <p class="section-sub">Agency, integrations, and demo controls.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <div class="card-header"><div class="card-title">Agency Profile</div></div>
          <div class="p-5 grid grid-cols-2 gap-3">
            <div class="col-span-2"><div class="field-label">Agency Name</div><input id="st-name" class="field-input" value="${U.esc(s.agency.name)}"></div>
            <div><div class="field-label">Producer License</div><input id="st-lic" class="field-input" value="${U.esc(s.agency.license)}"></div>
            <div><div class="field-label">Default Commission %</div><input id="st-comm" type="number" step="0.5" class="field-input" value="${s.agency.defaultCommissionRate}"></div>
            <div class="col-span-2"><div class="field-label">Address</div><input id="st-addr" class="field-input" value="${U.esc(s.agency.address)}"></div>
            <div><div class="field-label">Phone</div><input id="st-phone" class="field-input" value="${U.esc(s.agency.phone)}"></div>
            <div><div class="field-label">Email</div><input id="st-email" class="field-input" value="${U.esc(s.agency.email)}"></div>
            <div class="col-span-2 text-right"><button class="btn-primary" onclick="Views.settings.save()">Save Profile</button></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Integrations</div></div>
          <div class="p-5 space-y-3">
            <div class="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <div class="font-medium">QuickBooks Online</div>
                <div class="text-xs text-slate-500">${s.qbo.connected ? `${U.esc(s.qbo.companyName)} · last sync ${U.datetime(s.qbo.lastSync)}` : 'Not connected'}</div>
              </div>
              ${s.qbo.connected ? '<span class="badge badge-green">Connected</span>' : '<span class="badge badge-rose">Off</span>'}
            </div>
            <div class="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <div class="font-medium">Email (${U.esc(s.email.provider)})</div>
                <div class="text-xs text-slate-500">${s.email.connected ? `${U.esc(s.email.address)} · last sync ${U.datetime(s.email.lastSync)}` : 'Not connected'}</div>
              </div>
              ${s.email.connected ? '<span class="badge badge-green">Connected</span>' : '<span class="badge badge-rose">Off</span>'}
            </div>
            <div class="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <div class="font-medium">Bond Form Library</div>
                <div class="text-xs text-slate-500">SureLynx / NASBP forms feed (demo)</div>
              </div>
              <span class="badge badge-green">Connected</span>
            </div>
            <div class="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <div class="font-medium">eSignature (DocuSign)</div>
                <div class="text-xs text-slate-500">Indemnity agreements + bond riders</div>
              </div>
              <span class="badge badge-slate">Not connected</span>
            </div>
          </div>
        </div>

        <div class="card lg:col-span-2">
          <div class="card-header"><div class="card-title">Demo Controls</div></div>
          <div class="p-5 flex items-center gap-3 flex-wrap">
            <button class="btn-secondary" onclick="Views.settings.reset()">Reset Demo Data</button>
            <button class="btn-secondary" onclick="Views.settings.exportJSON()">Export DB (JSON)</button>
            <div class="text-xs text-slate-500">All data is stored in your browser's localStorage. Resetting reloads the seed dataset.</div>
          </div>
        </div>
      </div>
    `;
  },

  save() {
    const s = DB.settings().agency;
    s.name = document.getElementById('st-name').value;
    s.license = document.getElementById('st-lic').value;
    s.defaultCommissionRate = +document.getElementById('st-comm').value;
    s.address = document.getElementById('st-addr').value;
    s.phone = document.getElementById('st-phone').value;
    s.email = document.getElementById('st-email').value;
    DB.save();
    U.toast('Agency profile saved');
  },

  reset() {
    if (!confirm('Reset all demo data?')) return;
    DB.reset();
    U.toast('Demo data reset');
    location.reload();
  },

  exportJSON() {
    const blob = new Blob([JSON.stringify(DB.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sureflow-db.json'; a.click();
    U.toast('Database exported');
  }
};
