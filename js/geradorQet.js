const { XMLBuilder } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

const QET_VERSION = '0.4';
const COORDS_MULT = 10;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function validateInput(dados) {
  if (!dados || typeof dados !== 'object') {
    throw new Error('dadosOrcamento deve ser um objeto');
  }
  if (!dados.componentes && !dados.condutores && !dados.bornes && !dados.titleblock) {
    throw new Error('dadosOrcamento deve conter ao menos um dos campos: componentes, condutores, bornes, titleblock');
  }
  if (dados.componentes && !Array.isArray(dados.componentes)) {
    throw new Error('componentes deve ser um array');
  }
  if (dados.condutores && !Array.isArray(dados.condutores)) {
    throw new Error('condutores deve ser um array');
  }
  if (dados.bornes && !Array.isArray(dados.bornes)) {
    throw new Error('bornes deve ser um array');
  }
}

function buildDiagram(componentes, condutores, titleblock) {
  const elementList = [];
  const condutorList = [];
  let terminalIdCounter = 0;

  for (const comp of componentes) {
    const elemUuid = uuid();
    const terminaisDef = comp.terminais || [];
    const termEls = [];
    for (const td of terminaisDef) {
      const termId = terminalIdCounter++;
      termEls.push({
        '@_x': td.x || 0,
        '@_y': td.y || 0,
        '@_nameHidden': td.nameHidden != null ? td.nameHidden : 0,
        '@_number': td.number != null ? String(td.number) : '',
        '@_id': termId,
        '@_name': td.name || '',
        '@_orientation': td.orientation != null ? td.orientation : 2
      });
    }

    const inputEls = [];
    if (comp.tag) {
      inputEls.push({ '@_x': -20, '@_y': 0, '@_text': comp.tag });
    }

    const el = {
      '@_x': (comp.posicaoX || 0) * COORDS_MULT,
      '@_y': (comp.posicaoY || 0) * COORDS_MULT,
      '@_type': comp.simboloQet || '',
      '@_uuid': elemUuid,
      '@_orientation': comp.orientacao != null ? comp.orientacao : 0
    };

    if (termEls.length > 0) {
      el.terminals = { terminal: termEls };
    }
    if (inputEls.length > 0) {
      el.inputs = { input: inputEls };
    }

    elementList.push(el);
  }

  for (const cond of condutores) {
    const c = {
      '@_num': cond.anilha || '_',
      '@_vertirotatetext': '0',
      '@_displaytext': '1',
      '@_type': 'multi',
      '@_horizrotatetext': '0',
      '@_numsize': '9',
      '@_onetextperfolio': '0'
    };

    if (cond.terminal1 != null && cond.terminal2 != null) {
      c['@_terminal1'] = cond.terminal1;
      c['@_terminal2'] = cond.terminal2;
    } else if (cond.origemX != null && cond.origemY != null) {
      const dx = ((cond.destinoX || 0) - (cond.origemX || 0)) * COORDS_MULT;
      const dy = ((cond.destinoY || 0) - (cond.origemY || 0)) * COORDS_MULT;
      const segments = [];
      if (dx !== 0) {
        segments.push({ '@_length': String(Math.round(dx)), '@_orientation': 'horizontal' });
      }
      if (dy !== 0) {
        segments.push({ '@_length': String(Math.round(dy)), '@_orientation': 'vertical' });
      }
      if (segments.length > 0) {
        c.segment = segments;
      }
      c['@_x'] = '0';
      c['@_y'] = '0';
    }

    condutorList.push(c);
  }

  const diagramObj = {
    '@_title': titleblock.titulo || 'Diagrama',
    '@_displayrows': 'true',
    '@_version': QET_VERSION,
    '@_cols': '15',
    '@_folio': '%id/%total',
    '@_displaycols': 'true',
    '@_height': '500',
    '@_colsize': '50',
    '@_order': '1',
    '@_rows': '6',
    '@_author': titleblock.autor || '',
    '@_filename': '',
    '@_date': titleblock.data || new Date().toISOString().split('T')[0],
    '@_rowsize': '80',
    defaultconductor: {
      '@_num': '_',
      '@_vertirotatetext': '0',
      '@_displaytext': '1',
      '@_type': 'multi',
      '@_horizrotatetext': '0',
      '@_numsize': '9',
      '@_onetextperfolio': '0'
    }
  };

  if (elementList.length > 0) {
    diagramObj.elements = { element: elementList };
  }
  if (condutorList.length > 0) {
    diagramObj.conductors = { conductor: condutorList };
  }

  return { diagram: diagramObj };
}

