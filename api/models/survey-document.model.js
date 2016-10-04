'use strict';

const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
    const SurveyDocument = sequelize.define('survey_document', {
        surveyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        documentTypeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'document_type_id',
            references: {
                model: 'document_type',
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
            createSurveyDocumentType: function ({ surveyId, documentTypeId, action }) {
                return SurveyDocument.create({ surveyId, documentTypeId, action })
                    .then(({ id }) => ({ id }));
            },
            deleteSurveyDocumentType: function (id) {
                return SurveyDocument.delete({ where: { id } });
            },
            listSurveyDocumentTypes: function ({ userId, surveyId, action }, tx) {
                const query = {
                    where: { surveyId, action },
                    raw: true,
                    attributes: ['documentTypeId']
                };
                if (tx) {
                    query.transaction = tx;
                }
                return sequelize.models.survey_document.findAll(query)
                    .then(result => _.map(result, 'documentTypeId'))
                    .then(docTypeIds => {
                        if (docTypeIds.length) {
                            return sequelize.models.registry_user.listDocuments(userId, docTypeIds, tx);
                        }
                    });
            }
        }
    });

    return SurveyDocument;
};
