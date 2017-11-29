'use strict';

module.exports = function userAssessment(sequelize, Sequelize, schema) {
    const tableName = 'user_assessment';
    const modelName = `${schema}_${tableName}`;
    return sequelize.define(modelName, {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: {
                    schema,
                    tableName: 'registry_user',
                },
                key: 'id',
            },
        },
        assessmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'assessment_id',
            references: {
                model: {
                    schema,
                    tableName: 'assessment',
                },
                key: 'id',
            },
        },
        meta: {
            type: Sequelize.JSON,
        },
        version: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        status: {
            type: Sequelize.ENUM('scheduled', 'not-in-protocol', 'failed-to-collect', 'collected', 'started', 'refused', 'no-status', 'technical-difficulties', 'unable-to-perform'),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
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
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [
            { fields: ['assessment_id'] },
            { fields: ['user_id'] },
        ],
    });
};
