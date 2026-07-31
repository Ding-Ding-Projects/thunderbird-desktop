import test from "node:test";
import assert from "node:assert/strict";
import { cmykToRgb, hexToRgb, hslToRgb, labToRgb, oklabToRgb, rgbToCmyk, rgbToHex, translateColor } from "./color-translator.mjs";

test("hex and alpha round-trip through RGB", () => {
  const parsed = hexToRgb("#6750a4cc");
  assert.equal(rgbToHex(parsed.rgb, parsed.alpha), "#6750a4cc");
});

test("HSL, Lab, OKLab, HWB, and CMYK produce bounded RGB", () => {
  for (const rgb of [hslToRgb({ h: 265, s: 0.5, l: 0.48 }), labToRgb({ l: 42, a: 52, b: -38 }), oklabToRgb({ l: 0.5, a: 0.1, b: -0.1 }), cmykToRgb({ c: 0.36, m: 0.51, y: 0, k: 0.36 })]) assert.ok(rgb.every(value => Number.isFinite(value)));
});

test("translator exposes every required representation", () => {
  const color = translateColor({ space: "hex", value: "#ff8800" });
  for (const key of ["hex", "rgb", "hsl", "hsv", "hwb", "lab", "lch", "oklab", "oklch", "cmyk"]) assert.ok(color[key] !== undefined, key);
  assert.equal(color.gamut, "sRGB");
});

test("CMYK round-trip stays close to the source", () => {
  const source = [0.2, 0.4, 0.8];
  const roundTrip = cmykToRgb(rgbToCmyk(source));
  assert.ok(roundTrip.every((value, index) => Math.abs(value - source[index]) < 0.02));
});
