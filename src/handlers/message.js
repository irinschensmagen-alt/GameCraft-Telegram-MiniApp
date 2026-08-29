import { Markup } from "telegraf";
import { analyzePrompt } from "../engines/promptAnalyzer.js";
import { recommendFamilies } from "../engines/recommendationEngine.js";
import { createGameDNA } from "../engines/gameDNA.js";
import { buildSampleTasks } from "../engines/taskEngine.js";
import { setProfile, setProject, getSession } from "../services/projectStore.js";
import { analyzeWithAI, getAiUsageStatus } from "../services/aiService.js";
const FAMILY_IDS=new Set(["quiz","memory","adventure","escape","detective","rpg","simulation","board","card","bingo","puzzle","sorting","timeline","map","audio","speech","dragdrop","hidden","sequence","builder","strategy","social","lab"]);
function mergeAiProfile(localProfile,ai){ return {...localProfile,subject:ai.subject||localProfile.subject,ageGroup:ai.ageGroup||localProfile.ageGroup,level:ai.level||localProfile.level,topic:ai.topic||localProfile.topic,skills:ai.skills?.length?ai.skills:localProfile.skills,educationalGoal:ai.educationalGoal||"",aiNote:ai.aiNote||"",requestedFamily:FAMILY_IDS.has(ai.requestedFamily)?ai.requestedFamily:"",aiMode:ai.mode,aiUsed:Boolean(ai.usedAI)}; }
function profileSummary(p,usage){
  const mode=p.aiMode==="tutor_stub"?"🧪 Режим проверки Т: без расхода API-токенов":"🤖 AI API: OpenRouter";
  const lim=usage.tutor?"":`\nAI-запросы сегодня: ${usage.used}/${usage.limit}`;
  return [mode+lim,"","Поняла задачу:",`• ${p.subject||"предмет не определён"}`,`• возраст: ${p.ageGroup||"не определён"}`,`• уровень: ${p.level||"не указан"}`,`• тема: ${p.topic||"не определена"}`,`• материал: ${p.vocabularyPairs?.length?p.vocabularyPairs.length+" пар":"не указан"}`,p.educationalGoal?`• цель: ${p.educationalGoal}`:"",p.aiNote?`• AI: ${p.aiNote}`:""].filter(Boolean).join("\n");
}
function makeMiniAppUrl(dna){ const base=process.env.MINI_APP_URL||"https://irinschensmagen-alt.github.io/GameCraft-Telegram-MiniApp/"; if(!/^https:\/\//i.test(base))return null; const url=new URL(base); url.searchParams.set("family",dna.family);url.searchParams.set("topic",dna.topic||"");url.searchParams.set("level",dna.level||"");url.searchParams.set("lang",dna.gameLanguage||"ru");url.searchParams.set("title",dna.title||"");if(Array.isArray(dna.vocabularyPairs)&&dna.vocabularyPairs.length)url.searchParams.set("pairs",JSON.stringify(dna.vocabularyPairs));return url.toString(); }
export function registerMessageHandler(bot){
  bot.on("text",async ctx=>{
    if(ctx.message.text.startsWith("/"))return;
    const userId=ctx.from.id,text=ctx.message.text,localProfile=analyzePrompt(text); let ai;
    try{await ctx.sendChatAction("typing");ai=await analyzeWithAI({userId,text,localProfile});}
    catch(error){if(error?.code==="AI_DAILY_LIMIT"||error?.message==="AI_DAILY_LIMIT"){const u=getAiUsageStatus(userId);return ctx.reply(`Лимит бесплатных AI-запросов на сегодня исчерпан (${u.limit}/${u.limit}).\nПопробуйте снова завтра.`);} console.error("AI error:",error?.message||error);return ctx.reply("Не удалось получить ответ AI API. Проверьте подключение OpenRouter и попробуйте ещё раз.");}
    const profile=mergeAiProfile(localProfile,ai);setProfile(userId,profile);let recs=recommendFamilies(profile,6);
    if(profile.requestedFamily){const all=recommendFamilies(profile,23),requested=all.find(r=>r.family.id===profile.requestedFamily);if(requested)recs=[requested,...recs.filter(r=>r.family.id!==requested.family.id)].slice(0,6);}
    const usage=getAiUsageStatus(userId),recText=recs.map((r,i)=>`${i+1}. ${r.family.name} — ${r.score}%`).join("\n");
    await ctx.reply(`${profileSummary(profile,usage)}\n\nПодходящие механики:\n${recText}`);await ctx.reply("Выберите игру:",Markup.inlineKeyboard(recs.map(r=>[Markup.button.callback(r.family.name,`choose:${r.family.id}`)])));
  });
  bot.action(/^choose:(.+)$/,async ctx=>{const userId=ctx.from.id,familyId=ctx.match[1],s=getSession(userId);if(!s.profile){await ctx.answerCbQuery();return ctx.reply("Сначала опишите учебную задачу.");}const chosen=recommendFamilies(s.profile,23).find(r=>r.family.id===familyId);if(!chosen){await ctx.answerCbQuery();return ctx.reply("Не удалось определить механику.");}const dna=createGameDNA(s.profile,chosen);dna.tasks=buildSampleTasks(s.profile,familyId);dna.educationalGoal=s.profile.educationalGoal||dna.educationalGoal;dna.aiUsed=s.profile.aiUsed;dna.aiMode=s.profile.aiMode;setProject(userId,dna);await ctx.answerCbQuery("Выбрано");if(!dna.vocabularyPairs||dna.vocabularyPairs.length<2)return ctx.reply("Добавьте минимум 2 пары через знак =.\n\nПример:\ndie Sonne = солнце, der Regen = дождь, der Schnee = снег, der Wind = ветер.\nСделай Bingo.");const miniUrl=makeMiniAppUrl(dna);if(!miniUrl)return ctx.reply("Не настроен адрес Mini App.");await ctx.reply(`🎮 ${dna.title}\nМеханика: ${chosen.family.name}\nМатериал: ${dna.vocabularyPairs.length} пар.\n${dna.educationalGoal?`Цель: ${dna.educationalGoal}\n`:""}\nНажмите кнопку:`,Markup.inlineKeyboard([[Markup.button.webApp("▶ Играть",miniUrl)]]));});
}
