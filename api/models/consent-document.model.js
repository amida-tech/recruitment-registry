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
            listConsentDocuments: function (typeIds, tx) {
                const options = {};
                if (typeIds && typeIds.length) {
                    options.ids = typeIds;
                }
                if (tx) {
                    options.transaction = tx;
                }
                return sequelize.models.consent_type.listConsentTypes(options)
                    .then(docTypes => {
                        if (!(typeIds && typeIds.length)) {
                            typeIds = _.map(docTypes, 'id');
                        }
                        const query = {
                            where: { typeId: { $in: typeIds } },
                            raw: true,
                            attributes: ['id', 'typeId'],
                            order: 'id'
                        };
                        if (tx) {
                            query.transaction = tx;
                        }
                        return ConsentDocument.findAll(query)
                            .then(docs => {
                                if (docs.length !== typeIds.length) {
                                    return RRError.reject('noSystemConsentDocuments');
                                } else {
                                    const docTypeMap = _.keyBy(docTypes, 'id');
                                    return docs.map(({ id, typeId }) => {
                                        const { name, title } = docTypeMap[typeId];
                                        return { id, name, title };
                                    });
                                }
                            });
                    });
            },
            getConsentDocumentsOfTypes: function (typeIds) {
                return ConsentDocument.findAll({
                        raw: true,
                        attributes: ['id', 'typeId'],
                        where: { typeId: { $in: typeIds } }
                    })
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
