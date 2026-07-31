/** Local sRGB colour translator used by Material appearance controls. */

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));
const round = (value, digits = 4) => Number(Number(value).toFixed(digits));
const hue = value => ((Number(value) % 360) + 360) % 360;

export const NAMED_COLORS = Object.freeze({ black: [0, 0, 0], white: [1, 1, 1], red: [1, 0, 0], green: [0, 0.50196, 0], blue: [0, 0, 1], transparent: [0, 0, 0] });

export function hexToRgb(value) {
  const source = String(value).trim().replace(/^#/, "");
  const expanded = source.length === 3 || source.length === 4 ? source.split("").map(char => char + char).join("") : source;
  if (![6, 8].includes(expanded.length) || !/^[\da-f]+$/i.test(expanded)) throw new Error("Invalid hexadecimal colour.");
  return { rgb: [0, 2, 4].map(index => parseInt(expanded.slice(index, index + 2), 16) / 255), alpha: expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1 };
}

export function rgbToHex(rgb, alpha = 1) {
  const bytes = rgb.map(value => Math.round(clamp(value) * 255).toString(16).padStart(2, "0")).join("");
  return `#${bytes}${alpha < 1 ? Math.round(clamp(alpha) * 255).toString(16).padStart(2, "0") : ""}`;
}

export function rgbToHsl([r, g, b]) {
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const delta = max - min; const lightness = (max + min) / 2;
  if (!delta) return { h: 0, s: 0, l: round(lightness) };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let h = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  h = hue(h * 60);
  return { h: round(h, 3), s: round(saturation), l: round(lightness) };
}

export function hslToRgb({ h, s, l }) {
  const saturation = clamp(s); const lightness = clamp(l); const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation; const x = chroma * (1 - Math.abs((hue(h) / 60) % 2 - 1)); const m = lightness - chroma / 2;
  const segment = hue(h) / 60; const prime = segment < 1 ? [chroma, x, 0] : segment < 2 ? [x, chroma, 0] : segment < 3 ? [0, chroma, x] : segment < 4 ? [0, x, chroma] : segment < 5 ? [x, 0, chroma] : [chroma, 0, x];
  return prime.map(value => round(value + m));
}

export function rgbToHsv([r, g, b]) {
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const delta = max - min; const v = max; const s = max ? delta / max : 0;
  if (!delta) return { h: 0, s: round(s), v: round(v) };
  let h = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return { h: round(hue(h * 60), 3), s: round(s), v: round(v) };
}

export function hsvToRgb({ h, s, v }) {
  const segment = hue(h) / 60; const chroma = clamp(v) * clamp(s); const x = chroma * (1 - Math.abs((segment % 2) - 1)); const m = clamp(v) - chroma;
  const prime = segment < 1 ? [chroma, x, 0] : segment < 2 ? [x, chroma, 0] : segment < 3 ? [0, chroma, x] : segment < 4 ? [0, x, chroma] : segment < 5 ? [x, 0, chroma] : [chroma, 0, x];
  return prime.map(value => round(value + m));
}

export function rgbToHwb(rgb) { const hsv = rgbToHsv(rgb); return { h: hsv.h, w: round(Math.min(...rgb)), b: round(1 - Math.max(...rgb)) }; }
export function hwbToRgb({ h, w, b }) { const white = clamp(w); const black = clamp(b); if (white + black >= 1) return [white / (white + black), white / (white + black), white / (white + black)]; const base = hsvToRgb({ h, s: 1, v: 1 }); const factor = 1 - white - black; return base.map(value => round(value * factor + white)); }

function linear(value) { return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }
function gam(value) { return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055; }
function rgbToXyz(rgb) { const [r, g, b] = rgb.map(linear); return [0.4123908 * r + 0.3575843 * g + 0.1804808 * b, 0.212639 * r + 0.7151687 * g + 0.0721923 * b, 0.0193308 * r + 0.1191948 * g + 0.9505322 * b]; }
function xyzToRgb([x, y, z]) { return [3.2409699 * x - 1.5373832 * y - 0.4986108 * z, -0.9692436 * x + 1.8759675 * y + 0.0415551 * z, 0.0556301 * x - 0.203977 * y + 1.0569715 * z].map(value => round(gam(value))); }
const D65 = [0.95047, 1, 1.08883];
function labF(value) { return value > 216 / 24389 ? Math.cbrt(value) : (24389 / 27 * value + 16) / 116; }
function labFinv(value) { const cube = value ** 3; return cube > 216 / 24389 ? cube : (116 * value - 16) / (24389 / 27); }
export function rgbToLab(rgb) { const [x, y, z] = rgbToXyz(rgb).map((value, index) => labF(value / D65[index])); return { l: round(116 * y - 16, 3), a: round(500 * (x - y), 3), b: round(200 * (y - z), 3) }; }
export function labToRgb({ l, a, b }) { const fy = (Number(l) + 16) / 116; const fx = Number(a) / 500 + fy; const fz = fy - Number(b) / 200; return xyzToRgb([labFinv(fx) * D65[0], labFinv(fy) * D65[1], labFinv(fz) * D65[2]]); }
export function labToLch({ l, a, b }) { return { l: round(l, 3), c: round(Math.hypot(a, b), 3), h: round(hue(Math.atan2(b, a) * 180 / Math.PI), 3) }; }
export function lchToLab({ l, c, h }) { const radians = hue(h) * Math.PI / 180; return { l: Number(l), a: Number(c) * Math.cos(radians), b: Number(c) * Math.sin(radians) }; }

export function rgbToOklab([r, g, b]) { const [lr, lg, lb] = [r, g, b].map(linear); const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb; const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb; const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb; const [L, A, B] = [Math.cbrt(l), Math.cbrt(m), Math.cbrt(s)]; return { l: round(0.2104542553 * L + 0.793617785 * A - 0.0040720468 * B, 5), a: round(1.9779984951 * L - 2.428592205 * A + 0.4505937099 * B, 5), b: round(0.0259040371 * L + 0.7827717662 * A - 0.808675766 * B, 5) }; }
export function oklabToRgb({ l, a, b }) { const L = Number(l) + 0.3963377774 * Number(a) + 0.2158037573 * Number(b); const M = Number(l) - 0.1055613458 * Number(a) - 0.0638541728 * Number(b); const S = Number(l) - 0.0894841775 * Number(a) - 1.291485548 * Number(b); const [ll, mm, ss] = [L ** 3, M ** 3, S ** 3]; return [4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss, -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss, -0.0041960863 * ll - 0.7034186147 * mm + 1.707614701 * ss].map(value => round(gam(value))); }
export function oklabToOklch(value) { return { l: value.l, c: round(Math.hypot(value.a, value.b), 5), h: round(hue(Math.atan2(value.b, value.a) * 180 / Math.PI), 3) }; }
export function oklchToOklab(value) { const radians = hue(value.h) * Math.PI / 180; return { l: Number(value.l), a: Number(value.c) * Math.cos(radians), b: Number(value.c) * Math.sin(radians) }; }
export function rgbToCmyk([r, g, b]) { const k = 1 - Math.max(r, g, b); if (k >= 1) return { c: 0, m: 0, y: 0, k: 1 }; return { c: round((1 - r - k) / (1 - k)), m: round((1 - g - k) / (1 - k)), y: round((1 - b - k) / (1 - k)), k: round(k) }; }
export function cmykToRgb({ c, m, y, k }) { const key = clamp(k); return [1 - Math.min(1, clamp(c) * (1 - key) + key), 1 - Math.min(1, clamp(m) * (1 - key) + key), 1 - Math.min(1, clamp(y) * (1 - key) + key)].map(value => round(value)); }

function parseValue(space, value) {
  if (space === "hex" || space === "hex8") return hexToRgb(value);
  if (space === "named") { const rgb = NAMED_COLORS[String(value).toLowerCase()]; if (!rgb) throw new Error("Unknown named colour."); return { rgb, alpha: String(value).toLowerCase() === "transparent" ? 0 : 1 }; }
  const source = Array.isArray(value) ? value : Object.values(value);
  if (space === "rgb" || space === "rgba") return { rgb: source.slice(0, 3).map(Number), alpha: Number(source[3] ?? 1) };
  if (space === "hsl" || space === "hsla") return { rgb: hslToRgb({ h: source[0], s: source[1], l: source[2] }), alpha: Number(source[3] ?? 1) };
  if (space === "hsv") return { rgb: hsvToRgb({ h: source[0], s: source[1], v: source[2] }), alpha: 1 };
  if (space === "hwb") return { rgb: hwbToRgb({ h: source[0], w: source[1], b: source[2] }), alpha: 1 };
  if (space === "lab") return { rgb: labToRgb({ l: source[0], a: source[1], b: source[2] }), alpha: 1 };
  if (space === "lch") return { rgb: labToRgb(lchToLab({ l: source[0], c: source[1], h: source[2] })), alpha: 1 };
  if (space === "oklab") return { rgb: oklabToRgb({ l: source[0], a: source[1], b: source[2] }), alpha: 1 };
  if (space === "oklch") return { rgb: oklabToRgb(oklchToOklab({ l: source[0], c: source[1], h: source[2] })), alpha: 1 };
  if (space === "cmyk") return { rgb: cmykToRgb({ c: source[0], m: source[1], y: source[2], k: source[3] }), alpha: 1 };
  throw new Error(`Unsupported colour space: ${space}`);
}

export function translateColor({ space = "hex", value = "#000000", alpha } = {}) {
  const parsed = parseValue(space.toLowerCase(), value); const a = clamp(alpha ?? parsed.alpha); const rgb = parsed.rgb.map(value => clamp(value)); const hsl = rgbToHsl(rgb); const hsv = rgbToHsv(rgb); const hwb = rgbToHwb(rgb); const lab = rgbToLab(rgb); const lch = labToLch(lab); const oklab = rgbToOklab(rgb); const oklch = oklabToOklch(oklab); const cmyk = rgbToCmyk(rgb);
  return { alpha: round(a), gamut: rgb.every(value => value >= 0 && value <= 1) ? "sRGB" : "out-of-sRGB", rgb: rgb.map(value => round(value)), hex: rgbToHex(rgb, a), hsl, hsv, hwb, lab, lch, oklab, oklch, cmyk };
}
