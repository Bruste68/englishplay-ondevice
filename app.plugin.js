module.exports = function withWhisperPlugin(config) {
  return {
    ...config,
    plugins: [...(config.plugins || []), 'react-native-whisper'],
  };
};
