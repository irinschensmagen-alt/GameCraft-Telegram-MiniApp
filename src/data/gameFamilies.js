export const gameFamilies = [
  { id: "quiz", name: "Quiz", skills: ["knowledge", "vocabulary", "grammar", "reading"], ages: ["7-10","11-14","15-17","18+"], core: "Вопрос → ответ → баллы" },
  { id: "memory", name: "Memory", skills: ["vocabulary", "matching", "visual_memory", "listening"], ages: ["3-6","7-10","11-14","15-17","18+"], core: "Закрытые карточки → открыть 2 → найти смысловую пару" },
  { id: "adventure", name: "Adventure", skills: ["vocabulary","reading","problem_solving","listening"], ages: ["7-10","11-14","15-17","18+"], core: "Локация → миссия → награда → следующая локация" },
  { id: "escape", name: "Escape", skills: ["logic","problem_solving","reading","knowledge"], ages: ["7-10","11-14","15-17","18+"], core: "Загадка → ключ/код → новый замок → выход" },
  { id: "detective", name: "Detective", skills: ["critical_thinking","reading","analysis","history","language"], ages: ["11-14","15-17","18+"], core: "Источник → улика → версия → доказательство → вывод" },
  { id: "rpg", name: "RPG", skills: ["knowledge","problem_solving","reading"], ages: ["11-14","15-17","18+"], core: "Герой → выбор → риск → XP/HP → развитие" },
  { id: "simulation", name: "Simulation", skills: ["decision_making","systems_thinking","knowledge"], ages: ["11-14","15-17","18+"], core: "Ситуация → решение → изменение ресурсов → последствия" },
  { id: "board", name: "Board Game", skills: ["knowledge","vocabulary","teamwork"], ages: ["7-10","11-14","15-17","18+"], core: "START → кубик → фишка → клетка → задание → FINISH" },
  { id: "card", name: "Card Game", skills: ["matching","classification","strategy","vocabulary"], ages: ["7-10","11-14","15-17","18+"], core: "Колода → рука → выбор карты → коллекция/розыгрыш" },
  { id: "bingo", name: "Bingo", skills: ["vocabulary","listening","recognition"], ages: ["3-6","7-10","11-14","15-17","18+"], core: "Подсказка → найти клетку → закрыть линию" },
  { id: "puzzle", name: "Puzzle", skills: ["structure","logic","reading"], ages: ["7-10","11-14","15-17","18+"], core: "Фрагменты → собрать осмысленное целое" },
  { id: "sorting", name: "Sorting", skills: ["classification","vocabulary","science"], ages: ["3-6","7-10","11-14","15-17","18+"], core: "Объекты → распределить по смысловым категориям" },
  { id: "timeline", name: "Timeline", skills: ["chronology","history","process"], ages: ["7-10","11-14","15-17","18+"], core: "События/этапы → восстановить хронологию" },
  { id: "map", name: "Map Game", skills: ["geography","history","spatial","reading"], ages: ["7-10","11-14","15-17","18+"], core: "Карта → объект/маршрут → учебная задача" },
  { id: "audio", name: "Audio Game", skills: ["listening","language"], ages: ["3-6","7-10","11-14","15-17","18+"], core: "Прослушать → извлечь информацию → выполнить действие" },
  { id: "speech", name: "Speech Game", skills: ["speaking","pronunciation","language"], ages: ["3-6","7-10","11-14","15-17","18+"], core: "Речевая миссия → высказывание → критерии → следующий уровень" },
  { id: "dragdrop", name: "Drag & Drop", skills: ["matching","classification","structure"], ages: ["3-6","7-10","11-14","15-17","18+"], core: "Элемент → целевая зона → проверка" },
  { id: "hidden", name: "Hidden Object", skills: ["visual_attention","vocabulary","reading"], ages: ["3-6","7-10","11-14","15-17"], core: "Подсказка → визуальный поиск → находка → смысловая обратная связь" },
  { id: "sequence", name: "Sequence", skills: ["process","logic","algorithm"], ages: ["7-10","11-14","15-17","18+"], core: "Этапы → собрать правильный алгоритм" },
  { id: "builder", name: "Builder", skills: ["construction","structure","science","grammar"], ages: ["7-10","11-14","15-17","18+"], core: "Детали → собрать модель/схему/структуру" },
  { id: "strategy", name: "Strategy", skills: ["strategy","decision_making","systems_thinking"], ages: ["11-14","15-17","18+"], core: "Ограниченные ресурсы → решение → компромисс → результат" },
  { id: "social", name: "Social / Emotion", skills: ["social_emotional","communication","decision_making"], ages: ["3-6","7-10","11-14","15-17","18+"], core: "Ситуация → выбор поведения → последствия → рефлексия" },
  { id: "lab", name: "Lab / Experiment", skills: ["science","critical_thinking","process"], ages: ["7-10","11-14","15-17","18+"], core: "Гипотеза → оборудование → опыт → наблюдение → вывод" }
];

export const familyById = Object.fromEntries(gameFamilies.map(f => [f.id, f]));
