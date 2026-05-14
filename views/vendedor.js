const layout = require('./layout');
const menuLateral = require('./menuLateral');
const loading = require('./loading');

const formatarBRL = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarDataInput = (dataStr) => {
    if (!dataStr) return '';
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

const kpiCard = (titulo, alcancado, meta, icone, formatarMoeda = false, modalId = '', formatarPercentual = false) => {
    const numAlcancado = Number(alcancado) || 0;
    const numMeta = Number(meta) || 0;
    const atingiu = (numAlcancado >= numMeta && numMeta > 0);
    const cor = atingiu ? 'success' : 'primary';
    const glowClass = atingiu ? 'glow-success' : '';

    let textoAlcancado = numAlcancado;
    let textoMeta = numMeta;

    if (formatarMoeda) {
        textoAlcancado = formatarBRL(numAlcancado);
        textoMeta = formatarBRL(numMeta);
    } else if (formatarPercentual) {
        textoAlcancado = numAlcancado.toFixed(1) + '%';
        textoMeta = numMeta.toFixed(0) + '%';
    }

    return `
        <div class="col-6 col-md-3 mb-3 animate-up">
            <div class="card shadow-sm border-start border-${cor} border-4 h-100 kpi-card ${glowClass}"
                 ${modalId ? `data-bs-toggle="modal" data-bs-target="#${modalId}"` : ''} style="${modalId ? 'cursor: pointer; transition: 0.2s;' : ''}">
                <div class="card-body py-2 px-3 d-flex justify-content-between align-items-center">
                    <div style="min-width: 0; flex-grow: 1; padding-right: 2px;">
                        <h6 class="text-muted mb-0 text-truncate" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;" title="${titulo}">${titulo}</h6>
                        <div class="mb-0 fw-bold text-${cor}" style="font-size: 1.1rem; line-height: 1.2;">
                            <span class="counter-animate" data-val="${numAlcancado}" data-currency="${formatarMoeda}" data-percent="${formatarPercentual}">${textoAlcancado}</span> 
                            <span class="text-muted fw-normal d-inline-block" style="font-size: 0.85rem;">/ ${textoMeta}</span>
                        </div>
                    </div>
                    <div class="bg-light text-${cor} rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 40px; height: 40px;">
                        <i class="fa-solid ${icone}" style="font-size: 1.1rem;"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const modalListaClientes = (id, titulo, clientesFiltrados) => `
    <div class="modal fade" id="${id}" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <div class="modal-header bg-dark text-white border-0">
                    <h6 class="modal-title fw-bold"><i class="fa-solid fa-list me-2 text-primary"></i> ${titulo}</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="table-responsive">
                        <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.9rem;">
                            <thead class="bg-white" style="position: sticky; top: 0; z-index: 1;">
                                <tr>
                                    <th class="ps-3 py-3 border-0">Cliente</th>
                                    <th class="py-3 border-0 text-end pe-3">Valor</th>
                                    <th class="py-3 border-0">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${clientesFiltrados.length > 0 ? clientesFiltrados.map(c => `
                                    <tr>
                                        <td class="ps-3 py-2 fw-medium text-dark">
                                            ${c.nome}
                                            ${c.cliente_grande === 'sim' ? '<span class="badge bg-warning text-dark ms-1" style="font-size: 0.6rem;"><i class="fa-solid fa-star"></i> GRANDE</span>' : ''}
                                            ${c.observacao ? `<br><small class="text-muted d-inline-block text-truncate" style="max-width: 200px; vertical-align: bottom;"><i class="fa-solid fa-note-sticky me-1"></i>${c.observacao}</small>` : ''}
                                        </td>
                                        <td class="py-2 text-end pe-3 fw-bold text-success">${formatarBRL(c.valor_venda)}</td>
                                        <td class="py-2">${c.fechou === 'sim' ? '<span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size: 0.75rem;">Fechou</span>' : '<span class="badge bg-light text-muted border" style="font-size: 0.75rem;">Pendente</span>'}</td>
                                    </tr>
                                `).join('') : `<tr><td colspan="3" class="text-center text-muted py-5">Nenhum registro encontrado.</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer border-0 bg-light">
                    <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>
`;

module.exports = (usuario, clientes, metas, kpis, metaGlobal, alcancadoGlobal, usuarios = [], todosClientes = [], tutoriais = [], dataAtualizacaoAdmin = null) => {

    const minGrande = usuario.setor === 'ecommerce' ? 5000 : 15000;
    
    const totalCarteira = kpis.total_carteira || 0;
    const totalFidelizados = kpis.total_fidelizados || 0;
    const taxaRetencaoAlcancada = totalCarteira > 0 ? (totalFidelizados / totalCarteira) * 100 : 0;

    // =========================================================
    // LÓGICA: PEGAR A DATA REAL DO ÚLTIMO AJUSTE DE FATURAMENTO
    // =========================================================
    const dataMaisRecente = usuarios.reduce((maxDate, u) => {
        if (u.data_atualizacao_faturamento) {
            const dataUsuario = new Date(u.data_atualizacao_faturamento);
            return dataUsuario > maxDate ? dataUsuario : maxDate;
        }
        return maxDate;
    }, new Date(0));

    const dataExibicaoRank = dataMaisRecente.getTime() > 0 
        ? dataMaisRecente.toLocaleDateString('pt-BR') + ' às ' + dataMaisRecente.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'Aguardando atualização';

    return layout(`
    
    ${loading()}
    ${menuLateral(usuario)}

    <style>
        .main-container {
            width: 95%; /* Espaço mais amplo nas laterais */
            max-width: 1600px;
            margin: 0 auto;
            font-size: 0.95rem;
            padding-top: 2rem;
        }
        @media (max-width: 768px) {
            .main-container { width: 98%; padding-top: 0.5rem; }
            .kpi-card h6 { font-size: 0.7rem !important; }
            .kpi-card span { font-size: 0.9rem !important; }
        }
        
        /* ========================================= */
        /* ANIMAÇÕES DE ENTRADA (CARREGAMENTO)       */
        /* ========================================= */
        .animate-up { 
            animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards; 
        }
        @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-modal { 
            animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; 
        }
        @keyframes zoomIn {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
        }

        /* ========================================= */
        /* EFEITO DE BRILHO DUPLO (KPIS BATIDOS)     */
        /* ========================================= */
        @keyframes dualGlow {
            0% { 
                box-shadow: 0 0 10px rgba(25, 135, 84, 0.5), 0 0 20px rgba(13, 202, 240, 0.3); 
                border-color: #198754 !important;
            }
            100% { 
                box-shadow: 0 0 20px rgba(25, 135, 84, 0.9), 0 0 30px rgba(13, 202, 240, 0.7); 
                border-color: #0dcaf0 !important;
            }
        }
        .glow-success {
            animation: dualGlow 2s infinite alternate !important;
            z-index: 1;
        }

        /* ========================================= */
        /* EFEITO DEGRADÊ FLUIDO (META GERAL)        */
        /* ========================================= */
        @keyframes fluidGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .fluid-success {
            background: linear-gradient(270deg, #198754, #20c997, #0f5132, #28a745);
            background-size: 400% 400%;
            animation: fluidGradient 15s ease infinite !important;
        }
        .fluid-primary {
            background: linear-gradient(270deg, #0d6efd, #6610f2, #0dcaf0, #0d6efd);
            background-size: 400% 400%;
            animation: fluidGradient 15s ease infinite !important;
        }

        /* ========================================= */
        /* ANIMAÇÃO BARRA E SLIDES DO TUTORIAL       */
        /* ========================================= */
        @keyframes fillBar {
            from { width: 0%; }
        }
        .carousel-item {
            transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }

        /* ========================================= */
        /* BOTÃO FLUTUANTE DE TUTORIAIS              */
        /* ========================================= */
        .fab-tutorial {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #0d6efd;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 15px rgba(13, 110, 253, 0.4);
            cursor: pointer;
            z-index: 1040;
            transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .fab-tutorial:hover {
            transform: scale(1.1) translateY(-5px);
            background-color: #0b5ed7;
        }
    </style>

    <div class="main-content-wrapper">
        <div class="main-container">

            <div class="row mb-4 align-items-stretch">
                
                ${(() => {
                    const vAlcancado = Number(alcancadoGlobal) || 0;
                    const vMeta = Number(metaGlobal) || 0;
                    const atingiuGlobal = (vAlcancado >= vMeta && vMeta > 0);
                    const corGlobal = atingiuGlobal ? 'success' : 'primary';
                    const glowGlobal = atingiuGlobal ? 'glow-success' : '';
                    const fluidClass = atingiuGlobal ? 'fluid-success' : 'fluid-primary';
                    const porcentagem = vMeta > 0 ? Math.min((vAlcancado / vMeta) * 100, 100) : 0;
                    
                    const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });
                    const mesNome = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

                    return `
                    <div class="col-lg-4 col-md-12 mb-3 mb-lg-0 d-flex animate-up" style="animation-delay: 0.1s;">
                        <div class="card shadow-sm border-start border-${corGlobal} border-4 rounded-3 w-100 position-relative ${glowGlobal}">
                            
                            <span class="position-absolute top-0 end-0 badge bg-${corGlobal} mt-2 me-2 text-uppercase shadow-sm" style="font-size: 0.6rem; letter-spacing: 0.5px;">${mesNome}</span>
                            
                            <div class="card-body text-center bg-white d-flex flex-column justify-content-center py-4">
                                <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.85rem;"><i class="fa-solid fa-earth-americas text-${corGlobal} me-2"></i> Meta Geral</h6>
                                
                                <div class="progress mb-3 shadow-sm position-relative" style="height: 35px; border-radius: 25px; background-color: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                                    <div class="progress-bar ${fluidClass} progress-bar-animate" role="progressbar" data-width="${porcentagem}" style="width: 0%;"></div>
                                    <div class="position-absolute top-50 start-50 translate-middle text-white fw-bold progress-text-animate" style="font-size: 1.25rem; letter-spacing: 0.5px; z-index: 2; text-shadow: none;" data-value="${porcentagem}">
                                        0.0%
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center mt-2 px-2">
                                    <div class="text-start">
                                        <span class="d-block text-muted text-uppercase" style="font-size: 0.65rem;">Alcançado</span>
                                        <strong class="text-${corGlobal}" style="font-size: 1rem;"><span class="counter-animate" data-val="${vAlcancado}" data-currency="true">R$ 0,00</span></strong>
                                    </div>
                                    <div class="text-end">
                                        <span class="d-block text-muted text-uppercase" style="font-size: 0.65rem;">Meta</span>
                                        <strong class="text-dark" style="font-size: 1rem;">${formatarBRL(vMeta)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                })()}

                <div class="col-lg-4 col-md-6 mb-3 mb-md-0 d-flex animate-up" style="animation-delay: 0.2s;">
                    <div class="card shadow-sm rounded-3 border w-100">
                        <div class="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                            <span class="fw-bold" style="font-size: 0.9rem;">
                                <i class="fa-solid fa-trophy text-warning me-2"></i> Pontuação
                            </span>
                        </div>

                        <div class="card-body p-0">
                            <table class="table table-hover align-middle mb-0">
                                <thead class="bg-light" style="font-size: 0.75rem;">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted">Vendedor</th>
                                        <th class="text-end pe-3 py-2 text-muted">Pontos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${[...usuarios].sort((a, b) => b.pontuacao - a.pontuacao).map((u, index) => `
                                        <tr style="cursor: pointer; transition: 0.2s; ${u.id === usuario.id ? 'background-color: rgba(13, 110, 253, 0.15); border-left: 3px solid #0d6efd;' : ''}" 
                                            onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'" 
                                            onmouseout="this.style.backgroundColor='${u.id === usuario.id ? 'rgba(13, 110, 253, 0.15)' : 'transparent'}'" 
                                            data-bs-toggle="modal" 
                                            data-bs-target="#modalPontosUsuario${u.id}" 
                                            title="Ver Conquistas">

                                            <td class="ps-3 py-2">
                                                <div class="d-flex align-items-center">
                                                    <div class="position-relative me-2">
                                                        <img src="${u.foto || 'https://via.placeholder.com/40'}" width="32" height="32" class="rounded-circle border shadow-sm" style="object-fit: cover;">
                                                        ${index === 0 ? '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark" style="font-size: 0.55rem;"><i class="fa-solid fa-crown"></i></span>' : ''}
                                                    </div>

                                                    <div class="d-flex flex-column">
                                                        <span class="fw-bold ${u.id === usuario.id ? 'text-primary' : 'text-dark'}" style="font-size: 0.85rem;">${u.nome}</span>
                                                        <span class="text-muted" style="font-size: 0.65rem; text-transform: uppercase;">${u.setor}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td class="text-end pe-3 py-2">
                                                <strong class="text-warning">
                                                    <i class="fa-solid fa-star text-warning small me-1"></i> 
                                                    <span class="counter-animate" data-val="${u.pontuacao}">0</span>
                                                </strong>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 col-md-6 d-flex animate-up" style="animation-delay: 0.3s;">
                    <div class="card shadow-sm rounded-3 border w-100">
                        <div class="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                            <span class="fw-bold d-flex align-items-center" style="font-size: 0.9rem;">
                                <i class="fa-solid fa-sack-dollar text-success me-2"></i> Vendas (R$)
                            </span>

                            <span class="badge bg-success-subtle text-success border border-success-subtle fw-medium" 
                                style="font-size: 0.65rem; letter-spacing: 0px;" 
                                title="Atualizado">
                                <i class="fa-solid fa-clock me-1"></i> Atualizado: ${dataExibicaoRank}
                            </span>
                        </div>

                        <div class="card-body p-0">
                            <table class="table table-hover align-middle mb-0">
                                <thead class="bg-light" style="font-size: 0.75rem;">
                                    <tr>
                                        <th class="ps-3 py-2 text-muted">Vendedor</th>
                                        <th class="text-end pe-3 py-2 text-muted">Faturamento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(() => {
                                        const vendedores = usuarios.filter(u => u.tipo === 'vendedor');
                                        const rankingFaturamento = vendedores.map(v => {
                                            const vendasDoVendedor = todosClientes.filter(c => c.vendedor_id === v.id && c.fechou === 'sim');
                                            const totalVendido = vendasDoVendedor.reduce((acc, curr) => acc + Number(curr.valor_venda), 0) + Number(v.faturamento_manual || 0);
                                            return { ...v, totalVendido };
                                        });

                                        rankingFaturamento.sort((a, b) => b.totalVendido - a.totalVendido);

                                        return rankingFaturamento.map((u, index) => `
                                            <tr style="transition: 0.2s; ${u.id === usuario.id ? 'background-color: rgba(13, 110, 253, 0.15); border-left: 3px solid #0d6efd;' : ''}" 
                                                onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'" 
                                                onmouseout="this.style.backgroundColor='${u.id === usuario.id ? 'rgba(13, 110, 253, 0.15)' : 'transparent'}'">

                                                <td class="ps-3 py-2">
                                                    <div class="d-flex align-items-center">
                                                        <img src="${u.foto || 'https://via.placeholder.com/40'}" width="32" height="32" class="rounded-circle border me-2 shadow-sm" style="object-fit: cover;">
                                                        <span class="fw-bold ${u.id === usuario.id ? 'text-primary' : 'text-dark'}" style="font-size: 0.85rem;">${u.nome}</span>
                                                    </div>
                                                </td>

                                                <td class="text-end pe-3 py-2">
                                                    <strong class="text-success" style="font-size: 0.9rem;">
                                                        <span class="counter-animate" data-val="${u.totalVendido}" data-currency="true">R$ 0,00</span>
                                                    </strong>
                                                </td>
                                            </tr>
                                        `).join('');
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            <div class="card shadow-sm mb-4 animate-up" style="animation-delay: 0.4s;">
                <div class="card-header bg-white py-3 border-0"><i class="fa-solid fa-gauge-high text-primary me-2"></i> <span class="fw-bold">Meus Indicadores de Performance</span></div>
                <div class="card-body bg-light-subtle pb-0 px-3 pt-4">
                    <div class="row">
                        ${kpiCard('Prosp. Sem Visita', kpis.prosp_sem_visita, metas.qtd_prosp_sem_visita, 'fa-phone', false, 'modalKpi_sem_visita')}
                        ${kpiCard('Prosp. Com Visita', kpis.prosp_com_visita, metas.qtd_prosp_com_visita, 'fa-handshake', false, 'modalKpi_com_visita')}
                        ${kpiCard('Novos Clientes', kpis.clientes_fechar, metas.qtd_clientes_fechar, 'fa-user-check', false, 'modalKpi_fechar')}
                        ${kpiCard('Cliente Grande', kpis.qtd_cliente_grande, metas.qtd_cliente_grande, 'fa-gem', false, 'modalKpi_grande')}
                        
                        ${kpiCard('Minha Meta', kpis.valor_total_vendas, metas.meta_geral, 'fa-sack-dollar', true, 'modalKpi_vendas')}
                        
                        ${kpiCard('Pós-Venda Feito', kpis.pos_venda, metas.qtd_pos_venda, 'fa-headset', false, 'modalKpi_pos_venda')}
                        ${kpiCard('Visitas Carteira', kpis.visitas_carteira, metas.qtd_visitas_carteira, 'fa-car', false, 'modalKpi_visita')}
                        ${kpiCard('Reativações', kpis.reativacoes, metas.qtd_reativacoes, 'fa-rotate-right', false, 'modalKpi_reativacao')}

                        ${usuario.setor === 'industria' ? kpiCard('Taxa Retenção', taxaRetencaoAlcancada, metas.taxa_retencao || 40, 'fa-chart-pie', false, 'modalKpi_retencao', true) : ''}
                    </div>
                </div>
            </div>

            <div class="card shadow-sm mb-5 animate-up" style="animation-delay: 0.5s;">
                
                <div class="card-header bg-white py-3 border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div class="d-flex align-items-center w-100">
                        <i class="fa-solid fa-address-book text-secondary me-2"></i> <span class="fw-bold">Gestão Ativa da Carteira</span>
                        ${usuario.setor === 'industria' ? '<span class="badge bg-warning text-dark small fw-bold ms-2">FIDELIZAÇÃO: META 40%</span>' : ''}
                    </div>
                    
                    <div class="d-flex flex-wrap flex-md-nowrap gap-2 w-100 justify-content-md-end">
                        <div class="input-group input-group-sm" style="min-width: 180px; max-width: 250px;">
                            <span class="input-group-text bg-light border-end-0"><i class="fa-solid fa-search text-muted"></i></span>
                            <input type="text" id="filtroTexto" class="form-control border-start-0 ps-0" placeholder="Buscar cliente...">
                        </div>
                        <select id="filtroPosVenda" class="form-select form-select-sm w-auto">
                            <option value="">Pós-Venda: Todos</option>
                            <option value="sim">Feito</option>
                            <option value="pendente">Pendente</option>
                            <option value="nao">Não Realizado</option>
                        </select>
                        <select id="filtroRecorrencia" class="form-select form-select-sm w-auto">
                            <option value="">Recorrência: Todas</option>
                            <option value="sim">Comprou</option>
                            <option value="nao">Inativo</option>
                        </select>
                    </div>
                </div>
                
                <div class="card-body p-0 overflow-auto">
                    <div class="table-responsive" style="min-height: 400px;">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-4 py-3 text-muted small uppercase">Cliente</th>
                                    <th class="py-3 text-muted small uppercase">Status</th>
                                    <th class="py-3 text-muted small uppercase">Valor</th>
                                    <th class="py-3 text-muted small uppercase">Pós-Venda</th>
                                    <th class="py-3 text-muted small uppercase">Recorrência</th>
                                    <th class="text-end pe-4 py-3 text-muted small uppercase">Ações</th> 
                                </tr>
                            </thead>
                            <tbody id="tabelaClientesBody">
                                <tr id="linhaVazia" style="display: none;">
                                    <td colspan="6" class="text-center text-muted py-5">
                                        <i class="fa-solid fa-folder-open fa-2x mb-2 text-light-subtle"></i><br>
                                        Nenhum cliente corresponde aos filtros aplicados.
                                    </td>
                                </tr>
                                
                                ${clientes.map(c => `
                                    <tr class="cliente-row" data-nome="${c.nome.toLowerCase()}" data-pos="${c.pos_venda || ''}" data-rec="${c.comprou_recorrente || ''}" style="cursor: pointer;" onclick="if(!event.target.closest('button') && !event.target.closest('select')) { bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditar${c.id}')).show(); }">
                                        <td class="ps-4 fw-bold text-dark">
                                            ${c.nome}
                                            ${c.cliente_grande === 'sim' ? '<span class="badge bg-warning text-dark ms-1" style="font-size: 0.6rem;"><i class="fa-solid fa-star"></i> </span>' : ''}
                                            ${c.numero_lead ? `<br><small class="text-success fw-normal mt-1 d-inline-block" style="font-size: 0.75rem;"><i class="fa-brands fa-whatsapp me-1"></i>${c.numero_lead}</small>` : ''}
                                            ${c.observacao ? `<br><small class="text-muted fw-normal d-inline-block text-truncate mt-1" style="max-width: 180px; vertical-align: bottom; font-size: 0.75rem;"><i class="fa-solid fa-note-sticky text-warning me-1"></i>${c.observacao}</small>` : ''}
                                        </td>
                                        <td>${c.fechou === 'sim' ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Fechado</span>' : '<span class="badge bg-light text-muted border">Pendente</span>'}</td>
                                        <td class="fw-medium">${formatarBRL(c.valor_venda)}</td> 
                                        <td>
                                            ${c.fechou === 'sim' ? `
                                            <form action="/vendedor/posvenda" method="POST" class="d-inline">
                                                <input type="hidden" name="id" value="${c.id}">
                                                <select name="pos_venda" class="form-select form-select-sm d-inline w-auto bg-light-subtle border-0 py-1" onchange="this.form.submit()">
                                                    <option value="pendente" ${c.pos_venda === 'pendente' || !c.pos_venda ? 'selected' : ''}>⏳ Pendente</option>
                                                    <option value="sim" ${c.pos_venda === 'sim' ? 'selected' : ''}>✅ Feito</option>
                                                    <option value="nao" ${c.pos_venda === 'nao' ? 'selected' : ''}>❌ Não</option>
                                                </select>
                                            </form>
                                            ` : '<span class="text-muted small">-</span>'}
                                        </td>
                                        
                                        <td>
                                            ${c.carteira === 'sim' ? `
                                            <form action="/vendedor/recorrencia" method="POST" class="d-inline">
                                                <input type="hidden" name="id" value="${c.id}">
                                                <select name="comprou_recorrente" class="form-select form-select-sm d-inline w-auto bg-light-subtle border-0 py-1" onchange="this.form.submit()">
                                                    <option value="nao" ${c.comprou_recorrente === 'nao' ? 'selected' : ''}>❌ Inativo</option>
                                                    <option value="sim" ${c.comprou_recorrente === 'sim' ? 'selected' : ''}>🛒 Comprou</option>
                                                </select>
                                            </form>
                                            ` : '<span class="text-muted small">Prospecção</span>'}
                                        </td>

                                        <td class="text-end pe-4">
                                            <button class="btn btn-sm btn-light text-danger border shadow-sm" data-bs-toggle="modal" data-bs-target="#modalExcluir${c.id}" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div id="paginacaoContainer" class="d-flex justify-content-center mt-3 mb-3"></div>
                </div>
            </div>
            
        </div> 
    </div>

    ${clientes.map(c => `
        <div class="modal fade" id="modalEditar${c.id}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg animate-modal">
                    <form action="/vendedor/cliente/editar" method="POST">
                        <div class="modal-header bg-dark text-white border-0">
                            <h5 class="modal-title fw-bold"><i class="fa-solid fa-edit me-2 text-primary"></i> Atualizar</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <input type="hidden" name="id" value="${c.id}">
                            
                            <div class="row">
                                <div class="col-md-7">
                                    <label class="form-label small text-muted">Nome do Cliente</label>
                                    <input type="text" name="nome" class="form-control mb-3" value="${c.nome}" required>
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label small text-muted">Número do Lead</label>
                                    <input type="text" name="numero_lead" class="form-control mb-3 mascara-telefone" value="${c.numero_lead || ''}" placeholder="(00) 00000-0000" maxlength="15">
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-12 col-md-4">
                                    <label class="form-label small text-muted">Origem</label>
                                    <select name="prospeccao" class="form-select mb-3">
                                        <option value="" ${!c.prospeccao || c.prospeccao === '' ? 'selected' : ''}>Não definido</option>
                                        <option value="com_visita" ${c.prospeccao === 'com_visita' ? 'selected' : ''}>Com Visita</option>
                                        <option value="sem_visita" ${c.prospeccao === 'sem_visita' ? 'selected' : ''}>Sem Visita</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-4">
                                    <label class="form-label small text-muted">Status</label>
                                    <select name="fechou" class="form-select mb-3">
                                        <option value="" ${!c.fechou || c.fechou === '' ? 'selected' : ''}>Não definido</option>
                                        <option value="sim" ${c.fechou === 'sim' ? 'selected' : ''}>Fechado</option>
                                        <option value="nao" ${c.fechou === 'nao' ? 'selected' : ''}>Pendente</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-4">
                                    <label class="form-label small text-muted">Pós-Venda</label>
                                    <select name="pos_venda" class="form-select mb-3">
                                        <option value="pendente" ${c.pos_venda === 'pendente' || !c.pos_venda ? 'selected' : ''}>Pendente</option>
                                        <option value="sim" ${c.pos_venda === 'sim' ? 'selected' : ''}>Feito</option>
                                        <option value="nao" ${c.pos_venda === 'nao' ? 'selected' : ''}>Não</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-6">
                                    <label class="form-label small text-muted mb-0">Data Prospecção</label>
                                    <input type="date" name="data_prospeccao" class="form-control form-control-sm text-muted" value="${formatarDataInput(c.data_prospeccao)}">
                                </div>
                                <div class="col-6">
                                    <label class="form-label small text-muted mb-0">Data Fechamento</label>
                                    <input type="date" name="data_fechamento" class="form-control form-control-sm text-muted" value="${formatarDataInput(c.data_fechamento)}">
                                </div>
                            </div>
                            
                            <label class="form-label small text-muted">Valor da Venda (R$)</label>
                            <input type="number" step="0.01" name="valor_venda" class="form-control mb-3 fw-bold text-success" value="${c.valor_venda}" required>
                            
                            <div class="bg-light p-3 rounded mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="carteira" value="sim" id="cartEdit${c.id}" ${c.carteira === 'sim' ? 'checked' : ''}>
                                    <label class="form-check-label" for="cartEdit${c.id}">Cliente da Base (Carteira)</label>
                                </div>
                                <div class="form-check mt-1">
                                    <input class="form-check-input" type="checkbox" name="parado" value="sim" id="parEdit${c.id}" ${c.parado === 'sim' ? 'checked' : ''}>
                                    <label class="form-check-label" for="parEdit${c.id}">Reativação de Inativo</label>
                                </div>
                                <div class="form-check mt-1">
                                    <input class="form-check-input" type="checkbox" name="cliente_grande" value="sim" id="grandeEdit${c.id}" ${c.cliente_grande === 'sim' ? 'checked' : ''}>
                                    <label class="form-check-label" for="grandeEdit${c.id}">Cliente Grande?</label>
                                </div>
                            </div>
                            
                            <label class="form-label small text-muted">Região Estratégica</label>
                            <input type="text" name="regiao" class="form-control mb-3" value="${c.regiao || ''}">

                            <label class="form-label small text-muted">Observações (Opcional)</label>
                            <textarea name="observacao" class="form-control" rows="2" placeholder="Anotações extras...">${c.observacao || ''}</textarea>
                        </div>
                        <div class="modal-footer border-0 bg-light">
                            <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-dark fw-bold px-4">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalExcluir${c.id}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow animate-modal">
                    <form action="/vendedor/cliente/excluir" method="POST">
                        <div class="modal-header bg-dark text-white border-0">
                            <h5 class="modal-title fw-bold"><i class="fa-solid fa-trash-can me-2 text-danger"></i> Remover Registro</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4 text-center">
                            <input type="hidden" name="id" value="${c.id}">
                            <p>Excluir o cliente <strong>${c.nome}</strong>?</p>
                            <small class="text-danger fw-bold">Isso afetará sua pontuação imediatamente.</small>
                        </div>
                        <div class="modal-footer border-0 bg-light justify-content-end">
                            <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-dark fw-bold px-4">Excluir</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `).join('')}

    ${modalListaClientes('modalKpi_sem_visita', 'Prospecção Sem Visita', clientes.filter(c => c.prospeccao === 'sem_visita'))}
    ${modalListaClientes('modalKpi_com_visita', 'Prospecção Com Visita', clientes.filter(c => c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalKpi_fechar', 'Novos Clientes Conquistados', clientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalKpi_grande', 'Negócios de Grande Porte', clientes.filter(c => c.fechou === 'sim' && (c.valor_venda >= minGrande || c.cliente_grande === 'sim')))}
    ${modalListaClientes('modalKpi_vendas', 'Faturamento Individual Realizado', clientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalKpi_pos_venda', 'Pós-Venda Realizado', clientes.filter(c => c.pos_venda === 'sim'))}
    ${modalListaClientes('modalKpi_visita', 'Manutenção de Carteira (Visitas)', clientes.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalKpi_reativacao', 'Reativações de Clientes Inativos', clientes.filter(c => c.parado === 'sim' && c.fechou === 'sim'))}
    ${modalListaClientes('modalKpi_retencao', 'Fidelização (Clientes Recompradores)', clientes.filter(c => c.carteira === 'sim' && c.comprou_recorrente === 'sim'))}

    <div class="modal fade" id="modalCliente" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered shadow-lg">
            <div class="modal-content border-0 animate-modal">
                <form action="/vendedor/cliente" method="POST">
                    <div class="modal-header bg-dark text-white border-0">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-plus-circle me-2 text-primary"></i> Nova venda</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        
                        <div class="row">
                            <div class="col-md-7">
                                <label class="form-label small text-muted">Nome da Empresa / Cliente</label>
                                <input type="text" name="nome" class="form-control mb-3" required placeholder="Ex: Pizzaria A">
                            </div>
                            <div class="col-md-5">
                                <label class="form-label small text-muted">Número do Lead (Opcional)</label>
                                <input type="text" name="numero_lead" class="form-control mb-3 mascara-telefone" placeholder="(00) 00000-0000" maxlength="15">
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-12 col-md-4">
                                <label class="form-label small text-muted">Origem</label>
                                <select name="prospeccao" class="form-select mb-3">
                                    <option value="">Não definido</option>
                                    <option value="com_visita">Com Visita</option>
                                    <option value="sem_visita">Sem Visita</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label small text-muted">Venda?</label>
                                <select name="fechou" class="form-select mb-3">
                                    <option value="">Não definido</option>
                                    <option value="sim">Fechada</option>
                                    <option value="nao">Pendente</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label small text-muted">Pós-Venda</label>
                                <select name="pos_venda" class="form-select mb-3" required>
                                    <option value="pendente">Pendente</option>
                                    <option value="sim">Feito</option>
                                    <option value="nao">Não</option>
                                </select>
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-6">
                                <label class="form-label small text-muted mb-0">Data Prospecção</label>
                                <input type="date" name="data_prospeccao" class="form-control form-control-sm text-muted">
                            </div>
                            <div class="col-6">
                                <label class="form-label small text-muted mb-0">Data Fechamento</label>
                                <input type="date" name="data_fechamento" class="form-control form-control-sm text-muted">
                            </div>
                        </div>
                        
                        <label class="form-label small text-muted">Valor Total da Venda (R$)</label>
                        <input type="number" step="0.01" name="valor_venda" class="form-control mb-3 fw-bold" placeholder="0,00" required>
                        
                        <div class="card bg-light p-3 border-0 mb-3 shadow-sm">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" name="carteira" value="sim" id="carteira">
                                <label class="form-check-label small" for="carteira">Cliente da Carteira Atual?</label>
                            </div>
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="checkbox" name="parado" value="sim" id="parado">
                                <label class="form-check-label small" for="parado">Reativação (Cliente Inativo)?</label>
                            </div>
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="checkbox" name="cliente_grande" value="sim" id="cliente_grande">
                                <label class="form-check-label small" for="cliente_grande">Marcar como Cliente Grande VIP?</label>
                            </div>
                        </div>
                        
                        <label class="form-label small text-muted">Cidade / Região</label>
                        <input type="text" name="regiao" class="form-control mb-3" placeholder="Obrigatório p/ Bônus de Região">

                        <label class="form-label small text-muted">Observações (Opcional)</label>
                        <textarea name="observacao" class="form-control mb-2" rows="2" placeholder="Anotações extras sobre o cliente ou negociação..."></textarea>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-dark fw-bold px-4"><i class="fa-solid fa-check-circle me-1"></i> Salvar e Computar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="fab-tutorial" data-bs-toggle="modal" data-bs-target="#modalTutorialList" title="Tutoriais e Ajuda">
        <i class="fas fa-question-circle"></i>
    </div>

    <div class="modal fade" id="modalTutorialList" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <div class="modal-header bg-dark text-white border-0">
                    <h5 class="modal-title fw-bold"><i class="fa-solid fa-graduation-cap me-2 text-primary"></i> Tutoriais do Sistema</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4" style="max-height: 65vh; overflow-y: auto; overflow-x: hidden;">
                    <h6 class="text-muted small fw-bold text-uppercase mb-3">Aprenda a usar a plataforma</h6>
                    <div class="list-group">
                        ${tutoriais && tutoriais.length > 0 ? tutoriais.map(t => `
                            <div class="list-group-item bg-dark text-light border-secondary-subtle d-flex align-items-center mb-2 rounded shadow-sm" style="cursor:pointer;" onclick="abrirTutorial(${t.id}, '${t.titulo}')" data-bs-dismiss="modal">
                                <div class="text-success me-3">
                                    <i class="fa-solid fa-play-circle fa-2x"></i>
                                </div>
                                <div class="text-start flex-grow-1">
                                    <h6 class="mb-0 fw-bold text-light">${t.titulo}</h6>
                                    <small class="text-muted" style="font-size: 0.7rem;">${t.qtd_slides} slides</small>
                                </div>
                            </div>
                        `).join('') : '<div class="text-muted small text-center p-3">Nenhum tutorial disponível no momento.</div>'}
                    </div>
                </div>
                <div class="modal-footer border-0 bg-light">
                    <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalVerTutorial" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-centered"> <div class="modal-content border-0 shadow-lg animate-modal">
                <div class="modal-header bg-dark text-white border-0">
                    <h5 class="modal-title fw-bold" id="tituloTutorialVer"><i class="fa-solid fa-graduation-cap me-2 text-primary"></i> Tutorial</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-0 text-center" style="background: #0f0f0f; height: 75vh; display: flex; flex-direction: column; justify-content: flex-start; position: relative;">
                    
                    <div id="tutorialProgressWrapper" class="w-100 d-flex justify-content-center pt-4 flex-shrink-0" style="display: none !important; z-index: 10;">
                        <div class="w-100 px-2 mb-2" style="max-width: 90%;">
                            <div class="d-flex justify-content-between text-light small mb-1 fw-bold">
                                <span id="tutorialStepText">Passo 1</span>
                                <span id="tutorialTotalText">Total: 0</span>
                            </div>
                            <div class="progress shadow-sm" style="height: 8px; background-color: rgba(255,255,255,0.1); border-radius: 10px;">
                                <div id="tutorialProgressBar" class="progress-bar bg-primary" role="progressbar" style="width: 0%; border-radius: 10px; transition: width 0.5s ease-in-out;"></div>
                            </div>
                        </div>
                    </div>

                    <div id="carouselTutorial" class="carousel slide carousel-fade w-100 flex-grow-1" data-bs-ride="false" data-bs-wrap="false" style="overflow: hidden;">
                        <div class="carousel-inner h-100 d-flex align-items-center" id="carouselTutorialInner">
                        </div>
                        <button class="carousel-control-prev" type="button" data-bs-target="#carouselTutorial" data-bs-slide="prev" style="width: 5%; z-index: 20;">
                            <span class="carousel-control-prev-icon bg-dark rounded-circle p-2 shadow" aria-hidden="true"></span>
                            <span class="visually-hidden">Anterior</span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#carouselTutorial" data-bs-slide="next" style="width: 5%; z-index: 20;">
                            <span class="carousel-control-next-icon bg-dark rounded-circle p-2 shadow" aria-hidden="true"></span>
                            <span class="visually-hidden">Próximo</span>
                        </button>
                    </div>

                </div>
                <div class="modal-footer border-0 bg-light justify-content-between">
                    <button type="button" class="btn btn-outline-secondary fw-bold" data-bs-toggle="modal" data-bs-target="#modalTutorialList">Voltar à Lista</button>
                    <button type="button" class="btn btn-dark fw-bold px-4" data-bs-dismiss="modal">Entendi</button>
                </div>
            </div>
        </div>
    </div>

    ${usuarios.filter(u => u.tipo === 'vendedor').map(u => {
        const clientesU = todosClientes.filter(c => c.vendedor_id === u.id);
        const kpiSem = clientesU.filter(c => c.prospeccao === 'sem_visita').length;
        const kpiCom = clientesU.filter(c => c.prospeccao === 'com_visita').length;
        const kpiNovos = clientesU.filter(c => c.fechou === 'sim').length;
        
        const valorMinGrande = u.valor_cliente_grande > 0 ? u.valor_cliente_grande : (u.setor === 'ecommerce' ? 5000 : 15000);
        const kpiGrande = clientesU.filter(c => c.fechou === 'sim' && (c.valor_venda >= valorMinGrande || c.cliente_grande === 'sim')).length;
        
        const kpiPos = clientesU.filter(c => c.pos_venda === 'sim').length;
        const kpiVisita = clientesU.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita').length;
        const kpiReativ = clientesU.filter(c => c.parado === 'sim' && c.fechou === 'sim').length;
        const kpiOutrasRegioes = clientesU.filter(c => c.regiao && c.regiao.trim() !== '' && c.regiao.trim().toLowerCase() !== 'camaçari' && c.regiao.trim().toLowerCase() !== 'camacari' && c.fechou === 'sim').length;
        
        const kpiCarteira = clientesU.filter(c => c.carteira === 'sim').length;
        const kpiFidel = clientesU.filter(c => c.carteira === 'sim' && c.comprou_recorrente === 'sim').length;
        const taxaInd = kpiCarteira > 0 ? (kpiFidel / kpiCarteira) * 100 : 0;

        // Fallbacks caso não exista meta individual (uso os valores padrão iniciais de metas do setor)
        const defMeta = u.setor === 'ecommerce' 
            ? { sem: 8, com: 8, novos: 3, grande: 3, pos: 3, visita: 4, reativ: 1, outras: 1, taxa: 0 }
            : { sem: 1, com: 4, novos: 1, grande: 1, pos: 1, visita: 2, reativ: 1, outras: 0, taxa: 40 };

        const m_sem = u.qtd_prosp_sem_visita > 0 ? u.qtd_prosp_sem_visita : defMeta.sem;
        const m_com = u.qtd_prosp_com_visita > 0 ? u.qtd_prosp_com_visita : defMeta.com;
        const m_novos = u.qtd_clientes_fechar > 0 ? u.qtd_clientes_fechar : defMeta.novos;
        const m_grande = u.qtd_cliente_grande > 0 ? u.qtd_cliente_grande : defMeta.grande;
        const m_pos = u.qtd_pos_venda > 0 ? u.qtd_pos_venda : defMeta.pos;
        const m_visita = u.qtd_visitas_carteira > 0 ? u.qtd_visitas_carteira : defMeta.visita;
        const m_reativ = u.qtd_reativacoes > 0 ? u.qtd_reativacoes : defMeta.reativ;
        const m_outras = u.qtd_vendas_outras_regioes > 0 ? u.qtd_vendas_outras_regioes : defMeta.outras;
        const m_taxa = u.taxa_retencao > 0 ? u.taxa_retencao : defMeta.taxa;

        const vAlcancadoGlobal = Number(alcancadoGlobal) || 0; 
        const vMetaGlobal = Number(metaGlobal) || 0;
        const globalHit = (vMetaGlobal > 0 && vAlcancadoGlobal >= vMetaGlobal);

        const achievementCard = (titulo, atual, meta, pontos, icone, type = 'number') => {
            let hit = false;
            let progresso = '';
            if (type === 'global') {
                hit = globalHit;
                progresso = hit ? 'Meta Batida!' : 'Aguardando Equipe';
            } else if (type === 'percent') {
                hit = atual >= meta && meta > 0;
                progresso = `${atual.toFixed(1)}% / ${meta}%`;
            } else {
                hit = atual >= meta && meta > 0;
                progresso = `${atual} / ${meta}`;
            }

            const bgClass = hit ? 'bg-success-subtle border-success' : 'bg-light border-secondary-subtle';
            const textClass = hit ? 'text-success' : 'text-muted';
            const iconColor = hit ? 'text-success' : 'text-secondary';
            const pointBadge = hit ? `<span class="badge bg-success shadow-sm">+${pontos} pts</span>` : `<span class="badge bg-secondary shadow-sm opacity-50">+${pontos} pts</span>`;
            const checkIcon = hit ? '<i class="fa-solid fa-circle-check ms-1 text-success"></i>' : '';

            return `
                <div class="col-md-6 mb-3 animate-up">
                    <div class="card h-100 border ${bgClass} shadow-sm" style="transition: 0.3s;">
                        <div class="card-body p-3 d-flex align-items-center">
                            <div class="rounded-circle bg-white d-flex align-items-center justify-content-center border shadow-sm me-3" style="width: 45px; height: 45px; flex-shrink: 0;">
                                <i class="fa-solid ${icone} ${iconColor} fs-5"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1 fw-bold ${textClass}" style="font-size: 0.8rem;">${titulo} ${checkIcon}</h6>
                                <div class="small ${hit ? 'text-dark fw-medium' : 'text-muted'}" style="font-size: 0.75rem;">${progresso}</div>
                            </div>
                            <div class="ms-2">
                                ${pointBadge}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        };

        return `
            <div class="modal fade" id="modalPontosUsuario${u.id}" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content border-0 shadow-lg animate-modal">
                        <div class="modal-header bg-dark text-white border-0 d-flex align-items-center">
                            <img src="${u.foto || 'https://via.placeholder.com/40'}" width="40" height="40" class="rounded-circle border border-2 border-warning me-3 shadow-sm" style="object-fit: cover;">
                            <div>
                                <h5 class="modal-title fw-bold mb-0"><i class="fa-solid fa-trophy text-warning me-2"></i> Conquistas de ${u.nome}</h5>
                                <span class="badge bg-warning text-dark mt-1"><i class="fa-solid fa-star text-dark me-1"></i> <span class="counter-animate" data-val="${u.pontuacao}">0</span> Pontos Totais</span>
                            </div>
                            <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4 bg-light-subtle row">
                            <h6 class="fw-bold text-muted mb-3 text-uppercase" style="font-size: 0.8rem; letter-spacing: 1px;">Metas Alcançadas</h6>
                            ${achievementCard('Meta Global Equipe', 0, 0, 30, 'fa-earth-americas', 'global')}
                            ${achievementCard('Prosp. Sem Visita', kpiSem, m_sem, 10, 'fa-phone')}
                            ${achievementCard('Prosp. Com Visita', kpiCom, m_com, 30, 'fa-handshake')}
                            ${achievementCard('Novos Clientes', kpiNovos, m_novos, 30, 'fa-user-check')}
                            ${achievementCard('Cliente Grande', kpiGrande, m_grande, 20, 'fa-gem')}
                            ${achievementCard('Pós-Venda', kpiPos, m_pos, 20, 'fa-headset')}
                            ${achievementCard('Visitas Carteira', kpiVisita, m_visita, 20, 'fa-car')}
                            ${achievementCard('Reativações', kpiReativ, m_reativ, 20, 'fa-rotate-right')}
                            ${u.setor === 'ecommerce' 
                                ? achievementCard('Vendas Outras Regiões', kpiOutrasRegioes, m_outras, 20, 'fa-map-location-dot')
                                : achievementCard('Taxa de Retenção', taxaInd, m_taxa, 20, 'fa-chart-pie', 'percent')
                            }
                        </div>
                        <div class="modal-footer border-0 bg-light">
                            <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('')}

    <script>
    document.addEventListener("DOMContentLoaded", function() {
        
        // Aplica Máscara de Telefone ao digitar
        const aplicarMascaraTelefone = (input) => {
            let valor = input.value.replace(/\\D/g, '');
            if (valor.length > 11) valor = valor.slice(0, 11);
            if (valor.length > 10) {
                valor = valor.replace(/^(\\d{2})(\\d{5})(\\d{4}).*/, '($1) $2-$3');
            } else if (valor.length > 5) {
                valor = valor.replace(/^(\\d{2})(\\d{4})(\\d{0,4}).*/, '($1) $2-$3');
            } else if (valor.length > 2) {
                valor = valor.replace(/^(\\d{2})(\\d{0,5})/, '($1) $2');
            } else if (valor.length > 0) {
                valor = valor.replace(/^(\\d{0,2})/, '($1');
            }
            if (valor === '(') valor = '';
            input.value = valor;
        };

        document.querySelectorAll('.mascara-telefone').forEach(input => {
            input.addEventListener('input', (e) => aplicarMascaraTelefone(e.target));
            aplicarMascaraTelefone(input); // Aplica formatação inicial caso já venha com dado do BD
        });

        const inputTexto = document.getElementById('filtroTexto');
        const selectPos = document.getElementById('filtroPosVenda');
        const selectRec = document.getElementById('filtroRecorrencia');
        const containerPaginacao = document.getElementById('paginacaoContainer');
        const linhaVazia = document.getElementById('linhaVazia');
        
        const todasLinhas = Array.from(document.querySelectorAll('.cliente-row'));
        
        const itensPorPagina = 12;
        let paginaAtual = 1;
        let linhasAtuais = [...todasLinhas];

        function aplicarFiltros() {
            const termo = inputTexto.value.toLowerCase();
            const pos = selectPos.value;
            const rec = selectRec.value;

            linhasAtuais = todasLinhas.filter(linha => {
                const textoNome = linha.getAttribute('data-nome');
                const vPos = linha.getAttribute('data-pos');
                const vRec = linha.getAttribute('data-rec');

                const passaTexto = textoNome.includes(termo);
                const passaPos = pos === '' || pos === vPos;
                const passaRec = rec === '' || rec === vRec;

                return passaTexto && passaPos && passaRec;
            });

            paginaAtual = 1; 
            renderizarTabela();
        }

        function renderizarTabela() {
            todasLinhas.forEach(l => l.style.display = 'none');

            if (linhasAtuais.length === 0) {
                linhaVazia.style.display = '';
                containerPaginacao.innerHTML = '';
                return;
            } else {
                linhaVazia.style.display = 'none';
            }

            const totalPaginas = Math.ceil(linhasAtuais.length / itensPorPagina);
            const inicio = (paginaAtual - 1) * itensPorPagina;
            const fim = inicio + itensPorPagina;

            linhasAtuais.slice(inicio, fim).forEach(l => l.style.display = '');

            renderizarPaginacao(totalPaginas);
        }

        function renderizarPaginacao(totalPaginas) {
            containerPaginacao.innerHTML = '';
            if (totalPaginas <= 1) return;

            const ul = document.createElement('ul');
            ul.className = 'pagination pagination-sm shadow-sm mb-0';

            ul.appendChild(criarBotaoPagina('<', paginaAtual - 1, paginaAtual === 1));

            if (totalPaginas <= 5) {
                for (let i = 1; i <= totalPaginas; i++) {
                    ul.appendChild(criarBotaoPagina(i, i, false, i === paginaAtual));
                }
            } else {
                ul.appendChild(criarBotaoPagina(1, 1, false, 1 === paginaAtual));
                if (paginaAtual > 3) ul.appendChild(criarDots());

                const inicio = Math.max(2, paginaAtual - 1);
                const fim = Math.min(totalPaginas - 1, paginaAtual + 1);

                for (let i = inicio; i <= fim; i++) {
                    ul.appendChild(criarBotaoPagina(i, i, false, i === paginaAtual));
                }

                if (paginaAtual < totalPaginas - 2) ul.appendChild(criarDots());
                ul.appendChild(criarBotaoPagina(totalPaginas, totalPaginas, false, totalPaginas === paginaAtual));
            }

            ul.appendChild(criarBotaoPagina('>', paginaAtual + 1, paginaAtual === totalPaginas));
            containerPaginacao.appendChild(ul);
        }

        function criarBotaoPagina(texto, alvo, disabled = false, active = false) {
            const li = document.createElement('li');
            li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
            
            const a = document.createElement('a');
            a.className = 'page-link fw-bold text-dark';
            a.style.cursor = disabled ? 'default' : 'pointer';
            if(active) {
                a.classList.remove('text-dark');
                a.classList.add('bg-primary', 'text-white', 'border-primary');
            }
            a.innerHTML = texto;
            
            if (!disabled && !active) {
                a.onclick = function(e) {
                    e.preventDefault();
                    paginaAtual = alvo;
                    renderizarTabela();
                };
            }
            li.appendChild(a);
            return li;
        }

        function criarDots() {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = '<a class="page-link border-0 bg-transparent text-muted fw-bold">...</a>';
            return li;
        }

        if (inputTexto) inputTexto.addEventListener('input', aplicarFiltros);
        if (selectPos) selectPos.addEventListener('change', aplicarFiltros);
        if (selectRec) selectRec.addEventListener('change', aplicarFiltros);

        if(inputTexto && selectPos && selectRec) aplicarFiltros();

        // Listener para atualizar a barra de progresso do tutorial ao deslizar os slides
        const carouselTutorial = document.getElementById('carouselTutorial');
        if (carouselTutorial) {
            carouselTutorial.addEventListener('slide.bs.carousel', function (e) {
                if (window.currentTutorialSlides && window.currentTutorialSlides.length > 0) {
                    const total = window.currentTutorialSlides.length;
                    const current = e.to + 1;
                    document.getElementById('tutorialStepText').innerText = 'Passo ' + current;
                    document.getElementById('tutorialProgressBar').style.width = ((current / total) * 100) + '%';
                }
            });
        }
    });

    window.abrirTutorial = async function(id, titulo) {
        document.getElementById('tituloTutorialVer').innerHTML = '<i class="fa-solid fa-graduation-cap me-2 text-primary"></i> ' + titulo;
        var inner = document.getElementById('carouselTutorialInner');
        var progressWrapper = document.getElementById('tutorialProgressWrapper');
        
        // Esconde e reseta a barra global para carregar limpo
        progressWrapper.style.setProperty('display', 'none', 'important');
        document.getElementById('tutorialProgressBar').style.width = '0%';
        
        inner.innerHTML = '<div class="text-center w-100 p-5"><i class="fa-solid fa-spinner fa-spin fa-3x text-primary"></i></div>';
        
        new bootstrap.Modal(document.getElementById('modalVerTutorial')).show();

        try {
            var res = await fetch('/admin/tutorial/' + id + '/slides');
            var slides = await res.json();
            window.currentTutorialSlides = slides; // Salvar para a animação
            
            if(slides.length === 0) {
                inner.innerHTML = '<div class="p-5 text-muted w-100">Este tutorial não possui slides.</div>';
                return;
            }

            // Exibe a barra de progresso global
            document.getElementById('tutorialStepText').innerText = 'Passo 1';
            document.getElementById('tutorialTotalText').innerText = 'Total: ' + slides.length;
            progressWrapper.style.setProperty('display', 'flex', 'important');
            
            setTimeout(() => {
                document.getElementById('tutorialProgressBar').style.width = ((1 / slides.length) * 100) + '%';
            }, 100);

            var html = '';
            slides.forEach(function(s, i) {
                var active = i === 0 ? 'active' : '';
                
                html += '<div class="carousel-item w-100 h-100 ' + active + '">' +
                            '<div class="p-4 d-flex flex-column align-items-center justify-content-center w-100 h-100">' +
                                '<div class="row w-100 align-items-center justify-content-center m-0" style="max-width: 95%;">' +
                                    
                                    '' +
                                    '<div class="col-12 col-lg-7 text-center mb-4 mb-lg-0 px-2">' +
                                        '<img src="' + s.imagem_url + '" class="img-fluid rounded shadow-sm border border-secondary-subtle" style="max-height: 55vh; object-fit: contain;">' +
                                    '</div>' +
                                    
                                    '' +
                                    '<div class="col-12 col-lg-5 px-3">' +
                                        '<div class="bg-dark p-4 rounded border border-secondary-subtle custom-scrollbar" style="max-height: 55vh; overflow-y: auto; text-align: left; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">' +
                                            '<h6 class="text-primary fw-bold mb-3 border-bottom border-secondary pb-2"><i class="fa-solid fa-circle-info me-2"></i>Instruções</h6>' +
                                            '<p class="text-light mb-0" style="font-size: 1rem; white-space: pre-wrap; line-height: 1.6;">' + s.texto + '</p>' +
                                        '</div>' +
                                    '</div>' +

                                '</div>' +
                            '</div>' +
                        '</div>';
            });
            inner.innerHTML = html;
        } catch(e) {
            inner.innerHTML = '<div class="p-5 text-danger w-100">Erro ao carregar tutorial.</div>';
        }
    };

    // ANIMAÇÕES DE NÚMEROS E PROGRESSO (Acontece no onLoad)
    setTimeout(function() {
        const progressBar = document.querySelector('.progress-bar-animate');
        const progressText = document.querySelector('.progress-text-animate');
        if (progressBar && progressText) {
            const targetWidth = parseFloat(progressBar.getAttribute('data-width')) || 0;
            progressBar.style.width = targetWidth + '%';
            progressBar.style.transition = 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)';
            
            let startTimestamp = null;
            const duration = 1500;
            const step = function(timestamp) {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 4);
                const currentVal = (easeProgress * targetWidth).toFixed(1);
                progressText.innerText = currentVal + '%';
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    progressText.innerText = targetWidth.toFixed(1) + '%';
                }
            };
            window.requestAnimationFrame(step);
        }

        const counters = document.querySelectorAll('.counter-animate');
        counters.forEach(function(counter) {
            const target = parseFloat(counter.getAttribute('data-val')) || 0;
            const isCurrency = counter.getAttribute('data-currency') === 'true';
            const isPercent = counter.getAttribute('data-percent') === 'true';
            const duration = 1500;
            let startTimestamp = null;

            const formatVal = function(val) {
                if (isCurrency) return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                if (isPercent) return val.toFixed(1) + '%';
                return Math.floor(val);
            };

            counter.innerText = formatVal(0);

            const step = function(timestamp) {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 4);
                const currentVal = easeProgress * target;
                
                counter.innerText = formatVal(currentVal);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    counter.innerText = formatVal(target);
                }
            };
            window.requestAnimationFrame(step);
        });
    }, 100);
    </script>
`);
};