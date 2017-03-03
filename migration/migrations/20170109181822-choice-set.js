'use strict';

const choiceSet = function (queryInterface, Sequelize) {
    return queryInterface.createTable('choice_set', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        reference: {
            type: Sequelize.TEXT,
            allowNull: false
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
        indexes: [{ unique: true, fields: ['reference'], where: { deleted_at: { $eq: null } } }],
        paranoid: true
    });
};

const questionEnum = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'choice_set_id', {
        field: 'choice_set_id',
        type: Sequelize.INTEGER
    });
};

const questionChoiceCodeColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question_choice', 'code', {
        field: 'code',
        type: Sequelize.TEXT
    });
};

const questionChoiceChoiceSetIdColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question_choice', 'choice_set_id', {
        type: Sequelize.INTEGER,
        field: 'choice_set_id',
        references: {
            model: 'choice_set',
            key: 'id'
        }
    });
};

const questionChoiceDeletedAtColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question_choice', 'deleted_at', {
        type: Sequelize.DATE,
        field: 'deleted_at',
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        const sequelize = queryInterface.sequelize;
        return choiceSet(queryInterface, Sequelize)
            .then(() => questionEnum(queryInterface, Sequelize))
            .then(() => questionChoiceCodeColumn(queryInterface, Sequelize))
            .then(() => questionChoiceChoiceSetIdColumn(queryInterface, Sequelize))
            .then(() => questionChoiceDeletedAtColumn(queryInterface, Sequelize))
            .then(() => queryInterface.sequelize.query('ALTER TABLE question_choice ALTER COLUMN question_id DROP NOT NULL'))
            .then(() => queryInterface.addIndex('choice_set', ['reference'], {
                where: { deleted_at: { $eq: null } },
                indexName: 'choice_set_reference',
                indicesType: 'UNIQUE'
            }))
            .then(() => queryInterface.addIndex('question_choice', ['question_id'], {
                where: { deleted_at: { $eq: null } },
                indexName: 'question_choice_question_id'
            }))
            .then(() => queryInterface.addIndex('question_choice', ['choice_set_id'], {
                where: { deleted_at: { $eq: null } },
                indexName: 'question_choice_choice_set_id'
            }))
            .then(() => sequelize.query('INSERT INTO question_type (name) VALUES (\'choice-ref\')'))
            .then(() => queryInterface.sequelize.query('ALTER TABLE question ADD CONSTRAINT question_choice_set_id_fkey FOREIGN KEY (choice_set_id) REFERENCES choice_set'));
    },

    down: function (queryInterface) {
        const sequelize = queryInterface.sequelize;
        return queryInterface.removeColumn('question', 'choice_set_id')
            .then(() => queryInterface.removeColumn('question_choice', 'deleted_at'))
            .then(() => queryInterface.removeColumn('question_choice', 'choice_set_id'))
            .then(() => queryInterface.removeColumn('question_choice', 'code'))
            .then(() => queryInterface.dropTable('choice_set'))
            .then(() => sequelize.query('DELETE FROM question_type WHERE name = \'choice-ref\''));

    }
};
