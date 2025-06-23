# Sistema de Autenticação do Finnairaceora

Este documento descreve o sistema de autenticação implementado no Finnairaceora, incluindo suas funcionalidades, fluxo de trabalho e como ele se integra com o Firebase Authentication.

## Funcionalidades Implementadas

1. **Cadastro de Usuários**
   - Cadastro com e-mail e senha
   - Validação de formulário (senhas coincidentes, complexidade mínima)
   - Tratamento de erros comuns (e-mail já em uso, senha fraca)

2. **Login de Usuários**
   - Login com e-mail e senha
   - Login com Google
   - Login com Facebook (configuração necessária)
   - Tratamento de erros (credenciais inválidas, conta desativada)

3. **Recuperação de Senha**
   - Envio de e-mail para redefinição de senha
   - Validação de e-mail existente

4. **Gerenciamento de Sessão**
   - Detecção automática de usuário autenticado
   - Redirecionamento para login quando não autenticado
   - Exibição de informações do usuário na interface

5. **Segurança de Dados**
   - Associação de dados ao usuário autenticado
   - Regras de segurança do Firestore para proteger dados

## Arquivos do Sistema

- **auth.js**: Gerencia toda a lógica de autenticação
- **login.html**: Página de login
- **cadastro.html**: Página de cadastro
- **recuperar-senha.html**: Página de recuperação de senha
- **firebase-init.js**: Inicializa o Firebase Authentication
- **database.js**: Integra autenticação com o acesso aos dados

## Fluxo de Autenticação

1. O usuário acessa qualquer página do sistema
2. O sistema verifica se há um usuário autenticado
3. Se não houver, redireciona para a página de login
4. Após o login bem-sucedido, o usuário é redirecionado para o dashboard
5. Todas as operações de banco de dados são associadas ao usuário autenticado

## Estrutura de Dados

No Firestore, os dados são organizados da seguinte forma:

```
/usuarios/{userId}/
    - nome: string
    - email: string
    - dataCriacao: timestamp
    - foto: string (opcional)

/usuarios/{userId}/bancos/{bancoId}/
    - nome: string
    - agencia: string
    - conta: string
    - tipoConta: string
    - saldo: number

/usuarios/{userId}/cartoes/{cartaoId}/
    - nome: string
    - limite: number
    - fechamento: number
    - vencimento: number
    ...
```

## Requisitos do Sistema

O sistema requer uma conexão ativa com o Firebase para funcionar:

1. É necessário ter conexão com a internet
2. O Firebase Authentication deve estar acessível
3. O Firestore deve estar disponível e configurado corretamente

## Configuração do Firebase Authentication

Para configurar o Firebase Authentication, siga as instruções no arquivo `FIREBASE_SETUP.md`.

## Regras de Segurança

As regras de segurança do Firestore devem ser configuradas para proteger os dados dos usuários:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para a coleção de usuários
    match /usuarios/{userId} {
      // Usuários só podem ler/escrever seus próprios dados
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcoleções do usuário
      match /{collection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Coleções globais (compartilhadas)
    match /categorias_gastos/{id} {
      allow read: if request.auth != null;
      allow write: if false; // Somente administradores podem modificar
    }
    
    match /categorias_rendas/{id} {
      allow read: if request.auth != null;
      allow write: if false; // Somente administradores podem modificar
    }
  }
}
```

## Solução de Problemas

### Erro: "Popup closed by user"

**Causa**: O usuário fechou a janela de autenticação ou há bloqueadores de pop-up.
**Solução**: Verifique se o navegador permite pop-ups para o seu site e tente novamente.

### Erro: "Email already in use"

**Causa**: O e-mail já está sendo usado por outra conta.
**Solução**: Use outro e-mail ou tente fazer login com o e-mail existente.

### Erro: "User not found" ou "Wrong password"

**Causa**: Credenciais inválidas.
**Solução**: Verifique se o e-mail e a senha estão corretos ou use a opção "Esqueceu sua senha?".

## Recursos Adicionais

- [Documentação do Firebase Authentication](https://firebase.google.com/docs/auth)
- [Autenticação com Provedores Sociais](https://firebase.google.com/docs/auth/web/google-signin)
- [Regras de Segurança do Firestore](https://firebase.google.com/docs/firestore/security/get-started) 