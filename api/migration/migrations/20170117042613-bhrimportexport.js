'use strict';

const bhrGapStaging = function (queryInterface, Sequelize) {
    return queryInterface.createTable('staging_bhr_gap', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: Sequelize.TEXT
        },
        assessmentName: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'assessment_name'
        },
        status: {
            type: Sequelize.TEXT
        },
        lineIndex: {
            type: Sequelize.INTEGER,
            field: 'line_index'
        },
        questionId: {
            type: Sequelize.INTEGER,
            field: 'question_id'
        },
        questionChoiceId: {
            type: Sequelize.INTEGER,
            field: 'question_choice_id'
        },
        multipleIndex: {
            type: Sequelize.INTEGER,
            field: 'multiple_index'
        },
        value: {
            type: Sequelize.TEXT
        },
        language: {
            type: Sequelize.TEXT,
            field: 'language_code'
        },
        lastAnswer: {
            type: Sequelize.BOOLEAN,
            field: 'last_answer'
        },
        daysAfterBaseline: {
            type: Sequelize.INTEGER,
            field: 'days_after_baseline'
        }
    }, {
        freezeTableName: true,
        timestamps: false,
        indexes: [{ fields: ['username', 'assessment_name', 'line_index'] }]
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        return bhrGapStaging(queryInterface, Sequelize)
            .then(() => queryInterface.addIndex('staging_bhr_gap', ['username', 'assessment_name', 'line_index'], {
                indexName: 'staging_bhr_gap_username_assessment_name_line_index'
            }));
    },

    down: function (queryInterface) {
        return queryInterface.dropTable('bhr-gap-staging');
    }
};
