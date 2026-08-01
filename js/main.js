// ============================================================
// LE PENDU — Contrôleur principal (routing + UI solo + UI multi)
// ============================================================

const AZERTY_ROWS = ["AZERTYUIOP", "QSDFGHJKLM", "WXCVBN"];

function goto(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.querySelectorAll("[data-goto]").forEach(el => {
  el.addEventListener("click", () => goto(el.dataset.goto));
});

function fillThemeSelect(select) {
  select.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "Tous"; optAll.textContent = "Tous les thèmes";
  select.appendChild(optAll);
  window.PenduWordBank.THEMES.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    select.appendChild(opt);
  });
}
fillThemeSelect(document.getElementById("solo-theme"));
fillThemeSelect(document.getElementById("create-theme"));

function buildKeyboard(container, onPress) {
  container.innerHTML = "";
  AZERTY_ROWS.forEach(row => {
    row.split("").forEach(letter => {
      const btn = document.createElement("button");
      btn.className = "key";
      btn.textContent = letter;
      btn.dataset.letter = letter;
      btn.addEventListener("click", () => onPress(letter));
      container.appendChild(btn);
    });
  });
}

function setKeyState(container, letter, state) {
  const btn = container.querySelector(`[data-letter="${letter}"]`);
  if (!btn) return;
  btn.classList.remove("correct", "wrong");
  if (state === "correct") btn.classList.add("correct");
  if (state === "wrong") btn.classList.add("wrong");
  btn.disabled = true;
}

// ================= SOLO =================
let soloEngine = null;

document.getElementById("solo-start-btn").addEventListener("click", () => {
  const theme = document.getElementById("solo-theme").value;
  const difficulte = document.getElementById("solo-difficulte").value;
  const picked = window.PenduWordBank.pickWord({ theme, difficulte });
  soloEngine = new PenduEngine(picked.mot);
  soloEngine.theme = picked.theme;

  document.getElementById("solo-theme-label").textContent = "Thème : " + picked.theme;
  document.getElementById("solo-replay-btn").style.display = "none";
  document.getElementById("solo-word-guess-input").value = "";
  document.getElementById("solo-word-guess-input").disabled = false;
  document.getElementById("solo-word-guess-btn").disabled = false;
  document.getElementById("solo-status-banner").innerHTML = "";

  buildKeyboard(document.getElementById("solo-keyboard"), soloLetterPress);
  renderSolo();
  goto("screen-solo-game");
});

function soloLetterPress(letter) {
  if (!soloEngine || soloEngine.status !== "playing") return;
  const res = soloEngine.guessLetter(letter);
  if (!res.ok) return;
  setKeyState(document.getElementById("solo-keyboard"), letter, res.correct ? "correct" : "wrong");
  renderSolo();
}

document.getElementById("solo-word-guess-btn").addEventListener("click", () => {
  const input = document.getElementById("solo-word-guess-input");
  if (!soloEngine || !input.value.trim()) return;
  soloEngine.guessWord(input.value.trim());
  input.value = "";
  renderSolo();
});

document.getElementById("solo-replay-btn").addEventListener("click", () => {
  goto("screen-solo-setup");
});

function renderSolo() {
  document.getElementById("solo-gallows").innerHTML = PenduSVG.renderGallows(soloEngine.errors);
  document.getElementById("solo-word-display").textContent =
    soloEngine.maskedWord.split("").join(" ");
  document.getElementById("solo-errors-label").textContent =
    `Erreurs : ${soloEngine.errors} / ${PenduUtils.MAX_ERRORS}`;

  const banner = document.getElementById("solo-status-banner");
  if (soloEngine.status === "won") {
    banner.innerHTML = `<div class="status-banner won">🎉 Gagné ! Le mot était ${soloEngine.word}</div>`;
    endSolo();
  } else if (soloEngine.status === "lost") {
    banner.innerHTML = `<div class="status-banner lost">💀 Perdu. Le mot était ${soloEngine.word}</div>`;
    endSolo();
  } else {
    banner.innerHTML = "";
  }
}

function endSolo() {
  document.getElementById("solo-replay-btn").style.display = "inline-block";
  document.getElementById("solo-word-guess-input").disabled = true;
  document.getElementById("solo-word-guess-btn").disabled = true;
  document.querySelectorAll("#solo-keyboard .key").forEach(b => (b.disabled = true));
}

// ================= MULTIJOUEUR =================
const mp = new PenduMultiplayer();

if (!window.PenduFirebase.configured) {
  document.getElementById("multi-not-configured").classList.remove("hidden");
}

document.getElementById("create-mode").addEventListener("change", e => {
  const isA = e.target.value === "A";
  document.getElementById("create-mode-a-options").classList.toggle("hidden", !isA);
  document.getElementById("create-mode-b-options").classList.toggle("hidden", isA);
});

document.getElementById("create-room-btn").addEventListener("click", async () => {
  const name = document.getElementById("create-name").value.trim() || "Hôte";
  const mode = document.getElementById("create-mode").value;
  const theme = document.getElementById("create-theme").value;
  const difficulte = document.getElementById("create-difficulte").value;
  const secretWord = document.getElementById("create-secret-word").value.trim();

  if (mode === "B" && !secretWord) {
    alert("Choisis un mot secret.");
    return;
  }
  try {
    const code = await mp.createRoom({ mode, theme, difficulte, hostName: name, secretWord });
    enterLobby(code);
  } catch (err) {
    alert("Erreur : " + err.message);
  }
});

