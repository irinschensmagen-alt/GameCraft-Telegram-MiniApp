const TUTOR_TELEGRAM_ID = Number(process.env.TUTOR_TELEGRAM_ID || "328761045");
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || "3");
const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const dailyUsage = new Map();
const dayKey = () => new Date().toISOString().slice(0, 10);
const usageKey = userId => `${userId}:${dayKey()}`;
const getUsed = userId => dailyUsage.get(usageKey(userId)) || 0;
function incrementUsed(userId){ const k=usageKey(userId); dailyUsage.set(k,getUsed(userId)+1); }
function safeJson(text=""){
  try { return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"")); }
  catch { return null; }
}
function tutorStub(localProfile){
  return {
    mode:"tutor_stub", usedAI:false,
    subject:localProfile.subject||"", ageGroup:localProfile.ageGroup||"", level:localProfile.level||"",
    topic:localProfile.topic||"", skills:localProfile.skills||[], requestedFamily:"",
    educationalGoal: localProfile.topic ? `Закрепить учебный материал по теме «${localProfile.topic}» в игровой форме.` : "Закрепить учебный материал в игровой форме.",
    aiNote:"Тестовый режим для проверяющего: запрос обработан без расхода API-токенов."
  };
}
export function getAiUsageStatus(userId){
  if(Number(userId)===TUTOR_TELEGRAM_ID) return {tutor:true,used:0,limit:null,remaining:null};
  const used=getUsed(userId); return {tutor:false,used,limit:DAILY_LIMIT,remaining:Math.max(0,DAILY_LIMIT-used)};
}
export async function analyzeWithAI({userId,text,localProfile}){
  if(Number(userId)===TUTOR_TELEGRAM_ID) return tutorStub(localProfile);
  const key=process.env.OPENROUTER_API_KEY;
  if(!key) throw new Error("OPENROUTER_API_KEY_MISSING");
  if(getUsed(userId)>=DAILY_LIMIT){ const e=new Error("AI_DAILY_LIMIT"); e.code="AI_DAILY_LIMIT"; throw e; }
  const system=`Ты — AI-модуль педагогического конструктора GameCraft AI. Проанализируй запрос педагога. Не заменяй и не придумывай пользовательскую лексику. Верни ТОЛЬКО JSON без Markdown: {"subject":"","grade":"","ageGroup":"","level":"","topic":"","skills":[],"requestedFamily":"одно из quiz,memory,adventure,escape,detective,rpg,simulation,board,card,bingo,puzzle,sorting,timeline,map,audio,speech,dragdrop,hidden,sequence,builder,strategy,social,lab или пустая строка","educationalGoal":"одна короткая конкретная учебная цель","aiNote":"одно короткое предложение на русском о том, что понял ИИ"}. Не добавляй новых слов или переводов.`;
  const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{
    method:"POST", headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json","HTTP-Referer":"https://irinschensmagen-alt.github.io/GameCraft-Telegram-MiniApp/","X-Title":"GameCraft AI"},
    body:JSON.stringify({model:MODEL,messages:[{role:"system",content:system},{role:"user",content:text}],temperature:0.2,max_tokens:500})
  });
  if(!response.ok){ const body=await response.text(); throw new Error(`OPENROUTER_${response.status}: ${body.slice(0,300)}`); }
  const data=await response.json(); const parsed=safeJson(data?.choices?.[0]?.message?.content||"");
  if(!parsed) throw new Error("OPENROUTER_BAD_JSON");
  incrementUsed(userId);
  return {mode:"openrouter",usedAI:true,subject:parsed.subject||localProfile.subject||"",grade:parsed.grade||"",ageGroup:parsed.ageGroup||localProfile.ageGroup||"",level:parsed.level||localProfile.level||"",topic:parsed.topic||localProfile.topic||"",skills:Array.isArray(parsed.skills)?parsed.skills:(localProfile.skills||[]),requestedFamily:parsed.requestedFamily||"",educationalGoal:parsed.educationalGoal||"",aiNote:parsed.aiNote||"ИИ проанализировал учебную задачу."};
}
