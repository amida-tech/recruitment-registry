'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

module.exports = class TypedIndexSet {
    constructor() {
        this.indexSets = new Map();
    }

    findIndexSetForType(type) {
        const indexSet = this.indexSets.get(type);
        if (indexSet) {
            return indexSet;
        }
        const newIndexSet = new Set();
        this.indexSets.set(type, newIndexSet);
        return newIndexSet;
    }

    addIndex(type, index) {
        const indexSet = this.findIndexSetForType(type);
        indexSet.add(index);
    }

    addIndices(type, indices) {
        const indexSet = this.findIndexSetForType(type);
        indices.forEach(index => indexSet.add(index));
    }

    has(type, index) {
        const indexSet = this.findIndexSetForType(type);
        return indexSet.has(index);
    }
};
