// Mock do Chart.js
class Chart {
    constructor(ctx, config) {
        this.data = config.data;
        this.options = config.options;
    }

    destroy() {
        // Método mock para destruir o gráfico
    }
}

global.Chart = Chart; 