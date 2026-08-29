
(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  const params = new URLSearchParams(location.search);
  const family = params.get("family") || "memory";
  const topic = params.get("topic") || "Essen";
  const level = params.get("level") || "A1";
  const title = params.get("title") || `${topic} — Memory`;

  document.getElementById("familyBadge").textContent = family === "memory" ? "Memory" : family;
  document.getElementById("gameTitle").textContent = title;
  document.getElementById("level").textContent = level;

  const memoryView = document.getElementById("memoryView");
  const unsupportedView = document.getElementById("unsupportedView");

  if (family !== "memory") {
    memoryView.classList.add("hidden");
    unsupportedView.classList.remove("hidden");
    document.getElementById("subtitle").textContent = "Связь Bot → Mini App работает; игровой renderer этого семейства ещё не подключён.";
    document.getElementById("unsupportedClose").addEventListener("click", () => tg?.close());
    return;
  }

  const pairs = [
    ["das Brot","хлеб"],
    ["der Käse","сыр"],
    ["die Milch","молоко"],
    ["der Apfel","яблоко"],
    ["das Wasser","вода"],
    ["die Banane","банан"]
  ];

  const board = document.getElementById("board");
  const feedback = document.getElementById("feedback");
  const pairsEl = document.getElementById("pairs");
  const movesEl = document.getElementById("moves");
  const scoreEl = document.getElementById("score");
  const finish = document.getElementById("finish");
  const finishText = document.getElementById("finishText");

  let state;

  function shuffle(a) {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function reset() {
    const cards = [];
    pairs.forEach((pair, pairId) => {
      cards.push({ id:`de-${pairId}`, pairId, text:pair[0], side:"DE" });
      cards.push({ id:`ru-${pairId}`, pairId, text:pair[1], side:"RU" });
    });
    state = { cards: shuffle(cards), open: [], matched: new Set(), moves:0, score:0, lock:false };
    finish.classList.add("hidden");
    feedback.className = "feedback";
    feedback.textContent = "Откройте первую карточку.";
    render();
  }

  function render() {
    board.innerHTML = "";
    state.cards.forEach((c, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "card";
      const isOpen = state.open.includes(idx);
      const isMatched = state.matched.has(c.pairId);
      if (isOpen) b.classList.add("flipped");
      if (isMatched) b.classList.add("matched");
      b.disabled = state.lock || isMatched;
      b.setAttribute("aria-label", isOpen || isMatched ? c.text : "Закрытая карточка");
      b.innerHTML = `<span class="back">🎴</span><span class="front">${c.text}</span>`;
      b.addEventListener("click", () => flip(idx));
      board.appendChild(b);
    });
    pairsEl.textContent = state.matched.size;
    movesEl.textContent = state.moves;
    scoreEl.textContent = state.score;
  }

  function flip(idx) {
    if (state.lock || state.open.includes(idx)) return;
    state.open.push(idx);
    render();

    if (state.open.length < 2) {
      feedback.className = "feedback";
      feedback.textContent = "Теперь найдите смысловую пару.";
      return;
    }

    state.moves += 1;
    state.lock = true;
    const [aIdx,bIdx] = state.open;
    const a = state.cards[aIdx], b = state.cards[bIdx];
    const match = a.pairId === b.pairId && a.side !== b.side;

    if (match) {
      state.matched.add(a.pairId);
      state.score += 100;
      feedback.className = "feedback good";
      feedback.textContent = `Верно: ${pairs[a.pairId][0]} = ${pairs[a.pairId][1]}.`;
      state.open = [];
      state.lock = false;
      render();
      if (state.matched.size === pairs.length) {
        finishText.textContent = `Результат: ${state.score} очков, ${state.moves} ходов. Вы закрепили 6 лексических соответствий по теме Essen.`;
        finish.classList.remove("hidden");
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
      }
    } else {
      state.score = Math.max(0, state.score - 10);
      feedback.className = "feedback bad";
      feedback.textContent = "Это не пара. Сравните значения и попробуйте запомнить позиции.";
      render();
      setTimeout(() => {
        state.open = [];
        state.lock = false;
        feedback.className = "feedback";
        feedback.textContent = "Откройте следующую карточку.";
        render();
      }, 900);
    }
  }

  document.getElementById("restart").addEventListener("click", reset);
  document.getElementById("playAgain").addEventListener("click", reset);
  document.getElementById("close").addEventListener("click", () => tg?.close());

  reset();
})();
