-- Schema PostgreSQL gerado do SQLite (GeraPro) — ferramenta da migração (Fase 1+)
-- Gerado por: tools/migracao-postgres/traduzir-e-aplicar.js
-- Tabelas: 60 | FKs: 5 | Índices: 53

-- ========== FASE 1: tabelas (sem FK) ==========
CREATE TABLE "ai_settings" (
  "empresa_id" TEXT PRIMARY KEY DEFAULT 'default',
  "provider" TEXT DEFAULT 'ollama',
  "model" TEXT DEFAULT 'qwen2.5:14b',
  "api_key" TEXT DEFAULT '',
  "ollama_url" TEXT DEFAULT 'http://localhost:11434',
  "updatedAt" TEXT,
  "timeout_minutes" BIGINT DEFAULT 10,
  "use_cache" BIGINT DEFAULT 1
);
CREATE TABLE "cargas" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "tag" TEXT,
  "descricao" TEXT,
  "potencia" TEXT,
  "tensao" TEXT,
  "typicalId" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);
CREATE TABLE "chaparia_lists" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "name" TEXT,
  "items" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "fabricante" TEXT DEFAULT '',
  "descricao" TEXT DEFAULT '',
  "largura_mm" DOUBLE PRECISION DEFAULT 0,
  "altura_mm" DOUBLE PRECISION DEFAULT 0,
  "profundidade_mm" DOUBLE PRECISION DEFAULT 0
);
CREATE TABLE "clientes" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "razaoSocial" TEXT,
  "nomeFantasia" TEXT,
  "cnpj" TEXT,
  "segmento" TEXT,
  "cnae" TEXT,
  "inscricaoEstadual" TEXT,
  "inscricaoMunicipal" TEXT,
  "cep" TEXT,
  "logradouro" TEXT,
  "numero" TEXT,
  "bairro" TEXT,
  "cidade" TEXT,
  "estado" TEXT,
  "contatoNome" TEXT,
  "contatoCargo" TEXT,
  "email" TEXT,
  "telefone" TEXT,
  "logo" TEXT DEFAULT '',
  "observacoes" TEXT,
  "contatos" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "codigo_cliente" TEXT DEFAULT ''
);
CREATE TABLE "comparison_results" (
  "id" TEXT PRIMARY KEY,
  "session_id" TEXT NOT NULL,
  "descricao" TEXT,
  "unidade" TEXT DEFAULT 'un',
  "qtd_documento" DOUBLE PRECISION DEFAULT 0,
  "qtd_levantamento" DOUBLE PRECISION DEFAULT 0,
  "diferenca" DOUBLE PRECISION DEFAULT 0,
  "percentual" DOUBLE PRECISION DEFAULT 0,
  "status" TEXT DEFAULT 'ok',
  "matched" BIGINT DEFAULT 1,
  "item_a_json" TEXT,
  "item_b_json" TEXT
);
CREATE TABLE "comparison_sessions" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "proposal_id" TEXT,
  "nome" TEXT DEFAULT 'Comparação',
  "created_at" TEXT,
  "updated_at" TEXT,
  "documentos_json" TEXT,
  "status" TEXT DEFAULT 'draft'
);
CREATE TABLE "composicoes" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "codigo" TEXT,
  "atividade" TEXT NOT NULL,
  "unidade" TEXT NOT NULL,
  "grupo" TEXT,
  "categoria_profissional" TEXT,
  "coeficiente_hh" DOUBLE PRECISION DEFAULT 0,
  "fator_simples" DOUBLE PRECISION DEFAULT 0.8,
  "fator_medio" DOUBLE PRECISION DEFAULT 1.0,
  "fator_complexo" DOUBLE PRECISION DEFAULT 1.3,
  "area_alocacao" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "compras_cotacao_itens" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "cotacao_id" TEXT DEFAULT '',
  "requisicao_item_id" TEXT DEFAULT '',
  "material_id" TEXT DEFAULT '',
  "qtd" DOUBLE PRECISION DEFAULT 0,
  "custo_unitario" DOUBLE PRECISION DEFAULT 0,
  "ipi" DOUBLE PRECISION DEFAULT 0,
  "icms" DOUBLE PRECISION DEFAULT 0,
  "desconto" DOUBLE PRECISION DEFAULT 0,
  "prazo_entrega" TEXT DEFAULT '',
  "total" DOUBLE PRECISION DEFAULT 0,
  "vencedor" BIGINT DEFAULT 0,
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "compras_cotacoes" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "requisicao_id" TEXT DEFAULT '',
  "fornecedor_id" TEXT DEFAULT '',
  "numero" TEXT DEFAULT '',
  "data_solicitacao" TEXT DEFAULT '',
  "data_resposta" TEXT DEFAULT '',
  "status" TEXT DEFAULT 'aberta',
  "prazo_entrega" TEXT DEFAULT '',
  "condicao_pagamento" TEXT DEFAULT '',
  "validade_proposta" TEXT DEFAULT '',
  "frete" DOUBLE PRECISION DEFAULT 0,
  "total" DOUBLE PRECISION DEFAULT 0,
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "compras_nota_itens" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nota_id" TEXT DEFAULT '',
  "pedido_item_id" TEXT DEFAULT '',
  "material_id" TEXT DEFAULT '',
  "codigo" TEXT DEFAULT '',
  "descricao" TEXT DEFAULT '',
  "unidade" TEXT DEFAULT '',
  "qtd_recebida" DOUBLE PRECISION DEFAULT 0,
  "custo_unitario" DOUBLE PRECISION DEFAULT 0,
  "lote" TEXT DEFAULT '',
  "data_validade" TEXT DEFAULT '',
  "total" DOUBLE PRECISION DEFAULT 0,
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "compras_notas" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "pedido_id" TEXT DEFAULT '',
  "fornecedor_id" TEXT DEFAULT '',
  "numero" TEXT DEFAULT '',
  "serie" TEXT DEFAULT '',
  "chave_acesso" TEXT DEFAULT '',
  "data_emissao" TEXT DEFAULT '',
  "data_recebimento" TEXT DEFAULT '',
  "data_entrada" TEXT DEFAULT '',
  "valor_produtos" DOUBLE PRECISION DEFAULT 0,
  "valor_frete" DOUBLE PRECISION DEFAULT 0,
  "valor_desconto" DOUBLE PRECISION DEFAULT 0,
  "valor_total" DOUBLE PRECISION DEFAULT 0,
  "icms" DOUBLE PRECISION DEFAULT 0,
  "ipi" DOUBLE PRECISION DEFAULT 0,
  "pis" DOUBLE PRECISION DEFAULT 0,
  "cofins" DOUBLE PRECISION DEFAULT 0,
  "transportadora" TEXT DEFAULT '',
  "volumes" DOUBLE PRECISION DEFAULT 0,
  "conferida" BIGINT DEFAULT 0,
  "conferida_por" TEXT DEFAULT '',
  "conferida_em" TEXT DEFAULT '',
  "status" TEXT DEFAULT 'recebida',
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "compras_pedido_itens" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "pedido_id" TEXT DEFAULT '',
  "requisicao_item_id" TEXT DEFAULT '',
  "cotacao_item_id" TEXT DEFAULT '',
  "material_id" TEXT DEFAULT '',
  "codigo" TEXT DEFAULT '',
  "descricao" TEXT DEFAULT '',
  "fabricante" TEXT DEFAULT '',
  "unidade" TEXT DEFAULT '',
  "qtd" DOUBLE PRECISION DEFAULT 0,
  "qtd_recebida" DOUBLE PRECISION DEFAULT 0,
  "custo_unitario" DOUBLE PRECISION DEFAULT 0,
  "ipi" DOUBLE PRECISION DEFAULT 0,
  "icms" DOUBLE PRECISION DEFAULT 0,
  "desconto" DOUBLE PRECISION DEFAULT 0,
  "lead_time_previsto" TEXT DEFAULT '',
  "total" DOUBLE PRECISION DEFAULT 0,
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "compras_pedidos" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "codigo" TEXT DEFAULT '',
  "requisicao_id" TEXT DEFAULT '',
  "cotacao_id" TEXT DEFAULT '',
  "fornecedor_id" TEXT DEFAULT '',
  "data_pedido" TEXT DEFAULT '',
  "data_prevista_entrega" TEXT DEFAULT '',
  "data_recebimento" TEXT DEFAULT '',
  "status" TEXT DEFAULT 'rascunho',
  "condicao_pagamento" TEXT DEFAULT '',
  "prazo_entrega" TEXT DEFAULT '',
  "transportadora" TEXT DEFAULT '',
  "frete" DOUBLE PRECISION DEFAULT 0,
  "desconto" DOUBLE PRECISION DEFAULT 0,
  "total" DOUBLE PRECISION DEFAULT 0,
  "solicitante" TEXT DEFAULT '',
  "aprovado_por" TEXT DEFAULT '',
  "aprovado_em" TEXT DEFAULT '',
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "compras_requisicao_itens" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "requisicao_id" TEXT DEFAULT '',
  "ordem" BIGINT DEFAULT 0,
  "material_id" TEXT DEFAULT '',
  "nao_cadastrado" BIGINT DEFAULT 0,
  "match_confianca" DOUBLE PRECISION DEFAULT 0,
  "codigo" TEXT DEFAULT '',
  "descricao" TEXT DEFAULT '',
  "fabricante" TEXT DEFAULT '',
  "unidade" TEXT DEFAULT '',
  "qtd" DOUBLE PRECISION DEFAULT 0,
  "custo_catalogo" DOUBLE PRECISION DEFAULT 0,
  "lead_time_catalogo" DOUBLE PRECISION DEFAULT 0,
  "status" TEXT DEFAULT 'pendente',
  "qtd_cotada" DOUBLE PRECISION DEFAULT 0,
  "qtd_pedida" DOUBLE PRECISION DEFAULT 0,
  "qtd_recebida" DOUBLE PRECISION DEFAULT 0,
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "compras_requisicoes" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "codigo" TEXT DEFAULT '',
  "projeto_id" TEXT DEFAULT '',
  "origem" TEXT DEFAULT 'upload',
  "titulo" TEXT DEFAULT '',
  "solicitante" TEXT DEFAULT '',
  "revisao" TEXT DEFAULT '',
  "arquivo_nome" TEXT DEFAULT '',
  "arquivo_path" TEXT DEFAULT '',
  "arquivo_hash" TEXT DEFAULT '',
  "data_lm" TEXT DEFAULT '',
  "data_requisicao" TEXT DEFAULT '',
  "data_liberacao" TEXT DEFAULT '',
  "liberada_por" TEXT DEFAULT '',
  "status" TEXT DEFAULT 'rascunho',
  "total_estimado" DOUBLE PRECISION DEFAULT 0,
  "total_real" DOUBLE PRECISION DEFAULT 0,
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "crm_automacoes" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT NOT NULL,
  "ativo" BIGINT NOT NULL DEFAULT 1,
  "trigger_event" TEXT NOT NULL DEFAULT 'lead_created',
  "trigger_value" TEXT DEFAULT '',
  "condicao" TEXT DEFAULT '',
  "acoes" TEXT DEFAULT '[]',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "crm_email_log" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "lead_id" TEXT,
  "to_email" TEXT NOT NULL,
  "cc" TEXT DEFAULT '',
  "bcc" TEXT DEFAULT '',
  "from_email" TEXT NOT NULL,
  "from_name" TEXT DEFAULT '',
  "subject" TEXT NOT NULL,
  "body_preview" TEXT DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'sent',
  "error_message" TEXT DEFAULT '',
  "provider" TEXT DEFAULT 'smtp',
  "message_id" TEXT DEFAULT '',
  "attachments_count" BIGINT DEFAULT 0,
  "created_at" TEXT,
  "tracking_token" TEXT DEFAULT '',
  "opened_at" TEXT,
  "open_count" BIGINT DEFAULT 0,
  "user_agent" TEXT DEFAULT ''
);
CREATE TABLE "crm_email_templates" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT NOT NULL,
  "assunto" TEXT NOT NULL,
  "corpo" TEXT NOT NULL,
  "categoria" TEXT DEFAULT 'geral',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "crm_interacoes" (
  "id" TEXT PRIMARY KEY,
  "lead_id" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "data_hora" TEXT,
  "duracao_min" BIGINT DEFAULT 0,
  "contato_nome" TEXT,
  "contato_cargo" TEXT,
  "realizado_por" TEXT,
  "resultado" TEXT,
  "proximo_passo" TEXT,
  "proxima_data" TEXT,
  "tem_anexo" BIGINT DEFAULT 0,
  "created_at" TEXT,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "anexos" TEXT DEFAULT '[]'
);
CREATE TABLE "crm_leads" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "status" TEXT NOT NULL DEFAULT 'novo',
  "score" BIGINT DEFAULT 0,
  "prioridade" TEXT DEFAULT 'media',
  "origem" TEXT DEFAULT 'manual',
  "origem_descricao" TEXT,
  "midia_especifica" TEXT,
  "nome" TEXT NOT NULL,
  "empresa" TEXT,
  "cargo" TEXT,
  "segmento" TEXT,
  "email" TEXT,
  "telefone" TEXT,
  "celular" TEXT,
  "whatsapp" TEXT,
  "cidade" TEXT,
  "estado" TEXT,
  "cnpj" TEXT,
  "vendedor_id" TEXT,
  "cliente_id" TEXT,
  "interesse" TEXT,
  "estimativa_valor" DOUBLE PRECISION DEFAULT 0,
  "orcamento_informado" DOUBLE PRECISION DEFAULT 0,
  "prazo_interesse" TEXT,
  "data_ultimo_contato" TEXT,
  "data_proximo_followup" TEXT,
  "data_qualificacao" TEXT,
  "data_conversao" TEXT,
  "motivo_perda" TEXT,
  "motivo_desqualificacao" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT,
  "created_by" TEXT,
  "tags" TEXT DEFAULT '[]',
  "observacoes" TEXT,
  "deleted_at" TEXT DEFAULT ''
);
CREATE TABLE "crm_metas" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "periodo" TEXT NOT NULL,
  "vendedor_id" TEXT DEFAULT '',
  "valor" DOUBLE PRECISION DEFAULT 0,
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "crm_notas" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "lead_id" TEXT NOT NULL,
  "conteudo" TEXT NOT NULL,
  "autor" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT,
  "menoes" TEXT DEFAULT ''
);
CREATE TABLE "crm_sequencias" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT NOT NULL,
  "trigger_event" TEXT NOT NULL DEFAULT 'stage_entered',
  "trigger_value" TEXT NOT NULL DEFAULT '',
  "delay_days" BIGINT NOT NULL DEFAULT 0,
  "task_titulo" TEXT NOT NULL DEFAULT 'Follow-up automático',
  "task_descricao" TEXT DEFAULT '',
  "task_prioridade" TEXT DEFAULT 'media',
  "ativo" BIGINT NOT NULL DEFAULT 1,
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "crm_stages" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "stage_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#6b7280',
  "icon" TEXT NOT NULL DEFAULT 'ph-dot-outline',
  "position" BIGINT NOT NULL DEFAULT 0,
  "is_default" BIGINT NOT NULL DEFAULT 0,
  "is_terminal" BIGINT NOT NULL DEFAULT 0,
  "allows_proposal" BIGINT NOT NULL DEFAULT 0,
  "tracks_qualificacao" BIGINT NOT NULL DEFAULT 0,
  "tracks_conversao" BIGINT NOT NULL DEFAULT 0,
  "is_loss" BIGINT NOT NULL DEFAULT 0,
  "loss_reasons" TEXT DEFAULT '[]',
  "created_at" TEXT,
  "updated_at" TEXT,
  "probability" BIGINT DEFAULT 0,
  "dias_rotting" BIGINT DEFAULT 7
);
CREATE TABLE "crm_tarefas" (
  "id" TEXT PRIMARY KEY,
  "lead_id" TEXT,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "tipo" TEXT DEFAULT 'followup',
  "prioridade" TEXT DEFAULT 'media',
  "status" TEXT DEFAULT 'pendente',
  "responsavel" TEXT,
  "data_vencimento" TEXT,
  "data_conclusao" TEXT,
  "lead_nome" TEXT,
  "created_at" TEXT,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "seq_id" TEXT DEFAULT ''
);
CREATE TABLE "crm_webhooks" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "eventos" TEXT NOT NULL DEFAULT '[]',
  "ativo" BIGINT NOT NULL DEFAULT 1,
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "cubiculos" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT,
  "tipoAcionamento" TEXT,
  "regimeAcionamento" TEXT,
  "comunicacao" TEXT,
  "potencia" TEXT,
  "potenciaKvar" TEXT,
  "tensao" TEXT,
  "icc" TEXT,
  "frequencia" TEXT,
  "correnteApx" TEXT,
  "correntePlaca" TEXT,
  "fp" DOUBLE PRECISION,
  "fs" DOUBLE PRECISION,
  "rendimento" DOUBLE PRECISION,
  "reserva" TEXT,
  "protecao" TEXT,
  "drives" TEXT,
  "aplicacao" TEXT,
  "descricao_word" TEXT,
  "custoTotal" DOUBLE PRECISION DEFAULT 0,
  "items" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "correnteNominal" TEXT DEFAULT '',
  "nbi" TEXT DEFAULT '',
  "instalacao" TEXT DEFAULT '',
  "releProtecao" TEXT DEFAULT ''
);
CREATE TABLE "empresas" (
  "id" TEXT PRIMARY KEY,
  "nome" TEXT,
  "cnpj" TEXT,
  "plano" TEXT DEFAULT 'trial',
  "ativo" BIGINT DEFAULT 1,
  "created_at" TEXT,
  "sigla" TEXT DEFAULT '',
  "folder_name" TEXT DEFAULT ''
);
CREATE TABLE "extraction_history" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "proposal_id" TEXT,
  "filename" TEXT,
  "data_json" TEXT,
  "provider" TEXT,
  "model" TEXT,
  "created_at" TEXT,
  "applied_fields" TEXT
);
CREATE TABLE "fornecedores" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "razaoSocial" TEXT,
  "nomeFantasia" TEXT,
  "cnpj" TEXT,
  "segmento" TEXT,
  "cnae" TEXT,
  "inscricaoEstadual" TEXT,
  "inscricaoMunicipal" TEXT,
  "cep" TEXT,
  "logradouro" TEXT,
  "numero" TEXT,
  "bairro" TEXT,
  "cidade" TEXT,
  "estado" TEXT,
  "contatoNome" TEXT,
  "contatoCargo" TEXT,
  "email" TEXT,
  "telefone" TEXT,
  "observacoes" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "prazoEntrega" TEXT DEFAULT '',
  "condicaoPagamento" TEXT DEFAULT ''
);
CREATE TABLE "load_lists" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "name" TEXT,
  "items" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);
