import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig([
    // JS + TS setup
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            prettier: prettierPlugin,
        },
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended, // ✅ use spread here (no .rules)
            prettierConfig,
        ],
        rules: {
            'prettier/prettier': [
                'error',
                {
                    semi: true,
                    singleQuote: true,
                    tabWidth: 4,
                    useTabs: false,
                    trailingComma: 'es5',
                    printWidth: 100,
                    bracketSpacing: true,
                    arrowParens: 'always',
                },
            ],
        },
    },
]);
