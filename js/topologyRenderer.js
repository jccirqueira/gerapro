import { DEVICE_SYMBOLS, getSymbol, getSymbolByEquipment, resolveImgSrc, escSVG } from './topologySymbols.js';

const W = 1000, PAD = 40, UW = W - 2 * PAD;
const LVL_GAP = 10;

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function calcCellLayout(controllers, switches, yOff, opts = {}) {
  const N = controllers.length;
  const S = switches.length;
  const nodeW = 140;
  const spacing = Math.min(UW / (Math.max(N, S) + 1), 180);
  const leftOffset = (W - spacing * Math.max(N, S)) / 2;
  const gap = 10;

  const switchRow = yOff + 30;
  const ctrlRow = yOff + 130;

    const ctrlPos = controllers.map((c, i) => {
      const x = leftOffset + spacing * (i + (S > N ? (S - N) / 2 : 0.5)) - nodeW / 2;
      const { sym, imgSrc: resolved } = getSymbolByEquipment(c);
      const imgSrc = opts.useImages !== false ? resolved : null;
      return { data: { ...c, imgSrc }, x, y: ctrlRow, sym };
    });

  const swPos = switches.map((s, i) => {
    const x = leftOffset + spacing * (i + (N > S ? (N - S) / 2 : 0.5)) - 50;
    const sym = s.tipo === 'nao-gerenciavel' ? DEVICE_SYMBOLS.SWITCH_NAO : DEVICE_SYMBOLS.SWITCH_GEREN;
    const imgSrc = opts.useImages !== false ? resolveImgSrc(s.tipo || 'switch', s.fabricante, s.modelo) : null;
    return { data: { ...s, imgSrc }, x, y: switchRow, sym };
  });

  return { ctrlPos, swPos, switchRow, ctrlRow };
}

function calcFieldLayout(barramentos, yOff, opts = {}) {
  const rows = [];
  let cy = yOff + 30;
  for (const fb of barramentos) {
    const devs = fb.dispositivosCampo || [];
    const maxShow = Math.min(devs.length, 24);
    const spacing = Math.min(70, UW / (maxShow + 1));
    const leftOff = (W - spacing * maxShow) / 2;
    const devPos = [];
    for (let i = 0; i < maxShow; i++) {
      const x = leftOff + spacing * (i + 0.5) - 22;
      const dev = devs[i];
      let deviceSym, imgSrc = null;
      if (dev.siemensImage) {
        deviceSym = getSymbol(dev.siemensImage);
        imgSrc = opts.useImages !== false ? resolveImgSrc(dev.tipo, dev.fabricante, dev.modelo) : null;
      } else {
        deviceSym = DEVICE_SYMBOLS.DISPOSITIVO_CAMPO;
      }
      devPos.push({ data: { ...dev, imgSrc }, x, y: cy + 28, sym: deviceSym });
    }
    const extra = devs.length - maxShow;
    rows.push({ fb, y: cy, devPos, extra, height: 100 });
    cy += 100;
  }
  return rows;
}

