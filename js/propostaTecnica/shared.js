// shared.js: constantes e helpers de dados compartilhados — bloco extraido de js/propostaTecnica.js na Fase 6 (gerado por split_ptc2; nao editar sem rever o monolito)

import { EMPRESA } from '../empresaConfig.js';




export const COMMON_NORMS = [

    { id: 'nbr_iec_61439', label: 'ABNT NBR IEC 61439-1 e 2', description: 'Conjuntos de manobra e comando de baixa tensão' },

    { id: 'nbr_iec_62271', label: 'ABNT NBR IEC 62271-200', description: 'Conjuntos de manobra e comando de Média Tensão - Cubículos MT' },

    { id: 'nr10', label: 'NR-10', description: 'Segurança em instalações e serviços em eletricidade' },

    { id: 'nr12', label: 'NR-12', description: 'Segurança no trabalho em máquinas e equipamentos' },

    { id: 'nbr14039', label: 'ABNT NBR 14039', description: 'Instalações elétricas de média tensão' },

    { id: 'nbr_iec_60529', label: 'ABNT NBR IEC 60529', description: 'Classificação do grau de proteção (IP)' }

];

export const ELETROCENTRO_NORMS = [
    { id: 'iec_62271_202', label: 'IEC 62271-202', description: 'Normas Estruturais e de Invólucro' },
    { id: 'nbr_8800', label: 'ABNT NBR 8800', description: 'Projeto e o cálculo estrutural de estruturas metálicas' },
    { id: 'nbr_13231', label: 'ABNT NBR 13231', description: 'Proteção contra incêndio em salas elétricas' },
    { id: 'nbr_10898', label: 'ABNT NBR 10898', description: 'Sistemas de iluminação de emergência' }
];



