/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.turbo/**',
    '**/coverage/**'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['@typescript-eslint', 'import', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  settings: {
    react: {
      version: '18.3'
    },
    'import/resolver': {
      typescript: true
    }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { "prefer": "type-imports" }
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { "argsIgnorePattern": "^_" }
    ]
  },
  overrides: [
    {
      files: ['apps/web/**/*.{ts,tsx}'],
      env: {
        browser: true,
        node: false,
        es2022: true
      }
    },
    {
      files: ['apps/api/**/*.ts'],
      env: {
        browser: false,
        node: true,
        es2022: true
      }
    }
  ]
};
