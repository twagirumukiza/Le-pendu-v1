// ============================================================
// LE PENDU — Multijoueur (Firebase Realtime Database)
// Mode A : "Manche collective"  -> tour par tour + buzz mot possible à tout moment
// Mode B : "Mot secret"         -> un hôte choisit le mot, les autres devinent
// ============================================================

const { normalize, MAX_ERRORS } = window.PenduUtils;

function genRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans lettres/chiffres ambigus
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

class PenduMultiplayer {
  constructor() {
    this.db = window.PenduFirebase.db();
    this.auth = window.PenduFirebase.auth();
    this.uid = null;
    this.roomCode = null;
    this.roomRef = null;
    this.unsub = null;
  }

  async ensureAuth() {
    if (this.uid) return this.uid;
    const cred = await this.auth.signInAnonymously();
    this.uid = cred.user.uid;
    return this.uid;
  }

  async createRoom({ mode, theme, difficulte, hostName, secretWord }) {
    await this.ensureAuth();
    const code = genRoomCode();
    const roomRef = this.db.ref(`pendu_rooms/${code}`);

    let word;
    if (mode === "A") {
      word = window.PenduWordBank.pickWord({ theme, difficulte }).mot;
    } else {
      word = normalize(secretWord);
    }

    await roomRef.set({
      meta: {
        mode,
        theme: theme || "Tous",
        difficulte: difficulte || "Tous",
        status: "lobby",
        maxErrors: MAX_ERRORS,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        hostUid: this.uid
      },
      word: { value: word, length: word.length },
      guessedLetters: {},
      errors: 0,
      turnOrder: [],
      currentTurnIndex: 0,
      winnerUid: null,
      players: {
        [this.uid]: {
          name: hostName,
          isHost: true,
          order: 0,
          connected: true,
          joinedAt: firebase.database.ServerValue.TIMESTAMP
        }
      }
    });

    this._attachPresence(code, this.uid);
    return code;
  }

  async joinRoom(code, name) {
    await this.ensureAuth();
    code = code.toUpperCase().trim();
    const roomRef = this.db.ref(`pendu_rooms/${code}`);
    const snap = await roomRef.get();
    if (!snap.exists()) throw new Error("Salon introuvable. Vérifie le code.");
    const room = snap.val();
    if (room.meta.status !== "lobby") throw new Error("La partie a déjà commencé.");

    const playersSnap = await roomRef.child("players").get();
    const players = playersSnap.val() || {};
    const order = Object.keys(players).length;

    await roomRef.child(`players/${this.uid}`).set({
      name,
      isHost: false,
      order,
      connected: true,
      joinedAt: firebase.database.ServerValue.TIMESTAMP
    });

    this._attachPresence(code, this.uid);
    return code;
  }

  _attachPresence(code, uid) {
    const connRef = this.db.ref(`pendu_rooms/${code}/players/${uid}/connected`);
    connRef.onDisconnect().set(false);
    this.roomCode = code;
    this.roomRef = this.db.ref(`pendu_rooms/${code}`);
  }

  listen(callback) {
    if (!this.roomRef) return;
    this.unsub = this.roomRef.on("value", snap => callback(snap.val()));
  }

  stopListening() {
    if (this.roomRef && this.unsub) this.roomRef.off("value", this.unsub);
  }

  async startGame() {
    const playersSnap = await this.roomRef.child("players").get();
    const players = playersSnap.val() || {};
    const metaSnap = await this.roomRef.child("meta").get();
    const meta = metaSnap.val();

    let eligible = Object.entries(players);
    if (meta.mode === "B") {
      // l'hôte ne devine pas en mode "mot secret"
      eligible = eligible.filter(([uid, p]) => !p.isHost);
    }
    eligible.sort((a, b) => a[1].order - b[1].order);
    const turnOrder = eligible.map(([uid]) => uid);

    await this.roomRef.update({
      turnOrder,
      currentTurnIndex: 0,
      "meta/status": "jeu"
    });
  }

  // Un joueur propose une lettre (uniquement si c'est son tour)
  async submitLetter(letter) {
    letter = normalize(letter);
    const snap = await this.roomRef.get();
    const room = snap.val();
    if (room.meta.status !== "jeu") return;

    const activeUid = room.turnOrder[room.currentTurnIndex];
    if (activeUid !== this.uid) throw new Error("Ce n'est pas ton tour.");
    if (room.guessedLetters && room.guessedLetters[letter]) return;

    const word = room.word.value;
    const correct = word.includes(letter);
    const updates = {};
    updates[`guessedLetters/${letter}`] = correct ? "correct" : "wrong";

    let errors = room.errors;
    if (!correct) errors += 1;

    const guessed = { ...(room.guessedLetters || {}), [letter]: true };
    const isComplete = word.split("").every(l => guessed[l]);

    let status = room.meta.status;
    let winnerUid = room.winnerUid;

    if (isComplete) {
      status = "fini";
      winnerUid = this.uid;
    } else if (errors >= room.meta.maxErrors) {
      status = "fini";
      winnerUid = room.meta.mode === "B" ? room.meta.hostUid : null; // le pendu / l'hôte gagne
    } else {
      updates.currentTurnIndex = (room.currentTurnIndex + 1) % room.turnOrder.length;
    }

    updates.errors = errors;
    updates["meta/status"] = status;
    updates.winnerUid = winnerUid;

    await this.roomRef.update(updates);
    await this.roomRef.child("log").push({
      type: "lettre", uid: this.uid, value: letter, correct,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
  }

  // N'importe quel joueur (même hors tour) peut tenter le mot complet
  async submitWordGuess(attempt) {
    const snap = await this.roomRef.get();
    const room = snap.val();
    if (room.meta.status !== "jeu") return;
    if (room.meta.mode === "B" && this.uid === room.meta.hostUid) {
      throw new Error("L'hôte ne devine pas son propre mot.");
    }

    const correct = normalize(attempt) === room.word.value;
    const updates = {};

    if (correct) {
      const guessedLetters = {};
      room.word.value.split("").forEach(l => (guessedLetters[l] = true));
      updates.guessedLetters = guessedLetters;
      updates["meta/status"] = "fini";
      updates.winnerUid = this.uid;
    } else {
      const errors = room.errors + 1;
      updates.errors = errors;
      if (errors >= room.meta.maxErrors) {
        updates["meta/status"] = "fini";
        updates.winnerUid = room.meta.mode === "B" ? room.meta.hostUid : null;
      }
    }

    await this.roomRef.update(updates);
    await this.roomRef.child("log").push({
      type: "mot", uid: this.uid, value: normalize(attempt), correct,
      ts: firebase.database.ServerValue.TIMESTAMP
    });
  }

  async leaveRoom() {
    if (this.roomRef && this.uid) {
      await this.roomRef.child(`players/${this.uid}/connected`).set(false);
    }
    this.stopListening();
    this.roomRef = null;
    this.roomCode = null;
  }
}

window.PenduMultiplayer = PenduMultiplayer;
