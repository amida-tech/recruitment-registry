'use strict';

const _ = require('lodash');

const db = require('../db');

const RRError = require('../../lib/rr-error');

const Translatable = require('./translatable');

const sequelize = db.sequelize;
const ConsentType = db.ConsentType;
const ConsentDocument = db.ConsentDocument;

module.exports = class ConsentDocumentDAO extends Translatable {
    constructor(dependencies) {
        super('consent_document_text', 'consentDocumentId', ['content', 'updateComment']);
        Object.assign(this, dependencies);
    }

    listConsentDocuments(options = {}) {
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
        if (options.hasOwnProperty('paranoid')) {
            query.paranoid = options.paranoid;
        }
        return ConsentDocument.findAll(query)
            .then(documents => {
                if (options.summary) {
                    return documents;
                } else {
                    return this.updateAllTexts(documents, options.language);
                }
            })
            .then(documents => {
                if (options.noTypeExpand) {
                    return documents;
                }
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
                    return this.createTextTx(textInput, tx)
                        .then(({ id }) => ({ id }));
                });
        });
    }

    updateConsentDocumentText({ id, content, updateComment }, language) {
        return this.createText({ id, content, updateComment, language });
    }

    getConsentDocument(id, options = {}) {
        return ConsentDocument.findById(id, { raw: true, attributes: ['id', 'typeId'] })
            .then(result => this.updateText(result, options.language));
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
                        .then(result => this.updateText(result, options.language));
                } else {
                    return RRError.reject('consentTypeNotFound');
                }
            });
    }

    getUpdateCommentHistory(typeId, language) {
        return ConsentDocument.findAll({
                raw: true,
                attributes: ['id'],
                where: { typeId },
                order: 'id',
                paranoid: false
            })
            .then(documents => this.updateAllTexts(documents, language))
            .then(documents => _.map(documents, 'updateComment'));
    }
};
