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
        consentTypeId: {
            type: DataTypes.INTEGER,
            field: 'consent_type_id',
            references: {
                model: 'consent_type',
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
        action: {
            type: DataTypes.ENUM('read', 'create', 'edit'),
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
        }],
        hooks: {
            afterSync(options) {
                if (options.force) {
                    const query = 'ALTER TABLE survey_consent ADD CONSTRAINT survey_consent_check CHECK (consent_id IS NOT NULL OR consent_type_id IS NOT NULL)';
                    return sequelize.query(query);
                }
            }
        }
    });
};
