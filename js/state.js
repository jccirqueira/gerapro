import { EMPRESA } from './empresaConfig.js';

const AUTH_TOKEN_KEY = 'gerapro_auth_token';

const initialState = {
    user: {
        name: 'José C.',
        role: 'Engenheiro Sênior'
    },
    auth: {
        token: localStorage.getItem(AUTH_TOKEN_KEY),
        user: null,
        isAuthenticated: false,
        loading: true
    },
    clientes: [],
    materiais: [],
    fornecedores: [],
    painelTypes: [],
    tipicos: [],
    cubiculos: [],
    cargas: [],
    lmGroups: [],
    orcamentos: [],
    loadLists: [],
    chapariaLists: [],
    unidadesCliente: [],
    propostasTecnicas: [],
    propostasComerciais: [],
    propostasCompletas: [],
    pipelineItems: [],
    vendedores: [],
    composicoes: [],
    regrasDerivacao: [],
    ui: {
        currentView: 'dashboard',
        sidebarCollapsed: false
    },
    company: {
        name: EMPRESA.nome,
        cnpj: EMPRESA.cnpj,
        address: EMPRESA.endereco,
        logradouro: EMPRESA.logradouro,
        numero: EMPRESA.numero,
        cep: EMPRESA.cep,
        cidade: EMPRESA.cidade,
        uf: EMPRESA.uf,
        email: EMPRESA.email,
        logoUrl: '',
        regimeTributario: EMPRESA.regimeTributario,
        templateTecnica: EMPRESA.templateTecnica || 'TEMPLATE_TEC.docx',
        templateComercial: EMPRESA.templateComercial || 'TEMPLATE_COM.docx',
        templateCompleta: EMPRESA.templateCompleta || 'TEMPLATE_TEC_COM.docx',
        folderName: ''
    },
    settings: {
        theme: 'light',
        defaultMarkup: 30,
        defaultTax: 18,
        defaultIpi: 9.75
    },
    aiSettings: {
        provider: 'ollama',
        model: 'qwen2.5:14b',
        apiKey: '',
        ollamaUrl: 'http://localhost:11434'
    },
    loginTheme: {
        logoUrl: '',
        backgroundType: 'gradient',
        backgroundColor: '#0f172a',
        gradientStart: '#0f172a',
        gradientEnd: '#1e293b',
        backgroundImage: '',
        cardBg: '#1e293b',
        cardBorder: '#334155',
        primaryColor: '#38bdf8',
        primaryHover: '#7dd3fc',
        textColor: '#ffffff',
        subtitleColor: '#64748b',
        titleColor: '#38bdf8',
        inputBg: '#0f172a',
        inputBorder: '#334155',
        companyName: 'GeraPro',
        subtitle: 'Sistema de Propostas Técnicas / Comerciais'
    },
    currentPtc: null,
    activeTechnicalProposal: null,
    activeCommercialProposal: null,
    activeCompleteProposal: null,
    priceImportTemplates: {},
    _importSessions: [],
    crmLeads: [],
    crmInteracoes: [],
    crmTarefas: [],
    crmNotas: [],
    crmWebhooks: [],
    crmSequencias: [],
    crmEmailTemplates: [],
    crmStages: []
};

class Store {
    constructor() {
        this.state = JSON.parse(JSON.stringify(initialState));
        this.listeners = [];
        this.sync = { online: false, lastSync: null };
        this._loadImportSessions();
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    async refresh() {
        const ok = await this._loadFromServer();
        if (ok) this.notify();
        return ok;
    }

    async _loadFromServer() {
        const token = this.state.auth.token;
        if (!token) { console.warn('[Load] No token'); return false; }
        try {
            console.log('[Load] Fetching from server...');
            const res = await fetch(`${this._getServerUrl()}/api/data/sync/full`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error('[Load] Server returned', res.status);
                this.sync.online = false;
                this.notify();
                return false;
            }
            const data = await res.json();
            if (data.success && data.data) {
                const sd = data.data;
                console.log('[Load] Got data:', Object.keys(sd).map(k => `${k}:${Array.isArray(sd[k]) ? sd[k].length : '?'}`).join(', '));
                for (const key of ['clientes','materiais','fornecedores','painelTypes','tipicos','cubiculos','cargas',    'orcamentos','loadLists','chapariaLists','propostasTecnicas','propostasComerciais','pipelineItems','vendedores','composicoes','regrasDerivacao','crmLeads','crmInteracoes','crmTarefas','crmNotas','crmWebhooks','crmSequencias','crmEmailTemplates','crmStages','manufaturaProjetos','manufaturaColunas','manufaturaGavetas','manufaturaComponentes','manufaturaHistorico','manufaturaPerfisTeste','manufaturaResultadosTeste','manufaturaAnexos','unidadesCliente']) {
                    if (Array.isArray(sd[key])) this.state[key] = sd[key];
                }
                if (sd.settings) this.state.settings = { ...this.state.settings, ...sd.settings };
                if (sd.aiSettings) this.state.aiSettings = { ...this.state.aiSettings, ...sd.aiSettings };
                if (sd.loginTheme) this.state.loginTheme = { ...this.state.loginTheme, ...sd.loginTheme };
                if (sd.company) this.state.company = { ...this.state.company, ...sd.company };
                if (sd.priceImportTemplates) this.state.priceImportTemplates = sd.priceImportTemplates;
                this.sync.online = true;
                this.sync.lastSync = new Date().toISOString();
                this.notify();
                return true;
            }
            console.error('[Load] Invalid response:', data);
            this.sync.online = false;
            this.notify();
            return false;
        } catch (e) {
            console.error('[Load] Error:', e);
            this.sync.online = false;
            this.notify();
            return false;
        }
    }

    async searchMaterials(filters = {}) {
        const token = this.state.auth.token;
        if (!token) return { rows: [], total: 0, page: 1, pages: 0 };
        try {
            const params = new URLSearchParams();
            if (filters.q) params.set('q', filters.q);
            if (filters.fabricante) params.set('fabricante', filters.fabricante);
            if (filters.categoria) params.set('categoria', filters.categoria);
            if (filters.grupoSiemens) params.set('grupoSiemens', filters.grupoSiemens);
            if (filters.favorito) params.set('favorito', '1');
            if (filters.page) params.set('page', filters.page);
            if (filters.limit) params.set('limit', filters.limit);
            const res = await fetch(`${this._getServerUrl()}/api/materiais/search?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return { rows: [], total: 0, page: 1, pages: 0 };
            const data = await res.json();
            return data.success ? data : { rows: [], total: 0, page: 1, pages: 0 };
        } catch {
            return { rows: [], total: 0, page: 1, pages: 0 };
        }
    }

    async _syncCreate(entity, item) {
        const token = this.state.auth.token;
        if (!token) { console.warn('[Sync] No token for', entity); this.notify(); return this.sync.online; }
        try {
            const res = await fetch(`${this._getServerUrl()}/api/data/${entity}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            const body = await res.text();
            if (res.ok) {
                console.log(`[Sync] ${entity} created OK`);
                this.sync.online = true;
            } else {
                console.error(`[Sync] ${entity} create FAIL ${res.status}:`, body);
                this.sync.online = false;
            }
        } catch (e) {
            console.error(`[Sync] ${entity} create error:`, e);
            this.sync.online = false;
        }
        this.notify();
        return this.sync.online;
    }

    async _syncUpdate(entity, id, updates) {
        const token = this.state.auth.token;
        if (!token) { console.warn('[Sync] No token for', entity); this.notify(); return this.sync.online; }
        try {
            const res = await fetch(`${this._getServerUrl()}/api/data/${entity}/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const body = await res.text();
            if (res.ok) {
                console.log(`[Sync] ${entity} ${id} updated OK`);
                this.sync.online = true;
            } else {
                console.error(`[Sync] ${entity} ${id} update FAIL ${res.status}:`, body);
                this.sync.online = false;
            }
        } catch (e) {
            console.error(`[Sync] ${entity} ${id} update error:`, e);
            this.sync.online = false;
        }
        this.notify();
        return this.sync.online;
    }

    async _syncDelete(entity, id) {
        const token = this.state.auth.token;
        if (!token) { this.notify(); return this.sync.online; }
        try {
            const res = await fetch(`${this._getServerUrl()}/api/data/${entity}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) this.sync.online = true;
            else this.sync.online = false;
        } catch {
            this.sync.online = false;
        }
        this.notify();
        return this.sync.online;
    }

    _getServerUrl() {
        return '';
    }

    setAuth(token, user) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        this.setState({
            auth: { token, user, isAuthenticated: true, loading: false }
        });
    }

    clearAuth() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        this.setState({
            auth: { token: null, user: null, isAuthenticated: false, loading: false }
        });
    }

