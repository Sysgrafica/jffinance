// Funções utilitárias e de inicialização global

// Carrega dados iniciais do sistema
function carregarDados() {
    // Verifica se é a primeira vez que o usuário acessa o sistema
    if (!localStorage.getItem('dadosInicializados')) {
        inicializarDadosPadrao();
    }
}

// Inicializa dados padrão do sistema
function inicializarDadosPadrao() {
    // Categorias de gastos padrão
    const categoriasPadrao = [
        { id: 1, nome: 'Alimentação', tipo: 'despesa' },
        { id: 2, nome: 'Transporte', tipo: 'despesa' },
        { id: 3, nome: 'Moradia', tipo: 'despesa' },
        { id: 4, nome: 'Saúde', tipo: 'despesa' },
        { id: 5, nome: 'Educação', tipo: 'despesa' },
        { id: 6, nome: 'Lazer', tipo: 'despesa' },
        { id: 7, nome: 'Salário', tipo: 'receita' },
        { id: 8, nome: 'Investimentos', tipo: 'receita' }
    ];

    // Bancos padrão
    const bancosPadrao = [
        { id: 1, nome: 'Conta Corrente', saldo: 0 },
        { id: 2, nome: 'Poupança', saldo: 0 }
    ];

    // Cartões padrão
    const cartoesPadrao = [
        { 
            id: 1, 
            nome: 'Cartão Principal', 
            vencimento: 10, 
            limite: 5000 
        }
    ];

    // Salvar dados no localStorage
    localStorage.setItem('categorias_gastos', JSON.stringify(categoriasPadrao));
    localStorage.setItem('bancos', JSON.stringify(bancosPadrao));
    localStorage.setItem('cartoes', JSON.stringify(cartoesPadrao));

    // Marcar como inicializado
    localStorage.setItem('dadosInicializados', 'true');
}

// Função para migrar dados antigos (se necessário)
function migrarDados() {
    // Adicionar lógica de migração de dados de versões anteriores, se houver
    const versaoAtual = '1.0.0';
    const versaoSalva = localStorage.getItem('versaoApp');

    if (!versaoSalva || versaoSalva !== versaoAtual) {
        // Realizar migrações necessárias
        localStorage.setItem('versaoApp', versaoAtual);
    }
}

// Configurações globais e inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados iniciais
    carregarDados();
    
    // Migrar dados se necessário
    migrarDados();

    // Configurações globais de tema
    configurarTema();

    // Verificar o modo offline quando o documento estiver pronto
    verificarModoOffline();
});

// Configurar tema do aplicativo
function configurarTema() {
    const temaSalvo = localStorage.getItem('tema');
    
    if (temaSalvo === 'escuro') {
        document.body.classList.add('tema-escuro');
    } else {
        document.body.classList.remove('tema-escuro');
    }
}

// Alternar tema
function alternarTema() {
    document.body.classList.toggle('tema-escuro');
    
    const temaAtual = document.body.classList.contains('tema-escuro') ? 'escuro' : 'claro';
    localStorage.setItem('tema', temaAtual);
}

// Função para verificar se estamos usando o modo offline (fallback)
function verificarModoOffline() {
    if (window.usingFirebaseFallback) {
        mostrarIndicadorOffline();
    }
}

// Função para mostrar o indicador de modo offline
function mostrarIndicadorOffline() {
    // Verificar se o indicador já existe
    let indicador = document.querySelector('.modo-offline');
    
    if (!indicador) {
        // Criar o indicador
        indicador = document.createElement('div');
        indicador.className = 'modo-offline';
        indicador.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Modo Offline (dados salvos localmente)</span>
            <button class="btn-link" onclick="mostrarAjudaFirebase()">Ajuda</button>
        `;
        
        // Adicionar ao corpo do documento
        document.body.appendChild(indicador);
    } else {
        // Mostrar o indicador se estiver oculto
        indicador.classList.remove('modo-offline-hidden');
    }
}

// Função para mostrar ajuda sobre o Firebase
function mostrarAjudaFirebase() {
    alert('O sistema está operando no modo offline devido a problemas de conexão com o Firebase.\n\n' +
          'Seus dados estão sendo salvos localmente no navegador.\n\n' +
          'Para configurar o Firebase e usar o modo online, consulte o arquivo FIREBASE_SETUP.md');
}

// Exportar funções globais (se necessário)
window.carregarDados = carregarDados;
window.alternarTema = alternarTema; 