// Variáveis globais
let graficoGastosCategorias = null;
let graficoEvolucaoGastos = null;
let comprovanteSelecionado = null;
let comprovantePagamentoSelecionado = null;
let comprovanteRecebimentoSelecionado = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();
    carregarGastos();
    configurarUploadComprovante();
    configurarUploadComprovantePagamento();
    configurarUploadComprovanteRecebimento();
    carregarBancos();
    
    // Configurar data inicial do gráfico e filtro
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    
    // Configurar gráfico
    const mesGrafico = document.getElementById('mesGrafico');
    if (mesGrafico) {
        mesGrafico.value = mesAtual;
    }
    
    // Configurar filtro de mês
    const filtroMes = document.getElementById('filtroMes');
    if (filtroMes) {
        filtroMes.value = mesAtual;
    }
    
    // Configurar data de pagamento
    const pagamentoData = document.getElementById('pagamentoData');
    if (pagamentoData) {
        pagamentoData.value = hoje.toISOString().split('T')[0];
    }
    
    // Configurar data de recebimento
    const recebimentoData = document.getElementById('recebimentoData');
    if (recebimentoData) {
        recebimentoData.value = hoje.toISOString().split('T')[0];
    }
    
    atualizarGraficos();
});

// Carrega as categorias no select
async function carregarCategorias() {
    const categorias = await db.getAll('categorias_gastos');
    const selectCategoria = document.getElementById('categoriaGasto');
    
    selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>';
    if (Array.isArray(categorias)) {
        categorias.forEach(categoria => {
            selectCategoria.innerHTML += `<option value="${categoria.id}">${categoria.nome}</option>`;
        });
    }
}

// Carrega os gastos nas tabelas
async function carregarGastos() {
    await carregarGastosFixos();
    await carregarGastosVariaveis();
    await carregarListaGastos();
}

