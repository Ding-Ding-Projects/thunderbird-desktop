import assert from "node:assert/strict";
import test from "node:test";

import {
  COPY,
  DEFAULT_PREFERENCES,
  LANGUAGE_MODE,
  createI18nModel,
  normalizePreferences,
  renderLocalizedMessage,
} from "../model.mjs";
import { createI18nDemoAdapter } from "../demo-adapter.mjs";

class MemoryStorage {
  #values = new Map();

  getItem(key) {
    return this.#values.get(key) ?? null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }
}

test("invalid preferences fall back field-by-field", () => {
  assert.deepEqual(
    normalizePreferences({ languageMode: "robot", funnyLevelEnglish: 6, funnyLevelCantonese: 4.5 }),
    DEFAULT_PREFERENCES,
  );
  assert.deepEqual(
    normalizePreferences({ languageMode: LANGUAGE_MODE.BILINGUAL, funnyLevelEnglish: 1 }),
    { languageMode: LANGUAGE_MODE.BILINGUAL, funnyLevelEnglish: 1, funnyLevelCantonese: 2 },
  );
});
test("malformed and unavailable storage never prevents defaults", () => {
  const malformed = { getItem: () => "{not-json" };
  assert.deepEqual(createI18nModel({ storage: malformed }).getPreferences(), DEFAULT_PREFERENCES);

  const unavailable = {
    getItem() {
      throw new Error("storage blocked");
    },
    setItem() {
      throw new Error("storage blocked");
    },
  };
  const model = createI18nModel({ storage: unavailable });
  assert.deepEqual(model.getPreferences(), DEFAULT_PREFERENCES);
  assert.equal(model.setPreferences({ funnyLevelEnglish: 5 }).persisted, false);
  assert.equal(model.getPreferences().funnyLevelEnglish, 5);
});

test("validated preferences persist and reload", () => {
  const storage = new MemoryStorage();
  const first = createI18nModel({ storage });
  assert.equal(first.setPreferences({
    languageMode: LANGUAGE_MODE.BILINGUAL,
    funnyLevelEnglish: 1,
    funnyLevelCantonese: 5,
  }).persisted, true);

  const second = createI18nModel({ storage });
  assert.equal(second.wasLoadedFromStorage, true);
  assert.deepEqual(second.getPreferences(), {
    languageMode: LANGUAGE_MODE.BILINGUAL,
    funnyLevelEnglish: 1,
    funnyLevelCantonese: 5,
  });
});

test("bilingual output uses independent funny levels and keeps both facts", () => {
  const model = createI18nModel();
  model.setPreferences({
    languageMode: LANGUAGE_MODE.BILINGUAL,
    funnyLevelEnglish: 1,
    funnyLevelCantonese: 5,
  });
  const result = model.render("settingsSaved");

  assert.equal(result.primary, COPY.settingsSaved.tones.en[0]);
  assert.equal(result.secondary, COPY.settingsSaved.tones.yue[4]);
  assert.match(result.text, /Settings saved\./);
  assert.match(result.text, /設定已儲存。/);
  assert.match(result.accessibleText, /Settings saved\./);
  assert.match(result.accessibleText, /設定已儲存。/);
  assert.deepEqual(result.levels, { english: 1, cantonese: 5 });
});

test("invalid tone variants fall back to the factual copy", () => {
  const result = renderLocalizedMessage({
    facts: { en: "Account disconnected.", yue: "帳戶已斷開。" },
    tones: { en: ["A joke with no fact"], yue: ["冇講事實嘅笑話"] },
  }, {
    languageMode: LANGUAGE_MODE.BILINGUAL,
    funnyLevelEnglish: 1,
    funnyLevelCantonese: 1,
  });
  assert.equal(result.primary, "Account disconnected.");
  assert.equal(result.secondary, "帳戶已斷開。");
});

test("demo adapter exposes a future-preview view model and disclosure", () => {
  const adapter = createI18nDemoAdapter();
  const view = adapter.update({ languageMode: LANGUAGE_MODE.CANTONESE, funnyLevelCantonese: 4 });
  assert.equal(view.preferences.languageMode, LANGUAGE_MODE.CANTONESE);
  assert.equal(view.message.language, "yue-Hant-HK");
  assert.equal(view.accessibility.role, "status");
  assert.equal(view.accessibility.ariaLive, "polite");
  assert.match(view.disclosure.text, /幽默程度/);
});
