'use strict';

const answerRuleValue = function (queryInterface, Sequelize) {
    return queryInterface.createTable('answer_rule_value', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ruleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'answer_rule_id',
            references: {
                model: 'answer_rule',
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
        value: {
            type: Sequelize.TEXT
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true
    });
};

const answerRuleLogic = function (queryInterface, Sequelize) {
    return queryInterface.createTable('answer_rule_logic', {
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
            primaryKey: true
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false
    });
};

const answerRule = function (queryInterface, Sequelize) {
    return queryInterface.createTable('answer_rule', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        logic: {
            type: Sequelize.TEXT,
            allowNull: false,
            references: {
                model: 'answer_rule_logic',
                key: 'name'
            }
        },
        questionId: {
            type: Sequelize.INTEGER,
            field: 'question_id',
            references: {
                model: 'question',
                key: 'id'
            }
        },
        answerQuestionId: {
            type: Sequelize.INTEGER,
            field: 'answer_question_id',
            references: {
                model: 'question',
                key: 'id'
            }
        },
        skipCount: {
            type: Sequelize.INTEGER,
            field: 'skip_count'
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{ fields: ['survey_id'], where: { deleted_at: { $eq: null } } }]
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        const sequelize = queryInterface.sequelize;
        return answerRuleLogic(queryInterface, Sequelize)
            .then(() => answerRule(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('answer_rule', ['survey_id'], {
                where: { deleted_at: { $eq: null } },
                indexName: 'answer_rule_survey_id'
            })).then(() => answerRuleValue(queryInterface, Sequelize))
            .then(() => sequelize.query('INSERT INTO answer_rule_logic (name) VALUES (\'equals\')'))
            .then(() => sequelize.query('INSERT INTO answer_rule_logic (name) VALUES (\'exists\')'))
            .then(() => sequelize.query('INSERT INTO answer_rule_logic (name) VALUES (\'not-equals\')'))
            .then(() => sequelize.query('INSERT INTO answer_rule_logic (name) VALUES (\'not-exists\')'))
            .then(() => sequelize.query('INSERT INTO answer_rule_logic (name) VALUES (\'not-selected\')'))
            .then(() => sequelize.query('INSERT INTO answer_rule_logic (name) VALUES (\'each-not-selected\')'));
    },
    down: function (queryInterface) {
        return queryInterface.dropTable('answer_rule_value')
            .then(() => queryInterface.dropTable('answer_rule'))
            .then(() => queryInterface.dropTable('answer_rule_logic'));
    }
};
