const W = 1000, PAD = 40, UW = W - 2 * PAD;
const LVL_GAP = 10;

// TODO Fase 2: substituir shapes genericos por blocos DXF especificos
// por fabricante via dw.addBlock() + dw.insertBlock(). Para dispositivos
// com imagem disponivel, gerar contorno vectorial aproximado; sem imagem,
// manter fallback generico atual. DXF R12 nao suporta raster images.

function generateTopologyDXF(topologia, bom) {
  const nivelCampo = topologia.find(n => n.nivel === 'Campo');
  const nivelCelula = topologia.find(n => n.nivel === 'Célula / Controle');
  const nivelGestao = topologia.find(n => n.nivel === 'Gestão / IIoT');
  if (!nivelCelula) return null;

  const gestaoEnabled = nivelGestao && nivelGestao.habilitado;
  const gestaoH = gestaoEnabled ? 130 : 40;
  const celulaH = 210;
  const campoH = 300;
  const totalH = gestaoH + LVL_GAP + celulaH + LVL_GAP + campoH + 20;
  const dy = (y) => totalH - y;

  const dw = new DXFWriter();
  dw.addLayer('GESTAO', 6, 'CONTINUOUS');
  dw.addLayer('CELULA', 5, 'CONTINUOUS');
  dw.addLayer('CAMPO', 3, 'CONTINUOUS');
  dw.addLayer('CONEXOES', 8, 'DASHED');
  dw.addLayer('TEXTO', 7, 'CONTINUOUS');

  const gestaoY = 0;
  const celulaY = gestaoH + LVL_GAP;
  const campoY = celulaY + celulaH + LVL_GAP;

  function rbox(x, y, w, h) { dw.rect(x, y, w, h); }
  function txt(x, y, s, str) { dw.text(x, y, s || 3, 0, str || '', 'GERAPRO'); }

  function devRect(x, y, w, h, layer) {
    dw.setActiveLayer(layer);
    rbox(x, y, w, h);
  }

  function devHex(x, y, w, h, layer) {
    dw.setActiveLayer(layer);
    const hw = w / 2, hh = h / 2;
    dw.polyline([[x + hw, y], [x + w, y + hh], [x + hw, y + h], [x, y + hh], [x + hw, y]], true);
  }

  function devCircle(cx, cy, r, layer) {
    dw.setActiveLayer(layer);
    dw.circle(cx, cy, r);
  }

  function connLine(x1, y1, x2, y2) {
    dw.setActiveLayer('CONEXOES');
    dw.line(x1, y1, x2, y2);
  }

  function connText(mx, my, label) {
    dw.setActiveLayer('TEXTO');
    txt(mx, my, 2.5, label);
  }

  dw.setDimStyle('GERAPRO', { scale: 1, txt: 2.5, asz: 2.0, gap: 3.75, exo: 1.25, exe: 0.625, tad: 1, zin: 8 });
  dw.addStyle('GERAPRO', 'ARIAL.TTF', 2.5, 0.8);

  dw.setActiveLayer('GESTAO');
  rbox(PAD / 2, dy(gestaoY + gestaoH), W - PAD, gestaoH);
  txt(PAD, dy(gestaoY + 14), 4, 'NIVEL GESTAO / IIOT');

  if (gestaoEnabled) {
    const gestaoDevs = nivelGestao.dispositivos || [];
    const gSpacing = Math.min(250, UW / (gestaoDevs.length + 1));
    const gOff = (W - gSpacing * gestaoDevs.length) / 2;
    const gY = gestaoY + 45;
    let prevX = null, prevSymW = null;
    gestaoDevs.forEach((d, i) => {
      const tipo = (d.tipo || '').toLowerCase();
      const isGateway = tipo.includes('gateway') || tipo.includes('broker');
      let symW, symH;
      if (isGateway) { symW = 80; symH = 50; }
      else if (tipo.includes('firewall')) { symW = 100; symH = 50; }
      else if (tipo.includes('roteador')) { symW = 100; symH = 50; }
      else if (tipo.includes('access') || tipo.includes('ap') || tipo.includes('wifi')) { symW = 80; symH = 50; }
      else { symW = 120; symH = 40; }
      const x = gOff + gSpacing * i + (gSpacing - symW) / 2;
      if (isGateway) {
        devHex(x, dy(gY + symH), symW, symH, 'GESTAO');
        dw.setActiveLayer('TEXTO');
        txt(x + symW / 2, dy(gY + 14), 3, 'Gateway');
      } else if (tipo.includes('firewall')) {
        devRect(x, dy(gY + symH), symW, symH, 'GESTAO');
        dw.setActiveLayer('TEXTO');
        txt(x + symW / 2, dy(gY + 14), 3, 'Firewall');
        txt(x + symW / 2, dy(gY + 28), 2.5, 'Industrial DMZ');
      } else if (tipo.includes('roteador')) {
        devRect(x, dy(gY + symH), symW, symH, 'GESTAO');
        dw.setActiveLayer('TEXTO');
        txt(x + symW / 2, dy(gY + 14), 3, 'Roteador');
        txt(x + symW / 2, dy(gY + 28), 2.5, 'WAN 4G/5G');
      } else if (tipo.includes('access') || tipo.includes('ap') || tipo.includes('wifi')) {
        devRect(x, dy(gY + symH), symW, symH, 'GESTAO');
        dw.setActiveLayer('TEXTO');
        txt(x + symW / 2, dy(gY + 14), 3, 'AP');
        txt(x + symW / 2, dy(gY + 28), 2.5, 'IWLAN');
      } else {
        devRect(x, dy(gY + symH), symW, symH, 'GESTAO');
        dw.setActiveLayer('TEXTO');
        txt(x + symW / 2, dy(gY + 14), 3, d.tipo || 'Servidor');
        txt(x + symW / 2, dy(gY + 28), 2.5, d.protocolo || '');
      }
      if (prevX !== null && prevSymW !== null) {
        connLine(prevX + prevSymW, dy(gY + 20), x, dy(gY + 20));
        if (nivelGestao.protocolos) {
          const pmx = (prevX + prevSymW + x) / 2;
          connText(pmx, dy(gY + 20 - 8), nivelGestao.protocolos.length > 1 ? nivelGestao.protocolos.join('/') : nivelGestao.protocolos[0]);
        }
      }
      prevX = x;
      prevSymW = symW;
    });
  }

  dw.setActiveLayer('CELULA');
  rbox(PAD / 2, dy(celulaY + celulaH), W - PAD, celulaH);

  const gestaoConnections = [];
  if (gestaoEnabled) {
    const gestaoDevs = nivelGestao.dispositivos || [];
    const gSpacing2 = Math.min(250, UW / (gestaoDevs.length + 1));
    const gOff2 = (W - gSpacing2 * gestaoDevs.length) / 2;
    const gY2 = gestaoY + 45;
    gestaoDevs.forEach((d, i) => {
      const tipo2 = (d.tipo || '').toLowerCase();
      let symW2, symH2;
      if (tipo2.includes('gateway') || tipo2.includes('broker')) { symW2 = 80; symH2 = 50; }
      else if (tipo2.includes('access') || tipo2.includes('ap') || tipo2.includes('wifi')) { symW2 = 80; symH2 = 50; }
      else if (tipo2.includes('firewall') || tipo2.includes('roteador')) { symW2 = 100; symH2 = 50; }
      else { symW2 = 120; symH2 = 40; }
      const x2 = gOff2 + gSpacing2 * i + (gSpacing2 - symW2) / 2;
      const cx2 = x2 + symW2 / 2;
      const bot2 = gY2 + symH2;
      gestaoConnections.push({ cx: cx2, bot: bot2 });
    });
  }

  txt(PAD, dy(celulaY + 14), 4, 'NIVEL CELULA / CONTROLE');
  const topoStr = nivelCelula.topologia === 'ring' ? 'Anel MRP' : nivelCelula.topologia;
  txt(W - PAD - 200, dy(celulaY + 14), 3, nivelCelula.protocolo + ' | ' + topoStr + ' | ' + (nivelCelula.velocidade || ''));

  const controllers = nivelCelula.controladores || [];
  const switches = nivelCelula.switches || [];
  const N = controllers.length;
  const S = switches.length;
  const spacing = Math.min(UW / (Math.max(N, S) + 1), 180);
  const leftOffset = (W - spacing * Math.max(N, S)) / 2;
  const switchRow = celulaY + 30;
  const ctrlRow = celulaY + 130;

  switches.forEach((s, i) => {
    const x = leftOffset + spacing * (i + (N > S ? (N - S) / 2 : 0.5)) - 40;
    devHex(x, dy(switchRow + 50), 80, 50, 'CELULA');
    dw.setActiveLayer('TEXTO');
    txt(x + 40, dy(switchRow + 20), 2.5, 'Switch');
    txt(x + 40, dy(switchRow + 35), 2, s.descricao ? (s.descricao.includes('16') ? '16 portas' : s.descricao.includes('24') ? '24 portas' : '8 portas') : '');
  });

  controllers.forEach((c, i) => {
    const x = leftOffset + spacing * (i + (S > N ? (S - N) / 2 : 0.5)) - 60;
    devRect(x, dy(ctrlRow + 60), 120, 60, 'CELULA');
    dw.setActiveLayer('TEXTO');
    txt(x + 60, dy(ctrlRow + 18), 3, c.type === 'REM' ? 'REM' : 'CLP');
    txt(x + 60, dy(ctrlRow + 32), 2.5, c.tag || '');
    txt(x + 60, dy(ctrlRow + 46), 2, 'DI:' + (c.io.DI || 0) + ' DO:' + (c.io.DO || 0));
  });

  controllers.forEach((c, i) => {
    const x = leftOffset + spacing * (i + (S > N ? (S - N) / 2 : 0.5)) - 60;
    const cx = x + 60;
    let nearestSw = 0, minDist = Infinity;
    switches.forEach((s, si) => {
      const sx = leftOffset + spacing * (si + (N > S ? (N - S) / 2 : 0.5)) - 40;
      const dist = Math.abs(sx + 40 - cx);
      if (dist < minDist) { minDist = dist; nearestSw = si; }
    });
    const sx = leftOffset + spacing * (nearestSw + (N > S ? (N - S) / 2 : 0.5)) - 40;
    const swCx = sx + 40;
    connLine(cx, dy(ctrlRow), cx, dy(ctrlRow - 10));
    connLine(cx, dy(ctrlRow - 10), swCx, dy(switchRow + 55));
    connLine(swCx, dy(switchRow + 55), swCx, dy(switchRow + 50));
  });

  if (gestaoEnabled) {
    dw.setActiveLayer('CONEXOES');
    for (const g of gestaoConnections) {
      let nearestSw = 0, minDist = Infinity;
      switches.forEach((s, si) => {
        const sx = leftOffset + spacing * (si + (N > S ? (N - S) / 2 : 0.5)) - 40;
        const swCx = sx + 40;
        const dist = Math.abs(swCx - g.cx);
        if (dist < minDist) { minDist = dist; nearestSw = si; }
      });
      const sx = leftOffset + spacing * (nearestSw + (N > S ? (N - S) / 2 : 0.5)) - 40;
      const swCx = sx + 40;
      connLine(g.cx, dy(g.bot), g.cx, dy(celulaY + 8));
      connLine(g.cx, dy(celulaY + 8), swCx, dy(celulaY + 8));
      connLine(swCx, dy(celulaY + 8), swCx, dy(switchRow));
    }
  }

  if (switches.length > 1 && nivelCelula.topologia === 'ring') {
    for (let i = 0; i < switches.length; i++) {
      const j = (i + 1) % switches.length;
      const xi = leftOffset + spacing * (i + (N > S ? (N - S) / 2 : 0.5)) - 40;
      const xj = leftOffset + spacing * (j + (N > S ? (N - S) / 2 : 0.5)) - 40;
      dw.setActiveLayer('CONEXOES');
      dw.line(xi + 40, dy(switchRow + 10), xj + 40, dy(switchRow + 10));
      if (j === 0) {
        dw.line(xi + 40, dy(switchRow + 10), xi + 40, dy(switchRow - 20));
        dw.line(xj + 40, dy(switchRow + 10), xj + 40, dy(switchRow - 20));
        dw.line(xi + 40, dy(switchRow - 20), xj + 40, dy(switchRow - 20));
      }
    }
    dw.setActiveLayer('TEXTO');
    txt(leftOffset + spacing * Math.ceil(switches.length / 2) - 40 + 40, dy(switchRow - 30), 2.5, 'ANEL MRP');
  }

  dw.setActiveLayer('CAMPO');
  rbox(PAD / 2, dy(campoY + campoH), W - PAD, campoH);

  const barramentos = nivelCampo?.barramentos || [];

  dw.setActiveLayer('CONEXOES');
  controllers.forEach((c, i) => {
    const x = leftOffset + spacing * (i + (S > N ? (S - N) / 2 : 0.5)) - 60;
    const ctrlBot = ctrlRow + 60;
    const ctrlCx = x + 60;
    barramentos.forEach((fb, bi) => {
      if (fb.mestre === c.tag) {
        const by = campoY + 40 + bi * 90;
        const devs = fb.dispositivosCampo || [];
        const maxShow = Math.min(devs.length, 16);
        const bSpacing = Math.min(70, UW / (maxShow + 1));
        const hasRep = fb.precisaRepetidor;
        const hasConv = fb.precisaConversorFibra;
        const eR = hasRep ? 120 : 0;
        const eL = hasConv ? 90 : 0;
        const bw = Math.min(UW, maxShow * 70 + 60 + eL + eR);
        const bx = (W - bw) / 2;
        const barCx = bx + bw / 2;
        const barTop = by + 5;
        dw.line(ctrlCx, dy(ctrlBot), ctrlCx, dy(barTop - 8));
        dw.line(ctrlCx, dy(barTop - 8), barCx, dy(barTop - 8));
        dw.line(barCx, dy(barTop - 8), barCx, dy(barTop));
      }
    });
  });

  txt(PAD, dy(campoY + 14), 4, 'NIVEL DE CAMPO');

  if (barramentos.length > 0) {
    const protoLabel = barramentos[0].protocolo || 'Profibus DP';
    txt(W - PAD - 200, dy(campoY + 14), 3, protoLabel);

    barramentos.forEach((fb, bi) => {
      const by = campoY + 40 + bi * 90;
      const devs = fb.dispositivosCampo || [];
      const maxShow = Math.min(devs.length, 16);
      const bSpacing = Math.min(70, UW / (maxShow + 1));
      const bOff = (W - bSpacing * maxShow) / 2;

      dw.setActiveLayer('CAMPO');
      rbox(PAD / 2 + 10, dy(by + 75), W - PAD - 20, 75);
      txt(PAD / 2 + 20, dy(by + 14), 3, 'Barramento: ' + fb.mestre);
      txt(PAD / 2 + 20, dy(by + 28), 2.5, fb.protocolo + ' | ' + fb.nos + ' dispositivos | ' + fb.distanciaMaxima + 'm max');

      const lineY = by + 58;
      if (maxShow > 0) {
        dw.setActiveLayer('CONEXOES');
        const firstCX = bOff + bSpacing * 0;
        const lastCX = bOff + bSpacing * (maxShow - 1);
        dw.line(firstCX, dy(lineY), lastCX, dy(lineY));

        for (let i = 0; i < maxShow; i++) {
          const cx = bOff + bSpacing * i;
          dw.line(cx, dy(lineY), cx, dy(lineY - 10));
          devCircle(cx, dy(lineY - 18), 10, 'CAMPO');
          dw.setActiveLayer('TEXTO');
          txt(cx, dy(lineY - 21), 1.8, devs[i].tag ? devs[i].tag.slice(-4) : '');
          txt(cx, dy(lineY - 14), 1.5, devs[i].tipo ? devs[i].tipo.substring(0, 3) : '');
        }
      }

      if (fb.precisaRepetidor) {
        dw.setActiveLayer('CAMPO');
        const repX = PAD / 2 + 20;
        devCircle(repX + 18, dy(by + 62), 12, 'CAMPO');
        dw.setActiveLayer('TEXTO');
        txt(repX + 18, dy(by + 60), 2, 'REP');
        txt(repX + 36, dy(by + 62), 2, 'REQUER REPETIDOR');
      }

      if (fb.precisaConversorFibra) {
        dw.setActiveLayer('CAMPO');
        const convX = PAD / 2 + 220;
        rbox(convX, dy(by + 48 + 24), 50, 24);
        dw.setActiveLayer('TEXTO');
        txt(convX + 25, dy(by + 60), 2, 'FIBRA');
      }
    });
  } else {
    dw.setActiveLayer('TEXTO');
    txt(W / 2, dy(campoY + 80), 3, 'Nenhum barramento de campo configurado');
  }

  return dw.toDxfString();
}

function exportDXFDownload(dxfContent, filename) {
  if (!dxfContent) return;
  const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'topologia_rede_industrial.dxf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { generateTopologyDXF, exportDXFDownload };