// eslint.config.mjs
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import nextConfig from 'eslint-config-next'
import prettierConfig from 'eslint-config-prettier'

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  // 1. Nạp cấu hình Next.js mặc định (đã bao gồm plugin @next/next)
  // Giả sử nextConfig là một đối tượng config (hoặc mảng)
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/display-name': 'off',
      'no-console': 'warn',
      'no-lonely-if': 'warn',
      'no-unexpected-multiline': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  prettierConfig,
]

export default config
