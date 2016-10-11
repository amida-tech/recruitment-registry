'use strict';

const _ = require('lodash');

const RRError = require('../lib/rr-error');

module.exports = function (sequelize, DataTypes) {
    const ConsentSection = sequelize.define('consent_section', {
        typeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'type_id',
            references: {
                model: 'consent_section_type',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        updateComment: {
            type: DataTypes.TEXT,
            field: 'update_comment'
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
            listConsentSections: function (typeIds, tx) {
                const query = {
                    raw: true,
                    attributes: ['id', 'name', 'title'],
                    order: 'id'
                };
                if (typeIds && typeIds.length) {
                    query.where = { id: { in: typeIds } };
                }
                if (tx) {
                    query.transaction = tx;
                }
                return sequelize.models.consent_section_type.findAll(query)
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
                        return ConsentSection.findAll(query)
                            .then(docs => {
                                if (docs.length !== typeIds.length) {
                                    return RRError.reject('noSystemConsentSections');
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
            createConsentSection: function (input) {
                return sequelize.transaction(function (tx) {
                    const typeId = input.typeId;
                    return ConsentSection.destroy({ where: { typeId } }, { transaction: tx })
                        .then(() => ConsentSection.create(input, { transaction: tx })
                            .then(({ id }) => ({ id }))
                        );
                });
            },
            getConsentSection: function (id) {
                return ConsentSection.findById(id, { raw: true, attributes: ['id', 'typeId', 'content', 'updateComment'] });
            }
        }
    });

    return ConsentSection;
};
