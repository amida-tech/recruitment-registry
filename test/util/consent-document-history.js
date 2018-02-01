'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');

const History = require('./history');

module.exports = class ConsentDocumentHistory {
    constructor(userCount) {
        this.hxUser = new History();
        this.hxType = new History();
        this.hxDocument = new History();
        this.activeConsentDocuments = {};
        this.signatures = _.range(userCount).map(() => []);
        this.hxType.pushRemoveHook((index) => {
            this.activeConsentDocuments[index] = {};
        });
    }

    typeId(typeIndex) {
        return this.hxType.id(typeIndex);
    }

    userId(userIndex) {
        return this.hxUser.id(userIndex);
    }

    user(userIndex) {
        return this.hxUser.server(userIndex);
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

    serverWithSignatureInfo(userIndex, typeIndex) {
        const cd = _.cloneDeep(this.activeConsentDocuments[typeIndex]);
        const signature = this.signatures[userIndex].find(r => r.id === cd.id);
        if (signature) {
            cd.signature = true;
            cd.language = signature.language;
        } else {
            cd.signature = false;
        }
        return cd;
    }

    translatedServer(typeIndex, language) {
        const server = this.activeConsentDocuments[typeIndex];
        const tr = this.hxDocument.serverTranslation(server.id, language);
        return tr || server;
    }

    serversInList(typeIndices, options = {}) {
        const result = typeIndices.reduce((r, index) => {
            const type = this.hxType.server(index);
            const doc = {
                id: this.activeConsentDocuments[index].id,
                name: type.name,
                title: type.title,
            };
            const role = type.role;
            if (options.roleOnly && !role) {
                return r;
            }
            if (options.role && role && (role !== options.role)) {
                return r;
            }
            if (role) {
                doc.role = role;
            }
            if (options.detailed) {
                doc.type = type.type;
                doc.content = this.activeConsentDocuments[index].content;
                doc.updateComment = this.activeConsentDocuments[index].updateComment || '';
            }
            if (options.keepTypeId) {
                doc.typeId = type.id;
            }
            r.push(doc);
            return r;
        }, []);
        return _.sortBy(result, 'id');
    }

    listServers(options = {}) {
        let typeIndices = options.typeIndices;
        if (!typeIndices) {
            const allTypeIndices = Object.keys(this.activeConsentDocuments);
            typeIndices = allTypeIndices.filter((index) => {
                const doc = this.activeConsentDocuments[index];
                return !_.isEmpty(doc);
            });
        }
        let result;
        if (options.language) {
            result = this.translatedServersInList(typeIndices, {
                language: options.language,
                keepTypeId: true,
            });
        } else {
            result = this.serversInList(typeIndices, {
                keepTypeId: true,
                detailed: options.detailed,
                role: options.role,
                roleOnly: options.roleOnly,
            });
        }
        return _.sortBy(result, 'id');
    }

    getContents(ids) {
        const map = new Map();
        const n = this.hxType.length();
        _.range(n).forEach((index) => {
            const d = this.activeConsentDocuments[index];
            if (d) {
                map.set(d.id, d.content);
            }
        });
        return ids.map(id => map.get(id));
    }

    serversInListWithSigned(userIndex, options) {
        const signatureMap = new Map(this.signatures[userIndex].map(signature => [signature.id, signature]));
        const n = this.hxType.length();
        const result = _.range(n).reduce((r, index) => {
            const id = _.get(this.activeConsentDocuments[index], 'id');
            if (!id) {
                return r;
            }
            const { name, title, role } = this.hxType.server(index);
            if (options.roleOnly && !role) {
                return r;
            }
            if (options.role && role && (role !== options.role)) {
                return r;
            }
            const info = { id, name, title };
            if (role) {
                info.role = role;
            }
            const signature = signatureMap.get(info.id);
            if (!options.includeSigned) {
                if (!signature) {
                    r.push(info);
                }
                return r;
            }
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

    translatedServersInList(typeIndices, options) {
        const { language, keepTypeId } = options;
        const result = typeIndices.reduce((r, index) => {
            const type = this.hxType.translatedServer(index, language);
            const doc = {
                id: this.activeConsentDocuments[index].id,
                name: type.name,
                title: type.title,
            };
            const role = type.role;
            if (options.roleOnly && !role) {
                return r;
            }
            if (options.role && role && (role !== options.role)) {
                return r;
            }
            if (role) {
                doc.role = role;
            }
            if (keepTypeId) {
                doc.typeId = this.hxType.id(index);
            }
            r.push(doc);
            return r;
        }, []);
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
