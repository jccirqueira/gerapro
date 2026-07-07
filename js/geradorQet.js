const { XMLBuilder } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');

const QET_VERSION = '0.100.0';
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

function buildBoxElementDef() {
  const uuid_el = uuid();
  const uuid_term_top = uuid();
  const uuid_term_bot = uuid();
  const uuid_text = uuid();
  return {
    element: {
      '@_name': 'box_60x80.elmt',
      definition: {
        '@_type': 'element',
        '@_link_type': 'master',
        '@_hotspot_x': '30',
        '@_hotspot_y': '0',
        '@_width': '60',
        '@_height': '80',
        '@_version': QET_VERSION,
        uuid: { '@_uuid': `{${uuid_el}}` },
        names: {
          name: { '@_lang': 'en', '#text': 'Box 60x80' }
        },
        kindInformations: {
          kindInformation: { '@_name': 'type', '#text': 'other' }
        },
        informations: 'Author: GeraPro',
        description: {
          line: [
            { '@_x1': '-30', '@_y1': '0', '@_x2': '30', '@_y2': '0', '@_end1': 'none', '@_end2': 'none', '@_style': 'line-style:normal;line-weight:normal;filling:none;color:black' },
            { '@_x1': '30', '@_y1': '0', '@_x2': '30', '@_y2': '80', '@_end1': 'none', '@_end2': 'none', '@_style': 'line-style:normal;line-weight:normal;filling:none;color:black' },
            { '@_x1': '30', '@_y1': '80', '@_x2': '-30', '@_y2': '80', '@_end1': 'none', '@_end2': 'none', '@_style': 'line-style:normal;line-weight:normal;filling:none;color:black' },
            { '@_x1': '-30', '@_y1': '80', '@_x2': '-30', '@_y2': '0', '@_end1': 'none', '@_end2': 'none', '@_style': 'line-style:normal;line-weight:normal;filling:none;color:black' }
          ],
          terminal: [
            { '@_type': 'Generic', '@_x': '0', '@_y': '0', '@_name': 'TOP', '@_uuid': `{${uuid_term_top}}`, '@_orientation': 'n' },
            { '@_type': 'Generic', '@_x': '0', '@_y': '80', '@_name': 'BOTTOM', '@_uuid': `{${uuid_term_bot}}`, '@_orientation': 's' }
          ],
          dynamic_text: {
            '@_Halignment': 'AlignCenter',
            '@_frame': 'false',
            '@_x': '0',
            '@_y': '40',
            '@_rotation': '0',
            '@_font': 'Liberation Sans,10,-1,5,50,0,0,0,0,0,Regular',
            '@_text_width': '-1',
            '@_uuid': `{${uuid_text}}`,
            '@_keep_visual_rotation': 'false',
            '@_Valignment': 'AlignCenter',
            '@_text_from': 'ElementInfo',
            text: '',
            info_name: 'label'
          }
        }
      }
    }
  };
}

function buildCollection() {
  const el = buildBoxElementDef();
  return {
    collection: {
      category: {
        '@_name': 'import',
        names: { name: { '@_lang': 'en', '#text': 'Imported elements' } },
        category: {
          '@_name': 'gerapro',
          names: { name: { '@_lang': 'en', '#text': 'GeraPro' } },
          element: el.element
        }
      }
    }
  };
}

