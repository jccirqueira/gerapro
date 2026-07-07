import { store } from './state.js';

import { calculateBusbar, BUSBAR_DATA, MULTI_BAR_DATA } from './busbarCalculator.js';

import { deriveMaterials } from './automacaoMateriais.js';

import { EMPRESA } from './empresaConfig.js';



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

    { group: 'Engenharia de Aplicação', role: 'Gerente de Engenharia', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Aplicação', role: 'Supervisor de Engenharia', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Aplicação', role: 'Engenheiro de Aplicação', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Aplicação', role: 'Assistente de Engenharia', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Projetos', role: 'Gerente de Engenharia Elétrica', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Projetos', role: 'Coordenador de Engenharia Elétrica', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Projetos', role: 'Engenheiro Eletricista', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Projetos', role: 'Projetista Eletricista', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Projetos', role: 'Gerente de Engenharia Mecânica', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Projetos', role: 'Coordenador de Engenharia Mecânica', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Projetos', role: 'Engenheiro Mecânica', hours: 0, hourlyRate: 0 },

    { group: 'Engenharia de Projetos', role: 'Projetista Mecânica', hours: 0, hourlyRate: 0 },

    { group: 'Fábrica de Painéis', role: 'Montador de Layout', hours: 0, hourlyRate: 0 },

    { group: 'Fábrica de Painéis', role: 'Montador Eletricista', hours: 0, hourlyRate: 0 },

    { group: 'Fábrica de Painéis', role: 'Auxiliar Montador Eletricista', hours: 0, hourlyRate: 0 },

    { group: 'Fábrica de Painéis', role: 'Barramentista', hours: 0, hourlyRate: 0 },

    { group: 'Service', role: 'Técnico de Service', hours: 0, hourlyRate: 0 },

    { group: 'Campo', role: 'Eletricista (Força e Controle)', hours: 0, hourlyRate: 0 },

    { group: 'Campo', role: 'Eletricista (Montagens Eletromecânicas)', hours: 0, hourlyRate: 0 },

    { group: 'Campo', role: 'Auxiliar (Montagens Eletromecânicas)', hours: 0, hourlyRate: 0 },

    { group: 'Montagem', role: 'Montador', hours: 0, hourlyRate: 0 },
    { group: 'Montagem', role: 'Eletricista', hours: 0, hourlyRate: 0 },
    { group: 'Montagem', role: 'Pintor', hours: 0, hourlyRate: 0 },
    { group: 'Montagem', role: 'Auxiliar', hours: 0, hourlyRate: 0 }

];

window.DEFAULT_LABOR_ROLES = DEFAULT_LABOR_ROLES;

const DEFAULT_EXPENSES = [

    { desc: "Refeições Diárias para Funcionários", unit: 60.0, qtd: 0 },

    { desc: "Diárias Hotel / Hospedagem", unit: 200.0, qtd: 0 },

    { desc: "Passagens Aéreas", unit: 1500.0, qtd: 0 },

    { desc: "Combustível / Pedágios / Estacionamentos", unit: 300.0, qtd: 0 },

    { desc: "Locação Automóvel", unit: 150.0, qtd: 0 },

    { desc: "Km Rodado (Veículo Próprio)", unit: 1.80, qtd: 0 },

    { desc: "Frete de entrega", unit: 500.0, qtd: 0 },

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
            { desc: "Projeto do layout do eletrocentro com posicionamento dos equipamentos, relação de cargas térmicas e relação de massas.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Projeto eletromecânico executivo e cálculos estruturais 2D e 3D.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Projeto executivo de iluminação e tomadas, internas, externas e emergência.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Projeto executivo de pilotis.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Projeto executivo de bandejamento (Leitos e Eletrocalhas).", minhaEmpresa: true, na: false, cli: false },
            { desc: "Projeto executivo e dimensionamento do sistema de climatização.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Projeto executivo e dimensionamento do sistema de pressurização.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Projeto de layout orientativo (2D) plataformas, corrimão, escadas e guarda corpo.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Projeto executivo (2D e 3D) de plataformas, corrimão, escadas e guarda corpo.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Projeto elétrico executivo de aterramento e SPDA.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Projeto executivo de SDAI.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Projeto executivo de CFTV.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Projeto executivo de controle de acesso.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Projeto executivo de tubulação de ar comprimido.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Projeto executivo de suportes para leitos externos.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Projeto executivo de dimensionamento e posicionamento de leitos externos.", minhaEmpresa: false, na: false, cli: true },
            { desc: "Plano de carga.", minhaEmpresa: true, na: false, cli: false }
        ]

    },

    {
        groupName: "MATERIAIS",
        items: [
            { desc: "Eletrocentro pintado conforme padrão do cliente.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Equipamentos e materiais de iluminação e tomadas, internas, externas e emergência.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento de iluminação e tomadas, internas, externas e emergência.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Pilotis metálicos.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Leitos e eletrocalhas internos ao eletrocentro.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Eletrodutos, conduletes e todo suporte eletromecânico.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Cabos para interligação elétrica de potência entre painéis, transformadores, UPS e retificadores.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Cabos para interligação elétrica de comando e sinal entre painéis, transformadores, UPS e retificadores.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Equipamentos e materiais do sistema de climatização (HVAC e acessórios).", minhaEmpresa: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de climatização (HVAC e acessórios).", minhaEmpresa: true, na: false, cli: false },
            { desc: "Equipamentos e materiais do sistema de pressurização.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de pressurização.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Plataformas de acesso incluindo corrimão, escadas (modelos e quantidades conforme layout orientativo) e guarda corpo.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Material e todos os itens de SPDA e aterramento necessários para infraestrutura eletromecânica na área interna do eletrocentro.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Equipamentos e materiais do sistema de detecção e alarme de incêndio.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de detecção e alarme de incêndio.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Equipamentos e materiais do sistema de combate a incêndio (Manual).", minhaEmpresa: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de combate a incêndio.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Equipamentos do sistema de CFTV.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação) do sistema de CFTV.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Equipamentos e materiais de controle de acesso (Fechadura comum).", minhaEmpresa: true, na: false, cli: false },
            { desc: "Infraestrutura eletromecânica e cabeamento (cabos de alimentação, sinais, rede e controle) do sistema de controle de acesso.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Fechamento do porão de cabos com telas.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Selagem corta fogo e pintura intumescente.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Isolação térmica ou tapete de borracha para o piso da sala.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Sistema de calhas pluviais.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Tubos para interligação de ar comprimido.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Válvulas e filtros para tubulação de ar comprimido.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Suportes para leitos externos em toda extensão do eletrocentro.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Porta corta fogo.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Olhais de suspensão.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Linha de vida.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Balancim (Comodato).", minhaEmpresa: false, na: false, cli: true }
        ]
    },

    {
        groupName: "SERVIÇOS EM FÁBRICA",
        items: [
            { desc: "Montagem, instalação e fixação dos painéis e equipamentos.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Montagem e instalação eletromecânica dos equipamentos HVAC.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Interligação elétrica entre painéis e equipamentos internos ao eletrocentro.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Interligação de rede entre painéis internos ao eletrocentro.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Comissionamento do eletrocentro.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Teste de aceitação de fábrica.", minhaEmpresa: true, na: false, cli: true }
        ]
    },

    {
        groupName: "ENTREGA",
        items: [
            { desc: "Frete do eletrocentro do fornecedor do eletrocentro ao cliente final.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Frete do eletrocentro do fornecedor do eletrocentro a Ribeirão Preto.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Descarregamento do eletrocentro em Ribeirão Preto - SP.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Descarregamento do eletrocentro no cliente final.", minhaEmpresa: false, na: false, cli: true },
            { desc: "Descarregamento de equipamentos de terceiros.", minhaEmpresa: false, na: false, cli: true }
        ]
    },

    {
        groupName: "SERVIÇOS DE CAMPO",
        items: [
            { desc: "Instalação dos pilotis.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Supervisão de descarga e montagem nos pilotis.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Montagem do eletrocentro nos pilotis.", minhaEmpresa: false, na: true, cli: false },
            { desc: "Acoplamento e selagem/vedação do eletrocentro.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Reposicionamento de cabos, para raios e ar-condicionado.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Interligação dos cabos removidos para transporte.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Selagem com espuma expansiva a entrada cabos internos ao eletrocentro.", minhaEmpresa: true, na: false, cli: false },
            { desc: "Comissionamento e start-up.", minhaEmpresa: true, na: false, cli: true },
            { desc: "Instalação e montagem de leitos externos ao eletrocentro.", minhaEmpresa: false, na: false, cli: true },
            { desc: "Interligação elétrica externa ao eletrocentro.", minhaEmpresa: false, na: false, cli: true },
            { desc: "Instalação de leitos externos ao eletrocentro.", minhaEmpresa: false, na: false, cli: true },
            { desc: "Limpeza geral do eletrocentro após acoplamento.", minhaEmpresa: false, na: false, cli: true }
        ]
    },

    {
        groupName: "CIVIL",
        items: [
            { desc: "Projeto civil de fundação dos eletrocentros.", minhaEmpresa: false, na: false, cli: true },
            { desc: "Estrutura civil de fundação dos eletrocentros.", minhaEmpresa: false, na: false, cli: true }
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

const AUTPRO_SCOPE_ITEMS = [
    { id: 'autpro_01', desc: 'CERTIFICAÇÕES E ENSAIOS' },
    { id: 'autpro_02', desc: 'DISJUNTOR DE ENTRADA (MT)' },
    { id: 'autpro_03', desc: 'SECCIONADORA FUSÍVEL DE MÉDIA TENSÃO' },
    { id: 'autpro_04', desc: 'ELEMENTO DE MEDIÇÃO DE MÉDIA TENSÃO' },
    { id: 'autpro_05', desc: 'RELÉ DE FUNÇÃO' },
    { id: 'autpro_06', desc: 'COMANDO E SERVIÇOS AUXILIARES (MT)' },
    { id: 'autpro_07', desc: 'ENERGIA SEGURA' },
    { id: 'autpro_08', desc: 'TAG – DESCRIÇÃO DO PAINEL DE BAIXA TENSÃO' },
    { id: 'autpro_09', desc: 'DISJUNTOR DE ENTRADA (BT)' },
    { id: 'autpro_10', desc: 'ELEMENTO DE MEDIÇÃO DE BAIXA TENSÃO' },
    { id: 'autpro_11', desc: 'COMANDO E SERVIÇOS AUXILIARES (BT)' },
    { id: 'autpro_12', desc: 'INVERSOR DE FREQUÊNCIA' },
    { id: 'autpro_13', desc: 'SOFT-STARTER' },
    { id: 'autpro_14', desc: 'PARTIDA DIRETA' },
    { id: 'autpro_15', desc: 'ALIMENTADORES' },
    { id: 'autpro_16', desc: 'BANCO DE CAPACITORES' },
    { id: 'autpro_17', desc: 'TAG - PAINEL DE CONTROLE E REMOTA' },
    { id: 'autpro_18', desc: 'HARDWARE' },
    { id: 'autpro_19', desc: 'COMPONENTES INTERNOS MÍNIMOS' },
    { id: 'autpro_20', desc: 'SISTEMA DE AUTOMAÇÃO' },
    { id: 'autpro_21', desc: 'DESENVOLVIMENTO DE SOFTWARE' },
    { id: 'autpro_22', desc: 'ARQUITETURA DE REDE' },
    { id: 'autpro_23', desc: 'SALA DE CONTROLE / SISTEMA DE SUPERVISÃO' },
    { id: 'autpro_24', desc: 'FORNECIMENTO DE INSTRUMENTAÇÃO' },
    { id: 'autpro_25', desc: 'SERVIÇOS E MATERIAIS DE INSTALAÇÃO' },
    { id: 'autpro_26', desc: 'INSTALAÇÕES DE MÉDIA TENSÃO' },
    { id: 'autpro_27', desc: 'INSTALAÇÕES DE BAIXA TENSÃO' },
    { id: 'autpro_28', desc: 'SISTEMA DE ILUMINAÇÃO' },
    { id: 'autpro_29', desc: 'INSTRUMENTAÇÃO' },
    { id: 'autpro_30', desc: 'SISTEMA DE CFTV E CONTROLE DE ACESSO' },
    { id: 'autpro_31', desc: 'ATERRAMENTO/SPDA' },
    { id: 'autpro_32', desc: 'AR COMPRIMIDO' },
    { id: 'autpro_33', desc: 'COMISSIONAMENTO / START UP' },
    { id: 'autpro_34', desc: 'TESTE DE ACEITAÇÃO DE CAMPO (TAC)' },
    { id: 'autpro_35', desc: 'STARTUP' },
    { id: 'autpro_36', desc: 'OPERAÇÃO ASSISTIDA' },
    { id: 'autpro_37', desc: 'LISTA DE DESVIOS / DIVERGÊNCIAS' },
    { id: 'autpro_38', desc: 'RESPONSABILIDADES DA AUTPRO' },
    { id: 'autpro_39', desc: 'RESPONSABILIDADES DO CONTRATANTE' },
    { id: 'autpro_40', desc: 'FORA DE ESCOPO' },
    { id: 'autpro_41', desc: 'MOBILIZAÇÃO E DESMOBILIZAÇÃO' },
    { id: 'autpro_42', desc: 'PRAZO DE EXECUÇÃO DAS ATIVIDADES' },
    { id: 'autpro_43', desc: 'TRANSPORTE E DESCARGA' },
    { id: 'autpro_44', desc: 'LOCAL DOS SERVIÇOS' },
    { id: 'autpro_45', desc: 'CONDIÇÕES GERAIS DE FORNECIMENTO' },
    { id: 'autpro_46', desc: 'ALTERAÇÃO DE ESCOPO' },
    { id: 'autpro_47', desc: 'RECURSOS TÉCNICOS' },
    { id: 'autpro_48', desc: 'GARANTIAS' },
    { id: 'autpro_49', desc: 'EXAME DE COVID 19' },
    { id: 'autpro_50', desc: 'REAJUSTE DE PREÇO' },
    { id: 'autpro_51', desc: 'COVID 19' },
    { id: 'autpro_52', desc: 'VARIAÇÃO CAMBIAL' },
    { id: 'autpro_53', desc: 'VARIAÇÃO DE PREÇOS DO COBRE' },
    { id: 'autpro_54', desc: 'JORNADA DE TRABALHO' },
    { id: 'autpro_55', desc: 'VALIDADE DA PROPOSTA' },
    { id: 'autpro_56', desc: 'CONFIDENCIALIDADE' }
];

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
        this._usersCache = null;

        store.subscribe((state) => {

            const container = document.getElementById('view-proposta-tecnica');

            if (container && !container.classList.contains('hidden-module')) {

                this.render();

            }

        });

        this._loadUsers();
    },



    create() {

        const company = store.getState().company || {};
        const vendorDefaults = (() => {
            try { return JSON.parse(company.vendorDefaults || '[]'); } catch (e) { return []; }
        })();
        const initialVendorList = Object.keys(VENDOR_MAP).map(comp => ({
            comp,
            brand: VENDOR_MAP[comp][0] || '',
            opt: '__PADRAO__',
            optEspecifique: ''
        }));
        vendorDefaults.forEach(dv => {
            if (!initialVendorList.find(v => v.comp === dv.comp)) {
                initialVendorList.push({
                    comp: dv.comp,
                    brand: dv.brand || '',
                    opt: dv.opt || '__PADRAO__',
                    optEspecifique: dv.optEspecifique || ''
                });
            }
        });

        let initialData = {

            id: 'PT-' + Date.now().toString(36).toUpperCase(),

            ptc_folder: window.app.currentPtc?.folder || '',

            cliente: window.app.currentPtc?.client || '',

            projeto: window.app.currentPtc?.title || '',

            objeto: 'FORNECIMENTO DE PAINÉIS ELÉTRICOS',

            equipments: [],
            scopeItems: [],
            autproScope: [],
            exclusions: makeDefaultExclusions(),
            cidade: '',
            uf: '',
            vendorList: initialVendorList,

            revisions: [{ no: '00', desc: 'Emissão Inicial', elab: '', verif: '', aprov: '', data: new Date().toLocaleDateString() }],
            engenheiroResponsavel: '',

            updatedAt: new Date().toISOString()

        };

        this.viewMode = 'form';

        this.activeTab = 'geral';

        this.activeEquipmentIndex = -1;

        this.cargasSubView = 'edit';

        store.setState({ activeTechnicalProposal: initialData });

        this.renderModal(initialData);

    },



    switchTab(tabId) {

        if (this.activeTab === 'equipments') {

            this.captureEquipmentData();

        }

        if (this.activeTab === 'infraestrutura') {

            this.captureInfraData();

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

            const newEq = data.equipments[index];
            if (newEq) {
                const isTrMt = newEq.type === 'TR-MT';
                const isAutomation = newEq.type === 'PLC' || newEq.type === 'REM';
                const validSubTabs = isTrMt ? ['technical', 'materiais', 'norms', 'deviations', 'expenses']
                    : newEq.type === 'SEU' ? ['technical', 'deviations', 'expenses']
                    : newEq.type === 'ELETROCENTRO' ? ['eletrocentro', 'materiais', 'norms', 'deviations', 'labor', 'expenses', 'calc_mecanico']
                    : isAutomation ? ['technical', 'norms', 'io_list', 'bom', 'deviations', 'labor', 'expenses']
                    : ['technical', 'norms', 'loads', 'enclosures', 'busbars', 'deviations', 'labor', 'expenses', 'calc_eletrico', 'calc_mecanico', 'layout'];
                if (!validSubTabs.includes(this.activeSubTab)) {
                    this.activeSubTab = validSubTabs[0];
                }
            }

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

        if (eq && eq.type === 'TR-MT' && ['loads','enclosures','busbars','labor','calc_eletrico','calc_mecanico'].includes(this.activeSubTab)) {
            return;
        }
        if (eq && eq.type === 'TR-MT' && this.activeSubTab === 'exclusions') {
            return;
        }

        const formData = new FormData(form);

        // Always capture ufOrigem when form is submitted
        eq.ufOrigem = formData.get('eq_ufOrigem') || eq.ufOrigem || '';

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

                    'barramento_tratamento', 'termoretratil', 'norma_teste',

                    'alturaPainel', 'larguraPainel', 'profundidadePainel',

                    'fabricante'

                ];



                technicalFields.forEach(field => {

                    const val = formData.get(`eq_${field}`);

                    const otherVal = formData.get(`eq_${field}_other`);

                    eq.technical[field] = (val === 'Outro') ? (otherVal || '') : val;

                });

                // Capture painelTypeId (stored at eq root, not in eq.technical)
                const pTypeId = formData.get('eq_painelTypeId');
                eq.painelTypeId = pTypeId || null;

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



        if (this.activeSubTab === 'io_list') {
            const currentIo = eq.ioList || { racks: [] };
            const racks = (currentIo.racks || []).map((rack, ri) => {
                const slots = (rack.slots || []).map((slot, si) => {
                    const channels = (slot.channels || []).map((ch, ci) => ({
                        channelNumber: formData.get(`io_ch_num_${ri}_${si}_${ci}`) ?? ch.channelNumber ?? ci,
                        channelType: formData.get(`io_ch_type_${ri}_${si}_${ci}`) || ch.channelType || 'DI',
                        signalLevel: formData.get(`io_ch_signal_${ri}_${si}_${ci}`) || ch.signalLevel || '',
                        fieldDevice: formData.get(`io_ch_device_${ri}_${si}_${ci}`) || ch.fieldDevice || '',
                        tag: formData.get(`io_ch_tag_${ri}_${si}_${ci}`) || ch.tag || '',
                        terminalNumber: formData.get(`io_ch_terminal_${ri}_${si}_${ci}`) || ch.terminalNumber || '',
                        wireColor: formData.get(`io_ch_wirecolor_${ri}_${si}_${ci}`) || ch.wireColor || '',
                        wireNumber: formData.get(`io_ch_wirenum_${ri}_${si}_${ci}`) || ch.wireNumber || '',
                        cableId: formData.get(`io_ch_cable_${ri}_${si}_${ci}`) || ch.cableId || '',
                        junctionBox: formData.get(`io_ch_jb_${ri}_${si}_${ci}`) || ch.junctionBox || '',
                        status: formData.get(`io_ch_status_${ri}_${si}_${ci}`) || ch.status || 'active',
                        notes: formData.get(`io_ch_notes_${ri}_${si}_${ci}`) || ch.notes || ''
                    }));
                    return {
                        position: formData.get(`io_slot_pos_${ri}_${si}`) ?? slot.position ?? si + 1,
                        modulePartNumber: formData.get(`io_slot_pn_${ri}_${si}`) ?? slot.modulePartNumber ?? '',
                        moduleType: formData.get(`io_slot_type_${ri}_${si}`) ?? slot.moduleType ?? 'DI',
                        signalType: formData.get(`io_slot_signal_${ri}_${si}`) ?? slot.signalType ?? '',
                        totalChannels: formData.get(`io_slot_channels_${ri}_${si}`) ?? slot.totalChannels ?? '',
                        channels
                    };
                });
                return {
                    position: formData.get(`io_rack_pos_${ri}`) ?? rack.position ?? ri + 1,
                    backplane: formData.get(`io_rack_bp_${ri}`) ?? rack.backplane ?? '',
                    cpu: formData.get(`io_rack_cpu_${ri}`) ?? rack.cpu ?? '',
                    powerSupply: formData.get(`io_rack_ps_${ri}`) ?? rack.powerSupply ?? '',
                    comm: formData.get(`io_rack_comm_${ri}`) ?? rack.comm ?? '',
                    slots
                };
            });
            const totals = this._calcIOTotals(racks);
            eq.ioList = { racks, ...totals };
            if (eq.type === 'PLC' || eq.type === 'REM') {
                const bom = deriveMaterials(eq.ioList || { racks: [] });
                eq.automationMaterials = (bom.items || []).map(item => ({
                    materialId: item.materialId || '',
                    descricao: item.descricao,
                    fabricante: item.fabricante || '',
                    codigoFabricante: item.codigoFabricante || '',
                    modelo: '',
                    custo: item.custoUnitario || 0,
                    qtd: item.qtd || 0,
                    icms: item.icms || 0,
                    ipi: item.ipi || 0,
                    pis: item.pis || 0,
                    cofins: item.cofins || 0
                }));
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

            rows.forEach(row => {

                const groupEl = row.querySelector('[name^="labor_group_"]');

                const roleEl = row.querySelector('[name^="labor_role_"]');

                const hoursEl = row.querySelector('[name^="labor_hours_"]');

                const rateEl = row.querySelector('[name^="labor_rate_"]');

                const autoEl = row.querySelector('[name^="labor_auto_"]');

                laborItems.push({

                    group: groupEl ? groupEl.value : '',

                    role: roleEl ? roleEl.value : '',

                    hours: hoursEl ? parseFloat(hoursEl.value || 0) : 0,

                    hourlyRate: rateEl ? app.parseCurrency(rateEl.value || '0') : 0,

                    auto: autoEl ? autoEl.value === 'true' : false

                });

            });

            eq.labor = { items: this.deduplicarLaborItems(laborItems) };

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



        if (this.activeSubTab === 'materiais') {
            const materialItems = [];
            const rows = form.querySelectorAll('.mat-row');
            rows.forEach((row, i) => {
                const qtd = parseFloat(formData.get(`mat_qtd_${i}`) || 0);
                const custo = parseFloat((formData.get(`mat_custo_${i}`) || '0').replace(',', '.'));
                materialItems.push({
                    materialId: formData.get(`mat_materialId_${i}`) || '',
                    descricao: formData.get(`mat_desc_${i}`) || '',
                    fabricante: formData.get(`mat_fabricante_${i}`) || '',
                    codigoFabricante: formData.get(`mat_codfab_${i}`) || '',
                    modelo: formData.get(`mat_modelo_${i}`) || '',
                    custo: custo,
                    qtd: qtd
                });
            });
            eq.materials = materialItems;
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

                        minhaEmpresa: row.querySelector('input[name="el_scope_empresa"]')?.checked || false,

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

                        <button class="btn btn-cancel" onclick="document.getElementById('modal-add-eq').remove()">Cancelar</button>

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
                        <button class="btn btn-cancel" onclick="document.getElementById('modal-add-seu').remove()">Cancelar</button>
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
                        <button class="btn btn-cancel" onclick="document.getElementById('modal-add-seu-comp').remove()">Cancelar</button>
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
        this.syncScopeFromProposal();
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
            ufOrigem: store.getState().company?.uf || '',
            seu_components: selectedIds,
            norms: [],
            technical: { tensao_primaria: tensao },
            loads: []
        };

        data.equipments.push(newSeu);
        this.activeEquipmentIndex = data.equipments.length - 1;
        this.activeSubTab = 'technical';
        document.getElementById('modal-add-seu').remove();
        this.syncScopeFromProposal();
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

        const isAutomation = type === 'PLC' || type === 'REM';

        const newEq = {

            id: Date.now(),

            tag: tag,

            type: type,

            ufOrigem: store.getState().company?.uf || '',

            norms: type === 'CUB-MT' ? ['nbr_iec_62271', 'nr10', 'nr12', 'nbr14039', 'nbr_iec_60529'] : type === 'ELETROCENTRO' ? ['iec_62271_202', 'nbr_8800', 'nbr_13231', 'nbr_10898'] : ['nbr_iec_61439', 'nr10', 'nr12', 'nbr_iec_60529'],

            technical: this.getDefaultTechnicalForType(type),

            loads: [],
            materials: [],
            painelTypeId: null,

            ...(isAutomation ? {
                ioList: {
                    racks: [],
                    totalDI: 0, totalDO: 0, totalAI: 0, totalAO: 0,
                    spareDI: 0, spareDO: 0, spareAI: 0, spareAO: 0,
                    ioTypicals: {
                        DI: { terminalBlocks: 1, fuseTerminal: true, relayTerminal: false, surgeProtector: false, wireColor: 'blue', wiringType: '2-wire', cableType: 'standard', notes: '' },
                        DO: { terminalBlocks: 1, fuseTerminal: false, relayTerminal: true, surgeProtector: false, wireColor: 'red', wiringType: '2-wire', cableType: 'standard', notes: '' },
                        AI: { terminalBlocks: 3, fuseTerminal: false, relayTerminal: false, surgeProtector: true, wireColor: 'green', wiringType: '3-wire', cableType: 'shielded-twisted-pair', notes: '' },
                        AO: { terminalBlocks: 2, fuseTerminal: false, relayTerminal: false, surgeProtector: false, wireColor: 'yellow', wiringType: '2-wire', cableType: 'shielded', notes: '' }
                    }
                }
            } : {})

        };



        data.equipments.push(newEq);

        this.activeEquipmentIndex = data.equipments.length - 1;

        this.activeSubTab = 'technical';

        document.getElementById('modal-add-eq').remove();

        this.syncScopeFromProposal();

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

            segregacao: 'Forma 2b',

            execucao: 'Fixa',

            instalacao: 'Abrigada',

            cor: 'RAL 7035',

            norma_teste: 'IEC 61439-1&2',

            alturaPainel: '2200',

            larguraPainel: '800',

            profundidadePainel: '600'

        };

    },

    _mapEqTypeToCategoria(eqType) {
        const map = {
            'CCM-BT': 'CCM',
            'QGBT': 'QGBT',
            'CUB-MT': 'CUB',
            'QTA': 'QTA',
            'PLC': 'PLC',
            'BC': 'BC',
            'REM': 'REM',
            'QDL': 'QDL',
            'QDF': 'QDF'
        };
        return map[eqType] || null;
    },

    _renderPainelTypeSelector(eq) {
        const categoria = this._mapEqTypeToCategoria(eq.type);
        const paineis = categoria ? (store.getState().painelTypes || []).filter(p => p.cat_categoria === categoria) : [];
        const selecionado = eq.painelTypeId || '';
        const painelSelecionado = paineis.find(p => p.id === selecionado);
        if (paineis.length === 0 && !selecionado) return '';
        return `
            <div class="form-group" style="border: 1px solid #dbeafe; border-radius: 10px; padding: 16px; background: #eff6ff; margin-bottom: 20px;">
                <label class="form-label" style="color: #1e40af; font-weight: 700;">Tipo de Painel (Estrutura)</label>
                <select name="eq_painelTypeId" class="form-control" onchange="app.propostaTecnica._onPainelTypeChange(this.value)" style="max-width: 500px;">
                    <option value="">${paineis.length > 0 ? 'Selecione um Tipo de Painel...' : 'Nenhum tipo disponível para esta categoria'}</option>
                    ${paineis.map(p => `
                        <option value="${p.id}" ${selecionado === p.id ? 'selected' : ''}>
                            ${p.tipo}${p.descricao ? ' — ' + p.descricao : ''} (${p.largura || '?'}x${p.profundidade || '?'}mm)
                        </option>
                    `).join('')}
                </select>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                    ${selecionado && painelSelecionado
                        ? 'Pré-carregado: ' + painelSelecionado.tipo + ' — ' + painelSelecionado.largura + 'x' + painelSelecionado.profundidade + 'mm, IP ' + (painelSelecionado.ip || '-')
                        : 'Selecione para pré-carregar dimensões, IP, cor e BOM da chaparia automaticamente.'}
                </div>
            </div>
        `;
    },

    _onPainelTypeChange(painelTypeId) {
        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        if (!painelTypeId) {
            eq.painelTypeId = null;
            store.setState({ activeTechnicalProposal: data });
            this.renderSubTab();
            return;
        }

        const painel = store.getState().painelTypes.find(p => p.id === painelTypeId);
        if (!painel) return;

        eq.painelTypeId = painel.id;
        if (!eq.technical) eq.technical = {};
        if (painel.altura) eq.technical.alturaPainel = painel.altura;
        if (painel.largura) eq.technical.larguraPainel = painel.largura;
        if (painel.profundidade) eq.technical.profundidadePainel = painel.profundidade;
        if (painel.ip) eq.technical.ip = painel.ip;
        if (painel.cor) eq.technical.cor_externa = painel.cor;

        store.setState({ activeTechnicalProposal: data });
        app.toast(`Tipo de painel "${painel.tipo}" aplicado. Dimensões e IP pré-carregados.`, 'success');
        this.renderSubTab();
    },

    // ── Fase 2: Gerar materiais da chaparia a partir do layout ────────────────

    _gerarMateriaisChaparia(eq) {
        const painelType = (store.getState().painelTypes || []).find(p => p.id === eq.painelTypeId);
        const cabinets = eq.layoutConfig?.cabinetAssignments;
        if (!painelType || !cabinets || Object.keys(cabinets).length === 0) return null;

        const bomBase = painelType.items || [];
        if (bomBase.length === 0) return null;

        // Group cabinets by width
        const cabIds = Object.keys(cabinets);
        const porLargura = {};
        cabIds.forEach(cabId => {
            const cab = cabinets[cabId];
            const w = cab.width || 800;
            if (!porLargura[w]) porLargura[w] = [];
            porLargura[w].push(cab);
        });

        // Identify side panel items in BOM to handle separately
        const bomSemLaterais = bomBase.filter(i => !(i.descricao || '').toLowerCase().includes('lateral'));
        const bomLaterais = bomBase.filter(i => (i.descricao || '').toLowerCase().includes('lateral'));

        const gerados = [];

        // For each width group, replicate base BOM items
        Object.entries(porLargura).forEach(([largura, cabs]) => {
            const qtd = cabs.length;
            bomSemLaterais.forEach(item => {
                const descMatch = item.descricao ? item.descricao.match(/(\d{3,4})\s*mm/) : null;
                const itemWidth = descMatch ? parseInt(descMatch[1]) : null;
                const desc = itemWidth && itemWidth !== parseInt(largura)
                    ? item.descricao.replace(String(itemWidth), String(largura))
                    : item.descricao;
                gerados.push({
                    _origin: 'chaparia',
                    materialId: item.materialId || '',
                    descricao: desc || item.descricao,
                    fabricante: item.fabricante || '',
                    codigoFabricante: item.codigoFabricante || '',
                    modelo: '',
                    custo: item.custo || 0,
                    qtd: (item.qtd || 1) * qtd
                });
            });
        });

        // Add side panels: always 2 regardless of cabinet count
        if (bomLaterais.length > 0) {
            const lat = bomLaterais[0];
            gerados.push({
                _origin: 'chaparia',
                materialId: lat.materialId || '',
                descricao: lat.descricao,
                fabricante: lat.fabricante || '',
                codigoFabricante: lat.codigoFabricante || '',
                modelo: '',
                custo: lat.custo || 0,
                qtd: 2
            });
        } else {
            // Fallback: generic side panel entry
            gerados.push({
                _origin: 'chaparia',
                materialId: '',
                descricao: 'Fechamento Lateral (par)',
                fabricante: '',
                codigoFabricante: '',
                modelo: '',
                custo: 0,
                qtd: 2
            });
        }

        // Consolidate items with same description+custo
        const consolidado = {};
        gerados.forEach(item => {
            const key = item.descricao + '|' + item.custo + '|' + item.fabricante;
            if (consolidado[key]) {
                consolidado[key].qtd += item.qtd;
            } else {
                consolidado[key] = { ...item };
            }
        });

        return Object.values(consolidado);
    },

    _aplicarMateriaisChaparia() {
        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        const itens = this._gerarMateriaisChaparia(eq);
        if (!itens) {
            app.toast('Defina um Tipo de Painel (Ficha Técnica) e crie armários no Layout primeiro.', 'warning');
            return;
        }

        // Show preview modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-chaparia-preview';
        const total = itens.reduce((s, i) => s + (i.custo || 0) * i.qtd, 0);
        modal.innerHTML = `
            <div class="modal" style="width:700px;max-width:90vw;">
                <div class="modal-header" style="background:var(--color-accent);color:white;">
                    <h3><i class="ph ph-package"></i> Materiais da Chaparia — ${eq.tag}</h3>
                    <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <div style="font-size:13px;color:#64748b;margin-bottom:16px;">
                        Os seguintes materiais serão adicionados à Lista de Materiais do equipamento:
                    </div>
                    <div style="max-height:360px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;">
                        <table class="w-full" style="font-size:12px;">
                            <thead>
                                <tr style="background:#f8fafc;">
                                    <th style="padding:8px 10px;text-align:left;font-weight:700;">Descrição</th>
                                    <th style="padding:8px 10px;text-align:center;width:60px;">Qtd</th>
                                    <th style="padding:8px 10px;text-align:right;width:90px;">Custo Unit.</th>
                                    <th style="padding:8px 10px;text-align:right;width:100px;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itens.map(i => `
                                    <tr style="border-top:1px solid #f1f5f9;">
                                        <td style="padding:8px 10px;">${i.descricao}</td>
                                        <td style="padding:8px 10px;text-align:center;">${i.qtd}</td>
                                        <td style="padding:8px 10px;text-align:right;">${app.formatCurrency(i.custo || 0)}</td>
                                        <td style="padding:8px 10px;text-align:right;font-weight:700;">${app.formatCurrency((i.custo || 0) * i.qtd)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr style="background:#f8fafc;border-top:2px solid #e2e8f0;">
                                    <td colspan="3" style="padding:10px;text-align:right;font-weight:700;text-transform:uppercase;">Total</td>
                                    <td style="padding:10px;text-align:right;font-weight:800;color:#1e3a8a;font-size:15px;">${app.formatCurrency(total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <span style="font-size:11px;color:#64748b;flex:1;">
                        <i class="ph ph-info"></i> Materiais anteriores com origem "chaparia" serão substituídos.
                    </span>
                    <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.propostaTecnica._confirmarMateriaisChaparia()">
                        <i class="ph ph-check"></i> Confirmar e Adicionar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _confirmarMateriaisChaparia() {
        document.getElementById('modal-chaparia-preview')?.remove();
        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        const itens = this._gerarMateriaisChaparia(eq);
        if (!itens) return;

        // Remove old chaparia items and add new ones
        eq.materials = [...(eq.materials || []).filter(m => m._origin !== 'chaparia'), ...itens];
        store.setState({ activeTechnicalProposal: data });
        app.toast(`${itens.length} itens de chaparia adicionados aos materiais de ${eq.tag}!`, 'success');
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

    moveEquipment(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        const data = store.getState().activeTechnicalProposal;
        const activeId = data.equipments[this.activeEquipmentIndex]?.id;
        const [moved] = data.equipments.splice(fromIndex, 1);
        const adjustedTo = toIndex > fromIndex ? toIndex - 1 : toIndex;
        data.equipments.splice(adjustedTo, 0, moved);
        this.activeEquipmentIndex = data.equipments.findIndex(e => e.id === activeId);
        if (this.activeEquipmentIndex === -1) this.activeEquipmentIndex = 0;
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    moveLoad(fromIdx, toIdx) {
        if (fromIdx === toIdx) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;
        const [moved] = eq.loads.splice(fromIdx, 1);
        const adjustedTo = toIdx > fromIdx ? toIdx - 1 : toIdx;
        eq.loads.splice(adjustedTo, 0, moved);
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
    clearAiField(field) {
        const state = store.getState();
        const p = state.activeTechnicalProposal;
        if (p && p._aiChanges) {
            if (p._aiChanges.geral) { const i = p._aiChanges.geral.indexOf(field); if (i !== -1) p._aiChanges.geral.splice(i, 1); }
            if (p._aiChanges.equipments) delete p._aiChanges.equipments[field];
        }
    },

    _hasAiForEq(sentinel) {
        const p = store.getState().activeTechnicalProposal;
        const eq = p?._aiChanges?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return false;
        if (eq instanceof Set) return eq.has(sentinel);
        return sentinel in eq;
    },

    clearAiFieldForEq(sentinel) {
        const p = store.getState().activeTechnicalProposal;
        const eq = p?._aiChanges?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (eq instanceof Set) eq.delete(sentinel);
        else delete eq[sentinel];
    },

    _clearAiVendorList() {
        const p = store.getState().activeTechnicalProposal;
        if (p?._aiChanges) p._aiChanges.vendorList = false;
    },
    _userOptions(selected, initialsOnly) {
        if (!this._usersCache) return '<option value="">Nenhum usuário encontrado</option>';
        const users = this._usersCache.filter(u => u.nivel === 'admin' || u.nivel === 'engenheiro');
        const _initials = name => name.split(' ').map(w => w.charAt(0)).join('').toUpperCase();
        const selectedIsInitials = !initialsOnly && selected && !users.some(u => u.name === selected);
        const matchedUser = selectedIsInitials ? users.find(u => _initials(u.name) === selected.toUpperCase()) : null;
        const html = users.map(u => {
            const val = initialsOnly ? _initials(u.name) : u.name;
            const isSelected = initialsOnly
                ? _initials(u.name) === (selected || '').toUpperCase()
                : (u.name === selected || u === matchedUser);
            let displayText;
            if (initialsOnly) {
                displayText = isSelected ? val : `${u.name} (${u.nivel})`;
            } else {
                displayText = u.name;
            }
            return `<option value="${val}" ${isSelected ? 'selected' : ''}>${displayText}</option>`;
        }).join('');
        return '<option value="">Selecione...</option>' + html;
    },

    async _loadUsers() {
        if (this._usersCache) return;
        const token = store.getState().auth?.token;
        if (!token) return;
        try {
            const r = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const j = await r.json();
            if (j && Array.isArray(j.users)) {
                this._usersCache = j.users;
                this._refreshUserDropdown();
            }
        } catch {}
        if (!this._usersCache) this._usersCache = [];
    },

    _refreshUserDropdown() {
        if (!this._usersCache || this._usersCache.length === 0) return;
        const _initials = name => name.split(' ').map(w => w.charAt(0)).join('').toUpperCase();
        const selects = document.querySelectorAll('#form-proposta-tecnica select[data-user-select]');
        selects.forEach(select => {
            const initialsOnly = select.hasAttribute('data-initials-only');
            const currentValue = select.value;
            let matchedUser = null;
            if (!initialsOnly) {
                const currentIsInitials = currentValue && !this._usersCache.some(u => u.name === currentValue);
                matchedUser = currentIsInitials ? this._usersCache.find(u => _initials(u.name) === currentValue.toUpperCase()) : null;
            }
            select.innerHTML = '<option value="">Selecione...</option>';
            this._usersCache
                .filter(u => u.nivel === 'admin' || u.nivel === 'engenheiro')
                .forEach(u => {
                    const opt = document.createElement('option');
                    const val = initialsOnly ? _initials(u.name) : u.name;
                    let isSelected;
                    if (initialsOnly) {
                        isSelected = _initials(u.name) === (currentValue || '').toUpperCase();
                    } else {
                        isSelected = u.name === currentValue || u === matchedUser;
                    }
                    opt.value = val;
                    if (initialsOnly) {
                        opt.textContent = isSelected ? val : `${u.name} (${u.nivel})`;
                    } else {
                        opt.textContent = u.name;
                    }
                    if (isSelected) opt.selected = true;
                    select.appendChild(opt);
                });
        });
    },

    _setRevisionUserText(select) {
        select.options[select.selectedIndex].text = select.value;
    },

    async renderModal(data) {
        await this._loadUsers();

        this.viewMode = 'form';

        this.forcedDashboard = false;

        if (!data) {

            console.warn("[PropostaTecnica] renderModal called with null data");

            return;

        }

        

        // Garantir estrutura mínima para propostas legadas ou novas

        if (!data.equipments) data.equipments = [];

        if (!data.scopeItems) data.scopeItems = [];

        if (!data.autproScope) data.autproScope = [];

        if (!data.revisions) data.revisions = [];

        if (!data.vendorList) data.vendorList = [];

        if (!data.infraestrutura) {
            data.infraestrutura = {
                activeDisciplina: 'civil',
                disciplinas: [
                    { id: 'civil', nome: 'Obra Civil', icone: 'ph-buildings', perda: 10, itens: [] },
                    { id: 'eletrica', nome: 'Infraestrutura Elétrica', icone: 'ph-lightning', perda: 10, itens: [] },
                    { id: 'spda', nome: 'SPDA / Aterramento', icone: 'ph-lightning-slash', perda: 10, itens: [] },
                    { id: 'mecanica', nome: 'Infraestrutura Mecânica', icone: 'ph-fan', perda: 10, itens: [] },
                    { id: 'cabeamento', nome: 'Cabeamento Estruturado', icone: 'ph-network', perda: 10, itens: [] },
                    { id: 'servicos', nome: 'Serviços Técnicos', icone: 'ph-wrench', perda: 10, itens: [] }
                ]
            };
        }
        if (!data.infraestrutura.activeDisciplina) data.infraestrutura.activeDisciplina = 'civil';

        if (data.equipments.length === 0) {
            this.activeEquipmentIndex = -1;
        } else if (data.lastActiveEquipmentIndex !== undefined) {
            this.activeEquipmentIndex = data.lastActiveEquipmentIndex;
        }

        if (typeof this.activeEquipmentIndex !== 'number') this.activeEquipmentIndex = -1;

        if (this.activeEquipmentIndex >= data.equipments.length && data.equipments.length > 0) this.activeEquipmentIndex = 0;

        

        const activeTab = data.lastActiveTab || this.activeTab || 'geral';

        const activeSubTab = data.lastActiveSubTab || this.activeSubTab || 'technical';

        

        // Sincronizar propriedades locais com o que veio do dado (âncora)

        this.activeTab = activeTab;

        this.activeSubTab = activeSubTab;



        const activeEq = (data.equipments && data.equipments.length > 0) 

            ? data.equipments[this.activeEquipmentIndex] 

            : null;

        const eq = activeEq;

        const company = store.getState().company || {};
        const isAUTPRO = company.folderName?.startsWith('AUT_');

        const html = `

            <div class="hierarchical-pt-view" style="height: calc(100vh - 120px); display: flex; flex-direction: column; background: rgb(250, 250, 250); margin: -20px; position: relative;">

                <!-- Header -->

                <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10;">

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

                    <button type="button" class="tab-btn ${activeTab === 'geral' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('geral')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'geral' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'geral' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'geral' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-identification-card"></i> Dados Gerais</button>

                    <button type="button" class="tab-btn ${activeTab === 'equipments' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('equipments')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'equipments' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'equipments' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'equipments' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-cpu"></i> Equipamentos</button>

                    <button type="button" class="tab-btn ${activeTab === 'infraestrutura' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('infraestrutura')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'infraestrutura' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'infraestrutura' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'infraestrutura' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-toolbox"></i> Infraestrutura</button>

                    <button type="button" class="tab-btn ${activeTab === 'escopo' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('escopo')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'escopo' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'escopo' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'escopo' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-list-checks"></i> Escopo</button>

                    ${isAUTPRO ? `
                    <button type="button" class="tab-btn ${activeTab === 'escopoAUTPRO' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('escopoAUTPRO')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'escopoAUTPRO' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'escopoAUTPRO' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'escopoAUTPRO' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-clipboard-text"></i> Escopo AUTPRO</button>
                    ` : ''}

                    <button type="button" class="tab-btn ${activeTab === 'vendor' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('vendor')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'vendor' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'vendor' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'vendor' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-buildings"></i> Vendor List</button>

                    <button type="button" class="tab-btn ${activeTab === 'exclusions' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('exclusions')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'exclusions' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'exclusions' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'exclusions' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-x-circle"></i> Exclusões</button>

                    <button type="button" class="tab-btn ${activeTab === 'revisoes' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('revisoes')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'revisoes' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'revisoes' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'revisoes' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-clock-counter-clockwise"></i> Revisões</button>

                    <button type="button" class="tab-btn ${activeTab === 'assinaturas' ? 'active' : ''}" onclick="window.propostaTecnicaModule.switchTab('assinaturas')" style="padding:14px 20px;border:none;background:transparent;font-weight:${activeTab === 'assinaturas' ? '700' : '600'};font-size:13px;cursor:pointer;white-space:nowrap;color:${activeTab === 'assinaturas' ? 'var(--color-accent)' : '#64748b'};border-bottom:3px solid ${activeTab === 'assinaturas' ? 'var(--color-accent)' : 'transparent'};transition:all 0.2s;"><i class="ph ph-pen-nib"></i> Assinaturas (Rodapé)</button>

                </div>



                <!-- Content Area -->

                <div class="module-body" style="flex: 1; overflow: hidden; background: rgb(250, 250, 250); position: relative; display: flex; flex-direction: column;">

                    <form id="form-proposta-tecnica" onsubmit="return false;" style="height: 100%; display: flex; flex-direction: column;">

                        <div style="flex: 1; overflow-y: auto; scrollbar-gutter: stable;">

                            ${activeTab === 'geral' ? this.renderTabGeral(data) : ''}

                            ${activeTab === 'escopo' ? this.renderTabEscopo(data) : ''}

                            ${activeTab === 'infraestrutura' ? this.renderTabInfraestrutura(data) : ''}

                            ${activeTab === 'equipments' ? this.renderTabEquipments(data, activeEq) : ''}

                            ${activeTab === 'vendor' ? this.renderTabVendorList(data) : ''}

                            ${activeTab === 'exclusions' ? this.renderProposalExclusions(data) : ''}

                            ${activeTab === 'revisoes' ? this.renderTabRevisoes(data) : ''}

                            ${activeTab === 'assinaturas' ? this.renderTabAssinaturas(data) : ''}

                            ${activeTab === 'escopoAUTPRO' && isAUTPRO ? this.renderTabEscopoAUTPRO(data) : ''}

                        </div>

                    </form>

                </div>



                <!-- Footer -->

                <div class="module-footer" style="padding: 15px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">

                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-ghost btn-export-word" onclick="window.propostaTecnicaModule.exportToWord()" style="background: var(--color-accent); color: white;"><i class="ph ph-file-doc"></i> Exportar Word</button>
                    </div>

                    <div style="display: flex; gap: 12px;">

                        <button type="button" class="btn btn-cancel" onclick="window.propostaTecnicaModule.closeModal()">Cancelar</button>

                        <button type="button" class="btn btn-primary btn-save" onclick="window.propostaTecnicaModule.save()" style="">Salvar</button>

                        <button type="button" class="btn btn-outline btn-save-as-new" onclick="window.propostaTecnicaModule.saveAsNew()" style="background: var(--color-accent); color: white; display: flex; align-items: center; gap: 6px;"><i class="ph ph-copy"></i> Salvar como Nova</button>

                    </div>

                </div>

            </div>

        `;

        const container = document.getElementById('view-proposta-tecnica');

        if (container) {

            container.innerHTML = html;

            // Draw side view on initial render if checkbox is already checked
            if (activeTab === 'equipments' && activeSubTab === 'layout') {
                const eq = data?.equipments?.[this.activeEquipmentIndex];
                if (eq?.layoutConfig?.showSideView) {
                    this._redrawLayoutCanvas();
                }
            }

            container.classList.remove('hidden-module');

            // Modo somente leitura (Fechada/Perdida no pipeline)
            if (store.getState().proposalReadOnly) {
                this._applyReadOnly(container);
            }

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

                    .hierarchical-pt-view .eq-item.active { background: var(--color-accent); border-color: var(--color-accent); color: white; }

                    .hierarchical-pt-view .eq-item.active:hover { background: rgb(56, 86, 14); border-color: rgb(56, 86, 14); color: white; }

                    .hierarchical-pt-view .eq-item.active button[title="Editar TAG"] { color: white !important; }

                    .hierarchical-pt-view .sub-tab-btn { cursor: pointer; transition: all 0.2s; }

                    .hierarchical-pt-view .sub-tab-btn:hover { color: var(--color-accent); }

                    .hierarchical-pt-view .sub-tab-btn.active { color: var(--color-accent); font-weight: 800; }

                    .hierarchical-pt-view .btn-save:hover { background-color: rgb(85, 40, 191) !important; border-color: rgb(85, 40, 191) !important; }

                    .hierarchical-pt-view .btn-save-as-new:hover { background-color: rgb(230, 134, 67) !important; border-color: rgb(230, 134, 67) !important; }

                    .hierarchical-pt-view .btn-export-word:hover { background-color: rgb(155, 158, 150) !important; border-color: rgb(155, 158, 150) !important; }

                    .hierarchical-pt-view .btn-add-revision:hover { background-color: rgb(0, 0, 255) !important; border-color: rgb(0, 0, 255) !important; }

                    .hierarchical-pt-view .form-label { font-weight: 700; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 6px; display: block; }

                    .hierarchical-pt-view .form-control { border-radius: 8px; border: 1.5px solid #e2e8f0; padding: 10px 14px; font-size: 13px; transition: all 0.2s; }

                    .hierarchical-pt-view .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); outline: none; }

                    .ai-filled { color: #2563eb !important; }
                    .ai-filled option { color: initial; }
                    .ai-label { color: #2563eb; font-size: 9px; font-weight: 700; margin-left: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                    .dragging { opacity: 0.4; }
                    .drag-over { background: #e0f2fe !important; border-bottom: 2px dashed #3b82f6 !important; }

                `;

                document.head.appendChild(style);

            }

            // Inicializar SortableJS para reordenar Cargas e LM
            this._initSortableLoads();

        }

    },

    _initSortableLoads() {
        const lmContainer = document.getElementById('lm-sortable-container');
        if (lmContainer && window.Sortable) {
            if (lmContainer.__sortable) lmContainer.__sortable.destroy();
            lmContainer.__sortable = Sortable.create(lmContainer, {
                handle: '.lm-drag-handle',
                animation: 150,
                ghostClass: 'opacity-30',
                onEnd: (evt) => {
                    if (evt.oldIndex === evt.newIndex) return;
                    this.captureEquipmentData();
                    const data = store.getState().activeTechnicalProposal;
                    const eq = data.equipments[this.activeEquipmentIndex];
                    if (!eq) return;
                    const [moved] = eq.loads.splice(evt.oldIndex, 1);
                    eq.loads.splice(evt.newIndex, 0, moved);
                    store.setState({ activeTechnicalProposal: data });
                    this.renderModal(data);
                }
            });
        }
    },



    renderTabGeral(data) {
        const aiGeral = new Set(data._aiChanges?.geral || []);
        const isAi = (f) => aiGeral.has(f);

        return `

            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Dados Gerais da Proposta</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Informações do cliente e detalhes do projeto</div>
                    </div>
                </div>

                <div class="form-group">

                    <label class="form-label">Cliente${isAi('cliente') ? '<span class="ai-label">IA</span>' : ''}</label>

                    <select name="cliente" id="pt_cliente" class="form-control${isAi('cliente') ? ' ai-filled' : ''}" onchange="app.propostaTecnica.handleClientChange(this.value)">

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
                                const ptcFolder = String(window.app.currentPtc?.folder || '');
                                const newMatch = ptcFolder.match(/^(\d{8,10})/);
                                const oldMatch = ptcFolder.match(/PTC-\d{4}-\d+/i);
                                const basePtc = newMatch ? newMatch[1] : (oldMatch ? oldMatch[0].toUpperCase() : 'PTC-0000-0000');
                                return `${basePtc}-PT${data.customCodigoSuffix || '_Rev00'}`;
                            })()}" readonly style="background-color: #f1f5f9; font-weight: 500;">

                            <button type="button" class="btn btn-secondary" title="Editar Código" onclick="const el = document.getElementById('pt-prop-codigo'); el.removeAttribute('readonly'); el.style.backgroundColor = 'white'; el.focus();">

                                <i class="ph ph-pencil-simple"></i>

                            </button>

                        </div>

                    </div>

                    <div class="form-group">

                        <label class="form-label">Data de Emissão${isAi('data_emissao') ? '<span class="ai-label">IA</span>' : ''}</label>

                        <input type="date" name="data_emissao" class="form-control${isAi('data_emissao') ? ' ai-filled' : ''}" value="${data.data_emissao || new Date().toISOString().split('T')[0]}" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">

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

                    <label class="form-label">Nome do Projeto / Título${isAi('projeto') ? '<span class="ai-label">IA</span>' : ''}</label>

                        <input type="text" name="projeto" class="form-control${isAi('projeto') ? ' ai-filled' : ''}" value="${data.projeto || (window.app.currentPtc ? window.app.currentPtc.title : '')}" placeholder="Ex: Painel Elétrico de Baixa Tensão - 440V" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">

                </div>



                <div class="form-group" style="margin-top: 20px;">

                    <label class="form-label">Referência / Subtítulo</label>

                    <input type="text" name="referencia" class="form-control" value="${data.referencia || ''}" placeholder="Ex: CCM para Projeto Aumento do Mix de Açúcar">

                </div>



                <div class="grid-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">

                    <div class="form-group">

                        <label class="form-label">Objeto do Fornecimento${isAi('objeto') ? '<span class="ai-label">IA</span>' : ''}</label>

                        <input type="text" name="objeto" class="form-control${isAi('objeto') ? ' ai-filled' : ''}" value="${data.objeto || 'FORNECIMENTO DE PAIN�?�?�IS EL�?�?�TRICOS'}" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">

                    </div>

                    <div class="row" style="display: flex; gap: 12px;">
                        <div class="form-group" style="flex: 2;">
                            <label class="form-label">Cidade${isAi('cidade') ? '<span class="ai-label">IA</span>' : ''}</label>
                            <input type="text" name="cidade" id="pt_cidade" class="form-control${isAi('cidade') ? ' ai-filled' : ''}" value="${data.cidade || ''}" placeholder="Ex: Sertãozinho" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">UF${isAi('uf') ? '<span class="ai-label">IA</span>' : ''}</label>
                            <select name="uf" id="pt_uf" class="form-control${isAi('uf') ? ' ai-filled' : ''}" onfocus="this.classList.remove('ai-filled');this.closest('.form-group')?.querySelector('.ai-label')?.remove();window.propostaTecnicaModule.clearAiField(this.name)">
                                <option value="">Selecione...</option>
                                ${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf =>
                                    `<option value="${uf}" ${data.uf === uf ? 'selected' : ''}>${uf}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <input type="hidden" name="localizacao" id="pt_localizacao" value="${data.localizacao || ''}">

                    <div class="form-group">
                        <label class="form-label">Engenheiro Responsável</label>
                        <select name="engenheiroResponsavel" class="form-control" data-user-select>
                            ${this._userOptions(data.engenheiroResponsavel)}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Vendedor</label>
                        <select name="vendedor" class="form-control">
                            <option value="">Selecione...</option>
                            ${(() => {
                                const list = store.getState().vendedores || [];
                                const current = data.vendedor || '';
                                const exists = list.some(v => v.nome === current);
                                let html = '';
                                if (current && !exists) {
                                    html += `<option value="${this._escapeHtml(current)}" selected>${this._escapeHtml(current)}</option>`;
                                }
                                html += list.map(v => `<option value="${this._escapeHtml(v.nome)}"${v.nome === current ? ' selected' : ''}>${this._escapeHtml(v.nome)}</option>`).join('');
                                return html;
                            })()}
                        </select>
                    </div>

                </div>



                <!-- Image Uploads Row -->

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #e2e8f0;">

                    <!-- Company Header Logo -->

                    <div class="form-group">

                        <label class="form-label">Cabeçalho (Logo)</label>

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
                                <div style="margin-top: 8px;">
                                    <button type="button" class="btn btn-sm btn-danger" onclick="app.propostaTecnica.removeClientLogo()">
                                        <i class="ph ph-trash"></i> Remover Logo
                                    </button>
                                </div>

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

            `;

    },

    renderTabEscopo(data) {
        const items = data.scopeItems || [];
        const autoItems = items.filter(it => it.auto);
        const manualItems = items.filter(it => !it.auto);
        const equipItems = autoItems.filter(it => !it.isInfra);
        const infraItems = autoItems.filter(it => it.isInfra);

        return `
            <div style="padding: 40px; max-width: 1200px; margin: 0 auto; animation: fadeIn 0.3s ease;">

                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Escopo do Fornecimento</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                            Itens que compõem o escopo técnico-comercial da proposta
                            <span style="display: inline-flex; align-items: center; gap: 6px; margin-left: 12px;">
                                <span style="display: inline-block; width: 10px; height: 10px; background: #f0f9ff; border: 1px solid #93c5fd; border-radius: 3px;"></span> PTC
                                <span style="display: inline-block; width: 10px; height: 10px; background: #fefce8; border: 1px solid #fde68a; border-radius: 3px;"></span> Cliente
                            </span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.syncScopeFromProposal()" style="white-space: nowrap;">
                            <i class="ph ph-arrows-clockwise"></i> Sincronizar Proposta
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addScopeItem()" style="white-space: nowrap;">
                            <i class="ph ph-plus"></i> Adicionar Item
                        </button>
                    </div>
                </div>

                ${equipItems.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h5 style="font-size: 13px; color: #475569; font-weight: 800; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-cpu" style="font-size: 16px;"></i> Itens do Equipamento
                        </h5>
                        ${equipItems.map((item, i) => `
                            <div class="scope-row" data-auto="1" data-equip-tag="${item.equipTag || ''}" ${item.isSeu ? 'data-is-seu="1"' : ''} ${item.isSeuComp ? 'data-is-seu-comp="1" data-parent-seu="' + (item.parentSeu || '') + '"' : ''}
                                 style="display: flex; align-items: center; gap: 12px; padding: ${item.isSeuComp ? '10px 12px 10px 36px' : '12px'}; background: ${item.isSeu ? '#fffbeb' : (item.isSeuComp ? '#f8fafc' : '#f8fafc')}; border: 1px solid ${item.isSeu ? '#fde68a' : '#e2e8f0'}; border-left: 4px solid ${item.isSeu ? '#f59e0b' : (item.isSeuComp ? '#fde68a' : 'transparent')}; border-radius: 8px; margin-bottom: 4px;">
                                <i class="ph ${item.isSeu ? 'ph-lightning-slash' : (item.isSeuComp ? 'ph-dot' : 'ph-cpu')}" style="color: ${item.isSeu ? '#92400e' : '#94a3b8'}; font-size: 16px; flex-shrink: 0;"></i>
                                <div style="flex: 1;">
                                    <input type="text" name="scope_desc" class="form-control" value="${item.desc}" style="background: #f1f5f9; cursor: default;${item.isSeu ? ' font-weight:700;color:#92400e;' : ''}" readonly>
                                </div>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_empresa" ${item.minhaEmpresa ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6;">
                                    PTC
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

                ${infraItems.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h5 style="font-size: 13px; color: #475569; font-weight: 800; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                            <i class="ph ph-toolbox" style="font-size: 16px;"></i> Itens da Infraestrutura
                        </h5>
                        ${infraItems.map(item => `
                            <div class="scope-row" data-auto="1" data-is-infra="1"
                                 style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 8px; margin-bottom: 4px;">
                                <i class="ph ph-toolbox" style="color: #16a34a; font-size: 16px; flex-shrink: 0;"></i>
                                <div style="flex: 1;">
                                    <input type="text" name="scope_desc" class="form-control" value="${item.desc}" style="background: #f0fdf4; cursor: default; font-weight:700;color:#166534;" readonly>
                                </div>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_empresa" ${item.minhaEmpresa ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6;">
                                    PTC
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; cursor: pointer; white-space: nowrap;">
                                    <input type="checkbox" name="scope_cli" ${item.cli ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #f59e0b;">
                                    Cliente
                                </label>
                                <span style="font-size: 10px; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 10px; white-space: nowrap;">INFRA</span>
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
                            <br>Clique em "Sincronizar Proposta" ou "Adicionar Item".
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
                                    <input type="checkbox" name="scope_empresa" ${item.minhaEmpresa ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6;">
                                    PTC
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

    renderTabEscopoAUTPRO(data) {
        if (!data.autproScope || data.autproScope.length === 0) {
            data.autproScope = AUTPRO_SCOPE_ITEMS.map(item => ({
                id: item.id,
                desc: item.desc,
                incluso: false
            }));
        }

        const items = data.autproScope;
        const checkedCount = items.filter(it => it.incluso).length;

        return `
            <div style="padding: 40px; max-width: 1200px; margin: 0 auto; animation: fadeIn 0.3s ease;">

                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Escopo AUTPRO</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                            Itens do escopo de fornecimento AUTPRO &mdash; marque os itens aplicáveis
                            <span style="margin-left: 12px; background: #eff6ff; color: #1e3a8a; padding: 2px 10px; border-radius: 10px; font-weight: 600;">
                                ${checkedCount}/${items.length} selecionados
                            </span>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 4px;">
                    ${items.map(item => `
                        <label class="autpro-row" data-autpro-id="${item.id}"
                               style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: all 0.15s;">
                            <input type="checkbox" ${item.incluso ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #3b82f6; flex-shrink: 0;">
                            <span style="font-size: 13px; color: #334155; line-height: 1.3;">${item.desc}</span>
                        </label>
                    `).join('')}
                </div>

            </div>
        `;
    },

    syncScopeFromProposal() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;

        const manualItems = (data.scopeItems || []).filter(it => !it.auto);

        // Coletar IDs de componentes de SEU
        const seuComponentIds = new Set();
        (data.equipments || []).filter(e => e.type === 'SEU').forEach(seu => {
            (seu.seu_components || []).forEach(id => seuComponentIds.add(String(id)));
        });

        const autoItems = [];

        // Itens de equipamentos
        (data.equipments || []).forEach(eq => {
            if (eq.type === 'SEU') {
                // Item container da SEU
                autoItems.push({
                    desc: `Subestação ${eq.tag} — ${(eq.seu_components || []).length} equipamento(s)`,
                    minhaEmpresa: false,
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
                            minhaEmpresa: false,
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
                    minhaEmpresa: false,
                    cli: false,
                    auto: true,
                    equipTag: eq.tag,
                    isSeu: false,
                    isSeuComp: false,
                    parentSeu: ''
                });
            }
        });

        // Itens de infraestrutura (resumo por disciplina)
        const disciplinas = data.infraestrutura?.disciplinas || [];
        disciplinas.forEach(disc => {
            const itemCount = (disc.itens || []).length;
            if (itemCount > 0) {
                autoItems.push({
                    desc: `${disc.nome} — ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`,
                    minhaEmpresa: true,
                    cli: false,
                    auto: true,
                    equipTag: '',
                    isInfra: true,
                    infraDisciplina: disc.id
                });
            }
        });

        data.scopeItems = [...autoItems, ...manualItems];
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);

        const eqCount = autoItems.filter(it => !it.isInfra).length;
        const infraCount = autoItems.filter(it => it.isInfra).length;
        const parts = [];
        if (eqCount > 0) parts.push(`${eqCount} ${eqCount === 1 ? 'item' : 'itens'} de equipamento`);
        if (infraCount > 0) parts.push(`${infraCount} ${infraCount === 1 ? 'disciplina' : 'disciplinas'} de infraestrutura`);
        app.toast(`Escopo sincronizado: ${parts.join(', ') || 'nenhum item'}.`, 'success');
    },

    addScopeItem() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        if (!data.scopeItems) data.scopeItems = [];

        data.scopeItems.push({
            desc: '',
            minhaEmpresa: false,
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
        if (!activeEq) {
            return `<div style="padding:60px;text-align:center;color:#94a3b8;font-size:13px;">
                <i class="ph ph-cpu" style="font-size:40px;display:block;margin-bottom:12px;"></i>
                <div style="font-size:16px;font-weight:600;color:#475569;margin-bottom:8px;">Nenhum equipamento cadastrado</div>
                <div style="margin-bottom:16px;color:#64748b;">Adicione um equipamento para come\u00e7ar a especifica\u00e7\u00e3o t\u00e9cnica.</div>
                <button type="button" class="btn btn-primary" onclick="app.propostaTecnica.addEquipment()" style="display:inline-flex;align-items:center;gap:6px;">
                    <i class="ph ph-plus"></i> Adicionar Equipamento
                </button>
            </div>`;
        }
        const eq = activeEq;
        const isMT = eq && eq.type === 'CUB-MT';
        const isTrMt = eq && eq.type === 'TR-MT';

        // Determine available sub-tabs based on equipment type
        const allSubTabs = ['technical', 'norms', 'loads', 'enclosures', 'busbars', 'deviations', 'labor', 'expenses', 'calc_eletrico', 'calc_mecanico', 'layout'];
        const trMtSubTabs = ['technical', 'materiais', 'norms', 'deviations', 'expenses'];
        const eletrocentroSubTabs = ['technical', 'eletrocentro', 'materiais', 'norms', 'deviations', 'labor', 'expenses', 'calc_mecanico'];
        const seuSubTabs = ['technical', 'deviations', 'expenses'];
        const automationSubTabs = ['technical', 'norms', 'io_list', 'bom', 'deviations', 'labor', 'expenses', 'layout'];
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        const subTabs = isTrMt ? trMtSubTabs : (eq.type === 'SEU' ? seuSubTabs : (eq.type === 'ELETROCENTRO' ? eletrocentroSubTabs : (isAutomation ? automationSubTabs : allSubTabs)));

        if (!subTabs.includes(this.activeSubTab)) {
            this.activeSubTab = subTabs[0];
        }
        const subTab = this.activeSubTab;

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
                         draggable="true"
                         ondragstart="event.dataTransfer.setData('text/plain',${seuIdx}); event.target.closest('.eq-item').classList.add('dragging')"
                         ondragend="event.target.closest('.eq-item').classList.remove('dragging')"
                         ondragover="event.preventDefault(); this.classList.add('drag-over')"
                         ondragleave="this.classList.remove('drag-over')"
                         ondrop="event.preventDefault(); this.classList.remove('drag-over'); window.propostaTecnicaModule.moveEquipment(parseInt(event.dataTransfer.getData('text/plain')),${seuIdx})"
                         onclick="window.propostaTecnicaModule.switchEquipment(${seuIdx})"
                         style="padding: 10px 12px; cursor: grab; display: flex; align-items: center; gap: 6px;
                                 font-weight: ${seuActive ? '700' : '500'};
                                 color: ${seuActive ? 'white' : '#475569'};
                                 border-left: 4px solid ${seuActive ? 'rgb(56, 86, 14)' : 'transparent'};
                                 background: ${seuActive ? 'var(--color-accent)' : 'transparent'};
                                transition: all 0.2s;">
                        <i class="ph ph-list" style="font-size: 14px; opacity: 0.3; cursor: grab; flex-shrink: 0;" title="Arrastar para reordenar"></i>
                        <span onclick="event.stopPropagation(); window.propostaTecnicaModule.toggleSeuExpand(${seu.id})"
                              style="cursor:pointer;font-size:10px;width:14px;text-align:center;flex-shrink:0;user-select:none;color:#94a3b8;">
                            ${expanded ? '▼' : '▶'}
                        </span>
                        <i class="ph ph-lightning-slash" style="font-size: 18px; opacity: ${seuActive ? '1' : '0.4'}; flex-shrink: 0; color: #92400e;"></i>
                        <div style="flex: 1; min-width: 0;">
                            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; font-weight: ${seuActive ? '700' : '600'};">
                                ${seu.tag || 'Sem TAG'}
                            </div>
                            <div style="margin-top: 2px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                                ${getBadge(seu.type)}
                                ${seu.ufOrigem ? `<span style="background: #e0f2fe; color: #075985; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 9px;">${seu.ufOrigem}</span>` : ''}
                            </div>
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
                                 draggable="true"
                                 ondragstart="event.dataTransfer.setData('text/plain',${compIdx}); event.target.closest('.eq-item').classList.add('dragging')"
                                 ondragend="event.target.closest('.eq-item').classList.remove('dragging')"
                                 ondragover="event.preventDefault(); this.classList.add('drag-over')"
                                 ondragleave="this.classList.remove('drag-over')"
                                 ondrop="event.preventDefault(); this.classList.remove('drag-over'); window.propostaTecnicaModule.moveEquipment(parseInt(event.dataTransfer.getData('text/plain')),${compIdx})"
                                 onclick="window.propostaTecnicaModule.switchEquipment(${compIdx})"
                                 style="padding: 8px 12px 8px 36px; cursor: grab; display: flex; align-items: center; gap: 6px;
                                         font-weight: ${compActive ? '700' : '400'};
                                         color: ${compActive ? 'white' : '#64748b'};
                                         border-left: 4px solid ${compActive ? 'rgb(56, 86, 14)' : 'transparent'};
                                         background: ${compActive ? 'var(--color-accent)' : 'transparent'};
                                        font-size: 12px; transition: all 0.2s;">
                                <i class="ph ph-list" style="font-size: 12px; opacity: 0.25; cursor: grab; flex-shrink: 0;" title="Arrastar para reordenar"></i>
                                <i class="ph ph-dot" style="font-size: 14px; flex-shrink: 0; color: #94a3b8;"></i>
                                <div style="flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                    ${c.eq.tag || 'Sem TAG'}
                                </div>
                                <span style="flex-shrink: 0; display: flex; align-items: center; gap: 4px;">
                                    ${c.eq.ufOrigem ? `<span style="background: #e0f2fe; color: #075985; padding: 1px 4px; border-radius: 3px; font-weight: 700; font-size: 8px;">${c.eq.ufOrigem}</span>` : ''}
                                    ${getBadge(c.eq.type)}
                                </span>
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
                     draggable="true"
                     ondragstart="event.dataTransfer.setData('text/plain',${idx}); event.target.closest('.eq-item').classList.add('dragging')"
                     ondragend="event.target.closest('.eq-item').classList.remove('dragging')"
                     ondragover="event.preventDefault(); this.classList.add('drag-over')"
                     ondragleave="this.classList.remove('drag-over')"
                     ondrop="event.preventDefault(); this.classList.remove('drag-over'); window.propostaTecnicaModule.moveEquipment(parseInt(event.dataTransfer.getData('text/plain')),${idx})"
                     onclick="window.propostaTecnicaModule.switchEquipment(${idx})"
                     style="padding: 10px 12px; cursor: grab; display: flex; align-items: center; gap: 8px;
                             font-weight: ${active ? '700' : '500'};
                             color: ${active ? 'white' : '#475569'};
                             border-left: 4px solid ${active ? 'rgb(56, 86, 14)' : 'transparent'};
                             background: ${active ? 'var(--color-accent)' : 'transparent'};
                            transition: all 0.2s;">
                    <i class="ph ph-list" style="font-size: 14px; opacity: 0.3; cursor: grab; flex-shrink: 0;" title="Arrastar para reordenar"></i>
                    <i class="ph ph-cpu" style="font-size: 18px; opacity: ${active ? '1' : '0.4'}; flex-shrink: 0;"></i>
                    <div style="flex: 1; min-width: 0;">
                        <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; font-weight: ${active ? '700' : '600'};">
                            ${e.tag || 'Sem TAG'}
                        </div>
                        <div style="margin-top: 2px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                            ${getBadge(e.type)}
                            ${e.ufOrigem ? `<span style="background: #e0f2fe; color: #075985; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 9px;">${e.ufOrigem}</span>` : ''}
                        </div>
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
                <div style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; background: white;">
                    <button type="button" class="btn btn-primary" id="btn-add-equipment" onclick="app.propostaTecnica.addEquipment()" style="width: 100%; justify-content: center; gap: 6px; font-size: 12px;">
                        <i class="ph ph-plus-circle"></i> Acrescentar Novo Equipamento
                    </button>
                </div>
                <div style="flex: 1; overflow-y: auto; padding: 8px 0;">
                    ${sidebarItemsHtml}
                </div>
                <div style="padding: 8px 12px; border-top: 1px solid #e2e8f0; background: white; display: flex; flex-direction: column; gap: 6px;">
                    ${subTab === 'labor' ? `
                    <button type="button" class="btn btn-sm" onclick="app.propostaTecnica.calcularMaoDeObraTodosEquipamentos()" style="width: 100%; justify-content: center; gap: 6px; font-size: 11px; background: #7c3aed; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                        <i class="ph ph-lightning"></i> Estimar M.O. Todos Equip.
                    </button>
                    ` : ''}
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
                                   color: ${subTab === t ? 'var(--color-accent)' : '#64748b'};
                                   border: none; background: ${subTab === t ? 'white' : 'transparent'};
                                   cursor: pointer; white-space: nowrap;
                                   border-bottom: 3px solid ${subTab === t ? 'var(--color-accent)' : 'transparent'};
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
                            'materiais': 'ph-package',
                            'eletrocentro': 'ph-buildings',
                            'calc_eletrico': 'ph-chart-bar',
                            'calc_mecanico': 'ph-gear-six',
                            'io_list': 'ph-plugs',
                            'bom': 'ph-list-bullets',
                            'layout': 'ph-frame-corners'
                        }[t] || 'ph-circle'}" style="margin-right: 6px;"></i>
                        ${this.getSubTabLabel(t, eq)}
                    </button>
                `).join('')}
            </div>
        `;

        // Sub-tab content
        let contentHtml = '';

        this._aiFieldsForCurrentEq = null;
        if (subTab === 'technical') {
            const ai = data._aiChanges;
            let eqSet = ai?.equipments?.[this.activeEquipmentIndex];
            if (eqSet && !(eqSet instanceof Set)) {
                eqSet = new Set(Object.keys(eqSet));
            }
            this._aiFieldsForCurrentEq = eqSet;

            const customCharacteristics = eq.customCharacteristics || [];

            contentHtml = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Ficha Técnica: ${eq.tag}</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Configure as características técnicas do equipamento</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addCustomCharacteristic(${eq.id})" style="white-space: nowrap;">+ Inserir Característica</button>
                </div>
                <div style="padding: 6px 24px; animation: fadeIn 0.3s ease;">

                        <input type="hidden" name="eq_tag" value="${eq.tag || ''}">
                        <input type="hidden" name="eq_type" value="${eq.type || ''}">

                        <div class="row" style="display: flex; gap: 16px; margin-bottom: 20px;">
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">UF de Origem (Fornecedor)</label>
                                <select name="eq_ufOrigem" class="form-control">
                                    <option value="">Selecione...</option>
                                    ${['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf =>
                                        `<option value="${uf}" ${(eq.ufOrigem || store.getState().company?.uf || '') === uf ? 'selected' : ''}>${uf}</option>`
                                    ).join('')}
                                </select>
                                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">UF de fabricação/fornecimento do equipamento. Usado para cálculo de ICMS interestadual.</div>
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">UF de Destino (Instalação)</label>
                                <input type="text" class="form-control" value="${data.uf || ''}" readonly style="background: #f1f5f9; color: #64748b;">
                                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Preenchido automaticamente dos dados gerais da proposta.</div>
                            </div>
                        </div>

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

                            ${this._renderPainelTypeSelector(eq)}

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

                        ` : (eq.type === 'PLC' || eq.type === 'REM') ? `

                            ${this.renderDSGroup('Tensão de Comando', 'comando', eq.technical?.comando, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte de Comando', 'comando_fonte', eq.technical?.comando_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Tensão Serv. Auxiliares', 'auxiliar', eq.technical?.auxiliar, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte Serv. Auxiliares', 'auxiliar_fonte', eq.technical?.auxiliar_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Tipo de Montagem', 'montagem', eq.technical?.montagem, ['Em Linha', 'Back to Back'])}

                            ${this.renderDSGroup('Local Instalação', 'instalacao', eq.technical?.instalacao, ['Abrigada', 'Tempo'])}

                            ${this.renderDSGroup('Grau de Proteção', 'ip', eq.technical?.ip, ['IP20', 'IP42', 'IP44', 'IP54', 'IP55', 'IP65', 'IP66'])}

                            ${this.renderDSGroup('Cor Pintura Externa', 'cor_externa', eq.technical?.cor_externa, ['RAL 7032', 'RAL 7035', 'Munsell N-6,5'])}

                            ${this.renderDSGroup('Espessura Pintura', 'camada_pintura', eq.technical?.camada_pintura, ['80 um', '90 um', '100 um'])}

                            ${this.renderDSGroup('Placas de Montagem', 'placa_montagem', eq.technical?.placa_montagem, ['RAL 2003', 'RAL 7032', 'Galvanizada'])}

                            ${this.renderDSGroup('Entrada de Cabos', 'entrada_cabos', eq.technical?.entrada_cabos, ['Inferior', 'Superior', 'Lateral'])}

                            ${this.renderDSGroup('Saída de Cabos', 'saida_cabos', eq.technical?.saida_cabos, ['Inferior', 'Superior', 'Lateral'])}

                            ${this.renderDSGroup('Acesso Frontal', 'acesso_frontal', eq.technical?.acesso_frontal, ['Fecho Borboleta', 'Fecho Yale', 'Fecho Cremona'])}

                            ${this.renderDSGroup('Acesso Traseiro', 'acesso_traseiro', eq.technical?.acesso_traseiro, ['Tampa Aparafusada', 'Porta Traseira'])}

                            ${this.renderDSGroup('Acesso Manutenção', 'acesso_manutencao', eq.technical?.acesso_manutencao, ['Frontal', 'Traseiro', 'Frontal e Traseiro'])}

                            ${this.renderDSGroup('Protocolo Comunicação', 'protocolo', eq.technical?.protocolo, ['Ethernet IP', 'Profinet', 'DeviceNet', 'Profibus DP', 'Modbus TCP', 'Modbus RTU', 'CANopen'])}

                            ${this.renderDSGroup('Cabo de Comunicação', 'cabo_comunicacao', eq.technical?.cabo_comunicacao, ['Patch Cord Profinet Cat5', 'Cabo pra DeviceNet', 'Cabo Profibus DP 1px22 Awg Lilas', 'Modbus TCP 1px22 Awg', 'Modbus RTU 1px22 Awg', 'Cabo Canopen Com Conector Rj45'])}

                            ${this.renderDSGroup('Forma de Segregação', 'segregacao', eq.technical?.segregacao, ['Forma 1', 'Caixa de Sobrepor', 'Outro'])}

                            ${this.renderDSGroup('Iluminação Interna', 'iluminacao', eq.technical?.iluminacao, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Tomada de Serviço', 'tomada', eq.technical?.tomada, ['2P+T (10A)', '2P+T (20A)', 'Não'])}

                            ${this.renderDSGroup('Termostato / Desumid.', 'termostato', eq.technical?.termostato, ['Sim', 'Não'])}

                            ${this.renderDSGroup('Ventilação Forçada', 'ventilacao', eq.technical?.ventilacao, ['Sim', 'Não'])}

                        `                         : eq.type === 'ELETROCENTRO' ? ``

                        : `

                            ${this.renderDSGroup('Tensão de Operação', 'tensao_operacao', eq.technical?.tensao_operacao, ['690V', '480V', '440V', '380V', '220V'])}

                            ${this.renderDSGroup('Sistema Elétrico', 'sistema_eletrico', eq.technical?.sistema_eletrico, ['Monofásico (1F+N+T)', 'Bifásico (2F+N+T)', 'Trifásico (3F+N+T)', 'Trifásico (3F+T)'])}

                            ${this.renderDSGroup('Corrente Nominal', 'corrente_nominal', eq.technical?.corrente_nominal, ['50A', '63A', '80A', '100A', '125A', '160A', '200A', '250A', '300A', '400A', '500A', '630A', '800A', '1000A', '1250A', '1500A', '1600A', '1800A', '2000A', '2500A', '3000A', '3200A', '4000A', '5000A', '6300A'])}

                            ${this.renderDSGroup('Tensão de Comando', 'comando', eq.technical?.comando, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte de Comando', 'comando_fonte', eq.technical?.comando_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Tensão Serv. Auxiliares', 'auxiliar', eq.technical?.auxiliar, ['220Vca', '110Vca', '125Vcc', '24Vcc'])}

                            ${this.renderDSGroup('Fonte Serv. Auxiliares', 'auxiliar_fonte', eq.technical?.auxiliar_fonte, ['Interna', 'Externa'])}

                            ${this.renderDSGroup('Frequência', 'frequencia', eq.technical?.frequencia, ['60Hz', '50Hz'])}

                            ${this.renderDSGroup('Capacidade Curto (Icc)', 'icc', eq.technical?.icc, ['10kA', '16kA', '25kA', '31,5kA', '35kA', '40kA', '50kA', '65kA', '85kA', '100kA'])}

                            ${this.renderDSGroup('Coordenação Proteção', 'coordenacao', eq.technical?.coordenacao, ['Tipo 1', 'Tipo 2'])}

                            ${this.renderDSGroup('Tipo de Execução', 'execucao', eq.technical?.execucao, ['Fixa', 'Extraível', 'Plug-in'])}

                            ${this.renderDSGroup('Fabricante', 'fabricante', eq.technical?.fabricante, ['Genérico', 'KitFrame'])}

                            ${this.renderDSGroup('Tipo de Montagem', 'montagem', eq.technical?.montagem, ['Em Linha', 'Back to Back'])}

                            ${this.renderDSGroup('Local Instalação', 'instalacao', eq.technical?.instalacao, ['Abrigada', 'Tempo'])}

                            ${this.renderDSGroup('Grau de Proteção', 'ip', eq.technical?.ip, ['IP20', 'IP42', 'IP44', 'IP54', 'IP55', 'IP65', 'IP66'])}

                            ${this.renderDSGroup('Cor Pintura Externa', 'cor_externa', eq.technical?.cor_externa, ['RAL 7032', 'RAL 7035', 'Munsell N-6,5'])}

                            ${this.renderDSGroup('Espessura Pintura', 'camada_pintura', eq.technical?.camada_pintura, ['80 um', '90 um', '100 um'])}

                            ${this.renderDSGroup('Placas de Montagem', 'placa_montagem', eq.technical?.placa_montagem, ['RAL 2003', 'RAL 7032', 'Galvanizada'])}

                            ${this._renderPainelTypeSelector(eq)}

                            ${this.renderDSGroup('Altura do Painel (mm)', 'alturaPainel', eq.technical?.alturaPainel, ['1500', '1700', '1900', '2200'])}

                            ${this.renderDSGroup('Largura do Painel (mm)', 'larguraPainel', eq.technical?.larguraPainel, ['400', '600', '800', '1000', '1200'])}

                            ${this.renderDSGroup('Profundidade do Painel (mm)', 'profundidadePainel', eq.technical?.profundidadePainel, ['400', '600', '800', '1000', '1200'])}

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
                            <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Normas Técnicas Aplicáveis: ${eq.tag}${this._hasAiForEq('__norms') ? '<span class="ai-label">IA</span>' : ''}</h4>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Selecione as normas que regem o projeto deste equipamento</div>
                        </div>

                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addCustomNorm(${eq.id})" style="white-space: nowrap;">+ Inserir Norma Técnica</button>

                    </div>

                    <div style="margin-left: 10mm; display: grid; grid-template-columns: 1fr; gap: 12px;">

                        ${(eq.type === 'ELETROCENTRO' ? ELETROCENTRO_NORMS : COMMON_NORMS).map(n => `

                            <label style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${(eq.norms || []).includes(n.id) ? '#f0f9ff' : 'white'}; border-color: ${(eq.norms || []).includes(n.id) ? '#3b82f6' : '#e2e8f0'};">

                                <input type="checkbox" name="selectedNorms" value="${n.id}" ${(eq.norms || []).includes(n.id) ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #3b82f6;" onchange="window.propostaTecnicaModule.clearAiFieldForEq('__norms')">

                                <div>
                                    <div style="font-weight: 800; color: #1e3a8a; font-size: 14px;">${n.label}</div>
                                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${n.description}</div>
                                </div>

                            </label>

                        `).join('')}

                        ${customNorms.map((cn, i) => `

                            <div style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid ${(eq.norms || []).includes(cn.id) ? '#3b82f6' : '#e2e8f0'}; border-radius: 12px; background: ${(eq.norms || []).includes(cn.id) ? '#f0f9ff' : 'white'}; transition: all 0.2s;">

                                <input type="checkbox" name="selectedNorms" value="${cn.id}" ${(eq.norms || []).includes(cn.id) ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #3b82f6;" onchange="window.propostaTecnicaModule.clearAiFieldForEq('__norms')">

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
            if (isTrMt || isAutomation) {
                contentHtml = this.renderRestrictedTab(eq);
            } else {
                const tipicos = store.getState().tipicos || [];
                const cubiculos = store.getState().cubiculos || [];
                const isLM = this.cargasSubView === 'lm';
                contentHtml = `
                    <div style="animation: fadeIn 0.3s ease;">

                        <!-- Internal Navigation (Toggle Edição vs LM) -->

                        <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">

                            <h4 style="margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 800;">${isLM ? 'Lista de Materiais' : (eq && eq.type === 'CUB-MT' ? 'Lista de Cubículos' : 'Lista de Cargas')}${!isLM && this._hasAiForEq('__loads') ? '<span class="ai-label">IA</span>' : ''}</h4>

                            <div style="background: #f1f5f9; padding: 4px; border-radius: 8px; display: flex; gap: 4px;">

                                <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.switchCargasSubView('edit')" style="font-size: 11px; padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; transition: all 0.15s; ${!isLM ? 'background: var(--color-accent); color: white; box-shadow: 0 1px 3px rgba(67,101,17,0.3);' : 'background: white; color: #475569; box-shadow: 0 1px 2px rgba(0,0,0,0.06);'}">

                                    <i class="ph ph-pencil-simple" style="margin-right: 4px;"></i> ${eq && eq.type === 'CUB-MT' ? 'Lista de Cubículos (Edição)' : 'Lista de Cargas (Edição)'}

                                </button>

                                <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.switchCargasSubView('lm')" style="font-size: 11px; padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; transition: all 0.15s; ${isLM ? 'background: var(--color-accent); color: white; box-shadow: 0 1px 3px rgba(67,101,17,0.3);' : 'background: white; color: #475569; box-shadow: 0 1px 2px rgba(0,0,0,0.06);'}">

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

                        ${isLM ? this.renderLoadsLM(eq) : `<div onchange="window.propostaTecnicaModule.clearAiFieldForEq('__loads')">${this.renderLoadsEdit(eq, eq && eq.type === 'CUB-MT' ? cubiculos : tipicos)}</div>`}

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

                                    <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0; color: #fff;">

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

        } else if (subTab === 'labor') {
            contentHtml = this.renderLabor(eq);

        } else if (subTab === 'expenses') {
            contentHtml = this.renderExpenses(eq);

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

        } else if (subTab === 'layout') {
            contentHtml = this.renderLayoutSuggester(eq);

        } else if (subTab === 'io_list') {
            contentHtml = `
                <div style="animation: fadeIn 0.3s ease;">
                    <div style="max-width: 800px; margin-bottom: 20px;">
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 800;">Lista de I/O: ${eq.tag}</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Configure os racks, módulos e canais de entrada/saída.</div>
                    </div>
                    ${this.renderIOList(eq)}
                </div>
            `;

        } else if (subTab === 'bom') {
            contentHtml = `
                <div style="animation: fadeIn 0.3s ease;">
                    <div style="max-width: 800px; margin-bottom: 20px;">
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 800;">Lista de Materiais (Automação): ${eq.tag}</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Materiais derivados da configuração de I/O.</div>
                    </div>
                    ${this.renderAutomationBOM(eq)}
                </div>
            `;

        } else if (subTab === 'eletrocentro') {
            contentHtml = this.renderEletrocentroTab(eq);

        } else if (subTab === 'materiais') {
            contentHtml = this.renderMateriaisTab(eq);

        } else {
            contentHtml = `<div style="text-align: center; padding: 40px; color: #94a3b8;"><i class="ph ph-hourglass-high" style="font-size: 48px; opacity: 0.2; margin-bottom: 10px;"></i><br>Sub-aba "${this.getSubTabLabel(subTab, eq)}" em desenvolvimento para ${eq.tag}.</div>`;
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

    getSubTabLabel(subTab, eq) {
        const labels = {
            'technical': 'Ficha Técnica',
            'norms': 'Normas',
            'loads': eq && eq.type === 'CUB-MT' ? 'Cubículos' : 'Cargas',
            'enclosures': 'Invólucros',
            'busbars': 'Barramentos',
            'deviations': 'Desvios',
            'labor': 'Mão de Obra',
            'expenses': 'Despesas',
            'materiais': 'Lista de Materiais',
            'eletrocentro': 'Escopo',
            'calc_eletrico': 'Cálculos Elétricos',
            'calc_mecanico': 'Cálculos Mecânicos',
        'io_list': 'Lista de I/O',
        'bom': 'Lista de Materiais',
        'layout': 'Layout Sugerido'
        };
        return labels[subTab] || subTab;
    },

    renderLayoutSuggester(eq) {
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        if (isAutomation) return this._renderAutomationLayout(eq);
        const validForms = ['Forma 1', 'Forma 2a', 'Forma 2b', 'Forma 3a', 'Forma 3b', 'Forma 4a', 'Forma 4b'];
        const seg = eq.technical?.segregacao;
        if (!seg || !validForms.includes(seg)) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Layout não disponível</div>
                <div style="font-size:13px;margin-top:6px;">Selecione uma Forma de Segregação na Ficha Técnica.</div>
            </div>`;
        }

        const fabricante = eq.technical?.fabricante || 'Genérico';
        if (this._isForma34(seg) && fabricante !== 'KitFrame') {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Layout não disponível para este fabricante</div>
                <div style="font-size:13px;margin-top:6px;">Para Formas <strong>3a, 3b, 4a, 4b</strong>, selecione <strong>KitFrame</strong> como Fabricante na Ficha Técnica.</div>
            </div>`;
        }

        const montagem = eq.technical?.montagem || 'Em Linha';
        const isBackToBack = montagem === 'Back to Back';

        const result = isBackToBack ? this.suggestLayout(eq, 'front') : this.suggestLayout(eq);

        if (!result.hasLoads) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Nenhuma carga vinculada a típicos</div>
                <div style="font-size:13px;margin-top:6px;">Associe cargas a típicos na aba Cargas para gerar o layout sugerido.</div>
            </div>`;
        }

        const { cabinets } = result;

        if (cabinets.length === 0) {
            const arvore = this._geraArvoreMateriais(eq);
            const bomHtml = this._renderBOMAlocacao(arvore, [], eq.technical?.montagem);
            const totalMateriais = Object.values(arvore).reduce((s, tip) => s + Object.keys(tip.materiais).length, 0);
            return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px;">
                        <div>
                            <h4 style="margin:0;color:#1e3a8a;font-size:18px;">Layout Sugerido: ${eq.tag}</h4>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Distribuição física dos armários com base nas cargas × típicos × materiais</div>
                        </div>
                    </div>
                    <div style="text-align:center;padding:40px 40px;background:white;border-radius:12px;border:2px dashed #cbd5e1;margin-bottom:20px;">
                        <i class="ph ph-frame-corners" style="font-size:48px;color:#94a3b8;opacity:0.3;margin-bottom:12px;"></i>
                        <div style="font-size:16px;font-weight:700;color:#64748b;margin-bottom:16px;">Nenhum armário definido</div>
                        <button class="btn btn-primary" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:13px;padding:8px 20px;">
                            + Criar Armário
                        </button>
                        <div style="font-size:13px;color:#94a3b8;max-width:420px;margin:16px auto 0;line-height:1.6;">
                            Para começar, vá até a <strong>Lista de Materiais</strong> abaixo, selecione uma carga e clique em <strong>"Alocar Carga"</strong> para posicionar todos os materiais nos armários criados.
                        </div>
                    </div>
                    <div style="margin-top:16px;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                        <div onclick="const e=document.getElementById('bom_body_empty');const v=e.style.display;e.style.display=v==='none'?'':'none';this.querySelector('.bom-arrow').textContent=v==='none'?'▼':'▶'" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;cursor:pointer;background:#f8fafc;border-bottom:1px solid #e2e8f0;user-select:none;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span class="bom-arrow" style="font-size:10px;">▶</span>
                                <strong style="font-size:14px;">Lista de Materiais (${totalMateriais} itens)</strong>
                            </div>
                            <span style="font-size:11px;color:#64748b;">Aloque materiais aos armários expandindo cada carga</span>
                        </div>
                        <div id="bom_body_empty" style="display:none;padding:16px;">
                            ${bomHtml}
                        </div>
                    </div>
                </div>
            </div>`;
        }

        const formatGrouped = (arr, prop, unit) => {
            const counts = {};
            for (const c of arr) {
                const v = c[prop] || 600;
                counts[v] = (counts[v] || 0) + 1;
            }
            return Object.entries(counts)
                .sort(([a], [b]) => b - a)
                .map(([v, n]) => n > 1 ? `${n}×${v}${unit}` : `${v}${unit}`)
                .join(', ');
        };
        const summaryCards = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Armários</div>
                    <div style="font-size:28px;font-weight:800;color:#1e3a8a;margin-top:4px;">${cabinets.length}</div>
                </div>
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Larguras Instaladas</div>
                    <div style="font-size:18px;font-weight:800;color:#16a34a;margin-top:4px;">${formatGrouped(cabinets, 'width', 'mm')}</div>
                </div>
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Altura Instalada</div>
                    <div style="font-size:18px;font-weight:800;color:#1e3a8a;margin-top:4px;">${formatGrouped(cabinets, 'height', 'mm')}</div>
                </div>
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Profundidade Instalada</div>
                    <div style="font-size:18px;font-weight:800;color:#1e3a8a;margin-top:4px;">${formatGrouped(cabinets, 'depth', 'mm')}</div>
                </div>
            </div>
        `;

        const arvore = this._geraArvoreMateriais(eq);
        const bomHtml = this._renderBOMAlocacao(arvore, cabinets, eq.technical?.montagem);
        const totalMateriais = Object.values(arvore).reduce((s, tip) => s + Object.keys(tip.materiais).length, 0);

        if (isBackToBack) {
            const resultRear = this.suggestLayout(eq, 'rear');
            const cabsRear = resultRear.cabinets;

            const canvasF = document.createElement('canvas');
            this._drawLayoutCanvas(canvasF, cabinets);
            const dataUrlF = canvasF.toDataURL('image/png');

            const canvasT = document.createElement('canvas');
            this._drawLayoutCanvas(canvasT, cabsRear);
            const dataUrlT = canvasT.toDataURL('image/png');

        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const hasExternalViewB2B = isForma2 || seg === 'Forma 1';
            let dataUrlExtF = '', dataUrlExtR = '';
            if (hasExternalViewB2B) {
                const offFE = document.createElement('canvas');
                this._drawLayoutCanvasExternal(offFE, cabinets);
                dataUrlExtF = offFE.toDataURL('image/png');
                const offRE = document.createElement('canvas');
                this._drawLayoutCanvasExternal(offRE, cabsRear);
                dataUrlExtR = offRE.toDataURL('image/png');
            }

            const warningsF = cabinets.filter(c => c.warning).map(c => `
                <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#92400e;">
                    <strong>${c.name}:</strong> ${c.warning}
                </div>
            `).join('');

            const allExcess = cabinets.filter(c => c._excessLoads?.length > 0).flatMap(c => c._excessLoads);
            const excessDataAttr = allExcess.length > 0 ? encodeURIComponent(JSON.stringify(allExcess.map(l => ({ tag: l.tag, desc: l.desc || l.tag, power: l.power, current: l.current })))) : '';
            const excessWarning = allExcess.length > 0 ? `
                <div style="background:#fef2f2;border:1px solid #ef4444;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#991b1b;">
                    <strong>⚠️ Capacidade máxima atingida:</strong> ${allExcess.length} carga(s) não puderam ser alocadas.
                    <button class="btn btn-xs btn-primary" data-excess='${excessDataAttr}' onclick="window.propostaTecnicaModule._showExcessLoadsDialog(JSON.parse(decodeURIComponent(this.dataset.excess)))" style="margin-left:8px;background:#dc2626;border-color:#dc2626;">Resolver</button>
                </div>
            ` : '';

            const isForma2b2b = seg === 'Forma 2a' || seg === 'Forma 2b' || this._isForma34KitFrame(seg, eq.technical?.fabricante);
        const baseCabs = Object.entries(eq.layoutConfig?.cabinetAssignments || {}).map(([id, d]) => ({ id, name: d.name, width: d.width || 600, height: d.height, depth: d.depth || 600 }));

            return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px;">
                        <div>
                            <h4 style="margin:0;color:#1e3a8a;font-size:18px;">Layout Sugerido: ${eq.tag}</h4>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Montagem <strong>Back to Back</strong> — Vistas Frontal e Traseira</div>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                            <button type="button" class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._showLayoutConfigPanel()" style="gap:4px;">
                                <i class="ph ph-gear"></i> Configurar
                            </button>
                            ${this._isForma34KitFrame(seg, eq.technical?.fabricante) ? `
                            <button type="button" class="btn btn-sm btn-primary" onclick="window.propostaTecnicaModule._onCriarArranjoOtimizado()" style="gap:4px;background:#059669;border-color:#059669;">
                                <i class="ph ph-stars"></i> Criar Arranjo Otimizado
                            </button>` : ''}
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutPDF()" style="gap:4px;">
                                <i class="ph ph-file-pdf"></i> Exportar PDF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutDXF()" style="gap:4px;">
                                <i class="ph ph-file"></i> Exportar DXF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutQET()" style="gap:4px;">
                                <i class="ph ph-lightning"></i> Exportar QET
                            </button>
                            <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica._aplicarMateriaisChaparia()" style="gap:4px;background:#d97706;border-color:#d97706;">
                                <i class="ph ph-package"></i> Gerar Chaparia
                            </button>
                            <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;user-select:none;">
                                <input type="checkbox" id="chk_side_view_b2b" onchange="window.propostaTecnicaModule._toggleSideView()" ${eq.layoutConfig?.showSideView ? 'checked' : ''}> Vista Lateral
                            </label>
                        </div>
                    </div>
                    ${summaryCards}
                    ${warningsF}${excessWarning}
                    <div style="display:flex;flex-direction:column;gap:24px;">
                        <div>
                            <h5 style="margin:0 0 8px;color:#1e3a8a;font-size:14px;font-weight:700;">▸ VISTA FRONTAL INTERNA</h5>
                            <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px solid #3b82f6;">
                                <img id="layout-canvas-front" src="${dataUrlF}" style="display:block;margin:0 auto;" alt="Vista Frontal">
                            </div>
                        </div>
                        ${hasExternalViewB2B ? `
                        <div>
                            <h5 style="margin:0 0 8px;color:#7c3aed;font-size:14px;font-weight:700;">▸ VISTA FRONTAL EXTERNA</h5>
                            <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px solid #7c3aed;">
                                <img id="layout-canvas-external-front" src="${dataUrlExtF}" style="display:block;margin:0 auto;" alt="Vista Frontal Externa">
                            </div>
                        </div>
                        ` : ''}
                        <div>
                            <h5 style="margin:0 0 8px;color:#0e7490;font-size:14px;font-weight:700;">▸ VISTA TRASEIRA INTERNA</h5>
                            <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px dashed #0e7490;">
                                <img id="layout-canvas-rear" src="${dataUrlT}" style="display:block;margin:0 auto;" alt="Vista Traseira">
                            </div>
                        </div>
                        ${hasExternalViewB2B ? `
                        <div>
                            <h5 style="margin:0 0 8px;color:#7c3aed;font-size:14px;font-weight:700;">▸ VISTA TRASEIRA EXTERNA</h5>
                            <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px dashed #7c3aed;">
                                <img id="layout-canvas-external-rear" src="${dataUrlExtR}" style="display:block;margin:0 auto;" alt="Vista Traseira Externa">
                            </div>
                        </div>
                        ` : ''}
                        <div id="side-view-container-b2b" style="display:${eq.layoutConfig?.showSideView ? 'block' : 'none'};">
                            <div style="display:flex;align-items:center;gap:12px;margin:0 0 8px;">
                                <h5 style="margin:0;color:#7c3aed;font-size:14px;font-weight:700;">▸ VISTA LATERAL (CORTE)</h5>
                                <select id="sel_side_view_cabinet_b2b" onchange="window.propostaTecnicaModule._onChangeSideViewCabinet()" style="font-size:12px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:4px;">
                                    <option value="-1" ${(eq.layoutConfig?.sideViewCabinetIndex ?? -1) === -1 ? 'selected' : ''}>Todos (Combinado)</option>
                                    ${cabinets.map((c, i) => `<option value="${i}" ${eq.layoutConfig?.sideViewCabinetIndex === i ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px solid #7c3aed;">
                                <img id="layout-canvas-side-b2b" style="display:block;margin:0 auto;" alt="Vista Lateral Frontal">
                            </div>
                        </div>

                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;justify-content:center;">
                        ${baseCabs.map(bc => {
                            const cabH = bc.height || ((isForma2b2b) ? 2300 : (parseInt(eq.technical?.alturaPainel) || 2200) + 100);
                            return `<div style="display:flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:12px;">
                                <span style="font-weight:600;color:#1e3a8a;">${bc.name}</span>
                                <span style="color:#94a3b8;">|</span>
                                <span style="color:#64748b;">Largura:</span>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._setLarguraArmario('${bc.id}',this.value)">
                                    <option value="400" ${bc.width === 400 ? 'selected' : ''}>400mm</option>
                                    <option value="600" ${bc.width === 600 ? 'selected' : ''}>600mm</option>
                                    <option value="800" ${bc.width === 800 ? 'selected' : ''}>800mm</option>
                                    <option value="1000" ${bc.width === 1000 ? 'selected' : ''}>1000mm</option>
                                </select>
                                 ${!isForma2b2b ? `<span style="color:#94a3b8;">|</span>
                                 <span style="color:#64748b;">Altura:</span>
                                 <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                     onchange="window.propostaTecnicaModule._setAlturaArmario('${bc.id}',this.value)">
                                     <option value="1600" ${cabH === 1600 ? 'selected' : ''}>1600mm</option>
                                     <option value="1800" ${cabH === 1800 ? 'selected' : ''}>1800mm</option>
                                     <option value="2000" ${cabH === 2000 ? 'selected' : ''}>2000mm</option>
                                     <option value="2300" ${cabH === 2300 ? 'selected' : ''}>2300mm</option>
                                 </select>` : ''}
                                 <span style="color:#94a3b8;">|</span>
                                 <span style="color:#64748b;">Profundidade:</span>
                                 <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                     onchange="window.propostaTecnicaModule._setProfundidadeArmario('${bc.id}',this.value)">
                                     <option value="400" ${(bc.depth || 600) === 400 ? 'selected' : ''}>400mm</option>
                                     <option value="600" ${(bc.depth || 600) === 600 ? 'selected' : ''}>600mm</option>
                                     <option value="800" ${(bc.depth || 600) === 800 ? 'selected' : ''}>800mm</option>
                                     <option value="1000" ${(bc.depth || 600) === 1000 ? 'selected' : ''}>1000mm</option>
                                     <option value="1200" ${(bc.depth || 600) === 1200 ? 'selected' : ''}>1200mm</option>
                                 </select>
                                 <button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._removerArmario('${bc.id}')" style="color:#ef4444;font-size:11px;padding:2px 4px;" title="Remover armário">✕</button>
                            </div>`;
                        }).join('')}
                        <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:11px;padding:6px 10px;">+ Adicionar Armário</button>
                    </div>
                    <div style="margin-top:20px;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                        <div onclick="const e=document.getElementById('bom_body');const v=e.style.display;e.style.display=v==='none'?'':'none';this.querySelector('.bom-arrow').textContent=v==='none'?'▼':'▶'" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;cursor:pointer;background:#f8fafc;border-bottom:1px solid #e2e8f0;user-select:none;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span class="bom-arrow" style="font-size:10px;">▶</span>
                                <strong style="font-size:14px;">Lista de Materiais (${totalMateriais} itens)</strong>
                            </div>
                            <span style="font-size:11px;color:#64748b;">Aloque materiais aos armários (Frente / Traseira)</span>
                        </div>
                        <div id="bom_body" style="display:none;padding:16px;">
                            ${bomHtml}
                        </div>
                    </div>
                </div>
            </div>`;
        }

        const offscreen = document.createElement('canvas');
        this._drawLayoutCanvas(offscreen, cabinets);
        const dataUrl = offscreen.toDataURL('image/png');

        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const hasExternalView = isForma2 || seg === 'Forma 1';
        let dataUrlExt = '';
        if (hasExternalView) {
            const offscreenExt = document.createElement('canvas');
            this._drawLayoutCanvasExternal(offscreenExt, cabinets);
            dataUrlExt = offscreenExt.toDataURL('image/png');
        }

        const warnings = cabinets.filter(c => c.warning).map(c => `
            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#92400e;">
                <strong>${c.name}:</strong> ${c.warning}
            </div>
        `).join('');

        const allExcess = cabinets.filter(c => c._excessLoads?.length > 0).flatMap(c => c._excessLoads);
        const excessDataAttr = allExcess.length > 0 ? encodeURIComponent(JSON.stringify(allExcess.map(l => ({ tag: l.tag, desc: l.desc || l.tag, power: l.power, current: l.current })))) : '';
        const excessWarning = allExcess.length > 0 ? `
                <div style="background:#fef2f2;border:1px solid #ef4444;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#991b1b;">
                    <strong>⚠️ Capacidade máxima atingida:</strong> ${allExcess.length} carga(s) não puderam ser alocadas.
                    <button class="btn btn-xs btn-primary" data-excess='${excessDataAttr}' onclick="window.propostaTecnicaModule._showExcessLoadsDialog(JSON.parse(decodeURIComponent(this.dataset.excess)))" style="margin-left:8px;background:#dc2626;border-color:#dc2626;">Resolver</button>
                </div>
            ` : '';

        const externalViewHtml = hasExternalView ? `
                        <div style="margin-top:24px;">
                            <h5 style="margin:0 0 8px;color:#7c3aed;font-size:14px;font-weight:700;">▸ VISTA FRONTAL EXTERNA</h5>
                            <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px solid #7c3aed;">
                                <img id="layout-canvas-external" src="${dataUrlExt}" style="display:block;margin:0 auto;" alt="Vista Frontal Externa">
                            </div>
                        </div>` : '';

        return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px;">
                        <div>
                            <h4 style="margin:0;color:#1e3a8a;font-size:18px;">Layout Sugerido: ${eq.tag}</h4>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Distribuição física dos armários com base nas cargas × típicos × materiais</div>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                            <button type="button" class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._showLayoutConfigPanel()" style="gap:4px;">
                                <i class="ph ph-gear"></i> Configurar
                            </button>
                            ${this._isForma34KitFrame(seg, eq.technical?.fabricante) ? `
                            <button type="button" class="btn btn-sm btn-primary" onclick="window.propostaTecnicaModule._onCriarArranjoOtimizado()" style="gap:4px;background:#059669;border-color:#059669;">
                                <i class="ph ph-stars"></i> Criar Arranjo Otimizado
                            </button>` : ''}
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutPDF()" style="gap:4px;">
                                <i class="ph ph-file-pdf"></i> Exportar PDF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutDXF()" style="gap:4px;">
                                <i class="ph ph-file"></i> Exportar DXF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutQET()" style="gap:4px;">
                                <i class="ph ph-lightning"></i> Exportar QET
                            </button>
                            <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica._aplicarMateriaisChaparia()" style="gap:4px;background:#d97706;border-color:#d97706;">
                                <i class="ph ph-package"></i> Gerar Chaparia
                            </button>
                            <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;user-select:none;">
                                <input type="checkbox" id="chk_side_view" onchange="window.propostaTecnicaModule._toggleSideView()" ${eq.layoutConfig?.showSideView ? 'checked' : ''}> Vista Lateral
                            </label>
                        </div>
                    </div>
                        ${summaryCards}
                    ${warnings}${excessWarning}
                    <div style="background:white;border-radius:12px;overflow:auto;padding:16px;">
                        <img id="layout-canvas" src="${dataUrl}" style="display:block;margin:0 auto;" alt="Layout Sugerido">
                        <div style="text-align:center;margin-top:12px;font-size:13px;font-weight:700;color:#64748b;letter-spacing:2px;">LAYOUT ORIENTATIVO</div>
                    </div>
                    ${externalViewHtml}
                    <div id="side-view-container" style="display:${eq.layoutConfig?.showSideView ? 'block' : 'none'};margin-top:20px;">
                        <div style="display:flex;align-items:center;gap:12px;margin:0 0 8px;">
                            <h5 style="margin:0;color:#7c3aed;font-size:14px;font-weight:700;">▸ VISTA LATERAL (CORTE)</h5>
                            <select id="sel_side_view_cabinet" onchange="window.propostaTecnicaModule._onChangeSideViewCabinet()" style="font-size:12px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:4px;">
                                <option value="-1" ${(eq.layoutConfig?.sideViewCabinetIndex ?? -1) === -1 ? 'selected' : ''}>Todos (Combinado)</option>
                                ${cabinets.map((c, i) => `<option value="${i}" ${eq.layoutConfig?.sideViewCabinetIndex === i ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px solid #7c3aed;">
                            <img id="layout-canvas-side" style="display:block;margin:0 auto;" alt="Vista Lateral">
                        </div>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;justify-content:center;">
                        ${cabinets.map((c, idx) => {
                            const cabId = c._cabId || '';
                            const currentWidth = c._userWidth || c.width;
                            const cabH = c.segregacao ? null : (c.height || 2300);
                            const isForma2Cab = c.segregacao === 'Forma 2a' || c.segregacao === 'Forma 2b' || this._isForma34KitFrame(c.segregacao, c._fabricante);
                            const gavetas = c._gavetas || [];
                            const gavInfo = gavetas.length > 0
                                ? gavetas.length + ' gav. (' + gavetas.reduce((s, g) => s + g.height, 0) + '/1800mm)'
                                : '';
                            return `<div style="display:flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:12px;">
                                <span style="font-weight:600;color:#1e3a8a;">${c.name}</span>
                                ${gavInfo ? `<span style="color:#64748b;font-size:11px;background:#e2e8f0;border-radius:4px;padding:1px 6px;" title="${gavetas.map(g => g.cargaTag + ' (' + g.height + 'mm)').join(', ')}">${gavInfo}</span>` : ''}
                                <span style="color:#94a3b8;">|</span>
                                <span style="color:#64748b;">Largura:</span>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._setLarguraArmario('${cabId}',this.value)"
                                    ${!cabId ? 'disabled' : ''}>
                                    <option value="400" ${currentWidth === 400 ? 'selected' : ''}>400mm</option>
                                    <option value="600" ${currentWidth === 600 ? 'selected' : ''}>600mm</option>
                                    <option value="800" ${currentWidth === 800 ? 'selected' : ''}>800mm</option>
                                    <option value="1000" ${currentWidth === 1000 ? 'selected' : ''}>1000mm</option>
                                </select>
                                 ${!isForma2Cab ? `<span style="color:#94a3b8;">|</span>
                                 <span style="color:#64748b;">Altura:</span>
                                 <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                     onchange="window.propostaTecnicaModule._setAlturaArmario('${cabId}',this.value)"
                                     ${!cabId ? 'disabled' : ''}>
                                     <option value="1600" ${c.height === 1600 ? 'selected' : ''}>1600mm</option>
                                     <option value="1800" ${c.height === 1800 ? 'selected' : ''}>1800mm</option>
                                     <option value="2000" ${c.height === 2000 ? 'selected' : ''}>2000mm</option>
                                     <option value="2300" ${(!c.height || c.height === 2300) ? 'selected' : ''}>2300mm</option>
                                 </select>` : ''}
                                 <span style="color:#94a3b8;">|</span>
                                 <span style="color:#64748b;">Profundidade:</span>
                                 <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                     onchange="window.propostaTecnicaModule._setProfundidadeArmario('${cabId}',this.value)"
                                     ${!cabId ? 'disabled' : ''}>
                                     <option value="400" ${(c.depth || 600) === 400 ? 'selected' : ''}>400mm</option>
                                     <option value="600" ${(c.depth || 600) === 600 ? 'selected' : ''}>600mm</option>
                                     <option value="800" ${(c.depth || 600) === 800 ? 'selected' : ''}>800mm</option>
                                     <option value="1000" ${(c.depth || 600) === 1000 ? 'selected' : ''}>1000mm</option>
                                     <option value="1200" ${(c.depth || 600) === 1200 ? 'selected' : ''}>1200mm</option>
                                 </select>
                                 ${cabId ? `<button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._removerArmario('${cabId}')" style="color:#ef4444;font-size:11px;padding:2px 4px;" title="Remover armário">✕</button>` : ''}
                            </div>`;
                        }).join('')}
                        <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:11px;padding:6px 10px;">+ Adicionar Armário</button>
                    </div>
                    <div style="margin-top:20px;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                        <div onclick="const e=document.getElementById('bom_body');const v=e.style.display;e.style.display=v==='none'?'':'none';this.querySelector('.bom-arrow').textContent=v==='none'?'▼':'▶'" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;cursor:pointer;background:#f8fafc;border-bottom:1px solid #e2e8f0;user-select:none;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span class="bom-arrow" style="font-size:10px;">▶</span>
                                <strong style="font-size:14px;">Lista de Materiais (${totalMateriais} itens)</strong>
                            </div>
                            <span style="font-size:11px;color:#64748b;">Aloque materiais aos armários</span>
                        </div>
                        <div id="bom_body" style="display:none;padding:16px;">
                            ${bomHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    _showLayoutConfigPanel() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const existing = document.getElementById('_layout_config_overlay');
        if (existing) existing.remove();

        const ass = eq.layoutConfig?.cabinetAssignments;
        const montagem = eq.technical?.montagem || 'Em Linha';
        const isB2B = montagem === 'Back to Back';
        let cabinetsHtml = '';

        if (!ass || Object.keys(ass).length === 0) {
            cabinetsHtml = '<div style="font-size:11px;color:#94a3b8;padding:20px 0;text-align:center;">Nenhum armário definido. Use "+ Adicionar" ou "Auto" para criar.</div>';
        } else {
            const dflt = this._getDefaultLayoutConfig();
            cabinetsHtml = Object.entries(ass).flatMap(([cabId, cab]) => {
                const facesToRender = isB2B
                    ? [{ face: 'front', suffix: 'F', label: 'Frontal' }, { face: 'rear', suffix: 'T', label: 'Traseira' }]
                    : [{ face: null, suffix: '', label: '' }];
                return facesToRender.map(({ face, suffix, label }) => {
                    const blockCabId = face ? cabId + '|' + face : cabId;
                    const lc = face
                        ? (cab.faces?.[face]?.layoutConfig || cab.layoutConfig || dflt)
                        : (cab.layoutConfig || dflt);
                    const qtdMats = face
                        ? Object.keys(cab.faces?.[face]?.assigned || {}).length
                        : Object.keys(cab.assigned || {}).length + Object.values(cab.faces || {}).reduce((s, f) => s + Object.keys(f.assigned || {}).length, 0);
                    const largura = cab.width || 'auto';
                    const blockName = face ? cab.name + suffix : cab.name;

                // Linhas table
                const linhasHtml = (lc.linhas || dflt.linhas).map((l, i) => {
                    const yCentro = l.yCentroTrilho ?? Math.round(((l.yInicio || 0) + (l.yFim || 0)) / 2);
                    return `<tr>
                        <td style="display:none;"><input type="hidden" class="lcfg_id" value="${l.id || ''}"></td>
                        <td><input type="text" class="form-control lcfg_nome" value="${l.nome}" style="width:120px;font-size:12px;"></td>
                        <td><input type="number" class="form-control lcfg_yCentro" value="${yCentro}" style="width:70px;font-size:12px;"></td>
                        <td style="text-align:center;"><input type="checkbox" class="lcfg_trilho" ${l.temTrilho !== false ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;"></td>
                        <td><input type="text" class="form-control lcfg_cats" value="${l.categorias.join(', ')}" style="width:160px;font-size:12px;" placeholder="DISJUNTOR, CONTATOR..."></td>
                        <td style="text-align:center;"><button type="button" class="btn btn-xs btn-ghost" onclick="this.closest('tr').remove()" style="color:#ef4444;font-size:14px;padding:2px 4px;">✕</button></td>
                    </tr>`;
                }).join('');

                // Gaps grid
                const gapsCombo = { ...dflt.gapsTermicos, ...(lc.gapsTermicos || {}) };
                const gapsHtml = Object.entries(gapsCombo).map(([cat, gap]) => `
                    <div class="form-group" style="margin:0;">
                        <label class="form-label" style="font-size:10px;white-space:nowrap;">${cat}</label>
                        <input type="number" class="form-control cab-gap" data-gap-cat="${cat}" value="${gap}" style="width:100%;font-size:12px;" min="0" step="1">
                    </div>
                `).join('');

                // Canaletas list
                const canaletas = lc.canaletas || [];
                console.log('[Render] cabId:', blockCabId, 'lc === cab.layoutConfig?', lc === (cab.layoutConfig || null), 'lc === dflt?', lc === dflt);
                console.log('[Render] IDs:', canaletas.map(c => c.id));
                const canaletasHtml = canaletas.length === 0
                    ? '<div style="font-size:11px;color:#94a3b8;padding:4px 0;">Nenhuma canaleta adicional.</div>'
                    : canaletas.map(can => {
                        const detalhe = can.tipo === 'quadro'
                            ? `${can.modelo}, ${can.larguraQuadro}x${can.alturaQuadro}mm`
                            : `${can.modelo}, ${can.orientacao === 'V' ? 'Vertical' : 'Horizontal'}, ${can.comprimento}mm`;
                        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;background:#f8fafc;border-radius:4px;margin-bottom:2px;font-size:11px;">
                            <span>${can.tipo === 'quadro' ? '📐' : '📏'} ${detalhe}</span>
                            <div>
                                <button type="button" class="btn btn-xs btn-ghost" onclick="event.stopPropagation();window.propostaTecnicaModule._editarCanaleta('${can.id}','${blockCabId}')" style="color:#3b82f6;font-size:10px;">✏️</button>
                                <button type="button" class="btn btn-xs btn-ghost" onclick="event.stopPropagation();window.propostaTecnicaModule._removerCanaleta('${can.id}','${blockCabId}')" style="color:#ef4444;font-size:10px;">✕</button>
                            </div>
                        </div>`;
                    }).join('');

                const isKF = this._isForma34KitFrame(eq.technical?.segregacao || '', eq.technical?.fabricante);
                const gavList = (cab.loads ? Object.keys(cab.loads) : []);
                const ccwCab = cab.layoutConfig?.colunaCabosWidth || 200;
                return `<div class="cab-config-block" data-cab-id="${blockCabId}" style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;overflow:hidden;">
                    <div class="cab-config-header" style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#f8fafc;cursor:pointer;user-select:none;"
                        onclick="const b=this.nextElementSibling;if(b){const d=b.style.display;b.style.display=d==='none'?'':'none';this.querySelector('.cab-arrow').textContent=b.style.display==='none'?'▶':'▼'}">
                        <div style="display:flex;align-items:center;gap:8px;flex:1;">
                            <span class="cab-arrow" style="font-size:10px;color:#94a3b8;">▶</span>
                            <input type="text" value="${blockName}" data-cab-name="${blockCabId}"
                                style="font-size:12px;padding:2px 6px;border:1px solid #cbd5e1;border-radius:4px;width:130px;font-weight:600;"
                                onchange="window.propostaTecnicaModule._setNomeArmario('${blockCabId}',this.value)" onclick="event.stopPropagation();">
                            <span style="color:#64748b;font-size:11px;">${label ? label + ' — ' : ''}${qtdMats} materiais${gavList.length > 0 ? ' — ' + gavList.length + ' gavetas' : ''}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            ${isKF ? `<select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;font-weight:600;" onchange="window.propostaTecnicaModule._onChangeCcwArmario('${blockCabId}',this.value)" onclick="event.stopPropagation();">
                                <option value="200" ${ccwCab === 200 ? 'selected' : ''}>200mm</option>
                                <option value="300" ${ccwCab === 300 ? 'selected' : ''}>300mm</option>
                                <option value="400" ${ccwCab === 400 ? 'selected' : ''}>400mm</option>
                            </select>` : `
                            <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                onchange="window.propostaTecnicaModule._setLarguraArmario('${blockCabId}',this.value)" onclick="event.stopPropagation();">
                                <option value="400" ${largura == 400 ? 'selected' : ''}>400mm</option>
                                <option value="600" ${largura == 600 || largura === 'auto' ? 'selected' : ''}>600mm</option>
                                <option value="800" ${largura == 800 ? 'selected' : ''}>800mm</option>
                                <option value="1000" ${largura == 1000 ? 'selected' : ''}>1000mm</option>
                            </select>`}
                            <button class="btn btn-xs btn-ghost" onclick="event.stopPropagation();this.closest('.cab-config-block').remove()" style="color:#ef4444;font-size:11px;">✕</button>
                        </div>
                    </div>
                    <div class="cab-config-body" style="display:none;padding:10px 12px;border-top:1px solid #e2e8f0;background:#fff;">
                        ${isKF ? `
                        <div style="font-size:12px;color:#64748b;padding:8px 0;">
                            <strong>Gavetas (${gavList.length})</strong>
                            <div style="margin-top:4px;max-height:200px;overflow-y:auto;">
                                ${gavList.map(tag => `<div style="padding:2px 4px;font-size:11px;border-bottom:1px solid #f1f5f9;">${tag}</div>`).join('')}
                            </div>
                            <div style="margin-top:8px;font-size:11px;color:#94a3b8;">KitFrame — 600mm (gavetas) + ${ccwCab}mm (coluna cabos) = ${largura}mm × 2300mm</div>
                            <div style="margin-top:8px;">
                                <label style="font-size:11px;color:#64748b;font-weight:600;">Modo:</label>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._onChangeGavetaMode('${blockCabId}',this.value)">
                                    <option value="sequential" ${(cab.layoutConfig?.gavetaMode || 'sequential') === 'sequential' ? 'selected' : ''}>Automática (Sequencial)</option>
                                    <option value="otimizada" ${cab.layoutConfig?.gavetaMode === 'otimizada' ? 'selected' : ''}>Automática (Otimizada)</option>
                                    <option value="manual" ${cab.layoutConfig?.gavetaMode === 'manual' ? 'selected' : ''}>Manual</option>
                                </select>
                            </div>
                        </div>
                        ` : `
                        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px;">
                            <div><label style="font-size:10px;">Margem Esq.</label><input type="number" class="form-control cab-dim" data-field="canaletaEsq" value="${lc.canaletaEsq ?? 0}" style="width:100%;font-size:11px;height:26px;"></div>
                            <div><label style="font-size:10px;">Margem Dir.</label><input type="number" class="form-control cab-dim" data-field="canaletaDir" value="${lc.canaletaDir ?? 0}" style="width:100%;font-size:11px;height:26px;"></div>
                            <div><label style="font-size:10px;">Trilho DIN</label><input type="number" class="form-control cab-dim" data-field="larguraTrilhoDIN" value="${lc.larguraTrilhoDIN ?? 35}" style="width:100%;font-size:11px;height:26px;"></div>
                            <div><label style="font-size:10px;">Espaçamento</label><input type="number" class="form-control cab-dim" data-field="espacamentoLinhas" value="${lc.espacamentoLinhas ?? 10}" style="width:100%;font-size:11px;height:26px;"></div>
                            <div><label style="font-size:10px;">Comp. Trilho</label><input type="number" class="form-control cab-dim" data-field="comprimentoTrilho" value="${lc.comprimentoTrilho ?? 0}" style="width:100%;font-size:11px;height:26px;"></div>
                        </div>

                        <div style="margin-bottom:6px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <strong style="font-size:13px;">Linhas / Faixas</strong>
                                <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarLinhaLayout('${blockCabId}')" style="font-size:11px;">+ Adicionar Linha</button>
                            </div>
                        </div>
                        <table class="table" style="width:100%;">
                            <thead><tr><th style="font-size:10px;">Nome</th><th style="font-size:10px;">Y Centro</th><th style="font-size:10px;">Trilho</th><th style="font-size:10px;">Categorias</th><th style="width:24px;"></th></tr></thead>
                            <tbody class="cab-linhas-tbody">${linhasHtml}</tbody>
                        </table>

                        <div style="margin-top:12px;">
                            <strong style="font-size:13px;">Gaps Térmicos</strong>
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:4px;">${gapsHtml}</div>
                        </div>

                        <div style="margin-top:12px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <strong style="font-size:13px;">Canaletas</strong>
                                <div style="display:flex;gap:4px;">
                                    <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarQuadroCanaleta('${blockCabId}');event.stopPropagation();" style="font-size:10px;">+ Quadro</button>
                                    <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarPecaRetaCanaleta('${blockCabId}');event.stopPropagation();" style="font-size:10px;">+ Peça Reta</button>
                                </div>
                            </div>
                            <div class="cab-canaletas-list" style="margin-top:4px;">${canaletasHtml}</div>
                        </div>

                        <div style="margin-top:12px;border-top:1px solid #e2e8f0;padding-top:12px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <strong style="font-size:13px;">Linhas da Porta (Vista Externa)</strong>
                                <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarLinhaPortaLayout('${blockCabId}')" style="font-size:11px;">+ Adicionar Faixa</button>
                            </div>
                            <div style="font-size:10px;color:#94a3b8;margin-bottom:6px;">Largura útil da porta: ${cab.width || 800}mm - 10mm = ${(cab.width || 800) - 10}mm</div>
                            <table class="table" style="width:100%;">
                                <thead><tr><th style="font-size:10px;">Nome</th><th style="font-size:10px;">Y Centro</th><th style="width:24px;"></th></tr></thead>
                                <tbody class="cab-door-linhas-tbody">
                                    ${(lc.doorLinhas || dflt.doorLinhas).map((l, i) => {
                                        const yCentro = l.yCentro ?? l.yCentroTrilho ?? 200;
                                        return `<tr>
                                            <td style="display:none;"><input type="hidden" class="dlcfg_id" value="${l.id || ''}"></td>
                                            <td><input type="text" class="form-control dlcfg_nome" value="${l.nome}" style="width:140px;font-size:12px;"></td>
                                            <td><input type="number" class="form-control dlcfg_yCentro" value="${yCentro}" style="width:70px;font-size:12px;"></td>
                                            <td style="text-align:center;"><button type="button" class="btn btn-xs btn-ghost" onclick="this.closest('tr').remove()" style="color:#ef4444;font-size:14px;padding:2px 4px;">✕</button></td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                        `}
                    </div>
                </div>`;
            });
        }).join('');
    }

        const overlay = document.createElement('div');
        overlay.id = '_layout_config_overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999;display:flex;justify-content:center;align-items:center;';
        overlay.innerHTML = `
            <div style="background:white;border-radius:12px;padding:20px;max-width:900px;width:90%;max-height:92vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h3 style="margin:0;">Configuração do Layout</h3>
                    <button class="btn btn-ghost" onclick="this.closest('#_layout_config_overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                ${cabinetsHtml}
                <div style="display:flex;gap:6px;margin-top:12px;">
                    <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:11px;">+ Adicionar Armário</button>
                    <button class="btn btn-sm btn-ghost" onclick="if(confirm('Remover todas as alocações e voltar ao agrupamento automático?'))window.propostaTecnicaModule._resetarAlocacoes()" style="font-size:11px;">Auto</button>
                </div>
                ${(() => {
                    const allLoads = eq.loads || [];
                    const assignedTags = new Set();
                    for (const cab of Object.values(ass || {})) {
                        if (cab.loads) Object.keys(cab.loads).forEach(t => assignedTags.add(t));
                        if (cab.faces) {
                            for (const f of Object.values(cab.faces)) {
                                if (f.loads) Object.keys(f.loads).forEach(t => assignedTags.add(t));
                            }
                        }
                    }
                    const unallocated = allLoads.filter(l => l.tag && !assignedTags.has(l.tag));
                    if (unallocated.length === 0) return '';
                    return `
                    <div style="border:2px dashed #ef4444;border-radius:8px;padding:12px;margin-top:12px;">
                        <strong style="color:#ef4444;font-size:13px;">⚠️ Cargas não alocadas (${unallocated.length})</strong>
                        <div style="margin-top:6px;font-size:11px;color:#64748b;max-height:150px;overflow-y:auto;">
                            ${unallocated.map(l => `
                            <div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #f1f5f9;">
                                <span>• ${l.tag} - ${l.desc || l.tag} (${this._getDrawerHeight(l)}mm)</span>
                                <button class="btn btn-xs btn-ghost" style="color:#059669;font-size:10px;margin-left:auto;" onclick="window.propostaTecnicaModule._adicionarArmario()">+ Novo Armário</button>
                            </div>`).join('')}
                        </div>
                    </div>`;
                })()}
                <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e2e8f0;padding-top:14px;margin-top:14px;">
                    <button class="btn btn-cancel" onclick="this.closest('#_layout_config_overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.propostaTecnicaModule._saveLayoutConfig()">Aplicar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    },

    _saveLayoutConfig() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const overlay = document.getElementById('_layout_config_overlay');
        if (!overlay) return;

        const dflt = this._getDefaultLayoutConfig();
        if (!eq.layoutConfig) eq.layoutConfig = {};
        if (!eq.layoutConfig.cabinetAssignments) eq.layoutConfig.cabinetAssignments = {};

        const cabBlocks = overlay.querySelectorAll('.cab-config-block');
        cabBlocks.forEach(block => {
            const rawCabId = block.dataset.cabId;
            if (!rawCabId) return;
            const parts = rawCabId.split('|');
            const cabId = parts[0];
            const face = parts[1] || null;
            let cab = eq.layoutConfig.cabinetAssignments[cabId];
            if (!cab) {
                cab = { name: cabId, width: 600, assigned: {} };
                eq.layoutConfig.cabinetAssignments[cabId] = cab;
            }
            // Ensure faces exist for B2B
            if (!cab.faces) cab.faces = { front: { assigned: {}, loads: {}, layoutConfig: null }, rear: { assigned: {}, loads: {}, layoutConfig: null } };

            // Read dimensions
            const dims = {};
            block.querySelectorAll('.cab-dim').forEach(inp => {
                dims[inp.dataset.field] = parseInt(inp.value) || 0;
            });

            // Read linhas
            const linhas = [];
            block.querySelectorAll('.cab-linhas-tbody tr').forEach(row => {
                const nome = row.querySelector('.lcfg_nome')?.value?.trim();
                const yCentroTrilho = parseInt(row.querySelector('.lcfg_yCentro')?.value) || 500;
                const temTrilho = row.querySelector('.lcfg_trilho')?.checked ?? true;
                const catsStr = row.querySelector('.lcfg_cats')?.value || '';
                const categorias = catsStr.split(',').map(s => s.trim()).filter(Boolean);
                if (nome) {
                    const origId = row.querySelector('.lcfg_id')?.value;
                    linhas.push({ id: origId || 'linha_' + Date.now() + '_' + linhas.length, nome, yCentroTrilho, categorias, temTrilho });
                }
            });

            // Read gaps
            const gapsTermicos = {};
            block.querySelectorAll('.cab-gap').forEach(inp => {
                const raw = inp.value.trim();
                const val = raw === '' ? null : parseFloat(raw);
                gapsTermicos[inp.dataset.gapCat] = val !== null && !isNaN(val) ? val : 5;
            });

            // Read door linhas
            const doorLinhas = [];
            block.querySelectorAll('.cab-door-linhas-tbody tr').forEach(row => {
                const nome = row.querySelector('.dlcfg_nome')?.value?.trim();
                const yCentro = parseInt(row.querySelector('.dlcfg_yCentro')?.value) || 200;
                if (nome) {
                    const origId = row.querySelector('.dlcfg_id')?.value;
                    doorLinhas.push({ id: origId || 'door_linha_' + Date.now() + '_' + doorLinhas.length, nome, yCentro });
                }
            });

            // Keep existing config, merge form values into it (preserving canaletas, etc.)
            const targetCfg = face ? (cab.faces?.[face]?.layoutConfig) : cab.layoutConfig;
            const existingCfg = targetCfg || {};
            if (!targetCfg) {
                const newCfg = {
                    canaletaEsq: dims.canaletaEsq ?? 0,
                    canaletaDir: dims.canaletaDir ?? 0,
                    larguraTrilhoDIN: dims.larguraTrilhoDIN ?? 35,
                    espacamentoLinhas: dims.espacamentoLinhas ?? 10,
                    comprimentoTrilho: dims.comprimentoTrilho ?? 0,
                    linhas,
                    gapsTermicos,
                    doorLinhas,
                    canaletas: existingCfg.canaletas || [],
                    retalhosCanaleta: existingCfg.retalhosCanaleta || []
                };
                if (face && cab.faces?.[face]) {
                    cab.faces[face].layoutConfig = newCfg;
                } else {
                    cab.layoutConfig = newCfg;
                }
            } else {
                Object.assign(targetCfg, {
                    canaletaEsq: dims.canaletaEsq ?? 0,
                    canaletaDir: dims.canaletaDir ?? 0,
                    larguraTrilhoDIN: dims.larguraTrilhoDIN ?? 35,
                    espacamentoLinhas: dims.espacamentoLinhas ?? 10,
                    comprimentoTrilho: dims.comprimentoTrilho ?? 0,
                    linhas,
                    gapsTermicos,
                    doorLinhas
                });
            }
        });

        // Remove cabines cujo bloco DOM foi deletado (X)
        const remainingCabIds = new Set();
        overlay.querySelectorAll('.cab-config-block').forEach(block => {
            const raw = block.dataset.cabId || '';
            const baseId = raw.split('|')[0];
            if (baseId) remainingCabIds.add(baseId);
        });
        for (const key of Object.keys(eq.layoutConfig.cabinetAssignments || {})) {
            if (!remainingCabIds.has(key)) {
                delete eq.layoutConfig.cabinetAssignments[key];
            }
        }
        if (Object.keys(eq.layoutConfig.cabinetAssignments || {}).length === 0) {
            delete eq.layoutConfig.cabinetAssignments;
        }

        overlay.remove();

        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        this._syncLayoutToEnclosures(eq);
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
 
        if (this.activeSubTab === 'layout') {
            this.renderSubTab();
        }
    },

    _drawLayoutCanvas(canvas, cabinets) {
        const CANVAS_HEIGHT = 500;
        const PADDING = 30;
        const BOTTOM_LABEL_HEIGHT = 50;
        const maxH = cabinets.length > 0 ? Math.max(...cabinets.map(c => c.height || 2300), 2300) : 2300;
        const SCALE = (CANVAS_HEIGHT - PADDING * 2 - BOTTOM_LABEL_HEIGHT) / maxH;

        const totalCabinetPixels = cabinets.reduce((s, c) => s + c.width * SCALE, 0);
        const canvasWidth = Math.ceil(totalCabinetPixels + PADDING * 2);

        if (cabinets.length === 0) {
            canvas.width = 400;
            canvas.height = CANVAS_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 400, CANVAS_HEIGHT);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Nenhum armário para exibir', 200, CANVAS_HEIGHT / 2);
            return;
        }

        canvas.width = canvasWidth;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');
        this._drawLayoutInternal(ctx, cabinets, SCALE, 1, PADDING);
    },

    _drawLayoutCanvasExternal(canvas, cabinets) {
        const CANVAS_HEIGHT = 500;
        const PADDING = 30;
        const BOTTOM_LABEL_HEIGHT = 50;
        const maxH = cabinets.length > 0 ? Math.max(...cabinets.map(c => c.height || 2300), 2300) : 2300;
        const SCALE = (CANVAS_HEIGHT - PADDING * 2 - BOTTOM_LABEL_HEIGHT) / maxH;

        const totalCabinetPixels = cabinets.reduce((s, c) => s + c.width * SCALE, 0);
        const canvasWidth = Math.ceil(totalCabinetPixels + PADDING * 2);

        if (cabinets.length === 0) {
            canvas.width = 400;
            canvas.height = CANVAS_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 400, CANVAS_HEIGHT);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Nenhum armário para exibir', 200, CANVAS_HEIGHT / 2);
            return;
        }

        canvas.width = canvasWidth;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');
        this._drawLayoutInternal(ctx, cabinets, SCALE, 1, PADDING, true);
    },

    _drawSideView(cabinets, containerId, imgId, cabinetIndex, rearCabins = null) {
        const container = document.getElementById(containerId);
        const img = document.getElementById(imgId);
        if (!container || !img || cabinets.length === 0) return;

        const isB2B = Array.isArray(rearCabins) && rearCabins.length > 0;

        const CANVAS_HEIGHT = 500;
        const PADDING = 30;
        const BOTTOM_LABEL_HEIGHT = 50;
        const maxCabHeight = Math.max(...[...cabinets, ...(rearCabins || [])].map(c => c.height || 2300), 2300);
        const SCALE = (CANVAS_HEIGHT - PADDING * 2 - BOTTOM_LABEL_HEIGHT) / maxCabHeight;
        const SCREEN_SCALE = (500 - 60 - 50) / 2300;
        const fontMult = SCALE / SCREEN_SCALE;

        const selectedCabins = (cabinetIndex != null && cabinetIndex >= 0 && cabinetIndex < cabinets.length)
            ? [cabinets[cabinetIndex]]
            : cabinets;

        const frontDepth = Math.max(...selectedCabins.map(c => c.depth || 600));
        const rearDepth = isB2B
            ? Math.max(...rearCabins.map(c => c.depth || 600))
            : 0;
        const totalDepth = isB2B ? frontDepth : frontDepth + rearDepth;
        const boxW = totalDepth * SCALE;
        const canvasWidth = Math.ceil(boxW + PADDING * 2);

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, CANVAS_HEIGHT);

        const singleLabel = (cabinetIndex != null && cabinetIndex >= 0 && cabinetIndex < cabinets.length)
            ? cabinets[cabinetIndex].name
            : null;
        this._drawSideViewInternal(ctx, selectedCabins, frontDepth, SCALE, fontMult, PADDING, singleLabel, rearCabins);

        img.src = canvas.toDataURL('image/png');
        container.style.display = 'block';
    },

    _drawSideViewInternal(ctx, selectedCabins, boxDepth, scale, fontMult, padding, singleCabName, rearCabins = null) {
        const CANVAS_HEIGHT = ctx.canvas.height;
        const xOff = padding;
        const isB2B = Array.isArray(rearCabins) && rearCabins.length > 0;
        const frontDepth = boxDepth;
        const rearDepth = isB2B ? Math.max(...rearCabins.map(c => c.depth || 600)) : 0;
        const effectiveDepth = isB2B ? frontDepth : frontDepth + rearDepth;
        const cabW = effectiveDepth * scale;
        const maxCabHeight = Math.max(...[...selectedCabins, ...(rearCabins || [])].map(c => c.height || 2300), 2300);
        const cabH = maxCabHeight * scale;

        // Single cabinet body (combined box)
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(xOff, padding, cabW, cabH, 4);
        ctx.fill();
        ctx.stroke();

        // Base
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        const baseY = padding + (maxCabHeight - 100) * scale;
        ctx.beginPath();
        ctx.moveTo(xOff, baseY);
        ctx.lineTo(xOff + cabW, baseY);
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Base', xOff + cabW / 2, baseY + 12 * fontMult);

        // Ground bar label (apenas CCM Forma 1)
        const isForma2 = selectedCabins.some(c => c.segregacao === 'Forma 2a' || c.segregacao === 'Forma 2b');
        const isAutomation = selectedCabins.some(c => c._isAutomation);
        if (!isForma2 && !isAutomation) {
            const gndY = padding + (maxCabHeight - 110) * scale;
            ctx.strokeStyle = '#cbd5e1';
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(xOff, gndY);
            ctx.lineTo(xOff + cabW, gndY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#94a3b8';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.fillText('Barramento Terra', xOff + cabW / 2, gndY - 4);
        }

        // Placa de montagem: face direita (fundo) encosta no fundo do componente de menor Z
        let minPlateZ = null;
        let minPlateD = 0;
        for (const cab of selectedCabins) {
            const cd = cab._assignData;
            const src = cd && cab._face ? (cd.faces?.[cab._face]?.assigned || {}) : (cd?.assigned || {});
            for (const row of cab.rows || []) {
                for (const item of row.items || []) {
                    const zo = item._matId ? (src[item._matId]?.zOffset ?? item._zOffset) : undefined;
                    if (zo != null && (minPlateZ === null || zo < minPlateZ)) {
                        minPlateZ = zo;
                        minPlateD = item.d || 0;
                    }
                }
            }
        }
        const plateFaceDir = minPlateZ !== null ? minPlateZ : 0;
        const plateRightFaceX = xOff + (effectiveDepth - plateFaceDir) * scale;

        // Rear cabinet mounting plate Z (B2B)
        let minRearZ = null, minRearD = 0;
        if (isB2B) {
            for (const cab of rearCabins) {
                const cd = cab._assignData;
                const src = cd && cab._face ? (cd.faces?.[cab._face]?.assigned || {}) : (cd?.assigned || {});
                for (const row of cab.rows || []) {
                    for (const item of row.items || []) {
                        const zo = item._matId ? (src[item._matId]?.zOffset ?? item._zOffset) : undefined;
                        if (zo != null && (minRearZ === null || zo < minRearZ)) {
                            minRearZ = zo;
                            minRearD = item.d || 0;
                        }
                    }
                }
            }
        }
        const plateFaceDirRear = minRearZ !== null ? minRearZ : 0;

        // Borda de 30mm + placa de montagem
        if (isForma2) {
            // Borda de 30mm (Forma 2a/2b)
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(xOff + 30 * scale, padding + 30 * scale, (effectiveDepth - 60) * scale, 2140 * scale);
            // Placa de montagem (20mm espessura) — Forma 2
            const plateX = plateRightFaceX - 20 * scale;
            const plateY = padding + 315 * scale;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(plateX, plateY, 20 * scale, 1840 * scale);
            ctx.fillStyle = '#64748b';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Placa Montagem', plateX + 10 * scale, plateY + 1840 * scale - 20 * scale);

            // Placa de montagem traseira (B2B)
            if (isB2B) {
                const rearPlateX = xOff + plateFaceDirRear * scale;
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(rearPlateX, plateY, 20 * scale, 1840 * scale);
                ctx.fillStyle = '#64748b';
                ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Placa Montagem', rearPlateX + 10 * scale, plateY + 1840 * scale - 20 * scale);
            }

            // Canaletas na vista lateral (retângulo tracejado: profundidade × comprimento)
            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = '#0e7490';
            ctx.lineWidth = 0.5;
            for (const cab of selectedCabins) {
                const cfgC = cab.layoutConfig || this._getDefaultLayoutConfig();
                for (const can of cfgC.canaletas || []) {
                    const prof = can.profundidade || can.largura_base || 50;
                    const canX = xOff + (effectiveDepth - plateFaceDir) * scale;
                    const canSy = padding + (can.y || 0) * scale;
                    if (can.tipo === 'quadro') {
                        for (const seg of can.segmentos || []) {
                            const segSy = padding + seg.y * scale;
                            if (seg.orientacao === 'V') {
                                ctx.strokeRect(canX, segSy, prof * scale, seg.comprimento * scale);
                            }
                        }
                    } else if (can.tipo === 'linear') {
                        if (can.orientacao === 'V') {
                            ctx.strokeRect(canX, canSy, prof * scale, can.comprimento * scale);
                        } else {
                            ctx.strokeRect(canX, canSy, can.comprimento * scale, prof * scale);
                        }
                    }
                }
            }
            ctx.restore();

            // Porta (6.5mm × 2190mm) na face frontal da vista lateral
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 0.5;
            const doorThick = 6.5 * scale;
            const doorSideX = xOff + cabW - doorThick;
            ctx.strokeRect(doorSideX, padding, doorThick, 2190 * scale);
            ctx.fillStyle = '#94a3b8';
            ctx.font = `${Math.round(5 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Porta', doorSideX + doorThick / 2, padding + (12 - 50) * scale);
        } else {
            // Borda de 30mm + placa de montagem proporcional (Forma 1)
            const panelH = maxCabHeight - 100;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(xOff + 30 * scale, padding + 30 * scale, (effectiveDepth - 60) * scale, (panelH - 60) * scale);
            // Placa de montagem em perfil (20mm espessura) — proporcional
            const plateHSide = panelH - 105;
            const plateYSide = 30 + (panelH - 60 - plateHSide) / 2;
            const plateX = plateRightFaceX - 20 * scale;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(plateX, padding + plateYSide * scale, 20 * scale, plateHSide * scale);
            ctx.fillStyle = '#64748b';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Placa Montagem', plateX + 10 * scale, padding + (plateYSide + plateHSide - 20) * scale);
            // Placa de montagem traseira (B2B)
            if (isB2B) {
                const rearPlateX = xOff + plateFaceDirRear * scale;
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(rearPlateX, padding + plateYSide * scale, 20 * scale, plateHSide * scale);
                ctx.fillStyle = '#64748b';
                ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Placa Montagem', rearPlateX + 10 * scale, padding + (plateYSide + plateHSide - 20) * scale);
            }
        }

        // Olhais para içamento — vista lateral (corte): 4×60mm, faces internas distanciadas 485mm
        const eyeW = 4, eyeH = 60, innerDist = 485;
        const marginEye = (effectiveDepth - innerDist - eyeW * 2) / 2;
        if (marginEye > 0) {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(xOff + marginEye * scale, padding - eyeH * scale, eyeW * scale, eyeH * scale);
            ctx.strokeRect(xOff + (marginEye + eyeW + innerDist) * scale, padding - eyeH * scale, eyeW * scale, eyeH * scale);
        }

        // Linha dos barramentos (Y=300) — apenas Forma 2a/2b
        if (isForma2) {
            const barraSideY = padding + 300 * scale;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xOff + 30 * scale, barraSideY);
            ctx.lineTo(xOff + (effectiveDepth - 30) * scale, barraSideY);
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Barramentos', xOff + (effectiveDepth / 2) * scale, barraSideY - 50 * scale);
        }

        // Cota de profundidade (30mm abaixo da base)
        const cotaSideY = padding + (maxCabHeight + 90) * scale;
        ctx.fillStyle = '#475569';
        ctx.font = `bold ${Math.round(10 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(effectiveDepth + ' mm', xOff + (effectiveDepth / 2) * scale, cotaSideY);

        // Título da vista lateral (horizontal, mesma linha que vista frontal interna)
        ctx.fillStyle = '#1e293b';
        ctx.font = `bold ${Math.round(10 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Vista Lateral (Corte)', xOff + effectiveDepth / 2 * scale, padding + (maxCabHeight + 180) * scale);

        // Collect all items from selected cabinets with their assigned source
        const allItems = [];
        for (const cab of selectedCabins) {
            const cabData = cab._assignData;
            const assignedSource = cabData && cab._face
                ? (cabData.faces?.[cab._face]?.assigned || {})
                : (cabData?.assigned || {});

            for (const row of cab.rows || []) {
                for (const item of row.items || []) {
                    allItems.push({ item, assignedSource });
                }
            }
        }

        // Separate items with and without manual zOffset
        const itemsWithManualZ = [];
        const itemsWithoutZ = [];
        for (const { item, assignedSource } of allItems) {
                    const zOff = item._matId ? (assignedSource[item._matId]?.zOffset ?? item._zOffset) : undefined;
            if (zOff != null) {
                itemsWithManualZ.push({ item, z: zOff });
            } else {
                itemsWithoutZ.push(item);
            }
        }

        // Calculate Z distribution
        const totalManualZEnd = itemsWithManualZ.reduce((s, e) => Math.max(s, e.z), 0);
        const remainingDepth = Math.max(0, frontDepth - totalManualZEnd);
        const autoItemsDepth = itemsWithoutZ.reduce((s, it) => s + (it.d || 0), 0);
        const gap = autoItemsDepth > 0 && itemsWithoutZ.length > 1
            ? Math.min(5, Math.max(0, remainingDepth - autoItemsDepth) / (itemsWithoutZ.length - 1))
            : 0;

        // Draw items with manual Z
        for (const { item, z } of itemsWithManualZ) {
            const id = item.d || 20;
            const ih = item.h || 40;
            const clampedZ = Math.min(Math.max(z, id), Math.max(effectiveDepth, 0));
            const ix = xOff + (effectiveDepth - clampedZ) * scale;
            const iy = padding + (item.y || 0) * scale;
            const iw = id * scale;

            ctx.shadowColor = 'rgba(0,0,0,0.06)';
            ctx.shadowBlur = 3 * fontMult;
            ctx.shadowOffsetY = 1 * fontMult;
            ctx.fillStyle = item.color || '#94a3b8';
            ctx.beginPath();
            if (iw > 4 && ih * scale > 4) {
                ctx.roundRect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4), 2);
            } else {
                ctx.rect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4));
            }
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Draw auto-distributed items front-to-back
        let currentZ = totalManualZEnd;
        const sortedAuto = [...itemsWithoutZ].sort((a, b) => (b.d || 0) - (a.d || 0));
        for (const item of sortedAuto) {
            const id = item.d || 20;
            const ih = item.h || 40;
            const ix = xOff + (effectiveDepth - currentZ) * scale;
            const iy = padding + (item.y || 0) * scale;
            const iw = id * scale;
            item.z = currentZ;

            ctx.shadowColor = 'rgba(0,0,0,0.06)';
            ctx.shadowBlur = 3 * fontMult;
            ctx.shadowOffsetY = 1 * fontMult;
            ctx.fillStyle = item.color || '#94a3b8';
            ctx.beginPath();
            if (iw > 4 && ih * scale > 4) {
                ctx.roundRect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4), 2);
            } else {
                ctx.rect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4));
            }
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            currentZ += id + gap;
        }

        // Draw rear cabinet items (B2B) — mirrored
        if (isB2B) {
            const allRearItems = [];
            for (const cab of rearCabins) {
                const cabData = cab._assignData;
                const assignedSource = cabData && cab._face
                    ? (cabData.faces?.[cab._face]?.assigned || {})
                    : (cabData?.assigned || {});
                for (const row of cab.rows || []) {
                    for (const item of row.items || []) {
                        allRearItems.push({ item, assignedSource });
                    }
                }
            }
            const rearItemsWithManualZ = [];
            const rearItemsWithoutZ = [];
            for (const { item, assignedSource } of allRearItems) {
                const zOff = item._matId ? (assignedSource[item._matId]?.zOffset ?? item._zOffset) : undefined;
                if (zOff != null) {
                    rearItemsWithManualZ.push({ item, z: zOff });
                } else {
                    rearItemsWithoutZ.push(item);
                }
            }
            const rearTotalManualZEnd = rearItemsWithManualZ.reduce((s, e) => Math.max(s, e.z), 0);
            const rearRemainingDepth = Math.max(0, rearDepth - rearTotalManualZEnd);
            const rearAutoItemsDepth = rearItemsWithoutZ.reduce((s, it) => s + (it.d || 0), 0);
            const rearGap = rearAutoItemsDepth > 0 && rearItemsWithoutZ.length > 1
                ? Math.min(5, Math.max(0, rearRemainingDepth - rearAutoItemsDepth) / (rearItemsWithoutZ.length - 1))
                : 0;
            // Draw rear items with manual Z (mirrored)
            for (const { item, z } of rearItemsWithManualZ) {
                const id = item.d || 20;
                const ih = item.h || 40;
                const clampedZ = Math.min(Math.max(z, id), rearDepth);
                const ix = xOff + (clampedZ - id) * scale;
                const iy = padding + (item.y || 0) * scale;
                const iw = id * scale;
                ctx.shadowColor = 'rgba(0,0,0,0.06)';
                ctx.shadowBlur = 3 * fontMult;
                ctx.shadowOffsetY = 1 * fontMult;
                ctx.fillStyle = item.color || '#94a3b8';
                ctx.beginPath();
                if (iw > 4 && ih * scale > 4) {
                    ctx.roundRect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4), 2);
                } else {
                    ctx.rect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4));
                }
                ctx.fill();
                ctx.shadowColor = 'transparent';
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            // Draw rear auto-distributed items (mirrored)
            let rearCurrentZ = rearTotalManualZEnd;
            const rearSortedAuto = [...rearItemsWithoutZ].sort((a, b) => (b.d || 0) - (a.d || 0));
            for (const item of rearSortedAuto) {
                const id = item.d || 20;
                const ih = item.h || 40;
                const ix = xOff + Math.max(rearCurrentZ - id, 0) * scale;
                const iy = padding + (item.y || 0) * scale;
                const iw = id * scale;
                ctx.shadowColor = 'rgba(0,0,0,0.06)';
                ctx.shadowBlur = 3 * fontMult;
                ctx.shadowOffsetY = 1 * fontMult;
                ctx.fillStyle = item.color || '#94a3b8';
                ctx.beginPath();
                if (iw > 4 && ih * scale > 4) {
                    ctx.roundRect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4), 2);
                } else {
                    ctx.rect(ix, iy, Math.max(iw, 4), Math.max(ih * scale, 4));
                }
                ctx.fill();
                ctx.shadowColor = 'transparent';
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
                rearCurrentZ -= id + rearGap;
            }
        }

        // Depth dimension label
        ctx.fillStyle = '#475569';
        ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('P: ' + effectiveDepth + 'mm', xOff + cabW / 2, padding + cabH + 4);
    },

    _isForma34(seg) {
        return ['Forma 3a', 'Forma 3b', 'Forma 4a', 'Forma 4b'].includes(seg);
    },

    _isForma34KitFrame(seg, fabricante) {
        return this._isForma34(seg) && (fabricante === 'KitFrame');
    },

    // Gaveta height table: smallest height that satisfies BOTH kW and A
    _getDrawerHeight(carga) {
        const kw = parseFloat(carga?.power) || 0;
        const a = parseFloat(carga?.current) || 0;
        const table = [
            { height: 100, maxKw: 37,  maxA: 80 },
            { height: 150, maxKw: 55,  maxA: 250 },
            { height: 225, maxKw: 75,  maxA: 400 },
            { height: 300, maxKw: 110, maxA: 630 },
            { height: 375, maxKw: 132, maxA: 800 },
            { height: 450, maxKw: 160, maxA: 1000 },
        ];
        for (const row of table) {
            if (kw <= row.maxKw && a <= row.maxA) return row.height;
        }
        return 450;
    },

    // Auto-stack gavetas for a KitFrame coluna (max 1800mm total height per coluna)
    _createReserveGavetas(remaining, cabNumber, gavIdx) {
        const STD_H = [100, 150, 225, 300, 375, 450];
        const reserve = [];
        let space = remaining;
        for (const h of STD_H) {
            while (space >= h) {
                gavIdx++;
                reserve.push({
                    id: 'gav-' + cabNumber + '.' + gavIdx,
                    colunaIndex: -1,
                    posicao: gavIdx - 1,
                    height: h,
                    cargaTag: 'TAG??',
                    potencia: 'Gav. Reserva',
                    _isReserva: true,
                    materiais: {},
                });
                space -= h;
            }
        }
        return { reserve, gavIdx };
    },

    _tryFillExact(space) {
        const STD_H = [100, 150, 225, 300, 375, 450];
        if (space === 0) return [];
        const dp = new Array(space + 1).fill(null);
        dp[0] = [];
        for (let s = 0; s <= space; s++) {
            if (dp[s] === null) continue;
            for (const h of STD_H) {
                if (s + h <= space && dp[s + h] === null) {
                    dp[s + h] = [...dp[s], h];
                }
            }
        }
        return dp[space];
    },

    _getReserveOptions(space) {
        const STD_H = [100, 150, 225, 300, 375, 450];
        if (space < 100) return [[space]];
        const MAX_PER_SLOT = 20;
        const dp = new Array(space + 1).fill(null);
        dp[0] = [[]];
        for (let s = 0; s <= space; s++) {
            if (!dp[s]) continue;
            for (const h of STD_H) {
                const ns = s + h;
                if (ns > space) continue;
                if (!dp[ns]) dp[ns] = [];
                for (const combo of dp[s]) {
                    if (dp[ns].length >= MAX_PER_SLOT) break;
                    dp[ns].push([...combo, h]);
                }
            }
        }
        if (!dp[space] || dp[space].length === 0) return [[space]];
        const seen = new Set();
        const unique = [];
        for (const combo of dp[space]) {
            const key = [...combo].sort((a, b) => a - b).join(',');
            if (!seen.has(key)) { seen.add(key); unique.push(combo); }
        }
        unique.sort((a, b) => a.length - b.length);
        const result = [];
        const usedCounts = new Set();
        for (const combo of unique) {
            if (result.length >= 6) break;
            if (!usedCounts.has(combo.length)) {
                result.push(combo);
                usedCounts.add(combo.length);
            }
        }
        return result;
    },

    _autoStackGavetas(cargas, cabLoads, cabNumber = 1, mode = 'sequential', reserveCombo = null) {
        const MAX_HEIGHT = 1800;
        const excessLoads = [];
        let gavIdx = 0;
        let usedH = 0;
        const gavetas = [];

        let cargasOrdered;
        if (mode === 'otimizada') {
            cargasOrdered = [...cargas].sort((a, b) => {
                const pa = parseFloat(a.power) || 0;
                const pb = parseFloat(b.power) || 0;
                return pb - pa;
            });
        } else {
            cargasOrdered = [...cargas];
        }

        for (const carga of cargasOrdered) {
            if (!carga.tag) continue;
            const h = this._getDrawerHeight(carga);
            if (usedH + h > MAX_HEIGHT) {
                excessLoads.push(carga);
                continue;
            }
            const loadMats = cabLoads?.[carga.tag] || {};
            gavetas.push({
                id: 'gav-' + cabNumber + '.' + (gavIdx + 1),
                colunaIndex: 0,
                posicao: gavIdx,
                height: h,
                cargaTag: carga.tag,
                cargaDesc: carga.desc || carga.tag,
                potencia: carga.power || '',
                corrente: carga.current || '',
                materiais: loadMats,
            });
            usedH += h;
            gavIdx++;
        }

        if (mode !== 'manual') {
            const remaining = MAX_HEIGHT - usedH;
            if (remaining >= 225) {
                let fill;
                if (reserveCombo) {
                    fill = reserveCombo;
                } else {
                    fill = this._tryFillExact(remaining);
                    if (!fill) fill = [remaining];
                }
                for (const h of fill) {
                    gavIdx++;
                    gavetas.push({
                        id: 'gav-' + cabNumber + '.' + gavIdx,
                        colunaIndex: 0,
                        posicao: gavIdx - 1,
                        height: h,
                        cargaTag: 'TAG??',
                        potencia: 'Gav. Reserva',
                        _isReserva: true,
                        materiais: {},
                    });
                    usedH += h;
                }
            }
        }

        return { colunas: [{ index: 0, gavetas, totalAltura: usedH }], excessLoads };
    },

    _distributeLoadsAcrossCabinets(cargas) {
        const MAX = 1800;

        const loads = cargas
            .filter(c => c.tag)
            .map(c => ({ ...c, h: this._getDrawerHeight(c) }))
            .sort((a, b) => {
                const pa = parseFloat(a.power) || 0;
                const pb = parseFloat(b.power) || 0;
                return pb - pa;
            });

        const result = [];
        let currentGroup = [];
        let currentHeight = 0;

        for (const carga of loads) {
            if (currentHeight + carga.h > MAX && currentGroup.length > 0) {
                result.push({ loads: [...currentGroup], totalHeight: currentHeight });
                currentGroup = [];
                currentHeight = 0;
            }
            currentGroup.push(carga);
            currentHeight += carga.h;
        }

        if (currentGroup.length > 0) {
            result.push({ loads: [...currentGroup], totalHeight: currentHeight });
        }

        return result;
    },

    _rebalanceCabinets(arrangement) {
        if (!arrangement || arrangement.length < 2) return arrangement;
        const MAX = 1800;
        const MIN_OK = 225;
        let changed = true;
        let safety = 0;

        while (changed && safety < 50) {
            changed = false;
            safety++;

            for (let i = 0; i < arrangement.length; i++) {
                const donor = arrangement[i];
                const donorRemaining = MAX - donor.totalHeight;
                if (donorRemaining === 0 || donorRemaining >= MIN_OK) continue;
                if (donor.loads.length === 0) continue;

                const candidates = [...donor.loads].sort((a, b) => a.h - b.h);

                for (const load of candidates) {
                    let moved = false;
                    for (let j = 0; j < arrangement.length; j++) {
                        if (j === i) continue;
                        const rec = arrangement[j];
                        if (MAX - rec.totalHeight >= load.h) {
                            donor.loads = donor.loads.filter(l => l !== load);
                            donor.totalHeight -= load.h;
                            rec.loads.push(load);
                            rec.totalHeight += load.h;
                            moved = true;
                            changed = true;
                            break;
                        }
                    }
                    if (moved) break;
                }
            }
        }

        return arrangement.filter(c => c.loads.length > 0);
    },

    _drawCabinetForma34(ctx, cab, x, y, scale, fontMult, cabW, cabHeight, displayName) {
        const ccw = cab.layoutConfig?.colunaCabosWidth || 200;
        const L = cab.width || (600 + ccw);
        const gavetasW = 600 * scale;
        const colunaCabosW = ccw * scale;
        const barraSecY = 300;
        const gavetasSecY = barraSecY + 1800;
        const colunaCabosSecY = barraSecY + 1900;
        const baseSecY = colunaCabosSecY;

        // ── Barramentos (Y=0 to 300) ──
        const barY = y;
        const barH = 300 * scale;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.fillRect(x, barY, cabW, barH);
        ctx.strokeRect(x, barY, cabW, barH);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(x + 3 * scale, barY + 3 * scale, cabW - 6 * scale, barH - 6 * scale);
        ctx.fillStyle = '#0284c7';
        ctx.font = `bold ${Math.round(8 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Barramentos', x + cabW / 2, barY + barH / 2);

        // ── Exaustor de teto (500×100mm acima da área de gavetas) ──
        const exW = 500 * scale;
        const exH = 100 * scale;
        const exX = x + cabW / 2 - exW / 2;
        const exY = y - exH;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.5;
        ctx.fillRect(exX, exY, exW, exH);
        ctx.strokeRect(exX, exY, exW, exH);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(exX + 3 * scale, exY - 3 * scale, exW - 6 * scale, exH - 6 * scale);
        ctx.fillStyle = '#0284c7';
        ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Exaustor', exX + exW / 2, exY + exH / 2);

        // ── Coluna de Cabos (Y=300 to 2200, right side) ──
        const colCabX = x + gavetasW;
        const colCabY = y + barraSecY * scale;
        const colCabH = (colunaCabosSecY - barraSecY) * scale;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.fillRect(colCabX, colCabY, colunaCabosW, colCabH);
        ctx.strokeRect(colCabX, colCabY, colunaCabosW, colCabH);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(colCabX + 3 * scale, colCabY + 3 * scale, colunaCabosW - 6 * scale, colCabH - 6 * scale);
        ctx.setLineDash([]);
        ctx.fillStyle = '#0284c7';
        ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Coluna', colCabX + colunaCabosW / 2, colCabY + 30 * scale);
        ctx.fillText('Cabos', colCabX + colunaCabosW / 2, colCabY + 50 * scale);

        // ── Gavetas (Y=300 to 2100, left 600mm) ──
        const gavY = y + barraSecY * scale;
        const gavH = (gavetasSecY - barraSecY) * scale;
        const gavetas = cab._gavetas || [];
        if (gavetas.length > 0) {
            let gavYOff = gavY;
            for (const gav of gavetas) {
                const gh = gav.height * scale;
                ctx.fillStyle = '#e0f2fe';
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 0.5;
                ctx.fillRect(x, gavYOff, gavetasW, gh);
                ctx.strokeRect(x, gavYOff, gavetasW, gh);
                ctx.strokeStyle = '#93c5fd';
                ctx.lineWidth = 0.3;
                ctx.strokeRect(x + 3 * scale, gavYOff + 3 * scale, gavetasW - 6 * scale, gh - 6 * scale);
                // Fecho for gavetas
                {
                    const fechoW = 20 * scale;
                    const fechoH = 30 * scale;
                    const fechoX = x + gavetasW - 40 * scale;
                    const drawFecho = fy => {
                        ctx.fillStyle = '#94a3b8';
                        ctx.strokeStyle = '#64748b';
                        ctx.lineWidth = 0.5;
                        ctx.fillRect(fechoX, fy, fechoW, fechoH);
                        ctx.strokeRect(fechoX, fy, fechoW, fechoH);
                        ctx.fillStyle = '#64748b';
                        ctx.beginPath();
                        ctx.arc(fechoX + fechoW / 2, fy + fechoH / 2, 5 * scale, 0, Math.PI * 2);
                        ctx.fill();
                    };
                    if (gav.height === 100 || gav.height === 150) {
                        drawFecho(gavYOff + gh / 2 - fechoH / 2);
                    } else if (gav.height >= 200) {
                        drawFecho(gavYOff + 50 * scale - fechoH / 2);
                        drawFecho(gavYOff + gh - 50 * scale - fechoH / 2);
                    }
                }
                // Comando Mecânico (70x70mm rect + 16mm circle)
                {
                    const cmW = 70 * scale;
                    const cmH = 70 * scale;
                    const cmX = x + gavetasW / 2 - cmW / 2;
                    let cmY;
                    if (gav.height === 100) {
                        cmY = gavYOff + gh / 2 - cmH / 2;
                    } else {
                        cmY = gavYOff + gh - 50 * scale - cmH / 2;
                    }
                    ctx.fillStyle = '#94a3b8';
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 0.5;
                    ctx.fillRect(cmX, cmY, cmW, cmH);
                    ctx.strokeRect(cmX, cmY, cmW, cmH);
                    ctx.fillStyle = '#64748b';
                    ctx.beginPath();
                    ctx.arc(cmX + cmW / 2, cmY + cmH / 2, 8 * scale, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Gaveta id (top-left)
                ctx.fillStyle = '#94a3b8';
                ctx.font = `${Math.round(4.5 * fontMult)}px sans-serif`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(gav.id, x + 2, gavYOff + 2);
                // Carga tag (center)
                ctx.fillStyle = '#1e293b';
                ctx.font = `bold ${Math.round(6 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const cmCenterY = gav.height === 100 ? gavYOff + gh / 2 : gavYOff + gh - 50 * scale;
                if (gav._isReserva) {
                    ctx.fillText('TAG??', x + gavetasW / 2 + 147 * scale, cmCenterY + 8 * scale - 23.2 * scale);
                    ctx.fillStyle = '#64748b';
                    ctx.font = `${Math.round(12 * fontMult)}px sans-serif`;
                    ctx.fillText('Gav. Reserva', x + gavetasW / 2 + 147 * scale, cmCenterY + 8 * scale + 10 * fontMult + 20 * scale - 23.2 * scale);
                } else {
                    ctx.fillText(gav.cargaTag || '', x + gavetasW / 2 + 147 * scale, cmCenterY + 8 * scale - 23.2 * scale);
                    ctx.fillStyle = '#64748b';
                    ctx.font = `${Math.round(12 * fontMult)}px sans-serif`;
                    ctx.fillText(gav.potencia ? gav.potencia + 'kW' : '', x + gavetasW / 2 + 147 * scale, cmCenterY + 8 * scale + 10 * fontMult + 20 * scale - 23.2 * scale);
                }
                // Height label (bottom center)
                ctx.fillStyle = '#94a3b8';
                ctx.font = `${Math.round(4.5 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(gav.height + 'mm', x + gavetasW / 2, gavYOff + gh - 2);
                gavYOff += gh;
            }
        } else {
            // No gavetas: show empty area with cabinet name
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, gavY, gavetasW, gavH);
            ctx.fillStyle = '#475569';
            ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayName, x + gavetasW / 2, gavY + 20 * scale);
        }

        // ── Barra Terra (Y=2100 to 2200, left 600mm) ──
        const btY = y + gavetasSecY * scale;
        const btH = (colunaCabosSecY - gavetasSecY) * scale;
        ctx.fillStyle = '#e0f2fe';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.5;
        ctx.fillRect(x, btY, gavetasW, btH);
        ctx.strokeRect(x, btY, gavetasW, btH);
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 0.3;
        ctx.strokeRect(x + 3 * scale, btY + 3 * scale, gavetasW - 6 * scale, btH - 6 * scale);
        ctx.fillStyle = '#0284c7';
        ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Barra Terra', x + gavetasW / 2, btY + btH / 2);

        // ── Dividers (vertical lines between gavetas section and cable column) ──
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(colCabX, colCabY);
        ctx.lineTo(colCabX, colCabY + colCabH);
        ctx.stroke();
    },

    _drawLayoutInternal(ctx, cabinets, scale, fontMult, padding, externalOnly = false) {
        const CANVAS_WIDTH = ctx.canvas.width;
        const CANVAS_HEIGHT = ctx.canvas.height;

        const COLORS = [
            { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af' },
            { fill: '#fce7f3', stroke: '#ec4899', text: '#9d174d' },
            { fill: '#d1fae5', stroke: '#10b981', text: '#065f46' },
            { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
            { fill: '#e0e7ff', stroke: '#6366f1', text: '#3730a3' },
            { fill: '#ccfbf1', stroke: '#14b8a6', text: '#115e59' },
            { fill: '#f3e8ff', stroke: '#a855f7', text: '#6b21a8' },
            { fill: '#fff7ed', stroke: '#f97316', text: '#9a3412' },
        ];

        const r = 4;
        let x = padding;
        const y = padding;

        for (let idx = 0; idx < cabinets.length; idx++) {
            const cab = cabinets[idx];
            const color = COLORS[0];
            const cabW = Math.max(cab.width * scale, 60);
            const cabH = (cab.height || 2300) * scale;
            const cfg = cab.layoutConfig || this._getDefaultLayoutConfig();
            const displayName = cab.name && cab.name.length > 16 ? cab.name.slice(0, 15) + '..' : (cab.name || '');

            // Cabinet body
            ctx.shadowColor = 'rgba(0,0,0,0.08)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, cabW, cabH, r);
            ctx.fillStyle = color.fill;
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = color.stroke;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Olhais para içamento (60×60mm acima da linha 0, círculo 20mm Ø) — apenas Forma 1/2
            if (!this._isForma34KitFrame(cab.segregacao, cab._fabricante)) {
                const olhalSize = 60 * scale;
                const furoR = 10 * scale;
                const olhalTopY = y - olhalSize;
                const olhalCenterY = y - olhalSize / 2;
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, olhalTopY, olhalSize, olhalSize);
                ctx.beginPath();
                ctx.arc(x + olhalSize / 2, olhalCenterY, furoR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeRect(x + cabW - olhalSize, olhalTopY, olhalSize, olhalSize);
                ctx.beginPath();
                ctx.arc(x + cabW - olhalSize / 2, olhalCenterY, furoR, 0, Math.PI * 2);
                ctx.stroke();
            }

            const cabHeight = cab.height || 2300;

            if (externalOnly) {
                // Vista Externa: desenha a porta com componentes externos
                const doorW = (cab.width - 10) * scale;
                const doorH = (cabHeight - 10) * scale;
                const doorX = x + (cabW - doorW) / 2;
                const doorY = y + 5 * scale;

                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([]);
                ctx.strokeRect(doorX, doorY, doorW, doorH);

                // Label "Porta" no topo da porta
                ctx.fillStyle = '#1e293b';
                ctx.font = `bold ${Math.round(7 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Porta', x + cabW / 2, doorY + 12 * scale);

                // Desenha as faixas (door rows) e componentes da porta
                const doorRows = cab.doorRows || [];
                for (const row of doorRows) {
                    // Linha guia horizontal (tracejada)
                    const rowY = doorY + row.y * scale;
                    if (row.linha && row.linha.nome !== 'Outros (Porta)') {
                        ctx.save();
                        ctx.strokeStyle = '#94a3b8';
                        ctx.lineWidth = 0.5;
                        ctx.setLineDash([3 * scale, 3 * scale]);
                        ctx.beginPath();
                        ctx.moveTo(doorX + 5 * scale, rowY);
                        ctx.lineTo(doorX + doorW - 5 * scale, rowY);
                        ctx.stroke();
                        ctx.restore();

                        ctx.fillStyle = '#94a3b8';
                        ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(row.linha.nome, doorX + 4 * scale, rowY - 2 * scale);
                    }

                    for (const item of row.items) {
                        const ix = x + item.x * scale;
                        const iy = doorY + item.y * scale;
                        const iw = Math.max(item.w * scale, 4);
                        const ih = Math.max(item.h * scale, 4);

                        ctx.shadowColor = 'rgba(0,0,0,0.06)';
                        ctx.shadowBlur = 3 * fontMult;
                        ctx.shadowOffsetY = 1 * fontMult;
                        ctx.beginPath();
                        if (iw > 8 && ih > 8) {
                            ctx.roundRect(ix, iy, iw, ih, 2);
                        } else {
                            ctx.rect(ix, iy, iw, ih);
                        }
                        ctx.fillStyle = item.color;
                        ctx.fill();
                        ctx.shadowColor = 'transparent';
                        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        if (iw > 20 * fontMult && ih > 10 * fontMult) {
                            ctx.fillStyle = '#fff';
                            ctx.font = `bold ${Math.round(6 * fontMult)}px sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            const label = item.desc.length > 5 ? item.desc.slice(0, 4) + '.' : item.desc;
                            ctx.fillText(label, ix + iw / 2, iy + ih / 2);
                        }
                    }
                }

                // "Vista Frontal Externa" no lugar do nome do armário
                ctx.fillStyle = color.stroke;
                ctx.font = `bold ${Math.round(7 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(displayName, x + cabW / 2, y + 20 * scale);

                // Não desenha: barramentos, canaletas, componentes internos, placa de montagem, barra terra
            } else {
                // Vista Interna - conteúdo normal
                const isForma2 = cab.segregacao === 'Forma 2a' || cab.segregacao === 'Forma 2b';
                const isForma34 = this._isForma34KitFrame(cab.segregacao, cab._fabricante);

                if (isForma2) {
                    // "Barramentos" centered at Y=150mm (middle of 0-300mm zone)
                    ctx.fillStyle = color.stroke;
                    ctx.font = `bold ${Math.round(9 * fontMult)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Barramentos', x + cabW / 2, y + 150 * scale);

                    // 300mm horizontal line
                    ctx.save();
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 1;
                    const line300Y = y + 300 * scale;
                    ctx.beginPath();
                    ctx.moveTo(x + 30 * scale, line300Y);
                    ctx.lineTo(x + cabW - 30 * scale, line300Y);
                    ctx.stroke();
                    ctx.restore();
                }

                if (isForma34) {
                    this._drawCabinetForma34(ctx, cab, x, y, scale, fontMult, cabW, cabHeight, displayName);
                }

                // Cabinet name 20mm below top, centered
                ctx.fillStyle = color.stroke;
                ctx.font = `bold ${Math.round(7 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(displayName, x + cabW / 2, y + 20 * scale);

                // Canaletas do array (objetos de infraestrutura)
                const canaletas = cfg.canaletas || [];
                for (const can of canaletas) {
                    if (can.tipo === 'quadro') {
                        this._drawQuadroCanaleta(ctx, can, x, y, scale, fontMult);
                    } else if (can.tipo === 'linear') {
                        this._drawCanaletaSegment(ctx, {
                            x: x / scale + can.x, y: y / scale + can.y,
                            comprimento: can.comprimento, largura: can.largura_base || can.largura || 50,
                            orientacao: can.orientacao, modelo: can.modelo
                        }, scale, fontMult);
                    }
                }

                // Component rows + trilhos
                const rows = cab.rows || [];
                for (const row of rows) {
                    // DIN rail below row (draw FIRST, components cover it)
                    if (row.trilho) {
                        const t = row.trilho;
                        ctx.fillStyle = '#e2e8f0';
                        ctx.strokeStyle = '#94a3b8';
                        ctx.lineWidth = 0.5;
                        ctx.fillRect(x + t.x * scale, y + t.y * scale, t.w * scale, t.h * scale);
                        ctx.strokeRect(x + t.x * scale, y + t.y * scale, t.w * scale, t.h * scale);
                    }
                    for (const item of row.items) {
                        const ix = x + item.x * scale;
                        const iy = y + item.y * scale;
                        const iw = Math.max(item.w * scale, 4);
                        const ih = Math.max(item.h * scale, 4);

                        ctx.shadowColor = 'rgba(0,0,0,0.06)';
                        ctx.shadowBlur = 3 * fontMult;
                        ctx.shadowOffsetY = 1 * fontMult;
                        ctx.beginPath();
                        if (iw > 8 && ih > 8) {
                            ctx.roundRect(ix, iy, iw, ih, 2);
                        } else {
                            ctx.rect(ix, iy, iw, ih);
                        }
                        ctx.fillStyle = item.color;
                        ctx.fill();
                        ctx.shadowColor = 'transparent';
                        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        if (iw > 20 * fontMult && ih > 10 * fontMult) {
                            ctx.fillStyle = '#fff';
                            ctx.font = `bold ${Math.round(6 * fontMult)}px sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            const label = item.desc.length > 5 ? item.desc.slice(0, 4) + '.' : item.desc;
                            ctx.fillText(label, ix + iw / 2, iy + ih / 2);
                        }
                    }
                }

                // Placa de montagem + borda 30mm (comum a todas as formas, exceto Forma 3A-4B)
                if (!isForma34) {
                const borderInset = 30;
                const plateMargin = 50;
                const plateW = (cab.width - plateMargin * 2) * scale;
                const plateX = x + plateMargin * scale;
                if (isForma2) {
                    // Forma 2a/2b: borda + placa fixa 1840mm (após barramento 300mm)
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x + borderInset * scale, y + borderInset * scale, (cab.width - borderInset * 2) * scale, (cabHeight - borderInset * 2 - 100) * scale);
                    const plateH = 1840 * scale;
                    const plateY = y + 315 * scale;
                    ctx.fillStyle = '#f8fafc';
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(plateX, plateY, plateW, plateH);
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Placa de Montagem', x + cabW / 2, plateY + 20 * scale);
                } else {
                    // Forma 1: borda 30mm + placa proporcional (sem zona de barramento)
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x + borderInset * scale, y + borderInset * scale, (cab.width - borderInset * 2) * scale, (cabHeight - borderInset * 2 - 100) * scale);
                    const plateH = (cabHeight - 150) * scale;
                    const plateY = y + 40 * scale;
                    ctx.fillStyle = '#f8fafc';
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(plateX, plateY, plateW, plateH);
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Placa de Montagem', x + cabW / 2, plateY + 20 * scale);

                    // Barra Terra: apenas para CCM (não automação)
                    if (!cab._isAutomation) {
                        const barraTerraY = y + (cabHeight - 110) * scale;
                        ctx.save();
                        ctx.strokeStyle = '#94a3b8';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x, barraTerraY);
                        ctx.lineTo(x + cabW, barraTerraY);
                        ctx.stroke();
                        ctx.restore();
                        ctx.fillStyle = '#475569';
                        ctx.font = `${Math.round(8 * fontMult)}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('Barra Terra', x + cabW / 2, barraTerraY + 50 * scale);
                    }
                }
                } // end !isForma34
            }

            // Base (cabHeight - 100mm) — comum a ambas as vistas
            const baseY = y + (cabHeight - 100) * scale;
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, baseY);
            ctx.lineTo(x + cabW, baseY);
            ctx.stroke();
            ctx.restore();
            ctx.fillStyle = '#000';
            ctx.font = `${Math.round(8 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Base', x + cabW / 2, baseY + 50 * scale);

            // Cotas (30mm abaixo da base)
            const bottomY = baseY + 190 * scale;

            // Dimension label
            ctx.fillStyle = '#475569';
            ctx.font = `bold ${Math.round(10 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(externalOnly ? (cab.width + 'mm × ' + cabHeight + 'mm') : (cab.width + ' mm'), x + cabW / 2, bottomY);

            if (!externalOnly && cab.calculatedWidth > 0 && Math.abs(cab.calculatedWidth - cab.width) > 20) {
                ctx.fillStyle = '#94a3b8';
                ctx.font = `${Math.round(8 * fontMult)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText('(calc: ' + Math.ceil(cab.calculatedWidth) + 'mm)', x + cabW / 2, bottomY + Math.round(13 * fontMult));
            }

            if (!externalOnly) {
                this._drawVerticalDimensions(ctx, cab, x, y, scale, fontMult);
            }

            x += cabW + 0;
        }

        // Título da vista
        const totalWidthDraw = x - padding;
        if (totalWidthDraw > 0 && cabinets.length > 0) {
            const isRear = cabinets[0]._face === 'rear';
            let titulo;
            if (externalOnly) {
                titulo = isRear ? 'Vista Traseira Externa' : 'Vista Frontal Externa';
            } else {
                titulo = isRear ? 'Vista Traseira Interna' : 'Vista Frontal Interna';
            }
            ctx.fillStyle = '#1e293b';
            ctx.font = `bold ${Math.round(10 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const cabMaxHeight = Math.max(...cabinets.map(c => c.height || 2300), 2300);
            ctx.fillText(titulo, padding + totalWidthDraw / 2, y + (cabMaxHeight + 180) * scale);
        }

        // Legend (apenas vista interna, exceto KitFrame)
        const allKitFrame = cabinets.length > 0 && cabinets.every(c => this._isForma34KitFrame(c.segregacao, c._fabricante));
        if (!externalOnly && !allKitFrame) {
            const legendY = CANVAS_HEIGHT - Math.round(14 * fontMult);
            ctx.font = `${Math.round(7 * fontMult)}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            let lx = padding;
            const legendItems = [
                { label: 'Disjuntor', color: '#ef4444' },
                { label: 'Contator', color: '#3b82f6' },
                { label: 'Inv./S.Starter', color: '#f59e0b' },
                { label: 'Relé', color: '#8b5cf6' },
                { label: 'Borne', color: '#10b981' },
                { label: 'Fonte', color: '#ec4899' },
            ];
            for (const leg of legendItems) {
                const boxSize = Math.round(10 * fontMult);
                ctx.fillStyle = leg.color;
                ctx.fillRect(lx, legendY - boxSize / 2, boxSize, boxSize);
                ctx.fillStyle = '#64748b';
                ctx.fillText(leg.label, lx + boxSize + Math.round(4 * fontMult), legendY);
                lx += ctx.measureText(leg.label).width + boxSize + Math.round(28 * fontMult);
            }
        }
    },

    _getDefaultLayoutConfig() {
        return {
            canaletaEsq: 0,
            canaletaDir: 0,
            larguraTrilhoDIN: 35,
            espacamentoLinhas: 10,
            linhas: [
                { id: 'protecoes', nome: 'Proteções', yCentroTrilho: 525, categorias: ['DISJUNTOR', 'DISJUNTOR MOTOR', 'SECCIONADORA', 'FUSÍVEL'], temTrilho: true },
                { id: 'acionamentos', nome: 'Acionamentos', yCentroTrilho: 1025, categorias: ['CONTATOR', 'INVERSOR', 'SOFT-STARTER', 'SOFT STARTER'], temTrilho: true },
                { id: 'comandos', nome: 'Comandos / Automação', yCentroTrilho: 1500, categorias: ['RELÉ', 'RELE', 'FONTE', 'PLC', 'MÓDULO', 'MODULO'], temTrilho: true },
                { id: 'bornes', nome: 'Bornes / Sinal', yCentroTrilho: 1900, categorias: ['BORNE', 'BORNE PORTA-FUSÍVEL'], temTrilho: true },
            ],
            gapsTermicos: {
                'DISJUNTOR': 10,
                'DISJUNTOR MOTOR': 10,
                'SECCIONADORA': 8,
                'FUSÍVEL': 8,
                'CONTATOR': 5,
                'INVERSOR': 15,
                'SOFT-STARTER': 10,
                'SOFT STARTER': 10,
                'RELÉ': 3,
                'RELE': 3,
                'FONTE': 8,
                'PLC': 5,
                'MÓDULO': 3,
                'MODULO': 3,
                'BORNE': 2,
                'BORNE PORTA-FUSÍVEL': 2,
                'Outros': 5
            },
            canaletas: [],
            retalhosCanaleta: [],
            comprimentoTrilho: 0,
            showSideView: false,
            sideViewCabinetIndex: -1,
            colunaCabosWidth: 200,

            doorLinhas: [
                { id: 'door_ihm', nome: 'IHM', yCentro: 200 },
                { id: 'door_comando', nome: 'Comando', yCentro: 600 },
                { id: 'door_sinalizacao', nome: 'Sinalização', yCentro: 1200 }
            ]
        };
    },

    _getModelosCanaleta() {
        return [
            { id: '30x50', largura: 30, altura: 50 },
            { id: '30x80', largura: 30, altura: 80 },
            { id: '50x50', largura: 50, altura: 50 },
            { id: '50x80', largura: 50, altura: 80 },
            { id: '80x50', largura: 80, altura: 50 },
            { id: '80x80', largura: 80, altura: 80 },
        ];
    },

    _calcularConsumoCanaletas(canaletas) {
        let total = 0;
        const CONNECTOR_LOSS = 0;
        for (const can of canaletas || []) {
            if (can.tipo === 'quadro' && can.segmentos) {
                for (const seg of can.segmentos) {
                    total += seg.comprimento || 0;
                }
            } else if (can.tipo === 'linear') {
                total += can.comprimento || 0;
            }
        }
        const BARRA = 2000;
        const barras = Math.ceil(total / BARRA);
        const sobra = Math.max(0, barras * BARRA - total);
        return { totalComprimento: total, barras, sobra };
    },

    _drawQuadroCanaleta(ctx, can, cabX, cabY, scale, fontMult) {
        const fx = cabX / scale + (can.x || 0);
        const fy = cabY / scale + (can.y || 0);
        const W = can.larguraQuadro || 500;
        const H = can.alturaQuadro || 1800;
        const L = can.largura_base || 50;

        const sx = fx * scale, sy = fy * scale;
        const sw = W * scale, sh = H * scale;
        const sl = L * scale;

        ctx.save();
        ctx.beginPath();
        ctx.rect(sx, sy, sw, sh);
        ctx.rect(sx + sl, sy + sl, sw - 2 * sl, sh - 2 * sl);
        ctx.clip('evenodd');

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(sx, sy, sw, sh);

        ctx.strokeStyle = 'rgba(100,116,139,0.2)';
        ctx.lineWidth = 0.3;
        const step = 6 * fontMult;
        for (let iy = sy; iy < sy + sh; iy += step) {
            ctx.beginPath(); ctx.moveTo(sx, iy); ctx.lineTo(sx + sw, iy + step); ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.strokeRect(sx + sl, sy + sl, sw - 2 * sl, sh - 2 * sl);

        ctx.beginPath();
        ctx.moveTo(sx, sy); ctx.lineTo(sx + sl, sy + sl);
        ctx.moveTo(sx + sw, sy); ctx.lineTo(sx + sw - sl, sy + sl);
        ctx.moveTo(sx + sw, sy + sh); ctx.lineTo(sx + sw - sl, sy + sh - sl);
        ctx.moveTo(sx, sy + sh); ctx.lineTo(sx + sl, sy + sh - sl);
        ctx.stroke();

        if (W > 60 && H > 40) {
            ctx.fillStyle = '#475569';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(can.modelo || '', sx + sw / 2, sy + sh / 2);
        }
    },

    _drawCanaletaSegment(ctx, seg, scale, fontMult) {
        const { x: sx, y: sy, comprimento, largura, orientacao } = seg;
        const sw = orientacao === 'H' ? comprimento : largura;
        const sh = orientacao === 'H' ? largura : comprimento;

        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 0.5;
        ctx.fillRect(sx * scale, sy * scale, sw * scale, sh * scale);
        ctx.strokeRect(sx * scale, sy * scale, sw * scale, sh * scale);

        if (sw * scale > 20 && sh * scale > 8) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(sx * scale, sy * scale, sw * scale, sh * scale);
            ctx.clip();
            ctx.strokeStyle = 'rgba(100,116,139,0.2)';
            ctx.lineWidth = 0.3;
            const step = 6 * fontMult;
            if (orientacao === 'H') {
                for (let ix = sx * scale; ix < (sx + sw) * scale; ix += step) {
                    ctx.beginPath(); ctx.moveTo(ix, sy * scale); ctx.lineTo(ix + step, (sy + sh) * scale); ctx.stroke();
                }
            } else {
                for (let iy = sy * scale; iy < (sy + sh) * scale; iy += step) {
                    ctx.beginPath(); ctx.moveTo(sx * scale, iy); ctx.lineTo((sx + sw) * scale, iy + step); ctx.stroke();
                }
            }
            ctx.restore();
        }

        if (sw * scale > 30 && sh * scale > 12) {
            ctx.fillStyle = '#475569';
            ctx.font = `${Math.round(6 * fontMult)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(seg.modelo || '', (sx + sw / 2) * scale, (sy + sh / 2) * scale);
        }
    },

    _drawVerticalDimensions(ctx, cab, x, y, scale, fontMult) {
        const cfg = cab.layoutConfig || this._getDefaultLayoutConfig();
        const cabHeight = cab.height || 2300;
        const canEsq = cfg.canaletaEsq || 0;
        const dimX = canEsq >= 20 ? x + canEsq * 0.55 * scale : x - 6 * scale;
        const marks = [];

        marks.push({ y: 0 });

        const isForma2 = cab.segregacao === 'Forma 2a' || cab.segregacao === 'Forma 2b';
        if (isForma2) {
            marks.push({ y: 300 });
        }

        for (const linha of cfg.linhas || []) {
            const yc = linha.yCentroTrilho ?? Math.round(((linha.yInicio || 0) + (linha.yFim || 0)) / 2);
            marks.push({ y: yc, label: linha.nome });
        }

        for (const can of cfg.canaletas || []) {
            if (can.tipo === 'quadro') {
                const t = can.y || 300;
                const b = t + (can.alturaQuadro || 1800);
                marks.push({ y: t, canaleta: true, label: 'Quadro' });
                marks.push({ y: b, canaleta: true });
            } else if (can.tipo === 'linear' && can.orientacao === 'V') {
                marks.push({ y: can.y, canaleta: true, label: 'Canaleta' });
                marks.push({ y: can.y + can.comprimento, canaleta: true });
            }
        }

        if (!isForma2 && !cab._isAutomation) {
            marks.push({ y: cabHeight - 110, label: 'Barra Terra' });
        }
        marks.push({ y: cabHeight - 100, label: 'Base' });
        marks.push({ y: cabHeight });

        marks.sort((a, b) => a.y - b.y);
        const merged = [];
        for (const m of marks) {
            if (merged.length === 0 || Math.abs(m.y - merged[merged.length - 1].y) > 3) {
                merged.push({ ...m });
            } else if (m.label && !merged[merged.length - 1].label) {
                merged[merged.length - 1].label = m.label;
                merged[merged.length - 1].canaleta = merged[merged.length - 1].canaleta || m.canaleta;
            }
        }
        if (merged.length < 2) return;

        ctx.save();

        const tickLen = Math.max(3 * fontMult, 5);
        const gap = Math.max(2 * fontMult, 3);

        const y0 = y + merged[0].y * scale;
        const y1 = y + merged[merged.length - 1].y * scale;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(dimX, y0);
        ctx.lineTo(dimX, y1);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = `${Math.round(5.5 * fontMult)}px sans-serif`;
        ctx.textBaseline = 'middle';

        for (let i = 0; i < merged.length; i++) {
            const m = merged[i];
            const py = y + m.y * scale;
            if (py < y - 10) continue;

            const isCanaleta = m.canaleta;
            ctx.strokeStyle = isCanaleta ? '#0e7490' : '#64748b';
            ctx.lineWidth = isCanaleta ? 1 : 0.5;
            ctx.beginPath();
            ctx.moveTo(dimX - tickLen, py);
            ctx.lineTo(dimX + tickLen, py);
            ctx.stroke();

            ctx.textAlign = 'right';
            ctx.fillStyle = isCanaleta ? '#0e7490' : '#64748b';
            ctx.fillText(m.y + '', dimX - tickLen - gap, py);

            if (m.label && !/^\d+$/.test(m.label)) {
                ctx.textAlign = 'left';
                ctx.fillStyle = isCanaleta ? '#0e7490' : '#64748b';
                ctx.fillText(m.label, dimX + tickLen + gap, py);
            }

            if (i < merged.length - 1) {
                const nextPy = y + merged[i + 1].y * scale;
                const midY = (py + nextPy) / 2;
                const diff = merged[i + 1].y - merged[i].y;
                if (diff >= 20 && midY >= y) {
                    ctx.fillStyle = '#475569';
                    const fontSize = Math.round(5 * fontMult);
                    ctx.font = `${fontSize}px sans-serif`;
                    const labelW = m.label && !/^\d+$/.test(m.label)
                        ? ctx.measureText(m.label).width + gap * 2 : 0;
                    ctx.textAlign = 'left';
                    ctx.fillText(diff + 'mm', dimX + tickLen + gap + labelW, midY);
                    ctx.font = `${Math.round(5.5 * fontMult)}px sans-serif`;
                }
            }
        }

        ctx.restore();
    },

    _adicionarLinhaLayout(cabId) {
        const selector = cabId
            ? `.cab-config-block[data-cab-id="${cabId}"] .cab-linhas-tbody`
            : '#_layout_config_overlay .cab-linhas-tbody';
        const tbody = document.querySelector(selector);
        if (!tbody) return;
        const i = tbody.children.length;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td style="display:none;"><input type="hidden" class="lcfg_id" value=""></td>
                <td><input type="text" class="form-control lcfg_nome" value="Nova" style="width:120px;font-size:12px;"></td>
                <td><input type="number" class="form-control lcfg_yCentro" value="1000" style="width:70px;font-size:12px;"></td>
                <td style="text-align:center;"><input type="checkbox" class="lcfg_trilho" checked style="width:16px;height:16px;cursor:pointer;"></td>
                <td><input type="text" class="form-control lcfg_cats" value="" style="width:160px;font-size:12px;"></td>
                <td style="text-align:center;"><button type="button" class="btn btn-xs btn-ghost" onclick="this.closest('tr').remove()" style="color:#ef4444;font-size:14px;padding:2px 4px;">✕</button></td>
            </tr>
        `);
    },

    _adicionarLinhaPortaLayout(cabId) {
        const selector = cabId
            ? `.cab-config-block[data-cab-id="${cabId}"] .cab-door-linhas-tbody`
            : '#_layout_config_overlay .cab-door-linhas-tbody';
        const tbody = document.querySelector(selector);
        if (!tbody) return;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td style="display:none;"><input type="hidden" class="dlcfg_id" value=""></td>
                <td><input type="text" class="form-control dlcfg_nome" value="Nova Faixa" style="width:140px;font-size:12px;"></td>
                <td><input type="number" class="form-control dlcfg_yCentro" value="800" style="width:70px;font-size:12px;"></td>
                <td style="text-align:center;"><button type="button" class="btn btn-xs btn-ghost" onclick="this.closest('tr').remove()" style="color:#ef4444;font-size:14px;padding:2px 4px;">✕</button></td>
            </tr>
        `);
    },

    _getCanaletaTarget(eq, cabId) {
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0] || cabId;
        const face = parts[1] || null;
        if (actualCabId) {
            const cab = eq.layoutConfig?.cabinetAssignments?.[actualCabId];
            if (cab) {
                if (face && cab.faces?.[face]) {
                    const fc = cab.faces[face];
                    if (!fc.layoutConfig) fc.layoutConfig = this._getDefaultLayoutConfig();
                    if (!fc.layoutConfig.canaletas) fc.layoutConfig.canaletas = [];
                    return fc.layoutConfig;
                }
                if (!cab.layoutConfig) cab.layoutConfig = this._getDefaultLayoutConfig();
                if (!cab.layoutConfig.canaletas) cab.layoutConfig.canaletas = [];
                return cab.layoutConfig;
            }
        }
        return eq.layoutConfig || this._getDefaultLayoutConfig();
    },

    _editarCanaleta(canId, cabId) {
        console.log('[Edit] canId:', canId, 'cabId:', cabId, 'idx:', this.activeEquipmentIndex);
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        console.log('[Edit] eq:', !!eq);
        if (!eq) return;
        const cfg = this._getCanaletaTarget(eq, cabId);
        console.log('[Edit] cfg keys:', Object.keys(cfg), 'canaletas:', cfg.canaletas?.length);
        console.log('[Edit] IDs no cfg.canaletas:', (cfg.canaletas || []).map(c => c.id));
        const can = (cfg.canaletas || []).find(c => c.id === canId);
        console.log('[Edit] can found:', !!can);
        if (!can) return;
        console.log('[Edit] tipo:', can.tipo);
        if (can.tipo === 'quadro') {
            this._adicionarQuadroCanaleta(cabId, can);
        } else {
            this._adicionarPecaRetaCanaleta(cabId, can);
        }
    },

    _refreshCanaletasList(cabId) {
        const listEl = Array.from(document.querySelectorAll('.cab-config-block'))
            .find(el => el.getAttribute('data-cab-id') === cabId)
            ?.querySelector('.cab-canaletas-list');
        if (!listEl) return;
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cfg = this._getCanaletaTarget(eq, cabId);
        const canaletas = cfg.canaletas || [];
        const html = canaletas.length === 0
            ? '<div style="font-size:11px;color:#94a3b8;padding:4px 0;">Nenhuma canaleta adicional.</div>'
            : canaletas.map(can => {
                const detalhe = can.tipo === 'quadro'
                    ? `${can.modelo}, ${can.larguraQuadro}x${can.alturaQuadro}mm`
                    : `${can.modelo}, ${can.orientacao === 'V' ? 'Vertical' : 'Horizontal'}, ${can.comprimento}mm`;
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;background:#f8fafc;border-radius:4px;margin-bottom:2px;font-size:11px;">
                            <span>${can.tipo === 'quadro' ? '📐' : '📏'} ${detalhe}</span>
                            <div>
                                <button type="button" class="btn btn-xs btn-ghost" onclick="event.stopPropagation();window.propostaTecnicaModule._editarCanaleta('${can.id}','${cabId}')" style="color:#3b82f6;font-size:10px;">✏️</button>
                                <button type="button" class="btn btn-xs btn-ghost" onclick="event.stopPropagation();window.propostaTecnicaModule._removerCanaleta('${can.id}','${cabId}')" style="color:#ef4444;font-size:10px;">✕</button>
                            </div>
                        </div>`;
            }).join('');
        listEl.innerHTML = html;
    },

    _adicionarQuadroCanaleta(cabId, editCan = null) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cfg = this._getCanaletaTarget(eq, cabId);
        if (!cfg.canaletas) cfg.canaletas = [];

        const modelos = this._getModelosCanaleta();
        const editModelo = editCan ? editCan.modelo : null;
        const opts = modelos.map(m => `<option value="${m.id}" ${editModelo === m.id ? 'selected' : ''}>${m.id} (${m.largura}x${m.altura}mm)</option>`).join('');

        const isEdit = !!editCan;
        const title = isEdit ? 'Editar Quadro de Canaletas' : 'Adicionar Quadro de Canaletas';
        const btnText = isEdit ? 'Salvar' : 'Adicionar';
        const wVal = editCan ? editCan.larguraQuadro : 500;
        const hVal = editCan ? editCan.alturaQuadro : 1800;

        const dlg = document.createElement('div');
        dlg.id = '_can_frame_dlg';
        dlg.dataset.cabId = cabId || '';
        if (isEdit) dlg.dataset.editId = editCan.id;
        dlg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999;display:flex;justify-content:center;align-items:center;';
        dlg.innerHTML = `
            <div style="background:white;border-radius:12px;padding:24px;max-width:480px;width:90%;">
                <h3 style="margin:0 0 16px;">${title}</h3>
                <div class="form-group"><label class="form-label">Modelo</label><select id="can_frame_model" class="form-control">${opts}</select></div>
                <div style="display:flex;gap:12px;">
                    <div class="form-group" style="flex:1;"><label class="form-label">Largura (mm)</label><input type="number" id="can_frame_w" class="form-control" value="${wVal}" min="100"></div>
                    <div class="form-group" style="flex:1;"><label class="form-label">Altura (mm)</label><input type="number" id="can_frame_h" class="form-control" value="${hVal}" min="100"></div>
                </div>
                <div style="font-size:11px;color:#64748b;margin:4px 0 16px;">Posicionado nas bordas da área útil (Y=315-2155mm). Esta é a área útil para uso de canaleta. O ponto "0" superior para canaleta é x=50, y=315</div>
                <div style="display:flex;justify-content:flex-end;gap:8px;">
                    <button class="btn btn-cancel" onclick="this.closest('#_can_frame_dlg').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.propostaTecnicaModule._confirmQuadroCanaleta()">${btnText}</button>
                </div>
            </div>`;
        document.body.appendChild(dlg);
    },

    _confirmQuadroCanaleta() {
        const dlg = document.getElementById('_can_frame_dlg');
        if (!dlg) return;
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cabId = dlg.dataset.cabId;
        const cfg = this._getCanaletaTarget(eq, cabId);
        if (!cfg.canaletas) cfg.canaletas = [];

        const modelId = document.getElementById('can_frame_model')?.value;
        const frameW = parseInt(document.getElementById('can_frame_w')?.value) || 500;
        const frameH = parseInt(document.getElementById('can_frame_h')?.value) || 1800;
        const modelo = this._getModelosCanaleta().find(m => m.id === modelId);
        if (!modelo) { dlg.remove(); return; }

        const l = modelo.largura;
        const editId = dlg.dataset.editId || null;
        if (editId) {
            const idx = cfg.canaletas.findIndex(c => c.id === editId);
            if (idx === -1) { dlg.remove(); return; }
            cfg.canaletas[idx] = {
                ...cfg.canaletas[idx],
                modelo: modelId,
                largura_base: l,
                profundidade: modelo.altura,
                larguraQuadro: frameW,
                alturaQuadro: frameH,
                segmentos: [
                    { id: editId + '_v1', orientacao: 'V', x: 50, y: 315, comprimento: frameH - l, largura: l, modelo: modelId, miter: 'tl,bl' },
                    { id: editId + '_v2', orientacao: 'V', x: 50 + frameW - l, y: 315, comprimento: frameH - l, largura: l, modelo: modelId, miter: 'tr,br' },
                    { id: editId + '_h1', orientacao: 'H', x: 50, y: 315, comprimento: frameW, largura: l, modelo: modelId, miter: 'tl,tr' },
                    { id: editId + '_h2', orientacao: 'H', x: 50, y: 315 + frameH - l, comprimento: frameW, largura: l, modelo: modelId, miter: 'bl,br' },
                ]
            };
        } else {
            const id = 'can_' + Date.now();
            cfg.canaletas.push({
                id, tipo: 'quadro', modelo: modelId,
                largura_base: l, profundidade: modelo.altura,
                x: 50, y: 315, larguraQuadro: frameW, alturaQuadro: frameH,
                segmentos: [
                    { id: id + '_v1', orientacao: 'V', x: 50, y: 315, comprimento: frameH - l, largura: l, modelo: modelId, miter: 'tl,bl' },
                    { id: id + '_v2', orientacao: 'V', x: 50 + frameW - l, y: 315, comprimento: frameH - l, largura: l, modelo: modelId, miter: 'tr,br' },
                    { id: id + '_h1', orientacao: 'H', x: 50, y: 315, comprimento: frameW, largura: l, modelo: modelId, miter: 'tl,tr' },
                    { id: id + '_h2', orientacao: 'H', x: 50, y: 315 + frameH - l, comprimento: frameW, largura: l, modelo: modelId, miter: 'bl,br' },
                ]
            });
        }
        dlg.remove();
        this._refreshCanaletasList(cabId);
        this._recalcularLayout();
    },

    _adicionarPecaRetaCanaleta(cabId, editCan = null) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cfg = this._getCanaletaTarget(eq, cabId);
        if (!cfg.canaletas) cfg.canaletas = [];

        const modelos = this._getModelosCanaleta();
        const editModelo = editCan ? editCan.modelo : null;
        const opts = modelos.map(m => `<option value="${m.id}" ${editModelo === m.id ? 'selected' : ''}>${m.id} (${m.largura}x${m.altura}mm)</option>`).join('');

        const isEdit = !!editCan;
        const title = isEdit ? 'Editar Peça Reta de Canaleta' : 'Adicionar Peça Reta de Canaleta';
        const btnText = isEdit ? 'Salvar' : 'Adicionar';
        const orientV = editCan && editCan.orientacao === 'V';
        const orientH = editCan && editCan.orientacao === 'H';
        const compVal = editCan ? editCan.comprimento : 500;
        const xVal = editCan ? editCan.x : 50;
        const yVal = editCan ? editCan.y : 315;

        const dlg = document.createElement('div');
        dlg.id = '_can_lin_dlg';
        dlg.dataset.cabId = cabId || '';
        if (isEdit) dlg.dataset.editId = editCan.id;
        dlg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999;display:flex;justify-content:center;align-items:center;';
        dlg.innerHTML = `
            <div style="background:white;border-radius:12px;padding:24px;max-width:480px;width:90%;">
                <h3 style="margin:0 0 16px;">${title}</h3>
                <div class="form-group"><label class="form-label">Modelo</label><select id="can_lin_model" class="form-control">${opts}</select></div>
                <div style="display:flex;gap:12px;">
                    <div class="form-group" style="flex:1;"><label class="form-label">Orientação</label><select id="can_lin_orient" class="form-control"><option value="V" ${orientV ? 'selected' : ''}>Vertical</option><option value="H" ${orientH ? 'selected' : ''}>Horizontal</option></select></div>
                    <div class="form-group" style="flex:1;"><label class="form-label">Comprimento (mm)</label><input type="number" id="can_lin_comp" class="form-control" value="${compVal}" min="50"></div>
                </div>
                <div style="display:flex;gap:12px;">
                    <div class="form-group" style="flex:1;"><label class="form-label">Posição X (mm)</label><input type="number" id="can_lin_x" class="form-control" value="${xVal}" min="0"></div>
                    <div class="form-group" style="flex:1;"><label class="form-label">Posição Y (mm)</label><input type="number" id="can_lin_y" class="form-control" value="${yVal}" min="300"></div>
                </div>
                <div style="font-size:11px;color:#64748b;margin:4px 0 16px;">Posição relativa ao canto superior esquerdo do armário.</div>
                <div style="display:flex;justify-content:flex-end;gap:8px;">
                    <button class="btn btn-cancel" onclick="this.closest('#_can_lin_dlg').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.propostaTecnicaModule._confirmPecaRetaCanaleta()">${btnText}</button>
                </div>
            </div>`;
        document.body.appendChild(dlg);
    },

    _confirmPecaRetaCanaleta() {
        const dlg = document.getElementById('_can_lin_dlg');
        if (!dlg) return;
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const cabId = dlg.dataset.cabId;
        const cfg = this._getCanaletaTarget(eq, cabId);
        if (!cfg.canaletas) cfg.canaletas = [];

        const modelId = document.getElementById('can_lin_model')?.value;
        const orient = document.getElementById('can_lin_orient')?.value || 'V';
        const comp = parseInt(document.getElementById('can_lin_comp')?.value) || 500;
        const px = parseInt(document.getElementById('can_lin_x')?.value) || 0;
        const py = parseInt(document.getElementById('can_lin_y')?.value) || 300;
        const modelo = this._getModelosCanaleta().find(m => m.id === modelId);
        if (!modelo) { dlg.remove(); return; }

        const editId = dlg.dataset.editId || null;
        if (editId) {
            const idx = cfg.canaletas.findIndex(c => c.id === editId);
            if (idx === -1) { dlg.remove(); return; }
            cfg.canaletas[idx] = {
                ...cfg.canaletas[idx],
                modelo: modelId,
                largura_base: modelo.largura,
                profundidade: modelo.altura,
                orientacao: orient,
                x: px, y: py,
                comprimento: comp
            };
        } else {
            cfg.canaletas.push({
                id: 'can_' + Date.now(), tipo: 'linear', modelo: modelId,
                largura_base: modelo.largura, profundidade: modelo.altura,
                orientacao: orient, x: px, y: py, comprimento: comp
            });
        }
        dlg.remove();
        this._refreshCanaletasList(cabId);
        this._recalcularLayout();
    },

    _removerCanaleta(canId, cabId) {
        console.log('[Remover] canId:', canId, 'cabId:', cabId, 'idx:', this.activeEquipmentIndex);
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        console.log('[Remover] eq:', !!eq);
        if (!eq) return;
        const target = this._getCanaletaTarget(eq, cabId);
        console.log('[Remover] target:', !!target, 'canaletas:', target?.canaletas?.length);
        console.log('[Remover] IDs no target.canaletas:', (target?.canaletas || []).map(c => c.id));
        if (!target || !target.canaletas) return;
        console.log('[Remover] removing:', target.canaletas.some(c => c.id === canId));
        target.canaletas = target.canaletas.filter(c => c.id !== canId);
        const overlay = document.getElementById('_layout_config_overlay');
        if (overlay) overlay.remove();
        this._recalcularLayout();
    },

    _adicionarArmario() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};

        const seg = eq.technical?.segregacao || '';
        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const isKitFrame = this._isForma34KitFrame(seg, eq.technical?.fabricante);
        const defaultHeight = isForma2 ? 2300 : (parseInt(eq.technical?.alturaPainel) || 2200) + 100;
        const alturaOptions = [1600, 1800, 2000, 2300].map(h =>
            `<option value="${h}" ${h === defaultHeight ? 'selected' : ''}>${h} mm</option>`
        ).join('');

        const currentCCW = 300;
        const existingCount = Object.keys(layoutConfig.cabinetAssignments).length;
        const defaultNome = isKitFrame ? 'Coluna ' + String(existingCount + 1).padStart(2, '0') : 'Novo Armário';

        const dlg = document.createElement('div');
        dlg.id = '_armario_add_dlg';
        dlg.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999;display:flex;justify-content:center;align-items:center;';
        dlg.innerHTML = `
            <div style="background:white;border-radius:12px;padding:24px;max-width:400px;width:90%;">
                <h3 style="margin:0 0 16px;">Adicionar Armário</h3>
                <div class="form-group"><label class="form-label">Nome do Armário</label><input type="text" id="arm_add_nome" class="form-control" value="${defaultNome}" style="font-size:13px;"></div>
                ${isKitFrame ? `
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Altura</label>
                    <div style="font-size:13px;padding:6px 0;color:#475569;font-weight:600;">2300 mm</div>
                </div>
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Coluna de Cabos (mm)</label>
                    <select id="arm_add_ccw" class="form-control" style="font-size:13px;">
                        <option value="200" ${currentCCW === 200 ? 'selected' : ''}>200 mm</option>
                        <option value="300" ${currentCCW === 300 ? 'selected' : ''}>300 mm</option>
                        <option value="400" ${currentCCW === 400 ? 'selected' : ''}>400 mm</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Profundidade (mm)</label>
                    <select id="arm_add_profundidade" class="form-control" style="font-size:13px;">
                        <option value="600" selected>600 mm</option>
                        <option value="800">800 mm</option>
                    </select>
                </div>
                ` : `
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Altura (mm)</label>
                    <select id="arm_add_altura" class="form-control" style="font-size:13px;">
                        ${isForma2 ? `<option value="2300" selected>2300 mm</option>` : alturaOptions}
                    </select>
                </div>
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Largura (mm)</label>
                    <select id="arm_add_largura" class="form-control" style="font-size:13px;">
                        <option value="400">400 mm</option>
                        <option value="600" selected>600 mm</option>
                        <option value="800">800 mm</option>
                        <option value="1000">1000 mm</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top:12px;"><label class="form-label">Profundidade (mm)</label>
                    <select id="arm_add_profundidade" class="form-control" style="font-size:13px;">
                        <option value="400">400 mm</option>
                        <option value="600" selected>600 mm</option>
                        <option value="800">800 mm</option>
                        <option value="1000">1000 mm</option>
                        <option value="1200">1200 mm</option>
                    </select>
                </div>
                `}
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">
                    <button class="btn btn-cancel" onclick="this.closest('#_armario_add_dlg').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.propostaTecnicaModule._confirmAdicionarArmario()">Adicionar</button>
                </div>
            </div>`;
        document.body.appendChild(dlg);
    },

    _confirmAdicionarArmario() {
        const dlg = document.getElementById('_armario_add_dlg');
        if (!dlg) return;
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const seg = eq.technical?.segregacao || '';
        const isKitFrame = this._isForma34KitFrame(seg, eq.technical?.fabricante);

        const nome = document.getElementById('arm_add_nome')?.value?.trim() || 'Armário';
        const depth = parseInt(document.getElementById('arm_add_profundidade')?.value) || 600;
        const cabId = 'cab_' + Date.now();
        const cabConfig = JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()));

        let height, width;
        if (isKitFrame) {
            height = 2300;
            const ccw = parseInt(document.getElementById('arm_add_ccw')?.value) || 200;
            width = 600 + ccw;
            cabConfig.colunaCabosWidth = ccw;
            if (eq.layoutConfig) eq.layoutConfig.colunaCabosWidth = ccw;
        } else {
            height = parseInt(document.getElementById('arm_add_altura')?.value) || 2300;
            width = parseInt(document.getElementById('arm_add_largura')?.value) || 600;
        }

        layoutConfig.cabinetAssignments[cabId] = {
            name: nome, height, width, depth, assigned: {},
            faces: {
                front: { assigned: {}, loads: {}, layoutConfig: null },
                rear: { assigned: {}, loads: {}, layoutConfig: null }
            },
            layoutConfig: cabConfig
        };
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        dlg.remove();

        const configOverlay = document.getElementById('_layout_config_overlay');
        const wasInConfigMode = !!configOverlay;
        if (wasInConfigMode) configOverlay.remove();

        this._recalcularLayout();
        this.renderSubTab();

        if (wasInConfigMode) this._showLayoutConfigPanel();
    },

    _removerArmario(cabId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig;
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig?.cabinetAssignments?.[actualCabId]) return;
        const cabName = layoutConfig.cabinetAssignments[actualCabId].name || actualCabId;
        if (!confirm(`Remover armário "${cabName}"? Os materiais alocados voltam para a lista disponível.`)) return;
        delete layoutConfig.cabinetAssignments[actualCabId];
        if (Object.keys(layoutConfig.cabinetAssignments).length === 0) {
            delete layoutConfig.cabinetAssignments;
        }
        this._recalcularLayout();
        this.renderSubTab();
    },

    _setLarguraArmario(cabId, width) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig.cabinetAssignments[actualCabId]) return;
        layoutConfig.cabinetAssignments[actualCabId].width = parseInt(width) || 600;
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setAlturaArmario(cabId, height) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig.cabinetAssignments[actualCabId]) return;
        layoutConfig.cabinetAssignments[actualCabId].height = parseInt(height) || 2300;
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setProfundidadeArmario(cabId, depth) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig.cabinetAssignments[actualCabId]) return;
        layoutConfig.cabinetAssignments[actualCabId].depth = parseInt(depth) || 600;
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setNomeArmario(cabId, nome) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};
        const parts = cabId ? cabId.split('|') : [];
        const actualCabId = parts[0];
        if (!layoutConfig.cabinetAssignments[actualCabId]) return;
        layoutConfig.cabinetAssignments[actualCabId].name = nome || 'Armário';
        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _getLayoutLinhas(layoutConfig, categoria) {
        const cat = (categoria || '').toUpperCase();
        const linhas = layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas;
        for (const linha of linhas) {
            if (linha.categorias.some(c => cat.includes(c))) return linha;
        }
        return null;
    },

    _getLinhaParaItem(layoutConfig, categoria, item, lineItemCount) {
        const cat = (categoria || '').toUpperCase();
        const linhas = layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas;

        if (item && item._linhaId) {
            const found = linhas.find(l => l.id === item._linhaId);
            if (found) return found;
        }

        const matching = [];
        for (const linha of linhas) {
            if (linha.categorias.some(c => cat.includes(c))) {
                matching.push(linha);
            }
        }

        if (matching.length === 0) return null;
        if (matching.length === 1) return matching[0];

        let best = matching[0];
        let bestCount = lineItemCount ? (lineItemCount[best.id] || 0) : 0;
        for (let i = 1; i < matching.length; i++) {
            const count = lineItemCount ? (lineItemCount[matching[i].id] || 0) : 0;
            if (count < bestCount) {
                best = matching[i];
                bestCount = count;
            }
        }
        return best;
    },

    _getGapTermico(layoutConfig, categoria) {
        const defaults = this._getDefaultLayoutConfig().gapsTermicos;
        const gaps = { ...defaults, ...(layoutConfig?.gapsTermicos || {}) };
        const cat = (categoria || '').toUpperCase();
        if (gaps[cat] !== undefined) return gaps[cat];
        const entries = Object.entries(gaps).sort((a, b) => b[0].length - a[0].length);
        for (const [key, val] of entries) {
            if (cat.includes(key)) return val;
        }
        return gaps['Outros'] || 5;
    },

    _simulateMinWidth(items, layoutConfig) {
        if (!items || items.length === 0) return 0;
        const cfg = layoutConfig || this._getDefaultLayoutConfig();
        const linhas = cfg.linhas || [];

        const grouped = {};
        for (const linha of linhas) grouped[linha.id] = [];
        grouped.__outros = [];

        const lineItemCount = {};
        for (const item of items) {
            const linha = this._getLinhaParaItem(cfg, item.category, item, lineItemCount);
            grouped[linha ? linha.id : '__outros'].push(item);
            if (linha) {
                lineItemCount[linha.id] = (lineItemCount[linha.id] || 0) + (item.qtd || 1);
            }
        }

        let maxUsed = 0;
        for (const key of [...Object.keys(grouped)]) {
            const grp = grouped[key];
            if (!grp || grp.length === 0) continue;
            const localRows = [];
            let cur = { usedWidth: 0, items: [] };
            for (const item of grp) {
                const iw = item.w || this._getDefaultDimension(item.category, 'w');
                const gap = this._getGapTermico(cfg, item.category);
                const qtd = item.qtd || 1;
                for (let i = 0; i < qtd; i++) {
                    const addGap = cur.items.length > 0 ? gap : 0;
                    if (cur.usedWidth + addGap + iw > 9999 && cur.items.length > 0) {
                        maxUsed = Math.max(maxUsed, cur.usedWidth);
                        localRows.push(cur);
                        cur = { usedWidth: 0, items: [] };
                    }
                    cur.items.push(1);
                    cur.usedWidth += (cur.items.length > 1 ? gap : 0) + iw;
                }
            }
            if (cur.items.length > 0) maxUsed = Math.max(maxUsed, cur.usedWidth);
        }
        return Math.ceil(maxUsed + (cfg.canaletaEsq || 0) + (cfg.canaletaDir || 0));
    },

    suggestLayout(eq, face) {
        const tipicos = store.getState().tipicos || [];
        const materiais = store.getState().materiais || [];
        const loads = eq.loads || [];

        const loadsWithTipico = loads.filter(l => l.typicalId);
        if (loadsWithTipico.length === 0) return { cabinets: [], hasLoads: false };

        const materialBuckets = {};
        const matToTypical = {};
        for (const load of loadsWithTipico) {
            const typical = tipicos.find(t => t.id === load.typicalId);
            if (!typical || !typical.items) continue;
            for (const item of typical.items) {
                const material = materiais.find(m => m.id === item.materialId);
                if (!material) continue;
                const w = parseFloat(material.largura_mm) || 0;
                const h = parseFloat(material.altura_mm) || 0;
                const d = parseFloat(material.profundidade_mm) || 0;
                if (w === 0 && h === 0 && d === 0) continue;

                if (!materialBuckets[material.id]) {
                    materialBuckets[material.id] = { material, totalQtd: 0, loadTags: new Set(), typicals: {} };
                }
                materialBuckets[material.id].totalQtd += item.qtd || 1;
                materialBuckets[material.id].loadTags.add(load.tag || '-');
                if (!materialBuckets[material.id].typicals[typical.id]) {
                    materialBuckets[material.id].typicals[typical.id] = { nome: typical.nome || typical.nomeTipo || typical.id, qtd: 0 };
                }
                materialBuckets[material.id].typicals[typical.id].qtd += item.qtd || 1;
            }
        }

        const buckets = Object.values(materialBuckets);
        if (buckets.length === 0) return { cabinets: [], hasLoads: false };

        const STANDARD_WIDTHS = [400, 600, 800, 1000];
        const getStdWidth = tw => { for (const sw of STANDARD_WIDTHS) { if (tw <= sw) return sw; } return 1000; };
        const baseLayoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();

        const cabinets = [];
        let totalCalculatedWidth = 0;
        let totalSuggestedWidth = 0;
        const isRear = face === 'rear';
        const suf = isRear ? 'T' : 'F';

        const assignments = baseLayoutConfig.cabinetAssignments;
        let cabIdx = 0;
        if (assignments && Object.keys(assignments).length > 0) {
            for (const [cabId, cabData] of Object.entries(assignments)) {
                cabIdx++;
                const items = [];
                let maxD = 0;
                const parent = face ? cabData.faces?.[face] : cabData;
                // Merge loads and legacy assigned (deduplicate: skip matIds already in loads)
                const mergedSource = {};
                const loadsMatIds = new Set();
                if (parent?.loads) {
                    for (const mats of Object.values(parent.loads)) {
                        for (const [matId, ass] of Object.entries(mats || {})) {
                            loadsMatIds.add(matId);
                            if (!mergedSource[matId]) mergedSource[matId] = { qtd: 0 };
                            mergedSource[matId].qtd += ass.qtd || 0;
                            if (ass.linhaId) mergedSource[matId].linhaId = ass.linhaId;
                            if (ass.xOffset !== undefined) mergedSource[matId].xOffset = ass.xOffset;
                            if (ass.zOffset !== undefined) mergedSource[matId].zOffset = ass.zOffset;
                            if (ass.linhaSplit) mergedSource[matId].linhaSplit = ass.linhaSplit;
                            if (ass.porta) mergedSource[matId].porta = true;
                            if (ass.portaLinhaId) mergedSource[matId].portaLinhaId = ass.portaLinhaId;
                        }
                    }
                }
                if (parent?.assigned) {
                    for (const [matId, ass] of Object.entries(parent.assigned)) {
                        if (loadsMatIds.has(matId)) continue;
                        if (!mergedSource[matId]) mergedSource[matId] = { qtd: 0 };
                        mergedSource[matId].qtd += ass.qtd || 0;
                        if (ass.linhaId && !mergedSource[matId].linhaId) mergedSource[matId].linhaId = ass.linhaId;
                        if (ass.xOffset !== undefined && mergedSource[matId].xOffset === undefined) mergedSource[matId].xOffset = ass.xOffset;
                        if (ass.zOffset !== undefined && mergedSource[matId].zOffset === undefined) mergedSource[matId].zOffset = ass.zOffset;
                        if (ass.linhaSplit && !mergedSource[matId].linhaSplit) mergedSource[matId].linhaSplit = ass.linhaSplit;
                        if (ass.porta && !mergedSource[matId].porta) mergedSource[matId].porta = true;
                        if (ass.portaLinhaId && !mergedSource[matId].portaLinhaId) mergedSource[matId].portaLinhaId = ass.portaLinhaId;
                    }
                }
                const cabDoorItems = [];
                for (const [matId, ass] of Object.entries(mergedSource)) {
                    const bucket = materialBuckets[matId];
                    if (!bucket) continue;
                    const m = bucket.material;
                    const cat = m.categoria || 'Outros';
                    const w = parseFloat(m.largura_mm) || 0;
                    const h = parseFloat(m.altura_mm) || 0;
                    const d = parseFloat(m.profundidade_mm) || 0;
                    if (d > maxD) maxD = d;
                    const qtd = ass.qtd || 0;
                    const isPorta = ass.porta === true;
                    if (qtd > 0 && w > 0 && h > 0) {
                        if (ass.linhaSplit && ass.linhaSplit.length > 0) {
                            for (const split of ass.linhaSplit) {
                                if (split.qtd > 0) {
                                    const item = {
                                        desc: m.descricao || m.codigoInterno || '-',
                                        qtd: split.qtd, tags: [...(bucket.loadTags || [])].join(', '),
                                        category: cat, w, h, d, color: this._getCategoryColor(cat),
                                        _matId: matId, _zOffset: ass.zOffset,
                                        _linhaId: isPorta ? undefined : split.linhaId,
                                        _porta: isPorta,
                                        _portaLinhaId: isPorta ? (ass.portaLinhaId || split.linhaId) : undefined
                                    };
                                    if (isPorta) cabDoorItems.push(item);
                                    else items.push(item);
                                }
                            }
                        } else {
                            const item = {
                                desc: m.descricao || m.codigoInterno || '-',
                                qtd, tags: [...(bucket.loadTags || [])].join(', '),
                                category: cat, w, h, d, color: this._getCategoryColor(cat),
                                _matId: matId, _zOffset: ass.zOffset,
                                _linhaId: isPorta ? undefined : ass.linhaId,
                                _porta: isPorta,
                                _portaLinhaId: isPorta ? ass.portaLinhaId : undefined
                            };
                            if (isPorta) cabDoorItems.push(item);
                            else items.push(item);
                        }
                    }
                }
                {
                    const faceLayout = face ? cabData.faces?.[face]?.layoutConfig : null;
                    const cabConfig = faceLayout ?? cabData.layoutConfig ?? this._getDefaultLayoutConfig();
                    const calcW = items.length > 0 ? this._simulateMinWidth(items, cabConfig) : 200;
                    const stdW = cabData.width ? getStdWidth(cabData.width) : getStdWidth(calcW);
                    const segregacaoCab = eq.technical?.segregacao || '';
                    const isForma34 = this._isForma34KitFrame(segregacaoCab, eq.technical?.fabricante);
                    const cabPanelH = cabData.height || (isForma34 ? 2300 : ((segregacaoCab === 'Forma 2a' || segregacaoCab === 'Forma 2b') ? 2300 : (parseInt(eq.technical?.alturaPainel) || 2200) + 100));
                    if (isForma34) {
                        const ccw = cabConfig.colunaCabosWidth || 200;
                        const forma34width = 600 + ccw;
                        cabData.width = forma34width;
                        // Build colunas/gavetas for KitFrame
                        const parentForLoads = face ? cabData.faces?.[face] : cabData;
                        const cabLoads = parentForLoads?.loads || {};
                        // Collect loads that have materials assigned to this cabinet
                        const cargaList = (eq.loads || []).filter(l => l.tag && cabLoads[l.tag]);
                        const reserveCombo = cabData._reserveCombo || (face ? cabData.faces?.[face]?._reserveCombo : null);
                        const { colunas, excessLoads } = this._autoStackGavetas(cargaList, cabLoads, cabIdx, cabConfig.gavetaMode || 'sequential', reserveCombo);
                        const gavetasFlat = colunas.flatMap(c => c.gavetas);
                        cabinets.push({ _cabId: cabId, _assignData: cabData, name: cabData.name + suf, layoutConfig: cabConfig, items, doorItems: cabDoorItems, _fabricante: eq.technical?.fabricante, width: forma34width, height: cabPanelH,                     depth: cabData.depth || maxD || 600, calculatedWidth: forma34width, _userWidth: forma34width, _face: face || null, segregacao: segregacaoCab, _gavetas: gavetasFlat, _colunas: colunas, _excessLoads: excessLoads });
                    } else {
                    cabinets.push({ _cabId: cabId, _assignData: cabData, name: cabData.name + suf, layoutConfig: cabConfig, items, doorItems: cabDoorItems, _fabricante: eq.technical?.fabricante, width: stdW, height: cabPanelH,                     depth: cabData.depth || maxD || 600, calculatedWidth: calcW, _userWidth: cabData.width || null, _face: face || null, segregacao: segregacaoCab });
                    }
                    totalCalculatedWidth += calcW;
                    totalSuggestedWidth += stdW;
                }
            }
        } else {
            // Auto-create cabinet for KitFrame when no assignments exist
            const isForma34Auto = this._isForma34KitFrame(eq.technical?.segregacao || '', eq.technical?.fabricante);
            if (isForma34Auto) {
                if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
                if (!eq.layoutConfig.cabinetAssignments) eq.layoutConfig.cabinetAssignments = {};
                const cabId = 'cab_' + Date.now();
                const ccwAuto = 200;
                eq.layoutConfig.cabinetAssignments[cabId] = {
                    name: eq.tag || 'KitFrame',
                    width: 600 + ccwAuto,
                    height: 2300,
                    depth: 600,
                    assigned: {},
                    loads: {},
                    faces: {
                        front: { assigned: {}, loads: {}, layoutConfig: null },
                        rear: { assigned: {}, loads: {}, layoutConfig: null }
                    },
                    layoutConfig: JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()))
                };
                // Assign all loads to the cabinet
                const parent = eq.layoutConfig.cabinetAssignments[cabId];
                for (const load of loadsWithTipico) {
                    if (!load.tag) continue;
                    if (!parent.loads[load.tag]) parent.loads[load.tag] = {};
                    for (const bucket of Object.values(materialBuckets)) {
                        if (bucket.loadTags.has(load.tag)) {
                            const matId = bucket.material.id;
                            if (!parent.loads[load.tag][matId]) parent.loads[load.tag][matId] = { qtd: 0 };
                            parent.loads[load.tag][matId].qtd += bucket.totalQtd;
                            if (!parent.assigned[matId]) parent.assigned[matId] = { qtd: 0, loadIds: [] };
                            parent.assigned[matId].qtd += bucket.totalQtd;
                            if (!parent.assigned[matId].loadIds.includes(load.tag)) parent.assigned[matId].loadIds.push(load.tag);
                        }
                    }
                }
                // Re-run the assignments loop
                const newAssignments = eq.layoutConfig.cabinetAssignments;
                if (newAssignments && Object.keys(newAssignments).length > 0) {
                    for (const [cabId2, cabData2] of Object.entries(newAssignments)) {
                        const items2 = [];
                        let maxD2 = 0;
                        const parent2 = face ? cabData2.faces?.[face] : cabData2;
                        const mergedSource2 = {};
                        const loadsMatIds2 = new Set();
                        if (parent2?.loads) {
                            for (const mats of Object.values(parent2.loads)) {
                                for (const [matId, ass] of Object.entries(mats || {})) {
                                    loadsMatIds2.add(matId);
                                    if (!mergedSource2[matId]) mergedSource2[matId] = { qtd: 0 };
                                    mergedSource2[matId].qtd += ass.qtd || 0;
                                }
                            }
                        }
                        if (parent2?.assigned) {
                            for (const [matId, ass] of Object.entries(parent2.assigned)) {
                                if (loadsMatIds2.has(matId)) continue;
                                if (!mergedSource2[matId]) mergedSource2[matId] = { qtd: 0 };
                                mergedSource2[matId].qtd += ass.qtd || 0;
                            }
                        }
                        for (const [matId, ass] of Object.entries(mergedSource2)) {
                            const bucket = materialBuckets[matId];
                            if (!bucket) continue;
                            const m = bucket.material;
                            const cat = m.categoria || 'Outros';
                            const w = parseFloat(m.largura_mm) || 0;
                            const h2 = parseFloat(m.altura_mm) || 0;
                            const d = parseFloat(m.profundidade_mm) || 0;
                            if (d > maxD2) maxD2 = d;
                            const qtd = ass.qtd || 0;
                            if (qtd > 0 && w > 0 && h2 > 0) {
                                items2.push({ desc: m.descricao || m.codigoInterno || '-', qtd, tags: [...(bucket.loadTags || [])].join(', '), category: cat, w, h: h2, d, color: this._getCategoryColor(cat), _matId: matId });
                            }
                        }
                        const cabConfig2 = cabData2.layoutConfig || this._getDefaultLayoutConfig();
                        const forma34width2 = 600 + ccwAuto;
                        const cabPanelHAuto = 2300;
                        const parentForLoadsAuto = face ? cabData2.faces?.[face] : cabData2;
                        const cabLoadsAuto = parentForLoadsAuto?.loads || {};
                        const cargaListAuto = (eq.loads || []).filter(l => l.tag && cabLoadsAuto[l.tag]);
                        const reserveComboAuto = cabData2._reserveCombo || (face ? cabData2.faces?.[face]?._reserveCombo : null);
                        const { colunas: colunasAuto, excessLoads: excessLoadsAuto } = this._autoStackGavetas(cargaListAuto, cabLoadsAuto, 1, cabConfig2.gavetaMode || 'sequential', reserveComboAuto);
                        const gavetasFlatAuto = colunasAuto.flatMap(c => c.gavetas);
                        cabinets.push({ _cabId: cabId2, _assignData: cabData2, name: (cabData2.name || cabId2) + suf, layoutConfig: cabConfig2, items: items2, doorItems: [], _fabricante: eq.technical?.fabricante, width: forma34width2, height: cabPanelHAuto, depth: cabData2.depth || maxD2 || 600, calculatedWidth: forma34width2, _userWidth: forma34width2, _face: face || null, segregacao: eq.technical?.segregacao || '', _gavetas: gavetasFlatAuto, _colunas: colunasAuto, _excessLoads: excessLoadsAuto });
                        totalCalculatedWidth += forma34width2;
                        totalSuggestedWidth += forma34width2;
                    }
                }
            } else {
                return { cabinets: [], hasLoads: true };
            }
        }

        if (isRear) cabinets.reverse();

        for (const cab of cabinets) {
            const isCabForma34 = this._isForma34KitFrame(cab.segregacao, cab._fabricante);
            if (!isCabForma34) {
                cab.rows = this._layoutCabinetRows(cab);
                cab.doorRows = this._layoutDoorRows(cab);
            }
        }

        return { cabinets, totalCalculatedWidth, totalSuggestedWidth, hasLoads: true };
    },

    _suggestAutomationLayout(eq) {
        const io = eq.ioList || { racks: [] };
        const hasRacks = io.racks && io.racks.length > 0 && io.racks.some(r => (r.slots || []).length > 0);
        if (!hasRacks) return { cabinets: [], hasLoads: false };

        const bomResult = deriveMaterials(io);
        const materiais = store.getState().materiais || [];

        const items = [];
        for (const bomItem of bomResult.items) {
            if (!bomItem.materialId) continue;
            const mat = materiais.find(m => m.id === bomItem.materialId);
            if (!mat) continue;
            const w = parseFloat(mat.largura_mm) || 0;
            const h = parseFloat(mat.altura_mm) || 0;
            const d = parseFloat(mat.profundidade_mm) || 0;
            if (w === 0 && h === 0) continue;
            const catBlacklist = ['Cabos', 'Eletrodutos', 'Canaletas', 'Conectores'];
            if (catBlacklist.includes(bomItem.categoria)) continue;
            const existing = items.find(it => it._matId === bomItem.materialId);
            if (existing) {
                existing.qtd += bomItem.qtd;
            } else {
                items.push({
                    desc: mat.descricao || bomItem.descricao,
                    qtd: bomItem.qtd,
                    category: bomItem.categoria,
                    w, h, d,
                    color: this._getCategoryColor(bomItem.categoria),
                    _matId: bomItem.materialId
                });
            }
        }

        if (items.length === 0) return { cabinets: [], hasLoads: false };

        if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
        if (!eq.layoutConfig.cabinetAssignments || Object.keys(eq.layoutConfig.cabinetAssignments).length === 0) {
            const cabId = 'cab_auto';
            eq.layoutConfig.cabinetAssignments = {
                [cabId]: {
                    name: eq.tag || 'PLC',
                    width: 600,
                    depth: 600,
                    assigned: {},
                    faces: {
                        front: { assigned: {}, loads: {}, layoutConfig: null },
                        rear: { assigned: {}, loads: {}, layoutConfig: null }
                    },
                    layoutConfig: JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()))
                }
            };
        }

        const STANDARD_WIDTHS = [400, 600, 800, 1000];
        const getStdWidth = tw => { for (const sw of STANDARD_WIDTHS) { if (tw <= sw) return sw; } return 1000; };

        const cabinets = [];
        let totalCalculatedWidth = 0;
        let totalSuggestedWidth = 0;

        for (const [cabId, cabData] of Object.entries(eq.layoutConfig.cabinetAssignments)) {
            const cabConfig = cabData.layoutConfig || this._getDefaultLayoutConfig();
            const calcW = this._simulateMinWidth(items, cabConfig);
            const stdW = cabData.width ? getStdWidth(cabData.width) : getStdWidth(calcW);
            const seg = eq.technical?.segregacao || '';
            const panelH = parseInt(eq.technical?.alturaPainel) || 2200;
            const cabPanelH = cabData.height || ((seg === 'Forma 2a' || seg === 'Forma 2b') ? 2300 : panelH + 100);
            const maxD = items.reduce((m, it) => Math.max(m, it.d || 0), 600);

            cabinets.push({
                _cabId: cabId,
                _assignData: cabData,
                name: (cabData.name || cabId) + 'F',
                layoutConfig: cabConfig,
                items: [...items].map(it => ({ ...it, _zOffset: cabData.assigned?.[it._matId]?.zOffset ?? undefined })),
                doorItems: [],
                width: stdW,
                height: cabPanelH,
                depth: cabData.depth || maxD || 600,
                calculatedWidth: calcW,
                _userWidth: cabData.width || null,
                _face: null,
                segregacao: seg,
                _isAutomation: true
            });

            totalCalculatedWidth += calcW;
            totalSuggestedWidth += stdW;
        }

        for (const cab of cabinets) {
            cab.rows = this._layoutCabinetRows(cab);
            cab.doorRows = this._layoutDoorRows(cab);
        }

        return { cabinets, totalCalculatedWidth, totalSuggestedWidth, hasLoads: true };
    },

    _renderAutomationLayout(eq) {
        const validForms = ['Forma 1', 'Forma 2a', 'Forma 2b', 'Forma 3a', 'Forma 3b', 'Forma 4a', 'Forma 4b'];
        const seg = eq.technical?.segregacao;
        if (!seg || !validForms.includes(seg)) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Layout não disponível</div>
                <div style="font-size:13px;margin-top:6px;">Selecione uma Forma de Segregação na Ficha Técnica.</div>
            </div>`;
        }

        const fabricanteAE = eq.technical?.fabricante || 'Genérico';
        if (this._isForma34(seg) && fabricanteAE !== 'KitFrame') {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-frame-corners" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Layout não disponível para este fabricante</div>
                <div style="font-size:13px;margin-top:6px;">Para Formas <strong>3a, 3b, 4a, 4b</strong>, selecione <strong>KitFrame</strong> como Fabricante na Ficha Técnica.</div>
            </div>`;
        }

        const montagem = eq.technical?.montagem || 'Em Linha';

        const result = this._suggestAutomationLayout(eq);

        if (!result.hasLoads) {
            return `<div style="text-align:center;padding:60px 40px;color:#94a3b8;">
                <i class="ph ph-list-bullets" style="font-size:48px;opacity:0.2;margin-bottom:10px;"></i>
                <br>
                <div style="font-weight:700;font-size:16px;color:#64748b;">Nenhum material da Lista de Materiais</div>
                <div style="font-size:13px;margin-top:6px;">Configure a Lista de I/O e certifique-se de que os materiais possuem dimensões no catálogo.</div>
            </div>`;
        }

        const { cabinets } = result;

        if (cabinets.length === 0) {
            return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px;">
                        <div>
                            <h4 style="margin:0;color:#1e3a8a;font-size:18px;">Layout Sugerido: ${eq.tag}</h4>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Distribuição física dos armários com base na Lista de Materiais</div>
                        </div>
                    </div>
                    <div style="text-align:center;padding:40px 40px;background:white;border-radius:12px;border:2px dashed #cbd5e1;margin-bottom:20px;">
                        <i class="ph ph-frame-corners" style="font-size:48px;color:#94a3b8;opacity:0.3;margin-bottom:12px;"></i>
                        <div style="font-size:16px;font-weight:700;color:#64748b;margin-bottom:16px;">Nenhum armário definido</div>
                        <button class="btn btn-primary" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:13px;padding:8px 20px;">
                            + Criar Armário
                        </button>
                    </div>
                </div>
            </div>`;
        }

        const formatGrouped = (arr, prop, unit) => {
            const counts = {};
            for (const c of arr) {
                const v = c[prop] || 600;
                counts[v] = (counts[v] || 0) + 1;
            }
            return Object.entries(counts)
                .sort(([a], [b]) => b - a)
                .map(([v, n]) => n > 1 ? `${n}×${v}${unit}` : `${v}${unit}`)
                .join(', ');
        };
        const summaryCards = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Armários</div>
                    <div style="font-size:28px;font-weight:800;color:#1e3a8a;margin-top:4px;">${cabinets.length}</div>
                </div>
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Larguras Instaladas</div>
                    <div style="font-size:18px;font-weight:800;color:#16a34a;margin-top:4px;">${formatGrouped(cabinets, 'width', 'mm')}</div>
                </div>
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Altura Instalada</div>
                    <div style="font-size:18px;font-weight:800;color:#1e3a8a;margin-top:4px;">${formatGrouped(cabinets, 'height', 'mm')}</div>
                </div>
                <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;padding:16px;text-align:center;">
                    <div style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Profundidade Instalada</div>
                    <div style="font-size:18px;font-weight:800;color:#1e3a8a;margin-top:4px;">${formatGrouped(cabinets, 'depth', 'mm')}</div>
                </div>
            </div>
        `;

        const offscreen = document.createElement('canvas');
        this._drawLayoutCanvas(offscreen, cabinets);
        const dataUrl = offscreen.toDataURL('image/png');

        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const hasExternalViewAE = isForma2 || seg === 'Forma 1';
        let dataUrlExt = '';
        if (hasExternalViewAE) {
            const offscreenExt = document.createElement('canvas');
            this._drawLayoutCanvasExternal(offscreenExt, cabinets);
            dataUrlExt = offscreenExt.toDataURL('image/png');
        }

        const warnings = cabinets.filter(c => c.warning).map(c => `
            <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#92400e;">
                <strong>${c.name}:</strong> ${c.warning}
            </div>
        `).join('');

        const externalViewHtml = hasExternalViewAE ? `
                        <div style="margin-top:24px;">
                            <h5 style="margin:0 0 8px;color:#7c3aed;font-size:14px;font-weight:700;">▸ VISTA FRONTAL EXTERNA</h5>
                            <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px solid #7c3aed;">
                                <img id="layout-canvas-external" src="${dataUrlExt}" style="display:block;margin:0 auto;" alt="Vista Frontal Externa">
                            </div>
                        </div>` : '';

        return `
            <div style="animation:fadeIn 0.3s ease;padding:20px;">
                <div style="max-width:100%;">
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:15px;margin-bottom:20px;">
                        <div>
                            <h4 style="margin:0;color:#1e3a8a;font-size:18px;">Layout Sugerido: ${eq.tag}</h4>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Distribuição física dos armários com base nos materiais da Lista de Materiais</div>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                            <button type="button" class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._showLayoutConfigPanel()" style="gap:4px;">
                                <i class="ph ph-gear"></i> Configurar
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutPDF()" style="gap:4px;">
                                <i class="ph ph-file-pdf"></i> Exportar PDF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutDXF()" style="gap:4px;">
                                <i class="ph ph-file"></i> Exportar DXF
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._exportLayoutQET()" style="gap:4px;">
                                <i class="ph ph-lightning"></i> Exportar QET
                            </button>
                            <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;user-select:none;margin-left:4px;">
                                <input type="checkbox" id="chk_side_view" onchange="window.propostaTecnicaModule._toggleSideView()" ${eq.layoutConfig?.showSideView ? 'checked' : ''}> Vista Lateral
                            </label>
                        </div>
                    </div>
                    ${summaryCards}
                    ${warnings}
                    <div style="background:white;border-radius:12px;overflow:auto;padding:16px;">
                        <img id="layout-canvas" src="${dataUrl}" style="display:block;margin:0 auto;" alt="Layout Sugerido">
                        <div style="text-align:center;margin-top:12px;font-size:13px;font-weight:700;color:#64748b;letter-spacing:2px;">LAYOUT ORIENTATIVO</div>
                    </div>
                    ${externalViewHtml}
                    <div id="side-view-container" style="display:${eq.layoutConfig?.showSideView ? 'block' : 'none'};margin-top:20px;">
                        <div style="display:flex;align-items:center;gap:12px;margin:0 0 8px;">
                            <h5 style="margin:0;color:#7c3aed;font-size:14px;font-weight:700;">▸ VISTA LATERAL (CORTE)</h5>
                            <select id="sel_side_view_cabinet" onchange="window.propostaTecnicaModule._onChangeSideViewCabinet()" style="font-size:12px;padding:3px 6px;border:1px solid #cbd5e1;border-radius:4px;">
                                <option value="-1" ${(eq.layoutConfig?.sideViewCabinetIndex ?? -1) === -1 ? 'selected' : ''}>Todos (Combinado)</option>
                                ${cabinets.map((c, i) => `<option value="${i}" ${eq.layoutConfig?.sideViewCabinetIndex === i ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div style="background:white;border-radius:12px;overflow:auto;padding:16px;border:2px solid #7c3aed;">
                            <img id="layout-canvas-side" style="display:block;margin:0 auto;" alt="Vista Lateral">
                        </div>
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;justify-content:center;">
                        ${baseCabs.map(bc => {
                            const cabH = bc.height || ((isForma2) ? 2300 : (parseInt(eq.technical?.alturaPainel) || 2200) + 100);
                            return `<div style="display:flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:12px;">
                                <span style="font-weight:600;color:#1e3a8a;">${bc.name}</span>
                                <span style="color:#94a3b8;">|</span>
                                <span style="color:#64748b;">Largura:</span>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._setLarguraArmario('${bc.id}',this.value)">
                                    <option value="400" ${bc.width === 400 ? 'selected' : ''}>400mm</option>
                                    <option value="600" ${bc.width === 600 ? 'selected' : ''}>600mm</option>
                                    <option value="800" ${bc.width === 800 ? 'selected' : ''}>800mm</option>
                                    <option value="1000" ${bc.width === 1000 ? 'selected' : ''}>1000mm</option>
                                </select>
                                ${!isForma2 ? `<span style="color:#94a3b8;">|</span>
                                <span style="color:#64748b;">Altura:</span>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._setAlturaArmario('${bc.id}',this.value)">
                                    <option value="1600" ${cabH === 1600 ? 'selected' : ''}>1600mm</option>
                                    <option value="1800" ${cabH === 1800 ? 'selected' : ''}>1800mm</option>
                                    <option value="2000" ${cabH === 2000 ? 'selected' : ''}>2000mm</option>
                                    <option value="2300" ${cabH === 2300 ? 'selected' : ''}>2300mm</option>
                                </select>` : ''}
                                <span style="color:#94a3b8;">|</span>
                                <span style="color:#64748b;">Profundidade:</span>
                                <select style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;"
                                    onchange="window.propostaTecnicaModule._setProfundidadeArmario('${bc.id}',this.value)">
                                    <option value="400" ${(bc.depth || 600) === 400 ? 'selected' : ''}>400mm</option>
                                    <option value="600" ${(bc.depth || 600) === 600 ? 'selected' : ''}>600mm</option>
                                    <option value="800" ${(bc.depth || 600) === 800 ? 'selected' : ''}>800mm</option>
                                    <option value="1000" ${(bc.depth || 600) === 1000 ? 'selected' : ''}>1000mm</option>
                                    <option value="1200" ${(bc.depth || 600) === 1200 ? 'selected' : ''}>1200mm</option>
                                </select>
                                <button class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._removerArmario('${bc.id}')" style="color:#ef4444;font-size:11px;padding:2px 4px;" title="Remover armário">✕</button>
                            </div>`;
                        }).join('')}
                        <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._adicionarArmario()" style="font-size:11px;padding:6px 10px;">+ Adicionar Armário</button>
                    </div>
                    ${(() => {
                        const arvoreAuto = this._geraArvoreAutomacao(eq);
                        const totalMats = Object.values(arvoreAuto).reduce((s, tip) => s + Object.keys(tip.materiais).length, 0);
                        const bomHtml = this._renderBOMAlocacao(arvoreAuto, cabinets, montagem);
                        return `<div style="margin-top:16px;background:white;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
                            <div onclick="const e=document.getElementById('bom_body_automacao');const v=e.style.display;e.style.display=v==='none'?'':'none';this.querySelector('.bom-arrow').textContent=v==='none'?'▼':'▶'" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;cursor:pointer;background:#f8fafc;border-bottom:1px solid #e2e8f0;user-select:none;">
                                <div style="display:flex;align-items:center;gap:8px;">
                                    <span class="bom-arrow" style="font-size:10px;">▶</span>
                                    <strong style="font-size:14px;">Lista de Materiais (${totalMats} itens)</strong>
                                </div>
                                <span style="font-size:11px;color:#64748b;">Aloque materiais aos armários expandindo cada carga</span>
                            </div>
                            <div id="bom_body_automacao" style="display:none;padding:16px;">
                                ${bomHtml}
                            </div>
                        </div>`;
                    })()}
                </div>
            </div>`;
    },

    _geraArvoreMateriais(eq) {
        const tipicos = store.getState().tipicos || [];
        const materiais = store.getState().materiais || [];
        const loads = eq.loads || [];
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();

        const loadsWithTipico = loads.filter(l => l.typicalId);
        const arvore = {};

        for (const load of loadsWithTipico) {
            const typical = tipicos.find(t => t.id === load.typicalId);
            if (!typical || !typical.items) continue;
            const loadKey = load.id || load.tag || 'load_' + Math.random().toString(36).slice(2, 8);
            const tipName = typical.nome || typical.nomeTipo || 'Típico';
            arvore[loadKey] = {
                nome: `${load.tag || '?'} - ${load.desc || 'Sem descrição'} (${tipName})`,
                loadTag: load.tag || '',
                loadDesc: load.desc || '',
                typicalNome: tipName,
                typicalId: typical.id,
                materiais: {}
            };
            for (const item of typical.items) {
                const material = materiais.find(m => m.id === item.materialId);
                if (!material) continue;
                const w = parseFloat(material.largura_mm) || 0;
                const h = parseFloat(material.altura_mm) || 0;
                if (w === 0 && h === 0) continue;
                const matId = material.id;
                if (!arvore[loadKey].materiais[matId]) {
                    arvore[loadKey].materiais[matId] = {
                        desc: material.descricao || material.codigoInterno || '-',
                        categoria: material.categoria || 'Outros',
                        w, h, qtdTotal: 0, alocado: {}
                    };
                }
                arvore[loadKey].materiais[matId].qtdTotal += item.qtd || 1;
            }
            if (Object.keys(arvore[loadKey].materiais).length === 0) delete arvore[loadKey];
        }

        const canaletas = layoutConfig.canaletas || [];
        if (canaletas.length > 0) {
            arvore.__canaletas = { nome: 'Canaletas', materiais: {} };
            const consumo = this._calcularConsumoCanaletas(canaletas);
            const barrasPorModelo = {};
            for (const can of canaletas) {
                const key = can.modelo || '50x50';
                if (!barrasPorModelo[key]) barrasPorModelo[key] = { qtd: 0, comprimento: 0 };
                if (can.tipo === 'quadro' && can.segmentos) {
                    for (const seg of can.segmentos) {
                        barrasPorModelo[key].comprimento += seg.comprimento || 0;
                    }
                } else {
                    barrasPorModelo[key].comprimento += can.comprimento || 0;
                }
            }
            for (const [modelo, dados] of Object.entries(barrasPorModelo)) {
                const barras = Math.ceil(dados.comprimento / 2000);
                dados.qtd = barras;
                const matId = '__canaleta_' + modelo;
                arvore.__canaletas.materiais[matId] = {
                    desc: `Canaleta ${modelo} — barra 2000mm`,
                    categoria: 'Canaleta',
                    w: 0, h: 0, qtdTotal: barras,
                    alocado: {},
                    _consumo: dados.comprimento,
                    _barras: barras,
                    _sobra: Math.max(0, barras * 2000 - dados.comprimento)
                };
            }
        }

        if (layoutConfig.cabinetAssignments) {
            for (const [cabId, cabData] of Object.entries(layoutConfig.cabinetAssignments)) {
                const faces = cabData.faces || {};

                // Read from new loads-based schema
                const readLoads = (loadsObj, keySuffix) => {
                    if (!loadsObj) return;
                    for (const [loadId, mats] of Object.entries(loadsObj)) {
                        for (const [matId, ass] of Object.entries(mats || {})) {
                            const key = cabId + (keySuffix || '');
                            if (arvore[loadId]?.materiais?.[matId]) {
                                arvore[loadId].materiais[matId].alocado[key] = (arvore[loadId].materiais[matId].alocado[key] || 0) + (ass.qtd || 0);
                            }
                        }
                    }
                };
                readLoads(cabData.loads, '');
                readLoads(faces.front?.loads, '|front');
                readLoads(faces.rear?.loads, '|rear');

                // Build set of already-handled matIds from loads schema
                const handledMatIds = new Set();
                const collectMatIds = (loadsObj) => {
                    if (!loadsObj) return;
                    for (const mats of Object.values(loadsObj)) {
                        for (const matId of Object.keys(mats || {})) handledMatIds.add(matId);
                    }
                };
                collectMatIds(cabData.loads);
                collectMatIds(faces.front?.loads);
                collectMatIds(faces.rear?.loads);

                // Legacy assigned-based (skip if already handled by loads)
                const allSources = [
                    ...Object.entries(cabData.assigned || {}).map(([k, v]) => [k, v, null]),
                    ...Object.entries(faces.front?.assigned || {}).map(([k, v]) => [k, v, 'front']),
                    ...Object.entries(faces.rear?.assigned || {}).map(([k, v]) => [k, v, 'rear'])
                ];
                for (const [matId, ass, face] of allSources) {
                    if (handledMatIds.has(matId)) continue;
                    const key = face ? `${cabId}|${face}` : cabId;
                    for (const loadKey of Object.keys(arvore)) {
                        if (arvore[loadKey]?.materiais?.[matId]) {
                            arvore[loadKey].materiais[matId].alocado[key] = ass.qtd;
                        }
                    }
                }
            }
        }

        return arvore;
    },

    _geraArvoreAutomacao(eq) {
        const materiais = store.getState().materiais || [];
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        const io = eq.ioList || { racks: [] };
        const bomResult = deriveMaterials(io);

        const arvore = {};
        const matMap = {};

        for (const bomItem of bomResult.items) {
            if (!bomItem.materialId) continue;
            const mat = materiais.find(m => m.id === bomItem.materialId);
            if (!mat) continue;
            const w = parseFloat(mat.largura_mm) || 0;
            const h = parseFloat(mat.altura_mm) || 0;
            if (w === 0 && h === 0) continue;
            const catBlacklist = ['Cabos', 'Eletrodutos', 'Canaletas', 'Conectores'];
            if (catBlacklist.includes(bomItem.categoria)) continue;
            if (!matMap[bomItem.materialId]) {
                matMap[bomItem.materialId] = {
                    desc: mat.descricao || bomItem.descricao,
                    categoria: bomItem.categoria || 'Outros',
                    w, h, qtdTotal: 0, alocado: {}
                };
            }
            matMap[bomItem.materialId].qtdTotal += bomItem.qtd;
        }

        if (Object.keys(matMap).length === 0) return arvore;

        arvore['automacao'] = {
            nome: 'Lista de Materiais',
            loadTag: '',
            loadDesc: '',
            materiais: matMap
        };

        if (layoutConfig.cabinetAssignments) {
            for (const [cabId, cabData] of Object.entries(layoutConfig.cabinetAssignments)) {
                const faces = cabData.faces || {};
                const readLoads = (loadsObj, keySuffix) => {
                    if (!loadsObj) return;
                    for (const [loadId, mats] of Object.entries(loadsObj)) {
                        for (const [matId, ass] of Object.entries(mats || {})) {
                            const key = cabId + (keySuffix || '');
                            if (arvore[loadId]?.materiais?.[matId]) {
                                arvore[loadId].materiais[matId].alocado[key] = (arvore[loadId].materiais[matId].alocado[key] || 0) + (ass.qtd || 0);
                            }
                        }
                    }
                };
                readLoads(cabData.loads, '');
                readLoads(faces.front?.loads, '|front');
                readLoads(faces.rear?.loads, '|rear');
                const handledMatIds = new Set();
                const collectMatIds = (loadsObj) => {
                    if (!loadsObj) return;
                    for (const mats of Object.values(loadsObj)) {
                        for (const matId of Object.keys(mats || {})) handledMatIds.add(matId);
                    }
                };
                collectMatIds(cabData.loads);
                collectMatIds(faces.front?.loads);
                collectMatIds(faces.rear?.loads);
                const allSources = [
                    ...Object.entries(cabData.assigned || {}).map(([k, v]) => [k, v, null]),
                    ...Object.entries(faces.front?.assigned || {}).map(([k, v]) => [k, v, 'front']),
                    ...Object.entries(faces.rear?.assigned || {}).map(([k, v]) => [k, v, 'rear'])
                ];
                for (const [matId, ass, face] of allSources) {
                    if (handledMatIds.has(matId)) continue;
                    const key = face ? `${cabId}|${face}` : cabId;
                    for (const loadKey of Object.keys(arvore)) {
                        if (arvore[loadKey]?.materiais?.[matId]) {
                            arvore[loadKey].materiais[matId].alocado[key] = ass.qtd;
                        }
                    }
                }
            }
        }

        return arvore;
    },

    _renderBOMAlocacao(arvore, cabinets, montagem) {
        const tipKeys = Object.keys(arvore);
        if (tipKeys.length === 0) return '<div style="padding:12px;color:#94a3b8;font-size:13px;text-align:center;">Nenhum material encontrado para alocação.</div>';

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        const layoutConfig = eq?.layoutConfig || this._getDefaultLayoutConfig();
        const linhas = layoutConfig.linhas || [];

        const isB2B = montagem === 'Back to Back';
        const cabOptions = cabinets.flatMap(c => {
            const base = c._cabId || c.name;
            if (isB2B) {
                const baseName = c._assignData?.name || c.name.replace(/[FT]$/, '');
                return [
                    `<option value="${base}|front">${baseName}F - Frontal</option>`,
                    `<option value="${base}|rear">${baseName}T - Traseira</option>`
                ];
            }
            return [`<option value="${base}">${c.name}</option>`];
        }).join('');

        const hasLoads = tipKeys.some(k => k !== '__canaletas');
        const loadHtml = tipKeys.filter(k => k !== '__canaletas').map(loadKey => {
            const load = arvore[loadKey];
            const matIds = Object.keys(load.materiais);
            if (matIds.length === 0) return '';

            const alocadoPorMat = matIds.map(matId => Object.values(load.materiais[matId].alocado).reduce((s, v) => s + v, 0));
            const qtdTotalMats = matIds.reduce((s, mId) => s + load.materiais[mId].qtdTotal, 0);
            const alocadoTotalMats = alocadoPorMat.reduce((s, v) => s + v, 0);
            const loadDisp = qtdTotalMats - alocadoTotalMats;
            let statusIcon = alocadoTotalMats === 0 ? '❌' : (loadDisp > 0 ? '⚠️' : '✅');
            let statusText = alocadoTotalMats === 0 ? '0/' + qtdTotalMats : alocadoTotalMats + '/' + qtdTotalMats;

            const matHtml = matIds.map(matId => {
                const m = load.materiais[matId];
                const alocadoTotal = Object.values(m.alocado).reduce((s, v) => s + v, 0);
                const disp = m.qtdTotal - alocadoTotal;
                const alocStr = Object.entries(m.alocado).map(([cabId, qtd]) => {
                    let cabName = cabId;
                    let faceLabel = '';
                    const pi = cabId.indexOf('|');
                    let baseCabId = cabId;
                    let face = null;
                    if (pi > 0) {
                        baseCabId = cabId.slice(0, pi);
                        face = cabId.slice(pi + 1);
                        const match = cabinets.find(c => c._cabId === baseCabId);
                        const baseName = match?._assignData?.name || (match?.name || baseCabId).replace(/[FT]$/, '');
                        cabName = baseName + (face === 'front' ? 'F' : 'T');
                        faceLabel = face === 'front' ? ' - Frontal' : ' - Traseira';
                    } else {
                        const match = cabinets.find(c => (c._cabId || c.name) === cabId);
                        cabName = match?.name || cabId;
                    }
                    let linhaHtml = '';
                    let xInputHtml = '';
                    let alocEntryHtml = '';
                    const matchCab = cabinets.find(c => c._cabId === baseCabId);
                    const isKitFrameCab = matchCab ? this._isForma34KitFrame(matchCab.segregacao, matchCab._fabricante) : false;
                    if (matchCab?._assignData) {
                        const cabLinhas = (matchCab.layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas);
                        const cabDoorLinhas = (matchCab.layoutConfig?.doorLinhas || this._getDefaultLayoutConfig().doorLinhas);
                        const source = face ? matchCab._assignData.faces?.[face]?.loads?.[loadKey] : matchCab._assignData.loads?.[loadKey];
                        const sourceLegacy = face ? matchCab._assignData.faces?.[face]?.assigned : matchCab._assignData.assigned;
                        const matEntry = source?.[matId] || sourceLegacy?.[matId];
                        if (matEntry && !isKitFrameCab) {
                            const isPorta = matEntry.porta === true;
                            const isSplit = matEntry.linhaSplit && matEntry.linhaSplit.length > 0;
                            const linhaOptions = cabLinhas.map(l =>
                                `<option value="${l.id}" ${matEntry.linhaId === l.id ? 'selected' : ''}>${l.nome}</option>`
                            ).join('');
                            const doorLinhaOptions = cabDoorLinhas.map(l =>
                                `<option value="${l.id}" ${matEntry.portaLinhaId === l.id ? 'selected' : ''}>${l.nome}</option>`
                            ).join('');
                            if (!isSplit) {
                                const chkPorta = `
                                    <span style="margin-left:6px;color:#64748b;font-size:11px;font-weight:600;">
                                        <input type="checkbox" ${isPorta ? 'checked' : ''}
                                            onchange="window.propostaTecnicaModule._setPortaMaterial('${matId}','${loadKey}','${cabId}',this.checked)"
                                            style="width:14px;height:14px;cursor:pointer;vertical-align:middle;"> Porta
                                    </span>`;
                                if (isPorta) {
                                    linhaHtml = `
                                        ${chkPorta}
                                        <span style="margin-left:4px;color:#64748b;font-size:11px;font-weight:600;">Faixa:</span>
                                        <select style="font-size:11px;padding:1px 3px;border:1px solid #cbd5e1;border-radius:4px;height:24px;vertical-align:middle;"
                                            onchange="window.propostaTecnicaModule._setPortaLinhaMaterial('${matId}','${loadKey}','${cabId}',this.value)">
                                            <option value="">Auto</option>
                                            ${doorLinhaOptions}
                                        </select>`;
                                } else {
                                    linhaHtml = `
                                        ${chkPorta}
                                        <span style="margin-left:4px;color:#64748b;font-size:11px;font-weight:600;">Linha:</span>
                                        <select style="font-size:11px;padding:1px 3px;border:1px solid #cbd5e1;border-radius:4px;height:24px;vertical-align:middle;"
                                            onchange="window.propostaTecnicaModule._setLinhaMaterial('${matId}','${loadKey}','${cabId}',this.value)">
                                            <option value="">Auto</option>
                                            ${linhaOptions}
                                        </select>
                                        <span style="font-size:10px;color:#94a3b8;cursor:pointer;margin-left:3px;" onclick="window.propostaTecnicaModule._toggleSplitMode('${matId}','${loadKey}','${cabId}')" title="Fracionar entre linhas">[⊕]</span>`;
                                }
                            }
                            const xVal = matEntry.xOffset;
                            const zVal = matEntry.zOffset;
                            xInputHtml = `<span style="margin-left:4px;color:#64748b;font-size:11px;font-weight:600;">X:</span>
                                <input type="number" value="${xVal != null ? xVal : ''}" placeholder="auto"
                                style="width:56px;font-size:12px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;text-align:center;height:26px;"
                                onchange="window.propostaTecnicaModule._setManualX('${matId}','${loadKey}','${cabId}',0,this.value)"
                                onblur="window.propostaTecnicaModule._setManualX('${matId}','${loadKey}','${cabId}',0,this.value)"
                                onkeydown="if(event.key==='Enter'){event.preventDefault();window.propostaTecnicaModule._setManualX('${matId}','${loadKey}','${cabId}',0,this.value)}" title="Posicao X (mm)">
                                <button class="btn btn-xs btn-ghost" style="font-size:11px;padding:1px 5px;height:26px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;cursor:pointer;vertical-align:middle;"
                                onclick="this.previousElementSibling.value='';window.propostaTecnicaModule._setManualX('${matId}','${loadKey}','${cabId}',0,'')" title="Auto">A</button>
                                <span style="margin-left:4px;color:#64748b;font-size:11px;font-weight:600;">Z:</span>
                                <input type="number" value="${zVal != null ? zVal : ''}" placeholder="auto"
                                style="width:56px;font-size:12px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;text-align:center;height:26px;"
                                onchange="window.propostaTecnicaModule._setManualZ('${matId}','${loadKey}','${cabId}',0,this.value)"
                                onblur="window.propostaTecnicaModule._setManualZ('${matId}','${loadKey}','${cabId}',0,this.value)"
                                onkeydown="if(event.key==='Enter'){event.preventDefault();window.propostaTecnicaModule._setManualZ('${matId}','${loadKey}','${cabId}',0,this.value)}" title="Posicao Z (profundidade) - Enter ou sair do campo para aplicar">
                                <button class="btn btn-xs btn-ghost" style="font-size:11px;padding:1px 5px;height:26px;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;cursor:pointer;vertical-align:middle;"
                                onclick="this.previousElementSibling.value='';window.propostaTecnicaModule._setManualZ('${matId}','${loadKey}','${cabId}',0,'')" title="Auto">A</button>`;

                            if (isSplit) {
                                const splitRows = matEntry.linhaSplit.map((entry, ei) => {
                                    const splitLinhaOpts = linhas.map(l =>
                                        `<option value="${l.id}" ${entry.linhaId === l.id ? 'selected' : ''}>${l.nome}</option>`
                                    ).join('');
                                    return `<div style="display:flex;align-items:center;gap:4px;padding:1px 0;">
                                        <input type="number" value="${entry.qtd}" min="1"
                                            style="width:36px;font-size:11px;padding:1px 3px;border:1px solid #cbd5e1;border-radius:4px;text-align:center;height:22px;"
                                            onchange="window.propostaTecnicaModule._updateSplitEntry('${matId}','${loadKey}','${cabId}',${ei},'qtd',this.value)"
                                            onkeydown="if(event.key==='Enter')this.blur()">
                                        <select style="font-size:11px;padding:1px 3px;border:1px solid #cbd5e1;border-radius:4px;height:22px;"
                                            onchange="window.propostaTecnicaModule._updateSplitEntry('${matId}','${loadKey}','${cabId}',${ei},'linhaId',this.value)">
                                            <option value="">Auto</option>
                                            ${splitLinhaOpts}
                                        </select>
                                        <span style="font-size:10px;color:#ef4444;cursor:pointer;padding:0 2px;"
                                            onclick="window.propostaTecnicaModule._removeSplitEntry('${matId}','${loadKey}','${cabId}',${ei})" title="Remover">✕</span>
                                    </div>`;
                                }).join('');
                                const addBtn = `<span style="font-size:10px;color:#3b82f6;cursor:pointer;padding:1px 4px;display:inline-block;"
                                    onclick="window.propostaTecnicaModule._addSplitEntry('${matId}','${loadKey}','${cabId}')">[+]</span>`;
                                alocEntryHtml = `<div style="background:#dbeafe;border-radius:4px;padding:3px 6px;margin:0 2px;font-size:12px;">
                                    <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
                                        <span style="font-weight:600;">${cabName}${faceLabel}:</span>
                                        <span style="font-weight:700;">${qtd}x</span>
                                        <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule._removerMaterial('${cabId}','${matId}','${loadKey}')" style="color:#ef4444;text-decoration:none;margin-left:2px;" title="Remover">&#10005;</a>
                                        <span style="font-size:10px;color:#94a3b8;cursor:pointer;margin-left:3px;" onclick="window.propostaTecnicaModule._toggleSplitMode('${matId}','${loadKey}','${cabId}')" title="Agrupar em uma linha">[⊖]</span>
                                    </div>
                                    <div style="padding-left:4px;">${splitRows}</div>
                                    <div style="padding-left:4px;margin-top:1px;">${addBtn}</div>
                                    <div style="padding-left:4px;margin-top:2px;">${xInputHtml ? `<span style="color:#64748b;font-size:11px;font-weight:600;">X:</span>${xInputHtml}` : ''}</div>
                                </div>`;
                            }
                        }
                    }
                    if (!alocEntryHtml) {
                        alocEntryHtml = `<span style="background:#dbeafe;border-radius:4px;padding:1px 6px;margin:0 2px;font-size:12px;white-space:nowrap;">${cabName}${faceLabel}: ${qtd}x <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule._removerMaterial('${cabId}','${matId}','${loadKey}')" style="color:#ef4444;text-decoration:none;margin-left:4px;" title="Remover">&#10005;</a>${linhaHtml}${xInputHtml || ''}</span>`;
                    }
                    return alocEntryHtml;
                }).join(' ');
                const isManual = alocadoTotal > 0;
                const statusBadge = isManual
                    ? `<span style="display:inline-flex;align-items:center;gap:2px;margin-left:6px;font-size:11px;color:#6366f1;font-weight:600;" title="Alocação manual — o sistema respeita sua posição">🔧 Manual</span>`
                    : `<span style="display:inline-flex;align-items:center;gap:2px;margin-left:6px;font-size:11px;color:#94a3b8;font-weight:600;" title="Alocação automática — pode mudar se as cargas forem alteradas">⚙️ Auto</span>`;
                const extraInfo = `<span style="color:#64748b;margin-left:8px;font-size:11px;">(${m.categoria}, ${m.w}x${m.h}mm)</span>`;
                const selectId = `bom_assign_cab_${loadKey}_${matId}`;
                const qtdId = `bom_assign_qtd_${loadKey}_${matId}`;
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;margin-left:12px;">
                    <div style="flex:1;">
                        <span style="font-weight:500;">${m.desc}</span>
                        ${statusBadge}
                        ${extraInfo}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;white-space:nowrap;">
                        <span style="font-weight:700;color:#1e3a8a;">${m.qtdTotal}x</span>
                        ${disp > 0 ? `
                            <select id="${selectId}" style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;">
                                <option value="">Alocar em...</option>
                                ${cabOptions}
                                <option value="__new__">+ Novo Armário</option>
                            </select>
                            <input type="number" id="${qtdId}" value="${disp}" min="1" max="${disp}" style="width:50px;font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;">
                            <button type="button" class="btn btn-xs btn-primary" onclick="window.propostaTecnicaModule._atribuirMaterial('${matId}','${loadKey}')" style="font-size:11px;">Alocar</button>
                        ` : '<span style="color:#10b981;font-size:11px;">✓</span>'}
                        ${alocStr ? `<div style="display:flex;gap:3px;flex-wrap:wrap;">${alocStr}</div>` : ''}
                    </div>
                </div>`;
            }).join('');

            const loadCabSelId = `bom_load_cab_${loadKey}`;
            const loadInfoHtml = `
                <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#f8fafc;border-radius:4px;margin:4px 8px;">
                    <span style="font-size:12px;font-weight:600;color:#64748b;">Carga toda:</span>
                    ${loadDisp > 0 ? `
                        <select id="${loadCabSelId}" style="font-size:11px;padding:2px 4px;border:1px solid #cbd5e1;border-radius:4px;">
                            <option value="">Alocar em...</option>
                            ${cabOptions}
                            <option value="__new__">+ Novo Armário</option>
                        </select>
                        <button type="button" class="btn btn-xs btn-primary" onclick="window.propostaTecnicaModule._atribuirCarga('${loadKey}')" style="font-size:11px;">Alocar Carga</button>
                    ` : ''}
                    ${alocadoTotalMats > 0 ? `<button type="button" class="btn btn-xs btn-ghost" onclick="window.propostaTecnicaModule._removerCarga('${loadKey}')" style="font-size:11px;color:#ef4444;">Remover Carga</button>` : ''}
                </div>`;

            return `<div class="bom-load-section" style="margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <div class="bom-load-header" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f1f5f9;cursor:pointer;user-select:none;"
                    onclick="const b=this.nextElementSibling;const a=this.querySelector('.bom-arrow');b.style.display=b.style.display==='none'?'':'none';a.textContent=b.style.display==='none'?'▶':'▼'">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="bom-arrow" style="font-size:12px;color:#64748b;">▼</span>
                        <span style="font-weight:700;font-size:13px;color:#1e3a8a;">${load.nome}</span>
                    </div>
                    <div style="font-size:12px;white-space:nowrap;">
                        ${statusIcon} <span style="color:#64748b;">${statusText} itens alocados</span>
                    </div>
                </div>
                <div class="bom-load-body" style="padding:4px 0 8px;">
                    ${loadInfoHtml}
                    <div style="margin-top:4px;">${matHtml}</div>
                </div>
            </div>`;
        }).join('');

        // Canaletas section (unchanged)
        const canalHtml = tipKeys.filter(k => k === '__canaletas').map(tipKey => {
            const tip = arvore[tipKey];
            const matIds = Object.keys(tip.materiais);
            if (matIds.length === 0) return '';
            const matHtml = matIds.map(matId => {
                const m = tip.materiais[matId];
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;">
                    <div style="flex:1;">
                        <span style="font-weight:500;">${m.desc}</span>
                        ${m._consumo ? `<span style="color:#64748b;font-size:11px;margin-left:4px;">(${m._consumo}mm, sobra ${m._sobra}mm)</span>` : ''}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;white-space:nowrap;">
                        <span style="font-weight:700;color:#1e3a8a;">${m.qtdTotal}x</span>
                        <span style="color:#10b981;font-size:11px;">✓ Alocado (layout)</span>
                    </div>
                </div>`;
            }).join('');
            return `<div style="margin-bottom:8px;">
                <div style="font-weight:700;font-size:13px;color:#0e7490;padding:6px 8px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">${tip.nome}</div>
                ${matHtml}
            </div>`;
        }).join('');

        return `
            <div style="margin-top:4px;">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
                    <input type="text" id="bom_filter" placeholder="Filtrar por descrição..." class="form-control" style="font-size:12px;flex:1;" oninput="window.propostaTecnicaModule._filtrarBOM()">
                    <button class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._resetarAlocacoes()" style="font-size:11px;">Resetar Alocações</button>
                </div>
                <div id="bom_tree">${hasLoads ? loadHtml : ''}${canalHtml}</div>
            </div>
        `;
    },

    _ensureLoadTarget(cabData, loadId) {
        if (!cabData.loads) cabData.loads = {};
        if (!cabData.loads[loadId]) cabData.loads[loadId] = {};
        return cabData.loads[loadId];
    },

    _atribuirMaterial(matId, loadId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};

        const sel = document.getElementById('bom_assign_cab_' + loadId + '_' + matId);
        const qtdInput = document.getElementById('bom_assign_qtd_' + loadId + '_' + matId);
        if (!sel || !qtdInput) return;
        const rawId = sel.value;
        const qtd = parseInt(qtdInput.value) || 1;
        if (!rawId) { app.toast('Selecione um armário.', 'warning'); return; }

        let cabId = rawId;
        let face = null;
        const pipeIdx = rawId.indexOf('|');
        if (pipeIdx > 0) { cabId = rawId.slice(0, pipeIdx); face = rawId.slice(pipeIdx + 1); }

        if (cabId === '__new__') {
            cabId = 'cab_' + Date.now();
            const nome = prompt('Nome do novo armário:');
            if (!nome) return;
            layoutConfig.cabinetAssignments[cabId] = { name: nome, loads: {}, assigned: {}, faces: { front: { loads: {}, assigned: {} }, rear: { loads: {}, assigned: {} } } };
        }

        if (!layoutConfig.cabinetAssignments[cabId]) {
            layoutConfig.cabinetAssignments[cabId] = { name: cabId, loads: {}, assigned: {}, faces: { front: { loads: {}, assigned: {} }, rear: { loads: {}, assigned: {} } } };
        }

        const initInLoads = (parent, lId, mId, addedQtd) => {
            if (!parent.loads) parent.loads = {};
            if (!parent.loads[lId]) parent.loads[lId] = {};
            if (!parent.loads[lId][mId]) parent.loads[lId][mId] = { qtd: 0 };
            parent.loads[lId][mId].qtd += addedQtd;
            if (parent.loads[lId][mId].xOffset === undefined) parent.loads[lId][mId].xOffset = null;
            if (parent.loads[lId][mId].zOffset === undefined) parent.loads[lId][mId].zOffset = null;
            // Also update legacy assigned
            if (!parent.assigned) parent.assigned = {};
            if (!parent.assigned[mId]) parent.assigned[mId] = { qtd: 0, loadIds: [] };
            parent.assigned[mId].qtd += addedQtd;
            if (!parent.assigned[mId].loadIds) parent.assigned[mId].loadIds = [];
            if (!parent.assigned[mId].loadIds.includes(lId)) parent.assigned[mId].loadIds.push(lId);
        };

        if (face && layoutConfig.cabinetAssignments[cabId].faces) {
            const faceObj = layoutConfig.cabinetAssignments[cabId].faces[face];
            if (faceObj) {
                initInLoads(faceObj, loadId, matId, qtd);
            }
        } else {
            initInLoads(layoutConfig.cabinetAssignments[cabId], loadId, matId, qtd);
        }

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;

        this._recalcularLayout();
    },

    _atribuirCarga(loadId) {
        const sel = document.getElementById('bom_load_cab_' + loadId);
        if (!sel) return;
        const rawId = sel.value;
        if (!rawId) { app.toast('Selecione um armário.', 'warning'); return; }

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) layoutConfig.cabinetAssignments = {};

        let cabId = rawId;
        let face = null;
        const pipeIdx = rawId.indexOf('|');
        if (pipeIdx > 0) { cabId = rawId.slice(0, pipeIdx); face = rawId.slice(pipeIdx + 1); }

        if (cabId === '__new__') {
            cabId = 'cab_' + Date.now();
            const nome = prompt('Nome do novo armário:');
            if (!nome) return;
            layoutConfig.cabinetAssignments[cabId] = { name: nome, loads: {}, assigned: {}, faces: { front: { loads: {}, assigned: {} }, rear: { loads: {}, assigned: {} } } };
        }
        if (!layoutConfig.cabinetAssignments[cabId]) {
            layoutConfig.cabinetAssignments[cabId] = { name: cabId, loads: {}, assigned: {}, faces: { front: { loads: {}, assigned: {} }, rear: { loads: {}, assigned: {} } } };
        }

        const parent = face
            ? (layoutConfig.cabinetAssignments[cabId].faces[face] || (layoutConfig.cabinetAssignments[cabId].faces[face] = { loads: {}, assigned: {} }))
            : layoutConfig.cabinetAssignments[cabId];
        if (!parent.loads) parent.loads = {};
        if (!parent.assigned) parent.assigned = {};

        // Get the tree to know which materials belong to this load
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        const arvore = isAutomation ? this._geraArvoreAutomacao(eq) : this._geraArvoreMateriais(eq);
        const loadEntry = arvore[loadId];
        if (!loadEntry) return;

        // Allocate ALL materials directly in state, then single re-render
        for (const matId of Object.keys(loadEntry.materiais)) {
            const m = loadEntry.materiais[matId];
            const alocadoTotal = Object.values(m.alocado).reduce((s, v) => s + v, 0);
            const disp = m.qtdTotal - alocadoTotal;
            if (disp > 0) {
                if (!parent.loads[loadId]) parent.loads[loadId] = {};
                if (!parent.loads[loadId][matId]) parent.loads[loadId][matId] = { qtd: 0 };
                parent.loads[loadId][matId].qtd += disp;
                if (parent.loads[loadId][matId].xOffset === undefined) parent.loads[loadId][matId].xOffset = null;
                if (parent.loads[loadId][matId].zOffset === undefined) parent.loads[loadId][matId].zOffset = null;
                if (!parent.assigned[matId]) parent.assigned[matId] = { qtd: 0, loadIds: [] };
                parent.assigned[matId].qtd += disp;
                if (!parent.assigned[matId].loadIds.includes(loadId)) parent.assigned[matId].loadIds.push(loadId);
            }
        }

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;

        this._recalcularLayout();
    },

    _removerMaterial(cabId, matId, loadId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig;
        if (!layoutConfig?.cabinetAssignments) return;

        let realCabId = cabId;
        let face = null;
        const pipeIdx = cabId.indexOf('|');
        if (pipeIdx > 0) { realCabId = cabId.slice(0, pipeIdx); face = cabId.slice(pipeIdx + 1); }

        let cabData = layoutConfig.cabinetAssignments[realCabId];
        if (!cabData) return;

        // Remove from loads schema
        const removeFromLoads = (parent) => {
            if (!parent?.loads?.[loadId]?.[matId]) return false;
            delete parent.loads[loadId][matId];
            if (Object.keys(parent.loads[loadId]).length === 0) delete parent.loads[loadId];
            return true;
        };

        let removed = false;
        if (face) {
            const faceObj = cabData.faces?.[face];
            removed = removeFromLoads(faceObj);
        } else {
            removed = removeFromLoads(cabData);
        }

        // Also clean up legacy assigned
        if (!removed) {
            if (face && cabData.faces?.[face]?.assigned?.[matId]) {
                delete cabData.faces[face].assigned[matId];
                removed = true;
            } else if (cabData.assigned?.[matId]) {
                delete cabData.assigned[matId];
                removed = true;
            }
        }

        if (!removed) return;

        // Rebuild legacy assigned from loads
        this._rebuildLegacyAssigned(cabData);

        // Clean up empty cabinets
        const hasAny = Object.keys(cabData.loads || {}).length > 0
            || Object.keys(cabData.assigned || {}).length > 0
            || Object.values(cabData.faces || {}).some(f =>
                Object.keys(f.loads || {}).length > 0 || Object.keys(f.assigned || {}).length > 0);
        if (!hasAny) {
            delete layoutConfig.cabinetAssignments[realCabId];
        }
        if (Object.keys(layoutConfig.cabinetAssignments).length === 0) {
            delete layoutConfig.cabinetAssignments;
        }
        this._recalcularLayout();
    },

    _removerCarga(loadId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig;
        if (!layoutConfig?.cabinetAssignments) return;

        // Remove this loadId from all cabinets
        for (const [cabId, cabData] of Object.entries(layoutConfig.cabinetAssignments)) {
            const removeKey = (parent) => {
                if (parent?.loads?.[loadId]) {
                    delete parent.loads[loadId];
                }
                // Also remove from legacy assigned where loadIds contains this loadId
                if (parent?.assigned) {
                    for (const [matId, entry] of Object.entries(parent.assigned)) {
                        if (entry.loadIds?.includes(loadId)) {
                            entry.loadIds = entry.loadIds.filter(l => l !== loadId);
                            if (entry.loadIds.length === 0) {
                                delete parent.assigned[matId];
                            }
                        }
                    }
                }
            };
            removeKey(cabData);
            for (const faceKey of ['front', 'rear']) {
                removeKey(cabData.faces?.[faceKey]);
            }
            // Rebuild legacy assigned from loads for this cabinet
            this._rebuildLegacyAssigned(cabData);
        }

        // Clean up empty cabinets
        for (const [cabId, cabData] of Object.entries(layoutConfig.cabinetAssignments)) {
            const hasAny = Object.keys(cabData.loads || {}).length > 0
                || Object.keys(cabData.assigned || {}).length > 0
                || Object.values(cabData.faces || {}).some(f =>
                    Object.keys(f.loads || {}).length > 0 || Object.keys(f.assigned || {}).length > 0);
            if (!hasAny) delete layoutConfig.cabinetAssignments[cabId];
        }
        if (Object.keys(layoutConfig.cabinetAssignments).length === 0) {
            delete layoutConfig.cabinetAssignments;
        }

        this._recalcularLayout();
    },

    _rebuildLegacyAssigned(cabData) {
        if (!cabData) return;
        // Rebuild cabData.assigned from all loads
        const newAssigned = {};
        const collectAssigned = (loadsObj) => {
            if (!loadsObj) return;
            for (const [lId, mats] of Object.entries(loadsObj)) {
                for (const [matId, ass] of Object.entries(mats)) {
                    if (!newAssigned[matId]) newAssigned[matId] = { qtd: 0, loadIds: [] };
                    newAssigned[matId].qtd += ass.qtd || 0;
                    if (!newAssigned[matId].loadIds.includes(lId)) newAssigned[matId].loadIds.push(lId);
                    if (ass.linhaId) newAssigned[matId].linhaId = ass.linhaId;
                    if (ass.xOffset !== undefined) newAssigned[matId].xOffset = ass.xOffset;
                    if (ass.zOffset !== undefined) newAssigned[matId].zOffset = ass.zOffset;
                    if (ass.linhaSplit) newAssigned[matId].linhaSplit = ass.linhaSplit;
                }
            }
        };
        collectAssigned(cabData.loads);
        cabData.assigned = newAssigned;
        // Same for faces
        for (const faceKey of ['front', 'rear']) {
            if (cabData.faces?.[faceKey]) {
                const newFaceAssigned = {};
                collectAssigned(cabData.faces[faceKey].loads);
                cabData.faces[faceKey].assigned = newFaceAssigned;
            }
        }
    },

    _resetarAlocacoes() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (!confirm('Remover todas as alocações manuais e voltar ao agrupamento automático?')) return;
        if (eq.layoutConfig) delete eq.layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _resolveTarget(matId, loadId, cabId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return null;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments) return null;
        const pipeIdx = cabId.indexOf('|');
        if (pipeIdx > 0) {
            const realCabId = cabId.slice(0, pipeIdx);
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[realCabId]?.faces?.[face];
            return parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId] || null;
        }
        const parent = layoutConfig.cabinetAssignments[cabId];
        return parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId] || null;
    },

    _recalcularLayout() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        this._syncLayoutToEnclosures(eq);
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        if (this.activeSubTab === 'layout') {
            this._redrawLayoutCanvas();
            this._recarregarBOM();
        }
    },

    _syncLayoutToEnclosures(eq) {
        if (!eq || !eq.layoutConfig?.cabinetAssignments) return;
        const cabinets = eq.layoutConfig.cabinetAssignments;
        const cabIds = Object.keys(cabinets);
        if (cabIds.length === 0) {
            eq.enclosureItems = [];
            return;
        }
        const ip = eq.technical?.ip || 'IP-42';
        const color = eq.technical?.cor_externa || eq.technical?.cor || 'RAL 7035';
        eq.enclosureItems = cabIds.map((cabId, i) => {
            const cab = cabinets[cabId];
            return {
                col: cab.name || `C${i + 1}`,
                type: eq.type || '',
                dim: `${cab.height || 2200}x${cab.width || 800}x${cab.depth || 600}`,
                ip: ip,
                color: color,
                side: 'Ambos'
            };
        });
    },

    _recarregarBOM() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        const montagem = eq.technical?.montagem || 'Em Linha';
        if (isAutomation) {
            const result = this._suggestAutomationLayout(eq);
            const cabinets = result.cabinets || [];
            const arvore = this._geraArvoreAutomacao(eq);
            const bomHtml = this._renderBOMAlocacao(arvore, cabinets, montagem);
            const bomBody = document.getElementById('bom_body_automacao');
            if (bomBody) bomBody.innerHTML = bomHtml;
            return;
        }
        const isB2B = montagem === 'Back to Back';
        const result = isB2B ? this.suggestLayout(eq, 'front') : this.suggestLayout(eq);
        const cabinets = result.cabinets || [];
        const arvore = this._geraArvoreMateriais(eq);
        const bomHtml = this._renderBOMAlocacao(arvore, cabinets, montagem);
        const bomBody = document.getElementById('bom_body') || document.getElementById('bom_body_empty');
        if (bomBody) {
            bomBody.innerHTML = bomHtml;
        }
    },

    _redrawLayoutCanvas() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        if (isAutomation) {
            const result = this._suggestAutomationLayout(eq);
            const showSide = eq.layoutConfig?.showSideView;
            const c = document.createElement('canvas');
            this._drawLayoutCanvas(c, result.cabinets);
            const img = document.getElementById('layout-canvas');
            if (img) img.src = c.toDataURL('image/png');
            const seg = eq.technical?.segregacao;
            if (seg === 'Forma 1' || seg === 'Forma 2a' || seg === 'Forma 2b') {
                const ce = document.createElement('canvas');
                this._drawLayoutCanvasExternal(ce, result.cabinets);
                const imgExt = document.getElementById('layout-canvas-external');
                if (imgExt) imgExt.src = ce.toDataURL('image/png');
            }
            if (showSide && result.cabinets.length > 0) {
                this._drawSideView(result.cabinets, 'side-view-container', 'layout-canvas-side', eq.layoutConfig?.sideViewCabinetIndex);
            }
            return;
        }
        const isB2B = (eq.technical?.montagem) === 'Back to Back';
        const showSide = eq.layoutConfig?.showSideView;
        if (isB2B) {
            const f = this.suggestLayout(eq, 'front');
            const r = this.suggestLayout(eq, 'rear');
            const cf = document.createElement('canvas');
            this._drawLayoutCanvas(cf, f.cabinets);
            const imgF = document.getElementById('layout-canvas-front');
            if (imgF) imgF.src = cf.toDataURL('image/png');
            const cr = document.createElement('canvas');
            this._drawLayoutCanvas(cr, r.cabinets);
            const imgR = document.getElementById('layout-canvas-rear');
            if (imgR) imgR.src = cr.toDataURL('image/png');
            const seg = eq.technical?.segregacao;
            if (seg === 'Forma 1' || seg === 'Forma 2a' || seg === 'Forma 2b') {
                const cfe = document.createElement('canvas');
                this._drawLayoutCanvasExternal(cfe, f.cabinets);
                const imgFE = document.getElementById('layout-canvas-external-front');
                if (imgFE) imgFE.src = cfe.toDataURL('image/png');
                const cre = document.createElement('canvas');
                this._drawLayoutCanvasExternal(cre, r.cabinets);
                const imgRE = document.getElementById('layout-canvas-external-rear');
                if (imgRE) imgRE.src = cre.toDataURL('image/png');
            }
            if (showSide && f.cabinets.length > 0) {
                this._drawSideView(f.cabinets, 'side-view-container-b2b', 'layout-canvas-side-b2b', eq.layoutConfig?.sideViewCabinetIndex, r.cabinets);
            }
        } else {
            const result = this.suggestLayout(eq);
            const c = document.createElement('canvas');
            this._drawLayoutCanvas(c, result.cabinets);
            const img = document.getElementById('layout-canvas');
            if (img) img.src = c.toDataURL('image/png');
            const seg = eq.technical?.segregacao;
            if (seg === 'Forma 1' || seg === 'Forma 2a' || seg === 'Forma 2b') {
                const ce = document.createElement('canvas');
                this._drawLayoutCanvasExternal(ce, result.cabinets);
                const imgExt = document.getElementById('layout-canvas-external');
                if (imgExt) imgExt.src = ce.toDataURL('image/png');
            }
            if (showSide && result.cabinets.length > 0) {
                this._drawSideView(result.cabinets, 'side-view-container', 'layout-canvas-side', eq.layoutConfig?.sideViewCabinetIndex);
            }
        }
    },

    _onChangeCcwArmario(blockCabId, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const parts = blockCabId ? blockCabId.split('|') : [];
        const cabId = parts[0];
        const cab = eq.layoutConfig?.cabinetAssignments?.[cabId];
        if (!cab) return;
        const ccw = parseInt(value, 10);
        if (!cab.layoutConfig) cab.layoutConfig = this._getDefaultLayoutConfig();
        cab.layoutConfig.colunaCabosWidth = ccw;
        cab.width = 600 + ccw;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); }
        this._redrawLayoutCanvas();
        // Update body text in config block
        const block = document.querySelector(`.cab-config-block[data-cab-id="${blockCabId}"]`);
        if (block) {
            const bodyDiv = block.querySelector('.cab-config-body > div');
            if (bodyDiv) {
                const infoDiv = bodyDiv.querySelector('div:last-child');
                if (infoDiv) {
                    infoDiv.textContent = `KitFrame — 600mm (gavetas) + ${ccw}mm (coluna cabos) = ${600 + ccw}mm × 2300mm`;
                }
            }
        }
    },

    _onChangeGavetaMode(blockCabId, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const parts = blockCabId ? blockCabId.split('|') : [];
        const cabId = parts[0];
        const cab = eq.layoutConfig?.cabinetAssignments?.[cabId];
        if (!cab) return;
        if (!cab.layoutConfig) cab.layoutConfig = this._getDefaultLayoutConfig();
        cab.layoutConfig.gavetaMode = value;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); }
        this._redrawLayoutCanvas();
    },

    async _showReserveSetupDialog(cabinetReserves) {
        return new Promise((resolve) => {
            const existing = document.getElementById('_reserve_setup_dlg');
            if (existing) existing.remove();

            const dlg = document.createElement('div');
            dlg.id = '_reserve_setup_dlg';
            dlg.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';

            dlg.innerHTML = `
                <div style="background:#fff;border-radius:12px;padding:24px;max-width:560px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;">
                    <h3 style="margin:0 0 4px;color:#059669;font-size:16px;">📦 Personalizar Gavetas Reservas</h3>
                    <p style="font-size:13px;color:#475569;margin:0 0 16px;">Escolha a distribuição de gavetas reservas para cada armário:</p>
                    ${cabinetReserves.map(cr => `
                        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-bottom:12px;">
                            <div style="font-weight:600;font-size:14px;color:#166534;margin-bottom:6px;">${cr.cabName} — ${cr.space}mm disponível</div>
                            ${cr.options.map((opt, oi) => {
                                const label = opt.map(h => h + 'mm').join(' + ');
                                return `<label style="display:block;padding:4px 0;font-size:13px;color:#374151;cursor:pointer;">
                                    <input type="radio" name="reserve_${cr.cabIndex}" value="${oi}" ${oi === 0 ? 'checked' : ''} style="margin-right:6px;">
                                    ${label} (${opt.length} gaveta${opt.length > 1 ? 's' : ''})
                                </label>`;
                            }).join('')}
                        </div>
                    `).join('')}
                    <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e2e8f0;padding-top:16px;">
                        <button class="btn btn-sm btn-ghost" id="btn_skip_reserves" style="color:#64748b;">Pular, usar default</button>
                        <button class="btn btn-sm btn-primary" id="btn_apply_reserves" style="background:#059669;border-color:#059669;">✔ Aplicar</button>
                    </div>
                </div>`;

            document.body.appendChild(dlg);

            document.getElementById('btn_apply_reserves').onclick = () => {
                const selections = {};
                cabinetReserves.forEach(cr => {
                    const sel = document.querySelector(`input[name="reserve_${cr.cabIndex}"]:checked`);
                    if (sel) selections[cr.cabIndex] = parseInt(sel.value);
                });
                dlg.remove();
                resolve(selections);
            };

            document.getElementById('btn_skip_reserves').onclick = () => {
                dlg.remove();
                resolve(null);
            };
        });
    },

    async _onCriarArranjoOtimizado() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
        eq.layoutConfig.cabinetAssignments = {};

        const arrangement = this._rebalanceCabinets(this._distributeLoadsAcrossCabinets(eq.loads || []));
        const tipicos = store.getState().tipicos || [];
        const materiais = store.getState().materiais || [];
        const MAX_H = 1800;
        const defaultCCW = 200;
        const cabWidth = 600 + defaultCCW;

        const cabEntries = [];
        for (let i = 0; i < arrangement.length; i++) {
            const group = arrangement[i];
            const cabId = 'cab_' + Date.now() + '_' + i;
            const cabName = 'Coluna ' + (i + 1).toString().padStart(2, '0');

            const cabEntry = {
                name: cabName,
                width: cabWidth,
                height: 2300,
                depth: 600,
                assigned: {},
                loads: {},
                layoutConfig: JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()))
            };
            cabEntry.layoutConfig.colunaCabosWidth = defaultCCW;

            for (const carga of group.loads) {
                if (!carga.tag) continue;
                if (!cabEntry.loads[carga.tag]) cabEntry.loads[carga.tag] = {};
                if (carga.typicalId) {
                    const typical = tipicos.find(t => t.id === carga.typicalId);
                    if (typical?.items) {
                        for (const item of typical.items) {
                            const material = materiais.find(m => m.id === item.materialId);
                            if (!material) continue;
                            const w = parseFloat(material.largura_mm) || 0;
                            const h = parseFloat(material.altura_mm) || 0;
                            const d = parseFloat(material.profundidade_mm) || 0;
                            if (w === 0 && h === 0 && d === 0) continue;
                            const matId = material.id;
                            if (!cabEntry.loads[carga.tag][matId]) cabEntry.loads[carga.tag][matId] = { qtd: 0 };
                            cabEntry.loads[carga.tag][matId].qtd += item.qtd || 1;
                        }
                    }
                }
            }

            cabEntries.push({ cabId, cabEntry, totalHeight: group.totalHeight });
        }

        // Collect reserve spaces for dialog
        const cabReserves = [];
        for (let i = 0; i < cabEntries.length; i++) {
            const { cabEntry, totalHeight } = cabEntries[i];
            const space = MAX_H - totalHeight;
            if (space >= 225) {
                cabReserves.push({
                    cabIndex: i,
                    cabName: cabEntry.name,
                    space,
                    options: this._getReserveOptions(space),
                });
            }
        }

        let selections = null;
        if (cabReserves.length > 0) {
            selections = await this._showReserveSetupDialog(cabReserves);
        }

        // Apply selections
        if (selections) {
            for (const cr of cabReserves) {
                const optIdx = selections[cr.cabIndex];
                if (optIdx !== undefined && cr.options[optIdx]) {
                    cabEntries[cr.cabIndex].cabEntry._reserveCombo = cr.options[optIdx];
                }
            }
        }

        for (const { cabId, cabEntry } of cabEntries) {
            eq.layoutConfig.cabinetAssignments[cabId] = cabEntry;
        }

        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Arranjo] store error:', e); }

        this._redrawLayoutCanvas();
        this._showLayoutConfigPanel();
    },

    _showExcessLoadsDialog(excessLoads) {
        const existing = document.getElementById('_excess_loads_dlg');
        if (existing) existing.remove();

        const dlg = document.createElement('div');
        dlg.id = '_excess_loads_dlg';
        dlg.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        dlg.innerHTML = `
            <div style="background:#fff;border-radius:12px;padding:24px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <h3 style="margin:0 0 8px;color:#dc2626;font-size:16px;">⚠️ Capacidade máxima atingida</h3>
                <p style="font-size:13px;color:#475569;margin:0 0 12px;">${excessLoads.length} carga(s) não puderam ser alocadas:</p>
                <div style="font-size:12px;color:#64748b;margin-bottom:16px;">
                    ${excessLoads.map(l => `<div style="padding:3px 0;">• ${l.tag} - ${l.desc || l.tag} (${this._getDrawerHeight(l)}mm)</div>`).join('')}
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e2e8f0;padding-top:16px;">
                    <button class="btn btn-sm btn-ghost" onclick="this.closest('#_excess_loads_dlg').remove()" style="color:#64748b;">Cancelar</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.propostaTecnicaModule._showLayoutConfigPanel();this.closest('#_excess_loads_dlg').remove()" style="gap:4px;">
                        ⚙️ Abrir Config Layout
                    </button>
                    <button class="btn btn-sm btn-primary" data-excess='${encodeURIComponent(JSON.stringify(excessLoads.map(l => ({ tag: l.tag, desc: l.desc || l.tag, power: l.power, current: l.current }))))}' onclick="window.propostaTecnicaModule._criarNovoArmarioParaExcedentes(JSON.parse(decodeURIComponent(this.dataset.excess)));this.closest('#_excess_loads_dlg').remove()" style="background:#059669;border-color:#059669;gap:4px;">
                        ➕ Criar Novo Armário
                    </button>
                </div>
            </div>`;
        document.body.appendChild(dlg);
    },

    _criarNovoArmarioParaExcedentes(excessLoads) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const seg = eq.technical?.segregacao || '';
        const isKF = this._isForma34KitFrame(seg, eq.technical?.fabricante);
        if (!isKF || !eq.layoutConfig?.cabinetAssignments) return;
        if (!excessLoads || excessLoads.length === 0) return;

        const ass = eq.layoutConfig.cabinetAssignments;
        const tagsToMove = new Set(excessLoads.map(l => l.tag).filter(Boolean));

        // Remove excess load tags from all existing cabinets to prevent duplication
        for (const cab of Object.values(ass)) {
            for (const faceKey of ['front', 'rear']) {
                const face = cab.faces?.[faceKey];
                if (face?.loads) {
                    for (const t of tagsToMove) delete face.loads[t];
                }
            }
            if (cab.loads) {
                for (const t of tagsToMove) delete cab.loads[t];
            }
        }

        // Create a new cabinet for the excess loads
        const cabId = 'cab_' + Date.now();
        const cabCount = Object.keys(ass).length + 1;
        const cabName = 'Coluna ' + cabCount.toString().padStart(2, '0');
        const defaultCCW = 200;
        const cabWidth = 600 + defaultCCW;

        const cabEntry = {
            name: cabName,
            width: cabWidth,
            height: 2300,
            depth: 600,
            assigned: {},
            loads: {},
            layoutConfig: JSON.parse(JSON.stringify(this._getDefaultLayoutConfig()))
        };
        cabEntry.layoutConfig.colunaCabosWidth = defaultCCW;

        for (const carga of excessLoads) {
            if (!carga.tag) continue;
            cabEntry.loads[carga.tag] = {};
        }

        ass[cabId] = cabEntry;

        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[NovoArmario] store error:', e); }

        this._redrawLayoutCanvas();
        this._showLayoutConfigPanel();
    },

    _toggleSideView() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const isB2B = (eq.technical?.montagem) === 'Back to Back';
        const chk = document.getElementById(isB2B ? 'chk_side_view_b2b' : 'chk_side_view');
        if (!chk) return;
        if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
        eq.layoutConfig.showSideView = chk.checked;
        const container = document.getElementById(isB2B ? 'side-view-container-b2b' : 'side-view-container');
        if (container) container.style.display = chk.checked ? 'block' : 'none';
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        if (chk.checked) {
            if (eq.layoutConfig.sideViewCabinetIndex == null) eq.layoutConfig.sideViewCabinetIndex = -1;
            this._redrawLayoutCanvas();
        }
    },

    _onChangeSideViewCabinet(_isRear) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const isB2B = (eq.technical?.montagem) === 'Back to Back';
        const selId = isB2B ? 'sel_side_view_cabinet_b2b' : 'sel_side_view_cabinet';
        const sel = document.getElementById(selId);
        if (!sel) return;
        if (!eq.layoutConfig) eq.layoutConfig = this._getDefaultLayoutConfig();
        eq.layoutConfig.sideViewCabinetIndex = parseInt(sel.value, 10);
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        this._redrawLayoutCanvas();
    },

    _setManualX(matId, loadId, cabId, instanceIdx, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        const pipeIdx = (cabId || '').indexOf('|');
        const baseCabId = pipeIdx > 0 ? cabId.slice(0, pipeIdx) : cabId;
        if (!layoutConfig.cabinetAssignments?.[baseCabId]) return;

        let target = null;
        let realCabId = baseCabId;
        if (pipeIdx > 0) {
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[baseCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        } else {
            const parent = layoutConfig.cabinetAssignments[baseCabId];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        }
        if (!target) return;

        let rawValue = value !== '' && value != null ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : null;

        if (rawValue != null && rawValue > 0 && matId) {
            const cabData = layoutConfig.cabinetAssignments[realCabId];
            const cabWidth = cabData?.width || 600;
            const cabCfg = cabData?.layoutConfig || {};
            const railLen = cabCfg.comprimentoTrilho || (cabWidth - (cabCfg.canaletaEsq || 0) - (cabCfg.canaletaDir || 0));
            const materiais = store.getState().materiais || [];
            const material = materiais.find(m => m.id === matId);
            if (material) {
                const iw = parseFloat(material.largura_mm) || 50;
                const gap = this._getGapTermico(cabCfg, material.categoria || '');
                const qtd = target.linhaSplit?.length
                    ? Math.max(...target.linhaSplit.map(s => s.qtd))
                    : (target.qtd || 1);
                const totalItemWidth = qtd * iw + Math.max(0, qtd - 1) * gap;
                const maxX = Math.max(0, railLen - totalItemWidth);
                if (rawValue > maxX) {
                    rawValue = Math.round(maxX);
                    if (typeof app?.toast === 'function') app.toast(`X ajustado para ${rawValue}mm (limite do trilho)`, 'info');
                }
            }
        }

        target.xOffset = rawValue;

        // Sync to assigned (layout renderer reads from assigned, not loads)
        const cabData = layoutConfig.cabinetAssignments[realCabId];
        const assignedParent = pipeIdx > 0 ? cabData?.faces?.[cabId.slice(pipeIdx + 1)] : cabData;
        if (assignedParent) {
            if (!assignedParent.assigned) assignedParent.assigned = {};
            if (!assignedParent.assigned[matId]) assignedParent.assigned[matId] = { qtd: 0, loadIds: [] };
            assignedParent.assigned[matId].xOffset = rawValue;
        }

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        const _idx = this.activeEquipmentIndex;
        const _eqs = [...(data.equipments || [])];
        _eqs[_idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: _eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        this._redrawLayoutCanvas();
    },

    _setManualZ(matId, loadId, cabId, instanceIdx, value) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        const pipeIdx = (cabId || '').indexOf('|');
        const baseCabId = pipeIdx > 0 ? cabId.slice(0, pipeIdx) : cabId;
        if (!layoutConfig.cabinetAssignments?.[baseCabId]) return;

        let target = null;
        let realCabId = baseCabId;
        let parent = null;
        if (pipeIdx > 0) {
            const face = cabId.slice(pipeIdx + 1);
            parent = layoutConfig.cabinetAssignments[baseCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        } else {
            parent = layoutConfig.cabinetAssignments[baseCabId];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        }
        if (!target) return;

        let rawValue = value !== '' && value != null ? parseFloat(String(value).replace(/[^\d.-]/g, '')) : null;

        if (rawValue != null && rawValue > 0 && matId) {
            const rawDepth = parent?.depth || layoutConfig.cabinetAssignments[baseCabId]?.depth || 600;
            const cabDepth = rawDepth;
            const material = (store.getState().materiais || []).find(m => m.id === matId);
            if (material) {
                const id = parseFloat(material.profundidade_mm) || 50;
                const maxZ = Math.max(0, cabDepth - id);
                if (rawValue > maxZ) {
                    rawValue = Math.round(maxZ);
                    if (typeof app?.toast === 'function') app.toast(`Z ajustado para ${rawValue}mm (limite de profundidade do armário: ${cabDepth}mm)`, 'info');
                }
            }
        }

        target.zOffset = rawValue;

        const cabData = layoutConfig.cabinetAssignments[realCabId];
        const assignedParent = pipeIdx > 0 ? cabData?.faces?.[cabId.slice(pipeIdx + 1)] : cabData;
        if (assignedParent) {
            if (!assignedParent.assigned) assignedParent.assigned = {};
            if (!assignedParent.assigned[matId]) assignedParent.assigned[matId] = { qtd: 0, loadIds: [] };
            assignedParent.assigned[matId].zOffset = rawValue;
        }

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        const _idx = this.activeEquipmentIndex;
        const _eqs = [...(data.equipments || [])];
        _eqs[_idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: _eqs } }); } catch (e) { console.warn('[Layout] store notify error:', e); if (typeof app?.toast === 'function') app.toast('Erro ao salvar configuração do layout', 'error'); }
        this._redrawLayoutCanvas();
    },

    _setLinhaMaterial(matId, loadId, cabId, linhaId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments?.[cabId]) return;

        let realCabId = cabId;
        const pipeIdx = cabId.indexOf('|');
        let target = null;
        if (pipeIdx > 0) {
            realCabId = cabId.slice(0, pipeIdx);
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[realCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        } else {
            const parent = layoutConfig.cabinetAssignments[cabId];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        }
        if (!target) return;

        target.linhaId = linhaId || undefined;

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setPortaMaterial(matId, loadId, cabId, porta) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments?.[cabId]) return;

        let realCabId = cabId;
        const pipeIdx = cabId.indexOf('|');
        let target = null;
        if (pipeIdx > 0) {
            realCabId = cabId.slice(0, pipeIdx);
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[realCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        } else {
            const parent = layoutConfig.cabinetAssignments[cabId];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        }
        if (!target) return;

        target.porta = porta;
        if (!porta) {
            target.portaLinhaId = undefined;
        }

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _setPortaLinhaMaterial(matId, loadId, cabId, portaLinhaId) {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const layoutConfig = eq.layoutConfig || this._getDefaultLayoutConfig();
        if (!layoutConfig.cabinetAssignments?.[cabId]) return;

        let realCabId = cabId;
        const pipeIdx = cabId.indexOf('|');
        let target = null;
        if (pipeIdx > 0) {
            realCabId = cabId.slice(0, pipeIdx);
            const face = cabId.slice(pipeIdx + 1);
            const parent = layoutConfig.cabinetAssignments[realCabId]?.faces?.[face];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        } else {
            const parent = layoutConfig.cabinetAssignments[cabId];
            target = parent?.loads?.[loadId]?.[matId] || parent?.assigned?.[matId];
        }
        if (!target) return;

        target.portaLinhaId = portaLinhaId || undefined;

        if (!eq.layoutConfig) eq.layoutConfig = layoutConfig;
        else eq.layoutConfig.cabinetAssignments = layoutConfig.cabinetAssignments;
        this._recalcularLayout();
    },

    _saveEq() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const idx = this.activeEquipmentIndex;
        const eqs = [...(data.equipments || [])];
        eqs[idx] = eq;
        try { store.setState({ activeTechnicalProposal: { ...data, equipments: eqs } }); } catch (e) {}
        if (this.activeSubTab === 'layout') this.renderSubTab();
    },

    _toggleSplitMode(matId, loadId, cabId) {
        const target = this._resolveTarget(matId, loadId, cabId);
        if (!target) return;

        if (target.linhaSplit && target.linhaSplit.length > 0) {
            const firstSplit = target.linhaSplit[0];
            target.linhaId = firstSplit?.linhaId || target.linhaId || undefined;
            delete target.linhaSplit;
        } else {
            const data = store.getState().activeTechnicalProposal;
            const eq = data?.equipments?.[this.activeEquipmentIndex];
            const layoutConfig = eq?.layoutConfig || this._getDefaultLayoutConfig();
            const realCabId = cabId.includes('|') ? cabId.slice(0, cabId.indexOf('|')) : cabId;
            const cabLines = layoutConfig.cabinetAssignments?.[realCabId]?.layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas;
            const firstLinhaId = target.linhaId || cabLines[0]?.id || '';
            const other = cabLines.filter(l => l.id !== firstLinhaId);
            const qtd1 = Math.ceil(target.qtd / 2);
            const qtd2 = target.qtd - qtd1;
            target.linhaSplit = [{ linhaId: firstLinhaId, qtd: qtd1 }];
            if (other.length > 0 && qtd2 > 0) {
                target.linhaSplit.push({ linhaId: other[0].id, qtd: qtd2 });
            }
        }
        this._saveEq();
    },

    _addSplitEntry(matId, loadId, cabId) {
        const target = this._resolveTarget(matId, loadId, cabId);
        if (!target) return;
        if (!target.linhaSplit) target.linhaSplit = [];

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        const layoutConfig = eq?.layoutConfig || this._getDefaultLayoutConfig();
        const realCabId = cabId.includes('|') ? cabId.slice(0, cabId.indexOf('|')) : cabId;
        const cabLines = layoutConfig.cabinetAssignments?.[realCabId]?.layoutConfig?.linhas || this._getDefaultLayoutConfig().linhas;
        const usedLines = target.linhaSplit.map(s => s.linhaId);
        const available = cabLines.filter(l => !usedLines.includes(l.id));
        const nextLine = available.length > 0 ? available[0].id : (cabLines[0]?.id || '');
        target.linhaSplit.push({ linhaId: nextLine, qtd: 0 });
        this._saveEq();
    },

    _removeSplitEntry(matId, loadId, cabId, index) {
        const target = this._resolveTarget(matId, loadId, cabId);
        if (!target || !target.linhaSplit) return;
        target.linhaSplit.splice(index, 1);
        if (target.linhaSplit.length === 0) delete target.linhaSplit;
        this._saveEq();
    },

    _updateSplitEntry(matId, loadId, cabId, index, field, value) {
        const target = this._resolveTarget(matId, loadId, cabId);
        if (!target || !target.linhaSplit) return;
        if (index < 0 || index >= target.linhaSplit.length) return;

        if (field === 'qtd') {
            target.linhaSplit[index].qtd = Math.max(0, parseInt(value) || 0);
        } else if (field === 'linhaId') {
            target.linhaSplit[index].linhaId = value || undefined;
        }
        this._saveEq();
    },

    _filtrarBOM() {
        const filter = (document.getElementById('bom_filter')?.value || '').toLowerCase();
        const items = document.querySelectorAll('#bom_tree > div.bom-load-section');
        items.forEach(div => {
            const header = div.querySelector('.bom-load-header');
            const text = header ? header.textContent.toLowerCase() : div.textContent.toLowerCase();
            div.style.display = text.includes(filter) ? '' : 'none';
        });
    },

    _getCategoryColor(category) {
        const cat = (category || '').toUpperCase();
        if (cat.includes('DISJUNTOR')) return '#ef4444';
        if (cat.includes('CONTATOR')) return '#3b82f6';
        if (cat.includes('INVERSOR') || cat.includes('SOFT-STARTER') || cat.includes('SOFT STARTER')) return '#f59e0b';
        if (cat.includes('RELÉ') || cat.includes('RELE')) return '#8b5cf6';
        if (cat.includes('BORNE')) return '#10b981';
        if (cat.includes('FONTE')) return '#ec4899';
        if (cat.includes('PLC') || cat.includes('MODULO') || cat.includes('MÓDULO')) return '#06b6d4';
        if (cat.includes('CABO')) return '#84cc16';
        return '#64748b';
    },

    _getDefaultDimension(category, dim) {
        const cat = (category || '').toUpperCase();
        const defaults = {
            'DISJUNTOR': { w: 36, h: 80 },
            'DISJUNTOR MOTOR': { w: 45, h: 90 },
            'CONTATOR': { w: 45, h: 80 },
            'INVERSOR': { w: 100, h: 200 },
            'SOFT-STARTER': { w: 70, h: 150 },
            'RELÉ': { w: 22, h: 80 },
            'RELE': { w: 22, h: 80 },
            'BORNE': { w: 6, h: 45 },
            'FONTE': { w: 60, h: 100 },
        };
        for (const [key, vals] of Object.entries(defaults)) {
            if (cat.includes(key)) return dim === 'w' ? vals.w : vals.h;
        }
        return dim === 'w' ? 50 : 80;
    },

    _layoutCabinetRows(cab) {
        const rows = [];
        const warnings = [];
        const layoutConfig = cab.layoutConfig || this._getDefaultLayoutConfig();
        const cabWidth = cab.width - layoutConfig.canaletaEsq - layoutConfig.canaletaDir;
        const railLen = (layoutConfig.comprimentoTrilho || 0) > 0 ? layoutConfig.comprimentoTrilho : cabWidth;
        const leftMargin = layoutConfig.canaletaEsq;
        const assignData = cab._assignData;
        const assignedSource = assignData && cab._face
            ? (assignData.faces?.[cab._face]?.assigned || {})
            : (assignData?.assigned || {});


        const grouped = {};
        for (const linha of layoutConfig.linhas) {
            grouped[linha.id] = [];
        }
        grouped.__outros = [];

        const lineItemCount = {};
        for (const item of cab.items) {
            if (item._porta) continue;
            const linha = this._getLinhaParaItem(layoutConfig, item.category, item, lineItemCount);
            const key = linha ? linha.id : '__outros';
            grouped[key].push(item);
            if (linha) {
                lineItemCount[linha.id] = (lineItemCount[linha.id] || 0) + (item.qtd || 1);
            }
        }

        const getYC = l => l.yCentroTrilho ?? Math.round(((l.yInicio || 0) + (l.yFim || 0)) / 2);

        const packLinhaRow = (items, linhaObj) => {
            if (items.length === 0) return null;
            const yCentro = getYC(linhaObj);
            const trilhoAlt = layoutConfig.larguraTrilhoDIN || 35;

            const sorted = [...items].sort((a, b) => {
                const ha = a.h || this._getDefaultDimension(a.category, 'h');
                const hb = b.h || this._getDefaultDimension(b.category, 'h');
                if (hb !== ha) return hb - ha;
                const wa = a.w || this._getDefaultDimension(a.category, 'w');
                const wb = b.w || this._getDefaultDimension(b.category, 'w');
                return wb - wa;
            });

            const rowItems = [];
            let usedWidth = 0;
            let rowHeight = 0;

            for (const item of sorted) {
                const iw = item.w || this._getDefaultDimension(item.category, 'w');
                const ih = item.h || this._getDefaultDimension(item.category, 'h');
                const gap = this._getGapTermico(layoutConfig, item.category);
                const qtd = item.qtd || 1;


                for (let qi = 0; qi < qtd; qi++) {
                    if (rowItems.length > 0) usedWidth += gap;
                    rowItems.push({
                        desc: item.desc, qtd: 1,
                        x: usedWidth + leftMargin, y: 0, z: 0,
                        w: iw, h: ih, d: item.d || 0, color: item.color, category: item.category,
                        _matId: item._matId, _instanceIdx: qi, _zOffset: item._zOffset
                    });
                    usedWidth += iw;
                    rowHeight = Math.max(rowHeight, ih);
                }
            }

            // Check natural overflow BEFORE applying xOffset
            const railEnd = leftMargin + railLen;
            let overflow = false;
            for (const it of rowItems) {
                if (it.x + it.w - 0.01 > railEnd) { overflow = true; break; }
            }
            // Clamp natural overflow (items too wide to fit in rail)
            if (overflow) {
                const maxRight = Math.max(...rowItems.map(it => it.x + it.w));
                const excess = maxRight - railEnd;
                if (excess > 0) {
                    for (const it of rowItems) {
                        it.x = Math.max(leftMargin, it.x - excess);
                    }
                }
            }

            // Apply manual X offset AFTER clamping (user override is preserved)
            for (const it of rowItems) {
                if (it._matId && assignedSource[it._matId]?.xOffset != null) {
                    it.x += assignedSource[it._matId].xOffset;
                }
            }
            rowItems.sort((a, b) => a.x - b.x);

            // Check final overflow for warning only (do NOT clamp user's manual offset)
            overflow = false;
            for (const it of rowItems) {
                if (it.x + it.w - 0.01 > railEnd) { overflow = true; break; }
            }
            for (let i = 1; i < rowItems.length; i++) {
                if (rowItems[i].x + 0.01 < rowItems[i - 1].x + rowItems[i - 1].w) { overflow = true; break; }
            }

            for (const it of rowItems) {
                it.y = yCentro - (it.h || this._getDefaultDimension(it.category, 'h')) / 2;
            }

            return {
                row: {
                    y: yCentro - trilhoAlt / 2,
                    rowHeight: Math.max(rowHeight || 45, 30),
                    items: rowItems, usedWidth,
                    linha: linhaObj,
                    trilho: linhaObj.temTrilho !== false
                        ? { y: yCentro - trilhoAlt / 2, h: trilhoAlt, w: railLen, x: leftMargin }
                        : null
                },
                overflow
            };
        };

        for (const linha of layoutConfig.linhas) {
            const items = grouped[linha.id] || [];
            if (items.length === 0) continue;
            const result = packLinhaRow(items, linha);
            if (result) {
                result.row.linha = linha;
                rows.push(result.row);
                if (result.overflow) {
                    warnings.push(`${linha.nome}: largura insuficiente no trilho (${railLen}mm). Crie outra linha ou aumente a largura do armário.`);
                }
            }
        }

        const outros = grouped.__outros || [];
        if (outros.length > 0) {
            const lastLinha = layoutConfig.linhas[layoutConfig.linhas.length - 1];
            const yCentro = lastLinha ? getYC(lastLinha) + 100 : 900;
            const result = packLinhaRow(outros, { id: '__outros', nome: 'Outros', yCentroTrilho: yCentro });
            if (result) {
                result.row.linha = { id: '__outros', nome: 'Outros' };
                rows.push(result.row);
                if (result.overflow) {
                    warnings.push('Outros: largura insuficiente no trilho para itens não categorizados.');
                }
            }
        }

        cab.warning = warnings.join(' ');
        return rows;
    },

    _layoutDoorRows(cab) {
        const doorItems = cab.doorItems || [];
        if (doorItems.length === 0) return [];
        const layoutConfig = cab.layoutConfig || this._getDefaultLayoutConfig();
        const doorLinhas = layoutConfig.doorLinhas || this._getDefaultLayoutConfig().doorLinhas;
        const doorW = Math.max(cab.width - 10, 50);
        const leftOffset = (cab.width - doorW) / 2;
        const rows = [];

        const grouped = {};
        for (const linha of doorLinhas) {
            grouped[linha.id] = [];
        }
        grouped.__outros = [];

        for (const item of doorItems) {
            const key = item._portaLinhaId && grouped[item._portaLinhaId] ? item._portaLinhaId : '__outros';
            grouped[key].push(item);
        }

        for (const linha of doorLinhas) {
            const items = grouped[linha.id] || [];
            if (items.length === 0) continue;
            const yCentro = linha.yCentro ?? linha.yCentroTrilho ?? 200;

            const sorted = [...items].sort((a, b) => {
                const ha = a.h || 50; const hb = b.h || 50;
                if (hb !== ha) return hb - ha;
                return (b.w || 50) - (a.w || 50);
            });

            const rowItems = [];
            let usedWidth = 0;
            let rowHeight = 0;

            for (const item of sorted) {
                const iw = item.w || 50;
                const ih = item.h || 50;
                const qtd = item.qtd || 1;

                for (let qi = 0; qi < qtd; qi++) {
                    if (rowItems.length > 0) usedWidth += 5;
                    rowItems.push({
                        desc: item.desc, qtd: 1,
                        x: usedWidth + leftOffset, y: 0,
                        w: iw, h: ih, color: item.color, category: item.category,
                        _matId: item._matId, _instanceIdx: qi, _porta: true
                    });
                    usedWidth += iw;
                    rowHeight = Math.max(rowHeight, ih);
                }
            }

            const doorEnd = leftOffset + doorW;
            let overflow = false;
            for (const it of rowItems) {
                if (it.x + it.w - 0.01 > doorEnd) { overflow = true; break; }
            }
            if (overflow) {
                const maxRight = Math.max(...rowItems.map(it => it.x + it.w));
                const excess = maxRight - doorEnd;
                if (excess > 0) {
                    for (const it of rowItems) {
                        it.x = Math.max(leftOffset, it.x - excess);
                    }
                }
            }

            for (const it of rowItems) {
                it.y = yCentro - (it.h || 50) / 2;
            }

            rows.push({
                y: yCentro - 20,
                rowHeight: Math.max(rowHeight, 40),
                items: rowItems,
                usedWidth,
                linha: linha
            });
        }

        const outros = grouped.__outros || [];
        if (outros.length > 0) {
            const lastLinha = doorLinhas[doorLinhas.length - 1];
            const yCentro = lastLinha ? (lastLinha.yCentro || 200) + 100 : 900;
            const sorted = [...outros].sort((a, b) => (b.w || 50) - (a.w || 50));
            const rowItems = [];
            let usedWidth = 0;
            let rowHeight = 0;
            for (const item of sorted) {
                const iw = item.w || 50; const ih = item.h || 50;
                const qtd = item.qtd || 1;
                for (let qi = 0; qi < qtd; qi++) {
                    if (rowItems.length > 0) usedWidth += 5;
                    rowItems.push({
                        desc: item.desc, qtd: 1,
                        x: usedWidth + leftOffset, y: 0,
                        w: iw, h: ih, color: item.color, category: item.category,
                        _matId: item._matId, _instanceIdx: qi, _porta: true
                    });
                    usedWidth += iw;
                    rowHeight = Math.max(rowHeight, ih);
                }
            }
            for (const it of rowItems) {
                it.y = yCentro - (it.h || 50) / 2;
            }
            rows.push({
                y: yCentro - 20,
                rowHeight: Math.max(rowHeight, 40),
                items: rowItems,
                usedWidth,
                linha: { id: '__outros', nome: 'Outros (Porta)' }
            });
        }

        return rows;
    },

    renderDSGroup(label, field, value, options) {
        const escaped = JSON.stringify(label).slice(1, -1);
        const hasOutro = options.includes('Outro');
        const normalOptions = hasOutro ? options.slice(0, -1) : options;
        const isOutro = value && !normalOptions.includes(value);
        const aiFilled = this._aiFieldsForCurrentEq?.has(field);
        const aiClass = aiFilled ? ' ai-filled' : '';
        const aiBadge = aiFilled ? '<span class="ai-label">IA</span>' : '';
        return `
            <div class="form-group ds-group" data-field="${field}">
                <label class="form-label">${escaped || label}${aiBadge}</label>
                <div style="display:flex;gap:8px;align-items:center;">
                    <select name="eq_${field}" class="form-control ds-select${aiClass}" style="flex:1;min-width:0;" onchange="app.propostaTecnica.handleDSSelect(this, '${field}')">
                        ${normalOptions.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        <option value="Outro" ${isOutro ? 'selected' : ''}>Outro</option>
                    </select>
                    <input type="text" name="eq_${field}_specify" class="form-control ds-specify" placeholder="Especifique" value="${isOutro ? value : ''}" style="flex:1;display:${isOutro ? 'block' : 'none'};" oninput="app.propostaTecnica.handleDSSelect(this, '${field}')">
                </div>
            </div>
        `;
    },

    handleDSSelect(select, field) {
        select.classList.remove('ai-filled');
        const label = select.closest('.ds-group')?.querySelector('.ai-label');
        if (label) label.remove();
        const state = store.getState();
        const p = state.activeTechnicalProposal;
        if (p && p._aiChanges && p._aiChanges.equipments && this.activeEquipmentIndex !== undefined) {
            const s = p._aiChanges.equipments[String(this.activeEquipmentIndex)];
            if (s) {
                if (s instanceof Set) s.delete(field);
                else delete s[field];
            }
        }
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

        if (eq.labor?.items) eq.labor.items = this.deduplicarLaborItems(eq.labor.items);
        const labor = eq.labor || { items: JSON.parse(JSON.stringify(DEFAULT_LABOR_ROLES)) };

        const laborRates = store.getState().settings?.laborRates || {};
        const composicoes = store.getState().composicoes || [];

        const totalHours = labor.items.reduce((sum, it) => sum + (it.hours || 0), 0);

        const totalCost = labor.items.reduce((sum, it) => {
            const rate = (it.hourlyRate || 0) || (laborRates[`${it.group}|${it.role}`] || laborRates[it.role] || 0);
            return sum + ((it.hours || 0) * rate);
        }, 0);

        const uniqueAreas = [...new Set(DEFAULT_LABOR_ROLES.map(d => d.group))];
        const hasAutoItems = labor.items.some(i => i.auto);
        const showDetalhe = eq._showDetalheComposicao;
        const detalhe = eq._composicaoDetalhada || [];

        const hasRegras = (store.getState().regrasDerivacao || []).length > 0;
        const hasComposicoes = composicoes.length > 0;
        const podeEstimar = hasRegras && hasComposicoes;

        return `

            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 800px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>

                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Mão de Obra Estimada: ${eq.tag}</h4>

                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Horas de engenharia e montagem para este equipamento</div>

                    </div>

                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">

                        ${podeEstimar ? `
                            <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica.calcularMaoDeObraAuto()" style="background: #7c3aed; border-color: #7c3aed;">
                                <i class="ph ph-lightning"></i> Estimar
                            </button>
                            <button type="button" class="btn btn-sm btn-ghost" onclick="app.propostaTecnica.limparMaoDeObra()" style="color: #ef4444; padding: 4px 8px;" title="Limpar linhas automáticas">
                                <i class="ph ph-eraser"></i>
                            </button>
                        ` : `<span class="text-xs text-muted">Cadastre composições e regras para usar a estimativa automática.</span>`}
                        ${hasAutoItems && detalhe.length > 0 ? `
                            <button type="button" class="btn btn-sm btn-ghost" onclick="app.propostaTecnica.toggleDetalheComposicao()" style="color: #0891b2; padding: 4px 8px;">
                                <i class="ph ${showDetalhe ? 'ph-eye-slash' : 'ph-eye'}"></i> ${showDetalhe ? 'Ocultar' : 'Detalhar'}
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-sm btn-secondary" onclick="this.nextElementSibling.style.display='block'; this.style.display='none';">+ Adicionar Função</button>

                        <select style="display: none; font-size: 12px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 6px;" onchange="app.propostaTecnica.addLaborRow(this.value); this.style.display='none'; this.previousElementSibling.style.display=''; this.value='';">
                            <option value="">Selecione a Área...</option>
                            ${uniqueAreas.map(a => `<option value="${a}">${a}</option>`).join('')}
                        </select>

                    </div>

                </div>

                ${showDetalhe && detalhe.length > 0 ? `
                <div style="margin-bottom: 16px; padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">
                    <h5 style="margin: 0 0 8px; font-size: 12px; color: #0369a1; display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-list-bullets"></i> Composição Detalhada (baseada nas regras e composições)
                    </h5>
                    <div class="table-container" style="max-height: 200px; overflow-y: auto;">
                        <table style="font-size: 11px; border-collapse: collapse; width: 100%;">
                            <thead>
                                <tr style="background: #e0f2fe;">
                                    <th style="padding: 4px 6px; text-align: left;">Regra</th>
                                    <th style="padding: 4px 6px; text-align: left;">Composição</th>
                                    <th style="padding: 4px 6px; text-align: center;">Expressão</th>
                                    <th style="padding: 4px 6px; text-align: center;">Qtd</th>
                                    <th style="padding: 4px 6px; text-align: center;">Coef.</th>
                                    <th style="padding: 4px 6px; text-align: right;">HH</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${detalhe.map(d => `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 3px 6px; font-weight: 600;">${d.regra}</td>
                                        <td style="padding: 3px 6px;">[${d.composicao_codigo}] ${d.composicao_atividade}</td>
                                        <td style="padding: 3px 6px; font-family: monospace; text-align: center;">${d.expressao}</td>
                                        <td style="padding: 3px 6px; text-align: center;">${d.quantidade.toFixed(2)} ${d.unidade}</td>
                                        <td style="padding: 3px 6px; text-align: center;">${d.coeficiente_hh}h</td>
                                        <td style="padding: 3px 6px; text-align: right; font-weight: 600;">${d.hh.toFixed(2)}h</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto; background: white;">

                    <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                        <thead>

                            <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0; color: #fff;">

                                <th style="padding: 14px; text-align: left; width: 210px;">Área</th>

                                <th style="padding: 14px; text-align: left;">Função / Atividade</th>

                                <th style="padding: 14px; text-align: center; width: 100px;">Horas</th>

                                <th style="padding: 14px; text-align: right; width: 120px;">Valor/h (R$)</th>

                                <th style="padding: 14px; text-align: right; width: 140px;">Subtotal</th>

                            </tr>

                        </thead>

                        <tbody id="labor-body">

                            ${labor.items.map((it, i) => {
                                const isDefault = DEFAULT_LABOR_ROLES.some(d => d.group === it.group && d.role === it.role);
                                const roleReadonly = isDefault ? 'readonly' : '';
                                const defaultRate = laborRates[`${it.group}|${it.role}`] || laborRates[it.role] || 0;
                                const isOverridden = it.hourlyRate > 0 && it.hourlyRate !== defaultRate;
                                const effectiveRate = isOverridden ? it.hourlyRate : defaultRate;
                                const isAuto = !!it.auto;
                                const rowBg = isAuto ? '#f5f3ff' : (isOverridden ? '#eff6ff' : '');
                                return `
                                <tr class="labor-row" style="border-bottom: 1px solid #f1f5f9;${rowBg ? ` background: ${rowBg};` : ''}">
                                    <input type="hidden" name="labor_auto_${i}" value="${isAuto ? 'true' : ''}">

                                    <td style="padding: 12px;">

                                        <input type="text" name="labor_group_${i}" class="form-control" value="${it.group || ''}" readonly style="font-size: 12px; background: #f8fafc; cursor: default;">

                                    </td>

                                    <td style="padding: 12px; display: flex; align-items: center; gap: 4px;">
                                        <input type="text" name="labor_role_${i}" class="form-control" value="${it.role || ''}" style="font-weight: 600;" ${roleReadonly}>
                                        ${isAuto ? `<span style="font-size: 9px; background: #7c3aed; color: white; padding: 1px 5px; border-radius: 4px; white-space: nowrap;">auto</span>` : ''}
                                    </td>

                                    <td style="padding: 12px;"><input type="number" name="labor_hours_${i}" class="form-control" value="${it.hours || 0}" style="text-align: center;" oninput="app.propostaTecnica.updateLaborTotals()"></td>

                                    <td style="padding: 12px; display: flex; align-items: center; gap: 4px; justify-content: flex-end;">
                                        <input type="text" name="labor_rate_${i}" class="form-control" value="${app.formatCurrency(effectiveRate).replace('R$', '').trim()}" style="text-align: right;" oninput="app.propostaTecnica.updateLaborTotals()" onblur="this.value=app.formatCurrencyRaw(app.parseCurrency(this.value))">
                                        ${isOverridden ? `<span title="Valor diferente do padrão: ${app.formatCurrency(defaultRate)}" style="font-size: 9px; background: #2563eb; color: white; padding: 1px 5px; border-radius: 4px; white-space: nowrap; cursor: help;">edit</span>` : ''}
                                    </td>

                                    <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e3a8a;">${app.formatCurrency((it.hours || 0) * effectiveRate)}</td>

                                </tr>
                            `}).join('')}

                        </tbody>

                        <tfoot style="background: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">

                            <tr>

                                <td colspan="2" style="padding: 14px; text-align: right; text-transform: uppercase; color: #64748b;">Totais do Equipamento</td>

                                <td id="labor-total-hours" style="padding: 14px; text-align: center; color: #1e3a8a;">${totalHours}h</td>

                                <td colspan="2" id="labor-total-cost" style="padding: 14px; text-align: right; color: #1e3a8a; font-size: 16px;">${app.formatCurrency(totalCost)}</td>

                            </tr>

                        </tfoot>

                    </table>

                </div>

            </div>

        `;

    },

    calcularMaoDeObraAuto() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        const equipamentos = data.equipments || [];
        const idx = this.activeEquipmentIndex;
        const eq = equipamentos[idx];
        if (!eq) { app.toast('Selecione um equipamento.', 'warning'); return; }

        if (eq.labor?.items) eq.labor.items = this.deduplicarLaborItems(eq.labor.items);

        const result = window.autoMaoDeObra?.calcularMaoDeObraPorEquipamento(eq);
        if (!result || result.items.length === 0) {
            app.toast('Nenhuma regra aplicável para este equipamento. Verifique as regras de derivação.', 'info');
            return;
        }

        const autoKeys = new Set(result.items.map(i => `${i.group}|${i.role}`));
        const manuais = (eq.labor?.items || []).filter(i =>
            !autoKeys.has(`${i.group}|${i.role}`) &&
            (i.hours > 0 || i.hourlyRate > 0)
        );
        eq.labor = { items: [...manuais, ...result.items] };
        eq._composicaoDetalhada = result.composicaoDetalhada;
        eq._showDetalheComposicao = true;

        store.setState({ activeTechnicalProposal: data });
        this.renderSubTab();
        app.toast(`Mão de obra estimada: ${result.totalHoras.toFixed(1)}h (${result.items.length} funções)`, 'success');
    },

    limparMaoDeObra() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        const equipamentos = data.equipments || [];
        const idx = this.activeEquipmentIndex;
        const eq = equipamentos[idx];
        if (!eq) return;

        eq.labor = { items: (eq.labor?.items || []).filter(i => !i.auto) };
        eq._composicaoDetalhada = [];
        eq._showDetalheComposicao = false;
        store.setState({ activeTechnicalProposal: data });
        this.renderSubTab();
        app.toast('Linhas automáticas removidas.', 'info');
    },

    toggleDetalheComposicao() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        const idx = this.activeEquipmentIndex;
        const eq = (data.equipments || [])[idx];
        if (!eq) return;
        eq._showDetalheComposicao = !eq._showDetalheComposicao;
        this.renderSubTab();
    },

    renderSubTab() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        this.renderModal(data);
    },

    async calcularMaoDeObraTodosEquipamentos() {
        const data = store.getState().activeTechnicalProposal;
        if (!data) return;
        const equipments = data.equipments || [];
        if (equipments.length === 0) { app.toast('Nenhum equipamento na proposta.', 'warning'); return; }

        const hasRegras = (store.getState().regrasDerivacao || []).length > 0;
        if (!hasRegras) { app.toast('Cadastre regras de derivação primeiro.', 'info'); return; }

        let total = 0;
        let count = 0;

        equipments.forEach(eq => {
            if (eq.type === 'SEU') return;
            if (eq.labor?.items) eq.labor.items = this.deduplicarLaborItems(eq.labor.items);
            const result = window.autoMaoDeObra?.calcularMaoDeObraPorEquipamento(eq);
            if (result && result.items.length > 0) {
                const autoKeys = new Set(result.items.map(i => `${i.group}|${i.role}`));
                const manuais = (eq.labor?.items || []).filter(i =>
                    !autoKeys.has(`${i.group}|${i.role}`) &&
                    (i.hours > 0 || i.hourlyRate > 0)
                );
                eq.labor = { items: [...manuais, ...result.items] };
                eq._composicaoDetalhada = result.composicaoDetalhada;
                eq._showDetalheComposicao = false;
                total += result.totalHoras || 0;
                count++;
            }
        });

        store.setState({ activeTechnicalProposal: data });
        if (this.activeSubTab === 'labor') this.renderSubTab();

        app.toast(`Mão de obra estimada para ${count} equipamentos. Total: ${total.toFixed(1)}h`, count > 0 ? 'success' : 'info');
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

                            <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0; color: #fff;">

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



    renderMateriaisTab(eq) {
        const materiais = eq.materials || [];
        const total = materiais.reduce((sum, it) => sum + ((it.custo || 0) * (it.qtd || 0)), 0);

        return `
            <div style="animation: fadeIn 0.3s ease;">

                <div style="max-width: 960px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>
                        <h4 style="margin: 0; color: #1e3a8a; font-size: 18px;">Lista de Materiais: ${eq.tag}</h4>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Materiais do catálogo associados a este equipamento</div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addMaterialRow()">+ Adicionar Manual</button>
                        <button type="button" class="btn btn-sm btn-primary" onclick="app.propostaTecnica.openAddEqMaterialModal()"><i class="ph ph-package"></i> Adicionar do Catálogo</button>
                    </div>

                </div>

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto; background: white;">

                    <table class="w-full" style="font-size: 12px; border-collapse: collapse;">

                        <thead>
                            <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0; color: #fff;">
                                <th style="padding: 10px; text-align: center; width: 60px;">Qtd</th>
                                <th style="padding: 10px; text-align: left;">Descrição</th>
                                <th style="padding: 10px; text-align: left; width: 120px;">Fabricante</th>
                                <th style="padding: 10px; text-align: left; width: 100px;">Modelo</th>
                                <th style="padding: 10px; text-align: left; width: 110px;">Cód. Fabricante</th>
                                <th style="padding: 10px; text-align: right; width: 100px;">Custo Unit. (R$)</th>
                                <th style="padding: 10px; text-align: right; width: 100px;">Subtotal (R$)</th>
                                <th style="padding: 10px; width: 50px;"></th>
                            </tr>
                        </thead>

                        <tbody id="materiais-body">

                            ${materiais.map((it, i) => `
                                <tr class="mat-row" style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 8px; text-align: center;">
                                        <input type="hidden" name="mat_materialId_${i}" value="${this._escapeHtml(it.materialId || '')}">
                                        <input type="number" name="mat_qtd_${i}" class="form-control" value="${it.qtd || 0}" min="0" step="1"
                                            style="width: 50px; padding: 4px; text-align: center;"
                                            oninput="app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_desc_${i}" class="form-control" value="${this._escapeHtml(it.descricao || '')}" style="font-weight: 600;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_fabricante_${i}" class="form-control" value="${this._escapeHtml(it.fabricante || '')}" style="font-size: 11px;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_modelo_${i}" class="form-control" value="${this._escapeHtml(it.modelo || '')}" style="font-size: 11px;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_codfab_${i}" class="form-control" value="${this._escapeHtml(it.codigoFabricante || '')}" style="font-family: monospace; font-size: 11px;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" name="mat_custo_${i}" class="form-control" value="${app.formatCurrency(it.custo || 0).replace('R$', '').trim()}"
                                            style="text-align: right;"
                                            oninput="app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
                                    </td>
                                    <td style="padding: 8px; text-align: right; font-weight: 700; color: #1e3a8a;" class="mat-subtotal-cell">
                                        ${app.formatCurrency((it.custo || 0) * (it.qtd || 0))}
                                    </td>
                                    <td style="padding: 8px; text-align: center;">
                                        <button type="button" class="btn-icon" style="color: #ef4444;"
                                            onclick="this.closest('tr').remove(); app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
                                            <i class="ph ph-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}

                            ${materiais.length === 0 ? '<tr><td colspan="8" style="padding: 40px; text-align: center; color: #94a3b8;">Nenhum material associado. Clique em "Adicionar do Catálogo" para selecionar materiais ou "Adicionar Manual" para incluir manualmente.</td></tr>' : ''}

                        </tbody>

                        <tfoot style="background: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">
                            <tr>
                                <td colspan="6" style="padding: 14px; text-align: right; text-transform: uppercase; color: #64748b;">Custo Total de Materiais</td>
                                <td id="materiais-total-cost" style="padding: 14px; text-align: right; color: #1e3a8a; font-size: 16px;">${app.formatCurrency(total)}</td>
                                <td></td>
                            </tr>
                        </tfoot>

                    </table>

                </div>

            </div>
        `;
    },

    updateMaterialTotals() {
        const rows = document.querySelectorAll('.mat-row');
        let totalCost = 0;

        rows.forEach((row, i) => {
            const qtd = parseFloat(row.querySelector(`[name^="mat_qtd_"]`)?.value || 0);
            const unitStr = row.querySelector(`[name^="mat_custo_"]`)?.value || '0';
            const unit = parseFloat(unitStr.replace(/\./g, '').replace(',', '.'));
            const subtotal = qtd * unit;
            totalCost += subtotal;
            const subtotalCell = row.querySelector('.mat-subtotal-cell');
            if (subtotalCell) subtotalCell.textContent = app.formatCurrency(subtotal);
        });

        const totalCostEl = document.getElementById('materiais-total-cost');
        if (totalCostEl) totalCostEl.textContent = app.formatCurrency(totalCost);
    },

    addMaterialRow() {
        const body = document.getElementById('materiais-body');
        if (!body) return;
        const index = body.querySelectorAll('.mat-row').length;

        const row = document.createElement('tr');
        row.className = 'mat-row';
        row.style.borderBottom = '1px solid #f1f5f9';
        row.innerHTML = `
            <td style="padding: 8px; text-align: center;">
                <input type="hidden" name="mat_materialId_${index}" value="">
                <input type="number" name="mat_qtd_${index}" class="form-control" value="1" min="0" step="1"
                    style="width: 50px; padding: 4px; text-align: center;"
                    oninput="app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_desc_${index}" class="form-control" style="font-weight: 600;">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_fabricante_${index}" class="form-control" style="font-size: 11px;">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_modelo_${index}" class="form-control" style="font-size: 11px;">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_codfab_${index}" class="form-control" style="font-family: monospace; font-size: 11px;">
            </td>
            <td style="padding: 8px;">
                <input type="text" name="mat_custo_${index}" class="form-control" value="0,00"
                    style="text-align: right;"
                    oninput="app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
            </td>
            <td style="padding: 8px; text-align: right; font-weight: 700; color: #1e3a8a;" class="mat-subtotal-cell">R$ 0,00</td>
            <td style="padding: 8px; text-align: center;">
                <button type="button" class="btn-icon" style="color: #ef4444;"
                    onclick="this.closest('tr').remove(); app.propostaTecnica.updateMaterialTotals(); var evt=new Event('change'); this.form.dispatchEvent(evt);">
                    <i class="ph ph-trash"></i>
                </button>
            </td>
        `;

        body.appendChild(row);
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

    deduplicarLaborItems(items) {
        const map = new Map();
        (items || []).forEach(item => {
            const key = `${item.group || ''}|${item.role || ''}`;
            if (!key || key === '|') return;
            const existing = map.get(key);
            if (existing) {
                existing.hours = (existing.hours || 0) + (item.hours || 0);
                existing.hourlyRate = Math.max(existing.hourlyRate || 0, item.hourlyRate || 0);
                if (item.auto) existing.auto = true;
                if (item.composicaoDetalhe && item.composicaoDetalhe.length > 0) {
                    existing.composicaoDetalhe = item.composicaoDetalhe;
                }
            } else {
                map.set(key, { ...item });
            }
        });
        return Array.from(map.values());
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



    addLaborRow(area) {

        if (!area) return;

        const body = document.getElementById('labor-body');

        if (!body) return;

        const rows = body.querySelectorAll('.labor-row');

        const newIndex = rows.length;

        const row = document.createElement('tr');

        row.className = 'labor-row';

        row.style.borderBottom = '1px solid #f1f5f9';

        row.innerHTML = `
            <input type="hidden" name="labor_auto_${newIndex}" value="">

            <td style="padding: 12px;">

                <input type="text" name="labor_group_${newIndex}" class="form-control" value="${area}" readonly style="font-size: 12px; background: #f8fafc; cursor: default;">

            </td>

            <td style="padding: 12px;"><input type="text" name="labor_role_${newIndex}" class="form-control" style="font-weight: 600;"></td>

            <td style="padding: 12px;"><input type="number" name="labor_hours_${newIndex}" class="form-control" value="0" style="text-align: center;" oninput="app.propostaTecnica.updateLaborTotals()"></td>

            <td style="padding: 12px;"><input type="text" name="labor_rate_${newIndex}" class="form-control" value="0,00" style="text-align: right;" oninput="app.propostaTecnica.updateLaborTotals()" onblur="this.value=app.formatCurrencyRaw(app.parseCurrency(this.value))"></td>

            <td style="padding: 12px; text-align: right; font-weight: 700; color: #1e3a8a;">R$ 0,00</td>

        `;

        let insertAfter = null;

        rows.forEach(r => {

            const g = r.querySelector('[name^="labor_group_"]');

            if (g && g.value === area) insertAfter = r;

        });

        if (insertAfter) {

            insertAfter.after(row);

        } else {

            body.appendChild(row);

        }

        this.updateLaborTotals();

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
                        <button class="btn btn-cancel" onclick="document.getElementById('modal-custom-norm').remove()">Cancelar</button>
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
                        <button class="btn btn-cancel" onclick="document.getElementById('modal-custom-characteristic').remove()">Cancelar</button>
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
        console.log('[VendorList] data.vendorList:', data.vendorList);
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
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Vendor List / Lista de Fabricantes${data._aiChanges?.vendorList ? '<span class="ai-label">IA</span>' : ''}</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Definição de marcas homologadas para os componentes principais</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="app.propostaTecnica.addVendorRow()">
                        <i class="ph ph-plus-circle"></i> Inserir Linha
                    </button>
                </div>

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto;" onchange="window.propostaTecnicaModule._clearAiVendorList()">

                    <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                        <thead>
                            <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 14px; text-align: left; font-weight: 800; color: #1e3a8a; font-size: 13px;">Componente / Material</th>
                                <th style="padding: 14px; text-align: left; font-weight: 800; color: #1e3a8a; font-size: 13px;">Fabricante Sugerido (Padrão)</th>
                                <th style="padding: 14px; text-align: left; font-weight: 800; color: #1e3a8a; font-size: 13px;">Alternativas Aceitáveis</th>
                                <th style="padding: 14px; width: 50px; color: #1e3a8a; font-size: 13px;">Ações</th>
                            </tr>
                        </thead>

                        <tbody id="vendor-body">
                            ${vendors.map((v, i) => {
                                const brands = VENDOR_MAP[v.comp] || [];
                                const isCustom = !brands.length;
                                const isOutro = v.opt === '__OUTRO__';
                                const isSimilar = v.opt === '__SIMILAR__';
                                const isPadrao = v.opt === '__PADRAO__';
                                const showEspecifique = isOutro;
                                return `
                                <tr class="vendor-row" style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 12px; font-weight: 600; color: #1e3a8a; font-size: 10px;">
                                        ${isCustom ? `
                                            <input type="text" name="ven_comp_${i}" class="form-control" style="font-size: 10px; font-weight: 600; color: #1e3a8a; width: 100%;" value="${v.comp}">
                                        ` : `
                                            ${v.comp}
                                        `}
                                    </td>
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
                                            <select name="ven_opt_${i}" class="form-control vendor-opt-select" style="flex: 1; font-size: 10px; font-weight: 400;" onchange="this.closest('tr').querySelector('.ven-especifique').style.display=this.value==='__OUTRO__'?'inline-block':'none'">
                                                <option value="__PADRAO__" ${isPadrao ? 'selected' : ''}>Padrão</option>
                                                <option value="__OUTRO__" ${isOutro ? 'selected' : ''}>Outro</option>
                                                <option value="__SIMILAR__" ${isSimilar ? 'selected' : ''}>Similar</option>
                                            </select>
                                            <input type="text" name="ven_opt_especifique_${i}" class="form-control ven-especifique" placeholder="Especifique..." style="display: ${showEspecifique ? 'inline-block' : 'none'}; width: 160px;" value="${v.optEspecifique || ''}">
                                        </div>
                                    </td>
                                    <td style="padding: 12px; text-align: center;">
                                        <button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444; background: none; border: none; cursor: pointer; font-size: 16px;"><i class="ph ph-trash"></i></button>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>

                    </table>

                </div>

            </div>

        `;

    },

    addVendorRow() {
        const body = document.getElementById('vendor-body');
        if (!body) return;
        const index = body.querySelectorAll('.vendor-row').length;
        const row = document.createElement('tr');
        row.className = 'vendor-row';
        row.style.borderBottom = '1px solid #f1f5f9';
        row.innerHTML = `
            <td style="padding: 12px; font-weight: 600; color: #1e3a8a; font-size: 10px;">
                <input type="text" name="ven_comp_${index}" class="form-control" style="font-size: 10px; font-weight: 600; color: #1e3a8a; width: 100%;" placeholder="Nome do componente">
            </td>
            <td style="padding: 12px;">
                <input type="text" name="ven_brand_${index}" class="form-control" style="font-size: 10px; font-weight: 400;" placeholder="Fabricante">
            </td>
            <td style="padding: 12px;">
                <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                    <select name="ven_opt_${index}" class="form-control vendor-opt-select" style="flex: 1; font-size: 10px; font-weight: 400;" onchange="this.closest('tr').querySelector('.ven-especifique').style.display=this.value==='__OUTRO__'?'inline-block':'none'">
                        <option value="__PADRAO__" selected>Padrão</option>
                        <option value="__OUTRO__">Outro</option>
                        <option value="__SIMILAR__">Similar</option>
                    </select>
                    <input type="text" name="ven_opt_especifique_${index}" class="form-control ven-especifique" placeholder="Especifique..." style="display: none; width: 160px;">
                </div>
            </td>
            <td style="padding: 12px; text-align: center;">
                <button type="button" onclick="this.closest('tr').remove()" class="btn-icon" style="color: #ef4444; background: none; border: none; cursor: pointer; font-size: 16px;"><i class="ph ph-trash"></i></button>
            </td>
        `;
        body.appendChild(row);
    },

    async _saveVendorDefaults(vendors) {
        const customItems = vendors.filter(v => !VENDOR_MAP[v.comp]);
        if (customItems.length === 0) return;
        const state = store.getState();
        const existingDefaults = (() => {
            try { return JSON.parse(state.company?.vendorDefaults || '[]'); } catch (e) { return []; }
        })();
        const merged = [...existingDefaults];
        customItems.forEach(cv => {
            if (!merged.find(m => m.comp === cv.comp)) {
                merged.push({ comp: cv.comp, brand: cv.brand, opt: cv.opt, optEspecifique: cv.optEspecifique });
            }
        });
        try {
            await fetch('/api/settings/vendor-defaults', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorDefaults: merged })
            });
            const company = { ...state.company, vendorDefaults: JSON.stringify(merged) };
            store.setState({ company });
        } catch (e) {
            console.error('[VendorList] Erro ao salvar defaults:', e);
        }
    },

    renderTabRevisoes(data) {

        return `

            <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">

                    <div>
                        <h3 style="margin: 0; color: #1e3a8a; font-size: 18px;">Controle de Revisões</h3>
                        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Histórico de versões da proposta técnica</div>
                    </div>

                    <button type="button" class="btn btn-sm btn-primary btn-add-revision" onclick="app.propostaTecnica.addRevisionRow()">+ Nova Revisão</button>

                </div>

                <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 12px; max-height: 440px; overflow-y: auto;">

                <table class="w-full" style="font-size: 13px; border-collapse: collapse;">

                    <thead>

                        <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0;">

                            <th style="padding: 14px; width: 70px; color: #1e3a8a; font-size: 13px;">Nú</th>

                            <th style="padding: 14px; color: #1e3a8a; font-size: 13px;">Descrição</th>

                            <th style="padding: 14px; width: 70px; text-align: center; color: #1e3a8a; font-size: 13px;">Elab.</th>

                            <th style="padding: 14px; width: 70px; text-align: center; color: #1e3a8a; font-size: 13px;">Verif.</th>

                            <th style="padding: 14px; width: 70px; text-align: center; color: #1e3a8a; font-size: 13px;">Aprov.</th>

                            <th style="padding: 14px; width: 120px; text-align: center; color: #1e3a8a; font-size: 13px;">Data</th>

                            <th style="padding: 14px; width: 50px;"></th>

                        </tr>

                    </thead>

                    <tbody id="revisions-body">

                        ${(data.revisions || []).map((rev, index) => `

                            <tr class="revision-row" style="border-bottom: 1px solid #f1f5f9;">

                                <td style="padding: 12px;"><input type="text" name="rev_no_${index}" class="form-control" value="${rev.no || ''}" style="text-align: center; padding: 10px 4px;"></td>

                                <td style="padding: 12px;"><input type="text" name="rev_desc_${index}" class="form-control" value="${rev.desc || ''}"></td>

                                <td style="padding: 12px;"><select name="rev_elab_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions(rev.elab, true)}</select></td>

                                <td style="padding: 12px;"><select name="rev_verif_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions(rev.verif, true)}</select></td>

                                <td style="padding: 12px;"><select name="rev_aprov_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions(rev.aprov, true)}</select></td>

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
                <label style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                    <input type="checkbox" name="sig${n}_active" ${data['sig'+n+'_active'] !== false ? 'checked' : ''} style="width:16px;height:16px;">
                    <span style="font-size:11px;font-weight:600;">${label}</span>
                </label>
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
            ${sig(1,'Assinatura 1 (Consultor)','José Cirqueira','Consultor de Vendas','(16) 3945-2145','(16) 9 9793-2877','jose.cirqueira@minhaempresa.com.br')}
            ${sig(2,'Assinatura 2 (Gerente)','Leandro Pereira','Gerente Comercial','(16) 3945-2145','(16) 9 9713-3674','leandro.pereira@minhaempresa.com.br')}
            ${sig(3,'Assinatura 3 (Diretor)','Márcio Vaz','Diretor de Negócios','(16) 3945-2145','(16) 99730-6540','marcio.vaz@minhaempresa.com.br')}
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

            <td style="padding: 8px; text-align: center;"><input type="checkbox" name="scope_empresa_${index}"></td>

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

            <td style="padding: 8px;"><select name="rev_elab_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions('', true)}</select></td>

            <td style="padding: 8px;"><select name="rev_verif_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions('', true)}</select></td>

            <td style="padding: 8px;"><select name="rev_aprov_${index}" class="form-control" data-user-select data-initials-only style="text-align: center; padding: 10px 4px;" onchange="window.propostaTecnicaModule._setRevisionUserText(this)">${this._userOptions('', true)}</select></td>

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
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.toggleDeviationEdit(${i})" title="${editing ? 'Confirmar' : 'Editar'}" style="color:var(--color-accent);background:#e8eddc;border:1px solid #d4e0c0;width:28px;height:28px;border-radius:4px;">
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
                                                    <button type="button" class="btn-icon" onclick="window.propostaTecnicaModule.toggleExclusionEdit(${i})" title="${editing ? 'Confirmar' : 'Editar'}" style="color:var(--color-accent);background:#e8eddc;border:1px solid #d4e0c0;width:28px;height:28px;border-radius:4px;">
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

        const isCubMt = eq && eq.type === 'CUB-MT';

        const load = eq.loads[loadIndex];

        

        if (!load || !load.typicalId) {

            app.toast('Por favor, associe um Típico a esta carga para visualizar a LM.', 'warning');

            return;

        }

        const sourceData = isCubMt ? store.getState().cubiculos : store.getState().tipicos;

        const typical = sourceData.find(t => t.id === load.typicalId);

        if (!typical) {

            app.toast(isCubMt ? 'Cubículo não encontrado.' : 'Típico não encontrado.', 'error');

            return;

        }



        const modalHtml = `

            <div id="modal-lm-preview" class="modal-overlay" style="z-index: 10001;">

                <div class="modal" style="width: 800px; max-height: 90vh; display: flex; flex-direction: column;">

                    <div class="modal-header" style="background: #1e3a8a; color: white;">

                        <div>

                            <h3 style="margin: 0;">Lista de Materiais: ${load.tag || 'Carga'}</h3>

                            <div style="font-size: 12px; opacity: 0.8;">${isCubMt ? 'Cubículo' : 'Típico'}: ${typical.nome}</div>

                        </div>

                        <button type="button" class="btn-icon" style="color: white;" onclick="document.getElementById('modal-lm-preview').remove()"><i class="ph ph-x"></i></button>

                    </div>

                    <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 20px;">

                        <table class="w-full" style="font-size: 12px; border-collapse: collapse;">

                            <thead>

                                <tr style="background: var(--color-accent); text-align: left; color: #fff;">

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

        const isCubMt = eq && eq.type === 'CUB-MT';

        const sourceData = isCubMt ? (store.getState().cubiculos || []) : (store.getState().tipicos || []);



        app.toast('Exportando Excel...', 'info');



        try {

            let groupedData = [];



            if (loadIndex !== null && loadIndex !== undefined) {

                // Exportar carga única

                const load = eq.loads[loadIndex];

                if (!load) return;

                const typical = sourceData.find(t => t.id === load.typicalId);

                if (typical) {

                    groupedData.push({

                        carga: load,

                        typical: typical,

                        items: load._itemsOverride || typical.items || []

                    });

                }

            } else {

                // Exportar todas as cargas do painel

                (eq.loads || []).forEach(load => {

                    const typical = sourceData.find(t => t.id === load.typicalId);

                    if (typical) {

                        groupedData.push({

                            carga: load,

                            typical: typical,

                            items: load._itemsOverride || typical.items || []

                        });

                    }

                });

            }



            if (groupedData.length === 0) {

                app.toast('Nenhum dado para exportar. Verifique se as cargas possuem típicos associados.', 'warning');

                return;

            }



            const response = await fetch('/api/export-lm', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ 

                    items: groupedData,

                    ptcNumber: data.codigo || 'LM',

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

        if (store.getState().proposalReadOnly) {
            window.app.toast('Proposta em modo somente leitura. Não é possível salvar.', 'warning', 0);
            return;
        }

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

                data.cidade = formData.get('cidade') || data.cidade || '';
                data.uf = formData.get('uf') || data.uf || '';
                data.localizacao = [data.cidade, data.uf].filter(Boolean).join('/') || data.localizacao || '';

                data.engenheiroResponsavel = formData.get('engenheiroResponsavel') || data.engenheiroResponsavel || '';

                data.vendedor = formData.get('vendedor') || data.vendedor || '';

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
                        minhaEmpresa:  row.querySelector('input[name="scope_empresa"]')?.checked  || false,
                        cli:  row.querySelector('input[name="scope_cli"]')?.checked  || false
                    };
                    if (isAuto)    { item.auto = true; item.equipTag = row.dataset.equipTag || ''; }
                    if (isSeu)     { item.isSeu = true; }
                    if (isSeuComp) { item.isSeuComp = true; item.parentSeu = row.dataset.parentSeu || ''; }
                    scopeItems.push(item);
                });
                data.scopeItems = scopeItems;
            }

            // Capturar Escopo AUTPRO (se existir no DOM)
            const autproRows = form.querySelectorAll('.autpro-row');
            if (autproRows.length > 0) {
                data.autproScope = AUTPRO_SCOPE_ITEMS.map(item => {
                    const row = form.querySelector(`.autpro-row[data-autpro-id="${item.id}"]`);
                    const checked = row ? row.querySelector('input[type="checkbox"]')?.checked || false : false;
                    return { id: item.id, desc: item.desc, incluso: checked };
                });
            }


            // Captura de dados baseada na aba ativa

            if (this.activeTab === 'geral') {

            } else if (this.activeTab === 'vendor') {

                const vendors = [];
                const rows = form.querySelectorAll('.vendor-row');
                rows.forEach((row) => {
                    const compEl = row.querySelector('td:first-child');
                    const compInput = compEl ? compEl.querySelector('input') : null;
                    const comp = compInput ? compInput.value.trim() : (compEl ? compEl.textContent.trim() : '');
                    if (!comp) return;
                    const brandEl = row.querySelector('[name^="ven_brand_"]') || row.querySelector('td:nth-child(2) input, td:nth-child(2) select');
                    const optEl = row.querySelector('[name^="ven_opt_"]');
                    const especEl = row.querySelector('.ven-especifique');
                    const opt = optEl ? optEl.value : '__PADRAO__';
                    const optEspecifique = especEl ? especEl.value : '';
                    vendors.push({
                        comp,
                        brand: brandEl ? brandEl.value : '',
                        opt,
                        optEspecifique: opt === '__OUTRO__' ? optEspecifique : ''
                    });
                });
                data.vendorList = vendors;
                this._saveVendorDefaults(vendors);

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

                data.sig1_active = formData.get('sig1_active') === 'on';
                data.sig1_nome = formData.get('sig1_nome') || '';
                data.sig1_cargo = formData.get('sig1_cargo') || '';
                data.sig1_tel = formData.get('sig1_tel') || '';
                data.sig1_cel = formData.get('sig1_cel') || '';
                data.sig1_email = formData.get('sig1_email') || '';
                data.sig2_active = formData.get('sig2_active') === 'on';
                data.sig2_nome = formData.get('sig2_nome') || '';
                data.sig2_cargo = formData.get('sig2_cargo') || '';
                data.sig2_tel = formData.get('sig2_tel') || '';
                data.sig2_cel = formData.get('sig2_cel') || '';
                data.sig2_email = formData.get('sig2_email') || '';
                data.sig3_active = formData.get('sig3_active') === 'on';
                data.sig3_nome = formData.get('sig3_nome') || '';
                data.sig3_cargo = formData.get('sig3_cargo') || '';
                data.sig3_tel = formData.get('sig3_tel') || '';
                data.sig3_cel = formData.get('sig3_cel') || '';
                data.sig3_email = formData.get('sig3_email') || '';

            } else if (this.activeTab === 'exclusions') {

                this._captureExclusionsEdits();

            } else if (this.activeTab === 'equipments') {

                this.captureEquipmentData();

            } else if (this.activeTab === 'infraestrutura') {

                this.captureInfraData();

            }



            // Validação final antes de enviar (usa o que já está no 'data' do state)

            if (!data.cliente) {

                app.toast('Atenção: O campo Cliente (na aba Dados Gerais) é obrigatório para salvar no servidor.', 'warning');
                
                // Sincroniza estado local para não perder o que foi digitado na aba ativa
                store.setState({ activeTechnicalProposal: data });
                this.renderModal(data);

                return;

            }



            const _saveStart = Date.now();

            if (!window.app.currentPtc?.folder) {
                app.toast('Nenhuma PTC ativa. Selecione ou crie uma PTC antes de salvar.', 'warning');
                return;
            }

            app.toast('Salvando Proposta...', 'info', 1000);

            console.log("[PropostaTecnica] Data to be saved:", JSON.stringify(data.equipments.map(e => e.tag)));

            const _tk = store.getState().auth?.token;
            const res = await fetch('/api/save-proposal', {

                method: 'POST',

                headers: { 'Content-Type': 'application/json', ...(_tk ? { 'Authorization': 'Bearer ' + _tk } : {}) },

                body: JSON.stringify({

                    ptcFolder: window.app.currentPtc?.folder,

                    type: 'tecnica',

                    content: data,

                    revisionFolder: window.app.currentPtc?.revision || ''

                })

            });

            const result = await res.json();

            if (result.success) {

                const _elapsed = Date.now() - _saveStart;
                if (_elapsed < 1000) {
                    await new Promise(r => setTimeout(r, 1000 - _elapsed));
                }
                app.toast('Proposta Salva com Sucesso!', 'success', 1000);

                // Sincroniza o store com os dados capturados
                store.setState({ activeTechnicalProposal: data });

                // Sincroniza a lista de propostas técnicas no state
                if (!data.id) data.id = crypto.randomUUID();
                if (!data.ptc_folder) data.ptc_folder = window.app.currentPtc?.folder || '';
                const _ptcList = store.getState().propostasTecnicas || [];
                const _ptcExisting = _ptcList.find(p => p.id === data.id);
                if (_ptcExisting) {
                    store.updatePropostaTecnica(data.id, data);
                } else {
                    store.addPropostaTecnica(data);
                }

                // Sync vendedor to pipeline item
                if (window.app.currentPtc?.folder && data.vendedor) {
                    const state = store.getState();
                    const pitems = state.pipelineItems || [];
                    const pi = pitems.find(i => i.origemId === window.app.currentPtc.folder);
                    if (pi) {
                        const idx = pitems.indexOf(pi);
                        const updated = { ...pi, vendedor: data.vendedor, updatedAt: new Date().toISOString() };
                        pitems[idx] = updated;
                        store.setState({ pipelineItems: [...pitems] });
                        store._syncUpdate('pipelineItems', pi.id, { vendedor: data.vendedor, updatedAt: updated.updatedAt });
                    }
                }

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
            const data = store.getState().activeTechnicalProposal;
            if (!data) {
                app.toast('Nenhuma proposta ativa para duplicar.', 'warning');
                return;
            }
            if (this.activeTab === 'infraestrutura') {
                this.captureInfraData();
            }
            const copy = JSON.parse(JSON.stringify(data));
            this._openSaveAsModal(copy);
        } catch (e) {
            console.error('[saveAsNew] Error:', e);
            app.toast('Erro ao duplicar proposta: ' + e.message, 'error');
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
                        Uma cópia da proposta atual será salva em uma nova PTC.
                    </p>
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="font-weight: 600; font-size: 13px; margin-bottom: 8px; display: block;">PTC de destino:</label>
                        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                            <label style="flex: 1; padding: 8px 12px; border: 2px solid #1e3a8a; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px; background: #eff6ff;">
                                <input type="radio" name="sas-ptc-option" value="new-dual" checked onchange="document.getElementById('sas-ptc-new-fields').style.display='block'; document.getElementById('sas-ptc-existing-fields').style.display='none';">
                                Criar nova PTC (2 arquivos PT + PC)
                            </label>
                            <label style="flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px;">
                                <input type="radio" name="sas-ptc-option" value="new-single" onchange="document.getElementById('sas-ptc-new-fields').style.display='block'; document.getElementById('sas-ptc-existing-fields').style.display='none';">
                                Criar nova PTC (arquivo \u00fanico)
                            </label>
                            <label style="flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; text-align: center; font-size: 13px;">
                                <input type="radio" name="sas-ptc-option" value="existing" onchange="document.getElementById('sas-ptc-new-fields').style.display='none'; document.getElementById('sas-ptc-existing-fields').style.display='block'; (window.propostaTecnicaModule||window.propostaTecnicaModule).loadPtcListSas();">
                                PTC existente
                            </label>
                        </div>
                        <div id="sas-ptc-new-fields">
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="sas-ptc-number" class="form-control" value="carregando..." style="flex: 1; font-weight: 700;">
                                <input type="text" id="sas-ptc-title" class="form-control" placeholder="Título do Projeto" value="${this._escapeHtml(sourceData.projeto || '')}" style="flex: 2;">
                            </div>
                        </div>
                        <div id="sas-ptc-existing-fields" style="display: none;">
                            <select id="sas-ptc-select" class="form-control">
                                <option value="">Carregando PTCs...</option>
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
                    <button class="btn btn-cancel" onclick="document.getElementById('modal-save-as').remove()">Cancelar</button>
                    <button class="btn btn-primary" id="sas-btn-confirmar" style="background: #1e3a8a; display: flex; align-items: center; gap: 6px;">
                        <i class="ph ph-copy"></i> Salvar como Nova
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal._sourceData = sourceData;
        if (window.app.generatePtcNumber) {
            window.app.generatePtcNumber().then(n => {
                const el = document.getElementById('sas-ptc-number');
                if (el) el.value = n;
            });
        }

        document.getElementById('sas-btn-confirmar').addEventListener('click', () => {
            this._confirmSaveAs(modal);
        });
    },

    loadPtcListSas() {
        const select = document.getElementById('sas-ptc-select');
        if (!select) return;
        const _tkPT6398 = store.getState().auth?.token;
        fetch('/api/list-ptcs', { headers: { ...(_tkPT6398 ? { 'Authorization': 'Bearer ' + _tkPT6398 } : {}) } })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.dvts) {
                    select.innerHTML = '<option value="">Selecione uma PTC...</option>'
                        + data.dvts.map(d => `<option value="${d}">${d}</option>`).join('');
                } else {
                    select.innerHTML = '<option value="">Nenhuma PTC encontrada</option>';
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
            const option = document.querySelector('input[name="sas-ptc-option"]:checked')?.value;
            const isDual = option === 'new-dual';
            const isNewPtc = option === 'new-dual' || option === 'new-single';
            let targetFolder = '';

            if (isNewPtc) {
                statusEl.textContent = 'Criando nova PTC...';
                const ptcNumber = document.getElementById('sas-ptc-number')?.value || '';
                const ptcTitle = document.getElementById('sas-ptc-title')?.value || '';
                const clientName = document.getElementById('sas-cliente')?.value || '';
                if (!ptcTitle) {
                    app.toast('Informe o título do projeto.', 'warning');
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
                    statusEl.textContent = '';
                    return;
                }
                targetFolder = await window.app.createPtcSimple(ptcNumber, ptcTitle, clientName);
            } else {
                targetFolder = document.getElementById('sas-ptc-select')?.value;
                if (!targetFolder) {
                    app.toast('Selecione uma PTC existente.', 'warning');
                    btnConfirmar.disabled = false;
                    btnConfirmar.innerHTML = '<i class="ph ph-copy"></i> Salvar como Nova';
                    statusEl.textContent = '';
                    return;
                }
            }

            const options = {
                cliente: document.getElementById('sas-cliente')?.value || undefined,
                projeto: document.getElementById('sas-projeto')?.value || undefined
            };

            if (isDual) {
                statusEl.textContent = 'Salvando Proposta Técnica...';
                await window.app.duplicateProposal('tecnica', sourceData, targetFolder, options);
                statusEl.textContent = 'Salvando Proposta Comercial...';
                const comData = store.getState().activeCommercialProposal;
                if (comData) {
                    await window.app.duplicateProposal('comercial', comData, targetFolder, options);
                } else {
                    const now = new Date().toISOString();
                    const empty = {
                        id: crypto.randomUUID(),
                        cliente: options?.cliente || '',
                        projeto: options?.projeto || '',
                        codigo: 'PC-' + Date.now().toString(36).toUpperCase(),
                        objeto: '',
                        status: 'Rascunho',
                        data_emissao: now.split('T')[0],
                        createdAt: now,
                        updatedAt: now,
                        ptc_folder: targetFolder,
                        revisions: []
                    };
                    const _tk6478 = store.getState().auth?.token;
                    const res = await fetch('/api/save-proposal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(_tk6478 ? { 'Authorization': 'Bearer ' + _tk6478 } : {}) },
                        body: JSON.stringify({ ptcFolder: targetFolder, type: 'comercial', content: empty, revisionFolder: '0' })
                    });
                    const r = await res.json();
                    if (!r.success) throw new Error(r.error || 'Erro ao criar Proposta Comercial vazia');
                }
                window.app._ensurePipelineItemForPtc(targetFolder, options?.cliente || sourceData?.cliente || '', options?.projeto || sourceData?.projeto || '', 0, '', 'separado');
            } else {
                statusEl.textContent = 'Salvando cópia...';
                await window.app.duplicateProposal('tecnica', sourceData, targetFolder, options);
            }

            modal.remove();
            app.toast(`Proposta Salva com o N\u00famero ${targetFolder}. Favor ir em "Buscar PTC" e abrir a Proposta.`, 'info');
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
        this.clearAiField('cliente');
        const sel = document.getElementById('pt_cliente');
        if (sel) { sel.classList.remove('ai-filled'); const lb = sel.closest('.form-group')?.querySelector('.ai-label'); if (lb) lb.remove(); }

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

        // 3. Buscar e preencher Cidade e UF
        const cidadeInput = document.getElementById('pt_cidade');
        const ufSelect = document.getElementById('pt_uf');
        const locInput = document.getElementById('pt_localizacao');

        if (client) {
            const cidade = client.cidade || client.city || '';
            const estado = client.estado || client.uf || '';
            if (cidadeInput) cidadeInput.value = cidade.trim();
            if (ufSelect) ufSelect.value = estado.trim().toUpperCase();
            if (locInput) locInput.value = [cidade.trim(), estado.trim().toUpperCase()].filter(Boolean).join('/');
        } else {
            if (cidadeInput) cidadeInput.value = '';
            if (ufSelect) ufSelect.value = '';
            if (locInput) locInput.value = '';
        }

        // 4. Disparar preenchimento de email/telefone pelo contato selecionado
        if (aosCuidados && primeiroContato) {
            this.handleContactSelection(primeiroContato.nome);
        }

        // 5. Auto-carregar logo do cliente (só se a proposta não tiver um valor explicitamente salvo)
        const ptProposalData = store.getState().activeTechnicalProposal;
        const clPreview = document.getElementById('pt_client_logo_preview');
        const clContainer = document.getElementById('pt_client_logo_preview_container');
        const clInput = document.getElementById('pt_client_logo_base64');
        if (!ptProposalData?.client_logo_base64 && client && client.logo && clPreview && clContainer && clInput) {
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

    removeClientLogo() {
        const preview = document.getElementById('pt_client_logo_preview');
        const container = document.getElementById('pt_client_logo_preview_container');
        const hidden = document.getElementById('pt_client_logo_base64');
        if (preview) preview.src = '';
        if (container) container.style.display = 'none';
        if (hidden) hidden.value = '';
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

        // Migração: se tem localizacao mas não tem cidade/uf, parsear
        if (!proposalCopy.cidade && !proposalCopy.uf && proposalCopy.localizacao) {
            const loc = proposalCopy.localizacao;
            let sep = loc.includes('/') ? '/' : loc.includes('-') ? '-' : null;
            if (sep) {
                const parts = loc.split(sep);
                if (parts.length >= 2) {
                    proposalCopy.cidade = parts.slice(0, -1).join(sep).trim();
                    proposalCopy.uf = parts[parts.length - 1].trim().toUpperCase();
                }
            }
        }

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

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.clearLoads()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-trash"></i> Limpar

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.importLoads()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-microsoft-excel-logo"></i> Importar Excel

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.loadLoadsModel()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-tray-arrow-down"></i> Carregar Modelo

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.saveLoadsList()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px;">

                        <i class="ph ph-floppy-disk"></i> Salvar Lista

                    </button>

                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.addLoadRow()" style="background: var(--color-accent); color: white; font-size: 11px; border-radius: 4px; padding: 6px 12px; font-weight: 700;">

                        <i class="ph ph-plus"></i> ${eq && eq.type === 'CUB-MT' ? 'Novo Cubículo' : 'Nova Carga'}

                    </button>

                </div>

            </div>



            <div class="table-container" style="border: 1px solid #e2e8f0; border-radius: 4px; overflow-x: auto; background: white;">

                <table class="w-full" style="font-size: 10px; border-collapse: collapse; min-width: 1000px;">

                    <thead>

                        <tr style="background: var(--color-accent); border-bottom: 2px solid #e2e8f0; color: #fff; text-transform: uppercase;">

                            <th style="padding: 10px; text-align: center; width: 30px;"><i class="ph ph-grip-vertical" style="opacity: 0.5;"></i></th>

                            <th style="padding: 10px; text-align: left; width: 60px;">TAG</th>

                            <th style="padding: 10px; text-align: left; width: 320px;">DESCRIÇÃO</th>

                            <th style="padding: 10px; text-align: center; width: 80px;">${eq && eq.type === 'CUB-MT' ? 'TENSÃO NOMINAL (KV)' : 'POTÊNCIA (CV)'}</th>

                            <th style="padding: 10px; text-align: center; width: 80px;">${eq && eq.type === 'CUB-MT' ? 'CORRENTE NOMINAL (A)' : 'TENSÃO (V)'}</th>

                            <th style="padding: 10px; text-align: center; width: 80px;">${eq && eq.type === 'CUB-MT' ? 'ICC(KA)(1S)' : 'COR. APROX (A)'}</th>

                            <th style="padding: 10px; text-align: center; width: 140px;">${eq && eq.type === 'CUB-MT' ? 'INSTALAÇÃO' : 'REGIME DE TRABALHO'}</th>

                            <th style="padding: 10px; text-align: center; width: 60px;">TIPO</th>

                            <th style="padding: 10px; text-align: left;">${eq && eq.type === 'CUB-MT' ? 'TÍPICO DE CUBÍCULO (COMPOSIÇÃO)' : 'TÍPICO DE PARTIDA (COMPOSIÇÃO)'}</th>

                            <th style="padding: 10px; width: 85px;"></th>

                        </tr>

                    </thead>

                    <tbody id="loads-body">

                        ${(eq.loads || []).map((load, idx) => `

                            <tr class="detailed-load-row"
                                draggable="true"
                                ondragstart="event.dataTransfer.setData('text/plain',${idx}); this.classList.add('dragging')"
                                ondragend="this.classList.remove('dragging')"
                                ondragover="event.preventDefault(); this.classList.add('drag-over')"
                                ondragleave="this.classList.remove('drag-over')"
                                ondrop="event.preventDefault(); this.classList.remove('drag-over'); window.propostaTecnicaModule.moveLoad(parseInt(event.dataTransfer.getData('text/plain')),${idx})"
                                style="border-bottom: 1px solid #f1f5f9;">

                                <td style="padding: 4px; width: 30px;"><i class="ph ph-grip-vertical" style="opacity: 0.3; font-size: 14px; cursor: grab;"></i></td>

                                <td style="padding: 4px;"><input type="text" name="dload_tag_${idx}" class="form-control" value="${load.tag || ''}" style="font-size: 11px; font-weight: 700; text-align: center; border-radius: 4px; height: 32px;"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_desc_${idx}" class="form-control" value="${load.desc || ''}" style="font-size: 11px; border-radius: 4px; height: 32px;"></td>

                                ${eq && eq.type === 'CUB-MT' ? `
                                <td style="padding: 4px;"><input type="text" name="dload_power_${idx}" class="form-control" value="${load.power || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_tensao_${idx}" class="form-control" value="${load.tensao || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_current_${idx}" class="form-control" value="${load.current || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; background: #f8fafc; height: 32px;" readonly></td>

                                <td style="padding: 4px;">

                                    <select name="dload_regime_${idx}" class="form-control" style="font-size: 11px; height: 32px; border-radius: 4px; text-align: center; padding: 0 4px;">

                                        <option value="Abrigada" ${load.regime === 'Abrigada' ? 'selected' : ''}>Abrigada</option>

                                        <option value="Ao Tempo" ${load.regime === 'Ao Tempo' ? 'selected' : ''}>Ao Tempo</option>

                                    </select>

                                </td>

                                <td style="padding: 4px;">

                                    <select name="dload_type_${idx}" class="form-control" style="text-align: center; font-size: 11px; font-weight: 700; border-radius: 4px; height: 32px;" onchange="window.propostaTecnicaModule.filterTypicalsByLoad(${idx})">

                                        <option value="">-- Selecione --</option>

                                        <option value="CE" ${load.type === 'CE' ? 'selected' : ''}>CE</option>

                                        <option value="CS" ${load.type === 'CS' ? 'selected' : ''}>CS</option>

                                        <option value="CM" ${load.type === 'CM' ? 'selected' : ''}>CM</option>

                                        <option value="CP" ${load.type === 'CP' ? 'selected' : ''}>CP</option>

                                        <option value="CT" ${load.type === 'CT' ? 'selected' : ''}>CT</option>

                                        <option value="CPS" ${load.type === 'CPS' ? 'selected' : ''}>CPS</option>

                                        <option value="CAN" ${load.type === 'CAN' ? 'selected' : ''}>CAN</option>

                                    </select>

                                </td>` : `
                                <td style="padding: 4px;"><input type="text" name="dload_power_${idx}" class="form-control" value="${load.power || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.calculateApproxCurrent(${idx});window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_tensao_${idx}" class="form-control" value="${load.tensao || '380'}" style="text-align: center; font-size: 11px; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.calculateApproxCurrent(${idx});window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>

                                <td style="padding: 4px;"><input type="text" name="dload_current_${idx}" class="form-control" value="${load.current || ''}" style="text-align: center; font-size: 11px; border-radius: 4px; background: #f8fafc; height: 32px;" readonly></td>

                                <td style="padding: 4px;">

                                    <select name="dload_regime_${idx}" class="form-control" style="font-size: 11px; height: 32px; border-radius: 4px; text-align: center; padding: 0 4px;">

                                        <option value="S1" ${load.regime === 'S1' ? 'selected' : ''}>S1 (Constante)</option>

                                        <option value="S2" ${load.regime === 'S2' ? 'selected' : ''}>S2 (Curta)</option>

                                        <option value="S3" ${load.regime === 'S3' ? 'selected' : ''}>S3 (Intermit.)</option>

                                    </select>

                                </td>

                                <td style="padding: 4px;"><input type="text" name="dload_type_${idx}" class="form-control" value="${load.type || 'IF'}" style="text-align: center; font-size: 11px; font-weight: 700; border-radius: 4px; height: 32px;" oninput="window.propostaTecnicaModule.filterTypicalsByLoad(${idx})"></td>`}

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

                        ${(eq.loads || []).length === 0 ? '<tr><td colspan="10" style="padding: 40px; text-align: center; color: #94a3b8;">Nenhuma carga definida. Clique em "+ Nova Carga" ou importe do Excel.</td></tr>' : ''}

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

        if (eq && eq.type === 'CUB-MT') {
            eq.loads.push({ tag: `C${eq.loads.length + 1}`, desc: '', power: '', tensao: '', regime: 'Abrigada', type: '' });
        } else {
            eq.loads.push({ tag: `M${eq.loads.length + 1}`, desc: '', power: '', tensao: '380', regime: 'S1', type: 'IF' });
        }

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

    filterTypicalsByLoad(index) {

        const row = document.querySelectorAll('.detailed-load-row')[index];

        if (!row) return;

        const isCubMt = (() => {
            const data = store.getState().activeTechnicalProposal;
            const eq = data?.equipments?.[this.activeEquipmentIndex];
            return eq && eq.type === 'CUB-MT';
        })();

        const powerInput = row.querySelector(`[name="dload_power_${index}"]`);

        const tensaoInput = row.querySelector(`[name="dload_tensao_${index}"]`);

        const typeInput = row.querySelector(`[name="dload_type_${index}"]`);

        const select = row.querySelector(`select[name="dload_typicalId_${index}"]`);

        if (!select) return;

        const powerVal = (powerInput?.value || '').trim();

        const tensaoVal = (tensaoInput?.value || '').trim();

        const typeVal = (typeInput?.value || '').trim();

        const currentSelected = select.value;

        if (isCubMt) {

            const cubiculos = store.getState().cubiculos || [];

            let filtered = cubiculos;

            if (powerVal) {
                filtered = filtered.filter(t => {
                    const tTensao = (t.tensao || '').trim();
                    return tTensao === powerVal || tTensao.startsWith(powerVal);
                });
            }

            if (tensaoVal) {
                filtered = filtered.filter(t => {
                    const tCorrente = (t.correnteNominal || '').trim();
                    return tCorrente === tensaoVal || tCorrente.startsWith(tensaoVal);
                });
            }

            if (typeVal) {
                const cubTypeSiglaToNome = {
                    'CE': 'Cubículo de Entrada',
                    'CS': 'Cubículo de Seccionamento',
                    'CM': 'Cubículo de Medição',
                    'CP': 'Cubículo de Proteção',
                    'CT': 'Cubículo de Transformação',
                    'CPS': 'Cubículo de Proteção Contra Surto',
                    'CAN': 'Cubículo Aterramento de Neutro'
                };
                const tipoNome = cubTypeSiglaToNome[typeVal.toUpperCase()];
                if (tipoNome) {
                    filtered = filtered.filter(t => t.tipoAcionamento === tipoNome);
                } else {
                    filtered = filtered.filter(t =>
                        (t.tipoAcionamento || '').toLowerCase().includes(typeVal.toLowerCase())
                    );
                }
            }

            select.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = filtered.length > 0 ? '-- Selecione --' : '-- Nenhum típico encontrado --';
            select.appendChild(defaultOption);

            filtered.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.nome;
                select.appendChild(option);
            });

            if (currentSelected && filtered.some(t => t.id === currentSelected)) {
                select.value = currentSelected;
            }

            return;

        }

        const tipicos = store.getState().tipicos || [];

        const typeToTipoAcionamento = {
            'IF': 'Inversor de Frequência',
            'SS': 'Soft-Starter',
            'PD': 'Partida Direta',
            'PDR': 'Partida Direta Reversora',
            'ET': 'Estrela-Triângulo',
            'AL': 'Alimentador',
            'EG': 'Entrada Geral',
            'ME': 'Medição',
            'CS': 'Comando e Sinalização',
            'SA': 'Serviços Auxiliares',
            'BC': 'Banco de Capacitores',
            'PNMT': 'Cubículo MT'
        };

        let filtered = tipicos;

        if (powerVal) {
            const powerNum = parseFloat(powerVal.replace(',', '.'));
            if (!isNaN(powerNum)) {
                filtered = filtered.filter(t => {
                    const tPower = parseFloat((t.potencia || t.potenciaKvar || '').replace(',', '.'));
                    return !isNaN(tPower) && tPower === powerNum;
                });
            }
        }

        if (tensaoVal) {
            filtered = filtered.filter(t => {
                const tTensao = (t.tensao || '').trim();
                return tTensao === tensaoVal || tTensao.startsWith(tensaoVal + '/');
            });
        }

        if (typeVal) {
            const tipoAcionamento = typeToTipoAcionamento[typeVal.toUpperCase()];
            if (tipoAcionamento) {
                filtered = filtered.filter(t => t.tipoAcionamento === tipoAcionamento);
            } else {
                filtered = filtered.filter(t =>
                    (t.tipoAcionamento || '').toLowerCase().includes(typeVal.toLowerCase())
                );
            }
        }

        select.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = filtered.length > 0 ? '-- Selecione --' : '-- Nenhum típico encontrado --';
        select.appendChild(defaultOption);

        filtered.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = t.nome;
            select.appendChild(option);
        });

        if (currentSelected && filtered.some(t => t.id === currentSelected)) {
            select.value = currentSelected;
        }

    },

    renderIOList(eq) {
        const io = eq.ioList || { racks: [] };
        const racks = io.racks || [];
        const isEmpty = racks.length === 0;
        const totals = this._calcIOTotals(racks);

        const sel = (v, options) => options.map(o =>
            `<option value="${o}" ${v === o ? 'selected' : ''}>${o}</option>`
        ).join('');

        return `
            <div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
                    <div style="flex: 1; min-width: 140px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 800; color: #1d4ed8;">${totals.totalDI}</div>
                        <div style="font-size: 11px; color: #3b82f6; font-weight: 600;">Entradas Digitais</div>
                        <div style="font-size: 10px; color: #60a5fa;">${totals.spareDI} reservas</div>
                    </div>
                    <div style="flex: 1; min-width: 140px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 800; color: #15803d;">${totals.totalDO}</div>
                        <div style="font-size: 11px; color: var(--color-accent); font-weight: 600;">Saídas Digitais</div>
                        <div style="font-size: 10px; color: #4ade80;">${totals.spareDO} reservas</div>
                    </div>
                    <div style="flex: 1; min-width: 140px; background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 800; color: #a16207;">${totals.totalAI}</div>
                        <div style="font-size: 11px; color: #ca8a04; font-weight: 600;">Entradas Analógicas</div>
                        <div style="font-size: 10px; color: #eab308;">${totals.spareAI} reservas</div>
                    </div>
                    <div style="flex: 1; min-width: 140px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 800; color: #c2410c;">${totals.totalAO}</div>
                        <div style="font-size: 11px; color: #ea580c; font-weight: 600;">Saídas Analógicas</div>
                        <div style="font-size: 10px; color: #f97316;">${totals.spareAO} reservas</div>
                    </div>
                </div>

                <div style="margin-bottom: 16px; display: flex; gap: 8px; align-items: center;">
                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule.addIORack()" style="background: #0f172a; color: white; font-size: 11px; border-radius: 4px; padding: 6px 12px; font-weight: 700;">
                        <i class="ph ph-plus"></i> Novo Rack
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.importIOList()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-microsoft-excel-logo"></i> Importar Excel
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.loadIOTemplate()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-tray-arrow-down"></i> Carregar Template
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.saveIOTemplate()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-floppy-disk"></i> Salvar Template
                    </button>
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.openIOTypeTypicals()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-gear-six"></i> Típicos I/O
                    </button>
                    <div style="position:relative;display:inline-block;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.toggleIOExportMenu()" style="font-size: 11px; border-radius: 4px;">
                            <i class="ph ph-download-simple"></i> Exportar ▾
                        </button>
                        <div id="io-export-menu" style="display:none;position:absolute;top:100%;right:0;margin-top:4px;background:white;border:1px solid #e2e8f0;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:100;min-width:140px;overflow:hidden;">
                            <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.exportIOListCSV()" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#1e293b;text-decoration:none;border-bottom:1px solid #f1f5f9;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                                <i class="ph ph-file-csv" style="color:var(--color-accent);"></i> CSV
                            </a>
                            <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.exportIOListXLSX()" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#1e293b;text-decoration:none;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                                <i class="ph ph-file-xls" style="color:#3b82f6;"></i> XLSX (Formatado)
                            </a>
                        </div>
                    </div>
                </div>

                ${isEmpty ? `
                    <div style="padding: 60px; text-align: center; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 8px;">
                        <i class="ph ph-plugs" style="font-size: 48px; opacity: 0.2;"></i>
                        <p style="margin-top: 10px;">Nenhum rack configurado. Clique em "+ Novo Rack" ou importe do Excel.</p>
                    </div>
                ` : racks.map((rack, ri) => `
                    <div class="io-rack-row" style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; overflow: hidden; background: white;">
                        <div style="background: #f1f5f9; padding: 10px 16px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0;">
                            <span style="font-weight: 700; font-size: 13px; color: #1e293b; min-width: 60px;">Rack ${ri + 1}</span>
                            <input type="text" name="io_rack_pos_${ri}" value="${rack.position ?? ri + 1}" placeholder="Pos." style="width: 50px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            <span style="font-size: 11px; color: #64748b;">BP:</span>
                            <input type="text" name="io_rack_bp_${ri}" value="${rack.backplane || ''}" placeholder="Ex: 1756-A7" style="width: 100px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            <span style="font-size: 11px; color: #64748b;">Fonte:</span>
                            <input type="text" name="io_rack_ps_${ri}" value="${rack.powerSupply || ''}" placeholder="Ex: 1756-PA72" style="width: 100px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            <span style="font-size: 11px; color: #64748b;">CPU:</span>
                            <input type="text" name="io_rack_cpu_${ri}" value="${rack.cpu || ''}" placeholder="Ex: 1756-L71" style="width: 100px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            <span style="font-size: 11px; color: #64748b;">COMM:</span>
                            <input type="text" name="io_rack_comm_${ri}" value="${rack.comm || ''}" placeholder="Ex: 1756-EN2T" style="width: 100px; font-size: 11px; border:1px solid #e2e8f0; border-radius: 4px; padding: 4px 6px;">
                            <div style="flex:1;"></div>
                            <button type="button" onclick="window.propostaTecnicaModule.duplicateIORack(${ri})" class="btn-icon" style="color: #64748b; background: white; border: 1px solid #e2e8f0; width: 26px; height: 26px; border-radius: 4px;" title="Duplicar Rack"><i class="ph ph-copy"></i></button>
                            <button type="button" onclick="window.propostaTecnicaModule.addIOSlot(${ri})" class="btn-icon" style="color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; width: 26px; height: 26px; border-radius: 4px;" title="Adicionar Slot"><i class="ph ph-plus"></i></button>
                            ${store.canDelete() ? `<button type="button" onclick="window.propostaTecnicaModule.removeIORack(${ri})" class="btn-icon" style="color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2; width: 26px; height: 26px; border-radius: 4px;" title="Excluir Rack"><i class="ph ph-trash"></i></button>` : ''}
                        </div>
                        <div style="overflow-x: auto;">
                            <table style="font-size: 10px; border-collapse: collapse; width: 100%;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 6px 6px; text-align: center; width: 36px;">Slot</th>
                                        <th style="padding: 6px 6px; text-align: left; width: 100px;">Módulo (PN)</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 56px;">Tipo</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 66px;">Sinal</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 42px;">N°Ch</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 44px;">Can.</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 36px;">Tp</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 46px;">Nv</th>
                                        <th style="padding: 6px 6px; text-align: left; width: 72px;">Tag</th>
                                        <th style="padding: 6px 6px; text-align: left;">Dispositivo de Campo</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 48px;">Borne</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 42px;">Status</th>
                                        <th style="padding: 6px 6px; text-align: center; width: 50px;">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(rack.slots || []).length === 0 ? `
                                        <tr>
                                            <td colspan="13" style="padding: 20px; text-align: center; color: #94a3b8;">
                                                Nenhum slot. <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.addIOSlot(${ri})" style="color: #3b82f6;">Adicionar slot</a>
                                            </td>
                                        </tr>
                                    ` : (rack.slots || []).map((slot, si) => {
                                        const channels = slot.channels || [];
                                        const slotTypeOptions = ['DI','DO','AI','AO','TC','RTD','COMM','CNT','PS'];
                                        const chTypeOptions = ['DI','DO','AI','AO','TC','RTD'];
                                        const signalOptions = ['24VDC','48VDC','120VAC','220VAC','0-10V','4-20mA','0-5V','TC-K','TC-J','PT100','RTD','Termopar'];
                                        const statusOptions = ['active','spare','unused','critical'];
                                        if (channels.length === 0) {
                                            return `
                                                <tr class="io-slot-row" style="border-bottom: 1px solid #f1f5f9;">
                                                    <td style="padding: 3px 6px;"><input type="text" name="io_slot_pos_${ri}_${si}" value="${slot.position ?? si + 1}" style="width:28px;text-align:center;font-size:10px;font-weight:700;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                    <td style="padding: 3px 6px;"><input type="text" name="io_slot_pn_${ri}_${si}" value="${slot.modulePartNumber || ''}" placeholder="PN" style="width:92px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                    <td style="padding: 3px 6px;"><select name="io_slot_type_${ri}_${si}" style="width:52px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;">${sel(slot.moduleType, slotTypeOptions)}</select></td>
                                                    <td style="padding: 3px 6px;"><input type="text" name="io_slot_signal_${ri}_${si}" value="${slot.signalType || ''}" placeholder="Sinal" style="width:58px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                    <td style="padding: 3px 6px;"><input type="text" name="io_slot_channels_${ri}_${si}" value="${slot.totalChannels ?? ''}" style="width:34px;text-align:center;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                    <td colspan="${store.canDelete() ? 7 : 8}" style="padding: 3px 6px; text-align: center; color: #94a3b8;">
                                                        Sem canais
                                                        <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.addIOChannel(${ri},${si})" style="color:#3b82f6;margin-left:8px;">+ canal</a>
                                                    </td>
                                                    ${store.canDelete() ? `<td style="padding: 3px 6px; text-align: center;"><button type="button" onclick="window.propostaTecnicaModule.removeIOSlot(${ri},${si})" class="btn-icon" style="color:#ef4444;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Excluir Slot"><i class="ph ph-x-circle"></i></button></td>` : ''}
                                                </tr>
                                            `;
                                        }
                                        return channels.map((ch, ci) => `
                                            <tr class="io-channel-row" style="border-bottom: 1px solid #f1f5f9;">
                                                ${ci === 0 ? `
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><input type="text" name="io_slot_pos_${ri}_${si}" value="${slot.position ?? si + 1}" style="width:28px;text-align:center;font-size:10px;font-weight:700;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><input type="text" name="io_slot_pn_${ri}_${si}" value="${slot.modulePartNumber || ''}" placeholder="PN" style="width:92px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><select name="io_slot_type_${ri}_${si}" style="width:52px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;">${sel(slot.moduleType, slotTypeOptions)}</select></td>
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><input type="text" name="io_slot_signal_${ri}_${si}" value="${slot.signalType || ''}" placeholder="Sinal" style="width:58px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                    <td style="padding: 3px 6px; border-bottom: none;" rowspan="${channels.length}"><input type="text" name="io_slot_channels_${ri}_${si}" value="${slot.totalChannels ?? ''}" style="width:34px;text-align:center;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                ` : ''}
                                                <td style="padding: 3px 6px;"><input type="text" name="io_ch_num_${ri}_${si}_${ci}" value="${ch.channelNumber ?? ci}" style="width:32px;text-align:center;font-size:10px;font-weight:600;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;"></td>
                                                <td style="padding: 3px 6px;"><select name="io_ch_type_${ri}_${si}_${ci}" style="width:36px;font-size:9px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;">${sel(ch.channelType || slot.moduleType || 'DI', chTypeOptions)}</select></td>
                                                <td style="padding: 3px 6px;"><select name="io_ch_signal_${ri}_${si}_${ci}" style="width:44px;font-size:9px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;">${sel(ch.signalLevel || slot.signalType || '24VDC', signalOptions)}</select></td>
                                                <td style="padding: 3px 6px;"><input type="text" name="io_ch_tag_${ri}_${si}_${ci}" value="${ch.tag || ''}" placeholder="Tag" style="width:84px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                <td style="padding: 3px 6px;"><input type="text" name="io_ch_device_${ri}_${si}_${ci}" value="${ch.fieldDevice || ''}" placeholder="Dispositivo" style="width:300px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                <td style="padding: 3px 6px;"><input type="text" name="io_ch_terminal_${ri}_${si}_${ci}" value="${ch.terminalNumber || ''}" placeholder="Borne" style="width:40px;font-size:10px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 4px;"></td>
                                                <td style="padding: 3px 6px;">
                                                    <select name="io_ch_status_${ri}_${si}_${ci}" style="width:42px;font-size:9px;border:1px solid #e2e8f0;border-radius:3px;padding:3px 2px;background:${ch.status === 'spare' ? '#fef3c7' : ch.status === 'critical' ? '#fef2f2' : '#fff'};">
                                                        ${sel(ch.status || 'active', statusOptions)}
                                                    </select>
                                                </td>
                                                <td style="padding: 3px 6px; white-space: nowrap;">
                                                    ${ci === 0 ? `<button type="button" onclick="window.propostaTecnicaModule.addIOChannel(${ri},${si})" class="btn-icon" style="color:#15803d;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Add Canal"><i class="ph ph-plus-circle"></i></button>` : `<button type="button" onclick="window.propostaTecnicaModule.addIOChannel(${ri},${si})" class="btn-icon" style="color:#15803d;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Add Canal"><i class="ph ph-plus-circle"></i></button>`}
                                                    ${store.canDelete() ? `<button type="button" onclick="window.propostaTecnicaModule.removeIOChannel(${ri},${si},${ci})" class="btn-icon" style="color:#ef4444;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Excluir Canal"><i class="ph ph-minus-circle"></i></button>` : ''}
                                                    ${ci === 0 && store.canDelete() ? `<button type="button" onclick="window.propostaTecnicaModule.removeIOSlot(${ri},${si})" class="btn-icon" style="color:#ef4444;background:transparent;border:none;width:20px;height:20px;padding:0;font-size:12px;cursor:pointer;" title="Excluir Slot"><i class="ph ph-x-circle"></i></button>` : ''}
                                                </td>
                                            </tr>
                                        `).join('');
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    toggleIOExportMenu() {
        const menu = document.getElementById('io-export-menu');
        if (!menu) return;
        const isOpen = menu.style.display !== 'none';
        menu.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) {
            const close = (e) => {
                if (!menu.contains(e.target) && e.target !== menu.previousElementSibling) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', close);
                }
            };
            setTimeout(() => document.addEventListener('click', close), 0);
        }
    },

    exportIOListCSV() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const io = eq.ioList || { racks: [] };
        const racks = io.racks || [];
        if (racks.length === 0) { app.toast('Nenhum dado de I/O para exportar.', 'warning'); return; }

        const rows = [['Rack','Slot','Módulo (PN)','Tipo Módulo','Sinal','NºCh','Ch#','Tipo','Nível Sinal','Tag','Dispositivo de Campo','Borne','Wire Color','Wire #','Cable ID','Junction Box','Status','Notas']];
        racks.forEach((rack, ri) => {
            (rack.slots || []).forEach((slot, si) => {
                const channels = slot.channels || [];
                if (channels.length === 0) {
                    rows.push([rack.position ?? ri + 1, slot.position ?? si + 1, slot.modulePartNumber || '', slot.moduleType || '', slot.signalType || '', slot.totalChannels ?? '', '', '', '', '', '', '', '', '', '', '', '', '']);
                } else {
                    channels.forEach((ch, ci) => {
                        rows.push([
                            rack.position ?? ri + 1,
                            slot.position ?? si + 1,
                            slot.modulePartNumber || '',
                            slot.moduleType || '',
                            slot.signalType || '',
                            slot.totalChannels ?? '',
                            ch.channelNumber ?? ci,
                            ch.channelType || slot.moduleType || '',
                            ch.signalLevel || slot.signalType || '',
                            ch.tag || '',
                            ch.fieldDevice || '',
                            ch.terminalNumber || '',
                            ch.wireColor || '',
                            ch.wireNumber || '',
                            ch.cableId || '',
                            ch.junctionBox || '',
                            ch.status || 'active',
                            ch.notes || ''
                        ]);
                    });
                }
            });
        });

        const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IO_List_${eq.tag}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        app.toast('I/O List exportada como CSV!', 'success');
    },

    exportIOListXLSX() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const io = eq.ioList || { racks: [] };
        const racks = io.racks || [];
        if (racks.length === 0) { app.toast('Nenhum dado de I/O para exportar.', 'warning'); return; }

        const payload = {
            ioList: io,
            tag: eq.tag
        };

        fetch('/api/export-io-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(async res => {
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Erro ao exportar');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `IO_List_${eq.tag}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            app.toast('I/O List exportada com formatação!', 'success');
        }).catch(err => {
            console.error('[Export IO List]', err);
            app.toast(err.message || 'Erro ao exportar XLSX.', 'error');
        });
    },

    openIOTypeTypicals() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (!eq.ioList.ioTypicals) {
            eq.ioList.ioTypicals = {
                DI: { terminalBlocks: 1, fuseTerminal: true, relayTerminal: false, surgeProtector: false, wireColor: 'blue', wiringType: '2-wire', cableType: 'standard', notes: '' },
                DO: { terminalBlocks: 1, fuseTerminal: false, relayTerminal: true, surgeProtector: false, wireColor: 'red', wiringType: '2-wire', cableType: 'standard', notes: '' },
                AI: { terminalBlocks: 3, fuseTerminal: false, relayTerminal: false, surgeProtector: true, wireColor: 'green', wiringType: '3-wire', cableType: 'shielded-twisted-pair', notes: '' },
                AO: { terminalBlocks: 2, fuseTerminal: false, relayTerminal: false, surgeProtector: false, wireColor: 'yellow', wiringType: '2-wire', cableType: 'shielded', notes: '' }
            };
        }
        this._showIOTypeTypicalsModal(eq);
    },

    _showIOTypeTypicalsModal(eq) {
        if (document.getElementById('modal-io-typicals')) return;
        const typ = eq.ioList.ioTypicals;
        const sel = (id, val, opts) => `<select id="${id}" style="width:100%;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;padding:4px 6px;">${opts.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
        const colors = ['blue','red','green','yellow','white','black','gray','brown','orange','purple'];
        const wirings = ['2-wire','3-wire','4-wire'];
        const cables = ['standard','shielded','shielded-twisted-pair','compensation-TC','compensation-RTD','multi-conductor'];

        const card = (type, label, t) => `
            <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:10px;">${label}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;font-size:11px;">
                    <label>Bornes</label>
                    <input type="number" id="iot_${type}_terminalBlocks" value="${t.terminalBlocks}" min="0" style="width:100%;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;padding:4px 6px;">
                    <label>Fusível</label>
                    <input type="checkbox" id="iot_${type}_fuseTerminal" ${t.fuseTerminal ? 'checked' : ''} style="justify-self:start;">
                    <label>Relé</label>
                    <input type="checkbox" id="iot_${type}_relayTerminal" ${t.relayTerminal ? 'checked' : ''} style="justify-self:start;">
                    <label>Supressor</label>
                    <input type="checkbox" id="iot_${type}_surgeProtector" ${t.surgeProtector ? 'checked' : ''} style="justify-self:start;">
                    <label>Cor do fio</label>
                    ${sel(`iot_${type}_wireColor`, t.wireColor, colors)}
                    <label>Tipo ligação</label>
                    ${sel(`iot_${type}_wiringType`, t.wiringType, wirings)}
                    <label>Tipo cabo</label>
                    ${sel(`iot_${type}_cableType`, t.cableType, cables)}
                    <label style="grid-column:1/-1;">Observação</label>
                    <textarea id="iot_${type}_notes" style="grid-column:1/-1;width:100%;font-size:11px;border:1px solid #e2e8f0;border-radius:4px;padding:4px 6px;resize:vertical;" rows="2">${t.notes || ''}</textarea>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.id = 'modal-io-typicals';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
            <div style="background:white;border-radius:12px;width:820px;max-width:95vw;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
                <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:700;font-size:15px;color:#1e3a8a;"><i class="ph ph-gear-six"></i> Típicos I/O — ${eq.tag}</span>
                    <button onclick="document.getElementById('modal-io-typicals').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#94a3b8;">✕</button>
                </div>
                <div style="padding:16px 20px;overflow-y:auto;flex:1;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    ${card('DI','Entradas Digitais (DI)',typ.DI)}
                    ${card('DO','Saídas Digitais (DO)',typ.DO)}
                    ${card('AI','Entradas Analógicas (AI)',typ.AI)}
                    ${card('AO','Saídas Analógicas (AO)',typ.AO)}
                </div>
                <div style="padding:12px 20px;border-top:1px solid #e2e8f0;display:flex;gap:8px;justify-content:flex-end;background:#f8fafc;border-radius:0 0 12px 12px;">
                    <button type="button" class="btn btn-sm btn-ghost" onclick="document.getElementById('modal-io-typicals').remove();window.propostaTecnicaModule.saveIOTypeTypicalsAsTemplate()" style="font-size:11px;border-radius:4px;"><i class="ph ph-floppy-disk"></i> Salvar como Template</button>
                    <button type="button" class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule.loadIOTypeTypicalsTemplate()" style="font-size:11px;border-radius:4px;"><i class="ph ph-tray-arrow-down"></i> Carregar Template</button>
                    <button type="button" class="btn btn-sm" onclick="window.propostaTecnicaModule._saveIOTypeTypicals()" style="background:#0f172a;color:white;font-size:11px;border-radius:4px;padding:6px 16px;font-weight:700;"><i class="ph ph-check"></i> Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _saveIOTypeTypicals() {
        const modal = document.getElementById('modal-io-typicals');
        if (!modal) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const typ = eq.ioList.ioTypicals;
        const read = (type, field, parse) => {
            const el = document.getElementById(`iot_${type}_${field}`);
            if (!el) return;
            const val = parse ? parse(el) : el.value;
            typ[type][field] = val;
        };
        const bool = (el) => el.checked;
        ['DI','DO','AI','AO'].forEach(type => {
            read(type,'terminalBlocks', el => parseInt(el.value) || 0);
            read(type,'fuseTerminal', bool);
            read(type,'relayTerminal', bool);
            read(type,'surgeProtector', bool);
            read(type,'wireColor');
            read(type,'wiringType');
            read(type,'cableType');
            read(type,'notes');
        });
        store.setState({ activeTechnicalProposal: data });
        modal.remove();
        app.toast('Típicos I/O salvos!', 'success');
    },

    saveIOTypeTypicalsAsTemplate() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const modal = document.getElementById('modal-io-typicals');
        if (modal) modal.remove();

        const name = prompt('Nome do template de Típicos I/O:');
        if (!name) return;
        const loadLists = store.getState().loadLists || [];
        const existingIndex = loadLists.findIndex(l => l.name === name && l.source === 'io-typical-template');
        if (existingIndex >= 0) {
            if (!confirm(`Template "${name}" já existe. Sobrescrever?`)) return;
            loadLists.splice(existingIndex, 1);
        }
        loadLists.push({
            name,
            data: JSON.parse(JSON.stringify(eq.ioList.ioTypicals)),
            source: 'io-typical-template',
            createdAt: new Date().toISOString()
        });
        store.setState({ loadLists });
        app.toast(`Template "${name}" salvo!`, 'success');
    },

    loadIOTypeTypicalsTemplate() {
        const loadLists = store.getState().loadLists || [];
        const templates = loadLists.filter(l => l.source === 'io-typical-template');
        if (document.getElementById('modal-load-io-typicals-template')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-load-io-typicals-template';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:1000;display:flex;align-items:center;justify-content:center;';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        if (templates.length === 0) {
            modal.innerHTML = `
                <div style="background:white;border-radius:12px;padding:30px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
                    <p style="color:#64748b;">Nenhum template de Típicos I/O salvo.</p>
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('modal-load-io-typicals-template').remove()" style="margin-top:10px;">Fechar</button>
                </div>
            `;
            document.body.appendChild(modal);
            return;
        }

        modal.innerHTML = `
            <div style="background:white;border-radius:12px;width:460px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.2);">
                <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:700;font-size:15px;color:#1e3a8a;"><i class="ph ph-tray-arrow-down"></i> Carregar Template</span>
                    <button onclick="document.getElementById('modal-load-io-typicals-template').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#94a3b8;">✕</button>
                </div>
                <div style="padding:12px 20px;max-height:300px;overflow-y:auto;">
                    ${templates.map(t => `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;">
                            <span style="font-size:13px;color:#1e293b;">${t.name}</span>
                            <div style="display:flex;gap:6px;">
                                <button class="btn btn-sm" onclick="window.propostaTecnicaModule._confirmIOTypeTypicalsTemplate('${t.name.replace(/'/g, "\\'")}')" style="background:#0f172a;color:white;font-size:10px;border-radius:4px;padding:4px 10px;">Aplicar</button>
                                <button class="btn btn-sm btn-ghost" onclick="window.propostaTecnicaModule._deleteIOTypeTypicalsTemplate('${t.name.replace(/'/g, "\\'")}')" style="color:#ef4444;font-size:10px;border-radius:4px;padding:4px 10px;">Excluir</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="padding:12px 20px;border-top:1px solid #e2e8f0;text-align:right;background:#f8fafc;border-radius:0 0 12px 12px;">
                    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('modal-load-io-typicals-template').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    _confirmIOTypeTypicalsTemplate(name) {
        if (!confirm(`Aplicar template "${name}"? Isso substituirá os Típicos I/O atuais.`)) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const loadLists = store.getState().loadLists || [];
        const template = loadLists.find(l => l.name === name && l.source === 'io-typical-template');
        if (!template) { app.toast('Template não encontrado.', 'error'); return; }
        eq.ioList.ioTypicals = JSON.parse(JSON.stringify(template.data));
        store.setState({ activeTechnicalProposal: data });

        const modal = document.getElementById('modal-io-typicals');
        if (modal) modal.remove();
        this._showIOTypeTypicalsModal(eq);
        app.toast(`Template "${name}" aplicado!`, 'success');
    },

    _deleteIOTypeTypicalsTemplate(name) {
        if (!confirm(`Excluir template "${name}"?`)) return;
        const loadLists = store.getState().loadLists || [];
        const idx = loadLists.findIndex(l => l.name === name && l.source === 'io-typical-template');
        if (idx >= 0) {
            loadLists.splice(idx, 1);
            store.setState({ loadLists });
            document.getElementById('modal-load-io-typicals-template')?.remove();
            this.loadIOTypeTypicalsTemplate();
        }
    },

    _calcIOTotals(racks) {
        let totalDI = 0, totalDO = 0, totalAI = 0, totalAO = 0;
        let spareDI = 0, spareDO = 0, spareAI = 0, spareAO = 0;
        racks.forEach(rack => {
            (rack.slots || []).forEach(slot => {
                (slot.channels || []).forEach(ch => {
                    const type = (ch.channelType || slot.moduleType || '').toUpperCase();
                    const isSpare = ch.status === 'spare' || ch.status === 'unused';
                    if (type === 'DI') { totalDI++; if (isSpare) spareDI++; }
                    else if (type === 'DO') { totalDO++; if (isSpare) spareDO++; }
                    else if (type === 'AI') { totalAI++; if (isSpare) spareAI++; }
                    else if (type === 'AO') { totalAO++; if (isSpare) spareAO++; }
                });
            });
        });
        return { totalDI, totalDO, totalAI, totalAO, spareDI, spareDO, spareAI, spareAO };
    },

    renderAutomationBOM(eq) {
        const io = eq.ioList || { racks: [] };
        const hasRacks = io.racks && io.racks.length > 0 && io.racks.some(r => (r.slots || []).length > 0);

        if (!hasRacks) {
            return `
                <div style="padding: 60px; text-align: center; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 8px;">
                    <i class="ph ph-list-bullets" style="font-size: 48px; opacity: 0.2;"></i>
                    <p style="margin-top: 10px; font-weight: 600;">Nenhum material derivado</p>
                    <p style="font-size: 12px; margin-top: 4px;">Configure a Lista de I/O com racks, slots e canais para gerar a lista de materiais automaticamente.</p>
                </div>
            `;
        }

        const result = deriveMaterials(io);
        const { items, total } = result;

        if (!eq.automationMaterials || eq.automationMaterials.length === 0) {
            eq.automationMaterials = (items || []).map(item => ({
                materialId: item.materialId || '',
                descricao: item.descricao,
                fabricante: item.fabricante || '',
                codigoFabricante: item.codigoFabricante || '',
                modelo: '',
                custo: item.custoUnitario || 0,
                qtd: item.qtd || 0,
                icms: item.icms || 0,
                ipi: item.ipi || 0,
                pis: item.pis || 0,
                cofins: item.cofins || 0
            }));
            const data = store.getState().activeTechnicalProposal;
            if (data) store.setState({ activeTechnicalProposal: data });
        }

        if (items.length === 0) {
            return `<div style="padding:40px;text-align:center;color:#94a3b8;">Nenhum material derivado da configuração de I/O atual.</div>`;
        }

        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.categoria]) grouped[item.categoria] = [];
            grouped[item.categoria].push(item);
        });

        const categoryIcons = {
            'Estrutura': 'ph-cpu',
            'Fontes': 'ph-lightning',
            'Bornes': 'ph-plugs-connected',
            'Bornes Fusíveis': 'ph-shield-check',
            'Relés': 'ph-swap',
            'Cabos': 'ph-warning-circle',
            'Eletrodutos': 'ph-warning',
            'Canaletas': 'ph-squares-four',
            'Conectores': 'ph-plug'
        };

        return `
            <div style="animation: fadeIn 0.3s ease;">
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 20px;">
                    <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.refreshAutomationBOM()" style="font-size: 11px; border-radius: 4px;">
                        <i class="ph ph-arrows-clockwise"></i> Recalcular
                    </button>
                    <div style="position:relative;display:inline-block;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.propostaTecnicaModule.toggleBOMExportMenu()" style="font-size: 11px; border-radius: 4px;">
                            <i class="ph ph-download-simple"></i> Exportar ▾
                        </button>
                        <div id="bom-export-menu" style="display:none;position:absolute;top:100%;right:0;margin-top:4px;background:white;border:1px solid #e2e8f0;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:100;min-width:140px;overflow:hidden;">
                            <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.exportAutomationBOMCSV()" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#1e293b;text-decoration:none;border-bottom:1px solid #f1f5f9;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                                <i class="ph ph-file-csv" style="color:var(--color-accent);"></i> CSV
                            </a>
                            <a href="#" onclick="event.preventDefault();window.propostaTecnicaModule.exportAutomationBOMXLSX()" style="display:flex;align-items:center;gap:8px;padding:10px 14px;font-size:12px;color:#1e293b;text-decoration:none;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                                <i class="ph ph-file-xls" style="color:#3b82f6;"></i> XLSX (Formatado)
                            </a>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 20px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${items.length}</div>
                        <div style="font-size: 11px; color: #64748b;">Itens</div>
                    </div>
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 20px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #15803d;">${app.formatCurrency(total)}</div>
                        <div style="font-size: 11px; color: var(--color-accent);">Valor Total Estimado</div>
                    </div>
                </div>

                ${Object.entries(grouped).map(([cat, catItems]) => `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; overflow: hidden; background: white;">
                        <div style="background: #f1f5f9; padding: 10px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e2e8f0;">
                            <i class="ph ${categoryIcons[cat] || 'ph-circle'}"></i>
                            <span style="font-weight: 700; font-size: 13px; color: #1e293b;">${cat}</span>
                            <span style="font-size: 11px; color: #64748b;">${catItems.length} item(ns)</span>
                        </div>
                        <div style="overflow-x: auto;">
                            <table style="font-size: 11px; border-collapse: collapse; width: 100%; table-layout: fixed;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                        <th style="padding: 8px 12px; text-align: left;">Descrição</th>
                                        <th style="padding: 8px 12px; text-align: center; width: 60px;">Qtd</th>
                                        <th style="padding: 8px 12px; text-align: center; width: 50px;">Un.</th>
                                        <th style="padding: 8px 12px; text-align: right; width: 100px;">Custo Unit.</th>
                                        <th style="padding: 8px 12px; text-align: right; width: 100px;">Custo Total</th>
                                        <th style="padding: 8px 12px; text-align: right; width: 80px;">ICMS</th>
                                        <th style="padding: 8px 12px; text-align: right; width: 80px;">IPI</th>
                                        <th style="padding: 8px 12px; text-align: left; width: 180px;">Ref. Catálogo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${catItems.map(item => {
                                        const cands = item.candidates || [];
                                        const groupedFab = {};
                                        cands.forEach(c => {
                                            const fab = c.fabricante || 'Outros';
                                            if (!groupedFab[fab]) groupedFab[fab] = [];
                                            groupedFab[fab].push(c);
                                        });
                                        const selOpts = cands.length > 0
                                            ? `<option value="">(nenhum)</option>${Object.entries(groupedFab).map(([fab, items]) =>
                                                `<optgroup label="${fab}">${items.map(c =>
                                                    `<option value="${c.id}" ${c.id === item.materialId ? 'selected' : ''}>${c.codigoFabricante || c.descricao} — ${app.formatCurrency(c.custo)}</option>`
                                                ).join('')}</optgroup>`
                                            ).join('')}`
                                            : '';
                                        return `
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 6px 12px;">${item.descricao}</td>
                                            <td style="padding: 6px 12px; text-align: center; font-weight: 600; width: 60px;">${item.qtd}</td>
                                            <td style="padding: 6px 12px; text-align: center; width: 50px;">${item.unidade || 'un'}</td>
                                            <td style="padding: 6px 12px; text-align: right; width: 100px;">${item.materialId ? app.formatCurrency(item.custoUnitario) : '-'}</td>
                                            <td style="padding: 6px 12px; text-align: right; font-weight: 700; width: 100px;">${item.materialId ? app.formatCurrency(item.custoUnitario * item.qtd) : '-'}</td>
                                            <td style="padding: 6px 12px; text-align: right; width: 80px; font-size: 10px; color: #475569;">${(item.icms && item.materialId) ? app.formatCurrency(item.custoUnitario * item.qtd * item.icms / 100) + ' (' + item.icms + '%)' : '-'}</td>
                                            <td style="padding: 6px 12px; text-align: right; width: 80px; font-size: 10px; color: #475569;">${(item.ipi && item.materialId) ? app.formatCurrency(item.custoUnitario * item.qtd * item.ipi / 100) + ' (' + item.ipi + '%)' : '-'}</td>
                                            <td style="padding: 6px 12px; text-align: left; width: 180px;">
                                                ${selOpts
                                                    ? `<select data-key="${item._key}" onchange="window.propostaTecnicaModule._changeBOMMaterial(this)" style="max-width:140px;font-size:10px;border:1px solid #cbd5e1;border-radius:3px;padding:2px 4px;">${selOpts}</select>`
                                                    : item.codigoFabricante
                                                        ? `<span style="font-size:10px;color:#3b82f6;" title="${item.fabricante || ''}">${item.codigoFabricante}</span>`
                                                        : '<span style="font-size:10px;color:#94a3b8;">não encontrado</span>'
                                                }
                                            </td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `).join('')}

                <div style="display: flex; justify-content: flex-end; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-top: 8px;">
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a;">Total: ${app.formatCurrency(total)}</div>
                </div>
            </div>
        `;
    },

    _changeBOMMaterial(selectEl) {
        const key = selectEl.dataset.key;
        const materialId = selectEl.value;

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        if (!eq.ioList) eq.ioList = { racks: [] };
        if (!eq.ioList.materialOverrides) eq.ioList.materialOverrides = {};

        if (materialId) {
            eq.ioList.materialOverrides[key] = materialId;
        } else {
            delete eq.ioList.materialOverrides[key];
        }

        store.setState({ activeTechnicalProposal: data });
    },

    toggleBOMExportMenu() {
        const menu = document.getElementById('bom-export-menu');
        if (!menu) return;
        const isOpen = menu.style.display !== 'none';
        menu.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) {
            const close = (e) => {
                if (!menu.contains(e.target) && e.target !== menu.previousElementSibling) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', close);
                }
            };
            setTimeout(() => document.addEventListener('click', close), 0);
        }
    },

    addIORack() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || (eq.type !== 'PLC' && eq.type !== 'REM')) return;
        if (!eq.ioList) eq.ioList = { racks: [], totalDI: 0, totalDO: 0, totalAI: 0, totalAO: 0, spareDI: 0, spareDO: 0, spareAI: 0, spareAO: 0 };
        eq.ioList.racks.push({
            position: eq.ioList.racks.length + 1,
            backplane: '',
            cpu: '',
            powerSupply: '',
            comm: '',
            slots: []
        });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    duplicateIORack(index) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const source = eq.ioList.racks[index];
        if (!source) return;
        const copy = JSON.parse(JSON.stringify(source));
        copy.position = (eq.ioList.racks.length + 1);
        eq.ioList.racks.splice(index + 1, 0, copy);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    addIOSlot(rackIndex) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[rackIndex];
        if (!rack) return;
        if (!rack.slots) rack.slots = [];
        rack.slots.push({ position: rack.slots.length + 1, modulePartNumber: '', moduleType: 'DI', signalType: '24VDC', totalChannels: '', channels: [] });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    addIOChannel(rackIndex, slotIndex) {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[rackIndex];
        if (!rack) return;
        const slot = rack.slots[slotIndex];
        if (!slot) return;
        if (!slot.channels) slot.channels = [];
        const typical = eq.ioList.ioTypicals?.[slot.moduleType];
        slot.channels.push({
            channelNumber: slot.channels.length,
            channelType: slot.moduleType || 'DI',
            signalLevel: slot.signalType || '24VDC',
            fieldDevice: '',
            tag: '',
            terminalNumber: '',
            wireColor: typical?.wireColor || '',
            wireNumber: '',
            cableId: '',
            junctionBox: '',
            status: 'active',
            notes: ''
        });
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeIORack(index) {
        if (!confirm('Excluir este rack e todos os seus slots/canais?')) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        eq.ioList.racks.splice(index, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeIOSlot(rackIndex, slotIndex) {
        if (!confirm('Excluir este slot e seus canais?')) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[rackIndex];
        if (!rack) return;
        rack.slots.splice(slotIndex, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    removeIOChannel(rackIndex, slotIndex, channelIndex) {
        if (!confirm('Excluir este canal?')) return;
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq || !eq.ioList) return;
        const rack = eq.ioList.racks[rackIndex];
        if (!rack) return;
        const slot = rack.slots[slotIndex];
        if (!slot) return;
        slot.channels.splice(channelIndex, 1);
        store.setState({ activeTechnicalProposal: data });
        this.renderModal(data);
    },

    importIOList() {
        this.captureEquipmentData();

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls, .csv';
        input.style.display = 'none';
        input.onchange = (e) => this._handleIOImportFile(e);
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    },

    _handleIOImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const isExcel = /\.(xlsx|xls)$/i.test(file.name);

        if (isExcel) {
            reader.onload = (evt) => {
                try {
                    const bdata = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(bdata, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                    this._showIOColumnMapping(data);
                } catch (err) {
                    console.error('[Import IO] XLSX error:', err);
                    app.toast('Erro ao ler arquivo Excel. Verifique se não está corrompido.', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (evt) => {
                const csv = evt.target.result;
                const lines = csv.split('\n').filter(l => l.trim());
                if (lines.length < 2) {
                    app.toast('CSV vazio ou inválido.', 'error');
                    return;
                }
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const rows = lines.slice(1).map(line => {
                    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    if (vals.length !== headers.length) return null;
                    const obj = {};
                    headers.forEach((h, i) => obj[h] = vals[i]);
                    return obj;
                }).filter(r => r !== null);
                this._showIOColumnMapping(rows);
            };
            reader.readAsText(file);
        }
    },

    _showIOColumnMapping(rows) {
        if (!rows || rows.length === 0) {
            app.toast('Nenhuma linha de dados encontrada.', 'warning');
            return;
        }

        const headers = Object.keys(rows[0]);
        const fieldOptions = [
            { value: '', label: '(ignorar)' },
            { value: 'slotPosition', label: 'Slot / Posição' },
            { value: 'modulePartNumber', label: 'PN / Part Number / Código' },
            { value: 'moduleType', label: 'Tipo do Módulo' },
            { value: 'signalType', label: 'Tipo de Sinal (DI/DO/AI/AO)' },
            { value: 'channelNumber', label: 'Nº Canal' },
            { value: 'tag', label: 'Tag do Instrumento' },
            { value: 'fieldDevice', label: 'Dispositivo de Campo' },
            { value: 'terminalNumber', label: 'Borne / Terminal' },
            { value: 'wireColor', label: 'Cor do Fio' },
            { value: 'wireNumber', label: 'Nº do Fio / Condutor' },
            { value: 'cableId', label: 'Cabo / Cable ID' },
            { value: 'junctionBox', label: 'Caixa / Junction Box' },
            { value: 'channelType', label: 'Tipo Canal (Entrada/Saída)' },
            { value: 'notes', label: 'Observações / Notas' },
        ];

        const keywordMap = {
            slotPosition: ['slot', 'pos', 'posicao', 'posição', 'rack'],
            modulePartNumber: ['pn', 'part', 'partno', 'partnumber', 'codigo', 'código', 'modelo'],
            moduleType: ['moduletype', 'modulo', 'módulo', 'type', 'tipo_modulo'],
            signalType: ['signal', 'sinal', 'i/o', 'io', 'di/do', 'ai/ao'],
            channelNumber: ['channel', 'canal', 'ch', 'ch#', 'n°canal'],
            tag: ['tag', 'instrument', 'instrumento'],
            fieldDevice: ['device', 'dispositivo', 'field', 'campo'],
            terminalNumber: ['terminal', 'borne', 'born', 'terminals'],
            wireColor: ['wirecolor', 'cor', 'cor_fio', 'color', 'fio'],
            wireNumber: ['wireno', 'wire_n', 'nºfio', 'condutor', 'fio_n'],
            cableId: ['cable', 'cabo', 'cableid', 'cable_id'],
            junctionBox: ['jb', 'jbox', 'junction', 'caixa', 'junctionbox'],
            channelType: ['channeltype', 'tipo_canal', 'entrada', 'saida', 'direction'],
            notes: ['notes', 'obs', 'observacao', 'observação', 'notas'],
        };

        const autoDetect = {};
        headers.forEach(h => {
            const hl = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const [field, keywords] of Object.entries(keywordMap)) {
                if (keywords.some(k => {
                    const kl = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return hl === kl || hl.includes(kl) || kl.includes(hl);
                })) {
                    if (!autoDetect[field]) autoDetect[field] = h;
                }
            }
        });

        if (document.getElementById('modal-io-import-mapping')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-io-import-mapping';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 700px;">
                <div class="modal-header" style="background: #0f172a; color: white;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-microsoft-excel-logo"></i> Importar Lista de I/O
                    </h3>
                    <button class="btn btn-ghost" style="color: white;" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body" style="padding: 16px;">
                    <p style="font-size: 13px; color: #475569; margin: 0 0 12px;">
                        ${rows.length} linha(s) encontradas. Mapeie as colunas da planilha para os campos do sistema.
                    </p>

                    <div style="overflow-x: auto; margin-bottom: 16px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <thead>
                                <tr style="background: #f1f5f9;">
                                    <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0; min-width: 120px;">Coluna da Planilha</th>
                                    <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0; min-width: 160px;">Campo no Sistema</th>
                                    <th style="padding: 6px 10px; text-align: left; border: 1px solid #e2e8f0;">Amostra (1ª linha)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${headers.map(h => `
                                    <tr>
                                        <td style="padding: 6px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${h}</td>
                                        <td style="padding: 6px 10px; border: 1px solid #e2e8f0;">
                                            <select class="form-select io-import-map" data-col="${h}" style="width: 100%; padding: 4px 6px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                                                ${fieldOptions.map(f => `
                                                    <option value="${f.value}" ${autoDetect[f.value] === h ? 'selected' : ''}>${f.label}</option>
                                                `).join('')}
                                            </select>
                                        </td>
                                        <td style="padding: 6px 10px; border: 1px solid #e2e8f0; color: #64748b; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${rows[0][h] || ''}">${rows[0][h] || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="display: flex; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; align-items: center;">
                        <div style="font-size: 12px; color: #475569;">
                            <label style="display: block; font-weight: 600; margin-bottom: 4px;">Opções de Importação</label>
                            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; margin-right: 16px;">
                                <input type="checkbox" id="io-import-clear-existing" checked>
                                <span>Limpar configuração atual antes de importar</span>
                            </label>
                            <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="io-import-group-by-slot" checked>
                                <span>Agrupar canais por Slot</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button type="button" class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button type="button" class="btn btn-primary" style="background: #0f172a; color: white; font-weight: 600;" onclick="window.propostaTecnicaModule._executeIOImport()">
                        <i class="ph ph-check"></i> Importar ${rows.length} linha(s)
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        this._pendingImportRows = rows;
        this._pendingImportHeaders = headers;
    },

    _executeIOImport() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        const selects = document.querySelectorAll('#modal-io-import-mapping .io-import-map');
        const mapping = {};
        selects.forEach(sel => {
            const col = sel.getAttribute('data-col');
            const field = sel.value;
            if (field) mapping[field] = col;
        });

        const rows = this._pendingImportRows || [];
        if (!rows.length) return;

        const clearExisting = document.getElementById('io-import-clear-existing')?.checked ?? true;
        const groupBySlot = document.getElementById('io-import-group-by-slot')?.checked ?? true;

        // Build channel list from imported rows
        const channels = rows.map((row, i) => {
            const ch = {
                channelNumber: row[mapping.channelNumber] || String(i + 1),
                channelType: row[mapping.channelType] || (row[mapping.signalType] ? (row[mapping.signalType].toLowerCase().startsWith('a') ? 'Analog' : 'Digital') : 'Digital'),
                signalLevel: row[mapping.signalType] ? ('24Vdc') : '24Vdc',
                fieldDevice: row[mapping.fieldDevice] || '',
                tag: row[mapping.tag] || '',
                terminalNumber: row[mapping.terminalNumber] || '',
                wireColor: row[mapping.wireColor] || '',
                wireNumber: row[mapping.wireNumber] || '',
                cableId: row[mapping.cableId] || '',
                junctionBox: row[mapping.junctionBox] || '',
                status: row[mapping.status] || 'active',
                notes: row[mapping.notes] || '',
            };
            // Infer signalLevel from signalType
            const st = (row[mapping.signalType] || '').toLowerCase();
            if (st.includes('24v') || st.includes('dc')) ch.signalLevel = '24Vdc';
            else if (st.includes('220') || st.includes('110') || st.includes('ac')) ch.signalLevel = '220Vac';
            else if (st.includes('4-20') || st.includes('4_20') || st.includes('analog')) ch.signalLevel = '4-20mA';
            else if (st.includes('rtd') || st.includes('pt100') || st.includes('tc') || st.includes('thermocouple')) ch.signalLevel = 'RTD/TC';
            else if (st.includes('relay') || st.includes('rele') || st.includes('relé')) ch.signalLevel = 'Relay';

            return {
                ...ch,
                _slot: row[mapping.slotPosition] || '',
                _modulePN: row[mapping.modulePartNumber] || '',
                _moduleType: row[mapping.moduleType] || '',
                _signalType: row[mapping.signalType] || '',
            };
        });

        if (clearExisting) {
            eq.ioList = { racks: [], totalDI: 0, totalDO: 0, totalAI: 0, totalAO: 0, spareDI: 0, spareDO: 0, spareAI: 0, spareAO: 0 };
        }

        if (!eq.ioList) {
            eq.ioList = { racks: [], totalDI: 0, totalDO: 0, totalAI: 0, totalAO: 0, spareDI: 0, spareDO: 0, spareAI: 0, spareAO: 0 };
        }

        if (groupBySlot) {
            const grouped = {};
            channels.forEach(ch => {
                const key = ch._slot || '1';
                if (!grouped[key]) {
                    grouped[key] = {
                        position: parseInt(key) || 1,
                        backplane: '',
                        cpu: '',
                        powerSupply: '',
                        slots: {},
                    };
                }
                const slotKey = ch._slot || '1';
                if (!grouped[key].slots[slotKey]) {
                    grouped[key].slots[slotKey] = {
                        position: parseInt(slotKey) || 1,
                        modulePartNumber: ch._modulePN || '',
                        moduleType: ch._moduleType || '',
                        signalType: ch._signalType || '',
                        totalChannels: 0,
                        channels: [],
                    };
                }
                grouped[key].slots[slotKey].channels.push({
                    channelNumber: ch.channelNumber,
                    channelType: ch.channelType,
                    signalLevel: ch.signalLevel,
                    fieldDevice: ch.fieldDevice,
                    tag: ch.tag,
                    terminalNumber: ch.terminalNumber,
                    wireColor: ch.wireColor,
                    wireNumber: ch.wireNumber,
                    cableId: ch.cableId,
                    junctionBox: ch.junctionBox,
                    status: ch.status,
                    notes: ch.notes,
                });
            });

            Object.values(grouped).forEach(rack => {
                const slotArr = Object.values(rack.slots);
                slotArr.forEach(s => {
                    s.totalChannels = s.channels.length;
                });
                eq.ioList.racks.push({
                    position: rack.position,
                    backplane: rack.backplane,
                    cpu: rack.cpu,
                    powerSupply: rack.powerSupply,
                    slots: slotArr,
                });
            });
        } else {
            // Single rack, one slot per module PN
            const slotMap = {};
            channels.forEach(ch => {
                const key = ch._modulePN || 'imported';
                if (!slotMap[key]) {
                    slotMap[key] = {
                        position: 1,
                        modulePartNumber: ch._modulePN || '',
                        moduleType: ch._moduleType || '',
                        signalType: ch._signalType || '',
                        totalChannels: 0,
                        channels: [],
                    };
                }
                slotMap[key].channels.push({
                    channelNumber: ch.channelNumber,
                    channelType: ch.channelType,
                    signalLevel: ch.signalLevel,
                    fieldDevice: ch.fieldDevice,
                    tag: ch.tag,
                    terminalNumber: ch.terminalNumber,
                    wireColor: ch.wireColor,
                    wireNumber: ch.wireNumber,
                    cableId: ch.cableId,
                    junctionBox: ch.junctionBox,
                    status: ch.status,
                    notes: ch.notes,
                });
            });

            Object.values(slotMap).forEach(s => {
                s.totalChannels = s.channels.length;
            });

            eq.ioList.racks.push({
                position: 1,
                backplane: '',
                cpu: '',
                powerSupply: '',
                slots: Object.values(slotMap),
            });
        }

        store.setState({ activeTechnicalProposal: data });

        const modal = document.getElementById('modal-io-import-mapping');
        if (modal) modal.remove();

        this._pendingImportRows = null;
        this._pendingImportHeaders = null;

        this.renderModal(data);
        app.toast(`Importado: ${channels.length} canal(is) em ${eq.ioList.racks.length} rack(s).`, 'success');
    },

    saveIOTemplate() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq || !eq.ioList || !eq.ioList.racks || eq.ioList.racks.length === 0) {
            app.toast('Não há configuração de I/O para salvar.', 'warning');
            return;
        }

        let name = prompt('Nome do Template de I/O:', `I/O - ${eq.tag} - ${new Date().toLocaleDateString()}`);
        if (!name) return;

        const loadLists = store.getState().loadLists || [];
        const existingIndex = loadLists.findIndex(l => l.name === name && l.source === 'io-template');

        const templateData = JSON.parse(JSON.stringify(eq.ioList));

        if (existingIndex >= 0) {
            if (!confirm(`Já existe um template "${name}". Deseja substituir?`)) return;
            loadLists[existingIndex] = {
                ...loadLists[existingIndex],
                items: templateData,
                updatedAt: new Date().toISOString()
            };
        } else {
            loadLists.push({
                id: crypto.randomUUID(),
                name,
                source: 'io-template',
                items: templateData,
                createdAt: new Date().toISOString()
            });
        }

        store.setState({ loadLists: [...loadLists] });
        app.toast(`Template "${name}" salvo com sucesso!`, 'success');
    },

    loadIOTemplate() {
        this.captureEquipmentData();
        const loadLists = store.getState().loadLists || [];
        const ioLists = loadLists.filter(l => l.source === 'io-template');

        if (document.getElementById('modal-load-io-template')) return;

        const modal = document.createElement('div');
        modal.id = 'modal-load-io-template';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="width: 520px;">
                <div class="modal-header" style="background: #0f172a; color: white;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="ph ph-tray-arrow-down"></i> Carregar Template de I/O
                    </h3>
                    <button class="btn btn-ghost" style="color: white;" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body" style="padding: 16px;">
                    ${ioLists.length === 0 ? '<p style="color: #94a3b8; text-align: center; padding: 20px;">Nenhum template salvo.</p>' : `
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${ioLists.map(l => `
                                <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 600; font-size: 14px; color: #0f172a;">${l.name}</div>
                                        <div style="font-size: 12px; color: #64748b;">
                                            ${l.items?.racks?.length || 0} rack(s) &middot;
                                            ${(l.items?.racks || []).reduce((s, r) => s + (r.slots || []).length, 0)} slot(s) &middot;
                                            ${new Date(l.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button type="button" class="btn btn-sm" style="background: #0f172a; color: white; border-radius: 4px; padding: 6px 14px; font-size: 12px;" onclick="window.propostaTecnicaModule._confirmIOTemplate('${l.id}')">
                                        <i class="ph ph-check"></i> Carregar
                                    </button>
                                    <button type="button" class="btn btn-sm" style="background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; border-radius: 4px; padding: 6px 10px; font-size: 12px;" onclick="window.propostaTecnicaModule.deleteIOTemplate('${l.id}')" title="Excluir template">
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

    _confirmIOTemplate(id) {
        const loadLists = store.getState().loadLists || [];
        const selected = loadLists.find(l => l.id === id);
        if (!selected) return;

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;

        if (eq.ioList?.racks?.length > 0) {
            if (!confirm(`Isso substituirá ${eq.ioList.racks.length} rack(s) existente(s). Continuar?`)) return;
        }

        eq.ioList = JSON.parse(JSON.stringify(selected.items));
        store.setState({ activeTechnicalProposal: data });

        const modal = document.getElementById('modal-load-io-template');
        if (modal) modal.remove();

        this.renderModal(data);
        app.toast(`Template "${selected.name}" carregado (${eq.ioList.racks.length} rack(s)).`, 'success');
    },

    deleteIOTemplate(id) {
        const loadLists = store.getState().loadLists || [];
        const target = loadLists.find(l => l.id === id);
        if (!target) return;

        if (!confirm(`Excluir template "${target.name}"?`)) return;

        const newList = loadLists.filter(l => l.id !== id);
        store.setState({ loadLists: newList });

        const modal = document.getElementById('modal-load-io-template');
        if (modal) modal.remove();
        this.loadIOTemplate();

        app.toast(`Template "${target.name}" excluído.`, 'success');
    },

    refreshAutomationBOM() {
        this.captureEquipmentData();
        const data = store.getState().activeTechnicalProposal;
        this.renderModal(data);
    },

    exportAutomationBOMCSV() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const io = eq.ioList || { racks: [] };
        const result = deriveMaterials(io);
        if (!result.items || result.items.length === 0) {
            app.toast('Nenhum material para exportar.', 'warning');
            return;
        }
        const rows = [['Categoria', 'Descrição', 'Quantidade', 'Unidade', 'Custo Unitário', 'Custo Total', 'Código Fabricante']];
        result.items.forEach(item => {
            rows.push([item.categoria, item.descricao, item.qtd, item.unidade || 'un',
                item.custoUnitario.toFixed(2), (item.custoUnitario * item.qtd).toFixed(2),
                item.codigoFabricante || '']);
        });
        rows.push([]);
        rows.push(['TOTAL', '', '', '', '', result.total.toFixed(2), '']);
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BOM_Automacao_${eq.tag}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        app.toast('Lista CSV exportada com sucesso!', 'success');
    },

    exportAutomationBOMXLSX() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const io = eq.ioList || { racks: [] };
        const result = deriveMaterials(io);
        if (!result.items || result.items.length === 0) {
            app.toast('Nenhum material para exportar.', 'warning');
            return;
        }

        const payload = {
            items: result.items,
            tag: eq.tag,
            total: result.total
        };

        fetch('/api/export-io-bom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(async res => {
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Erro ao exportar');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BOM_Automacao_${eq.tag}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            app.toast('Planilha XLSX exportada com formatação!', 'success');
        }).catch(err => {
            console.error('[Export IO BOM]', err);
            app.toast(err.message || 'Erro ao exportar XLSX.', 'error');
        });
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



            <div id="lm-sortable-container" style="display: flex; flex-direction: column; gap: 20px;">

                ${loads.map((load, idx) => {

                    const typical = tipicos.find(t => t.id === load.typicalId);

                    let items = load._itemsOverride || (typical ? (typical.items || []) : []);

                    

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

                                    <span class="lm-drag-handle" style="cursor: grab; margin-right: 2px;"><i class="ph ph-grip-vertical" style="font-size: 14px; opacity: 0.3;"></i></span>

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

                                <button type="button" class="btn btn-xs btn-outline" style="font-size: 10px; padding: 4px 8px;" onclick="app.propostaTecnica.openAddItemModal('${load.typicalId}', ${eq.type === 'CUB-MT'}, ${idx})"><i class="ph ph-plus"></i> Incluir Itens</button>

                                <button type="button" class="btn btn-xs btn-outline" style="font-size: 10px; padding: 4px 8px;" onclick="window.propostaTecnicaModule._editTypicalItems('${load.typicalId}', ${eq.type === 'CUB-MT'}, ${idx})"><i class="ph ph-pencil"></i> Editar Itens</button>

                            </div>

                        </div>

                    `;

                }).join('')}

            </div>

        `;

    },

    openAddItemModal(typicalId, isCubMt = false, loadIndex = -1) {
        const sourceData = isCubMt ? store.getState().cubiculos : store.getState().tipicos;
        const tipico = sourceData.find(t => t.id === typicalId);
        if (!tipico) return app.toast?.(isCubMt ? 'Cubículo não encontrado.' : 'Típico não encontrado.', 'error');

        const hasOverride = loadIndex >= 0 && this._hasOverride(loadIndex);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-add-item-lm';
        modal.innerHTML = `
            <div class="modal" style="width:800px;max-width:90vw;">
                <div class="modal-header" style="background:var(--color-accent);color:white;">
                    <h3>Adicionar Itens — ${this._escapeHtml(tipico.nome)}</h3>
                    <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                        <select id="ami-manufacturer" class="form-control" style="width:200px;" onchange="app.propostaTecnica._debouncedAddItemSearch()">
                            <option value="">Todos os Fabricantes</option>
                        </select>
                        <input type="text" id="ami-filter-model" class="form-control" placeholder="Filtrar descrição..." oninput="app.propostaTecnica._debouncedAddItemSearch()">
                        <input type="text" id="ami-filter-code" class="form-control" placeholder="Filtrar código..." oninput="app.propostaTecnica._debouncedAddItemSearch()">
                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;white-space:nowrap;cursor:pointer;color:#f59e0b;">
                            <input type="checkbox" id="ami-filter-favoritos" onchange="app.propostaTecnica._debouncedAddItemSearch()"> ⭐ Favoritos
                        </label>
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
                    <div id="ami-pagination" style="padding:10px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                        <span>Carregando...</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <span style="font-size:12px;color:var(--color-text-muted);flex:1;">
                        Itens adicionados serão salvos ${hasOverride ? 'apenas nesta proposta (local)' : `no ${isCubMt ? 'cubículo' : 'típico'} <b>${this._escapeHtml(tipico.nome)}</b>`}
                    </span>
                    <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.propostaTecnica._confirmAddItems('${typicalId}', ${isCubMt})" style="">
                        <i class="ph ph-check"></i> Concluído
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal._typicalId = typicalId;
        modal._isCubMt = isCubMt;
        modal._loadIndex = loadIndex;
        this._populateManufacturers(modal);
        this._searchAddItems(modal);
    },

    _editTypicalItems(typicalId, isCubMt = false, loadIndex = -1) {
        const sourceData = isCubMt ? store.getState().cubiculos : store.getState().tipicos;
        const tipico = sourceData.find(t => t.id === typicalId);
        if (!tipico) return app.toast?.(isCubMt ? 'Cubículo não encontrado.' : 'Típico não encontrado.', 'error');

        const hasOverride = loadIndex >= 0 && this._hasOverride(loadIndex);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-edit-items';
        modal.innerHTML = `
            <div class="modal" style="width:800px;max-width:90vw;">
                <div class="modal-header" style="background:var(--color-accent);color:white;">
                    <h3>Editar Itens — ${this._escapeHtml(tipico.nome)}</h3>
                    <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <div style="max-height:450px;overflow-y:auto;border:1px solid var(--color-border);border-radius:4px;">
                        <table class="w-full" style="font-size:13px;">
                            <thead><tr style="background:#f1f5f9;">
                                <th style="padding:8px;width:50px;text-align:center;">QTD</th>
                                <th style="padding:8px;">DESCRIÇÃO</th>
                                <th style="padding:8px;width:100px;">MODELO</th>
                                <th style="padding:8px;width:110px;">CÓD. FAB.</th>
                                <th style="padding:8px;width:90px;">FABRICANTE</th>
                                <th style="padding:8px;width:80px;text-align:right;">CUSTO (R$)</th>
                                <th style="padding:8px;width:40px;"></th>
                            </tr></thead>
                            <tbody id="edit-items-body"></tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <span style="font-size:12px;color:var(--color-text-muted);flex:1;">
                        ${(hasOverride ? this._getOverrideItems(loadIndex) : tipico.items || []).length} material(is)${hasOverride ? ' (apenas nesta proposta)' : ''} — alterações salvas ao clicar em Concluído
                    </span>
                    <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.propostaTecnica._confirmEditItems('${typicalId}', ${isCubMt}, ${loadIndex})">
                        <i class="ph ph-check"></i> Concluído
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const tbody = modal.querySelector('#edit-items-body');
        if (tbody) {
            const load = hasOverride ? store.getState().activeTechnicalProposal?.equipments?.[this.activeEquipmentIndex]?.loads?.[loadIndex] : null;
            const items = load?._itemsOverride || tipico.items || [];
            if (items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhum item neste típico.</td></tr>';
            } else {
                tbody.innerHTML = items.map((item, idx) => {
                    const desc = this._escapeHtml(item.descricao || '');
                    const modelo = this._escapeHtml(item.modelo || '');
                    const codFab = this._escapeHtml(item.codigoFabricante || '');
                    const fab = this._escapeHtml(item.fabricante || '');
                    return `<tr>
                        <td style="padding:4px;text-align:center;">
                            <input type="number" class="form-control edit-item-qtd" value="${item.qtd || 1}" min="0.001" step="1"
                                style="width:50px;padding:4px;text-align:center;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;">
                            <input type="text" class="form-control edit-item-desc" value="${desc}"
                                style="padding:4px;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;">
                            <input type="text" class="form-control edit-item-modelo" value="${modelo}"
                                style="padding:4px;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;">
                            <input type="text" class="form-control edit-item-codfab" value="${codFab}"
                                style="padding:4px;height:28px;font-size:12px;font-family:monospace;">
                        </td>
                        <td style="padding:4px;">
                            <input type="text" class="form-control edit-item-fab" value="${fab}"
                                style="padding:4px;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;text-align:right;">
                            <input type="number" class="form-control edit-item-custo" value="${item.custo || 0}" min="0" step="0.01"
                                style="width:80px;padding:4px;text-align:right;height:28px;font-size:12px;">
                        </td>
                        <td style="padding:4px;text-align:center;">
                            <button class="btn btn-xs" style="background:#fef2f2;color:#ef4444;border:1px solid #fee2e2;"
                                onclick="this.closest('tr').remove()" title="Remover item">
                                <i class="ph ph-trash"></i>
                            </button>
                        </td>
                    </tr>`;
                }).join('');
            }
        }
    },

    _hasOverride(loadIndex) {
        if (loadIndex < 0) return false;
        const data = store.getState().activeTechnicalProposal;
        return !!data?.equipments?.[this.activeEquipmentIndex]?.loads?.[loadIndex]?._itemsOverride;
    },

    _getOverrideItems(loadIndex) {
        const data = store.getState().activeTechnicalProposal;
        return data?.equipments?.[this.activeEquipmentIndex]?.loads?.[loadIndex]?._itemsOverride || [];
    },

    _confirmSaveToDatabase(isCubMt) {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = 100001;
            overlay.innerHTML = `
                <div class="modal" style="width:460px;">
                    <div class="modal-header" style="background:var(--color-accent);color:white;">
                        <h3 style="margin:0;font-size:15px;">Alterar ${isCubMt ? 'Cubículo' : 'Típico'} na Base?</h3>
                    </div>
                    <div class="modal-body" style="padding:20px;line-height:1.6;">
                        <p style="margin:0 0 12px;font-size:14px;color:#334155;">
                            <strong>Sim</strong> — altera o ${isCubMt ? 'cubículo' : 'típico'} original.<br>
                            Todas as propostas que usam este ${isCubMt ? 'cubículo' : 'típico'} serão afetadas.
                        </p>
                        <p style="margin:0;font-size:14px;color:#334155;">
                            <strong>Não</strong> — altera apenas nesta proposta.<br>
                            O ${isCubMt ? 'cubículo' : 'típico'} original permanece intacto.
                        </p>
                    </div>
                    <div class="modal-footer" style="display:flex;gap:10px;justify-content:flex-end;padding:12px 20px;">
                        <button class="btn btn-cancel" id="btn-db-no" style="min-width:100px;">Não</button>
                        <button class="btn btn-primary" id="btn-db-yes" style="min-width:100px;">Sim</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('#btn-db-no').onclick = () => { overlay.remove(); resolve(false); };
            overlay.querySelector('#btn-db-yes').onclick = () => { overlay.remove(); resolve(true); };
        });
    },

    async _confirmEditItems(typicalId, isCubMt = false, loadIndex = -1) {
        const modal = document.getElementById('modal-edit-items');
        if (!modal) return;

        const rows = modal.querySelectorAll('#edit-items-body tr');
        const items = [];
        rows.forEach(row => {
            const qtd = parseFloat(row.querySelector('.edit-item-qtd')?.value) || 0;
            if (qtd <= 0) return;
            items.push({
                qtd: qtd,
                descricao: row.querySelector('.edit-item-desc')?.value || '',
                modelo: row.querySelector('.edit-item-modelo')?.value || '',
                codigoFabricante: row.querySelector('.edit-item-codfab')?.value || '',
                fabricante: row.querySelector('.edit-item-fab')?.value || '',
                custo: parseFloat(row.querySelector('.edit-item-custo')?.value) || 0
            });
        });

        const custoTotal = items.reduce((acc, i) => acc + (i.custo * i.qtd), 0);

        // Se tem loadIndex e veio da LM, perguntar se quer salvar no banco
        if (loadIndex >= 0) {
            const saveToDb = await this._confirmSaveToDatabase(isCubMt);
            if (!saveToDb) {
                // Salvar apenas na proposta (local override)
                const data = store.getState().activeTechnicalProposal;
                const eq = data?.equipments?.[this.activeEquipmentIndex];
                if (eq?.loads?.[loadIndex]) {
                    eq.loads[loadIndex]._itemsOverride = items;
                    eq.loads[loadIndex]._overrideCustoTotal = custoTotal;
                    store.setState({ activeTechnicalProposal: data });
                    modal.remove();
                    this.renderModal(data);
                    if (this.cargasSubView !== 'lm') {
                        this.switchCargasSubView('lm');
                    }
                    app.toast?.('Itens atualizados apenas nesta proposta!', 'success');
                }
                return;
            }
        }

        // Salvar no banco (comportamento atual)
        const savePromise = isCubMt
            ? store.updateCubiculos(typicalId, { items, custoTotal })
            : store.updateTipico(typicalId, { items, custoTotal });
        savePromise.then(ok => {
            modal.remove();
            if (ok) {
                const data = store.getState().activeTechnicalProposal;
                // Se salvou no banco, limpar override local se existia
                if (loadIndex >= 0) {
                    const eq = data?.equipments?.[this.activeEquipmentIndex];
                    if (eq?.loads?.[loadIndex]) {
                        delete eq.loads[loadIndex]._itemsOverride;
                        delete eq.loads[loadIndex]._overrideCustoTotal;
                    }
                }
                if (data) {
                    store.setState({ activeTechnicalProposal: data });
                    this.renderModal(data);
                    if (this.cargasSubView !== 'lm') {
                        this.switchCargasSubView('lm');
                    }
                }
                app.toast?.(`Itens atualizados no ${isCubMt ? 'cubículo' : 'típico'}!`, 'success');
            } else {
                app.toast?.('Erro ao salvar itens.', 'error');
            }
        });
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

    _debouncedAddItemSearch() {
        if (this._addItemSearchTimer) clearTimeout(this._addItemSearchTimer);
        this._addItemSearchTimer = setTimeout(() => {
            const modal = document.getElementById('modal-add-item-lm');
            if (modal) this._searchAddItems(modal);
        }, 300);
    },

    async _searchAddItems(modal) {
        const manufacturer = modal.querySelector('#ami-manufacturer')?.value || '';
        const filterModel  = (modal.querySelector('#ami-filter-model')?.value || '').trim();
        const filterCode   = (modal.querySelector('#ami-filter-code')?.value || '').trim();
        const favoritosOnly = modal.querySelector('#ami-filter-favoritos')?.checked || false;
        const tbody = modal.querySelector('#ami-items-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;"><i class="ph ph-spinner ph-spin"></i> Carregando...</td></tr>';

        const q = [filterModel, filterCode].filter(Boolean).join(' ');
        const page = parseInt(modal._searchPage || 1);
        const result = await store.searchMaterials({
            q: q || undefined,
            fabricante: manufacturer || undefined,
            favorito: favoritosOnly || undefined,
            page: page,
            limit: 100
        });

        modal._searchTotal = result.total || 0;
        modal._searchPages = result.pages || 0;
        modal._searchPage = result.page || 1;

        this._renderAddItemResults(modal, result.rows || []);
    },

    _renderAddItemResults(modal, rows) {
        const tbody = modal.querySelector('#ami-items-body');
        if (!tbody) return;
        const typicalId = modal._typicalId;
        const isCubMt = modal._isCubMt;

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhum material encontrado.</td></tr>';
            this._renderAddItemPagination(modal);
            return;
        }

        tbody.innerHTML = rows.map(m => {
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
                        data-modelo="${modelo}"
                        data-icms="${m.icms || 18}"
                        data-ipi="${m.ipi || 0}"
                        data-uf="${m.ufFornecedor || ''}">
                </td>
                <td style="padding:8px 10px;text-align:center;">
                    <button class="btn btn-xs btn-primary" onclick="app.propostaTecnica._addSingleItem(this, '${typicalId}', ${isCubMt})"
                        style="font-size:11px;padding:4px 10px;">
                        <i class="ph ph-plus"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
        this._renderAddItemPagination(modal);
    },

    _renderAddItemPagination(modal) {
        const container = modal.querySelector('#ami-pagination');
        if (!container) return;
        const total = modal._searchTotal || 0;
        const pages = modal._searchPages || 0;
        const page = modal._searchPage || 1;

        if (pages <= 1) {
            container.innerHTML = `<span>${total} material(is) encontrado(s)</span>`;
            return;
        }

        container.innerHTML = `
            <span>${total} material(is) encontrados</span>
            <div style="display:flex;gap:4px;align-items:center;">
                <button class="btn btn-xs btn-outline" ${page <= 1 ? 'disabled' : ''}
                    onclick="app.propostaTecnica._goAddItemPage(${page - 1})">« Anterior</button>
                <span style="margin:0 8px;font-weight:600;">${page} de ${pages}</span>
                <button class="btn btn-xs btn-outline" ${page >= pages ? 'disabled' : ''}
                    onclick="app.propostaTecnica._goAddItemPage(${page + 1})">Próxima »</button>
            </div>
        `;
    },

    _goAddItemPage(page) {
        const modal = document.getElementById('modal-add-item-lm');
        if (!modal) return;
        modal._searchPage = page;
        this._searchAddItems(modal);
    },

    _addSingleItem(btn, typicalId, isCubMt = false) {
        const row = btn.closest('tr');
        const qtdInput = row.querySelector('input[type="number"]');
        const qtd = parseInt(qtdInput?.value) || 1;
        const materialId = qtdInput?.dataset?.materialId;
        if (!materialId) return;

        const addModal = document.getElementById('modal-add-item-lm');
        const loadIndex = addModal?._loadIndex ?? -1;

        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];

        if (loadIndex >= 0 && eq?.loads?.[loadIndex]?._itemsOverride) {
            // Modo local — adicionar no override da carga
            const override = eq.loads[loadIndex]._itemsOverride;
            const existing = override.find(i => i.materialId === materialId);
            if (existing) {
                existing.qtd = (existing.qtd || 0) + qtd;
            } else {
                override.push({
                    materialId: materialId,
                    descricao: qtdInput.dataset.descricao,
                    fabricante: qtdInput.dataset.fabricante,
                    codigoFabricante: qtdInput.dataset.codfab,
                    modelo: qtdInput.dataset.modelo,
                    custo: parseFloat(qtdInput.dataset.custo) || 0,
                    qtd: qtd,
                    icms: parseFloat(qtdInput.dataset.icms) || 18,
                    ipi: parseFloat(qtdInput.dataset.ipi) || 0,
                    ufFornecedor: qtdInput.dataset.uf || ''
                });
            }
            eq.loads[loadIndex]._overrideCustoTotal = override.reduce((acc, i) => acc + ((i.custo || 0) * (i.qtd || 0)), 0);
            store.setState({ activeTechnicalProposal: data });
            window.app.toast?.('Item adicionado à lista local da proposta!', 'success');
            this.renderModal(data);
            setTimeout(() => this.openAddItemModal(typicalId, isCubMt, loadIndex), 50);
            return;
        }

        // Modo global — adicionar no típico (comportamento atual)
        const state = store.getState();
        const sourceData = [...(isCubMt ? (state.cubiculos || []) : (state.tipicos || []))];
        const idx = sourceData.findIndex(t => t.id === typicalId);
        if (idx === -1) return;

        const item = { ...sourceData[idx] };
        item.items = [...(item.items || [])];

        const existing = item.items.find(i => i.materialId === materialId);
        if (existing) {
            existing.qtd = (existing.qtd || 0) + qtd;
        } else {
            item.items.push({
                materialId: materialId,
                descricao: qtdInput.dataset.descricao,
                fabricante: qtdInput.dataset.fabricante,
                codigoFabricante: qtdInput.dataset.codfab,
                modelo: qtdInput.dataset.modelo,
                custo: parseFloat(qtdInput.dataset.custo) || 0,
                qtd: qtd,
                icms: parseFloat(qtdInput.dataset.icms) || 18,
                ipi: parseFloat(qtdInput.dataset.ipi) || 0,
                ufFornecedor: qtdInput.dataset.uf || ''
            });
        }

        item.custoTotal = item.items.reduce((acc, i) => acc + ((i.custo || 0) * (i.qtd || 0)), 0);
        sourceData[idx] = item;
        if (isCubMt) {
            store.setState({ cubiculos: sourceData });
        } else {
            store.setState({ tipicos: sourceData });
        }

        window.app.toast?.(`Item adicionado ao ${isCubMt ? 'cubículo' : 'típico'}!`, 'success');

        if (data) {
            this.renderModal(data);
            setTimeout(() => this.openAddItemModal(typicalId, isCubMt, loadIndex), 50);
        }
    },

    _confirmAddItems(typicalId, isCubMt = false) {
        document.getElementById('modal-add-item-lm')?.remove();
        const data = store.getState().activeTechnicalProposal;
        if (data) {
            this.renderModal(data);
            if (this.cargasSubView !== 'lm') {
                this.switchCargasSubView('lm');
            }
        }
        window.app.toast?.(`Itens salvos com sucesso!`, 'success');
    },

    openAddEqMaterialModal() {
        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'modal-add-eq-material';
        modal.innerHTML = `
            <div class="modal" style="width:800px;max-width:90vw;">
                <div class="modal-header" style="background:var(--color-accent);color:white;">
                    <h3>Adicionar Material — ${this._escapeHtml(eq.tag)}</h3>
                    <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                        <select id="aem-manufacturer" class="form-control" style="width:200px;" onchange="app.propostaTecnica._debouncedAddEqMaterialSearch()">
                            <option value="">Todos os Fabricantes</option>
                        </select>
                        <input type="text" id="aem-filter-model" class="form-control" placeholder="Filtrar descrição..." oninput="app.propostaTecnica._debouncedAddEqMaterialSearch()">
                        <input type="text" id="aem-filter-code" class="form-control" placeholder="Filtrar código..." oninput="app.propostaTecnica._debouncedAddEqMaterialSearch()">
                        <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;white-space:nowrap;cursor:pointer;color:#f59e0b;">
                            <input type="checkbox" id="aem-filter-favoritos" onchange="app.propostaTecnica._debouncedAddEqMaterialSearch()"> ⭐ Favoritos
                        </label>
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
                            <tbody id="aem-items-body"></tbody>
                        </table>
                    </div>
                    <div id="aem-pagination" style="padding:10px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                        <span>Carregando...</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <span style="font-size:12px;color:var(--color-text-muted);flex:1;">
                        Materiais adicionados serão vinculados ao equipamento <b>${this._escapeHtml(eq.tag)}</b>
                    </span>
                    <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="app.propostaTecnica._confirmAddEqMaterial()" style="">
                        <i class="ph ph-check"></i> Concluído
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this._populateEqMaterialManufacturers(modal);
        this._searchAddEqMaterials(modal);
    },

    _populateEqMaterialManufacturers(modal) {
        const all = store.getState().materiais || [];
        const unique = [...new Set(all.map(m => m.fabricante).filter(Boolean))].sort();
        const sel = modal.querySelector('#aem-manufacturer');
        if (sel) {
            unique.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                sel.appendChild(opt);
            });
        }
    },

    _debouncedAddEqMaterialSearch() {
        if (this._addEqMatSearchTimer) clearTimeout(this._addEqMatSearchTimer);
        this._addEqMatSearchTimer = setTimeout(() => {
            const modal = document.getElementById('modal-add-eq-material');
            if (modal) this._searchAddEqMaterials(modal);
        }, 300);
    },

    async _searchAddEqMaterials(modal) {
        const manufacturer = modal.querySelector('#aem-manufacturer')?.value || '';
        const filterModel  = (modal.querySelector('#aem-filter-model')?.value || '').trim();
        const filterCode   = (modal.querySelector('#aem-filter-code')?.value || '').trim();
        const favoritosOnly = modal.querySelector('#aem-filter-favoritos')?.checked || false;
        const tbody = modal.querySelector('#aem-items-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;"><i class="ph ph-spinner ph-spin"></i> Carregando...</td></tr>';

        const q = [filterModel, filterCode].filter(Boolean).join(' ');
        const page = parseInt(modal._searchPage || 1);
        const result = await store.searchMaterials({
            q: q || undefined,
            fabricante: manufacturer || undefined,
            favorito: favoritosOnly || undefined,
            page: page,
            limit: 100
        });

        modal._searchTotal = result.total || 0;
        modal._searchPages = result.pages || 0;
        modal._searchPage = result.page || 1;

        this._renderAddEqMaterialResults(modal, result.rows || []);
    },

    _renderAddEqMaterialResults(modal, rows) {
        const tbody = modal.querySelector('#aem-items-body');
        if (!tbody) return;

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhum material encontrado.</td></tr>';
            this._renderAddEqMaterialPagination(modal);
            return;
        }

        tbody.innerHTML = rows.map(m => {
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
                    <button class="btn btn-xs btn-primary" onclick="app.propostaTecnica._addEqMaterialSingleItem(this)"
                        style="font-size:11px;padding:4px 10px;">
                        <i class="ph ph-plus"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
        this._renderAddEqMaterialPagination(modal);
    },

    _renderAddEqMaterialPagination(modal) {
        const container = modal.querySelector('#aem-pagination');
        if (!container) return;
        const total = modal._searchTotal || 0;
        const pages = modal._searchPages || 0;
        const page = modal._searchPage || 1;

        if (pages <= 1) {
            container.innerHTML = `<span>${total} material(is) encontrado(s)</span>`;
            return;
        }

        container.innerHTML = `
            <span>${total} material(is) encontrados</span>
            <div style="display:flex;gap:4px;align-items:center;">
                <button class="btn btn-xs btn-outline" ${page <= 1 ? 'disabled' : ''}
                    onclick="app.propostaTecnica._goAddEqMaterialPage(${page - 1})">« Anterior</button>
                <span style="margin:0 8px;font-weight:600;">${page} de ${pages}</span>
                <button class="btn btn-xs btn-outline" ${page >= pages ? 'disabled' : ''}
                    onclick="app.propostaTecnica._goAddEqMaterialPage(${page + 1})">Próxima »</button>
            </div>
        `;
    },

    _goAddEqMaterialPage(page) {
        const modal = document.getElementById('modal-add-eq-material');
        if (!modal) return;
        modal._searchPage = page;
        this._searchAddEqMaterials(modal);
    },

    _addEqMaterialSingleItem(btn) {
        const row = btn.closest('tr');
        const qtdInput = row.querySelector('input[type="number"]');
        const qtd = parseInt(qtdInput?.value) || 1;
        const materialId = qtdInput?.dataset?.materialId;
        if (!materialId) return;

        const data = store.getState().activeTechnicalProposal;
        if (!data || this.activeEquipmentIndex === -1) return;
        const eq = data.equipments[this.activeEquipmentIndex];
        if (!eq) return;

        if (!eq.materials) eq.materials = [];
        const existing = eq.materials.find(m => m.materialId === materialId);
        if (existing) {
            existing.qtd = (existing.qtd || 0) + qtd;
        } else {
            eq.materials.push({
                materialId: materialId,
                descricao: qtdInput.dataset.descricao,
                fabricante: qtdInput.dataset.fabricante,
                codigoFabricante: qtdInput.dataset.codfab,
                modelo: qtdInput.dataset.modelo,
                custo: parseFloat(qtdInput.dataset.custo) || 0,
                qtd: qtd
            });
        }

        store.setState({ activeTechnicalProposal: data });
        window.app.toast?.('Material adicionado ao equipamento!', 'success');
        this.renderModal(data);
        setTimeout(() => this.openAddEqMaterialModal(), 50);
    },

    _confirmAddEqMaterial() {
        document.getElementById('modal-add-eq-material')?.remove();
        const data = store.getState().activeTechnicalProposal;
        if (data) {
            this.renderModal(data);
        }
        window.app.toast?.('Materiais vinculados ao equipamento!', 'success');
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

        // Limpar override local ao trocar o típico associado
        const ptData = store.getState().activeTechnicalProposal;
        const ptEq = ptData?.equipments?.[this.activeEquipmentIndex];
        if (ptEq?.loads?.[idx]) {
            delete ptEq.loads[idx]._itemsOverride;
            delete ptEq.loads[idx]._overrideCustoTotal;
        }

        const isCubMt = (() => {
            const data = store.getState().activeTechnicalProposal;
            const eq = data?.equipments?.[this.activeEquipmentIndex];
            return eq && eq.type === 'CUB-MT';
        })();



        const row = select.closest('tr');

        const inputPotencia = row.querySelector(`input[name="dload_power_${idx}"]`);

        const inputTensao = row.querySelector(`input[name="dload_tensao_${idx}"]`);

        const inputCorrente = row.querySelector(`input[name="dload_current_${idx}"]`);

        const selectRegime = row.querySelector(`select[name="dload_regime_${idx}"]`);

        const selectTipo = row.querySelector(`select[name="dload_type_${idx}"]`);
        const inputTipo = row.querySelector(`input[name="dload_type_${idx}"]`);



        if (isCubMt) {

            const typical = store.getState().cubiculos.find(t => t.id === typicalId);

            if (!typical) return;

            if (inputPotencia) inputPotencia.value = typical.tensao || '';

            if (inputTensao) inputTensao.value = typical.correnteNominal || '';

            if (inputCorrente) inputCorrente.value = typical.icc || '';

            if (selectRegime) {
                const optionExists = Array.from(selectRegime.options).some(opt => opt.value === typical.instalacao);
                selectRegime.value = optionExists ? typical.instalacao : 'Abrigada';
            }

            if (selectTipo) {
                const tipoNomeToSigla = {
                    'Cubículo de Entrada': 'CE',
                    'Cubículo de Seccionamento': 'CS',
                    'Cubículo de Medição': 'CM',
                    'Cubículo de Proteção': 'CP',
                    'Cubículo de Transformação': 'CT',
                    'Cubículo de Proteção Contra Surto': 'CPS',
                    'Cubículo Aterramento de Neutro': 'CAN'
                };
                selectTipo.value = tipoNomeToSigla[typical.tipoAcionamento] || '';
            }

            app.toast(`Dados preenchidos a partir de: ${typical.nome}`, 'info');
            return;

        }



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



    async _loadFromPtc(ptcFolder, revisionFolder) {
        if (this._loading) return;
        this._loading = true;
        try {
            const _tkPTL = store.getState().auth?.token;
            const _hPTL = _tkPTL ? { 'Authorization': 'Bearer ' + _tkPTL } : {};
            const res = await fetch(`/api/load-proposal?ptc=${encodeURIComponent(ptcFolder)}&file=PropostaTecnica.json&revisionFolder=${encodeURIComponent(revisionFolder)}`, { headers: _hPTL });
            const data = await res.json();
            if (data && !data.error && Object.keys(data).length > 0) {
                this.viewMode = 'form';
                this.forcedDashboard = false;
                const copy = JSON.parse(JSON.stringify(data));
                if (!copy.ptc_folder) copy.ptc_folder = ptcFolder;
                store.setState({ activeTechnicalProposal: copy });
                this.renderModal(copy);
            } else {
                this._createFromPtc();
            }
        } catch (err) {
            console.warn('[PropostaTecnica] Error auto-loading from PTC:', err);
            this._createFromPtc();
        } finally {
            this._loading = false;
        }
    },

    _createFromPtc() {
        const ptc = window.app.currentPtc;
        const company = store.getState().company || {};
        const vendorDefaults = (() => {
            try { return JSON.parse(company.vendorDefaults || '[]'); } catch (e) { return []; }
        })();
        const initialVendorList = Object.keys(VENDOR_MAP).map(comp => ({
            comp,
            brand: VENDOR_MAP[comp][0] || '',
            opt: '__PADRAO__',
            optEspecifique: ''
        }));
        vendorDefaults.forEach(dv => {
            if (!initialVendorList.find(v => v.comp === dv.comp)) {
                initialVendorList.push({
                    comp: dv.comp,
                    brand: dv.brand || '',
                    opt: dv.opt || '__PADRAO__',
                    optEspecifique: dv.optEspecifique || ''
                });
            }
        });
        const ptcFolder = String(window.app.currentPtc?.folder || '');
        const newMatch = ptcFolder.match(/^(\d{8,10})/);
        const oldMatch = ptcFolder.match(/PTC-\d{4}-\d+/i);
        const basePtc = newMatch ? newMatch[1] : (oldMatch ? oldMatch[0].toUpperCase() : '');
        const _existingPT = (store.getState().propostasTecnicas || []).find(p => p.ptc_folder === ptcFolder || p.ptcFolder === ptcFolder);
        const _stableId = _existingPT ? _existingPT.id : ('PT-' + (basePtc || Date.now().toString(36).toUpperCase()));
        const _stableCodigo = _existingPT?.codigo || (basePtc ? `${basePtc}-PT_Rev00` : _stableId);
        const newData = {
            id: _stableId,
            codigo: _stableCodigo,
            ptc_folder: ptcFolder,
            cliente: ptc?.client || '',
            projeto: ptc?.title || '',
            objeto: 'FORNECIMENTO DE PAINÉIS ELÉTRICOS',
            equipments: [],
            scopeItems: [],
            exclusions: makeDefaultExclusions(),
            vendorList: initialVendorList,
            revisions: [{ no: '00', desc: 'Emissão Inicial', elab: '', verif: '', aprov: '', data: new Date().toLocaleDateString() }],
            engenheiroResponsavel: '',
            vendedor: ptc?.vendedor || '',
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

        store.setState({ proposalReadOnly: false });

        if (window.app.syncProposals) window.app.syncProposals();

        this.render();

    },

    _applyReadOnly(container) {
        container.querySelectorAll('input, select, textarea, button').forEach(el => {
            if (el.type !== 'hidden') el.disabled = true;
        });
        container.querySelectorAll('.btn-save-as-new').forEach(el => el.disabled = false);
        container.querySelectorAll('.tab-btn, .sub-tab-btn').forEach(el => el.disabled = false);
        container.querySelectorAll('.btn-export-word').forEach(el => el.disabled = false);
        container.querySelectorAll('[onclick*="closeModal"], [onclick*="showListModal"]').forEach(el => el.disabled = false);
        const searchInput = container.querySelector('#lm-search-input');
        if (searchInput) searchInput.disabled = false;
        const banner = document.createElement('div');
        banner.style.cssText = 'padding:10px 16px;background:#ef4444;color:#fff;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;';
        banner.innerHTML = '<i class="ph ph-lock-simple" style="font-size:18px;"></i> SOMENTE LEITURA — Esta proposta está Fechada/Perdida no Pipeline. Nenhuma alteração pode ser salva.';
        const header = container.querySelector('.module-header-sticky');
        if (header) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        } else {
            container.insertBefore(banner, container.firstChild);
        }
    },



    render() {

        const state = store.getState();

        const activeProposal = state.activeTechnicalProposal;



        // Auto-load from current PTC if no active proposal
        if (this.viewMode === 'list' && !this._loading && !this.forcedDashboard) {
            const ptc = window.app.currentPtc;
            if (!activeProposal && ptc && ptc.folder) {
                this._loadFromPtc(ptc.folder, ptc.revision || '');
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
                <div style="height:calc(100vh - 120px);display:flex;flex-direction:column;background:rgb(250,250,250);margin:-20px;position:relative;">
                    <div class="module-header-sticky" style="color:white;padding:20px 30px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:10;">
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
                    <th style="padding: 12px 16px; font-weight: 600; font-size: 13px;">PTC</th>
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
                    <td style="padding: 12px 16px; font-weight: 500; font-size: 12px; color: var(--color-primary);">${p.ptcFolder || '-'}</td>
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

                    <td style="padding: 12px; text-align: center;"><input type="checkbox" name="el_scope_empresa" ${it.minhaEmpresa ? 'checked' : ''} ${it.na ? 'disabled style="opacity:0.5"' : ''}></td>

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

                <div id="el-scope-container" style="border:1px solid #e2e8f0; border-radius:0 12px 12px 12px; overflow:hidden; background:white;">

                    <div style="max-height:500px; overflow-y:auto;">

                        <table class="w-full" style="font-size:13px; border-collapse:collapse;">

                            <thead>

                                <tr style="position:sticky; top:0; background:rgb(30, 58, 138); color:#fff; z-index:10; box-shadow:inset 0 -2px 0 #e2e8f0;">

                                    <th style="padding:14px; text-align:center; width:60px; background:rgb(30, 58, 138); color:#fff;">ITEM</th>

                                    <th style="padding:14px; text-align:left; background:rgb(30, 58, 138); color:#fff;">MATRIZ DE RESPONSABILIDADE</th>

                                    <th style="padding:14px; text-align:center; width:90px; background:rgb(30, 58, 138); color:#fff;">PTC</th>

                                    <th style="padding:14px; text-align:center; width:90px; background:rgb(30, 58, 138); color:#fff;">N/A</th>

                                    <th style="padding:14px; text-align:center; width:90px; background:rgb(30, 58, 138); color:#fff;">CLIENTE</th>

                                    <th style="padding:14px; width:80px; background:rgb(30, 58, 138); color:#fff;"></th>

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

            <td style="padding:12px; text-align:center;"><input type="checkbox" name="el_scope_empresa"></td>

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

    _exportLayoutPDF() {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) return;
        const montagem = eq.technical?.montagem || 'Em Linha';
        const isB2B = montagem === 'Back to Back';

        const CANVAS_HEIGHT = 2000;
        const PADDING = 80;
        const BOTTOM_LABEL_HEIGHT = 120;
        const SCALE = (CANVAS_HEIGHT - PADDING * 2 - BOTTOM_LABEL_HEIGHT) / 2300;
        const SCREEN_SCALE = (500 - 60 - 50) / 2300;
        const FONT_MULT = SCALE / SCREEN_SCALE;

        const makeCanvas = cabinets => {
            const totalCabinetPixels = cabinets.reduce((s, c) => s + c.width * SCALE, 0);
            const cw = Math.ceil(totalCabinetPixels + PADDING * 2);
            const cv = document.createElement('canvas');
            cv.width = cw;
            cv.height = CANVAS_HEIGHT;
            this._drawLayoutInternal(cv.getContext('2d'), cabinets, SCALE, FONT_MULT, PADDING);
            return cv;
        };

        const makeSideCanvas = (cabinets, cabinetIndex, rearCabins = null) => {
            const isB2B = Array.isArray(rearCabins) && rearCabins.length > 0;
            const selectedCabins = (cabinetIndex != null && cabinetIndex >= 0 && cabinetIndex < cabinets.length)
                ? [cabinets[cabinetIndex]]
                : cabinets;
            const frontDepth = Math.max(...selectedCabins.map(c => c.depth || 600));
            const rearDepth = isB2B
                ? Math.max(...rearCabins.map(c => c.depth || 600))
                : 0;
            const boxDepth = isB2B ? frontDepth : frontDepth + rearDepth;
            const boxW = boxDepth * SCALE;
            const cw = Math.ceil(boxW + PADDING * 2);
            const cv = document.createElement('canvas');
            cv.width = cw;
            cv.height = CANVAS_HEIGHT;
            const ctx = cv.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, cw, CANVAS_HEIGHT);
            const singleLabel = (cabinetIndex != null && cabinetIndex >= 0 && cabinetIndex < cabinets.length)
                ? cabinets[cabinetIndex].name
                : null;
            this._drawSideViewInternal(ctx, selectedCabins, frontDepth, SCALE, FONT_MULT, PADDING, singleLabel, rearCabins);
            return cv;
        };

        let imagesHtml = '';
        const showSide = eq.layoutConfig?.showSideView;
        const flexPage = (mainCv, sideCv) => {
            const main = `<img src="${mainCv.toDataURL('image/png')}" style="max-height:97vh;width:auto;object-fit:contain;">`;
            const side = sideCv ? `<img src="${sideCv.toDataURL('image/png')}" style="max-height:97vh;width:auto;object-fit:contain;">` : '';
            return `<div style="display:flex;gap:40px;align-items:flex-start;justify-content:center;page-break-after:always;">${main}${side}</div>`;
        };
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        if (isAutomation) {
            const result = this._suggestAutomationLayout(eq);
            if (!result.hasLoads || result.cabinets.length === 0) {
                console.warn('[PDF Export] Export canceled: no BOM materials or no cabinets defined');
                app.toast('Nenhum material com dimensões ou nenhum armário definido para exportar.', 'warning');
                return;
            }
            const cv = makeCanvas(result.cabinets);
            const cvS = showSide && result.cabinets.length > 0
                ? makeSideCanvas(result.cabinets, eq.layoutConfig?.sideViewCabinetIndex) : null;
            imagesHtml = flexPage(cv, cvS);
        } else if (isB2B) {
            const resultF = this.suggestLayout(eq, 'front');
            const resultT = this.suggestLayout(eq, 'rear');
            if (resultF.hasLoads && resultF.cabinets.length > 0) {
                const cvF = makeCanvas(resultF.cabinets);
                const cvS = showSide && resultF.cabinets.length > 0
                    ? makeSideCanvas(resultF.cabinets, eq.layoutConfig?.sideViewCabinetIndex, resultT.cabinets) : null;
                imagesHtml += flexPage(cvF, cvS);
            }
            if (resultT.hasLoads && resultT.cabinets.length > 0) {
                const cvT = makeCanvas(resultT.cabinets);
                const cvSr = showSide && resultT.cabinets.length > 0
                    ? makeSideCanvas(resultF.cabinets, eq.layoutConfig?.sideViewCabinetIndex, resultT.cabinets) : null;
                imagesHtml += flexPage(cvT, cvSr);
            }
        } else {
            const result = this.suggestLayout(eq);
            if (!result.hasLoads || result.cabinets.length === 0) {
                console.warn('[PDF Export] Export canceled: no loads with typicals or no cabinets defined');
                app.toast('Nenhuma carga com típico ou nenhum armário definido para exportar.', 'warning');
                return;
            }
            const cv = makeCanvas(result.cabinets);
            const cvS = showSide && result.cabinets.length > 0
                ? makeSideCanvas(result.cabinets, eq.layoutConfig?.sideViewCabinetIndex) : null;
            imagesHtml = flexPage(cv, cvS);
        }

        const overlay = document.createElement('div');
        overlay.id = '_layout_print_overlay';
        overlay.innerHTML = `
            <style>
                @media print {
                    body > *:not(#_layout_print_overlay) { display: none !important; }
                    #_layout_print_overlay {
                        display: flex !important;
                        position: fixed; top: 0; left: 0;
                        width: 100vw; height: 100vh;
                        background: white; margin: 0; padding: 0;
                        justify-content: center; align-items: center;
                    }
                    #_layout_print_overlay img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                }
                @media screen {
                    #_layout_print_overlay { display: none; }
                }
            </style>
            ${imagesHtml}
        `;
        document.body.appendChild(overlay);

        const cleanup = () => {
            const el = document.getElementById('_layout_print_overlay');
            if (el) el.remove();
            window.removeEventListener('afterprint', cleanup);
        };

        window.addEventListener('afterprint', cleanup);
        requestAnimationFrame(() => {
            window.print();
        });
        setTimeout(cleanup, 10000);
    },

    _exportLayoutDXF() {
        try {
        const data = store.getState().activeTechnicalProposal;
        const eq = data?.equipments?.[this.activeEquipmentIndex];
        if (!eq) { console.warn('[DXF] eq not found'); app.toast('Nenhum equipamento ativo.', 'error'); return; }
        const montagem = eq.technical?.montagem || 'Em Linha';
        const isB2B = montagem === 'Back to Back';
        const materiais = store.getState().materiais || [];

        const materialDxfMap = {};
        for (const m of materiais) {
            if (m.dxf_block) {
                try { materialDxfMap[m.id] = JSON.parse(m.dxf_block); }
                catch (e) { /* skip invalid JSON */ }
            }
        }

        let CAB_H = 2300;
        const yf = y => CAB_H - y;

        const d = new DXFWriter();
        d.setUseCRLF(true);

        const L_CAB = 'CABINETE';
        const L_BAR = 'BARRAMENTO';
        const L_CAN = 'CANALETA';
        const L_CAN_SIDE = 'CANALETA_SIDE';
        const L_TRI = 'TRILHO_DIN';
        const L_COMP = 'COMPONENTE';
        const L_TERRA = 'BARRA_TERRA';
        const L_BASE = 'BASE';
        const L_DIM = 'DIMENSAO';
        const L_TXT = 'TEXTO';

        d.addLayer(L_CAB, 7, 'CONTINUOUS');
        d.addLayer(L_BAR, 7, 'CONTINUOUS');
        d.addLayer(L_CAN, 7, 'CONTINUOUS');
        d.addLayer(L_CAN_SIDE, 7, 'DASHED');
        d.addLayer(L_TRI, 7, 'CONTINUOUS');
        d.addLayer(L_COMP, 7, 'CONTINUOUS');
        d.addLayer(L_TERRA, 7, 'CONTINUOUS');
        d.addLayer(L_BASE, 7, 'CONTINUOUS');
        d.addLayer(L_DIM, 7, 'CONTINUOUS');
        d.addLayer(L_TXT, 7, 'CONTINUOUS');
        d.addStyle('ARIAL', 'Arial', 0, 1);
        d.setDimStyle('GERAPRO');

        const addedBlocks = new Set();

        const drawCabinetGroup = (cabinets, offsetX) => {
            let x = offsetX;
            for (let ci = 0; ci < cabinets.length; ci++) {
                const cab = cabinets[ci];
                const cabW = cab.width;
                const cfg = cab.layoutConfig || this._getDefaultLayoutConfig();

                // Cabinet outline (layout: 0 to 2300mm)
                d.setActiveLayer(L_CAB);
                d.rect(x, yf(CAB_H), cabW, CAB_H);

                // Olhais para içamento (60×60mm acima da linha 0, círculo 20mm Ø) — apenas Forma 1/2
                if (!this._isForma34KitFrame(cab.segregacao, cab._fabricante)) {
                    d.rect(x, yf(0), 60, 60);                              // canto esquerdo
                    d.rect(x + cabW - 60, yf(0), 60, 60);                 // canto direito
                    d.circle(x + 30, yf(-30), 10);                         // furo central esquerdo
                    d.circle(x + cabW - 30, yf(-30), 10);                  // furo central direito
                }

                // Busbar zone label (apenas Forma 2)
                if (isForma2) {
                    d.setActiveLayer(L_BAR);
                    d.line(x, yf(300), x + cabW, yf(300));
                    d.setActiveLayer(L_TXT);
                    d.text(x + cabW / 2, yf(150), 20, 0, 'Barramentos', 'ARIAL');
                }
                d.setActiveLayer(L_TXT);
                d.text(x + cabW / 2, yf(20), 20, 0, cab.name, 'ARIAL');

                const isCabForma34 = this._isForma34KitFrame(cab.segregacao, cab._fabricante);

                if (isCabForma34) {
                    // ── KitFrame Forma 3A-4B: barramentos, gavetas, coluna cabos, barra terra ──
                    const ccwDxf = cfg.colunaCabosWidth || 200;
                    const gavWDxf = 600;
                    const colCabWDxf = ccwDxf;

                    // Barramentos (Y=0-300, full width)
                    d.setActiveLayer(L_BAR);
                    d.rect(x, yf(300), cabW, 300);
                    d.rect(x + 3, yf(297), cabW - 6, 294);
                    d.line(x, yf(300), x + cabW, yf(300));
                    d.setActiveLayer(L_TXT);
                    d.text(x + cabW / 2, yf(150), 20, 0, 'Barramentos', 'ARIAL');

                    // ── Exaustor de teto (500×100mm acima da área de gavetas) ──
                    {
                        const exWDxf = 500;
                        const exHDxf = 100;
                        const exXDxf = x + cabW / 2 - 250;
                        d.setActiveLayer(L_CAB);
                        d.rect(exXDxf, yf(0), exWDxf, exHDxf);
                        d.rect(exXDxf + 3, yf(-3), exWDxf - 6, exHDxf - 6);
                        d.setActiveLayer(L_TXT);
                        d.text(exXDxf + exWDxf / 2, yf(-50), 12, 0, 'Exaustor', 'ARIAL');
                    }

                    // Coluna de Cabos (Y=300-2200, right side)
                    const colCabXDxf = x + gavWDxf;
                    d.setActiveLayer(L_CAB);
                    d.rect(colCabXDxf, yf(2200), colCabWDxf, 1900);
                    d.rect(colCabXDxf + 3, yf(2197), colCabWDxf - 6, 1894);
                    d.setActiveLayer(L_TXT);
                    d.text(colCabXDxf + colCabWDxf / 2, yf(2170), 15, 0, 'Coluna Cabos', 'ARIAL');

                    // Gavetas area (Y=300-2100, left 600mm)
                    const gavDxf = cab._gavetas || [];
                    if (gavDxf.length > 0) {
                        let gavYOffDxf = 300;
                        for (const gav of gavDxf) {
                            const ghDxf = gav.height;
                            d.setActiveLayer(L_COMP);
                            d.rect(x, yf(gavYOffDxf + ghDxf), gavWDxf, ghDxf);
                            d.rect(x + 3, yf(gavYOffDxf + ghDxf - 3), gavWDxf - 6, ghDxf - 6);
                            const fechoXDxf = x + gavWDxf - 40;
                            if (gav.height === 100 || gav.height === 150) {
                                const fy = gavYOffDxf + ghDxf / 2 - 15;
                                d.rect(fechoXDxf, yf(fy + 30), 20, 30);
                                d.circle(fechoXDxf + 10, yf(fy + 15), 5);
                            } else if (gav.height >= 200) {
                                const fy1 = gavYOffDxf + 50 - 15;
                                const fy2 = gavYOffDxf + ghDxf - 50 - 15;
                                d.rect(fechoXDxf, yf(fy1 + 30), 20, 30);
                                d.circle(fechoXDxf + 10, yf(fy1 + 15), 5);
                                d.rect(fechoXDxf, yf(fy2 + 30), 20, 30);
                                d.circle(fechoXDxf + 10, yf(fy2 + 15), 5);
                            }
                            // Comando Mecânico (70x70mm rect + 16mm circle)
                            {
                                const cmWDxf = 70;
                                const cmHDxf = 70;
                                const cmXDxf = x + gavWDxf / 2 - 35;
                                let cmYDxf;
                                if (gav.height === 100) {
                                    cmYDxf = gavYOffDxf + ghDxf / 2 - 35;
                                } else {
                                    cmYDxf = gavYOffDxf + ghDxf - 50 - 35;
                                }
                                d.setActiveLayer(L_COMP);
                                d.rect(cmXDxf, yf(cmYDxf + cmHDxf), cmWDxf, cmHDxf);
                                d.circle(cmXDxf + 35, yf(cmYDxf + 35), 8);
                            }
                            d.setActiveLayer(L_TXT);
                            const cmCenterYDxf = gav.height === 100 ? gavYOffDxf + ghDxf / 2 : gavYOffDxf + ghDxf - 50;
                            if (gav._isReserva) {
                                d.text(x + gavWDxf / 2 + 147, yf(cmCenterYDxf + 8 - 23.2), 12, 0, 'TAG??', 'ARIAL');
                                d.text(x + gavWDxf / 2 + 147, yf(cmCenterYDxf + 38 - 23.2), 12, 0, 'Gav. Reserva', 'ARIAL');
                            } else {
                                d.text(x + gavWDxf / 2 + 147, yf(cmCenterYDxf + 8 - 23.2), 12, 0, gav.cargaTag || '', 'ARIAL');
                                d.text(x + gavWDxf / 2 + 147, yf(cmCenterYDxf + 38 - 23.2), 12, 0, (gav.potencia ? gav.potencia + 'kW' : ''), 'ARIAL');
                            }
                            d.text(x + 30, yf(gavYOffDxf + 10), 8, 0, gav.id, 'ARIAL');
                            gavYOffDxf += ghDxf;
                        }
                    } else {
                        d.setActiveLayer(L_CAB);
                        d.rect(x, yf(2100), gavWDxf, 1800);
                        d.setActiveLayer(L_TXT);
                        d.text(x + gavWDxf / 2, yf(1200), 15, 0, 'Gavetas', 'ARIAL');
                    }

                    // Barra Terra (Y=2100-2200, left 600mm)
                    d.setActiveLayer(L_TERRA);
                    d.rect(x, yf(2200), gavWDxf, 100);
                    d.rect(x + 3, yf(2197), gavWDxf - 6, 94);
                    d.setActiveLayer(L_TXT);
                    d.text(x + gavWDxf / 2, yf(2150), 15, 0, 'Barra Terra', 'ARIAL');
                } else {
                    // ── Forma 1 / Forma 2: canaletas, trilhos, componentes, placa de montagem ──
                    // Canaletas
                    d.setActiveLayer(L_CAN);
                    for (const can of cfg.canaletas || []) {
                        if (can.tipo === 'quadro') {
                            const cx = x + (can.x || 0);
                            const cy = (can.y || 0);
                            const cw = can.larguraQuadro || 500;
                            const ch = can.alturaQuadro || 1800;
                            const cl = can.largura_base || 50;
                            d.rect(cx, yf(cy + ch), cw, ch);
                            d.rect(cx + cl, yf(cy + ch - cl), cw - 2 * cl, ch - 2 * cl);
                            d.line(cx, yf(cy), cx + cl, yf(cy + cl));
                            d.line(cx + cw, yf(cy), cx + cw - cl, yf(cy + cl));
                            d.line(cx + cw, yf(cy + ch), cx + cw - cl, yf(cy + ch - cl));
                            d.line(cx, yf(cy + ch), cx + cl, yf(cy + ch - cl));
                            if (cw > 60 && ch > 40) {
                                const modeloTxt = can.modelo || (can.largura_base || '') + 'x' + (can.profundidade || '');
                                if (modeloTxt) {
                                    d.setActiveLayer(L_TXT);
                                    d.text(cx + cw / 2, yf(cy + ch / 2), 30, 0, modeloTxt, 'ARIAL');
                                    d.setActiveLayer(L_CAN);
                                }
                            }
                        } else if (can.tipo === 'linear') {
                            const lx = x + (can.x || 0);
                            const ly = (can.y || 0);
                            const lw = can.orientacao === 'H' ? (can.comprimento || 0) : (can.largura_base || can.largura || 50);
                            const lh = can.orientacao === 'H' ? (can.largura_base || can.largura || 50) : (can.comprimento || 0);
                            d.rect(lx, yf(ly + lh), lw, lh);
                            d.setActiveLayer(L_TXT);
                            d.text(lx + lw / 2, yf(ly + lh / 2), 30, 0, 'TESTE', 'ARIAL');
                            d.setActiveLayer(L_CAN);
                        }
                    }

                    // DIN rails + components
                    for (const row of cab.rows || []) {
                        if (row.trilho) {
                            const t = row.trilho;
                            d.setActiveLayer(L_TRI);
                            d.rect(x + t.x, yf(t.y + t.h), t.w, t.h);
                        }
                        for (const item of row.items) {
                            const ix = x + item.x;
                            const iy = item.y;
                            const iw = Math.max(item.w, 1);
                            const ih = Math.max(item.h, 1);
                            const matDxf = materialDxfMap[item._matId];

                            if (matDxf && matDxf.entities && matDxf.entities.length > 0) {
                                const rawId = item._matId;
                                const blockName = 'B' + (rawId ? rawId.replace(/[^a-zA-Z0-9]/g, '_') : 'x_' + Math.random().toString(36).slice(2, 8));
                                if (!addedBlocks.has(blockName)) {
                                    addedBlocks.add(blockName);
                                    d.addBlock(blockName, (b) => {
                                        for (const ent of matDxf.entities) {
                                            this._drawDxfEntity(b, ent);
                                        }
                                    });
                                }
                                d.setActiveLayer(L_COMP);
                                d.insertBlock(blockName, ix, yf(iy + ih), 1, 1, 0);
                            } else {
                                d.setActiveLayer(L_COMP);
                                d.rect(ix, yf(iy + ih), iw, ih);
                                if (iw > 20 && ih > 10) {
                                    const label = (item.desc || '').length > 5 ? (item.desc || '').slice(0, 4) + '.' : (item.desc || '');
                                    d.setActiveLayer(L_TXT);
                                    d.text(ix + iw / 2, yf(iy + ih / 2), 20, 0, label, 'ARIAL');
                                }
                            }
                        }
                    }

                    // Placa de montagem + barra terra
                    const isCabForma2 = cab.segregacao === 'Forma 2a' || cab.segregacao === 'Forma 2b';
                    d.setActiveLayer(L_CAB);
                    d.rect(x + 30, yf(panelH - 30), cabW - 60, panelH - 60);
                    d.setActiveLayer(L_TERRA);
                    if (isCabForma2) {
                        d.rect(x + 50, yf(315 + 1840), cabW - 100, 1840);
                    } else {
                        const plateH = panelH - 105;
                        const plateYFront = 30 + (panelH - 60 - plateH) / 2;
                        d.rect(x + 50, yf(plateYFront + plateH), cabW - 100, plateH);
                    }
                    d.setActiveLayer(L_TXT);
                    d.text(x + cabW / 2, yf(2135), 20, 0, 'Placa de Montagem', 'ARIAL');
                    if (!isCabForma2 && !cab._isAutomation) {
                        d.setActiveLayer(L_TERRA);
                        d.line(x, yf(panelH - 100), x + cabW, yf(panelH - 100));
                        d.setActiveLayer(L_TXT);
                        d.text(x + cabW / 2, yf(panelH - 75), 20, 0, 'Barra Terra', 'ARIAL');
                    }
                }

                // Base
                d.setActiveLayer(L_BASE);
                d.line(x, yf(panelH), x + cabW, yf(panelH));
                d.setActiveLayer(L_TXT);
                d.text(x + cabW / 2, yf(panelH + 25), 20, 0, 'Base', 'ARIAL');

                // Cabinet width dimension
                d.setActiveLayer(L_DIM);
                d.dim(x, yf(panelH + 190), x + cabW, yf(panelH + 190), cabW + 'mm', yf(panelH + 185), 'ARIAL');

                x += cabW;
            }
            // Título da vista (abaixo da base e das labels, centralizado)
            const totalWdxf = x - offsetX;
            if (totalWdxf > 0 && cabinets.length > 0) {
                const isRear = cabinets[0]._face === 'rear';
                const titulo = isRear ? 'Vista Traseira Interna' : 'Vista Frontal Interna';
                d.setActiveLayer(L_TXT);
                d.text(offsetX + totalWdxf / 2, yf(panelH + 280), 25, 0, titulo, 'ARIAL');
            }
        };

        const drawDoorCabinetGroup = (cabinets, offsetX) => {
            let x = offsetX;
            for (let ci = 0; ci < cabinets.length; ci++) {
                const cab = cabinets[ci];
                const cabW = cab.width;
                const cfg = cab.layoutConfig || this._getDefaultLayoutConfig();

                // Cabinet outline
                d.setActiveLayer(L_CAB);
                d.rect(x, yf(CAB_H), cabW, CAB_H);

                // Olhais
                d.rect(x, yf(0), 60, 60);
                d.rect(x + cabW - 60, yf(0), 60, 60);
                d.circle(x + 30, yf(-30), 10);
                d.circle(x + cabW - 30, yf(-30), 10);

                // Door rectangle (cab.width - 10 × panelH - 10)
                const doorW = cabW - 10;
                const doorX = x + 5;
                const doorY = 5;
                const doorH = panelH - 10;
                d.setActiveLayer(L_CAB);
                d.rect(doorX, yf(doorY + doorH), doorW, doorH);

                // Door components
                const doorRows = cab.doorRows || [];
                for (const row of doorRows) {
                    for (const item of row.items) {
                        const ix = x + item.x;
                        const iy = doorY + item.y;
                        const iw = Math.max(item.w, 1);
                        const ih = Math.max(item.h, 1);
                        d.setActiveLayer(L_COMP);
                        d.rect(ix, yf(iy + ih), iw, ih);
                        if (iw > 20 && ih > 10) {
                            const label = (item.desc || '').length > 5 ? (item.desc || '').slice(0, 4) + '.' : (item.desc || '');
                            d.setActiveLayer(L_TXT);
                            d.text(ix + iw / 2, yf(iy + ih / 2), 20, 0, label, 'ARIAL');
                        }
                    }
                }

                // Base
                d.setActiveLayer(L_BASE);
                d.line(x, yf(panelH), x + cabW, yf(panelH));
                d.setActiveLayer(L_TXT);
                d.text(x + cabW / 2, yf(panelH + 25), 20, 0, 'Base', 'ARIAL');

                // Dimension
                d.setActiveLayer(L_DIM);
                d.dim(x, yf(panelH + 190), x + cabW, yf(panelH + 190), cabW + 'mm × ' + (panelH + 100) + 'mm', yf(panelH + 185), 'ARIAL');

                x += cabW;
            }
            const totalWdxf = x - offsetX;
            if (totalWdxf > 0 && cabinets.length > 0) {
                const isRear = cabinets[0]._face === 'rear';
                const titulo = isRear ? 'Vista Traseira Externa' : 'Vista Frontal Externa';
                d.setActiveLayer(L_TXT);
                d.text(offsetX + totalWdxf / 2, yf(panelH + 280), 25, 0, titulo, 'ARIAL');
            }
        };

        const showSide = eq.layoutConfig?.showSideView;
        const seg = eq.technical?.segregacao;
        const isForma2 = seg === 'Forma 2a' || seg === 'Forma 2b';
        const isForma34dxf = this._isForma34KitFrame(seg, eq.technical?.fabricante);
        const panelH = (isForma2 || isForma34dxf) ? 2200 : parseInt(eq.technical?.alturaPainel) || 2200;
        const panelW = parseInt(eq.technical?.larguraPainel) || 800;
        const panelD = parseInt(eq.technical?.profundidadePainel) || 600;
        if (!isForma2 && !isForma34dxf) CAB_H = panelH + 100;

        let frontCabinets = [];
        let rearCabinets = [];
        const isAutomation = eq.type === 'PLC' || eq.type === 'REM';
        if (isAutomation) {
            const result = this._suggestAutomationLayout(eq);
            if (!result.hasLoads || result.cabinets.length === 0) {
                console.warn('[DXF] Export canceled: no BOM materials or no cabinets defined');
                app.toast('Nenhum material com dimensões ou nenhum armário definido para exportar.', 'warning');
                return;
            }
            frontCabinets = result.cabinets;
            const maxH_auto = Math.max(...frontCabinets.map(c => c.height || 2300), 2300);
            if (!isForma2 && !isForma34dxf) { CAB_H = maxH_auto; panelH = maxH_auto - 100; }
            drawCabinetGroup(frontCabinets, 0);
            const totalW = frontCabinets.reduce((s, c) => s + c.width, 0);
            if (isForma2 || seg === 'Forma 1') drawDoorCabinetGroup(frontCabinets, totalW + 200);
        } else if (isB2B) {
            const resultF = this.suggestLayout(eq, 'front');
            const resultR = this.suggestLayout(eq, 'rear');
            frontCabinets = resultF.cabinets;
            rearCabinets = resultR.cabinets;
            const maxH_b2b = Math.max(...[...frontCabinets, ...rearCabinets].map(c => c.height || 2300), 2300);
            if (!isForma2 && !isForma34dxf) { CAB_H = maxH_b2b; panelH = maxH_b2b - 100; }
            if (resultF.hasLoads && frontCabinets.length > 0) {
                drawCabinetGroup(frontCabinets, 0);
            }
            if (resultR.hasLoads && rearCabinets.length > 0) {
                const totalW = frontCabinets.reduce((s, c) => s + c.width, 0);
                drawCabinetGroup(rearCabinets, totalW + 200);
            }
            if ((isForma2 || seg === 'Forma 1') && frontCabinets.length > 0 && rearCabinets.length > 0) {
                const doorStart = frontCabinets.reduce((s, c) => s + c.width, 0) + 200 + rearCabinets.reduce((s, c) => s + c.width, 0) + 200;
                drawDoorCabinetGroup(frontCabinets, doorStart);
                const doorFrontEnd = doorStart + frontCabinets.reduce((s, c) => s + c.width, 0) + 200;
                drawDoorCabinetGroup(rearCabinets, doorFrontEnd);
            }
        } else {
            const result = this.suggestLayout(eq);
            if (!result.hasLoads || result.cabinets.length === 0) {
                console.warn('[DXF] Export canceled: no loads with typicals or no cabinets defined');
                app.toast('Nenhuma carga com típico ou nenhum armário definido para exportar.', 'warning');
                return;
            }
            frontCabinets = result.cabinets;
            const maxH_single = Math.max(...frontCabinets.map(c => c.height || 2300), 2300);
            if (!isForma2 && !isForma34dxf) { CAB_H = maxH_single; panelH = maxH_single - 100; }
            drawCabinetGroup(frontCabinets, 0);
            if (isForma2 || seg === 'Forma 1') {
                const totalW = frontCabinets.reduce((s, c) => s + c.width, 0);
                drawDoorCabinetGroup(frontCabinets, totalW + 200);
            }
        }

        // Side view group (DXF) — combined single section view
        const drawDxfSideView = (cabinets, cabinetIndex, labelPrefix, startX, rearCabinets) => {
            if (!cabinets || cabinets.length === 0) return startX;
            const isB2B = Array.isArray(rearCabinets) && rearCabinets.length > 0;
            const cabIdx = cabinetIndex;
            const selectedCabins = (cabIdx != null && cabIdx >= 0 && cabIdx < cabinets.length)
                ? [cabinets[cabIdx]]
                : cabinets;

            // Depths: front cabinet + optional rear cabinet
            const frontDepth = Math.max(...selectedCabins.map(c => c.depth || 600));
            const rearDepth = isB2B
                ? Math.max(...rearCabinets.map(c => c.depth || 600))
                : 0;
            const totalDepth = isB2B ? frontDepth : frontDepth + rearDepth;
            const isForma34Side = cabinets.some(c => this._isForma34KitFrame(c.segregacao, c._fabricante));
            const sx = startX;

            // Cabinet outline (single combined box)
            d.setActiveLayer(L_CAB);
            d.rect(sx, yf(CAB_H), totalDepth, CAB_H);

            // Olhais para içamento — vista lateral (corte): 4×60mm, faces internas distanciadas 485mm — apenas Forma 1/2
            if (!isForma34Side) {
                const eyeW_dx = 4, eyeH_dx = 60, innerDist_dx = 485;
                const marginEyeDx = (totalDepth - innerDist_dx - eyeW_dx * 2) / 2;
                if (marginEyeDx > 0) {
                    d.rect(sx + marginEyeDx, yf(0), 4, 60);
                    d.rect(sx + marginEyeDx + eyeW_dx + innerDist_dx, yf(0), 4, 60);
                }
            }

            // Base
            d.setActiveLayer(L_BASE);
            d.line(sx, yf(panelH), sx + totalDepth, yf(panelH));
            d.setActiveLayer(L_TXT);
            d.text(sx + totalDepth / 2, yf(panelH + 25), 20, 0, 'Base', 'ARIAL');

            // Ground bar (apenas CCM Forma 1)
            const isForma2 = cabinets.some(c => c.segregacao === 'Forma 2a' || c.segregacao === 'Forma 2b');
            const isAutomationSide = cabinets.some(c => c._isAutomation);
            if (!isForma2 && !isAutomationSide && !isForma34Side) {
                d.setActiveLayer(L_TERRA);
                d.line(sx, yf(panelH - 100), sx + totalDepth, yf(panelH - 100));
                d.setActiveLayer(L_TXT);
                d.text(sx + totalDepth / 2, yf(panelH - 75), 20, 0, 'Barra Terra', 'ARIAL');
            }

            if (!isForma34Side) {
                // Borda de 30mm + placa de montagem (apenas Forma 1 / Forma 2)
                let minPlateZ_dx = null, minPlateD_dx = 0;
                for (const cab of selectedCabins) {
                    const cd = cab._assignData;
                    const src = cd && cab._face ? (cd.faces?.[cab._face]?.assigned || {}) : (cd?.assigned || {});
                    for (const row of cab.rows || []) {
                        for (const item of row.items || []) {
                            const zo = item._matId ? (src[item._matId]?.zOffset ?? item._zOffset) : undefined;
                            if (zo != null && (minPlateZ_dx === null || zo < minPlateZ_dx)) {
                                minPlateZ_dx = zo;
                                minPlateD_dx = item.d || 0;
                            }
                        }
                    }
                }
                const plateFaceDir_dx = minPlateZ_dx !== null ? minPlateZ_dx : 0;
                let minRearZ_dx = null, minRearD_dx = 0;
                if (isB2B) {
                    for (const cab of rearCabinets) {
                        const cd = cab._assignData;
                        const src = cd && cab._face ? (cd.faces?.[cab._face]?.assigned || {}) : (cd?.assigned || {});
                        for (const row of cab.rows || []) {
                            for (const item of row.items || []) {
                                const zo = item._matId ? (src[item._matId]?.zOffset ?? item._zOffset) : undefined;
                                if (zo != null && (minRearZ_dx === null || zo < minRearZ_dx)) {
                                    minRearZ_dx = zo;
                                    minRearD_dx = item.d || 0;
                                }
                            }
                        }
                    }
                }
                const plateFaceDirRear_dx = minRearZ_dx !== null ? minRearZ_dx : 0;
                if (isForma2) {
                    d.setActiveLayer(L_CAB);
                    d.rect(sx + 30, yf(panelH - 30), totalDepth - 60, panelH - 60);
                    d.setActiveLayer(L_TERRA);
                    const plateLeft_dx = totalDepth - plateFaceDir_dx - 20;
                    d.rect(sx + plateLeft_dx, yf(315 + 1840), 20, 1840);
                    d.setActiveLayer(L_TXT);
                    d.text(sx + plateLeft_dx + 10, yf(335), 20, 0, 'PM', 'ARIAL');
                    if (isB2B) {
                        d.setActiveLayer(L_TERRA);
                        d.rect(sx + plateFaceDirRear_dx, yf(315 + 1840), 20, 1840);
                        d.setActiveLayer(L_TXT);
                        d.text(sx + plateFaceDirRear_dx + 10, yf(335), 20, 0, 'PM', 'ARIAL');
                    }
                } else {
                    d.setActiveLayer(L_CAB);
                    d.rect(sx + 30, yf(panelH - 30), totalDepth - 60, panelH - 60);
                    d.setActiveLayer(L_TERRA);
                    const plateHSide = panelH - 105;
                    const plateYSide = 30 + (panelH - 60 - plateHSide) / 2;
                    const plateLeft_dx = totalDepth - plateFaceDir_dx - 20;
                    d.rect(sx + plateLeft_dx, yf(plateYSide + plateHSide), 20, plateHSide);
                    d.setActiveLayer(L_TXT);
                    d.text(sx + plateLeft_dx + 10, yf(35 + plateHSide / 2), 20, 0, 'PM', 'ARIAL');
                    if (isB2B) {
                        d.setActiveLayer(L_TERRA);
                        d.rect(sx + plateFaceDirRear_dx, yf(plateYSide + plateHSide), 20, plateHSide);
                        d.setActiveLayer(L_TXT);
                        d.text(sx + plateFaceDirRear_dx + 10, yf(35 + plateHSide / 2), 20, 0, 'PM', 'ARIAL');
                    }
                }

                // Canaletas na vista lateral (apenas Forma 1 / Forma 2)
                d.setActiveLayer(L_CAN_SIDE);
                for (const cab of selectedCabins) {
                    const cfgC = cab.layoutConfig || this._getDefaultLayoutConfig();
                    for (const can of cfgC.canaletas || []) {
                        const profC = can.profundidade || can.largura_base || 50;
                        const canZPos = isForma2 ? sx + totalDepth - plateFaceDir_dx : sx + totalDepth - profC;
                        if (can.tipo === 'quadro') {
                            for (const seg of can.segmentos || []) {
                                if (seg.orientacao === 'V') {
                                    d.rect(canZPos, yf(seg.y + seg.comprimento), profC, seg.comprimento);
                                    const modeloTxt = can.modelo || (can.largura_base || '') + 'x' + (can.profundidade || '');
                                    if (modeloTxt) {
                                        d.setActiveLayer(L_TXT);
                                        d.text(canZPos + profC / 2, yf(seg.y + seg.comprimento / 2), 30, 0, modeloTxt, 'ARIAL');
                                        d.setActiveLayer(L_CAN_SIDE);
                                    }
                                }
                            }
                        } else if (can.tipo === 'linear' && can.orientacao === 'V') {
                            d.rect(canZPos, yf(can.y + can.comprimento), profC, can.comprimento);
                            const modeloTxt = can.modelo || (can.largura_base || can.largura || '') + 'x' + (can.profundidade || can.altura || '');
                            if (modeloTxt) {
                                d.setActiveLayer(L_TXT);
                                d.text(canZPos + profC / 2, yf(can.y + can.comprimento / 2), 30, 0, modeloTxt, 'ARIAL');
                                d.setActiveLayer(L_CAN_SIDE);
                            }
                        }
                    }
                }

                if (isB2B) {
                    for (const cab of rearCabinets) {
                        const cfgC = cab.layoutConfig || this._getDefaultLayoutConfig();
                        for (const can of cfgC.canaletas || []) {
                            const profC = can.profundidade || can.largura_base || 50;
                            const canZPos = sx;
                            if (can.tipo === 'quadro') {
                                for (const seg of can.segmentos || []) {
                                    if (seg.orientacao === 'V') {
                                        d.rect(canZPos, yf(seg.y + seg.comprimento), profC, seg.comprimento);
                                        const modeloTxt = can.modelo || (can.largura_base || '') + 'x' + (can.profundidade || '');
                                        if (modeloTxt) {
                                            d.setActiveLayer(L_TXT);
                                            d.text(canZPos + profC / 2, yf(seg.y + seg.comprimento / 2), 30, 0, modeloTxt, 'ARIAL');
                                            d.setActiveLayer(L_CAN_SIDE);
                                        }
                                    }
                                }
                            } else if (can.tipo === 'linear' && can.orientacao === 'V') {
                                d.rect(canZPos, yf(can.y + can.comprimento), profC, can.comprimento);
                                const modeloTxt = can.modelo || (can.largura_base || can.largura || '') + 'x' + (can.profundidade || can.altura || '');
                                if (modeloTxt) {
                                    d.setActiveLayer(L_TXT);
                                    d.text(canZPos + profC / 2, yf(can.y + can.comprimento / 2), 30, 0, modeloTxt, 'ARIAL');
                                    d.setActiveLayer(L_CAN_SIDE);
                                }
                            }
                        }
                    }
                }
            }

            // Porta frontal (6.5mm × panelH-10mm) — lado externo (direita)
            const doorSideH = panelH - 10;
            d.setActiveLayer(L_CAB);
            d.rect(sx + totalDepth, yf(panelH - 5), 6.5, doorSideH);
            d.setActiveLayer(L_TXT);
            d.text(sx + totalDepth + 3.25, yf(-25), 15, 0, 'Porta', 'ARIAL');

            // Elemento traseiro espelhado (esquerda): Porta (B2B) ou Tampa Traseira aparafusada
            const backLabel = isB2B ? 'Porta' : 'Tampa Traseira';
            d.setActiveLayer(L_CAB);
            d.rect(sx - 6.5, yf(panelH - 5), 6.5, doorSideH);
            d.setActiveLayer(L_TXT);
            d.text(sx - 3.25, yf(-25), 15, 0, backLabel, 'ARIAL');

            // Linha dos barramentos (Y=300) — apenas Forma 2
            if (isForma2) {
                d.setActiveLayer(L_BAR);
                d.line(sx + 30, yf(300), sx + totalDepth - 30, yf(300));
                d.setActiveLayer(L_TXT);
                d.text(sx + totalDepth / 2, yf(150), 20, 0, 'Barramentos', 'ARIAL');
            }

            // ============================================================
            // FRONT CABINET COMPONENTS
            // ============================================================
            const collectItems = (cabList) => {
                const allItems = [];
                for (const cab of cabList) {
                    const cabData = cab._assignData;
                    const assignedSource = cabData && cab._face
                        ? (cabData.faces?.[cab._face]?.assigned || {})
                        : (cabData?.assigned || {});
                    for (const row of cab.rows || []) {
                        for (const item of row.items || []) {
                            allItems.push({ item, assignedSource });
                        }
                    }
                }
                return allItems;
            };

            const drawItems = (itemsList, depth, isMirrored) => {
                const itemsWithManualZ = [];
                const itemsWithoutZ = [];
                for (const { item, assignedSource } of itemsList) {
            const zOff = item._matId ? (assignedSource[item._matId]?.zOffset ?? item._zOffset) : undefined;
                    if (zOff != null) {
                        itemsWithManualZ.push({ item, z: zOff });
                    } else {
                        itemsWithoutZ.push(item);
                    }
                }

                const totalManualZEnd = itemsWithManualZ.reduce((s, e) => Math.max(s, e.z), 0);
                const remainingDepth = Math.max(0, depth - totalManualZEnd);
                const autoItemsDepth = itemsWithoutZ.reduce((s, it) => s + (it.d || 0), 0);
                const gap = autoItemsDepth > 0 && itemsWithoutZ.length > 1
                    ? Math.min(5, Math.max(0, remainingDepth - autoItemsDepth) / (itemsWithoutZ.length - 1))
                    : 0;

                // Draw items with manual Z
                d.setActiveLayer(L_COMP);
                for (const { item, z } of itemsWithManualZ) {
                    const id = item.d || 20;
                    const ih = item.h || 40;
                    const izx = isMirrored
                        ? sx + Math.max(Math.min(z, depth) - id, 0)
                        : sx + Math.max(depth - z, 0);
                    const izy = (item.y || 0);
                    d.rect(izx, yf(izy + ih), Math.max(id, 1), Math.max(ih, 1));
                    if (id > 10 && ih > 10) {
                        const label2 = (item.desc || '').length > 5 ? (item.desc || '').slice(0, 4) + '.' : (item.desc || '');
                        d.setActiveLayer(L_TXT);
                        d.text(izx + id / 2, yf(izy + ih / 2), 20, 0, label2, 'ARIAL');
                        d.setActiveLayer(L_COMP);
                    }
                }

                // Draw auto-distributed items
                let currentZ = totalManualZEnd;
                const sortedAuto = [...itemsWithoutZ].sort((a, b) => (b.d || 0) - (a.d || 0));
                for (const item of sortedAuto) {
                    const id = item.d || 20;
                    const ih = item.h || 40;
                    const izx = isMirrored
                        ? sx + Math.max(currentZ - id, 0)
                        : sx + Math.max(depth - currentZ, 0);
                    const izy = (item.y || 0);
                    d.setActiveLayer(L_COMP);
                    d.rect(izx, yf(izy + ih), Math.max(id, 1), Math.max(ih, 1));
                    if (id > 10 && ih > 10) {
                        const label2 = (item.desc || '').length > 5 ? (item.desc || '').slice(0, 4) + '.' : (item.desc || '');
                        d.setActiveLayer(L_TXT);
                        d.text(izx + id / 2, yf(izy + ih / 2), 20, 0, label2, 'ARIAL');
                    }
                    currentZ += isMirrored ? -(id + gap) : (id + gap);
                }
            };

            // Draw front cabinet items
            drawItems(collectItems(selectedCabins), frontDepth, false);

            // Draw rear cabinet items (B2B) — mirrored
            if (isB2B) {
                const rearSelected = (cabIdx != null && cabIdx >= 0 && cabIdx < rearCabinets.length)
                    ? [rearCabinets[cabIdx]]
                    : rearCabinets;
                const actualRearDepth = Math.max(...rearSelected.map(c => c.depth || 600));
                drawItems(collectItems(rearSelected), actualRearDepth, true);
            }

            // Depth dimension
            d.setActiveLayer(L_DIM);
            if (isB2B) {
                d.dim(sx, yf(panelH + 190), sx + totalDepth, yf(panelH + 190), totalDepth + 'mm', yf(panelH + 175), 'ARIAL');
            } else {
                d.dim(sx, yf(panelH + 190), sx + totalDepth, yf(panelH + 190), frontDepth + 'mm', yf(panelH + 175), 'ARIAL');
            }

            d.setActiveLayer(L_TXT);
            d.text(sx + totalDepth / 2, yf(panelH + 280), 20, 0, labelPrefix, 'ARIAL');

            return sx + totalDepth;
        };

        if (showSide && frontCabinets.length > 0) {
            const frontW = frontCabinets.reduce((s, c) => s + c.width, 0);
            const rearW = rearCabinets.reduce((s, c) => s + c.width, 0);
            let lastGroupEnd = frontW;
            if (isB2B) lastGroupEnd += 200 + rearW;
            if (isForma2 || isAutomation) {
                lastGroupEnd += 200 + frontW;
                if (isB2B) lastGroupEnd += 200 + rearW;
            }
            const dx = lastGroupEnd + 300;
            drawDxfSideView(frontCabinets, -1, 'VISTA LATERAL (Corte)', dx, isB2B ? rearCabinets : undefined);
        }

        const dxfStr = d.toDxfString();

        // Diagnostic: find non-ASCII characters
        const nonAscii = (dxfStr.match(/[^\x00-\x7F]/g) || []);
        const nonAsciiInfo = nonAscii.length > 0
            ? 'NON-ASCII CHARS: [' + [...new Set(nonAscii)].join(', ') + ']\n'
            : 'NON-ASCII CHARS: none (all ASCII)\n';
        const hasNaN = /NaN/.test(dxfStr) ? 'WARNING: Contains NaN values!\n' : 'No NaN found\n';
        const blkStart = dxfStr.indexOf('0\nSECTION\n2\nBLOCKS');
        const blkEndVal = blkStart >= 0 ? dxfStr.indexOf('0\nENDSEC', blkStart + 10) : -1;
        const blkSection = blkStart >= 0 && blkEndVal >= 0 ? dxfStr.slice(blkStart, blkEndVal + 10) : 'BLOCKS SECTION NOT FOUND';
        const diagnosticHeader =
            '=== DXF DIAGNOSTIC ===\n' +
            'Size: ' + dxfStr.length + ' bytes\n' +
            'Layers: ' + Object.keys(d.layers).join(', ') + '\n' +
            'Blocks: ' + (d.blockOrder || []).join(', ') + '\n' +
            'Entities (main): ' + d.entities.length + '\n' +
            'Starts with SECTION: ' + dxfStr.startsWith('0\nSECTION') + '\n' +
            'Ends with EOF: ' + dxfStr.trimEnd().endsWith('0\nEOF') + '\n' +
            'SECTION count: ' + (dxfStr.match(/0\nSECTION/g) || []).length + '\n' +
            'ENDSEC count: ' + (dxfStr.match(/0\nENDSEC/g) || []).length + '\n' +
            hasNaN +
            nonAsciiInfo +
            'First 500 chars:\n' + dxfStr.slice(0, 500) + '\n\n' +
            'Last 500 chars:\n' + dxfStr.slice(-500) + '\n\n' +
            'BLOCKS section:\n' + blkSection + '\n\n' +
            '=== FULL DXF CONTENT ===\n';

        // Download .dxf
        const blob = new Blob([dxfStr], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (eq.tag || 'layout') + '_layout.dxf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Also download diagnostic .txt
        const blobTxt = new Blob([diagnosticHeader + dxfStr], { type: 'text/plain;charset=utf-8' });
        const urlTxt = URL.createObjectURL(blobTxt);
        const aTxt = document.createElement('a');
        aTxt.href = urlTxt;
        aTxt.download = (eq.tag || 'layout') + '_layout_dxf_debug.txt';
        document.body.appendChild(aTxt);
        setTimeout(() => {
            aTxt.click();
            document.body.removeChild(aTxt);
            URL.revokeObjectURL(urlTxt);
            URL.revokeObjectURL(url);
        }, 500);
        } catch (e) {
            console.error('[DXF Export Error]', e);
            if (typeof app?.toast === 'function') app.toast('Erro ao exportar DXF: ' + (e.message || e), 'error');
        }
    },

    _exportLayoutQET() {
        try {
            const data = store.getState().activeTechnicalProposal;
            const eq = data?.equipments?.[this.activeEquipmentIndex];
            if (!eq) { app.toast('Nenhum equipamento ativo.', 'error'); return; }

            const materiais = store.getState().materiais || [];
            const componentes = [];
            const bornes = [];
            let compY = 0;
            let borneY = 0;
            const seen = new Set();

            const cabAssignments = eq.layoutConfig?.cabinetAssignments || {};
            const matIds = new Set();
            for (const cab of Object.values(cabAssignments)) {
                if (cab.assigned) Object.keys(cab.assigned).forEach(id => matIds.add(id));
                if (cab.loads) {
                    for (const loadTag of Object.keys(cab.loads)) {
                        Object.keys(cab.loads[loadTag]).forEach(id => matIds.add(id));
                    }
                }
                if (cab.faces) {
                    for (const face of Object.values(cab.faces)) {
                        if (face.assigned) Object.keys(face.assigned).forEach(id => matIds.add(id));
                        if (face.loads) {
                            for (const loadTag of Object.keys(face.loads)) {
                                Object.keys(face.loads[loadTag]).forEach(id => matIds.add(id));
                            }
                        }
                    }
                }
            }

            if (matIds.size === 0) {
                for (const m of materiais) matIds.add(m.id);
            }

            for (const m of materiais) {
                if (!matIds.has(m.id)) continue;
                if (seen.has(m.id)) continue;
                seen.add(m.id);
                const isBorne = (m.categoria || '').toLowerCase().includes('borne');
                if (isBorne) {
                    bornes.push({
                        numero: String(bornes.length + 1),
                        regua_parent: 'X1',
                        posicaoX: 0,
                        posicaoY: borneY
                    });
                    borneY += 8;
                } else {
                    const cat = (m.categoria || '').toLowerCase();
                    const simboloQet = cat.includes('contator') ? 'embed://import/industrie/contacteur.elmt'
                        : cat.includes('disjuntor') || cat.includes('dijuntor') || cat.includes('breaker') ? 'embed://import/industrie/disjoncteur.elmt'
                        : cat.includes('relé') || cat.includes('rele') || cat.includes('relay') ? 'embed://import/industrie/relais.elmt'
                        : cat.includes('fusível') || cat.includes('fusivel') || cat.includes('fuse') ? 'embed://import/industrie/fusible.elmt'
                        : cat.includes('fonte') || cat.includes('fonte_alimentacao') ? 'embed://import/industrie/transfo.elmt'
                        : cat.includes('transformador') ? 'embed://import/industrie/transfo.elmt'
                        : cat.includes('motor') ? 'embed://import/industrie/moteur.elmt'
                        : cat.includes('botão') || cat.includes('botao') || cat.includes('push') ? 'embed://import/industrie/interrupteur.elmt'
                        : cat.includes('sinal') || cat.includes('led') || cat.includes('lâmpada') || cat.includes('lampada') ? 'embed://import/industrie/voyant.elmt'
                        : 'embed://import/industrie/boite.elmt';
                    const tag = m.descricao || m.codigoInterno || m.id;
                    const altura = parseFloat(m.altura_mm) || 50;
                    componentes.push({
                        id: m.id,
                        tag: tag.length > 30 ? tag.substring(0, 30) : tag,
                        posicaoX: 50,
                        posicaoY: compY,
                        simboloQet,
                        orientacao: 0,
                        terminais: [
                            { x: 0, y: -Math.round(altura / 2 / 10) * 10, name: '1', orientation: 0, number: '1' },
                            { x: 0, y: Math.round(altura / 2 / 10) * 10, name: '2', orientation: 2, number: '2' }
                        ]
                    });
                    compY += 8;
                }
            }

            const ptcFolder = window.app.currentPtc?.folder || data.codigo || '';
            const titleblock = {
                titulo: `Layout - ${eq.tag}`,
                cliente: data.cliente || '',
                numeroProposta: ptcFolder,
                data: new Date().toISOString().split('T')[0],
                autor: 'GeraPro'
            };

            fetch('/api/export-qet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ componentes, bornes, titleblock })
            })
            .then(res => {
                if (!res.ok) return res.text().then(t => { throw new Error(t); });
                return res.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${eq.tag || 'layout'}.qet`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                a.remove();
                app.toast('Arquivo QET exportado com sucesso!', 'success');
            })
            .catch(e => {
                console.error(e);
                app.toast('Erro: ' + e.message, 'error');
            });
        } catch (e) {
            console.error(e);
            app.toast('Erro ao exportar QET: ' + e.message, 'error');
        }
    },

    _drawDxfEntity(drawing, entity) {
        switch (entity.type) {
            case 'LINE':
                if (entity.startPoint && entity.endPoint) {
                    drawing.line(entity.startPoint.x, entity.startPoint.y, entity.endPoint.x, entity.endPoint.y);
                }
                break;
            case 'CIRCLE':
                if (entity.center && entity.radius) {
                    drawing.circle(entity.center.x, entity.center.y, entity.radius);
                }
                break;
            case 'ARC':
                if (entity.center && entity.radius && entity.startAngle != null && entity.endAngle != null) {
                    const segs = 32;
                    const pts = [];
                    const sr = entity.startAngle * Math.PI / 180;
                    const er = entity.endAngle * Math.PI / 180;
                    for (let i = 0; i <= segs; i++) {
                        const t = sr + (er - sr) * (i / segs);
                        pts.push([entity.center.x + entity.radius * Math.cos(t), entity.center.y + entity.radius * Math.sin(t)]);
                    }
                    drawing.polyline(pts, false);
                }
                break;
            case 'LWPOLYLINE':
            case 'POLYLINE':
                if (entity.vertices && entity.vertices.length >= 2) {
                    const pts = entity.vertices.map(v => [v.x, v.y]);
                    const isClosed = !!entity.closed;
                    if (isClosed) pts.push(pts[0]);
                    drawing.polyline(pts, isClosed);
                }
                break;
            case 'TEXT':
            case 'MTEXT':
                if (entity.startPoint && entity.text) {
                    drawing.text(entity.startPoint.x, entity.startPoint.y, entity.textHeight || 10, 0, entity.text);
                }
                break;
            case 'POINT':
                if (entity.position) {
                    drawing.point(entity.position.x, entity.position.y);
                }
                break;
            case 'ELLIPSE':
                if (entity.center && entity.majorAxisEndPoint && entity.ratio) {
                    const cx = entity.center.x, cy = entity.center.y;
                    const ex = entity.majorAxisEndPoint.x - cx, ey = entity.majorAxisEndPoint.y - cy;
                    const angle = Math.atan2(ey, ex);
                    const a = Math.sqrt(ex * ex + ey * ey);
                    const b = a * entity.ratio;
                    const pts = [];
                    const segments = 64;
                    for (let i = 0; i < segments; i++) {
                        const t = (i / segments) * Math.PI * 2;
                        const ct = Math.cos(t), st = Math.sin(t);
                        const ca = Math.cos(angle), sa = Math.sin(angle);
                        pts.push([cx + a * ct * ca - b * st * sa, cy + a * ct * sa + b * st * ca]);
                    }
                    drawing.polyline(pts, true);
                }
                break;
            case 'SOLID':
            case 'TRACE':
                if (entity.points && entity.points.length >= 3) {
                    drawing.polyline(entity.points.map(p => [p.x, p.y]), false);
                }
                break;
            case 'SPLINE':
                if (entity.controlPoints && entity.controlPoints.length >= 2) {
                    drawing.polyline(entity.controlPoints.map(p => [p.x, p.y]), false);
                }
                break;
            case 'INSERT':
                console.warn('[DXF] Nested INSERT ignored:', entity.block);
                break;
        }
    },

    handleNaChange(checkbox) {

        const row = checkbox.closest('tr');

        if (!row) return;

        const empresaBox = row.querySelector('input[name="el_scope_empresa"]');

        const cliBox = row.querySelector('input[name="el_scope_cli"]');

        if (checkbox.checked) {

            if (empresaBox) {

                empresaBox.checked = false;

                empresaBox.disabled = true;

                empresaBox.style.opacity = '0.5';

            }

            if (cliBox) {

                cliBox.checked = false;

                cliBox.disabled = true;

                cliBox.style.opacity = '0.5';

            }

        } else {

            if (empresaBox) {

                empresaBox.disabled = false;

                empresaBox.style.opacity = '1';

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

        if (store.getState().proposalReadOnly) {
            window.app.toast('Exportação bloqueada para propostas Fechadas/Perdidas.', 'warning', 0);
            return;
        }

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
            const _ptcFolderPT = String(window.app.currentPtc?.folder || '');
            const _ptcMatchPT = _ptcFolderPT.match(/^(\d{8,10})/);
            const _ptcNumberPT = _ptcMatchPT ? _ptcMatchPT[1] : (data.codigo || '00000000');
            const _revPTVal = data.revisions?.length > 0 ? data.revisions[data.revisions.length - 1].no : '00';
            const _revStrPT = _revPTVal && _revPTVal !== '0' ? String(_revPTVal).replace(/[^0-9]/g, '') : '00';

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
                cidade: data.cidade || '',
                uf: data.uf || '',

                localizacao: data.localizacao || [data.cidade, data.uf].filter(Boolean).join('/') || '',

                engenheiro_responsavel: data.engenheiroResponsavel || '',

                aos_cuidados: data.aos_cuidados || '',

                email: data.email || '',

                telefone: data.telefone || '',

                data_emissao: new Date().toLocaleDateString('pt-BR'),

                revisao: data.revisions?.length > 0 ? data.revisions[data.revisions.length - 1].no : '00',

                codigo: data.codigo || '',
                ptc_number: `${_ptcNumberPT || '00000000'}-PT-Rev${_revStrPT}`,

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

                                minhaEmpresa: item.na ? 'N/A' : (item.minhaEmpresa ? 'X' : ''),

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

                                        minhaEmpresa: item.na ? 'N/A' : (item.minhaEmpresa ? 'X' : ''),

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

                    minhaEmpresa: item.minhaEmpresa ? 'X' : '',

                    cliente: item.cli ? 'X' : ''

                })),

                // Escopo AUTPRO (condicionais individuais)

                tem_autpro_escopo: (data.autproScope || []).some(item => item.incluso),

                ...Object.fromEntries((data.autproScope || []).map(item => [

                    item.id + '_incluso',

                    !!item.incluso

                ])),

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
                }),
                
                // Signatures (ativas)
                sig1_nome: (data.sig1_active !== false) ? (data.sig1_nome || '') : '',
                sig1_cargo: (data.sig1_active !== false) ? (data.sig1_cargo || '') : '',
                sig1_tel: (data.sig1_active !== false) ? (data.sig1_tel || '') : '',
                sig1_cel: (data.sig1_active !== false) ? (data.sig1_cel || '') : '',
                sig1_email: (data.sig1_active !== false) ? (data.sig1_email || '') : '',
                sig2_nome: (data.sig2_active !== false) ? (data.sig2_nome || '') : '',
                sig2_cargo: (data.sig2_active !== false) ? (data.sig2_cargo || '') : '',
                sig2_tel: (data.sig2_active !== false) ? (data.sig2_tel || '') : '',
                sig2_cel: (data.sig2_active !== false) ? (data.sig2_cel || '') : '',
                sig2_email: (data.sig2_active !== false) ? (data.sig2_email || '') : '',
                sig3_nome: (data.sig3_active !== false) ? (data.sig3_nome || '') : '',
                sig3_cargo: (data.sig3_active !== false) ? (data.sig3_cargo || '') : '',
                sig3_tel: (data.sig3_active !== false) ? (data.sig3_tel || '') : '',
                sig3_cel: (data.sig3_active !== false) ? (data.sig3_cel || '') : '',
                sig3_email: (data.sig3_active !== false) ? (data.sig3_email || '') : '',

                // ─── Infraestrutura ───
                infra_tem_itens: (data.infraestrutura?.disciplinas || []).reduce((s, d) => s + d.itens.length, 0) > 0,
                infraestrutura: (() => {
                    const rows = [];
                    (data.infraestrutura?.disciplinas || []).forEach(disc => {
                        const perda = disc.perda ?? 10;
                        (disc.itens || []).forEach(item => {
                            const sub = (item.qtd||0) * (1 + perda/100) * (item.custoUnitario||0) + (item.horasInstalacao||0) * (item.dificuldade||1.0);
                            const totalPercent = (item.icms||0) + (item.desconto||0) + (item.markup||0);
                            const fator = 1 - totalPercent / 100;
                            const precoBase = fator > 0 ? sub / fator : sub;
                            const pf = precoBase + precoBase * ((item.ipi||0) / 100);
                            rows.push({
                                infra_disciplina: disc.nome,
                                infra_codigo: item.codigo || '',
                                infra_descricao: item.descricao || '',
                                infra_qtd: String(item.qtd || 0),
                                infra_un: item.un || '',
                                infra_custo_unitario: app.formatCurrency(item.custoUnitario || 0),
                                infra_horas_instalacao: String(item.horasInstalacao || 0),
                                infra_dificuldade: item.dificuldade === 1.5 ? 'Elevado' : item.dificuldade === 2.5 ? 'Crítico' : 'Normal',
                                infra_icms: String(item.icms || 0) + '%',
                                infra_ipi: String(item.ipi || 0) + '%',
                                infra_desconto: String(item.desconto || 0) + '%',
                                infra_markup: String(item.markup || 0) + '%',
                                infra_subtotal: app.formatCurrency(sub),
                                infra_preco_final: app.formatCurrency(pf)
                            });
                        });
                    });
                    return rows;
                })(),
                infra_qtd_itens: (data.infraestrutura?.disciplinas || []).reduce((s, d) => s + d.itens.length, 0),
                infra_custo_direto: app.formatCurrency((() => { let t=0; (data.infraestrutura?.disciplinas||[]).forEach(d => { const p=d.perda??10; d.itens.forEach(i => { t+=(i.qtd||0)*(1+p/100)*(i.custoUnitario||0)+(i.horasInstalacao||0)*(i.dificuldade||1.0); }); }); return t; })()),
                infra_preco_final_total: app.formatCurrency((() => { let t=0; (data.infraestrutura?.disciplinas||[]).forEach(d => { const p=d.perda??10; d.itens.forEach(i => { const sub=(i.qtd||0)*(1+p/100)*(i.custoUnitario||0)+(i.horasInstalacao||0)*(i.dificuldade||1.0); const perc=(i.icms||0)+(i.desconto||0)+(i.markup||0); const f=1-perc/100; const base=f>0?sub/f:sub; t+=base+base*((i.ipi||0)/100); }); }); return t; })()),

            };



            // Adicionar campos globais em maiúsculo (Strings e Arrays)

            Object.keys(templateData).forEach(key => {

                const val = templateData[key];

                if (typeof val === 'string' || Array.isArray(val)) {

                    templateData[key.toUpperCase()] = val;

                }

            });



            // Carregar Template (configurável por empresa)

            const company = store.getState().company || {};
            const auth = store.getState().auth || {};
            const empresaId = auth.user?.empresa_id || 'default';
            const templateFile = company.templateTecnica || EMPRESA.templateTecnica || 'TEMPLATE_TEC.docx';

            const folderName = company.folderName || empresaId;
            const response = await fetch('templates/' + folderName + '/' + templateFile + '?v=' + Date.now());

            if (!response.ok) throw new Error('Template ' + templateFile + ' não encontrado.');

            const arrayBuffer = await response.arrayBuffer();



            const zip = new ZipLib(arrayBuffer);

            // Injetar tabela de Infraestrutura no documento
            try {
                const infraRows = templateData.infraestrutura || [];
                if (infraRows.length > 0) {
                    const _xmlEscape = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                    const colW = [1700,1100,2600,600,500,1000,600,900,600,600,600,600,1000,1000];
                    const headers = ['Disciplina','Código','Descrição','Qtd','UN','Custo Unit.','H Inst','Difíc.','ICMS','IPI','Desc','Markup','Subtotal','Preço Final'];
                    const hdrCells = headers.map(h => `<w:tc><w:p><w:r><w:rPr><w:b/><w:sz w:val="16"/><w:color w:val="FFFFFF"/></w:rPr><w:t>${_xmlEscape(h)}</w:t></w:r></w:p></w:tc>`).join('');
                    const flds = ['infra_disciplina','infra_codigo','infra_descricao','infra_qtd','infra_un','infra_custo_unitario','infra_horas_instalacao','infra_dificuldade','infra_icms','infra_ipi','infra_desconto','infra_markup','infra_subtotal','infra_preco_final'];
                    const dataRows = infraRows.map(r => {
                        const cells = flds.map(f => `<w:tc><w:p><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>${_xmlEscape(r[f]||'')}</w:t></w:r></w:p></w:tc>`).join('');
                        return `<w:tr>${cells}</w:tr>`;
                    }).join('');
                    const totCells = headers.map((h,i) => {
                        if (i === 0) return `<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>TOTAIS</w:t></w:r></w:p></w:tc>`;
                        if (i === 13) return `<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${_xmlEscape(templateData.infra_preco_final_total||'')}</w:t></w:r></w:p></w:tc>`;
                        if (i === 12) return `<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${_xmlEscape(templateData.infra_custo_direto||'')}</w:t></w:r></w:p></w:tc>`;
                        return `<w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t/></w:r></w:p></w:tc>`;
                    }).join('');
                    const grd = colW.map(w => `<w:gridCol w:w="${w}"/>`).join('');
                    const infraOXML = `
<w:p><w:pPr><w:keepNext/><w:keepLines/></w:pPr>
<w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="436511"/></w:rPr><w:t xml:space="preserve">INFRAESTRUTURA</w:t></w:r>
</w:p>
<w:tbl>
<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="436511"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="436511"/></w:tblBorders></w:tblPr>
<w:tblGrid>${grd}</w:tblGrid>
<w:tr><w:trPr><w:trHeight w:val="300"/><w:shd w:val="clear" w:color="auto" w:fill="436511"/></w:trPr>${hdrCells}</w:tr>
${dataRows}
</w:tbl>
`;
                    const docXml = zip.file('word/document.xml').asText();
                    const modifiedXml = docXml.replace('</w:body>', infraOXML + '</w:body>');
                    zip.file('word/document.xml', modifiedXml);
                }
            } catch (e) {
                console.warn('Failed to inject infraestrutura table:', e);
            }

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



            const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

            const outBlob = doc.getZip().generate({ type: "blob", mimeType });

            const outBase64 = doc.getZip().generate({ type: "base64", mimeType });



            const ptcFolder = String(window.app.currentPtc?.folder || '');
            const ptcMatch = ptcFolder.match(/^(\d{8,10})/);
            const ptcNumber = ptcMatch ? ptcMatch[1] : (data.codigo || '00000000');
            const rev = window.app.currentPtc?.revision;
            const revStr = rev && rev !== '0' ? rev.replace(/[^0-9]/g, '') : '00';
            const fileName = `${ptcNumber}-PT-Rev${revStr}.docx`;

            const url = window.URL.createObjectURL(outBlob);

            const a = document.createElement("a");

            a.href = url;

            a.download = fileName;

            document.body.appendChild(a);

            a.click();

            window.URL.revokeObjectURL(url);

            document.body.removeChild(a);

            app.toast('Download concluído!', 'success');

            // Salvar no servidor (PTC/Rev)
            const currentPtc = window.app.currentPtc;
            if (currentPtc && currentPtc.folder) {
                const _token_sf = store.getState().auth?.token;
            fetch('/api/save-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(_token_sf ? { 'Authorization': 'Bearer ' + _token_sf } : {}) },
                    body: JSON.stringify({
                        ptcFolder: currentPtc.folder,
                        filename: fileName,
                        content: outBase64,
                        isBase64: true,
                        revisionFolder: currentPtc.revision
                    })
                })
                .then(res => res.json())
                .then(r => {
                    if (r.success) {
                        console.log('[Export] DOCX saved to server:', fileName);
                        app.toast('Documento salvo na pasta da PTC!', 'success');
                    } else {
                        console.error('[Export] Server save failed:', r.error);
                        app.toast('Erro ao salvar no servidor: ' + (r.error || 'desconhecido'), 'error');
                    }
                })
                .catch(err => {
                    console.error('Error saving DOCX to server:', err);
                    app.toast('Erro de conexão ao salvar no servidor.', 'error');
                });
            }

        } catch (e) {

            console.error(e);

            app.toast('Erro na exportação: ' + e.message, 'error');

        }

    }

};



// ─── Infraestrutura Tab ───────────────────────────────────────────────

PropostaTecnicaModule._infraSubtotal = function(item, perda) {
    const material = (item.qtd||0) * (1 + (perda||10) / 100) * (item.custoUnitario||0);
    const maoObra  = (item.horasInstalacao||0) * (item.valorHora||0) * (item.dificuldade||1.0);
    return material + maoObra;
};

PropostaTecnicaModule._infraPrecoFinal = function(item, perda) {
    const custoDireto = PropostaTecnicaModule._infraSubtotal(item, perda);
    const totalPercent = (item.desconto||0) + (item.markup||0);
    const fator = 1 - totalPercent / 100;
    return fator > 0 ? custoDireto / fator : custoDireto;
};

PropostaTecnicaModule._recalcInfraFooter = function() {
    const tbody = document.getElementById('infra-table-body');
    if (!tbody) return;
    const perdaEl = document.querySelector('[name="infra_perda"]');
    const perda = perdaEl ? parseFloat(perdaEl.value.replace(',', '.')) || 10 : 10;
    let totalCustoDireto = 0, totalPrecoFinal = 0;

    tbody.querySelectorAll('tr[data-infra-index]').forEach(row => {
        const i = parseInt(row.getAttribute('data-infra-index'));
        const g = (name) => {
            const el = row.querySelector(`[name="infra_${name}_${i}"]`);
            return el ? parseFloat(el.value.replace(',', '.')) || 0 : 0;
        };
        const qtd = g('qtd');
        const cu = g('custoUnitario');
        const hi = g('horasInstalacao');
        const vh = g('valorHora');
        const dif = parseFloat(row.querySelector(`[name="infra_dificuldade_${i}"]`)?.value) || 1.0;
        const desc = g('desconto');
        const markup = g('markup');

        const custoDireto = qtd * (1 + perda / 100) * cu + hi * vh * dif;
        const totalPercent = desc + markup;
        const fator = 1 - totalPercent / 100;
        const pf = fator > 0 ? custoDireto / fator : custoDireto;

        const tds = row.querySelectorAll('td');
        const cellCount = tds.length;
        if (cellCount >= 3) {
            if (tds[cellCount - 3]) tds[cellCount - 3].textContent = app.formatCurrency(custoDireto);
            if (tds[cellCount - 2]) tds[cellCount - 2].textContent = app.formatCurrency(pf);
        }

        totalCustoDireto += custoDireto;
        totalPrecoFinal += pf;
    });

    const footer = document.getElementById('infra-footer-stats');
    if (footer) {
        const qty = tbody.querySelectorAll('tr[data-infra-index]').length;
        footer.innerHTML = `Itens: <strong>${qty}</strong>` +
            `<span style="margin:0 10px;color:#d1d5db;">|</span>` +
            `Custo Direto: <strong>${app.formatCurrency(totalCustoDireto)}</strong>` +
            `<span style="margin:0 10px;color:#d1d5db;">|</span>` +
            `<span style="font-size:14px;font-weight:700;color:#4d7c0f;">Pre\u00e7o Final: ${app.formatCurrency(totalPrecoFinal)}</span>`;
    }
};

const INFRA_PREFIX = {
    civil: 'CIV', eletrica: 'ELE', spda: 'ATE',
    mecanica: 'MEC', cabeamento: 'CAB', servicos: 'SER'
};

PropostaTecnicaModule._infraAtividadesPadrao = {
    eletrica: [
        'Montagem de eletrocalha perfurada (aço galvanizado ou inox)',
        'Montagem de leito para cabos tipo escada (aço ou alumínio)',
        'Fabricação e instalação de suportes para eletrocalha',
        'Instalação de tampa cega para eletrocalha',
        'Montagem de conexões (curva, T, redução, luva) em eletrocalha',
        'Instalação de separadores internos em eletrocalha',
        'Selagem corta-fogo em passagem de eletrocalha entre ambientes',
        'Montagem de eletroduto de aço carbono galvanizado (roscado)',
        'Montagem de eletroduto de PVC rígido (roscável ou soldável)',
        'Instalação de eletroduto corrugado embutido em alvenaria',
        'Fabricação e instalação de suportes para eletroduto',
        'Montagem de conduletes (C, LB, LR, LL, T)',
        'Instalação de caixas de passagem metálicas ou de PVC',
        'Ensaio de estanqueidade em eletroduto enterrado',
        'Lançamento de cabos de cobre PP/EPR/PVC (baixa tensão)',
        'Lançamento de cabos de média tensão (6,6 kV a 35 kV)',
        'Lançamento de cabos de controle e instrumentação blindados',
        'Identificação e anilhamento de cabos',
        'Teste de isolação (megôhmetro) em cabos instalados',
        'Crimpagem de terminais de compressão (ilhos, pino, olhal)',
        'Montagem de conectores de emenda e derivação',
        'Montagem de malha de terra funcional interna',
        'Instalação de haste de terra (copperweld / aço cobreado)',
        'Solda exotérmica em conexões de aterramento',
        'Instalação de barra de equalização de potencial',
        'Montagem de quadro de distribuição (QDC / QDF)',
        'Instalação de dispositivo de proteção contra surto (DPS)',
        'Instalação de disjuntor geral e fusíveis',
        'Fornecimento e montagem de suporte para banco de baterias',
        'Instalação de bandeja para roteamento de cabos em sala elétrica',
        'Pintura de piso e sinalização de área elétrica',
        'Montagem de iluminação de emergência na sala elétrica',
        'Teste de continuidade e funcional geral do sistema',
        'Lançamento de cabo de potência 2x1,5mm²',
        'Lançamento de cabo de potência 2x2,5mm²',
        'Lançamento de cabo de potência 3x1,5mm²',
        'Lançamento de cabo de potência 3x2,5mm²',
        'Lançamento de cabo de potência 3x4mm²',
        'Lançamento de cabo de potência 3x6mm²',
        'Lançamento de cabo de potência 3x10mm²',
        'Lançamento de cabo de potência 3x16mm²',
        'Lançamento de cabo de potência 3x25mm²',
        'Lançamento de cabo de potência 3x35mm²',
        'Lançamento de cabo de potência 3x50mm²',
        'Lançamento de cabo de potência 4x4mm²',
        'Lançamento de cabo de potência 4x6mm²',
        'Lançamento de cabo de potência 4x10mm²',
        'Lançamento de cabo de potência 4x16mm²',
        'Lançamento de cabo de potência 4x25mm²',
        'Lançamento de cabo de potência 4x35mm²',
        'Lançamento de cabo de potência 4x50mm²',
        'Lançamento de cabo de potência 3x1,5mm² + 1x1,5mm²',
        'Lançamento de cabo de potência 3x2,5mm² + 1x2,5mm²',
        'Lançamento de cabo de potência 3x4mm² + 1x4mm²',
        'Lançamento de cabo de potência 3x6mm² + 1x4mm²',
        'Lançamento de cabo de potência 3x10mm² + 1x6mm²',
        'Lançamento de cabo de potência 3x16mm² + 1x10mm²',
        'Lançamento de cabo de potência 3x25mm² + 1x16mm²',
        'Lançamento de cabo de potência 3x35mm² + 1x16mm²',
        'Lançamento de cabo de potência 3x50mm² + 1x25mm²',
        'Lançamento de cabo de potência 3x70mm² + 1x35mm²',
        'Lançamento de cabo de potência 3x95mm² + 1x50mm²',
        'Lançamento de cabo de potência 3x120mm² + 1x70mm²',
        'Lançamento de cabo de potência 3x150mm² + 1x95mm²',
        'Lançamento de cabo de potência 3x185mm² + 1x95mm²',
        'Lançamento de cabo de potência 3x240mm² + 1x120mm²',
        'Lançamento de cabo de potência 1x16mm² (fase/neutro/terra)',
        'Lançamento de cabo de potência 1x25mm² (fase/neutro/terra)',
        'Lançamento de cabo de potência 1x35mm² (fase/neutro/terra)',
        'Lançamento de cabo de potência 1x50mm² (fase)',
        'Lançamento de cabo de potência 1x70mm² (fase)',
        'Lançamento de cabo de potência 1x95mm² (fase)',
        'Lançamento de cabo de potência 1x120mm² (fase)',
        'Lançamento de cabo de potência 1x150mm² (fase)',
        'Lançamento de cabo de potência 1x185mm² (fase)',
        'Lançamento de cabo de potência 1x240mm² (fase)'
    ],
    civil: [
        'Execução de regularização de base para assentamento de equipamentos',
        'Execução de contrapiso armado para sala elétrica / data center',
        'Execução de piso elevado (técnico) para data center',
        'Execução de canaleta subterrânea para passagem de cabos',
        'Execução de baldrame e fundação para abrigo elétrico',
        'Execução de alvenaria em blocos de concreto para fechamento de casa elétrica',
        'Execução de chapisco, reboco e emboço em paredes internas',
        'Aplicação de pintura epóxi em paredes e pisos de sala elétrica',
        'Execução de impermeabilização em lajes e áreas molhadas',
        'Execução de cobertura metálica para abrigo de equipamentos',
        'Instalação de porta corta-fogo',
        'Fabricação e montagem de estrutura metálica para suporte de painéis',
        'Execução de dreno e canaleta para captação de água pluvial',
        'Execução de passeio externo e vias de acesso',
        'Execução de sinalização horizontal e vertical de área industrial',
        'Instalação de bancada de granito/mármore em sala de manutenção',
        'Execução de revestimento cerâmico em paredes',
        'Fornecimento e instalação de forro de PVC ou mineral',
        'Execução de regularização e nivelamento de piso para assentamento de racks',
        'Execução de soleira e peitoril em granito'
    ],
    spda: [
        'Instalação de captor tipo Franklin (haste com esfera)',
        'Instalação de captor tipo eletromagnético (ionizante)',
        'Montagem de suporte para captor em estrutura metálica',
        'Lançamento de cabo de descida em cobre nú 35mm²',
        'Lançamento de cabo de descida em cobre nú 50mm²',
        'Fixação de cabo de descida com isolador de porcelana',
        'Execução de conexão de descida ao anel de aterramento (solda exotérmica)',
        'Instalação de caixa de inspeção de aterramento',
        'Montagem de anel de aterramento em cobre nú 50mm²',
        'Execução de malha de terra com cabo de cobre nú',
        'Instalação de haste de aterramento tipo copperweld (5/8" x 3m)',
        'Execução de abertura e fechamento de vala para anel de aterramento',
        'Execução de medição de resistência de aterramento (método dos 62%)',
        'Instalação de equalizador de potencial em SPDA',
        'Fixação de suporte para cabos em laje e fachada',
        'Execução de passagem de cabo SPDA por eletroduto embutido',
        'Execução de selagem corta-fogo em penetração de SPDA',
        'Execução de teste de continuidade elétrica do sistema SPDA',
        'Elaboração de laudo técnico de medição de aterramento',
        'Execução de sinalização de área de risco de descarga atmosférica'
    ],
    mecanica: [
        'Montagem de chiller condensado a ar',
        'Montagem de chiller condensado a água',
        'Instalação de fan coil tipo cassete',
        'Instalação de fan coil de teto (tubulação oculta)',
        'Montagem de condensadora split (VRF / VRV)',
        'Montagem de evaporadora split cassete (VRF / VRV)',
        'Montagem de evaporadora split de parede (VRF / VRV)',
        'Instalação de unidade manipuladora de ar (AHU)',
        'Montagem de exaustor centrífugo',
        'Montagem de exaustor axial de parede',
        'Instalação de veneziana de exaustão com dampers',
        'Montagem de compressor de ar comprimido (parafuso / pistão)',
        'Instalação de secador frigorífico para ar comprimido',
        'Montagem de filtro coalescente para ar comprimido',
        'Execução de rede de distribuição de ar comprimido em aço galvanizado',
        'Montagem de dreno automático em ponto baixo da rede',
        'Instalação de pressostato e válvula de alívio',
        'Montagem de bomba centrífuga para circulação de água gelada',
        'Montagem de bomba de pressurização de rede hidráulica',
        'Instalação de vaso de expansão para sistema de água gelada',
        'Execução de isolamento térmico em tubulação de água gelada',
        'Execução de teste de estanqueidade em circuito hidráulico',
        'Execução de partida e comissionamento de sistema de climatização',
        'Fornecimento e instalação de dutos de ar condicionado',
        'Instalação de grelha e difusor de insuflamento'
    ],
    cabeamento: [
        'Lançamento de cabo UTP Cat.6A blindado',
        'Lançamento de cabo UTP Cat.6 não blindado',
        'Lançamento de cabo de fibra óptica monomodo (SM)',
        'Lançamento de cabo de fibra óptica multimodo (MM)',
        'Execução de emenda de fibra óptica por fusão',
        'Montagem de conector LC / SC em fibra óptica',
        'Execução de teste de atenuação em fibra óptica (OTDR)',
        'Montagem de patch panel 1U / 2U (48 portas)',
        'Montagem de organizador horizontal de cabos',
        'Instalação de rack fechado 42U (19")',
        'Instalação de rack aberto para DIO (distribuidor interno óptico)',
        'Montagem de DIO (distribuidor interno óptico)',
        'Lançamento de cabo coaxial RG-6 / RG-11',
        'Instalação de tomada RJ-45 fêmea (keystone)',
        'Execução de teste de certificação de cabos metálicos (Fluke DSX)',
        'Execução de identificação e etiquetagem de cabos e portas',
        'Montagem de guia de cabos (cable manager) vertical',
        'Execução de aterramento de rack e infraestrutura de telecom',
        'Instalação de saída de ar para ventilação de rack',
        'Execução de organização e amarração de cabos com velcro'
    ],
    servicos: [
        'Execução de levantamento técnico em campo para infraestrutura',
        'Elaboração de projeto executivo de infraestrutura elétrica e mecânica',
        'Fornecimento de mão de obra técnica especializada em infraestrutura',
        'Execução de supervisão técnica de instalação de infraestrutura',
        'Execução de comissionamento e teste funcional de sistemas de infraestrutura',
        'Elaboração de relatório técnico (ART / TRT) de infraestrutura',
        'Execução de treinamento operacional in loco (8h) para sistemas instalados',
        'Execução de gerenciamento de obra de infraestrutura',
        'Execução de mobilização e desmobilização de equipe técnica',
        'Execução de transporte de materiais e equipamentos para obra',
        'Locação de equipamentos de teste e medição',
        'Fornecimento de serviço de garantia estendida (12 meses) para sistemas',
        'Fornecimento de painel elétrico montado e testado em fábrica',
        'Execução de serviço de engenharia para adequação de layout',
        'Elaboração de as built de infraestrutura instalada'
    ]
};

PropostaTecnicaModule._infraDescricaoInput = function(i, item, disc) {
    const listName = 'infra-sugestoes-' + disc.id;
    const atividades = PropostaTecnicaModule._infraAtividadesPadrao[disc.id];
    const val = PropostaTecnicaModule._escapeHtml(item.descricao || '');
    if (atividades) {
        const opts = atividades.map(a => `<option value="${PropostaTecnicaModule._escapeHtml(a)}">`).join('');
        return `<input type="text" name="infra_descricao_${i}" class="form-control" value="${val}" list="${listName}" style="width:200px;font-size:11px;padding:6px 4px;"><datalist id="${listName}">${opts}</datalist>`;
    }
    return `<input type="text" name="infra_descricao_${i}" class="form-control" value="${val}" style="width:200px;font-size:11px;padding:6px 4px;">`;
};

PropostaTecnicaModule.renderTabInfraestrutura = function(data) {
    const infra = data.infraestrutura;
    if (infra.activeDisciplina === 'custos') {
        return PropostaTecnicaModule.renderTabelaCustosUnitarios(data);
    }
    const disc = infra.disciplinas.find(d => d.id === infra.activeDisciplina) || infra.disciplinas[0];
    if (!disc) return '<div style="padding:30px;">Nenhuma disciplina encontrada.</div>';

    const totalItensGeral = infra.disciplinas.reduce((s, d) => s + d.itens.length, 0);
    const sidebar = infra.disciplinas.map(d => `
        <button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('${d.id}')"
            style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:${d.id === infra.activeDisciplina ? 'var(--color-accent)' : 'transparent'};color:${d.id === infra.activeDisciplina ? '#fff' : '#374151'};font-size:12px;font-weight:${d.id === infra.activeDisciplina ? '600' : '400'};cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
            <i class="ph ${d.icone}" style="font-size:16px;"></i>
            <span>${PropostaTecnicaModule._escapeHtml(d.nome)}</span>
            <span style="margin-left:auto;background:${d.id === infra.activeDisciplina ? 'rgba(255,255,255,0.2)' : '#e5e7eb'};padding:0 7px;border-radius:8px;font-size:10px;line-height:18px;">${d.itens.length}</span>
        </button>
    `).join('<div style="margin:2px 0;"></div>') +
    '<div style="border-top:1px solid #e2e8f0;margin:6px 0;"></div>' +
    `<button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('custos')"
        style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:transparent;color:#374151;font-size:12px;font-weight:400;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
        <i class="ph ph-currency-circle-dollar" style="font-size:16px;"></i>
        <span>Custos Unit\u00e1rios</span>
    </button>`;

    let tableRows = '';
    if (disc.itens.length === 0) {
        tableRows = `<tr><td colspan="13" style="padding:40px;text-align:center;color:#94a3b8;font-size:13px;">
            <i class="ph ph-package" style="font-size:32px;display:block;margin-bottom:8px;"></i>
            Nenhum item cadastrado. Use "Cat\u00e1logo" para buscar do banco ou "Adicionar Item" para incluir manualmente.
        </td></tr>`;
    } else {
        disc.itens.forEach((item, i) => {
            const bgCor = item.materialId ? '#f0fdf4' : '#e0f2fe';
            tableRows += `<tr style="border-bottom:1px solid #f1f5f9;" data-infra-index="${i}">
                <td style="padding:4px;"><input type="text" name="infra_codigo_${i}" class="form-control" value="${PropostaTecnicaModule._escapeHtml(item.codigo || '')}" style="width:80px;font-size:11px;padding:6px 4px;background:${bgCor};border-left:3px solid ${item.materialId ? '#16a34a' : '#2563eb'};"></td>
                <td style="padding:4px;">${PropostaTecnicaModule._infraDescricaoInput(i, item, disc)}</td>
                <td style="padding:4px;"><input type="text" name="infra_qtd_${i}" class="form-control" value="${item.qtd || 0}" style="width:60px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;"><input type="text" name="infra_un_${i}" class="form-control" value="${PropostaTecnicaModule._escapeHtml(item.un || '')}" style="width:50px;font-size:11px;padding:6px 4px;"></td>
                <td style="padding:4px;"><input type="text" name="infra_custoUnitario_${i}" class="form-control" value="${item.custoUnitario || 0}" style="width:100px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;"><input type="text" name="infra_horasInstalacao_${i}" class="form-control" value="${item.horasInstalacao || 0}" style="width:60px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;"><input type="text" name="infra_valorHora_${i}" class="form-control" value="${item.valorHora || 0}" style="width:80px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;">
                    <select name="infra_dificuldade_${i}" class="form-control" style="width:115px;font-size:11px;padding:4px;" onchange="window.propostaTecnicaModule._recalcInfraFooter()">
                        <option value="1.0" ${(item.dificuldade||1.0)===1.0?'selected':''}>Normal (1.0x)</option>
                        <option value="1.5" ${(item.dificuldade||1.0)===1.5?'selected':''}>Elevado (1.5x)</option>
                        <option value="2.5" ${(item.dificuldade||1.0)===2.5?'selected':''}>Cr\u00edtico (2.5x)</option>
                    </select>
                </td>
                <td style="padding:4px;"><input type="text" name="infra_desconto_${i}" class="form-control" value="${item.desconto || 0}" style="width:50px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;"><input type="text" name="infra_markup_${i}" class="form-control" value="${item.markup || 0}" style="width:50px;font-size:11px;padding:6px 4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()"></td>
                <td style="padding:4px;text-align:right;font-size:12px;font-weight:600;color:#1e293b;">${app.formatCurrency(PropostaTecnicaModule._infraSubtotal(item, disc.perda))}</td>
                <td style="padding:4px;text-align:right;font-size:12px;font-weight:700;color:#4d7c0f;">${app.formatCurrency(PropostaTecnicaModule._infraPrecoFinal(item, disc.perda))}</td>
                <td style="padding:4px;text-align:center;white-space:nowrap;">
                    <button type="button" onclick="window.propostaTecnicaModule.deleteInfraItem(${i})" class="btn-icon" style="color:#ef4444;border:none;background:none;cursor:pointer;padding:4px;" title="Excluir"><i class="ph ph-trash"></i></button>
                </td>
            </tr>`;
        });
    }

    const totalGeral = disc.itens.reduce((s, item) => {
        const perda = disc.perda ?? 10;
        return s + PropostaTecnicaModule._infraSubtotal(item, perda);
    }, 0);
    const totalPrecoFinal = disc.itens.reduce((s, item) => {
        return s + PropostaTecnicaModule._infraPrecoFinal(item, disc.perda);
    }, 0);

    return `<div style="display:flex;gap:16px;padding:20px;height:100%;overflow:hidden;">
        <div style="width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:2px;overflow-y:auto;">
            ${sidebar}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-shrink:0;">
                <h3 style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">
                    <i class="ph ${disc.icone}" style="margin-right:6px;"></i>
                    ${PropostaTecnicaModule._escapeHtml(disc.nome)}
                </h3>
                <div style="display:flex;align-items:center;gap:10px;">
                    <label style="font-size:11px;color:#475569;display:flex;align-items:center;gap:4px;">
                        Perda:
                        <input type="text" name="infra_perda" class="form-control" value="${disc.perda ?? 10}" style="width:55px;font-size:11px;padding:4px;text-align:right;" oninput="window.propostaTecnicaModule._recalcInfraFooter()">
                        <span style="font-size:10px;">%</span>
                    </label>
                    <button type="button" onclick="app.propostaTecnica.openAddInfraMaterialModal()" class="btn btn-sm btn-secondary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-package"></i> Cat\u00e1logo
                    </button>
                    <button type="button" onclick="window.propostaTecnicaModule.addInfraItem()" class="btn btn-sm btn-primary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-plus"></i> Adicionar Item
                    </button>
                </div>
            </div>
            <div style="display:flex;gap:16px;margin-bottom:8px;flex-shrink:0;font-size:11px;color:#475569;">
                <span style="display:flex;align-items:center;gap:4px;">
                    <span style="display:inline-block;width:12px;height:12px;background:#e0f2fe;border-left:3px solid #2563eb;border-radius:2px;"></span>
                    Servi\u00e7o
                </span>
                <span style="display:flex;align-items:center;gap:4px;">
                    <span style="display:inline-block;width:12px;height:12px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:2px;"></span>
                    Material (Cat\u00e1logo)
                </span>
            </div>
            <div style="overflow:auto;border:1px solid #e2e8f0;border-radius:8px;background:white;flex:1;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;position:sticky;top:0;z-index:1;">
                            <th style="padding:8px 4px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">Código</th>
                            <th style="padding:8px 4px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">Descrição</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Qtd</th>
                            <th style="padding:8px 4px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">UN</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Custo Unit.</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">H Inst</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Valor Hora</th>
                            <th style="padding:8px 4px;text-align:center;font-weight:600;color:#475569;white-space:nowrap;">Dificuldade</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Desc %</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Markup %</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Subtotal</th>
                            <th style="padding:8px 4px;text-align:right;font-weight:600;color:#4d7c0f;white-space:nowrap;">Preço Final</th>
                            <th style="padding:8px 4px;text-align:center;font-weight:600;color:#475569;white-space:nowrap;width:50px;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="infra-table-body">
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:8px;padding:10px 16px;background:white;border:1px solid #e2e8f0;border-radius:8px;flex-shrink:0;">
                <div id="infra-footer-stats" style="text-align:right;font-size:12px;">
                    <span style="color:#64748b;">Itens: <strong>${disc.itens.length}</strong></span>
                    <span style="margin:0 10px;color:#d1d5db;">|</span>
                    <span style="color:#64748b;">Custo Direto: <strong>${app.formatCurrency(totalGeral)}</strong></span>
                    <span style="margin:0 10px;color:#d1d5db;">|</span>
                    <span style="font-size:14px;font-weight:700;color:#4d7c0f;">Preço Final: ${app.formatCurrency(totalPrecoFinal)}</span>
                </div>
            </div>
        </div>
    </div>`;
    setTimeout(PropostaTecnicaModule._recalcInfraFooter, 0);
};

// ─── Infraestrutura — Resumo Consolidado ──────────────────────────

PropostaTecnicaModule.renderResumoInfraestrutura = function(data) {
    const infra = data.infraestrutura;

    const discData = infra.disciplinas.map(disc => {
        const perda = disc.perda ?? 10;
        let custoMaterial = 0, custoMO = 0, precoFinal = 0;
        disc.itens.forEach(item => {
            custoMaterial += (item.qtd || 0) * (1 + perda / 100) * (item.custoUnitario || 0);
            custoMO += (item.horasInstalacao || 0) * (item.valorHora || 0) * (item.dificuldade || 1.0);
            precoFinal += PropostaTecnicaModule._infraPrecoFinal(item, perda);
        });
        return {
            id: disc.id, nome: disc.nome, icone: disc.icone,
            qtdItens: disc.itens.length, custoMaterial, custoMO,
            subtotal: custoMaterial + custoMO, precoFinal
        };
    });

    const totalGeral = discData.reduce((s, d) => s + d.subtotal, 0);
    const totalPrecoFinal = discData.reduce((s, d) => s + d.precoFinal, 0);
    const totalItens = discData.reduce((s, d) => s + d.qtdItens, 0);
    const totalMaterial = discData.reduce((s, d) => s + d.custoMaterial, 0);
    const totalMO = discData.reduce((s, d) => s + d.custoMO, 0);

    const sidebar = infra.disciplinas.map(d => `
        <button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('${d.id}')"
            style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:transparent;color:#374151;font-size:12px;font-weight:400;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
            <i class="ph ${d.icone}" style="font-size:16px;"></i>
            <span>${PropostaTecnicaModule._escapeHtml(d.nome)}</span>
            <span style="margin-left:auto;background:#e5e7eb;padding:0 7px;border-radius:8px;font-size:10px;line-height:18px;">${d.itens.length}</span>
        </button>
    `).join('<div style="margin:2px 0;"></div>') +
    '<div style="border-top:1px solid #e2e8f0;margin:6px 0;"></div>' +
    `<button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('resumo')"
        style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:var(--color-accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
        <i class="ph ph-chart-bar" style="font-size:16px;"></i>
        <span>Resumo</span>
        <span style="margin-left:auto;background:rgba(255,255,255,0.2);padding:0 7px;border-radius:8px;font-size:10px;line-height:18px;">${totalItens}</span>
    </button>
    <button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('custos')"
        style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:transparent;color:#374151;font-size:12px;font-weight:400;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
        <i class="ph ph-currency-circle-dollar" style="font-size:16px;"></i>
        <span>Custos Unit\u00e1rios</span>
    </button>`;

    const cardsHtml = discData.filter(dd => dd.qtdItens > 0).map(dd => `
        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <i class="ph ${dd.icone}" style="font-size:20px;color:var(--color-accent);"></i>
                <h4 style="margin:0;font-size:13px;font-weight:600;color:#1e293b;">${PropostaTecnicaModule._escapeHtml(dd.nome)}</h4>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
                <div style="color:#64748b;">Itens:</div>
                <div style="text-align:right;font-weight:600;color:#1e293b;">${dd.qtdItens}</div>
                <div style="color:#64748b;">Custo Material:</div>
                <div style="text-align:right;font-weight:600;color:#1e293b;">${app.formatCurrency(dd.custoMaterial)}</div>
                <div style="color:#64748b;">M\u00e3o de Obra:</div>
                <div style="text-align:right;font-weight:600;color:#1e293b;">${app.formatCurrency(dd.custoMO)}</div>
                <div style="border-top:1px solid #e2e8f0;padding-top:6px;color:#1e293b;font-weight:700;">Custo Direto:</div>
                <div style="border-top:1px solid #e2e8f0;padding-top:6px;text-align:right;font-weight:700;color:#1e293b;font-size:13px;">${app.formatCurrency(dd.subtotal)}</div>
                <div style="color:#4d7c0f;font-weight:700;">Pre\u00e7o Final:</div>
                <div style="text-align:right;font-weight:700;color:#4d7c0f;font-size:13px;">${app.formatCurrency(dd.precoFinal)}</div>
            </div>
        </div>
    `).join('');

    const temItens = totalItens > 0;

    return `<div style="display:flex;gap:16px;padding:20px;height:100%;overflow:hidden;">
        <div style="width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:2px;overflow-y:auto;">
            ${sidebar}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-shrink:0;">
                <h3 style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">
                    <i class="ph ph-chart-bar" style="margin-right:6px;"></i>
                    Resumo da Infraestrutura
                </h3>
                <div style="display:flex;gap:8px;">
                    <button type="button" onclick="window.propostaTecnicaModule.exportInfraCSV()" class="btn btn-sm btn-secondary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-file-csv"></i> CSV
                    </button>
                    <button type="button" onclick="window.propostaTecnicaModule.exportInfraXLSX()" class="btn btn-sm btn-secondary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-file-xls"></i> XLSX
                    </button>
                    <button type="button" onclick="window.propostaTecnicaModule.printInfraResumo()" class="btn btn-sm btn-primary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-printer"></i> Imprimir
                    </button>
                </div>
            </div>
            <div style="overflow-y:auto;flex:1;">
                ${temItens ? `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-bottom:16px;">
                    ${cardsHtml}
                </div>
                <div style="background:white;border:2px solid var(--color-accent);border-radius:8px;padding:16px;display:flex;align-items:center;justify-content:space-between;">
                    <div style="font-size:12px;color:#64748b;">
                        Itens: <strong>${totalItens}</strong>
                        <span style="margin:0 10px;color:#d1d5db;">|</span>
                        Custo Material: <strong>${app.formatCurrency(totalMaterial)}</strong>
                        <span style="margin:0 10px;color:#d1d5db;">|</span>
                        M\u00e3o de Obra: <strong>${app.formatCurrency(totalMO)}</strong>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:12px;color:#475569;">Custo Direto Total: <strong>${app.formatCurrency(totalGeral)}</strong></div>
                        <div style="font-size:18px;font-weight:700;color:var(--color-accent);">Pre\u00e7o Final Total: ${app.formatCurrency(totalPrecoFinal)}</div>
                    </div>
                </div>
                ` : '<div style="padding:60px;text-align:center;color:#94a3b8;font-size:13px;"><i class="ph ph-package" style="font-size:32px;display:block;margin-bottom:8px;"></i>Nenhum item cadastrado na Infraestrutura.</div>'}
            </div>
        </div>
    </div>`;
};

PropostaTecnicaModule.printInfraResumo = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;

    const infra = data.infraestrutura;
    const discData = infra.disciplinas.map(disc => {
        const perda = disc.perda ?? 10;
        let custoMaterial = 0, custoMO = 0, precoFinal = 0;
        disc.itens.forEach(item => {
            custoMaterial += (item.qtd || 0) * (1 + perda / 100) * (item.custoUnitario || 0);
            custoMO += (item.horasInstalacao || 0) * (item.valorHora || 0) * (item.dificuldade || 1.0);
            precoFinal += PropostaTecnicaModule._infraPrecoFinal(item, perda);
        });
        return { nome: disc.nome, qtdItens: disc.itens.length, custoMaterial, custoMO, subtotal: custoMaterial + custoMO, precoFinal };
    });

    const totalGeral = discData.reduce((s, d) => s + d.subtotal, 0);
    const totalPrecoFinal = discData.reduce((s, d) => s + d.precoFinal, 0);
    const totalMaterial = discData.reduce((s, d) => s + d.custoMaterial, 0);
    const totalMO = discData.reduce((s, d) => s + d.custoMO, 0);
    const rows = discData.filter(d => d.qtdItens > 0).map(d => `
        <tr>
            <td style="padding:6px;border:1px solid #ccc;">${PropostaTecnicaModule._escapeHtml(d.nome)}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:center;">${d.qtdItens}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:right;">${app.formatCurrency(d.custoMaterial)}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:right;">${app.formatCurrency(d.custoMO)}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:right;">${app.formatCurrency(d.subtotal)}</td>
            <td style="padding:6px;border:1px solid #ccc;text-align:right;font-weight:700;color:#4d7c0f;">${app.formatCurrency(d.precoFinal)}</td>
        </tr>
    `).join('');

    const projeto = data.nomeProjeto || 'Proposta Técnica';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Resumo Infraestrutura - ${PropostaTecnicaModule._escapeHtml(projeto)}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
                body { font-family: 'Open Sans', sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 11pt; }
                @media print { @page { margin: 1.5cm; } body { padding: 0; } }
                h1 { font-size: 16pt; color: var(--color-accent); border-bottom: 2px solid var(--color-accent); padding-bottom: 8px; }
                h2 { font-size: 13pt; color: #1e293b; margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                th { background: var(--color-accent); color: white; padding: 8px; text-align: left; font-size: 10pt; }
                td { padding: 6px; border: 1px solid #ccc; font-size: 10pt; }
                .total-row { background: #f0fdf4; font-weight: 700; }
                .footer { margin-top: 30px; font-size: 9pt; color: #64748b; text-align: center; }
            </style>
        </head>
        <body>
            <h1>Resumo da Infraestrutura</h1>
            <p style="color:#64748b;font-size:10pt;">Projeto: ${PropostaTecnicaModule._escapeHtml(projeto)}</p>
            <table>
                <thead>
                    <tr>
                        <th>Disciplina</th>
                        <th style="text-align:center;">Itens</th>
                        <th style="text-align:right;">Custo Material</th>
                        <th style="text-align:right;">M\u00e3o de Obra</th>
                        <th style="text-align:right;">Subtotal</th>
                        <th style="text-align:right;">Pre\u00e7o Final</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr class="total-row">
                        <td colspan="2" style="text-align:right;"><strong>Totais</strong></td>
                        <td style="text-align:right;">${app.formatCurrency(totalMaterial)}</td>
                        <td style="text-align:right;">${app.formatCurrency(totalMO)}</td>
                        <td style="text-align:right;">${app.formatCurrency(totalGeral)}</td>
                        <td style="text-align:right;font-size:12pt;color:#4d7c0f;">${app.formatCurrency(totalPrecoFinal)}</td>
                    </tr>
                </tbody>
            </table>
            <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | GeraPro</div>
            <script>
                window.onload = function() { window.print(); window.close(); };
            <\\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

// ─── Infraestrutura — Export CSV / XLSX ────────────────────────────

PropostaTecnicaModule.exportInfraCSV = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const infra = data.infraestrutura;
    const projeto = data.nomeProjeto || 'proposta';
    const BOM = '\uFEFF';
    const headers = ['Disciplina','Código','Descrição','Qtd','UN','Custo Unit.','H Inst','Valor Hora','Dificuldade','Desc%','Markup%','Subtotal','Preço Final'];
    const rows = [];
    infra.disciplinas.forEach(disc => {
        const perda = disc.perda ?? 10;
        disc.itens.forEach(item => {
            const sub = PropostaTecnicaModule._infraSubtotal(item, perda);
            const pf = PropostaTecnicaModule._infraPrecoFinal(item, perda);
            const difLabel = item.dificuldade === 1.5 ? 'Elevado' : item.dificuldade === 2.5 ? 'Crítico' : 'Normal';
            rows.push([
                disc.nome, item.codigo || '', item.descricao || '', item.qtd || 0,
                item.un || '', item.custoUnitario || 0, item.horasInstalacao || 0,
                item.valorHora || 0, difLabel, item.desconto || 0,
                item.markup || 0, sub.toFixed(2), pf.toFixed(2)
            ]);
        });
    });
    if (rows.length === 0) { window.app.toast?.('Nenhum item para exportar.', 'warning'); return; }
    const csv = BOM + [headers, ...rows].map(r => r.join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Infraestrutura_${projeto.replace(/[^a-zA-Z0-9]/g,'_')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    window.app.toast?.('CSV exportado com sucesso!', 'success');
};

PropostaTecnicaModule.exportInfraXLSX = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const infra = data.infraestrutura;
    const projeto = data.nomeProjeto || 'proposta';
    if (typeof XLSX === 'undefined') { window.app.toast?.('Biblioteca XLSX não disponível.', 'error'); return; }

    const headers = ['Disciplina','Código','Descrição','Qtd','UN','Custo Unit.','H Inst','Dificuldade','ICMS%','IPI%','Desc%','Markup%','Subtotal','Preço Final'];
    const rows = [];
    infra.disciplinas.forEach(disc => {
        const perda = disc.perda ?? 10;
        disc.itens.forEach(item => {
            const sub = PropostaTecnicaModule._infraSubtotal(item, perda);
            const pf = PropostaTecnicaModule._infraPrecoFinal(item, perda);
            const difLabel = item.dificuldade === 1.5 ? 'Elevado' : item.dificuldade === 2.5 ? 'Crítico' : 'Normal';
            rows.push([
                disc.nome, item.codigo || '', item.descricao || '', item.qtd || 0,
                item.un || '', item.custoUnitario || 0, item.horasInstalacao || 0,
                difLabel, item.icms || 0, item.ipi || 0, item.desconto || 0,
                item.markup || 0, sub, pf
            ]);
        });
    });
    if (rows.length === 0) { window.app.toast?.('Nenhum item para exportar.', 'warning'); return; }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map((_, i) => ({ wch: i === 2 ? 40 : i === 1 || i === 7 ? 14 : 12 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Infraestrutura');
    XLSX.writeFile(wb, `Infraestrutura_${projeto.replace(/[^a-zA-Z0-9]/g,'_')}.xlsx`);
    window.app.toast?.('XLSX exportado com sucesso!', 'success');
};

// ─── Infraestrutura — Tabela de Custos Unitários ──────────────────

PropostaTecnicaModule.renderTabelaCustosUnitarios = function(data) {
    const infra = data.infraestrutura;
    const totalItensGeral = infra.disciplinas.reduce((s, d) => s + d.itens.length, 0);

    const sidebar = infra.disciplinas.map(d => `
        <button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('${d.id}')"
            style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:transparent;color:#374151;font-size:12px;font-weight:400;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
            <i class="ph ${d.icone}" style="font-size:16px;"></i>
            <span>${PropostaTecnicaModule._escapeHtml(d.nome)}</span>
            <span style="margin-left:auto;background:#e5e7eb;padding:0 7px;border-radius:8px;font-size:10px;line-height:18px;">${d.itens.length}</span>
        </button>
    `).join('<div style="margin:2px 0;"></div>') +
    '<div style="border-top:1px solid #e2e8f0;margin:6px 0;"></div>' +
    `<button type="button" onclick="window.propostaTecnicaModule.switchDisciplina('custos')"
        style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;background:var(--color-accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;border-radius:6px;transition:all 0.15s;text-align:left;">
        <i class="ph ph-currency-circle-dollar" style="font-size:16px;"></i>
        <span>Custos Unit\u00e1rios</span>
    </button>`;

    const allItems = [];
    infra.disciplinas.forEach(disc => {
        disc.itens.forEach(item => {
            allItems.push({ disciplina: disc.nome, discId: disc.id, item, perda: disc.perda ?? 10 });
        });
    });

    const temItens = allItems.length > 0;

    const tableRows = temItens ? allItems.map(r => `
        <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:6px;font-size:11px;color:#475569;">${PropostaTecnicaModule._escapeHtml(r.disciplina)}</td>
            <td style="padding:6px;font-size:11px;font-family:monospace;">${PropostaTecnicaModule._escapeHtml(r.item.codigo || '')}</td>
            <td style="padding:6px;font-size:11px;">${PropostaTecnicaModule._escapeHtml(r.item.descricao || '')}</td>
            <td style="padding:6px;font-size:11px;text-align:right;font-weight:600;">${app.formatCurrency(r.item.custoUnitario || 0)}</td>
        </tr>
    `).join('') : '';

    return `<div style="display:flex;gap:16px;padding:20px;height:100%;overflow:hidden;">
        <div style="width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:2px;overflow-y:auto;">
            ${sidebar}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-shrink:0;">
                <h3 style="margin:0;font-size:15px;font-weight:700;color:#1e293b;">
                    <i class="ph ph-currency-circle-dollar" style="margin-right:6px;"></i>
                    Custos Unit\u00e1rios
                </h3>
                <div style="display:flex;align-items:center;gap:8px;">
                    <label style="font-size:11px;color:#475569;display:flex;align-items:center;gap:4px;">
                        \u00cdndice de Reajuste:
                        <input type="text" id="infra-indice-reajuste" class="form-control" value="0" style="width:70px;font-size:11px;padding:4px;text-align:right;">
                        <span style="font-size:10px;">%</span>
                    </label>
                    <button type="button" onclick="window.propostaTecnicaModule.aplicarReajusteInfra()" class="btn btn-sm btn-primary" style="display:flex;align-items:center;gap:6px;">
                        <i class="ph ph-check"></i> Aplicar Reajuste
                    </button>
                </div>
            </div>
            <div style="overflow:auto;border:1px solid #e2e8f0;border-radius:8px;background:white;flex:1;">
                ${temItens ? `
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;position:sticky;top:0;z-index:1;">
                            <th style="padding:8px 6px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">Disciplina</th>
                            <th style="padding:8px 6px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">C\u00f3digo</th>
                            <th style="padding:8px 6px;text-align:left;font-weight:600;color:#475569;white-space:nowrap;">Descri\u00e7\u00e3o</th>
                            <th style="padding:8px 6px;text-align:right;font-weight:600;color:#475569;white-space:nowrap;">Custo Unit\u00e1rio</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                ` : '<div style="padding:60px;text-align:center;color:#94a3b8;font-size:13px;"><i class="ph ph-package" style="font-size:32px;display:block;margin-bottom:8px;"></i>Nenhum item cadastrado.</div>'}
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:8px;padding:8px 16px;background:white;border:1px solid #e2e8f0;border-radius:8px;flex-shrink:0;">
                <span style="font-size:11px;color:#64748b;">Total de itens: <strong>${allItems.length}</strong></span>
            </div>
        </div>
    </div>`;
};

PropostaTecnicaModule.aplicarReajusteInfra = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const indiceEl = document.getElementById('infra-indice-reajuste');
    if (!indiceEl) return;
    const indice = parseFloat(indiceEl.value.replace(',', '.'));
    if (isNaN(indice) || indice === 0) {
        window.app.toast?.('Informe um \u00edndice de reajuste diferente de zero.', 'warning');
        return;
    }
    let totalItems = 0;
    data.infraestrutura.disciplinas.forEach(d => { totalItems += d.itens.length; });
    if (totalItems === 0) {
        window.app.toast?.('Nenhum item para reajustar.', 'warning');
        return;
    }
    if (!confirm(`Aplicar reajuste de ${indice}% em todos os ${totalItems} itens?`)) return;
    const fator = 1 + indice / 100;
    data.infraestrutura.disciplinas.forEach(disc => {
        disc.itens.forEach(item => {
            item.custoUnitario = (item.custoUnitario || 0) * fator;
        });
    });
    store.setState({ activeTechnicalProposal: data });
    window.app.toast?.(`Reajuste de ${indice}% aplicado a ${totalItems} itens!`, 'success');
    PropostaTecnicaModule.renderModal(data);
};

PropostaTecnicaModule.switchDisciplina = function(disciplinaId) {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    PropostaTecnicaModule.captureInfraData();
    data.infraestrutura.activeDisciplina = disciplinaId;
    store.setState({ activeTechnicalProposal: data });
    PropostaTecnicaModule.renderModal(data);
};

PropostaTecnicaModule.addInfraItem = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc) return;
    PropostaTecnicaModule.captureInfraData();
    const prefix = INFRA_PREFIX[disc.id] || 'INF';
    disc.itens.push({
            codigo: `${prefix}-${String(disc.itens.length + 1).padStart(3, '0')}`,
            descricao: '',
            qtd: 1,
            un: 'un',
            custoUnitario: 0,
            horasInstalacao: 0,
            valorHora: 0,
            dificuldade: 1.0,
            desconto: 0,
            markup: 0,
            fornecedor: '',
            prazo: '',
            categoria: '',
            materialId: ''
        });
    store.setState({ activeTechnicalProposal: data });
    PropostaTecnicaModule.renderModal(data);
};

PropostaTecnicaModule.deleteInfraItem = function(index) {
    if (!confirm('Excluir este item?')) return;
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc || !disc.itens[index]) return;
    PropostaTecnicaModule.captureInfraData();
    disc.itens.splice(index, 1);
    store.setState({ activeTechnicalProposal: data });
    PropostaTecnicaModule.renderModal(data);
};

// ─── Infraestrutura — Catálogo de Materiais ─────────────────────────

PropostaTecnicaModule.openAddInfraMaterialModal = function() {
    const existing = document.getElementById('modal-add-infra-material');
    if (existing) existing.remove();
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-add-infra-material';
    modal.innerHTML = `
        <div class="modal" style="width:1152px;max-width:90vw;">
            <div class="modal-header" style="background:var(--color-accent);color:white;">
                <h3>Adicionar Material — ${PropostaTecnicaModule._escapeHtml(disc.nome)}</h3>
                <button class="btn btn-ghost" style="color:white" onclick="this.closest('.modal-overlay').remove()"><i class="ph ph-x"></i></button>
            </div>
            <div class="modal-body">
                <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                    <select id="aim-manufacturer" class="form-control" style="width:200px;" onchange="app.propostaTecnica._renderAddInfraMaterialList()">
                        <option value="">Todos os Fabricantes</option>
                    </select>
                    <input type="text" id="aim-filter-model" class="form-control" placeholder="Filtrar descri\u00e7\u00e3o..." oninput="app.propostaTecnica._renderAddInfraMaterialList()">
                    <input type="text" id="aim-filter-code" class="form-control" placeholder="Filtrar c\u00f3digo..." oninput="app.propostaTecnica._renderAddInfraMaterialList()">
                    <label style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;white-space:nowrap;cursor:pointer;color:#f59e0b;">
                        <input type="checkbox" id="aim-filter-favoritos" onchange="app.propostaTecnica._renderAddInfraMaterialList()"> \u2b50 Favoritos
                    </label>
                </div>
                <div style="max-height:400px;overflow-y:auto;border:1px solid var(--color-border);border-radius:4px;">
                    <table class="w-full" style="font-size:13px;">
                        <thead><tr style="background:#f1f5f9;">
                            <th style="padding:10px;">DESCRI\u00c7\u00c3O</th>
                            <th style="padding:10px;width:120px;">MODELO</th>
                            <th style="padding:10px;width:130px;">C\u00d3D. FAB.</th>
                            <th style="padding:10px;width:110px;">FABRICANTE</th>
                            <th style="padding:10px;width:100px;text-align:right;">UNIT. (R$)</th>
                            <th style="padding:10px;width:60px;text-align:center;">QTD</th>
                            <th style="padding:10px;width:50px;"></th>
                        </tr></thead>
                        <tbody id="aim-items-body"></tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <span style="font-size:12px;color:var(--color-text-muted);flex:1;">
                    Materiais adicionados ser\u00e3o vinculados \u00e0 disciplina <b>${PropostaTecnicaModule._escapeHtml(disc.nome)}</b>
                </span>
                <button class="btn btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn btn-primary" onclick="app.propostaTecnica._confirmAddInfraMaterial()" style="">
                    <i class="ph ph-check"></i> Conclu\u00eddo
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    PropostaTecnicaModule._populateInfraMaterialManufacturers(modal);
    PropostaTecnicaModule._renderAddInfraMaterialList();
};

PropostaTecnicaModule._populateInfraMaterialManufacturers = function(modal) {
    const all = store.getState().materiais || [];
    const unique = [...new Set(all.map(m => m.fabricante).filter(Boolean))].sort();
    const sel = modal.querySelector('#aim-manufacturer');
    if (sel) {
        unique.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f;
            sel.appendChild(opt);
        });
    }
};

PropostaTecnicaModule._renderAddInfraMaterialList = function() {
    const modal = document.getElementById('modal-add-infra-material');
    if (!modal) return;
    const manufacturer = modal.querySelector('#aim-manufacturer')?.value || '';
    const filterModel  = (modal.querySelector('#aim-filter-model')?.value || '').toLowerCase();
    const filterCode   = (modal.querySelector('#aim-filter-code')?.value || '').toLowerCase();
    const favoritosOnly = modal.querySelector('#aim-filter-favoritos')?.checked || false;
    const tbody = modal.querySelector('#aim-items-body');
    if (!tbody) return;

    const hasActiveFilter = manufacturer || favoritosOnly || filterModel.length >= 3 || filterCode.length >= 3;

    if (!hasActiveFilter) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;font-size:13px;">' +
            '<i class="ph ph-magnifying-glass" style="font-size:28px;display:block;margin-bottom:8px;"></i>' +
            'Digite ao menos 3 caracteres para buscar, selecione um fabricante ou marque "Favoritos".' +
            '</td></tr>';
        return;
    }

    const all = store.getState().materiais || [];
    const filtered = all.filter(m => {
        if (favoritosOnly && !m.favorito) return false;
        if (manufacturer && m.fabricante !== manufacturer) return false;
        if (filterModel && !(m.descricao || '').toLowerCase().includes(filterModel)) return false;
        if (filterCode && !(m.codigoFabricante || '').toLowerCase().includes(filterCode)) return false;
        return true;
    });

    const MAX = 200;
    const showItems = filtered.slice(0, MAX);
    const total = filtered.length;

    if (showItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">Nenhum material encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = showItems.map(m => {
        const desc = PropostaTecnicaModule._escapeHtml(m.descricao || '');
        const modelo = PropostaTecnicaModule._escapeHtml(m.modelo || '-');
        const codFab = PropostaTecnicaModule._escapeHtml(m.codigoFabricante || '-');
        const fab = PropostaTecnicaModule._escapeHtml(m.fabricante || '-');
        const un = PropostaTecnicaModule._escapeHtml(m.unidade || 'un');
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
                    data-modelo="${modelo}"
                    data-unidade="${un}">
            </td>
            <td style="padding:8px 10px;text-align:center;">
                <button class="btn btn-xs btn-primary" onclick="app.propostaTecnica._addInfraMaterialSingleItem(this)"
                    style="font-size:11px;padding:4px 10px;">
                    <i class="ph ph-plus"></i>
                </button>
            </td>
        </tr>`;
    }).join('');

    if (total > MAX) {
        tbody.innerHTML += '<tr><td colspan="7" style="text-align:center;padding:10px;color:#64748b;font-size:12px;">' +
            'Mostrando ' + MAX + ' de ' + total + ' resultados. Refine a busca para maior precis\u00e3o.' +
            '</td></tr>';
    }
};

PropostaTecnicaModule._addInfraMaterialSingleItem = async function(btn) {
    const row = btn.closest('tr');
    const qtdInput = row.querySelector('input[type="number"]');
    const qtd = parseInt(qtdInput?.value) || 1;
    const materialId = qtdInput?.dataset?.materialId;
    if (!materialId) return;

    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc) return;

    PropostaTecnicaModule.captureInfraData();

    const existing = disc.itens.find(item => item.materialId === materialId);
    if (existing) {
        console.log('existing item found, incrementing qtd');
        existing.qtd = (existing.qtd || 0) + qtd;
    } else {
        disc.itens.push({
            codigo: `MAT-${String(disc.itens.length + 1).padStart(3, '0')}`,
            descricao: qtdInput.dataset.descricao || '',
            qtd: qtd,
            un: qtdInput.dataset.unidade || 'un',
            custoUnitario: parseFloat(qtdInput.dataset.custo) || 0,
            horasInstalacao: 0,
            valorHora: 0,
            dificuldade: 1.0,
            desconto: 0,
            markup: 0,
            fornecedor: qtdInput.dataset.fabricante || '',
            prazo: '',
            categoria: '',
            materialId: materialId
        });
    }

    store.setState({ activeTechnicalProposal: data });
    window.app.toast?.('Material adicionado \u00e0 disciplina!', 'success');
    await PropostaTecnicaModule.renderModal(data);
    PropostaTecnicaModule.openAddInfraMaterialModal();
};

PropostaTecnicaModule._confirmAddInfraMaterial = async function() {
    document.getElementById('modal-add-infra-material')?.remove();
    const data = store.getState().activeTechnicalProposal;
    if (data) {
        await PropostaTecnicaModule.renderModal(data);
    }
    window.app.toast?.('Materiais vinculados \u00e0 disciplina!', 'success');
};

PropostaTecnicaModule.captureInfraData = function() {
    const data = store.getState().activeTechnicalProposal;
    if (!data || !data.infraestrutura) return;
    const tbody = document.getElementById('infra-table-body');
    if (!tbody) return;
    const disc = data.infraestrutura.disciplinas.find(d => d.id === data.infraestrutura.activeDisciplina);
    if (!disc) return;
    const rows = tbody.querySelectorAll('tr[data-infra-index]');
    rows.forEach(row => {
        const i = parseInt(row.getAttribute('data-infra-index'));
        if (isNaN(i) || i >= disc.itens.length) return;
        const g = (name) => {
            const el = row.querySelector(`[name="infra_${name}_${i}"]`);
            if (!el) return undefined;
            return el.value;
        };
        const gn = (name) => {
            const val = g(name);
            if (val === undefined || val === '') return undefined;
            const parsed = parseFloat(val.replace(',', '.'));
            return isNaN(parsed) ? 0 : parsed;
        };
        const sv = (name) => { const v = g(name); if (v !== undefined) disc.itens[i][name] = v; };
        const sn = (name) => { const v = gn(name); if (v !== undefined) disc.itens[i][name] = v; };
        sv('codigo');
        sv('descricao');
        sn('qtd');
        sv('un');
        sn('custoUnitario');
        sn('horasInstalacao');
        sn('valorHora');
        sn('dificuldade');
        sn('desconto');
        sn('markup');
        sv('fornecedor');
        sv('prazo');
        sv('categoria');
    });
    // Capture perda from discipline header
    const perdaEl = document.querySelector('[name="infra_perda"]');
    if (perdaEl) {
        const perdaVal = parseFloat(perdaEl.value.replace(',', '.'));
        disc.perda = isNaN(perdaVal) ? 10 : perdaVal;
    }
    store.setState({ activeTechnicalProposal: data });
};


PropostaTecnicaModule.init();

export { PropostaTecnicaModule };