// Carrega os gastos fixos
async function carregarGastosFixos() {
    const gastosFixos = await db.getAll('gastos_fixos');
    const categorias = await db.getAll('categorias_gastos');
    const tbody = document.getElementById('tabelaGastosFixos');
    tbody.innerHTML = '';

    if (Array.isArray(gastosFixos)) {
        gastosFixos.forEach(gasto => {
            const categoria = Array.isArray(categorias) ? categorias.find(c => c.id === Number(gasto.categoriaId)) : null;
            const hoje = new Date();
            const diaAtual = hoje.getDate();
            const status = diaAtual > gasto.vencimento ? 'atrasado' : 'em-dia';
            const pago = gasto.pago ? true : false;

            tbody.innerHTML += `
                <tr>
                    <td>${gasto.descricao}</td>
                    <td>${categoria ? categoria.nome : 'N/A'}</td>
                    <td>${Utils.formatarMoeda(gasto.valor)}</td>
                    <td>Dia ${gasto.vencimento}</td>
                    <td>
                        ${pago ? 
                            `<span class="status pago">Pago</span>` : 
                            `<span class="status ${status}">${status === 'atrasado' ? 'Atrasado' : 'Em dia'}</span>`
                        }
                    </td>
                    <td>
                        <div class="acoes">
                            ${!pago ? `
                                <button class="btn btn-success" onclick="abrirModalPagamento('fixo', ${gasto.id})">
                                    <i class="fas fa-check-circle"></i>
                                </button>
                            ` : `
                                <button class="btn btn-info" onclick="verDetalhesPagamento('fixo', ${gasto.id})">
                                    <i class="fas fa-receipt"></i>
                                </button>
                            `}
                            <button class="btn btn-editar" onclick="editarGasto('fixo', ${gasto.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-perigo" onclick="excluirGasto('fixo', ${gasto.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
}

// Carrega os gastos variáveis
async function carregarGastosVariaveis() {
    const gastosVariaveis = await db.getAll('gastos_variaveis');
    const categorias = await db.getAll('categorias_gastos');
    const tbody = document.getElementById('tabelaGastosVariaveis');
    tbody.innerHTML = '';

    if (Array.isArray(gastosVariaveis)) {
        gastosVariaveis.forEach(gasto => {
            const categoria = Array.isArray(categorias) ? categorias.find(c => c.id === Number(gasto.categoriaId)) : null;
            const pago = gasto.pago ? true : false;
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(gasto.data).toLocaleDateString()}</td>
                    <td>${gasto.descricao}</td>
                    <td>${categoria ? categoria.nome : 'N/A'}</td>
                    <td>${Utils.formatarMoeda(gasto.valor)}</td>
                    <td>
                        <div class="acoes">
                            ${!pago ? `
                                <button class="btn btn-success" onclick="abrirModalPagamento('variavel', ${gasto.id})">
                                    <i class="fas fa-check-circle"></i>
                                </button>
                            ` : `
                                <button class="btn btn-info" onclick="verDetalhesPagamento('variavel', ${gasto.id})">
                                    <i class="fas fa-receipt"></i>
                                </button>
                            `}
                            <button class="btn btn-editar" onclick="editarGasto('variavel', ${gasto.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-perigo" onclick="excluirGasto('variavel', ${gasto.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                            ${gasto.comprovante ? `
                                <button class="btn btn-info" onclick="visualizarComprovante('${gasto.comprovante}')">
                                    <i class="fas fa-file-image"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
    }
}

// Abre o modal para novo gasto
function abrirModalGasto(tipo) {
    document.getElementById('modalGasto').classList.add('active');
    document.getElementById('modalTituloGasto').textContent = tipo === 'fixo' ? 'Novo Gasto Fixo' : 'Novo Gasto Variável';
    document.getElementById('tipoGasto').value = tipo;
    document.getElementById('gastoId').value = '';
    document.getElementById('formGasto').reset();
    
    // Mostrar/ocultar campos específicos
    document.getElementById('camposGastoFixo').style.display = tipo === 'fixo' ? 'block' : 'none';
    document.getElementById('camposGastoVariavel').style.display = tipo === 'variavel' ? 'block' : 'none';

    // Se for gasto variável, preencher a data atual
    if (tipo === 'variavel') {
        document.getElementById('dataGasto').value = new Date().toISOString().split('T')[0];
    }
}

// Fecha o modal de gasto
function fecharModalGasto() {
    document.getElementById('modalGasto').classList.remove('active');
    document.getElementById('formGasto').reset();
    comprovanteSelecionado = null;
    document.getElementById('previewArea').hidden = true;
    document.getElementById('uploadArea').classList.remove('drag-over');
}

// Salva um gasto
function salvarGasto(event) {
    event.preventDefault();
    
    const tipo = document.getElementById('tipoGasto').value;
    const id = document.getElementById('gastoId').value;
    
    const gasto = {
        descricao: document.getElementById('descricaoGasto').value,
        categoriaId: Number(document.getElementById('categoriaGasto').value),
        tipo: document.getElementById('tipoGastoSelect').value,
        valor: Number(document.getElementById('valorGasto').value)
    };

    if (tipo === 'fixo') {
        gasto.vencimento = Number(document.getElementById('vencimentoGasto').value);
        if (id) {
            db.update('gastos_fixos', Number(id), gasto);
        } else {
            db.insert('gastos_fixos', gasto);
        }
    } else {
        gasto.data = document.getElementById('dataGasto').value;
        if (comprovanteSelecionado) {
            gasto.comprovante = comprovanteSelecionado;
        }
        if (id) {
            db.update('gastos_variaveis', Number(id), gasto);
        } else {
            db.insert('gastos_variaveis', gasto);
        }
    }

    carregarGastos();
    atualizarGraficos();
    fecharModalGasto();
}

// Edita um gasto
async function editarGasto(tipo, id) {
    const tabela = tipo === 'fixo' ? 'gastos_fixos' : 'gastos_variaveis';
    const gastos = await db.getAll(tabela);
    const gasto = Array.isArray(gastos) ? gastos.find(g => g.id === Number(id)) : null;
    if (!gasto) return;

    document.getElementById('modalGasto').classList.add('active');
    document.getElementById('modalTituloGasto').textContent = tipo === 'fixo' ? 'Editar Gasto Fixo' : 'Editar Gasto Variável';
    document.getElementById('tipoGasto').value = tipo;
    document.getElementById('gastoId').value = id;
    document.getElementById('descricaoGasto').value = gasto.descricao;
    document.getElementById('categoriaGasto').value = gasto.categoriaId;
    document.getElementById('tipoGastoSelect').value = gasto.tipo;
    document.getElementById('valorGasto').value = gasto.valor;
    document.getElementById('camposGastoFixo').style.display = tipo === 'fixo' ? 'block' : 'none';
    document.getElementById('camposGastoVariavel').style.display = tipo === 'variavel' ? 'block' : 'none';
    if (tipo === 'fixo') {
        document.getElementById('vencimentoGasto').value = gasto.vencimento;
    } else {
        document.getElementById('dataGasto').value = gasto.data;
    }
}

// Exclui um gasto
function excluirGasto(tipo, id) {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) return;

    const tabela = tipo === 'fixo' ? 'gastos_fixos' : 'gastos_variaveis';
    
    // Usar o método delete do banco de dados
    db.delete(tabela, id);
    
    // Recarregar gastos mantendo o filtro atual
    if (tipo === 'fixo') {
        carregarGastosFixos();
    } else {
        carregarGastosVariaveis();
    }
    
    // Atualizar a lista de gastos mantendo o filtro atual
    const filtroMes = document.getElementById('filtroMes');
    if (filtroMes) {
        carregarListaGastos(filtroMes.value);
    } else {
        carregarListaGastos();
    }
    
    // Atualizar gráficos
    atualizarGraficos();
}

// Configuração do upload de comprovante
function configurarUploadComprovante() {
    const uploadArea = document.getElementById('uploadArea');
    const inputComprovante = document.getElementById('inputComprovante');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    inputComprovante.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

// Manipula a seleção de arquivo
function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas imagens.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        comprovanteSelecionado = e.target.result;
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('previewArea').hidden = false;
    };
    reader.readAsDataURL(file);
}

