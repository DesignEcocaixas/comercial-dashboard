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

// Libera a pasta 'public' para o navegador conseguir carregar as fotos e os relatórios gerados
app.use(express.static('public'));

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

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
body{ background:#0f0f0f; min-height:100vh; display:flex; align-items:center; justify-content:center; color:#e5e5e5; }
.login-container{ width:100%; max-width:420px; }
.login-card{ background:#1a1a1a; border:1px solid #2e2e2e; border-radius:10px; padding:40px; box-shadow:0 10px 30px rgba(0,0,0,0.6); }
.login-title{ font-weight:600; color:#ffffff; }
.login-sub{ font-size:14px; color:#9ca3af; }
.input-token{ background:#0f0f0f; border:1px solid #333; color:#e5e5e5; }
.input-token::placeholder{ color:#6b7280; }
.input-token:focus{ background:#0f0f0f; border-color:#6b7280; color:#fff; box-shadow:none; }
.btn-login{ background:#2b2b2b; border:1px solid #3a3a3a; color:#fff; font-weight:600; transition:0.2s; }
.btn-login:hover{ background:#3a3a3a; }
.login-icon{ font-size:36px; color:#9ca3af; }
</style>

<div class="login-container">
    <div class="login-card">
        <div class="text-center mb-4">
            <i class="fa-solid fa-chart-line login-icon"></i>
            <h3 class="login-title mt-2">Dashboard Comercial</h3>
            <div class="login-sub">Acesso ao sistema</div>
        </div>
        <form action="/login" method="POST">
            <div class="mb-3">
                <label class="form-label text-secondary">Token de acesso</label>
                <input type="text" name="token" class="form-control input-token" placeholder="Digite seu token" required>
            </div>
            <button class="btn btn-login w-100"><i class="fa-solid fa-right-to-bracket me-2"></i> Entrar</button>
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
// FUNÇÃO: RECALCULAR PONTUAÇÕES
// ==========================================
async function recalcularTodasAsPontuacoes() {
  const [metaGlobalDb] = await db.query('SELECT valor FROM meta_global WHERE id = 1');
  const [totalVendasDb] = await db.query('SELECT SUM(valor_venda) as total FROM clientes WHERE fechou = "sim" AND arquivado = 0');
  const metaGlobal = Number(metaGlobalDb[0]?.valor) || 0;
  const alcancadoGlobal = Number(totalVendasDb[0]?.total) || 0;

  const [usuariosParaSoma] = await db.query('SELECT SUM(faturamento_manual) as total_manual FROM usuarios WHERE tipo = "vendedor"');
  const somaManualTotal = Number(usuariosParaSoma[0]?.total_manual) || 0;
  
  const bateuMetaEquipe = (metaGlobal > 0 && (alcancadoGlobal + somaManualTotal) >= metaGlobal);

  const [metasDb] = await db.query('SELECT * FROM metas');
  const metasEco = metasDb.find(m => m.setor === 'ecommerce') || {};
  const metasInd = metasDb.find(m => m.setor === 'industria') || {};

  const [vendedores] = await db.query('SELECT * FROM usuarios WHERE tipo = "vendedor"');

  for (let vendedor of vendedores) {
    let pontosTotais = 0;
    const setor = vendedor.setor;
    const metasSetor = setor === 'ecommerce' ? metasEco : metasInd;
    
    const m_prosp_sem = vendedor.qtd_prosp_sem_visita > 0 ? vendedor.qtd_prosp_sem_visita : metasSetor.qtd_prosp_sem_visita;
    const m_prosp_com = vendedor.qtd_prosp_com_visita > 0 ? vendedor.qtd_prosp_com_visita : metasSetor.qtd_prosp_com_visita;
    const m_clientes_fechar = vendedor.qtd_clientes_fechar > 0 ? vendedor.qtd_clientes_fechar : metasSetor.qtd_clientes_fechar;
    const m_cliente_grande = vendedor.qtd_cliente_grande > 0 ? vendedor.qtd_cliente_grande : metasSetor.qtd_cliente_grande;
    const m_pos_venda = vendedor.qtd_pos_venda > 0 ? vendedor.qtd_pos_venda : metasSetor.qtd_pos_venda;
    const m_visitas_carteira = vendedor.qtd_visitas_carteira > 0 ? vendedor.qtd_visitas_carteira : metasSetor.qtd_visitas_carteira;
    const m_reativacoes = vendedor.qtd_reativacoes > 0 ? vendedor.qtd_reativacoes : metasSetor.qtd_reativacoes;
    const m_vendas_outras = vendedor.qtd_vendas_outras_regioes > 0 ? vendedor.qtd_vendas_outras_regioes : metasSetor.qtd_vendas_outras_regioes;
    const m_taxa_retencao = vendedor.taxa_retencao > 0 ? vendedor.taxa_retencao : metasSetor.taxa_retencao;
    const minGrande = vendedor.valor_cliente_grande > 0 ? vendedor.valor_cliente_grande : (setor === 'ecommerce' ? 5000 : 15000);

    const [kpisDb] = await db.query(`
            SELECT 
                SUM(IF(prospeccao = 'sem_visita', 1, 0)) AS prosp_sem_visita,
                SUM(IF(prospeccao = 'com_visita', 1, 0)) AS prosp_com_visita,
                SUM(IF(fechou = 'sim', 1, 0)) AS clientes_fechar,
                SUM(IF(fechou = 'sim' AND (valor_venda >= ? OR cliente_grande = 'sim'), 1, 0)) AS qtd_cliente_grande,
                SUM(IF(pos_venda = 'sim', 1, 0)) AS pos_venda,
                SUM(IF(carteira = 'sim' AND prospeccao = 'com_visita', 1, 0)) AS visitas_carteira,
                SUM(IF(parado = 'sim' AND fechou = 'sim', 1, 0)) AS reativacoes,
                SUM(IF(regiao IS NOT NULL AND regiao != '' AND fechou = 'sim', 1, 0)) AS vendas_outras_regioes,
                SUM(IF(carteira = 'sim', 1, 0)) AS total_carteira,
                SUM(IF(carteira = 'sim' AND comprou_recorrente = 'sim', 1, 0)) AS total_fidelizados
            FROM clientes WHERE vendedor_id = ? AND arquivado = 0
        `, [minGrande, vendedor.id]);

    const kpis = kpisDb[0] || {};

    if (bateuMetaEquipe) pontosTotais += 30;

    if (setor === 'ecommerce') {
      if (m_prosp_sem > 0 && kpis.prosp_sem_visita >= m_prosp_sem) pontosTotais += 10;
      if (m_prosp_com > 0 && kpis.prosp_com_visita >= m_prosp_com) pontosTotais += 30;
      if (m_clientes_fechar > 0 && kpis.clientes_fechar >= m_clientes_fechar) pontosTotais += 30;
      if (m_cliente_grande > 0 && kpis.qtd_cliente_grande >= m_cliente_grande) pontosTotais += 20;
      if (m_pos_venda > 0 && kpis.pos_venda >= m_pos_venda) pontosTotais += 20;
      if (m_visitas_carteira > 0 && kpis.visitas_carteira >= m_visitas_carteira) pontosTotais += 20;
      if (m_reativacoes > 0 && kpis.reativacoes >= m_reativacoes) pontosTotais += 20;
      if (m_vendas_outras > 0 && kpis.vendas_outras_regioes >= m_vendas_outras) pontosTotais += 20;
    }
    else if (setor === 'industria') {
      if (m_prosp_sem > 0 && kpis.prosp_sem_visita >= m_prosp_sem) pontosTotais += 10;
      if (m_prosp_com > 0 && kpis.prosp_com_visita >= m_prosp_com) pontosTotais += 30;
      if (m_clientes_fechar > 0 && kpis.clientes_fechar >= m_clientes_fechar) pontosTotais += 30;
      if (m_cliente_grande > 0 && kpis.qtd_cliente_grande >= m_cliente_grande) pontosTotais += 20;
      if (m_pos_venda > 0 && kpis.pos_venda >= m_pos_venda) pontosTotais += 20;
      if (m_visitas_carteira > 0 && kpis.visitas_carteira >= m_visitas_carteira) pontosTotais += 20;
      if (m_reativacoes > 0 && kpis.reativacoes >= m_reativacoes) pontosTotais += 20;

      const totalCarteira = kpis.total_carteira || 0;
      const totalFidelizados = kpis.total_fidelizados || 0;
      const taxaAlcancada = totalCarteira > 0 ? (totalFidelizados / totalCarteira) * 100 : 0;
      const metaMinimaRetencao = Number(m_taxa_retencao) || 40;

      if (taxaAlcancada >= metaMinimaRetencao) {
        pontosTotais += 20;
      }
    }

    await db.query('UPDATE usuarios SET pontuacao = ? WHERE id = ?', [pontosTotais, vendedor.id]);
  }
}

app.post('/vendedor/recorrencia', checarAuth, async (req, res) => {
  const { id, comprou_recorrente } = req.body;
  const vendedorId = req.session.usuario.id;
  await db.query('UPDATE clientes SET comprou_recorrente = ? WHERE id = ? AND vendedor_id = ?', [comprou_recorrente, id, vendedorId]);
  await recalcularTodasAsPontuacoes();
  res.redirect('/vendedor');
});

app.post('/admin/faturamento-manual', checarAuth, async (req, res) => {
    if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');
    const { vendedor_id, faturamento_manual } = req.body;
    await db.query('UPDATE usuarios SET faturamento_manual = ? WHERE id = ?', [faturamento_manual || 0, vendedor_id]);
    await recalcularTodasAsPontuacoes();
    res.redirect('/admin');
});

// ==========================================
// ROTAS DOS VENDEDORES
// ==========================================
app.post('/vendedor/cliente', checarAuth, async (req, res) => {
  const vendedor = req.session.usuario;
  const { nome, prospeccao, fechou, valor_venda, carteira, parado, cliente_grande, regiao, observacao, data_prospeccao, data_fechamento } = req.body;

  const isCarteira = carteira === 'sim' ? 'sim' : 'nao';
  const isParado = parado === 'sim' ? 'sim' : 'nao';
  const isGrande = cliente_grande === 'sim' ? 'sim' : 'nao';

  await db.query(`
        INSERT INTO clientes 
        (vendedor_id, nome, prospeccao, fechou, valor_venda, carteira, parado, cliente_grande, regiao, observacao, data_prospeccao, data_fechamento) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [vendedor.id, nome, prospeccao, fechou, valor_venda || 0, isCarteira, isParado, isGrande, regiao, observacao, data_prospeccao || null, data_fechamento || null]
  );
  await recalcularTodasAsPontuacoes();
  res.redirect('/vendedor');
});

app.post('/vendedor/cliente/editar', checarAuth, async (req, res) => {
  const vendedor = req.session.usuario;
  const { id, nome, prospeccao, fechou, valor_venda, carteira, parado, cliente_grande, regiao, observacao, data_prospeccao, data_fechamento } = req.body;

  const isCarteira = carteira === 'sim' ? 'sim' : 'nao';
  const isParado = parado === 'sim' ? 'sim' : 'nao';
  const isGrande = cliente_grande === 'sim' ? 'sim' : 'nao';
  const dataProspFormatada = data_prospeccao ? data_prospeccao : null;
  const dataFechFormatada = data_fechamento ? data_fechamento : null;

  await db.query(`
        UPDATE clientes SET 
            nome = ?, prospeccao = ?, fechou = ?, valor_venda = ?, carteira = ?, parado = ?, cliente_grande = ?, regiao = ?, observacao = ?, data_prospeccao = ?, data_fechamento = ?
        WHERE id = ? AND vendedor_id = ?`,
    [nome, prospeccao, fechou, valor_venda || 0, isCarteira, isParado, isGrande, regiao, observacao || null, dataProspFormatada, dataFechFormatada, id, vendedor.id]
  );
  await recalcularTodasAsPontuacoes();
  res.redirect('/vendedor');
});

app.post('/vendedor/cliente/excluir', checarAuth, async (req, res) => {
  const vendedor = req.session.usuario;
  const { id } = req.body;
  await db.query('DELETE FROM clientes WHERE id = ? AND vendedor_id = ?', [id, vendedor.id]);
  await recalcularTodasAsPontuacoes(); 
  res.redirect('/vendedor');
});

// ==========================================
// FUNÇÃO AUXILIAR: GERAR EXCEL COM 2 ABAS (USADA EM EXPORTAR E ZERAR CICLO)
// ==========================================
async function gerarPlanilhaExcel(res, baixarDireto = true) {
    // Aba 1: Resumo dos Vendedores
    const [relatorio] = await db.query(`
        SELECT 
            u.nome AS vendedor, u.setor,
            SUM(IF(c.prospeccao = 'sem_visita', 1, 0)) AS prosp_sem_visita,
            SUM(IF(c.prospeccao = 'com_visita', 1, 0)) AS prosp_com_visita,
            SUM(IF(c.fechou = 'sim', 1, 0)) AS clientes_fechados,
            SUM(IF(c.fechou = 'sim' AND (c.valor_venda >= IF(u.setor = 'ecommerce', 5000, 15000) OR c.cliente_grande = 'sim'), 1, 0)) AS qtd_cliente_grande,
            SUM(IF(c.fechou = 'sim', c.valor_venda, 0)) AS valor_total_vendas, 
            SUM(IF(c.pos_venda = 'sim', 1, 0)) AS pos_venda,
            SUM(IF(c.carteira = 'sim' AND c.prospeccao = 'com_visita', 1, 0)) AS visitas_carteira,
            SUM(IF(c.parado = 'sim' AND c.fechou = 'sim', 1, 0)) AS reativacoes,
            SUM(IF(c.carteira = 'sim', 1, 0)) AS total_carteira,
            SUM(IF(c.carteira = 'sim' AND c.comprou_recorrente = 'sim', 1, 0)) AS total_fidelizados,
            u.pontuacao
        FROM usuarios u
        LEFT JOIN clientes c ON u.id = c.vendedor_id AND c.arquivado = 0
        WHERE u.tipo = 'vendedor'
        GROUP BY u.id, u.nome, u.setor
        ORDER BY u.setor ASC, u.pontuacao DESC
    `);

    // Aba 2: Detalhamento completo de clientes
    const [clientesDetalhes] = await db.query(`
        SELECT c.*, u.nome as vendedor_nome, u.setor, u.valor_cliente_grande 
        FROM clientes c 
        LEFT JOIN usuarios u ON c.vendedor_id = u.id 
        WHERE c.arquivado = 0
        ORDER BY u.nome ASC, c.id DESC
    `);

    const dataAtual = new Date();
    const dataParaTitulo = dataAtual.toLocaleDateString('pt-BR');
    const dataParaNome = dataAtual.toLocaleDateString('pt-BR').replace(/\//g, '-');

    const workbook = new ExcelJS.Workbook();
    
    // ---- MONTANDO A ABA 1 (Resumo) ----
    const wsResumo = workbook.addWorksheet('Resumo da Equipe');
    wsResumo.mergeCells('A1:L1');
    const titleCellResumo = wsResumo.getCell('A1');
    titleCellResumo.value = `RELATÓRIO COMERCIAL (RESUMO) - ${dataParaTitulo}`;
    titleCellResumo.font = { bold: true, size: 14, name: 'Calibri' };
    titleCellResumo.alignment = { horizontal: 'center', vertical: 'middle' };

    const headersResumo = [
        'Vendedor', 'Setor', 'Prosp. Sem Visita', 'Prosp. Com Visita',
        'Clientes Fechados', 'Clientes Grandes', 'Valor Total (R$)',
        'Pos-Venda', 'Visitas Carteira', 'Reativacoes', 'Taxa Retencao (%)', 'Pontuacao Final'
    ];

    const headerRow = wsResumo.addRow(headersResumo);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri' };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    relatorio.forEach(r => {
        const retencao = r.total_carteira > 0 ? ((r.total_fidelizados / r.total_carteira) * 100).toFixed(1) + '%' : 'N/A';
        const row = wsResumo.addRow([
            r.vendedor, r.setor.toUpperCase(), r.prosp_sem_visita, r.prosp_com_visita,
            r.clientes_fechados, r.qtd_cliente_grande, Number(r.valor_total_vendas || 0), 
            r.pos_venda, r.visitas_carteira, r.reativacoes, r.setor === 'industria' ? retencao : 'N/A', r.pontuacao
        ]);

        row.eachCell((cell, colNumber) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colNumber === 7) { cell.numFmt = '_-"R$"* #,##0.00_-;\\-"R$"* #,##0.00_-;_-"R$"* "-"??_-;_-@_-'; }
        });
    });
    wsResumo.columns.forEach((column, i) => { column.width = i === 0 ? 20 : 18; });


    // ---- MONTANDO A ABA 2 (Detalhamento Completo) ----
    const wsDetalhes = workbook.addWorksheet('Detalhamento de Clientes');
    wsDetalhes.mergeCells('A1:O1');
    const titleCellDet = wsDetalhes.getCell('A1');
    titleCellDet.value = `DETALHAMENTO COMPLETO DE CLIENTES E KPIs - ${dataParaTitulo}`;
    titleCellDet.font = { bold: true, size: 14, name: 'Calibri' };
    titleCellDet.alignment = { horizontal: 'center', vertical: 'middle' };

    const headersDet = [
        'Vendedor', 'Setor', 'Nome do Cliente', 'Região', 'Origem (Prospecção)', 'Status (Fechamento)',
        'Valor da Venda (R$)', 'KPI: VIP/Grande?', 'KPI: Visita na Carteira?', 'KPI: Reativação?', 
        'KPI: Pós-Venda Feito', 'KPI: Fidelizado (Recorrente)?', 'Data Prospecção', 'Data Fechamento', 'Observações'
    ];

    const headerRowDet = wsDetalhes.addRow(headersDet);
    headerRowDet.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } }; // Azul
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri' };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    clientesDetalhes.forEach(c => {
        const dataProsp = c.data_prospeccao ? new Date(c.data_prospeccao).toLocaleDateString('pt-BR') : '-';
        const dataFech = c.data_fechamento ? new Date(c.data_fechamento).toLocaleDateString('pt-BR') : '-';
        
        // Verificações exatas de KPI
        const valorMin = c.valor_cliente_grande > 0 ? c.valor_cliente_grande : (c.setor === 'ecommerce' ? 5000 : 15000);
        const isGrande = (c.fechou === 'sim' && (c.valor_venda >= valorMin || c.cliente_grande === 'sim')) ? 'Sim' : 'Não';
        const isVisitaCarteira = (c.carteira === 'sim' && c.prospeccao === 'com_visita') ? 'Sim' : 'Não';
        const isReativacao = (c.parado === 'sim' && c.fechou === 'sim') ? 'Sim' : 'Não';
        const isFidelizado = (c.carteira === 'sim' && c.comprou_recorrente === 'sim') ? 'Sim' : 'Não';
        
        const posVenda = c.pos_venda === 'sim' ? 'Feito' : (c.pos_venda === 'nao' ? 'Não' : 'Pendente');
        const prospeccaoStr = c.prospeccao === 'com_visita' ? 'Com Visita' : 'Sem Visita';
        const fechouStr = c.fechou === 'sim' ? 'Fechou' : 'Pendente';

        const row = wsDetalhes.addRow([
            c.vendedor_nome || 'Desconhecido',
            c.setor ? c.setor.toUpperCase() : '-',
            c.nome,
            c.regiao || '-',
            prospeccaoStr,
            fechouStr,
            Number(c.valor_venda || 0),
            isGrande,
            isVisitaCarteira,
            isReativacao,
            posVenda,
            isFidelizado,
            dataProsp,
            dataFech,
            c.observacao || ''
        ]);

        row.eachCell((cell, colNumber) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (colNumber === 7) { cell.numFmt = '_-"R$"* #,##0.00_-;\\-"R$"* #,##0.00_-;_-"R$"* "-"??_-;_-@_-'; }
        });
    });

    wsDetalhes.columns.forEach((column, i) => {
        if (i === 2) column.width = 30; // Cliente
        else if (i === 14) column.width = 45; // Obs
        else if (i === 0) column.width = 20; // Vendedor
        else column.width = 18;
    });

    if (baixarDireto) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Relatorio_Detalhado_${dataParaNome}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } else {
        const fileName = `Fechamento_Ciclo_${dataParaNome}_${Date.now()}.xlsx`;
        const filePath = path.join(__dirname, 'public', 'uploads', fileName);
        await workbook.xlsx.writeFile(filePath);
        return fileName;
    }
}

// ==========================================
// ROTA: EXPORTAR PLANILHA EXCEL FORMATADA (.XLSX)
// ==========================================
app.get('/admin/exportar', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');
  await gerarPlanilhaExcel(res, true);
});

// ==========================================
// ROTA: EXPORTAR PLANILHA DETALHADA (FILTROS)
// ==========================================
app.get('/admin/exportar-clientes', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');
  const { vendedor_id, data_inicio, data_fim } = req.query;

  let query = `
        SELECT c.*, u.nome as vendedor_nome, u.setor, u.valor_cliente_grande 
        FROM clientes c 
        LEFT JOIN usuarios u ON c.vendedor_id = u.id 
        WHERE 1=1
    `;
  const params = [];

  if (vendedor_id && vendedor_id !== 'todos') {
    query += ` AND c.vendedor_id = ?`;
    params.push(vendedor_id);
  }
  if (data_inicio && data_fim) {
    query += ` AND DATE(COALESCE(c.data_prospeccao, c.data_fechamento)) BETWEEN ? AND ?`;
    params.push(data_inicio, data_fim);
  }
  query += ` ORDER BY c.id DESC`;

  const [clientesExport] = await db.query(query, params);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clientes Exportados');

  worksheet.mergeCells('A1:O1');
  const titleCell = worksheet.getCell('A1');
  const nomeVendedorTitulo = vendedor_id === 'todos' ? 'Todos os Vendedores' : (clientesExport[0]?.vendedor_nome || 'Vendedor Específico');
  titleCell.value = `DADOS DE CLIENTES - Vendedor: ${nomeVendedorTitulo} | Período: ${data_inicio.split('-').reverse().join('/')} a ${data_fim.split('-').reverse().join('/')}`;
  titleCell.font = { bold: true, size: 14, name: 'Calibri' };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const headers = [
    'Vendedor', 'Setor', 'Nome do Cliente', 'Região / Cidade', 'Origem (Prospecção)', 'Status',
    'Valor da Venda (R$)', 'VIP (Grande)?', 'Visita Carteira?', 'Reativação?', 'Pós-Venda', 'Recorrência',
    'Data Prospecção', 'Data Fechamento', 'Observações'
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri' };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  clientesExport.forEach(c => {
    const dataProsp = c.data_prospeccao ? new Date(c.data_prospeccao).toLocaleDateString('pt-BR') : '-';
    const dataFech = c.data_fechamento ? new Date(c.data_fechamento).toLocaleDateString('pt-BR') : '-';
    
    const valorMin = c.valor_cliente_grande > 0 ? c.valor_cliente_grande : (c.setor === 'ecommerce' ? 5000 : 15000);
    const isVip = (c.fechou === 'sim' && (c.valor_venda >= valorMin || c.cliente_grande === 'sim')) ? 'Sim' : 'Não';
    const isVisita = (c.carteira === 'sim' && c.prospeccao === 'com_visita') ? 'Sim' : 'Não';
    const isReativacao = (c.parado === 'sim' && c.fechou === 'sim') ? 'Sim' : 'Não';

    const row = worksheet.addRow([
      c.vendedor_nome || 'Desconhecido', c.setor ? c.setor.toUpperCase() : '-', c.nome,
      c.regiao || '-', c.prospeccao === 'com_visita' ? 'Com Visita' : 'Sem Visita',
      c.fechou === 'sim' ? 'Fechou' : 'Pendente', Number(c.valor_venda || 0), isVip,
      isVisita, isReativacao, c.pos_venda === 'sim' ? 'Feito' : (c.pos_venda === 'nao' ? 'Não' : 'Pendente'),
      c.comprou_recorrente === 'sim' ? 'Comprou' : 'Inativo', dataProsp, dataFech, c.observacao || ''
    ]);

    row.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      if (colNumber === 7) { cell.numFmt = '_-"R$"* #,##0.00_-;\\-"R$"* #,##0.00_-;_-"R$"* "-"??_-;_-@_-'; }
    });
  });

  worksheet.columns.forEach((column, i) => {
    if (i === 2) column.width = 30;
    else if (i === 14) column.width = 45;
    else if (i === 0) column.width = 20;
    else column.width = 16;
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Exportacao_Filtro_Clientes_${Date.now()}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

// ==========================================
// ROTA: ZERAR CICLO COMERCIAL (FECHAR MÊS) E GERAR RELATÓRIO VIA AJAX
// ==========================================
app.post('/admin/zerar-ciclo', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
      // 1. Gera e salva o relatório completo fisicamente no servidor ANTES de zerar
      const fileName = await gerarPlanilhaExcel(null, false);

      // 2. Limpa o ciclo no banco de dados
      await db.query('UPDATE clientes SET arquivado = 1 WHERE arquivado = 0');
      await db.query('UPDATE usuarios SET pontuacao = 0, faturamento_manual = 0 WHERE tipo = "vendedor"');

      // 3. Retorna a URL para o front-end baixar
      res.json({ success: true, downloadUrl: `/uploads/${fileName}` });

  } catch (error) {
      console.error('Erro no fechamento do ciclo:', error);
      res.status(500).json({ success: false, error: 'Ocorreu um erro interno.' });
  }
});


// ==========================================
// ROTA DO ADMIN
// ==========================================
app.get('/admin', checarAuth, async (req, res) => {
  if (req.session.usuario.tipo !== 'admin') return res.redirect('/vendedor');

  const [usuarios] = await db.query('SELECT * FROM usuarios ORDER BY pontuacao DESC');
  const [metas] = await db.query('SELECT * FROM metas');
  const [metaGlobalDb] = await db.query('SELECT valor FROM meta_global WHERE id = 1');
  const [totalVendasDb] = await db.query('SELECT SUM(valor_venda) as total FROM clientes WHERE fechou = "sim" AND arquivado = 0');

  const metaGlobal = metaGlobalDb[0]?.valor || 0;
  const alcancadoGlobal = totalVendasDb[0]?.total || 0;

  const [kpisGlobais] = await db.query(`
        SELECT 
            u.setor,
            SUM(IF(c.prospeccao = 'sem_visita', 1, 0)) AS prosp_sem_visita,
            SUM(IF(c.prospeccao = 'com_visita', 1, 0)) AS prosp_com_visita,
            SUM(IF(c.fechou = 'sim', 1, 0)) AS clientes_fechar,
            SUM(IF(c.fechou = 'sim' AND (c.valor_venda >= IF(u.setor = 'ecommerce', 5000, 15000) OR c.cliente_grande = 'sim'), 1, 0)) AS qtd_cliente_grande,
            SUM(IF(c.fechou = 'sim', c.valor_venda, 0)) AS valor_total_vendas, 
            SUM(IF(c.pos_venda = 'sim', 1, 0)) AS pos_venda,
            SUM(IF(c.carteira = 'sim' AND c.prospeccao = 'com_visita', 1, 0)) AS visitas_carteira,
            SUM(IF(c.parado = 'sim', 1, 0)) AS reativacoes,
            SUM(IF(c.carteira = 'sim', 1, 0)) AS total_carteira,
            SUM(IF(c.carteira = 'sim' AND c.comprou_recorrente = 'sim', 1, 0)) AS total_fidelizados
            
        FROM usuarios u
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
    await recalcularTodasAsPontuacoes();
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

// ROTA: SALVAR METAS INDIVIDUAIS
app.post('/admin/usuario/metas', checarAuth, async (req, res) => {
    if (req.session.usuario.tipo !== 'admin') return res.redirect('/');

    const {
        vendedor_id, meta_geral, valor_cliente_grande, qtd_prosp_sem_visita, 
        qtd_prosp_com_visita, qtd_clientes_fechar, qtd_cliente_grande, 
        qtd_pos_venda, qtd_visitas_carteira, qtd_reativacoes, taxa_retencao
    } = req.body;

    await db.query(`
        UPDATE usuarios SET 
            meta_geral = ?, valor_cliente_grande = ?, qtd_prosp_sem_visita = ?, 
            qtd_prosp_com_visita = ?, qtd_clientes_fechar = ?, qtd_cliente_grande = ?, 
            qtd_pos_venda = ?, qtd_visitas_carteira = ?, qtd_reativacoes = ?, taxa_retencao = ?
        WHERE id = ? AND tipo = 'vendedor'
    `, [
        meta_geral || 0, valor_cliente_grande || 0, qtd_prosp_sem_visita || 0,
        qtd_prosp_com_visita || 0, qtd_clientes_fechar || 0, qtd_cliente_grande || 0,
        qtd_pos_venda || 0, qtd_visitas_carteira || 0, qtd_reativacoes || 0, taxa_retencao || 0,
        vendedor_id
    ]);

    await recalcularTodasAsPontuacoes();
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
  await recalcularTodasAsPontuacoes();
  res.redirect('/admin');
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

  const { id, nome, prospeccao, fechou, valor_venda, carteira, parado, cliente_grande, regiao, observacao, data_prospeccao, data_fechamento } = req.body;

  const isCarteira = carteira === 'sim' ? 'sim' : 'nao';
  const isParado = parado === 'sim' ? 'sim' : 'nao';
  const isGrande = cliente_grande === 'sim' ? 'sim' : 'nao';
  const dataProspFormatada = data_prospeccao ? data_prospeccao : null;
  const dataFechFormatada = data_fechamento ? data_fechamento : null;

  await db.query(`
        UPDATE clientes SET 
            nome = ?, prospeccao = ?, fechou = ?, valor_venda = ?, carteira = ?, parado = ?, cliente_grande = ?, regiao = ?, observacao = ?, data_prospeccao = ?, data_fechamento = ?
        WHERE id = ?`,
    [nome, prospeccao, fechou, valor_venda || 0, isCarteira, isParado, isGrande, regiao, observacao || null, dataProspFormatada, dataFechFormatada, id]
  );

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
  const { id, nome, prospeccao, fechou, valor_venda, carteira, parado, cliente_grande, regiao, observacao, data_prospeccao, data_fechamento } = req.body;

  const isCarteira = carteira === 'sim' ? 'sim' : 'nao';
  const isParado = parado === 'sim' ? 'sim' : 'nao';
  const isGrande = cliente_grande === 'sim' ? 'sim' : 'nao';
  const dataProspFormatada = data_prospeccao ? data_prospeccao : null;
  const dataFechFormatada = data_fechamento ? data_fechamento : null;

  await db.query(`
        UPDATE clientes SET 
            nome = ?, prospeccao = ?, fechou = ?, valor_venda = ?, carteira = ?, parado = ?, cliente_grande = ?, regiao = ?, observacao = ?, data_prospeccao = ?, data_fechamento = ?
        WHERE id = ? AND vendedor_id = ?`,
    [nome, prospeccao, fechou, valor_venda || 0, isCarteira, isParado, isGrande, regiao, observacao || null, dataProspFormatada, dataFechFormatada, id, vendedor.id]
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