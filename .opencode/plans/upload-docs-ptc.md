# Plano: Upload de Documentos do Cliente ao Criar PTC

## 1. Server: `server_new.js` — `handleSaveFile` (linha 825)

Adicionar parâmetro `subfolder` com fallback para `Documentação Minha_Empresa`:

```js
function handleSaveFile(data, res, empresaId) {
    const { ptcFolder, filename, content, isBase64, revisionFolder, subfolder } = data;
    if (!ptcFolder || !filename || !content) {
        sendJson(res, 400, { success: false, error: 'Missing required fields (ptcFolder, filename, content)' });
        return;
    }
    const targetSubfolder = subfolder || 'Documentação Minha_Empresa';
    let docsDir = path.join(getFullPtcPath(empresaId, ptcFolder), targetSubfolder);
    // resto igual...
```

## 2. Frontend: `js/app.js` — `openPtcModal()` (entre linhas 2828-2829)

Inserir zona de upload de arquivos antes dos botões de ação:

```html
<div class="form-group">
    <label class="form-label">Documentos do Cliente (opcional)</label>
    <div class="upload-zone" style="border:2px dashed #cbd5e1;border-radius:8px;padding:20px;text-align:center;cursor:pointer;background:#f8fafc;transition:all 0.2s;"
         onclick="document.getElementById('ptc-files-input').click()"
         onmouseover="this.style.borderColor='#3b82f6';this.style.background='#eff6ff'"
         onmouseout="this.style.borderColor='#cbd5e1';this.style.background='#f8fafc'">
        <i class="ph ph-upload" style="font-size:28px;color:#94a3b8;"></i>
        <p style="color:#475569;margin:8px 0 4px;font-weight:500;">Clique para selecionar arquivos do cliente</p>
        <p style="color:#94a3b8;font-size:12px;margin:0;">PDF, DOCX, XLSX, DWG, imagens...</p>
        <input type="file" id="ptc-files-input" multiple hidden
               onchange="app.onPtcFilesSelected(event)">
    </div>
    <div id="ptc-files-list" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;"></div>
</div>
```

## 3. Frontend: `js/app.js` — Novo método `onPtcFilesSelected(event)`

Inserir após `onPtcUnidadeChange` (ou onde fizer sentido):

```js
onPtcFilesSelected(event) {
    const files = Array.from(event.target.files);
    if (!this._ptcFiles) this._ptcFiles = [];
    this._ptcFiles = this._ptcFiles.concat(files);

    const listEl = document.getElementById('ptc-files-list');
    if (!listEl) return;
    listEl.innerHTML = this._ptcFiles.map((f, i) =>
        `<span style="display:inline-flex;align-items:center;gap:4px;background:#e2e8f0;padding:4px 10px;border-radius:20px;font-size:12px;">
            <i class="ph ph-file"></i> ${f.name}
            <i class="ph ph-x" style="cursor:pointer;color:#ef4444;font-size:14px;"
               onclick="app._ptcFiles.splice(${i},1);this.closest('span').remove()"></i>
        </span>`
    ).join('');
    event.target.value = '';
}
```

## 4. Frontend: `js/app.js` — Modificar `savePtc()` (após linha 3136)

Após `if (document.getElementById('modal-ptc'))` e antes do `remove()`, adicionar uploads:

```js
// Upload de documentos do cliente
if (this._ptcFiles && this._ptcFiles.length > 0) {
    const _tk2388 = store.getState().auth?.token;
    const _headers2388 = { ...(_tk2388 ? { 'Authorization': 'Bearer ' + _tk2388 } : {}) };
    let uploaded = 0;
    for (const file of this._ptcFiles) {
        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            await fetch('/api/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ..._headers2388 },
                body: JSON.stringify({
                    ptcFolder: folderName,
                    filename: file.name,
                    content: base64,
                    isBase64: true,
                    subfolder: 'Documentação Cliente'
                })
            });
            uploaded++;
        } catch (e) {
            console.error('Erro ao enviar ' + file.name, e);
        }
    }
    this.showToast(`${uploaded} de ${this._ptcFiles.length} arquivo(s) enviado(s).`, 'success');
    delete this._ptcFiles;
}
```

## Arquivos a modificar

1. `server_new.js` — 1 alteração (adicionar `subfolder` no `handleSaveFile`)
2. `js/app.js` — 3 alterações:
   - Adicionar zona de upload no HTML do modal (`openPtcModal`)
   - Adicionar método `onPtcFilesSelected`
   - Adicionar lógica de upload em `savePtc`
