'use strict';

const _ = require('lodash');

module.exports = class MultiIndexStore {
    constructor() {
        this.historyIndexMap = new Map();
        this.store = [];
    }

    static key(userIndex, surveyIndex) {
        return `${userIndex}-${surveyIndex}`;
    }

    push(userIndex, surveyIndex, obj) {
        const key = MultiIndexStore.key(userIndex, surveyIndex);
        let indexHistory = this.historyIndexMap.get(key);
        if (indexHistory === undefined) {
            indexHistory = [];
            this.historyIndexMap.set(key, indexHistory);
        } else {
            const lastIndex = indexHistory[indexHistory.length - 1];
            this.store[lastIndex].deleted = true;
        }
        const index = this.store.length;
        const value = Object.assign({ userIndex, surveyIndex }, obj);
        this.store.push(value);
        indexHistory.push(index);
    }

    getLast(userIndex, surveyIndex) {
        const all = this.getAll(userIndex, surveyIndex);
        const length = all.length;
        return all[length - 1];
    }

    getAll(userIndex, surveyIndex) {
        const key = MultiIndexStore.key(userIndex, surveyIndex);
        const keyIndices = this.historyIndexMap.get(key);
        if (!keyIndices) {
            return [];
        }
        return _.at(this.store, keyIndices);
    }

    listFlatForUser(userIndex) {
        const result = this.store.reduce((r, value) => {
            if ((value.userIndex === userIndex) && !value.deleted) {
                r.push(value);
            }
            return r;
        }, []);
        return _.flatten(result);
    }
};
