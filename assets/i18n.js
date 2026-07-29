/* Language modes and funny-level engine.
 *
 * Per the project's global instructions:
 *  - Three language modes: English, playful Hong Kong Cantonese, bilingual.
 *  - An independent funny-level slider per language, 1 (fully serious) to
 *    5 (maximum playfulness), persisted across reloads.
 *  - The level changes VOICE, never FACTS. Every variant of a string must still
 *    name the same commit, the same file, the same outcome. A funnier warning
 *    that leaves the reader unsure what happened is a broken warning.
 *  - No category is exempt, including errors and warnings — which is why the
 *    settings surface discloses that plainly before the user opts in.
 */

const STORE_KEY = "mm-prefs-v1";

export const DEFAULTS = {
  lang: "both",   // "en" | "zh" | "both"
  funEn: 3,
  funZh: 4,
  theme: "auto",  // "auto" | "light" | "dark"
};

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw);
    return {
      lang: ["en", "zh", "both"].includes(p.lang) ? p.lang : DEFAULTS.lang,
      funEn: clampLevel(p.funEn, DEFAULTS.funEn),
      funZh: clampLevel(p.funZh, DEFAULTS.funZh),
      theme: ["auto", "light", "dark"].includes(p.theme) ? p.theme : DEFAULTS.theme,
    };
  } catch {
    // A corrupt or unavailable store must never break the page.
    return { ...DEFAULTS };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
  } catch {
    /* Private mode / storage disabled. Preferences simply do not persist. */
  }
}

function clampLevel(v, fallback) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : fallback;
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/**
 * Resolve a bilingual, funny-levelled string.
 *
 * A value is either a plain string (same at every level, e.g. a proper noun)
 * or { en: [l1..l5], zh: [l1..l5] }. Arrays shorter than 5 clamp to their last
 * entry, so a string that only has one voice still works at every level.
 */
export function t(value, prefs) {
  if (value == null) return "";
  if (typeof value === "string") return value;

  const pick = (arr, level) => {
    if (!arr) return "";
    if (typeof arr === "string") return arr;
    return arr[Math.min(level, arr.length) - 1] ?? arr[arr.length - 1] ?? "";
  };

  const en = pick(value.en, prefs.funEn);
  const zh = pick(value.zh, prefs.funZh);

  if (prefs.lang === "en") return en || zh;
  if (prefs.lang === "zh") return zh || en;
  return [en, zh].filter(Boolean).join(" · ");
}

/**
 * Bilingual mode must not crowd the interface: the primary language stays
 * prominent and the secondary is rendered as a compact secondary line rather
 * than jammed onto the same one.
 */
export function tHtml(value, prefs) {
  if (value == null) return "";
  if (typeof value === "string") return escapeHtml(value);

  const pick = (arr, level) => {
    if (!arr) return "";
    if (typeof arr === "string") return arr;
    return arr[Math.min(level, arr.length) - 1] ?? arr[arr.length - 1] ?? "";
  };

  const en = pick(value.en, prefs.funEn);
  const zh = pick(value.zh, prefs.funZh);

  if (prefs.lang === "en") return escapeHtml(en || zh);
  if (prefs.lang === "zh") return `<span class="zh" lang="zh-HK">${escapeHtml(zh || en)}</span>`;
  if (!zh) return escapeHtml(en);
  if (!en) return `<span class="zh" lang="zh-HK">${escapeHtml(zh)}</span>`;
  return `${escapeHtml(en)}<span class="secondary zh" lang="zh-HK">${escapeHtml(zh)}</span>`;
}

/** Plain text of BOTH languages regardless of mode — used for search, so a
 *  Cantonese query still finds a doc while the UI is in English. */
export function searchText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const all = [];
  for (const key of ["en", "zh"]) {
    const v = value[key];
    if (typeof v === "string") all.push(v);
    else if (Array.isArray(v)) all.push(...v);
  }
  return all.join(" ");
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export const LEVEL_NAMES = {
  en: ["Fully serious", "Restrained", "Light", "Playful", "Maximum"],
  zh: ["完全正經", "收斂", "輕鬆", "貪玩", "去到盡"],
};
