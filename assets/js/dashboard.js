// Variáveis globais
let mesAtualOffset = 0;
let graficoGastosRendas = null;
let graficoDistribuicaoGastos = null;

// Variáveis para o upload de comprovante
let comprovanteSelecionado = null;
let tipoOperacao = null;
let idReferencia = null;

// Constantes para as metas
const METAS = {
    PESSOAL: 300,
    CASA: 1500
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await atualizarDashboard();
    inicializarModais();

    // Eventos para upload de arquivos
    const uploadArea = document.getElementById('uploadArea');
    const inputComprovante = document.getElementById('inputComprovante');

    // Verificar se os elementos de upload existem
    if (uploadArea && inputComprovante) {
        // Evento de drag and drop
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

        // Evento de seleção de arquivo
        inputComprovante.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }
    
    // Verificar parâmetros de URL para abrir modais automaticamente
    const urlParams = new URLSearchParams(window.location.search);
    
    // Verificar se há um cartão para pagar
    const cartaoId = urlParams.get('cartao');
    if (cartaoId) {
        setTimeout(() => confirmarPagamento(parseInt(cartaoId)), 500);
    }
    
    // Verificar se há um gasto para pagar
    const gastoId = urlParams.get('gasto');
    if (gastoId) {
        setTimeout(() => abrirModalPagamentoGasto(parseInt(gastoId)), 500);
    }
    
    // Verificar se há uma renda para receber
    const rendaId = urlParams.get('renda');
    if (rendaId) {
        setTimeout(() => abrirModalRecebimento(parseInt(rendaId), urlParams.get('tipo')), 500);
    }
});

// Função para atualizar o dashboard
function atualizarDashboard() {
    // Verificar se estamos na página do dashboard
    const isDashboardPage = document.getElementById('mesSelecionado') !== null;
    
    // Atualizar texto do mês selecionado
    atualizarMesSelecionado();
    
    // Carregar dados apenas se estivermos na página do dashboard
    if (isDashboardPage) {
        carregarBancos();
        carregarCartoes();
        carregarGastosFixos();
        carregarRendas();
        atualizarResumoFinal();
    }
    
    // Carregar tabelas de últimos gastos e rendas
    carregarUltimosGastos();
    carregarUltimasRendas();
}

// Atualiza o mês selecionado
function atualizarMesSelecionado() {
    const mesSelecionadoElement = document.getElementById('mesSelecionado');
    if (!mesSelecionadoElement) {
        return; // Não faz nada se o elemento não existir
    }
    
    const hoje = new Date();
    const mesReferencia = new Date(hoje.getFullYear(), hoje.getMonth() + mesAtualOffset, 1);
    const options = { month: 'long', year: 'numeric' };
    mesSelecionadoElement.textContent = mesReferencia.toLocaleDateString('pt-BR', options);
}

// Muda o mês selecionado
function mudarMes(direcao) {
    mesAtualOffset += direcao;
    atualizarDashboard();
}

// Carrega os bancos com saldo
async function carregarBancos() {
    const bancos = await db.getAll('bancos');
    const listaBancos = document.getElementById('listaBancos');
    let totalBancos = 0;

    // Verificar se o elemento existe na página atual
    if (!listaBancos) {
        console.log('Elemento listaBancos não encontrado na página atual');
        return 0; // Retorna 0 para não afetar cálculos em outras funções
    }

    listaBancos.innerHTML = '';

    bancos.forEach(banco => {
        if (banco.saldo > 0) {
            totalBancos += Number(banco.saldo);
            const div = document.createElement('div');
            div.className = 'info-item';
            div.innerHTML = `
                <div class="info-item-content">
                    <i class="fas fa-university"></i>
                    ${banco.nome}
                </div>
                <span class="positive">${Utils.formatarMoeda(banco.saldo)}</span>
            `;
            listaBancos.appendChild(div);
        }
    });

    // Verificar se o elemento totalBancos existe
    const totalBancosElement = document.getElementById('totalBancos');
    if (totalBancosElement) {
        totalBancosElement.textContent = Utils.formatarMoeda(totalBancos);
    }
    
    return totalBancos;
}

