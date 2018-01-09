'use strict';

const Sequelize = require('sequelize');

const Op = Sequelize.Op;

module.exports = function Table(sequelize, DataTypes) {
    return sequelize.define('research_site_vicinity', {
        researchSiteId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'research_site_id',
            references: {
                model: {
                    schema: sequelize.options.schema,
                    tableName: 'research_site',
                },
                key: 'id',
            },
        },
        zip: {
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
        paranoid: true,
        indexes: [{ unique: true, fields: ['zip', 'research_site_id'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};
