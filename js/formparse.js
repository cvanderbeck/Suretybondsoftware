// Form upload + auto-fill helper.
// Reads a PDF / text file the user uploads (e.g. a Contractor Questionnaire,
// Bond Request Form, etc.) and extracts common fields so the New Lead / New
// Opportunity modals can be pre-populated.
window.FormParse = (() => {

  // ---------- file -> raw text ----------
  async function readText(file) {
    const name = (file.name || '').toLowerCase();
    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
      return await readPdf(file);
    }
    if (file.type && file.type.startsWith('image/')) {
      throw new Error('Image scans aren\'t supported in this preview — please upload a text PDF, .txt, or .csv.');
    }
    return await file.text();
  }

  async function readPdf(file) {
    if (!window.pdfjsLib) throw new Error('PDF reader still loading — try again in a moment.');
    const buf = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buf }).promise;
    let out = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      // Group items into lines by Y position so labels and values stay paired
      const lines = {};
      tc.items.forEach(it => {
        const y = Math.round(it.transform[5]);
        (lines[y] = lines[y] || []).push({ x: it.transform[4], s: it.str });
      });
      Object.keys(lines)
        .map(Number).sort((a,b) => b - a)
        .forEach(y => {
          lines[y].sort((a,b) => a.x - b.x);
          out += lines[y].map(p => p.s).join(' ') + '\n';
        });
      out += '\n';
    }
    return out;
  }

  // ---------- text -> fields ----------
  const FIELD_PATTERNS = {
    companyName: [
      /(?:company|business|firm|principal|legal\s+name|applicant|contractor|entity|organization)\s*(?:name)?\s*[:\-]\s*([^\n]+)/i,
      /(?:doing\s+business\s+as|d\/?b\/?a)\s*[:\-]\s*([^\n]+)/i,
    ],
    contactName: [
      /(?:contact\s+(?:name|person)|primary\s+contact|attention|attn|representative)\s*[:\-]\s*([^\n]+)/i,
      /(?:name\s+of\s+contact)\s*[:\-]\s*([^\n]+)/i,
    ],
    contactTitle: [
      /(?:title|position|role)\s*[:\-]\s*([^\n]+)/i,
    ],
    email: [
      /[\w.+-]+@[\w-]+\.[\w.-]+/,
    ],
    phone: [
      /(?:phone|telephone|tel|mobile|cell)\s*(?:#|number)?\s*[:\-]?\s*(\+?\d[\d\s().-]{7,}\d)/i,
      /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
    ],
    address: [
      /(?:street|mailing\s+address|business\s+address|address)\s*(?:line\s*1)?\s*[:\-]\s*([^\n]+)/i,
    ],
    city: [
      /city\s*[:\-]\s*([A-Za-z .'-]+)/i,
    ],
    state: [
      /state\s*[:\-]\s*([A-Za-z]{2,}|[A-Z]{2})/i,
    ],
    zip: [
      /(?:zip|postal)\s*(?:code)?\s*[:\-]\s*(\d{5}(?:-\d{4})?)/i,
    ],
    ein: [
      /(?:ein|federal\s+id|tax\s+id|fein)\s*#?\s*[:\-]\s*(\d{2}-?\d{7})/i,
    ],
    industry: [
      /(?:industry|trade|business\s+type|line\s+of\s+work|nature\s+of\s+business)\s*[:\-]\s*([^\n]+)/i,
    ],
    bondType: [
      /(?:bond\s+type|type\s+of\s+bond)\s*[:\-]\s*([^\n]+)/i,
    ],
    obligee: [
      /(?:obligee|beneficiary|owner|awarding\s+authority)\s*[:\-]\s*([^\n]+)/i,
    ],
    amount: [
      /(?:bond\s+amount|penal\s+sum|contract\s+(?:amount|price|value)|amount\s+of\s+bond|requested\s+amount)\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d+)?)/i,
    ],
    dueDate: [
      /(?:bid\s+date|due\s+date|date\s+needed|bond\s+needed\s+by|need(?:ed)?\s+by)\s*[:\-]?\s*([\w\/.\- ,]+\d{2,4})/i,
    ],
    leadSource: [
      /(?:lead\s+source|referred\s+by|how\s+did\s+you\s+hear|source)\s*[:\-]\s*([^\n]+)/i,
    ],
    notes: [
      /(?:notes|description|project\s+description|comments|scope\s+of\s+work)\s*[:\-]\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    ],
  };

  const STATE_ABBR = {
    alabama:'AL', alaska:'AK', arizona:'AZ', arkansas:'AR', california:'CA',
    colorado:'CO', connecticut:'CT', delaware:'DE', florida:'FL', georgia:'GA',
    hawaii:'HI', idaho:'ID', illinois:'IL', indiana:'IN', iowa:'IA',
    kansas:'KS', kentucky:'KY', louisiana:'LA', maine:'ME', maryland:'MD',
    massachusetts:'MA', michigan:'MI', minnesota:'MN', mississippi:'MS',
    missouri:'MO', montana:'MT', nebraska:'NE', nevada:'NV',
    'new hampshire':'NH', 'new jersey':'NJ', 'new mexico':'NM',
    'new york':'NY', 'north carolina':'NC', 'north dakota':'ND',
    ohio:'OH', oklahoma:'OK', oregon:'OR', pennsylvania:'PA',
    'rhode island':'RI', 'south carolina':'SC', 'south dakota':'SD',
    tennessee:'TN', texas:'TX', utah:'UT', vermont:'VT', virginia:'VA',
    washington:'WA', 'west virginia':'WV', wisconsin:'WI', wyoming:'WY',
  };

  function clean(v) {
    return String(v || '')
      .replace(/[ \t]+/g,' ')
      .replace(/\s{2,}/g,' ')
      .trim()
      .replace(/^[:\-•]\s*/, '')
      .replace(/[,;:]+$/, '');
  }

  function extractFields(text) {
    const out = {};
    Object.keys(FIELD_PATTERNS).forEach(key => {
      for (const re of FIELD_PATTERNS[key]) {
        const m = text.match(re);
        if (m) {
          out[key] = clean(m[1] || m[0]);
          break;
        }
      }
    });
    if (out.state) {
      const k = out.state.toLowerCase();
      if (STATE_ABBR[k]) out.state = STATE_ABBR[k];
      else if (/^[A-Za-z]{2}$/.test(out.state)) out.state = out.state.toUpperCase();
    }
    if (out.amount) out.amount = String(out.amount).replace(/[^\d.]/g,'');
    if (out.dueDate) {
      const d = new Date(out.dueDate);
      if (!isNaN(d)) out.dueDate = d.toISOString().slice(0,10);
    }
    if (out.bondType) out.bondType = matchBondType(out.bondType);
    return out;
  }

  function matchBondType(raw) {
    const t = raw.toLowerCase();
    const list = (window.BondTypes && BondTypes.TYPES) || [];
    const direct = list.find(x => x.toLowerCase() === t);
    if (direct) return direct;
    if (/bid/.test(t))                return list.find(x => /bid/i.test(x)) || raw;
    if (/payment|performance|p&p|p\s*&\s*p/.test(t)) return list.find(x => /payment/i.test(x)) || raw;
    if (/subdivis|site/.test(t))      return list.find(x => /subdivision/i.test(x)) || raw;
    if (/license|permit/.test(t))     return list.find(x => /license/i.test(x)) || raw;
    if (/probate|fiduciary/.test(t))  return list.find(x => /probate/i.test(x)) || raw;
    return raw;
  }

  // ---------- public: prompt + parse ----------
  // applyMap: { fieldKey: domElementId }
  function uploadAndFill(applyMap, opts = {}) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.csv,.tsv,application/pdf,text/plain,text/csv';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) return;
      try {
        U.toast('Reading form…', 'info');
        const text = await readText(file);
        const fields = extractFields(text);
        const applied = applyToForm(fields, applyMap);
        if (applied === 0) {
          U.toast('No matching fields found in that file', 'warn');
        } else {
          U.toast(`Auto-filled ${applied} field${applied===1?'':'s'} from ${file.name}`);
        }
        if (opts.onDone) opts.onDone(fields);
      } catch (err) {
        console.error(err);
        U.toast(err.message || 'Could not read that file', 'warn');
      }
    });
    input.click();
  }

  function applyToForm(fields, applyMap) {
    let count = 0;
    Object.keys(applyMap).forEach(key => {
      const id = applyMap[key];
      const el = document.getElementById(id);
      if (!el) return;
      const val = fields[key];
      if (val == null || val === '') return;
      if (el.tagName === 'SELECT') {
        const opts = Array.from(el.options);
        const match = opts.find(o => o.value === val) ||
                      opts.find(o => o.text === val) ||
                      opts.find(o => o.text.toLowerCase().includes(String(val).toLowerCase()));
        if (match) { el.value = match.value; count++; }
      } else {
        el.value = val;
        count++;
      }
    });
    return count;
  }

  return { uploadAndFill, extractFields, readText };
})();
