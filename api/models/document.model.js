'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');

module.exports = function (sequelize, DataTypes) {
    const Document = sequelize.define('document', {
        typeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'type_id',
            references: {
                model: 'document_type',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
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
            listDocuments: function (typeIds, tx) {
                const query = {
                    raw: true,
                    attributes: ['id', 'description'],
                    order: 'id'
                };
                if (typeIds && typeIds.length) {
                    query.where = { id: { in: typeIds } };
                }
                if (tx) {
                    query.transaction = tx;
                }
                return sequelize.models.document_type.findAll(query)
                    .then(docTypes => {
                        if (!(typeIds && typeIds.length)) {
                            typeIds = _.map(docTypes, 'id');
                        }
                        const query = {
                            where: { typeId: { in: typeIds } },
                            raw: true,
                            attributes: ['id', 'typeId'],
                            order: 'id'
                        };
                        if (tx) {
                            query.transaction = tx;
                        }
                        return Document.findAll(query)
                            .then(docs => {
                                if (docs.length !== typeIds.length) {
                                    return RRError.reject('documentNoSystemDocuments');
                                } else {
                                    const docTypeMap = _.keyBy(docTypes, 'id');
                                    return docs.map(({ id, typeId }) => {
                                        const { description } = docTypeMap[typeId];
                                        return { id, description };
                                    });
                                }
                            });
                    });
            },
            createDocument: function ({ typeId, content }) {
                return sequelize.transaction(function (tx) {
                    return Document.destroy({ where: { typeId } }, { transaction: tx })
                        .then(() => Document.create({ typeId, content }, { transaction: tx })
                            .then(({ id }) => ({ id }))
                        );
                });
            },
            getContent: function (id) {
                return Document.findById(id, { raw: true, attributes: ['content'] });
            }
        }
    });

    return Document;
};
