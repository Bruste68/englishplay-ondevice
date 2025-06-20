module.exports = function withWhisperPlugin(config) {
  const profile = process.env.EAS_BUILD_PROFILE || 'development';
  const isProduction = profile === 'production';

  const plugins = [...(config.plugins || []), 'react-native-whisper'];

  if (!isProduction) {
    plugins.push('expo-dev-launcher');
    plugins.push('expo-dev-menu');
  }

  console.log('🛠️ [withWhisperPlugin] profile:', profile, '→ plugins:', plugins);

  return {
    ...config,
    plugins,
  };
};
