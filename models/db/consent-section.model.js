'use strict';

module.exports = function consentSection(sequelize, Sequelize, schema) {
    const tableName = 'consent_section';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
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
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
