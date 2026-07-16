/**
 * Database Module
 * SQLite via Node.js built-in DatabaseSync (Node 22+)
 * Schema, CRUD helpers, sync operations
 */

const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'gerapro.db');

let db = null;

// Initialize at module load
getDb();

function getDb() {
    if (!db) {
        if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
        db = new DatabaseSync(DB_PATH);
        db.exec('PRAGMA journal_mode = WAL');
        db.exec('PRAGMA foreign_keys = ON');
        initSchema();
    }
    return db;
}

function initSchema() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS empresas (
            id TEXT PRIMARY KEY,
            nome TEXT,
            cnpj TEXT,
            sigla TEXT DEFAULT '',
            plano TEXT DEFAULT 'trial',
            ativo INTEGER DEFAULT 1,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT,
            nivel TEXT DEFAULT 'engenheiro',
            ativo INTEGER DEFAULT 1,
            telegram_chat_id TEXT DEFAULT '',
            created_at TEXT,
            FOREIGN KEY (empresa_id) REFERENCES empresas(id)
        );

        CREATE TABLE IF NOT EXISTS clientes (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            razaoSocial TEXT,
            nomeFantasia TEXT,
            cnpj TEXT,
            segmento TEXT,
            cnae TEXT,
            inscricaoEstadual TEXT,
            inscricaoMunicipal TEXT,
            cep TEXT,
            logradouro TEXT,
            numero TEXT,
            bairro TEXT,
            cidade TEXT,
            estado TEXT,
            contatoNome TEXT,
            contatoCargo TEXT,
            email TEXT,
            telefone TEXT,
            logo TEXT DEFAULT '',
            observacoes TEXT,
            contatos TEXT,
            codigo_cliente TEXT DEFAULT '',
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS unidades_cliente (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            cliente_id TEXT NOT NULL,
            codigo_unidade TEXT NOT NULL,
            nome_unidade TEXT DEFAULT '',
            cep TEXT, logradouro TEXT, numero TEXT, bairro TEXT, cidade TEXT, estado TEXT,
            proximo_sequencial INTEGER DEFAULT 1,
            createdAt TEXT,
            updatedAt TEXT,
            FOREIGN KEY (cliente_id) REFERENCES clientes(id),
            UNIQUE(empresa_id, cliente_id, codigo_unidade)
        );

        CREATE TABLE IF NOT EXISTS fornecedores (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            razaoSocial TEXT,
            nomeFantasia TEXT,
            cnpj TEXT,
            segmento TEXT,
            cnae TEXT,
            inscricaoEstadual TEXT,
            inscricaoMunicipal TEXT,
            cep TEXT,
            logradouro TEXT,
            numero TEXT,
            bairro TEXT,
            cidade TEXT,
            estado TEXT,
            contatoNome TEXT,
            contatoCargo TEXT,
            email TEXT,
            telefone TEXT,
            observacoes TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS materiais (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            codigoInterno TEXT,
            codigoFabricante TEXT,
            fabricante TEXT,
            categoria TEXT,
            area TEXT,
            descricao TEXT,
            unidade TEXT,
            peso REAL,
            tensao TEXT,
            corrente TEXT,
            custo REAL DEFAULT 0,
            markup REAL DEFAULT 0,
            precoSugerido TEXT,
            leadTime REAL DEFAULT 5,
            ncm TEXT,
            origem TEXT,
            icms REAL DEFAULT 18,
            ipi REAL DEFAULT 10,
            pis REAL DEFAULT 1.65,
            cofins REAL DEFAULT 7.60,
            modelo TEXT,
            largura_mm REAL DEFAULT 0,
            altura_mm REAL DEFAULT 0,
            profundidade_mm REAL DEFAULT 0,
            lastUpdateDate TEXT,
            lastUpdateTitle TEXT,
            grupoSiemens TEXT DEFAULT '',
            createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            material_id TEXT NOT NULL REFERENCES materiais(id) ON DELETE CASCADE,
            custo REAL,
            markup REAL,
            date TEXT,
            title TEXT,
            origin TEXT
        );

        CREATE TABLE IF NOT EXISTS paineis (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            tipo TEXT,
            descricao TEXT,
            altura TEXT,
            largura TEXT,
            profundidade TEXT,
            ip TEXT,
            cor TEXT,
            cat_categoria TEXT,
            cat_tensao TEXT,
            cat_forma TEXT,
            cat_execucao TEXT,
            cat_instalacao TEXT,
            cat_gp TEXT,
            cat_cor TEXT,
            custoTotal REAL DEFAULT 0,
            items TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS tipicos (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            nome TEXT,
            tipoAcionamento TEXT,
            regimeAcionamento TEXT,
            comunicacao TEXT,
            potencia TEXT,
            potenciaKvar TEXT,
            tensao TEXT,
            icc TEXT,
            frequencia TEXT,
            correnteApx TEXT,
            correntePlaca TEXT,
            fp REAL,
            fs REAL,
            rendimento REAL,
            reserva TEXT,
            tensaoComando TEXT,
            protecao TEXT,
            drives TEXT,
            aplicacao TEXT,
            descricao_word TEXT,
            custoTotal REAL DEFAULT 0,
            items TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS cubiculos (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            nome TEXT,
            tipoAcionamento TEXT,
            regimeAcionamento TEXT,
            comunicacao TEXT,
            potencia TEXT,
            potenciaKvar TEXT,
            tensao TEXT,
            correnteNominal TEXT,
            icc TEXT,
            frequencia TEXT,
            nbi TEXT,
            instalacao TEXT,
            correnteApx TEXT,
            correntePlaca TEXT,
            fp REAL,
            fs REAL,
            rendimento REAL,
            reserva TEXT,
            protecao TEXT,
            releProtecao TEXT,
            drives TEXT,
            aplicacao TEXT,
            descricao_word TEXT,
            custoTotal REAL DEFAULT 0,
            items TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS cargas (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            tag TEXT,
            descricao TEXT,
            potencia TEXT,
            tensao TEXT,
            typicalId TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS orcamentos (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            numero TEXT,
            clienteId TEXT,
            clienteName TEXT,
            obra TEXT,
            status TEXT,
            markupGlobal REAL DEFAULT 30,
            impostoGlobal REAL DEFAULT 18,
            subtotal REAL DEFAULT 0,
            total REAL DEFAULT 0,
            condicao_pagamento TEXT,
            condicao_parcela TEXT,
            condicao_faturamento TEXT,
            prazo_entrega TEXT,
            validade TEXT,
            ncm_imposto TEXT,
            transporte TEXT,
            despesas TEXT,
            items TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS load_lists (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            name TEXT,
            items TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS propostas_tecnicas (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            dados TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS propostas_comerciais (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            dados TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS propostas_completas (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            dados TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (empresa_id) REFERENCES empresas(id)
        );

        CREATE TABLE IF NOT EXISTS settings (
            empresa_id TEXT PRIMARY KEY DEFAULT 'default',
            theme TEXT DEFAULT 'light',
            defaultMarkup REAL DEFAULT 30,
            defaultTax REAL DEFAULT 18,
            defaultIpi REAL DEFAULT 9.75,
            company_name TEXT DEFAULT '',
            company_cnpj TEXT DEFAULT '',
            company_address TEXT DEFAULT '',
            company_logradouro TEXT DEFAULT '',
            company_numero TEXT DEFAULT '',
            company_cep TEXT DEFAULT '',
            company_cidade TEXT DEFAULT '',
            company_uf TEXT DEFAULT '',
            company_email TEXT DEFAULT '',
            company_logoUrl TEXT DEFAULT '',
            company_regimeTributario TEXT DEFAULT 'Lucro Real',
            login_theme TEXT DEFAULT '{}',
            vendor_defaults TEXT DEFAULT '[]',
            ai_provider TEXT DEFAULT 'ollama',
            ai_model TEXT DEFAULT 'qwen2.5:14b',
            ai_key TEXT DEFAULT '',
            ai_ollama_url TEXT DEFAULT 'http://localhost:11434',
            telegram_bot_token TEXT DEFAULT '',
            template_tecnica TEXT DEFAULT 'TEMPLATE_TEC_EMP1.docx',
            template_comercial TEXT DEFAULT 'TEMPLATE_COM.docx',
            template_completa TEXT DEFAULT 'TEMPLATE_TEC_COM.docx',
            company_color TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS ai_settings (
            empresa_id TEXT PRIMARY KEY DEFAULT 'default',
            provider TEXT DEFAULT 'ollama',
            model TEXT DEFAULT 'qwen2.5:14b',
            api_key TEXT DEFAULT '',
            ollama_url TEXT DEFAULT 'http://localhost:11434',
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS price_import_templates (
            fornecedor_id TEXT NOT NULL,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            name TEXT,
            fabricante TEXT,
            columns TEXT,
            updatedAt TEXT,
            PRIMARY KEY (fornecedor_id, empresa_id)
        );

        CREATE TABLE IF NOT EXISTS chaparia_lists (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            name TEXT,
            items TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS regras_derivacao (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            nome TEXT NOT NULL,
            tipo_equipamento TEXT DEFAULT '*',
            prioridade INTEGER DEFAULT 0,
            regra_ativa INTEGER DEFAULT 1,
            condicoes TEXT,
            acoes TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_price_history_material ON price_history(material_id);
        CREATE TABLE IF NOT EXISTS pipeline_items (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            cliente TEXT,
            projeto TEXT,
            valor REAL DEFAULT 0,
            status TEXT DEFAULT 'prospect',
            origem TEXT,
            origemId TEXT,
            observacoes TEXT,
            ultimoContato TEXT,
            proximoFollowup TEXT,
            createdAt TEXT,
            updatedAt TEXT,
            interacoes TEXT
        );

        CREATE TABLE IF NOT EXISTS vendedores (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            nome TEXT,
            email TEXT,
            telefone TEXT,
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS composicoes (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            codigo TEXT,
            atividade TEXT NOT NULL,
            unidade TEXT NOT NULL,
            grupo TEXT,
            categoria_profissional TEXT,
            coeficiente_hh REAL DEFAULT 0,
            fator_simples REAL DEFAULT 0.8,
            fator_medio REAL DEFAULT 1.0,
            fator_complexo REAL DEFAULT 1.3,
            area_alocacao TEXT,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_materiais_empresa ON materiais(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_materiais_codigoInterno ON materiais(codigoInterno);
        CREATE INDEX IF NOT EXISTS idx_materiais_codigoFabricante ON materiais(codigoFabricante);
        CREATE INDEX IF NOT EXISTS idx_materiais_fabricante ON materiais(fabricante);
        CREATE INDEX IF NOT EXISTS idx_materiais_categoria ON materiais(categoria);
        CREATE INDEX IF NOT EXISTS idx_materiais_grupoSiemens ON materiais(grupoSiemens);

        CREATE TABLE IF NOT EXISTS proposal_counters (
            data TEXT PRIMARY KEY,
            sequencial INT DEFAULT 0
        );

        -- CRM Tables
        CREATE TABLE IF NOT EXISTS crm_leads (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            status TEXT NOT NULL DEFAULT 'novo',
            score INTEGER DEFAULT 0,
            prioridade TEXT DEFAULT 'media',
            origem TEXT DEFAULT 'manual',
            origem_descricao TEXT,
            midia_especifica TEXT,
            nome TEXT NOT NULL,
            empresa TEXT,
            cargo TEXT,
            segmento TEXT,
            email TEXT,
            telefone TEXT,
            celular TEXT,
            whatsapp TEXT,
            cidade TEXT,
            estado TEXT,
            cnpj TEXT,
            vendedor_id TEXT,
            cliente_id TEXT,
            interesse TEXT,
            estimativa_valor REAL DEFAULT 0,
            orcamento_informado REAL DEFAULT 0,
            prazo_interesse TEXT,
            data_ultimo_contato TEXT,
            data_proximo_followup TEXT,
            data_qualificacao TEXT,
            data_conversao TEXT,
            motivo_perda TEXT,
            motivo_desqualificacao TEXT,
            created_at TEXT,
            updated_at TEXT,
            created_by TEXT,
            tags TEXT DEFAULT '[]',
            observacoes TEXT
        );

        CREATE TABLE IF NOT EXISTS crm_interacoes (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            lead_id TEXT NOT NULL,
            tipo TEXT NOT NULL,
            descricao TEXT NOT NULL,
            data_hora TEXT,
            duracao_min INTEGER DEFAULT 0,
            contato_nome TEXT,
            contato_cargo TEXT,
            realizado_por TEXT,
            resultado TEXT,
            proximo_passo TEXT,
            proxima_data TEXT,
            tem_anexo INTEGER DEFAULT 0,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS crm_tarefas (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            lead_id TEXT,
            titulo TEXT NOT NULL,
            descricao TEXT,
            tipo TEXT DEFAULT 'followup',
            prioridade TEXT DEFAULT 'media',
            status TEXT DEFAULT 'pendente',
            responsavel TEXT,
            data_vencimento TEXT,
            data_conclusao TEXT,
            lead_nome TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS crm_notas (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            lead_id TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            autor TEXT DEFAULT '',
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS crm_webhooks (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            nome TEXT NOT NULL,
            url TEXT NOT NULL,
            eventos TEXT NOT NULL DEFAULT '[]',
            ativo INTEGER NOT NULL DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS crm_sequencias (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            nome TEXT NOT NULL,
            trigger_event TEXT NOT NULL DEFAULT 'stage_entered',
            trigger_value TEXT NOT NULL DEFAULT '',
            delay_days INTEGER NOT NULL DEFAULT 0,
            task_titulo TEXT NOT NULL DEFAULT 'Follow-up automático',
            task_descricao TEXT DEFAULT '',
            task_prioridade TEXT DEFAULT 'media',
            ativo INTEGER NOT NULL DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS crm_email_templates (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            nome TEXT NOT NULL,
            assunto TEXT NOT NULL,
            corpo TEXT NOT NULL,
            categoria TEXT DEFAULT 'geral',
            created_at TEXT,
            updated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
        CREATE INDEX IF NOT EXISTS idx_crm_leads_vendedor ON crm_leads(vendedor_id);
        CREATE INDEX IF NOT EXISTS idx_crm_leads_followup ON crm_leads(data_proximo_followup);
        CREATE INDEX IF NOT EXISTS idx_crm_interacoes_lead ON crm_interacoes(lead_id);
        CREATE INDEX IF NOT EXISTS idx_crm_notas_lead ON crm_notas(lead_id);
        CREATE INDEX IF NOT EXISTS idx_crm_tarefas_lead ON crm_tarefas(lead_id);
        CREATE INDEX IF NOT EXISTS idx_crm_tarefas_responsavel ON crm_tarefas(responsavel);
        CREATE INDEX IF NOT EXISTS idx_crm_tarefas_vencimento ON crm_tarefas(data_vencimento);

        CREATE TABLE IF NOT EXISTS crm_stages (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            stage_id TEXT NOT NULL,
            label TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#6b7280',
            icon TEXT NOT NULL DEFAULT 'ph-dot-outline',
            position INTEGER NOT NULL DEFAULT 0,
            is_default INTEGER NOT NULL DEFAULT 0,
            is_terminal INTEGER NOT NULL DEFAULT 0,
            allows_proposal INTEGER NOT NULL DEFAULT 0,
            tracks_qualificacao INTEGER NOT NULL DEFAULT 0,
            tracks_conversao INTEGER NOT NULL DEFAULT 0,
            is_loss INTEGER NOT NULL DEFAULT 0,
            loss_reasons TEXT DEFAULT '[]',
            created_at TEXT,
            updated_at TEXT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_stages_empresa_stage ON crm_stages(empresa_id, stage_id);

        CREATE TABLE IF NOT EXISTS crm_email_log (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            lead_id TEXT,
            to_email TEXT NOT NULL,
            cc TEXT DEFAULT '',
            bcc TEXT DEFAULT '',
            from_email TEXT NOT NULL,
            from_name TEXT DEFAULT '',
            subject TEXT NOT NULL,
            body_preview TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'sent',
            error_message TEXT DEFAULT '',
            provider TEXT DEFAULT 'smtp',
            message_id TEXT DEFAULT '',
            attachments_count INTEGER DEFAULT 0,
            tracking_token TEXT DEFAULT '',
            opened_at TEXT,
            open_count INTEGER DEFAULT 0,
            user_agent TEXT DEFAULT '',
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS mail_settings (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            host TEXT NOT NULL DEFAULT '',
            port INTEGER DEFAULT 587,
            secure INTEGER DEFAULT 0,
            user TEXT DEFAULT '',
            pass TEXT DEFAULT '',
            from_name TEXT DEFAULT '',
            from_email TEXT DEFAULT '',
            created_at TEXT,
            updated_at TEXT
        );
    `);

    // Migration: add interacoes column to existing pipeline_items tables
    try { db.exec('ALTER TABLE pipeline_items ADD COLUMN interacoes TEXT'); } catch (e) { /* column may already exist */ }

    // Migration: add vendedor column to pipeline_items
    try { db.exec("ALTER TABLE pipeline_items ADD COLUMN vendedor TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    // Migration: add login_theme column to settings (for login customization)
    try { db.exec("ALTER TABLE settings ADD COLUMN login_theme TEXT DEFAULT '{}'"); } catch (e) { /* column may already exist */ }

    // Migration: add codigo_cliente column to clientes (for AUTPRO numbering)
    try { db.exec("ALTER TABLE clientes ADD COLUMN codigo_cliente TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    // Migration: add probability column to crm_stages (for weighted forecast)
    try { db.exec("ALTER TABLE crm_stages ADD COLUMN probability INTEGER DEFAULT 0"); } catch (e) { /* column may already exist */ }

    // Migration: add anexos column to crm_interacoes (for file attachments)
    try { db.exec("ALTER TABLE crm_interacoes ADD COLUMN anexos TEXT DEFAULT '[]'"); } catch (e) { /* column may already exist */ }

    // Migration: add meta_mensal column to vendedores
    try { db.exec("ALTER TABLE vendedores ADD COLUMN meta_mensal REAL DEFAULT 0"); } catch (e) { /* column may already exist */ }

    // Migration: add logo column to clientes table
    try { db.exec("ALTER TABLE clientes ADD COLUMN logo TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    // Migration: add ai columns to existing settings table
    try { db.exec('ALTER TABLE settings ADD COLUMN ai_provider TEXT DEFAULT \'ollama\''); } catch (e) { /* column may already exist */ }
    try { db.exec('ALTER TABLE settings ADD COLUMN ai_model TEXT DEFAULT \'qwen2.5:14b\''); } catch (e) { /* column may already exist */ }
    try { db.exec('ALTER TABLE settings ADD COLUMN ai_key TEXT DEFAULT \'\''); } catch (e) { /* column may already exist */ }
    try { db.exec('ALTER TABLE settings ADD COLUMN ai_ollama_url TEXT DEFAULT \'http://localhost:11434\''); } catch (e) { /* column may already exist */ }
    // Migration: add address detail columns to existing settings table
    try { db.exec("ALTER TABLE settings ADD COLUMN company_logradouro TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE settings ADD COLUMN company_numero TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE settings ADD COLUMN company_cep TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE settings ADD COLUMN company_cidade TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE settings ADD COLUMN company_uf TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    // Migration: add vendor_defaults column to settings
    try { db.exec("ALTER TABLE settings ADD COLUMN vendor_defaults TEXT DEFAULT '[]'"); } catch (e) { /* column may already exist */ }
    // Migration: add telegram_bot_token column to settings
    try { db.exec("ALTER TABLE settings ADD COLUMN telegram_bot_token TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    // Migration: add template columns to settings
    try { db.exec("ALTER TABLE settings ADD COLUMN template_tecnica TEXT DEFAULT 'TEMPLATE_TEC_EMP1.docx'"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE settings ADD COLUMN template_comercial TEXT DEFAULT 'TEMPLATE_COM.docx'"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE settings ADD COLUMN template_completa TEXT DEFAULT 'TEMPLATE_TEC_COM.docx'"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE settings ADD COLUMN company_color TEXT DEFAULT '#0055AA'"); } catch (e) { /* column may already exist */ }
    // Migration: add tipo, revisao, consolidada columns to pipeline_items
    try { db.exec("ALTER TABLE pipeline_items ADD COLUMN tipo TEXT DEFAULT 'tecnica_comercial'"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE pipeline_items ADD COLUMN revisao INT DEFAULT 0"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE pipeline_items ADD COLUMN consolidada INT DEFAULT 0"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE pipeline_items ADD COLUMN engenheiro_responsavel TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE pipeline_items ADD COLUMN data_entrega TEXT"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE pipeline_items ADD COLUMN descricao_revisao TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    // CRM migrations
    try { db.exec("ALTER TABLE crm_interacoes ADD COLUMN empresa_id TEXT NOT NULL DEFAULT 'default'"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE crm_tarefas ADD COLUMN empresa_id TEXT NOT NULL DEFAULT 'default'"); } catch (e) { /* column may already exist */ }

    // Migration: add provider and api_key to mail_settings
    try { db.exec("ALTER TABLE mail_settings ADD COLUMN provider TEXT DEFAULT 'smtp'"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE mail_settings ADD COLUMN api_key TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    // Migration: add tracking columns to crm_email_log
    try { db.exec("ALTER TABLE crm_email_log ADD COLUMN tracking_token TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE crm_email_log ADD COLUMN opened_at TEXT"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE crm_email_log ADD COLUMN open_count INTEGER DEFAULT 0"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE crm_email_log ADD COLUMN user_agent TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("CREATE INDEX IF NOT EXISTS idx_crm_email_log_tracking ON crm_email_log(tracking_token)"); } catch (e) { /* column not yet migrated */ }

    // Migration: add sigla to empresas table
    try { db.exec("ALTER TABLE empresas ADD COLUMN sigla TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    // Migration: add folder_name to empresas table
    try { db.exec("ALTER TABLE empresas ADD COLUMN folder_name TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    // Mail settings table
    try { db.exec(`
        CREATE TABLE IF NOT EXISTS mail_settings (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            host TEXT NOT NULL DEFAULT '',
            port INTEGER DEFAULT 587,
            secure INTEGER DEFAULT 0,
            user TEXT DEFAULT '',
            pass TEXT DEFAULT '',
            from_name TEXT DEFAULT '',
            from_email TEXT DEFAULT '',
            created_at TEXT,
            updated_at TEXT
        )
    `); } catch (e) { /* table may already exist */ }

    // Manufatura tables
    try { db.exec(`
        CREATE TABLE IF NOT EXISTS manufatura_projetos (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            nome TEXT NOT NULL DEFAULT '',
            cliente TEXT DEFAULT '',
            proposta_tecnica_id TEXT DEFAULT '',
            data_criacao TEXT,
            status TEXT DEFAULT 'em_andamento',
            etapa TEXT DEFAULT 'inicio',
            observacoes TEXT DEFAULT '',
            created_at TEXT,
            updated_at TEXT
        )
    `); } catch (e) { /* table may already exist */ }

    try { db.exec(`
        CREATE TABLE IF NOT EXISTS manufatura_colunas (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            projeto_id TEXT NOT NULL,
            tag TEXT NOT NULL DEFAULT '',
            tipo TEXT DEFAULT 'CCM-BT',
            posicao INTEGER DEFAULT 0,
            status TEXT DEFAULT 'em_andamento',
            etapa TEXT DEFAULT 'montagem_mecanica',
            dados_adicionais TEXT DEFAULT '{}',
            created_at TEXT,
            updated_at TEXT
        )
    `); } catch (e) { /* table may already exist */ }

    try { db.exec(`
        CREATE TABLE IF NOT EXISTS manufatura_gavetas (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            coluna_id TEXT NOT NULL,
            tag TEXT NOT NULL DEFAULT '',
            posicao INTEGER DEFAULT 0,
            tipo TEXT DEFAULT 'partida_direta',
            modelo TEXT DEFAULT '',
            potencia_kw REAL DEFAULT 0,
            status TEXT DEFAULT 'em_andamento',
            etapa TEXT DEFAULT 'montagem_mecanica',
            componentes TEXT DEFAULT '[]',
            dados_adicionais TEXT DEFAULT '{}',
            created_at TEXT,
            updated_at TEXT
        )
    `); } catch (e) { /* table may already exist */ }

    try { db.exec(`
        CREATE TABLE IF NOT EXISTS manufatura_componentes (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            gaveta_id TEXT NOT NULL,
            tipo TEXT DEFAULT '',
            codigo TEXT DEFAULT '',
            fabricante TEXT DEFAULT '',
            quantidade INTEGER DEFAULT 1,
            observacoes TEXT DEFAULT '',
            created_at TEXT,
            updated_at TEXT
        )
    `); } catch (e) { /* table may already exist */ }

    try { db.exec(`
        CREATE TABLE IF NOT EXISTS manufatura_historico (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            entidade_tipo TEXT NOT NULL,
            entidade_id TEXT NOT NULL,
            acao TEXT NOT NULL,
            usuario TEXT DEFAULT '',
            dados TEXT DEFAULT '{}',
            created_at TEXT
        )
    `); } catch (e) { /* table may already exist */ }

    try { db.exec(`
        CREATE TABLE IF NOT EXISTS manufatura_perfis_teste (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            nome TEXT NOT NULL DEFAULT '',
            tipo_gaveta TEXT NOT NULL DEFAULT '',
            parametros TEXT DEFAULT '{}',
            created_at TEXT,
            updated_at TEXT
        )
    `); } catch (e) { /* table may already exist */ }

    try { db.exec(`
        CREATE TABLE IF NOT EXISTS manufatura_resultados_teste (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            gaveta_id TEXT NOT NULL,
            perfil_id TEXT DEFAULT '',
            status TEXT DEFAULT 'pendente',
            resultados TEXT DEFAULT '{}',
            operador TEXT DEFAULT '',
            data_teste TEXT,
            observacoes TEXT DEFAULT '',
            created_at TEXT,
            updated_at TEXT
        )
    `); } catch (e) { /* table may already exist */ }

    try { db.exec(`
        CREATE TABLE IF NOT EXISTS manufatura_anexos (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL DEFAULT 'default',
            entidade_tipo TEXT NOT NULL,
            entidade_id TEXT NOT NULL,
            nome_arquivo TEXT NOT NULL DEFAULT '',
            tipo_arquivo TEXT DEFAULT '',
            tamanho_bytes INTEGER DEFAULT 0,
            caminho TEXT DEFAULT '',
            descricao TEXT DEFAULT '',
            usuario TEXT DEFAULT '',
            created_at TEXT
        )
    `); } catch (e) { /* table may already exist */ }

    // Migration: add created_at to usuarios
    try { db.exec("ALTER TABLE usuarios ADD COLUMN created_at TEXT"); } catch (e) { /* column may already exist */ }
    // Migration: add telegram_chat_id to usuarios
    try { db.exec("ALTER TABLE usuarios ADD COLUMN telegram_chat_id TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    // Migration: add dimension columns to existing materiais table
    try { db.exec("ALTER TABLE materiais ADD COLUMN largura_mm REAL DEFAULT 0"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE materiais ADD COLUMN altura_mm REAL DEFAULT 0"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE materiais ADD COLUMN profundidade_mm REAL DEFAULT 0"); } catch (e) { /* column may already exist */ }

    // Migration: add ufFornecedor to materiais table
    try { db.exec("ALTER TABLE materiais ADD COLUMN ufFornecedor TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    // Migration: add grupoSiemens to materiais table
    try { db.exec("ALTER TABLE materiais ADD COLUMN grupoSiemens TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    // Migration: add favorito to materiais table
    try { db.exec("ALTER TABLE materiais ADD COLUMN favorito INTEGER DEFAULT 0"); } catch (e) { /* column may already exist */ }

    // Migration: add dxf_block to materiais table
    try { db.exec("ALTER TABLE materiais ADD COLUMN dxf_block TEXT"); } catch (e) { /* column may already exist */ }

    // Migration: reset markup to 0 for all existing materials
    try { db.exec("UPDATE materiais SET markup = 0 WHERE markup IS NULL OR markup > 0"); } catch (e) { /* ignore */ }

    // Migration: add tensaoComando to tipicos table
    try { db.exec("ALTER TABLE tipicos ADD COLUMN tensaoComando TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    // Migration: add cubiculos columns
    try { db.exec("ALTER TABLE cubiculos ADD COLUMN correnteNominal TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE cubiculos ADD COLUMN nbi TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE cubiculos ADD COLUMN instalacao TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }
    try { db.exec("ALTER TABLE cubiculos ADD COLUMN releProtecao TEXT DEFAULT ''"); } catch (e) { /* column may already exist */ }

    try { db.exec("ALTER TABLE unidades_cliente ADD COLUMN contatos TEXT DEFAULT '[]'"); } catch (e) { /* column may already exist */ }
}

// --- Generic CRUD helpers ---

const TABLE_MAP = {
    clientes: { pk: 'id' },
    fornecedores: { pk: 'id' },
    materiais: { pk: 'id' },
    paineis: { pk: 'id' },
    tipicos: { pk: 'id' },
    cubiculos: { pk: 'id' },
    cargas: { pk: 'id' },
    orcamentos: { pk: 'id' },
    loadLists: { pk: 'id', table: 'load_lists' },
    chapariaLists: { pk: 'id', table: 'chaparia_lists' },
    propostasTecnicas: { pk: 'id', table: 'propostas_tecnicas', dados: true },
    propostasComerciais: { pk: 'id', table: 'propostas_comerciais', dados: true },
    propostasCompletas: { pk: 'id', table: 'propostas_completas', dados: true },
    pipelineItems: { pk: 'id', table: 'pipeline_items' },
    vendedores: { pk: 'id' },
    composicoes: { pk: 'id' },
    regrasDerivacao: { pk: 'id', table: 'regras_derivacao' },
    crmLeads: { pk: 'id', table: 'crm_leads' },
    crmInteracoes: { pk: 'id', table: 'crm_interacoes' },
    crmTarefas: { pk: 'id', table: 'crm_tarefas' },
    crmNotas: { pk: 'id', table: 'crm_notas' },
    crmWebhooks: { pk: 'id', table: 'crm_webhooks' },
    crmSequencias: { pk: 'id', table: 'crm_sequencias' },
    crmEmailTemplates: { pk: 'id', table: 'crm_email_templates' },
    crmStages: { pk: 'id', table: 'crm_stages' },
    manufaturaProjetos: { pk: 'id', table: 'manufatura_projetos' },
    manufaturaColunas: { pk: 'id', table: 'manufatura_colunas' },
    manufaturaGavetas: { pk: 'id', table: 'manufatura_gavetas' },
    manufaturaComponentes: { pk: 'id', table: 'manufatura_componentes' },
    manufaturaHistorico: { pk: 'id', table: 'manufatura_historico' },
    manufaturaPerfisTeste: { pk: 'id', table: 'manufatura_perfis_teste' },
    manufaturaResultadosTeste: { pk: 'id', table: 'manufatura_resultados_teste' },
    manufaturaAnexos: { pk: 'id', table: 'manufatura_anexos' },
    unidadesCliente: { pk: 'id', table: 'unidades_cliente' }
};

// --- System seed data (composicoes + regras, loaded on first run) ---

const SYSTEM_COMPOSICOES = [
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

const SYSTEM_REGRAS = [
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

function ensureSystemData() {
    const row = db.prepare('SELECT COUNT(*) as cnt FROM composicoes').get();
    if (row.cnt > 0) return;

    const now = new Date().toISOString();
    const insertComp = db.prepare(`INSERT OR IGNORE INTO composicoes
        (id, empresa_id, codigo, atividade, unidade, grupo, categoria_profissional,
         coeficiente_hh, fator_simples, fator_medio, fator_complexo, area_alocacao,
         created_at, updated_at)
        VALUES (?, 'default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const c of SYSTEM_COMPOSICOES) {
        insertComp.run(c.id, c.codigo, c.atividade, c.unidade, c.grupo,
            c.categoria_profissional, c.coeficiente_hh, c.fator_simples,
            c.fator_medio, c.fator_complexo, c.area_alocacao, now, now);
    }

    const insertRegra = db.prepare(`INSERT OR IGNORE INTO regras_derivacao
        (id, empresa_id, nome, tipo_equipamento, prioridade, regra_ativa,
         condicoes, acoes, created_at, updated_at)
        VALUES (?, 'default', ?, ?, ?, 1, ?, ?, ?, ?)`);

    for (const r of SYSTEM_REGRAS) {
        const id = crypto.randomUUID();
        insertRegra.run(id, r.nome, r.tipo_equipamento, r.prioridade,
            JSON.stringify(r.condicoes), JSON.stringify(r.acoes), now, now);
    }

    console.log('[DB] System data seeded: 50 composições, 14 regras de derivação.');

    // Seed default CRM stages if table is empty
    const stageCount = db.prepare('SELECT COUNT(*) as cnt FROM crm_stages').get();
    if (stageCount.cnt === 0) {
        const DEFAULT_STAGES = [
            { id: 'novo', label: 'Novo', color: '#6b7280', icon: 'ph-dot-outline', position: 0, is_default: 1, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: '[]', probability: 5 },
            { id: 'tentando_contato', label: 'Tentando Contato', color: '#f59e0b', icon: 'ph-phone-call', position: 1, is_default: 0, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: '[]', probability: 10 },
            { id: 'contato_realizado', label: 'Contato Realizado', color: '#3b82f6', icon: 'ph-chats', position: 2, is_default: 0, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: '[]', probability: 20 },
            { id: 'qualificado', label: 'Qualificado', color: '#8b5cf6', icon: 'ph-star', position: 3, is_default: 0, is_terminal: 0, allows_proposal: 1, tracks_qualificacao: 1, tracks_conversao: 0, is_loss: 0, loss_reasons: '[]', probability: 40 },
            { id: 'agendado_visita', label: 'Agendado', color: '#06b6d4', icon: 'ph-calendar-check', position: 4, is_default: 0, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: '[]', probability: 60 },
            { id: 'visita_realizada', label: 'Visita Realizada', color: '#10b981', icon: 'ph-map-pin', position: 5, is_default: 0, is_terminal: 0, allows_proposal: 1, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: '[]', probability: 70 },
            { id: 'virou_proposta', label: 'Virou Proposta', color: '#2563eb', icon: 'ph-file-arrow-up', position: 6, is_default: 0, is_terminal: 1, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 1, is_loss: 0, loss_reasons: '[]', probability: 90 },
            { id: 'desqualificado', label: 'Desqualificado', color: '#ef4444', icon: 'ph-x-circle', position: 7, is_default: 0, is_terminal: 1, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 1, loss_reasons: '["nao_qualificado","sem_orcamento","nao_decidiu","concorrente","sem_contato","nao_responde","outro"]', probability: 0 }
        ];
        const insertStage = db.prepare(`INSERT OR IGNORE INTO crm_stages
            (id, empresa_id, stage_id, label, color, icon, position, is_default, is_terminal, allows_proposal, tracks_qualificacao, tracks_conversao, is_loss, loss_reasons, probability, created_at, updated_at)
            VALUES (?, 'default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        for (const s of DEFAULT_STAGES) {
            insertStage.run(s.id, s.id, s.label, s.color, s.icon, s.position, s.is_default, s.is_terminal, s.allows_proposal, s.tracks_qualificacao, s.tracks_conversao, s.is_loss, s.loss_reasons, s.probability, now, now);
        }
    }
}

// Seed system data at module load (runs once per database lifetime)
ensureSystemData();

function getTableInfo(entity) {
    const info = TABLE_MAP[entity];
    if (!info) return null;
    return { table: info.table || entity, pk: info.pk, dados: !!info.dados };
}

const DADOS_BASE_KEYS = ['id', 'empresa_id', 'dados', 'createdAt', 'updatedAt'];

function findAll(entity, empresaId = 'default') {
    const info = getTableInfo(entity);
    if (!info) return [];
    const stmt = db.prepare(`SELECT * FROM ${info.table} WHERE empresa_id = ?`);
    const rows = stmt.all(empresaId);
    if (info.dados) {
        return rows.map(row => {
            if (row.dados && typeof row.dados === 'string') {
                const parsed = JSON.parse(row.dados);
                for (const k of Object.keys(parsed)) row[k] = parsed[k];
                delete row.dados;
            }
            return row;
        });
    }
    return rows;
}

function findById(entity, id) {
    const info = getTableInfo(entity);
    if (!info) return null;
    const stmt = db.prepare(`SELECT * FROM ${info.table} WHERE ${info.pk} = ?`);
    const row = stmt.get(id) || null;
    if (row && info.dados && row.dados && typeof row.dados === 'string') {
        const parsed = JSON.parse(row.dados);
        for (const k of Object.keys(parsed)) {
            row[k] = parsed[k];
        }
        delete row.dados;
    }
    return row;
}

function create(entity, data, empresaId = 'default') {
    const info = getTableInfo(entity);
    if (!info) return null;
    let record = { ...data, empresa_id: empresaId };
    const priceHistory = record.priceHistory;
    delete record.priceHistory;
    if (info.dados) {
        record.updatedAt = new Date().toISOString();
        if (!record.createdAt) record.createdAt = record.updatedAt;
    }
    if (info.dados) {
        const dados = {};
        for (const k of Object.keys(record)) {
            if (!DADOS_BASE_KEYS.includes(k)) {
                dados[k] = record[k];
                delete record[k];
            }
        }
        record.dados = JSON.stringify(dados);
    }
    const keys = Object.keys(record);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => {
        const v = record[k];
        return typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
    });
    const stmt = db.prepare(`INSERT OR REPLACE INTO ${info.table} (${keys.join(', ')}) VALUES (${placeholders})`);
    stmt.run(...values);
    if (priceHistory && Array.isArray(priceHistory)) {
        savePriceHistory(record.id, priceHistory);
    }
    return { ...record, ...(record.dados ? JSON.parse(record.dados) : {}), priceHistory: priceHistory || [] };
}

const SIEMENS_GROUP_MAP = {
  C00:'Disjuntor',C01:'Disjuntor',C02:'Disjuntor',C03:'Transformador',C05:'Disjuntor',
  C06:'Disjuntor',C08:'Disjuntor',C10:'Disjuntor',C11:'Instrumentação',C13:'Transformador',
  C14:'Disjuntor',C15:'Disjuntor',C17:'Disjuntor',C18:'Disjuntor',C19:'Disjuntor',
  C30:'Comando',C32:'Comando',C35:'Sinalização',C36:'PLC',C37:'Acessório',
  C38:'Contator',C39:'Contator',C40:'Contator',C41:'Relé',C42:'Relé',C43:'Relé',
  C44:'Relé',C45:'Relé',C46:'Disjuntor',C47:'Disjuntor',C48:'Comando',C49:'Soft-Starter',
  C51:'Disjuntor',C55:'Contator',C56:'Contator',C57:'Fonte',C59:'Contator',
  C61:'PLC',C62:'Acessório',C63:'Contator',C64:'Comando',C65:'Contator',
  C67:'Contator',C72:'Disjuntor',C74:'Disjuntor',C80:'Transformador',C81:'Transformador',
  C83:'Transformador',C89:'Relé',C91:'Relé',C94:'Contator',C96:'Contator',
  C97:'PLC',C98:'Acessório',C99:'Relé',CA2:'Contator',
  E03:'Software',EAA:'Disjuntor',EAB:'Disjuntor',EAC:'Disjuntor',EAF:'Disjuntor',
  EAG:'Disjuntor',EAH:'Disjuntor',EAJ:'Disjuntor',EAK:'Disjuntor',EAL:'Disjuntor',
  EAM:'Acessório',EAN:'Disjuntor',EBA:'Disjuntor',EBB:'Disjuntor',EBC:'Disjuntor',
  ECA:'Disjuntor',ECB:'Acessório',EDB:'Disjuntor',EDD:'Disjuntor',EDE:'Disjuntor',
  EDF:'Disjuntor',EDG:'Disjuntor',EDH:'Disjuntor',EDL:'Disjuntor',
  EEA:'Instrumentação',EEB:'Instrumentação',EEC:'Relé',EED:'Relé',EEE:'Relé',
  EEH:'Relé',EEI:'Relé',EEJ:'Disjuntor',EFA:'Disjuntor',EFB:'Disjuntor',
  EGA:'Disjuntor',ELA:'Cabo',ELB:'Acessório',EMD:'Acessório',EMG:'Acessório',
  EMI:'Disjuntor',EMJ:'Acessório',EML:'Acessório',EMM:'Acessório',EMZ:'Acessório',
  EOA:'Disjuntor',EOB:'Disjuntor',EOC:'Disjuntor',EOD:'Disjuntor',EOF:'Disjuntor',
  EOI:'Disjuntor',EOJ:'Disjuntor',
  A03:'PLC',A23:'Software',A33:'PLC',A34:'Acessório',A41:'PLC',A43:'PLC',A58:'PLC',
  B20:'Relé',B21:'Relé',G15:'Instrumentação',G16:'Instrumentação',
  I02:'Inversor',I03:'Inversor',I04:'Inversor',I07:'Inversor',I10:'Inversor',
  I12:'Inversor',I15:'Inversor',
  J02:'Instrumentação',J04:'Instrumentação',J06:'Instrumentação',J13:'Instrumentação',
  J14:'Instrumentação',J16:'Instrumentação',J18:'Instrumentação',J20:'Instrumentação',
  J71:'Instrumentação',J76:'Instrumentação',J77:'Instrumentação',J78:'Instrumentação',
  K02:'PLC',K10:'PLC',K11:'PLC',K20:'Inversor',K21:'Inversor',K24:'Inversor',
  K25:'Inversor',K26:'Inversor',K29:'Inversor',K30:'Inversor',K31:'Inversor',
  K32:'Inversor',K33:'Inversor',K34:'Inversor',K36:'Inversor',K37:'PLC',
  K40:'Inversor',K41:'Software',K42:'Inversor',K45:'Acessório',K50:'Inversor',
  K53:'Inversor',K54:'Inversor',K57:'Inversor',K58:'Inversor',K59:'Inversor',
  K63:'Instrumentação',K64:'Inversor',K65:'Instrumentação',K68:'Software',
  Z10:'PLC',Z12:'Instrumentação',Z13:'PLC',Z14:'PLC',Z15:'PLC',Z16:'PLC',
  Z17:'PLC',Z18:'PLC',Z19:'PLC',Z22:'PLC',Z24:'Software',Z31:'PLC',Z32:'PLC',
  Z37:'Software',Z38:'PLC',Z50:'Acessório',Z51:'Acessório',Z70:'Fonte',Z71:'Fonte'
};

function mapSiemensCategory(grupo) {
  if (!grupo) return null;
  const key = String(grupo).trim().toUpperCase();
  return SIEMENS_GROUP_MAP[key] || null;
}

function bulkImportMateriais(items, empresaId = 'default') {
    const info = getTableInfo('materiais');
    if (!info) return { addedIds: [], updatedIds: [], snapshots: {} };
    const now = new Date().toISOString();
    const addedIds = [];
    const updatedIds = [];
    const snapshots = {};

    const itemKeys = items.length > 0 ? Object.keys(items[0]) : [];
    const fixedCols = ['empresa_id', 'lastUpdateDate', 'lastUpdateTitle', 'createdAt', info.pk];
    const allCols = [...new Set([...itemKeys, ...fixedCols])].filter(k => k !== 'priceHistory');
    const updateCols = allCols.filter(k => k !== info.pk && k !== 'empresa_id' && k !== 'createdAt');

    const updateSetClause = updateCols.map(k => `${k} = ?`).join(', ');
    const updateStmt = db.prepare(`UPDATE ${info.table} SET ${updateSetClause} WHERE ${info.pk} = ? AND empresa_id = ?`);

    const insertPlaceholders = allCols.map(() => '?').join(', ');
    const insertStmt = db.prepare(`INSERT OR REPLACE INTO ${info.table} (${allCols.join(', ')}) VALUES (${insertPlaceholders})`);

    const getVal = (obj, k) => {
        const v = obj[k];
        return typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
    };

    const findByCodeStmt = db.prepare('SELECT * FROM materiais WHERE (codigoInterno = ? OR codigoFabricante = ?) AND empresa_id = ? LIMIT 1');

    db.exec('BEGIN TRANSACTION');
    try {
        for (const item of items) {
            // Server-side category remap: if categoria is NCM-like and grupoSiemens is available, remap
            if (item.grupoSiemens && item.categoria) {
                const cat = String(item.categoria).trim();
                if (/^\d+\s*-/.test(cat) || cat.toLowerCase() === 'outros') {
                    const mapped = mapSiemensCategory(item.grupoSiemens);
                    if (mapped) item.categoria = mapped;
                }
            }

            const rawCode = (item.codigoInterno || item.codigoFabricante || '').toLowerCase().trim();
            let existingMaterial = null;
            if (rawCode) {
                const codeA = item.codigoInterno ? String(item.codigoInterno).trim() : '';
                const codeB = item.codigoFabricante ? String(item.codigoFabricante).trim() : '';
                const params = [];
                if (codeA && codeB) {
                    existingMaterial = findByCodeStmt.get(codeA, codeB, empresaId);
                } else if (codeA) {
                    const byCode = db.prepare('SELECT * FROM materiais WHERE codigoInterno = ? AND empresa_id = ? LIMIT 1');
                    existingMaterial = byCode.get(codeA, empresaId);
                } else if (codeB) {
                    const byCode = db.prepare('SELECT * FROM materiais WHERE codigoFabricante = ? AND empresa_id = ? LIMIT 1');
                    existingMaterial = byCode.get(codeB, empresaId);
                }
            }

            if (existingMaterial) {
                const merged = { ...existingMaterial, ...item, lastUpdateDate: now, lastUpdateTitle: 'Atualização via Importação' };
                const values = updateCols.map(k => getVal(merged, k));
                updateStmt.run(...values, existingMaterial.id, empresaId);
                snapshots[existingMaterial.id] = JSON.parse(JSON.stringify(existingMaterial));
                updatedIds.push(existingMaterial.id);
            } else {
                const record = {
                    ...item,
                    id: item.id || crypto.randomUUID(),
                    empresa_id: empresaId,
                    createdAt: now,
                    lastUpdateDate: now,
                    lastUpdateTitle: 'Criação via Importação'
                };
                const values = allCols.map(k => getVal(record, k));
                insertStmt.run(...values);
                addedIds.push(record.id);
            }
        }
        db.exec('COMMIT');
    } catch (e) {
        db.exec('ROLLBACK');
        throw e;
    }

    return { addedIds, updatedIds, snapshots };
}

function update(entity, id, data) {
    const info = getTableInfo(entity);
    if (!info) return null;
    const existing = findById(entity, id);
    if (!existing) return null;
    const priceHistory = data.priceHistory;
    const dataClean = priceHistory ? { ...data } : data;
    if (priceHistory) delete dataClean.priceHistory;
    const merged = { ...existing, ...dataClean };
    let record;
    if (info.dados) {
        merged.updatedAt = new Date().toISOString();
        const base = {};
        const dados = {};
        for (const k of Object.keys(merged)) {
            if (DADOS_BASE_KEYS.includes(k)) {
                base[k] = merged[k];
            } else {
                dados[k] = merged[k];
            }
        }
        base.dados = JSON.stringify(dados);
        record = base;
    } else {
        record = merged;
    }
    const keys = Object.keys(record).filter(k => k !== info.pk && k !== 'empresa_id');
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => {
        const v = record[k];
        return typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
    });
    const stmt = db.prepare(`UPDATE ${info.table} SET ${setClause} WHERE ${info.pk} = ? AND empresa_id = ?`);
    stmt.run(...values, id, record.empresa_id || 'default');
    if (priceHistory && Array.isArray(priceHistory)) {
        savePriceHistory(id, priceHistory);
    }
    return { ...record, ...(record.dados ? JSON.parse(record.dados) : {}), priceHistory: priceHistory || existing.priceHistory || [] };
}

function remove(entity, id) {
    const info = getTableInfo(entity);
    if (!info) return false;
    const stmt = db.prepare(`DELETE FROM ${info.table} WHERE ${info.pk} = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
}

// --- Specialized helpers ---

function getPriceHistory(materialId) {
    const stmt = db.prepare('SELECT * FROM price_history WHERE material_id = ? ORDER BY date DESC');
    return stmt.all(materialId);
}

function savePriceHistory(materialId, entries) {
    const del = db.prepare('DELETE FROM price_history WHERE material_id = ?');
    const ins = db.prepare('INSERT INTO price_history (material_id, custo, markup, date, title, origin) VALUES (?, ?, ?, ?, ?, ?)');
    del.run(materialId);
    const tx = db.transaction(() => {
        for (const entry of entries) {
            ins.run(materialId, entry.custo, entry.markup, entry.date, entry.title, entry.origin || 'manual');
        }
    });
    tx();
}

function getSettings(empresaId = 'default') {
    const stmt = db.prepare('SELECT * FROM settings WHERE empresa_id = ?');
    const row = stmt.get(empresaId);
    if (!row) return null;
    let loginTheme = {};
    try { loginTheme = JSON.parse(row.login_theme || '{}'); } catch (e) {}
    return {
        theme: row.theme || 'light',
        defaultMarkup: row.defaultMarkup || 30,
        defaultTax: row.defaultTax || 18,
        defaultIpi: row.defaultIpi || 9.75,
        company_name: row.company_name || '',
        company_cnpj: row.company_cnpj || '',
        company_address: row.company_address || '',
        company_logradouro: row.company_logradouro || '',
        company_numero: row.company_numero || '',
        company_cep: row.company_cep || '',
        company_cidade: row.company_cidade || '',
        company_uf: row.company_uf || '',
        company_email: row.company_email || '',
        company_logoUrl: row.company_logoUrl || '',
        company_regimeTributario: row.company_regimeTributario || 'Lucro Real',
        company_color: row.company_color || '',
            loginTheme,
            vendor_defaults: row.vendor_defaults || '[]',
            telegram_bot_token: row.telegram_bot_token || '',
            template_tecnica: row.template_tecnica || 'TEMPLATE_TEC.docx',
            template_comercial: row.template_comercial || 'TEMPLATE_COM.docx',
            template_completa: row.template_completa || 'TEMPLATE_TEC_COM.docx'
        };
    }

function getAiSettings(empresaId = 'default') {
    const stmt = db.prepare('SELECT * FROM ai_settings WHERE empresa_id = ?');
    const row = stmt.get(empresaId);
    if (row) {
        return {
            provider: row.provider || 'ollama',
            model: row.model || 'qwen2.5:14b',
            apiKey: row.api_key || '',
            ollamaUrl: row.ollama_url || 'http://localhost:11434'
        };
    }
    return { provider: 'ollama', model: 'qwen2.5:14b', apiKey: '', ollamaUrl: 'http://localhost:11434' };
}

function saveAiSettings(data, empresaId = 'default') {
    const existing = db.prepare('SELECT * FROM ai_settings WHERE empresa_id = ?').get(empresaId);
    if (existing) {
        const stmt = db.prepare(`UPDATE ai_settings SET provider = ?, model = ?, api_key = ?, ollama_url = ?, updatedAt = ? WHERE empresa_id = ?`);
        stmt.run(
            data.provider || 'ollama',
            data.model || 'qwen2.5:14b',
            data.apiKey || '',
            data.ollamaUrl || 'http://localhost:11434',
            new Date().toISOString(),
            empresaId
        );
    } else {
        const stmt = db.prepare(`INSERT INTO ai_settings (empresa_id, provider, model, api_key, ollama_url, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`);
        stmt.run(
            empresaId,
            data.provider || 'ollama',
            data.model || 'qwen2.5:14b',
            data.apiKey || '',
            data.ollamaUrl || 'http://localhost:11434',
            new Date().toISOString()
        );
    }
}

function saveSettings(data, empresaId = 'default') {
    const existing = db.prepare('SELECT * FROM settings WHERE empresa_id = ?').get(empresaId);
    if (existing) {
        const fields = [
            'theme', 'defaultMarkup', 'defaultTax', 'defaultIpi',
            'company_name', 'company_cnpj', 'company_address', 'company_logradouro',
            'company_numero', 'company_cep', 'company_cidade', 'company_uf',
            'company_email', 'company_logoUrl', 'company_regimeTributario', 'company_color',
            'vendor_defaults', 'telegram_bot_token',
            'template_tecnica', 'template_comercial', 'template_completa'
        ];
        for (const f of fields) {
            if (data[f] === undefined) data[f] = existing[f];
        }
        if (data.loginTheme === undefined && existing.login_theme) {
            try { data.loginTheme = JSON.parse(existing.login_theme); } catch (e) { data.loginTheme = {}; }
        }
    }
    const loginThemeJson = data.loginTheme ? JSON.stringify(data.loginTheme) : '{}';
    if (existing) {
        const stmt = db.prepare(`UPDATE settings SET theme = ?, defaultMarkup = ?, defaultTax = ?, defaultIpi = ?,
            company_name = ?, company_cnpj = ?, company_address = ?, company_logradouro = ?, company_numero = ?, company_cep = ?, company_cidade = ?, company_uf = ?, company_email = ?, company_logoUrl = ?, company_regimeTributario = ?, company_color = ?,
            login_theme = ?, vendor_defaults = ?, telegram_bot_token = ?,
            template_tecnica = ?, template_comercial = ?, template_completa = ?
            WHERE empresa_id = ?`);
        stmt.run(
            data.theme || 'light', data.defaultMarkup ?? 30, data.defaultTax ?? 18, data.defaultIpi ?? 9.75,
            data.company_name || '', data.company_cnpj || '', data.company_address || '',
            data.company_logradouro || '', data.company_numero || '', data.company_cep || '', data.company_cidade || '', data.company_uf || '',
            data.company_email || '',
            data.company_logoUrl || '', data.company_regimeTributario || 'Lucro Real',
            data.company_color || '',
            loginThemeJson,
            data.vendor_defaults || '[]',
            data.telegram_bot_token || '',
            data.template_tecnica || 'TEMPLATE_TEC.docx',
            data.template_comercial || 'TEMPLATE_COM.docx',
            data.template_completa || 'TEMPLATE_TEC_COM.docx',
            empresaId
        );
    } else {
        const stmt = db.prepare(`INSERT INTO settings (empresa_id, theme, defaultMarkup, defaultTax, defaultIpi,
            company_name, company_cnpj, company_address, company_logradouro, company_numero, company_cep, company_cidade, company_uf, company_email, company_logoUrl, company_regimeTributario, company_color,
            login_theme, vendor_defaults, telegram_bot_token,
            template_tecnica, template_comercial, template_completa)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run(
            empresaId, data.theme || 'light', data.defaultMarkup ?? 30, data.defaultTax ?? 18, data.defaultIpi ?? 9.75,
            data.company_name || '', data.company_cnpj || '', data.company_address || '',
            data.company_logradouro || '', data.company_numero || '', data.company_cep || '', data.company_cidade || '', data.company_uf || '',
            data.company_email || '',
            data.company_logoUrl || '', data.company_regimeTributario || 'Lucro Real',
            data.company_color || '',
            loginThemeJson,
            data.vendor_defaults || '[]',
            data.telegram_bot_token || '',
            data.template_tecnica || 'TEMPLATE_TEC.docx',
            data.template_comercial || 'TEMPLATE_COM.docx',
            data.template_completa || 'TEMPLATE_TEC_COM.docx'
        );
    }
}

function saveLoginTheme(loginTheme, empresaId = 'default') {
    const existing = db.prepare('SELECT * FROM settings WHERE empresa_id = ?').get(empresaId);
    const loginThemeJson = JSON.stringify(loginTheme || {});
    if (existing) {
        db.prepare('UPDATE settings SET login_theme = ? WHERE empresa_id = ?').run(loginThemeJson, empresaId);
    } else {
        db.prepare(`INSERT INTO settings (empresa_id, login_theme) VALUES (?, ?)`).run(empresaId, loginThemeJson);
    }
}

function getNextProposalNumber() {
    const d = new Date();
    const hoje = String(d.getFullYear()).slice(-2) +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0');
    const row = db.prepare('SELECT * FROM proposal_counters WHERE data = ?').get(hoje);
    const seq = row ? row.sequencial + 1 : 1;
    if (row) {
        db.prepare('UPDATE proposal_counters SET sequencial = ? WHERE data = ?').run(seq, hoje);
    } else {
        db.prepare('INSERT INTO proposal_counters (data, sequencial) VALUES (?, ?)').run(hoje, seq);
    }
    return hoje + String(seq).padStart(2, '0');
}

function peekNextProposalNumber() {
    const d = new Date();
    const hoje = String(d.getFullYear()).slice(-2) +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0');
    const row = db.prepare('SELECT * FROM proposal_counters WHERE data = ?').get(hoje);
    const seq = row ? row.sequencial + 1 : 1;
    return hoje + String(seq).padStart(2, '0');
}

function getUnidadesByCliente(clienteId, empresaId) {
    const stmt = db.prepare('SELECT * FROM unidades_cliente WHERE cliente_id = ? AND empresa_id = ? ORDER BY codigo_unidade');
    return stmt.all(clienteId, empresaId);
}

function peekNextAutproSequence(clienteId, codigoUnidade, empresaId) {
    const stmt = db.prepare('SELECT * FROM unidades_cliente WHERE cliente_id = ? AND codigo_unidade = ? AND empresa_id = ?');
    const unidade = stmt.get(clienteId, codigoUnidade, empresaId);
    if (!unidade) return null;
    return String(unidade.proximo_sequencial).padStart(3, '0');
}

function consumeNextAutproSequence(clienteId, codigoUnidade, empresaId) {
    const stmt = db.prepare('SELECT * FROM unidades_cliente WHERE cliente_id = ? AND codigo_unidade = ? AND empresa_id = ?');
    const unidade = stmt.get(clienteId, codigoUnidade, empresaId);
    if (!unidade) return null;
    const seq = unidade.proximo_sequencial;
    db.prepare('UPDATE unidades_cliente SET proximo_sequencial = ?, updatedAt = ? WHERE id = ?')
        .run(seq + 1, new Date().toISOString(), unidade.id);
    return String(seq).padStart(3, '0');
}

function updatePipelineRevision(id, data, empresaId = 'default') {
    const existing = db.prepare('SELECT * FROM pipeline_items WHERE id = ? AND empresa_id = ?').get(id, empresaId);
    if (existing?.status === 'fechado') return;
    if (existing) {
        const stmt = db.prepare(`UPDATE pipeline_items SET revisao = ?, consolidada = ?, status = ?, tipo = ?, data_entrega = ?, descricao_revisao = ?, updatedAt = ? WHERE id = ? AND empresa_id = ?`);
        stmt.run(
            data.revisao ?? existing.revisao ?? 0,
            data.consolidada ?? existing.consolidada ?? 0,
            data.status || existing.status,
            data.tipo || existing.tipo,
            data.data_entrega ?? existing.data_entrega ?? '',
            data.descricao_revisao ?? existing.descricao_revisao ?? '',
            new Date().toISOString(),
            id,
            empresaId
        );
    }
}

function getPriceImportTemplates(empresaId = 'default') {
    const stmt = db.prepare('SELECT * FROM price_import_templates WHERE empresa_id = ?');
    const rows = stmt.all(empresaId);
    const result = {};
    for (const row of rows) {
        result[row.fornecedor_id] = {
            name: row.name,
            fabricante: row.fabricante,
            columns: JSON.parse(row.columns || '{}'),
            updatedAt: row.updatedAt
        };
    }
    return result;
}

function savePriceImportTemplate(fornecedorId, data, empresaId = 'default') {
    const stmt = db.prepare(`INSERT OR REPLACE INTO price_import_templates
        (fornecedor_id, empresa_id, name, fabricante, columns, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run(
        fornecedorId, empresaId,
        data.name || '', data.fabricante || '',
        JSON.stringify(data.columns || {}),
        new Date().toISOString()
    );
}

function deletePriceImportTemplate(fornecedorId, empresaId = 'default') {
    const stmt = db.prepare('DELETE FROM price_import_templates WHERE fornecedor_id = ? AND empresa_id = ?');
    stmt.run(fornecedorId, empresaId);
}

// --- Full sync ---

function getFullSync(empresaId = 'default') {
    const settings = getSettings(empresaId);
    const stmtSettings = db.prepare('SELECT * FROM settings WHERE empresa_id = ?');
    const s = stmtSettings.get(empresaId);

    const materiais = findAll('materiais', empresaId);
    const materialIds = materiais.map(m => m.id);
    const priceHistoryMap = {};
    if (materialIds.length > 0) {
        const CHUNK_SIZE = 999;
        for (let i = 0; i < materialIds.length; i += CHUNK_SIZE) {
            const chunk = materialIds.slice(i, i + CHUNK_SIZE);
            const placeholders = chunk.map(() => '?').join(',');
            const phRows = db.prepare(`SELECT * FROM price_history WHERE material_id IN (${placeholders}) ORDER BY date DESC`).all(...chunk);
            for (const ph of phRows) {
                if (!priceHistoryMap[ph.material_id]) priceHistoryMap[ph.material_id] = [];
                priceHistoryMap[ph.material_id].push(ph);
            }
        }
    }
    for (const m of materiais) {
        m.priceHistory = priceHistoryMap[m.id] || [];
    }

    return {
        clientes: findAll('clientes', empresaId),
        fornecedores: findAll('fornecedores', empresaId),
        materiais,
        paineis: findAll('paineis', empresaId).map(p => {
            if (p.items && typeof p.items === 'string') p.items = JSON.parse(p.items);
            return p;
        }),
        tipicos: findAll('tipicos', empresaId).map(t => {
            if (t.items && typeof t.items === 'string') t.items = JSON.parse(t.items);
            return t;
        }),
        cubiculos: findAll('cubiculos', empresaId).map(t => {
            if (t.items && typeof t.items === 'string') t.items = JSON.parse(t.items);
            return t;
        }),
        cargas: findAll('cargas', empresaId),
        orcamentos: findAll('orcamentos', empresaId).map(o => {
            if (o.items && typeof o.items === 'string') o.items = JSON.parse(o.items);
            return o;
        }),
        loadLists: findAll('loadLists', empresaId).map(l => {
            if (l.items && typeof l.items === 'string') l.items = JSON.parse(l.items);
            return l;
        }),
        chapariaLists: findAll('chapariaLists', empresaId).map(l => {
            if (l.items && typeof l.items === 'string') l.items = JSON.parse(l.items);
            return l;
        }),
        propostasTecnicas: findAll('propostasTecnicas', empresaId).map(p => {
            if (p.dados && typeof p.dados === 'string') p = { ...p, ...JSON.parse(p.dados) };
            delete p.dados;
            return p;
        }).filter(p => p.id && !(/^PT-\d{13}$/.test(p.id) && !p.ptc_folder && !p.ptcFolder)),
        pipelineItems: findAll('pipelineItems', empresaId).map(p => {
            if (p.interacoes && typeof p.interacoes === 'string') p.interacoes = JSON.parse(p.interacoes);
            return p;
        }),
        propostasComerciais: findAll('propostasComerciais', empresaId).map(p => {
            if (p.dados && typeof p.dados === 'string') p = { ...p, ...JSON.parse(p.dados) };
            delete p.dados;
            return p;
        }).filter(p => p.id && !(/^PC-\d{13}$/.test(p.id) && !p.ptc_folder && !p.ptcFolder)),
        propostasCompletas: findAll('propostasCompletas', empresaId).map(p => {
            if (p.dados && typeof p.dados === 'string') p = { ...p, ...JSON.parse(p.dados) };
            delete p.dados;
            return p;
        }),
        vendedores: findAll('vendedores', empresaId),
        composicoes: findAll('composicoes', empresaId),
        regrasDerivacao: findAll('regrasDerivacao', empresaId),
        settings: settings || { theme: 'light', defaultMarkup: 30, defaultTax: 18, defaultIpi: 9.75 },
        aiSettings: getAiSettings(empresaId),
        company: {
            name: s?.company_name || '',
            cnpj: s?.company_cnpj || '',
            sigla: (() => { try { const e = findEmpresaById(empresaId); return e?.sigla || ''; } catch { return ''; } })(),
            nome: (() => { try { const e = findEmpresaById(empresaId); return e?.nome || ''; } catch { return ''; } })(),
            empresaId,
            folderName: (() => { try { const e = findEmpresaById(empresaId); return e?.folder_name || empresaId; } catch { return empresaId; } })(),
            address: s?.company_address || '',
            logradouro: s?.company_logradouro || '',
            numero: s?.company_numero || '',
            cep: s?.company_cep || '',
            cidade: s?.company_cidade || '',
            uf: s?.company_uf || '',
            email: s?.company_email || '',
            logoUrl: s?.company_logoUrl || '',
            regimeTributario: s?.company_regimeTributario || 'Lucro Real',
            vendorDefaults: s?.vendor_defaults || '[]',
            templateTecnica: s?.template_tecnica || 'TEMPLATE_TEC_EMP1.docx',
            templateComercial: s?.template_comercial || 'TEMPLATE_COM.docx',
            templateCompleta: s?.template_completa || 'TEMPLATE_TEC_COM.docx',
            companyColor: s?.company_color || ''
        },
        loginTheme: (() => { try { return JSON.parse(s?.login_theme || '{}'); } catch (e) { return {}; } })(),
        priceImportTemplates: getPriceImportTemplates(empresaId),
        crmLeads: findAll('crmLeads', empresaId).map(l => {
            if (l.tags && typeof l.tags === 'string') l.tags = JSON.parse(l.tags);
            return l;
        }),
        crmInteracoes: findAll('crmInteracoes', empresaId),
        crmTarefas: findAll('crmTarefas', empresaId),
        crmEmailTemplates: findAll('crmEmailTemplates', empresaId),
        crmStages: findAll('crmStages', empresaId),
        manufaturaProjetos: findAll('manufaturaProjetos', empresaId),
        manufaturaColunas: findAll('manufaturaColunas', empresaId),
        manufaturaGavetas: findAll('manufaturaGavetas', empresaId),
        manufaturaComponentes: findAll('manufaturaComponentes', empresaId),
        manufaturaHistorico: findAll('manufaturaHistorico', empresaId),
        manufaturaPerfisTeste: findAll('manufaturaPerfisTeste', empresaId),
        manufaturaResultadosTeste: findAll('manufaturaResultadosTeste', empresaId),
        manufaturaAnexos: findAll('manufaturaAnexos', empresaId),
        unidadesCliente: findAll('unidadesCliente', empresaId)
    };
}

// --- Migration from localStorage ---

// --- Empresa / Usuario CRUD ---

function createEmpresa(data) {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const folderName = generateFolderName(id, data.sigla, data.nome);
    const stmt = db.prepare(`INSERT OR REPLACE INTO empresas (id, nome, cnpj, sigla, plano, ativo, folder_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(id, data.nome || '', data.cnpj || '', data.sigla || '', data.plano || 'trial', data.ativo !== false ? 1 : 0, folderName, now);
    return { id, nome: data.nome, cnpj: data.cnpj, sigla: data.sigla, plano: data.plano, folder_name: folderName, ativo: true, created_at: now };
}

function generateFolderName(id, sigla, nome) {
    const prefix = (sigla || nome || 'empresa')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 20)
        || 'EMP';
    const shortId = id.substring(0, 8);
    return `${prefix}_${shortId}`;
}

function listEmpresas() {
    const stmt = db.prepare('SELECT * FROM empresas ORDER BY nome');
    return stmt.all();
}

function findEmpresaById(id) {
    const stmt = db.prepare('SELECT * FROM empresas WHERE id = ?');
    return stmt.get(id) || null;
}

function backfillFolderNames() {
    const empresas = listEmpresas();
    let count = 0;
    for (const emp of empresas) {
        if (!emp.folder_name) {
            const folderName = generateFolderName(emp.id, emp.sigla, emp.nome);
            db.prepare('UPDATE empresas SET folder_name = ? WHERE id = ?').run(folderName, emp.id);
            count++;
        }
    }
    if (count > 0) console.log(`[DB] Backfilled folder_name for ${count} empresas`);
    return count;
}

function updateEmpresa(id, data) {
    const stmt = db.prepare('UPDATE empresas SET nome = ?, cnpj = ?, sigla = ?, plano = ? WHERE id = ?');
    stmt.run(data.nome || '', data.cnpj || '', data.sigla || '', data.plano || 'trial', id);
    return findEmpresaById(id);
}

function deleteEmpresa(id) {
    const tables = [
        'usuarios', 'clientes', 'fornecedores', 'materiais',
        'paineis', 'tipicos', 'cubiculos', 'cargas', 'orcamentos',
        'load_lists', 'propostas_tecnicas', 'propostas_comerciais', 'propostas_completas',
        'price_import_templates', 'chaparia_lists', 'regras_derivacao',
        'pipeline_items', 'vendedores', 'composicoes',
        'settings', 'ai_settings'
    ];
    for (const table of tables) {
        db.prepare(`DELETE FROM ${table} WHERE empresa_id = ?`).run(id);
    }
    db.prepare('DELETE FROM empresas WHERE id = ?').run(id);
    return { success: true };
}

function createUsuario(data) {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const stmt = db.prepare(`INSERT INTO usuarios (id, empresa_id, email, password, name, nivel, ativo, telegram_chat_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(id, data.empresa_id || 'default', (data.email || '').toLowerCase(), data.password || '', data.name || '', data.nivel || 'engenheiro', data.ativo !== false ? 1 : 0, data.telegram_chat_id || '', now);
    return { id, empresa_id: data.empresa_id, email: data.email, name: data.name, nivel: data.nivel, ativo: true, telegram_chat_id: data.telegram_chat_id, created_at: now };
}

function findUsuarioByEmail(email) {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?)');
    return stmt.get(email) || null;
}

function findUsuarioById(id) {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE id = ?');
    return stmt.get(id) || null;
}

function listUsuarios(empresaId) {
    if (empresaId) {
        const stmt = db.prepare('SELECT * FROM usuarios WHERE empresa_id = ? ORDER BY name');
        return stmt.all(empresaId);
    }
    const stmt = db.prepare('SELECT * FROM usuarios ORDER BY name');
    return stmt.all();
}

function updateUsuario(id, data) {
    const existing = findUsuarioById(id);
    if (!existing) return null;
    const fields = [];
    const params = [];
    for (const key of ['name', 'email', 'nivel', 'empresa_id', 'ativo', 'telegram_chat_id']) {
        if (data[key] !== undefined) {
            fields.push(`${key} = ?`);
            params.push(data[key]);
        }
    }
    if (data.password) {
        fields.push('password = ?');
        params.push(data.password);
    }
    if (fields.length === 0) return existing;
    params.push(id);
    db.prepare(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return findUsuarioById(id);
}

function deactivateUsuario(id) {
    db.prepare('UPDATE usuarios SET ativo = 0 WHERE id = ?').run(id);
}

function migrateUsersFromJson() {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM usuarios').get();
    if (count.cnt > 0) return 0; // already migrated
    const fs = require('fs');
    const path = require('path');
    const usersFile = path.join(__dirname, '..', 'data', 'users.json');
    if (!fs.existsSync(usersFile)) return 0;
    try {
        const raw = fs.readFileSync(usersFile, 'utf8');
        const users = JSON.parse(raw);
        if (!Array.isArray(users) || users.length === 0) return 0;
        // Ensure default empresa exists
        const emp = findEmpresaById('default');
        if (!emp) {
            createEmpresa({ id: 'default', nome: 'Empresa Padrão', cnpj: '', sigla: 'DEF', plano: 'trial', ativo: true });
        }
        let migrated = 0;
        for (const u of users) {
            try {
                const stmt = db.prepare(`INSERT OR IGNORE INTO usuarios (id, empresa_id, email, password, name, nivel, ativo, telegram_chat_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                stmt.run(u.id, u.empresa_id || 'default', (u.email || '').toLowerCase(), u.password, u.name || '', u.nivel || 'engenheiro', u.ativo !== false ? 1 : 0, u.telegram_chat_id || '', u.createdAt || new Date().toISOString());
                migrated++;
            } catch (e) { console.warn('[DB] Erro ao migrar usuário', u.email, e.message); }
        }
        console.log(`[DB] Migrados ${migrated} usuários do users.json para SQLite`);
        return migrated;
    } catch (e) {
        console.error('[DB] Erro na migração de usuários:', e);
        return 0;
    }
}

function getEmpresaIdForUser(userId) {
    const u = findUsuarioById(userId);
    return u ? u.empresa_id : 'default';
}

function migrateFromLegacy(data, empresaId = 'default') {
    const tx = db.transaction(() => {
        // Insert clientes
        if (data.clientes) {
            for (const c of data.clientes) {
                const contatos = c.contatos ? JSON.stringify(c.contatos) : '';
                const stmt = db.prepare(`INSERT OR REPLACE INTO clientes
                    (id, empresa_id, razaoSocial, nomeFantasia, cnpj, segmento, cnae,
                     inscricaoEstadual, inscricaoMunicipal, cep, logradouro, numero,
                     bairro, cidade, estado, contatoNome, contatoCargo, email, telefone,
                     observacoes, contatos, createdAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                stmt.run(
                    c.id, empresaId, c.razaoSocial || '', c.nomeFantasia || '', c.cnpj || '',
                    c.segmento || '', c.cnae || '', c.inscricaoEstadual || '', c.inscricaoMunicipal || '',
                    c.cep || '', c.logradouro || '', c.numero || '', c.bairro || '', c.cidade || '',
                    c.estado || '', c.contatoNome || '', c.contatoCargo || '', c.email || '',
                    c.telefone || '', c.observacoes || '', contatos, c.createdAt || new Date().toISOString()
                );
            }
        }

        // Insert fornecedores
        if (data.fornecedores) {
            for (const f of data.fornecedores) {
                const stmt = db.prepare(`INSERT OR REPLACE INTO fornecedores
                    (id, empresa_id, razaoSocial, nomeFantasia, cnpj, segmento, cnae,
                     inscricaoEstadual, inscricaoMunicipal, cep, logradouro, numero,
                     bairro, cidade, estado, contatoNome, contatoCargo, email, telefone,
                     observacoes, createdAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                stmt.run(
                    f.id, empresaId, f.razaoSocial || '', f.nomeFantasia || '', f.cnpj || '',
                    f.segmento || '', f.cnae || '', f.inscricaoEstadual || '', f.inscricaoMunicipal || '',
                    f.cep || '', f.logradouro || '', f.numero || '', f.bairro || '', f.cidade || '',
                    f.estado || '', f.contatoNome || '', f.contatoCargo || '', f.email || '',
                    f.telefone || '', f.observacoes || '', f.createdAt || new Date().toISOString()
                );
            }
        }

        // Insert materiais + price_history
        if (data.materiais) {
            for (const m of data.materiais) {
                const ph = m.priceHistory || [];
                delete m.priceHistory;
                const stmt = db.prepare(`INSERT OR REPLACE INTO materiais
                    (id, empresa_id, codigoInterno, codigoFabricante, fabricante, categoria, area,
                     descricao, unidade, peso, tensao, corrente, custo, markup, precoSugerido,
                     leadTime, ncm, origem, icms, ipi, pis, cofins, modelo,
                     lastUpdateDate, lastUpdateTitle, createdAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                stmt.run(
                    m.id, empresaId, m.codigoInterno || '', m.codigoFabricante || '', m.fabricante || '',
                    m.categoria || '', m.area || '', m.descricao || '', m.unidade || '', m.peso || null,
                    m.tensao || '', m.corrente || '', m.custo || 0, m.markup || 0, m.precoSugerido || '',
                    m.leadTime ?? 5, m.ncm || '', m.origem || '', m.icms ?? 18, m.ipi ?? 10,
                    m.pis ?? 1.65, m.cofins ?? 7.60, m.modelo || '',
                    m.lastUpdateDate || '', m.lastUpdateTitle || '', m.createdAt || new Date().toISOString()
                );
                if (ph.length > 0) {
                    savePriceHistory(m.id, ph);
                }
            }
        }

        // Insert paineis
        if (data.paineis) {
            for (const p of data.paineis) {
                const stmt = db.prepare(`INSERT OR REPLACE INTO paineis
                    (id, empresa_id, tipo, descricao, altura, largura, profundidade,
                     ip, cor, cat_categoria, cat_tensao, cat_forma, cat_execucao,
                     cat_instalacao, cat_gp, cat_cor, custoTotal, items, createdAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                stmt.run(
                    p.id, empresaId, p.tipo || '', p.descricao || '', p.altura || '', p.largura || '',
                    p.profundidade || '', p.ip || '', p.cor || '', p.cat_categoria || '',
                    p.cat_tensao || '', p.cat_forma || '', p.cat_execucao || '', p.cat_instalacao || '',
                    p.cat_gp || '', p.cat_cor || '', p.custoTotal || 0,
                    JSON.stringify(p.items || []), p.createdAt || new Date().toISOString()
                );
            }
        }

        // Insert cubiculos
        if (data.cubiculos) {
            for (const t of data.cubiculos) {
                const stmt = db.prepare(`INSERT OR REPLACE INTO cubiculos
                    (id, empresa_id, nome, tipoAcionamento, regimeAcionamento, comunicacao,
                     potencia, potenciaKvar, tensao, correnteNominal, icc, frequencia, nbi,
                     instalacao, correnteApx, correntePlaca, fp, fs, rendimento, reserva,
                     protecao, releProtecao, drives, aplicacao, descricao_word, custoTotal, items, createdAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                stmt.run(
                    t.id, empresaId, t.nome || '', t.tipoAcionamento || '', t.regimeAcionamento || '',
                    t.comunicacao || '', t.potencia || '', t.potenciaKvar || '', t.tensao || '',
                    t.correnteNominal || '', t.icc || '', t.frequencia || '', t.nbi || '',
                    t.instalacao || '', t.correnteApx || '', t.correntePlaca || '',
                    t.fp || null, t.fs || null, t.rendimento || null, t.reserva || '', t.protecao || '',
                    t.releProtecao || '', t.drives || '', t.aplicacao || '', t.descricao_word || '', t.custoTotal || 0,
                    JSON.stringify(t.items || []), t.createdAt || new Date().toISOString()
                );
            }
        }

        // Insert tipicos
        if (data.tipicos) {
            for (const t of data.tipicos) {
                const stmt = db.prepare(`INSERT OR REPLACE INTO tipicos
                    (id, empresa_id, nome, tipoAcionamento, regimeAcionamento, comunicacao,
                     potencia, potenciaKvar, tensao, icc, frequencia, correnteApx,
                     correntePlaca, fp, fs, rendimento, reserva, protecao, drives,
                     aplicacao, descricao_word, custoTotal, items, createdAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                stmt.run(
                    t.id, empresaId, t.nome || '', t.tipoAcionamento || '', t.regimeAcionamento || '',
                    t.comunicacao || '', t.potencia || '', t.potenciaKvar || '', t.tensao || '',
                    t.icc || '', t.frequencia || '', t.correnteApx || '', t.correntePlaca || '',
                    t.fp || null, t.fs || null, t.rendimento || null, t.reserva || '', t.protecao || '',
                    t.drives || '', t.aplicacao || '', t.descricao_word || '', t.custoTotal || 0,
                    JSON.stringify(t.items || []), t.createdAt || new Date().toISOString()
                );
            }
        }

        // Insert cargas
        if (data.cargas) {
            for (const c of data.cargas) {
                const stmt = db.prepare(`INSERT OR REPLACE INTO cargas
                    (id, empresa_id, tag, descricao, potencia, tensao, typicalId, createdAt)
                    VALUES (?,?,?,?,?,?,?,?)`);
                stmt.run(
                    c.id, empresaId, c.tag || '', c.descricao || '', c.potencia || '',
                    c.tensao || '', c.typicalId || '', c.createdAt || new Date().toISOString()
                );
            }
        }

        // Insert orcamentos
        if (data.orcamentos) {
            for (const o of data.orcamentos) {
                const stmt = db.prepare(`INSERT OR REPLACE INTO orcamentos
                    (id, empresa_id, numero, clienteId, clienteName, obra, status,
                     markupGlobal, impostoGlobal, subtotal, total,
                     condicao_pagamento, condicao_parcela, condicao_faturamento,
                     prazo_entrega, validade, ncm_imposto, transporte, despesas,
                     items, createdAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
                stmt.run(
                    o.id, empresaId, o.numero || '', o.clienteId || '', o.clienteName || '',
                    o.obra || '', o.status || '', o.markupGlobal ?? 30, o.impostoGlobal ?? 18,
                    o.subtotal || 0, o.total || 0,
                    o.condicao_pagamento || '', o.condicao_parcela || '', o.condicao_faturamento || '',
                    o.prazo_entrega || '', o.validade || '', o.ncm_imposto || '', o.transporte || '',
                    o.despesas || '', JSON.stringify(o.items || []), o.createdAt || new Date().toISOString()
                );
            }
        }

        // Insert propostasTecnicas
        if (data.propostasTecnicas) {
            for (const p of data.propostasTecnicas) {
                const dados = { ...p };
                delete dados.id;
                delete dados.empresa_id;
                delete dados.createdAt;
                const stmt = db.prepare(`INSERT OR REPLACE INTO propostas_tecnicas (id, empresa_id, dados, createdAt) VALUES (?,?,?,?)`);
                stmt.run(p.id, empresaId, JSON.stringify(dados), p.createdAt || new Date().toISOString());
            }
        }

        // Insert propostasComerciais
        if (data.propostasComerciais) {
            for (const p of data.propostasComerciais) {
                const dados = { ...p };
                delete dados.id;
                delete dados.empresa_id;
                delete dados.createdAt;
                const stmt = db.prepare(`INSERT OR REPLACE INTO propostas_comerciais (id, empresa_id, dados, createdAt) VALUES (?,?,?,?)`);
                stmt.run(p.id, empresaId, JSON.stringify(dados), p.createdAt || new Date().toISOString());
            }
        }

        // Insert settings + company
        const settings = data.settings || {};
        const company = data.company || {};
        saveSettings({
            theme: settings.theme || 'light',
            defaultMarkup: settings.defaultMarkup ?? 30,
            defaultTax: settings.defaultTax ?? 18,
            defaultIpi: settings.defaultIpi ?? 9.75,
            company_name: company.name || '',
            company_cnpj: company.cnpj || '',
            company_address: company.address || '',
            company_logradouro: company.logradouro || '',
            company_numero: company.numero || '',
            company_cep: company.cep || '',
            company_cidade: company.cidade || '',
            company_uf: company.uf || '',
            company_email: company.email || '',
            company_logoUrl: company.logoUrl || '',
            company_regimeTributario: company.regimeTributario || 'Lucro Real'
        }, empresaId);

        // Insert priceImportTemplates
        const templates = data.priceImportTemplates || {};
        for (const [fornecedorId, tmpl] of Object.entries(templates)) {
            savePriceImportTemplate(fornecedorId, tmpl, empresaId);
        }

        // Insert AI settings if present
        if (data.aiSettings) {
            saveAiSettings(data.aiSettings, empresaId);
        }
    });
    tx();
}

function searchMateriais({ q, fabricante, categoria, grupoSiemens, favorito, page = 1, limit = 100 }, empresaId = 'default') {
    const conditions = ['empresa_id = ?'];
    const params = [empresaId];

    if (q) {
        conditions.push('(codigoInterno LIKE ? OR codigoFabricante LIKE ? OR descricao LIKE ? OR fabricante LIKE ? OR modelo LIKE ?)');
        const p = `%${q}%`;
        params.push(p, p, p, p, p);
    }
    if (fabricante) {
        conditions.push('fabricante = ?');
        params.push(fabricante);
    }
    if (categoria) {
        conditions.push('categoria = ?');
        params.push(categoria);
    }
    if (grupoSiemens) {
        conditions.push('grupoSiemens = ?');
        params.push(grupoSiemens);
    }
    if (favorito === '1' || favorito === 1 || favorito === true) {
        conditions.push('favorito = 1');
    }

    const where = conditions.join(' AND ');
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM materiais WHERE ${where}`);
    const { total } = countStmt.get(...params);

    const offset = (page - 1) * limit;
    const stmt = db.prepare(`SELECT * FROM materiais WHERE ${where} ORDER BY codigoInterno LIMIT ? OFFSET ?`);
    const rows = stmt.all(...params, limit, offset);

    const materialIds = rows.map(m => m.id);
    const priceHistoryMap = {};
    if (materialIds.length > 0) {
        const ph = db.prepare(`SELECT * FROM price_history WHERE material_id IN (${materialIds.map(() => '?').join(',')}) ORDER BY date DESC`).all(...materialIds);
        for (const r of ph) {
            if (!priceHistoryMap[r.material_id]) priceHistoryMap[r.material_id] = [];
            priceHistoryMap[r.material_id].push(r);
        }
    }
    for (const m of rows) {
        m.priceHistory = priceHistoryMap[m.id] || [];
    }

    return { rows, total, page, limit, pages: Math.ceil(total / limit) };
}

function getMaterialDxf(materialId) {
    const row = getDb().prepare("SELECT dxf_block FROM materiais WHERE id = ?").get(materialId);
    return row?.dxf_block || null;
}

function setMaterialDxf(materialId, content) {
    getDb().prepare("UPDATE materiais SET dxf_block = ? WHERE id = ?").run(content, materialId);
}

function removeMaterialDxf(materialId) {
    setMaterialDxf(materialId, null);
}

function findMailSettings(empresaId = 'default') {
    const stmt = getDb().prepare('SELECT * FROM mail_settings WHERE empresa_id = ?');
    const row = stmt.get(empresaId);
    return row || null;
}

function upsertMailSettings(empresaId, data) {
    const existing = getDb().prepare('SELECT * FROM mail_settings WHERE empresa_id = ?').get(empresaId);
    const now = new Date().toISOString();
    if (existing) {
        const pass = data.pass !== undefined && data.pass !== '' ? data.pass : existing.pass;
        const apiKey = data.api_key !== undefined && data.api_key !== '' ? data.api_key : existing.api_key;
        getDb().prepare(`UPDATE mail_settings SET host=?, port=?, secure=?, user=?, pass=?,
                         from_name=?, from_email=?, provider=?, api_key=?, updated_at=? WHERE empresa_id=?`)
          .run(data.host || '', data.port || 587, data.secure ? 1 : 0, data.user || '',
               pass, data.from_name || '', data.from_email || '',
               data.provider || 'smtp', apiKey || '', now, empresaId);
    } else {
        getDb().prepare(`INSERT INTO mail_settings
                         (id, empresa_id, host, port, secure, user, pass, from_name, from_email, provider, api_key, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(crypto.randomUUID(), empresaId, data.host || '', data.port || 587,
               data.secure ? 1 : 0, data.user || '', data.pass || '',
               data.from_name || '', data.from_email || '',
               data.provider || 'smtp', data.api_key || '', now, now);
    }
    return findMailSettings(empresaId);
}

function findAllCrmStages(empresaId = 'default') {
    return getDb().prepare('SELECT * FROM crm_stages WHERE empresa_id = ? ORDER BY position ASC').all(empresaId);
}

function createCrmStage(empresaId, data) {
    const now = new Date().toISOString();
    const id = data.id || crypto.randomUUID();
    const maxPos = getDb().prepare('SELECT COALESCE(MAX(position), -1) as m FROM crm_stages WHERE empresa_id = ?').get(empresaId);
    const position = data.position ?? (maxPos.m + 1);
    getDb().prepare(`INSERT INTO crm_stages (id, empresa_id, stage_id, label, color, icon, position, is_default, is_terminal, allows_proposal, tracks_qualificacao, tracks_conversao, is_loss, loss_reasons, probability, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, empresaId, data.stage_id || id, data.label || '', data.color || '#6b7280', data.icon || 'ph-dot-outline', position, data.is_default ? 1 : 0, data.is_terminal ? 1 : 0, data.allows_proposal ? 1 : 0, data.tracks_qualificacao ? 1 : 0, data.tracks_conversao ? 1 : 0, data.is_loss ? 1 : 0, JSON.stringify(data.loss_reasons || []), data.probability ?? 0, now, now);
    if (data.is_default) {
        getDb().prepare('UPDATE crm_stages SET is_default = 0 WHERE empresa_id = ? AND id != ?').run(empresaId, id);
    }
    return getDb().prepare('SELECT * FROM crm_stages WHERE id = ?').get(id);
}

function updateCrmStage(id, empresaId, data) {
    const now = new Date().toISOString();
    const existing = getDb().prepare('SELECT * FROM crm_stages WHERE id = ? AND empresa_id = ?').get(id, empresaId);
    if (!existing) return null;
    const fields = [];
    const values = [];
    for (const key of ['label', 'color', 'icon', 'position', 'stage_id']) {
        if (data[key] !== undefined) { fields.push(`${key}=?`); values.push(data[key]); }
    }
    for (const key of ['is_default', 'is_terminal', 'allows_proposal', 'tracks_qualificacao', 'tracks_conversao', 'is_loss']) {
        if (data[key] !== undefined) { fields.push(`${key}=?`); values.push(data[key] ? 1 : 0); }
    }
    if (data.loss_reasons !== undefined) { fields.push('loss_reasons=?'); values.push(JSON.stringify(data.loss_reasons)); }
    if (data.probability !== undefined) { fields.push('probability=?'); values.push(data.probability); }
    if (fields.length > 0) {
        fields.push('updated_at=?'); values.push(now);
        values.push(id, empresaId);
        getDb().prepare(`UPDATE crm_stages SET ${fields.join(', ')} WHERE id = ? AND empresa_id = ?`).run(...values);
        if (data.is_default) {
            getDb().prepare('UPDATE crm_stages SET is_default = 0 WHERE empresa_id = ? AND id != ?').run(empresaId, id);
        }
    }
    return getDb().prepare('SELECT * FROM crm_stages WHERE id = ?').get(id);
}

function deleteCrmStage(id, empresaId) {
    const existing = getDb().prepare('SELECT * FROM crm_stages WHERE id = ? AND empresa_id = ?').get(id, empresaId);
    if (!existing) return null;
    getDb().prepare('DELETE FROM crm_stages WHERE id = ? AND empresa_id = ?').run(id, empresaId);
    return existing;
}

function reorderCrmStages(empresaId, orderedIds) {
    for (let i = 0; i < orderedIds.length; i++) {
        getDb().prepare('UPDATE crm_stages SET position = ?, updated_at = ? WHERE id = ? AND empresa_id = ?').run(i, new Date().toISOString(), orderedIds[i], empresaId);
    }
    return findAllCrmStages(empresaId);
}

function resetCrmStages(empresaId) {
    getDb().prepare('DELETE FROM crm_stages WHERE empresa_id = ?').run(empresaId);
    const now = new Date().toISOString();
    const DEFAULT_STAGES = [
        { id: 'novo', label: 'Novo', color: '#6b7280', icon: 'ph-dot-outline', position: 0, is_default: 1, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 5 },
        { id: 'tentando_contato', label: 'Tentando Contato', color: '#f59e0b', icon: 'ph-phone-call', position: 1, is_default: 0, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 10 },
        { id: 'contato_realizado', label: 'Contato Realizado', color: '#3b82f6', icon: 'ph-chats', position: 2, is_default: 0, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 20 },
        { id: 'qualificado', label: 'Qualificado', color: '#8b5cf6', icon: 'ph-star', position: 3, is_default: 0, is_terminal: 0, allows_proposal: 1, tracks_qualificacao: 1, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 40 },
        { id: 'agendado_visita', label: 'Agendado', color: '#06b6d4', icon: 'ph-calendar-check', position: 4, is_default: 0, is_terminal: 0, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 60 },
        { id: 'visita_realizada', label: 'Visita Realizada', color: '#10b981', icon: 'ph-map-pin', position: 5, is_default: 0, is_terminal: 0, allows_proposal: 1, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 0, loss_reasons: [], probability: 70 },
        { id: 'virou_proposta', label: 'Virou Proposta', color: '#2563eb', icon: 'ph-file-arrow-up', position: 6, is_default: 0, is_terminal: 1, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 1, is_loss: 0, loss_reasons: [], probability: 90 },
        { id: 'desqualificado', label: 'Desqualificado', color: '#ef4444', icon: 'ph-x-circle', position: 7, is_default: 0, is_terminal: 1, allows_proposal: 0, tracks_qualificacao: 0, tracks_conversao: 0, is_loss: 1, loss_reasons: ['nao_qualificado','sem_orcamento','nao_decidiu','concorrente','sem_contato','nao_responde','outro'], probability: 0 }
    ];
    const insertStage = getDb().prepare(`INSERT INTO crm_stages (id, empresa_id, stage_id, label, color, icon, position, is_default, is_terminal, allows_proposal, tracks_qualificacao, tracks_conversao, is_loss, loss_reasons, probability, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const s of DEFAULT_STAGES) {
        insertStage.run(s.id, empresaId, s.id, s.label, s.color, s.icon, s.position, s.is_default, s.is_terminal, s.allows_proposal, s.tracks_qualificacao, s.tracks_conversao, s.is_loss, JSON.stringify(s.loss_reasons), s.probability, now, now);
    }
    return findAllCrmStages(empresaId);
}

function logCrmEmail(empresaId, data) {
    const now = new Date().toISOString();
    const id = data.id || require('crypto').randomUUID();
    getDb().prepare(`INSERT INTO crm_email_log
        (id, empresa_id, lead_id, to_email, cc, bcc, from_email, from_name, subject, body_preview, status, error_message, provider, message_id, attachments_count, tracking_token, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, empresaId,
            data.lead_id || null,
            data.to_email || '',
            data.cc || '',
            data.bcc || '',
            data.from_email || '',
            data.from_name || '',
            data.subject || '',
            data.body_preview || '',
            data.status || 'sent',
            data.error_message || '',
            data.provider || 'smtp',
            data.message_id || '',
            data.attachments_count || 0,
            data.tracking_token || '',
            now);
    return getDb().prepare('SELECT * FROM crm_email_log WHERE id = ?').get(id);
}

function findCrmEmailLogByLead(empresaId, leadId, limit = 50) {
    if (leadId) {
        return getDb().prepare('SELECT * FROM crm_email_log WHERE empresa_id = ? AND lead_id = ? ORDER BY created_at DESC LIMIT ?').all(empresaId, leadId, limit);
    }
    return getDb().prepare('SELECT * FROM crm_email_log WHERE empresa_id = ? ORDER BY created_at DESC LIMIT ?').all(empresaId, limit);
}

function markEmailOpened(token, userAgent) {
    if (!token) return null;
    const row = getDb().prepare('SELECT * FROM crm_email_log WHERE tracking_token = ?').get(token);
    if (!row) return null;
    const now = new Date().toISOString();
    getDb().prepare(`UPDATE crm_email_log SET opened_at = COALESCE(opened_at, ?), open_count = open_count + 1, user_agent = ? WHERE tracking_token = ?`)
        .run(now, userAgent || '', token);
    return getDb().prepare('SELECT * FROM crm_email_log WHERE tracking_token = ?').get(token);
}

module.exports = {
    getDb,
    findAll,
    findById,
    create,
    update,
    remove,
    getPriceHistory,
    savePriceHistory,
    getSettings,
    saveSettings,
    saveLoginTheme,
    getAiSettings,
    saveAiSettings,
    getPriceImportTemplates,
    savePriceImportTemplate,
    deletePriceImportTemplate,
    getNextProposalNumber,
    peekNextProposalNumber,
    updatePipelineRevision,
    getFullSync,
    migrateFromLegacy,
    bulkImportMateriais,
    searchMateriais,
    getMaterialDxf,
    setMaterialDxf,
    removeMaterialDxf,
    createEmpresa,
    listEmpresas,
    findEmpresaById,
    updateEmpresa,
    deleteEmpresa,
    generateFolderName,
    backfillFolderNames,
    createUsuario,
    findUsuarioByEmail,
    findUsuarioById,
    listUsuarios,
    updateUsuario,
    deactivateUsuario,
    migrateUsersFromJson,
    getEmpresaIdForUser,
    findMailSettings,
    upsertMailSettings,
    findAllCrmStages,
    createCrmStage,
    updateCrmStage,
    deleteCrmStage,
    reorderCrmStages,
    resetCrmStages,
    logCrmEmail,
    findCrmEmailLogByLead,
    markEmailOpened,
    getUnidadesByCliente,
    peekNextAutproSequence,
    consumeNextAutproSequence
};
