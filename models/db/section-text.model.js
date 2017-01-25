'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('section_text', {
        sectionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'section_id',
            references: {
                model: 'rr_section',
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
        name: {
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
        paranoid: true
    });
};
