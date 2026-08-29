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
    quiz: ["quiz", "викторин", "тест"],
    memory: ["memory", "мемори", "пары"],
    adventure: ["приключ", "adventure"],
    escape: ["escape", "квест-комнат", "эскейп", "побег"],
    detective: ["детектив", "detective"],
    rpg: ["rpg", "рпг", "ролевая"],
    simulation: ["симуляц", "simulation"],
    board: ["настольн", "board game", "поле"],
    card: ["card game", "карточная", "карточн"],
    bingo: ["бинго", "bingo"],
    puzzle: ["puzzle", "пазл", "головолом"],
    sorting: ["сортиров", "sorting", "классификац"],
    timeline: ["timeline", "хронолог", "лента времени"],
    map: ["map game", "карта", "географ"],
    audio: ["аудио", "аудирован", "hörverstehen", "listening"],
    speech: ["говорен", "sprechen", "speech", "произнош"],
    dragdrop: ["drag", "drop", "перетаскив"],
    hidden: ["hidden object", "скрыт", "найди предмет"],
    sequence: ["sequence", "последователь", "алгоритм"],
    builder: ["builder", "конструктор", "собери"],
    strategy: ["стратег", "strategy"],
    social: ["social", "emotion", "эмоци", "социаль"],
    lab: ["лаборатор", "эксперимент", "lab"]
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
