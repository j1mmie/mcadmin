// @ts-check

import eslint from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser/dist/parser'
import stylisticTs from '@stylistic/eslint-plugin-ts'

export default [
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json', // Ensure this points to your tsconfig.json file
        tsconfigRootDir: import.meta.dirname, // Root directory for the tsconfig.json
        ecmaVersion: 'latest', // Adjust according to your needs
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@stylistic/ts': stylisticTs,
    },
    rules: {
      'semi': ['error', 'never'],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'key-spacing': [
        'warn',
        {
          afterColon: true,
          mode: 'minimum',
        },
      ],
      'no-case-declarations': 'off',
      'no-fallthrough': [
        'error',
        {
          commentPattern: 'intentional fallthrough',
        },
      ],
      'arrow-spacing': 'error',
      'object-curly-spacing': ['error', 'always'],
      'no-unused-expressions': 'error',
      'no-unsafe-negation': ['error'],
      'strict': 'error',
      'require-await': 'error',
      'eqeqeq': ['error', 'smart'],
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: true,
          allowNumber: true,
          allowNullableObject: true,
          allowNullableNumber: false,
          allowNullableString: true,
          allowNullableBoolean: true,
          allowAny: false,
        },
      ],
      '@stylistic/ts/type-annotation-spacing': [
        'error',
        {
          before: true,
          after: true,
          overrides: {
            arrow: {
              before: true,
              after: true,
            },
          },
        },
      ],
    },
  },
]
