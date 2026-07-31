import test from "node:test";
import assert from "node:assert/strict";
import {
  DIALECT,
  FLAGS,
  GUIDED_TOKENS,
  LIMITS,
  evaluateBounded,
  evaluatePlainSync,
  evaluateRegexSync,
  evaluateSync,
  escapeLiteral,
  normalizeFlags,
  parseState,
  safetyIssue,
  serializeState,
  validatePattern,
} from "./regex-builder.mjs";

test("plain text is the default and treats regex punctuation literally", () => {
  const result = evaluateSync({ query: "a+b", sampleText: "a+b aaab" });
  assert.equal(result.ok, true);
  assert.deepEqual(result.matches.map((match) => match.index), [0]);
  assert.equal(escapeLiteral("a+b"), "a\\+b");
});

test("guided tokens cover the required construction vocabulary", () => {
  const ids = new Set(GUIDED_TOKENS.map((token) => token.id));
  for (const id of ["literal", "class", "start", "end", "group", "alternate", "optional", "one-or-more", "zero-or-more", "range"]) {
    assert.equal(ids.has(id), true, `missing guided token: ${id}`);
  }
  assert.equal(FLAGS.some((flag) => flag.value === "i"), true);
  assert.equal(FLAGS.some((flag) => flag.value === "u"), true);
});

test("JavaScript flags are normalized and invalid flags are rejected", () => {
  assert.equal(normalizeFlags("ig"), "gi");
  assert.equal(normalizeFlags("migs"), "gims");
  assert.throws(() => normalizeFlags("gg"), /Duplicate/);
  assert.throws(() => normalizeFlags("q"), /Unsupported/);
  assert.equal(validatePattern("invoice", "gi").ok, true);
  assert.equal(validatePattern("invoice", "q").ok, false);
});

test("syntax validation, Unicode, multiline input, captures, and named groups work", () => {
  assert.equal(validatePattern("(", "").ok, false);
  const result = evaluateRegexSync("^(?<kind>invoice|receipt)\\s+#?(\\d+)$", "gimu", "Invoice #20261\nreceipt 4471");
  assert.equal(result.ok, true);
  assert.equal(result.matches.length, 2);
  assert.deepEqual(result.matches[0].groups, ["Invoice", "20261"]);
  assert.equal(result.matches[0].namedGroups.kind, "Invoice");
  const unicode = evaluateRegexSync("\\p{Letter}+", "gu", "蝦餃 abc");
  assert.equal(unicode.ok, true);
  assert.equal(unicode.matches[0].text, "蝦餃");
});

test("zero-width matches advance safely and no-match is explicit", () => {
  const zeroWidth = evaluateRegexSync("^|$", "gm", "a\nb");
  assert.equal(zeroWidth.ok, true);
  assert.ok(zeroWidth.matches.length >= 2);
  const none = evaluatePlainSync("missing", "present");
  assert.equal(none.ok, true);
  assert.deepEqual(none.matches, []);
});

test("match output is bounded", () => {
  const result = evaluateRegexSync("a", "g", "a".repeat(100), { ...LIMITS, maxMatches: 3 });
  assert.equal(result.ok, true);
  assert.equal(result.matches.length, 3);
  assert.equal(result.capped, true);
  const truncated = evaluateRegexSync("a+", "g", "a".repeat(LIMITS.maxSampleLength + 10));
  assert.equal(truncated.truncated, true);
});

test("adversarial constructs are rejected before RegExp execution", () => {
  const started = performance.now();
  assert.match(safetyIssue("^(a+)+$"), /Nested quantifiers/);
  assert.match(safetyIssue("(.*)+"), /Nested quantifiers/);
  assert.match(safetyIssue("^(a|a)\\1+$"), /Backreferences/);
  assert.equal(evaluateRegexSync("^(a+)+$", "", "a".repeat(20_000)).ok, false);
  assert.ok(performance.now() - started < 100, "preflight should not run the adversarial expression");
});

test("pattern, sample, capture, and group limits are enforced", () => {
  assert.equal(validatePattern("a".repeat(LIMITS.maxPatternLength + 1), "").ok, false);
  assert.equal(validatePattern("(".repeat(LIMITS.maxCaptureGroups + 1) + ")".repeat(LIMITS.maxCaptureGroups + 1), "").ok, false);
  const state = { mode: "regex", query: "", pattern: "(invoice)", flags: "gi", sampleText: "invoice" };
  const serialized = serializeState(state);
  const parsed = parseState(serialized);
  assert.deepEqual(parsed, state);
  assert.equal(serialized.includes(DIALECT), true);
  assert.throws(() => parseState(JSON.stringify({ format: "wrong", version: 1, engine: DIALECT })), /Unsupported/);
});

test("bounded async API preserves the safety boundary without a Worker", async () => {
  const result = await evaluateBounded({ mode: "regex", pattern: "^(a+)+$", flags: "", sampleText: "a".repeat(10_000) });
  assert.equal(result.ok, false);
  assert.equal(result.execution, "preflight-rejected");
  const safe = await evaluateBounded({ mode: "regex", pattern: "(?<word>invoice)", flags: "i", sampleText: "Invoice" });
  assert.equal(safe.ok, true);
  assert.ok(["worker", "main-thread-guarded"].includes(safe.execution));
});
