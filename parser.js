// SDG Uplate - parser slobodnog unosa ("Selver je platio 48 eura za krav maga")
(function (g) {
  const UNITS = { nula: 0, jedan: 1, jedna: 1, jedno: 1, jednu: 1, dva: 2, dvije: 2, tri: 3, 'četiri': 4, pet: 5, 'šest': 6, sedam: 7, osam: 8, devet: 9, deset: 10, jedanaest: 11, dvanaest: 12, trinaest: 13, 'četrnaest': 14, petnaest: 15, 'šesnaest': 16, sedamnaest: 17, osamnaest: 18, devetnaest: 19 };
  const TENS = { dvadeset: 20, trideset: 30, 'četrdeset': 40, pedeset: 50, 'šezdeset': 60, sedamdeset: 70, osamdeset: 80, devedeset: 90 };
  const HUND = { sto: 100, stotinu: 100, dvjesto: 200, dvjesta: 200, tristo: 300, trista: 300, 'četiristo': 400, petsto: 500, 'šesto': 600, 'šeststo': 600, sedamsto: 700, osamsto: 800, devetsto: 900 };
  const NUM = w => HUND[w] ?? TENS[w] ?? UNITS[w];

  // "četrdeset osam" -> "48"
  function wordsToDigits(text) {
    const words = text.split(/\s+/).filter(Boolean);
    const out = [];
    let acc = null;
    for (let i = 0; i < words.length; i++) {
      const raw = words[i];
      const m = raw.match(/^(.*?)([.,!?;:]*)$/);
      const core = m[1].toLowerCase(), punct = m[2];
      const v = NUM(core);
      if (v !== undefined) {
        acc = (acc ?? 0) + v;
        if (punct) { out.push(acc + punct); acc = null; }
        continue;
      }
      if (core === 'i' && acc !== null && !punct && i + 1 < words.length &&
          NUM(words[i + 1].toLowerCase().replace(/[.,!?;:]+$/, '')) !== undefined) continue;
      if (acc !== null) { out.push(String(acc)); acc = null; }
      out.push(raw);
    }
    if (acc !== null) out.push(String(acc));
    return out.join(' ');
  }

  const STOP = new Set(['je', 'su', 'mi', 'platio', 'platila', 'platilo', 'platili', 'uplatio', 'uplatila', 'uplatili', 'dao', 'dala', 'dali', 'donio', 'donijela', 'iznos', 'iznosu', 'u', 'od', 'za', 'eura', 'euro', 'eur', '€', '-', '–']);
  const PSTOP = new Set(['za', 'na', 'program', 'programa', 'eura', 'euro', 'eur', '€', '-', '–']);

  const cap = w => w ? w.charAt(0).toLocaleUpperCase('hr') + w.slice(1) : w;
  const toks = s => s.split(/[\s,;:]+/).map(t => t.replace(/[.!?]+$/, '')).filter(Boolean);

  // "krav magu" ~ "Krav maga", "kružni trening" ~ "Kružni treninzi"
  function similar(a, b) {
    const A = a.toLowerCase().split(/\s+/), B = b.toLowerCase().split(/\s+/);
    if (A.length !== B.length) return false;
    return A.every((w, i) => {
      const v = B[i];
      if (Math.min(w.length, v.length) <= 3) return w === v;
      const n = Math.min(w.length, v.length) - 1;
      return w.slice(0, n) === v.slice(0, n);
    });
  }
  function canonProgram(p, known) {
    if (!p) return '';
    return known.find(k => k.toLowerCase() === p.toLowerCase()) ||
           known.find(k => similar(k, p)) || cap(p);
  }

  function parse(input, known = []) {
    let s = wordsToDigits(String(input || '').trim())
      .replace(/€\s*(\d+(?:[.,]\d{1,2})?)/, '$1 €');
    const m = s.match(/(\d+(?:[.,]\d{1,2})?)\s*(eura|euro|eur|€)?/i);
    if (!m) {
      return { name: toks(s).filter(t => !STOP.has(t.toLowerCase())).map(cap).join(' '), amount: null, program: '' };
    }
    const amount = parseFloat(m[1].replace(',', '.'));
    let nameToks = toks(s.slice(0, m.index)).filter(t => !STOP.has(t.toLowerCase()));
    const progToks = toks(s.slice(m.index + m[0].length));
    while (progToks.length && PSTOP.has(progToks[0].toLowerCase())) progToks.shift();
    let program = progToks.join(' ');

    // program izgovoren prije iznosa: "Selver krav maga 48 eura"
    if (!program && known.length) {
      for (const k of [...known].sort((a, b) => b.length - a.length)) {
        const kw = k.split(/\s+/).length;
        if (nameToks.length > kw && similar(nameToks.slice(-kw).join(' '), k)) {
          program = k; nameToks = nameToks.slice(0, -kw); break;
        }
      }
    }
    return { name: nameToks.map(cap).join(' '), amount, program: canonProgram(program, known) };
  }

  g.SDGParse = { parse, wordsToDigits };
})(typeof window !== 'undefined' ? window : globalThis);
