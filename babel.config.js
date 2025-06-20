module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env.app', // .env를 쓰는 경우 여기 변경
        safe: false,
        allowUndefined: false
      }],
      ['module-resolver', {
        alias: {
          '@': './app',
          '@styles': './shared/styles'
        }
      }],
      'react-native-reanimated/plugin' // 반드시 마지막!
    ]
  };
};
