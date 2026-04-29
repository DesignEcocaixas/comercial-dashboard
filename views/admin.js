const layout = require('./layout');
const menuLateral = require('./menuLateral'); // Importando o menu
const loading = require('./loading'); // Importando a tela de loading

const formatarBRL = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
};

const kpiCard = (titulo, alcancado, meta, icone, formatarMoeda = false, modalId = '', formatarPercentual = false, isSmall = false) => {
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

    // Configurações de tamanho mantidas, mas sem forçar numa única linha
    const paddingClass = isSmall ? 'py-1 px-2' : 'py-2 px-3';
    const titleSize = isSmall ? '0.60rem' : '0.8rem';
    const valSize = (isSmall && formatarMoeda) ? '0.75rem' : (isSmall ? '0.85rem' : '1.1rem'); 
    const metaSize = isSmall ? '0.65rem' : '0.85rem';
    
    const iconBox = isSmall ? 'width: 24px; height: 24px;' : 'width: 40px; height: 40px;';
    const iconFont = isSmall ? '0.65rem' : '1.1rem';
    
    const colClass = isSmall ? 'col-6 col-lg-4 col-xl-3 mb-2 px-1' : 'col-6 col-md-3 mb-3';
    const borderSize = isSmall ? 'border-3' : 'border-4';

    return `
        <div class="${colClass} animate-up">
            <div class="card shadow-sm border-start border-${cor} ${borderSize} h-100 kpi-card ${glowClass}"
                 ${modalId ? `data-bs-toggle="modal" data-bs-target="#${modalId}"` : ''} style="${modalId ? 'cursor: pointer; transition: 0.2s;' : ''}" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')">
                
                <div class="card-body ${paddingClass} d-flex justify-content-between align-items-center gap-1">
                    
                    <div style="min-width: 0; flex-grow: 1; padding-right: 2px;">
                        <h6 class="text-muted mb-0 text-truncate" style="font-size: ${titleSize}; text-transform: uppercase; letter-spacing: 0.2px;" title="${titulo}">${titulo}</h6>
                        
                        <div class="mb-0 fw-bold text-${cor}" style="font-size: ${valSize}; line-height: 1.2;">
                            ${textoAlcancado} <span class="text-muted fw-normal d-inline-block" style="font-size: ${metaSize};">/ ${textoMeta}</span>
                        </div>
                    </div>

                    <div class="bg-light text-${cor} rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="${iconBox}">
                        <i class="fa-solid ${icone}" style="font-size: ${iconFont};"></i>
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
                                    <td class="ps-3 py-2 fw-medium text-dark">
                                        ${c.nome}
                                        ${c.cliente_grande === 'sim' ? '<span class="badge bg-warning text-dark ms-1" style="font-size: 0.6rem;"><i class="fa-solid fa-star"></i> VIP</span>' : ''}
                                    </td>
                                    <td class="py-2 text-muted">${c.vendedor_nome}</td>
                                    <td class="py-2 text-success">${formatarBRL(c.valor_venda)}</td>
                                    <td class="py-2">${c.fechou === 'sim' ? '<span class="badge bg-success" style="font-size: 0.65rem;">Fechou</span>' : '<span class="badge bg-secondary" style="font-size: 0.65rem;">Pendente</span>'}</td>
                                </tr>
                            `).join('') : `<tr><td colspan="4" class="text-center text-muted py-4">Nenhum cliente compõe este indicador.</td></tr>`}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer border-0 bg-light">
                    <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>
