# Local colour translator · 本機色彩轉換器

This DOM-free module translates local sRGB values among named colours,
HEX/HEX8, RGB/A, HSL/A, HSV, HWB, CIELAB/LCH, OKLab/OKLCH, and CMYK while
preserving alpha and reporting whether the result is inside the sRGB gamut.
It is bounded to local numeric conversion and has no network or font
dependency. The packaged appearance editor mounts this translator through
`mail/base/content/materialMailColor.mjs`. It provides continuous local HSL
controls, direct-entry parsing, translated representations with copy actions,
clipping/gamut status, and contrast readout. Full Word-depth typography,
eyedropper support, and every-element coverage remain open for GM-08.

```powershell
node --test design/runtime/color/color-translator.test.mjs
```
