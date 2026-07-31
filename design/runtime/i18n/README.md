# Language and funny-level runtime model

This small, DOM-free module is the future-preview adapter’s source of truth for
language and tone preferences. It is not wired into the design preview or
Thunderbird mail files yet.

## Contract

- `languageMode` is `english`, `cantonese`, or `bilingual`.
- `funnyLevelEnglish` and `funnyLevelCantonese` are independent integers from
  1 (serious) through 5 (maximum playfulness).
- English uses `en`; Cantonese uses `yue-Hant-HK` and Traditional Chinese copy.
- Bilingual output exposes separate `segments`, `primary`, `secondary`, and a
  serialized `accessibleText` so a future preview can keep the secondary line
  compact without hiding it from assistive technology.
- Every tone variant must contain its language’s factual sentence. Invalid or
  incomplete variants fall back to that factual sentence, never to a joke that
  changes what happened or what the user can do.
- `disclosure()` states that funny levels style every message, including errors
  and warnings, while facts and choices stay clear and the levels can be
  changed or reset at any time.

The default is English with level 2 in both languages. Defaults are applied
field-by-field, so one corrupt preference does not erase valid sibling values.

## Persistence, security, and privacy

Preferences are serialized under the versioned local key
`material-mail.i18n.preferences.v1` through a Web Storage-compatible adapter.
Only the language mode and the two numeric levels are persisted. Message copy,
sample text, regex patterns, account data, credentials, and arbitrary user input
are never written by this module. There is no network access, analytics, remote
font dependency, or third-party asset dependency.

Storage reads and writes are bounded and wrapped in failure handling. Malformed
JSON, unsupported values, blocked storage, quota errors, and oversized payloads
fall back to in-memory defaults or keep the current in-memory change without
claiming persistence. The serialized preference payload is capped at 4096
characters. A future host should provide the narrowest storage object it owns;
the module does not inspect unrelated storage keys.

## Accessibility

The adapter exposes `role: "status"` and `ariaLive: "polite"` as a rendering
hint for non-blocking preference feedback. A future preview should render
bilingual segments with explicit language metadata, keep both lines readable at
narrow widths, preserve visible focus on the level controls, and announce
changes without stealing focus. The disclosure must be shown before a user
opts into playful styling and remain reachable for later review. The factual
sentence remains present in every tone and in `accessibleText`; humour never
removes the failure, warning, affected object, or available action.

## Verification

Run from the repository root:

```powershell
node --test design/runtime/i18n/tests/model.test.mjs
node --check design/runtime/i18n/model.mjs
node --check design/runtime/i18n/demo-adapter.mjs
```

The tests cover field-level fallback, malformed and unavailable persistence,
reload persistence, independent bilingual levels, factual-copy protection,
disclosure output, and the future-preview adapter shape.