// Carrega os cartões com fatura
async function carregarCartoes() {
    const cartoes = await db.getAll('cartoes');
    const gastosVariaveis = await db.getAll('gastos_variaveis');
    const listaCartoes = document.getElementById('listaCartoes');
    let totalFaturas = 0;
    let totalFaturasPagas = 0;
    let totalFaturasPendentes = 0;

    if (!listaCartoes) {
        console.log('Elemento listaCartoes não encontrado na página atual');
        return 0;
    }

    listaCartoes.innerHTML = '';

    const hoje = new Date();
    const mesReferencia = new Date(hoje.getFullYear(), hoje.getMonth() + mesAtualOffset, 1);
    const mes = mesReferencia.getMonth();
    const ano = mesReferencia.getFullYear();

    for (const cartao of cartoes) {
        const faturaCartao = await calcularFaturaAtual(cartao, mes, ano, gastosVariaveis);

        const faturaPaga = cartao.faturasPagas && cartao.faturasPagas.some(fp => {
            const dataPagamento = new Date(fp.dataPagamento);
            return dataPagamento.getMonth() === mes && dataPagamento.getFullYear() === ano;
        });

        totalFaturas += faturaCartao;
        if (faturaPaga) {
            totalFaturasPagas += faturaCartao;
        } else {
            totalFaturasPendentes += faturaCartao;
        }

        if (faturaCartao > 0) {
            const diaVencimento = new Date(ano, mes, cartao.vencimento);
            let statusVencimento = '';
            const diasParaVencimento = Math.ceil((diaVencimento - hoje) / (1000 * 60 * 60 * 24));
            
            if (!faturaPaga && diasParaVencimento < 0) {
                statusVencimento = 'atrasado';
            } else if (!faturaPaga && diasParaVencimento <= 5) {
                statusVencimento = 'proximo';
            }

            const div = document.createElement('div');
            div.className = 'info-item';
            div.innerHTML = `
                <div class="info-item-content">
                    <i class="fas fa-credit-card"></i>
                    <div>
                        ${cartao.nome}
                        <div class="vencimento ${statusVencimento}">
                            Vence dia ${cartao.vencimento}
                        </div>
                    </div>
                </div>
                <div class="info-item-actions">
                    <span class="${faturaPaga ? 'positive' : 'negative'}">
                        ${Utils.formatarMoeda(faturaCartao)}
                        ${faturaPaga ? '<i class="fas fa-check-circle"></i>' : ''}
                    </span>
                    ${!faturaPaga ? `
                        <button class="btn btn-pagar" onclick="confirmarPagamento(${cartao.id})">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </div>
            `;
            listaCartoes.appendChild(div);
        }
    }

    const totalFaturasElement = document.getElementById('totalFaturas');
    if (totalFaturasElement) {
        totalFaturasElement.textContent = Utils.formatarMoeda(totalFaturas);
    }
    
    const detalheFaturasElement = document.getElementById('detalheFaturas');
    if (detalheFaturasElement) {
        const detalheFaturas = document.createElement('div');
        detalheFaturas.className = 'info-detalhe';
        detalheFaturas.innerHTML = `
            <span class="info-detalhe-item positive">
                <i class="fas fa-check-circle"></i> Pagas: ${Utils.formatarMoeda(totalFaturasPagas)}
            </span>
            <span class="info-detalhe-item negative">
                <i class="fas fa-clock"></i> Pendentes: ${Utils.formatarMoeda(totalFaturasPendentes)}
            </span>
        `;
        detalheFaturasElement.innerHTML = '';
        detalheFaturasElement.appendChild(detalheFaturas);
    }

    return totalFaturasPendentes;
}

// Carrega os gastos fixos do mês
async function carregarGastosFixos() {
    const gastosFixos = await db.getAll('gastos_fixos');
    const listaGastos = document.getElementById('listaGastosFixos');
    let totalGastos = 0;
    let totalGastosPagos = 0;
    let totalGastosPendentes = 0;

    // Verificar se o elemento existe na página atual
    if (!listaGastos) {
        console.log('Elemento listaGastosFixos não encontrado na página atual');
        return 0; // Retorna 0 para não afetar cálculos em outras funções
    }

    listaGastos.innerHTML = '';

    // Obter o mês atual para filtrar pagamentos
    const hoje = new Date();
    const mesReferencia = new Date(hoje.getFullYear(), hoje.getMonth() + mesAtualOffset, 1);
    const primeiroDiaMes = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1);
    const ultimoDiaMes = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0);

    for (const gasto of gastosFixos) {
        totalGastos += Number(gasto.valor);
        
        // Verificar se o gasto está pago neste mês
        const pago = gasto.pago && gasto.dataPagamento && 
                    new Date(gasto.dataPagamento) >= primeiroDiaMes && 
                    new Date(gasto.dataPagamento) <= ultimoDiaMes;

        if (pago) {
            totalGastosPagos += Number(gasto.valor);
        } else {
            totalGastosPendentes += Number(gasto.valor);
        }
        
        const diasParaVencimento = gasto.vencimento - hoje.getDate();
        let statusVencimento = '';
        
        if (diasParaVencimento < 0 && !pago) {
            statusVencimento = 'atrasado';
        } else if (diasParaVencimento <= 5 && !pago) {
            statusVencimento = 'proximo';
        }

        const div = document.createElement('div');
        div.className = 'info-item';
        div.innerHTML = `
            <div class="info-item-content">
                <i class="fas fa-money-bill-wave"></i>
                <div>
                    ${gasto.descricao}
                    <div class="vencimento ${statusVencimento}">
                        ${pago ? 'Pago' : `Vence dia ${gasto.vencimento}`}
                    </div>
                </div>
            </div>
            <div class="info-item-actions">
                <span class="${pago ? 'positive' : 'negative'}">
                    ${Utils.formatarMoeda(gasto.valor)}
                    ${pago ? '<i class="fas fa-check-circle"></i>' : ''}
                </span>
                ${!pago ? `
                    <button class="btn btn-pagar" onclick="abrirModalPagamentoGasto(${gasto.id})">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
            </div>
        `;
        listaGastos.appendChild(div);
    }

    // Verificar se o elemento totalGastosFixos existe
    const totalGastosFixosElement = document.getElementById('totalGastosFixos');
    if (totalGastosFixosElement) {
        totalGastosFixosElement.textContent = Utils.formatarMoeda(totalGastos);
    }
    
    // Verificar se o elemento detalheGastosFixos existe
    const detalheGastosFixosElement = document.getElementById('detalheGastosFixos');
    if (detalheGastosFixosElement) {
        // Adicionar detalhes de gastos pagos/pendentes
        const detalheGastos = document.createElement('div');
        detalheGastos.className = 'info-detalhe';
        detalheGastos.innerHTML = `
            <span class="info-detalhe-item positive">
                <i class="fas fa-check-circle"></i> Pagos: ${Utils.formatarMoeda(totalGastosPagos)}
            </span>
            <span class="info-detalhe-item negative">
                <i class="fas fa-clock"></i> Pendentes: ${Utils.formatarMoeda(totalGastosPendentes)}
            </span>
        `;
        detalheGastosFixosElement.innerHTML = '';
        detalheGastosFixosElement.appendChild(detalheGastos);
    }

    return { totalGastosPendentes };
}

// Funções utilitárias para cálculo de dias úteis
function isDiaUtil(data) {
    const diaSemana = data.getDay();
    // 0 = domingo, 6 = sábado
    return diaSemana !== 0 && diaSemana !== 6;
}

function calcularQuintoDiaUtil(mes, ano) {
    let data = new Date(ano, mes, 1);
    let diasUteisContados = 0;
    
    while (diasUteisContados < 5) {
        if (isDiaUtil(data)) {
            diasUteisContados++;
        }
        
        if (diasUteisContados < 5) {
            data.setDate(data.getDate() + 1);
        }
    }
    
    return data;
}

function calcularProximoDiaUtil(data) {
    const novaData = new Date(data);
    
    while (!isDiaUtil(novaData)) {
        novaData.setDate(novaData.getDate() + 1);
    }
    
    return novaData;
}

// Função para obter a data real de recebimento com base nas regras
function obterDataRealRecebimento(renda, mes, ano) {
    // Se não tiver regra especial, usa o dia fixo
    if (!renda.regraRecebimento) {
        return new Date(ano, mes, renda.recebimento);
    }
    
    // Regra do 5º dia útil
    if (renda.regraRecebimento === 'dia-util') {
        return calcularQuintoDiaUtil(mes, ano);
    }
    
    // Regra do dia 15 ou próximo dia útil
    if (renda.regraRecebimento === 'dia-util-se-fds') {
        const data = new Date(ano, mes, renda.recebimento);
        
        // Se não for dia útil, retorna o próximo dia útil
        if (!isDiaUtil(data)) {
            return calcularProximoDiaUtil(data);
        }
        
        return data;
    }
    
    // Caso padrão
    return new Date(ano, mes, renda.recebimento);
}

// Carrega as rendas do mês
async function carregarRendas() {
    const rendas = await db.getAll('rendas');
    const listaRendas = document.getElementById('listaRendas');
    let totalRendas = 0;
    let totalRendasRecebidas = 0;
    let totalRendasPendentes = 0;

    // Verificar se o elemento existe na página atual
    if (!listaRendas) {
        console.log('Elemento listaRendas não encontrado na página atual');
        return 0; // Retorna 0 para não afetar cálculos em outras funções
    }

    listaRendas.innerHTML = '';

    // Obter o mês atual para filtrar recebimentos
    const hoje = new Date();
    const mesReferencia = new Date(hoje.getFullYear(), hoje.getMonth() + mesAtualOffset, 1);
    const primeiroDiaMes = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1);
    const ultimoDiaMes = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0);
    
    // Processar as rendas fixas
    const rendasFixas = await db.getAll('rendas_fixas');
    
    // Converter rendas fixas para o formato de rendas normais
    for (const rendaFixa of rendasFixas) {
        // Calcular a data real de recebimento com base nas regras
        const dataRecebimento = obterDataRealRecebimento(
            rendaFixa, 
            mesReferencia.getMonth(), 
            mesReferencia.getFullYear()
        );
        
        // Criar uma renda baseada na renda fixa
        const renda = {
            id: rendaFixa.id,
            descricao: rendaFixa.descricao,
            valor: rendaFixa.valor,
            categoria: rendaFixa.categoria,
            dataPrevisao: dataRecebimento.toISOString(),
            recebida: rendaFixa.recebida || false,
            dataRecebimento: rendaFixa.dataRecebimento,
            origem: 'fixa',
            rendaFixaId: rendaFixa.id,
            tipo: 'fixa'
        };
        
        rendas.push(renda);
    }
    
    // Processar as rendas variáveis
    const rendasVariaveis = await db.getAll('rendas_variaveis');
    
    // Filtrar rendas variáveis para o mês atual e converter para o formato de rendas normais
    for (const rendaVariavel of rendasVariaveis) {
        const dataRenda = new Date(rendaVariavel.data);
        
        // Verificar se a renda variável é do mês selecionado
        if (dataRenda.getMonth() === mesReferencia.getMonth() && 
            dataRenda.getFullYear() === mesReferencia.getFullYear()) {
            
            // Criar uma renda baseada na renda variável
            const renda = {
                id: rendaVariavel.id,
                descricao: rendaVariavel.descricao,
                valor: rendaVariavel.valor,
                categoria: rendaVariavel.categoria,
                dataPrevisao: rendaVariavel.data,
                recebida: rendaVariavel.recebida || false,
                dataRecebimento: rendaVariavel.dataRecebimento,
                origem: 'variavel',
                rendaVariavelId: rendaVariavel.id,
                tipo: 'variavel'
            };
            
            rendas.push(renda);
        }
    }

    // Filtrar apenas as rendas do mês atual
    const rendasDoMes = rendas.filter(renda => {
        const dataPrevisao = new Date(renda.dataPrevisao);
        return dataPrevisao.getMonth() === mesReferencia.getMonth() && 
               dataPrevisao.getFullYear() === mesReferencia.getFullYear();
    });
    
    // Ordenar rendas por data de previsão
    rendasDoMes.sort((a, b) => new Date(a.dataPrevisao) - new Date(b.dataPrevisao));

    rendasDoMes.forEach(renda => {
        totalRendas += Number(renda.valor);
        
        // Verificar se a renda foi recebida
        const recebida = renda.recebida && renda.dataRecebimento && 
                       new Date(renda.dataRecebimento) >= primeiroDiaMes && 
                       new Date(renda.dataRecebimento) <= ultimoDiaMes;

        if (recebida) {
            totalRendasRecebidas += Number(renda.valor);
        } else {
            totalRendasPendentes += Number(renda.valor);
        }
        
        // Formatar a data de previsão
        const dataPrevisao = new Date(renda.dataPrevisao);
        const dataFormatada = dataPrevisao.toLocaleDateString();
        
        // Texto adicional para rendas fixas com regras especiais
        let textoAdicional = '';
        if (renda.origem === 'fixa') {
            const rendaFixa = rendasFixas.find(rf => rf.id === renda.rendaFixaId);
            if (rendaFixa && rendaFixa.regraRecebimento) {
                if (rendaFixa.regraRecebimento === 'dia-util') {
                    textoAdicional = ' (5º dia útil)';
                } else if (rendaFixa.regraRecebimento === 'dia-util-se-fds') {
                    textoAdicional = ' (dia útil)';
                }
            }
        }
        
        // Texto para a origem da renda
        const origemTexto = renda.origem === 'fixa' ? 'Fixa' : 'Variável';
        
        const div = document.createElement('div');
        div.className = 'info-item';
        div.innerHTML = `
            <div class="info-item-content">
                <i class="fas fa-hand-holding-usd"></i>
                <div>
                    ${renda.descricao}
                    <div class="vencimento">
                        ${recebida ? 'Recebido' : `Previsto para ${dataFormatada}${textoAdicional}`}
                        <span class="badge badge-${renda.origem === 'fixa' ? 'primary' : 'secondary'}">${origemTexto}</span>
                    </div>
                </div>
            </div>
            <div class="info-item-actions">
                <span class="positive">
                    ${Utils.formatarMoeda(renda.valor)}
                    ${recebida ? '<i class="fas fa-check-circle"></i>' : ''}
                </span>
                ${!recebida ? `
                    <button class="btn btn-receber" onclick="abrirModalRecebimento('${renda.id}', '${renda.tipo}')">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
            </div>
        `;
        listaRendas.appendChild(div);
    });

    // Verificar se o elemento totalRendas existe
    const totalRendasElement = document.getElementById('totalRendas');
    if (totalRendasElement) {
        totalRendasElement.textContent = Utils.formatarMoeda(totalRendas);
    }
    
    // Verificar se o elemento detalheRendas existe
    const detalheRendasElement = document.getElementById('detalheRendas');
    if (detalheRendasElement) {
        // Adicionar detalhes de rendas recebidas/pendentes
        const detalheRendas = document.createElement('div');
        detalheRendas.className = 'info-detalhe';
        detalheRendas.innerHTML = `
            <span class="info-detalhe-item positive">
                <i class="fas fa-check-circle"></i> Recebidas: ${Utils.formatarMoeda(totalRendasRecebidas)}
            </span>
            <span class="info-detalhe-item pending">
                <i class="fas fa-clock"></i> Pendentes: ${Utils.formatarMoeda(totalRendasPendentes)}
            </span>
        `;
        detalheRendasElement.innerHTML = '';
        detalheRendasElement.appendChild(detalheRendas);
    }

    return totalRendasPendentes; // Retorna apenas as rendas pendentes para o cálculo do balanço
}

// Atualiza o resumo final
async function atualizarResumoFinal() {
    const totalBancos = await carregarBancos();
    const totalFaturasPendentes = await carregarCartoes();
    const { totalGastosPendentes } = await carregarGastosFixos();
    const totalRendasPendentes = await carregarRendas();

    const saldoAtual = totalBancos;
    const totalDividas = totalFaturasPendentes + totalGastosPendentes;
    const saldoPrevisto = saldoAtual + totalRendasPendentes - totalDividas;

    // Verificar se os elementos existem antes de atualizar
    const saldoAtualElement = document.getElementById('saldoAtual');
    if (saldoAtualElement) {
        saldoAtualElement.textContent = Utils.formatarMoeda(saldoAtual);
    }
    
    const rendasReceberElement = document.getElementById('rendasReceber');
    if (rendasReceberElement) {
        rendasReceberElement.textContent = Utils.formatarMoeda(totalRendasPendentes);
    }
    
    const totalDividasElement = document.getElementById('totalDividas');
    if (totalDividasElement) {
        totalDividasElement.textContent = Utils.formatarMoeda(totalDividas);
    }
    
    const saldoPrevistoElement = document.getElementById('saldoPrevisto');
    if (saldoPrevistoElement) {
        saldoPrevistoElement.textContent = Utils.formatarMoeda(saldoPrevisto);
        
        // Adicionar classe para destacar saldo previsto negativo
        if (saldoPrevisto < 0) {
            saldoPrevistoElement.classList.remove('positive');
            saldoPrevistoElement.classList.add('negative');
        } else {
            saldoPrevistoElement.classList.remove('negative');
            saldoPrevistoElement.classList.add('positive');
        }
    }
}

// Carrega os últimos gastos para a tabela do dashboard
async function carregarUltimosGastos() {
    const tabelaGastos = document.getElementById('tabelaUltimosGastos');
    
    // Verificar se o elemento existe na página atual
    if (!tabelaGastos) {
        console.log('Elemento tabelaUltimosGastos não encontrado na página atual');
        return;
    }
    
    try {
        const gastosVariaveis = await db.getAll('gastos_variaveis');
        
        // Ordenar por data (mais recentes primeiro)
        const gastosOrdenados = Array.isArray(gastosVariaveis) ? 
            gastosVariaveis.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5) : [];
        
        tabelaGastos.innerHTML = '';
        
        if (gastosOrdenados.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="4" class="text-center">Nenhum gasto registrado</td>';
            tabelaGastos.appendChild(tr);
            return;
        }
        
        // Para cada gasto, criar uma linha na tabela
        for (const gasto of gastosOrdenados) {
            // Obter categoria
            let categoria = { nome: 'Não categorizado', icone: 'fas fa-question-circle', cor: '#999' };
            
            if (gasto.categoriaId) {
                try {
                    const categoriaObj = await db.getById('categorias_gastos', gasto.categoriaId);
                    if (categoriaObj) {
                        categoria = categoriaObj;
                    }
                } catch (error) {
                    console.error('Erro ao obter categoria:', error);
                }
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${Utils.formatarData(gasto.data)}</td>
                <td>${gasto.descricao}</td>
                <td>
                    <span class="categoria-item">
                        <i class="${categoria.icone}" style="color: ${categoria.cor}"></i>
                        ${categoria.nome}
                    </span>
                </td>
                <td class="text-right negative">${Utils.formatarMoeda(gasto.valor)}</td>
            `;
            tabelaGastos.appendChild(tr);
        }
    } catch (error) {
        console.error('Erro ao carregar últimos gastos:', error);
        tabelaGastos.innerHTML = '<tr><td colspan="4" class="text-center">Erro ao carregar gastos</td></tr>';
    }
}

