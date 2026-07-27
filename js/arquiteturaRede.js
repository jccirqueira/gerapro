import { store } from './state.js';

const CONST_REDES = {
  PROFINET: { maxNodes: 256, maxDistance: 100, speed: '100 Mbps / 1 Gbps', medium: 'STP CAT6 / Fibra Óptica' },
  EtherNetIP: { maxNodes: 256, maxDistance: 100, speed: '100 Mbps / 1 Gbps', medium: 'STP CAT6 / Fibra Óptica' },
  ModbusTCP: { maxNodes: 256, maxDistance: 100, speed: '100 Mbps', medium: 'STP CAT5e / CAT6' },
  ProfibusDP: { maxNodes: 32, maxDistance: 1200, speed: '12 Mbps', medium: 'Cabo Profibus RS-485' },
  ModbusRTU: { maxNodes: 247, maxDistance: 1200, speed: '115.2 kbps', medium: 'Cabo Par Trançado RS-485' },
  IOLink: { maxNodes: 64, maxDistance: 20, speed: '230.4 kbps', medium: 'Cabo M12 3/4/5 vias' }
};

const CONFORMANCE_CLASSES = {
  'CC-A': {
    descricao: 'Conformance Class A — Básico',
    requerSwitchGerenciavel: false, suportaIRT: false, suportaTSN: false,
    velocidade: '100 Mbps', diagnosticoRede: false, snmp: false,
    aplicacao: 'Automação predial/infraestrutura, dispositivos simples',
    custoFator: 1.0
  },
  'CC-B': {
    descricao: 'Conformance Class B — Diagnóstico',
    requerSwitchGerenciavel: true, suportaIRT: false, suportaTSN: false,
    velocidade: '100 Mbps', diagnosticoRede: true, snmp: true,
    aplicacao: 'Automação fabril com diagnósticos SNMP e topologia',
    custoFator: 1.2
  },
  'CC-C': {
    descricao: 'Conformance Class C — IRT (Motion Control)',
    requerSwitchGerenciavel: true, requerASIC_IRT: true,
    suportaIRT: true, suportaTSN: false,
    velocidade: '100 Mbps / 1 Gbps', diagnosticoRede: true, snmp: true,
    jitter: '< 1 μs', aplicacao: 'Sincronismo de eixos, robótica, motion control',
    custoFator: 1.8
  },
  'CC-D': {
    descricao: 'Conformance Class D — TSN (Gigabit)',
    requerSwitchTSN: true, suportaIRT: true, suportaTSN: true,
    velocidade: '1 Gbps', diagnosticoRede: true, snmp: true,
    jitter: '< 1 μs', aplicacao: 'Convergência TI/TA, Gigabit Ethernet, Indústria 4.0',
    custoFator: 2.5
  }
};

const CABO_PROFINET_TIPOS = {
  A: { descricao: 'Tipo A — Instalação Fixa (condutor sólido)', uso: 'Calhas, eletrodutos, painéis', flexivel: false, robotica: false, custoPorMetro: 8 },
  B: { descricao: 'Tipo B — Flexível (condutor multifilar)', uso: 'Vibrações e movimentos ocasionais', flexivel: true, robotica: false, custoPorMetro: 12 },
  C: { descricao: 'Tipo C — Altamente Flexível', uso: 'Esteiras porta-cabos, flexão contínua', flexivel: true, robotica: false, custoPorMetro: 18 },
  R: { descricao: 'Tipo R — Robótica (torção extrema)', uso: 'Células robotizadas, braços articulados', flexivel: true, robotica: true, custoPorMetro: 28 }
};

const CONECTORES_PROFINET = {
  RJ45_IP20: { descricao: 'RJ45 Industrial IP20', ambiente: 'Painel', velMax: '1 Gbps', ip: 'IP20', custoUnit: 25 },
  M12_D: { descricao: 'M12 D-Coded 4 pólos', ambiente: 'Campo (IP65/67)', velMax: '100 Mbps', ip: 'IP65/67', custoUnit: 65 },
  M12_X: { descricao: 'M12 X-Coded 8 pólos', ambiente: 'Campo (IP65/67)', velMax: '10 Gbps', ip: 'IP65/67', custoUnit: 120 },
  SCRJ: { descricao: 'SCRJ — Fibra Óptica POF', ambiente: 'Campo / Longas distâncias', velMax: '100 Mbps', ip: 'IP65/67', custoUnit: 90 }
};

const TEMPO_REAL_PROFINET = {
  RT: { descricao: 'Real-Time (RT)', jitter: '1-10 ms', cicloMin: '250 μs', requerASIC: false, suportaDFP: false },
  IRT: { descricao: 'Isochronous Real-Time (IRT)', jitter: '< 1 μs', cicloMin: '31,25 μs', requerASIC: true, suportaDFP: true }
};

const REDUNDANCIA_PROFINET = {
  MRP: { descricao: 'MRP — Media Redundancy Protocol', recuperacao: '< 200 ms', custoFator: 1.0, zeroLoss: false },
  MRPD: { descricao: 'MRPD — Media Redundancy with zero-loss', recuperacao: '0 ms (duplicação de frames)', custoFator: 2.0, zeroLoss: true }
};

const SIEMENS_FIELD_DEVICES = {
  simocode: {
    tipo: 'SIMOCODE pro V PN',
    descricao: 'Gerenciamento e proteção inteligente de motores',
    protocolos: ['PROFINET'], conector: 'M12 D-Coded / RJ45',
    imagem: 'SIMOCODE',
    specs: { correnteMax: '630A (via TC)', tensao: '400 VAC', protecao: 'Sobrecarga, falta fase, térmico, PTC' }
  },
  sirius_3rw55: {
    tipo: 'SIRIUS 3RW55 Soft Starter',
    descricao: 'Chave de partida suave com bypass integrado',
    protocolos: ['PROFINET', 'PROFIBUS', 'Modbus TCP'], conector: 'RJ45 / M12',
    imagem: 'SOFTSTARTER',
    specs: { correnteMax: '480A', tensao: '690 VAC', recursos: 'Torque control, pump cleaning, STO (SIL 3)' }
  },
  sinamics_g120: {
    tipo: 'SINAMICS G120 Inversor',
    descricao: 'Inversor modular CU240E-2 PN com PROFIdrive',
    protocolos: ['PROFINET'], conector: 'RJ45 Industrial',
    imagem: 'INVERSOR_SINAMICS',
    specs: { telegrama: 'Padrão 1 (STW1/ZSW1/NSOLL_A/NIST_A)', controle: 'Vector / U/f' }
  },
  sinamics_s120: {
    tipo: 'SINAMICS S120 Servo Drive',
    descricao: 'Servoconversor multicixos para motion control',
    protocolos: ['PROFINET IRT'], conector: 'RJ45 Industrial / M12',
    imagem: 'INVERSOR_SINAMICS',
    specs: { telegrama: 'Padrão 105-108', controle: 'Servo / Vector', sincronismo: 'IRT isócrono' }
  },
  et200sp: {
    tipo: 'ET 200SP IM 155-6 PN',
    descricao: 'Periferia descentralizada modular PROFINET',
    protocolos: ['PROFINET'], conector: 'BusAdapter RJ45 / M12 / FC / Fibra',
    imagem: 'REM',
    specs: { capacidade: '64 módulos por estação', corrente: '10A via BusAdapter' }
  }
};

const SWITCH_PORT_CONFIGS = [
  { descricao: 'Switch Industrial Gerenciável 8 portas RJ45', portas: 8, tipo: 'gerenciavel' },
  { descricao: 'Switch Industrial Gerenciável 16 portas RJ45', portas: 16, tipo: 'gerenciavel' },
  { descricao: 'Switch Industrial Gerenciável 24 portas RJ45', portas: 24, tipo: 'gerenciavel' },
  { descricao: 'Switch Industrial Não-Gerenciável 8 portas RJ45', portas: 8, tipo: 'nao-gerenciavel' },
  { descricao: 'Switch Industrial Não-Gerenciável 5 portas RJ45', portas: 5, tipo: 'nao-gerenciavel' }
];