function gerarProjetoQet(dadosOrcamento, caminhoSaida) {
  validateInput(dadosOrcamento);

  const {
    componentes = [],
    condutores = [],
    bornes = [],
    titleblock = {}
  } = dadosOrcamento;

  const bornesComoComponentes = [];
  if (bornes.length > 0) {
    const bornesPorRegua = {};
    for (const b of bornes) {
      const regua = b.regua_parent || 'X1';
      if (!bornesPorRegua[regua]) bornesPorRegua[regua] = [];
      bornesPorRegua[regua].push(b);
    }

    for (const [regua, lista] of Object.entries(bornesPorRegua)) {
      for (let i = 0; i < lista.length; i++) {
        const b = lista[i];
        bornesComoComponentes.push({
          id: `${regua}-${b.numero}`,
          tag: `${regua}:${b.numero}`,
          posicaoX: b.posicaoX || (i * 20),
          posicaoY: b.posicaoY || 0,
          simboloQet: b.simboloQet || 'embed://bornes/bornes_2_elmt',
          orientacao: 0,
          terminais: [
            { x: 0, y: -10, name: `${b.numero}`, orientation: 0, number: `${b.numero}` },
            { x: 0, y: 10, name: `${b.numero}`, orientation: 2, number: `${b.numero}` }
          ]
        });
      }
    }
  }

  const todosComponentes = [...componentes, ...bornesComoComponentes];
  const diagramData = buildDiagram(todosComponentes, condutores, titleblock);

  const xmlObj = {
    project: {
      '@_version': QET_VERSION,
      '@_title': titleblock.titulo || '',
      '@_folioSheetQuantity': '0',
      properties: '',
      newdiagrams: {
        border: {
          '@_displayrows': 'true',
          '@_cols': '15',
          '@_displaycols': 'true',
          '@_colsize': '50',
          '@_rows': '6',
          '@_rowsize': '80'
        },
        inset: {
          '@_title': titleblock.titulo || '',
          '@_folio': '%id/%total',
          '@_author': titleblock.autor || '',
          '@_filename': '',
          '@_date': titleblock.data || new Date().toISOString().split('T')[0]
        },
        conductors: {
          '@_num': '_',
          '@_vertirotatetext': '0',
          '@_displaytext': '1',
          '@_type': 'multi',
          '@_horizrotatetext': '0',
          '@_numsize': '9',
          '@_onetextperfolio': '0'
        },
        report: { '@_label': '/%f.%l%c' },
        xrefs: {
          xref: [
            {
              '@_snapto': 'label',
              '@_switchprefix': '',
              '@_powerprefix': '',
              '@_displayhas': 'contacts',
              '@_type': 'protection',
              '@_showpowerctc': 'false',
              '@_delayprefix': ''
            },
            {
              '@_snapto': 'bottom',
              '@_switchprefix': '',
              '@_powerprefix': '',
              '@_displayhas': 'cross',
              '@_type': 'coil',
              '@_showpowerctc': 'false',
              '@_delayprefix': ''
            }
          ]
        },
        conductors_autonums: ''
      },
      ...diagramData
    }
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    processEntities: false
  });

  const xmlContent = builder.build(xmlObj);
  fs.writeFileSync(caminhoSaida, xmlContent, 'utf-8');
  return caminhoSaida;
}

if (require.main === module) {
  const mockDisjuntor = {
    id: 'DJ1',
    tag: 'DJ1',
    fabricante: 'ABB',
    modelo: 'S201-C16',
    posicaoX: 50,
    posicaoY: 50,
    simboloQet: 'embed://import/industria/disjoncteur.elmt',
    orientacao: 0,
    terminais: [
      { x: 0, y: -15, name: '1', orientation: 0, number: '1' },
      { x: 0, y: 15, name: '2', orientation: 2, number: '2' }
    ]
  };

  const mockContator = {
    id: 'KM1',
    tag: 'KM1',
    fabricante: 'ABB',
    modelo: 'A9-30-10',
    posicaoX: 50,
    posicaoY: 200,
    simboloQet: 'embed://import/industrie/contacteur.elmt',
    orientacao: 0,
    terminais: [
      { x: -20, y: -10, name: 'A1', orientation: 0, number: 'A1' },
      { x: -20, y: 10, name: 'A2', orientation: 2, number: 'A2' },
      { x: 0, y: -10, name: '1', orientation: 0, number: '1' },
      { x: 0, y: 10, name: '2', orientation: 2, number: '2' },
      { x: 20, y: -10, name: '3', orientation: 0, number: '3' },
      { x: 20, y: 10, name: '4', orientation: 2, number: '4' }
    ]
  };

  const mockCondutores = [
    { anilha: 'L1', origemX: 50, origemY: 65, destinoX: 50, destinoY: 190, bitola: '2.5mm²', cor: 'Marrom', cabo_grupo: 'W1' },
    { anilha: 'L2', origemX: 50, origemY: 65, destinoX: 50, destinoY: 190, bitola: '2.5mm²', cor: 'Preto', cabo_grupo: 'W1' },
    { anilha: 'L3', origemX: 50, origemY: 65, destinoX: 70, destinoY: 190, bitola: '2.5mm²', cor: 'Cinza', cabo_grupo: 'W1' }
  ];

  const mockBornes = [
    { numero: '1', regua_parent: 'X1', posicaoX: 0, posicaoY: 350 },
    { numero: '2', regua_parent: 'X1', posicaoX: 20, posicaoY: 350 },
    { numero: '3', regua_parent: 'X1', posicaoX: 40, posicaoY: 350 }
  ];

  const mockTitleblock = {
    titulo: 'Painel CCM - Caldeira',
    cliente: 'CMAA',
    numeroProposta: 'PT-26070202',
    data: new Date().toISOString().split('T')[0],
    autor: 'GeraPro'
  };

  const dadosTeste = {
    componentes: [mockDisjuntor, mockContator],
    condutores: mockCondutores,
    bornes: mockBornes,
    titleblock: mockTitleblock
  };

  const saida = path.join(__dirname, '..', 'teste_gerado.qet');
  try {
    gerarProjetoQet(dadosTeste, saida);
    console.log(`[QET] Arquivo gerado com sucesso: ${saida}`);
  } catch (err) {
    console.error(`[QET] Erro ao gerar arquivo: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { gerarProjetoQet };
