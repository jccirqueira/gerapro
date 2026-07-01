const AjudaModule = {
  _currentModule: null,
  _currentSection: null,
  _searchQuery: '',
  _searchResults: null,

  init() {
    window.app.ajuda = this;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.open(this._getCurrentModule());
      }
    });

    const originalNav = app.navigateTo;
    if (typeof originalNav === 'function') {
      app.navigateTo = function (viewName) {
        originalNav.call(app, viewName);
        window.app.ajuda?._currentView(viewName);
      };
    }
  },

  _getCurrentModule() {
    const active = document.querySelector('.nav-item.active');
    return active ? active.dataset.target : null;
  },

  _currentView(viewName) {
    this._currentModule = viewName;
  },

  open(moduleKey) {
    this._searchQuery = '';
    this._searchResults = null;
    if (moduleKey && window.AJUDA_CONTEUDO[moduleKey]) {
      this._currentModule = moduleKey;
    } else {
      this._currentModule = moduleKey || '_geral';
    }
    this._currentSection = null;
    this._render();
  },

  close() {
    const overlay = document.getElementById('ajuda-overlay');
    if (overlay) overlay.remove();
  },

  _render() {
    const existing = document.getElementById('ajuda-overlay');
    if (existing) existing.remove();

    const content = this._currentSection
      ? this._renderContent(this._currentModule, this._currentSection)
      : this._renderContent(this._currentModule);

    const overlay = document.createElement('div');
    overlay.id = 'ajuda-overlay';
    overlay.className = 'ajuda-overlay';
    overlay.innerHTML = `
      <div class="ajuda-modal">
        <div class="ajuda-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <i class="ph ph-question" style="font-size:20px;color:var(--color-accent);"></i>
            <h3 style="margin:0;font-size:16px;font-weight:700;">Ajuda - GeraPro</h3>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="position:relative;">
              <input type="text" id="ajuda-search-input" class="ajuda-search-input" placeholder="Buscar na ajuda..."
                autocomplete="off">
            </div>
            <button type="button" class="btn btn-ghost" onclick="app.ajuda.close()" style="padding:4px;">
              <i class="ph ph-x" style="font-size:20px;"></i>
            </button>
          </div>
        </div>
        <div class="ajuda-layout">
          <div class="ajuda-sidebar" id="ajuda-sidebar">
            ${this._renderSidebar(this._currentModule)}
          </div>
          <div class="ajuda-content" id="ajuda-content">
            ${content}
          </div>
        </div>
        <div class="ajuda-footer">
          <span><i class="ph ph-keyboard"></i> Pressione <kbd>F1</kbd> a qualquer momento para abrir a ajuda</span>
          <button type="button" class="btn btn-ghost" onclick="app.ajuda.close()">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const searchInput = document.getElementById('ajuda-search-input');
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100);
      searchInput.addEventListener('input', (e) => {
        this._search(e.target.value);
      });
    }

    setTimeout(() => {
      const activeItem = overlay.querySelector('.ajuda-item.active');
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
    }, 50);
  },

  _renderSidebar(activeModule) {
    let html = '';
    html += '<div class="ajuda-categoria">Geral</div>';
    html += this._sidebarItem('_geral', 'Sobre o GeraPro', 'ph-info', activeModule === '_geral');

    (window.AJUDA_CATEGORIAS || []).forEach(cat => {
      html += `<div class="ajuda-categoria">${cat.label}</div>`;
      cat.modules.forEach(key => {
        const mod = window.AJUDA_CONTEUDO[key];
        if (mod) {
          html += this._sidebarItem(key, mod.titulo, mod.icone || 'ph-file', activeModule === key);
        }
      });
    });

    return html;
  },

  _sidebarItem(key, label, icon, isActive) {
    const activeClass = isActive ? ' active' : '';
    return `<div class="ajuda-item${activeClass}" data-module="${key}" onclick="app.ajuda._selectModule('${key}')">
      <i class="ph ${icon}" style="font-size:16px;"></i>
      <span>${this._escapeHtml(label)}</span>
    </div>`;
  },

  _selectModule(moduleKey) {
    this._searchQuery = '';
    this._searchResults = null;
    const mod = window.AJUDA_CONTEUDO[moduleKey];
    if (!mod) return;
    this._currentModule = moduleKey;
    this._currentSection = null;

    const sidebar = document.getElementById('ajuda-sidebar');
    const content = document.getElementById('ajuda-content');
    if (sidebar) sidebar.innerHTML = this._renderSidebar(moduleKey);
    if (content) content.innerHTML = this._renderContent(moduleKey);

    const searchInput = document.getElementById('ajuda-search-input');
    if (searchInput) searchInput.value = '';

    setTimeout(() => {
      const activeItem = sidebar?.querySelector('.ajuda-item.active');
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
    }, 50);
  },

  _selectSection(sectionId) {
    this._currentSection = sectionId;
    const content = document.getElementById('ajuda-content');
    if (!content) return;
    content.innerHTML = this._renderContent(this._currentModule, sectionId);
  },

  _renderContent(moduleKey, sectionId) {
    const mod = window.AJUDA_CONTEUDO[moduleKey];
    if (!mod) return '<div class="ajuda-empty">Conteúdo não encontrado.</div>';

    if (mod.secoes && mod.secoes.length > 0) {
      if (sectionId) {
        const sec = mod.secoes.find(s => s.id === sectionId);
        if (sec) return this._renderSection(mod, sec);
        return this._renderSection(mod, mod.secoes[0]);
      }
      return mod.secoes.map(s => this._renderSection(mod, s)).join('<hr style="margin:32px 0;border:none;border-top:1px solid var(--color-border);">');
    }

    return `<div class="ajuda-empty">Nenhuma seção disponível para este módulo.</div>`;
  },

  _renderSection(mod, sec) {
    let html = '';

    html += `<h2 class="ajuda-section-title">${this._escapeHtml(mod.titulo)}</h2>`;

    if (mod.descricao) {
      html += `<p class="ajuda-section-desc">${this._escapeHtml(mod.descricao)}</p>`;
    }

    html += `<h3 class="ajuda-subsection-title">${this._escapeHtml(sec.titulo)}</h3>`;

    if (sec.texto) {
      const paragraphs = sec.texto.split('\n\n');
      paragraphs.forEach(p => {
        const trimmed = p.trim();
        if (!trimmed) return;
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          html += '<ul class="ajuda-list">';
          trimmed.split('\n').forEach(line => {
            const clean = line.replace(/^[-•]\s*/, '');
            if (clean.trim()) html += `<li>${this._renderInline(clean.trim())}</li>`;
          });
          html += '</ul>';
        } else {
          html += `<p class="ajuda-paragraph">${this._renderInline(trimmed)}</p>`;
        }
      });
    }

    if (sec.passos && sec.passos.length > 0) {
      html += '<h4 class="ajuda-subsubtitle">Como fazer:</h4>';
      html += '<ol class="ajuda-list ajuda-list--numbered">';
      sec.passos.forEach(p => {
        html += `<li>${this._renderInline(p)}</li>`;
      });
      html += '</ol>';
    }

    if (sec.campos && sec.campos.length > 0) {
      html += '<h4 class="ajuda-subsubtitle">Campos do formulário:</h4>';
      sec.campos.forEach(c => {
        html += `<div class="ajuda-campo">
          <div class="ajuda-campo-nome">${this._escapeHtml(c.nome)}</div>
          <div class="ajuda-campo-desc">${this._escapeHtml(c.descricao)}</div>
        </div>`;
      });
    }

    if (sec.screenshot) {
      const screenDesc = `${mod.titulo} — ${sec.titulo}`;
      html += `<div class="ajuda-screenshot-wrapper">
        <img src="${this._escapeHtml(sec.screenshot)}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
             alt="${screenDesc}"
             loading="lazy">
        <div class="ajuda-screenshot-fallback" style="display:none;">
          <i class="ph ph-camera" style="font-size:32px;color:#94a3b8;"></i>
          <p style="font-weight:600;color:#475569;margin:4px 0;">Screenshot indisponível</p>
          <p style="font-size:11px;color:#94a3b8;margin:0;">Capture a tela de <strong>${this._escapeHtml(mod.titulo)} — ${this._escapeHtml(sec.titulo)}</strong> e salve como:</p>
          <code style="font-size:11px;background:#f1f5f9;padding:2px 8px;border-radius:4px;margin-top:4px;">${this._escapeHtml(sec.screenshot)}</code>
        </div>
      </div>`;
    }

    if (this._searchQuery && this._searchQuery.length >= 2) {
      html = this._highlightInHtml(html, this._searchQuery);
    }

    return html;
  },

  _renderInline(text) {
    let result = this._escapeHtml(text);
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/`(.+?)`/g, '<code>$1</code>');
    result = result.replace(/\n/g, '<br>');
    return result;
  },

  _escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  _search(query) {
    this._searchQuery = query.trim();

    const sidebar = document.getElementById('ajuda-sidebar');
    const content = document.getElementById('ajuda-content');
    if (!sidebar) return;

    if (query.length < 2) {
      this._searchResults = null;
      if (sidebar) sidebar.innerHTML = this._renderSidebar(this._currentModule);
      if (content) content.innerHTML = this._renderContent(this._currentModule, this._currentSection);
      return;
    }

    const q = query.toLowerCase();

    const results = {};
    const allModules = [
      { key: '_geral', mod: window.AJUDA_CONTEUDO._geral },
      ...(window.AJUDA_CATEGORIAS || []).flatMap(cat =>
        cat.modules.map(key => ({ key, mod: window.AJUDA_CONTEUDO[key] }))
      )
    ];

    allModules.forEach(({ key, mod }) => {
      if (!mod) return;
      const matchTitle = mod.titulo?.toLowerCase().includes(q);
      const matchDesc = mod.descricao?.toLowerCase().includes(q);

      const matchedSections = (mod.secoes || []).map(sec => {
        const secTitle = sec.titulo?.toLowerCase().includes(q);
        const secText = sec.texto?.toLowerCase().includes(q);
        const secPassos = (sec.passos || []).some(p => p.toLowerCase().includes(q));
        const secCampos = (sec.campos || []).some(c =>
          c.nome?.toLowerCase().includes(q) || c.descricao?.toLowerCase().includes(q)
        );
        const match = secTitle || secText || secPassos || secCampos;
        return { sec, match };
      });

      const anySectionMatch = matchedSections.some(s => s.match);

      if (matchTitle || matchDesc || anySectionMatch) {
        results[key] = {
          mod,
          matchedSections: matchedSections.filter(s => s.match).map(s => s.sec)
        };
      }
    });

    this._searchResults = results;

    let sidebarHtml = '';
    if (results._geral) {
      sidebarHtml += '<div class="ajuda-categoria">Geral</div>';
      sidebarHtml += this._sidebarItem('_geral', 'Sobre o GeraPro', 'ph-info', false);
    }

    (window.AJUDA_CATEGORIAS || []).forEach(cat => {
      const catModules = cat.modules.filter(k => results[k]);
      if (catModules.length === 0) return;
      sidebarHtml += `<div class="ajuda-categoria">${cat.label}</div>`;
      catModules.forEach(key => {
        const mod = results[key].mod;
        sidebarHtml += this._sidebarItem(key, mod.titulo, mod.icone || 'ph-file', false);
      });
    });

    sidebar.innerHTML = sidebarHtml || '<div class="ajuda-empty" style="padding:20px;text-align:center;color:var(--color-text-muted);">Nenhum resultado encontrado.</div>';

    const keys = Object.keys(results);
    if (keys.length > 0) {
      const firstKey = keys[0];
      this._currentModule = firstKey;
      const secs = results[firstKey].matchedSections;
      if (secs.length > 0) {
        this._currentSection = secs[0].id;
        content.innerHTML = this._renderContent(firstKey, secs[0].id);
      } else {
        this._currentSection = null;
        content.innerHTML = this._renderContent(firstKey);
      }
      const activeItem = sidebar.querySelector(`.ajuda-item[data-module="${firstKey}"]`);
      if (activeItem) activeItem.classList.add('active');
    }
  },

  _highlightInHtml(html, query) {
    if (!query || query.length < 2) return html;
    const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${q})`, 'gi');
    return html.replace(/<mark class="ajuda-highlight">.*?<\/mark>/gi, match => match)
      .replace(/(>)([^<]+)(<)/g, (match, open, text, close) => {
        const replaced = text.replace(regex, '<mark class="ajuda-highlight">$1</mark>');
        return open + replaced + close;
      });
  }

};

window.ajudaModule = AjudaModule;
AjudaModule.init();
