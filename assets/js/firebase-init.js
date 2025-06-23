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
                        "Por favor, consulte o arquivo FIREBASE_SETUP.md para configurar as regras de segurança.";
        alert(mensagem);
        throw new Error("Erro de permissão ao acessar o Firestore.");
      } else {
        console.error("Erro ao conectar com o Firestore:", error);
        alert("Erro ao conectar com o Firestore. O sistema requer conexão com o Firestore para funcionar.");
        throw new Error("Falha na conexão com o Firestore.");
      }
    });
} catch (error) {
  console.error("Erro ao inicializar o Firestore:", error);
  alert("Erro ao inicializar o Firestore. O sistema requer o Firestore para funcionar.");
  throw new Error("Falha na inicialização do Firestore.");
} 