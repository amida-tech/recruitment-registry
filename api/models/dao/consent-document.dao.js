'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');

const textTableMethods = require('./text-table-methods');

const sequelize = db.sequelize;
const ConsentType = db.ConsentType;
const ConsentDocument = db.ConsentDocument;
const ConsentSignature = db.ConsentSignature;

const textHandler = textTableMethods(sequelize, 'consent_document_text', 'consentDocumentId', ['content', 'updateComment']);

module.exports = class {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    listConsentDocuments(options) {
        const typeIds = options.typeIds;
        const query = {
            raw: true,
            attributes: ['id', 'typeId'],
            order: 'id'
        };
        if (options.transaction) {
            query.transaction = options.transaction;
        }
        if (typeIds && typeIds.length) {
            query.where = { typeId: { $in: typeIds } };
        }
        return ConsentDocument.findAll(query)
            .then(documents => {
                if (options.summary) {
                    return documents;
                } else {
                    return textHandler.updateAllTexts(documents, options.language);
                }
            })
            .then(documents => {
                const _options = {};
                if (options.transaction) {
                    _options.transaction = options.transaction;
                }
                if (typeIds && typeIds.length) {
                    _options.ids = typeIds;
                }
                if (options.language) {
                    _options.language = options.language;
                }
                return this.consentType.listConsentTypes(_options)
                    .then(types => {
                        if (options.summary) {
                            return types.map(type => _.omit(type, 'type'));
                        } else {
                            return types;
                        }
                    })
                    .then(types => {
                        if (types.length !== documents.length) {
                            return RRError.reject('noSystemConsentDocuments');
                        }
                        return _.keyBy(types, 'id');
                    })
                    .then(types => {
                        if (options.typeOrder) {
                            const map = _.keyBy(documents, 'typeId');
                            const result = typeIds.map(typeId => {
                                const fields = _.omit(types[typeId], 'id');
                                const r = Object.assign(map[typeId], fields);
                                delete r.typeId;
                                return r;
                            });
                            return result;
                        } else {
                            documents.forEach(document => {
                                const typeId = document.typeId;
                                const fields = _.omit(types[typeId], 'id');
                                Object.assign(document, fields);
                                delete document.typeId;
                            });
                            return documents;
                        }
                    });
            });
    }

    createConsentDocument(input) {
        return sequelize.transaction(tx => {
            const typeId = input.typeId;
            return ConsentDocument.destroy({ where: { typeId } }, { transaction: tx })
                .then(() => ConsentDocument.create(input, { transaction: tx }))
                .then(result => {
                    const textInput = { id: result.id };
                    textInput.content = input.content;
                    if (input.updateComment) {
                        textInput.updateComment = input.updateComment;
                    }
                    return textHandler.createTextTx(textInput, tx)
                        .then(({ id }) => ({ id }));
                });
        });
    }

    updateConsentDocumentText({ id, content, updateComment }, language) {
        return textHandler.createText({ id, content, updateComment, language });
    }

    getConsentDocument(id, options = {}) {
        return ConsentDocument.findById(id, { raw: true, attributes: ['id', 'typeId'] })
            .then(result => textHandler.updateText(result, options.language));
    }

    getConsentDocumentByTypeName(typeName, options = {}) {
        return ConsentType.findOne({
                raw: true,
                where: { name: typeName },
                attributes: ['id']
            })
            .then(consentType => {
                if (consentType) {
                    const typeId = consentType.id;
                    return ConsentDocument.findOne({
                            raw: true,
                            where: { typeId },
                            attributes: ['id', 'typeId']
                        })
                        .then(result => textHandler.updateText(result, options.language));
                } else {
                    return RRError.reject('consentTypeNotFound');
                }
            });
    }

    _fillSignature(result, userId, id) {
        return ConsentSignature.findOne({
                where: { userId, consentDocumentId: id },
                raw: true,
                attributes: ['language']
            })
            .then(signature => {
                if (signature) {
                    result.signature = true;
                    result.language = signature.language;
                } else {
                    result.signature = false;
                }
                return result;
            });
    }

    getSignedConsentDocument(userId, id, options) {
        return this.getConsentDocument(id, options)
            .then(result => this._fillSignature(result, userId, id));
    }

    getSignedConsentDocumentByTypeName(userId, typeName, options = {}) {
        return this.getConsentDocumentByTypeName(typeName, options)
            .then(result => this._fillSignature(result, userId, result.id));
    }

    getUpdateCommentHistory(typeId, language) {
        return ConsentDocument.findAll({
                raw: true,
                attributes: ['id'],
                where: { typeId },
                order: 'id',
                paranoid: false
            })
            .then(documents => textHandler.updateAllTexts(documents, language))
            .then(documents => _.map(documents, 'updateComment'));
    }
};
