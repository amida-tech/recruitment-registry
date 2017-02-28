'use strict';

const researchSite = function (queryInterface, Sequelize) {
    return queryInterface.createTable('research_site', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        url: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        city: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        state: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        zip: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at'
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });
};

const researchSiteVicinity = function (queryInterface, Sequelize) {
    return queryInterface.createTable('research_site_vicinity', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        researchSiteId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'research_site_id',
            references: {
                model: {
                    tableName: 'research_site'
                },
                key: 'id'
            }
        },
        zip: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at'
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{ unique: true, fields: ['zip', 'research_site_id'], where: { deleted_at: { $eq: null } } }]
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        return researchSite(queryInterface, Sequelize)
            .then(() => researchSiteVicinity(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('research_site_vicinity', ['zip', 'research_site_id'], {
                indexName: 'research_site_vicinity_zip_research_site_id',
                where: { deleted_at: { $eq: null } },
                indicesType: 'UNIQUE'
            }));
    },
    down(queryInterface) {
        return queryInterface.dropTable('research_site')
            .then(() => queryInterface.dropTable('research_site_vicinity'));
    }
};
