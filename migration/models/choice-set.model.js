'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('choice_set', {
        reference: {
            type: DataTypes.TEXT,
            allowNull: false,
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
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        indexes: [{ unique: true, fields: ['reference'], where: { deleted_at: { [Op.eq]: null } } }],
        paranoid: true,
    });
};
