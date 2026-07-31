/* Material Mail's continuous local colour picker and translator. */
import { hslToRgb, translateColor } from "chrome://messenger/content/materialColorTranslator.mjs";

const SPACES = ["named", "hex", "hex8", "rgb", "rgba", "hsl", "hsla", "hsv", "hwb", "lab", "lch", "oklab", "oklch", "cmyk"];
const spaceLabels = Object.freeze({ named: "Named", hex: "HEX", hex8: "HEX8", rgb: "RGB", rgba: "RGBA", hsl: "HSL", hsla: "HSLA", hsv: "HSV", hwb: "HWB", lab: "CIELAB", lch: "CIELCH", oklab: "OKLab", oklch: "OKLCH", cmyk: "CMYK" });
const state = { role: "surface", space: "hex" };

function $(id) { return document.getElementById(id); }
function text(value) { return value == null ? "" : String(value); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
function toast(message) {
  const node = $("mm-toast");
  if (!node) return;
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (node.hidden = true), 3500);
}
function sourceValue(role = state.role) { return $(role === "text" ? "mm-appearance-text-text" : "mm-appearance-surface-text")?.value || "#000000"; }
function hex6(value) { return /^#[\da-f]{8}$/i.test(value) ? value.slice(0, 7) : value; }
function setSource(role, value) {
  const textId = role === "text" ? "mm-appearance-text-text" : "mm-appearance-surface-text";
  const colorId = role === "text" ? "mm-appearance-text" : "mm-appearance-surface";
  $(textId).value = value;
  $(colorId).value = hex6(value);
  window.mmUpdateAppearanceColor?.(role, value);
}
function sourceColor(role = state.role) {
  try { return translateColor({ space: "hex", value: sourceValue(role) }); } catch { return translateColor({ space: "hex", value: "#000000" }); }
}
function numericValue(space, raw) {
  const values = text(raw).trim().split(/[\s,]+/).filter(Boolean).map(Number);
  if (!values.length || values.some(value => !Number.isFinite(value))) throw new Error("Enter numbers separated by spaces or commas.");
  if (["rgb", "rgba"].includes(space)) values.splice(0, 3, ...values.slice(0, 3).map(value => value / 255));
  if (["hsl", "hsla", "hsv", "hwb"].includes(space) && values.length >= 3) values.splice(1, 2, ...values.slice(1, 3).map(value => value > 1 ? value / 100 : value));
  if (space === "cmyk") values.splice(0, 4, ...values.slice(0, 4).map(value => value > 1 ? value / 100 : value));
  return values;
}
function parseEntry(space, raw) {
  if (["named", "hex", "hex8"].includes(space)) return text(raw).trim();
  return numericValue(space, raw);
}
function formatEntry(space, color) {
  if (space === "named") return color.named || color.hex;
  if (["hex", "hex8"].includes(space)) return space === "hex8" && color.hex.length === 7 ? `${color.hex}ff` : color.hex;
  if (["rgb", "rgba"].includes(space)) {
    const values = color.rgb.map(value => Math.round(value * 255));
    return [...values, ...(space === "rgba" ? [color.alpha] : [])].join(", ");
  }
  const values = color[space.replace(/a$/, "")];
  if (!values) return color.hex;
  return Object.values(values).map(value => text(value)).concat(space.endsWith("a") ? [color.alpha] : []).join(", ");
}
function contrastRatio(first, second) {
  const luminance = color => color.rgb.map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const a = luminance(first); const b = luminance(second); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function renderRepresentations(color) {
  const values = [
    ["Named", color.named || "—"],
    ["HEX / HEX8", color.hex],
    ["RGB / RGBA", formatEntry("rgba", color)],
    ["HSL / HSLA", formatEntry("hsla", color)],
    ["HSV", formatEntry("hsv", color)],
    ["HWB", formatEntry("hwb", color)],
    ["CIELAB / LCH", `${formatEntry("lab", color)} · ${formatEntry("lch", color)}`],
    ["OKLab / OKLCH", `${formatEntry("oklab", color)} · ${formatEntry("oklch", color)}`],
    ["CMYK", formatEntry("cmyk", color)],
  ];
  $("mm-color-representations").innerHTML = values.map(([label, value]) => `<div class="mm-color-representation"><span><strong>${label}</strong><code>${text(value)}</code></span><button class="mm-text-button" type="button" data-color-copy="${text(value).replace(/"/g, "&quot;")}">Copy</button></div>`).join("");
  $("mm-color-representations").querySelectorAll("[data-color-copy]").forEach(button => button.addEventListener("click", async () => { try { await navigator.clipboard.writeText(button.dataset.colorCopy); toast(`Copied ${button.dataset.colorCopy} · 已複製`); } catch { toast("Clipboard unavailable · 剪貼簿不可用"); } }));
}
function renderStatus(color) {
  const gamut = $("mm-color-gamut");
  gamut.textContent = color.clipped ? "Out of sRGB gamut; values are clipped for display · 超出 sRGB 色域；顯示時會裁剪" : "Inside sRGB gamut · 位於 sRGB 色域內";
  gamut.classList.toggle("is-warning", color.clipped);
  const surface = sourceColor("surface"); const foreground = sourceColor("text");
  const ratio = contrastRatio(surface, foreground);
  $("mm-color-contrast").textContent = `Current surface/text contrast: ${ratio.toFixed(2)}:1 · 目前表面/文字對比度：${ratio.toFixed(2)}:1`;
  $("mm-color-preview").style.background = color.hex;
}
function renderSliders(color) {
  $("mm-color-hue").value = color.hsl.h;
  $("mm-color-saturation").value = Math.round(color.hsl.s * 100);
  $("mm-color-lightness").value = Math.round(color.hsl.l * 100);
  $("mm-color-hue-value").value = `${Math.round(color.hsl.h)}°`;
  $("mm-color-saturation-value").value = `${Math.round(color.hsl.s * 100)}%`;
  $("mm-color-lightness-value").value = `${Math.round(color.hsl.l * 100)}%`;
}
function render() {
  const color = sourceColor();
  renderSliders(color); renderRepresentations(color); renderStatus(color);
  $("mm-color-space-entry").value = formatEntry(state.space, color);
  $("mm-color-space-entry").setAttribute("aria-label", `${spaceLabels[state.space]} value`);
}
function applyHsl() {
  const rgb = hslToRgb({ h: Number($("mm-color-hue").value), s: Number($("mm-color-saturation").value) / 100, l: Number($("mm-color-lightness").value) / 100 });
  const color = translateColor({ space: "rgb", value: rgb });
  setSource(state.role, color.hex); render();
}
function applySpaceEntry() {
  try {
    const color = translateColor({ space: state.space, value: parseEntry(state.space, $("mm-color-space-entry").value) });
    setSource(state.role, color.hex); render();
  } catch (error) { $("mm-color-entry-status").textContent = `${error.message} · 請輸入有效色彩值`; }
}
function openForRole(role) { state.role = role; $("mm-color-role").textContent = role === "text" ? "Editing text colour · 編輯文字顏色" : "Editing surface colour · 編輯表面顏色"; render(); }
function bind() {
  $("mm-appearance-surface").addEventListener("input", event => { setSource("surface", event.target.value); openForRole("surface"); });
  $("mm-appearance-text").addEventListener("input", event => { setSource("text", event.target.value); openForRole("text"); });
  ["mm-color-hue", "mm-color-saturation", "mm-color-lightness"].forEach(id => $(id).addEventListener("input", applyHsl));
  $("mm-color-space").addEventListener("change", event => { state.space = event.target.value; render(); });
  $("mm-color-space-entry").addEventListener("change", applySpaceEntry);
  $("mm-appearance-surface-text").addEventListener("focus", () => openForRole("surface"));
  $("mm-appearance-text-text").addEventListener("focus", () => openForRole("text"));
  document.addEventListener("mm-appearance-opened", event => { state.role = "surface"; openForRole("surface"); if (event.detail?.target) render(); });
  const select = $("mm-color-space");
  select.innerHTML = SPACES.map(space => `<option value="${space}">${spaceLabels[space]}</option>`).join("");
  select.value = state.space;
  render();
}

document.addEventListener("DOMContentLoaded", bind, { once: true });
