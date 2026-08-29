import { Markup } from "telegraf";
import { analyzePrompt } from "../engines/promptAnalyzer.js";
import { recommendFamilies } from "../engines/recommendationEngine.js";
import { createGameDNA } from "../engines/gameDNA.js";
import { buildSampleTasks } from "../engines/taskEngine.js";
import { setProfile, setProject, getSession } from "../services/projectStore.js";

function profileSummary(p) {
  return [
    "Поняла задачу:",
    `• ${p.subject || "предмет не определён"}`,
    `• возраст: ${p.ageGroup || "не определён"}`,
    `• уровень: ${p.level || "не указан"}`,
    `• тема: ${p.topic || "не определена"}`,
    `• навыки: ${p.skills.length ? p.skills.join(", ") : "не определены"}`,
    `• время: ${p.duration ? p.duration + " мин." : "не указано"}`
  ].join("\n");
}

function makeMiniAppUrl(dna) {
  const base =
    process.env.MINI_APP_URL ||
    "https://irinschensmagen-alt.github.io/GameCraft-Telegram-MiniApp/";

  if (!/^https:\/\//i.test(base)) return null;

  const url = new URL(base);
  url.searchParams.set("family", dna.family);
  url.searchParams.set("topic", dna.topic || "");
  url.searchParams.set("level", dna.level || "");
  url.searchParams.set("lang", dna.gameLanguage || "ru");
  url.searchParams.set("title", dna.title || "");
  return url.toString();
}

export function registerMessageHandler(bot) {
  bot.on("text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;

    const userId = ctx.from.id;
    const text = ctx.message.text;
    const profile = analyzePrompt(text);
    setProfile(userId, profile);

    const recs = recommendFamilies(profile, 4);
    const recText = recs
      .map((r, i) => `${i + 1}. ${r.family.name} — ${r.score}%`)
      .join("\n");

    await ctx.reply(
      `${profileSummary(profile)}\n\nПодходящие механики:\n${recText}\n\nВыберите игру:`
    );

    const buttons = recs.map(r => [
      Markup.button.callback(r.family.name, `choose:${r.family.id}`)
    ]);

    await ctx.reply("Механика:", Markup.inlineKeyboard(buttons));
  });

  bot.action(/^choose:(.+)$/, async (ctx) => {
    const userId = ctx.from.id;
    const familyId = ctx.match[1];
    const s = getSession(userId);

    if (!s.profile) {
      await ctx.answerCbQuery();
      return ctx.reply("Сначала опишите учебную задачу.");
    }

    const chosen = recommendFamilies(s.profile, 23)
      .find(r => r.family.id === familyId);

    if (!chosen) {
      await ctx.answerCbQuery();
      return ctx.reply("Не удалось определить механику.");
    }

    const dna = createGameDNA(s.profile, chosen);
    dna.tasks = buildSampleTasks(s.profile, familyId);
    setProject(userId, dna);

    await ctx.answerCbQuery("Выбрано");

    const miniUrl = makeMiniAppUrl(dna);

    if (!miniUrl) {
      return ctx.reply("Не настроен адрес Mini App.");
    }

    if (familyId !== "memory") {
      return ctx.reply(
        `Вы выбрали ${chosen.family.name}. Полноценная игровая версия этой механики ещё не подключена. Для готовой демонстрации сейчас выберите Memory.`
      );
    }

    await ctx.reply(
      `🎮 ${dna.title}\n` +
      `Уровень: ${dna.level}\n` +
      `Цель: закрепить лексику по теме «${dna.topic}».\n\n` +
      `Игра готова. Нажмите кнопку:`,
      Markup.inlineKeyboard([
        [Markup.button.webApp("▶ Играть", miniUrl)]
      ])
    );
  });
}
