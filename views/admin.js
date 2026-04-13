const layout = require('./layout');

// NOVA FUNÇÃO: Formata nativamente para o padrão R$ 0.000,00
const formatarBRL = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
};

const kpiCard = (titulo, alcancado, meta, icone, formatarMoeda = false, modalId = '', formatarPercentual = false) => {
    const numAlcancado = Number(alcancado) || 0;
    const numMeta = Number(meta) || 0;
    
    // Cor dinâmica: verde se bater a meta, caso contrário azul
    const cor = (numAlcancado >= numMeta && numMeta > 0) ? 'success' : 'primary';

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
            <div class="card shadow-sm border-start border-${cor} border-4 h-100 kpi-card"
                 ${modalId ? `data-bs-toggle="modal" data-bs-target="#${modalId}"` : ''} style="${modalId ? 'cursor: pointer;' : ''}">
                <div class="card-body py-2 px-3 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="text-muted mb-0" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px;">${titulo}</h6>
                        <span class="mb-0 fw-bold text-${cor}" style="font-size: 1.1rem;">${textoAlcancado} <span class="text-muted fw-normal" style="font-size: 0.85rem;">/ ${textoMeta}</span></span>
                    </div>
                    <div class="bg-light text-${cor} rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                        <i class="fa-solid ${icone}" style="font-size: 1.1rem;"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const modalListaClientes = (id, titulo, clientesFiltrados) => `
    <div class="modal fade" id="${id}" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header bg-light">
                    <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-list me-2"></i> ${titulo}</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-0">
                    <table class="table table-sm table-hover align-middle mb-0" style="font-size: 0.85rem;">
                        <thead class="bg-white" style="position: sticky; top: 0; z-index: 1;">
                            <tr>
                                <th class="ps-3 py-2">Cliente</th>
                                <th class="py-2">Vendedor</th>
                                <th class="py-2">Valor</th>
                                <th class="py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientesFiltrados && clientesFiltrados.length > 0 ? clientesFiltrados.map(c => `
                                <tr>
                                    <td class="ps-3 py-2 fw-medium text-dark">${c.nome}</td>
                                    <td class="py-2 text-muted">${c.vendedor_nome}</td>
                                    <td class="py-2 text-success">${formatarBRL(c.valor_venda)}</td>
                                    <td class="py-2">${c.fechou === 'sim' ? '<span class="badge bg-success" style="font-size: 0.65rem;">Fechou</span>' : '<span class="badge bg-secondary" style="font-size: 0.65rem;">Pendente</span>'}</td>
                                </tr>
                            `).join('') : `<tr><td colspan="4" class="text-center text-muted py-4">Nenhum cliente compõe este indicador.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
`;

module.exports = (usuarioLogado, usuarios, metas, kpis, metaGlobal, alcancadoGlobal, todosClientes = [], dadosMeta = {}) => {

    const ecoClientes = todosClientes.filter(c => c.setor === 'ecommerce');
    const indClientes = todosClientes.filter(c => c.setor === 'industria');
    
    // INTEGRAÇÃO DO FATURAMENTO MANUAL NOS KPIS E METAS
    const somaManualTotal = usuarios.reduce((acc, u) => acc + Number(u.faturamento_manual || 0), 0);
    
    const somaManualEco = usuarios.filter(u => u.setor === 'ecommerce').reduce((acc, u) => acc + Number(u.faturamento_manual || 0), 0);
    const metaEcoReal = Number(kpis.ecommerce?.valor_total_vendas || 0) + somaManualEco;
    
    const somaManualInd = usuarios.filter(u => u.setor === 'industria').reduce((acc, u) => acc + Number(u.faturamento_manual || 0), 0);
    const metaIndReal = Number(kpis.industria?.valor_total_vendas || 0) + somaManualInd;

    // CORREÇÃO DOS INDICADORES E MODAIS
    const ecoNovosClientes = ecoClientes.filter(c => c.fechou === 'sim').length;
    const ecoVisitasCarteira = ecoClientes.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita').length;

    const indNovosClientes = indClientes.filter(c => c.fechou === 'sim').length;
    const indVisitasCarteira = indClientes.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita').length;

    // Cálculo para o KPI da Indústria (Fidelização)
    const totalCarteiraInd = kpis.industria?.total_carteira || 0;
    const fidelizadosInd = kpis.industria?.total_fidelizados || 0;
    const taxaAlcancadaInd = totalCarteiraInd > 0 ? (fidelizadosInd / totalCarteiraInd) * 100 : 0;

    return layout(`

        <style>
            .container-70 { width: 85vw; max-width: 1600px; margin: 0 auto; }
            @media (max-width: 768px) { .container-70 { width: 92vw; } }
            @media (max-width: 576px) { .container-70 { width: 96vw; } }
        </style>

        <div class="container-70" style="padding-top: 1rem;">

            <header class="d-flex justify-content-between align-items-center bg-white p-2 shadow-sm rounded border mb-3">
                    <div class="d-flex align-items-center ms-2">
                        <img src="${usuarioLogado.foto || 'https://via.placeholder.com/60'}" width="90" height="90" class="rounded-circle border me-3 shadow-sm" style="object-fit: cover;">
                    <div>
                        <h6 class="mb-0 fw-bold text-dark" style="font-size: 1.1rem;">${usuarioLogado.nome}</h6>
                        <span class="text-muted" style="font-size: 0.85rem;"><i class="fa-solid fa-shield-halved me-1 text-primary"></i> Administrador Principal</span>
                    </div>
                </div>
            
                <div class="d-flex align-items-center gap-2 me-2">
                    <button class="btn btn-sm btn-outline-primary py-1 px-2" style="font-size: 0.72rem;" data-bs-toggle="modal" data-bs-target="#modalUsuario"><i class="fa-solid fa-user-plus me-1"></i> Novo</button>
                    <button class="btn btn-sm btn-outline-success py-1 px-2" style="font-size: 0.72rem;" data-bs-toggle="modal" data-bs-target="#modalMetasEco"><i class="fa-solid fa-cart-shopping me-1"></i> Metas Eco</button>
                    <button class="btn btn-sm btn-outline-warning py-1 px-2" style="font-size: 0.72rem;" data-bs-toggle="modal" data-bs-target="#modalMetasInd"><i class="fa-solid fa-industry me-1"></i> Metas Ind</button>
                    <button class="btn btn-sm btn-outline-dark py-1 px-2" style="font-size: 0.72rem;" data-bs-toggle="modal" data-bs-target="#modalMetaGlobal"><i class="fa-solid fa-globe me-1"></i> Global</button>
                    <button class="btn btn-sm btn-outline-info py-1 px-2 text-dark" style="font-size: 0.72rem;" data-bs-toggle="modal" data-bs-target="#modalGerenciarUsuarios"><i class="fa-solid fa-users-gear me-1"></i> Equipe</button>
                    <div class="vr mx-1"></div>
                    <a href="/admin/arquivados" class="btn btn-sm btn-outline-secondary py-1 px-2 fw-bold" style="font-size: 0.72rem;" title="Ver Histórico Arquivado"><i class="fa-solid fa-box-archive me-1"></i> Arquivados</a>
                    <button class="btn btn-sm py-1 px-2 fw-bold text-white border-0" style="font-size: 0.72rem; background-color: #343a40;" data-bs-toggle="modal" data-bs-target="#modalZerarCiclo">
                        <i class="fa-solid fa-circle-check me-1"></i> Fechar meta
                    </button>
                    <a href="/admin/exportar" class="btn btn-sm btn-success py-1 px-3 fw-bold shadow-sm" style="font-size: 0.72rem;" title="Relatório"><i class="fa-solid fa-file-excel me-1"></i>Relatório</a>
                    <a href="/logout" class="btn btn-sm btn-danger py-1 px-2" style="font-size: 0.72rem;" title="Sair"><i class="fa-solid fa-arrow-right-from-bracket"></i></a>
                </div>
            </header>

            <div class="row mb-4 align-items-stretch">
                
                ${(() => {
                    const vAlcancado = (Number(alcancadoGlobal) || 0) + somaManualTotal;
                    const vMeta = Number(metaGlobal) || 0;
                    const corGlobal = (vAlcancado >= vMeta && vMeta > 0) ? 'success' : 'primary';
                    const porcentagem = vMeta > 0 ? Math.min((vAlcancado / vMeta) * 100, 100) : 0;
                    
                    const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });
                    const mesNome = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

                    return `
                    <div class="col-lg-4 col-md-12 mb-3 mb-lg-0 d-flex animate-up" style="animation-delay: 0.1s;">
                        <div class="card shadow-sm border-${corGlobal} border-2 rounded-3 w-100 border-top-0 border-end-0 border-bottom-0 position-relative">
                            
                            <span class="position-absolute top-0 end-0 badge bg-${corGlobal} mt-2 me-2 text-uppercase shadow-sm" style="font-size: 0.6rem; letter-spacing: 0.5px;">${mesNome}</span>
                            
                            <div class="card-body text-center bg-white d-flex flex-column justify-content-center py-4">
                                <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.85rem;"><i class="fa-solid fa-earth-americas text-${corGlobal} me-2"></i> Meta Geral da Empresa</h6>
                                
                                <div class="progress mb-3" style="height: 18px; border-radius: 20px; border: 1px solid #e0e0e0; overflow: hidden;">
                                    <div class="progress-bar bg-${corGlobal} progress-bar-striped progress-bar-animated" 
                                         role="progressbar" 
                                         style="width: ${porcentagem}%; font-size: 0.75rem; font-weight: bold;">
                                         ${porcentagem.toFixed(1)}%
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center mt-2 px-2">
                                    <div class="text-start">
                                        <span class="d-block text-muted text-uppercase" style="font-size: 0.65rem;">Alcançado</span>
                                        <strong class="text-${corGlobal}" style="font-size: 1rem;">${formatarBRL(vAlcancado)}</strong>
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
                            <span class="fw-bold" style="font-size: 0.9rem;"><i class="fa-solid fa-trophy text-warning me-2"></i> Rank de Performance</span>
                        </div>
                        <div class="card-body p-0 overflow-auto" style="max-height: 180px;">
                            <table class="table table-hover align-middle mb-0">
                                <thead class="bg-light" style="font-size: 0.75rem;">
                                    <tr><th class="ps-3 py-2 text-muted">Vendedor</th><th class="text-end pe-3 py-2 text-muted">Pontos</th></tr>
                                </thead>
                                <tbody>
                                    ${[...usuarios].filter(u => u.tipo === 'vendedor').sort((a, b) => b.pontuacao - a.pontuacao).map((u, index) => `
                                        <tr>
                                            <td class="ps-3 py-2">
                                                <div class="d-flex align-items-center">
                                                    <div class="position-relative me-2">
                                                        <img src="${u.foto || 'https://via.placeholder.com/40'}" width="32" height="32" class="rounded-circle border shadow-sm" style="object-fit: cover;">
                                                        ${index === 0 ? '<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark" style="font-size: 0.55rem;"><i class="fa-solid fa-crown"></i></span>' : ''}
                                                    </div>
                                                    <div class="d-flex flex-column">
                                                        <span class="fw-bold text-dark" style="font-size: 0.85rem;">${u.nome}</span>
                                                        <span class="text-muted" style="font-size: 0.65rem; text-transform: uppercase;">${u.setor}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="text-end pe-3 py-2"><strong class="text-success"><i class="fa-solid fa-star text-warning small me-1"></i> ${u.pontuacao}</strong></td>
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
                            <span class="fw-bold" style="font-size: 0.9rem;"><i class="fa-solid fa-sack-dollar text-success me-2"></i> Rank de Vendas (R$)</span>
                        </div>
                        <div class="card-body p-0 overflow-auto" style="max-height: 180px;">
                            <table class="table table-hover align-middle mb-0">
                                <thead class="bg-light" style="font-size: 0.75rem;">
                                    <tr><th class="ps-3 py-2 text-muted">Vendedor</th><th class="text-end pe-3 py-2 text-muted">Faturamento</th></tr>
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
                                            <tr style="cursor: pointer; transition: 0.2s;" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')" data-bs-toggle="modal" data-bs-target="#modalFaturamentoManual${u.id}" title="Ajustar Faturamento Manualmente">
                                                <td class="ps-3 py-2">
                                                    <div class="d-flex align-items-center">
                                                        <img src="${u.foto || 'https://via.placeholder.com/40'}" width="32" height="32" class="rounded-circle border me-2 shadow-sm" style="object-fit: cover;">
                                                        <span class="fw-bold text-dark" style="font-size: 0.85rem;">${u.nome}</span>
                                                    </div>
                                                </td>
                                                <td class="text-end pe-3 py-2">
                                                    <strong class="text-success" style="font-size: 0.9rem;">${formatarBRL(u.totalVendido)} <i class="fa-solid fa-pen-to-square text-muted ms-1" style="font-size: 0.75rem;"></i></strong>
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

            <div class="card shadow-sm rounded-3 border mb-3 animate-up" style="animation-delay: 0.4s;">
                <div class="card-header bg-white text-primary fw-bold py-3 border-0" style="font-size: 0.95rem;">
                    <i class="fa-solid fa-chart-line me-2"></i> Métricas: E-Commerce
                </div>
                <div class="card-body pb-0 bg-light px-2 pt-3">
                    <div class="row mx-0">
                        ${kpiCard('Prosp. Sem Visita', kpis.ecommerce?.prosp_sem_visita, metas.ecommerce?.qtd_prosp_sem_visita, 'fa-phone', false, 'modalEco_sem_visita')}
                        ${kpiCard('Prosp. Com Visita', kpis.ecommerce?.prosp_com_visita, metas.ecommerce?.qtd_prosp_com_visita, 'fa-handshake', false, 'modalEco_com_visita')}
                        ${kpiCard('Novos Clientes', ecoNovosClientes, metas.ecommerce?.qtd_clientes_fechar, 'fa-user-check', false, 'modalEco_fechar')}
                        ${kpiCard('QTD Cliente Grande', kpis.ecommerce?.qtd_cliente_grande, metas.ecommerce?.qtd_cliente_grande, 'fa-gem', false, 'modalEco_grande')}
                        ${kpiCard('Meta E-commerce', metaEcoReal, metas.ecommerce?.meta_geral, 'fa-sack-dollar', true, 'modalEco_vendas')}
                        ${kpiCard('Pós-Venda Feito', kpis.ecommerce?.pos_venda, metas.ecommerce?.qtd_pos_venda, 'fa-headset', false, 'modalEco_pos_venda')}
                        ${kpiCard('Visitas Carteira', ecoVisitasCarteira, metas.ecommerce?.qtd_visitas_carteira, 'fa-car', false, 'modalEco_visita')}
                        ${kpiCard('Reativações', kpis.ecommerce?.reativacoes, metas.ecommerce?.qtd_reativacoes, 'fa-rotate-right', false, 'modalEco_reativacao')}
                    </div>
                </div>
            </div>

            <div class="card shadow-sm rounded-3 border mb-4 animate-up" style="animation-delay: 0.4s;">
                <div class="card-header bg-white text-warning fw-bold py-3 border-0" style="font-size: 0.95rem;">
                    <i class="fa-solid fa-building text-warning me-2"></i> Métricas: Indústria
                </div>
                <div class="card-body pb-0 bg-light px-2 pt-3">
                    <div class="row mx-0">
                        ${kpiCard('Prosp. Sem Visita', kpis.industria?.prosp_sem_visita, metas.industria?.qtd_prosp_sem_visita, 'fa-phone', false, 'modalInd_sem_visita')}
                        ${kpiCard('Prosp. Com Visita', kpis.industria?.prosp_com_visita, metas.industria?.qtd_prosp_com_visita, 'fa-handshake', false, 'modalInd_com_visita')}
                        ${kpiCard('Novos Clientes', indNovosClientes, metas.industria?.qtd_clientes_fechar, 'fa-user-check', false, 'modalInd_fechar')}
                        ${kpiCard('QTD Cliente Grande', kpis.industria?.qtd_cliente_grande, metas.industria?.qtd_cliente_grande, 'fa-gem', false, 'modalInd_grande')}
                        ${kpiCard('Meta Indústria', metaIndReal, metas.industria?.meta_geral, 'fa-sack-dollar', true, 'modalInd_vendas')}
                        ${kpiCard('Pós-Venda Feito', kpis.industria?.pos_venda, metas.industria?.qtd_pos_venda, 'fa-headset', false, 'modalInd_pos_venda')}
                        ${kpiCard('Visitas Carteira', indVisitasCarteira, metas.industria?.qtd_visitas_carteira, 'fa-car', false, 'modalInd_visita')}
                        ${kpiCard('Reativações', kpis.industria?.reativacoes, metas.industria?.qtd_reativacoes, 'fa-rotate-right', false, 'modalInd_reativacao')}
                        ${kpiCard('Taxa Retenção', taxaAlcancadaInd, metas.industria?.taxa_retencao || 40, 'fa-chart-pie', false, 'modalInd_retencao', true)}
                    </div>
                </div>
            </div>

            <div class="card shadow-sm rounded-3 border mb-5 animate-up" style="animation-delay: 0.5s;">
                <div class="card-header bg-white py-3 border-0 d-flex flex-column gap-3">
                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div class="d-flex align-items-center w-100">
                            <i class="fa-solid fa-users text-info me-2"></i> <span class="fw-bold" style="font-size: 0.95rem;">Visão Geral: Todos os Clientes</span>
                        </div>
                    </div>

                    <div class="bg-light p-2 rounded border border-light-subtle shadow-sm">
                        <form action="/admin/exportar-clientes" method="GET" class="row g-2 align-items-center m-0 flex-nowrap">
                            <div class="col-auto d-flex align-items-center">
                                <span class="small fw-bold text-muted mb-0"><i class="fa-solid fa-download text-success me-1"></i> Exportar Dados:</span>
                            </div>
                            <div class="col-auto" style="min-width: 220px;">
                                <select name="vendedor_id" class="form-select form-select-sm border-secondary-subtle" required>
                                    <option value="todos">Todos os Vendedores</option>
                                    ${usuarios.filter(u => u.tipo === 'vendedor').map(u => `<option value="${u.id}">${u.nome}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-auto" style="min-width: 180px;">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text bg-white text-muted border-secondary-subtle">De</span>
                                    <input type="date" name="data_inicio" class="form-control border-secondary-subtle" required>
                                </div>
                            </div>
                            <div class="col-auto" style="min-width: 180px;">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text bg-white text-muted border-secondary-subtle">Até</span>
                                    <input type="date" name="data_fim" class="form-control border-secondary-subtle" required>
                                </div>
                            </div>
                            <div class="col-auto" style="min-width: 220px; max-width: 300px;">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text bg-light border-end-0"><i class="fa-solid fa-search text-muted"></i></span>
                                    <input type="text" id="filtroTextoAdmin" class="form-control border-start-0 ps-0" placeholder="Buscar por cliente ou vendedor...">
                                </div>
                            </div>
                            <div class="col-auto ms-auto">
                                <button type="submit" class="btn btn-sm btn-success fw-bold"><i class="fa-solid fa-file-excel me-1"></i> Baixar Tabela</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div class="card-body p-0 overflow-auto">
                    <div class="table-responsive" style="min-height: 400px;">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-4 py-3 text-muted small uppercase">Cliente & Local</th>
                                    <th class="py-3 text-muted small uppercase">Vendedor</th>
                                    <th class="py-3 text-muted small uppercase">Datas</th>
                                    <th class="py-3 text-muted small uppercase">Status & Valor</th>
                                    <th class="py-3 text-muted small uppercase">Indicadores</th>
                                    <th class="text-end pe-4 py-3 text-muted small uppercase">Obs.</th> 
                                </tr>
                            </thead>
                            <tbody id="tabelaTodosClientesBody">
                                <tr id="linhaVaziaAdmin" style="display: none;">
                                    <td colspan="6" class="text-center text-muted py-5"><i class="fa-solid fa-folder-open fa-2x mb-2 text-light-subtle"></i><br>Nenhum cliente encontrado.</td>
                                </tr>
                                ${todosClientes.map((c, index) => `
                                <tr class="cliente-admin-row" data-busca="${(c.nome + ' ' + (c.vendedor_nome || '') + ' ' + (c.regiao || '')).toLowerCase()}">
                                    <td class="ps-4 fw-bold text-dark">
                                        ${c.nome}<br><span class="text-muted fw-normal" style="font-size: 0.75rem;"><i class="fa-solid fa-location-dot text-danger me-1"></i> ${c.regiao || 'Não informado'}</span>
                                    </td>
                                    <td><span class="badge bg-light text-dark border"><i class="fa-solid fa-user text-muted me-1"></i> ${c.vendedor_nome || 'Desconhecido'}</span></td>
                                    <td>
                                        <div class="text-muted mb-1" style="font-size: 0.75rem;"><i class="fa-regular fa-calendar-plus text-primary me-1"></i> Prosp: <strong>${formatarData(c.data_prospeccao || c.data_criacao)}</strong></div>
                                        <div class="text-muted" style="font-size: 0.75rem;"><i class="fa-regular fa-calendar-check text-success me-1"></i> Fech: <strong>${formatarData(c.data_fechamento)}</strong></div>
                                    </td>
                                    <td>
                                        ${c.fechou === 'sim' ? '<span class="badge bg-success-subtle text-success border border-success-subtle mb-1 d-inline-block">Fechado</span>' : '<span class="badge bg-light text-muted border mb-1 d-inline-block">Pendente</span>'}<br>
                                        <span class="fw-medium text-dark" style="font-size: 0.9rem;">${formatarBRL(c.valor_venda)}</span>
                                    </td>
                                    <td>
                                        <div class="d-flex flex-column gap-1" style="max-width: 110px;">
                                            ${c.prospeccao === 'com_visita' ? '<span class="badge bg-light text-dark border w-100 text-start fw-normal" style="font-size: 0.7rem;"><i class="fa-solid fa-handshake text-primary me-1"></i> Com Visita</span>' : '<span class="badge bg-light text-dark border w-100 text-start fw-normal" style="font-size: 0.7rem;"><i class="fa-solid fa-phone text-secondary me-1"></i> Sem Visita</span>'}
                                            ${c.fechou === 'sim' ? (c.pos_venda === 'sim' ? '<span class="badge bg-success-subtle text-success border border-success-subtle w-100 text-start fw-normal" style="font-size: 0.7rem;"><i class="fa-solid fa-headset me-1"></i> Pós: Sim</span>' : c.pos_venda === 'nao' ? '<span class="badge bg-danger-subtle text-danger border border-danger-subtle w-100 text-start fw-normal" style="font-size: 0.7rem;"><i class="fa-solid fa-headset me-1"></i> Pós: Não</span>' : '<span class="badge bg-warning-subtle text-warning border border-warning-subtle w-100 text-start fw-normal" style="font-size: 0.7rem;"><i class="fa-solid fa-headset me-1"></i> Pós: Pend.</span>') : ''}
                                            ${c.carteira === 'sim' ? (c.comprou_recorrente === 'sim' ? '<span class="badge bg-info-subtle text-info border border-info-subtle w-100 text-start fw-normal" style="font-size: 0.7rem;"><i class="fa-solid fa-cart-shopping me-1"></i> Comprou</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle w-100 text-start fw-normal" style="font-size: 0.7rem;"><i class="fa-solid fa-cart-shopping me-1"></i> Inativo</span>') : ''}
                                        </div>
                                    </td>
                                    <td class="text-end pe-4">
                                        <button class="btn btn-sm btn-outline-info rounded-circle shadow-sm" data-bs-toggle="modal" data-bs-target="#modalObsAdmin${index}" title="Ver Observação"><i class="fa-solid fa-eye"></i></button>
                                    </td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div id="paginacaoAdminContainer" class="d-flex justify-content-center mt-3 mb-3"></div>
                </div>
            </div>
        </div>

    ${modalListaClientes('modalEco_sem_visita', 'E-commerce: Prospecção Sem Visita', ecoClientes.filter(c => c.prospeccao === 'sem_visita'))}
    ${modalListaClientes('modalEco_com_visita', 'E-commerce: Prospecção Com Visita', ecoClientes.filter(c => c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalEco_fechar', 'E-commerce: Novos Clientes', ecoClientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalEco_grande', 'E-commerce: Clientes Grandes (> R$ 5k)', ecoClientes.filter(c => c.fechou === 'sim' && c.valor_venda >= 5000))}
    ${modalListaClientes('modalEco_vendas', 'E-commerce: Vendas Fechadas', ecoClientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalEco_pos_venda', 'E-commerce: Pós-Venda Realizado', ecoClientes.filter(c => c.pos_venda === 'sim'))}
    ${modalListaClientes('modalEco_visita', 'E-commerce: Visita na Carteira Realizada', ecoClientes.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalEco_reativacao', 'E-commerce: Reativações Concluídas', ecoClientes.filter(c => c.parado === 'sim'))}

    ${modalListaClientes('modalInd_sem_visita', 'Indústria: Prospecção Sem Visita', indClientes.filter(c => c.prospeccao === 'sem_visita'))}
    ${modalListaClientes('modalInd_com_visita', 'Indústria: Prospecção Com Visita', indClientes.filter(c => c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalInd_fechar', 'Indústria: Novos Clientes', indClientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalInd_grande', 'Indústria: Clientes Grandes (> R$ 15k)', indClientes.filter(c => c.fechou === 'sim' && c.valor_venda >= 15000))}
    ${modalListaClientes('modalInd_vendas', 'Indústria: Vendas Fechadas', indClientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalInd_pos_venda', 'Indústria: Pós-Venda Realizado', indClientes.filter(c => c.pos_venda === 'sim'))}
    ${modalListaClientes('modalInd_visita', 'Indústria: Visita na Carteira Realizada', indClientes.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalInd_reativacao', 'Indústria: Reativações Concluídas', indClientes.filter(c => c.parado === 'sim'))}
    ${modalListaClientes('modalInd_retencao', 'Indústria: Clientes Fidelizados (Recorrência)', indClientes.filter(c => c.carteira === 'sim' && c.comprou_recorrente === 'sim'))}

    <div class="modal fade" id="modalUsuario" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <form action="/admin/usuario" method="POST" enctype="multipart/form-data">
                    <div class="modal-header"><h5 class="modal-title"><i class="fa-solid fa-user-plus me-2"></i> Novo Usuário</h5></div>
                    <div class="modal-body">
                        <input type="text" name="nome" class="form-control mb-2" placeholder="Nome completo" required>
                        <input type="text" name="token" class="form-control mb-2" placeholder="Token de Acesso" required>
                        <label class="form-label small text-muted mb-0 mt-2">Foto de Perfil</label>
                        <input type="file" name="foto" class="form-control mb-3" accept="image/png, image/jpeg, image/jpg">
                        <select name="tipo" class="form-select mb-2"><option value="vendedor">Vendedor</option><option value="admin">Administrador</option></select>
                        <select name="setor" class="form-select mb-2"><option value="ecommerce">E-commerce</option><option value="industria">Indústria</option><option value="admin">Admin (Geral)</option></select>
                    </div>
                    <div class="modal-footer"><button type="submit" class="btn btn-primary"><i class="fa-solid fa-check me-1"></i> Salvar</button></div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalMetasEco" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <form action="/admin/metas" method="POST">
                    <div class="modal-header bg-primary text-white"><h5 class="modal-title"><i class="fa-solid fa-bullseye me-2"></i> Lançar Metas (E-commerce)</h5></div>
                    <div class="modal-body row">
                        <input type="hidden" name="setor" value="ecommerce">
                        <div class="col-md-6 mb-2">
                            <label class="form-label small text-muted mb-0">Meta E-commerce (R$)</label>
                            <input type="text" name="meta_geral" class="form-control mascara-moeda" value="${metas.ecommerce?.meta_geral || 0}">
                        </div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Prosp sem visita</label><input type="number" name="qtd_prosp_sem_visita" class="form-control" value="${metas.ecommerce?.qtd_prosp_sem_visita || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Prosp com visita</label><input type="number" name="qtd_prosp_com_visita" class="form-control" value="${metas.ecommerce?.qtd_prosp_com_visita || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Novos Clientes</label><input type="number" name="qtd_clientes_fechar" class="form-control" value="${metas.ecommerce?.qtd_clientes_fechar || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Cliente Grande (>5k)</label><input type="number" name="qtd_cliente_grande" class="form-control" value="${metas.ecommerce?.qtd_cliente_grande || 0}"></div>
                        <div class="col-md-6 mb-2">
                            <label class="form-label small text-muted mb-0">Valor Total Cliente Grande (R$)</label>
                            <input type="text" name="valor_cliente_grande" class="form-control mascara-moeda" value="${metas.ecommerce?.valor_cliente_grande || 0}">
                        </div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Pós venda feito</label><input type="number" name="qtd_pos_venda" class="form-control" value="${metas.ecommerce?.qtd_pos_venda || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Visitas carteira</label><input type="number" name="qtd_visitas_carteira" class="form-control" value="${metas.ecommerce?.qtd_visitas_carteira || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Reativações</label><input type="number" name="qtd_reativacoes" class="form-control" value="${metas.ecommerce?.qtd_reativacoes || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">Vendas Outras Regiões</label><input type="number" name="qtd_vendas_outras_regioes" class="form-control" value="${metas.ecommerce?.qtd_vendas_outras_regioes || 0}"></div>
                    </div>
                    <div class="modal-footer"><button type="submit" class="btn btn-success"><i class="fa-solid fa-check me-1"></i> Salvar Metas</button></div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalMetasInd" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <form action="/admin/metas" method="POST">
                    <div class="modal-header bg-warning text-dark"><h5 class="modal-title"><i class="fa-solid fa-bullseye me-2"></i> Lançar Metas (Indústria)</h5></div>
                    <div class="modal-body row">
                        <input type="hidden" name="setor" value="industria">
                        <div class="col-md-6 mb-2">
                            <label class="form-label small text-muted mb-0">Meta Indústria (R$)</label>
                            <input type="text" name="meta_geral" class="form-control mascara-moeda" value="${metas.industria?.meta_geral || 0}">
                        </div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Prosp sem visita</label><input type="number" name="qtd_prosp_sem_visita" class="form-control" value="${metas.industria?.qtd_prosp_sem_visita || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Prosp com visita</label><input type="number" name="qtd_prosp_com_visita" class="form-control" value="${metas.industria?.qtd_prosp_com_visita || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Novos Clientes</label><input type="number" name="qtd_clientes_fechar" class="form-control" value="${metas.industria?.qtd_clientes_fechar || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Cliente Grande (>15k)</label><input type="number" name="qtd_cliente_grande" class="form-control" value="${metas.industria?.qtd_cliente_grande || 0}"></div>
                        <div class="col-md-6 mb-2">
                            <label class="form-label small text-muted mb-0">Valor Total Cliente Grande (R$)</label>
                            <input type="text" name="valor_cliente_grande" class="form-control mascara-moeda" value="${metas.industria?.valor_cliente_grande || 0}">
                        </div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Pós venda feito</label><input type="number" name="qtd_pos_venda" class="form-control" value="${metas.industria?.qtd_pos_venda || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Visitas carteira</label><input type="number" name="qtd_visitas_carteira" class="form-control" value="${metas.industria?.qtd_visitas_carteira || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">QTD Reativações</label><input type="number" name="qtd_reativacoes" class="form-control" value="${metas.industria?.qtd_reativacoes || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted mb-0">Taxa de Retenção (%)</label><input type="number" step="0.01" name="taxa_retencao" class="form-control" value="${metas.industria?.taxa_retencao || 0}"></div>
                    </div>
                    <div class="modal-footer"><button type="submit" class="btn btn-warning"><i class="fa-solid fa-check me-1"></i> Salvar Metas</button></div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalMetaGlobal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <form action="/admin/meta-global" method="POST">
                    <div class="modal-header bg-dark text-white border-0">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-globe me-2"></i> Definir Metas da Empresa</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <label class="form-label text-muted small fw-bold text-uppercase">Meta Global Anual (R$)</label>
                        <input type="text" name="valor" class="form-control form-control-lg mb-4 fw-bold text-primary mascara-moeda" value="${metaGlobal}" required>
                        
                        <div class="bg-light border border-secondary-subtle p-3 rounded-3 shadow-sm">
                            <h6 class="fw-bold text-dark mb-3" style="font-size: 0.9rem;"><i class="fa-solid fa-calendar-days text-secondary me-2"></i> Acompanhamento Mensal Isolado</h6>
                            <div class="row">
                                <div class="col-6">
                                    <label class="form-label text-muted small mb-1">Meta do Mês (R$)</label>
                                    <input type="text" name="meta_mensal" class="form-control border-secondary-subtle mascara-moeda" value="${dadosMeta.meta_mensal || 0}">
                                </div>
                                <div class="col-6">
                                    <label class="form-label text-muted small mb-1">Alcançado Manual (R$)</label>
                                    <input type="text" name="alcancado" class="form-control border-secondary-subtle text-success fw-bold mascara-moeda" value="${dadosMeta.alcancado || 0}">
                                </div>
                            </div>
                            <small class="text-muted d-block mt-2" style="font-size: 0.7rem;"><i class="fa-solid fa-circle-info me-1"></i> Valores independentes da tabela geral.</small>
                        </div>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-dark fw-bold px-4"><i class="fa-solid fa-check me-1"></i> Salvar Metas</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    ${usuarios.filter(u => u.tipo === 'vendedor').map(u => `
    <div class="modal fade" id="modalFaturamentoManual${u.id}" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <form action="/admin/faturamento-manual" method="POST">
                    <div class="modal-header bg-success text-white border-0">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-sack-dollar me-2"></i> Ajuste Manual de Faturamento</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <input type="hidden" name="vendedor_id" value="${u.id}">
                        <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                            <img src="${u.foto || 'https://via.placeholder.com/40'}" width="50" height="50" class="rounded-circle border me-3 shadow-sm" style="object-fit: cover;">
                            <div>
                                <h6 class="fw-bold text-dark mb-0">${u.nome}</h6>
                                <span class="text-muted small text-uppercase">${u.setor}</span>
                            </div>
                        </div>
                        <label class="form-label text-muted small fw-bold text-uppercase">Adicionar Faturamento Base (R$)</label>
                        <p class="small text-muted mb-3">Este valor soma no faturamento do vendedor, afetando sua meta e a Meta Global.</p>
                        <input type="text" name="faturamento_manual" class="form-control form-control-lg mb-2 fw-bold text-success mascara-moeda" value="${u.faturamento_manual || 0}" placeholder="Ex: 5000.00" required>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-success fw-bold px-4"><i class="fa-solid fa-check me-1"></i> Salvar Ajuste</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `).join('')}

    <div class="modal fade" id="modalGerenciarUsuarios" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title"><i class="fa-solid fa-users-gear me-2"></i> Gerenciar Equipe</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body overflow-auto p-0">
                    <table class="table align-middle table-hover mb-0">
                        <thead class="bg-light"><tr><th class="ps-4">Foto</th><th>Nome</th><th>Setor</th><th>Tipo</th><th class="text-end pe-4">Ações</th></tr></thead>
                        <tbody>
                            ${usuarios.map(u => `
                                <tr>
                                    <td class="ps-4"><img src="${u.foto || 'https://via.placeholder.com/40'}" width="40" height="40" class="rounded-circle border" style="object-fit: cover;"></td>
                                    <td class="fw-medium">${u.nome}</td>
                                    <td><span class="badge bg-${u.setor === 'ecommerce' ? 'primary' : (u.setor === 'industria' ? 'warning text-dark' : 'dark')}">${u.setor.toUpperCase()}</span></td>
                                    <td>${u.tipo}</td>
                                    <td class="text-end pe-4">
                                        <button class="btn btn-sm btn-light border text-primary" data-bs-toggle="modal" data-bs-target="#modalEditarUsuario${u.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
                                        <button class="btn btn-sm btn-light border text-danger" data-bs-toggle="modal" data-bs-target="#modalExcluirUsuario${u.id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    ${usuarios.map(u => `
        <div class="modal fade" id="modalEditarUsuario${u.id}" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <form action="/admin/usuario/editar" method="POST" enctype="multipart/form-data">
                        <div class="modal-header bg-warning"><h5 class="modal-title"><i class="fa-solid fa-pen me-2"></i> Editar: ${u.nome}</h5></div>
                        <div class="modal-body">
                            <input type="hidden" name="id" value="${u.id}">
                            <label class="form-label small text-muted mb-0 mt-2">Nome</label>
                            <input type="text" name="nome" class="form-control mb-2" value="${u.nome}" required>
                            <label class="form-label small text-muted mb-0 mt-2">Token de Acesso</label>
                            <input type="text" name="token" class="form-control mb-2" value="${u.token}" required>
                            <label class="form-label small text-muted mb-0 mt-2">Nova Foto</label>
                            <input type="file" name="foto" class="form-control mb-3" accept="image/png, image/jpeg, image/jpg">
                            <select name="tipo" class="form-select mb-2">
                                <option value="vendedor" ${u.tipo === 'vendedor' ? 'selected' : ''}>Vendedor</option>
                                <option value="admin" ${u.tipo === 'admin' ? 'selected' : ''}>Administrador</option>
                            </select>
                            <select name="setor" class="form-select mb-2">
                                <option value="ecommerce" ${u.setor === 'ecommerce' ? 'selected' : ''}>E-commerce</option>
                                <option value="industria" ${u.setor === 'industria' ? 'selected' : ''}>Indústria</option>
                                <option value="admin" ${u.setor === 'admin' ? 'selected' : ''}>Admin (Geral)</option>
                            </select>
                        </div>
                        <div class="modal-footer justify-content-between">
                            <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#modalGerenciarUsuarios"><i class="fa-solid fa-arrow-left me-1"></i> Voltar</button>
                            <button type="submit" class="btn btn-warning"><i class="fa-solid fa-check me-1"></i> Salvar Alterações</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalExcluirUsuario${u.id}" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <form action="/admin/usuario/excluir" method="POST">
                        <div class="modal-header bg-danger text-white"><h5 class="modal-title"><i class="fa-solid fa-triangle-exclamation me-2"></i> Atenção!</h5></div>
                        <div class="modal-body">
                            <input type="hidden" name="id" value="${u.id}">
                            <p>Tem certeza que deseja excluir o usuário <strong>${u.nome}</strong>?</p>
                        </div>
                        <div class="modal-footer justify-content-between">
                            <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#modalGerenciarUsuarios"><i class="fa-solid fa-arrow-left me-1"></i> Voltar</button>
                            <button type="submit" class="btn btn-danger"><i class="fa-solid fa-trash me-1"></i> Sim, Excluir</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `).join('')}

    ${todosClientes.map((c, index) => {
        if (!c.observacao) return '';
        return `
        <div class="modal fade" id="modalObsAdmin${index}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg animate-modal">
                    <div class="modal-header bg-info border-0"><h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-note-sticky me-2"></i> Anotações do Cliente</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body p-4">
                        <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                            <div class="bg-light p-3 rounded-circle me-3"><i class="fa-solid fa-building text-info fa-2x"></i></div>
                            <div>
                                <h5 class="fw-bold text-dark mb-0">${c.nome}</h5>
                                <span class="text-muted small"><i class="fa-solid fa-location-dot me-1 text-danger"></i> ${c.regiao || 'Região não informada'}</span><br>
                                <span class="badge bg-light text-dark border mt-1"><i class="fa-solid fa-user text-muted me-1"></i> Vend: ${c.vendedor_nome || 'Desconhecido'}</span>
                            </div>
                        </div>
                        <h6 class="text-muted small text-uppercase fw-bold mb-2">Observação Registrada:</h6>
                        <div class="bg-light-subtle border border-info-subtle p-3 rounded-3 shadow-sm">
                            <p class="mb-0 text-dark" style="white-space: pre-wrap; font-size: 0.95rem;">${c.observacao}</p>
                        </div>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Fechar Aba</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('')}

    <div class="modal fade" id="modalZerarCiclo" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <form action="/admin/zerar-ciclo" method="POST">
                    <div class="modal-header bg-danger text-white border-0">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-triangle-exclamation me-2"></i> Zerar Ciclo Comercial</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 text-center">
                        <i class="fa-solid fa-rotate-right fa-3x text-danger mb-3"></i>
                        <h5 class="fw-bold text-dark">Tem certeza absoluta?</h5>
                        <p class="text-muted mb-0">Esta ação irá arquivar todos os clientes atuais e <strong>zerar os pontos e as métricas</strong> de todos os vendedores instantaneamente.</p>
                        <p class="text-muted small mt-2">Os clientes continuarão salvos no banco de dados, mas o painel começará um ciclo novo e limpo a partir de agora.</p>
                    </div>
                    <div class="modal-footer border-0 justify-content-center bg-light">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-danger fw-bold px-4">Sim, Zerar Tudo</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
    document.addEventListener("DOMContentLoaded", function() {
        
        const aplicarMascaraMoeda = (input) => {
            let valor = input.value;
            if (valor === "") return;

            valor = valor.replace('R$', '').trim();
            if (valor.includes('.') && !valor.includes(',')) {
                valor = Number(valor).toFixed(2);
            }
            
            const isNegativo = valor.startsWith('-');
            valor = valor.replace(/\\D/g, "");

            if (valor === "") {
                input.value = "";
                return;
            }

            valor = (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            if(isNegativo) valor = '-' + valor;
            
            input.value = valor;
        };

        const inputsMoeda = document.querySelectorAll('.mascara-moeda');
        inputsMoeda.forEach(input => {
            aplicarMascaraMoeda(input);
            input.addEventListener('input', function(e) {
                aplicarMascaraMoeda(e.target);
            });
        });

        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function() {
                const formInputs = form.querySelectorAll('.mascara-moeda');
                formInputs.forEach(input => {
                    if (input.value) {
                        const isNegativo = input.value.startsWith('-');
                        let cleanValue = input.value.replace(/[R$\\s-]/g, '').replace(/\\./g, '').replace(',', '.');
                        input.value = isNegativo ? '-' + cleanValue : cleanValue;
                    }
                });
            });
        });

        const inputTexto = document.getElementById('filtroTextoAdmin');
        const containerPaginacao = document.getElementById('paginacaoAdminContainer');
        const linhaVazia = document.getElementById('linhaVaziaAdmin');
        
        if(!inputTexto || !containerPaginacao) return;

        const todasLinhas = Array.from(document.querySelectorAll('.cliente-admin-row'));
        const itensPorPagina = 12;
        let paginaAtual = 1;
        let linhasAtuais = [...todasLinhas];

        function aplicarFiltros() {
            const termo = inputTexto.value.toLowerCase();
            linhasAtuais = todasLinhas.filter(linha => {
                const textoBusca = linha.getAttribute('data-busca');
                return textoBusca.includes(termo);
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
                for (let i = 1; i <= totalPaginas; i++) { ul.appendChild(criarBotaoPagina(i, i, false, i === paginaAtual)); }
            } else {
                ul.appendChild(criarBotaoPagina(1, 1, false, 1 === paginaAtual));
                if (paginaAtual > 3) ul.appendChild(criarDots());
                const inicio = Math.max(2, paginaAtual - 1);
                const fim = Math.min(totalPaginas - 1, paginaAtual + 1);
                for (let i = inicio; i <= fim; i++) { ul.appendChild(criarBotaoPagina(i, i, false, i === paginaAtual)); }
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
                a.classList.add('bg-info', 'text-white', 'border-info');
            }
            a.innerHTML = texto;
            if (!disabled && !active) {
                a.onclick = function(e) { e.preventDefault(); paginaAtual = alvo; renderizarTabela(); };
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

        inputTexto.addEventListener('input', aplicarFiltros);
        aplicarFiltros();
    });
    </script>
    `);
};