const FIELD_DEVICE_BORNE_RULES = {
  DI: { bornesPorPonto: 1, bornesFusiveis: true },
  DO: { bornesPorPonto: 1, borneFusiveis: false },
  AI: { bornesPorPonto: 2, borneFusiveis: false },
  AO: { bornesPorPonto: 2, borneFusiveis: false },
  RTD: { bornesPorPonto: 3, borneFusiveis: false },
  TC: { bornesPorPonto: 2, borneFusiveis: false }
};

const FIBRA_OPTICA_TIPOS = {
  multimodo_OM3: { descricao: 'Multimodo OM3', alcanceMax: 300, conector: 'LC', custoPorMetro: 12 },
  multimodo_OM4: { descricao: 'Multimodo OM4', alcanceMax: 550, conector: 'LC', custoPorMetro: 15 },
  monomodo_OS2: { descricao: 'Monomodo OS2', alcanceMax: 10000, conector: 'LC/SC', custoPorMetro: 8 }
};

const CABO_CATEGORIAS = {
  CAT5e: { descricao: 'Cabo U/UTP CAT5e 4 pares', blindagem: 'U/UTP', freqMax: '100 MHz' },
  CAT6: { descricao: 'Cabo SF/UTP CAT6 4 pares', blindagem: 'SF/UTP', freqMax: '250 MHz' },
  CAT6a: { descricao: 'Cabo F/UTP CAT6a 4 pares', blindagem: 'F/UTP', freqMax: '500 MHz' },
  CAT7: { descricao: 'Cabo S/FTP CAT7 4 pares', blindagem: 'S/FTP', freqMax: '600 MHz' }
};

const NORMAS_INDUSTRIAIS = {
  isa95: { nome: 'ISA-95 (IEC 62264)', descricao: 'Integração sistemas de automação e enterprise' },
  iec62443: { nome: 'IEC 62443', descricao: 'Cybersecurity redes industriais' },
  nbr14565: { nome: 'NBR 14565', descricao: 'Cabeamento estruturado para edifícios comerciais' },
  iec61158: { nome: 'IEC 61158', descricao: 'Redes de comunicação industrial' }
};

class EntradaInvalidaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EntradaInvalidaError';
  }
}

function validateInput(controllers, options) {
  if (!controllers || controllers.length === 0) {
    throw new EntradaInvalidaError('Nenhum controlador (CLP/REM) informado.');
  }
  for (const ctrl of controllers) {
    if (!ctrl.tag) throw new EntradaInvalidaError(`Controlador sem tag: ${JSON.stringify(ctrl)}`);
    if (!ctrl.ioList && !ctrl.io) throw new EntradaInvalidaError(`Controlador "${ctrl.tag}" sem lista de I/O.`);
  }
  const validTopos = ['ring', 'star', 'line', 'tree', 'mesh'];
  if (options.topologyType && !validTopos.includes(options.topologyType)) {
    throw new EntradaInvalidaError(`Topologia inválida: "${options.topologyType}". Válidas: ${validTopos.join(', ')}`);
  }
}

function _normalizeProtocolName(proto) {
  if (!proto) return '';
  return proto.toUpperCase().replace(/[\s-]/g, '').replace(/[/]/g, '');
}

function _getIOTotals(ctrl) {
  const io = ctrl.ioList || ctrl.io || {};
  const DI = parseInt(io.totalDI) || 0;
  const DO = parseInt(io.totalDO) || 0;
  const AI = parseInt(io.totalAI) || 0;
  const AO = parseInt(io.totalAO) || 0;
  return { DI, DO, AI, AO, total: DI + DO + AI + AO };
}

function _calcSparePercent(total) {
  if (total <= 64) return 0.5;
  if (total <= 256) return 0.3;
  return 0.2;
}

