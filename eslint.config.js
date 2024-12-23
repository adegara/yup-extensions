import semivanTsEslintConfig from '@semivan/eslint-config-ts';

export default [
    ...semivanTsEslintConfig(),
    {
        ignores: ['**/dist/**'],
    },
    {
        name: 'local-rules',
        rules: {
            'func-names': 'off',
        },
    },
];
