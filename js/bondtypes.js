// ---------- Bond type catalog + type-specific field schema ----------
// One source of truth for the bond types BondVault supports and which
// fields appear on the opportunity / bond forms for each type.
//
// Usage:
//   BondTypes.TYPES                         // ['Bid', 'Payment & Performance', …]
//   BondTypes.renderFields(type, data, opts)// HTML for the type-specific card
//   BondTypes.readFields(type)              // collect values into an object
//   BondTypes.fieldSummary(type, data)      // compact one-liner for cards/tables

window.BondTypes = (() => {

  const TYPES = ['Bid', 'Payment & Performance', 'Subdivision/Site Improvement', 'License/Permit', 'Probate'];

  // Per-type schema. Field types: text | number | money | date |
  // select | multiselect | checkbox | textarea.
  const SCHEMA = {
    'Bid': {
      blurb: 'Project bid, awaiting results',
      fields: [
        { key: 'bidOpenDate',           label: 'Bid Opening Date',         type: 'date'   },
        { key: 'bidPercent',            label: 'Bid Bond %',               type: 'select', options: ['5%','10%','20%','100% of bid'] },
        { key: 'estimatedContractValue',label: 'Estimated Contract Value', type: 'money'  },
        { key: 'preBidConference',      label: 'Pre-Bid Conference Date',  type: 'date'   },
        { key: 'prequalRequired',       label: 'Pre-Qualification Required', type: 'checkbox' },
        { key: 'plansLocation',         label: 'Plans & Specs Location',   type: 'text'   },
        { key: 'engineerEstimate',      label: "Engineer's Estimate",      type: 'money'  },
        { key: 'fundingSource',         label: 'Funding Source',           type: 'select', options: ['Public — Federal','Public — State','Public — Local','Private','Mixed'] },
      ],
    },

    'Payment & Performance': {
      blurb: 'Performance + payment on a construction contract',
      fields: [
        { key: 'contractDate',          label: 'Contract Date',            type: 'date'   },
        { key: 'contractType',          label: 'Contract Type',            type: 'select', options: ['Lump Sum','Unit Price','Cost Plus','GMP','Design-Build','Time & Materials'] },
        { key: 'noticeToProceed',       label: 'Notice to Proceed',        type: 'date'   },
        { key: 'projectStart',          label: 'Project Start Date',       type: 'date'   },
        { key: 'projectEnd',            label: 'Substantial Completion',   type: 'date'   },
        { key: 'liquidatedDamages',     label: 'Liquidated Damages ($/day)', type: 'money' },
        { key: 'retainagePercent',      label: 'Retainage %',              type: 'number' },
        { key: 'performancePct',        label: 'Performance Bond %',       type: 'number' },
        { key: 'paymentPct',            label: 'Payment Bond %',           type: 'number' },
        { key: 'warrantyPeriodMonths',  label: 'Warranty Period (months)', type: 'number' },
        { key: 'taxIncluded',           label: 'Taxes Included in Contract', type: 'checkbox' },
      ],
    },

    'Subdivision/Site Improvement': {
      blurb: 'Land development & municipal improvements',
      fields: [
        { key: 'subdivisionName',       label: 'Subdivision / Development Name', type: 'text' },
        { key: 'jurisdiction',          label: 'Municipality / Jurisdiction',    type: 'text' },
        { key: 'lotCount',              label: 'Lot Count',                      type: 'number' },
        { key: 'engineersEstimate',     label: "Engineer's Estimate",            type: 'money' },
        { key: 'improvements',          label: 'Improvements Covered',           type: 'multiselect',
          options: ['Water','Sanitary Sewer','Storm Drainage','Streets & Paving','Curbs & Sidewalks','Grading','Landscaping','Streetlights','Traffic Signals','Erosion Control'] },
        { key: 'maintenancePeriodMonths', label: 'Maintenance Period (months)',  type: 'number' },
        { key: 'completionDeadline',    label: 'Completion Deadline',            type: 'date' },
        { key: 'phaseNumber',           label: 'Phase Number',                   type: 'text' },
        { key: 'releaseConditions',     label: 'Release Conditions',             type: 'textarea' },
      ],
    },

    'License/Permit': {
      blurb: 'Statutory / regulatory bond, fixed amount, periodic renewal',
      fields: [
        { key: 'licenseType',           label: 'License/Permit Type',      type: 'select',
          options: ['Contractor License','Auto Dealer','Motor Vehicle Title Service','Freight Broker (BMC-84)','Mortgage Broker','Money Transmitter','Notary Public','Travel Agent','Process Server','Other'] },
        { key: 'licenseNumber',         label: 'License/Permit #',         type: 'text' },
        { key: 'issuingAuthority',      label: 'Issuing Authority',        type: 'text' },
        { key: 'statutoryAmount',       label: 'Statutory Amount',         type: 'money' },
        { key: 'renewalTerm',           label: 'Renewal Term',             type: 'select',
          options: ['Annual','Biennial','4-Year','Continuous','Other'] },
        { key: 'classification',        label: 'Classification / Specialty', type: 'text' },
        { key: 'continuousObligation',  label: 'Continuous Obligation',    type: 'checkbox' },
      ],
    },

    'Probate': {
      blurb: 'Court-ordered fiduciary bond',
      fields: [
        { key: 'courtName',             label: 'Court Name',                type: 'text' },
        { key: 'caseNumber',            label: 'Case Number',               type: 'text' },
        { key: 'estateName',            label: 'Estate / Decedent / Ward',  type: 'text' },
        { key: 'fiduciaryType',         label: 'Fiduciary Type',            type: 'select',
          options: ['Executor','Administrator','Personal Representative','Guardian','Conservator','Trustee','Receiver'] },
        { key: 'judge',                 label: 'Judge',                     type: 'text' },
        { key: 'courtOrderDate',        label: 'Court Order Date',          type: 'date' },
        { key: 'probateCodeSection',    label: 'Probate Code Section',      type: 'text' },
        { key: 'estateValue',           label: 'Estate / Trust Value',      type: 'money' },
      ],
    },
  };

  // Map any old type names from earlier versions into the new catalog
  // so existing data continues to render sensibly.
  const LEGACY = {
    'Performance':       'Payment & Performance',
    'Payment':           'Payment & Performance',
    'License':           'License/Permit',
    'Court':             'Probate',
    'Subdivision':       'Subdivision/Site Improvement',
    'Customs':           'License/Permit',
  };
  function normalize(t) { return LEGACY[t] || t; }

  function schemaFor(type) { return SCHEMA[normalize(type)] || null; }
  function blurbFor(type)  { return (schemaFor(type) || {}).blurb || ''; }

  // --------- HTML rendering ----------
  function renderField(f, data) {
    const v = data && data[f.key];
    const id = `ts-${f.key}`;
    switch (f.type) {
      case 'date':
        return `<div><div class="field-label">${U.esc(f.label)}</div>
          <input id="${id}" type="date" class="field-input" value="${U.esc(v||'')}"></div>`;
      case 'number':
        return `<div><div class="field-label">${U.esc(f.label)}</div>
          <input id="${id}" type="number" class="field-input" value="${v != null ? v : ''}"></div>`;
      case 'money':
        return `<div><div class="field-label">${U.esc(f.label)}</div>
          <input id="${id}" type="number" class="field-input" value="${v != null ? v : ''}" placeholder="$"></div>`;
      case 'select':
        return `<div><div class="field-label">${U.esc(f.label)}</div>
          <select id="${id}" class="field-select">
            <option value="">—</option>
            ${f.options.map(o => `<option ${o === v ? 'selected' : ''}>${U.esc(o)}</option>`).join('')}
          </select></div>`;
      case 'checkbox':
        return `<div class="flex items-end pb-1.5"><label class="text-sm flex items-center gap-2">
          <input id="${id}" type="checkbox" class="chk" ${v ? 'checked' : ''}> ${U.esc(f.label)}
        </label></div>`;
      case 'textarea':
        return `<div class="col-span-2"><div class="field-label">${U.esc(f.label)}</div>
          <textarea id="${id}" class="field-textarea" rows="2">${U.esc(v||'')}</textarea></div>`;
      case 'multiselect': {
        const selected = Array.isArray(v) ? v : [];
        return `<div class="col-span-2"><div class="field-label">${U.esc(f.label)}</div>
          <div id="${id}" class="grid grid-cols-3 gap-1" data-ms="${f.key}">
            ${f.options.map(o => `
              <label class="text-sm flex items-center gap-2 px-2 py-1 rounded hover:bg-cream-50">
                <input type="checkbox" class="chk" value="${U.esc(o)}" ${selected.includes(o)?'checked':''}>
                ${U.esc(o)}
              </label>`).join('')}
          </div></div>`;
      }
      default:
        return `<div><div class="field-label">${U.esc(f.label)}</div>
          <input id="${id}" class="field-input" value="${U.esc(v||'')}"></div>`;
    }
  }

  function renderFields(type, data, opts = {}) {
    const schema = schemaFor(type);
    if (!schema) {
      return `<div class="text-sm text-ink-300 p-3">Select a bond type to see type-specific fields.</div>`;
    }
    const ts = (data && data.typeSpecific) || {};
    return `
      <div class="grid grid-cols-2 gap-3">
        ${schema.fields.map(f => renderField(f, ts)).join('')}
      </div>
      ${opts.showBlurb !== false ? `<div class="text-[11px] text-ink-300 mt-2 italic">${U.esc(schema.blurb)}</div>` : ''}
    `;
  }

  function readFields(type) {
    const schema = schemaFor(type);
    if (!schema) return {};
    const out = {};
    schema.fields.forEach(f => {
      const id = `ts-${f.key}`;
      const el = document.getElementById(id);
      if (!el) return;
      if (f.type === 'checkbox')      out[f.key] = !!el.checked;
      else if (f.type === 'multiselect') {
        const checked = Array.from(el.querySelectorAll('input[type=checkbox]:checked')).map(x => x.value);
        out[f.key] = checked;
      }
      else if (f.type === 'number' || f.type === 'money') {
        out[f.key] = el.value === '' ? null : +el.value;
      }
      else                            out[f.key] = el.value || null;
    });
    return out;
  }

  // Concise summary string for table/card display.
  function fieldSummary(type, data) {
    const ts = (data && data.typeSpecific) || {};
    switch (normalize(type)) {
      case 'Bid':
        return [ts.bidPercent ? `${ts.bidPercent} bid` : null,
                ts.bidOpenDate ? `opens ${U.date(ts.bidOpenDate)}` : null,
                ts.estimatedContractValue ? `est ${U.usd(ts.estimatedContractValue)}` : null]
                .filter(Boolean).join(' · ');
      case 'Payment & Performance':
        return [ts.contractType, ts.projectEnd ? `complete ${U.date(ts.projectEnd)}` : null,
                ts.liquidatedDamages ? `LD ${U.usd(ts.liquidatedDamages)}/day` : null]
                .filter(Boolean).join(' · ');
      case 'Subdivision/Site Improvement':
        return [ts.subdivisionName, ts.lotCount ? `${ts.lotCount} lots` : null,
                ts.jurisdiction].filter(Boolean).join(' · ');
      case 'License/Permit':
        return [ts.licenseType, ts.licenseNumber ? `#${ts.licenseNumber}` : null,
                ts.renewalTerm].filter(Boolean).join(' · ');
      case 'Probate':
        return [ts.fiduciaryType, ts.estateName, ts.caseNumber ? `case ${ts.caseNumber}` : null]
                .filter(Boolean).join(' · ');
      default: return '';
    }
  }

  return { TYPES, SCHEMA, schemaFor, blurbFor, normalize, renderFields, readFields, fieldSummary };
})();
