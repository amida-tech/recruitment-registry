'use strict';

module.exports = function (sequelize, DataTypes) {
    const ConsentSection = sequelize.define('consent_section', {
        consentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_id',
            references: {
                model: 'consent',
                key: 'id'
            }
        },
        typeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'type_id',
            references: {
                model: 'consent_type',
                key: 'id'
            }
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
        deletedAt: 'deletedAt',
        paranoid: true
    });

    return ConsentSection;
};
