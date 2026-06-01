window.Views = window.Views || {};

Views.opshub = {
  _section: 'overview',   // 'overview' | 'import' | 'export' | 'rates' | 'carriers' | 'settings'
  _preview: null,
  _carrierFilter: '',
  _classFilter: '',

  render() {
    const oh = DB.settings().opsHub || {};
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Operations Hub</h1>
          <p class="section-sub">Two-way Excel sync with the Keating Surety Operations Hub workbook — import to pull updates, export to share a fresh copy.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.opshub.exportNow()">⬇ Export to Excel</button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4 mb-5">
        <div class="stat-card !p-3"><div class="stat-label">Rate Brackets</div><div class="stat-value text-lg">${DB.rateTables().length}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Ops-Hub Carriers</div><div class="stat-value text-lg">${DB.opsHubCarriers().length}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Last Import</div><div class="stat-value text-sm">${oh.lastImport ? U.datetime(oh.lastImport) : '—'}</div></div>
        <div class="stat-card !p-3"><div class="stat-label">Last Export</div><div class="stat-value text-sm">${oh.lastExport ? U.datetime(oh.lastExport) : '—'}</div></div>
      </div>

      <div class="border-b border-cream-200 mb-5 flex gap-1 flex-wrap">
        ${this._tabBtn('overview', 'Overview')}
        ${this._tabBtn('import',   'Import')}
        ${this._tabBtn('export',   'Export')}
        ${this._tabBtn('rates',    'Rate Tables (' + DB.rateTables().length + ')')}
        ${this._tabBtn('carriers', 'Carriers (' + DB.opsHubCarriers().length + ')')}
        ${this._tabBtn('settings', 'Hub Settings')}
      </div>

      <div id="opshub-body">${this._renderSection()}</div>
    `;
  },

  _tabBtn(key, label) {
    const active = this._section === key;
    return `<button onclick="Views.opshub._setSection('${key}')" class="px-3 py-2 text-sm border-b-2 -mb-px transition
      ${active ? 'border-brand-500 text-brand-700 font-semibold' : 'border-transparent text-ink-400 hover:text-ink-700'}">${label}</button>`;
  },
  _setSection(s) { this._section = s; document.getElementById('opshub-body').innerHTML = this._renderSection(); },
  _renderSection() {
    if (this._section === 'import')   return this._renderImport();
    if (this._section === 'export')   return this._renderExport();
    if (this._section === 'rates')    return this._renderRates();
    if (this._section === 'carriers') return this._renderCarriers();
    if (this._section === 'settings') return this._renderSettings();
    return this._renderOverview();
  },

  // ---------- Overview ----------
  _renderOverview() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="card-title">How sync works</div></div>
          <div class="p-4 text-sm space-y-2 text-ink-400">
            <div>The Operations Hub workbook mirrors a small set of BondVault tables:</div>
            <ul class="list-disc list-inside space-y-1 text-ink-500">
              <li><b>Setup</b> — agency profile, dropdown lists (producers, statuses, bond types, invoice statuses, transfer statuses, carriers), and global assumptions (target trust buffer, A/R alert days, etc.)</li>
              <li><b>Rate_Tables</b> — carrier × bond class × bracket commission and premium-per-thousand</li>
              <li><b>Bond_Register</b> — master list of bonds with QBO invoice #, surety bond #, Dropbox URL, rate template, time surcharge, collected/remitted flags, bid outcome</li>
              <li><b>Pipeline</b>, <b>Bordereau_Export</b>, <b>Trust_Reconciliation</b>, <b>Monthly_Dashboard</b> — read-only views generated from the data above on export</li>
            </ul>
            <div class="pt-2"><b>Import</b> applies changes destructively (after a preview). <b>Export</b> generates a fresh workbook with current BondVault data — drop it on OneDrive / SharePoint and let your producers edit it directly.</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Quick actions</div></div>
          <div class="p-4 space-y-2">
            <button class="btn-primary w-full justify-center" onclick="Views.opshub._setSection('import')">⬆ Import workbook</button>
            <button class="btn-secondary w-full justify-center" onclick="Views.opshub.exportNow()">⬇ Export workbook</button>
            <button class="btn-secondary w-full justify-center" onclick="Views.opshub._setSection('rates')">View rate tables</button>
            <button class="btn-secondary w-full justify-center" onclick="Views.opshub._setSection('carriers')">View carriers</button>
          </div>
        </div>
      </div>
    `;
  },

  // ---------- Import ----------
  _renderImport() {
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Import an Operations Hub workbook</div></div>
        <div class="p-4">
          <div id="ohub-drop" class="dropzone mb-4">
            <div class="text-2xl mb-2">⬆</div>
            <div class="font-medium text-ink-500">Drop the workbook here or <span class="text-brand-600 underline">browse</span></div>
            <div class="text-xs text-ink-300 mt-1">.xlsx · Setup + Rate_Tables + Bond_Register sheets are read.</div>
            <input id="ohub-file" type="file" accept=".xlsx" class="hidden">
          </div>
          <div id="ohub-preview"></div>
        </div>
      </div>
    `;
  },

  _bindImport() {
    const dz = document.getElementById('ohub-drop');
    const fi = document.getElementById('ohub-file');
    if (!dz || !fi) return;
    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('dragover');
      if (e.dataTransfer.files[0]) this._handleFile(e.dataTransfer.files[0]);
    });
    fi.addEventListener('change', e => { if (e.target.files[0]) this._handleFile(e.target.files[0]); });
  },

  async _handleFile(file) {
    try {
      U.toast(`Reading ${file.name}…`, 'info');
      const wb = await OpsHub.readWorkbookFile(file);
      this._preview = OpsHub.preview(wb);
      this._renderPreview();
    } catch (err) {
      U.toast(`Could not read file: ${err.message || err}`, 'error');
    }
  },

  _renderPreview() {
    const p = this._preview;
    if (!p) return;
    const setup = p.setup || {};
    const out = `
      <div class="card mt-4 border-amber-300">
        <div class="card-header bg-amber-50">
          <div class="card-title">Preview</div>
          <span class="text-xs text-amber-800">Review and confirm before applying</span>
        </div>
        <div class="p-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Sheets detected</div>
            <ul class="list-disc list-inside text-ink-500">${p.sheets.map(s => `<li>${U.esc(s)}</li>`).join('')}</ul>
          </div>
          <div>
            <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Setup</div>
            <div class="text-ink-500 space-y-0.5">
              <div>Agency: <b>${U.esc(setup.kv?.agencyName || '—')}</b></div>
              <div>Trust Buffer: <b>${setup.kv?.targetTrustBuffer != null ? U.usd(setup.kv.targetTrustBuffer) : '—'}</b></div>
              <div>Producers: <b>${(setup.lists?.producers||[]).length}</b> · Bond Statuses: <b>${(setup.lists?.bondStatuses||[]).length}</b></div>
              <div>Carriers in workbook: <b>${(setup.lists?.carriers||[]).length}</b></div>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Rate Tables</div>
            <div class="text-ink-500"><b>${p.rateTables.length}</b> bracket rows — will <b>replace</b> existing.</div>
          </div>
          <div>
            <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Bond Register</div>
            <div class="text-ink-500">
              <div><b>${p.bondNew.length}</b> new bonds will be created (accounts auto-created as needed)</div>
              <div><b>${p.bondUpdated.length}</b> existing bonds will be updated</div>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-cream-200 flex items-center justify-end gap-2">
          <button class="btn-ghost" onclick="Views.opshub._preview = null; document.getElementById('ohub-preview').innerHTML='';">Discard</button>
          <button class="btn-primary" onclick="Views.opshub._applyPreview()">Apply Changes</button>
        </div>
      </div>
    `;
    document.getElementById('ohub-preview').innerHTML = out;
  },

  _applyPreview() {
    if (!this._preview) return;
    const summary = OpsHub.apply(this._preview);
    this._preview = null;
    U.toast(`Applied: ${summary.created} new bonds, ${summary.updated} updated, ${summary.rateBrackets} rate brackets`);
    this.render();
  },

  // ---------- Export ----------
  _renderExport() {
    const oh = DB.settings().opsHub || {};
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Export current BondVault data to an Excel workbook</div></div>
        <div class="p-4 space-y-3 text-sm text-ink-400">
          <p>This generates a fresh .xlsx in the Operations Hub shape with the current BondVault state:</p>
          <ul class="list-disc list-inside text-ink-500">
            <li><b>Welcome</b> + <b>Setup</b> — agency profile, dropdown lists, global assumptions</li>
            <li><b>Rate_Tables</b> — every rate bracket</li>
            <li><b>Bond_Register</b> — every bond in BondVault with all the Ops-Hub columns (Bond #, principal, carrier, class, penal sum, contract amount, effective / expiry, status, QBO invoice #, premium, commission, net to carrier, surety bond #, Dropbox URL, rate template, time surcharge, bid outcome, collected, carrier remitted)</li>
            <li><b>Pipeline</b> — every pre-bound opportunity</li>
            <li><b>Bordereau_Export</b> — per-bond carrier remittance lines</li>
            <li><b>Trust_Reconciliation</b> + <b>Monthly_Dashboard</b> — month-end skeletons populated with current totals</li>
          </ul>
          <p>Save the file to OneDrive / SharePoint and let your producers edit it directly. Bring it back here when you want to sync.</p>
          <div class="pt-2">
            <button class="btn-primary" onclick="Views.opshub.exportNow()">Generate &amp; Download</button>
            <span class="text-xs text-ink-300 ml-3">Last export: ${oh.lastExport ? U.datetime(oh.lastExport) : 'never'}</span>
          </div>
        </div>
      </div>
    `;
  },

  exportNow() {
    if (!window.XLSX) { U.toast('Excel library not loaded yet — check your internet connection', 'error'); return; }
    const filename = OpsHub.downloadWorkbook();
    U.toast(`Exported ${filename}`);
    if (this._section === 'export') this.render();
  },

  // ---------- Rate Tables ----------
  _renderRates() {
    const all = DB.rateTables();
    const carriers = [...new Set(all.map(r => r.carrier))];
    const classes  = [...new Set(all.map(r => r.bondClass))];
    let rows = all;
    if (this._carrierFilter) rows = rows.filter(r => r.carrier === this._carrierFilter);
    if (this._classFilter)   rows = rows.filter(r => r.bondClass === this._classFilter);

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">Rate Tables</div>
          <div class="flex items-center gap-2">
            <select class="field-select w-44" onchange="Views.opshub._carrierFilter = this.value; Views.opshub._setSection('rates')">
              <option value="">All carriers</option>
              ${carriers.map(c => `<option ${c===this._carrierFilter?'selected':''}>${U.esc(c)}</option>`).join('')}
            </select>
            <select class="field-select w-44" onchange="Views.opshub._classFilter = this.value; Views.opshub._setSection('rates')">
              <option value="">All classes</option>
              ${classes.map(c => `<option ${c===this._classFilter?'selected':''}>${U.esc(c)}</option>`).join('')}
            </select>
          </div>
        </div>
        <table class="tbl">
          <thead><tr>
            <th>Carrier</th><th>Class</th><th class="text-right">From ($)</th>
            <th class="text-right">Rate ($/M)</th><th class="text-right">Commission %</th>
            <th>Method</th><th>Pricing Base</th><th>Notes</th>
          </tr></thead>
          <tbody>
            ${rows.length ? rows.map(r => `
              <tr>
                <td class="font-medium">${U.esc(r.carrier)}</td>
                <td>${U.esc(r.bondClass)}</td>
                <td class="text-right">${r.threshold ? U.usd(r.threshold) : '—'}</td>
                <td class="text-right">${r.premiumPerThousand != null ? '$' + r.premiumPerThousand : '<span class="text-ink-300">UW-quoted</span>'}</td>
                <td class="text-right font-medium">${(r.commissionPct * 100).toFixed(1)}%</td>
                <td class="text-xs">${U.esc(r.ratingMethod || '')}</td>
                <td class="text-xs">${U.esc(r.pricingBase || '')}</td>
                <td class="text-xs text-ink-400 max-w-[20rem]">${U.esc(r.notes || '')}</td>
              </tr>
            `).join('') : '<tr><td colspan="8" class="text-center text-ink-300 py-8">No rate brackets match.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  },

  // ---------- Carriers ----------
  _renderCarriers() {
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Operations-Hub Carriers</div>
          <span class="text-xs text-ink-300">Used by the Bond Register dropdowns. Separate from the appointed-surety partners on the Bond Company Partners tab.</span>
        </div>
        <table class="tbl">
          <thead><tr><th>Carrier</th><th>Default Class</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>
            ${DB.opsHubCarriers().map(c => `
              <tr>
                <td class="font-medium">${U.esc(c.name)}</td>
                <td>${U.esc(c.defaultClass || '')}</td>
                <td>${c.active ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-slate">Inactive</span>'}</td>
                <td class="text-xs text-ink-400 max-w-[28rem]">${U.esc(c.notes || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ---------- Settings ----------
  _renderSettings() {
    const oh = DB.settings().opsHub || {};
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Hub Settings</div>
          <span class="text-xs text-ink-300">Pulled from / pushed to the Setup sheet</span>
        </div>
        <div class="p-4 grid grid-cols-2 gap-3 text-sm">
          <div><div class="field-label">Trust Bank Name</div><div class="font-medium">${U.esc(oh.trustBankName || '—')}</div></div>
          <div><div class="field-label">Operating Bank Name</div><div class="font-medium">${U.esc(oh.operatingBankName || '—')}</div></div>
          <div><div class="field-label">Target Trust Buffer</div><div class="font-medium">${oh.targetTrustBuffer != null ? U.usd(oh.targetTrustBuffer) : '—'}</div></div>
          <div><div class="field-label">Avg Commission Rate</div><div class="font-medium">${oh.avgCommissionRate != null ? (oh.avgCommissionRate * 100).toFixed(1) + '%' : '—'}</div></div>
          <div><div class="field-label">Producer Target Premium</div><div class="font-medium">${oh.producerTargetPremium != null ? U.usd(oh.producerTargetPremium) : '—'}</div></div>
          <div><div class="field-label">A/R Alert Days</div><div class="font-medium">${oh.arAlertDays || '—'}</div></div>
          <div><div class="field-label">Payables Alert Days</div><div class="font-medium">${oh.payablesAlertDays || '—'}</div></div>
          <div><div class="field-label">Forecast Months</div><div class="font-medium">${oh.forecastMonths || '—'}</div></div>
          <div><div class="field-label">Beginning Operating Cash</div><div class="font-medium">${oh.beginningOperatingCash != null ? U.usd(oh.beginningOperatingCash) : '—'}</div></div>
          <div><div class="field-label">Beginning Trust Cash</div><div class="font-medium">${oh.beginningTrustCash != null ? U.usd(oh.beginningTrustCash) : '—'}</div></div>
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-header"><div class="card-title">Dropdown Lists</div></div>
        <div class="p-4 grid grid-cols-5 gap-4 text-sm">
          ${[
            ['Producers',        oh.producers],
            ['Bond Statuses',    oh.bondStatuses],
            ['Bond Types',       oh.opsHubBondTypes],
            ['Invoice Statuses', oh.invoiceStatuses],
            ['Transfer Statuses',oh.transferStatuses],
          ].map(([label, list]) => `
            <div>
              <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">${label}</div>
              <ul class="text-ink-500 space-y-0.5">${(list || []).map(x => `<li>${U.esc(x)}</li>`).join('') || '<li class="text-ink-300">—</li>'}</ul>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Run binding after first render so dropzone listeners attach
  _afterRender() {
    if (this._section === 'import') this._bindImport();
  },
};

// Patch render to attach listeners after each tab change
(function() {
  const orig = Views.opshub._setSection.bind(Views.opshub);
  Views.opshub._setSection = function(s) {
    orig(s);
    setTimeout(() => Views.opshub._afterRender(), 0);
  };
  const origRender = Views.opshub.render.bind(Views.opshub);
  Views.opshub.render = function() {
    origRender();
    setTimeout(() => Views.opshub._afterRender(), 0);
  };
})();
