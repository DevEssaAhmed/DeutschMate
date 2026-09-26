import fs from "node:fs";
import { execFileSync } from "node:child_process";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const source = fs.readFileSync("lib/module-specs.ts", "utf8");
const match = source.match(/export const moduleSpecs = ([\s\S]*?) satisfies ModuleSpec\[\];/);
if (!match) throw new Error("Could not parse moduleSpecs JSON literal.");
const modules = JSON.parse(match[1]);

const failures = [];
function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(modules.length === 50, "Expected exactly 50 modules, found " + modules.length);
const keys = new Set();
for (const level of LEVELS) {
  const count = modules.filter((module) => module.level === level).length;
  assert(count === 10, level + " must have 10 modules, found " + count);
}

for (const module of modules) {
  const key = module.level + ":" + module.slug;
  assert(!keys.has(key), "Duplicate module key: " + key);
  keys.add(key);
  for (const field of ["title","scenario","readingGenre","listeningGenre","writingTask","speakingTask","anchorText"]) {
    assert(typeof module[field] === "string" && module[field].trim().length > 8, key + " has weak/empty " + field);
  }
  assert(Array.isArray(module.grammarFocus) && module.grammarFocus.length >= 2, key + " needs at least 2 grammar focuses");
  assert(Array.isArray(module.canDos) && module.canDos.length >= 2, key + " needs at least 2 can-do goals");
  assert(Array.isArray(module.chunks) && module.chunks.length >= 4, key + " needs at least 4 chunks");
  assert(Array.isArray(module.dialogue) && module.dialogue.length >= 3, key + " needs at least 3 dialogue lines");
}

let vocab = 0;
let grammar = 0;
let quizzes = 0;
for (const level of LEVELS.map((x) => x.toLowerCase())) {
  const units = JSON.parse(fs.readFileSync("lib/content/" + level + ".json", "utf8"));
  assert(units.length === 8, level.toUpperCase() + " legacy source must retain 8 curated source units");
  for (const unit of units) {
    vocab += unit.vocab?.length ?? 0;
    grammar += unit.grammar?.length ?? 0;
    quizzes += unit.quiz?.length ?? 0;
  }
}

assert(vocab >= 800, "Vocabulary source fell below 800 items: " + vocab);
assert(grammar >= 80, "Grammar source fell below 80 topics: " + grammar);
assert(quizzes >= 200, "Quiz source fell below 200 questions: " + quizzes);
assert(modules.length * 6 === 300, "Expected 300 generated lessons.");

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const allowedGeminiPlaceholders = new Set([
  "your_key_here",
  "replace_with_your_key",
  "<your-key>",
  "<your_key>",
]);

for (const file of tracked) {
  if (!/\.(?:ts|tsx|js|mjs|json|md|yml|yaml|example)$/.test(file)) continue;
  if (file === "scripts/audit-curriculum.mjs") continue;
  if (!fs.existsSync(file)) continue;

  const text = fs.readFileSync(file, "utf8");
  const publicPrefix = ["NEXT", "PUBLIC", "GEMINI"].join("_");
  assert(!text.includes(publicPrefix), file + " exposes Gemini through a public client variable");

  const assignments = [...text.matchAll(/GEMINI_API_KEY\s*=\s*([^\s\n]+)/g)];
  for (const match of assignments) {
    const value = match[1].replace(/^[\"']|[\"']$/g, "");
    assert(
      allowedGeminiPlaceholders.has(value),
      file + " appears to contain a non-placeholder Gemini key assignment",
    );
  }

  assert(!/AQ\.[A-Za-z0-9_-]{20,}/.test(text), file + " appears to contain a pasted API credential");
}

if (failures.length) {
  console.error("\nCurriculum audit failed:");
  failures.forEach((failure) => console.error(" - " + failure));
  process.exit(1);
}

console.log("Curriculum audit passed.");
console.log(JSON.stringify({
  levels: LEVELS.length,
  modules: modules.length,
  lessons: modules.length * 6,
  vocabularySourceItems: vocab,
  grammarSourceTopics: grammar,
  sourceQuizQuestions: quizzes,
}, null, 2));
