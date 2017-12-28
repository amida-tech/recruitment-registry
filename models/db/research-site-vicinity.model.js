'use strict';

module.exports = function researchSiteVicinity(sequelize, Sequelize, schema) {
    const tableName = 'research_site_vicinity';
    const modelName = `${schema}_${tableName}`;
    const Op = Sequelize.Op;
    return sequelize.define(modelName, {
        researchSiteId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'research_site_id',
            references: {
                model: {
                    schema,
                    tableName: 'research_site',
                },
                key: 'id',
            },
        },
        zip: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        tableName,
        schema,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{ unique: true, fields: ['zip', 'research_site_id'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};
