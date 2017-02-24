'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('question_action_text', {
        questionActionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'question_action_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question_action'
                },
                key: 'id'
            }
        },
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'language'
                },
                key: 'code'
            }
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
    });
};
