# Language and funny levels · 語言同幽默程度

## Behavior

`design/runtime/i18n/model.mjs` provides English, playful Hong Kong Cantonese,
and bilingual modes plus independent English and Cantonese levels 1–5. Tone
changes voice only; facts, affected targets, choices, and error meaning remain
unchanged. The preview exposes the same controls in Settings and discloses that
all messages, including warnings and errors, can be styled.

## Configuration and failure modes

Preferences are validated field-by-field and persisted through an injected local
storage adapter. Malformed or unavailable storage falls back to safe defaults.
Unknown modes or levels are normalized rather than allowed to erase a valid
preference. The model is DOM-free so it can be tested before UI integration.

## Security and accessibility

No user content is sent over the network. Bilingual output keeps both language
facts visible, and the UI's secondary Cantonese labels are marked `lang="zh-HK"`.
The preview remains usable when the secondary language is hidden in English mode.

## Verification

```powershell
node --test design\runtime\i18n\tests\model.test.mjs
```

## Related articles

- [Packaged Material preview](material-preview.md)
- [Anchored regex builder](regex-builder.md)
- [Global-memory gap audit](../../GLOBAL-MEMORY-GAP-AUDIT-2026-07-31.md)
