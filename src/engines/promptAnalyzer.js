import { specialistAliases } from "../data/specialists.js";
import { skillAliases } from "../data/skills.js";

const levels = ["Pre-A1","A1","A2","B1","B2","C1","C2"];

function findAlias(text, map) {
  const low = text.toLowerCase();
  for (const [key, aliases] of Object.entries(map)) {
    if (aliases.some(a => low.includes(a))) return key;
  }
  return null;
}

function detectAge(text) {
  const low = text.toLowerCase();
  const num = low.match(/(?:возраст|лет|год(?:а|ов)?|класс)\D{0,10}(\d{1,2})/i);
  if (num) {
    const n = Number(num[1]);
    if (low.includes("класс")) {
      if (n <= 4) return "7-10";
      if (n <= 8) return "11-14";
      return "15-17";
    }
    if (n <= 6) return "3-6";
    if (n <= 10) return "7-10";
    if (n <= 14) return "11-14";
    if (n <= 17) return "15-17";
    return "18+";
  }
  if (low.includes("дошколь")) return "3-6";
  if (low.includes("младш")) return "7-10";
  if (low.includes("подрост")) return "11-14";
  if (low.includes("взросл")) return "18+";
  return null;
}

function detectLevel(text) {
  const upper = text.toUpperCase();
  return levels.find(l => upper.includes(l.toUpperCase())) || null;
}

function detectDuration(text) {
  const m = text.match(/(\d{1,3})\s*(?:мин|минут|minutes|min)/i);
  return m ? Number(m[1]) : null;
}

function detectSubject(text) {
  const low = text.toLowerCase();
  if (/(немецк|deutsch)/.test(low)) return "Немецкий язык";
  if (/(английск|english)/.test(low)) return "Английский язык";
  if (/(русск|russisch|russian)/.test(low)) return "Русский язык";
  if (/(математ)/.test(low)) return "Математика";
  if (/(истори)/.test(low)) return "История";
  if (/(географ)/.test(low)) return "География";
  if (/(биолог)/.test(low)) return "Биология";
  if (/(физик)/.test(low)) return "Физика";
  if (/(хими)/.test(low)) return "Химия";
  return null;
}

function detectTopic(text) {
  const quoted = text.match(/[«"]([^»"]{2,80})[»"]/);
  if (quoted) return quoted[1];
  const topic = text.match(/(?:тема|thema|topic)\s*[:\-]?\s*([A-Za-zА-Яа-яЁёÄÖÜäöüß0-9 -]{2,60})/i);
  if (topic) return topic[1].split(/[,.]/)[0].trim();
  return null;
}

function detectGameLanguage(text, subject) {
  const low = text.toLowerCase();
  if (/(на немецк|deutsch)/.test(low) || subject === "Немецкий язык") return "de";
  if (/(на английск|english)/.test(low) || subject === "Английский язык") return "en";
  return "ru";
}

export function analyzePrompt(text) {
  const skills = Object.entries(skillAliases)
    .filter(([, aliases]) => aliases.some(a => text.toLowerCase().includes(a)))
    .map(([key]) => key);

  const subject = detectSubject(text);

  return {
    raw: text,
    specialist: findAlias(text, specialistAliases),
    subject,
    ageGroup: detectAge(text),
    level: detectLevel(text),
    topic: detectTopic(text),
    skills: [...new Set(skills)],
    duration: detectDuration(text),
    gameLanguage: detectGameLanguage(text, subject)
  };
}
