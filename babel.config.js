module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
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
