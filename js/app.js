window.App = (() => {
  const DEFAULT_VIEW = 'dashboard';

  function go(view) {
    // Public intake routing — accepts paths like "intake/cq/<token>"
    if (typeof view === 'string' && view.startsWith('intake')) {
      const parts = view.split('/').filter(Boolean);
      const type  = parts[1];
      const token = parts[2] ? decodeURIComponent(parts[2]) : null;
      document.body.classList.add('intake-mode');
      Views.intake.render({ type, token });
      location.hash = '#/' + view;
      return;
    }
    document.body.classList.remove('intake-mode');
    if (!Views[view]) view = DEFAULT_VIEW;
    document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    Views[view].render();
    location.hash = '#/' + view;
  }

  function bindNav() {
    document.querySelectorAll('#sidebar-nav a[data-view]').forEach(el => {
      el.addEventListener('click', () => go(el.dataset.view));
    });
  }

  function openNewBond(accountId) {
    Views.bonds.openForm();
    if (accountId) {
      // pre-select after the modal renders
      setTimeout(() => {
        const sel = document.getElementById('bf-acct');
        if (sel) sel.value = accountId;
      }, 50);
    }
  }

  function openNewOpportunity() {
    go('pipeline');
    setTimeout(() => Views.pipeline.addModal(), 50);
  }

  function openNewLead() {
    go('leads');
    setTimeout(() => Views.leads.newLead(), 50);
  }

  function globalSearch(q) {
    if (!q) return;
    q = q.toLowerCase();
    // Try to find a match across accounts, bonds, partners
    const b = DB.bonds().find(x => x.number.toLowerCase().includes(q));
    if (b) { go('bonds'); setTimeout(() => Views.bonds.open(b.id), 50); return; }
    const a = DB.accounts().find(x => x.name.toLowerCase().includes(q));
    if (a) { go('accounts'); setTimeout(() => Views.accounts.open(a.id), 50); return; }
    const p = DB.partners().find(x => x.name.toLowerCase().includes(q));
    if (p) { go('partners'); return; }
    U.toast('No matches found', 'info');
  }

  function init() {
    Icons.mount();
    bindNav();
    // Auto-create renewal workflows for any bond entering the 90-day window
    // (and refresh snapshots) so emails can map to them immediately.
    if (Views.renewals && Views.renewals.syncRenewalsForWindow) {
      try { Views.renewals.syncRenewalsForWindow(); } catch (e) { console.warn(e); }
    }
    const startView = (location.hash || '').replace('#/','') || DEFAULT_VIEW;
    go(startView);

    document.getElementById('global-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') globalSearch(e.target.value);
    });

    // Welcome toast on first load
    setTimeout(() => {
      U.toast('Welcome to BondVault — interactive preview', 'info');
    }, 400);
  }

  return { go, init, openNewBond, openNewOpportunity, openNewLead, openNewRequest: openNewOpportunity };
})();

document.addEventListener('DOMContentLoaded', App.init);
