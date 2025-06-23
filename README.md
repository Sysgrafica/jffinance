# Finnairaceora - Sistema de Controle Financeiro

## Resolução do Erro de Permissão do Firebase

Foram implementadas as seguintes alterações para resolver o erro `FirebaseError: Missing or insufficient permissions`:

### 1. Melhorias no Tratamento de Erros

- Adicionado tratamento específico para erros de permissão no Firebase
- Implementado sistema de mensagens de erro mais claras para o usuário
- Adicionada detecção automática de problemas de conexão com o Firebase

### 2. Sistema de Fallback para localStorage

- Criado arquivo `database-fallback.js` que implementa todas as funções do banco de dados usando localStorage
- Configurado sistema automático para alternar entre Firebase e localStorage quando necessário
- Garantida a compatibilidade de API entre as duas implementações

### 3. Atualização dos Arquivos HTML

- Adicionado script de fallback em todas as páginas HTML
- Atualizada a ordem de carregamento dos scripts para garantir funcionamento correto
- Implementada detecção de modo offline em todas as páginas

### 4. Documentação

- Criado arquivo `FIREBASE_SETUP.md` com instruções detalhadas para configurar as regras de segurança
- Documentadas as possíveis causas e soluções para erros comuns
- Adicionadas instruções para ambiente de produção

## Como Usar

O sistema agora funciona em dois modos:

1. **Modo Online (Firebase)**: Quando o Firebase está corretamente configurado, os dados são salvos na nuvem
2. **Modo Offline (localStorage)**: Quando há problemas de conexão ou permissão, os dados são salvos localmente

Para configurar as regras de segurança do Firebase e permitir o modo online, siga as instruções no arquivo `FIREBASE_SETUP.md`.

## Tecnologias Utilizadas

- HTML, CSS e JavaScript
- Firebase Firestore (banco de dados)
- Chart.js (gráficos)
- Font Awesome (ícones)
- localStorage (armazenamento local de fallback)

## Estrutura do Projeto

- `index.html`: Dashboard principal
- `pages/`: Páginas do sistema (bancos, cartões, gastos, rendas, configurações)
- `assets/js/`: Scripts JavaScript
- `assets/css/`: Folhas de estilo CSS

## Autor

© 2024 Finnairaceora - Controle Financeiro

Finnairaceora é um sistema de controle financeiro pessoal que permite gerenciar bancos, cartões, gastos e rendas. O sistema foi desenvolvido utilizando HTML, CSS e JavaScript puro, sem necessidade de frameworks ou bibliotecas externas (exceto Chart.js para gráficos).

## Funcionalidades Principais

- **Dashboard financeiro** com visão geral de saldos, gastos e rendas
- **Gerenciamento de contas bancárias** e seus saldos
- **Controle de cartões de crédito** e faturas
- **Registro de gastos** fixos e variáveis
- **Controle de rendas** fixas e variáveis
- **Sistema de autenticação** com cadastro, login e recuperação de senha
- **Metas de gastos** para controle orçamentário
- **Gráficos e relatórios** para análise financeira

## Sistema de Autenticação

O Finnairaceora inclui um sistema completo de autenticação:

- **Cadastro de usuários** com e-mail e senha
- **Login social** com Google e Facebook
- **Recuperação de senha** por e-mail
- **Proteção de dados** com regras de segurança do Firebase
- **Persistência de sessão** entre visitas

Para mais detalhes sobre o sistema de autenticação, consulte o arquivo [AUTH_README.md](AUTH_README.md).

## Configuração do Firebase

Para configurar o Firebase para este projeto, siga as instruções detalhadas no arquivo [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

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