function generateTopologySVG(topologia, bom, opts = {}) {
  const nivelCampo = topologia.find(n => n.nivel === 'Campo');
  const nivelCelula = topologia.find(n => n.nivel === 'Célula / Controle');
  const nivelGestao = topologia.find(n => n.nivel === 'Gestão / IIoT');
  if (!nivelCelula) return '<svg viewBox="0 0 600 200"><text x="300" y="100" text-anchor="middle">Topologia n\u00e3o dispon\u00edvel</text></svg>';

  const gestaoEnabled = nivelGestao && nivelGestao.habilitado;
  const gestaoH = gestaoEnabled ? 130 : 40;
  const celulaH = 210;
  const campoBars = calcFieldLayout(nivelCampo?.barramentos || [], gestaoH + LVL_GAP + celulaH + LVL_GAP, opts);
  const campoH = campoBars.length > 0 ? campoBars[campoBars.length - 1].y + 100 - (gestaoH + LVL_GAP + celulaH + LVL_GAP) + 25 : 60;
  const totalH = gestaoH + LVL_GAP + celulaH + LVL_GAP + campoH + 20;

  const gestaoY = 0;
  const celulaY = gestaoH + LVL_GAP;
  const campoY = celulaY + celulaH + LVL_GAP;

  const ctrlLayout = calcCellLayout(nivelCelula.controladores || [], nivelCelula.switches || [], celulaY, opts);

  const gestaoColor = '#f0f9ff';
  const celulaColor = '#f8fafc';
  const campoColor = '#f1f5f9';
  const borderColor = '#e2e8f0';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${totalH}" style="width:100%;height:auto;font-family:'Inter','Segoe UI',Arial,sans-serif;">
    <defs>
      <filter id="shadow1"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.12"/></filter>
      <marker id="arrEnd" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#64748b"/></marker>
      <marker id="arrEndBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#3b82f6"/></marker>
      <marker id="ringArrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#059669"/></marker>
      <style>
        .device { cursor: pointer; transition: opacity 0.15s; }
        .device:hover { opacity: 0.85; }
        .conn-line { stroke: #64748b; stroke-width: 1.5; fill: none; }
        .conn-line-ring { stroke: #059669; stroke-width: 2; fill: none; stroke-dasharray: 6,3; }
        .conn-line-gestao { stroke: #6366f1; stroke-width: 1.5; fill: none; stroke-dasharray: 4,3; }
        .conn-line-inter { stroke: #94a3b8; stroke-width: 1.5; fill: none; stroke-dasharray: 5,3; }
        .conn-label { font-size: 8px; fill: #64748b; font-weight: 600; }
        .lvl-title { font-weight: 800; font-size: 12px; }
      </style>
    </defs>`;

  function lvlBg(y, h, color, label, icon) {
    return `<rect x="${PAD/2}" y="${y}" width="${W-PAD}" height="${h}" rx="6" fill="${color}" stroke="${borderColor}" stroke-width="1"/>
      <text x="${PAD}" y="${y+18}" class="lvl-title" fill="#475569">${escSVG(icon+' '+label)}</text>`;
  }

  function connLine(x1, y1, x2, y2, cls, label) {
    let mid = '';
    if (label) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      mid = `<rect x="${mx-30}" y="${my-8}" width="60" height="14" rx="3" fill="white" fill-opacity="0.85"/>
        <text x="${mx}" y="${my+3}" text-anchor="middle" class="conn-label">${escSVG(label)}</text>`;
    }
    return `<path d="M ${x1} ${y1} L ${x2} ${y2}" class="${cls}"/>${mid}`;
  }

  function hLine(y, x1, x2, cls, label) {
    let mid = '';
    if (label) {
      const mx = (x1 + x2) / 2;
      mid = `<rect x="${mx-30}" y="${y-10}" width="60" height="14" rx="3" fill="white" fill-opacity="0.85"/>
        <text x="${mx}" y="${y+3}" text-anchor="middle" class="conn-label">${escSVG(label)}</text>`;
    }
    return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="${cls}"/>${mid}`;
  }

  svg += lvlBg(gestaoY, gestaoH, gestaoColor, 'NÍVEL GESTÃO / IIoT', '☁');

  if (gestaoEnabled) {
    const gestaoDevs = nivelGestao.dispositivos || [];
    const gSpacing = Math.min(250, UW / (gestaoDevs.length + 1));
    const gOff = (W - gSpacing * gestaoDevs.length) / 2;
    const gY = gestaoY + 50;
    let prevX = null, prevSym = null;
    gestaoDevs.forEach((d, i) => {
      const tipo = (d.tipo || '').toLowerCase();
      let sym;
      if (tipo.includes('firewall')) sym = DEVICE_SYMBOLS.FIREWALL;
      else if (tipo.includes('roteador')) sym = DEVICE_SYMBOLS.ROTEADOR;
      else if (tipo.includes('access') || tipo.includes('ap') || tipo.includes('wifi')) sym = DEVICE_SYMBOLS.ACCESS_POINT;
      else if (tipo.includes('gateway') || tipo.includes('broker')) sym = DEVICE_SYMBOLS.GATEWAY;
      else sym = DEVICE_SYMBOLS.SERVIDOR;
      const imgSrc = opts.useImages !== false ? resolveImgSrc(sym.id, d.fabricante, d.modelo) : null;
      const x = gOff + gSpacing * i + (gSpacing - sym.w) / 2;
      svg += sym.renderSVG(x, gY, { ...d, label: d.tipo, imgSrc });
      if (prevX !== null && prevSym !== null) {
        svg += hLine(gY + 27, prevX + prevSym.w, x, 'conn-line-gestao', nivelGestao.protocolos.length > 1 ? nivelGestao.protocolos.join('/') : nivelGestao.protocolos[0]);
      }
      prevX = x;
      prevSym = sym;
    });
    svg += `<line x1="${PAD}" y1="${gestaoY+gestaoH-8}" x2="${W-PAD}" y2="${gestaoY+gestaoH-8}" stroke="${borderColor}" stroke-width="1" stroke-dasharray="3,3"/>`;
  }

  const interTopGestao = [];
  if (gestaoEnabled) {
    const gestaoDevs = nivelGestao.dispositivos || [];
    const gSpacing = Math.min(250, UW / (gestaoDevs.length + 1));
    const gOff = (W - gSpacing * gestaoDevs.length) / 2;
    const gY = gestaoY + 50;
    gestaoDevs.forEach((d, i) => {
      const tipo = (d.tipo || '').toLowerCase();
      let sym;
      if (tipo.includes('firewall')) sym = DEVICE_SYMBOLS.FIREWALL;
      else if (tipo.includes('roteador')) sym = DEVICE_SYMBOLS.ROTEADOR;
      else if (tipo.includes('access') || tipo.includes('ap') || tipo.includes('wifi')) sym = DEVICE_SYMBOLS.ACCESS_POINT;
      else if (tipo.includes('gateway') || tipo.includes('broker')) sym = DEVICE_SYMBOLS.GATEWAY;
      else sym = DEVICE_SYMBOLS.SERVIDOR;
      const x = gOff + gSpacing * i + (gSpacing - sym.w) / 2;
      interTopGestao.push({ cx: x + sym.w / 2, bot: gY + sym.h, w: sym.w, label: d.tipo || sym.label });
    });
  }

  svg += lvlBg(celulaY, celulaH, celulaColor, 'NÍVEL CÉLULA / CONTROLE', '🔷');
  const topoStr = nivelCelula.topologia === 'ring' ? 'Anel MRP' : nivelCelula.topologia === 'star' ? 'Estrela' : nivelCelula.topologia;
  const badges = [];
  if (nivelCelula.conformanceClass) badges.push(nivelCelula.conformanceClass);
  if (nivelCelula.profinetRealTime) badges.push(nivelCelula.profinetRealTime);
  if (nivelCelula.profinetRedundancy) badges.push(nivelCelula.profinetRedundancy);
  if (nivelCelula.hasPROFIsafe) badges.push('PROFIsafe');
  const badgeStr = badges.length > 0 ? ` | ${badges.join(' | ')}` : '';
  svg += `<text x="${W-PAD}" y="${celulaY+18}" text-anchor="end" fill="#64748b" font-size="10" font-weight="600">${escSVG(nivelCelula.protocolo)} | ${escSVG(topoStr)} | ${escSVG(nivelCelula.velocidade)}${badgeStr}</text>`;

  const { ctrlPos, swPos, switchRow, ctrlRow } = ctrlLayout;

  for (const g of interTopGestao) {
    let nearestSw = null, minDist = Infinity;
    for (const sw of swPos) {
      const swCx = sw.x + sw.sym.w / 2;
      const dist = Math.abs(swCx - g.cx);
      if (dist < minDist) { minDist = dist; nearestSw = sw; }
    }
    if (nearestSw) {
      const swCx = nearestSw.x + nearestSw.sym.w / 2;
      svg += connLine(g.cx, g.bot, g.cx, celulaY + 8, 'conn-line-inter');
      svg += connLine(g.cx, celulaY + 8, swCx, celulaY + 8, 'conn-line-inter');
      svg += connLine(swCx, celulaY + 8, swCx, nearestSw.y, 'conn-line-inter');
    }
  }

  for (const sw of swPos) {
    svg += sw.sym.renderSVG(sw.x, sw.y, sw.data);
  }
  for (const ctrl of ctrlPos) {
    svg += ctrl.sym.renderSVG(ctrl.x, ctrl.y, ctrl.data);
  }

  for (const ctrl of ctrlPos) {
    const ctrlCx = ctrl.x + ctrl.sym.w / 2;
    let nearestSw = null, minDist = Infinity;
    for (const sw of swPos) {
      const swCx = sw.x + sw.sym.w / 2;
      const dist = Math.abs(swCx - ctrlCx);
      if (dist < minDist) { minDist = dist; nearestSw = sw; }
    }
    if (nearestSw) {
      const swCx = nearestSw.x + nearestSw.sym.w / 2;
      const swCy = nearestSw.y + nearestSw.sym.h;
      svg += connLine(ctrlCx, ctrl.y, ctrlCx, ctrl.y - 8, 'conn-line');
      svg += connLine(ctrlCx, ctrl.y - 8, swCx, switchRow + nearestSw.sym.h + 5, 'conn-line');
      svg += connLine(swCx, switchRow + nearestSw.sym.h + 5, swCx, swCy, 'conn-line');
    }
  }

  if (nivelCelula.switches && nivelCelula.switches.length > 1 && nivelCelula.topologia === 'ring' && swPos.length > 1) {
    for (let i = 0; i < swPos.length; i++) {
      const j = (i + 1) % swPos.length;
      const cxi = swPos[i].x + swPos[i].sym.w / 2;
      const cyi = swPos[i].y + swPos[i].sym.h / 2 - 4;
      const cxj = swPos[j].x + swPos[j].sym.w / 2;
      const cyj = swPos[j].y + swPos[j].sym.h / 2 - 4;
      if (j === 0) {
        svg += `<path d="M ${cxi} ${cyi} Q ${(cxi+cxj)/2} ${cyi-40} ${cxj} ${cyj}" class="conn-line-ring" marker-end="url(#ringArrow)"/>`;
        svg += `<text x="${(cxi+cxj)/2}" y="${cyi-32}" text-anchor="middle" fill="#059669" font-size="7" font-weight="600">MRP</text>`;
      } else {
        svg += hLine(cyi, cxi, cxj, 'conn-line-ring');
        svg += `<text x="${(cxi+cxj)/2}" y="${cyi-4}" text-anchor="middle" fill="#059669" font-size="7" font-weight="600">MRP</text>`;
      }
    }
  }

  svg += lvlBg(campoY, campoH, campoColor, 'NÍVEL DE CAMPO', '●');
  const protoLabel = nivelCampo?.barramentos?.[0]?.protocolo || nivelCampo?.protocolo || 'Profibus DP';
  svg += `<text x="${W-PAD}" y="${campoY+18}" text-anchor="end" fill="#64748b" font-size="10" font-weight="600">${escSVG(protoLabel)}</text>`;

  for (const row of campoBars) {
    const { fb, y, devPos, extra } = row;
    const hasRep = fb.precisaRepetidor;
    const hasConv = fb.precisaConversorFibra;
    const extraRight = hasRep ? 120 : 0;
    const extraLeft = hasConv ? 90 : 0;
    const bw = Math.min(UW, devPos.length * 70 + 60 + extraLeft + extraRight);
    const bx = (W - bw) / 2;
    const barTop = y + 5;
    const barH = 90;
    svg += `<rect x="${bx}" y="${barTop}" width="${bw}" height="${barH}" rx="4" fill="white" stroke="#e2e8f0" stroke-width="1"/>`;
    svg += `<text x="${bx+10+extraLeft}" y="${y+22}" fill="#475569" font-size="9" font-weight="700">Barramento: ${escSVG(fb.mestre)}</text>`;
    svg += `<text x="${bx+10+extraLeft}" y="${y+34}" fill="#94a3b8" font-size="8">${escSVG(fb.protocolo)} | ${fb.nos} dispositivos | ${fb.distanciaMaxima}m max</text>`;

    if (hasConv) {
      const convX = bx + 10;
      svg += DEVICE_SYMBOLS.CONVERSOR.renderSVG(convX, y + 36, { tag: 'FD-CONV' });
    }

    const lineY = barTop + 55;
    if (devPos.length > 0) {
      const firstX = devPos[0].x + 22;
      const lastX = devPos[devPos.length - 1].x + 22;
      svg += hLine(lineY, firstX - 5, lastX + 5, 'conn-line', '');
      for (const dp of devPos) {
        svg += connLine(dp.x + 22, lineY, dp.x + 22, lineY - 5, 'conn-line', '');
        svg += dp.sym.renderSVG(dp.x, barTop + 46, dp.data);
      }
    }
    if (extra > 0) {
      svg += `<text x="${lastX+30}" y="${lineY+3}" fill="#94a3b8" font-size="8">+${extra} mais</text>`;
    }
    if (hasRep) {
      const repX = bx + bw - 100;
      svg += DEVICE_SYMBOLS.REPETIDOR.renderSVG(repX, y + 36, { tag: 'REP' });
    }
  }

  if (campoBars.length === 0) {
    svg += `<text x="${W/2}" y="${campoY+80}" text-anchor="middle" fill="#94a3b8" font-size="11">Nenhum barramento de campo configurado.</text>`;
  }

  for (const ctrl of ctrlPos) {
    const ctrlBot = ctrl.y + ctrl.sym.h;
    const ctrlCx = ctrl.x + ctrl.sym.w / 2;
    for (const row of campoBars) {
      if (row.fb.mestre === ctrl.data.tag) {
        const hasRep = row.fb.precisaRepetidor;
        const hasConv = row.fb.precisaConversorFibra;
        const eR = hasRep ? 120 : 0;
        const eL = hasConv ? 90 : 0;
        const bw = Math.min(UW, row.devPos.length * 70 + 60 + eL + eR);
        const bx = (W - bw) / 2;
        const barCx = bx + bw / 2;
        const barTop = row.y + 5;
        svg += `<line x1="${ctrlCx}" y1="${ctrlBot}" x2="${ctrlCx}" y2="${barTop - 8}" class="conn-line-inter"/>`;
        svg += `<line x1="${ctrlCx}" y1="${barTop - 8}" x2="${barCx}" y2="${barTop - 8}" class="conn-line-inter"/>`;
        svg += `<line x1="${barCx}" y1="${barTop - 8}" x2="${barCx}" y2="${barTop + 2}" class="conn-line-inter" marker-end="url(#arrEnd)"/>`;
      }
    }
  }

  svg += `<rect x="${PAD/2}" y="${totalH-30}" width="${W-PAD}" height="24" rx="3" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <text x="${PAD}" y="${totalH-14}" fill="#94a3b8" font-size="8">Legenda: </text>
    <rect x="${PAD+50}" y="${totalH-22}" width="12" height="12" rx="2" fill="#1e40af"/><text x="${PAD+64}" y="${totalH-13}" fill="#64748b" font-size="8">CLP</text>
    <rect x="${PAD+95}" y="${totalH-22}" width="12" height="12" rx="2" fill="#7c3aed"/><text x="${PAD+109}" y="${totalH-13}" fill="#64748b" font-size="8">REM</text>
    <rect x="${PAD+140}" y="${totalH-22}" width="12" height="12" rx="2" fill="#059669"/><text x="${PAD+154}" y="${totalH-13}" fill="#64748b" font-size="8">Switch</text>
    <rect x="${PAD+200}" y="${totalH-22}" width="12" height="12" rx="2" fill="#d97706"/><text x="${PAD+214}" y="${totalH-13}" fill="#64748b" font-size="8">Gateway</text>
    <rect x="${PAD+270}" y="${totalH-22}" width="12" height="12" rx="2" fill="#4f46e5"/><text x="${PAD+284}" y="${totalH-13}" fill="#64748b" font-size="8">Servidor</text>
    <circle cx="${PAD+340}" cy="${totalH-16}" r="6" fill="#78716c"/><text x="${PAD+354}" y="${totalH-13}" fill="#64748b" font-size="8">Disp. Campo</text>
    <rect x="${PAD+430}" y="${totalH-22}" width="12" height="12" rx="2" fill="#0891b2"/><text x="${PAD+444}" y="${totalH-13}" fill="#64748b" font-size="8">Conv. Fibra</text>
    <circle cx="${PAD+520}" cy="${totalH-16}" r="6" fill="#f59e0b"/><text x="${PAD+534}" y="${totalH-13}" fill="#64748b" font-size="8">Repetidor</text>
    <rect x="${PAD+590}" y="${totalH-22}" width="12" height="12" rx="2" fill="#dc2626"/><text x="${PAD+604}" y="${totalH-13}" fill="#64748b" font-size="8">Firewall</text>
    <rect x="${PAD+660}" y="${totalH-22}" width="12" height="12" rx="2" fill="#7c3aed"/><text x="${PAD+674}" y="${totalH-13}" fill="#64748b" font-size="8">Roteador</text>
    <rect x="${PAD+730}" y="${totalH-22}" width="12" height="12" rx="2" fill="#0d9488"/><text x="${PAD+744}" y="${totalH-13}" fill="#64748b" font-size="8">AP Wi-Fi</text>
    <rect x="${PAD+800}" y="${totalH-22}" width="12" height="12" rx="2" fill="#075985"/><text x="${PAD+814}" y="${totalH-13}" fill="#64748b" font-size="8">SIMOCODE</text>
    <rect x="${PAD+880}" y="${totalH-22}" width="12" height="12" rx="2" fill="#ea580c"/><text x="${PAD+894}" y="${totalH-13}" fill="#64748b" font-size="8">3RW</text>
    <rect x="${PAD+930}" y="${totalH-22}" width="12" height="12" rx="2" fill="#166534"/><text x="${PAD+944}" y="${totalH-13}" fill="#64748b" font-size="8">SINAMICS</text>
    <line x1="${PAD+1000}" y1="${totalH-16}" x2="${PAD+1030}" y2="${totalH-16}" stroke="#059669" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="${PAD+1033}" y="${totalH-13}" fill="#64748b" font-size="8">Anel MRP/MRPD</text>`;

  svg += '</svg>';
  return svg;
}

function exportSVGDownload(svgContent, filename) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'topologia_rede_industrial.svg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { generateTopologySVG, exportSVGDownload };