CREATE TABLE "mail_settings" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "host" TEXT NOT NULL DEFAULT '',
  "port" BIGINT DEFAULT 587,
  "secure" BIGINT DEFAULT 0,
  "user" TEXT DEFAULT '',
  "pass" TEXT DEFAULT '',
  "from_name" TEXT DEFAULT '',
  "from_email" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT,
  "provider" TEXT DEFAULT 'smtp',
  "api_key" TEXT DEFAULT ''
);
CREATE TABLE "manufatura_anexos" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "entidade_tipo" TEXT NOT NULL,
  "entidade_id" TEXT NOT NULL,
  "nome_arquivo" TEXT NOT NULL DEFAULT '',
  "tipo_arquivo" TEXT DEFAULT '',
  "tamanho_bytes" BIGINT DEFAULT 0,
  "caminho" TEXT DEFAULT '',
  "descricao" TEXT DEFAULT '',
  "usuario" TEXT DEFAULT '',
  "created_at" TEXT
);
CREATE TABLE "manufatura_colunas" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "projeto_id" TEXT NOT NULL,
  "tag" TEXT NOT NULL DEFAULT '',
  "tipo" TEXT DEFAULT 'CCM-BT',
  "posicao" BIGINT DEFAULT 0,
  "status" TEXT DEFAULT 'em_andamento',
  "etapa" TEXT DEFAULT 'montagem_mecanica',
  "dados_adicionais" TEXT DEFAULT '{}',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "manufatura_componentes" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "gaveta_id" TEXT NOT NULL,
  "tipo" TEXT DEFAULT '',
  "codigo" TEXT DEFAULT '',
  "fabricante" TEXT DEFAULT '',
  "quantidade" BIGINT DEFAULT 1,
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "manufatura_gavetas" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "coluna_id" TEXT NOT NULL,
  "tag" TEXT NOT NULL DEFAULT '',
  "posicao" BIGINT DEFAULT 0,
  "tipo" TEXT DEFAULT 'partida_direta',
  "modelo" TEXT DEFAULT '',
  "potencia_kw" DOUBLE PRECISION DEFAULT 0,
  "status" TEXT DEFAULT 'em_andamento',
  "etapa" TEXT DEFAULT 'montagem_mecanica',
  "componentes" TEXT DEFAULT '[]',
  "dados_adicionais" TEXT DEFAULT '{}',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "manufatura_historico" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "entidade_tipo" TEXT NOT NULL,
  "entidade_id" TEXT NOT NULL,
  "acao" TEXT NOT NULL,
  "usuario" TEXT DEFAULT '',
  "dados" TEXT DEFAULT '{}',
  "created_at" TEXT
);
CREATE TABLE "manufatura_perfis_teste" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT NOT NULL DEFAULT '',
  "tipo_gaveta" TEXT NOT NULL DEFAULT '',
  "parametros" TEXT DEFAULT '{}',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "manufatura_projetos" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT NOT NULL DEFAULT '',
  "cliente" TEXT DEFAULT '',
  "proposta_tecnica_id" TEXT DEFAULT '',
  "data_criacao" TEXT,
  "status" TEXT DEFAULT 'em_andamento',
  "etapa" TEXT DEFAULT 'inicio',
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "manufatura_resultados_teste" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "gaveta_id" TEXT NOT NULL,
  "perfil_id" TEXT DEFAULT '',
  "status" TEXT DEFAULT 'pendente',
  "resultados" TEXT DEFAULT '{}',
  "operador" TEXT DEFAULT '',
  "data_teste" TEXT,
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "materiais" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "codigoInterno" TEXT,
  "codigoFabricante" TEXT,
  "fabricante" TEXT,
  "categoria" TEXT,
  "area" TEXT,
  "descricao" TEXT,
  "unidade" TEXT,
  "peso" DOUBLE PRECISION,
  "tensao" TEXT,
  "corrente" TEXT,
  "custo" DOUBLE PRECISION DEFAULT 0,
  "markup" DOUBLE PRECISION DEFAULT 0,
  "precoSugerido" TEXT,
  "leadTime" DOUBLE PRECISION DEFAULT 5,
  "ncm" TEXT,
  "origem" TEXT,
  "icms" DOUBLE PRECISION DEFAULT 18,
  "ipi" DOUBLE PRECISION DEFAULT 10,
  "pis" DOUBLE PRECISION DEFAULT 1.65,
  "cofins" DOUBLE PRECISION DEFAULT 7.60,
  "modelo" TEXT,
  "largura_mm" DOUBLE PRECISION DEFAULT 0,
  "altura_mm" DOUBLE PRECISION DEFAULT 0,
  "profundidade_mm" DOUBLE PRECISION DEFAULT 0,
  "lastUpdateDate" TEXT,
  "lastUpdateTitle" TEXT,
  "createdAt" TEXT,
  "ufFornecedor" TEXT DEFAULT '',
  "grupoSiemens" TEXT DEFAULT '',
  "favorito" BIGINT DEFAULT 0,
  "dxf_block" TEXT
);
CREATE TABLE "orcamentos" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "numero" TEXT,
  "clienteId" TEXT,
  "clienteName" TEXT,
  "obra" TEXT,
  "status" TEXT,
  "markupGlobal" DOUBLE PRECISION DEFAULT 30,
  "impostoGlobal" DOUBLE PRECISION DEFAULT 18,
  "subtotal" DOUBLE PRECISION DEFAULT 0,
  "total" DOUBLE PRECISION DEFAULT 0,
  "condicao_pagamento" TEXT,
  "condicao_parcela" TEXT,
  "condicao_faturamento" TEXT,
  "prazo_entrega" TEXT,
  "validade" TEXT,
  "ncm_imposto" TEXT,
  "transporte" TEXT,
  "despesas" TEXT,
  "items" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);
