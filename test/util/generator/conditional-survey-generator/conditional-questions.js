'use strict';

module.exports = {
    '10-5': { type: 'text', purpose: 'enableWhen', logic: 'not-equals', relativeIndex: 1 },
    '11-5': { type: 'text', purpose: 'enableWhen', logic: 'not-equals', relativeIndex: 1 },
    '12-2': { type: 'choice', purpose: 'type' },
    '12-3': { type: 'choice', purpose: 'enableWhen', logic: 'equals', relativeIndex: 1 },
    '13-3': { type: 'choice', logic: 'not-equals', count: 3, purpose: 'toEnableWhen' },
    '14-5': { type: 'choice', logic: 'equals', count: 1, purpose: 'toEnableWhen' },
    '15-3': { type: 'bool', logic: 'equals', count: 2, purpose: 'toEnableWhen' },
    '16-0': { type: 'text', logic: 'not-exists', count: 1, purpose: 'toEnableWhen' },
    '17-2': { type: 'text', logic: 'exists', count: 2, purpose: 'toEnableWhen' }
};
