// Banco de dados simulado usando localStorage
const db = {
    // Dados iniciais para teste
    _initialData: {
        bancos: [],
        cartoes: [],
        gastos_fixos: [],
        gastos_variaveis: [],
        rendas_fixas: [],
        rendas_variaveis: [],
        compras: [],
        categorias_gastos: [
            { id: 1, nome: 'Alimentação', icone: 'fas fa-utensils', cor: '#E74C3C' },
            { id: 2, nome: 'Moradia', icone: 'fas fa-home', cor: '#3498DB' },
            { id: 3, nome: 'Transporte', icone: 'fas fa-car', cor: '#2ECC71' },
            { id: 4, nome: 'Saúde', icone: 'fas fa-heartbeat', cor: '#9B59B6' },
            { id: 5, nome: 'Educação', icone: 'fas fa-graduation-cap', cor: '#F1C40F' }
        ],
        categorias_rendas: [
            { id: 1, nome: 'Salário', icone: 'fas fa-money-bill-wave', cor: '#2ECC71' },
            { id: 2, nome: 'Freelance', icone: 'fas fa-laptop', cor: '#3498DB' },
            { id: 3, nome: 'Investimentos', icone: 'fas fa-chart-line', cor: '#F1C40F' },
            { id: 4, nome: 'Aluguel', icone: 'fas fa-building', cor: '#9B59B6' }
        ],
        subcategorias_gastos: [
            // Alimentação
            { id: 1, categoriaId: 1, nome: 'Mercado', tipo: 'casa' },
            { id: 2, categoriaId: 1, nome: 'Restaurantes', tipo: 'pessoal' },
            { id: 3, categoriaId: 1, nome: 'Delivery', tipo: 'pessoal' },
            // Moradia
            { id: 4, categoriaId: 2, nome: 'Aluguel', tipo: 'casa' },
            { id: 5, categoriaId: 2, nome: 'Condomínio', tipo: 'casa' },
            { id: 6, categoriaId: 2, nome: 'Energia', tipo: 'casa' },
            { id: 7, categoriaId: 2, nome: 'Água', tipo: 'casa' },
            { id: 8, categoriaId: 2, nome: 'Internet', tipo: 'casa' },
            { id: 9, categoriaId: 2, nome: 'Manutenção', tipo: 'casa' },
            // Transporte
            { id: 10, categoriaId: 3, nome: 'Combustível', tipo: 'pessoal' },
            { id: 11, categoriaId: 3, nome: 'Transporte Público', tipo: 'pessoal' },
            { id: 12, categoriaId: 3, nome: 'Manutenção do Carro', tipo: 'pessoal' },
            { id: 13, categoriaId: 3, nome: 'Estacionamento', tipo: 'pessoal' },
            // Saúde
            { id: 14, categoriaId: 4, nome: 'Plano de Saúde', tipo: 'pessoal' },
            { id: 15, categoriaId: 4, nome: 'Medicamentos', tipo: 'pessoal' },
            { id: 16, categoriaId: 4, nome: 'Consultas', tipo: 'pessoal' },
            { id: 17, categoriaId: 4, nome: 'Academia', tipo: 'pessoal' },
            // Educação
            { id: 18, categoriaId: 5, nome: 'Mensalidade', tipo: 'pessoal' },
            { id: 19, categoriaId: 5, nome: 'Material Escolar', tipo: 'pessoal' },
            { id: 20, categoriaId: 5, nome: 'Cursos', tipo: 'pessoal' }
        ]
    },

    // Inicializa o banco de dados
    init() {
        Object.keys(this._initialData).forEach(table => {
            if (!localStorage.getItem(table)) {
                localStorage.setItem(table, JSON.stringify(this._initialData[table]));
            }
        });
    },

    // Obtém todos os registros de uma tabela
    getAll(table) {
        const data = localStorage.getItem(table);
        return data ? JSON.parse(data) : [];
    },

    // Insere um novo registro
    insert(table, data) {
        const items = this.getAll(table);
        const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
        const newItem = { ...data, id: newId };
        items.push(newItem);
        localStorage.setItem(table, JSON.stringify(items));
        return newItem;
    },

    // Atualiza um registro
    update(table, id, data) {
        const items = this.getAll(table);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...data, id };
            localStorage.setItem(table, JSON.stringify(items));
            return items[index];
        }
        return null;
    },

    // Remove um registro
    delete(table, id) {
        const items = this.getAll(table);
        const filteredItems = items.filter(item => item.id !== id);
        localStorage.setItem(table, JSON.stringify(filteredItems));
        return true;
    },

    // Limpa uma tabela
    clear(table) {
        localStorage.setItem(table, JSON.stringify([]));
    },

    // Limpa todo o banco de dados
    clearAll() {
        Object.keys(this._initialData).forEach(table => this.clear(table));
    },

    // Reinicializa o banco de dados com os dados iniciais
    reset() {
        this.clearAll();
        this.init();
    },
    
    // Salva um objeto existente
    save(table, item) {
        if (!item || !item.id) {
            console.error('Item inválido ou sem ID para salvar');
            return null;
        }
        
        return this.update(table, item.id, item);
    },
    
    // Salva uma lista de objetos
    saveAll(table, items) {
        if (!Array.isArray(items)) {
            console.error('saveAll espera um array de itens');
            return false;
        }
        
        localStorage.setItem(table, JSON.stringify(items));
        return true;
    }
};

// Inicializa o banco de dados
db.init();

// Exporta o objeto db para uso nos testes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = db;
} 