CREATE TABLE "paineis" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "tipo" TEXT,
  "descricao" TEXT,
  "altura" TEXT,
  "largura" TEXT,
  "profundidade" TEXT,
  "ip" TEXT,
  "cor" TEXT,
  "cat_categoria" TEXT,
  "cat_tensao" TEXT,
  "cat_forma" TEXT,
  "cat_execucao" TEXT,
  "cat_instalacao" TEXT,
  "cat_gp" TEXT,
  "cat_cor" TEXT,
  "custoTotal" DOUBLE PRECISION DEFAULT 0,
  "items" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);
CREATE TABLE "pipeline_items" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "cliente" TEXT,
  "projeto" TEXT,
  "valor" DOUBLE PRECISION DEFAULT 0,
  "status" TEXT DEFAULT 'prospect',
  "origem" TEXT,
  "origemId" TEXT,
  "observacoes" TEXT,
  "ultimoContato" TEXT,
  "proximoFollowup" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "interacoes" TEXT,
  "vendedor" TEXT DEFAULT '',
  "tipo" TEXT DEFAULT 'tecnica_comercial',
  "revisao" BIGINT DEFAULT 0,
  "consolidada" BIGINT DEFAULT 0,
  "engenheiro_responsavel" TEXT DEFAULT '',
  "data_entrega" TEXT,
  "descricao_revisao" TEXT DEFAULT ''
);
CREATE TABLE "price_history" (
  "id" BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  "material_id" TEXT NOT NULL,
  "custo" DOUBLE PRECISION,
  "markup" DOUBLE PRECISION,
  "date" TEXT,
  "title" TEXT,
  "origin" TEXT,
  "custo_anterior" DOUBLE PRECISION
);
CREATE TABLE "price_import_templates" (
  "fornecedor_id" TEXT NOT NULL,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "name" TEXT,
  "fabricante" TEXT,
  "columns" TEXT,
  "updatedAt" TEXT,
  PRIMARY KEY ("fornecedor_id", "empresa_id")
);
CREATE TABLE "projeto_custos" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "projeto_id" TEXT NOT NULL DEFAULT '',
  "tipo" TEXT DEFAULT 'real',
  "categoria" TEXT DEFAULT 'outras',
  "descricao" TEXT DEFAULT '',
  "valor" DOUBLE PRECISION DEFAULT 0,
  "data" TEXT DEFAULT '',
  "origem" TEXT DEFAULT 'manual',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "projeto_fases" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "projeto_id" TEXT NOT NULL DEFAULT '',
  "ordem" BIGINT DEFAULT 0,
  "nome" TEXT NOT NULL DEFAULT '',
  "descricao" TEXT DEFAULT '',
  "data_inicio" TEXT DEFAULT '',
  "data_fim" TEXT DEFAULT '',
  "status" TEXT DEFAULT 'pendente',
  "progresso" BIGINT DEFAULT 0,
  "responsavel" TEXT DEFAULT '',
  "cor" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "projeto_tarefas" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "projeto_id" TEXT NOT NULL DEFAULT '',
  "fase_id" TEXT NOT NULL DEFAULT '',
  "ordem" BIGINT DEFAULT 0,
  "nome" TEXT NOT NULL DEFAULT '',
  "descricao" TEXT DEFAULT '',
  "responsavel" TEXT DEFAULT '',
  "status" TEXT DEFAULT 'pendente',
  "data_inicio" TEXT DEFAULT '',
  "data_fim" TEXT DEFAULT '',
  "progresso" BIGINT DEFAULT 0,
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "projetos" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "codigo" TEXT DEFAULT '',
  "pipeline_item_id" TEXT DEFAULT '',
  "origem" TEXT DEFAULT 'pipeline',
  "origem_id" TEXT DEFAULT '',
  "cliente" TEXT DEFAULT '',
  "projeto" TEXT DEFAULT '',
  "descricao" TEXT DEFAULT '',
  "status" TEXT DEFAULT 'em_andamento',
  "fase_atual" TEXT DEFAULT '',
  "responsavel" TEXT DEFAULT '',
  "vendedor" TEXT DEFAULT '',
  "engenheiro_responsavel" TEXT DEFAULT '',
  "valor_contrato" DOUBLE PRECISION DEFAULT 0,
  "data_inicio" TEXT DEFAULT '',
  "data_prevista_entrega" TEXT DEFAULT '',
  "data_entrega_real" TEXT DEFAULT '',
  "observacoes" TEXT DEFAULT '',
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "proposal_counters" (
  "data" TEXT PRIMARY KEY,
  "sequencial" BIGINT DEFAULT 0
);
CREATE TABLE "propostas_comerciais" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "dados" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);
CREATE TABLE "propostas_completas" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "dados" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "propostas_tecnicas" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "dados" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT
);
CREATE TABLE "regras_derivacao" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT NOT NULL,
  "tipo_equipamento" TEXT DEFAULT '*',
  "prioridade" BIGINT DEFAULT 0,
  "regra_ativa" BIGINT DEFAULT 1,
  "condicoes" TEXT,
  "acoes" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT
);
CREATE TABLE "settings" (
  "empresa_id" TEXT PRIMARY KEY DEFAULT 'default',
  "theme" TEXT DEFAULT 'light',
  "defaultMarkup" DOUBLE PRECISION DEFAULT 30,
  "defaultTax" DOUBLE PRECISION DEFAULT 18,
  "defaultIpi" DOUBLE PRECISION DEFAULT 9.75,
  "company_name" TEXT DEFAULT '',
  "company_cnpj" TEXT DEFAULT '',
  "company_address" TEXT DEFAULT '',
  "company_logradouro" TEXT DEFAULT '',
  "company_numero" TEXT DEFAULT '',
  "company_cep" TEXT DEFAULT '',
  "company_cidade" TEXT DEFAULT '',
  "company_uf" TEXT DEFAULT '',
  "company_email" TEXT DEFAULT '',
  "company_logoUrl" TEXT DEFAULT '',
  "company_regimeTributario" TEXT DEFAULT 'Lucro Real',
  "login_theme" TEXT DEFAULT '{}',
  "ai_provider" TEXT DEFAULT 'ollama',
  "ai_model" TEXT DEFAULT 'qwen2.5:14b',
  "ai_key" TEXT DEFAULT '',
  "ai_ollama_url" TEXT DEFAULT 'http://localhost:11434',
  "vendor_defaults" TEXT DEFAULT '[]',
  "telegram_bot_token" TEXT DEFAULT '',
  "template_tecnica" TEXT DEFAULT 'TEMPLATE_TEC.docx',
  "template_comercial" TEXT DEFAULT 'TEMPLATE_COM.docx',
  "template_completa" TEXT DEFAULT 'TEMPLATE_TEC_COM.docx',
  "company_color" TEXT DEFAULT '#0055AA'
);
CREATE TABLE "tipicos" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT,
  "tipoAcionamento" TEXT,
  "regimeAcionamento" TEXT,
  "comunicacao" TEXT,
  "potencia" TEXT,
  "potenciaKvar" TEXT,
  "tensao" TEXT,
  "icc" TEXT,
  "frequencia" TEXT,
  "correnteApx" TEXT,
  "correntePlaca" TEXT,
  "fp" DOUBLE PRECISION,
  "fs" DOUBLE PRECISION,
  "rendimento" DOUBLE PRECISION,
  "reserva" TEXT,
  "protecao" TEXT,
  "drives" TEXT,
  "aplicacao" TEXT,
  "descricao_word" TEXT,
  "custoTotal" DOUBLE PRECISION DEFAULT 0,
  "items" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "tensaoComando" TEXT DEFAULT ''
);
CREATE TABLE "unidades_cliente" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "cliente_id" TEXT NOT NULL,
  "codigo_unidade" TEXT NOT NULL,
  "nome_unidade" TEXT DEFAULT '',
  "cep" TEXT,
  "logradouro" TEXT,
  "numero" TEXT,
  "bairro" TEXT,
  "cidade" TEXT,
  "estado" TEXT,
  "proximo_sequencial" BIGINT DEFAULT 1,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "contatos" TEXT DEFAULT '[]',
  UNIQUE("empresa_id", "cliente_id", "codigo_unidade")
);
CREATE TABLE "usuarios" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "nivel" TEXT DEFAULT 'engenheiro',
  "ativo" BIGINT DEFAULT 1,
  "telegram_chat_id" TEXT DEFAULT '',
  "created_at" TEXT
);
CREATE TABLE "vendedores" (
  "id" TEXT PRIMARY KEY,
  "empresa_id" TEXT NOT NULL DEFAULT 'default',
  "nome" TEXT,
  "email" TEXT,
  "telefone" TEXT,
  "createdAt" TEXT,
  "updatedAt" TEXT,
  "meta_mensal" DOUBLE PRECISION DEFAULT 0
);

