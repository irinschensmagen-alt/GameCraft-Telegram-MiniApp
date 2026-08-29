(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) { tg.ready(); tg.expand(); }

  const params = new URLSearchParams(location.search);
  const family = params.get("family") || "memory";
  const topic = params.get("topic") || "Учебная тема";
  const level = params.get("level") || "";
  const title = params.get("title") || `${topic} — Memory`;

  document.getElementById("familyBadge").textContent = family === "memory" ? "Memory" : family;
  document.getElementById("gameTitle").textContent = title;
  document.getElementById("level").textContent = level || "—";

  const memoryView = document.getElementById("memoryView");
  const unsupportedView = document.getElementById("unsupportedView");

  if (family !== "memory") {
    memoryView.classList.add("hidden");
    unsupportedView.classList.remove("hidden");
    document.getElementById("subtitle").textContent = "Игровой renderer этого семейства ещё не подключён.";
    document.getElementById("unsupportedClose").addEventListener("click", () => tg?.close());
    return;
  }

  let pairs = [];
  try {
    const raw = params.get("pairs");
    if (raw) {
      pairs = JSON.parse(raw)
        .filter(x => Array.isArray(x) && x.length >= 2)
        .map(x => [String(x[0]).trim(), String(x[1]).trim()])
        .filter(x => x[0] && x[1])
        .slice(0, 12);
    }
  } catch {}

  if (pairs.length < 2) {
    memoryView.classList.add("hidden");
    unsupportedView.classList.remove("hidden");
    document.querySelector("#unsupportedView h2").textContent = "Нет учебного материала";
    document.querySelector("#unsupportedView p").textContent =
      "Вернитесь в чат и укажите свои пары, например: die Jacke = куртка, der Rock = юбка.";
    document.querySelector("#unsupportedView .honest").textContent =
      "Случайная лексика не подставляется.";
    document.getElementById("unsupportedClose").addEventListener("click", () => tg?.close());
    return;
  }

  const total = pairs.length;
  document.getElementById("subtitle").textContent = `Соберите все ${total} пар из вашего материала.`;
  document.getElementById("pairs").parentElement.innerHTML = `<span id="pairs">0</span>/${total}`;

  const board = document.getElementById("board");
  const feedback = document.getElementById("feedback");
  const movesEl = document.getElementById("moves");
  const scoreEl = document.getElementById("score");
  const finish = document.getElementById("finish");
  const finishText = document.getElementById("finishText");
  let state;

  const shuffle = a => {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const esc = s => s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  function reset() {
    const cards = [];
    pairs.forEach((pair, id) => {
      cards.push({pairId:id,text:pair[0],side:"A"});
      cards.push({pairId:id,text:pair[1],side:"B"});
    });
    state = {cards:shuffle(cards),open:[],matched:new Set(),moves:0,score:0,lock:false};
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
      const open = state.open.includes(idx);
      const matched = state.matched.has(c.pairId);
      if (open) b.classList.add("flipped");
      if (matched) b.classList.add("matched");
      b.disabled = state.lock || matched;
      b.innerHTML = `<span class="back">🎴</span><span class="front">${esc(c.text)}</span>`;
      b.addEventListener("click", () => flip(idx));
      board.appendChild(b);
    });
    document.getElementById("pairs").textContent = state.matched.size;
    movesEl.textContent = state.moves;
    scoreEl.textContent = state.score;
  }

  function flip(idx) {
    if (state.lock || state.open.includes(idx)) return;
    state.open.push(idx);
    render();

    if (state.open.length < 2) {
      feedback.className = "feedback";
      feedback.textContent = "Теперь найдите пару.";
      return;
    }

    state.moves++;
    state.lock = true;
    const [ai, bi] = state.open;
    const a = state.cards[ai], b = state.cards[bi];
    const ok = a.pairId === b.pairId && a.side !== b.side;

    if (ok) {
      state.matched.add(a.pairId);
      state.score += 100;
      feedback.className = "feedback good";
      feedback.textContent = `Верно: ${pairs[a.pairId][0]} = ${pairs[a.pairId][1]}.`;
      state.open = [];
      state.lock = false;
      render();
      if (state.matched.size === total) {
        finishText.textContent = `Все ${total} пар найдены. ${state.score} очков, ${state.moves} ходов.`;
        finish.classList.remove("hidden");
        tg?.HapticFeedback?.notificationOccurred("success");
      }
    } else {
      state.score = Math.max(0, state.score - 10);
      feedback.className = "feedback bad";
      feedback.textContent = "Это не пара. Запомните позиции.";
      render();
      setTimeout(() => {
        state.open = [];
        state.lock = false;
        feedback.className = "feedback";
        feedback.textContent = "Попробуйте ещё раз.";
        render();
      }, 850);
    }
  }

  document.getElementById("restart").addEventListener("click", reset);
  document.getElementById("playAgain").addEventListener("click", reset);
  document.getElementById("close").addEventListener("click", () => tg?.close());
  reset();
})();