function buildTopology(controllers, options) {
  const conformanceClass = options.conformanceClass || '';
  const profinetRealTime = options.profinetRealTime || '';
  const profinetRedundancy = options.profinetRedundancy || '';
  const profinetCableType = options.profinetCableType || '';
  const profinetConnector = options.profinetConnector || '';
  const hasSiemensDevices = options.hasSiemensDevices || false;
  const hasPROFIsafe = options.hasPROFIsafe || false;

  const ccInfo = (options.industrialProtocol === 'PROFINET' && CONFORMANCE_CLASSES[conformanceClass])
    ? CONFORMANCE_CLASSES[conformanceClass]
    : null;

  const topologia = [
    { nivel: 'Campo', barramentos: [] },
    {
      nivel: 'Célula / Controle',
      controladores: [],
      switches: [],
      protocolo: options.industrialProtocol || 'PROFINET',
      topologia: options.topologyType || 'ring',
      velocidade: ccInfo ? ccInfo.velocidade : (CONST_REDES[_normalizeProtocolName(options.industrialProtocol || 'PROFINET')]?.speed || '100 Mbps'),
      meioFisico: options.useFiberOptic
        ? 'Fibra Óptica'
        : (ccInfo ? 'STP CAT6' : (CONST_REDES[_normalizeProtocolName(options.industrialProtocol || 'PROFINET')]?.medium || 'STP CAT6')),
      conformanceClass: options.industrialProtocol === 'PROFINET' ? conformanceClass : null,
      profinetRealTime: options.industrialProtocol === 'PROFINET' ? profinetRealTime : null,
      profinetRedundancy: options.industrialProtocol === 'PROFINET' ? profinetRedundancy : null,
      hasPROFIsafe
    },
    { nivel: 'Gestão / IIoT', habilitado: false, protocolos: [], dispositivos: [] }
  ];
  const nivelCampo = topologia[0];
  const nivelCelula = topologia[1];
  const nivelGestao = topologia[2];

  const hasSCADA = options.hasSCADA || false;
  const hasIIoT = options.hasIIoT || false;
  const useFiberOptic = options.useFiberOptic || false;
  const fiberType = options.fiberType || 'multimodo_OM4';
  const hasFirewall = options.hasFirewall || false;
  const hasRouter = options.hasRouter || false;
  const hasAccessPoint = options.hasAccessPoint || false;

  if (hasSCADA || hasIIoT) {
    nivelGestao.habilitado = true;
    nivelGestao.protocolos = [];
    if (hasSCADA) nivelGestao.protocolos.push('OPC UA');
    if (hasIIoT) nivelGestao.protocolos.push('MQTT');

    if (hasFirewall) {
      nivelGestao.dispositivos.push({
        tag: 'FW-01', tipo: 'firewall', label: 'Firewall Industrial',
        descricao: 'Firewall Industrial DMZ',
        protocolo: nivelGestao.protocolos.join('/'),
        fabricante: 'Siemens', modelo: 'SCALANCE mGuard'
      });
    }

    nivelGestao.dispositivos.push({
      tag: 'GATEWAY-01', tipo: 'gateway', label: 'Gateway',
      protocolo: nivelGestao.protocolos.join('/'),
      fabricante: 'Siemens', modelo: 'SCALANCE M-800'
    });

    if (hasRouter) {
      nivelGestao.dispositivos.push({
        tag: 'ROT-01', tipo: 'roteador', label: 'Roteador Industrial',
        descricao: 'Roteador WAN 4G/5G',
        fabricante: 'Siemens', modelo: 'SCALANCE M / IR'
      });
    }

    if (hasAccessPoint) {
      nivelGestao.dispositivos.push({
        tag: 'AP-01', tipo: 'access-point', label: 'Access Point IWLAN',
        descricao: 'Wi-Fi Industrial IWLAN',
        fabricante: 'Siemens', modelo: 'SCALANCE W / Catalyst IW'
      });
    }
  }

  let totalFieldDevices = 0;
  const fieldProtocol = options.fieldbusProtocol || 'Profibus DP';
  const fieldNorm = _normalizeProtocolName(fieldProtocol);

  for (const ctrl of controllers) {
    const io = _getIOTotals(ctrl);
    const totalIO = io.total;
    const sparePct = _calcSparePercent(totalIO);

    const controlador = {
      tag: ctrl.tag,
      tipo: ctrl.type === 'REM' ? 'REM' : 'PLC',
      painelTag: ctrl.painelTag || '',
      io,
      totalIO,
      reservaRecomendada: Math.ceil(totalIO * sparePct),
      protocolo: options.industrialProtocol || 'PROFINET',
      fabricante: ctrl.technical?.fabricante || '',
      modelo: ctrl.technical?.modelo || ''
    };
    nivelCelula.controladores.push(controlador);

    const fieldDevicesCount = Math.max(4, Math.ceil(totalIO / 4));
    totalFieldDevices += fieldDevicesCount;

    const fieldbus = {
      mestre: ctrl.tag,
      protocolo: fieldProtocol,
      nos: fieldDevicesCount,
      maximoPermitido: CONST_REDES[fieldNorm]?.maxNodes || 32,
      distanciaMaxima: CONST_REDES[fieldNorm]?.maxDistance || 1200,
      precisaRepetidor: false,
      precisaConversorFibra: false,
      conversorFibra: null,
      dispositivosCampo: []
    };

    if (fieldbus.nos > fieldbus.maximoPermitido) {
      fieldbus.precisaRepetidor = true;
    }

    if (useFiberOptic && fiberType !== 'nao' && fiberType) {
      fieldbus.precisaConversorFibra = true;
      const fibInfo = FIBRA_OPTICA_TIPOS[fiberType] || FIBRA_OPTICA_TIPOS.multimodo_OM4;
      fieldbus.conversorFibra = { tipo: fiberType, descricao: fibInfo.descricao, conector: fibInfo.conector };
    } else if (useFiberOptic === true || (options.estimatedCableLength || 0) > 100) {
      fieldbus.precisaConversorFibra = true;
      const dist = options.estimatedCableLength || 500;
      let tipoFib = 'multimodo_OM4';
      if (dist > 550) tipoFib = 'monomodo_OS2';
      else if (dist <= 300) tipoFib = 'multimodo_OM3';
      const fibInfo = FIBRA_OPTICA_TIPOS[tipoFib];
      fieldbus.conversorFibra = { tipo: tipoFib, descricao: fibInfo.descricao, conector: fibInfo.conector };
    }

    const genericTypes = ['Módulo E/S Remota', 'Sensor Inteligente', 'Atuador Inteligente', 'Transmissor', 'Partida de Motor'];
    const siemensTypes = Object.values(SIEMENS_FIELD_DEVICES);
    const deviceTypes = hasSiemensDevices
      ? [...genericTypes.slice(0, 2), ...siemensTypes.map(s => s.tipo), ...genericTypes.slice(2)]
      : genericTypes;

    for (let i = 0; i < fieldDevicesCount; i++) {
      const dt = deviceTypes[i % deviceTypes.length];
      const siemensDev = hasSiemensDevices ? Object.values(SIEMENS_FIELD_DEVICES).find(s => s.tipo === dt) : null;
      fieldbus.dispositivosCampo.push({
        tag: `${ctrl.tag}-FD${String(i + 1).padStart(2, '0')}`,
        tipo: dt,
        endereco: i + 1,
        fabricante: siemensDev ? 'Siemens' : (ctrl.technical?.fabricante || ''),
        modelo: siemensDev ? dt : '',
        siemensImage: siemensDev ? siemensDev.imagem : null,
        siemensSpecs: siemensDev ? siemensDev.specs : null
      });
    }

    nivelCampo.barramentos.push(fieldbus);
  }

  const totalEthernetDevices = controllers.length + nivelCampo.barramentos.length;
  const switches = calcularSwitches(totalEthernetDevices, options.topologyType || 'ring', controllers, options);
  nivelCelula.switches = switches;

  return topologia;
}

function calcularSwitches(totalDispositivos, topologia, controllers, options) {
  const result = [];
  const hasRouter = options?.hasRouter || false;
  const hasFirewall = options?.hasFirewall || false;
  const hasAP = options?.hasAccessPoint || false;
  const conformanceClass = options?.conformanceClass || '';
  const profinetRealTime = options?.profinetRealTime || '';
  const profinetRedundancy = options?.profinetRedundancy || '';
  const ccInfo = conformanceClass ? CONFORMANCE_CLASSES[conformanceClass] : null;
  const isPROFINET = (options?.industrialProtocol || '') === 'PROFINET';
  const isIRT = isPROFINET && profinetRealTime === 'IRT';
  const isMRPD = isPROFINET && profinetRedundancy === 'MRPD';
  const isCC_D = isPROFINET && conformanceClass === 'CC-D';
  const isCC_C = isPROFINET && conformanceClass === 'CC-C';

  let extraPorts = 0;
  if (hasRouter) extraPorts++;
  if (hasFirewall) extraPorts++;
  if (hasAP) extraPorts++;
  const adjustedDevices = totalDispositivos + extraPorts;

  if (topologia === 'tree') {
    const switchesAccess = Math.max(1, Math.ceil(controllers.length / 2));
    const portasAccess = adjustedDevices > 10 ? 16 : 8;
    result.push({
      descricao: `Switch Industrial Gerenciável ${portasAccess} portas (acesso)`,
      quantidade: switchesAccess,
      portas: portasAccess,
      portasUsadas: Math.ceil(adjustedDevices / switchesAccess) + 1,
      margemExpansao: portasAccess - (Math.ceil(adjustedDevices / switchesAccess) + 1),
      tipo: 'acesso', nivel: 'access'
    });
    const switchesCore = Math.max(1, Math.ceil(switchesAccess / 2));
    result.push({
      descricao: 'Switch Industrial Gerenciável 24 portas (core)',
      quantidade: switchesCore,
      portas: 24,
      portasUsadas: switchesAccess + 2,
      margemExpansao: 24 - switchesAccess - 2,
      tipo: 'core', nivel: 'core'
    });
    if (controllers.length > 1) {
      result.push({
        descricao: 'Conversor de Mídia Fibra Óptica MM 100/1000M',
        quantidade: switchesCore * 2,
        tipo: 'conversor-mm',
        justificativa: 'Uplink fibra entre switches core e access'
      });
    }
    return result;
  }

  if (adjustedDevices <= 4) {
    result.push({
      descricao: 'Switch Industrial Não-Gerenciável 8 portas RJ45',
      quantidade: 1, portas: 8,
      portasUsadas: adjustedDevices + 1,
      margemExpansao: 8 - (adjustedDevices + 1),
      tipo: 'acesso'
    });
  } else if (adjustedDevices <= 12) {
    result.push({
      descricao: 'Switch Industrial Gerenciável 16 portas RJ45',
      quantidade: 1, portas: 16,
      portasUsadas: adjustedDevices + 2,
      margemExpansao: 16 - (adjustedDevices + 2),
      tipo: 'acesso'
    });
  } else {
    const qtdSwitches = Math.ceil(adjustedDevices / 10);
    const portas = adjustedDevices > 20 ? 24 : 16;
    result.push({
      descricao: `Switch Industrial Gerenciável ${portas} portas RJ45`,
      quantidade: qtdSwitches, portas,
      portasUsadas: Math.ceil(adjustedDevices / qtdSwitches) + 1,
      margemExpansao: portas - (Math.ceil(adjustedDevices / qtdSwitches) + 1),
      tipo: qtdSwitches > 1 ? 'distribuicao' : 'acesso'
    });
  }

  if ((topologia === 'ring' || topologia === 'mesh') && controllers.length > 1) {
    const qtdSwitchesAnel = Math.max(1, Math.ceil(controllers.length / 3));

    if (isMRPD) {
      result.push({
        descricao: 'Switch Industrial Gerenciável 8 portas (redundância MRPD zero-loss)',
        quantidade: qtdSwitchesAnel * 2, portas: 8,
        tipo: 'redundancia',
        protocoloRedundancia: 'MRPD — Duplicação de frames, 0ms de perda',
        requerSwitchDuplicado: true
      });
    } else if (isIRT) {
      result.push({
        descricao: 'Switch Industrial IRT 8 portas (ASIC dedicado, anel MRP)',
        quantidade: qtdSwitchesAnel, portas: 8,
        tipo: 'redundancia',
        protocoloRedundancia: 'IRT c/ MRP — Jitter < 1 μs',
        requerASIC: true
      });
    } else {
      result.push({
        descricao: 'Switch Industrial Gerenciável 8 portas (redundância)',
        quantidade: qtdSwitchesAnel, portas: 8,
        tipo: 'redundancia',
        protocoloRedundancia: topologia === 'ring' ? 'MRP (Media Redundancy Protocol)' : 'MRP + Link Aggregation'
      });
    }
  }

  if (topologia === 'mesh' && controllers.length >= 3) {
    const linksExtras = controllers.length * 2;
    result.push({
      descricao: 'Módulo SFP+ para interconexão malha',
      quantidade: linksExtras, portas: 1,
      tipo: 'sfp-malha',
      justificativa: 'Conexões adicionais para topologia malha parcial'
    });
  }

  if (isCC_D) {
    const qtdTSN = Math.max(1, Math.ceil(adjustedDevices / 8));
    result.push({
      descricao: 'Switch TSN Gerenciável Gigabit (CC-D, compatível IEEE 802.1Qbv)',
      quantidade: qtdTSN, portas: adjustedDevices > 16 ? 24 : 16,
      tipo: 'tsn',
      protocoloRedundancia: 'TSN — Time Sensitive Networking, reserva de banda',
      requerTSN: true
    });
    if (isMRPD) {
      result.push({
        descricao: 'Módulo SFP+ 1G para anel MRPD (zero-loss)',
        quantidade: qtdTSN * 2, portas: 1,
        tipo: 'sfp-mrpd',
        justificativa: 'Portas dedicadas para duplicação de frames MRPD no anel TSN'
      });
    }
  }

  if ((controllers.length || 0) > 1) {
    result.push({
      descricao: 'Conversor de Mídia Fibra Óptica MM 100/1000M',
      quantidade: 2, tipo: 'conversor',
      justificativa: 'Interligação entre switches'
    });
  }

  return result;
}

