'use strict';

const _ = require('lodash');

module.exports = class MultiIndexStore {
    constructor() {
        this.currentIndexMap = new Map();
        this.historyIndexMap = new Map();
        this.store = [];
    }

    static key(indices) {
        return indices.map(index => index.toString()).join('-');
    }

    index(indices) {
        const key = MultiIndexStore.key(indices);
        return this.currentIndexMap.get(key);
    }

    set(indices, obj) {
        const key = MultiIndexStore.key(indices);
        let index = this.currentIndexMap.get(key);
        let indexHistory;
        if (index === undefined) {
            indexHistory = [];
            this.historyIndexMap.set(key, indexHistory);
        } else {
            this.store[index].deleted = true;
            indexHistory = this.historyIndexMap.get(key);
        }
        index = this.store.length;
        const value = { obj };
        indices.forEach((indexValue, indexIndex) => value[indexIndex] = indexValue);
        this.store.push(value);
        this.currentIndexMap.set(key, index);
        indexHistory.push(index);
    }

    get(indices) {
        const index = this.index(indices);
        const value = this.store[index];
        return value.obj;
    }

    getAll(indices) {
        const key = MultiIndexStore.key(indices);
        const keyIndices = this.historyIndexMap.get(key);
        return _.at(this.store, keyIndices).map(v => v.obj);
    }

    listFlatForIndex(indexIndex, indexValue) {
        const result = this.store.reduce((r, value) => {
            if ((value[indexIndex] === indexValue) && !value.deleted) {
                r.push(value);
            }
            return r;
        }, []);
        return _.flatten(result);
    }
};
