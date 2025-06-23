// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACDqS-glK2C072T1xplcyxr9WnCDvjD_Q",
  authDomain: "jffinances-3d813.firebaseapp.com",
  projectId: "jffinances-3d813",
  storageBucket: "jffinances-3d813.appspot.com",
  messagingSenderId: "952921954483",
  appId: "1:952921954483:web:cbceb6a7b0e5eb4f17b8c6"
};

// Variável global para controlar se estamos usando o fallback
window.usingFirebaseFallback = false;

// Verificar se o Firebase já foi inicializado
if (!firebase.apps || !firebase.apps.length) {
  try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar o Firebase:", error);
    alert("Erro ao conectar com o Firebase. O sistema requer conexão com o Firebase para funcionar.");
    throw new Error("Falha na conexão com o Firebase. Por favor, verifique sua conexão com a internet e tente novamente.");
  }
} else {
  console.log("Firebase já estava inicializado.");
}

// Inicializar Authentication
try {
  window.auth = firebase.auth();
  console.log("Firebase Authentication inicializado com sucesso!");
} catch (error) {
  console.error("Erro ao inicializar o Firebase Authentication:", error);
  alert("Erro ao inicializar o Firebase Authentication. O sistema requer autenticação para funcionar.");
  throw new Error("Falha na inicialização do Firebase Authentication.");
}

// Inicializar Firestore com tratamento de erro
try {
  window.firestore = firebase.firestore();
  
  // Verificar conexão com o Firestore
  window.firestore.collection('teste_conexao').limit(1).get()
    .then(() => {
      console.log("Conexão com o Firestore estabelecida com sucesso!");
    })
    .catch(error => {
      if (error.code === 'permission-denied') {
        console.error("ERRO DE PERMISSÃO: Verifique as regras de segurança do Firestore.");
        const mensagem = "Erro de permissão ao acessar o Firestore.\n\n" +
                        "Por favor, configure as regras de segurança do Firestore no console do Firebase:\n" +
                        "1. Acesse https://console.firebase.google.com\n" +
                        "2. Selecione seu projeto\n" +
                        "3. Vá para Firestore Database > Regras\n" +
                        "4. Substitua as regras existentes por:\n\n" +
                        "rules_version = '2';\n" +
                        "service cloud.firestore {\n" +
                        "  match /databases/{database}/documents {\n" +
                        "    match /{document=**} {\n" +
                        "      allow read, write: if true;\n" +
                        "    }\n" +
                        "  }\n" +
                        "}";
        alert(mensagem);
        // Não lançamos o erro para permitir que o usuário continue, mas registramos o problema
        console.warn("O sistema funcionará com limitações até que as regras de segurança sejam configuradas.");
      } else {
        console.error("Erro ao conectar com o Firestore:", error);
        alert("Erro ao conectar com o Firestore. Verifique sua conexão com a internet e tente novamente.");
        // Não lançamos o erro para permitir que o usuário continue, mas registramos o problema
        console.warn("O sistema funcionará com limitações até que a conexão com o Firestore seja estabelecida.");
      }
    });
} catch (error) {
  console.error("Erro ao inicializar o Firestore:", error);
  alert("Erro ao inicializar o Firestore. Verifique sua conexão com a internet e tente novamente.");
  // Não lançamos o erro para permitir que o usuário continue, mas registramos o problema
  console.warn("O sistema funcionará com limitações até que o Firestore seja inicializado corretamente.");
} 