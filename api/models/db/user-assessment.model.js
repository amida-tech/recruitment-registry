'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user_assessment', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'registry_user',
                key: 'id'
            }
        },
        assessmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'assessment_id',
            references: {
                model: 'assessment',
                key: 'id'
            }
        },
        meta: {
            type: DataTypes.JSON
        },
        sequence: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('scheduled', 'not-in-protocol', 'failed-to-collect', 'collected'),
            allowNull: false
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
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });
};
