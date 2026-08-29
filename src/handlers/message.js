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
    `• материал: ${p.vocabularyPairs?.length ? p.vocabularyPairs.length + " пар" : "не указан"}`
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

  if (Array.isArray(dna.vocabularyPairs) && dna.vocabularyPairs.length) {
    url.searchParams.set("pairs", JSON.stringify(dna.vocabularyPairs));
  }

  return url.toString();
}

export function registerMessageHandler(bot) {
  bot.on("text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;

    const userId = ctx.from.id;
    const profile = analyzePrompt(ctx.message.text);
    setProfile(userId, profile);

    const recs = recommendFamilies(profile, 6);
    const recText = recs.map((r, i) => `${i + 1}. ${r.family.name} — ${r.score}%`).join("\n");

    await ctx.reply(`${profileSummary(profile)}\n\nПодходящие механики:\n${recText}`);

    const buttons = recs.map(r => [
      Markup.button.callback(r.family.name, `choose:${r.family.id}`)
    ]);

    await ctx.reply("Выберите игру:", Markup.inlineKeyboard(buttons));
  });

  bot.action(/^choose:(.+)$/, async (ctx) => {
    const userId = ctx.from.id;
    const familyId = ctx.match[1];
    const s = getSession(userId);

    if (!s.profile) {
      await ctx.answerCbQuery();
      return ctx.reply("Сначала опишите учебную задачу.");
    }

    const chosen = recommendFamilies(s.profile, 23).find(r => r.family.id === familyId);
    if (!chosen) {
      await ctx.answerCbQuery();
      return ctx.reply("Не удалось определить механику.");
    }

    const dna = createGameDNA(s.profile, chosen);
    dna.tasks = buildSampleTasks(s.profile, familyId);
    setProject(userId, dna);
    await ctx.answerCbQuery("Выбрано");

    if (!dna.vocabularyPairs || dna.vocabularyPairs.length < 2) {
      return ctx.reply(
        "Добавьте минимум 2 пары через знак =.\n\n" +
        "Пример:\n" +
        "die Sonne = солнце, der Regen = дождь, der Schnee = снег, der Wind = ветер.\n" +
        "Сделай Bingo."
      );
    }

    const miniUrl = makeMiniAppUrl(dna);
    if (!miniUrl) return ctx.reply("Не настроен адрес Mini App.");

    await ctx.reply(
      `🎮 ${dna.title}\n` +
      `Механика: ${chosen.family.name}\n` +
      `Материал: ${dna.vocabularyPairs.length} пар.\n\n` +
      `Нажмите кнопку:`,
      Markup.inlineKeyboard([
        [Markup.button.webApp("▶ Играть", miniUrl)]
      ])
    );
  });
}
