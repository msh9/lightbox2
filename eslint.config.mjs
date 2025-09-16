import { defineConfig, globalIgnores } from 'eslint/config';
import pluginJest from 'eslint-plugin-jest';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist/']),
  {
    files: ['**/*.test.mjs'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error'
    }
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jquery
      }
    },

    rules: {
      'no-bitwise': 'error',
      camelcase: 'error',
      curly: 'error',
      eqeqeq: 'error',
      'guard-for-in': 'error',
      'no-extend-native': 'error',
      indent: ['error', 2],
      'no-use-before-define': 'error',
      'max-depth': ['error', 6],
      'max-params': ['error', 6],
      'max-statements': ['error', 50],
      'new-cap': 'error',
      'no-caller': 'error',
      'no-empty': 'error',
      'no-irregular-whitespace': 'error',
      'no-new': 'error',
      quotes: ['error', 'single'],
      'no-trailing-spaces': 'error',
      'no-undef': 'error',

      'no-unused-vars': ['error', {
        vars: 'all',
        args: 'none'
      }],

      'wrap-iife': ['error', 'any'],
      'spaced-comment': ['error', 'always'],

      'keyword-spacing': ['error', {
        after: true
      }],

      'space-before-blocks': 'error',
      'one-var': ['error', 'never'],

      'brace-style': ['error', '1tbs', {
        allowSingleLine: false
      }],

      'space-in-parens': ['error', 'never'],

      'key-spacing': ['error', {
        beforeColon: false,
        afterColon: true
      }],

      'comma-style': ['error', 'last'],
      'operator-linebreak': ['error', 'before'],

      'space-unary-ops': ['error', {
        words: true,
        nonwords: false
      }],

      'space-infix-ops': 'error',
      'no-mixed-spaces-and-tabs': 'error',
      'comma-dangle': ['error', 'never'],
      'eol-last': ['error', 'always']
    }
  }]);
