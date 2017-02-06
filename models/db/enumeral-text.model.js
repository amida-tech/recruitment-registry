'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('enumeral_text', {
        enumeralId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'enumeral_id',
            references: {
                model: 'enumeral',
                key: 'id'
            }
        },
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: 'language',
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
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        indexes: [{ unique: true, fields: ['enumeral_id', 'language_code'], where: { deleted_at: { $eq: null } } }],
        paranoid: true
    });
};
