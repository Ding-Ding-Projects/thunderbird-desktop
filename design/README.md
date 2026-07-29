# Claude Design snapshot — "Material Design App Rewrite"

Mirror of the Claude Design project that drives the Thunderbird 3-pane redesign.

- **Project:** `bd7bc9a9-157e-47c9-8139-7d561c4a1cd3`
- **Source:** https://claude.ai/design/p/bd7bc9a9-157e-47c9-8139-7d561c4a1cd3
- **Snapshot taken:** 2026-07-28

## Contents

| Path | Notes |
|---|---|
| `Material Mail.dc.html` | The design document. **Currently an empty `<x-dc>` skeleton** — the design worker is still authoring it. |
| `support.js` | dc-runtime (generated from `dc-runtime/src/*.ts`); parses `<x-dc>`, binds props, renders via React. |
| `icons/*.svg` | 62 icons. 16×16 unless noted; `*-xs`/`*-sm` are 12×12, `normal-inbox` and `spaces-*` are 20×20. |
| `.thumbnail` | WebP preview card (21 KB). Renders the **pre-rename** design — the only surviving image of it. |

## Status at snapshot time

The project originally contained `Thunderbird 3-Pane (current).dc.html`. Partway through this
snapshot the design worker **renamed it to `Material Mail.dc.html` and cleared its contents**, so
the document is currently an empty skeleton:

```html
<x-dc>

</x-dc>
```

Nothing has been implemented against `mail/base/content/about3Pane.*` yet — there is no design to
implement. A 10-minute polling loop watches the project and will only start implementing once the
document is non-empty, structurally whole, free of placeholders, covers all three panes, and has
stayed byte-identical across two consecutive checks.

## Refreshing this snapshot

Files are pulled with the `DesignSync` tool (`get_file` per path; `list_files` to enumerate).
Note that `get_file` returns HTTP 404 for a path that `list_files` just listed while a rename is
in flight — re-run `list_files` rather than assuming the file is gone.
