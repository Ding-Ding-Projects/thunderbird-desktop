# Material Mail tab model

`tab-model.mjs` is the dependency-free state model shared by the packaged
Material Mail tab strip. It keeps the visual layer separate from persisted
state and DOM measurement.

## Behavior

- Normalizes saved active, ordered, and pinned tab ids against the tabs in the
  current build.
- Keeps pinned tabs in a stable dedicated region while preserving one canonical
  order.
- Supports one-step keyboard moves and same-region drag/drop moves.
- Partitions measured ordinary tabs into visible and overflowed sets. Pinned
  tabs never overflow, and the active ordinary tab remains visible.
- Describes every tab with active, pinned, and hidden metadata for an all-tabs
  search surface.

The browser adapter owns the Thunderbird profile-preference boundary, element
measurement, focus, events, and rendering. The model has no network, account,
message, command, or filesystem access.

## Verification

From the repository root:

```powershell
node --test design/runtime/tabs/tab-model.test.mjs
```

The tests cover stale-state normalization, pin transitions, ordered moves, the
pinned boundary, measured overflow, active-tab promotion, and all-tabs metadata.
