// ============================================================
// LE PENDU — Banque de mots
// Mots sans accents (clavier 26 lettres). Difficulté dérivée
// de la longueur : facile <=6, moyen 7-9, difficile >=10.
// ============================================================

const RAW_WORDS = {
  "Animaux": [
    "CHAT","CHIEN","LION","TIGRE","ELEPHANT","GIRAFE","ZEBRE","SINGE","OURS",
    "RENARD","LOUP","AIGLE","HIBOU","DAUPHIN","BALEINE","REQUIN","TORTUE",
    "LEZARD","PAPILLON","ABEILLE","KANGOUROU","HERISSON","ECUREUIL",
    "CROCODILE","FLAMANT","PANTHERE","MANCHOT","CHOUETTE","SCORPION"
  ],
  "Cuisine": [
    "PAIN","FROMAGE","BEURRE","POULET","TOMATE","CAROTTE","POMME","BANANE",
    "CITRON","CHOCOLAT","GATEAU","SOUPE","SALADE","OMELETTE","RATATOUILLE",
    "CROISSANT","BAGUETTE","QUICHE","CREPE","MACARON","RISOTTO","LASAGNE",
    "MOUTARDE","VINAIGRE","CASSEROLE","MARMITE"
  ],
  "Geographie": [
    "FRANCE","PARIS","MONTAGNE","RIVIERE","OCEAN","DESERT","FORET","ILE",
    "VOLCAN","CONTINENT","AFRIQUE","EUROPE","ASIE","CANADA","JAPON","BRESIL",
    "EGYPTE","ITALIE","ESPAGNE","ALLEMAGNE","SENEGAL","RWANDA","FRONTIERE",
    "CAPITALE","PENINSULE"
  ],
  "Informatique & Cyber": [
    "ORDINATEUR","RESEAU","LOGICIEL","CLAVIER","ECRAN","SERVEUR","PIRATE",
    "VIRUS","PAREFEU","CRYPTAGE","ALGORITHME","DONNEES","NUAGE","ROBOT",
    "INTERNET","NAVIGATEUR","FICHIER","MEMOIRE","PROCESSEUR","SAUVEGARDE",
    "AUTHENTIFICATION","VULNERABILITE","HAMECONNAGE","RANCONGICIEL","AUDIT",
    "GOUVERNANCE"
  ],
  "Sport": [
    "FOOTBALL","BASKET","TENNIS","NATATION","CYCLISME","JUDO","RUGBY",
    "MARATHON","ESCALADE","VOLLEYBALL","HANDBALL","ATHLETISME","BOXE",
    "ESCRIME","SKI","SURF","GOLF","HALTEROPHILIE"
  ],
  "Cinema & Culture": [
    "CINEMA","ACTEUR","REALISATEUR","SCENARIO","MUSIQUE","PEINTURE",
    "SCULPTURE","THEATRE","ROMAN","POEME","FESTIVAL","ORCHESTRE","GUITARE",
    "PIANO","DANSE","PHOTOGRAPHIE"
  ]
};

function difficultyOf(word) {
  if (word.length <= 6) return "facile";
  if (word.length <= 9) return "moyen";
  return "difficile";
}

// Liste plate : [{ mot, theme, difficulte }]
const WORD_BANK = Object.entries(RAW_WORDS).flatMap(([theme, words]) =>
  words.map(mot => ({ mot, theme, difficulte: difficultyOf(mot) }))
);

const THEMES = Object.keys(RAW_WORDS);

function pickWord({ theme = null, difficulte = null } = {}) {
  let pool = WORD_BANK;
  if (theme && theme !== "Tous") pool = pool.filter(w => w.theme === theme);
  if (difficulte && difficulte !== "Tous") pool = pool.filter(w => w.difficulte === difficulte);
  if (pool.length === 0) pool = WORD_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}

window.PenduWordBank = { WORD_BANK, THEMES, pickWord, difficultyOf };
