/**
 * Dependency-free state model for the Material Mail tab strip.
 *
 * The model deliberately knows nothing about the DOM or profile preferences.
 * The packaged adapter owns those boundaries while this module keeps ordering,
 * pinning, stale-state recovery, and overflow selection deterministic.
 */

export const TAB_STATE_VERSION = 1;

function uniqueKnown(values, known) {
  const result = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    if (typeof value !== "string" || !known.has(value) || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result;
}

function availableIds(tabs) {
  const values = Array.isArray(tabs) ? tabs : [];
  const result = [];
  const seen = new Set();
  for (const tab of values) {
    const id = typeof tab === "string" ? tab : tab?.id;
    if (typeof id !== "string" || !id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }
  return result;
}

/**
 * Normalize persisted state against the tabs that exist in the current build.
 * Unknown and duplicate ids are removed, and newly introduced tabs are
 * appended without disturbing the surviving persisted order.
 */
export function normalizeTabState(raw, tabs, options = {}) {
  const ids = availableIds(tabs);
  const known = new Set(ids);
  const persisted = raw && typeof raw === "object" ? raw : {};

  const ordered = uniqueKnown(persisted.order, known);
  const orderedSet = new Set(ordered);
  const order = [...ordered, ...ids.filter(id => !orderedSet.has(id))];

  const requestedDefault = options.defaultActive;
  const defaultActive = known.has(requestedDefault)
    ? requestedDefault
    : (ids[0] ?? null);
  const active = known.has(persisted.active) ? persisted.active : defaultActive;

  const hasPersistedPinned = Object.prototype.hasOwnProperty.call(
    persisted,
    "pinned"
  );
  const pinnedSource = hasPersistedPinned
    ? persisted.pinned
    : (options.defaultPinned ?? []);
  const requestedPinned = new Set(uniqueKnown(pinnedSource, known));
  const pinned = order.filter(id => requestedPinned.has(id));

  return {
    version: TAB_STATE_VERSION,
    active,
    order,
    pinned,
  };
}

export function isTabPinned(state, id) {
  return state.pinned.includes(id);
}

/** Return the visual order: the stable pinned region, then ordinary tabs. */
export function renderedTabOrder(state) {
  const pinned = new Set(state.pinned);
  return [
    ...state.order.filter(id => pinned.has(id)),
    ...state.order.filter(id => !pinned.has(id)),
  ];
}

export function activateTab(state, id) {
  if (!state.order.includes(id) || state.active === id) {
    return { ...state, order: [...state.order], pinned: [...state.pinned] };
  }
  return {
    ...state,
    active: id,
    order: [...state.order],
    pinned: [...state.pinned],
  };
}

export function setTabPinned(state, id, pinned = true) {
  if (!state.order.includes(id)) {
    return { ...state, order: [...state.order], pinned: [...state.pinned] };
  }
  const next = new Set(state.pinned);
  if (pinned) {
    next.add(id);
  } else {
    next.delete(id);
  }
  return {
    ...state,
    order: [...state.order],
    pinned: state.order.filter(tabId => next.has(tabId)),
  };
}

export function toggleTabPinned(state, id) {
  return setTabPinned(state, id, !isTabPinned(state, id));
}

function reorderPeers(state, id, mutate) {
  if (!state.order.includes(id)) {
    return { ...state, order: [...state.order], pinned: [...state.pinned] };
  }
  const pinned = isTabPinned(state, id);
  const peers = state.order.filter(
    tabId => isTabPinned(state, tabId) === pinned
  );
  const nextPeers = mutate([...peers]);
  if (!nextPeers || nextPeers.length !== peers.length) {
    return { ...state, order: [...state.order], pinned: [...state.pinned] };
  }

  let peerIndex = 0;
  const order = state.order.map(tabId => {
    if (isTabPinned(state, tabId) !== pinned) {
      return tabId;
    }
    return nextPeers[peerIndex++];
  });
  const pinnedSet = new Set(state.pinned);
  return {
    ...state,
    order,
    pinned: order.filter(tabId => pinnedSet.has(tabId)),
  };
}

/** Move a tab one place within its pinned or ordinary region. */
export function moveTab(state, id, direction) {
  const delta = Math.sign(Number(direction) || 0);
  if (!delta) {
    return { ...state, order: [...state.order], pinned: [...state.pinned] };
  }
  return reorderPeers(state, id, peers => {
    const from = peers.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= peers.length) {
      return peers;
    }
    [peers[from], peers[to]] = [peers[to], peers[from]];
    return peers;
  });
}

/**
 * Move a dragged tab immediately before another tab in the same region.
 * Pin state never changes implicitly during a reorder.
 */
export function moveTabBefore(state, sourceId, targetId) {
  if (
    sourceId === targetId ||
    !state.order.includes(sourceId) ||
    !state.order.includes(targetId) ||
    isTabPinned(state, sourceId) !== isTabPinned(state, targetId)
  ) {
    return { ...state, order: [...state.order], pinned: [...state.pinned] };
  }
  return reorderPeers(state, sourceId, peers => {
    const withoutSource = peers.filter(id => id !== sourceId);
    const targetIndex = withoutSource.indexOf(targetId);
    withoutSource.splice(targetIndex, 0, sourceId);
    return withoutSource;
  });
}

function tabWidth(widths, id) {
  let value;
  if (typeof widths === "function") {
    value = widths(id);
  } else if (widths instanceof Map) {
    value = widths.get(id);
  } else {
    value = widths?.[id];
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

/**
 * Select the ordinary tabs that fit the measured region. Pinned tabs are never
 * hidden. If the active ordinary tab would overflow, it replaces the final
 * fitted tab so the selected tab remains keyboard reachable.
 */
export function selectVisibleTabs(
  state,
  { availableWidth = Number.POSITIVE_INFINITY, widths = {}, gap = 0 } = {}
) {
  const pinnedSet = new Set(state.pinned);
  const pinned = state.order.filter(id => pinnedSet.has(id));
  const regular = state.order.filter(id => !pinnedSet.has(id));
  const budget = Number(availableWidth);
  const spacing = Math.max(0, Number(gap) || 0);

  let visibleRegular;
  if (!Number.isFinite(budget)) {
    visibleRegular = [...regular];
  } else {
    visibleRegular = [];
    let used = 0;
    for (const id of regular) {
      const need = tabWidth(widths, id) + (visibleRegular.length ? spacing : 0);
      if (used + need > Math.max(0, budget)) {
        continue;
      }
      visibleRegular.push(id);
      used += need;
    }
  }

  let activePromoted = false;
  if (
    regular.includes(state.active) &&
    !visibleRegular.includes(state.active)
  ) {
    activePromoted = true;
    if (visibleRegular.length) {
      visibleRegular[visibleRegular.length - 1] = state.active;
    } else {
      visibleRegular.push(state.active);
    }
  }

  const visibleSet = new Set(visibleRegular);
  visibleRegular = regular.filter(id => visibleSet.has(id));
  const hiddenRegular = regular.filter(id => !visibleSet.has(id));
  const visible = [...pinned, ...visibleRegular];

  return {
    pinned,
    regular,
    visibleRegular,
    hiddenRegular,
    visible,
    hidden: [...hiddenRegular],
    activePromoted,
    activeHidden: state.active != null && !visible.includes(state.active),
  };
}

/** Build the all-tabs list with stable pinned, hidden, and active metadata. */
export function describeTabs(state, tabs, visibility) {
  const records = new Map(
    (Array.isArray(tabs) ? tabs : []).map(tab => [
      typeof tab === "string" ? tab : tab.id,
      typeof tab === "string" ? { id: tab, label: tab } : tab,
    ])
  );
  const hidden = new Set(visibility?.hidden ?? []);
  return renderedTabOrder(state).map((id, index) => ({
    ...(records.get(id) ?? { id, label: id }),
    id,
    index,
    active: state.active === id,
    pinned: isTabPinned(state, id),
    hidden: hidden.has(id),
  }));
}
