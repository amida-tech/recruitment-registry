'use strict';

module.exports = function consentSection(sequelize, Sequelize, schema) {
    return sequelize.define('consent_section', {
        consentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'consent_id',
            references: {
                model: {
                    schema,
                    tableName: 'consent',
                },
                key: 'id',
            },
        },
        typeId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'type_id',
            references: {
                model: {
                    schema,
                    tableName: 'consent_type',
                },
                key: 'id',
            },
        },
        line: {
            type: Sequelize.INTEGER,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
