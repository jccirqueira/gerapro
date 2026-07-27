import { store } from './state.js';
import { generateNetworkArchitecture } from './arquiteturaRede.js';
import { generateTopologySVG, exportSVGDownload } from './topologyRenderer.js';
import { generateTopologyDXF, exportDXFDownload } from './topologyDxfExport.js';

const ArquiteturaRedeUI = {
  _currentResult: null,

  init() {
    window.app.automacaoRede = {
      gerar: this.gerar.bind(this),
      copyMemorial: this.copyMemorial.bind(this),
      exportJson: this.exportJson.bind(this),
      exportBomCsv: this.exportBomCsv.bind(this),
      exportMemorialPDF: this.exportMemorialPDF.bind(this),
      exportTopologySVG: this.exportTopologySVG.bind(this),
      exportTopologyDXF: this.exportTopologyDXF.bind(this),
      resetView: this.resetView.bind(this),
      _onProtocolChange: this._onProtocolChange.bind(this)
    };
    this._viewMode = 'initial';
  },

  resetView() {
    this._viewMode = 'initial';
    this._currentResult = null;
  },

  render() {
    const container = document.getElementById('view-automacao-rede');
    if (!container) return;

    const activeProposal = store.getState().activeTechnicalProposal;

    if (this._viewMode === 'result' && this._currentResult) {
      this._renderResult(container, this._currentResult);
      return;
    }

    this._renderInitial(container, activeProposal);
  },

  _getControllersFromProposal(proposal) {
    if (!proposal || !proposal.equipments) return [];
    return proposal.equipments.filter(eq => eq.type === 'PLC' || eq.type === 'REM');
  },

  _renderInitial(container, proposal) {
    const controllers = this._getControllersFromProposal(proposal);
    const hasControllers = controllers.length > 0;

    container.innerHTML = `
      <div style="height: 100%; display: flex; flex-direction: column; background: rgb(250, 250, 250); border-radius: 8px; overflow: hidden;">
        <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; border-radius: 8px 8px 0 0;">
          <div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
              <i class="ph ph-network"></i> Arquitetura de Rede Industrial
            </h2>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Geração automática de topologia, BOM e memorial descritivo</div>
          </div>
          <div style="display: flex; gap: 10px;">
            ${hasControllers ? `<button class="btn btn-sm btn-ghost" onclick="app.automacaoRede.gerar()" style="color: white; border: 1px solid rgba(255,255,255,0.3);"><i class="ph ph-gear"></i> Gerar Arquitetura</button>` : ''}
          </div>
        </div>
        <div style="padding: 24px; overflow-y: auto; flex: 1;">
          ${hasControllers ? this._renderConfigForm(controllers) : this._renderNoControllers()}
        </div>
      </div>
    `;
  },

  _renderNoControllers() {
    return `
      <div class="card" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; color: #94a3b8; margin-bottom: 16px;">
          <i class="ph ph-network-slash"></i>
        </div>
        <h3 style="color: #475569; margin-bottom: 8px;">Nenhum Controlador Encontrado</h3>
        <p style="color: #94a3b8; max-width: 500px; margin: 0 auto;">
          Para gerar a arquitetura de rede, adicione equipamentos do tipo <strong>PLC</strong> ou <strong>REM</strong>
          à Proposta Técnica ativa, configure a Lista de I/O de cada um, e então retorne a este módulo.
        </p>
        <button class="btn btn-primary" style="margin-top: 20px;" onclick="app.navigateTo('proposta-tecnica')">
          <i class="ph ph-arrow-right"></i> Ir para Proposta Técnica
        </button>
      </div>
    `;
  },

  _onProtocolChange() {
    const proto = document.getElementById('rp-industrial-protocol')?.value;
    const container = document.getElementById('profinet-advanced-opts');
    if (container) {
      container.style.display = proto === 'PROFINET' ? 'grid' : 'none';
    }
  },

  _renderConfigForm(controllers) {
    const ctrlList = controllers.map(c =>
      `<span style="display:inline-block;background:#ede9fe;color:#5b21b6;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;margin-right:4px;">${c.tag} (${c.type})</span>`
    ).join('');

    const totalIO = controllers.reduce((acc, c) => {
      const io = c.ioList || {};
      return acc + (parseInt(io.totalDI) || 0) + (parseInt(io.totalDO) || 0)
           + (parseInt(io.totalAI) || 0) + (parseInt(io.totalAO) || 0);
    }, 0);

    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="card" style="padding: 20px;">
          <h4 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #334155;">
            <i class="ph ph-info" style="margin-right: 6px;"></i> Controladores Detectados
          </h4>
          <div style="margin-bottom: 12px;">${ctrlList}</div>
          <div style="font-size: 13px; color: #64748b;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
              <span>Total de Controladores:</span>
              <strong>${controllers.length}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
              <span>Total de Pontos I/O:</span>
              <strong>${totalIO}</strong>
            </div>
          </div>
        </div>

        <div class="card" style="padding: 20px;">
          <h4 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #334155;">
            <i class="ph ph-sliders" style="margin-right: 6px;"></i> Parâmetros da Rede
          </h4>
          <form id="form-rede-params">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label">Protocolo Industrial Ethernet</label>
                <select id="rp-industrial-protocol" class="form-control" onchange="app.automacaoRede._onProtocolChange()">
                  <option value="PROFINET">PROFINET</option>
                  <option value="EtherNet/IP">EtherNet/IP</option>
                  <option value="Modbus TCP">Modbus TCP</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Protocolo Industrial Ethernet</label>
                <select id="rp-industrial-protocol" class="form-control" onchange="app.automacaoRede._onProtocolChange()">
                  <option value="PROFINET">PROFINET</option>
                  <option value="EtherNet/IP">EtherNet/IP</option>
                  <option value="Modbus TCP">Modbus TCP</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Protocolo de Campo</label>
                <select id="rp-fieldbus-protocol" class="form-control">
                  <option value="Profibus DP">Profibus DP</option>
                  <option value="Modbus RTU">Modbus RTU</option>
                  <option value="IO-Link">IO-Link</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Topologia da Rede</label>
                <select id="rp-topology" class="form-control">
                  <option value="ring">Anel (com redundância MRP)</option>
                  <option value="star">Estrela</option>
                  <option value="line">Linha / Daisy-Chain</option>
                  <option value="tree">Árvore</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Distância Estimada (m)</label>
                <input type="number" id="rp-cable-length" class="form-control" value="500" min="10" step="10">
              </div>
              <div class="form-group">
                <label class="form-label">Categoria do Cabo</label>
                <select id="rp-cable-category" class="form-control">
                  <option value="CAT5e">CAT5e (U/UTP, 100 MHz)</option>
                  <option value="CAT6" selected>CAT6 (SF/UTP, 250 MHz)</option>
                  <option value="CAT6a">CAT6a (F/UTP, 500 MHz)</option>
                  <option value="CAT7">CAT7 (S/FTP, 600 MHz)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">IP Base (endereçamento)</label>
                <input type="text" id="rp-base-ip" class="form-control" value="10.0.0.0">
              </div>
              <div class="form-group">
                <label class="form-label">Prefixo IP</label>
                <select id="rp-prefix-ip" class="form-control">
                  <option value="24" selected>/24 (254 hosts)</option>
                  <option value="23">/23 (510 hosts)</option>
                  <option value="22">/22 (1022 hosts)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Qtd VLANs</label>
                <input type="number" id="rp-qtd-vlans" class="form-control" value="3" min="1" max="10">
              </div>
            </div>

            <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
              <h5 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #334155;">
                <i class="ph ph-gear" style="margin-right: 6px;"></i> Opções Avançadas PROFINET
                <span style="font-weight: 400; font-size: 11px; color: #94a3b8;"> (visível apenas com PROFINET)</span>
              </h5>
              <div id="profinet-advanced-opts" style="display: none; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label" title="Define o conjunto de funcionalidades do dispositivo PROFINET. CC-A: básico, CC-B: com diagnóstico SNMP, CC-C: IRT para motion control, CC-D: TSN Gigabit.">
                    Classe de Conformidade <i class="ph ph-question" style="font-size: 11px; color: #94a3b8;"></i>
                  </label>
                  <select id="rp-cc" class="form-control">
                    <option value="">—— Selecione ——</option>
                    <option value="CC-A">CC-A — Básico (switch não-gerenciável, RT)</option>
                    <option value="CC-B">CC-B — Diagnóstico (switch gerenciável, SNMP)</option>
                    <option value="CC-C">CC-C — IRT (ASIC dedicado, motion control)</option>
                    <option value="CC-D">CC-D — TSN (Gigabit, convergência TI/TA)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" title="RT: tempo real padrão 1-10ms. IRT: isócrono com jitter &lt;1μs, requer CC-C.">
                    Tempo Real <i class="ph ph-question" style="font-size: 11px; color: #94a3b8;"></i>
                  </label>
                  <select id="rp-rt" class="form-control">
                    <option value="">—— Selecione ——</option>
                    <option value="RT">RT — Real-Time (1-10ms, ciclo 250μs)</option>
                    <option value="IRT">IRT — Isochronous RT (jitter &lt;1μs, ciclo 31,25μs)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" title="MRP: recuperação &lt;200ms em anel. MRPD: duplicação de frames, 0ms de perda.">
                    Redundância <i class="ph ph-question" style="font-size: 11px; color: #94a3b8;"></i>
                  </label>
                  <select id="rp-redundancy" class="form-control">
                    <option value="">—— Selecione ——</option>
                    <option value="MRP">MRP — Recuperação &lt;200ms</option>
                    <option value="MRPD">MRPD — Zero-loss (0ms, duplicação de frames)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" title="Tipo de cabo industrial PROFINET (A: fixo, B: flexível, C: altamente flexível, R: robótica).">
                    Tipo de Cabo Industrial <i class="ph ph-question" style="font-size: 11px; color: #94a3b8;"></i>
                  </label>
                  <select id="rp-cable-type" class="form-control">
                    <option value="">—— Selecione ——</option>
                    <option value="A">Tipo A — Instalação Fixa (condutor sólido)</option>
                    <option value="B">Tipo B — Flexível (vibrações moderadas)</option>
                    <option value="C">Tipo C — Altamente Flexível (esteiras)</option>
                    <option value="R">Tipo R — Robótica (torção extrema)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" title="Conector para dispositivos de campo. M12 para ambiente IP65/67, RJ45 para painel.">
                    Conector de Campo <i class="ph ph-question" style="font-size: 11px; color: #94a3b8;"></i>
                  </label>
                  <select id="rp-connector" class="form-control">
                    <option value="">—— Selecione ——</option>
                    <option value="RJ45_IP20">RJ45 Industrial IP20 (painel)</option>
                    <option value="M12_D">M12 D-Coded IP65/67 (campo, 100Mbps)</option>
                    <option value="M12_X">M12 X-Coded IP65/67 (campo, Gigabit)</option>
                    <option value="SCRJ">SCRJ Fibra Óptica POF IP65/67</option>
                  </select>
                </div>
                <div style="display: flex; align-items: flex-end; padding-bottom: 6px;">
                  <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;" title="Inclui SIMOCODE pro V PN, SIRIUS 3RW55, SINAMICS G120/S120, ET 200SP como dispositivos de campo no barramento.">
                    <input type="checkbox" id="rp-siemens-devices"> Dispositivos Siemens
                    <i class="ph ph-question" style="font-size: 11px; color: #94a3b8;"></i>
                  </label>
                  <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; margin-left: 16px;" title="Perfil PROFIsafe para segurança funcional (SIL 3) sobre o mesmo cabo PROFINET.">
                    <input type="checkbox" id="rp-profisafe"> PROFIsafe (Segurança)
                    <i class="ph ph-question" style="font-size: 11px; color: #94a3b8;"></i>
                  </label>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                <input type="checkbox" id="rp-scada"> Integração com SCADA (OPC UA)
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                <input type="checkbox" id="rp-iiot"> Integração IIoT (MQTT)
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                <input type="checkbox" id="rp-fiber" onchange="document.getElementById('rp-fiber-options').style.display = this.checked ? '' : 'none'"> Usar Fibra Óptica
              </label>
            </div>
            <div style="display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                <input type="checkbox" id="rp-firewall"> Firewall Industrial (DMZ)
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                <input type="checkbox" id="rp-router"> Roteador WAN (4G/5G)
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                <input type="checkbox" id="rp-access-point"> Access Point Wi-Fi (IWLAN)
              </label>
            </div>
            <div style="display: none; gap: 16px; margin-top: 8px; flex-wrap: wrap;" id="rp-fiber-options">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Tipo de Fibra Óptica</label>
                <select id="rp-fiber-type" class="form-control">
                  <option value="multimodo_OM3">Multimodo OM3 (300m, LC)</option>
                  <option value="multimodo_OM4" selected>Multimodo OM4 (550m, LC)</option>
                  <option value="monomodo_OS2">Monomodo OS2 (10km, LC/SC)</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  gerar() {
    const activeProposal = store.getState().activeTechnicalProposal;
    const controllers = this._getControllersFromProposal(activeProposal);

    if (controllers.length === 0) {
      window.app.toast('Nenhum controlador (PLC/REM) encontrado na proposta ativa.', 'error');
      return;
    }

    const getVal = (id) => document.getElementById(id)?.value;
    const getChecked = (id) => document.getElementById(id)?.checked || false;

    const isPROFINET = getVal('rp-industrial-protocol') === 'PROFINET';

    const options = {
      industrialProtocol: getVal('rp-industrial-protocol') || 'PROFINET',
      fieldbusProtocol: getVal('rp-fieldbus-protocol') || 'Profibus DP',
      topologyType: getVal('rp-topology') || 'ring',
      estimatedCableLength: parseInt(getVal('rp-cable-length')) || 500,
      hasSCADA: getChecked('rp-scada'),
      hasIIoT: getChecked('rp-iiot'),
      useFiberOptic: getChecked('rp-fiber'),
      fiberType: getVal('rp-fiber-type') || 'multimodo_OM4',
      cableCategory: getVal('rp-cable-category') || 'CAT6',
      hasFirewall: getChecked('rp-firewall'),
      hasRouter: getChecked('rp-router'),
      hasAccessPoint: getChecked('rp-access-point'),
      baseIP: getVal('rp-base-ip') || '10.0.0.0',
      prefixIP: parseInt(getVal('rp-prefix-ip')) || 24,
      qtdVlans: parseInt(getVal('rp-qtd-vlans')) || 3,
      conformanceClass: isPROFINET ? (getVal('rp-cc') || '') : '',
      profinetRealTime: isPROFINET ? (getVal('rp-rt') || '') : '',
      profinetRedundancy: isPROFINET ? (getVal('rp-redundancy') || '') : '',
      profinetCableType: isPROFINET ? (getVal('rp-cable-type') || '') : '',
      profinetConnector: isPROFINET ? (getVal('rp-connector') || '') : '',
      hasSiemensDevices: isPROFINET ? getChecked('rp-siemens-devices') : false,
      hasPROFIsafe: isPROFINET ? getChecked('rp-profisafe') : false
    };

    try {
      const result = generateNetworkArchitecture(controllers, options);
      this._currentResult = result;
      this._viewMode = 'result';
      store.setState({ activeNetworkArchitecture: result });
      this.render();
      window.app.toast('Arquitetura de rede gerada com sucesso!', 'success');
    } catch (err) {
      window.app.toast(err.message || 'Erro ao gerar arquitetura de rede.', 'error');
      console.error('[ArquiteturaRede] Error:', err);
    }
  },

  _renderResult(container, result) {
    const { cabecalho, topologia, bom, memorial } = result;

    const nivelCampo = topologia.find(n => n.nivel === 'Campo');
    const nivelCelula = topologia.find(n => n.nivel === 'Célula / Controle');
    const nivelGestao = topologia.find(n => n.nivel === 'Gestão / IIoT');

    let topologySVG = '';
    try {
      topologySVG = generateTopologySVG(result.topologia, result.bom);
    } catch (err) {
      console.error('[ArquiteturaRede] Erro ao gerar SVG:', err);
      topologySVG = '<div style="padding:20px;text-align:center;color:#ef4444;"><i class="ph ph-warning-circle"></i> Erro ao gerar diagrama de topologia.</div>';
    }

    try {
      container.innerHTML = `
      <div style="height: 100%; display: flex; flex-direction: column; background: rgb(250, 250, 250); border-radius: 8px; overflow: hidden;">
        <div class="module-header-sticky" style="color: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; flex-shrink: 0; border-radius: 8px 8px 0 0;">
          <div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
              <i class="ph ph-network"></i> Arquitetura de Rede Industrial
            </h2>
            <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
              ${cabecalho.protocoloIndustrial} | ${cabecalho.protocoloCampo} | Topologia: ${cabecalho.topologia === 'ring' ? 'Anel MRP' : cabecalho.topologia}
              ${topologia?.[1]?.conformanceClass ? ' | ' + topologia[1].conformanceClass : ''}
              ${topologia?.[1]?.profinetRealTime ? ' | ' + topologia[1].profinetRealTime : ''}
              | ${cabecalho.totalControladores} CLP(s) | ${cabecalho.totalIO} pontos I/O
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-ghost" onclick="app.automacaoRede.gerar()" style="color: white; border: 1px solid rgba(255,255,255,0.3);">
              <i class="ph ph-arrows-clockwise"></i> Regenerar
            </button>
            <button class="btn btn-sm btn-ghost" onclick="app.automacaoRede.exportJson()" style="color: white; border: 1px solid rgba(255,255,255,0.3);">
              <i class="ph ph-download"></i> Exportar JSON
            </button>
            <button class="btn btn-sm btn-ghost" onclick="app.automacaoRede.exportBomCsv()" style="color: white; border: 1px solid rgba(255,255,255,0.3);">
              <i class="ph ph-table"></i> BOM CSV
            </button>
            <button class="btn btn-sm btn-primary" onclick="app.automacaoRede.exportMemorialPDF()" style="background: #22c55e; border-color: #22c55e;">
              <i class="ph ph-file-pdf"></i> Exportar PDF
            </button>
            <button class="btn btn-sm btn-ghost" onclick="app.automacaoRede.copyMemorial()" style="color: white; border: 1px solid rgba(255,255,255,0.3);">
              <i class="ph ph-copy"></i> Copiar Memorial
            </button>
          </div>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;">

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="card" style="padding: 0; overflow: hidden;">
              <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                <i class="ph ph-sitemap"></i> Topologia — Nível de Campo
              </div>
              <div style="padding: 16px;">
                ${this._renderFieldbus(nivelCampo)}
              </div>
            </div>
            <div class="card" style="padding: 0; overflow: hidden;">
              <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                <i class="ph ph-cpu"></i> Topologia — Nível de Célula
              </div>
              <div style="padding: 16px;">
                ${this._renderCellLevel(nivelCelula)}
              </div>
            </div>
          </div>
          ${nivelGestao ? this._renderGestaoLevel(nivelGestao) : ''}

          <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <i class="ph ph-git-branch"></i> Diagrama de Topologia
              <div style="margin-left: auto; display: flex; gap: 6px;">
                <button class="btn btn-sm btn-ghost" onclick="app.automacaoRede.exportTopologySVG()" style="border: 1px solid #cbd5e1;">
                  <i class="ph ph-download"></i> SVG
                </button>
                <button class="btn btn-sm btn-ghost" onclick="app.automacaoRede.exportTopologyDXF()" style="border: 1px solid #cbd5e1;">
                  <i class="ph ph-download"></i> DXF
                </button>
              </div>
            </div>
            <div id="topology-diagram-container" style="padding: 16px; background: white; overflow-x: auto;">
              ${topologySVG}
            </div>
          </div>

          <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <i class="ph ph-package"></i> Lista de Materiais de Rede
              <span style="margin-left: auto; font-weight: 400; font-size: 12px; color: #64748b;">
                Custo Estimado: <strong style="color: var(--color-primary);">R$ ${(bom.custoEstimadoTotal || 0).toLocaleString()}</strong>
              </span>
            </div>
            <div style="padding: 16px;">
              ${this._renderBOM(bom)}
            </div>
          </div>

          ${bom.conformidade && bom.conformidade.length > 0 ? this._renderConformidade(bom.conformidade) : ''}

          ${bom.enderecamentoIP ? this._renderEnderecamentoIP(bom.enderecamentoIP) : ''}

          ${bom.fichasTecnicas && bom.fichasTecnicas.length > 0 ? this._renderFichasTecnicas(bom.fichasTecnicas) : ''}

          <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
              <i class="ph ph-file-text"></i> Memorial Descritivo Técnico
              <button class="btn btn-sm btn-ghost" onclick="app.automacaoRede.copyMemorial()" style="margin-left: auto;">
                <i class="ph ph-copy"></i> Copiar
              </button>
            </div>
            <div style="padding: 20px; font-size: 13px; line-height: 1.6; font-family: 'Courier New', monospace; white-space: pre-wrap; background: #fafafa; max-height: 500px; overflow-y: auto;">
              ${memorial}
            </div>
          </div>

        </div>
      </div>
    `;
    } catch (err) {
      console.error('[ArquiteturaRede] Erro ao renderizar resultado:', err);
    }
  },

  _renderFieldbus(nivelCampo) {
    if (!nivelCampo || !nivelCampo.barramentos || nivelCampo.barramentos.length === 0) {
      return '<div style="color: #94a3b8;">Nenhum barramento de campo configurado.</div>';
    }

    return nivelCampo.barramentos.map(fb => `
      <div style="margin-bottom: 16px; padding: 12px; background: #f1f5f9; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 14px;">${fb.mestre}</strong>
          <span style="font-size: 11px; background: #e2e8f0; padding: 2px 8px; border-radius: 10px;">
            ${fb.protocolo}
          </span>
        </div>
        <div style="font-size: 12px; color: #64748b; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          <span>Nós: <strong>${fb.nos}</strong> / ${fb.maximoPermitido} máx</span>
          <span>Dist. máx: ${fb.distanciaMaxima}m</span>
        </div>
        ${fb.precisaRepetidor ? `<div style="margin-top: 6px; padding: 4px 8px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 11px; font-weight: 600;">
          ⚠ Requer repetidor (limite de nós excedido)
        </div>` : ''}
        <details style="margin-top: 8px;">
          <summary style="font-size: 12px; cursor: pointer; color: #3b82f6; font-weight: 600;">Dispositivos (${fb.dispositivosCampo.length})</summary>
          <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">
            ${fb.dispositivosCampo.slice(0, 10).map(d => {
              const isSiemens = d.fabricante === 'Siemens' || d.siemensImage;
              return `<span style="background: white; border: 1px solid #e2e8f0; padding: 2px 8px; border-radius: 4px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                ${isSiemens ? '<span style="color:#009999;font-weight:700;font-size:9px;">◈</span>' : ''}
                ${d.tag}
              </span>`;
            }).join('')}
            ${fb.dispositivosCampo.length > 10 ? `<span style="font-size: 11px; color: #64748b;">...+${fb.dispositivosCampo.length - 10} mais</span>` : ''}
          </div>
          ${fb.dispositivosCampo.some(d => d.fabricante === 'Siemens' || d.siemensImage)
            ? `<div style="margin-top: 6px; font-size: 10px; color: #009999; font-weight: 600;">◈ Marcados com ◈ são dispositivos Siemens com PROFINET nativo</div>`
            : ''}
        </details>
        ${fb.precisaConversorFibra && fb.conversorFibra ? `<div style="margin-top: 6px; padding: 4px 8px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 11px;">
          Fibra: ${fb.conversorFibra.descricao} (${fb.conversorFibra.conector})
        </div>` : ''}
      </div>
    `).join('');
  },

_renderCellLevel(nivelCelula) {
    if (!nivelCelula) return '<div style="color: #94a3b8;">Nível de célula não configurado.</div>';

    const topoLabel = nivelCelula.topologia === 'ring' ? 'Anel MRP' :
      nivelCelula.topologia === 'star' ? 'Estrela' :
      nivelCelula.topologia === 'line' ? 'Linha / Daisy-Chain' :
      nivelCelula.topologia === 'tree' ? 'Árvore' :
      nivelCelula.topologia === 'mesh' ? 'Malha Parcial' : nivelCelula.topologia;

    const badges = [];
    if (nivelCelula.conformanceClass) badges.push(`<span style="background:#7c3aed;color:white;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:600;">${nivelCelula.conformanceClass}</span>`);
    if (nivelCelula.profinetRealTime) badges.push(`<span style="background:#0d9488;color:white;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:600;">${nivelCelula.profinetRealTime}</span>`);
    if (nivelCelula.profinetRedundancy) badges.push(`<span style="background:#059669;color:white;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:600;">${nivelCelula.profinetRedundancy}</span>`);
    if (nivelCelula.hasPROFIsafe) badges.push(`<span style="background:#dc2626;color:white;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:600;">PROFIsafe</span>`);
    const badgesHTML = badges.length > 0 ? `<div style="margin-bottom: 6px;">${badges.join(' ')}</div>` : '';

    return `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
          <span style="background: #dbeafe; padding: 2px 8px; border-radius: 10px; font-weight: 600;">${nivelCelula.protocolo || 'PROFINET'}</span>
          <span style="margin-left: 6px;">${nivelCelula.velocidade || '100 Mbps'}</span>
        </div>
        ${badgesHTML}
        <div style="font-size: 12px; color: #64748b;">
          Topologia: <strong>${topoLabel}</strong>
          &nbsp;|&nbsp; Meio: <strong>${nivelCelula.meioFisico || 'STP CAT6'}</strong>
        </div>
      </div>

      <div style="font-weight: 600; font-size: 13px; margin-bottom: 8px; color: #334155;">
        Controladores (${nivelCelula.controladores.length})
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 12px;">
        ${nivelCelula.controladores.map(c => `
          <div style="background: #ede9fe; padding: 8px 12px; border-radius: 6px; font-size: 12px;">
            <strong>${c.tag}</strong>
            <span style="color: #64748b;"> (${c.tipo})</span>
            <div style="color: #475569; margin-top: 2px;">
              DI:${c.io.DI} DO:${c.io.DO} AI:${c.io.AI} AO:${c.io.AO}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px; color: #334155;">
        Switches Industriais
      </div>
      ${nivelCelula.switches.map(s => {
        const nivelTag = s.nivel === 'core' ? '<span style="background:#7c3aed;color:white;padding:1px 6px;border-radius:8px;font-size:10px;">CORE</span>' :
          s.nivel === 'access' ? '<span style="background:#059669;color:white;padding:1px 6px;border-radius:8px;font-size:10px;">ACCESS</span>' : '';
        return `
        <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-bottom: 4px; display:flex;align-items:center;gap:8px;">
          <strong>${s.quantidade}x</strong>
          <span>${s.descricao}</span>
          ${nivelTag}
          ${s.margemExpansao !== undefined ? `<span style="color: #22c55e;font-size:11px;">(${s.margemExpansao} portas livres)</span>` : ''}
          ${s.protocoloRedundancia ? `<span style="color:#059669;font-size:10px;">${s.protocoloRedundancia}</span>` : ''}
        </div>`;
      }).join('')}
    `;
  },

  _renderGestaoLevel(nivelGestao) {
    if (!nivelGestao || !nivelGestao.habilitado) {
      return `
        <div class="card" style="padding: 16px; margin-top: -8px;">
          <div style="font-size:13px;color:#94a3b8;"><i class="ph ph-cloud-slash"></i> Nível de Gestão / IIoT não habilitado</div>
        </div>
      `;
    }
    const protocolos = nivelGestao.protocolos || [];
    const dispositivos = nivelGestao.dispositivos || [];
    return `
      <div class="card" style="padding: 0; overflow: hidden; margin-top: -8px;">
        <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <i class="ph ph-cloud"></i> Topologia — Nível de Gestão / IIoT
          <span style="margin-left:auto;font-weight:400;font-size:12px;color:#64748b;">${protocolos.join(' | ')}</span>
        </div>
        <div style="padding: 16px;">
          ${dispositivos.map(d => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;">
              <div style="width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;
                ${d.tipo === 'firewall' ? 'background:#dc2626;' : d.tipo === 'roteador' ? 'background:#7c3aed;' : d.tipo === 'access-point' ? 'background:#0d9488;' : d.tipo === 'gateway' ? 'background:#d97706;' : 'background:#4f46e5;'}">
                <i class="ph ${d.tipo === 'firewall' ? 'ph-shield-check' : d.tipo === 'roteador' ? 'ph-wifi-high' : d.tipo === 'access-point' ? 'ph-wifi' : 'ph-arrows-left-right'}"></i>
              </div>
              <div>
                <div style="font-weight:600;font-size:13px;color:#334155;">${d.label || d.tipo}</div>
                <div style="font-size:11px;color:#64748b;">${d.tag}${d.descricao ? ' — ' + d.descricao : ''}${d.protocolo ? ' (' + d.protocolo + ')' : ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _renderConformidade(conformidade) {
    if (!conformidade || conformidade.length === 0) return '';
    const badgeMap = {
      ok: '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">OK</span>',
      warn: '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">ALERTA</span>',
      info: '<span style="background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">INFO</span>'
    };
    return `
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <i class="ph ph-check-circle"></i> Conformidade Normativa
        </div>
        <div style="padding: 16px;">
          ${conformidade.map(c => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;">
              <div style="flex-shrink:0;">${badgeMap[c.status] || badgeMap.info}</div>
              <div>
                <div style="font-weight:600;font-size:13px;color:#334155;">${c.norma}</div>
                <div style="font-size:12px;color:#64748b;margin-top:2px;">${c.mensagem}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _renderEnderecamentoIP(enderecamentoIP) {
    if (!enderecamentoIP) return '';
    const { vlans, dispositivos } = enderecamentoIP;
    return `
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <i class="ph ph-globe"></i> Plano de Endereçamento IP
        </div>
        <div style="padding: 16px;">
          ${vlans && vlans.length > 0 ? `
          <div style="font-weight:600;font-size:12px;color:#334155;margin-bottom:8px;">VLANs</div>
          <div class="table-container" style="margin-bottom:16px;">
            <table style="width:100%;font-size:12px;border-collapse:collapse;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">Nome</th>
                  <th style="padding:6px 8px;text-align:center;border-bottom:2px solid #e2e8f0;">VLAN ID</th>
                  <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">Sub-rede</th>
                  <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">Gateway</th>
                </tr>
              </thead>
              <tbody>
                ${vlans.map(v => `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:4px 8px;font-weight:600;">${v.nome}</td>
                    <td style="padding:4px 8px;text-align:center;">${v.vlanId}</td>
                    <td style="padding:4px 8px;font-family:monospace;">${v.subnet}</td>
                    <td style="padding:4px 8px;font-family:monospace;">${v.gateway}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          ${dispositivos && dispositivos.length > 0 ? `
          <div style="font-weight:600;font-size:12px;color:#334155;margin-bottom:8px;">Dispositivos</div>
          <div class="table-container">
            <table style="width:100%;font-size:12px;border-collapse:collapse;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">Tag</th>
                  <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">Tipo</th>
                  <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">IP</th>
                  <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">VLAN</th>
                  <th style="padding:6px 8px;text-align:left;border-bottom:2px solid #e2e8f0;">Station Name</th>
                </tr>
              </thead>
              <tbody>
                ${dispositivos.map(d => `
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:4px 8px;font-weight:600;">${d.tag}</td>
                    <td style="padding:4px 8px;">${d.tipo}</td>
                    <td style="padding:4px 8px;font-family:monospace;">${d.ip}</td>
                    <td style="padding:4px 8px;">${d.vlan}</td>
                    <td style="padding:4px 8px;font-family:monospace;color:#0891b2;font-size:11px;">${d.stationName || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  _renderFichasTecnicas(fichas) {
    if (!fichas || fichas.length === 0) return '';
    return `
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <i class="ph ph-file-doc"></i> Fichas Técnicas dos Equipamentos
        </div>
        <div style="padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${fichas.map(f => `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;">
              <div style="font-weight:700;font-size:13px;color:#334155;margin-bottom:4px;">${f.equipamento}</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:8px;">Fabricante: ${f.fabricanteSugerido}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;">
${Object.entries(f.especificacoes || {}).map(([k, v]) => `
                  <div style="padding:2px 0;">
                    <span style="color:#94a3b8;">${k}:</span>
                    <span style="color:#334155;font-weight:500;"> ${v}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _renderBOM(bom) {
    const allItems = [];

    if (bom.switches) {
      for (const sw of bom.switches) {
        allItems.push({
          categoria: 'Switches',
          descricao: sw.descricao,
          qtd: sw.quantidade,
          un: 'un',
          custoUnit: sw.custoUnitarioEstimado || 0,
          custoTotal: sw.custoTotalEstimado || 0
        });
      }
    }

    if (bom.cabos) {
      for (const cabo of bom.cabos) {
        const catMap = {
          'ethernet': 'Cabos Ethernet', 'fieldbus': 'Cabos Fieldbus',
          'conector': 'Conectores', 'repetidor': 'Repetidores',
          'conversor': 'Conversores', 'terminacao': 'Terminações',
          'patch-cord': 'Patch Cords', 'fibra-optica': 'Fibra Óptica',
          'fibra-uplink': 'Fibra Óptica (Uplink)'
        };
        allItems.push({
          categoria: catMap[cabo.tipo] || 'Outros',
          descricao: cabo.descricao,
          qtd: cabo.quantidade,
          un: cabo.unidade,
          custoUnit: cabo.custoUnitarioEstimado || 0,
          custoTotal: cabo.custoTotalEstimado || 0
        });
      }
    }

    if (allItems.length === 0) {
      return '<div style="color: #94a3b8;">Nenhum material dimensionado.</div>';
    }

    return `
      <div class="table-container">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e2e8f0;">Categoria</th>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e2e8f0;">Descrição</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e2e8f0;">Qtd</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e2e8f0;">Un</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">Custo Unit.</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #e2e8f0;">Custo Total</th>
            </tr>
          </thead>
          <tbody>
            ${allItems.map(item => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 8px; font-size: 11px; color: #64748b;">${item.categoria}</td>
                <td style="padding: 6px 8px; font-weight: 500;">${item.descricao}</td>
                <td style="padding: 6px 8px; text-align: center;">${item.qtd}</td>
                <td style="padding: 6px 8px; text-align: center;">${item.un}</td>
                <td style="padding: 6px 8px; text-align: right;">R$ ${(item.custoUnit || 0).toLocaleString()}</td>
                <td style="padding: 6px 8px; text-align: right; font-weight: 600;">R$ ${(item.custoTotal || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc;">
              <td colspan="5" style="padding: 8px; text-align: right; font-weight: 700; font-size: 13px;">Total Estimado</td>
              <td style="padding: 8px; text-align: right; font-weight: 700; font-size: 13px; color: var(--color-primary);">
                R$ ${(bom.custoEstimadoTotal || 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  },

  exportTopologySVG() {
    if (!this._currentResult) {
      window.app.toast('Nenhum diagrama disponível. Gere a arquitetura primeiro.', 'warning');
      return;
    }
    const svg = generateTopologySVG(this._currentResult.topologia, this._currentResult.bom, { useImages: false });
    exportSVGDownload(svg, 'topologia_rede_industrial.svg');
    window.app.toast('Diagrama SVG exportado com sucesso!', 'success');
  },

  exportTopologyDXF() {
    if (!this._currentResult) {
      window.app.toast('Nenhum diagrama disponível. Gere a arquitetura primeiro.', 'warning');
      return;
    }
    const dxf = generateTopologyDXF(this._currentResult.topologia, this._currentResult.bom);
    exportDXFDownload(dxf, 'topologia_rede_industrial.dxf');
    window.app.toast('Diagrama DXF exportado com sucesso!', 'success');
  },

  copyMemorial() {
    if (!this._currentResult) {
      window.app.toast('Nenhum memorial disponível.', 'warning');
      return;
    }
    navigator.clipboard.writeText(this._currentResult.memorial)
      .then(() => window.app.toast('Memorial descritivo copiado para a área de transferência!', 'success'))
      .catch(() => window.app.toast('Erro ao copiar. Selecione o texto manualmente.', 'error'));
  },

  exportJson() {
    if (!this._currentResult) {
      window.app.toast('Nenhum dado para exportar.', 'warning');
      return;
    }
    const blob = new Blob([JSON.stringify(this._currentResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arquitetura_rede_industrial.json';
    a.click();
    URL.revokeObjectURL(url);
    window.app.toast('JSON exportado com sucesso!', 'success');
  },

  exportBomCsv() {
    if (!this._currentResult) {
      window.app.toast('Nenhum dado para exportar.', 'warning');
      return;
    }

    const bom = this._currentResult.bom;
    let csv = 'Categoria;Descrição;Quantidade;Unidade;Custo Unitário;Custo Total\n';

    const writeItems = (items) => {
      if (!items) return;
      for (const item of items) {
        csv += `${item.categoria || item.tipo || ''};${item.descricao};${item.quantidade};${item.unidade || 'un'};${item.custoUnitarioEstimado || 0};${item.custoTotalEstimado || 0}\n`;
      }
    };

    writeItems(bom.switches?.map(s => ({ ...s, categoria: 'Switches', unidade: 'un' })));

    const catMapCSV = {
      'ethernet': 'Cabos Ethernet', 'fieldbus': 'Cabos Fieldbus',
      'conector': 'Conectores', 'repetidor': 'Repetidores',
      'conversor': 'Conversores', 'terminacao': 'Terminações',
      'patch-cord': 'Patch Cords', 'fibra-optica': 'Fibra Óptica',
      'fibra-uplink': 'Fibra Óptica (Uplink)'
    };
    writeItems(bom.cabos?.map(c => ({ ...c, categoria: catMapCSV[c.tipo] || c.tipo })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bom_rede_industrial.csv';
    a.click();
    URL.revokeObjectURL(url);
    window.app.toast('BOM exportada em CSV!', 'success');
  },

  exportMemorialPDF() {
    if (!this._currentResult) {
      window.app.toast('Nenhum memorial dispon\u00edvel. Gere a arquitetura primeiro.', 'warning');
      return;
    }

    const result = this._currentResult;
    const empresa = store.getState().company || {};
    const nomeEmpresa = empresa.name || empresa.nome || 'GeraPro';
    const activeProposal = store.getState().activeTechnicalProposal || {};
    const proposalCode = activeProposal.codigo || 'PTC-XXXX';

    const topologySVG = generateTopologySVG(result.topologia, result.bom, { useImages: true });
    const html = this._buildMemorialHTML(result, nomeEmpresa, proposalCode, topologySVG);

    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const htmlWithBase = html.replace('<style>', `<base href="${baseUrl}"><style>`);

    const printScript = '<script>window.onload=function(){setTimeout(function(){window.print();window.close()},800)};<\/script>';
    const htmlWithScript = htmlWithBase + printScript;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.app.toast('Pop-up bloqueado. Permita pop-ups para exportar o PDF.', 'error');
      return;
    }
    printWindow.document.title = 'Memorial - Arquitetura de Rede Industrial';
    printWindow.document.write(htmlWithScript);
    printWindow.document.close();
    printWindow.focus();
  },

  _buildMemorialHTML(result, nomeEmpresa, proposalCode, topologySVG = '') {
    const { cabecalho, topologia, bom, memorial } = result;
    const nivelCampo = topologia.find(n => n.nivel === 'Campo');
    const nivelCelula = topologia.find(n => n.nivel === 'Célula / Controle');
    const nivelGestao = topologia.find(n => n.nivel === 'Gestão / IIoT');
    const conformidade = bom.conformidade || [];
    const enderecamentoIP = bom.enderecamentoIP || null;
    const fichasTecnicas = bom.fichasTecnicas || [];
    const now = new Date();

    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');

    const topoLabel = cabecalho.topologia === 'ring' ? 'Anel (MRP)' :
      cabecalho.topologia === 'star' ? 'Estrela' :
      cabecalho.topologia === 'line' ? 'Linha / Daisy-Chain' : 'Árvore';

    const bomItems = [];
    if (bom.switches) {
      for (const sw of bom.switches) {
        bomItems.push({
          cat: 'Switches',
          desc: sw.descricao,
          qtd: sw.quantidade,
          un: 'un',
          custoUnit: sw.custoUnitarioEstimado || 0,
          custoTotal: sw.custoTotalEstimado || 0
        });
      }
    }
    if (bom.cabos) {
      const catMap = {
        'ethernet': 'Cabos Ethernet', 'fieldbus': 'Cabos Fieldbus',
        'conector': 'Conectores', 'repetidor': 'Repetidores',
        'conversor': 'Conversores', 'terminacao': 'Terminações',
        'patch-cord': 'Patch Cords', 'fibra-optica': 'Fibra Óptica',
        'fibra-uplink': 'Fibra Óptica (Uplink)'
      };
      for (const cabo of bom.cabos) {
        bomItems.push({
          cat: catMap[cabo.tipo] || 'Outros',
          desc: cabo.descricao,
          qtd: cabo.quantidade,
          un: cabo.unidade,
          custoUnit: cabo.custoUnitarioEstimado || 0,
          custoTotal: cabo.custoTotalEstimado || 0
        });
      }
    }

    const bomRows = bomItems.map((item, i) => `
      <tr${i % 2 === 0 ? '' : ' style="background:#f1f5f9;"'}>
        <td style="padding:4px 8px;font-size:9px;color:#64748b;border-bottom:1px solid #e2e8f0;">${item.cat}</td>
        <td style="padding:4px 8px;font-size:9px;border-bottom:1px solid #e2e8f0;">${item.desc}</td>
        <td style="padding:4px 8px;font-size:9px;text-align:center;border-bottom:1px solid #e2e8f0;">${item.qtd}</td>
        <td style="padding:4px 8px;font-size:9px;text-align:center;border-bottom:1px solid #e2e8f0;">${item.un}</td>
        <td style="padding:4px 8px;font-size:9px;text-align:right;border-bottom:1px solid #e2e8f0;">R$ ${(item.custoUnit).toLocaleString('pt-BR')}</td>
        <td style="padding:4px 8px;font-size:9px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:600;">R$ ${(item.custoTotal).toLocaleString('pt-BR')}</td>
      </tr>
    `).join('');

    return `<style>
      @page { size: A4 portrait; margin: 15mm; @top-left { content: none; } @top-center { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-center { content: counter(page) '/' counter(pages); font-size: 9pt; color: #94a3b8; font-family: 'Segoe UI', system-ui, Arial, sans-serif; } @bottom-right { content: none; } }
      * { box-sizing: border-box; }
      body { font-family: 'Segoe UI', system-ui, Arial, sans-serif; margin: 0; padding: 0; color: #1e293b; font-size: 10pt; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { width: 180mm; margin: 0 auto; }
      .header-bar { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 20px 28px; color: white; display: flex; justify-content: space-between; align-items: center; }
      .header-bar .empresa { font-size: 16pt; font-weight: 700; letter-spacing: -0.3px; }
      .header-bar .sub { font-size: 9pt; opacity: 0.8; margin-top: 2px; }
      .header-bar .badge { background: rgba(255,255,255,0.2); padding: 4px 16px; border-radius: 20px; font-size: 10pt; font-weight: 600; }
      .title-section { text-align: center; padding: 24px 28px 12px; }
      .title-section h1 { font-size: 20pt; font-weight: 800; color: #1e3a8a; margin: 0 0 4px; letter-spacing: -0.5px; }
      .title-section .icon-title { font-size: 32pt; }
      .title-section .subtitle { font-size: 11pt; color: #64748b; }
      .title-section .meta { font-size: 9pt; color: #94a3b8; margin-top: 8px; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
      .divider { height: 3px; background: linear-gradient(90deg, #3b82f6, #1d4ed8, #3b82f6); margin: 0 28px 8px; border-radius: 2px; }
      .content { padding: 8px 28px 20px; }
      .section { margin-top: 16px; padding: 14px 18px; background: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; }
      .section h2 { font-size: 13pt; font-weight: 700; color: #1e3a8a; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 2px solid #3b82f6; }
      .section h3 { font-size: 11pt; font-weight: 700; color: #334155; margin: 10px 0 4px; }
      .section p { margin: 4px 0; font-size: 9.5pt; color: #475569; text-align: justify; }
      .tag { display: inline-block; background: #ede9fe; color: #5b21b6; padding: 1px 10px; border-radius: 10px; font-size: 8pt; font-weight: 600; margin: 1px; }
      .tag-ok { background: #dcfce7; color: #166534; }
      table.bom { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9pt; }
      table.bom th { background: #1e3a8a; color: white; padding: 6px 8px; text-align: left; font-size: 8.5pt; font-weight: 600; }
      table.bom th.right { text-align: right; }
      table.bom th.center { text-align: center; }
      table.bom td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; }
      table.bom tr:nth-child(even) td { background: #f8fafc; }
      table.bom tfoot td { background: #f1f5f9; font-weight: 700; border-top: 2px solid #1e3a8a; }
      .fieldbus-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 12px; margin-bottom: 6px; }
      .fieldbus-card .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .fieldbus-card .header strong { font-size: 10pt; }
      .fieldbus-card .meta-grid { display: flex; gap: 16px; font-size: 8.5pt; color: #64748b; }
      .ctrl-grid { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0; }
      .ctrl-card { background: #ede9fe; padding: 6px 10px; border-radius: 4px; font-size: 9pt; flex: 1; min-width: 120px; }
      .ctrl-card strong { font-size: 9.5pt; }
      .ctrl-card .io-info { font-size: 8pt; color: #475569; margin-top: 2px; }
      .footer-bar { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 10px 28px; color: white; font-size: 8pt; text-align: center; opacity: 0.9; margin-top: 16px; }
    </style>
    <div class="page">

  <div class="header-bar">
    <div>
      <div class="empresa">${this.escapeHtml(nomeEmpresa)}</div>
      <div class="sub">Sistema de Propostas T\u00e9cnicas / Comerciais</div>
    </div>
    <div class="badge">\uD83D\uDCE1 Arquitetura de Rede</div>
  </div>

  <div class="title-section">
    <div class="icon-title">\uD83D\uDCF6</div>
    <h1>ARQUITETURA DE REDE INDUSTRIAL</h1>
    <div class="subtitle">Memorial Descritivo T\u00e9cnico</div>
    <div class="meta">
      <span class="meta-item">\uD83D\uDCCB Proposta: <strong>${this.escapeHtml(proposalCode)}</strong></span>
      <span class="meta-item">\uD83D\uDCC5 Data: <strong>${dateStr}</strong></span>
      <span class="meta-item">\u23F0 Hora: <strong>${timeStr}</strong></span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="content">

    <!-- SECTION 1 - RESUMO EXECUTIVO -->
    <div class="section">
      <h2>\uD83C\uDFAF 1. OBJETIVO</h2>
      <p>O presente memorial descritivo tem por objetivo definir e especificar a arquitetura de rede industrial proposta para o sistema de automa\u00e7\u00e3o composto por <strong>${cabecalho.totalControladores} controlador(es) l\u00f3gico(s) program\u00e1vel(eis)</strong> (CLP) e/ou m\u00f3dulos remotos de E/S (REM), totalizando <strong>${cabecalho.totalIO} pontos de I/O</strong> distribu\u00eddos em <strong>${nivelCampo?.barramentos?.reduce((a, b) => a + (b.nos || 0), 0) || 0} dispositivo(s) de campo</strong>.</p>
      <p>O projeto adota o protocolo <strong>${cabecalho.protocoloIndustrial}</strong> para o n\u00edvel de c\u00e9lula/controle e <strong>${cabecalho.protocoloCampo}</strong> para o n\u00edvel de campo, em topologia <strong>${topoLabel}</strong>, conforme crit\u00e9rios definidos nas normas IEC 61158 e IEC 61784.</p>
    </div>

    <!-- SECTION 2 - HIERARQUIA -->
    <div class="section" style="page-break-inside:avoid;">
      <h2>\uD83C\uDFD7\uFE0F 2. HIERARQUIA DA REDE</h2>
      <p>A arquitetura proposta segue o modelo hier\u00e1rquico de tr\u00eas n\u00edveis, conforme as melhores pr\u00e1ticas de engenharia de automa\u00e7\u00e3o industrial.</p>
    </div>

    <!-- 2.1 NIVEL DE CAMPO -->
    <div class="section">
      <h2>\uD83D\uDD27 2.1. N\u00edvel de Campo</h2>
      <p>O n\u00edvel de campo \u00e9 composto por sensores, atuadores e m\u00f3dulos remotos de E/S descentralizadas, interligados via barramento <strong>${cabecalho.protocoloCampo}</strong>. Para dist\u00e2ncias curtas e alta imunidade a ru\u00eddos, utiliza-se meio f\u00edsico RS-485 com cabo tipo A ou par tran\u00e7ado blindado, conforme norma IEC 61158. Foram previstos <strong>${nivelCampo?.barramentos?.length || 0} barramento(s)</strong> de campo.</p>
      ${(nivelCampo?.barramentos || []).map(fb => `
      <div class="fieldbus-card">
        <div class="header">
          <strong>\uD83D\uDD17 ${this.escapeHtml(fb.mestre)}</strong>
          <span class="tag">${fb.protocolo}</span>
        </div>
        <div class="meta-grid">
          <span>N\u00f3s: <strong>${fb.nos}</strong> / ${fb.maximoPermitido} m\u00e1x</span>
          <span>Dist\u00e2ncia m\u00e1x: ${fb.distanciaMaxima}m</span>
        </div>
        ${fb.precisaRepetidor ? '<div style="margin-top:4px;padding:2px 6px;background:#fef3c7;color:#92400e;border-radius:3px;font-size:8px;font-weight:600;">\u26A0\uFE0F Requer repetidor (limite de n\u00f3s excedido)</div>' : '<div style="margin-top:4px;"><span class="tag tag-ok">\u2705 OK</span></div>'}
        <div style="margin-top:4px;font-size:8px;color:#64748b;display:flex;flex-wrap:wrap;gap:2px;">
          ${fb.dispositivosCampo.slice(0, 8).map(d => `<span style="background:white;border:1px solid #e2e8f0;padding:1px 5px;border-radius:3px;">${d.tag}</span>`).join('')}
          ${fb.dispositivosCampo.length > 8 ? `<span style="color:#94a3b8;">...+${fb.dispositivosCampo.length - 8} mais</span>` : ''}
        </div>
      </div>
      `).join('')}
    </div>

    <!-- 2.2 NIVEL DE CELULA -->
    <div class="section">
      <h2>\uD83D\uDCBB 2.2. N\u00edvel de C\u00e9lula / Controle</h2>
      <p>Os CLPs e IHMs s\u00e3o interligados via rede <strong>${cabecalho.protocoloIndustrial}</strong> em topologia <strong>${topoLabel}</strong>. O meio f\u00edsico empregado \u00e9 cabo blindado STP CAT6 (SF/UTP) com conectores RJ45 blindados, taxa de transmiss\u00e3o de ${nivelCelula?.velocidade || '100 Mbps'}.</p>

      <h3>\uD83D\uDEE0\uFE0F Controladores (${nivelCelula?.controladores?.length || 0})</h3>
      <div class="ctrl-grid">
        ${(nivelCelula?.controladores || []).map(c => `
        <div class="ctrl-card">
          <strong>${this.escapeHtml(c.tag)}</strong> <span style="color:#64748b;">(${c.tipo})</span>
          <div class="io-info">DI:${c.io.DI} | DO:${c.io.DO} | AI:${c.io.AI} | AO:${c.io.AO}</div>
        </div>
        `).join('')}
      </div>

      <h3>\uD83D\uDD0C Switches Industriais</h3>
      ${(nivelCelula?.switches || []).map(s => `
      <div class="switch-item"><strong>${s.quantidade}x</strong> ${s.descricao}${s.margemExpansao !== undefined ? ` <span style="color:#22c55e;">(${s.margemExpansao} portas livres)</span>` : ''}</div>
      `).join('')}
    </div>

    <!-- 2.3 NIVEL DE GESTAO -->
    <div class="section">
      <h2>\u2601\uFE0F 2.3. N\u00edvel de Gest\u00e3o / IIoT</h2>
      ${nivelGestao?.habilitado ? `
      <p>A integra\u00e7\u00e3o com sistemas supervis\u00f3rios e de gest\u00e3o \u00e9 realizada atrav\u00e9s dos protocolos <strong>${nivelGestao.protocolos.join(' e ')}</strong>. Esta camada permite a coleta de dados hist\u00f3ricos, monitoramento remoto e integra\u00e7\u00e3o com sistemas MES/ERP.</p>
      ${(nivelGestao.dispositivos || []).map(d => `<div style="padding:3px 8px;background:#f0f9ff;border-radius:4px;font-size:8.5px;margin-bottom:2px;">\u2022 <strong>${d.tipo}</strong> \u2014 ${d.descricao} (${d.protocolo})</div>`).join('')}
      ` : '<p>N\u00e3o foi especificada integra\u00e7\u00e3o com SCADA ou sistemas IIoT no escopo desta proposta. Caso necess\u00e1rio, a arquitetura suporta expans\u00e3o futura via protocolos OPC UA e/ou MQTT.</p>'}
    </div>

    <!-- SECTION 3 - DIAGRAMA DE TOPOLOGIA -->
    <div class="section" style="page-break-inside:avoid;">
      <h2>\uD83C\uDFD7\uFE0F 3. DIAGRAMA DE TOPOLOGIA</h2>
      <p>Diagrama esquem\u00e1tico da topologia de rede industrial proposta, organizado nos tr\u00eas n\u00edveis hier\u00e1rquicos (Gest\u00e3o/IIoT, C\u00e9lula/Controle e Campo):</p>
      <div style="margin-top:10px;text-align:center;background:#ffffff;border:1px solid #e2e8f0;border-radius:6px;padding:8px;overflow-x:auto;">
        ${topologySVG}
      </div>
    </div>

    <!-- SECTION 4 - BOM -->
    <div class="section">
      <h2>\uD83D\uDCE6 4. LISTA DE MATERIAIS DE REDE</h2>
      <p>Com base na arquitetura definida, foram dimensionados os seguintes materiais de rede para implanta\u00e7\u00e3o do sistema de comunica\u00e7\u00e3o industrial:</p>
      ${bomItems.length > 0 ? `
      <table class="bom">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Descri\u00e7\u00e3o</th>
            <th class="center">Qtd</th>
            <th class="center">Un</th>
            <th class="right">Custo Unit.</th>
            <th class="right">Custo Total</th>
          </tr>
        </thead>
        <tbody>
          ${bomRows}
        </tbody>
        <tfoot>
          <tr style="background:#f8fafc;font-weight:700;">
            <td colspan="5" style="padding:4px 8px;text-align:right;border-top:2px solid #1e3a8a;">Total Estimado</td>
            <td style="padding:4px 8px;text-align:right;border-top:2px solid #1e3a8a;color:#1e3a8a;">R$ ${(bom.custoEstimadoTotal || 0).toLocaleString('pt-BR')}</td>
          </tr>
        </tfoot>
      </table>
      ` : '<p style="color:#94a3b8;">Nenhum material dimensionado.</p>'}
      ${fichasTecnicas.length > 0 ? `
      <h3 style="font-size:10pt;font-weight:700;color:#334155;margin-top:12px;">Fichas T\u00e9cnicas dos Equipamentos</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;">
        ${fichasTecnicas.map(f => `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:8px;font-size:8.5px;">
          <div style="font-weight:700;margin-bottom:4px;">${f.equipamento}</div>
          <div style="color:#64748b;margin-bottom:4px;">Fabricante: ${f.fabricanteSugerido}</div>
          ${Object.entries(f.especificacoes).map(([k, v]) => `<div style="display:flex;gap:4px;"><span style="color:#94a3b8;min-width:70px;">${k}:</span><span>${v}</span></div>`).join('')}
        </div>
        `).join('')}
      </div>
      ` : ''}
    </div>

    <!-- SECTION 5 - CONFORMIDADE -->
    <div class="section">
      <h2>\u2705 5. CONFORMIDADE NORMATIVA</h2>
      <p>Foram verificadas as seguintes normas e recomenda\u00e7\u00f5es t\u00e9cnicas aplic\u00e1veis ao projeto:</p>
      ${conformidade.length > 0 ? conformidade.map(c => {
        const badge = c.status === 'ok' ? '<span style="background:#dcfce7;color:#166534;padding:1px 8px;border-radius:8px;font-size:8px;font-weight:600;">OK</span>' :
          c.status === 'warn' ? '<span style="background:#fef3c7;color:#92400e;padding:1px 8px;border-radius:8px;font-size:8px;font-weight:600;">ALERTA</span>' :
          '<span style="background:#dbeafe;color:#1e40af;padding:1px 8px;border-radius:8px;font-size:8px;font-weight:600;">INFO</span>';
        return '<div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:9px;">' +
          '<div style="flex-shrink:0;margin-top:1px;">' + badge + '</div>' +
          '<div><strong>' + c.norma + '</strong><br><span style="color:#475569;">' + c.mensagem + '</span></div></div>';
      }).join('') : '<p style="color:#94a3b8;">Nenhuma verifica\u00e7\u00e3o normativa realizada.</p>'}
    </div>

    <!-- SECTION 6 - PLANO DE IP -->
    <div class="section">
      <h2>\uD83C\uDF10 6. PLANO DE ENDERE\u00c7AMENTO IP</h2>
      ${enderecamentoIP ? `
      <p>Foram definidas <strong>${enderecamentoIP.vlans.length}</strong> VLAN(s) para segmenta\u00e7\u00e3o da rede industrial:</p>
      <table class="bom">
        <thead><tr><th>VLAN</th><th>ID</th><th>Sub-rede</th><th>Gateway</th></tr></thead>
        <tbody>
          ${enderecamentoIP.vlans.map(v => '<tr><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;">' + v.nome + '</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">' + v.vlanId + '</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;">' + v.subnet + '</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;">' + v.gateway + '</td></tr>').join('')}
        </tbody>
      </table>
      ${enderecamentoIP.dispositivos.length > 0 ? `
      <p style="margin-top:8px;">Endere\u00e7os IP atribu\u00eddos aos dispositivos:</p>
      <table class="bom">
        <thead><tr><th>Tag</th><th>Tipo</th><th>IP</th><th>VLAN</th></tr></thead>
        <tbody>
          ${enderecamentoIP.dispositivos.map(d => '<tr><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;font-weight:600;">' + d.tag + '</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;">' + d.tipo + '</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;font-family:monospace;">' + d.ip + '</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;">' + d.vlan + '</td></tr>').join('')}
        </tbody>
      </table>
      ` : ''}
      ` : '<p>Endere\u00e7amento IP n\u00e3o configurado. Utilizar esquema definido pelo cliente.</p>'}
    </div>

    <!-- SECTION 7 - VALIDACAO -->
    <div class="section">
      <h2>\u26A0\uFE0F 7. VALIDA\u00c7\u00c3O DE RESTRI\u00c7\u00d5ES</h2>
      ${(() => {
        const warnings = [];
        for (const fb of (nivelCampo?.barramentos || [])) {
          if (fb.nos > fb.maximoPermitido) {
            warnings.push('Barramento "' + fb.mestre + '" possui ' + fb.nos + ' dispositivos, excedendo o limite de ' + fb.maximoPermitido + ' n\u00f3s. Recomenda-se a instala\u00e7\u00e3o de repetidor ou segmenta\u00e7\u00e3o do barramento.');
          }
        }
        if (warnings.length === 0) {
          return '<div style="padding:6px 10px;background:#dcfce7;color:#166534;border-radius:4px;font-size:9px;font-weight:600;">\u2705 Todos os barramentos e segmentos de rede est\u00e3o dentro dos limites operacionais dos respectivos protocolos.</div>';
        }
        return '<p style="font-size:9px;">Foram identificadas as seguintes restri\u00e7\u00f5es t\u00e9cnicas:</p>' + warnings.map((w, i) => '<div style="padding:4px 8px;background:#fef3c7;color:#92400e;border-radius:4px;font-size:8.5px;margin-bottom:2px;">\u26A0\uFE0F ' + (i+1) + '. ' + w + '</div>').join('');
      })()}
    </div>

    <!-- SECTION 8 - CONSIDERACOES FINAIS -->
    <div class="section">
      <h2>\uD83D\uDCCB 8. CONSIDERA\u00c7\u00d5ES FINAIS</h2>
      <p>A arquitetura de rede aqui descrita foi dimensionada considerando as melhores pr\u00e1ticas de engenharia de automa\u00e7\u00e3o industrial, incluindo: redund\u00e2ncia de comunica\u00e7\u00e3o (topologia em anel com MRP), imunidade a ru\u00eddos (cabeamento blindado, aterramento adequado), margem de expans\u00e3o futura (<strong>${Math.ceil(cabecalho.totalIO * 0.2)} pontos de I/O de reserva</strong> recomendados) e modularidade dos componentes de campo.</p>
      <p>Recomenda-se que o comissionamento da rede inclua ensaios de ponto a ponto, teste de integridade do cabeamento, verifica\u00e7\u00e3o de aterramento e blindagem, al\u00e9m de valida\u00e7\u00e3o dos tempos de ciclo da comunica\u00e7\u00e3o conforme requisitos da aplica\u00e7\u00e3o.</p>
    </div>

  </div>

  <div class="footer-bar">
    Documento gerado automaticamente pelo GeraPro v1.0 em ${dateStr} \u00e0s ${timeStr} &mdash; Proposta ${proposalCode}
  </div>

</div>`;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.automacaoRedeUI = ArquiteturaRedeUI;
ArquiteturaRedeUI.init();
