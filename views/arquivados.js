const layout = require('./layout');

const formatarBRL = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
};

const formatarDataInput = (dataStr) => {
    if (!dataStr) return '';
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

module.exports = (usuarioLogado, clientes, vendedores) => {

    // 1. LÓGICA: Extrair automaticamente os Anos e Meses que possuem clientes arquivados
    const anosSet = new Set();
    const mesesSet = new Set();

    clientes.forEach(c => {
        const dataStr = c.data_fechamento || c.data_prospeccao || c.data_criacao;
        if (dataStr) {
            const d = new Date(dataStr);
            if (!isNaN(d.getTime())) {
                anosSet.add(d.getFullYear().toString());
                // Extrai o mês com dois dígitos (ex: "03" para março)
                mesesSet.add((d.getMonth() + 1).toString().padStart(2, '0'));
            }
        }
    });

    // Ordena do ano mais recente para o mais antigo
    const anosDisponiveis = Array.from(anosSet).sort((a, b) => b - a);

    // Dicionário para traduzir o número do mês para o nome
    const nomesMeses = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
        '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
        '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };

    // Ordena os meses disponíveis de Jan a Dez e monta um objeto
    const mesesDisponiveis = Array.from(mesesSet).sort().map(num => ({
        valor: num,
        nome: nomesMeses[num]
    }));

    return layout(`
    
    <style>
        .container-85 { width: 85%; margin: 0 auto; font-size: 0.95rem; padding-top: 1rem; }
        @media (max-width: 992px) { .container-85 { width: 98%; padding-top: 0.5rem; } }
        .animate-up { animation: fadeInUp 0.4s ease backwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-modal { animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    </style>

    <div class="container-85 mb-5">
        
        <header class="d-flex justify-content-between align-items-center bg-white p-3 shadow-sm rounded border mb-4 animate-up">
            <div class="d-flex align-items-center">
                <div class="bg-secondary-subtle p-3 rounded-circle me-3 d-flex justify-content-center align-items-center" style="width: 50px; height: 50px;">
                    <i class="fa-solid fa-box-archive fa-lg text-secondary"></i>
                </div>
                <div>
                    <h5 class="mb-0 fw-bold text-dark">Histórico: Clientes Arquivados</h5>
                    <span class="text-muted small">Gerenciamento de ciclos anteriores</span>
                </div>
            </div>
            <div>
                <a href="/admin" class="btn btn-sm btn-outline-secondary fw-bold px-3 shadow-sm"><i class="fa-solid fa-arrow-left me-1"></i> Voltar ao Dashboard</a>
            </div>
        </header>

        <div class="card shadow-sm rounded-3 border animate-up" style="animation-delay: 0.2s;">
            
            <div class="card-header bg-white py-3 border-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div class="d-flex align-items-center">
                    <i class="fa-solid fa-filter text-muted me-2"></i> <span class="fw-bold text-muted">Filtros de Busca</span>
                </div>
                
                <div class="d-flex flex-wrap gap-2 w-100 justify-content-md-end">
                    <select id="filtroAno" class="form-select form-select-sm" style="max-width: 120px;">
                        <option value="">Ano: Todos</option>
                        ${anosDisponiveis.map(a => `<option value="${a}">${a}</option>`).join('')}
                    </select>
                    
                    <select id="filtroMes" class="form-select form-select-sm" style="max-width: 140px;">
                        <option value="">Mês: Todos</option>
                        ${mesesDisponiveis.map(m => `<option value="${m.valor}">${m.nome}</option>`).join('')}
                    </select>

                    <select id="filtroVendedor" class="form-select form-select-sm" style="max-width: 180px;">
                        <option value="">Todos Vendedores</option>
                        ${vendedores.map(v => `<option value="${v.nome.toLowerCase()}">${v.nome}</option>`).join('')}
                    </select>

                    <div class="input-group input-group-sm" style="max-width: 250px;">
                        <span class="input-group-text bg-light border-end-0"><i class="fa-solid fa-search text-muted"></i></span>
                        <input type="text" id="filtroTexto" class="form-control border-start-0 ps-0" placeholder="Buscar cliente, local...">
                    </div>
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
                                <th class="py-3 text-muted small uppercase">Status / Valor</th>
                                <th class="text-end pe-4 py-3 text-muted small uppercase">Ações</th> 
                            </tr>
                        </thead>
                        <tbody id="tabelaArquivadosBody">
                            <tr id="linhaVazia" style="display: none;">
                                <td colspan="5" class="text-center text-muted py-5">
                                    <i class="fa-solid fa-box-open fa-2x mb-2 text-light-subtle"></i><br>
                                    Nenhum cliente arquivado corresponde aos filtros selecionados.
                                </td>
                            </tr>
                            
                            ${clientes.map((c, index) => {
        // Extraindo Mês e Ano individuais para preencher os 'data-attributes'
        let ano = '';
        let mes = '';
        const dataStr = c.data_fechamento || c.data_prospeccao || c.data_criacao;
        if (dataStr) {
            const d = new Date(dataStr);
            if (!isNaN(d.getTime())) {
                ano = d.getFullYear().toString();
                mes = (d.getMonth() + 1).toString().padStart(2, '0');
            }
        }

        return `
                                <tr class="cliente-row" data-vendedor="${(c.vendedor_nome || '').toLowerCase()}" data-texto="${(c.nome + ' ' + (c.regiao || '')).toLowerCase()}" data-ano="${ano}" data-mes="${mes}">
                                    
                                    <td class="ps-4 fw-bold text-dark">
                                        ${c.nome}
                                        <br><span class="text-muted fw-normal" style="font-size: 0.75rem;"><i class="fa-solid fa-location-dot text-danger me-1"></i> ${c.regiao || 'Não informado'}</span>
                                    </td>
                                    
                                    <td>
                                        <span class="badge bg-light text-dark border"><i class="fa-solid fa-user text-muted me-1"></i> ${c.vendedor_nome || 'Desconhecido'}</span>
                                    </td>
                                    
                                    <td>
                                        <div class="text-muted mb-1" style="font-size: 0.75rem;"><i class="fa-regular fa-calendar-plus text-primary me-1"></i> Prosp: <strong>${formatarData(c.data_prospeccao || c.data_criacao)}</strong></div>
                                        <div class="text-muted" style="font-size: 0.75rem;"><i class="fa-regular fa-calendar-check text-success me-1"></i> Fech: <strong>${formatarData(c.data_fechamento)}</strong></div>
                                    </td>
                                    
                                    <td>
                                        ${c.fechou === 'sim' ? '<span class="badge bg-success-subtle text-success border border-success-subtle mb-1 d-inline-block">Fechado</span>' : '<span class="badge bg-light text-muted border mb-1 d-inline-block">Pendente</span>'}<br>
                                        <span class="fw-medium text-dark" style="font-size: 0.9rem;">${formatarBRL(c.valor_venda)}</span>
                                    </td>
                                    
                                    <td class="text-end pe-4">
                                        ${c.observacao ? `<button class="btn btn-sm btn-outline-info rounded-circle shadow-sm me-1" data-bs-toggle="modal" data-bs-target="#modalObs${index}" title="Ver Observação"><i class="fa-solid fa-eye"></i></button>` : ''}
                                        <button class="btn btn-sm btn-light text-primary border shadow-sm me-1" data-bs-toggle="modal" data-bs-target="#modalEditar${c.id}" title="Editar Dados"><i class="fa-solid fa-pen-to-square"></i></button>
                                        <button class="btn btn-sm btn-light text-danger border shadow-sm" data-bs-toggle="modal" data-bs-target="#modalExcluir${c.id}" title="Excluir Definitivamente"><i class="fa-solid fa-trash-can"></i></button>
                                    </td>
                                </tr>
                                `
    }).join('')}
                        </tbody>
                    </table>
                </div>
                <div id="paginacaoContainer" class="d-flex justify-content-center mt-3 mb-3"></div>
            </div>
        </div>
    </div>

    ${clientes.map((c, index) => {
        if (!c.observacao) return '';
        return `
        <div class="modal fade" id="modalObs${index}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg animate-modal">
                    <div class="modal-header bg-info border-0">
                        <h6 class="modal-title fw-bold text-white"><i class="fa-solid fa-note-sticky me-2"></i> Anotações do Cliente</h6>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 text-center">
                        <p class="mb-0 text-dark" style="white-space: pre-wrap; font-size: 0.95rem;">${c.observacao}</p>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('')}

    ${clientes.map(c => `
        <div class="modal fade" id="modalEditar${c.id}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg animate-modal">
                    <form action="/admin/arquivados/editar" method="POST">
                        <div class="modal-header bg-warning border-0">
                            <h5 class="modal-title fw-bold text-dark"><i class="fa-solid fa-edit me-2"></i> Editar Cliente Arquivado</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
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
                            </div>
                            
                            <label class="form-label small text-muted">Região Estratégica</label>
                            <input type="text" name="regiao" class="form-control mb-3" value="${c.regiao || ''}">

                            <label class="form-label small text-muted">Observações</label>
                            <textarea name="observacao" class="form-control" rows="2">${c.observacao || ''}</textarea>
                        </div>
                        <div class="modal-footer border-0 bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-warning fw-bold px-4">Salvar Alterações</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalExcluir${c.id}" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow animate-modal">
                    <form action="/admin/arquivados/excluir" method="POST">
                        <div class="modal-header bg-danger text-white border-0"><h5 class="modal-title fw-bold"><i class="fa-solid fa-trash-can me-2"></i> Excluir Arquivado</h5></div>
                        <div class="modal-body p-4 text-center">
                            <input type="hidden" name="id" value="${c.id}">
                            <i class="fa-solid fa-circle-exclamation fa-3x text-danger mb-3"></i>
                            <p>Excluir permanentemente o cliente <strong>${c.nome}</strong>?</p>
                            <small class="text-muted">Esta ação não pode ser desfeita.</small>
                        </div>
                        <div class="modal-footer border-0 justify-content-center bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-danger px-5 fw-bold">Sim, Excluir</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `).join('')}

    <script>
    document.addEventListener("DOMContentLoaded", function() {
        const inputTexto = document.getElementById('filtroTexto');
        const selectVendedor = document.getElementById('filtroVendedor');
        const selectAno = document.getElementById('filtroAno');
        const selectMes = document.getElementById('filtroMes');
        const containerPaginacao = document.getElementById('paginacaoContainer');
        const linhaVazia = document.getElementById('linhaVazia');
        
        const todasLinhas = Array.from(document.querySelectorAll('.cliente-row'));
        const itensPorPagina = 12;
        let paginaAtual = 1;
        let linhasAtuais = [...todasLinhas];

        function aplicarFiltros() {
            const termo = inputTexto.value.toLowerCase();
            const vendedor = selectVendedor.value;
            const ano = selectAno.value;
            const mes = selectMes.value;

            linhasAtuais = todasLinhas.filter(linha => {
                const vVendedor = linha.getAttribute('data-vendedor');
                const vTexto = linha.getAttribute('data-texto');
                const vAno = linha.getAttribute('data-ano');
                const vMes = linha.getAttribute('data-mes');

                const passaTexto = vTexto.includes(termo);
                const passaVendedor = vendedor === '' || vVendedor === vendedor;
                const passaAno = ano === '' || vAno === ano;
                const passaMes = mes === '' || vMes === mes;

                return passaTexto && passaVendedor && passaAno && passaMes;
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
                a.classList.add('bg-secondary', 'text-white', 'border-secondary');
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
        selectVendedor.addEventListener('change', aplicarFiltros);
        selectAno.addEventListener('change', aplicarFiltros);
        selectMes.addEventListener('change', aplicarFiltros);
        
        aplicarFiltros();
    });
    </script>
    `);
};