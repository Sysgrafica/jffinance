document.addEventListener('DOMContentLoaded', function () {
    const themeSelector = document.getElementById('themeSelector');
    const notificationsToggle = document.getElementById('notificationsToggle');
    const currencySelector = document.getElementById('currencySelector');
    const saveButton = document.getElementById('saveSettings');
    const clearDataButton = document.getElementById('clearDataButton');

    // Carregar configurações salvas
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('finnairaceora_settings')) || {};

        themeSelector.value = settings.theme || 'light';
        notificationsToggle.checked = settings.notifications === undefined ? true : settings.notifications;
        currencySelector.value = settings.currency || 'BRL';

        applyTheme(settings.theme || 'light');
    }

    // Aplicar o tema na página
    function applyTheme(theme) {
        document.body.classList.remove('dark-theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    // Salvar configurações
    function saveSettings() {
        const settings = {
            theme: themeSelector.value,
            notifications: notificationsToggle.checked,
            currency: currencySelector.value,
        };

        localStorage.setItem('finnairaceora_settings', JSON.stringify(settings));
        applyTheme(settings.theme);
        
        // Feedback para o usuário
        alert('Configurações salvas com sucesso!');
    }

    // Limpar todos os dados do localStorage
    function clearData() {
        if (confirm('Você tem certeza que deseja apagar todos os dados da aplicação? Esta ação não pode ser desfeita.')) {
            localStorage.clear();
            alert('Todos os dados foram apagados. A página será recarregada.');
            window.location.reload();
        }
    }

    saveButton.addEventListener('click', saveSettings);
    clearDataButton.addEventListener('click', clearData);

    loadSettings();
}); 