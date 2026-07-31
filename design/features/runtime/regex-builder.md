# Anchored regex builder · 貼欄正規表達式建立器

## Behavior

The preview packages the reusable `design/runtime/regex/` module beside the mail
search field. Plain text is the default; the anchored button opens a local panel
with guided literals/classes/anchors/groups/alternation/quantifiers, raw pattern
editing, flags, sample text, validation, matches, capture groups, copy, and JSON
export.

## Configuration and limits

The real engine is ECMAScript JavaScript `RegExp`. Pattern/query length is capped
at 512 characters, sample text at 100,000, captures at 64, and matches at 200.
The module normalizes flags and uses a Worker when available; its guarded fallback
is explicit when a Worker cannot be created.

## Failure modes and security

Invalid flags, invalid syntax, oversized input, unsupported backreferences, nested
quantifiers, no matches, and zero-width matches are reported without throwing the
host page. Export is versioned JSON, never executable code. Patterns and samples
stay local and are not transmitted or persisted by the module.

## Accessibility and verification

The panel returns focus to its originating search field, exposes labelled controls,
supports keyboard close, and keeps each builder's state local to its field. Run:

```powershell
node --test design\runtime\regex\regex-builder.test.mjs
```

## Related articles

- [Packaged Material preview](material-preview.md)
- [Language and funny levels](language-tone.md)
- [Global-memory gap audit](../../GLOBAL-MEMORY-GAP-AUDIT-2026-07-31.md)
