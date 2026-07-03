import { store } from './state.js';

console.log('[Importacao] LOADED - V2 (Re-written)');

const ImportacaoModule = {
    init() {
        console.log('[Importacao] Initializing...');
        try {
            this.cacheDOM();
            this.bindEvents();
            console.log('[Importacao] Initialization complete.');
        } catch (err) {
            console.error('[Importacao] Initialization FAILED:', err);
        }
    },

    cacheDOM() {
        this.dom = {
            fileInput: document.getElementById('file-import'),
            previewSection: document.getElementById('import-preview'),
            previewTable: document.getElementById('table-import-preview'),
            btnProcess: document.getElementById('btn-process-import')
        };
    },

    bindEvents() {
        if (this.dom.fileInput) {
            this.dom.fileInput.addEventListener('change', (e) => {
                console.log('[Importacao] File selected');
                this.handleFileSelect(e);
            });
        }
        if (this.dom.btnProcess) {
            console.log('[Importacao] Binding click event to btn-process-import');
            this.dom.btnProcess.onclick = () => { // Changed to onclick to avoid multiple listeners if reloaded
                console.log('[Importacao] Process button clicked');
                this.processImport();
            };
        } else {
            console.error('[Importacao] btn-process-import NOT FOUND in DOM');
        }
    },

    handleFileSelect(event) {
        console.log('[Importacao] Handling file select');
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('[Importacao] File read complete');
            const csv = e.target.result;
            this.parsedData = this.parseCSV(csv);
            console.log('[Importacao] Parsed data:', this.parsedData);
            this.renderPreview(this.parsedData);
        };
        reader.readAsText(file);
    },

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(l => l.trim().length > 0);
        const result = [];

        // Simple CSV parser
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('[Importacao] CSV Headers:', headers);

        for (let i = 1; i < lines.length; i++) {
            const obj = {};
            // Better regex split to handle quotes? Keeping it simple for Vanilla prototype
            const currentline = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));

            headers.forEach((header, index) => {
                obj[header] = currentline[index];
            });
            result.push(obj);
        }
        return result;
    },

    renderPreview(data) {
        console.log('[Importacao] Rendering preview');
        this.dom.previewSection.style.display = 'block';
        const thead = this.dom.previewTable.querySelector('thead');
        const tbody = this.dom.previewTable.querySelector('tbody');

        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        // Show first 5 rows
        tbody.innerHTML = data.slice(0, 5).map(row => `
            <tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>
        `).join('');
    },

    processImport() {
        console.log('[Importacao] Processing import...');
        if (!this.parsedData || this.parsedData.length === 0) {
            console.warn('[Importacao] No parsed data to process');
            return;
        }

        let successCount = 0;
        const newMaterials = this.parsedData.map(row => {
            // Flexible matching
            const findKey = (keys) => keys.find(k => row[k] !== undefined);

            const descKey = findKey(['Descricao', 'Descrição', 'descricao', 'description']);
            const desc = row[descKey] || 'Item Importado';
            const cost = parseFloat(row[findKey(['Preco', 'Preço', 'Custo', 'Cost', 'custo'])]) || 0;
            const areaKey = findKey(['Area', 'Área', 'area', 'área', 'Setor', 'Local']);

            console.log(`[Importacao] Row processing. DescKey: ${descKey}, Desc: ${desc}, Cost: ${cost}`);

            if (!desc || desc === 'Item Importado') return null; // Skip empty rows

            successCount++;
            return {
                id: crypto.randomUUID(),
                codigoInterno: row[findKey(['Codigo', 'Código', 'Code', 'codigo'])] || 'IMP-' + Math.floor(Math.random() * 100000),
                codigoFabricante: row[findKey(['PartNumber', 'PN', 'Referencia'])] || '',
                descricao: desc,
                custo: cost,
                fabricante: row[findKey(['Fabricante', 'Marca', 'Manufacturer'])] || 'Genérico',
                unidade: row[findKey(['Unidade', 'Unit', 'unidade'])] || 'un',
                categoria: 'Outros', // Default category
                area: areaKey ? String(row[areaKey]).trim() : '',
                markup: 0, // Default
                createdAt: new Date()
            };
        }).filter(item => item !== null);

        console.log('[Importacao] Success count:', successCount);

        if (successCount === 0) {
            window.app.toast("Nenhum item válido encontrado para importar. Verifique o CSV.", "error");
            return;
        }

        // Add to store
        const currentMaterials = store.getState().materiais;
        store.setState({ materiais: [...currentMaterials, ...newMaterials] });

        window.app.toast(`${successCount} itens importados com sucesso!`, "success");
        this.dom.previewSection.style.display = 'none';

        this.dom.fileInput.value = '';
        this.parsedData = null;
    }
};

window.ImportacaoModule = ImportacaoModule;
ImportacaoModule.init();
