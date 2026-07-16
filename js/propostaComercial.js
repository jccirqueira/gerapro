import { store } from './state.js';

/**
 * Proposta Comercial Module
 * Manages commercial proposals.
 */

window.app = window.app || {};

const PropostaComercialModule = {
    init() {
        console.log("Proposta Comercial Module Initializing...");
        window.app.propostaComercial = {
            updateContactDropdown: this.updateContactDropdown.bind(this),
            handleContactSelection: this.handleContactSelection.bind(this),
            edit: this.edit.bind(this),
            save: this.save.bind(this),
        };
        this.viewMode = 'list';
    },

    updateContactDropdown(clientName, selectedContact = null) {
        const container = document.getElementById('pc_contact_container');
        const msgDiv = document.getElementById('pc_no_contact_msg');
        if (!container) return;

        const slug = (s) => (s || '').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const targetSlug = slug(clientName);
        
        const state = store.getState();
        const client = state.clientes.find(c => slug(c.razaoSocial) === targetSlug);
        
        console.log(`[PropostaComercial] Search for "${clientName}" (slug: ${targetSlug}). Found?`, !!client);

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

            // Fill unidade dropdown for AUTPRO clients
            const unidadeSel = document.getElementById('pc_unidade_cliente');
            if (unidadeSel) {
                const unidades = state.unidadesCliente || [];
                const unidadesDoCliente = unidades.filter(u => u.cliente_id === client.id);
                const unidadesOptions = unidadesDoCliente.map(u => `\n                    <option value="${u.codigo_unidade}" ${data.unidade_cliente === u.codigo_unidade ? 'selected' : ''}>${u.codigo_unidade} - ${this._escapeHtml(u.nome_unidade || '')}</option>\n                `).join('');
                unidadeSel.innerHTML = `<option value="">Selecione uma unidade...</option>${unidadesOptions}`;

                const autoUnidade = window.app.currentPtcInfo?.autpro?.codigoUnidade || '';
                if (autoUnidade && unidadesDoCliente.some(u => u.codigo_unidade === autoUnidade)) {
                    unidadeSel.value = autoUnidade;
                } else if (data.unidade_cliente && unidadesDoCliente.some(u => u.codigo_unidade === data.unidade_cliente)) {
                    unidadeSel.value = data.unidade_cliente;
                }
            }
        } else {
            const unidadeSel = document.getElementById('pc_unidade_cliente');
            if (unidadeSel) unidadeSel.innerHTML = '<option value="">Selecione um cliente primeiro...</option>';
        }

        // Populate contact dropdown
        if (contacts.length > 0) {
            const options = contacts.map(c => {
                const isSelected = selectedContact === c.nome || (!selectedContact && contacts[0] === c);
                return `<option value="${c.nome}" ${isSelected ? 'selected' : ''}>${c.nome}</option>`;
            }).join('');
            container.innerHTML = `\n                <select name="aos_cuidados" id="pc_aos_cuidados" class="form-control" onchange="app.propostaComercial.handleContactSelection(this.value)">\n                    <option value="">Selecione um contato...</option>\n                    ${options}\n                </select>\n            `;
            if(msgDiv) msgDiv.style.display = 'none';
        } else {
            container.innerHTML = `\n                <select name="aos_cuidados" id="pc_aos_cuidados" class="form-control">\n                    <option value="">Nenhum contato encontrado</option>\n                </select>\n            `;
        }

        // Auto-fill email and phone from first contact
        const emailInput = document.getElementById('pc_email');
        const telInput = document.getElementById('pc_telefone');
        let primeiroContato = null;
        if (contacts.length > 0) {
            if (selectedContact) {
                primeiroContato = contacts.find(c => c.nome === selectedContact);
            }
            if (!primeiroContato) {
                primeiroContato = contacts[0];
            }
        }
        if (emailInput) emailInput.value = (primeiroContato && primeiroContato.email) || '';
        if (telInput) telInput.value = (primeiroContato && primeiroContato.telefone) || '';

        // Auto-fill cidade and uf
        const cidadeInput = document.getElementById('pc_cidade');
        const ufSelect = document.getElementById('pc_uf');
        const locInput = document.getElementById('pc_localizacao');
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
    },

    handleContactSelection(contactName) {
        const clientName = document.getElementById('pc_cliente').value;
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
        // Handle contact selection for the selected contact
        const contactInput = document.getElementById('pc_aos_cuidados');
        if (contactInput && contact) {
            contactInput.value = contact.nome;
        }
        const emailInput = document.getElementById('pc_email');
        const telInput = document.getElementById('pc_telefone');
        if (contact) {
            if (emailInput) emailInput.value = contact.email || '';
            if (telInput) telInput.value = contact.telefone || '';
        }
    },

    _escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};

window.app.propostaComercial = window.app.propostaComercial || {};