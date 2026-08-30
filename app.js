(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) { tg.ready(); tg.expand(); }

  const p = new URLSearchParams(location.search);
  const family = p.get("family") || "memory";
  const topic = p.get("topic") || "Учебная тема";
  const level = p.get("level") || "—";
  const title = p.get("title") || `${topic}`;

  let pairs = [];
  try {
    const raw = p.get("pairs");
    if (raw) {
      pairs = JSON.parse(raw)
        .filter(x => Array.isArray(x) && x.length >= 2)
        .map(x => [String(x[0]).trim(), String(x[1]).trim()])
        .filter(x => x[0] && x[1])
        .slice(0, 24);
    }
  } catch {}

  const names = {
    quiz:"Quiz", memory:"Memory", adventure:"Adventure", escape:"Escape",
    detective:"Detective", rpg:"RPG", simulation:"Simulation", board:"Board Game",
    card:"Card Game", bingo:"Bingo", puzzle:"Puzzle", sorting:"Sorting",
    timeline:"Timeline", map:"Map Game", audio:"Audio Game", speech:"Speech Game",
    dragdrop:"Drag & Drop", hidden:"Hidden Object", sequence:"Sequence",
    builder:"Builder", strategy:"Strategy", social:"Social / Emotion", lab:"Lab / Experiment"
  };

  const $ = id => document.getElementById(id);
  const area = $("gameArea"), task = $("taskBox"), feedback = $("feedback");
  $("familyBadge").textContent = names[family] || family;
  $("gameTitle").textContent = `${title} — ${names[family] || family}`;
  $("level").textContent = level;

  let state = {moves:0,score:0,done:0,total:0};

  function esc(s){return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
  function shuffle(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
  function sampleOptions(correct, side=1, n=4){
    const pool=[...new Set(pairs.map(x=>x[side]))].filter(x=>x!==correct);
    return shuffle([correct,...shuffle(pool).slice(0,Math.max(0,n-1))]);
  }
  function setProgress(done,total){state.done=done;state.total=total;$("progress").textContent=`${done}/${total}`}
  function hud(){ $("moves").textContent=state.moves; $("score").textContent=state.score; setProgress(state.done,state.total) }
  function good(msg){feedback.className="feedback good";feedback.textContent=msg}
  function bad(msg){feedback.className="feedback bad";feedback.textContent=msg}
  function neutral(msg){feedback.className="feedback";feedback.textContent=msg}
  function finish(msg){
    $("finishText").textContent=msg;
    $("finish").classList.remove("hidden");
    tg?.HapticFeedback?.notificationOccurred("success");
  }
  function choiceGrid(options,onPick){
    area.innerHTML='<div class="grid two" id="choices"></div>';
    const box=$("choices");
    options.forEach(v=>{
      const b=document.createElement("button");
      b.className="choice"; b.textContent=v;
      b.onclick=()=>onPick(v,b);
      box.appendChild(b);
    });
  }
  function requirePairs(min=2){
    if(pairs.length>=min) return true;
    task.innerHTML="<strong>Нет учебного материала.</strong>";
    area.innerHTML="Добавьте пары через знак = и запустите игру из бота.";
    return false;
  }

  function quiz(){
    if(!requirePairs())return;
    const items=shuffle(pairs).slice(0,Math.min(8,pairs.length)); let i=0;
    state.total=items.length; $("subtitle").textContent="Выберите правильное соответствие.";
    const next=()=>{
      if(i>=items.length)return finish(`Quiz завершён. ${state.score} очков.`);
      const [q,a]=items[i]; task.innerHTML=`<div class="big-prompt">${esc(q)}</div>`;
      choiceGrid(sampleOptions(a),v=>{
        state.moves++;
        if(v===a){state.score+=100;state.done++;good(`Верно: ${q} = ${a}`);i++;hud();setTimeout(next,350)}
        else{state.score=Math.max(0,state.score-10);bad("Неверно. Попробуйте ещё раз.");hud()}
      });
    }; hud(); next();
  }

  function memory(){
    if(!requirePairs())return;
    const used=pairs.slice(0,Math.min(8,pairs.length)); const cards=shuffle(used.flatMap((x,id)=>[
      {id,text:x[0],side:0},{id,text:x[1],side:1}
    ])); let open=[],matched=new Set(),lock=false;
    state.total=used.length; $("subtitle").textContent="Открывайте по две карточки и находите пары.";
    function render(){
      area.innerHTML='<div class="grid" id="mem"></div>'; const box=$("mem");
      cards.forEach((c,idx)=>{
        const b=document.createElement("button"); const show=open.includes(idx)||matched.has(c.id);
        b.className="card"+(show?" open":"")+(matched.has(c.id)?" matched":"");
        b.textContent=show?c.text:"🎴"; b.disabled=lock||matched.has(c.id);
        b.onclick=()=>{
          if(open.includes(idx)||lock)return; open.push(idx);render();
          if(open.length===2){
            state.moves++;lock=true; const a=cards[open[0]],d=cards[open[1]];
            if(a.id===d.id&&a.side!==d.side){matched.add(a.id);state.score+=100;state.done=matched.size;open=[];lock=false;good("Пара найдена.");hud();render();if(matched.size===used.length)finish(`Memory завершена. ${state.score} очков.`)}
            else{state.score=Math.max(0,state.score-10);bad("Не пара.");hud();setTimeout(()=>{open=[];lock=false;render()},700)}
          }
        }; box.appendChild(b);
      }); hud();
    } task.textContent="Найдите все смысловые пары.";render();
  }

  function bingo(){
    if(!requirePairs())return;
    const used=shuffle(pairs).slice(0,Math.min(9,pairs.length)); let remaining=used.map((_,i)=>i),current=null,marked=new Set();
    state.total=used.length;$("subtitle").textContent="Получайте подсказку и находите слово на поле.";
    task.innerHTML='<button id="hint" class="primary">Новая подсказка</button> <strong id="hintText"></strong>';
    function render(){
      area.innerHTML='<div class="grid" id="bingo"></div>'; const box=$("bingo");
      used.forEach((x,i)=>{const b=document.createElement("button");b.className="cell"+(marked.has(i)?" marked":"");b.textContent=x[0];b.disabled=marked.has(i);b.onclick=()=>{
        if(current===null)return bad("Сначала получите подсказку.");
        state.moves++;
        if(i===current){marked.add(i);state.score+=100;state.done=marked.size;good(`${x[0]} = ${x[1]}`);current=null;hud();render();if(marked.size===used.length)finish(`Bingo! ${state.score} очков.`)}
        else{state.score=Math.max(0,state.score-10);bad("Не это слово.");hud()}
      };box.appendChild(b)});hud()
    }
    $("hint").onclick=()=>{if(!remaining.length)return;if(current!==null)return;const pos=Math.floor(Math.random()*remaining.length);current=remaining.splice(pos,1)[0];$("hintText").textContent=used[current][1];neutral("Найдите соответствующее слово.")};render();
  }

  function adventure(){
    if(!requirePairs())return; const used=pairs.slice(0,Math.min(6,pairs.length));let i=0;state.total=used.length;
    $("subtitle").textContent="Пройдите локации, выполняя учебные миссии.";
    const next=()=>{if(i>=used.length)return finish(`Приключение завершено. ${state.score} очков.`);
      const x=used[i];task.innerHTML=`<strong>Локация ${i+1}.</strong> Найдите значение: <b>${esc(x[0])}</b>`;
      choiceGrid(sampleOptions(x[1]),v=>{state.moves++;if(v===x[1]){state.score+=100;state.done++;good("Миссия выполнена. Путь открыт!");i++;hud();setTimeout(next,400)}else{bad("Путь закрыт. Попробуйте снова.");state.score=Math.max(0,state.score-10);hud()}})
    };hud();next();
  }

  function escapeGame(){
    if(!requirePairs())return;const used=pairs.slice(0,Math.min(5,pairs.length));let i=0;state.total=used.length;
    $("subtitle").textContent="Откройте все замки правильными ответами.";
    const next=()=>{if(i>=used.length)return finish(`Вы выбрались! ${state.score} очков.`);
      const x=used[i];task.innerHTML=`🔒 Замок ${i+1}: кодовое значение для <b>${esc(x[0])}</b>`;
      choiceGrid(sampleOptions(x[1]),v=>{state.moves++;if(v===x[1]){state.score+=120;state.done++;good("Замок открыт.");i++;hud();setTimeout(next,350)}else{state.score=Math.max(0,state.score-15);bad("Код не подходит.");hud()}})
    };hud();next();
  }

  function detective(){
    if(!requirePairs(3))return;

    const used=shuffle(pairs).slice(0,Math.min(8,pairs.length));
    const rounds=Math.min(6,Math.max(3,used.length));
    let i=0;
    state.total=rounds;

    $("subtitle").textContent="Расследуйте дело: среди показаний есть подменённая улика.";

    function buildCase(){
      const witnesses=shuffle(used).slice(0,Math.min(3,used.length));
      const falseIndex=Math.floor(Math.random()*witnesses.length);
      const original=witnesses[falseIndex];

      const wrongPool=used.map(x=>x[1]).filter(v=>v!==original[1]);
      const fakeValue=shuffle(wrongPool)[0];

      return {
        witnesses:witnesses.map((x,idx)=>({
          left:x[0],
          right:idx===falseIndex?fakeValue:x[1],
          actual:x[1],
          isFalse:idx===falseIndex
        })),
        falseIndex
      };
    }

    function next(){
      if(i>=rounds){
        return finish(`Дело раскрыто! Вы проверили ${rounds} серий показаний и набрали ${state.score} очков.`);
      }

      const c=buildCase();
      task.innerHTML=
        `<strong>🕵️ Досье №${i+1}</strong><br>`+
        `Три свидетеля дали показания. Одно из них подменено.<br>`+
        `<b>Найдите ложную улику.</b>`;

      area.innerHTML='<div class="grid" id="detectiveBoard"></div>';
      const box=$("detectiveBoard");

      c.witnesses.forEach((w,idx)=>{
        const b=document.createElement("button");
        b.className="choice";
        b.innerHTML=
          `<strong>Свидетель ${idx+1}</strong><br>`+
          `${esc(w.left)} = ${esc(w.right)}`;

        b.onclick=()=>{
          state.moves++;

          if(w.isFalse){
            state.score+=130;
            state.done++;
            good(`Подмена найдена! Правильно: ${w.left} = ${w.actual}`);
            i++;
            hud();
            tg?.HapticFeedback?.notificationOccurred("success");
            setTimeout(next,650);
          }else{
            state.score=Math.max(0,state.score-15);
            bad("Это показание подтверждается. Ищите противоречие в другом.");
            hud();
            tg?.HapticFeedback?.notificationOccurred("error");
          }
        };

        box.appendChild(b);
      });

      neutral("Сверяйте смысл каждой пары: преступник изменил только одно значение.");
      hud();
    }

    hud();
    next();
  }

  function rpg(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(7,pairs.length));let i=0,hp=3,xp=0;state.total=used.length;
    $("subtitle").textContent="Побеждайте противников правильными ответами.";
    const next=()=>{if(hp<=0)return finish(`Герой устал. XP: ${xp}. Нажмите «Играть ещё раз».`);if(i>=used.length)return finish(`Победа! XP: ${xp}, очки: ${state.score}.`);
      const x=used[i];task.innerHTML=`⚔️ HP: ${hp} | XP: ${xp}<br>Противник спрашивает: <b>${esc(x[0])}</b>`;
      choiceGrid(sampleOptions(x[1]),v=>{state.moves++;if(v===x[1]){xp+=20;state.score+=100;state.done++;good("Удар успешен! +20 XP");i++;hud();setTimeout(next,350)}else{hp--;state.score=Math.max(0,state.score-10);bad("Ошибка: −1 HP");hud();setTimeout(next,350)}})
    };hud();next();
  }

  function simulation(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(6,pairs.length));let i=0,resource=50;state.total=used.length;
    $("subtitle").textContent="Принимайте решения и сохраняйте ресурс.";
    const next=()=>{if(i>=used.length)return finish(`Симуляция завершена. Ресурс: ${resource}, очки: ${state.score}.`);
      const x=used[i];task.innerHTML=`📊 Ресурс: ${resource}. Ситуация ${i+1}: выберите корректное значение для <b>${esc(x[0])}</b>`;
      choiceGrid(sampleOptions(x[1]),v=>{state.moves++;if(v===x[1]){resource+=10;state.score+=100;state.done++;good("Решение улучшило систему: +10 ресурса.");i++;hud();setTimeout(next,350)}else{resource=Math.max(0,resource-15);bad("Решение привело к потере ресурса.");state.score=Math.max(0,state.score-10);hud()}})
    };hud();next();
  }

  function board(){
    if(!requirePairs())return;const used=pairs.slice(0,Math.min(8,pairs.length));let pos=0,current=null;state.total=8;
    $("subtitle").textContent="Бросайте кубик и закрепляйте ход учебным ответом.";
    task.innerHTML='<button id="roll" class="primary">🎲 Бросить кубик</button> <span id="dice"></span>';
    function render(){
      area.innerHTML='<div class="board-track" id="track"></div>';const box=$("track");
      for(let i=0;i<8;i++){const d=document.createElement("div");d.className="cell"+(i===pos?" active":"");d.textContent=i===0?"START":i===7?"FINISH":`Клетка ${i+1}`;box.appendChild(d)}
      hud()
    }
    $("roll").onclick=()=>{if(current)return;const die=1+Math.floor(Math.random()*3);$("dice").textContent=`Выпало: ${die}`;const x=used[state.moves%used.length];current={die,x};task.innerHTML=`<strong>🎲 ${die}</strong> — ответьте, чтобы сделать ход: <b>${esc(x[0])}</b><div id="boardChoices"></div>`;const opts=sampleOptions(x[1]);const holder=$("boardChoices");opts.forEach(v=>{const b=document.createElement("button");b.className="choice";b.textContent=v;b.onclick=()=>{state.moves++;if(v===x[1]){pos=Math.min(7,pos+die);state.score+=100;state.done=pos;good("Ход сохранён.");current=null;render();if(pos===7)finish(`Вы дошли до FINISH. ${state.score} очков.`);else setTimeout(()=>location.hash="",10)}else{bad("Ответ неверный — фишка остаётся.");state.score=Math.max(0,state.score-10);current=null;render()} };holder.appendChild(b)})};render();
  }

  function cardGame(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(7,pairs.length));let i=0,collected=[];state.total=used.length;
    $("subtitle").textContent="Соберите коллекцию правильных карточек.";
    const next=()=>{if(i>=used.length)return finish(`Коллекция собрана: ${collected.length} карт. ${state.score} очков.`);
      const x=used[i];task.innerHTML=`🃏 Найдите карту к значению: <b>${esc(x[1])}</b>`;
      choiceGrid(sampleOptions(x[0],0),v=>{state.moves++;if(v===x[0]){collected.push(v);state.score+=100;state.done++;good(`Карта «${v}» добавлена в коллекцию.`);i++;hud();setTimeout(next,350)}else{bad("Эта карта не подходит.");state.score=Math.max(0,state.score-10);hud()}})
    };hud();next();
  }

  function puzzle(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(6,pairs.length));let current=null,done=new Set();state.total=used.length;
    $("subtitle").textContent="Соединяйте фрагменты в правильные смысловые пары.";
    task.textContent="Сначала выберите левый фрагмент, затем соответствующий правый.";
    function render(){
      area.innerHTML='<div class="drop-layout"><div id="left" class="drop-zone"></div><div id="right" class="drop-zone"></div></div>';
      used.forEach((x,i)=>{if(done.has(i))return;const a=document.createElement("button");a.className="tile";a.textContent=x[0];a.onclick=()=>{current=i;neutral(`Выбран фрагмент: ${x[0]}`)};$("left").appendChild(a)});
      shuffle(used.map((x,i)=>({i,text:x[1]}))).forEach(o=>{if(done.has(o.i))return;const b=document.createElement("button");b.className="tile";b.textContent=o.text;b.onclick=()=>{if(current===null)return bad("Сначала выберите левый фрагмент.");state.moves++;if(current===o.i){done.add(o.i);state.score+=100;state.done=done.size;current=null;good("Фрагменты соединены.");render();if(done.size===used.length)finish(`Пазл собран. ${state.score} очков.`)}else{state.score=Math.max(0,state.score-10);bad("Фрагменты не подходят.");current=null;hud()}};$("right").appendChild(b)});hud()
    }render();
  }

  function sorting(){
    if(!requirePairs())return;const items=shuffle(pairs.flatMap((x,i)=>[{i,side:0,text:x[0]},{i,side:1,text:x[1]}])).slice(0,Math.min(12,pairs.length*2));let idx=0;state.total=items.length;
    $("subtitle").textContent="Распределите элементы: термин или значение.";
    const next=()=>{if(idx>=items.length)return finish(`Сортировка завершена. ${state.score} очков.`);
      const it=items[idx];task.innerHTML=`Куда относится: <b>${esc(it.text)}</b>?`;
      choiceGrid(["Термин","Значение"],v=>{state.moves++;const ok=(v==="Термин"&&it.side===0)||(v==="Значение"&&it.side===1);if(ok){state.score+=60;state.done++;good("Верная категория.");idx++;hud();setTimeout(next,250)}else{bad("Не эта категория.");state.score=Math.max(0,state.score-5);hud()}})
    };hud();next();
  }

  function timeline(){
    if(!requirePairs(3))return;const used=pairs.slice(0,Math.min(7,pairs.length));const shuffled=shuffle(used.map((x,i)=>({i,text:x[0]})));let expected=0;state.total=used.length;
    $("subtitle").textContent="Восстановите порядок элементов так, как вы задали их в сообщении.";
    task.textContent="Нажимайте элементы в исходной последовательности.";
    area.innerHTML='<div class="grid" id="timeline"></div>';const box=$("timeline");
    shuffled.forEach(o=>{const b=document.createElement("button");b.className="tile";b.textContent=o.text;b.onclick=()=>{state.moves++;if(o.i===expected){b.disabled=true;b.classList.add("selected");state.score+=80;state.done++;expected++;good("Позиция верная.");hud();if(expected===used.length)finish(`Последовательность восстановлена. ${state.score} очков.`)}else{bad("Сейчас должен идти другой элемент.");state.score=Math.max(0,state.score-5);hud()}};box.appendChild(b)});hud();
  }

  function mapGame(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(8,pairs.length));let i=0;state.total=used.length;
    $("subtitle").textContent="Находите нужные точки по смысловым подсказкам.";
    function next(){if(i>=used.length)return finish(`Маршрут пройден. ${state.score} очков.`);const target=used[i];task.innerHTML=`🗺️ Найдите точку: <b>${esc(target[1])}</b>`;area.innerHTML='<div class="grid" id="mapgrid"></div>';shuffle(used).forEach(x=>{const b=document.createElement("button");b.className="zone";b.textContent=`📍 ${x[0]}`;b.onclick=()=>{state.moves++;if(x===target){state.score+=100;state.done++;good("Точка найдена.");i++;hud();setTimeout(next,300)}else{bad("Это другая точка.");state.score=Math.max(0,state.score-10);hud()}};$("mapgrid").appendChild(b)});hud()}next();
  }

  function audioGame(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(7,pairs.length));let i=0;state.total=used.length;
    $("subtitle").textContent="Прослушайте слово и выберите значение.";
    function speak(text){if("speechSynthesis" in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);speechSynthesis.speak(u)}}
    const next=()=>{if(i>=used.length)return finish(`Аудиоигра завершена. ${state.score} очков.`);const x=used[i];task.innerHTML='<button id="listen" class="primary">🔊 Прослушать</button>';$("listen").onclick=()=>speak(x[0]);choiceGrid(sampleOptions(x[1]),v=>{state.moves++;if(v===x[1]){state.score+=100;state.done++;good("Верно.");i++;hud();setTimeout(next,350)}else{bad("Неверно. Прослушайте ещё раз.");state.score=Math.max(0,state.score-10);hud()}})};hud();next();
  }

  function speechGame(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(6,pairs.length));let i=0;state.total=used.length;
    $("subtitle").textContent="Произнесите или введите нужное слово.";
    const next=()=>{if(i>=used.length)return finish(`Речевая игра завершена. ${state.score} очков.`);const x=used[i];task.innerHTML=`🎤 Скажите/введите по изучаемому языку: <b>${esc(x[1])}</b>`;area.innerHTML='<div class="row"><input id="speechInput" style="flex:1;padding:14px;border-radius:12px;border:2px solid #cfc2ff;font-size:18px"><button id="mic" class="primary">🎤</button><button id="checkSpeech" class="primary">Проверить</button></div>';
      const input=$("speechInput");const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(SR){$("mic").onclick=()=>{const r=new SR();r.lang=p.get("lang")==="de"?"de-DE":p.get("lang")==="en"?"en-US":"ru-RU";r.onresult=e=>{input.value=e.results[0][0].transcript};r.start()}}else{$("mic").disabled=true;$("mic").title="Распознавание речи недоступно в этом браузере"}
      $("checkSpeech").onclick=()=>{state.moves++;const norm=s=>s.trim().toLowerCase().replace(/[.!?]+$/g,"");if(norm(input.value)===norm(x[0])){state.score+=120;state.done++;good("Произнесено/введено верно.");i++;hud();setTimeout(next,350)}else{bad(`Ожидается: ${x[0]}`);state.score=Math.max(0,state.score-5);hud()}}
    };hud();next();
  }

  function dragdrop(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(6,pairs.length));let done=new Set();state.total=used.length;
    $("subtitle").textContent="Перетащите термин к его значению.";
    task.textContent="Перетаскивайте карточки слева в соответствующие зоны справа.";
    function render(){
      area.innerHTML='<div class="drop-layout"><div id="dragSrc" class="drop-zone"></div><div id="dragDst" class="drop-zone"></div></div>';
      used.forEach((x,i)=>{if(done.has(i))return;const d=document.createElement("div");d.className="drag-item";d.draggable=true;d.textContent=x[0];d.dataset.id=i;d.ondragstart=e=>e.dataTransfer.setData("text/plain",i);$("dragSrc").appendChild(d)});
      shuffle(used.map((x,i)=>({i,text:x[1]}))).forEach(o=>{if(done.has(o.i))return;const z=document.createElement("div");z.className="zone";z.textContent=o.text;z.ondragover=e=>e.preventDefault();z.ondrop=e=>{e.preventDefault();const id=Number(e.dataTransfer.getData("text/plain"));state.moves++;if(id===o.i){done.add(id);state.score+=100;state.done=done.size;good("Совпадение верное.");render();if(done.size===used.length)finish(`Drag & Drop завершён. ${state.score} очков.`)}else{bad("Не подходит.");state.score=Math.max(0,state.score-10);hud()}};$("dragDst").appendChild(z)});hud()
    }render();
  }

  function hidden(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(8,pairs.length));let i=0;state.total=used.length;
    $("subtitle").textContent="Ищите скрытое слово по подсказке.";
    function next(){if(i>=used.length)return finish(`Все объекты найдены. ${state.score} очков.`);const target=used[i];task.innerHTML=`🔎 Найдите: <b>${esc(target[1])}</b>`;area.innerHTML='<div class="hidden-field" id="hiddenField"></div>';shuffle(used).forEach(x=>{const b=document.createElement("button");b.className="hidden-item";b.textContent=x[0];b.style.opacity=(0.55+Math.random()*0.45).toFixed(2);b.onclick=()=>{state.moves++;if(x===target){state.score+=100;state.done++;good("Найдено.");i++;hud();setTimeout(next,250)}else{bad("Это не тот объект.");state.score=Math.max(0,state.score-5);hud()}};$("hiddenField").appendChild(b)});hud()}next();
  }

  function sequence(){
    if(!requirePairs(3))return;const used=pairs.slice(0,Math.min(7,pairs.length));let built=[];state.total=used.length;
    $("subtitle").textContent="Соберите последовательность в исходном порядке.";
    task.textContent="Выбирайте элементы по очереди.";
    area.innerHTML='<div class="grid" id="seqChoices"></div><div class="sequence-strip" id="seqBuilt"></div>';
    shuffle(used.map((x,i)=>({i,text:x[0]}))).forEach(o=>{const b=document.createElement("button");b.className="tile";b.textContent=o.text;b.onclick=()=>{state.moves++;if(o.i===built.length){built.push(o);b.disabled=true;b.classList.add("selected");$("seqBuilt").innerHTML=built.map(v=>`<span class="pill">${esc(v.text)}</span>`).join("");state.score+=80;state.done=built.length;good("Следующий шаг верный.");hud();if(built.length===used.length)finish(`Последовательность собрана. ${state.score} очков.`)}else{bad("Этот элемент пока не следующий.");state.score=Math.max(0,state.score-5);hud()}};$("seqChoices").appendChild(b)});hud();
  }

  function builder(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(6,pairs.length));let i=0;state.total=used.length;
    $("subtitle").textContent="Соберите правильную конструкцию из двух частей.";
    function next(){if(i>=used.length)return finish(`Конструктор завершён. ${state.score} очков.`);const x=used[i];task.innerHTML=`🧱 Постройте соответствие для: <b>${esc(x[0])}</b>`;area.innerHTML='<div class="row" id="parts"></div>';sampleOptions(x[1]).forEach(v=>{const b=document.createElement("button");b.className="builder-part";b.textContent=v;b.onclick=()=>{state.moves++;if(v===x[1]){state.score+=100;state.done++;good(`Готово: ${x[0]} = ${x[1]}`);i++;hud();setTimeout(next,300)}else{bad("Эта деталь не подходит.");state.score=Math.max(0,state.score-10);hud()}};$("parts").appendChild(b)});hud()}next();
  }

  function strategy(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(7,pairs.length));let i=0,energy=5;state.total=used.length;
    $("subtitle").textContent="Сохраняйте энергию: ошибки стоят ресурсов.";
    function next(){if(energy<=0)return finish(`Энергия закончилась. Очки: ${state.score}.`);if(i>=used.length)return finish(`Стратегия успешна. Осталось энергии: ${energy}. Очки: ${state.score}.`);const x=used[i];task.innerHTML=`⚡ Энергия: ${energy}. Выберите значение для <b>${esc(x[0])}</b>`;choiceGrid(sampleOptions(x[1]),v=>{state.moves++;if(v===x[1]){state.score+=120;state.done++;good("Ресурс сохранён.");i++;hud();setTimeout(next,300)}else{energy--;state.score=Math.max(0,state.score-15);bad("−1 энергия. Решайте осторожно.");hud();setTimeout(next,250)}})}hud();next();
  }

  function social(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(6,pairs.length));let i=0;state.total=used.length;
    $("subtitle").textContent="Выбирайте подходящую реплику/обозначение для ситуации.";
    function next(){if(i>=used.length)return finish(`Социальная игра завершена. ${state.score} очков.`);const x=used[i];task.innerHTML=`💬 Ситуация: нужно выразить/назвать «<b>${esc(x[1])}</b>». Что выбрать?`;choiceGrid(sampleOptions(x[0],0),v=>{state.moves++;if(v===x[0]){state.score+=100;state.done++;good("Подходящий выбор.");i++;hud();setTimeout(next,300)}else{bad("В этой ситуации лучше другой вариант.");state.score=Math.max(0,state.score-5);hud()}})}hud();next();
  }

  function lab(){
    if(!requirePairs())return;const used=shuffle(pairs).slice(0,Math.min(6,pairs.length));let i=0;state.total=used.length;
    $("subtitle").textContent="Проходите этапы мини-эксперимента.";
    function next(){if(i>=used.length)return finish(`Эксперимент завершён. ${state.score} очков.`);const x=used[i];task.innerHTML=`🧪 Наблюдение: <b>${esc(x[1])}</b>. Какой термин/объект это подтверждает?`;choiceGrid(sampleOptions(x[0],0),v=>{state.moves++;if(v===x[0]){state.score+=110;state.done++;good("Гипотеза подтверждена.");i++;hud();setTimeout(next,300)}else{bad("Наблюдение не подтверждает этот вариант.");state.score=Math.max(0,state.score-10);hud()}})}hud();next();
  }

  const renderers = {
    quiz, memory, adventure, escape:escapeGame, detective, rpg, simulation, board,
    card:cardGame, bingo, puzzle, sorting, timeline, map:mapGame, audio:audioGame,
    speech:speechGame, dragdrop, hidden, sequence, builder, strategy, social, lab
  };

  $("restart").onclick=()=>location.reload();
  $("playAgain").onclick=()=>location.reload();
  $("close").onclick=()=>tg?.close();

  if(!renderers[family]){
    task.textContent="Эта механика не найдена.";
    area.textContent=family;
  }else{
    renderers[family]();
  }
})();
