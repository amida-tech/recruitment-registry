'use strict';

const RRError = require('../lib/rr-error');

const textTableMethods = require('./text-table-methods');

module.exports = function (sequelize, DataTypes) {
    const textHandler = textTableMethods(sequelize, 'consent_type_text', 'consentTypeId', ['title']);

    const ConsentType = sequelize.define('consent_type', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
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
            listConsentTypes: function (options = {}) {
                const query = {
                    raw: true,
                    attributes: ['id', 'name', 'type'],
                    order: 'name'
                };
                if (options.ids) {
                    query.where = { id: { $in: options.ids } };
                }
                if (options.transaction) {
                    query.transaction = options.transaction;
                }
                return ConsentType.findAll(query)
                    .then(types => textHandler.updateAllTexts(types));
            },
            createConsentType: function ({ name, title, type }) {
                return ConsentType.create({ name, type })
                    .then(({ id }) => textHandler.createText({ id, title }))
                    .then(({ id }) => ({ id }));
            },
            deleteConsentType: function (id) {
                const ConsentSection = sequelize.models.consent_section;
                return ConsentSection.count({ where: { typeId: id } })
                    .then(count => {
                        if (count) {
                            return RRError.reject('consentTypeDeleteOnConsent');
                        } else {
                            return sequelize.transaction(function (tx) {
                                return ConsentType.destroy({ where: { id }, transaction: tx })
                                    .then(() => sequelize.models.consent_document.destroy({
                                        where: { typeId: id }
                                    }, { transaction: tx }));
                            });
                        }
                    });
            }
        }
    });

    return ConsentType;
};
