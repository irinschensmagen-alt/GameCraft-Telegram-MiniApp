export function createGameDNA(profile, recommendation) {
  const family = recommendation.family;
  return {
    title: `${profile.topic || "Учебная тема"} — ${family.name}`,
    family: family.id,
    familyName: family.name,
    coreMechanic: family.core,
    subject: profile.subject || "Не определён",
    topic: profile.topic || "Не определена",
    ageGroup: profile.ageGroup || "Не определён",
    level: profile.level || "Не указан",
    skills: profile.skills?.length ? profile.skills : ["knowledge"],
    duration: profile.duration || 20,
    gameLanguage: profile.gameLanguage || "ru",
    vocabularyPairs: profile.vocabularyPairs || [],
    educationalGoal: `Отработать: ${(profile.skills?.length ? profile.skills : ["knowledge"]).join(", ")}`,
    progression: "5 содержательных игровых этапов",
    reward: "прогресс, открытие следующего этапа и содержательная обратная связь",
    failure: "ошибка не продвигает игрока автоматически; даётся подсказка или новая попытка"
  };
}
