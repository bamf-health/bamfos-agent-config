import js from 'eslint-config-kswedberg/flat/js.mjs';
import markdown from '@eslint/markdown';

export default [
  ...js,
  ...markdown.configs.processor,
  {
    files: ['**/*.md/**'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },
  },
];
