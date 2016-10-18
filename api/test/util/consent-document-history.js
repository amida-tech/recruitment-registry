'use strict';

const _ = require('lodash');

const History = require('./entity-history');

class ConsentDocumentHistory {
    constructor(userCount) {
        this.hxUser = new History();
        this.hxType = new History();
        this.hxDocument = new History();
        this.clientConsentDocuments = [];
        this.activeConsentDocuments = [];
        this.signatures = _.range(userCount).map(() => []);
    }

    pushType(client, server) {
        this.hxType.pushWithId(client, server.id);
        this.activeConsentDocuments.push(null);
    }

    deleteType(typeIndex) {
        this.hxType.remove(typeIndex);
    }

    typeId(typeIndex) {
        return this.hxType.id(typeIndex);
    }

    userId(userIndex) {
        return this.hxUser.id(userIndex);
    }

    listTypes() {
        return this.hxType.listServers();
    }

    type(typeIndex) {
        return this.hxType.server(typeIndex);
    }

    push(typeIndex, client, server) {
        const fullServer = Object.assign({}, client, server);
        if (!fullServer.updateComment) {
            fullServer.updateComment = null;
        }
        this.hxDocument.push(client, fullServer);
        this.activeConsentDocuments[typeIndex] = fullServer;
    }

    id(typeIndex) {
        return this.activeConsentDocuments[typeIndex].id;
    }

    server(typeIndex) {
        return this.activeConsentDocuments[typeIndex];
    }

    serversInList(typeIndices) {
        const result = typeIndices.map(index => {
            const type = this.hxType.server(index);
            return {
                id: this.activeConsentDocuments[index].id,
                name: type.name,
                title: type.title
            };
        });
        return _.sortBy(result, 'id');
    }

    translatedServersInList(typeIndices, language) {
        const result = typeIndices.map(index => {
            const type = this.hxType.translatedServer(index, language);
            return {
                id: this.activeConsentDocuments[index].id,
                name: type.name,
                title: type.title
            };
        });
        return _.sortBy(result, 'id');
    }

    serversHistory() {
        return this.hxDocument.history;
    }

    sign(typeIndex, userIndex, language) {
        const id = this.id(typeIndex);
        language = language || 'en';
        this.signatures[userIndex].push({ id, language });
    }
}

module.exports = ConsentDocumentHistory;
