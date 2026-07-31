/**
 * Localized language and tone preferences for future Material Mail previews.
 *
 * This module is deliberately DOM-free. It stores only validated preferences;
 * copy facts and tone variants remain code-owned and are never persisted.
 */

export const LANGUAGE_MODE = Object.freeze({
  ENGLISH: "english",
  CANTONESE: "cantonese",
  BILINGUAL: "bilingual",
});

export const LANGUAGE = Object.freeze({
  ENGLISH: "en",
  CANTONESE: "yue-Hant-HK",
});

export const STORAGE_KEY = "material-mail.i18n.preferences.v1";
export const MAX_STORED_BYTES = 4096;

export const DEFAULT_PREFERENCES = Object.freeze({
  languageMode: LANGUAGE_MODE.ENGLISH,
  funnyLevelEnglish: 2,
  funnyLevelCantonese: 2,
});

const VALID_MODES = new Set(Object.values(LANGUAGE_MODE));
const FALLBACK_FACTS = Object.freeze({
  en: "Message unavailable.",
  yue: "訊息暫時不可用。",
});

export const COPY = Object.freeze({
  settingsSaved: Object.freeze({
    facts: Object.freeze({
      en: "Settings saved.",
      yue: "設定已儲存。",
    }),
    tones: Object.freeze({
      en: Object.freeze([
        "Settings saved.",
        "Settings saved. Nice and tidy.",
        "Settings saved. The preference gremlin can take a tea break.",
        "Settings saved. The tiny settings drawer is doing a victory lap.",
        "Settings saved. The bits lined up like dim sum in a steamer.",
      ]),
      yue: Object.freeze([
        "設定已儲存。",
        "設定已儲存。整整齊齊。",
        "設定已儲存。個設定小精靈可以飲啖茶喇。",
        "設定已儲存。啲掣終於排隊，唔使再爭位。",
        "設定已儲存。成班設定好似點心咁乖乖入籠喇。",
      ]),
    }),
  }),
});

