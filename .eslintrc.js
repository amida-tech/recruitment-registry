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
        'camelcase': 'warn',
        'import/no-unresolved': 'warn',
        'import/no-dynamic-require': 'warn',
        'import/no-extraneous-dependencies': 'warn'
    },
    'parserOptions': {
        'sourceType': 'script'
    }
};
