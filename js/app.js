window.App = (() => {
  const DEFAULT_VIEW = 'dashboard';

  function go(view) {
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

  function openQuickQuote() {
    go('calculator');
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
    const startView = (location.hash || '').replace('#/','') || DEFAULT_VIEW;
    go(startView);

    document.getElementById('global-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') globalSearch(e.target.value);
    });

    // Welcome toast on first load
    setTimeout(() => {
      U.toast('Welcome to SureFlow — interactive preview', 'info');
    }, 400);
  }

  return { go, init, openNewBond, openQuickQuote };
})();

document.addEventListener('DOMContentLoaded', App.init);
