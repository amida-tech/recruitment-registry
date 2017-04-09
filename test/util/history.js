'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');

class History {
    constructor(listFields) {
        this.clients = [];
        this.servers = [];
        this.history = [];
        this.currentIndex = [];
        this.removed = [];
        this.listFields = listFields;
        this.translations = {};
    }

    reset() {
        this.clients = [];
        this.servers = [];
        this.history = [];
        this.currentIndex = [];
        this.removed = [];
        this.translations = {};
    }

    push(client, server) {
        const index = this.clients.length;
        this.clients.push(client);
        this.servers.push(server);
        this.history.push(server);
        this.currentIndex.push(index);
        return index;
    }

    pushWithId(client, id) {
        const server = Object.assign({}, client, { id });
        return this.push(client, server);
    }

    remove(index) {
        const currentIndex = this.currentIndex[index];
        if (currentIndex >= 0) {
            this.clients.splice(currentIndex, 1);
            const removed = this.servers.splice(currentIndex, 1);
            this.removed.push(...removed);
            this.currentIndex[index] = -this.removed.length;
            _.range(index + 1, this.currentIndex.length).forEach((i) => {
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

    lastId() {
        return this.history[this.history.length - 1].id;
    }

    lastServer() {
        return this.history[this.history.length - 1];
    }

    lastIndex() {
        return this.history.length - 1;
    }

    length() {
        return this.history.length;
    }

    client(index) {
        const currentIndex = this.currentIndex[index];
        return this.clients[currentIndex];
    }

    server(index) {
        return this.history[index];
    }

    listClients() {
        return this.clients;
    }

    listServers(fields, indices) {
        let list;
        if (indices) {
            list = indices.map(index => this.server(index));
        } else {
            list = this.servers;
        }
        fields = fields || this.listFields;
        if (fields) {
            list = list.map(element => _.pick(element, fields));
        }
        return list;
    }

    updateClient(index, client) {
        const currentIndex = this.currentIndex[index];
        this.clients[currentIndex] = client;
    }

    updateServer(index, server) {
        const currentIndex = this.currentIndex[index];
        this.servers[currentIndex] = server;
        this.history[index] = server;
    }

    updateLastServer(server) {
        this.updateServer(this.history.length - 1, server);
    }

    reloadServer(server) {
        const id = server.id;
        [this.history, this.servers, this.removed].forEach((collection) => {
            const index = _.findLastIndex(collection, { id });
            if (index >= 0) {
                collection[index] = server;
            }
        });
    }

    translate(index, language, translation) {
        const server = this.history[index];
        const id = server.id;
        const r = _.merge({}, server, translation);
        _.set(this.translations, `${id}.${language}`, r);
    }

    translateWithServer(server, language, translation) {
        const id = server.id;
        const r = _.merge({}, server, translation);
        _.set(this.translations, `${id}.${language}`, r);
    }

    translatedServer(index, language) {
        const server = this.history[index];
        const id = server.id;
        const tr = _.get(this.translations, `${id}.${language}`);
        return tr || server;
    }

    translatedHistory(language) {
        return this.history.map((server) => {
            const id = server.id;
            const tr = _.get(this.translations, `${id}.${language}`);
            return tr || server;
        });
    }

    serverTranslation(id, language) {
        return _.get(this.translations, `${id}.${language}`);
    }

    listTranslatedServers(language) {
        let result = this.servers;
        result = result.map((server) => {
            const id = server.id;
            const tr = _.get(this.translations, `${id}.${language}`);
            return tr || server;
        });
        if (this.listFields) {
            result = result.map(element => _.pick(element, this.listFields));
        }
        return result;
    }
}

module.exports = History;
