// ---------- Sample / seed data, persistence layer ----------
window.DB = (() => {
  const KEY = 'bondvault.db.v23';

  const sampleData = () => ({
    accounts: [
      {
        id: 'A-1001', name: 'Northridge Builders LLC', dba: 'Northridge', type: 'Contractor',
        contact: 'Janet Pierce', email: 'jpierce@northridgebuilders.com', phone: '(503) 555-0142',
        address: '742 NE Broadway', city: 'Portland', state: 'OR', zip: '97232',
        taxId: '93-1245678', credit: 745,
        company: {
          legalName: 'Northridge Builders LLC', entityType: 'LLC', stateOfFormation: 'OR', founded: '2012',
          naics: '236220 — Commercial Building Construction', website: 'https://northridgebuilders.example',
          grossRevenue: 18500000, employees: 42,
          singleLimit: 5000000, aggregateLimit: 15000000,
        },
        contacts: [
          { id: 'C-1001a', name: 'Janet Pierce', title: 'President', email: 'jpierce@northridgebuilders.com', phone: '(503) 555-0142', primary: true },
          { id: 'C-1001b', name: 'Tom Reilly',   title: 'CFO',       email: 'treilly@northridgebuilders.com', phone: '(503) 555-0143', primary: false },
          { id: 'C-1001c', name: 'Maria Vega',   title: 'Estimator', email: 'mvega@northridgebuilders.com',   phone: '(503) 555-0144', primary: false },
        ],
        indemnitors: [
          { id: 'I-1001a', name: 'Janet Pierce',    type: 'Personal',  ssnEin: '***-**-1234', spouse: 'David Pierce', netWorth: 4200000, liquid: 850000, pfsDate: '2025-11-15' },
          { id: 'I-1001b', name: 'Northridge Builders LLC', type: 'Corporate', ssnEin: '93-1245678', netWorth: 6800000, pfsDate: '2025-11-15' },
        ],
        renewals: { financialsLast: '2025-11-15', financialsInterval: 365, wipLast: '2026-04-01', wipInterval: 90 },
        notes: 'Strong GC. Hartford and Liberty Mutual. Average gross profit fade <3% over last 5 years.',
        tasks: [
          { id: 'TK-A1A', text: 'Collect interim Q1 financial statement from Tom (CFO)', dueDate: '2026-05-20', assignee: 'U-1', completed: false, priority: 2, type: 'task', source: '', createdDate: '2026-05-10' },
          { id: 'TK-A1B', text: 'Update aggregate capacity worksheet for Hartford',     dueDate: '2026-05-25', assignee: 'U-1', completed: false, type: 'task', source: '', createdDate: '2026-05-12' },
        ],
      },
      {
        id: 'A-1002', name: 'Cascade Mechanical Co.', dba: 'Cascade MEP', type: 'Contractor',
        contact: 'Mike Trillo', email: 'mike@cascademech.com', phone: '(503) 555-0233',
        address: '210 Industrial Way', city: 'Salem', state: 'OR', zip: '97302',
        taxId: '93-1239922', credit: 712,
        company: {
          legalName: 'Cascade Mechanical Co.', entityType: 'S-Corp', stateOfFormation: 'OR', founded: '2008',
          naics: '238220 — Plumbing, Heating, and Air-Conditioning Contractors', website: 'https://cascademech.example',
          grossRevenue: 9200000, employees: 28,
          singleLimit: 3000000, aggregateLimit: 8000000,
        },
        contacts: [
          { id: 'C-1002a', name: 'Mike Trillo', title: 'Owner', email: 'mike@cascademech.com', phone: '(503) 555-0233', primary: true },
          { id: 'C-1002b', name: 'Lisa Trillo', title: 'CFO',   email: 'lisa@cascademech.com', phone: '(503) 555-0234', primary: false },
        ],
        indemnitors: [
          { id: 'I-1002a', name: 'Mike Trillo', type: 'Personal', ssnEin: '***-**-8821', spouse: 'Lisa Trillo', netWorth: 2900000, liquid: 410000, pfsDate: '2025-09-01' },
          { id: 'I-1002b', name: 'Lisa Trillo', type: 'Personal', ssnEin: '***-**-3340', spouse: 'Mike Trillo', netWorth: 2900000, liquid: 410000, pfsDate: '2025-09-01' },
          { id: 'I-1002c', name: 'Cascade Mechanical Co.', type: 'Corporate', ssnEin: '93-1239922', netWorth: 3400000, pfsDate: '2025-09-01' },
        ],
        renewals: { financialsLast: '2025-09-01', financialsInterval: 365, wipLast: '2026-04-01', wipInterval: 90 },
        notes: 'Mechanical contractor. Active with Liberty Mutual primarily.',
      },
      {
        id: 'A-1003', name: 'Pioneer Trucking Inc.', dba: '', type: 'Commercial',
        contact: 'Sarah Lin', email: 'sarah@pioneertrucking.com', phone: '(360) 555-0118',
        address: '1500 SE Mill Plain Blvd', city: 'Vancouver', state: 'WA', zip: '98661',
        taxId: '91-3349812', credit: 689,
        company: {
          legalName: 'Pioneer Trucking Inc.', entityType: 'C-Corp', stateOfFormation: 'WA', founded: '2018',
          naics: '484121 — General Freight Trucking, Long-Distance', website: '',
          grossRevenue: 2400000, employees: 8,
          singleLimit: 75000, aggregateLimit: 75000,
        },
        contacts: [
          { id: 'C-1003a', name: 'Sarah Lin', title: 'Owner / Broker', email: 'sarah@pioneertrucking.com', phone: '(360) 555-0118', primary: true },
        ],
        indemnitors: [
          { id: 'I-1003a', name: 'Sarah Lin', type: 'Personal', ssnEin: '***-**-7712', netWorth: 480000, liquid: 95000, pfsDate: '2025-12-20' },
        ],
        renewals: { financialsLast: '2025-12-20', financialsInterval: 365, wipLast: null, wipInterval: 0 },
        notes: 'BMC-84 freight broker bond. Renews annually.',
      },
      {
        id: 'A-1004', name: 'BlueWater Marine Svcs', dba: 'BlueWater', type: 'Contractor',
        contact: 'Greg Adler', email: 'greg@bluewatermarine.com', phone: '(206) 555-0177',
        address: '3300 Alaskan Way W', city: 'Seattle', state: 'WA', zip: '98119',
        taxId: '91-2229991', credit: 770,
        company: {
          legalName: 'BlueWater Marine Services LLC', entityType: 'LLC', stateOfFormation: 'WA', founded: '2005',
          naics: '237990 — Other Heavy and Civil Engineering Construction', website: 'https://bluewatermarine.example',
          grossRevenue: 22000000, employees: 51,
          singleLimit: 8000000, aggregateLimit: 20000000,
        },
        contacts: [
          { id: 'C-1004a', name: 'Greg Adler',   title: 'President', email: 'greg@bluewatermarine.com',     phone: '(206) 555-0177', primary: true },
          { id: 'C-1004b', name: 'Helen Mosley', title: 'Controller', email: 'hmosley@bluewatermarine.com', phone: '(206) 555-0178', primary: false },
        ],
        indemnitors: [
          { id: 'I-1004a', name: 'Greg Adler',                 type: 'Personal',  ssnEin: '***-**-4421', spouse: 'Anne Adler', netWorth: 8400000, liquid: 1200000, pfsDate: '2026-02-10' },
          { id: 'I-1004b', name: 'BlueWater Marine Services LLC', type: 'Corporate', ssnEin: '91-2229991', netWorth: 11000000, pfsDate: '2026-02-10' },
        ],
        renewals: { financialsLast: '2026-02-10', financialsInterval: 365, wipLast: '2026-04-30', wipInterval: 90 },
        notes: 'Marine / dredging. Liberty Mutual lead. Working on Port of Seattle.',
        tasks: [
          { id: 'TK-A4A', text: 'Confirm Liberty submission package received', dueDate: '2026-05-16', assignee: 'U-2', completed: false, priority: 1, type: 'task', source: '', createdDate: '2026-05-13' },
        ],
      },
      {
        id: 'A-1005', name: 'Apex Auto Dealers', dba: 'Apex Auto', type: 'Commercial',
        contact: 'Marcus Reed', email: 'marcus@apexautos.com', phone: '(503) 555-0301',
        address: '4400 SW Murray Blvd', city: 'Beaverton', state: 'OR', zip: '97005',
        taxId: '93-2210034', credit: 701,
        company: {
          legalName: 'Apex Auto Dealers Inc.', entityType: 'C-Corp', stateOfFormation: 'OR', founded: '2014',
          naics: '441110 — New Car Dealers', website: '',
          grossRevenue: 15000000, employees: 22,
          singleLimit: 50000, aggregateLimit: 50000,
        },
        contacts: [
          { id: 'C-1005a', name: 'Marcus Reed', title: 'Owner', email: 'marcus@apexautos.com', phone: '(503) 555-0301', primary: true },
        ],
        indemnitors: [
          { id: 'I-1005a', name: 'Marcus Reed', type: 'Personal', ssnEin: '***-**-9911', netWorth: 1850000, liquid: 320000, pfsDate: '2025-11-01' },
        ],
        renewals: { financialsLast: '2025-11-01', financialsInterval: 365, wipLast: null, wipInterval: 0 },
        notes: 'MV dealer bond renewal annually each December.',
      },
      {
        id: 'A-1006', name: 'Summit Notary Services', dba: '', type: 'Commercial',
        contact: 'Erika Choi', email: 'erika@summitnotary.com', phone: '(208) 555-0212',
        address: '120 N 9th St', city: 'Boise', state: 'ID', zip: '83702',
        taxId: '82-7782341', credit: 760,
        company: {
          legalName: 'Summit Notary Services LLC', entityType: 'LLC', stateOfFormation: 'ID', founded: '2021',
          naics: '561499 — Other Business Support Services', website: '',
          grossRevenue: 180000, employees: 2,
          singleLimit: 10000, aggregateLimit: 10000,
        },
        contacts: [
          { id: 'C-1006a', name: 'Erika Choi', title: 'Owner', email: 'erika@summitnotary.com', phone: '(208) 555-0212', primary: true },
        ],
        indemnitors: [],
        renewals: { financialsLast: null, financialsInterval: 0, wipLast: null, wipInterval: 0 },
        notes: 'Notary public bond, 4-year term.',
      },
      {
        id: 'A-1007', name: 'Redwood Electrical Co.', dba: 'Redwood Electric', type: 'Contractor',
        contact: 'Diane Park', email: 'diane@redwoodelectric.com', phone: '(415) 555-0144',
        address: '800 Embarcadero', city: 'Oakland', state: 'CA', zip: '94606',
        taxId: '94-6655122', credit: 725,
        company: {
          legalName: 'Redwood Electrical Co.', entityType: 'S-Corp', stateOfFormation: 'CA', founded: '2019',
          naics: '238210 — Electrical Contractors', website: '',
          grossRevenue: 3800000, employees: 14,
          singleLimit: 1000000, aggregateLimit: 2500000,
        },
        contacts: [
          { id: 'C-1007a', name: 'Diane Park', title: 'Owner', email: 'diane@redwoodelectric.com', phone: '(415) 555-0144', primary: true },
        ],
        indemnitors: [
          { id: 'I-1007a', name: 'Diane Park', type: 'Personal', ssnEin: '***-**-2274', netWorth: 950000, liquid: 180000, pfsDate: '2026-01-05' },
        ],
        renewals: { financialsLast: '2026-01-05', financialsInterval: 365, wipLast: '2026-03-15', wipInterval: 90 },
        notes: 'Emerging electrical contractor. CSLB bond just issued.',
      },
      // --- Two duplicate-style records so the Duplicate Accounts tool has something to detect ---
      {
        id: 'A-1008', name: 'Redwood Electrical Company', dba: '', type: 'Contractor',
        contact: 'D. Park', email: 'diane@redwoodelectric.com', phone: '(415) 555-0144',
        address: '800 Embarcadero', city: 'Oakland', state: 'CA', zip: '94606',
        taxId: '94-6655122', credit: 720,
        company: { legalName: 'Redwood Electrical Company', entityType: '', stateOfFormation: 'CA', founded: '', naics: '', website: '', grossRevenue: 0, employees: 0, singleLimit: 0, aggregateLimit: 0 },
        contacts: [
          { id: 'C-1008a', name: 'D. Park', title: 'Owner', email: 'diane@redwoodelectric.com', phone: '(415) 555-0144', primary: true },
        ],
        indemnitors: [],
        renewals: {},
        notes: 'Created accidentally on 2026-04-30 when CQ was submitted under a slightly different business name. Should merge into A-1007.',
      },
      {
        id: 'A-1009', name: 'Northridge Builders', dba: '', type: 'Contractor',
        contact: 'Janet Pierce', email: 'jpierce@northridgebuilders.com', phone: '(503) 555-0142',
        address: '742 NE Broadway', city: 'Portland', state: 'OR', zip: '97232',
        taxId: '', credit: 0,
        company: {},
        contacts: [
          { id: 'C-1009a', name: 'Janet Pierce', title: 'President', email: 'jpierce@northridgebuilders.com', phone: '(503) 555-0142', primary: true },
        ],
        indemnitors: [],
        renewals: {},
        notes: 'Inquiry imported from generic web form before we knew the LLC suffix. Likely duplicate of A-1001.',
      },
    ],
    bonds: (() => {
      // Compute relative dates so the Renewals view has fresh content
      // regardless of when the demo is opened.
      const today = new Date();
      const days = (n) => {
        const d = new Date(today); d.setDate(d.getDate() + n);
        return d.toISOString().slice(0,10);
      };
      const wip = (contract, pct, costToDate, billed, eta, profit, asOf, history) => ({
        contractAmount: contract,
        percentComplete: pct,
        costToDate,
        estCostToComplete: eta,
        billedToDate: billed,
        estProfitPercent: profit,
        asOfDate: asOf,
        notes: '',
        history: history || [],
      });
      return [
        { id: 'B-2401', number: 'SF-2024-00121', accountId: 'A-1001', partnerId: 'P-01', type: 'Payment & Performance', obligee: 'City of Portland - PBOT', project: 'SE Division St Repaving (Phase 2)', amount: 1250000, premium: 18750, rate: 1.5, commissionRate: 25, effective: days(-300), expires: days(65),  status: 'Active', qboInvoiceNumber: '1041', reportedToBondCo: days(-301), obligeeApproved: days(-298), sentToPrincipal: days(-298),
          typeSpecific: { contractDate: days(-302), contractType: 'Unit Price', noticeToProceed: days(-298), projectStart: days(-298), projectEnd: days(50), liquidatedDamages: 500, retainagePercent: 5, performancePct: 100, paymentPct: 100, warrantyPeriodMonths: 12, taxIncluded: false },
          wip: wip(1250000, 82, 920000, 1010000, 198000, 11, days(-15), [
            { date: days(-180), percent: 35, costToDate: 391000, billedToDate: 425000, note: 'Spring base course complete; weather delays Phase 2A.' },
            { date: days(-90),  percent: 60, costToDate: 670000, billedToDate: 720000, note: 'Through milling and binder lift.' },
            { date: days(-15),  percent: 82, costToDate: 920000, billedToDate: 1010000, note: 'Striping & punch list remaining.' },
          ]) },
        { id: 'B-2403', number: 'SF-2024-00130', accountId: 'A-1002', partnerId: 'P-02', type: 'Bid', obligee: 'Salem-Keizer School District', project: 'McKay HS HVAC Replacement', amount: 48000, premium: 0, rate: 0, commissionRate: 0, effective: days(-30), expires: days(28), status: 'Active', qboInvoiceNumber: '', reportedToBondCo: days(-31), obligeeApproved: days(-28), sentToPrincipal: days(-28),
          typeSpecific: { bidOpenDate: days(15), bidPercent: '10%', estimatedContractValue: 480000, preBidConference: days(-7), prequalRequired: true, plansLocation: 'BidNet — listing #SKSD-2026-014', engineerEstimate: 465000, fundingSource: 'Public — Local' } },
        { id: 'B-2404', number: 'SF-2024-00141', accountId: 'A-1003', partnerId: 'P-03', type: 'License/Permit', obligee: 'FMCSA', project: 'BMC-84 Broker Authority', amount: 75000, premium: 1875, rate: 2.5, commissionRate: 30, effective: days(-120), expires: days(245), status: 'Active', qboInvoiceNumber: '1042', reportedToBondCo: days(-121), obligeeApproved: days(-118), sentToPrincipal: days(-118),
          typeSpecific: { licenseType: 'Freight Broker (BMC-84)', licenseNumber: 'MC-887412', issuingAuthority: 'Federal Motor Carrier Safety Administration', statutoryAmount: 75000, renewalTerm: 'Annual', classification: 'Property Broker', continuousObligation: true } },
        { id: 'B-2405', number: 'SF-2024-00150', accountId: 'A-1005', partnerId: 'P-04', type: 'License/Permit', obligee: 'Oregon DMV', project: 'MV Dealer Bond', amount: 50000, premium: 350, rate: 0.7, commissionRate: 30, effective: days(-330), expires: days(35), status: 'Active', qboInvoiceNumber: '1043', reportedToBondCo: days(-331), obligeeApproved: days(-328), sentToPrincipal: days(-328),
          typeSpecific: { licenseType: 'Auto Dealer', licenseNumber: 'OR-DLR-449221', issuingAuthority: 'Oregon Driver & Motor Vehicle Services', statutoryAmount: 50000, renewalTerm: 'Annual', classification: 'New & Used Vehicles', continuousObligation: false } },
        { id: 'B-2406', number: 'SF-2024-00155', accountId: 'A-1006', partnerId: 'P-05', type: 'License/Permit', obligee: 'Idaho SOS', project: 'Notary Bond', amount: 10000, premium: 50, rate: 0.5, commissionRate: 35, effective: days(-90), expires: days(1370), status: 'Active', qboInvoiceNumber: '1044', reportedToBondCo: days(-91), obligeeApproved: days(-88), sentToPrincipal: days(-88),
          typeSpecific: { licenseType: 'Notary Public', licenseNumber: 'ID-NP-228144', issuingAuthority: 'Idaho Secretary of State', statutoryAmount: 10000, renewalTerm: '4-Year', classification: '', continuousObligation: false } },
        { id: 'B-2407', number: 'SF-2024-00170', accountId: 'A-1004', partnerId: 'P-02', type: 'Payment & Performance', obligee: 'Port of Seattle', project: 'Pier 66 Dredging Maintenance', amount: 875000, premium: 14000, rate: 1.6, commissionRate: 25, effective: days(-13), expires: days(50), status: 'Active', qboInvoiceNumber: '', reportedToBondCo: days(-14), obligeeApproved: null, sentToPrincipal: null,
          typeSpecific: { contractDate: days(-15), contractType: 'Lump Sum', noticeToProceed: days(-10), projectStart: days(-7), projectEnd: days(50), liquidatedDamages: 1200, retainagePercent: 10, performancePct: 100, paymentPct: 100, warrantyPeriodMonths: 24, taxIncluded: false },
          wip: wip(875000, 8, 68000, 740000, 67000, 8, days(-2), [
            { date: days(-2),   percent: 8,  costToDate: 68000, billedToDate: 50000, note: 'Mobilization + survey complete; first dredge cycle next week.' },
          ]),
          tasks: [
            { id: 'TK-B7A', text: 'Get Obligee Approval signature stamp from Port of Seattle', dueDate: days(3),  assignee: 'U-1', completed: false, priority: 1, type: 'task', source: '', createdDate: days(-1) },
            { id: 'TK-B7B', text: 'Send executed bond + POA to Greg at BlueWater',              dueDate: days(5),  assignee: 'U-2', completed: false, priority: 1, type: 'task', source: '', createdDate: days(-1) },
            { id: 'TK-B7C', text: 'Create QBO invoice for $14,000 premium',                     dueDate: days(7),  assignee: 'U-4', completed: false, priority: 3, type: 'task', source: '', createdDate: days(-1) },
          ] },
        { id: 'B-2408', number: 'SF-2024-00171', accountId: 'A-1007', partnerId: 'P-03', type: 'License/Permit', obligee: 'CA CSLB', project: 'Contractor License Bond', amount: 25000, premium: 250, rate: 1.0, commissionRate: 30, effective: days(-42), expires: days(82), status: 'Active', qboInvoiceNumber: '1045', reportedToBondCo: days(-43), obligeeApproved: days(-40), sentToPrincipal: days(-40),
          typeSpecific: { licenseType: 'Contractor License', licenseNumber: 'CSLB-1099442', issuingAuthority: 'California Contractors State License Board', statutoryAmount: 25000, renewalTerm: 'Biennial', classification: 'C-10 Electrical', continuousObligation: false } },
        { id: 'B-2409', number: 'SF-2024-00180', accountId: 'A-1001', partnerId: 'P-06', type: 'Subdivision/Site Improvement', obligee: 'Multnomah County', project: 'Library Renovation — Site Improvements', amount: 620000, premium: 9300, rate: 1.5, commissionRate: 25, effective: days(-280), expires: days(85), status: 'Active', qboInvoiceNumber: '1046', reportedToBondCo: days(-281), obligeeApproved: days(-278), sentToPrincipal: days(-278),
          typeSpecific: { subdivisionName: 'Library Plaza Site Work', jurisdiction: 'Multnomah County', lotCount: null, engineersEstimate: 590000, improvements: ['Water','Sanitary Sewer','Storm Drainage','Streets & Paving','Curbs & Sidewalks','Landscaping'], maintenancePeriodMonths: 24, completionDeadline: days(40), phaseNumber: 'Phase 1', releaseConditions: 'Release issued on County engineer acceptance plus 2-year maintenance period.' },
          wip: wip(620000, 95, 538000, 590000, 28000, 9, days(-7), [
            { date: days(-90),  percent: 55, costToDate: 312000, billedToDate: 340000, note: 'Wet utilities and storm complete.' },
            { date: days(-30),  percent: 78, costToDate: 442000, billedToDate: 488000, note: 'Curbs and base paving complete.' },
            { date: days(-7),   percent: 95, costToDate: 538000, billedToDate: 590000, note: 'Punch list and final inspections only.' },
          ]) },
        { id: 'B-2410', number: 'SF-2026-00211', accountId: 'A-1006', partnerId: 'P-05', type: 'Probate', obligee: 'Ada County Probate Court', project: 'Estate of M. Choi', amount: 250000, premium: 1250, rate: 0.5, commissionRate: 30, effective: days(-30), expires: days(335), status: 'Active', qboInvoiceNumber: '1047', reportedToBondCo: days(-31), obligeeApproved: days(-28), sentToPrincipal: days(-28),
          typeSpecific: { courtName: 'Ada County Probate Court', caseNumber: 'CV01-26-00882', estateName: 'Estate of Margaret Choi', fiduciaryType: 'Personal Representative', judge: 'Hon. R. Whitfield', courtOrderDate: days(-32), probateCodeSection: 'Idaho Code § 15-3-604', estateValue: 880000 } },
      ];
    })(),
    partners: [
      { id: 'P-01', name: 'Hartford Surety',          rating: 'A+ XV',  appetite: 'Mid-large GC, Performance/Payment up to $25M single', contactName: 'Tom Reyes',       email: 'tom.reyes@hartford-surety.example',     phone: '(800) 555-0101', portalUrl: 'https://underwriting.hartford-surety.example', commissionRate: 25, active: true,
        rateOptions: [
          { id: 'R-P01-1', name: '$15/thousand slide',       type: 'slide',        rate: 0, minPremium: 500, notes: 'Contract bond slide — best rates for well-qualified GCs.',
            slide: [{ upTo: 500000, rate: 15 }, { upTo: 1000000, rate: 12.50 }, { upTo: 2500000, rate: 10 }, { upTo: null, rate: 7.50 }] },
          { id: 'R-P01-2', name: '$20/thousand slide',       type: 'slide',        rate: 0, minPremium: 500, notes: 'Standard contract slide.',
            slide: [{ upTo: 500000, rate: 20 }, { upTo: 1000000, rate: 17.50 }, { upTo: 2500000, rate: 15 }, { upTo: null, rate: 12.50 }] },
          { id: 'R-P01-3', name: '$25/thousand flat',        type: 'per-thousand', rate: 25, minPremium: 500, notes: 'New / substandard accounts.' },
          { id: 'R-P01-4', name: 'Bid Bond — no charge',     type: 'flat',         rate: 0,  minPremium: 0,   notes: 'Bid bonds issued at no cost, priced into final.' },
        ],
        commissionOptions: [
          { id: 'C-P01-1', name: '25% standard',        rate: 25 },
          { id: 'C-P01-2', name: '30% preferred producer', rate: 30 },
          { id: 'C-P01-3', name: '35% high-volume producer', rate: 35 },
        ],
        forms: [
          { id: 'FRM-P01-1', name: 'Hartford Producer Agreement',   category: 'Producer Agreement', version: 'v2024.1', effectiveDate: '2024-01-20', expiresDate: '2027-01-19', size: 780*1024, type: 'application/pdf', notes: 'Master agency agreement.' },
          { id: 'FRM-P01-2', name: 'Bid Bond Form',                 category: 'Bond Form',          version: 'v2023.3', effectiveDate: '2023-07-01', expiresDate: '2026-06-30', size: 210*1024, type: 'application/pdf' },
          { id: 'FRM-P01-3', name: 'Performance & Payment Bond',    category: 'Bond Form',          version: 'v2024.1', effectiveDate: '2024-02-01', expiresDate: '2027-01-31', size: 340*1024, type: 'application/pdf' },
          { id: 'FRM-P01-4', name: 'Power of Attorney (POA)',       category: 'POA',                version: 'v2025.1', effectiveDate: '2025-01-01', expiresDate: '2026-06-30', size: 145*1024, type: 'application/pdf', notes: 'Renews annually — expiring soon.' },
          { id: 'FRM-P01-5', name: 'Contract Rate Sheet',           category: 'Rate Sheet',         version: 'v2026.Q1', effectiveDate: '2026-01-01', expiresDate: '2026-04-01', size: 95*1024,  type: 'application/pdf', notes: 'EXPIRED — need updated Q2 sheet.' },
          { id: 'FRM-P01-6', name: 'Appetite Guide 2026',           category: 'Appetite Guide',     version: 'v2026',    effectiveDate: '2026-01-15', expiresDate: null,        size: 510*1024, type: 'application/pdf' },
        ],
      },
      { id: 'P-02', name: 'Liberty Mutual Surety',    rating: 'A   XV', appetite: 'Mid GC, mechanical, marine', contactName: 'Priya Subramanian',                                  email: 'psubramanian@lms.example',              phone: '(800) 555-0102', portalUrl: 'https://lms.example/portal',                  commissionRate: 25, active: true,
        rateOptions: [
          { id: 'R-P02-1', name: '$15/thousand slide',       type: 'slide',        rate: 0, minPremium: 500,
            slide: [{ upTo: 500000, rate: 15 }, { upTo: 1000000, rate: 13 }, { upTo: 2500000, rate: 11 }, { upTo: null, rate: 8 }], notes: 'Premier slide for A-rated principals.' },
          { id: 'R-P02-2', name: '$20/thousand flat',        type: 'per-thousand', rate: 20, minPremium: 500 },
          { id: 'R-P02-3', name: '$25/thousand flat',        type: 'per-thousand', rate: 25, minPremium: 500 },
          { id: 'R-P02-4', name: 'Bid Bond — no charge',     type: 'flat',         rate: 0,  minPremium: 0 },
        ],
        commissionOptions: [
          { id: 'C-P02-1', name: '25% standard',        rate: 25 },
          { id: 'C-P02-2', name: '30% preferred',       rate: 30 },
        ],
        forms: [
          { id: 'FRM-P02-1', name: 'Liberty Mutual Producer Agreement', category: 'Producer Agreement', version: 'v2023.2', effectiveDate: '2023-04-10', expiresDate: '2026-04-09', size: 620*1024, type: 'application/pdf', notes: 'Renews 4/2026 — track.' },
          { id: 'FRM-P02-2', name: 'Bid Bond Form',                    category: 'Bond Form',          version: 'v2024.2', effectiveDate: '2024-06-01', expiresDate: '2027-05-31', size: 195*1024, type: 'application/pdf' },
          { id: 'FRM-P02-3', name: 'Performance Bond Form',            category: 'Bond Form',          version: 'v2024.2', effectiveDate: '2024-06-01', expiresDate: '2027-05-31', size: 285*1024, type: 'application/pdf' },
          { id: 'FRM-P02-4', name: 'Power of Attorney',                category: 'POA',                version: 'v2026.1', effectiveDate: '2026-01-01', expiresDate: '2026-12-31', size: 130*1024, type: 'application/pdf' },
          { id: 'FRM-P02-5', name: 'Contract Rate Sheet — 2026',       category: 'Rate Sheet',         version: 'v2026',    effectiveDate: '2026-01-01', expiresDate: '2026-12-31', size: 110*1024, type: 'application/pdf' },
        ],
      },
      { id: 'P-03', name: 'Old Republic Surety',      rating: 'A   XI', appetite: 'License & permit, small contract, freight broker',         contactName: 'James OConnor',                                      email: 'joconnor@oldrepublic.example',          phone: '(800) 555-0103', portalUrl: 'https://oldrepublic.example/agent',           commissionRate: 30, active: true,
        rateOptions: [
          { id: 'R-P03-1', name: '$25/thousand — License Bond', type: 'per-thousand', rate: 25, minPremium: 100, notes: 'Standard state license bonds.' },
          { id: 'R-P03-2', name: '$30/thousand — License Bond', type: 'per-thousand', rate: 30, minPremium: 100, notes: 'Substandard credit / new license.' },
          { id: 'R-P03-3', name: 'Contractor License — flat $200', type: 'flat', rate: 200, minPremium: 200, notes: 'CSLB / OR CCB standard.' },
          { id: 'R-P03-4', name: 'Freight Broker (BMC-84)',     type: 'per-thousand', rate: 25, minPremium: 1875, notes: '$75K FMCSA — annual premium.' },
        ],
        commissionOptions: [
          { id: 'C-P03-1', name: '30% standard',            rate: 30 },
          { id: 'C-P03-2', name: '35% high-volume',         rate: 35 },
        ],
        forms: [
          { id: 'FRM-P03-1', name: 'Old Republic Producer Agreement', category: 'Producer Agreement', version: 'v2024.1', effectiveDate: '2024-08-15', expiresDate: '2029-08-14', size: 540*1024, type: 'application/pdf' },
          { id: 'FRM-P03-2', name: 'Contractor License Bond Form',    category: 'Bond Form',          version: 'v2024.1', effectiveDate: '2024-01-01', expiresDate: '2027-01-01', size: 180*1024, type: 'application/pdf' },
          { id: 'FRM-P03-3', name: 'FMCSA BMC-84 Bond Form',           category: 'Bond Form',          version: 'v2022.2', effectiveDate: '2022-10-01', expiresDate: '2026-05-01', size: 220*1024, type: 'application/pdf', notes: 'EXPIRING — needs 2026 update.' },
          { id: 'FRM-P03-4', name: 'Power of Attorney',                category: 'POA',                version: 'v2026',    effectiveDate: '2026-01-01', expiresDate: '2026-12-31', size: 140*1024, type: 'application/pdf' },
          { id: 'FRM-P03-5', name: 'License Bond Rate Sheet',          category: 'Rate Sheet',         version: 'v2026.Q1', effectiveDate: '2026-01-01', expiresDate: '2026-03-31', size: 85*1024,  type: 'application/pdf', notes: 'EXPIRED — need Q2 sheet.' },
        ],
      },
      { id: 'P-04', name: 'Merchants Bonding',        rating: 'A   IX', appetite: 'Small contractor + commercial license',                    contactName: 'Erica Chen',                                          email: 'erica@merchantsbonding.example',        phone: '(800) 555-0104', portalUrl: 'https://merchantsbonding.example/producer',    commissionRate: 30, active: true,
        rateOptions: [
          { id: 'R-P04-1', name: '$20/thousand — Contract',  type: 'per-thousand', rate: 20, minPremium: 250, notes: 'Small P&P.' },
          { id: 'R-P04-2', name: '$25/thousand slide',       type: 'slide',        rate: 0,  minPremium: 250,
            slide: [{ upTo: 250000, rate: 25 }, { upTo: 500000, rate: 22 }, { upTo: null, rate: 18 }] },
          { id: 'R-P04-3', name: '$30/thousand — Small License', type: 'per-thousand', rate: 30, minPremium: 100 },
        ],
        commissionOptions: [
          { id: 'C-P04-1', name: '30% standard',        rate: 30 },
          { id: 'C-P04-2', name: '35% preferred',       rate: 35 },
        ],
        forms: [
          { id: 'FRM-P04-1', name: 'Merchants Producer Agreement',    category: 'Producer Agreement', version: 'v2024',    effectiveDate: '2024-06-01', expiresDate: '2027-05-31', size: 490*1024, type: 'application/pdf' },
          { id: 'FRM-P04-2', name: 'Small Contract Bond Form',        category: 'Bond Form',          version: 'v2023.4', effectiveDate: '2023-12-01', expiresDate: '2026-11-30', size: 175*1024, type: 'application/pdf' },
          { id: 'FRM-P04-3', name: 'Power of Attorney',                category: 'POA',                version: 'v2026',    effectiveDate: '2026-01-01', expiresDate: '2026-12-31', size: 125*1024, type: 'application/pdf' },
        ],
      },
      { id: 'P-05', name: 'NGM Insurance — Surety',   rating: 'A   IX', appetite: 'Small commercial / notary / probate',                       contactName: 'Linda Park',                                          email: 'lpark@ngm.example',                     phone: '(800) 555-0105', portalUrl: 'https://ngm.example/agentportal',             commissionRate: 35, active: true,
        rateOptions: [
          { id: 'R-P05-1', name: 'Notary Bond — flat $100',  type: 'flat',         rate: 100, minPremium: 100 },
          { id: 'R-P05-2', name: '$5/thousand — Probate',    type: 'per-thousand', rate: 5,   minPremium: 250, notes: 'Fiduciary bonds up to $1M.' },
          { id: 'R-P05-3', name: '$7.50/thousand — Probate substandard', type: 'per-thousand', rate: 7.50, minPremium: 250 },
          { id: 'R-P05-4', name: '$30/thousand — Small Commercial', type: 'per-thousand', rate: 30, minPremium: 100 },
        ],
        commissionOptions: [
          { id: 'C-P05-1', name: '35% standard',        rate: 35 },
        ],
        forms: [
          { id: 'FRM-P05-1', name: 'NGM Producer Agreement',           category: 'Producer Agreement', version: 'v2023',    effectiveDate: '2023-03-15', expiresDate: '2026-03-14', size: 480*1024, type: 'application/pdf', notes: 'EXPIRED — renewal in progress.' },
          { id: 'FRM-P05-2', name: 'Notary Bond Form',                 category: 'Bond Form',          version: 'v2024.1', effectiveDate: '2024-01-01', expiresDate: '2027-01-01', size: 95*1024,  type: 'application/pdf' },
          { id: 'FRM-P05-3', name: 'Probate / Fiduciary Bond Form',    category: 'Bond Form',          version: 'v2024.1', effectiveDate: '2024-01-01', expiresDate: '2027-01-01', size: 205*1024, type: 'application/pdf' },
          { id: 'FRM-P05-4', name: 'Power of Attorney',                category: 'POA',                version: 'v2026',    effectiveDate: '2026-01-01', expiresDate: '2026-12-31', size: 120*1024, type: 'application/pdf' },
        ],
      },
      { id: 'P-06', name: 'Great American Surety',    rating: 'A+ XIV', appetite: 'GC large contract, subdivision, court',                     contactName: 'Robert Tan',                                          email: 'rtan@greatamerican.example',            phone: '(800) 555-0106', portalUrl: 'https://greatamerican.example/portal',         commissionRate: 25, active: true,
        rateOptions: [
          { id: 'R-P06-1', name: '$10/thousand slide — large',  type: 'slide',   rate: 0, minPremium: 1000, notes: 'For qualified large GCs, single ≥ $5M.',
            slide: [{ upTo: 1000000, rate: 10 }, { upTo: 2500000, rate: 8 }, { upTo: 5000000, rate: 7 }, { upTo: null, rate: 6 }] },
          { id: 'R-P06-2', name: '$15/thousand slide',          type: 'slide',   rate: 0, minPremium: 500,
            slide: [{ upTo: 500000, rate: 15 }, { upTo: 1000000, rate: 12.50 }, { upTo: 2500000, rate: 10 }, { upTo: null, rate: 7.50 }] },
          { id: 'R-P06-3', name: '$20/thousand — Standard',     type: 'per-thousand', rate: 20, minPremium: 500 },
          { id: 'R-P06-4', name: 'Subdivision — $15/thousand',  type: 'per-thousand', rate: 15, minPremium: 500 },
          { id: 'R-P06-5', name: 'Court Bond — $10/thousand',   type: 'per-thousand', rate: 10, minPremium: 100 },
        ],
        commissionOptions: [
          { id: 'C-P06-1', name: '25% standard',        rate: 25 },
          { id: 'C-P06-2', name: '30% preferred',       rate: 30 },
          { id: 'C-P06-3', name: '35% high-volume',     rate: 35 },
        ],
        forms: [
          { id: 'FRM-P06-1', name: 'Great American Producer Agreement', category: 'Producer Agreement', version: 'v2024.2', effectiveDate: '2024-10-01', expiresDate: '2027-09-30', size: 720*1024, type: 'application/pdf' },
          { id: 'FRM-P06-2', name: 'P&P Bond Form',                     category: 'Bond Form',          version: 'v2024.1', effectiveDate: '2024-05-01', expiresDate: '2027-04-30', size: 320*1024, type: 'application/pdf' },
          { id: 'FRM-P06-3', name: 'Subdivision / Site Improvement Bond', category: 'Bond Form',        version: 'v2024.1', effectiveDate: '2024-05-01', expiresDate: '2027-04-30', size: 295*1024, type: 'application/pdf' },
          { id: 'FRM-P06-4', name: 'Power of Attorney',                 category: 'POA',                version: 'v2025.2', effectiveDate: '2025-06-01', expiresDate: '2026-05-31', size: 155*1024, type: 'application/pdf', notes: 'EXPIRING soon — 30 days.' },
          { id: 'FRM-P06-5', name: 'Contract Rate Sheet',               category: 'Rate Sheet',         version: 'v2026',    effectiveDate: '2026-01-01', expiresDate: '2026-12-31', size: 130*1024, type: 'application/pdf' },
          { id: 'FRM-P06-6', name: 'Appetite Guide 2026',               category: 'Appetite Guide',     version: 'v2026',    effectiveDate: '2026-01-15', expiresDate: null,        size: 420*1024, type: 'application/pdf' },
        ],
      },
    ],
    pipelineStages: [
      'Request Received',
      'Pre-Qualification',
      'Submission in Progress',
      'Submitted to Underwriter',
      'Underwriter Review',
      'Approved – Pending Bid Results',
      'Awarded - Ready to Issue',
    ],
    pipeline: [
      { id: 'PL-001', stage: 'Request Received',              accountId: 'A-1001', bondType: 'Payment & Performance', amount: 2500000, obligee: 'ODOT',                  dueDate: '2026-06-10', notes: 'Hwy 26 widening — RFP just dropped',                producer: 'CV', probability: 20, bidResult: 'pending',
        typeSpecific: { contractType: 'Unit Price', liquidatedDamages: 750, retainagePercent: 5, performancePct: 100, paymentPct: 100 },
        activity: [
          { id: 'AC-001', date: '2026-05-10T11:02', author: 'Janet Pierce', type: 'email',    subject: 'New bid opportunity — ODOT Hwy 26', text: 'Inbound — Janet wants to bid Hwy 26 widening, est. $2.5M.' },
        ] },
      { id: 'PL-002', stage: 'Pre-Qualification',             accountId: 'A-1002', bondType: 'Payment & Performance', amount: 800000,  obligee: 'Marion County',         dueDate: '2026-05-22', notes: 'Pulling financials and WIP for pre-qual',           producer: 'CV', probability: 40, bidResult: 'pending',
        typeSpecific: { contractType: 'Lump Sum', liquidatedDamages: 500, retainagePercent: 5, performancePct: 100, paymentPct: 100 },
        activity: [
          { id: 'AC-002', date: '2026-05-09T09:10', author: 'Casey V.', type: 'note', text: 'Requested updated WIP from Cascade for pre-qual.' },
        ],
        tasks: [
          { id: 'TK-P2A', text: 'Chase Cascade for updated WIP schedule', dueDate: '2026-05-17', assignee: 'U-1', completed: false, priority: 2, type: 'task', source: '', createdDate: '2026-05-09' },
          { id: 'TK-P2B', text: 'Pre-quote both Hartford and Liberty',   dueDate: '2026-05-20', assignee: 'U-1', completed: false, priority: 3, type: 'task', source: '', createdDate: '2026-05-09' },
        ] },
      { id: 'PL-003', stage: 'Submission in Progress',        accountId: 'A-1004', bondType: 'Payment & Performance', amount: 875000,  obligee: 'Port of Seattle',       dueDate: '2026-05-20', notes: 'Building Liberty Mutual submission package',        producer: 'CV', probability: 55, bidResult: 'pending',
        typeSpecific: { contractType: 'Lump Sum', performancePct: 100, paymentPct: 100, warrantyPeriodMonths: 24 } },
      { id: 'PL-004', stage: 'Submitted to Underwriter',      accountId: 'A-1002', bondType: 'Bid',                   amount: 48000,   obligee: 'Salem-Keizer SD',       dueDate: '2026-05-15', notes: 'Sent to Liberty UW 5/12 — awaiting acknowledgement', producer: 'CV', probability: 60, bidResult: 'pending',
        typeSpecific: { bidOpenDate: '2026-05-15', bidPercent: '10%', estimatedContractValue: 480000, fundingSource: 'Public — Local' },
        activity: [
          { id: 'AC-003', date: '2026-05-12T14:30', author: 'Casey V.', type: 'email', subject: 'McKay HS HVAC — submission', text: 'Sent submission package to Liberty Mutual UW.' },
        ] },
      { id: 'PL-005', stage: 'Underwriter Review',            accountId: 'A-1007', bondType: 'Bid',                   amount: 32000,   obligee: 'BART',                  dueDate: '2026-05-28', notes: 'Old Republic UW reviewing — additional questions',   producer: 'CV', probability: 65, bidResult: 'pending',
        typeSpecific: { bidOpenDate: '2026-05-28', bidPercent: '10%', estimatedContractValue: 320000, fundingSource: 'Public — Local' } },
      { id: 'PL-006', stage: 'Approved – Pending Bid Results',accountId: 'A-1001', bondType: 'Bid',                   amount: 125000,  obligee: 'City of Portland',      dueDate: '2026-05-29', notes: 'Approved by Hartford — bid opens 5/29 @ 2pm',         producer: 'CV', probability: 75, bidResult: 'pending',
        typeSpecific: { bidOpenDate: '2026-05-29', bidPercent: '10%', estimatedContractValue: 1250000, fundingSource: 'Public — Local' } },
      { id: 'PL-007', stage: 'Awarded - Ready to Issue',      accountId: 'A-1004', bondType: 'Payment & Performance', amount: 875000,  obligee: 'Port of Seattle',       dueDate: '2026-05-20', notes: 'Awarded — convert to bond and issue',                producer: 'CV', probability: 100, bidResult: 'awarded',
        bidDate: '2026-05-20', bidOurAmount: 1748500, bidWinningAmount: 1748500, bidPlace: '1st of 3', bidWinner: 'BlueWater Marine Svcs',
        typeSpecific: { contractType: 'Lump Sum', performancePct: 100, paymentPct: 100, warrantyPeriodMonths: 24 },
        activity: [
          { id: 'AC-004', date: '2026-05-20T15:30', author: 'Casey V.', type: 'bid_result', subject: 'Result: Awarded — we won', text: 'Port of Seattle confirmed award. Notice to proceed issued.' },
        ] },
      { id: 'PL-008', stage: 'Approved – Pending Bid Results',accountId: 'A-1007', bondType: 'Bid',                   amount: 42000,   obligee: 'Sacramento Regional Transit', dueDate: '2026-05-08', notes: 'Bid opened — we were 2nd lowest',           producer: 'CV', probability: 0,   bidResult: 'not_low',
        bidDate: '2026-05-08', bidOurAmount: 418900, bidWinningAmount: 392450, bidPlace: '2nd of 4', bidWinner: 'Bayside Electric LLC', bidResultNotes: 'Lost on price by ~6.7%. Diane wants to debrief and target a similar RFP next quarter.',
        typeSpecific: { bidOpenDate: '2026-05-08', bidPercent: '10%', estimatedContractValue: 420000, fundingSource: 'Public — Local' },
        activity: [
          { id: 'AC-005', date: '2026-05-08T16:00', author: 'Casey V.', type: 'bid_result', subject: 'Result: Not Low — lost on price', text: 'Bayside Electric was low at $392,450. We were 2nd of 4.' },
          { id: 'AC-006', date: '2026-05-09T08:14', author: 'Casey V.', type: 'call', text: 'Called Diane to debrief — interested in next AC Transit electrical RFP.' },
        ] },
      { id: 'PL-009', stage: 'Pre-Qualification',             accountId: 'A-1003', bondType: 'Bid',                   amount: 25000,   obligee: 'Port of Vancouver',     dueDate: '2026-05-13', notes: 'Principal pulled out — equipment shortage',         producer: 'CV', probability: 0,   bidResult: 'no_bid',
        bidDate: '2026-05-13', bidResultNotes: 'Sarah decided not to bid — short on rolling stock for the schedule. Will revisit if timeline slips.',
        typeSpecific: { bidOpenDate: '2026-05-13', bidPercent: '10%', estimatedContractValue: 250000, fundingSource: 'Public — Local' },
        activity: [
          { id: 'AC-007', date: '2026-05-13T11:20', author: 'Sarah Lin', type: 'email',  subject: 'Pulling out of Port of Vancouver bid', text: 'Confirmed by phone — Sarah decided not to bid this round.' },
          { id: 'AC-008', date: '2026-05-13T11:35', author: 'Casey V.',  type: 'bid_result', subject: 'Result: Principal Did Not Bid', text: 'Logged as no-bid. Marking opp closed.' },
        ] },
      { id: 'PL-010', stage: 'Pre-Qualification',             accountId: 'A-1006', bondType: 'Probate',               amount: 180000,  obligee: 'Canyon County Probate Court', dueDate: '2026-06-01', notes: 'Conservatorship request — estate ~$650K',     producer: 'CV', probability: 50, bidResult: 'pending',
        typeSpecific: { courtName: 'Canyon County Probate Court', fiduciaryType: 'Conservator', estateValue: 650000 } },
    ],
    leadStages: [
      'New Lead',
      'Contacted',
      'Qualified',
      'Application Sent',
      'Submitted to Surety',
      'Approved',
      'Onboarded',
      'Lost / No Fit',
    ],
    leads: [
      {
        id: 'L-001', companyName: 'Cascade Stone & Masonry', dba: '', contactName: 'Tony Miura', contactTitle: 'Owner',
        email: 'tony@cascadestone.example', phone: '(503) 555-0411', city: 'Tigard', state: 'OR',
        industry: 'Stone & Concrete Contractor', naics: '238140',
        leadSource: 'Referral', referredBy: 'Janet Pierce (Northridge Builders)',
        bondTypes: ['Payment & Performance','Bid'],
        estimatedAnnualPremium: 18000, estimatedRevenue: 4800000, yearsInBusiness: 12,
        stage: 'Qualified', probability: 60, status: 'open',
        owner: 'CV', producer: 'CV',
        createdDate: '2026-04-21', lastTouch: '2026-05-12', nextFollowUp: '2026-05-19',
        notes: 'GC subcontractor referral from Northridge. Strong CPA-reviewed financials, ~$4.8M GR. Looking for $1M/$3M.',
        activity: [
          { id: 'LA-001', date: '2026-04-21T09:00', author: 'Janet Pierce', type: 'note',  text: 'Referred by Janet Pierce — said Tony bonds a few projects a year up to $750K.' },
          { id: 'LA-002', date: '2026-04-23T11:30', author: 'Casey V.',     type: 'call',  text: 'Initial call — Tony is interested. Sent introductory email + agency overview.' },
          { id: 'LA-003', date: '2026-05-05T14:10', author: 'Casey V.',     type: 'meeting', text: 'On-site coffee at Cascade office. Reviewed bonding needs.' },
          { id: 'LA-004', date: '2026-05-12T08:45', author: 'Casey V.',     type: 'note',  text: 'Qualified — fits Hartford & Liberty appetite. Sending application package next.' },
        ],
        tasks: [
          { id: 'TK-L1A', text: 'Send Tony the application package + indemnity forms', dueDate: '2026-05-18', assignee: 'U-1', completed: false, priority: 2, type: 'task', source: '', createdDate: '2026-05-12' },
          { id: 'TK-L1B', text: 'Pull D&B report on Cascade Stone & Masonry',          dueDate: '2026-05-19', assignee: 'U-4', completed: false, priority: 3, type: 'task', source: '', createdDate: '2026-05-12' },
          { id: 'TK-L1C', text: 'Initial call with Tony',                              dueDate: '2026-04-23', assignee: 'U-1', completed: true, completedDate: '2026-04-23', priority: 2, type: 'call', source: '', createdDate: '2026-04-21' },
        ],
        convertedAccountId: null,
      },
      {
        id: 'L-002', companyName: 'Sundance Builders Inc.', dba: 'Sundance', contactName: 'Wendy Hall', contactTitle: 'CFO',
        email: 'whall@sundancebuilders.example', phone: '(208) 555-0188', city: 'Coeur d\'Alene', state: 'ID',
        industry: 'Residential & Light Commercial GC', naics: '236118',
        leadSource: 'Website', referredBy: '',
        bondTypes: ['Payment & Performance'],
        estimatedAnnualPremium: 9000, estimatedRevenue: 6200000, yearsInBusiness: 8,
        stage: 'New Lead', probability: 25, status: 'open',
        owner: 'CV', producer: 'CV',
        createdDate: '2026-05-13', lastTouch: '2026-05-13', nextFollowUp: '2026-05-16',
        notes: 'Inquiry form submitted off the website — needs P&P bond for $1.4M school addition.',
        activity: [
          { id: 'LA-101', date: '2026-05-13T09:33', author: 'BondVault', type: 'note', text: 'Web form submitted: P&P bond, $1.4M, school addition. Schedule intro call.' },
        ],
        convertedAccountId: null,
      },
      {
        id: 'L-003', companyName: 'Whitewater Earthworks LLC', dba: '', contactName: 'Brent Cho', contactTitle: 'President',
        email: 'brent@whitewaterearth.example', phone: '(503) 555-0277', city: 'Hood River', state: 'OR',
        industry: 'Excavation & Site Prep', naics: '238910',
        leadSource: 'Surety Partner', referredBy: 'Liberty Mutual (Priya Subramanian)',
        bondTypes: ['Payment & Performance','Subdivision/Site Improvement'],
        estimatedAnnualPremium: 22000, estimatedRevenue: 7900000, yearsInBusiness: 14,
        stage: 'Application Sent', probability: 70, status: 'open',
        owner: 'CV', producer: 'CV',
        createdDate: '2026-04-02', lastTouch: '2026-05-08', nextFollowUp: '2026-05-22',
        notes: 'Liberty referred — looking for $5M/$15M. Excellent FY2024 numbers ($7.9M GR, ~12% NP).',
        activity: [
          { id: 'LA-201', date: '2026-04-02T13:05', author: 'Priya Subramanian', type: 'email',   text: 'Liberty referred Whitewater Earthworks for bonding (current carrier capacity tapped).' },
          { id: 'LA-202', date: '2026-04-05T10:20', author: 'Casey V.',          type: 'call',    text: 'Initial call with Brent — strong interest, requesting capacity up to $15M agg.' },
          { id: 'LA-203', date: '2026-05-02T11:00', author: 'Casey V.',          type: 'email',   text: 'Sent agency application + indemnity packet via DocuSign.' },
          { id: 'LA-204', date: '2026-05-08T09:30', author: 'Brent Cho',          type: 'email',   text: 'Returned signed application; included FY2024 audit, WIP, AP/AR aging.' },
        ],
        convertedAccountId: null,
      },
      {
        id: 'L-004', companyName: 'Highline Steel Erectors', dba: '', contactName: 'Marta Voss', contactTitle: 'CEO',
        email: 'mvoss@highlinesteel.example', phone: '(206) 555-0399', city: 'Kent', state: 'WA',
        industry: 'Structural Steel Erection', naics: '238120',
        leadSource: 'Networking', referredBy: 'AGC of WA Chapter Lunch',
        bondTypes: ['Payment & Performance'],
        estimatedAnnualPremium: 35000, estimatedRevenue: 14500000, yearsInBusiness: 19,
        stage: 'Submitted to Surety', probability: 80, status: 'open',
        owner: 'CV', producer: 'CV',
        createdDate: '2026-03-14', lastTouch: '2026-05-10', nextFollowUp: '2026-05-21',
        notes: 'Strong steel sub looking to switch agents after their producer retired. Submitted to Hartford and Liberty for capacity quote.',
        activity: [
          { id: 'LA-301', date: '2026-03-14T16:00', author: 'Casey V.', type: 'meeting', text: 'Met at AGC Chapter Lunch. Marta open to switching agents.' },
          { id: 'LA-302', date: '2026-04-10T11:00', author: 'Casey V.', type: 'email',   text: 'Sent application; followed up 4/22.' },
          { id: 'LA-303', date: '2026-05-01T09:00', author: 'Casey V.', type: 'note',    text: 'Application returned 4/30. Submitted to Hartford + Liberty for parallel quotes.' },
          { id: 'LA-304', date: '2026-05-10T15:00', author: 'Tom Reyes', type: 'email',  text: 'Hartford signaled $5M/$12M capacity, awaiting formal letter.' },
        ],
        convertedAccountId: null,
      },
      {
        id: 'L-005', companyName: 'Coast Range Roofing', dba: '', contactName: 'Daniel Park', contactTitle: 'Owner',
        email: 'dan@coastrangeroofing.example', phone: '(541) 555-0117', city: 'Newport', state: 'OR',
        industry: 'Roofing Contractor', naics: '238160',
        leadSource: 'Cold Outreach', referredBy: '',
        bondTypes: ['License/Permit'],
        estimatedAnnualPremium: 600, estimatedRevenue: 1100000, yearsInBusiness: 3,
        stage: 'Lost / No Fit', probability: 0, status: 'lost',
        owner: 'CV', producer: 'CV',
        createdDate: '2026-03-20', lastTouch: '2026-04-18', nextFollowUp: null,
        notes: 'Wanted CCB license bond but switched to a direct online carrier instead. Keep in touch for future.',
        activity: [
          { id: 'LA-401', date: '2026-03-20T10:00', author: 'Casey V.', type: 'call', text: 'Cold call — needs OR CCB license bond.' },
          { id: 'LA-402', date: '2026-04-18T13:15', author: 'Daniel Park', type: 'email', text: 'Went with an online direct carrier. Closing lead.' },
          { id: 'LA-403', date: '2026-04-18T13:20', author: 'Casey V.', type: 'note',  text: 'Marked Lost — keep in touch for any growth into commercial roofing later.' },
        ],
        convertedAccountId: null,
      },
      {
        id: 'L-006', companyName: 'Pacific Probate Services', dba: '', contactName: 'Aisha Rahman', contactTitle: 'Trust Officer',
        email: 'arahman@pacificprobate.example', phone: '(415) 555-0244', city: 'San Francisco', state: 'CA',
        industry: 'Fiduciary / Trust Services', naics: '523991',
        leadSource: 'Trade Show', referredBy: 'NASBP Annual Meeting',
        bondTypes: ['Probate'],
        estimatedAnnualPremium: 8500, estimatedRevenue: null, yearsInBusiness: 22,
        stage: 'Approved', probability: 95, status: 'open',
        owner: 'CV', producer: 'CV',
        createdDate: '2026-04-29', lastTouch: '2026-05-11', nextFollowUp: '2026-05-18',
        notes: 'Fiduciary firm needing ongoing probate / conservator bonds. NGM appointed. Ready to onboard once they sign the producer agreement.',
        activity: [
          { id: 'LA-501', date: '2026-04-29T16:00', author: 'Casey V.', type: 'meeting', text: 'Met at NASBP — Aisha needs a producer that can turn around probate bonds same-day.' },
          { id: 'LA-502', date: '2026-05-02T10:00', author: 'Casey V.', type: 'email',   text: 'Sent agency overview, NGM brochure, sample probate forms.' },
          { id: 'LA-503', date: '2026-05-08T11:30', author: 'Aisha Rahman', type: 'email', text: 'Approved internally. Reviewing producer agreement.' },
          { id: 'LA-504', date: '2026-05-11T14:00', author: 'Casey V.', type: 'note',    text: 'Ready to convert to account once agreement is countersigned.' },
        ],
        convertedAccountId: null,
      },
    ],
    underwriting: [
      { id: 'UW-001', bondId: 'B-2407', step: 3, requirements: [
        { name: 'Financial statements (CPA)', status: 'received' },
        { name: 'Personal financial statements', status: 'received' },
        { name: 'Work-in-progress schedule', status: 'received' },
        { name: 'Bank line confirmation', status: 'pending' },
        { name: 'Indemnity agreement (GIA)', status: 'pending' },
      ], partnerId: 'P-02', assignedTo: 'Casey V.', notes: 'Liberty UW requested 12-mo WIP detail' },
      { id: 'UW-002', bondId: 'B-2403', step: 2, requirements: [
        { name: 'Bid documents', status: 'received' },
        { name: 'Engineer estimate', status: 'received' },
        { name: 'Project schedule', status: 'pending' },
        { name: 'Contractor questionnaire', status: 'pending' },
      ], partnerId: 'P-02', assignedTo: 'Casey V.', notes: '' },
    ],
    documents: [
      { id: 'D-1',  name: 'Northridge_FinancialStmt_2025.pdf', size: 1.4*1024*1024, type: 'application/pdf', accountId: 'A-1001', bondId: null,     category: 'Financial',     uploaded: '2026-04-30' },
      { id: 'D-2',  name: 'Cascade_WIP_Apr2026.xlsx',          size: 220*1024,      type: 'spreadsheet',     accountId: 'A-1002', bondId: 'B-2403', category: 'WIP',           uploaded: '2026-04-28' },
      { id: 'D-3',  name: 'BlueWater_GIA_signed.pdf',          size: 650*1024,      type: 'application/pdf', accountId: 'A-1004', bondId: 'B-2407', category: 'Indemnity',     uploaded: '2026-05-02' },
      { id: 'D-4',  name: 'Pioneer_BMC84_Form.pdf',            size: 180*1024,      type: 'application/pdf', accountId: 'A-1003', bondId: 'B-2404', category: 'Bond Form',     uploaded: '2026-01-12' },
      { id: 'D-5',  name: 'Northridge_W-9_2024.pdf',           size: 110*1024,      type: 'application/pdf', accountId: 'A-1001', bondId: null,     category: 'Company Info',  uploaded: '2024-09-12' },
      { id: 'D-6',  name: 'Northridge_LLC_Articles.pdf',       size: 480*1024,      type: 'application/pdf', accountId: 'A-1001', bondId: null,     category: 'Company Info',  uploaded: '2024-09-12' },
      { id: 'D-7',  name: 'Northridge_PFS_JPierce_2025.pdf',   size: 920*1024,      type: 'application/pdf', accountId: 'A-1001', bondId: null,     category: 'PFS',           uploaded: '2025-11-15' },
      { id: 'D-8',  name: 'Northridge_GIA_2018.pdf',           size: 1.1*1024*1024, type: 'application/pdf', accountId: 'A-1001', bondId: null,     category: 'Indemnity',     uploaded: '2018-04-10' },
      { id: 'D-9',  name: 'SE_Division_Contract_Executed.pdf', size: 2.6*1024*1024, type: 'application/pdf', accountId: 'A-1001', bondId: 'B-2401', category: 'Contract',      uploaded: '2025-07-08' },
      { id: 'D-10', name: 'SE_Division_BondForm_Executed.pdf', size: 540*1024,      type: 'application/pdf', accountId: 'A-1001', bondId: 'B-2401', category: 'Bond Form',     uploaded: '2025-07-08' },
      { id: 'D-11', name: 'SE_Division_POA_Hartford.pdf',      size: 280*1024,      type: 'application/pdf', accountId: 'A-1001', bondId: 'B-2401', category: 'Bond Form',     uploaded: '2025-07-08' },
      { id: 'D-12', name: 'SE_Division_WIP_2026-04.xlsx',      size: 145*1024,      type: 'spreadsheet',     accountId: 'A-1001', bondId: 'B-2401', category: 'WIP',           uploaded: '2026-05-01' },
      { id: 'D-13', name: 'McKay_HS_BidPackage.zip',           size: 5.1*1024*1024, type: 'application/zip', accountId: 'A-1002', bondId: 'B-2403', category: 'Bid Document',  uploaded: '2026-04-12' },
      { id: 'D-14', name: 'BlueWater_FY2025_CPA_Reviewed.pdf', size: 2.2*1024*1024, type: 'application/pdf', accountId: 'A-1004', bondId: null,     category: 'Financial',     uploaded: '2026-02-10' },
      { id: 'D-15', name: 'BlueWater_PortOfSeattle_Submission.pdf', size: 3.4*1024*1024, type: 'application/pdf', accountId: 'A-1004', bondId: 'B-2407', category: 'Underwriting', uploaded: '2026-05-02' },
      { id: 'D-16', name: 'Library_Reno_Release_Letter.pdf',   size: 220*1024,      type: 'application/pdf', accountId: 'A-1001', bondId: 'B-2409', category: 'Release',       uploaded: '2026-05-06' },
      { id: 'D-17', name: 'Hartford_ProducerAgreement_2024.pdf', size: 780*1024,    type: 'application/pdf', accountId: null,     bondId: null,     category: 'Producer Agreement', partnerId: 'P-01', uploaded: '2024-01-20' },
      { id: 'D-18', name: 'Liberty_AppetiteGuide_2026.pdf',    size: 510*1024,      type: 'application/pdf', accountId: null,     bondId: null,     category: 'Rate Sheet',    partnerId: 'P-02', uploaded: '2026-01-15' },
      { id: 'D-19', name: 'BondVault_Indemnity_Template.docx', size: 95*1024,       type: 'document',        accountId: null,     bondId: null,     category: 'Template',      uploaded: '2024-03-01' },
      { id: 'D-20', name: 'Agency_EO_Renewal_2026.pdf',        size: 320*1024,      type: 'application/pdf', accountId: null,     bondId: null,     category: 'Agency Admin',  uploaded: '2026-01-10' },
    ],
    emails: [
      { id: 'E-1', folder: 'inbox', from: 'tom.reyes@hartford-surety.example', subject: 'Re: SF-2024-00121 — Performance bond issued', preview: 'Hi Casey, attached find the executed performance & payment bonds for Northridge…', date: '2026-03-04T15:12', accountId: 'A-1001', bondId: 'B-2401', read: true },
      { id: 'E-2', folder: 'inbox', from: 'psubramanian@lms.example',         subject: 'BlueWater Marine — UW requests',           preview: 'Casey, we need the 12-month WIP detail and bank line confirmation before we can issue…', date: '2026-05-09T09:44', accountId: 'A-1004', bondId: 'B-2407', read: false },
      { id: 'E-3', folder: 'inbox', from: 'jpierce@northridgebuilders.com',   subject: 'New bid opportunity — ODOT Hwy 26',        preview: 'We are bidding the Hwy 26 widening project, est. value $2.5M, need performance + payment…', date: '2026-05-10T11:02', accountId: 'A-1001', bondId: null, read: false },
      { id: 'E-4', folder: 'inbox', from: 'marcus@apexautos.com',             subject: 'MV dealer bond — renewal',                 preview: 'Reminder: my dealer bond expires 12/1. Please prep renewal.', date: '2026-05-12T08:20', accountId: 'A-1005', bondId: 'B-2405', read: true },
      { id: 'E-5', folder: 'inbox', from: 'noreply@bidnet.example',           subject: 'Bid opening notice — McKay HS HVAC',       preview: 'Bid opening: 5/15/2026 @ 2:00 PM. 8 bidders pre-qualified.', date: '2026-05-13T07:10', accountId: 'A-1002', bondId: 'B-2403', read: false },
      { id: 'E-6', folder: 'inbox', from: 'rtan@greatamerican.example',       subject: 'New producer agreement — countersign',     preview: 'Please countersign the attached producer agreement…', date: '2026-05-13T13:01', accountId: null, bondId: null, read: false },
      { id: 'E-7', folder: 'sent',  from: 'producers@vanderbeck-surety.example', to: 'mike@cascademech.com', subject: 'McKay HS HVAC — renewal check-in', preview: 'Hi Mike, checking in on the McKay HS HVAC bid bond — is the project still active?', date: '2026-05-10T10:15', accountId: 'A-1002', bondId: 'B-2403', read: true },
    ],
    emailTemplates: [
      {
        id: 'T-lead-intro',
        name: 'Lead — Introduction & Agency Overview',
        category: 'Lead',
        subject: '{{agency_name}} — surety bonding partner',
        body: `Hi {{contact_first}},

Great connecting today. Following up on our conversation about your bonding needs at {{lead_company}}.

A bit about {{agency_name}}: we're an independent surety producer agency appointed with Hartford, Liberty Mutual, Old Republic, Great American, Merchants Bonding, and NGM. That gives us the flexibility to place a wide range of contract, license, and probate bonds, and to shop the right market for your situation.

Next steps, when you're ready:
  1. Brief agency application (5 minutes)
  2. Recent CPA-reviewed or audited financial statements
  3. Current work-in-progress schedule
  4. Personal financial statements for each indemnitor

I'll take it from there and turn around a capacity letter for you within a few business days.

Thanks,
{{producer_name}}
{{agency_name}} · {{agency_phone}}`,
      },
      {
        id: 'T-bond-request',
        name: 'Intake — Bond Request link',
        category: 'Lead',
        subject: 'Online Bond Request — {{lead_company}}',
        body: `Hi {{contact_first}},

Please use the link below to submit your bond request online. When you click Submit, it will create an opportunity on our end and we'll reach out the same day with next steps.

  {{intake_link}}

Tip: have your contract / bid documents and obligee details handy — it'll only take a few minutes.

Thanks,
{{producer_name}}
{{agency_name}} · {{agency_phone}}`,
      },
      {
        id: 'T-intake-cq',
        name: 'Intake — Contractor Questionnaire link',
        category: 'Lead',
        subject: 'Online Contractor Questionnaire for {{lead_company}}',
        body: `Hi {{contact_first}},

To get the underwriting process moving, please fill out our online Contractor Questionnaire — it's the standard package the sureties expect:

  {{intake_link}}

It takes about 15–20 minutes. You can save and come back. When you submit, it automatically populates your file on our end so we can turn around a capacity letter quickly.

If you have your latest financial statements, WIP schedule, and Personal Financial Statements handy, this is a good time to email those over too.

Thanks,
{{producer_name}}
{{agency_name}} · {{agency_phone}}`,
      },
      {
        id: 'T-intake-pfs',
        name: 'Intake — Personal Financial Statement link',
        category: 'Underwriting',
        subject: 'Personal Financial Statement — {{contact_name}}',
        body: `Hi {{contact_first}},

The surety needs an updated Personal Financial Statement from each indemnitor. You can fill out yours securely online here:

  {{intake_link}}

It auto-fills your file on our side as soon as you submit. Schedules A (banks), B (investments), and C (real estate) are the typical detail the underwriter wants.

Thanks,
{{producer_name}}
{{agency_name}}`,
      },
      {
        id: 'T-intake-wip',
        name: 'Intake — WIP Schedule link',
        category: 'Underwriting',
        subject: 'Updated WIP Schedule needed — {{account_name}}',
        body: `Hi {{contact_first}},

Time for an updated Work-in-Progress schedule. You can enter it online here:

  {{intake_link}}

Best to do it as of your most recent month-end so the numbers tie to your interim financials.

Thanks,
{{producer_name}}
{{agency_name}}`,
      },
      {
        id: 'T-lead-application',
        name: 'Lead — Application & Indemnity Package Sent',
        category: 'Lead',
        subject: 'Application package for {{lead_company}}',
        body: `Hi {{contact_first}},

Sending over our agency application + indemnity package for your review. Highlights:

  • Agency application
  • General Indemnity Agreement (GIA)
  • Personal Financial Statement form (one per indemnitor)
  • Producer's authorization

Once you've signed and returned, we'll send it to the surety for pre-qualification. Typical turnaround is 3–5 business days once they have a complete package.

Happy to walk through anything on a quick call.

Best,
{{producer_name}}
{{agency_name}}`,
      },
      {
        id: 'T-renewal',
        name: 'Renewal Follow-up — Is the bond still needed?',
        category: 'Renewal',
        subject: '{{bond_type}} bond {{bond_number}} — renewal coming up ({{days_until_expires}} days)',
        body: `Hi {{contact_first}},

Your {{bond_type}} bond for {{obligee}} (project: {{project}}) expires on {{expires}}, which is {{days_until_expires}} days from today.

Before we renew, can you confirm a few things:

  1. Is the bond still required? (Project complete / released?)
  2. Has the contract amount changed? Current bond is {{bond_amount}}.
  3. Any changes to financials, ownership, or indemnitors we should know about?

If everything is unchanged, reply "OK to renew" and we'll get the renewal in motion. If the bond has been released, please forward the obligee's release letter.

Thanks,
{{producer_name}}
{{agency_name}} · {{agency_phone}}`
      },
      {
        id: 'T-release',
        name: 'Renewal — Confirm Release / Cancel',
        category: 'Renewal',
        subject: 'Confirming release of bond {{bond_number}}',
        body: `Hi {{contact_first}},

Per our conversation, we will not be renewing {{bond_number}} ({{bond_type}}, {{bond_amount}}, obligee: {{obligee}}). The bond will be released effective {{expires}}.

If you receive any release / acceptance letter from the obligee, please forward it for our file. Once we have that we'll close out the bond.

Thank you,
{{producer_name}}
{{agency_name}}`
      },
      {
        id: 'T-bid-followup',
        name: 'Bid Follow-up — Awaiting Results',
        category: 'Pipeline',
        subject: '{{obligee}} bid — any update?',
        body: `Hi {{contact_first}},

Just checking in on the {{obligee}} bid (project: {{project}}). Have results been announced yet?

If you're awarded, we'll have the performance and payment bonds ready to issue as soon as you forward the notice to proceed.

Thanks,
{{producer_name}}
{{agency_name}}`
      },
      {
        id: 'T-bond-issued',
        name: 'Bond Issued — Delivery',
        category: 'Bond',
        subject: 'Bond {{bond_number}} issued — copies attached',
        body: `Hi {{contact_first}},

Good news — your {{bond_type}} bond for {{obligee}} (project: {{project}}, amount: {{bond_amount}}) has been issued.

Attached are:
  • Executed bond originals
  • Power of attorney
  • Premium invoice

Please return one set of executed originals to the obligee and keep one for your records.

Let me know if you need anything else.

Best,
{{producer_name}}
{{agency_name}} · {{agency_phone}}`
      },
      {
        id: 'T-bond-report-surety',
        name: 'Report Bond to Surety',
        category: 'Bond Reporting',
        subject: 'Reporting bond {{bond_number}} — {{account_name}} / {{obligee}}',
        body: `Hi Team,

Reporting the following bond for issuance and premium billing:

  • Principal:      {{account_name}}
  • Bond Number:    {{bond_number}}
  • Bond Type:      {{bond_type}}
  • Obligee:        {{obligee}}
  • Project:        {{project}}
  • Bond Amount:    {{bond_amount}}
  • Effective:      {{effective}}
  • Expires:        {{expires}}

Premium calculator attached for reference (rate card, tier breakdown, and our commission).

Please confirm receipt and issuance timing.

Best,
{{producer_name}}
{{agency_name}} · {{agency_phone}}`
      },
      {
        id: 'T-uw-financials',
        name: 'Underwriting — Request Updated Financials / WIP',
        category: 'Underwriting',
        subject: '{{account_name}} — updated financials and WIP needed',
        body: `Hi {{contact_first}},

To keep your bonding capacity in good standing, the surety has asked for the following:

  • Year-end financial statements (CPA reviewed or audited)
  • Current work-in-progress schedule
  • Aged accounts receivable and payable
  • Updated personal financial statements for each indemnitor

Could you have these to us by end of next week? I'm happy to jump on a call to go over anything.

Thanks,
{{producer_name}}
{{agency_name}}`
      },
      {
        id: 'T-premium-due',
        name: 'Premium Invoice — Reminder',
        category: 'Billing',
        subject: 'Reminder — premium due for bond {{bond_number}}',
        body: `Hi {{contact_first}},

Friendly reminder that the premium invoice for bond {{bond_number}} ({{bond_type}}, {{bond_amount}}) is outstanding.

You can remit by check to {{agency_name}} or via ACH (routing on request).

Let me know if you have any questions.

Thanks,
{{producer_name}}`
      },
    ],
    invoices: [
      { id: 'INV-1001', bondId: 'B-2401', accountId: 'A-1001', date: '2026-03-04', amount: 18750, status: 'Paid',    qboId: 'qbo-3341', dueDate: '2026-04-03' },
      { id: 'INV-1002', bondId: 'B-2404', accountId: 'A-1003', date: '2026-01-15', amount: 1875,  status: 'Paid',    qboId: 'qbo-3342', dueDate: '2026-02-15' },
      { id: 'INV-1003', bondId: 'B-2405', accountId: 'A-1005', date: '2025-12-01', amount: 350,   status: 'Paid',    qboId: 'qbo-3343', dueDate: '2025-12-31' },
      { id: 'INV-1004', bondId: 'B-2406', accountId: 'A-1006', date: '2026-02-01', amount: 50,    status: 'Paid',    qboId: 'qbo-3344', dueDate: '2026-03-01' },
      { id: 'INV-1005', bondId: 'B-2408', accountId: 'A-1007', date: '2026-04-01', amount: 250,   status: 'Open',    qboId: null,      dueDate: '2026-05-01' },
      { id: 'INV-1006', bondId: 'B-2407', accountId: 'A-1004', date: '2026-05-09', amount: 14000, status: 'Draft',   qboId: null,      dueDate: '2026-06-08' },
    ],
    renewals: [
      // Seeded renewal workflow rows. Bonds not listed here get an
      // 'upcoming' record auto-created on first view if they expire
      // within the renewal window.
      { id: 'R-001', bondId: 'B-2403', status: 'outreach',     decision: null,     newAmount: null,    contactedDate: '2026-05-10', nextFollowUp: '2026-05-17', assignedTo: 'Casey V.', notes: [
        { date: '2026-05-10', author: 'Casey V.', text: 'Emailed Mike Trillo asking if McKay HS bid is still active and if performance bond will be needed.' },
        { date: '2026-05-12', author: 'Casey V.', text: 'Left voicemail with PM at Salem-Keizer SD confirming bond requirement.' },
      ],
        tasks: [
          { id: 'TK-R1A', text: 'Phone follow-up with Mike if no response by Friday', dueDate: '2026-05-17', assignee: 'U-1', completed: false, priority: 2, type: 'task', source: '', createdDate: '2026-05-13' },
          { id: 'TK-R1B', text: 'Confirm bond requirement with Salem-Keizer SD',     dueDate: '2026-05-19', assignee: 'U-1', completed: false, priority: 3, type: 'task', source: '', createdDate: '2026-05-12' },
        ] },
      { id: 'R-002', bondId: 'B-2407', status: 'decided',      decision: 'increase', newAmount: 1100000, contactedDate: '2026-05-08', nextFollowUp: '2026-05-20', assignedTo: 'Casey V.', notes: [
        { date: '2026-05-08', author: 'Casey V.', text: 'Spoke with Greg Adler — Port of Seattle added Phase 2 to the contract, requesting an increase from $875K to $1.1M.' },
        { date: '2026-05-09', author: 'Casey V.', text: 'Notified Liberty Mutual underwriter; awaiting endorsement.' },
      ] },
      { id: 'R-003', bondId: 'B-2401', status: 'awaiting_response', decision: null, newAmount: null, contactedDate: '2026-05-05', nextFollowUp: '2026-05-19', assignedTo: 'Casey V.', notes: [
        { date: '2026-05-05', author: 'Casey V.', text: 'Sent renewal questionnaire to Janet Pierce — need confirmation if SE Division project is still active.' },
      ] },
      { id: 'R-004', bondId: 'B-2405', status: 'upcoming',     decision: null,     newAmount: null,    contactedDate: null,         nextFollowUp: null,         assignedTo: 'Casey V.', notes: [] },
      { id: 'R-005', bondId: 'B-2408', status: 'upcoming',     decision: null,     newAmount: null,    contactedDate: null,         nextFollowUp: null,         assignedTo: 'Casey V.', notes: [] },
      { id: 'R-006', bondId: 'B-2409', status: 'decided',      decision: 'release', newAmount: null,    contactedDate: '2026-05-06', nextFollowUp: null,         assignedTo: 'Casey V.', notes: [
        { date: '2026-05-06', author: 'Casey V.', text: 'Northridge confirmed library renovation completed and accepted. Obligee letter of release received — bond will be cancelled flat.' },
      ] },
    ],
    intakeForms: [
      // A CQ that's been sent to Tony at Cascade Stone (lead L-001), not yet returned.
      { id: 'IF-1001', type: 'cq', token: 'cq-demo-tony', status: 'sent',
        leadId: 'L-001', accountId: null,
        contactName: 'Tony Miura', contactEmail: 'tony@cascadestone.example',
        sentDate: '2026-05-12', submittedDate: null, importedDate: null,
        data: {} },

      // A PFS already submitted by Brent Cho (lead L-003) — ready for import / imported.
      { id: 'IF-1002', type: 'pfs', token: 'pfs-demo-brent', status: 'submitted',
        leadId: 'L-003', accountId: null,
        contactName: 'Brent Cho', contactEmail: 'brent@whitewaterearth.example',
        sentDate: '2026-05-02', submittedDate: '2026-05-09', importedDate: null,
        data: {
          asOf: '2026-05-08',
          fullName: 'Brent Cho', dob: '1976-04-12', ssn: 'xxx-xx-4421',
          spouseName: 'Lila Cho', spouseDob: '1978-08-30', spouseSsn: 'xxx-xx-9988',
          businessName: 'Whitewater Earthworks LLC', phone: '(503) 555-0277', email: 'brent@whitewaterearth.example',
          street: '900 Wasco Loop', cityStateZip: 'Hood River, OR 97031',
          hasWill: true, bankruptcy: false,
          accountantName: 'Vargas CPA, PC', accountantPhone: '(503) 555-0301',
          attorneyName: 'Holm & Co., LLP', attorneyPhone: '(503) 555-0455',
          assets: {
            cashPrimary: 320000, cashOther: 180000, stocks: 540000,
            receivables: 90000, realEstate: 2400000, surrenderValue: 175000,
            businessVentures: 4200000, personalProperty: 95000, autos: 220000, other: 65000,
          },
          liabilities: {
            unsecured: 0, currentBills: 18000, payable: 12000,
            mortgages: 920000, secured: 110000, taxes: 0, other: 0,
          },
          schedules: {
            banks: [
              { name: 'Columbia Bank',   location: 'Hood River, OR', type: 'Checking', amount: 220000 },
              { name: 'Columbia Bank',   location: 'Hood River, OR', type: 'Savings',  amount: 100000 },
              { name: 'Fidelity',        location: 'Brokerage',      type: 'Cash',     amount: 180000 },
            ],
            stocks: [
              { name: 'VTSAX',  shares: 1800, par: '',    market: 320000, dividends: 6200, pledged: '' },
              { name: 'AAPL',   shares: 400,  par: '',    market: 95000,  dividends: 380,  pledged: '' },
              { name: 'BRK.B',  shares: 350,  par: '',    market: 125000, dividends: 0,    pledged: '' },
            ],
            realEstate: [
              { address: '900 Wasco Loop, Hood River, OR', titleHolder: 'Brent & Lila Cho', monthlyRent: 0, marketValue: 1450000, mortgageBalance: 580000 },
              { address: 'Investment — 14 Riverside Dr, Hood River, OR', titleHolder: 'Cho Family Trust', monthlyRent: 3400, marketValue: 950000, mortgageBalance: 340000 },
            ],
          },
          contingent: { contingentLiabilities: 0, lawsuits: 0, taxLiens: 0, other: '' },
          references: [
            { name: 'Columbia Bank — Mara Yu', relationship: 'Banking', phone: '(503) 555-0901', address: 'Hood River, OR' },
          ],
          signed: true, signedDate: '2026-05-09',
        },
      },

      // A WIP form already filled in by Cascade Mechanical Co. (account A-1002).
      { id: 'IF-1003', type: 'wip', token: 'wip-demo-cascade', status: 'submitted',
        leadId: null, accountId: 'A-1002',
        contactName: 'Mike Trillo', contactEmail: 'mike@cascademech.com',
        sentDate: '2026-04-30', submittedDate: '2026-05-04', importedDate: null,
        data: {
          contractorName: 'Cascade Mechanical Co.', reportDate: '2026-04-30', fiscalYearEnd: '2025-12-31',
          inProgress: [
            { jobName: 'McKay HS HVAC Replacement', contract: 480000, changeOrders: 0, revisedContract: 480000, estTotalCost: 425000, costsToDate: 38000, percentComplete: 9, earnedRevenue: 43000, billedToDate: 28000, underBilling: 15000, overBilling: 0, estGrossProfit: 55000, gpPercent: 11.5 },
            { jobName: 'Marion County Roof Top Units', contract: 285000, changeOrders: 12000, revisedContract: 297000, estTotalCost: 252000, costsToDate: 168000, percentComplete: 67, earnedRevenue: 199000, billedToDate: 215000, underBilling: 0, overBilling: 16000, estGrossProfit: 45000, gpPercent: 15.2 },
          ],
          completed: [
            { jobName: 'Cherriots HVAC Maint.', finalContract: 92000, finalCost: 78000, grossProfit: 14000 },
          ],
        },
      },

      // Bond Request examples (4 new form types)
      // Commercial BRF (License/Permit) — outbound, awaiting fill
      { id: 'IF-1004', type: 'commercialBRF', token: 'commBRF-demo-apex', status: 'sent',
        leadId: null, accountId: 'A-1005',
        contactName: 'Marcus Reed', contactEmail: 'marcus@apexautos.com',
        sentDate: '2026-05-13', submittedDate: null, importedDate: null, data: {} },

      // Contract BRF — submitted (Bid bond, ready to import as opportunity)
      { id: 'IF-1005', type: 'contractBRF', token: 'contractBRF-demo-cascade', status: 'submitted',
        leadId: null, accountId: 'A-1002',
        contactName: 'Mike Trillo', contactEmail: 'mike@cascademech.com',
        sentDate: '2026-05-09', submittedDate: '2026-05-11', importedDate: null,
        data: {
          bondType: 'Bid', neededDate: '2026-05-22',
          contractorFullName: 'Mike Trillo', contractorBusiness: 'Cascade Mechanical Co.',
          stateOfIncorporation: 'OR', contractorAddress: '210 Industrial Way, Salem, OR',
          obligee: 'Marion County',  obligeeAddress: '555 Court St NE, Salem, OR',
          projectName: 'Marion Co Justice Center HVAC', scope: 'Replace four AHUs and DDC controls.',
          startDate: '2026-07-01', completionTime: '90 days',
          warrantyPeriod: '1 year', workOnHand: '$2.1M', penalties: '$500/day LD', retainage: '5%',
          bidDate: '2026-05-22', bidTime: '2:00 PM',
          estimatedBid: 800000, bidLocation: 'Marion County Procurement, Salem',
          bidPercent: '10%',
          contractDate: null, contractAmount: null,
          paymentPct: 100, performancePct: 100, maintenancePct: null, maintenancePeriod: null,
          deliveryMethod: 'Electronic',
          deliveryAddress: '', deliveryEmail: 'mike@cascademech.com',
        },
      },

      // Subdivision App — submitted, ready to import (new opportunity + Northridge match)
      { id: 'IF-1006', type: 'subdivisionApp', token: 'subdiv-demo-northridge', status: 'submitted',
        leadId: null, accountId: 'A-1001',
        contactName: 'Janet Pierce', contactEmail: 'jpierce@northridgebuilders.com',
        sentDate: '2026-05-05', submittedDate: '2026-05-12', importedDate: null,
        data: {
          businessType: 'LLC',
          companyName: 'Northridge Builders LLC',
          ein: '93-1245678', phone: '(503) 555-0142',
          address: '742 NE Broadway', city: 'Portland', state: 'OR', zip: '97232',
          email: 'jpierce@northridgebuilders.com',
          yearStarted: '2012', yearsCurrentMgmt: '13', licenseNo: 'OR-CCB-201144',
          primaryTrade: 'GC — Commercial Building Construction',
          largestComplete: 'Hillside Estates Phase 1 — water/sewer/streets',
          largestCompletePrice: 2900000, largestCompleteYear: '2024',
          largestUnderway: 'SE Division St Repaving (Phase 2)',
          largestUnderwayPrice: 1250000, largestUnderwayPercent: 82,
          disclosures: { bankruptcy: false, litigation: false, liens: false, taxDelinquent: false, suretyLoss: false, openWithOther: false, lessThanThreeYears: false, bondedBefore: true },
          creditAuth: true,
          owners: [
            { name: 'Janet Pierce', title: 'President', email: 'jpierce@northridgebuilders.com', address: '742 NE Broadway', cityStateZip: 'Portland, OR 97232', ssn: '***-**-1234', dob: '1972-04-18', pctOwned: 60, married: 'Yes', spouseName: 'David Pierce', spouseSsn: '***-**-5566', spouseEmail: 'david.p@example.com' },
            { name: 'Tom Reilly',   title: 'CFO',       email: 'treilly@northridgebuilders.com', address: '900 NE Halsey', cityStateZip: 'Portland, OR 97232', ssn: '***-**-7711', dob: '1975-09-05', pctOwned: 40, married: 'No' },
          ],
          obligeeName: 'City of Sherwood', obligeeAddress: '22560 SW Pine St', obligeeCity: 'Sherwood', obligeeState: 'OR', obligeeZip: '97140',
          projectType: 'Residential',
          projectName: 'Stafford Ridge Subdivision — Phase 1',
          projectAddress: '14500 SW Stafford Rd', projectCity: 'Sherwood', projectState: 'OR', projectZip: '97140',
          titleHolder: 'Stafford Ridge Properties LLC', fundingLender: 'Columbia Bank',
          financingType: 'Construction Loan',
          totalCost: 1450000, fundsAvailable: 1450000,
          startDateProject: '2026-08-15', completionDateProject: '2027-08-01', maintenanceYears: 2,
          contractor: 'Northridge Builders LLC',
          bondType: 'Performance Only', bondForm: 'City / Municipality Form',
          bondLines: [
            { description: 'Subdivision Performance Bond — Phase 1 Improvements', amount: 1450000, work: 'Water mains, sanitary sewer, storm drainage, streets & curbs, landscaping' },
          ],
          maintAmount: null, maintPeriodYears: null,
          completedAccepted: false, requiredPerfBond: true,
          attachments: { engineerEstimate: true, bondForms: true, financials: true, pfs: true, operatingAgreement: true },
          comments: 'Pulling permits 6/15. Engineer estimate attached.',
        },
      },

      // Bond Express — outbound, awaiting fill (Redwood Electrical)
      { id: 'IF-1007', type: 'bondExpress', token: 'express-demo-redwood', status: 'sent',
        leadId: null, accountId: 'A-1007',
        contactName: 'Diane Park', contactEmail: 'diane@redwoodelectric.com',
        sentDate: '2026-05-13', submittedDate: null, importedDate: null, data: {} },
    ],
    automationTemplates: [
      {
        id: 'A-lead-welcome',
        name: 'New Lead Welcome Sequence',
        description: 'Standard first-touch sequence — intro email, schedule call, send application package, re-engage if no response.',
        trigger: 'lead.created',
        enabled: true,
        steps: [
          { offsetDays: 0,  type: 'email', templateId: 'T-lead-intro',       description: 'Send intro email + agency overview' },
          { offsetDays: 0,  type: 'task',  text: 'Schedule intro / discovery call' },
          { offsetDays: 3,  type: 'email', templateId: 'T-lead-application', description: 'Send agency application + indemnity package' },
          { offsetDays: 7,  type: 'task',  text: 'Phone follow-up if application not returned' },
          { offsetDays: 14, type: 'task',  text: 'Re-engage or mark lead stale' },
        ],
      },
      {
        id: 'A-bond-issued',
        name: 'New Bond — Customer Communication',
        description: 'Fires when a bond is created. Delivers the bond, kicks off invoicing, and reminds you to set up WIP for contract bonds.',
        trigger: 'bond.created',
        enabled: true,
        steps: [
          { offsetDays: 0,  type: 'email', templateId: 'T-bond-issued',     description: 'Send issued-bond delivery email with attachments' },
          { offsetDays: 0,  type: 'task',  text: 'Stamp "Reported to Bond Co." date on bond' },
          { offsetDays: 1,  type: 'task',  text: 'Confirm obligee receipt and stamp "Approved by Obligee"' },
          { offsetDays: 1,  type: 'task',  text: 'Create premium invoice in QuickBooks Online' },
          { offsetDays: 7,  type: 'email', templateId: 'T-premium-due',     description: 'Send premium invoice reminder' },
          { offsetDays: 14, type: 'task',  text: 'For contract bonds, initialize WIP tracking with kickoff %' },
        ],
      },
      {
        id: 'A-renewal-outreach',
        name: 'Renewal Outreach',
        description: 'Triggered when a bond enters the renewal window (default 60 days out). Sequences renewal email, follow-up calls, and escalation.',
        trigger: 'renewal.window-open',
        enabled: true,
        steps: [
          { offsetDays: 0,  type: 'email', templateId: 'T-renewal',  description: 'Send renewal follow-up email' },
          { offsetDays: 7,  type: 'task',  text: 'Phone follow-up if no email response' },
          { offsetDays: 14, type: 'email', templateId: 'T-renewal',  description: 'Send second renewal reminder' },
          { offsetDays: 30, type: 'task',  text: 'Escalate to lead producer / principal owner' },
          { offsetDays: 50, type: 'task',  text: 'Final decision needed — release, reduce, increase, or renew' },
        ],
      },
      {
        id: 'A-opp-prequal',
        name: 'Pre-Qualification Push',
        description: 'For new pipeline opportunities — keeps the file moving from intake to underwriter response.',
        trigger: 'opportunity.created',
        enabled: true,
        steps: [
          { offsetDays: 0, type: 'task', text: 'Confirm bid / contract requirements with principal' },
          { offsetDays: 1, type: 'task', text: 'Assemble submission package (financials, WIP, indemnity)' },
          { offsetDays: 2, type: 'task', text: 'Submit to surety underwriter' },
          { offsetDays: 3, type: 'task', text: 'Confirm underwriter receipt and target turnaround' },
          { offsetDays: 7, type: 'task', text: 'Check pre-qual status — chase if no response' },
        ],
      },
      {
        id: 'A-account-onboard',
        name: 'New Account Onboarding',
        description: 'Fires when a lead is converted to an account or an account is created fresh.',
        trigger: 'account.created',
        enabled: true,
        steps: [
          { offsetDays: 0, type: 'task', text: 'Auto-provision cloud folder structure (verify)' },
          { offsetDays: 0, type: 'task', text: 'Send welcome email + producer agreement countersign' },
          { offsetDays: 2, type: 'task', text: 'Collect missing financials and PFS' },
          { offsetDays: 5, type: 'task', text: 'Submit to surety for capacity letter' },
          { offsetDays: 7, type: 'task', text: 'Confirm capacity letter received and filed' },
        ],
      },
    ],
    todoTemplates: [
      {
        id: 'TD-onboarding',
        name: 'New Account Onboarding Checklist',
        description: 'Use whenever a new principal is added to the agency — from lead conversion or direct add.',
        appliesTo: 'account',
        items: [
          { text: 'Welcome call scheduled', offsetDays: 0 },
          { text: 'Signed agency application received', offsetDays: 2 },
          { text: 'General Indemnity Agreement (GIA) signed by all required parties', offsetDays: 5 },
          { text: 'Personal Financial Statements collected for each indemnitor', offsetDays: 7 },
          { text: 'Business financial statements collected (last 3 years CPA-reviewed/audited)', offsetDays: 7 },
          { text: 'Interim financial statement collected (most recent)', offsetDays: 7 },
          { text: 'WIP and backlog schedules collected', offsetDays: 7 },
          { text: 'Bank line / loan documentation collected', offsetDays: 10 },
          { text: 'D&B and personal credit reports pulled', offsetDays: 10 },
          { text: 'Submitted to surety for capacity pre-approval', offsetDays: 12 },
          { text: 'Capacity letter received and filed', offsetDays: 21 },
          { text: 'Cloud folder structure verified provisioned', offsetDays: 0 },
          { text: 'Onboarding complete — confirmation email sent', offsetDays: 25 },
        ],
      },
      {
        id: 'TD-bond-issuance',
        name: 'Bond Issuance Checklist',
        description: 'Standard quality check before a bond is sent to the principal.',
        appliesTo: 'bond',
        items: [
          { text: 'Bond form is the current approved version for this obligee' },
          { text: 'Principal legal name verified (matches GIA / formation docs)' },
          { text: 'Obligee name verified and addressed correctly' },
          { text: 'Bond amount and penal sum match contract / bid' },
          { text: 'Effective date and expiration date verified' },
          { text: 'Premium calculation reviewed against rate schedule' },
          { text: 'Power of Attorney attached with current date' },
          { text: 'Bond signed and sealed by attorney-in-fact' },
          { text: 'Principal signature obtained where required' },
          { text: 'QuickBooks invoice created and matched to bond' },
          { text: 'Bond delivered to principal (originals + copies)' },
          { text: '"Reported to Bond Co." date stamped' },
          { text: '"Approved by Obligee" date stamped' },
          { text: '"Sent to Principal" date stamped' },
          { text: 'Bond + POA filed in cloud folder' },
        ],
      },
      {
        id: 'TD-bid-submission',
        name: 'Bid Bond Submission Checklist',
        description: 'Pre-bid prep — make sure everything is in place before the bid opens.',
        appliesTo: 'bond',
        items: [
          { text: 'Bid date and exact submission time confirmed' },
          { text: 'Bid bond percentage / amount confirmed' },
          { text: 'Notice to Bidders / RFP pulled and reviewed' },
          { text: 'Plans & specs reviewed for any unusual bond requirements' },
          { text: 'Pre-bid conference attended (or minutes reviewed)' },
          { text: 'Submission package sent to surety underwriter' },
          { text: 'Underwriter pre-approval / capacity confirmed' },
          { text: 'Bid bond prepared (electronic + hard copy as required)' },
          { text: 'Bid bond delivered to principal before bid time' },
          { text: 'Bid result tracked in pipeline (Low / Not Low / No Bid)' },
          { text: 'If awarded — convert to performance & payment bond request' },
        ],
      },
      {
        id: 'TD-renewal-followup',
        name: 'Renewal Follow-Up Checklist',
        description: 'Use against each open renewal record.',
        appliesTo: 'renewal',
        items: [
          { text: 'Initial renewal outreach email sent' },
          { text: 'Phone follow-up made if no email response' },
          { text: 'Confirm bond still required (yes / released / project complete)' },
          { text: 'Confirm bond amount unchanged or capture new amount' },
          { text: 'Confirm contract end date / extension' },
          { text: 'Confirm any changes to indemnitors or ownership' },
          { text: 'Update updated financials / WIP if needed' },
          { text: 'Issue continuation certificate or replacement bond' },
          { text: 'Update QuickBooks invoice for renewed premium' },
          { text: 'Notify principal that renewal is complete' },
        ],
      },
      {
        id: 'TD-uw-package',
        name: 'Underwriting Submission Package',
        description: 'Documents to assemble before sending to a surety underwriter for any large submission.',
        appliesTo: 'opportunity',
        items: [
          { text: 'Year-end financials (CPA-reviewed or audited)' },
          { text: 'Interim financials (most recent quarter)' },
          { text: 'Personal Financial Statements for each indemnitor (≤12 months old)' },
          { text: 'Current Work-in-Progress (WIP) schedule' },
          { text: 'Backlog schedule' },
          { text: 'Accounts receivable aging' },
          { text: 'Accounts payable aging' },
          { text: 'Bank line / loan documentation' },
          { text: 'Bonded backlog and largest project completed to date' },
          { text: 'Reference letter from prior surety (if changing carrier)' },
          { text: 'Bid documents / contract draft (project-specific)' },
          { text: 'Cover memo summarizing the request and rationale' },
        ],
      },
      {
        id: 'TD-probate',
        name: 'Probate Bond Issuance Checklist',
        description: 'Specific to fiduciary / probate bonds — keeps you aligned with court requirements.',
        appliesTo: 'bond',
        items: [
          { text: 'Court order / appointment letter received' },
          { text: 'Court name and case number verified' },
          { text: 'Fiduciary type (Executor / Admin / PR / Guardian / Conservator / Trustee) confirmed' },
          { text: 'Penal sum verified against court order' },
          { text: 'Probate code section confirmed' },
          { text: 'Bond prepared per court-specific form requirements' },
          { text: 'Notarization completed if required by jurisdiction' },
          { text: 'Original delivered to clerk of court' },
          { text: 'File-stamped copy returned and saved' },
          { text: 'Copy delivered to fiduciary / principal' },
          { text: 'Bond filed in cloud folder' },
          { text: 'Tracking dates stamped' },
        ],
      },
      {
        id: 'TD-lead-qualify',
        name: 'Lead Qualification Checklist',
        description: 'Quick triage list to decide whether a new lead is worth pursuing.',
        appliesTo: 'lead',
        items: [
          { text: 'Confirm what bond type(s) they need' },
          { text: 'Estimate annual bond volume and premium' },
          { text: 'Confirm geography / state(s) of operation' },
          { text: 'Identify current producer / surety (if any)' },
          { text: 'Confirm rough financial picture (revenue, NW range)' },
          { text: 'Identify decision-maker and indemnitors' },
          { text: 'Match to surety appetite (which carrier?)' },
          { text: 'Mark Qualified, On Hold, or Lost / No Fit' },
        ],
      },
    ],
    // Free-floating administrative tasks not tied to a lead / account /
    // bond / opportunity / renewal. Standalone office work goes here.
    adminTasks: [
      { id: 'AT-001', text: 'Renew E&O policy (expires 6/30)',                  dueDate: '2026-06-15', assignee: 'U-1', completed: false, priority: 1, type: 'task', source: '', createdDate: '2026-05-01' },
      { id: 'AT-002', text: 'Submit quarterly NASBP membership report',         dueDate: '2026-07-01', assignee: 'U-4', completed: false, priority: 3, type: 'task', source: '', createdDate: '2026-05-09' },
      { id: 'AT-003', text: 'Reconcile trust account — month of May',           dueDate: '2026-06-05', assignee: 'U-4', completed: false, priority: 2, type: 'task', source: '', createdDate: '2026-05-10' },
      { id: 'AT-004', text: 'Schedule quarterly producer meeting w/ Hartford',  dueDate: '2026-06-12', assignee: 'U-1', completed: false, priority: 3, type: 'task', source: '', createdDate: '2026-05-12' },
      { id: 'AT-005', text: 'Order new business cards for new producer',        dueDate: null,         assignee: 'U-4', completed: true,  completedDate: '2026-05-11', priority: 4, type: 'task', source: '', createdDate: '2026-05-08' },
    ],
    marketing: {
      campaigns: [
        { id: 'MC-1', name: 'Q1 2026 GC Cold Outreach', type: 'Outbound Email', channel: 'Email',
          status: 'active', startDate: '2026-01-15', endDate: '2026-03-31',
          budget: 5000, spent: 3200, goal: 'lead-generation',
          description: 'Direct email outreach to top 500 Pacific NW general contractors — bonding capacity guide.',
          ownerId: 'U-1', tags: ['GC','Q1','PNW'],
          metrics: { impressions: 5240, clicks: 340, contacts: 128, mqls: 42, sqls: 18, opportunities: 8, wonRevenue: 42500, cost: 3200 },
        },
        { id: 'MC-2', name: 'Subdivision Bond Landing Page', type: 'Inbound', channel: 'Website',
          status: 'active', startDate: '2026-02-01', endDate: null,
          budget: 1200, spent: 850, goal: 'lead-generation',
          description: 'SEO-optimized landing page targeting subdivision developers.',
          ownerId: 'U-2', tags: ['subdivision','SEO','evergreen'],
          metrics: { impressions: 8420, clicks: 620, contacts: 45, mqls: 22, sqls: 11, opportunities: 6, wonRevenue: 18700, cost: 850 },
        },
        { id: 'MC-3', name: 'April Newsletter — Bond Market Update', type: 'Newsletter', channel: 'Email',
          status: 'complete', startDate: '2026-04-15', endDate: '2026-04-15',
          budget: 300, spent: 240, goal: 'nurture',
          description: 'Quarterly newsletter to existing prospect list.',
          ownerId: 'U-1', tags: ['newsletter','nurture'],
          metrics: { impressions: 240, clicks: 42, contacts: 3, mqls: 5, sqls: 2, opportunities: 1, wonRevenue: 4800, cost: 240 },
        },
        { id: 'MC-4', name: 'PNW Homebuilders Association Booth', type: 'Event', channel: 'Trade Show',
          status: 'complete', startDate: '2026-03-08', endDate: '2026-03-10',
          budget: 8500, spent: 8250, goal: 'lead-generation',
          description: '3-day booth at PNW Homebuilders Assoc. annual conference.',
          ownerId: 'U-1', tags: ['event','trade show','GC'],
          metrics: { impressions: 1800, clicks: 0, contacts: 62, mqls: 24, sqls: 9, opportunities: 4, wonRevenue: 28400, cost: 8250 },
        },
        { id: 'MC-5', name: 'LinkedIn Ads — Contractor License Bonds', type: 'Paid Social', channel: 'LinkedIn',
          status: 'active', startDate: '2026-04-01', endDate: '2026-06-30',
          budget: 3000, spent: 1420, goal: 'lead-generation',
          description: 'Ad targeting to new CA/OR/WA licensed contractors.',
          ownerId: 'U-2', tags: ['paid','licenseeBond'],
          metrics: { impressions: 14500, clicks: 480, contacts: 34, mqls: 14, sqls: 5, opportunities: 2, wonRevenue: 3200, cost: 1420 },
        },
        { id: 'MC-6', name: 'Referral Partner Program — Insurance Agencies', type: 'Referral', channel: 'Partner',
          status: 'active', startDate: '2025-11-01', endDate: null,
          budget: 2000, spent: 1250, goal: 'lead-generation',
          description: 'Commission split with 6 regional insurance agencies. Best-quality leads.',
          ownerId: 'U-1', tags: ['referral','partner'],
          metrics: { impressions: 0, clicks: 0, contacts: 28, mqls: 22, sqls: 15, opportunities: 12, wonRevenue: 78500, cost: 1250 },
        },
      ],
      contacts: [
        { id: 'MK-C-1', firstName: 'Janet',  lastName: 'Pierce',   email: 'jpierce@northridgebuilders.com',  company: 'Northridge Builders LLC', title: 'President',
          phone: '(503) 555-0142', source: 'Referral', campaignId: 'MC-6',
          lifecycleStage: 'customer', leadStatus: 'converted', score: 92,
          tags: ['GC','OR','high-value'], createdDate: '2024-06-14', lastActivity: '2026-05-10',
          accountId: 'A-1001', leadId: null,
          utm: { source: 'referral', medium: 'partner', campaign: 'referral-program' },
          activity: [
            { date: '2024-06-14', type: 'created', text: 'Contact created via referral from partner agency.' },
            { date: '2024-07-01', type: 'email_open', text: 'Opened "Welcome to Vanderbeck Surety".' },
            { date: '2024-07-08', type: 'form', text: 'Submitted Contractor Questionnaire.' },
            { date: '2024-08-02', type: 'converted', text: 'Converted to account A-1001.' },
            { date: '2026-05-10', type: 'email_click', text: 'Clicked link in April Newsletter.' },
          ],
        },
        { id: 'MK-C-2', firstName: 'Mike',   lastName: 'Reyes',    email: 'mike@cascademech.com',            company: 'Cascade Mechanical', title: 'Owner',
          phone: '(503) 555-0219', source: 'Cold Outreach', campaignId: 'MC-1',
          lifecycleStage: 'customer', leadStatus: 'converted', score: 88,
          tags: ['GC','WA','mechanical'], createdDate: '2025-02-10', lastActivity: '2026-05-13',
          accountId: 'A-1002', leadId: null,
          utm: { source: 'cold', medium: 'email', campaign: 'q1-gc-outreach' },
          activity: [
            { date: '2025-02-10', type: 'created', text: 'Contact created via Q1 GC Cold Outreach campaign.' },
            { date: '2025-02-17', type: 'email_open', text: 'Opened outreach email 1.' },
            { date: '2025-03-01', type: 'reply', text: 'Replied — interested in bond capacity review.' },
            { date: '2025-03-15', type: 'meeting', text: 'Discovery call — 45 min.' },
            { date: '2025-04-20', type: 'converted', text: 'Converted to account A-1002.' },
          ],
        },
        { id: 'MK-C-3', firstName: 'Sarah',  lastName: 'Chen',     email: 'sarah@pioneerlogistics.com',      company: 'Pioneer Logistics', title: 'Ops Manager',
          phone: '(208) 555-0344', source: 'Referral', campaignId: 'MC-6',
          lifecycleStage: 'customer', leadStatus: 'converted', score: 82,
          tags: ['trucking','ID','license'], createdDate: '2025-11-22', lastActivity: '2026-04-28',
          accountId: 'A-1003', leadId: null,
          utm: { source: 'referral', medium: 'partner', campaign: 'referral-program' },
          activity: [
            { date: '2025-11-22', type: 'created', text: 'Contact created — referred by Cadence Insurance.' },
            { date: '2025-12-05', type: 'converted', text: 'Converted to account A-1003.' },
          ],
        },
        { id: 'MK-C-4', firstName: 'Diane',  lastName: 'Kane',     email: 'diane@bluewatermarine.com',       company: 'BlueWater Marine', title: 'CFO',
          phone: '(206) 555-0455', source: 'Event', campaignId: 'MC-4',
          lifecycleStage: 'customer', leadStatus: 'converted', score: 79,
          tags: ['marine','WA','P&P'], createdDate: '2026-03-09', lastActivity: '2026-05-09',
          accountId: 'A-1004', leadId: null,
          utm: { source: 'event', medium: 'trade-show', campaign: 'pnw-hba-2026' },
          activity: [
            { date: '2026-03-09', type: 'created', text: 'Met at PNW HBA booth — collected business card.' },
            { date: '2026-03-15', type: 'email_open', text: 'Opened event follow-up email.' },
            { date: '2026-04-02', type: 'converted', text: 'Converted to account A-1004.' },
          ],
        },
        { id: 'MK-C-5', firstName: 'Alex',   lastName: 'Rivera',   email: 'alex@rivera-electric.com',        company: 'Rivera Electric', title: 'CEO',
          phone: '(415) 555-0611', source: 'Paid Social', campaignId: 'MC-5',
          lifecycleStage: 'sql', leadStatus: 'working', score: 74,
          tags: ['electrical','CA','license','hot'], createdDate: '2026-04-18', lastActivity: '2026-05-15',
          accountId: null, leadId: 'L-1002',
          utm: { source: 'linkedin', medium: 'cpc', campaign: 'ca-electrical-licensees' },
          activity: [
            { date: '2026-04-18', type: 'form', text: 'Submitted "Get a Quote" form on landing page.' },
            { date: '2026-04-19', type: 'email_open', text: 'Opened welcome email.' },
            { date: '2026-04-22', type: 'meeting', text: 'Discovery call — 30 min. Bonding for CSLB.' },
            { date: '2026-05-15', type: 'note', text: 'Waiting on PFS from Alex to move forward.' },
          ],
        },
        { id: 'MK-C-6', firstName: 'Priya',  lastName: 'Sharma',   email: 'priya.sharma@meadowcresthomes.com', company: 'Meadow Crest Homes', title: 'VP Development',
          phone: '(503) 555-0777', source: 'Website', campaignId: 'MC-2',
          lifecycleStage: 'mql', leadStatus: 'new', score: 62,
          tags: ['subdivision','OR','hot'], createdDate: '2026-05-06', lastActivity: '2026-05-11',
          accountId: null, leadId: null,
          utm: { source: 'google', medium: 'organic', campaign: 'subdivision-lp' },
          activity: [
            { date: '2026-05-06', type: 'form', text: 'Downloaded "Subdivision Bond Requirements Guide".' },
            { date: '2026-05-09', type: 'email_open', text: 'Opened auto-response.' },
            { date: '2026-05-11', type: 'email_click', text: 'Clicked link in nurture email #2.' },
          ],
        },
        { id: 'MK-C-7', firstName: 'James',  lastName: 'Whitfield',email: 'jw@whitfielddev.com',             company: 'Whitfield Development', title: 'Principal',
          phone: '(206) 555-0812', source: 'Website', campaignId: 'MC-2',
          lifecycleStage: 'mql', leadStatus: 'new', score: 55,
          tags: ['subdivision','WA'], createdDate: '2026-05-01', lastActivity: '2026-05-04',
          accountId: null, leadId: null,
          utm: { source: 'google', medium: 'cpc', campaign: 'subdivision-lp' },
          activity: [
            { date: '2026-05-01', type: 'form', text: 'Requested pricing on landing page.' },
            { date: '2026-05-04', type: 'email_open', text: 'Opened first response.' },
          ],
        },
        { id: 'MK-C-8', firstName: 'Robert', lastName: 'Nguyen',   email: 'rob@nguyenconstruction.com',      company: 'Nguyen Construction', title: 'Owner',
          phone: '(408) 555-0231', source: 'Cold Outreach', campaignId: 'MC-1',
          lifecycleStage: 'lead', leadStatus: 'new', score: 42,
          tags: ['GC','CA'], createdDate: '2026-02-04', lastActivity: '2026-02-04',
          accountId: null, leadId: null,
          utm: { source: 'cold', medium: 'email', campaign: 'q1-gc-outreach' },
          activity: [
            { date: '2026-02-04', type: 'email_open', text: 'Opened outreach email 1.' },
          ],
        },
        { id: 'MK-C-9', firstName: 'Emma',   lastName: 'Torres',   email: 'e.torres@evergreencivil.com',     company: 'Evergreen Civil Works', title: 'Estimator',
          phone: '(503) 555-0967', source: 'Newsletter', campaignId: 'MC-3',
          lifecycleStage: 'lead', leadStatus: 'new', score: 38,
          tags: ['civil','OR'], createdDate: '2026-04-16', lastActivity: '2026-04-16',
          accountId: null, leadId: null,
          utm: { source: 'newsletter', medium: 'email', campaign: 'q2-newsletter' },
          activity: [{ date: '2026-04-16', type: 'email_click', text: 'Clicked "Learn more" link in April Newsletter.' }],
        },
        { id: 'MK-C-10',firstName: 'Chris',  lastName: 'Baldwin',  email: 'chris@baldwincontracting.com',    company: 'Baldwin Contracting', title: 'CFO',
          phone: '(541) 555-0143', source: 'Referral', campaignId: 'MC-6',
          lifecycleStage: 'sql', leadStatus: 'working', score: 71,
          tags: ['GC','OR','warm'], createdDate: '2026-04-30', lastActivity: '2026-05-14',
          accountId: null, leadId: 'L-1003',
          utm: { source: 'referral', medium: 'partner', campaign: 'referral-program' },
          activity: [
            { date: '2026-04-30', type: 'created', text: 'Referred by Cadence Insurance.' },
            { date: '2026-05-02', type: 'meeting', text: 'Intro call — 20 min.' },
            { date: '2026-05-14', type: 'form', text: 'Submitted CQ intake form.' },
          ],
        },
        { id: 'MK-C-11',firstName: 'Nina',   lastName: 'Ostrowski',email: 'nina@ostrowskiroofing.com',       company: 'Ostrowski Roofing', title: 'Owner',
          phone: '(503) 555-0388', source: 'Cold Outreach', campaignId: 'MC-1',
          lifecycleStage: 'subscriber', leadStatus: 'new', score: 15,
          tags: ['roofing','OR'], createdDate: '2026-01-22', lastActivity: '2026-04-15',
          accountId: null, leadId: null,
          utm: { source: 'cold', medium: 'email', campaign: 'q1-gc-outreach' },
          activity: [{ date: '2026-01-22', type: 'created', text: 'Contact created.' }],
        },
        { id: 'MK-C-12',firstName: 'Doug',   lastName: 'Kim',      email: 'dkim@apexautos.com',              company: 'Apex Autos LLC', title: 'GM',
          phone: '(360) 555-0511', source: 'Cold Outreach', campaignId: 'MC-1',
          lifecycleStage: 'customer', leadStatus: 'converted', score: 68,
          tags: ['dealer','WA','license'], createdDate: '2024-10-04', lastActivity: '2026-05-12',
          accountId: 'A-1005', leadId: null,
          utm: { source: 'cold', medium: 'email', campaign: 'q1-gc-outreach' },
          activity: [{ date: '2024-10-04', type: 'converted', text: 'Converted to account A-1005.' }],
        },
      ],
      lists: [
        { id: 'ML-1', name: 'All Customers',            type: 'dynamic', description: 'Every contact whose lifecycle stage is Customer.',
          filters: [{ field: 'lifecycleStage', op: 'equals', value: 'customer' }], createdDate: '2025-01-01' },
        { id: 'ML-2', name: 'Hot MQL / SQL',            type: 'dynamic', description: 'Contacts scoring 60+ that aren\'t yet customers.',
          filters: [{ field: 'score', op: 'gte', value: 60 }, { field: 'lifecycleStage', op: 'notEquals', value: 'customer' }], createdDate: '2025-01-01' },
        { id: 'ML-3', name: 'PNW General Contractors',  type: 'dynamic', description: 'Tagged GC in OR or WA.',
          filters: [{ field: 'tags', op: 'includes', value: 'GC' }], createdDate: '2025-01-01' },
        { id: 'ML-4', name: 'April Newsletter Send',    type: 'static',  description: 'Recipient list for April 2026 newsletter (frozen).',
          contactIds: ['MK-C-1','MK-C-2','MK-C-3','MK-C-4','MK-C-8','MK-C-9','MK-C-10','MK-C-11','MK-C-12'], createdDate: '2026-04-14' },
        { id: 'ML-5', name: 'Subdivision Prospects',    type: 'dynamic', description: 'Anyone tagged "subdivision".',
          filters: [{ field: 'tags', op: 'includes', value: 'subdivision' }], createdDate: '2026-02-05' },
      ],
      emailBlasts: [
        { id: 'MB-1', name: 'April Newsletter — Q2 Bond Market Update',
          subject: 'Q2 Bond Market Update — What we\'re seeing',
          fromName: 'Casey Vanderbeck', fromEmail: 'casey@vanderbeck-surety.example',
          listId: 'ML-4', status: 'sent', sentDate: '2026-04-15',
          preview: 'Rates are firming, subdivision capacity is opening up, and…',
          stats: { sent: 9, delivered: 9, opens: 6, clicks: 3, unsubscribes: 0, bounces: 0 },
        },
        { id: 'MB-2', name: 'Q1 GC Outreach — Sequence Step 1',
          subject: 'Quick question about your bond capacity',
          fromName: 'Casey Vanderbeck', fromEmail: 'casey@vanderbeck-surety.example',
          listId: 'ML-3', status: 'sent', sentDate: '2026-01-16',
          preview: 'Hi {{firstName}}, saw {{company}} landed the {{recent_project}}…',
          stats: { sent: 340, delivered: 328, opens: 172, clicks: 41, unsubscribes: 6, bounces: 12 },
        },
        { id: 'MB-3', name: 'PNW HBA Booth Follow-up',
          subject: 'Great to meet you at PNW HBA',
          fromName: 'Casey Vanderbeck', fromEmail: 'casey@vanderbeck-surety.example',
          listId: 'ML-3', status: 'sent', sentDate: '2026-03-12',
          preview: 'Thanks for stopping by the Vanderbeck Surety booth this weekend…',
          stats: { sent: 62, delivered: 62, opens: 44, clicks: 18, unsubscribes: 1, bounces: 0 },
        },
        { id: 'MB-4', name: 'Subdivision Nurture — Step 2',
          subject: 'How much bond does your next subdivision need?',
          fromName: 'Vanderbeck Surety', fromEmail: 'hello@vanderbeck-surety.example',
          listId: 'ML-5', status: 'scheduled', sentDate: '2026-06-01',
          preview: 'Most developers we work with underestimate their aggregate…',
          stats: { sent: 0, delivered: 0, opens: 0, clicks: 0, unsubscribes: 0, bounces: 0 },
        },
        { id: 'MB-5', name: 'May Newsletter (draft)',
          subject: '', fromName: 'Casey Vanderbeck', fromEmail: 'casey@vanderbeck-surety.example',
          listId: null, status: 'draft', sentDate: null,
          preview: '', stats: { sent: 0, delivered: 0, opens: 0, clicks: 0, unsubscribes: 0, bounces: 0 },
        },
      ],
      landingPages: [
        { id: 'LP-1', name: 'Subdivision Bond Quote Request', slug: 'subdivision-quote',
          url: 'https://vanderbeck-surety.com/subdivision-quote',
          formType: 'subdivisionApp', publishedDate: '2026-02-01', campaignId: 'MC-2',
          stats: { visits: 1240, submissions: 62, conversionRate: 5.0 } },
        { id: 'LP-2', name: 'Contractor License Bond — CA', slug: 'ca-license-bond',
          url: 'https://vanderbeck-surety.com/ca-license-bond',
          formType: 'commercialBRF', publishedDate: '2026-04-01', campaignId: 'MC-5',
          stats: { visits: 480, submissions: 34, conversionRate: 7.1 } },
        { id: 'LP-3', name: 'Bond Market Guide — PDF Download', slug: 'bond-market-guide',
          url: 'https://vanderbeck-surety.com/bond-market-guide',
          formType: null, publishedDate: '2026-01-15', campaignId: 'MC-1',
          stats: { visits: 2140, submissions: 128, conversionRate: 6.0 } },
      ],
      sequences: [
        { id: 'MS-1', name: 'New Contact — Welcome Sequence',
          trigger: 'contact-created', status: 'active',
          description: 'Delivered automatically to anyone reaching Lead stage.',
          steps: [
            { day: 0, type: 'email', label: 'Welcome — who we are' },
            { day: 3, type: 'email', label: 'Bonding capacity checklist (PDF)' },
            { day: 7, type: 'task',  label: 'Call to see if they need a quote' },
            { day: 14,type: 'email', label: 'Case study: Northridge Builders' },
          ],
          stats: { enrolled: 128, active: 32, completed: 91, unsubscribed: 5 },
        },
        { id: 'MS-2', name: 'MQL → SQL Nurture',
          trigger: 'lifecycle-mql', status: 'active',
          description: 'Fires when a contact is upgraded to MQL.',
          steps: [
            { day: 0, type: 'email', label: 'Common bond questions (FAQ)' },
            { day: 5, type: 'email', label: 'Rate sheet by trade' },
            { day: 12,type: 'task',  label: 'Producer follow-up call' },
          ],
          stats: { enrolled: 84, active: 21, completed: 63, unsubscribed: 2 },
        },
        { id: 'MS-3', name: 'Renewal Reminder',
          trigger: 'renewal-90d', status: 'active',
          description: 'Auto-sends to accounts when a bond hits its 90-day renewal window.',
          steps: [
            { day: 0,  type: 'email', label: 'Bond renewal — heads up' },
            { day: 30, type: 'email', label: 'Renewal quote ready' },
            { day: 60, type: 'task',  label: 'Producer call — confirm renewal' },
          ],
          stats: { enrolled: 42, active: 8, completed: 34, unsubscribed: 0 },
        },
        { id: 'MS-4', name: 'Cold Outreach — 4-touch',
          trigger: 'manual-enroll', status: 'paused',
          description: 'Manual-enroll cold sequence, used in the Q1 GC push.',
          steps: [
            { day: 0,  type: 'email', label: 'Intro — value prop' },
            { day: 4,  type: 'email', label: 'Case study' },
            { day: 9,  type: 'email', label: 'Break-up email' },
            { day: 14, type: 'task',  label: 'LinkedIn touch' },
          ],
          stats: { enrolled: 340, active: 0, completed: 296, unsubscribed: 18 },
        },
      ],
      scoringRules: [
        { attr: 'Email opened',            points: 5  },
        { attr: 'Email link clicked',      points: 10 },
        { attr: 'Form submitted',          points: 25 },
        { attr: 'Landing page visited',    points: 8  },
        { attr: 'Meeting booked',          points: 30 },
        { attr: 'Bond capacity guide DL',  points: 15 },
        { attr: 'Replied to email',        points: 20 },
        { attr: 'Referred by partner',     points: 40 },
      ],

      integrations: {
        googleAds: { connected: false, accountName: null, customerId: null, connectedDate: null, autoSync: true, lastSync: null },
        gsc:       { connected: false, propertyUrl: null, connectedDate: null },
        ga4:       { connected: false, propertyId: null, connectedDate: null },
        semrush:   { connected: false, apiKey: null, connectedDate: null },
      },

      googleAds: {
        performance: {
          impressions: 148500, clicks: 4820, conversions: 128, cost: 5620,
          ctr: 3.2, cpc: 1.17, cpa: 43.90, roas: 4.8, conversionRate: 2.66,
          costPerConversion: 43.90, viewThroughConversions: 24,
        },
        campaigns: [
          { id: 'GA-1', name: 'Contractor License Bonds — CA', status: 'active', type: 'Search', budget: 60,
            impressions: 42800, clicks: 1420, ctr: 3.32, cost: 1420, avgCpc: 1.00,
            conversions: 42, conversionRate: 2.96, cpa: 33.81, roas: 5.2, qualityScore: 8 },
          { id: 'GA-2', name: 'Subdivision Bonds — OR / WA', status: 'active', type: 'Search', budget: 40,
            impressions: 28400, clicks: 980, ctr: 3.45, cost: 1180, avgCpc: 1.20,
            conversions: 38, conversionRate: 3.88, cpa: 31.05, roas: 6.1, qualityScore: 9 },
          { id: 'GA-3', name: 'Surety Bond Company — Brand', status: 'active', type: 'Search', budget: 20,
            impressions: 5240, clicks: 620, ctr: 11.83, cost: 240, avgCpc: 0.39,
            conversions: 24, conversionRate: 3.87, cpa: 10.00, roas: 12.4, qualityScore: 10 },
          { id: 'GA-4', name: 'Contract P&P Bonds — Retargeting', status: 'active', type: 'Display', budget: 15,
            impressions: 62400, clicks: 480, ctr: 0.77, cost: 320, avgCpc: 0.67,
            conversions: 8, conversionRate: 1.67, cpa: 40.00, roas: 2.8, qualityScore: 6 },
          { id: 'GA-5', name: 'Notary Bonds — National', status: 'paused', type: 'Search', budget: 10,
            impressions: 9660, clicks: 320, ctr: 3.31, cost: 460, avgCpc: 1.44,
            conversions: 16, conversionRate: 5.00, cpa: 28.75, roas: 3.6, qualityScore: 7 },
        ],
        adGroups: [
          { id: 'AG-1', campaignId: 'GA-1', name: 'Contractor License — Broad', keywords: 12, impressions: 26400, clicks: 820, cost: 820, conversions: 24 },
          { id: 'AG-2', campaignId: 'GA-1', name: 'Contractor License — Exact', keywords: 8,  impressions: 16400, clicks: 600, cost: 600, conversions: 18 },
          { id: 'AG-3', campaignId: 'GA-2', name: 'Subdivision — Site Improvement', keywords: 10, impressions: 14200, clicks: 520, cost: 620, conversions: 22 },
          { id: 'AG-4', campaignId: 'GA-2', name: 'Subdivision — Developer', keywords: 6, impressions: 14200, clicks: 460, cost: 560, conversions: 16 },
          { id: 'AG-5', campaignId: 'GA-3', name: 'Vanderbeck Surety',           keywords: 4, impressions: 5240, clicks: 620, cost: 240, conversions: 24 },
          { id: 'AG-6', campaignId: 'GA-4', name: 'Contract P&P — Warm audience', keywords: 0, impressions: 62400, clicks: 480, cost: 320, conversions: 8 },
        ],
        keywords: [
          { term: 'contractor license bond california', matchType: 'phrase', impressions: 12400, clicks: 480, ctr: 3.87, avgCpc: 0.95, cost: 456, conversions: 18, quality: 9, campaignId: 'GA-1' },
          { term: 'subdivision bond oregon',            matchType: 'phrase', impressions:  8200, clicks: 340, ctr: 4.15, avgCpc: 1.10, cost: 374, conversions: 14, quality: 9, campaignId: 'GA-2' },
          { term: 'performance bond contractor',        matchType: 'broad',  impressions: 24800, clicks: 620, ctr: 2.50, avgCpc: 1.35, cost: 837, conversions: 22, quality: 7, campaignId: 'GA-1' },
          { term: 'payment and performance bond cost',  matchType: 'exact',  impressions:  3400, clicks: 240, ctr: 7.06, avgCpc: 1.80, cost: 432, conversions: 16, quality: 8, campaignId: 'GA-1' },
          { term: 'vanderbeck surety',                  matchType: 'exact',  impressions:  4200, clicks: 520, ctr: 12.4, avgCpc: 0.36, cost: 187, conversions: 22, quality: 10,campaignId: 'GA-3' },
          { term: 'bid bond how much',                  matchType: 'broad',  impressions: 18400, clicks: 220, ctr: 1.20, avgCpc: 1.45, cost: 319, conversions:  6, quality: 6, campaignId: 'GA-2' },
          { term: 'site improvement bond',              matchType: 'phrase', impressions:  5600, clicks: 180, ctr: 3.21, avgCpc: 1.15, cost: 207, conversions:  8, quality: 8, campaignId: 'GA-2' },
          { term: 'notary bond',                        matchType: 'exact',  impressions:  6800, clicks: 240, ctr: 3.53, avgCpc: 1.30, cost: 312, conversions: 12, quality: 7, campaignId: 'GA-5' },
        ],
        recommendations: [
          { id:'REC-1', type:'add-keyword',    priority:'high',   title:'Add "surety bond broker" as exact match — 2400 impressions/mo forecast, low competition' },
          { id:'REC-2', type:'pause-keyword',  priority:'medium', title:'Pause "cheap bond" — 0.4% conv rate, wasted $184 last 30 days' },
          { id:'REC-3', type:'budget',         priority:'high',   title:'Increase budget on "Subdivision Bonds — OR/WA" by 30% — CPA $31 vs $60 target' },
          { id:'REC-4', type:'ad-copy',        priority:'medium', title:'Test new headline: "Same-day approval" — trending in your industry' },
          { id:'REC-5', type:'landing-page',   priority:'medium', title:'Landing page mobile speed is 3.8s — under 2.5s recommended' },
        ],
      },

      seo: {
        siteHealth: {
          overallScore: 82,
          contentScore: 88,
          technicalScore: 76,
          backlinksScore: 71,
          uxScore: 93,
          previousScore: 74,
          scannedPages: 47,
          issues: {
            critical: 2, warnings: 8, notices: 14,
          },
        },
        keywords: [
          { term: 'contractor license bond california',   position:  2, previousPosition:  4, searchVolume: 4400, difficulty: 42, ctr: 24.5, url: '/contractor-license-bond', intent: 'commercial' },
          { term: 'subdivision bond oregon',              position:  1, previousPosition:  2, searchVolume:  880, difficulty: 28, ctr: 33.2, url: '/subdivision-quote',       intent: 'commercial' },
          { term: 'performance bond contractor',          position:  6, previousPosition:  9, searchVolume: 6600, difficulty: 58, ctr:  8.4, url: '/payment-performance-bond',intent: 'informational' },
          { term: 'how much does a bid bond cost',        position:  4, previousPosition:  7, searchVolume: 2900, difficulty: 34, ctr: 12.1, url: '/blog/bid-bond-cost',      intent: 'informational' },
          { term: 'what is a surety bond',                position: 11, previousPosition: 14, searchVolume: 33100,difficulty: 71, ctr:  3.8, url: '/blog/what-is-surety-bond',intent: 'informational' },
          { term: 'site improvement bond',                position:  3, previousPosition:  5, searchVolume:  590, difficulty: 22, ctr: 18.4, url: '/subdivision-quote',       intent: 'commercial' },
          { term: 'notary bond california',               position:  8, previousPosition: 12, searchVolume: 1900, difficulty: 26, ctr:  6.2, url: '/notary-bond',             intent: 'commercial' },
          { term: 'probate bond oregon',                  position:  5, previousPosition:  5, searchVolume:  260, difficulty: 18, ctr: 10.8, url: '/probate-bond',            intent: 'commercial' },
          { term: 'surety bond company near me',          position: 14, previousPosition: 22, searchVolume: 1600, difficulty: 45, ctr:  1.8, url: '/',                        intent: 'commercial' },
          { term: 'vanderbeck surety',                    position:  1, previousPosition:  1, searchVolume:  210, difficulty:  5, ctr: 68.4, url: '/',                        intent: 'branded' },
        ],
        pages: [
          { url: '/', title: 'Vanderbeck Surety — Bond experts in the PNW',
            sessions: 4820, avgPosition: 8.2, ctr: 6.4, avgTimeOnPage: '2:34', bounceRate: 42,
            cwv: { lcp: 1.8, cls: 0.02, inp: 180 }, indexed: true },
          { url: '/contractor-license-bond', title: 'Contractor License Bond — CA & OR',
            sessions: 2140, avgPosition: 3.1, ctr: 22.8, avgTimeOnPage: '3:12', bounceRate: 28,
            cwv: { lcp: 2.1, cls: 0.04, inp: 220 }, indexed: true },
          { url: '/subdivision-quote', title: 'Subdivision Bond Quote Request',
            sessions: 1240, avgPosition: 2.4, ctr: 26.4, avgTimeOnPage: '4:08', bounceRate: 22,
            cwv: { lcp: 1.6, cls: 0.01, inp: 150 }, indexed: true },
          { url: '/payment-performance-bond', title: 'Payment & Performance Bonds',
            sessions:  980, avgPosition: 6.8, ctr: 10.4, avgTimeOnPage: '2:58', bounceRate: 34,
            cwv: { lcp: 2.4, cls: 0.06, inp: 240 }, indexed: true },
          { url: '/blog/bid-bond-cost', title: 'How much does a bid bond cost?',
            sessions: 1820, avgPosition: 4.2, ctr: 14.2, avgTimeOnPage: '3:44', bounceRate: 38,
            cwv: { lcp: 2.9, cls: 0.11, inp: 320 }, indexed: true },
          { url: '/blog/what-is-surety-bond', title: 'What is a surety bond? A plain-English guide',
            sessions: 3410, avgPosition: 11.6, ctr: 4.2, avgTimeOnPage: '5:22', bounceRate: 41,
            cwv: { lcp: 3.1, cls: 0.08, inp: 280 }, indexed: true },
          { url: '/notary-bond', title: 'Notary Bond',
            sessions:  460, avgPosition: 8.4, ctr: 6.8, avgTimeOnPage: '1:48', bounceRate: 52,
            cwv: { lcp: 2.2, cls: 0.03, inp: 210 }, indexed: true },
          { url: '/probate-bond', title: 'Probate Bond',
            sessions:  280, avgPosition: 5.2, ctr: 10.4, avgTimeOnPage: '2:12', bounceRate: 44,
            cwv: { lcp: 2.0, cls: 0.02, inp: 190 }, indexed: true },
        ],
        backlinks: {
          totalBacklinks: 342,
          referringDomains: 87,
          domainRating: 42,
          previousDR: 38,
          dofollow: 268, nofollow: 74,
          newLast30: 18, lostLast30: 4,
          topBacklinks: [
            { source: 'oregon-hba.example.com',     dr: 68, anchorText: 'preferred surety partner',      firstSeen: '2025-08-14', type: 'dofollow' },
            { source: 'pnw-contractors.example',    dr: 52, anchorText: 'Vanderbeck Surety',             firstSeen: '2025-11-02', type: 'dofollow' },
            { source: 'insurance-journal.example',  dr: 74, anchorText: 'independent producer',          firstSeen: '2026-01-18', type: 'dofollow' },
            { source: 'or-contractor-board.gov',    dr: 82, anchorText: 'approved surety',               firstSeen: '2024-03-22', type: 'dofollow' },
            { source: 'localcontractors.example',   dr: 41, anchorText: 'click here',                    firstSeen: '2026-02-04', type: 'nofollow' },
            { source: 'builders-blog.example',      dr: 36, anchorText: 'subdivision bond guide',        firstSeen: '2026-03-11', type: 'dofollow' },
          ],
        },
        audit: [
          { check: 'HTTPS enabled',                    status: 'pass', priority: 'high',   category: 'Security',
            note: 'SSL certificate valid, all pages served over HTTPS.' },
          { check: 'Mobile-friendly',                  status: 'pass', priority: 'high',   category: 'UX',
            note: '100% of scanned pages pass mobile-friendly test.' },
          { check: 'XML sitemap',                      status: 'pass', priority: 'high',   category: 'Crawlability',
            note: 'sitemap.xml found and submitted to Search Console.' },
          { check: 'robots.txt',                       status: 'pass', priority: 'medium', category: 'Crawlability',
            note: 'robots.txt configured correctly.' },
          { check: 'Core Web Vitals — LCP',           status: 'warn', priority: 'high',   category: 'Performance',
            note: '3 pages exceed 2.5s LCP — /blog/what-is-surety-bond, /blog/bid-bond-cost, /payment-performance-bond.' },
          { check: 'Structured data — Organization',   status: 'pass', priority: 'high',   category: 'Schema',
            note: 'Organization schema present on all pages.' },
          { check: 'Structured data — LocalBusiness',  status: 'fail', priority: 'high',   category: 'Schema',
            note: 'LocalBusiness schema missing — critical for local search.' },
          { check: 'Structured data — FAQPage',        status: 'warn', priority: 'medium', category: 'Schema',
            note: 'Only 2 of 8 informational pages have FAQ schema.' },
          { check: 'Meta descriptions',                status: 'warn', priority: 'medium', category: 'On-page',
            note: '5 pages missing meta description; 3 exceed 160 chars.' },
          { check: 'H1 tags',                          status: 'pass', priority: 'medium', category: 'On-page',
            note: 'Every page has a single H1.' },
          { check: 'Image alt text',                   status: 'warn', priority: 'low',    category: 'Accessibility',
            note: '12 images missing alt attributes.' },
          { check: 'Broken links',                     status: 'pass', priority: 'medium', category: 'UX',
            note: 'No 4xx or 5xx internal links detected.' },
          { check: 'Duplicate title tags',             status: 'pass', priority: 'medium', category: 'On-page',
            note: 'All titles unique.' },
          { check: 'Canonical tags',                   status: 'pass', priority: 'medium', category: 'On-page',
            note: 'Canonical tags set on 100% of pages.' },
          { check: 'Page speed — Desktop',             status: 'pass', priority: 'medium', category: 'Performance',
            note: 'Avg desktop PageSpeed: 94.' },
          { check: 'Page speed — Mobile',              status: 'warn', priority: 'high',   category: 'Performance',
            note: 'Avg mobile PageSpeed: 68 — target ≥ 80.' },
          { check: 'Internal link depth',              status: 'pass', priority: 'low',    category: 'Site structure',
            note: 'No orphaned pages; max click depth 3.' },
        ],
        contentGaps: [
          { topic: 'How to file a surety bond claim',      searchVolume: 1300, difficulty: 32, priority: 'high',   competitorsRanking: 6 },
          { topic: 'Bid bond vs performance bond',         searchVolume: 2400, difficulty: 41, priority: 'high',   competitorsRanking: 8 },
          { topic: 'Surety bond renewal process',          searchVolume:  590, difficulty: 24, priority: 'medium', competitorsRanking: 3 },
          { topic: 'License bond requirements by state',   searchVolume: 3600, difficulty: 52, priority: 'medium', competitorsRanking: 9 },
          { topic: 'Contractor prequalification checklist',searchVolume:  720, difficulty: 28, priority: 'medium', competitorsRanking: 4 },
          { topic: 'Aggregate bond limit explained',       searchVolume:  260, difficulty: 18, priority: 'low',    competitorsRanking: 2 },
        ],
      },

      aeo: {
        visibility: {
          overallScore: 58,
          previousScore: 42,
          citations30d: 87,
          previousCitations: 54,
          shareOfVoice: 12.4,
          previousShare: 8.1,
        },
        engines: [
          { name: 'ChatGPT',             citations: 34, avgPosition: 2.1, sentiment: 'positive', changePct: '+42%', logo: '💬' },
          { name: 'Perplexity',          citations: 22, avgPosition: 1.8, sentiment: 'positive', changePct: '+61%', logo: '🔍' },
          { name: 'Google AI Overviews', citations: 18, avgPosition: 3.4, sentiment: 'neutral',  changePct: '+12%', logo: '🔎' },
          { name: 'Claude',              citations:  8, avgPosition: 2.6, sentiment: 'positive', changePct: '+18%', logo: '⚡' },
          { name: 'Gemini',              citations:  5, avgPosition: 4.2, sentiment: 'neutral',  changePct: '+4%',  logo: '✨' },
        ],
        citations: [
          { engine: 'ChatGPT',    query: 'best surety bond company in Portland', cited: true,  position: 2, snippet: '…Vanderbeck Surety Agency is a well-regarded independent producer serving Pacific Northwest contractors, offering P&P, license, and subdivision bonds…', date: '2026-05-14', sentiment: 'positive' },
          { engine: 'Perplexity', query: 'what does a surety bond cost',         cited: true,  position: 1, snippet: '…According to Vanderbeck Surety, bid bond premiums range from $100–$500 while performance bond rates are typically 1–3% of the contract value…', date: '2026-05-12', sentiment: 'positive' },
          { engine: 'Google AI',  query: 'how do subdivision bonds work',        cited: true,  position: 3, snippet: '…Vanderbeck Surety notes that subdivision (site improvement) bonds guarantee the developer will complete public improvements to municipal standards…', date: '2026-05-10', sentiment: 'positive' },
          { engine: 'ChatGPT',    query: 'contractor license bond california',   cited: false, position: null, snippet: null, date: '2026-05-08', sentiment: 'n/a' },
          { engine: 'Perplexity', query: 'independent surety agents oregon',     cited: true,  position: 1, snippet: '…Vanderbeck Surety Agency is licensed in OR, WA, and CA and represents Hartford, Liberty Mutual, Great American, and Old Republic…', date: '2026-05-06', sentiment: 'positive' },
          { engine: 'Claude',     query: 'what is a probate bond',               cited: true,  position: 4, snippet: '…Vanderbeck Surety explains that a probate bond guarantees a fiduciary will faithfully execute their duties in administering an estate…', date: '2026-05-04', sentiment: 'positive' },
          { engine: 'ChatGPT',    query: 'bond agencies pacific northwest',      cited: true,  position: 2, snippet: '…Vanderbeck Surety is frequently mentioned alongside larger regional producers…', date: '2026-05-02', sentiment: 'positive' },
          { engine: 'Google AI',  query: 'when do you need a performance bond',  cited: false, position: null, snippet: null, date: '2026-04-29', sentiment: 'n/a' },
        ],
        entityCoverage: {
          wikipedia:            { status: 'missing',   note: 'No Wikipedia article. Consider commissioning one for larger AI signal.' },
          wikidata:             { status: 'partial',   note: 'Basic entity registered — missing surety-specific attributes.' },
          knowledgePanel:       { status: 'active',    note: 'Google Knowledge Panel active with logo, address, hours.' },
          googleBusiness:       { status: 'verified',  note: 'Verified with reviews (4.8 avg, 87 reviews).' },
          linkedinCompany:      { status: 'active',    note: '842 followers, 12 employees listed.' },
          crunchbase:           { status: 'missing',   note: 'No Crunchbase profile. Low-effort win for AI training signal.' },
          bbb:                  { status: 'active',    note: 'BBB A+ rating, accredited since 2018.' },
        },
        schemaMarkup: [
          { type: 'Organization',    status: 'implemented', pages: 47, note: 'Present on all pages.' },
          { type: 'LocalBusiness',   status: 'missing',     pages: 0,  note: 'Add to homepage + contact page. Critical for AI local answers.' },
          { type: 'FAQPage',         status: 'partial',     pages: 2,  note: 'Only /contractor-license-bond and /subdivision-quote have FAQ schema. Add to all informational pages.' },
          { type: 'Product',         status: 'missing',     pages: 0,  note: 'Model each bond type as a Product/Service for AI enumeration.' },
          { type: 'Article',         status: 'implemented', pages: 12, note: 'Blog posts marked up correctly.' },
          { type: 'Review',          status: 'missing',     pages: 0,  note: 'Aggregate customer reviews not marked up.' },
          { type: 'BreadcrumbList',  status: 'implemented', pages: 47, note: 'Complete.' },
          { type: 'Person (Author)', status: 'missing',     pages: 0,  note: 'Blog articles lack author schema — weakens EEAT signal.' },
        ],
        answerableQueries: [
          { query: 'how much does a bid bond cost',                 searchVolume: 2900, currentlyCited: true,  opportunity: 'maintain', suggestion: 'Already ranking — add cost calculator widget.' },
          { query: 'what is the difference between p&p and license bond', searchVolume: 480, currentlyCited: false, opportunity: 'high', suggestion: 'Write comparison page with side-by-side table + FAQ schema.' },
          { query: 'do I need a bond as a subcontractor',           searchVolume:  590, currentlyCited: false, opportunity: 'high', suggestion: 'Create Q&A page targeting subcontractor persona.' },
          { query: 'how long does bond approval take',              searchVolume:  320, currentlyCited: false, opportunity: 'medium', suggestion: 'Add turnaround time table to existing pages.' },
          { query: 'can I get a bond with bad credit',              searchVolume: 1400, currentlyCited: false, opportunity: 'high', suggestion: 'Sensitive topic — write thoughtful piece with markets that accept.' },
          { query: 'what is aggregate bond limit',                  searchVolume:  260, currentlyCited: true,  opportunity: 'maintain', suggestion: 'Add worked example calculation.' },
          { query: 'best surety bond company for contractors',      searchVolume:  880, currentlyCited: true,  opportunity: 'high', suggestion: 'Add customer proof + case studies to increase citation strength.' },
        ],
        competitorPresence: [
          { competitor: 'NationalSurety.example',    aiVisibility: 78, changePct: '+8%',  primaryEngines: ['ChatGPT','Google AI'] },
          { competitor: 'Bond-Pro.example',          aiVisibility: 62, changePct: '+22%', primaryEngines: ['Perplexity','ChatGPT'] },
          { competitor: 'SuretyDirect.example',      aiVisibility: 41, changePct: '+3%',  primaryEngines: ['Google AI'] },
          { competitor: 'PNW-Bonds.example',         aiVisibility: 28, changePct: '-4%',  primaryEngines: ['ChatGPT'] },
          { competitor: 'Vanderbeck Surety (you)',   aiVisibility: 58, changePct: '+38%', primaryEngines: ['Perplexity','ChatGPT'] },
        ],
      },
    },
    settings: {
      agency: {
        name: 'Vanderbeck Surety Agency',
        license: 'OR-1234567',
        address: '123 SW Main St, Portland, OR 97204',
        phone: '(503) 555-0100',
        email: 'producers@vanderbeck-surety.example',
        defaultCommissionRate: 25,
      },
      users: [
        { id: 'U-1', name: 'Casey Vanderbeck', initials: 'CV', email: 'casey@vanderbeck-surety.example',   role: 'Producer / Admin', color: 'bg-brand-500' },
        { id: 'U-2', name: 'Michael Stevens',  initials: 'MS', email: 'michael@vanderbeck-surety.example', role: 'Producer',         color: 'bg-emerald-600' },
        { id: 'U-3', name: 'Tom Calderon',     initials: 'TC', email: 'tom@vanderbeck-surety.example',     role: 'Producer',         color: 'bg-violet-600' },
        { id: 'U-4', name: 'Erica Park',       initials: 'EP', email: 'erica@vanderbeck-surety.example',   role: 'Office Manager',   color: 'bg-amber-600' },
      ],
      qbo: { connected: true, realmId: '9341022938293', companyName: 'Vanderbeck Surety Agency', lastSync: '2026-05-13T22:15' },
      email: { connected: true, provider: 'Microsoft 365', address: 'producers@vanderbeck-surety.example', lastSync: '2026-05-13T22:30' },
      storage: {
        provider: 'onedrive',                           // 'onedrive' | 'dropbox' | null
        connected: true,
        account: 'producers@vanderbeck-surety.example',
        siteName: 'Vanderbeck Surety — BondVault',
        rootPath: 'BondVault Files',
        lastSync: '2026-05-13T22:45',
        autoProvision: true,
      },
      fileTemplate: {
        toplevel: [
          '01_Accounts', '02_Sureties', '03_Templates', '04_Agency Admin',
        ],
        // Per-account folder tree (numbered to control sort order)
        account: [
          '00_Account Snapshot',
          '01_Company Info',
          '02_Financials',
          '03_WIP Schedules',
          '04_Personal Financials (PFS)',
          '05_Indemnity Agreements',
          '06_Bank & References',
          '07_Bonds',                                   // bonds live under here
          '08_Opportunities',                           // pipeline opportunities for this account
          '09_Renewals',                                // bond renewal files for this account
          '10_Correspondence',
        ],
        // Per-bond folder tree
        bond: [
          '01_Bond Forms',
          '02_Contract Docs',
          '03_Underwriting',
          '04_Bid Docs',
          '05_Project Status',
          '06_Invoices',
          '07_Correspondence',
          '08_Release & Closeout',
        ],
        // Per-opportunity folder tree
        opportunity: [
          '01_Bid Documents',
          '02_Submission Package',
          '03_Underwriting Correspondence',
          '04_Bid Results',
        ],
        // Per-renewal folder tree
        renewal: [
          '01_Renewal Outreach',
          '02_Updated Financials',
          '03_Continuation Certificate',
          '04_Release / Cancellation',
        ],
        // Map a document category → folder path (relative to the
        // resolved parent folder). Keys come from doc.category.
        // Use {bondFolder} / {oppFolder} / {renewalFolder} as markers.
        categoryRouting: {
          // Account-level (no bond)
          'Company Info':        '01_Company Info',
          'Financial':           '02_Financials',
          'PFS':                 '04_Personal Financials (PFS)',
          'Indemnity':           '05_Indemnity Agreements',
          'Bank Reference':      '06_Bank & References',
          'Correspondence':      '10_Correspondence',
          // WIP w/o bond goes to account WIP schedules
          'WIP Schedule':        '03_WIP Schedules',
          // Bond-level (require bondId)
          'Bond Form':           '{bondFolder}/01_Bond Forms',
          'Contract':            '{bondFolder}/02_Contract Docs',
          'Underwriting':        '{bondFolder}/03_Underwriting',
          'Bid Document':        '{bondFolder}/04_Bid Docs',
          'WIP':                 '{bondFolder}/05_Project Status',
          'Invoice':             '{bondFolder}/06_Invoices',
          'Bond Correspondence': '{bondFolder}/07_Correspondence',
          'Release':             '{bondFolder}/08_Release & Closeout',
          // Opportunity-level (require opportunityId)
          'Opportunity Bid':         '{oppFolder}/01_Bid Documents',
          'Opportunity Submission':  '{oppFolder}/02_Submission Package',
          'Opportunity Correspondence': '{oppFolder}/03_Underwriting Correspondence',
          'Opportunity Result':      '{oppFolder}/04_Bid Results',
          // Renewal-level (require renewalId)
          'Renewal Outreach':           '{renewalFolder}/01_Renewal Outreach',
          'Renewal Financials':         '{renewalFolder}/02_Updated Financials',
          'Renewal Continuation':       '{renewalFolder}/03_Continuation Certificate',
          'Renewal Release':            '{renewalFolder}/04_Release / Cancellation',
          // Surety-level
          'Producer Agreement':  '02_Sureties/{partnerName}/Producer Agreement',
          'Rate Sheet':          '02_Sureties/{partnerName}/Rate Sheets & Appetite',
          // Top-level
          'Template':            '03_Templates',
          'Agency Admin':        '04_Agency Admin',
        },
      },
    }
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn('DB load failed', e); }
    const d = sampleData();
    save(d);
    return d;
  }
  function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
  function reset() { localStorage.removeItem(KEY); }

  let state = load();

  return {
    get state() { return state; },
    save() { save(state); },
    reset() { reset(); state = load(); },
    // Convenience accessors
    accounts: () => state.accounts,
    bonds:    () => state.bonds,
    partners: () => state.partners,
    pipeline: () => state.pipeline,
    uw:       () => state.underwriting,
    docs:     () => state.documents,
    emails:   () => state.emails,
    invoices:       () => state.invoices,
    renewals:       () => (state.renewals = state.renewals || []),
    templates:      () => {
      const list = (state.emailTemplates = state.emailTemplates || []);
      // Auto-inject the Bond Reporting template if missing (protects users
      // still on older localStorage snapshots from earlier storage-key bumps).
      if (!list.some(t => t.id === 'T-bond-report-surety')) {
        list.push({
          id: 'T-bond-report-surety',
          name: 'Report Bond to Surety',
          category: 'Bond Reporting',
          subject: 'Reporting bond {{bond_number}} — {{account_name}} / {{obligee}}',
          body:
`Hi Team,

Reporting the following bond for issuance and premium billing:

  • Principal:      {{account_name}}
  • Bond Number:    {{bond_number}}
  • Bond Type:      {{bond_type}}
  • Obligee:        {{obligee}}
  • Project:        {{project}}
  • Bond Amount:    {{bond_amount}}
  • Effective:      {{effective}}
  • Expires:        {{expires}}

Premium calculator attached for reference (rate card, tier breakdown, and our commission).

Please confirm receipt and issuance timing.

Best,
{{producer_name}}
{{agency_name}} · {{agency_phone}}`,
        });
        save(state);
      }
      return list;
    },
    pipelineStages: () => (state.pipelineStages = state.pipelineStages || [
      'Request Received','Pre-Qualification','Submission in Progress',
      'Submitted to Underwriter','Underwriter Review',
      'Approved – Pending Bid Results','Awarded - Ready to Issue',
    ]),
    leads:      () => (state.leads = state.leads || []),
    automations: () => (state.automationTemplates = state.automationTemplates || []),
    todoTemplates: () => (state.todoTemplates = state.todoTemplates || []),
    intakes:     () => (state.intakeForms = state.intakeForms || []),
    findIntake:  (id) => (state.intakeForms || []).find(f => f.id === id),
    intakeByToken: (token) => (state.intakeForms || []).find(f => f.token === token),
    leadStages: () => (state.leadStages = state.leadStages || [
      'New Lead','Contacted','Qualified','Application Sent',
      'Submitted to Surety','Approved','Onboarded','Lost / No Fit',
    ]),
    findLead:   (id) => (state.leads || []).find(l => l.id === id),
    adminTasks: () => (state.adminTasks = state.adminTasks || []),
    quotes:     () => (state.quotes = state.quotes || []),
    findQuote:  (id) => (state.quotes || []).find(q => q.id === id),
    marketing: () => (state.marketing = state.marketing || { campaigns: [], contacts: [], lists: [], emailBlasts: [], landingPages: [], sequences: [], scoringRules: [] }),
    campaigns:         () => (state.marketing = state.marketing || { campaigns: [] }).campaigns = (state.marketing.campaigns || []),
    marketingContacts: () => (state.marketing = state.marketing || { contacts: [] }).contacts = (state.marketing.contacts || []),
    marketingLists:    () => (state.marketing = state.marketing || { lists: [] }).lists = (state.marketing.lists || []),
    emailBlasts:       () => (state.marketing = state.marketing || { emailBlasts: [] }).emailBlasts = (state.marketing.emailBlasts || []),
    landingPages:      () => (state.marketing = state.marketing || { landingPages: [] }).landingPages = (state.marketing.landingPages || []),
    marketingSequences:() => (state.marketing = state.marketing || { sequences: [] }).sequences = (state.marketing.sequences || []),
    scoringRules:      () => (state.marketing = state.marketing || { scoringRules: [] }).scoringRules = (state.marketing.scoringRules || []),
    findCampaign:        (id) => (state.marketing && state.marketing.campaigns  || []).find(c => c.id === id),
    findMarketingContact:(id) => (state.marketing && state.marketing.contacts   || []).find(c => c.id === id),
    findMarketingList:   (id) => (state.marketing && state.marketing.lists      || []).find(l => l.id === id),
    findEmailBlast:      (id) => (state.marketing && state.marketing.emailBlasts|| []).find(b => b.id === id),
    findLandingPage:     (id) => (state.marketing && state.marketing.landingPages|| []).find(p => p.id === id),
    findSequence:        (id) => (state.marketing && state.marketing.sequences  || []).find(s => s.id === id),
    users:      () => (state.settings.users = state.settings.users || []),
    findUser:   (id) => (state.settings.users || []).find(u => u.id === id),
    settings:       () => state.settings,

    findAccount: (id) => state.accounts.find(a => a.id === id),
    findBond:    (id) => state.bonds.find(b => b.id === id),
    findPartner: (id) => state.partners.find(p => p.id === id),
  };
})();
