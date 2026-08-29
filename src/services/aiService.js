const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || "3");
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

const dailyUsage = new Map();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function usageKey(userId) {
  return `${userId}:${dayKey()}`;
}

function getUsed(userId) {
  return dailyUsage.get(usageKey(userId)) || 0;
}

function incrementUsed(userId) {
  const key = usageKey(userId);
  const next = getUsed(userId) + 1;
  dailyUsage.set(key, next);
  return next;
}

function stripCodeFence(text = "") {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function safeJson(text = "") {
  const cleaned = stripCodeFence(text);

  // 1. Ideal case: the model returned pure JSON.
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 2. Free models sometimes wrap JSON in an explanation.
  // Extract the first complete-looking object.
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1));
    } catch {}
  }

  return null;
}

export function getAiUsageStatus(userId) {
  const used = getUsed(userId);
  return {
    used,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - used)
  };
}

export async function analyzeWithAI({ userId, text, localProfile }) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY_MISSING");
  }

  const used = getUsed(userId);
  if (used >= DAILY_LIMIT) {
    const err = new Error("AI_DAILY_LIMIT");
    err.code = "AI_DAILY_LIMIT";
    throw err;
  }

  const systemPrompt = `
Ты — AI-модуль педагогического конструктора GameCraft AI.
Проанализируй запрос педагога.
Не заменяй и не придумывай пользовательскую лексику:
слова и пары пользователь задаёт сам, а ты анализируешь педагогическую задачу.

Верни ТОЛЬКО JSON без Markdown:
{
  "subject": "предмет или язык",
  "grade": "класс, если указан",
  "ageGroup": "возрастная группа, если можно определить",
  "level": "Pre-A1/A1/A2/B1/B2/C1/C2 или иной указанный уровень",
  "topic": "тема",
  "skills": ["навык1", "навык2"],
  "requestedFamily": "одно из: quiz,memory,adventure,escape,detective,rpg,simulation,board,card,bingo,puzzle,sorting,timeline,map,audio,speech,dragdrop,hidden,sequence,builder,strategy,social,lab; пустая строка если пользователь не просил конкретную механику",
  "educationalGoal": "одна короткая конкретная учебная цель",
  "aiNote": "одно короткое предложение на русском о том, что понял ИИ"
}

Не добавляй новых слов или переводов.
`;

  async function callOpenRouter(messages, maxTokens = 500) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://irinschensmagen-alt.github.io/GameCraft-Telegram-MiniApp/",
        "X-Title": "GameCraft AI"
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.1,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OPENROUTER_${response.status}: ${body.slice(0, 300)}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  const originalMessages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: text }
  ];

  let content = await callOpenRouter(originalMessages);
  let parsed = safeJson(content);

  // Some free models occasionally add prose around JSON or break JSON syntax.
  // If that happens, make one automatic repair request.
  if (!parsed) {
    const repairPrompt = `
Исправь следующий ответ в валидный JSON.
Верни ТОЛЬКО один JSON-объект, без Markdown, комментариев и пояснений.
Сохрани смысл и только эти поля:
subject, grade, ageGroup, level, topic, skills, requestedFamily, educationalGoal, aiNote.

Ответ для исправления:
${content}
`;

    content = await callOpenRouter([
      { role: "system", content: "Ты исправляешь формат JSON. Отвечай только валидным JSON-объектом." },
      { role: "user", content: repairPrompt }
    ], 450);

    parsed = safeJson(content);
  }

  if (!parsed) {
    throw new Error("OPENROUTER_BAD_JSON_AFTER_RETRY");
  }

  incrementUsed(userId);

  return {
    mode: "openrouter",
    usedAI: true,
    subject: parsed.subject || localProfile.subject || "",
    grade: parsed.grade || "",
    ageGroup: parsed.ageGroup || localProfile.ageGroup || "",
    level: parsed.level || localProfile.level || "",
    topic: parsed.topic || localProfile.topic || "",
    skills: Array.isArray(parsed.skills) ? parsed.skills : (localProfile.skills || []),
    requestedFamily: parsed.requestedFamily || "",
    educationalGoal: parsed.educationalGoal || "",
    aiNote: parsed.aiNote || "ИИ проанализировал учебную задачу."
  };
}
