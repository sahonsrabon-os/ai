#!/usr/bin/env node
// =============================================================================
// Mission Barisal — skills.js unit tests
// Run: node test/test-skills.js
// =============================================================================
const assert = require("assert");
const skills = require("../skills.js");

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

console.log("── skills.js tests ──");

test("loads 49 skills from database", () => {
  assert.strictEqual(skills.totalSkills, 49);
});

test("summary reports totals", () => {
  const s = skills.getSummary();
  assert.strictEqual(s.total, 49);
  assert.strictEqual(s.npx_agents, s.total - s.binary_agents - s.other_agents);
});

test("NPX/BINARY/OTHER categories sum to total", () => {
  const sum =
    skills.NPX_AGENTS.length + skills.BINARY_AGENTS.length + skills.OTHER_AGENTS.length;
  assert.strictEqual(sum, 49);
});

test("searchSkills finds by id", () => {
  const r = skills.searchSkills("code-guru");
  assert.ok(r.length >= 1);
  assert.strictEqual(r[0].id, "code-guru");
});

test("searchSkills finds by keyword (case-insensitive)", () => {
  const r = skills.searchSkills("AWS");
  assert.ok(r.length >= 1);
  assert.ok(r[0].name.toLowerCase().includes("aws"));
});

test("searchSkills with empty query returns all", () => {
  const r = skills.searchSkills("");
  assert.strictEqual(r.length, 49);
});

test("getSkill returns known skill", () => {
  const s = skills.getSkill("bug-hunter");
  assert.ok(s);
  assert.strictEqual(s.name, "Bug Hunter");
});

test("getSkill returns null for unknown", () => {
  assert.strictEqual(skills.getSkill("does-not-exist"), null);
});

test("getInvokeCommand returns npx command when hasNpx", () => {
  const s = skills.getSkill("code-guru");
  if (s && s.hasNpx) {
    const cmd = skills.getInvokeCommand("code-guru");
    assert.strictEqual(cmd.type, "npx");
    assert.ok(cmd.command.startsWith("npx "));
  } else {
    console.log("  ℹ skip — code-guru not npx-capable");
  }
});

test("getInvokeCommand returns binary info when hasBinary only", () => {
  const s = skills.getSkill("aws-architect");
  if (s && s.hasBinary && !s.hasNpx) {
    const cmd = skills.getInvokeCommand("aws-architect");
    assert.strictEqual(cmd.type, "binary");
    assert.ok(Array.isArray(cmd.platforms));
  } else {
    console.log("  ℹ skip — aws-architect not binary-only");
  }
});

test("getInvokeCommand returns null for unknown skill", () => {
  const cmd = skills.getInvokeCommand("nope");
  assert.strictEqual(cmd, null);
});

test("invokeNpxAgent fails gracefully for unknown skill", async () => {
  const r = await skills.invokeNpxAgent("nope", "");
  assert.strictEqual(r.success, false);
  assert.ok(r.error.includes("Skill not found"));
});

test("ACP_REGISTRATION identifies mission-barisal", () => {
  assert.strictEqual(skills.ACP_REGISTRATION.id, "mission-barisal");
  assert.ok(skills.ACP_REGISTRATION.distribution.type === "mcp");
});

test("every skill has required fields", () => {
  for (const s of skills.skillsDB) {
    assert.ok(s.id, "id");
    assert.ok(s.name, "name");
    assert.ok(s.version, "version");
    assert.ok(Array.isArray(s.permissions), "permissions");
    assert.ok(Array.isArray(s.tools), "tools");
  }
});

console.log("");
console.log("──────────────────────────────");
console.log("PASSED: " + passed + " | FAILED: " + failed);
process.exit(failed > 0 ? 1 : 0);