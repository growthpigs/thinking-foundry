import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'poc/node_modules/**',
      'frontend/**', // has its own toolchain (Vite/TS)
      'poc/public/**', // legacy vanilla JS POC UI
      'NOTEBOOKLM-SNIPPETS.py',
    ],
  },
  js.configs.recommended,
  {
    files: ['poc/**/*.js', '*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['tests/**/*.mjs', '**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
