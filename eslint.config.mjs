import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'docs/', 'coverage/']
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'always'],
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      '@typescript-eslint/member-ordering': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'eqeqeq': 'error',
      'no-console': 'error'
    }
  },
  {
    files: ['bench/**'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' }
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off'
    }
  }
);
