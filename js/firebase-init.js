// ============================================================
// LE PENDU — Initialisation Firebase
// Remplace ces valeurs par la config de ton projet Firebase
// (tu peux réutiliser le MÊME projet que BuzzArena : il suffit
// d'ajouter un nouveau noeud /pendu_rooms, aucun conflit avec
// /buzzarena_rooms ou autre).
// ============================================================

const firebaseConfig = {
  apiKey: "REMPLACE_MOI",
  authDomain: "REMPLACE_MOI.firebaseapp.com",
  databaseURL: "https://REMPLACE_MOI-default-rtdb.firebaseio.com",
  projectId: "REMPLACE_MOI",
  storageBucket: "REMPLACE_MOI.appspot.com",
  messagingSenderId: "REMPLACE_MOI",
  appId: "REMPLACE_MOI"
};

const FIREBASE_CONFIGURED = firebaseConfig.apiKey !== "REMPLACE_MOI";

let penduAuth = null;
let penduDb = null;

if (FIREBASE_CONFIGURED) {
  firebase.initializeApp(firebaseConfig);
  penduAuth = firebase.auth();
  penduDb = firebase.database();
}

window.PenduFirebase = {
  configured: FIREBASE_CONFIGURED,
  auth: () => penduAuth,
  db: () => penduDb
};
