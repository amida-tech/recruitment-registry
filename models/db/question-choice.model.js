'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('question_choice', {
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id',
            references: {
                model: 'question',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.TEXT,
            allowNull: false,
            references: {
                model: 'answer_type',
                key: 'name'
            }
        },
        code: {
            type: DataTypes.TEXT
        },
        meta: {
            type: DataTypes.JSON
        },
        line: {
            type: DataTypes.INTEGER
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
        enumerationId: {
            type: DataTypes.INTEGER,
            field: 'enumeration_id',
            references: {
                model: 'enumeration',
                key: 'id'
            }
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        indexes: [{
            fields: ['question_id'],
            where: { deleted_at: { $eq: null } }
        }, {
            fields: ['enumeration_id'],
            where: { deleted_at: { $eq: null } }
        }],
        paranoid: true
    });
};
