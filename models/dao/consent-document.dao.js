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

    static finalizeDocumentFields(document, fields, options) {
        const selected = _.omit(fields, 'id');
        const r = Object.assign(document, selected);
        if (!options.keepTypeId) {
            delete r.typeId;
        }
        return r;
    }

    listConsentDocuments(options = {}) {
        const typeIds = options.typeIds;
        const query = {
            raw: true,
            attributes: ['id', 'typeId'],
            order: 'id',
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
            .then((documents) => {
                if (options.summary) {
                    return documents;
                }
                return this.updateAllTexts(documents, options.language);
            })
            .then((documents) => {
                if (options.noTypeExpand) {
                    return documents;
                }
                const opt = {};
                if (options.transaction) {
                    opt.transaction = options.transaction;
                }
                if (typeIds && typeIds.length) {
                    opt.ids = typeIds;
                }
                if (options.language) {
                    opt.language = options.language;
                }
                return this.consentType.listConsentTypes(opt)
                    .then((types) => {
                        if (options.summary) {
                            return types.map(type => _.omit(type, 'type'));
                        }
                        return types;
                    })
                    .then((types) => {
                        if (types.length !== documents.length) {
                            return RRError.reject('noSystemConsentDocuments');
                        }
                        return _.keyBy(types, 'id');
                    })
                    .then((types) => {
                        if (options.typeOrder) {
                            const map = _.keyBy(documents, 'typeId');
                            const result = typeIds.map(typeId => ConsentDocumentDAO.finalizeDocumentFields(map[typeId], types[typeId], options));
                            return result;
                        }
                        documents.forEach((document) => {
                            const typeId = document.typeId;
                            ConsentDocumentDAO.finalizeDocumentFields(document, types[typeId], options);
                        });
                        return documents;
                    });
            });
    }

    createConsentDocument(input) {
        return sequelize.transaction((transaction) => {
            const typeId = input.typeId;
            return ConsentDocument.destroy({ where: { typeId }, transaction })
                .then(() => ConsentDocument.create(input, { transaction }))
                .then((result) => {
                    const textInput = { id: result.id };
                    textInput.content = input.content;
                    if (input.updateComment) {
                        textInput.updateComment = input.updateComment;
                    }
                    return this.createTextTx(textInput, transaction)
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
            attributes: ['id'],
        })
            .then((consentType) => {
                if (consentType) {
                    const typeId = consentType.id;
                    return ConsentDocument.findOne({
                        raw: true,
                        where: { typeId },
                        attributes: ['id', 'typeId'],
                    })
                        .then(result => this.updateText(result, options.language));
                }
                return RRError.reject('consentTypeNotFound');
            });
    }

    getUpdateCommentHistory(typeId, language) {
        return ConsentDocument.findAll({
            raw: true,
            attributes: ['id'],
            where: { typeId },
            order: 'id',
            paranoid: false,
        })
            .then(documents => this.updateAllTexts(documents, language))
            .then(documents => _.map(documents, 'updateComment'));
    }
};
