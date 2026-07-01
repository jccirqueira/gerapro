import { store } from './state.js';

import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from './busbarCalculator.js';



const app = window.app;



const COMMON_NORMS = [

    { id: 'nbr_iec_61439', label: 'ABNT NBR IEC 61439-1 e 2', description: 'Conjuntos de manobra e comando de baixa tensão' },

    { id: 'nbr_iec_62271', label: 'ABNT NBR IEC 62271-200', description: 'Conjuntos de manobra e comando de Média Tensão - Cubículos MT' },

    { id: 'nr10', label: 'NR-10', description: 'Segurança em instalações e serviços em eletricidade' },

    { id: 'nr12', label: 'NR-12', description: 'Segurança no trabalho em máquinas e equipamentos' },

    { id: 'nbr14039', label: 'ABNT NBR 14039', description: 'Instalações elétricas de média tensão' },

    { id: 'nbr_iec_60529', label: 'ABNT NBR IEC 60529', description: 'Classificação do grau de proteção (IP)' }

];

const ELETROCENTRO_NORMS = [
    { id: 'iec_62271_202', label: 'IEC 62271-202', description: 'Normas Estruturais e de Invólucro' },
    { id: 'nbr_8800', label: 'ABNT NBR 8800', description: 'Projeto e o cálculo estrutural de estruturas metálicas' },
    { id: 'nbr_13231', label: 'ABNT NBR 13231', description: 'Proteção contra incêndio em salas elétricas' },
    { id: 'nbr_10898', label: 'ABNT NBR 10898', description: 'Sistemas de iluminação de emergência' }
];



