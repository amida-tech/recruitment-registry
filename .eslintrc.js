'use strict';

module.exports = {
    extends: 'airbnb-base',
    plugins: [
        'import',
    ],
    rules: {
        indent: ['error', 4],
        'func-names': ['error', 'as-needed'],
        'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
        'no-param-reassign': ['error', { // p, q, r are used in accumulator patterns
            props: true, ignorePropertyModificationsFor: ['req', 'res', 'p', 'q', 'r'],
        }],
    },
    parserOptions: {
        sourceType: 'script',
    },
};