function gerarEnderecamentoIP(controllers, options) {
  const baseIP = options.baseIP || '10.0.0.0';
  const prefixo = parseInt(options.prefixIP) || 24;
  const qtdVlans = Math.min(parseInt(options.qtdVlans) || 3, 10);
  const isPROFINET = (options.industrialProtocol || '') === 'PROFINET';

  const vlans = [];
  const nomesVlan = ['CAMPO', 'CELULA_CONTROLE', 'GESTAO_IIOT', 'SEGURANCA_DMZ', 'MANUTENCAO',
    'SUPERVISAO', 'HMI', 'ENGENHARIA', 'REDUNDANCIA', 'CONVIDADOS'];
  const octetos = baseIP.split('.').map(Number);
  const base3 = octetos[2] || 0;

  for (let i = 0; i < qtdVlans; i++) {
    const vlanId = 10 + i * 10;
    vlans.push({
      nome: nomesVlan[i] || `VLAN_${vlanId}`,
      vlanId,
      subnet: `${octetos[0]}.${octetos[1]}.${base3 + i}.0/${prefixo}`,
      gateway: `${octetos[0]}.${octetos[1]}.${base3 + i}.1`
    });
  }

  const dispositivos = [];
  let ipCount = 2;

  for (const ctrl of controllers) {
    const vlanCampo = vlans.find(v => v.nome === 'CAMPO') || vlans[0];
    const tagSanitized = ctrl.tag.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '');
    const stationName = isPROFINET ? `${tagSanitized}-${(ctrl.type || 'plc').toLowerCase()}` : '';
    dispositivos.push({
      tag: ctrl.tag, tipo: ctrl.type || 'PLC', vlan: vlanCampo.nome,
      ip: `${octetos[0]}.${octetos[1]}.${base3}.${ipCount++}`,
      stationName
    });
  }

  return { vlans, dispositivos };
}

