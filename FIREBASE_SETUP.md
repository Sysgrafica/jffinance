# Configuração do Firebase para o Finnairaceora

Este documento contém instruções detalhadas para configurar corretamente o Firebase Firestore e Authentication para o sistema Finnairaceora.

## Problema: Erro de Permissão

Se você estiver vendo o erro `FirebaseError: Missing or insufficient permissions`, isso significa que as regras de segurança do Firestore estão bloqueando o acesso aos dados.

## Solução: Configurar as Regras de Segurança

### Passo 1: Acessar o Console do Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Faça login com sua conta Google
3. Selecione o projeto "jffinances-3d813"

### Passo 2: Configurar as Regras de Segurança do Firestore

1. No menu lateral esquerdo, clique em **Firestore Database**
2. Clique na aba **Regras**
3. Substitua as regras existentes por estas (para desenvolvimento):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Clique em **Publicar**

### Passo 3: Configurar o Firebase Authentication

1. No menu lateral esquerdo, clique em **Authentication**
2. Clique na aba **Sign-in method**
3. Habilite os seguintes métodos de autenticação:
   - **Email/Password**: Clique nele, ative a opção "Enable" e salve
   - **Google**: Clique nele, ative a opção "Enable" e configure o nome do projeto
   - **Facebook** (opcional): Se quiser usar login com Facebook, você precisará configurar um app no Facebook Developers

### Passo 4: Configurar Domínios Autorizados

1. Na mesma página de **Authentication**, vá para a aba **Settings**
2. Role para baixo até a seção **Authorized domains**
3. Adicione os domínios onde sua aplicação será hospedada (por exemplo, `localhost`, `seu-usuario.github.io`)

### Passo 5: Verificar a Conexão

1. Após atualizar as regras e configurar a autenticação, recarregue a página da aplicação
2. Tente fazer login ou criar uma conta
3. Se tudo estiver configurado corretamente, você deverá conseguir autenticar-se e acessar os dados

## Regras de Segurança para Produção

**IMPORTANTE**: As regras acima permitem acesso total ao banco de dados sem autenticação. Isso é adequado apenas para desenvolvimento.

Para um ambiente de produção, você deve implementar regras mais restritivas, como:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Autenticação necessária para todas as operações
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Regras específicas para coleção de usuários
    match /usuarios/{userId} {
      // Usuários só podem ler/escrever seus próprios dados
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para dados financeiros
    match /bancos/{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/usuarios/$(request.auth.uid));
    }
    
    match /cartoes/{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/usuarios/$(request.auth.uid));
    }
    
    match /gastos_fixos/{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/usuarios/$(request.auth.uid));
    }
    
    // ... regras similares para outras coleções
  }
}
```

## Estrutura do Banco de Dados

O Finnairaceora utiliza as seguintes coleções no Firestore:

- `usuarios`: Informações sobre os usuários do sistema
- `bancos`: Informações sobre contas bancárias
- `cartoes`: Informações sobre cartões de crédito
- `categorias_gastos`: Categorias para classificação de gastos
- `categorias_rendas`: Categorias para classificação de rendas
- `gastos_fixos`: Gastos que ocorrem regularmente todo mês
- `gastos_variaveis`: Gastos pontuais
- `rendas_fixas`: Rendas que ocorrem regularmente todo mês
- `rendas_variaveis`: Rendas pontuais
- `transacoes`: Registro de todas as transações (pagamentos e recebimentos)

## Requisitos do Sistema

O sistema Finnairaceora requer uma conexão ativa com o Firebase para funcionar:

1. É necessário ter conexão com a internet
2. O Firebase Authentication deve estar acessível
3. O Firestore deve estar disponível e configurado corretamente

## Solução de Problemas

### Erro: "FirebaseError: Missing or insufficient permissions"

**Causa**: As regras de segurança do Firestore estão bloqueando o acesso.
**Solução**: Siga as instruções acima para configurar as regras de segurança.

### Erro: "Firebase is not defined"

**Causa**: Os scripts do Firebase não foram carregados corretamente.
**Solução**: Verifique se os scripts do Firebase estão sendo carregados na ordem correta:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>

<!-- Nossa inicialização do Firebase -->
<script src="assets/js/firebase-init.js"></script>

<!-- Depois os scripts da aplicação -->
<script src="assets/js/auth.js"></script>
<script src="assets/js/database.js"></script>
<!-- outros scripts... -->
```

### Erro: "Popup closed by user" durante autenticação social

**Causa**: O usuário fechou a janela de autenticação ou há bloqueadores de pop-up.
**Solução**: Verifique se o navegador permite pop-ups para o seu site e tente novamente.

### Erro: "Quota exceeded"

**Causa**: Você atingiu o limite de uso do plano gratuito do Firebase.
**Solução**: Monitore o uso no Console do Firebase e considere atualizar para um plano pago se necessário.

## Recursos Adicionais

- [Documentação do Firebase](https://firebase.google.com/docs)
- [Regras de Segurança do Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [Autenticação do Firebase](https://firebase.google.com/docs/auth)
- [Limites e Cotas do Firebase](https://firebase.google.com/docs/firestore/quotas) 