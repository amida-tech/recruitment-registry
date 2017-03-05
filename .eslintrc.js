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
        'camelcase': 'warn',
    },
    'parserOptions': {
        'sourceType': 'script'
    }
};
