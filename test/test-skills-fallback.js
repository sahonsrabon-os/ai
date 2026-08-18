#!/usr/bin/env node
// =============================================================================
// Mission Barisal — skills.js fallback source tests
// Verifies skills.js still loads skills when data/acp-skills.json is missing
// by falling back to skills/_.md dump and skills/*.md scan.
// Run: node test/test-skills-fallback.js
// =============================================================================
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const JSON_PATH = path.join(ROOT, "data", "acp-skills.json");
const BACKUP_PATH = JSON_PATH + ".bak-test";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (e) {
    failed++;
    console.log("  ✗ " + name + " — " + e.message);
  }
}

function loadSkillsFresh() {
  // Clear module cache so loadSkillsDB() runs again
  delete require.cache[require.resolve("../skills.js")];
  return require("../skills.js");
}

console.log("── skills.js fallback tests ──");

// ── Phase 1: canonical JSON present ──
test("(setup) acp-skills.json exists", () => {
  assert.ok(fs.existsSync(JSON_PATH), "json should exist");
});

test("Source 1: loads 49 from canonical JSON", () => {
  const s = loadSkillsFresh();
  assert.strictEqual(s.totalSkills, 49);
});

// ── Phase 2: hide canonical JSON → fall back to _.md dump ──
test("(setup) hide acp-skills.json", () => {
  fs.renameSync(JSON_PATH, BACKUP_PATH);
  assert.ok(!fs.existsSync(JSON_PATH));
});

test("Source 2: falls back to skills/_.md dump", () => {
  const s = loadSkillsFresh();
  assert.ok(s.totalSkills >= 40, "expected >=40 from _.md, got " + s.totalSkills);
});

test("Source 2: npx command still parsed", () => {
  const s = loadSkillsFresh();
  const guru = s.getSkill("code-guru");
  assert.ok(guru, "code-guru present");
  assert.strictEqual(guru.hasNpx, true);
  assert.ok(guru.npxCommand && guru.npxCommand.startsWith("npx @zombiecoder/"));
});

// ── Phase 3: hide _.md too → fall back to skills/*.md scan ──
test("(setup) hide skills/_.md dump", () => {
  const dump = path.join(ROOT, "skills", "_.md");
  const dumpBackup = dump + ".bak-test";
  fs.renameSync(dump, dumpBackup);
  assert.ok(!fs.existsSync(dump));
});

test("Source 3: scans skills/*.md files", () => {
  const s = loadSkillsFresh();
  assert.ok(s.totalSkills >= 40, "expected >=40 from md scan, got " + s.totalSkills);
  const guru = s.getSkill("code-guru");
  assert.ok(guru, "code-guru parsed from md");
  assert.strictEqual(guru.source, "code-guru.md");
  assert.ok(Array.isArray(guru.tools) && guru.tools.length > 0);
});

// ── Phase 4: restore everything ──
test("(cleanup) restore acp-skills.json", () => {
  if (fs.existsSync(BACKUP_PATH)) fs.renameSync(BACKUP_PATH, JSON_PATH);
  assert.ok(fs.existsSync(JSON_PATH));
});
test("(cleanup) restore skills/_.md", () => {
  const dump = path.join(ROOT, "skills", "_.md");
  const dumpBackup = dump + ".bak-test";
  if (fs.existsSync(dumpBackup)) fs.renameSync(dumpBackup, dump);
  assert.ok(fs.existsSync(dump));
});
test("(cleanup) reloads 49 from restored JSON", () => {
  const s = loadSkillsFresh();
  assert.strictEqual(s.totalSkills, 49);
});

console.log("");
console.log("──────────────────────────────");
console.log("PASSED: " + passed + " | FAILED: " + failed);
process.exit(failed > 0 ? 1 : 0);