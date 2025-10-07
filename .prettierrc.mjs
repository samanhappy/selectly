/**
 * @type {import('prettier').Options}
 */
export default {
  // Line length
  printWidth: 100,

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Syntax
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',

  // Spacing
  bracketSpacing: true,
  arrowParens: 'always',

  // JSX
  jsxSingleQuote: false,
  bracketSameLine: false,

  // End of line
  endOfLine: 'lf',

  // Import sorting plugin
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: [
    '<BUILTIN_MODULES>', // Node.js built-in modules
    '', // Empty line
    '<THIRD_PARTY_MODULES>', // Imports not matched by other special words or groups
    '', // Empty line
    '^@plasmo/(.*)$',
    '^@plasmohq/(.*)$',
    '', // Empty line
    '^~(.*)$', // Alias imports
    '', // Empty line
    '^[./]', // Relative imports
  ],
};
