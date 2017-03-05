module.exports = {
    'extends': 'airbnb-base',
    'plugins': [
        'import'
    ],
    'rules': {
        'indent': ['error', 4],
        'func-names': ['warn', 'as-needed'],
        'no-param-reassign': 'off',
        'class-methods-use-this': 'off',
        'no-shadow': 'off',
        'max-len': 'off',
        'global-require': 'warn',
        'prefer-const': 'warn',
        'camelcase': 'warn',
        'no-useless-concat': 'warn',
        'no-template-curly-in-string': 'warn',
        'import/no-unresolved': 'warn',
        'no-restricted-syntax': 'warn',
        'default-case': 'warn',
        'import/no-dynamic-require': 'warn',
        'no-use-before-define': 'warn',
        'import/no-extraneous-dependencies': 'warn'
    },
    'parserOptions': {
        'sourceType': 'script'
    }
};
