'use strict';

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
            type: DataTypes.ENUM('read', 'write', 'edit'),
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
            getDocumentTypesBySurvey: function (surveyId) {
                return SurveyDocument.findAll({
                    where: { surveyId },
                    raw: true,
                    attributes: ['id', 'documentTypeId', 'action']
                });
            }
        }
    });

    return SurveyDocument;
};
