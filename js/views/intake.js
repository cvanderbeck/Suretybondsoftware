// ---------- Online Intake Forms ----------
// Public-facing forms (CQ, PFS, WIP) that a client/lead/contractor
// fills out via a token URL. On submit, data is auto-imported into
// the appropriate account / indemnitors / bond.wip records, creating
// an account if one doesn't yet exist.
//
// Routing:
//   #/intake/cq            — anonymous demo (no token)
//   #/intake/cq/<token>    — bound to a specific intakeForms record
//   #/intake/pfs/<token>
//   #/intake/wip/<token>
//
// On agency side, the Intake.* helpers handle creation, link copy,
// import, and rendering an inline panel on lead/account modals.

window.Views = window.Views || {};

Views.intake = {

  // -------- Routing entry --------
  render(args = {}) {
    const type  = args.type;
    const token = args.token;
    const form  = token ? DB.intakeByToken(token) : null;

    if (token && !form) {
      this._renderShell(`
        <div class="card max-w-xl mx-auto p-8 text-center">
          <div class="text-2xl mb-2">🔒 Link Not Found</div>
          <div class="text-sm text-ink-300">This intake link is expired or invalid. Please contact your producer for a new link.</div>
        </div>`);
      return;
    }

    const state = form || { type, status: 'in_progress', data: {} };

    if (state.status === 'submitted' || state.status === 'imported') {
      this._renderThankYou(state);
      return;
    }

    let body;
    if (type === 'cq')  body = this._formCQ(state);
    else if (type === 'pfs') body = this._formPFS(state);
    else if (type === 'wip') body = this._formWIP(state);
    else {
      body = `<div class="card p-8 max-w-xl mx-auto text-center text-ink-300">Unknown form type.</div>`;
    }
    this._renderShell(body);
    if (type === 'pfs') this._setupPFSRecalc();
  },

  _setupPFSRecalc() {
    const fmt = (n) => (n || 0).toLocaleString('en-US', { style:'currency', currency:'USD', maximumFractionDigits: 0 });
    const tA = ['pfs-cashPrimary','pfs-cashOther','pfs-stocks','pfs-receivables','pfs-realEstate','pfs-cashSV','pfs-bizVentures','pfs-personalProp','pfs-autos','pfs-otherAssets'];
    const tL = ['pfs-unsecured','pfs-current','pfs-payable','pfs-mortgages','pfs-secured','pfs-taxes','pfs-otherLiab'];
    const sum = (ids) => ids.reduce((s, id) => s + (+document.getElementById(id)?.value || 0), 0);
    const recalc = () => {
      const a = sum(tA), l = sum(tL);
      const $a = document.getElementById('pfs-totalAssets');
      const $l = document.getElementById('pfs-totalLiab');
      const $n = document.getElementById('pfs-networth');
      if ($a) $a.textContent = fmt(a);
      if ($l) $l.textContent = fmt(l);
      if ($n) $n.textContent = fmt(a - l);
    };
    [...tA, ...tL].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', recalc);
    });
    recalc();
  },

  // -------- Public shell (cream paper, no sidebar) --------
  _renderShell(inner) {
    document.body.classList.add('intake-mode');
    document.getElementById('view').innerHTML = `
      <div class="max-w-5xl mx-auto py-6">
        <div class="flex items-center justify-between mb-6 px-2">
          <div class="flex items-center gap-3">
            <svg viewBox="0 0 220 130" class="w-32 h-auto" xmlns="http://www.w3.org/2000/svg">
              <text x="110" y="46" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-size="42" font-weight="700" fill="#221c12">Bond</text>
              <line x1="22"  y1="68" x2="84"  y2="68" stroke="#bdb09a" stroke-width="0.9" stroke-linecap="round"/>
              <line x1="136" y1="68" x2="198" y2="68" stroke="#bdb09a" stroke-width="0.9" stroke-linecap="round"/>
              <circle cx="110" cy="60.5" r="3.6" fill="none" stroke="#a14e30" stroke-width="1.2"/>
              <line x1="110" y1="64.5" x2="110" y2="78" stroke="#a14e30" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="110" y1="73"   x2="115.5" y2="73" stroke="#a14e30" stroke-width="1.2" stroke-linecap="round"/>
              <line x1="110" y1="78"   x2="114"   y2="78" stroke="#a14e30" stroke-width="1.2" stroke-linecap="round"/>
              <text x="110" y="118" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-style="italic" font-size="42" font-weight="600" fill="#a14e30">Vault</text>
            </svg>
          </div>
          <div class="text-right text-xs text-ink-300">
            ${U.esc(DB.settings().agency.name)}<br/>
            <span class="italic">Secure online intake — your data is encrypted in transit.</span>
          </div>
        </div>
        ${inner}
      </div>`;
  },

  _renderThankYou(state) {
    this._renderShell(`
      <div class="card max-w-2xl mx-auto p-10 text-center">
        <div class="text-5xl mb-3">✓</div>
        <div class="text-xl font-display font-semibold mb-2">Thank you</div>
        <div class="text-sm text-ink-400 mb-4">Your ${this._typeLabel(state.type)} was submitted on ${U.date(state.submittedDate)}. Your producer will be notified and reach out shortly.</div>
        <div class="text-xs text-ink-300 mt-6">You can close this tab.</div>
      </div>`);
  },

  _typeLabel(t) {
    return { cq: 'Contractor Questionnaire', pfs: 'Personal Financial Statement', wip: 'Work-in-Progress Schedule' }[t] || t;
  },

  // ===========================================================
  // CONTRACTOR QUESTIONNAIRE
  // ===========================================================
  _formCQ(form) {
    const d = form.data || {};
    const tok = form.token || 'demo';
    const owners = d.owners && d.owners.length ? d.owners : Array.from({length:3}, () => ({}));
    const prevSureties = d.previousSureties && d.previousSureties.length ? d.previousSureties : Array.from({length:3},()=>({}));
    const largestJobs = d.largestJobs && d.largestJobs.length ? d.largestJobs : Array.from({length:5},()=>({}));
    const suppliers = d.suppliers && d.suppliers.length ? d.suppliers : Array.from({length:5},()=>({}));
    const subs = d.subs && d.subs.length ? d.subs : Array.from({length:5},()=>({}));
    const keyPersonnel = d.keyPersonnel && d.keyPersonnel.length ? d.keyPersonnel : Array.from({length:5},()=>({}));
    const lifeIns = d.lifeIns && d.lifeIns.length ? d.lifeIns : Array.from({length:3},()=>({}));
    const subsidiaries = d.subsidiaries && d.subsidiaries.length ? d.subsidiaries : Array.from({length:3},()=>({}));

    return `
      <div class="card p-6 mb-6">
        <div class="text-xs uppercase tracking-[0.18em] text-ink-300 mb-1 font-display">Online Intake</div>
        <h1 class="text-2xl font-display font-semibold mb-2">Contractor Questionnaire</h1>
        <p class="text-sm text-ink-400">Complete the sections below. Your producer pre-filled some fields; please review and update. Click Submit when finished — your data will populate your file automatically.</p>
      </div>

      ${this._sectionCard('Business Information', `
        <div class="grid grid-cols-2 gap-3">
          ${this._fld('biz-name',  'Business Name',     d.businessName, 'text', 'col-span-2')}
          ${this._fld('biz-contact','Contact Full Name', d.contactName)}
          ${this._fld('biz-email', 'Contact Email',     d.contactEmail, 'email')}
          ${this._fld('biz-addr',  'Business Address',  d.address, 'text', 'col-span-2')}
          ${this._fld('biz-phone', 'Phone',             d.phone)}
          ${this._fld('biz-web',   'Website',           d.website)}
          ${this._fld('biz-tax',   'Tax ID / EIN',      d.taxId)}
          ${this._fld('biz-stateyr','State & Year of Incorporation', d.stateYear)}
        </div>
        <div class="mt-3"><div class="field-label">Business Type</div>
          ${this._radioGroup('biz-type', ['C-Corp','Sub S-Corp','Partnership','LLP','LLC','Sole Prop'], d.businessType)}
        </div>
        <div class="grid grid-cols-2 gap-3 mt-3">
          ${this._fld('biz-trades','Trade(s)',          d.trades, 'text', 'col-span-2')}
          ${this._fld('biz-areas', 'Areas of Operation',d.areas,  'text', 'col-span-2')}
        </div>
      `)}

      ${this._sectionCard('Owners, Proprietors, Partners & Officers', `
        <div class="space-y-3" id="cq-owners">
          ${owners.map((o, i) => this._ownerRow(i, o)).join('')}
        </div>
        <div class="mt-3 grid grid-cols-3 gap-3">
          <div>
            <div class="field-label">Will the above individuals and spouses personally indemnify the surety?</div>
            ${this._yesNo('ind-indemnify', d.indemnifyAll)}
          </div>
          <div>
            <div class="field-label">Buy/Sell agreement among owners?</div>
            ${this._yesNo('ind-buysell', d.buySell)}
          </div>
          <div>
            <div class="field-label">If yes, funded by life insurance?</div>
            ${this._yesNo('ind-bsfunded', d.buySellFunded)}
          </div>
        </div>
        <div class="mt-3">${this._fld('ind-explain', 'If indemnity above is "No", explain', d.indemnifyExplain, 'text', 'col-span-2')}</div>
      `)}

      ${this._sectionCard('Business Details', `
        <div class="grid grid-cols-3 gap-3">
          <div>
            <div class="field-label">Bankruptcy, default, or surety loss?</div>
            ${this._yesNo('bd-bk', d.bankruptcy)}
          </div>
          <div>
            <div class="field-label">Owners or officers in current litigation?</div>
            ${this._yesNo('bd-lit', d.litigation)}
          </div>
          <div></div>
          ${this._fld('bd-gov',  '% Government work', d.pctGov,     'number')}
          ${this._fld('bd-prv',  '% Private work',    d.pctPrivate, 'number')}
          ${this._fld('bd-oth',  '% Other',           d.pctOther,   'number')}
          ${this._fld('bd-ownTrades', 'Trades undertaken with own employees', d.ownTrades, 'text', 'col-span-3')}
          ${this._fld('bd-pctSub','% normally subcontracted', d.pctSubcontracted, 'number')}
          ${this._fld('bd-subTrades','Trades normally subcontracted', d.subTrades, 'text', 'col-span-2')}
          ${this._fld('bd-subBonding','Sub-Bonding Policy', d.subBondingPolicy, 'text', 'col-span-3')}
          ${this._fld('bd-jobSize','Preferred Job Size Range', d.preferredJobSize)}
          ${this._fld('bd-jobsAtTime','# of Jobs at a Time', d.jobsAtTime, 'number')}
          ${this._fld('bd-largestCost','Largest Cost-to-Complete Backlog ($)', d.largestCostBacklog, 'number')}
          ${this._fld('bd-largestYear','Year of Largest Backlog', d.largestCostBacklogYear)}
          ${this._fld('bd-largestJob','Largest Individual Job / Backlog Expected Next Year ($)', d.largestExpectedNext, 'number', 'col-span-2')}
          ${this._fld('bd-annual','Expected Annual Volume This FY ($)', d.expectedAnnualVolume, 'number')}
          <div>
            <div class="field-label">Lease Equipment?</div>
            ${this._yesNo('bd-lease', d.leaseEquipment)}
          </div>
          ${this._fld('bd-leaseType','Type of Lease', d.leaseType)}
        </div>
      `)}

      ${this._sectionCard('Financial Information', `
        <div class="grid grid-cols-2 gap-3">
          ${this._fld('fi-cpa',   'Name of CPA Firm',         d.cpaFirm)}
          ${this._fld('fi-fye',   'Fiscal Year End',          d.fye, 'date')}
          ${this._fld('fi-cpaContact','CPA Contact Name',     d.cpaContact)}
          ${this._fld('fi-cpaEmail','CPA Email',              d.cpaEmail, 'email')}
          ${this._fld('fi-cpaAddr','CPA Address',             d.cpaAddress, 'text', 'col-span-2')}
          ${this._fld('fi-cpaPhone','CPA Phone',              d.cpaPhone)}
          ${this._fld('fi-taxBasis','Tax Basis',              d.taxBasis)}
        </div>
        <div class="mt-3">
          <div class="field-label">Financial statements prepared at what level?</div>
          ${this._radioGroup('fi-level', ['CPA Audit','Review','Compilation','Self-Prepared'], d.statementLevel)}
        </div>
        <div class="mt-3">
          <div class="field-label">How often are internal financial statements prepared?</div>
          ${this._radioGroup('fi-freq', ['Annually','Semi-Annually','Quarterly','Monthly'], d.statementFrequency)}
        </div>
        <div class="grid grid-cols-3 gap-3 mt-3">
          ${this._fld('fi-acct',  'Accounting Software',  d.softwareAccounting)}
          ${this._fld('fi-est',   'Estimating Software',  d.softwareEstimating)}
          ${this._fld('fi-cost',  'Job Cost Software',    d.softwareJobCost)}
        </div>
        ${this._fld('fi-changes','Any changes to balance sheet since last FY?', d.balanceSheetChanges, 'text', 'col-span-2 mt-3')}

        <div class="divider"></div>
        <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Bank / Line of Credit</div>
        <div class="grid grid-cols-2 gap-3">
          ${this._fld('bk-name',    'Name of Bank',     d.bankName)}
          ${this._fld('bk-loc',     'Line of Credit Limit ($)', d.locLimit, 'number')}
          ${this._fld('bk-contact', 'Bank Contact',     d.bankContact)}
          ${this._fld('bk-exp',     'LOC Expiration',   d.locExpiration, 'date')}
          ${this._fld('bk-addr',    'Bank Address',     d.bankAddress, 'text', 'col-span-2')}
          ${this._fld('bk-phone',   'Bank Phone',       d.bankPhone)}
        </div>
        <div class="mt-3"><div class="field-label">LOC Type</div>
          ${this._radioGroup('bk-loctype', ['Unsecured','Secured'], d.locType)}
        </div>
        ${this._fld('bk-secured',   'Secured By',       d.locSecuredBy, 'text', 'col-span-2 mt-3')}
        ${this._fld('bk-terms',     'LOC Special Terms or Sublimits', d.locSpecial, 'text', 'col-span-2 mt-3')}
        ${this._fld('bk-other',     'Other Banks Used & Purpose',     d.otherBanks, 'text', 'col-span-2 mt-3')}
      `)}

      ${this._sectionCard('Previous Bonding Companies', this._table([
        ['Name', 'name'], ['Reason for Leaving', 'reason']
      ], prevSureties, 'prevSureties'))}

      ${this._sectionCard('Five Largest Contracts (last 3 years)', this._table([
        ['Job # / Name','jobName'], ['Contract Price','contractPrice','money'],
        ['Gross Profit','grossProfit','money'], ['Completion Date','completionDate','date'],
        ['Bonded?','bonded','yn'], ['Contact','contact'], ['Phone','phone']
      ], largestJobs, 'largestJobs'))}

      ${this._sectionCard('Five Major Suppliers', this._table([
        ['Name','name'], ['Phone','phone'], ['Contact','contact']
      ], suppliers, 'suppliers'))}

      ${this._sectionCard('Five Subcontractors (or Contractors if you are a Sub)', this._table([
        ['Name','name'], ['Phone','phone'], ['Contact','contact']
      ], subs, 'subs'))}

      ${this._sectionCard('Key Personnel', this._table([
        ['Name','name'], ['Position','position'], ['Birth Year','birthYear'], ['Years Experience','yearsExp','number']
      ], keyPersonnel, 'keyPersonnel'))}

      ${this._sectionCard('Life Insurance on Officers / Key Personnel', this._table([
        ['Name','name'], ['Beneficiary','beneficiary'], ['Amount','amount','money'], ['Insurance Company','company']
      ], lifeIns, 'lifeIns'))}

      ${this._sectionCard('Business Insurance', `
        <div class="grid grid-cols-2 gap-3">
          ${this._fld('ins-broker','Insurance Broker / Agency', d.insBroker, 'text', 'col-span-2')}
          ${this._fld('ins-agent', "Agent's Name",              d.insAgent)}
          ${this._fld('ins-email', 'Agent Email',               d.insEmail, 'email')}
          ${this._fld('ins-phone', 'Agent Phone',               d.insPhone)}
          ${this._fld('ins-fax',   'Agent Fax',                 d.insFax)}
        </div>
      `)}

      ${this._sectionCard('Subsidiaries & Affiliates', this._table([
        ['Firm Name','name'], ['Ownership %','ownership','number'],
        ['Type of Business','type'], ['Cross/Corp Indemnity','indemnity','yn']
      ], subsidiaries, 'subsidiaries'))}

      ${this._sectionCard('Required Attachments (acknowledge)', this._cqAttachments(d))}

      ${this._sectionCard('Certification & Signature', `
        <p class="text-xs text-ink-300 italic mb-3">By signing, the applicant authorizes the surety to verify the above information from financial institutions, persons, firms, and corporations.</p>
        <div class="grid grid-cols-2 gap-3">
          ${this._fld('sig-firm',    'Firm Name',     d.sigFirm || d.businessName)}
          ${this._fld('sig-name',    'Completed By',  d.sigName || d.contactName)}
          ${this._fld('sig-title',   'Title',         d.sigTitle)}
          ${this._fld('sig-date',    'Date',          d.sigDate || new Date().toISOString().slice(0,10), 'date')}
        </div>
        <div class="mt-3"><label class="flex items-center gap-2 text-sm">
          <input id="sig-confirm" type="checkbox" class="chk" ${d.sigConfirm?'checked':''}>
          I certify the information above is true, complete, and accurate to the best of my knowledge.
        </label></div>
        ${this._fld('sig-remarks', 'Additional Remarks', d.remarks, 'text', 'col-span-2 mt-3')}
      `)}

      <div class="flex items-center justify-between mt-6 px-2">
        <button class="btn-secondary" onclick="Views.intake._saveDraft('${form.id || ''}', 'cq')">Save Draft</button>
        <button class="btn-primary" onclick="Views.intake._submit('${form.id || ''}', '${tok}', 'cq')">Submit Questionnaire</button>
      </div>
    `;
  },

  _ownerRow(i, o) {
    return `
      <div class="border border-cream-200 rounded-lg p-3" data-owner="${i}">
        <div class="text-xs font-semibold text-ink-400 mb-2">Owner / Officer #${i+1}</div>
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-3"><div class="field-label">Legal Name</div><input class="field-input" data-k="name" value="${U.esc(o.name||'')}"></div>
          <div class="col-span-2"><div class="field-label">DOB</div><input class="field-input" type="date" data-k="dob" value="${U.esc(o.dob||'')}"></div>
          <div class="col-span-2"><div class="field-label">SSN</div><input class="field-input font-mono" data-k="ssn" value="${U.esc(o.ssn||'')}" placeholder="xxx-xx-xxxx"></div>
          <div class="col-span-3"><div class="field-label">Legal Name of Spouse</div><input class="field-input" data-k="spouseName" value="${U.esc(o.spouseName||'')}"></div>
          <div class="col-span-2"><div class="field-label">Spouse SSN</div><input class="field-input font-mono" data-k="spouseSsn" value="${U.esc(o.spouseSsn||'')}"></div>
          <div class="col-span-3"><div class="field-label">Position</div><input class="field-input" data-k="position" value="${U.esc(o.position||'')}"></div>
          <div class="col-span-2"><div class="field-label">% Owned</div><input class="field-input" type="number" data-k="pctOwned" value="${o.pctOwned||''}"></div>
          <div class="col-span-7"><div class="field-label">Home Address</div><input class="field-input" data-k="homeAddress" value="${U.esc(o.homeAddress||'')}"></div>
        </div>
      </div>`;
  },

  _cqAttachments(d) {
    const items = [
      ['attFinancials', 'Last three fiscal financial statements w/ WIP & completed contract schedules'],
      ['attInterim', 'Current interim financial statement and WIP (if FYE statement is over six months old)'],
      ['attPFS', 'Current Personal Financial Statement for all indemnitors'],
      ['attLOC', 'Bank Line of Credit Agreement'],
      ['attBizPlan', 'Business Plan'],
      ['attBuySell', 'Buy/Sell Agreement'],
      ['attSubcontract', 'Copy of Subcontract Agreement (standard form)'],
      ['attCOI', 'Certificate of Insurance'],
      ['attResumes', 'Resumes of Owners / Key Employees'],
      ['attBrochure', 'Brochure and/or Letters of Recommendation'],
    ];
    return `
      <div class="grid grid-cols-2 gap-1">
        ${items.map(([k,label]) => `
          <label class="flex items-center gap-2 p-1.5 rounded hover:bg-cream-50 text-sm">
            <input id="${k}" type="checkbox" class="chk" ${d[k]?'checked':''}>
            ${U.esc(label)}
          </label>`).join('')}
      </div>
      ${this._fld('attOther', 'Other (describe)', d.attOther, 'text', 'col-span-2 mt-3')}
    `;
  },

  // ===========================================================
  // PERSONAL FINANCIAL STATEMENT
  // ===========================================================
  _formPFS(form) {
    const d = form.data || {};
    const A = d.assets || {};
    const L = d.liabilities || {};
    const banks = (d.schedules && d.schedules.banks) || Array.from({length:3},()=>({}));
    const stocks = (d.schedules && d.schedules.stocks) || Array.from({length:3},()=>({}));
    const realEstate = (d.schedules && d.schedules.realEstate) || Array.from({length:2},()=>({}));
    const refs = d.references && d.references.length ? d.references : Array.from({length:3},()=>({}));
    const C = d.contingent || {};
    const tok = form.token || 'demo';

    return `
      <div class="card p-6 mb-6">
        <div class="text-xs uppercase tracking-[0.18em] text-ink-300 mb-1 font-display">Online Intake</div>
        <h1 class="text-2xl font-display font-semibold mb-1">Personal Financial Statement</h1>
        <p class="text-sm text-ink-400">Please fill this out as completely as possible. Totals calculate automatically as you type.</p>
        <div class="mt-3 max-w-xs">
          ${this._fld('pfs-asOf', 'All Information Current as of', d.asOf || new Date().toISOString().slice(0,10), 'date')}
        </div>
      </div>

      ${this._sectionCard('Personal Information', `
        <div class="grid grid-cols-3 gap-3">
          ${this._fld('pfs-name',   'Full Legal Name',  d.fullName, 'text', 'col-span-3')}
          ${this._fld('pfs-dob',    'Date of Birth',    d.dob, 'date')}
          ${this._fld('pfs-ssn',    'SSN / Tax ID',     d.ssn)}
          <div></div>
          ${this._fld('pfs-spouse', 'Spouse / Co-Indemnitor Name', d.spouseName, 'text', 'col-span-3')}
          ${this._fld('pfs-sdob',   'Spouse DOB',       d.spouseDob, 'date')}
          ${this._fld('pfs-sssn',   'Spouse SSN',       d.spouseSsn)}
          <div></div>
          ${this._fld('pfs-biz',    'Business Name',    d.businessName, 'text', 'col-span-2')}
          ${this._fld('pfs-phone',  'Phone',            d.phone)}
          ${this._fld('pfs-email',  'Email',            d.email, 'email', 'col-span-2')}
          ${this._fld('pfs-street', 'Street Address',   d.street, 'text', 'col-span-3')}
          ${this._fld('pfs-csz',    'City, State, Zip', d.cityStateZip, 'text', 'col-span-3')}
        </div>
      `)}

      ${this._sectionCard('General Information', `
        <div class="grid grid-cols-2 gap-3">
          <div><div class="field-label">Do you have a current will?</div>${this._yesNo('pfs-will', d.hasWill)}</div>
          <div><div class="field-label">Ever declared bankruptcy?</div>${this._yesNo('pfs-bk', d.bankruptcy)}</div>
          ${this._fld('pfs-acct', 'Accountant Name', d.accountantName)}
          ${this._fld('pfs-acct-phone', 'Accountant Phone', d.accountantPhone)}
          ${this._fld('pfs-atty', 'Attorney Name', d.attorneyName)}
          ${this._fld('pfs-atty-phone', 'Attorney Phone', d.attorneyPhone)}
        </div>
      `)}

      ${this._sectionCard('Statement of Financial Condition', `
        <div class="grid grid-cols-2 gap-6">
          <div>
            <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Assets</div>
            ${[
              ['pfs-cashPrimary', 'Cash in Primary Bank',         A.cashPrimary],
              ['pfs-cashOther',   'Cash & CDs in Other Banks',    A.cashOther],
              ['pfs-stocks',      'Stocks, Bonds & Securities',   A.stocks],
              ['pfs-receivables', 'Accounts / Notes Receivable',  A.receivables],
              ['pfs-realEstate',  'Real Estate Owned',            A.realEstate],
              ['pfs-cashSV',      'Cash Surrender Value',         A.surrenderValue],
              ['pfs-bizVentures', 'Business Ventures',            A.businessVentures],
              ['pfs-personalProp','Personal Property',            A.personalProperty],
              ['pfs-autos',       'Autos, RVs & Boats',           A.autos],
              ['pfs-otherAssets', 'Other Assets',                 A.other],
            ].map(([id,label,val]) => this._moneyLine(id, label, val, 'pfs-totalAssets')).join('')}
            <div class="flex items-center justify-between border-t border-ink-300 pt-2 mt-2 font-semibold">
              <span>Total Assets</span><span id="pfs-totalAssets">$0</span>
            </div>
          </div>
          <div>
            <div class="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Liabilities</div>
            ${[
              ['pfs-unsecured',   'Unsecured Debt / Notes Payable', L.unsecured],
              ['pfs-current',     'Current Bills Due',              L.currentBills],
              ['pfs-payable',     'Accounts Payable',               L.payable],
              ['pfs-mortgages',   'Real Estate Mortgages',          L.mortgages],
              ['pfs-secured',     'Secured Debt (Non-Real Estate)', L.secured],
              ['pfs-taxes',       'Taxes Payable',                  L.taxes],
              ['pfs-otherLiab',   'Other Liabilities',              L.other],
            ].map(([id,label,val]) => this._moneyLine(id, label, val, 'pfs-totalLiab')).join('')}
            <div class="flex items-center justify-between border-t border-ink-300 pt-2 mt-2 font-semibold">
              <span>Total Liabilities</span><span id="pfs-totalLiab">$0</span>
            </div>
          </div>
        </div>
        <div class="mt-4 p-3 bg-cream-100 rounded-lg flex items-center justify-between">
          <span class="font-display text-base">Total Net Worth</span>
          <span id="pfs-networth" class="font-display text-lg font-semibold">$0</span>
        </div>
      `)}

      ${this._sectionCard('Schedule A — Bank Accounts', this._table([
        ['Bank Name','name'], ['Location','location'], ['Account Type','type'], ['Amount on Deposit','amount','money']
      ], banks, 'banks'))}

      ${this._sectionCard('Schedule B — Stocks, Bonds & Investments', this._table([
        ['Security','name'], ['Shares','shares','number'], ['Par Value','par'], ['Market Value','market','money'],
        ['Dividends (past 2 yrs)','dividends','money'], ['If Pledged, To Whom','pledged']
      ], stocks, 'stocks'))}

      ${this._sectionCard('Schedule C — Real Estate', this._table([
        ['Property Address','address'], ['Title Holder','titleHolder'],
        ['Monthly Rent','monthlyRent','money'], ['Market Value','marketValue','money'], ['Mortgage Balance','mortgageBalance','money']
      ], realEstate, 'realEstate'))}

      ${this._sectionCard('Contingent Liabilities & Special Circumstances', `
        <div class="space-y-2">
          ${[
            ['pfs-cl-cont','Contingent Liabilities',         C.contingentLiabilities, C.contingentNote],
            ['pfs-cl-law', 'Pending Lawsuits',               C.lawsuits,              C.lawsuitsNote],
            ['pfs-cl-tax', 'Contested Income Tax Liens',     C.taxLiens,              C.taxLiensNote],
            ['pfs-cl-oth', 'Other Special Circumstances',    C.otherAmount,           C.other],
          ].map(([id,label,amt,note]) => `
            <div class="grid grid-cols-12 gap-2 items-end">
              <div class="col-span-3"><div class="field-label">${U.esc(label)}</div></div>
              <div class="col-span-2"><input id="${id}-amt" type="number" class="field-input" value="${amt!=null?amt:''}" placeholder="$"></div>
              <div class="col-span-7"><input id="${id}-note" class="field-input" value="${U.esc(note||'')}" placeholder="If yes, explain"></div>
            </div>
          `).join('')}
        </div>
      `)}

      ${this._sectionCard('References (include at least one bank reference)', this._table([
        ['Reference Name','name'], ['Relationship','relationship'], ['Phone','phone'], ['Address','address']
      ], refs, 'refs'))}

      ${this._sectionCard('Certification', `
        <p class="text-xs text-ink-300 italic mb-3">The undersigned certifies the above is true, complete, and accurate to the best of their knowledge, and authorizes verification.</p>
        <div class="grid grid-cols-2 gap-3">
          ${this._fld('pfs-sig-date', 'Signature Date', d.signedDate || new Date().toISOString().slice(0,10), 'date')}
        </div>
        <div class="mt-3"><label class="flex items-center gap-2 text-sm">
          <input id="pfs-sig" type="checkbox" class="chk" ${d.signed?'checked':''}>
          I certify the information above is true and complete to the best of my knowledge.
        </label></div>
      `)}

      <div class="flex items-center justify-between mt-6 px-2">
        <button class="btn-secondary" onclick="Views.intake._saveDraft('${form.id || ''}', 'pfs')">Save Draft</button>
        <button class="btn-primary" onclick="Views.intake._submit('${form.id || ''}', '${tok}', 'pfs')">Submit PFS</button>
      </div>
    `;
  },

  // ===========================================================
  // WIP SCHEDULE
  // ===========================================================
  _formWIP(form) {
    const d = form.data || {};
    const ip = d.inProgress && d.inProgress.length ? d.inProgress : Array.from({length:5},()=>({}));
    const cp = d.completed  && d.completed.length  ? d.completed  : Array.from({length:3},()=>({}));
    const tok = form.token || 'demo';

    return `
      <div class="card p-6 mb-6">
        <div class="text-xs uppercase tracking-[0.18em] text-ink-300 mb-1 font-display">Online Intake</div>
        <h1 class="text-2xl font-display font-semibold mb-1">Work-in-Progress Schedule</h1>
        <p class="text-sm text-ink-400">Enter your active jobs and any recently completed jobs since your last fiscal year-end.</p>
        <div class="grid grid-cols-3 gap-3 mt-3">
          ${this._fld('wip-contractor', 'Contractor / Firm Name', d.contractorName)}
          ${this._fld('wip-date',       'Report Date',            d.reportDate || new Date().toISOString().slice(0,10), 'date')}
          ${this._fld('wip-fye',        'Fiscal Year End',        d.fiscalYearEnd, 'date')}
        </div>
      </div>

      ${this._sectionCard('Contracts in Progress', this._wipTable(ip, 'inProgress'))}
      ${this._sectionCard('Completed Contracts (this fiscal year)', this._wipCompletedTable(cp, 'completed'))}

      <div class="flex items-center justify-between mt-6 px-2">
        <button class="btn-secondary" onclick="Views.intake._saveDraft('${form.id || ''}', 'wip')">Save Draft</button>
        <button class="btn-primary" onclick="Views.intake._submit('${form.id || ''}', '${tok}', 'wip')">Submit WIP Schedule</button>
      </div>
    `;
  },

  _wipTable(rows, key) {
    const headers = [
      ['Job Name / Description', 'jobName'],
      ['Contract ($)',            'contract',         'money'],
      ['Approved C.O. ($)',       'changeOrders',     'money'],
      ['Revised Contract ($)',    'revisedContract',  'money'],
      ['Est. Total Cost ($)',     'estTotalCost',     'money'],
      ['Costs to Date ($)',       'costsToDate',      'money'],
      ['% Complete',              'percentComplete',  'number'],
      ['Earned Revenue ($)',      'earnedRevenue',    'money'],
      ['Billings to Date ($)',    'billedToDate',     'money'],
      ['Under Bill ($)',          'underBilling',     'money'],
      ['Over Bill ($)',           'overBilling',      'money'],
      ['Est. Gross Profit ($)',   'estGrossProfit',   'money'],
      ['Gross Profit %',          'gpPercent',        'number'],
    ];
    return this._table(headers, rows, key, { dense: true });
  },

  _wipCompletedTable(rows, key) {
    const headers = [
      ['Job Name', 'jobName'],
      ['Final Contract ($)', 'finalContract', 'money'],
      ['Final Cost ($)',     'finalCost',     'money'],
      ['Gross Profit ($)',   'grossProfit',   'money'],
    ];
    return this._table(headers, rows, key);
  },

  // ===========================================================
  // FORM PRIMITIVES
  // ===========================================================
  _sectionCard(title, inner) {
    return `
      <div class="card mb-4">
        <div class="card-header"><div class="card-title">${U.esc(title)}</div></div>
        <div class="p-4">${inner}</div>
      </div>`;
  },

  _fld(id, label, value, type='text', extraClass='') {
    const t = type === 'money' ? 'number' : type;
    const placeholder = type === 'money' ? 'placeholder="$"' : '';
    return `<div class="${extraClass}"><div class="field-label">${U.esc(label)}</div>
      <input id="${id}" type="${t}" class="field-input" value="${U.esc(value==null?'':String(value))}" ${placeholder}></div>`;
  },

  _moneyLine(id, label, val, totalId) {
    return `
      <div class="flex items-center justify-between py-1">
        <label for="${id}" class="text-sm flex-1">${U.esc(label)}</label>
        <input id="${id}" type="number" class="field-input w-36 text-right" value="${val!=null?val:''}" placeholder="$"
               oninput="(function(){ const e = window.dispatchEvent(new Event('pfs-recalc')); })()">
      </div>`;
  },

  _radioGroup(name, options, current) {
    return `<div class="flex flex-wrap gap-3">
      ${options.map(o => `
        <label class="text-sm flex items-center gap-1 cursor-pointer">
          <input type="radio" name="${name}" value="${U.esc(o)}" ${o===current?'checked':''}>
          ${U.esc(o)}
        </label>`).join('')}
    </div>`;
  },

  _yesNo(name, current) {
    return this._radioGroup(name, ['Yes','No'], current === true ? 'Yes' : current === false ? 'No' : current);
  },

  _table(headers, rows, key, opts={}) {
    return `
      <div class="overflow-x-auto">
        <table class="w-full text-sm" data-rowkey="${key}">
          <thead><tr class="text-xs text-ink-400 uppercase tracking-wider">
            <th class="text-left py-1 px-1">#</th>
            ${headers.map(h => `<th class="text-left py-1 px-1">${U.esc(h[0])}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${rows.map((r, i) => `
              <tr data-row="${i}">
                <td class="px-1 text-ink-300">${i+1}</td>
                ${headers.map(h => {
                  const k = h[1]; const t = h[2] || 'text';
                  const v = r[k];
                  if (t === 'yn') return `<td class="px-1">
                    <select class="field-select" data-k="${k}">
                      <option value=""></option>
                      <option ${v===true||v==='Yes'?'selected':''}>Yes</option>
                      <option ${v===false||v==='No'?'selected':''}>No</option>
                    </select></td>`;
                  if (t === 'date') return `<td class="px-1"><input type="date" class="field-input" data-k="${k}" value="${U.esc(v||'')}"></td>`;
                  if (t === 'number' || t === 'money') return `<td class="px-1"><input type="number" class="field-input ${opts.dense?'text-xs':''}" data-k="${k}" value="${v!=null?v:''}"></td>`;
                  return `<td class="px-1"><input class="field-input ${opts.dense?'text-xs':''}" data-k="${k}" value="${U.esc(v||'')}"></td>`;
                }).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // ===========================================================
  // SUBMIT / SAVE-DRAFT
  // ===========================================================
  _collect(type) {
    const get = (id) => document.getElementById(id);
    const v = (id) => { const e = get(id); return e ? e.value : ''; };
    const n = (id) => { const e = get(id); return e && e.value !== '' ? +e.value : null; };
    const c = (id) => { const e = get(id); return e ? !!e.checked : false; };
    const radio = (name) => { const e = document.querySelector(`input[name="${name}"]:checked`); return e ? e.value : null; };
    const radioYN = (name) => { const r = radio(name); return r === 'Yes' ? true : r === 'No' ? false : null; };

    const collectTable = (key) => {
      const t = document.querySelector(`table[data-rowkey="${key}"]`);
      if (!t) return [];
      return Array.from(t.querySelectorAll('tbody tr')).map(tr => {
        const o = {};
        tr.querySelectorAll('[data-k]').forEach(el => {
          let val = el.value;
          if (el.type === 'number') val = val === '' ? null : +val;
          o[el.dataset.k] = val;
        });
        return o;
      }).filter(r => Object.values(r).some(x => x !== '' && x !== null));
    };

    if (type === 'cq') {
      // collect owners
      const owners = Array.from(document.querySelectorAll('[data-owner]')).map(el => {
        const o = {};
        el.querySelectorAll('[data-k]').forEach(inp => o[inp.dataset.k] = inp.value);
        return o;
      }).filter(o => Object.values(o).some(x => x));

      return {
        businessName: v('biz-name'), contactName: v('biz-contact'), contactEmail: v('biz-email'),
        address: v('biz-addr'), phone: v('biz-phone'), website: v('biz-web'),
        taxId: v('biz-tax'), stateYear: v('biz-stateyr'),
        businessType: radio('biz-type'),
        trades: v('biz-trades'), areas: v('biz-areas'),
        owners,
        indemnifyAll: radioYN('ind-indemnify'),
        buySell: radioYN('ind-buysell'),
        buySellFunded: radioYN('ind-bsfunded'),
        indemnifyExplain: v('ind-explain'),
        bankruptcy: radioYN('bd-bk'),
        litigation: radioYN('bd-lit'),
        pctGov: n('bd-gov'), pctPrivate: n('bd-prv'), pctOther: n('bd-oth'),
        ownTrades: v('bd-ownTrades'),
        pctSubcontracted: n('bd-pctSub'),
        subTrades: v('bd-subTrades'),
        subBondingPolicy: v('bd-subBonding'),
        preferredJobSize: v('bd-jobSize'),
        jobsAtTime: n('bd-jobsAtTime'),
        largestCostBacklog: n('bd-largestCost'),
        largestCostBacklogYear: v('bd-largestYear'),
        largestExpectedNext: n('bd-largestJob'),
        expectedAnnualVolume: n('bd-annual'),
        leaseEquipment: radioYN('bd-lease'),
        leaseType: v('bd-leaseType'),

        cpaFirm: v('fi-cpa'), fye: v('fi-fye'),
        cpaContact: v('fi-cpaContact'), cpaEmail: v('fi-cpaEmail'),
        cpaAddress: v('fi-cpaAddr'), cpaPhone: v('fi-cpaPhone'),
        taxBasis: v('fi-taxBasis'),
        statementLevel: radio('fi-level'),
        statementFrequency: radio('fi-freq'),
        softwareAccounting: v('fi-acct'), softwareEstimating: v('fi-est'), softwareJobCost: v('fi-cost'),
        balanceSheetChanges: v('fi-changes'),

        bankName: v('bk-name'), locLimit: n('bk-loc'),
        bankContact: v('bk-contact'), locExpiration: v('bk-exp'),
        bankAddress: v('bk-addr'), bankPhone: v('bk-phone'),
        locType: radio('bk-loctype'), locSecuredBy: v('bk-secured'),
        locSpecial: v('bk-terms'), otherBanks: v('bk-other'),

        previousSureties: collectTable('prevSureties'),
        largestJobs:      collectTable('largestJobs'),
        suppliers:        collectTable('suppliers'),
        subs:             collectTable('subs'),
        keyPersonnel:     collectTable('keyPersonnel'),
        lifeIns:          collectTable('lifeIns'),
        subsidiaries:     collectTable('subsidiaries'),

        insBroker: v('ins-broker'), insAgent: v('ins-agent'),
        insEmail: v('ins-email'), insPhone: v('ins-phone'), insFax: v('ins-fax'),

        attFinancials: c('attFinancials'), attInterim: c('attInterim'), attPFS: c('attPFS'),
        attLOC: c('attLOC'), attBizPlan: c('attBizPlan'), attBuySell: c('attBuySell'),
        attSubcontract: c('attSubcontract'), attCOI: c('attCOI'),
        attResumes: c('attResumes'), attBrochure: c('attBrochure'),
        attOther: v('attOther'),

        sigFirm: v('sig-firm'), sigName: v('sig-name'), sigTitle: v('sig-title'),
        sigDate: v('sig-date'), sigConfirm: c('sig-confirm'), remarks: v('sig-remarks'),
      };
    }

    if (type === 'pfs') {
      return {
        asOf: v('pfs-asOf'),
        fullName: v('pfs-name'), dob: v('pfs-dob'), ssn: v('pfs-ssn'),
        spouseName: v('pfs-spouse'), spouseDob: v('pfs-sdob'), spouseSsn: v('pfs-sssn'),
        businessName: v('pfs-biz'), phone: v('pfs-phone'), email: v('pfs-email'),
        street: v('pfs-street'), cityStateZip: v('pfs-csz'),
        hasWill: radioYN('pfs-will'), bankruptcy: radioYN('pfs-bk'),
        accountantName: v('pfs-acct'), accountantPhone: v('pfs-acct-phone'),
        attorneyName: v('pfs-atty'), attorneyPhone: v('pfs-atty-phone'),
        assets: {
          cashPrimary: n('pfs-cashPrimary'), cashOther: n('pfs-cashOther'),
          stocks: n('pfs-stocks'), receivables: n('pfs-receivables'),
          realEstate: n('pfs-realEstate'), surrenderValue: n('pfs-cashSV'),
          businessVentures: n('pfs-bizVentures'), personalProperty: n('pfs-personalProp'),
          autos: n('pfs-autos'), other: n('pfs-otherAssets'),
        },
        liabilities: {
          unsecured: n('pfs-unsecured'), currentBills: n('pfs-current'),
          payable: n('pfs-payable'), mortgages: n('pfs-mortgages'),
          secured: n('pfs-secured'), taxes: n('pfs-taxes'), other: n('pfs-otherLiab'),
        },
        schedules: {
          banks: collectTable('banks'), stocks: collectTable('stocks'), realEstate: collectTable('realEstate'),
        },
        contingent: {
          contingentLiabilities: n('pfs-cl-cont-amt'), contingentNote: v('pfs-cl-cont-note'),
          lawsuits: n('pfs-cl-law-amt'), lawsuitsNote: v('pfs-cl-law-note'),
          taxLiens: n('pfs-cl-tax-amt'), taxLiensNote: v('pfs-cl-tax-note'),
          otherAmount: n('pfs-cl-oth-amt'), other: v('pfs-cl-oth-note'),
        },
        references: collectTable('refs'),
        signed: c('pfs-sig'),
        signedDate: v('pfs-sig-date'),
      };
    }

    if (type === 'wip') {
      return {
        contractorName: v('wip-contractor'),
        reportDate: v('wip-date'),
        fiscalYearEnd: v('wip-fye'),
        inProgress: collectTable('inProgress'),
        completed: collectTable('completed'),
      };
    }
    return {};
  },

  _saveDraft(formId, type) {
    if (!formId) { U.toast('No intake record bound to this draft. Ask your producer for a link.', 'warn'); return; }
    const f = DB.findIntake(formId);
    if (!f) return;
    f.data = this._collect(type);
    f.status = 'in_progress';
    DB.save();
    U.toast('Draft saved');
  },

  _submit(formId, token, type) {
    const data = this._collect(type);
    let f = formId ? DB.findIntake(formId) : (token ? DB.intakeByToken(token) : null);
    if (!f) {
      // Anonymous demo path — create an ad-hoc record
      f = {
        id: U.uid('IF'), type, token: token || 'anon-' + U.uid('TK'),
        leadId: null, accountId: null,
        contactName: data.contactName || data.fullName || data.contractorName || '',
        contactEmail: data.contactEmail || data.email || '',
        sentDate: null, status: 'submitted', data,
      };
      DB.intakes().push(f);
    } else {
      f.data = data;
      f.status = 'submitted';
    }
    f.submittedDate = new Date().toISOString().slice(0,10);
    DB.save();

    // Auto-import
    Intake.importNow(f.id, { silent: true });
    this._renderThankYou(f);
  },
};

// ===========================================================
// AGENCY-SIDE HELPERS (Intake namespace)
// ===========================================================
window.Intake = (() => {

  function url(form) {
    const base = location.origin + location.pathname;
    return `${base}#/intake/${form.type}/${encodeURIComponent(form.token)}`;
  }

  function typeLabel(t) {
    return { cq: 'Contractor Questionnaire', pfs: 'Personal Financial Statement', wip: 'WIP Schedule' }[t] || t;
  }

  function send(type, ctx = {}) {
    const form = {
      id: U.uid('IF'),
      type,
      token: U.uid('TK'),
      leadId: ctx.leadId || null,
      accountId: ctx.accountId || null,
      contactName: ctx.contactName || '',
      contactEmail: ctx.contactEmail || '',
      sentDate: new Date().toISOString().slice(0,10),
      submittedDate: null, importedDate: null,
      status: 'sent',
      data: {},
    };
    DB.intakes().push(form);
    DB.save();
    _showLink(form, ctx);
    return form;
  }

  function _showLink(form, ctx) {
    const link = url(form);
    const body = `
      <p class="text-sm text-ink-400 mb-3">Send this secure link to <b>${U.esc(form.contactName || 'the client')}</b>. They can fill out the form online; data will auto-populate the account when submitted.</p>
      <div class="font-mono text-xs bg-cream-100 border border-cream-200 rounded p-2 break-all mb-3">${U.esc(link)}</div>
      <div class="flex items-center gap-2 flex-wrap">
        <button class="btn-secondary" onclick="navigator.clipboard.writeText('${link}').then(()=>U.toast('Link copied'))">Copy Link</button>
        <button class="btn-secondary" onclick="window.open('${link}', '_blank')">Open in New Tab</button>
        <button class="btn-primary" onclick="U.closeModals(); Compose.open({ ${ctx.leadId?`leadId: '${ctx.leadId}', `:''}${ctx.accountId?`accountId: '${ctx.accountId}', `:''}templateId: '${ {cq:'T-intake-cq', pfs:'T-intake-pfs', wip:'T-intake-wip'}[form.type] }', body: 'A pre-filled email template will be loaded — the link is below:\\n\\n${link}\\n\\nThanks,' })">Email this Link</button>
      </div>
      <div class="text-xs text-ink-300 italic mt-3">In a real deployment, this link would also be accessible from outside your network. For the demo, anyone with access to this browser session can open it.</div>
    `;
    const footer = `<button class="btn-primary" data-close>Done</button>`;
    const m = U.modal({ title: `${typeLabel(form.type)} — Intake Link`, body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  }

  // -------- Import submitted form data into the data model --------
  function importNow(formId, opts = {}) {
    const f = DB.findIntake(formId);
    if (!f) return;
    if (f.type === 'cq')  _importCQ(f);
    if (f.type === 'pfs') _importPFS(f);
    if (f.type === 'wip') _importWIP(f);
    f.status = 'imported';
    f.importedDate = new Date().toISOString().slice(0,10);
    DB.save();
    if (!opts.silent) U.toast(`Imported ${typeLabel(f.type)} into account data`);
  }

  function _ensureAccountFromCQ(f) {
    if (f.accountId) return DB.findAccount(f.accountId);
    // Try to find by lead's converted account
    if (f.leadId) {
      const lead = DB.findLead(f.leadId);
      if (lead?.convertedAccountId) return DB.findAccount(lead.convertedAccountId);
    }
    const d = f.data || {};
    // Match by business name + EIN
    let acct = DB.accounts().find(a =>
      (a.taxId && d.taxId && a.taxId === d.taxId) ||
      (a.name && d.businessName && a.name.toLowerCase() === d.businessName.toLowerCase())
    );
    if (acct) return acct;
    // Create new account
    const id = U.uid('A');
    acct = {
      id, name: d.businessName || 'New Account', dba: '', type: 'Contractor',
      contact: d.contactName || '', email: d.contactEmail || '', phone: d.phone || '',
      address: d.address || '', city: '', state: '', zip: '',
      taxId: d.taxId || '', credit: 0,
      notes: `Auto-created from CQ intake on ${new Date().toISOString().slice(0,10)}.`,
      company: {}, contacts: [], indemnitors: [],
      renewals: { financialsLast: null, financialsInterval: 365, wipLast: null, wipInterval: 90 },
    };
    DB.accounts().push(acct);
    if (window.Files && Files.provisionAccount) Files.provisionAccount(acct, { silent: true });
    return acct;
  }

  function _importCQ(f) {
    const d = f.data || {};
    const a = _ensureAccountFromCQ(f);
    if (!a) return;
    f.accountId = a.id;
    // If linked to a lead, mark it converted
    if (f.leadId) {
      const lead = DB.findLead(f.leadId);
      if (lead && !lead.convertedAccountId) {
        lead.convertedAccountId = a.id;
        lead.activity = lead.activity || [];
        lead.activity.push({ id: U.uid('LA'), date: new Date().toISOString(), author: 'Intake System', type: 'note', text: `CQ submitted online — account ${a.id} created/matched.` });
      }
    }

    // Map CQ fields to account.company
    a.company = a.company || {};
    Object.assign(a.company, {
      legalName: d.businessName || a.company.legalName,
      entityType: d.businessType || a.company.entityType,
      stateOfFormation: (d.stateYear || '').split(/\s|,/)[0] || a.company.stateOfFormation,
      founded: (d.stateYear || '').match(/\d{4}/)?.[0] || a.company.founded,
      naics: a.company.naics || '',
      website: d.website || a.company.website,
      grossRevenue: d.expectedAnnualVolume || a.company.grossRevenue,
      employees: a.company.employees || 0,
      singleLimit: a.company.singleLimit || 0,
      aggregateLimit: a.company.aggregateLimit || 0,
    });

    // Top-level account fields
    a.dba   = a.dba   || d.dba   || '';
    a.taxId = a.taxId || d.taxId || '';
    a.phone = a.phone || d.phone || '';
    a.email = a.email || d.contactEmail || '';
    a.contact = a.contact || d.contactName || '';
    if (d.address && !a.address) a.address = d.address;

    // Primary contact
    a.contacts = a.contacts || [];
    if (d.contactName && !a.contacts.some(c => c.name === d.contactName)) {
      a.contacts.push({
        id: U.uid('C'), name: d.contactName, title: '',
        email: d.contactEmail || '', phone: d.phone || '',
        primary: a.contacts.length === 0,
      });
    }

    // Owners → indemnitors
    (d.owners || []).forEach(o => {
      if (!o.name) return;
      if (a.indemnitors?.some(x => x.name === o.name)) return;
      a.indemnitors = a.indemnitors || [];
      a.indemnitors.push({
        id: U.uid('I'),
        name: o.name, type: 'Personal',
        ssnEin: o.ssn || '',
        spouse: o.spouseName || '',
        pfsDate: null,
        netWorth: 0, liquid: 0,
        ownership: o.pctOwned || 0,
        position: o.position || '',
      });
    });

    // Stash the raw CQ on the account for the underwriting tab
    a.cq = d;
    a.notes = (a.notes ? a.notes + '\n\n' : '') + `[CQ submitted ${new Date().toISOString().slice(0,10)}]`;
  }

  function _importPFS(f) {
    const d = f.data || {};
    // Determine target account
    let a = f.accountId ? DB.findAccount(f.accountId) : null;
    if (!a && f.leadId) {
      const lead = DB.findLead(f.leadId);
      if (lead?.convertedAccountId) a = DB.findAccount(lead.convertedAccountId);
    }
    if (!a) {
      // Create a minimal account from the PFS business name if any
      const id = U.uid('A');
      a = {
        id, name: d.businessName || (d.fullName + ' (Personal)') || 'New Account', dba: '', type: 'Contractor',
        contact: d.fullName || '', email: d.email || '', phone: d.phone || '',
        address: d.street || '', city: '', state: '', zip: '',
        taxId: '', credit: 0,
        notes: `Auto-created from PFS intake on ${new Date().toISOString().slice(0,10)}.`,
        company: {}, contacts: [], indemnitors: [],
        renewals: { financialsLast: null, financialsInterval: 365, wipLast: null, wipInterval: 90 },
      };
      DB.accounts().push(a);
      if (window.Files && Files.provisionAccount) Files.provisionAccount(a, { silent: true });
    }
    f.accountId = a.id;

    // Compute net worth + liquid
    const A = d.assets || {}, L = d.liabilities || {};
    const totalAssets = Object.values(A).reduce((s,x) => s + (+x||0), 0);
    const totalLiab   = Object.values(L).reduce((s,x) => s + (+x||0), 0);
    const liquid      = (+A.cashPrimary || 0) + (+A.cashOther || 0) + (+A.stocks || 0);

    a.indemnitors = a.indemnitors || [];
    let ind = a.indemnitors.find(i => i.name && d.fullName && i.name.toLowerCase() === d.fullName.toLowerCase());
    if (!ind) {
      ind = { id: U.uid('I'), name: d.fullName || 'Indemnitor', type: 'Personal' };
      a.indemnitors.push(ind);
    }
    ind.ssnEin   = d.ssn || ind.ssnEin || '';
    ind.spouse   = d.spouseName || ind.spouse || '';
    ind.pfsDate  = d.asOf || new Date().toISOString().slice(0,10);
    ind.netWorth = totalAssets - totalLiab;
    ind.liquid   = liquid;
    ind.pfs      = d; // stash full schedule

    // Bump account renewal timer for financials
    a.renewals = a.renewals || {};
    a.renewals.financialsLast = d.asOf || a.renewals.financialsLast;
    if (!a.renewals.financialsInterval) a.renewals.financialsInterval = 365;
  }

  function _importWIP(f) {
    const d = f.data || {};
    let a = f.accountId ? DB.findAccount(f.accountId) : null;
    if (!a) {
      a = DB.accounts().find(x => (d.contractorName || '').toLowerCase() === (x.name || '').toLowerCase());
    }
    if (!a) {
      // Create new
      const id = U.uid('A');
      a = {
        id, name: d.contractorName || 'New Account', dba: '', type: 'Contractor',
        contact: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
        taxId: '', credit: 0, notes: `Auto-created from WIP intake on ${new Date().toISOString().slice(0,10)}.`,
        company: {}, contacts: [], indemnitors: [],
        renewals: { financialsLast: null, financialsInterval: 365, wipLast: null, wipInterval: 90 },
      };
      DB.accounts().push(a);
      if (window.Files && Files.provisionAccount) Files.provisionAccount(a, { silent: true });
    }
    f.accountId = a.id;

    // Apply WIP to matching bonds by project / job name (fuzzy)
    const bonds = DB.bonds().filter(b => b.accountId === a.id);
    (d.inProgress || []).forEach(job => {
      if (!job.jobName) return;
      const match = bonds.find(b => (b.project || '').toLowerCase().includes(job.jobName.toLowerCase()) || (job.jobName.toLowerCase().includes((b.project || '').toLowerCase()) && (b.project || '').length > 5));
      if (match) {
        match.wip = match.wip || { history: [] };
        match.wip.contractAmount    = job.revisedContract || job.contract || match.wip.contractAmount;
        match.wip.percentComplete   = job.percentComplete != null ? job.percentComplete : match.wip.percentComplete;
        match.wip.costToDate        = job.costsToDate    || match.wip.costToDate;
        match.wip.estCostToComplete = (job.estTotalCost && job.costsToDate) ? Math.max(0, job.estTotalCost - job.costsToDate) : match.wip.estCostToComplete;
        match.wip.billedToDate      = job.billedToDate   || match.wip.billedToDate;
        match.wip.asOfDate          = d.reportDate || new Date().toISOString().slice(0,10);
        match.wip.history = match.wip.history || [];
        match.wip.history.push({
          date: d.reportDate || new Date().toISOString().slice(0,10),
          percent: job.percentComplete,
          costToDate: job.costsToDate,
          billedToDate: job.billedToDate,
          note: 'Imported from online WIP intake.',
        });
      }
    });

    // Stash the raw WIP on the account
    a.wipSnapshot = d;
    a.renewals = a.renewals || {};
    a.renewals.wipLast = d.reportDate || a.renewals.wipLast;
    if (!a.renewals.wipInterval) a.renewals.wipInterval = 90;
  }

  // -------- Agency-side panel for lead/account modals --------
  function panel(entityKind, entity) {
    const all = DB.intakes();
    const id = entity?.id;
    const linked = all.filter(f =>
      (entityKind === 'lead' && f.leadId === id) ||
      (entityKind === 'account' && (f.accountId === id || (entity.leadIds && entity.leadIds.includes(f.leadId))))
    );

    const ctx = entityKind === 'lead'
      ? { leadId: id, contactName: entity.contactName, contactEmail: entity.email }
      : { accountId: id, contactName: entity.contact || entity.contacts?.[0]?.name || '', contactEmail: entity.email || entity.contacts?.[0]?.email || '' };

    const buttons = ['cq','pfs','wip'].map(t =>
      `<button class="btn-secondary" onclick='Intake.send("${t}", ${JSON.stringify(ctx).replace(/'/g,"&apos;")})'>+ Send ${typeLabel(t)}</button>`
    ).join(' ');

    return `
      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title">Online Intake Forms</div>
          <span class="text-xs text-ink-300">${linked.length} sent · ${linked.filter(f=>f.status==='submitted').length} pending import · ${linked.filter(f=>f.status==='imported').length} imported</span>
        </div>
        <div class="p-3">
          <div class="flex flex-wrap items-center gap-2 mb-3">
            ${buttons}
          </div>
          ${linked.length ? `
            <table class="tbl">
              <thead><tr><th>Form</th><th>To</th><th>Status</th><th>Sent</th><th>Submitted</th><th></th></tr></thead>
              <tbody>
                ${linked.map(f => `
                  <tr>
                    <td>${U.esc(typeLabel(f.type))}</td>
                    <td>${U.esc(f.contactName||'—')}<br/><span class="text-xs text-ink-300">${U.esc(f.contactEmail||'')}</span></td>
                    <td>${_statusBadge(f.status)}</td>
                    <td>${U.date(f.sentDate)}</td>
                    <td>${U.date(f.submittedDate)}</td>
                    <td class="text-right whitespace-nowrap">
                      <button class="btn-ghost" onclick="Intake._showLinkById('${f.id}')">Copy Link</button>
                      ${f.status==='submitted' ? `<button class="btn-ghost text-emerald-700" onclick="Intake.importNow('${f.id}'); Views.templates._reopenEntity('${entityKind}','${id}')">Import</button>`:''}
                      <button class="btn-ghost" onclick="window.open(Intake.url(DB.findIntake('${f.id}')), '_blank')">Open Form</button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          ` : '<div class="text-sm text-ink-300">No intake forms sent yet. Click a button above to send one.</div>'}
        </div>
      </div>`;
  }

  function _statusBadge(s) {
    const m = {
      sent:        ['badge-blue',   'Sent'],
      in_progress: ['badge-amber',  'In Progress'],
      submitted:   ['badge-violet', 'Submitted'],
      imported:    ['badge-green',  'Imported'],
    }[s] || ['badge-slate', s];
    return `<span class="badge ${m[0]}">${m[1]}</span>`;
  }

  function _showLinkById(id) {
    const f = DB.findIntake(id);
    if (!f) return;
    _showLink(f, { leadId: f.leadId, accountId: f.accountId, contactName: f.contactName, contactEmail: f.contactEmail });
  }

  return { url, send, importNow, panel, _showLinkById, typeLabel };
})();