-- ========== FASE 2: chaves estrangeiras ==========
ALTER TABLE "comparison_results" ADD FOREIGN KEY ("session_id") REFERENCES "comparison_sessions"("id");
ALTER TABLE "price_history" ADD FOREIGN KEY ("material_id") REFERENCES "materiais"("id") ON DELETE CASCADE;
ALTER TABLE "propostas_completas" ADD FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id");
ALTER TABLE "unidades_cliente" ADD FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id");
ALTER TABLE "usuarios" ADD FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id");

-- ========== FASE 3: índices ==========
CREATE INDEX "idx_clientes_empresa" ON "clientes"("empresa_id");
CREATE INDEX "idx_comparison_results_session" ON "comparison_results"("session_id");
CREATE INDEX "idx_compras_ci_cot" ON "compras_cotacao_itens"("empresa_id", "cotacao_id");
CREATE INDEX "idx_compras_ci_empresa" ON "compras_cotacao_itens"("empresa_id");
CREATE INDEX "idx_compras_ci_reqitem" ON "compras_cotacao_itens"("requisicao_item_id");
CREATE INDEX "idx_compras_cot_empresa" ON "compras_cotacoes"("empresa_id");
CREATE INDEX "idx_compras_cot_forn" ON "compras_cotacoes"("fornecedor_id");
CREATE INDEX "idx_compras_cot_req" ON "compras_cotacoes"("empresa_id", "requisicao_id");
CREATE INDEX "idx_compras_nf_empresa" ON "compras_notas"("empresa_id");
CREATE INDEX "idx_compras_nf_numero" ON "compras_notas"("numero");
CREATE INDEX "idx_compras_nf_ped" ON "compras_notas"("empresa_id", "pedido_id");
CREATE INDEX "idx_compras_ni_empresa" ON "compras_nota_itens"("empresa_id");
CREATE INDEX "idx_compras_ni_nf" ON "compras_nota_itens"("empresa_id", "nota_id");
CREATE INDEX "idx_compras_ni_peditem" ON "compras_nota_itens"("pedido_item_id");
CREATE INDEX "idx_compras_ped_empresa" ON "compras_pedidos"("empresa_id");
CREATE INDEX "idx_compras_ped_forn" ON "compras_pedidos"("fornecedor_id");
CREATE INDEX "idx_compras_ped_req" ON "compras_pedidos"("empresa_id", "requisicao_id");
CREATE INDEX "idx_compras_pi_empresa" ON "compras_pedido_itens"("empresa_id");
CREATE INDEX "idx_compras_pi_material" ON "compras_pedido_itens"("material_id");
CREATE INDEX "idx_compras_pi_ped" ON "compras_pedido_itens"("empresa_id", "pedido_id");
CREATE INDEX "idx_compras_req_empresa" ON "compras_requisicoes"("empresa_id");
CREATE INDEX "idx_compras_req_projeto" ON "compras_requisicoes"("empresa_id", "projeto_id");
CREATE INDEX "idx_compras_req_status" ON "compras_requisicoes"("empresa_id", "status");
CREATE INDEX "idx_compras_ri_empresa" ON "compras_requisicao_itens"("empresa_id");
CREATE INDEX "idx_compras_ri_material" ON "compras_requisicao_itens"("material_id");
CREATE INDEX "idx_compras_ri_req" ON "compras_requisicao_itens"("empresa_id", "requisicao_id", "ordem");
CREATE INDEX "idx_crm_email_log_tracking" ON "crm_email_log"("tracking_token");
CREATE INDEX "idx_crm_interacoes_lead" ON "crm_interacoes"("lead_id");
CREATE INDEX "idx_crm_leads_followup" ON "crm_leads"("data_proximo_followup");
CREATE INDEX "idx_crm_leads_status" ON "crm_leads"("status");
CREATE INDEX "idx_crm_leads_vendedor" ON "crm_leads"("vendedor_id");
CREATE INDEX "idx_crm_metas_empresa_periodo" ON "crm_metas"("empresa_id", "periodo");
CREATE INDEX "idx_crm_notas_lead" ON "crm_notas"("lead_id");
CREATE UNIQUE INDEX "idx_crm_stages_empresa_stage" ON "crm_stages"("empresa_id", "stage_id");
CREATE INDEX "idx_crm_tarefas_lead" ON "crm_tarefas"("lead_id");
CREATE INDEX "idx_crm_tarefas_responsavel" ON "crm_tarefas"("responsavel");
CREATE INDEX "idx_crm_tarefas_vencimento" ON "crm_tarefas"("data_vencimento");
CREATE INDEX "idx_extraction_history_proposal" ON "extraction_history"("proposal_id");
CREATE INDEX "idx_materiais_categoria" ON "materiais"("categoria");
CREATE INDEX "idx_materiais_codigoFabricante" ON "materiais"("codigoFabricante");
CREATE INDEX "idx_materiais_codigoInterno" ON "materiais"("codigoInterno");
CREATE INDEX "idx_materiais_empresa" ON "materiais"("empresa_id");
CREATE INDEX "idx_materiais_fabricante" ON "materiais"("fabricante");
CREATE INDEX "idx_materiais_grupoSiemens" ON "materiais"("grupoSiemens");
CREATE INDEX "idx_price_history_material" ON "price_history"("material_id");
CREATE INDEX "idx_projeto_custos_empresa" ON "projeto_custos"("empresa_id");
CREATE INDEX "idx_projeto_custos_projeto" ON "projeto_custos"("empresa_id", "projeto_id", "tipo");
CREATE INDEX "idx_projeto_fases_empresa" ON "projeto_fases"("empresa_id");
CREATE INDEX "idx_projeto_fases_projeto" ON "projeto_fases"("empresa_id", "projeto_id", "ordem");
CREATE INDEX "idx_projeto_tarefas_empresa" ON "projeto_tarefas"("empresa_id");
CREATE INDEX "idx_projeto_tarefas_fase" ON "projeto_tarefas"("empresa_id", "projeto_id", "fase_id", "ordem");
CREATE INDEX "idx_projetos_empresa" ON "projetos"("empresa_id");
CREATE INDEX "idx_projetos_status" ON "projetos"("empresa_id", "status");
