# Local colour translator · 本機色彩轉換器

This DOM-free module translates local sRGB values among named colours,
HEX/HEX8, RGB/A, HSL/A, HSV, HWB, CIELAB/LCH, OKLab/OKLCH, and CMYK while
preserving alpha and reporting whether the result is inside the sRGB gamut.
It is bounded to local numeric conversion and has no network or font
dependency. The packaged appearance editor still needs to mount this translator
as its full picker UI and add clipping/contrast affordances before GM-08 closes.

```powershell
node --test design/runtime/color/color-translator.test.mjs
```
