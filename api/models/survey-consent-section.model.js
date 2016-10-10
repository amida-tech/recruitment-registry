'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const SurveyConsentSection = sequelize.define('survey_consent_section', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        consentSectionTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'consent_section_type_id',
            references: {
                model: 'consent_section_type',
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
            createSurveyConsentSectionType: function ({ surveyId, consentSectionTypeId, action }) {
                return SurveyConsentSection.create({ surveyId, consentSectionTypeId, action })
                    .then(({ id }) => ({ id }));
            },
            deleteSurveyConsentSectionType: function (id) {
                return SurveyConsentSection.delete({ where: { id } });
            },
            listSurveyConsentSectionTypes: function ({ userId, surveyId, action }, tx) {
                const query = {
                    where: { surveyId, action },
                    raw: true,
                    attributes: ['consentSectionTypeId']
                };
                if (tx) {
                    query.transaction = tx;
                }
                return sequelize.models.survey_consent_section.findAll(query)
                    .then(result => _.map(result, 'consentSectionTypeId'))
                    .then(docTypeIds => {
                        if (docTypeIds.length) {
                            return sequelize.models.registry_user.listConsentSections(userId, docTypeIds, tx);
                        }
                    });
            }
        }
    });

    return SurveyConsentSection;
};
