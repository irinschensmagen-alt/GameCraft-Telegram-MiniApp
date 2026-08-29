import { gameFamilies } from "../data/gameFamilies.js";
import { getSession, resetSession } from "../services/projectStore.js";

export function registerCommands(bot) {
  bot.start(async (ctx) => {
    await ctx.reply(
`Здравствуйте! Я GameCraft AI.

Опишите обычными словами, какую учебную игру вы хотите создать.

Пример:
«Я учитель немецкого языка, 6 класс, A1, тема Essen, нужно закрепить лексику и аудирование за 20 минут. Не хочу обычный тест.»

Я выделю параметры, подберу подходящие механики и объясню выбор.`
    );
  });

  bot.command("help", (ctx) => ctx.reply(
`Команды:
/new — новая игра
/project — текущий проект
/mechanics — 23 игровые механики
/reset — очистить текущую сессию

Можно писать свободным текстом: «сделай сложнее», «замени на детектив», «добавь аудирование».`
  ));

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
    ctx.reply("Начинаем новый проект. Опишите задачу обычными словами.");
  });

  bot.command("reset", (ctx) => {
    resetSession(ctx.from.id);
    ctx.reply("Сессия очищена.");
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
    `Время: ${project.duration} мин.`,
    `Core loop: ${project.coreMechanic}`,
    `Учебная цель: ${project.educationalGoal}`
  ].join("\n");
}
