import { createI18nModel } from "./model.mjs";

/**
 * Tiny DOM-free adapter for a future Material Mail preview.
 * A preview can render `primary`, `secondary`, and `accessibility` itself.
 */
export function createI18nDemoAdapter(options = {}) {
  const model = createI18nModel(options);

  function view(copyId = "settingsSaved") {
    const message = model.render(copyId);
    const disclosure = model.disclosure();
    return Object.freeze({
      preferences: model.getPreferences(),
      message,
      disclosure,
      accessibility: Object.freeze({
        role: "status",
        ariaLive: "polite",
        text: message.accessibleText,
        segments: message.segments,
      }),
    });
  }

  return Object.freeze({
    view,
    update(patch, copyId = "settingsSaved") {
      model.setPreferences(patch);
      return view(copyId);
    },
    reset(copyId = "settingsSaved") {
      model.reset();
      return view(copyId);
    },
  });
}