export const DEFAULT_LABOR_ROLES = [

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

export const DEFAULT_EXPENSES = [

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

export const VENDOR_MAP = {
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



export const DEFAULT_ELETROCENTRO_SCOPE = [

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

export function migrateEletrocentroScope(scope) {

    if (!scope || scope.length === 0) return JSON.parse(JSON.stringify(DEFAULT_ELETROCENTRO_SCOPE));

    // Se já é array de grupos (tem groupName), retorna como está

    if (scope[0] && typeof scope[0].groupName === 'string') return scope;

    // Formato antigo: array plano de itens â migra para um grupo "PROJETOS"

    return [{ groupName: "PROJETOS", items: scope }];

}





export const DEFAULT_EXCLUSIONS = [
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

export const makeDefaultExclusions = () => DEFAULT_EXCLUSIONS.map(texto => ({ id: crypto.randomUUID(), texto }));

export const AUTPRO_SCOPE_ITEMS = [
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
    { id: 'autpro_56', desc: 'CONFIDENCIALIDADE' },
    { id: 'autpro_57', desc: 'APROVAÇÃO DOS PROJETOS' },
    { id: 'autpro_58', desc: 'PROJETOS E OBRAS CIVIS' },
    { id: 'autpro_59', desc: 'ACESSOS EXTERNOS' },
    { id: 'autpro_60', desc: 'CANTEIRO DE OBRA' },
    { id: 'autpro_61', desc: 'TRATATIVAS COM A CONCESSIONÁRIA' },
    { id: 'autpro_62', desc: 'SISTEMA DE MÉDIA TENSÃO' },
    { id: 'autpro_63', desc: 'ESTUDOS ELÉTRICOS' },
    { id: 'autpro_64', desc: 'ALTA TENSÃO E LINHA DE TRANSMISSÃO E DISTRIBUIÇÃO' },
    { id: 'autpro_65', desc: 'SISTEMA DE DETECÇÃO E COMBATE A INCÊNDIO' },
    { id: 'autpro_66', desc: 'RECUPERAÇÃO / COMPENSAÇÃO AMBIENTAL' },
    { id: 'autpro_67', desc: 'LICENCIAMENTO AMBIENTAL' },
    { id: 'autpro_68', desc: 'PROPOSTA BUDGET' },
    { id: 'autpro_69', desc: 'MOBILIZAÇÃO DE EQUIPES' },
    { id: 'autpro_70', desc: 'ESCOPO MACRO DE FORNECIMENTO' },
    { id: 'autpro_71', desc: 'DOCUMENTAÇÃO DE ENGENHARIA' },
    { id: 'autpro_72', desc: 'PROJETO DE PAINÉIS' },
    { id: 'autpro_73', desc: 'PROJETO EXECUTIVO DE INSTALAÇÕES' },
    { id: 'autpro_74', desc: 'DATABOOK' },
    { id: 'autpro_75', desc: 'ART (ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA)' },
    { id: 'autpro_76', desc: 'FORNECIMENTO DE EQUIPAMENTOS' },
    { id: 'autpro_77', desc: 'CRONOGRAMA DO PROJETO E PLANEJAMENTO DA OBRA' },
    { id: 'autpro_78', desc: 'OMISSÕES OU INFORMAÇÕES NÃO CEDIDAS PELA CONTRATANTE' },
    { id: 'autpro_79', desc: 'ESTUDO DE CURTO-CIRCUITO' },
    { id: 'autpro_80', desc: 'ESTUDO DE SELETIVIDADE E COORDENAÇÃO DA PROTEÇÃO' },
    { id: 'autpro_81', desc: 'ESTUDO DE ARC FLASH' },
    { id: 'autpro_82', desc: 'ESTUDO DE FLUXO DE CARGA' },
    { id: 'autpro_83', desc: 'ESTUDO DE PARTIDA DE MOTORES' },
    { id: 'autpro_84', desc: 'ESTUDO DE QUALIDADE DE ENERGIA E HARMÔNICOS' },
    { id: 'autpro_85', desc: 'ESTUDO DE MALHA DE ATERRAMENTO' },
    { id: 'autpro_86', desc: 'PADRÕES' },
    { id: 'autpro_87', desc: 'LISTAS DE - PARA' },
    { id: 'autpro_88', desc: 'LISTAS DE IO´S' },
    { id: 'autpro_89', desc: 'ARQUITETURA DE REDE' },
    { id: 'autpro_90', desc: 'PLANTA DE ENCAMINHAMENTO DE INFRAESTRUTURA DE MÉDIA E BAIXA TENSÃO' },
    { id: 'autpro_91', desc: 'PLANTA DE ENCAMINHAMENTO DE INFRAESTRUTURA DE AUTOMAÇÃO, REDES E INSTRUMENTAÇÃO' },
    { id: 'autpro_92', desc: 'CADERNO DE DETALHES TÍPICOS' },
    { id: 'autpro_93', desc: 'MEMORIAS DE CÁLCULOS' },
    { id: 'autpro_94', desc: 'PROJETO DE ILUMINAÇÃO' },
    { id: 'autpro_95', desc: 'SISTEMA DE ATERRAMENTO' },
    { id: 'autpro_96', desc: 'PDA E SPDA' },
    { id: 'autpro_97', desc: 'ESTUDOS ELÉTRICOS' },
    { id: 'autpro_98', desc: 'CRITÉRIOS DE ACEITAÇÃO' },
    { id: 'autpro_99', desc: 'ESCOPO MACRO DE FORNECIMENTO' },
    { id: 'autpro_100', desc: 'CAPA' },
    { id: 'autpro_101', desc: 'ÍNDICE' },
    { id: 'autpro_102', desc: 'DADOS TÉCNICOS' },
    { id: 'autpro_103', desc: 'SIMBOLOGIA' },
    { id: 'autpro_104', desc: 'LAYOUT MECÂNICO DOS PAINÉIS' },
    { id: 'autpro_105', desc: 'DIAGRAMA UNIFILAR (SE NECESSÁRIO)' },
    { id: 'autpro_106', desc: 'DIAGRAMA TRIFILAR' },
    { id: 'autpro_107', desc: 'DETALHAMENTO DAS RÉGUAS DE BORNES' },
    { id: 'autpro_108', desc: 'LISTA DE MATERIAL' },
    { id: 'autpro_109', desc: 'ARQUITETURA DE REDE DO PAINEL (SE NECESSÁRIO)' },
    { id: 'autpro_110', desc: 'INFORMAÇÕES PARA FABRICAÇÃO' },
    { id: 'autpro_111', desc: 'INFORMAÇÕES PARA INSTALAÇÃO' },
    { id: 'autpro_112', desc: 'AS BUILT' }
];

export const PREMISSAS_IDS = [
    'autpro_77', 'autpro_78',
    'autpro_57', 'autpro_58', 'autpro_59', 'autpro_60', 'autpro_61',
    'autpro_62', 'autpro_63', 'autpro_64', 'autpro_65', 'autpro_66',
    'autpro_67', 'autpro_68', 'autpro_69'
];

export const PREMISSAS_LABELS = {
    autpro_77: 'CRONOGRAMA DO PROJETO E PLANEJAMENTO DA OBRA',
    autpro_78: 'OMISSÕES OU INFORMAÇÕES NÃO CEDIDAS PELA CONTRATANTE',
    autpro_57: 'APROVAÇÃO DOS PROJETOS',
    autpro_58: 'PROJETOS E OBRAS CIVIS',
    autpro_59: 'ACESSOS EXTERNOS',
    autpro_60: 'CANTEIRO DE OBRA',
    autpro_61: 'TRATATIVAS COM A CONCESSIONÁRIA',
    autpro_62: 'SISTEMA DE MÉDIA TENSÃO',
    autpro_63: 'ESTUDOS ELÉTRICOS',
    autpro_64: 'ALTA TENSÃO E LINHA DE TRANSMISSÃO E DISTRIBUIÇÃO',
    autpro_65: 'SISTEMA DE DETECÇÃO E COMBATE A INCÊNDIO',
    autpro_66: 'RECUPERAÇÃO / COMPENSAÇÃO AMBIENTAL',
    autpro_67: 'LICENCIAMENTO AMBIENTAL',
    autpro_68: 'PROPOSTA BUDGET',
    autpro_69: 'MOBILIZAÇÃO DE EQUIPES'
};

export const PREMISSAS_NUMBERS = {
    autpro_77: '5.1', autpro_78: '5.2',
    autpro_57: '5.3', autpro_58: '5.4', autpro_59: '5.5', autpro_60: '5.6', autpro_61: '5.7',
    autpro_62: '5.8', autpro_63: '5.9', autpro_64: '5.10', autpro_65: '5.11', autpro_66: '5.12',
    autpro_67: '5.13', autpro_68: '5.14', autpro_69: '5.15'
};

export const DOCUMENTACAO_IDS = [
    'autpro_71', 'autpro_97', 'autpro_72', 'autpro_73', 'autpro_86', 'autpro_74', 'autpro_75',
    'autpro_79', 'autpro_80', 'autpro_81', 'autpro_82', 'autpro_83', 'autpro_84', 'autpro_85',
    'autpro_87', 'autpro_88', 'autpro_89', 'autpro_90', 'autpro_91', 'autpro_92', 'autpro_93',
    'autpro_94', 'autpro_95', 'autpro_96',
    'autpro_100', 'autpro_101', 'autpro_102', 'autpro_103', 'autpro_104', 'autpro_105',
    'autpro_106', 'autpro_107', 'autpro_108', 'autpro_109', 'autpro_110', 'autpro_111', 'autpro_112'
];

export const DOCUMENTACAO_LABELS = {
    autpro_71: '7. DOCUMENTAÇÃO DE ENGENHARIA',
    autpro_97: '7.1. ESTUDOS ELÉTRICOS',
    autpro_79: 'Estudo de Curto-Circuito',
    autpro_80: 'Estudo de Seletividade e Coordenação da Proteção',
    autpro_81: 'Estudo de Arc Flash',
    autpro_82: 'Estudo de Fluxo de Carga',
    autpro_83: 'Estudo de Partida de Motores',
    autpro_84: 'Estudo de Qualidade de Energia e Harmônicos',
    autpro_85: 'Estudo de Malha de Aterramento',
    autpro_72: '7.2. PROJETO DE PAINÉIS',
    autpro_100: 'Capa',
    autpro_101: 'Índice',
    autpro_102: 'Dados Técnicos',
    autpro_103: 'Simbologia',
    autpro_104: 'Layout Mecânico dos Painéis',
    autpro_105: 'Diagrama Unifilar (se necessário)',
    autpro_106: 'Diagrama Trifilar',
    autpro_107: 'Detalhamento das Réguas de Bornes',
    autpro_108: 'Lista de Material',
    autpro_109: 'Arquitetura de Rede do Painel (se necessário)',
    autpro_110: 'Informações para Fabricação',
    autpro_111: 'Informações para Instalação',
    autpro_112: 'As Built',
    autpro_73: '7.3. PROJETO EXECUTIVO DE INSTALAÇÕES',
    autpro_87: 'Listas DE - PARA',
    autpro_88: 'Listas de IO´s',
    autpro_89: 'Arquitetura de Rede',
    autpro_90: 'Planta de encaminhamento de infraestrutura de média e baixa tensão',
    autpro_91: 'Planta de encaminhamento de infraestrutura de automação, redes e instrumentação',
    autpro_92: 'Caderno de Detalhes Típicos',
    autpro_93: 'Memorias de Cálculos',
    autpro_94: 'Projeto de Iluminação',
    autpro_95: 'Sistema de aterramento',
    autpro_96: 'PDA e SPDA',
    autpro_86: '7.4. PADRÕES',
    autpro_74: '7.5. DATABOOK',
    autpro_75: '7.6. ART (ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA)'
};

export const DOCUMENTACAO_ORDER = ['autpro_97', 'autpro_72', 'autpro_73', 'autpro_86', 'autpro_74', 'autpro_75'];

export const DOCUMENTACAO_SUB_MASTERS = {
    autpro_97: ['autpro_79', 'autpro_80', 'autpro_81', 'autpro_82', 'autpro_83', 'autpro_84', 'autpro_85'],
    autpro_72: ['autpro_100', 'autpro_101', 'autpro_102', 'autpro_103', 'autpro_104', 'autpro_105', 'autpro_106', 'autpro_107', 'autpro_108', 'autpro_109', 'autpro_110', 'autpro_111', 'autpro_112'],
    autpro_73: ['autpro_87', 'autpro_88', 'autpro_89', 'autpro_90', 'autpro_91', 'autpro_92', 'autpro_93', 'autpro_94', 'autpro_95', 'autpro_96']
};

export const FORNECIMENTO_IDS = [
    'autpro_99',
    'autpro_01', 'autpro_02', 'autpro_03', 'autpro_04', 'autpro_05', 'autpro_06', 'autpro_07',
    'autpro_08',
    'autpro_09', 'autpro_10', 'autpro_11', 'autpro_12', 'autpro_13', 'autpro_14', 'autpro_15', 'autpro_16',
    'autpro_17',
    'autpro_18', 'autpro_19'
];

export const FORNECIMENTO_ORDER = ['autpro_99', 'autpro_08', 'autpro_17'];

export const FORNECIMENTO_SUB_MASTERS = {
    autpro_99: ['autpro_01', 'autpro_02', 'autpro_03', 'autpro_04', 'autpro_05', 'autpro_06', 'autpro_07'],
    autpro_08: ['autpro_09', 'autpro_10', 'autpro_11', 'autpro_12', 'autpro_13', 'autpro_14', 'autpro_15', 'autpro_16'],
    autpro_17: ['autpro_18', 'autpro_19']
};

export const FORNECIMENTO_STATIC_SUB_ITEMS = {
    autpro_19: [
        'Módulos básicos DIO',
        'MiniDio p/ Trilho DIN – 6FO',
        'Cordões Duplex - MM (62.5) ST-SPC/ST-SPC 1.5m',
        'Extensões Opticas Conectorizadas - 02F MM (62.5) ST-SPC',
        'Tubete 60x3,5mm'
    ]
};

