// Web shim for @react-native-voice/voice
// Native speech recognition is not available in browsers via this lib.
// All methods are silent no-ops so the app doesn't crash on web.
const Voice = {
  start:           () => Promise.resolve(),
  stop:            () => Promise.resolve(),
  destroy:         () => Promise.resolve(),
  cancel:          () => Promise.resolve(),
  isAvailable:     () => Promise.resolve(false),
  getSpeechRecognitionServices: () => Promise.resolve([]),
  onSpeechStart:        null as any,
  onSpeechRecognized:   null as any,
  onSpeechEnd:          null as any,
  onSpeechError:        null as any,
  onSpeechResults:      null as any,
  onSpeechPartialResults: null as any,
  onSpeechVolumeChanged:  null as any,
  removeAllListeners:   () => {},
};
export default Voice;
