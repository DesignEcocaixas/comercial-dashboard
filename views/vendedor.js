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
        <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
            <div class="modal-content shadow-lg border-0 animate-modal">
                <div class="modal-header bg-light border-0">
                    <h6 class="modal-title fw-bold text-dark"><i class="fa-solid fa-list me-2 text-primary"></i> ${titulo}</h6>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0" style="font-size: 0.9rem;">
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
                                            ${c.observacao ? `<br><small class="text-muted"><i class="fa-solid fa-note-sticky me-1"></i>${c.observacao}</small>` : ''}
                                        </td>
                                        <td class="py-2 text-end pe-3 fw-bold text-success">${formatarBRL(c.valor_venda)}</td>
                                        <td class="py-2">${c.fechou === 'sim' ? '<span class="badge bg-success-subtle text-success border border-success-subtle" style="font-size: 0.75rem;">Fechou</span>' : '<span class="badge bg-light text-muted border" style="font-size: 0.75rem;">Pendente</span>'}</td>
                                    </tr>
                                `).join('') : `<tr><td colspan="3" class="text-center text-muted py-5">Nenhum registro encontrado.</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

module.exports = (usuario, clientes, metas, kpis, metaGlobal, alcancadoGlobal, usuarios = [], todosClientes = []) => {

    const minGrande = usuario.setor === 'ecommerce' ? 5000 : 15000;
    
    const totalCarteira = kpis.total_carteira || 0;
    const totalFidelizados = kpis.total_fidelizados || 0;
    const taxaRetencaoAlcancada = totalCarteira > 0 ? (totalFidelizados / totalCarteira) * 100 : 0;

    return layout(`
    
    ${loading()}
    ${menuLateral(usuario)}

    <style>
        .main-container {
            width: 85%;
            margin: 0 auto;
            font-size: 0.95rem;
            padding-top: 2rem;
        }
        @media (max-width: 768px) {
            .main-container { width: 98%; padding-top: 0.5rem; }
            .kpi-card h6 { font-size: 0.7rem !important; }
            .kpi-card span { font-size: 0.9rem !important; }
        }
        
        .animate-up { animation: fadeInUp 0.5s ease backwards; }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-modal { animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes zoomIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
    </style>

    <div class="main-content-wrapper">
        <div class="main-container">

            <div class="row mb-4 align-items-stretch">
                
                ${(() => {
                    const vAlcancado = Number(alcancadoGlobal) || 0;
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
                                    ${[...usuarios].sort((a, b) => b.pontuacao - a.pontuacao).map((u, index) => `
                                        <tr style="cursor: pointer; transition: 0.2s; ${u.id === usuario.id ? 'background-color: #f1f3f5; border-left: 3px solid #0d6efd;' : ''}" onmouseover="this.style.backgroundColor='#e9ecef'" onmouseout="this.style.backgroundColor='${u.id === usuario.id ? '#f1f3f5' : 'transparent'}'" data-bs-toggle="modal" data-bs-target="#modalPontosUsuario${u.id}" title="Ver Conquistas">
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
                                            <tr class="${u.id === usuario.id ? 'bg-light' : ''}">
                                                <td class="ps-3 py-2">
                                                    <div class="d-flex align-items-center">
                                                        <img src="${u.foto || 'https://via.placeholder.com/40'}" width="32" height="32" class="rounded-circle border me-2 shadow-sm" style="object-fit: cover;">
                                                        <span class="fw-bold ${u.id === usuario.id ? 'text-primary' : 'text-dark'}" style="font-size: 0.85rem;">${u.nome}</span>
                                                    </div>
                                                </td>
                                                <td class="text-end pe-3 py-2">
                                                    <strong class="text-success" style="font-size: 0.9rem;">${formatarBRL(u.totalVendido)}</strong>
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
                                    <tr class="cliente-row" data-nome="${c.nome.toLowerCase()}" data-pos="${c.pos_venda || ''}" data-rec="${c.comprou_recorrente || ''}">
                                        <td class="ps-4 fw-bold text-dark">
                                            ${c.nome}
                                            ${c.cliente_grande === 'sim' ? '<span class="badge bg-warning text-dark ms-1" style="font-size: 0.6rem;"><i class="fa-solid fa-star"></i> GRANDE</span>' : ''}
                                            ${c.observacao ? `<br><small class="text-muted fw-normal" style="font-size: 0.75rem;"><i class="fa-solid fa-note-sticky text-warning me-1"></i>${c.observacao}</small>` : ''}
                                        </td>
                                        <td>${c.fechou === 'sim' ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Fechado</span>' : '<span class="badge bg-light text-muted border">Pendente</span>'}</td>
                                        <td class="fw-medium">${formatarBRL(c.valor_venda)}</td> 
                                        <td>
                                            ${c.fechou === 'sim' ? `
                                            <form action="/vendedor/posvenda" method="POST" class="d-inline">
                                                <input type="hidden" name="id" value="${c.id}">
                                                <select name="pos_venda" class="form-select form-select-sm d-inline w-auto bg-light-subtle border-0 py-1" onchange="this.form.submit()">
                                                    <option value="pendente" ${c.pos_venda === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
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
                                            <button class="btn btn-sm btn-light text-primary border shadow-sm" data-bs-toggle="modal" data-bs-target="#modalEditar${c.id}" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                                            <button class="btn btn-sm btn-light text-danger border shadow-sm" data-bs-toggle="modal" data-bs-target="#modalExcluir${c.id}" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
                                        </td>
                                    </tr>

                                    <div class="modal fade" id="modalEditar${c.id}" tabindex="-1">
                                        <div class="modal-dialog modal-dialog-centered">
                                            <div class="modal-content border-0 shadow-lg animate-modal">
                                                <form action="/vendedor/cliente/editar" method="POST">
                                                    <div class="modal-header bg-warning border-0"><h5 class="modal-title fw-bold text-dark"><i class="fa-solid fa-edit me-2"></i> Ajustar Registro</h5></div>
                                                    <div class="modal-body p-4">
                                                        <input type="hidden" name="id" value="${c.id}">
                                                        <label class="form-label small text-muted">Nome do Cliente</label>
                                                        <input type="text" name="nome" class="form-control mb-3" value="${c.nome}" required>
                                                        
                                                        <div class="row">
                                                            <div class="col-6">
                                                                <label class="form-label small text-muted">Origem</label>
                                                                <select name="prospeccao" class="form-select mb-3">
                                                                    <option value="com_visita" ${c.prospeccao === 'com_visita' ? 'selected' : ''}>Com Visita</option>
                                                                    <option value="sem_visita" ${c.prospeccao === 'sem_visita' ? 'selected' : ''}>Sem Visita</option>
                                                                </select>
                                                            </div>
                                                            <div class="col-6">
                                                                <label class="form-label small text-muted">Status</label>
                                                                <select name="fechou" class="form-select mb-3">
                                                                    <option value="sim" ${c.fechou === 'sim' ? 'selected' : ''}>Fechado</option>
                                                                    <option value="nao" ${c.fechou === 'nao' ? 'selected' : ''}>Pendente</option>
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
                                                    <div class="modal-footer border-0">
                                                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">CANCELAR</button>
                                                        <button type="submit" class="btn btn-warning fw-bold px-4">SALVAR MUDANÇAS</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="modal fade" id="modalExcluir${c.id}" tabindex="-1">
                                        <div class="modal-dialog modal-dialog-centered">
                                            <div class="modal-content border-0 shadow animate-modal">
                                                <form action="/vendedor/cliente/excluir" method="POST">
                                                    <div class="modal-header bg-danger text-white border-0"><h5 class="modal-title fw-bold"><i class="fa-solid fa-trash-can me-2"></i> REMOVER REGISTRO</h5></div>
                                                    <div class="modal-body p-4 text-center">
                                                        <input type="hidden" name="id" value="${c.id}">
                                                        <p>Excluir o cliente <strong>${c.nome}</strong>?</p>
                                                        <small class="text-danger fw-bold">Isso afetará sua pontuação imediatamente.</small>
                                                    </div>
                                                    <div class="modal-footer border-0 justify-content-center">
                                                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">NÃO, VOLTAR</button>
                                                        <button type="submit" class="btn btn-danger px-5 fw-bold">SIM, EXCLUIR</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div id="paginacaoContainer" class="d-flex justify-content-center mt-3 mb-3"></div>
                </div>
            </div>
            
        </div> 
    </div>

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
                    <div class="modal-header bg-primary text-white border-0"><h5 class="modal-title fw-bold"><i class="fa-solid fa-plus-circle me-2"></i> Novo Registro Comercial</h5></div>
                    <div class="modal-body p-4">
                        <label class="form-label small text-muted">Nome da Empresa / Cliente</label>
                        <input type="text" name="nome" class="form-control mb-3" required placeholder="Ex: Pizzaria A">
                        
                        <div class="row">
                            <div class="col-6">
                                <label class="form-label small text-muted">Origem</label>
                                <select name="prospeccao" class="form-select mb-3" required>
                                    <option value="">Selecione...</option>
                                    <option value="com_visita">Com Visita</option>
                                    <option value="sem_visita">Sem Visita</option>
                                </select>
                            </div>
                            <div class="col-6">
                                <label class="form-label small text-muted">Venda?</label>
                                <select name="fechou" class="form-select mb-3" required>
                                    <option value="">Selecione...</option>
                                    <option value="sim">Fechada</option>
                                    <option value="nao">Pendente</option>
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
                                <label class="form-check-label small" for="cliente_grande">Cliente Grande?</label>
                            </div>
                        </div>
                        
                        <label class="form-label small text-muted">Cidade / Região</label>
                        <input type="text" name="regiao" class="form-control mb-3" placeholder="Obrigatório p/ Bônus de Região">

                        <label class="form-label small text-muted">Observações (Opcional)</label>
                        <textarea name="observacao" class="form-control mb-2" rows="2" placeholder="Anotações extras sobre o cliente ou negociação..."></textarea>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">DESCARTAR</button>
                        <button type="submit" class="btn btn-primary fw-bold px-4"><i class="fa-solid fa-check-circle me-1"></i> SALVAR E COMPUTAR</button>
                    </div>
                </form>
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
        const kpiOutrasRegioes = clientesU.filter(c => c.regiao && c.regiao.trim() !== '' && c.fechou === 'sim').length;
        
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

        const vAlcancadoGlobal = Number(alcancadoGlobal) || 0; // faturamento_manual já vem incluso de app.js
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
                <div class="col-md-6 mb-3">
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
                                <span class="badge bg-warning text-dark mt-1"><i class="fa-solid fa-star me-1"></i> ${u.pontuacao} Pontos Totais</span>
                            </div>
                            <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4 bg-light-subtle">
                            <h6 class="fw-bold text-muted mb-3 text-uppercase" style="font-size: 0.8rem; letter-spacing: 1px;">Metas Alcançadas</h6>
                            <div class="row">
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

        inputTexto.addEventListener('input', aplicarFiltros);
        selectPos.addEventListener('change', aplicarFiltros);
        selectRec.addEventListener('change', aplicarFiltros);

        aplicarFiltros();
    });
    </script>
`);
};