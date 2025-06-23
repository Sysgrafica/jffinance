// Sistema de autenticação do Finnairaceora
const authManager = {
    // Estado atual do usuário
    currentUser: null,

    // Inicializa o sistema de autenticação
    init() {
        // Verificar se o Firebase Auth está disponível
        if (typeof firebase !== 'undefined' && firebase.auth) {
            // Observar mudanças no estado de autenticação
            firebase.auth().onAuthStateChanged(user => {
                this.currentUser = user;
                this.atualizarUI();
                
                // Se estiver na página de login e o usuário estiver autenticado, redireciona para o dashboard
                if (user && window.location.href.includes('login.html')) {
                    window.location.href = 'index.html';
                }
                
                // Se não estiver na página de login/cadastro/recuperação e o usuário não estiver autenticado,
                // verificar se a página atual requer autenticação
                if (!user && 
                    !window.location.href.includes('login.html') && 
                    !window.location.href.includes('cadastro.html') && 
                    !window.location.href.includes('recuperar-senha.html')) {
                    
                    // Lista de páginas que não requerem autenticação
                    const paginasPublicas = [
                        'index.html',
                        'sobre.html',
                        'contato.html'
                    ];
                    
                    // Verificar se a página atual está na lista de páginas públicas
                    const paginaAtual = window.location.pathname.split('/').pop();
                    const requerAutenticacao = !paginasPublicas.some(pagina => 
                        paginaAtual === pagina || paginaAtual === '' || paginaAtual === '/'
                    );
                    
                    // Se a página requer autenticação, redirecionar para login
                    if (requerAutenticacao) {
                        console.log("Página protegida. Redirecionando para login...");
                        window.location.href = window.location.href.includes('/pages/') 
                            ? '../login.html' 
                            : 'login.html';
                    } else {
                        console.log("Página pública. Não é necessário autenticação.");
                    }
                }
            });
        } else {
            console.error("Firebase Auth não está disponível");
        }
    },

    // Atualiza a interface de acordo com o estado de autenticação
    atualizarUI() {
        const userInfoElement = document.getElementById('userInfo');
        if (!userInfoElement) return;

        if (this.currentUser) {
            userInfoElement.innerHTML = `
                <div class="user-info-container">
                    <span class="user-name">${this.currentUser.displayName || this.currentUser.email}</span>
                    <button class="btn-logout" onclick="authManager.logout()">
                        <i class="fas fa-sign-out-alt"></i> Sair
                    </button>
                </div>
            `;
        } else {
            userInfoElement.innerHTML = `
                <div class="user-info-container">
                    <a href="${window.location.href.includes('/pages/') ? '../login.html' : 'login.html'}" class="btn-login">
                        <i class="fas fa-sign-in-alt"></i> Entrar
                    </a>
                </div>
            `;
        }
    },

    // Realiza o cadastro de um novo usuário
    async cadastrar(email, senha, nome) {
        try {
            // Criar usuário com email e senha
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, senha);
            
            // Atualizar o perfil do usuário com o nome
            await userCredential.user.updateProfile({
                displayName: nome
            });
            
            // Criar um documento de usuário no Firestore
            await firebase.firestore().collection('usuarios').doc(userCredential.user.uid).set({
                nome: nome,
                email: email,
                dataCriacao: new Date()
            });
            
            return { success: true };
        } catch (error) {
            console.error("Erro ao cadastrar:", error);
            
            // Traduzir mensagens de erro comuns
            let mensagem = "Erro ao criar conta. Tente novamente.";
            
            if (error.code === 'auth/email-already-in-use') {
                mensagem = "Este e-mail já está sendo usado por outra conta.";
            } else if (error.code === 'auth/invalid-email') {
                mensagem = "O e-mail informado é inválido.";
            } else if (error.code === 'auth/weak-password') {
                mensagem = "A senha deve ter pelo menos 6 caracteres.";
            }
            
            return { success: false, mensagem };
        }
    },

    // Realiza o login de um usuário
    async login(email, senha) {
        try {
            await firebase.auth().signInWithEmailAndPassword(email, senha);
            return { success: true };
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            
            // Traduzir mensagens de erro comuns
            let mensagem = "Erro ao fazer login. Tente novamente.";
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                mensagem = "E-mail ou senha incorretos.";
            } else if (error.code === 'auth/invalid-email') {
                mensagem = "O e-mail informado é inválido.";
            } else if (error.code === 'auth/user-disabled') {
                mensagem = "Esta conta foi desativada.";
            } else if (error.code === 'auth/too-many-requests') {
                mensagem = "Muitas tentativas de login. Tente novamente mais tarde.";
            }
            
            return { success: false, mensagem };
        }
    },

    // Realiza o logout do usuário
    async logout() {
        try {
            await firebase.auth().signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            alert("Erro ao fazer logout. Tente novamente.");
        }
    },

    // Envia email de recuperação de senha
    async recuperarSenha(email) {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error("Erro ao recuperar senha:", error);
            
            let mensagem = "Erro ao enviar e-mail de recuperação. Tente novamente.";
            
            if (error.code === 'auth/user-not-found') {
                mensagem = "Não existe conta com este e-mail.";
            } else if (error.code === 'auth/invalid-email') {
                mensagem = "O e-mail informado é inválido.";
            }
            
            return { success: false, mensagem };
        }
    },

    // Verifica se o usuário está autenticado
    isAuthenticated() {
        return !!this.currentUser;
    },

    // Obtém o ID do usuário atual
    getUserId() {
        return this.currentUser ? this.currentUser.uid : null;
    }
};

// Inicializar o sistema de autenticação quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    authManager.init();
}); 