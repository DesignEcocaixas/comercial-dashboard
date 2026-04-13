const express = require('express');
const session = require('express-session');
const db = require('./db');
const ExcelJS = require('exceljs');

// Importando as views
const layoutView = require('./views/layout');
const adminView = require('./views/admin');
const vendedorView = require('./views/vendedor');

const app = express();
app.use(express.urlencoded({ extended: true })); // Para ler form data
app.use(session({ secret: 'senha_super_secreta', resave: false, saveUninitialized: true }));

const multer = require('multer');
const path = require('path');

// Libera a pasta 'public' para o navegador conseguir carregar as fotos
app.use(express.static('public'));

// Configuração do Multer (Onde salvar e qual nome dar ao arquivo)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    // Gera um nome único usando a data atual + a extensão original do arquivo (.jpg, .png)
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Middleware para proteger rotas
const checarAuth = (req, res, next) => {
  if (!req.session.usuario) return res.redirect('/');
  next();
};

// ==========================================
// ROTA DE LOGIN
// ==========================================
app.get('/', (req, res) => {
  res.send(layoutView(`

<style>

body{
    background:#0f0f0f;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#e5e5e5;
}

/* container */

.login-container{
    width:100%;
    max-width:420px;
}

/* card */

.login-card{
    background:#1a1a1a;
    border:1px solid #2e2e2e;
    border-radius:10px;
    padding:40px;
    box-shadow:0 10px 30px rgba(0,0,0,0.6);
}

/* título */

.login-title{
    font-weight:600;
    color:#ffffff;
}

.login-sub{
    font-size:14px;
    color:#9ca3af;
}

/* input */

.input-token{
    background:#0f0f0f;
    border:1px solid #333;
    color:#e5e5e5;
}

.input-token::placeholder{
    color:#6b7280;
}

.input-token:focus{
    background:#0f0f0f;
    border-color:#6b7280;
    color:#fff;
    box-shadow:none;
}

/* botão */

.btn-login{
    background:#2b2b2b;
    border:1px solid #3a3a3a;
    color:#fff;
    font-weight:600;
    transition:0.2s;
}

.btn-login:hover{
    background:#3a3a3a;
}

/* ícone */

.login-icon{
    font-size:36px;
    color:#9ca3af;
}

</style>


<div class="login-container">

    <div class="login-card">

        <div class="text-center mb-4">

            <i class="fa-solid fa-chart-line login-icon"></i>

            <h3 class="login-title mt-2">
                Dashboard Comercial
            </h3>

            <div class="login-sub">
                Acesso ao sistema
            </div>

        </div>

        <form action="/login" method="POST">

            <div class="mb-3">

                <label class="form-label text-secondary">
                    Token de acesso
                </label>

                <input 
                    type="text"
                    name="token"
                    class="form-control input-token"
                    placeholder="Digite seu token"
                    required
                >

            </div>

            <button class="btn btn-login w-100">

                <i class="fa-solid fa-right-to-bracket me-2"></i>

                Entrar

            </button>

        </form>

    </div>

</div>

`));
});

