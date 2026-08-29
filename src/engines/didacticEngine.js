export function evaluateTask(task) {
  const text = `${task?.instruction || ""} ${task?.goal || ""}`.toLowerCase();

  let score = 0;
  const details = [];

  if ((task?.goal || "").trim().length >= 8) {
    score += 2; details.push("есть конкретная учебная цель");
  }
  if ((task?.instruction || "").trim().length >= 15) {
    score += 2; details.push("действие сформулировано понятно");
  }
  if (task?.topic) {
    score += 2; details.push("задание связано с темой");
  }
  if (task?.mechanic) {
    score += 2; details.push("задание связано с механикой");
  }
  if (!/(нажм(и|ите).*(1|2|3|окно|кнопк)|просто нажм)/i.test(text)) {
    score += 2; details.push("действие не является пустым кликом");
  }

  return {
    score,
    accepted: score >= 7,
    details
  };
}
