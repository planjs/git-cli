module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [require.resolve('@planjs/fabric/dist/eslint')],
};
