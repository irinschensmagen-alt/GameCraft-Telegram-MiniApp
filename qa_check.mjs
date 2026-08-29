import { analyzePrompt } from "./src/engines/promptAnalyzer.js";
import { recommendFamilies } from "./src/engines/recommendationEngine.js";
import { gameFamilies } from "./src/data/gameFamilies.js";

const sample = "Я учитель немецкого языка, 6 класс, A1, тема Essen, лексика и аудирование, 20 минут, не тест.";
const p = analyzePrompt(sample);
const r = recommendFamilies(p, 4);

console.log("Families:", gameFamilies.length);
console.log("Profile:", p);
console.log("Top:", r.map(x => `${x.family.name}:${x.score}`).join(", "));

if (gameFamilies.length !== 23) process.exit(2);
if (gameFamilies.some(f => /tamagotchi|pet/i.test(f.name))) process.exit(3);
if (p.subject !== "Немецкий язык") process.exit(4);
if (p.level !== "A1") process.exit(5);
console.log("QA PASS");
