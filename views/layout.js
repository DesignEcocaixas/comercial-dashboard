module.exports = (conteudo) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ERP Comercial | Metas & KPIs</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #cdcdcd; /* Fundo cinza bem claro típico de ERPs */
            color: #333;
        }
        
        /* Estilização de Cards tipo SaaS */
        .card {
            border: none;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
            transition: transform 0.2s ease-in-out;
        }
        .card-header {
            background-color: #ffffff;
            border-bottom: 1px solid #edf2f9;
            font-weight: 600;
            padding: 1rem 1.25rem;
        }
        
        /* Estilização da Tabela */
        .table th {
            font-weight: 600;
            color: #6e84a3;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
            border-bottom-width: 1px;
        }
        .table td {
            vertical-align: middle;
            color: #495057;
        }
        
        /* Cabeçalho do App */
        .erp-header {
            background: #ffffff;
            border-bottom: 1px solid #e3ebf6;
            padding: 1rem 2rem;
            margin-bottom: 2rem;
        }
        
        /* Botões padronizados */
        .btn {
            font-weight: 500;
            border-radius: 6px;
        }
        .btn-action {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
        }

        /* Adicione logo abaixo de .card-header */
        .kpi-card {
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .kpi-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.1) !important;
        }
        
    </style>
</head>
<body>
    ${conteudo}
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;