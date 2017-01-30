'use strict';

module.exports = {
    '0-3': { type: 'choice', logic: 'equals', count: 3 },
    '1-5': { type: 'choice', logic: 'not-equals', count: 1 },
    '2-3': { type: 'bool', logic: 'not-equals', count: 2 },
    '3-0': { type: 'text', logic: 'exists', count: 1 },
    '4-2': { type: 'text', logic: 'not-exists', count: 2 },
    '5-2': { type: 'choices', logic: 'equals', count: 1 },
    '6-1': { type: 'choices', logic: 'not-selected', count: 2, selectionCount: 2 },
    '7-3': { type: 'choices', logic: 'not-selected', count: 1, selectionCount: 1 },
    '8-4': { type: 'choices', logic: 'not-selected', count: 1, selectionCount: 3 },
    '8-5': { type: 'text', multipleSupport: true },
    '9-4': { type: 'choices', logic: 'each-not-selected', count: 1, selectionCount: 3 },
    '10-0': { type: 'choices', logic: 'each-not-selected', count: 4, selectionCount: 3 }
};