// Remove a imagem selecionada
function removerImagem() {
    comprovanteSelecionado = null;
    document.getElementById('previewArea').hidden = true;
    document.getElementById('inputComprovante').value = '';
}

// Visualiza o comprovante
function visualizarComprovante(comprovante) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Visualizar Comprovante</h3>
                <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <img src="${comprovante}" alt="Comprovante" style="max-width: 100%;">
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Atualiza os gráficos
async function atualizarGraficos() {
    const mesSelecionado = document.getElementById('mesGrafico').value;
    const [ano, mes] = mesSelecionado.split('-');
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);

    // Buscar gastos do período
    const gastosFixosAll = await db.getAll('gastos_fixos');
    const gastosVariaveisAll = await db.getAll('gastos_variaveis');
    const categorias = await db.getAll('categorias_gastos');

    // Filtrar gastos do período
    const gastosFixos = Array.isArray(gastosFixosAll) ? gastosFixosAll.filter(gasto => {
        const data = new Date(gasto.dataPagamento || primeiroDia);
        return data >= primeiroDia && data <= ultimoDia;
    }) : [];
    const gastosVariaveis = Array.isArray(gastosVariaveisAll) ? gastosVariaveisAll.filter(gasto => {
        const data = new Date(gasto.data);
        return data >= primeiroDia && data <= ultimoDia;
    }) : [];

    // Calcular totais por categoria
    const gastosPorCategoria = {};

    // Somar gastos fixos
    if (Array.isArray(gastosFixos)) {
        gastosFixos.forEach(gasto => {
            if (!gastosPorCategoria[gasto.categoriaId]) {
                gastosPorCategoria[gasto.categoriaId] = 0;
            }
            gastosPorCategoria[gasto.categoriaId] += Number(gasto.valor);
        });
    }

    // Somar gastos variáveis
    if (Array.isArray(gastosVariaveis)) {
        gastosVariaveis.forEach(gasto => {
            if (!gastosPorCategoria[gasto.categoriaId]) {
                gastosPorCategoria[gasto.categoriaId] = 0;
            }
            gastosPorCategoria[gasto.categoriaId] += Number(gasto.valor);
        });
    }

    // Preparar dados para o gráfico
    const labels = [];
    const dados = [];
    const cores = [
        '#2ECC71', '#3498DB', '#9B59B6', 
        '#F1C40F', '#E67E22', '#E74C3C'
    ];

    Object.keys(gastosPorCategoria).forEach((categoriaId, index) => {
        const categoria = Array.isArray(categorias) ? categorias.find(c => c.id === Number(categoriaId)) : null;
        if (categoria) {
            labels.push(categoria.nome);
            dados.push(gastosPorCategoria[categoriaId]);
        }
    });

    // Atualizar gráfico de categorias
    if (graficoGastosCategorias) graficoGastosCategorias.destroy();
    const ctx1 = document.getElementById('graficoGastosCategorias').getContext('2d');
    graficoGastosCategorias = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                backgroundColor: cores
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });

    // Atualizar gráfico de evolução
    if (graficoEvolucaoGastos) graficoEvolucaoGastos.destroy();
    const ctx2 = document.getElementById('graficoEvolucaoGastos').getContext('2d');
    graficoEvolucaoGastos = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: Array.from({length: ultimoDia.getDate()}, (_, i) => i + 1),
            datasets: [{
                label: 'Gastos Acumulados',
                data: calcularGastosAcumulados(gastosVariaveis, ultimoDia.getDate()),
                borderColor: '#3498DB',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Calcula os gastos acumulados por dia
function calcularGastosAcumulados(gastos, totalDias) {
    const gastosAcumulados = new Array(totalDias).fill(0);
    let acumulado = 0;

    gastos.forEach(gasto => {
        const dia = new Date(gasto.data).getDate();
        acumulado += Number(gasto.valor);
        for (let i = dia - 1; i < totalDias; i++) {
            gastosAcumulados[i] = acumulado;
        }
    });

    return gastosAcumulados;
}

// Atualiza as subcategorias com base na categoria selecionada
function atualizarSubcategorias() {
    const categoriaId = Number(document.getElementById('categoriaGasto').value);
    const selectSubcategoria = document.getElementById('subcategoriaGasto');
    
    // Limpar select de subcategorias
    selectSubcategoria.innerHTML = '<option value="">Selecione uma subcategoria</option>';
    
    if (!categoriaId) return;
    
    // Buscar subcategorias da categoria selecionada
    const todasSubcategorias = db.getAll('subcategorias_gastos') || [];
    const subcategorias = todasSubcategorias.filter(sub => sub.categoriaId === categoriaId);
    
    // Preencher select de subcategorias
    subcategorias.forEach(subcategoria => {
        const option = document.createElement('option');
        option.value = subcategoria.id;
        option.textContent = subcategoria.nome;
        option.dataset.tipo = subcategoria.tipo;
        selectSubcategoria.appendChild(option);
    });
    
    // Adicionar evento para atualizar tipo automaticamente
    selectSubcategoria.onchange = function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption && selectedOption.dataset.tipo) {
            document.getElementById('tipoGastoSelect').value = selectedOption.dataset.tipo;
        }
    };
}

