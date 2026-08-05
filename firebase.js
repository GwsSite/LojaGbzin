// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB7poVUc2Jr26iyOT3Bac5Fg8BvevC7JcA",
  authDomain: "script-c2966.firebaseapp.com",
  databaseURL: "https://script-c2966-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "script-c2966",
  storageBucket: "script-c2966.firebasestorage.app",
  messagingSenderId: "65660726953",
  appId: "1:65660726953:web:322631bc04bfc4e7c983b8"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
