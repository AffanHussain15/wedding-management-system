module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Build tooling: Node, not React Native. The icon generator is a PNG
      // codec, so bitwise operators are the point rather than a smell.
      files: ['scripts/**/*.js'],
      env: { node: true },
      rules: { 'no-bitwise': 'off' },
    },
  ],
};
