# Optional narrator foundation · 可選旁白基礎

## Behavior

Settings exposes an off-by-default narrator with English, Hong Kong Cantonese,
or Both language selection. Events enter a serialized speech queue; a newer
queued line replaces an older queued line, English and Cantonese are spoken in
order for Both, and a short cooldown prevents notification chatter.

## Configuration

The narrator and its language are persisted in the preview settings namespace.
The implementation uses the platform `speechSynthesis` API when available and
keeps the selected message facts unchanged. A production integration still
needs screen-reader ducking, quiet-hours, natural HK Cantonese voice selection,
and complete event-category coverage.

## Failure modes

- If speech synthesis is unavailable, the visual notification still appears and
  the app remains usable.
- Queue replacement never interrupts the current utterance with a second one;
  it replaces only pending speech.
- Speech errors are ignored for the operation itself and never block settings or
  notifications.

## Security and privacy

The narrator sends only the locally rendered event text to the platform speech
API. It does not contact a remote service or persist audio.

## Accessibility and verification

Narration is opt-in, off by default, and coexists with live visual status. The
settings control is keyboard accessible and localized. Static checks prove the
queue and configuration boundary; real voice and assistive-technology capture
remain open.

## Related articles

- [Language and funny levels](language-tone.md)
- [Notification centre](notification-centre.md)
- [Dim-sum surprise](dim-sum-surprise.md)
