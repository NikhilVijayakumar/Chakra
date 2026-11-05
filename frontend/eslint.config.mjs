import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/dist-lib', '**/out', '**/coverage', 'e2e'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  { settings: { react: { version: 'detect' } } },
  { files: ['**/*.{ts,tsx}'], plugins: { 'react-hooks': eslintPluginReactHooks }, rules: { ...eslintPluginReactHooks.configs.recommended.rules, 'react-hooks/set-state-in-effect': 'warn' } },
  eslintConfigPrettier,
  {
    rules: { '@typescript-eslint/explicit-function-return-type': 'off' }
  },
  { files: ['**/*.test.{ts,tsx}'], rules: { '@typescript-eslint/no-explicit-any': 'off' } }
)
