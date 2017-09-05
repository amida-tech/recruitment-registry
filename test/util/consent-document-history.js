'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');

const History = require('./history');

module.exports = class ConsentDocumentHistory {
    constructor(userCount) {
        this.hxUser = new History();
        this.hxType = new History();
        this.hxDocument = new History();
        this.activeConsentDocuments = [];
        this.signatures = _.range(userCount).map(() => []);
    }

    pushType(client, server) {
        this.hxType.pushWithId(client, server.id);
        this.activeConsentDocuments.push(null);
    }

    deleteType(typeIndex) {
        this.hxType.remove(typeIndex);
        this.activeConsentDocuments[typeIndex] = {};
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

    translatedType(typeIndex, language) {
        return this.hxType.translatedServer(typeIndex, language);
    }

    push(typeIndex, client, server) {
        const fullServer = Object.assign({}, client, server);
        if (!fullServer.updateComment) {
            fullServer.updateComment = '';
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

    translatedServer(typeIndex, language) {
        const server = this.activeConsentDocuments[typeIndex];
        const tr = this.hxDocument.serverTranslation(server.id, language);
        return tr || server;
    }

    serversInList(typeIndices, keepTypeId) {
        const result = typeIndices.map((index) => {
            const type = this.hxType.server(index);
            const doc = {
                id: this.activeConsentDocuments[index].id,
                name: type.name,
                title: type.title,
            };
            if (keepTypeId) {
                doc.typeId = type.id;
            }
            return doc;
        });
        return _.sortBy(result, 'id');
    }

    getContents(ids) {
        const map = new Map();
        this.activeConsentDocuments.forEach((d) => {
            if (d) {
                map.set(d.id, d.content);
            }
        });
        return ids.map(id => map.get(id));
    }

    serversInListWithSigned(userIndex) {
        const signatureMap = new Map(this.signatures[userIndex].map(signature => [signature.id, signature]));
        const result = this.activeConsentDocuments.reduce((r, { id }, index) => {
            if (!id) {
                return r;
            }
            const { name, title } = this.hxType.server(index);
            const info = { id, name, title };
            const signature = signatureMap.get(info.id);
            if (signature) {
                info.signature = true;
                info.language = signature.language;
            } else {
                info.signature = false;
            }
            r.push(info);
            return r;
        }, []);
        return _.sortBy(result, 'id');
    }

    translatedServersInList(typeIndices, language) {
        const result = typeIndices.map((index) => {
            const type = this.hxType.translatedServer(index, language);
            return {
                id: this.activeConsentDocuments[index].id,
                name: type.name,
                title: type.title,
            };
        });
        return _.sortBy(result, 'id');
    }

    serversHistory() {
        return this.hxDocument.history;
    }

    translatedServersHistory(language) {
        return this.hxDocument.translatedHistory(language);
    }

    sign(typeIndex, userIndex, language) {
        const id = this.id(typeIndex);
        language = language || 'en';
        this.signatures[userIndex].push({ id, language });
    }
};
