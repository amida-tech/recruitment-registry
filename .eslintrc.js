module.exports = {
    'extends': 'airbnb-base',
    'plugins': [
        'import'
    ],
    'rules': {
        'indent': ['error', 4],
        'func-names': ['error', 'as-needed'],
        'prefer-arrow-callback': ['error', { 'allowNamedFunctions': true }],
        //'no-param-reassign': ['error', { // r is used in array.reduce like accumulator patterns
        //    'props': true, 'ignorePropertyModificationsFor': ['req', 'res', 'p', 'r']
        //}],
        'no-param-reassign': 'off',
        'max-len': 'off',
    },
    'parserOptions': {
        'sourceType': 'script'
    }
};
