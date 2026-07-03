import { store } from './state.js';

/**
 * Seed Data Module - Enhanced for LM Simulation
 */

export const loadDemoData = () => {
    if (!confirm("Isso irá adicionar dados de exemplo avançados ao seu banco de dados atual para simular o uso da LM. Deseja continuar?")) return;

    const demoClients = [
        {
            id: crypto.randomUUID(),
            razaoSocial: 'Mineradora Vale do Aço S/A',
            nomeFantasia: 'Vale do Aço',
            cnpj: '22.333.444/0001-55',
            segmento: 'Mineração',
            cidade: 'Belo Horizonte',
            estado: 'MG',
            contatoNome: 'Eng. Fernando',
            email: 'fernando@valedoaco.com.br',
            telefone: '(31) 3333-4444',
            createdAt: new Date()
        }
    ];

    const demoMaterials = [
        // --- POWER COMPONENTS ---
        { id: 'mat-dj-32', codigoInterno: 'DJ-C32', codigoFabricante: '10076442', modelo: 'MDW-C32', fabricante: 'WEG', categoria: 'Disjuntor', descricao: 'Disjuntor Miniatura MDW Tripolar 32A Curva C', unidade: 'un', custo: 58.50, markup: 0, createdAt: new Date() },
        { id: 'mat-djm-10', codigoInterno: 'MPW-18', codigoFabricante: '12429285', modelo: 'MPW18-3-U010', fabricante: 'WEG', categoria: 'Disjuntor Motor', descricao: 'Disjuntor Motor MPW18 6.3-10A', unidade: 'un', custo: 155.00, markup: 0, createdAt: new Date() },
        { id: 'mat-ct-18', codigoInterno: 'CT-18A', codigoFabricante: '12242501', modelo: 'CWB18-11-30D23', fabricante: 'WEG', categoria: 'Contator', descricao: 'Contator CWB18 18A 1NA+1NF 220V 60Hz', unidade: 'un', custo: 115.00, markup: 0, createdAt: new Date() },
        { id: 'mat-ss-10', codigoInterno: 'SS-10', codigoFabricante: '10041234', modelo: 'SSW050010T2246', fabricante: 'WEG', categoria: 'Soft-Starter', descricao: 'Soft-Starter SSW05 10A 5CV 380V', unidade: 'un', custo: 1250.00, markup: 0, createdAt: new Date() },
        { id: 'mat-inv-5', codigoInterno: 'INV-05', codigoFabricante: '11223344', modelo: 'CFW500A0500T4', fabricante: 'WEG', categoria: 'Inversor', descricao: 'Inversor CFW500 5CV 380V Trifásico', unidade: 'un', custo: 2450.00, markup: 0, createdAt: new Date() },
        { id: 'mat-com-pnet', codigoInterno: 'COM-PNET', codigoFabricante: '14556677', modelo: 'CFW500-CPN', fabricante: 'WEG', categoria: 'Módulo Com.', descricao: 'Módulo de Comunicação Profinet para CFW500', unidade: 'un', custo: 450.00, markup: 0, createdAt: new Date() },
        { id: 'mat-btn-gr', codigoInterno: 'BTN-IMP', codigoFabricante: '12882294', modelo: 'CSW-BF1-30', fabricante: 'WEG', categoria: 'Comando', descricao: 'Botão Impulso Verde Faceado 1NA', unidade: 'un', custo: 18.50, markup: 0, createdAt: new Date() },
        { id: 'mat-btn-red', codigoInterno: 'BTN-RET', codigoFabricante: '12882295', modelo: 'CSW-BF2-30', fabricante: 'WEG', categoria: 'Comando', descricao: 'Botão Impulso Vermelho Faceado 1NF', unidade: 'un', custo: 18.50, markup: 0, createdAt: new Date() },
        { id: 'mat-lp-white', codigoInterno: 'LP-220', codigoFabricante: '11002233', modelo: 'CEW-SM2-D23', fabricante: 'WEG', categoria: 'Sinalização', descricao: 'Sinaleiro Monobloco LED Branco 220V', unidade: 'un', custo: 12.90, markup: 0, createdAt: new Date() }
    ];

    const demoTypicals = [
        {
            id: crypto.randomUUID(),
            nome: 'PD-1,5-380-16-N/A-WEG-N/A', // Partida Direta 1.5CV 380V
            tipoAcionamento: 'Partida Direta',
            potencia: '1,5',
            tensao: '380',
            icc: '16',
            comunicacao: 'N/A',
            protecao: 'WEG',
            drives: '',
            custoTotal: 0,
            items: [
                { materialId: 'mat-djm-10', descricao: 'Disjuntor Motor MPW18 6.3-10A', fabricante: 'WEG', codigoFabricante: '12429285', custo: 155.00, qtd: 1 },
                { materialId: 'mat-ct-18', descricao: 'Contator CWB18 18A 1NA+1NF 220V 60Hz', fabricante: 'WEG', codigoFabricante: '12242501', custo: 115.00, qtd: 1 }
            ]
        },
        {
            id: crypto.randomUUID(),
            nome: 'IF-5,0-380-65-Profinet-WEG-WEG', // Inversor Profinet
            tipoAcionamento: 'Inversor de Frequência',
            potencia: '5,0',
            tensao: '380',
            icc: '65',
            comunicacao: 'Profinet',
            protecao: 'WEG',
            drives: 'WEG',
            custoTotal: 0,
            items: [
                { materialId: 'mat-dj-32', descricao: 'Disjuntor Miniatura MDW Tripolar 32A', fabricante: 'WEG', codigoFabricante: '10076442', custo: 58.50, qtd: 1 },
                { materialId: 'mat-inv-5', descricao: 'Inversor CFW500 5CV 380V', fabricante: 'WEG', codigoFabricante: '11223344', custo: 2450.00, qtd: 1 },
                { materialId: 'mat-com-pnet', descricao: 'Módulo Comunicação Profinet', fabricante: 'WEG', codigoFabricante: '14556677', custo: 450.00, qtd: 1 }
            ]
        },
        {
            id: crypto.randomUUID(),
            nome: 'SS-10-380-65-Modbus-WEG-WEG', // Soft-Starter
            tipoAcionamento: 'Soft-Starter',
            potencia: '10',
            tensao: '380',
            icc: '65',
            comunicacao: 'Modbus RTU',
            protecao: 'WEG',
            drives: 'WEG',
            custoTotal: 0,
            items: [
                { materialId: 'mat-dj-32', descricao: 'Disjuntor Miniatura MDW Tripolar 32A', fabricante: 'WEG', codigoFabricante: '10076442', custo: 58.50, qtd: 1 },
                { materialId: 'mat-ss-10', descricao: 'Soft-Starter SSW05 10A 5CV', fabricante: 'WEG', codigoFabricante: '10041234', custo: 1250.00, qtd: 1 }
            ]
        },
        {
            id: crypto.randomUUID(),
            nome: 'CS-0,0-220-10-N/A-WEG-N/A', // Comando
            tipoAcionamento: 'Comando e Sinalização',
            potencia: '0,0',
            tensao: '220',
            icc: '10',
            comunicacao: 'N/A',
            protecao: 'WEG',
            drives: '',
            custoTotal: 0,
            items: [
                { materialId: 'mat-btn-gr', descricao: 'Botão Impulso Verde 1NA', fabricante: 'WEG', codigoFabricante: '12882294', custo: 18.50, qtd: 2 },
                { materialId: 'mat-btn-red', descricao: 'Botão Impulso Vermelho 1NF', fabricante: 'WEG', codigoFabricante: '12882295', custo: 18.50, qtd: 2 },
                { materialId: 'mat-lp-white', descricao: 'Sinaleiro LED Branco 220V', fabricante: 'WEG', codigoFabricante: '11002233', custo: 12.90, qtd: 4 }
            ]
        }
    ];

    // --- DEMO PROPOSALS (ORCAMENTOS) ---
    const demoOrcamentos = [
        {
            id: crypto.randomUUID(),
            createdAt: new Date(new Date().setDate(new Date().getDate() - 30)), // 1 month ago
            numero: 'PTC-2025-001',
            clienteName: 'Vale do Aço',
            ptcTitle: 'Retrofit Painel Britador',
            total: 85000,
            status: 'Aprovado',
            type: 'Painel de Baixa Tensão'
        },
        {
            id: crypto.randomUUID(),
            createdAt: new Date(new Date().setDate(new Date().getDate() - 15)),
            numero: 'PTC-2025-002',
            clienteName: 'Vale do Aço',
            ptcTitle: 'Automação Correia Transportadora',
            total: 120000,
            status: 'Em Elaboração',
            type: 'Automação'
        },
        {
            id: crypto.randomUUID(),
            createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
            numero: 'PTC-2025-003',
            clienteName: 'Cimento Nacional',
            ptcTitle: 'Manutenção Inversores',
            total: 15000,
            status: 'Enviado',
            type: 'Serviços em Campo'
        },
        {
            id: crypto.randomUUID(),
            createdAt: new Date(),
            numero: 'PTC-2025-004',
            clienteName: 'Agroindústria Sul',
            ptcTitle: 'Venda de Disjuntores',
            total: 5000,
            status: 'Perdido',
            type: 'Revenda de Material'
        },
        {
            id: crypto.randomUUID(),
            createdAt: new Date(),
            numero: 'PTC-2025-005',
            clienteName: 'Vale do Aço',
            ptcTitle: 'Novo CCM 04',
            total: 250000,
            status: 'Aprovado',
            type: 'Painel de Baixa Tensão'
        }
    ];

    // Calc costs
    demoTypicals.forEach(t => {
        t.custoTotal = t.items.reduce((acc, i) => acc + (i.custo * i.qtd), 0);
    });

    const demoComposicoes = [
        { id: 'comp-c001', codigo: 'C001', atividade: 'Montagem de estrutura metálica do painel', unidade: 'un', grupo: 'Estrutura', categoria_profissional: 'Montador', coeficiente_hh: 4.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Montagem' },
        { id: 'comp-c002', codigo: 'C002', atividade: 'Montagem de barramento de cobre', unidade: 'm', grupo: 'Elétrica', categoria_profissional: 'Barramentista', coeficiente_hh: 2.5, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.4, area_alocacao: 'Montagem' },
        { id: 'comp-c003', codigo: 'C003', atividade: 'Aterramento de painel', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 1.5, fator_simples: 0.7, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c004', codigo: 'C004', atividade: 'Lançamento de cabos de potência', unidade: 'm', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 0.3, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c005', codigo: 'C005', atividade: 'Crimpagem de terminais', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Montador', coeficiente_hh: 0.15, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.0, area_alocacao: 'Montagem' },
        { id: 'comp-c006', codigo: 'C006', atividade: 'Montagem de disjuntor/contator', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 1.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Montagem' },
        { id: 'comp-c007', codigo: 'C007', atividade: 'Teste elétrico funcional do painel', unidade: 'h', grupo: 'Testes', categoria_profissional: 'Técnico', coeficiente_hh: 1.0, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c008', codigo: 'C008', atividade: 'Ensaio de ponto a ponto (DI/DO)', unidade: 'ponto', grupo: 'Testes', categoria_profissional: 'Técnico', coeficiente_hh: 0.5, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.0, area_alocacao: 'Montagem' },
        { id: 'comp-c009', codigo: 'C009', atividade: 'Ensaio de ponto a ponto (AI/AO)', unidade: 'ponto', grupo: 'Testes', categoria_profissional: 'Técnico', coeficiente_hh: 0.6, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.0, area_alocacao: 'Montagem' },
        { id: 'comp-c010', codigo: 'C010', atividade: 'Ensaio de rigidez dielétrica', unidade: 'un', grupo: 'Testes', categoria_profissional: 'Técnico', coeficiente_hh: 1.0, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.1, area_alocacao: 'Montagem' },
        { id: 'comp-c011', codigo: 'C011', atividade: 'Ensaio de isolação (megômetro)', unidade: 'un', grupo: 'Testes', categoria_profissional: 'Técnico', coeficiente_hh: 1.5, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c012', codigo: 'C012', atividade: 'Comissionamento em campo', unidade: 'h', grupo: 'Testes', categoria_profissional: 'Engenheiro', coeficiente_hh: 1.0, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.5, area_alocacao: 'Montagem' },
        { id: 'comp-c013', codigo: 'C013', atividade: 'Montagem de rack de instrumentação', unidade: 'un', grupo: 'Estrutura', categoria_profissional: 'Montador', coeficiente_hh: 2.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Montagem' },
        { id: 'comp-c014', codigo: 'C014', atividade: 'Montagem de canaleta perfurada', unidade: 'm', grupo: 'Estrutura', categoria_profissional: 'Montador', coeficiente_hh: 0.5, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c015', codigo: 'C015', atividade: 'Fixação de trilho DIN', unidade: 'm', grupo: 'Estrutura', categoria_profissional: 'Montador', coeficiente_hh: 0.3, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.0, area_alocacao: 'Montagem' },
        { id: 'comp-c016', codigo: 'C016', atividade: 'Montagem de fonte chaveada', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 0.5, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c017', codigo: 'C017', atividade: 'Montagem de CLP / IED', unidade: 'un', grupo: 'Automação', categoria_profissional: 'Eletricista', coeficiente_hh: 2.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.4, area_alocacao: 'Montagem' },
        { id: 'comp-c018', codigo: 'C018', atividade: 'Montagem de bornes em trilho', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Montador', coeficiente_hh: 0.1, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.0, area_alocacao: 'Montagem' },
        { id: 'comp-c019', codigo: 'C019', atividade: 'Identificação e sinalização de bornes', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Montador', coeficiente_hh: 0.05, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.0, area_alocacao: 'Montagem' },
        { id: 'comp-c020', codigo: 'C020', atividade: 'Lançamento de cabos de controle', unidade: 'm', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 0.15, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.1, area_alocacao: 'Montagem' },
        { id: 'comp-c021', codigo: 'C021', atividade: 'Montagem de eletroduto corrugado', unidade: 'm', grupo: 'Estrutura', categoria_profissional: 'Montador', coeficiente_hh: 0.4, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c022', codigo: 'C022', atividade: 'Pintura e acabamento do painel', unidade: 'un', grupo: 'Pintura', categoria_profissional: 'Pintor', coeficiente_hh: 3.0, fator_simples: 0.7, fator_medio: 1.0, fator_complexo: 1.5, area_alocacao: 'Montagem' },
        { id: 'comp-c023', codigo: 'C023', atividade: 'Retoque de pintura (retoque)', unidade: 'un', grupo: 'Pintura', categoria_profissional: 'Pintor', coeficiente_hh: 1.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Montagem' },
        { id: 'comp-c024', codigo: 'C024', atividade: 'Montagem de suportes e brackets', unidade: 'un', grupo: 'Estrutura', categoria_profissional: 'Montador', coeficiente_hh: 0.5, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c025', codigo: 'C025', atividade: 'Montagem de transformador de comando', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 1.5, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Montagem' },
        { id: 'comp-c026', codigo: 'C026', atividade: 'Montagem de reator/banco de capacitores', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 2.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Montagem' },
        { id: 'comp-c027', codigo: 'C027', atividade: 'Ensaio funcional de IHM', unidade: 'un', grupo: 'Testes', categoria_profissional: 'Técnico', coeficiente_hh: 1.0, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c028', codigo: 'C028', atividade: 'Programação de CLP (ladder)', unidade: 'h', grupo: 'Automação', categoria_profissional: 'Engenheiro', coeficiente_hh: 1.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.5, area_alocacao: 'Engenharia' },
        { id: 'comp-c029', codigo: 'C029', atividade: 'Programação de IHM', unidade: 'h', grupo: 'Automação', categoria_profissional: 'Engenheiro', coeficiente_hh: 1.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.4, area_alocacao: 'Engenharia' },
        { id: 'comp-c030', codigo: 'C030', atividade: 'Elaboração de diagramas elétricos', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Projetista', coeficiente_hh: 1.0, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.4, area_alocacao: 'Engenharia' },
        { id: 'comp-c031', codigo: 'C031', atividade: 'Elaboração de diagramas de interconexão', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Projetista', coeficiente_hh: 1.0, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.4, area_alocacao: 'Engenharia' },
        { id: 'comp-c032', codigo: 'C032', atividade: 'Elaboração de lista de borne', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Projetista', coeficiente_hh: 0.5, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Engenharia' },
        { id: 'comp-c033', codigo: 'C033', atividade: 'Elaboração de lista de cabos', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Projetista', coeficiente_hh: 0.5, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Engenharia' },
        { id: 'comp-c034', codigo: 'C034', atividade: 'Dimensionamento de barramento', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Engenheiro', coeficiente_hh: 1.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.5, area_alocacao: 'Engenharia' },
        { id: 'comp-c035', codigo: 'C035', atividade: 'Dimensionamento de proteção', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Engenheiro', coeficiente_hh: 1.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.4, area_alocacao: 'Engenharia' },
        { id: 'comp-c036', codigo: 'C036', atividade: 'Cálculo de curto-circuito', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Engenheiro', coeficiente_hh: 2.0, fator_simples: 0.7, fator_medio: 1.0, fator_complexo: 1.5, area_alocacao: 'Engenharia' },
        { id: 'comp-c037', codigo: 'C037', atividade: 'Cálculo de seletividade', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Engenheiro', coeficiente_hh: 2.0, fator_simples: 0.7, fator_medio: 1.0, fator_complexo: 1.5, area_alocacao: 'Engenharia' },
        { id: 'comp-c038', codigo: 'C038', atividade: 'Revisão de engenharia', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Engenheiro', coeficiente_hh: 1.0, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Engenharia' },
        { id: 'comp-c039', codigo: 'C039', atividade: 'Acompanhamento técnico montagem', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Engenheiro', coeficiente_hh: 1.0, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Engenharia' },
        { id: 'comp-c040', codigo: 'C040', atividade: 'Montagem de disjuntor geral de entrada', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 2.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.4, area_alocacao: 'Montagem' },
        { id: 'comp-c041', codigo: 'C041', atividade: 'Montagem de barramento principal (SEU)', unidade: 'm', grupo: 'Elétrica', categoria_profissional: 'Barramentista', coeficiente_hh: 3.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.5, area_alocacao: 'Montagem' },
        { id: 'comp-c042', codigo: 'C042', atividade: 'Montagem de painel envoltório metálico', unidade: 'un', grupo: 'Estrutura', categoria_profissional: 'Montador', coeficiente_hh: 6.0, fator_simples: 0.7, fator_medio: 1.0, fator_complexo: 1.3, area_alocacao: 'Montagem' },
        { id: 'comp-c043', codigo: 'C043', atividade: 'Montagem de ventilação/termostato', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 0.8, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c044', codigo: 'C044', atividade: 'Montagem de iluminação interna do painel', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 0.5, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.1, area_alocacao: 'Montagem' },
        { id: 'comp-c045', codigo: 'C045', atividade: 'Montagem de tomada interna 220V', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 0.6, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.1, area_alocacao: 'Montagem' },
        { id: 'comp-c046', codigo: 'C046', atividade: 'Elaboração de projeto mecânico (leiaute)', unidade: 'h', grupo: 'Projeto', categoria_profissional: 'Projetista', coeficiente_hh: 1.0, fator_simples: 0.9, fator_medio: 1.0, fator_complexo: 1.4, area_alocacao: 'Engenharia' },
        { id: 'comp-c047', codigo: 'C047', atividade: 'Ensaio de comunicação (rede industrial)', unidade: 'h', grupo: 'Testes', categoria_profissional: 'Técnico', coeficiente_hh: 1.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.4, area_alocacao: 'Montagem' },
        { id: 'comp-c048', codigo: 'C048', atividade: 'Expedição e preparação para embarque', unidade: 'un', grupo: 'Expedição', categoria_profissional: 'Auxiliar', coeficiente_hh: 2.0, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.2, area_alocacao: 'Montagem' },
        { id: 'comp-c049', codigo: 'C049', atividade: 'Montagem de módulo de relés auxiliares', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 0.3, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.1, area_alocacao: 'Montagem' },
        { id: 'comp-c050', codigo: 'C050', atividade: 'Montagem de fusíveis / base fusível', unidade: 'un', grupo: 'Elétrica', categoria_profissional: 'Eletricista', coeficiente_hh: 0.3, fator_simples: 0.8, fator_medio: 1.0, fator_complexo: 1.0, area_alocacao: 'Montagem' },
    ];

    const demoRegras = [
        { nome: 'Estrutura básica do painel', tipo_equipamento: '*', prioridade: 1, condicoes: [], acoes: [{ composicao_id: 'comp-c042', quantidade: '1' }] },
        { nome: 'Aterramento padrão', tipo_equipamento: '*', prioridade: 2, condicoes: [], acoes: [{ composicao_id: 'comp-c003', quantidade: '1' }] },
        { nome: 'Barramento CCM BT', tipo_equipamento: 'CCM-BT', prioridade: 10, condicoes: [{ campo: 'correnteNominal', operador: '>', valor: '0' }], acoes: [{ composicao_id: 'comp-c002', quantidade: '{correnteNominal}/100' }] },
        { nome: 'Barramento QGBT', tipo_equipamento: 'QGBT', prioridade: 10, condicoes: [{ campo: 'correnteNominal', operador: '>', valor: '0' }], acoes: [{ composicao_id: 'comp-c002', quantidade: '{correnteNominal}/80' }] },
        { nome: 'Disjuntores por carga', tipo_equipamento: 'CCM-BT', prioridade: 20, condicoes: [{ campo: 'num_disjuntores', operador: '>', valor: '0' }], acoes: [{ composicao_id: 'comp-c006', quantidade: '{num_disjuntores}' }] },
        { nome: 'Disjuntor geral QGBT', tipo_equipamento: 'QGBT', prioridade: 20, condicoes: [{ campo: 'num_disjuntores', operador: '>', valor: '0' }], acoes: [{ composicao_id: 'comp-c040', quantidade: '1' }, { composicao_id: 'comp-c006', quantidade: '{num_disjuntores}' }] },
        { nome: 'Cabos de potência (cargas)', tipo_equipamento: 'CCM-BT', prioridade: 30, condicoes: [{ campo: 'cargas.length', operador: '>', valor: '0' }], acoes: [{ composicao_id: 'comp-c004', quantidade: '{cargas.length}*5' }] },
        { nome: 'Testes funcionais por carga', tipo_equipamento: '*', prioridade: 40, condicoes: [{ campo: 'cargas.length', operador: '>', valor: '0' }], acoes: [{ composicao_id: 'comp-c007', quantidade: '{cargas.length}*0.5' }] },
        { nome: 'Ensaios DI/DO para automação', tipo_equipamento: 'PLC', prioridade: 50, condicoes: [{ campo: 'tipo', operador: '==', valor: 'PLC' }], acoes: [{ composicao_id: 'comp-c008', quantidade: '8' }, { composicao_id: 'comp-c009', quantidade: '4' }] },
        { nome: 'Montagem de CLP', tipo_equipamento: 'PLC', prioridade: 5, condicoes: [{ campo: 'tipo', operador: '==', valor: 'PLC' }], acoes: [{ composicao_id: 'comp-c017', quantidade: '1' }] },
        { nome: 'Engenharia de projeto (diagramas)', tipo_equipamento: '*', prioridade: 60, condicoes: [{ campo: 'cargas.length', operador: '>', valor: '0' }], acoes: [{ composicao_id: 'comp-c030', quantidade: '{cargas.length}*2' }, { composicao_id: 'comp-c031', quantidade: '{cargas.length}*1' }] },
        { nome: 'Bornes por disjuntor', tipo_equipamento: 'CCM-BT', prioridade: 25, condicoes: [{ campo: 'num_disjuntores', operador: '>', valor: '0' }], acoes: [{ composicao_id: 'comp-c018', quantidade: '{num_disjuntores}*6' }] },
        { nome: 'Pintura e acabamento', tipo_equipamento: '*', prioridade: 3, condicoes: [], acoes: [{ composicao_id: 'comp-c022', quantidade: '1' }] },
        { nome: 'Iluminação interna padrão', tipo_equipamento: '*', prioridade: 4, condicoes: [], acoes: [{ composicao_id: 'comp-c044', quantidade: '1' }] },
    ];

    const now = new Date().toISOString();
    const state = store.getState();

    store.setState({
        clientes: [...state.clientes, ...demoClients],
        materiais: [...state.materiais, ...demoMaterials],
        tipicos: [...state.tipicos, ...demoTypicals],
        orcamentos: [...(state.orcamentos || []), ...demoOrcamentos],
        composicoes: (state.composicoes || []).length > 0
            ? state.composicoes
            : [...demoComposicoes.map(c => ({ ...c, created_at: now, updated_at: now }))],
        regrasDerivacao: (state.regrasDerivacao || []).length > 0
            ? state.regrasDerivacao
            : [...demoRegras.map(r => ({ ...r, id: crypto.randomUUID(), regra_ativa: 1, created_at: now, updated_at: now }))]
    });

    alert("Simulação carregada! Típicos prontos para explodir na LM.");
    if (window.app && window.app.navigateTo) {
        window.app.navigateTo('lm');
    }
};

window.loadDemoData = loadDemoData;
