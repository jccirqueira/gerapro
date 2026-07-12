window.ScreenshotTool = {
  _modal: null,

  init() {
    const header = document.querySelector('.app-header') || document.querySelector('.main-header') || document.querySelector('header');
    if (!header) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost';
    btn.title = 'Capturar tela para Ajuda';
    btn.style.cssText = 'padding:6px;font-size:13px;gap:4px;';
    btn.innerHTML = '<i class="ph ph-camera"></i>';
    btn.onclick = () => this._showPanel();

    const container = header.querySelector('[data-help-capture-insert]') || header.querySelector('.header-actions, .header-right, .nav-actions');
    if (container) {
      container.appendChild(btn);
    } else {
      header.appendChild(btn);
    }
  },

  _showPanel() {
    this._modal = document.createElement('div');
    this._modal.className = 'ajuda-overlay';
    this._modal.style.alignItems = 'flex-start';
    this._modal.style.paddingTop = '10vh';
    this._modal.innerHTML = `
      <div class="ajuda-modal" style="max-width:640px;height:auto;max-height:80vh;">
        <div class="ajuda-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <i class="ph ph-camera" style="font-size:20px;color:var(--color-accent);"></i>
            <h3 style="margin:0;font-size:16px;font-weight:700;">Capturar Screenshot para Ajuda</h3>
          </div>
          <button type="button" class="btn btn-ghost" onclick="ScreenshotTool._modal?.remove()" style="padding:4px;">
            <i class="ph ph-x" style="font-size:20px;"></i>
          </button>
        </div>
        <div class="ajuda-content" style="padding:24px;">
          <div class="ajuda-section-desc" style="margin-bottom:20px;">
            Preencha os campos abaixo e clique em "Capturar". O screenshot será baixado e o snippet de código será copiado para a área de transferência.
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block;font-size:12px;font-weight:600;color:var(--color-text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Módulo (key)</label>
            <select id="ss-module" class="form-control" style="width:100%;">
              <option value="">— Selecione o módulo —</option>
              ${this._moduleOptions()}
            </select>
          </div>

          <div style="margin-bottom:16px;">
            <label style="display:block;font-size:12px;font-weight:600;color:var(--color-text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Seção (id)</label>
            <select id="ss-section" class="form-control" style="width:100%;">
              <option value="">— Selecione a seção —</option>
            </select>
          </div>

          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:12px;font-weight:600;color:var(--color-text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Preview do caminho</label>
            <code id="ss-path" style="display:block;background:var(--neutral-100);padding:10px 14px;border-radius:6px;font-size:13px;word-break:break-all;">prints/</code>
          </div>

          <div style="display:flex;gap:12px;justify-content:flex-end;border-top:1px solid var(--color-divider);padding-top:16px;">
            <button type="button" class="btn btn-ghost" onclick="ScreenshotTool._modal?.remove()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="ScreenshotTool._capture()">
              <i class="ph ph-camera"></i> Capturar
            </button>
          </div>

          <div id="ss-result" style="display:none;margin-top:16px;padding:12px 16px;background:var(--green-100);border-radius:6px;border-left:3px solid var(--green-600);">
            <strong style="font-size:13px;">✓ Capturado!</strong>
            <p style="font-size:12px;margin:4px 0;">Snippet copiado para área de transferência:</p>
            <code id="ss-snippet" style="display:block;background:#fff;padding:8px 12px;border-radius:4px;font-size:12px;margin-top:4px;word-break:break-all;"></code>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this._modal);

    const modSelect = document.getElementById('ss-module');
    const secSelect = document.getElementById('ss-section');
    const pathEl = document.getElementById('ss-path');

    modSelect.addEventListener('change', () => {
      const modKey = modSelect.value;
      const mod = window.AJUDA_CONTEUDO[modKey];
      secSelect.innerHTML = '<option value="">— Selecione a seção —</option>';
      if (mod && mod.secoes) {
        mod.secoes.forEach(sec => {
          const opt = document.createElement('option');
          opt.value = sec.id;
          opt.textContent = `${sec.titulo} (${sec.id})`;
          secSelect.appendChild(opt);
        });
      }
      this._updatePath(modKey, null, pathEl);
    });

    secSelect.addEventListener('change', () => {
      this._updatePath(modSelect.value, secSelect.value, pathEl);
    });
  },

  _moduleOptions() {
    let html = '';
    if (window.AJUDA_CATEGORIAS) {
      html += '<optgroup label="Geral">';
      html += '<option value="_geral">Sobre o GeraPro (_geral)</option>';
      html += '</optgroup>';
      window.AJUDA_CATEGORIAS.forEach(cat => {
        html += `<optgroup label="${cat.label}">`;
        cat.modules.forEach(key => {
          const mod = window.AJUDA_CONTEUDO[key];
          if (mod) {
            html += `<option value="${key}">${mod.titulo} (${key})</option>`;
          }
        });
        html += '</optgroup>';
      });
    }
    return html;
  },

  _updatePath(modKey, secId, el) {
    if (modKey && secId) {
      el.textContent = `prints/${modKey}/${secId}.png`;
    } else if (modKey) {
      el.textContent = `prints/${modKey}/`;
    } else {
      el.textContent = 'prints/';
    }
  },

  _capture() {
    const modKey = document.getElementById('ss-module').value;
    const secId = document.getElementById('ss-section').value;
    if (!modKey || !secId) {
      alert('Selecione o módulo e a seção.');
      return;
    }

    const path = `prints/${modKey}/${secId}.png`;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `${modKey}_${secId}_${timestamp}.png`;

    const snippet = `      {\n        id: '${secId}',\n        titulo: '${this._escapeStr(document.querySelector('#ss-section option:checked')?.textContent?.split(' (')[0] || secId)}',\n        screenshot: '${path}'\n      }`;

    const mod = window.AJUDA_CONTEUDO[modKey];
    const modTitle = mod ? mod.titulo : modKey;
    const secEl = document.querySelector('#ss-section option:checked');
    const secTitle = secEl ? secEl.textContent.split(' (')[0] : secId;
    const fallbackEl = document.querySelector('.ajuda-screenshot-fallback');
    const imgEl = document.querySelector('.ajuda-screenshot-wrapper img');

    document.getElementById('ss-snippet').textContent = snippet;

    const result = document.getElementById('ss-result');
    result.style.display = 'block';

    const textarea = document.createElement('textarea');
    textarea.value = snippet;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(textarea);

    this._simulateCapture(path, filename, modKey, secId);
  },

  _simulateCapture(path, filename, modKey, secId) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('GeraPro — Captura de Tela', 40, 60);
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(`Módulo: ${modKey}  |  Seção: ${secId}`, 40, 96);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(`Salvar como: ${filename}`, 40, 130);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Esta é uma captura simulada. Para capturar a tela real:', 40, 180);
    ctx.fillStyle = '#475569';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('1. Abra a tela do sistema correspondente', 40, 216);
    ctx.fillText('2. Pressione Print Screen (PrtScn)', 40, 240);
    ctx.fillText('3. Cole no Paint/Photoshop e salve como PNG', 40, 264);
    ctx.fillText(`4. Salve em: prints/${modKey}/${secId}.png`, 40, 288);
    ctx.fillText('5. Atualize o screenshot no ajuda-conteudo.js se necessário', 40, 312);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    }, 'image/png');
  },

  _escapeStr(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
  }
};

// Self-initialize after a short delay to ensure the app header is rendered
setTimeout(() => window.ScreenshotTool.init(), 3000);