export const DISCLOSURE_COPY = Object.freeze({
  facts: Object.freeze({
    en: "Funny levels style every message, including errors and warnings; facts and choices stay clear. You can change or reset them at any time.",
    yue: "幽默程度會套用到所有訊息，包括錯誤同警告；事實同選項會保持清楚。你隨時可以更改或者重設。",
  }),
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validLevel(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function normalizeLevel(value, fallback) {
  return validLevel(value) ? value : fallback;
}

export function normalizePreferences(value, fallback = DEFAULT_PREFERENCES) {
  const source = isRecord(value) ? value : {};
  const base = isRecord(fallback) ? fallback : DEFAULT_PREFERENCES;
  const languageMode = VALID_MODES.has(source.languageMode)
    ? source.languageMode
    : VALID_MODES.has(base.languageMode)
      ? base.languageMode
      : DEFAULT_PREFERENCES.languageMode;

  return Object.freeze({
    languageMode,
    funnyLevelEnglish: normalizeLevel(
      source.funnyLevelEnglish,
      normalizeLevel(base.funnyLevelEnglish, DEFAULT_PREFERENCES.funnyLevelEnglish),
    ),
    funnyLevelCantonese: normalizeLevel(
      source.funnyLevelCantonese,
      normalizeLevel(base.funnyLevelCantonese, DEFAULT_PREFERENCES.funnyLevelCantonese),
    ),
  });
}

function copyFact(value, language) {
  if (!isRecord(value) || typeof value[language] !== "string" || !value[language].trim()) {
    return FALLBACK_FACTS[language];
  }
  return value[language];
}

function safeTone(fact, tones, index) {
  if (!Array.isArray(tones)) {
    return fact;
  }
  const tone = tones[index - 1];
  return typeof tone === "string" && tone.includes(fact) ? tone : fact;
}

function formatSegments(mode, english, cantonese) {
  const segments = Object.freeze([
    Object.freeze({ language: LANGUAGE.ENGLISH, text: english }),
    Object.freeze({ language: LANGUAGE.CANTONESE, text: cantonese }),
  ]);

  if (mode === LANGUAGE_MODE.CANTONESE) {
    return Object.freeze({
      mode,
      language: LANGUAGE.CANTONESE,
      text: cantonese,
      primary: cantonese,
      secondary: "",
      segments,
      accessibleText: cantonese,
    });
  }
  if (mode === LANGUAGE_MODE.BILINGUAL) {
    return Object.freeze({
      mode,
      language: "bilingual",
      text: `${english}\n${cantonese}`,
      primary: english,
      secondary: cantonese,
      segments,
      accessibleText: `${english} ${cantonese}`,
    });
  }
  return Object.freeze({
    mode: LANGUAGE_MODE.ENGLISH,
    language: LANGUAGE.ENGLISH,
    text: english,
    primary: english,
    secondary: "",
    segments,
    accessibleText: english,
  });
}

export function renderLocalizedMessage(copy, preferences = DEFAULT_PREFERENCES) {
  const prefs = normalizePreferences(preferences);
  const facts = isRecord(copy) && isRecord(copy.facts) ? copy.facts : FALLBACK_FACTS;
  const tones = isRecord(copy) && isRecord(copy.tones) ? copy.tones : {};
  const englishFact = copyFact(facts, "en");
  const cantoneseFact = copyFact(facts, "yue");
  const english = safeTone(englishFact, tones.en, prefs.funnyLevelEnglish);
  const cantonese = safeTone(cantoneseFact, tones.yue, prefs.funnyLevelCantonese);

  return Object.freeze({
    ...formatSegments(prefs.languageMode, english, cantonese),
    facts: Object.freeze({ en: englishFact, yue: cantoneseFact }),
    levels: Object.freeze({
      english: prefs.funnyLevelEnglish,
      cantonese: prefs.funnyLevelCantonese,
    }),
  });
}

export function renderDisclosure(preferences = DEFAULT_PREFERENCES) {
  return renderLocalizedMessage(
    {
      facts: DISCLOSURE_COPY.facts,
      tones: { en: [DISCLOSURE_COPY.facts.en], yue: [DISCLOSURE_COPY.facts.yue] },
    },
    preferences,
  );
}

function getDefaultStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage
      ? window.localStorage
      : null;
  } catch {
    return null;
  }
}

function loadStoredPreferences(storage, key, defaults) {
  if (!storage || typeof storage.getItem !== "function") {
    return { preferences: normalizePreferences(defaults), persisted: false };
  }
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return { preferences: normalizePreferences(defaults), persisted: false };
    }
    return { preferences: normalizePreferences(JSON.parse(raw), defaults), persisted: true };
  } catch {
    return { preferences: normalizePreferences(defaults), persisted: false };
  }
}

function persistPreferences(storage, key, preferences) {
  if (!storage || typeof storage.setItem !== "function") {
    return false;
  }
  try {
    const serialized = JSON.stringify(preferences);
    if (serialized.length > MAX_STORED_BYTES) {
      return false;
    }
    storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

export function createI18nModel({ storage = getDefaultStorage(), storageKey = STORAGE_KEY, defaults = DEFAULT_PREFERENCES } = {}) {
  const safeDefaults = normalizePreferences(defaults);
  const loaded = loadStoredPreferences(storage, storageKey, safeDefaults);
  let preferences = loaded.preferences;

  function snapshot() {
    return preferences;
  }

  function update(patch = {}) {
    preferences = normalizePreferences({ ...preferences, ...(isRecord(patch) ? patch : {}) }, safeDefaults);
    return Object.freeze({ preferences, persisted: persistPreferences(storage, storageKey, preferences) });
  }

  return Object.freeze({
    getPreferences: snapshot,
    wasLoadedFromStorage: loaded.persisted,
    setPreferences: update,
    reset() {
      return update(safeDefaults);
    },
    render(copyId = "settingsSaved") {
      return renderLocalizedMessage(COPY[copyId] || COPY.settingsSaved, preferences);
    },
    disclosure() {
      return renderDisclosure(preferences);
    },
  });
}