// Carrega a lista completa de gastos
async function carregarListaGastos(mesFiltro = null) {
    const tbody = document.getElementById('tabelaGastos');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Obter todos os gastos variáveis e categorias
    const gastosVariaveis = await db.getAll('gastos_variaveis');
    const categorias = await db.getAll('categorias_gastos');

    // Garantir que temos arrays
    let gastosFiltrados = Array.isArray(gastosVariaveis) ? [...gastosVariaveis] : [];
    
    // Filtrar por mês se especificado
    if (mesFiltro) {
        const [ano, mes] = mesFiltro.split('-');
        const primeiroDia = new Date(ano, mes - 1, 1);
        const ultimoDia = new Date(ano, mes, 0);
        gastosFiltrados = gastosFiltrados.filter(gasto => {
            const dataGasto = new Date(gasto.data);
            return dataGasto >= primeiroDia && dataGasto <= ultimoDia;
        });
    }

    // Ordenar por data (mais recente primeiro)
    if (Array.isArray(gastosFiltrados)) {
        gastosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    // Adicionar à tabela
    if (Array.isArray(gastosFiltrados)) {
        gastosFiltrados.forEach(gasto => {
            const categoria = Array.isArray(categorias) ? categorias.find(c => c.id === Number(gasto.categoriaId)) : null;
            const pago = gasto.pago ? true : false;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(gasto.data).toLocaleDateString()}</td>
                <td>${gasto.descricao}</td>
                <td>${categoria ? categoria.nome : 'N/A'}</td>
                <td>${Utils.formatarMoeda(gasto.valor)}</td>
                <td>
                    ${gasto.comprovante ? 
                        `<button class="btn btn-info" onclick="visualizarComprovante('${gasto.comprovante}')">
                            <i class="fas fa-file-image"></i> Ver
                        </button>` : 
                        'Sem comprovante'
                    }
                </td>
                <td>
                    <div class="acoes">
                        ${!pago ? `
                            <button class="btn btn-success" onclick="abrirModalPagamento('variavel', ${gasto.id})">
                                <i class="fas fa-check-circle"></i> Pagar
                            </button>
                        ` : `
                            <button class="btn btn-info" onclick="verDetalhesPagamento('variavel', ${gasto.id})">
                                <i class="fas fa-receipt"></i> Detalhes
                            </button>
                        `}
                        <button class="btn btn-editar" onclick="editarGasto('variavel', ${gasto.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-perigo" onclick="excluirGasto('variavel', ${gasto.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Mostrar mensagem se não houver gastos
    if (!gastosFiltrados || gastosFiltrados.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="6" class="text-center">
                Nenhum gasto encontrado ${mesFiltro ? 'para o período selecionado' : ''}.
            </td>
        `;
        tbody.appendChild(tr);
    }
}

// Filtra os gastos por mês
function filtrarGastosPorMes() {
    const filtroMes = document.getElementById('filtroMes');
    if (!filtroMes) return;
    
    const mesSelecionado = filtroMes.value;
    carregarListaGastos(mesSelecionado);
}

// Carrega os bancos nos selects
async function carregarBancos() {
    const bancos = await db.getAll('bancos');
    // Carregar bancos no select de pagamento
    const selectPagamento = document.getElementById('pagamentoBanco');
    if (selectPagamento) {
        selectPagamento.innerHTML = '<option value="">Selecione um banco</option>';
        if (Array.isArray(bancos)) {
            bancos.forEach(banco => {
                selectPagamento.innerHTML += `<option value="${banco.id}">${banco.nome} (${Utils.formatarMoeda(banco.saldo)})</option>`;
            });
        }
    }
    // Carregar bancos no select de recebimento
    const selectRecebimento = document.getElementById('recebimentoBanco');
    if (selectRecebimento) {
        selectRecebimento.innerHTML = '<option value="">Selecione um banco</option>';
        if (Array.isArray(bancos)) {
            bancos.forEach(banco => {
                selectRecebimento.innerHTML += `<option value="${banco.id}">${banco.nome} (${Utils.formatarMoeda(banco.saldo)})</option>`;
            });
        }
    }
}

// Abre o modal de pagamento
async function abrirModalPagamento(tipo, id) {
    const tabela = tipo === 'fixo' ? 'gastos_fixos' : 'gastos_variaveis';
    const gastos = await db.getAll(tabela);
    const gasto = Array.isArray(gastos) ? gastos.find(g => g.id === Number(id)) : null;
    if (!gasto) return;
    // Preencher os campos do modal
    document.getElementById('pagamentoGastoId').value = id;
    document.getElementById('pagamentoGastoTipo').value = tipo;
    document.getElementById('pagamentoDescricao').textContent = gasto.descricao;
    document.getElementById('pagamentoValor').textContent = Utils.formatarMoeda(gasto.valor);
    // Configurar data atual
    document.getElementById('pagamentoData').value = new Date().toISOString().split('T')[0];
    // Limpar comprovante
    comprovantePagamentoSelecionado = null;
    document.getElementById('previewAreaPagamento').hidden = true;
    // Exibir o modal
    document.getElementById('modalPagamento').classList.add('active');
}

// Confirma o pagamento
async function confirmarPagamento() {
    const gastoId = Number(document.getElementById('pagamentoGastoId').value);
    const gastoTipo = document.getElementById('pagamentoGastoTipo').value;
    const bancoId = Number(document.getElementById('pagamentoBanco').value);
    const metodo = document.getElementById('pagamentoMetodo').value;
    const dataPagamento = document.getElementById('pagamentoData').value;
    // Validar campos obrigatórios
    if (!bancoId || !metodo || !dataPagamento) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    // Obter o gasto
    const tabela = gastoTipo === 'fixo' ? 'gastos_fixos' : 'gastos_variaveis';
    const gastos = await db.getAll(tabela);
    const gasto = Array.isArray(gastos) ? gastos.find(g => g.id === gastoId) : null;
    if (!gasto) {
        alert('Gasto não encontrado.');
        return;
    }
    // Obter o banco
    const bancos = await db.getAll('bancos');
    const banco = Array.isArray(bancos) ? bancos.find(b => b.id === bancoId) : null;
    if (!banco) {
        alert('Banco não encontrado.');
        return;
    }
    // Verificar saldo
    if (banco.saldo < gasto.valor) {
        if (!confirm(`O saldo do banco (${Utils.formatarMoeda(banco.saldo)}) é menor que o valor do gasto (${Utils.formatarMoeda(gasto.valor)}). Deseja continuar?`)) {
            return;
        }
    }
    // Atualizar o gasto
    gasto.pago = true;
    gasto.dataPagamento = dataPagamento;
    gasto.metodoPagamento = metodo;
    gasto.bancoId = bancoId;
    if (comprovantePagamentoSelecionado) {
        gasto.comprovantePagamento = comprovantePagamentoSelecionado;
    }
    // Atualizar o banco
    banco.saldo -= Number(gasto.valor);
    // Salvar as alterações
    await db.update(tabela, gastoId, gasto);
    await db.update('bancos', bancoId, banco);
    // Registrar o pagamento no histórico
    const pagamento = {
        id: Date.now(),
        tipo: gastoTipo,
        referenciaId: gastoId,
        descricao: gasto.descricao,
        valor: gasto.valor,
        data: dataPagamento,
        metodo: metodo,
        bancoId: bancoId,
        comprovante: comprovantePagamentoSelecionado
    };
    const pagamentosRecentes = (await db.getAll('pagamentosRecentes')) || [];
    pagamentosRecentes.push(pagamento);
    localStorage.setItem('pagamentosRecentes', JSON.stringify(pagamentosRecentes));
    // Fechar o modal e atualizar a interface
    fecharModal('modalPagamento');
    await carregarGastos();
    await carregarBancos();
    alert('Pagamento registrado com sucesso!');
}

// Ver detalhes do pagamento
async function verDetalhesPagamento(tipo, id) {
    const tabela = tipo === 'fixo' ? 'gastos_fixos' : 'gastos_variaveis';
    const gastos = await db.getAll(tabela);
    const gasto = Array.isArray(gastos) ? gastos.find(g => g.id === Number(id)) : null;
    if (!gasto || !gasto.pago) {
        alert('Detalhes do pagamento não disponíveis.');
        return;
    }
    const bancos = await db.getAll('bancos');
    const banco = Array.isArray(bancos) ? bancos.find(b => b.id === Number(gasto.bancoId)) : null;
    // Criar modal de detalhes
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Detalhes do Pagamento</h3>
                <span class="modal-close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="detalhe-pagamento">
                    <h4>${gasto.descricao}</h4>
                    <p><span class="label">Valor:</span> <span class="valor">${Utils.formatarMoeda(gasto.valor)}</span></p>
                    <p><span class="label">Data do Pagamento:</span> <span class="valor">${new Date(gasto.dataPagamento).toLocaleDateString()}</span></p>
                    <p><span class="label">Método:</span> <span class="valor">${formatarMetodoPagamento(gasto.metodoPagamento)}</span></p>
                    <p><span class="label">Banco:</span> <span class="valor">${banco ? banco.nome : 'N/A'}</span></p>
                </div>
                ${gasto.comprovantePagamento ? `
                    <div class="form-group">
                        <label class="form-label">Comprovante:</label>
                        <div class="text-center">
                            <img src="${gasto.comprovantePagamento}" alt="Comprovante" style="max-width: 100%; max-height: 300px; margin-top: 1rem;">
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Formata o método de pagamento
function formatarMetodoPagamento(metodo) {
    const metodos = {
        'debito': 'Débito',
        'credito': 'Cartão de Crédito',
        'pix': 'PIX',
        'boleto': 'Boleto',
        'dinheiro': 'Dinheiro',
        'transferencia': 'Transferência'
    };
    
    return metodos[metodo] || metodo;
}

// Configuração do upload de comprovante de pagamento
function configurarUploadComprovantePagamento() {
    const uploadArea = document.getElementById('uploadAreaPagamento');
    const inputComprovante = document.getElementById('inputComprovantePagamento');
    
    if (!uploadArea || !inputComprovante) return;

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            handleFileSelectPagamento(e.dataTransfer.files[0]);
        }
    });

    inputComprovante.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelectPagamento(e.target.files[0]);
        }
    });
}

