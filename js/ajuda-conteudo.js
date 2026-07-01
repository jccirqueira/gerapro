window.AJUDA_CONTEUDO = {

  _geral: {
    titulo: 'Sobre o GeraPro',
    icone: 'ph-info',
    descricao: 'Informações gerais sobre o sistema, interface e navegação.',
    secoes: [
      {
        id: 'introducao',
        titulo: 'Introdução',
        screenshot: 'prints/geral/introducao.png',
        texto: 'O GeraPro é um sistema web integrado para gestão de engenharia e processos comerciais da Minha Empresa. Foi desenvolvido para facilitar a criação de listas de cargas, geração automática de listas de materiais, elaboração de propostas técnicas e comerciais, e gestão de clientes.\n\nO sistema opera localmente e sincroniza automaticamente os dados com a estrutura de pastas PTC no computador, utilizando um servidor Node.js para versionamento e armazenamento em disco.'
      },
      {
        id: 'interface',
        titulo: 'Interface Geral',
        screenshot: 'prints/geral/interface.png',
        texto: 'A interface é dividida em duas áreas principais:\n\nBarra Lateral (Menu): Localizada à esquerda, contém a navegação principal do sistema, organizada em categorias: Principal, Cadastros, Comercial, Engenharia, Relatórios e Configurações.\n\nÁrea de Conteúdo: Ocupa o restante da tela à direita. É onde os módulos e ferramentas são carregados conforme a seleção no menu.\n\nHeader: Contém o título da página, botão de busca de PTC, botão para criar nova PTC, alternador de tema claro/escuro, indicadores de dólar e data base, e avatar do usuário.'
      },
      {
        id: 'navegacao',
        titulo: 'Navegação',
        screenshot: 'prints/geral/navegacao.png',
        passos: [
          'Clique em qualquer item da barra lateral para abrir o módulo correspondente.',
          'Use o botão "Buscar PTC" no header para localizar rapidamente uma PTC específica.',
          'Use o botão "Iniciar Nova PTC" para criar um novo projeto.',
          'O alternador de tema (lua/sol) no header permite alternar entre tema claro e escuro.',
          'Pressione F1 a qualquer momento para abrir esta ajuda contextual.'
        ]
      },
      {
        id: 'ptc',
        titulo: 'O que é uma PTC',
        screenshot: 'prints/geral/ptc.png',
        texto: 'PTC (Proposta Técnica e Comercial) é a unidade organizacional do GeraPro. Cada projeto/obra possui uma PTC própria, que agrupa:\n\n- Proposta Técnica: especificações, equipamentos, escopo\n- Proposta Comercial: condições comerciais, preços\n- Precificação: cálculos de custos e margens\n- Revisões: histórico de versões\n- Documentos Word exportados\n\nAs PTCs são armazenadas em pastas no computador e sincronizadas automaticamente pelo sistema.'
      }
    ]
  },

  dashboard: {
    titulo: 'Dashboard',
    icone: 'ph-squares-four',
    descricao: 'Visão geral do sistema com indicadores e métricas.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/dashboard/visao-geral.png',
        texto: 'Ao iniciar o sistema, a tela de Dashboard é apresentada. Ela contém cards informativos com o resumo do sistema:\n\n- Total de Clientes Cadastrados\n- Total de Propostas Emitidas\n- Resumo de Materiais no Banco de Dados\n- Gráfico de Pipeline (funil de oportunidades)\n- Valor total em pipeline e ticket médio\n- Atividades recentes (últimas propostas e itens do pipeline)\n\nO dashboard é o ponto de partida para acompanhar a saúde comercial e de engenharia da operação.'
      }
    ]
  },

  clientes: {
    titulo: 'Clientes',
    icone: 'ph-users',
    descricao: 'Cadastro e gerenciamento de clientes com informações fiscais, contatos e observações.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/clientes/visao-geral.png',
        texto: 'O módulo de Clientes permite gerenciar o banco de dados de clientes da empresa. É possível cadastrar, editar, excluir e visualizar clientes, com informações completas de endereço, dados fiscais e contatos.'
      },
      {
        id: 'cadastro',
        titulo: 'Como Cadastrar um Cliente',
        screenshot: 'prints/clientes/cadastro.png',
        passos: [
          'Clique no botão "+ Novo Cliente" na tela de listagem.',
          'Preencha os campos obrigatórios (Razão Social, CNPJ).',
          'Navegue pelas abas do formulário para preencher dados de endereço, fiscais e contatos.',
          'Clique em "Salvar" para concluir o cadastro.'
        ]
      },
      {
        id: 'campos-geral',
        titulo: 'Campos — Aba Geral',
        screenshot: 'prints/clientes/campos-geral.png',
        campos: [
          { nome: 'Razão Social', descricao: 'Nome jurídico completo do cliente. Campo obrigatório.' },
          { nome: 'Nome Fantasia', descricao: 'Nome comercial ou fantasia do cliente.' },
          { nome: 'CNPJ', descricao: 'Cadastro Nacional de Pessoa Jurídica. Campo obrigatório.' },
          { nome: 'Segmento', descricao: 'Ramo de atividade do cliente (ex: Sucroalcooleiro, Mineração, etc.).' },
          { nome: 'CNAE', descricao: 'Classificação Nacional de Atividades Econômicas.' }
        ]
      },
      {
        id: 'campos-endereco',
        titulo: 'Campos — Aba Endereço e Fiscal',
        screenshot: 'prints/clientes/campos-endereco.png',
        campos: [
          { nome: 'Inscrição Estadual', descricao: 'Inscrição estadual do cliente para emissão de notas fiscais.' },
          { nome: 'Inscrição Municipal', descricao: 'Inscrição municipal para serviços.' },
          { nome: 'CEP', descricao: 'Código de Endereçamento Postal.' },
          { nome: 'Logradouro', descricao: 'Nome da rua, avenida ou estrada.' },
          { nome: 'Número', descricao: 'Número do endereço.' },
          { nome: 'Bairro', descricao: 'Bairro da localidade.' },
          { nome: 'Cidade', descricao: 'Município do cliente.' },
          { nome: 'UF', descricao: 'Unidade Federativa (sigla de 2 caracteres).' }
        ]
      },
      {
        id: 'contatos',
        titulo: 'Contatos e Observações',
        screenshot: 'prints/clientes/contatos.png',
        texto: 'Na aba Contatos, é possível cadastrar múltiplos contatos por cliente, cada um com:\n\n- Nome do contato\n- Cargo\n- E-mail\n- Telefone/Celular\n\nO primeiro contato cadastrado é usado como padrão para preenchimento automático nos campos "A/C" (Aos Cuidados) nas Propostas.\n\nO campo de Observações Técnicas/Comerciais permite registrar informações adicionais relevantes sobre o cliente.'
      }
    ]
  },

  fornecedores: {
    titulo: 'Fornecedores',
    icone: 'ph-truck',
    descricao: 'Cadastro de fornecedores com dados fiscais, endereço e contatos.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/fornecedores/visao-geral.png',
        texto: 'O módulo de Fornecedores gerencia o banco de dados de fornecedores da empresa, com estrutura similar ao de Clientes: dados fiscais, endereço, contatos e observações.'
      },
      {
        id: 'cadastro',
        titulo: 'Como Cadastrar um Fornecedor',
        screenshot: 'prints/fornecedores/cadastro.png',
        passos: [
          'Clique no botão "+ Novo Fornecedor" na tela de listagem.',
          'Preencha os campos obrigatórios (Razão Social, CNPJ).',
          'Preencha endereço e dados fiscais.',
          'Adicione contatos e observações relevantes.',
          'Clique em "Salvar" para concluir o cadastro.'
        ]
      },
      {
        id: 'campos',
        titulo: 'Campos do Formulário',
        screenshot: 'prints/fornecedores/campos.png',
        campos: [
          { nome: 'Razão Social', descricao: 'Nome jurídico completo do fornecedor. Campo obrigatório.' },
          { nome: 'CNPJ', descricao: 'Cadastro Nacional de Pessoa Jurídica do fornecedor.' },
          { nome: 'Segmento / Tipo', descricao: 'Classificação do fornecedor (ex: Elétrica, Mecânica, Instrumentação).' },
          { nome: 'CEP / Logradouro / Número / Bairro / Cidade / UF', descricao: 'Endereço completo do fornecedor.' },
          { nome: 'Nome do Contato', descricao: 'Nome da pessoa de contato no fornecedor.' },
          { nome: 'E-mail', descricao: 'E-mail do contato principal.' },
          { nome: 'Telefone', descricao: 'Telefone ou celular do contato.' }
        ]
      }
    ]
  },

  'proposta-tecnica': {
    titulo: 'Proposta Técnica',
    icone: 'ph-file-text',
    descricao: 'Elaboração de propostas técnicas com especificações de equipamentos, escopo, vendor list e revisões.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/proposta-tecnica/visao-geral.png',
        texto: 'O módulo de Proposta Técnica é uma ferramenta para geração de documentos formais de especificação técnica. Permite criar, editar e gerenciar propostas com:\n\n- Dados do cliente e projeto\n- Equipamentos com especificações técnicas detalhadas\n- Escopo de fornecimento e matriz de responsabilidade\n- Lista de fornecedores (Vendor List)\n- Controle de revisões\n- Assinaturas (rodapé)\n- Exportação para Word (.docx) com template personalizado\n\nA navegação é feita por abas horizontais: Dados Gerais, Equipamentos, Escopo, Vendor List, Revisões e Assinaturas.'
      },
      {
        id: 'dados-gerais',
        titulo: 'Dados Gerais',
        screenshot: 'prints/proposta-tecnica/dados-gerais.png',
        campos: [
          { nome: 'Cliente', descricao: 'Nome do cliente. Selecionado da lista de clientes cadastrados.' },
          { nome: 'Código da Proposta', descricao: 'Código único gerado automaticamente no formato PTC-AAAA-NNNN-PT_XX. Pode ser editado manualmente.' },
          { nome: 'Data de Emissão', descricao: 'Data de emissão da proposta.' },
          { nome: 'A/C (Aos Cuidados)', descricao: 'Nome do contato do cliente responsável pelo projeto. Preenchido automaticamente conforme o cliente selecionado.' },
          { nome: 'E-mail', descricao: 'E-mail do contato selecionado. Preenchido automaticamente e somente leitura.' },
          { nome: 'Telefone', descricao: 'Telefone do contato selecionado. Preenchido automaticamente e somente leitura.' },
          { nome: 'Nome do Projeto', descricao: 'Título ou nome do projeto/obra.' },
          { nome: 'Referência / Subtítulo', descricao: 'Informação complementar ou referência da proposta.' },
          { nome: 'Objeto do Fornecimento', descricao: 'Descrição do objeto do fornecimento (ex: FORNECIMENTO DE PAINÉIS ELÉTRICOS).' },
          { nome: 'Cidade', descricao: 'Cidade da instalação. Preenchido automaticamente conforme o cliente selecionado.' },
          { nome: 'UF', descricao: 'Estado da instalação. Preenchido automaticamente conforme o cliente. Usado para cálculo de ICMS por UF.' },
          { nome: 'Logomarca (Header)', descricao: 'Imagem PNG para o cabeçalho dos documentos Word.' },
          { nome: 'Logo do Cliente', descricao: 'Imagem PNG da logomarca do cliente para exibição central.' },
          { nome: 'Marca D\'água', descricao: 'Imagem PNG para marca d\'água de fundo em todas as páginas do Word.' }
        ]
      },
      {
        id: 'equipamentos',
        titulo: 'Equipamentos',
        screenshot: 'prints/proposta-tecnica/equipamentos.png',
        texto: 'O coração da proposta técnica. Permite adicionar, configurar e especificar todos os equipamentos elétricos do projeto.\n\nPara adicionar um equipamento, clique em "+ Adicionar Equipamento" e selecione o tipo (CCM-BT, QGBT, CUB-MT, SEU, etc.). Cada equipamento possui:\n\n- TAG: Identificação única do equipamento\n- Tipo: Categoria do painel (CCM, QGBT, CUB, SEU, etc.)\n- Normas: NBR IEC 61439, NR-10\n- Especificações Técnicas: Tensão, ICC, IP, grau de proteção\n- Cargas associadas\n- Sub-abas: técnica, cargas, desvios, mão-de-obra, despesas\n\nA navegação entre equipamentos é feita por uma barra lateral com split-view hierárquico.',
        campos: [
          { nome: 'TAG', descricao: 'Identificação única do equipamento. Ex: CCM-01, QGBT-01.' },
          { nome: 'Tipo', descricao: 'Categoria do painel elétrico. Ex: CCM-BT, QGBT, CUB-MT, SEU.' },
          { nome: 'Tensão Nominal', descricao: 'Tensão nominal do painel. Ex: 380V, 440V, 480V, 690V.' },
          { nome: 'ICC', descricao: 'Capacidade de corrente de curto-circuito suportada. Ex: 50kA.' },
          { nome: 'IP (Grau de Proteção)', descricao: 'Índice de proteção contra sólidos e líquidos. Ex: IP-42, IP-54.' }
        ]
      },
      {
        id: 'io-list',
        titulo: 'Lista de I/O (PLC)',
        screenshot: 'prints/proposta-tecnica/io-list.png',
        texto: 'O configurador de I/O está disponível na sub-tab "Lista de I/O" dos equipamentos de automação (PLC). Permite dimensionar racks, slots e canais de entrada e saída.\n\nFuncionalidades:\n- Adicionar racks configuráveis\n- Configurar canais: DI (Digital Input), DO (Digital Output), AI (Analog Input), AO (Analog Output)\n- Importar/exportar configuração via CSV\n- Típicos I/O: templates salvos para reutilização em projetos similares\n- Gerar BOM (Bill of Materials) a partir da configuração de I/O',
        passos: [
          'Selecione um equipamento do tipo PLC na proposta técnica.',
          'Na sub-tab "Lista de I/O", clique em "Adicionar Rack".',
          'Configure os canais conforme a necessidade do projeto.',
          'Use "Importar CSV" para carregar uma configuração existente.',
          'Clique em "Exportar CSV" para salvar a configuração atual.',
          'Aplique um típico I/O para reutilizar configurações padrão.',
          'Gere a BOM de I/O para incluir os módulos na lista de materiais.'
        ]
      },
      {
        id: 'layout-sugerido',
        titulo: 'Layout Sugerido',
        screenshot: 'prints/proposta-tecnica/layout-sugerido.png',
        texto: 'A sub-tab "Layout" no equipamento exibe a distribuição física dos armários baseada nas cargas, típicos e materiais associados. Disponível para as Formas 1, 2a e 2b de segregação interna.\n\nO layout apresenta:\n- Cards de resumo: número de armários, largura calculada, largura instalada\n- Visualização em canvas com desenho esquemático dos armários\n- Dimensões individuais de cada invólucro\n- Exportação para PDF do layout gerado',
        passos: [
          'Acesse um equipamento na proposta técnica.',
          'Na sub-tab "Layout", visualize a distribuição dos armários.',
          'Confira os cards de resumo com as métricas de dimensão.',
          'Clique em "Exportar PDF" para gerar o documento do layout.'
        ]
      },
      {
        id: 'seu',
        titulo: 'Subestação Unitária (SEU)',
        screenshot: 'prints/proposta-tecnica/seu.png',
        texto: 'A SEU (Subestação Unitária) é um tipo especial de equipamento que funciona como container, agrupando equipamentos de média tensão (MT) sob seu escopo.\n\nCaracterísticas:\n- Tensão primária obrigatória > 1000V (TR-MT)\n- Força Faturamento Próprio automaticamente\n- Na barra lateral, SEUs aparecem como containers expansíveis (▶/▼) com seus componentes indentados\n- No escopo, itens SEU aparecem com fundo âmbar e borda destacada\n- As sub-abas disponíveis são restritas: técnica, desvios e despesas',
        passos: [
          'Ao adicionar um equipamento, selecione o tipo "SEU".',
          'O sistema automaticamente abre o modal SEU para configurar a subestação.',
          'Informe a TAG e a tensão primária (deve ser > 1000V).',
          'Selecione os equipamentos MT que farão parte da SEU na lista de equipamentos disponíveis.',
          'Confirme para criar a SEU com seus componentes.'
        ]
      },
      {
        id: 'escopo',
        titulo: 'Escopo e Matriz de Responsabilidade',
        screenshot: 'prints/proposta-tecnica/escopo.png',
        texto: 'A aba Escopo exibe:\n\n1. Itens de escopo sincronizados automaticamente dos equipamentos cadastrados, incluindo SEUs e seus componentes.\n2. Itens manuais adicionados pelo usuário.\n3. Matriz de Responsabilidade, indicando o que é escopo da Minha Empresa.\n\nCada item pode ser marcado como responsabilidade do cliente (CLI) e/ou da Minha Empresa (PTC). SEUs aparecem em destaque com fundo âmbar e componentes indentados.'
      },
      {
        id: 'vendor',
        titulo: 'Vendor List',
        screenshot: 'prints/proposta-tecnica/vendor.png',
        texto: 'A aba Vendor List permite especificar, para cada tipo de equipamento/configuração, os fabricantes/fornecedores recomendados.\n\nCada linha contém:\n- Componente (tipo)\n- Fabricante (marca)\n- Opção (fornecido, opcional, não aplicável)\n- Especificação (quando "Outro" é selecionado)'
      },
      {
        id: 'revisoes',
        titulo: 'Controle de Revisões',
        screenshot: 'prints/proposta-tecnica/revisoes.png',
        texto: 'A aba Revisões permite gerenciar o histórico de versões da proposta técnica. Cada revisão contém:\n\n- Número sequencial (00, 01, 02...)\n- Descrição da alteração\n- Elaborador (sigla/nome)\n- Verificador\n- Aprovador\n- Data\n\nPara adicionar uma nova revisão, clique em "+ Nova Revisão". Uma linha em branco será inserida na tabela.'
      },
      {
        id: 'assinaturas',
        titulo: 'Assinaturas (Rodapé)',
        screenshot: 'prints/proposta-tecnica/assinaturas.png',
        texto: 'A aba Assinaturas permite configurar até 3 assinaturas que aparecerão no rodapé dos documentos Word exportados, com nome, cargo, telefone e e-mail do signatário.\n\nPadrões:\n1. Consultor de Vendas — José Cirqueira\n2. Gerente Comercial — Leandro Pereira\n3. Diretor de Negócios — Márcio Vaz'
      },
      {
        id: 'infraestrutura',
        titulo: 'Infraestrutura',
        screenshot: 'prints/proposta-tecnica/infraestrutura.png',
        texto: 'A aba Infraestrutura permite gerenciar itens de infraestrutura do projeto organizados por disciplinas:\n\n- Obra Civil (fundações, bases, canaletas)\n- Infraestrutura Elétrica (eletrodutos, bandejas, cabos)\n- SPDA / Aterramento (captores, descidas, malha de aterramento)\n- Infraestrutura Mecânica (suportes, ventilação)\n- Cabeamento Estruturado (rede, fibra óptica, racks)\n- Serviços Técnicos (engenharia, supervisão, comissionamento)\n\nCada item possui código, descrição, quantidade, unidade, custo unitário, horas de instalação e nível de dificuldade (Normal, Elevado ou Crítico).\n\nO custo total da infraestrutura é calculado automaticamente com base nos itens, considerando percentual de perda, impostos (ICMS, IPI) e markup. A tabela de infraestrutura é exportada automaticamente nos documentos Word.',
        passos: [
          'Na Proposta Técnica, clique na aba "Infraestrutura".',
          'Selecione a disciplina desejada nas abas laterais (Obra Civil, Elétrica, etc.).',
          'Clique em "Adicionar Item" para incluir um novo item.',
          'Preencha código, descrição, quantidade, unidade e custo unitário.',
          'Informe as horas de instalação e selecione o nível de dificuldade.',
          'Ajuste o percentual de perda da disciplina se necessário.',
          'O custo total e preço final são recalculados automaticamente.'
        ],
        campos: [
          { nome: 'Código', descricao: 'Código identificador do item (ex: INF-001).' },
          { nome: 'Descrição', descricao: 'Descrição detalhada do item ou serviço.' },
          { nome: 'Quantidade', descricao: 'Quantidade do item (unidades, metros, etc.).' },
          { nome: 'Unidade', descricao: 'Unidade de medida (un, m, m², kg, etc.).' },
          { nome: 'Custo Unitário', descricao: 'Valor unitário do item em R$.' },
          { nome: 'Horas Instalação', descricao: 'Horas estimadas para instalação do item.' },
          { nome: 'Dificuldade', descricao: 'Nível de dificuldade: Normal (1.0), Elevado (1.5) ou Crítico (2.5). Afeta o cálculo de mão de obra.' },
          { nome: 'Perda (%)', descricao: 'Percentual de perda aplicado à disciplina (padrão 10%).' },
          { nome: 'ICMS / IPI', descricao: 'Impostos aplicados ao item para cálculo do preço final.' },
          { nome: 'Markup', descricao: 'Margem de lucro aplicada sobre o custo direto.' }
        ]
      }
    ]
  },

  'proposta-comercial': {
    titulo: 'Proposta Comercial',
    icone: 'ph-briefcase',
    descricao: 'Gestão de preços, condições comerciais, itens de investimento e exportação para Word.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/proposta-comercial/visao-geral.png',
        texto: 'O módulo de Proposta Comercial gerencia as condições financeiras e comerciais das propostas. Permite vincular a proposta a uma PTC específica para versionamento automático. Inclui:\n\n- Dados do cliente e projeto\n- Escopo com itens de fornecimento e investimento\n- Condições comerciais (pagamento, NCM, prazos)\n- Assinaturas (rodapé)\n- Controle de revisões\n- Exportação para Word (.docx)\n\nA navegação é feita por abas horizontais: Dados Gerais, Escopo, Condições Comerciais, Assinaturas e Revisões.'
      },
      {
        id: 'dados-gerais',
        titulo: 'Dados Gerais',
        screenshot: 'prints/proposta-comercial/dados-gerais.png',
        texto: 'A aba Dados Gerais é similar à da Proposta Técnica, mantendo consistência entre os dois módulos. Inclui campos de cliente, código, contato (com e-mail e telefone automáticos), projeto, imagens e marca d\'água.'
      },
      {
        id: 'escopo',
        titulo: 'Escopo',
        screenshot: 'prints/proposta-comercial/escopo.png',
        texto: 'A aba Escopo da Proposta Comercial contém:\n\n1. Descrição do Fornecimento: Itens textuais descrevendo o escopo comercial.\n2. Matriz de Responsabilidade: Define as responsabilidades da Minha Empresa (projeto, montagem, supervisão, comissionamento, frete).\n3. Investimento: Tabela de itens com quantidade, descrição, IPI, preço unitário e marcação de faturamento direto.'
      },
      {
        id: 'condicoes',
        titulo: 'Condições Comerciais',
        screenshot: 'prints/proposta-comercial/condicoes.png',
        campos: [
          { nome: 'Condição de Pagamento', descricao: 'Define o evento, parcela e faturamento (ex: Conta Entrega, 100%, 30 ddl).' },
          { nome: 'Classificação Fiscal (NCM)', descricao: 'Código NCM do produto. Pode ser bloqueado automaticamente conforme o tipo de equipamento (SEU/CUB-MT força NCM 8537.20).' },
          { nome: 'Prazo de Entrega', descricao: 'Prazo estimado para entrega do fornecimento.' },
          { nome: 'Validade da Proposta', descricao: 'Prazo de validade da proposta comercial.' },
          { nome: 'Data Base', descricao: 'Data base dos preços praticados.' },
          { nome: 'Despesas', descricao: 'Descrição das despesas inclusas ou não no fornecimento.' },
          { nome: 'Transporte', descricao: 'Condições de frete e transporte (CIF, FOB, etc.).' }
        ]
      },
      {
        id: 'assinaturas',
        titulo: 'Assinaturas (Rodapé)',
        screenshot: 'prints/proposta-comercial/assinaturas.png',
        texto: 'Idêntico ao módulo de Proposta Técnica, permite configurar as assinaturas que aparecem no rodapé do documento Word exportado.'
      },
      {
        id: 'revisoes',
        titulo: 'Controle de Revisões',
        screenshot: 'prints/proposta-comercial/revisoes.png',
        texto: 'Permite gerenciar o histórico de revisões da proposta comercial, funcionando de forma idêntica ao controle de revisões da Proposta Técnica.'
      },
      {
        id: 'salvar-como-nova',
        titulo: 'Salvar como Nova',
        screenshot: 'prints/proposta-comercial/salvar-como-nova.png',
        texto: 'O botão "Salvar como Nova" no rodapé do formulário permite criar uma cópia da proposta atual em uma nova PTC, preservando os dados preenchidos. Útil quando uma mesma proposta base serve para múltiplos clientes ou revisões de projeto.'
      }
    ]
  },

  'proposta-completa': {
    titulo: 'Proposta Completa',
    icone: 'ph-file',
    descricao: 'Combinação de proposta técnica e comercial em um único documento consolidado.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/proposta-completa/visao-geral.png',
        texto: 'O módulo de Proposta Completa permite gerar um documento consolidado que une os dados da Proposta Técnica e da Proposta Comercial em um único arquivo Word.\n\nEle trabalha vinculado a uma PTC e busca automaticamente:\n- Os dados técnicos (equipamentos, escopo, vendor list) da Proposta Técnica salva na PTC\n- Os dados comerciais (condições, preços, investimento) da Proposta Comercial salva na PTC\n\nO resultado é um documento único pronto para envio ao cliente, contendo tanto as especificações técnicas quanto as condições comerciais.'
      },
      {
        id: 'como-criar',
        titulo: 'Como Criar uma Proposta Completa',
        screenshot: 'prints/proposta-completa/como-criar.png',
        passos: [
          'Certifique-se de que a PTC ativa possui uma Proposta Técnica e uma Proposta Comercial salvas.',
          'No menu lateral, clique em "Proposta Completa" (seção Comercial).',
          'O sistema carrega automaticamente os dados de ambas as propostas.',
          'Revise os dados de cabeçalho (cliente, projeto, datas).',
          'Configure as opções de exportação: templates Word, imagens, etc.',
          'Clique em "Exportar Word" para gerar o documento combinado.'
        ]
      },
      {
        id: 'dados-gerais',
        titulo: 'Dados Gerais do Formulário',
        screenshot: 'prints/proposta-completa/dados-gerais.png',
        campos: [
          { nome: 'Cliente', descricao: 'Preenchido automaticamente da PTC ativa ou da proposta vinculada.' },
          { nome: 'Projeto', descricao: 'Nome do projeto conforme PTC. Pode ser editado.' },
          { nome: 'Código da Proposta', descricao: 'Código gerado automaticamente.' },
          { nome: 'Data de Emissão', descricao: 'Data de emissão da proposta completa.' },
          { nome: 'A/C (Aos Cuidados)', descricao: 'Contato do cliente, preenchido automaticamente.' },
          { nome: 'Logomarcas', descricao: 'Upload de logos para cabeçalho, cliente e marca d\'água.' }
        ]
      },
      {
        id: 'exportacao',
        titulo: 'Exportação para Word',
        screenshot: 'prints/proposta-completa/exportacao.png',
        texto: 'A exportação gera um documento .docx que mescla os templates técnico e comercial. O documento inclui:\n\n- Capa com dados do cliente e projeto\n- Seção Técnica: especificações, equipamentos, escopo, vendor list\n- Seção Comercial: investimento, condições, assinaturas\n- Revisões de ambos os documentos',
        passos: [
          'Preencha todos os campos obrigatórios no formulário.',
          'Verifique se as logos e marca d\'água estão configuradas.',
          'Clique em "Exportar Word" no rodapé.',
          'O arquivo .docx será gerado e baixado automaticamente.'
        ]
      }
    ]
  },

  'pipeline-comercial': {
    titulo: 'Gestão de Propostas',
    icone: 'ph-trend-up',
    descricao: 'Quadro Kanban para gestão de oportunidades e acompanhamento do funil de vendas.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/pipeline-comercial/visao-geral.png',
        texto: 'A Gestão de Propostas é um quadro Kanban que permite acompanhar visualmente todas as oportunidades de negócio em cada etapa do funil de vendas.\n\nO quadro possui 6 colunas (estágios):\n- Aguardando Início: Leads recém-criados ou PTC iniciada (aguardando definição de engenheiro responsável)\n- Em Elaboração: Proposta sendo preparada\n- Proposta Enviada: Proposta enviada ao cliente\n- Negociação: Em tratativas com o cliente\n- Fechado: Negócio ganho\n- Perdido: Negócio não concretizado\n\nCada card no quadro exibe: nome do cliente, projeto, valor, data e indicador de calor (dias sem contato).'
      },
      {
        id: 'kanban',
        titulo: 'Funcionamento do Kanban',
        screenshot: 'prints/pipeline-comercial/kanban.png',
        texto: 'O Kanban do Pipeline oferece:\n\n- Cards de resumo no topo: Itens Ativos, Valor em Pipeline, Taxa de Conversão e Ticket Médio\n- Colunas expansíveis/retráteis (clique no ícone da coluna para recolher/expandir)\n- Cada coluna mostra o total em R$ e a quantidade de itens\n- Drag & Drop: arraste cards entre colunas para mudar o estágio\n- Indicador de calor: bolinha verde (≤3 dias sem contato), âmbar (≤7 dias), vermelha (>7 dias)\n- Ícone de follow-up: sino roxo indica follow-up agendado',
        passos: [
          'Visualize todos os itens distribuídos nas 6 colunas do Kanban.',
          'Para mudar um item de estágio, arraste o card para a coluna desejada.',
          'Clique no ícone da coluna para recolhê-la e economizar espaço horizontal.',
          'Clique em um card para abrir o modal de detalhes e interações.',
          'Use o botão "Novo Lead" para adicionar uma oportunidade manualmente.'
        ]
      },
      {
        id: 'criar-lead',
        titulo: 'Criar um Lead (Novo Lead)',
        screenshot: 'prints/pipeline-comercial/criar-lead.png',
        passos: [
          'Clique no botão "+ Novo Lead" no canto superior direito.',
          'Preencha o nome do cliente (campo obrigatório).',
          'Informe o projeto e o valor estimado (opcionais).',
          'Adicione observações relevantes sobre a oportunidade.',
          'Clique em "Adicionar Lead" — o card aparecerá na coluna "Aguardando Início".'
        ],
        campos: [
          { nome: 'Cliente', descricao: 'Nome do cliente ou empresa. Campo obrigatório.' },
          { nome: 'Projeto', descricao: 'Descrição ou nome do projeto.' },
          { nome: 'Valor Estimado', descricao: 'Valor estimado da oportunidade em R$.' },
          { nome: 'Observações', descricao: 'Informações adicionais sobre o lead.' }
        ]
      },
      {
        id: 'editar-lead',
        titulo: 'Editar um Lead',
        screenshot: 'prints/pipeline-comercial/editar-lead.png',
        texto: 'Para editar um lead existente (apenas leads manuais, não orçamentos):\n\n- Abra o card clicando sobre ele\n- Clique no botão "Editar" no canto superior direito do modal\n- Atualize os campos necessários: cliente, projeto, valor, observações, data do último contato, próximo follow-up\n- Clique em "Salvar"',
        passos: [
          'Clique no card do lead que deseja editar.',
          'No modal de detalhes, clique em "Editar".',
          'Atualize os campos desejados.',
          'Clique em "Salvar" para confirmar as alterações.'
        ]
      },
      {
        id: 'interacoes',
        titulo: 'Registrar Interações',
        screenshot: 'prints/pipeline-comercial/interacoes.png',
        texto: 'Cada item do pipeline possui um histórico de interações que registra todos os contatos com o cliente. Para registrar uma interação:\n\n1. Abra o card do item\n2. Role até a seção "Registrar Interação"\n3. Selecione o tipo: Ligação, E-mail, Reunião, WhatsApp ou Outro\n4. Informe a data e a descrição do contato\n5. Opcionalmente, defina um próximo follow-up (data e hora)\n6. Clique em "Registrar"\n\nO histórico de interações é exibido abaixo com ícones por tipo e ordenado do mais recente para o mais antigo.',
        campos: [
          { nome: 'Tipo', descricao: 'Ligação, E-mail, Reunião, WhatsApp ou Outro.' },
          { nome: 'Data', descricao: 'Data em que ocorreu a interação.' },
          { nome: 'Descrição', descricao: 'Resumo do que foi tratado no contato. Campo obrigatório.' },
          { nome: 'Próx. Follow-up (Data)', descricao: 'Data do próximo acompanhamento agendado.' },
          { nome: 'Próx. Follow-up (Hora)', descricao: 'Horário do próximo acompanhamento.' }
        ]
      },
      {
        id: 'origem-itens',
        titulo: 'Origem dos Itens no Pipeline',
        screenshot: 'prints/pipeline-comercial/origem-itens.png',
        texto: 'Os itens no Pipeline podem ter três origens:\n\n- Leads Manuais: Criados pelo botão "Novo Lead". Aparecem como "Lead direto" no modal de detalhes.\n- Propostas Comerciais: Quando uma Proposta Comercial é salva vinculada a uma PTC, automaticamente aparece no Pipeline como "Aguardando Início". A origem exibe "via proposta_comercial".\n- Orçamentos: Itens do módulo de Orçamentos são automaticamente mapeados para o Pipeline conforme seu status (Em Elaboração → Em Elaboração, Enviado → Proposta Enviada, Aprovado → Fechado, Perdido → Perdido).'
      },
      {
        id: 'exportacao',
        titulo: 'Exportar Pipeline',
        screenshot: 'prints/pipeline-comercial/exportacao.png',
        texto: 'O botão "Exportar" no canto superior direito gera um arquivo CSV com:\n\n- Resumo por estágio (quantidade de itens e valor total por coluna)\n- Lista completa de itens com: Cliente, Projeto, Valor, Estágio, Origem, Datas, Observações\n\nO arquivo é salvo com codificação UTF-8 (com BOM) para compatibilidade com Excel.'
      },
      {
        id: 'impressao',
        titulo: 'Imprimir Pipeline',
        screenshot: 'prints/pipeline-comercial/impressao.png',
        texto: 'O botão "Imprimir" no cabeçalho da Gestão de Propostas gera uma visualização otimizada para impressão contendo:\n\n- KPIs do topo: Itens Ativos, Valor em Pipeline, Taxa de Conversão e Ticket Médio\n- Todos os itens organizados por estágio do kanban em tabelas separadas\n- Cada linha exibe: Cliente, Projeto, Código, Tipo, Vendedor, Eng. Resp., Data Abertura e Valor\n- Rodapé com total geral e quantidade de itens\n\nA impressão abre em uma nova janela e dispara automaticamente o diálogo de impressão do navegador.',
        passos: [
          'Clique no botão "Imprimir" no canto superior direito da tela do Pipeline.',
          'Uma nova janela será aberta com a visualização formatada para impressão.',
          'O diálogo de impressão do navegador será exibido automaticamente.',
          'Configure as opções de impressão (papel, margens, orientação) e clique em "Imprimir".'
        ]
      }
    ]
  },

  precificacao: {
    titulo: 'Precificação',
    icone: 'ph-calculator',
    descricao: 'Cálculo detalhado de custos, impostos, margens e formação de preço final por equipamento.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/precificacao/visao-geral.png',
        texto: 'O módulo de Precificação permite calcular o preço de venda dos equipamentos da proposta técnica com base em:\n\n- Custos diretos (materiais, consumíveis, mão-de-obra, despesas, frete)\n- Créditos (ICMS, PIS/COFINS, IPI)\n- Impostos (DAS, ICMS, PIS/COFINS, ISS, IPI)\n- Margem de lucro e custos fixos\n- Comissões e descontos\n\nO sistema oferece três visualizações: por TAG, por SEU (agrupado) e consolidado.'
      },
      {
        id: 'modos',
        titulo: 'Modos de Visualização',
        screenshot: 'prints/precificacao/modos.png',
        texto: 'A precificação pode ser visualizada de três formas:\n\nPor TAG: Exibe a precificação individual de cada equipamento (TAG). Ideal para ajustes finos por equipamento.\n\nPor SEU: Agrupa todos os componentes de uma SEU e exibe a precificação consolidada da subestação.\n\nConsolidado: Exibe o resumo de todos os equipamentos e SEUs, com totais gerais.'
      },
      {
        id: 'campos',
        titulo: 'Campos do Formulário',
        screenshot: 'prints/precificacao/campos.png',
        campos: [
          { nome: 'Total Materiais (PT)', descricao: 'Valor total de materiais conforme a Proposta Técnica. Campo somente leitura.' },
          { nome: 'Consumíveis (%)', descricao: 'Percentual de consumíveis sobre os materiais.' },
          { nome: 'Mão de Obra (MOD + ENG)', descricao: 'Custo total de mão-de-obra. Campo somente leitura.' },
          { nome: 'Despesas Logística', descricao: 'Valor de despesas logísticas. Campo somente leitura.' },
          { nome: 'Custo Administrativo (%)', descricao: 'Percentual de custo administrativo/frete.' },
          { nome: 'Créditos (ICMS, PIS/COF, IPI)', descricao: 'Valores de créditos tributários a abater.' },
          { nome: 'Alíquota DAS', descricao: 'Alíquota unificada do Simples Nacional.' },
          { nome: 'ICMS (%)', descricao: 'Percentual de ICMS.' },
          { nome: 'PIS/COFINS (%)', descricao: 'Percentual de PIS e COFINS.' },
          { nome: 'ISS (%)', descricao: 'Percentual de ISS (para prestação de serviços).' },
          { nome: 'IPI (%)', descricao: 'Percentual de IPI. Pode ser marcado como Isento.' },
          { nome: 'Custos Fixos / Admin (%)', descricao: 'Percentual de custos fixos e administrativos.' },
          { nome: 'Comissão Vendas (%)', descricao: 'Percentual de comissão sobre vendas.' },
          { nome: 'Margem Lucro Ideal (%)', descricao: 'Percentual de margem de lucro desejada.' },
          { nome: 'Desconto Negociado (%)', descricao: 'Percentual de desconto concedido na negociação.' },
          { nome: 'Tipo de Negócio', descricao: 'Industrialização, Revenda ou Prestação de Serviços.' },
          { nome: 'Tipo de Faturamento', descricao: 'Próprio ou Direto.' }
        ]
      },
      {
        id: 'resultados',
        titulo: 'Campos de Resultado',
        screenshot: 'prints/precificacao/resultados.png',
        campos: [
          { nome: 'Custo Direto Total', descricao: 'Soma de todos os custos diretos do equipamento.' },
          { nome: 'Preço Final (Sem IPI)', descricao: 'Preço final calculado sem o valor do IPI.' },
          { nome: 'Valor do IPI', descricao: 'Valor calculado do IPI sobre o preço.' },
          { nome: 'Total (Com IPI)', descricao: 'Preço final com IPI incluso.' },
          { nome: 'Lucro Líquido', descricao: 'Valor do lucro líquido após todos os custos e impostos.' },
          { nome: 'Margem Real (%)', descricao: 'Percentual real da margem de lucro.' }
        ]
      },
      {
        id: 'impressao-resumo',
        titulo: 'Imprimir Resumo Consolidado',
        screenshot: 'prints/precificacao/impressao-resumo.png',
        texto: 'No Resumo Consolidado da Proposta, o botão "Imprimir" gera uma versão para impressão com:\n\n- KPIs de totais: Custo Total, Venda Total, Lucro Líquido e Margem Média\n- Tabela consolidada com todos os equipamentos/SEUs e seus valores individuais\n- Linha de totais no rodapé da tabela\n- Suporte aos 3 modos de exibição: SEU, Faturamento Direto e Normal\n\nA impressão abre em uma nova janela e dispara automaticamente o diálogo de impressão do navegador.',
        passos: [
          'Navegue até Precificação e selecione a visualização "Consolidado".',
          'Clique no botão "Imprimir" ao lado do título "Resumo Consolidado da Proposta".',
          'Uma nova janela será aberta com a visualização formatada para impressão.',
          'O diálogo de impressão do navegador será exibido automaticamente.',
          'Configure as opções de impressão e clique em "Imprimir".'
        ]
      }
    ]
  },

  materiais: {
    titulo: 'Materiais',
    icone: 'ph-package',
    descricao: 'Banco de dados de componentes com especificações técnicas, preços e impostos.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/materiais/visao-geral.png',
        texto: 'O módulo de Materiais gerencia o banco de dados de componentes elétricos e mecânicos utilizados nos projetos. Cada material possui:\n\n- Códigos internos e do fabricante\n- Categoria, área e descrição técnica\n- Especificações elétricas (tensão, corrente)\n- Preço de custo, markup e preço sugerido\n- Informações fiscais (NCM, ICMS, IPI, PIS, COFINS)\n- Lead time\n\nO módulo também oferece ferramentas de reajuste em massa e importação de preços.'
      },
      {
        id: 'campos-tecnicos',
        titulo: 'Campos — Aba Técnico',
        screenshot: 'prints/materiais/campos-tecnicos.png',
        campos: [
          { nome: 'Código Interno', descricao: 'Código de identificação interno do material.' },
          { nome: 'Código do Fabricante', descricao: 'Código de referência do fabricante para o material.' },
          { nome: 'Fabricante', descricao: 'Nome do fabricante do material. Selecionado da lista de fornecedores.' },
          { nome: 'Categoria', descricao: 'Classificação do material (Disjuntor, Contator, Relé, Cabo, etc.).' },
          { nome: 'Área', descricao: 'Área de aplicação (ex: GERACAO E DISTR. ENERGIA).' },
          { nome: 'Descrição Técnica', descricao: 'Descrição detalhada do material. Campo obrigatório.' },
          { nome: 'Unidade', descricao: 'Unidade de medida: un (unidade), m (metro), kg (quilograma), cj (conjunto).' },
          { nome: 'Peso (kg)', descricao: 'Peso unitário do material em quilogramas.' },
          { nome: 'Tensão (V)', descricao: 'Tensão nominal de operação do material. Ex: 24V, 110V, 220V, 380V.' },
          { nome: 'Corrente (A)', descricao: 'Corrente nominal do material em ampères.' }
        ]
      },
      {
        id: 'campos-comerciais',
        titulo: 'Campos — Aba Comercial',
        screenshot: 'prints/materiais/campos-comerciais.png',
        campos: [
          { nome: 'Custo Unitário (R$)', descricao: 'Preço de custo do material. Campo obrigatório.' },
          { nome: 'Markup Padrão (%)', descricao: 'Percentual de markup padrão aplicado sobre o custo.' },
          { nome: 'Preço Sugerido (R$)', descricao: 'Preço de venda sugerido calculado automaticamente (custo + markup). Campo somente leitura.' },
          { nome: 'Lead Time (dias)', descricao: 'Tempo estimado de entrega do fornecedor em dias.' }
        ]
      },
      {
        id: 'impostos',
        titulo: 'Campos — Aba Fiscal (Impostos)',
        screenshot: 'prints/materiais/impostos.png',
        campos: [
          { nome: 'NCM', descricao: 'Código NCM do material para classificação fiscal. Campo obrigatório.' },
          { nome: 'Origem', descricao: 'Origem do produto: 0 - Nacional, 1 - Importação Direta, 2 - Importado no Mercado.' },
          { nome: 'ICMS (%)', descricao: 'Percentual de ICMS incidente sobre o material.' },
          { nome: 'IPI (%)', descricao: 'Percentual de IPI incidente.' },
          { nome: 'PIS (%)', descricao: 'Percentual de PIS.' },
          { nome: 'COFINS (%)', descricao: 'Percentual de COFINS.' }
        ]
      },
      {
        id: 'reajuste',
        titulo: 'Reajuste em Massa',
        screenshot: 'prints/materiais/reajuste.png',
        texto: 'A funcionalidade de Reajuste em Massa permite atualizar preços de múltiplos materiais simultaneamente.\n\nParâmetros:\n- Fabricante: filtra por fabricante específico\n- Categoria (Família): filtra por categoria\n- Área: filtra por área de aplicação\n- Título do Reajuste: identificação do lote de reajuste\n- Tipo de Ajuste: Percentual (%) ou Valor Fixo (R$)\n- Valor: valor do ajuste (positivo ou negativo)\n- Data de Vigência: data a partir da qual o reajuste é válido'
      },
      {
        id: 'importar-precos',
        titulo: 'Importar Preços',
        screenshot: 'prints/materiais/importar-precos.png',
        texto: 'Permite importar preços em lote via planilha (.xlsx, .xls, .csv).\n\nO sistema detecta automaticamente as colunas da planilha por palavras-chave (Código, Preço, etc.). É possível mapear manualmente as colunas de código e preço antes de confirmar a importação.'
      }
    ]
  },

  paineis: {
    titulo: 'Tipos de Painéis',
    icone: 'ph-rows',
    descricao: 'Catálogo de tipos de painéis elétricos com especificações dimensionais, construtivas e BOM.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/paineis/visao-geral.png',
        texto: 'O módulo de Tipos de Painéis gerencia o catálogo de painéis elétricos padrão da empresa. Cada tipo possui:\n\n- Características construtivas (categoria, forma, execução, instalação)\n- Dimensões (altura, largura, profundidade)\n- Grau de proteção e cor de acabamento\n- Lista de Materiais (BOM) com quantidades\n\nAs categorias disponíveis são: CCM, QGBT, CUB, QDF, QDL, QTA, PLC, BC, REM.'
      },
      {
        id: 'campos',
        titulo: 'Campos do Formulário',
        screenshot: 'prints/paineis/campos.png',
        campos: [
          { nome: 'Tipo (Sigla)', descricao: 'Sigla do tipo de painel gerada automaticamente.' },
          { nome: 'Categoria', descricao: 'Categoria construtiva: CCM, QGBT, CUB, QDF, QDL, QTA, PLC, BC, REM.' },
          { nome: 'Classe Tensão', descricao: 'Classe de tensão: BT690, MT17.5, MT24, MT36.' },
          { nome: 'Forma', descricao: 'Forma de compartimentação: 1, 2B, 3A, 3B, 4A, 4B (apenas BT).' },
          { nome: 'Execução', descricao: 'Tipo de execução: FX (fixa), EX (extraível). Disponível para BT formas 3A-4B.' },
          { nome: 'Instalação', descricao: 'Tipo de instalação: BB (embutir), LN (sobrepor). Disponível para BT.' },
          { nome: 'Grau de Proteção', descricao: 'IP: IP21, IP42, IP54, IP65.' },
          { nome: 'Cor de Acabamento', descricao: 'Cor padrão: RAL 7032, RAL 7035, Munsell N6.5.' },
          { nome: 'Descrição Complementar', descricao: 'Descrição adicional do painel.' },
          { nome: 'Altura (mm)', descricao: 'Altura do painel em milímetros.' },
          { nome: 'Largura (mm)', descricao: 'Largura do painel em milímetros.' },
          { nome: 'Profundidade (mm)', descricao: 'Profundidade do painel em milímetros.' }
        ]
      },
      {
        id: 'bom',
        titulo: 'Lista de Materiais (BOM)',
        screenshot: 'prints/paineis/bom.png',
        texto: 'O painel direito do módulo exibe a BOM (Bill of Materials) do tipo selecionado. É possível:\n\n- Adicionar materiais à BOM através do botão "+ Adicionar"\n- Buscar materiais no banco de dados por descrição, código ou fabricante\n- Definir quantidades por item\n- Remover itens da lista'
      }
    ]
  },

  tipicos: {
    titulo: 'Típicos de Partida',
    icone: 'ph-circuitry',
    descricao: 'Definição de padrões técnicos de partida de motores com BOM associada.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/tipicos/visao-geral.png',
        texto: 'O módulo de Típicos de Partida define os padrões técnicos para partida de motores. Cada típico representa uma configuração padronizada que inclui:\n\n- Parâmetros elétricos (potência, tensão, ICC, frequência, corrente)\n- Tipo de acionamento (inversor, soft-starter, partida direta, etc.)\n- Fabricantes de proteção, drives e comunicação\n- Especificação técnica para o documento Word\n- Lista de Materiais (BOM) associada\n\nOs típicos são usados pelo módulo de Cargas para gerar automaticamente a lista de materiais de cada motor.'
      },
      {
        id: 'campos',
        titulo: 'Campos do Formulário',
        screenshot: 'prints/tipicos/campos.png',
        campos: [
          { nome: 'Nome do Típico', descricao: 'Identificação do típico. Ex: Partida Direta 5CV.' },
          { nome: 'Tipo de Acionamento', descricao: 'Inversor de Frequência, Soft-Starter, Partida Direta, Partida Estrela-Triângulo, etc.' },
          { nome: 'Acionamento', descricao: 'Standard ou Pesado, conforme regime de serviço.' },
          { nome: 'Potência (CV/KW)', descricao: 'Faixa de potência do motor em CV (cavalo-vapor) com equivalência em KW.' },
          { nome: 'Tensão (V)', descricao: 'Tensão de alimentação: 220V, 380V, 440V, 480V, 690V, etc.' },
          { nome: 'ICC (KA)', descricao: 'Capacidade de corrente de curto-circuito.' },
          { nome: 'Frequência (Hz)', descricao: '50Hz ou 60Hz.' },
          { nome: 'Corrente Aproximada (A)', descricao: 'Valor calculado automaticamente. Campo somente leitura.' },
          { nome: 'Corrente de Placa (A)', descricao: 'Corrente nominal conforme placa do motor.' },
          { nome: 'Fator de Potência', descricao: 'Cosseno phi do motor (0.70 a 0.95).' },
          { nome: 'Fator de Serviço', descricao: 'Fator de serviço do motor (1.00 a 1.25).' },
          { nome: 'Rendimento (%)', descricao: 'Rendimento nominal do motor (70% a 95%).' },
          { nome: 'Proteção (Fabricante)', descricao: 'Fabricante do sistema de proteção: ABB, Siemens, WEG, etc.' },
          { nome: 'Drives (Fabricante)', descricao: 'Fabricante do drive/inversor: ABB, Danfoss, Siemens, WEG, etc.' },
          { nome: 'Comunicação', descricao: 'Protocolo de comunicação: Modbus RTU, Profinet, EtherNet/IP, etc.' },
          { nome: 'Especificação Técnica (Word)', descricao: 'Texto descritivo para o documento Word.' }
        ]
      },
      {
        id: 'bom',
        titulo: 'Lista de Materiais (BOM)',
        screenshot: 'prints/tipicos/bom.png',
        texto: 'Assim como no módulo de Painéis, o Típico possui uma BOM que lista os materiais necessários para sua montagem. É possível adicionar materiais do banco de dados com filtros por fabricante, modelo e código.'
      },
      {
        id: 'selecao-materiais',
        titulo: 'Seleção de Materiais',
        screenshot: 'prints/tipicos/selecao-materiais.png',
        texto: 'O seletor de materiais na BOM do Típico conta com otimizações para agilizar a busca:\n\n- Filtro por Fabricante: dropdown no topo do seletor para pré-selecionar o fabricante desejado\n- Busca textual: campo de busca por código, modelo ou descrição do material\n- Limite de 200 resultados por vez, garantindo carregamento rápido mesmo com grande volume de dados\n- Índice pré-carregado: os materiais são organizados internamente por fabricante, eliminando tempo de processamento ao filtrar',
        passos: [
          'Na BOM do típico, clique em "Adicionar Material" para abrir o seletor.',
          'Selecione um fabricante no dropdown para filtrar os materiais disponíveis.',
          'Digite código, modelo ou descrição no campo de busca para refinar.',
          'Clique no material desejado na lista de resultados para adicioná-lo à BOM.'
        ]
      },
      {
        id: 'layout-3-colunas',
        titulo: 'Layout de 3 Colunas',
        screenshot: 'prints/tipicos/layout-3-colunas.png',
        texto: 'O builder de Típicos utiliza um layout de três colunas para organizar as informações:\n\n- Coluna 1 (esquerda): Parâmetros elétricos e campos do formulário do típico\n- Coluna 2 (centro): Especificação técnica e Lista de Materiais (BOM)\n- Coluna 3 (direita): Visualização do documento Word gerado\n\nPara oferecer mais espaço durante a seleção de materiais, a Coluna 1 é automaticamente recolhida ao abrir o seletor de materiais. Enquanto a Coluna 1 está oculta, o cabeçalho do builder exibe o nome do típico e a corrente aproximada como referência visual. Ao fechar o seletor de materiais, a Coluna 1 retorna à posição original automaticamente.'
      }
    ]
  },

  cubiculos: {
    titulo: 'Típicos de Cubículo',
    icone: 'ph-grid-nine',
    descricao: 'Biblioteca de típicos de cubículos de média tensão com BOM e cálculo de custos.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/cubiculos/visao-geral.png',
        texto: 'O módulo Típicos de Cubículo gerencia as especificações técnicas de cubículos de média tensão utilizados em subestações e painéis de distribuição.\n\nCada cubículo é definido por um prefixo que indica seu tipo:\n- CE: Entrada / Entrada de Linha\n- CS: Saída / Saída de Linha\n- CM: Medição / Medição de Faturamento\n- CP: Proteção / Proteção de Transformador\n- CT: Transformação / Transformador de Potencial\n- CPS: Proteção Secundária\n- CAN: Anel / Interligação de Barra\n\nO sistema gera automaticamente a lista de materiais (BOM) para cada cubículo e calcula o custo total com base nos itens cadastrados.'
      },
      {
        id: 'campos',
        titulo: 'Campos do Cubículo',
        screenshot: 'prints/cubiculos/campos.png',
        campos: [
          { nome: 'Nome do Cubículo', descricao: 'Identificação automática baseada no prefixo do tipo (CE, CS, CM, CP, CT, CPS, CAN) + numeração sequencial.' },
          { nome: 'Tipo de Acionamento', descricao: 'Classificação funcional do cubículo na subestação.' },
          { nome: 'Comunicação', descricao: 'Protocolo ou interface de comunicação (se aplicável).' },
          { nome: 'Tensão', descricao: 'Tensão nominal de operação do cubículo.' },
          { nome: 'Corrente Nominal', descricao: 'Corrente nominal de operação do barramento principal.' },
          { nome: 'NBI', descricao: 'Nível Básico de Isolamento — tensão suportável de impulso (kV).' },
          { nome: 'Frequência', descricao: 'Frequência de operação (50 ou 60 Hz).' },
          { nome: 'Instalação', descricao: 'Tipo de instalação: abrigada ou tempo.' },
          { nome: 'Icc (kA)', descricao: 'Corrente de curto-circuito simétrica suportável pelo cubículo.' },
          { nome: 'Proteção', descricao: 'Dispositivo de proteção principal (disjuntor, fusível, etc.).' },
          { nome: 'Relé de Proteção', descricao: 'Modelo e fabricante do relé de proteção associado.' },
          { nome: 'Drives', descricao: 'Acionamentos e dispositivos de manobra motorizados.' },
          { nome: 'Descrição Word', descricao: 'Texto descritivo exportado nos documentos Word.' }
        ]
      },
      {
        id: 'bom',
        titulo: 'Lista de Materiais (BOM)',
        screenshot: 'prints/cubiculos/bom.png',
        texto: 'Cada cubículo possui sua própria lista de materiais (BOM — Bill of Materials), que define os componentes necessários para sua montagem.\n\n- Adicione itens usando o seletor de materiais integrado\n- Os materiais são buscados do banco de dados de Materiais (já cadastrados)\n- Filtre por fabricante e descrição para localizar materiais rapidamente\n- Cada item adicionado contribui para o cálculo automático do custo total do cubículo\n- O custo total aparece na coluna "Custo Ref." da tabela principal\n\nPara adicionar materiais ao cubículo:\n1. No builder, clique em "Adicionar Material"\n2. Use os filtros (fabricante, descrição) para localizar o item\n3. Selecione o material desejado\n4. Confirme a inclusão',
        passos: [
          'Abra o builder de cubículo (criar novo ou editar existente).',
          'Na seção de materiais, clique em "Adicionar Material".',
          'No seletor, filtre por fabricante ou busque pela descrição do item.',
          'Clique no material desejado para selecioná-lo.',
          'Confirme a inclusão — o item será adicionado à BOM do cubículo.',
          'O custo total é recalculado automaticamente a cada alteração.',
          'Salve o cubículo ao finalizar.'
        ]
      }
    ]
  },

  'relatorio-propostas': {
    titulo: 'Relatório de Propostas',
    icone: 'ph-article',
    descricao: 'Relatório avançado com filtros e exportação de propostas técnicas e comerciais.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/relatorio-propostas/visao-geral.png',
        texto: 'O Relatório de Propostas permite visualizar e exportar dados consolidados de todas as propostas. Oferece:\n\n- 13 filtros avançados (período, cliente, status, valor, etc.)\n- 17 seções configuráveis para exibição\n- Exportação para CSV e XLS\n- Visualização em tabela com dados completos'
      },
      {
        id: 'filtros',
        titulo: 'Filtros Disponíveis',
        screenshot: 'prints/relatorio-propostas/filtros.png',
        texto: 'O relatório conta com uma variedade de filtros para refinar a busca: período de criação, cliente, projeto, status, faixa de valor, tipo de proposta (técnica/comercial), PTC, vendedor/consultor, entre outros. Os filtros podem ser combinados entre si.'
      },
      {
        id: 'secoes',
        titulo: 'Seções do Relatório',
        screenshot: 'prints/relatorio-propostas/secoes.png',
        texto: 'É possível ativar ou desativar cada seção do relatório através de checkboxes. As seções incluem:\n\n- Dados cadastrais da proposta\n- Equipamentos\n- Valores e preços\n- Condições comerciais\n- Escopo\n- Observações\n- Histórico de revisões\n- E mais...'
      },
      {
        id: 'exportacao',
        titulo: 'Exportação',
        screenshot: 'prints/relatorio-propostas/exportacao.png',
        texto: 'O relatório pode ser exportado nos formatos:\n\n- CSV: formato de texto separado por vírgulas, compatível com Excel e outros sistemas\n- XLS: formato nativo do Excel (.xlsx)\n\nUse o botão "Exportar ▾" no canto superior direito para selecionar o formato desejado.'
      }
    ]
  },

  'relatorio-cadastros': {
    titulo: 'Relatório de Cadastros',
    icone: 'ph-clipboard-text',
    descricao: 'Relatórios dos dados cadastrais de clientes, fornecedores e materiais.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/relatorio-cadastros/visao-geral.png',
        texto: 'O Relatório de Cadastros permite extrair relatórios completos dos dados mestres do sistema:\n\n- Listagem de clientes com contatos\n- Listagem de fornecedores\n- Listagem de materiais com preços\n\nCada entidade pode ser filtrada individualmente e exportada para CSV ou XLS.'
      }
    ]
  },

  'relatorio-tipicos': {
    titulo: 'Relatório de Típicos',
    icone: 'ph-faders',
    descricao: 'Relatório de típicos de partida, tipos de painéis e cubículos MT cadastrados no sistema.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/relatorio-tipicos/visao-geral.png',
        texto: 'O Relatório de Típicos exibe três categorias selecionáveis no topo:\n\n- Típicos de Partida: parâmetros elétricos e BOM associada\n- Tipos de Painéis: características construtivas de painéis elétricos\n- Tipos de Cubículos MT: parâmetros técnicos de cubículos de média tensão\n\nCada categoria pode ser filtrada individualmente e exportada para CSV ou XLS.'
      }
    ]
  },

  importacao: {
    titulo: 'Importar Dados',
    icone: 'ph-upload-simple',
    descricao: 'Importação de dados em massa via planilhas Excel e CSV.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/importacao/visao-geral.png',
        texto: 'O módulo de Importação permite carregar dados em massa de planilhas Excel (.xlsx, .xls) e arquivos CSV para dentro do sistema.\n\nO sistema detecta automaticamente as colunas da planilha por palavras-chave, facilitando o mapeamento: Descrição, Custo/Preço, Código, Fabricante, Unidade, Categoria, NCM, Área.'
      },
      {
        id: 'uso',
        titulo: 'Como Importar',
        screenshot: 'prints/importacao/uso.png',
        passos: [
          'Clique em "Selecionar Arquivo" e escolha uma planilha .xlsx, .xls ou .csv.',
          'Visualize a prévia dos dados na tabela de preview.',
          'Confira o mapeamento automático das colunas.',
          'Clique em "Processar Importação" para concluir.'
        ]
      }
    ]
  },

  configuracoes: {
    titulo: 'Configurações',
    icone: 'ph-gear',
    descricao: 'Preferências globais, empresas, templates, IA, usuários e segurança do sistema.',
    secoes: [
      {
        id: 'dados-empresa',
        titulo: 'Dados da Empresa',
        screenshot: 'prints/configuracoes/dados-empresa.png',
        texto: 'Configure os dados da empresa que serão utilizados na impressão dos documentos:\n\n- Nome da Empresa\n- CNPJ\n- Endereço Completo\n- E-mail de Contato\n- Regime Tributário (Lucro Real, Lucro Presumido, Simples Nacional)\n- IPI Padrão (%)',
        campos: [
          { nome: 'Nome da Empresa', descricao: 'Nome da empresa para exibição nos documentos.' },
          { nome: 'CNPJ', descricao: 'CNPJ da empresa para documentos fiscais.' },
          { nome: 'Endereço Completo', descricao: 'Endereço da matriz para documentos.' },
          { nome: 'E-mail de Contato', descricao: 'E-mail principal para contato.' },
          { nome: 'Regime Tributário', descricao: 'Regime tributário da empresa: Lucro Real, Lucro Presumido ou Simples Nacional.' },
          { nome: 'IPI Padrão (%)', descricao: 'Alíquota padrão de IPI para novos materiais.' }
        ]
      },
      {
        id: 'empresas',
        titulo: 'Empresas (Templates)',
        screenshot: 'prints/configuracoes/empresas.png',
        texto: 'O GeraPro permite cadastrar múltiplas empresas no sistema. Cada empresa possui seus próprios templates de documentos (.docx), dados cadastrais e usuários isolados — um usuário de uma empresa não vê dados de outra.\n\nFuncionalidades:\n- Adicionar novas empresas com Nome, CNPJ e Sigla\n- Editar dados da empresa (ícone de lápis)\n- Excluir empresa do sistema (ícone de lixeira)\n- A sigla da empresa ativa aparece no badge colorido do cabeçalho\n- O plano de cada empresa é exibido na tabela',
        campos: [
          { nome: 'Nome da Empresa', descricao: 'Razão social ou nome fantasia da empresa.' },
          { nome: 'CNPJ', descricao: 'CNPJ da empresa (com pontuação).' },
          { nome: 'Sigla', descricao: 'Abreviação curta (ex: EMP1, ABC). Aparece no badge do cabeçalho do sistema.' },
          { nome: 'Plano', descricao: 'Plano de assinatura ou classificação interna da empresa.' }
        ]
      },
      {
        id: 'modelos-documentos',
        titulo: 'Modelos de Documentos (Templates)',
        screenshot: 'prints/configuracoes/modelos-documentos.png',
        texto: 'Nesta seção você define quais arquivos .docx o sistema vai usar como modelo (template) na exportação das propostas. Cada empresa pode ter seus próprios templates.\n\nTipos de template:\n- Proposta Técnica: template usado ao exportar uma Proposta Técnica\n- Proposta Comercial: template usado ao exportar uma Proposta Comercial\n- Proposta Completa: template usado ao exportar a Proposta Completa (Técnica + Comercial)\n\nSe nenhum template estiver configurado, o sistema usa o último template enviado para aquela empresa como padrão.',
        passos: [
          'Clique em "Escolher arquivo" ao lado do tipo de template desejado.',
          'Selecione o arquivo .docx no seu computador.',
          'Clique em "Enviar" para fazer upload do arquivo ao servidor.',
          'O template ficará disponível para seleção no dropdown correspondente.',
          'Repita para cada tipo de proposta (Técnica, Comercial, Completa).'
        ]
      },
      {
        id: 'usuarios',
        titulo: 'Gerenciamento de Usuários',
        screenshot: 'prints/configuracoes/usuarios.png',
        texto: 'O sistema oferece autenticação com níveis de acesso:\n\n- Admin: Acesso total a todos os módulos e configurações\n- Engenheiro: Pode criar propostas técnicas e usar módulos de engenharia\n- Vendedor: Pode usar o pipeline e propostas comerciais\n- Visualizador: Apenas consulta, sem edição\n\nO gerenciamento de usuários está disponível na seção "Usuários", onde é possível cadastrar, editar e desativar usuários.',
        passos: [
          'Na tela de Configurações, role até a seção "Usuários".',
          'Clique em "Gerenciar Usuários".',
          'Para adicionar: preencha nome, e-mail, senha e nível de acesso.',
          'Para editar: clique no ícone de lápis ao lado do usuário.',
          'Para desativar: clique no ícone de lixeira (o usuário não é excluído, apenas desativado).'
        ]
      },
      {
        id: 'vendedores',
        titulo: 'Vendedores',
        screenshot: 'prints/configuracoes/vendedores.png',
        texto: 'Cadastre os vendedores da sua empresa. Eles aparecem como opção nos cards da Gestão de Propostas e nas Propostas.',
        campos: [
          { nome: 'Nome', descricao: 'Nome completo do vendedor.' },
          { nome: 'E-mail', descricao: 'E-mail de contato do vendedor.' },
          { nome: 'Telefone', descricao: 'Telefone ou WhatsApp do vendedor.' }
        ]
      },
      {
        id: 'ia',
        titulo: 'Inteligência Artificial',
        screenshot: 'prints/configuracoes/ia.png',
        texto: 'Configure o provedor de IA usado para extração automática de dados de documentos (PDF, DOCX, XLSX) na Proposta Técnica.\n\nProvedores disponíveis:\n\n- Ollama (IA Local): gratuito, processa tudo localmente. Seus documentos nunca saem do computador. Recomendado para dados confidenciais.\n- OpenAI (API Paga): usa modelos como GPT-4o e GPT-4o-mini. Requer chave de API. Mais rápido e preciso, mas documentos são enviados pela internet.',
        passos: [
          'Acesse Configurações > Inteligência Artificial.',
          'Selecione o provedor: Ollama (local, gratuito) ou OpenAI (API paga).',
          'Para OpenAI: insira a API key, escolha o modelo (GPT-4o mini recomendado para custo-benefício).',
          'Para Ollama: escolha o modelo e verifique a URL (padrão: http://localhost:11434).',
          'Clique em "Testar Conexão" para verificar se o provedor está acessível.',
          'Clique em "Salvar Configurações" para aplicar.'
        ],
        campos: [
          { nome: 'Provedor', descricao: 'Ollama (IA local gratuita) ou OpenAI (API paga via GPT-4o/GPT-4o-mini).' },
          { nome: 'API Key', descricao: 'Chave da API OpenAI (formato sk-...). Salva apenas no servidor local.' },
          { nome: 'Modelo', descricao: 'Modelo GPT a ser usado. GPT-4o mini: rápido e econômico. GPT-4o: mais preciso. GPT-4.1: última geração.' },
          { nome: 'URL do Ollama', descricao: 'Endereço do servidor Ollama. Padrão: http://localhost:11434.' }
        ]
      },
      {
        id: 'telegram',
        titulo: 'Telegram (Notificações)',
        screenshot: 'prints/configuracoes/telegram.png',
        texto: 'O sistema pode enviar notificações via Telegram sobre ações da Gestão de Propostas. As notificações são enviadas apenas para usuários Admin ou Engenheiro que tenham Chat ID preenchido.\n\nPara criar um bot:\n1. Abra o Telegram e procure por @BotFather\n2. Envie /newbot e siga as instruções\n3. Copie o token fornecido para o GeraPro',
        passos: [
          'Crie um bot no Telegram via @BotFather e obtenha o token.',
          'No GeraPro, vá em Configurações > Telegram.',
          'Insira o Token do Bot no campo correspondente.',
          'Preencha o Chat ID de cada usuário que deve receber notificações.',
          'Clique em "Salvar Configurações do Telegram".',
          'Use "Testar" para enviar uma mensagem de teste.'
        ],
        campos: [
          { nome: 'Token do Bot', descricao: 'Token fornecido pelo @BotFather no Telegram.' },
          { nome: 'Chat ID', descricao: 'ID numérico do chat do usuário. Use @userinfobot para obter.' }
        ]
      },
      {
        id: 'personalizacao-login',
        titulo: 'Personalização da Tela de Login',
        screenshot: 'prints/configuracoes/personalizacao-login.png',
        texto: 'Personalize a aparência da tela de login do sistema:\n\n- Logo da empresa (upload de imagem)\n- Nome e subtítulo exibidos\n- Cor do título\n- Tipo de fundo: gradiente, cor sólida ou imagem\n- Cores do cartão de login, borda, texto, campos e botão\n\nUse "Salvar Personalização" para aplicar as alterações. A tela de login muda imediatamente.',
        passos: [
          'Na tela de Configurações, vá até "Personalização da Tela de Login".',
          'Faça upload de uma logo (opcional).',
          'Defina nome, subtítulo e cores conforme desejado.',
          'Escolha o tipo de fundo e configure as cores ou imagem.',
          'Clique em "Salvar Personalização" para aplicar.'
        ]
      },
      {
        id: 'mao-de-obra',
        titulo: 'Tabela de Custos de Mão de Obra',
        screenshot: 'prints/configuracoes/mao-de-obra.png',
        texto: 'Define o valor por hora (R$/h) de cada função profissional. Esses valores são usados na Proposta Técnica para calcular automaticamente o custo de mão de obra dos equipamentos.\n\nA tabela vem preenchida com cerca de 24 funções em 7 grupos:\n- Montagem Mecânica, Montagem Elétrica, Solda, Caldeiraria, Pintura, Engenharia, Administrativo\n\nSe não preencher, o sistema usa valores padrão programados.'
      },
      {
        id: 'seguranca',
        titulo: 'Segurança e Backup',
        screenshot: 'prints/configuracoes/seguranca.png',
        texto: 'Ferramentas de segurança e manutenção dos dados:\n\n- Baixar Backup JSON: Exporta todos os dados do sistema para um arquivo JSON.\n- Restaurar Backup: Importa um backup JSON previamente exportado. Atenção: substitui todos os dados atuais.\n- Resetar Fábrica: Apaga completamente todos os dados do sistema (requer confirmação).\n- Carregar Dados de Exemplo: Popula o banco com dados de demonstração.'
      }
    ]
  },

  // === MÓDULOS ADICIONAIS (acessíveis via sub-navegação ou F1) ===

  cargas: {
    titulo: 'Lista de Cargas',
    icone: 'ph-lightning',
    descricao: 'Cadastro de cargas elétricas (motores e feeders) com associação de típicos de partida.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/cargas/visao-geral.png',
        texto: 'O módulo de Cargas permite cadastrar os motores e cargas elétricas do projeto. Cada carga possui:\n\n- TAG de identificação (ex: M-101)\n- Descrição do equipamento\n- Potência (CV) e Tensão (V)\n- Típico de Partida associado (Inversor, Soft-Starter, Partida Direta, etc.)\n\nAo associar um típico, o sistema automaticamente gera a lista de materiais necessários para aquela partida (disjuntores, contatores, relés, etc.), com base nos típicos cadastrados no módulo de Engenharia.\n\nA lista de cargas é a base para a geração automática da Lista de Materiais (BOM) e para os cálculos elétricos do projeto.'
      },
      {
        id: 'cadastro',
        titulo: 'Como Cadastrar Cargas',
        screenshot: 'prints/cargas/cadastro.png',
        passos: [
          'Acesse o módulo de Cargas (normalmente via sub-navegação da Proposta Técnica).',
          'Clique no botão para adicionar uma nova carga.',
          'Preencha o TAG (ex: M-101, B-01).',
          'Informe a descrição (ex: "Bomba de circulação").',
          'Selecione a tensão (220V, 380V, 440V, 480V).',
          'Digite a potência em CV (ex: 5, 10, 75).',
          'Escolha o Típico de Partida associado. Os materiais do típico serão automaticamente vinculados à carga.',
          'Salve. A carga aparecerá na tabela com o típico e a contagem de itens.'
        ],
        campos: [
          { nome: 'TAG', descricao: 'Identificação única da carga. Ex: M-101, B-01, F-01. Campo obrigatório.' },
          { nome: 'Tensão', descricao: 'Tensão de alimentação: 220V, 380V, 440V ou 480V.' },
          { nome: 'Descrição', descricao: 'Descrição do equipamento. Ex: Bomba de circulação, Exaustor, Compressor.' },
          { nome: 'Potência', descricao: 'Potência do motor em CV (cavalos-vapor). Ex: 5, 10, 75.' },
          { nome: 'Típico de Partida', descricao: 'Selecione o típico cadastrado. Define automaticamente os materiais da partida.' }
        ]
      }
    ]
  },

  orcamentos: {
    titulo: 'Orçamentos',
    icone: 'ph-briefcase',
    descricao: 'Propostas comerciais com itens, markup, impostos e condições de pagamento.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/orcamentos/visao-geral.png',
        texto: 'O módulo de Orçamentos gerencia propostas comerciais com:\n\n- Cliente e projeto vinculados\n- Itens de fornecimento com preço unitário\n- Cálculo automático de subtotal, markup e impostos\n- Condições comerciais (pagamento, prazo, validade)\n- Status da proposta (Em Aberto, Em Elaboração, Enviado, Aprovado, Perdido)\n- Filtros por cliente, número e status\n- Impressão da proposta\n\nOs itens do orçamento são automaticamente integrados ao Gestão de Propostas conforme o status.'
      },
      {
        id: 'campos',
        titulo: 'Campos do Formulário',
        screenshot: 'prints/orcamentos/campos.png',
        campos: [
          { nome: 'Cliente', descricao: 'Selecione o cliente da lista de clientes cadastrados.' },
          { nome: 'Obra / Projeto', descricao: 'Nome do projeto ou obra.' },
          { nome: 'Itens', descricao: 'Adicione itens com descrição, quantidade e preço unitário. Os totais são calculados automaticamente.' },
          { nome: 'Subtotal', descricao: 'Soma dos valores dos itens. Calculado automaticamente.' },
          { nome: 'Markup (%)', descricao: 'Percentual de markup sobre o subtotal.' },
          { nome: 'Imposto (%)', descricao: 'Percentual de imposto aplicado.' },
          { nome: 'Total', descricao: 'Valor final calculado: subtotal + markup + imposto.' },
          { nome: 'Condição de Pagamento', descricao: 'Ex: 30 dias, à vista, entrada + parcelas.' },
          { nome: 'Prazo de Entrega', descricao: 'Prazo estimado para entrega do fornecimento.' },
          { nome: 'Validade', descricao: 'Prazo de validade da proposta comercial.' },
          { nome: 'NCM / Imposto', descricao: 'Código NCM e informações fiscais.' },
          { nome: 'Transporte', descricao: 'Condições de frete (CIF, FOB, etc.).' },
          { nome: 'Despesas', descricao: 'Descrição das despesas inclusas ou não.' },
          { nome: 'Status', descricao: 'Em Aberto, Em Elaboração, Enviado, Aprovado ou Perdido.' }
        ]
      }
    ]
  },

  composicoes: {
    titulo: 'Composições de Mão de Obra',
    icone: 'ph-clipboard-text',
    descricao: 'Catálogo de atividades padronizadas com coeficientes de horas-homem (HH) para quantificação de mão de obra.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/composicoes/visao-geral.png',
        texto: 'As Composições de Mão de Obra são a base para a quantificação automatizada de horas nos equipamentos da Proposta Técnica. Cada composição representa uma atividade padronizada (ex: "Montagem de estrutura metálica", "Lançamento de cabos de potência") com um coeficiente de horas-homem (HH).\n\nAs composições estão organizadas por grupos: Estrutura, Elétrica, Testes, Automação, Projeto, Pintura e Expedição. Cada grupo possui uma área de alocação (Montagem ou Engenharia) e uma categoria profissional associada.\n\nO sistema já vem com 50 composições pré-carregadas que cobrem as atividades mais comuns em painéis elétricos.'
      },
      {
        id: 'campos',
        titulo: 'Campos do Cadastro',
        screenshot: 'prints/composicoes/campos.png',
        campos: [
          { nome: 'Código', descricao: 'Código alfanumérico único da composição. Ex: C001, C002.' },
          { nome: 'Atividade', descricao: 'Descrição detalhada da atividade. Ex: Montagem de barramento de cobre.' },
          { nome: 'Unidade', descricao: 'Unidade de medida: un (unidade), m (metro), h (hora), ponto.' },
          { nome: 'Grupo', descricao: 'Classificação da atividade: Estrutura, Elétrica, Testes, Automação, Projeto, Pintura, Expedição.' },
          { nome: 'Categoria Profissional', descricao: 'Profissional responsável: Montador, Eletricista, Técnico, Engenheiro, Projetista.' },
          { nome: 'Coeficiente HH', descricao: 'Horas-homem por unidade. Ex: 4.0 significa 4 horas por unidade.' },
          { nome: 'Área de Alocação', descricao: 'Área de custo: Montagem (fábrica/campo) ou Engenharia (projeto).' }
        ]
      },
      {
        id: 'importacao',
        titulo: 'Importação em Massa',
        screenshot: 'prints/composicoes/importacao.png',
        texto: 'É possível importar composições em lote via arquivos CSV ou Excel (.xlsx). O sistema detecta automaticamente as colunas pelo cabeçalho da planilha. Colunas esperadas: codigo, atividade, unidade, grupo, categoria_profissional, coeficiente_hh, area_alocacao.',
        passos: [
          'Acesse o módulo Composições no menu Engenharia.',
          'Clique em "Importar CSV/Excel".',
          'Selecione o arquivo ou arraste para a área de upload.',
          'Visualize a prévia dos dados na tabela.',
          'Clique em "Confirmar Importação" para concluir.'
        ]
      }
    ]
  },

  'regras-derivacao': {
    titulo: 'Regras de Derivação',
    icone: 'ph-git-branch',
    descricao: 'Regras condicionais que associam parâmetros dos equipamentos a composições de mão de obra para cálculo automático de horas.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/regras-derivacao/visao-geral.png',
        texto: 'As Regras de Derivação são o motor lógico da automação de mão de obra. Cada regra define:\n\n- **Tipo de equipamento** a que se aplica (CCM-BT, QGBT, PLC ou * para todos)\n- **Condições** que o equipamento deve atender (ex: correnteNominal > 0)\n- **Ações** que geram composições com quantidades calculadas dinamicamente\n\nQuando o botão "Estimar M.O." é acionado em um equipamento, o sistema percorre todas as regras ativas em ordem de prioridade, avalia as condições e executa as ações compatíveis.\n\nO sistema já vem com 14 regras pré-carregadas que cobrem os cenários mais comuns.'
      },
      {
        id: 'estrutura',
        titulo: 'Estrutura da Regra',
        screenshot: 'prints/regras-derivacao/estrutura.png',
        campos: [
          { nome: 'Nome', descricao: 'Nome descritivo da regra. Ex: Barramento CCM BT.' },
          { nome: 'Tipo de Equipamento', descricao: 'Tipo de equipamento alvo: CCM-BT, QGBT, CUB-MT, PLC, ou * para todos os tipos.' },
          { nome: 'Prioridade', descricao: 'Ordem de execução (menor número = executada primeiro).' },
          { nome: 'Ativa', descricao: 'Toggle para ativar/desativar a regra sem precisar excluí-la.' },
          { nome: 'Condições', descricao: 'Lista de condições lógicas. Todas devem ser verdadeiras para a regra ser aplicada. Operadores: ==, !=, >, >=, <, <=, existe.' },
          { nome: 'Ações', descricao: 'Lista de composições a serem geradas com a quantidade calculada. A quantidade pode ser um número fixo ou uma expressão dinâmica.' }
        ]
      },
      {
        id: 'expressoes',
        titulo: 'Expressões Dinâmicas',
        screenshot: 'prints/regras-derivacao/expressoes.png',
        texto: 'A quantidade de cada ação pode ser calculada dinamicamente usando expressões que referenciam campos do equipamento. Sintaxe: `{nomeDoCampo}`.\n\nExemplos:\n- `{correnteNominal}/100` → divide a corrente nominal por 100\n- `{num_disjuntores}` → usa o número de disjuntores diretamente\n- `{cargas.length}*5` → multiplica o número de cargas por 5\n\nCampos disponíveis: correnteNominal, num_disjuntores, cargas.length, tensao, icc, ip, tipo, tag, protocolo, forma, instalacao.'
      },
      {
        id: 'testar',
        titulo: 'Testar Regra',
        screenshot: 'prints/regras-derivacao/testar.png',
        texto: 'O botão "Testar" na barra de ferramentas permite simular uma regra contra dados de um equipamento real da proposta ativa. O sistema exibe um preview das condições avaliadas (verde = verdadeiro, vermelho = falso) e o resultado das ações com as quantidades calculadas.',
        passos: [
          'Acesse o módulo Regras de Derivação no menu Engenharia.',
          'Clique no botão "Testar" na regra desejada.',
          'Selecione um equipamento da proposta ativa.',
          'Visualize as condições sendo validadas em tempo real.',
          'Confira as composições geradas com as quantidades calculadas.'
        ]
      }
    ]
  },

  'mao-de-obra': {
    titulo: 'Mão de Obra',
    icone: 'ph-hard-hat',
    descricao: 'Visão consolidada das horas de mão de obra estimadas por equipamento da proposta.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        texto: 'O módulo de Mão de Obra exibe de forma consolidada as horas estimadas de mão de obra para todos os equipamentos da proposta ativa.\n\nA tabela principal lista cada equipamento com:\n- Nome e TAG do equipamento\n- Quantidade de itens (funções) cadastrados\n- Total de horas estimadas\n\nAbaixo, o detalhamento por composição mostra quais atividades foram geradas pelo motor de automação (Composições + Regras de Derivação).\n\nOs totais financeiros são consolidados no rodapé: Total Engenharia, Total Montagem e Total Geral.\n\n> **Importante:** Este módulo é apenas para visualização. A edição manual das horas e custos é feita diretamente na Proposta Técnica, na sub-aba "Mão de Obra" de cada equipamento.'
      },
      {
        id: 'estimativa-automatica',
        titulo: 'Estimativa Automática com Composições',
        texto: 'O cálculo automático de mão de obra é feito através de Composições e Regras de Derivação.\n\nDuas formas de estimar horas automaticamente:\n\n1. **Por equipamento**: Na sub-tab "Mão de Obra" do equipamento na Proposta Técnica, clique em "Estimar" para calcular as horas com base nas regras ativas.\n\n2. **Em lote**: Na barra lateral de equipamentos, clique em "Estimar M.O. Todos Equip." para processar todos os equipamentos da proposta de uma só vez.\n\nApós estimar, os resultados aparecem neste módulo (menu Engenharia → Mão de Obra) como um consolidado "Agregado por Equipamento". As horas estimadas são automaticamente consideradas no cálculo de custos do módulo Precificação.',
        passos: [
          'Abra a Proposta Técnica e acesse o equipamento desejado.',
          'Na sub-tab "Mão de Obra", clique em "Estimar".',
          'Ou use "Estimar M.O. Todos Equip." na sidebar para processar todos.',
          'Acesse o módulo Mão de Obra no menu Engenharia.',
          'Visualize o consolidado dos equipamentos.',
          'Confira os custos atualizados no módulo Precificação.'
        ]
      }
    ]
  },

  despesas: {
    titulo: 'Despesas',
    icone: 'ph-receipt',
    descricao: 'Estimativa de despesas de projeto, logística, viagens e impostos por item.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/despesas/visao-geral.png',
        texto: 'O módulo de Despesas permite estimar os custos logísticos e operacionais do projeto. Vem pré-carregado com 29 itens padrão que cobrem:\n\n- Representação e comissões\n- Alimentação e hospedagem\n- Locação de veículos e passagens aéreas\n- ART, uniformes e EPIs\n- Táxi, estacionamento e internet\n- Plataformas, containers e ferramentas\n- Andaimes e frete\n- Embalagem de exportação e desembaraço aduaneiro\n\nCada item possui campos de PIS, COFINS e ISS para cálculo fiscal preciso. O total geral é recalculado automaticamente.'
      },
      {
        id: 'itens',
        titulo: 'Itens e Campos',
        screenshot: 'prints/despesas/itens.png',
        passos: [
          'Revise os itens padrão e ajuste as quantidades e custos unitários conforme o projeto.',
          'Adicione novas linhas com o botão "Nova Linha" para despesas específicas.',
          'Clique em "Restaurar Padrões" para recarregar a lista padrão (apaga alterações).',
          'Os totais são recalculados automaticamente ao alterar quantidade ou custo unitário.',
          'Clique em "Salvar e Aplicar" para persistir.'
        ],
        campos: [
          { nome: 'Descrição da Despesa', descricao: 'Nome da despesa. Ex: Alimentação, Hotel, Passagem Aérea.' },
          { nome: 'Qtd', descricao: 'Quantidade de unidades da despesa.' },
          { nome: 'Custo Unitário (R$)', descricao: 'Preço unitário da despesa.' },
          { nome: 'PIS (%)', descricao: 'Percentual de PIS incidente. Editável por item.' },
          { nome: 'COFINS (%)', descricao: 'Percentual de COFINS incidente. Editável por item.' },
          { nome: 'ISS (%)', descricao: 'Percentual de ISS incidente. Editável por item.' },
          { nome: 'Total Bruto', descricao: 'Qtd × Custo Unitário. Calculado automaticamente.' }
        ]
      }
    ]
  },

  'calculos-eletricos': {
    titulo: 'Cálculos Elétricos',
    icone: 'ph-flash',
    descricao: 'Dimensionamento elétrico — potência, corrente, disjuntor geral por painel.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/calculos-eletricos/visao-geral.png',
        texto: 'O módulo de Cálculos Elétricos analisa as cargas associadas a cada painel e calcula automaticamente:\n\n- Potência Total (CV): soma da potência de todos os motores do painel\n- Corrente Total (A): soma das correntes de todas as cargas\n- Corrente Nominal: corrente padronizada conforme faixas comerciais (100A a 6300A)\n- Disjuntor Geral Sugerido: especificação completa incluindo corrente e ICC (ex: Disj. 400A / 50kA — 3 polos)\n\nA navegação é feita por abas: cada painel (TAG) do projeto tem sua própria aba com os cálculos individualizados.\n\nO disjuntor sugerido leva em conta a corrente de curto-circuito (ICC) definida na Proposta Técnica.'
      },
      {
        id: 'disjuntor',
        titulo: 'Sugestão de Disjuntor',
        screenshot: 'prints/calculos-eletricos/disjuntor.png',
        texto: 'A sugestão do disjuntor geral é baseada em:\n\n1. Corrente total das cargas → seleciona a faixa de corrente padronizada imediatamente superior (100A, 125A, 160A, 200A, 250A, 300A, 350A, 400A, 500A, 630A, 800A, 1000A, 1250A, 1600A, 2000A, 2500A, 3200A, 4000A, 5000A, 6300A)\n2. ICC do painel → utiliza o valor de curto-circuito da especificação técnica (ex: 25kA, 50kA, 65kA)\n3. O resultado é exibido no formato: "Disj. XXXA / YYkA — 3 polos"'
      }
    ]
  },

  'calculos-mecanicos': {
    titulo: 'Cálculos Mecânicos',
    icone: 'ph-ruler',
    descricao: 'Dimensionamento de invólucros — dimensões totais e estimativa de barramento de cobre.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/calculos-mecanicos/visao-geral.png',
        texto: 'O módulo de Cálculos Mecânicos estima as dimensões e o peso do barramento para cada painel do projeto.\n\n- Dimensões Totais (L × A × P): largura, altura e profundidade em mm, calculadas a partir dos invólucros (chaparia) associados a cada painel\n- Barramento de Cobre (kg): peso estimado do barramento de cobre com base na corrente total do painel\n\nA navegação é feita por abas, uma para cada painel (TAG). Os dados são extraídos automaticamente da Proposta Técnica ativa.\n\nCertifique-se de que as cargas e a chaparia estejam corretamente associadas aos equipamentos na Proposta Técnica para obter cálculos precisos.'
      }
    ]
  },

  lm: {
    titulo: 'Lista de Materiais (BOM)',
    icone: 'ph-list-dashes',
    descricao: 'Lista de materiais detalhada por carga, com totais e exportação para Excel.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/lm/visao-geral.png',
        texto: 'O módulo de Lista de Materiais (BOM - Bill of Materials) gera a relação completa de componentes para todas as cargas do projeto, organizada por TAG.\n\nCada grupo (carga) exibe:\n- TAG da carga em destaque\n- Nome do típico de partida associado\n- Descrição da carga\n- Subtotal de materiais daquele grupo\n- Tabela detalhada com: quantidade, descrição, modelo, código do fabricante, fabricante, preço unitário e total\n\nA lista é gerada automaticamente a partir das cargas cadastradas e seus típicos associados. Se um típico for removido, a carga exibe um alerta.'
      },
      {
        id: 'exportacao',
        titulo: 'Exportação',
        screenshot: 'prints/lm/exportacao.png',
        passos: [
          'Verifique se todas as cargas possuem típicos válidos associados.',
          'Na tela da Lista de Materiais, clique em "Exportar Excel".',
          'O arquivo .xlsx será gerado e baixado automaticamente.',
          'O nome do arquivo segue o padrão: BOM_PTC-XXXX.xlsx (inclui o número da PTC).'
        ],
        texto: 'A exportação gera uma planilha Excel (.xlsx) com todos os materiais agrupados por carga. O arquivo é gerado pelo servidor e baixado automaticamente pelo navegador.'
      }
    ]
  },

  importacaoET: {
    titulo: 'Importação por IA',
    icone: 'ph-robot',
    descricao: 'Extração automática de dados de documentos (PDF, DOCX, XLSX) usando Inteligência Artificial.',
    secoes: [
      {
        id: 'visao-geral',
        titulo: 'Visão Geral',
        screenshot: 'prints/importacaoET/visao-geral.png',
        texto: 'O módulo de Importação por IA utiliza Inteligência Artificial para extrair automaticamente dados técnicos de documentos de especificação (PDF, Word, Excel).\n\nBasta fazer upload do arquivo — o sistema:\n1. Extrai o texto do documento\n2. Envia para o provedor de IA configurado\n3. A IA identifica: dados do cliente/projeto, equipamentos (TAG, tipo, tensão, ICC, IP), cargas (motores com CV e tipo de partida), normas técnicas e vendor list\n4. Exibe uma pré-visualização com abas para cada categoria de dados\n5. Permite aplicar tudo ou selecionar apenas as seções desejadas na Proposta Técnica\n\nO provedor de IA é configurado em Configurações > Inteligência Artificial (Ollama local ou OpenAI).'
      },
      {
        id: 'como-usar',
        titulo: 'Como Usar',
        screenshot: 'prints/importacaoET/como-usar.png',
        passos: [
          'Abra uma Proposta Técnica (nova ou existente).',
          'Clique no botão "Importar de Documento (IA)" — disponível na barra de ferramentas da proposta.',
          'Arraste o arquivo (PDF, DOCX ou XLSX) para a área de upload ou clique para selecionar.',
          'Aguarde a análise (pode levar de 1 a 8 minutos na primeira vez).',
          'Revise os dados extraídos nas abas: Dados Gerais, Equipamentos, Cargas, Normas, Vendor List.',
          'Marque/desmarque as seções que deseja aplicar usando os checkboxes.',
          'Clique em "Aplicar Selecionados" ou "Aplicar Tudo" para preencher a proposta.',
          'Se houver erro, verifique as configurações de IA em Configurações ou tente novamente.'
        ]
      },
      {
        id: 'formatos',
        titulo: 'Formatos Suportados e Limitações',
        screenshot: 'prints/importacaoET/formatos.png',
        texto: 'Formatos aceitos:\n- PDF (.pdf): extrai texto via pdf-parse\n- Word (.docx): extrai texto via mammoth\n- Excel (.xlsx, .xls, .csv): extrai dados de todas as planilhas\n\nLimitações:\n- Tamanho máximo: 10 MB\n- Documentos scaneados (imagem) podem não ter texto extraível\n- A IA analisa até 12.000 caracteres do documento\n- Para melhores resultados, use documentos com texto selecionável (não digitalizados)\n- Tabelas muito complexas podem ter extração parcial\n- A qualidade da extração depende da clareza do documento original'
      }
    ]
  }

};

window.AJUDA_CATEGORIAS = [
  { label: 'Principal', modules: ['dashboard'] },
  { label: 'Cadastros', modules: ['clientes', 'fornecedores'] },
  { label: 'Comercial', modules: ['proposta-tecnica', 'proposta-comercial', 'proposta-completa', 'pipeline-comercial', 'precificacao', 'orcamentos', 'importacaoET'] },
  { label: 'Engenharia', modules: ['materiais', 'paineis', 'tipicos', 'cubiculos', 'cargas', 'composicoes', 'regras-derivacao', 'mao-de-obra', 'despesas', 'calculos-eletricos', 'calculos-mecanicos', 'lm'] },
  { label: 'Relatórios', modules: ['relatorio-propostas', 'relatorio-cadastros', 'relatorio-tipicos'] },
  { label: 'Configurações', modules: ['importacao', 'configuracoes'] }
];
