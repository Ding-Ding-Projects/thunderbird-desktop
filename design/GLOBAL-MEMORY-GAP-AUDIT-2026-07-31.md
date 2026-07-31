# Global-memory Material feature gap audit — 2026-07-31

This is a sanitized project-local mirror of the refreshed shared requirements,
applied to Thunderbird Material Mail. It is intentionally factual: a design
snapshot or CSS token is not counted as a shipped interaction.

## Baseline

- Shipped artifact: `tb-155.0a1-b54-wu-gok`.
- Material source: `e4867411c3aa81de4527d843913b966d0ef89c1c`.
- The seven Material sheets are packaged byte-for-byte in that artifact.
- Current implementation boundary: CSS plus stylesheet links; upstream behavior
  and the 3-pane markup are preserved.
- The design snapshot contains the target pages/components, but it is not runtime
  Thunderbird markup and does not itself satisfy the feature requirements.

## Required rewrite ledger

| ID | Requirement | Evidence today | State |
|---|---|---|---|
| GM-01 | Local Material landing page enumerating every feature and hosting its docs | `Material Mail.dc.html` only | Open |
| GM-02 | Persisted English, playful HK Cantonese, and bilingual modes | Upstream Fluent/locales | Open for new Material surfaces |
| GM-03 | Independent persisted funny sliders, levels 1–5, affecting all copy | No controls or voice layer | Open |
| GM-04 | Non-blocking notifications plus history/centre | Upstream notification primitives only | Open |
| GM-05 | One-percent local dim-sum startup card and opt-out | `assets/dimsum/*.svg` glyphs only | Open |
| GM-06 | Full anchored regex builder on every search bar | `SearchField.dc.html` and `RegexBuilder.dc.html` only | Open |
| GM-07 | Per-element appearance editor and Word-depth typography | M3 tokens and CSS only | Open |
| GM-08 | Continuous color picker and bidirectional color-space translator | No runtime picker | Open |
| GM-09 | Browser tabs with overflow, pinning, grouping, four searches, and bulk-close preview | Existing Thunderbird tab behavior; no target design feature set | Open |
| GM-10 | External editor discovery and persisted choice | No Material integration | Open |
| GM-11 | Local Git-backed history for every owned record and setting | No Material history panel | Open |
| GM-12 | All-release changelog viewer with date filter, regex search, copy, and export | `Changelog` design page only | Open |
| GM-13 | Optional serialized English/Cantonese TTS narrator | Not present | Open |
| GM-14 | Full screenshot and accessibility matrix from the built artifact | Five diagnostic/gap captures; no sign-off | Open |

## Acceptance gates for the rewrite

1. Every row above has a real runtime surface and a source-linked feature article
   under `design/`, with configuration, failure modes, security, and verification.
2. The runtime surface follows the corresponding design values in `app-data.js`
   and `Material Mail.dc.html`; deviations are documented, not accidental.
3. Every search field has its own anchored builder, plain text remains the default,
   and bounded evaluation tests cover invalid, Unicode, multiline, zero-width,
   captures, adversarial input, and no-match cases.
4. Keyboard focus, roles, visible focus, contrast, reduced motion, narrow widths,
   100/125/150/200% scale, and bilingual longest strings are tested from the real
   packaged application.
5. Screenshots are captured per dialog, page, feature, menu, and important state;
   each image is labelled as design reference, runtime evidence, diagnostic, or
   sign-off. A CI pass or static verifier alone cannot close this gate.
6. The rewrite remains local-first: no remote fonts, CDN images, analytics, or
   unbounded regex execution.

## Evidence boundary

The current b54 captures in `design/screenshots/runtime/` are genuine, but they
include failure-context and an explicit upstream onboarding gap. They must not be
reused as clean visual sign-off. The next implementation wave should add runtime
captures for the new surfaces as each feature lands, then rerun the full Windows
browser suite and the Material alignment verifier.
