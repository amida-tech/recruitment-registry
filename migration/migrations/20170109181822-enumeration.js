'use strict';

const enumeration = function (queryInterface, Sequelize) {
    return queryInterface.createTable('enumeration', {
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

const enumeral = function (queryInterface, Sequelize) {
    return queryInterface.createTable('enumeral', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        enumerationId: {
            type: Sequelize.INTEGER,
            field: 'enumeration_id',
            allowNull: false,
            references: {
                model: 'enumeration',
                key: 'id'
            }
        },
        code: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        line: {
            type: Sequelize.INTEGER
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
        indexes: [{ fields: ['enumeration_id'] }],
        paranoid: true
    });
};

const enumeralText = function (queryInterface, Sequelize) {
    return queryInterface.createTable('enumeral_text', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        enumeralId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'enumeral_id',
            references: {
                model: 'enumeral',
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
        text: {
            type: Sequelize.TEXT,
            allowNull: false
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
        indexes: [{ unique: true, fields: ['enumeral_id', 'language_code'], where: { deleted_at: { $eq: null } } }],
        paranoid: true
    });
};

const questionEnum = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question', 'enumeration_id', {
        field: 'enumeration_id',
        type: Sequelize.INTEGER
    });
};

const questionChoiceCodeColumn = function (queryInterface, Sequelize) {
    return queryInterface.addColumn('question_choice', 'code', {
        field: 'code',
        type: Sequelize.TEXT
    });
};

module.exports = {
    up: function (queryInterface, Sequelize) {
        const sequelize = queryInterface.sequelize;
        return enumeration(queryInterface, Sequelize)
            .then(() => enumeral(queryInterface, Sequelize))
            .then(() => enumeralText(queryInterface, Sequelize))
            .then(() => questionEnum(queryInterface, Sequelize))
            .then(() => questionChoiceCodeColumn(queryInterface, Sequelize))
            .then(() => queryInterface.addIndex('enumeration', ['reference'], {
                where: { deleted_at: { $eq: null } },
                indexName: 'enumeration_reference',
                indicesType: 'UNIQUE'
            }))
            .then(() => queryInterface.addIndex('enumeral', ['enumeration_id'], {
                where: { deleted_at: { $eq: null } },
                indexName: 'enumeral_enumeration_id'
            }))
            .then(() => queryInterface.addIndex('enumeral_text', ['enumeral_id', 'language_code'], {
                where: { deleted_at: { $eq: null } },
                indexName: 'enumeral_text_enumeral_id_language_code',
                indicesType: 'UNIQUE'
            }))
            .then(() => sequelize.query('INSERT INTO question_type (name) VALUES (\'enumeration\')'));
    },

    down: function (queryInterface) {
        const sequelize = queryInterface.sequelize;
        return queryInterface.removeColumn('question', 'enumeration_id')
            .then(() => queryInterface.removeColumn('question_choice', 'code'))
            .then(() => queryInterface.dropTable('enumeration'))
            .then(() => queryInterface.dropTable('enumeral_text'))
            .then(() => queryInterface.dropTable('enumeral'))
            .then(() => sequelize.query('DELETE FROM question_type WHERE name = \'enumeration\''));

    }
};