function buildDiagram(componentes, condutores, titleblock, totalRows) {
  const elementList = [];
  const condutorList = [];

  for (const comp of componentes) {
    const elemUuid = uuid();
    const terminaisDef = comp.terminais || [];
    const termEls = [];
    for (const td of terminaisDef) {
      termEls.push({
        '@_x': td.x || 0,
        '@_y': td.y || 0,
        '@_nameHidden': td.nameHidden != null ? td.nameHidden : 0,
        '@_number': td.number != null ? String(td.number) : '',
        '@_id': termEls.length,
        '@_name': td.name || '',
        '@_orientation': td.orientation != null ? td.orientation : 2
      });
    }

    const el = {
      '@_x': (comp.posicaoX || 0) * COORDS_MULT,
      '@_y': (comp.posicaoY || 0) * COORDS_MULT,
      '@_type': comp.simboloQet || 'embed://import/gerapro/box_60x80.elmt',
      '@_uuid': `{${elemUuid}}`,
      '@_orientation': comp.orientacao != null ? comp.orientacao : 0,
      '@_freezeLabel': 'false',
      '@_prefix': ''
    };

    if (termEls.length > 0) {
      el.terminals = { terminal: termEls };
    }

    el.inputs = '';

    const dynTextUuid = uuid();
    const dynText = {
      dynamic_elmt_text: {
        '@_frame': 'false',
        '@_Halignment': 'AlignLeft',
        '@_x': '-28',
        '@_y': '-5',
        '@_rotation': '0',
        '@_font': 'Liberation Sans,7,-1,5,50,0,0,0,0,0,Regular',
        '@_text_width': '-1',
        '@_uuid': `{${dynTextUuid}}`,
        '@_keep_visual_rotation': 'false',
        '@_text_from': 'ElementInfo',
        '@_Valignment': 'AlignTop',
        text: comp.tag || '',
        info_name: 'label'
      }
    };
    el.dynamic_texts = dynText;

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

  const rowHeight = 80;
  const finalRows = Math.max(totalRows || 6, Math.ceil((componentes.length || 1) / 2) + 1);
  const diagramObj = {
    '@_title': titleblock.titulo || 'Diagrama',
    '@_displayrows': 'true',
    '@_version': QET_VERSION,
    '@_cols': '15',
    '@_folio': '%id/%total',
    '@_displaycols': 'true',
    '@_height': String(finalRows * rowHeight),
    '@_colsize': '50',
    '@_order': '1',
    '@_rows': String(finalRows),
    '@_author': titleblock.autor || '',
    '@_filename': '',
    '@_date': titleblock.data || new Date().toISOString().split('T')[0],
    '@_rowsize': String(rowHeight),
    '@_freezeNewElement': 'false',
    '@_freezeNewConductor': 'false',
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
          simboloQet: b.simboloQet || 'embed://import/gerapro/box_60x80.elmt',
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
  const qetRows = Math.max(6, Math.ceil((todosComponentes.length || 1) / 2) + 1);
  const diagramData = buildDiagram(todosComponentes, condutores, titleblock, qetRows);
  const collectionData = buildCollection();

  // Build xref entries matching QET 0.100 format
  const xrefs = {
    xref: [
      {
        '@_type': 'protection',
        '@_displayhas': 'cross',
        '@_offset': '0',
        '@_slave_label': '(%f-%l%c)',
        '@_showpowerctc': 'true',
        '@_delayprefix': '',
        '@_switchprefix': '',
        '@_powerprefix': '',
        '@_snapto': 'label',
        '@_xrefpos': '',
        '@_master_label': '%f-%l%c'
      },
      {
        '@_type': 'coil',
        '@_displayhas': 'cross',
        '@_offset': '40',
        '@_slave_label': '(%f-%l%c)',
        '@_showpowerctc': 'true',
        '@_delayprefix': '',
        '@_switchprefix': '',
        '@_powerprefix': '',
        '@_snapto': 'label',
        '@_xrefpos': 'AlignTop',
        '@_master_label': '%f-%l%c'
      },
      {
        '@_type': 'commutator',
        '@_displayhas': 'cross',
        '@_offset': '0',
        '@_slave_label': '(%f-%l%c)',
        '@_showpowerctc': 'true',
        '@_delayprefix': '',
        '@_switchprefix': '',
        '@_powerprefix': '',
        '@_snapto': 'label',
        '@_xrefpos': '',
        '@_master_label': '%f-%l%c'
      }
    ]
  };

  const xmlObj = {
    project: {
      '@_version': QET_VERSION,
      '@_title': titleblock.titulo || '',
      properties: {
        property: [
          { '@_name': 'saveddate', '@_show': '1', '#text': new Date().toLocaleDateString() },
          { '@_name': 'saveddate-eu', '@_show': '1', '#text': new Date().toLocaleDateString() },
          { '@_name': 'saveddate-us', '@_show': '1', '#text': new Date().toISOString().split('T')[0] },
          { '@_name': 'savedfilename', '@_show': '1', '#text': titleblock.titulo || '' },
          { '@_name': 'savedfilepath', '@_show': '1', '#text': caminhoSaida },
          { '@_name': 'savedtime', '@_show': '1', '#text': new Date().toLocaleTimeString() }
        ]
      },
      newdiagrams: {
        border: {
          '@_cols': '15',
          '@_colsize': '50',
          '@_rows': String(qetRows),
          '@_displaycols': 'true',
          '@_displayrows': 'true',
          '@_rowsize': '80'
        },
        inset: {
          '@_date': 'null',
          '@_title': '',
          '@_auto_page_num': '',
          '@_displayAt': 'bottom',
          '@_filename': '',
          '@_author': '',
          '@_plant': '',
          '@_locmach': '',
          '@_indexrev': '',
          '@_folio': '%id/%total',
          '@_version': ''
        },
        conductors: {
          '@_num': '_',
          '@_conductor_color': '',
          '@_type': 'multi',
          '@_displaytext': '1',
          '@_onetextperfolio': '0',
          '@_vertirotatetext': '270',
          '@_color2': '#000000',
          '@_horizrotatetext': '0',
          '@_bicolor': 'false',
          '@_condsize': '1',
          '@_numsize': '7',
          '@_tension_protocol': '',
          '@_bus': '',
          '@_dash-size': '2',
          '@_conductor_section': '',
          '@_vertical-alignment': 'AlignRight',
          '@_function': '',
          '@_horizontal-alignment': 'AlignBottom',
          '@_text_color': '#000000',
          '@_cable': '',
          '@_formula': ''
        },
        report: { '@_label': '%f-%l%c' },
        xrefs: xrefs,
        conductors_autonums: {
          '@_freeze_new_conductors': 'false',
          '@_current_autonum': ''
        },
        folio_autonums: '',
        element_autonums: {
          '@_freeze_new_elements': 'false',
          '@_current_autonum': ''
        }
      },
      ...diagramData,
      ...collectionData
    }
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    indentBy: '    ',
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
    posicaoX: 50,
    posicaoY: 0,
    simboloQet: 'embed://import/gerapro/box_60x80.elmt',
    orientacao: 0,
    terminais: [
      { x: 0, y: -10, name: '1', orientation: 0, number: '1' },
      { x: 0, y: 10, name: '2', orientation: 2, number: '2' }
    ]
  };

  const mockContator = {
    id: 'KM1',
    tag: 'KM1',
    posicaoX: 50,
    posicaoY: 8,
    simboloQet: 'embed://import/gerapro/box_60x80.elmt',
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
    { anilha: 'L1', origemX: 50, origemY: 1, destinoX: 50, destinoY: 7, bitola: '2.5mm²', cor: 'Marrom', cabo_grupo: 'W1' }
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