    async login(email, password) {
        const res = await fetch(`${this._getServerUrl()}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            let errMsg = 'Erro ao fazer login';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        this.setAuth(data.token, data.user);
        return data.user;
    }

    async register(email, password, name, empresa_id) {
        const res = await fetch(`${this._getServerUrl()}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, empresa_id })
        });
        if (!res.ok) {
            let errMsg = 'Erro ao registrar';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        this.setAuth(data.token, data.user);
        return data.user;
    }

    async fetchEmpresas() {
        const token = this.state.auth.token;
        const res = await fetch(`${this._getServerUrl()}/api/empresas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            let errMsg = 'Erro ao listar empresas';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data.empresas || [];
    }

    async createEmpresa(nome, cnpj, sigla) {
        const token = this.state.auth.token;
        const res = await fetch(`${this._getServerUrl()}/api/empresas`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cnpj, sigla })
        });
        if (!res.ok) {
            let errMsg = 'Erro ao criar empresa';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data.empresa;
    }

    async updateEmpresa(id, nome, cnpj, sigla) {
        const token = this.state.auth.token;
        const res = await fetch(`${this._getServerUrl()}/api/empresas`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, nome, cnpj, sigla })
        });
        if (!res.ok) {
            let errMsg = 'Erro ao atualizar empresa';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data.empresa;
    }

    async deleteEmpresa(id) {
        const token = this.state.auth.token;
        const res = await fetch(`${this._getServerUrl()}/api/empresas?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            let errMsg = 'Erro ao excluir empresa';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data;
    }

    logout() {
        this.clearAuth();
    }

    async checkAuth() {
        const token = this.state.auth.token;
        if (!token) {
            this.setState({ auth: { token: null, user: null, isAuthenticated: false, loading: false } });
            return false;
        }
        try {
            const res = await fetch(`${this._getServerUrl()}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                this.clearAuth();
                return false;
            }
            const data = await res.json();
            if (data.success) {
                this.setAuth(token, data.user);
                return true;
            }
            this.clearAuth();
            return false;
        } catch (e) {
            this.clearAuth();
            return false;
        }
    }

    async fetchUsers() {
        const token = this.state.auth.token;
        const res = await fetch(`${this._getServerUrl()}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            let errMsg = 'Erro ao listar usuários';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data.users || [];
    }

    async createUser(email, password, name, nivel, empresa_id) {
        const token = this.state.auth.token;
        const res = await fetch(`${this._getServerUrl()}/api/admin/users`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, nivel: nivel || 'engenheiro', empresa_id })
        });
        if (!res.ok) {
            let errMsg = 'Erro ao criar usuário';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data.user;
    }

    async updateUser(id, updates) {
        const token = this.state.auth.token;
        const res = await fetch(`${this._getServerUrl()}/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) {
            let errMsg = 'Erro ao atualizar usuário';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data.success;
    }

    async deleteUser(id) {
        const token = this.state.auth.token;
        const res = await fetch(`${this._getServerUrl()}/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            let errMsg = 'Erro ao desativar usuário';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data.success;
    }

    getUserLevel() {
        return this.state.auth.user?.nivel || 'visualizador';
    }

    canEdit() {
        const nivel = this.getUserLevel();
        return nivel === 'admin' || nivel === 'engenheiro';
    }

    canDelete() {
        return this.getUserLevel() === 'admin';
    }

    // === AI Settings ===

    async fetchAiSettings() {
        const token = this.state.auth.token;
        if (!token) return null;
        const res = await fetch(`${this._getServerUrl()}/api/settings/ai`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.success && data.data) {
            this.setState({ aiSettings: data.data });
            return data.data;
        }
        return null;
    }

    async saveAiSettings(settings) {
        const token = this.state.auth.token;
        if (!token) throw new Error('Não autenticado');
        const res = await fetch(`${this._getServerUrl()}/api/settings/ai`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (!res.ok) {
            let errMsg = 'Erro ao salvar configurações de IA';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        this.setState({ aiSettings: { ...this.state.aiSettings, ...settings } });
        return data.success;
    }

    async saveLoginTheme(loginTheme) {
        const token = this.state.auth.token;
        if (!token) throw new Error('Não autenticado');
        const payload = { loginTheme };
        const res = await fetch(`${this._getServerUrl()}/api/settings/login-theme`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            let errMsg = 'Erro ao salvar personalização';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        this.setState({ loginTheme: { ...this.state.loginTheme, ...loginTheme } });
        return data.success;
    }

    async fetchTelegramSettings() {
        const token = this.state.auth.token;
        if (!token) return null;
        const res = await fetch(`${this._getServerUrl()}/api/settings/telegram`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.success) return data;
        return null;
    }

    async saveTelegramSettings(payload) {
        const token = this.state.auth.token;
        if (!token) throw new Error('Não autenticado');
        const res = await fetch(`${this._getServerUrl()}/api/settings/telegram`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            let errMsg = 'Erro ao salvar configurações do Telegram';
            try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
            throw new Error(errMsg);
        }
        const data = await res.json();
        return data.success;
    }

    async testAiConnection() {
        const token = this.state.auth.token;
        if (!token) return { success: false, error: 'Não autenticado' };
        const res = await fetch(`${this._getServerUrl()}/api/settings/ai/test`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        try { return await res.json(); } catch { return { success: false, error: 'Resposta vazia do servidor' }; }
    }

    // === CRUD Actions (optimistic cache + background sync) ===

    async addClient(client) {
        const item = { ...client, id: crypto.randomUUID(), createdAt: new Date() };
        this.setState({ clientes: [...this.state.clientes, item] });
        const ok = await this._syncCreate('clientes', item);
        if (!ok) {
            this.setState({ clientes: this.state.clientes.filter(c => c.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateClient(id, updates) {
        const prev = this.state.clientes.find(c => c.id === id);
        this.setState({ clientes: this.state.clientes.map(c => c.id === id ? { ...c, ...updates } : c) });
        const ok = await this._syncUpdate('clientes', id, updates);
        if (!ok && prev) {
            this.setState({ clientes: this.state.clientes.map(c => c.id === id ? prev : c) });
        }
        return ok;
    }

    async deleteClient(id) {
        const prev = this.state.clientes.find(c => c.id === id);
        this.setState({ clientes: this.state.clientes.filter(c => c.id !== id) });
        const ok = await this._syncDelete('clientes', id);
        if (!ok && prev) {
            this.setState({ clientes: [...this.state.clientes, prev] });
        }
        return ok;
    }

    async addUnidadeCliente(unidade) {
        const item = { ...unidade, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        this.setState({ unidadesCliente: [...this.state.unidadesCliente, item] });
        const ok = await this._syncCreate('unidadesCliente', item);
        if (!ok) {
            this.setState({ unidadesCliente: this.state.unidadesCliente.filter(u => u.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateUnidadeCliente(id, updates) {
        const prev = this.state.unidadesCliente.find(u => u.id === id);
        this.setState({ unidadesCliente: this.state.unidadesCliente.map(u => u.id === id ? { ...u, ...updates } : u) });
        const ok = await this._syncUpdate('unidadesCliente', id, updates);
        if (!ok && prev) {
            this.setState({ unidadesCliente: this.state.unidadesCliente.map(u => u.id === id ? prev : u) });
        }
        return ok;
    }

    async deleteUnidadeCliente(id) {
        const prev = this.state.unidadesCliente.find(u => u.id === id);
        this.setState({ unidadesCliente: this.state.unidadesCliente.filter(u => u.id !== id) });
        const ok = await this._syncDelete('unidadesCliente', id);
        if (!ok && prev) {
            this.setState({ unidadesCliente: [...this.state.unidadesCliente, prev] });
        }
        return ok;
    }

    async addFornecedor(fornecedor) {
        const item = { ...fornecedor, id: crypto.randomUUID(), createdAt: new Date() };
        this.setState({ fornecedores: [...(this.state.fornecedores || []), item] });
        const ok = await this._syncCreate('fornecedores', item);
        if (!ok) {
            this.setState({ fornecedores: (this.state.fornecedores || []).filter(f => f.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateFornecedor(id, updates) {
        const prev = (this.state.fornecedores || []).find(f => f.id === id);
        this.setState({ fornecedores: (this.state.fornecedores || []).map(f => f.id === id ? { ...f, ...updates } : f) });
        const ok = await this._syncUpdate('fornecedores', id, updates);
        if (!ok && prev) {
            this.setState({ fornecedores: (this.state.fornecedores || []).map(f => f.id === id ? prev : f) });
        }
        return ok;
    }

    async deleteFornecedor(id) {
        const prev = (this.state.fornecedores || []).find(f => f.id === id);
        this.setState({ fornecedores: (this.state.fornecedores || []).filter(f => f.id !== id) });
        const ok = await this._syncDelete('fornecedores', id);
        if (!ok && prev) {
            this.setState({ fornecedores: [...(this.state.fornecedores || []), prev] });
        }
        return ok;
    }

    async addPropostaTecnica(proposta) {
        const item = {
            ...proposta,
            id: proposta.id || crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        this.setState({ propostasTecnicas: [...(this.state.propostasTecnicas || []), item] });
        const ok = await this._syncCreate('propostasTecnicas', item);
        if (!ok) {
            this.setState({ propostasTecnicas: (this.state.propostasTecnicas || []).filter(p => p.id !== item.id) });
            return null;
        }
        return item;
    }

    async updatePropostaTecnica(id, updates) {
        const prev = (this.state.propostasTecnicas || []).find(p => p.id === id);
        this.setState({ propostasTecnicas: (this.state.propostasTecnicas || []).map(p => p.id === id ? { ...p, ...updates } : p) });
        const ok = await this._syncUpdate('propostasTecnicas', id, updates);
        if (!ok && prev) {
            this.setState({ propostasTecnicas: (this.state.propostasTecnicas || []).map(p => p.id === id ? prev : p) });
        }
        return ok;
    }

    async deletePropostaTecnica(id) {
        const prev = (this.state.propostasTecnicas || []).find(p => p.id === id);
        this.setState({ propostasTecnicas: (this.state.propostasTecnicas || []).filter(p => p.id !== id) });
        const ok = await this._syncDelete('propostasTecnicas', id);
        if (!ok && prev) {
            this.setState({ propostasTecnicas: [...(this.state.propostasTecnicas || []), prev] });
        }
        return ok;
    }

    async addPropostaComercial(proposta) {
        const item = {
            ...proposta,
            id: proposta.id || crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        this.setState({ propostasComerciais: [...(this.state.propostasComerciais || []), item] });
        const ok = await this._syncCreate('propostasComerciais', item);
        if (!ok) {
            this.setState({ propostasComerciais: (this.state.propostasComerciais || []).filter(p => p.id !== item.id) });
            return null;
        }
        return item;
    }

    async updatePropostaComercial(id, updates) {
        const prev = (this.state.propostasComerciais || []).find(p => p.id === id);
        this.setState({ propostasComerciais: (this.state.propostasComerciais || []).map(p => p.id === id ? { ...p, ...updates } : p) });
        const ok = await this._syncUpdate('propostasComerciais', id, updates);
        if (!ok && prev) {
            this.setState({ propostasComerciais: (this.state.propostasComerciais || []).map(p => p.id === id ? prev : p) });
        }
        return ok;
    }

    async deletePropostaComercial(id) {
        const prev = (this.state.propostasComerciais || []).find(p => p.id === id);
        this.setState({ propostasComerciais: (this.state.propostasComerciais || []).filter(p => p.id !== id) });
        const ok = await this._syncDelete('propostasComerciais', id);
        if (!ok && prev) {
            this.setState({ propostasComerciais: [...(this.state.propostasComerciais || []), prev] });
        }
        return ok;
    }

    async addPropostaCompleta(proposta) {
        const item = {
            ...proposta,
            id: proposta.id || crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        this.setState({ propostasCompletas: [...(this.state.propostasCompletas || []), item] });
        const ok = await this._syncCreate('propostasCompletas', item);
        if (!ok) {
            this.setState({ propostasCompletas: (this.state.propostasCompletas || []).filter(p => p.id !== item.id) });
            return null;
        }
        return item;
    }

    async updatePropostaCompleta(id, updates) {
        const prev = (this.state.propostasCompletas || []).find(p => p.id === id);
        this.setState({ propostasCompletas: (this.state.propostasCompletas || []).map(p => p.id === id ? { ...p, ...updates } : p) });
        const ok = await this._syncUpdate('propostasCompletas', id, updates);
        if (!ok && prev) {
            this.setState({ propostasCompletas: (this.state.propostasCompletas || []).map(p => p.id === id ? prev : p) });
        }
        return ok;
    }

    async deletePropostaCompleta(id) {
        const prev = (this.state.propostasCompletas || []).find(p => p.id === id);
        this.setState({ propostasCompletas: (this.state.propostasCompletas || []).filter(p => p.id !== id) });
        const ok = await this._syncDelete('propostasCompletas', id);
        if (!ok && prev) {
            this.setState({ propostasCompletas: [...(this.state.propostasCompletas || []), prev] });
        }
        return ok;
    }

    async addMaterial(material) {
        const now = new Date().toISOString();
        const custo = parseFloat(material.custo) || 0;
        const markup = parseFloat(material.markup) || 0;
        const item = {
            ...material,
            id: material.id || crypto.randomUUID(),
            createdAt: material.createdAt || now,
            lastUpdateDate: material.lastUpdateDate || now,
            lastUpdateTitle: material.lastUpdateTitle || 'Criação Inicial',
            priceHistory: material.priceHistory || [{ custo, markup, date: now, title: 'Criação Inicial', origin: 'manual' }]
        };
        this.setState({ materiais: [...(this.state.materiais || []), item] });
        const ok = await this._syncCreate('materiais', item);
        if (!ok) {
            this.setState({ materiais: (this.state.materiais || []).filter(m => m.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateMaterial(id, updates) {
        const now = new Date().toISOString();
        const prev = (this.state.materiais || []).find(m => m.id === id);
        const newItems = (this.state.materiais || []).map(m => {
            if (m.id !== id) return m;

            const newCusto = parseFloat(updates.custo);
            const newMarkup = parseFloat(updates.markup);
            const priceChanged = !isNaN(newCusto) && (newCusto !== parseFloat(m.custo) || newMarkup !== parseFloat(m.markup));

            const result = {
                ...m,
                ...updates,
                lastUpdateDate: now,
                lastUpdateTitle: updates.lastUpdateTitle || 'Alteração Manual'
            };

            if (priceChanged) {
                result.priceHistory = [...(m.priceHistory || []), {
                    custo: parseFloat(m.custo) || 0,
                    markup: parseFloat(m.markup) || 0,
                    date: now,
                    title: updates.lastUpdateTitle || 'Alteração Manual',
                    origin: 'manual'
                }];
            }

            return result;
        });
        this.setState({ materiais: newItems });
        const ok = await this._syncUpdate('materiais', id, updates);
        if (!ok && prev) {
            this.setState({ materiais: (this.state.materiais || []).map(m => m.id === id ? prev : m) });
        }
        return ok;
    }

    async deleteMaterial(id) {
        const prev = (this.state.materiais || []).find(m => m.id === id);
        this.setState({ materiais: (this.state.materiais || []).filter(m => m.id !== id) });
        const ok = await this._syncDelete('materiais', id);
        if (!ok && prev) {
            this.setState({ materiais: [...(this.state.materiais || []), prev] });
        }
        return ok;
    }

    async toggleFavorite(id) {
        const m = (this.state.materiais || []).find(m => m.id === id);
        if (!m) return false;
        const newVal = m.favorito ? 0 : 1;
        this.setState({
            materiais: (this.state.materiais || []).map(mm =>
                mm.id === id ? { ...mm, favorito: newVal } : mm
            )
        });
        const ok = await this._syncUpdate('materiais', id, { favorito: newVal });
        if (!ok) {
            this.setState({
                materiais: (this.state.materiais || []).map(mm =>
                    mm.id === id ? { ...mm, favorito: m.favorito } : mm
                )
            });
        }
        return ok;
    }

    async addTipico(tipico) {
        const now = new Date().toISOString();
        const item = {
            ...tipico,
            id: tipico.id || crypto.randomUUID(),
            createdAt: tipico.createdAt || now,
            updatedAt: now
        };
        this.setState({ tipicos: [...(this.state.tipicos || []), item] });
        console.log('[Tipico] Creating:', item.id, item.nome);
        const ok = await this._syncCreate('tipicos', item);
        if (!ok) {
            this.setState({ tipicos: (this.state.tipicos || []).filter(t => t.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateTipico(id, updates) {
        const now = new Date().toISOString();
        console.log('[Tipico] Updating:', id);
        const prev = (this.state.tipicos || []).find(t => t.id === id);
        const newItems = (this.state.tipicos || []).map(t => {
            if (t.id !== id) return t;
            return { ...t, ...updates, updatedAt: now };
        });
        this.setState({ tipicos: newItems });
        const ok = await this._syncUpdate('tipicos', id, updates);
        if (!ok && prev) {
            this.setState({ tipicos: (this.state.tipicos || []).map(t => t.id === id ? prev : t) });
        }
        return ok;
    }

    async deleteTipico(id) {
        const prev = (this.state.tipicos || []).find(t => t.id === id);
        this.setState({ tipicos: (this.state.tipicos || []).filter(t => t.id !== id) });
        const ok = await this._syncDelete('tipicos', id);
        if (!ok && prev) {
            this.setState({ tipicos: [...(this.state.tipicos || []), prev] });
        }
        return ok;
    }

    async addCubiculos(cubiculos) {
        const now = new Date().toISOString();
        const item = {
            ...cubiculos,
            id: cubiculos.id || crypto.randomUUID(),
            createdAt: cubiculos.createdAt || now,
            updatedAt: now
        };
        this.setState({ cubiculos: [...(this.state.cubiculos || []), item] });
        console.log('[Cubiculos] Creating:', item.id, item.nome);
        const ok = await this._syncCreate('cubiculos', item);
        if (!ok) {
            this.setState({ cubiculos: (this.state.cubiculos || []).filter(c => c.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateCubiculos(id, updates) {
        const now = new Date().toISOString();
        console.log('[Cubiculos] Updating:', id);
        const prev = (this.state.cubiculos || []).find(c => c.id === id);
        const newItems = (this.state.cubiculos || []).map(c => {
            if (c.id !== id) return c;
            return { ...c, ...updates, updatedAt: now };
        });
        this.setState({ cubiculos: newItems });
        const ok = await this._syncUpdate('cubiculos', id, updates);
        if (!ok && prev) {
            this.setState({ cubiculos: (this.state.cubiculos || []).map(c => c.id === id ? prev : c) });
        }
        return ok;
    }

    async deleteCubiculos(id) {
        const prev = (this.state.cubiculos || []).find(c => c.id === id);
        this.setState({ cubiculos: (this.state.cubiculos || []).filter(c => c.id !== id) });
        const ok = await this._syncDelete('cubiculos', id);
        if (!ok && prev) {
            this.setState({ cubiculos: [...(this.state.cubiculos || []), prev] });
        }
        return ok;
    }

    bulkUpdateMaterials(filters, updateData) {
        const { fabricante, categoria, area, grupoSiemens } = filters;
        const { type, value, title, date } = updateData;

        const newItems = (this.state.materiais || []).map(m => {
            const matchFab = !fabricante || m.fabricante === fabricante;
            const matchCat = !categoria || m.categoria === categoria;
            const matchArea = !area || m.area === area;
            const matchGrupo = !grupoSiemens || m.grupoSiemens === grupoSiemens;

            if (matchFab && matchCat && matchArea && matchGrupo) {
                let newCusto = m.custo;
                if (type === 'percent') {
                    newCusto = m.custo * (1 + (value / 100));
                } else if (type === 'fixed') {
                    newCusto = value;
                }

                return {
                    ...m,
                    custo: newCusto,
                    priceHistory: [...(m.priceHistory || []), {
                        custo: parseFloat(m.custo) || 0,
                        markup: parseFloat(m.markup) || 0,
                        date: date || new Date().toISOString(),
                        title: title || 'Reajuste em Massa',
                        origin: 'bulk'
                    }],
                    lastUpdateDate: date || new Date().toISOString(),
                    lastUpdateTitle: title || 'Reajuste em Massa'
                };
            }
            return m;
        });

        this.setState({ materiais: newItems });
        this._syncUpdate('materiais', null, { materiais: newItems });
    }

    importPricesByCode(updates, metadata) {
        const { title, date } = metadata;
        let updateCount = 0;

        const newItems = (this.state.materiais || []).map(m => {
            const update = updates.find(u =>
                (u.code && m.codigoInterno && String(u.code).trim().toLowerCase() === String(m.codigoInterno).trim().toLowerCase()) ||
                (u.code && m.codigoFabricante && String(u.code).trim().toLowerCase() === String(m.codigoFabricante).trim().toLowerCase())
            );

            if (update) {
                if (update.rowFabricante && m.fabricante) {
                    const rowFab = String(update.rowFabricante).trim().toLowerCase();
                    const matFab = String(m.fabricante).trim().toLowerCase();
                    if (rowFab !== matFab) return m;
                }

                let newCusto = parseFloat(update.newCost);
                if (isNaN(newCusto)) newCusto = m.custo;

                if (update.discount && !isNaN(update.discount)) {
                    newCusto = newCusto * (1 - update.discount / 100);
                }

                const newMarkup = update.newMarkup !== null && !isNaN(update.newMarkup)
                    ? update.newMarkup : m.markup;

                updateCount++;
                return {
                    ...m,
                    custo: newCusto,
                    markup: newMarkup,
                    priceHistory: [...(m.priceHistory || []), {
                        custo: parseFloat(m.custo) || 0,
                        markup: parseFloat(m.markup) || 0,
                        date: date || new Date().toISOString(),
                        title: title || 'Importação de Planilha',
                        origin: 'import'
                    }],
                    lastUpdateDate: date || new Date().toISOString(),
                    lastUpdateTitle: title || 'Importação de Planilha'
                };
            }
            return m;
        });

        if (updateCount > 0) {
            this.setState({ materiais: newItems });
        }
        return updateCount;
    }

    isCodeDuplicate(code, excludeId = null) {
        if (!code) return false;
        const normalized = String(code).trim().toLowerCase();
        return (this.state.materiais || []).some(m =>
            m.id !== excludeId &&
            ((m.codigoInterno && String(m.codigoInterno).trim().toLowerCase() === normalized) ||
             (m.codigoFabricante && String(m.codigoFabricante).trim().toLowerCase() === normalized))
        );
    }

    // --- Regras de Derivação ---

    async addRegraDerivacao(regra) {
        const now = new Date().toISOString();
        const item = {
            ...regra,
            id: regra.id || crypto.randomUUID(),
            created_at: regra.created_at || now,
            updated_at: now,
            condicoes: typeof regra.condicoes === 'string' ? regra.condicoes : JSON.stringify(regra.condicoes || []),
            acoes: typeof regra.acoes === 'string' ? regra.acoes : JSON.stringify(regra.acoes || []),
            prioridade: parseInt(regra.prioridade) || 0,
            regra_ativa: regra.regra_ativa !== undefined ? (regra.regra_ativa ? 1 : 0) : 1
        };
        this.setState({ regrasDerivacao: [...(this.state.regrasDerivacao || []), item] });
        const ok = await this._syncCreate('regrasDerivacao', item);
        if (!ok) {
            this.setState({ regrasDerivacao: (this.state.regrasDerivacao || []).filter(r => r.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateRegraDerivacao(id, updates) {
        const now = new Date().toISOString();
        const data = { ...updates, updated_at: now };
        if (data.condicoes && typeof data.condicoes === 'object') data.condicoes = JSON.stringify(data.condicoes);
        if (data.acoes && typeof data.acoes === 'object') data.acoes = JSON.stringify(data.acoes);
        const prev = (this.state.regrasDerivacao || []).find(r => r.id === id);
        const newItems = (this.state.regrasDerivacao || []).map(r => {
            if (r.id !== id) return r;
            return { ...r, ...data };
        });
        this.setState({ regrasDerivacao: newItems });
        const ok = await this._syncUpdate('regrasDerivacao', id, data);
        if (!ok && prev) {
            this.setState({ regrasDerivacao: (this.state.regrasDerivacao || []).map(r => r.id === id ? prev : r) });
        }
        return ok;
    }

    async deleteRegraDerivacao(id) {
        const prev = (this.state.regrasDerivacao || []).find(r => r.id === id);
        this.setState({ regrasDerivacao: (this.state.regrasDerivacao || []).filter(r => r.id !== id) });
        const ok = await this._syncDelete('regrasDerivacao', id);
        if (!ok && prev) {
            this.setState({ regrasDerivacao: [...(this.state.regrasDerivacao || []), prev] });
        }
        return ok;
    }

    // --- Composições ---

    async addComposicao(composicao) {
        const now = new Date().toISOString();
        const item = {
            ...composicao,
            id: composicao.id || crypto.randomUUID(),
            created_at: composicao.created_at || now,
            updated_at: now,
            coeficiente_hh: parseFloat(composicao.coeficiente_hh) || 0,
            fator_simples: parseFloat(composicao.fator_simples) || 0.8,
            fator_medio: parseFloat(composicao.fator_medio) || 1.0,
            fator_complexo: parseFloat(composicao.fator_complexo) || 1.3
        };
        this.setState({ composicoes: [...(this.state.composicoes || []), item] });
        const ok = await this._syncCreate('composicoes', item);
        if (!ok) {
            this.setState({ composicoes: (this.state.composicoes || []).filter(c => c.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateComposicao(id, updates) {
        const now = new Date().toISOString();
        const prev = (this.state.composicoes || []).find(c => c.id === id);
        const newItems = (this.state.composicoes || []).map(c => {
            if (c.id !== id) return c;
            return { ...c, ...updates, updated_at: now };
        });
        this.setState({ composicoes: newItems });
        const ok = await this._syncUpdate('composicoes', id, updates);
        if (!ok && prev) {
            this.setState({ composicoes: (this.state.composicoes || []).map(c => c.id === id ? prev : c) });
        }
        return ok;
    }

    async deleteComposicao(id) {
        const prev = (this.state.composicoes || []).find(c => c.id === id);
        this.setState({ composicoes: (this.state.composicoes || []).filter(c => c.id !== id) });
        const ok = await this._syncDelete('composicoes', id);
        if (!ok && prev) {
            this.setState({ composicoes: [...(this.state.composicoes || []), prev] });
        }
        return ok;
    }

    cleanupDuplicateMaterials() {
        const materials = this.state.materiais || [];
        const seenCodes = new Set();
        const cleaned = [];
        let count = 0;

        const sorted = [...materials].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        sorted.forEach(m => {
            const code = m.codigoInterno || m.codigoFabricante;
            if (!code) {
                cleaned.push(m);
                return;
            }

            const normalized = String(code).trim().toLowerCase();
            if (!seenCodes.has(normalized)) {
                seenCodes.add(normalized);
                cleaned.push(m);
            } else {
                count++;
            }
        });

        if (count > 0) {
            this.setState({ materiais: cleaned });
        }
        return count;
    }

    getPriceHistory(id) {
        const m = (this.state.materiais || []).find(m => m.id === id);
        return m ? [...(m.priceHistory || [])].reverse() : [];
    }

    restorePrice(id, historyIndex) {
        const m = (this.state.materiais || []).find(m => m.id === id);
        if (!m) return;

        const history = m.priceHistory || [];
        const entry = history[historyIndex];
        if (!entry) return;

        const now = new Date().toISOString();
        const newItems = (this.state.materiais || []).map(mat => {
            if (mat.id !== id) return mat;
            return {
                ...mat,
                custo: entry.custo,
                markup: entry.markup,
                lastUpdateDate: now,
                lastUpdateTitle: `Restaurado: ${entry.title}`,
                priceHistory: [...(mat.priceHistory || []), {
                    custo: entry.custo,
                    markup: entry.markup,
                    date: now,
                    title: `Restaurado de: ${entry.title}`,
                    origin: 'restore'
                }]
            };
        });
        this.setState({ materiais: newItems });
    }

    // --- Price Import Templates ---

    savePriceImportTemplate(fornecedorId, template) {
        const templates = { ...(this.state.priceImportTemplates || {}) };
        templates[fornecedorId] = {
            ...template,
            updatedAt: new Date().toISOString()
        };
        this.setState({ priceImportTemplates: templates });
    }

    deletePriceImportTemplate(fornecedorId) {
        const templates = { ...(this.state.priceImportTemplates || {}) };
        delete templates[fornecedorId];
        this.setState({ priceImportTemplates: templates });
    }

    getPriceImportTemplate(fornecedorId) {
        return (this.state.priceImportTemplates || {})[fornecedorId] || null;
    }

    // --- Import Session / Undo Import ---

    recordImportSession(session) {
        const sessions = [...(this.state._importSessions || [])];
        sessions.unshift(session);
        if (sessions.length > 10) sessions.length = 10;
        this.setState({ _importSessions: sessions });
        this._persistImportSessions();
    }

    async undoImport(sessionId) {
        const sessions = [...(this.state._importSessions || [])];
        const idx = sessions.findIndex(s => s.id === sessionId);
        if (idx === -1) return 'not-found';

        const session = sessions[idx];
        let hasError = false;

        // 1. Delete added materials
        for (const id of session.addedIds || []) {
            const ok = await this.deleteMaterial(id);
            if (!ok) hasError = true;
        }

        // 2. Restore modified materials to pre-import state
        const snapshots = session.snapshots || {};
        for (const [id, prevState] of Object.entries(snapshots)) {
            const restored = JSON.parse(JSON.stringify(prevState));
            this.setState({
                materiais: (this.state.materiais || []).map(m => m.id === id ? restored : m)
            });
            const ok = await this._syncUpdate('materiais', id, restored);
            if (!ok) hasError = true;
        }

        // 3. Remove session from tracking
        sessions.splice(idx, 1);
        this.setState({ _importSessions: sessions });
        this._persistImportSessions();

        return hasError ? 'partial' : 'ok';
    }

    getImportSessions() {
        return [...(this.state._importSessions || [])];
    }

    _persistImportSessions() {
        try {
            localStorage.setItem('gerapro_import_sessions', JSON.stringify(this.state._importSessions || []));
        } catch (e) {
            console.warn('[Store] Failed to persist import sessions:', e);
        }
    }

    _loadImportSessions() {
        try {
            const data = localStorage.getItem('gerapro_import_sessions');
            if (data) {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    this.state._importSessions = parsed;
                }
            }
        } catch (e) {
            console.warn('[Store] Failed to load import sessions:', e);
        }
    }

    // --- CRM Lead Methods ---

    async addCrmLead(lead) {
        const now = new Date().toISOString();
        const item = {
            ...lead,
            id: lead.id || crypto.randomUUID(),
            score: typeof lead.score === 'number' ? lead.score : 0,
            tags: Array.isArray(lead.tags) ? lead.tags : [],
            created_at: now,
            updated_at: now
        };
        this.setState({ crmLeads: [...(this.state.crmLeads || []), item] });
        const ok = await this._syncCreate('crmLeads', item);
        if (!ok) {
            this.setState({ crmLeads: (this.state.crmLeads || []).filter(l => l.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateCrmLead(id, updates) {
        const now = new Date().toISOString();
        const prev = (this.state.crmLeads || []).find(l => l.id === id);
        if (updates.tags && typeof updates.tags === 'string') {
            try { updates.tags = JSON.parse(updates.tags); } catch (e) { updates.tags = []; }
        }
        const newItems = (this.state.crmLeads || []).map(l => {
            if (l.id !== id) return l;
            return { ...l, ...updates, updated_at: now };
        });
        this.setState({ crmLeads: newItems });
        const ok = await this._syncUpdate('crmLeads', id, { ...updates, updated_at: now });
        if (!ok && prev) {
            this.setState({ crmLeads: (this.state.crmLeads || []).map(l => l.id === id ? prev : l) });
        }
        return ok;
    }

    async deleteCrmLead(id) {
        const prev = (this.state.crmLeads || []).find(l => l.id === id);
        this.setState({ crmLeads: (this.state.crmLeads || []).filter(l => l.id !== id) });
        const ok = await this._syncDelete('crmLeads', id);
        if (!ok && prev) {
            this.setState({ crmLeads: [...(this.state.crmLeads || []), prev] });
        }
        return ok;
    }

    async bulkCreateCrmLeads(items) {
        const now = new Date().toISOString();
        const novos = items.map(item => ({
            ...item,
            id: item.id || crypto.randomUUID(),
            score: typeof item.score === 'number' ? item.score : 0,
            tags: Array.isArray(item.tags) ? item.tags : [],
            status: item.status || 'novo',
            created_at: now,
            updated_at: now
        }));
        this.setState({ crmLeads: [...(this.state.crmLeads || []), ...novos] });
        const token = this.state.auth.token;
        if (!token) { return null; }
        try {
            const res = await fetch(`${this._getServerUrl()}/api/crmLeads/import-bulk`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(novos)
            });
            const data = await res.json();
            if (data.success) {
                return data;
            } else {
                this.setState({ crmLeads: (this.state.crmLeads || []).filter(l => !novos.find(n => n.id === l.id)) });
                return null;
            }
        } catch (err) {
            console.error('[BulkCreate] Error:', err);
            this.setState({ crmLeads: (this.state.crmLeads || []).filter(l => !novos.find(n => n.id === l.id)) });
            return null;
        }
    }

    // --- CRM Interações Methods ---

    async addCrmInteracao(interacao) {
        const now = new Date().toISOString();
        const item = {
            ...interacao,
            id: interacao.id || crypto.randomUUID(),
            created_at: now,
            data_hora: interacao.data_hora || now
        };
        this.setState({ crmInteracoes: [...(this.state.crmInteracoes || []), item] });
        const ok = await this._syncCreate('crmInteracoes', item);
        if (!ok) {
            this.setState({ crmInteracoes: (this.state.crmInteracoes || []).filter(i => i.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateCrmInteracao(id, updates) {
        const now = new Date().toISOString();
        const prev = (this.state.crmInteracoes || []).find(i => i.id === id);
        const newItems = (this.state.crmInteracoes || []).map(i => {
            if (i.id !== id) return i;
            return { ...i, ...updates };
        });
        this.setState({ crmInteracoes: newItems });
        const ok = await this._syncUpdate('crmInteracoes', id, updates);
        if (!ok && prev) {
            this.setState({ crmInteracoes: (this.state.crmInteracoes || []).map(i => i.id === id ? prev : i) });
        }
        return ok;
    }

    async deleteCrmInteracao(id) {
        const prev = (this.state.crmInteracoes || []).find(i => i.id === id);
        this.setState({ crmInteracoes: (this.state.crmInteracoes || []).filter(i => i.id !== id) });
        const ok = await this._syncDelete('crmInteracoes', id);
        if (!ok && prev) {
            this.setState({ crmInteracoes: [...(this.state.crmInteracoes || []), prev] });
        }
        return ok;
    }

    // --- CRM Tarefas Methods ---

    async addCrmTarefa(tarefa) {
        const now = new Date().toISOString();
        const item = {
            ...tarefa,
            id: tarefa.id || crypto.randomUUID(),
            created_at: now
        };
        this.setState({ crmTarefas: [...(this.state.crmTarefas || []), item] });
        const ok = await this._syncCreate('crmTarefas', item);
        if (!ok) {
            this.setState({ crmTarefas: (this.state.crmTarefas || []).filter(t => t.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateCrmTarefa(id, updates) {
        const now = new Date().toISOString();
        const prev = (this.state.crmTarefas || []).find(t => t.id === id);
        const newItems = (this.state.crmTarefas || []).map(t => {
            if (t.id !== id) return t;
            return { ...t, ...updates };
        });
        this.setState({ crmTarefas: newItems });
        const ok = await this._syncUpdate('crmTarefas', id, updates);
        if (!ok && prev) {
            this.setState({ crmTarefas: (this.state.crmTarefas || []).map(t => t.id === id ? prev : t) });
        }
        return ok;
    }

    async deleteCrmTarefa(id) {
        const prev = (this.state.crmTarefas || []).find(t => t.id === id);
        this.setState({ crmTarefas: (this.state.crmTarefas || []).filter(t => t.id !== id) });
        const ok = await this._syncDelete('crmTarefas', id);
        if (!ok && prev) {
            this.setState({ crmTarefas: [...(this.state.crmTarefas || []), prev] });
        }
        return ok;
    }

    // --- CRM Notas Methods ---

    async addCrmNota(nota) {
        const now = new Date().toISOString();
        const item = {
            ...nota,
            id: nota.id || crypto.randomUUID(),
            created_at: now,
            updated_at: now
        };
        this.setState({ crmNotas: [...(this.state.crmNotas || []), item] });
        const ok = await this._syncCreate('crmNotas', item);
        if (!ok) {
            this.setState({ crmNotas: (this.state.crmNotas || []).filter(n => n.id !== item.id) });
            return null;
        }
        return item;
    }

    async deleteCrmNota(id) {
        const prev = (this.state.crmNotas || []).find(n => n.id === id);
        this.setState({ crmNotas: (this.state.crmNotas || []).filter(n => n.id !== id) });
        const ok = await this._syncDelete('crmNotas', id);
        if (!ok && prev) {
            this.setState({ crmNotas: [...(this.state.crmNotas || []), prev] });
        }
        return ok;
    }

    // --- CRM Email Templates Methods ---

    async addCrmEmailTemplate(template) {
        const now = new Date().toISOString();
        const item = {
            ...template,
            id: template.id || crypto.randomUUID(),
            created_at: now,
            updated_at: now
        };
        this.setState({ crmEmailTemplates: [...(this.state.crmEmailTemplates || []), item] });
        const ok = await this._syncCreate('crmEmailTemplates', item);
        if (!ok) {
            this.setState({ crmEmailTemplates: (this.state.crmEmailTemplates || []).filter(t => t.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateCrmEmailTemplate(id, updates) {
        const now = new Date().toISOString();
        const prev = (this.state.crmEmailTemplates || []).find(t => t.id === id);
        const newItems = (this.state.crmEmailTemplates || []).map(t => {
            if (t.id !== id) return t;
            return { ...t, ...updates, updated_at: now };
        });
        this.setState({ crmEmailTemplates: newItems });
        const ok = await this._syncUpdate('crmEmailTemplates', id, { ...updates, updated_at: now });
        if (!ok && prev) {
            this.setState({ crmEmailTemplates: (this.state.crmEmailTemplates || []).map(t => t.id === id ? prev : t) });
        }
        return ok;
    }

    async deleteCrmEmailTemplate(id) {
        const prev = (this.state.crmEmailTemplates || []).find(t => t.id === id);
        this.setState({ crmEmailTemplates: (this.state.crmEmailTemplates || []).filter(t => t.id !== id) });
        const ok = await this._syncDelete('crmEmailTemplates', id);
        if (!ok && prev) {
            this.setState({ crmEmailTemplates: [...(this.state.crmEmailTemplates || []), prev] });
        }
        return ok;
    }

    // --- CRM Stages Methods ---

    getCrmStages() {
        return this.state.crmStages || [];
    }

    async addCrmStage(data) {
        const now = new Date().toISOString();
        const item = {
            ...data,
            id: data.id || crypto.randomUUID(),
            created_at: now,
            updated_at: now
        };
        this.setState({ crmStages: [...(this.state.crmStages || []), item] });
        const ok = await this._syncCreate('crmStages', item);
        if (!ok) {
            this.setState({ crmStages: (this.state.crmStages || []).filter(s => s.id !== item.id) });
            return null;
        }
        return item;
    }

    async updateCrmStage(id, updates) {
        const now = new Date().toISOString();
        const prev = (this.state.crmStages || []).find(s => s.id === id);
        if (!prev) return false;
        if (updates.is_default) {
            this.setState({ crmStages: (this.state.crmStages || []).map(s => ({ ...s, is_default: s.id === id ? 1 : 0 })) });
        } else {
            const newItems = (this.state.crmStages || []).map(s => {
                if (s.id !== id) return s;
                return { ...s, ...updates, updated_at: now };
            });
            this.setState({ crmStages: newItems });
        }
        const ok = await this._syncUpdate('crmStages', id, { ...updates, updated_at: now });
        if (!ok && prev) {
            this.setState({ crmStages: (this.state.crmStages || []).map(s => s.id === id ? prev : s) });
        }
        return ok;
    }

    async deleteCrmStage(id) {
        const prev = (this.state.crmStages || []).find(s => s.id === id);
        this.setState({ crmStages: (this.state.crmStages || []).filter(s => s.id !== id) });
        const ok = await this._syncDelete('crmStages', id);
        if (!ok && prev) {
            this.setState({ crmStages: [...(this.state.crmStages || []), prev] });
        }
        return ok;
    }

    async reorderCrmStages(orderedIds) {
        const updated = (orderedIds || []).map((id, i) => {
            const s = (this.state.crmStages || []).find(st => st.id === id);
            return s ? { ...s, position: i, updated_at: new Date().toISOString() } : null;
        }).filter(Boolean);
        this.setState({ crmStages: updated });
        const token = this.state.auth.token;
        if (!token) return true;
        try {
            const res = await fetch(`${this._getServerUrl()}/api/crmStages/reorder`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds })
            });
            return res.ok;
        } catch (e) {
            console.error('[ReorderStages] Error:', e);
            return false;
        }
    }

    async resetCrmStages() {
        const token = this.state.auth.token;
        if (!token) return false;
        try {
            const res = await fetch(`${this._getServerUrl()}/api/crmStages/reset`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    this.setState({ crmStages: data.data || [] });
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.error('[ResetStages] Error:', e);
            return false;
        }
    }
}

export const store = new Store();