`;

module.exports = (usuarioLogado, usuarios, metas, kpis, metaGlobal, alcancadoGlobal, todosClientes = [], dadosMeta = {}) => {

    const ecoClientes = todosClientes.filter(c => c.setor === 'ecommerce');
    const indClientes = todosClientes.filter(c => c.setor === 'industria');
    
    const somaManualTotal = usuarios.reduce((acc, u) => acc + Number(u.faturamento_manual || 0), 0);

    // =========================================================================
    // CÁLCULO DA SOMA DAS MÉTRICAS INDIVIDUAIS PARA OS CONTAINERS GERAIS
    // =========================================================================
    const sumEcoKpi = { sem: 0, com: 0, novos: 0, grande: 0, vendas: 0, pos: 0, visita: 0, reativ: 0 };
    const sumEcoMeta = { sem: 0, com: 0, novos: 0, grande: 0, vendas: 0, pos: 0, visita: 0, reativ: 0 };
    
    const sumIndKpi = { sem: 0, com: 0, novos: 0, grande: 0, vendas: 0, pos: 0, visita: 0, reativ: 0, fidelizados: 0, carteira: 0 };
    const sumIndMeta = { sem: 0, com: 0, novos: 0, grande: 0, vendas: 0, pos: 0, visita: 0, reativ: 0, taxaSum: 0, count: 0 };

    usuarios.filter(u => u.tipo === 'vendedor').forEach(u => {
        const clientesU = todosClientes.filter(c => c.vendedor_id === u.id);
        const kpiSem = clientesU.filter(c => c.prospeccao === 'sem_visita').length;
        const kpiCom = clientesU.filter(c => c.prospeccao === 'com_visita').length;
        const kpiNovos = clientesU.filter(c => c.fechou === 'sim').length;
        
        const valorMinGrande = u.valor_cliente_grande > 0 ? u.valor_cliente_grande : (u.setor === 'ecommerce' ? 5000 : 15000);
        const kpiGrande = clientesU.filter(c => c.fechou === 'sim' && (c.valor_venda >= valorMinGrande || c.cliente_grande === 'sim')).length;
        
        const kpiVendas = clientesU.filter(c => c.fechou === 'sim').reduce((acc, c) => acc + Number(c.valor_venda), 0) + Number(u.faturamento_manual || 0);
        const kpiPos = clientesU.filter(c => c.pos_venda === 'sim').length;
        const kpiVisita = clientesU.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita').length;
        const kpiReativ = clientesU.filter(c => c.parado === 'sim' && c.fechou === 'sim').length;
        const kpiCarteira = clientesU.filter(c => c.carteira === 'sim').length;
        const kpiFidel = clientesU.filter(c => c.carteira === 'sim' && c.comprou_recorrente === 'sim').length;

        const metasSetor = u.setor === 'ecommerce' ? metas.ecommerce : metas.industria;
        
        const m_sem = u.qtd_prosp_sem_visita > 0 ? u.qtd_prosp_sem_visita : (metasSetor?.qtd_prosp_sem_visita || 0);
        const m_com = u.qtd_prosp_com_visita > 0 ? u.qtd_prosp_com_visita : (metasSetor?.qtd_prosp_com_visita || 0);
        const m_novos = u.qtd_clientes_fechar > 0 ? u.qtd_clientes_fechar : (metasSetor?.qtd_clientes_fechar || 0);
        const m_grande = u.qtd_cliente_grande > 0 ? u.qtd_cliente_grande : (metasSetor?.qtd_cliente_grande || 0);
        const m_vendas = u.meta_geral > 0 ? u.meta_geral : (metasSetor?.meta_geral || 0);
        const m_pos = u.qtd_pos_venda > 0 ? u.qtd_pos_venda : (metasSetor?.qtd_pos_venda || 0);
        const m_visita = u.qtd_visitas_carteira > 0 ? u.qtd_visitas_carteira : (metasSetor?.qtd_visitas_carteira || 0);
        const m_reativ = u.qtd_reativacoes > 0 ? u.qtd_reativacoes : (metasSetor?.qtd_reativacoes || 0);
        const m_taxa = u.taxa_retencao > 0 ? u.taxa_retencao : (metasSetor?.taxa_retencao || 40);

        if (u.setor === 'ecommerce') {
            sumEcoKpi.sem += kpiSem; sumEcoMeta.sem += Number(m_sem);
            sumEcoKpi.com += kpiCom; sumEcoMeta.com += Number(m_com);
            sumEcoKpi.novos += kpiNovos; sumEcoMeta.novos += Number(m_novos);
            sumEcoKpi.grande += kpiGrande; sumEcoMeta.grande += Number(m_grande);
            sumEcoKpi.vendas += kpiVendas; sumEcoMeta.vendas += Number(m_vendas);
            sumEcoKpi.pos += kpiPos; sumEcoMeta.pos += Number(m_pos);
            sumEcoKpi.visita += kpiVisita; sumEcoMeta.visita += Number(m_visita);
            sumEcoKpi.reativ += kpiReativ; sumEcoMeta.reativ += Number(m_reativ);
        } else if (u.setor === 'industria') {
            sumIndKpi.sem += kpiSem; sumIndMeta.sem += Number(m_sem);
            sumIndKpi.com += kpiCom; sumIndMeta.com += Number(m_com);
            sumIndKpi.novos += kpiNovos; sumIndMeta.novos += Number(m_novos);
            sumIndKpi.grande += kpiGrande; sumIndMeta.grande += Number(m_grande);
            sumIndKpi.vendas += kpiVendas; sumIndMeta.vendas += Number(m_vendas);
            sumIndKpi.pos += kpiPos; sumIndMeta.pos += Number(m_pos);
            sumIndKpi.visita += kpiVisita; sumIndMeta.visita += Number(m_visita);
            sumIndKpi.reativ += kpiReativ; sumIndMeta.reativ += Number(m_reativ);
            sumIndKpi.carteira += kpiCarteira; sumIndKpi.fidelizados += kpiFidel;
            sumIndMeta.taxaSum += Number(m_taxa); sumIndMeta.count += 1;
        }
    });

    const taxaAlcancadaInd = sumIndKpi.carteira > 0 ? (sumIndKpi.fidelizados / sumIndKpi.carteira) * 100 : 0;
    const taxaMetaInd = sumIndMeta.count > 0 ? (sumIndMeta.taxaSum / sumIndMeta.count) : 40;

    return layout(`

        ${loading()}
        ${menuLateral(usuarioLogado)}

        <style>
            .container-70 { width: 95%; max-width: 1600px; margin: 0 auto; }
            @media (max-width: 768px) { .container-70 { width: 98%; } }

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
        </style>

        <div class="main-content-wrapper">
            <div class="container-70" style="padding-top: 2rem;">

                <div class="row mb-4 align-items-stretch">
                    
                    ${(() => {
                        const vAlcancado = (Number(alcancadoGlobal) || 0) + somaManualTotal;
                        const vMeta = Number(metaGlobal) || 0;
                        const atingiuGlobal = (vAlcancado >= vMeta && vMeta > 0);
                        const corGlobal = atingiuGlobal ? 'success' : 'primary';
                        const glowGlobal = atingiuGlobal ? 'glow-success' : '';
                        const porcentagem = vMeta > 0 ? Math.min((vAlcancado / vMeta) * 100, 100) : 0;
                        const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });
                        const mesNome = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

                        return `
                        <div class="col-lg-4 col-md-12 mb-3 mb-lg-0 d-flex animate-up" style="animation-delay: 0.1s;">
                            <div class="card shadow-sm border-${corGlobal} border-2 rounded-3 w-100 border-top-0 border-end-0 border-bottom-0 position-relative ${glowGlobal}">
                                <span class="position-absolute top-0 end-0 badge bg-${corGlobal} mt-2 me-2 text-uppercase shadow-sm" style="font-size: 0.6rem; letter-spacing: 0.5px;">${mesNome}</span>
                                <div class="card-body text-center bg-white d-flex flex-column justify-content-center py-4">
                                    <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.85rem;"><i class="fa-solid fa-earth-americas text-${corGlobal} me-2"></i> Meta Geral da Empresa</h6>
                                    <div class="progress mb-3" style="height: 18px; border-radius: 20px; border: 1px solid #e0e0e0; overflow: hidden;">
                                        <div class="progress-bar bg-${corGlobal} progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${porcentagem}%; font-size: 0.75rem; font-weight: bold;">
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
                                            <tr style="cursor: pointer; transition: 0.2s;" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')" data-bs-toggle="modal" data-bs-target="#modalPontosUsuario${u.id}" title="Ver Conquistas">
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

                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card shadow-sm rounded-3 border animate-up" style="animation-delay: 0.4s;">
                            <div class="card-header bg-white border-0 pt-3 pb-0">
                                <ul class="nav nav-pills nav-fill bg-light rounded-2 p-1" id="pills-tab" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active py-2 fw-bold text-uppercase" id="tab-ecommerce" data-bs-toggle="pill" data-bs-target="#content-ecommerce" type="button" role="tab" style="font-size: 0.85rem; letter-spacing: 1px;">
                                            <i class="fa-solid fa-cart-shopping me-2"></i>E-Commerce (Equipe)
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link py-2 fw-bold text-uppercase" id="tab-industria" data-bs-toggle="pill" data-bs-target="#content-industria" type="button" role="tab" style="font-size: 0.85rem; letter-spacing: 1px;">
                                            <i class="fa-solid fa-building me-2"></i>Indústria (Equipe)
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            
                            <div class="tab-content" id="pills-tabContent">
                                <div class="tab-pane fade show active" id="content-ecommerce" role="tabpanel">
                                    <div class="card-body bg-white px-3 pt-4 pb-2">
                                        <div class="row mx-0">
                                            ${kpiCard('Prosp. S/ Visita', sumEcoKpi.sem, sumEcoMeta.sem, 'fa-phone', false, 'modalEco_sem_visita')}
                                            ${kpiCard('Prosp. C/ Visita', sumEcoKpi.com, sumEcoMeta.com, 'fa-handshake', false, 'modalEco_com_visita')}
                                            ${kpiCard('Novos Clientes', sumEcoKpi.novos, sumEcoMeta.novos, 'fa-user-check', false, 'modalEco_fechar')}
                                            ${kpiCard('QTD Cli. Grande', sumEcoKpi.grande, sumEcoMeta.grande, 'fa-gem', false, 'modalEco_grande')}
                                            ${kpiCard('Faturamento Total', sumEcoKpi.vendas, sumEcoMeta.vendas, 'fa-sack-dollar', true, 'modalEco_vendas')}
                                            ${kpiCard('Pós-Venda Feito', sumEcoKpi.pos, sumEcoMeta.pos, 'fa-headset', false, 'modalEco_pos_venda')}
                                            ${kpiCard('Visitas Carteira', sumEcoKpi.visita, sumEcoMeta.visita, 'fa-car', false, 'modalEco_visita')}
                                            ${kpiCard('Reativações', sumEcoKpi.reativ, sumEcoMeta.reativ, 'fa-rotate-right', false, 'modalEco_reativacao')}
                                        </div>
                                    </div>
                                </div>

                                <div class="tab-pane fade" id="content-industria" role="tabpanel">
                                    <div class="card-body bg-white px-3 pt-4 pb-2">
                                        <div class="row mx-0">
                                            ${kpiCard('Prosp. S/ Visita', sumIndKpi.sem, sumIndMeta.sem, 'fa-phone', false, 'modalInd_sem_visita')}
                                            ${kpiCard('Prosp. C/ Visita', sumIndKpi.com, sumIndMeta.com, 'fa-handshake', false, 'modalInd_com_visita')}
                                            ${kpiCard('Novos Clientes', sumIndKpi.novos, sumIndMeta.novos, 'fa-user-check', false, 'modalInd_fechar')}
                                            ${kpiCard('QTD Cli. Grande', sumIndKpi.grande, sumIndMeta.grande, 'fa-gem', false, 'modalInd_grande')}
                                            ${kpiCard('Faturamento Total', sumIndKpi.vendas, sumIndMeta.vendas, 'fa-sack-dollar', true, 'modalInd_vendas')}
                                            ${kpiCard('Pós-Venda Feito', sumIndKpi.pos, sumIndMeta.pos, 'fa-headset', false, 'modalInd_pos_venda')}
                                            ${kpiCard('Visitas Carteira', sumIndKpi.visita, sumIndMeta.visita, 'fa-car', false, 'modalInd_visita')}
                                            ${kpiCard('Reativações', sumIndKpi.reativ, sumIndMeta.reativ, 'fa-rotate-right', false, 'modalInd_reativacao')}
                                            ${kpiCard('Taxa de Retenção', taxaAlcancadaInd, taxaMetaInd, 'fa-chart-pie', false, 'modalInd_retencao', true)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex align-items-center mb-3 mt-5 animate-up" style="animation-delay: 0.45s;">
                    <h5 class="fw-bold text-dark mb-0"><i class="fa-solid fa-user-tie text-primary me-2"></i>Métricas Individuais por Vendedor</h5>
                    <div class="border-bottom flex-grow-1 ms-3"></div>
                </div>

                ${usuarios.filter(u => u.tipo === 'vendedor').map((u, index) => {
                    const delay = 0.5 + (index * 0.1);
                    const clientesU = todosClientes.filter(c => c.vendedor_id === u.id);
                    const kpiSem = clientesU.filter(c => c.prospeccao === 'sem_visita').length;
                    const kpiCom = clientesU.filter(c => c.prospeccao === 'com_visita').length;
                    const kpiNovos = clientesU.filter(c => c.fechou === 'sim').length;
                    const valorMinGrande = u.valor_cliente_grande || (u.setor === 'ecommerce' ? 5000 : 15000);
                    const kpiGrande = clientesU.filter(c => c.fechou === 'sim' && (c.valor_venda >= valorMinGrande || c.cliente_grande === 'sim')).length;
                    const kpiVendas = clientesU.filter(c => c.fechou === 'sim').reduce((acc, c) => acc + Number(c.valor_venda), 0) + Number(u.faturamento_manual || 0);
                    const kpiPos = clientesU.filter(c => c.pos_venda === 'sim').length;
                    const kpiVisita = clientesU.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita').length;
                    const kpiReativ = clientesU.filter(c => c.parado === 'sim' && c.fechou === 'sim').length;
                    const kpiCarteira = clientesU.filter(c => c.carteira === 'sim').length;
                    const kpiFidel = clientesU.filter(c => c.carteira === 'sim' && c.comprou_recorrente === 'sim').length;
                    const taxaInd = kpiCarteira > 0 ? (kpiFidel / kpiCarteira) * 100 : 0;

                    return `
                    <div class="card shadow-sm rounded-3 border mb-4 animate-up" style="animation-delay: ${delay}s;">
                        <div class="card-header bg-white text-dark fw-bold py-3 border-0 d-flex justify-content-between align-items-center" style="font-size: 0.95rem;">
                            <div class="d-flex align-items-center">
                                <img src="${u.foto || 'https://via.placeholder.com/40'}" width="35" height="35" class="rounded-circle border me-2 shadow-sm" style="object-fit: cover;">
                                <span class="me-2">${u.nome}</span>
                                <span class="badge bg-${u.setor === 'ecommerce' ? 'primary' : 'warning text-dark'} text-uppercase" style="font-size: 0.65rem;">${u.setor}</span>
                            </div>
                            <button class="btn btn-sm btn-outline-secondary py-1" data-bs-toggle="modal" data-bs-target="#modalMetasUsuario${u.id}">
                                <i class="fa-solid fa-bullseye me-1"></i> Alterar Metas
                            </button>
                        </div>
                        <div class="card-body pb-0 bg-light px-2 pt-3">
                            <div class="row mx-0">
                                ${kpiCard('Prosp. Sem Visita', kpiSem, u.qtd_prosp_sem_visita, 'fa-phone', false, `modalIndiv_sem_visita_${u.id}`)}
                                ${kpiCard('Prosp. Com Visita', kpiCom, u.qtd_prosp_com_visita, 'fa-handshake', false, `modalIndiv_com_visita_${u.id}`)}
                                ${kpiCard('Novos Clientes', kpiNovos, u.qtd_clientes_fechar, 'fa-user-check', false, `modalIndiv_fechar_${u.id}`)}
                                ${kpiCard('QTD Cliente Grande', kpiGrande, u.qtd_cliente_grande, 'fa-gem', false, `modalIndiv_grande_${u.id}`)}
                                ${kpiCard('Meta Individual', kpiVendas, u.meta_geral, 'fa-sack-dollar', true, `modalIndiv_vendas_${u.id}`)}
                                ${kpiCard('Pós-Venda Feito', kpiPos, u.qtd_pos_venda, 'fa-headset', false, `modalIndiv_pos_venda_${u.id}`)}
                                ${kpiCard('Visitas Carteira', kpiVisita, u.qtd_visitas_carteira, 'fa-car', false, `modalIndiv_visita_${u.id}`)}
                                ${kpiCard('Reativações', kpiReativ, u.qtd_reativacoes, 'fa-rotate-right', false, `modalIndiv_reativacao_${u.id}`)}
                                ${u.setor === 'industria' ? kpiCard('Taxa Retenção', taxaInd, u.taxa_retencao || 40, 'fa-chart-pie', false, `modalIndiv_retencao_${u.id}`, true) : ''}
                            </div>
                        </div>
                    </div>

                    ${modalListaClientes(`modalIndiv_sem_visita_${u.id}`, `Prospecção Sem Visita: ${u.nome}`, clientesU.filter(c => c.prospeccao === 'sem_visita'))}
                    ${modalListaClientes(`modalIndiv_com_visita_${u.id}`, `Prospecção Com Visita: ${u.nome}`, clientesU.filter(c => c.prospeccao === 'com_visita'))}
                    ${modalListaClientes(`modalIndiv_fechar_${u.id}`, `Novos Clientes: ${u.nome}`, clientesU.filter(c => c.fechou === 'sim'))}
                    ${modalListaClientes(`modalIndiv_grande_${u.id}`, `Clientes Grandes: ${u.nome}`, clientesU.filter(c => c.fechou === 'sim' && (c.valor_venda >= valorMinGrande || c.cliente_grande === 'sim')))}
                    ${modalListaClientes(`modalIndiv_vendas_${u.id}`, `Vendas Fechadas: ${u.nome}`, clientesU.filter(c => c.fechou === 'sim'))}
                    ${modalListaClientes(`modalIndiv_pos_venda_${u.id}`, `Pós-Venda Realizado: ${u.nome}`, clientesU.filter(c => c.pos_venda === 'sim'))}
                    ${modalListaClientes(`modalIndiv_visita_${u.id}`, `Visitas na Carteira: ${u.nome}`, clientesU.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita'))}
                    ${modalListaClientes(`modalIndiv_reativacao_${u.id}`, `Reativações: ${u.nome}`, clientesU.filter(c => c.parado === 'sim' && c.fechou === 'sim'))}
                    ${u.setor === 'industria' ? modalListaClientes(`modalIndiv_retencao_${u.id}`, `Clientes Fidelizados: ${u.nome}`, clientesU.filter(c => c.carteira === 'sim' && c.comprou_recorrente === 'sim')) : ''}
                    `;
                }).join('')}
                <div class="card shadow-sm rounded-3 border mb-5 animate-up" style="animation-delay: 1s;">
                    <div class="card-header bg-white py-3 border-0 d-flex flex-column gap-3">
                        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                            <div class="d-flex align-items-center w-100">
                                <i class="fa-solid fa-users text-info me-2"></i> <span class="fw-bold" style="font-size: 0.95rem;">Visão Geral: Todos os Clientes</span>
                            </div>
                        </div>

                        <div class="bg-light p-3 rounded border border-light-subtle shadow-sm">
                            <form action="/admin/exportar-clientes" method="GET" class="row g-2 align-items-center m-0">
                                
                                <div class="col-12 col-lg-auto d-flex align-items-center mb-1 mb-lg-0">
                                    <span class="small fw-bold text-muted mb-0"><i class="fa-solid fa-download text-success me-1"></i> Exportar Dados:</span>
                                </div>
                                
                                <div class="col-12 col-md-6 col-lg-auto flex-grow-1">
                                    <select name="vendedor_id" class="form-select form-select-sm border-secondary-subtle" required>
                                        <option value="todos">Todos os Vendedores</option>
                                        ${usuarios.filter(u => u.tipo === 'vendedor').map(u => `<option value="${u.id}">${u.nome}</option>`).join('')}
                                    </select>
                                </div>
                                
                                <div class="col-6 col-md-3 col-lg-auto">
                                    <div class="input-group input-group-sm">
                                        <span class="input-group-text bg-white text-muted border-secondary-subtle">De</span>
                                        <input type="date" name="data_inicio" class="form-control border-secondary-subtle" required>
                                    </div>
                                </div>
                                
                                <div class="col-6 col-md-3 col-lg-auto">
                                    <div class="input-group input-group-sm">
                                        <span class="input-group-text bg-white text-muted border-secondary-subtle">Até</span>
                                        <input type="date" name="data_fim" class="form-control border-secondary-subtle" required>
                                    </div>
                                </div>
                                
                                <div class="col-12 col-md-auto flex-grow-1">
                                    <div class="input-group input-group-sm">
                                        <span class="input-group-text bg-light border-end-0"><i class="fa-solid fa-search text-muted"></i></span>
                                        <input type="text" id="filtroTextoAdmin" class="form-control border-start-0 ps-0" placeholder="Buscar por cliente ou vendedor...">
                                    </div>
                                </div>
                                
                                <div class="col-12 col-lg-auto text-end mt-2 mt-lg-0">
                                    <button type="submit" class="btn btn-sm btn-success fw-bold w-100"><i class="fa-solid fa-file-excel me-1"></i> Baixar Tabela</button>
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

            </div> </div> ${modalListaClientes('modalEco_sem_visita', 'E-commerce: Prospecção Sem Visita', ecoClientes.filter(c => c.prospeccao === 'sem_visita'))}
    ${modalListaClientes('modalEco_com_visita', 'E-commerce: Prospecção Com Visita', ecoClientes.filter(c => c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalEco_fechar', 'E-commerce: Novos Clientes', ecoClientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalEco_grande', 'E-commerce: Clientes Grandes', ecoClientes.filter(c => {
        const vendedor = usuarios.find(u => u.id === c.vendedor_id);
        const valorMin = vendedor?.valor_cliente_grande > 0 ? vendedor.valor_cliente_grande : 5000;
        return c.fechou === 'sim' && (c.valor_venda >= valorMin || c.cliente_grande === 'sim');
    }))}
    ${modalListaClientes('modalEco_vendas', 'E-commerce: Vendas Fechadas', ecoClientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalEco_pos_venda', 'E-commerce: Pós-Venda Realizado', ecoClientes.filter(c => c.pos_venda === 'sim'))}
    ${modalListaClientes('modalEco_visita', 'E-commerce: Visita na Carteira Realizada', ecoClientes.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalEco_reativacao', 'E-commerce: Reativações Concluídas', ecoClientes.filter(c => c.parado === 'sim' && c.fechou === 'sim'))}

    ${modalListaClientes('modalInd_sem_visita', 'Indústria: Prospecção Sem Visita', indClientes.filter(c => c.prospeccao === 'sem_visita'))}
    ${modalListaClientes('modalInd_com_visita', 'Indústria: Prospecção Com Visita', indClientes.filter(c => c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalInd_fechar', 'Indústria: Novos Clientes', indClientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalInd_grande', 'Indústria: Clientes Grandes', indClientes.filter(c => {
        const vendedor = usuarios.find(u => u.id === c.vendedor_id);
        const valorMin = vendedor?.valor_cliente_grande > 0 ? vendedor.valor_cliente_grande : 15000;
        return c.fechou === 'sim' && (c.valor_venda >= valorMin || c.cliente_grande === 'sim');
    }))}
    ${modalListaClientes('modalInd_vendas', 'Indústria: Vendas Fechadas', indClientes.filter(c => c.fechou === 'sim'))}
    ${modalListaClientes('modalInd_pos_venda', 'Indústria: Pós-Venda Realizado', indClientes.filter(c => c.pos_venda === 'sim'))}
    ${modalListaClientes('modalInd_visita', 'Indústria: Visita na Carteira Realizada', indClientes.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita'))}
    ${modalListaClientes('modalInd_reativacao', 'Indústria: Reativações Concluídas', indClientes.filter(c => c.parado === 'sim' && c.fechou === 'sim'))}
    ${modalListaClientes('modalInd_retencao', 'Indústria: Clientes Fidelizados (Recorrência)', indClientes.filter(c => c.carteira === 'sim' && c.comprou_recorrente === 'sim'))}

    <div class="modal fade" id="modalUsuario" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <form action="/admin/usuario" method="POST" enctype="multipart/form-data">
                    <div class="modal-header bg-dark text-white border-0">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-user-plus me-2 text-primary"></i> Novo Usuário</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <label class="form-label text-muted small fw-bold text-uppercase">Nome completo</label>
                        <input type="text" name="nome" class="form-control mb-3" required>
                        
                        <label class="form-label text-muted small fw-bold text-uppercase">Token de Acesso</label>
                        <input type="text" name="token" class="form-control mb-3" required>
                        
                        <label class="form-label text-muted small fw-bold text-uppercase">Foto de Perfil</label>
                        <input type="file" name="foto" class="form-control mb-3" accept="image/png, image/jpeg, image/jpg">
                        
                        <div class="row">
                            <div class="col-6">
                                <label class="form-label text-muted small fw-bold text-uppercase">Tipo</label>
                                <select name="tipo" class="form-select mb-3"><option value="vendedor">Vendedor</option><option value="admin">Administrador</option></select>
                            </div>
                            <div class="col-6">
                                <label class="form-label text-muted small fw-bold text-uppercase">Setor</label>
                                <select name="setor" class="form-select mb-3"><option value="ecommerce">E-commerce</option><option value="industria">Indústria</option><option value="admin">Admin (Geral)</option></select>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-dark fw-bold px-4">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalMetasEco" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <form action="/admin/metas" method="POST">
                    <div class="modal-header bg-dark text-white border-0">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-bullseye me-2 text-primary"></i> Metas Gerais: E-commerce</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 row">
                        <input type="hidden" name="setor" value="ecommerce">
                        <div class="col-md-6 mb-3">
                            <label class="form-label text-muted small fw-bold text-uppercase">Meta Faturamento (R$)</label>
                            <input type="text" name="meta_geral" class="form-control fw-bold text-success mascara-moeda" value="${metas.ecommerce?.meta_geral || 0}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label text-muted small fw-bold text-uppercase">Valor Cliente Grande (R$)</label>
                            <input type="text" name="valor_cliente_grande" class="form-control mascara-moeda" value="${metas.ecommerce?.valor_cliente_grande || 0}">
                        </div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Prosp. S/ Visita</label><input type="number" name="qtd_prosp_sem_visita" class="form-control" value="${metas.ecommerce?.qtd_prosp_sem_visita || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Prosp. C/ Visita</label><input type="number" name="qtd_prosp_com_visita" class="form-control" value="${metas.ecommerce?.qtd_prosp_com_visita || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Novos Clientes</label><input type="number" name="qtd_clientes_fechar" class="form-control" value="${metas.ecommerce?.qtd_clientes_fechar || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">QTD Cli. Grande</label><input type="number" name="qtd_cliente_grande" class="form-control" value="${metas.ecommerce?.qtd_cliente_grande || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Pós-Venda</label><input type="number" name="qtd_pos_venda" class="form-control" value="${metas.ecommerce?.qtd_pos_venda || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Visita Cart.</label><input type="number" name="qtd_visitas_carteira" class="form-control" value="${metas.ecommerce?.qtd_visitas_carteira || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted text-uppercase">Reativações</label><input type="number" name="qtd_reativacoes" class="form-control" value="${metas.ecommerce?.qtd_reativacoes || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted text-uppercase">Bônus Região</label><input type="number" name="qtd_vendas_outras_regioes" class="form-control" value="${metas.ecommerce?.qtd_vendas_outras_regioes || 0}"></div>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-dark fw-bold px-4">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalMetasInd" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <form action="/admin/metas" method="POST">
                    <div class="modal-header bg-dark text-white border-0">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-bullseye me-2 text-primary"></i> Metas Gerais: Indústria</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 row">
                        <input type="hidden" name="setor" value="industria">
                        <div class="col-md-6 mb-3">
                            <label class="form-label text-muted small fw-bold text-uppercase">Meta Faturamento (R$)</label>
                            <input type="text" name="meta_geral" class="form-control fw-bold text-success mascara-moeda" value="${metas.industria?.meta_geral || 0}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label text-muted small fw-bold text-uppercase">Valor Cliente Grande (R$)</label>
                            <input type="text" name="valor_cliente_grande" class="form-control mascara-moeda" value="${metas.industria?.valor_cliente_grande || 0}">
                        </div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Prosp. S/ Visita</label><input type="number" name="qtd_prosp_sem_visita" class="form-control" value="${metas.industria?.qtd_prosp_sem_visita || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Prosp. C/ Visita</label><input type="number" name="qtd_prosp_com_visita" class="form-control" value="${metas.industria?.qtd_prosp_com_visita || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Novos Clientes</label><input type="number" name="qtd_clientes_fechar" class="form-control" value="${metas.industria?.qtd_clientes_fechar || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">QTD Cli. Grande</label><input type="number" name="qtd_cliente_grande" class="form-control" value="${metas.industria?.qtd_cliente_grande || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Pós-Venda</label><input type="number" name="qtd_pos_venda" class="form-control" value="${metas.industria?.qtd_pos_venda || 0}"></div>
                        <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Visita Cart.</label><input type="number" name="qtd_visitas_carteira" class="form-control" value="${metas.industria?.qtd_visitas_carteira || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted text-uppercase">Reativações</label><input type="number" name="qtd_reativacoes" class="form-control" value="${metas.industria?.qtd_reativacoes || 0}"></div>
                        <div class="col-md-6 mb-2"><label class="form-label small text-muted text-uppercase">Taxa Retenção (%)</label><input type="number" step="0.01" name="taxa_retencao" class="form-control" value="${metas.industria?.taxa_retencao || 0}"></div>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-dark fw-bold px-4">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalMetaGlobal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <form action="/admin/meta-global" method="POST">
                    <div class="modal-header bg-dark text-white border-0">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-globe me-2 text-primary"></i> Definir Metas da Empresa</h5>
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
                        </div>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-dark fw-bold px-4">Salvar</button>
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
                    <div class="modal-header bg-dark text-white border-0">
                        <h5 class="modal-title fw-bold"><i class="fa-solid fa-sack-dollar me-2 text-primary"></i> Ajuste de Faturamento</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <input type="hidden" name="vendedor_id" value="${u.id}">
                        <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                            <img src="${u.foto || 'https://via.placeholder.com/40'}" width="50" height="50" class="rounded-circle border me-3 shadow-sm" style="object-fit: cover;">
                            <div><h6 class="fw-bold text-dark mb-0">${u.nome}</h6><span class="text-muted small text-uppercase">${u.setor}</span></div>
                        </div>
                        <label class="form-label text-muted small fw-bold text-uppercase">Adicionar Faturamento Base (R$)</label>
                        <input type="text" name="faturamento_manual" class="form-control form-control-lg mb-2 fw-bold text-success mascara-moeda" value="${u.faturamento_manual || 0}" required>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-dark fw-bold px-4">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    `).join('')}

    <div class="modal fade" id="modalGerenciarUsuarios" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <div class="modal-header bg-dark text-white border-0">
                    <h5 class="modal-title fw-bold"><i class="fa-solid fa-users-gear me-2 text-primary"></i> Gerenciar Equipe</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body overflow-auto p-0">
                    <table class="table align-middle table-hover mb-0">
                        <thead class="bg-light"><tr><th class="ps-4">Foto</th><th>Nome</th><th>Setor</th><th>Tipo</th><th class="text-end pe-4">Ações</th></tr></thead>
                        <tbody>
                            ${usuarios.map(u => `
                                <tr>
                                    <td class="ps-4"><img src="${u.foto || 'https://via.placeholder.com/40'}" width="40" height="40" class="rounded-circle border" style="object-fit: cover;"></td>
                                    <td class="fw-medium text-dark">${u.nome}</td>
                                    <td><span class="badge bg-${u.setor === 'ecommerce' ? 'primary' : (u.setor === 'industria' ? 'warning text-dark' : 'dark')}">${u.setor.toUpperCase()}</span></td>
                                    <td class="text-dark">${u.tipo}</td>
                                    <td class="text-end pe-4">
                                        ${u.tipo === 'vendedor' ? `<button class="btn btn-sm btn-light border text-success" data-bs-toggle="modal" data-bs-target="#modalMetasUsuario${u.id}" title="Metas Individuais"><i class="fa-solid fa-bullseye"></i></button>` : ''}
                                        <button class="btn btn-sm btn-light border text-primary" data-bs-toggle="modal" data-bs-target="#modalEditarUsuario${u.id}" title="Editar Perfil"><i class="fa-solid fa-pen"></i></button>
                                        <button class="btn btn-sm btn-light border text-danger" data-bs-toggle="modal" data-bs-target="#modalExcluirUsuario${u.id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer border-0 bg-light">
                    <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>

    ${usuarios.map(u => {
        let conquistasHtml = '';
        if (u.tipo === 'vendedor') {
            const clientesU = todosClientes.filter(c => c.vendedor_id === u.id);
            const kpiSem = clientesU.filter(c => c.prospeccao === 'sem_visita').length;
            const kpiCom = clientesU.filter(c => c.prospeccao === 'com_visita').length;
            const kpiNovos = clientesU.filter(c => c.fechou === 'sim').length;
            const valorMinGrande = u.valor_cliente_grande > 0 ? u.valor_cliente_grande : (u.setor === 'ecommerce' ? 5000 : 15000);
            const kpiGrande = clientesU.filter(c => c.fechou === 'sim' && (c.valor_venda >= valorMinGrande || c.cliente_grande === 'sim')).length;
            const kpiPos = clientesU.filter(c => c.pos_venda === 'sim').length;
            const kpiVisita = clientesU.filter(c => c.carteira === 'sim' && c.prospeccao === 'com_visita').length;
            const kpiReativ = clientesU.filter(c => c.parado === 'sim' && c.fechou === 'sim').length;
            const kpiOutrasRegioes = clientesU.filter(c => c.regiao && c.regiao.trim() !== '' && c.fechou === 'sim').length;
            const kpiCarteira = clientesU.filter(c => c.carteira === 'sim').length;
            const kpiFidel = clientesU.filter(c => c.carteira === 'sim' && c.comprou_recorrente === 'sim').length;
            const taxaInd = kpiCarteira > 0 ? (kpiFidel / kpiCarteira) * 100 : 0;
            const metasSetor = u.setor === 'ecommerce' ? metas.ecommerce : metas.industria;
            const m_sem = u.qtd_prosp_sem_visita > 0 ? u.qtd_prosp_sem_visita : (metasSetor?.qtd_prosp_sem_visita || 0);
            const m_com = u.qtd_prosp_com_visita > 0 ? u.qtd_prosp_com_visita : (metasSetor?.qtd_prosp_com_visita || 0);
            const m_novos = u.qtd_clientes_fechar > 0 ? u.qtd_clientes_fechar : (metasSetor?.qtd_clientes_fechar || 0);
            const m_grande = u.qtd_cliente_grande > 0 ? u.qtd_cliente_grande : (metasSetor?.qtd_cliente_grande || 0);
            const m_pos = u.qtd_pos_venda > 0 ? u.qtd_pos_venda : (metasSetor?.qtd_pos_venda || 0);
            const m_visita = u.qtd_visitas_carteira > 0 ? u.qtd_visitas_carteira : (metasSetor?.qtd_visitas_carteira || 0);
            const m_reativ = u.qtd_reativacoes > 0 ? u.qtd_reativacoes : (metasSetor?.qtd_reativacoes || 0);
            const m_outras = u.qtd_vendas_outras_regioes > 0 ? u.qtd_vendas_outras_regioes : (metasSetor?.qtd_vendas_outras_regioes || 0);
            const m_taxa = u.taxa_retencao > 0 ? u.taxa_retencao : (metasSetor?.taxa_retencao || 40);
            const vAlcancadoGlobal = (Number(alcancadoGlobal) || 0) + somaManualTotal;
            const vMetaGlobal = Number(metaGlobal) || 0;
            const globalHit = (vMetaGlobal > 0 && vAlcancadoGlobal >= vMetaGlobal);

            const achievementCard = (titulo, atual, meta, pontos, icone, type = 'number') => {
                let hit = false;
                let progresso = '';
                if (type === 'global') { hit = globalHit; progresso = hit ? 'Meta Batida!' : 'Aguardando Equipe'; }
                else if (type === 'percent') { hit = atual >= meta && meta > 0; progresso = `${atual.toFixed(1)}% / ${meta}%`; }
                else { hit = atual >= meta && meta > 0; progresso = `${atual} / ${meta}`; }
                const bgClass = hit ? 'bg-success-subtle border-success' : 'bg-light border-secondary-subtle';
                const textClass = hit ? 'text-success' : 'text-muted';
                const iconColor = hit ? 'text-success' : 'text-secondary';
                const pointBadge = hit ? `<span class="badge bg-success shadow-sm">+${pontos} pts</span>` : `<span class="badge bg-secondary shadow-sm opacity-50">+${pontos} pts</span>`;
                const glowAchievement = hit ? 'glow-success' : '';
                return `<div class="col-md-6 mb-3 animate-up"><div class="card h-100 border ${bgClass} shadow-sm ${glowAchievement}"><div class="card-body p-3 d-flex align-items-center"><div class="rounded-circle bg-white d-flex align-items-center justify-content-center border shadow-sm me-3" style="width: 45px; height: 45px; flex-shrink: 0;"><i class="fa-solid ${icone} ${iconColor} fs-5"></i></div><div class="flex-grow-1"><h6 class="mb-1 fw-bold ${textClass}" style="font-size: 0.8rem;">${titulo} ${hit ? '<i class="fa-solid fa-circle-check ms-1 text-success"></i>' : ''}</h6><div class="small ${hit ? 'text-dark fw-medium' : 'text-muted'}" style="font-size: 0.75rem;">${progresso}</div></div><div class="ms-2">${pointBadge}</div></div></div></div>`;
            };

            conquistasHtml = `
                <div class="modal fade" id="modalPontosUsuario${u.id}" tabindex="-1">
                    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content border-0 shadow-lg animate-modal">
                            <div class="modal-header bg-dark text-white border-0 d-flex align-items-center">
                                <img src="${u.foto || 'https://via.placeholder.com/40'}" width="40" height="40" class="rounded-circle border border-2 border-primary me-3 shadow-sm" style="object-fit: cover;">
                                <div><h5 class="modal-title fw-bold mb-0"><i class="fa-solid fa-trophy text-primary me-2"></i> Conquistas: ${u.nome}</h5><span class="badge bg-primary mt-1"><i class="fa-solid fa-star me-1"></i> ${u.pontuacao} Pontos</span></div>
                                <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body p-4 bg-light-subtle row">
                                ${achievementCard('Meta Global Equipe', 0, 0, 30, 'fa-earth-americas', 'global')}
                                ${achievementCard('Prosp. Sem Visita', kpiSem, m_sem, 10, 'fa-phone')}
                                ${achievementCard('Prosp. Com Visita', kpiCom, m_com, 30, 'fa-handshake')}
                                ${achievementCard('Novos Clientes', kpiNovos, m_novos, 30, 'fa-user-check')}
                                ${achievementCard('Cliente Grande', kpiGrande, m_grande, 20, 'fa-gem')}
                                ${achievementCard('Pós-Venda', kpiPos, m_pos, 20, 'fa-headset')}
                                ${achievementCard('Visitas Carteira', kpiVisita, m_visita, 20, 'fa-car')}
                                ${achievementCard('Reativações', kpiReativ, m_reativ, 20, 'fa-rotate-right')}
                                ${u.setor === 'ecommerce' ? achievementCard('Vendas Outras Regiões', kpiOutrasRegioes, m_outras, 20, 'fa-map-location-dot') : achievementCard('Taxa de Retenção', taxaInd, m_taxa, 20, 'fa-chart-pie', 'percent')}
                            </div>
                            <div class="modal-footer border-0 bg-light">
                                <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
        ${conquistasHtml}
        ${u.tipo === 'vendedor' ? `
        <div class="modal fade" id="modalMetasUsuario${u.id}" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg animate-modal">
                    <form action="/admin/usuario/metas" method="POST">
                        <div class="modal-header bg-dark text-white border-0">
                            <h5 class="modal-title fw-bold"><i class="fa-solid fa-bullseye me-2 text-primary"></i> Metas: ${u.nome}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4 row">
                            <input type="hidden" name="vendedor_id" value="${u.id}">
                            <div class="col-md-6 mb-3"><label class="form-label small text-muted fw-bold text-uppercase">Meta Individual (R$)</label><input type="text" name="meta_geral" class="form-control text-success fw-bold mascara-moeda" value="${u.meta_geral || 0}"></div>
                            <div class="col-md-6 mb-3"><label class="form-label small text-muted fw-bold text-uppercase">Vlr Cliente Grande (R$)</label><input type="text" name="valor_cliente_grande" class="form-control mascara-moeda" value="${u.valor_cliente_grande || 0}"></div>
                            <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Prosp S/ Visita</label><input type="number" name="qtd_prosp_sem_visita" class="form-control" value="${u.qtd_prosp_sem_visita || 0}"></div>
                            <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Prosp C/ Visita</label><input type="number" name="qtd_prosp_com_visita" class="form-control" value="${u.qtd_prosp_com_visita || 0}"></div>
                            <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Novos Clientes</label><input type="number" name="qtd_clientes_fechar" class="form-control" value="${u.qtd_clientes_fechar || 0}"></div>
                            <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Cli. Grande</label><input type="number" name="qtd_cliente_grande" class="form-control" value="${u.qtd_cliente_grande || 0}"></div>
                            <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Pós-Venda</label><input type="number" name="qtd_pos_venda" class="form-control" value="${u.qtd_pos_venda || 0}"></div>
                            <div class="col-md-4 mb-2"><label class="form-label small text-muted text-uppercase">Visita Cart.</label><input type="number" name="qtd_visitas_carteira" class="form-control" value="${u.qtd_visitas_carteira || 0}"></div>
                            <div class="col-md-6 mb-2"><label class="form-label small text-muted text-uppercase">Reativações</label><input type="number" name="qtd_reativacoes" class="form-control" value="${u.qtd_reativacoes || 0}"></div>
                            ${u.setor === 'industria' ? `<div class="col-md-6 mb-2"><label class="form-label small text-muted text-uppercase">Taxa Retenção (%)</label><input type="number" step="0.01" name="taxa_retencao" class="form-control" value="${u.taxa_retencao || 0}"></div>` : ''}
                        </div>
                        <div class="modal-footer border-0 bg-light">
                            <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-dark fw-bold px-4">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="modal fade" id="modalEditarUsuario${u.id}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg animate-modal">
                    <form action="/admin/usuario/editar" method="POST" enctype="multipart/form-data">
                        <div class="modal-header bg-dark text-white border-0"><h5 class="modal-title fw-bold"><i class="fa-solid fa-pen me-2 text-primary"></i> Perfil: ${u.nome}</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                        <div class="modal-body p-4">
                            <input type="hidden" name="id" value="${u.id}">
                            <label class="form-label text-muted small fw-bold text-uppercase">Nome</label><input type="text" name="nome" class="form-control mb-3" value="${u.nome}" required>
                            <label class="form-label text-muted small fw-bold text-uppercase">Token</label><input type="text" name="token" class="form-control mb-3" value="${u.token}" required>
                            <label class="form-label text-muted small fw-bold text-uppercase">Foto</label><input type="file" name="foto" class="form-control mb-3" accept="image/*">
                            <div class="row">
                                <div class="col-6"><label class="form-label text-muted small text-uppercase">Tipo</label><select name="tipo" class="form-select"><option value="vendedor" ${u.tipo === 'vendedor' ? 'selected' : ''}>Vendedor</option><option value="admin" ${u.tipo === 'admin' ? 'selected' : ''}>Admin</option></select></div>
                                <div class="col-6"><label class="form-label text-muted small text-uppercase">Setor</label><select name="setor" class="form-select"><option value="ecommerce" ${u.setor === 'ecommerce' ? 'selected' : ''}>E-commerce</option><option value="industria" ${u.setor === 'industria' ? 'selected' : ''}>Indústria</option><option value="admin" ${u.setor === 'admin' ? 'selected' : ''}>Geral</option></select></div>
                            </div>
                        </div>
                        <div class="modal-footer border-0 bg-light">
                            <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-dark fw-bold px-4">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalExcluirUsuario${u.id}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg animate-modal">
                    <form action="/admin/usuario/excluir" method="POST">
                        <div class="modal-header bg-dark text-white border-0"><h5 class="modal-title fw-bold"><i class="fa-solid fa-triangle-exclamation me-2 text-danger"></i> Atenção!</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                        <div class="modal-body p-4 text-center">
                            <input type="hidden" name="id" value="${u.id}"><p class="text-dark">Excluir o usuário <strong>${u.nome}</strong>? Esta ação é irreversível.</p>
                        </div>
                        <div class="modal-footer border-0 bg-light">
                            <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-dark fw-bold px-4">Excluir</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    }).join('')}

    ${todosClientes.map((c, index) => {
        if (!c.observacao) return '';
        return `
        <div class="modal fade" id="modalObsAdmin${index}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg animate-modal">
                    <div class="modal-header bg-dark text-white border-0"><h6 class="modal-title fw-bold"><i class="fa-solid fa-note-sticky me-2 text-primary"></i> Anotações</h6><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body p-4">
                        <div class="d-flex align-items-center mb-3 pb-3 border-bottom"><div class="bg-light p-3 rounded-circle me-3"><i class="fa-solid fa-building text-primary fa-2x"></i></div><div><h5 class="fw-bold text-dark mb-0">${c.nome}</h5><span class="text-muted small">${c.regiao || ''}</span></div></div>
                        <p class="mb-0 text-dark" style="white-space: pre-wrap;">${c.observacao}</p>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('')}

    <div class="modal fade" id="modalZerarCiclo" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg animate-modal">
                <form id="formZerarCiclo">
                    <div class="modal-header bg-dark text-white border-0"><h5 class="modal-title fw-bold"><i class="fa-solid fa-rotate-right me-2 text-danger"></i> Fechar Mês</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                    <div class="modal-body p-4 text-center">
                        <p class="text-dark">Arquivar dados atuais e <strong>zerar métricas</strong>? Os clientes serão movidos para o histórico com segurança.</p>
                    </div>
                    <div class="modal-footer border-0 bg-light">
                        <button type="button" class="btn btn-secondary fw-bold" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-dark fw-bold px-4">Confirmar Fechamento</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalFechamentoSucesso" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg text-center p-4 animate-modal">
                <div class="mb-3"><i class="fa-solid fa-circle-check text-success" style="font-size: 4.5rem;"></i></div>
                <h4 class="fw-bold text-dark">Mês Fechado com Sucesso!</h4>
                <div class="d-grid gap-2 mt-4">
                    <a id="btnDownloadFechamento" href="#" class="btn btn-success fw-bold py-2 shadow-sm" download><i class="fa-solid fa-download me-2"></i> Baixar Relatório do Ciclo</a>
                    <button type="button" class="btn btn-secondary fw-bold py-2" onclick="window.location.reload()">Voltar ao Painel</button>
                </div>
            </div>
        </div>
    </div>

    <script>
    document.addEventListener("DOMContentLoaded", function() {
        const formZerar = document.getElementById('formZerarCiclo');
        if(formZerar) {
            formZerar.addEventListener('submit', async function(e) {
                e.preventDefault();
                const btnSubmit = this.querySelector('button[type="submit"]');
                btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Processando...'; btnSubmit.disabled = true;
                try {
                    const response = await fetch('/admin/zerar-ciclo', { method: 'POST', headers: { 'Accept': 'application/json' } });
                    const data = await response.json();
                    if(data.success) {
                        bootstrap.Modal.getInstance(document.getElementById('modalZerarCiclo')).hide();
                        document.getElementById('btnDownloadFechamento').href = data.downloadUrl;
                        new bootstrap.Modal(document.getElementById('modalFechamentoSucesso')).show();
                    } else { alert('Erro ao fechar ciclo.'); window.location.reload(); }
                } catch(err) { window.location.reload(); }
            });
        }
        const aplicarMascaraMoeda = (input) => {
            let valor = input.value; if (valor === "") return;
            valor = valor.replace('R$', '').trim(); if (valor.includes('.') && !valor.includes(',')) { valor = Number(valor).toFixed(2); }
            const isNegativo = valor.startsWith('-'); valor = valor.replace(/\\D/g, ""); if (valor === "") { input.value = ""; return; }
            valor = (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            if(isNegativo) valor = '-' + valor; input.value = valor;
        };
        document.querySelectorAll('.mascara-moeda').forEach(input => {
            aplicarMascaraMoeda(input); input.addEventListener('input', (e) => aplicarMascaraMoeda(e.target));
        });
        document.querySelectorAll('form').forEach(form => {
            if (form.id === 'formZerarCiclo') return;
            form.addEventListener('submit', () => {
                form.querySelectorAll('.mascara-moeda').forEach(input => {
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
        const itensPorPagina = 12; let paginaAtual = 1; let linhasAtuais = [...todasLinhas];
        function aplicarFiltros() {
            const termo = inputTexto.value.toLowerCase();
            linhasAtuais = todasLinhas.filter(linha => linha.getAttribute('data-busca').includes(termo));
            paginaAtual = 1; renderizarTabela();
        }
        function renderizarTabela() {
            todasLinhas.forEach(l => l.style.display = 'none');
            if (linhasAtuais.length === 0) { linhaVazia.style.display = ''; containerPaginacao.innerHTML = ''; return; }
            else { linhaVazia.style.display = 'none'; }
            const totalPaginas = Math.ceil(linhasAtuais.length / itensPorPagina);
            const inicio = (paginaAtual - 1) * itensPorPagina;
            const fim = inicio + itensPorPagina;
            linhasAtuais.slice(inicio, fim).forEach(l => l.style.display = '');
            renderizarPaginacao(totalPaginas);
        }
        function renderizarPaginacao(totalPaginas) {
            containerPaginacao.innerHTML = ''; if (totalPaginas <= 1) return;
            const ul = document.createElement('ul'); ul.className = 'pagination pagination-sm shadow-sm mb-0';
            ul.appendChild(criarBotaoPagina('<', paginaAtual - 1, paginaAtual === 1));
            for (let i = 1; i <= totalPaginas; i++) { if (totalPaginas > 5 && Math.abs(i - paginaAtual) > 2 && i !== 1 && i !== totalPaginas) continue; ul.appendChild(criarBotaoPagina(i, i, false, i === paginaAtual)); }
            ul.appendChild(criarBotaoPagina('>', paginaAtual + 1, paginaAtual === totalPaginas));
            containerPaginacao.appendChild(ul);
        }
        function criarBotaoPagina(texto, alvo, disabled = false, active = false) {
            const li = document.createElement('li'); li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
            const a = document.createElement('a'); a.className = 'page-link fw-bold'; a.style.cursor = disabled ? 'default' : 'pointer';
            if(active) { a.classList.add('bg-primary', 'text-white', 'border-primary'); } else { a.classList.add('text-dark'); }
            a.innerHTML = texto; if (!disabled && !active) { a.onclick = (e) => { e.preventDefault(); paginaAtual = alvo; renderizarTabela(); }; }
            li.appendChild(a); return li;
        }
        inputTexto.addEventListener('input', aplicarFiltros); aplicarFiltros();
    });
    </script>
    `);
};