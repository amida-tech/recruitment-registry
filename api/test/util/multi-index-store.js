'use strict';

module.exports = class MultiIndexStore {
    constructor() {
        this.indexMap = new Map();
        this.store = [];
    }

    static key(indices) {
        return indices.map(index => index.toString()).join('-');
    }

    index(indices) {
        const key = MultiIndexStore.key(indices);
        return this.indexMap.get(key);
    }

    push(indices, obj) {
        const key = MultiIndexStore.key(indices);
        if (this.indexMap.has(key)) {
            throw new Error('Data with those indices are already pushed.');
        }
        const index = this.store.length;
        this.store.push(obj);
        this.indexMap.set(key, index);
    }

    update(indices, obj) {
        const index = this.index(indices);
        this.store[index] = obj;
    }

    get(indices) {
        const index = this.index(indices);
        return this.store[index];
    }
};
