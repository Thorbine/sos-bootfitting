// Hauptlogik: Formular, Entwürfe, Fußschema, Fotos, PDF-Versand.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

let c = null;          // aktueller Fall
let persisted = false; // erst nach der ersten Eingabe speichern
let curFoot = 'L', curType = CONFIG.markerTypes[0].id;
let saveTimer;

const newCase = () => ({
  id: uid(), createdAt: Date.now(), updatedAt: Date.now(),
  customer: { name: '', phone: '', email: '', pickup: '' },
  fitter: CONFIG.fitters[0] || '',
  shoe: { brand: '', model: '', size: '', origin: 'shop' },
  marks: [], measures: {}, photos: [], notes: ''
});

const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const setPath = (o, p, v) => { const k = p.split('.'); const last = k.pop(); k.reduce((a, x) => a[x], o)[last] = v; };

// ---------- Speichern ----------
function touch() {
  c.updatedAt = Date.now();
  persisted = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => Store.put(c).catch(() => alert('Speichern auf dem Gerät fehlgeschlagen (Speicher voll?).')), 400);
}

// ---------- Übersicht ----------
async function showList() {
  clearTimeout(saveTimer);
  if (c && persisted) await Store.put(c);
  c = null;
  $('#view-form').hidden = true; $('#view-list').hidden = false;
  const all = (await Store.all()).sort((a, b) => b.updatedAt - a.updatedAt);
  $('#drafts').innerHTML = all.length ? all.map(d => `
    <li><div class="info" data-open="${d.id}"><strong>${esc(d.customer.name) || 'Ohne Namen'}</strong>
      <small>Abholung ${esc(Calc.date(d.customer.pickup))} · geändert ${new Date(d.updatedAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</small></div>
      <button data-del="${d.id}">Löschen</button></li>`).join('') : '<li class="hint">Keine Entwürfe.</li>';
}

function openCase(d, isNew) {
  c = d; persisted = !isNew;
  curFoot = 'L';
  $('#view-list').hidden = true; $('#view-form').hidden = false;
  window.scrollTo(0, 0);
  $$('[data-bind]').forEach(el => { el.value = getPath(c, el.dataset.bind) ?? ''; });
  renderAll();
}

function renderAll() {
  renderOrigin(); renderFootTabs(); renderTypes(); renderSchema(); renderMarks(); renderMeasures(); renderPhotos();
}

// ---------- Schuh ----------
function renderOrigin() {
  $$('#origin button').forEach(b => b.classList.toggle('on', b.dataset.origin === c.shoe.origin));
}

// ---------- Fußschema ----------
function renderFootTabs() { $$('#foot-tabs button').forEach(b => b.classList.toggle('on', b.dataset.foot === curFoot)); }
function renderTypes() {
  $('#marker-types').innerHTML = CONFIG.markerTypes.map(t =>
    `<button type="button" data-type="${t.id}" class="${t.id === curType ? 'on' : ''}">${t.label}</button>`).join('');
}
function renderSchema() {
  $('#svg-top').innerHTML = Foot.svg('top', curFoot, c.marks);
  $('#svg-side').innerHTML = Foot.svg('side', curFoot, c.marks);
}
function renderMarks() {
  const names = Object.fromEntries(CONFIG.markerTypes.map(t => [t.id, t.label]));
  const mine = c.marks.filter(m => m.foot === curFoot);
  $('#marks').innerHTML = mine.map((m, i) => `
    <li><span class="n">${i + 1}</span><input data-mnote="${m.id}" value="${esc(m.note)}" placeholder="${names[m.type]} (${m.view === 'top' ? 'oben' : 'seitlich'}) – Notiz">
    <button data-mdel="${m.id}">✕</button></li>`).join('');
}
function addMark(view, ev) {
  const svg = ev.currentTarget.querySelector('svg');
  const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
  const pt = p.matrixTransform(svg.getScreenCTM().inverse());
  c.marks.push({ id: uid(), foot: curFoot, view, type: curType, x: Math.round(pt.x), y: Math.round(pt.y), note: '' });
  touch(); renderSchema(); renderMarks();
}

