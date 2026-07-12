const AjudaModule = {
  _currentModule: null,
  _currentSection: null,
  _searchQuery: '',
  _searchResults: null,
  _searchCache: {},
  _sidebarOpen: false,

  init() {
    window.app.ajuda = this;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.open(this._getCurrentModule(), this._getCurrentSectionId());
      }
      const overlay = document.getElementById('ajuda-overlay');
      if (!overlay) return;
      if (e.key === 'Escape') {
        this.close();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const sidebar = document.getElementById('ajuda-sidebar');
        if (!sidebar) return;
        const items = sidebar.querySelectorAll('.ajuda-item, .ajuda-sidebar-section');
        const current = sidebar.querySelector('.active');
        let idx = -1;
        if (current) {
          items.forEach((el, i) => { if (el === current) idx = i; });
        }
        let next;
        if (e.key === 'ArrowDown') {
          next = items[Math.min(idx + 1, items.length - 1)];
        } else {
          next = items[Math.max(idx - 1, 0)];
        }
        if (next) {
          e.preventDefault();
          next.click();
          next.scrollIntoView({ block: 'nearest' });
        }
      }
    });

    const originalNav = app.navigateTo;
    if (typeof originalNav === 'function') {
      app.navigateTo = function (viewName) {
        originalNav.call(app, viewName);
        window.app.ajuda?._currentView(viewName);
      };
    }

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.help-trigger');
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        const help = trigger.dataset.help || '';
        const parts = help.split('/');
        this.open(parts[0], parts[1] || null);
      }
    });
  },

  _getCurrentSectionId() {
    return this._currentSection;
  },

  _getCurrentModule() {
    const active = document.querySelector('.nav-item.active');
    return active ? active.dataset.target : null;
  },

  _currentView(viewName) {
    this._currentModule = viewName;
  },

  _fuzzyMatch(text, query) {
    if (!text || !query) return false;
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    if (t.includes(q)) return true;
    if (q.length < 3) return false;
    const m = t.length;
    const n = q.length;
    const maxDist = 2;
    if (Math.abs(m - n) > maxDist) return false;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = t[i - 1] === q[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n] <= maxDist;
  },

  _getSearchPreview(text, query) {
    if (!text || !query) return '';
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return '';
    const start = Math.max(0, idx - 30);
    const end = Math.min(text.length, idx + q.length + 50);
    let preview = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'gi');
    preview = preview.replace(re, '<em>$1</em>');
    return preview;
  },

  open(moduleKey, sectionId) {
    this._searchQuery = '';
    this._searchResults = null;
    this._searchCache = {};
    if (moduleKey && window.AJUDA_CONTEUDO[moduleKey]) {
      this._currentModule = moduleKey;
    } else {
      this._currentModule = moduleKey || '_geral';
    }
    this._currentSection = sectionId || null;
    this._render();
  },

  close() {
    const overlay = document.getElementById('ajuda-overlay');
    if (overlay) overlay.remove();
  },

  _transitionContent(newHtml) {
    const content = document.getElementById('ajuda-content');
    if (!content) return;
    content.classList.add('fade-out');
    setTimeout(() => {
      content.innerHTML = newHtml;
      content.classList.remove('fade-out');
      content.classList.add('fade-in');
      setTimeout(() => content.classList.remove('fade-in'), 150);
    }, 100);
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
            <h3 style="margin:0;font-size:16px;font-weight:700;cursor:pointer;" onclick="app.ajuda._goToIndex()">Ajuda - GeraPro</h3>
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
          <div class="ajuda-sidebar-backdrop" id="ajuda-sidebar-backdrop"
               onclick="app.ajuda._toggleSidebar()"></div>
          <button type="button" class="ajuda-sidebar-toggle" id="ajuda-sidebar-toggle"
                  style="display:none;" onclick="app.ajuda._toggleSidebar()">
            <i class="ph ph-list"></i>
          </button>
          <div class="ajuda-sidebar" id="ajuda-sidebar">
            ${this._renderSidebar(this._currentModule)}
          </div>
          <div class="ajuda-content" id="ajuda-content">
            ${content}
          </div>
        </div>
        <button type="button" class="ajuda-back-to-top" id="ajuda-back-to-top"
                onclick="document.getElementById('ajuda-content')?.scrollTo({top:0,behavior:'smooth'})">
          <i class="ph ph-arrow-up" style="font-size:16px;"></i>
        </button>
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

    const contentEl = document.getElementById('ajuda-content');
    if (contentEl) {
      contentEl.addEventListener('scroll', () => {
        const btn = document.getElementById('ajuda-back-to-top');
        if (btn) {
          btn.classList.toggle('visible', contentEl.scrollTop > 400);
        }
      });
    }

    setTimeout(() => {
      const activeItem = overlay.querySelector('.ajuda-item.active, .ajuda-sidebar-section.active');
      if (activeItem) activeItem.scrollIntoView({ block: 'nearest' });
      if (this._currentSection) {
        const anchor = document.getElementById(`sec-${this._currentSection}`);
        if (anchor) anchor.scrollIntoView({ block: 'start' });
      }
    }, 50);
  },

  _goToIndex() {
    this._currentSection = null;
    this._searchQuery = '';
    this._searchResults = null;
    const sidebar = document.getElementById('ajuda-sidebar');
    const content = document.getElementById('ajuda-content');
    if (sidebar) sidebar.innerHTML = this._renderSidebar(this._currentModule);
    if (content) content.innerHTML = this._renderContent(this._currentModule);
    const searchInput = document.getElementById('ajuda-search-input');
    if (searchInput) searchInput.value = '';
  },

  _toggleSidebar() {
    this._sidebarOpen = !this._sidebarOpen;
    const sidebar = document.getElementById('ajuda-sidebar');
    const backdrop = document.getElementById('ajuda-sidebar-backdrop');
    if (sidebar) sidebar.classList.toggle('open', this._sidebarOpen);
    if (backdrop) backdrop.classList.toggle('visible', this._sidebarOpen);
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

  _sidebarSectionItem(moduleKey, section, isActive) {
    const activeClass = isActive ? ' active' : '';
    return `<div class="ajuda-sidebar-section${activeClass}" data-module="${moduleKey}" data-section="${section.id}"
                onclick="app.ajuda._selectSectionFromSidebar('${moduleKey}','${section.id}')">
      <i class="ph ph-dot" style="font-size:12px;"></i>
      <span>${this._escapeHtml(section.titulo)}</span>
    </div>`;
  },

  _selectSectionFromSidebar(moduleKey, sectionId) {
    const mod = window.AJUDA_CONTEUDO[moduleKey];
    if (!mod) return;
    if (this._searchResults) {
      this._currentModule = moduleKey;
      this._currentSection = sectionId;
      const sidebar = document.getElementById('ajuda-sidebar');
      const content = document.getElementById('ajuda-content');
      if (sidebar) sidebar.innerHTML = this._renderSearchSidebar(this._searchQuery, this._searchResults, moduleKey, sectionId);
      if (content) content.innerHTML = this._renderContent(moduleKey, sectionId);
      return;
    }
    this._selectModule(moduleKey);
    this._currentSection = sectionId;
    const content = document.getElementById('ajuda-content');
    if (content) content.innerHTML = this._renderContent(moduleKey, sectionId);
    const sidebar = document.getElementById('ajuda-sidebar');
    if (sidebar) sidebar.innerHTML = this._renderSidebar(moduleKey);
    setTimeout(() => {
      const anchor = document.getElementById(`sec-${sectionId}`);
      if (anchor) anchor.scrollIntoView({ block: 'start' });
    }, 50);
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
    if (content) this._transitionContent(this._renderContent(moduleKey));

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
      return mod.secoes.map((s, i) => {
        return this._renderSection(mod, s, i, mod.secoes.length);
      }).join('<hr style="margin:32px 0;border:none;border-top:1px solid var(--color-border);">');
    }

    return `<div class="ajuda-empty">Nenhuma seção disponível para este módulo.</div>`;
  },

  _renderSection(mod, sec, idx, total) {
    let html = '';

    html += `<h2 class="ajuda-section-title">${this._escapeHtml(mod.titulo)}</h2>`;

    if (mod.descricao) {
      html += `<p class="ajuda-section-desc">${this._escapeHtml(mod.descricao)}</p>`;
    }

    if (typeof idx === 'number' && total > 1) {
      html += `<div class="ajuda-progress">Seção ${idx + 1} de ${total}</div>`;
    }

    html += `<h3 class="ajuda-subsection-title ajuda-section-anchor" id="sec-${sec.id}">${this._escapeHtml(sec.titulo)}</h3>`;

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
    const trimmed = query.trim();
    this._searchQuery = trimmed;

    const sidebar = document.getElementById('ajuda-sidebar');
    const content = document.getElementById('ajuda-content');
    if (!sidebar) return;

    if (trimmed.length < 2) {
      this._searchResults = null;
      this._searchCache = {};
      if (sidebar) sidebar.innerHTML = this._renderSidebar(this._currentModule);
      if (content) content.innerHTML = this._renderContent(this._currentModule, this._currentSection);
      return;
    }

    if (this._searchCache[trimmed]) {
      const cached = this._searchCache[trimmed];
      this._searchResults = cached.results;
      this._renderSearchResults(sidebar, content, trimmed, cached.results);
      return;
    }

    const searchInput = document.getElementById('ajuda-search-input');
    const parent = searchInput?.parentNode;
    let spinner;
    if (parent) {
      spinner = document.createElement('div');
      spinner.className = 'ajuda-search-loading';
      parent.appendChild(spinner);
    }

    setTimeout(() => {
      const results = this._doSearch(trimmed);
      this._searchCache[trimmed] = { results };
      this._searchResults = results;
      this._renderSearchResults(sidebar, content, trimmed, results);
      if (spinner) spinner.remove();
    }, 50);
  },

  _doSearch(query) {
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
      const matchTitle = this._fuzzyMatch(mod.titulo, q);
      const matchDesc = this._fuzzyMatch(mod.descricao, q);

      const matchedSections = (mod.secoes || []).map(sec => {
        const secTitle = this._fuzzyMatch(sec.titulo, q);
        const secText = this._fuzzyMatch(sec.texto, q);
        const secPassos = (sec.passos || []).some(p => this._fuzzyMatch(p, q));
        const secCampos = (sec.campos || []).some(c =>
          this._fuzzyMatch(c.nome, q) || this._fuzzyMatch(c.descricao, q)
        );
        const match = secTitle || secText || secPassos || secCampos;
        return { sec, match, preview: secText && sec.texto ? this._getSearchPreview(sec.texto, q) : '' };
      });

      const anySectionMatch = matchedSections.some(s => s.match);

      if (matchTitle || matchDesc || anySectionMatch) {
        results[key] = {
          mod,
          matchedSections: matchedSections.filter(s => s.match).map(s => ({ sec: s.sec, preview: s.preview })),
          titleMatch: matchTitle
        };
      }
    });

    return results;
  },

  _renderSearchResults(sidebar, content, query, results) {
    let sidebarHtml = '';

    const sortedKeys = Object.keys(results).sort((a, b) => {
      const aTitle = results[a].titleMatch ? 0 : 1;
      const bTitle = results[b].titleMatch ? 0 : 1;
      return aTitle - bTitle;
    });

    if (results._geral) {
      sidebarHtml += '<div class="ajuda-categoria">Geral</div>';
      sidebarHtml += this._sidebarItem('_geral', 'Sobre o GeraPro', 'ph-info', false);
      const secs = results._geral.matchedSections;
      secs.forEach(({ sec }) => {
        sidebarHtml += this._sidebarSectionItem('_geral', sec, false);
      });
    }

    (window.AJUDA_CATEGORIAS || []).forEach(cat => {
      const catModules = sortedKeys.filter(k => results[k] && k !== '_geral' && cat.modules.includes(k));
      if (catModules.length === 0) return;
      sidebarHtml += `<div class="ajuda-categoria">${cat.label}</div>`;
      catModules.forEach(key => {
        const r = results[key];
        sidebarHtml += this._sidebarItem(key, r.mod.titulo, r.mod.icone || 'ph-file', false);
        r.matchedSections.forEach(({ sec, preview }) => {
          sidebarHtml += this._sidebarSectionItem(key, sec, false);
          if (preview) {
            sidebarHtml += `<div class="ajuda-search-preview">${preview}</div>`;
          }
        });
      });
    });

    sidebar.innerHTML = sidebarHtml || '<div class="ajuda-empty" style="padding:20px;text-align:center;color:var(--color-text-muted);">Nenhum resultado encontrado.</div>';

    const keys = Object.keys(results);
    if (keys.length > 0) {
      const firstKey = keys[0];
      this._currentModule = firstKey;
      const secs = results[firstKey].matchedSections;
      if (secs.length > 0) {
        this._currentSection = secs[0].sec.id;
        this._transitionContent(this._renderContent(firstKey, secs[0].sec.id));
      } else {
        this._currentSection = null;
        this._transitionContent(this._renderContent(firstKey));
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
