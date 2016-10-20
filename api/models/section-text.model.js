'use strict';

module.exports = function (sequelize, DataTypes) {
    const SectionText = sequelize.define('section_text', {
        sectionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            fieldName: 'section_id',
            references: {
                model: 'section',
                key: 'id'
            }
        },
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            fieldName: 'language_code',
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
        deletedAt: 'deletedAt',
        paranoid: true
    });

    return SectionText;
};
