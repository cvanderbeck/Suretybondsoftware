// ---------- Sample / seed data, persistence layer ----------
window.DB = (() => {
  const KEY = 'bondvault.db.v2';

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
    ],
    bonds: (() => {
      // Compute relative dates so the Renewals view has fresh content
      // regardless of when the demo is opened.
      const today = new Date();
      const days = (n) => {
        const d = new Date(today); d.setDate(d.getDate() + n);
        return d.toISOString().slice(0,10);
      };
      return [
        { id: 'B-2401', number: 'SF-2024-00121', accountId: 'A-1001', partnerId: 'P-01', type: 'Performance', obligee: 'City of Portland - PBOT', project: 'SE Division St Repaving (Phase 2)', amount: 1250000, premium: 18750, rate: 1.5, commissionRate: 25, effective: days(-300), expires: days(65),  status: 'Active' },
        { id: 'B-2402', number: 'SF-2024-00122', accountId: 'A-1001', partnerId: 'P-01', type: 'Payment',     obligee: 'City of Portland - PBOT', project: 'SE Division St Repaving (Phase 2)', amount: 1250000, premium: 0,     rate: 0,   commissionRate: 0,  effective: days(-300), expires: days(65),  status: 'Active' },
        { id: 'B-2403', number: 'SF-2024-00130', accountId: 'A-1002', partnerId: 'P-02', type: 'Bid',         obligee: 'Salem-Keizer School District', project: 'McKay HS HVAC Replacement',     amount: 480000,  premium: 0,     rate: 0,   commissionRate: 0,  effective: days(-30),  expires: days(28),  status: 'Active' },
        { id: 'B-2404', number: 'SF-2024-00141', accountId: 'A-1003', partnerId: 'P-03', type: 'License',     obligee: 'FMCSA',                  project: 'BMC-84 Broker Authority',          amount: 75000,   premium: 1875,  rate: 2.5, commissionRate: 30, effective: days(-120), expires: days(245), status: 'Active' },
        { id: 'B-2405', number: 'SF-2024-00150', accountId: 'A-1005', partnerId: 'P-04', type: 'License',     obligee: 'Oregon DMV',             project: 'MV Dealer Bond',                   amount: 50000,   premium: 350,   rate: 0.7, commissionRate: 30, effective: days(-330), expires: days(35),  status: 'Active' },
        { id: 'B-2406', number: 'SF-2024-00155', accountId: 'A-1006', partnerId: 'P-05', type: 'License',     obligee: 'Idaho SOS',              project: 'Notary Bond',                      amount: 10000,   premium: 50,    rate: 0.5, commissionRate: 35, effective: days(-90),  expires: days(1370),status: 'Active' },
        { id: 'B-2407', number: 'SF-2024-00170', accountId: 'A-1004', partnerId: 'P-02', type: 'Performance', obligee: 'Port of Seattle',        project: 'Pier 66 Dredging Maintenance',     amount: 875000,  premium: 14000, rate: 1.6, commissionRate: 25, effective: days(-13),  expires: days(50),  status: 'Active' },
        { id: 'B-2408', number: 'SF-2024-00171', accountId: 'A-1007', partnerId: 'P-03', type: 'License',     obligee: 'CA CSLB',                project: 'Contractor License Bond',          amount: 25000,   premium: 250,   rate: 1.0, commissionRate: 30, effective: days(-42),  expires: days(82),  status: 'Active' },
        { id: 'B-2409', number: 'SF-2024-00180', accountId: 'A-1001', partnerId: 'P-06', type: 'Performance', obligee: 'Multnomah County',       project: 'Library Renovation',               amount: 620000,  premium: 9300,  rate: 1.5, commissionRate: 25, effective: days(-280), expires: days(85),  status: 'Active' },
      ];
    })(),
    partners: [
      { id: 'P-01', name: 'Hartford Surety',          rating: 'A+ XV',  appetite: 'Mid-large GC, Performance/Payment up to $25M single', contactName: 'Tom Reyes',       email: 'tom.reyes@hartford-surety.example',     phone: '(800) 555-0101', portalUrl: 'https://underwriting.hartford-surety.example', commissionRate: 25, active: true },
      { id: 'P-02', name: 'Liberty Mutual Surety',    rating: 'A   XV', appetite: 'Mid GC, mechanical, marine', contactName: 'Priya Subramanian',                                  email: 'psubramanian@lms.example',              phone: '(800) 555-0102', portalUrl: 'https://lms.example/portal',                  commissionRate: 25, active: true },
      { id: 'P-03', name: 'Old Republic Surety',      rating: 'A   XI', appetite: 'License & permit, small contract, freight broker',         contactName: 'James OConnor',                                      email: 'joconnor@oldrepublic.example',          phone: '(800) 555-0103', portalUrl: 'https://oldrepublic.example/agent',           commissionRate: 30, active: true },
      { id: 'P-04', name: 'Merchants Bonding',        rating: 'A   IX', appetite: 'Small contractor + commercial license',                    contactName: 'Erica Chen',                                          email: 'erica@merchantsbonding.example',        phone: '(800) 555-0104', portalUrl: 'https://merchantsbonding.example/producer',    commissionRate: 30, active: true },
      { id: 'P-05', name: 'NGM Insurance — Surety',   rating: 'A   IX', appetite: 'Small commercial / notary / probate',                       contactName: 'Linda Park',                                          email: 'lpark@ngm.example',                     phone: '(800) 555-0105', portalUrl: 'https://ngm.example/agentportal',             commissionRate: 35, active: true },
      { id: 'P-06', name: 'Great American Surety',    rating: 'A+ XIV', appetite: 'GC large contract, subdivision, court',                     contactName: 'Robert Tan',                                          email: 'rtan@greatamerican.example',            phone: '(800) 555-0106', portalUrl: 'https://greatamerican.example/portal',         commissionRate: 25, active: true },
    ],
    pipeline: [
      { id: 'PL-001', stage: 'Prospect',    accountId: 'A-1001', bondType: 'Performance', amount: 2500000, obligee: 'ODOT', dueDate: '2026-06-10', notes: 'Hwy 26 widening — RFP just dropped', producer: 'CV', probability: 30 },
      { id: 'PL-002', stage: 'Quoting',     accountId: 'A-1002', bondType: 'Performance', amount: 800000,  obligee: 'Marion County', dueDate: '2026-05-22', notes: 'Submitted to Hartford + Liberty', producer: 'CV', probability: 55 },
      { id: 'PL-003', stage: 'Submitted',   accountId: 'A-1004', bondType: 'Performance', amount: 875000,  obligee: 'Port of Seattle', dueDate: '2026-05-20', notes: 'Awaiting Liberty UW decision', producer: 'CV', probability: 70 },
      { id: 'PL-004', stage: 'Bid Awaiting',accountId: 'A-1002', bondType: 'Bid',         amount: 480000,  obligee: 'Salem-Keizer SD', dueDate: '2026-05-15', notes: 'Bid opens 5/15 @ 2pm', producer: 'CV', probability: 50 },
      { id: 'PL-005', stage: 'Bid Awaiting',accountId: 'A-1007', bondType: 'Bid',         amount: 320000,  obligee: 'BART', dueDate: '2026-05-28', notes: 'Public bid, electrical subcontract', producer: 'CV', probability: 40 },
      { id: 'PL-006', stage: 'Won',         accountId: 'A-1001', bondType: 'Performance', amount: 1250000, obligee: 'City of Portland', dueDate: '2026-03-04', notes: 'Issued — see B-2401', producer: 'CV', probability: 100 },
      { id: 'PL-007', stage: 'Lost',        accountId: 'A-1003', bondType: 'Performance', amount: 450000,  obligee: 'WSDOT', dueDate: '2026-04-30', notes: 'Lost on price', producer: 'CV', probability: 0 },
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
      { id: 'D-1', name: 'Northridge_FinancialStmt_2025.pdf', size: 1.4*1024*1024, type: 'application/pdf', accountId: 'A-1001', bondId: null, category: 'Financial', uploaded: '2026-04-30' },
      { id: 'D-2', name: 'Cascade_WIP_Apr2026.xlsx',         size: 220*1024,      type: 'spreadsheet',     accountId: 'A-1002', bondId: 'B-2403', category: 'WIP', uploaded: '2026-04-28' },
      { id: 'D-3', name: 'BlueWater_GIA_signed.pdf',         size: 650*1024,      type: 'application/pdf', accountId: 'A-1004', bondId: 'B-2407', category: 'Indemnity', uploaded: '2026-05-02' },
      { id: 'D-4', name: 'Pioneer_BMC84_Form.pdf',           size: 180*1024,      type: 'application/pdf', accountId: 'A-1003', bondId: 'B-2404', category: 'Bond Form', uploaded: '2026-01-12' },
    ],
    emails: [
      { id: 'E-1', from: 'tom.reyes@hartford-surety.example', subject: 'Re: SF-2024-00121 — Performance bond issued', preview: 'Hi Casey, attached find the executed performance & payment bonds for Northridge…', date: '2026-03-04T15:12', accountId: 'A-1001', bondId: 'B-2401', read: true },
      { id: 'E-2', from: 'psubramanian@lms.example',         subject: 'BlueWater Marine — UW requests',           preview: 'Casey, we need the 12-month WIP detail and bank line confirmation before we can issue…', date: '2026-05-09T09:44', accountId: 'A-1004', bondId: 'B-2407', read: false },
      { id: 'E-3', from: 'jpierce@northridgebuilders.com',   subject: 'New bid opportunity — ODOT Hwy 26',        preview: 'We are bidding the Hwy 26 widening project, est. value $2.5M, need performance + payment…', date: '2026-05-10T11:02', accountId: 'A-1001', bondId: null, read: false },
      { id: 'E-4', from: 'marcus@apexautos.com',             subject: 'MV dealer bond — renewal',                 preview: 'Reminder: my dealer bond expires 12/1. Please prep renewal.', date: '2026-05-12T08:20', accountId: 'A-1005', bondId: 'B-2405', read: true },
      { id: 'E-5', from: 'noreply@bidnet.example',           subject: 'Bid opening notice — McKay HS HVAC',       preview: 'Bid opening: 5/15/2026 @ 2:00 PM. 8 bidders pre-qualified.', date: '2026-05-13T07:10', accountId: 'A-1002', bondId: 'B-2403', read: false },
      { id: 'E-6', from: 'rtan@greatamerican.example',       subject: 'New producer agreement — countersign',     preview: 'Please countersign the attached producer agreement…', date: '2026-05-13T13:01', accountId: null, bondId: null, read: false },
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
    settings: {
      agency: {
        name: 'Vanderbeck Surety Agency',
        license: 'OR-1234567',
        address: '123 SW Main St, Portland, OR 97204',
        phone: '(503) 555-0100',
        email: 'producers@vanderbeck-surety.example',
        defaultCommissionRate: 25,
      },
      qbo: { connected: true, realmId: '9341022938293', companyName: 'Vanderbeck Surety Agency', lastSync: '2026-05-13T22:15' },
      email: { connected: true, provider: 'Microsoft 365', address: 'producers@vanderbeck-surety.example', lastSync: '2026-05-13T22:30' },
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
    invoices: () => state.invoices,
    renewals: () => (state.renewals = state.renewals || []),
    settings: () => state.settings,

    findAccount: (id) => state.accounts.find(a => a.id === id),
    findBond:    (id) => state.bonds.find(b => b.id === id),
    findPartner: (id) => state.partners.find(p => p.id === id),
  };
})();
