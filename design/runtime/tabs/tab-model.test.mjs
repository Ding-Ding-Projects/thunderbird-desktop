import test from "node:test";
import assert from "node:assert/strict";

import {
  describeTabs,
  moveTab,
  moveTabBefore,
  normalizeTabState,
  renderedTabOrder,
  selectVisibleTabs,
  setTabPinned,
  toggleTabPinned,
} from "./tab-model.mjs";

const IDS = ["mail", "settings", "history", "tools"];

test("normalization drops stale and duplicate ids while retaining new tabs", () => {
  const state = normalizeTabState(
    {
      active: "removed",
      order: ["history", "removed", "history", "mail"],
      pinned: ["removed", "mail", "mail"],
    },
    IDS,
    { defaultActive: "settings", defaultPinned: ["mail"] }
  );

  assert.deepEqual(state, {
    version: 1,
    active: "settings",
    order: ["history", "mail", "settings", "tools"],
    pinned: ["mail"],
  });
  assert.deepEqual(
    normalizeTabState({ order: IDS, pinned: [] }, IDS, { defaultPinned: ["mail"] }).pinned,
    [],
    "an explicitly empty pinned set is preserved"
  );
});

test("pinning changes the rendered region without losing canonical order", () => {
  let state = normalizeTabState(null, IDS, { defaultPinned: ["mail"] });
  state = setTabPinned(state, "history", true);

  assert.deepEqual(state.order, IDS);
  assert.deepEqual(state.pinned, ["mail", "history"]);
  assert.deepEqual(renderedTabOrder(state), ["mail", "history", "settings", "tools"]);

  state = toggleTabPinned(state, "mail");
  assert.deepEqual(state.pinned, ["history"]);
  assert.deepEqual(renderedTabOrder(state), ["history", "mail", "settings", "tools"]);
});

test("keyboard and drag moves stay inside the tab's current region", () => {
  let state = normalizeTabState(
    { order: IDS, pinned: ["mail", "history"], active: "mail" },
    IDS
  );

  state = moveTab(state, "history", -1);
  assert.deepEqual(renderedTabOrder(state), ["history", "mail", "settings", "tools"]);

  state = moveTab(state, "tools", -1);
  assert.deepEqual(renderedTabOrder(state), ["history", "mail", "tools", "settings"]);

  state = moveTabBefore(state, "settings", "tools");
  assert.deepEqual(renderedTabOrder(state), ["history", "mail", "settings", "tools"]);

  const unchanged = moveTabBefore(state, "settings", "mail");
  assert.deepEqual(
    renderedTabOrder(unchanged),
    renderedTabOrder(state),
    "dragging across the pinned boundary does not silently change pin state"
  );
});

test("overflow keeps pinned and active tabs visible and describes hidden tabs", () => {
  const tabs = [
    { id: "mail", label: "Mail" },
    { id: "settings", label: "Settings" },
    { id: "history", label: "History" },
    { id: "tools", label: "Tools" },
  ];
  const state = normalizeTabState(
    { active: "tools", order: IDS, pinned: ["mail"] },
    tabs
  );
  const visibility = selectVisibleTabs(state, {
    availableWidth: 210,
    widths: { settings: 100, history: 100, tools: 100 },
    gap: 10,
  });

  assert.deepEqual(visibility.pinned, ["mail"]);
  assert.deepEqual(visibility.visibleRegular, ["settings", "tools"]);
  assert.deepEqual(visibility.hidden, ["history"]);
  assert.equal(visibility.activePromoted, true);
  assert.equal(visibility.activeHidden, false);

  const descriptions = describeTabs(state, tabs, visibility);
  assert.deepEqual(
    descriptions.map(({ id, pinned, hidden, active }) => ({ id, pinned, hidden, active })),
    [
      { id: "mail", pinned: true, hidden: false, active: false },
      { id: "settings", pinned: false, hidden: false, active: false },
      { id: "history", pinned: false, hidden: true, active: false },
      { id: "tools", pinned: false, hidden: false, active: true },
    ]
  );
});
