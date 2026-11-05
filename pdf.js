// Berechnung der Maßnahmenzeilen und Aufbau des A4-Werkstattblatts.
const SIDE_TXT = { L: 'Links', R: 'Rechts', both: 'Beide' };

const Calc = {
  isExtern: c => c.shoe.origin === 'extern',

  lines(c) {
    const out = [];
    for (const g of CONFIG.measures) for (const m of g.items) {
      const st = c.measures[m.id];
      if (!st || !st.on) continue;
      const sides = st.side === 'both' ? 2 : 1;
      const qty = Math.max(1, Number(st.qty) || 1);
      const mult = m.kind === 'schuh' ? sides : m.kind === 'stelle' ? sides * qty : m.kind === 'schnalle' ? qty : 1;
      const override = st.price !== '' && st.price != null && !isNaN(Number(st.price));
      out.push({
        def: m, st,
        side: (m.kind === 'schuh' || m.kind === 'stelle') ? SIDE_TXT[st.side] : '',
        qty: (m.kind === 'stelle' || m.kind === 'schnalle') ? qty : '',
        price: override ? Number(st.price) : m.price * mult
      });
    }
    return out;
  },

  total: c => Calc.lines(c).reduce((s, l) => s + l.price, 0),
  money: n => n.toFixed(2).replace('.', ',') + ' €',
  date(iso) {
    if (!iso) return '–';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  fileName(c) {
    const safe = (c.customer.name || 'Kunde').replace(/[^\wäöüÄÖÜß-]+/g, '_');
    return `Bootfitting_${safe}_${c.customer.pickup || new Date().toISOString().slice(0, 10)}.pdf`;
  }
};

const Pdf = {
  build(c, assets) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const M = 12, W = 210, R = W - M, BOTTOM = 280;
    let y = 0;
    const ensure = h => { if (y + h > BOTTOM) { doc.addPage(); y = M; } };
    const text = (s, x, yy, o = {}) => {
      doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
      doc.setFontSize(o.size || 10);
      doc.setTextColor(o.gray ? 100 : 0);
      doc.text(String(s), x, yy, o.align ? { align: o.align } : undefined);
    };
    const h2 = s => { ensure(14); y += 4; text(s.toUpperCase(), M, y, { bold: true, size: 9, gray: true }); y += 1.5; doc.setDrawColor(150); doc.line(M, y, R, y); y += 5; };

    // Kopf
    const lw = 40, lh = lw * assets.logo.h / assets.logo.w;
    doc.addImage(assets.logo.data, 'PNG', M, 10, lw, lh);
    text('Bootfitting-Auftrag', R, 15, { bold: true, size: 16, align: 'right' });
    text(`Fitter: ${c.fitter || '–'}  ·  erfasst ${new Date(c.createdAt).toLocaleDateString('de-DE')}`, R, 21, { size: 9, gray: true, align: 'right' });

    // Abholung
    y = 10 + lh + 6;
    doc.setDrawColor(0); doc.setLineWidth(0.8); doc.rect(M, y, R - M, 16); doc.setLineWidth(0.2);
    text('ABHOLUNG', M + 4, y + 6, { bold: true, size: 9, gray: true });
    text(Calc.date(c.customer.pickup), M + 4, y + 13.5, { bold: true, size: 20 });
    y += 18;

    // Kunde + Schuh
    h2('Kunde');
    text(c.customer.name || '–', M, y, { bold: true, size: 12 });
    text([c.customer.phone, c.customer.email].filter(Boolean).join('  ·  ') || '', M + 70, y);
    y += 3;
    h2('Schuh');
    const shoe = [c.shoe.brand, c.shoe.model].filter(Boolean).join(' ') || '–';
    text(shoe, M, y, { bold: true, size: 12 });
    text(`Größe: ${c.shoe.size || '–'}`, M + 100, y);
    text(c.shoe.origin === 'extern' ? 'extern gekauft' : 'bei uns gekauft', R, y, { align: 'right', bold: true });
    y += 3;

    // Maßnahmen
    const lines = Calc.lines(c);
    const extern = Calc.isExtern(c);
    h2('Maßnahmen');
    if (!lines.length) { text('Keine Maßnahmen ausgewählt.', M, y, { gray: true }); y += 6; }
    for (const l of lines) {
      ensure(8);
      doc.setDrawColor(0); doc.rect(M, y - 3.6, 4.5, 4.5);
      text(l.def.name, M + 8, y);
      text(l.side, 125, y);
      text(l.qty ? `${l.qty}×` : '', 150, y);
      if (extern) text(Calc.money(l.price), R, y, { align: 'right' });
      y += 7;
    }
    if (extern && lines.length) {
      ensure(8); doc.setDrawColor(0); doc.line(150, y - 4, R, y - 4);
      text('Summe', 150, y, { bold: true }); text(Calc.money(Calc.total(c)), R, y, { bold: true, align: 'right' }); y += 6;
    }

    // Fußschema (nur Ansichten mit Markierungen)
    if (c.marks.length) {
      h2('Druckstellen');
      for (const foot of ['L', 'R']) {
        const mine = c.marks.filter(m => m.foot === foot);
        if (!mine.length) continue;
        ensure(78);
        text(foot === 'L' ? 'Linker Fuß' : 'Rechter Fuß', M, y, { bold: true });
        let x = M, top = y + 3, maxH = 0;
        for (const v of Foot.VIEWS.filter(v => mine.some(m => m.view === v))) {
          const a = assets.schema[`${foot}-${v}`];
          const iw = v === 'top' ? 28 : 75, ih = iw * a.h / a.w;
          doc.addImage(a.data, 'PNG', x, top, iw, ih);
          doc.setDrawColor(210); doc.rect(x, top, iw, ih);
          x += iw + 4; maxH = Math.max(maxH, ih);
        }
        const names = Object.fromEntries(CONFIG.markerTypes.map(t => [t.id, t.label]));
        const where = { top: 'oben', inner: 'innen', outer: 'außen' };
        y = top + maxH + 5;
        mine.forEach((m, i) => {
          ensure(5);
          text(`${i + 1}  ${names[m.type]} (${where[m.view]})${m.note ? ' – ' + m.note : ''}`, M, y, { size: 9 });
          y += 4.6;
        });
        y += 4;
      }
    }

    // Notizen
    if (c.notes && c.notes.trim()) {
      h2('Notizen');
      const s = doc.splitTextToSize(c.notes, R - M);
      for (const line of s) { ensure(5); text(line, M, y); y += 4.6; }
    }

    // Fotos
    if (c.photos.length) {
      doc.addPage(); y = M;
      text('Fotos', M, y + 4, { bold: true, size: 14 }); y += 10;
      const cw = (R - M - 6) / 2, ch = 70;
      c.photos.forEach((p, i) => {
        const col = i % 2;
        if (col === 0) { ensure(ch + 16); }
        const x = M + col * (cw + 6);
        const k = Math.min(cw / p.w, ch / p.h), iw = p.w * k, ih = p.h * k;
        doc.addImage(p.data, 'JPEG', x, y, iw, ih);
        doc.setDrawColor(200); doc.rect(x, y, iw, ih);
        text(p.label || '', x, y + ch + 4, { bold: true, size: 9 });
        const n = doc.splitTextToSize(p.note || '', cw);
        text(n.slice(0, 2), x, y + ch + 8, { size: 8.5, gray: true });
        if (col === 1 || i === c.photos.length - 1) y += ch + 16;
      });
    }

    // Fußzeile
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      text(`${CONFIG.shop}  ·  Seite ${i}/${n}`, W / 2, 291, { size: 8, gray: true, align: 'center' });
    }
    return doc;
  }
};
