import { gameFamilies } from "../data/gameFamilies.js";
import { getSession, resetSession } from "../services/projectStore.js";

const USER_GUIDE =
`🎮 Как создать игру

1. Напишите тему и уровень.
2. Добавьте свои пары через знак =.
3. Укажите нужную механику или выберите её из предложенных.
4. Нажмите «▶ Играть».

Пример:
Немецкий A1, тема Kleidung.
die Jacke = куртка, der Rock = юбка, die Hose = брюки, das Kleid = платье, der Pullover = свитер, die Schuhe = обувь.
Сделай Memory.

Важно: бот использует именно ваш материал и не подставляет случайную лексику.`;

export function registerCommands(bot) {
  bot.start(async (ctx) => {
    await ctx.reply(
`Здравствуйте! Я GameCraft AI.

Помогу превратить ваш учебный материал в игру.

${USER_GUIDE}`
    );
  });

  bot.command("help", (ctx) => ctx.reply(USER_GUIDE));

  bot.command("mechanics", (ctx) => {
    ctx.reply(gameFamilies.map((f,i) => `${i+1}. ${f.name} — ${f.core}`).join("\n"));
  });

  bot.command("project", (ctx) => {
    const s = getSession(ctx.from.id);
    if (!s.currentProject) return ctx.reply("Текущий проект пока не создан.");
    ctx.reply(formatProject(s.currentProject));
  });

  bot.command("new", (ctx) => {
    resetSession(ctx.from.id);
    ctx.reply(
`Начинаем новую игру.

Напишите тему, уровень и свой материал.

Пример:
Немецкий A1, тема Kleidung.
die Jacke = куртка, der Rock = юбка, die Hose = брюки.
Сделай Memory.`
    );
  });

  bot.command("reset", (ctx) => {
    resetSession(ctx.from.id);
    ctx.reply("Сессия очищена. Для новой игры отправьте /new.");
  });
}

export function formatProject(project) {
  return [
    `🎮 ${project.title}`,
    `Механика: ${project.familyName}`,
    `Предмет: ${project.subject}`,
    `Тема: ${project.topic}`,
    `Возраст: ${project.ageGroup}`,
    `Уровень: ${project.level}`,
    `Навыки: ${project.skills.join(", ")}`,
    `Время: ${project.duration} мин.`
  ].join("\n");
}
