# Dim-sum surprise · 點心小驚喜

## Behavior

The packaged preview has a fresh per-launch 1% draw for a non-blocking Classic
har gow card. It is suppressed on first launch, respects the persisted opt-out,
uses a bundled local image with English/Cantonese alt text, and can be dismissed
without stealing focus or delaying page readiness.

## Configuration

Settings → **Allow the one-percent dim-sum surprise** persists the opt-out in the
preview preference namespace. The dish name is factual and does not change with
the funny-level setting.

## Failure modes

- Missing local storage leaves the preview usable and suppresses the surprise
  rather than making startup dependent on persistence.
- The card is never shown twice by one launch and never appears on first launch.
- The image is a local catalog asset; no network fallback is attempted.

## Security and privacy

The source image is copied from the verified local global-memory catalog and is
packaged in the Material skin. There is no CDN, analytics, tracking, or account
data access.

## Accessibility and verification

The card is a live, non-blocking status surface with meaningful image alt text,
an accessible dismiss button, and reduced-motion inheritance. The static
verifier proves packaging and launch-boundary code; a 1% probabilistic render
still requires a built-artifact capture or deterministic test hook for sign-off.

## Related articles

- [Language and funny levels](language-tone.md)
- [Notification centre](notification-centre.md)
- [Packaged Material preview](material-preview.md)
