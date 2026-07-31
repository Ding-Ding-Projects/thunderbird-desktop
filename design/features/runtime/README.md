# Runtime Material features · Runtime Material 功能

This category documents the first real packaged Material runtime slice and the
foundational modules that support the full rewrite. A preview surface is not
counted as a completed replacement for Thunderbird behavior.

| Feature | Article | Verification |
|---|---|---|
| Packaged Material preview | [material-preview.md](material-preview.md) | `python design/verify-material-preview.py`, packaged browser capture |
| Anchored regex builder | [regex-builder.md](regex-builder.md) and [`design/runtime/regex/README.md`](../../runtime/regex/README.md) | `node --test design/runtime/regex/regex-builder.test.mjs` |
| Language and funny-level model | [language-tone.md](language-tone.md) and [`design/runtime/i18n/README.md`](../../runtime/i18n/README.md) | `node --test design/runtime/i18n/tests/model.test.mjs` |

## Shared verification rule

Each article states behavior, configuration, failure modes, security/privacy
considerations, accessibility expectations, and current evidence. “Design-only”,
“preview”, “diagnostic”, and “sign-off” are separate states; none may be silently
substituted for another.
