module.exports = (usuario) => {
    const isAdmin = usuario.tipo === 'admin';
    
    let links = '';

    if (isAdmin) {
        links = `
            <small class="text-muted fw-bold px-3 mb-2 d-block text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Gerenciamento</small>
            <a href="#" class="nav-link text-light mb-1" data-bs-toggle="modal" data-bs-target="#modalUsuario"><i class="fa-solid fa-user-plus me-2 text-primary"></i> Novo Usuário</a>
            <a href="#" class="nav-link text-light mb-1" data-bs-toggle="modal" data-bs-target="#modalGerenciarUsuarios"><i class="fa-solid fa-users-gear me-2 text-primary"></i> Equipe</a>
            
            <small class="text-muted fw-bold px-3 mt-3 mb-2 d-block text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Configurar Metas</small>
            <a href="#" class="nav-link text-light mb-1" data-bs-toggle="modal" data-bs-target="#modalMetasEco"><i class="fa-solid fa-cart-shopping me-2 text-primary"></i> Metas E-commerce</a>
            <a href="#" class="nav-link text-light mb-1" data-bs-toggle="modal" data-bs-target="#modalMetasInd"><i class="fa-solid fa-industry me-2 text-primary"></i> Metas Indústria</a>
            <a href="#" class="nav-link text-light mb-1" data-bs-toggle="modal" data-bs-target="#modalMetaGlobal"><i class="fa-solid fa-globe me-2 text-primary"></i> Meta Global</a>
            
            <small class="text-muted fw-bold px-3 mt-3 mb-2 d-block text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Ações</small>
            <a href="/admin/arquivados" class="nav-link text-light mb-1"><i class="fa-solid fa-box-archive me-2 text-primary"></i> Arquivados</a>
            <a href="/admin/exportar" class="nav-link text-light mb-1"><i class="fa-solid fa-file-excel me-2 text-primary"></i> Relatório Excel</a>
            <a href="#" class="nav-link text-light mb-1" data-bs-toggle="modal" data-bs-target="#modalZerarCiclo"><i class="fa-solid fa-rotate-right me-2 text-primary"></i> Zerar Ciclo</a>
        `;
    } else {
        links = `
            <div class="px-3 mb-3">
                <div class="bg-dark rounded-3 p-2 text-center border border-secondary-subtle shadow-sm">
                    <span class="text-muted d-block fw-bold text-uppercase mb-1" style="font-size: 0.65rem; letter-spacing: 1px;">Meus Pontos</span>
                    <h4 class="text-primary fw-bold mb-0"><i class="fa-solid fa-star me-1 text-primary"></i> ${usuario.pontuacao || 0}</h4>
                </div>
            </div>

            <small class="text-muted fw-bold px-3 mb-2 d-block text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">Navegação</small>
            <a href="#" class="nav-link text-light mb-1" data-bs-toggle="modal" data-bs-target="#modalCliente"><i class="fa-solid fa-plus-circle me-2 text-primary"></i> Registrar Venda</a>
            <a href="/vendedor" class="nav-link text-light mb-1 active"><i class="fa-solid fa-chart-line me-2 text-primary"></i> Meu Dashboard</a>
            <a href="/vendedor/arquivados" class="nav-link text-light mb-1"><i class="fa-solid fa-box-archive me-2 text-primary"></i> Clientes Arquivados</a>
        `;
    }

    return `
    <style>
        :root {
            --sidebar-width: 230px;
        }

        /* ========================================================= */
        /* GLOBAL DARK THEME (GRADIENT SMASH ESTÁTICO)               */
        /* ========================================================= */
        body {
            background-color: #0f0f0f !important;
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(99, 16, 222, 0.20), transparent 50%),
                radial-gradient(circle at 85% 30%, rgba(13, 110, 253, 0.20), transparent 50%) !important;
            background-attachment: fixed !important;
            color: #e5e5e5 !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* SIDEBAR */
        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: var(--sidebar-width);
            height: 100vh;
            background-color: rgba(15, 15, 15, 0.85) !important;
            backdrop-filter: blur(12px);
            color: #e5e5e5;
            z-index: 1050;
            display: flex;
            flex-direction: column;
            box-shadow: 2px 0 15px rgba(0,0,0,0.5);
            overflow-y: auto;
            transition: transform 0.3s ease;
            border-right: 1px solid rgba(255,255,255,0.05);
        }
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-thumb { background-color: #333; border-radius: 10px; }
        .sidebar-profile { padding: 25px 15px 20px 15px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar-content { padding: 15px 10px; flex-grow: 1; }
        .sidebar .nav-link {
            border-radius: 6px; transition: 0.2s; font-size: 0.85rem; padding: 8px 12px; font-weight: 500; display: flex; align-items: center; color: #adb5bd !important;
        }
        .sidebar .nav-link:hover, .sidebar .nav-link.active {
            background-color: rgba(13, 110, 253, 0.15) !important; color: #0d6efd !important; transform: translateX(4px);
        }
        .sidebar-footer { padding: 15px; border-top: 1px solid rgba(255,255,255,0.05); background-color: transparent !important; }
        
        .main-content-wrapper {
            margin-left: var(--sidebar-width); width: calc(100% - var(--sidebar-width)); min-height: 100vh; transition: margin-left 0.3s ease, width 0.3s ease;
        }

        /* BARRA SUPERIOR MOBILE */
        .mobile-topbar {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 60px;
            background-color: rgba(20, 20, 20, 0.9); backdrop-filter: blur(10px);
            box-shadow: 0 2px 10px rgba(0,0,0,0.5); z-index: 1040; align-items: center; padding: 0 15px; justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .mobile-topbar .text-dark { color: #e5e5e5 !important; }
        .mobile-topbar .btn-light { background: transparent !important; border-color: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .mobile-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(0,0,0,0.5); z-index: 1045; opacity: 0; transition: opacity 0.3s ease; }
        
        @media (max-width: 992px) {
            .sidebar { transform: translateX(-100%); }
            .sidebar.show { transform: translateX(0); }
            .main-content-wrapper { margin-left: 0; width: 100%; padding-top: 60px; }
            .mobile-topbar { display: flex; }
            .mobile-overlay.show { display: block; opacity: 1; }
        }

        /* ========================================================= */
        /* SOBREPOSIÇÃO DE CLASSES (WHITELABEL -> DARK)              */
        /* ========================================================= */
        .card {
            background-color: rgba(25, 25, 25, 0.5) !important;
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.08) !important;
            color: #e5e5e5 !important;
        }
        .card-header { background-color: rgba(0,0,0,0.3) !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; color: #fff !important; }
        
        .bg-white, .bg-light, .bg-light-subtle { background-color: transparent !important; }
        
        /* Ajuste fino para fundos de cards KPI */
        .kpi-card:hover { background-color: rgba(255,255,255,0.05) !important; transform: translateY(-3px); }
        .rounded-circle.bg-light { background-color: rgba(255,255,255,0.05) !important; }
        
        .text-dark { color: #f8f9fa !important; }
        .text-muted { color: #adb5bd !important; }

        /* ========================================================= */
        /* TABELAS PERFEITAS PRO DARK MODE                           */
        /* ========================================================= */
        .table { 
            --bs-table-bg: transparent !important;
            --bs-table-color: #e5e5e5 !important;
            --bs-table-hover-bg: rgba(255,255,255,0.05) !important;
            --bs-table-hover-color: #fff !important;
            --bs-table-border-color: rgba(255,255,255,0.08) !important;
            color: #e5e5e5 !important; 
        }
        .table > :not(caption) > * > * {
            background-color: transparent !important;
            color: #e5e5e5 !important;
            border-bottom-color: rgba(255,255,255,0.08) !important;
        }
        .table thead th { 
            background-color: rgba(0,0,0,0.4) !important; 
            color: #adb5bd !important; 
            border-bottom: 2px solid rgba(255,255,255,0.15) !important; 
            font-weight: 600;
        }
        .table-hover tbody tr:hover td, .table-hover tbody tr:hover th { 
            background-color: rgba(255,255,255,0.05) !important; 
            color: #fff !important; 
        }
        /* Corrigir o hover forçado pelo JS inline */
        tr.bg-light, td.bg-light, th.bg-light { 
            background-color: rgba(255,255,255,0.05) !important; 
        }

        /* PAGINAÇÃO */
        .pagination .page-link {
            background-color: rgba(20,20,20,0.5) !important;
            border-color: rgba(255,255,255,0.1) !important;
            color: #adb5bd !important;
        }
        .pagination .page-item.active .page-link {
            background-color: #0d6efd !important;
            border-color: #0d6efd !important;
            color: #fff !important;
        }
        .pagination .page-item.disabled .page-link {
            background-color: transparent !important;
            color: #6c757d !important;
            border-color: rgba(255,255,255,0.05) !important;
        }

        /* BADGES (Ajustadas para fundos escuros) */
        .badge.bg-light { background-color: rgba(255,255,255,0.1) !important; color: #f8f9fa !important; border-color: rgba(255,255,255,0.2) !important; }
        .bg-success-subtle { background-color: rgba(25, 135, 84, 0.2) !important; color: #75b798 !important; border-color: rgba(25, 135, 84, 0.3) !important; }
        .bg-warning-subtle { background-color: rgba(255, 193, 7, 0.2) !important; color: #ffda6a !important; border-color: rgba(255, 193, 7, 0.3) !important; }
        .bg-info-subtle { background-color: rgba(13, 202, 240, 0.2) !important; color: #6edff6 !important; border-color: rgba(13, 202, 240, 0.3) !important; }
        .bg-danger-subtle { background-color: rgba(220, 53, 69, 0.2) !important; color: #ea868f !important; border-color: rgba(220, 53, 69, 0.3) !important; }
        .bg-secondary-subtle { background-color: rgba(108, 117, 125, 0.2) !important; color: #adb5bd !important; border-color: rgba(108, 117, 125, 0.3) !important; }
        .bg-primary-subtle { background-color: rgba(13, 110, 253, 0.2) !important; color: #6ea8fe !important; border-color: rgba(13, 110, 253, 0.3) !important; }

        /* Inputs e Selects */
        .form-control, .form-select {
            background-color: rgba(0, 0, 0, 0.4) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            color: #fff !important;
        }
        .form-control::placeholder { color: #6c757d !important; }
        .form-control:focus, .form-select:focus {
            background-color: rgba(0, 0, 0, 0.6) !important;
            border-color: #0d6efd !important;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
            color: #fff !important;
        }
        .input-group-text {
            background-color: rgba(255,255,255,0.05) !important;
            border: 1px solid rgba(255,255,255,0.15) !important;
            color: #adb5bd !important;
        }

        /* Modais */
        .modal-content {
            background-color: #1a1a1a !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            color: #e5e5e5 !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8) !important;
        }
        .modal-header { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
        .modal-footer { border-top: 1px solid rgba(255,255,255,0.05) !important; background-color: transparent !important; }
        .btn-close { filter: invert(1) grayscale(100%) brightness(200%); }

        /* Abas (Nav Pills) */
        .nav-pills { background-color: rgba(0,0,0,0.3) !important; }
        .nav-pills .nav-link { color: #adb5bd !important; }
        .nav-pills .nav-link.active { background-color: rgba(13, 110, 253, 0.2) !important; color: #0d6efd !important; border: 1px solid rgba(13,110,253,0.5); }

        /* Bordas Genéricas */
        .border, .border-bottom, .border-top, .border-end, .border-start { border-color: rgba(255,255,255,0.08) !important; }
        .border-secondary-subtle { border-color: rgba(255,255,255,0.15) !important; }
        
        /* Botões secundários e outline */
        .btn-outline-secondary { color: #adb5bd !important; border-color: rgba(255,255,255,0.2) !important; }
        .btn-outline-secondary:hover { background-color: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .btn-light { background-color: rgba(255,255,255,0.1) !important; border-color: transparent !important; color: #fff !important; }
        .btn-light:hover { background-color: rgba(255,255,255,0.2) !important; }
    </style>

    <div class="mobile-overlay" id="mobileOverlay" onclick="toggleSidebar()"></div>

    <div class="mobile-topbar">
        <div class="d-flex align-items-center fw-bold text-light">
            <i class="fa-solid fa-chart-pie text-primary me-2 fs-5"></i> 
            <span style="letter-spacing: 0.5px;">DASHBOARD</span>
        </div>
        <button class="btn btn-light border shadow-sm px-2 py-1" onclick="toggleSidebar()">
            <i class="fa-solid fa-bars fs-5 text-light"></i>
        </button>
    </div>
    
    <div class="sidebar" id="sidebarMenu">
        <div class="sidebar-profile">
            <div class="d-flex justify-content-end d-lg-none mb-2">
                <button class="btn-close text-light" onclick="toggleSidebar()"></button>
            </div>
            <img src="${usuario.foto || 'https://via.placeholder.com/85'}" width="85" height="85" class="rounded-circle border border-2 border-primary mb-3 shadow-sm" style="object-fit: cover;">
            
            <h6 class="fw-bold mb-1 text-light" style="font-size: 0.95rem;">${usuario.nome}</h6>
            
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