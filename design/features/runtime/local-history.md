# Local history surface · 本機歷史介面

## Behavior

The packaged Material Mail History tab renders append-only local revisions,
derives action filters from recorded rows, and composes action, date, and text
filters. Its search field has an independent anchored regex builder. Restoring
a preview row records a new `restored` revision instead of rewriting the prior
row. The surface exports the filtered view as plain text.

## Configuration

The preview stores settings and history in separate local-storage namespaces:
`mail.material.preview.settings` and `mail.material.preview.history`. History is
bounded to the newest 100 local rows. The production gap remains a real
Git-backed repository beside app data that snapshots every user-managed record,
not merely this preview's settings.

## Failure modes

- If local storage is unavailable, sample revisions remain usable and a history
  write never blocks the setting or restore operation.
- An empty action/date/search combination reports no matching revisions.
- Export failures are reported through a non-blocking toast; no record is deleted
  or rewritten.

## Security and privacy

Rows stay local and contain fixture descriptions only. The preview does not read
Thunderbird accounts, messages, credentials, or project folders. The full
production history implementation must preserve encryption and stable AAD when
connected to real records.

## Accessibility and verification

Action filters are labelled checkboxes with counts, date fields have visible
labels, result counts use `aria-live`, restore is a keyboard-operable button,
and reduced motion remains inherited from the Material surface. The browser
test proves seeded rows, derived action filters, and rendering; it does not yet
prove a real Git-backed repository.

## Related articles

- [Changelog viewer](changelog-viewer.md)
- [Anchored regex builder](regex-builder.md)
- [Packaged Material preview](material-preview.md)
