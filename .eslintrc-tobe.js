module.exports = {
    'extends': 'airbnb-base',
    'plugins': [
        'import'
    ],
    'rules': {
        'indent': ['error', 4],
        'func-names': ['error', 'as-needed'],
        'prefer-arrow-callback': ['error', { 'allowNamedFunctions': true }],
    },
    'parserOptions': {
        'sourceType': 'script'
    }
};
