'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const SurveyConsentType = sequelize.define('survey_consent_type', {
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
            allowNull: false,
            field: 'consent_type_id',
            references: {
                model: 'consent_type',
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
        deletedAt: 'deletedAt',
        paranoid: true,
        classMethods: {
            createSurveyConsentType({ surveyId, consentTypeId, action }) {
                return SurveyConsentType.create({ surveyId, consentTypeId, action })
                    .then(({ id }) => ({ id }));
            },
            deleteSurveyConsentType(id) {
                return SurveyConsentType.destroy({ where: { id } });
            },
            listSurveyConsentTypes({ userId, surveyId, action }, tx) {
                const query = {
                    where: { surveyId, action },
                    raw: true,
                    attributes: ['consentTypeId']
                };
                if (tx) {
                    query.transaction = tx;
                }
                return sequelize.models.survey_consent_type.findAll(query)
                    .then(result => _.map(result, 'consentTypeId'))
                    .then(typeIds => {
                        if (typeIds.length) {
                            const options = { typeIds, transaction: tx };
                            return sequelize.models.registry_user.listConsentDocuments(userId, options);
                        }
                    });
            }
        }
    });

    return SurveyConsentType;
};
