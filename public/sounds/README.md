# Sound Effects Directory

Place your sound effect files here for the AI coach chat interface.

## Required Files

1. **message-sent.mp3** (or .wav, .ogg)
   - Sound played when user sends a message
   - Recommended: Short, pleasant "pop" or "whoosh" sound
   - Duration: 0.1-0.3 seconds

2. **message-received.mp3** (or .wav, .ogg)
   - Sound played when AI responds with a message
   - Recommended: Gentle "ding" or "chime" sound
   - Duration: 0.2-0.5 seconds

## Supported Formats

- `.mp3` (recommended for best compatibility)
- `.wav`
- `.ogg`

## File Naming

The files must be named exactly:
- `message-sent.mp3` (or .wav/.ogg)
- `message-received.mp3` (or .wav/.ogg)

## Fallback

If the audio files are not found, the system will automatically fall back to programmatically generated sounds using the Web Audio API.

## Volume

The sounds are automatically set to 50% volume. You can adjust this in `src/utils/soundEffects.ts` by changing the `audio.volume` value (0.0 to 1.0).

