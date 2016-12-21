'use strict';

const assessment = function (queryInterface, Sequelize) {
    return queryInterface.createTable('assessment', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        sequenceType: {
            type: Sequelize.ENUM('ondemand', 'biyearly'),
            allowNull: false
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'cupdated_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at'
        }
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });
};

const assessmentSurvey = function (queryInterface, Sequelize) {
    return queryInterface.createTable('assessment_survey', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        assessmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'assessment_id',
            references: {
                model: 'assessment',
                key: 'id'
            }
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
        lookback: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
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
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });
};

const userAssessment = function (queryInterface, Sequelize) {
    return queryInterface.createTable('user_assessment', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'registry_user',
                key: 'id'
            }
        },
        assessmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'assessment_id',
            references: {
                model: 'assessment',
                key: 'id'
            }
        },
        sequence: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('scheduled', 'not-in-protocol', 'failed-to-collect', 'collected'),
            allowNull: false
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true
    });
};

const userAssessmentAnswer = function (queryInterface, Sequelize) {
    return queryInterface.createTable('user_assessment_answer', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        answerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'answer_id',
            references: {
                model: 'answer',
                key: 'id'
            }
        },
        userAssessmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_assessment_id',
            references: {
                model: 'user_assessment',
                key: 'id'
            }
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

module.exports = {
    up: function (queryInterface, Sequelize) {
        return assessment(queryInterface, Sequelize)
            .then(() => assessmentSurvey(queryInterface, Sequelize))
            .then(() => userAssessment(queryInterface, Sequelize))
            .then(() => userAssessmentAnswer(queryInterface, Sequelize));
    },

    down: function (queryInterface) {
        return queryInterface.dropTable('user_assessment_answer')
            .then(() => queryInterface.dropTable('user_assessment'))
            .then(() => queryInterface.dropTable('assessment_survey'))
            .then(() => queryInterface.dropTable('assessment'));
    }
};
