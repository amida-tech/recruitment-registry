'use strict';

module.exports = {
    '0-5': { type: 'text', purpose: 'enableWhen', logic: 'not-equals', relativeIndex: 1 },
    '1-5': { type: 'text', purpose: 'enableWhen', logic: 'not-equals', relativeIndex: 1 },
    '2-2': { type: 'choice', purpose: 'type' },
    '2-3': { type: 'choice', purpose: 'enableWhen', logic: 'equals', relativeIndex: 1 },
    '3-3': { type: 'choice', logic: 'not-equals', count: 3, purpose: 'toEnableWhen' },
    '4-5': { type: 'choice', logic: 'equals', count: 1, purpose: 'toEnableWhen' },
    '5-3': { type: 'bool', logic: 'equals', count: 2, purpose: 'toEnableWhen' },
    '6-0': { type: 'text', logic: 'not-exists', count: 1, purpose: 'toEnableWhen' },
    '7-2': { type: 'text', logic: 'exists', count: 2, purpose: 'toEnableWhen' }
};
