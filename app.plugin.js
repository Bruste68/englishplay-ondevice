module.exports = function withWhisperPlugin(config) {
  const isDevLauncherDisabled = process.env.EXPO_DEV_LAUNCHER_DISABLED === 'true';
  const isDevMenuDisabled = process.env.EXPO_DEV_MENU_DISABLED === 'true';

  const plugins = ['react-native-whisper'];

  // EAS production에서는 환경변수로 dev 모듈 제외
  if (!isDevLauncherDisabled) {
    plugins.push('expo-dev-launcher');
  }

  if (!isDevMenuDisabled) {
    plugins.push('expo-dev-menu');
  }

  console.log('🛠️ [withWhisperPlugin] plugins:', plugins);

  return {
    ...config,
    plugins,
  };
};
