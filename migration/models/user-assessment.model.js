'use strict';

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('user_assessment', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'registry_user',
                },
                key: 'id',
            },
        },
        assessmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'assessment_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'assessment',
                },
                key: 'id',
            },
        },
        meta: {
            type: DataTypes.JSON,
        },
        sequence: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('scheduled', 'not-in-protocol', 'failed-to-collect', 'collected', 'started', 'refused', 'no-status', 'technical-difficulties', 'unable-to-perform'),
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [
            { fields: ['assessment_id'] },
            { fields: ['user_id'] },
        ],
    });
};
