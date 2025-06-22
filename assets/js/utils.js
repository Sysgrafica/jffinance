// Funções utilitárias para formatação e validação
const Utils = {
    formatarMoeda: (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    },

    formatarData: (data) => {
        return new Date(data).toLocaleDateString('pt-BR');
    },

    validarFormulario: function(form) {
        const campos = form.querySelectorAll('[required]');
        let valido = true;
        
        campos.forEach(campo => {
            if (!campo.value.trim()) {
                campo.classList.add('invalido');
                valido = false;
            } else {
                campo.classList.remove('invalido');
            }
        });

        return valido;
    },

    criarGrafico: function(ctx, tipo, dados, opcoes = {}) {
        return new Chart(ctx, {
            type: tipo,
            data: dados,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: opcoes.titulo || ''
                    }
                },
                ...opcoes
            }
        });
    },

    mostrarMensagem: (mensagem, tipo = 'info') => {
        const div = document.createElement('div');
        div.className = `mensagem mensagem-${tipo}`;
        div.innerHTML = `
            <div class="mensagem-conteudo">
                <i class="fas fa-${tipo === 'sucesso' ? 'check-circle' : 
                                 tipo === 'erro' ? 'times-circle' : 
                                 'info-circle'}"></i>
                <span>${mensagem}</span>
            </div>
        `;
        document.body.appendChild(div);

        setTimeout(() => {
            div.classList.add('mensagem-saindo');
            setTimeout(() => div.remove(), 300);
        }, 3000);
    },

    calcularTotais: function(items) {
        return items.reduce((acc, item) => acc + Number(item.valor), 0);
    },

    gerarCategorias: function() {
        return [
            'Alimentação',
            'Transporte',
            'Moradia',
            'Saúde',
            'Educação',
            'Lazer',
            'Vestuário',
            'Outros'
        ];
    },

    validarValorMonetario: (valor) => {
        if (typeof valor === 'string') {
            valor = valor.replace(/[^\d,.-]/g, '')
                        .replace(',', '.');
        }
        return !isNaN(parseFloat(valor)) && isFinite(valor);
    },

    validarData: (data) => {
        const d = new Date(data);
        return d instanceof Date && !isNaN(d);
    },

    compararDatas: (data1, data2) => {
        const d1 = new Date(data1);
        const d2 = new Date(data2);
        return d1.getDate() === d2.getDate() && 
               d1.getMonth() === d2.getMonth();
    },

    diferencaDias: (data1, data2) => {
        const d1 = new Date(data1);
        const d2 = new Date(data2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    primeiroDiaMes: (data = new Date()) => {
        return new Date(data.getFullYear(), data.getMonth(), 1);
    },

    ultimoDiaMes: (data = new Date()) => {
        return new Date(data.getFullYear(), data.getMonth() + 1, 0);
    },

    dataEntre: (data, inicio, fim) => {
        const d = new Date(data);
        const i = new Date(inicio);
        const f = new Date(fim);
        return d >= i && d <= f;
    },

    gerarId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Expor o objeto Utils globalmente
window.Utils = Utils;

// Exporta o objeto Utils para uso nos testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} 