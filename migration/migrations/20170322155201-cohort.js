'use strict';

const filter = function (queryInterface, Sequelize) {
    const Op = Sequelize.Op;
    return queryInterface.createTable('filter', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: Sequelize.TEXT,
            allowNull: false,
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
        paranoid: true,
        indexes: [{ unique: true, fields: ['name'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};

const filterAnswer = function (queryInterface, Sequelize) {
    const Op = Sequelize.Op;
    return queryInterface.createTable('filter_answer', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        filterId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'filter_id',
            references: {
                model: {
                    tableName: 'filter',
                },
                key: 'id',
            },
        },
        questionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'question_id',
            onUpdate: 'CASCADE',
            references: {
                model: {
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        exclude: {
            type: Sequelize.BOOLEAN,
        },
        questionChoiceId: {
            type: Sequelize.INTEGER,
            field: 'question_choice_id',
            onUpdate: 'CASCADE',
            references: {
                model: {
                    tableName: 'question_choice',
                },
                key: 'id',
            },
        },
        value: {
            type: Sequelize.TEXT,
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
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{ fields: ['filter_id'], where: { deleted_at: { [Op.eq]: null } } }],
    });
};

const cohort = function (queryInterface, Sequelize) {
    return queryInterface.createTable('cohort', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        filterId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'filter_id',
            references: {
                model: {
                    tableName: 'filter',
                },
                key: 'id',
            },
        },
        name: {
            type: Sequelize.TEXT,
        },
        count: {
            type: Sequelize.INTEGER,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
        deletedAt: {
            type: Sequelize.DATE,
            field: 'deleted_at',
        },
        federated: {
            type: Sequelize.BOOLEAN,
        },
        local: {
            type: Sequelize.BOOLEAN,
        },
    }, {
        freezeTableName: true,
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: 'deletedAt',
        paranoid: true,
    });
};

const cohortAnswer = function (queryInterface, Sequelize) {
    return queryInterface.createTable('cohort_answer', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        cohortId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'cohort_id',
            references: {
                model: {
                    tableName: 'cohort',
                },
                key: 'id',
            },
        },
        questionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'question_id',
            onUpdate: 'CASCADE',
            references: {
                model: {
                    tableName: 'question',
                },
                key: 'id',
            },
        },
        exclude: {
            type: Sequelize.BOOLEAN,
        },
        questionChoiceId: {
            type: Sequelize.INTEGER,
            field: 'question_choice_id',
            onUpdate: 'CASCADE',
            references: {
                model: {
                    tableName: 'question_choice',
                },
                key: 'id',
            },
        },
        value: {
            type: Sequelize.TEXT,
        },
        createdAt: {
            type: Sequelize.DATE,
            field: 'created_at',
        },
    }, {
        freezeTableName: true,
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false,
        deletedAt: false,
        indexes: [{ fields: ['cohort_id'] }],
    });
};

const questionCommon = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'common', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        field: 'common',
    });
};

module.exports = {
    up(queryInterface, Sequelize) {
        const Op = Sequelize.Op;
        return filter(queryInterface, Sequelize)
            .then(() => queryInterface.addIndex('filter', ['name'], {
                indexName: 'filter_name',
                unique: true,
                where: { deleted_at: { [Op.eq]: null } },
            }))
            .then(() => filterAnswer(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('filter_answer', ['filter_id'], {
                indexName: 'filter_answer_filter_id',
                where: { deleted_at: { [Op.eq]: null } },
            }))
            .then(() => cohort(queryInterface, Sequelize))
            .then(() => cohortAnswer(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('cohort_answer', ['cohort_id'], {
                indexName: 'cohort_answer_cohort_id',
            }))
            .then(() => questionCommon(queryInterface, Sequelize));
    },

    // down(queryInterface) {
    //     return queryInterface.dropTable('cohort')
    //       .then(() => queryInterface.dropTable('filter_answer'))
    //       .then(() => queryInterface.dropTable('filter'))
    //       .then(() => queryInterface.dropColumn('question', 'common'));
    // },
};
