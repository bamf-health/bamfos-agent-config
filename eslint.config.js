import js from 'eslint-config-kswedberg/flat/js.mjs';
import markdown from '@eslint/markdown';

export default [
  ...markdown.configs.processor,
  ...js,
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
