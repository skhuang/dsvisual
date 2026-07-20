(function (global) {
  const K = () => global.VizKit;
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function arrow(svg, x1, y1, x2, y2, color, label) {
    const line = el('line', { x1, y1, x2, y2, stroke: color || '#94a3b8', 'stroke-width': 2, 'marker-end': 'url(#pattern-arrow)' });
    svg.appendChild(line);
    if (label) { const t = el('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 4, 'font-size': 11, fill: '#cbd5e1', 'text-anchor': 'middle' }); t.textContent = label; svg.appendChild(t); }
  }
  function defsArrow(svg) {
    const defs = el('defs', {}); defs.innerHTML = '<marker id="pattern-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker>'; svg.appendChild(defs);
  }
  function node(svg, n) {
    svg.appendChild(el('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8, fill: n.color || '#334155', stroke: '#0f172a', 'stroke-width': 2 }));
    const title = el('text', { x: n.x + n.w / 2, y: n.y + 20, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 'bold', fill: 'white' }); title.textContent = n.label; svg.appendChild(title);
    (n.members || []).forEach((m, i) => { const t = el('text', { x: n.x + 10, y: n.y + 40 + i * 16, 'font-family': 'monospace', 'font-size': 11, fill: 'rgba(255,255,255,0.85)' }); t.textContent = m; svg.appendChild(t); });
  }
  function drawDiagram(svg, diagram) {
    svg.innerHTML = ''; defsArrow(svg);
    const byId = {}; (diagram.nodes || []).forEach((n) => { byId[n.id] = n; });
    (diagram.edges || []).forEach((e) => { const a = byId[e.from], b = byId[e.to]; if (a && b) arrow(svg, a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2, null, e.label); });
    (diagram.nodes || []).forEach((n) => node(svg, n));
  }
  function tree(svg, root) {
    svg.innerHTML = ''; defsArrow(svg);
    const W = 120, H = 44, VGAP = 70, HGAP = 20;
    // simple layered layout by DFS; compute subtree widths
    function width(t) { return (!t.children || !t.children.length) ? W + HGAP : t.children.reduce((s, c) => s + width(c), 0); }
    let placed = [];
    function place(t, x, depth) { const w = width(t); const cx = x + w / 2; t._x = cx - W / 2; t._y = 20 + depth * (H + VGAP); placed.push(t); let cur = x; (t.children || []).forEach((c) => { const cw = width(c); const child = place(c, cur, depth + 1); arrow(svg, cx, t._y + H, child._cx, child._y, null, null); cur += cw; }); t._cx = cx; return t; }
    place(root, 10, 0);
    placed.forEach((t) => node(svg, { x: t._x, y: t._y, w: W, h: H, label: t.label, color: t.color }));
  }
  function playNarration(steps) {
    return K().executeAnimWrapper(async () => { for (const s of steps) { K().showStatus(s.text, s.color); await sleep(600); } });
  }
  function render(svg, descriptor) {
    if (!descriptor) return;
    if (typeof descriptor.render === 'function') descriptor.render(svg);
    else if (descriptor.diagram) drawDiagram(svg, descriptor.diagram);
  }
  // OOP box/line/label helpers copied verbatim from app.js (~lines 2076–2148) so the
  // architectural pattern descriptors (mvc/layered/pubsub/pipefilter/di) render identically.
  // The .oop-* CSS classes are global in style.css, so visuals stay unchanged.
  const OOP_COLORS = {
      blue: '#1d4ed8',
      pink: '#be185d',
      green: '#047857',
      amber: '#b45309',
      violet: '#6d28d9',
      red: '#b91c1c',
      slate: '#334155',
      cyan: '#0e7490',
  };

  function oopSvgEl(tag, attrs) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const k in attrs) el.setAttribute(k, String(attrs[k]));
      return el;
  }

  function drawOopBox(svg, opts) {
      const rect = oopSvgEl('rect', {
          x: opts.x, y: opts.y, width: opts.w, height: opts.h, rx: opts.rx || 8,
          class: (opts.className || 'oop-class-rect') + (opts.activeClass || ''),
      });
      if (opts.dashed) rect.setAttribute('stroke-dasharray', '6 4');
      svg.appendChild(rect);
      const cx = opts.x + opts.w / 2;
      const title = oopSvgEl('text', {
          x: cx, y: opts.y + 24, 'text-anchor': 'middle',
          class: 'oop-member-text oop-title-text' + (opts.activeClass || ''),
          style: 'fill:' + (opts.titleColor || OOP_COLORS.blue) + ';' + (opts.dashed ? 'font-style:italic;' : ''),
      });
      title.textContent = opts.title;
      svg.appendChild(title);
      (opts.lines || []).forEach((ln, i) => {
          const t = oopSvgEl('text', {
              x: cx, y: opts.y + 48 + i * 18, 'text-anchor': 'middle',
              class: 'oop-member-text' + (opts.activeClass || ''),
              style: 'fill:' + (ln.color || OOP_COLORS.slate) + ';',
          });
          t.textContent = ln.text;
          svg.appendChild(t);
      });
  }

  function drawOopLabel(svg, x, y, text, color, activeClass) {
      const t = oopSvgEl('text', {
          x: x, y: y, 'text-anchor': 'middle',
          class: 'oop-member-text oop-label-text' + (activeClass || ''),
          style: 'fill:' + (color || OOP_COLORS.slate) + ';',
      });
      t.textContent = text;
      svg.appendChild(t);
  }

  function drawOopLine(svg, x1, y1, x2, y2, activeClass) {
      svg.appendChild(oopSvgEl('line', {
          x1: x1, y1: y1, x2: x2, y2: y2,
          class: 'oop-inheritance-line' + (activeClass || ''),
      }));
  }

  global.PatternVizDraw = { drawDiagram, tree, arrow, drawOopBox, drawOopLabel, drawOopLine };
  global.PatternViz = { drawDiagram, tree, playNarration, render };
})(typeof window !== 'undefined' ? window : globalThis);