app.post('/login', async (req, res) => {
  const { token } = req.body;
  const [rows] = await db.query('SELECT * FROM usuarios WHERE token = ?', [token]);
  if (rows.length > 0) {
    req.session.usuario = rows[0];
    if (rows[0].tipo === 'admin') return res.redirect('/admin');
    return res.redirect('/vendedor');
  }
  res.send(layoutView(`<div class="alert alert-danger">Token inválido! <a href="/">Voltar</a></div>`));
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ==========================================
// NOVA FUNÇÃO: RECALCULAR PONTUAÇÕES (TUDO OU NADA)
// ==========================================
async function recalcularTodasAsPontuacoes() {
  // 1. Verifica se a Equipe bateu a Meta Global (30 pontos para todos)
  const [metaGlobalDb] = await db.query('SELECT valor FROM meta_global WHERE id = 1');
  const [totalVendasDb] = await db.query('SELECT SUM(valor_venda) as total FROM clientes WHERE fechou = "sim"');
  const metaGlobal = Number(metaGlobalDb[0]?.valor) || 0;
  const alcancadoGlobal = Number(totalVendasDb[0]?.total) || 0;

  const bateuMetaEquipe = (metaGlobal > 0 && alcancadoGlobal >= metaGlobal);

  // 2. Busca as metas estipuladas pelo Admin para os setores
  const [metasDb] = await db.query('SELECT * FROM metas');
  const metasEco = metasDb.find(m => m.setor === 'ecommerce') || {};
  const metasInd = metasDb.find(m => m.setor === 'industria') || {};

  // 3. Pega todos os vendedores do sistema
  const [vendedores] = await db.query('SELECT id, setor FROM usuarios WHERE tipo = "vendedor"');

  // 4. Calcula e atualiza para CADA vendedor individualmente
  for (let vendedor of vendedores) {
    let pontosTotais = 0;
    const setor = vendedor.setor;
    const metas = setor === 'ecommerce' ? metasEco : metasInd;
    const minGrande = setor === 'ecommerce' ? 5000 : 15000;

    // Busca o somatório atual (KPIs) deste vendedor incluindo dados de retenção
    const [kpisDb] = await db.query(`
            SELECT 
                SUM(IF(prospeccao = 'sem_visita', 1, 0)) AS prosp_sem_visita,
                SUM(IF(prospeccao = 'com_visita', 1, 0)) AS prosp_com_visita,
                SUM(IF(fechou = 'sim', 1, 0)) AS clientes_fechar,
                SUM(IF(fechou = 'sim' AND valor_venda >= ?, 1, 0)) AS qtd_cliente_grande,
                SUM(IF(pos_venda = 'sim', 1, 0)) AS pos_venda,
                SUM(IF(carteira = 'sim' AND visitado = 'sim', 1, 0)) AS visitas_carteira,
                SUM(IF(parado = 'sim' AND fechou = 'sim', 1, 0)) AS reativacoes,
                SUM(IF(regiao IS NOT NULL AND regiao != '' AND fechou = 'sim', 1, 0)) AS vendas_outras_regioes,
                
                /* NOVOS CAMPOS PARA RETENÇÃO AUTOMÁTICA */
                SUM(IF(carteira = 'sim', 1, 0)) AS total_carteira,
                SUM(IF(carteira = 'sim' AND comprou_recorrente = 'sim', 1, 0)) AS total_fidelizados
            FROM clientes WHERE vendedor_id = ?
        `, [minGrande, vendedor.id]);

    const kpis = kpisDb[0] || {};

    // --- APLICAÇÃO DAS REGRAS (TUDO OU NADA) ---

    // Bônus Coletivo (Meta da Empresa)
    if (bateuMetaEquipe) pontosTotais += 30;

    if (setor === 'ecommerce') {
      if (metas.qtd_prosp_sem_visita > 0 && kpis.prosp_sem_visita >= metas.qtd_prosp_sem_visita) pontosTotais += 10;
      if (metas.qtd_prosp_com_visita > 0 && kpis.prosp_com_visita >= metas.qtd_prosp_com_visita) pontosTotais += 30;
      if (metas.qtd_clientes_fechar > 0 && kpis.clientes_fechar >= metas.qtd_clientes_fechar) pontosTotais += 30;
      if (metas.qtd_cliente_grande > 0 && kpis.qtd_cliente_grande >= metas.qtd_cliente_grande) pontosTotais += 20;
      if (metas.qtd_pos_venda > 0 && kpis.pos_venda >= metas.qtd_pos_venda) pontosTotais += 20;
      if (metas.qtd_visitas_carteira > 0 && kpis.visitas_carteira >= metas.qtd_visitas_carteira) pontosTotais += 20;
      if (metas.qtd_reativacoes > 0 && kpis.reativacoes >= metas.qtd_reativacoes) pontosTotais += 20;
      if (metas.qtd_vendas_outras_regioes > 0 && kpis.vendas_outras_regioes >= metas.qtd_vendas_outras_regioes) pontosTotais += 20;
    }
    else if (setor === 'industria') {
      if (metas.qtd_prosp_sem_visita > 0 && kpis.prosp_sem_visita >= metas.qtd_prosp_sem_visita) pontosTotais += 10;
      if (metas.qtd_prosp_com_visita > 0 && kpis.prosp_com_visita >= metas.qtd_prosp_com_visita) pontosTotais += 30;
      if (metas.qtd_clientes_fechar > 0 && kpis.clientes_fechar >= metas.qtd_clientes_fechar) pontosTotais += 30;
      if (metas.qtd_cliente_grande > 0 && kpis.qtd_cliente_grande >= metas.qtd_cliente_grande) pontosTotais += 20;
      if (metas.qtd_pos_venda > 0 && kpis.pos_venda >= metas.qtd_pos_venda) pontosTotais += 20;
      if (metas.qtd_visitas_carteira > 0 && kpis.visitas_carteira >= metas.qtd_visitas_carteira) pontosTotais += 20;
      if (metas.qtd_reativacoes > 0 && kpis.reativacoes >= metas.qtd_reativacoes) pontosTotais += 20;

      // Lógica de Retenção: Fidelizar % dos clientes ativos (Carteira)
      const totalCarteira = kpis.total_carteira || 0;
      const totalFidelizados = kpis.total_fidelizados || 0;
      const taxaAlcancada = totalCarteira > 0 ? (totalFidelizados / totalCarteira) * 100 : 0;
      const metaMinimaRetencao = Number(metas.taxa_retencao) || 40; // Padrão 40%

      if (taxaAlcancada >= metaMinimaRetencao) {
        pontosTotais += 20;
      }
    }

    // Atualiza a pontuação final no banco de dados
    await db.query('UPDATE usuarios SET pontuacao = ? WHERE id = ?', [pontosTotais, vendedor.id]);
  }
}

// Atualiza se o cliente comprou novamente (Retenção Indústria)
app.post('/vendedor/recorrencia', checarAuth, async (req, res) => {
  const { id, comprou_recorrente } = req.body;
  const vendedorId = req.session.usuario.id;

  await db.query('UPDATE clientes SET comprou_recorrente = ? WHERE id = ? AND vendedor_id = ?',
    [comprou_recorrente, id, vendedorId]
  );

  await recalcularTodasAsPontuacoes();
  res.redirect('/vendedor');
});


// ==========================================
// ROTA: AJUSTE MANUAL DE FATURAMENTO DO VENDEDOR
// ==========================================
app.post('/admin/faturamento-manual', checarAuth, async (req, res) => {
    if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');
    
    const { vendedor_id, faturamento_manual } = req.body;
    
    await db.query(
        'UPDATE usuarios SET faturamento_manual = ? WHERE id = ?', 
        [faturamento_manual || 0, vendedor_id]
    );
    
    // Se você tiver uma função recalcularTodasAsPontuacoes(), pode chamá-la aqui se desejar que o valor afete pontuação futuramente.
    res.redirect('/admin');
});

// ==========================================
// ROTAS DOS VENDEDORES (Atualizadas)
// ==========================================

// Cadastro de Novo Cliente
app.post('/vendedor/cliente', checarAuth, async (req, res) => {
  const vendedor = req.session.usuario;
  const { nome, prospeccao, fechou, valor_venda, carteira, parado, regiao, observacao, data_prospeccao, data_fechamento } = req.body;

  // Tratamento dos checkboxes
  const isCarteira = carteira === 'sim' ? 'sim' : 'nao';
  const isParado = parado === 'sim' ? 'sim' : 'nao';

  await db.query(`
        INSERT INTO clientes 
        (vendedor_id, nome, prospeccao, fechou, valor_venda, carteira, parado, regiao, observacao, data_prospeccao, data_fechamento) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [vendedor.id, nome, prospeccao, fechou, valor_venda || 0, isCarteira, isParado, regiao, observacao, data_prospeccao || null, data_fechamento || null]
  );

  await recalcularTodasAsPontuacoes();
  res.redirect('/vendedor');
});

// Editar Cliente Existente
app.post('/vendedor/cliente/editar', checarAuth, async (req, res) => {
  const vendedor = req.session.usuario;
  const { id, nome, prospeccao, fechou, valor_venda, carteira, parado, regiao, observacao, data_prospeccao, data_fechamento } = req.body;

  // Tratamento dos checkboxes (se vierem vazios, marcamos como 'nao')
  const isCarteira = carteira === 'sim' ? 'sim' : 'nao';
  const isParado = parado === 'sim' ? 'sim' : 'nao';

  // Tratamento de datas vazias para evitar erro de formatação no banco
  const dataProspFormatada = data_prospeccao ? data_prospeccao : null;
  const dataFechFormatada = data_fechamento ? data_fechamento : null;

  // A QUERY CORRETA E COMPLETA (cada interrogação tem o seu par 'coluna =')
  await db.query(`
        UPDATE clientes SET 
            nome = ?, 
            prospeccao = ?, 
            fechou = ?, 
            valor_venda = ?, 
            carteira = ?, 
            parado = ?, 
            regiao = ?, 
            observacao = ?, 
            data_prospeccao = ?, 
            data_fechamento = ?
        WHERE id = ? AND vendedor_id = ?`,
    [
      nome,
      prospeccao,
      fechou,
      valor_venda || 0,
      isCarteira,
      isParado,
      regiao,
      observacao || null,
      dataProspFormatada,
      dataFechFormatada,
      id,
      vendedor.id
    ]
  );

  await recalcularTodasAsPontuacoes();
  res.redirect('/vendedor');
});

// EXCLUSÃO DE CLIENTE
app.post('/vendedor/cliente/excluir', checarAuth, async (req, res) => {
  const vendedor = req.session.usuario;
  const { id } = req.body;

  await db.query('DELETE FROM clientes WHERE id = ? AND vendedor_id = ?', [id, vendedor.id]);

  await recalcularTodasAsPontuacoes(); // ALTERAÇÃO: Chamada corrigida
  res.redirect('/vendedor');
});

// ==========================================
// ROTA: EXPORTAR PLANILHA DETALHADA DE CLIENTES (FILTROS)
// ==========================================
app.get('/admin/exportar-clientes', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');

  // Puxa as variáveis escolhidas no formulário HTML
  const { vendedor_id, data_inicio, data_fim } = req.query;

  // Inicia a Query base
  let query = `
        SELECT c.*, u.nome as vendedor_nome, u.setor 
        FROM clientes c 
        LEFT JOIN usuarios u ON c.vendedor_id = u.id 
        WHERE 1=1
    `;
  const params = [];

  // Se o Admin não marcou "todos", filtra pelo ID do vendedor
  if (vendedor_id && vendedor_id !== 'todos') {
    query += ` AND c.vendedor_id = ?`;
    params.push(vendedor_id);
  }

  // CORREÇÃO: Filtra apenas pelas colunas de data que realmente existem no banco!
  if (data_inicio && data_fim) {
    query += ` AND DATE(COALESCE(c.data_prospeccao, c.data_fechamento)) BETWEEN ? AND ?`;
    params.push(data_inicio, data_fim);
  }

  query += ` ORDER BY c.id DESC`;

  // Busca os clientes no banco
  const [clientesExport] = await db.query(query, params);

  // ==========================================
  // CRIAÇÃO DO ARQUIVO EXCEL
  // ==========================================
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clientes Exportados');

  // Título Principal
  worksheet.mergeCells('A1:M1');
  const titleCell = worksheet.getCell('A1');
  const nomeVendedorTitulo = vendedor_id === 'todos' ? 'Todos os Vendedores' : (clientesExport[0]?.vendedor_nome || 'Vendedor Específico');
  titleCell.value = `DADOS DE CLIENTES - Vendedor: ${nomeVendedorTitulo} | Período: ${data_inicio.split('-').reverse().join('/')} a ${data_fim.split('-').reverse().join('/')}`;
  titleCell.font = { bold: true, size: 14, name: 'Calibri' };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Cabeçalho da Tabela
  const headers = [
    'ID Cliente', 'Nome do Cliente', 'Vendedor', 'Setor', 'Região / Cidade', 'Origem', 'Status',
    'Valor da Venda (R$)', 'Cliente de Carteira?', 'Pós-Venda', 'Recorrência',
    'Data da Prospecção', 'Data do Fechamento', 'Observações'
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri' };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Inserindo os Dados na Planilha
  clientesExport.forEach(c => {
    // Formatação limpa para datas no Excel
    const dataProsp = c.data_prospeccao ? new Date(c.data_prospeccao).toLocaleDateString('pt-BR') : '-';
    const dataFech = c.data_fechamento ? new Date(c.data_fechamento).toLocaleDateString('pt-BR') : '-';

    const row = worksheet.addRow([
      c.id,
      c.nome,
      c.vendedor_nome || 'Desconhecido',
      c.setor ? c.setor.toUpperCase() : '-',
      c.regiao || '-',
      c.prospeccao === 'com_visita' ? 'Com Visita' : 'Sem Visita',
      c.fechou === 'sim' ? 'Fechou' : 'Pendente',
      Number(c.valor_venda || 0),
      c.carteira === 'sim' ? 'Sim' : 'Não',
      c.pos_venda === 'sim' ? 'Feito' : (c.pos_venda === 'nao' ? 'Não' : 'Pendente'),
      c.comprou_recorrente === 'sim' ? 'Comprou' : 'Inativo',
      dataProsp,
      dataFech,
      c.observacao || ''
    ]);

    row.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      if (colNumber === 8) {
        cell.numFmt = '_-"R$"* #,##0.00_-;\\-"R$"* #,##0.00_-;_-"R$"* "-"??_-;_-@_-';
      }
    });
  });

  worksheet.columns.forEach((column, i) => {
    if (i === 1) column.width = 30;
    else if (i === 13) column.width = 45;
    else if (i === 2) column.width = 20;
    else column.width = 16;
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Exportacao_Clientes_${Date.now()}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

// ==========================================
// ROTA: ZERAR CICLO COMERCIAL
// ==========================================
app.post('/admin/zerar-ciclo', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');

  // 1. Oculta todos os clientes atuais das métricas
  await db.query('UPDATE clientes SET arquivado = 1');

  // 2. Zera a pontuação de todos os vendedores
  await db.query('UPDATE usuarios SET pontuacao = 0 WHERE tipo = "vendedor"');

  res.redirect('/admin');
});

// Atualiza o Status do Pós-venda
app.post('/vendedor/posvenda', checarAuth, async (req, res) => {
  const vendedorId = req.session.usuario.id;
  await db.query('UPDATE clientes SET pos_venda = ? WHERE id = ? AND vendedor_id = ?',
    [req.body.pos_venda, req.body.id, vendedorId]
  );
  await recalcularTodasAsPontuacoes(); // ALTERAÇÃO: Chamada corrigida
  res.redirect('/vendedor');
});

// Atualiza o Status da Visita na Carteira
app.post('/vendedor/visita', checarAuth, async (req, res) => {
  const vendedorId = req.session.usuario.id;
  await db.query('UPDATE clientes SET visitado = ? WHERE id = ? AND vendedor_id = ?',
    [req.body.visitado, req.body.id, vendedorId]
  );
  await recalcularTodasAsPontuacoes(); // ALTERAÇÃO: Chamada corrigida
  res.redirect('/vendedor');
});


// ==========================================
// ROTA DO ADMIN
// ==========================================
app.get('/admin', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');

  const [usuarios] = await db.query('SELECT * FROM usuarios ORDER BY pontuacao DESC');
  const [metas] = await db.query('SELECT * FROM metas');

  const [metaGlobalDb] = await db.query('SELECT valor FROM meta_global WHERE id = 1');

  // CORREÇÃO: Puxar total global de vendas apenas dos não arquivados
  const [totalVendasDb] = await db.query('SELECT SUM(valor_venda) as total FROM clientes WHERE fechou = "sim" AND arquivado = 0');

  const metaGlobal = metaGlobalDb[0]?.valor || 0;
  const alcancadoGlobal = totalVendasDb[0]?.total || 0;

  const [kpisGlobais] = await db.query(`
        SELECT 
            u.setor,
            SUM(IF(c.prospeccao = 'sem_visita', 1, 0)) AS prosp_sem_visita,
            SUM(IF(c.prospeccao = 'com_visita', 1, 0)) AS prosp_com_visita,
            SUM(IF(c.fechou = 'sim', 1, 0)) AS clientes_fechar,
            SUM(IF(c.fechou = 'sim' AND c.valor_venda >= IF(u.setor = 'ecommerce', 5000, 15000), 1, 0)) AS qtd_cliente_grande,
            SUM(IF(c.fechou = 'sim', c.valor_venda, 0)) AS valor_total_vendas, 
            SUM(IF(c.pos_venda = 'sim', 1, 0)) AS pos_venda,
            SUM(IF(c.carteira = 'sim' AND c.visitado = 'sim', 1, 0)) AS visitas_carteira,
            SUM(IF(c.parado = 'sim', 1, 0)) AS reativacoes,
            SUM(IF(c.carteira = 'sim', 1, 0)) AS total_carteira,
            SUM(IF(c.carteira = 'sim' AND c.comprou_recorrente = 'sim', 1, 0)) AS total_fidelizados
            
        FROM usuarios u
        /* CORREÇÃO AQUI: Garante que os KPIs do admin só calculem os clientes do ciclo atual */
        LEFT JOIN clientes c ON u.id = c.vendedor_id AND c.arquivado = 0
        WHERE u.tipo = 'vendedor'
        GROUP BY u.setor
    `);

  const kpisPorSetor = {
    ecommerce: kpisGlobais.find(k => k.setor === 'ecommerce') || {},
    industria: kpisGlobais.find(k => k.setor === 'industria') || {}
  };
  const metasPorSetor = {
    ecommerce: metas.find(m => m.setor === 'ecommerce') || {},
    industria: metas.find(m => m.setor === 'industria') || {}
  };

  // CORREÇÃO: Puxar apenas os clientes do ciclo atual para a tabela geral do Admin
  const [todosClientes] = await db.query(`
        SELECT c.*, u.nome as vendedor_nome, u.setor 
        FROM clientes c 
        JOIN usuarios u ON c.vendedor_id = u.id 
        WHERE c.arquivado = 0
        ORDER BY c.id DESC
    `);

  res.send(adminView(req.session.usuario, usuarios, metasPorSetor, kpisPorSetor, metaGlobal, alcancadoGlobal, todosClientes));
});

// Salvar Meta Global (Apenas Admin)
app.post('/admin/meta-global', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo === 'admin') {
    await db.query('UPDATE meta_global SET valor = ? WHERE id = 1', [req.body.valor]);
    await recalcularTodasAsPontuacoes(); // ALTERAÇÃO: Recalcula se o admin mexer na meta global
  }
  res.redirect('/admin');
});

// Cadastro de usuário
app.post('/admin/usuario', checarAuth, upload.single('foto'), async (req, res) => {
  const { nome, token, tipo, setor } = req.body;
  const caminhoFoto = req.file ? `/uploads/${req.file.filename}` : '';
  await db.query('INSERT INTO usuarios (nome, token, foto, tipo, setor) VALUES (?, ?, ?, ?, ?)',
    [nome, token, caminhoFoto, tipo, setor]);
  res.redirect('/admin');
});

// EDIÇÃO DE USUÁRIO
app.post('/admin/usuario/editar', checarAuth, upload.single('foto'), async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/');
  const { id, nome, token, tipo, setor } = req.body;

  if (req.file) {
    const caminhoFoto = `/uploads/${req.file.filename}`;
    await db.query('UPDATE usuarios SET nome = ?, token = ?, foto = ?, tipo = ?, setor = ? WHERE id = ?',
      [nome, token, caminhoFoto, tipo, setor, id]);
  } else {
    await db.query('UPDATE usuarios SET nome = ?, token = ?, tipo = ?, setor = ? WHERE id = ?',
      [nome, token, tipo, setor, id]);
  }
  res.redirect('/admin');
});

// EXCLUSÃO DE USUÁRIO
app.post('/admin/usuario/excluir', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/');
  const { id } = req.body;

  await db.query('DELETE FROM clientes WHERE vendedor_id = ?', [id]);
  await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
  res.redirect('/admin');
});

// Salvar Metas Setoriais
app.post('/admin/metas', checarAuth, async (req, res) => {
  const {
    setor, meta_geral, qtd_prosp_sem_visita, qtd_prosp_com_visita,
    qtd_clientes_fechar, qtd_cliente_grande, valor_cliente_grande,
    qtd_pos_venda, qtd_visitas_carteira, qtd_reativacoes,
    qtd_vendas_outras_regioes, taxa_retencao
  } = req.body;

  await db.query(`
        UPDATE metas SET 
            meta_geral = ?, qtd_prosp_sem_visita = ?, qtd_prosp_com_visita = ?, 
            qtd_clientes_fechar = ?, qtd_cliente_grande = ?, valor_cliente_grande = ?, 
            qtd_pos_venda = ?, qtd_visitas_carteira = ?, qtd_reativacoes = ?, 
            qtd_vendas_outras_regioes = ?, taxa_retencao = ?
        WHERE setor = ?`,
    [
      meta_geral || 0, qtd_prosp_sem_visita || 0, qtd_prosp_com_visita || 0,
      qtd_clientes_fechar || 0, qtd_cliente_grande || 0, valor_cliente_grande || 0,
      qtd_pos_venda || 0, qtd_visitas_carteira || 0, qtd_reativacoes || 0,
      qtd_vendas_outras_regioes || 0, taxa_retencao || 0, setor
    ]
  );
  await recalcularTodasAsPontuacoes(); // ALTERAÇÃO: Recalcula pontos se admin alterar a meta
  res.redirect('/admin');
});

// ==========================================
// ROTA DO VENDEDOR
// ==========================================
app.get('/vendedor', checarAuth, async (req, res) => {
    if (req.session.usuario.tipo !== 'vendedor') return res.redirect('/admin');

    const usuario = req.session.usuario;
    const [clientes] = await db.query('SELECT * FROM clientes WHERE vendedor_id = ? AND arquivado = 0 ORDER BY id DESC', [usuario.id]);
    const [metas] = await db.query('SELECT * FROM metas WHERE setor = ?', [usuario.setor]);

    const [metaGlobalDb] = await db.query('SELECT * FROM meta_global WHERE id = 1'); // Atualizado para *
    const [totalVendasDb] = await db.query('SELECT SUM(valor_venda) as total FROM clientes WHERE fechou = "sim" AND arquivado = 0');
    const metaGlobal = metaGlobalDb[0]?.valor || 0;
    
    // Trocamos const por let para podermos somar os valores manuais abaixo
    let alcancadoGlobal = Number(totalVendasDb[0]?.total || 0);

    const valorClienteGrande = usuario.setor === 'ecommerce' ? 5000 : 15000;

    const [kpis] = await db.query(`
        SELECT 
            SUM(IF(prospeccao = 'sem_visita', 1, 0)) AS prosp_sem_visita,
            SUM(IF(prospeccao = 'com_visita', 1, 0)) AS prosp_com_visita,
            SUM(IF(fechou = 'sim', 1, 0)) AS clientes_fechar,
            SUM(IF(fechou = 'sim' AND valor_venda >= ?, 1, 0)) AS qtd_cliente_grande,
            SUM(IF(fechou = 'sim', valor_venda, 0)) AS valor_total_vendas, 
            SUM(IF(pos_venda = 'sim', 1, 0)) AS pos_venda,
            
            /* CORREÇÃO APLICADA AQUI: carteira = 'sim' AND prospeccao = 'com_visita' */
            SUM(IF(carteira = 'sim' AND prospeccao = 'com_visita', 1, 0)) AS visitas_carteira,
            
            SUM(IF(parado = 'sim', 1, 0)) AS reativacoes,
            SUM(IF(carteira = 'sim', 1, 0)) AS total_carteira,
            SUM(IF(carteira = 'sim' AND comprou_recorrente = 'sim', 1, 0)) AS total_fidelizados
        FROM clientes 
        WHERE vendedor_id = ? AND arquivado = 0
    `, [valorClienteGrande, usuario.id]);

    const [userAtualizado] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuario.id]);
    req.session.usuario = userAtualizado[0];

    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE tipo = "vendedor" ORDER BY pontuacao DESC');
    const [todosClientes] = await db.query('SELECT vendedor_id, valor_venda, fechou FROM clientes WHERE fechou = "sim" AND arquivado = 0');

    // ==========================================
    // INTEGRAÇÃO DO FATURAMENTO MANUAL
    // ==========================================
    
    // 1. Soma o faturamento manual de toda a equipe para compor a Meta Global
    const somaManualTotal = usuarios.reduce((acc, u) => acc + Number(u.faturamento_manual || 0), 0);
    alcancadoGlobal += somaManualTotal;

    // 2. Soma o faturamento manual do próprio vendedor na sua Meta Individual de faturamento
    if (kpis[0]) {
        kpis[0].valor_total_vendas = Number(kpis[0].valor_total_vendas || 0) + Number(req.session.usuario.faturamento_manual || 0);
    }

    res.send(vendedorView(req.session.usuario, clientes, metas[0] || {}, kpis[0] || {}, metaGlobal, alcancadoGlobal, usuarios, todosClientes));
});

// ==========================================
// ROTA: EXPORTAR PLANILHA EXCEL FORMATADA (.XLSX)
// ==========================================
app.get('/admin/exportar', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');

  // Busca o resumo de cada vendedor
  const [relatorio] = await db.query(`
        SELECT 
            u.nome AS vendedor,
            u.setor,
            SUM(IF(c.prospeccao = 'sem_visita', 1, 0)) AS prosp_sem_visita,
            SUM(IF(c.prospeccao = 'com_visita', 1, 0)) AS prosp_com_visita,
            SUM(IF(c.fechou = 'sim', 1, 0)) AS clientes_fechados,
            SUM(IF(c.fechou = 'sim' AND c.valor_venda >= IF(u.setor = 'ecommerce', 5000, 15000), 1, 0)) AS qtd_cliente_grande,
            SUM(IF(c.fechou = 'sim', c.valor_venda, 0)) AS valor_total_vendas, 
            SUM(IF(c.pos_venda = 'sim', 1, 0)) AS pos_venda,
            SUM(IF(c.carteira = 'sim' AND c.visitado = 'sim', 1, 0)) AS visitas_carteira,
            SUM(IF(c.parado = 'sim', 1, 0)) AS reativacoes,
            SUM(IF(c.carteira = 'sim', 1, 0)) AS total_carteira,
            SUM(IF(c.carteira = 'sim' AND c.comprou_recorrente = 'sim', 1, 0)) AS total_fidelizados,
            u.pontuacao
        FROM usuarios u
        LEFT JOIN clientes c ON u.id = c.vendedor_id
        WHERE u.tipo = 'vendedor'
        GROUP BY u.id, u.nome, u.setor
        ORDER BY u.setor ASC, u.pontuacao DESC
    `);

  // Pegando a data formatada
  const dataAtual = new Date();
  const dataParaTitulo = dataAtual.toLocaleDateString('pt-BR');
  const dataParaNome = dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-');

  // Criando o arquivo Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatório Comercial');

  // 1. CRIANDO O TÍTULO MESCLADO (Linha 1)
  worksheet.mergeCells('A1:L1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `RELATÓRIO COMERCIAL - ${dataParaTitulo}`;
  titleCell.font = { bold: true, size: 14, name: 'Calibri' };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 2. CABEÇALHO COM FUNDO VERDE (Linha 2)
  const headers = [
    'Vendedor', 'Setor', 'Prosp. Sem Visita', 'Prosp. Com Visita',
    'Clientes Fechados', 'Clientes Grandes', 'Valor Total (R$)',
    'Pos-Venda', 'Visitas Carteira', 'Reativacoes', 'Taxa Retencao (%)', 'Pontuacao Final'
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    // Cor verde no fundo e texto branco em negrito
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri' };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // 3. INSERINDO OS DADOS DOS VENDEDORES
  relatorio.forEach(r => {
    const retencao = r.total_carteira > 0 ? ((r.total_fidelizados / r.total_carteira) * 100).toFixed(1) + '%' : 'N/A';

    const row = worksheet.addRow([
      r.vendedor,
      r.setor.toUpperCase(),
      r.prosp_sem_visita,
      r.prosp_com_visita,
      r.clientes_fechados,
      r.qtd_cliente_grande,
      Number(r.valor_total_vendas || 0), // Enviado como número puro para o Excel formatar
      r.pos_venda,
      r.visitas_carteira,
      r.reativacoes,
      r.setor === 'industria' ? retencao : 'N/A',
      r.pontuacao
    ]);

    // Centraliza e coloca bordas em todas as células da linha
    row.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      // Formatação Contábil para a coluna "Valor Total" (coluna 7) - Cria o efeito "R$ -" para zeros
      if (colNumber === 7) {
        cell.numFmt = '_-"R$"* #,##0.00_-;\\-"R$"* #,##0.00_-;_-"R$"* "-"??_-;_-@_-';
      }
    });
  });

  // 4. AJUSTANDO LARGURA DAS COLUNAS PARA NÃO CORTAR O TEXTO
  worksheet.columns.forEach((column, i) => {
    column.width = i === 0 ? 20 : 18; // Coluna Vendedor um pouco maior, o resto 18
  });

  // 5. ENVIANDO PARA DOWNLOAD
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Relatorio_Comercial_${dataParaNome}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

// ==========================================
// ROTA: LISTAR ARQUIVADOS (Admin)
// ==========================================
app.get('/admin/arquivados', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');

  const [vendedores] = await db.query('SELECT id, nome FROM usuarios WHERE tipo = "vendedor"');
  const [clientesArquivados] = await db.query(`
        SELECT c.*, u.nome as vendedor_nome 
        FROM clientes c 
        LEFT JOIN usuarios u ON c.vendedor_id = u.id 
        WHERE c.arquivado = 1 
        ORDER BY c.id DESC
    `);

  res.send(require('./views/arquivados')(req.session.usuario, clientesArquivados, vendedores));
});

// ==========================================
// ROTA: EDITAR ARQUIVADOS (Admin)
// ==========================================
app.post('/admin/arquivados/editar', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');

  const { id, nome, prospeccao, fechou, valor_venda, carteira, parado, regiao, observacao, data_prospeccao, data_fechamento } = req.body;

  const isCarteira = carteira === 'sim' ? 'sim' : 'nao';
  const isParado = parado === 'sim' ? 'sim' : 'nao';
  const dataProspFormatada = data_prospeccao ? data_prospeccao : null;
  const dataFechFormatada = data_fechamento ? data_fechamento : null;

  await db.query(`
        UPDATE clientes SET 
            nome = ?, prospeccao = ?, fechou = ?, valor_venda = ?, carteira = ?, parado = ?, regiao = ?, observacao = ?, data_prospeccao = ?, data_fechamento = ?
        WHERE id = ?`,
    [nome, prospeccao, fechou, valor_venda || 0, isCarteira, isParado, regiao, observacao || null, dataProspFormatada, dataFechFormatada, id]
  );

  // Redireciona de volta para a tela de arquivados (Não recalcula pontos do ciclo atual!)
  res.redirect('/admin/arquivados');
});

// ==========================================
// ROTA: EXCLUIR ARQUIVADOS (Admin)
// ==========================================
app.post('/admin/arquivados/excluir', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');

  const { id } = req.body;
  await db.query(`DELETE FROM clientes WHERE id = ?`, [id]);

  res.redirect('/admin/arquivados');
});

// ==========================================
// ROTA: LISTAR ARQUIVADOS (VENDEDOR)
// ==========================================
app.get('/vendedor/arquivados', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'vendedor') return res.redirect('/admin');

  const vendedor = req.session.usuario;
  const [clientesArquivados] = await db.query(`
        SELECT * FROM clientes 
        WHERE arquivado = 1 AND vendedor_id = ? 
        ORDER BY id DESC
    `, [vendedor.id]);

  res.send(require('./views/arquivados-vendedor')(vendedor, clientesArquivados));
});

// ==========================================
// ROTA: EDITAR ARQUIVADOS (VENDEDOR)
// ==========================================
app.post('/vendedor/arquivados/editar', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'vendedor') return res.redirect('/admin');

  const vendedor = req.session.usuario;
  const { id, nome, prospeccao, fechou, valor_venda, carteira, parado, regiao, observacao, data_prospeccao, data_fechamento } = req.body;

  const isCarteira = carteira === 'sim' ? 'sim' : 'nao';
  const isParado = parado === 'sim' ? 'sim' : 'nao';
  const dataProspFormatada = data_prospeccao ? data_prospeccao : null;
  const dataFechFormatada = data_fechamento ? data_fechamento : null;

  // Apenas edita se o cliente pertencer ao próprio vendedor
  await db.query(`
        UPDATE clientes SET 
            nome = ?, prospeccao = ?, fechou = ?, valor_venda = ?, carteira = ?, parado = ?, regiao = ?, observacao = ?, data_prospeccao = ?, data_fechamento = ?
        WHERE id = ? AND vendedor_id = ?`,
    [nome, prospeccao, fechou, valor_venda || 0, isCarteira, isParado, regiao, observacao || null, dataProspFormatada, dataFechFormatada, id, vendedor.id]
  );

  res.redirect('/vendedor/arquivados');
});

// ==========================================
// ROTA: EXCLUIR ARQUIVADOS (VENDEDOR)
// ==========================================
app.post('/vendedor/arquivados/excluir', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'vendedor') return res.redirect('/admin');

  const vendedor = req.session.usuario;
  const { id } = req.body;

  // Apenas exclui se o cliente pertencer ao próprio vendedor
  await db.query(`DELETE FROM clientes WHERE id = ? AND vendedor_id = ?`, [id, vendedor.id]);

  res.redirect('/vendedor/arquivados');
});

// ==========================================
// START SERVER
// ==========================================
app.listen(3002, () => {
  console.log('🚀 App rodando em http://localhost:3002');
  console.log('Utilize o token "admin123" para fazer o primeiro login.');
});