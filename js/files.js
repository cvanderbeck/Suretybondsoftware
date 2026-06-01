// ---------- Cloud storage / folder structure helpers ----------
//
// Defines:
//  - The folder template (in DB.settings().fileTemplate)
//  - resolvePath(doc) — where a document belongs on disk
//  - buildTree() — the full virtual folder tree, used by the
//    Documents view's folder explorer
//
// The "storage" connection is simulated for the demo — the same
// pattern QBO and Email use. Providers supported in the picker:
// OneDrive (Microsoft Graph) and Dropbox.

window.Files = (() => {

  // --- Sanitize a name so it's valid on OneDrive / Dropbox / NTFS ---
  function safe(name) {
    return String(name || '').replace(/[\/\\:*?"<>|]/g, '-').trim();
  }

  // --- Folder names ---
  function accountFolder(a) {
    if (!a) return '(Unknown Account)';
    return safe(`${a.name} — ${a.id}`);
  }
  function bondFolder(b) {
    if (!b) return '(Unknown Bond)';
    const tag = b.project || b.obligee || b.type;
    return safe(`${b.number} — ${tag}`);
  }
  function opportunityFolder(o) {
    if (!o) return '(Unknown Opportunity)';
    const year = (o.dueDate || '').slice(0,4) || String(new Date().getFullYear());
    const tag = o.obligee || o.bondType || o.id;
    return safe(`${year} — ${tag}`);
  }
  function renewalFolder(r) {
    if (!r) return '(Unknown Renewal)';
    const b = DB.findBond(r.bondId) || {};
    return safe(`${b.number || r.id} — ${(b.expires || '').slice(0,4)} renewal`);
  }
  function partnerFolder(p) {
    if (!p) return '(Unknown Surety)';
    return safe(p.name);
  }

  // --- Resolve a document to a full path ---
  function resolvePath(doc) {
    const s = DB.settings();
    const t = s.fileTemplate;
    const root = s.storage?.rootPath || 'BondVault Files';

    const a = doc.accountId ? DB.findAccount(doc.accountId) : null;
    const b = doc.bondId    ? DB.findBond(doc.bondId)    : null;
    const o = doc.opportunityId ? DB.pipeline().find(p => p.id === doc.opportunityId) : null;
    const r = doc.renewalId ? DB.renewals().find(x => x.id === doc.renewalId) : null;
    const p = doc.partnerId ? DB.findPartner(doc.partnerId) : null;

    const routing = t.categoryRouting[doc.category] || '';
    const isBondLevel    = routing.includes('{bondFolder}');
    const isOppLevel     = routing.includes('{oppFolder}');
    const isRenewalLevel = routing.includes('{renewalFolder}');
    const isPartnerLevel = routing.includes('{partnerName}');
    const isToplevel     = ['Template','Agency Admin'].includes(doc.category);

    // Build segments
    const segs = [root];

    if (isToplevel) {
      // 03_Templates or 04_Agency Admin
      segs.push(routing);
    } else if (isPartnerLevel && p) {
      segs.push(routing.replace('{partnerName}', partnerFolder(p)));
    } else if (a) {
      segs.push('01_Accounts', accountFolder(a));
      if (b && isBondLevel) {
        segs.push('07_Bonds', bondFolder(b));
        segs.push(routing.replace('{bondFolder}', '').replace(/^\/+/, ''));
      } else if (o && isOppLevel) {
        segs.push('08_Opportunities', opportunityFolder(o));
        segs.push(routing.replace('{oppFolder}', '').replace(/^\/+/, ''));
      } else if (r && isRenewalLevel) {
        segs.push('09_Renewals', renewalFolder(r));
        segs.push(routing.replace('{renewalFolder}', '').replace(/^\/+/, ''));
      } else {
        segs.push(routing || '99_Unsorted');
      }
    } else {
      segs.push('04_Agency Admin', '_Unfiled');
    }

    return segs.filter(Boolean).join('/');
  }

  // --- Build the virtual folder tree based on accounts, bonds, partners
  //     and existing documents. Each node: { name, path, children, files } ---
  function buildTree() {
    const s = DB.settings();
    const t = s.fileTemplate;
    const root = s.storage?.rootPath || 'BondVault Files';

    const tree = makeNode(root, root);

    // Top-level skeleton
    t.toplevel.forEach(top => addChild(tree, top));

    // 01_Accounts/[Account Name] — [ID]/...
    const acctsNode = getChild(tree, '01_Accounts');
    DB.accounts().forEach(a => {
      const aNode = addChild(acctsNode, accountFolder(a));
      t.account.forEach(sub => addChild(aNode, sub));

      // Per-bond folders under 07_Bonds
      const bondsNode = getChild(aNode, '07_Bonds');
      DB.bonds().filter(b => b.accountId === a.id).forEach(b => {
        const bNode = addChild(bondsNode, bondFolder(b));
        t.bond.forEach(sub => addChild(bNode, sub));
      });

      // Per-opportunity folders under 08_Opportunities
      const oppsNode = getChild(aNode, '08_Opportunities');
      DB.pipeline().filter(o => o.accountId === a.id).forEach(o => {
        const oNode = addChild(oppsNode, opportunityFolder(o));
        (t.opportunity || []).forEach(sub => addChild(oNode, sub));
      });

      // Per-renewal folders under 09_Renewals (renewals reach the account
      // via their bond)
      const renewalsNode = getChild(aNode, '09_Renewals');
      const accountBondIds = new Set(DB.bonds().filter(b => b.accountId === a.id).map(b => b.id));
      DB.renewals().filter(r => accountBondIds.has(r.bondId)).forEach(r => {
        const rNode = addChild(renewalsNode, renewalFolder(r));
        (t.renewal || []).forEach(sub => addChild(rNode, sub));
      });
    });

    // 02_Sureties/[Surety Name]/
    const suretiesNode = getChild(tree, '02_Sureties');
    DB.partners().forEach(p => {
      const pNode = addChild(suretiesNode, partnerFolder(p));
      ['Producer Agreement','Rate Sheets & Appetite','Forms Library','Correspondence'].forEach(sub => addChild(pNode, sub));
    });

    // Distribute existing documents into the tree
    DB.docs().forEach(d => {
      const fullPath = resolvePath(d);
      placeFile(tree, fullPath, d);
    });

    return tree;
  }

  function makeNode(name, path) { return { name, path, children: [], files: [] }; }
  function addChild(parent, name) {
    let n = parent.children.find(c => c.name === name);
    if (!n) { n = makeNode(name, parent.path + '/' + name); parent.children.push(n); }
    return n;
  }
  function getChild(parent, name) {
    return parent.children.find(c => c.name === name) || addChild(parent, name);
  }

  function placeFile(root, fullPath, doc) {
    const segs = fullPath.split('/');
    // First seg = root name; verify it matches
    if (segs[0] !== root.name) return;
    let cur = root;
    for (let i = 1; i < segs.length; i++) {
      if (!segs[i]) continue;
      cur = addChild(cur, segs[i]);
    }
    cur.files.push(doc);
  }

  // --- Counts: depth-first total of files within a node + descendants ---
  function fileCount(node) {
    return node.files.length + node.children.reduce((s, c) => s + fileCount(c), 0);
  }

  // --- Auto-provision: simulated cloud folder creation ---
  function provisionAccount(a, opts = {}) {
    const s = DB.settings().storage;
    if (!s || !s.connected || !s.autoProvision) return false;
    s.lastSync = new Date().toISOString();
    DB.save();
    if (!opts.silent) {
      const root = s.rootPath || 'BondVault Files';
      const path = `${root}/01_Accounts/${accountFolder(a)}/`;
      const provider = s.provider === 'onedrive' ? 'OneDrive' : 'Dropbox';
      U.toast(`📁 Provisioned ${provider} folders at ${path}`);
    }
    return true;
  }

  function provisionBond(b, opts = {}) {
    const s = DB.settings().storage;
    if (!s || !s.connected || !s.autoProvision) return false;
    s.lastSync = new Date().toISOString();
    DB.save();
    if (!opts.silent) {
      const a = DB.findAccount(b.accountId);
      const root = s.rootPath || 'BondVault Files';
      const path = `${root}/01_Accounts/${accountFolder(a)}/07_Bonds/${bondFolder(b)}/`;
      const provider = s.provider === 'onedrive' ? 'OneDrive' : 'Dropbox';
      U.toast(`📁 Provisioned ${provider} folders at ${path}`);
    }
    return true;
  }

  return {
    resolvePath, buildTree, fileCount,
    accountFolder, bondFolder, opportunityFolder, renewalFolder, partnerFolder, safe,
    provisionAccount, provisionBond,
  };
})();