// ---------- Maßnahmen ----------
function renderMeasures() {
  const extern = Calc.isExtern(c);
  $('#measures').innerHTML = CONFIG.measures.map(g => `<div class="mg">${g.group}</div>` + g.items.map(m => {
    const st = c.measures[m.id];
    const on = st && st.on;
    const hint = extern ? `${m.price} € ${m.unit}`.trim() : m.unit;
    let opts = '';
    if (on) {
      if (m.kind === 'schuh' || m.kind === 'stelle') opts += `<label>Seite<select data-m="${m.id}" data-f="side">
        ${['L', 'R', 'both'].map(s => `<option value="${s}" ${st.side === s ? 'selected' : ''}>${SIDE_TXT[s]}</option>`).join('')}</select></label>`;
      if (m.kind === 'stelle' || m.kind === 'schnalle') opts += `<label>${m.kind === 'stelle' ? 'Stellen' : 'Schnallen'}<input type="number" min="1" inputmode="numeric" data-m="${m.id}" data-f="qty" value="${st.qty}"></label>`;
      if (extern) opts += `<label>Preis (€)<input type="number" min="0" step="0.5" inputmode="decimal" data-m="${m.id}" data-f="price" placeholder="${Calc.lines(c).find(l => l.def.id === m.id)?.price}" value="${st.price ?? ''}"></label>`;
    }
    return `<div class="measure"><label class="chk"><input type="checkbox" data-m="${m.id}" data-f="on" ${on ? 'checked' : ''}>${m.name}<small>${esc(hint)}</small></label>${opts ? `<div class="opts">${opts}</div>` : ''}</div>`;
  }).join('')).join('');
  renderTotal();
}
function renderTotal() {
  const el = $('#total');
  const show = Calc.isExtern(c) && Calc.lines(c).length;
  el.hidden = !show;
  if (show) el.textContent = 'Summe ' + Calc.money(Calc.total(c));
}

