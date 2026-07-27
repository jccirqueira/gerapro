function escSVG(t) {
  if (t == null) return '';
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _renderImg(x, y, sym, data) {
  const cx = x + sym.w / 2;
  const cy = y + sym.h / 2;
  const cls = sym.id ? sym.id.toLowerCase().replace(/_/g, '-') : 'device';
  return `<g class="device ${cls} device-img" data-tag="${escSVG(data.tag)}">
    <image href="${escSVG(data.imgSrc)}" x="${x}" y="${y}" width="${sym.w}" height="${sym.h}" preserveAspectRatio="xMidYMid meet"/>
    <rect x="${x+1}" y="${y+sym.h-16}" width="${sym.w-2}" height="15" fill="rgba(0,0,0,0.55)" rx="2"/>
    <text x="${cx}" y="${y+sym.h-5}" text-anchor="middle" fill="#fff" font-weight="600" font-size="8">${escSVG(data.tag || sym.label || '')}</text>
  </g>`;
}

function resolveImgSrc(tipo, fabricante, modelo) {
  if (!tipo) return null;
  const t = tipo.toLowerCase().replace(/[\s\/\-]+/g, '_');
  if (!fabricante) return `img/devices/default/${t}.png`;
  const fab = fabricante.toLowerCase().replace(/[\s\/\-]+/g, '_');
  const mod = (modelo || tipo).toLowerCase().replace(/[\s\/\-]+/g, '_');
  return `img/devices/${fab}/${mod}.png`;
}

const DEVICE_SYMBOLS = {
  PLC: {
    id: 'PLC', label: 'CLP',
    w: 140, h: 72, rx: 8,
    fill: '#1e40af', stroke: '#1e3a8a', textColor: '#fff', subColor: '#93c5fd',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device plc" data-tag="${escSVG(data.tag)}">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${y+22}" text-anchor="middle" fill="${this.textColor}" font-weight="700" font-size="12">CLP</text>
        <text x="${cx}" y="${y+40}" text-anchor="middle" fill="${this.textColor}" font-size="11">${escSVG(data.tag)}</text>
        <text x="${cx}" y="${y+56}" text-anchor="middle" fill="${this.subColor}" font-size="9">DI:${data.io.DI} DO:${data.io.DO}</text>
        <text x="${cx}" y="${y+67}" text-anchor="middle" fill="${this.subColor}" font-size="9">AI:${data.io.AI} AO:${data.io.AO}</text>
      </g>`;
    }
  },
  REM: {
    id: 'REM', label: 'REM',
    w: 120, h: 60, rx: 6,
    fill: '#7c3aed', stroke: '#6b21a8', textColor: '#fff', subColor: '#c4b5fd',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device rem" data-tag="${escSVG(data.tag)}">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${y+20}" text-anchor="middle" fill="${this.textColor}" font-weight="700" font-size="11">REM</text>
        <text x="${cx}" y="${y+36}" text-anchor="middle" fill="${this.textColor}" font-size="10">${escSVG(data.tag)}</text>
        <text x="${cx}" y="${y+51}" text-anchor="middle" fill="${this.subColor}" font-size="8">DI:${data.io.DI} DO:${data.io.DO}</text>
      </g>`;
    }
  },
  SWITCH_GEREN: {
    id: 'SWITCH_GEREN', label: 'Switch\nGerenci\u00e1vel',
    w: 100, h: 64,
    fill: '#059669', stroke: '#047857', textColor: '#fff',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      const cy = y + this.h / 2;
      const hw = this.w / 2, hh = this.h / 2;
      const pts = `${x+hw},${y} ${x+this.w},${y+hh} ${x+hw},${y+this.h} ${x},${y+hh}`;
      return `<g class="device switch">
        <polygon points="${pts}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${cy-5}" text-anchor="middle" fill="${this.textColor}" font-weight="600" font-size="9">Switch</text>
        <text x="${cx}" y="${cy+7}" text-anchor="middle" fill="${this.textColor}" font-size="8">${escSVG(data.descricao && data.descricao.includes('16') ? '16 portas' : data.descricao && data.descricao.includes('24') ? '24 portas' : '8 portas')}</text>
      </g>`;
    }
  },
  SWITCH_NAO: {
    id: 'SWITCH_NAO', label: 'Switch\nN\u00e3o-Gerenci\u00e1vel',
    w: 90, h: 56,
    fill: '#10b981', stroke: '#059669', textColor: '#fff',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      const cy = y + this.h / 2;
      const hw = this.w / 2, hh = this.h / 2;
      const pts = `${x+hw},${y} ${x+this.w},${y+hh} ${x+hw},${y+this.h} ${x},${y+hh}`;
      return `<g class="device switch-nao">
        <polygon points="${pts}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${cy-3}" text-anchor="middle" fill="${this.textColor}" font-weight="600" font-size="8">Switch</text>
        <text x="${cx}" y="${cy+7}" text-anchor="middle" fill="${this.textColor}" font-size="7">N\u00e3o-Ger.</text>
      </g>`;
    }
  },
  IHM: {
    id: 'IHM', label: 'IHM',
    w: 100, h: 60, rx: 5,
    fill: '#0284c7', stroke: '#0369a1', textColor: '#fff', subColor: '#bae6fd',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device ihm">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${y+22}" text-anchor="middle" fill="${this.textColor}" font-weight="700" font-size="11">IHM</text>
        <text x="${cx}" y="${y+40}" text-anchor="middle" fill="${this.textColor}" font-size="10">${escSVG(data.tag || 'HMI')}</text>
      </g>`;
    }
  },
  GATEWAY: {
    id: 'GATEWAY', label: 'Gateway',
    w: 80, h: 80,
    fill: '#d97706', stroke: '#b45309', textColor: '#fff',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      const cy = y + this.h / 2;
      const hw = this.w / 2, hh = this.h / 2;
      const pts = `${cx},${y} ${x+this.w},${cy} ${cx},${y+this.h} ${x},${cy}`;
      return `<g class="device gateway">
        <polygon points="${pts}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${cy+4}" text-anchor="middle" fill="${this.textColor}" font-weight="600" font-size="9">${escSVG(data.label || 'Gateway')}</text>
      </g>`;
    }
  },
  SERVIDOR: {
    id: 'SERVIDOR', label: 'Servidor',
    w: 120, h: 54, rx: 4,
    fill: '#4f46e5', stroke: '#4338ca', textColor: '#fff', subColor: '#c7d2fe',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device servidor">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${y+20}" text-anchor="middle" fill="${this.textColor}" font-weight="700" font-size="10">${escSVG(data.label || 'Servidor')}</text>
        <text x="${cx}" y="${y+36}" text-anchor="middle" fill="${this.subColor}" font-size="9">${escSVG(data.protocolo || '')}</text>
      </g>`;
    }
  },
  DISPOSITIVO_CAMPO: {
    id: 'DISPOSITIVO_CAMPO',
    w: 44, h: 44, r: 20,
    fill: '#78716c', stroke: '#57534e', textColor: '#fff', subColor: '#d6d3d1',
    renderSVG(x, y, data) {
      const cx = x + this.r + 2;
      const cy = y + this.r + 2;
      return `<g class="device field-device" data-tag="${escSVG(data.tag)}">
        <circle cx="${cx}" cy="${cy}" r="${this.r}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="1.5"/>
        <text x="${cx}" y="${cy-3}" text-anchor="middle" fill="${this.textColor}" font-weight="600" font-size="7">${escSVG(data.tag ? data.tag.slice(-4) : '')}</text>
        <text x="${cx}" y="${cy+8}" text-anchor="middle" fill="${this.subColor}" font-size="6">${escSVG(data.tipo ? data.tipo.substring(0, 3) : '')}</text>
      </g>`;
    }
  },
  CONVERSOR: {
    id: 'CONVERSOR', label: 'Conv.\nFibra',
    w: 70, h: 44, rx: 4,
    fill: '#0891b2', stroke: '#0e7490', textColor: '#fff',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device conversor">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="1.5"/>
        <text x="${cx}" y="${y+18}" text-anchor="middle" fill="${this.textColor}" font-weight="600" font-size="8">Conv.</text>
        <text x="${cx}" y="${y+30}" text-anchor="middle" fill="${this.textColor}" font-size="7">Fibra</text>
      </g>`;
    }
  },
  REPETIDOR: {
    id: 'REPETIDOR', label: 'Repetidor',
    w: 44, h: 44, r: 18,
    fill: '#f59e0b', stroke: '#d97706', textColor: '#fff',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.r + 4;
      const cy = y + this.r + 4;
      return `<g class="device repetidor">
        <circle cx="${cx}" cy="${cy}" r="${this.r}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="1.5"/>
        <text x="${cx}" y="${cy+4}" text-anchor="middle" fill="${this.textColor}" font-weight="700" font-size="7">REP</text>
      </g>`;
    }
  },
  FIREWALL: {
    id: 'FIREWALL', label: 'Firewall',
    w: 100, h: 70, rx: 4,
    fill: '#dc2626', stroke: '#b91c1c', textColor: '#fff',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device firewall" data-tag="${escSVG(data.tag)}">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${y+22}" text-anchor="middle" fill="${this.textColor}" font-weight="700" font-size="11">Firewall</text>
        <text x="${cx}" y="${y+42}" text-anchor="middle" fill="${this.textColor}" font-size="9">Industrial</text>
        <text x="${cx}" y="${y+58}" text-anchor="middle" fill="#fca5a5" font-size="8">DMZ</text>
      </g>`;
    }
  },
  ROTEADOR: {
    id: 'ROTEADOR', label: 'Roteador',
    w: 100, h: 60, rx: 4,
    fill: '#7c3aed', stroke: '#6b21a8', textColor: '#fff',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device roteador" data-tag="${escSVG(data.tag)}">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <circle cx="${cx-12}" cy="${y+22}" r="10" fill="none" stroke="${this.textColor}" stroke-width="1.5"/>
        <circle cx="${cx+12}" cy="${y+22}" r="10" fill="none" stroke="${this.textColor}" stroke-width="1.5"/>
        <line x1="${cx-12}" y1="${y+12}" x2="${cx+12}" y2="${y+12}" stroke="${this.textColor}" stroke-width="1.5"/>
        <text x="${cx}" y="${y+52}" text-anchor="middle" fill="${this.textColor}" font-weight="600" font-size="9">Roteador</text>
      </g>`;
    }
  },
  ACCESS_POINT: {
    id: 'ACCESS_POINT', label: 'Access Point',
    w: 60, h: 70, rx: 4,
    fill: '#0d9488', stroke: '#0f766e', textColor: '#fff',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device access-point" data-tag="${escSVG(data.tag)}">
        <rect x="${x}" y="${y+14}" width="${this.w}" height="${this.h-14}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <path d="M ${cx-10} ${y+8} Q ${cx} ${y-10} ${cx+10} ${y+8}" fill="none" stroke="${this.textColor}" stroke-width="2"/>
        <path d="M ${cx-6} ${y+12} Q ${cx} ${y} ${cx+6} ${y+12}" fill="none" stroke="${this.textColor}" stroke-width="1.5"/>
        <text x="${cx}" y="${y+50}" text-anchor="middle" fill="${this.textColor}" font-weight="600" font-size="8">Wi-Fi</text>
        <text x="${cx}" y="${y+62}" text-anchor="middle" fill="${this.textColor}" font-size="7">IWLAN</text>
      </g>`;
    }
  },
  SIMOCODE: {
    id: 'SIMOCODE', label: 'SIMOCODE',
    w: 100, h: 64, rx: 4,
    fill: '#075985', stroke: '#0c4a6e', textColor: '#fff', subColor: '#7dd3fc',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device simocode">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${y+18}" text-anchor="middle" fill="${this.textColor}" font-weight="800" font-size="10">SIMOCODE</text>
        <text x="${cx}" y="${y+32}" text-anchor="middle" fill="${this.subColor}" font-size="8">pro V PN</text>
        <text x="${cx}" y="${y+48}" text-anchor="middle" fill="${this.textColor}" font-size="8">${escSVG(data.tag || 'MM')}</text>
        <line x1="${x+8}" y1="${y+54}" x2="${x+this.w-8}" y2="${y+54}" stroke="${this.subColor}" stroke-width="0.5" opacity="0.5"/>
        <text x="${cx}" y="${y+62}" text-anchor="middle" fill="${this.subColor}" font-size="6">PROTECAO MOTOR</text>
      </g>`;
    }
  },
  SOFTSTARTER: {
    id: 'SOFTSTARTER', label: 'Soft Starter',
    w: 100, h: 64, rx: 4,
    fill: '#ea580c', stroke: '#c2410c', textColor: '#fff', subColor: '#fed7aa',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device softstarter">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${y+18}" text-anchor="middle" fill="${this.textColor}" font-weight="800" font-size="10">SIRIUS</text>
        <text x="${cx}" y="${y+32}" text-anchor="middle" fill="${this.subColor}" font-size="8">3RW55 PN</text>
        <path d="M ${x+20} ${y+42} L ${x+this.w-20} ${y+42} L ${x+this.w-30} ${y+56} L ${x+30} ${y+56} Z" fill="none" stroke="${this.subColor}" stroke-width="1.5"/>
        <text x="${cx}" y="${y+62}" text-anchor="middle" fill="${this.subColor}" font-size="6">SOFT STARTER</text>
      </g>`;
    }
  },
  INVERSOR_SINAMICS: {
    id: 'INVERSOR_SINAMICS', label: 'SINAMICS',
    w: 100, h: 64, rx: 4,
    fill: '#166534', stroke: '#14532d', textColor: '#fff', subColor: '#86efac',
    renderSVG(x, y, data) {
      if (data.imgSrc) return _renderImg(x, y, this, data);
      const cx = x + this.w / 2;
      return `<g class="device sinamics">
        <rect x="${x}" y="${y}" width="${this.w}" height="${this.h}" rx="${this.rx}" fill="${this.fill}" stroke="${this.stroke}" stroke-width="2"/>
        <text x="${cx}" y="${y+18}" text-anchor="middle" fill="${this.textColor}" font-weight="800" font-size="10">SINAMICS</text>
        <text x="${cx}" y="${y+32}" text-anchor="middle" fill="${this.subColor}" font-size="8">${escSVG(data.modelo || data.tipo || 'G120 PN')}</text>
        <path d="M ${x+15} ${y+44} Q ${cx-5} ${y+36} ${cx} ${y+44} Q ${cx+5} ${y+52} ${x+this.w-15} ${y+44}" fill="none" stroke="${this.subColor}" stroke-width="1.5"/>
        <text x="${cx}" y="${y+62}" text-anchor="middle" fill="${this.subColor}" font-size="6">PROFIdrive</text>
      </g>`;
    }
  }
};

