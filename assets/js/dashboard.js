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
document.addEventListener('DOMContentLoaded', () => {
    atualizarDashboard();
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

// Atualiza todo o dashboard
function atualizarDashboard() {
    // Verificar se estamos na página do dashboard
    const isDashboardPage = document.getElementById('mesSelecionado') !== null;
    
    atualizarMesSelecionado();
    
    // Carregar dados apenas se estivermos na página do dashboard
    if (isDashboardPage) {
        carregarBancos();
        carregarCartoes();
        carregarGastosFixos();
        carregarRendas();
        atualizarResumoFinal();
    }
    
    atualizarGraficos();
    atualizarMetas();
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
function carregarBancos() {
    const bancos = db.getAll('bancos');
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
function carregarCartoes() {
    const cartoes = db.getAll('cartoes');
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

    cartoes.forEach(cartao => {
        const faturaCartao = calcularFaturaAtual(cartao, mes, ano);

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
    });

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
function carregarGastosFixos() {
    const gastosFixos = db.getAll('gastos_fixos');
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

    gastosFixos.forEach(gasto => {
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
    });

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

    return totalGastosPendentes; // Retorna apenas os gastos pendentes para o cálculo do balanço
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
function carregarRendas() {
    const rendas = db.getAll('rendas');
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
    const rendasFixas = db.getAll('rendas_fixas');
    
    // Converter rendas fixas para o formato de rendas normais
    rendasFixas.forEach(rendaFixa => {
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
    });
    
    // Processar as rendas variáveis
    const rendasVariaveis = db.getAll('rendas_variaveis');
    
    // Filtrar rendas variáveis para o mês atual e converter para o formato de rendas normais
    rendasVariaveis.forEach(rendaVariavel => {
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
    });

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
function atualizarResumoFinal() {
    const totalBancos = carregarBancos();
    const totalFaturasPendentes = carregarCartoes();
    const totalGastosPendentes = carregarGastosFixos();
    const totalRendasPendentes = carregarRendas();

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

// Abre o modal de comprovante
function abrirModalComprovante(tipo, id) {
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
function salvarComprovante() {
    if (!comprovanteSelecionado) {
        alert('Por favor, selecione um comprovante para continuar.');
        return;
    }
    
    const descricao = document.getElementById('descricaoComprovante')?.value || '';
    
    // Converter o arquivo para base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        
        // Salvar o comprovante de acordo com o tipo de operação
        if (tipoOperacao === 'cartao') {
            salvarComprovanteFatura(idReferencia, base64, descricao);
        } else if (tipoOperacao === 'gasto') {
            salvarComprovanteGasto(idReferencia, base64, descricao);
        } else if (tipoOperacao === 'renda') {
            salvarComprovanteRenda(idReferencia, base64, descricao);
        }
        
        // Fechar o modal
        fecharModal('modalComprovante');
        
        // Atualizar o dashboard
        atualizarDashboard();
    };
    reader.readAsDataURL(comprovanteSelecionado);
}

// Abre o modal de pagamento de fatura
function confirmarPagamento(cartaoId) {
    const cartoes = db.getAll('cartoes');
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
    const valorFatura = calcularFaturaAtual(cartao, mesReferencia.getMonth(), mesReferencia.getFullYear());
    valorPagamentoElement.value = valorFatura;
    
    dataPagamentoElement.valueAsDate = new Date();
    
    carregarBancosSelect('bancoSelecionado');
    
    modalPagamento.style.display = 'flex';
}

function calcularDataVencimentoFatura(dataCompra, diaFechamento, diaVencimento) {
    let anoFatura = dataCompra.getFullYear();
    let mesFatura = dataCompra.getMonth();

    if (dataCompra.getDate() > diaFechamento) {
        mesFatura++;
    }

    let anoVencimento = anoFatura;
    let mesVencimento = mesFatura;

    if (diaVencimento < diaFechamento) {
        mesVencimento++;
    }
    
    const dataVencimento = new Date(anoVencimento, mesVencimento, diaVencimento);
    
    // Normaliza o mês e ano caso o mês ultrapasse 11 (Dezembro)
    if (dataVencimento.getMonth() !== (mesVencimento % 12)) {
      dataVencimento.setFullYear(dataVencimento.getFullYear(), mesVencimento, diaVencimento);
    }
    
    return dataVencimento;
}

function calcularFaturaAtual(cartao, mes, ano) {
    const todasCompras = db.getAll('compras');
    const comprasDoCartao = todasCompras.filter(c => c.cartaoId === cartao.id);
    let faturaDoMes = 0;

    comprasDoCartao.forEach(compra => {
        const dataCompra = new Date(compra.data);
        const valorParcela = Number(compra.valor) / Number(compra.parcelas);

        const dataPrimeiroVencimento = calcularDataVencimentoFatura(
            dataCompra,
            cartao.fechamento,
            cartao.vencimento
        );

        for (let i = 0; i < compra.parcelas; i++) {
            const dataVencimentoParcela = new Date(
                dataPrimeiroVencimento.getFullYear(),
                dataPrimeiroVencimento.getMonth() + i,
                dataPrimeiroVencimento.getDate()
            );

            if (dataVencimentoParcela.getFullYear() === ano && dataVencimentoParcela.getMonth() === mes) {
                faturaDoMes += valorParcela;
                break;
            }
        }
    });

    return faturaDoMes;
}

// Atualiza os gráficos
function atualizarGraficos() {
    const ctx1Element = document.getElementById('graficoGastosRendas');
    const ctx2Element = document.getElementById('graficoDistribuicaoGastos');
    
    // Verificar se os elementos dos gráficos existem
    if (!ctx1Element || !ctx2Element) {
        console.log('Elementos dos gráficos não encontrados na página atual');
        return;
    }
    
    const ctx1 = ctx1Element.getContext('2d');
    const ctx2 = ctx2Element.getContext('2d');

    if (graficoGastosRendas) graficoGastosRendas.destroy();
    if (graficoDistribuicaoGastos) graficoDistribuicaoGastos.destroy();

    // Dados para o gráfico de Gastos vs. Rendas
    const totalGastos = carregarCartoes() + carregarGastosFixos();
    const totalRendas = carregarRendas();

    graficoGastosRendas = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Gastos', 'Rendas'],
            datasets: [{
                data: [totalGastos, totalRendas],
                backgroundColor: ['#E74C3C', '#2ECC71']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Dados para o gráfico de Distribuição de Gastos
    const gastosFixos = db.getAll('gastos_fixos');
    const categorias = {};
    
    gastosFixos.forEach(gasto => {
        if (categorias[gasto.categoriaId]) {
            categorias[gasto.categoriaId] += Number(gasto.valor);
        } else {
            categorias[gasto.categoriaId] = Number(gasto.valor);
        }
    });

    const categoriasGastos = db.getAll('categorias_gastos');
    const labels = Object.keys(categorias).map(id => 
        categoriasGastos.find(c => c.id === Number(id))?.nome || 'Outros'
    );
    const valores = Object.values(categorias);

    graficoDistribuicaoGastos = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: [
                    '#2ECC71', '#3498DB', '#9B59B6', 
                    '#F1C40F', '#E67E22', '#E74C3C'
                ]
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
}

// Atualiza as metas de gastos
function atualizarMetas() {
    // Verificar se os elementos de metas existem
    const progressoPessoalElement = document.getElementById('progressoPessoal');
    const progressoCasaElement = document.getElementById('progressoCasa');
    
    if (!progressoPessoalElement || !progressoCasaElement) {
        console.log('Elementos de metas não encontrados na página atual');
        return;
    }
    
    const hoje = new Date();
    const mesReferencia = new Date(hoje.getFullYear(), hoje.getMonth() + mesAtualOffset, 1);
    const primeiroDia = Utils.primeiroDiaMes(mesReferencia);
    const ultimoDia = Utils.ultimoDiaMes(mesReferencia);

    // Busca todos os gastos do mês
    const gastosFixos = db.getAll('gastos_fixos');
    const gastosVariaveis = db.getAll('gastos_variaveis')
        .filter(gasto => Utils.dataEntre(gasto.data, primeiroDia, ultimoDia));

    // Calcula gastos por tipo
    let totalPessoal = 0;
    let totalCasa = 0;

    // Soma gastos fixos
    gastosFixos.forEach(gasto => {
        if (gasto.tipo === 'pessoal') {
            totalPessoal += Number(gasto.valor);
        } else if (gasto.tipo === 'casa') {
            totalCasa += Number(gasto.valor);
        }
    });

    // Soma gastos variáveis
    gastosVariaveis.forEach(gasto => {
        if (gasto.tipo === 'pessoal') {
            totalPessoal += Number(gasto.valor);
        } else if (gasto.tipo === 'casa') {
            totalCasa += Number(gasto.valor);
        }
    });

    // Atualiza meta de gastos pessoais
    atualizarProgressoMeta('Pessoal', totalPessoal, METAS.PESSOAL);

    // Atualiza meta de gastos da casa
    atualizarProgressoMeta('Casa', totalCasa, METAS.CASA);
}

// Atualiza o progresso de uma meta específica
function atualizarProgressoMeta(tipo, valorGasto, meta) {
    const progressoElement = document.getElementById(`progresso${tipo}`);
    const gastoElement = document.getElementById(`gasto${tipo}`);
    const percentualElement = document.getElementById(`percentual${tipo}`);
    
    // Verificar se os elementos existem
    if (!progressoElement || !gastoElement || !percentualElement) {
        return;
    }

    const percentual = (valorGasto / meta) * 100;
    const percentualFormatado = Math.min(100, Math.round(percentual));

    // Atualiza a barra de progresso
    progressoElement.style.width = `${percentualFormatado}%`;
    progressoElement.className = 'progresso';

    if (percentual >= 100) {
        progressoElement.classList.add('excedido');
    } else if (percentual >= 80) {
        progressoElement.classList.add('alerta');
    }

    // Atualiza os valores
    gastoElement.textContent = Utils.formatarMoeda(valorGasto);
    percentualElement.textContent = `${percentualFormatado}%`;

    // Adiciona tooltip se exceder
    if (percentual > 100) {
        const excesso = valorGasto - meta;
        percentualElement.title = `Excedeu em ${Utils.formatarMoeda(excesso)}`;
    } else {
        percentualElement.title = '';
    }
}

// Inicializa os modais
function inicializarModais() {
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
        btnConfirmarPagamento.addEventListener('click', confirmarPagamentoFatura);
    }
    
    const btnConfirmarPagamentoGasto = document.getElementById('btnConfirmarPagamentoGasto');
    if (btnConfirmarPagamentoGasto) {
        btnConfirmarPagamentoGasto.addEventListener('click', confirmarPagamentoGasto);
    }
    
    const btnConfirmarRecebimento = document.getElementById('btnConfirmarRecebimento');
    if (btnConfirmarRecebimento) {
        btnConfirmarRecebimento.addEventListener('click', confirmarRecebimento);
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
function confirmarPagamentoFatura() {
    const cartaoId = parseInt(document.getElementById('cartaoId').value);
    const dataPagamento = document.getElementById('dataPagamento').value;
    const bancoId = parseInt(document.getElementById('bancoSelecionado').value);
    const valor = parseFloat(document.getElementById('valorPagamento').value);
    
    if (!cartaoId || !dataPagamento || !bancoId || isNaN(valor)) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    // Obter o cartão
    const cartoes = db.getAll('cartoes');
    const cartao = cartoes.find(c => c.id === cartaoId);
    
    if (!cartao) return;
    
    // Inicializar array de faturas pagas se não existir
    if (!cartao.faturasPagas) {
        cartao.faturasPagas = [];
    }
    
    // Adicionar pagamento
    cartao.faturasPagas.push({
        dataPagamento: dataPagamento,
        valor: valor,
        bancoId: bancoId
    });
    
    // Atualizar cartão
    db.save('cartoes', cartao);
    
    // Atualizar saldo do banco
    atualizarSaldoBanco(bancoId, -valor);
    
    // Registrar transação
    registrarTransacao({
        tipo: 'saida',
        descricao: `Pagamento de fatura - ${cartao.nome}`,
        valor: valor,
        data: dataPagamento,
        bancoId: bancoId,
        categoria: 'Fatura de Cartão'
    });
    
    fecharModais();
    atualizarResumoFinal();
}

// Abre o modal de pagamento de gasto fixo
function abrirModalPagamentoGasto(gastoId) {
    const gastos = db.getAll('gastos_fixos');
    const gasto = gastos.find(g => g.id === gastoId);
    
    if (!gasto) return;
    
    // Verificar se estamos na página com o modal de pagamento
    const modalPagamentoGasto = document.getElementById('modalPagamentoGasto');
    const nomeGastoElement = document.getElementById('nomeGasto');
    const gastoIdElement = document.getElementById('gastoId');
    const valorPagamentoGastoElement = document.getElementById('valorPagamentoGasto');
    const dataPagamentoGastoElement = document.getElementById('dataPagamentoGasto');
    
    if (!modalPagamentoGasto || !nomeGastoElement || !gastoIdElement || 
        !valorPagamentoGastoElement || !dataPagamentoGastoElement) {
        console.log('Modal de pagamento de gasto não encontrado ou elementos faltando');
        
        // Se não estiver na página do dashboard, redirecionar para ela
        if (window.location.pathname !== '/dashboard.html' && 
            window.location.pathname !== '/pages/dashboard.html' && 
            window.location.pathname !== '/') {
            window.location.href = 'dashboard.html?gasto=' + gastoId;
            return;
        }
        
        // Se estiver na página do dashboard, mostrar um alerta
        alert(`Por favor, acesse a página do Dashboard para pagar o gasto ${gasto.descricao}`);
        return;
    }
    
    nomeGastoElement.textContent = gasto.descricao;
    gastoIdElement.value = gasto.id;
    valorPagamentoGastoElement.value = gasto.valor;
    
    // Preencher data atual
    dataPagamentoGastoElement.valueAsDate = new Date();
    
    // Carregar bancos
    carregarBancosSelect('bancoSelecionadoGasto');
    
    modalPagamentoGasto.style.display = 'block';
}

// Abre o modal de recebimento
function abrirModalRecebimento(rendaId, tipo) {
    let renda;
    
    // Buscar a renda de acordo com o tipo
    if (tipo === 'fixa') {
        const rendasFixas = db.getAll('rendas_fixas');
        renda = rendasFixas.find(r => r.id === Number(rendaId));
    } else if (tipo === 'variavel') {
        const rendasVariaveis = db.getAll('rendas_variaveis');
        renda = rendasVariaveis.find(r => r.id === Number(rendaId));
    } else {
        // Compatibilidade com código anterior
        const rendas = db.getAll('rendas');
        renda = rendas.find(r => r.id === Number(rendaId));
    }
    
    if (!renda) return;
    
    // Verificar se estamos na página com o modal de recebimento
    const modalRecebimento = document.getElementById('modalRecebimento');
    const nomeRendaElement = document.getElementById('nomeRenda');
    const rendaIdElement = document.getElementById('rendaId');
    const valorRecebimentoElement = document.getElementById('valorRecebimento');
    const dataRecebimentoElement = document.getElementById('dataRecebimento');
    const tipoRendaElement = document.getElementById('tipoRenda'); // Novo campo para o tipo
    
    if (!modalRecebimento || !nomeRendaElement || !rendaIdElement || 
        !valorRecebimentoElement || !dataRecebimentoElement) {
        console.log('Modal de recebimento não encontrado ou elementos faltando');
        
        // Se não estiver na página do dashboard, redirecionar para ela
        if (window.location.pathname !== '/dashboard.html' && 
            window.location.pathname !== '/pages/dashboard.html' && 
            window.location.pathname !== '/') {
            window.location.href = 'dashboard.html?renda=' + rendaId + '&tipo=' + tipo;
            return;
        }
        
        // Se estiver na página do dashboard, mostrar um alerta
        alert(`Por favor, acesse a página do Dashboard para registrar o recebimento de ${renda.descricao}`);
        return;
    }
    
    nomeRendaElement.textContent = renda.descricao;
    rendaIdElement.value = renda.id;
    valorRecebimentoElement.value = renda.valor;
    
    // Armazenar o tipo de renda
    if (tipoRendaElement) {
        tipoRendaElement.value = tipo || 'renda';
    } else {
        // Se o elemento não existir, criar um campo oculto
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'tipoRenda';
        hiddenInput.value = tipo || 'renda';
        modalRecebimento.querySelector('.modal-body').appendChild(hiddenInput);
    }
    
    // Preencher data atual
    dataRecebimentoElement.valueAsDate = new Date();
    
    // Carregar bancos
    carregarBancosSelect('bancoSelecionadoRecebimento');
    
    modalRecebimento.style.display = 'block';
}

// Carrega os bancos no select
function carregarBancosSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.log(`Elemento select ${selectId} não encontrado`);
        return;
    }
    
    const bancos = db.getAll('bancos');
    
    // Limpar opções existentes, exceto a primeira
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Adicionar bancos
    bancos.forEach(banco => {
        const option = document.createElement('option');
        option.value = banco.id;
        option.textContent = banco.nome;
        select.appendChild(option);
    });
}

// Confirma o pagamento do gasto fixo
function confirmarPagamentoGasto() {
    const gastoId = parseInt(document.getElementById('gastoId').value);
    const dataPagamento = document.getElementById('dataPagamentoGasto').value;
    const bancoId = parseInt(document.getElementById('bancoSelecionadoGasto').value);
    const valor = parseFloat(document.getElementById('valorPagamentoGasto').value);
    
    if (!gastoId || !dataPagamento || !bancoId || isNaN(valor)) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    // Obter o gasto
    const gastos = db.getAll('gastos_fixos');
    const gasto = gastos.find(g => g.id === gastoId);
    
    if (!gasto) return;
    
    // Marcar como pago
    gasto.pago = true;
    gasto.dataPagamento = dataPagamento;
    gasto.valorPago = valor;
    gasto.bancoId = bancoId;
    
    // Atualizar gasto
    db.save('gastos_fixos', gasto);
    
    // Atualizar saldo do banco
    atualizarSaldoBanco(bancoId, -valor);
    
    // Registrar transação
    registrarTransacao({
        tipo: 'saida',
        descricao: `Pagamento de gasto fixo - ${gasto.descricao}`,
        valor: valor,
        data: dataPagamento,
        bancoId: bancoId,
        categoria: 'Gasto Fixo'
    });
    
    fecharModais();
    atualizarResumoFinal();
}

// Confirma o recebimento da renda
function confirmarRecebimento() {
    const rendaId = parseInt(document.getElementById('rendaId').value);
    const dataRecebimento = document.getElementById('dataRecebimento').value;
    const bancoId = parseInt(document.getElementById('bancoSelecionadoRecebimento').value);
    const valor = parseFloat(document.getElementById('valorRecebimento').value);
    const tipoRenda = document.getElementById('tipoRenda')?.value || 'renda';
    
    if (!rendaId || !dataRecebimento || !bancoId || isNaN(valor)) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    // Obter a renda de acordo com o tipo
    let renda;
    let entidade;
    
    if (tipoRenda === 'fixa') {
        entidade = 'rendas_fixas';
        const rendasFixas = db.getAll(entidade);
        renda = rendasFixas.find(r => r.id === rendaId);
    } else if (tipoRenda === 'variavel') {
        entidade = 'rendas_variaveis';
        const rendasVariaveis = db.getAll(entidade);
        renda = rendasVariaveis.find(r => r.id === rendaId);
    } else {
        entidade = 'rendas';
        const rendas = db.getAll(entidade);
        renda = rendas.find(r => r.id === rendaId);
    }
    
    if (!renda) return;
    
    // Marcar como recebida
    renda.recebida = true;
    renda.dataRecebimento = dataRecebimento;
    renda.valorRecebido = valor;
    renda.bancoId = bancoId;
    
    // Atualizar renda
    db.save(entidade, renda);
    
    // Atualizar saldo do banco
    atualizarSaldoBanco(bancoId, valor);
    
    // Registrar transação
    registrarTransacao({
        tipo: 'entrada',
        descricao: `Recebimento - ${renda.descricao}`,
        valor: valor,
        data: dataRecebimento,
        bancoId: bancoId,
        categoria: 'Renda',
        origem: tipoRenda
    });
    
    fecharModais();
    atualizarResumoFinal();
}

// Atualiza o saldo do banco
function atualizarSaldoBanco(bancoId, valor) {
    const bancos = db.getAll('bancos');
    const banco = bancos.find(b => b.id === bancoId);
    
    if (!banco) return;
    
    banco.saldo = parseFloat(banco.saldo) + valor;
    db.save('bancos', banco);
}

// Registra uma transação
function registrarTransacao(transacao) {
    const transacoes = db.getAll('transacoes') || [];
    
    // Gerar ID único
    transacao.id = Date.now();
    
    transacoes.push(transacao);
    db.saveAll('transacoes', transacoes);
}

// Salva o comprovante de uma fatura
function salvarComprovanteFatura(cartaoId, imagemBase64, descricao) {
    const cartoes = db.getAll('cartoes');
    const cartao = cartoes.find(c => c.id === Number(cartaoId));
    
    if (!cartao) return;
    
    // Inicializar array de comprovantes se não existir
    if (!cartao.comprovantes) {
        cartao.comprovantes = [];
    }
    
    // Adicionar comprovante
    cartao.comprovantes.push({
        id: Date.now(),
        imagem: imagemBase64,
        descricao: descricao,
        data: new Date().toISOString()
    });
    
    // Atualizar cartão
    db.save('cartoes', cartao);
}

// Salva o comprovante de um gasto
function salvarComprovanteGasto(gastoId, imagemBase64, descricao) {
    const gastos = db.getAll('gastos_fixos');
    const gasto = gastos.find(g => g.id === Number(gastoId));
    
    if (!gasto) return;
    
    // Inicializar array de comprovantes se não existir
    if (!gasto.comprovantes) {
        gasto.comprovantes = [];
    }
    
    // Adicionar comprovante
    gasto.comprovantes.push({
        id: Date.now(),
        imagem: imagemBase64,
        descricao: descricao,
        data: new Date().toISOString()
    });
    
    // Atualizar gasto
    db.save('gastos_fixos', gasto);
}

// Salva o comprovante de uma renda
function salvarComprovanteRenda(rendaId, imagemBase64, descricao) {
    const rendas = db.getAll('rendas');
    const renda = rendas.find(r => r.id === Number(rendaId));
    
    if (!renda) return;
    
    // Inicializar array de comprovantes se não existir
    if (!renda.comprovantes) {
        renda.comprovantes = [];
    }
    
    // Adicionar comprovante
    renda.comprovantes.push({
        id: Date.now(),
        imagem: imagemBase64,
        descricao: descricao,
        data: new Date().toISOString()
    });
    
    // Atualizar renda
    db.save('rendas', renda);
}

// Exporta as funções para uso nos testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calcularFaturaAtual,
        carregarDados,
        atualizarGraficos
    };
} 