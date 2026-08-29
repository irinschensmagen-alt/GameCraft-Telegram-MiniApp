import { evaluateTask } from "./didacticEngine.js";

export function buildSampleTasks(profile, familyId) {
  const topic = profile.topic || "тема занятия";
  const skill = profile.skills?.[0] || "knowledge";

  const templates = {
    sorting: [
      { instruction: `Распределите элементы по смысловым категориям в теме «${topic}».`, goal: "Классифицировать объекты по существенному признаку" }
    ],
    detective: [
      { instruction: `Изучите два источника по теме «${topic}» и определите, какой факт действительно подтверждает версию.`, goal: "Различать факт, предположение и доказательство" }
    ],
    audio: [
      { instruction: `Прослушайте фрагмент по теме «${topic}» и выберите только сведения, которые действительно прозвучали.`, goal: "Извлекать конкретную информацию из аудиотекста" }
    ],
    lab: [
      { instruction: `Выберите проверяемую гипотезу по теме «${topic}», затем только необходимое оборудование.`, goal: "Применять этапы научного метода" }
    ],
    board: [
      { instruction: `После хода по полю выполните предметное задание по теме «${topic}», чтобы сохранить позицию на клетке.`, goal: `Закреплять ${skill} через чередование учебного действия и игрового продвижения` }
    ]
  };

  const base = templates[familyId] || [
    { instruction: `Выполните содержательное задание по теме «${topic}» в механике выбранной игры.`, goal: `Отработать навык ${skill}` }
  ];

  return base.map((t, index) => {
    const task = { ...t, id: index + 1, topic, mechanic: familyId };
    return { ...task, quality: evaluateTask(task) };
  });
}