// ---------- Fotos ----------
async function resizePhoto(file, max = 1600) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); }
  const w0 = bmp.width, h0 = bmp.height, k = Math.min(1, max / Math.max(w0, h0));
  const cv = document.createElement('canvas'); cv.width = Math.round(w0 * k); cv.height = Math.round(h0 * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  return { data: cv.toDataURL('image/jpeg', 0.8), w: cv.width, h: cv.height };
}
async function addPhotos(files) {
  for (const f of files) {
    try { c.photos.push({ id: uid(), label: CONFIG.photoLabels[0], note: '', ...(await resizePhoto(f)) }); }
    catch { alert('Foto konnte nicht gelesen werden.'); }
  }
  touch(); renderPhotos();
}
function renderPhotos() {
  $('#photos').innerHTML = c.photos.map(p => `
    <li><img src="${p.data}" alt=""><div class="f">
      <select data-pl="${p.id}">${CONFIG.photoLabels.map(l => `<option ${l === p.label ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <input data-pn="${p.id}" value="${esc(p.note)}" placeholder="Notiz">
      <button data-pdel="${p.id}">Entfernen</button></div></li>`).join('');
}

// ---------- PDF ----------
async function makePdf() {
  if (!c.customer.name.trim()) { alert('Bitte einen Kundennamen eintragen.'); return null; }
  if (!c.customer.pickup) { alert('Bitte ein Abholdatum eintragen.'); return null; }
  const img = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = rej; i.src = src; });
  const lg = await img('icons/logo.png');
  const logoData = await fetch('icons/logo.png').then(r => r.blob()).then(b => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }));
  const assets = { logo: { data: logoData, ...lg }, schema: {} };
  for (const foot of ['L', 'R']) for (const v of ['top', 'side']) {
    if (!c.marks.some(m => m.foot === foot && m.view === v)) continue;
    const [w, h] = Foot.VB[v];
    assets.schema[`${foot}-${v}`] = { data: await Foot.toPng(Foot.svg(v, foot, c.marks, { export: true }), w, h), w, h };
  }
  return Pdf.build(c, assets);
}

async function sendPdf() {
  const btn = $('#btn-send'); btn.disabled = true;
  try {
    const doc = await makePdf(); if (!doc) return;
    const name = Calc.fileName(c);
    const file = new File([doc.output('blob')], name, { type: 'application/pdf' });
    const title = `Bootfitting ${c.customer.name} – Abholung ${Calc.date(c.customer.pickup)}`;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title, text: title }); }
      catch (e) { if (e.name === 'AbortError') return; throw e; }
    } else {
      const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; a.click();
    }
    $('#dlg-sent').showModal();
  } catch (e) { console.error(e); alert('PDF konnte nicht erstellt werden: ' + e.message); }
  finally { btn.disabled = false; }
}

async function printPdf() {
  const doc = await makePdf(); if (!doc) return;
  const url = doc.output('bloburl');
  if (!window.open(url, '_blank')) location.href = url;
}

// ---------- Events ----------
document.addEventListener('click', async e => {
  const t = e.target.closest('button, [data-open]'); if (!t) return;
  const d = t.dataset;
  if (t.id === 'btn-new') openCase(newCase(), true);
  else if (d.open) openCase((await Store.all()).find(x => x.id === d.open), false);
  else if (d.del) { if (confirm('Entwurf löschen?')) { await Store.del(d.del); showList(); } }
  else if (t.id === 'btn-back') showList();
  else if (d.origin) { c.shoe.origin = d.origin; touch(); renderOrigin(); renderMeasures(); }
  else if (d.foot) { curFoot = d.foot; renderFootTabs(); renderSchema(); renderMarks(); }
  else if (d.type) { curType = d.type; renderTypes(); }
  else if (d.mdel) { c.marks = c.marks.filter(m => m.id !== d.mdel); touch(); renderSchema(); renderMarks(); }
  else if (d.pdel) { c.photos = c.photos.filter(p => p.id !== d.pdel); touch(); renderPhotos(); }
  else if (t.id === 'btn-cam') $('#in-cam').click();
  else if (t.id === 'btn-gal') $('#in-gal').click();
  else if (t.id === 'btn-send') sendPdf();
  else if (t.id === 'btn-print') printPdf();
  else if (t.id === 'sent-yes') { $('#dlg-sent').close(); await Store.del(c.id); persisted = false; showList(); }
  else if (t.id === 'sent-no') $('#dlg-sent').close();
});

$('#svg-top').addEventListener('click', e => addMark('top', e));
$('#svg-side').addEventListener('click', e => addMark('side', e));

for (const id of ['in-cam', 'in-gal']) $('#' + id).addEventListener('change', e => { addPhotos([...e.target.files]); e.target.value = ''; });

$('#view-form').addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.bind) { setPath(c, el.dataset.bind, el.value); touch(); }
  else if (el.dataset.mnote) { c.marks.find(m => m.id === el.dataset.mnote).note = el.value; touch(); }
  else if (el.dataset.pn) { c.photos.find(p => p.id === el.dataset.pn).note = el.value; touch(); }
  else if (el.dataset.pl) { c.photos.find(p => p.id === el.dataset.pl).label = el.value; touch(); }
  else if (el.dataset.m) {
    const st = c.measures[el.dataset.m] ??= { on: false, side: 'both', qty: 1, price: '' };
    const f = el.dataset.f;
    if (f === 'on') { st.on = el.checked; touch(); renderMeasures(); return; }
    st[f] = el.value;
    touch();
    if (f === 'side') renderMeasures(); else renderTotal();
  }
});

// ---------- Start ----------
(async function init() {
  $('#ver').textContent = `${CONFIG.shop} · Version ${CONFIG.version}`;
  $('#draft-days').textContent = CONFIG.draftDays;
  $('#fitter').innerHTML = CONFIG.fitters.map(f => `<option>${esc(f)}</option>`).join('');
  $('#brands').innerHTML = CONFIG.brands.map(b => `<option value="${esc(b)}">`).join('');
  try { await Store.purgeOld(CONFIG.draftDays); } catch (e) { console.warn(e); }
  showList();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
