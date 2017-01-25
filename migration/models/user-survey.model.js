'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user_survey', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'registry_user',
                key: 'id'
            }
        },
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('new', 'in-progress', 'completed'),
            allowNull: false
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
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true
    });
};
