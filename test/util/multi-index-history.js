'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const History = require('./history');

module.exports = class MultiIndexHistory {
    constructor() {
        this.indexMap = new Map();
        this.history = new History();
    }

    static key(indices) {
        return indices.map(index => index.toString()).join('-');
    }

    index(indices) {
        const key = MultiIndexHistory.key(indices);
        return this.indexMap.get(key);
    }

    pushWithId(indices, client, id) {
        const key = MultiIndexHistory.key(indices);
        if (this.indexMap.has(key)) {
            throw new Error('Data with those indices are already pushed.');
        }
        const index = this.history.pushWithId(client, id);
        this.indexMap.set(key, index);
    }

    client(indices) {
        const index = this.index(indices);
        return this.history.client(index);
    }

    server(indices) {
        const index = this.index(indices);
        return this.history.server(index);
    }

    id(indices) {
        const index = this.index(indices);
        return this.history.id(index);
    }

    listServers() {
        return this.history.listServers();
    }
};
