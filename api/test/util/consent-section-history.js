'use strict';

const _ = require('lodash');

class ConsentSectionHistory {
    constructor(userCount) {
        this.users = [];
        this.consentSectionTypes = [];
        this.clientConsentSections = [];
        this.consentSections = [];
        this.activeConsentSections = [];
        this.signatures = _.range(userCount).map(() => []);
    }

    pushType(client, server) {
        const fullServer = Object.assign({}, client, server);
        this.consentSectionTypes.push(fullServer);
        this.activeConsentSections.push(null);
    }

    typeId(typeIndex) {
        return this.consentSectionTypes[typeIndex].id;
    }

    userId(userIndex) {
        return this.users[userIndex];
    }

    listTypes() {
        return this.consentSectionTypes;
    }

    push(typeIndex, client, server) {
        const fullServer = Object.assign({}, client, server);
        this.consentSections.push(fullServer);
        this.activeConsentSections[typeIndex] = fullServer;
    }

    id(typeIndex) {
        return this.activeConsentSections[typeIndex].id;
    }

    server(typeIndex) {
        return this.activeConsentSections[typeIndex];
    }

    serversInList(typeIndices) {
        const result = typeIndices.map(index => ({
            id: this.activeConsentSections[index].id,
            name: this.consentSectionTypes[index].name,
            title: this.consentSectionTypes[index].title
        }));
        return _.sortBy(result, 'id');
    }

    sign(typeIndex, userIndex) {
        const id = this.id(typeIndex);
        this.signatures[userIndex].push(id);
    }
}

module.exports = ConsentSectionHistory;
