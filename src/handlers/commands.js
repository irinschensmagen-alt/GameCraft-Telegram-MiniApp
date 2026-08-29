import { gameFamilies } from "../data/gameFamilies.js";
import { getSession, resetSession } from "../services/projectStore.js";

const USER_GUIDE =
`🎮 Как создать игру

Языки: русский, немецкий, английский.

1. Напишите язык/предмет, уровень и тему.
2. Сами добавьте нужные слова или другие учебные пары через знак =.
3. Напишите желаемую игру или выберите её из предложенных.
4. Нажмите «▶ Играть».

Пример:
Немецкий A1, тема Wetter.
die Sonne = солнце, der Regen = дождь, der Schnee = снег, der Wind = ветер.
Сделай Bingo.

Можно менять язык, тему, лексику и механику.
Бот использует именно ваш учебный материал и не подставляет случайные слова.\n\n🤖 При формировании ответа используется AI API OpenRouter.`;

export function registerCommands(bot) {
  bot.start((ctx) => ctx.reply(`Здравствуйте! Я GameCraft AI.\n\n${USER_GUIDE}`));
  bot.command("help", (ctx) => ctx.reply(USER_GUIDE));
  bot.command("mechanics", (ctx) =>
    ctx.reply(gameFamilies.map((f,i) => `${i+1}. ${f.name}`).join("\n"))
  );
  bot.command("project", (ctx) => {
    const s = getSession(ctx.from.id);
    if (!s.currentProject) return ctx.reply("Текущий проект пока не создан.");
    ctx.reply(formatProject(s.currentProject));
  });
  bot.command("new", (ctx) => {
    resetSession(ctx.from.id);
    ctx.reply("Начинаем новую игру.\n\n" + USER_GUIDE);
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
    `Уровень: ${project.level}`
  ].join("\n");
}
