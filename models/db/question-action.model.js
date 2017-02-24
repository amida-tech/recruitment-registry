'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('question_action', {
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id',
            allowNull: false,
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'question'
                },
                key: 'id'
            }
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        line: {
            type: DataTypes.INTEGER
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false
    });
};
