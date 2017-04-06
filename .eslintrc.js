module.exports = {
    'extends': 'airbnb-base',
    'plugins': [
        'import'
    ],
    'rules': {
        'indent': ['error', 4],
        'func-names': ['error', 'as-needed'],
        'prefer-arrow-callback': ['error', { 'allowNamedFunctions': true }],
        'no-param-reassign': 'off',
        'class-methods-use-this': 'off',
        'no-shadow': 'off',
        'max-len': 'off',
    },
    'parserOptions': {
        'sourceType': 'script'
    }
};
