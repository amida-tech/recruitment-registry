'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');

const textTableMethods = require('./text-table-methods');

module.exports = function (sequelize, DataTypes) {
    const textHandler = textTableMethods(sequelize, 'consent_document_text', 'consentDocumentId', ['content', 'updateComment']);

    const ConsentDocument = sequelize.define('consent_document', {
        typeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'type_id',
            references: {
                model: 'consent_type',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deleteAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        classMethods: {
            listConsentDocuments: function (options) {
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
                            return textHandler.updateAllTexts(documents);
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
                        return sequelize.models.consent_type.listConsentTypes(_options)
                            .then(types => {
                                if (types.length !== documents.length) {
                                    return RRError.reject('noSystemConsentDocuments');
                                }
                                return _.keyBy(types, 'id');
                            })
                            .then(types => {
                                documents.forEach(document => {
                                    const typeId = document.typeId;
                                    const { name, title } = types[typeId];
                                    Object.assign(document, { name, title });
                                    delete document.typeId;
                                });
                                return documents;
                            });
                    });
            },
            getConsentDocumentsOfTypes: function (options) {
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
                    .then(documents => textHandler.updateAllTexts(documents))
                    .then(documents => _.keyBy(documents, 'typeId'))
                    .then(documents => {
                        const ConsentType = sequelize.models.consent_type;
                        return ConsentType.listConsentTypes({
                                ids: typeIds
                            })
                            .then(types => _.keyBy(types, 'id'))
                            .then(types => {
                                return typeIds.map(typeId => {
                                    const d = documents[typeId];
                                    if (!d) {
                                        return null;
                                    }
                                    return Object.assign(types[typeId], _.omit(d, 'typeId'));
                                });
                            });
                    });
            },
            createConsentDocument: function (input) {
                return sequelize.transaction(function (tx) {
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
            },
            getConsentDocument: function (id) {
                return ConsentDocument.findById(id, { raw: true, attributes: ['id', 'typeId'] })
                    .then(result => textHandler.updateText(result));
            },
            getUpdateCommentHistory: function (typeId) {
                return ConsentDocument.findAll({
                        raw: true,
                        attributes: ['id'],
                        where: { typeId },
                        order: 'id',
                        paranoid: false
                    })
                    .then(documents => textHandler.updateAllTexts(documents))
                    .then(documents => _.map(documents, 'updateComment'));
            }
        }
    });

    return ConsentDocument;
};
