'use strict';

const assessmentStageColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('assessment', 'stage', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
    });
};

const assessmentGroupColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('assessment', 'group', {
        type: Sequelize.TEXT,
    });
};

const answerAssessmentIdColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('answer', 'assessment_id', {
        type: Sequelize.INTEGER,
        references: {
            model: {
                tableName: 'assessment',
            },
            key: 'id',
        },
    });
};

const assessmentAnswer = function (queryInterface, Sequelize) {
    const Op = Sequelize.Op;
    return queryInterface.createTable('assessment_answer', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        assessmentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'assessment_id',
            references: {
                model: {
                    tableName: 'assessment',
                },
                key: 'id',
            },
        },
        status: {
            type: Sequelize.ENUM('new', 'in-progress', 'completed'),
            allowNull: false,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{ unique: true, fields: ['name'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        const Op = Sequelize.Op;
        return queryInterface.sequelize.query('ALTER TABLE assessment DROP CONSTRAINT assessment_name_key')
            .then(() => queryInterface.removeColumn('assessment', 'sequence_type'))
            .then(() => queryInterface.removeColumn('assessment', 'updated_at'))
            .then(() => queryInterface.removeColumn('assessment_survey', 'lookback'))
            .then(() => assessmentStageColumn(queryInterface, Sequelize))
            .then(() => assessmentGroupColumn(queryInterface, Sequelize))
            .then(() => answerAssessmentIdColumn(queryInterface, Sequelize))
            .then(() => queryInterface.renameColumn('user_assessment', 'sequence', 'version'))
            .then(() => queryInterface.addIndex('assessment', ['group'], {
                indexName: 'assessment_group',
                where: { deleted_at: { [Op.eq]: null } },
            }))
            .then(() => queryInterface.addIndex('assessment_survey', ['assessment_id'], {
                indexName: 'assessment_survey_assessment_id',
                where: { deleted_at: { [Op.eq]: null } },
            }))
            .then(() => queryInterface.addIndex('answer', ['assessment_id'], {
                indexName: 'answer_assessment_id',
                where: { deleted_at: { [Op.eq]: null } },
            }))
            .then(() => queryInterface.addIndex('answer', ['user_id'], {
                indexName: 'answer_user_id',
                where: { deleted_at: { [Op.eq]: null } },
            }))
            .then(() => assessmentAnswer(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('assessment_answer', ['assessment_id'], {
                indexName: 'assessment_answer_assessment_id',
                unique: true,
                where: { deleted_at: { [Op.eq]: null } },
            }));
    },

    //down: function (queryInterface, Sequelize) {
    //},
};
