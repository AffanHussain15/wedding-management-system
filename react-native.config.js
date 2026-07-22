/**
 * React Native CLI config.
 * `assets` tells the CLI where custom fonts live so they get bundled into
 * the iOS/Android builds. After dropping font files into src/assets/fonts,
 * run:  npx react-native-asset
 */
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
};
