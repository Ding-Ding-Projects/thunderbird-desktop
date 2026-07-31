# Notification centre · 通知中心

## Behavior

The packaged Material Mail Notifications tab renders success, informational,
and warning messages as a non-blocking reviewable stack. It has its own search
field and anchored regex builder, filters all/unread/dismissed records, and
keeps dismissed messages in local history instead of deleting them.

## Configuration

Notification state is stored in the Thunderbird profile preference
`mail.material.preview.notifications`. The preview seed is fixture data;
production notification sources still need to connect to Thunderbird's event
pipeline and preserve the same review behavior.

## Failure modes

- Profile-preference failure leaves the seeded stack visible and never blocks the
  underlying operation.
- Invalid search patterns produce no matches through the bounded regex builder.
- Dismissal changes only local notification state and can be reviewed again from
  the Dismissed history filter.

## Security and privacy

Notification copy is bundled fixture text. No account, message, credential,
network, or analytics data is read. Search evaluation stays local and bounded.
Rendered copy uses literal DOM text, while persisted kinds are restricted to the
`success`, `warning`, and `info` class allowlist; unknown values fall back to
`info` instead of becoming class-name markup.

## Accessibility and verification

The list and count use live regions, each dismiss action is a keyboard-operable
button, the filter has a visible label, and the search field has an adjacent
builder. The browser contract dismisses and persists a real row and verifies a
markup-like persisted notification stays literal. The hosted browser test still
needs to prove the new built artifact; static and module checks are not visual
sign-off.

## Related articles

- [Anchored regex builder](regex-builder.md)
- [Local history surface](local-history.md)
- [Language and funny levels](language-tone.md)
