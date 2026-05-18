// ---------- Duplicate Account Detection & Merge ----------
// Scans DB.accounts() for likely duplicates and merges all
// related records (bonds, pipeline, leads, docs, emails, intake
// forms, etc.) into the chosen primary account.

window.Duplicates = (() => {

  const NORMALIZE_SUFFIXES = /\b(llc|l\.l\.c\.|inc|inc\.|corp|corp\.|corporation|co|co\.|company|ltd|ltd\.|llp|l\.l\.p\.)\b/g;

  function normName(name) {
    return (name || '').toLowerCase()
      .replace(NORMALIZE_SUFFIXES, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }
  function normEmail(e) { return (e || '').toLowerCase().trim(); }
  function normPhone(p) { return (p || '').replace(/\D/g, ''); }
  function normEin(e)   { return (e || '').replace(/[^0-9]/g, ''); }

  // Returns groups of accounts that share an identity signal.
  function detect() {
    const accounts = DB.accounts();
    const buckets = new Map();

    const addBucket = (key, reason, accountId) => {
      if (!buckets.has(key)) buckets.set(key, { reason, ids: new Set() });
      buckets.get(key).ids.add(accountId);
    };

    accounts.forEach(a => {
      const emails = new Set();
      const push = (e) => { const n = normEmail(e); if (n && n.length > 3) emails.add(n); };
      push(a.email);
      (a.contacts || []).forEach(c => push(c.email));
      emails.forEach(e => addBucket('email:'+e, `Shared email — ${e}`, a.id));

      const ein = normEin(a.taxId);
      if (ein && ein.length >= 5) addBucket('ein:'+ein, `Shared EIN — ${a.taxId}`, a.id);

      const phone = normPhone(a.phone);
      if (phone && phone.length >= 7) addBucket('phone:'+phone, `Shared phone — ${a.phone}`, a.id);

      const n = normName(a.name);
      if (n && n.length > 3) addBucket('name:'+n, `Similar name — "${a.name}"`, a.id);

      if (a.dba) {
        const nd = normName(a.dba);
        if (nd && nd.length > 3) addBucket('name:'+nd, `DBA matches name — "${a.dba}"`, a.id);
      }
    });

    // Collapse groups that share the same account set; combine reasons.
    const seen = new Map();
    for (const { reason, ids } of buckets.values()) {
      if (ids.size < 2) continue;
      const key = Array.from(ids).sort().join(',');
      if (!seen.has(key)) seen.set(key, { reasons: [reason], accountIds: Array.from(ids) });
      else seen.get(key).reasons.push(reason);
    }

    return Array.from(seen.values()).map(g => ({
      reasons: g.reasons,
      accounts: g.accountIds.map(id => DB.findAccount(id)).filter(Boolean),
    }));
  }

  // Quick pair-check used after an intake import: returns other
  // accounts that look like duplicates of the given one.
  function findMatches(account) {
    if (!account) return [];
    const matches = new Set();
    const myEmails = new Set([
      normEmail(account.email),
      ...(account.contacts || []).map(c => normEmail(c.email)),
    ].filter(Boolean));
    const myEin = normEin(account.taxId);
    const myPhone = normPhone(account.phone);
    const myName = normName(account.name);

    DB.accounts().forEach(a => {
      if (a.id === account.id) return;
      const emails = new Set([
        normEmail(a.email),
        ...(a.contacts || []).map(c => normEmail(c.email)),
      ].filter(Boolean));
      for (const e of emails) if (myEmails.has(e)) { matches.add(a); return; }
      if (myEin && myEin.length >= 5 && normEin(a.taxId) === myEin) { matches.add(a); return; }
      if (myPhone && myPhone.length >= 7 && normPhone(a.phone) === myPhone) { matches.add(a); return; }
      if (myName && myName.length > 3 && normName(a.name) === myName) { matches.add(a); return; }
    });
    return Array.from(matches);
  }

  // Merge `secondaryId` into `primaryId`.
  function merge(primaryId, secondaryId) {
    const primary   = DB.findAccount(primaryId);
    const secondary = DB.findAccount(secondaryId);
    if (!primary || !secondary || primary === secondary) return;

    // Reassign related records
    DB.bonds().forEach(b   => { if (b.accountId   === secondaryId) b.accountId   = primaryId; });
    DB.pipeline().forEach(p=> { if (p.accountId   === secondaryId) p.accountId   = primaryId; });
    DB.docs().forEach(d    => { if (d.accountId   === secondaryId) d.accountId   = primaryId; });
    DB.emails().forEach(e  => { if (e.accountId   === secondaryId) e.accountId   = primaryId; });
    DB.invoices().forEach(i=> { if (i.accountId   === secondaryId) i.accountId   = primaryId; });
    DB.intakes().forEach(i => { if (i.accountId   === secondaryId) i.accountId   = primaryId; });
    DB.leads().forEach(l   => { if (l.convertedAccountId === secondaryId) l.convertedAccountId = primaryId; });

    // Fill missing top-level fields from secondary
    ['dba','contact','email','phone','address','city','state','zip','taxId','credit','type','industry'].forEach(k => {
      if (!primary[k] && secondary[k]) primary[k] = secondary[k];
    });

    // Merge company
    primary.company = primary.company || {};
    Object.keys(secondary.company || {}).forEach(k => {
      if (!primary.company[k] && secondary.company[k]) primary.company[k] = secondary.company[k];
    });

    // Merge contacts (dedupe by email then by name)
    primary.contacts = primary.contacts || [];
    (secondary.contacts || []).forEach(c => {
      const same = primary.contacts.some(x =>
        (x.email && c.email && x.email.toLowerCase() === c.email.toLowerCase()) ||
        (!c.email && x.name && c.name && x.name.toLowerCase() === c.name.toLowerCase())
      );
      if (!same) primary.contacts.push({ ...c, id: c.id || U.uid('C'), primary: false });
    });

    // Merge indemnitors (dedupe by name)
    primary.indemnitors = primary.indemnitors || [];
    (secondary.indemnitors || []).forEach(i => {
      const same = primary.indemnitors.some(x => x.name && i.name && x.name.toLowerCase() === i.name.toLowerCase());
      if (!same) primary.indemnitors.push({ ...i, id: i.id || U.uid('I') });
    });

    // Renewals — keep the most recent dates
    primary.renewals = primary.renewals || {};
    const sR = secondary.renewals || {};
    ['financialsLast','wipLast'].forEach(k => {
      if (!primary.renewals[k] || (sR[k] && sR[k] > primary.renewals[k])) {
        if (sR[k]) primary.renewals[k] = sR[k];
      }
    });
    ['financialsInterval','wipInterval'].forEach(k => {
      if (!primary.renewals[k] && sR[k]) primary.renewals[k] = sR[k];
    });

    // Combine notes + log merge entry
    const tag = `[Merged from ${secondary.name} (${secondary.id}) on ${new Date().toISOString().slice(0,10)}]`;
    primary.notes = (primary.notes ? primary.notes + '\n\n' : '') + tag + (secondary.notes ? '\n' + secondary.notes : '');
    primary.mergeHistory = primary.mergeHistory || [];
    primary.mergeHistory.push({ from: { id: secondary.id, name: secondary.name }, date: new Date().toISOString() });

    DB.state.accounts = DB.accounts().filter(a => a.id !== secondaryId);
    DB.save();
    return primary;
  }

  return { detect, findMatches, merge, normName, normEmail, normEin, normPhone };
})();
