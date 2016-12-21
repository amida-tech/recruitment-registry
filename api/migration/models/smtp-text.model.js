'use strict';

module.exports = function (sequelize, DataTypes) {
    const SmtpText = sequelize.define('smtp_text', {
        language: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: 'language',
                key: 'code'
            }
        },
        subject: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true
    });

    return SmtpText;
};
