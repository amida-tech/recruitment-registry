'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('survey_consent', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        consentId: {
            type: DataTypes.INTEGER,
            field: 'consent_id',
            references: {
                model: 'consent',
                key: 'id'
            }
        },
        consentTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_type_id',
            references: {
                model: 'consent_type',
                key: 'id'
            }
        },
        action: {
            type: DataTypes.ENUM('read', 'create'),
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
        paranoid: true,
        indexes: [{
            fields: ['survey_id']
        }]
    });
};
