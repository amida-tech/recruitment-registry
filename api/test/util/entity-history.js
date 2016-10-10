'use strict';

const _ = require('lodash');

class History {
    constructor() {
        this.clients = [];
        this.servers = [];
        this.history = [];
        this.currentIndex = [];
        this.removed = [];
    }

    push(client, server) {
        const index = this.clients.length;
        this.clients.push(client);
        this.servers.push(server);
        this.history.push(server);
        this.currentIndex.push(index);
    }

    remove(index) {
        const currentIndex = this.currentIndex[index];
        if (currentIndex >= 0) {
            this.clients.splice(currentIndex, 1);
            const removed = this.servers.splice(currentIndex, 1);
            this.removed.push(...removed);
            this.currentIndex[index] = -this.removed.length;
            _.range(index + 1, this.currentIndex.length).forEach(i => {
                if (this.currentIndex[i] >= 0) {
                    this.currentIndex[i] = this.currentIndex[i] - 1;
                }
            });
        }
    }

    replace(index, client, server) {
        this.push(client, server);
        this.remove(index);
    }

    id(index) {
        return this.history[index].id;
    }

    client(index) {
        const currentIndex = this.currentIndex[index];
        return this.clients[currentIndex];
    }

    server(index) {
        return this.history[index];
    }

    clientList() {
        return this.clients;
    }

    serverList() {
        return this.servers;
    }
}

module.exports = History;
