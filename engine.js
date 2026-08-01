// ============================================================
// LE PENDU — Moteur de jeu (logique pure, réutilisable solo/multi)
// ============================================================

const MAX_ERRORS = 6; // tete, corps, bras G, bras D, jambe G, jambe D

function normalize(str) {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

class PenduEngine {
  constructor(word) {
    this.word = normalize(word);
    this.guessedLetters = new Set();
    this.errors = 0;
    this.status = "playing"; // playing | won | lost
  }

  get maskedWord() {
    return this.word
      .split("")
      .map(l => (this.guessedLetters.has(l) ? l : "_"))
      .join("");
  }

  get isComplete() {
    return this.word.split("").every(l => this.guessedLetters.has(l));
  }

  guessLetter(letter) {
    letter = normalize(letter);
    if (this.status !== "playing") return { ok: false, reason: "termine" };
    if (letter.length !== 1 || !/[A-Z]/.test(letter)) return { ok: false, reason: "invalide" };
    if (this.guessedLetters.has(letter)) return { ok: false, reason: "deja_propose" };

    this.guessedLetters.add(letter);
    const correct = this.word.includes(letter);
    if (!correct) this.errors++;

    if (this.isComplete) this.status = "won";
    else if (this.errors >= MAX_ERRORS) this.status = "lost";

    return { ok: true, correct, errors: this.errors, status: this.status };
  }

  guessWord(attempt) {
    if (this.status !== "playing") return { ok: false, reason: "termine" };
    const correct = normalize(attempt) === this.word;
    if (correct) {
      this.word.split("").forEach(l => this.guessedLetters.add(l));
      this.status = "won";
    } else {
      this.errors++;
      if (this.errors >= MAX_ERRORS) this.status = "lost";
    }
    return { ok: true, correct, errors: this.errors, status: this.status };
  }
}

window.PenduEngine = PenduEngine;
window.PenduUtils = { normalize, MAX_ERRORS };