// Manipula a seleção de arquivo para pagamento
function handleFileSelectPagamento(file) {
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas imagens.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        comprovantePagamentoSelecionado = e.target.result;
        document.getElementById('previewImagePagamento').src = e.target.result;
        document.getElementById('previewAreaPagamento').hidden = false;
    };
    reader.readAsDataURL(file);
}

// Remove a imagem de pagamento selecionada
function removerImagemPagamento() {
    comprovantePagamentoSelecionado = null;
    document.getElementById('previewAreaPagamento').hidden = true;
    document.getElementById('inputComprovantePagamento').value = '';
}

// Configuração do upload de comprovante de recebimento
function configurarUploadComprovanteRecebimento() {
    const uploadArea = document.getElementById('uploadAreaRecebimento');
    const inputComprovante = document.getElementById('inputComprovanteRecebimento');
    
    if (!uploadArea || !inputComprovante) return;

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            handleFileSelectRecebimento(e.dataTransfer.files[0]);
        }
    });

    inputComprovante.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelectRecebimento(e.target.files[0]);
        }
    });
}

// Manipula a seleção de arquivo para recebimento
function handleFileSelectRecebimento(file) {
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas imagens.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        comprovanteRecebimentoSelecionado = e.target.result;
        document.getElementById('previewImageRecebimento').src = e.target.result;
        document.getElementById('previewAreaRecebimento').hidden = false;
    };
    reader.readAsDataURL(file);
}

// Remove a imagem de recebimento selecionada
function removerImagemRecebimento() {
    comprovanteRecebimentoSelecionado = null;
    document.getElementById('previewAreaRecebimento').hidden = true;
    document.getElementById('inputComprovanteRecebimento').value = '';
}

// Fecha um modal
function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
} 