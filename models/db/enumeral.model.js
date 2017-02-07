'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('enumeral', {
        enumerationId: {
            type: DataTypes.INTEGER,
            field: 'enumeration_id',
            allowNull: false,
            references: {
                model: 'enumeration',
                key: 'id'
            }
        },
        code: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        line: {
            type: DataTypes.INTEGER
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
        indexes: [{ fields: ['enumeration_id'], where: { deleted_at: { $eq: null } } }],
        paranoid: true
    });
};