document.getElementById("join-room-btn").addEventListener("click", async () => {
  const name = document.getElementById("join-name").value.trim() || "Joueur";
  const code = document.getElementById("join-code").value.trim();
  const errBox = document.getElementById("join-error");
  errBox.classList.add("hidden");
  try {
    await mp.joinRoom(code, name);
    enterLobby(code.toUpperCase());
  } catch (err) {
    errBox.textContent = err.message;
    errBox.classList.remove("hidden");
  }
});

let currentRoomState = null;

function enterLobby(code) {
  document.getElementById("lobby-code").textContent = code;
  goto("screen-multi-lobby");
  mp.listen(room => {
    currentRoomState = room;
    if (!room) return;
    if (room.meta.status === "lobby") {
      renderLobby(room);
    } else {
      goto("screen-multi-game");
      renderMultiGame(room);
    }
  });
}

function renderLobby(room) {
  document.getElementById("lobby-mode-label").textContent =
    room.meta.mode === "A"
      ? `Manche collective — thème : ${room.meta.theme}, difficulté : ${room.meta.difficulte}`
      : "Mot secret — un joueur devine sera désigné par l'hôte";

  const list = document.getElementById("lobby-players");
  list.innerHTML = "";
  const players = Object.entries(room.players || {}).sort((a, b) => a[1].order - b[1].order);
  players.forEach(([uid, p]) => {
    const li = document.createElement("li");
    li.textContent = p.name;
    if (p.isHost) {
      const tag = document.createElement("span");
      tag.className = "tag host"; tag.textContent = "Hôte";
      li.appendChild(tag);
    }
    list.appendChild(li);
  });

  const isHost = room.meta.hostUid === mp.uid;
  const enoughPlayers = room.meta.mode === "B"
    ? players.length >= 2
    : players.length >= 1;
  document.getElementById("lobby-start-btn").classList.toggle("hidden", !isHost);
  document.getElementById("lobby-start-btn").disabled = !enoughPlayers;
  document.getElementById("lobby-waiting").classList.toggle("hidden", isHost);
}

document.getElementById("lobby-start-btn").addEventListener("click", async () => {
  await mp.startGame();
});

document.getElementById("lobby-leave-btn").addEventListener("click", async () => {
  await mp.leaveRoom();
  goto("screen-multi-menu");
});

document.getElementById("multi-leave-btn").addEventListener("click", async () => {
  await mp.leaveRoom();
  goto("screen-multi-menu");
});

let multiKeyboardBuilt = false;

function renderMultiGame(room) {
  document.getElementById("multi-gallows").innerHTML = PenduSVG.renderGallows(room.errors || 0);

  const word = room.word.value;
  const guessed = room.guessedLetters || {};
  const masked = word.split("").map(l => (guessed[l] ? l : "_")).join(" ");
  document.getElementById("multi-word-display").textContent = masked;
  document.getElementById("multi-errors-label").textContent =
    `Erreurs : ${room.errors || 0} / ${room.meta.maxErrors}`;

  if (!multiKeyboardBuilt) {
    buildKeyboard(document.getElementById("multi-keyboard"), letter => {
      mp.submitLetter(letter).catch(e => alert(e.message));
    });
    multiKeyboardBuilt = true;
  }
  Object.entries(guessed).forEach(([letter, state]) => {
    if (state === "correct" || state === "wrong") {
      setKeyState(document.getElementById("multi-keyboard"), letter, state);
    }
  });

  const activeUid = room.turnOrder && room.turnOrder[room.currentTurnIndex];
  const players = room.players || {};
  const isMyTurn = activeUid === mp.uid;
  document.getElementById("multi-turn-label").textContent = activeUid
    ? `Tour de : ${players[activeUid]?.name || "?"}${isMyTurn ? " (toi)" : ""}`
    : "";

  document.querySelectorAll("#multi-keyboard .key").forEach(btn => {
    if (!btn.classList.contains("correct") && !btn.classList.contains("wrong")) {
      btn.disabled = !isMyTurn || room.meta.status !== "jeu";
    }
  });

  const canGuessWord = room.meta.status === "jeu" &&
    !(room.meta.mode === "B" && mp.uid === room.meta.hostUid);
  document.getElementById("multi-word-guess-btn").disabled = !canGuessWord;
  document.getElementById("multi-word-guess-input").disabled = !canGuessWord;

  const playersList = document.getElementById("multi-players");
  playersList.innerHTML = "";
  Object.entries(players)
    .sort((a, b) => a[1].order - b[1].order)
    .forEach(([uid, p]) => {
      const li = document.createElement("li");
      if (uid === activeUid) li.classList.add("current-turn");
      li.textContent = p.name;
      if (p.isHost) {
        const tag = document.createElement("span");
        tag.className = "tag host"; tag.textContent = "Hôte";
        li.appendChild(tag);
      }
      playersList.appendChild(li);
    });

  const banner = document.getElementById("multi-status-banner");
  if (room.meta.status === "fini") {
    const winner = room.winnerUid ? players[room.winnerUid]?.name : null;
    if (winner) {
      banner.innerHTML = `<div class="status-banner won">🎉 ${winner} a gagné ! Le mot était ${word}</div>`;
    } else {
      banner.innerHTML = `<div class="status-banner lost">💀 Perdu ! Le mot était ${word}</div>`;
    }
  } else {
    banner.innerHTML = "";
  }
}

document.getElementById("multi-word-guess-btn").addEventListener("click", () => {
  const input = document.getElementById("multi-word-guess-input");
  if (!input.value.trim()) return;
  mp.submitWordGuess(input.value.trim()).catch(e => alert(e.message));
  input.value = "";
});