// Carrega as últimas rendas para a tabela do dashboard
async function carregarUltimasRendas() {
    const tabelaRendas = document.getElementById('tabelaUltimasRendas');
    
    // Verificar se o elemento existe na página atual
    if (!tabelaRendas) {
        console.log('Elemento tabelaUltimasRendas não encontrado na página atual');
        return;
    }
    
    try {
        const rendasVariaveis = await db.getAll('rendas_variaveis');
        
        // Ordenar por data (mais recentes primeiro)
        const rendasOrdenadas = Array.isArray(rendasVariaveis) ? 
            rendasVariaveis.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5) : [];
        
        tabelaRendas.innerHTML = '';
        
        if (rendasOrdenadas.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="4" class="text-center">Nenhuma renda registrada</td>';
            tabelaRendas.appendChild(tr);
            return;
        }
        
        // Para cada renda, criar uma linha na tabela
        for (const renda of rendasOrdenadas) {
            // Obter categoria
            let categoria = { nome: 'Não categorizado', icone: 'fas fa-question-circle', cor: '#999' };
            
            if (renda.categoriaId) {
                try {
                    const categoriaObj = await db.getById('categorias_rendas', renda.categoriaId);
                    if (categoriaObj) {
                        categoria = categoriaObj;
                    }
                } catch (error) {
                    console.error('Erro ao obter categoria:', error);
                }
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${Utils.formatarData(renda.data)}</td>
                <td>${renda.descricao}</td>
                <td>
                    <span class="categoria-item">
                        <i class="${categoria.icone}" style="color: ${categoria.cor}"></i>
                        ${categoria.nome}
                    </span>
                </td>
                <td class="text-right positive">${Utils.formatarMoeda(renda.valor)}</td>
            `;
            tabelaRendas.appendChild(tr);
        }
    } catch (error) {
        console.error('Erro ao carregar últimas rendas:', error);
        tabelaRendas.innerHTML = '<tr><td colspan="4" class="text-center">Erro ao carregar rendas</td></tr>';
    }
}

// Abre o modal de comprovante
async function abrirModalComprovante(tipo, id) {
    const modalComprovante = document.getElementById('modalComprovante');
    if (!modalComprovante) {
        console.log('Modal de comprovante não encontrado');
        return;
    }
    
    tipoOperacao = tipo;
    idReferencia = id;
    
    // Limpar qualquer comprovante anterior
    comprovanteSelecionado = null;
    
    const previewArea = document.getElementById('previewArea');
    const uploadInfo = document.querySelector('.upload-info');
    
    if (previewArea && uploadInfo) {
        previewArea.hidden = true;
        uploadInfo.hidden = false;
    }
    
    modalComprovante.style.display = 'block';
}

// Fecha um modal específico
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Manipula a seleção de arquivo
function handleFileSelect(file) {
    const previewArea = document.getElementById('previewArea');
    const previewImage = document.getElementById('previewImage');
    const uploadInfo = document.querySelector('.upload-info');
    
    if (!previewArea || !previewImage || !uploadInfo) {
        console.log('Elementos de preview não encontrados');
        return;
    }
    
    comprovanteSelecionado = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewArea.hidden = false;
        uploadInfo.hidden = true;
    };
    reader.readAsDataURL(file);
}

// Remove a imagem selecionada
function removerImagem() {
    const previewArea = document.getElementById('previewArea');
    const uploadInfo = document.querySelector('.upload-info');
    
    if (!previewArea || !uploadInfo) {
        return;
    }
    
    comprovanteSelecionado = null;
    previewArea.hidden = true;
    uploadInfo.hidden = false;
}

// Salva o comprovante
async function salvarComprovante() {
    if (!comprovanteSelecionado || !tipoOperacao || !idReferencia) {
        alert('Nenhum comprovante selecionado ou operação inválida.');
        return;
    }
    
    const descricao = document.getElementById('descricaoComprovante').value;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result;
        
        let sucesso = false;
        switch (tipoOperacao) {
            case 'fatura':
                sucesso = await salvarComprovanteFatura(idReferencia, base64, descricao);
                break;
            case 'gasto':
                sucesso = await salvarComprovanteGasto(idReferencia, base64, descricao);
                break;
            case 'renda':
                sucesso = await salvarComprovanteRenda(idReferencia, base64, descricao);
                break;
        }

        if (sucesso) {
            fecharModal('modalComprovante');
            await atualizarDashboard();
        } else {
            alert('Erro ao salvar o comprovante.');
        }
    };
    reader.readAsDataURL(comprovanteSelecionado);
}

// Abre o modal de pagamento de fatura
async function confirmarPagamento(cartaoId) {
    const cartoes = await db.getAll('cartoes');
    const cartao = cartoes.find(c => c.id === cartaoId);
    
    if (!cartao) return;
    
    const modalPagamento = document.getElementById('modalPagamento');
    const nomeCartaoElement = document.getElementById('nomeCartao');
    const cartaoIdElement = document.getElementById('cartaoId');
    const valorPagamentoElement = document.getElementById('valorPagamento');
    const dataPagamentoElement = document.getElementById('dataPagamento');
    
    if (!modalPagamento || !nomeCartaoElement || !cartaoIdElement || 
        !valorPagamentoElement || !dataPagamentoElement) {
        console.log('Modal de pagamento não encontrado ou elementos faltando');
        
        if (window.location.pathname !== '/dashboard.html' && 
            window.location.pathname !== '/pages/dashboard.html' && 
            window.location.pathname !== '/') {
            window.location.href = 'dashboard.html?cartao=' + cartaoId;
            return;
        }
        
        alert(`Por favor, acesse a página do Dashboard para pagar a fatura do cartão ${cartao.nome}`);
        return;
    }
    
    nomeCartaoElement.textContent = cartao.nome;
    cartaoIdElement.value = cartao.id;
    
    const hoje = new Date();
    const mesReferencia = new Date(hoje.getFullYear(), hoje.getMonth() + mesAtualOffset, 1);
    const ano = mesReferencia.getFullYear();
    const mes = mesReferencia.getMonth();
    const valorFatura = await calcularFaturaAtual(cartao, mes, ano);
    valorPagamentoElement.value = valorFatura.toFixed(2);
    
    dataPagamentoElement.valueAsDate = new Date();
    
    await carregarBancosSelect('bancoSelecionado');
    
    modalPagamento.style.display = 'flex';
}

function calcularDataVencimentoFatura(dataCompra, diaFechamento, diaVencimento) {
    let data = new Date(dataCompra);
    let mesFatura = data.getMonth();
    let anoFatura = data.getFullYear();

    // Se a compra foi feita no dia do fechamento ou depois, ela entra na próxima fatura
    if (data.getDate() >= diaFechamento) {
        mesFatura += 1;
        if (mesFatura > 11) {
            mesFatura = 0;
            anoFatura += 1;
        }
    }

    // A data de vencimento é no mês seguinte ao da fatura
    let mesVencimento = mesFatura + 1;
    let anoVencimento = anoFatura;
    if (mesVencimento > 11) {
        mesVencimento = 0;
        anoVencimento += 1;
    }
    
    return new Date(anoVencimento, mesVencimento, diaVencimento);
}

// Calcula o valor da fatura do cartão para um determinado mês
async function calcularFaturaAtual(cartao, mes, ano, gastosVariaveisCache) {
    // Opcionalmente, podemos buscar os gastos aqui se não forem passados como cache
    const gastos = gastosVariaveisCache || await db.getAll('gastos_variaveis');

    const gastosCartao = gastos.filter(gasto => {
        if (gasto.metodoPagamento !== 'cartao' || gasto.cartaoId !== cartao.id) {
            return false;
        }

        const dataVencimento = calcularDataVencimentoFatura(gasto.data, cartao.fechamento, cartao.vencimento);
        return dataVencimento.getMonth() === (mes + 1) % 12 && dataVencimento.getFullYear() === (mes + 1 > 11 ? ano + 1 : ano);
    });

    return gastosCartao.reduce((total, gasto) => total + gasto.valor, 0);
}

// Inicializa os modais
async function inicializarModais() {
    // Verificar se estamos em uma página com modais
    const temModais = document.querySelector('.modal') !== null;
    
    if (!temModais) {
        console.log('Nenhum modal encontrado na página atual');
        return;
    }
    
    // Configurar fechamento dos modais
    document.querySelectorAll('.close, .close-modal').forEach(element => {
        element.addEventListener('click', fecharModais);
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            fecharModais();
        }
    });

    // Configurar botões de confirmação
    const btnConfirmarPagamento = document.getElementById('btnConfirmarPagamento');
    if (btnConfirmarPagamento) {
        btnConfirmarPagamento.addEventListener('click', async () => {
            await confirmarPagamentoFatura();
        });
    }
    
    const btnConfirmarPagamentoGasto = document.getElementById('btnConfirmarPagamentoGasto');
    if (btnConfirmarPagamentoGasto) {
        btnConfirmarPagamentoGasto.addEventListener('click', async () => {
            await confirmarPagamentoGasto();
        });
    }
    
    const btnConfirmarRecebimento = document.getElementById('btnConfirmarRecebimento');
    if (btnConfirmarRecebimento) {
        btnConfirmarRecebimento.addEventListener('click', async () => {
            await confirmarRecebimento();
        });
    }
}

// Fecha todos os modais
function fecharModais() {
    const modais = document.querySelectorAll('.modal');
    if (modais.length === 0) {
        return; // Não há modais para fechar
    }
    
    modais.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Abre o modal de pagamento de fatura
async function confirmarPagamentoFatura() {
    const cartaoId = document.getElementById('cartaoId').value;
    const bancoId = document.getElementById('bancoSelecionado').value;
    const valor = parseFloat(document.getElementById('valorPagamento').value);
    const dataPagamento = document.getElementById('dataPagamento').value;

    if (!cartaoId || !bancoId || !valor || !dataPagamento) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        // 1. Encontrar o cartão
        const cartoes = await db.getAll('cartoes');
        const cartao = cartoes.find(c => c.id === cartaoId);
        if (!cartao) throw new Error('Cartão não encontrado');

        // 2. Adicionar ao histórico de faturas pagas
        if (!cartao.faturasPagas) {
            cartao.faturasPagas = [];
        }
        cartao.faturasPagas.push({ dataPagamento, valor });
        await db.update('cartoes', cartaoId, cartao);

        // 3. Atualizar o saldo do banco
        await atualizarSaldoBanco(bancoId, -valor);

        // 4. Registrar a transação de saída
        await registrarTransacao({
            tipo: 'despesa',
            descricao: `Pagamento da fatura do cartão ${cartao.nome}`,
            valor,
            data: dataPagamento,
            bancoId
        });
        
        // 5. Opcional: Anexar comprovante se houver um selecionado
        const inputComprovante = document.getElementById('inputComprovante');
        if (inputComprovante && inputComprovante.files.length > 0) {
            // Lógica para salvar comprovante aqui...
        }

        alert('Pagamento da fatura confirmado com sucesso!');
        fecharModal('modalPagamento');
        await atualizarDashboard();
    } catch (error) {
        console.error('Erro ao confirmar pagamento da fatura:', error);
        alert('Ocorreu um erro. Verifique o console para mais detalhes.');
    }
}

// Abre o modal de pagamento de gasto fixo
async function abrirModalPagamentoGasto(gastoId) {
    const gasto = await db.getById('gastos_fixos', gastoId);
    if (!gasto) {
        alert('Gasto não encontrado!');
        return;
    }

    document.getElementById('nomeGasto').textContent = gasto.descricao;
    document.getElementById('valorPagamentoGasto').value = gasto.valor.toFixed(2);
    document.getElementById('dataPagamentoGasto').value = new Date().toISOString().split('T')[0];
    document.getElementById('gastoId').value = gastoId;

    await carregarBancosSelect('bancoSelecionadoGasto');

    abrirModal('modalPagamentoGasto');
}

// Abre o modal de recebimento
async function abrirModalRecebimento(rendaId, tipo) {
    const collection = tipo === 'fixa' ? 'rendas_fixas' : 'rendas_variaveis';
    const renda = await db.getById(collection, rendaId);

    if (!renda) {
        alert('Renda não encontrada!');
        return;
    }

    document.getElementById('nomeRenda').textContent = renda.descricao;
    document.getElementById('valorRecebimento').value = renda.valor.toFixed(2);
    document.getElementById('dataRecebimento').value = new Date().toISOString().split('T')[0];
    document.getElementById('rendaId').value = rendaId;
    document.getElementById('tipoRenda').value = tipo;

    await carregarBancosSelect('bancoSelecionadoRecebimento');

    abrirModal('modalRecebimento');
}

// Carrega os bancos no select
async function carregarBancosSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.log(`Elemento select ${selectId} não encontrado`);
        return;
    }
    
    const bancos = await db.getAll('bancos');
    
    // Limpar opções existentes, exceto a primeira
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Adicionar bancos
    bancos.forEach(banco => {
        const option = document.createElement('option');
        option.value = banco.id;
        option.textContent = `${banco.nome} (${Utils.formatarMoeda(banco.saldo)})`;
        select.appendChild(option);
    });
}

// Confirma o pagamento de um gasto fixo
async function confirmarPagamentoGasto() {
    const gastoId = document.getElementById('gastoId').value;
    const bancoId = document.getElementById('bancoSelecionadoGasto').value;
    const valor = parseFloat(document.getElementById('valorPagamentoGasto').value);
    const dataPagamento = document.getElementById('dataPagamentoGasto').value;

    if (!gastoId || !bancoId || !valor || !dataPagamento) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
        const gasto = await db.getById('gastos_fixos', gastoId);
        if (!gasto) throw new Error('Gasto não encontrado');

        // Adicionar ao histórico de pagamentos do gasto
        if (!gasto.pagamentos) {
            gasto.pagamentos = [];
        }
        gasto.pagamentos.push({ data: dataPagamento, valor });
        await db.update('gastos_fixos', gastoId, gasto);

        // Atualizar saldo do banco
        await atualizarSaldoBanco(bancoId, -valor);

        // Registrar transação
        await registrarTransacao({
            tipo: 'despesa',
            descricao: `Pagamento de: ${gasto.descricao}`,
            valor,
            data: dataPagamento,
            bancoId,
            gastoFixoId: gastoId
        });

        alert('Pagamento confirmado!');
        fecharModal('modalPagamentoGasto');
        await atualizarDashboard();
    } catch (error) {
        console.error('Erro ao confirmar pagamento do gasto:', error);
        alert('Ocorreu um erro. Verifique o console.');
    }
}

// Confirma o recebimento de uma renda
async function confirmarRecebimento() {
    const rendaId = document.getElementById('rendaId').value;
    const tipo = document.getElementById('tipoRenda').value;
    const bancoId = document.getElementById('bancoSelecionadoRecebimento').value;
    const valor = parseFloat(document.getElementById('valorRecebimento').value);
    const dataRecebimento = document.getElementById('dataRecebimento').value;

    if (!rendaId || !bancoId || !valor || !dataRecebimento) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    const collection = tipo === 'fixa' ? 'rendas_fixas' : 'rendas_variaveis';

    try {
        const renda = await db.getById(collection, rendaId);
        if (!renda) throw new Error('Renda não encontrada');

        // Adicionar ao histórico de recebimentos da renda
        if (!renda.recebimentos) {
            renda.recebimentos = [];
        }
        renda.recebimentos.push({ data: dataRecebimento, valor });
        await db.update(collection, rendaId, renda);

        // Atualizar saldo do banco
        await atualizarSaldoBanco(bancoId, valor);

        // Registrar transação
        await registrarTransacao({
            tipo: 'receita',
            descricao: `Recebimento de: ${renda.descricao}`,
            valor,
            data: dataRecebimento,
            bancoId,
            rendaId,
            tipoRenda: tipo
        });

        alert('Recebimento confirmado!');
        fecharModal('modalRecebimento');
        await atualizarDashboard();
    } catch (error) {
        console.error('Erro ao confirmar recebimento:', error);
        alert('Ocorreu um erro. Verifique o console.');
    }
}

// Atualiza o saldo do banco
async function atualizarSaldoBanco(bancoId, valor) {
    const banco = await db.getById('bancos', bancoId);
    
    if (banco) {
        banco.saldo += valor;
        await db.update('bancos', bancoId, banco);
    }
}

// Registra uma transação genérica no sistema
async function registrarTransacao(transacao) {
    // No futuro, isso pode ir para uma coleção 'transacoes'
    console.log('Registrando transação:', transacao);
    await db.insert('transacoes', transacao);
    return true;
}

// Salva o comprovante de pagamento de uma fatura
async function salvarComprovanteFatura(cartaoId, imagemBase64, descricao) {
    try {
        const cartao = await db.getById('cartoes', cartaoId);
        if (!cartao) return false;

        if (!cartao.comprovantes) {
            cartao.comprovantes = [];
        }
        cartao.comprovantes.push({ data: new Date().toISOString(), imagem: imagemBase64, descricao });
        
        await db.update('cartoes', cartaoId, cartao);
        return true;
    } catch (error) {
        console.error('Erro ao salvar comprovante da fatura:', error);
        return false;
    }
}

// Salva o comprovante de pagamento de um gasto
async function salvarComprovanteGasto(gastoId, imagemBase64, descricao) {
    try {
        const gasto = await db.getById('gastos_fixos', gastoId);
        if (!gasto) return false;

        if (!gasto.comprovantes) {
            gasto.comprovantes = [];
        }
        gasto.comprovantes.push({ data: new Date().toISOString(), imagem: imagemBase64, descricao });

        await db.update('gastos_fixos', gastoId, gasto);
        return true;
    } catch (error) {
        console.error('Erro ao salvar comprovante do gasto:', error);
        return false;
    }
}

// Salva o comprovante de recebimento de uma renda
async function salvarComprovanteRenda(rendaId, imagemBase64, descricao) {
    // Assumindo que a renda pode ser fixa ou variável, mas o comprovante é genérico
    console.log(`Salvando comprovante para renda ${rendaId}: ${descricao}`);
    // A lógica para encontrar e atualizar a renda precisaria ser mais robusta
    // Por enquanto, vamos apenas simular o salvamento
    
    // Exemplo de como poderia ser:
    // const renda = await db.getById('rendas_fixas', rendaId) || await db.getById('rendas_variaveis', rendaId);
    // ... atualizar e salvar
    
    return true; // Simulação
}

// Exporta as funções para uso nos testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calcularFaturaAtual,
        carregarDados,
        atualizarGraficos
    };
} 