function calcularCabos(controllers, fieldbusBarramentos, distanciaMedia, options) {
  const cabos = [];
  const distTotal = distanciaMedia || 500;
  const cableCat = options?.cableCategory || 'CAT6';
  const catInfo = CABO_CATEGORIAS[cableCat] || CABO_CATEGORIAS.CAT6;
  const fiberType = options?.fiberType || 'multimodo_OM4';
  const fibInfo = FIBRA_OPTICA_TIPOS[fiberType];
  const hasRouter = options?.hasRouter || false;
  const hasFirewall = options?.hasFirewall || false;
  const hasAP = options?.hasAccessPoint || false;
  const topologia = options?.topologyType || 'ring';
  const profinetCableType = options?.profinetCableType || '';
  const profinetConnector = options?.profinetConnector || '';

  const usandoCaboProfinet = profinetCableType && CABO_PROFINET_TIPOS[profinetCableType];
  const usandoConectorProfinet = profinetConnector && CONECTORES_PROFINET[profinetConnector];

  let descCabo;
  if (usandoCaboProfinet) {
    const ci = CABO_PROFINET_TIPOS[profinetCableType];
    descCabo = `${ci.descricao} — Aplicação: ${ci.uso}`;
    cabos.push({
      descricao: `Cabo PROFINET ${descCabo}`,
      quantidade: distTotal, unidade: 'm',
      tipo: 'profinet-cabo',
      custoPorMetro: ci.custoPorMetro,
      justificativa: `Cabeamento PROFINET para interligação dos dispositivos — ${ci.uso}`
    });
  } else {
    descCabo = `${catInfo.descricao} (${catInfo.blindagem}, ${catInfo.freqMax})`;
    cabos.push({
      descricao: `Cabo Ethernet ${descCabo}`,
      quantidade: distTotal, unidade: 'm',
      tipo: 'ethernet',
      justificativa: 'Cabeamento horizontal para interligação dos dispositivos da rede industrial'
    });
  }

  if (usandoConectorProfinet) {
    const ci = CONECTORES_PROFINET[profinetConnector];
    const qtdConectores = Math.ceil(distTotal / 5) * 2;
    cabos.push({
      descricao: `Conector ${ci.descricao} (${ci.ambiente}, ${ci.velMax})`,
      quantidade: qtdConectores, unidade: 'un',
      tipo: 'profinet-conector',
      custoUnitario: ci.custoUnit,
      justificativa: `Conectores ${ci.descricao} para terminação dos cabos em ambiente ${ci.ambiente}`
    });
  } else {
    cabos.push({
      descricao: `Conector RJ45 blindado ${cableCat}`,
      quantidade: Math.ceil(distTotal / 5) * 2, unidade: 'un',
      tipo: 'conector',
      justificativa: 'Conectores para terminação dos cabos Ethernet'
    });
  }

  cabos.push({
    descricao: 'Patch Cord RJ45 CAT6 2m',
    quantidade: controllers.length + fieldbusBarramentos.length + (hasRouter ? 1 : 0) + (hasFirewall ? 1 : 0) + (hasAP ? 1 : 0),
    unidade: 'un', tipo: 'patch-cord',
    justificativa: 'Cordões de manobra para conexão dos equipamentos ativos'
  });

  for (const fb of fieldbusBarramentos) {
    const fieldNorm = _normalizeProtocolName(fb.protocolo);
    const meioField = CONST_REDES[fieldNorm]?.medium || 'Cabo RS-485';
    cabos.push({
      descricao: `Cabo ${meioField} - barramento ${fb.mestre}`,
      quantidade: Math.max(100, Math.ceil(fb.distanciaMaxima * 0.3)), unidade: 'm',
      tipo: 'fieldbus',
      justificativa: `Cabeamento do barramento fieldbus ${fb.protocolo} do mestre ${fb.mestre}`
    });

    if (fb.precisaRepetidor) {
      cabos.push({
        descricao: 'Repetidor Profibus DP RS-485',
        quantidade: 1, unidade: 'un',
        tipo: 'repetidor',
        justificativa: 'Número de nós excede o limite máximo de dispositivos por segmento'
      });
    }

    if (fb.precisaConversorFibra && fb.conversorFibra) {
      const fibDesc = fibInfo ? fibInfo.descricao : 'Fibra Óptica';
      cabos.push({
        descricao: `Conversor RS-485 / ${fibDesc}`,
        quantidade: 2, unidade: 'un',
        tipo: 'conversor',
        justificativa: `Distância superior a 100m entre segmentos de rede - ${fb.conversorFibra.conector}`
      });
      cabos.push({
        descricao: `Cabo ${fibDesc} ${fibInfo?.conector || 'LC'}`,
        quantidade: Math.min(distTotal, fibInfo?.alcanceMax || 550), unidade: 'm',
        tipo: 'fibra-optica',
        justificativa: `Enlace óptico entre conversores - alcance ${fibInfo?.alcanceMax || 550}m`
      });
    }

    cabos.push({
      descricao: `Resistor de Terminação ${fb.protocolo}`,
      quantidade: 2, unidade: 'un',
      tipo: 'terminacao',
      justificativa: 'Dois resistores por segmento (início e fim do barramento)'
    });
  }

  if (topologia === 'tree') {
    cabos.push({
      descricao: `Cabo Fibra Óptica ${fibInfo?.descricao || 'MM'} - Uplink Core/Access`,
      quantidade: Math.min(200, distTotal * 0.2), unidade: 'm',
      tipo: 'fibra-uplink',
      justificativa: 'Uplink entre switches core e access na topologia árvore'
    });
  }

  cabos.sort((a, b) => {
    const order = ['ethernet', 'conector', 'patch-cord', 'fieldbus', 'repetidor', 'conversor', 'fibra-optica', 'fibra-uplink', 'terminacao'];
    const ia = order.indexOf(a.tipo);
    const ib = order.indexOf(b.tipo);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return cabos;
}

function validarConformidade(topologia, options) {
  const resultados = [];
  const nivelGestao = topologia.find(n => n.nivel === 'Gestão / IIoT');
  const nivelCampo = topologia.find(n => n.nivel === 'Campo');
  const nivelCelula = topologia.find(n => n.nivel === 'Célula / Controle');

  resultados.push({
    norma: NORMAS_INDUSTRIAIS.isa95.nome,
    status: 'ok',
    mensagem: 'Arquitetura segue modelo hierárquico 3 níveis (Campo, Célula, Gestão) conforme ISA-95'
  });

  const temFirewall = nivelGestao?.dispositivos?.some(d => d.tipo === 'firewall');
  if (nivelGestao?.habilitado && !temFirewall) {
    resultados.push({
      norma: NORMAS_INDUSTRIAIS.iec62443.nome,
      status: 'warn',
      mensagem: 'Nível Gestão/IIoT habilitado sem firewall industrial. Recomenda-se DMZ conforme IEC 62443'
    });
  } else if (nivelGestao?.habilitado && temFirewall) {
    resultados.push({
      norma: NORMAS_INDUSTRIAIS.iec62443.nome,
      status: 'ok',
      mensagem: 'Firewall industrial presente na DMZ entre nível Gestão e Célula conforme IEC 62443'
    });
  } else {
    resultados.push({
      norma: NORMAS_INDUSTRIAIS.iec62443.nome,
      status: 'info',
      mensagem: 'Nível Gestão não habilitado. Avaliar necessidade de firewall conforme IEC 62443'
    });
  }

  const catOk = (options.cableCategory || 'CAT6') !== 'CAT5e';
  resultados.push({
    norma: NORMAS_INDUSTRIAIS.nbr14565.nome,
    status: catOk ? 'ok' : 'warn',
    mensagem: catOk
      ? `Cabeamento ${options.cableCategory} atende requisitos NBR 14565 para ambiente industrial`
      : 'Categoria CAT5e pode ser insuficiente para ambiente industrial. Prefira CAT6 ou superior'
  });

  if (options.hasPROFIsafe) {
    const temFirewallProfisafe = nivelGestao?.dispositivos?.some(d => d.tipo === 'firewall');
    resultados.push({
      norma: 'IEC 61508 / IEC 62061 (Segurança Funcional)',
      status: temFirewallProfisafe ? 'ok' : 'warn',
      mensagem: temFirewallProfisafe
        ? 'Perfil PROFIsafe ativo com firewall na DMZ. Comunicação de segurança (SIL 3) isolada conforme IEC 62443 e IEC 61508'
        : 'PROFIsafe ativo sem firewall industrial. Recomenda-se DMZ para separação dos dados de segurança'
    });
  }

  if (options.industrialProtocol === 'PROFINET' && options.conformanceClass === 'CC-D') {
    if (!options.cableCategory || options.cableCategory === 'CAT5e') {
      resultados.push({
        norma: NORMAS_INDUSTRIAIS.nbr14565.nome,
        status: 'warn',
        mensagem: 'Classe CC-D (TSN) requer CAT6a ou superior para suportar Gigabit Ethernet com determinismo'
      });
    }
  }

  if (options.industrialProtocol === 'PROFINET' && options.profinetRedundancy === 'MRPD') {
    resultados.push({
      norma: 'PROFINET MRPD (IEC 61158)',
      status: 'info',
      mensagem: 'MRPD com duplicação de frames garante 0ms de perda em falha de cabo. Exige switches compatíveis com duplicação de mídia'
    });
  }

  for (const fb of (nivelCampo?.barramentos || [])) {
    if (fb.nos > fb.maximoPermitido) {
      resultados.push({
        norma: NORMAS_INDUSTRIAIS.iec61158.nome,
        status: 'warn',
        mensagem: `Barramento "${fb.mestre}" excede limite de ${fb.maximoPermitido} nós (${fb.nos} atuais). Requer repetidor`
      });
    }
  }

  return resultados;
}

function gerarFichasTecnicas(bom, options) {
  const fichas = [];
  const cableCat = options?.cableCategory || 'CAT6';
  const catInfo = CABO_CATEGORIAS[cableCat];
  const ccInfo = options?.conformanceClass ? CONFORMANCE_CLASSES[options.conformanceClass] : null;

  for (const sw of (bom.switches || [])) {
    const isGerenciavel = sw.tipo !== 'nao-gerenciavel' && !sw.descricao.includes('Não-Gerenciável');
    const isTSN = sw.tipo === 'tsn' || sw.requerTSN;
    const isIRTSwitch = sw.requerASIC;
    const isMRPDSwitch = sw.requerSwitchDuplicado;

    let portasDesc = `${sw.portas}x RJ45 10/100/1000`;
    let tempRange = '-40°C a +75°C';
    let normas = 'IEC 61850-3, IEEE 1613';

    if (isTSN) {
      portasDesc = `${sw.portas}x RJ45 10/100/1000/2.5G, IEEE 802.1Qbv/Qci/AS`;
      tempRange = '-40°C a +75°C';
      normas = 'IEC 61850-3, IEEE 802.1 TSN, IEC 62443-4-2';
    } else if (isIRTSwitch) {
      portasDesc = `${sw.portas}x RJ45 100M com ASIC IRT integrado (ERTEC)`;
      normas = 'IEC 61850-3, IEEE 1613, PROFINET CC-C';
    }

    fichas.push({
      equipamento: sw.descricao,
      fabricanteSugerido: isGerenciavel ? (isTSN ? 'Siemens SCALANCE XC-200 TSN / Hirschmann RSPE TSN' : 'Siemens SCALANCE / Cisco / Hirschmann') : 'Weidmüller / Phoenix Contact',
      especificacoes: {
        portas: portasDesc,
        gerenciamento: isGerenciavel ? 'Gerenciável (Web/SNMP/CLI)' : 'Não-Gerenciável',
        alimentacao: '24 VDC (18-36 V) redundante',
        temperatura: tempRange,
        protecao: 'IP30',
        normas
      }
    });
  }

  if (options?.hasFirewall) {
    fichas.push({
      equipamento: 'Firewall Industrial DMZ',
      fabricanteSugerido: 'Siemens SCALANCE / Phoenix Contact mGuard',
      especificacoes: {
        portas: '4x RJ45 10/100/1000',
        recursos: 'NAT, VPN (IPsec/OpenVPN), Filtragem Deep Packet, DMZ',
        alimentacao: '24 VDC',
        temperatura: '-20°C a +60°C',
        protecao: 'IP30',
        normas: 'IEC 62443, NIST SP 800-82'
      }
    });
  }

  if (options?.hasRouter) {
    fichas.push({
      equipamento: 'Roteador Industrial 4G/5G',
      fabricanteSugerido: 'Siemens SCALANCE M / Cisco IR',
      especificacoes: {
        interfaces: '2x RJ45 + 2x SFP + 1x SIM 4G/5G',
        recursos: 'Roteamento estático/dinâmico, NAT, VPN, LTE/5G failover',
        alimentacao: '24 VDC',
        temperatura: '-40°C a +70°C',
        protecao: 'IP40',
        normas: 'IEC 62443, 3GPP Release 16'
      }
    });
  }

  if (options?.hasAccessPoint) {
    fichas.push({
      equipamento: 'Access Point Wi-Fi Industrial IWLAN',
      fabricanteSugerido: 'Siemens SCALANCE W / Cisco Catalyst IW',
      especificacoes: {
        interfaces: '1x RJ45 10/100/1000 + 2x Antena R-SMA',
        recursos: 'IEEE 802.11ax (Wi-Fi 6), Roaming rápido, WPA3-Enterprise',
        alimentacao: 'PoE+ (802.3at) ou 24 VDC',
        temperatura: '-40°C a +65°C',
        protecao: 'IP54',
        normas: 'IEEE 802.11, IWLAN, WPA3'
      }
    });
  }

  return fichas;
}

function gerarMemorial(hierarchy, bom, options) {
  const now = new Date().toLocaleDateString('pt-BR');
  const empresa = store.getState().company || {};
  const nomeEmpresa = empresa.name || empresa.nome || 'Empresa';
  const cnpj = empresa.cnpj || '';

  const nivelCampo = hierarchy.find(n => n.nivel === 'Campo');
  const nivelCelula = hierarchy.find(n => n.nivel === 'Célula / Controle');
  const nivelGestao = hierarchy.find(n => n.nivel === 'Gestão / IIoT');

  const totalIO = nivelCelula?.controladores.reduce((acc, c) => acc + (c.totalIO || 0), 0) || 0;
  const totalControladores = nivelCelula?.controladores.length || 0;
  const totalFieldDevices = nivelCampo?.barramentos.reduce((acc, b) => acc + (b.nos || 0), 0) || 0;
  const protocoloIndustrial = options.industrialProtocol || 'PROFINET';
  const protocoloCampo = options.fieldbusProtocol || 'Profibus DP';
  const topologia = options.topologyType || 'ring';

  const totalSwitches = (bom.switches || []).reduce((acc, s) => acc + (s.quantidade || 0), 0);
  const totalCabosEthernet = (bom.cabos || []).filter(c => c.tipo === 'ethernet').reduce((acc, c) => acc + (c.quantidade || 0), 0);
  const totalCabosFieldbus = (bom.cabos || []).filter(c => c.tipo === 'fieldbus').reduce((acc, c) => acc + (c.quantidade || 0), 0);

  const topoDesc = { ring: 'anel com redundância MRP', star: 'estrela', line: 'linha (daisy-chain)',
    tree: 'árvore (hierárquica)', mesh: 'malha parcial com redundância' };

  let texto = '';

  texto += 'MEMORIAL DESCRITIVO TÉCNICO\n';
  texto += `ARQUITETURA DE REDE INDUSTRIAL\n`;
  texto += `${nomeEmpresa}${cnpj ? ` - CNPJ: ${cnpj}` : ''}\n`;
  texto += `Data: ${now}\n\n`;
  texto += `${'='.repeat(70)}\n\n`;

  texto += '1. OBJETIVO\n\n';
  texto += `O presente memorial descritivo tem por objetivo definir e especificar a arquitetura de `;
  texto += `rede industrial proposta para o sistema de automação composto por ${totalControladores} `;
  texto += `controlador(es) lógico(s) programável(eis) (CLP) e/ou módulos remotos de E/S (REM), totalizando `;
  texto += `${totalIO} pontos de I/O distribuídos em ${totalFieldDevices} dispositivo(s) de campo.\n\n`;

  texto += '2. HIERARQUIA DA REDE\n\n';
  texto += 'A arquitetura proposta segue o modelo hierárquico de três níveis (ISA-95):\n\n';

  texto += '2.1. Nível de Campo\n\n';
  texto += `O nível de campo é composto por sensores, atuadores e módulos remotos de E/S descentralizadas, `;
  texto += `interligados via barramento ${protocoloCampo}. `;
  texto += `Para distâncias curtas e alta imunidade a ruídos, utiliza-se meio físico RS-485 com cabo `;
  texto += `tipo A (Profibus) ou par trançado blindado, conforme norma IEC 61158. `;
  texto += `Foram previstos ${totalFieldDevices} dispositivos de campo distribuídos em `;
  texto += `${nivelCampo?.barramentos.length || 0} barramento(s).\n\n`;

  for (const fb of (nivelCampo?.barramentos || [])) {
    texto += `  - Barramento mestre "${fb.mestre}": ${fb.nos} dispositivos (máx. ${fb.maximoPermitido})`;
    if (fb.precisaRepetidor) texto += ' *** REQUER REPETIDOR ***';
    if (fb.precisaConversorFibra && fb.conversorFibra) {
      texto += ` [Fibra: ${fb.conversorFibra.descricao} / ${fb.conversorFibra.conector}]`;
    }
    texto += '\n';
  }

  texto += '\n2.2. Nível de Célula / Controle\n\n';
  texto += `Os CLPs e IHMs são interligados via rede ${protocoloIndustrial} em topologia `;
  texto += `${topoDesc[topologia] || topologia}. `;
  texto += `O meio físico empregado é ${options.cableCategory ? CABO_CATEGORIAS[options.cableCategory]?.descricao || 'cabo blindado STP CAT6' : 'cabo blindado STP CAT6'} `;
  texto += `com conectores RJ45 blindados, atendendo aos requisitos de compatibilidade eletromagnética (EMC). `;
  texto += `A taxa de transmissão é de ${CONST_REDES[_normalizeProtocolName(protocoloIndustrial)]?.speed || '100 Mbps'}. `;
  texto += `Foram dimensionados ${totalSwitches} switch(es) industrial(is) para interconexão.\n\n`;

  if (nivelCelula?.switches?.some(s => s.nivel === 'core')) {
    texto += '  Estrutura hierárquica (topologia árvore):\n';
    texto += `    - ${nivelCelula.switches.filter(s => s.nivel === 'core').length} switch(es) core (agregação)\n`;
    texto += `    - ${nivelCelula.switches.filter(s => s.nivel === 'access').length} switch(es) access (acesso)\n\n`;
  }

  texto += '2.3. Nível de Gestão / IIoT\n\n';
  if (protocoloIndustrial === 'PROFINET') {
    const cc = options.conformanceClass;
    const ccInfo = cc ? CONFORMANCE_CLASSES[cc] : null;
    if (ccInfo) {
      texto += `\n2.2.1. Classe de Conformidade PROFINET: ${cc}\n\n`;
      texto += `A arquitetura adota a classe ${cc} (${ccInfo.descricao}). `;
      texto += `${ccInfo.aplicacao}. `;
      texto += `Velocidade: ${ccInfo.velocidade}. `;
      if (ccInfo.suportaIRT) texto += 'Suporte a tempo real isócrono (IRT) com jitter inferior a 1 μs para aplicações de motion control. ';
      if (ccInfo.suportaTSN) texto += 'Suporte a TSN (Time Sensitive Networking) para convergência com rede corporativa Gigabit. ';
      if (ccInfo.requerASIC_IRT) texto += 'Os switches devem possuir ASIC dedicado (ERTEC) para processamento IRT em hardware. ';
      if (ccInfo.requerSwitchTSN) texto += 'Os switches devem ser compatíveis com IEEE 802.1Qbv (TSN) para reserva de banda e isolamento temporal. ';
      if (ccInfo.snmp) texto += 'Diagnósticos de rede via SNMP e informações de topologia disponíveis. ';
      texto += '\n\n';
    }

    const rt = options.profinetRealTime;
    const rtInfo = rt ? TEMPO_REAL_PROFINET[rt] : null;
    if (rtInfo) {
      texto += `Tempo Real: ${rtInfo.descricao}. Jitter: ${rtInfo.jitter}. `;
      texto += `Ciclo mínimo: ${rtInfo.cicloMin}. `;
      if (rtInfo.requerASIC) texto += 'Requer switches com ASIC IRT dedicado. ';
      if (rtInfo.suportaDFP) texto += 'Suporta DFP (Dynamic Frame Packing) para empacotamento dinâmico de frames em ciclos abaixo de 250 μs. ';
      texto += '\n\n';
    }

    const red = options.profinetRedundancy;
    const redInfo = red ? REDUNDANCIA_PROFINET[red] : null;
    if (redInfo) {
      texto += `Redundância: ${redInfo.descricao}. Recuperação: ${redInfo.recuperacao}. `;
      if (redInfo.zeroLoss) texto += 'A duplicação de frames em ambas as direções do anel garante zero milissegundos de perda de comunicação em caso de falha de cabo, essencial para aplicações de segurança e motion control crítico. ';
      texto += '\n\n';
    }

    if (options.hasPROFIsafe) {
      texto += `Perfil de Segurança: A arquitetura inclui o perfil PROFIsafe para comunicação de segurança `;
      texto += `funcional (SIL 3 / PL e) sobre o mesmo cabo PROFINET. Recomenda-se a utilização `;
      texto += `de F-CPUs (S7-1500F) e F-Devices (ET 200SP F, SIMOCODE pro V failsafe, `;
      texto += `SIRIUS 3RW55 F) com endereçamento fail-safe e watchdog de segurança.\n\n`;
    }
  }

  if (protocoloIndustrial === 'PROFINET' && options.conformanceClass) {
    texto += '2.5. Gerenciamento e Descrição de Dispositivos\n\n';
    texto += 'Cada dispositivo PROFINET é descrito por um arquivo GSDML (General Station Description ';
    texto += 'Markup Language) em formato XML, fornecido pelo fabricante. Este arquivo contém todas as ';
    texto += 'propriedades do dispositivo: slots, subslots, módulos suportados e parâmetros configuráveis.\n\n';
    texto += 'O endereçamento segue o padrão DCP (Discovery and basic Configuration Protocol):\n';
    texto += '  - Atribuição de um Nome de Dispositivo simbólico (Station Name) único\n';
    texto += '  - O controlador utiliza DCP para mapear nome simbólico → endereço MAC\n';
    texto += '  - O endereço IP é atribuído automaticamente pelo IO-Controller\n';
    texto += '  - Dispensa configuração manual de IP ou DHCP, facilitando substituição de dispositivos\n\n';

    if (options.profinetCableType || options.profinetConnector) {
      texto += '2.6. Cabeamento e Conectores PROFINET\n\n';
      const caboInfo = options.profinetCableType ? CABO_PROFINET_TIPOS[options.profinetCableType] : null;
      if (caboInfo) {
        texto += `Cabo: ${caboInfo.descricao}. Aplicação: ${caboInfo.uso}. `;
        if (caboInfo.robotica) texto += 'Cabo com blindagem otimizada para torção extrema em células robotizadas. ';
        texto += '\n';
      }
      const conInfo = options.profinetConnector ? CONECTORES_PROFINET[options.profinetConnector] : null;
      if (conInfo) {
        texto += `Conector: ${conInfo.descricao}. Ambiente: ${conInfo.ambiente}. `;
        texto += `Velocidade máxima: ${conInfo.velMax}. Grau de proteção: ${conInfo.ip}.\n`;
      }
      texto += '\n';
    }

    texto += '2.7. Dados de Mercado PROFINET (Referência 2025-2026)\n\n';
    texto += 'O ecossistema PROFINET encerrou 2025 com mais de 89 milhões de dispositivos instalados ';
    texto += 'globalmente, consolidando-se como o protocolo de Industrial Ethernet líder com 30% dos ';
    texto += 'novos nós instalados (HMS Networks, 2026). O mercado global de hardware, software e ';
    texto += 'serviços PROFINET foi avaliado em US$ 6,8 bilhões em 2025, com projeção de US$ 14,2 ';
    texto += 'bilhões até 2034 (CAGR 8,5%).\n\n';
  }

  texto += '2.3. Nível de Gestão / IIoT\n\n';
  if (nivelGestao?.habilitado) {
    texto += `A integração com sistemas supervisórios e de gestão é realizada através `;
    texto += `dos protocolos ${nivelGestao.protocolos.join(' e ')}. `;
    texto += 'Esta camada permite a coleta de dados históricos, monitoramento remoto e ';
    texto += 'integração com sistemas MES/ERP.\n\n';

    for (const dev of (nivelGestao.dispositivos || [])) {
      texto += `  - ${dev.label || dev.tipo}: ${dev.tag} (${dev.protocolo || dev.descricao || ''})\n`;
    }
    texto += '\n';
  } else {
    texto += 'Não foi especificada integração com SCADA ou sistemas IIoT no escopo desta proposta. ';
    texto += 'Caso necessário, a arquitetura suporta expansão futura via protocolos OPC UA e/ou MQTT.\n\n';
  }

  const conformidade = validarConformidade(hierarchy, options);
  texto += '2.4. Conformidade Normativa\n\n';
  for (const c of conformidade) {
    const badge = c.status === 'ok' ? '[OK]' : c.status === 'warn' ? '[ALERTA]' : '[INFO]';
    texto += `  ${badge} ${c.norma}: ${c.mensagem}\n`;
  }
  texto += '\n';

  texto += '3. LISTA DE MATERIAIS DE REDE\n\n';
  texto += 'Com base na arquitetura definida, foram dimensionados os seguintes materiais de rede:\n\n';

  if (bom.switches && bom.switches.length > 0) {
    bom.switches.forEach(s => {
      texto += `  - ${s.descricao}: ${s.quantidade} unidade(s)`;
      if (s.margemExpansao !== undefined) texto += ` (margem: ${s.margemExpansao} portas)`;
      texto += '\n';
    });
  }

  if (bom.cabos && bom.cabos.length > 0) {
    texto += '\n  Cabos:\n';
    bom.cabos.forEach(c => {
      texto += `  - ${c.descricao}: ${c.quantidade} ${c.unidade}\n`;
    });
  }

  if (bom.fichasTecnicas && bom.fichasTecnicas.length > 0) {
    texto += '\n  Equipamentos:\n';
    for (const f of bom.fichasTecnicas) {
      texto += `  - ${f.equipamento} (${f.fabricanteSugerido})\n`;
      for (const [k, v] of Object.entries(f.especificacoes)) {
        texto += `      ${k}: ${v}\n`;
      }
    }
  }

  texto += '\n4. PLANO DE ENDEREÇAMENTO IP\n\n';
  if (bom.enderecamentoIP) {
    texto += '  VLANs:\n';
    for (const vlan of (bom.enderecamentoIP.vlans || [])) {
      texto += `  - ${vlan.nome}: VLAN ${vlan.vlanId}, Sub-rede ${vlan.subnet}, Gateway ${vlan.gateway}\n`;
    }
    texto += '\n  Dispositivos:\n';
    for (const d of (bom.enderecamentoIP.dispositivos || [])) {
      texto += `  - ${d.tag} (${d.tipo}): IP ${d.ip}, VLAN ${d.vlan}`;
      if (d.stationName) texto += `, Station Name: ${d.stationName}`;
      texto += '\n';
    }
  } else {
    texto += '  Endereçamento IP não configurado. Utilizar esquema definido pelo cliente.\n';
  }
  texto += '\n';

  texto += '5. VALIDAÇÃO DE RESTRIÇÕES\n\n';
  const warnings = [];
  for (const fb of (nivelCampo?.barramentos || [])) {
    if (fb.nos > fb.maximoPermitido) {
      warnings.push(`Barramento "${fb.mestre}" possui ${fb.nos} dispositivos, excedendo o limite de ${fb.maximoPermitido} nós. Recomenda-se repetidor ou segmentação.`);
    }
  }
  if (warnings.length > 0) {
    texto += '  Foram identificadas as seguintes restrições técnicas:\n\n';
    warnings.forEach((w, i) => { texto += `  ${i+1}. ${w}\n`; });
  } else {
    texto += '  Todos os barramentos estão dentro dos limites operacionais dos respectivos protocolos.\n';
  }
  texto += '\n';

  texto += '6. CONSIDERAÇÕES FINAIS\n\n';
  texto += 'A arquitetura de rede aqui descrita foi dimensionada considerando as melhores práticas ';
  texto += 'de engenharia de automação industrial, incluindo: redundância de comunicação ';
  if (topologia === 'ring') texto += '(MRP), ';
  else if (topologia === 'mesh') texto += '(malha parcial com Link Aggregation), ';
  texto += 'imunidade a ruídos (cabeamento blindado, aterramento adequado), ';
  texto += `margem de expansão futura (${Math.ceil(totalIO * 0.2)} pontos de I/O de reserva recomendados) `;
  texto += 'e modularidade dos componentes de campo.\n\n';
  texto += 'Recomenda-se que o comissionamento da rede inclua ensaios de ponto a ponto, ';
  texto += 'teste de integridade do cabeamento, verificação de aterramento e blindagem, ';
  texto += 'além de validação dos tempos de ciclo da comunicação conforme requisitos da aplicação.\n\n';
  texto += `${'-'.repeat(70)}\n`;
  texto += 'Documento gerado automaticamente pelo GeraPro - Módulo Arquitetura de Rede Industrial.\n';

  return { texto, html: texto.replace(/\n/g, '<br>') };
}

function calculateNetworkBOM(controllers, hierarchy, options) {
  const nivelCampo = hierarchy.find(n => n.nivel === 'Campo');
  const fieldbusBarramentos = nivelCampo?.barramentos || [];

  const switches = [];
  const nivelCelula = hierarchy.find(n => n.nivel === 'Célula / Controle');
  if (nivelCelula?.switches) {
    for (const sw of nivelCelula.switches) {
      const existing = switches.find(s => s.descricao === sw.descricao);
      if (existing) {
        existing.quantidade += sw.quantidade;
      } else {
        switches.push({ ...sw });
      }
    }
  }

  const cabos = calcularCabos(controllers, fieldbusBarramentos, options.estimatedCableLength || 500, options);

  let custoEstimadoTotal = 0;

  for (const sw of switches) {
    const precoUnit = sw.descricao.includes('8 portas') ? 1200 : sw.descricao.includes('16 portas') ? 2200 : 3800;
    const precoBase = sw.descricao.includes('Não-Gerenciável') ? 800 : precoUnit;
    sw.custoUnitarioEstimado = precoBase;
    sw.custoTotalEstimado = precoBase * sw.quantidade;
    custoEstimadoTotal += sw.custoTotalEstimado;
  }

  const precosCabos = {
    'ethernet': 8.5, 'fieldbus': 12.0, 'conector': 18.0, 'patch-cord': 35.0,
    'repetidor': 1850, 'conversor': 1200, 'terminacao': 35.0,
    'fibra-optica': 15.0, 'fibra-uplink': 18.0,
    'profinet-cabo': 0, 'profinet-conector': 0
  };

  for (const cabo of cabos) {
    let precoUnit;
    if (cabo.tipo === 'profinet-cabo' && cabo.custoPorMetro) {
      precoUnit = cabo.custoPorMetro;
    } else if (cabo.tipo === 'profinet-conector' && cabo.custoUnitario) {
      precoUnit = cabo.custoUnitario;
    } else {
      precoUnit = precosCabos[cabo.tipo] || 10;
    }
    cabo.custoUnitarioEstimado = precoUnit;
    cabo.custoTotalEstimado = Math.round(precoUnit * cabo.quantidade);
    custoEstimadoTotal += cabo.custoTotalEstimado;
  }

  const fichasTecnicas = gerarFichasTecnicas({ switches, cabos }, options);
  const enderecamentoIP = gerarEnderecamentoIP(controllers, options);
  const conformidade = validarConformidade(hierarchy, options);

  return {
    switches, cabos,
    fichasTecnicas, enderecamentoIP, conformidade,
    custoEstimadoTotal: Math.round(custoEstimadoTotal)
  };
}

function generateNetworkArchitecture(controllers, options) {
  const opts = Object.assign({
    industrialProtocol: 'PROFINET',
    fieldbusProtocol: 'Profibus DP',
    topologyType: 'ring',
    hasSCADA: false, hasIIoT: false,
    hasFirewall: false, hasRouter: false, hasAccessPoint: false,
    estimatedCableLength: 500,
    useFiberOptic: false, fiberType: 'multimodo_OM4',
    cableCategory: 'CAT6',
    baseIP: '10.0.0.0', prefixIP: 24, qtdVlans: 3,
    conformanceClass: '',
    profinetRealTime: '',
    profinetRedundancy: '',
    profinetCableType: '',
    profinetConnector: '',
    hasSiemensDevices: false,
    hasPROFIsafe: false
  }, options || {});

  validateInput(controllers, opts);

  const topologia = buildTopology(controllers, opts);
  const bom = calculateNetworkBOM(controllers, topologia, opts);
  const memorialObj = gerarMemorial(topologia, bom, opts);

  const totalIO = topologia
    .find(n => n.nivel === 'Célula / Controle')
    ?.controladores?.reduce((acc, c) => acc + (c.totalIO || 0), 0) || 0;

  return {
    cabecalho: {
      dataGeracao: new Date().toISOString(),
      totalControladores: controllers.length,
      totalIO,
      protocoloIndustrial: opts.industrialProtocol,
      protocoloCampo: opts.fieldbusProtocol,
      topologia: opts.topologyType
    },
    topologia,
    bom,
    memorial: memorialObj.texto,
    memorialHTML: memorialObj.html
  };
}

export { generateNetworkArchitecture, EntradaInvalidaError };