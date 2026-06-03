module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated 4's worklets plugin (`react-native-worklets/plugin`) is injected
    // by `nativewind/babel` via react-native-css-interop. Do NOT add it (or the
    // legacy `react-native-reanimated/plugin`) here too, or it runs twice.
  };
};
