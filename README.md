# Finnairaceora - Sistema de Controle Financeiro

Finnairaceora é um sistema de controle financeiro pessoal que permite gerenciar bancos, cartões, gastos e rendas. O sistema foi desenvolvido utilizando HTML, CSS e JavaScript puro, sem necessidade de frameworks ou bibliotecas externas (exceto Chart.js para gráficos).

## Funcionalidades

- **Dashboard**: Visão geral das finanças com saldo total, gastos e rendas do mês, faturas de cartões e gráficos
- **Bancos**: Gerenciamento de contas bancárias
- **Cartões**: Gerenciamento de cartões de crédito e compras
- **Gastos**: Controle de gastos fixos e variáveis com categorização
- **Rendas**: Controle de rendas fixas e variáveis com categorização

## Como executar

Para executar o projeto, você precisa de um servidor web local devido às restrições de CORS ao carregar arquivos JavaScript. Existem várias opções:

### Opção 1: Usando o Live Server do VS Code

1. Instale a extensão "Live Server" no Visual Studio Code
2. Abra o projeto no VS Code
3. Clique com o botão direito no arquivo `index.html`
4. Selecione "Open with Live Server"

### Opção 2: Usando Python (Python 3)

1. Abra um terminal na pasta do projeto
2. Execute o comando: `python -m http.server`
3. Acesse no navegador: `http://localhost:8000`

### Opção 3: Usando Node.js

1. Instale o http-server: `npm install -g http-server`
2. Abra um terminal na pasta do projeto
3. Execute o comando: `http-server`
4. Acesse no navegador: `http://localhost:8080`

## Estrutura do projeto

```
Finnairaceora/
  ├── assets/
  │   ├── css/
  │   │   └── style.css
  │   └── js/
  │       ├── database.js  # Gerenciamento de dados no LocalStorage
  │       └── utils.js     # Funções utilitárias
  ├── index.html           # Dashboard principal
  └── pages/
      ├── bancos.html      # Gerenciamento de bancos
      ├── cartoes.html     # Gerenciamento de cartões
      ├── gastos.html      # Gerenciamento de gastos
      └── rendas.html      # Gerenciamento de rendas
```

## Armazenamento de dados

O sistema utiliza o LocalStorage do navegador para armazenar todos os dados. Isso significa que:

1. Os dados são persistidos entre sessões no mesmo navegador
2. Os dados são armazenados apenas localmente (não há sincronização com a nuvem)
3. Limpar o cache do navegador apagará todos os dados

## Solução de problemas

Se você encontrar erros de CORS ao abrir os arquivos diretamente no navegador (usando o protocolo `file://`), é necessário usar um dos métodos descritos acima para executar o projeto através de um servidor web.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js para visualização de dados
- LocalStorage para persistência de dados 