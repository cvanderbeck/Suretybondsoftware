// ---------- Operations Hub — Excel sync (Keating workbook shape) ----------
//
// Two-way sync between BondVault and the Operations Hub workbook
// (Setup / Rate_Tables / Bond_Register / Pipeline / Bordereau_Export /
// Trust_Reconciliation / Monthly_Dashboard).
//
// Imports apply changes destructively to the matching tables in
// `state` (after a preview/confirm step the caller can drive).
// Exports produce a downloadable .xlsx with the current values.
//
// Uses SheetJS (XLSX) loaded via CDN in index.html.

window.OpsHub = (() => {

  // ===========================================================
  // Helpers
  // ===========================================================
  const sheetGet = (ws, cellRef) => {
    const c = ws[cellRef];
    if (!c) return '';
    return c.v === undefined || c.v === null ? '' : c.v;
  };

  // Convert sheet to array-of-arrays with empty cells filled.
  const toAOA = (ws) => XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });

  const fromAOA = (aoa) => XLSX.utils.aoa_to_sheet(aoa);

  // Excel "date number" → ISO YYYY-MM-DD
  const excelDateToISO = (v) => {
    if (v == null || v === '') return null;
    if (typeof v === 'string') {
      // Already a date-ish string?
      const d = new Date(v);
      return isNaN(d) ? v : d.toISOString().slice(0,10);
    }
    if (typeof v === 'number') {
      // Excel epoch is 1899-12-30 (treats 1900 as leap)
      const ms = (v - 25569) * 86400 * 1000;
      const d  = new Date(ms);
      return isNaN(d) ? null : d.toISOString().slice(0,10);
    }
    return null;
  };

  // ISO → Excel date number (so the workbook displays dates not text)
  const isoToExcelDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return '';
    return Math.floor((d.getTime() / 86400000) + 25569);
  };

  // ===========================================================
  // EXPORT — build a workbook from the current BondVault state
  // ===========================================================
  function exportWorkbook() {
    const wb = XLSX.utils.book_new();

    // ---- Welcome ----
    const welcome = [
      ['BondVault — Surety Trust Accounting System'],
      ['Export from BondVault on ' + new Date().toISOString().slice(0,16).replace('T',' ')],
      [],
      ['This workbook mirrors the Keating Operations Hub structure. Save it'],
      ['to OneDrive / SharePoint and re-import it back into BondVault to sync changes.'],
      [],
      ['Sheets:'],
      ['  Setup                — Agency settings, dropdown lists, global assumptions'],
      ['  Rate_Tables          — Carrier × class commission and rate brackets'],
      ['  Bond_Register        — Master log of every bond'],
      ['  Pipeline             — Auto-filtered: bonds in pre-bind statuses'],
      ['  Bordereau_Export     — Carrier remittance export'],
      ['  Trust_Reconciliation — Bank ↔ liability summary'],
      ['  Monthly_Dashboard    — Premium / commission KPI summary'],
    ];
    XLSX.utils.book_append_sheet(wb, fromAOA(welcome), 'Welcome');

    // ---- Setup ----
    const s = DB.settings();
    const oh = s.opsHub || {};
    const setup = [
      ['Surety Trust Accounting System — Setup'],
      [],
      ['Agency Name',           s.agency?.name || ''],
      ['Agency Address Line 1', s.agency?.address || ''],
      ['Agency Phone',          s.agency?.phone || ''],
      ['Agency Email',          s.agency?.email || ''],
      [],
      ['Trust Bank Name',          oh.trustBankName || ''],
      ['Operating Bank Name',      oh.operatingBankName || ''],
      ['Target Trust Buffer',      oh.targetTrustBuffer || 0],
      ['Avg Commission Rate',      oh.avgCommissionRate || 0],
      ['Producer Target Premium',  oh.producerTargetPremium || 0],
      ['A/R Alert Days',           oh.arAlertDays || 0],
      ['Payables Alert Days',      oh.payablesAlertDays || 0],
      ['Forecast Months',          oh.forecastMonths || 0],
      ['Beginning Operating Cash', oh.beginningOperatingCash || 0],
      ['Beginning Trust Cash',     oh.beginningTrustCash || 0],
      [],
      ['Producer List',     'Bond Statuses',         'Bond Types',                  'Invoice Statuses',           'Transfer Statuses',          'Carriers'],
    ];
    const lists = [
      oh.producers          || [],
      oh.bondStatuses       || [],
      oh.opsHubBondTypes    || [],
      oh.invoiceStatuses    || [],
      oh.transferStatuses   || [],
      (DB.opsHubCarriers()  || []).map(c => c.name),
    ];
    const maxLen = Math.max(...lists.map(l => l.length));
    for (let i = 0; i < maxLen; i++) {
      setup.push(lists.map(l => l[i] || ''));
    }
    XLSX.utils.book_append_sheet(wb, fromAOA(setup), 'Setup');

    // ---- Rate_Tables ----
    const rt = [
      ['#','Carrier','Class','Threshold ($)','Premium Rate ($/M)','Commission %','Notes','Rate Method','Pricing Base'],
      ...DB.rateTables().map((r, i) => [
        i + 1, r.carrier, r.bondClass, r.threshold, r.premiumPerThousand, r.commissionPct, r.notes, r.ratingMethod, r.pricingBase,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, fromAOA(rt), 'Rate_Tables');

    // ---- Bond_Register ----
    const bondHeader = [
      '#','Bond Request #','Bond Type','Principal (Client)','Obligee','Carrier','Class',
      'Penal Sum','Contract Amount','Effective','Expiry','Status','Producer',
      'QB Invoice #','Days to Expiry','Renewal Bucket','Calc. Premium','Premium Override','Final Premium',
      'Notes','Date Issued','Project / Description','Calc. Commission $','Effective Comm %','Net to Carrier',
      'Dropbox URL','Collected','Carrier Remitted','IsLive','Surety Bond #','Rate Template','Time Surcharge','Bid Outcome',
    ];
    const today = new Date();
    const bonds = DB.bonds().map((b, i) => {
      const acct = DB.findAccount(b.accountId) || {};
      const partner = DB.findPartner(b.partnerId) || {};
      const days = b.expires
        ? Math.ceil((new Date(b.expires) - today) / 86400000)
        : '';
      const bucket = !b.expires ? '' : (days < 0 ? 'Expired' : days <= 30 ? '0–30 days' : days <= 60 ? '31–60 days' : days <= 90 ? '61–90 days' : '90+ days');
      const isLive = ['Active','Renewed','Expired','Pending UW','Cancelled'].includes(b.status) ? 'Yes' : 'No';
      return [
        i + 1,
        b.number || '',
        b.type   || '',
        acct.name || '',
        b.obligee || '',
        partner.name || '',
        '', // class — let producer fill in
        b.amount || 0,
        b.amount || 0,
        isoToExcelDate(b.effective),
        isoToExcelDate(b.expires),
        b.status || '',
        b.producer || 'Casey V.',
        b.qboInvoiceNumber || '',
        days,
        bucket,
        b.premium || 0,
        '', // premium override
        b.premium || 0,
        '',
        isoToExcelDate(b.effective),
        b.project || '',
        Math.round((b.premium || 0) * (b.commissionRate || 0) / 100),
        b.commissionRate ? (b.commissionRate / 100) : '',
        Math.round((b.premium || 0) * (1 - (b.commissionRate || 0) / 100)),
        b.dropboxUrl || '',
        b.collected ? 'Yes' : '',
        b.carrierRemitted ? 'Yes' : '',
        isLive,
        b.suretyBondNumber || '',
        b.rateTemplate || '',
        b.timeSurcharge || 0,
        b.bidOutcome || '',
      ];
    });
    XLSX.utils.book_append_sheet(wb, fromAOA([bondHeader, ...bonds]), 'Bond_Register');

    // ---- Pipeline ----
    const pipelineHeader = ['#','Bond Request #','Principal','Obligee','Carrier','Class','Penal Sum','Status','Producer','Notes'];
    const pipeRows = DB.pipeline().map((p, i) => {
      const acct = DB.findAccount(p.accountId) || {};
      return [
        i + 1, '(pre-bond)', acct.name || '', p.obligee || '', '', '',
        p.amount || 0, p.stage || '', p.producer || '', p.notes || '',
      ];
    });
    XLSX.utils.book_append_sheet(wb, fromAOA([pipelineHeader, ...pipeRows]), 'Pipeline');

    // ---- Bordereau_Export ----
    const bxHeader = ['Carrier','Bond #','Surety Bond #','Principal','Effective','Penal Sum','Final Premium','Comm %','Comm $','Net to Carrier','Collected','Carrier Remitted'];
    const bxRows = DB.bonds().map(b => {
      const acct = DB.findAccount(b.accountId) || {};
      const p = DB.findPartner(b.partnerId) || {};
      const comm = Math.round((b.premium || 0) * (b.commissionRate || 0) / 100);
      return [
        p.name || '', b.number || '', b.suretyBondNumber || '', acct.name || '',
        isoToExcelDate(b.effective), b.amount || 0, b.premium || 0,
        b.commissionRate ? (b.commissionRate / 100) : '',
        comm, (b.premium || 0) - comm,
        b.collected ? 'Yes' : '', b.carrierRemitted ? 'Yes' : '',
      ];
    });
    XLSX.utils.book_append_sheet(wb, fromAOA([bxHeader, ...bxRows]), 'Bordereau_Export');

    // ---- Trust_Reconciliation (skeleton — paste bank/QB balances on next sync) ----
    const trust = [
      ['Trust Reconciliation — paste bank + QB balances at month-end'],
      [],
      ['As of', new Date().toISOString().slice(0,10)],
      [],
      ['', 'Bank Balance', 'QuickBooks Balance', 'Modeled Liability', 'Difference (Bank − Liability)'],
      ['Trust Account',     '', '', (oh.beginningTrustCash || 0), ''],
      ['Operating Account', '', '', (oh.beginningOperatingCash || 0), ''],
    ];
    XLSX.utils.book_append_sheet(wb, fromAOA(trust), 'Trust_Reconciliation');

    // ---- Monthly_Dashboard ----
    const active = DB.bonds().filter(b => b.status === 'Active');
    const premium = active.reduce((s, b) => s + (b.premium || 0), 0);
    const commission = active.reduce((s, b) => s + (b.premium || 0) * (b.commissionRate || 0) / 100, 0);
    const dash = [
      ['Monthly Dashboard'],
      ['Generated', new Date().toISOString()],
      [],
      ['Active Bonds',           active.length],
      ['In-Force Premium',       premium],
      ['Projected Commission',   commission],
      ['Total Accounts',         DB.accounts().length],
      ['Total Carriers',         DB.opsHubCarriers().length],
      ['Total Rate Brackets',    DB.rateTables().length],
    ];
    XLSX.utils.book_append_sheet(wb, fromAOA(dash), 'Monthly_Dashboard');

    return wb;
  }

  function downloadWorkbook() {
    const wb = exportWorkbook();
    const filename = `BondVault_Operations_Hub_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    DB.settings().opsHub.lastExport = new Date().toISOString();
    DB.save();
    return filename;
  }

  // ===========================================================
  // IMPORT — read a workbook and stage changes
  // ===========================================================
  function readWorkbookFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          resolve(wb);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  // Parse a Setup sheet → partial settings object
  function _parseSetup(ws) {
    if (!ws) return null;
    const aoa = toAOA(ws);
    const out = {};
    const lists = {};
    let headerRow = -1;
    aoa.forEach((row, idx) => {
      const a = (row[0] || '').toString().trim();
      const b = row[1];
      if (a === 'Agency Name' && b)          out.agencyName = b;
      if (a === 'Agency Address Line 1' && b) out.agencyAddress = b;
      if (a === 'Agency Phone' && b)         out.agencyPhone = b;
      if (a === 'Agency Email' && b)         out.agencyEmail = b;
      if (a === 'Trust Bank Name' && b)      out.trustBankName = b;
      if (a === 'Operating Bank Name' && b)  out.operatingBankName = b;
      if (a === 'Target Trust Buffer')       out.targetTrustBuffer = +b || 0;
      if (a === 'Avg Commission Rate')       out.avgCommissionRate = +b || 0;
      if (a === 'Producer Target Premium')   out.producerTargetPremium = +b || 0;
      if (a === 'A/R Alert Days')            out.arAlertDays = +b || 0;
      if (a === 'Payables Alert Days')       out.payablesAlertDays = +b || 0;
      if (a === 'Forecast Months')           out.forecastMonths = +b || 0;
      if (a === 'Beginning Operating Cash')  out.beginningOperatingCash = +b || 0;
      if (a === 'Beginning Trust Cash')      out.beginningTrustCash = +b || 0;
      if (a === 'Producer List') headerRow = idx;
    });

    // Read the dropdown lists table starting at headerRow
    if (headerRow >= 0) {
      lists.producers      = [];
      lists.bondStatuses   = [];
      lists.bondTypes      = [];
      lists.invoiceStatuses= [];
      lists.transferStatuses=[];
      lists.carriers       = [];
      for (let r = headerRow + 1; r < aoa.length; r++) {
        const row = aoa[r];
        if (row[0]) lists.producers.push(row[0]);
        if (row[1]) lists.bondStatuses.push(row[1]);
        if (row[2]) lists.bondTypes.push(row[2]);
        if (row[3]) lists.invoiceStatuses.push(row[3]);
        if (row[4]) lists.transferStatuses.push(row[4]);
        if (row[5]) lists.carriers.push(row[5]);
      }
    }
    return { kv: out, lists };
  }

  // Parse a Rate_Tables sheet → array of rate table entries
  function _parseRateTables(ws) {
    if (!ws) return [];
    const aoa = toAOA(ws);
    // Find header row (first row with "Carrier" in column B)
    let hdr = aoa.findIndex(r => (r[1] || '').toString().trim() === 'Carrier');
    if (hdr < 0) return [];
    const out = [];
    for (let i = hdr + 1; i < aoa.length; i++) {
      const r = aoa[i];
      if (!r[1] && !r[2]) continue;
      out.push({
        id:                 'RT-' + String(out.length + 1).padStart(3, '0'),
        carrier:            (r[1] || '').toString(),
        bondClass:          (r[2] || '').toString(),
        threshold:          +r[3] || 0,
        premiumPerThousand: r[4] === '' || r[4] == null ? null : +r[4],
        commissionPct:      +r[5] || 0,
        notes:              (r[6] || '').toString(),
        ratingMethod:       (r[7] || '').toString(),
        pricingBase:        (r[8] || '').toString(),
      });
    }
    return out;
  }

  // Parse a Bond_Register sheet → array of bond updates
  function _parseBondRegister(ws) {
    if (!ws) return [];
    const aoa = toAOA(ws);
    const hdr = aoa.findIndex(r => r.includes('Bond Request #'));
    if (hdr < 0) return [];
    const head = aoa[hdr].map(h => (h || '').toString());
    const idx  = (label) => head.indexOf(label);
    const colN = idx('Bond Request #');
    const colP = idx('Principal (Client)');
    const out  = [];
    for (let i = hdr + 1; i < aoa.length; i++) {
      const r = aoa[i];
      if (!r[colP]) continue;
      out.push({
        bondNumber:       r[colN] || '',
        bondType:         r[idx('Bond Type')] || '',
        principal:        r[colP] || '',
        obligee:          r[idx('Obligee')] || '',
        carrier:          r[idx('Carrier')] || '',
        bondClass:        r[idx('Class')] || '',
        penalSum:         +r[idx('Penal Sum')] || 0,
        contractAmount:   +r[idx('Contract Amount')] || 0,
        effective:        excelDateToISO(r[idx('Effective')]),
        expiry:           excelDateToISO(r[idx('Expiry')]),
        status:           r[idx('Status')] || '',
        producer:         r[idx('Producer')] || '',
        qboInvoice:       r[idx('QB Invoice #')] || '',
        finalPremium:     +r[idx('Final Premium')] || 0,
        notes:            r[idx('Notes')] || '',
        projectDesc:      r[idx('Project / Description')] || '',
        dropboxUrl:       r[idx('Dropbox URL')] || '',
        collected:        (r[idx('Collected')] || '').toString().toLowerCase() === 'yes',
        carrierRemitted:  (r[idx('Carrier Remitted')] || '').toString().toLowerCase() === 'yes',
        suretyBondNumber: r[idx('Surety Bond #')] || '',
        rateTemplate:     r[idx('Rate Template')] || '',
        timeSurcharge:    +r[idx('Time Surcharge')] || 0,
        bidOutcome:       r[idx('Bid Outcome')] || '',
      });
    }
    return out;
  }

  // Produce a "preview diff" — what would change if we applied this workbook
  function preview(wb) {
    const out = {
      sheets: wb.SheetNames.slice(),
      setup:        _parseSetup(wb.Sheets['Setup']),
      rateTables:   _parseRateTables(wb.Sheets['Rate_Tables']),
      bondRegister: _parseBondRegister(wb.Sheets['Bond_Register']),
    };

    // Classify bond rows
    out.bondMatches = [];
    out.bondNew = [];
    out.bondUpdated = [];
    out.bondRegister.forEach(row => {
      const matchBySurety = row.suretyBondNumber
        ? DB.bonds().find(b => (b.suretyBondNumber || '') === row.suretyBondNumber)
        : null;
      const matchByNumber = row.bondNumber
        ? DB.bonds().find(b => (b.number || '') === row.bondNumber)
        : null;
      const matchByName = row.principal
        ? DB.bonds().find(b => {
            const a = DB.findAccount(b.accountId) || {};
            return (a.name || '').toLowerCase() === row.principal.toLowerCase()
              && (b.effective || '') === row.effective;
          })
        : null;
      const existing = matchBySurety || matchByNumber || matchByName;
      if (existing) { out.bondMatches.push({ row, existing }); out.bondUpdated.push(existing.number || existing.id); }
      else          { out.bondNew.push(row); }
    });

    return out;
  }

  // Apply a preview to the live DB
  function apply(prev) {
    const s = DB.settings();
    s.opsHub = s.opsHub || {};

    // ---- Setup ----
    if (prev.setup?.kv) {
      const k = prev.setup.kv;
      if (k.agencyName)  s.agency.name = k.agencyName;
      if (k.agencyAddress) s.agency.address = k.agencyAddress;
      if (k.agencyPhone) s.agency.phone = k.agencyPhone;
      if (k.agencyEmail) s.agency.email = k.agencyEmail;

      ['trustBankName','operatingBankName','targetTrustBuffer','avgCommissionRate',
       'producerTargetPremium','arAlertDays','payablesAlertDays','forecastMonths',
       'beginningOperatingCash','beginningTrustCash'].forEach(f => {
         if (k[f] != null && k[f] !== '') s.opsHub[f] = k[f];
       });
    }
    if (prev.setup?.lists) {
      const L = prev.setup.lists;
      if (L.producers?.length)         s.opsHub.producers          = L.producers;
      if (L.bondStatuses?.length)      s.opsHub.bondStatuses       = L.bondStatuses;
      if (L.bondTypes?.length)         s.opsHub.opsHubBondTypes    = L.bondTypes;
      if (L.invoiceStatuses?.length)   s.opsHub.invoiceStatuses    = L.invoiceStatuses;
      if (L.transferStatuses?.length)  s.opsHub.transferStatuses   = L.transferStatuses;
      if (L.carriers?.length) {
        const existing = new Set(DB.opsHubCarriers().map(c => c.name));
        L.carriers.forEach(name => {
          if (!existing.has(name)) {
            DB.opsHubCarriers().push({ id: U.uid('OC'), name, active: true, defaultClass: '', notes: 'Added via Operations Hub import.' });
          }
        });
      }
    }

    // ---- Rate Tables ----
    if (prev.rateTables?.length) {
      DB.state.rateTables = prev.rateTables;
    }

    // ---- Bond Register ----
    let created = 0, updated = 0;
    prev.bondRegister.forEach(row => {
      // Find or create account
      let acct = DB.accounts().find(a => (a.name || '').toLowerCase() === row.principal.toLowerCase());
      if (!acct && row.principal) {
        acct = {
          id: U.uid('A'), name: row.principal, dba: '', type: 'Contractor',
          contact: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
          taxId: '', credit: 0,
          notes: `Auto-created from Operations Hub import on ${new Date().toISOString().slice(0,10)}.`,
          company: {}, contacts: [], indemnitors: [],
          renewals: { financialsLast: null, financialsInterval: 365, wipLast: null, wipInterval: 90 },
          createdFromOpsHub: true,
        };
        DB.accounts().push(acct);
      }
      // Find or create surety partner
      let partner = DB.partners().find(p => (p.name || '').toLowerCase() === row.carrier.toLowerCase());
      if (!partner && row.carrier) {
        partner = { id: U.uid('P'), name: row.carrier, rating: '', appetite: '',
                    contactName: '', email: '', phone: '', portalUrl: '',
                    commissionRate: 25, active: true };
        DB.partners().push(partner);
      }

      // Match existing bond
      const existing = (row.suretyBondNumber && DB.bonds().find(b => b.suretyBondNumber === row.suretyBondNumber))
                    || (row.bondNumber && DB.bonds().find(b => b.number === row.bondNumber));

      if (existing) {
        // Update
        if (row.bondType)         existing.type = row.bondType;
        if (acct)                 existing.accountId = acct.id;
        if (partner)              existing.partnerId = partner.id;
        if (row.obligee)          existing.obligee = row.obligee;
        if (row.penalSum)         existing.amount = row.penalSum;
        if (row.effective)        existing.effective = row.effective;
        if (row.expiry)           existing.expires = row.expiry;
        if (row.status)           existing.status = row.status;
        if (row.qboInvoice)       existing.qboInvoiceNumber = row.qboInvoice;
        if (row.finalPremium)     existing.premium = row.finalPremium;
        if (row.projectDesc)      existing.project = row.projectDesc;
        if (row.dropboxUrl)       existing.dropboxUrl = row.dropboxUrl;
        if (row.suretyBondNumber) existing.suretyBondNumber = row.suretyBondNumber;
        if (row.rateTemplate)     existing.rateTemplate = row.rateTemplate;
        if (row.timeSurcharge)    existing.timeSurcharge = row.timeSurcharge;
        if (row.bidOutcome)       existing.bidOutcome = row.bidOutcome;
        existing.collected        = !!row.collected;
        existing.carrierRemitted  = !!row.carrierRemitted;
        if (row.producer)         existing.producer = row.producer;
        updated++;
      } else if (acct) {
        // Create
        const newBond = {
          id: U.uid('B'),
          number:    row.bondNumber || ('SF-' + new Date().getFullYear() + '-' + String(DB.bonds().length + 1).padStart(5,'0')),
          accountId: acct.id,
          partnerId: partner ? partner.id : null,
          type:      row.bondType || 'Payment & Performance',
          obligee:   row.obligee,
          project:   row.projectDesc,
          amount:    row.penalSum,
          premium:   row.finalPremium,
          rate:      row.penalSum ? +((row.finalPremium / row.penalSum) * 100).toFixed(2) : 0,
          commissionRate: 25,
          effective: row.effective,
          expires:   row.expiry,
          status:    row.status || 'Active',
          qboInvoiceNumber: row.qboInvoice || '',
          reportedToBondCo: null, obligeeApproved: null, sentToPrincipal: null,
          dropboxUrl:       row.dropboxUrl || '',
          suretyBondNumber: row.suretyBondNumber || '',
          rateTemplate:     row.rateTemplate || '',
          timeSurcharge:    row.timeSurcharge || 0,
          bidOutcome:       row.bidOutcome || '',
          collected:        !!row.collected,
          carrierRemitted:  !!row.carrierRemitted,
          producer:         row.producer || 'Casey V.',
          typeSpecific: {},
        };
        DB.bonds().push(newBond);
        created++;
      }
    });

    s.opsHub.lastImport = new Date().toISOString();
    DB.save();

    return { created, updated, rateBrackets: prev.rateTables.length, carriers: (prev.setup?.lists?.carriers?.length) || 0 };
  }

  return { exportWorkbook, downloadWorkbook, readWorkbookFile, preview, apply };
})();
