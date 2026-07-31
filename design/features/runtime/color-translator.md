# Continuous colour picker and translator · 連續色彩選擇器同轉換器

## Behavior

The packaged appearance editor owns a local continuous HSL control for the
selected surface or text colour. It also accepts direct values in named colours,
HEX/HEX8, RGB/RGBA, HSL/HSLA, HSV, HWB, CIELAB/LCH, OKLab/OKLCH, and CMYK.
Every accepted value is translated into the other representations, with a copy
button beside each result. Alpha is retained; out-of-sRGB values are reported
and clipped only for the rendered preview. The editor shows the current
surface/text contrast ratio.

## Configuration

The adapter is `mail/base/content/materialMailColor.mjs`; the DOM-free converter
is `design/runtime/color/color-translator.mjs` and is packaged as
`materialColorTranslator.mjs`. Values are applied through the appearance
editor's existing per-element CSS custom-property store. The editor search field
has its own anchored regex builder and defaults to plain text.

## Failure modes

- Invalid direct input leaves the last valid colour and reports an inline error.
- Values outside sRGB are visibly labelled as clipped; the converter does not
  silently call them in-gamut.
- Clipboard denial leaves results usable and reports a non-blocking toast.
- A local persistence failure leaves the live style usable for the session.

## Security and privacy

Conversion is bounded numeric work in the document. It uses no network, remote
fonts, CDN assets, analytics, account data, or untrusted code evaluation.
Clipboard access occurs only after the user activates a Copy button.

## Accessibility and verification

The editor retains labelled inputs, keyboard-operable range/select/text controls,
visible focus, live gamut/contrast status, and a return-to-target close path.
Run:

```powershell
node --test design/runtime/color/color-translator.test.mjs
python design/verify-material-preview.py
```

The source/browser contracts are covered; a built-artifact screenshot of this
new picker remains `capture-pending` while Windows installer run
[30641803803](https://github.com/Ding-Ding-Projects/thunderbird-desktop/actions/runs/30641803803)
is queued. Word-depth typography, eyedropper support, presets/import-export, and
every-element appearance coverage remain open.
