# Anchored regex builder · 貼欄正規表達式建立器

This is a dependency-free browser module for attaching a full regex builder to one search field. The demo is [`demo.html`](demo.html); the implementation is [`regex-builder.mjs`](regex-builder.mjs); the visual layer is [`regex-builder.css`](regex-builder.css); and the adversarial test suite is [`regex-builder.test.mjs`](regex-builder.test.mjs).

呢個係一個零依賴瀏覽器模組，可以將完整正規表達式建立器貼住一個指定搜尋欄。示範喺 [`demo.html`](demo.html)，實作喺 [`regex-builder.mjs`](regex-builder.mjs)，樣式喺 [`regex-builder.css`](regex-builder.css)，而對抗性測試喺 [`regex-builder.test.mjs`](regex-builder.test.mjs)。

## Contract · 規格

- Plain text is the default mode. It uses literal `String#indexOf` matching and never silently turns a normal search into regex.
- Regex mode uses the host JavaScript `RegExp` constructor: ECMAScript syntax, JavaScript escaping, and the runtime’s supported flags (`d`, `g`, `i`, `m`, `s`, `u`, `v`, `y`). The builder normalizes flag order and rejects unsupported or duplicate flags.
- The builder is anchored to the originating control: it positions beside that button, follows viewport collision rules, returns focus to the trigger on close, and keeps query/pattern state local to that field.
- Guided controls cover literals, character classes, anchors, groups, alternation, and quantifiers. The raw pattern editor remains available for deliberate expert input.
- Export format is versioned JSON with `format`, `version`, `engine`, `mode`, `query`, `pattern`, `flags`, and `sampleText`. Exported state is not executable code.

## Limits and safety · 限制及安全

| Limit | Value | Purpose |
|---|---:|---|
| Pattern/query | 512 characters | Stops unbounded editor and compiler input. |
| Sample text | 100,000 characters | Keeps local evaluation and rendering bounded. |
| Capture groups | 64 | Prevents enormous group result objects. |
| Matches | 200 | Prevents result-list amplification. |
| Match text shown | 10,000 characters | Prevents one match from flooding the UI/export. |
| Evaluation budget | 50 ms | Worker timeout budget; loop budget in the guarded fallback. |

The preflight rejects backreferences and nested quantifiers, the two most obvious sources of disproportionate backtracking in this small local tool. Regex evaluation runs in a dedicated Web Worker when `Worker`, `Blob`, and `URL.createObjectURL` are available; the worker is terminated when the budget expires. Environments without a Worker use the preflight safety gate plus bounded match/time loops and report `execution: "main-thread-guarded"`. JavaScript’s synchronous `RegExp` API cannot be forcibly interrupted from the same thread, so callers that require hard isolation should provide Worker support rather than weakening the limits.

預檢會拒絕 backreference 同 nested quantifier，因為呢兩類係呢個本機工具最明顯嘅過度回溯來源。有 `Worker`、`Blob` 同 `URL.createObjectURL` 時，正規表達式會喺獨立 Worker 入面執行，超時就終止 Worker。冇 Worker 嘅環境會用預檢安全閘、匹配數量上限同時間迴圈檢查，並回報 `execution: "main-thread-guarded"`。JavaScript 同步 `RegExp` API 喺同一執行緒唔可以硬性打斷，所以需要硬隔離時，應該提供 Worker，唔好放寬限制。

## Mounting · 掛載

```js
import { RegexBuilder } from "./regex-builder.mjs";

const builder = new RegexBuilder({
  anchor: document.querySelector("[data-regex-trigger]"),
  input: document.querySelector("input[type=search]"),
  panel: document.querySelector("[data-regex-panel]"),
  scope: "Applies to this search field · 套用到此搜尋欄",
  onApply: ({ mode, query, pattern, flags }) => {
    // Keep the result bound to this field; do not use a global hidden query.
    console.log({ mode, query, pattern, flags });
  },
});
```

The module exports `evaluateSync`, `evaluateBounded`, `validatePattern`, `safetyIssue`, `serializeState`, `parseState`, `escapeLiteral`, `GUIDED_TOKENS`, `FLAGS`, `LABELS`, `LIMITS`, and `DIALECT` for integrations that need their own shell.

## Verification · 驗證

From this directory:

```powershell
node --check regex-builder.mjs
node --test regex-builder.test.mjs
```

The tests cover plain-text default behavior, guided token inventory, invalid syntax, flags, Unicode, multiline input, zero-width matches, capture groups, no-match results, result caps, export round trips, input limits, nested-quantifier rejection, backreference rejection, and a long adversarial sample. No Thunderbird mail file is imported or edited by this module.
