'use strict';

module.exports = function (sequelize, DataTypes) {
    const ConsentSectionType = sequelize.define('consent_section_type', {
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
            listConsentSectionTypes: function () {
                return ConsentSectionType.findAll({
                    raw: true,
                    attributes: ['id', 'name', 'title', 'type'],
                    order: 'name'
                });
            },
            createConsentSectionType: function ({ name, title, type }) {
                return ConsentSectionType.create({ name, title, type })
                    .then(({ id }) => ({ id }));
            },
            deleteConsentSectionType: function (id) {
                return sequelize.transaction(function (tx) {
                    return ConsentSectionType.destroy({ where: { id }, transaction: tx })
                        .then(() => sequelize.models.consent_section.destroy({
                            where: { typeId: id }
                        }, { transaction: tx }));
                });
            }
        }
    });

    return ConsentSectionType;
};
