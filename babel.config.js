module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Reads `.env` at build time and exposes it as the `@env` module. Metro
    // caches the values, so restart with `--reset-cache` after editing `.env`.
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@theme': './src/theme',
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@constants': './src/constants',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@services': './src/services',
          '@store': './src/store',
          '@data': './src/data',
          '@types': './src/types',
          '@assets': './src/assets',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
  ],
};
