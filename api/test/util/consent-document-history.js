'use strict';

const _ = require('lodash');

const History = require('./entity-history');

class ConsentDocumentHistory {
    constructor(userCount) {
        this.hxUser = new History();
        this.consentTypes = [];
        this.clientConsentDocuments = [];
        this.consentDocuments = [];
        this.activeConsentDocuments = [];
        this.signatures = _.range(userCount).map(() => []);
    }

    pushType(client, server) {
        const fullServer = Object.assign({}, client, server);
        this.consentTypes.push(fullServer);
        _.sortBy(this.consentTypes, 'id');
        this.activeConsentDocuments.push(null);
    }

    deleteType(typeIndex) {
        this.consentTypes.splice(typeIndex, 1);
        this.activeConsentDocuments.splice(typeIndex, 1);
    }

    typeId(typeIndex) {
        return this.consentTypes[typeIndex].id;
    }

    userId(userIndex) {
        return this.hxUser.id(userIndex);
    }

    listTypes() {
        return this.consentTypes;
    }

    type(typeIndex) {
        return this.consentTypes[typeIndex];
    }

    push(typeIndex, client, server) {
        const fullServer = Object.assign({}, client, server);
        if (!fullServer.updateComment) {
            fullServer.updateComment = null;
        }
        this.consentDocuments.push(fullServer);
        this.activeConsentDocuments[typeIndex] = fullServer;
    }

    id(typeIndex) {
        return this.activeConsentDocuments[typeIndex].id;
    }

    server(typeIndex) {
        return this.activeConsentDocuments[typeIndex];
    }

    serversInList(typeIndices) {
        const result = typeIndices.map(index => ({
            id: this.activeConsentDocuments[index].id,
            name: this.consentTypes[index].name,
            title: this.consentTypes[index].title
        }));
        return _.sortBy(result, 'id');
    }

    serversHistory() {
        return this.consentDocuments;
    }

    sign(typeIndex, userIndex) {
        const id = this.id(typeIndex);
        this.signatures[userIndex].push(id);
    }
}

module.exports = ConsentDocumentHistory;