const DEFAULT_LABOR_ROLES = [

    { group: 'Engenharia', role: 'Projetista Elétrico', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia', role: 'Projetista Mecânico', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia', role: 'Coordenador de Engenharia', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia', role: 'Gerente de Engenharia', hours: 0, hourlyRate: 0 },

    { group: 'Montagem', role: 'Montador Layout', hours: 0, hourlyRate: 0 },

    { group: 'Montagem', role: 'Montador Elétrico', hours: 0, hourlyRate: 0 },

    { group: 'Montagem', role: 'Auxiliar de Montagem', hours: 0, hourlyRate: 0 },

    { group: 'Montagem', role: 'Barramentista', hours: 0, hourlyRate: 0 },

    { group: 'Montagem', role: 'Técnico de Service', hours: 0, hourlyRate: 0 },

    { group: 'Montagem', role: 'Eletricista Montador (Campo)', hours: 0, hourlyRate: 0 },

    { group: 'Montagem', role: 'Auxiliar de Montagens (Campo)', hours: 0, hourlyRate: 0 }

];



const DEFAULT_EXPENSES = [

    { desc: "Refeições Diárias para Funcionários", unit: 60.0, qtd: 0 },

    { desc: "Diárias Hotel / Hospedagem", unit: 200.0, qtd: 0 },

    { desc: "Passagens Aéreas", unit: 1500.0, qtd: 0 },

    { desc: "Combustível / Pedágios / Estacionamentos", unit: 300.0, qtd: 0 },

    { desc: "Locação Automóvel", unit: 150.0, qtd: 0 },

    { desc: "Km Rodado (Veículo Próprio)", unit: 1.80, qtd: 0 },

    { desc: "Frete de entrega (Produto Drivetech)", unit: 500.0, qtd: 0 },

    { desc: "Frete de Retorno (Peças/Ferramental)", unit: 300.0, qtd: 0 },

    { desc: "Seguro de Carga", unit: 150.0, qtd: 0 },

    { desc: "Embalagens Especiais (Madeira fumigada)", unit: 1200.0, qtd: 0 },

    { desc: "Locação de Guindastes / Muncks", unit: 2500.0, qtd: 0 },

    { desc: "Locação de Ferramental Especial", unit: 500.0, qtd: 0 },

    { desc: "Exames Médicos (Admissional/Periódico)", unit: 150.0, qtd: 0 },

    { desc: "EPIs Específicos para a Obra", unit: 300.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 5.0 },

    { desc: "Treinamentos Específicos para a Obra", unit: 800.0, qtd: 0, pis: 0, cofins: 0, iss: 5.0 },

    { desc: "ART", unit: 500.0, qtd: 0, pis: 0, cofins: 0, iss: 0 },

    { desc: "Testes em Laboratórios Externos", unit: 2000.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 5.0 },

    { desc: "Software / Licenças Temporárias", unit: 1000.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 0 },

    { desc: "Cópias / Plotagens de Projetos", unit: 200.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 5.0 },

    { desc: "Serviço de Limpeza Pós-Obra", unit: 1000.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 5.0 },

    { desc: "Seguro de Vida (Específico Obra)", unit: 100.0, qtd: 0, pis: 0, cofins: 0, iss: 0 },

    { desc: "Hospedagem em Container / Canteiro", unit: 3000.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 0 },

    { desc: "Locação de Gerador Temporário", unit: 2000.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 0 },

    { desc: "Canteiro de Obras (Mobilização)", unit: 5000.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 5.0 },

    { desc: "Desmobilização de Canteiro", unit: 3000.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 5.0 },

    { desc: "Consultoria Técnica Externa", unit: 5000.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 5.0 },

    { desc: "Despesas com Documentação Legal", unit: 500.0, qtd: 0, pis: 0, cofins: 0, iss: 0 },

    { desc: "Tradução Técnica de Manuais", unit: 1000.0, qtd: 0, pis: 1.65, cofins: 7.60, iss: 5.0 },

    { desc: "Outros", unit: 0, qtd: 0, pis: 0, cofins: 0, iss: 0 }

];

const VENDOR_MAP = {
    'SINALEIROS, BOTÕES E CHAVES COMUTADORAS': ['ABB', 'WEG', 'SIEMENS', 'SCHNEIDER', 'ROCKWELL', 'SCHMERSAL', 'CHINT'],
    'BORNES E CONECTORES': ['PHOENIX', 'WAGO', 'WEIDMULLER', 'PROAUTO'],
    'CABOS DE COMANDO/POTÊNCIA': ['PRYSMIAN', 'COBRECOM', 'LAPP BRASIL', 'SIL FIOS'],
    'CABOS DE REDE': ['PHOENIX', 'SIEMENS', 'FURUKAWA', 'NEXANS'],
    'CAPACITORES': ['ABB', 'WEG', 'SIEMENS'],
    'CHAPARIA': ['RITTAL', 'ELETROPOLL', 'KIT FRAME', 'ELETROMEI', 'PRESSMAT', 'QT', 'CARTHOM´S'],
    'CONTATORES DE COMANDO/POTÊNCIA': ['ABB', 'WEG', 'SIEMENS', 'SCHNEIDER', 'ROCKWELL'],
    'DISJUNTOR ABERTO EXTRAIVEL': ['ABB', 'WEG', 'SIEMENS', 'SCHNEIDER', 'CHINT'],
    'DISJUNTOR CAIXA MOLDADA': ['ABB', 'WEG', 'SIEMENS', 'SCHNEIDER', 'CHINT'],
    'DISJUNTOR MOTOR': ['ABB', 'WEG', 'SIEMENS', 'SCHNEIDER', 'CHINT'],
    'FONTES': ['ABB', 'ROCKWELL', 'PHOENIX', 'SIEMENS', 'MURR'],
    'FUSIVEL': ['ABB', 'SIEMENS', 'WEG', 'BUSSMANN'],
    'INVERSORES': ['DANFOSS', 'ABB', 'WEG', 'SIEMENS', 'SCHNEIDER'],
    'MINIDISJUNTOR': ['ABB', 'WEG', 'SIEMENS', 'SCHNEIDER', 'CHINT', 'STECK'],
    'RELÉ INTELIGENTE': ['SIEMENS', 'ABB', 'ROCKWELL', 'WEG'],
    'MULTIMEDIDOR': ['ABB', 'SIEMENS', 'WEG', 'SCHNEIDER'],
    'SECCIONADORES': ['ABB', 'WEG', 'SIEMENS', 'HOLEC'],
    'SOFTSTARTER': ['DANFOSS', 'ABB', 'WEG', 'SIEMENS', 'SCHNEIDER'],
    'SWITCHES': ['ROCKWELL', 'SIEMENS', 'HIRSCHMANN', 'CISCO'],
    'TRANSFORMADORES DE CORRENTE/POTÊNCIA/COMANDO': ['GHR', 'ISOLET', 'SPTRAFO', 'INSTRUMENT', 'KRON', 'BRASFORMER'],
    'NOBREAK': ['EATON', 'SCHNEIDER'],
    'DISPOSITIVO DE PROTEÇÃO CONTRA SURTO': ['CLAMPER', 'EMBRASTEC'],
    'BORNE RELÉS': ['PHOENIX', 'WAGO', 'WEIDMULLER', 'PROAUTO'],
    'CHAVE DE AFERIÇÃO': ['PHOENIX', 'WAGO', 'WEIDMULLER', 'PROAUTO'],
    'REATORES DE SAÍDAS': ['SPTRAFO', 'GHR'],
    'RELÉS DE SEGURANÇA NR12': ['ABB', 'WEG', 'SIEMENS', 'SCHMERSAL', 'PILZ'],
    'GERADOR DIESEL': ['STEMAC', 'PRAMAC', 'LINO'],
    'FILTRO ATIVO': ['DANFOSS'],
    'PARA-RAIO': ['BALESTRO'],
    'RELÉ DE PROTEÇÃO': ['SIEMENS', 'SEL', 'GE', 'SCHNEIDER']
};



const DEFAULT_ELETROCENTRO_SCOPE = [

    {

        groupName: "PROJETOS",

        items: [
            { desc: "Projeto do layout do eletrocentro com posicionamento dos equipamentos, relação de cargas térmicas e relação de massas.", dvt: true, na: false, cli: false },
            { desc: "Projeto eletromecânico executivo e cálculos estruturais 2D e 3D.", dvt: true, na: false, cli: false },
            { desc: "Projeto executivo de iluminação e tomadas, internas, externas e emergência.", dvt: true, na: false, cli: false },
            { desc: "Projeto executivo de pilotis.", dvt: false, na: true, cli: false },
            { desc: "Projeto executivo de bandejamento (Leitos e Eletrocalhas).", dvt: true, na: false, cli: false },
            { desc: "Projeto executivo e dimensionamento do sistema de climatização.", dvt: true, na: false, cli: false },
            { desc: "Projeto executivo e dimensionamento do sistema de pressurização.", dvt: true, na: false, cli: false },
            { desc: "Projeto de layout orientativo (2D) plataformas, corrimão, escadas e guarda corpo.", dvt: false, na: true, cli: false },
            { desc: "Projeto executivo (2D e 3D) de plataformas, corrimão, escadas e guarda corpo.", dvt: false, na: true, cli: false },
            { desc: "Projeto elétrico executivo de aterramento e SPDA.", dvt: true, na: false, cli: false },
            { desc: "Projeto executivo de SDAI.", dvt: true, na: false, cli: false },
            { desc: "Projeto executivo de CFTV.", dvt: false, na: true, cli: false },
            { desc: "Projeto executivo de controle de acesso.", dvt: true, na: false, cli: false },
            { desc: "Projeto executivo de tubulação de ar comprimido.", dvt: false, na: true, cli: false },
            { desc: "Projeto executivo de suportes para leitos externos.", dvt: false, na: true, cli: false },
            { desc: "Projeto executivo de dimensionamento e posicionamento de leitos externos.", dvt: false, na: false, cli: true },
            { desc: "Plano de carga.", dvt: true, na: false, cli: false }
        ]

    },

    {
        groupName: "MATERIAIS",
        items: [
            { desc: "Eletrocentro pintado conforme padrão do cliente.", dvt: true, na: false, cli: false },
            { desc: "Equipamentos e materiais de iluminação e tomadas, internas, externas e emergência.", dvt: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento de iluminação e tomadas, internas, externas e emergência.", dvt: true, na: false, cli: false },
            { desc: "Pilotis metálicos.", dvt: false, na: true, cli: false },
            { desc: "Leitos e eletrocalhas internos ao eletrocentro.", dvt: true, na: false, cli: false },
            { desc: "Eletrodutos, conduletes e todo suporte eletromecânico.", dvt: true, na: false, cli: false },
            { desc: "Cabos para interligação elétrica de potência entre painéis, transformadores, UPS e retificadores.", dvt: true, na: false, cli: false },
            { desc: "Cabos para interligação elétrica de comando e sinal entre painéis, transformadores, UPS e retificadores.", dvt: true, na: false, cli: false },
            { desc: "Equipamentos e materiais do sistema de climatização (HVAC e acessórios).", dvt: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de climatização (HVAC e acessórios).", dvt: true, na: false, cli: false },
            { desc: "Equipamentos e materiais do sistema de pressurização.", dvt: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de pressurização.", dvt: true, na: false, cli: false },
            { desc: "Plataformas de acesso incluindo corrimão, escadas (modelos e quantidades conforme layout orientativo) e guarda corpo.", dvt: false, na: true, cli: false },
            { desc: "Material e todos os itens de SPDA e aterramento necessários para infraestrutura eletromecânica na área interna do eletrocentro.", dvt: true, na: false, cli: false },
            { desc: "Equipamentos e materiais do sistema de detecção e alarme de incêndio.", dvt: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de detecção e alarme de incêndio.", dvt: true, na: false, cli: false },
            { desc: "Equipamentos e materiais do sistema de combate a incêndio (Manual).", dvt: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de combate a incêndio.", dvt: false, na: true, cli: false },
            { desc: "Equipamentos do sistema de CFTV.", dvt: false, na: true, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação) do sistema de CFTV.", dvt: false, na: true, cli: false },
            { desc: "Equipamentos e materiais de controle de acesso (Fechadura comum).", dvt: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de controle de acesso.", dvt: false, na: true, cli: false },
            { desc: "Fechamento do porão de cabos com telas.", dvt: false, na: true, cli: false },
            { desc: "Selagem corta fogo e pintura intumescente.", dvt: false, na: true, cli: false },
            { desc: "Isolação térmica ou tapete de borracha para o piso da sala.", dvt: false, na: true, cli: false },
            { desc: "Sistema de calhas pluviais.", dvt: false, na: true, cli: false },
            { desc: "Tubos para interligação de ar comprimido.", dvt: false, na: true, cli: false },
            { desc: "Válvulas e filtros para tubulação de ar comprimido.", dvt: false, na: true, cli: false },
            { desc: "Suportes para leitos externos em toda extensão do eletrocentro.", dvt: false, na: true, cli: false },
            { desc: "Porta corta fogo.", dvt: false, na: true, cli: false },
            { desc: "Olhais de suspensão.", dvt: true, na: false, cli: false },
            { desc: "Linha de vida.", dvt: false, na: true, cli: false },
            { desc: "Balancim (Comodato).", dvt: false, na: false, cli: true }
        ]
    },

    {
        groupName: "SERVIÇOS EM FÁBRICA",
        items: [
            { desc: "Montagem, instalação e fixação dos painéis e equipamentos.", dvt: true, na: false, cli: false },
            { desc: "Montagem e instalação eletromecânica dos equipamentos HVAC.", dvt: true, na: false, cli: false },
            { desc: "Interligação elétrica entre painéis e equipamentos internos ao eletrocentro.", dvt: true, na: false, cli: false },
            { desc: "Interligação de rede entre painéis internos ao eletrocentro.", dvt: true, na: false, cli: false },
            { desc: "Comissionamento do eletrocentro.", dvt: true, na: false, cli: false },
            { desc: "Teste de aceitação de fábrica.", dvt: true, na: false, cli: true }
        ]
    },

    {
        groupName: "ENTREGA",
        items: [
            { desc: "Frete do eletrocentro do fornecedor do eletrocentro ao cliente final.", dvt: true, na: false, cli: false },
            { desc: "Frete do eletrocentro do fornecedor do eletrocentro a Drivetech Ribeirão Preto.", dvt: false, na: true, cli: false },
            { desc: "Descarregamento do eletrocentro em Ribeirão Preto - SP.", dvt: false, na: true, cli: false },
            { desc: "Descarregamento do eletrocentro no cliente final.", dvt: false, na: false, cli: true },
            { desc: "Descarregamento de equipamentos de terceiros.", dvt: false, na: false, cli: true }
        ]
    },

    {
        groupName: "SERVIÇOS DE CAMPO",
        items: [
            { desc: "Instalação dos pilotis.", dvt: false, na: true, cli: false },
            { desc: "Supervisão de descarga e montagem nos pilotis.", dvt: false, na: true, cli: false },
            { desc: "Montagem do eletrocentro nos pilotis.", dvt: false, na: true, cli: false },
            { desc: "Acoplamento e selagem/vedação do eletrocentro.", dvt: true, na: false, cli: false },
            { desc: "Reposicionamento de cabos, para raios e ar-condicionado.", dvt: true, na: false, cli: false },
            { desc: "Interligação dos cabos removidos para transporte.", dvt: true, na: false, cli: false },
            { desc: "Selagem com espuma expansiva a entrada cabos internos ao eletrocentro.", dvt: true, na: false, cli: false },
            { desc: "Comissionamento e start-up.", dvt: true, na: false, cli: true },
            { desc: "Instalação e montagem de leitos externos ao eletrocentro.", dvt: false, na: false, cli: true },
            { desc: "Interligação elétrica externa ao eletrocentro.", dvt: false, na: false, cli: true },
            { desc: "Instalação de leitos externos ao eletrocentro.", dvt: false, na: false, cli: true },
            { desc: "Limpeza geral do eletrocentro após acoplamento.", dvt: false, na: false, cli: true }
        ]
    },

    {
        groupName: "CIVIL",
        items: [
            { desc: "Projeto civil de fundação dos eletrocentros.", dvt: false, na: false, cli: true },
            { desc: "Estrutura civil de fundação dos eletrocentros.", dvt: false, na: false, cli: true }
        ]
    }

];



// Migra formato antigo (array plano) para o novo formato de grupos

function migrateEletrocentroScope(scope) {

    if (!scope || scope.length === 0) return JSON.parse(JSON.stringify(DEFAULT_ELETROCENTRO_SCOPE));

    // Se já é array de grupos (tem groupName), retorna como está

    if (scope[0] && typeof scope[0].groupName === 'string') return scope;

    // Formato antigo: array plano de itens â migra para um grupo "PROJETOS"

    return [{ groupName: "PROJETOS", items: scope }];

}





const DEFAULT_EXCLUSIONS = [
    'Serviços de natureza civil / mecânica, tais como abertura e fechamento de valas, obras civis em geral',
    'Serviços de montagem mecânica de estruturas e tubulações',
    'Instalação / Acoplamento do CCM',
    'Movimentação horizontal / vertical dos materiais',
    'Canteiro de Obra para a execução dos serviços',
    'Estudos técnicos',
    'Intervenções em outros equipamentos aqui não especificados',
    'Serviços de termografia em campo após a energização dos Painéis e Equipamentos',
    'Descarga de Painéis e Equipamentos',
    'Não estamos considerando o fornecimento de parafusos para conexões em campo e conexão entre filtros externos',
    'Teste de aceitação de fábrica por típico, padrão, com acompanhamento do cliente',
    'Estudos de curto-circuito, coordenação e seletividade',
    'Estudos de energia incidente (arc-flash)',
    'Estudos de saturação de TC\'s',
    'Estudos de Harmônicas e verificação dos impactos no transformador de potência',
    'Manual de comissionamento e operação',
    'Certificação de Rede',
    'Serviços de Montagem em Campo',
    'Qualquer item não descrito nessa proposta'
];

const makeDefaultExclusions = () => DEFAULT_EXCLUSIONS.map(texto => ({ id: crypto.randomUUID(), texto }));

const PropostaTecnicaModule = {

    init() {

        console.log("Proposta Técnica Module Hierarchical Initializing...");

        

        // Exporta o módulo para o escopo global de forma consistente

        window.propostaTecnicaModule = this;

        

        // Mantém compatibilidade com referências legadas

        if (window.app) window.app.propostaTecnica = this;



        this.viewMode = 'list';

        this.activeTab = 'geral'; // geral, escopo, equipments, revisoes

        this.activeSubTab = 'technical'; // technical, norms, loads, etc.

        this.activeEquipmentIndex = 0;

        this.cargasSubView = 'edit'; // 'edit' ou 'lm'

        this.activePanelFilter = 'Geral';

        this.lmFilterQuery = '';

        this.forcedDashboard = false;

        this._loading = false;

        store.subscribe((state) => {

            const container = document.getElementById('view-proposta-tecnica');

            if (container && !container.classList.contains('hidden-module')) {

                this.render();

            }

        });

    },



    create() {

        let initialData = {

            id: 'PT-' + Date.now(),

            cliente: window.app.currentDvt?.client || '',

            projeto: window.app.currentDvt?.title || '',

            objeto: 'FORNECIMENTO DE PAIN�?�?�IS EL�?�?�TRICOS',

            equipments: [

                {

                    id: Date.now(),

                    tag: 'TAG-01',

                    type: 'CCM-BT',

                    norms: ['nbr_iec_61439', 'nr10'],

                technical: { tensao: '380V', icc: '50kA', ip: 'IP-42', corrente_nominal: '', tensao_operacao: '', sistema_eletrico: '' },

                    loads: []

                }

            ],

            scopeItems: [],
            exclusions: makeDefaultExclusions(),

            revisions: [{ no: '00', desc: 'Emissão Inicial', elab: 'M.S', verif: 'G.A', aprov: 'R.D', data: new Date().toLocaleDateString() }],

            updatedAt: new Date().toISOString()

        };

        this.viewMode = 'form';

        this.activeTab = 'geral';

        this.activeEquipmentIndex = 0;

        this.cargasSubView = 'edit';

        store.setState({ activeTechnicalProposal: initialData });

        this.renderModal(initialData);

    },



    switchTab(tabId) {

        if (this.activeTab === 'equipments') {

            this.captureEquipmentData();

        }

        this.activeTab = tabId;

        const data = store.getState().activeTechnicalProposal;

        if (data) {

            data.lastActiveTab = tabId;

            store.setState({ activeTechnicalProposal: data });

        }

        this.renderModal(data);

    },



    switchEquipment(index) {

        this.captureEquipmentData();

        this.activeEquipmentIndex = index;

        const data = store.getState().activeTechnicalProposal;

        if (data) {

            data.lastActiveEquipmentIndex = index;

            store.setState({ activeTechnicalProposal: data });

        }

        this.renderModal(data);

    },



    switchSubTab(tabId) {

        this.captureEquipmentData();

        this.activeSubTab = tabId;

        const data = store.getState().activeTechnicalProposal;

        if (data) {

            data.lastActiveSubTab = tabId;

            store.setState({ activeTechnicalProposal: data });

        }

        this.renderModal(data);

    },

    toggleSeuExpand(seuId) {
        if (!this._seuExpanded) this._seuExpanded = new Set();
        if (this._seuExpanded.has(seuId)) {
            this._seuExpanded.delete(seuId);
        } else {
            this._seuExpanded.add(seuId);
        }
        const data = store.getState().activeTechnicalProposal;
        this.renderModal(data);
    },

    /**

     * Captura dados do DOM para o equipamento ativo

     */

    captureEquipmentData() {

        const form = document.getElementById('form-proposta-tecnica');

        if (!form || this.activeEquipmentIndex === -1) return;

        if (!form.isConnected) return;



        const data = store.getState().activeTechnicalProposal;

        if (!data || !data.equipments || !data.equipments[this.activeEquipmentIndex]) {

            console.warn("[PropostaTecnica] captureEquipmentData aborted: missing data or equipment", { data, index: this.activeEquipmentIndex });

            return;

        }

        

        let eq = data.equipments[this.activeEquipmentIndex];

        if (eq && eq.type === 'TR-MT' && ['loads','enclosures','busbars','labor','eletrocentro','calc_eletrico','calc_mecanico'].includes(this.activeSubTab)) {
            return;
        }
        if (eq && eq.type === 'TR-MT' && this.activeSubTab === 'exclusions') {
            return;
        }

        const formData = new FormData(form);



        if (this.activeSubTab === 'ficha_ec') {

            eq.tag = formData.get('eq_tag') || eq.tag;

            eq.type = formData.get('eq_type') || eq.type;

            if (!eq.technical) eq.technical = {};

            const ecFields = ['qtd_modulos', 'altura_externa', 'altura_interna', 'largura_total', 'comprimento_total', 'peso_total'];

            ecFields.forEach(field => {

                const val = formData.get(`eq_${field}`);

                if (val !== null) eq.technical[field] = val;

            });

        }

        if (this.activeSubTab === 'technical') {

            const formTag = formData.get('eq_tag');
            console.log("[PropostaTecnica] captureEquipmentData -> formTag:", formTag, "old tag:", eq.tag);
            eq.tag = formTag || eq.tag;

            eq.type = formData.get('eq_type') || eq.type; // preserved from hidden input (read-only badge)

            if (eq.type === 'ELETROCENTRO' && (!eq.eletrocentroScope || eq.eletrocentroScope.length === 0)) {

                eq.eletrocentroScope = JSON.parse(JSON.stringify(DEFAULT_ELETROCENTRO_SCOPE));

            }

            if (!eq.technical) eq.technical = {};

            // ── Captura especial SEU ───────────────────────────────────────────
            if (eq.type === 'SEU') {

                const tensao = formData.get('seu_tensao_primaria');
                eq.technical.tensao_primaria = tensao || '';
                eq.technical.tensao_primaria_outro = tensao === 'Outro'
                    ? (formData.get('seu_tensao_primaria_outro') || '')
                    : '';

            } else {

                // Capturar todos os campos dinâmicos da ficha técnica

                const technicalFields = [

                    'tensao', 'tensao_max', 'frequencia', 'icc', 'icp', 'nbi', 'suportabilidade',

                    'corrente_nominal', 'iac', 'iac_tempo', 'lsc', 'particao', 'altitude',

                    'tensao_operacao', 'sistema_eletrico', 'comando', 'comando_fonte', 'auxiliar', 'auxiliar_fonte',

                    'coordenacao', 'execucao', 'montagem', 'instalacao', 'ip',

                    'cor_externa', 'camada_pintura', 'placa_montagem',

                    'segregacao', 'entrada_cabos', 'saida_cabos',

                    'acesso_frontal', 'acesso_traseiro', 'acesso_manutencao',

                    'protocolo', 'cabo_comunicacao', 'monitoramento_arco_eq',

                    'arco_interno', 'iluminacao', 'tomada', 'termostato', 'ventilacao',

                    'barramento_tratamento', 'termoretratil', 'norma_teste'

                ];



                technicalFields.forEach(field => {

                    const val = formData.get(`eq_${field}`);

                    const otherVal = formData.get(`eq_${field}_other`);

                    eq.technical[field] = (val === 'Outro') ? (otherVal || '') : val;

                });

            }

        }




        if (this.activeSubTab === 'norms') {

            eq.norms = Array.from(form.querySelectorAll('input[name="selectedNorms"]:checked')).map(cb => cb.value);

        }



        if (this.activeSubTab === 'enclosures') {

            const items = [];

            const rows = form.querySelectorAll('.enclosure-row');

            rows.forEach((row, i) => {

                items.push({

                    col: formData.get(`enc_col_${i}`),

                    type: formData.get(`enc_type_${i}`),

                    dim: formData.get(`enc_dim_${i}`),

                    ip: formData.get(`enc_ip_${i}`),

                    color: formData.get(`enc_color_${i}`),

                    side: formData.get(`enc_side_${i}`)

                });

            });

            eq.enclosureItems = items;

        }



        if (this.activeSubTab === 'busbars') {

            eq.busbars = {

                main: { 

                    mat: formData.get('bus_main_mat'), 

                    dim: formData.get('bus_main_dim'), 

                    inc: formData.get('bus_main_inc'),

                    weight: formData.get('bus_main_weight')

                },

                branch: { 

                    mat: formData.get('bus_branch_mat'), 

                    dim: formData.get('bus_branch_dim'), 

                    inc: formData.get('bus_branch_inc'),

                    weight: formData.get('bus_branch_weight')

                },

                ground: { 

                    mat: formData.get('bus_ground_mat'), 

                    dim: formData.get('bus_ground_dim'),

                    weight: formData.get('bus_ground_weight')

                }

            };

        }



        

        if (this.activeSubTab === 'loads' && this.cargasSubView === 'edit') {

            const items = [];

            const rows = form.querySelectorAll('.detailed-load-row');

            if (rows.length > 0) {

                rows.forEach((row, i) => {

                    items.push({

                        tag: formData.get(`dload_tag_${i}`),

                        desc: formData.get(`dload_desc_${i}`),

                        power: formData.get(`dload_power_${i}`),

                        tensao: formData.get(`dload_tensao_${i}`),

                        current: formData.get(`dload_current_${i}`),

                        regime: formData.get(`dload_regime_${i}`),

                        type: formData.get(`dload_type_${i}`),

                        typicalId: formData.get(`dload_typicalId_${i}`)

                    });

                });

                eq.loads = items;

            }

        }



        if (this.activeSubTab === 'deviations') {
            const data = store.getState().activeTechnicalProposal;
            const devEq = data.equipments[this.activeEquipmentIndex];
            this._normalizeDeviations(devEq);
            devEq.deviations.forEach((it, i) => {
                if (it._editing) {
                    const docEl = document.querySelector(`[name="dev_documento_${i}"]`);
                    const solEl = document.querySelector(`[name="dev_solicitado_${i}"]`);
                    const desEl = document.querySelector(`[name="dev_desvio_${i}"]`);
                    if (docEl) it.documento = docEl.value;
                    if (solEl) it.solicitado = solEl.value;
                    if (desEl) it.desvio = desEl.value;
                    it._editing = false;
                }
            });
            devEq.deviations = devEq.deviations.map(({ _editing, ...rest }) => ({ id: rest.id || crypto.randomUUID(), ...rest }));
            store.setState({ activeTechnicalProposal: data });
            eq.deviations = devEq.deviations;

        }



        if (this.activeSubTab === 'labor') {

            const laborItems = [];

            const rows = form.querySelectorAll('.labor-row');

            rows.forEach((row, i) => {

                laborItems.push({

                    group: formData.get(`labor_group_${i}`),

                    role: formData.get(`labor_role_${i}`),

                    hours: parseFloat(formData.get(`labor_hours_${i}`) || 0),

                    hourlyRate: parseFloat((formData.get(`labor_rate_${i}`) || '0').replace(',', '.'))

                });

            });

            eq.labor = { items: laborItems };

        }



        if (this.activeSubTab === 'expenses') {

            const expenseItems = [];

            const rows = form.querySelectorAll('.expense-row');

            rows.forEach((row, i) => {

                expenseItems.push({

                    desc: formData.get(`exp_desc_${i}`),

                    unit: parseFloat((formData.get(`exp_unit_${i}`) || '0').replace(',', '.')),

                    qtd: parseFloat(formData.get(`exp_qtd_${i}`) || 0),



                });

            });

            eq.expenses = expenseItems;

        }



        if (this.activeSubTab === 'eletrocentro') {

            const groups = [];

            document.querySelectorAll('.el-scope-group').forEach((tbody) => {

                const groupNameInput = tbody.querySelector('.el-group-name');

                const groupName = groupNameInput ? groupNameInput.value.trim() : 'GRUPO';

                const items = [];

                tbody.querySelectorAll('.el-scope-row').forEach((row) => {

                    items.push({

                        desc: row.querySelector('input[name="el_scope_desc"]')?.value || '',

                        dvt: row.querySelector('input[name="el_scope_dvt"]')?.checked || false,

                        na: row.querySelector('input[name="el_scope_na"]')?.checked || false,

                        cli: row.querySelector('input[name="el_scope_cli"]')?.checked || false

                    });

                });

                groups.push({ groupName, items });

            });

            eq.eletrocentroScope = groups;

        }



        if (this.activeSubTab === 'calc_eletrico') {

            if (!eq.calculosEletricos) eq.calculosEletricos = {};

            const ceFields = ['corrente_nominal', 'corrente_curto', 'tensao_nominal', 'potencia_instalada',
                              'potencia_demandada', 'fator_demanda', 'fator_potencia', 'corrente_barramento',
                              'corrente_pico', 'observacoes'];

            ceFields.forEach(field => {

                const val = formData.get(`ce_${field}`);

                if (val !== null) eq.calculosEletricos[field] = val;

            });

        }



        if (this.activeSubTab === 'calc_mecanico') {

            if (!eq.calculosMecanicos) eq.calculosMecanicos = {};

            const cmFields = ['altura', 'largura', 'profundidade', 'peso', 'espessura_chapa',
                              'espessura_frontal', 'secao_barramento', 'carga_piso',
                              'dissipacao_calor', 'observacoes'];

            cmFields.forEach(field => {

                const val = formData.get(`cm_${field}`);

                if (val !== null) eq.calculosMecanicos[field] = val;

            });

        }



        // Persistir também o estado de navegação atual no dado

        data.lastActiveTab = this.activeTab;

        data.lastActiveSubTab = this.activeSubTab;

        data.lastActiveEquipmentIndex = this.activeEquipmentIndex;



        store.setState({ activeTechnicalProposal: data });

    },



    addEquipment() {

        const html = `

            <div id="modal-add-eq" class="modal-overlay" style="z-index: 9999;">

                <div class="modal" style="width: 400px; padding: 25px; border-radius: 16px;">

                    <h3 style="margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">Novo Equipamento</h3>

                    <div class="form-group">

                        <label class="form-label">TAG do Equipamento</label>

                        <input type="text" id="new-eq-tag" class="form-control" placeholder="Ex: CCM-01" value="TAG-0${store.getState().activeTechnicalProposal.equipments.length + 1}">

                    </div>

                    <div class="form-group">

                        <label class="form-label">Tipo de Equipamento</label>

                        <select id="new-eq-type" class="form-control">

                            <option value="CCM-BT">CCM-BT (Centro de Controle de Motores BT)</option>

                            <option value="QGBT">QGBT (Quadro Geral de Baixa Tensão)</option>

                            <option value="CUB-MT">Cubículo de Média Tensão (MT)</option>

                            <option value="ELETROCENTRO">ELETROCENTRO (Sala Elétrica Modular)</option>

                            <option value="QTA">QTA (Quadro de Transferência Automática)</option>

                            <option value="PLC">PLC (Painel de Automação)</option>

                            <option value="BC">BC (Banco de Capacitores)</option>

                            <option value="REM">REM (Remota de Automação)</option>

                            <option value="PNC">PNC (Painel de Controle)</option>

                            <option value="QDL">QDL (Quadro de Iluminação)</option>

                            <option value="QDF">QDF (Quadro Distribuição de Força)</option>

                            <option value="SEU">SEU (Subestação Unitária)</option>

                            <option value="TR-MT">TR-MT (Transformador de Potência)</option>

                        </select>

                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 25px; justify-content: flex-end;">

                        <button class="btn btn-secondary" onclick="document.getElementById('modal-add-eq').remove()">Cancelar</button>

                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmAddEquipment()" style="background: #1e3a8a;">Criar Equipamento</button>

                    </div>

                </div>

            </div>

        `;

        document.body.insertAdjacentHTML('beforeend', html);

    },



    addSeu(tag) {

        const data = store.getState().activeTechnicalProposal;

        const equipments = data.equipments || [];

        // IDs já vinculados a alguma SEU
        const boundIds = new Set();
        equipments.filter(e => e.type === 'SEU').forEach(seu => {
            (seu.seu_components || []).forEach(id => boundIds.add(String(id)));
        });

        // Equipamentos disponíveis (não-SEU, não vinculados a outra SEU)
        const available = equipments.filter(e =>
            e.type !== 'SEU' && !boundIds.has(String(e.id))
        );

        const nextNum = equipments.filter(e => e.type === 'SEU').length + 1;

        const html = `
            <div id="modal-add-seu" class="modal-overlay" style="z-index: 9999;">
                <div class="modal" style="width: 520px; padding: 25px; border-radius: 16px;">
                    <h3 style="margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
                        <i class="ph ph-lightning-slash"></i> Nova Subestação Unitária (SEU)
                    </h3>

                    <div class="form-group">
                        <label class="form-label">Tag da SEU</label>
                        <input type="text" id="seu-tag" class="form-control" placeholder="Ex: SEU-01" value="${tag || `SEU-0${nextNum}`}">
                    </div>

                    <div class="form-group" style="margin-top: 15px;">
                        <label class="form-label">Tensão Primária (V)</label>
                        <select id="seu-tensao" class="form-control" onchange="app.propostaTecnica.validateSeuTensao()">
                            <option value="">Selecione...</option>
                            <option value="6,0kV">6,0 kV</option>
                            <option value="6,9kV">6,9 kV</option>
                            <option value="11,9kV">11,9 kV</option>
                            <option value="13,8kV">13,8 kV</option>
                            <option value="22kV">22 kV</option>
                            <option value="34,5kV">34,5 kV</option>
                            <option value="Outro">Outro</option>
                        </select>
                        <div id="seu-tensao-outro-wrap" style="display:none; margin-top:8px;">
                            <input type="text" id="seu-tensao-outro" class="form-control" placeholder="Especifique a tensão...">
                        </div>
                        <div id="seu-tensao-msg" style="font-size: 12px; margin-top: 4px; color: #94a3b8;"></div>
                    </div>

                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                        <label class="form-label" style="font-weight: 700; color: #1e3a8a;">Equipamentos desta SEU</label>
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">
                            Selecione os equipamentos que compõem esta subestação.
                            ${available.length === 0 ? '<div style="color:#dc2626;margin-top:4px;">Nenhum equipamento disponível. Crie equipamentos primeiro.</div>' : ''}
                        </div>
                        <div id="seu-comp-list" style="max-height: 260px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;">
                            ${available.length === 0 ? '<div style="padding: 20px; text-align: center; color: #94a3b8;">Nenhum equipamento disponível para adicionar à SEU.</div>' : available.map(e => `
                                <label style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s;"
                                       onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='transparent'">
                                    <input type="checkbox" name="seu-comp-cb" value="${e.id}" onchange="app.propostaTecnica.updateSeuCompMsg()" style="width: 16px; height: 16px; accent-color: #92400e; flex-shrink: 0;">
                                    <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 13px; font-weight: 600;">${e.tag}</span>
                                        <span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">${e.type}</span>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                        <div id="seu-comp-msg" style="font-size: 12px; margin-top: 6px; min-height: 18px;"></div>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 25px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="document.getElementById('modal-add-seu').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmSeu()" style="background: #1e3a8a;">Criar SEU</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    validateSeuTensao() {
        const sel = document.getElementById('seu-tensao');
        const outroWrap = document.getElementById('seu-tensao-outro-wrap');
        const msg = document.getElementById('seu-tensao-msg');
        if (sel.value === 'Outro') {
            outroWrap.style.display = 'block';
            msg.textContent = 'Informe a tensão primária manualmente (deve ser > 1000V).';
            msg.style.color = '#f59e0b';
        } else if (sel.value) {
            outroWrap.style.display = 'none';
            msg.textContent = '';
        } else {
            outroWrap.style.display = 'none';
            msg.textContent = '';
        }
    },

    toggleSeuTensaoOutro(sel) {
        const wrap = document.getElementById('seu_tensao_primaria_outro_wrap');
        if (wrap) {
            wrap.style.display = (sel.value === 'Outro' || !sel.value) ? '' : 'none';
        }
    },

    updateSeuCompMsg() {
        const msg = document.getElementById('seu-comp-msg');
        if (!msg) return;
        const data = store.getState().activeTechnicalProposal;
        const checkboxes = document.querySelectorAll('#seu-comp-list input[name="seu-comp-cb"]:checked');
        const count = checkboxes.length;
        const hasTrMt = Array.from(checkboxes).some(cb => {
            const eq = (data.equipments || []).find(e => String(e.id) === String(cb.value));
            return eq && eq.type === 'TR-MT';
        });
        if (count === 0) {
            msg.innerHTML = '<span style="color:#f59e0b;">⚠️ Nenhum equipamento selecionado.</span>';
        } else if (!hasTrMt) {
            msg.innerHTML = `<span style="color:#f59e0b;">⚠️ ${count} equipamento(s) — Nenhum TR-MT selecionado (recomendado).</span>`;
        } else {
            msg.innerHTML = `<span style="color:#16a34a;">✅ ${count} equipamento(s) — TR-MT presente.</span>`;
        }
    },

    addSeuComponent(seuId) {
        const data = store.getState().activeTechnicalProposal;
        const seu = data.equipments.find(e => e.id === seuId);
        if (!seu) return;

        // IDs já vinculados
        const boundIds = new Set();
        data.equipments.filter(e => e.type === 'SEU').forEach(s => {
            (s.seu_components || []).forEach(id => boundIds.add(String(id)));
        });

        const available = data.equipments.filter(e =>
            e.type !== 'SEU' && !boundIds.has(String(e.id))
        );

        if (available.length === 0) return app.toast('Nenhum equipamento disponível para adicionar.', 'error');

        const html = `
            <div id="modal-add-seu-comp" class="modal-overlay" style="z-index: 9999;">
                <div class="modal" style="width: 420px; padding: 25px; border-radius: 16px;">
                    <h3 style="margin-top:0;color:#1e3a8a;border-bottom:1px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px;">
                        Adicionar Componente — ${seu.tag}
                    </h3>
                    <div style="max-height:300px;overflow-y:auto;">
                        ${available.map(e => `
                            <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;cursor:pointer;"
                                   onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='transparent'">
                                <input type="checkbox" name="seu-add-comp-cb" value="${e.id}" style="width:16px;height:16px;accent-color:#92400e;">
                                <span style="flex:1;font-size:13px;font-weight:600;">${e.tag}</span>
                                <span style="background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">${e.type}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div style="display:flex;gap:10px;margin-top:25px;justify-content:flex-end;">
                        <button class="btn btn-secondary" onclick="document.getElementById('modal-add-seu-comp').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmAddSeuComponent(${seuId})" style="background:#1e3a8a;">Adicionar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    confirmAddSeuComponent(seuId) {
        const data = store.getState().activeTechnicalProposal;
        const seu = data.equipments.find(e => e.id === seuId);
        if (!seu) return;
        if (!seu.seu_components) seu.seu_components = [];

        const checkboxes = document.querySelectorAll('#modal-add-seu-comp input[name="seu-add-comp-cb"]:checked');
        checkboxes.forEach(cb => {
            const id = cb.value;
            if (!seu.seu_components.includes(id)) {
                seu.seu_components.push(id);
            }
        });

        document.getElementById('modal-add-seu-comp').remove();
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
        app.toast(`Componente(s) adicionado(s) à ${seu.tag}.`, 'success');
    },

    removeSeuComponent(seuId, compId) {
        const data = store.getState().activeTechnicalProposal;
        const seu = data.equipments.find(e => e.id === seuId);
        if (!seu || !seu.seu_components) return;

        seu.seu_components = seu.seu_components.filter(id => String(id) !== String(compId));
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);

        const compEq = data.equipments.find(e => String(e.id) === String(compId));
        if (compEq) this.resetSeuComponentIpi(compEq.tag);

        app.toast('Componente removido da SEU e IPI restaurado.', 'success');
    },

    resetSeuComponentIpi(tag) {
        const prec = window.app?.precificacao;
        if (!prec || !prec.pricingMap || !prec.pricingMap[tag]) return;
        const def = prec.getDefaultPricingData();
        prec.pricingMap[tag].ipiIsento = def.ipiIsento;
        prec.pricingMap[tag].ipi = def.ipi;
    },

    undoSeu(seuId) {
        const data = store.getState().activeTechnicalProposal;
        const seu = data.equipments.find(e => e.id === seuId);
        if (!seu || seu.type !== 'SEU') return;

        if (!confirm(`Desfazer SEU ${seu.tag}? Os ${(seu.seu_components || []).length} equipamento(s) voltarão a ser independentes com IPI normal.`)) return;

        const index = data.equipments.indexOf(seu);

        (seu.seu_components || []).forEach(compId => {
            const compEq = data.equipments.find(e => String(e.id) === String(compId));
            if (compEq) this.resetSeuComponentIpi(compEq.tag);
        });

        data.equipments.splice(index, 1);
        this.activeEquipmentIndex = Math.max(0, data.equipments.length - 1);

        store.setState({ activeTechnicalProposal: data });
        this.syncScopeFromEquipments();
        this.renderModal(data);

        const prec = window.app?.precificacao;
        if (prec) {
            prec.calculateAll();
            prec.render();
        }

        app.toast(`SEU ${seu.tag} desfeita. ${(seu.seu_components || []).length} equipamento(s) liberado(s) com IPI normal.`, 'success');
    },

    confirmSeu() {
        const tag = document.getElementById('seu-tag').value.trim();
        if (!tag) return app.toast('Informe a TAG da SEU', 'error');

        const tensaoSel = document.getElementById('seu-tensao');
        let tensao = tensaoSel.value;
        if (!tensao) {
            const msg = document.getElementById('seu-tensao-msg');
            if (msg) {
                msg.textContent = 'Selecione uma Tensão Primária (V) antes de criar a SEU.';
                msg.style.color = '#dc2626';
                msg.style.fontWeight = '600';
            }
            document.getElementById('seu-tensao')?.focus();
            return app.toast('Selecione a tensão primária', 'error');
        }
        if (tensao === 'Outro') {
            tensao = document.getElementById('seu-tensao-outro').value.trim();
            if (!tensao) return app.toast('Especifique a tensão primária', 'error');
        }

        const checkboxes = document.querySelectorAll('#seu-comp-list input[name="seu-comp-cb"]:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);

        const hasTrMt = selectedIds.some(id => {
            const data = store.getState().activeTechnicalProposal;
            const eq = (data.equipments || []).find(e => String(e.id) === String(id));
            return eq && eq.type === 'TR-MT';
        });

        if (!hasTrMt && !confirm('Nenhum Transformador (TR-MT) selecionado. Deseja continuar mesmo assim?')) {
            return;
        }

        const data = store.getState().activeTechnicalProposal;

        const newSeu = {
            id: Date.now(),
            tag: tag,
            type: 'SEU',
            seu_components: selectedIds,
            norms: [],
            technical: { tensao_primaria: tensao },
            loads: []
        };

        data.equipments.push(newSeu);
        this.activeEquipmentIndex = data.equipments.length - 1;
        this.activeSubTab = 'technical';
        document.getElementById('modal-add-seu').remove();
        this.syncScopeFromEquipments();
        app.toast(`SEU ${tag} criada com ${selectedIds.length} equipamento(s).`, 'success');
    },

    confirmAddEquipment() {

        const tag = document.getElementById('new-eq-tag').value;

        const type = document.getElementById('new-eq-type').value;

        if (!tag) return app.toast('Informe a TAG', 'error');

        if (type === 'SEU') {
            document.getElementById('modal-add-eq').remove();
            return this.addSeu(tag);
        }

        const data = store.getState().activeTechnicalProposal;

        const newEq = {

            id: Date.now(),

            tag: tag,

            type: type,

            norms: type === 'CUB-MT' ? ['nbr_iec_62271', 'nr10', 'nr12', 'nbr14039', 'nbr_iec_60529'] : type === 'ELETROCENTRO' ? ['iec_62271_202', 'nbr_8800', 'nbr_13231', 'nbr_10898'] : ['nbr_iec_61439', 'nr10', 'nr12', 'nbr_iec_60529'],

            technical: this.getDefaultTechnicalForType(type),

            loads: []

        };



        data.equipments.push(newEq);

        this.activeEquipmentIndex = data.equipments.length - 1;

        this.activeSubTab = 'technical';

        document.getElementById('modal-add-eq').remove();

        this.syncScopeFromEquipments();

        app.toast(`Equipamento ${tag} adicionado.`, 'success');

    },



    getDefaultTechnicalForType(type) {

        if (type === 'TR-MT') {

            return {
                tipo: 'Trifásico Seco',
                potencia: '2000kVA',
                enrolamento: 'Alumínio',
                tensao_primaria: '13,8kV',
                tensao_secundaria: '440-254V',
                ligacao_primaria: 'Triângulo Δ (delta)',
                ligacao_secundaria: 'Estrela Y',
                grupo_ligacao: 'Dyn1',
                frequencia: '60Hz',
                fator_k: '1',
                classe: '15kV',
                ip: 'IP-23',
                classe_temperatura: 'F',
                instalacao: 'Abrigado',
                nbi: '95kV',
                resfriamento: 'Ar Natural (ONAN)',
                acessorios: 'Controlador de temperatura microprocessado com PT100',
                fabricante: 'WEG'
            };

        }

        if (type === 'CUB-MT') {

            return {

                tensao: '13.8kV',

                isolamento: '15kV',

                frequencia: '60Hz',

                icc: '16kA/1s',

                icp: '40kAp',

                iac: 'AFLR',

                perda_arco: 'LSC-2B',

                ip: 'IP-4X',

                cor: 'RAL 7032'

            };

        }

        if (type === 'ELETROCENTRO') {

            return {

                tensao: '380V',

                comando: '24Vcc',

                ip: 'IP-54',

                instalacao: 'Ao Tempo',

                cor: 'RAL 7035',

                ar_condicionado: 'Sim',

                iluminacao_emergencia: 'Sim'

            };

        }

        return {

            tensao: '380V',

            comando: '24Vcc',

            sistema_eletrico: '',

            tensao_operacao: '',

            corrente_nominal: '',

            frequencia: '60Hz',

            icc: '50kA',

            ip: 'IP-42',

            segregacao: 'Forma 3b',

            execucao: 'Fixa',

            instalacao: 'Abrigada',

            cor: 'RAL 7035',

            norma_teste: 'IEC 61439-1&2'

        };

    },



    removeEquipment(index) {

        const data = store.getState().activeTechnicalProposal;
        if (!data.equipments) return;
        const eq = data.equipments[index];
        if (!eq) return;

        if (eq.type === 'SEU') {
            if (!confirm(`Excluir SEU ${eq.tag} e liberar seus ${(eq.seu_components || []).length} equipamento(s)?`)) return;
            (eq.seu_components || []).forEach(compId => {
                const compEq = data.equipments.find(e => String(e.id) === String(compId));
                if (compEq) this.resetSeuComponentIpi(compEq.tag);
            });
        } else {
            // Verifica se é componente de alguma SEU
            const parentSeu = data.equipments.find(e => e.type === 'SEU' && (e.seu_components || []).includes(String(eq.id)));
            if (parentSeu && !confirm(`Excluir ${eq.tag}? Este equipamento pertence à SEU ${parentSeu.tag}.`)) return;
            if (!parentSeu && !confirm('Excluir este equipamento?')) return;
            // Remove das referências da SEU
            data.equipments.forEach(e => {
                if (e.type === 'SEU' && e.seu_components) {
                    e.seu_components = e.seu_components.filter(id => String(id) !== String(eq.id));
                }
            });
        }

        data.equipments.splice(index, 1);

        this.activeEquipmentIndex = Math.max(0, data.equipments.length - 1);

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },



    renameEquipment(index) {

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[index];

        if (!eq) return;

        const newTag = prompt('Editar TAG do equipamento:', eq.tag);

        if (newTag && newTag.trim()) {

            eq.tag = newTag.trim();

            data.lastActiveEquipmentIndex = index;

            store.setState({ activeTechnicalProposal: data });

            this.renderModal(data);

            app.toast(`TAG alterada para ${newTag.trim()}`, 'success');

        }

    },



    renderModal(data) {

        this.viewMode = 'form';

        this.forcedDashboard = false;

        if (!data) {

            console.warn("[PropostaTecnica] renderModal called with null data");

            return;

        }

        

        // Garantir estrutura mínima para propostas legadas ou novas

        if (!data.equipments) data.equipments = [];

        if (!data.scopeItems) data.scopeItems = [];

        if (!data.revisions) data.revisions = [];



        // Auto-inicializar com um equipamento se estiver totalmente vazio

        if (data.equipments.length === 0) {

            data.equipments.push({

                id: Date.now(),

                tag: 'TAG-01',

                type: 'CCM-BT',

                norms: ['nbr_iec_61439', 'nr10'],

                technical: { tensao: '380V', icc: '50kA', ip: 'IP-42' },

                loads: []

            });

            this.activeEquipmentIndex = 0;

        }



        // Garantir que o índice ativo seja válido (prioriza o que está no estado)

        if (data.lastActiveEquipmentIndex !== undefined) {

            this.activeEquipmentIndex = data.lastActiveEquipmentIndex;

        }

        if (typeof this.activeEquipmentIndex !== 'number') this.activeEquipmentIndex = 0;

        if (this.activeEquipmentIndex >= data.equipments.length) this.activeEquipmentIndex = 0;

        

        const activeTab = data.lastActiveTab || this.activeTab || 'geral';

        const activeSubTab = data.lastActiveSubTab || this.activeSubTab || 'technical';

        

        // Sincronizar propriedades locais com o que veio do dado (âncora)

        this.activeTab = activeTab;

        this.activeSubTab = activeSubTab;



        const activeEq = (data.equipments && data.equipments.length > 0) 

            ? data.equipments[this.activeEquipmentIndex] 

            : null;



        const html = `

            <div class="hierarchical-pt-view" style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: white; margin: -20px; position: relative;">

                <!-- Header -->

                <div class="module-header-sticky" style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">

                    <div>

                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">

                            <i class="ph ph-file-text"></i> Proposta Técnica <span style="font-weight: 300; opacity: 0.8;">| ${data.projeto || 'Novo Projeto'}</span>

                        </h2>

                        <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Gerenciamento de Equipamentos e Especificações</div>

                    </div>

                    <div style="display: flex; gap: 10px;">

                        <button class="btn btn-sm btn-ghost" onclick="window.importacaoETModule.open()" style="color: white; border: 1px solid rgba(255,255,255,0.3);" title="Extrair dados de documento técnico com IA"><i class="ph ph-robot"></i> Importar de Documento</button>

                        <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule.closeModal()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-arrow-left"></i> Voltar</button>

                    </div>

                </div>



                <!-- Main Navigation Tabs -->

                <div style="border-bottom:1px solid #e2e8f0;background:white;display:flex;overflow-x:auto;flex-shrink:0;padding:0 20px;">

                    <button type="button" class="tab-btn ${activeTab === 'geral' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('geral')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'geral' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'geral' ? '#16a34a' : '#64748b'};border-bottom:3px solid ${activeTab === 'geral' ? '#16a34a' : 'transparent'};transition:all 0.2s;"><i class="ph ph-identification-card"></i> Dados Gerais</button>

                    <button type="button" class="tab-btn ${activeTab === 'equipments' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('equipments')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'equipments' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'equipments' ? '#16a34a' : '#64748b'};border-bottom:3px solid ${activeTab === 'equipments' ? '#16a34a' : 'transparent'};transition:all 0.2s;"><i class="ph ph-cpu"></i> Equipamentos</button>

                    <button type="button" class="tab-btn ${activeTab === 'escopo' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('escopo')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'escopo' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'escopo' ? '#16a34a' : '#64748b'};border-bottom:3px solid ${activeTab === 'escopo' ? '#16a34a' : 'transparent'};transition:all 0.2s;"><i class="ph ph-list-checks"></i> Escopo</button>

                    <button type="button" class="tab-btn ${activeTab === 'vendor' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('vendor')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'vendor' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'vendor' ? '#16a34a' : '#64748b'};border-bottom:3px solid ${activeTab === 'vendor' ? '#16a34a' : 'transparent'};transition:all 0.2s;"><i class="ph ph-buildings"></i> Vendor List</button>

                    <button type="button" class="tab-btn ${activeTab === 'exclusions' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('exclusions')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'exclusions' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'exclusions' ? '#16a34a' : '#64748b'};border-bottom:3px solid ${activeTab === 'exclusions' ? '#16a34a' : 'transparent'};transition:all 0.2s;"><i class="ph ph-x-circle"></i> Exclusões</button>

                    <button type="button" class="tab-btn ${activeTab === 'revisoes' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('revisoes')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'revisoes' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'revisoes' ? '#16a34a' : '#64748b'};border-bottom:3px solid ${activeTab === 'revisoes' ? '#16a34a' : 'transparent'};transition:all 0.2s;"><i class="ph ph-clock-counter-clockwise"></i> Revisões</button>

                    <button type="button" class="tab-btn ${activeTab === 'assinaturas' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('assinaturas')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'assinaturas' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'assinaturas' ? '#16a34a' : '#64748b'};border-bottom:3px solid ${activeTab === 'assinaturas' ? '#16a34a' : 'transparent'};transition:all 0.2s;"><i class="ph ph-pen-nib"></i> Assinaturas (Rodapé)</button>

                </div>



                <!-- Content Area -->

                <div class="module-body" style="flex: 1; overflow: hidden; background: white; position: relative; display: flex; flex-direction: column;">

                    <form id="form-proposta-tecnica" onsubmit="return false;" style="height: 100%; display: flex; flex-direction: column;">

                        <div style="flex: 1; overflow-y: auto; scrollbar-gutter: stable;">

                            ${activeTab === 'geral' ? this.renderTabGeral(data) : ''}

                            ${activeTab === 'escopo' ? this.renderTabEscopo(data) : ''}

                            ${activeTab === 'equipments' ? this.renderTabEquipments(data, activeEq) : ''}

                            ${activeTab === 'vendor' ? this.renderTabVendorList(data) : ''}

                            ${activeTab === 'exclusions' ? this.renderProposalExclusions(data) : ''}

                            ${activeTab === 'revisoes' ? this.renderTabRevisoes(data) : ''}

                            ${activeTab === 'assinaturas' ? this.renderTabAssinaturas(data) : ''}

                        </div>

                    </form>

                </div>



                <!-- Footer -->

                <div class="module-footer" style="padding: 15px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">

                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-ghost" onclick="window.propostaTecnicaModule.exportToWord()"><i class="ph ph-file-doc"></i> Exportar Word</button>
                    </div>

                    <div style="display: flex; gap: 12px;">

                        <button type="button" class="btn btn-secondary" onclick="window.propostaTecnicaModule.closeModal()">Cancelar</button>

                        <button type="button" class="btn btn-outline" onclick="window.propostaTecnicaModule.saveAsNew()" style="display: flex; align-items: center; gap: 6px;"><i class="ph ph-copy"></i> Salvar como Nova</button>

                        <button type="button" class="btn btn-primary" onclick="window.propostaTecnicaModule.save()" style="background:#16a34a;padding:10px 25px;font-weight:700;border-color:#16a34a;">Salvar Proposta</button>

                    </div>

                </div>

            </div>

        `;

        const container = document.getElementById('view-proposta-tecnica');

        if (container) {

            container.innerHTML = html;

            container.classList.remove('hidden-module');

            // Auto-preenche dados do cliente a partir do nome extraído
            if (data.cliente) this.handleClientChange(data.cliente);



            // Add custom styles for the hierarchical view

            if (!document.getElementById('hierarchical-pt-styles')) {

                const style = document.createElement('style');

                style.id = 'hierarchical-pt-styles';

                style.textContent = `

                    .hierarchical-pt-view .tab-btn:hover { background: #f1f5f9; color: #1e3a8a; }

                    .hierarchical-pt-view .eq-item { transition: all 0.2s; }

                    .hierarchical-pt-view .eq-item:hover { background: #f1f5f9; border-color: #e2e8f0; }

                    .hierarchical-pt-view .eq-item.active { background: #eff6ff; border-color: #3b82f6; }

                    .hierarchical-pt-view .eq-item.active:hover { background: linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%); border-color: #3b82f6; }

                    .hierarchical-pt-view .sub-tab-btn { cursor: pointer; transition: all 0.2s; }

                    .hierarchical-pt-view .sub-tab-btn:hover { color: #16a34a; }

                    .hierarchical-pt-view .sub-tab-btn.active { color: #16a34a; font-weight: 800; }

                    .hierarchical-pt-view .form-label { font-weight: 700; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block; }

                    .hierarchical-pt-view .form-control { border-radius: 8px; border: 1.5px solid #e2e8f0; padding: 10px 14px; font-size: 13px; transition: all 0.2s; }

                    .hierarchical-pt-view .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); outline: none; }

                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                `;

                document.head.appendChild(style);

            }

        }

    },



    renderTabGeral(data) {

        return `

            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Dados Gerais da Proposta</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Informações do cliente e detalhes do projeto</div>
                    </div>
                </div>

                <div class="form-group">

                    <label class="form-label">Cliente</label>

                    <select name="cliente" id="pt_cliente" class="form-control" onchange="app.propostaTecnica.handleClientChange(this.value)">

                        <option value="" disabled ${!data.cliente ? 'selected' : ''}>Selecione um cliente...</option>

                        ${(store.getState().clientes || []).map(c => `

                            <option value="${c.razaoSocial}" ${data.cliente === c.razaoSocial ? 'selected' : ''}>${c.razaoSocial}</option>

                        `).join('')}

                    </select>

                    <div style="margin-top: 5px; font-size: 12px;">

                        <a href="#" onclick="window.returnTo = 'proposta-tecnica'; app.navigateTo('clientes'); return false;" style="color: #3b82f6;">+ Gerenciar Clientes</a>

                    </div>

                </div>



                <div class="grid-form" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: 20px;">

                    <div class="form-group">

                        <label class="form-label">Código da Proposta</label>

                        <div style="display: flex; gap: 8px;">

                            <input type="text" id="pt-prop-codigo" name="codigo" class="form-control" value="${data.codigo || (() => {

                                const dvtFolder = (window.app && window.app.currentDvt && window.app.currentDvt.folder) ? String(window.app.currentDvt.folder) : '';

                                const match = dvtFolder.match(/DVT-\d{4}-\d+/i);

                                const baseDvt = match ? match[0].toUpperCase() : 'DVT-0000-0000';

                                return `${baseDvt}-PT${data.customCodigoSuffix || '_00'}`;

                            })()}" readonly style="background-color: #f1f5f9; font-weight: 500;">

                            <button type="button" class="btn btn-secondary" title="Editar Código" onclick="const el = document.getElementById('pt-prop-codigo'); el.removeAttribute('readonly'); el.style.backgroundColor = 'white'; el.focus();">

                                <i class="ph ph-pencil-simple"></i>

                            </button>

                        </div>

                    </div>

                    <div class="form-group">

                        <label class="form-label">Data de Emissão</label>

                        <input type="date" name="data_emissao" class="form-control" value="${data.data_emissao || new Date().toISOString().split('T')[0]}">

                    </div>

                </div>



                <div class="grid-form" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px;">

                    <div class="form-group">

                        <label class="form-label">Aos Cuidados (A/C)</label>

                        <div id="pt_contact_container">

                            <select name="aos_cuidados" id="pt_aos_cuidados" class="form-control" onchange="app.propostaTecnica.handleContactSelection(this.value)">

                                <option value="">Selecione um cliente primeiro...</option>

                                ${data.cliente ? this.getContactOptionsHTML(data.cliente, data.aos_cuidados) : ''}

                            </select>

                        </div>

                    </div>

                    <div class="form-group">

                        <label class="form-label">E-mail</label>

                        <input type="email" name="email" id="pt_email" class="form-control" value="${data.email || ''}" placeholder="email@exemplo.com" readonly style="background: #f1f5f9; cursor: not-allowed;">

                    </div>

                    <div class="form-group">

                        <label class="form-label">Telefone</label>

                        <input type="text" name="telefone" id="pt_telefone" class="form-control" value="${data.telefone || ''}" placeholder="(00) 00000-0000" readonly style="background: #f1f5f9; cursor: not-allowed;">

                    </div>

                </div>



                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Nome do Projeto / Título</label>

                    <input type="text" name="projeto" class="form-control" value="${data.projeto || (window.app.currentDvt ? window.app.currentDvt.title : '')}" placeholder="Ex: Painel Elétrico de Baixa Tensão - 440V">

                </div>



                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Referência / Subtítulo</label>

                    <input type="text" name="referencia" class="form-control" value="${data.referencia || ''}" placeholder="Ex: CCM para Projeto Aumento do Mix de Açúcar">

                </div>



                <div class="grid-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">

                    <div class="form-group">

                        <label class="form-label">Objeto do Fornecimento</label>

                        <input type="text" name="objeto" class="form-control" value="${data.objeto || 'FORNECIMENTO DE PAIN�?�?�IS EL�?�?�TRICOS'}">

                    </div>

                    <div class="form-group">

                        <label class="form-label">Localização (Cidade/Estado)</label>

                        <input type="text" name="localizacao" id="pt_localizacao" class="form-control" value="${data.localizacao || ''}" placeholder="Ex: SERT�?�?OZINHO/SP">

                    </div>

                </div>



                <!-- Image Uploads Row -->

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #e2e8f0;">

                    <!-- Company Header Logo -->

                    <div class="form-group">

                        <label class="form-label">Cabeçalho (Logo Drivetech)</label>

                        <div style="display: flex; flex-direction: column; gap: 10px;">

                            <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center;">

                                <i class="ph ph-upload-simple"></i> Alterar Header

                                <input type="file" id="pt_logo_input" accept="image/png,image/jpeg" style="display: none;" onchange="app.propostaTecnica.handleLogoUpload(this)">

                            </label>

                            <div id="pt_logo_preview_container" style="display: ${data.logo_base64 ? 'block' : 'none'}; text-align: center;">

                                <img id="pt_logo_preview" src="${data.logo_base64 || ''}" style="max-height: 60px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px;">

                                <input type="hidden" id="pt_logo_base64" name="logo_base64" value="${data.logo_base64 || ''}">

                            </div>

                        </div>

                    </div>



                    <!-- Client Logo -->

                    <div class="form-group">

                        <label class="form-label">Logo do Cliente (Centro)</label>

                        <div style="display: flex; flex-direction: column; gap: 10px;">

                            <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center;">

                                <i class="ph ph-user-circle"></i> Escolher Logo Cliente

                                <input type="file" id="pt_client_logo_input" accept="image/png,image/jpeg" style="display: none;" onchange="app.propostaTecnica.handleClientLogoUpload(this)">

                            </label>

                            <div id="pt_client_logo_preview_container" style="display: ${data.client_logo_base64 ? 'block' : 'none'}; text-align: center;">

                                <img id="pt_client_logo_preview" src="${data.client_logo_base64 || ''}" style="max-height: 60px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px;">

                                <input type="hidden" id="pt_client_logo_base64" name="client_logo_base64" value="${data.client_logo_base64 || ''}">

                            </div>

                        </div>

                    </div>

                </div>



                <!-- Watermark Upload -->

                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Marca D'água (Fundo)</label>

                    <div style="display: flex; flex-direction: column; gap: 10px;">

                        <label class="btn btn-secondary btn-sm" style="cursor: pointer; width: 100%; text-align: center;">

                                <i class="ph ph-image"></i> Escolher Marca D'água

                                <input type="file" id="pt_watermark_input" accept="image/png,image/jpeg" style="display: none;" onchange="app.propostaTecnica.handleWatermarkUpload(this)">

                            </label>

                            <div id="pt_watermark_preview_container" style="display: ${data.watermark_base64 ? 'block' : 'none'}; text-align: center;">

                                <img id="pt_watermark_preview" src="${data.watermark_base64 || ''}" style="max-height: 60px; max-width: 100%; border: 1px solid #e2e8f0; padding: 4px; border-radius: 4px; opacity: 0.5;">

                                <input type="hidden" id="pt_watermark_base64" name="watermark_base64" value="${data.watermark_base64 || ''}">

                            </div>

                    </div>

                </div>

            </div>

        `;

    },

    renderTabEscopo(data) {
        const items = data.scopeItems || [];
        const autoItems = items.filter(it => it.auto);
        const manualItems = items.filter(it => !it.auto);

        return `
            <div style="padding: 40px; max-width: 1200px; margin: 0 auto; animation: fadeIn 0.3s ease;">

                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Escopo do Fornecimento</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                            Itens que compõem o escopo técnico-comercial da proposta
                            <span style="display: inline-flex; align-items: center; gap: 6px; margin-left: 12px;">
                                <span style="display: inline-block; width: 10px; height: 10px; background: #f0f9ff; border: 1px solid #93c5fd; border-radius: 3px;"></span> DVT
                                <span style="display: inline-block; width: 10px; height: 10px; background: #fefce8; border: 1px solid #fde68a; border-radius: 3px;"></span> Cliente
                            </span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.syncScopeFromEquipments()" style="white-space: nowrap;">
                            <i class="ph ph-arrows-clockwise"></i> Sincronizar do Equipamento
                        </button>
                        <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica.addScopeItem()" style="white-space: nowrap;">
                            <i class="ph ph-plus"></i> Adicionar Item
                        </button>
                    </div>
                </div>

                ${autoItems.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h5 style="font-size: 13px; color: #475569; font-weight: 800; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-cpu" style="font-size: 16px;"></i> Itens do Equipamento
                        </h5>
                        ${autoItems.map((item, i) => `
                            <div class="scope-row" data-auto="1" data-equip-tag="${item.equipTag || ''}" ${item.isSeu ? 'data-is-seu="1"' : ''} ${item.isSeuComp ? 'data-is-seu-comp="1" data-parent-seu="' + (item.parentSeu || '') + '"' : ''}
                                 style="display: flex; align-items: center; gap: 12px; padding: ${item.isSeuComp ? '10px 12px 10px 36px' : '12px'}; background: ${item.isSeu ? '#fffbeb' : (item.isSeuComp ? '#f8fafc' : '#f8fafc')}; border: 1px solid ${item.isSeu ? '#fde68a' : '#e2e8f0'}; border-left: 4px solid ${item.isSeu ? '#f59e0b' : (item.isSeuComp ? '#fde68a' : 'transparent')}; border-radius: 8px; margin-bottom: 4px;">
                                <i class="ph ${item.isSeu ? 'ph-lightning-slash' : (item.isSeuComp ? 'ph-dot' : 'ph-cpu')}" style="color: ${item.isSeu ? '#92400e' : '#94a3b8'}; font-size: 16px; flex-shrink: 0;"></i>
                                <div style="flex: 1;">
                                    <input type="text" name="scope_desc" class="form-control" value="${item.desc}" style="background: #f1f5f9; cursor: default;${item.isSeu ? ' font-weight:700;color:#92400e;' : ''}" readonly>
                                </div>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_dvt" ${item.dvt ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6;">
                                    DVT
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_cli" ${item.cli ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #f59e0b;">
                                    Cliente
                                </label>
                                <span style="font-size: 10px; background: ${item.isSeu ? '#fef3c7' : '#e2e8f0'}; color: ${item.isSeu ? '#92400e' : '#64748b'}; padding: 2px 8px; border-radius: 10px; white-space: nowrap;">${item.equipTag || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div>
                    <h5 style="font-size: 13px; color: #475569; font-weight: 800; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-pencil-simple" style="font-size: 16px;"></i> Itens Adicionais
                    </h5>
                    ${manualItems.length === 0 && autoItems.length === 0 ? `
                        <div style="padding: 40px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                            <i class="ph ph-list-dashes" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i>
                            <br>Nenhum item de escopo cadastrado.
                            <br>Clique em "Sincronizar do Equipamento" ou "Adicionar Item".
                        </div>
                    ` : manualItems.length === 0 ? `
                        <div style="padding: 20px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 8px;">
                            Clique em "Adicionar Item" para incluir itens manuais.
                        </div>
                    ` : `
                        ${manualItems.map((item, i) => `
                            <div class="scope-row" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px;">
                                <i class="ph ph-list-bullets" style="color: #94a3b8; font-size: 16px; flex-shrink: 0;"></i>
                                <div style="flex: 1;">
                                    <input type="text" name="scope_desc" class="form-control" value="${item.desc}" placeholder="Descreva o item do escopo...">
                                </div>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_dvt" ${item.dvt ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6;">
                                    DVT
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_cli" ${item.cli ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #f59e0b;">
                                    Cliente
                                </label>
                                <button type="button" class="btn-icon" style="color: #ef4444; flex-shrink: 0;" onclick="app.propostaTecnica.removeScopeItem(${i})" title="Remover item"><i class="ph ph-trash"></i></button>
                            </div>
                        `).join('')}
                    `}
                </div>

            </div>
        `;
    },

    syncScopeFromEquipments() {
        const data = store.getState().activeTechnicalProposal;
        if (!data || !data.equipments) return;

        const manualItems = (data.scopeItems || []).filter(it => !it.auto);

        // Coletar IDs de componentes de SEU
        const seuComponentIds = new Set();
        data.equipments.filter(e => e.type === 'SEU').forEach(seu => {
            (seu.seu_components || []).forEach(id => seuComponentIds.add(String(id)));
        });

        const autoItems = [];
        data.equipments.forEach(eq => {
            if (eq.type === 'SEU') {
                // Item container da SEU
                autoItems.push({
                    desc: `Subestação ${eq.tag} — ${(eq.seu_components || []).length} equipamento(s)`,
                    dvt: false,
                    cli: false,
                    auto: true,
                    equipTag: eq.tag,
                    isSeu: true,
                    isSeuComp: false,
                    parentSeu: ''
                });
                // Itens dos componentes
                (eq.seu_components || []).forEach(compId => {
                    const comp = data.equipments.find(e => String(e.id) === String(compId));
                    if (comp) {
                        autoItems.push({
                            desc: `Fornecimento de ${comp.tag} - ${comp.type}`,
                            dvt: false,
                            cli: false,
                            auto: true,
                            equipTag: comp.tag,
                            isSeu: false,
                            isSeuComp: true,
                            parentSeu: eq.tag
                        });
                    }
                });
            } else if (!seuComponentIds.has(String(eq.id))) {
                // Equipamento avulso (não pertence a nenhuma SEU)
                autoItems.push({
                    desc: `Fornecimento de - ${eq.tag}`,
                    dvt: false,
                    cli: false,
                    auto: true,
                    equipTag: eq.tag,
                    isSeu: false,
                    isSeuComp: false,
                    parentSeu: ''
                });
            }
        });

        data.scopeItems = [...autoItems, ...manualItems];
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
        app.toast(`Escopo sincronizado: ${autoItems.length} itens de equipamento(s).`, 'success');
    },

    addScopeItem() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        if (!data.scopeItems) data.scopeItems = [];

        data.scopeItems.push({
            desc: '',
            dvt: false,
            cli: false,
            auto: false,
            equipTag: ''
        });

        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeScopeItem(index) {
        const data = store.getState().activeTechnicalProposal;
        if (!data || !data.scopeItems) return;

        const manualItems = data.scopeItems.filter(it => !it.auto);
        if (index < 0 || index >= manualItems.length) return;

        const removed = manualItems[index];
        const allItems = data.scopeItems;
        const idx = allItems.indexOf(removed);
        if (idx !== -1) {
            allItems.splice(idx, 1);
        }

        data.scopeItems = allItems;
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },



    renderTabEquipments(data, activeEq) {
        const eq = activeEq;
        const isMT = eq && eq.type === 'CUB-MT';
        const isTrMt = eq && eq.type === 'TR-MT';
        const subTab = this.activeSubTab;

        // Determine available sub-tabs based on equipment type
        const allSubTabs = ['technical', 'norms', 'loads', 'enclosures', 'busbars', 'deviations', 'labor', 'expenses', 'eletrocentro', 'calc_eletrico', 'calc_mecanico'];
        const trMtSubTabs = ['technical', 'norms', 'deviations', 'expenses'];
        const eletrocentroSubTabs = ['eletrocentro', 'norms', 'deviations', 'labor', 'expenses', 'calc_mecanico'];
        const seuSubTabs = ['technical', 'deviations', 'expenses'];
        const subTabs = isTrMt ? trMtSubTabs : (eq.type === 'SEU' ? seuSubTabs : (eq.type === 'ELETROCENTRO' ? eletrocentroSubTabs : allSubTabs));

        function getBadge(type) {
            const map = {
                'TR-MT':        { bg: '#fef3c7', color: '#92400e', label: 'TR-MT' },
                'SEU':          { bg: '#fefce8', color: '#78350f', label: 'SEU' },
                'CCM-BT':       { bg: '#dcfce7', color: '#166534', label: 'CCM-BT' },
                'QGBT':         { bg: '#dcfce7', color: '#166534', label: 'QGBT' },
                'CUB-MT':       { bg: '#fef3c7', color: '#92400e', label: 'CUB-MT' },
                'ELETROCENTRO': { bg: '#e0f2fe', color: '#075985', label: 'ELETROCENTRO' },
                'QTA':          { bg: '#dcfce7', color: '#166534', label: 'QTA' },
                'PLC':          { bg: '#ede9fe', color: '#5b21b6', label: 'PLC' },
                'BC':           { bg: '#fce7f3', color: '#9d174d', label: 'BC' },
                'REM':          { bg: '#ede9fe', color: '#5b21b6', label: 'REM' },
                'PNC':          { bg: '#dcfce7', color: '#166534', label: 'PNC' },
                'QDL':          { bg: '#dcfce7', color: '#166534', label: 'QDL' },
                'QDF':          { bg: '#dcfce7', color: '#166534', label: 'QDF' }
            };
            const m = map[type] || { bg: '#f1f5f9', color: '#64748b', label: type };
            return `<span style="background:${m.bg};color:${m.color};padding:4px 10px;border-radius:20px;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;white-space:nowrap;">${m.label}</span>`;
        }

        // Sidebar HTML — hierarchical: SEUs as containers with children, then standalone items
        if (!this._seuExpanded) this._seuExpanded = new Set();
        const seuComponentIds = new Set();
        const seus = data.equipments.filter(e => e.type === 'SEU');
        seus.forEach(seu => {
            (seu.seu_components || []).forEach(id => seuComponentIds.add(String(id)));
        });

        let sidebarItemsHtml = '';
        // Render SEUs with their children
        seus.forEach((seu, si) => {
            const seuIdx = data.equipments.indexOf(seu);
            const seuActive = seuIdx === this.activeEquipmentIndex;
            const expanded = this._seuExpanded.has(seu.id);
            const comps = (seu.seu_components || [])
                .map(id => ({ id, eq: data.equipments.find(e => String(e.id) === String(id)) }))
                .filter(c => c.eq);
            const anyCompActive = comps.some(c => data.equipments.indexOf(c.eq) === this.activeEquipmentIndex);

            sidebarItemsHtml += `
                <div style="border-bottom: 1px solid ${anyCompActive ? '#f1f5f9' : 'transparent'};">
                    <div class="eq-item ${seuActive ? 'active' : ''}"
                         onclick="window.propostaTecnicaModule.switchEquipment(${seuIdx})"
                         style="padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 6px;
                                font-weight: ${seuActive ? '700' : '500'};
                                color: ${seuActive ? '#1e40af' : '#475569'};
                                border-left: 4px solid ${seuActive ? '#3b82f6' : 'transparent'};
                                background: ${seuActive ? '#eff6ff' : 'transparent'};
                                transition: all 0.2s;">
                        <span onclick="event.stopPropagation(); window.propostaTecnicaModule.toggleSeuExpand(${seu.id})"
                              style="cursor:pointer;font-size:10px;width:14px;text-align:center;flex-shrink:0;user-select:none;color:#94a3b8;">
                            ${expanded ? '▼' : '▶'}
                        </span>
                        <i class="ph ph-lightning-slash" style="font-size: 18px; opacity: ${seuActive ? '1' : '0.4'}; flex-shrink: 0; color: #92400e;"></i>
                        <div style="flex: 1; min-width: 0;">
                            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; font-weight: ${seuActive ? '700' : '600'};">
                                ${seu.tag || 'Sem TAG'}
                            </div>
                            <div style="margin-top: 2px;">${getBadge(seu.type)}</div>
                        </div>
                        <div style="display: flex; gap: 2px; flex-shrink: 0;">
                            <button type="button" onclick="event.stopPropagation(); window.propostaTecnicaModule.renameEquipment(${seuIdx})"
                                    style="border: none; background: transparent; color: #64748b; cursor: pointer; padding: 2px; border-radius: 3px; line-height: 1;"
                                    title="Editar TAG">
                                <i class="ph ph-pencil-simple" style="font-size: 14px;"></i>
                            </button>
                            <button type="button" onclick="event.stopPropagation(); window.propostaTecnicaModule.removeEquipment(${seuIdx})"
                                    style="border: none; background: transparent; color: #ef4444; cursor: pointer; padding: 2px; border-radius: 3px; line-height: 1;"
                                    title="Excluir SEU">
                                <i class="ph ph-trash" style="font-size: 14px;"></i>
                            </button>
                        </div>
                    </div>
                    ${expanded ? comps.map(c => {
                        const compIdx = data.equipments.indexOf(c.eq);
                        const compActive = compIdx === this.activeEquipmentIndex;
                        return `
                            <div class="eq-item ${compActive ? 'active' : ''}"
                                 onclick="window.propostaTecnicaModule.switchEquipment(${compIdx})"
                                 style="padding: 8px 12px 8px 36px; cursor: pointer; display: flex; align-items: center; gap: 6px;
                                        font-weight: ${compActive ? '700' : '400'};
                                        color: ${compActive ? '#1e40af' : '#64748b'};
                                        border-left: 4px solid ${compActive ? '#93c5fd' : 'transparent'};
                                        background: ${compActive ? '#f0f7ff' : 'transparent'};
                                        font-size: 12px; transition: all 0.2s;">
                                <i class="ph ph-dot" style="font-size: 14px; flex-shrink: 0; color: #94a3b8;"></i>
                                <div style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${c.eq.tag || 'Sem TAG'}
                                </div>
                                <span style="flex-shrink: 0;">${getBadge(c.eq.type)}</span>
                            </div>
                        `;
                    }).join('') : ''}
                </div>
            `;
        });

        // Render standalone items (non-SEU, non-component)
        data.equipments.forEach((e, idx) => {
            if (e.type === 'SEU' || seuComponentIds.has(String(e.id))) return;
            const active = idx === this.activeEquipmentIndex;
            sidebarItemsHtml += `
                <div class="eq-item ${active ? 'active' : ''}"
                     onclick="window.propostaTecnicaModule.switchEquipment(${idx})"
                     style="padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px;
                            font-weight: ${active ? '700' : '500'};
                            color: ${active ? '#1e40af' : '#475569'};
                            border-left: 4px solid ${active ? '#3b82f6' : 'transparent'};
                            background: ${active ? '#eff6ff' : 'transparent'};
                            transition: all 0.2s;">
                    <i class="ph ph-cpu" style="font-size: 18px; opacity: ${active ? '1' : '0.4'}; flex-shrink: 0;"></i>
                    <div style="flex: 1; min-width: 0;">
                        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; font-weight: ${active ? '700' : '600'};">
                            ${e.tag || 'Sem TAG'}
                        </div>
                        <div style="margin-top: 2px;">${getBadge(e.type)}</div>
                    </div>
                    <div style="display: flex; gap: 2px; flex-shrink: 0;">
                        <button type="button" onclick="event.stopPropagation(); window.propostaTecnicaModule.renameEquipment(${idx})"
                                style="border: none; background: transparent; color: #64748b; cursor: pointer; padding: 2px; border-radius: 3px; line-height: 1;"
                                title="Editar TAG">
                            <i class="ph ph-pencil-simple" style="font-size: 14px;"></i>
                        </button>
                        <button type="button" onclick="event.stopPropagation(); window.propostaTecnicaModule.removeEquipment(${idx})"
                                style="border: none; background: transparent; color: #ef4444; cursor: pointer; padding: 2px; border-radius: 3px; line-height: 1;"
                                title="Excluir equipamento">
                            <i class="ph ph-trash" style="font-size: 14px;"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        const sidebarHtml = `
            <div style="width: 260px; background: #f8fafc; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; flex-shrink: 0;">
                <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">
                        <i class="ph ph-cpu" style="margin-right: 6px;"></i> Equipamentos
                    </h3>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 8px 0;">
                    ${sidebarItemsHtml}
                </div>
                <div style="padding: 12px; border-top: 1px solid #e2e8f0; background: white;">
                    <button type="button" class="btn btn-primary" onclick="app.propostaTecnica.addEquipment()" style="width: 100%; justify-content: center; gap: 6px; font-size: 12px;">
                        <i class="ph ph-plus-circle"></i> Acrescentar Novo Equipamento
                    </button>
                </div>
            </div>
        `;

        // Sub-tab navigation HTML
        const navHtml = `
            <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: white; overflow-x: auto; flex-shrink: 0;">
                ${subTabs.map(t => `
                    <button class="sub-tab-btn ${subTab === t ? 'active' : ''}"
                            onclick="window.propostaTecnicaModule.switchSubTab('${t}')"
                            style="padding: 12px 12px; font-size: 12px; font-weight: ${subTab === t ? '800' : '600'};
                                   color: ${subTab === t ? '#16a34a' : '#64748b'};
                                   border: none; background: ${subTab === t ? 'white' : 'transparent'};
                                   cursor: pointer; white-space: nowrap;
                                   border-bottom: 3px solid ${subTab === t ? '#16a34a' : 'transparent'};
                                   transition: all 0.2s;">
                        <i class="ph ${{
                            'technical': 'ph-notebook',
                            'norms': 'ph-book',
                            'loads': 'ph-list-checks',
                            'enclosures': 'ph-squares-four',
                            'busbars': 'ph-lightning',
                            'exclusions': 'ph-x-circle',
                            'deviations': 'ph-warning',
                            'labor': 'ph-wrench',
                            'expenses': 'ph-currency-dollar',
                            'eletrocentro': 'ph-buildings',
                            'calc_eletrico': 'ph-chart-bar',
                            'calc_mecanico': 'ph-gear-six'
                        }[t] || 'ph-circle'}" style="margin-right: 6px;"></i>
                        ${this.getSubTabLabel(t)}
                    </button>
                `).join('')}
            </div>
        `;

        // Sub-tab content
        let contentHtml = '';

        if (subTab === 'technical') {

            const customCharacteristics = eq.customCharacteristics || [];

            contentHtml = `
                <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Ficha Técnica: ${eq.tag}</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Configure as características técnicas do equipamento</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addCustomCharacteristic(${eq.id})" style="white-space: nowrap;">+ Inserir Característica</button>
                </div>
                <div style="padding: 6px 24px; animation: fadeIn 0.3s ease; max-height: 440px; overflow-y: auto;">

                        <input type="hidden" name="eq_tag" value="${eq.tag || ''}">
                        <input type="hidden" name="eq_type" value="${eq.type || ''}">

                        ${eq.type === 'SEU' ? `
                            <div style="max-width: 600px;">
                                <div style="margin-bottom: 20px;">
                                    <label class="form-label">Tensão Primária</label>
                                    <select name="seu_tensao_primaria" class="form-control" onchange="app.propostaTecnica.toggleSeuTensaoOutro(this)">
                                        <option value="">Selecione...</option>
                                        ${['6,0kV', '6,9kV', '11,9kV', '13,8kV', '22kV', '34,5kV', 'Outro'].map(v =>
                                            `<option value="${v}" ${eq.technical?.tensao_primaria === v ? 'selected' : ''}>${v}</option>`
                                        ).join('')}
                                    </select>
                                    <div class="form-group" id="seu_tensao_primaria_outro_wrap" style="margin-top:8px;${eq.technical?.tensao_primaria === 'Outro' || (!eq.technical?.tensao_primaria || !['6,0kV','6,9kV','11,9kV','13,8kV','22kV','34,5kV'].includes(eq.technical?.tensao_primaria)) ? '' : 'display:none'}">
                                        <input type="text" name="seu_tensao_primaria_outro" class="form-control" placeholder="Especifique a tensão..." value="${eq.technical?.tensao_primaria_outro || eq.technical?.tensao_primaria || ''}">
                                    </div>
                                </div>

                                <div style="margin-bottom: 16px;">
                                    <label class="form-label" style="font-weight:700;color:#1e3a8a;">Equipamentos da SEU</label>
                                    <div style="font-size:12px;color:#64748b;margin-bottom:8px;">${(eq.seu_components || []).length} equipamento(s) vinculado(s)</div>
                                    <div id="seu-components-container" style="border:1px solid #e2e8f0;border-radius:8px;padding:8px;max-height:260px;overflow-y:auto;">
                                        ${(() => {
                                            const comps = (eq.seu_components || []).map(id => data.equipments.find(e => String(e.id) === String(id))).filter(Boolean);
                                            if (comps.length === 0) return '<div style="padding:20px;text-align:center;color:#94a3b8;">Nenhum equipamento vinculado a esta SEU.</div>';
                                            return comps.map(ce => {
                                                const badge = (() => {
                                                    const map = {'TR-MT':{bg:'#fef3c7',color:'#92400e',l:'TR-MT'},'CCM-BT':{bg:'#dcfce7',color:'#166534',l:'CCM-BT'},'QGBT':{bg:'#dcfce7',color:'#166534',l:'QGBT'},'CUB-MT':{bg:'#fef3c7',color:'#92400e',l:'CUB-MT'},'ELETROCENTRO':{bg:'#e0f2fe',color:'#075985',l:'ELETROCENTRO'},'QTA':{bg:'#dcfce7',color:'#166534',l:'QTA'},'PLC':{bg:'#ede9fe',color:'#5b21b6',l:'PLC'},'BC':{bg:'#fce7f3',color:'#9d174d',l:'BC'},'REM':{bg:'#ede9fe',color:'#5b21b6',l:'REM'},'PNC':{bg:'#dcfce7',color:'#166534',l:'PNC'},'QDL':{bg:'#dcfce7',color:'#166534',l:'QDL'},'QDF':{bg:'#dcfce7',color:'#166534',l:'QDF'}};
                                                    const m = map[ce.type] || {bg:'#f1f5f9',color:'#64748b',l:ce.type};
                                                    return '<span style="background:'+m.bg+';color:'+m.color+';padding:2px 8px;border-radius:10px;font-weight:700;font-size:10px;">'+m.l+'</span>';
                                                })();
                                                return `
                                                    <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;margin-bottom:4px;background:#f8fafc;">
                                                        <i class="ph ph-dot" style="font-size:14px;color:#94a3b8;flex-shrink:0;"></i>
                                                        <span style="flex:1;font-size:13px;font-weight:600;">${ce.tag}</span>
                                                        ${badge}
                                                        <button type="button" onclick="app.propostaTecnica.removeSeuComponent(${eq.id}, ${ce.id})" style="border:none;background:transparent;color:#ef4444;cursor:pointer;padding:2px;line-height:1;font-size:14px;" title="Remover da SEU"><i class="ph ph-x"></i></button>
                                                    </div>
                                                `;
                                            }).join('');
                                        })()}
                                    </div>
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addSeuComponent(${eq.id})" style="margin-top:10px;"><i class="ph ph-plus"></i> Adicionar Componente</button>
                                    <button type="button" class="btn btn-sm" style="background:#dc2626;color:white;border:none;border-radius:4px;padding:6px 12px;font-size:11px;margin-top:10px;margin-left:8px;" onclick="app.propostaTecnica.undoSeu(${eq.id})"><i class="ph ph-x-circle"></i> Desfazer SEU</button>
                                </div>
                            </div>
                        ` : isMT ? `

                            ${this.renderDSGroup('Tensão Nominal', 'tensao', eq.technical?.tensao, ['4,16KV', '6,0KV', '6,9KV', '13,8KV'])}

                            ${this.renderDSGroup('Tensão Máxima', 'tensao_max', eq.technical?.tensao_max, ['7,2KV', '15KV', '17,5KV', '24,2KV'])}

                            ${this.renderDSGroup('Frequência', 'frequencia', eq.technical?.frequencia, ['60Hz', '50Hz'])}

                            ${this.renderDSGroup('Corrente Nominal', 'corrente_nominal', eq.technical?.corrente_nominal, ['630A', '1250A', '2000A', '2500A', '3150A', '4000A'])}

                            ${this.renderDSGroup('Icc (Curto-Circuito)', 'icc', eq.technical?.icc, ['16KA', '20KA', '25KA', '31,5KA', '40KA'])}

                            ${this.renderDSGroup('Icc Dinâmico (Icp)', 'icp', eq.technical?.icp, ['40KAp', '50KAp', '63KAp', '80KAp', '100KAp'])}

                            ${this.renderDSGroup('Nível Isolamento (NBI)', 'nbi', eq.technical?.nbi, ['60KV', '75KV', '95KV', '110KV', '125KV'])}

                            ${this.renderDSGroup('Tensão Suportável', 'suportabilidade', eq.technical?.suportabilidade, ['20KV', '28KV', '34KV', '38KV', '50KV'])}

                            ${this.renderDSGroup('Classificação Arco (IAC)', 'iac', eq.technical?.iac, ['IAC AFLR', 'IAC AFL', 'IAC A'])}

                            ${this.renderDSGroup('Corrente de Arco / Tempo', 'iac_tempo', eq.technical?.iac_tempo, ['16KA / 1s', '20KA / 1s', '25KA / 1s', '31,5KA / 1s'])}

                            ${this.renderDSGroup('Continuidade Perda (LSC)', 'lsc', eq.technical?.lsc, ['LSC2B', 'LSC2A', 'LSC1'])}

                            ${this.renderDSGroup('Classe de Partição', 'particao', eq.technical?.particao, ['PM', 'PI'])}

                            ${this.renderDSGroup('Altitude de Instalação', 'altitude', eq.technical?.altitude, ['1000m', '2000m', 'Outro'])}

                            ${this.renderDSGroup('Grau de Proteção', 'ip', eq.technical?.ip, ['IP4X', 'IP54', 'IP55', 'IP65'])}

                            ${this.renderDSGroup('Cor da Pintura Externa', 'cor_externa', eq.technical?.cor_externa, ['RAL 7032', 'RAL 7035', 'Munsell N-6,5'])}

                            ${this.renderDSGroup('Monitoramento de Arco', 'monitoramento_arco_eq', eq.technical?.monitoramento_arco_eq, ['Vamp 121', 'Vamp 125', 'Vamp 321', 'Arctiq', 'Não'])}

                            ${this.renderDSGroup('Iluminação Interna', 'iluminacao', eq.technical?.iluminacao, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tomada de Serviço', 'tomada', eq.technical?.tomada, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Termostato', 'termostato', eq.technical?.termostato, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tratamento Barramento', 'barramento_tratamento', eq.technical?.barramento_tratamento, ['Cobre Nú', 'Termoretrátil', 'Prateado nas Conexões', 'Estanhado'])}

                        ` : eq.type === 'TR-MT' ? `

                            ${this.renderDSGroup('Tipo', 'tipo', eq.technical?.tipo, ['Trifásico Seco', 'Outro'])}

                            ${this.renderDSGroup('Potência', 'potencia', eq.technical?.potencia, ['500kVA', '750kVA', '1000kVA', '1500kVA', '2000kVA', '2500kVA', '3000kVA', 'Outro'])}

                            ${this.renderDSGroup('Material do Enrolamento', 'enrolamento', eq.technical?.enrolamento, ['Alumínio', 'Cobre', 'Outro'])}

                            ${this.renderDSGroup('Tensão Primária', 'tensao_primaria', eq.technical?.tensao_primaria, ['6,0kV', '6,9kV', '11,9kV', '13,8kV', '22kV', '34,5kV', 'Outro'])}

                            ${this.renderDSGroup('Tensão Secundária', 'tensao_secundaria', eq.technical?.tensao_secundaria, ['220V', '380V', '440-254V', '480V', '690V', 'Outro'])}

                            ${this.renderDSGroup('Ligação Primária', 'ligacao_primaria', eq.technical?.ligacao_primaria, ['Triângulo Δ (delta)', 'Estrela Y', 'Zig-Zag', 'Outro'])}

                            ${this.renderDSGroup('Ligação Secundária', 'ligacao_secundaria', eq.technical?.ligacao_secundaria, ['Estrela Y', 'Triângulo Δ (delta)', 'Zig-Zag', 'Outro'])}

                            ${this.renderDSGroup('Grupo de Ligação', 'grupo_ligacao', eq.technical?.grupo_ligacao, ['Dyn1', 'Dyn11', 'Dd0', 'Yyn0', 'Yd1', 'Yd11', 'Outro'])}

                            ${this.renderDSGroup('Frequência', 'frequencia', eq.technical?.frequencia, ['60Hz', '50Hz'])}

                            ${this.renderDSGroup('Fator K', 'fator_k', eq.technical?.fator_k, ['1', '4', '7', '9', '13', '20', 'Outro'])}

                            ${this.renderDSGroup('Classe', 'classe', eq.technical?.classe, ['15kV', '24kV', '36kV', '72,5kV', 'Outro'])}

                            ${this.renderDSGroup('Grau de Proteção', 'ip', eq.technical?.ip, ['IP-00', 'IP-21', 'IP-23', 'IP-44', 'IP-54', 'IP-55', 'Outro'])}

                            ${this.renderDSGroup('Classe de Temperatura', 'classe_temperatura', eq.technical?.classe_temperatura, ['F', 'H', 'B', 'A', 'Outro'])}

                            ${this.renderDSGroup('Instalação', 'instalacao', eq.technical?.instalacao, ['Abrigado', 'Ao Tempo', 'Outro'])}

                            ${this.renderDSGroup('Nível Básico de Impulso (NBI)', 'nbi', eq.technical?.nbi, ['60kV', '75kV', '95kV', '110kV', '125kV', '150kV', 'Outro'])}

                            ${this.renderDSGroup('Tipo de Resfriamento', 'resfriamento', eq.technical?.resfriamento, ['Ar Natural (ONAN)', 'Ar Forçado (ONAF)', 'Outro'])}

                            ${this.renderDSGroup('Acessórios', 'acessorios', eq.technical?.acessorios, ['Controlador de temperatura microprocessado com PT100', 'Comutador de Derivação (Tap)', 'Relé de Proteção Interna', 'Sensor de Temperatura', 'Painel de Comando', 'Outro'])}

                            ${this.renderDSGroup('Fabricante', 'fabricante', eq.technical?.fabricante, ['WEG', 'Tamura', 'Eaton', 'Siemens', 'ABB', 'Trafo', 'Outro'])}

                        ` : `

                            ${eq.type !== 'ELETROCENTRO' ? this.renderDSGroup('Tensão de Operação', 'tensao_operacao', eq.technical?.tensao_operacao, ['690V', '480V', '440V', '380V', '220V']) : ''}

                            ${eq.type !== 'ELETROCENTRO' ? this.renderDSGroup('Sistema Elétrico', 'sistema_eletrico', eq.technical?.sistema_eletrico, ['Monofásico (1F+N+T)', 'Bifásico (2F+N+T)', 'Trifásico (3F+N+T)', 'Trifásico (3F+T)']) : ''}

                            ${eq.type !== 'ELETROCENTRO' ? this.renderDSGroup('Corrente Nominal', 'corrente_nominal', eq.technical?.corrente_nominal, ['50A', '63A', '80A', '100A', '125A', '160A', '200A', '250A', '300A', '400A', '500A', '630A', '800A', '1000A', '1250A', '1500A', '1600A', '1800A', '2000A', '2500A', '3000A', '3200A', '4000A', '5000A', '6300A']) : ''}

                            ${this.renderDSGroup('Tensão de Comando', 'comando', eq.technical?.comando, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte de Comando', 'comando_fonte', eq.technical?.comando_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Tensão Serv. Auxiliares', 'auxiliar', eq.technical?.auxiliar, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte Serv. Auxiliares', 'auxiliar_fonte', eq.technical?.auxiliar_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Frequência', 'frequencia', eq.technical?.frequencia, ['60Hz', '50Hz'])}

                            ${this.renderDSGroup('Capacidade Curto (Icc)', 'icc', eq.technical?.icc, ['10kA', '16kA', '25kA', '31,5kA', '35kA', '40kA', '50kA', '65kA', '85kA', '100kA'])}

                            ${this.renderDSGroup('Coordenação Proteção', 'coordenacao', eq.technical?.coordenacao, ['Tipo 1', 'Tipo 2'])}

                            ${this.renderDSGroup('Tipo de Execução', 'execucao', eq.technical?.execucao, ['Fixa', 'Extraível', 'Plug-in'])}

                            ${this.renderDSGroup('Tipo de Montagem', 'montagem', eq.technical?.montagem, ['Em Linha', 'Back to Back'])}

                            ${this.renderDSGroup('Local Instalação', 'instalacao', eq.technical?.instalacao, ['Abrigada', 'Tempo'])}

                            ${this.renderDSGroup('Grau de Proteção', 'ip', eq.technical?.ip, ['IP20', 'IP42', 'IP44', 'IP54', 'IP55', 'IP65', 'IP66'])}

                            ${this.renderDSGroup('Cor Pintura Externa', 'cor_externa', eq.technical?.cor_externa, ['RAL 7032', 'RAL 7035', 'Munsell N-6,5'])}

                            ${this.renderDSGroup('Espessura Pintura', 'camada_pintura', eq.technical?.camada_pintura, ['80 um', '90 um', '100 um'])}

                            ${this.renderDSGroup('Placas de Montagem', 'placa_montagem', eq.technical?.placa_montagem, ['RAL 2003', 'RAL 7032', 'Galvanizada'])}

                            ${this.renderDSGroup('Forma de Segregação', 'segregacao', eq.technical?.segregacao, ['Forma 1', 'Forma 2a', 'Forma 2b', 'Forma 3a', 'Forma 3b', 'Forma 4a', 'Forma 4b'])}

                            ${this.renderDSGroup('Entrada de Cabos', 'entrada_cabos', eq.technical?.entrada_cabos, ['Inferior', 'Superior', 'Lateral'])}

                            ${this.renderDSGroup('Saída de Cabos', 'saida_cabos', eq.technical?.saida_cabos, ['Inferior', 'Superior', 'Lateral'])}

                            ${this.renderDSGroup('Acesso Frontal', 'acesso_frontal', eq.technical?.acesso_frontal, ['Fecho Borboleta', 'Fecho Yale', 'Fecho Cremona'])}

                            ${this.renderDSGroup('Acesso Traseiro', 'acesso_traseiro', eq.technical?.acesso_traseiro, ['Tampa Aparafusada', 'Porta Traseira'])}

                            ${this.renderDSGroup('Acesso Manutenção', 'acesso_manutencao', eq.technical?.acesso_manutencao, ['Frontal', 'Traseiro', 'Frontal e Traseiro'])}

                            ${this.renderDSGroup('Protocolo Comunicação', 'protocolo', eq.technical?.protocolo, ['Ethernet IP', 'Profinet', 'DeviceNet', 'Profibus DP', 'Modbus TCP', 'Modbus RTU', 'CANopen'])}

                            ${this.renderDSGroup('Cabo de Comunicação', 'cabo_comunicacao', eq.technical?.cabo_comunicacao, ['Patch Cord Profinet Cat5', 'Cabo pra DeviceNet', 'Cabo Profibus DP 1px22 Awg Lilas', 'Modbus TCP 1px22 Awg', 'Modbus RTU 1px22 Awg', 'Cabo Canopen Com Conector Rj45'])}

                            ${this.renderDSGroup('Monitor Arco Interno', 'arco_interno', eq.technical?.arco_interno, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Iluminação Interna', 'iluminacao', eq.technical?.iluminacao, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tomada de Serviço', 'tomada', eq.technical?.tomada, ['2P+T (10A)', '2P+T (20A)', 'Não'])}

                            ${this.renderDSGroup('Termostato / Desumid.', 'termostato', eq.technical?.termostato, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Ventilação Forçada', 'ventilacao', eq.technical?.ventilacao, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tratamento Barramento', 'barramento_tratamento', eq.technical?.barramento_tratamento, ['Cobre Nú', 'Totalmente Estanhado', 'Prateado nas Conexões', 'Pintado'])}

                            ${this.renderDSGroup('Isol. Termoretrátil', 'termoretratil', eq.technical?.termoretratil, ['Sim', 'Não'])}

                            <div class="form-group">

                                <label class="form-label">Norma de Ensaio</label>

                                <input type="text" name="eq_norma_teste" class="form-control" value="${eq.technical?.norma_teste || 'IEC 61439-1&2'}">

                            </div>

                        `}

                            ${customCharacteristics.length > 0 ? `
                                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #e2e8f0;">
                                    <h5 style="margin: 0 0 12px 0; color: #1e3a8a; font-size: 14px;">Características Adicionais</h5>
                                    ${customCharacteristics.map((cc, i) => `
                                        <div style="display: flex; align-items: center; gap: 16px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: white; margin-bottom: 8px; transition: all 0.2s;">
                                            <div style="flex: 1;">
                                                <div style="font-weight: 700; color: #1e3a8a; font-size: 13px;">${cc.name}</div>
                                                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${cc.value}</div>
                                            </div>
                                            <button type="button" class="btn-icon" style="color: #ef4444; flex-shrink: 0;" onclick="app.propostaTecnica.removeCustomCharacteristic(${eq.id}, ${i})" title="Remover característica"><i class="ph ph-trash"></i></button>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                    </div>

                    </div>

                </div>

            `;

        } else if (subTab === 'norms') {

            const customNorms = eq.customNorms || [];

            contentHtml = `

                <div style="max-width: 800px; animation: fadeIn 0.3s ease;">

<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                        <div>
                            <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Normas Técnicas Aplicáveis: ${eq.tag}</h4>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Selecione as normas que regem o projeto deste equipamento</div>
                        </div>

                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addCustomNorm(${eq.id})" style="white-space: nowrap;">+ Inserir Norma Técnica</button>

                    </div>

                    <div style="margin-left: 10mm; display: grid; grid-template-columns: 1fr; gap: 12px;">

                        ${(eq.type === 'ELETROCENTRO' ? ELETROCENTRO_NORMS : COMMON_NORMS).map(n => `

                            <label style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${(eq.norms || []).includes(n.id) ? '#f0f9ff' : 'white'}; border-color: ${(eq.norms || []).includes(n.id) ? '#3b82f6' : '#e2e8f0'};">

                                <input type="checkbox" name="selectedNorms" value="${n.id}" ${(eq.norms || []).includes(n.id) ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #3b82f6;">

                                <div>
                                    <div style="font-weight: 800; color: #1e3a8a; font-size: 14px;">${n.label}</div>
                                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${n.description}</div>
                                </div>

                            </label>

                        `).join('')}

                        ${customNorms.map((cn, i) => `

                            <div style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid ${(eq.norms || []).includes(cn.id) ? '#3b82f6' : '#e2e8f0'}; border-radius: 12px; background: ${(eq.norms || []).includes(cn.id) ? '#f0f9ff' : 'white'}; transition: all 0.2s;">

                                <input type="checkbox" name="selectedNorms" value="${cn.id}" ${(eq.norms || []).includes(cn.id) ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #3b82f6;">

                                <div style="flex: 1;">
                                    <div style="font-weight: 800; color: #1e3a8a; font-size: 14px;">${cn.label}</div>
                                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${cn.description || 'Norma personalizada'}</div>
                                </div>

                                <button type="button" class="btn-icon" style="color: #ef4444; flex-shrink: 0;" onclick="app.propostaTecnica.removeCustomNorm(${eq.id}, ${i})" title="Remover norma"><i class="ph ph-trash"></i></button>

                            </div>

                        `).join('')}

                    </div>

                </div>

            `;

        } else if (subTab === 'loads') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                const tipicos = store.getState().tipicos || [];
                const isLM = this.cargasSubView === 'lm';
                contentHtml = `
                    <div style="animation: fadeIn 0.3s ease;">

                        <!-- Internal Navigation (Toggle Edição vs LM) -->

                        <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">

                            <h4 style="margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 800;">${isLM ? 'Lista de Materiais' : 'Lista de Cargas'}</h4>

                            <div style="background: #f1f5f9; padding: 4px; border-radius: 8px; display: flex; gap: 4px;">

                                <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.switchCargasSubView('edit')" style="font-size: 11px; padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; transition: all 0.15s; ${!isLM ? 'background: #16a34a; color: white; box-shadow: 0 1px 3px rgba(22,163,74,0.3);' : 'background: white; color: #475569; box-shadow: 0 1px 2px rgba(0,0,0,0.06);'}">

                                    <i class="ph ph-pencil-simple" style="margin-right: 4px;"></i> Lista de Cargas (Edição)

                                </button>

                                <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.switchCargasSubView('lm')" style="font-size: 11px; padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; transition: all 0.15s; ${isLM ? 'background: #16a34a; color: white; box-shadow: 0 1px 3px rgba(22,163,74,0.3);' : 'background: white; color: #475569; box-shadow: 0 1px 2px rgba(0,0,0,0.06);'}">

                                    <i class="ph ph-list-bullets" style="margin-right: 4px;"></i> Visualizar LM

                                </button>

                            </div>

                        </div>

                        <!-- Panel Selector Area -->

                        <div style="margin-bottom: 20px;">

                            <button type="button" class="btn btn-sm" style="background: #0284c7; color: white; border-radius: 20px; padding: 6px 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">

                                <i class="ph ph-stack" style="font-size: 16px;"></i> ${eq.tag || 'Painel Geral'}

                            </button>

                        </div>

                        ${isLM ? this.renderLoadsLM(eq) : this.renderLoadsEdit(eq, tipicos)}

                    </div>
                `;
            }

        } else if (subTab === 'enclosures') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                contentHtml = `
                    <div style="animation: fadeIn 0.3s ease;">

                        <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                            <div>

                                <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Configuração de Chaparia / Colunas: ${eq.tag}</h4>

                                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Detalhamento físico do conjunto de painéis</div>

                            </div>

                            <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addEnclosureRow()">+ Adicionar Coluna</button>

                        </div>

                        <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">

                            <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                                <thead>

                                    <tr style="background: #22c55e; border-bottom: 2px solid #e2e8f0; color: #fff;">

                                        <th style="padding: 14px; text-align: center; width: 80px;">Coluna</th>

                                        <th style="padding: 14px; text-align: left;">Tipo / Função</th>

                                        <th style="padding: 14px; text-align: center;">Dimensões (AxLxP)</th>

                                        <th style="padding: 14px; text-align: center; width: 100px;">IP</th>

                                        <th style="padding: 14px; text-align: center; width: 100px;">Cor</th>

                                        <th style="padding: 14px; text-align: center; width: 100px;">Lado</th>

                                        <th style="padding: 14px; width: 60px;"></th>

                                    </tr>

                                </thead>

                                <tbody id="enclosure-body">

                                    ${(eq.enclosureItems || []).map((item, i) => `

                                        <tr class="enclosure-row" style="border-bottom: 1px solid #f1f5f9;">

                                            <td style="padding: 12px;"><input type="text" name="enc_col_${i}" class="form-control" value="${item.col}" style="text-align: center;"></td>

                                            <td style="padding: 12px;"><input type="text" name="enc_type_${i}" class="form-control" value="${item.type}"></td>

                                            <td style="padding: 12px;"><input type="text" name="enc_dim_${i}" class="form-control" value="${item.dim}" placeholder="2300x800x600"></td>

                                            <td style="padding: 12px;"><input type="text" name="enc_ip_${i}" class="form-control" value="${item.ip}" style="text-align: center;"></td>

                                            <td style="padding: 12px;"><input type="text" name="enc_color_${i}" class="form-control" value="${item.color}" style="text-align: center;"></td>

                                            <td style="padding: 12px;"><input type="text" name="enc_side_${i}" class="form-control" value="${item.side}" style="text-align: center;"></td>

                                            <td style="padding: 12px; text-align: center;"><button type="button" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>

                                        </tr>

                                    `).join('')}

                                    ${(eq.enclosureItems || []).length === 0 ? '<tr><td colspan="7" style="padding: 30px; text-align: center; color: #94a3b8;">Clique em "+ Adicionar Coluna" para iniciar.</td></tr>' : ''}

                                </tbody>

                            </table>

                        </div>

                    </div>
                `;
            }

        } else if (subTab === 'busbars') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                const b = eq.busbars || { main: {}, branch: {}, ground: {} };
                contentHtml = `
                    <div style="animation: fadeIn 0.3s ease;">

                        <div style="margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                            <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Barramentos e Conexões: ${eq.tag}</h4>

                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Especificações de barramentos de cobre e proteção</div>

                        </div>

                        <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">

                            <!-- Principal -->

                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">

                                <h5 style="margin: 0 0 15px 0; color: #1e3a8a; font-weight: 800; font-size: 14px; text-transform: uppercase;">Barramento Principal (Horizontal)</h5>

                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">

                                    <div class="form-group"><label class="form-label">Material</label><input type="text" name="bus_main_mat" class="form-control" value="${b.main?.mat || 'Cobre Eletrolítico'}"></div>

                                    <div class="form-group"><label class="form-label">Dimensões / Seção</label><input type="text" name="bus_main_dim" class="form-control" value="${b.main?.dim || ''}" placeholder="Ex: 2x (80x10)mm"></div>

                                    <div class="form-group"><label class="form-label">Corrente (In)</label><input type="text" name="bus_main_inc" class="form-control" value="${b.main?.inc || ''}" placeholder="Ex: 2500A"></div>

                                    <div class="form-group"><label class="form-label">Peso Est. (kg)</label><input type="text" name="bus_main_weight" class="form-control" value="${b.main?.weight || ''}"></div>

                                </div>

                            </div>

                            <!-- Derivação -->

                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">

                                <h5 style="margin: 0 0 15px 0; color: #1e3a8a; font-weight: 800; font-size: 14px; text-transform: uppercase;">Barramento de Derivação (Vertical)</h5>

                                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">

                                    <div class="form-group"><label class="form-label">Material</label><input type="text" name="bus_branch_mat" class="form-control" value="${b.branch?.mat || 'Cobre Eletrolítico'}"></div>

                                    <div class="form-group"><label class="form-label">Dimensões / Seção</label><input type="text" name="bus_branch_dim" class="form-control" value="${b.branch?.dim || ''}"></div>

                                    <div class="form-group"><label class="form-label">Corrente (In)</label><input type="text" name="bus_branch_inc" class="form-control" value="${b.branch?.inc || ''}"></div>

                                    <div class="form-group"><label class="form-label">Peso Est. (kg)</label><input type="text" name="bus_branch_weight" class="form-control" value="${b.branch?.weight || ''}"></div>

                                </div>

                            </div>

                            <!-- Terra -->

                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">

                                <h5 style="margin: 0 0 15px 0; color: #1e3a8a; font-weight: 800; font-size: 14px; text-transform: uppercase;">Barramento de Terra / Proteção (PE)</h5>

                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">

                                    <div class="form-group"><label class="form-label">Material</label><input type="text" name="bus_ground_mat" class="form-control" value="${b.ground?.mat || 'Cobre Eletrolítico'}"></div>

                                    <div class="form-group"><label class="form-label">Dimensões / Seção</label><input type="text" name="bus_ground_dim" class="form-control" value="${b.ground?.dim || ''}"></div>

                                    <div class="form-group"><label class="form-label">Peso Est. (kg)</label><input type="text" name="bus_ground_weight" class="form-control" value="${b.ground?.weight || ''}"></div>

                                </div>

                            </div>

                        </div>

                    </div>
                `;
            }

        } else if (subTab === 'deviations') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                contentHtml = this.renderDeviations(eq);
            }
        } else if (subTab === 'deviations') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                contentHtml = this.renderDeviations(eq);
            }

        } else if (subTab === 'calc_eletrico') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                const html = window.app?.calculosEletricos?.buildHtml(eq.tag);
                contentHtml = html || `<div style="padding:40px;text-align:center;color:#94a3b8;"><i class="ph ph-lightning" style="font-size:48px;opacity:0.2;"></i><br><br>Módulo de Cálculos Elétricos não disponível.</div>`;
            }

        } else if (subTab === 'calc_mecanico') {
            if (isTrMt) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                const html = window.app?.calculosMecanicos?.buildHtml(eq.tag);
                contentHtml = html || `<div style="padding:40px;text-align:center;color:#94a3b8;"><i class="ph ph-wrench" style="font-size:48px;opacity:0.2;"></i><br><br>Módulo de Cálculos Mecânicos não disponível.</div>`;
            }

        } else {
            contentHtml = `<div style="text-align: center; padding: 40px; color: #94a3b8;"><i class="ph ph-hourglass-high" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i><br>Sub-aba "${this.getSubTabLabel(subTab)}" em desenvolvimento para ${eq.tag}.</div>`;
        }

        return `
            <div style="display: flex; flex: 1; overflow: hidden;">
                ${sidebarHtml}
                <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                    ${navHtml}
                    <div style="flex: 1; overflow-y: auto; padding: 0; background: #f1f5f9; scrollbar-gutter: stable;">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
    },

    renderRestrictedTab(eq) {
        return `<div style="text-align: center; padding: 60px 40px; color: #94a3b8;">
            <i class="ph ph-prohibit" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i>
            <br>
            <div style="font-weight: 700; font-size: 16px; color: #64748b;">Sub-aba não disponível</div>
            <div style="font-size: 13px; margin-top: 6px;">Esta seção não se aplica ao equipamento ${eq.tag} (${eq.type}).</div>
        </div>`;
    },

    getSubTabLabel(subTab) {
        const labels = {
            'technical': 'Ficha Técnica',
            'norms': 'Normas',
            'loads': 'Cargas',
            'enclosures': 'Invólucros',
            'busbars': 'Barramentos',
            'deviations': 'Desvios',
            'labor': 'Mão de Obra',
            'expenses': 'Despesas',
            'eletrocentro': 'Escopo',
            'calc_eletrico': 'Cálculos Elétricos',
            'calc_mecanico': 'Cálculos Mecânicos'
        };
        return labels[subTab] || subTab;
    },

    renderDSGroup(label, field, value, options) {
        const escaped = JSON.stringify(label).slice(1, -1);
        const hasOutro = options.includes('Outro');
        const normalOptions = hasOutro ? options.slice(0, -1) : options;
        const isOutro = value && !normalOptions.includes(value);
        return `
            <div class="form-group ds-group" data-field="${field}">
                <label class="form-label">${escaped || label}</label>
                <div style="display:flex;gap:8px;align-items:center;">
                    <select name="eq_${field}" class="form-control ds-select" style="flex:1;min-width:0;" onchange="app.propostaTecnica.handleDSSelect(this, '${field}')">
                        ${normalOptions.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        <option value="Outro" ${isOutro ? 'selected' : ''}>Outro</option>
                    </select>
                    <input type="text" name="eq_${field}_specify" class="form-control ds-specify" placeholder="Especifique" value="${isOutro ? value : ''}" style="flex:1;display:${isOutro ? 'block' : 'none'};">
                </div>
            </div>
        `;
    },

    handleDSSelect(select, field) {
        const specify = select.closest('.ds-group').querySelector('.ds-specify');
        if (select.value === 'Outro') {
            specify.style.display = 'block';
            specify.focus();
        } else {
            specify.style.display = 'none';
            specify.value = '';
        }
    },






    renderLabor(eq) {

        const labor = eq.labor || { items: JSON.parse(JSON.stringify(DEFAULT_LABOR_ROLES)) };

        const totalHours = labor.items.reduce((sum, it) => sum + (it.hours || 0), 0);

        const totalCost = labor.items.reduce((sum, it) => sum + ((it.hours || 0) * (it.hourlyRate || 0)), 0);



        return `

            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>

                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Mão de Obra Estimada: ${eq.tag}</h4>

                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Horas de engenharia e montagem para este equipamento</div>

                    </div>

                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addLaborRow()">+ Adicionar Função</button>

                </div>



                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: white;">

                    <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                        <thead>

                            <tr style="background: #22c55e; border-bottom: 2px solid #e2e8f0; color: #fff;">

                                <th style="padding: 14px; text-align: left; width: 150px;">Grupo</th>

                                <th style="padding: 14px; text-align: left;">Função / Atividade</th>

                                <th style="padding: 14px; text-align: center; width: 100px;">Horas</th>

                                <th style="padding: 14px; text-align: right; width: 120px;">Valor/h (R$)</th>

                                <th style="padding: 14px; text-align: right; width: 140px;">Subtotal</th>

                                <th style="padding: 14px; width: 60px;"></th>

                            </tr>

                        </thead>

                        <tbody id="labor-body">

                            ${labor.items.map((it, i) => `

                                <tr class="labor-row" style="border-bottom: 1px solid #f1f5f9;">

                                    <td style="padding: 12px;">

                                        <select name="labor_group_${i}" class="form-control" style="font-size: 12px;">

                                            <option value="Engenharia" ${it.group === 'Engenharia' ? 'selected' : ''}>Engenharia</option>

                                            <option value="Montagem" ${it.group === 'Montagem' ? 'selected' : ''}>Montagem</option>

                                            <option value="Campo" ${it.group === 'Campo' ? 'selected' : ''}>Campo</option>

                                        </select>

                                    </td>

                                    <td style="padding: 12px;"><input type="text" name="labor_role_${i}" class="form-control" value="${it.role || ''}" style="font-weight: 600;"></td>

                                    <td style="padding: 12px;"><input type="number" name="labor_hours_${i}" class="form-control" value="${it.hours || 0}" style="text-align: center;" oninput="app.propostaTecnica.updateLaborTotals()"></td>

                                    <td style="padding: 12px;"><input type="text" name="labor_rate_${i}" class="form-control" value="${app.formatCurrency(it.hourlyRate || 0).replace('R$', '').trim()}" style="text-align: right;" oninput="app.propostaTecnica.updateLaborTotals()"></td>

                                    <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e3a8a;">${app.formatCurrency((it.hours || 0) * (it.hourlyRate || 0))}</td>

                                    <td style="padding: 12px; text-align: center;"><button type="button" class="btn-icon" style="color: #ef4444;" onclick="this.closest('tr').remove(); app.propostaTecnica.updateLaborTotals();"><i class="ph ph-trash"></i></button></td>

                                </tr>

                            `).join('')}

                        </tbody>

                        <tfoot style="background: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">

                            <tr>

                                <td colspan="2" style="padding: 14px; text-align: right; text-transform: uppercase; color: #64748b;">Totais do Equipamento</td>

                                <td id="labor-total-hours" style="padding: 14px; text-align: center; color: #1e3a8a;">${totalHours}h</td>

                                <td colspan="2" id="labor-total-cost" style="padding: 14px; text-align: right; color: #1e3a8a; font-size: 16px;">${app.formatCurrency(totalCost)}</td>

                                <td></td>

                            </tr>

                        </tfoot>

                    </table>

                </div>

            </div>

        `;

    },



    renderExpenses(eq) {

        const expenses = eq.expenses || JSON.parse(JSON.stringify(DEFAULT_EXPENSES));

        const total = expenses.reduce((sum, it) => sum + ((it.unit || 0) * (it.qtd || 0)), 0);



        return `

            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>

                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Despesas Logísticas e Extras: ${eq.tag}</h4>

                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Custos adicionais relacionados a este equipamento (Frete, Diárias, etc.)</div>

                    </div>

                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addExpenseRow()">+ Adicionar Despesa</button>

                </div>



                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto; background: white;">

                    <table class="w-full" style="font-size: 12px; border-collapse: collapse;">

                        <thead>

                            <tr style="background: #22c55e; border-bottom: 2px solid #e2e8f0; color: #fff;">

                                <th style="padding: 14px; text-align: left;">Descrição da Despesa</th>

                                <th style="padding: 14px; text-align: center; width: 80px;">Qtd</th>

                                <th style="padding: 14px; text-align: right; width: 120px;">Unitário (R$)</th>

                                <th style="padding: 14px; text-align: right; width: 130px;">Subtotal</th>

                                <th style="padding: 14px; width: 60px;"></th>

                            </tr>

                        </thead>

                        <tbody id="expenses-body">

                            ${expenses.map((it, i) => `

                                <tr class="expense-row" style="border-bottom: 1px solid #f1f5f9;">

                                    <td style="padding: 10px;"><input type="text" name="exp_desc_${i}" class="form-control" value="${it.desc || ''}" style="font-weight: 600;"></td>

                                    <td style="padding: 10px;"><input type="number" name="exp_qtd_${i}" class="form-control" value="${it.qtd || 0}" style="text-align: center;" oninput="app.propostaTecnica.updateExpenseTotals()"></td>

                                    <td style="padding: 10px;"><input type="text" name="exp_unit_${i}" class="form-control" value="${app.formatCurrency(it.unit || 0).replace('R$', '').trim()}" style="text-align: right;" oninput="app.propostaTecnica.updateExpenseTotals()"></td>

                                    <td style="padding: 10px; text-align: right; font-weight: 700; color: #1e3a8a;">${app.formatCurrency((it.unit || 0) * (it.qtd || 0))}</td>

                                    <td style="padding: 10px; text-align: center;"><button type="button" class="btn-icon" style="color: #ef4444;" onclick="this.closest('tr').remove(); app.propostaTecnica.updateExpenseTotals();"><i class="ph ph-trash"></i></button></td>

                                </tr>

                            `).join('')}

                        </tbody>

                        <tfoot style="background: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">

                            <tr>

                                <td colspan="3" style="padding: 14px; text-align: right; text-transform: uppercase; color: #64748b;">Custo Total de Despesas</td>

                                <td id="expense-total-cost" style="padding: 14px; text-align: right; color: #1e3a8a; font-size: 16px;">${app.formatCurrency(total)}</td>

                                <td></td>

                            </tr>

                        </tfoot>

                    </table>

                </div>

            </div>

        `;

    },



    updateLaborTotals() {

        const rows = document.querySelectorAll('.labor-row');

        let totalHours = 0;

        let totalCost = 0;



        rows.forEach((row, i) => {

            const hours = parseFloat(row.querySelector(`[name^="labor_hours_"]`).value || 0);

            const rateStr = row.querySelector(`[name^="labor_rate_"]`).value || '0';

            const rate = parseFloat(rateStr.replace(/\./g, '').replace(',', '.'));

            

            const subtotal = hours * rate;

            totalHours += hours;

            totalCost += subtotal;



            const subtotalCell = row.cells[4];

            if (subtotalCell) subtotalCell.textContent = app.formatCurrency(subtotal);

        });



        const totalHoursEl = document.getElementById('labor-total-hours');

        const totalCostEl = document.getElementById('labor-total-cost');

        if (totalHoursEl) totalHoursEl.textContent = totalHours + 'h';

        if (totalCostEl) totalCostEl.textContent = app.formatCurrency(totalCost);

    },



    updateExpenseTotals() {

        const rows = document.querySelectorAll('.expense-row');

        let totalCost = 0;



        rows.forEach((row, i) => {

            const qtd = parseFloat(row.querySelector(`[name^="exp_qtd_"]`).value || 0);

            const unitStr = row.querySelector(`[name^="exp_unit_"]`).value || '0';

            const unit = parseFloat(unitStr.replace(/\./g, '').replace(',', '.'));

            

            const subtotal = qtd * unit;

            totalCost += subtotal;



            const subtotalCell = row.cells[3];

            if (subtotalCell) subtotalCell.textContent = app.formatCurrency(subtotal);

        });



        const totalCostEl = document.getElementById('expense-total-cost');

        if (totalCostEl) totalCostEl.textContent = app.formatCurrency(totalCost);

    },



    addLaborRow() {

        const body = document.getElementById('labor-body');

        if (!body) return;

        const index = body.querySelectorAll('.labor-row').length;

        const row = document.createElement('tr');

        row.className = 'labor-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td style="padding: 12px;">

                <select name="labor_group_${index}" class="form-control" style="font-size: 12px;">

                    <option value="Engenharia">Engenharia</option>

                    <option value="Montagem">Montagem</option>

                    <option value="Campo">Campo</option>

                </select>

            </td>

            <td style="padding: 12px;"><input type="text" name="labor_role_${index}" class="form-control" style="font-weight: 600;"></td>

            <td style="padding: 12px;"><input type="number" name="labor_hours_${index}" class="form-control" value="0" style="text-align: center;" oninput="app.propostaTecnica.updateLaborTotals()"></td>

            <td style="padding: 12px;"><input type="text" name="labor_rate_${index}" class="form-control" value="0,00" style="text-align: right;" oninput="app.propostaTecnica.updateLaborTotals()"></td>

            <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e3a8a;">R$ 0,00</td>

            <td style="padding: 12px; text-align: center;"><button type="button" class="btn-icon" style="color: #ef4444;" onclick="this.closest('tr').remove(); app.propostaTecnica.updateLaborTotals();"><i class="ph ph-trash"></i></button></td>

        `;

        body.appendChild(row);

    },



    addExpenseRow() {

        const body = document.getElementById('expenses-body');

        if (!body) return;

        const index = body.querySelectorAll('.expense-row').length;

        const row = document.createElement('tr');

        row.className = 'expense-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td style="padding: 10px;"><input type="text" name="exp_desc_${index}" class="form-control" style="font-weight: 600;"></td>

            <td style="padding: 10px;"><input type="number" name="exp_qtd_${index}" class="form-control" value="0" style="text-align: center;" oninput="app.propostaTecnica.updateExpenseTotals()"></td>

            <td style="padding: 10px;"><input type="text" name="exp_unit_${index}" class="form-control" value="0,00" style="text-align: right;" oninput="app.propostaTecnica.updateExpenseTotals()"></td>



            <td style="padding: 10px; text-align: right; font-weight: 700; color: #1e3a8a;">R$ 0,00</td>

            <td style="padding: 10px; text-align: center;"><button type="button" class="btn-icon" style="color: #ef4444;" onclick="this.closest('tr').remove(); app.propostaTecnica.updateExpenseTotals();"><i class="ph ph-trash"></i></button></td>

        `;

        body.appendChild(row);

    },

    addCustomNorm(eqId) {
        const existing = document.getElementById('modal-custom-norm');
        if (existing) existing.remove();
        const html = `
            <div id="modal-custom-norm" class="modal-overlay" style="z-index: 9999;">
                <div class="modal" style="width: 480px; padding: 25px; border-radius: 16px;">
                    <h3 style="margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">Inserir Norma Técnica</h3>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Nome da Norma</label>
                        <input type="text" id="custom-norm-label" class="form-control" placeholder="Ex: ABNT NBR IEC 60529">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label">Descrição da Norma</label>
                        <input type="text" id="custom-norm-desc" class="form-control" placeholder="Ex: Classificação do grau de proteção (IP)">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="document.getElementById('modal-custom-norm').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmCustomNorm(${eqId})">Adicionar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        setTimeout(() => document.getElementById('custom-norm-label')?.focus(), 100);
    },

    confirmCustomNorm(eqId) {
        const label = document.getElementById('custom-norm-label')?.value?.trim();
        const desc = document.getElementById('custom-norm-desc')?.value?.trim() || 'Norma personalizada';
        if (!label) { alert('Informe o nome da norma.'); return; }
        document.getElementById('modal-custom-norm')?.remove();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments.find(e => e.id === eqId);
        if (!eq) return;
        if (!eq.customNorms) eq.customNorms = [];
        const id = 'custom_norm_' + Date.now();
        eq.customNorms.push({ id, label, description: desc });
        if (!eq.norms) eq.norms = [];
        if (!eq.norms.includes(id)) eq.norms.push(id);
        store.setState({ activeTechnicalProposal: data });
        this.activeSubTab = 'norms';
        this.renderModal(data);
    },

    removeCustomNorm(eqId, index) {
        const data = store.getState().activeTechnicalProposal;
        const eqIndex = data.equipments.findIndex(e => e.id === eqId);
        if (eqIndex === -1) return;
        const eq = data.equipments[eqIndex];
        if (!eq.customNorms) return;
        const removed = eq.customNorms.splice(index, 1)[0];
        if (removed && eq.norms) {
            eq.norms = eq.norms.filter(id => id !== removed.id);
        }
        store.setState({ activeTechnicalProposal: data });
        this.activeSubTab = 'norms';
        this.activeEquipmentIndex = eqIndex;
        this.renderModal(data);
    },

    addCustomCharacteristic(eqId) {
        const existing = document.getElementById('modal-custom-characteristic');
        if (existing) existing.remove();
        const html = `
            <div id="modal-custom-characteristic" class="modal-overlay" style="z-index: 9999;">
                <div class="modal" style="width: 480px; padding: 25px; border-radius: 16px;">
                    <h3 style="margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">Inserir Característica</h3>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label">Nome da Característica</label>
                        <input type="text" id="custom-char-name" class="form-control" placeholder="Ex: Tensão de Isolamento">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label">Valor</label>
                        <input type="text" id="custom-char-value" class="form-control" placeholder="Ex: 1000V">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="document.getElementById('modal-custom-characteristic').remove()">Cancelar</button>
                        <button class="btn btn-primary" onclick="app.propostaTecnica.confirmCustomCharacteristic(${eqId})">Adicionar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        setTimeout(() => document.getElementById('custom-char-name')?.focus(), 100);
    },

    confirmCustomCharacteristic(eqId) {
        const name = document.getElementById('custom-char-name')?.value?.trim();
        const value = document.getElementById('custom-char-value')?.value?.trim();
        if (!name || !value) { alert('Preencha o nome e o valor da característica.'); return; }
        document.getElementById('modal-custom-characteristic')?.remove();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments.find(e => e.id === eqId);
        if (!eq) return;
        if (!eq.customCharacteristics) eq.customCharacteristics = [];
        const id = 'custom_char_' + Date.now();
        eq.customCharacteristics.push({ id, name, value });
        store.setState({ activeTechnicalProposal: data });
        this.activeSubTab = 'technical';
        this.renderModal(data);
    },

    removeCustomCharacteristic(eqId, index) {
        const data = store.getState().activeTechnicalProposal;
        const eqIndex = data.equipments.findIndex(e => e.id === eqId);
        if (eqIndex === -1) return;
        const eq = data.equipments[eqIndex];
        if (!eq.customCharacteristics) return;
        eq.customCharacteristics.splice(index, 1);
        store.setState({ activeTechnicalProposal: data });
        this.activeSubTab = 'technical';
        this.activeEquipmentIndex = eqIndex;
        this.renderModal(data);
    },



    renderTabVendorList(data) {

        const _norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

        const compKeys = Object.keys(VENDOR_MAP);

        const _findCategory = comp => {
            const n = _norm(comp);
            const exact = compKeys.find(k => _norm(k) === n);
            if (exact) return exact;
            const words = comp.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
            for (const key of compKeys) {
                const keyWords = key.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
                for (const w of words)
                    for (const kw of keyWords)
                        if (w.includes(kw) || kw.includes(w)) return key;
            }
            return null;
        };

        const savedMap = {};
        const unmatched = [];
        if (data.vendorList && data.vendorList.length > 0) {
            data.vendorList.forEach(v => {
                if (!v.comp) return;
                const cat = _findCategory(v.comp);
                if (cat) savedMap[cat] = v;
                else unmatched.push(v);
            });
        }
        const vendors = compKeys.map(comp => {
            const saved = savedMap[comp];
            return saved ? { ...saved, comp } : {
                comp,
                brand: VENDOR_MAP[comp][0] || '',
                opt: '__PADRAO__',
                optEspecifique: ''
            };
        });
        unmatched.forEach(v => {
            vendors.push({ comp: v.comp, brand: v.brand || '', opt: v.opt || '__PADRAO__', optEspecifique: v.optEspecifique || '' });
        });
        console.log('[VendorList] data.vendorList:', JSON.parse(JSON.stringify(data.vendorList)));
        vendors.forEach(v => {
            const brands = VENDOR_MAP[v.comp];
            if (brands && v.brand && !brands.includes(v.brand)) {
                console.warn(`[VendorList] Brand "${v.brand}" n\u00e3o est\u00e1 em VENDOR_MAP["${v.comp}"]. Setando OUTRO.`);
                v.opt = '__OUTRO__';
                v.optEspecifique = v.brand;
            }
        });
        console.log('[VendorList] vendors final:', vendors.map(v => ({ comp: v.comp, brand: v.brand, opt: v.opt, optEspecifique: v.optEspecifique })));

        return `

            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Vendor List / Lista de Fabricantes</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Definição de marcas homologadas para os componentes principais</div>
                    </div>
                </div>

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto;">

                    <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                        <thead>
                            <tr style="background: #22c55e; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 14px; text-align: left; font-weight: 800; color: #1e3a8a; font-size: 13px;">Componente / Material</th>
                                <th style="padding: 14px; text-align: left; font-weight: 800; color: #1e3a8a; font-size: 13px;">Fabricante Sugerido (Padrão)</th>
                                <th style="padding: 14px; text-align: left; font-weight: 800; color: #1e3a8a; font-size: 13px;">Alternativas Aceitáveis</th>
                            </tr>
                        </thead>

                        <tbody id="vendor-body">
                            ${vendors.map((v, i) => {
                                const brands = VENDOR_MAP[v.comp] || [];
                                const isOutro = v.opt === '__OUTRO__';
                                const isSimilar = v.opt === '__SIMILAR__';
                                const isPadrao = v.opt === '__PADRAO__';
                                const showEspecifique = isOutro;
                                return `
                                <tr class="vendor-row" style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 12px; font-weight: 600; color: #1e3a8a; font-size: 10px;">${v.comp}</td>
                                    <td style="padding: 12px;">
                                        ${brands.length > 0 ? `
                                            <select name="ven_brand_${i}" class="form-control" style="font-size: 10px; font-weight: 400;">
                                                ${brands.map(b => `<option value="${b}" ${b === v.brand ? 'selected' : ''}>${b}</option>`).join('')}
                                            </select>
                                        ` : `
                                            <input type="text" name="ven_brand_${i}" class="form-control" style="font-size: 10px; font-weight: 400;" value="${v.brand || ''}" placeholder="Fabricante">
                                        `}
                                    </td>
                                    <td style="padding: 12px;">
                                        <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                                            <select name="ven_opt_${i}" class="form-control" style="flex: 1; font-size: 10px; font-weight: 400;" onchange="app.propostaTecnica.onVendorOptChange(${i})">
                                                <option value="__PADRAO__" ${isPadrao ? 'selected' : ''}>Padrão</option>
                                                <option value="__OUTRO__" ${isOutro ? 'selected' : ''}>Outro</option>
                                                <option value="__SIMILAR__" ${isSimilar ? 'selected' : ''}>Similar</option>
                                            </select>
                                            <input type="text" name="ven_opt_especifique_${i}" class="form-control ven-especifique" placeholder="Especifique..." style="display: ${showEspecifique ? 'inline-block' : 'none'}; width: 160px;" value="${v.optEspecifique || ''}">
                                        </div>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>

                    </table>

                </div>

            </div>

        `;

    },

    renderTabRevisoes(data) {

        return `

            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Controle de Revisões</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Histórico de versões da proposta técnica</div>
                    </div>

                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addRevisionRow()">+ Nova Revisão</button>

                </div>

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto;">

                <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                    <thead>

                        <tr style="background: #22c55e; border-bottom: 2px solid #e2e8f0;">

                            <th style="padding: 14px; width: 70px; font-weight: 800; color: #1e3a8a; font-size: 13px;">Nú</th>

                            <th style="padding: 14px; font-weight: 800; color: #1e3a8a; font-size: 13px;">Descrição</th>

                            <th style="padding: 14px; width: 70px; text-align: center; font-weight: 800; color: #1e3a8a; font-size: 13px;">Elab.</th>

                            <th style="padding: 14px; width: 70px; text-align: center; font-weight: 800; color: #1e3a8a; font-size: 13px;">Verif.</th>

                            <th style="padding: 14px; width: 70px; text-align: center; font-weight: 800; color: #1e3a8a; font-size: 13px;">Aprov.</th>

                            <th style="padding: 14px; width: 120px; text-align: center; font-weight: 800; color: #1e3a8a; font-size: 13px;">Data</th>

                            <th style="padding: 14px; width: 50px;"></th>

                        </tr>

                    </thead>

                    <tbody id="revisions-body">

                        ${(data.revisions || []).map((rev, index) => `

                            <tr class="revision-row" style="border-bottom: 1px solid #f1f5f9;">

                                <td style="padding: 12px;"><input type="text" name="rev_no_${index}" class="form-control" value="${rev.no || ''}" style="text-align: center; padding: 10px 4px;"></td>

                                <td style="padding: 12px;"><input type="text" name="rev_desc_${index}" class="form-control" value="${rev.desc || ''}"></td>

                                <td style="padding: 12px;"><input type="text" name="rev_elab_${index}" class="form-control" value="${rev.elab || ''}" style="text-align: center; padding: 10px 4px;"></td>

                                <td style="padding: 12px;"><input type="text" name="rev_verif_${index}" class="form-control" value="${rev.verif || ''}" style="text-align: center; padding: 10px 4px;"></td>

                                <td style="padding: 12px;"><input type="text" name="rev_aprov_${index}" class="form-control" value="${rev.aprov || ''}" style="text-align: center; padding: 10px 4px;"></td>

                                <td style="padding: 12px;"><input type="date" name="rev_data_${index}" class="form-control" value="${(() => {

                                    if(!rev.data) return '';

                                    if(rev.data.includes('/')) {

                                        const [d,m,y] = rev.data.split('/');

                                        return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;

                                    }

                                    return rev.data;

                                })()}" style="text-align: center; padding: 10px 8px;"></td>

                                <td style="padding: 12px; text-align: center;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>

                            </tr>

                        `).join('')}

                    </tbody>

                </table>
                </div>

            </div>

        `;

    },

    renderTabAssinaturas(data) {
        const sig = (n, label, defNome, defCargo, defTel, defCel, defEmail) => `
            <div style="background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:12px;border:1px solid var(--color-border);">
                <label class="form-label" style="font-size:11px;margin-bottom:5px;font-weight:600;">${label}</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                    <input type="text" name="sig${n}_nome" class="form-control" placeholder="Nome" value="${data['sig'+n+'_nome']||defNome}">
                    <input type="text" name="sig${n}_cargo" class="form-control" placeholder="Cargo" value="${data['sig'+n+'_cargo']||defCargo}">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 2fr;gap:8px;">
                    <input type="text" name="sig${n}_tel" class="form-control" placeholder="Tel" value="${data['sig'+n+'_tel']||defTel}">
                    <input type="text" name="sig${n}_cel" class="form-control" placeholder="Cel" value="${data['sig'+n+'_cel']||defCel}">
                    <input type="text" name="sig${n}_email" class="form-control" placeholder="Email" value="${data['sig'+n+'_email']||defEmail}">
                </div>
            </div>`;
        return `<div style="padding:30px;max-width:900px;">
            ${sig(1,'Assinatura 1 (Consultor)','José Cirqueira','Consultor de Vendas','(16) 3945-2145','(16) 9 9793-2877','jose.cirqueira@drivetech.com.br')}
            ${sig(2,'Assinatura 2 (Gerente)','Leandro Pereira','Gerente Comercial','(16) 3945-2145','(16) 9 9713-3674','leandro.pereira@drivetech.com.br')}
            ${sig(3,'Assinatura 3 (Diretor)','Márcio Vaz','Diretor de Negócios','(16) 3945-2145','(16) 99730-6540','marcio.vaz@drivetech.com.br')}
        </div>`;
    },

    addScopeRow() {

        const body = document.getElementById('scope-body');

        if (!body) return;

        const index = body.querySelectorAll('.scope-row').length;

        const row = document.createElement('tr');

        row.className = 'scope-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td style="padding: 8px;"><input type="text" name="scope_desc_${index}" class="form-control"></td>

            <td style="padding: 8px; text-align: center;"><input type="checkbox" name="scope_dvt_${index}"></td>

            <td style="padding: 8px; text-align: center;"><input type="checkbox" name="scope_cli_${index}"></td>

            <td style="padding: 8px; text-align: center;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>

        `;

        body.appendChild(row);

    },



    addRevisionRow() {

        const body = document.getElementById('revisions-body');

        if (!body) return;

        const index = body.querySelectorAll('.revision-row').length;

        const row = document.createElement('tr');

        row.className = 'revision-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td style="padding: 8px;"><input type="text" name="rev_no_${index}" class="form-control" value="${String(index).padStart(2, '0')}" style="text-align: center; padding: 10px 4px;"></td>

            <td style="padding: 8px;"><input type="text" name="rev_desc_${index}" class="form-control"></td>

            <td style="padding: 8px;"><input type="text" name="rev_elab_${index}" class="form-control" style="text-align: center; padding: 10px 4px;"></td>

            <td style="padding: 8px;"><input type="text" name="rev_verif_${index}" class="form-control" style="text-align: center; padding: 10px 4px;"></td>

            <td style="padding: 8px;"><input type="text" name="rev_aprov_${index}" class="form-control" style="text-align: center; padding: 10px 4px;"></td>

            <td style="padding: 8px;"><input type="date" name="rev_data_${index}" class="form-control" value="${new Date().toISOString().split('T')[0]}" style="text-align: center; padding: 10px 8px;"></td>

            <td style="padding: 8px; text-align: center;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>

        `;

        body.appendChild(row);

    },



    addEnclosureRow() {

        const body = document.getElementById('enclosure-body');

        if (!body) return;

        const index = body.querySelectorAll('.enclosure-row').length;

        const row = document.createElement('tr');

        row.className = 'enclosure-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td style="padding: 12px;"><input type="text" name="enc_col_${index}" class="form-control" value="C${index + 1}" style="text-align: center;"></td>

            <td style="padding: 12px;"><input type="text" name="enc_type_${index}" class="form-control"></td>

            <td style="padding: 12px;"><input type="text" name="enc_dim_${index}" class="form-control" placeholder="2300x800x600"></td>

            <td style="padding: 12px;"><input type="text" name="enc_ip_${index}" class="form-control" value="IP-42" style="text-align: center;"></td>

            <td style="padding: 12px;"><input type="text" name="enc_color_${index}" class="form-control" value="RAL 7035" style="text-align: center;"></td>

            <td style="padding: 12px;"><input type="text" name="enc_side_${index}" class="form-control" value="Ambos" style="text-align: center;"></td>

            <td style="padding: 12px; text-align: center;"><button type="button" class="btn-icon" style="color: #ef4444;" onclick="this.closest('tr').remove()"><i class="ph ph-trash"></i></button></td>

        `;

        body.appendChild(row);

    },



    onVendorOptChange(index) {

        const row = document.querySelector(`.vendor-row [name="ven_opt_${index}"]`);
        if (!row) return;
        const tr = row.closest('tr');
        if (!tr) return;
        const espec = tr.querySelector(`[name="ven_opt_especifique_${index}"]`);
        if (espec) {
            espec.style.display = row.value === '__OUTRO__' ? 'inline-block' : 'none';
        }
    },

    addTextItemRow() {

        const list = document.getElementById('text-items-list');

        if (!list) return;

        const index = list.querySelectorAll('.text-item-row').length;

        const row = document.createElement('div');

        row.className = 'text-item-row';

        row.style.display = 'flex';

        row.style.gap = '12px';

        row.style.alignItems = 'center';

        row.innerHTML = `

            <div style="width: 30px; height: 30px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #64748b; flex-shrink: 0;">${index + 1}</div>

            <input type="text" name="text_item_${index}" class="form-control" style="flex: 1;">

            <button type="button" class="btn-icon" style="color: #ef4444;" onclick="this.closest('.text-item-row').remove()"><i class="ph ph-trash"></i></button>

        `;

        list.appendChild(row);

    },

    renderDeviations(eq) {
        const items = eq.deviations || [];
        const canEdit = store.canEdit();

        return `
            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>

                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Desvios / Comentários Técnicos: ${eq.tag || ''}</h4>

                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Divergências entre a solicitação do cliente e a proposta ofertada</div>

                    </div>

                    ${canEdit ? `<button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule.addDeviationItem()">+ Adicionar Item</button>` : ''}

                </div>

                ${items.length === 0 ? `
                    <div style="padding: 40px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                        Clique em "+ Adicionar Item" para listar um desvio.
                    </div>
                ` : `
                    <div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead>
                                <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;width:30px;">#</th>
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;">DOCUMENTO</th>
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;">SOLICITADO</th>
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;">DESVIO</th>
                                    ${canEdit ? `<th style="padding:10px 12px;text-align:center;font-weight:700;color:#475569;width:90px;">Ações</th>` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((it, i) => {
                                    const editing = it._editing === true;
                                    const doc = (typeof it === 'string') ? '' : (it.documento || '');
                                    const sol = (typeof it === 'string') ? '' : (it.solicitado || '');
                                    const dev = (typeof it === 'string') ? it : (it.desvio || '');
                                    return `
                                        <tr style="border-bottom:1px solid #f1f5f9;" data-deviation-index="${i}">
                                            <td style="padding:8px 12px;color:#94a3b8;font-weight:600;">${i + 1}</td>
                                            <td style="padding:6px 8px;">
                                                <span class="dev-view-${i}" style="${editing ? 'display:none;' : ''}">${this._escapeHtml(doc) || '—'}</span>
                                                <input type="text" name="dev_documento_${i}" class="form-control" value="${this._escapeHtml(doc)}" style="${editing ? '' : 'display:none;'}font-size:12px;height:32px;width:100%;" placeholder="DOC-...">
                                            </td>
                                            <td style="padding:6px 8px;">
                                                <span class="dev-view-${i}" style="${editing ? 'display:none;' : ''}">${this._escapeHtml(sol) || '—'}</span>
                                                <input type="text" name="dev_solicitado_${i}" class="form-control" value="${this._escapeHtml(sol)}" style="${editing ? '' : 'display:none;'}font-size:12px;height:32px;width:100%;" placeholder="Cliente solicitou...">
                                            </td>
                                            <td style="padding:6px 8px;">
                                                <span class="dev-view-${i}" style="${editing ? 'display:none;' : ''}">${this._escapeHtml(dev) || '—'}</span>
                                                <input type="text" name="dev_desvio_${i}" class="form-control" value="${this._escapeHtml(dev)}" style="${editing ? '' : 'display:none;'}font-size:12px;height:32px;width:100%;" placeholder="Descreva o desvio...">
                                            </td>
                                            ${canEdit ? `
                                                <td style="padding:6px 8px;text-align:center;white-space:nowrap;">
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.toggleDeviationEdit(${i})" title="${editing ? 'Confirmar' : 'Editar'}" style="color:#16a34a;background:#f0fdf4;border:1px solid #dcfce7;width:28px;height:28px;border-radius:4px;">
                                                        <i class="ph ${editing ? 'ph-check' : 'ph-pencil-simple'}"></i>
                                                    </button>
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.removeDeviationItem(${i})" title="Excluir" style="color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;width:28px;height:28px;border-radius:4px;margin-left:4px;">
                                                        <i class="ph ph-trash"></i>
                                                    </button>
                                                </td>
                                            ` : ''}
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}

            </div>
        `;
    },

    addDeviationItem() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq.deviations) eq.deviations = [];
        this._normalizeDeviations(eq);
        eq.deviations.push({ id: crypto.randomUUID(), documento: '', solicitado: '', desvio: '', _editing: true });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeDeviationItem(index) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        this._normalizeDeviations(eq);
        eq.deviations.splice(index, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    toggleDeviationEdit(index) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        this._normalizeDeviations(eq);
        const it = eq.deviations[index];
        if (!it) return;

        if (it._editing) {
            const docInput = document.querySelector(`[name="dev_documento_${index}"]`);
            const solInput = document.querySelector(`[name="dev_solicitado_${index}"]`);
            const desInput = document.querySelector(`[name="dev_desvio_${index}"]`);
            if (docInput) it.documento = docInput.value;
            if (solInput) it.solicitado = solInput.value;
            if (desInput) it.desvio = desInput.value;
            it._editing = false;
        } else {
            it._editing = true;
        }

        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    _normalizeDeviations(eq) {
        if (!eq.deviations) { eq.deviations = []; return; }
        eq.deviations = eq.deviations.map(it => {
            if (typeof it === 'string') return { id: crypto.randomUUID(), documento: '', solicitado: '', desvio: it, _editing: false };
            if (!it.id) it.id = crypto.randomUUID();
            return it;
        });
    },

    renderProposalExclusions(data) {
        this._migrateExclusionsFromEquipment(data);
        const items = data.exclusions || [];
        const canEdit = store.canEdit();

        return `
            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>

                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Exclusões Técnicas da Proposta</h4>

                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Itens e serviços não contemplados para esta proposta</div>

                    </div>

                    ${canEdit ? `<button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule.addExclusionItem()">+ Adicionar Item</button>` : ''}

                </div>

                ${items.length === 0 ? `
                    <div style="padding: 40px; text-align: center; color: #94a3b8; border: 1px dashed #e2e8f0; border-radius: 12px;">
                        Clique em "+ Adicionar Item" para listar uma exclusão.
                    </div>
                ` : `
                    <div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead>
                                <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;width:30px;">#</th>
                                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;">EXCLUSÃO</th>
                                    ${canEdit ? `<th style="padding:10px 12px;text-align:center;font-weight:700;color:#475569;width:90px;">Ações</th>` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((it, i) => {
                                    const editing = it._editing === true;
                                    const texto = (typeof it === 'string') ? it : (it.texto || '');
                                    return `
                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                            <td style="padding:8px 12px;color:#94a3b8;font-weight:600;">${i + 1}</td>
                                            <td style="padding:6px 8px;">
                                                <span style="${editing ? 'display:none;' : ''}">${this._escapeHtml(texto) || '—'}</span>
                                                <input type="text" name="exc_texto_${i}" class="form-control" value="${this._escapeHtml(texto)}" style="${editing ? '' : 'display:none;'}font-size:12px;height:32px;width:100%;" placeholder="Descreva a exclusão...">
                                            </td>
                                            ${canEdit ? `
                                                <td style="padding:6px 8px;text-align:center;white-space:nowrap;">
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.toggleExclusionEdit(${i})" title="${editing ? 'Confirmar' : 'Editar'}" style="color:#16a34a;background:#f0fdf4;border:1px solid #dcfce7;width:28px;height:28px;border-radius:4px;">
                                                        <i class="ph ${editing ? 'ph-check' : 'ph-pencil-simple'}"></i>
                                                    </button>
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.removeExclusionItem(${i})" title="Excluir" style="color:#ef4444;background:#fef2f2;border:1px solid #fee2e2;width:28px;height:28px;border-radius:4px;margin-left:4px;">
                                                        <i class="ph ph-trash"></i>
                                                    </button>
                                                </td>
                                            ` : ''}
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}

            </div>
        `;
    },

    addExclusionItem() {
        this._captureExclusionsEdits();
        const data = store.getState().activeTechnicalProposal;
        if (!data.exclusions) data.exclusions = [];
        this._normalizeProposalExclusions(data);
        data.exclusions.push({ id: crypto.randomUUID(), texto: '', _editing: true });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeExclusionItem(index) {
        this._captureExclusionsEdits();
        const data = store.getState().activeTechnicalProposal;
        this._normalizeProposalExclusions(data);
        data.exclusions.splice(index, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    toggleExclusionEdit(index) {
        const data = store.getState().activeTechnicalProposal;
        this._normalizeProposalExclusions(data);
        const it = data.exclusions[index];
        if (!it) return;

        if (it._editing) {
            const input = document.querySelector(`[name="exc_texto_${index}"]`);
            if (input) it.texto = input.value;
            it._editing = false;
        } else {
            it._editing = true;
        }

        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    _captureExclusionsEdits() {
        const data = store.getState().activeTechnicalProposal;
        this._normalizeProposalExclusions(data);
        (data.exclusions || []).forEach((it, i) => {
            if (it._editing) {
                const el = document.querySelector(`[name="exc_texto_${i}"]`);
                if (el) it.texto = el.value;
                it._editing = false;
            }
        });
        data.exclusions = (data.exclusions || []).map(({ _editing, ...rest }) => ({ id: rest.id || crypto.randomUUID(), ...rest }));
        store.setState({ activeTechnicalProposal: data });
    },

    _normalizeProposalExclusions(data) {
        if (!data.exclusions) { data.exclusions = []; return; }
        data.exclusions = data.exclusions.map(it => {
            if (typeof it === 'string') return { id: crypto.randomUUID(), texto: it, _editing: false };
            if (!it.id) it.id = crypto.randomUUID();
            return it;
        });
    },

    _migrateExclusionsFromEquipment(data) {
        if (data.exclusions && data.exclusions.length > 0) return;
        const eq = (data.equipments || [])[0];
        if (eq && eq.exclusions && eq.exclusions.length > 0) {
            data.exclusions = eq.exclusions.map(it =>
                typeof it === 'string' ? { id: crypto.randomUUID(), texto: it } : { id: it.id || crypto.randomUUID(), texto: it.texto || it.desvio || '' }
            );
        }
        (data.equipments || []).forEach(e => { if (e.exclusions) delete e.exclusions; });
    },




    addLoadRow() {

        const body = document.getElementById('loads-body');

        if (!body) return;

        const eq = store.getState().activeTechnicalProposal.equipments[this.activeEquipmentIndex];

        const tipicos = store.getState().tipicos || [];

        const index = body.querySelectorAll('.detailed-load-row').length;

        const row = document.createElement('tr');

        row.className = 'detailed-load-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <input type="hidden" name="dload_panel_${index}" value="${eq.tag}">

            <td style="padding: 6px;"><input type="text" name="dload_tag_${index}" class="form-control" style="font-size: 11px; font-weight: 700; color: #1e3a8a;"></td>

            <td style="padding: 6px;"><input type="text" name="dload_desc_${index}" class="form-control" style="font-size: 11px;"></td>

            <td style="padding: 6px; text-align: center;"><input type="text" name="dload_model_${index}" class="form-control" style="text-align: center; font-size: 11px;"></td>

            <td style="padding: 6px; text-align: center;"><input type="text" name="dload_no_${index}" class="form-control" style="text-align: center; font-size: 11px;"></td>

            <td style="padding: 6px; text-align: center;"><input type="text" name="dload_typical_${index}" class="form-control" style="text-align: center; font-size: 11px;"></td>

            <td style="padding: 6px;">

                <select name="dload_typicalId_${index}" class="form-control" style="font-size: 10px; height: 28px;">

                    <option value="">-- Selecione --</option>

                    ${tipicos.map(t => `<option value="${t.id}">${t.nome}</option>`).join('')}

                </select>

            </td>

            <td style="padding: 6px; text-align: center;"><input type="text" name="dload_disjuntor_${index}" class="form-control" style="text-align: center; font-size: 11px;"></td>

            <td style="padding: 6px; text-align: center;"><input type="text" name="dload_cabo_${index}" class="form-control" style="text-align: center; font-size: 11px;"></td>

            <td style="padding: 6px; text-align: center;">

                 <button type="button" class="btn btn-sm btn-outline" style="padding: 2px 6px; font-size: 10px; display: flex; align-items: center; gap: 4px; margin: 0 auto;" onclick="app.propostaTecnica.openLMModal(${index})">

                    <i class="ph ph-list-bullets" style="font-size: 14px;"></i> LM

                </button>

            </td>

            <td style="padding: 6px; text-align: center;"><button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444;"><i class="ph ph-trash"></i></button></td>

        `;

        body.appendChild(row);

    },



    openLMModal(loadIndex) {

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        const load = eq.loads[loadIndex];

        

        if (!load || !load.typicalId) {

            app.toast('Por favor, associe um Típico a esta carga para visualizar a LM.', 'warning');

            return;

        }



        const typical = store.getState().tipicos.find(t => t.id === load.typicalId);

        if (!typical) {

            app.toast('Típico não encontrado.', 'error');

            return;

        }



        const modalHtml = `

            <div id="modal-lm-preview" class="modal-overlay" style="z-index: 10001;">

                <div class="modal" style="width: 800px; max-height: 90vh; display: flex; flex-direction: column;">

                    <div class="modal-header" style="background: #1e3a8a; color: white;">

                        <div>

                            <h3 style="margin: 0;">Lista de Materiais: ${load.tag || 'Carga'}</h3>

                            <div style="font-size: 12px; opacity: 0.8;">Típico: ${typical.nome}</div>

                        </div>

                        <button type="button" class="btn-icon" style="color: white;" onclick="document.getElementById('modal-lm-preview').remove()"><i class="ph ph-x"></i></button>

                    </div>

                    <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 20px;">

                        <table class="w-full" style="font-size: 12px; border-collapse: collapse;">

                            <thead>

                                <tr style="background: #22c55e; text-align: left; color: #fff;">

                                    <th style="padding: 8px; width: 60px;">Qtd</th>

                                    <th style="padding: 8px;">Descrição</th>

                                    <th style="padding: 8px;">Modelo</th>

                                    <th style="padding: 8px;">Fabricante</th>

                                    <th style="padding: 8px; text-align: right;">Unit.</th>

                                    <th style="padding: 8px; text-align: right;">Total</th>

                                </tr>

                            </thead>

                            <tbody>

                                ${(typical.items || []).map(item => `

                                    <tr style="border-bottom: 1px solid #f1f5f9;">

                                        <td style="padding: 8px; text-align: center;">${item.qtd}</td>

                                        <td style="padding: 8px;">${item.descricao}</td>

                                        <td style="padding: 8px;">${item.modelo || '-'}</td>

                                        <td style="padding: 8px;">${item.fabricante || '-'}</td>

                                        <td style="padding: 8px; text-align: right;">${app.formatCurrency(item.custo || 0)}</td>

                                        <td style="padding: 8px; text-align: right;">${app.formatCurrency(parseFloat(item.qtd) * parseFloat(item.custo || 0))}</td>

                                    </tr>

                                `).join('')}

                            </tbody>

                        </table>

                    </div>

                    <div class="modal-footer" style="background: #f8fafc; display: flex; justify-content: space-between;">

                        <div style="font-weight: 700; color: #1e3a8a;">Total: ${app.formatCurrency(typical.custoTotal || 0)}</div>

                        <div style="display: flex; gap: 10px;">

                            <button type="button" class="btn btn-secondary" onclick="app.propostaTecnica.exportLMXLS(${loadIndex}, false)"><i class="ph ph-file-xls"></i> Excel Sem Preço</button>

                            <button type="button" class="btn btn-primary" onclick="app.propostaTecnica.exportLMXLS(${loadIndex}, true)"><i class="ph ph-file-xls"></i> Excel Com Preço</button>

                        </div>

                    </div>

                </div>

            </div>

        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

    },



    async exportLMXLS(loadIndex, withPrice) {

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        const tipicos = store.getState().tipicos || [];



        app.toast('Exportando Excel...', 'info');



        try {

            let groupedData = [];



            if (loadIndex !== null && loadIndex !== undefined) {

                // Exportar carga única

                const load = eq.loads[loadIndex];

                if (!load) return;

                const typical = tipicos.find(t => t.id === load.typicalId);

                if (typical) {

                    groupedData.push({

                        carga: load,

                        typical: typical,

                        items: typical.items || []

                    });

                }

            } else {

                // Exportar todas as cargas do painel

                (eq.loads || []).forEach(load => {

                    const typical = tipicos.find(t => t.id === load.typicalId);

                    if (typical) {

                        groupedData.push({

                            carga: load,

                            typical: typical,

                            items: typical.items || []

                        });

                    }

                });

            }



            if (groupedData.length === 0) {

                app.toast('Nenhum dado para exportar. Verifique se as cargas possuem típicos associados.', 'warning');

                return;

            }



            const response = await fetch('http://localhost:8082/api/export-lm', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ 

                    items: groupedData,

                    dvtNumber: data.codigo || 'LM',

                    withPrices: withPrice

                })

            });



            if (!response.ok) throw new Error('Falha na exportação');



            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');

            a.href = url;

            a.download = `LM_${eq.tag}_${withPrice ? 'C_Preco' : 'S_Preco'}.xlsx`;

            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);

            document.body.removeChild(a);

            app.toast('Exportação concluída!', 'success');

        } catch (e) {

            app.toast('Erro ao exportar: ' + e.message, 'error');

        }

    },



    async syncLoadsFromCalculations(eqTag) {

        app.toast(`Sincronizando cargas para ${eqTag}...`, 'info');

        

        const state = store.getState();

        // Os cálculos agora podem vir de diversas fontes, mas o padrão é state.calculosEletricos

        const calcs = state.calculosEletricos || [];

        

        // Filtra as cargas que pertencem a este equipamento (TAG)

        const relevantLoads = calcs.filter(c => c.painelTag === eqTag || c.painel === eqTag);

        

        if (relevantLoads.length === 0) {

            app.toast(`Nenhuma carga encontrada para ${eqTag} nos cálculos.`, 'warning');

            return;

        }



        const data = state.activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        

        if (eq) {

            eq.loads = relevantLoads.map(l => ({

                tag: l.tag,

                desc: l.descricao || l.desc,

                power: l.potenciaCvKw || l.modelStr,

                corrente: l.correnteA || l.currentStr,

                typical: l.partidaTipo || l.typical,

                disjuntor: l.disjuntor || l.suggestedDisjuntor || '',

                cabo: l.cabo || l.suggestedCable || ''

            }));

            store.setState({ activeTechnicalProposal: data });

            app.toast(`${relevantLoads.length} carga(s) sincronizada(s).`, 'success');

            this.renderModal(data);

        }

    },



    async save() {

        console.log("[PropostaTecnica] Save initiated...");

        try {

            const form = document.getElementById('form-proposta-tecnica');

            if (!form) return;

            const formData = new FormData(form);

            const data = store.getState().activeTechnicalProposal;



            if (!data) {

                app.toast('Erro: Dados da proposta não encontrados.', 'error');

                return;

            }



            // Captura de dados baseada na aba ativa (para evitar sobrescrever com null se o campo não estiver no DOM)

            if (this.activeTab === 'geral') {

                data.cliente = formData.get('cliente') || data.cliente;

                data.codigo = formData.get('codigo') || data.codigo;

                data.data_emissao = formData.get('data_emissao') || data.data_emissao;

                data.aos_cuidados = formData.get('aos_cuidados') || data.aos_cuidados;

                data.email = formData.get('email') || data.email;

                data.telefone = formData.get('telefone') || data.telefone;

                data.projeto = formData.get('projeto') || data.projeto;

                data.referencia = formData.get('referencia') || data.referencia;

                data.objeto = formData.get('objeto') || data.objeto;

                data.localizacao = formData.get('localizacao') || data.localizacao;

                data.logo_base64 = formData.get('logo_base64') || data.logo_base64;

                data.client_logo_base64 = formData.get('client_logo_base64') || data.client_logo_base64;

                data.watermark_base64 = formData.get('watermark_base64') || data.watermark_base64;

            }



            // Capturar Escopo SEMPRE (se existir no DOM)
            const scopeRows = form.querySelectorAll('.scope-row');
            if (scopeRows.length > 0) {
                const scopeItems = [];
                scopeRows.forEach(row => {
                    const isAuto    = row.dataset.auto === '1';
                    const isSeu     = row.dataset.isSeu === '1';
                    const isSeuComp = row.dataset.isSeuComp === '1';
                    const item = {
                        desc: row.querySelector('input[name="scope_desc"]')?.value || '',
                        dvt:  row.querySelector('input[name="scope_dvt"]')?.checked  || false,
                        cli:  row.querySelector('input[name="scope_cli"]')?.checked  || false
                    };
                    if (isAuto)    { item.auto = true; item.equipTag = row.dataset.equipTag || ''; }
                    if (isSeu)     { item.isSeu = true; }
                    if (isSeuComp) { item.isSeuComp = true; item.parentSeu = row.dataset.parentSeu || ''; }
                    scopeItems.push(item);
                });
                data.scopeItems = scopeItems;
            }



            // Captura de dados baseada na aba ativa

            if (this.activeTab === 'geral') {

            } else if (this.activeTab === 'vendor') {

                const vendors = [];
                const rows = form.querySelectorAll('.vendor-row');
                rows.forEach((row, i) => {
                    const compEl = row.querySelector('td:first-child');
                    const comp = compEl ? compEl.textContent.trim() : '';
                    const opt = formData.get(`ven_opt_${i}`);
                    const optEspecifique = formData.get(`ven_opt_especifique_${i}`) || '';
                    vendors.push({
                        comp,
                        brand: formData.get(`ven_brand_${i}`),
                        opt,
                        optEspecifique: opt === '__OUTRO__' ? optEspecifique : ''
                    });
                });
                data.vendorList = vendors;

            } else if (this.activeTab === 'revisoes') {

                // Capturar revisões

                const revisions = [];

                const rows = form.querySelectorAll('.revision-row');

                rows.forEach((row, i) => {

                    revisions.push({

                        no: formData.get(`rev_no_${i}`),

                        desc: formData.get(`rev_desc_${i}`),

                        elab: formData.get(`rev_elab_${i}`),

                        verif: formData.get(`rev_verif_${i}`),

                        aprov: formData.get(`rev_aprov_${i}`),

                        data: (() => {

                            const val = formData.get(`rev_data_${i}`);

                            if(!val) return '';

                            if(val.includes('-')) {

                                const [y,m,d] = val.split('-');

                                return `${d}/${m}/${y}`;

                            }

                            return val;

                        })()

                    });

                });

                data.revisions = revisions;

            } else if (this.activeTab === 'assinaturas') {

                data.sig1_nome = formData.get('sig1_nome') || '';
                data.sig1_cargo = formData.get('sig1_cargo') || '';
                data.sig1_tel = formData.get('sig1_tel') || '';
                data.sig1_cel = formData.get('sig1_cel') || '';
                data.sig1_email = formData.get('sig1_email') || '';
                data.sig2_nome = formData.get('sig2_nome') || '';
                data.sig2_cargo = formData.get('sig2_cargo') || '';
                data.sig2_tel = formData.get('sig2_tel') || '';
                data.sig2_cel = formData.get('sig2_cel') || '';
                data.sig2_email = formData.get('sig2_email') || '';
                data.sig3_nome = formData.get('sig3_nome') || '';
                data.sig3_cargo = formData.get('sig3_cargo') || '';
                data.sig3_tel = formData.get('sig3_tel') || '';
                data.sig3_cel = formData.get('sig3_cel') || '';
                data.sig3_email = formData.get('sig3_email') || '';

            } else if (this.activeTab === 'exclusions') {

                this._captureExclusionsEdits();

            } else if (this.activeTab === 'equipments') {

                this.captureEquipmentData();

            }



            // Validação final antes de enviar (usa o que já está no 'data' do state)

            if (!data.cliente) {

                app.toast('Atenção: O campo Cliente (na aba Dados Gerais) é obrigatório para salvar no servidor.', 'warning');
                
                // Sincroniza estado local para não perder o que foi digitado na aba ativa
                store.setState({ activeTechnicalProposal: data });
                this.renderModal(data);

                return;

            }



            app.toast('Salvando proposta...', 'info');

            console.log("[PropostaTecnica] Data to be saved:", JSON.stringify(data.equipments.map(e => e.tag)));

            const res = await fetch('http://localhost:8082/api/save-proposal', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({

                    dvtFolder: window.app.currentDvt?.folder,

                    type: 'tecnica',

                    content: data

                })

            });

            const result = await res.json();

            if (result.success) {

                app.toast('Proposta salva com sucesso!', 'success');

                // Sincroniza o store com os dados capturados
                store.setState({ activeTechnicalProposal: data });

                // Forçar renderização do modal para atualizar a lista lateral de equipamentos e outros campos

                this.renderModal(data);

            } else {

                throw new Error(result.error || 'Erro desconhecido no servidor');

            }

        } catch (e) {

            console.error("[PropostaTecnica] Save Error:", e);

            app.toast('Erro ao salvar: ' + e.message, 'error');

        }

    },

    async saveAsNew() {
        try {
            const form = document.getElementById('form-proposta-tecnica');
            if (!form) { app.toast('Formulário não encontrado.', 'warning'); return; }
            const formData = new FormData(form);
            let data = store.getState().activeTechnicalProposal;
            if (!data) {
                app.toast('Nenhuma proposta ativa para duplicar.', 'warning');
                return;
            }
            data.cliente = formData.get('cliente') || data.cliente;
            data.projeto = formData.get('projeto') || data.projeto;
            data.codigo = formData.get('codigo') || data.codigo;
            data.objeto = formData.get('objeto') || data.objeto;
            data.localizacao = formData.get('localizacao') || data.localizacao;
            data.data_emissao = formData.get('data_emissao') || data.data_emissao;

            this._openSaveAsModal(JSON.parse(JSON.stringify(data)));
        } catch (e) {
            console.error('[saveAsNew] Error:', e);
            app.toast('Erro: ' + e.message, 'error');
        }
    },

    _openSaveAsModal(sourceData) {
        if (document.getElementById('modal-save-as')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-save-as';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 480px;">
                <div class="modal-header" style="background: #1e3a8a; color: white;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-copy"></i> Salvar como Nova Proposta
                    </h3>
                    <button class="btn btn-ghost" style="color: white;" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
                        Uma cópia da proposta atual será salva em um novo DVT.
                    </p>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="font-weight: 600; font-size: 13px; margin-bottom: 8px; display: block;">DVT de destino:</label>
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <label style="flex: 1; padding: 8px 12px; border: 2px solid #1e3a8a; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px; background: #eff6ff;">
                                <input type="radio" name="sas-dvt-option" value="new" checked onchange="document.getElementById('sas-dvt-new-fields').style.display='block'; document.getElementById('sas-dvt-existing-fields').style.display='none';">
                                Criar novo DVT
                            </label>
                            <label style="flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px;">
                                <input type="radio" name="sas-dvt-option" value="existing" onchange="document.getElementById('sas-dvt-new-fields').style.display='none'; document.getElementById('sas-dvt-existing-fields').style.display='block'; (window.propostaTecnicaModule||window.propostaTecnicaModule).loadDvtListSas();">
                                DVT existente
                            </label>
                        </div>
                        <div id="sas-dvt-new-fields">
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="sas-dvt-number" class="form-control" value="${window.app.generateDvtNumber ? window.app.generateDvtNumber() : 'DVT-' + new Date().getFullYear() + '-XXXX'}" style="flex: 1; font-weight: 700;">
                                <input type="text" id="sas-dvt-title" class="form-control" placeholder="Título do Projeto" value="${this._escapeHtml(sourceData.projeto || '')}" style="flex: 2;">
                            </div>
                        </div>
                        <div id="sas-dvt-existing-fields" style="display: none;">
                            <select id="sas-dvt-select" class="form-control">
                                <option value="">Carregando DVTs...</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block;">Cliente</label>
                            <input type="text" id="sas-cliente" class="form-control" value="${this._escapeHtml(sourceData.cliente || '')}">
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 600; font-size: 13px; margin-bottom: 4px; display: block;">Projeto</label>
                            <input type="text" id="sas-projeto" class="form-control" value="${this._escapeHtml(sourceData.projeto || '')}">
                        </div>
                    </div>
                    <div id="sas-status" style="font-size: 13px; color: #64748b; margin-top: 12px;"></div>
                </div>
                <div class="modal-footer" style="padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn btn-ghost" onclick="document.getElementById('modal-save-as').remove()">Cancelar</button>
                    <button class="btn btn-primary" id="sas-btn-confirmar" style="background: #1e3a8a; display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-copy"></i> Salvar como Nova
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal._sourceData = sourceData;

        document.getElementById('sas-btn-confirmar').addEventListener('click', () => {
            this._confirmSaveAs(modal);
        });
    },

    loadDvtListSas() {
        const select = document.getElementById('sas-dvt-select');
        if (!select) return;
        fetch('http://localhost:8082/api/list-dvts')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.dvts) {
                    select.innerHTML = '<option value="">Selecione um DVT...</option>'
                        + data.dvts.map(d => `<option value="${d}">${d}</option>`).join('');
                } else {
                    select.innerHTML = '<option value="">Nenhum DVT encontrado</option>';
                }
            })
            .catch(() => { select.innerHTML = '<option value="">Erro ao carregar</option>'; });
    },

    async _confirmSaveAs(modal) {
        const statusEl = document.getElementById('sas-status');
        const btnConfirmar = document.getElementById('sas-btn-confirmar');
        const sourceData = modal._sourceData;
        if (!sourceData) return;

        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '<i class="ph ph-spinner" style="animation: spin 1s linear infinite;"></i> Salvando...';
        statusEl.textContent = 'Preparando...';

        try {
            const isNewDvt = document.querySelector('input[name="sas-dvt-option"]:checked')?.value === 'new';
            let targetFolder = '';

            if (isNewDvt) {
                statusEl.textContent = 'Criando novo DVT...';
                const dvtNumber = document.getElementById('sas-dvt-number')?.value || '';
                const dvtTitle = document.getElementById('sas-dvt-title')?.value || '';
                const clientName = document.getElementById('sas-cliente')?.value || '';
                if (!dvtTitle) {
                    app.toast('Informe o título do projeto.', 'warning');
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
                    statusEl.textContent = '';
                    return;
                }
                targetFolder = await window.app.createDvtSimple(dvtNumber, dvtTitle, clientName);
            } else {
                targetFolder = document.getElementById('sas-dvt-select')?.value;
                if (!targetFolder) {
                    app.toast('Selecione um DVT existente.', 'warning');
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
                    statusEl.textContent = '';
                    return;
                }
            }

            statusEl.textContent = 'Salvando cópia...';
            const options = {
                cliente: document.getElementById('sas-cliente')?.value || undefined,
                projeto: document.getElementById('sas-projeto')?.value || undefined
            };

            const result = await window.app.duplicateProposal('tecnica', sourceData, targetFolder, options);
            if (result.success) {
                app.toast('Proposta duplicada com sucesso!', 'success');
                modal.remove();
            }
        } catch (e) {
            console.error('[saveAsNew]', e);
            app.toast('Erro: ' + e.message, 'error');
            statusEl.textContent = 'Erro: ' + e.message;
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
        }
    },

    _escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    getContactOptionsHTML(clientName, selectedValue = '') {

        const clients = store.getState().clientes || [];

        const client = clients.find(c => c.razaoSocial === clientName);

        const contacts = [];
        if (client) {
            if (Array.isArray(client.contatos) && client.contatos.length > 0) {
                contacts.push(...client.contatos);
            } else if (client.contatoNome || client.email || client.telefone) {
                contacts.push({
                    nome: client.contatoNome || '',
                    email: client.email || '',
                    telefone: client.telefone || '',
                    cargo: client.contatoCargo || ''
                });
            }
        }

        if (contacts.length === 0) {
            return '<option value="">Nenhum contato encontrado</option>';
        }

        return contacts.map(c => `
            <option value="${c.nome}" ${selectedValue === c.nome ? 'selected' : ''}>${c.nome}</option>
        `).join('');

    },



    handleClientChange(clientName) {

        console.log("[PropostaTecnica] Client Change:", clientName);

        const slug = (s) => (s || '').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const clients = store.getState().clientes || [];
        const client = clients.find(c => slug(c.razaoSocial) === slug(clientName));

        // Build contact list from array or legacy fallback fields
        const contacts = [];
        if (client) {
            if (Array.isArray(client.contatos) && client.contatos.length > 0) {
                contacts.push(...client.contatos);
            } else if (client.contatoNome || client.email || client.telefone) {
                contacts.push({
                    nome: client.contatoNome || '',
                    email: client.email || '',
                    telefone: client.telefone || '',
                    cargo: client.contatoCargo || ''
                });
            }
        }

        let primeiroContato = contacts[0] || null;

        const aosCuidados = document.getElementById('pt_aos_cuidados');
        if (aosCuidados) {
            aosCuidados.innerHTML = this.getContactOptionsHTML(clientName);
            if (primeiroContato) {
                aosCuidados.value = primeiroContato.nome || '';
            }
        }

        // 2. Preencher email e telefone do contato
        const emailInput = document.getElementById('pt_email');
        const telInput = document.getElementById('pt_telefone');
        if (emailInput) emailInput.value = (primeiroContato && primeiroContato.email) || '';
        if (telInput) telInput.value = (primeiroContato && primeiroContato.telefone) || '';

        // 3. Buscar e preencher Localização
        const locInput = document.getElementById('pt_localizacao');

        if (client && locInput) {

            const cidade = client.cidade || client.city || '';

            const estado = client.estado || client.uf || '';

            if (cidade || estado) {

                locInput.value = `${String(cidade).trim()}${estado ? '-' + String(estado).trim().toUpperCase() : ''}`;

            } else {

                locInput.value = '';

            }

        } else if (locInput) {

            locInput.value = '';

        }

        // 4. Disparar preenchimento de email/telefone pelo contato selecionado
        if (aosCuidados && primeiroContato) {
            this.handleContactSelection(primeiroContato.nome);
        }

        // 5. Auto-carregar logo do cliente
        const clPreview = document.getElementById('pt_client_logo_preview');
        const clContainer = document.getElementById('pt_client_logo_preview_container');
        const clInput = document.getElementById('pt_client_logo_base64');
        if (client && client.logo && clPreview && clContainer && clInput) {
            clPreview.src = client.logo;
            clContainer.style.display = 'block';
            clInput.value = client.logo;
        }

    },



    updateContactDropdown(clientName) {

        // Mantido para compatibilidade, mas redireciona para a nova lógica

        this.handleClientChange(clientName);

    },



    handleContactSelection(contactName) {

        const clientName = document.getElementById('pt_cliente').value;

        const clients = store.getState().clientes || [];

        const client = clients.find(c => c.razaoSocial === clientName);

        const contacts = [];
        if (client) {
            if (Array.isArray(client.contatos) && client.contatos.length > 0) {
                contacts.push(...client.contatos);
            } else if (client.contatoNome || client.email || client.telefone) {
                contacts.push({
                    nome: client.contatoNome || '',
                    email: client.email || '',
                    telefone: client.telefone || '',
                    cargo: client.contatoCargo || ''
                });
            }
        }

        const contact = contacts.find(c => c.nome === contactName);
        if (contact) {
            const emailInput = document.getElementById('pt_email');
            const telInput = document.getElementById('pt_telefone');
            if (emailInput) emailInput.value = contact.email || '';
            if (telInput) telInput.value = contact.telefone || '';
        }

    },



    handleLogoUpload(input) {

        if (!input.files || !input.files[0]) return;

        const reader = new FileReader();

        reader.onload = (e) => {

            const base64 = e.target.result;

            document.getElementById('pt_logo_preview').src = base64;

            document.getElementById('pt_logo_preview_container').style.display = 'block';

            document.getElementById('pt_logo_base64').value = base64;

        };

        reader.readAsDataURL(input.files[0]);

    },



    handleClientLogoUpload(input) {

        if (!input.files || !input.files[0]) return;

        const reader = new FileReader();

        reader.onload = (e) => {

            const base64 = e.target.result;

            document.getElementById('pt_client_logo_preview').src = base64;

            document.getElementById('pt_client_logo_preview_container').style.display = 'block';

            document.getElementById('pt_client_logo_base64').value = base64;

        };

        reader.readAsDataURL(input.files[0]);

    },



    handleWatermarkUpload(input) {

        if (!input.files || !input.files[0]) return;

        const reader = new FileReader();

        reader.onload = (e) => {

            const base64 = e.target.result;

            document.getElementById('pt_watermark_preview').src = base64;

            document.getElementById('pt_watermark_preview_container').style.display = 'block';

            document.getElementById('pt_watermark_base64').value = base64;

        };

        reader.readAsDataURL(input.files[0]);

    },



    async edit(proposal) {

        this.viewMode = 'form';

        this.activeTab = 'geral';

        this.activeEquipmentIndex = 0;

        this.activeSubTab = 'technical';

        this.cargasSubView = 'edit';

        

        // Migração para estrutura hierárquica se necessário

        if (!proposal.equipments || proposal.equipments.length === 0) {

            proposal.equipments = [{

                id: Date.now(),

                tag: 'TAG-MIGRADO',

                type: 'CCM-BT',

                norms: proposal.norms || [],

                technical: { tensao: '380V' },

                loads: proposal.detailedLoadItems || []

            }];

        }

        

        // Deep copy para evitar mutacao cruzada entre propostas
        const proposalCopy = JSON.parse(JSON.stringify(proposal));
        store.setState({ activeTechnicalProposal: proposalCopy });

        this.renderModal(proposalCopy);

        if (proposalCopy.cliente) {
            setTimeout(() => this.updateContactDropdown(proposalCopy.cliente), 50);
        }
    },



    switchCargasSubView(view) {

        this.captureEquipmentData();

        this.cargasSubView = view;

        this.renderModal(store.getState().activeTechnicalProposal);

    },



    renderLoadsEdit(eq, tipicos) {

        return `

            <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 15px;">

                <div style="display: flex; gap: 8px; align-items: center;">

                    <button type="button" class="btn-link" onclick="window.propostaTecnicaModule.clearLoads()" style="color: #ef4444; font-size: 11px; text-decoration: none; display: flex; align-items: center; gap: 4px; border: none; background: none; cursor: pointer;">

                        <i class="ph ph-trash"></i> Limpar

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.importLoads()" style="background: #0284c7; color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-microsoft-excel-logo"></i> Importar Excel

                    </button>

                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.loadLoadsModel()" style="font-size: 11px; background: white; border: 1px solid #e2e8f0; border-radius: 4px;">

                        <i class="ph ph-tray-arrow-down"></i> Carregar Modelo

                    </button>

                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.saveLoadsList()" style="font-size: 11px; background: white; border: 1px solid #e2e8f0; border-radius: 4px;">

                        <i class="ph ph-floppy-disk"></i> Salvar Lista

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.addLoadRow()" style="background: #0f172a; color: white; font-size: 11px; border-radius: 4px; padding: 6px 12px; font-weight: 700;">

                        <i class="ph ph-plus"></i> Nova Carga

                    </button>

                </div>

            </div>



            <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 4px; overflow-x: auto; background: white;">

                <table class="w-full" style="font-size: 10px; border-collapse: collapse; min-width: 1000px;">

                    <thead>

                        <tr style="background: #22c55e; border-bottom: 2px solid #e2e8f0; color: #fff; text-transform: uppercase;">

                            <th style="padding: 10px; text-align: left; width: 60px;">TAG</th>

                            <th style="padding: 10px; text-align: left; width: 320px;">DESCRIÇÃO</th>

                            <th style="padding: 10px; text-align: center; width: 80px;">POTÊNCIA (CV)</th>

                            <th style="padding: 10px; text-align: center; width: 80px;">TENSÃO (V)</th>

                            <th style="padding: 10px; text-align: center; width: 80px;">COR. APROX (A)</th>

                            <th style="padding: 10px; text-align: center; width: 140px;">REGIME DE TRABALHO</th>

                            <th style="padding: 10px; text-align: center; width: 60px;">TIPO</th>

                            <th style="padding: 10px; text-align: left;">TÍPICO DE PARTIDA (COMPOSIÇÃO)</th>

                            <th style="padding: 10px; width: 85px;"></th>

                        </tr>

                    </thead>

                    <tbody id="loads-body">

                        ${(eq.loads || []).map((load, idx) => `

                            <tr class="detailed-load-row" style="border-bottom: 1px solid #f1f5f9;">

                                <td style="padding: 4px;"><input type="text" name="dload_tag_${idx}" class="form-control" value="${load.tag || ''}" style="font-size: 11px; font-weight: 700; text-align: center; border-radius: 4px; height: 32px;"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_desc_${idx}" class="form-control" value="${load.desc || ''}" style="font-size: 11px; border-radius: 4px; height: 32px;"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_power_${idx}" class="form-control" value="${load.power || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.calculateApproxCurrent(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_tensao_${idx}" class="form-control" value="${load.tensao || '380'}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.calculateApproxCurrent(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_current_${idx}" class="form-control" value="${load.current || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; background: #f8fafc; height: 32px;" readonly></td>

                                <td style="padding: 4px;">

                                    <select name="dload_regime_${idx}" class="form-control" style="font-size: 11px; height: 32px; border-radius: 4px; text-align: center; padding: 0 4px;">

                                        <option value="S1" ${load.regime === 'S1' ? 'selected' : ''}>S1 (Constante)</option>

                                        <option value="S2" ${load.regime === 'S2' ? 'selected' : ''}>S2 (Curta)</option>

                                        <option value="S3" ${load.regime === 'S3' ? 'selected' : ''}>S3 (Intermit.)</option>

                                    </select>

                                </td>

                                <td style="padding: 4px;"><input type="text" name="dload_type_${idx}" class="form-control" value="${load.type || 'IF'}" style="text-align: center; font-size: 11px; font-weight: 700; border-radius: 4px; height: 32px;"></td>

                                <td style="padding: 4px;">

                                    <select name="dload_typicalId_${idx}" class="form-control" style="font-size: 11px; height: 32px; background: #fffbeb; border-color: #fde68a; border-radius: 4px; padding: 0 8px;" onchange="window.propostaTecnicaModule.updateLoadFromTypical(${idx})">

                                        <option value="">-- Selecione --</option>

                                        ${tipicos.map(t => `<option value="${t.id}" ${load.typicalId === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}

                                    </select>

                                </td>

                                <td style="padding: 4px; text-align: center;">

                                    <div style="display: flex; gap: 2px; justify-content: center;">

                                        ${store.canEdit() ? `<button type="button" onclick="window.propostaTecnicaModule.duplicateLoad(${idx})" class="btn-icon" style="color: #64748b; background: #f1f5f9; border: 1px solid #e2e8f0; width: 26px; height: 26px; border-radius: 4px;" title="Duplicar"><i class="ph ph-copy"></i></button>` : ''}

                                        ${store.canDelete() ? `<button type="button" onclick="window.propostaTecnicaModule.removeLoad(${idx})" class="btn-icon" style="color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2; width: 26px; height: 26px; border-radius: 4px;" title="Excluir"><i class="ph ph-trash"></i></button>` : ''}

                                    </div>

                                </td>

                            </tr>

                        `).join('')}

                        ${(eq.loads || []).length === 0 ? '<tr><td colspan="9" style="padding: 40px; text-align: center; color: #94a3b8;">Nenhuma carga definida. Clique em "+ Nova Carga" ou importe do Excel.</td></tr>' : ''}

                    </tbody>

                </table>

            </div>

        `;

    },



    addLoadRow() {

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        if (!eq.loads) eq.loads = [];

        eq.loads.push({ tag: `M${eq.loads.length + 1}`, desc: '', power: '', tensao: '380', regime: 'S1', type: 'IF' });

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },



    duplicateLoad(index) {

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        const source = eq.loads[index];

        eq.loads.splice(index + 1, 0, { ...source, tag: source.tag + '_COPY' });

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },



    removeLoad(index) {

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        eq.loads.splice(index, 1);

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },



    clearLoads() {

        if (!confirm('Deseja realmente apagar TODAS as cargas deste painel?')) return;

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        const eq = data.equipments[this.activeEquipmentIndex];

        eq.loads = [];

        store.setState({ activeTechnicalProposal: data });

        this.renderModal(data);

    },



    calculateApproxCurrent(index) {

        const row = document.querySelectorAll('.detailed-load-row')[index];

        if (!row) return;

        const powerInput = row.querySelector(`[name="dload_power_${index}"]`);

        const tensaoInput = row.querySelector(`[name="dload_tensao_${index}"]`);

        const currentInput = row.querySelector(`[name="dload_current_${index}"]`);

        

        const power = parseFloat((powerInput.value || '0').replace(',', '.'));

        const tensao = parseFloat((tensaoInput.value || '380').replace(',', '.'));

        

        if (power > 0 && tensao > 0) {

            // Cálculo simplificado: I = (P_cv * 735.5) / (sqrt(3) * V * FP * Rend)

            // Usando FP=0.85 e Rend=0.90 como padrão médio

            const current = (power * 735.5) / (Math.sqrt(3) * tensao * 0.85 * 0.90);

            currentInput.value = current.toFixed(2).replace('.', ',');

        } else {

            currentInput.value = '';

        }

    },



    loadLoadsModel() {
        const loadLists = store.getState().loadLists || [];
        const ptLists = loadLists.filter(l => l.source === 'proposta-tecnica');

        if (ptLists.length === 0) {
            app.toast('Nenhum modelo de lista salvo. Use "Salvar Lista" primeiro.', 'info');
            return;
        }

        if (document.getElementById('modal-load-loads')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-load-loads';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 520px;">
                <div class="modal-header" style="background: #0f172a; color: white;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-tray-arrow-down"></i> Carregar Lista de Cargas
                    </h3>
                    <button class="btn btn-ghost" style="color: white;" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body" style="padding: 16px;">
                    ${ptLists.length === 0 ? '<p style="color: #94a3b8; text-align: center; padding: 20px;">Nenhum modelo salvo.</p>' : `
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${ptLists.map((l, i) => `
                                <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 600; font-size: 14px; color: #0f172a;">${l.name}</div>
                                        <div style="font-size: 12px; color: #64748b;">${l.items.length} carga(s) &middot; ${new Date(l.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <button type="button" class="btn btn-sm" style="background: #0f172a; color: white; border-radius: 4px; padding: 6px 14px; font-size: 12px;" onclick="window.propostaTecnicaModule._confirmLoadList('${l.id}')">
                                        <i class="ph ph-check"></i> Carregar
                                    </button>
                                    <button type="button" class="btn btn-sm" style="background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; border-radius: 4px; padding: 6px 10px; font-size: 12px;" onclick="window.propostaTecnicaModule.deleteLoadList('${l.id}')" title="Excluir modelo">
                                        <i class="ph ph-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _confirmLoadList(id) {
        const loadLists = store.getState().loadLists || [];
        const selected = loadLists.find(l => l.id === id);
        if (!selected) return;

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        if (eq.loads && eq.loads.length > 0) {
            if (!confirm(`Isso substituirá ${eq.loads.length} carga(s) existente(s). Continuar?`)) return;
        }

        eq.loads = JSON.parse(JSON.stringify(selected.items));
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);

        const modal = document.getElementById('modal-load-loads');
        if (modal) modal.remove();

        app.toast(`Lista "${selected.name}" carregada (${selected.items.length} cargas).`, 'success');
    },

    saveLoadsList() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq || !eq.loads || eq.loads.length === 0) {
            app.toast('Não há cargas para salvar.', 'warning');
            return;
        }

        let name = prompt('Nome da Lista de Cargas:', `Cargas - ${eq.tag} - ${new Date().toLocaleDateString()}`);
        if (!name) return;

        const loadLists = store.getState().loadLists || [];
        const existingIndex = loadLists.findIndex(l => l.name === name && l.source === 'proposta-tecnica');

        if (existingIndex >= 0) {
            if (!confirm(`Já existe uma lista "${name}". Deseja substituir?`)) return;
            loadLists[existingIndex] = {
                ...loadLists[existingIndex],
                items: JSON.parse(JSON.stringify(eq.loads)),
                updatedAt: new Date().toISOString()
            };
        } else {
            loadLists.push({
                id: crypto.randomUUID(),
                name,
                source: 'proposta-tecnica',
                items: JSON.parse(JSON.stringify(eq.loads)),
                createdAt: new Date().toISOString()
            });
        }

        store.setState({ loadLists: [...loadLists] });
        app.toast(`Lista "${name}" salva com sucesso!`, 'success');
    },

    deleteLoadList(id) {
        const loadLists = store.getState().loadLists || [];
        const target = loadLists.find(l => l.id === id);
        if (!target) return;

        if (!confirm(`Excluir modelo "${target.name}"?`)) return;

        const newList = loadLists.filter(l => l.id !== id);
        store.setState({ loadLists: newList });

        const modal = document.getElementById('modal-load-loads');
        if (modal) modal.remove();
        this.loadLoadsModel();

        app.toast(`Modelo "${target.name}" excluído.`, 'success');
    },



    importLoads() {

        const input = document.createElement('input');

        input.type = 'file';

        input.accept = '.xlsx, .xls, .csv';

        input.onchange = (e) => {

            const file = e.target.files[0];

            if (!file) return;



            app.toast('Lendo arquivo...', 'info');

            const reader = new FileReader();

            const isExcel = /\.(xlsx|xls)$/i.test(file.name);



            reader.onload = (evt) => {

                try {

                    let data = [];

                    if (isExcel) {

                        const bdata = new Uint8Array(evt.target.result);

                        const workbook = XLSX.read(bdata, { type: 'array' });

                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                        data = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

                    } else {

                        const csv = evt.target.result;

                        const lines = csv.split('\n').filter(l => l.trim());

                        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

                        data = lines.slice(1).map(line => {

                            const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));

                            const obj = {};

                            headers.forEach((h, i) => obj[h] = vals[i]);

                            return obj;

                        });

                    }



                    this.processImportedLoads(data);

                } catch (err) {

                    console.error('[PropostaTecnica] Import Error:', err);

                    app.toast('Erro ao importar arquivo: ' + err.message, 'error');

                }

            };



            if (isExcel) reader.readAsArrayBuffer(file);

            else reader.readAsText(file);

        };

        input.click();

    },



    processImportedLoads(data) {

        if (!data || data.length === 0) {

            app.toast('Nenhum dado encontrado no arquivo.', 'warning');

            return;

        }



        this.captureEquipmentData();

        const proposal = store.getState().activeTechnicalProposal;

        const eq = proposal.equipments[this.activeEquipmentIndex];

        

        const findKey = (row, candidates) => {

            const keys = Object.keys(row);

            return keys.find(k => candidates.some(c => k.toLowerCase().includes(c.toLowerCase())));

        };



        let count = 0;

        data.forEach(row => {

            const tagKey = findKey(row, ['tag', 'identificação', 'id']);

            const descKey = findKey(row, ['descri', 'description', 'nome']);

            const powerKey = findKey(row, ['potencia', 'potência', 'power', 'cv', 'kw']);

            const tensaoKey = findKey(row, ['tensao', 'tensão', 'voltage', 'volts']);

            const regimeKey = findKey(row, ['regime', 'trabalho', 'duty']);

            const typeKey = findKey(row, ['tipo', 'type', 'partida']);



            if (tagKey || descKey) {

                eq.loads.push({

                    tag: row[tagKey] || `M${eq.loads.length + 1}`,

                    desc: row[descKey] || '',

                    power: row[powerKey] || '',

                    tensao: row[tensaoKey] || '380',

                    regime: row[regimeKey] || 'S1',

                    type: row[typeKey] || 'IF',

                    current: ''

                });

                count++;

            }

        });



        // Deep copy para evitar mutacao cruzada entre propostas
        const proposalCopy = JSON.parse(JSON.stringify(proposal));
        store.setState({ activeTechnicalProposal: proposalCopy });

        this.renderModal(proposalCopy);

        app.toast(`${count} cargas importadas com sucesso!`, 'success');

    },



    renderLoadsLM(eq) {

        const tipicos = store.getState().tipicos || [];

        const loads = eq.loads || [];

        

        if (loads.length === 0) {

            return `<div style="padding: 40px; text-align: center; color: #94a3b8; background: white; border-radius: 8px; border: 1px dashed #e2e8f0;">Nenhuma carga cadastrada para gerar a LM.</div>`;

        }



        return `

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">

                <div style="display: flex; gap: 10px; flex: 1;">

                    <div style="position: relative; flex: 1; max-width: 400px;">

                        <i class="ph ph-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>

                        <input type="text" id="lm-search-input" class="form-control" placeholder="Filtrar materiais nesta lista..." style="padding-left: 35px; font-size: 12px; border-radius: 4px;" value="${this.lmFilterQuery}" oninput="window.propostaTecnicaModule.filterLM(this.value)">

                    </div>

                </div>

                <div style="display: flex; gap: 8px;">

                    <button type="button" class="btn btn-sm btn-outline" onclick="app.propostaTecnica.exportLMXLS(null, false)" style="font-size: 11px; background: white; border: 1px solid #e2e8f0; border-radius: 4px;">

                        <i class="ph ph-file-xls"></i> Exportar Excel

                    </button>

                    <button type="button" class="btn btn-sm btn-outline" onclick="app.propostaTecnica.exportLMXLS(null, true)" style="font-size: 11px; background: white; border: 1px solid #e2e8f0; border-radius: 4px;">

                        <i class="ph ph-file-xls"></i> Exportar Excel (Preço)

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.switchCargasSubView('lm')" style="background: #0284c7; color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-arrows-clockwise"></i> Atualizar Lista

                    </button>

                </div>

            </div>



            <div style="display: flex; flex-direction: column; gap: 20px;">

                ${loads.map((load, idx) => {

                    const typical = tipicos.find(t => t.id === load.typicalId);

                    let items = typical ? (typical.items || []) : [];

                    

                    // Aplicar Filtro

                    if (this.lmFilterQuery) {

                        const q = this.lmFilterQuery.toLowerCase();

                        items = items.filter(i => 

                            (i.descricao && i.descricao.toLowerCase().includes(q)) ||

                            (i.modelo && i.modelo.toLowerCase().includes(q)) ||

                            (i.codigoFabricante && i.codigoFabricante.toLowerCase().includes(q)) ||

                            (i.fabricante && i.fabricante.toLowerCase().includes(q))

                        );

                        // Se não houver itens que coincidam com o filtro nesta carga, não renderizar o card

                        if (items.length === 0) return '';

                    }



                    const typicalName = typical ? typical.nome : 'Nenhum típico associado';

                    

                    return `

                        <div class="lm-group-card" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">

                            <div style="background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">

                                <div style="display: flex; align-items: center; gap: 10px;">

                                    <span style="background: #1e3a8a; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 12px;">${load.tag || '?' }</span>

                                    <span style="font-weight: 700; color: #334155; font-size: 13px;">${load.desc || 'Sem Descrição'}</span>

                                    <span style="color: #64748b; font-size: 12px; font-style: italic;">(${typicalName})</span>

                                </div>

                                <div style="font-size: 12px; font-weight: 700; color: #1e3a8a;">

                                    SUBTOTAL: ${app.formatCurrency(items.reduce((sum, item) => sum + (parseFloat(item.qtd) * parseFloat(item.custo || 0)), 0))}

                                </div>

                            </div>

                            <table class="w-full" style="font-size: 10px; border-collapse: collapse;">

                                <thead>

                                    <tr style="background: #22c55e; border-bottom: 1px solid #f1f5f9; color: #fff; text-transform: uppercase;">

                                        <th style="padding: 8px; text-align: center; width: 40px;">QTD</th>

                                        <th style="padding: 8px; text-align: left;">DESCRIÇÃO</th>

                                        <th style="padding: 8px; text-align: left; width: 120px;">MODELO</th>

                                        <th style="padding: 8px; text-align: left; width: 120px;">CÓD. FAB.</th>

                                        <th style="padding: 8px; text-align: left; width: 100px;">FABRICANTE</th>

                                        <th style="padding: 8px; text-align: center; width: 50px;">ICMS</th>

                                        <th style="padding: 8px; text-align: center; width: 50px;">IPI</th>

                                        <th style="padding: 8px; text-align: right; width: 80px;">UNIT.</th>

                                        <th style="padding: 8px; text-align: right; width: 80px;">TOTAL</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    ${items.map(item => `

                                        <tr style="border-bottom: 1px solid #f8fafc;">

                                            <td style="padding: 8px; text-align: center; font-weight: 700;">${item.qtd}</td>

                                            <td style="padding: 8px; color: #334155;">${item.descricao}</td>

                                            <td style="padding: 8px; color: #64748b;">${item.modelo || '-'}</td>

                                            <td style="padding: 8px; color: #64748b; font-family: monospace;">${item.codigoFabricante || '-'}</td>

                                            <td style="padding: 8px; color: #64748b;">${item.fabricante || '-'}</td>

                                            <td style="padding: 8px; text-align: center; color: #94a3b8;">${item.icms || '18'}%</td>

                                            <td style="padding: 8px; text-align: center; color: #94a3b8;">${item.ipi || '0'}%</td>

                                            <td style="padding: 8px; text-align: right; color: #64748b;">${app.formatCurrency(item.custo || 0)}</td>

                                            <td style="padding: 8px; text-align: right; font-weight: 700; color: #1e3a8a;">${app.formatCurrency(parseFloat(item.qtd) * parseFloat(item.custo || 0))}</td>

                                        </tr>

                                    `).join('')}

                                    ${items.length === 0 ? '<tr><td colspan="9" style="padding: 20px; text-align: center; color: #94a3b8;">Nenhum material vinculado a este típico.</td></tr>' : ''}

                                </tbody>

                            </table>

                            <div style="padding: 10px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">

                                <button type="button" class="btn btn-xs btn-outline" style="font-size: 10px; padding: 4px 8px;" onclick="app.propostaTecnica.openAddItemModal('${load.typicalId}')"><i class="ph ph-plus"></i> Incluir Itens</button>

                                <button type="button" class="btn btn-xs btn-outline" style="font-size: 10px; padding: 4px 8px;" onclick="app.tipicos.edit('${load.typicalId}')"><i class="ph ph-pencil"></i> Editar Itens</button>

                            </div>

                        </div>

                    `;

                }).join('')}

            </div>

        `;

    },

    openAddItemModal(typicalId) {
        const tipicos = store.getState().tipicos || [];
        const tipico = tipicos.find(t => t.id === typicalId);
        if (!tipico) return app.toast?.('Típico não encontrado.', 'error');

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-add-item-lm';
        modal.innerHTML = `
            <div class="modal" style="width:800px;max-width:90vw;">
                <div class="modal-header" style="background:#16a34a;color:white;">
                    <h3>Adicionar Itens — ${this._escapeHtml(tipico.nome)}</h3>
                    <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <div style="display:flex;gap:10px;margin-bottom:16px;">
                        <select id="ami-manufacturer" class="form-control" style="width:200px;" onchange="app.propostaTecnica._filterAddItems()">
                            <option value="">Todos os Fabricantes</option>
                        </select>
                        <input type="text" id="ami-filter-model" class="form-control" placeholder="Filtrar descrição..." oninput="app.propostaTecnica._filterAddItems()">
                        <input type="text" id="ami-filter-code" class="form-control" placeholder="Filtrar código..." oninput="app.propostaTecnica._filterAddItems()">
                    </div>
                    <div style="max-height:400px;overflow-y:auto;border:1px solid var(--color-border);border-radius:4px;">
                        <table class="w-full" style="font-size:13px;">
                            <thead><tr style="background:#f1f5f9;">
                                <th style="padding:10px;">DESCRIÇÃO</th>
                                <th style="padding:10px;width:120px;">MODELO</th>
                                <th style="padding:10px;width:130px;">CÓD. FAB.</th>
                                <th style="padding:10px;width:110px;">FABRICANTE</th>
                                <th style="padding:10px;width:100px;text-align:right;">UNIT. (R$)</th>
                                <th style="padding:10px;width:60px;text-align:center;">QTD</th>
                                <th style="padding:10px;width:50px;"></th>
                            </tr></thead>
                            <tbody id="ami-items-body"></tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <span style="font-size:12px;color:var(--color-text-muted);flex:1;">
                        Itens adicionados serão salvos no típico <b>${this._escapeHtml(tipico.nome)}</b>
                    </span>
                    <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.propostaTecnica._confirmAddItems('${typicalId}')" style="background:#16a34a;">
                        <i class="ph ph-check"></i> Concluído
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal._typicalId = typicalId;
        this._populateManufacturers(modal);
        this._renderAddItemList(modal);
    },

    _populateManufacturers(modal) {
        const all = store.getState().materiais || [];
        const unique = [...new Set(all.map(m => m.fabricante).filter(Boolean))].sort();
        const sel = modal.querySelector('#ami-manufacturer');
        if (sel) {
            unique.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                sel.appendChild(opt);
            });
        }
    },

    _renderAddItemList(modal) {
        const manufacturer = modal.querySelector('#ami-manufacturer')?.value || '';
        const filterModel  = (modal.querySelector('#ami-filter-model')?.value || '').toLowerCase();
        const filterCode   = (modal.querySelector('#ami-filter-code')?.value || '').toLowerCase();
        const tbody = modal.querySelector('#ami-items-body');
        if (!tbody) return;

        const all = store.getState().materiais || [];
        const filtered = all.filter(m => {
            if (manufacturer && m.fabricante !== manufacturer) return false;
            if (filterModel && !(m.descricao || '').toLowerCase().includes(filterModel)) return false;
            if (filterCode && !(m.codigoFabricante || '').toLowerCase().includes(filterCode)) return false;
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhum material encontrado.</td></tr>';
            return;
        }

        const typicalId = modal._typicalId;
        tbody.innerHTML = filtered.map(m => {
            const desc = this._escapeHtml(m.descricao || '');
            const modelo = this._escapeHtml(m.modelo || '-');
            const codFab = this._escapeHtml(m.codigoFabricante || '-');
            const fab = this._escapeHtml(m.fabricante || '-');
            return `<tr>
                <td style="padding:8px 10px;">${desc}</td>
                <td style="padding:8px 10px;">${modelo}</td>
                <td style="padding:8px 10px;font-family:monospace;">${codFab}</td>
                <td style="padding:8px 10px;">${fab}</td>
                <td style="padding:8px 10px;text-align:right;">${app.formatCurrency(m.custo || 0)}</td>
                <td style="padding:8px 10px;text-align:center;">
                    <input type="number" class="form-control" value="1" min="1"
                        style="width:50px;padding:4px;text-align:center;height:28px;"
                        data-material-id="${m.id}"
                        data-custo="${m.custo}"
                        data-descricao="${desc}"
                        data-fabricante="${fab}"
                        data-codfab="${codFab}"
                        data-modelo="${modelo}">
                </td>
                <td style="padding:8px 10px;text-align:center;">
                    <button class="btn btn-xs btn-primary" onclick="app.propostaTecnica._addSingleItem(this, '${typicalId}')"
                        style="background:#16a34a;font-size:11px;padding:4px 10px;">
                        <i class="ph ph-plus"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    },

    _filterAddItems() {
        const modal = document.getElementById('modal-add-item-lm');
        if (modal) this._renderAddItemList(modal);
    },

    _addSingleItem(btn, typicalId) {
        const row = btn.closest('tr');
        const qtdInput = row.querySelector('input[type="number"]');
        const qtd = parseInt(qtdInput?.value) || 1;
        const materialId = qtdInput?.dataset?.materialId;
        if (!materialId) return;

        const state = store.getState();
        const tipicos = [...(state.tipicos || [])];
        const idx = tipicos.findIndex(t => t.id === typicalId);
        if (idx === -1) return;

        const tipico = { ...tipicos[idx] };
        tipico.items = [...(tipico.items || [])];

        const existing = tipico.items.find(i => i.materialId === materialId);
        if (existing) {
            existing.qtd = (existing.qtd || 0) + qtd;
        } else {
            tipico.items.push({
                materialId: materialId,
                descricao: qtdInput.dataset.descricao,
                fabricante: qtdInput.dataset.fabricante,
                codigoFabricante: qtdInput.dataset.codfab,
                modelo: qtdInput.dataset.modelo,
                custo: parseFloat(qtdInput.dataset.custo) || 0,
                qtd: qtd
            });
        }

        tipico.custoTotal = tipico.items.reduce((acc, i) => acc + ((i.custo || 0) * (i.qtd || 0)), 0);
        tipicos[idx] = tipico;
        store.setState({ tipicos });

        window.app.toast?.('Item adicionado ao típico!', 'success');

        const data = store.getState().activeTechnicalProposal;
        if (data) {
            this.renderModal(data);
            setTimeout(() => this.openAddItemModal(typicalId), 50);
        }
    },

    _confirmAddItems(typicalId) {
        document.getElementById('modal-add-item-lm')?.remove();
        const data = store.getState().activeTechnicalProposal;
        if (data) {
            this.renderModal(data);
            if (this.cargasSubView !== 'lm') {
                this.switchCargasSubView('lm');
            }
        }
        window.app.toast?.('Itens salvos no típico!', 'success');
    },

    filterLM(query) {

        this.lmFilterQuery = query;

        this.renderModal(store.getState().activeTechnicalProposal);

        

        // Restaurar foco e posição do cursor no input de busca

        const input = document.getElementById('lm-search-input');

        if (input) {

            input.focus();

            // Coloca o cursor no final do texto

            const len = input.value.length;

            input.setSelectionRange(len, len);

        }

    },



    updateLoadFromTypical(idx) {

        const select = document.querySelector(`select[name="dload_typicalId_${idx}"]`);

        if (!select) return;



        const typicalId = select.value;

        if (!typicalId) return;



        const typical = store.getState().tipicos.find(t => t.id === typicalId);

        if (!typical) return;



        // Mapeamento de Tipos (Sincronizado com tipicos.js)

        const mapping = {

            'Inversor de Frequência': 'IF',

            'Soft-Starter': 'SS',

            'Partida Direta': 'PD',

            'Partida Direta Reversora': 'PDR',

            'Estrela-Triângulo': 'ET',

            'Alimentador': 'AL',

            'Entrada Geral': 'EG',

            'Medição': 'ME',

            'Comando e Sinalização': 'CS',

            'Serviços Auxiliares': 'SA',

            'Banco de Capacitores': 'BC',

            'Cubículo MT': 'PNMT'

        };



        // Preencher campos na linha correspondente

        const row = select.closest('tr');

        const inputPotencia = row.querySelector(`input[name="dload_power_${idx}"]`);

        const inputTensao = row.querySelector(`input[name="dload_tensao_${idx}"]`);

        const inputCorrente = row.querySelector(`input[name="dload_current_${idx}"]`);

        const selectRegime = row.querySelector(`select[name="dload_regime_${idx}"]`);

        const inputTipo = row.querySelector(`input[name="dload_type_${idx}"]`);



        if (inputPotencia) inputPotencia.value = typical.potencia || typical.potenciaKvar || '';

        if (inputTensao) inputTensao.value = typical.tensao || '';

        if (inputCorrente) inputCorrente.value = typical.correnteApx || '';

        if (selectRegime) {

            // Tentar encontrar o valor exato no select

            const optionExists = Array.from(selectRegime.options).some(opt => opt.value === typical.regimeAcionamento);

            selectRegime.value = optionExists ? typical.regimeAcionamento : 'S1';

        }

        if (inputTipo) inputTipo.value = mapping[typical.tipoAcionamento] || 'IF';



        app.toast(`Dados preenchidos a partir de: ${typical.nome}`, 'info');

    },



    delete(id) {

        if (!confirm('Excluir proposta?')) return;

        const current = store.getState().propostasTecnicas;

        store.setState({ propostasTecnicas: current.filter(p => p.id !== id) });

        app.toast('Proposta excluída localmente.', 'success');

    },



    async _loadFromDvt(dvtFolder, revisionFolder) {
        if (this._loading) return;
        this._loading = true;
        try {
            const res = await fetch(`http://localhost:8082/api/load-proposal?dvt=${encodeURIComponent(dvtFolder)}&file=PropostaTecnica.json&revisionFolder=${encodeURIComponent(revisionFolder)}`);
            const data = await res.json();
            if (data && !data.error && Object.keys(data).length > 0) {
                this.viewMode = 'form';
                this.forcedDashboard = false;
                const copy = JSON.parse(JSON.stringify(data));
                store.setState({ activeTechnicalProposal: copy });
                this.renderModal(copy);
            } else {
                this._createFromDvt();
            }
        } catch (err) {
            console.warn('[PropostaTecnica] Error auto-loading from DVT:', err);
            this._createFromDvt();
        } finally {
            this._loading = false;
        }
    },

    _createFromDvt() {
        const dvt = window.app.currentDvt;
        const newData = {
            id: 'PT-' + Date.now(),
            cliente: dvt?.client || '',
            projeto: dvt?.title || '',
            objeto: 'FORNECIMENTO DE PAINÉIS ELÉTRICOS',
            equipments: [{
                id: Date.now(),
                tag: 'TAG-01',
                type: 'CCM-BT',
                norms: ['nbr_iec_61439', 'nr10'],
                technical: { tensao: '380V', icc: '50kA', ip: 'IP-42', corrente_nominal: '', tensao_operacao: '', sistema_eletrico: '' },
                loads: []
            }],
            scopeItems: [],
            exclusions: makeDefaultExclusions(),
            revisions: [{ no: '00', desc: 'Emissão Inicial', elab: 'M.S', verif: 'G.A', aprov: 'R.D', data: new Date().toLocaleDateString() }],
            updatedAt: new Date().toISOString()
        };
        this.viewMode = 'form';
        this.forcedDashboard = false;
        const copy = JSON.parse(JSON.stringify(newData));
        store.setState({ activeTechnicalProposal: copy });
        this.renderModal(copy);

        if (copy.cliente) {
            setTimeout(() => this.updateContactDropdown(copy.cliente), 50);
        }
    },

    closeModal() {

        console.log("[PropostaTecnica] Closing modal...");

        this.viewMode = 'list';

        this.forcedDashboard = true;

        if (window.app.syncProposals) window.app.syncProposals();

        this.render();

    },



    render() {

        const state = store.getState();

        const activeProposal = state.activeTechnicalProposal;



        // Auto-load from current DVT if no active proposal
        if (this.viewMode === 'list' && !this._loading && !this.forcedDashboard) {
            const dvt = window.app.currentDvt;
            if (!activeProposal && dvt && dvt.folder) {
                this._loadFromDvt(dvt.folder, dvt.revision || '');
                return;
            }
        }

        // Se houver uma proposta ativa e não viemos de um fechamento explícito, abre o formulário

        if (activeProposal && this.viewMode === 'list' && !this.forcedDashboard) {

            this.renderModal(activeProposal);

            return;

        }



        // Renderiza a lista na tela principal (se não estiver em modo form)

        if (this.viewMode === 'form') return;

        const container = document.getElementById('view-proposta-tecnica');

        if (!container) return;



        const propostas = store.getState().propostasTecnicas || [];

        if (!container.querySelector('.module-header-sticky')) {
            container.innerHTML = `
                <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;margin:-20px;position:relative;">
                    <div class="module-header-sticky" style="background:linear-gradient(135deg, #16a34a 0%, #22c55e 100%);color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
                        <div>
                            <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
                                <i class="ph ph-file-text"></i> Propostas Técnicas
                            </h2>
                            <div style="font-size:12px;opacity:0.9;margin-top:2px;">Gerencie suas propostas técnicas aqui.</div>
                        </div>
                        <div style="display:flex;gap:10px;">
${store.canEdit() ? `<button class="btn btn-sm btn-ghost" onclick="app.propostaTecnica.create()" style="color:white;border:1px solid rgba(255,255,255,0.3);">
                                <i class="ph ph-plus"></i> Nova Proposta
                            </button>` : ''}
                        </div>
                    </div>

                    <div id="propostas-tecnicas-list-container" style="flex:1;overflow-y:auto;padding:0;"></div>
                </div>
            `;
        }

        const listContainer = container.querySelector('#propostas-tecnicas-list-container');

        if (propostas.length === 0) {
            listContainer.innerHTML = `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
                    <div style="text-align: center; color: #94a3b8;">
                        <i class="ph ph-file-text" style="font-size: 48px; margin-bottom: 16px;"></i>
                        <p>Nenhuma proposta técnica cadastrada.</p>
                        <button class="btn btn-sm btn-secondary" style="margin-top: 10px;" onclick="app.propostaTecnica.create()">Criar a primeira</button>
                    </div>
                </div>
            `;
            return;
        }

        let html = '<table class="w-full text-left" style="border-collapse: collapse;">';
        html += `
            <thead>
                <tr style="border-bottom: 1px solid var(--color-border); background: #f8fafc;">
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">Data</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">DVT</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">Cliente</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">Projeto</th>
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px; text-align: right;">Ações</th>
                </tr>
            </thead>
            <tbody>
        `;

        propostas.forEach(p => {
            const date = new Date(p.createdAt || p.updatedAt).toLocaleDateString();

            html += `
                <tr style="border-bottom: 1px solid var(--color-border);">
                    <td style="padding: 12px 16px;">${date}</td>
                    <td style="padding: 12px 16px; font-weight: 500; font-size: 12px; color: var(--color-primary);">${p.dvtFolder || '-'}</td>
                    <td style="padding: 12px 16px; font-weight: 500;">${p.cliente}</td>
                    <td style="padding: 12px 16px; font-weight: 500;">${p.projeto || '-'}</td>
                    <td style="padding: 12px 16px; text-align: right;">
${store.canEdit() ? `                        <button class="btn-icon" onclick="app.propostaTecnica.editProposal('${p.id}')" title="Editar">
                            <i class="ph ph-pencil-simple"></i>
                        </button>` : ''}
                        <button class="btn-icon" onclick="app.propostaTecnica.deleteProposal('${p.id}')" title="Excluir" style="color: var(--color-danger);">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        listContainer.innerHTML = html;

    },

    editProposal(id) {
        const propostas = store.getState().propostasTecnicas || [];
        const proposta = propostas.find(p => p.id === id);
        if (proposta) this.edit(proposta);
    },

    deleteProposal(id) {
        if (confirm('Tem certeza que deseja excluir esta proposta técnica?')) {
            store.deletePropostaTecnica(id);
            window.app.toast("Proposta removida.", "success");
        }
    },

    renderEletrocentroTab(eq) {

        eq.eletrocentroScope = migrateEletrocentroScope(eq.eletrocentroScope);

        const groups = eq.eletrocentroScope;



        // Calcula offset de numeração global

        let globalIndex = 0;

        const groupsHtml = groups.map((group, gi) => {

            const groupItemsHtml = group.items.map((it) => {

                globalIndex++;

                const idx = globalIndex;

                return `

                <tr class="el-scope-row" data-group="${gi}" style="border-bottom: 1px solid #f1f5f9;">

                    <td class="el-scope-index" style="padding: 12px; text-align: center; font-weight: 800; color: #64748b; width: 60px;">${String(idx).padStart(2, '0')}</td>

                    <td style="padding: 12px;"><input type="text" name="el_scope_desc" class="form-control" value="${(it.desc || '').replace(/"/g, '&quot;')}"></td>

                    <td style="padding: 12px; text-align: center;"><input type="checkbox" name="el_scope_dvt" ${it.dvt ? 'checked' : ''} ${it.na ? 'disabled style="opacity:0.5"' : ''}></td>

                    <td style="padding: 12px; text-align: center;"><input type="checkbox" name="el_scope_na" ${it.na ? 'checked' : ''} onchange="app.propostaTecnica.handleNaChange(this)"></td>

                    <td style="padding: 12px; text-align: center;"><input type="checkbox" name="el_scope_cli" ${it.cli ? 'checked' : ''} ${it.na ? 'disabled style="opacity:0.5"' : ''}></td>

                    <td style="padding: 12px; text-align: center;"><button type="button" class="btn-icon" style="color:#ef4444" onclick="this.closest('tr').remove(); app.propostaTecnica.reindexEletrocentroRows();"><i class="ph ph-trash"></i></button></td>

                </tr>`;

            }).join('');



            return `

            <tbody class="el-scope-group" data-group="${gi}">

                <tr class="el-section-row" style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">

                    <td style="background:#e2e8f0; width:60px;"></td>

                    <td style="background:#e2e8f0; padding:8px 12px;">

                        <input type="text" class="el-group-name form-control" data-group="${gi}"

                            value="${(group.groupName || '').replace(/"/g, '&quot;')}"

                            style="font-weight:800; color:#1e3a8a; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; background:transparent; border:1px dashed #93c5fd; padding:4px 8px; border-radius:6px;"

                            placeholder="Nome do grupo">

                    </td>

                    <td style="background:#e2e8f0;"></td>

                    <td style="background:#e2e8f0;"></td>

                    <td style="background:#e2e8f0;"></td>

                    <td style="background:#e2e8f0; text-align:center; white-space:nowrap;">

                        <button type="button" class="btn-icon" style="color:#3b82f6; font-size:11px; margin-right:4px;" title="Adicionar item neste grupo" onclick="app.propostaTecnica.addEletrocentroRowToGroup(${gi})"><i class="ph ph-plus-circle"></i></button>

                        <button type="button" class="btn-icon" style="color:#ef4444; font-size:11px;" title="Remover grupo" onclick="app.propostaTecnica.removeEletrocentroGroup(${gi})"><i class="ph ph-trash"></i></button>

                    </td>

                </tr>

                ${groupItemsHtml}

            </tbody>`;

        }).join('');



        return `

            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 800px; display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; border-bottom:1px solid #f1f5f9; padding-bottom:15px;">

                    <div>

                        <h4 style="margin:0; color:#1e3a8a; font-size:18px;">Escopo: ${eq.tag}</h4>

                        <div style="font-size:12px; color:#64748b; margin-top:4px;">Definição de itens inclusos na sala modular</div>

                    </div>

                    <div style="display:flex; gap:8px;">

                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.loadDefaultEletrocentroScope()"><i class="ph ph-arrow-counter-clockwise"></i> Restaurar Padrão</button>

                        <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica.addEletrocentroGroup()"><i class="ph ph-plus"></i> Adicionar Grupo</button>

                    </div>

                </div>

                <div id="el-scope-container" style="border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background:white;">

                    <div style="max-height:500px; overflow-y:auto;">

                        <table class="w-full" style="font-size:13px; border-collapse:collapse;">

                            <thead>

                                <tr style="position:sticky; top:0; background:#22c55e; color:#fff; z-index:10; box-shadow:inset 0 -2px 0 #e2e8f0;">

                                    <th style="padding:14px; text-align:center; width:60px; font-weight:800; background:#22c55e; color:#fff;">ITEM</th>

                                    <th style="padding:14px; text-align:left; font-weight:800; background:#22c55e; color:#fff;">MATRIZ DE RESPONSABILIDADE</th>

                                    <th style="padding:14px; text-align:center; width:90px; font-weight:800; background:#22c55e; color:#fff;">DVT</th>

                                    <th style="padding:14px; text-align:center; width:90px; font-weight:800; background:#22c55e; color:#fff;">N/A</th>

                                    <th style="padding:14px; text-align:center; width:90px; font-weight:800; background:#22c55e; color:#fff;">CLIENTE</th>

                                    <th style="padding:14px; width:80px; background:#22c55e; color:#fff;"></th>

                                </tr>

                            </thead>

                            ${groupsHtml}

                        </table>

                    </div>

                    ${groups.length === 0 ? '<div style="padding:40px; text-align:center; color:#94a3b8;">Nenhum grupo. Clique em "+ Adicionar Grupo".</div>' : ''}

                </div>

            </div>

        `;

    },



    addEletrocentroGroup() {

        const container = document.getElementById('el-scope-container');

        if (!container) return;

        const existingGroups = container.querySelectorAll('.el-scope-group');

        const gi = existingGroups.length;

        const tbody = document.createElement('tbody');

        tbody.className = 'el-scope-group';

        tbody.dataset.group = gi;

        tbody.innerHTML = `

            <tr class="el-section-row" style="background:#f1f5f9; border-bottom:1px solid #cbd5e1;">

                <td style="background:#e2e8f0; width:60px;"></td>

                <td style="background:#e2e8f0; padding:8px 12px;">

                    <input type="text" class="el-group-name form-control" data-group="${gi}"

                        value="NOVO GRUPO"

                        style="font-weight:800; color:#1e3a8a; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; background:transparent; border:1px dashed #93c5fd; padding:4px 8px; border-radius:6px;"

                        placeholder="Nome do grupo">

                </td>

                <td style="background:#e2e8f0;"></td>

                <td style="background:#e2e8f0;"></td>

                <td style="background:#e2e8f0;"></td>

                <td style="background:#e2e8f0; text-align:center; white-space:nowrap;">

                    <button type="button" class="btn-icon" style="color:#3b82f6; font-size:11px; margin-right:4px;" title="Adicionar item neste grupo" onclick="app.propostaTecnica.addEletrocentroRowToGroup(${gi})"><i class="ph ph-plus-circle"></i></button>

                    <button type="button" class="btn-icon" style="color:#ef4444; font-size:11px;" title="Remover grupo" onclick="app.propostaTecnica.removeEletrocentroGroup(${gi})"><i class="ph ph-trash"></i></button>

                </td>

            </tr>`;

        const table = container.querySelector('table');

        if (table) table.appendChild(tbody);

        this.reindexEletrocentroRows();

    },



    addEletrocentroRowToGroup(gi) {

        const tbody = document.querySelector(`.el-scope-group[data-group="${gi}"]`);

        if (!tbody) return;

        const row = document.createElement('tr');

        row.className = 'el-scope-row';

        row.dataset.group = gi;

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `

            <td class="el-scope-index" style="padding:12px; text-align:center; font-weight:800; color:#64748b; width:60px;">00</td>

            <td style="padding:12px;"><input type="text" name="el_scope_desc" class="form-control" value=""></td>

            <td style="padding:12px; text-align:center;"><input type="checkbox" name="el_scope_dvt"></td>

            <td style="padding:12px; text-align:center;"><input type="checkbox" name="el_scope_na" onchange="app.propostaTecnica.handleNaChange(this)"></td>

            <td style="padding:12px; text-align:center;"><input type="checkbox" name="el_scope_cli"></td>

            <td style="padding:12px; text-align:center;"><button type="button" class="btn-icon" style="color:#ef4444;" onclick="this.closest('tr').remove(); app.propostaTecnica.reindexEletrocentroRows();"><i class="ph ph-trash"></i></button></td>`;

        tbody.appendChild(row);

        this.reindexEletrocentroRows();

    },



    removeEletrocentroGroup(gi) {

        if (!confirm('Remover este grupo e todos os seus itens?')) return;

        const tbody = document.querySelector(`.el-scope-group[data-group="${gi}"]`);

        if (tbody) tbody.remove();

        this.reindexEletrocentroRows();

    },



    reindexEletrocentroRows() {

        // Numeração contínua global, ignorando linhas de cabeçalho de grupo

        const rows = document.querySelectorAll('.el-scope-row');

        rows.forEach((row, i) => {

            const cell = row.querySelector('.el-scope-index');

            if (cell) cell.textContent = String(i + 1).padStart(2, '0');

        });

    },



    handleNaChange(checkbox) {

        const row = checkbox.closest('tr');

        if (!row) return;

        const dvtBox = row.querySelector('input[name="el_scope_dvt"]');

        const cliBox = row.querySelector('input[name="el_scope_cli"]');

        if (checkbox.checked) {

            if (dvtBox) {

                dvtBox.checked = false;

                dvtBox.disabled = true;

                dvtBox.style.opacity = '0.5';

            }

            if (cliBox) {

                cliBox.checked = false;

                cliBox.disabled = true;

                cliBox.style.opacity = '0.5';

            }

        } else {

            if (dvtBox) {

                dvtBox.disabled = false;

                dvtBox.style.opacity = '1';

            }

            if (cliBox) {

                cliBox.disabled = false;

                cliBox.style.opacity = '1';

            }

        }

    },



    loadDefaultEletrocentroScope() {

        if (!confirm("Deseja substituir a matriz atual pelos 17 itens padrão? Todas as marcações e descrições atuais serão restauradas para o padrão.")) return;

        const state = store.getState();

        const activeProposal = state.activeTechnicalProposal;

        if (!activeProposal || !activeProposal.equipments) return;

        

        const eq = activeProposal.equipments[this.activeEquipmentIndex];

        if (eq) {

            eq.eletrocentroScope = JSON.parse(JSON.stringify(DEFAULT_ELETROCENTRO_SCOPE));

            this.renderModal(activeProposal);

            app.toast("Matriz padrão carregada!", "success");

        }

    },



    async exportToWord() {

        this.captureEquipmentData();

        const data = store.getState().activeTechnicalProposal;

        if (!data) {

            app.toast('Nenhuma proposta carregada.', 'error');

            return;

        }



        // CRITICAL PATCH for ImageModule Compatibility

        try {

            const proto = (typeof Element !== 'undefined' ? Element.prototype : Node.prototype);

            const desc = Object.getOwnPropertyDescriptor(proto, 'namespaceURI');

            if (desc && !desc.set) {

                Object.defineProperty(proto, 'namespaceURI', {

                    get: function() { 

                        return this._nsURI !== undefined ? this._nsURI : (desc.get ? desc.get.call(this) : null); 

                    },

                    set: function(v) { this._nsURI = v; },

                    configurable: true

                });

            }

        } catch (e) { console.error("Patch error:", e); }



        // Bibliotecas

        const DocxLib = window.Docxtemplater || window.docxtemplater;

        const ZipLib = window.PizZip || window.pizzip || (window.Docxtemplater ? window.Docxtemplater.PizZip : null);

        const ImageModule = window.ImageModule;

        

        if (!DocxLib || !ZipLib) {

            app.toast('Erro: Bibliotecas de exportação não carregadas.', 'error');

            return;

        }



        // Helper Base64 to Buffer

        const base64ToBuffer = (data) => {

            if (!data) return null;

            const base64String = data.split(',')[1] || data;

            try {

                const binaryString = window.atob(base64String);

                const len = binaryString.length;

                const bytes = new Uint8Array(len);

                for (let i = 0; i < len; i++) {

                    bytes[i] = binaryString.charCodeAt(i);

                }

                return bytes.buffer;

            } catch (e) {

                console.error("Error decoding base64:", e);

                return null;

            }

        };



        app.toast('Gerando documento Word...', 'info');



        try {

            // Localizar o primeiro equipamento do tipo ELETROCENTRO para expor seus dados globalmente

            const eletrocentroEq = (data.equipments || []).find(eq => eq.type === 'ELETROCENTRO');

            if (eletrocentroEq) {

                if (!eletrocentroEq.eletrocentroScope || eletrocentroEq.eletrocentroScope.length === 0) {

                    eletrocentroEq.eletrocentroScope = JSON.parse(JSON.stringify(DEFAULT_ELETROCENTRO_SCOPE));

                }

            }



            // Preparar dados do template
            const clientObj = (store.getState().clientes || []).find(c => c.razaoSocial === data.cliente);

            const templateData = {

                projeto: data.projeto || '',

                cliente: data.cliente || '',
                razao_social: clientObj?.razaoSocial || '',
                nome_fantasia: clientObj?.nomeFantasia || '',
                cnpj: clientObj?.cnpj || '',
                inscricao_estadual: clientObj?.inscricaoEstadual || '',
                inscricao_municipal: clientObj?.inscricaoMunicipal || '',
                logradouro: clientObj?.logradouro || '',
                numero: clientObj?.numero || '',
                bairro: clientObj?.bairro || '',
                cidade: clientObj?.cidade || '',
                estado: clientObj?.estado || '',
                cep: clientObj?.cep || '',
                segmento: clientObj?.segmento || '',
                cnae: clientObj?.cnae || '',
                observacoes: clientObj?.observacoes || '',
                contato_nome: (clientObj?.contatos?.[0]?.nome) || clientObj?.contatoNome || '',
                contato_cargo: (clientObj?.contatos?.[0]?.cargo) || clientObj?.contatoCargo || '',
                contato_email: (clientObj?.contatos?.[0]?.email) || clientObj?.email || '',
                contato_telefone: (clientObj?.contatos?.[0]?.telefone) || clientObj?.telefone || '',

                objeto: data.objeto || '',

                localizacao: data.localizacao || '',

                aos_cuidados: data.aos_cuidados || '',

                email: data.email || '',

                telefone: data.telefone || '',

                data_emissao: new Date().toLocaleDateString('pt-BR'),

                revisao: data.revisions?.length > 0 ? data.revisions[data.revisions.length - 1].no : '00',

                codigo: data.codigo || '',

                revisoes: (data.revisions || []).map(r => ({

                    no: r.no || '',

                    desc: r.desc || '',

                    elab: r.elab || '',

                    verif: r.verif || '',

                    aprov: r.aprov || '',

                    data: r.data || ''

                })),

                

                // Seção Eletrocentro: controla visibilidade do Tópico 4 inteiro no Word

                tem_eletrocentro: !!eletrocentroEq,



                // Matriz Eletrocentro Global â achata grupos em array plano com numeração contínua

                tem_escopo_eletrocentro: !!eletrocentroEq,

                escopo_eletrocentro: eletrocentroEq ? (() => {

                    const groups = migrateEletrocentroScope(eletrocentroEq.eletrocentroScope);

                    const flat = [];

                    groups.forEach(group => {

                        (group.items || []).forEach(item => {

                            flat.push({

                                index: String(flat.length + 1).padStart(2, '0'),

                                desc: item.desc || '',

                                dvt: item.na ? 'N/A' : (item.dvt ? 'X' : ''),

                                na: item.na ? 'X' : '',

                            });

                        });

                    });

                    return flat;

                })() : [],

                

                // Imagens (Logos)

                logo_img: data.logo_base64 || '',

                client_logo_img: data.client_logo_base64 || '',

                watermark_img: data.watermark_base64 || '',

                

                // Lista de painéis (Loop no Word)

                lista_paineis: (data.equipments || []).map(eq => {

                    const tech = eq.technical || {};

                    const loads = eq.loads || [];

                    

                    // Mapeamento exaustivo para chaves do template

                    const eqData = {

                        tag: eq.tag,

                        tipo: eq.type,

                        ...tech, // Espalha todos os campos técnicos salvos

                        

                        // Fallbacks e aliases comuns (incluindo padrões fd_ de versões anteriores)

                        cor: tech.cor_externa,

                        pintura: tech.cor_externa,

                        fd_color: tech.cor_externa,

                        espessura: tech.camada_pintura,

                        camada_pintura: tech.camada_pintura,

                        entrada: tech.entrada_cabos,

                        fd_cable_entry: tech.entrada_cabos,

                        saida: tech.saida_cabos,

                        fd_cable_exit: tech.saida_cabos,

                        acesso: tech.acesso_manutencao,

                        fd_maint_access: tech.acesso_manutencao,

                        acesso_frontal: tech.acesso_frontal,

                        fd_frontal_access: tech.acesso_frontal,

                        acesso_traseiro: tech.acesso_traseiro,

                        fd_rear_access: tech.acesso_traseiro,

                        protocolo: tech.protocolo,

                        fd_protocol: tech.protocolo,

                        cabo: tech.cabo_comunicacao,

                        fd_comm_cable: tech.cabo_comunicacao,

                        monitoramento_arco: tech.monitoramento_arco_eq || tech.arco_interno,

                        fd_arc_monitor: tech.monitoramento_arco_eq || tech.arco_interno,

                        iluminacao: tech.iluminacao || tech.iluminacao_interna,

                        fd_internal_lighting: tech.iluminacao || tech.iluminacao_interna,

                        tomada: tech.tomada || tech.tomada_servico,

                        fd_service_outlet: tech.tomada || tech.tomada_servico,

                        termostato: tech.termostato || tech.termostato_resistor,

                        fd_thermostat: tech.termostato || tech.termostato_resistor,

                        ventilacao: tech.ventilacao || tech.ventilacao_forcada,

                        fd_ventilation: tech.ventilacao || tech.ventilacao_forcada,

                        

                        // Barramentos

                        bus_main_mat: eq.busbars?.main?.mat || '',

                        bus_main_dim: eq.busbars?.main?.dim || '',

                        bus_main_inc: eq.busbars?.main?.inc || '',

                        bus_main_weight: eq.busbars?.main?.weight || '',

                        bus_branch_mat: eq.busbars?.branch?.mat || '',

                        bus_branch_dim: eq.busbars?.branch?.dim || '',

                        bus_branch_inc: eq.busbars?.branch?.inc || '',

                        bus_branch_weight: eq.busbars?.branch?.weight || '',

                        bus_ground_mat: eq.busbars?.ground?.mat || '',

                        bus_ground_dim: eq.busbars?.ground?.dim || '',

                        bus_ground_weight: eq.busbars?.ground?.weight || '',



                        // Lista de cargas para este painel

                        tem_cargas: loads.length > 0,

                        cargas: loads.map((load, idx) => ({

                            index: idx + 1,

                            ...load,

                            corrente: load.corrente || '0A',

                            disjuntor: load.disjuntor || '-',

                            cabo: load.cabo || '-'

                        })),



                        // Escopo Eletrocentro (Se for Eletrocentro)

                        tem_escopo_eletrocentro: (eq.type === 'ELETROCENTRO'),

                        escopo_eletrocentro: (() => {

                            if (eq.type !== 'ELETROCENTRO') return [];

                            const groups = migrateEletrocentroScope(eq.eletrocentroScope);

                            const flat = [];

                            groups.forEach(group => {

                                (group.items || []).forEach(item => {

                                    flat.push({

                                        index: String(flat.length + 1).padStart(2, '0'),

                                        desc: item.desc || '',

                                        dvt: item.na ? 'N/A' : (item.dvt ? 'X' : ''),

                                        na: item.na ? 'X' : '',

                                        cliente: item.na ? 'N/A' : (item.cli ? 'X' : '')

                                    });

                                });

                            });

                            return flat;

                        })()

                    };



                    // Adicionar chaves em maiúsculo para compatibilidade

                    Object.keys(eqData).forEach(key => {

                        if (typeof eqData[key] === 'string' || typeof eqData[key] === 'number') {

                            eqData[key.toUpperCase()] = eqData[key];

                        }

                    });



                    return eqData;

                }),

                

                // Itens de Escopo (Loop no Word)

                escopo: (data.scopeItems || []).map(item => ({

                    desc: item.desc || '',

                    dvt: item.dvt ? 'X' : '',

                    cliente: item.cli ? 'X' : ''

                })),

                vendor_list: (data.vendorList || []).map((v, idx) => {
                    const opt = v.opt || '';
                    let opt_display = '';
                    if (opt === '__PADRAO__') {
                        opt_display = v.brand || '';
                    } else if (opt === '__SIMILAR__') {
                        opt_display = 'Similar';
                    } else if (opt === '__OUTRO__') {
                        opt_display = v.optEspecifique ? 'Outro \u2014 ' + v.optEspecifique : 'Outro';
                    } else if (opt) {
                        opt_display = opt;
                    }
                    return { index: idx + 1, comp: v.comp || '', brand: v.brand || '', opt_display };
                })

            };



            // Adicionar campos globais em maiúsculo (Strings e Arrays)

            Object.keys(templateData).forEach(key => {

                const val = templateData[key];

                if (typeof val === 'string' || Array.isArray(val)) {

                    templateData[key.toUpperCase()] = val;

                }

            });



            // Carregar Template

            const response = await fetch('TEMPLATE_TEC.docx?v=' + Date.now());

            if (!response.ok) throw new Error('Template TEMPLATE_TEC.docx não encontrado.');

            const arrayBuffer = await response.arrayBuffer();



            const zip = new ZipLib(arrayBuffer);



            // Configurar Módulo de Imagem

            let modules = [];

            if (ImageModule) {

                const imageOpts = {

                    centered: false,

                    getImage(tagValue) {

                        const TINI_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

                        if (!tagValue || typeof tagValue !== 'string' || !tagValue.includes('base64')) {

                            return base64ToBuffer(TINI_PNG);

                        }

                        return base64ToBuffer(tagValue) || base64ToBuffer(TINI_PNG);

                    },

                    getSize(img, tagValue, tagName) {

                        const name = tagName.toLowerCase();

                        if (name.includes('client_logo')) return [264, 105];

                        if (name.includes('logo')) return [150, 60];

                        if (name.includes('watermark')) return [600, 600];

                        return [100, 100];

                    }

                };

                modules.push(new ImageModule(imageOpts));

            }



            const doc = new DocxLib(zip, {

                paragraphLoop: true,

                linebreaks: true,

                modules: modules,

                nullGetter: () => ""

            });



            doc.setData(templateData);

            doc.render();



            const out = doc.getZip().generate({

                type: "blob",

                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

            });



            const fileName = `Proposta_Tecnica_${data.projeto || 'GeraPro'}.docx`;

            const url = window.URL.createObjectURL(out);

            const a = document.createElement("a");

            a.href = url;

            a.download = fileName;

            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);

            document.body.removeChild(a);



            app.toast('Download concluído!', 'success');

        } catch (e) {

            console.error(e);

            app.toast('Erro na exportação: ' + e.message, 'error');

        }

    }

};



PropostaTecnicaModule.init();

export { PropostaTecnicaModule };

