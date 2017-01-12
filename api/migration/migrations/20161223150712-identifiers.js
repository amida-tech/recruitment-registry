'use strict';

const questionIdentifier = function (queryInterface, Sequelize) {
    return queryInterface.createTable('question_identifier', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        identifier: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        questionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: 'question',
                key: 'id'
            }
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [{ fields: ['question_id'] }]
    });
};

const answerIdentifier = function (queryInterface, Sequelize) {
    return queryInterface.createTable('answer_identifier', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        identifier: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        questionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'question_id',
            references: {
                model: 'question',
                key: 'id'
            }
        },
        questionChoiceId: {
            type: Sequelize.INTEGER,
            field: 'question_choice_id',
            references: {
                model: 'question_choice',
                key: 'id'
            }
        },
        multipleIndex: {
            type: Sequelize.INTEGER,
            field: 'multiple_index'
        },
        tag: {
            type: Sequelize.INTEGER
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [{ fields: ['question_id', 'question_choice_id'] }]
    });
};

const surveyIdentifier = function (queryInterface, Sequelize) {
    return queryInterface.createTable('survey_identifier', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        identifier: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        surveyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'survey_id',
            references: {
                model: 'survey',
                key: 'id'
            }
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [{ fields: ['survey_id'] }]
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        return questionIdentifier(queryInterface, Sequelize)
            .then(() => queryInterface.addIndex('question_identifier', ['type', 'identifier'], {
                indexName: 'question_identifier_type_identifier_key',
                indicesType: 'UNIQUE'
            }))
            .then(() => queryInterface.addIndex('question_identifier', ['question_id'], {
                indexName: 'question_identifier_question_id'
            }))
            .then(() => surveyIdentifier(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('survey_identifier', ['type', 'identifier'], {
                indexName: 'survey_identifier_type_identifier_key',
                indicesType: 'UNIQUE'
            }))
            .then(() => queryInterface.addIndex('survey_identifier', ['survey_id'], {
                indexName: 'survey_identifier_survey_id'
            }))
            .then(() => answerIdentifier(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('answer_identifier', ['type', 'identifier'], {
                indexName: 'answer_identifier_type_identifier_key',
                indicesType: 'UNIQUE'
            }))
            .then(() => queryInterface.addIndex('answer_identifier', ['question_id', 'question_choice_id'], {
                indexName: 'answer_identifier_question_id_question_choice_id'
            }));
    },
    down: function (queryInterface) {
        return queryInterface.dropTable('answer_identifier')
            .then(() => queryInterface.dropTable('question_identifier'))
            .then(() => queryInterface.dropTable('survey_identifier'));
    }
};
