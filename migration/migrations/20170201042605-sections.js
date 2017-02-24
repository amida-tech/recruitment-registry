'use strict';

const surveySectionQuestion = function (queryInterface, Sequelize) {
    return queryInterface.createTable('survey_section_question', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        surveySectionId: {
            type: Sequelize.INTEGER,
            field: 'survey_section_id',
            allowNull: false,
            references: {
                model: 'survey_section',
                key: 'id'
            }
        },
        questionId: {
            type: Sequelize.INTEGER,
            field: 'question_id',
            allowNull: false,
            references: {
                model: 'question',
                key: 'id'
            }
        },
        line: {
            type: Sequelize.INTEGER,
            allowNull: false
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

const surveySectionText = function (queryInterface, Sequelize) {
    return queryInterface.createTable('survey_section_text', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        surveySectionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'survey_section_id',
            references: {
                model: 'survey_section',
                key: 'id'
            }
        },
        language: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'language_code',
            references: {
                model: 'language',
                key: 'code'
            }
        },
        name: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT
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
        paranoid: true
    });
};

const surveySectionType = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('survey_section', 'type', {
        type: Sequelize.ENUM('question', 'section'),
        allowNull: false
    });
};

const surveySectionParentId = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('survey_section', 'parent_id', {
        type: Sequelize.INTEGER,
        field: 'parent_id',
        references: {
            model: 'survey_section',
            key: 'id'
        }
    });
};

const surveySectionParentQuestionId = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('survey_section', 'parent_question_id', {
        type: Sequelize.INTEGER,
        field: 'parent_question_id',
        references: {
            model: 'question',
            key: 'id'
        }
    });
};

const surveySectionLine = function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('survey_section', 'line', {
        type: Sequelize.INTEGER,
        allowNull: false
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        //const sequelize = queryInterface.sequelize;
        return surveySectionQuestion(queryInterface, Sequelize)
            .then(() => surveySectionText(queryInterface, Sequelize))
            .then(() => queryInterface.removeColumn('survey_section', 'section_id'))
            .then(() => queryInterface.dropTable('section_text'))
            .then(() => queryInterface.dropTable('rr_section'))
            .then(() => surveySectionParentId(queryInterface, Sequelize))
            .then(() => surveySectionParentQuestionId(queryInterface, Sequelize))
            .then(() => surveySectionLine(queryInterface, Sequelize))
            .then(() => surveySectionType(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('survey_section_question', ['survey_section_id'], {
                indexName: 'survey_section_question_survey_section_id'
            }))
            .then(() => queryInterface.addIndex('survey_section', ['survey_id'], {
                where: { deleted_at: { $eq: null } },
                indexName: 'survey_section_survey_id'
            }));
    },

    down: function () {
        //const sequelize = queryInterface.sequelize;
        //return queryInterface.renameTable('survey_section_text', 'section_text')
        //  .then(() => queryInterface.dropTable('survey_section_question'));
    }
};
