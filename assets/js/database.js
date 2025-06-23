// Banco de dados usando Firebase Firestore
const db = {
    // Função para popular dados iniciais (como categorias) se não existirem
    async init() {
        try {
            const initialData = {
                categorias_gastos: [
                    { id: 1, nome: 'Alimentação', icone: 'fas fa-utensils', cor: '#E74C3C' },
                    { id: 2, nome: 'Moradia', icone: 'fas fa-home', cor: '#3498DB' },
                    { id: 3, nome: 'Transporte', icone: 'fas fa-car', cor: '#2ECC71' },
                    { id: 4, nome: 'Saúde', icone: 'fas fa-heartbeat', cor: '#9B59B6' },
                    { id: 5, nome: 'Educação', icone: 'fas fa-graduation-cap', cor: '#F1C40F' },
                    { id: 6, nome: 'Lazer', icone: 'fas fa-glass-cheers', cor: '#E67E22' },
                    { id: 7, nome: 'Pessoal', icone: 'fas fa-user', cor: '#1ABC9C' },
                    { id: 8, nome: 'Outros', icone: 'fas fa-ellipsis-h', cor: '#95A5A6' }
                ],
                categorias_rendas: [
                    { id: 1, nome: 'Salário', icone: 'fas fa-money-bill-wave', cor: '#2ECC71' },
                    { id: 2, nome: 'Freelance', icone: 'fas fa-laptop', cor: '#3498DB' },
                    { id: 3, nome: 'Investimentos', icone: 'fas fa-chart-line', cor: '#F1C40F' },
                    { id: 4, nome: 'Aluguel', icone: 'fas fa-building', cor: '#9B59B6' },
                    { id: 5, nome: 'Outros', icone: 'fas fa-ellipsis-h', cor: '#95A5A6' }
                ]
            };

            for (const collectionName in initialData) {
                try {
                    const snapshot = await firestore.collection(collectionName).limit(1).get();
                    if (snapshot.empty) {
                        console.log(`Populando coleção '${collectionName}'...`);
                        const batch = firestore.batch();
                        initialData[collectionName].forEach(item => {
                            // Usar o 'id' numérico como ID do documento para consistência
                            const docRef = firestore.collection(collectionName).doc(item.id.toString());
                            batch.set(docRef, item);
                        });
                        await batch.commit();
                    }
                } catch (collectionError) {
                    console.error(`Erro ao inicializar a coleção ${collectionName}:`, collectionError);
                    // Continuar com as outras coleções
                }
            }
            return true;
        } catch (error) {
            if (error.code === 'permission-denied') {
                console.error("Erro de permissão no Firebase: Verifique as regras de segurança do Firestore.");
                console.warn("O sistema funcionará com limitações devido a erros de permissão.");
            } else {
                console.error("Erro ao inicializar o banco de dados:", error);
            }
            // Retornar falso em vez de lançar o erro
            return false;
        }
    },

    // Função para restaurar as categorias padrão
    reset() {
        try {
            // Categorias padrão de gastos
            const categoriasGastos = [
                { id: 1, nome: 'Alimentação', icone: 'fas fa-utensils', cor: '#E74C3C' },
                { id: 2, nome: 'Moradia', icone: 'fas fa-home', cor: '#3498DB' },
                { id: 3, nome: 'Transporte', icone: 'fas fa-car', cor: '#2ECC71' },
                { id: 4, nome: 'Saúde', icone: 'fas fa-heartbeat', cor: '#9B59B6' },
                { id: 5, nome: 'Educação', icone: 'fas fa-graduation-cap', cor: '#F1C40F' },
                { id: 6, nome: 'Lazer', icone: 'fas fa-glass-cheers', cor: '#E67E22' },
                { id: 7, nome: 'Pessoal', icone: 'fas fa-user', cor: '#1ABC9C' },
                { id: 8, nome: 'Outros', icone: 'fas fa-ellipsis-h', cor: '#95A5A6' }
            ];
            
            // Categorias padrão de rendas
            const categoriasRendas = [
                { id: 1, nome: 'Salário', icone: 'fas fa-money-bill-wave', cor: '#2ECC71' },
                { id: 2, nome: 'Freelance', icone: 'fas fa-laptop', cor: '#3498DB' },
                { id: 3, nome: 'Investimentos', icone: 'fas fa-chart-line', cor: '#F1C40F' },
                { id: 4, nome: 'Aluguel', icone: 'fas fa-building', cor: '#9B59B6' },
                { id: 5, nome: 'Outros', icone: 'fas fa-ellipsis-h', cor: '#95A5A6' }
            ];
            
            // Armazenar temporariamente no localStorage para uso imediato
            localStorage.setItem('categorias_gastos', JSON.stringify(categoriasGastos));
            localStorage.setItem('categorias_rendas', JSON.stringify(categoriasRendas));
            
            console.log("Categorias padrão restauradas com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao restaurar categorias padrão:", error);
            return false;
        }
    },

    // Obtém o ID do usuário atual
    getUserId() {
        return firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
    },

    // Obtém o caminho da coleção com base no usuário atual
    getCollectionPath(collectionName) {
        const userId = this.getUserId();
        
        // Coleções globais (compartilhadas entre todos os usuários)
        const globalCollections = ['categorias_gastos', 'categorias_rendas'];
        
        if (globalCollections.includes(collectionName)) {
            return collectionName;
        }
        
        // Coleções específicas do usuário
        if (userId) {
            return `usuarios/${userId}/${collectionName}`;
        }
        
        // Se não houver usuário autenticado, usar um caminho temporário
        console.warn("Usuário não autenticado. Usando caminho temporário para a coleção.");
        return `temp/${Date.now()}/${collectionName}`;
    },

    // Obtém todos os registros de uma coleção
    async getAll(collectionName) {
        try {
            const collectionPath = this.getCollectionPath(collectionName);
            const snapshot = await firestore.collection(collectionPath).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            if (error.code === 'permission-denied') {
                console.error(`Erro de permissão ao acessar ${collectionName}: Verifique as regras de segurança do Firestore.`);
                console.warn(`Retornando array vazio para ${collectionName} devido a erro de permissão.`);
            } else {
                console.error(`Erro ao buscar dados de ${collectionName}:`, error);
            }
            // Retornar um array vazio em vez de lançar o erro
            return [];
        }
    },
    
    // Obtém um único registro pelo ID
    async getById(collectionName, id) {
        try {
            const collectionPath = this.getCollectionPath(collectionName);
            const docRef = await firestore.collection(collectionPath).doc(id).get();
            if (docRef.exists) {
                return { id: docRef.id, ...docRef.data() };
            }
            return null;
        } catch (error) {
            if (error.code === 'permission-denied') {
                console.error(`Erro de permissão ao acessar documento ${id} em ${collectionName}: Verifique as regras de segurança do Firestore.`);
            } else {
                console.error(`Erro ao buscar o documento ${id} de ${collectionName}:`, error);
            }
            // Retornar null em vez de lançar o erro
            return null;
        }
    },

    // Insere um novo registro
    async insert(collectionName, data) {
        try {
            const collectionPath = this.getCollectionPath(collectionName);
            // Remove o campo 'id' se ele existir, pois o Firestore gerará um.
            const { id, ...dataToInsert } = data; 
            const docRef = await firestore.collection(collectionPath).add(dataToInsert);
            return { id: docRef.id, ...dataToInsert };
        } catch (error) {
            if (error.code === 'permission-denied') {
                console.error(`Erro de permissão ao inserir em ${collectionName}: Verifique as regras de segurança do Firestore.`);
                alert(`Erro de permissão ao inserir dados em ${collectionName}. Verifique as regras de segurança do Firestore.`);
            } else {
                console.error(`Erro ao inserir em ${collectionName}:`, error);
                alert(`Erro ao inserir dados em ${collectionName}.`);
            }
            // Retornar null em vez de lançar o erro
            return null;
        }
    },

    // Atualiza um registro
    async update(collectionName, id, data) {
        try {
            const collectionPath = this.getCollectionPath(collectionName);
            const dataToUpdate = { ...data };
            // Não queremos atualizar o campo 'id' dentro do documento
            delete dataToUpdate.id; 
            await firestore.collection(collectionPath).doc(id).update(dataToUpdate);
            return { id, ...data }; // Retorna o objeto atualizado
        } catch (error) {
            if (error.code === 'permission-denied') {
                console.error(`Erro de permissão ao atualizar documento ${id} em ${collectionName}: Verifique as regras de segurança do Firestore.`);
                alert(`Erro de permissão ao atualizar dados em ${collectionName}.`);
            } else {
                console.error(`Erro ao atualizar o documento ${id} em ${collectionName}:`, error);
                alert(`Erro ao atualizar o documento ${id} em ${collectionName}.`);
            }
            // Retornar null em vez de lançar o erro
            return null;
        }
    },

    // Remove um registro
    async delete(collectionName, id) {
        try {
            const collectionPath = this.getCollectionPath(collectionName);
            await firestore.collection(collectionPath).doc(id).delete();
            return true;
        } catch (error) {
            if (error.code === 'permission-denied') {
                console.error(`Erro de permissão ao deletar documento ${id} em ${collectionName}: Verifique as regras de segurança do Firestore.`);
                alert(`Erro de permissão ao deletar dados em ${collectionName}.`);
            } else {
                console.error(`Erro ao deletar o documento ${id} de ${collectionName}:`, error);
                alert(`Erro ao deletar o documento ${id} de ${collectionName}.`);
            }
            // Retornar false em vez de lançar o erro
            return false;
        }
    },

    // Salva um item (cria se não tiver ID, atualiza se tiver)
    async save(collectionName, item) {
        if (item.id) {
            return this.update(collectionName, item.id, item);
        } else {
            return this.insert(collectionName, item);
        }
    }
};

// Inicializa o banco de dados
db.init().then((success) => {
    if (success) {
        console.log("Banco de dados inicializado e categorias verificadas.");
    } else {
        console.warn("Banco de dados inicializado com limitações. Algumas funcionalidades podem não estar disponíveis.");
    }
}).catch(error => {
    console.error("Não foi possível inicializar o banco de dados. Verifique se as regras de segurança do Firebase estão configuradas corretamente.");
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = db;
} 