function getSymbol(type, fallbackType) {
  if (!type) return fallbackType ? getSymbol(fallbackType) : DEVICE_SYMBOLS.PLC;
  const key = type.toUpperCase().replace(/[\s-]/g, '_');
  if (DEVICE_SYMBOLS[key]) return DEVICE_SYMBOLS[key];
  if (fallbackType) return getSymbol(fallbackType);
  const keys = Object.keys(DEVICE_SYMBOLS);
  for (const k of keys) {
    if (k.startsWith(key) || key.startsWith(k)) return DEVICE_SYMBOLS[k];
  }
  return DEVICE_SYMBOLS.PLC;
}

function getSymbolByEquipment(eq) {
  if (!eq || !eq.tipo) return { sym: DEVICE_SYMBOLS.PLC, imgSrc: null };
  let sym;
  if (eq.siemensImage && DEVICE_SYMBOLS[eq.siemensImage]) {
    sym = DEVICE_SYMBOLS[eq.siemensImage];
  } else {
    sym = getSymbol(eq.tipo, eq.tipoFallback);
  }
  const imgSrc = resolveImgSrc(eq.tipo, eq.fabricante, eq.modelo);
  return { sym, imgSrc };
}

export { DEVICE_SYMBOLS, getSymbol, getSymbolByEquipment, resolveImgSrc, escSVG };