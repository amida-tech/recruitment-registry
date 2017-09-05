'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('consent_section', {
        consentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'consent',
                },
                key: 'id',
            },
        },
        typeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'type_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'consent_type',
                },
                key: 'id',
            },
        },
        line: {
            type: DataTypes.INTEGER,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};
