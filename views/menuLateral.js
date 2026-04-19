module.exports = (usuario) => {
    const isAdmin = usuario.tipo === 'admin';
    
    let links = '';

    if (isAdmin) {
        links = `
            <small class="text-muted fw-bold px-3 mb-2 d-block text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Gerenciamento</small>
            <a href="#" class="nav-link text-dark mb-1" data-bs-toggle="modal" data-bs-target="#modalUsuario"><i class="fa-solid fa-user-plus me-2 text-primary"></i> Novo Usuário</a>
            <a href="#" class="nav-link text-dark mb-1" data-bs-toggle="modal" data-bs-target="#modalGerenciarUsuarios"><i class="fa-solid fa-users-gear me-2 text-primary"></i> Equipe</a>
            
            <small class="text-muted fw-bold px-3 mt-3 mb-2 d-block text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Configurar Metas</small>
            <a href="#" class="nav-link text-dark mb-1" data-bs-toggle="modal" data-bs-target="#modalMetasEco"><i class="fa-solid fa-cart-shopping me-2 text-primary"></i> Metas E-commerce</a>
            <a href="#" class="nav-link text-dark mb-1" data-bs-toggle="modal" data-bs-target="#modalMetasInd"><i class="fa-solid fa-industry me-2 text-primary"></i> Metas Indústria</a>
            <a href="#" class="nav-link text-dark mb-1" data-bs-toggle="modal" data-bs-target="#modalMetaGlobal"><i class="fa-solid fa-globe me-2 text-primary"></i> Meta Global</a>
            
            <small class="text-muted fw-bold px-3 mt-3 mb-2 d-block text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Ações</small>
            <a href="/admin/arquivados" class="nav-link text-dark mb-1"><i class="fa-solid fa-box-archive me-2 text-primary"></i> Arquivados</a>
            <a href="/admin/exportar" class="nav-link text-dark mb-1"><i class="fa-solid fa-file-excel me-2 text-primary"></i> Relatório Excel</a>
            <a href="#" class="nav-link text-dark mb-1" data-bs-toggle="modal" data-bs-target="#modalZerarCiclo"><i class="fa-solid fa-rotate-right me-2 text-primary"></i> Fechar mês</a>
        `;
    } else {
        links = `
            <div class="px-3 mb-3">
                <div class="bg-light rounded-3 p-2 text-center border border-secondary-subtle shadow-sm">
                    <span class="text-muted d-block fw-bold text-uppercase mb-1" style="font-size: 0.65rem; letter-spacing: 1px;">Meus Pontos</span>
                    <h4 class="text-primary fw-bold mb-0"><i class="fa-solid fa-star me-1 text-primary"></i> ${usuario.pontuacao || 0}</h4>
                </div>
            </div>

            <small class="text-muted fw-bold px-3 mb-2 d-block text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Navegação</small>
            <a href="#" class="nav-link text-dark mb-1" data-bs-toggle="modal" data-bs-target="#modalCliente"><i class="fa-solid fa-plus-circle me-2 text-primary"></i> Registrar Venda</a>
            <a href="/vendedor" class="nav-link text-dark mb-1 active"><i class="fa-solid fa-chart-line me-2 text-primary"></i> Meu Dashboard</a>
            <a href="/vendedor/arquivados" class="nav-link text-dark mb-1"><i class="fa-solid fa-box-archive me-2 text-primary"></i> Clientes Arquivados</a>
        `;
    }

    return `
    <style>
        :root {
            --sidebar-width: 230px;
        }
        body {
            background-color: #f8f9fa;
        }
        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: var(--sidebar-width);
            height: 100vh;
            background-color: #ffffff;
            color: #333;
            z-index: 1050;
            display: flex;
            flex-direction: column;
            box-shadow: 2px 0 10px rgba(0,0,0,0.05);
            overflow-y: auto;
            transition: transform 0.3s ease;
            border-right: 1px solid #e9ecef;
        }
        
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-thumb { background-color: #dee2e6; border-radius: 10px; }

        .sidebar-profile {
            padding: 25px 15px 20px 15px;
            text-align: center;
            border-bottom: 1px solid #e9ecef;
        }

        .sidebar-content {
            padding: 15px 10px;
            flex-grow: 1;
        }

        .sidebar .nav-link {
            border-radius: 6px;
            transition: 0.2s;
            font-size: 0.85rem;
            padding: 8px 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            color: #495057 !important;
        }

        .sidebar .nav-link:hover, .sidebar .nav-link.active {
            background-color: #f0f4f8; /* Fundo levemente azulado no hover para combinar com os ícones */
            color: #0d6efd !important;
            transform: translateX(4px);
        }

        .sidebar-footer {
            padding: 15px;
            border-top: 1px solid #e9ecef;
            background-color: #ffffff;
        }
        
        .main-content-wrapper {
            margin-left: var(--sidebar-width);
            width: calc(100% - var(--sidebar-width));
            min-height: 100vh;
            transition: margin-left 0.3s ease, width 0.3s ease;
        }

        /* BARRA SUPERIOR MOBILE (Sanfona) */
        .mobile-topbar {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background-color: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            z-index: 1040;
            align-items: center;
            padding: 0 15px;
            justify-content: space-between;
            border-bottom: 1px solid #e9ecef;
        }

        .mobile-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 1045;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        /* Ajuste Mobile */
        @media (max-width: 992px) {
            .sidebar {
                transform: translateX(-100%);
            }
            .sidebar.show {
                transform: translateX(0);
            }
            .main-content-wrapper {
                margin-left: 0;
                width: 100%;
                padding-top: 60px; /* Espaço para a barra superior no mobile */
            }
            .mobile-topbar {
                display: flex;
            }
            .mobile-overlay.show {
                display: block;
                opacity: 1;
            }
        }
    </style>

    <div class="mobile-overlay" id="mobileOverlay" onclick="toggleSidebar()"></div>

    <div class="mobile-topbar">
        <div class="d-flex align-items-center fw-bold text-dark">
            <i class="fa-solid fa-chart-pie text-primary me-2 fs-5"></i> 
            <span style="letter-spacing: 0.5px;">DASHBOARD</span>
        </div>
        <button class="btn btn-light border shadow-sm px-2 py-1" onclick="toggleSidebar()">
            <i class="fa-solid fa-bars fs-5 text-primary"></i>
        </button>
    </div>
    
    <div class="sidebar" id="sidebarMenu">
        <div class="sidebar-profile">
            <div class="d-flex justify-content-end d-lg-none mb-2">
                <button class="btn-close text-dark" onclick="toggleSidebar()"></button>
            </div>
            <img src="${usuario.foto || 'https://via.placeholder.com/85'}" width="85" height="85" class="rounded-circle border border-2 border-primary mb-3 shadow-sm" style="object-fit: cover;">
            
            <h6 class="fw-bold mb-1 text-dark" style="font-size: 0.95rem;">${usuario.nome}</h6>
            
            <span class="badge bg-primary text-white text-uppercase shadow-sm" style="font-size: 0.65rem;">
                ${isAdmin ? '<i class="fa-solid fa-shield-halved me-1"></i> Admin' : `<i class="fa-solid ${usuario.setor === 'ecommerce' ? 'fa-cart-shopping' : 'fa-industry'} me-1"></i> ${usuario.setor}`}
            </span>
        </div>

        <div class="sidebar-content">
            ${links}
        </div>
        
        <div class="sidebar-footer mt-auto">
            <a href="/logout" class="btn btn-sm btn-outline-primary w-100 fw-bold shadow-sm"><i class="fa-solid fa-arrow-right-from-bracket me-2"></i> Sair</a>
        </div>
    </div>

    <script>
        function toggleSidebar() {
            document.getElementById('sidebarMenu').classList.toggle('show');
            document.getElementById('mobileOverlay').classList.toggle('show');
        }
    </script>
    `;
};