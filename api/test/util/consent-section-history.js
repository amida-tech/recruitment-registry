'use strict';

const _ = require('lodash');

const History = require('./entity-history');

class ConsentSectionHistory {
    constructor(userCount) {
        this.hxUser = new History();
        this.consentSectionTypes = [];
        this.clientConsentSections = [];
        this.consentSections = [];
        this.activeConsentSections = [];
        this.signatures = _.range(userCount).map(() => []);
    }

    pushType(client, server) {
        const fullServer = Object.assign({}, client, server);
        this.consentSectionTypes.push(fullServer);
        _.sortBy(this.consentSectionTypes, 'id');
        this.activeConsentSections.push(null);
    }

    deleteType(typeIndex) {
        this.consentSectionTypes.splice(typeIndex, 1);
        this.activeConsentSections.splice(typeIndex, 1);
    }

    typeId(typeIndex) {
        return this.consentSectionTypes[typeIndex].id;
    }

    userId(userIndex) {
        return this.hxUser.id(userIndex);
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
