window.Views = window.Views || {};
Views.partners = {
  render() {
    const list = DB.partners();
    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Bond Company Partners</h1>
          <p class="section-sub">Sureties your independent producer agency is appointed with. Track appetite, contact, portal, and commission terms.</p>
        </div>
        <button class="btn-primary" onclick="Views.partners.openForm()">+ Add Partner</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${list.map(p => {
          const bonds = DB.bonds().filter(b => b.partnerId === p.id);
          const premium = bonds.reduce((s,b)=>s+(b.premium||0),0);
          const commission = bonds.reduce((s,b)=>s+(b.premium||0)*(b.commissionRate||0)/100,0);
          return `
            <div class="card p-5">
              <div class="flex items-start justify-between">
                <div>
                  <div class="text-base font-semibold text-slate-900">${U.esc(p.name)}</div>
                  <div class="text-xs text-slate-500">AM Best: <b>${U.esc(p.rating)}</b></div>
                </div>
                ${p.active ? '<span class="badge badge-green">Active</span>' : '<span class="badge badge-slate">Inactive</span>'}
              </div>
              <div class="text-sm text-slate-700 mt-3"><b>Appetite:</b> ${U.esc(p.appetite)}</div>
              <div class="divider"></div>
              <div class="text-sm space-y-1">
                <div><b>Contact:</b> ${U.esc(p.contactName)}</div>
                <div><b>Email:</b> <a class="text-brand-600" href="mailto:${p.email}">${U.esc(p.email)}</a></div>
                <div><b>Phone:</b> ${U.esc(p.phone)}</div>
                <div><b>Portal:</b> <a class="text-brand-600 underline" href="${p.portalUrl}" target="_blank" rel="noopener">Open underwriting portal ↗</a></div>
                <div><b>Std Commission:</b> ${p.commissionRate}%</div>
              </div>
              <div class="divider"></div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div><div class="text-xs text-slate-500">Bonds</div><div class="font-semibold">${bonds.length}</div></div>
                <div><div class="text-xs text-slate-500">Premium</div><div class="font-semibold">${U.usd(premium)}</div></div>
                <div><div class="text-xs text-slate-500">Commission</div><div class="font-semibold text-emerald-700">${U.usd(commission)}</div></div>
              </div>
              <div class="mt-4 flex items-center justify-end gap-1">
                <button class="btn-ghost" onclick="Views.partners.openForm('${p.id}')">Edit</button>
                <button class="btn-secondary" onclick="App.go('calculator')">Quote</button>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  },

  openForm(id) {
    const p = id ? DB.findPartner(id) : { id: U.uid('P'), active: true, commissionRate: 25 };
    const body = `
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2"><div class="field-label">Partner Name</div><input id="pf-name" class="field-input" value="${U.esc(p.name||'')}"></div>
        <div><div class="field-label">AM Best Rating</div><input id="pf-rating" class="field-input" value="${U.esc(p.rating||'A')}"></div>
        <div><div class="field-label">Default Commission %</div><input id="pf-comm" type="number" step="0.5" class="field-input" value="${p.commissionRate}"></div>
        <div class="col-span-2"><div class="field-label">Appetite</div><input id="pf-app" class="field-input" value="${U.esc(p.appetite||'')}"></div>
        <div><div class="field-label">Contact Name</div><input id="pf-contact" class="field-input" value="${U.esc(p.contactName||'')}"></div>
        <div><div class="field-label">Contact Email</div><input id="pf-email" class="field-input" value="${U.esc(p.email||'')}"></div>
        <div><div class="field-label">Contact Phone</div><input id="pf-phone" class="field-input" value="${U.esc(p.phone||'')}"></div>
        <div><div class="field-label">Portal URL</div><input id="pf-portal" class="field-input" value="${U.esc(p.portalUrl||'')}"></div>
        <div class="col-span-2 flex items-center gap-2"><input id="pf-active" type="checkbox" class="chk" ${p.active?'checked':''}><label for="pf-active" class="text-sm">Active</label></div>
      </div>
    `;
    const footer = `<button class="btn-ghost" data-close>Cancel</button><button class="btn-primary" onclick="Views.partners.save('${p.id}')">Save</button>`;
    const m = U.modal({ title: id ? 'Edit Partner' : 'New Partner', body, footer });
    m.el.querySelector('[data-close]').addEventListener('click', m.close);
  },

  save(id) {
    let p = DB.findPartner(id);
    const isNew = !p;
    if (isNew) { p = { id }; DB.partners().push(p); }
    p.name   = document.getElementById('pf-name').value;
    p.rating = document.getElementById('pf-rating').value;
    p.commissionRate = +document.getElementById('pf-comm').value;
    p.appetite     = document.getElementById('pf-app').value;
    p.contactName  = document.getElementById('pf-contact').value;
    p.email        = document.getElementById('pf-email').value;
    p.phone        = document.getElementById('pf-phone').value;
    p.portalUrl    = document.getElementById('pf-portal').value;
    p.active       = document.getElementById('pf-active').checked;
    DB.save();
    U.closeModals();
    U.toast(isNew ? 'Partner added' : 'Partner updated');
    this.render();
  }
};
