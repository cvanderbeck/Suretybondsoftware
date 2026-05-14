// ---------- PDF generation using jsPDF + AutoTable ----------
window.PDF = (() => {
  const { jsPDF } = window.jspdf;

  function header(doc, title) {
    doc.setFillColor(58, 93, 255);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('BondVault', 14, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Surety Agency OS', 14, 20);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(title, 196, 14, { align: 'right' });
    const s = DB.settings().agency;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(s.name, 196, 19, { align: 'right' });
    doc.setTextColor(30);
  }

  function footer(doc) {
    const s = DB.settings().agency;
    const pg = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pg; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text(`${s.name} · ${s.address} · ${s.phone}`, 14, 290);
      doc.text(`Page ${i} of ${pg}`, 196, 290, { align: 'right' });
    }
  }

  function bondCertificate(bond) {
    const doc = new jsPDF();
    const acct = DB.findAccount(bond.accountId) || {};
    const partner = DB.findPartner(bond.partnerId) || {};
    header(doc, 'Surety Bond Certificate');

    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(`${bond.type} Bond`, 14, 38);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Bond Number: ${bond.number}`, 14, 45);
    doc.text(`Issued: ${U.date(bond.effective)}    Expires: ${U.date(bond.expires)}`, 14, 50);

    doc.autoTable({
      startY: 60,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold' },
      body: [
        ['Principal',  acct.name || ''],
        ['Principal Address', `${acct.city || ''}, ${acct.state || ''}`],
        ['Obligee',    bond.obligee || ''],
        ['Project / Description', bond.project || ''],
        ['Bond Amount', U.usd(bond.amount)],
        ['Premium',     U.usd(bond.premium)],
        ['Surety Partner', partner.name || ''],
        ['Surety AM Best', partner.rating || ''],
      ]
    });

    let y = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(10);
    doc.text('Terms & Conditions:', 14, y); y += 6;
    doc.setFontSize(9); doc.setTextColor(80);
    const terms = [
      '1. This bond is conditioned upon the faithful performance of all obligations described above.',
      '2. The Surety\'s liability under this bond shall not exceed the bond amount.',
      '3. Any modification of this bond must be in writing and signed by all parties.',
      '4. This bond is governed by the laws of the State noted in the Principal\'s address.',
    ];
    terms.forEach(t => { doc.text(t, 14, y, { maxWidth: 182 }); y += 6; });

    y += 14;
    doc.setTextColor(30); doc.setFontSize(10);
    doc.line(14, y, 84, y); doc.line(120, y, 196, y);
    doc.text('Principal', 14, y+5); doc.text('Attorney-in-Fact (Surety)', 120, y+5);

    footer(doc);
    return doc;
  }

  function invoice(inv) {
    const doc = new jsPDF();
    const bond = DB.findBond(inv.bondId) || {};
    const acct = DB.findAccount(inv.accountId) || {};
    header(doc, `Invoice ${inv.id}`);

    doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.text('Bill To:', 14, 38);
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text([acct.name || '', acct.contact || '', `${acct.city || ''}, ${acct.state || ''}`, acct.email || ''], 14, 44);

    doc.setFont('helvetica','bold');
    doc.text('Invoice Details:', 130, 38);
    doc.setFont('helvetica','normal');
    doc.text(`Invoice #: ${inv.id}`, 130, 44);
    doc.text(`Date: ${U.date(inv.date)}`, 130, 49);
    doc.text(`Due: ${U.date(inv.dueDate)}`, 130, 54);
    doc.text(`Status: ${inv.status}`, 130, 59);

    doc.autoTable({
      startY: 80,
      head: [['Bond #','Type','Project','Premium','Amount']],
      body: [[bond.number || '—', bond.type || '—', bond.project || '—', U.usd(bond.premium||0), U.usd(inv.amount)]],
      theme: 'striped',
      headStyles: { fillColor: [58, 93, 255], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.text('Total Due:', 140, y); doc.text(U.usd(inv.amount), 196, y, { align: 'right' });

    y += 18;
    doc.setFontSize(9); doc.setTextColor(80);
    doc.text('Make checks payable to ' + DB.settings().agency.name + ' or remit via ACH (routing on request).', 14, y);

    footer(doc);
    return doc;
  }

  function premiumQuote(q) {
    const doc = new jsPDF();
    header(doc, 'Premium Quote');
    doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.text(`${q.bondType} Bond — ${U.usd(q.amount)}`, 14, 38);
    doc.setFont('helvetica','normal'); doc.setFontSize(10);
    doc.text(`Principal: ${q.principal || 'TBD'}`, 14, 44);
    doc.text(`Obligee:   ${q.obligee || 'TBD'}`, 14, 49);
    doc.text(`Effective: ${U.date(q.effective)}`, 14, 54);

    doc.autoTable({
      startY: 64,
      head: [['Surety','Tier Rate','Adj. Rate','Annual Premium','Commission']],
      body: q.options.map(o => [
        o.partner, `${o.baseRate}%`, `${o.adjRate}%`,
        U.usd(o.premium), `${o.commissionRate}% (${U.usd(o.commission)})`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [58, 93, 255], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    let y = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(9); doc.setTextColor(80);
    doc.text('Quotes are indicative and subject to final underwriting. Valid for 30 days.', 14, y);

    footer(doc);
    return doc;
  }

  function bondReport(bonds) {
    const doc = new jsPDF({ orientation: 'landscape' });
    // Custom landscape header
    doc.setFillColor(58, 93, 255);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setTextColor(255);
    doc.setFontSize(18); doc.setFont('helvetica','bold');
    doc.text('BondVault', 14, 14);
    doc.setFontSize(12);
    doc.text('Active Bonds Report', 283, 14, { align: 'right' });
    doc.setTextColor(30);

    doc.autoTable({
      startY: 28,
      head: [['Bond #','Principal','Type','Obligee','Amount','Premium','Comm.','Effective','Expires','Status']],
      body: bonds.map(b => {
        const a = DB.findAccount(b.accountId) || {};
        return [b.number, a.name || '', b.type, b.obligee, U.usd(b.amount), U.usd(b.premium),
          `${b.commissionRate}%`, U.date(b.effective), U.date(b.expires), b.status];
      }),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2.5 },
    });
    footer(doc);
    return doc;
  }

  return { bondCertificate, invoice, premiumQuote, bondReport };
})();
