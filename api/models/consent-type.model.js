'use strict';

module.exports = function (sequelize, DataTypes) {
    const ConsentType = sequelize.define('consent_type', {
        name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        title: {
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
            listConsentTypes: function () {
                return ConsentType.findAll({
                    raw: true,
                    attributes: ['id', 'name', 'title', 'type'],
                    order: 'name'
                });
            },
            createConsentType: function ({ name, title, type }) {
                return ConsentType.create({ name, title, type })
                    .then(({ id }) => ({ id }));
            },
            deleteConsentType: function (id) {
                return sequelize.transaction(function (tx) {
                    return ConsentType.destroy({ where: { id }, transaction: tx })
                        .then(() => sequelize.models.consent_document.destroy({
                            where: { typeId: id }
                        }, { transaction: tx }));
                });
            }
        }
    });

    return ConsentType;
};
