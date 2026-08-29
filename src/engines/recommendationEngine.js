import { gameFamilies } from "../data/gameFamilies.js";

function scoreFamily(family, profile) {
  let score = 40;
  const reasons = [];

  for (const skill of profile.skills || []) {
    if (family.skills.includes(skill)) {
      score += 14;
      reasons.push(`поддерживает навык «${skill}»`);
    }
  }

  if (profile.ageGroup && family.ages.includes(profile.ageGroup)) {
    score += 10;
    reasons.push(`подходит возрасту ${profile.ageGroup}`);
  }

  const low = (profile.raw || "").toLowerCase();

  const explicit = {
    detective: ["детектив", "detective"],
    escape: ["escape", "квест-комнат", "эскейп"],
    board: ["настольн", "board game"],
    bingo: ["бинго", "bingo"],
    memory: ["memory", "мемори"],
    adventure: ["приключ", "adventure"],
    simulation: ["симуляц", "simulation"],
    strategy: ["стратег", "strategy"],
    audio: ["аудио", "аудирован", "hörverstehen", "listening"],
    speech: ["говорен", "sprechen", "speech"],
    sorting: ["сортиров", "sorting"],
    timeline: ["timeline", "хронолог"],
    map: ["карта", "map game"],
    lab: ["лаборатор", "эксперимент"],
    quiz: ["quiz", "викторин"]
  };

  if ((explicit[family.id] || []).some(k => low.includes(k))) {
    score += 30;
    reasons.push("механика прямо указана пользователем");
  }

  if ((low.includes("не тест") || low.includes("не quiz")) && family.id === "quiz") {
    score -= 100;
  }

  return { family, score: Math.max(0, Math.min(99, score)), reasons };
}

export function recommendFamilies(profile, limit = 4) {
  return gameFamilies
    .map(f => scoreFamily(f, profile))
    .sort((a,b) => b.score - a.score)
    .slice(0, limit);
}
