// @ts-check
import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config({
    files: ['src/**/*.ts'],
    extends: [
        eslint.configs.recommended,
        tseslint.configs.recommended,
        prettierConfig
    ],
    rules: {
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@/object-curly-spacing': ['error', 'never'],
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@/semi': ['error', 'always'],
    }
});
