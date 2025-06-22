// Sistema de Notificações
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.init();
    }

    init() {
        // Carregar notificações do localStorage
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
            this.notifications = JSON.parse(savedNotifications);
            this.updateUnreadCount();
        }

        // Iniciar verificações periódicas
        this.checkForNewNotifications();
        setInterval(() => this.checkForNewNotifications(), 300000); // Verificar a cada 5 minutos
    }

    async checkForNewNotifications() {
        await Promise.all([
            this.checkCartoes(),
            this.checkGastosFixos(),
            this.checkRendas(),
            this.checkMetas(),
            this.checkPagamentosRecentes(),
            this.checkRecebimentosRecentes()
        ]);

        this.saveNotifications();
        this.updateUI();
    }

    async checkCartoes() {
        const cartoes = await this.getCartoes();
        cartoes.forEach(cartao => {
            // Verificar faturas próximas do vencimento
            if (cartao.fatura && !cartao.fatura.paga && this.isNearDueDate(cartao.fatura.vencimento)) {
                this.addNotification({
                    type: 'danger',
                    icon: 'fa-credit-card',
                    title: `Fatura do cartão ${cartao.nome} próxima do vencimento`,
                    message: `A fatura no valor de R$ ${cartao.fatura.valor} vence em ${this.formatDate(cartao.fatura.vencimento)}`,
                    link: 'pages/cartoes.html',
                    timestamp: new Date().toISOString()
                });
            }

            // Verificar faturas recém pagas
            if (cartao.fatura && cartao.fatura.paga && this.isRecentPayment(cartao.fatura.dataPagamento)) {
                this.addNotification({
                    type: 'success',
                    icon: 'fa-check-circle',
                    title: `Fatura paga com sucesso`,
                    message: `A fatura do cartão ${cartao.nome} no valor de R$ ${cartao.fatura.valor} foi paga em ${this.formatDate(cartao.fatura.dataPagamento)}`,
                    link: 'pages/cartoes.html',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async checkGastosFixos() {
        const gastos = await this.getGastosFixos();
        gastos.forEach(gasto => {
            // Verificar contas próximas do vencimento
            if (!gasto.pago && this.isNearDueDate(gasto.vencimento)) {
                this.addNotification({
                    type: 'warning',
                    icon: 'fa-money-bill-wave',
                    title: `Conta fixa próxima do vencimento`,
                    message: `${gasto.descricao} no valor de R$ ${gasto.valor} vence em ${this.formatDate(gasto.vencimento)}`,
                    link: 'pages/gastos.html',
                    timestamp: new Date().toISOString()
                });
            }

            // Verificar contas recém pagas
            if (gasto.pago && this.isRecentPayment(gasto.dataPagamento)) {
                this.addNotification({
                    type: 'success',
                    icon: 'fa-check-circle',
                    title: `Conta fixa paga com sucesso`,
                    message: `${gasto.descricao} no valor de R$ ${gasto.valor} foi paga em ${this.formatDate(gasto.dataPagamento)}`,
                    link: 'pages/gastos.html',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async checkRendas() {
        const rendas = await this.getRendas();
        rendas.forEach(renda => {
            // Verificar rendas atrasadas
            if (!renda.recebida && this.isOverdue(renda.dataPrevisao)) {
                this.addNotification({
                    type: 'info',
                    icon: 'fa-hand-holding-usd',
                    title: `Renda pendente de recebimento`,
                    message: `${renda.descricao} no valor de R$ ${renda.valor} estava prevista para ${this.formatDate(renda.dataPrevisao)}`,
                    link: 'pages/rendas.html',
                    timestamp: new Date().toISOString()
                });
            }

            // Verificar rendas recém recebidas
            if (renda.recebida && this.isRecentPayment(renda.dataRecebimento)) {
                this.addNotification({
                    type: 'success',
                    icon: 'fa-check-circle',
                    title: `Renda recebida com sucesso`,
                    message: `${renda.descricao} no valor de R$ ${renda.valor} foi recebida em ${this.formatDate(renda.dataRecebimento)}`,
                    link: 'pages/rendas.html',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async checkMetas() {
        const metas = await this.getMetas();
        metas.forEach(meta => {
            // Verificar metas excedidas
            if (meta.valorAtual > meta.valorLimite) {
                this.addNotification({
                    type: 'warning',
                    icon: 'fa-chart-line',
                    title: `Meta de gastos excedida`,
                    message: `A meta ${meta.categoria} excedeu o limite de R$ ${meta.valorLimite}`,
                    link: 'index.html',
                    timestamp: new Date().toISOString()
                });
            }

            // Verificar metas próximas do limite
            const percentual = (meta.valorAtual / meta.valorLimite) * 100;
            if (percentual >= 80 && percentual < 100) {
                this.addNotification({
                    type: 'info',
                    icon: 'fa-chart-line',
                    title: `Meta próxima do limite`,
                    message: `A meta ${meta.categoria} está em ${percentual.toFixed(1)}% do limite de R$ ${meta.valorLimite}`,
                    link: 'index.html',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async checkPagamentosRecentes() {
        const pagamentos = await this.getPagamentosRecentes();
        pagamentos.forEach(pagamento => {
            if (this.isRecentPayment(pagamento.dataPagamento)) {
                this.addNotification({
                    type: 'success',
                    icon: 'fa-check-circle',
                    title: `Pagamento registrado`,
                    message: `${pagamento.descricao} no valor de R$ ${pagamento.valor} foi pago em ${this.formatDate(pagamento.dataPagamento)}`,
                    link: pagamento.tipo === 'cartao' ? 'pages/cartoes.html' : 'pages/gastos.html',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async checkRecebimentosRecentes() {
        const recebimentos = await this.getRecebimentosRecentes();
        recebimentos.forEach(recebimento => {
            if (this.isRecentPayment(recebimento.dataRecebimento)) {
                this.addNotification({
                    type: 'success',
                    icon: 'fa-check-circle',
                    title: `Recebimento confirmado`,
                    message: `${recebimento.descricao} no valor de R$ ${recebimento.valor} foi recebido em ${this.formatDate(recebimento.dataRecebimento)}`,
                    link: 'pages/rendas.html',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    addNotification(notification) {
        // Verificar se já existe uma notificação similar não lida
        const similarNotification = this.notifications.find(n => 
            n.title === notification.title && 
            n.message === notification.message && 
            !n.read
        );

        if (!similarNotification) {
            notification.id = Date.now();
            notification.read = false;
            this.notifications.unshift(notification);
            this.updateUnreadCount();
            this.saveNotifications();
            this.updateUI();
        }
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.updateUnreadCount();
            this.saveNotifications();
            this.updateUI();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateUnreadCount();
        this.saveNotifications();
        this.updateUI();
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
    }

    saveNotifications() {
        // Manter apenas as últimas 50 notificações
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    updateUI() {
        const badge = document.getElementById('notificationCount');
        const panel = document.getElementById('notificationsList');
        
        if (!badge || !panel) return;

        // Atualizar contador
        badge.textContent = this.unreadCount;
        badge.style.display = this.unreadCount > 0 ? 'block' : 'none';

        // Atualizar lista de notificações
        if (this.notifications.length === 0) {
            panel.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>Nenhuma notificação no momento</p>
                </div>
            `;
            return;
        }

        panel.innerHTML = this.notifications
            .map(notification => `
                <div class="notification-item ${notification.read ? '' : 'unread'}" 
                     onclick="notificationSystem.markAsRead(${notification.id})">
                    <div class="notification-icon ${notification.type}">
                        <i class="fas ${notification.icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${this.formatTimeAgo(notification.timestamp)}</div>
                        ${notification.link ? `
                            <div class="notification-actions">
                                <a href="${notification.link}" class="btn btn-sm btn-primary">
                                    Ver detalhes
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `)
            .join('');
    }

    // Funções auxiliares
    isNearDueDate(date) {
        const dueDate = new Date(date);
        const today = new Date();
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return diffDays <= 5 && diffDays >= 0;
    }

    isOverdue(date) {
        const dueDate = new Date(date);
        const today = new Date();
        return dueDate < today;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR');
    }

    formatTimeAgo(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);
        
        if (diffSeconds < 60) return 'Agora mesmo';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minutos atrás`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} horas atrás`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} dias atrás`;
        return this.formatDate(date);
    }

    // Funções auxiliares adicionais
    isRecentPayment(date) {
        if (!date) return false;
        const paymentDate = new Date(date);
        const now = new Date();
        const diffHours = Math.abs(now - paymentDate) / (1000 * 60 * 60);
        return diffHours <= 24; // Considera pagamentos nas últimas 24 horas
    }

    // Funções de acesso aos dados (mock - substituir pela sua implementação)
    async getCartoes() {
        return JSON.parse(localStorage.getItem('cartoes') || '[]');
    }

    async getGastosFixos() {
        return JSON.parse(localStorage.getItem('gastosFixos') || '[]');
    }

    async getRendas() {
        return JSON.parse(localStorage.getItem('rendas') || '[]');
    }

    async getMetas() {
        return JSON.parse(localStorage.getItem('metas') || '[]');
    }

    async getPagamentosRecentes() {
        return JSON.parse(localStorage.getItem('pagamentosRecentes') || '[]');
    }

    async getRecebimentosRecentes() {
        return JSON.parse(localStorage.getItem('recebimentosRecentes') || '[]');
    }
}

// Funções globais para interação com a UI
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('active');
}

function marcarTodasComoLidas() {
    notificationSystem.markAllAsRead();
}

// Inicializar o sistema de notificações
const notificationSystem = new NotificationSystem(); 