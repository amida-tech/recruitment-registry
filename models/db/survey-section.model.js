'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('survey_section', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('question', 'section'),
            allowNull: false
        },
        parentId: {
            type: DataTypes.INTEGER,
            field: 'parent_id',
            references: {
                model: 'survey_section',
                key: 'id'
            }
        },
        line: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        indexes: [{ fields: ['survey_id'], where: { deleted_at: { $eq: null } } }],
        paranoid: true
    });
};
