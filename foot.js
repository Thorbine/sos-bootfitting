// Fußschema als SVG-String. Wird in der App angezeigt und fürs PDF in PNG gewandelt.
const Foot = {
  VB: { top: [120, 290], side: [300, 190] },

  marker(type, x, y, n) {
    const t = CONFIG.markerTypes.find(m => m.id === type) || CONFIG.markerTypes[0];
    let shape;
    if (t.shape === 'triangle') {
      shape = `<polygon points="${x},${y - 9} ${x + 9},${y + 7} ${x - 9},${y + 7}" fill="${t.color}" stroke="#000" stroke-width="1.5"/>`;
    } else if (t.shape === 'square') {
      shape = `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" fill="${t.color}" stroke="#000" stroke-width="1.5"/>`;
    } else {
      shape = `<circle cx="${x}" cy="${y}" r="7.5" fill="${t.color}" stroke="#000" stroke-width="1.5"/>`;
    }
    return shape + `<text x="${x + 10}" y="${y - 8}" font-size="12" font-weight="700" font-family="Helvetica,Arial,sans-serif" fill="#000">${n}</text>`;
  },

  svg(view, foot, marks, opts = {}) {
    const [w, h] = this.VB[view];
    const f = 'font-family="Helvetica,Arial,sans-serif" font-size="9" fill="#666"';
    let body;
    if (view === 'top') {
      const mirror = foot === 'L' ? ' transform="translate(120,0) scale(-1,1)"' : '';
      const innerX = foot === 'R' ? 8 : 112;
      const outerX = foot === 'R' ? 112 : 8;
      body = `<g${mirror} fill="#f4f4f4" stroke="#333" stroke-width="2" stroke-linejoin="round">
        <path d="M62 272 C42 272 33 256 33 236 C33 212 41 192 40 168 C39 146 24 128 22 104 C21 86 26 76 36 72 L96 72 C100 90 98 108 92 128 C88 146 90 168 88 190 C86 214 90 236 86 250 C82 266 74 272 62 272 Z"/>
        <ellipse cx="36" cy="52" rx="14" ry="22"/><ellipse cx="58" cy="50" rx="9" ry="17"/>
        <ellipse cx="74" cy="56" rx="8" ry="15"/><ellipse cx="87" cy="63" rx="7" ry="13"/><ellipse cx="97" cy="75" rx="6" ry="10"/>
        <path d="M40 168 C56 176 70 178 88 190" fill="none" stroke="#999" stroke-width="1.2" stroke-dasharray="4 3"/>
      </g>
      <text x="60" y="12" text-anchor="middle" ${f}>Zehen</text>
      <text x="60" y="287" text-anchor="middle" ${f}>Ferse</text>
      <text x="${innerX}" y="150" text-anchor="middle" transform="rotate(${foot === 'R' ? -90 : 90} ${innerX} 150)" ${f}>Innen</text>
      <text x="${outerX}" y="150" text-anchor="middle" transform="rotate(${foot === 'R' ? 90 : -90} ${outerX} 150)" ${f}>Außen</text>`;
    } else {
      body = `<g fill="#f4f4f4" stroke="#333" stroke-width="2" stroke-linejoin="round">
        <path d="M40 150 C36 120 34 100 40 85 L46 14 L120 14 C122 48 124 62 130 70 C160 76 195 90 225 108 C250 118 262 130 262 146 C262 158 252 164 240 164 L62 164 C48 164 41 160 40 150 Z"/>
        <circle cx="82" cy="128" r="10" fill="none" stroke="#999" stroke-width="1.2" stroke-dasharray="4 3"/>
      </g>
      <text x="40" y="182" ${f}>Ferse</text>
      <text x="262" y="182" text-anchor="end" ${f}>Zehen</text>`;
    }
    const mine = marks.filter(m => m.foot === foot);
    const pins = mine.map((m, i) => m.view === view ? this.marker(m.type, m.x, m.y, i + 1) : '').join('');
    const bg = opts.export ? `<rect width="${w}" height="${h}" fill="#fff"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${opts.export ? `width="${w * 4}" height="${h * 4}"` : ''}>${bg}${body}${pins}</svg>`;
  },

  // SVG-String -> PNG-Data-URL (für jsPDF)
  toPng(svg, w, h, scale = 4) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = w * scale; c.height = h * scale;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
};
