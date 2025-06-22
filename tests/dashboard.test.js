// Mock do banco de dados
const mockDb = {
    gastos_fixos: [
        { id: 1, descricao: 'Aluguel', categoria: 'Moradia', valor: 1500 },
        { id: 2, descricao: 'Internet', categoria: 'Utilidades', valor: 100 }
    ],
    gastos_variaveis: [
        { 
            id: 1, 
            descricao: 'Supermercado', 
            categoria: 'Alimentação', 
            valor: 500,
            data: '2024-03-15'
        }
    ],
    rendas_fixas: [
        { id: 1, descricao: 'Salário', categoria: 'Trabalho', valor: 5000 }
    ],
    rendas_variaveis: [
        {
            id: 1,
            descricao: 'Freelance',
            categoria: 'Trabalho Extra',
            valor: 1000,
            data: '2024-03-10'
        }
    ],
    bancos: [
        { id: 1, nome: 'Banco Principal', saldo: 10000 }
    ],
    cartoes: [
        { id: 1, nome: 'Cartão Principal', limite: 5000 }
    ],
    compras: [
        {
            id: 1,
            cartaoId: 1,
            descricao: 'Eletrônicos',
            valor: 1200,
            parcelas: 3,
            data: '2024-03-01'
        }
    ],
    getAll: function(tabela) {
        return this[tabela] || [];
    }
};

// Mock das funções utilitárias
const mockUtils = {
    formatarMoeda: (valor) => `R$ ${valor.toFixed(2)}`,
    formatarData: (data) => new Date(data).toLocaleDateString('pt-BR')
};

// Configuração inicial dos testes
beforeEach(() => {
    global.db = mockDb;
    global.Utils = mockUtils;
    document.body.innerHTML = `
        <div id="saldoTotal"></div>
        <div id="gastosMes"></div>
        <div id="rendasMes"></div>
        <div id="faturasCartoes"></div>
        <div id="tabelaUltimosGastos"></div>
        <div id="tabelaUltimasRendas"></div>
        <input type="month" id="mesGrafico" value="2024-03">
        <canvas id="graficoGastosRendas"></canvas>
        <canvas id="graficoDistribuicaoGastos"></canvas>
    `;
});

// Testes para cálculo de fatura de cartão
describe('Cálculo de Fatura de Cartão', () => {
    test('Deve calcular corretamente a fatura atual de um cartão', () => {
        const faturaAtual = calcularFaturaAtual(1);
        expect(faturaAtual).toBe(800); // 1200/3 * 2 parcelas restantes
    });
});

// Testes para carregamento de dados
describe('Carregamento de Dados', () => {
    test('Deve carregar o saldo total corretamente', () => {
        carregarDados();
        expect(document.getElementById('saldoTotal').textContent).toBe('R$ 10000.00');
    });

    test('Deve calcular corretamente os gastos do mês', () => {
        carregarDados();
        const totalGastosEsperado = 1500 + 100 + 500; // gastos fixos + variáveis
        expect(document.getElementById('gastosMes').textContent).toBe(`R$ ${totalGastosEsperado.toFixed(2)}`);
    });

    test('Deve calcular corretamente as rendas do mês', () => {
        carregarDados();
        const totalRendasEsperado = 5000 + 1000; // rendas fixas + variáveis
        expect(document.getElementById('rendasMes').textContent).toBe(`R$ ${totalRendasEsperado.toFixed(2)}`);
    });
});

// Testes para os gráficos
describe('Atualização dos Gráficos', () => {
    test('Deve calcular corretamente os totais para o gráfico de Gastos vs Rendas', () => {
        atualizarGraficos();
        
        // Verifica se o gráfico foi criado com os dados corretos
        expect(graficoGastosRendas.data.datasets[0].data).toEqual([2100, 6000]); // [totalGastos, totalRendas]
    });

    test('Deve calcular corretamente a distribuição de gastos por categoria', () => {
        atualizarGraficos();
        
        const categoriasEsperadas = {
            'Moradia': 1500,
            'Utilidades': 100,
            'Alimentação': 500
        };
        
        expect(graficoDistribuicaoGastos.data.labels).toEqual(Object.keys(categoriasEsperadas));
        expect(graficoDistribuicaoGastos.data.datasets[0].data).toEqual(Object.values(categoriasEsperadas));
    });
}); 